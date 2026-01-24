"""
Example usage of DSPy-style prompt templates for Ambia skill.

These examples show how to use the structured prompt templates from DSPY_PROMPTS.md
to improve reasoning consistency and quality.

Note: These are standalone examples. For full DSPy implementation, you would:
1. Install DSPy: pip install dspy-ai
2. Define Signatures (see DSPY_ANALYSIS.md)
3. Create Examples from historical data
4. Use ChainOfThought or other DSPy modules
"""

# Example 1: Document Quality Assessment
def assess_document_quality_example():
    """Example of assessing document quality using DSPy-style template."""
    
    # This would be the prompt template filled in
    prompt = """
You are assessing document quality for interconnection application submission.

Document Details:
- Document Name: Ameren_Utility_Bill_2633_Jordan.pdf
- Document Type: utility_bill
- File Format: PDF
- File Size: 2.1 MB
- Last Modified: 2024-11-15

Document Content:
Account number: 1234567890
Service address: 2633 Jordan Ave, St. Louis, MO 63114
Bill date: October 2024
Account holder: John Smith

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
"""
    
    # Expected output (structured)
    expected_output = """
QUALITY_ASSESSMENT: Pass
QUALITY_REASONING: Document is clear, legible, matches customer address (2633 Jordan Ave), and is current (October 2024).
REMEDIATION_NEEDED: None
"""
    
    return prompt, expected_output


# Example 2: Document Completeness Validation
def validate_completeness_example():
    """Example of validating document completeness using DSPy-style template."""
    
    prompt = """
You are validating document completeness for interconnection application submission.

Required Documents (per utility/phase):
- utility_bill (required)
- insurance_cert (required)
- one_line_diagram (required)
- placards (required)
- site_survey (optional)

Available Documents:
- utility_bill: Pass (Ameren_Utility_Bill_2633_Jordan.pdf)
- insurance_cert: Pass (Homeowners_Insurance_2633_Jordan.pdf)
- one_line_diagram: Pass (SLD_2633_Jordan.pdf)
- placards: Pass (Placards_2633_Jordan.pdf)
- site_survey: Missing

Utility-Specific Requirements:
- Ameren Illinois requires utility bill, insurance cert, SLD, and placards
- Site survey is optional but recommended

Provide assessment in this exact format:
COMPLETENESS_PERCENTAGE: [0-100%]
CAN_PROCEED: [Yes/No]
MISSING_CRITICAL: [List critical documents, or "None"]
MISSING_NON_CRITICAL: [List non-critical documents, or "None"]
ASSUMPTIONS_NEEDED: [What assumptions can be made for missing items]
"""
    
    expected_output = """
COMPLETENESS_PERCENTAGE: 80%
CAN_PROCEED: Yes
MISSING_CRITICAL: None
MISSING_NON_CRITICAL: site_survey
ASSUMPTIONS_NEEDED: Can proceed with site survey placeholder; request from customer for follow-up
"""
    
    return prompt, expected_output


# Example 3: Validation Gate Decision
def validate_submission_gate_example():
    """Example of validating submission readiness using DSPy-style template."""
    
    prompt = """
You are validating if an interconnection application is ready for submission.

Attachment Map:
- utility_bill: Pass (Ameren_Utility_Bill_2633_Jordan.pdf)
- insurance_cert: Pass (Homeowners_Insurance_2633_Jordan.pdf)
- one_line_diagram: Pass (SLD_2633_Jordan.pdf)
- placards: Pass (Placards_2633_Jordan.pdf)

Field Map:
- service_address: ✓ (2633 Jordan Ave, St. Louis, MO 63114) - Source: Salesforce_Opportunity.Service_Address__c
- account_number: ✓ (1234567890) - Source: Salesforce_Opportunity.Account_Number__c
- system_size: ✓ (10.5 kW) - Source: TaskRay_Project.System_Size__c
- All required fields: ✓

Fees Information:
- Application fee: $150
- Reviewed: Yes
- Confirmed: Yes

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
"""
    
    expected_output = """
VALIDATION_RESULT: Pass
CHECKLIST_ITEM_1_ATTACHMENTS: Pass - All required attachments present and legible
CHECKLIST_ITEM_2_FIELDS: Pass - All required fields filled with valid values
CHECKLIST_ITEM_3_FEES: Pass - Fees reviewed and confirmed
BLOCKING_ITEMS: None
RECOMMENDATION: Proceed (with user approval)
"""
    
    return prompt, expected_output


