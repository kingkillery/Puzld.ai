---
name: android-device-testing
description: This skill should be used when the user asks to "test device", "test on device", "run device test", "manual test", "adb test", "install APK", "capture logs", "take screenshot", or needs to interact with connected Android devices via ADB.
---

# Android Device Testing

## Overview

Run manual tests on connected Android devices via ADB. Claude Code has direct device access for installation, logs, screenshots, and UI automation.

## Quick Reference

| Task | Command |
|------|---------|
| List devices | `adb devices` |
| Install APK | `adb install -r <apk>` |
| Uninstall | `adb uninstall <package>` |
| Clear data | `adb shell pm clear <package>` |
| Launch activity | `adb shell am start -n <pkg>/<activity>` |
| Capture logs | `adb logcat -d \| grep <pattern>` |
| Clear logs | `adb logcat -c` |
| Screenshot | `adb exec-out screencap -p > screen.png` |

## Device Commands

### Wake & Input

```bash
# Wake device
adb shell input keyevent KEYCODE_WAKEUP

# Tap at coordinates
adb shell input tap X Y

# Swipe gesture
adb shell input swipe X1 Y1 X2 Y2

# Key events
adb shell input keyevent KEYCODE_BACK
adb shell input keyevent KEYCODE_HOME
```

### App Management

```bash
# Install APK (replace existing)
adb install -r <apk>

# Uninstall app
adb uninstall <package>

# Clear app data
adb shell pm clear <package>

# Launch activity
adb shell am start -n <package>/<activity>

# Force stop app
adb shell am force-stop <package>
```

### Logs & Screenshots

```bash
# Clear logcat
adb logcat -c

# Capture filtered logs
adb logcat -d | grep -E "<pattern>"

# Take screenshot
adb exec-out screencap -p > screen.png

# Screen record (max 180s)
adb shell screenrecord /sdcard/video.mp4
adb pull /sdcard/video.mp4
```

## Testing Flow

1. **Check connection**: `adb devices`
2. **Build app**: `./gradlew assembleDebug`
3. **Install**: `adb install -r app/build/outputs/apk/debug/app-debug.apk`
4. **Clear data**: `adb shell pm clear <package>`
5. **Launch**: `adb shell am start -n <package>/<activity>`
6. **Capture logs**: `adb logcat -d | grep -E "<tags>"`
7. **Screenshot**: `adb exec-out screencap -p > screen.png`

## Common Mistakes

- Forgetting to clear logcat before testing actions
- Not waiting for async operations to complete
- Missing device connection check
- Not clearing app data between test runs

## Best Practices

- Clear logcat before actions to isolate relevant logs
- Wait appropriate time for async operations
- Check both logs and screenshots for verification
- Use specific log tags for filtering
- Always verify device connection first

## Common Log Tags

Adjust for your project:
- `ActivityManager` - Activity lifecycle
- `AndroidRuntime` - Crashes and exceptions
- Project-specific tags as needed

## Requirements

- Android SDK platform-tools (ADB)
- USB debugging enabled on device
- Device connected via USB or WiFi ADB
