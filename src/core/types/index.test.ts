import { describe, it, expectTypeOf } from 'vitest';

import type {
  AnimationStateContext,
  CelebrationState,
  ColorMode,
  CountdownConfig,
  CountdownMode,
  ThemeColors,
  ThemeModeColors,
  ThemeStyles,
  TimeRemaining,
} from './index';

describe('core types', () => {
  it('defines countdown mode and celebration state unions', () => {
    expectTypeOf<CountdownMode>().toEqualTypeOf<'timer' | 'absolute' | 'wall-clock'>();
    expectTypeOf<CelebrationState>().toEqualTypeOf<'counting' | 'celebrating' | 'celebrated'>();
  });

  it('exposes countdown config shape', () => {
    expectTypeOf<CountdownConfig>().toMatchTypeOf<{
      mode: CountdownMode;
      targetDate: Date;
      completionMessage: string;
      theme: string;
      timezone: string;
      durationSeconds?: number;
      wallClockTarget?: { year: number; month: number; day: number; hours: number; minutes: number; seconds: number };
      showWorldMap?: boolean;
    }>();
  });

  it('captures animation and time remaining structures', () => {
    expectTypeOf<AnimationStateContext>().toMatchTypeOf<{
      shouldAnimate: boolean;
      prefersReducedMotion: boolean;
      reason?: string;
    }>();

    expectTypeOf<TimeRemaining>().toMatchTypeOf<{
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
      total: number;
    }>();
  });

  it('defines color-related types', () => {
    expectTypeOf<ColorMode>().toEqualTypeOf<'light' | 'dark' | 'system'>();
    expectTypeOf<ThemeModeColors>().toMatchTypeOf<Record<string, string | undefined>>();
    expectTypeOf<ThemeColors>().toMatchTypeOf<{ dark: ThemeModeColors; light: ThemeModeColors }>();
    expectTypeOf<ThemeStyles>().toMatchTypeOf<Record<string, string>>();
  });
});