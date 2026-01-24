package main

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"

	anthropic "github.com/anthropics/anthropic-sdk-go"
	"github.com/bmatcuk/doublestar/v4"
)

type agentMessage struct {
	role        string
	content     string
	toolResults []toolResult
}

type toolCall struct {
	id        string
	name      string
	arguments map[string]any
}

type toolResult struct {
	id      string
	content string
	isError bool
}

type toolFunc func(ctx context.Context, cwd string, args map[string]any) (string, error)

type toolDef struct {
	name        string
	description string
	params      string
	fn          toolFunc
}

const defaultMaxIters = 20
const maxFileBytes = 200_000

var toolBlockRe = regexp.MustCompile("```tool\\s*([\\s\\S]*?)```")

func main() {
	modelFlag := flag.String("model", "", "Anthropic model")
	maxItersFlag := flag.Int("max-iters", defaultMaxIters, "Maximum tool loop iterations")
	cwdFlag := flag.String("cwd", "", "Working directory")
	flag.Parse()

	cwd := *cwdFlag
	if cwd == "" {
		wd, err := os.Getwd()
		if err != nil {
			fmt.Fprintln(os.Stderr, "failed to get cwd:", err)
			os.Exit(1)
		}
		cwd = wd
	}

	input, err := readAll(os.Stdin)
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to read stdin:", err)
		os.Exit(1)
	}
	task := strings.TrimSpace(input)
	if task == "" {
		fmt.Fprintln(os.Stderr, "no task provided on stdin")
		os.Exit(1)
	}

	model := *modelFlag
	if model == "" {
		model = os.Getenv("PUZLDAI_MODEL")
	}
	if model == "" {
		model = "claude-3-5-sonnet-latest"
	}

	client := anthropic.NewClient()
	tools := defaultTools()
	systemPrompt := buildSystemPrompt(cwd, tools)

	messages := []agentMessage{{role: "user", content: task}}

	ctx := context.Background()
	start := time.Now()
	var last string

	for iter := 0; iter < *maxItersFlag; iter++ {
		prompt := buildPrompt(systemPrompt, messages)

		msg, err := client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:     anthropic.Model(model),
			MaxTokens: int64(2048),
			Messages: []anthropic.MessageParam{{
				Role: anthropic.MessageParamRoleUser,
				Content: []anthropic.ContentBlockParamUnion{{
					OfText: &anthropic.TextBlockParam{Text: prompt},
				}},
			}},
		})
		if err != nil {
			fmt.Fprintln(os.Stderr, "anthropic error:", err)
			os.Exit(1)
		}

		text := renderMessageText(msg)
		last = text

		toolCalls := parseToolCalls(text)
		if len(toolCalls) == 0 {
			fmt.Fprintln(os.Stdout, text)
			return
		}

		messages = append(messages, agentMessage{role: "assistant", content: text})

		results := runTools(ctx, cwd, tools, toolCalls)
		messages = append(messages, agentMessage{role: "tool", toolResults: results})
	}

	elapsed := time.Since(start)
	fmt.Fprintf(os.Stderr, "max iterations reached after %s\n", elapsed.Round(time.Millisecond))
	fmt.Fprintln(os.Stdout, last)
}

func readAll(r io.Reader) (string, error) {
	var sb strings.Builder
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		sb.WriteString(scanner.Text())
		sb.WriteByte('\n')
	}
	if err := scanner.Err(); err != nil {
		return "", err
	}
	return sb.String(), nil
}

func renderMessageText(msg *anthropic.Message) string {
	if msg == nil {
		return ""
	}
	var sb strings.Builder
	for _, block := range msg.Content {
		if block.Type == "text" {
			sb.WriteString(block.Text)
		}
	}
	return sb.String()
}

func buildSystemPrompt(cwd string, tools []toolDef) string {
	var sb strings.Builder
	sb.WriteString("You are a helpful assistant with access to coding tools.\n\n")
	sb.WriteString("Rules:\n")
	sb.WriteString("- Use tools via ```tool blocks with JSON.\n")
	sb.WriteString("- Use view to read files before editing.\n")
	sb.WriteString("- Use edit or write to modify files.\n\n")

	sb.WriteString("# Available Tools\n\n")
	for _, tool := range tools {
		sb.WriteString("## ")
		sb.WriteString(tool.name)
		sb.WriteString("\n")
		sb.WriteString(tool.description)
		sb.WriteString("\n\nParameters:\n")
		sb.WriteString(tool.params)
		sb.WriteString("\n\n---\n\n")
	}

	sb.WriteString("# How to Invoke Tools\n\n")
	sb.WriteString("```tool\n")
	sb.WriteString("{\"name\": \"view\", \"arguments\": {\"path\": \"README.md\"}}\n")
	sb.WriteString("```\n")

	return sb.String()
}

