---
name: simple-agent-loop-go
description: >
  Build minimal code-editing agents in Go using Claude, OpenAI, Gemini, or OpenRouter.
  WHEN: Starting a new agent project, learning agent patterns, prototyping agentic workflows.
  WHEN NOT: Production agents (use existing frameworks), Python agents (different patterns).
version: 1.1.0
source: https://ampcode.com/how-to-build-an-agent
---

# Simple Agent Loop in Go

Build a functional code-editing agent in ~400 lines of Go. The core insight: "It's an LLM, a loop, and enough tokens."

**Supported Providers:** Anthropic (Claude), OpenAI, Google (Gemini), OpenRouter

## Quick Start

### 1. Set Up Project
```bash
mkdir my-agent && cd my-agent
go mod init my-agent

# Choose your provider SDK:
go get github.com/anthropics/anthropic-sdk-go  # Claude
go get github.com/openai/openai-go             # OpenAI / OpenRouter
go get google.golang.org/genai                  # Gemini
```

### 2. Create Main Loop (Claude Example)
```go
package main

import (
    "bufio"
    "context"
    "encoding/json"
    "fmt"
    "os"

    "github.com/anthropics/anthropic-sdk-go"
)

func main() {
    client := anthropic.NewClient()
    agent := NewAgent(client, []ToolDefinition{
        ReadFileTool,
        ListFilesTool,
        EditFileTool,
    })
    agent.Run(context.Background())
}
```

### 3. Run It
```bash
# Set your provider's API key:
export ANTHROPIC_API_KEY="your-key"    # Claude
export OPENAI_API_KEY="your-key"       # OpenAI
export OPENROUTER_API_KEY="your-key"   # OpenRouter
export GEMINI_API_KEY="your-key"       # Gemini

go run .
```

---

## When to Use

| Scenario | Use This Skill? | Instead Use |
|----------|----------------|-------------|
| Learning agent fundamentals | Yes | - |
| Quick prototype/POC | Yes | - |
| Custom tool integration | Yes | - |
| Production deployment | No | Established frameworks |
| Python preference | No | Python agent patterns |
| Complex orchestration | No | LangGraph, CrewAI |

---

## Core Concepts

### The Agent Loop

The fundamental pattern that makes agents work:

```
┌─────────────────────────────────────────────┐
│                  AGENT LOOP                 │
├─────────────────────────────────────────────┤
│  1. Accept user input                       │
│  2. Send conversation history to Claude     │
│  3. Process Claude's response               │
│  4. If tool_use → execute tool, goto 2      │
│  5. If end_turn → show response, goto 1     │
└─────────────────────────────────────────────┘
```

### Tool Definition Structure

Every tool needs four components:

| Component | Purpose | Example |
|-----------|---------|---------|
| Name | Identifier | `"read_file"` |
| Description | When/how to use | `"Read contents of a file"` |
| InputSchema | JSON Schema params | `{path: string}` |
| Function | Implementation | `func(input) (string, error)` |

### Stop Reason Flow

| Stop Reason | Meaning | Action |
|-------------|---------|--------|
| `tool_use` | Claude wants to call a tool | Execute tool, continue loop |
| `end_turn` | Claude finished responding | Show response, wait for input |

---

## Complete Implementation

### Agent Structure

```go
type Agent struct {
    client            *anthropic.Client
    tools             []ToolDefinition
    conversationHistory []anthropic.MessageParam
}

type ToolDefinition struct {
    Name        string
    Description string
    InputSchema anthropic.ToolInputSchemaParam
    Function    func(input json.RawMessage) (string, error)
}
```

### Main Agent Loop

