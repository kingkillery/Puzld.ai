# Browser Agent Troubleshooting

Quick solutions for common browser automation problems. Find your error, apply the fix.

---

## Quick Reference

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| Element not found | Page still loading | Wait 2s, retry with `read_page` |
| Click does nothing | Element obscured | Check for modals, dismiss overlays |
| Form input fails | Wrong element type | Use `form_input` for inputs, `computer` for buttons |
| Page is blank | Session expired | Re-authenticate via login flow |
| Wrong data shown | SPA cache stale | Hard refresh or navigate to different page and back |
| Download stuck | Popup blocked | Check for download confirmation dialog |
| Can't find button | Dynamic content | Scroll page, use `find` with natural language |

---

## Authentication Issues

### Session Expired

**Symptoms:**
- Redirect to login page
- "Session timed out" message
- API calls return 401/403
- Blank page where content should be

**Detection (JavaScript):**
```javascript
// Check for login redirects or session warnings
const sessionExpired =
    window.location.href.includes('/login') ||
    window.location.href.includes('/signin') ||
    document.querySelector('.session-expired, .login-form, [class*="timeout"]') !== null;
```

**Solution:**
1. Navigate to login page
2. Re-enter credentials (from Salesforce Utility Database, not chat)
3. Resume workflow from last checkpoint

### SSO/OAuth Loop

**Symptoms:**
- Repeated redirects between domains
- "Authorization required" messages
- Page keeps refreshing

**Solution:**
1. Clear cookies for the domain
2. Start fresh authentication flow
3. Wait for each redirect to complete (3-5s each)

---

## Element Interaction Issues

### Element Not Found

**Symptoms:**
- `find` returns no results
- `read_page` missing expected elements
- "ref_X not found" errors

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Page still loading | Wait 2-3s, re-read page |
| Element off-screen | Scroll down, then retry |
| Dynamic content | Wait for AJAX to complete |
| Wrong page loaded | Verify URL, re-navigate |
| Element in iframe | Switch to iframe context |
| Modal blocking | Dismiss modal first |

**Diagnostic Script:**
```javascript
// Check page state when element not found
JSON.stringify({
    readyState: document.readyState,
    spinners: document.querySelectorAll('[class*="loading"], [class*="spinner"]').length,
    overlays: document.querySelectorAll('.modal, .overlay, [class*="modal"]').length,
    iframes: document.querySelectorAll('iframe').length,
    scrollHeight: document.body.scrollHeight,
    scrollTop: window.scrollY
})
```

### Click Not Registering

**Symptoms:**
- Click succeeds but nothing happens
- Button appears clicked but no action
- Form doesn't submit

**Solutions:**

1. **Check for overlays:**
   ```javascript
   document.querySelectorAll('.modal-backdrop, .overlay').forEach(el => el.remove());
   ```

2. **Verify button is enabled:**
   ```javascript
   const btn = document.querySelector('your-selector');
   console.log('Disabled:', btn.disabled, 'Aria-disabled:', btn.getAttribute('aria-disabled'));
   ```

3. **Force click via JavaScript:**
   ```javascript
   document.querySelector('your-selector').click();
   ```

4. **Double-click if needed** (some elements require it)

### Form Input Not Accepted

**Symptoms:**
- Value doesn't appear in field
- Validation errors after filling
- Field reverts to empty

**Solutions:**

1. **Focus field first:**
   ```javascript
   const field = document.querySelector('#fieldId');
   field.focus();
   field.value = 'new value';
   field.dispatchEvent(new Event('input', {bubbles: true}));
   field.dispatchEvent(new Event('change', {bubbles: true}));
   ```

2. **For React/Angular fields:** Type slowly character-by-character

3. **For dropdowns:** Use `form_input` with option value, not display text

---

## Page Loading Issues

### Page Won't Load

**Symptoms:**
- Blank page
- Infinite loading spinner
- Network timeout

**Solutions:**

| Check | Action |
|-------|--------|
| URL correct? | Verify protocol (https), no typos |
| Network up? | Test with simple URL first |
| Domain blocked? | Check if VPN/proxy needed |
| Server down? | Try different time, check status page |

**Recovery:**
1. Wait 10 seconds
2. Refresh page
3. If still stuck, navigate away and back
4. Last resort: Close tab, start new session

### SPA Not Updating

**Symptoms:**
- URL changed but content didn't
- Stale data showing
- Back button doesn't work as expected

**Albatross-Specific:**
```javascript
// Force Albatross SPA refresh
window.location.reload();
// Or navigate away and back
```

**Solution Pattern:**
1. Navigate to a different section
2. Wait 2 seconds
3. Navigate back to target
4. Data should reload

---

## File Operations

### Download Not Starting

