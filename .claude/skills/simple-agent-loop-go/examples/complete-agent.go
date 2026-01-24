// Complete Agent Implementation
// Based on: https://ampcode.com/how-to-build-an-agent
//
// Usage:
//   go mod init my-agent
//   go get github.com/anthropics/anthropic-sdk-go
//   export ANTHROPIC_API_KEY="your-key"
//   go run complete-agent.go

package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"
)

// ToolDefinition defines a tool that Claude can use
type ToolDefinition struct {
	Name        string
	Description string
	InputSchema anthropic.ToolInputSchemaParam
	Function    func(input json.RawMessage) (string, error)
}

// Agent manages conversation and tool execution
type Agent struct {
	client              *anthropic.Client
	tools               []ToolDefinition
	conversationHistory []anthropic.MessageParam
}

// NewAgent creates a new agent with the specified tools
func NewAgent(client *anthropic.Client, tools []ToolDefinition) *Agent {
	return &Agent{
		client:              client,
		tools:               tools,
		conversationHistory: []anthropic.MessageParam{},
	}
}

// Run starts the agent's main loop
func (a *Agent) Run(ctx context.Context) {
	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("Agent ready. Type your message (Ctrl+C to exit):")

	for {
		fmt.Print("\n> ")
		if !scanner.Scan() {
			break
		}
		userInput := scanner.Text()
		if strings.TrimSpace(userInput) == "" {
			continue
		}

		// Add user message to history
		a.conversationHistory = append(a.conversationHistory, anthropic.NewUserMessage(
			anthropic.NewTextBlock(userInput),
		))

		// Run the inference loop
		a.runInferenceLoop(ctx)
	}
}

// runInferenceLoop handles the conversation with Claude
func (a *Agent) runInferenceLoop(ctx context.Context) {
	for {
		response, err := a.client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:     anthropic.F(anthropic.ModelClaude3_5SonnetLatest),
			MaxTokens: anthropic.Int(8096),
			System: anthropic.F([]anthropic.TextBlockParam{
				anthropic.NewTextBlock(`You are a helpful coding assistant. You can read, list, and edit files.

Guidelines:
- Read files before editing to understand context
- Make minimal, focused changes
- Explain your reasoning briefly`),
			}),
			Tools:    anthropic.F(a.getToolParams()),
			Messages: anthropic.F(a.conversationHistory),
		})
		if err != nil {
			fmt.Printf("Error calling API: %v\n", err)
			return
		}

		// Add assistant response to history
		a.conversationHistory = append(a.conversationHistory,
			anthropic.NewAssistantMessage(response.Content...))

		// Check stop reason
		switch response.StopReason {
		case anthropic.MessageStopReasonEndTurn:
			a.printResponse(response)
			return

		case anthropic.MessageStopReasonToolUse:
			a.processToolCalls(response)
			// Continue loop to get Claude's response to tool results

		default:
			fmt.Printf("Unexpected stop reason: %s\n", response.StopReason)
			return
		}
	}
}

// getToolParams converts tool definitions to API format
func (a *Agent) getToolParams() []anthropic.ToolParam {
	params := make([]anthropic.ToolParam, len(a.tools))
	for i, tool := range a.tools {
		params[i] = anthropic.ToolParam{
			Name:        anthropic.F(tool.Name),
			Description: anthropic.F(tool.Description),
			InputSchema: anthropic.F(tool.InputSchema),
		}
	}
	return params
}

// processToolCalls executes requested tools and adds results to history
func (a *Agent) processToolCalls(response *anthropic.Message) {
	var toolResults []anthropic.ContentBlockParamUnion

	for _, block := range response.Content {
		if block.Type == anthropic.ContentBlockTypeToolUse {
			toolUse := block.AsToolUse()

			fmt.Printf("  [Tool: %s]\n", toolUse.Name)

			result, isError := a.executeTool(toolUse.Name, toolUse.Input)

			toolResults = append(toolResults, anthropic.NewToolResultBlock(
				toolUse.ID,
				result,
				isError,
			))
		}
	}

	// Add tool results as user message
	a.conversationHistory = append(a.conversationHistory,
		anthropic.NewUserMessage(toolResults...))
}

// executeTool runs a tool by name and returns the result
func (a *Agent) executeTool(name string, input json.RawMessage) (string, bool) {
	for _, tool := range a.tools {
		if tool.Name == name {
			result, err := tool.Function(input)
			if err != nil {
				return fmt.Sprintf("Error: %v", err), true
			}
			return result, false
		}
	}
	return fmt.Sprintf("Unknown tool: %s", name), true
}

