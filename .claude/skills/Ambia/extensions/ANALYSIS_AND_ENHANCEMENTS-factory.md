# Analysis: Email Tasks Folder Content & Ambia Skill Enhancements

**Date**: November 12, 2025  
**Status**: Ready for integration

---

## Executive Summary

The "Handle Good Leap Project Email Tasks" folder contains workflow templates, data schemas, and automation scripts that extend the Ambia Skill with **bulk PTO project status reporting and escalation** capabilities.

**Recommendation**: Integrate as new **Workflow 6** in Ambia Skill.

---

## Content Overview

**HIGH Priority Files**:
- AMBIA Project Lookup Guide (9-step bulk workflow)
- Draft Response Email to Good Leap (stakeholder report template)
- lookup_project_status.csv (data schema with 18 fields)

**MEDIUM Priority Files**:
- create_report.py (markdown report automation)
- project_inputs.json (JSON structure reference)

**Gap Identification**: Ambia Skill covers 1:1 interconnection workflows. Email Tasks folder covers bulk operational workflows (25+ projects with escalation). These are **complementary**.

## Proposed Enhancement: Workflow 6

### New Workflow Name
**"Bulk Project Status Report & Escalation"**

### Trigger Commands
- "Prepare a bulk status report for pending PTO projects"
- "Check status on [N] finance IDs"
- "Generate PTO escalation report for [project list]"

### 7 Execution Phases

**Phase 1: Data Prep**
- Create lookup spreadsheet with 18-column template from AMBIA Project Lookup Guide
- Columns: Finance ID, Borrower Name, State, M2 Fund Date, Days Since M2, Salesforce URL, TaskRay URL, Install Date, Days Since Install, Current Status, Next Steps, TaskRay Next Task, Task Owner, Task Due Date, Est. PTO Date, ETA Source, Priority, Evidence/Notes

**Phase 2: Salesforce Search Batch**
- For each Finance Account ID, use Global Search
- Fallback: Search by Borrower Last Name if ID not found
- Capture: Installation Date, Project Status, TaskRay Project Link

**Phase 3: TaskRay Navigation**
- From TaskRay Project page, navigate to Related → TaskRay Tasks
- Identify current IX task (filter by a03US prefix)
- Extract: Next Task, Task Owner, Task Due Date, Projected PTO (if visible)

**Phase 4: Status Categorization**
- Apply 5-category framework:
  * Active — Awaiting PTO Submission
  * Submitted — Awaiting Utility
  * Blocked — Missing Documents
  * Escalated (blockers exist)
  * PTO Received (system activation pending)

**Phase 5: Prioritization**
- Calculate Days Since M2 Fund / Days Since Install
- Flag projects with 90+ days as **HIGH** priority
- Projects 76-89 days as **MEDIUM**
- Projects <76 days as **LOW**

**Phase 6: Report Generation**
- Generate markdown report with:
  * Executive Summary (counts by status + high-priority list)
  * Per-project detail sections
  * Action items (Immediate, Near-term)

**Phase 7: Escalation**
- Generate Chatter template for high-priority projects missing data
- Generate email template for PM follow-up (24–48 hour SLA)
- Generate escalation template to PM manager if no response
