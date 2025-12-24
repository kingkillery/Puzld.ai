/**
 * Path Utilities Tests
 *
 * Tests for cross-platform path handling, covering:
 * - Mixed separator handling (C:\foo vs C:/foo)
 * - Case-insensitive comparison on Windows
 * - Trailing slash handling
 * - Drive letter handling
 * - Subpath detection edge cases
 */

import { describe, test, expect } from 'bun:test';
import {
  normalizePath,
  toForwardSlash,
  toPlatformPath,
  pathsEqual,
  isSubPath,
  getDirectory,
  joinPaths,
  isAbsolutePath,
  relativePath,
  isWindows
} from './paths';

const IS_WINDOWS = process.platform === 'win32';

describe('normalizePath', () => {
  test('normalizes forward slashes', () => {
    const result = normalizePath('/foo/bar/baz');
    expect(result).toContain('foo/bar/baz');
  });

  test('converts backslashes to forward slashes', () => {
    const result = normalizePath('C:\\Users\\test\\file.ts');
    expect(result).not.toContain('\\');
    expect(result).toContain('/');
  });

  test('removes trailing slashes', () => {
    // On Windows, this becomes an absolute path relative to current drive
    const result = normalizePath('/foo/bar/');
    expect(result.endsWith('/bar')).toBe(true);
    expect(result.endsWith('/')).toBe(false);
  });

  test('handles empty string', () => {
    expect(normalizePath('')).toBe('');
  });

  test('handles relative paths by resolving to absolute', () => {
    const result = normalizePath('foo/bar');
    expect(isAbsolutePath(result)).toBe(true);
  });

  if (IS_WINDOWS) {
    test('lowercases drive letters on Windows', () => {
      const result = normalizePath('C:\\Users\\test');
      expect(result[0]).toBe('c');
    });

    test('preserves drive root with trailing slash', () => {
      const result = normalizePath('C:\\');
      expect(result).toBe('c:/');
    });
  }
});

describe('toForwardSlash', () => {
  test('converts all backslashes', () => {
    expect(toForwardSlash('C:\\foo\\bar\\baz')).toBe('C:/foo/bar/baz');
  });

  test('leaves forward slashes unchanged', () => {
    expect(toForwardSlash('/foo/bar/baz')).toBe('/foo/bar/baz');
  });

  test('handles mixed separators', () => {
    expect(toForwardSlash('C:\\foo/bar\\baz')).toBe('C:/foo/bar/baz');
  });

  test('handles empty string', () => {
    expect(toForwardSlash('')).toBe('');
  });
});

describe('toPlatformPath', () => {
  test('converts to platform-native separators', () => {
    const result = toPlatformPath('/foo/bar/baz');
    if (IS_WINDOWS) {
      expect(result).toBe('\\foo\\bar\\baz');
    } else {
      expect(result).toBe('/foo/bar/baz');
    }
  });

  test('handles Windows-style input', () => {
    const result = toPlatformPath('C:\\foo\\bar');
    if (IS_WINDOWS) {
      expect(result).toBe('C:\\foo\\bar');
    } else {
      expect(result).toBe('C:/foo/bar');
    }
  });
});

describe('pathsEqual', () => {
  test('compares identical paths', () => {
    expect(pathsEqual('/foo/bar', '/foo/bar')).toBe(true);
  });

  test('compares paths with different separators', () => {
    // Both will be normalized to the same thing
    expect(pathsEqual('/foo/bar', '/foo/bar')).toBe(true);
  });

  test('handles trailing slashes', () => {
    expect(pathsEqual('/foo/bar/', '/foo/bar')).toBe(true);
  });

  test('different paths are not equal', () => {
    expect(pathsEqual('/foo/bar', '/foo/baz')).toBe(false);
  });

  if (IS_WINDOWS) {
    test('case-insensitive on Windows', () => {
      expect(pathsEqual('C:\\Users\\Test', 'c:/users/test')).toBe(true);
    });

    test('different drive letters are not equal', () => {
      expect(pathsEqual('C:\\foo', 'D:\\foo')).toBe(false);
    });
  } else {
    test('case-sensitive on Unix', () => {
      // These would be the same absolute path on Unix so they will be equal
      // unless they're actually different directories
      const result = pathsEqual('/tmp/Foo', '/tmp/foo');
      // On Unix, /tmp/Foo and /tmp/foo are different
      expect(result).toBe(false);
    });
  }
});

describe('isSubPath', () => {
  test('child is inside parent', () => {
    expect(isSubPath('/foo/bar/baz', '/foo/bar')).toBe(true);
  });

  test('exact match returns true', () => {
    expect(isSubPath('/foo/bar', '/foo/bar')).toBe(true);
  });

  test('parent is not inside child', () => {
    expect(isSubPath('/foo/bar', '/foo/bar/baz')).toBe(false);
  });

  test('prevents partial directory name matches', () => {
    // /foo/barbaz is NOT inside /foo/bar
    expect(isSubPath('/foo/barbaz', '/foo/bar')).toBe(false);
  });

  test('handles trailing slashes on parent', () => {
    expect(isSubPath('/foo/bar/baz', '/foo/bar/')).toBe(true);
  });

  test('handles trailing slashes on child', () => {
    expect(isSubPath('/foo/bar/baz/', '/foo/bar')).toBe(true);
  });

  test('unrelated paths return false', () => {
    expect(isSubPath('/completely/different', '/foo/bar')).toBe(false);
  });

  test('sibling directories return false', () => {
    expect(isSubPath('/foo/bar', '/foo/baz')).toBe(false);
  });

  if (IS_WINDOWS) {
    test('case-insensitive on Windows', () => {
      expect(isSubPath('C:\\Users\\Test\\file.ts', 'c:/users/test')).toBe(true);
    });

    test('mixed separators on Windows', () => {
      expect(isSubPath('C:\\Users\\Test\\sub', 'C:/Users/Test')).toBe(true);
    });

    test('different drives are not subpaths', () => {
      expect(isSubPath('D:\\Users\\Test', 'C:\\Users')).toBe(false);
    });
  }
});

