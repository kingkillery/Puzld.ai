# Browser Agent Efficiency Patterns

Master the browser with minimal steps. Do in 1 action what others do in 6.

## Core Principle: Minimize Round Trips

Every tool call is latency. Batch operations, combine actions, and skip unnecessary verification steps when confidence is high.

---

## 1. Smart Action Selection

### One Action, Not Six

**Bad (6 steps):**
```
1. read_page → find button
2. screenshot → verify button visible
3. scroll_to → bring into view
4. screenshot → verify scrolled
5. hover → move to element
6. left_click → click button
```

**Good (1-2 steps):**
```
1. find("submit button") → get ref
2. computer(action: "left_click", ref: "ref_X") → click directly
```

The `ref` parameter handles scrolling automatically. Skip hover unless you need dropdowns.

### Direct Element Interaction

| Task | Inefficient | Efficient |
|------|-------------|-----------|
| Click button | scroll + hover + click | `left_click` with ref |
| Fill form | click field + clear + type | `form_input(ref, value)` |
| Select dropdown | click + wait + click option | `form_input(ref, optionValue)` |
| Navigate | read page + find link + click | `navigate(url)` directly |
| Check checkbox | find + scroll + click | `form_input(ref, true)` |

### When to Use Each Tool

| Tool | Use When | Avoid When |
|------|----------|------------|
| `navigate` | You know the URL | Discovery navigation |
| `form_input` | Setting any form value | Complex interactions |
| `find` | Natural language search | You have exact selectors |
| `read_page` | Understanding page structure | Repeated scans |
| `computer` + click | Dynamic elements, ref-based | Simple form fields |
| `javascript_tool` | Bulk operations, complex logic | Simple reads |

---

## 2. Batch Operations

### Fill Multiple Fields at Once

Instead of individual calls per field, read the form once, then fill all fields:

```
Step 1: read_page(filter: "interactive") → get all field refs
Step 2-N: form_input for each field (can run sequentially fast)
```

### JavaScript for Bulk Operations

When you need to set many values or extract lots of data:

```javascript
// Bulk fill form (one JS call vs N form_input calls)
document.querySelector('#name').value = 'John Doe';
document.querySelector('#email').value = 'john@example.com';
document.querySelector('#phone').value = '555-1234';
// Trigger change events
document.querySelectorAll('input').forEach(i => i.dispatchEvent(new Event('change', {bubbles: true})));
```

```javascript
// Bulk extract data (one JS call vs reading whole page)
JSON.stringify({
  projectId: document.querySelector('.project-id')?.textContent,
  status: document.querySelector('.status-badge')?.textContent,
  owner: document.querySelector('.owner-name')?.textContent
})
```

### Parallel Operations

When actions are independent, don't serialize them. If you need data from multiple tabs or pages, consider whether you can batch the reads.

---

## 3. Skip Unnecessary Verification

### High-Confidence Actions

Skip verification screenshots when:
- URL navigation succeeded (trust the navigate result)
- Form input completed (trust form_input response)
- Simple click registered (trust click response)

### When to Verify

Take screenshots only for:
- **Initial page load** - Verify you're on the right page
- **After complex workflows** - Capture final state
- **On errors** - Debug what went wrong
- **Before submissions** - User needs to approve

### Trust the Tools

The MCP tools report success/failure. Don't screenshot after every action:

```
# BAD: Screenshot after every step
navigate → screenshot → find → screenshot → click → screenshot → type → screenshot

# GOOD: Trust tool responses, screenshot at milestones
navigate → find + click → type multiple fields → screenshot before submit
```

---

## 4. Efficient Navigation Patterns

### Direct URL Navigation

If you know where you're going, go directly:

```
# BAD: Click through menus
read_page → find "Projects" link → click → wait → find "Project 12345" → click

# GOOD: Direct navigation
navigate("https://albatross.myblueraven.com/project/12345/status")
```

### URL Pattern Knowledge

Build URLs directly for common portals:

| Portal | Pattern | Example |
|--------|---------|---------|
| Albatross Project | `/project/{id}/status` | `/project/123456/status` |
| Albatross Queue | `/workQueue/{id}?smartlistId={sid}` | `/workQueue/35?smartlistId=2141` |
| PowerClerk App | `/{utility}/app/{appId}` | Direct link if known |
| Salesforce Record | `/lightning/r/{object}/{id}/view` | Build from ID |

### Avoid Discovery Navigation

If the URL structure is known, don't click through menus. Build the URL and navigate directly.

