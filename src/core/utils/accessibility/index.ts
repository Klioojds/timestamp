/**
 * Shared Accessibility Utilities
 * Provides reusable patterns for accessible keyboard navigation, focus management,
 * screen reader announcements, and DOM attribute optimization.
 */

// Focus Trap - modal dialog focus management
export {
    createFocusTrap,
    type FocusTrapController,
    type FocusTrapOptions
} from './focus-trap';

// Roving Tabindex - keyboard navigation for composite widgets
export {
    createRovingTabindex,
    type RovingOrientation,
    type RovingTabindexController,
    type RovingTabindexOptions
} from './roving-tabindex';

// Announcements, reduced motion, attributes, and visually hidden elements
export {
type AccessibilityManager,
    type AttributeCache,     createAccessibilityManager,
    createAttributeCache,
    createVisuallyHiddenElement,
    prefersReducedMotion,
    reducedMotionManager,
    setAttributeIfChanged, type VisuallyHiddenOptions
} from './announcements';