// printResponse displays Claude's text response
func (a *Agent) printResponse(response *anthropic.Message) {
	for _, block := range response.Content {
		if block.Type == anthropic.ContentBlockTypeText {
			fmt.Printf("\n%s\n", block.AsText().Text)
		}
	}
}

// ============================================================================
// Tool Definitions
// ============================================================================

var ReadFileTool = ToolDefinition{
	Name:        "read_file",
	Description: "Read the contents of a file at the specified path. Use this to understand existing code before making changes.",
	InputSchema: anthropic.ToolInputSchemaParam{
		Type: anthropic.F(anthropic.ToolInputSchemaTypeObject),
		Properties: anthropic.F(map[string]interface{}{
			"path": map[string]string{
				"type":        "string",
				"description": "The path to the file to read",
			},
		}),
		Required: anthropic.F([]string{"path"}),
	},
	Function: func(input json.RawMessage) (string, error) {
		var params struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(input, &params); err != nil {
			return "", err
		}

		content, err := os.ReadFile(params.Path)
		if err != nil {
			return "", err
		}
		return string(content), nil
	},
}

var ListFilesTool = ToolDefinition{
	Name:        "list_files",
	Description: "List files and directories at the specified path. Directories are marked with a trailing '/'. Useful for understanding project structure.",
	InputSchema: anthropic.ToolInputSchemaParam{
		Type: anthropic.F(anthropic.ToolInputSchemaTypeObject),
		Properties: anthropic.F(map[string]interface{}{
			"path": map[string]string{
				"type":        "string",
				"description": "The directory path to list. Defaults to current directory if not specified.",
			},
		}),
	},
	Function: func(input json.RawMessage) (string, error) {
		var params struct {
			Path string `json:"path"`
		}
		json.Unmarshal(input, &params)

		if params.Path == "" {
			params.Path = "."
		}

		entries, err := os.ReadDir(params.Path)
		if err != nil {
			return "", err
		}

		var result []string
		for _, entry := range entries {
			name := entry.Name()
			if entry.IsDir() {
				name += "/"
			}
			result = append(result, name)
		}

		return strings.Join(result, "\n"), nil
	},
}

var EditFileTool = ToolDefinition{
	Name:        "edit_file",
	Description: "Edit a file by replacing old_str with new_str. If old_str is empty, creates a new file with new_str as content. Use read_file first to get the exact text to replace.",
	InputSchema: anthropic.ToolInputSchemaParam{
		Type: anthropic.F(anthropic.ToolInputSchemaTypeObject),
		Properties: anthropic.F(map[string]interface{}{
			"path": map[string]string{
				"type":        "string",
				"description": "The path to the file to edit or create",
			},
			"old_str": map[string]string{
				"type":        "string",
				"description": "The exact text to replace. Use empty string to create a new file.",
			},
			"new_str": map[string]string{
				"type":        "string",
				"description": "The text to replace old_str with, or the content for a new file",
			},
		}),
		Required: anthropic.F([]string{"path", "old_str", "new_str"}),
	},
	Function: func(input json.RawMessage) (string, error) {
		var params struct {
			Path   string `json:"path"`
			OldStr string `json:"old_str"`
			NewStr string `json:"new_str"`
		}
		if err := json.Unmarshal(input, &params); err != nil {
			return "", err
		}

		// Create new file if old_str is empty
		if params.OldStr == "" {
			// Create parent directories if needed
			dir := strings.TrimSuffix(params.Path, "/"+filepath.Base(params.Path))
			if dir != params.Path && dir != "" {
				os.MkdirAll(dir, 0755)
			}

			if err := os.WriteFile(params.Path, []byte(params.NewStr), 0644); err != nil {
				return "", err
			}
			return fmt.Sprintf("Created file: %s", params.Path), nil
		}

		// Edit existing file
		content, err := os.ReadFile(params.Path)
		if err != nil {
			return "", err
		}

		contentStr := string(content)
		if !strings.Contains(contentStr, params.OldStr) {
			return "", fmt.Errorf("old_str not found in file. Use read_file to see exact content.")
		}

		// Count occurrences
		count := strings.Count(contentStr, params.OldStr)
		if count > 1 {
			return "", fmt.Errorf("old_str found %d times. Make it more specific.", count)
		}

		newContent := strings.Replace(contentStr, params.OldStr, params.NewStr, 1)
		if err := os.WriteFile(params.Path, []byte(newContent), 0644); err != nil {
			return "", err
		}

		return fmt.Sprintf("Edited file: %s", params.Path), nil
	},
}

// ============================================================================
// Main
// ============================================================================

func main() {
	client := anthropic.NewClient()

	agent := NewAgent(client, []ToolDefinition{
		ReadFileTool,
		ListFilesTool,
		EditFileTool,
	})

	agent.Run(context.Background())
}