---

## 5. Smart Waiting Strategies

### Don't Wait Blindly

```
# BAD: Fixed waits
computer(action: "wait", duration: 3)  // Wasted time if page loads fast

# GOOD: Conditional waits
// Use network idle detection or check for specific element
```

### Natural Timing is Often Enough

The tools have built-in wait behavior. Additional explicit waits are often unnecessary:
- `navigate` waits for page load
- `form_input` waits for element
- `left_click` scrolls element into view

Add explicit waits only for:
- Slow SPAs that load data after initial render
- Animations that must complete
- Network operations in progress

---

## 6. Read Page Efficiently

### Use Filters

```
# BAD: Read entire page
read_page(tabId: X)  // Returns everything, huge response

# GOOD: Filter to what you need
read_page(tabId: X, filter: "interactive")  // Just buttons, links, inputs
read_page(tabId: X, ref_id: "ref_123")  // Just one section
read_page(tabId: X, depth: 5)  // Limit tree depth
```

### Use `find` for Natural Language

When looking for something specific:

```
# Instead of read_page + scan through results
find(query: "submit application button", tabId: X)
```

### Cache Page Structure

If you need to interact with multiple elements, read once and use the refs:

```
read_page → get refs for all fields you'll fill
form_input(ref_1, val1)
form_input(ref_2, val2)
form_input(ref_3, val3)
# Don't re-read between each
```

---

## 7. Form Filling Mastery

### Sequential Speed

For forms, don't wait between fields. Fill in rapid succession:

```
form_input(ref_name, "John Doe")
form_input(ref_email, "john@example.com")
form_input(ref_phone, "555-1234")
form_input(ref_address, "123 Main St")
# No waits needed between
```

### Handle Validation at the End

Don't check validation after each field. Fill all fields, then check once at submit time.

### Dropdown Efficiency

```
# BAD: Click dropdown, wait for options, find option, click
computer(action: "left_click", ref: dropdown_ref)
computer(action: "wait", duration: 1)
find("California option")
computer(action: "left_click", ref: option_ref)

# GOOD: Direct value set
form_input(ref: dropdown_ref, value: "CA")
```

---

## 8. Error Recovery Without Waste

### Targeted Retry

Don't restart entire workflows on failure. Retry the specific failed step:

```
# BAD: On click failure, re-read entire page, re-navigate, retry
# GOOD: On click failure, wait 1s, retry same click, then escalate
```

### Progressive Enhancement

```
Attempt 1: Direct action (fast)
Attempt 2: With scroll-to first (medium)
Attempt 3: With screenshot + analysis (slow, but diagnostic)
```

---

## 9. Workflow Templates

### Quick Status Check (3 steps)

```
1. navigate(project_url)
2. javascript_tool: extract key status fields
3. Return data (no screenshot needed)
```

### Form Submission (5 steps)

```
1. navigate(form_url)
2. read_page(filter: "interactive") → get all refs
3. form_input × N fields (rapid fire)
4. screenshot → capture for user review
5. Click submit (after user approval)
```

### Queue Export (2 steps)

```
1. navigate(queue_url)
2. find("Export button") + click → file downloads
```

### Data Extraction (2 steps)

```
1. navigate(page_url)
2. javascript_tool: extract all needed data in one call
```

---

## 10. Anti-Patterns to Avoid

| Anti-Pattern | Problem | Better Approach |
|--------------|---------|-----------------|
| Screenshot after every action | Slow, wastes tokens | Screenshot at milestones |
| Fixed waits everywhere | Wasted time | Trust tool wait behavior |
| Re-reading page repeatedly | Slow, redundant | Cache refs from first read |
| Click-through navigation | Slow, error-prone | Direct URL navigation |
| Individual field validation | Interrupts flow | Validate at end |
| Hover before every click | Unnecessary | Click directly with ref |
| Full page reads | Large responses | Use filters and depth limits |

---

## Efficiency Checklist

Before executing a workflow, ask:

- [ ] Can I navigate directly to the URL instead of clicking through?
- [ ] Can I batch these form inputs?
- [ ] Do I really need that screenshot, or can I trust the tool response?
- [ ] Can I use JavaScript to do this in one call?
- [ ] Am I re-reading the page unnecessarily?
- [ ] Can I use `find` instead of full `read_page`?
- [ ] Have I eliminated unnecessary waits?

---

**Goal**: Maximum speed with maximum reliability
**Measure**: Steps to complete task, not just success
**Mindset**: Every tool call costs time - make each one count
