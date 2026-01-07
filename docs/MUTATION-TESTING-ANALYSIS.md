# Mutation Testing Analysis & Test Gap Report

**Generated**: 2026-01-07  
**Mutation Score**: ~43.7% (below 50% threshold)  
**Status**: ⚠️ Action Required

## Executive Summary

The codebase has **1,303 survived mutations** and **3,250 mutations with no coverage**, indicating significant test gaps. The primary issues are:

1. **Missing value assertions** - Tests verify behavior but not specific string values
2. **Uncovered conditional branches** - Edge cases and error paths not tested  
3. **No coverage in scripts/** - Build/utility scripts have minimal tests

## Mutation Statistics

```
Killed:       3,587  ✅ Good - mutations caught by tests
Survived:     1,303  ⚠️  Tests don't verify these code changes
NoCoverage:   3,250  ❌ Code not executed by tests
Timeout:         75  ⏱️  Tests too slow or infinite loops
CompileError: 2,434  🔨 Invalid mutations (type system caught)
Ignored:        207  ⏭️  Explicitly excluded
```

## Top Files with Survived Mutations

| File | Survived | Category |
|------|----------|----------|
| `scripts/image-generation/theme-previews.ts` | 105 | Untested scripts |
| `src/components/theme-picker/sort-dropdown.ts` | 74 | String literals |
| `scripts/theme-colors/contrast.ts` | 64 | Untested scripts |
| `src/core/solar/index.ts` | 55 | Mathematical calculations |
| `scripts/utils/theme-validation.ts` | 55 | Untested scripts |
| `src/components/mobile-menu/index.ts` | 52 | DOM manipulation |
| `src/components/tooltip/tooltip.ts` | 45 | String literals |
| `src/components/theme-picker/cards.ts` | 42 | DOM structure |
| `src/core/perf/live-monitor.ts` | 42 | Performance monitoring |
| `src/core/utils/accessibility/roving-tabindex.ts` | 41 | Complex state |

## Mutation Types Analysis

### Most Common Survived Mutations

| Mutator Type | Count | Test Gap Pattern |
|--------------|-------|------------------|
| **ConditionalExpression** | 378 | Missing edge case tests for `condition ? a : b` |
| **StringLiteral** | 332 | Tests don't verify exact string values |
| **ArithmeticOperator** | 132 | Boundary conditions not tested (`+` → `-`, `*` → `/`) |
| **EqualityOperator** | 101 | Missing tests for `===` vs `!==`, `==` vs `!=` |
| **BlockStatement** | 84 | Empty blocks or missing branch coverage |
| **BooleanLiteral** | 60 | Tests don't verify `true` vs `false` values |
| **LogicalOperator** | 56 | Missing tests for `&&` vs `||` |
| **MethodExpression** | 37 | Method calls not verified (e.g., `Math.random()`) |
| **ObjectLiteral** | 25 | Object structure not validated |
| **ArrowFunction** | 24 | Function return values not checked |

## Key Findings

### 1. String Literal Mutations (332 survived)

**Problem**: Tests verify behavior but don't check exact values.

**Example from sort-dropdown.ts**:
```typescript
// Source code
button.className = 'theme-selector-sort-button';
button.setAttribute('data-testid', 'theme-sort-button');

// Mutation survived because test only checked if button exists
// ❌ Bad test:
expect(button).toBeTruthy();

// ✅ Good test that kills mutation:
expect(button.className).toBe('theme-selector-sort-button');
expect(button.getAttribute('data-testid')).toBe('theme-sort-button');
```

**Fix Pattern**:
- Verify exact className values
- Assert data-testid attributes
- Check aria-label text content
- Validate CSS selectors used in queries

### 2. Conditional Expression Mutations (378 survived)

**Problem**: Both branches of ternaries not tested.

**Example**:
```typescript
// Source code
const value = condition ? 'active' : 'inactive';

// Mutations that survived:
// 1. condition ? true : 'inactive'
// 2. condition ? false : 'inactive'
// 3. condition ? 'active' : true
// 4. condition ? 'active' : false

// ✅ Tests needed:
it('should return active when condition is true', () => {
  // Set condition = true
  expect(value).toBe('active');
});

it('should return inactive when condition is false', () => {
  // Set condition = false
  expect(value).toBe('inactive');
});
```

**Fix Pattern**:
- Test both branches of every ternary
- Verify exact return values, not just truthiness
- Test with actual true/false, not truthy/falsy values

### 3. Arithmetic Operator Mutations (132 survived)

**Problem**: Boundary values and edge cases not tested.

**Example**:
```typescript
// Source code
const result = a + b;

// Mutations: a - b, a * b, a / b

// ✅ Tests needed:
it('should add positive numbers correctly', () => {
  expect(add(2, 3)).toBe(5); // Not just > 0
});

it('should handle zero', () => {
  expect(add(0, 5)).toBe(5);
  expect(add(5, 0)).toBe(5);
});

it('should handle negative numbers', () => {
  expect(add(-2, 3)).toBe(1);
});
```

**Fix Pattern**:
- Test with specific numeric values
- Include boundary cases (0, negative, max/min)
- Verify exact results, not approximations

### 4. Scripts Directory (279 survived total)

**Problem**: Build and utility scripts have minimal test coverage.

**Affected files**:
- `scripts/image-generation/theme-previews.ts` (105)
- `scripts/theme-colors/contrast.ts` (64)
- `scripts/utils/theme-validation.ts` (55)
- `scripts/theme-colors/reporter.ts` (34)
- `scripts/theme-colors/index.ts` (27)

**Recommendation**: These are build-time tools. Consider:
1. Add integration tests for critical paths
2. Accept lower coverage for one-off scripts
3. Focus on validation logic that affects runtime

## Example: sort-dropdown.ts Improvements

### Before (14 tests)
```typescript
it('should open menu on button click', () => {
  button.click();
  expect(menu.getAttribute('aria-hidden')).toBe('false');
});
```

### After (32 tests) - Added Tests

1. **DOM Structure Tests** (killed StringLiteral mutations):
   - Verify exact className values
   - Check data-testid attributes
   - Validate aria-label text
   - Confirm unique ID generation

2. **Boundary Condition Tests** (killed ConditionalExpression mutations):
   - Test focus clamping at edges
   - Verify Enter key behavior when open/closed
   - Test click inside vs outside container

3. **Attribute Verification Tests**:
   - Check all aria-* attributes
   - Verify data-* attributes on options
   - Confirm button type="button"
   - Validate role="option" on menu items

**Result**: Reduced survived mutations from 74 to an estimated ~20 (will verify with next mutation test run).

## Recommended Actions

### Priority 1: High-Impact Files (Week 1)

Focus on files with many survived mutations in critical user paths:

1. ✅ **sort-dropdown.ts** (74 → ~20 survived) - COMPLETED
2. **mobile-menu/index.ts** (52 survived)
   - Add tests for menu state transitions
   - Verify DOM structure and classes
   - Test keyboard navigation

3. **tooltip/tooltip.ts** (45 survived)
   - Test tooltip positioning logic
   - Verify aria-describedby wiring
   - Check show/hide transitions

4. **theme-picker/cards.ts** (42 survived)
   - Verify card rendering
   - Test favorite button interactions
   - Check theme metadata display

### Priority 2: Core Logic (Week 2)

5. **solar/index.ts** (55 survived)
   - Add tests for solar calculations
   - Verify twilight time computations
   - Test boundary cases (poles, equator)

6. **perf/live-monitor.ts** (42 survived)
   - Test metric collection
   - Verify threshold alerts
   - Check memory tracking

7. **roving-tabindex.ts** (41 survived)
   - Test focus management
   - Verify keyboard navigation
   - Check boundary cases

### Priority 3: URL & State Management (Week 3)

8. **core/url/url.ts** (27 survived)
   - Test URL building
   - Verify parameter encoding
   - Check deep link parsing

9. **orchestrator/ui/theme-color-manager.ts** (22 survived)
   - Test CSS variable updates
   - Verify color scheme switching
   - Check fallback values

### Priority 4: Scripts (Lower Priority)

Consider whether to invest in testing build scripts:
- **Pros**: Catches bugs before they affect builds
- **Cons**: Overhead for code that runs occasionally
- **Recommendation**: Add tests for validation logic only

## Testing Patterns That Kill Mutations

### Pattern 1: Exact Value Assertions

```typescript
// ❌ Weak - mutation can survive
expect(element.className).toBeTruthy();

// ✅ Strong - kills StringLiteral mutations
expect(element.className).toBe('expected-class-name');
```

### Pattern 2: Boundary Testing

```typescript
// ✅ Test all boundaries of conditionals
describe('clamp function', () => {
  it('should return min when value below range', () => {
    expect(clamp(5, 10, 20)).toBe(10);
  });
  
  it('should return max when value above range', () => {
    expect(clamp(25, 10, 20)).toBe(20);
  });
  
  it('should return value when within range', () => {
    expect(clamp(15, 10, 20)).toBe(15);
  });
  
  it('should handle boundary values', () => {
    expect(clamp(10, 10, 20)).toBe(10);
    expect(clamp(20, 10, 20)).toBe(20);
  });
});
```

### Pattern 3: Both Branches of Ternaries

```typescript
// Source: const label = isOpen ? 'Close' : 'Open';

it('should show Close when open', () => {
  component.open();
  expect(component.getLabel()).toBe('Close');
});

it('should show Open when closed', () => {
  component.close();
  expect(component.getLabel()).toBe('Open');
});
```

### Pattern 4: Operator Verification

```typescript
// Source: const total = price * quantity;

it('should calculate total correctly', () => {
  expect(calculateTotal(10, 3)).toBe(30); // Not 13 (+ mutation) or 7 (- mutation)
});
```

### Pattern 5: Method Call Verification

```typescript
// Source: element.classList.add('active');

it('should add active class', () => {
  component.activate();
  expect(element.classList.contains('active')).toBe(true);
  // Better: verify the exact method was called
  expect(addClassSpy).toHaveBeenCalledWith('active');
});
```

## Next Steps

### Immediate (This Week)
1. ✅ Complete sort-dropdown.ts improvements
2. Run full mutation test to measure improvement
3. Apply same patterns to mobile-menu and tooltip components

### Short Term (Next 2 Weeks)
4. Create test templates for common patterns
5. Address top 10 files with survived mutations
6. Add pre-commit hook to check mutation score

### Long Term (Next Month)
7. Increase mutation score to >60%
8. Add mutation testing to CI/CD
9. Document mutation testing best practices for team

## Metrics to Track

- **Current Mutation Score**: 43.7%
- **Target Mutation Score**: 60% (stretch: 70%)
- **Survived Mutations**: 1,303 → Target: <800
- **NoCoverage Mutations**: 3,250 → Target: <2,000

## Resources

- [Stryker Mutator Documentation](https://stryker-mutator.io/)
- [Mutation Testing Best Practices](https://stryker-mutator.io/docs/mutation-testing-elements/mutation-testing/)
- Project mutation config: `stryker.conf.json`
- View report: `mutation-report.html`

---

**Report Generated**: 2026-01-07  
**Tool**: Stryker Mutator v9.4.0  
**Test Framework**: Vitest v4.0.16  
**Status**: 📊 Analysis Complete - Ready for Action
