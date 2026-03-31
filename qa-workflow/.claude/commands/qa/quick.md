# qa:quick

Generate and implement a test for a specific scenario without the full plan cycle. For regression tests, one-off checks, or fast coverage of a newly discovered edge case.

## Instructions

$ARGUMENTS describes what to test (e.g. "login form shows error for invalid email", "API returns 404 for missing product", "checkout total updates when quantity changes").

If empty, ask: "What do you want to test? Describe the scenario in one sentence."

### Step 1: Parse the Request

Determine from the description:
- **Suite type**: E2E (UI interaction) / API (endpoint check) / Security (specific vector) / Performance (specific metric)
- **Framework**: from `.qa/config.json` or infer from description
- **Scope**: Single test vs small test group (max 5 scenarios)

### Step 2: One-shot Implementation

Skip planning agents. Directly implement:

1. Read the relevant component/route code to understand selectors and API shape.
2. Write the test file using the framework's best-practice pattern.
3. Place it in the correct directory:
   - E2E → `tests/e2e/quick/[slug].spec.ts`
   - API → `tests/security/quick/[slug].spec.ts`
   - Load → `tests/load/quick/[slug].k6.js`
4. Run the test immediately to verify it works.
5. Commit: `test(quick): [scenario description]`

### Step 3: Summary

```
✅ Quick test added: tests/e2e/quick/[slug].spec.ts

Scenario: [what it tests]
Result: ✅ passing (or ❌ — found a bug!)

[If it found a bug:]
🐛 Bug found: [description]
This should be investigated: [what failed and why]
```

---

# qa:coverage-gap

Identify flows, routes, and endpoints that have no test coverage and generate priority-ranked gap plans.

## Instructions

### Step 1: Load State

Read `.qa/COVERAGE-MAP.md` and `.qa/QA-STRATEGY.md`. Scan `tests/` directory for all existing test files to verify what's actually implemented vs planned.

### Step 2: Compute Gaps

Cross-reference:
- Routes/endpoints in COVERAGE-MAP.md with ❌ or ⚠️ status
- QA-STRATEGY.md critical flows with missing tests
- Any routes discovered in codebase but not in coverage map (scan `src/`, `app/`, `pages/`)

### Step 3: Rank Gaps

Score each gap:
- **Criticality**: Is it in the critical user journeys list? (+3)
- **Risk**: Is it auth-related, payment-related, or data mutation? (+2)
- **Frequency**: Is it a heavily used route? (+1)
- **Complexity**: Is it complex logic that could hide bugs? (+1)

### Step 4: Output Gap Report

```
Coverage Gap Analysis
=====================

Total routes/endpoints: [N]
Covered: [N] ([N]%)
Uncovered: [N] ([N]%)

Priority Gaps (address in this order):

🔴 Critical (no test coverage at all):
  1. /checkout/payment — payment flow, 0% coverage
     Recommended: /qa:plan-e2e checkout-payment
  2. POST /api/orders — order creation, 0% coverage
     Recommended: /qa:plan-e2e order-creation + /qa:plan-load orders-api

🟠 High:
  3. /admin — admin panel, 0% coverage
     Recommended: /qa:plan-e2e admin + /qa:plan-security (IDOR risk)

🟡 Medium:
  4. /profile — user profile, 0% coverage
     Recommended: /qa:plan-e2e user-profile

ℹ️  Routes not in coverage map (newly discovered):
  - /api/webhooks/stripe — not tracked yet
  - /admin/users/[id] — not tracked yet

Next: run any of the /qa:plan-* commands above, or /qa:quick for small gaps.
```

Update `.qa/COVERAGE-MAP.md` to add any newly discovered routes.

---

# qa:maintain

Update tests broken by recent application changes. Distinguishes intentional UI/API changes from regressions.

## Instructions

### Step 1: Identify What Changed

```bash
git log --oneline -20
git diff HEAD~5 -- tests/
```

Ask: "What changed in the application recently that may have broken tests? (e.g. 'renamed button label', 'changed API response shape', 'redesigned login page')"

### Step 2: Diagnose Broken Tests

Run the full test suite in dry-run / check mode to find which tests are currently failing:

```bash
npx playwright test --reporter=line 2>&1 | grep -E "FAILED|Error"
```

For each failing test, determine:
- **Intentional change** → update the test assertion
- **Unintentional regression** → flag as application bug

### Step 3: Fix Test Code

For intentional changes, update tests:
- Update selectors if UI changed
- Update assertions if API response shape changed
- Update fixtures if data model changed
- Update Page Object locators if component restructured

Commit per test file: `fix(tests): update [feature] tests for [change description]`

### Step 4: Summary

```
Maintenance complete

Tests updated: [N]
  [List files and what changed]

Application bugs found (don't fix tests for these — fix the app):
  [List of actual regressions discovered]

All updated tests: ✅ passing
```
