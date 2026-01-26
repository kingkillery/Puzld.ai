import { Box, Text } from 'ink';
import { COLORS } from '../theme';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import figlet from 'figlet';

const LOGO_PRIMARY = COLORS.info;
const LOGO_ACCENT = COLORS.accent;
const BORDER = COLORS.border.default;
const GRAY = COLORS.muted;

// Generate ASCII art banner for PK-puzld using figlet with Small font
// Returns lines that are already interleaved for side-by-side display
function generateBannerArt(): string[] {
  const pkArt = figlet.textSync('PK', { font: 'Small', horizontalLayout: 'full' });
  const puzldArt = figlet.textSync('puzld', { font: 'Small', horizontalLayout: 'full' });

  const pkLines = pkArt.split('\n');
  const puzldLines = puzldArt.split('\n');

  // Ensure both arrays have the same length by padding shorter one
  const maxLines = Math.max(pkLines.length, puzldLines.length);
  while (pkLines.length < maxLines) pkLines.push('');
  while (puzldLines.length < maxLines) puzldLines.push('');

  // Calculate max widths for proper alignment
  const maxPkWidth = Math.max(...pkLines.map(l => l.length));

  // Interleave lines: PK in white, puzld in red, properly padded
  const lines: string[] = [];
  for (let i = 0; i < maxLines; i++) {
    const pkLine = pkLines[i].padEnd(maxPkWidth);
    const puzldLine = puzldLines[i];
    lines.push(pkLine + '  ' + puzldLine); // PK + 2 spaces + puzld
  }

  return lines;
}

let bannerLines: string[] | null = null;
let cachedChangelog: ChangelogItem[] | null = null;

function getBannerLines(): string[] {
  if (!bannerLines) {
    bannerLines = generateBannerArt();
  }
  return bannerLines;
}

function getLatestChangelogCached(): ChangelogItem[] {
  if (!cachedChangelog) {
    cachedChangelog = getLatestChangelog();
  }
  return cachedChangelog;
}

// Box drawing characters - double lines
const BOX = {
  tl: '\u2554', tr: '\u2557', bl: '\u255A', br: '\u255D',
  h: '\u2550', v: '\u2551',
  lt: '\u2560', rt: '\u2563', tt: '\u2566', bt: '\u2569',
};

// Default column widths (used when no width prop provided)
const DEFAULT_LEFT_WIDTH = 54;
const DEFAULT_RIGHT_WIDTH = 20;

// Breakpoints for adaptive layout
const MIN_FULL_BANNER_WIDTH = 80;
const SINGLE_COLUMN_MAX_WIDTH = 95;

interface AgentStatus {
  name: string;
  ready: boolean;
}

interface ChangelogItem {
  text: string;
}

interface BannerProps {
  version?: string;
  minimal?: boolean;
  width?: number;
  agents?: AgentStatus[];
  changelog?: ChangelogItem[];
}

// Pad string to width
const pad = (str: string, width: number) => str + ' '.repeat(Math.max(0, width - str.length));
const center = (str: string, width: number) => {
  const left = Math.floor((width - str.length) / 2);
  return ' '.repeat(left) + str + ' '.repeat(width - str.length - left);
};

// Parse changelog to get latest version items
function getLatestChangelog(): ChangelogItem[] {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const changelogPath = join(__dirname, '..', '..', '..', 'CHANGELOG.md');
    const content = readFileSync(changelogPath, 'utf-8');

    const lines = content.split('\n');
    const items: ChangelogItem[] = [];
    let inVersion = false;

    for (const line of lines) {
      if (line.startsWith('## [') && !line.includes('[Unreleased]')) {
        if (inVersion) break; // Stop after first version
        inVersion = true;
        continue;
      }
      if (inVersion && line.startsWith('- ')) {
        const text = line.slice(2).trim();
        // Truncate long lines
        items.push({ text: text.length > 50 ? text.slice(0, 47) + '...' : text });
        if (items.length >= 2) break; // Only get 2 items
      }
    }
    return items;
  } catch {
    return [
      { text: 'Check /changelog for updates' }
    ];
  }
}

