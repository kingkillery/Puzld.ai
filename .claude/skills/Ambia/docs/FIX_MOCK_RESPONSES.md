# Fixing Mock Responses in Custom-Skills-Server

## Problem
The Ambia skill (and potentially other skills) are returning mock responses instead of executing real LLM calls.

## Root Cause
The Custom-Skills-Server MCP server defaults to `MockLLMExecutor` when no LLM provider is configured or when API keys are missing.

## Solution: Configure LLM Provider

The Custom-Skills-Server supports multiple LLM providers. You can configure it in two ways:

### Method 1: Environment Variables (Recommended)

Configure via MCP configuration file environment variables. This is the **recommended approach**.

#### Step 1: Locate Your MCP Configuration File

Windows location:
- `%APPDATA%\Claude\claude_desktop_config.json` 
- Or `~/.config/claude-code/mcp.json`

#### Step 2: Update MCP Configuration

Add LLM provider configuration to the `Custom-Skills-Server` entry:

```json
{
  "mcpServers": {
    "Custom-Skills-Server": {
      "command": "python",
      "args": [
        "C:\\Users\\prest\\Desktop\\Desktop_Projects\\May-Dec-2025\\Skills-Finder-MCP\\Custom-Skills-Server\\mcp_server.py"
      ],
      "cwd": "C:\\Users\\prest\\Desktop\\Desktop_Projects\\May-Dec-2025\\Skills-Finder-MCP\\Custom-Skills-Server",
      "env": {
        "LLM_PROVIDER": "openai",
        "LLM_MODEL": "gpt-4o",
        "LLM_TEMPERATURE": "0.3",
        "LLM_MAX_TOKENS": "4000",
        "OPENAI_API_KEY": "sk-your-openai-key-here"
      }
    }
  }
}
```

**Alternative Provider Configurations:**

**Anthropic (Claude):**
```json
"env": {
  "LLM_PROVIDER": "anthropic",
  "LLM_MODEL": "claude-3-5-sonnet-20241022",
  "LLM_TEMPERATURE": "0.3",
  "LLM_MAX_TOKENS": "4000",
  "ANTHROPIC_API_KEY": "sk-ant-your-anthropic-key-here"
}
```

**Groq:**
```json
"env": {
  "LLM_PROVIDER": "groq",
  "LLM_MODEL": "mixtral-8x7b-32768",
  "LLM_TEMPERATURE": "0.3",
  "LLM_MAX_TOKENS": "4000",
  "GROQ_API_KEY": "gsk_your-groq-key-here"
}
```

**Ollama (Local):**
```json
"env": {
  "LLM_PROVIDER": "ollama",
  "LLM_MODEL": "llama2",
  "LLM_TEMPERATURE": "0.3",
  "LLM_MAX_TOKENS": "4000"
}
```

### Method 2: Update Config File

Alternatively, update the config file directly:

**File:** `C:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\Skills-Finder-MCP\Custom-Skills-Server\config\orchestrator.yaml`

Change:
```yaml
model:
  provider: "mock"  # Change this
  model_id: "test-llm"  # Change this
```

To:
```yaml
model:
  provider: "openai"  # or "anthropic", "groq", "ollama"
  model_id: "gpt-4o"  # or "claude-3-5-sonnet-20241022", etc.
  temperature: 0.3
  max_tokens: 4000
```

**Note:** You still need to set the API key as an environment variable even when using the config file method.

### Step 3: Restart Claude Code

After making changes:
1. Save the MCP configuration file (or config file)
2. **Completely quit and restart Claude Code** (not just close the window)
3. Test the skill again

## Verification

After fixing, the skill should return real LLM-generated responses instead of mock responses.

### How to Verify

1. **Check Server Logs**: Look for messages like:
   - ✅ `"Using RealLLMExecutor with provider: openai, model: gpt-4o"`
   - ❌ `"Using MockLLMExecutor (mock mode)"` (indicates still using mock)

