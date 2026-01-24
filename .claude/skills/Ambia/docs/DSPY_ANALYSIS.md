# DSPy Integration Analysis for Ambia Skill

## Executive Summary

After analyzing the Ambia skill using the DSPy framework patterns, **YES - the Ambia skill would significantly benefit from DSPy-type prompts** in several critical decision-making areas. DSPy's declarative, test-driven reasoning approach aligns perfectly with Ambia's need for structured validation, state assessment, and autonomous decision-making.

## Key Findings

### High-Value Integration Points

The Ambia skill has multiple decision points where DSPy patterns would improve:
1. **Project State Assessment** - Currently uses heuristic rules; DSPy could learn from examples
2. **Document Completeness Validation** - 70% threshold is rule-based; could be data-driven
3. **Document Quality Assessment** - Pass/fail decisions need consistent reasoning
4. **Field Mapping** - Matching portal fields to data sources requires structured reasoning
5. **Workflow Routing** - Phase selection could benefit from learned patterns
6. **Error Diagnosis** - Systematic problem identification would improve with examples

---

## Specific DSPy Signatures Recommended

### 1. Project State Assessment

**Current Approach**: Rule-based decisions about project readiness
**DSPy Benefit**: Learn from historical project state examples

```python
class AssessProjectState(Signature):
    """Assess interconnection project state and determine readiness for next phase."""
    
    project_context: str = InputField(desc="Current project details from Salesforce/TaskRay")
    available_documents: str = InputField(desc="List of available documents from Drive")
    current_task_status: str = InputField(desc="Current IX task status (Prepare/Request/Receive)")
    
    state_assessment: str = OutputField(desc="Current state: Ready/Blocked/NeedsInfo")
    readiness_score: str = OutputField(desc="Readiness percentage (0-100%)")
    blocking_issues: str = OutputField(desc="List of blocking issues, if any")
    recommended_action: str = OutputField(desc="Next action: Proceed/Hold/GatherMore")
```

**Example Training Data**:
- Project with all Part 1 docs → Ready → Proceed to submission
- Project missing utility bill → Blocked → GatherMore
- Project with 85% docs → Ready → Proceed with assumptions

**Integration Point**: Lines 83-87 in SKILL.md (Context Gathering Budget and Early-Stop)

---

### 2. Document Completeness Validation

**Current Approach**: Hard-coded 70% threshold
**DSPy Benefit**: Learn optimal thresholds from historical success/failure patterns

```python
class ValidateDocumentCompleteness(Signature):
    """Validate if document set meets completeness threshold for proceeding."""
    
    required_documents: str = InputField(desc="List of required documents per utility/phase")
    available_documents: str = InputField(desc="List of available documents with pass/fail status")
    utility_requirements: str = InputField(desc="Utility-specific requirements from training guides")
    
    completeness_percentage: str = OutputField(desc="Calculated completeness (0-100%)")
    can_proceed: str = OutputField(desc="Yes/No - can proceed to next phase")
    missing_critical: str = OutputField(desc="List of critical missing documents")
    assumptions_needed: str = OutputField(desc="What assumptions can be made for missing items")
```

**Example Training Data**:
- 8/10 docs present, all critical present → 80% → Yes → Proceed
- 7/10 docs present, utility bill missing → 70% → No → Missing critical
- 6/10 docs present, missing non-critical → 60% → Yes → Proceed with assumptions

**Integration Point**: Lines 81-82 in SKILL.md (Gemini Drive Fast-Scan validation)

---

### 3. Document Quality Assessment

**Current Approach**: Binary pass/fail based on subjective assessment
**DSPy Benefit**: Consistent, learned quality standards

```python
class AssessDocumentQuality(Signature):
    """Assess if a document meets quality standards for submission."""
    
    document_name: str = InputField(desc="Document filename")
    document_type: str = InputField(desc="Type: utility_bill, insurance, SLD, placard, etc.")
    document_metadata: str = InputField(desc="File size, format, last modified date")
    document_preview: str = InputField(desc="Text content or image description if available")
    
    quality_assessment: str = OutputField(desc="Pass/Fail/ReviewNeeded")
    quality_reasoning: str = OutputField(desc="Why this assessment (legibility, format, completeness)")
    remediation_needed: str = OutputField(desc="What needs to be fixed if Fail")
```

**Example Training Data**:
- Utility bill, 300dpi PDF, clear text → Pass → Legible, correct format
- Utility bill, 72dpi image, blurry text → Fail → Resolution too low, request rescan
- Insurance cert, PDF, valid dates → Pass → Complete and current

**Integration Point**: Lines 79-80 in SKILL.md (Attachment Map pass/fail assessment)

