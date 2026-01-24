---
name: ix-plan-context
description: Automatically inject active plan context at start of work (CodeAct/Manus paradigm). Before any project work, check if an active plan exists and re-hydrate the plan into the LLM's context. This prevents the agent from "losing" its plan across sessions.
usage: Automatic injection at start of project work.
allowed-tools: Read, Bash(python3 -m ix_agent.cli codemode --code)
---

# IX Plan Context Injection

## Purpose
When working on any IX project, automatically check if there's an active execution plan and inject it into the context before proceeding. This ensures the agent knows where it left off in multi-step workflows.

## When to trigger
- FIRST tool call mentions or references a project by name/ID (after analyzing available data)
- When the user asks "what's next" or "where did we leave off?"
- When the agent is about to make a decision about a project action

## What to check
1. Parse the project name/identifier from the context
2. Use `ix.get_active_plan()` to retrieve any existing plan
3. If a plan exists:

### Report to user
- Display the plan summary in a compact format:
  ```
  📋 Active Plan: {project_name} ({plan_id})
  Status: {status} | Progress: {progress_percent}%
  Current: [step X/Y] {description}
  ```

### Inject into context
- Add a concise context block at the start of your response:
  ```
  ## Active Plan
  • Plan: {plan_id} for {project_name} ({utility})
  • Step {current_index+1}/{total}: {current_step_description}
  • Overall: {completed} completed, {pending} pending
  • Next pending: {next_pending_description}
  ```

## If no plan exists
The first time working on a project is a good time to call `ix.create_plan()` to establish a workflow.

## How to check (Code Mode)
```python
# Try to get active plan by searching for project name
# Then use the most likely match
plan = ix.get_active_plan("{PROJECT_NAME}")
if plan.get("plan"):
    # Active plan exists
    plan_info = plan["plan"]
    # The 'summary' field contains progress info
    # The 'current_step' field has the active step
else:
    # No active plan
    pass
```

## Integration pattern
1. When you detect a project name in the request, try the lookup first
2. If the project lookup succeeds, get the active plan
3. Present the plan summary to the user
4. Use the plan state to inform your recommendations

## Orchestrator Handoff
If a task becomes highly complex or requires multi-utility coordination, consider initiating the `orchestrator` agent via `python -m ix_agent.cli orchestrate "task description"`. The Orchestrator uses Gemini 3 Flash to manage high-level reasoning and plan alignment.

## Example
User: "What's next for Smith Residence?"

Agent actions:
1. Lookup "Smith Residence" → get project + utility
2. Get active plan for "Smith Residence" (find by project_name)
3. Report plan status:
   ```
   📋 Active Plan: smith-residence-pse-20250130
   Status: ACTIVE | Progress: 33%
   Current: [2/3] Submit missing documents
   Next pending: [3/3] Verify submission
   ```
4. Provide suggestions like:
   - "Continue with step 2: Submit missing documents (requires approval)"
   - "View full plan: ix.get_all_active_plans()"