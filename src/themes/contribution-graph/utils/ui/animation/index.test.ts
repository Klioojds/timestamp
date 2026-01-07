import { describe, expect, it } from 'vitest';
import * as barrel from './index';
import * as ambient from './ambient-activity';
import * as loop from './activity-loop';
import * as transitions from './state-transitions';
import * as wall from './wall-build';

/** Tests for animation barrel exports. */
describe('animation/index barrel', () => {
  it('should re-export ambient activity helpers when the barrel is imported', () => {
    expect(barrel.activityTick).toBe(ambient.activityTick);
    expect(barrel.clearAmbientActivity).toBe(ambient.clearAmbientActivity);
  });

  it('should re-export activity loop helpers when accessed through the barrel', () => {
    expect(barrel.createActivityLoopState).toBe(loop.createActivityLoopState);
    expect(barrel.scheduleActivityTick).toBe(loop.scheduleActivityTick);
    expect(barrel.startActivity).toBe(transitions.startActivity);
    expect(barrel.stopActivity).toBe(transitions.stopActivity);
  });

  it('should re-export celebration and wall helpers when consuming the barrel', () => {
    expect(barrel.buildWall).toBe(wall.buildWall);
    expect(barrel.unbuildWall).toBe(wall.unbuildWall);
    expect(barrel.clearWall).toBe(wall.clearWall);
    expect(barrel.createCelebrationController).toBe(transitions.createCelebrationController);
  });
});