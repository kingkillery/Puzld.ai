/**
 * Security Module for Interactive Sessions
 *
 * Filters sensitive data (API keys, tokens, passwords) from session
 * output before logging or display to prevent credential leakage.
 *
 * Features:
 * - Pattern-based credential detection
 * - Configurable redaction format
 * - No false positives on common code patterns
 * - Extensible pattern registry
 */

/**
 * Types of sensitive data that can be detected
 */
export type CredentialType =
  | 'api_key'
  | 'bearer_token'
  | 'password'
  | 'secret'
  | 'private_key'
  | 'oauth_token'
  | 'env_var';

/**
 * A pattern for detecting credentials
 */
export interface CredentialPattern {
  /** Regex pattern to match */
  pattern: RegExp;
  /** Type of credential this detects */
  type: CredentialType;
  /** Optional description for logging */
  description?: string;
}

/**
 * Options for the credential filter
 */
export interface CredentialFilterOptions {
  /** Custom patterns to add */
  customPatterns?: CredentialPattern[];
  /** Format for redacted text, use {type} for credential type */
  redactionFormat?: string;
  /** Whether to log when credentials are filtered */
  logRedactions?: boolean;
}

// ============================================================================
// Built-in Credential Patterns
// ============================================================================

/**
 * API Key patterns for various providers
 */
const API_KEY_PATTERNS: CredentialPattern[] = [
  // Anthropic API keys: sk-ant-api03-...
  {
    pattern: /\bsk-ant-[a-zA-Z0-9_-]{20,}\b/g,
    type: 'api_key',
    description: 'Anthropic API key',
  },
  // OpenAI API keys: sk-... (but not sk-ant)
  {
    pattern: /\bsk-(?!ant)[a-zA-Z0-9]{20,}\b/g,
    type: 'api_key',
    description: 'OpenAI API key',
  },
  // Generic API keys assigned to variables
  {
    pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    type: 'api_key',
    description: 'Generic API key assignment',
  },
  // Google API keys: AIza...
  {
    pattern: /\bAIza[a-zA-Z0-9_-]{35}\b/g,
    type: 'api_key',
    description: 'Google API key',
  },
  // AWS access keys: AKIA...
  {
    pattern: /\bAKIA[A-Z0-9]{16}\b/g,
    type: 'api_key',
    description: 'AWS access key',
  },
  // GitHub tokens: ghp_, gho_, ghu_, ghs_, ghr_
  {
    pattern: /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}\b/g,
    type: 'api_key',
    description: 'GitHub token',
  },
  // Stripe keys: sk_live_, sk_test_, pk_live_, pk_test_
  {
    pattern: /\b(sk|pk)_(live|test)_[a-zA-Z0-9]{24,}\b/g,
    type: 'api_key',
    description: 'Stripe key',
  },
];

/**
 * Bearer token patterns
 */
