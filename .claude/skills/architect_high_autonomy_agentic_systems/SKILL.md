---
name: architect_high_autonomy_agentic_systems
version: 2.1.0
description: >-
  A rigorous framework for designing, implementing, and governing high-autonomy agentic 
  systems. This skill operationalizes the transition from passive LLMs to closed-loop 
  agents capable of perception, memory, reasoning, action, and reflection, underpinned 
  by 2024–2025 empirical research (ADAS, System-2 scaling, SWE-bench Verified).
authors:
  - Agentic Research Consensus
tags:
  - autonomous-agents
  - system-architecture
  - cognitive-planning
  - governance
  - aci-design
input_schema:
  type: object
  properties:
    use_case:
      type: string
      description: The operational domain (e.g., "Software Engineering", "Financial Analysis").
    autonomy_level:
      type: string
      enum: ["human_in_the_loop", "semi_autonomous", "fully_autonomous"]
    complexity_profile:
      type: string
      enum: ["linear_sequential", "combinatorial_creative", "algorithmic_precise"]
  required: ["use_case", "complexity_profile"]
---

# Agentic System Architecture

## 1. The Agentic Paradigm
The transition to autonomy relies on the **Agentic Loop**—a recursive feedback mechanism governed by the function:
$$s_{t+1} = \Phi(a_t, \pi(s_t, \mu_t))$$
Where state evolution depends on **Perception ($\Phi$)**, **Memory ($\mu$)**, **Planning ($\Psi$)**, and **Action ($\pi$)**.

### Core Functional Layers
1.  **Perception ($\Phi$):** Interface between agent and environment. Must evolve from raw text to **multimodal grounding** (GUIs, screenshots, audio) and semantic parsing (e.g., repository ASTs).
2.  **Brain/Planning ($\Psi$):** Decomposes objectives. Shifts from linear *Chain-of-Thought* to hierarchical **Tree Search** and recursive decomposition.
3.  **Memory ($\mu$):**
    *   *Episodic:* Records specific subtask outcomes.
    *   *Narrative:* Stores high-level trajectory summaries.
    *   *Mechanism:* Persistent vector databases and **Agentic RAG** (moving beyond static context windows) or Hybrid KG-RAG (Knowledge Graphs).
4.  **Action ($\pi$):** **"Code as Action"** patterns where agents generate/execute Python/Bash scripts via a specialized Agent-Computer Interface (ACI).
5.  **Feedback:** The self-correction loop utilizing internal critique (reflection) and external signals (tool outputs).

## 2. Reasoning Topology Selector
Select the reasoning architecture based on the trade-off between accuracy, latency, and cost.

| Pattern | Mechanism | Best For | Drawbacks |
| :--- | :--- | :--- | :--- |
| **ReAct** | Interleaved Reasoning + Acting | Simple, real-time queries | Myopia; susceptible to infinite loops |
| **Plan-and-Execute** | Planner (High-level) $\to$ Executor (Low-level) | Complex, multi-step dependencies | High latency; brittle initial plans |
| **Tree/Graph of Thoughts** | State space search; parallel path exploration | Combinatorial/Creative problems | Exponential compute cost |
| **PAL** | Program-Aided Language models | Math/Algorithmic tasks | Limited to code-representable logic |
| **System-2 (Test-Time)** | Scale inference compute (Chain-of-Thought search) | High-difficulty logic/reasoning | High inference cost/time |

## 3. Agent-Computer Interface (ACI) Design
Standard human interfaces (CLI/Shell) are suboptimal for agents. ACIs must be engineered with three principles:
1.  **Simplicity:** Concise documentation; minimal few-shot requirement.
2.  **Compactness:** Consolidate operations (e.g., `search_and_read` vs `find` + `cat`) to prevent "turn explosion."
3.  **Informative Feedback:** Return high-signal state changes; suppress noise.

## 4. Optimization & Scaling
*   **Test-Time Compute ("Long Thinking"):** For high-stakes tasks, allocate additional inference FLOPs to search against Process-Based Verifiers (PRMs) before emitting a response.
*   **Automated Design (ADAS):** Utilize meta-agents to programmatically discover and optimize architectures. (e.g., ADAS agents improved math accuracy by 14.4% over hand-designed baselines).

## 5. Governance & Safety
Autonomous systems require **"Defense-in-Depth"** to prevent Malfunction Amplification and Shadow Agent Sprawl.

*   **Infinite Loop Prevention:** Implement "History Trackers" to detect repetitive actions (>3) and trigger forced recovery.
*   **Hallucination Guardrails:**
    *   *Multi-Agent Validation:* Use "Critic" agents to verify "Actor" outputs.
    *   *Policy as Code:* Ground variable business logic in runtime queries, not static prompts.
*   **Benchmarking:** Avoid data leakage. Validate against **SWE-bench Verified** or **SWE-bench+** (post-training cutoff) to ensure out-of-distribution reasoning.

---

# Operational Prompts

## Template: Agentic System Design Generator
Use this prompt to scaffold a new agent architecture based on requirements.

```markdown
You are an Expert AI Architect specializing in High-Autonomy Agentic Systems.
Design an agentic architecture for the following use case: {{USE_CASE}}.

Define the following components:
1.  **Perception Layer:** How will the agent ground itself (Multimodal/Text/API)?
2.  **Reasoning Topology:** Choose between ReAct, Plan-and-Execute, or ToT/GoT based on complexity.
3.  **Memory Strategy:** Define how Episodic vs. Narrative memory will be persisted.
4.  **ACI Definition:** Define 3-5 core "Tools" adhering to principles of Simplicity and Compactness.
5.  **Governance:** Define termination criteria and specific validation steps to prevent infinite loops.

```

## Template: Recursive Self-Improvement (RSIP)

Use this prompt within the "Reflection" layer of the loop.

```markdown
Review your previous output:
{{PREVIOUS_OUTPUT}}

1.  **Identify Weaknesses:** Critically analyze the reasoning path. Are there logical gaps or potential hallucinations?
2.  **Simulate Perspectives:** Adopt the persona of a skeptical domain expert. What would they object to?
3.  **Refine:** Rewrite the solution. If confidence is low, explicitly label the statement as "Speculative" and define what external info is needed.

```

## Template: Code-as-Action Executor (ACI-Compliant)

Use this system prompt for the Action/Executor module.

```markdown
You are an autonomous execution agent. Your goal is to solve the user's request by writing and executing code.
You interact with the system via a specialized Agent-Computer Interface (ACI).

**ACI Rules:**
1.  **Compactness:** Do not perform ls, then cd, then cat. Use the provided `search_and_read` tool to locate and view relevant code in one turn.
2.  **Feedback:** Read the tool output carefully. If an error occurs, analyze the stack trace immediately. Do not blindly retry the same code.
3.  **Persistence:** Your environment is stateful. Variables defined in previous cells remain available.

```

