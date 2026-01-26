/**
 * Smart Task Router
 *
 * Routes tasks to the most capable available agent using:
 * 1. Rule-based task classification (no LLM dependency)
 * 2. Capability cascade: Codex → Claude → Gemini → Droid
 * 3. Harness recommendations for complex reasoning tasks
 *
 * Inspired by state-of-the-art techniques:
 * - PoET (Program of Thoughts) - code as reasoning
 * - Self-Discover - atomic problem decomposition
 * - Chain of Code - executable reasoning
 */

import { Ollama } from 'ollama';
import type { RouteResult } from '../lib/types';
import { getConfig } from '../lib/config';
import { logRoutingDecision } from '../observation/logger';
import { adapters } from '../adapters';
import { runOpenRouter } from '../adapters/openrouter';
import { getOllamaCircuitBreaker } from '../lib/circuit-breaker';

let ollamaClient: Ollama | null = null;

function getOllama(): Ollama {
  if (!ollamaClient) {
    const config = getConfig();
    ollamaClient = new Ollama({ host: config.adapters.ollama.host });
  }
  return ollamaClient;
}

// Task complexity patterns
const COMPLEXITY_PATTERNS = {
  // High complexity - needs most capable model
  high: [
    /architect/i, /design\s+system/i, /refactor/i, /optimize/i,
    /debug.*complex/i, /fix.*bug/i, /security/i, /vulnerability/i,
    /multi.?file/i, /across.*files/i, /entire\s+codebase/i,
    /implement.*feature/i, /add.*functionality/i, /build.*from.*scratch/i,
    /migration/i, /upgrade/i, /performance/i, /scale/i,
    /test.*coverage/i, /integration/i, /api\s+design/i,
    /algorithm/i, /data\s+structure/i, /concurrent/i, /async/i,
    /state\s+management/i, /authentication/i, /authorization/i,
  ],
  // Medium complexity
  medium: [
    /add.*function/i, /create.*component/i, /write.*test/i,
    /update/i, /modify/i, /change/i, /edit/i,
    /fix.*error/i, /resolve/i, /handle/i,
    /convert/i, /transform/i, /parse/i,
    /validate/i, /check/i, /verify/i,
  ],
  // Analysis tasks - good for Gemini
  analysis: [
    /explain/i, /understand/i, /analyze/i, /review/i,
    /document/i, /describe/i, /summarize/i,
    /compare/i, /difference/i, /what\s+is/i, /how\s+does/i,
    /why/i, /when\s+to/i, /best\s+practice/i,
    /research/i, /find.*information/i, /look\s+up/i,
  ],
  // Simple tasks
  simple: [
    /list/i, /show/i, /print/i, /display/i,
    /rename/i, /move/i, /copy/i, /delete/i,
    /format/i, /lint/i, /prettier/i,
    /hello/i, /hi/i, /thanks/i,
  ],
};

// Harness recommendations based on task type
const HARNESS_RECOMMENDATIONS: Record<string, string> = {
  'complex-reasoning': 'codereason',  // Code as reasoning (PoET/CoRT)
  'architecture': 'discover',         // Self-Discover for decomposition
  'multi-step': 'pkpoet',            // PK-Poet for phased execution
  'security': 'adversary',           // Red-team analysis
  'feature': 'feature',              // Multi-phase feature workflow
  'verification': 'poetiq',          // Verification-first approach
};

// Capability cascade: most capable first
const CAPABILITY_CASCADE = ['codex', 'claude', 'gemini', 'factory'] as const;

