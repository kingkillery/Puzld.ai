# Salesforce/TaskRay Exploration Task

## Objective
Explore Salesforce Lightning with TaskRay to document DOM structure, navigation patterns, and IX task workflows. This is READ-ONLY exploration - do not modify any data.

## Navigation Pattern
1. Use Global Search to find a project by address
2. Navigate: Search Result → Opportunity → TaskRay Projects (Related) → TaskRay Project
3. On TaskRay Project: Related tab → TaskRay Tasks → Filter for IX tasks (a03US prefix)

## Exploration Tasks

### 1. TaskRay Project Page
- Document the page header structure
- Note the Related tab location
- Document how to access TaskRay Tasks list

### 2. TaskRay Task Page (IX Task)
- Find a task with "IX" in the name
- Document the task detail layout
- Note field selectors: Status, Owner, Due Date
- Document the Activity Timeline component

### 3. Lightning Component Patterns
- Note any `lightning-` prefixed elements
- Document `data-field` attribute patterns
- Capture any useful selector patterns for automation

### 4. Task ID Patterns
- Confirm TaskRay tasks use `a03US` prefix
- Note how to distinguish from standard Salesforce tasks (00T/00TD)

## Output Format
Document findings in structured markdown with:
- DOM selector patterns for LWC components
- Navigation URL patterns
- Field locations and edit patterns
- Screenshot descriptions where helpful

## Safety Rules
- READ ONLY - do not save, submit, or modify
- Do not change task ownership or status
- Do not leave comments or log activities
- If blocked by permissions, document and move on
