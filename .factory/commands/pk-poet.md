---
description: "Ultimate reasoning paradigm: DISCOVER → ATTACK → FORTIFY → EXECUTE (Self-Discover + Adversary + Poetic)"
argument-hint: <task_description> | --depth shallow|medium|deep --verify tests|lint|both
allowed-tools: view, glob, grep, bash, write, edit
---

# PK-Poet: The Ultimate Intelligence & Reasoning Paradigm

You are running the **PK-Poet** framework - a unified reasoning paradigm that synthesizes three powerful methodologies:

1. **Self-Discover** - Atomic problem analysis with meta-reasoning
2. **Adversary** - Red-team attack simulation and failure-mode analysis
3. **Poetic** - Spec-first planning with verification-first execution

## Task
$ARGUMENTS

---

## The Five Pillars of PK-Poet

### Pillar 0: REASON (Code-as-Reasoning)
*"Think in code, validate in logic"*

Use executable code to validate reasoning and catch logical errors:
- **Type Contracts**: Define types/interfaces BEFORE implementation to catch design flaws
- **Pseudocode Proofs**: Write pseudocode to verify algorithm correctness
- **Assertion-Driven Thinking**: Express invariants as assertions to validate assumptions
- **Test-as-Specification**: Write tests that define expected behavior precisely
- **Executable Examples**: Create runnable examples that demonstrate understanding

**When to use Code-as-Reasoning:**
- Complex algorithms → Write pseudocode first
- Type relationships → Define interfaces to validate structure
- Edge cases → Write test cases to enumerate possibilities
- Invariants → Express as assertions to catch violations
- Integration points → Mock interactions to validate contracts

### Pillar 1: DISCOVER (Self-Discover v5)
*"Understand before you build"*

Atomic problem analysis using structured meta-reasoning:
- **Contract Definition**: Objective, acceptance criteria, assumptions
- **IO Specification**: Inputs, outputs, schemas, validation rules
- **Task Decomposition**: Minimal ordered steps with dependencies
- **Tool Selection**: Choose tools with safety envelopes

### Pillar 2: ATTACK (Adversary Red-Team)
*"Break it before you build it"*

Adversarial simulation to find vulnerabilities:
- **Failure Mode Analysis**: What can go wrong?
- **Edge Case Exploitation**: Boundary conditions, malformed inputs
- **Security Probing**: Injection, privilege escalation, data leaks
- **Race Condition Hunting**: Concurrency issues, timing attacks
- **Resource Exhaustion**: Memory leaks, infinite loops, DoS vectors

### Pillar 3: FORTIFY (Poetic Specification)
*"Defend what you discovered"*

Spec-first planning informed by adversarial findings:
- **Hardened Contract**: Original contract + attack mitigations
- **Defense Layers**: Validation, sanitization, rate limiting, timeouts
- **Verification Gates**: Tests, assertions, invariants at each step
- **Rollback Strategy**: Safe failure modes, recovery procedures
- **Parity Checks**: Dual-path reasoning for critical decisions

### Pillar 4: EXECUTE (Verification-First Implementation)
*"Build with proof, not hope"*

Implementation with continuous verification:
- **Test-First**: Write verification before implementation
- **Incremental Proofs**: Verify each step before proceeding
- **Diff Discipline**: Smallest possible changes with clear rationale
- **Fail-Fast Protocol**: Stop immediately on verification failure
- **Reflection Loops**: Learn from each iteration

---

## Execution Protocol

### Phase 0: REASON (Code-as-Reasoning)

Before natural language analysis, express understanding through code:

