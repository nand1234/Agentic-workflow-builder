# ⌨️ COMMAND: /generate-skill (v2.4)

**Role:** Senior SDET & Software Architect
**Objective:** Synchronise the AI "Brain" with the repository's functional logic by generating `.claude/skills/SEARCH_PROTOCOL.md`

---

## PHASE 0: Complexity Check

Before starting, confirm this is needed:

- ✅ Run this on **first-time setup**
- ✅ Run this after a **major refactor or architectural change**
- ✅ Run this when `SEARCH_PROTOCOL.md` is **older than the last sprint**
- ⛔ Skip if `SEARCH_PROTOCOL.md` was generated this sprint and no major patterns changed

---

## PHASE 1: Code-Test Mapping

### Step 1 — Locate Implementation and Test Directories

Scan the repo and identify:
- Source directories (e.g. `src/`, `lib/`, `app/`, `templates/js/`)
- Test directories (e.g. `tests-new/`, `tests/`, `*.spec.ts`)
- Test runners (e.g. PHPUnit, Vitest) and their config files

### Step 2 — Select the Golden Pair

A **Golden Pair** is one source file + its corresponding test file that best represents the repo's standards.

Select based on:

| Criteria | Weight |
|---|---|
| **Recency** — modified in the last 2 sprints | High |
| **Complexity** — non-trivial logic, not a simple CRUD | High |
| **Standardisation** — follows naming conventions, has clear structure | Medium |

**Action:** List the top 3 candidates and explain why you selected the winning pair.

### Step 3 — Failure Mode Protocols

| Situation | Action |
|---|---|
| No tests found for the Golden Pair | Propose a "New Standard" based on industry best practices for the detected stack |
| Zero tests found anywhere in the repo | **STOP.** Notify the user to initialise a testing framework before proceeding |

---

## PHASE 2: DNA Extraction

Analyse the Golden Pair and extract:

### Implementation Style
- Functional vs OOP
- Module/class patterns in use
- Error handling conventions (try/catch, Result types, etc.)

### Naming Conventions
- File naming (camelCase, kebab-case, snake_case)
- Test file suffix (`.test.ts`, `.spec.js`, `_test.py`, `Test.php`)
- Variable and function naming patterns

### Mocking Strategy
- Dependency Injection vs Spying vs Module mocking
- How external services are faked in tests

### Recursive Trace
Map one core function from Public API → Business Logic → Unit Test mocks.

---

## PHASE 3: Output `.claude/skills/SEARCH_PROTOCOL.md`

**File location:** Always save to `.claude/skills/SEARCH_PROTOCOL.md` (not `skills/` at project root).

Generate the file with YAML frontmatter and the following sections:

```markdown
---
name: search-protocol
description: "Reference guide for code-test mapping, naming conventions, mocking strategy, grep search patterns, and domain anchors. USE WHEN: writing new tests, locating where to add code, following project conventions, understanding the test-first rules."
---

# SEARCH_PROTOCOL.md

## Meta
- Generated: [date]
- Stack: [detected stack]
- Test Runner: [runner]
- Golden Pair: [source file] ↔ [test file]

## Anchor Table — [Primary namespace / layer]
| Anchor | Logic File | Test File | Notes |
|---|---|---|---|
| [domain] | [path] | [path] | [pattern note] |

## Anchor Table — [Secondary namespace / layer, e.g. legacy or frontend]
| Anchor | Logic File | Test File | Notes |
|---|---|---|---|

## Anchor Table — Frontend (if applicable)
| Anchor | Source Path | Spec Path | Notes |
|---|---|---|---|

## Grep Search Patterns
[Grep/find commands for locating handlers, controllers, specs, store modules]

## Implementation Style
[Summary of findings]

## Naming Conventions
[Summary of findings — include table for PHP, JS/TS, test files]

## Mocking Strategy
[Backend and frontend strategies separately]

## Recursive Trace
[Core function → logic → mock trace as ASCII tree]

## Test-First Rules
1. Always read the relevant test file before editing source code
2. Never add a new function without a corresponding test case
3. Follow the mocking strategy above — do not introduce new patterns

## Known Exceptions
| Pattern | Where it applies | Reason |
|---|---|---|

## Staleness Check
Regenerate this file if:
- A new architectural pattern has been introduced
- A major refactor has occurred
- This file is older than one sprint
- New modules, views, or namespaces are added
```

---

## Self-Audit (7-Point Checklist)

Before saving `SEARCH_PROTOCOL.md`, verify:

- [ ] Golden Pair is recent (last 2 sprints) and non-trivial
- [ ] **All major domain anchors are represented** — backend primary namespace, legacy namespace (if any), and frontend (if applicable) each have their own anchor table
- [ ] **Grep search patterns are included** — at least one pattern per major artifact type (handlers, controllers, specs, store modules)
- [ ] Mocking strategy matches what is actually used in the test files
- [ ] Recursive Trace follows a real code path, not a hypothetical one
- [ ] Staleness Check conditions are clearly documented including frontend module additions
- [ ] Known Exceptions table has been reviewed — outdated rows removed, any current deviations added