**Symptoms:**
- Click download button, nothing happens
- File not appearing in downloads
- Browser shows "popup blocked"

**Solutions:**

1. Check for confirmation dialogs
2. Look for download link in new tab
3. Try right-click → Save As workflow
4. Check browser download permissions

### Upload Failing

**Symptoms:**
- File picker opens but upload doesn't complete
- Progress bar stuck
- "Upload failed" error

**Solutions:**

1. **Verify file size** - Most portals have limits
2. **Check file type** - Must match allowed formats
3. **Wait for progress** - Large files take time
4. **Check network** - Uploads fail on unstable connections

**File Input Detection:**
```javascript
// Find the actual file input (often hidden)
document.querySelectorAll('input[type="file"]')
```

---

## Portal-Specific Issues

### Albatross

| Issue | Solution |
|-------|----------|
| Queue shows 0 projects | Wait for async load (3s) |
| Export downloads blank | Session expired, re-login |
| Notes not visible | Scroll notes panel to load |
| Project stuck loading | URL has wrong ID, verify |
| Search returns nothing | Clear filters, broader search |

### PowerClerk

| Issue | Solution |
|-------|----------|
| Form step not loading | Wait 5s, check for validation errors |
| Document upload stuck | Check file size <10MB |
| Submit button disabled | Scroll to see required fields |
| Application not found | Check utility portal selection |

### Salesforce/Lightning

| Issue | Solution |
|-------|----------|
| Record page blank | Lightning still loading, wait 5s |
| Lookup field empty | Type slowly, wait for dropdown |
| Toast messages blocking | Wait 3s for auto-dismiss |
| Related list not showing | Click to expand section |
| Edit mode not activating | Check record lock status |

---

## Network and API Issues

### Slow Response

**Threshold indicators:**
- Page load > 10 seconds
- Form submit > 5 seconds
- No response > 30 seconds

**Solutions:**
1. Increase timeout thresholds
2. Add explicit waits
3. Retry with exponential backoff

### API Errors

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 400 | Bad request | Check form data validity |
| 401 | Unauthorized | Re-authenticate |
| 403 | Forbidden | Check permissions/role |
| 404 | Not found | Verify URL/ID correct |
| 429 | Rate limited | Wait 60s, retry |
| 500 | Server error | Wait, retry, escalate |
| 502/503 | Service unavailable | Wait, try later |

---

## Recovery Patterns

### Checkpoint Recovery

When a multi-step workflow fails:

1. **Identify last successful step** (from logs/screenshots)
2. **Navigate directly to that point** (use direct URLs)
3. **Resume from there** (don't restart from beginning)

### Clean Restart

When state is corrupted:

1. Close current tab
2. Create new tab
3. Clear cookies for domain (if needed)
4. Fresh login
5. Direct navigation to target

### Escalation Triggers

Stop and ask user when:
- 3+ retry attempts fail
- CAPTCHA encountered
- Credentials rejected
- Data discrepancy found
- Unexpected modal/dialog

---

## Diagnostic Commands

### Full Page State
```javascript
JSON.stringify({
    url: window.location.href,
    title: document.title,
    ready: document.readyState,
    cookies: document.cookie.length > 0,
    localStorage: Object.keys(localStorage).length,
    sessionStorage: Object.keys(sessionStorage).length,
    spinners: document.querySelectorAll('[class*="load"], [class*="spin"]').length,
    modals: document.querySelectorAll('[class*="modal"]:not([style*="none"])').length,
    errors: document.querySelectorAll('[class*="error"]').length,
    forms: document.querySelectorAll('form').length,
    inputs: document.querySelectorAll('input:not([type="hidden"])').length
}, null, 2)
```

### Network Activity Check
Use `read_network_requests` tool with patterns:
- `urlPattern: "/api/"` - API calls
- `urlPattern: "error"` - Error responses
- `urlPattern: "auth"` - Auth flows

### Console Error Check
Use `read_console_messages` tool with:
- `pattern: "error|fail|exception"`
- `onlyErrors: true`

---

## Prevention Checklist

Before starting a workflow:
- [ ] Verify authenticated (not on login page)
- [ ] Check for session timeout warnings
- [ ] Dismiss any popups/modals
- [ ] Verify correct portal/environment
- [ ] Note current state (for recovery)

During workflow:
- [ ] Wait for page loads to complete
- [ ] Check for errors before proceeding
- [ ] Screenshot at major milestones
- [ ] Track progress for checkpointing

After workflow:
- [ ] Verify expected outcome
- [ ] Capture confirmation/reference numbers
- [ ] Log any new learnings to LEARNINGS.md

---

**Purpose**: Quick problem resolution
**Usage**: Find symptom → Apply solution → If still stuck, escalate to user