```
[REASON]
type_contracts:
  // Define the shape of data BEFORE reasoning about it
  interface TaskInput {
    description: string;
    constraints: Constraint[];
    context?: ProjectContext;
  }

  interface TaskOutput {
    result: ImplementedFeature;
    verification: VerificationResult;
    residualRisks: Risk[];
  }

pseudocode_proof:
  // Validate algorithm correctness through pseudocode
  function solve(task: TaskInput): TaskOutput {
    // Step 1: Decompose
    const steps = decompose(task.description);

    // Step 2: For each step, verify preconditions
    for (const step of steps) {
      assert(step.preconditions.every(p => p.satisfied()));

      // Step 3: Execute with verification
      const result = execute(step);
      assert(step.postconditions.every(p => p.satisfied(result)));
    }

    return compose(steps);
  }

assertions:
  // Invariants that must ALWAYS hold
  - assert(input !== null, "Input must be defined");
  - assert(output.verification.passed, "All verifications must pass");
  - assert(residualRisks.every(r => r.mitigated || r.documented));

test_specifications:
  // Tests that define expected behavior
  describe("TaskSolution", () => {
    it("handles empty input gracefully", () => { ... });
    it("validates all constraints before execution", () => { ... });
    it("rolls back on partial failure", () => { ... });
  });

executable_examples:
  // Runnable examples demonstrating understanding
  // Example 1: Happy path
  const result = solve({ description: "Add feature X", constraints: [] });
  expect(result.verification.passed).toBe(true);

  // Example 2: Edge case
  const edgeResult = solve({ description: "", constraints: [] });
  expect(edgeResult).toThrow("Empty description");
```

**Code-as-Reasoning Guidelines:**
- Write types FIRST to validate your mental model
- Use pseudocode to catch logical errors before implementation
- Express invariants as assertions - if you can't assert it, you don't understand it
- Write test specs to enumerate expected behaviors
- Create examples to validate integration understanding

### Phase 1: DISCOVER

Perform atomic analysis and output the DISCOVER block:

```
[DISCOVER]
contract:
  objective: <what we're building>
  acceptance: <definition of done>
  assumptions: <what we assume is true>

io_spec:
  inputs: <what we receive>
  outputs: <what we produce>
  validation: <how we validate>

decomposition:
  1. <step with dependency>
  2. <step with dependency>
  ...

tools:
  - <tool>: <why and safety envelope>
```

### Phase 2: ATTACK

Red-team the DISCOVER output and output the ATTACK block:

```
[ATTACK]
failure_modes:
  - mode: <what can fail>
    likelihood: high|medium|low
    impact: critical|major|minor
    exploit: <how to trigger it>

edge_cases:
  - input: <problematic input>
    expected_fail: <what breaks>
    attack_vector: <how to weaponize>

security_probes:
  - vulnerability: <security issue>
    severity: critical|high|medium|low
    proof_of_concept: <how to exploit>

resource_attacks:
  - attack: <resource exhaustion method>
    target: <memory|cpu|disk|network>
    mitigation_required: true|false

race_conditions:
  - scenario: <concurrent situation>
    timing_window: <when exploitable>
    consequence: <what happens>
```

### Phase 3: FORTIFY

Create hardened specification informed by ATTACK findings:

```
[FORTIFY]
hardened_contract:
  objective: <same as DISCOVER>
  acceptance: <+ attack-informed criteria>
  invariants: <things that must ALWAYS be true>

defense_layers:
  input_validation:
    - rule: <validation rule>
      defends_against: <attack reference>

  sanitization:
    - transform: <sanitization>
      defends_against: <attack reference>

  rate_limiting:
    - limit: <rate limit>
      defends_against: <attack reference>

  timeouts:
    - timeout: <timeout value>
      defends_against: <attack reference>

verification_gates:
  - gate: <verification checkpoint>
    type: test|assertion|invariant
    blocks: <what it prevents>

rollback_strategy:
  trigger: <when to rollback>
  procedure: <how to rollback>
  recovery: <how to recover>

parity_check:
  approach_a: <primary approach>
  approach_b: <alternative approach>
  decision_criteria: <how to choose>
```

### Phase 4: EXECUTE

Implement with verification-first discipline:

```
[EXECUTE]
iteration: N of M
---
verification_first:
  - test: <test to write BEFORE implementation>
  - assertion: <invariant to add BEFORE code>

implementation:
  files_touched:
    - <file>: <change description>

  changes:
    <minimal diff with rationale>

verification_result:
  $ <test command>
  <output>
  status: pass|fail

reflection:
  worked: <what succeeded>
  failed: <what failed>
  learned: <insight for next iteration>
  next: <next action if continuing>
```

