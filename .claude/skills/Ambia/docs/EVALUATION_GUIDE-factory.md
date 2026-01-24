# Ambia Skill Evaluation Guide

## Overview

This guide explains how to create and verify evaluation questions for the Ambia skill, which coordinates interconnection projects across Salesforce and TaskRay.

## Evaluation Process

### Step 1: Navigate Salesforce in Read-Only Mode

Before creating evaluation questions, navigate Salesforce to gather real data:

1. **Log into Salesforce** (read-only mode is sufficient)
2. **Search for real projects** using addresses or project codes mentioned in the skill documentation
3. **Navigate to TaskRay Projects** and explore:
   - Project names and codes
   - IX task names and statuses
   - Task owners
   - Log review entries in Activity Timelines
   - Task IDs (verify a03US prefix for TaskRay Project Tasks)

### Step 2: Create Evaluation Questions

Based on real Salesforce data, create 10 complex, read-only questions that:

- **Require multiple tool calls**: Each question should need 5-20+ tool calls
- **Test core workflows**: Navigation, search, IX task extraction, log review extraction
- **Have single verifiable answers**: Names, dates, counts, statuses
- **Are stable**: Based on historical/completed data that won't change
- **Are realistic**: Test actual use cases from the Ambia skill

### Step 3: Verify Answers

For each question:

1. **Solve it yourself** using Salesforce navigation (read-only)
2. **Document the exact answer** you found
3. **Update the XML file** with verified answers
4. **Note any questions** that require write operations (remove these)

## Question Categories

### Category 1: Navigation and Search
- Finding projects by address/project code
- Navigating to TaskRay Projects from Opportunities
- Accessing Related tab → TaskRay Tasks list

### Category 2: IX Task Identification
- Filtering by ID prefix a03US
- Distinguishing TaskRay Project Tasks from standard Salesforce Tasks
- Finding IX tasks by name patterns (Part 1, Part 2, etc.)

### Category 3: Task Status and Ownership
- Reading task statuses (Open, Completed, Holding, Inactive, Not Required)
- Identifying task owners
- Finding tasks by status

### Category 4: Log Review Extraction
- Navigating to individual IX task pages
- Accessing Activity Timeline sections
- Extracting log review dates, subjects, descriptions
- Finding most recent or earliest log reviews

### Category 5: Aggregation and Counting
- Counting IX tasks by status
- Counting log review entries
- Finding tasks with specific characteristics

## Example Verification Workflow

For a question like: "Find the IX task with status 'Holding' for project '2633REGA'. What is the owner's name?"

1. Search Salesforce for "2633REGA"
2. Navigate to TaskRay Project page
3. Click Related tab
4. Click TaskRay Tasks link (verify URL contains `/related/TASKRAY__Tasks__r/view`)
5. Filter tasks by ID prefix a03US
6. Find IX task with status "Holding"
7. Read owner name from task page
8. Document answer: "Tonia Crank" (example)

## Running Evaluations

Once you have verified answers, you can test the Ambia skill using the evaluation harness:

```bash
# Navigate to mcp-builder directory
cd ../mcp-builder/scripts

# Install dependencies
pip install -r requirements.txt

# Set API key
export ANTHROPIC_API_KEY=your_key_here

# Run evaluation (if Ambia skill is available as MCP server)
python evaluation.py \
  -t stdio \
  -c python \
  -a ambia_mcp_server.py \
  -o evaluation_report.md \
  ../Ambia/evaluation_salesforce_tasks.xml
```

## Notes

- **All questions must be read-only**: No creating, updating, or deleting records
- **Answers must be stable**: Use historical/completed data, not current dynamic state
- **Verify before testing**: Always solve questions yourself first to ensure answers are correct
- **Update answers**: Replace placeholder answers with verified real answers from Salesforce

