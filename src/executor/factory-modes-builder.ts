/**
 * Factory Modes Plan Builders
 *
 * Execution plan builders for factory-droid plugin modes:
 * - poetiq: Verification-first solver (FORMALIZE→TEST→DIVERGE→CONVERGE→SELECT)
 * - adversary: Red-team attack simulation
 * - self-discover: Atomic problem analysis (SELECT→IMPLEMENT→VERIFY)
 * - code-reason: Code-as-reasoning (FORMALIZE→CODE→EXECUTE→VERIFY)
 * - large-feature: Multi-phase feature workflow
 */

import type { AgentName, ExecutionPlan, PlanStep } from './types';
import { generatePlanId, generateStepId } from './utils';

// ============================================================================
// POETIQ MODE - Verification-First Solver
// ============================================================================

export interface PoetiqOptions {
  agent?: AgentName;
  maxCandidates?: number;  // Max candidate approaches (default: 4)
  verifyCommand?: string;  // Test command
  projectStructure?: string;
}

/**
 * Build a Poetiq execution plan
 *
 * Protocol: FORMALIZE → TEST/ORACLE FIRST → DIVERGE → CONVERGE → SELECT+EMIT
 */
export function buildPoetiqPlan(
  prompt: string,
  options: PoetiqOptions = {}
): ExecutionPlan {
  const {
    agent = 'claude',
    maxCandidates = 4,
    verifyCommand,
    projectStructure
  } = options;

  const context: Record<string, unknown> = { max_candidates: maxCandidates };
  if (projectStructure) context.project_structure = projectStructure;
  if (verifyCommand) context.verify_command = verifyCommand;

  const steps: PlanStep[] = [
    // Phase 1: FORMALIZE
    {
      id: generateStepId('formalize', 0),
      agent,
      action: 'analyze',
      prompt: `# POETIQ Phase 1: FORMALIZE

**Task:** {{prompt}}

${projectStructure ? '**Project Structure:**\n{{project_structure}}\n' : ''}

You are POETIQ, a verification-first reasoning engine.

## Non-negotiables
- Do NOT guess. If you cannot verify, identify what's missing.
- Prefer executable proof: tests, assertions, small repros.

## FORMALIZE Instructions
Restate the task as a concrete specification:

\`\`\`
[FORMALIZE]
task_restatement: <precise restatement>

inputs:
  - <input with type and constraints>

outputs:
  - <output with type and format>

constraints:
  - <constraint 1>
  - <constraint 2>

acceptance_criteria:
  - <criterion 1>
  - <criterion 2>

edge_cases:
  - <edge case 1>
  - <edge case 2>
\`\`\`

Formalize the task now.`,
      outputAs: 'formalize_output'
    },

    // Phase 2: TEST/ORACLE FIRST
    {
      id: generateStepId('test_first', 1),
      agent,
      action: 'prompt',
      prompt: `# POETIQ Phase 2: TEST/ORACLE FIRST

**Formalization:**
{{formalize_output}}

## Instructions
Create or extend a test suite that will FAIL for an incorrect solution.

Write executable tests that define success:

\`\`\`
[TEST_ORACLE]
test_type: unit|integration|harness|assertion

tests:
  - name: <test name>
    input: <test input>
    expected: <expected output>
    assertion: <what to assert>

  - name: <edge case test>
    input: <edge input>
    expected: <expected behavior>
    assertion: <what to assert>

executable_harness:
  \`\`\`<language>
  // Test code that can be run
  \`\`\`

verification_command: <how to run tests>
\`\`\`

Create the test oracle now.`,
      dependsOn: [generateStepId('formalize', 0)],
      outputAs: 'test_oracle_output'
    },

    // Phase 3: DIVERGE
    {
      id: generateStepId('diverge', 2),
      agent,
      action: 'prompt',
      prompt: `# POETIQ Phase 3: DIVERGE

**Formalization:**
{{formalize_output}}

**Test Oracle:**
{{test_oracle_output}}

## Instructions
Generate 2-${maxCandidates} distinct candidate approaches.

For each candidate, explain:
- The approach strategy
- Pros and cons
- Why it might pass/fail the tests

\`\`\`
[DIVERGE]
candidates:
  - id: candidate_1
    name: <approach name>
    strategy: <how it works>
    pros:
      - <advantage>
    cons:
      - <disadvantage>
    implementation_sketch:
      \`\`\`
      // Pseudocode or outline
      \`\`\`

  - id: candidate_2
    name: <different approach>
    strategy: <how it differs>
    ...
\`\`\`

Generate candidate approaches now.`,
      dependsOn: [generateStepId('test_first', 1)],
      outputAs: 'diverge_output'
    },

    // Phase 4: CONVERGE
    {
      id: generateStepId('converge', 3),
      agent,
      action: 'prompt',
      role: 'code',
      prompt: `# POETIQ Phase 4: CONVERGE

**Candidates:**
{{diverge_output}}

**Test Oracle:**
{{test_oracle_output}}

${verifyCommand ? `**Verification Command:** \`${verifyCommand}\`\n` : ''}

## Instructions
Implement and test the most promising candidate(s).
If tests fail, iterate with targeted fixes.

\`\`\`
[CONVERGE]
selected_candidate: <which candidate to try first>
reason: <why this one>

implementation:
  files_touched:
    - <file>: <changes>

test_results:
  $ <test command>
  status: pass|fail
  output: <relevant output>

iterations:
  - attempt: 1
    result: <pass/fail>
    fix_if_failed: <what to try next>
\`\`\`

Implement and converge now.`,
      dependsOn: [generateStepId('diverge', 2)],
      outputAs: 'converge_output'
    },

    // Phase 5: SELECT + EMIT
    {
      id: generateStepId('select', 4),
      agent,
      action: 'combine',
      prompt: `# POETIQ Phase 5: SELECT + EMIT

**All Phases:**
- Formalize: {{formalize_output}}
- Test Oracle: {{test_oracle_output}}
- Diverge: {{diverge_output}}
- Converge: {{converge_output}}

## Instructions
Select the simplest passing approach and emit the final result.

\`\`\`
[SELECT + EMIT]
Summary: <1-2 sentence summary of what was accomplished>

Evidence:
  - command: <test command>
    result: pass|fail

Selected_approach: <which candidate won>

Result:
  <final answer, code, or what changed>

Confidence: 0.00-1.00
\`\`\``,
      dependsOn: [generateStepId('converge', 3)],
      outputAs: 'poetiq_result'
    }
  ];

  return {
    id: generatePlanId('poetiq'),
    mode: 'poetiq' as any,
    prompt,
    steps,
    context,
    createdAt: Date.now()
  };
}