func buildPrompt(systemPrompt string, messages []agentMessage) string {
	var sb strings.Builder
	sb.WriteString(systemPrompt)
	sb.WriteString("\n\n---\n\n")

	for _, msg := range messages {
		switch msg.role {
		case "user":
			sb.WriteString("User: ")
			sb.WriteString(msg.content)
			sb.WriteString("\n\n")
		case "assistant":
			sb.WriteString("Assistant: ")
			sb.WriteString(msg.content)
			sb.WriteString("\n\n")
		case "tool":
			sb.WriteString("Tool Results:\n")
			for _, result := range msg.toolResults {
				status := "SUCCESS"
				if result.isError {
					status = "ERROR"
				}
				sb.WriteString("[")
				sb.WriteString(status)
				sb.WriteString("] ")
				sb.WriteString(result.id)
				sb.WriteString(":\n")
				sb.WriteString(result.content)
				sb.WriteString("\n\n")
			}
		}
	}

	sb.WriteString("Assistant: ")
	return sb.String()
}

func parseToolCalls(content string) []toolCall {
	matches := toolBlockRe.FindAllStringSubmatch(content, -1)
	if len(matches) == 0 {
		return nil
	}

	calls := make([]toolCall, 0, len(matches))
	for _, match := range matches {
		raw := strings.TrimSpace(match[1])
		var payload struct {
			Name      string         `json:"name"`
			Arguments map[string]any `json:"arguments"`
		}
		if err := json.Unmarshal([]byte(raw), &payload); err != nil {
			continue
		}
		if payload.Name == "" {
			continue
		}
		calls = append(calls, toolCall{
			id:        fmt.Sprintf("call_%d", time.Now().UnixNano()),
			name:      payload.Name,
			arguments: payload.Arguments,
		})
	}

	return calls
}

func runTools(ctx context.Context, cwd string, tools []toolDef, calls []toolCall) []toolResult {
	results := make([]toolResult, 0, len(calls))
	for _, call := range calls {
		def, ok := findTool(tools, call.name)
		if !ok {
			results = append(results, toolResult{id: call.id, content: "Unknown tool: " + call.name, isError: true})
			continue
		}
		output, err := def.fn(ctx, cwd, call.arguments)
		if err != nil {
			results = append(results, toolResult{id: call.id, content: err.Error(), isError: true})
			continue
		}
		results = append(results, toolResult{id: call.id, content: output, isError: false})
	}
	return results
}

func findTool(tools []toolDef, name string) (toolDef, bool) {
	for _, tool := range tools {
		if tool.name == name {
			return tool, true
		}
	}
	return toolDef{}, false
}

func defaultTools() []toolDef {
	return []toolDef{
		{
			name:        "view",
			description: "Read file contents",
			params:      "  - path: string (file path)",
			fn:          toolView,
		},
		{
			name:        "glob",
			description: "List files by glob pattern",
			params:      "  - pattern: string (glob pattern)\n  - path: string (optional base directory)",
			fn:          toolGlob,
		},
		{
			name:        "grep",
			description: "Search file contents for a string",
			params:      "  - pattern: string (substring)\n  - path: string (optional file or directory)",
			fn:          toolGrep,
		},
		{
			name:        "write",
			description: "Create or overwrite a file",
			params:      "  - path: string (file path)\n  - content: string",
			fn:          toolWrite,
		},
		{
			name:        "edit",
			description: "Edit a file by replacing text",
			params:      "  - path: string (file path)\n  - search: string\n  - replace: string",
			fn:          toolEdit,
		},
		{
			name:        "bash",
			description: "Run a shell command",
			params:      "  - command: string",
			fn:          toolBash,
		},
	}
}

func toolView(_ context.Context, cwd string, args map[string]any) (string, error) {
	path, ok := argString(args, "path")
	if !ok {
		return "", errors.New("view: missing path")
	}
	full := resolvePath(cwd, path)
	data, err := os.ReadFile(full)
	if err != nil {
		return "", err
	}
	if len(data) > maxFileBytes {
		data = data[:maxFileBytes]
	}
	return string(data), nil
}

