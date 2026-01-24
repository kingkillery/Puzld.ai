# Browser Agent Reliability Patterns

This document defines best practices for reliable, robust browser automation. These patterns help ensure consistent operation on utility portals, enterprise web applications, and form-heavy workflows.

## 1. Consistent Browser Environment

Ensure automation behaves like a standard desktop browser to avoid compatibility issues.

### Standard Desktop Profile

Modern web applications expect certain browser characteristics:

```
User Agent: Standard Chrome on Windows/Mac (match actual browser)
Viewport: 1920x1080 or 1440x900 (common desktop sizes)
Scale Factor: 1 (standard desktop)
Language: en-US
Timezone: Match local system
```

### Why This Matters

- Some utility portals check viewport size for responsive layouts
- Applications may serve different experiences to mobile vs desktop
- Consistency prevents layout-related element targeting issues

## 2. Page Load and Timing Reliability

### Wait for Page Ready State

Don't interact with elements until the page is fully loaded:

```javascript
// Check document ready state
document.readyState === 'complete'

// Wait for specific framework indicators
// React: Check for root element populated
// Angular: Check for ng-app bootstrapped
// SPA: Wait for route change complete
```

### Timing Patterns for Common Operations

| Operation | Wait Strategy |
|-----------|---------------|
| Page navigation | Wait for `readyState: complete` + 1s buffer |
| Form field focus | 300ms after field becomes visible |
| Dropdown open | Wait for options to populate (not just menu open) |
| File upload | Wait for upload progress indicator to complete |
| Button click | Verify button is enabled before clicking |
| Modal dismiss | Wait for modal transition animation to complete |

### Handling Dynamic Content

For SPAs and AJAX-heavy applications:

1. **Wait for loading indicators to disappear** - Spinners, skeleton screens
2. **Watch for content changes** - Table rows populating, lists loading
3. **Monitor network requests** - Wait for XHR/fetch calls to complete

## 3. Element Interaction Reliability

### Click Reliability

Problems with clicks often stem from:
- Element not yet interactive (still loading)
- Element obscured by overlay/modal
- Element outside viewport
- Click coordinates off-center

**Solutions:**

```
1. Scroll element into view first
2. Wait for any overlays to clear
3. Click center of element (not edge)
4. Verify click registered (state change or navigation)
```

### Form Input Reliability

For robust form filling:

```
1. Focus the field first
2. Clear existing content if needed
3. Type with natural cadence (not instant paste)
4. Trigger blur/change events if validation is on-blur
5. Check for validation errors before moving on
```

### File Upload Handling

File uploads are particularly error-prone:

```
1. Find the actual file input element (often hidden)
2. Set the file path/data
3. Wait for upload progress indicator
4. Verify upload completed (preview, filename display)
5. Don't proceed until upload is confirmed
```

## 4. Session and Authentication Management

### Handling Session Timeouts

Enterprise portals often have aggressive session timeouts:

- **Detection**: Watch for redirect to login page
- **Recovery**: Re-authenticate and resume workflow
- **Prevention**: Keep session active with periodic interaction

### Cookie and State Persistence

For multi-step workflows:

- Cookies maintain authentication state
- LocalStorage may hold application state
- SessionStorage lost on tab close - avoid tab switching mid-workflow

### Authentication Flow Patterns

| Portal Type | Typical Flow |
|-------------|--------------|
| PowerClerk | Standard form login, session cookie |
| Salesforce | OAuth/SSO, refresh tokens |
| Albatross | Form login with session persistence |
| Enterprise SSO | Redirect chain, SAML/OIDC |

## 5. Error Detection and Recovery

### Common Error Patterns

| Error Signal | Detection Method | Recovery |
|--------------|------------------|----------|
| Form validation error | Red borders, error messages | Read error, fix field |
| Server error (500) | Error page, toast message | Retry operation |
| Session expired | Redirect to login | Re-authenticate |
| Rate limit | 429 response, "try again" | Wait and retry |
| Element not found | Search returns empty | Scroll, refresh, retry |

### Graceful Degradation

When errors occur:

1. **Screenshot the error state** - For debugging
2. **Log the context** - What action was attempted
3. **Attempt recovery** - Based on error type
4. **Escalate to user** - If recovery fails

### Popup and Modal Handling

Unexpected popups can block workflows:

```
1. Check for modal overlays before each action
2. Common patterns:
   - Cookie consent banners (dismiss/decline)
   - Session timeout warnings (dismiss or handle)
   - Confirmation dialogs (handle appropriately)
   - Chat widgets (minimize if blocking)
3. Handle or dismiss before continuing
```

## 6. Network Reliability

### Handling Slow Connections

Utility portals can be slow. Adapt timing:

- **Increase timeouts** for navigation (30s+)
- **Watch network idle** - Wait for pending requests to complete
- **Retry on timeout** - Network blips happen

### Verifying API Operations

For form submissions and data operations:

```
1. Monitor network requests during submission
2. Verify successful response (200/201/204)
3. Check for error responses in body
4. Wait for UI confirmation of success
```

## 7. Portal-Specific Reliability Patterns

### PowerClerk

- **Multi-step forms**: Each step triggers page reload, wait for it
- **Document uploads**: Progress bar must reach 100%
- **Submission confirmation**: Wait for confirmation number/page
- **Session**: 30-minute timeout typical

### Albatross

- **SPA navigation**: URL changes without full reload
- **Data tables**: Wait for rows to load after navigation
- **Export operations**: File download triggers, wait for completion
- **Notes panel**: Dynamic loading, may need scroll to load more

### Salesforce/TaskRay

- **Lightning components**: Heavy JS, longer load times
- **Lookup fields**: Type-ahead search, wait for results
- **Save operations**: Toast messages indicate success/failure
- **Related lists**: Lazy loaded, click to expand

## 8. Debugging Techniques

### Screenshot at Key Points

```
- After navigation (verify correct page)
- Before critical actions (document state)
- After submissions (capture confirmation)
- On any error (capture error state)
```

### Console Log Monitoring

Watch for JavaScript errors that might indicate problems:

```javascript
// Filter for relevant messages
pattern: "error|failed|exception"
```

### Network Request Inspection

Debug API issues by monitoring:

```
urlPattern: "/api/"  // API calls
urlPattern: "upload" // File uploads
urlPattern: "submit" // Form submissions
```

## 9. Workflow Checkpointing

For long-running operations, implement checkpoints:

```
1. Before starting: Note current state
2. After each major step: Record completion
3. On failure: Know where to resume
4. On success: Clean up checkpoint data
```

### Checkpoint Data to Track

- Current step in workflow
- Form data entered so far
- Files uploaded
- Confirmation numbers received
- Timestamps for each step

## 10. Retry Strategies

### Transient Failures

For temporary issues (network blips, slow loads):

```
Attempt 1: Normal timing
Attempt 2: 2x wait times
Attempt 3: 4x wait times + page refresh
After 3 failures: Escalate to user
```

### Permanent Failures

For issues requiring user intervention:

- CAPTCHA encountered
- Invalid credentials
- Missing required data
- Portal maintenance/downtime

**Action**: Stop, screenshot, report to user with clear explanation.

---

**Purpose**: Reliable automation for utility interconnection workflows
**Focus**: Robustness, error recovery, consistent operation
**NOT for**: Bypassing security controls, unauthorized access, or evasion
