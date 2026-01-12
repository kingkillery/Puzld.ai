import type { GameState } from '../lib/types';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Helper class for parsing and merging game states.
 * Useful for game adapters that receive state updates as JSON from LLMs.
 */
export class GameStateParser {
  /**
   * Attempts to extract a GameState object from a string response.
   * Looks for JSON markdown blocks first, then tries to parse the first JSON-like object found.
   *
   * @param response - The string response from the model.
   * @returns A Partial<GameState> if parsing succeeds, or null if no valid JSON is found.
   */
  static extractState(response: string): Partial<GameState> | null {
    const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      const parsed = this.tryParseJson(jsonBlockMatch[1]);
      if (parsed) return parsed;
    }

    const firstBrace = response.indexOf('{');
    const lastBrace = response.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = response.slice(firstBrace, lastBrace + 1);
      const parsed = this.tryParseJson(candidate);
      if (parsed) return parsed;
    }

    return null;
  }

  /**
   * Merges a partial state update into the current game state.
   * Handles deep merging for the `data` property if it's a record.
   *
   * @param current - The current complete game state.
   * @param partial - The partial state update to apply.
   * @returns A new GameState object with updates applied.
   */
  static mergeState(current: GameState, partial: Partial<GameState>): GameState {
    const merged: GameState = {
      ...current,
      ...partial
    };

    if (partial.data !== undefined) {
      if (isRecord(current.data) && isRecord(partial.data)) {
        merged.data = { ...current.data, ...partial.data };
      } else {
        merged.data = partial.data;
      }
    }

    if (partial.moves !== undefined) {
      merged.moves = partial.moves;
    }

    return merged;
  }

  private static tryParseJson(input: string): Partial<GameState> | null {
    try {
      const parsed = JSON.parse(input) as unknown;
      return isRecord(parsed) ? (parsed as Partial<GameState>) : null;
    } catch {
      return null;
    }
  }
}