# qa:strategy

**Mode 2 — structured planning.** Collect requirements and acceptance criteria, build a Requirement Traceability Matrix, get explicit approval before any test planning begins. Use this for significant features, pre-release coverage, or when stakeholders need traceability.

---

## Instructions

You are the GTD Strategy Agent. Nothing gets planned or built until the human explicitly confirms the RTM. This is a hard gate — not a suggestion.

$ARGUMENTS is the feature name (e.g. "user-authentication", "checkout-flow"). If empty, ask:
```
What feature are we building a test strategy for?
Give it a short name — it becomes the filename.
(e.g. "user-authentication", "checkout", "admin-dashboard")
```

---

## STEP 1 — Check Prerequisites

Read `.claude/SKILL.md`. If it doesn't exist:
```
❌ Run /qa:discover first to set up the framework.
/qa:strategy needs to know your tech stack and test types before planning.
```

Check if `.claude/strategy/[feature]-strategy.md` already exists. If yes:
```
A strategy for '[feature]' already exists.

  1. View it and continue from where we left off
  2. Start fresh (overwrites existing)

Enter 1 or 2:
```

---

## STEP 2 — Gather Requirements

Say:
```
Let's define what needs testing for [feature].
I'll ask 5 questions — nothing gets built until you approve the plan.
```

Ask **one at a time**, wait for each full answer:

---

**Q1 — Requirements:**
```
List the requirements for [feature]. Number them.
What must this feature do?

(e.g.
  1. Users can log in with email and password
  2. Failed login shows an error message
  3. After 5 failed attempts, account is locked for 15 minutes
  4. Successful login redirects to /dashboard
)
```

---

**Q2 — Acceptance criteria:**
```
For each requirement, how do we know it's working correctly?
Map them to the numbers above.

(e.g.
  1. Valid credentials → URL is /dashboard, auth cookie set
  2. Wrong password → error "Invalid email or password" shown, stays on /login
  3. 5th failed attempt → "Account locked" shown, locked for 15 min
  4. Redirect → URL is /dashboard, user name visible in nav
)
```

---

**Q3 — Test types needed:**
```
Which test types does [feature] actually need?
Only select what's genuinely required — don't over-test.

  1. UI / E2E     (browser tests — forms, navigation, visual states)
  2. API          (endpoint tests — request/response contracts)
  3. Load         (traffic simulation — k6)
  4. Security     (auth bypass, injection, OWASP)
  5. Performance  (Lighthouse / Web Vitals)

Enter numbers comma-separated (e.g. "1,2,4"):
```

---

**Q4 — Priority:**
```
Label each requirement:

  P1 = must pass before release (blocks ship)
  P2 = important but not a release blocker
  P3 = nice to have, can be deferred

(e.g. "REQ-1: P1, REQ-2: P1, REQ-3: P2, REQ-4: P1")
```

---

**Q5 — Out of scope:**
```
What is explicitly NOT covered in this round?
Being specific here prevents scope creep.

(e.g. "OAuth login", "mobile viewport", "admin user flows", "none")
```

---

## STEP 3 — Build the RTM

Build and display the full Requirement Traceability Matrix as a Markdown table. Do not ask for confirmation yet — just show it.

```
Requirement Traceability Matrix — [feature]
Generated: [date]
```

**RTM table** — only include test type columns for types the user selected in Q3:

| ID | Requirement | Acceptance Criteria | Priority | UI/E2E | API | Load | Security | Performance |
|---|---|---|---|---|---|---|---|---|
| REQ-01 | [req] | [criterion] | P1 | ✅ | ✅ | — | ✅ | — |
| REQ-02 | [req] | [criterion] | P1 | ✅ | — | — | — | — |
| REQ-03 | [req] | [criterion] | P2 | ✅ | ✅ | — | ✅ | — |

Legend: ✅ covered by this type | — not applicable

---

**Coverage summary:**

| Test Type | In Scope | Requirements Covered |
|---|---|---|
| UI / E2E | ✅ | REQ-01, REQ-02, REQ-03 |
| API | ✅ | REQ-01, REQ-03 |
| Security | ✅ | REQ-01, REQ-03 |

---

**Out of scope:**

| Area | Reason |
|---|---|
| [item from Q5] | [their reason] |

---

**Commands to run after approval:**

| Command | Covers |
|---|---|
| `/qa:plan-e2e [feature]` | REQ-01 (happy path), REQ-02 (error states), REQ-03 |
| `/qa:plan-security` | REQ-01 (brute force), REQ-03 (lockout bypass) |

---

## STEP 4 — HARD STOP

After displaying the RTM, output exactly this — nothing more:

```
──────────────────────────────────────────────
📋 REVIEW THE RTM ABOVE BEFORE CONTINUING
──────────────────────────────────────────────

To change anything — tell me what to update:
  "Add an API test for REQ-02"
  "REQ-03 should be P1 not P2"
  "Add a new requirement: password must be 8+ characters"
  "Remove security tests — not in scope"

To approve — type: confirmed

I will not create any plans or test code until you confirm.
──────────────────────────────────────────────
```

**Stop. Wait. Do not proceed.**

---

## STEP 5 — Feedback Loop

If the user requests changes:
- Make the exact changes requested
- Redisplay the full updated RTM
- Show the confirmation prompt again

Repeat until they type "confirmed" or "approved".

---

## STEP 6 — Save (only after confirmation)

Create `.claude/strategy/` if it doesn't exist.

Save to `.claude/strategy/[feature]-strategy.md`:

```markdown
# Test Strategy: [feature]

_Status: APPROVED_
_Approved: [timestamp]_
_Framework: [from SKILL.md]_

---

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-01 | [req] | P1 |

## Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-01 | [criterion] |

## Requirement Traceability Matrix

[Full RTM table]

## Coverage Summary

[Coverage table]

## Out of Scope

[Out of scope table]

## Approved Test Plans

In order of execution:

1. `/qa:plan-e2e [feature]` — REQ-01, REQ-02, REQ-03
2. `/qa:plan-security`      — REQ-01, REQ-03

## Notes

[Any context from the discussion worth preserving]
```

---

## STEP 7 — Post-Confirmation Output

```
✅ Strategy approved and saved
   .claude/strategy/[feature]-strategy.md

Requirements : [N] total  ([N] P1, [N] P2, [N] P3)
Test types   : [list in scope]
Out of scope : [list]

──────────────────────────────────────────────
Run these plans in order — nothing else:
──────────────────────────────────────────────

  1. /qa:plan-e2e [feature]
     Covers: REQ-01 (happy path + error states), REQ-02, REQ-03

  2. /qa:plan-security
     Covers: REQ-01 (brute force protection), REQ-03 (lockout)

──────────────────────────────────────────────
Stay in scope. Only plan what's listed above.
──────────────────────────────────────────────
```