# Example 4: Field Mapping
def map_field_to_source_example():
    """Example of mapping portal field to data source using DSPy-style template."""
    
    prompt = """
You are mapping a portal field to the best data source and extracting the value.

Portal Field:
- Field Name: Service Address
- Field Type: text

Available Sources:
Salesforce Fields:
- Service_Address__c = "2633 Jordan Ave, St. Louis, MO 63114"
- Mailing_Address__c = "2633 Jordan Ave, St. Louis, MO 63114"

Drive Documents:
- site_survey.pdf (contains coordinates and site details)

TaskRay Data:
- Address field = "2633 Jordan Ave, St. Louis, MO 63114"

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
"""
    
    expected_output = """
SELECTED_SOURCE: Salesforce_Opportunity
SOURCE_PATH: Service_Address__c
EXTRACTED_VALUE: 2633 Jordan Ave, St. Louis, MO 63114
CONFIDENCE: High - Direct field match, verified in Salesforce Opportunity
"""
    
    return prompt, expected_output


# Example 5: Project State Assessment
def assess_project_state_example():
    """Example of assessing project state using DSPy-style template."""
    
    prompt = """
You are assessing interconnection project state and determining readiness.

Project Context:
- Project: 2633 Jordan Ave, St. Louis, MO 63114
- Opportunity: 2633JORDAN-1
- TaskRay Project: 2633JORDAN-1
- Current Task: Prepare IX Part 1 (Open)

Available Documents:
- utility_bill: Pass
- insurance_cert: Pass
- one_line_diagram: Pass
- placards: Pass
- site_survey: Missing (non-critical)

Current Task Status:
- Prepare IX Part 1: Open
- Request IX Part 1: Not Required
- Receive and Process IX Part 1: Not Started

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
"""
    
    expected_output = """
STATE_ASSESSMENT: Ready
READINESS_SCORE: 85%
BLOCKING_ISSUES: None (site_survey is non-critical, can request)
RECOMMENDED_ACTION: Proceed - 85% complete, all critical documents present, can proceed with assumptions
"""
    
    return prompt, expected_output


# Example 6: Error Diagnosis
def diagnose_error_example():
    """Example of diagnosing blocking issues using DSPy-style template."""
    
    prompt = """
You are diagnosing what is blocking progress on an interconnection task.

Error Context:
Salesforce search for "2633 Jordan" returned no results

Current State:
Need to find project to log Part 1 approval. User provided address "2633 Jordan Ave"

Attempted Actions:
1. Searched Salesforce with "2633 Jordan"
2. Searched TaskRay with "2633 Jordan"
3. Both searches returned no results

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
"""
    
    expected_output = """
BLOCKING_ISSUE: RecordNotFound
ROOT_CAUSE: Search may have included street suffix; Salesforce search requires exact match or address without suffix
RESOLUTION_PLAN: 1. Search "2633 JORDAN" (without "ST" or "AVE"), 2. Check zip code match, 3. Verify in TaskRay projects using project code pattern
SHOULD_ESCALATE: No - Try alternative search patterns first (address without suffix, zip code, project code)
"""
    
    return prompt, expected_output


# Example 7: Workflow Routing
def route_workflow_example():
    """Example of selecting workflow phase using DSPy-style template."""
    
    prompt = """
You are selecting the appropriate workflow phase based on task type and current state.

User Request:
"Log the Part 1 approval for 2633 Jordan Ave"

Current Project State:
- Part 1 task exists in TaskRay
- Approval email received from utility
- Task status: "Receive and Process IX Part 1" (Open)

Task Type:
ProcessApproval

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
"""
    
    expected_output = """
SELECTED_WORKFLOW: ProcessApproval
SELECTED_PHASE: Phase3_ValidateReference
SKIP_PHASES: Phase1_TrainingGuide, Phase2_Context (not needed for approval logging)
REASONING: User request is to log approval, workflow is ProcessApproval. Start with validating the reference (approval email/project match) before proceeding to locate task and log approval.
"""
    
    return prompt, expected_output


if __name__ == "__main__":
    """Print example prompts and outputs."""
    
    print("=" * 80)
    print("DSPy-Style Prompt Template Examples for Ambia Skill")
    print("=" * 80)
    print("\nThese examples show how to use structured prompt templates")
    print("from DSPY_PROMPTS.md for consistent reasoning.\n")
    
    examples = [
        ("1. Document Quality Assessment", assess_document_quality_example),
        ("2. Document Completeness Validation", validate_completeness_example),
        ("3. Validation Gate Decision", validate_submission_gate_example),
        ("4. Field Mapping", map_field_to_source_example),
        ("5. Project State Assessment", assess_project_state_example),
        ("6. Error Diagnosis", diagnose_error_example),
        ("7. Workflow Routing", route_workflow_example),
    ]
    
    for name, func in examples:
        print("-" * 80)
        print(f"\n{name}")
        print("-" * 80)
        prompt, output = func()
        print("\nPROMPT:")
        print(prompt)
        print("\nEXPECTED OUTPUT:")
        print(output)
        print("\n")