```go
func (a *Agent) Run(ctx context.Context) {
    scanner := bufio.NewScanner(os.Stdin)

    for {
        fmt.Print("> ")
        if !scanner.Scan() {
            break
        }
        userInput := scanner.Text()

        // Add user message to history
        a.conversationHistory = append(a.conversationHistory, anthropic.NewUserMessage(
            anthropic.NewTextBlock(userInput),
        ))

        // Run inference loop
        a.runInferenceLoop(ctx)
    }
}

func (a *Agent) runInferenceLoop(ctx context.Context) {
    for {
        response, err := a.client.Messages.New(ctx, anthropic.MessageNewParams{
            Model:     anthropic.F(anthropic.ModelClaude3_5SonnetLatest),
            MaxTokens: anthropic.Int(8096),
            System:    anthropic.F([]anthropic.TextBlockParam{
                anthropic.NewTextBlock("You are a helpful coding assistant."),
            }),
            Tools:    anthropic.F(a.getToolParams()),
            Messages: anthropic.F(a.conversationHistory),
        })
        if err != nil {
            fmt.Printf("Error: %v\n", err)
            return
        }

        // Add assistant response to history
        a.conversationHistory = append(a.conversationHistory,
            anthropic.NewAssistantMessage(response.Content...))

        // Process response
        if response.StopReason == anthropic.MessageStopReasonEndTurn {
            a.printResponse(response)
            return
        }

        // Handle tool calls
        if response.StopReason == anthropic.MessageStopReasonToolUse {
            a.processToolCalls(response)
        }
    }
}
```

### Tool Execution

```go
func (a *Agent) processToolCalls(response *anthropic.Message) {
    var toolResults []anthropic.ContentBlockParamUnion

    for _, block := range response.Content {
        if block.Type == anthropic.ContentBlockTypeToolUse {
            toolUse := block.AsToolUse()
            result := a.executeTool(toolUse.Name, toolUse.Input)

            toolResults = append(toolResults, anthropic.NewToolResultBlock(
                toolUse.ID,
                result,
                false, // isError
            ))
        }
    }

    // Add tool results to history
    a.conversationHistory = append(a.conversationHistory,
        anthropic.NewUserMessage(toolResults...))
}

func (a *Agent) executeTool(name string, input json.RawMessage) string {
    for _, tool := range a.tools {
        if tool.Name == name {
            result, err := tool.Function(input)
            if err != nil {
                return fmt.Sprintf("Error: %v", err)
            }
            return result
        }
    }
    return fmt.Sprintf("Unknown tool: %s", name)
}
```

---

## Essential Tools

### read_file

```go
var ReadFileTool = ToolDefinition{
    Name:        "read_file",
    Description: "Read the contents of a file at the specified path. Returns the file content as a string.",
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
        var params struct{ Path string `json:"path"` }
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
```

### list_files

```go
var ListFilesTool = ToolDefinition{
    Name:        "list_files",
    Description: "List files and directories at the specified path. Directories end with '/'.",
    InputSchema: anthropic.ToolInputSchemaParam{
        Type: anthropic.F(anthropic.ToolInputSchemaTypeObject),
        Properties: anthropic.F(map[string]interface{}{
            "path": map[string]string{
                "type":        "string",
                "description": "The directory path to list (default: current directory)",
            },
        }),
    },
    Function: func(input json.RawMessage) (string, error) {
        var params struct{ Path string `json:"path"` }
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
```

### edit_file

```go
var EditFileTool = ToolDefinition{
    Name:        "edit_file",
    Description: "Edit a file by replacing old_str with new_str. If old_str is empty, creates a new file with new_str content.",
    InputSchema: anthropic.ToolInputSchemaParam{
        Type: anthropic.F(anthropic.ToolInputSchemaTypeObject),
        Properties: anthropic.F(map[string]interface{}{
            "path":    map[string]string{"type": "string", "description": "File path to edit"},
            "old_str": map[string]string{"type": "string", "description": "Text to replace (empty = create file)"},
            "new_str": map[string]string{"type": "string", "description": "Replacement text"},
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
            if err := os.WriteFile(params.Path, []byte(params.NewStr), 0644); err != nil {
                return "", err
            }
            return fmt.Sprintf("Created %s", params.Path), nil
        }

        // Edit existing file
        content, err := os.ReadFile(params.Path)
        if err != nil {
            return "", err
        }

        if !strings.Contains(string(content), params.OldStr) {
            return "", fmt.Errorf("old_str not found in file")
        }

        newContent := strings.Replace(string(content), params.OldStr, params.NewStr, 1)
        if err := os.WriteFile(params.Path, []byte(newContent), 0644); err != nil {
            return "", err
        }

        return fmt.Sprintf("Edited %s", params.Path), nil
    },
}
```

---

## Common Workflows

### Workflow A: Code Generation
1. User: "Create a hello world in JavaScript"
2. Claude calls `edit_file` with empty `old_str` to create new file
3. Result: New file created with implementation

