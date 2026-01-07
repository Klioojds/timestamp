/**
 * Generate the styles.scss file with complete ring theme styling.
 *
 * Includes:
 * - Intensity-based pulsing ring animation
 * - Celebration animations with traveling light effect
 * - Color mode support (light/dark)
 * - Responsive sizing
 * - Reduced motion support
 *
 * @param themeName - Kebab-case theme name
 * @returns Generated SCSS source code
 */
export function generateStylesScss(themeName: string): string {
  return `/**
 * ${themeName} theme styles
 *
 * All styling is in CSS - DOM structure uses classes from ui-builder.ts.
 * Uses responsive sizing with --font-scale CSS custom property.
 *
 * PULSING RING ANIMATION:
 * The pulsing ring demonstrates how to create smooth CSS animations controlled by JS.
 * - JS updates --pulse-progress (0-1) via requestAnimationFrame
 * - JS updates --glow-multiplier and --scale-range based on intensity
 * - CSS uses these values to control opacity, scale, and glow
 * - Animation respects prefers-reduced-motion and tab visibility
 *
 * INTENSITY LEVELS:
 * - CALM (>60s): Slow pulse, subtle glow
 * - BUILDING (30-60s): Faster pulse, increased glow
 * - INTENSE (10-30s): Rapid pulse, dramatic glow
 * - FINALE (<10s): Maximum intensity
 *
 * CELEBRATION:
 * - Traveling light effect using conic-gradient
 * - --celebration-progress controls light position around ring
 *
 * COLOR MODE STRATEGY (Clean CSS Custom Property Pattern):
 * 1. Define BOTH palettes as static variables (--my-color-for-light, --my-color-for-dark)
 * 2. Define ACTIVE variables that point to current mode
 * 3. Switch active variables via @media (prefers-color-scheme) and [data-color-mode]
 * 4. All selectors use ONLY the active variables - no duplication!
 */

// =============================================================================
// Theme Color Variables
// =============================================================================

// Static color palettes (never change based on mode)
:root {
  // Dark mode: Dark background with blue ring
  --${themeName}-bg-for-dark: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%);
  --${themeName}-color-for-dark: #58a6ff;
  --${themeName}-glow-for-dark: rgba(88, 166, 255, 0.5);
  --${themeName}-intense-for-dark: #ff6b6b;
  --${themeName}-intense-glow-for-dark: rgba(255, 107, 107, 0.6);
  --${themeName}-celebration-for-dark: gold;
  --${themeName}-celebration-glow-for-dark: rgba(255, 215, 0, 0.5);
  --${themeName}-text-for-dark: #ffffff;

  // Light mode: Clean white/gray background with darker blue ring
  --${themeName}-bg-for-light: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
  --${themeName}-color-for-light: #2563eb;
  --${themeName}-glow-for-light: rgba(37, 99, 235, 0.5);
  --${themeName}-intense-for-light: #dc2626;
  --${themeName}-intense-glow-for-light: rgba(220, 38, 38, 0.5);
  --${themeName}-celebration-for-light: #d97706;
  --${themeName}-celebration-glow-for-light: rgba(245, 158, 11, 0.5);
  --${themeName}-text-for-light: #1e293b;
}

// Active variables - switch based on color mode
@media (prefers-color-scheme: dark) {
  :root {
    --${themeName}-bg: var(--${themeName}-bg-for-dark);
    --${themeName}-color: var(--${themeName}-color-for-dark);
    --${themeName}-glow: var(--${themeName}-glow-for-dark);
    --${themeName}-intense: var(--${themeName}-intense-for-dark);
    --${themeName}-intense-glow: var(--${themeName}-intense-glow-for-dark);
    --${themeName}-celebration: var(--${themeName}-celebration-for-dark);
    --${themeName}-celebration-glow: var(--${themeName}-celebration-glow-for-dark);
    --${themeName}-text: var(--${themeName}-text-for-dark);
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --${themeName}-bg: var(--${themeName}-bg-for-light);
    --${themeName}-color: var(--${themeName}-color-for-light);
    --${themeName}-glow: var(--${themeName}-glow-for-light);
    --${themeName}-intense: var(--${themeName}-intense-for-light);
    --${themeName}-intense-glow: var(--${themeName}-intense-glow-for-light);
    --${themeName}-celebration: var(--${themeName}-celebration-for-light);
    --${themeName}-celebration-glow: var(--${themeName}-celebration-glow-for-light);
    --${themeName}-text: var(--${themeName}-text-for-light);
  }
}

// Explicit user preference overrides system
[data-color-mode='dark'] {
  --${themeName}-bg: var(--${themeName}-bg-for-dark);
  --${themeName}-color: var(--${themeName}-color-for-dark);
  --${themeName}-glow: var(--${themeName}-glow-for-dark);
  --${themeName}-intense: var(--${themeName}-intense-for-dark);
  --${themeName}-intense-glow: var(--${themeName}-intense-glow-for-dark);
  --${themeName}-celebration: var(--${themeName}-celebration-for-dark);
  --${themeName}-celebration-glow: var(--${themeName}-celebration-glow-for-dark);
  --${themeName}-text: var(--${themeName}-text-for-dark);
}

[data-color-mode='light'] {
  --${themeName}-bg: var(--${themeName}-bg-for-light);
  --${themeName}-color: var(--${themeName}-color-for-light);
  --${themeName}-glow: var(--${themeName}-glow-for-light);
  --${themeName}-intense: var(--${themeName}-intense-for-light);
  --${themeName}-intense-glow: var(--${themeName}-intense-glow-for-light);
  --${themeName}-celebration: var(--${themeName}-celebration-for-light);
  --${themeName}-celebration-glow: var(--${themeName}-celebration-glow-for-light);
  --${themeName}-text: var(--${themeName}-text-for-light);
}

// =============================================================================
// Theme Container
// =============================================================================

.${themeName}-theme {
  // Fill entire viewport with background
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;

  // Center content within safe area
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  // Respect safe area for content positioning
  padding: var(--safe-area-top, 60px) 20px var(--safe-area-bottom, 20px);
  box-sizing: border-box;

  // Visual styling
  background: var(--${themeName}-bg);
  color: var(--${themeName}-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  overflow: hidden;
}

// =============================================================================
// Pulsing Ring - Intensity-Scaled Animation
// =============================================================================

.pulsing-ring {
  position: absolute;
  width: min(300px, 60vw);
  height: min(300px, 60vw);
  border-radius: 50%;
  border: 4px solid var(--${themeName}-color);

  // CSS custom properties controlled by JS
  --pulse-progress: 0.5;
  --glow-multiplier: 1;
  --scale-range: 0.1;

  // Pulsing effect: opacity and scale respond to --pulse-progress
  opacity: calc(0.3 + var(--pulse-progress) * 0.7);
  transform: scale(calc(0.95 + var(--pulse-progress) * var(--scale-range)));

  // Glow effect scaled by --glow-multiplier
  box-shadow:
    0 0 calc(20px * var(--glow-multiplier)) var(--${themeName}-glow),
    0 0 calc(40px * var(--glow-multiplier)) var(--${themeName}-glow),
    inset 0 0 calc(15px * var(--glow-multiplier)) var(--${themeName}-glow);

  // Smooth transitions for intensity changes
  transition:
    border-color 0.5s ease-out,
    box-shadow 0.3s ease-out;

  pointer-events: none;
  z-index: 1;

  // =============================================================================
  // Intensity Level Styling
  // =============================================================================

  // CALM: Default state (>60s remaining)
  &[data-intensity='calm'] {
    border-color: var(--${themeName}-color);
  }

  // BUILDING: Getting closer (30-60s)
  &[data-intensity='building'] {
    border-color: var(--${themeName}-color);
    box-shadow:
      0 0 calc(25px * var(--glow-multiplier)) var(--${themeName}-glow),
      0 0 calc(50px * var(--glow-multiplier)) var(--${themeName}-glow),
      inset 0 0 calc(20px * var(--glow-multiplier)) var(--${themeName}-glow);
  }

  // INTENSE: Almost there (10-30s) - color shift toward red/orange
  &[data-intensity='intense'] {
    border-color: color-mix(in srgb, var(--${themeName}-color) 40%, var(--${themeName}-intense) 60%);
    box-shadow:
      0 0 calc(30px * var(--glow-multiplier)) var(--${themeName}-intense-glow),
      0 0 calc(60px * var(--glow-multiplier)) var(--${themeName}-intense-glow),
      inset 0 0 calc(25px * var(--glow-multiplier)) color-mix(in srgb, var(--${themeName}-glow) 50%, var(--${themeName}-intense-glow) 50%);
  }

  // FINALE: Final countdown (<10s) - maximum intensity
  &[data-intensity='finale'] {
    border-color: var(--${themeName}-intense);
    box-shadow:
      0 0 calc(40px * var(--glow-multiplier)) var(--${themeName}-intense-glow),
      0 0 calc(80px * var(--glow-multiplier)) var(--${themeName}-intense-glow),
      inset 0 0 calc(30px * var(--glow-multiplier)) var(--${themeName}-intense-glow);
  }

  // =============================================================================
  // Celebration State - Light Wave Traveling Along Circumference
  // =============================================================================

  &.is-celebrating {
    --celebration-progress: 0;

    // Golden celebration color
    border-color: var(--${themeName}-celebration);
    opacity: 1;
    transform: scale(1.2);
    background: transparent;

    // Base glow on the whole ring
    box-shadow:
      0 0 30px var(--${themeName}-celebration-glow),
      0 0 60px var(--${themeName}-celebration-glow),
      inset 0 0 20px var(--${themeName}-celebration-glow);

    // Transition for celebration entry
    transition:
      transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
      border-color 0.3s ease-out,
      box-shadow 0.3s ease-out;

    // Light wave effect: conic gradient masked to the ring's circumference
    &::after {
      content: '';
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      pointer-events: none;

      // Conic gradient creates the traveling "wave" of light
      background: conic-gradient(
        from calc(var(--celebration-progress, 0) * 360deg),
        rgba(255, 255, 200, 0.9) 0deg,
        rgba(255, 215, 0, 0.8) 20deg,
        rgba(255, 215, 0, 0.4) 40deg,
        transparent 80deg,
        transparent 280deg,
        rgba(255, 215, 0, 0.4) 320deg,
        rgba(255, 215, 0, 0.8) 340deg,
        rgba(255, 255, 200, 0.9) 360deg
      );

      // Mask to only show the ring's circumference
      mask: radial-gradient(
        circle,
        transparent 0%,
        transparent calc(50% - 12px),
        black calc(50% - 8px),
        black calc(50% + 8px),
        transparent calc(50% + 12px),
        transparent 100%
      );
      -webkit-mask: radial-gradient(
        circle,
        transparent 0%,
        transparent calc(50% - 12px),
        black calc(50% - 8px),
        black calc(50% + 8px),
        transparent calc(50% + 12px),
        transparent 100%
      );

      filter: blur(2px);
    }

    // Secondary wave traveling behind
    &::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      pointer-events: none;

      background: conic-gradient(
        from calc((var(--celebration-progress, 0) * 360deg) + 180deg),
        rgba(255, 215, 0, 0.6) 0deg,
        rgba(255, 215, 0, 0.3) 30deg,
        transparent 60deg,
        transparent 300deg,
        rgba(255, 215, 0, 0.3) 330deg,
        rgba(255, 215, 0, 0.6) 360deg
      );

      mask: radial-gradient(
        circle,
        transparent 0%,
        transparent calc(50% - 10px),
        black calc(50% - 6px),
        black calc(50% + 6px),
        transparent calc(50% + 10px),
        transparent 100%
      );
      -webkit-mask: radial-gradient(
        circle,
        transparent 0%,
        transparent calc(50% - 10px),
        black calc(50% - 6px),
        black calc(50% + 6px),
        transparent calc(50% + 10px),
        transparent 100%
      );

      filter: blur(1px);
    }
  }
}

// =============================================================================
// Light Mode: Golden wave colors for celebration
// =============================================================================

[data-color-mode='light'] {
  .pulsing-ring.is-celebrating {
    box-shadow:
      0 0 40px rgba(245, 158, 11, 0.5),
      0 0 80px rgba(245, 158, 11, 0.3),
      inset 0 0 25px rgba(245, 158, 11, 0.15);

    &::after {
      background: conic-gradient(
        from calc(var(--celebration-progress, 0) * 360deg),
        rgba(245, 158, 11, 0.95) 0deg,
        rgba(251, 191, 36, 0.8) 20deg,
        rgba(251, 191, 36, 0.5) 40deg,
        transparent 80deg,
        transparent 280deg,
        rgba(251, 191, 36, 0.5) 320deg,
        rgba(251, 191, 36, 0.8) 340deg,
        rgba(245, 158, 11, 0.95) 360deg
      );
    }

    &::before {
      background: conic-gradient(
        from calc((var(--celebration-progress, 0) * 360deg) + 180deg),
        rgba(251, 191, 36, 0.7) 0deg,
        rgba(251, 191, 36, 0.4) 30deg,
        transparent 60deg,
        transparent 300deg,
        rgba(251, 191, 36, 0.4) 330deg,
        rgba(251, 191, 36, 0.7) 360deg
      );
    }
  }
}

// =============================================================================
// Reduced Motion: Static ring, no pulsing or traveling light
// =============================================================================

@media (prefers-reduced-motion: reduce) {
  .pulsing-ring {
    opacity: 0.7;
    transform: scale(1);
    transition: none;
    --pulse-progress: 0.5;
    --glow-multiplier: 1;

    &.is-celebrating {
      transform: scale(1.1);

      &::after,
      &::before {
        display: none;
      }
    }
  }
}

// =============================================================================
// Countdown Display
// =============================================================================

.countdown-display {
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 20px);
  font-size: clamp(2rem, calc(4rem * var(--font-scale, 1)), 4rem);
  font-weight: bold;
  text-align: center;
  z-index: 10;
  margin-bottom: 2rem;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;

  .value {
    font-variant-numeric: tabular-nums;
  }

  .label {
    font-size: clamp(0.7rem, calc(1rem * var(--font-scale, 1)), 1rem);
    font-weight: normal;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.separator {
  opacity: 0.5;
  font-weight: normal;
}

// =============================================================================
// Celebration Message
// =============================================================================

.celebration-message {
  font-size: clamp(2rem, calc(4rem * var(--font-scale, 1)), 4rem);
  font-weight: bold;
  text-align: center;
  z-index: 10;
  margin: 0;
  padding: 1rem 2rem;

  color: var(--${themeName}-celebration);
  text-shadow:
    0 0 20px var(--${themeName}-celebration-glow),
    0 0 40px var(--${themeName}-celebration-glow);

  animation: celebration-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes celebration-appear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .celebration-message {
    animation: none;
  }
}

// =============================================================================
// Landing Page Background
// =============================================================================

.landing-theme-background--${themeName} {
  background: var(--${themeName}-bg);

  &.is-paused {
    opacity: 0.8;
  }
}
`;
}
