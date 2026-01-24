# DSPy-Style Prompt Templates for Ambia

These structured prompt templates follow DSPy signature patterns and can be used immediately to improve reasoning consistency and quality.

## 1. Document Quality Assessment

Use this template when assessing document quality for the Attachment Map.

### Prompt Template

```
You are assessing document quality for interconnection application submission.

Document Details:
- Document Name: {document_name}
- Document Type: {document_type} (utility_bill, insurance, SLD, placard, site_survey, etc.)
- File Format: {file_format}
- File Size: {file_size}
- Last Modified: {last_modified}

Document Content:
{document_preview}

Assessment Criteria:
1. Legibility: Is text clear and readable? (for utility bills, insurance certs)
2. Format: Is file in correct format (PDF preferred for documents, PNG/JPG for photos)?
3. Completeness: Does document contain all required information?
4. Recency: Is document current/valid (check dates for insurance, bills)?
5. Matches Customer: Does document match the project address/customer?

Provide assessment in this exact format:
QUALITY_ASSESSMENT: [Pass/Fail/ReviewNeeded]
QUALITY_REASONING: [One sentence explaining why - cite specific issues if Fail]
REMEDIATION_NEEDED: [What needs to be fixed if Fail, or "None" if Pass]
```

### Example Usage

```
Document Details:
- Document Name: Ameren_Utility_Bill_2633_Jordan.pdf
- Document Type: utility_bill
- File Format: PDF
- File Size: 2.1 MB
- Last Modified: 2024-11-15

Document Content:
[Preview: Account number visible, service address matches 2633 Jordan Ave, bill date 10/2024, clear text]

Assessment Criteria: [as above]

QUALITY_ASSESSMENT: Pass
QUALITY_REASONING: Document is clear, legible, matches customer address, and is current (October 2024).
REMEDIATION_NEEDED: None
```

---

## 2. Document Completeness Validation

Use this template to determine if document set meets completeness threshold.

### Prompt Template

```
You are validating document completeness for interconnection application submission.

Required Documents (per utility/phase):
{required_documents}

Available Documents:
{available_documents}

Utility-Specific Requirements:
{utility_requirements}

Assessment:
1. Count required vs available documents
2. Identify critical missing documents (must have before submission)
3. Identify non-critical missing documents (can proceed with assumptions)
4. Calculate completeness percentage
5. Determine if 70% threshold is met

Provide assessment in this exact format:
COMPLETENESS_PERCENTAGE: [0-100%]
CAN_PROCEED: [Yes/No]
MISSING_CRITICAL: [List critical documents, or "None"]
MISSING_NON_CRITICAL: [List non-critical documents, or "None"]
ASSUMPTIONS_NEEDED: [What assumptions can be made for missing non-critical items]
```

### Example Usage

```
Required Documents: utility_bill, insurance_cert, one_line_diagram, placards, site_survey
Available Documents: utility_bill (Pass), insurance_cert (Pass), one_line_diagram (Pass), placards (Pass), site_survey (Missing)

COMPLETENESS_PERCENTAGE: 80%
CAN_PROCEED: Yes
MISSING_CRITICAL: None
MISSING_NON_CRITICAL: site_survey
ASSUMPTIONS_NEEDED: Can proceed with site survey placeholder; request from customer for follow-up
```

---

## 3. Validation Gate Decision

Use this template at the submission gate to validate readiness.

### Prompt Template

```
You are validating if an interconnection application is ready for submission.

Attachment Map:
{attachment_map}

Field Map:
{field_map}

Fees Information:
{fees_reviewed}

Validation Checklist:
1. Attachment Map: Are all required attachments present and legible?
2. Field Map: Are all required fields filled with valid values?
3. Fees: Have fees been reviewed and confirmed?

Provide validation in this exact format:
VALIDATION_RESULT: [Pass/Fail]
CHECKLIST_ITEM_1_ATTACHMENTS: [Pass/Fail] - [Reason]
CHECKLIST_ITEM_2_FIELDS: [Pass/Fail] - [Reason]
CHECKLIST_ITEM_3_FEES: [Pass/Fail] - [Reason]
BLOCKING_ITEMS: [List items that must be fixed, or "None"]
RECOMMENDATION: [Proceed/Hold/CreateFollowUp]
```

