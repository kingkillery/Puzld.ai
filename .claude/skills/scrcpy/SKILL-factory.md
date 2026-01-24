---
name: scrcpy
description: >
  Control Android devices from Windows using scrcpy (screen copy).
  WHEN: Control Android tablet, mirror screen, send keyboard/mouse input, wireless control.
  WHEN NOT: Use MouseShare app (deprecated for input injection).
version: 2.0.0
---

# scrcpy - Android Device Control

Control Android devices from Windows PC using keyboard and mouse via USB or WiFi.

## Quick Start (Default: Control-Only Mode with UHID)

**By default, use UHID control-only mode (no video/audio, physical HID simulation):**

### 1. Control via WiFi - RECOMMENDED DEFAULT
```powershell
scrcpy --no-video --no-audio -K -M -s 10.20.0.186:5555
```
> `-K` = UHID keyboard, `-M` = UHID mouse (relative mode, captures mouse in window)

### 2. Control via USB (OTG Mode - Lowest Latency)
```powershell
scrcpy --otg -s A10PRO5700201163
```

### 3. WiFi Auto-connect (First-time Setup)
```powershell
# Auto-detect IP and connect (requires USB first time)
scrcpy --tcpip --no-video --no-audio -K -M
```

**Important:** Click inside the scrcpy window to capture mouse. Press `LAlt`, `LSuper`, or `RSuper` to release mouse back to your PC.

---

## Screen Mirroring (Only When Requested)

**Use these only when the user explicitly asks for screen mirroring:**

### Full Screen Mirror + Control
```powershell
scrcpy -s A10PRO5700201163
```

### Mirror with Size Limit
```powershell
scrcpy -s A10PRO5700201163 --max-size 1920
```

---

## When to Use

| Scenario | Use This Skill? | Instead Use |
|----------|----------------|-------------|
| Control Android from Windows | Yes | - |
| Keyboard/mouse to tablet running VNC | Yes | - |
| Low-latency USB control | Yes (OTG mode) | - |
| Wireless control over WiFi | Yes (UHID mode) | - |
| Screen mirroring + control | Yes | - |
| Accessibility-based input injection | No | scrcpy (works without root) |

---

## Core Concepts

### Connection Modes

| Mode | Connection | Latency | Use Case |
|------|------------|---------|----------|
| **OTG** | USB HID | ~1ms | Lowest latency, VNC control |
| **UHID** | WiFi/ADB TCP | ~5-20ms | Wireless, flexible |
| **Standard** | USB/ADB | ~10ms | Screen mirror + control |

### Why scrcpy Works

scrcpy injects input as `shell` user which has `INJECT_EVENTS` permission. Regular Android apps (like MouseShare) cannot get this permission without root/system signing.

---

## Common Workflows

### Workflow A: VNC Control via USB (Best for Mac Remote Desktop)

1. Connect tablet via USB
2. Run OTG mode (no screen mirror needed):
   ```powershell
   scrcpy --otg -s A10PRO5700201163
   ```
3. Keyboard and mouse now control the tablet

### Workflow B: Wireless Control Setup (Simplified in v3.3+)

1. Connect tablet via USB temporarily
2. Run with auto TCP/IP setup:
   ```powershell
   scrcpy --tcpip --no-video --no-audio -K -M
   ```
3. Disconnect USB cable - connection persists over WiFi!

**Manual method (if auto fails):**
```powershell
adb tcpip 5555
adb connect 10.20.0.186:5555
scrcpy --no-video --no-audio -K -M -s 10.20.0.186:5555
```

### Workflow C: Full Screen Mirror

1. Connect device (USB or WiFi)
2. Run with video:
   ```powershell
   scrcpy -s A10PRO5700201163 --max-size 1920
   ```

---

## Reference

### Key Commands

| Command | Purpose |
|---------|---------|
| `scrcpy --no-video --no-audio -K -M -s <device>` | **DEFAULT: UHID control-only (keyboard + mouse)** |
| `scrcpy --otg -s <device>` | USB HID control only (no ADB needed) |
| `scrcpy -s <device>` | Full mirror + control |
| `scrcpy --max-size 1920` | Limit mirror resolution |
| `scrcpy --turn-screen-off` | Control with screen off |
| `scrcpy --stay-awake` | Keep device awake |

