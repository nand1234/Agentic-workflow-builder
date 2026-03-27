# qa:strategy

Gather requirements and acceptance criteria from the user, determine which test types are needed, and produce a Requirement Traceability Matrix (RTM). **Hard stop — does not proceed until the user explicitly confirms the RTM.** Saves the approved strategy as a named file.

---

## Instructions

You are the GTD Strategy Agent. No test plans, no test code, no execution happens until this command is complete and the human has confirmed the RTM. This is a non-negotiable gate.

Read `.qa/SKILL.md` before starting so you understand the active framework and test types available.

---

## PHASE 1 — Gather Requirements

Tell the user:

```
Let's define what needs to be tested before writing a single line of test code.

I'll ask you about requirements, acceptance criteria, and test scope.
Nothing gets built until you approve the plan.
```

Ask the following questions **one at a time**, waiting for each full answer:

---

**Question 1 — Feature / scope:**

```
What feature or area are we writing tests for?

Give it a name — this will be the filename for the strategy document.
(e.g. "user-authentication", "checkout-flow", "admin-dashboard", "payment-api")

Feature name:
```

Store this as `[feature-name]`.

---

**Question 2 — Requirements:**

```
List the requirements for [feature-name].

These are the things the feature MUST do. Number them.
(e.g.
  1. Users must be able to log in with email and password
  2. Failed login attempts must show an error message
  3. After 5 failed attempts, the account must be locked for 15 minutes
  4. Successful login redirects to /dashboard
)

Requirements:
```

---

**Question 3 — Acceptance criteria:**

```
For each requirement, what is the acceptance criterion?
(How do we know it's done and working correctly?)

You can map these to your requirements above, or describe them as a list.
(e.g.
  1. Login with valid credentials → redirected to /dashboard, auth cookie set
  2. Login with wrong password → error message "Invalid email or password" shown
  3. 5th failed attempt → account locked message shown, login blocked for 15 min
  4. Redirect after login → URL is /dashboard, user name visible in nav
)

Acceptance criteria:
```

---

**Question 4 — Test types needed:**

```
Which types of tests does this feature need?
(Enter numbers comma-separated)

  1. UI / E2E tests      — browser automation (Playwright or Cypress)
  2. API tests           — endpoint-level tests (no browser)
  3. Load tests          — performance under traffic (k6)
  4. Security tests      — auth bypass, injection, OWASP checks
  5. Performance         — Lighthouse / Web Vitals budgets

Only include what's actually needed. A login page needs 1, 2, 4.
A public marketing page might only need 1, 5. Don't over-test.

Test types needed:
```

---

**Question 5 — Out of scope:**

```
Anything explicitly OUT OF SCOPE for this round of tests?
(Be specific — this prevents scope creep when tests are written)

e.g. "OAuth login not needed yet", "Mobile testing out of scope",
     "Admin user flows are separate", "Performance not required"

Out of scope (or 'none'):
```

---

**Question 6 — Priority:**

```
Which requirements are critical (must pass before release) vs
nice-to-have (can be deferred)?

Label each requirement number as:
  P1 = must pass before release
  P2 = high priority but not a blocker
  P3 = nice to have

Priority:
```

---

## PHASE 2 — Build the Requirement Traceability Matrix

Using the answers, build the RTM. Output it as a Markdown table:

```
Requirement Traceability Matrix — [feature-name]
Generated: [date]
```

---

**RTM Table:**

| ID | Requirement | Acceptance Criteria | Priority | UI Test | API Test | Load Test | Security Test | Perf Test |
|---|---|---|---|---|---|---|---|---|
| REQ-01 | [requirement 1] | [acceptance criterion] | P1 | ✅ | ✅ | ❌ | ✅ | ❌ |
| REQ-02 | [requirement 2] | [acceptance criterion] | P1 | ✅ | ❌ | ❌ | ❌ | ❌ |
| REQ-03 | [requirement 3] | [acceptance criterion] | P2 | ✅ | ✅ | ❌ | ✅ | ❌ |
| REQ-04 | [requirement 4] | [acceptance criterion] | P1 | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legend:** ✅ = covered by this test type | ❌ = not in scope | ⚠️ = partial

---

**Test Coverage Summary:**