---

### 4. Field Mapping and Value Source Selection

**Current Approach**: Rule-based preference (Salesforce > Drive > Spec)
**DSPy Benefit**: Learn optimal source selection from successful submissions

```python
class MapFieldToSource(Signature):
    """Map a portal field to the best data source and extract value."""
    
    portal_field_name: str = InputField(desc="Name of field in portal form")
    portal_field_type: str = InputField(desc="Type: text, number, date, dropdown, file")
    available_sources: str = InputField(desc="Available sources: Salesforce fields, Drive docs, TaskRay data")
    
    selected_source: str = OutputField(desc="Best source: Salesforce_Opportunity/Drive_Document/TaskRay_Task")
    source_path: str = OutputField(desc="Exact path: field name or document link")
    extracted_value: str = OutputField(desc="Extracted value ready for form")
    confidence: str = OutputField(desc="High/Medium/Low - confidence in value correctness")
```

**Example Training Data**:
- "Service Address" → Salesforce Opportunity → Service_Address__c → "2633 Jordan Ave"
- "One-Line Diagram" → Drive Document → SLD.pdf → Link to file
- "Project Owner" → TaskRay Task → Owner field → "Tonia Crank"

**Integration Point**: Lines 129-137 in SKILL.md (Page Rubric - Field Map)

---

### 5. Workflow Routing and Phase Selection

**Current Approach**: Decision tree with hard-coded paths
**DSPy Benefit**: Learn optimal routing from historical workflow outcomes

```python
class SelectWorkflowPhase(Signature):
    """Select the appropriate workflow phase based on task type and current state."""
    
    user_request: str = InputField(desc="User's request or task description")
    current_project_state: str = InputField(desc="Current state from Salesforce/TaskRay")
    task_type: str = InputField(desc="Type: ApplicationPrep, Approval, UpdateOwner, Search")
    
    selected_workflow: str = OutputField(desc="Workflow: ApplicationPrep/ProcessApproval/Search/UpdateOwner")
    selected_phase: str = OutputField(desc="Phase: Phase1_TrainingGuide/Phase2_Context/Phase3_Prep/Phase4_Consolidate/Act")
    skip_phases: str = OutputField(desc="Phases to skip (if any) based on completeness")
    reasoning: str = OutputField(desc="Why this workflow/phase was selected")
```

**Example Training Data**:
- "Log Part 1 approval" + Part1 task exists → ProcessApproval → Phase3_ValidateReference
- "Prepare application" + No docs gathered → ApplicationPrep → Phase1_TrainingGuide
- "Update owner" + Task found → UpdateOwner → DirectAction

**Integration Point**: Lines 29-32 in SKILL.md (Execution Path Selector)

---

### 6. Error Diagnosis and Blocking Issue Identification

**Current Approach**: Rule-based error handling
**DSPy Benefit**: Systematic diagnosis from error example patterns

```python
class DiagnoseBlockingIssue(Signature):
    """Diagnose what is blocking progress and recommend resolution."""
    
    error_context: str = InputField(desc="Error message, failed action, or blocking condition")
    current_state: str = InputField(desc="Current project/task state")
    attempted_actions: str = InputField(desc="Actions already attempted")
    
    blocking_issue: str = OutputField(desc="Identified issue: RecordNotFound/DocMissing/Conflict/AuthFailure")
    root_cause: str = OutputField(desc="Root cause analysis")
    resolution_plan: str = OutputField(desc="Recommended resolution steps")
    should_escalate: str = OutputField(desc="Yes/No - should create Follow Up task")
```

**Example Training Data**:
- Search returned no results + Address provided → RecordNotFound → Try address without suffix → No
- Portal login failed + Credentials fetched → AuthFailure → Check MFA, attempt reset → Yes (after 1 attempt)
- Document missing + Required for submission → DocMissing → Request from customer → No

**Integration Point**: Lines 354-358 in SKILL.md (Error Handling section)

---

### 7. Validation Gate Decision

**Current Approach**: Manual checklist review
**DSPy Benefit**: Consistent validation with learned criteria

```python
class ValidateSubmissionGate(Signature):
    """Validate if application is ready for submission based on checklist."""
    
    attachment_map: str = InputField(desc="All required attachments with pass/fail status")
    field_map: str = InputField(desc="All required fields with values and sources")
    fees_reviewed: str = InputField(desc="Fee information and review status")
    
    validation_result: str = OutputField(desc="Pass/Fail - ready for submission")
    validation_checklist: str = OutputField(desc="Itemized checklist: all items Pass/Fail")
    blocking_items: str = OutputField(desc="Items that must be fixed before submission")
    recommendation: str = OutputField(desc="Proceed/Hold/CreateFollowUp")
```

