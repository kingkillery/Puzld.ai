import { describe, it, expect } from 'bun:test';
import { buildCampaignOptions } from './campaign';
import { CAMPAIGN_DEFAULTS } from '../../orchestrator/campaign/campaign-defaults';

describe('buildCampaignOptions', () => {
  const goal = 'Add user authentication';

  describe('defaults', () => {
    it('applies CAMPAIGN_DEFAULTS when no options provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.goal).toBe(goal);
      expect(options.stateDir).toBeUndefined();
      expect(options.planner).toBeUndefined();
      expect(options.subPlanner).toBeUndefined();
      expect(options.workers).toBeUndefined();
      expect(options.maxWorkers).toBeUndefined();
      expect(options.checkpointEvery).toBeUndefined();
      expect(options.freshStartEvery).toBeUndefined();
      // These fall back to string defaults via || operator
      expect(options.autonomy).toBe(CAMPAIGN_DEFAULTS.autonomy);
      expect(options.gitMode).toBe(CAMPAIGN_DEFAULTS.gitMode);
      expect(options.mergeStrategy).toBe(CAMPAIGN_DEFAULTS.mergeStrategy);
      expect(options.useDroid).toBe(true);
      expect(options.dryRun).toBe(false);
    });
  });

  describe('--state', () => {
    it('overrides stateDir when --state is provided', () => {
      const opts: Record<string, unknown> = { state: '/custom/state/dir' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.stateDir).toBe('/custom/state/dir');
    });

    it('leaves stateDir undefined when --state is not provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.stateDir).toBeUndefined();
    });
  });

  describe('--dry-run', () => {
    it('sets dryRun to true when --dry-run is passed', () => {
      const opts: Record<string, unknown> = { dryRun: true };
      const options = buildCampaignOptions(goal, opts);

      expect(options.dryRun).toBe(true);
    });

    it('sets dryRun to false when --dry-run is not passed', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.dryRun).toBe(false);
    });

    it('sets dryRun to false for non-boolean truthy values', () => {
      const opts: Record<string, unknown> = { dryRun: 'yes' };
      const options = buildCampaignOptions(goal, opts);

      // Only strict === true yields true
      expect(options.dryRun).toBe(false);
    });
  });

  describe('--resume (backward-compat flag)', () => {
    it('sets resume to true in opts (consumed by action handler)', () => {
      // The --resume flag is consumed directly by the action handler,
      // not by buildCampaignOptions. Verify buildCampaignOptions ignores it
      // and doesn't break when it's present.
      const opts: Record<string, unknown> = { resume: true };
      const options = buildCampaignOptions(goal, opts);

      // buildCampaignOptions doesn't produce a 'resume' field; it's handled externally
      expect(options.goal).toBe(goal);
      expect(options.dryRun).toBe(false);
    });
  });

  describe('--checkpoint-every', () => {
    it('parses numeric string to number', () => {
      const opts: Record<string, unknown> = { checkpointEvery: '10' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.checkpointEvery).toBe(10);
    });

    it('parses default string value correctly', () => {
      const opts: Record<string, unknown> = {
        checkpointEvery: String(CAMPAIGN_DEFAULTS.checkpointEvery)
      };
      const options = buildCampaignOptions(goal, opts);

      expect(options.checkpointEvery).toBe(CAMPAIGN_DEFAULTS.checkpointEvery);
    });

    it('returns NaN for non-numeric string (graceful handling)', () => {
      const opts: Record<string, unknown> = { checkpointEvery: 'abc' };
      const options = buildCampaignOptions(goal, opts);

      // parseInt('abc', 10) returns NaN - the function does not throw
      expect(options.checkpointEvery).toBeNaN();
    });

    it('leaves undefined when not provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.checkpointEvery).toBeUndefined();
    });
  });

  describe('--worker', () => {
    it('splits comma-separated values into worker array', () => {
      const opts: Record<string, unknown> = { worker: 'claude,gemini,codex' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.workers).toEqual(['claude', 'gemini', 'codex']);
    });

    it('handles single worker value', () => {
      const opts: Record<string, unknown> = { worker: 'claude' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.workers).toEqual(['claude']);
    });

    it('leaves workers undefined when not provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.workers).toBeUndefined();
    });

    it('handles workers with whitespace in names (no trim)', () => {
      const opts: Record<string, unknown> = { worker: 'claude , gemini' };
      const options = buildCampaignOptions(goal, opts);

      // split(',') does not trim - values include spaces
      expect(options.workers).toEqual(['claude ', ' gemini']);
    });
  });

  describe('--max-workers', () => {
    it('parses numeric string to number', () => {
      const opts: Record<string, unknown> = { maxWorkers: '4' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.maxWorkers).toBe(4);
    });

    it('parses default value correctly', () => {
      const opts: Record<string, unknown> = {
        maxWorkers: String(CAMPAIGN_DEFAULTS.maxWorkers)
      };
      const options = buildCampaignOptions(goal, opts);

      expect(options.maxWorkers).toBe(CAMPAIGN_DEFAULTS.maxWorkers);
    });

    it('returns NaN for non-numeric string (graceful handling)', () => {
      const opts: Record<string, unknown> = { maxWorkers: 'many' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.maxWorkers).toBeNaN();
    });

    it('leaves undefined when not provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.maxWorkers).toBeUndefined();
    });
  });

  describe('--fresh-start-every', () => {
    it('parses numeric string to number', () => {
      const opts: Record<string, unknown> = { freshStartEvery: '50' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.freshStartEvery).toBe(50);
    });

    it('returns NaN for invalid numeric string', () => {
      const opts: Record<string, unknown> = { freshStartEvery: 'invalid' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.freshStartEvery).toBeNaN();
    });
  });

  describe('--autonomy', () => {
    it('accepts checkpoint value', () => {
      const opts: Record<string, unknown> = { autonomy: 'checkpoint' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.autonomy).toBe('checkpoint');
    });

    it('accepts auto value', () => {
      const opts: Record<string, unknown> = { autonomy: 'auto' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.autonomy).toBe('auto');
    });

    it('defaults to checkpoint when not provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.autonomy).toBe('checkpoint');
    });
  });

  describe('--git-mode', () => {
    it('accepts task-branch value', () => {
      const opts: Record<string, unknown> = { gitMode: 'task-branch' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.gitMode).toBe('task-branch');
    });

    it('accepts campaign-branch value', () => {
      const opts: Record<string, unknown> = { gitMode: 'campaign-branch' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.gitMode).toBe('campaign-branch');
    });

    it('accepts patches value', () => {
      const opts: Record<string, unknown> = { gitMode: 'patches' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.gitMode).toBe('patches');
    });

    it('defaults to task-branch when not provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.gitMode).toBe('task-branch');
    });
  });

  describe('--merge-strategy', () => {
    it('accepts merge value', () => {
      const opts: Record<string, unknown> = { mergeStrategy: 'merge' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.mergeStrategy).toBe('merge');
    });

    it('accepts rebase value', () => {
      const opts: Record<string, unknown> = { mergeStrategy: 'rebase' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.mergeStrategy).toBe('rebase');
    });

    it('accepts squash value', () => {
      const opts: Record<string, unknown> = { mergeStrategy: 'squash' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.mergeStrategy).toBe('squash');
    });

    it('defaults to merge when not provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.mergeStrategy).toBe('merge');
    });
  });

  describe('--use-droid / --no-droid', () => {
    it('sets useDroid to true when --use-droid is passed', () => {
      const opts: Record<string, unknown> = { useDroid: true };
      const options = buildCampaignOptions(goal, opts);

      expect(options.useDroid).toBe(true);
    });

    it('sets useDroid to false when --no-droid sets useDroid to false', () => {
      // Commander's --no-X flag sets the property to false
      const opts: Record<string, unknown> = { useDroid: false };
      const options = buildCampaignOptions(goal, opts);

      expect(options.useDroid).toBe(false);
    });

    it('defaults useDroid to true when neither flag is provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      // opts.useDroid is undefined, undefined !== false => true
      expect(options.useDroid).toBe(true);
    });
  });

  describe('--planner and --sub-planner', () => {
    it('sets planner when provided', () => {
      const opts: Record<string, unknown> = { planner: 'claude' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.planner).toBe('claude');
    });

    it('sets subPlanner when provided', () => {
      const opts: Record<string, unknown> = { subPlanner: 'gemini' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.subPlanner).toBe('gemini');
    });

    it('leaves both undefined when not provided', () => {
      const opts: Record<string, unknown> = {};
      const options = buildCampaignOptions(goal, opts);

      expect(options.planner).toBeUndefined();
      expect(options.subPlanner).toBeUndefined();
    });
  });

  describe('combined options', () => {
    it('builds correct options with multiple flags', () => {
      const opts: Record<string, unknown> = {
        state: '/my/state',
        planner: 'claude',
        subPlanner: 'gemini',
        worker: 'droid:minimax,droid:glm',
        maxWorkers: '4',
        checkpointEvery: '10',
        freshStartEvery: '50',
        autonomy: 'auto',
        gitMode: 'campaign-branch',
        mergeStrategy: 'squash',
        useDroid: true,
        dryRun: true
      };

      const options = buildCampaignOptions(goal, opts);

      expect(options.goal).toBe(goal);
      expect(options.stateDir).toBe('/my/state');
      expect(options.planner).toBe('claude');
      expect(options.subPlanner).toBe('gemini');
      expect(options.workers).toEqual(['droid:minimax', 'droid:glm']);
      expect(options.maxWorkers).toBe(4);
      expect(options.checkpointEvery).toBe(10);
      expect(options.freshStartEvery).toBe(50);
      expect(options.autonomy).toBe('auto');
      expect(options.gitMode).toBe('campaign-branch');
      expect(options.mergeStrategy).toBe('squash');
      expect(options.useDroid).toBe(true);
      expect(options.dryRun).toBe(true);
    });
  });

  describe('invalid numeric values', () => {
    it('handles empty string for maxWorkers gracefully', () => {
      const opts: Record<string, unknown> = { maxWorkers: '' };
      const options = buildCampaignOptions(goal, opts);

      // Empty string is falsy, so parseInt is not called; value is undefined
      expect(options.maxWorkers).toBeUndefined();
    });

    it('handles empty string for checkpointEvery gracefully', () => {
      const opts: Record<string, unknown> = { checkpointEvery: '' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.checkpointEvery).toBeUndefined();
    });

    it('handles zero string for maxWorkers', () => {
      // '0' is falsy in the conditional check (opts.maxWorkers ? ...)
      const opts: Record<string, unknown> = { maxWorkers: '0' };
      const options = buildCampaignOptions(goal, opts);

      // '0' is truthy as a non-empty string, so parseInt is called
      expect(options.maxWorkers).toBe(0);
    });

    it('handles negative numeric string for checkpointEvery', () => {
      const opts: Record<string, unknown> = { checkpointEvery: '-5' };
      const options = buildCampaignOptions(goal, opts);

      expect(options.checkpointEvery).toBe(-5);
    });

    it('handles float string for maxWorkers (parseInt truncates)', () => {
      const opts: Record<string, unknown> = { maxWorkers: '3.7' };
      const options = buildCampaignOptions(goal, opts);

      // parseInt('3.7', 10) => 3
      expect(options.maxWorkers).toBe(3);
    });
  });
});
