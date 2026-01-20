# Gap Analysis: Plugin vs Research Architecture

## Executive Summary

Comparing the `campaign-agents` plugin against the HiPlan/PARC/HAWK research reveals several architectural gaps that must be addressed for production-grade autonomous coding.

---

## Critical Gaps (Must Fix)

### 1. Missing PARC Reflector Agent
**Research Requirement:** PARC mandates a *separate* agent for self-assessment, isolated from the executor's context to prevent confirmation bias.

**Current State:** Workers self-assess within the same context.

**Fix Required:** Add `agents/task-reflector.md` - an independent agent that evaluates worker output against task specifications.

---

### 2. No Repo Map Generation
**Research Requirement:** HiPlan specifies that planners should never see full file contents. Instead, they operate on a compressed AST "Repo Map" (file tree + signatures + docstrings).

**Current State:** Planners have full file read access, risking context saturation.

**Fix Required:** Add `scripts/generate-repo-map.sh` and update planner prompts to use Repo Map instead of raw files.

---

### 3. Insufficient Circuit Breaker Logic
**Research Requirement:** The Harness must detect "loops of death" where an agent repeatedly fails with the same strategy.

**Current State:** Simple retry count (3 max) without pattern detection.

**Fix Required:** Add loop detection in `config/circuit-breakers.json` with strategy differentiation.

---

### 4. No Entry/Exit Criteria in Task Schema
**Research Requirement:** HiPlan tasks must have explicit Entry Criteria (preconditions) and Exit Criteria (success definitions).

**Current State:** Tasks have "success_criteria" but no formal entry criteria or DAG validation.

**Fix Required:** Update `state/` schema to include entry_criteria, exit_criteria, and dependency validation.

---

## Important Gaps (Should Fix)

### 5. Missing Gemini CLI Integration for DevOps
**Research Suggestion:** Route `devops` tasks (CI/CD, GitHub Actions) to Gemini CLI.

**Current State:** All tasks routed to minimax/GLM workers.

**Fix Required:** Add `config/routing-rules.json` with domain-based model routing.

---

### 6. No GPT-5.2 Cross-Validator
**Research Suggestion:** Use GPT-5.2 as secondary planner for architectural/safety-critical decisions.

**Current State:** Single Opus planner with no cross-validation.

**Fix Required:** Add optional cross-validator in planner workflow.

---

### 7. No Milestone Library (Vector DB)
**Research Requirement:** HiPlan uses RAG over "trajectory segments" from past successful projects.

**Current State:** No vector DB, no trajectory retrieval.

**Fix Required:** Add `config/milestone-library.json` with vector DB configuration.

---

### 8. Weak Security/Network Governance
**Research Requirement:** HAWK Resource Layer must enforce network whitelisting, egress filtering, secret injection.

**Current State:** No network policy, no secret management documentation.

**Fix Required:** Add `config/security-policy.json` and `docs/SECURITY.md`.

---

## Gap Resolution Priority

| Priority | Gap | Impact | Effort |
|----------|-----|--------|--------|
| P0 | PARC Reflector | High | Medium |
| P0 | Circuit Breakers | High | Low |
| P1 | Repo Map | High | Medium |
| P1 | Entry/Exit Criteria | High | Low |
| P2 | Routing Rules | Medium | Low |
| P2 | Milestone Library | Medium | High |
| P3 | Cross-Validator | Low | Medium |
| P3 | Security Policy | Medium | Low |