### Example Usage

```
Attachment Map: utility_bill (Pass), insurance_cert (Pass), SLD (Pass), placards (Pass)
Field Map: service_address (✓), account_number (✓), system_size (✓), all fields filled
Fees: $150 application fee, reviewed and confirmed

VALIDATION_RESULT: Pass
CHECKLIST_ITEM_1_ATTACHMENTS: Pass - All required attachments present and legible
CHECKLIST_ITEM_2_FIELDS: Pass - All required fields filled with valid values
CHECKLIST_ITEM_3_FEES: Pass - Fees reviewed and confirmed
BLOCKING_ITEMS: None
RECOMMENDATION: Proceed (with user approval)
```

---

## 4. Field Mapping and Value Extraction

Use this template when mapping portal fields to data sources.

### Prompt Template

```
You are mapping a portal field to the best data source and extracting the value.

Portal Field:
- Field Name: {portal_field_name}
- Field Type: {field_type} (text, number, date, dropdown, file)

Available Sources:
{salesforce_fields}
{drive_documents}
{taskray_data}

Source Priority (in order):
1. Salesforce Opportunity fields (preferred for customer data)
2. TaskRay Task fields (preferred for project data)
3. Drive documents (preferred for documents, specs, diagrams)
4. Site survey (for coordinates only)

Provide mapping in this exact format:
SELECTED_SOURCE: [Salesforce_Opportunity/Drive_Document/TaskRay_Task/Site_Survey]
SOURCE_PATH: [Exact field name or document link]
EXTRACTED_VALUE: [Value ready for form entry]
CONFIDENCE: [High/Medium/Low] - [Reason]
```

### Example Usage

```
Portal Field: Service Address
Available Sources:
- Salesforce: Service_Address__c = "2633 Jordan Ave"
- Drive: site_survey.pdf (contains coordinates)
- TaskRay: Address field = "2633 Jordan Ave"

SELECTED_SOURCE: Salesforce_Opportunity
SOURCE_PATH: Service_Address__c
EXTRACTED_VALUE: 2633 Jordan Ave
CONFIDENCE: High - Direct field match, verified in Salesforce
```

---

## 5. Project State Assessment

Use this template to assess project readiness for next phase.

### Prompt Template

```
You are assessing interconnection project state and determining readiness.

Project Context:
{project_context}

Available Documents:
{available_documents}

Current Task Status:
{current_task_status}

Assessment:
1. What is the current state? (Ready/Blocked/NeedsInfo)
2. What is the readiness percentage? (0-100%)
3. What are blocking issues? (if any)
4. What is the recommended action? (Proceed/Hold/GatherMore)

Provide assessment in this exact format:
STATE_ASSESSMENT: [Ready/Blocked/NeedsInfo]
READINESS_SCORE: [0-100%]
BLOCKING_ISSUES: [List issues, or "None"]
RECOMMENDED_ACTION: [Proceed/Hold/GatherMore] - [Reason]
```

### Example Usage

```
Project Context: Part 1 application for 2633 Jordan Ave, in "Prepare IX Part 1" task
Available Documents: utility_bill (Pass), insurance_cert (Pass), SLD (Pass), missing placards
Current Task Status: Prepare IX Part 1 (Open)

STATE_ASSESSMENT: Ready
READINESS_SCORE: 85%
BLOCKING_ISSUES: None (placards non-critical, can request)
RECOMMENDED_ACTION: Proceed - 85% complete, all critical documents present, can proceed with assumptions
```

---

## 6. Error Diagnosis

Use this template when diagnosing blocking issues.

### Prompt Template

