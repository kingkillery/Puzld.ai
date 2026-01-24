# Gemini Deep Research API Patterns

Detailed API usage patterns for the `google-genai` SDK.

## SDK Setup

```python
import os
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
```

## Model Identifiers

Deep Research uses specific model/agent identifiers. These may change over time:

```python
# Current preview identifier (as of 2025-12)
DEEP_RESEARCH_AGENT = "gemini-2.0-flash-thinking-exp"

# Alternative identifiers to try if above fails
FALLBACK_AGENTS = [
    "gemini-2.0-pro",
    "gemini-1.5-pro",
]
```

## Submission Patterns

### Synchronous (Blocking)

For short research tasks where waiting is acceptable:

```python
def submit_sync(prompt: str) -> str:
    """Submit and wait for completion. Returns report text."""
    response = client.models.generate_content(
        model=DEEP_RESEARCH_AGENT,
        contents=prompt,
        config={
            "temperature": 0.7,
            "max_output_tokens": 8192,
        }
    )
    return response.text
```

### Asynchronous (Background Job)

For long-running research, use the async pattern:

```python
import asyncio
from google.genai import types

async def submit_async(prompt: str) -> str:
    """Submit as background job, return immediately with job ID."""
    async_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    # Create a "chat" session that persists
    chat = async_client.chats.create(model=DEEP_RESEARCH_AGENT)

    # Send the research request
    response = await chat.send_message_async(prompt)

    return chat.name  # Use as job ID for polling
```

### Streaming Response

For real-time progress updates:

```python
def submit_streaming(prompt: str):
    """Stream response chunks as they arrive."""
    response = client.models.generate_content_stream(
        model=DEEP_RESEARCH_AGENT,
        contents=prompt,
    )

    full_text = ""
    for chunk in response:
        if chunk.text:
            full_text += chunk.text
            yield chunk.text  # Emit for progress display

    return full_text
```

## Polling Patterns

### Simple Polling Loop

```python
import time

def poll_until_done(job_id: str, poll_seconds: int = 10, max_attempts: int = 60) -> str:
    """Poll for job completion with timeout."""
    for attempt in range(max_attempts):
        try:
            # Retrieve the chat/interaction
            chat = client.chats.get(job_id)

            # Check last message for completion
            if chat.history and len(chat.history) > 1:
                last_msg = chat.history[-1]
                if last_msg.role == "model":
                    return last_msg.parts[0].text

        except Exception as e:
            if "not found" in str(e).lower():
                raise RuntimeError(f"Job {job_id} not found")
            # Transient error, continue polling

        time.sleep(poll_seconds)

    raise TimeoutError(f"Job {job_id} did not complete within {max_attempts * poll_seconds}s")
```

### Exponential Backoff

For production reliability:

```python
def poll_with_backoff(job_id: str, initial_delay: float = 5.0, max_delay: float = 60.0) -> str:
    """Poll with exponential backoff."""
    delay = initial_delay

    while True:
        try:
            result = check_job_status(job_id)
            if result:
                return result
        except TransientError:
            pass

        time.sleep(delay)
        delay = min(delay * 1.5, max_delay)
```

## Request Configuration

### Research-Optimized Settings

```python
RESEARCH_CONFIG = {
    "temperature": 0.7,      # Balance creativity/accuracy
    "max_output_tokens": 8192,  # Allow long reports
    "top_p": 0.95,
    "top_k": 40,
}
```

### Citation-Heavy Research

```python
CITATION_CONFIG = {
    "temperature": 0.3,      # More deterministic
    "max_output_tokens": 16384,  # Extra room for citations
    "response_mime_type": "text/plain",  # Structured markdown
}
```

## System Instructions

Prepend system instructions to shape research behavior:

