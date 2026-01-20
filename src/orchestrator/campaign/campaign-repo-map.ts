import { quickIndex, getIndexSummary } from '../../indexing/index.js';

export interface RepoMapOptions {
  maxFiles?: number;
  maxSymbolsPerFile?: number;
}

export async function buildRepoMap(
  cwd: string,
  options: RepoMapOptions = {}
): Promise<string> {
  const { maxFiles = 40, maxSymbolsPerFile = 6 } = options;

  try {
    const result = await quickIndex(cwd);
    const lines: string[] = [getIndexSummary(result), ''];

    const structures = result.structures.slice(0, maxFiles);
    for (const structure of structures) {
      const symbols: string[] = [];

      for (const fn of structure.functions.slice(0, maxSymbolsPerFile)) {
        symbols.push(`fn:${fn.name}()`);
      }

      for (const cls of structure.classes.slice(0, maxSymbolsPerFile)) {
        symbols.push(`class:${cls.name}`);
      }

      for (const intf of structure.interfaces.slice(0, maxSymbolsPerFile)) {
        symbols.push(`interface:${intf.name}`);
      }

      const symbolText = symbols.length > 0 ? ` ${symbols.join(', ')}` : '';
      lines.push(`${structure.relativePath}${symbolText}`.trim());
    }

    if (result.structures.length > maxFiles) {
      lines.push(`... ${result.structures.length - maxFiles} more files omitted`);
    }

    return lines.join('\n');
  } catch {
    return 'Repo map unavailable (indexing failed).';
  }
}