**Example Training Data**:
- All attachments Pass, all fields filled, fees reviewed → Pass → Proceed
- 1 attachment Fail, all fields filled → Fail → Hold → Fix attachment
- All attachments Pass, 2 fields missing → Fail → Hold → Gather missing fields

**Integration Point**: Lines 144-152 in SKILL.md (Submission Gate)

---

## Implementation Strategy

### Phase 1: High-Impact, Low-Complexity (Immediate)

1. **Document Quality Assessment** - Most direct impact, easy to collect examples
2. **Validation Gate Decision** - Structured output, clear success criteria

### Phase 2: Medium Complexity (Short-term)

3. **Document Completeness Validation** - Replace 70% rule with learned threshold
4. **Field Mapping** - Improve source selection accuracy

### Phase 3: Higher Complexity (Medium-term)

5. **Project State Assessment** - Requires comprehensive state examples
6. **Workflow Routing** - Needs workflow outcome data
7. **Error Diagnosis** - Requires error pattern database

---

## Benefits of DSPy Integration

### 1. **Consistency**
- Current: Rule-based decisions may vary
- DSPy: Learned patterns from examples ensure consistency

### 2. **Adaptability**
- Current: Hard-coded thresholds (70%) may not fit all utilities
- DSPy: Can learn utility-specific thresholds from examples

### 3. **Measurability**
- Current: Success is subjective
- DSPy: Clear metrics and evaluation functions

### 4. **Self-Improvement**
- Current: Manual rule updates
- DSPy: Automatic refinement through RED-GREEN-REFACTOR cycles

### 5. **Traceability**
- Current: Decision rationale may be implicit
- DSPy: Explicit reasoning chains for auditability

---

## Example Integration: Document Quality Assessment

### Current Flow (from SKILL.md lines 79-80):
```
Attachment Map: requirement → file → Drive link → pass/fail (legibility + matches customer)
```

### DSPy-Enhanced Flow:
```python
# Define signature
quality_assessor = ChainOfThought(AssessDocumentQuality)

# For each document in attachment map
for doc in attachment_map:
    assessment = quality_assessor(
        document_name=doc.name,
        document_type=doc.type,
        document_metadata=doc.metadata,
        document_preview=doc.preview_text
    )
    
    # Use structured output
    attachment_map[doc].quality = assessment.quality_assessment
    attachment_map[doc].reasoning = assessment.quality_reasoning
    
    if assessment.quality_assessment == "Fail":
        remediation_plan.append(assessment.remediation_needed)
```

### Benefits:
- Consistent quality standards across all documents
- Clear reasoning for pass/fail decisions
- Actionable remediation steps
- Learn from successful submission patterns

---

## Recommendations

### Immediate Actions

1. **Start with Document Quality Assessment** - Highest impact, easiest to implement
   - Collect 50-100 document examples (pass/fail)
   - Define signature and examples
   - Test with RED-GREEN-REFACTOR cycle

2. **Add Validation Gate Decision** - Structured, clear success criteria
   - Collect submission readiness examples
   - Define checklist validation signature
   - Integrate into submission gate workflow

### Short-term (1-2 months)

3. **Enhance Document Completeness** - Replace 70% rule
   - Collect historical completeness data
   - Learn utility-specific thresholds
   - A/B test against current rule

4. **Improve Field Mapping** - Better source selection
   - Collect field mapping examples from successful submissions
   - Learn source priority patterns
   - Reduce manual field mapping errors

### Medium-term (3-6 months)

5. **Implement Project State Assessment** - Comprehensive state reasoning
6. **Add Workflow Routing** - Learned path selection
7. **Enhance Error Diagnosis** - Systematic problem solving

---

## Conclusion

The Ambia skill has **7 critical decision points** where DSPy patterns would significantly improve reasoning quality, consistency, and adaptability. Starting with **Document Quality Assessment** and **Validation Gate Decision** would provide immediate value with minimal complexity.

The DSPy framework's declarative, example-driven approach aligns perfectly with Ambia's need for:
- Structured validation at multiple gates
- Consistent decision-making across similar scenarios  
- Autonomous reasoning with measurable outcomes
- Self-improvement through feedback loops

**Recommendation**: Proceed with DSPy integration, starting with Phase 1 implementations.

---

## References

- DSPy Skill: `using-dspy/SKILL.md`
- DSPy Concepts: `using-dspy/references/dspy-concepts.md`
- Ambia Skill: `Ambia/SKILL.md`
- Ambia Workflows: `Ambia/README.md`

