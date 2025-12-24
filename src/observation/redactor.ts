/**
 * Secret Redaction for Exports
 *
 * Redacts sensitive information from observation data before export.
 * Ensures secrets, API keys, tokens, and credentials are not included in training data.
 */

export interface RedactionResult {
  redacted: string;
  secretsFound: number;
}

// Common secret patterns
const SECRET_PATTERNS = [
  // API Keys (various formats)
  { pattern: /(?:api[_-]?key|apikey|api-key)["']?\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi, name: 'api_key' },
  { pattern: /(?:sk-[a-zA-Z0-9]{20,})/gi, name: 'stripe_key' }, // Stripe
  { pattern: /(?:AIza[a-zA-Z0-9_-]{35})/gi, name: 'google_key' }, // Google
  { pattern: /(?:AKIA[a-zA-Z0-9]{16})/gi, name: 'aws_key' }, // AWS Access Key
  { pattern: /(?:Bearer\s+)([a-zA-Z0-9_.=-]+)/gi, name: 'bearer_token' },
  { pattern: /(?:token["']?\s*[:=]\s*["']?)([a-zA-Z0-9_-]{20,})["']?/gi, name: 'token' },
  
  // JWT tokens
  { pattern: /(?:eyJ[a-zA-Z0-9_-]+\.(?:eyJ[a-zA-Z0-9_-]+\.?[a-zA-Z0-9_-]+)?)/gi, name: 'jwt' },
  
  // Passwords
  { pattern: /(?:password|passwd|pwd)["']?\s*[:=]\s*["']?([^"'\s]{8,})["']?/gi, name: 'password' },
  
  // Database connection strings
  { pattern: /(?:mongodb\+?srv:\/\/|postgres(?:ql)?:\/\/|mysql:\/\/)([^@\s]+@[^/\s]+)/gi, name: 'db_connection' },
  
  // URLs with sensitive parameters
  { pattern: /(?:https?:\/\/)[^\s/]+\/[^\s]*\?(?:[^\s&]*&)?(?:token|key|secret|auth)=([^\s&]+)/gi, name: 'url_token' },
  
  // Base64 encoded secrets (approximate - high base64 entropy strings)
  { pattern: /([a-zA-Z0-9+/]{40,}={0,2})/gi, name: 'potential_base64_secret' },
  
  // Environment variable exports with secrets
  { pattern: /(?:export\s+[a-zA-Z_]+)=["']?([^"'\s]{20,})["']?/gi, name: 'env_var' }
];

/**
 * Redact secrets from a string
 */
export function redactSecrets(text: string): RedactionResult {
  let redacted = text;
  let secretsFound = 0;

  for (const { pattern, name } of SECRET_PATTERNS) {
    const matches = redacted.match(pattern);
    if (matches) {
      secretsFound += matches.length;
      redacted = redacted.replace(pattern, `***REDACTED_${name.toUpperCase()}***`);
    }
  }

  return { redacted, secretsFound };
}

/**
 * Redact secrets from an object (recursively)
 */
export function redactObject(obj: Record<string, unknown>): {
  redacted: Record<string, unknown>;
  secretsFound: number;
} {
  let totalSecrets = 0;

  function processValue(value: unknown): unknown {
    if (typeof value === 'string') {
      const result = redactSecrets(value);
      totalSecrets += result.secretsFound;
      return result.redacted;
    } else if (Array.isArray(value)) {
      return value.map(processValue);
    } else if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[key] = processValue(val);
      }
      return result;
    }
    return value;
  }

  return { redacted: processValue(obj) as Record<string, unknown>, secretsFound: totalSecrets };
}

/**
 * Redact observation data for export
 */
export function redactObservation(observation: Record<string, unknown>): {
  redacted: Record<string, unknown>;
  secretsFound: number;
  redactedFields: string[];
} {
  const redactedFields: string[] = [];
  let totalSecrets = 0;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(observation)) {
    // Skip non-sensitive metadata fields
    if (['id', 'timestamp', 'agent', 'model', 'durationMs', 'tokensIn', 'tokensOut', 'signalType'].includes(key)) {
      result[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      const redactionResult = redactSecrets(value);
      if (redactionResult.secretsFound > 0) {
        redactedFields.push(key);
        totalSecrets += redactionResult.secretsFound;
      }
      result[key] = redactionResult.redacted;
    } else if (typeof value === 'object' && value !== null) {
      const objectResult = redactObject(value as Record<string, unknown>);
      if (objectResult.secretsFound > 0) {
        redactedFields.push(key);
        totalSecrets += objectResult.secretsFound;
      }
      result[key] = objectResult.redacted;
    } else {
      result[key] = value;
    }
  }

  return { redacted: result, secretsFound: totalSecrets, redactedFields };
}

/**
 * Add custom redaction pattern
 */
export function addRedactionPattern(pattern: RegExp, name: string): void {
  SECRET_PATTERNS.push({ pattern, name });
}

/**
 * Get active redaction patterns (for logging/validation)
 */
export function getActivePatterns(): Array<{ name: string; pattern: string }> {
  return SECRET_PATTERNS.map(p => ({ name: p.name, pattern: p.pattern.source }));
}