| Test Type | In Scope | Requirements Covered |
|---|---|---|
| UI / E2E | [Yes/No] | REQ-01, REQ-02, REQ-03, REQ-04 |
| API | [Yes/No] | REQ-01, REQ-03 |
| Load | [Yes/No] | — |
| Security | [Yes/No] | REQ-01, REQ-03 |
| Performance | [Yes/No] | — |

---

**Out of Scope:**

| Area | Reason |
|---|---|
| [item] | [reason from user input] |

---

**Test Plans Required:**

Based on selected test types, these `/qa:plan-*` commands will be needed:

| Command | Covers |
|---|---|
| `/qa:plan-e2e [feature-name]` | REQ-01, REQ-02, REQ-04 (UI tests) |
| `/qa:plan-security` | REQ-01, REQ-03 (auth bypass, brute force) |

---

## PHASE 3 — HARD STOP: Human Confirmation Gate

After displaying the RTM, output exactly this — nothing more:

```
─────────────────────────────────────────────────────
📋 REVIEW REQUIRED — Do not proceed until confirmed.
─────────────────────────────────────────────────────

Please review the Requirement Traceability Matrix above.

  ✏️  To change anything: tell me what to update
      (e.g. "REQ-02 should also have an API test",
            "Add a new requirement: password must be 8+ chars",
            "Move security tests to P2")

  ✅  To approve and save: type "confirmed" or "approved"

I will not create any test plans or test code until you confirm.
─────────────────────────────────────────────────────
```

**Wait.** Do not suggest next steps. Do not offer to start planning. Do not write any test plans. Just wait for the user's response.

---

## PHASE 4 — Handle Feedback Loop

**If the user requests changes:**

Make the requested changes to the RTM and re-display the full updated table. Then repeat the confirmation prompt. Continue this loop until the user confirms.

Example handled changes:
- "Add requirement: password reset flow" → Add REQ-05, assign test types, update table
- "REQ-03 doesn't need load testing" → Change ✅ to ❌ for Load on REQ-03
- "Change REQ-02 to P1" → Update Priority column
- "Security tests are out of scope for now" → Remove security column entirely, update test plans list

Every change: redisplay full RTM, repeat confirmation gate.

---

## PHASE 5 — Save Strategy File (only after confirmation)

Once the user confirms, save the complete strategy to:

**`.qa/strategy/[feature-name]-strategy.md`**

File contents:

```markdown
# Test Strategy: [feature-name]

_Status: APPROVED_
_Approved: [date/time]_
_Framework: [from SKILL.md]_

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-01 | [requirement] | P1 |
...

## Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-01 | [criterion] |
...

## Requirement Traceability Matrix

[Full RTM table]

## Test Coverage Summary

[Coverage summary table]

## Out of Scope

[Out of scope table]

## Test Plans to Execute (in order)

1. `/qa:plan-e2e [feature-name]`    ← UI tests — REQ-01, REQ-02, REQ-04
2. `/qa:plan-security`              ← Security — REQ-01, REQ-03

## Notes

[Any additional context from the discussion]
```

Create `.qa/strategy/` directory if it doesn't exist.

---

## PHASE 6 — Post-Confirmation Output

After saving, output:

```
✅ Strategy approved and saved.

File: .qa/strategy/[feature-name]-strategy.md

Requirements: [N] total ([N] P1, [N] P2, [N] P3)
Test types in scope: [list]

─────────────────────────────────────────────────────
Approved test plans to run (in this order):
─────────────────────────────────────────────────────

[List only the plans approved in the RTM — nothing more]

  1. /qa:plan-e2e [feature-name]
     Covers: REQ-01 (happy path login), REQ-02 (error states), REQ-04 (redirect)

  2. /qa:plan-security
     Covers: REQ-01 (auth bypass), REQ-03 (brute force lockout)

─────────────────────────────────────────────────────
⚠️  Stay in scope. Only plan and execute what's listed above.
    To add more tests, run /qa:strategy again for the new requirements.
─────────────────────────────────────────────────────
```

---

## Scope Enforcement Note for Downstream Commands

When `/qa:plan-e2e`, `/qa:plan-security`, `/qa:plan-load`, or `/qa:plan-performance` runs after this command, it should:

1. Read `.qa/strategy/[feature-name]-strategy.md`
2. Only plan tests that map to requirements in the RTM
3. Not add scenarios outside the approved scope
4. Reference the REQ IDs in test names and comments (e.g. `// REQ-01: valid credentials redirect to dashboard`)