const ROUTER_SYSTEM_PROMPT = `You are the PuzldAI router. Your job is to choose the single best agent for the user's task.

You must be conservative, accurate, and explicit. You are not solving the task, only routing it.

## Objective
Pick the best agent given task requirements, complexity, risk, and expected tool usage.

## Agent Selection Guidelines (by task type)
- **Complex coding tasks** (architecture, multi-file refactors, hard debugging, security): CLAUDE or CLAUDE
- **Analysis/research tasks** (explanations, documentation, comparisons, synthesis): GEMINI
- **Quick code generation** (simple scripts, prototypes, small edits): GEMINI or CODEX
- **Safety-sensitive or ambiguous tasks**: CLAUDE (most likely to ask clarifying questions)

## Available Agents
- claude: Best generalist for complex coding, architecture, debugging, multi-file refactoring
- gemini: Best for research, analysis, explanations, and synthesis
- codex: Strong for quick code generation, simple scripts, prototypes
- factory: GLM generalist fallback for broad tasks

## Output Format
Return ONLY valid JSON matching this schema exactly:
{
  "agent": "claude|gemini|codex|factory",
  "confidence": 0.0-1.0,
  "taskType": "high-complexity|medium-complexity|analysis|simple|unknown",
  "reasoning": "brief rationale in 1-2 sentences"
}

Rules:
- Output valid JSON only - no markdown fences, no extra keys
- confidence reflects certainty (lower for vague tasks)
- If task is ambiguous, prefer CLAUDE for safety`;

// Constants for router configuration
const ROUTER_CACHE_TTL_MS = 30000; // 30 seconds cache TTL
const ROUTER_MAX_CHARS = 1000; // Maximum characters for router context
const ROUTER_SNIPPET_CHARS = 320; // Maximum characters for task snippet
const ROUTER_MIN_COMPLEXITY_LENGTH = 100; // Minimum length for medium complexity
const ROUTER_HIGH_COMPLEXITY_LENGTH = 300; // Minimum length for high complexity by default
const ROUTER_PATTERN_MATCH_THRESHOLD = 2; // Number of patterns to suggest pkpoet
const ROUTER_CONFIDENCE_BASE_HIGH = 0.7; // Base confidence for high complexity matches
const ROUTER_CONFIDENCE_BASE_MEDIUM = 0.6; // Base confidence for medium complexity matches
const ROUTER_CONFIDENCE_BASE_ANALYSIS = 0.6; // Base confidence for analysis matches
const ROUTER_CONFIDENCE_BASE_SIMPLE = 0.7; // Base confidence for simple matches
const ROUTER_CONFIDENCE_FALLBACK = 0.4; // Fallback confidence when no patterns match
const ROUTER_CONFIDENCE_LENGTH_BASED = 0.6; // Confidence for length-based complexity
const ROUTER_CONFIDENCE_LENGTH_MEDIUM = 0.5; // Confidence for medium length tasks
const ROUTER_MAX_SIGNALS = 5; // Maximum path signals to extract

function extractRouterJson(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  // Strip ```json or ``` fences if present
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Fallback: attempt to locate first JSON object in the string
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }

  return trimmed;
}

function extractSignals(task: string): string[] {
  const signals: string[] = [];
  const lower = task.toLowerCase();

  const keywords = [
    'refactor', 'migrate', 'migration', 'multi-file', 'architecture', 'design',
    'performance', 'optimize', 'security', 'vulnerability', 'auth', 'authentication',
    'authorization', 'api', 'database', 'schema', 'ui', 'frontend', 'backend',
    'debug', 'bug', 'error', 'test', 'coverage', 'lint', 'format', 'docs',
    'implement', 'add', 'remove', 'rename', 'review', 'compare', 'analyze', 'summarize'
  ];

  for (const key of keywords) {
    if (lower.includes(key)) signals.push(key);
  }

  // File/path hints
  const pathMatches = task.match(/([A-Za-z0-9._-]+\/)+[A-Za-z0-9._-]+/g) || [];
  signals.push(...pathMatches.slice(0, ROUTER_MAX_SIGNALS));

  // Language hints
  const langHints = ['typescript', 'javascript', 'go', 'python', 'rust', 'java', 'c#', 'sql'];
  for (const lang of langHints) {
    if (lower.includes(lang)) signals.push(lang);
  }

  // Error hints
  const errorMatches = task.match(/(error|exception|stack trace|traceback|segfault|panic)/gi) || [];
  if (errorMatches.length > 0) signals.push('error');

  // Unique, preserve order
  return [...new Set(signals)];
}