### Key Flags

| Flag | Purpose |
|------|---------|
| `-K` | UHID keyboard mode (simulates physical keyboard) |
| `-M` | UHID mouse mode (relative mouse, captures in window) |
| `--no-video` | Disable video streaming |
| `--no-audio` | Disable audio streaming |
| `--otg` | OTG mode (USB HID, no ADB) |

### ADB Commands

| Command | Purpose |
|---------|---------|
| `adb devices` | List connected devices |
| `adb tcpip 5555` | Enable WiFi debugging |
| `adb connect <ip>:5555` | Connect over WiFi |
| `adb disconnect` | Disconnect WiFi ADB |
| `adb kill-server` | Reset ADB (fixes stuck connections) |

### Key Paths

| Item | Path |
|------|------|
| scrcpy executable | `C:\ProgramData\chocolatey\bin\scrcpy.exe` (v3.3.1 via Chocolatey) |
| scrcpy in PATH | `scrcpy` (available globally) |

### Device Info

| Property | Value |
|----------|-------|
| Tablet Serial | `A10PRO5700201163` |
| Tablet IP | `10.20.0.186` |
| ADB Port | `5555` |

---

## Keyboard Shortcuts (While scrcpy Running)

**MOD = Left Alt or Left Super (configurable via --shortcut-mod)**

| Shortcut | Action |
|----------|--------|
| `MOD+h` | Home button |
| `MOD+b` | Back button |
| `MOD+s` | App switch |
| `MOD+m` | Menu button |
| `MOD+Up` | Volume up |
| `MOD+Down` | Volume down |
| `MOD+p` | Power button |
| `MOD+o` | Turn screen off |
| `MOD+Shift+o` | Turn screen on |
| `MOD+r` | Rotate screen |
| `MOD+n` | Expand notification panel |
| `MOD+Shift+n` | Collapse notification panel |
| `MOD+v` | Paste clipboard |
| `MOD+c` | Copy to clipboard |
| `MOD+x` | Cut |
| `MOD+f` | Toggle fullscreen |
| `MOD+g` | Resize to 1:1 (pixel-perfect) |
| `LAlt/LSuper/RSuper` | Toggle mouse capture (in UHID/AOA mode) |

---

## Advanced Topics

<details>
<summary>Click to expand: Custom Video Encoding</summary>

```powershell
# Use H.265 encoder for better quality
scrcpy --video-codec h265 -s A10PRO5700201163

# Limit bitrate
scrcpy --video-bit-rate 4M -s A10PRO5700201163

# Change buffer size (reduces latency)
scrcpy --display-buffer 0 -s A10PRO5700201163
```

</details>

<details>
<summary>Click to expand: Recording</summary>

```powershell
# Record to file while mirroring
scrcpy --record video.mp4 -s A10PRO5700201163

# Record without mirroring
scrcpy --no-playback --record video.mp4 -s A10PRO5700201163
```

</details>

<details>
<summary>Click to expand: Multiple Devices</summary>

```powershell
# List all devices
adb devices

# Target specific device
scrcpy -s A10PRO5700201163
scrcpy -s 10.20.0.186:5555
```

</details>

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ERROR: Could not find any ADB device` | Run `adb devices` to verify connection |
| `Multiple devices found` | Add `-s <serial>` to specify device |
| `Connection refused` on WiFi | Re-run `adb tcpip 5555` then `adb connect` |
| OTG mode not working | Ensure USB debugging enabled, try different USB port |
| High latency | Use OTG mode, or reduce video bitrate |
| `adb: command not found` | Add scrcpy directory to PATH or use full path |
| Green pointer visible | Disable MouseShare accessibility service on tablet |
| Connection drops | Check WiFi stability, try USB mode |

### Reset Everything

```powershell
# Kill ADB and restart
adb kill-server
adb start-server
adb devices
```

---

## See Also

- [scrcpy GitHub](https://github.com/Genymobile/scrcpy) - Official documentation
- MouseShare project - Original attempt (limited by Android permissions)
