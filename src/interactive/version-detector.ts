/**
 * CLI Version Detector
 *
 * Detects versions of CLI tools (Claude, Codex, Factory, Crush) for
 * pattern selection and compatibility warnings.
 *
 * Features:
 * - Semver parsing and comparison
 * - Version caching to avoid repeated checks
 * - Warning on unknown/unsupported versions
 * - Version-specific pattern selection support
 */

import { execa } from 'execa';

/**
 * CLI tool identifiers
 */
export type CLITool = 'claude' | 'codex' | 'factory' | 'crush' | 'gemini';

/**
 * Parsed version information
 */
export interface VersionInfo {
  /** Full version string as returned by CLI */
  raw: string;
  /** Major version number */
  major: number;
  /** Minor version number */
  minor: number;
  /** Patch version number */
  patch: number;
  /** Pre-release tag (e.g., 'beta', 'rc1') */
  prerelease?: string;
  /** Build metadata */
  build?: string;
}

/**
 * Version detection result
 */
export interface VersionResult {
  /** CLI tool name */
  tool: CLITool;
  /** Whether the CLI is available */
  available: boolean;
  /** Parsed version info if available */
  version?: VersionInfo;
  /** Path to CLI executable */
  path?: string;
  /** Error message if detection failed */
  error?: string;
  /** Whether version is supported */
  supported: boolean;
  /** Warning message if version is unknown/unsupported */
  warning?: string;
}

/**
 * Minimum supported versions for each CLI
 */
const MIN_SUPPORTED_VERSIONS: Record<CLITool, VersionInfo | null> = {
  claude: { raw: '2.0.0', major: 2, minor: 0, patch: 0 },
  codex: { raw: '0.1.0', major: 0, minor: 1, patch: 0 },
  factory: { raw: '0.1.0', major: 0, minor: 1, patch: 0 },
  crush: { raw: '0.1.0', major: 0, minor: 1, patch: 0 },
  gemini: null, // No minimum version requirement
};

/**
 * CLI commands to get version
 */
const VERSION_COMMANDS: Record<CLITool, { command: string; args: string[] }> = {
  claude: { command: 'claude', args: ['--version'] },
  codex: { command: 'codex', args: ['--version'] },
  factory: { command: 'factory', args: ['--version'] },
  crush: { command: 'crush', args: ['--version'] },
  gemini: { command: 'gemini', args: ['--version'] },
};

/**
 * Version cache to avoid repeated CLI calls
 */
const versionCache: Map<CLITool, VersionResult> = new Map();

/**
 * Parse a semver string into VersionInfo
 */
export function parseVersion(versionString: string): VersionInfo | null {
  // Clean up the version string
  const cleaned = versionString.trim();

  // Try to extract version from various formats:
  // - "claude 2.1.5"
  // - "Claude Code v2.1.5"
  // - "2.1.5"
  // - "v2.1.5-beta+build123"
  const patterns = [
    // Standard semver with optional v prefix and metadata
    /v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?/,
    // Just major.minor
    /v?(\d+)\.(\d+)/,
    // Just major
    /v?(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      return {
        raw: cleaned,
        major: parseInt(match[1], 10),
        minor: parseInt(match[2] ?? '0', 10),
        patch: parseInt(match[3] ?? '0', 10),
        prerelease: match[4],
        build: match[5],
      };
    }
  }

  return null;
}

/**
 * Compare two versions
 *
 * Returns:
 * - negative if a < b
 * - 0 if a == b
 * - positive if a > b
 */
export function compareVersions(a: VersionInfo, b: VersionInfo): number {
  // Compare major
  if (a.major !== b.major) {
    return a.major - b.major;
  }

  // Compare minor
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }

  // Compare patch
  if (a.patch !== b.patch) {
    return a.patch - b.patch;
  }

  // Pre-release versions are lower than release versions
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;

  // Both have pre-release, compare lexicographically
  if (a.prerelease && b.prerelease) {
    return a.prerelease.localeCompare(b.prerelease);
  }

  return 0;
}