// ============================================================================
// ADVERSARY MODE - Red-Team Attack Simulation
// ============================================================================

export interface AdversaryOptions {
  agent?: AgentName;
  targetFiles?: string[];  // Files/paths to analyze
  maxAttackVectors?: number;  // Max attack vectors (default: 15)
  projectStructure?: string;
}

/**
 * Build an Adversary execution plan
 *
 * Red-team analysis: identify weaknesses, produce concrete attack cases
 */
export function buildAdversaryPlan(
  prompt: string,
  options: AdversaryOptions = {}
): ExecutionPlan {
  const {
    agent = 'claude',
    targetFiles = [],
    maxAttackVectors = 15,
    projectStructure
  } = options;

  const context: Record<string, unknown> = {
    max_attack_vectors: maxAttackVectors,
    target_files: targetFiles
  };
  if (projectStructure) context.project_structure = projectStructure;

  const steps: PlanStep[] = [
    // Phase 1: Attack Surface Analysis
    {
      id: generateStepId('surface', 0),
      agent,
      action: 'analyze',
      prompt: `# ADVERSARY Phase 1: Attack Surface Analysis

**Target:** {{prompt}}

${targetFiles.length > 0 ? `**Target Files:** ${targetFiles.join(', ')}\n` : ''}
${projectStructure ? '**Project Structure:**\n{{project_structure}}\n' : ''}

You are an ADVERSARIAL REVIEWER. Your job is to BREAK the implementation.

## Instructions
Identify the attack surface:

\`\`\`
[ATTACK SURFACE]
components:
  - name: <component>
    type: input|auth|data|api|file|network
    trust_boundary: internal|external|user-facing
    risk_level: critical|high|medium|low

entry_points:
  - <where untrusted data enters>

trust_assumptions:
  - <assumption that could be violated>

data_flows:
  - from: <source>
    to: <destination>
    sensitive: true|false
\`\`\`

Analyze the attack surface now.`,
      outputAs: 'surface_output'
    },

    // Phase 2: Vulnerability Discovery
    {
      id: generateStepId('vulns', 1),
      agent,
      action: 'analyze',
      prompt: `# ADVERSARY Phase 2: Vulnerability Discovery

**Attack Surface:**
{{surface_output}}

## Instructions
Identify vulnerabilities across categories:

\`\`\`
[VULNERABILITIES]
input_validation:
  - vuln: <vulnerability>
    location: <file:line or component>
    severity: critical|high|medium|low
    exploit: <how to trigger>

authentication:
  - vuln: <auth bypass or weakness>
    ...

authorization:
  - vuln: <privilege escalation>
    ...

error_handling:
  - vuln: <information disclosure or crash>
    ...

concurrency:
  - vuln: <race condition or deadlock>
    ...

resource_exhaustion:
  - vuln: <DoS vector>
    ...

injection:
  - vuln: <SQL/command/XSS injection>
    ...
\`\`\`

Discover vulnerabilities now (max ${maxAttackVectors}).`,
      dependsOn: [generateStepId('surface', 0)],
      outputAs: 'vulns_output'
    },

    // Phase 3: Proof of Concept
    {
      id: generateStepId('poc', 2),
      agent,
      action: 'prompt',
      prompt: `# ADVERSARY Phase 3: Proof of Concept

**Vulnerabilities:**
{{vulns_output}}

## Instructions
For each critical/high vulnerability, create a concrete proof of concept:

\`\`\`
[PROOF OF CONCEPT]
exploits:
  - vuln_ref: <vulnerability reference>
    poc_type: command|input|script|request

    setup:
      - <prerequisite step>

    exploit:
      \`\`\`
      # Exact commands or inputs to trigger the vulnerability
      \`\`\`

    expected_result: <what happens when exploited>

    evidence: <how to verify exploitation>

repro_script:
  \`\`\`bash
  # Automated reproduction script
  \`\`\`
\`\`\`

Create proof of concepts for critical/high vulnerabilities.`,
      dependsOn: [generateStepId('vulns', 1)],
      outputAs: 'poc_output'
    },

    // Phase 4: Mitigation Recommendations
    {
      id: generateStepId('mitigate', 3),
      agent,
      action: 'combine',
      prompt: `# ADVERSARY Phase 4: Mitigation Report

**All Findings:**
- Attack Surface: {{surface_output}}
- Vulnerabilities: {{vulns_output}}
- Proof of Concepts: {{poc_output}}

## Instructions
Compile the final adversarial report:

\`\`\`
[ADVERSARY REPORT]
summary:
  total_vulnerabilities: <count>
  critical: <count>
  high: <count>
  medium: <count>
  low: <count>

findings:
  - id: <vuln id>
    severity: <level>
    description: <brief>
    location: <file:line>
    poc: <available|not_available>

    fix_suggestion:
      description: <how to fix>
      code_example:
        \`\`\`
        // Fixed code
        \`\`\`
      effort: low|medium|high

priority_order:
  1. <most critical to fix first>
  2. <next priority>
  ...

residual_risks:
  - <risks that remain even after fixes>
\`\`\``,
      dependsOn: [generateStepId('poc', 2)],
      outputAs: 'adversary_report'
    }
  ];

  return {
    id: generatePlanId('adversary'),
    mode: 'adversary' as any,
    prompt,
    steps,
    context,
    createdAt: Date.now()
  };
}