export function Banner({ version = '0.1.0', minimal = false, width, agents = [], changelog }: BannerProps) {
  // Auto-switch to minimal mode when terminal is too narrow for the full banner
  const useMinimal = minimal || (width !== undefined && width < MIN_FULL_BANNER_WIDTH);

  if (useMinimal) {
    return (
      <Box marginBottom={1}>
        <Text bold color={LOGO_PRIMARY}>PK-Puzld</Text>
        <Text dimColor> v{version}</Text>
      </Box>
    );
  }

  // Compute column widths from the width prop or fall back to defaults
  // Layout: ║ LEFT_WIDTH ║ RIGHT_WIDTH ║  => total = LEFT + RIGHT + 3 borders + 2 implicit
  // The INNER_WIDTH = LEFT + 1 (mid separator) + RIGHT, total chars = INNER_WIDTH + 2 (outer borders)
  const showRightPanel = width === undefined || width >= SINGLE_COLUMN_MAX_WIDTH;

  let leftWidth: number;
  let rightWidth: number;

  if (width !== undefined) {
    if (showRightPanel) {
      // Two-column mode: total = leftWidth + 1 (mid border) + rightWidth + 2 (outer borders)
      // So usable = width - 3 (two outer borders + one mid border)
      const usable = width - 3;
      leftWidth = Math.floor(usable * 0.72);
      rightWidth = usable - leftWidth;
    } else {
      // Single-column mode: total = leftWidth + 2 (outer borders)
      leftWidth = width - 2;
      rightWidth = 0;
    }
  } else {
    leftWidth = DEFAULT_LEFT_WIDTH;
    rightWidth = DEFAULT_RIGHT_WIDTH;
  }

  const innerWidth = showRightPanel ? leftWidth + 1 + rightWidth : leftWidth;

  // Get changelog items
  const changelogItems = changelog || getLatestChangelogCached();

  // Default order for display: claude, gemini, codex, ollama, mistral, factory
  const agentOrder = ['claude', 'gemini', 'codex', 'ollama', 'mistral', 'factory'];
  const defaultAgents: AgentStatus[] = agents.length > 0
    ? agentOrder.map(name => agents.find(a => a.name === name) || { name, ready: false })
    : agentOrder.map(name => ({ name, ready: false }));

  const versionLine = `v${version} - Multi-LLM Orchestrator`;
  const versionPadded = center(versionLine, innerWidth);

  // Divider lines adapt to layout mode
  const midLine = showRightPanel
    ? BOX.lt + BOX.h.repeat(leftWidth) + BOX.tt + BOX.h.repeat(rightWidth) + BOX.rt
    : BOX.lt + BOX.h.repeat(leftWidth) + BOX.rt;
  const botLine = showRightPanel
    ? BOX.bl + BOX.h.repeat(leftWidth) + BOX.bt + BOX.h.repeat(rightWidth) + BOX.br
    : BOX.bl + BOX.h.repeat(leftWidth) + BOX.br;

  // Floating divider for left panel (1 space gap on each side)
  const floatingDivider = ' ' + BOX.h.repeat(Math.max(0, leftWidth - 2)) + ' ';

  // Quick start commands
  const commands = [
    ' /compare claude,gemini "task"',
    ' /autopilot "complex task"',
    ' /workflow code-review "code"',
  ];

  // Helper to render a full-width single-column row (no right panel)
  const renderSingleRow = (content: string, key: string, dim?: boolean) => (
    <Box key={key}>
      <Text color={BORDER}>{BOX.v}</Text>
      {dim ? (
        <Text dimColor>{pad(content, leftWidth)}</Text>
      ) : (
        <Text>{pad(content, leftWidth)}</Text>
      )}
      <Text color={BORDER}>{BOX.v}</Text>
    </Box>
  );

  // Helper to render a row with left and right content
  const renderRow = (leftContent: string, rightContent: string, key: string, leftDim?: boolean) => {
    if (!showRightPanel) {
      return renderSingleRow(leftContent, key, leftDim);
    }
    return (
      <Box key={key}>
        <Text color={BORDER}>{BOX.v}</Text>
        {leftDim ? (
          <Text dimColor>{pad(leftContent, leftWidth)}</Text>
        ) : (
          <Text>{pad(leftContent, leftWidth)}</Text>
        )}
        <Text color={BORDER}>{BOX.v}</Text>
        <Text>{pad(rightContent, rightWidth)}</Text>
        <Text color={BORDER}>{BOX.v}</Text>
      </Box>
    );
  };

  // Helper to render agent status row (centered in right panel)
  const renderAgentRow = (leftContent: string, agent: AgentStatus, leftDim?: boolean) => {
    if (!showRightPanel) {
      return renderSingleRow(leftContent, `agent-${agent.name}`, leftDim);
    }

    const bullet = agent.ready ? '●' : '○';
    const statusText = agent.ready ? 'ready' : 'off';
    // Format: " ● name    status " - bullet colored, rest normal, centered
    const nameAndStatus = `${agent.name.padEnd(7)} ${statusText}`;
    const contentLen = 1 + 1 + nameAndStatus.length; // bullet + space + rest
    const totalPad = rightWidth - contentLen;
    const leftPad = Math.floor(totalPad / 2);
    const rightPad = totalPad - leftPad;

    return (
      <Box key={`agent-${agent.name}`}>
        <Text color={BORDER}>{BOX.v}</Text>
        <Text dimColor={leftDim}>{pad(leftContent, leftWidth)}</Text>
        <Text color={BORDER}>{BOX.v}</Text>
        <Text>{' '.repeat(Math.max(0, leftPad))}</Text>
        <Text color={agent.ready ? 'green' : GRAY}>{bullet}</Text>
        <Text> {nameAndStatus}</Text>
        <Text>{' '.repeat(Math.max(0, rightPad))}</Text>
        <Text color={BORDER}>{BOX.v}</Text>
      </Box>
    );
  };

  // Determine whether ASCII art fits in the available inner width
  const bannerArtLines = getBannerLines();
  const artWidth = bannerArtLines[0]?.length || 0;
  const useAsciiArt = artWidth <= innerWidth;

  // Top border tag content for length calculation
  const tagContent = ` PK-Puzld v${version} `;
  const topRemainder = Math.max(0, innerWidth - 3 - tagContent.length);

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Top border with version tag */}
      <Box>
        <Text color={BORDER}>{BOX.tl + BOX.h.repeat(3)}</Text>
        <Text color={LOGO_ACCENT}> PK-Puzld</Text>
        <Text dimColor> v{version} </Text>
        <Text color={BORDER}>{BOX.h.repeat(topRemainder) + BOX.tr}</Text>
      </Box>

      {/* Empty padding line */}
      <Box>
        <Text color={BORDER}>{BOX.v}</Text>
        <Text>{' '.repeat(innerWidth)}</Text>
        <Text color={BORDER}>{BOX.v}</Text>
      </Box>

      {/* ASCII Art Logo section or text fallback */}
      {useAsciiArt ? (
        (() => {
          const logoWidth = artWidth;
          const logoPadLeft = Math.floor((innerWidth - logoWidth) / 2);

          return (
            <>
              {bannerArtLines.map((line, index) => (
                <Box key={`logo-${index}`}>
                  <Text color={BORDER}>{BOX.v}</Text>
                  <Text>{' '.repeat(Math.max(0, logoPadLeft))}</Text>
                  {/* Split line into PK (white) and puzld (red) parts */}
                  {line.includes('  ') ? (
                    <>
                      <Text bold color={LOGO_PRIMARY}>{line.split('  ')[0]}</Text>
                      <Text>{'  '}</Text>
                      <Text bold color={LOGO_ACCENT}>{line.split('  ')[1]}</Text>
                    </>
                  ) : (
                    <Text bold color={LOGO_PRIMARY}>{line}</Text>
                  )}
                  <Text color={BORDER}>{BOX.v}</Text>
                </Box>
              ))}
            </>
          );
        })()
      ) : (
        <Box>
          <Text color={BORDER}>{BOX.v}</Text>
          <Text bold color={LOGO_PRIMARY}>{center('PK-Puzld', innerWidth)}</Text>
          <Text color={BORDER}>{BOX.v}</Text>
        </Box>
      )}

      {/* Version line */}
      <Box>
        <Text color={BORDER}>{BOX.v}</Text>
        <Text dimColor>{versionPadded}</Text>
        <Text color={BORDER}>{BOX.v}</Text>
      </Box>

      {/* Empty padding line */}
      <Box>
        <Text color={BORDER}>{BOX.v}</Text>
        <Text>{' '.repeat(innerWidth)}</Text>
        <Text color={BORDER}>{BOX.v}</Text>
      </Box>

      {/* Middle divider */}
      <Text color={BORDER}>{midLine}</Text>

      {/* Panel headers */}
      {showRightPanel ? (
        <Box>
          <Text color={BORDER}>{BOX.v}</Text>
          <Text bold color="white">{pad(' Quick start', leftWidth)}</Text>
          <Text color={BORDER}>{BOX.v}</Text>
          <Text bold color="white">{center('Status', rightWidth)}</Text>
          <Text color={BORDER}>{BOX.v}</Text>
        </Box>
      ) : (
        <Box>
          <Text color={BORDER}>{BOX.v}</Text>
          <Text bold color="white">{pad(' Quick start', leftWidth)}</Text>
          <Text color={BORDER}>{BOX.v}</Text>
        </Box>
      )}

      {/* Command 1 + empty right (offsets agents down) */}
      {renderRow(commands[0] || '', '', 'cmd-1', true)}

      {/* Command 2 + Agent 1 */}
      {renderAgentRow(commands[1] || '', defaultAgents[0], true)}

      {/* Command 3 + Agent 2 */}
      {renderAgentRow(commands[2] || '', defaultAgents[1], true)}

      {/* Floating divider + Agent 3 */}
      {(() => {
        const agent = defaultAgents[2];

        if (!showRightPanel) {
          return (
            <Box key={`agent-${agent.name}`}>
              <Text color={BORDER}>{BOX.v}</Text>
              <Text color={BORDER}>{floatingDivider}</Text>
              <Text color={BORDER}>{BOX.v}</Text>
            </Box>
          );
        }

        const bullet = agent.ready ? '●' : '○';
        const statusText = agent.ready ? 'ready' : 'off';
        const nameAndStatus = `${agent.name.padEnd(7)} ${statusText}`;
        const contentLen = 1 + 1 + nameAndStatus.length;
        const totalPad = rightWidth - contentLen;
        const leftPadAmt = Math.floor(totalPad / 2);
        const rightPadAmt = totalPad - leftPadAmt;
        return (
          <Box key={`agent-${agent.name}`}>
            <Text color={BORDER}>{BOX.v}</Text>
            <Text color={BORDER}>{floatingDivider}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
            <Text>{' '.repeat(Math.max(0, leftPadAmt))}</Text>
            <Text color={agent.ready ? 'green' : GRAY}>{bullet}</Text>
            <Text> {nameAndStatus}</Text>
            <Text>{' '.repeat(Math.max(0, rightPadAmt))}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
          </Box>
        );
      })()}

      {/* What's new + Agent 4 */}
      {(() => {
        const agent = defaultAgents[3];

        if (!showRightPanel) {
          return (
            <Box key="whatsnew-agent4">
              <Text color={BORDER}>{BOX.v}</Text>
              <Text bold color="white">{pad(` What's new in v${version}`, leftWidth)}</Text>
              <Text color={BORDER}>{BOX.v}</Text>
            </Box>
          );
        }

        const bullet = agent.ready ? '●' : '○';
        const statusText = agent.ready ? 'ready' : 'off';
        const nameAndStatus = `${agent.name.padEnd(7)} ${statusText}`;
        const contentLen = 1 + 1 + nameAndStatus.length;
        const totalPad = rightWidth - contentLen;
        const leftPadAmt = Math.floor(totalPad / 2);
        const rightPadAmt = totalPad - leftPadAmt;
        return (
          <Box key="whatsnew-agent4">
            <Text color={BORDER}>{BOX.v}</Text>
            <Text bold color="white">{pad(` What's new in v${version}`, leftWidth)}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
            <Text>{' '.repeat(Math.max(0, leftPadAmt))}</Text>
            <Text color={agent.ready ? 'green' : GRAY}>{bullet}</Text>
            <Text> {nameAndStatus}</Text>
            <Text>{' '.repeat(Math.max(0, rightPadAmt))}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
          </Box>
        );
      })()}

      {/* Changelog item 1 + Agent 5 (mistral) */}
      {(() => {
        const agent = defaultAgents[4];
        const item = changelogItems[0];

        if (!showRightPanel) {
          return renderSingleRow('  - ' + (item?.text || ''), 'changelog-0-agent5', true);
        }

        const bullet = agent.ready ? '●' : '○';
        const statusText = agent.ready ? 'ready' : 'off';
        const nameAndStatus = `${agent.name.padEnd(7)} ${statusText}`;
        const contentLen = 1 + 1 + nameAndStatus.length;
        const totalPad = rightWidth - contentLen;
        const leftPadAmt = Math.floor(totalPad / 2);
        const rightPadAmt = totalPad - leftPadAmt;
        return (
          <Box key="changelog-0-agent5">
            <Text color={BORDER}>{BOX.v}</Text>
            <Text dimColor>{pad('  - ' + (item?.text || ''), leftWidth)}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
            <Text>{' '.repeat(Math.max(0, leftPadAmt))}</Text>
            <Text color={agent.ready ? 'green' : GRAY}>{bullet}</Text>
            <Text> {nameAndStatus}</Text>
            <Text>{' '.repeat(Math.max(0, rightPadAmt))}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
          </Box>
        );
      })()}

      {/* Changelog item 2 (or blank) + Agent 6 (factory) */}
      {defaultAgents[5] ? (
        showRightPanel ? renderAgentRow(
          changelogItems[1] ? '  - ' + changelogItems[1].text : '',
          defaultAgents[5],
          true
        ) : renderSingleRow(
          changelogItems[1] ? '  - ' + changelogItems[1].text : '',
          'agent-factory-single',
          true
        )
      ) : null}

      {/* Remaining changelog items (from item 3 onward) */}
      {changelogItems.slice(2).map((item, i) => {
        if (!showRightPanel) {
          return renderSingleRow('  - ' + item.text, `changelog-${i + 2}`, true);
        }
        return (
          <Box key={`changelog-${i + 2}`}>
            <Text color={BORDER}>{BOX.v}</Text>
            <Text dimColor>{pad('  - ' + item.text, leftWidth)}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
            <Text>{' '.repeat(rightWidth)}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
          </Box>
        );
      })}

      {/* In single-column mode, show agent status as a compact row after the main content */}
      {!showRightPanel && (
        <>
          {/* Divider before agents */}
          <Box>
            <Text color={BORDER}>{BOX.v}</Text>
            <Text color={BORDER}>{floatingDivider}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
          </Box>
          {/* Agents header */}
          <Box>
            <Text color={BORDER}>{BOX.v}</Text>
            <Text bold color="white">{pad(' Agents', leftWidth)}</Text>
            <Text color={BORDER}>{BOX.v}</Text>
          </Box>
          {/* Agent status rows in single-column */}
          {defaultAgents.map(agent => {
            const bullet = agent.ready ? '●' : '○';
            const statusText = agent.ready ? 'ready' : 'off';
            const agentLine = ` ${bullet} ${agent.name.padEnd(10)} ${statusText}`;
            return (
              <Box key={`single-agent-${agent.name}`}>
                <Text color={BORDER}>{BOX.v}</Text>
                <Text>{'  '}</Text>
                <Text color={agent.ready ? 'green' : GRAY}>{bullet}</Text>
                <Text>{pad(` ${agent.name.padEnd(10)} ${statusText}`, leftWidth - 3)}</Text>
                <Text color={BORDER}>{BOX.v}</Text>
              </Box>
            );
          })}
        </>
      )}

      {/* Bottom border */}
      <Text color={BORDER}>{botLine}</Text>
    </Box>
  );
}

export function WelcomeMessage() {
  return (
    <Box marginBottom={1} flexDirection="column">
      <Text dimColor>Type a message or use /help for commands</Text>
    </Box>
  );
}
