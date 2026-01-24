# Ambia Skill Evaluation Summary

## What Was Created

Using the mcp-builder skill's evaluation framework, I've created evaluation questions to test the Ambia skill against various Salesforce tasks and information retrieval scenarios.

### Files Created

1. **`evaluation_salesforce_tasks.xml`** - Contains 10 complex, read-only evaluation questions
2. **`EVALUATION_GUIDE.md`** - Guide for creating and verifying evaluation questions
3. **`EVALUATION_SUMMARY.md`** - This summary document

## Evaluation Questions Overview

The evaluation file contains 10 questions that test:

### Navigation and Search (Questions 1-3, 5, 7-10)
- Finding TaskRay Projects by address or project code
- Navigating from Opportunities to TaskRay Projects
- Accessing Related tab → TaskRay Tasks list
- Proper URL verification (`/related/TASKRAY__Tasks__r/view`)

### IX Task Identification (All Questions)
- Filtering by ID prefix `a03US` to identify TaskRay Project Tasks
- Distinguishing from standard Salesforce Tasks (prefix `00T`/`00TD`)
- Finding IX tasks by name patterns (Part 1, Part 2, etc.)

### Task Status and Ownership (Questions 3, 7)
- Reading task statuses (Open, Completed, Holding, Inactive, Not Required)
- Identifying task owners
- Finding tasks by status

### Log Review Extraction (Questions 1, 4, 5, 6, 9, 10)
- Navigating to individual IX task pages
- Accessing Activity Timeline sections
- Extracting log review dates, subjects, descriptions
- Finding most recent or earliest log reviews

### Aggregation and Counting (Questions 2, 8)
- Counting IX tasks by status
- Counting tasks with specific characteristics

## Next Steps: Verification Required

**IMPORTANT**: The answers in `evaluation_salesforce_tasks.xml` are **PLACEHOLDERS** and must be verified by:

1. **Navigating Salesforce in read-only mode**
   - Log into Salesforce
   - Search for real projects using addresses/project codes
   - Navigate to TaskRay Projects and explore real data

2. **Solving each question yourself**
   - For each of the 10 questions, navigate Salesforce and find the answer
   - Document the exact answer you find
   - Verify the answer is stable (won't change over time)

3. **Updating the XML file**
   - Replace placeholder answers with verified real answers
   - Remove any questions that require write operations
   - Ensure all answers are single, verifiable values

4. **Testing the skill** (optional)
   - Once answers are verified, you can test the Ambia skill using the evaluation harness
   - See `EVALUATION_GUIDE.md` for instructions on running evaluations

## Question Design Principles

All questions follow the mcp-builder evaluation guidelines:

- ✅ **Read-only**: No destructive operations required
- ✅ **Independent**: Each question can be solved independently
- ✅ **Complex**: Require multiple tool calls (5-20+)
- ✅ **Realistic**: Test actual Ambia skill workflows
- ✅ **Verifiable**: Single, clear answers
- ✅ **Stable**: Based on historical/completed data

## Testing the Skill

Once answers are verified, you can test the Ambia skill using the evaluation harness from the mcp-builder skill:

```bash
cd ../mcp-builder/scripts
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your_key_here

python evaluation.py \
  -t stdio \
  -c python \
  -a ambia_mcp_server.py \
  -o evaluation_report.md \
  ../Ambia/evaluation_salesforce_tasks.xml
```

## Notes

- All questions test read-only operations (no creating, updating, or deleting)
- Questions use real project codes and addresses from the Ambia skill documentation
- Answers must be verified by actually navigating Salesforce
- Questions test critical workflows: navigation, IX task extraction, log review extraction