// ============================================================================
// SELF-DISCOVER MODE - Atomic Problem Analysis
// ============================================================================

export interface SelfDiscoverOptions {
  agent?: AgentName;
  depth?: 'shallow' | 'medium' | 'deep';
  projectStructure?: string;
}

/**
 * Build a Self-Discover execution plan
 *
 * SELF-DISCOVER v5: SELECT → IMPLEMENT → VERIFY
 */
export function buildSelfDiscoverPlan(
  prompt: string,
  options: SelfDiscoverOptions = {}
): ExecutionPlan {
  const {
    agent = 'claude',
    depth = 'medium',
    projectStructure
  } = options;

  const moduleConfig = {
    shallow: { core: 2, optional: 0 },
    medium: { core: 4, optional: 2 },
    deep: { core: 4, optional: 6 }
  };

  const context: Record<string, unknown> = {
    depth,
    ...moduleConfig[depth]
  };
  if (projectStructure) context.project_structure = projectStructure;

  const steps: PlanStep[] = [
    // Phase 1: SELECT
    {
      id: generateStepId('select', 0),
      agent,
      action: 'analyze',
      prompt: `# SELF-DISCOVER Phase 1: SELECT

**Task:** {{prompt}}

${projectStructure ? '**Project Structure:**\n{{project_structure}}\n' : ''}

**Depth:** ${depth} (${moduleConfig[depth].core} core + ${moduleConfig[depth].optional} optional modules)

## Core Modules (Always Active)
1. **Define_Task_Contract**: objective, acceptance, assumptions
2. **Define_IO**: inputs, outputs, schemas, validation
3. **Decompose_Task**: minimal ordered steps
4. **Tool_Selection**: choose tools, scope, safety

## Optional Modules (Select 0-6 if relevant)
5. Verification_Strategy: tests, gates, oracles
6. Fault_Tolerance: retry matrix, idempotency, rollback
7. Security_Preflight: PII, secrets, injection, irreversible ops
8. Algorithmic_Complexity: perf hotspots, bounds, budgets
9. Edge_Case_Scan: boundary and malformed inputs
10. Grounding_and_Source: web lookup, citations
11. Ensemble_Parity_Check: dual-path reasoning
12. Adversarial_Sim_Review: failure mode simulation
13. Meta_Reasoning_Refinement: self-correction loop

## Output
\`\`\`ini
[SELECT v5]
meta	task_type	timestamp_utc
<type>	<ISO8601Z>
selected_modules	tier	name	why
core	1	Define_Task_Contract	always
core	2	Define_IO	always
core	3	Decompose_Task	always
core	4	Tool_Selection	always
opt	5	<module>	<reason>
\`\`\`

Select modules now.`,
      outputAs: 'select_output'
    },

    // Phase 2: IMPLEMENT
    {
      id: generateStepId('implement', 1),
      agent,
      action: 'prompt',
      prompt: `# SELF-DISCOVER Phase 2: IMPLEMENT

**Selected Modules:**
{{select_output}}

## Instructions
Create a detailed execution plan based on selected modules.

\`\`\`ini
[IMPLEMENT v5]
constraints	performance_budget_ms	max_retries
5000	3
success_criteria	item
all_tests_pass
no_secrets_leaked
steps	key	action	tool	guardrails	on_error
step01	<action>	<tool>	<guardrails>	<error_handling>
step02	<action>	<tool>	<guardrails>	<error_handling>
...
\`\`\`

Create the implementation plan now.`,
      dependsOn: [generateStepId('select', 0)],
      outputAs: 'implement_output'
    },

    // Phase 3: VERIFY
    {
      id: generateStepId('verify', 2),
      agent,
      action: 'combine',
      prompt: `# SELF-DISCOVER Phase 3: VERIFY

**Implementation Plan:**
{{implement_output}}

## Instructions
Define verification strategy and confidence assessment.

\`\`\`ini
[VERIFY v5]
qa_checks	gate	status	evidence
tests_passed	pending	<how to verify>
no_secrets_leaked	pending	<how to verify>
parity_check	pending	<if applicable>
meta_analysis	type	observation	resolution
<conflict or issue>	<what>	<how resolved>
final_answer	format	confidence	value
<format>	0.00-1.00	<brief answer or artifact pointer>
residual_risks	item
<risk 1>
<risk 2>
\`\`\`

Create verification plan now.`,
      dependsOn: [generateStepId('implement', 1)],
      outputAs: 'selfdiscover_result'
    }
  ];

  return {
    id: generatePlanId('selfdiscover'),
    mode: 'selfdiscover' as any,
    prompt,
    steps,
    context,
    createdAt: Date.now()
  };
}