func toolGlob(_ context.Context, cwd string, args map[string]any) (string, error) {
	pattern, ok := argString(args, "pattern")
	if !ok {
		return "", errors.New("glob: missing pattern")
	}
	base := cwd
	if path, ok := argString(args, "path"); ok && path != "" {
		base = resolvePath(cwd, path)
	}

	matches, err := doublestar.Glob(os.DirFS(base), pattern)
	if err != nil {
		return "", err
	}
	if len(matches) == 0 {
		return "(no matches)", nil
	}
	return strings.Join(matches, "\n"), nil
}

func toolGrep(_ context.Context, cwd string, args map[string]any) (string, error) {
	pattern, ok := argString(args, "pattern")
	if !ok {
		return "", errors.New("grep: missing pattern")
	}
	base := cwd
	if path, ok := argString(args, "path"); ok && path != "" {
		base = resolvePath(cwd, path)
	}

	info, err := os.Stat(base)
	if err != nil {
		return "", err
	}

	var results []string
	if info.IsDir() {
		err = filepath.WalkDir(base, func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() {
				return nil
			}
			if strings.HasPrefix(d.Name(), ".") {
				return nil
			}
			content, err := os.ReadFile(path)
			if err != nil {
				return nil
			}
			if len(content) > maxFileBytes {
				content = content[:maxFileBytes]
			}
			for i, line := range strings.Split(string(content), "\n") {
				if strings.Contains(line, pattern) {
					rel, _ := filepath.Rel(base, path)
					results = append(results, fmt.Sprintf("%s:%d:%s", rel, i+1, strings.TrimSpace(line)))
				}
			}
			return nil
		})
		if err != nil {
			return "", err
		}
	} else {
		content, err := os.ReadFile(base)
		if err != nil {
			return "", err
		}
		if len(content) > maxFileBytes {
			content = content[:maxFileBytes]
		}
		for i, line := range strings.Split(string(content), "\n") {
			if strings.Contains(line, pattern) {
				results = append(results, fmt.Sprintf("%s:%d:%s", filepath.Base(base), i+1, strings.TrimSpace(line)))
			}
		}
	}

	if len(results) == 0 {
		return "(no matches)", nil
	}
	return strings.Join(results, "\n"), nil
}

func toolWrite(_ context.Context, cwd string, args map[string]any) (string, error) {
	path, ok := argString(args, "path")
	if !ok {
		return "", errors.New("write: missing path")
	}
	content, ok := argString(args, "content")
	if !ok {
		return "", errors.New("write: missing content")
	}
	full := resolvePath(cwd, path)
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(full, []byte(content), 0o644); err != nil {
		return "", err
	}
	return "ok", nil
}

func toolEdit(_ context.Context, cwd string, args map[string]any) (string, error) {
	path, ok := argString(args, "path")
	if !ok {
		return "", errors.New("edit: missing path")
	}
	search, ok := argString(args, "search")
	if !ok {
		return "", errors.New("edit: missing search")
	}
	replace, ok := argString(args, "replace")
	if !ok {
		return "", errors.New("edit: missing replace")
	}
	full := resolvePath(cwd, path)
	content, err := os.ReadFile(full)
	if err != nil {
		return "", err
	}
	text := string(content)
	if !strings.Contains(text, search) {
		return "", errors.New("edit: search text not found")
	}
	updated := strings.ReplaceAll(text, search, replace)
	if err := os.WriteFile(full, []byte(updated), 0o644); err != nil {
		return "", err
	}
	return "ok", nil
}

func toolBash(ctx context.Context, cwd string, args map[string]any) (string, error) {
	command, ok := argString(args, "command")
	if !ok {
		return "", errors.New("bash: missing command")
	}
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(ctx, "powershell", "-NoProfile", "-Command", command)
	} else {
		cmd = exec.CommandContext(ctx, "bash", "-lc", command)
	}
	cmd.Dir = cwd
	output, err := cmd.CombinedOutput()
	if err != nil {
		return string(output), err
	}
	return string(output), nil
}

func argString(args map[string]any, key string) (string, bool) {
	val, ok := args[key]
	if !ok {
		return "", false
	}
	switch v := val.(type) {
	case string:
		return v, true
	case fmt.Stringer:
		return v.String(), true
	default:
		return fmt.Sprintf("%v", v), true
	}
}

func resolvePath(cwd, path string) string {
	if filepath.IsAbs(path) {
		return path
	}
	return filepath.Join(cwd, path)
}