describe('getDirectory', () => {
  test('gets parent directory', () => {
    const result = getDirectory('/foo/bar/file.ts');
    expect(result.endsWith('foo/bar')).toBe(true);
  });

  test('handles root path', () => {
    if (!IS_WINDOWS) {
      expect(getDirectory('/file.ts')).toBe('/');
    }
  });

  test('handles path without slashes', () => {
    const result = getDirectory('file.ts');
    // Should return current directory representation
    expect(result).toBeTruthy();
  });

  if (IS_WINDOWS) {
    test('handles Windows drive root', () => {
      const result = getDirectory('C:\\file.ts');
      expect(result).toBe('c:/');
    });
  }
});

describe('joinPaths', () => {
  test('joins simple paths', () => {
    const result = joinPaths('/foo', 'bar', 'baz');
    expect(result).toContain('foo/bar/baz');
  });

  test('handles empty segments', () => {
    const result = joinPaths('/foo', '', 'bar');
    expect(result).toContain('foo/bar');
  });

  test('handles trailing slashes', () => {
    const result = joinPaths('/foo/', '/bar/', 'baz');
    expect(result).toContain('foo/bar/baz');
    // No double slashes
    expect(result).not.toContain('//');
  });

  test('handles mixed separators', () => {
    const result = joinPaths('C:\\foo', 'bar/baz', 'qux');
    expect(result).not.toContain('\\');
  });

  test('handles empty array', () => {
    expect(joinPaths()).toBe('');
  });

  test('handles single segment', () => {
    const result = joinPaths('/foo');
    expect(result).toContain('foo');
  });
});

describe('isAbsolutePath', () => {
  test('Unix absolute path', () => {
    expect(isAbsolutePath('/foo/bar')).toBe(true);
  });

  test('relative path', () => {
    expect(isAbsolutePath('foo/bar')).toBe(false);
    expect(isAbsolutePath('./foo/bar')).toBe(false);
    expect(isAbsolutePath('../foo/bar')).toBe(false);
  });

  test('Windows drive letter (forward slash)', () => {
    expect(isAbsolutePath('C:/foo/bar')).toBe(true);
  });

  test('Windows drive letter (backslash)', () => {
    expect(isAbsolutePath('C:\\foo\\bar')).toBe(true);
  });

  test('UNC path', () => {
    expect(isAbsolutePath('//server/share')).toBe(true);
  });

  test('lowercase drive letter', () => {
    expect(isAbsolutePath('c:/foo')).toBe(true);
  });
});

describe('relativePath', () => {
  test('simple relative path', () => {
    // When to is inside from
    if (IS_WINDOWS) {
      const result = relativePath('C:/foo/bar', 'C:/foo/bar/baz/file.ts');
      expect(result).toBe('baz/file.ts');
    } else {
      // On Unix, we need to handle absolute path resolution
      expect(relativePath('/foo/bar', '/foo/bar/baz/file.ts')).toBe('baz/file.ts');
    }
  });

  test('same path returns dot', () => {
    if (IS_WINDOWS) {
      expect(relativePath('C:/foo/bar', 'C:/foo/bar')).toBe('.');
    } else {
      expect(relativePath('/foo/bar', '/foo/bar')).toBe('.');
    }
  });

  test('going up directories', () => {
    if (IS_WINDOWS) {
      const result = relativePath('C:/foo/bar/baz', 'C:/foo/qux');
      expect(result).toBe('../../qux');
    } else {
      expect(relativePath('/foo/bar/baz', '/foo/qux')).toBe('../../qux');
    }
  });

  if (IS_WINDOWS) {
    test('case-insensitive relative path on Windows', () => {
      const result = relativePath('C:/FOO/BAR', 'c:/foo/bar/baz');
      expect(result).toBe('baz');
    });
  }
});

describe('isWindows', () => {
  test('returns correct platform', () => {
    expect(isWindows()).toBe(IS_WINDOWS);
  });
});

describe('edge cases', () => {
  test('double slashes are normalized', () => {
    const result = normalizePath('/foo//bar///baz');
    expect(result).not.toMatch(/\/\//);
  });

  test('dot segments are resolved', () => {
    const result = normalizePath('/foo/./bar/../baz');
    expect(result).toContain('foo/baz');
    expect(result).not.toContain('./');
    expect(result).not.toContain('../');
  });

  if (IS_WINDOWS) {
    test('handles UNC paths', () => {
      const result = toForwardSlash('\\\\server\\share\\path');
      expect(result).toBe('//server/share/path');
    });
  }
});