// ============================================================================
// CODE-REASON MODE - Code as Reasoning Medium
// ============================================================================

export interface CodeReasonOptions {
  agent?: AgentName;
  language?: string;  // Default: python
  projectStructure?: string;
}

/**
 * Build a Code-Reason execution plan
 *
 * REV Protocol: FORMALIZE → CODE-REASON → EXECUTE → VERIFY
 */
export function buildCodeReasonPlan(
  prompt: string,
  options: CodeReasonOptions = {}
): ExecutionPlan {
  const {
    agent = 'claude',
    language = 'python',
    projectStructure
  } = options;

  const context: Record<string, unknown> = { language };
  if (projectStructure) context.project_structure = projectStructure;

  const steps: PlanStep[] = [
    // Phase 1: FORMALIZE
    {
      id: generateStepId('formalize', 0),
      agent,
      action: 'analyze',
      prompt: `# CODE-REASON Phase 1: FORMALIZE

**Problem:** {{prompt}}

You are CODE-REASON, using executable code as your reasoning medium.

## Core Principle
**Code is thought made executable.** Never compute in your head - externalize reasoning into code.

## Instructions
Formalize the problem:

\`\`\`
[FORMALIZE]
problem: <precise restatement>

inputs:
  - name: <input>
    type: <type>
    constraints: <constraints>

outputs:
  - name: <output>
    type: <type>
    format: <format>

constraints:
  - <constraint 1>
  - <constraint 2>

what_needs_computation:
  - <thing to compute>

what_needs_reasoning:
  - <thing to reason about>
\`\`\`

Formalize the problem now.`,
      outputAs: 'formalize_output'
    },

    // Phase 2: CODE-REASON
    {
      id: generateStepId('code', 1),
      agent,
      action: 'prompt',
      role: 'code',
      prompt: `# CODE-REASON Phase 2: CODE-REASON

**Formalization:**
{{formalize_output}}

## Instructions
Write ${language} code that externalizes your reasoning.

Use hint comments for complex operations:
- \`# HINT: Break this into smaller steps\`
- \`# HINT: Check edge cases\`
- \`# HINT: Verify this independently\`

\`\`\`${language}
# ==== REASONING CODE ====
# Problem: <restate>
# Approach: <strategy>

# Step 1: <what this computes>
<code>

# Step 2: <what this computes>
<code>

# Result
print(f"Answer: {result}")
print(f"Reasoning: {explanation}")
\`\`\`

Write the reasoning code now.`,
      dependsOn: [generateStepId('formalize', 0)],
      outputAs: 'code_output'
    },

    // Phase 3: EXECUTE
    {
      id: generateStepId('execute', 2),
      agent,
      action: 'prompt',
      role: 'code',
      prompt: `# CODE-REASON Phase 3: EXECUTE

**Reasoning Code:**
{{code_output}}

## Instructions
Execute the code and capture output.

Run the code and report:
\`\`\`
[EXECUTION]
command: <how you ran it>
output:
  <actual output>
status: success|error
error_if_any: <error message>
\`\`\`

Execute the reasoning code now.`,
      dependsOn: [generateStepId('code', 1)],
      outputAs: 'execute_output'
    },

    // Phase 4: VERIFY
    {
      id: generateStepId('verify', 3),
      agent,
      action: 'combine',
      prompt: `# CODE-REASON Phase 4: VERIFY

**Execution Result:**
{{execute_output}}

## Instructions
Generate independent verification code:

\`\`\`${language}
# ==== VERIFICATION CODE ====
def verify_result(claimed_result):
    # Independent calculation via alternative method
    independent_result = <alternative_approach>

    # Assertions
    assert claimed_result == independent_result

    # Edge case checks
    assert <edge_case_1>
    assert <edge_case_2>

    return "VERIFIED"

print(verify_result(<result>))
\`\`\`

Then compile final answer:

\`\`\`
[CODE-REASON RESULT]
Answer: <the answer>
Confidence: <0.00-1.00>
Verification: VERIFIED|FAILED
Method: <how computed>
\`\`\``,
      dependsOn: [generateStepId('execute', 2)],
      outputAs: 'codereason_result'
    }
  ];

  return {
    id: generatePlanId('codereason'),
    mode: 'codereason' as any,
    prompt,
    steps,
    context,
    createdAt: Date.now()
  };
}