### Workflow B: Code Modification
1. User: "Add error handling to main.go"
2. Claude calls `read_file` to understand current code
3. Claude calls `edit_file` to add error handling
4. Result: File updated with new code

### Workflow C: Exploration
1. User: "What's in this project?"
2. Claude calls `list_files` to see directory structure
3. Claude calls `read_file` on interesting files
4. Result: Summary of project structure

---

## Reference

### API Patterns

| Pattern | Usage |
|---------|-------|
| `anthropic.F()` | Wrap values for API params |
| `anthropic.Int()` | Wrap integers |
| `anthropic.NewUserMessage()` | Create user message |
| `anthropic.NewAssistantMessage()` | Create assistant message |
| `anthropic.NewToolResultBlock()` | Create tool result |

### Message Content Types

| Type | Access Method |
|------|--------------|
| Text | `block.AsText().Text` |
| ToolUse | `block.AsToolUse()` |
| ToolResult | `block.AsToolResult()` |

---

## Advanced Topics

<details>
<summary>Click to expand: Adding Custom Tools</summary>

To add a custom tool:

```go
var MyCustomTool = ToolDefinition{
    Name:        "my_tool",
    Description: "Clear description of when to use this tool",
    InputSchema: anthropic.ToolInputSchemaParam{
        Type: anthropic.F(anthropic.ToolInputSchemaTypeObject),
        Properties: anthropic.F(map[string]interface{}{
            "param1": map[string]string{
                "type":        "string",
                "description": "What this parameter does",
            },
        }),
        Required: anthropic.F([]string{"param1"}),
    },
    Function: func(input json.RawMessage) (string, error) {
        var params struct{ Param1 string `json:"param1"` }
        if err := json.Unmarshal(input, &params); err != nil {
            return "", err
        }
        // Your implementation
        return "result", nil
    },
}
```

Key principles:
- Clear descriptions help Claude know when to use the tool
- Return strings that Claude can understand
- Handle errors gracefully

</details>

<details>
<summary>Click to expand: Streaming Responses</summary>

For streaming, use the streaming API:

```go
stream := client.Messages.NewStreaming(ctx, params)
for stream.Next() {
    event := stream.Current()
    // Handle delta events
}
```

</details>

<details>
<summary>Click to expand: System Prompt Engineering</summary>

The system prompt shapes agent behavior:

```go
System: anthropic.F([]anthropic.TextBlockParam{
    anthropic.NewTextBlock(`You are a coding assistant.

Rules:
- Always read files before editing
- Make minimal changes
- Explain your reasoning`),
}),
```

</details>

---

## Multi-Provider Support

The agent loop pattern works across providers. The core loop is identical—only the client setup and message format differ.

### Provider Comparison

| Provider | SDK | Tool Support | Best For |
|----------|-----|--------------|----------|
| Anthropic | `anthropic-sdk-go` | Native | Best tool use, coding |
| OpenAI | `openai-go` | Native | GPT-4o, broad ecosystem |
| Gemini | `google.golang.org/genai` | Native | Long context, multimodal |
| OpenRouter | `openai-go` (compatible) | Via OpenAI format | Model variety, cost optimization |

### OpenRouter Setup

OpenRouter provides access to 100+ models through an OpenAI-compatible API.

```bash
go get github.com/openai/openai-go
export OPENROUTER_API_KEY="your-key"
```

