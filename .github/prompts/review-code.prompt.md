---
description: Review code quality - quick check or deep audit
agent: Manager - Implement
argument-hint: Path, 'staged', or 'unstaged'
---

# Review Code

**Scope**: `${input:scope:Enter file path, 'staged', or 'unstaged' for git changes}`
**Mode**: `${input:mode:Mode - 'quick' (default), 'deep', 'structure', or 'smells'}`

## Context

Code quality review from quick PR checks to deep refactoring audits.

## Task

### Mode: quick (default)
Fast review: patterns, DRY, type safety, error handling, naming.

### Mode: deep
Iterative audit (max 3 iterations per subfolder). Runs both structure and smells, flags doc/test gaps.

### Mode: structure
File size (>350 lines), function length (>40 lines), nesting depth (>3 levels), architecture violations.

### Mode: smells
Duplicated code, magic numbers, cryptic names, dead code. Run `npx knip` to verify.

## Expected Output

| Priority | Issue | Location | Recommendation |
|----------|-------|----------|----------------|
| P0/P1/P2 | {desc} | {file:line} | {fix} |

**Verdict**: Approve / Suggestions / Needs Changes
