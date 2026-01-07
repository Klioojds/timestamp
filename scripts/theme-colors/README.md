# Theme Color Validation

Automated contrast validation for accessible theme colors.

## Overview

This module validates that theme color schemes meet accessibility contrast requirements. It checks:

- **Text contrast** (4.5:1): Normal text on all background surfaces
- **UI component contrast** (3:1): Borders, focus rings, and other UI elements
- **Surface hierarchy** (1.1:1): Visual distinction between surface layers

## Module Structure

```text
scripts/theme-colors/
├── contrast.ts          # Contrast calculations (luminance, ratios)
├── palette-loader.ts    # Theme color palette loading from registry
├── reporter.ts          # Validation result formatting and reporting
├── index.ts             # Main validation runner (orchestrates all checks)
├── *.test.ts            # Unit tests for each module
└── README.md            # This file
```

## Usage

### Command Line

```bash
# Validate all themes, both modes
npm run validate:colors

# Strict mode (fail on any violations) - for local development
npm run validate:colors:strict

# Validate single theme
npm run validate:colors -- --theme=contribution-graph

# Validate specific mode
npm run validate:colors -- --mode=dark
npm run validate:colors -- --mode=light

# Combine filters
npm run validate:colors -- --theme=fireworks --mode=dark

# Allow failures (report but don't fail CI)
npm run validate:colors -- --allow-failures

# Show help
npm run validate:colors -- --help
```

**Note:** The default `validate:colors` script uses `--allow-failures` to avoid
blocking CI while accessibility issues are being fixed. Use
`validate:colors:strict` when you want failures to block the build.

### Programmatic

```typescript
import { validateThemes } from './theme-colors';

// Validate all themes
const summary = validateThemes();

// Validate with options
const summary = validateThemes({
  theme: 'contribution-graph',
  mode: 'dark',
});

console.log(`Passed: ${summary.passedThemes}/${summary.totalThemes}`);
console.log(`Failed checks: ${summary.failedChecks}`);
```

## Validation Checks

### Text Contrast (10 checks per mode)

- `text` on `surface` — Required: 4.5:1
- `text` on `surfaceElevated` — Required: 4.5:1
- `text` on `input` — Required: 4.5:1
- `textMuted` on `surface` — Required: 4.5:1
- `textMuted` on `surfaceElevated` — Required: 4.5:1
- `textMuted` on `input` — Required: 4.5:1
- `error` on `surface` — Required: 4.5:1
- `error` on `input` — Required: 4.5:1
- `success` on `surface` — Required: 4.5:1
- `success` on `surfaceElevated` — Required: 4.5:1

### UI Component Contrast (4 checks per mode)

- `border` on `background` — Required: 3:1
- `borderMuted` on `surface` — Required: 3:1
- `focusRing` on `background` — Required: 3:1
- `focusRing` on `surface` — Required: 3:1

### Surface Hierarchy (1 check per mode)

- `surfaceElevated` vs `surface` — Required: 1.1:1 contrast OR ΔL* ≥ 5

**Total**: 15 checks per theme-mode combination

## Output Format

```text
━━━ Validation Summary ━━━
Themes: 1/2 passed (50%)
Checks: 26/30 passed (87%)

⚠️  1 theme(s) have accessibility issues

contribution-graph (dark mode) - FAILED
  ✓ [PASS] text on surface: 15.54:1 (required 4.5:1)
  ✗ [FAIL] border on background: 1.55:1 (required 3.0:1)
    💡 Increase border lightness or decrease background lightness by ~93% to reach 3.0:1
```

## Exit Codes

- `0` — All validations passed, or `--allow-failures` is enabled
- `1` — One or more validations failed (without `--allow-failures`)

**CI Behavior:**

- `npm run validate:colors` uses `--allow-failures` (warns but doesn't block)
- `npm run validate:colors:strict` fails on violations (for enforcing standards)

## Adding New Validators

To add a new validation check:

1. **Add check to appropriate validator function** in `index.ts`:
   - `validateTextContrast()` for text-on-surface checks
   - `validateUIContrast()` for UI component checks
   - `validateSurfaceHierarchy()` for surface layer checks

2. **Update total check count** in this README (currently 15 per mode)

3. **Add test coverage** in `index.test.ts`

Example:

```typescript
// In validateTextContrast()
const warningOnSurfaceRatio = getContrastRatio(warningColor, surfaceColor);
results.push({
  combination: 'warning on surface',
  foreground: 'warning',
  background: 'surface',
  ratio: warningOnSurfaceRatio,
  required: 4.5,
  passed: meetsContrastRequirement(warningOnSurfaceRatio, 'normal-text'),
  mode,
});
```

## Testing

```bash
# Run all theme-colors tests
npm run test -- scripts/theme-colors/

# Run specific module tests
npm run test -- scripts/theme-colors/contrast
npm run test -- scripts/theme-colors/reporter
npm run test -- scripts/validate-theme-colors
```

## Implementation Notes

### Color Parsing

The `contrast.ts` module supports:

- Hex colors (`#rgb`, `#rrggbb`, `#rrggbbaa`)
- RGB/RGBA (`rgb(r,g,b)`, `rgba(r,g,b,a)`)
- HSL/HSLA (`hsl(h,s%,l%)`, `hsla(h,s%,l%,a)`)
- CSS `color-mix()` (blends two colors in sRGB)

### Contrast Calculation

Uses relative luminance formula:

```text
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
contrast = (L1 + 0.05) / (L2 + 0.05)
```

Where R, G, B are linearized sRGB components.

### Semi-Transparent Colors

Semi-transparent colors are composited over white background before calculating
contrast. This is a simplification but provides reasonable results for
validation purposes.

## Known Limitations

- Does not validate derived colors (e.g., `color-mix()` with CSS variables at runtime)
- Does not account for actual font sizes (assumes normal text)
- Does not validate gradient backgrounds
- Semi-transparent colors use white background assumption

## Future Enhancements

- [ ] Validate derived color combinations (error backgrounds, success buttons)
- [ ] Font size awareness (large text = 3:1 threshold)
- [ ] Gradient background support
- [ ] Integration with CI/CD (already available via `npm run validate:colors`)
- [ ] Visual report generation (HTML/Markdown)