```go
package main

import (
    "context"
    "github.com/openai/openai-go"
    "github.com/openai/openai-go/option"
)

func NewOpenRouterClient() *openai.Client {
    return openai.NewClient(
        option.WithBaseURL("https://openrouter.ai/api/v1"),
        option.WithAPIKey(os.Getenv("OPENROUTER_API_KEY")),
    )
}

// Agent using OpenRouter
type OpenRouterAgent struct {
    client              *openai.Client
    model               string // e.g., "anthropic/claude-3.5-sonnet", "openai/gpt-4o"
    tools               []openai.ChatCompletionToolParam
    conversationHistory []openai.ChatCompletionMessageParamUnion
}

func (a *OpenRouterAgent) runInferenceLoop(ctx context.Context) {
    for {
        response, err := a.client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
            Model:    openai.F(a.model),
            Messages: openai.F(a.conversationHistory),
            Tools:    openai.F(a.tools),
        })
        if err != nil {
            fmt.Printf("Error: %v\n", err)
            return
        }

        choice := response.Choices[0]

        // Add assistant message to history
        a.conversationHistory = append(a.conversationHistory,
            openai.AssistantMessage(choice.Message.Content))

        // Check finish reason
        switch choice.FinishReason {
        case openai.ChatCompletionChoicesFinishReasonStop:
            fmt.Println(choice.Message.Content)
            return
        case openai.ChatCompletionChoicesFinishReasonToolCalls:
            a.processToolCalls(choice.Message.ToolCalls)
        }
    }
}

func (a *OpenRouterAgent) processToolCalls(toolCalls []openai.ChatCompletionMessageToolCall) {
    for _, tc := range toolCalls {
        result := a.executeTool(tc.Function.Name, []byte(tc.Function.Arguments))

        a.conversationHistory = append(a.conversationHistory,
            openai.ToolMessage(tc.ID, result))
    }
}
```

**Popular OpenRouter Models:**
| Model ID | Notes |
|----------|-------|
| `anthropic/claude-3.5-sonnet` | Best coding |
| `openai/gpt-4o` | Fast, capable |
| `google/gemini-pro-1.5` | Long context |
| `meta-llama/llama-3.1-405b` | Open source |

---

### OpenAI Setup

```bash
go get github.com/openai/openai-go
export OPENAI_API_KEY="your-key"
```

```go
package main

import (
    "context"
    "encoding/json"
    "github.com/openai/openai-go"
)

type OpenAIAgent struct {
    client              *openai.Client
    tools               []openai.ChatCompletionToolParam
    conversationHistory []openai.ChatCompletionMessageParamUnion
}

func NewOpenAIAgent(tools []ToolDefinition) *OpenAIAgent {
    client := openai.NewClient() // Uses OPENAI_API_KEY env var

    // Convert tools to OpenAI format
    var openaiTools []openai.ChatCompletionToolParam
    for _, t := range tools {
        openaiTools = append(openaiTools, openai.ChatCompletionToolParam{
            Type: openai.F(openai.ChatCompletionToolTypeFunction),
            Function: openai.F(openai.FunctionDefinitionParam{
                Name:        openai.F(t.Name),
                Description: openai.F(t.Description),
                Parameters:  openai.F(openai.FunctionParameters(t.InputSchema)),
            }),
        })
    }

    return &OpenAIAgent{
        client: client,
        tools:  openaiTools,
    }
}

func (a *OpenAIAgent) runInferenceLoop(ctx context.Context) {
    for {
        response, err := a.client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
            Model:    openai.F(openai.ChatModelGPT4o),
            Messages: openai.F(a.conversationHistory),
            Tools:    openai.F(a.tools),
        })
        if err != nil {
            fmt.Printf("Error: %v\n", err)
            return
        }

        choice := response.Choices[0]

        // Add assistant response
        a.conversationHistory = append(a.conversationHistory,
            openai.ChatCompletionMessageParamUnion{
                Value: choice.Message,
            })

        switch choice.FinishReason {
        case openai.ChatCompletionChoicesFinishReasonStop:
            fmt.Println(choice.Message.Content)
            return
        case openai.ChatCompletionChoicesFinishReasonToolCalls:
            for _, tc := range choice.Message.ToolCalls {
                result := a.executeTool(tc.Function.Name, []byte(tc.Function.Arguments))
                a.conversationHistory = append(a.conversationHistory,
                    openai.ToolMessage(tc.ID, result))
            }
        }
    }
}
```

---

### Gemini Setup

```bash
go get google.golang.org/genai
export GEMINI_API_KEY="your-key"
```

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "google.golang.org/genai"
)

type GeminiAgent struct {
    client  *genai.Client
    model   *genai.GenerativeModel
    chat    *genai.ChatSession
    tools   []ToolDefinition
}

