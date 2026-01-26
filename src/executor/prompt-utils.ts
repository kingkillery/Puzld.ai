/**
 * Shared prompt fragments and utilities for execution plans
 */

/**
 * Standard project structure awareness prompt
 * Used to ground models in the provided project context
 */
export const PROJECT_CONTEXT_PROMPT = `**Project Structure:**
{{project_structure}}

CRITICAL INSTRUCTIONS:
- You HAVE access to the project structure above - USE IT
- Do NOT say "I don't have access to tools" or "I cannot read files"
- Do NOT apologize for limitations - you have all the context you need
- Give a concrete, actionable response referencing specific files/directories
- Act as if you can see and understand the entire project`;

/**
 * Wraps a task with project context
 */
export function withProjectContext(task: string): string {
  return `**Task:** ${task}\n\n${PROJECT_CONTEXT_PROMPT}`;
}

/**
 * Standard critique prompt
 */
export function buildCritiquePrompt(productionRef: string, taskRef: string = '{{prompt}}'): string {
  return `Review and critique this output. Identify issues, suggest improvements, and rate quality (1-10).

**Original task:** ${taskRef}

**Output to review:**
${productionRef}

Provide specific, actionable feedback.`;
}

/**
 * Standard fix prompt
 */
export function buildFixPrompt(productionRef: string, reviewRef: string, taskRef: string = '{{prompt}}'): string {
  return `Fix the issues identified in this review.

**Original task:** ${taskRef}

**Your previous output:**
${productionRef}

**Review feedback:**
${reviewRef}

Provide an improved version addressing all feedback.`;
}