function extractConstraints(task: string): string[] {
  const constraints: string[] = [];
  const lower = task.toLowerCase();

  const constraintPatterns = [
    { pattern: /no tests|skip tests|without tests/, label: 'no-tests' },
    { pattern: /no refactor|avoid refactor/, label: 'no-refactor' },
    { pattern: /do not change|don’t change|don't change/, label: 'no-change' },
    { pattern: /fast|quick|asap/, label: 'speed' },
    { pattern: /safe|careful|cautious/, label: 'safety' },
  ];

  for (const entry of constraintPatterns) {
    if (entry.pattern.test(lower)) constraints.push(entry.label);
  }

  return [...new Set(constraints)];
}

function buildRouterContext(task: string): string {
  const trimmed = task.trim();
  const snippet = trimmed.slice(0, ROUTER_SNIPPET_CHARS);
  const signals = extractSignals(trimmed);
  const constraints = extractConstraints(trimmed);

  const parts = [
    `TASK: ${snippet}`,
    `SIGNALS: ${signals.length > 0 ? signals.join(', ') : '-'}`,
    `CONSTRAINTS: ${constraints.length > 0 ? constraints.join(', ') : '-'}`,
  ];

  let compact = parts.join('\n');
  if (compact.length > ROUTER_MAX_CHARS) {
    compact = compact.slice(0, ROUTER_MAX_CHARS);
  }
  return compact;
}

type TaskType = 'high-complexity' | 'medium-complexity' | 'analysis' | 'simple' | 'unknown';

interface ClassificationResult {
  taskType: TaskType;
  confidence: number;
  suggestedHarness?: string;
  reasoning: string;
}

/**
 * Classify task complexity using rule-based patterns
 */
function classifyTask(task: string): ClassificationResult {
  const taskLower = task.toLowerCase();
  const taskLength = task.length;

  // Check for high complexity patterns
  const highMatches = COMPLEXITY_PATTERNS.high.filter(p => p.test(task));
  if (highMatches.length > 0) {
    // Determine suggested harness
    let harness: string | undefined;
    if (/security|vulnerability|attack/i.test(task)) {
      harness = 'adversary';
    } else if (/architect|design|system/i.test(task)) {
      harness = 'discover';
    } else if (/implement.*feature|add.*functionality/i.test(task)) {
      harness = 'feature';
    } else if (/algorithm|complex.*logic|reasoning/i.test(task)) {
      harness = 'codereason';
    } else if (highMatches.length >= ROUTER_PATTERN_MATCH_THRESHOLD || taskLength > ROUTER_HIGH_COMPLEXITY_LENGTH) {
      harness = 'pkpoet';
    }

    return {
      taskType: 'high-complexity',
      confidence: Math.min(0.95, ROUTER_CONFIDENCE_BASE_HIGH + (highMatches.length * 0.1)),
      suggestedHarness: harness,
      reasoning: `Matched ${highMatches.length} high-complexity pattern(s)`,
    };
  }

  // Check for analysis patterns (route to Gemini)
  const analysisMatches = COMPLEXITY_PATTERNS.analysis.filter(p => p.test(task));
  if (analysisMatches.length > 0) {
    return {
      taskType: 'analysis',
      confidence: Math.min(0.9, ROUTER_CONFIDENCE_BASE_ANALYSIS + (analysisMatches.length * 0.1)),
      reasoning: `Matched ${analysisMatches.length} analysis pattern(s)`,
    };
  }

  // Check for medium complexity
  const mediumMatches = COMPLEXITY_PATTERNS.medium.filter(p => p.test(task));
  if (mediumMatches.length > 0) {
    return {
      taskType: 'medium-complexity',
      confidence: Math.min(0.85, ROUTER_CONFIDENCE_BASE_MEDIUM + (mediumMatches.length * 0.1)),
      reasoning: `Matched ${mediumMatches.length} medium-complexity pattern(s)`,
    };
  }

  // Check for simple patterns
  const simpleMatches = COMPLEXITY_PATTERNS.simple.filter(p => p.test(task));
  if (simpleMatches.length > 0) {
    return {
      taskType: 'simple',
      confidence: Math.min(0.9, ROUTER_CONFIDENCE_BASE_SIMPLE + (simpleMatches.length * 0.1)),
      reasoning: `Matched ${simpleMatches.length} simple pattern(s)`,
    };
  }

  // Default: estimate by task length and structure
  if (taskLength > ROUTER_HIGH_COMPLEXITY_LENGTH) {
    return {
      taskType: 'high-complexity',
      confidence: ROUTER_CONFIDENCE_LENGTH_BASED,
      suggestedHarness: 'pkpoet',
      reasoning: 'Long task description suggests complexity',
    };
  } else if (taskLength > ROUTER_MIN_COMPLEXITY_LENGTH) {
    return {
      taskType: 'medium-complexity',
      confidence: ROUTER_CONFIDENCE_LENGTH_MEDIUM,
      reasoning: 'Moderate task length',
    };
  }

  return {
    taskType: 'unknown',
    confidence: ROUTER_CONFIDENCE_FALLBACK,
    reasoning: 'No clear patterns matched',
  };
}

/**
 * Check which adapters are available (cached for performance)
 */
let availabilityCache: Map<string, boolean> | null = null;
let cacheTime = 0;

async function getAvailableAdapters(): Promise<Set<string>> {
  const now = Date.now();
  if (availabilityCache && (now - cacheTime) < ROUTER_CACHE_TTL_MS) {
    return new Set([...availabilityCache.entries()].filter(([_, v]) => v).map(([k]) => k));
  }

  availabilityCache = new Map();
  const config = getConfig();

  // Check each adapter in the cascade
  for (const name of CAPABILITY_CASCADE) {
    try {
      const adapter = adapters[name];
      if (adapter) {
        const available = await adapter.isAvailable();
        availabilityCache.set(name, available);
      }
    } catch {
      availabilityCache.set(name, false);
    }
  }

  cacheTime = now;
  return new Set([...availabilityCache.entries()].filter(([_, v]) => v).map(([k]) => k));
}

/**
 * Select best available agent from capability cascade
 */
async function selectAgent(taskType: TaskType): Promise<string> {
  const available = await getAvailableAdapters();
  const config = getConfig();

  // For analysis tasks, prefer Gemini
  if (taskType === 'analysis') {
    const analysisCascade = ['gemini', 'claude', 'codex', 'factory'];
    for (const agent of analysisCascade) {
      if (available.has(agent)) return agent;
    }
  }

  // For simple tasks, use fastest available
  if (taskType === 'simple') {
    const simpleCascade = ['gemini', 'codex', 'claude', 'factory'];
    for (const agent of simpleCascade) {
      if (available.has(agent)) return agent;
    }
  }

  // For complex/medium tasks, use capability cascade: Codex → Claude → Gemini → Droid
  for (const agent of CAPABILITY_CASCADE) {
    if (available.has(agent)) return agent;
  }

  // Ultimate fallback
  return config.fallbackAgent;
}

/**
 * Main routing function - smart rule-based routing with capability cascade
 */
export async function routeTask(task: string): Promise<RouteResult> {
  const config = getConfig();

  if (await isRouterAvailable()) {
    return routeTaskWithLLM(task);
  }

  // First, try rule-based classification (fast, no LLM needed)
  const classification = classifyTask(task);
  const selectedAgent = await selectAgent(classification.taskType);

  const result: RouteResult = {
    agent: selectedAgent as RouteResult['agent'],
    confidence: classification.confidence,
    taskType: classification.taskType,
    suggestedHarness: classification.suggestedHarness,
    reasoning: classification.reasoning,
  };

  // Log the routing decision
  try {
    logRoutingDecision({
      task,
      selectedAgent,
      confidence: classification.confidence,
      taskType: classification.taskType,
      routerModel: 'rule-based',
      mode: 'auto',
      suggestedHarness: classification.suggestedHarness,
    });
  } catch {
    // Ignore logging errors
  }

  return result;
}

/**
 * Route with LLM (optional - uses Ollama if available for enhanced routing)
 */
export async function routeTaskWithLLM(task: string): Promise<RouteResult> {
  const config = getConfig();

  // First get rule-based result as fallback
  const ruleBasedResult = await routeTask(task);

  // Try OpenRouter first if enabled
  if ((config.adapters as any).openrouter?.enabled) {
    const preferred = (config.adapters as any).openrouter?.model || 'z-ai/glm-4.7';
    const compactTask = buildRouterContext(task);
    const prompt = `${ROUTER_SYSTEM_PROMPT}\n\n${compactTask}`;
    const modelsToTry = [preferred, 'z-ai/glm-4.6'].filter(Boolean);

    for (const model of modelsToTry) {
    const response = await runOpenRouter(prompt, model);
      if (response.error || !response.content) {
        continue;
      }
      try {
        const parsed = JSON.parse(extractRouterJson(response.content));
        if (parsed.agent && typeof parsed.confidence === 'number') {
          if (CAPABILITY_CASCADE.includes(parsed.agent as any)) {
            return {
              agent: parsed.agent,
              confidence: parsed.confidence,
              taskType: parsed.taskType || ruleBasedResult.taskType,
              reasoning: parsed.reasoning,
              suggestedHarness: ruleBasedResult.suggestedHarness,
            };
          }
        }
      } catch {
        // Fall through to other routers
      }
    }
  }

  // Try LLM routing if Ollama is available
  if (config.adapters.ollama.enabled) {
    const ollamaCircuitBreaker = getOllamaCircuitBreaker();

    // Check circuit breaker before attempting Ollama call
    if (!ollamaCircuitBreaker.canExecute()) {
      // Circuit is open, fall through to rule-based result
    } else {
      try {
        const ollama = getOllama();
        const response = await ollama.chat({
          model: config.routerModel,
          messages: [{
            role: 'user',
            content: `${ROUTER_SYSTEM_PROMPT}\n\n${buildRouterContext(task)}`
          }],
          format: 'json'
        });

        // Record success
        ollamaCircuitBreaker.recordSuccess();

        const parsed = JSON.parse(extractRouterJson(response.message.content));
        if (parsed.agent && typeof parsed.confidence === 'number') {
          // Validate agent is in our cascade
          if (CAPABILITY_CASCADE.includes(parsed.agent as any)) {
            return {
              agent: parsed.agent,
              confidence: parsed.confidence,
              taskType: parsed.taskType || ruleBasedResult.taskType,
              reasoning: parsed.reasoning,
              suggestedHarness: ruleBasedResult.suggestedHarness,
            };
          }
        }
      } catch (err) {
        // Record failure for circuit breaker
        ollamaCircuitBreaker.recordFailure((err as Error).message);
        // Fall through to rule-based result
      }
    }
  }

  return ruleBasedResult;
}

/**
 * Check if LLM router is available (Ollama)
 */
export async function isRouterAvailable(): Promise<boolean> {
  try {
    const config = getConfig();
    const openrouter = (config.adapters as any).openrouter as { enabled?: boolean; apiKey?: string } | undefined;
    if (openrouter?.enabled) {
      const apiKey = openrouter.apiKey || process.env.OPENROUTER_API_KEY;
      if (apiKey) return true;
    }
    if (!config.adapters.ollama.enabled) return false;

    const ollama = getOllama();
    const models = await ollama.list();
    return models.models.some(m => m.name.includes(config.routerModel.split(':')[0]));
  } catch {
    return false;
  }
}

/**
 * Get harness recommendation for a task
 */
export function getHarnessRecommendation(task: string): string | undefined {
  const classification = classifyTask(task);
  return classification.suggestedHarness;
}

/**
 * Force refresh the adapter availability cache
 */
export function clearAvailabilityCache(): void {
  availabilityCache = null;
  cacheTime = 0;
}
