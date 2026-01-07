/**
 * Fireworks DOM utilities - theme building, countdown updates, and starfield.
 */

// Time page theme building
export { buildThemeDOM, type ThemeElements } from './theme-builder';

// Countdown display updates
export {
type CountdownDOMRefs,
    showCelebration,
    showCountdown,
    updateCountdown} from './countdown-updates';

// Landing page starfield
export {
    buildStarfield,
    pauseStarAnimations,
    resumeStarAnimations
} from './starfield-builder';