2. **Test Skill Execution**: Run the Ambia skill and check:
   - Response should be contextually relevant to your query
   - No "Mock Execution" status messages
   - Real LLM-generated content (not template text)

## Troubleshooting

### Issue: Still Getting Mock Responses After Configuration

**Checklist:**
1. ✅ API keys are correctly formatted (no extra spaces, correct prefix)
2. ✅ Environment variables are set in the MCP config file (not just system environment)
3. ✅ `LLM_PROVIDER` is set to a real provider (not "mock")
4. ✅ `LLM_MODEL` is set to a valid model ID for the provider
5. ✅ Claude Code was **completely restarted** (not just window closed)
6. ✅ Server logs show the correct executor being initialized

**Debug Steps:**
1. Check server logs for initialization messages
2. Verify environment variables are being read:
   ```powershell
   # Test if server can read env vars
   cd "C:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\Skills-Finder-MCP\Custom-Skills-Server"
   .venv\Scripts\python.exe -c "import os; print(os.getenv('LLM_PROVIDER'))"
   ```
3. Verify API key format is correct for your provider

### Issue: API Key Errors

**Anthropic:**
- Format: `sk-ant-...` (starts with `sk-ant-`)
- Set as: `ANTHROPIC_API_KEY`

**OpenAI:**
- Format: `sk-...` (starts with `sk-`)
- Set as: `OPENAI_API_KEY`

**Groq:**
- Format: `gsk_...` (starts with `gsk_`)
- Set as: `GROQ_API_KEY`

**Common Issues:**
- Extra spaces or quotes in the API key
- Wrong environment variable name
- API key not set in MCP config (only in system env)

### Issue: Server Falls Back to Mock

If you see this in logs:
```
Failed to initialize RealLLMExecutor: [error], falling back to mock executor
```

**Possible Causes:**
1. Missing API key
2. Invalid API key format
3. Missing required Python package (e.g., `anthropic`, `openai`, `groq`)
4. Network issues preventing API connection

**Solution:**
1. Install required package:
   ```powershell
   cd "C:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\Skills-Finder-MCP\Custom-Skills-Server"
   .venv\Scripts\pip.exe install anthropic  # or openai, groq
   ```
2. Verify API key is correct
3. Check network connectivity

### Issue: Configuration Priority

The server checks configuration in this order:
1. **Environment variables** (from MCP config `env` section) ← Highest priority
2. **Config file** (`config/orchestrator.yaml`)
3. **Mock mode** (default)

If you set environment variables, they override the config file. Make sure you're editing the right place.

## Quick Reference: Provider Configuration

| Provider | LLM_PROVIDER | LLM_MODEL | API Key Env Var |
|----------|--------------|-----------|-----------------|
| OpenAI | `"openai"` | `"gpt-4o"` | `OPENAI_API_KEY` |
| Anthropic | `"anthropic"` | `"claude-3-5-sonnet-20241022"` | `ANTHROPIC_API_KEY` |
| Groq | `"groq"` | `"mixtral-8x7b-32768"` | `GROQ_API_KEY` |
| Ollama | `"ollama"` | `"llama2"` | None (local) |

## Next Steps

1. ✅ Locate your MCP configuration file
2. ✅ Add `LLM_PROVIDER`, `LLM_MODEL`, and API key to the `env` section
3. ✅ Save the configuration file
4. ✅ **Completely quit and restart Claude Code**
5. ✅ Test the Ambia skill with a real query
6. ✅ Verify responses are real LLM outputs, not mock responses

## Additional Resources

- **Server Code**: `C:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\Skills-Finder-MCP\Custom-Skills-Server\llm_executor.py`
- **Server Config**: `C:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\Skills-Finder-MCP\Custom-Skills-Server\config\orchestrator.yaml`
- **Setup Guide**: `C:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\Skills-Finder-MCP\Custom-Skills-Server\MCP-SETUP-GUIDE.md`

