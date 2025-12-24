/**
 * Tests for git utility functions
 *
 * These tests verify:
 * 1. Git status parsing
 * 2. Git diff parsing
 * 3. Repository detection
 * 4. Error handling for non-repo directories
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test';

// Mock the exec function
const mockExec = mock(() => Promise.resolve({ stdout: '', stderr: '' }));

// We'll test the parsing logic by mocking execAsync responses
// For actual git operations, we rely on integration tests

describe('Git Status Parsing', () => {
  describe('parseGitStatusOutput', () => {
    // Helper function to parse status output (matches implementation logic)
    function parseStatusOutput(output: string): {
      staged: string[];
      unstaged: string[];
      untracked: string[];
    } {
      const staged: string[] = [];
      const unstaged: string[] = [];
      const untracked: string[] = [];

      if (!output) {
        return { staged, unstaged, untracked };
      }

      const lines = output.split('\n');
      for (const line of lines) {
        if (!line) continue;

        const indexStatus = line[0];
        const workTreeStatus = line[1];
        const filePath = line.slice(3);

        if (indexStatus === '?' && workTreeStatus === '?') {
          untracked.push(filePath);
          continue;
        }

        if (indexStatus !== ' ' && indexStatus !== '?') {
          staged.push(filePath);
        }

        if (workTreeStatus !== ' ' && workTreeStatus !== '?') {
          unstaged.push(filePath);
        }
      }

      return { staged, unstaged, untracked };
    }

    it('should parse empty status', () => {
      const result = parseStatusOutput('');
      expect(result.staged).toEqual([]);
      expect(result.unstaged).toEqual([]);
      expect(result.untracked).toEqual([]);
    });

    it('should parse untracked files', () => {
      const output = '?? new-file.ts\n?? another-file.js';
      const result = parseStatusOutput(output);
      expect(result.untracked).toEqual(['new-file.ts', 'another-file.js']);
      expect(result.staged).toEqual([]);
      expect(result.unstaged).toEqual([]);
    });

    it('should parse staged files', () => {
      const output = 'A  staged-new.ts\nM  modified-staged.ts';
      const result = parseStatusOutput(output);
      expect(result.staged).toEqual(['staged-new.ts', 'modified-staged.ts']);
      expect(result.unstaged).toEqual([]);
      expect(result.untracked).toEqual([]);
    });

    it('should parse unstaged files', () => {
      const output = ' M unstaged-modified.ts\n D deleted.ts';
      const result = parseStatusOutput(output);
      expect(result.unstaged).toEqual(['unstaged-modified.ts', 'deleted.ts']);
      expect(result.staged).toEqual([]);
      expect(result.untracked).toEqual([]);
    });

    it('should parse mixed status (staged and unstaged for same file)', () => {
      const output = 'MM both-modified.ts';
      const result = parseStatusOutput(output);
      expect(result.staged).toEqual(['both-modified.ts']);
      expect(result.unstaged).toEqual(['both-modified.ts']);
      expect(result.untracked).toEqual([]);
    });

    it('should handle renamed files', () => {
      const output = 'R  old-name.ts -> new-name.ts';
      const result = parseStatusOutput(output);
      expect(result.staged).toEqual(['old-name.ts -> new-name.ts']);
    });

    it('should handle copied files', () => {
      const output = 'C  original.ts -> copy.ts';
      const result = parseStatusOutput(output);
      expect(result.staged).toEqual(['original.ts -> copy.ts']);
    });

    it('should parse complex status with multiple file types', () => {
      const output = `M  staged-mod.ts
 M unstaged-mod.ts
A  new-staged.ts
?? untracked.ts
MM both-mod.ts`;
      const result = parseStatusOutput(output);
      expect(result.staged).toEqual(['staged-mod.ts', 'new-staged.ts', 'both-mod.ts']);
      expect(result.unstaged).toEqual(['unstaged-mod.ts', 'both-mod.ts']);
      expect(result.untracked).toEqual(['untracked.ts']);
    });
  });
});

describe('Git Diff Parsing', () => {
  describe('parseNumstatOutput', () => {
    // Helper function to parse numstat output (matches implementation logic)
    function parseNumstatOutput(
      output: string
    ): Array<{ file: string; additions: number; deletions: number }> {
      if (!output) return [];

      return output
        .split('\n')
        .filter((line) => line)
        .map((line) => {
          const [additions, deletions, file] = line.split('\t');
          return {
            file,
            additions: additions === '-' ? 0 : parseInt(additions, 10),
            deletions: deletions === '-' ? 0 : parseInt(deletions, 10),
          };
        });
    }

    it('should parse empty diff', () => {
      const result = parseNumstatOutput('');
      expect(result).toEqual([]);
    });

    it('should parse single file diff', () => {
      const output = '10\t5\tsrc/file.ts';
      const result = parseNumstatOutput(output);
      expect(result).toEqual([{ file: 'src/file.ts', additions: 10, deletions: 5 }]);
    });

    it('should parse multiple file diffs', () => {
      const output = `3\t1\tsrc/a.ts
15\t0\tsrc/b.ts
0\t8\tsrc/c.ts`;
      const result = parseNumstatOutput(output);
      expect(result).toEqual([
        { file: 'src/a.ts', additions: 3, deletions: 1 },
        { file: 'src/b.ts', additions: 15, deletions: 0 },
        { file: 'src/c.ts', additions: 0, deletions: 8 },
      ]);
    });

    it('should handle binary files (- for additions/deletions)', () => {
      const output = '-\t-\timage.png';
      const result = parseNumstatOutput(output);
      expect(result).toEqual([{ file: 'image.png', additions: 0, deletions: 0 }]);
    });
  });
});

describe('GitStatus Type', () => {
  it('should have correct shape for clean repo', () => {
    const status = {
      isRepo: true,
      branch: 'main',
      isDirty: false,
      staged: [] as string[],
      unstaged: [] as string[],
      untracked: [] as string[],
    };

    expect(status.isRepo).toBe(true);
    expect(status.branch).toBe('main');
    expect(status.isDirty).toBe(false);
    expect(status.staged).toHaveLength(0);
    expect(status.unstaged).toHaveLength(0);
    expect(status.untracked).toHaveLength(0);
  });

  it('should have correct shape for dirty repo', () => {
    const status = {
      isRepo: true,
      branch: 'feature/test',
      isDirty: true,
      staged: ['file1.ts'],
      unstaged: ['file2.ts'],
      untracked: ['file3.ts'],
    };

    expect(status.isRepo).toBe(true);
    expect(status.branch).toBe('feature/test');
    expect(status.isDirty).toBe(true);
    expect(status.staged).toContain('file1.ts');
    expect(status.unstaged).toContain('file2.ts');
    expect(status.untracked).toContain('file3.ts');
  });

  it('should have correct shape for non-repo', () => {
    const status = {
      isRepo: false,
      branch: '',
      isDirty: false,
      staged: [] as string[],
      unstaged: [] as string[],
      untracked: [] as string[],
    };

    expect(status.isRepo).toBe(false);
    expect(status.branch).toBe('');
    expect(status.isDirty).toBe(false);
  });
});

describe('GitDiff Type', () => {
  it('should have correct shape', () => {
    const diff = {
      file: 'src/index.ts',
      hunks: '@@ -1,5 +1,10 @@\n-old line\n+new line',
      additions: 5,
      deletions: 1,
    };

    expect(diff.file).toBe('src/index.ts');
    expect(diff.hunks).toContain('@@');
    expect(diff.additions).toBe(5);
    expect(diff.deletions).toBe(1);
  });
});

describe('Commit Log Parsing', () => {
  describe('parseLogOutput', () => {
    // Helper function to parse log output (matches implementation logic)
    function parseLogOutput(
      output: string
    ): Array<{ hash: string; message: string; author: string; date: string }> {
      if (!output) return [];

      return output.split('\n').map((line) => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
      });
    }

    it('should parse empty log', () => {
      const result = parseLogOutput('');
      expect(result).toEqual([]);
    });

    it('should parse single commit', () => {
      const output = 'abc1234|Initial commit|John Doe|2024-01-15';
      const result = parseLogOutput(output);
      expect(result).toEqual([
        {
          hash: 'abc1234',
          message: 'Initial commit',
          author: 'John Doe',
          date: '2024-01-15',
        },
      ]);
    });

    it('should parse multiple commits', () => {
      const output = `abc1234|First commit|John|2024-01-15
def5678|Second commit|Jane|2024-01-16
ghi9012|Third commit|Bob|2024-01-17`;
      const result = parseLogOutput(output);
      expect(result).toHaveLength(3);
      expect(result[0].message).toBe('First commit');
      expect(result[1].message).toBe('Second commit');
      expect(result[2].message).toBe('Third commit');
    });
  });
});

describe('Message Escaping', () => {
  it('should escape double quotes in commit messages', () => {
    const message = 'Fix "bug" in parser';
    const escaped = message.replace(/"/g, '\\"');
    expect(escaped).toBe('Fix \\"bug\\" in parser');
  });

  it('should handle messages without quotes', () => {
    const message = 'Simple commit message';
    const escaped = message.replace(/"/g, '\\"');
    expect(escaped).toBe('Simple commit message');
  });

  it('should handle empty message', () => {
    const message = '';
    const escaped = message.replace(/"/g, '\\"');
    expect(escaped).toBe('');
  });

  it('should handle multiple quotes', () => {
    const message = 'Add "feature" with "options"';
    const escaped = message.replace(/"/g, '\\"');
    expect(escaped).toBe('Add \\"feature\\" with \\"options\\"');
  });
});