```
You are diagnosing what is blocking progress on an interconnection task.

Error Context:
{error_context}

Current State:
{current_state}

Attempted Actions:
{attempted_actions}

Diagnosis:
1. What is the blocking issue type? (RecordNotFound/DocMissing/Conflict/AuthFailure/Other)
2. What is the root cause?
3. What is the resolution plan?
4. Should this be escalated? (Yes/No)

Provide diagnosis in this exact format:
BLOCKING_ISSUE: [RecordNotFound/DocMissing/Conflict/AuthFailure/Other]
ROOT_CAUSE: [Detailed explanation]
RESOLUTION_PLAN: [Step-by-step plan]
SHOULD_ESCALATE: [Yes/No] - [Reason]
```

### Example Usage

```
Error Context: Salesforce search for "2633 Jordan" returned no results
Current State: Need to find project to log Part 1 approval
Attempted Actions: Searched Salesforce with "2633 Jordan"

BLOCKING_ISSUE: RecordNotFound
ROOT_CAUSE: Search may have included street suffix; try without suffix
RESOLUTION_PLAN: 1. Search "2633 JORDAN" (without "ST" or "AVE"), 2. Check zip code match, 3. Verify in TaskRay projects
SHOULD_ESCALATE: No - Try alternative search patterns first
```

---

## 7. Workflow Routing

Use this template to select the appropriate workflow phase.

### Prompt Template

```
You are selecting the appropriate workflow phase based on task type and current state.

User Request:
{user_request}

Current Project State:
{current_project_state}

Task Type:
{task_type}

Available Workflows:
- ApplicationPrep: For preparing and submitting applications
- ProcessApproval: For logging interconnection approvals
- Search: For finding projects and tasks
- UpdateOwner: For reassigning task owners

Select workflow and phase:
1. Which workflow? (ApplicationPrep/ProcessApproval/Search/UpdateOwner)
2. Which phase? (Phase1_TrainingGuide/Phase2_Context/Phase3_Prep/Phase4_Consolidate/Act)
3. Which phases to skip? (if any, based on completeness)

Provide selection in this exact format:
SELECTED_WORKFLOW: [Workflow name]
SELECTED_PHASE: [Phase name]
SKIP_PHASES: [List phases to skip, or "None"]
REASONING: [Why this workflow/phase was selected]
```

### Example Usage

```
User Request: "Log the Part 1 approval for 2633 Jordan Ave"
Current Project State: Part 1 task exists, approval email received
Task Type: ProcessApproval

SELECTED_WORKFLOW: ProcessApproval
SELECTED_PHASE: Phase3_ValidateReference
SKIP_PHASES: Phase1_TrainingGuide, Phase2_Context (not needed for approval logging)
REASONING: User request is to log approval, workflow is ProcessApproval, start with validating the reference
```

---

## Usage Instructions

### When to Use These Templates

1. **Document Quality Assessment**: Every time you assess a document in the Attachment Map
2. **Document Completeness**: When determining if 70% threshold is met
3. **Validation Gate**: At the submission gate before final submission
4. **Field Mapping**: When mapping portal fields to data sources
5. **Project State Assessment**: When determining if project is ready for next phase
6. **Error Diagnosis**: When something blocks progress and needs diagnosis
7. **Workflow Routing**: When selecting which workflow/phase to use

### Integration with SKILL.md

These templates complement the existing SKILL.md instructions:
- Use them to structure reasoning at decision points
- Follow the exact output format for consistency
- Store outputs in structured format for auditability
- Use outputs to populate Action Plans and Log Review Entries

### Benefits

1. **Consistency**: Same structure for same decisions
2. **Traceability**: Structured outputs are easier to audit
3. **Quality**: Forces explicit reasoning at each decision point
4. **Improvement**: Can collect structured examples for future DSPy optimization

---

## Next Steps

1. **Start using these templates** in your reasoning at decision points
2. **Collect examples** of successful assessments (Pass cases)
3. **Collect examples** of failures (Fail cases) for learning
4. **Refine templates** based on real-world usage patterns
5. **Consider full DSPy implementation** once you have 50+ examples per signature

---

**Status**: Ready to use immediately  
**Format**: Structured prompt templates following DSPy signature patterns  
**Integration**: Can be used with existing SKILL.md workflows