/**
 * Check if a version meets the minimum requirement
 */
export function meetsMinimumVersion(
  version: VersionInfo,
  minimum: VersionInfo
): boolean {
  return compareVersions(version, minimum) >= 0;
}

/**
 * Detect CLI version
 *
 * Caches results for performance.
 */
export async function detectVersion(
  tool: CLITool,
  options?: { useCache?: boolean; timeout?: number }
): Promise<VersionResult> {
  const { useCache = true, timeout = 5000 } = options ?? {};

  // Check cache
  if (useCache) {
    const cached = versionCache.get(tool);
    if (cached) {
      return cached;
    }
  }

  const cmdConfig = VERSION_COMMANDS[tool];
  const minVersion = MIN_SUPPORTED_VERSIONS[tool];

  try {
    const result = await execa(cmdConfig.command, cmdConfig.args, {
      timeout,
      reject: false,
    });

    // Handle command not found
    if (result.exitCode === 127 || result.failed) {
      const errorResult: VersionResult = {
        tool,
        available: false,
        supported: false,
        error: result.stderr || `Command '${cmdConfig.command}' not found`,
      };
      versionCache.set(tool, errorResult);
      return errorResult;
    }

    // Parse version from output
    const output = result.stdout || result.stderr;
    const version = parseVersion(output);

    if (!version) {
      const unknownResult: VersionResult = {
        tool,
        available: true,
        supported: true, // Assume supported if we can't parse
        path: cmdConfig.command,
        warning: `Could not parse version from output: "${output.slice(0, 100)}"`,
      };
      versionCache.set(tool, unknownResult);
      return unknownResult;
    }

    // Check if version is supported
    const supported = !minVersion || meetsMinimumVersion(version, minVersion);

    const versionResult: VersionResult = {
      tool,
      available: true,
      version,
      path: cmdConfig.command,
      supported,
      warning: supported
        ? undefined
        : `Version ${version.raw} is below minimum supported version ${minVersion?.raw}`,
    };

    versionCache.set(tool, versionResult);
    return versionResult;
  } catch (error) {
    const errorResult: VersionResult = {
      tool,
      available: false,
      supported: false,
      error: error instanceof Error ? error.message : String(error),
    };
    versionCache.set(tool, errorResult);
    return errorResult;
  }
}

/**
 * Detect versions of all known CLI tools
 */
export async function detectAllVersions(): Promise<Map<CLITool, VersionResult>> {
  const tools: CLITool[] = ['claude', 'codex', 'factory', 'crush', 'gemini'];

  const results = await Promise.all(tools.map((tool) => detectVersion(tool)));

  const resultMap = new Map<CLITool, VersionResult>();
  for (let i = 0; i < tools.length; i++) {
    resultMap.set(tools[i], results[i]);
  }

  return resultMap;
}

/**
 * Clear the version cache
 */
export function clearVersionCache(): void {
  versionCache.clear();
}

/**
 * Clear cache for a specific tool
 */
export function clearToolVersionCache(tool: CLITool): void {
  versionCache.delete(tool);
}

/**
 * Get all CLI tools
 */
export function getAllCLITools(): CLITool[] {
  return ['claude', 'codex', 'factory', 'crush', 'gemini'];
}

/**
 * Check if a tool is a known CLI tool
 */
export function isKnownCLITool(tool: string): tool is CLITool {
  return ['claude', 'codex', 'factory', 'crush', 'gemini'].includes(tool);
}

/**
 * Format version for display
 */
export function formatVersion(version: VersionInfo): string {
  let str = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease) {
    str += `-${version.prerelease}`;
  }
  if (version.build) {
    str += `+${version.build}`;
  }
  return str;
}

/**
 * Get version string for a tool (formatted)
 */
export async function getVersionString(tool: CLITool): Promise<string | null> {
  const result = await detectVersion(tool);
  if (!result.available || !result.version) {
    return null;
  }
  return formatVersion(result.version);
}
