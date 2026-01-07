---
applyTo: "**/ASSETS.md"
description: Synchronization rules for keeping theme ASSETS.md files and root ASSETS.md in sync
---

# Assets Synchronization

Rules for maintaining consistency between theme-specific ASSETS.md files and the centralized root ASSETS.md.

## Key Concepts

| Term | Definition |
|------|------------|
| **Root ASSETS.md** | Centralized asset registry at `/ASSETS.md` listing all project dependencies |
| **Theme ASSETS.md** | Theme-specific asset file at `/src/themes/{theme}/ASSETS.md` |
| **Theme-Specific Dependencies** | Section in root ASSETS.md tracking per-theme external dependencies |

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASSETS SYNCHRONIZATION                       │
├─────────────────────────────────────────────────────────────────┤
│  Root ASSETS.md (Single Source of Truth)                        │
│    • Runtime Dependencies - shared across all themes            │
│    • Development Dependencies - build/test tools                │
│    • Theme-Specific Dependencies - per-theme libraries          │
│    • Data Sources - data assets used in the application         │
│                                                                 │
│  Theme ASSETS.md files                                          │
│    • Theme-local documentation of dependencies                  │
│    • Links back to root ASSETS.md                               │
│    • Any theme-specific attribution (design inspiration, etc.)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rules and Guidelines

### When Updating Theme ASSETS.md

**ALWAYS** synchronize to root ASSETS.md when:

1. **Adding a new library dependency** — Add entry to root's "Theme-Specific Dependencies" table
2. **Removing a library dependency** — Remove entry from root's "Theme-Specific Dependencies" table
3. **Updating license information** — Update both theme and root ASSETS.md

### When Creating a New Theme

1. Create `src/themes/{theme}/ASSETS.md` using the standard template
2. Add any theme-specific dependencies to root ASSETS.md "Theme-Specific Dependencies" table
3. Include link back to root: `*For project-wide dependencies, see [ASSETS.md](../../../ASSETS.md)*`

### Root ASSETS.md Structure

The root ASSETS.md has these sections that may need updates:

| Section | When to Update |
|---------|----------------|
| **Runtime Dependencies** | Adding shared project-wide dependencies |
| **Development Dependencies** | Adding build/test/dev tools |
| **Theme-Specific Dependencies** | Adding/removing theme-specific npm packages |
| **Data Sources** | Adding external data assets |

### Theme-Specific Dependencies Table Format

When adding to root ASSETS.md "Theme-Specific Dependencies" table:

```markdown
| Theme | Dependency | Source URL | License |
|-------|------------|------------|---------|
| {theme-name} | {package-name} | [{owner}/{repo}](https://github.com/{owner}/{repo}) | {license} |
```

### Theme ASSETS.md Template

New theme ASSETS.md files should follow this structure:

```markdown
# Third-Party Assets

This theme uses the following third-party assets and libraries.

## Libraries

| Name | Source URL | License | Description |
|------|------------|---------|-------------|
| {package} | [{source}]({url}) | {license} | {description} |

<!-- OR if no external packages: -->
<!-- This theme does not use any external npm packages beyond the core project dependencies. -->

## Visual Design

- **{Design Element}**
  - {Attribution or inspiration source}
  - {Any relevant notes}

## Icons

All icons used in this theme come from the project's core dependency:

- **@primer/octicons**: [GitHub Octicons](https://primer.style/foundations/icons)
  - License: MIT
  - Used for: UI icons (checkmarks, buttons, etc.)

## Fonts

This theme uses system fonts only (no custom fonts).

---

*For project-wide dependencies, see [ASSETS.md](../../../ASSETS.md) in the repository root.*
```

### Validation Checklist

Before committing ASSETS.md changes:

- [ ] Theme ASSETS.md lists all theme-specific external dependencies
- [ ] Root ASSETS.md "Theme-Specific Dependencies" table includes all theme dependencies
- [ ] License information matches between theme and root files
- [ ] Source URLs are correct and accessible
- [ ] New themes have proper link back to root ASSETS.md

---

## Examples

### Adding a New Dependency to an Existing Theme

**Step 1**: Update theme's ASSETS.md (`src/themes/fireworks/ASSETS.md`):
```markdown
## Libraries

| Name | Source URL | License | Description |
|------|------------|---------|-------------|
| fireworks-js | [crashmax-dev/fireworks-js](https://github.com/crashmax-dev/fireworks-js) | MIT | Canvas-based fireworks animation library |
| confetti-js | [catdad/canvas-confetti](https://github.com/catdad/canvas-confetti) | ISC | Canvas confetti effects |
```

**Step 2**: Update root ASSETS.md "Theme-Specific Dependencies" table:
```markdown
## Theme-Specific Dependencies

| Theme | Dependency | Source URL | License |
|-------|------------|------------|---------|
| Fireworks | fireworks-js | [crashmax-dev/fireworks-js](https://github.com/crashmax-dev/fireworks-js) | MIT |
| Fireworks | confetti-js | [catdad/canvas-confetti](https://github.com/catdad/canvas-confetti) | ISC |
```

### Creating a New Theme with Dependencies

**Step 1**: Create `src/themes/snowfall/ASSETS.md`:
```markdown
# Third-Party Assets

This theme uses the following third-party assets and libraries.

## Libraries

| Name | Source URL | License | Description |
|------|------------|---------|-------------|
| snowfall-js | [example/snowfall](https://github.com/example/snowfall) | MIT | Canvas snowfall animation |

## Visual Design

- **Winter/Snow Theme**
  - Original design for this project

## Icons

All icons used in this theme come from the project's core dependency:

- **@primer/octicons**: [GitHub Octicons](https://primer.style/foundations/icons)
  - License: MIT

## Fonts

This theme uses system fonts only (no custom fonts).

---

*For project-wide dependencies, see [ASSETS.md](../../../ASSETS.md) in the repository root.*
```

**Step 2**: Add to root ASSETS.md:
```markdown
## Theme-Specific Dependencies

| Theme | Dependency | Source URL | License |
|-------|------------|------------|---------|
| Fireworks | fireworks-js | [crashmax-dev/fireworks-js](https://github.com/crashmax-dev/fireworks-js) | MIT |
| Snowfall | snowfall-js | [example/snowfall](https://github.com/example/snowfall) | MIT |
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Problematic | Better Approach |
|--------------|---------------------|-----------------|
| Adding dependency to theme only | Root ASSETS.md becomes incomplete | Always update both files |
| Mismatched license information | Legal compliance issues | Copy exact license from source |
| Missing source URLs | Cannot verify license/attribution | Always include GitHub/npm link |
| Orphaned root entries | Theme removed but root not updated | Remove from both when deleting theme |
| Inconsistent table formatting | Hard to maintain, parse | Use exact table format from template |
| Forgetting link to root | Users miss project-wide context | Always include footer link |

---

## References

- [ASSETS.md](/ASSETS.md) - Root asset registry
- [themes.instructions.md](.github/instructions/themes.instructions.md) - Theme development patterns
- [CONTRIBUTING.md](/CONTRIBUTING.md) - Contribution guidelines including asset requirements
