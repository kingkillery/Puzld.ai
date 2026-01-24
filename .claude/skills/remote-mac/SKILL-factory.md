---
name: remote-mac
description: >
  This skill should be used when the user asks to "connect to the Mac",
  "SSH into Mac", "run command on Mac", "install on Mac", "check Mac status",
  "transfer file to/from Mac", or needs macOS-specific tasks like Xcode builds,
  iOS development, or running Mac-only tools via Tailscale.
version: 2.0.0
---

# Remote Mac Access

Execute commands on Preston's shared Mac via SSH (key-based auth via Tailscale).

## Connection Details

| Property | Value |
|----------|-------|
| **IP** | `100.76.176.119` |
| **Username** | `k` |
| **Auth** | SSH key (no password needed) |
| **Home** | `/Users/jimpizouw` |
| **Homebrew** | `/opt/homebrew/bin` |

## Core Pattern

SSH is pre-configured with key auth. Use directly:

```bash
ssh k@100.76.176.119 "your_command_here"
```

For Homebrew tools, prefix commands:
```bash
ssh k@100.76.176.119 "export PATH=/opt/homebrew/bin:\$PATH && claude --version"
```

## File Transfer (SCP)

```bash
# Upload to Mac
scp local_file.txt k@100.76.176.119:/Users/jimpizouw/file.txt

# Download from Mac
scp k@100.76.176.119:/Users/jimpizouw/file.txt local_file.txt

# Use transfer directory (convention)
scp file.txt k@100.76.176.119:/Users/jimpizouw/transfer/
```

## When to Use

| Scenario | Use Remote Mac | Alternative |
|----------|---------------|-------------|
| macOS commands | Yes | - |
| iOS/Xcode builds | Yes | - |
| Claude Code on Mac | Yes | - |
| Cross-platform tests | Yes | - |
| Local Windows tasks | No | Local tools |
| Browser automation | No | browser-agent |

## Mac Environment

| Tool | Path | Version |
|------|------|---------|
| Claude Code | `/opt/homebrew/bin/claude` | v2.1.14 |
| Node.js | `/opt/homebrew/bin/node` | v25.2.1 |
| npm | `/opt/homebrew/bin/npm` | v11.6.2 |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection refused | Verify Tailscale: `tailscale status` |
| Timeout | Ping test: `ping 100.76.176.119` |
| Command not found | Add `/opt/homebrew/bin` to PATH |
| Permission denied | Check SSH key: `ssh -v k@100.76.176.119` |

## Bidirectional Access

Both directions use SSH key auth (no passwords stored):

| Direction | Command |
|-----------|---------|
| Windows → Mac | `ssh k@100.76.176.119 "cmd"` |
| Mac → Windows | `ssh prest@100.93.214.66 "cmd"` |

## Additional Resources

- **`references/examples.md`** - Multi-command patterns
- **`references/sftp.md`** - Programmatic file transfer (paramiko)