func NewGeminiAgent(tools []ToolDefinition) (*GeminiAgent, error) {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, &genai.ClientConfig{
        APIKey: os.Getenv("GEMINI_API_KEY"),
    })
    if err != nil {
        return nil, err
    }

    // Convert tools to Gemini format
    var geminiTools []*genai.Tool
    for _, t := range tools {
        geminiTools = append(geminiTools, &genai.Tool{
            FunctionDeclarations: []*genai.FunctionDeclaration{{
                Name:        t.Name,
                Description: t.Description,
                Parameters:  convertToGeminiSchema(t.InputSchema),
            }},
        })
    }

    model := client.GenerativeModel("gemini-1.5-pro")
    model.Tools = geminiTools
    model.SystemInstruction = &genai.Content{
        Parts: []genai.Part{genai.Text("You are a helpful coding assistant.")},
    }

    return &GeminiAgent{
        client: client,
        model:  model,
        chat:   model.StartChat(),
        tools:  tools,
    }, nil
}

func (a *GeminiAgent) runInferenceLoop(ctx context.Context, userInput string) {
    // Send message
    resp, err := a.chat.SendMessage(ctx, genai.Text(userInput))
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    for {
        // Check for function calls
        var functionCalls []*genai.FunctionCall
        for _, part := range resp.Candidates[0].Content.Parts {
            if fc, ok := part.(genai.FunctionCall); ok {
                functionCalls = append(functionCalls, &fc)
            }
        }

        if len(functionCalls) == 0 {
            // No function calls - print text response
            for _, part := range resp.Candidates[0].Content.Parts {
                if text, ok := part.(genai.Text); ok {
                    fmt.Println(string(text))
                }
            }
            return
        }

        // Execute function calls
        var functionResponses []genai.Part
        for _, fc := range functionCalls {
            argsJSON, _ := json.Marshal(fc.Args)
            result := a.executeTool(fc.Name, argsJSON)

            functionResponses = append(functionResponses, genai.FunctionResponse{
                Name:     fc.Name,
                Response: map[string]any{"result": result},
            })
        }

        // Send function results back
        resp, err = a.chat.SendMessage(ctx, functionResponses...)
        if err != nil {
            fmt.Printf("Error: %v\n", err)
            return
        }
    }
}

func convertToGeminiSchema(schema map[string]interface{}) *genai.Schema {
    // Convert your tool schema to Gemini's Schema format
    return &genai.Schema{
        Type:       genai.TypeObject,
        Properties: schema["properties"].(map[string]*genai.Schema),
        Required:   schema["required"].([]string),
    }
}
```

---

### Provider-Agnostic Interface

For maximum flexibility, abstract the provider:

```go
// LLMProvider abstracts different LLM APIs
type LLMProvider interface {
    Chat(ctx context.Context, messages []Message, tools []Tool) (*Response, error)
}

type Message struct {
    Role    string // "user", "assistant", "tool"
    Content string
    ToolID  string // For tool results
}

type Response struct {
    Content   string
    ToolCalls []ToolCall
    Done      bool
}

type ToolCall struct {
    ID        string
    Name      string
    Arguments json.RawMessage
}

// Usage: swap providers without changing agent logic
func NewAgent(provider LLMProvider, tools []ToolDefinition) *Agent {
    return &Agent{provider: provider, tools: tools}
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not found" | Set appropriate env var (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`) |
| "Tool not found" | Check tool name matches exactly |
| "old_str not found" | Read file first, copy exact text |
| Infinite loop | Check stop/finish reason handling |
| JSON unmarshal error | Verify InputSchema matches struct |
| OpenRouter 401 | Check `OPENROUTER_API_KEY`, ensure credits available |
| Gemini tool errors | Verify schema conversion, check function declaration format |

---

## Key Insights

1. **No magic required**: The impressive capability comes from Claude, not complex code
2. **Tool descriptions matter**: Clear descriptions help Claude choose correctly
3. **Return understandable results**: Claude uses tool output to decide next steps
4. **Maintain full context**: Send complete conversation history each turn
5. **Let Claude decide**: Don't hardcode tool sequences; Claude figures it out

---

## See Also

- `codex` - Alternative agent using OpenAI Codex
- `pk-puzldai` - Multi-LLM orchestration
- [Anthropic Go SDK](https://github.com/anthropics/anthropic-sdk-go)
- [OpenAI Go SDK](https://github.com/openai/openai-go)
- [Google GenAI Go SDK](https://pkg.go.dev/google.golang.org/genai)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Source Guide](https://ampcode.com/how-to-build-an-agent)
