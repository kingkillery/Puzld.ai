# Remote Mac Examples

## Basic Commands

```bash
# System info
ssh k@100.76.176.119 "sw_vers && uname -a"

# Disk usage
ssh k@100.76.176.119 "df -h /"

# Uptime
ssh k@100.76.176.119 "uptime"
```

## Homebrew Tools

Always add Homebrew to PATH for tools like claude, node, npm:

```bash
# Claude Code version
ssh k@100.76.176.119 "export PATH=/opt/homebrew/bin:\$PATH && claude --version"

# Node version
ssh k@100.76.176.119 "export PATH=/opt/homebrew/bin:\$PATH && node --version"

# Install/update Claude Code
ssh k@100.76.176.119 "export PATH=/opt/homebrew/bin:\$PATH && npm update -g @anthropic-ai/claude-code"
```

## Multi-Command Pattern

```bash
ssh k@100.76.176.119 "echo '=== System ===' && sw_vers && echo '=== Disk ===' && df -h /"
```

## File Operations

```bash
# List files
ssh k@100.76.176.119 "ls -la ~/Desktop"

# Create directory
ssh k@100.76.176.119 "mkdir -p ~/transfer"

# Check file exists
ssh k@100.76.176.119 "test -f ~/file.txt && echo EXISTS || echo NOT_FOUND"
```

## Transfer Directory Convention

Both machines use a `transfer/` directory for file exchange:

```bash
# Create on Mac
ssh k@100.76.176.119 "mkdir -p ~/transfer"

# Upload to Mac transfer dir
scp myfile.txt k@100.76.176.119:/Users/jimpizouw/transfer/

# Download from Mac transfer dir
scp k@100.76.176.119:/Users/jimpizouw/transfer/result.txt .
```

## Xcode/iOS

```bash
# List simulators
ssh k@100.76.176.119 "xcrun simctl list devices"

# Build project
ssh k@100.76.176.119 "cd ~/Projects/MyApp && xcodebuild -scheme MyApp"
```