---

## Budgets & Safety Rails

### Iteration Limits
- **MAX_ITERS = 5** unless specified with `--iters N`
- **MAX_FILES_CHANGED = 8** per session
- **MAX_TOOL_CALLS = 50** hard safety limit
- **MAX_ATTACK_VECTORS = 20** per ATTACK phase

### Depth Levels

**--depth shallow** (fast, basic analysis)
- 2 core DISCOVER modules only
- 5 attack vectors maximum
- 2 defense layers
- 2 verification gates

**--depth medium** (balanced, default)
- 4 core + 2 optional DISCOVER modules
- 10 attack vectors
- 4 defense layers
- 4 verification gates

**--depth deep** (thorough, comprehensive)
- 4 core + 6 optional DISCOVER modules
- 20 attack vectors with PoC
- 8 defense layers
- 8 verification gates
- Dual-path parity check required

### Exit Criteria

Stop when:
1. All acceptance criteria met AND
2. All verification gates pass AND
3. All critical attacks mitigated

OR when:
- MAX_ITERS reached
- BUDGET_EXCEEDED
- CRITICAL_ATTACK_UNMITIGATED (stop and report)

---

## Output Format

### Final Summary

```
[PK-POET SUMMARY]
status: DONE|BLOCKED|BUDGET_EXCEEDED|RISK_TOO_HIGH

reason:
  type_contracts_defined: <count>
  pseudocode_validated: true|false
  assertions_defined: <count>
  test_specs_written: <count>
  logic_errors_caught: <count>

discover:
  modules_used: <list>
  decomposition_steps: <count>

attack:
  vectors_found: <count>
  critical: <count>
  mitigated: <count>/<total>

fortify:
  defense_layers: <count>
  verification_gates: <count>
  parity_check: pass|fail|skipped

execute:
  iterations: <count>
  files_changed: <list>
  tests_added: <count>
  all_gates_pass: true|false

residual_risks:
  - <risk that couldn't be fully mitigated>

confidence: 0.00-1.00

next_steps:
  - <recommended follow-up if incomplete>
```

---

## Integration with PuzldAI

PK-Poet can be invoked in multiple ways:

### Via Factory Droid
```bash
droid exec "pk-poet: Add user authentication with JWT"
```

### Via PuzldAI CLI (when integrated)
```bash
pk-puzldai pkpoet "Add user authentication with JWT" --depth deep
```

### As Pre-Analysis for PickBuild
```bash
# Run PK-Poet analysis first
droid exec "pk-poet: Refactor database layer" > analysis.txt

# Use analysis to inform pickbuild
pk-puzldai pickbuild "Refactor database layer" --context analysis.txt
```

### Combining with Other Modes
```bash
# PK-Poet analysis → Consensus implementation
pk-puzldai run "Complex feature" --pre-analyze pkpoet --mode consensus
```

---

## The PK-Poet Philosophy

> **"Reason in code, understand deeply, attack ruthlessly, defend comprehensively, build incrementally."**

**Why Code-as-Reasoning First?**
Natural language is ambiguous. Code is precise. By expressing understanding through types, assertions, and tests BEFORE implementation, we:
1. Catch logical errors before they become bugs
2. Validate our mental model against reality
3. Create executable specifications that serve as documentation
4. Force precision in our thinking

This paradigm ensures:
1. **No surprises** - All failure modes discovered upfront
2. **No vulnerabilities** - Every attack vector has a defense
3. **No regressions** - Verification gates catch problems early
4. **No waste** - Minimal changes with maximum impact

The result is code that is:
- **Correct** - Does what it's supposed to
- **Robust** - Handles edge cases gracefully
- **Secure** - Resists adversarial inputs
- **Maintainable** - Easy to understand and modify

---

## Begin PK-Poet Analysis

Execute the five pillars in order: **REASON → DISCOVER → ATTACK → FORTIFY → EXECUTE**

Start with the REASON phase now - express your understanding through code before natural language analysis.
