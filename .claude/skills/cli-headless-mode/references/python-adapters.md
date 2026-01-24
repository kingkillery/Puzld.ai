# Python CLI Tool Adapters

Complete Python adapters for wrapping AI CLI tools in agentic applications.

## Base Adapter Class

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Any, Callable, Iterator
import subprocess
import json
import shlex

@dataclass
class AdapterOptions:
    json_output: bool = False
    stream: bool = False
    schema: Optional[dict] = None
    system_prompt: Optional[str] = None
    timeout: Optional[int] = None

@dataclass
class StreamChunk:
    text: str = ""
    done: bool = False
    error: Optional[str] = None

class CLIAdapter(ABC):
    name: str
    headless_flag: str
    json_flag: Optional[str] = None
    stream_flag: Optional[str] = None
    schema_flag: Optional[str] = None
    system_flag: Optional[str] = None
    
    @abstractmethod
    def build_command(self, prompt: str, options: Optional[AdapterOptions] = None) -> list[str]:
        pass
    
    def parse_output(self, output: str, options: Optional[AdapterOptions] = None) -> Any:
        opts = options or AdapterOptions()
        trimmed = output.strip()
        if opts.json_output or opts.schema:
            return json.loads(trimmed)
        return trimmed
    
    def handle_stream_chunk(self, line: str) -> StreamChunk:
        if not line.strip():
            return StreamChunk()
        try:
            data = json.loads(line)
            return StreamChunk(
                text=data.get("text", data.get("content", data.get("response", ""))),
                done=data.get("done", data.get("finished", False))
            )
        except json.JSONDecodeError:
            return StreamChunk(text=line)
    
    def run(self, prompt: str, options: Optional[AdapterOptions] = None) -> Any:
        """Execute command and return parsed output."""
        opts = options or AdapterOptions()
        cmd = self.build_command(prompt, opts)
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=opts.timeout
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"Command failed: {result.stderr}")
        
        return self.parse_output(result.stdout, opts)
    
    def stream(self, prompt: str, options: Optional[AdapterOptions] = None) -> Iterator[StreamChunk]:
        """Execute command and yield streaming chunks."""
        opts = options or AdapterOptions()
        opts.stream = True
        cmd = self.build_command(prompt, opts)
        
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        for line in proc.stdout:
            chunk = self.handle_stream_chunk(line)
            yield chunk
            if chunk.done:
                break
        
        proc.wait()
```

## Gemini Adapter

```python
class GeminiAdapter(CLIAdapter):
    name = "gemini"
    headless_flag = "-p"
    json_flag = "--output-format json"
    stream_flag = "--output-format stream-json"
    schema_flag = "--schema"
    system_flag = "--system"
    
    def build_command(self, prompt: str, options: Optional[AdapterOptions] = None) -> list[str]:
        opts = options or AdapterOptions()
        cmd = ["gemini", "-p"]
        
        if opts.system_prompt:
            cmd.extend(["--system", opts.system_prompt])
        if opts.json_output:
            cmd.extend(["--output-format", "json"])
        if opts.stream:
            cmd.extend(["--output-format", "stream-json"])
        if opts.schema:
            cmd.extend(["--schema", json.dumps(opts.schema)])
        
        cmd.append(prompt)
        return cmd
```

## Claude Adapter

```python
class ClaudeAdapter(CLIAdapter):
    name = "claude"
    headless_flag = "-p"
    json_flag = "--output-format json"
    stream_flag = "--stream"
    
    def build_command(self, prompt: str, options: Optional[AdapterOptions] = None) -> list[str]:
        opts = options or AdapterOptions()
        cmd = ["claude", "-p"]
        
        if opts.json_output:
            cmd.extend(["--output-format", "json"])
        if opts.stream:
            cmd.append("--stream")
        
        cmd.append(prompt)
        return cmd
```

## Ollama Adapter

```python
class OllamaAdapter(CLIAdapter):
    name = "ollama"
    headless_flag = ""
    json_flag = "--format json"
    model: str = "llama2"
    
    def __init__(self, model: str = "llama2"):
        self.model = model
    
    def build_command(self, prompt: str, options: Optional[AdapterOptions] = None) -> list[str]:
        opts = options or AdapterOptions()
        cmd = ["ollama", "run", self.model]
        
        if opts.json_output:
            cmd.extend(["--format", "json"])
        
        cmd.append(prompt)
        return cmd
    
    def handle_stream_chunk(self, line: str) -> StreamChunk:
        if not line.strip():
            return StreamChunk()
        try:
            data = json.loads(line)
            return StreamChunk(
                text=data.get("response", ""),
                done=data.get("done", False)
            )
        except json.JSONDecodeError:
            return StreamChunk(text=line)
```


## Codex Adapter

```python
class CodexAdapter(CLIAdapter):
    name = "codex"
    headless_flag = "--approval-mode full-auto"
    
    def build_command(self, prompt: str, options: Optional[AdapterOptions] = None) -> list[str]:
        opts = options or AdapterOptions()
        cmd = ["codex", "--approval-mode", "full-auto"]
        
        if opts.json_output:
            cmd.append("-q")  # quiet mode
        
        cmd.append(prompt)
        return cmd
