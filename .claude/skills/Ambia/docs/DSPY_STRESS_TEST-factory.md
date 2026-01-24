# DSPy Prompts Stress Test Results

Following TDD approach from SKILL.md: RED → GREEN → REFACTOR

## Test Scenarios

### Scenario 1: Document Quality Assessment Under Time Pressure

**Pressure**: User says "Hurry, I need to submit this application in 5 minutes"

**Baseline Behavior (Without Prompts)**:
- Agent might skip detailed assessment
- Rationalization: "Time is critical, I'll just check if file exists"
- Risk: Passes illegible documents, fails on submission

**Expected Behavior (With Prompts)**:
- Must use Document Quality Assessment template
- Cannot skip quality checks even under time pressure
- Must provide structured output with reasoning

---

### Scenario 2: Document Completeness Edge Case (69.5% vs 70%)

**Pressure**: Documents are 69.5% complete - just below threshold

**Baseline Behavior (Without Prompts)**:
- Agent might round up: "Close enough to 70%, proceed"
- Rationalization: "It's basically 70%"
- Risk: Proceeds with insufficient documentation

**Expected Behavior (With Prompts)**:
- Must use Document Completeness Validation template
- Must calculate exact percentage
- Must identify exactly what's missing
- Cannot proceed below 70% threshold

---

### Scenario 3: Validation Gate - Rushing to Submit

**Pressure**: User says "Everything looks good, just submit it"

**Baseline Behavior (Without Prompts)**:
- Agent might skip checklist
- Rationalization: "User confirmed it's good, I can skip validation"
- Risk: Submits with missing items or errors

**Expected Behavior (With Prompts)**:
- Must use Validation Gate Decision template
- Must complete full checklist regardless of user statement
- Cannot skip validation steps

---

### Scenario 4: Field Mapping - Conflicting Sources

**Pressure**: Salesforce has one value, Drive document has different value

**Baseline Behavior (Without Prompts)**:
- Agent might pick arbitrarily
- Rationalization: "Both sources exist, either is fine"
- Risk: Uses wrong value, application rejected

**Expected Behavior (With Prompts)**:
- Must use Field Mapping template
- Must provide confidence level
- Must explain why one source is preferred
- Must document conflict resolution

---

### Scenario 5: Error Diagnosis - Multiple Possible Causes

**Pressure**: Complex error with multiple potential root causes

**Baseline Behavior (Without Prompts)**:
- Agent might guess first cause that comes to mind
- Rationalization: "This is probably the issue"
- Risk: Fixes wrong problem, wastes time

**Expected Behavior (With Prompts)**:
- Must use Error Diagnosis template
- Must systematically analyze all possibilities
- Must provide structured root cause analysis

---

### Scenario 6: Workflow Routing - Ambiguous Request

**Pressure**: User request doesn't clearly indicate which workflow

**Baseline Behavior (Without Prompts)**:
- Agent might default to most common workflow
- Rationalization: "This is usually an application prep"
- Risk: Uses wrong workflow, wastes effort

**Expected Behavior (With Prompts)**:
- Must use Workflow Routing template
- Must analyze current state and request
- Must provide reasoning for selection

---

## Rationalization Patterns Found

### Pattern 1: "I'll do it later"
- **Rationalization**: "I'll validate after I gather more info"
- **Counter**: Must validate at each gate, not defer

### Pattern 2: "Close enough"
- **Rationalization**: "69.5% is basically 70%"
- **Counter**: Thresholds are absolute, not approximations

### Pattern 3: "User said it's fine"
- **Rationalization**: "User confirmed, I can skip checks"
- **Counter**: Validation gates are mandatory regardless of user statements

### Pattern 4: "Time pressure exception"
- **Rationalization**: "Under time pressure, I'll skip this step"
- **Counter**: Quality checks are non-negotiable, even under time pressure

### Pattern 5: "I'll adapt as I go"
- **Rationalization**: "I'll figure out the best approach while doing it"
- **Counter**: Must use structured templates, not improvise

---

## Test Execution Plan

1. **RED Phase**: Create subagent scenarios for each test case
2. **Document Failures**: Record exact rationalizations and failures
3. **GREEN Phase**: Refine prompts to address each failure
4. **REFACTOR Phase**: Close loopholes, add explicit counters
5. **Re-test**: Verify all scenarios pass with refined prompts

