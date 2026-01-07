# Shared Theme Utilities

Utilities shared **between themes only**.

## Dependency Rules

✅ **Allowed**: Themes can import from `@themes/shared`  
❌ **Forbidden**: Core/App code must NOT import from `@themes/shared`

## Dependency Flow

```text
App/UI → Core → Registry (@themes/registry) → Themes → Shared (@themes/shared)
```

## Files

| File | Purpose |
|------|---------|
| `animation-state.ts` | Animation state utilities (reduced motion, shouldAnimate) |
| `dom-guards.ts` | SSR-safe DOM write guards |
| `index.ts` | Barrel exports for theme utilities |
| `resources.ts` | Re-exports resource tracking from `@core/resource-tracking` |
| `responsive-layout.ts` | Breakpoints, safe areas, CSS properties |
| `types.ts` | Re-exports from `@core/types` |

## Core Types

`LandingPageRenderer` and `TimePageRenderer` interfaces are in `@core/types`.
Themes should import these from `@core/types` directly.