```

## Crush Adapter

```python
class CrushAdapter(CLIAdapter):
    name = "crush"
    headless_flag = "-p"
    json_flag = "--output-format json"
    
    def build_command(self, prompt: str, options: Optional[AdapterOptions] = None) -> list[str]:
        opts = options or AdapterOptions()
        cmd = ["crush", "-p"]
        
        if opts.json_output:
            cmd.extend(["--output-format", "json"])
        
        cmd.append(prompt)
        return cmd
```

## Droid Adapter

```python
class DroidAdapter(CLIAdapter):
    name = "droid"
    headless_flag = "--non-interactive"
    
    def build_command(self, prompt: str, options: Optional[AdapterOptions] = None) -> list[str]:
        cmd = ["droid", "--non-interactive"]
        cmd.append(prompt)
        return cmd
```

## Adapter Registry

```python
from typing import Dict, Type

ADAPTERS: Dict[str, Type[CLIAdapter]] = {
    "gemini": GeminiAdapter,
    "claude": ClaudeAdapter,
    "ollama": OllamaAdapter,
    "codex": CodexAdapter,
    "crush": CrushAdapter,
    "droid": DroidAdapter,
}

def get_adapter(tool: str) -> CLIAdapter:
    """Get adapter instance by tool name."""
    adapter_class = ADAPTERS.get(tool.lower())
    if not adapter_class:
        available = ", ".join(ADAPTERS.keys())
        raise ValueError(f"Unknown tool: {tool}. Available: {available}")
    return adapter_class()
```

## Usage Examples

### Simple Query

```python
from cli_adapters import get_adapter

# Basic query
adapter = get_adapter("gemini")
result = adapter.run("What is 2+2?")
print(result)  # "4"

# JSON output
result = adapter.run(
    "List 3 colors",
    AdapterOptions(json_output=True)
)
print(result)  # {"colors": ["red", "blue", "green"]}
```

### Structured Output with Schema

```python
adapter = get_adapter("gemini")
schema = {
    "type": "object",
    "properties": {
        "answer": {"type": "number"},
        "explanation": {"type": "string"}
    }
}

result = adapter.run(
    "What is 2+2?",
    AdapterOptions(json_output=True, schema=schema)
)
print(result["answer"])  # 4
```

### Streaming Response

```python
adapter = get_adapter("gemini")

for chunk in adapter.stream("Tell me a story"):
    print(chunk.text, end="", flush=True)
    if chunk.done:
        break
print()
```

### Multi-Tool Pipeline

```python
def analyze_code(code: str) -> dict:
    """Use multiple tools for comprehensive analysis."""
    
    # First pass: Gemini for quick review
    gemini = get_adapter("gemini")
    quick_review = gemini.run(
        f"Quick code review:\n{code}",
        AdapterOptions(json_output=True, schema={
            "type": "object",
            "properties": {
                "issues": {"type": "array"},
                "score": {"type": "number"}
            }
        })
    )
    
    # If issues found, get detailed analysis from Claude
    if quick_review.get("issues"):
        claude = get_adapter("claude")
        detailed = claude.run(
            f"Detailed analysis of issues: {quick_review['issues']}\nCode:\n{code}"
        )
        quick_review["detailed_analysis"] = detailed
    
    return quick_review
```

### Async Wrapper

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

async def async_query(tool: str, prompt: str, options: Optional[AdapterOptions] = None) -> Any:
    """Run CLI query asynchronously."""
    adapter = get_adapter(tool)
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        lambda: adapter.run(prompt, options)
    )

# Usage
async def main():
    results = await asyncio.gather(
        async_query("gemini", "Question 1"),
        async_query("claude", "Question 2"),
        async_query("ollama", "Question 3"),
    )
    print(results)
```

### Error Handling

```python
from subprocess import TimeoutExpired

def safe_query(tool: str, prompt: str, timeout: int = 30) -> dict:
    """Query with comprehensive error handling."""
    adapter = get_adapter(tool)
    
    try:
        result = adapter.run(
            prompt,
            AdapterOptions(json_output=True, timeout=timeout)
        )
        return {"success": True, "result": result}
    
    except TimeoutExpired:
        return {"success": False, "error": "Query timed out"}
    
    except json.JSONDecodeError as e:
        return {"success": False, "error": f"Invalid JSON: {e}"}
    
    except RuntimeError as e:
        return {"success": False, "error": str(e)}
    
    except FileNotFoundError:
        return {"success": False, "error": f"Tool '{tool}' not found in PATH"}
```

## Complete Module

Save as `cli_adapters.py`:

```python
#!/usr/bin/env python3
"""
CLI Adapters - Python wrappers for AI CLI tools
Supports: gemini, claude, ollama, codex, crush, droid
"""

# [Include all class definitions above]

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: cli_adapters.py <tool> <prompt>")
        print(f"Tools: {', '.join(ADAPTERS.keys())}")
        sys.exit(1)
    
    tool, prompt = sys.argv[1], " ".join(sys.argv[2:])
    adapter = get_adapter(tool)
    print(adapter.run(prompt))
```