```python
RESEARCH_SYSTEM_PROMPT = """
You are a research assistant producing well-cited reports.

Requirements:
- Cite all factual claims with URLs
- Use markdown formatting
- Include an executive summary
- Flag low-confidence statements with [UNCERTAIN]
- Prefer primary sources over aggregators
- Include a "Sources" section at the end

Output format:
## Executive Summary
[2-3 sentence overview]

## Key Findings
[Numbered findings with inline citations]

## Analysis
[Detailed discussion]

## Risks and Unknowns
[Caveats and limitations]

## Sources
[Numbered list of all URLs cited]
"""

def submit_with_system(prompt: str) -> str:
    """Submit with research-optimized system prompt."""
    full_prompt = f"{RESEARCH_SYSTEM_PROMPT}\n\n---\n\nResearch Request:\n{prompt}"
    return submit_sync(full_prompt)
```

## Error Handling

### Common Errors

```python
from google.api_core import exceptions

def handle_api_errors(func):
    """Decorator for API error handling."""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except exceptions.ResourceExhausted:
            raise RateLimitError("API quota exceeded. Wait and retry.")
        except exceptions.InvalidArgument as e:
            raise ValidationError(f"Invalid request: {e}")
        except exceptions.NotFound:
            raise NotFoundError("Model or resource not found")
        except exceptions.DeadlineExceeded:
            raise TimeoutError("Request timed out")
        except Exception as e:
            raise APIError(f"Unexpected error: {e}")
    return wrapper
```

### Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=60)
)
def submit_with_retry(prompt: str) -> str:
    """Submit with automatic retry on transient failures."""
    return submit_sync(prompt)
```

## Response Parsing

### Extract Structured Sections

```python
import re

def parse_report_sections(report: str) -> dict:
    """Parse markdown report into sections."""
    sections = {}
    current_section = "preamble"
    current_content = []

    for line in report.split("\n"):
        if line.startswith("## "):
            if current_content:
                sections[current_section] = "\n".join(current_content).strip()
            current_section = line[3:].strip().lower().replace(" ", "_")
            current_content = []
        else:
            current_content.append(line)

    if current_content:
        sections[current_section] = "\n".join(current_content).strip()

    return sections
```

### Extract Inline Citations

```python
URL_PATTERN = re.compile(r'https?://[^\s\)\]\"\']+')

def extract_urls(text: str) -> list[str]:
    """Extract all URLs from text."""
    return list(set(URL_PATTERN.findall(text)))
```

## Rate Limiting

### Token Bucket Pattern

```python
import threading
import time

class RateLimiter:
    """Simple token bucket rate limiter."""

    def __init__(self, requests_per_minute: int = 10):
        self.rpm = requests_per_minute
        self.tokens = requests_per_minute
        self.last_update = time.time()
        self.lock = threading.Lock()

    def acquire(self):
        with self.lock:
            now = time.time()
            elapsed = now - self.last_update
            self.tokens = min(self.rpm, self.tokens + elapsed * (self.rpm / 60))
            self.last_update = now

            if self.tokens < 1:
                sleep_time = (1 - self.tokens) * (60 / self.rpm)
                time.sleep(sleep_time)
                self.tokens = 0
            else:
                self.tokens -= 1

rate_limiter = RateLimiter(requests_per_minute=10)
```

## Testing and Debugging

### Dry Run Mode

```python
def submit_dry_run(prompt: str) -> dict:
    """Return request details without calling API."""
    return {
        "model": DEEP_RESEARCH_AGENT,
        "prompt_length": len(prompt),
        "estimated_tokens": len(prompt) // 4,
        "config": RESEARCH_CONFIG,
        "would_call": "client.models.generate_content",
    }
```

### Verbose Logging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("gemini-research")

def submit_verbose(prompt: str) -> str:
    """Submit with detailed logging."""
    logger.debug(f"Submitting prompt ({len(prompt)} chars)")
    logger.debug(f"Model: {DEEP_RESEARCH_AGENT}")
    logger.debug(f"Config: {RESEARCH_CONFIG}")

    start = time.time()
    result = submit_sync(prompt)
    elapsed = time.time() - start

    logger.info(f"Completed in {elapsed:.1f}s, {len(result)} chars response")
    return result
```
