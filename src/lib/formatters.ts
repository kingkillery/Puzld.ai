/**
 * Format token count with K/M suffix
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(1) + 'm';
  }
  if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'k';
  }
  return tokens.toString();
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return '-';
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Truncate text to N lines
 */
export function truncateLines(text: string, maxLines: number): { text: string; truncated: boolean; remaining: number } {
  if (!text) return { text: '', truncated: false, remaining: 0 };
  
  const lines = text.split('\n');
  if (lines.length <= maxLines) {
    return { text, truncated: false, remaining: 0 };
  }
  return {
    text: lines.slice(0, maxLines).join('\n'),
    truncated: true,
    remaining: lines.length - maxLines
  };
}

/**
 * Format error messages to be more user-friendly
 */
export function formatError(error: string): string {
  if (!error) return '';
  
  // Rate limit errors (429)
  if (error.includes('429') || error.includes('Resource exhausted') || error.includes('rate limit')) {
    return 'Rate limited (429) - quota exceeded, try again later or switch model';
  }
  // Authentication errors
  if (error.includes('401') || error.includes('403') || error.includes('Unauthorized') || error.includes('authentication')) {
    return 'Auth failed - run the agent CLI directly to re-authenticate';
  }
  // Network errors
  if (error.includes('ENOTFOUND') || error.includes('ECONNREFUSED') || error.includes('network')) {
    return 'Network error - check your internet connection';
  }
  // Timeout
  if (error.includes('timeout') || error.includes('ETIMEDOUT') || error.includes('Timeout')) {
    return 'Timed out after 120s - try a simpler prompt or different model';
  }
  // Model not found
  if (error.includes('model') && (error.includes('not found') || error.includes('does not exist'))) {
    return 'Model not found - check /model list for available models';
  }
  // Context length exceeded
  if (error.includes('context') && (error.includes('length') || error.includes('too long') || error.includes('exceeded'))) {
    return 'Context too long - try a shorter prompt';
  }
  // Server errors (500+)
  if (error.includes('500') || error.includes('502') || error.includes('503') || error.includes('Internal Server Error')) {
    return 'Server error (5xx) - the API is having issues, try again later';
  }
  // Keep short errors as-is, truncate long ones
  if (error.length > 150) {
    // Try to extract a meaningful message
    const match = error.match(/"message":\s*"([^"]+)"/);
    if (match) {
      return match[1].length > 120 ? match[1].slice(0, 120) + '...' : match[1];
    }
    return error.slice(0, 120) + '...';
  }
  return error;
}
