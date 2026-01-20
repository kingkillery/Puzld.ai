import { describe, test, expect } from 'bun:test';
import { CAMPAIGN_DEFAULTS } from './campaign-defaults';

describe('campaign defaults', () => {
  test('provides required defaults', () => {
    expect(CAMPAIGN_DEFAULTS.planner).toBeTruthy();
    expect(CAMPAIGN_DEFAULTS.subPlanner).toBeTruthy();
    expect(CAMPAIGN_DEFAULTS.workers.length).toBeGreaterThan(0);
    expect(CAMPAIGN_DEFAULTS.maxWorkers).toBeGreaterThan(0);
    expect(CAMPAIGN_DEFAULTS.checkpointEvery).toBeGreaterThan(0);
    expect(CAMPAIGN_DEFAULTS.freshStartEvery).toBeGreaterThan(0);
  });
});
