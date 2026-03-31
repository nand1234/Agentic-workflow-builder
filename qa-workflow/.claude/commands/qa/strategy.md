# qa:strategy

**Mode 2 — structured planning gate.** Collects requirements and acceptance criteria, builds a Requirement Traceability Matrix, hard stops until the user confirms it. Nothing gets planned or built until approval.

---

## Instructions

$ARGUMENTS = feature name (e.g. "user-authentication"). If empty, ask:
```
Feature name? (becomes the filename — e.g. "user-authentication", "checkout-flow")
```

### STEP 1 — Prerequisites

Read `.claude/skills`. If missing → `❌ Run /qa:discover first.`

If `.claude/strategy/[feature]-strategy.md` exists, ask:
```
Strategy for '[feature]' exists.  1. View and continue  2. Start fresh
```

### STEP 2 — Gather Requirements

Say: `I'll ask 5 questions. Nothing gets built until you approve the plan.`

Ask one at a time, wait for each answer:

**Q1** — `List the requirements for [feature]. Number them.`
**Q2** — `For each requirement, what is the acceptance criterion?`
**Q3** — `Which test types are needed? 1.UI/E2E  2.API  3.Load  4.Security  5.Performance (comma-separated)`
**Q4** — `Priority for each: P1=must pass before release  P2=important  P3=nice to have`
**Q5** — `What is explicitly OUT OF SCOPE?`

### STEP 3 — Build RTM

Display the full Requirement Traceability Matrix as a table. Only include columns for test types selected in Q3.

```
Requirement Traceability Matrix — [feature]
Generated: [date]
```

| ID | Requirement | Acceptance Criteria | Priority | UI/E2E | API | Load | Security | Performance |
|---|---|---|---|---|---|---|---|---|
| REQ-01 | [req] | [criterion] | P1 | ✅ | ✅ | — | ✅ | — |
| REQ-02 | [req] | [criterion] | P1 | ✅ | — | — | — | — |

**Coverage summary:**

| Test Type | In Scope | Requirements |
|---|---|---|
| UI/E2E | ✅ | REQ-01, REQ-02 |

**Out of scope:**

| Area | Reason |
|---|---|
| [item] | [reason] |

**Approved commands to run:**

| Command | Covers |
|---|---|
| `/qa:plan e2e [feature]` | REQ-01, REQ-02 |
| `/qa:plan security [feature]` | REQ-01 |

### STEP 4 — HARD STOP

```
──────────────────────────────────────────────
📋 REVIEW THE RTM ABOVE
──────────────────────────────────────────────
To change anything — tell me what to update.
To approve — type: confirmed

I will not create plans or test code until you confirm.
──────────────────────────────────────────────
```

Stop. Wait. Do not proceed.

If user requests changes → update RTM → show again → repeat gate.

### STEP 5 — Save (only after confirmation)

Create `.claude/strategy/` if needed.

Save `.claude/strategy/[feature]-strategy.md`:

```markdown
# Test Strategy: [feature]

_Status: APPROVED | Approved: [timestamp] | Framework: [from SKILL.md]_

## Requirements
[table]

## Acceptance Criteria
[table]

## Requirement Traceability Matrix
[full RTM]

## Out of Scope
[table]

## Approved Test Plans (run in order)
1. `/qa:plan e2e [feature]`   — REQ-01, REQ-02
2. `/qa:plan security`        — REQ-01
```

Output:
```
✅ Strategy approved — .claude/strategy/[feature]-strategy.md

Requirements: [N] ([N] P1, [N] P2, [N] P3)

──────────────────────────────────────────────
Run these in order — nothing else:
  1. /qa:plan e2e [feature]
  2. /qa:plan security [feature]
Stay in scope. Only plan what's listed above.
──────────────────────────────────────────────
```