const BEARER_PATTERNS: CredentialPattern[] = [
  // Bearer tokens in headers
  {
    pattern: /\bBearer\s+[a-zA-Z0-9_-]{20,}\b/gi,
    type: 'bearer_token',
    description: 'Bearer token',
  },
  // Authorization header value
  {
    pattern: /Authorization['":\s]+Bearer\s+['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    type: 'bearer_token',
    description: 'Authorization header',
  },
];

/**
 * Password patterns
 */
const PASSWORD_PATTERNS: CredentialPattern[] = [
  // Password assignments (but not placeholder patterns)
  {
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]([^'"]{8,})['"](?!\s*\+)/gi,
    type: 'password',
    description: 'Password assignment',
  },
  // Connection strings with passwords
  {
    pattern: /[:@]([^:@\s]{8,})@[a-zA-Z0-9.-]+(?::\d+)?/g,
    type: 'password',
    description: 'Connection string password',
  },
];

/**
 * Secret/token patterns
 */
const SECRET_PATTERNS: CredentialPattern[] = [
  // Generic secrets
  {
    pattern: /(?:secret|token)\s*[=:]\s*['"]([a-zA-Z0-9_-]{20,})['"]?/gi,
    type: 'secret',
    description: 'Secret/token assignment',
  },
  // JWT tokens (3 base64 parts separated by dots)
  {
    pattern: /\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
    type: 'oauth_token',
    description: 'JWT token',
  },
];

/**
 * Private key patterns
 */
const PRIVATE_KEY_PATTERNS: CredentialPattern[] = [
  // PEM private keys
  {
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    type: 'private_key',
    description: 'PEM private key',
  },
];

/**
 * Environment variable patterns (when values are exposed)
 */
const ENV_VAR_PATTERNS: CredentialPattern[] = [
  // ANTHROPIC_API_KEY=...
  {
    pattern: /\bANTHROPIC_API_KEY\s*=\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/g,
    type: 'env_var',
    description: 'ANTHROPIC_API_KEY',
  },
  // OPENAI_API_KEY=...
  {
    pattern: /\bOPENAI_API_KEY\s*=\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/g,
    type: 'env_var',
    description: 'OPENAI_API_KEY',
  },
  // GOOGLE_API_KEY=...
  {
    pattern: /\bGOOGLE_API_KEY\s*=\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/g,
    type: 'env_var',
    description: 'GOOGLE_API_KEY',
  },
  // AWS_SECRET_ACCESS_KEY=...
  {
    pattern: /\bAWS_SECRET_ACCESS_KEY\s*=\s*['"]?([a-zA-Z0-9/+=]{20,})['"]?/g,
    type: 'env_var',
    description: 'AWS_SECRET_ACCESS_KEY',
  },
  // Generic *_TOKEN, *_SECRET, *_KEY env vars with values
  {
    pattern: /\b([A-Z_]+(?:_TOKEN|_SECRET|_KEY|_PASSWORD))\s*=\s*['"]?([a-zA-Z0-9_-]{16,})['"]?/g,
    type: 'env_var',
    description: 'Environment variable with sensitive value',
  },
];

/**
 * All built-in patterns combined
 */
const ALL_PATTERNS: CredentialPattern[] = [
  ...API_KEY_PATTERNS,
  ...BEARER_PATTERNS,
  ...PASSWORD_PATTERNS,
  ...SECRET_PATTERNS,
  ...PRIVATE_KEY_PATTERNS,
  ...ENV_VAR_PATTERNS,
];

// ============================================================================
// Credential Filter Class
// ============================================================================

/**
 * Credential Filter
 *
 * Detects and redacts sensitive data from text.
 */
export class CredentialFilter {
  private readonly patterns: CredentialPattern[];
  private readonly redactionFormat: string;
  private readonly logRedactions: boolean;
  private redactionCount = 0;

  constructor(options: CredentialFilterOptions = {}) {
    this.patterns = [...ALL_PATTERNS, ...(options.customPatterns ?? [])];
    this.redactionFormat = options.redactionFormat ?? '[REDACTED:{type}]';
    this.logRedactions = options.logRedactions ?? false;
  }

  /**
   * Filter credentials from text
   *
   * Returns the text with all detected credentials redacted.
   */
  filter(text: string): string {
    let filtered = text;

    for (const { pattern, type, description } of this.patterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;

      const matches = filtered.match(pattern);
      if (matches) {
        const redaction = this.redactionFormat.replace('{type}', type);
        filtered = filtered.replace(pattern, redaction);

        if (this.logRedactions && matches.length > 0) {
          this.redactionCount += matches.length;
          console.warn(
            `[security] Redacted ${matches.length} ${description ?? type} occurrence(s)`
          );
        }
      }
    }

    return filtered;
  }

  /**
   * Check if text contains any credentials
   *
   * Returns true if any credential patterns match.
   */
  containsCredentials(text: string): boolean {
    for (const { pattern } of this.patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the types of credentials found in text
   */
  detectCredentialTypes(text: string): CredentialType[] {
    const types = new Set<CredentialType>();

    for (const { pattern, type } of this.patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        types.add(type);
      }
    }

    return Array.from(types);
  }

  /**
   * Get total redaction count since filter creation
   */
  getRedactionCount(): number {
    return this.redactionCount;
  }

  /**
   * Add a custom pattern
   */
  addPattern(pattern: CredentialPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Reset the global regex lastIndex values
   * Call this before processing a new document
   */
  reset(): void {
    for (const { pattern } of this.patterns) {
      pattern.lastIndex = 0;
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/** Default filter instance */
let defaultFilter: CredentialFilter | null = null;

/**
 * Get or create the default credential filter
 */
function getDefaultFilter(): CredentialFilter {
  if (!defaultFilter) {
    defaultFilter = new CredentialFilter();
  }
  return defaultFilter;
}

/**
 * Filter credentials from text using the default filter
 */
export function filterCredentials(text: string): string {
  return getDefaultFilter().filter(text);
}

/**
 * Check if text contains credentials using the default filter
 */
export function containsCredentials(text: string): boolean {
  return getDefaultFilter().containsCredentials(text);
}

/**
 * Detect credential types in text using the default filter
 */
export function detectCredentialTypes(text: string): CredentialType[] {
  return getDefaultFilter().detectCredentialTypes(text);
}

/**
 * Create a new credential filter with custom options
 */
export function createCredentialFilter(options?: CredentialFilterOptions): CredentialFilter {
  return new CredentialFilter(options);
}
