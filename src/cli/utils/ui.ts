import pc from 'picocolors';
import { createSpinner } from 'nanospinner';

/**
 * Standardized CLI UI utilities for PuzldAI
 */
export const ui = {
  /**
   * Log a message to stdout
   */
  log: (message: string) => {
    console.log(message);
  },

  /**
   * Print a stylized header
   */
  header: (title: string, subtitle?: string) => {
    console.log('');
    console.log(pc.bold(pc.blue('◆ ' + title.toUpperCase())));
    if (subtitle) {
      console.log(pc.dim(subtitle));
    }
    console.log('');
  },

  /**
   * Print an info message
   */
  info: (message: string) => {
    console.log(pc.blue('ℹ') + ' ' + message);
  },

  /**
   * Print a success message
   */
  success: (message: string) => {
    console.log(pc.green('✓') + ' ' + message);
  },

  /**
   * Print an error message
   */
  error: (message: string, error?: Error) => {
    console.log(pc.red('✗') + ' ' + message);
    if (error && error.message) {
      console.log(pc.dim('  ' + error.message));
    }
  },

  /**
   * Print a warning message
   */
  warn: (message: string) => {
    console.log(pc.yellow('⚠') + ' ' + message);
  },

  /**
   * Print a detailed line item (key: value)
   */
  detail: (key: string, value: string | number | boolean) => {
    console.log(pc.dim('  ' + key + ': ') + value);
  },

  /**
   * Create and start a spinner
   */
  spinner: (text: string) => {
    return createSpinner(text).start();
  },

  /**
   * Print a section divider
   */
  divider: () => {
    console.log(pc.dim('────────────────────────────────────────'));
  },

  /**
   * Format a step in a process
   */
  step: (step: number, total: number, description: string) => {
    console.log(pc.cyan(`[${step}/${total}]`) + ' ' + description);
  },

  /**
   * Print a boxed message (simple implementation)
   */
  box: (message: string) => {
    const lines = message.split('\n');
    const width = Math.max(...lines.map(l => l.length)) + 4;
    const top = '┌' + '─'.repeat(width - 2) + '┐';
    const bottom = '└' + '─'.repeat(width - 2) + '┘';
    
    console.log(top);
    lines.forEach(line => {
      console.log('│ ' + line.padEnd(width - 4) + ' │');
    });
    console.log(bottom);
  }
};