// ============================================================================
// LARGE-FEATURE MODE - Multi-Phase Feature Workflow
// ============================================================================

export interface LargeFeatureOptions {
  agent?: AgentName;
  phases?: number;  // Target number of phases (default: 4-8)
  verifyCommand?: string;
  projectStructure?: string;
}

/**
 * Build a Large-Feature execution plan
 *
 * Workflow: PLAN → PHASE-BY-PHASE → VALIDATE → UPDATE
 */
export function buildLargeFeaturePlan(
  prompt: string,
  options: LargeFeatureOptions = {}
): ExecutionPlan {
  const {
    agent = 'claude',
    phases = 5,
    verifyCommand,
    projectStructure
  } = options;

  const context: Record<string, unknown> = { target_phases: phases };
  if (projectStructure) context.project_structure = projectStructure;
  if (verifyCommand) context.verify_command = verifyCommand;

  const steps: PlanStep[] = [
    // Phase 1: Master Plan
    {
      id: generateStepId('plan', 0),
      agent,
      action: 'analyze',
      prompt: `# LARGE-FEATURE Phase 1: Master Plan

**Feature:** {{prompt}}

${projectStructure ? '**Project Structure:**\n{{project_structure}}\n' : ''}

## Instructions
Create a phased implementation plan with ${phases} phases.

Generate IMPLEMENTATION_PLAN.md content:

\`\`\`markdown
# Implementation Plan: <Feature Name>

## Overview
<1-2 sentence summary>

## Phases

### Phase 1: <Name>
**Goal:** <what this phase accomplishes>
**Dependencies:** none
**Files:**
- <file to modify/create>

**Steps:**
1. <step>
2. <step>

**Acceptance Criteria:**
- [ ] <criterion>

**Validation:**
\`\`\`bash
<command to verify>
\`\`\`

**Rollback:**
<how to undo if needed>

### Phase 2: <Name>
**Dependencies:** Phase 1
...

## Risk Assessment
- <risk and mitigation>

## Timeline Notes
- Phases are independently mergeable
- Each phase has its own PR
\`\`\`

Create the master plan now.`,
      outputAs: 'plan_output'
    },

    // Phase 2: Phase Execution (simplified - in practice would iterate)
    {
      id: generateStepId('execute', 1),
      agent,
      action: 'prompt',
      role: 'code',
      prompt: `# LARGE-FEATURE Phase 2: Execute Phase 1

**Implementation Plan:**
{{plan_output}}

${verifyCommand ? `**Validation Command:** \`${verifyCommand}\`\n` : ''}

## Instructions
Execute Phase 1 of the plan:

1. Read the relevant files
2. Implement the changes for Phase 1 ONLY
3. Run validation immediately after changes
4. Report results

\`\`\`
[PHASE EXECUTION]
phase: 1
status: in_progress|completed|blocked

files_modified:
  - <file>: <change summary>

validation:
  $ <command>
  result: pass|fail

blockers:
  - <any issues>

ready_for_next_phase: true|false
\`\`\`

Execute Phase 1 now.`,
      dependsOn: [generateStepId('plan', 0)],
      outputAs: 'execute_output'
    },

    // Phase 3: Update Plan
    {
      id: generateStepId('update', 2),
      agent,
      action: 'combine',
      prompt: `# LARGE-FEATURE Phase 3: Update Plan

**Original Plan:**
{{plan_output}}

**Execution Result:**
{{execute_output}}

## Instructions
Update the implementation plan based on what was learned:

\`\`\`
[PLAN UPDATE]
phase_1_status: completed|partial|blocked

changes_to_plan:
  - <what changed and why>

updated_phases:
  - phase: 2
    adjustments: <if any>

next_phase_ready: true|false

commit_message: |
  feat(<scope>): <phase 1 summary>

  - <change 1>
  - <change 2>
\`\`\`

Also output the FINAL summary if all planned phases are complete, or the NEXT STEPS if more phases remain.`,
      dependsOn: [generateStepId('execute', 1)],
      outputAs: 'largefeature_result'
    }
  ];

  return {
    id: generatePlanId('largefeature'),
    mode: 'largefeature' as any,
    prompt,
    steps,
    context,
    createdAt: Date.now()
  };
}
