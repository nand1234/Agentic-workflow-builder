# qa:plan-e2e

Create a detailed, executable Cypress or Playwright test plan for a specific feature, page, or user journey. Produces an XML-structured plan in `.qa/plans/` that `/qa:execute` can implement directly.


> **Scope gate:** This command requires an approved strategy. Read `.qa/strategy/[feature]-strategy.md` before planning. Only create scenarios that map to RTM requirements marked for this test type. Do not add out-of-scope scenarios.


## Instructions

You are the GTD E2E Planning Orchestrator. Your job is to produce test plans so detailed that implementation is mechanical — no guessing, no ambiguity. **You are scoped to the RTM. Do not add scenarios that are not in the confirmed strategy.**

$ARGUMENTS contains the feature slug (e.g. "login", "checkout"). If empty, ask: "Which feature? Provide the slug used in `/qa:strategy` (e.g. 'login', 'checkout')."

### Step 1: Load Context — Required Files

Read **all** of the following. If any are missing, stop and say what's needed:

1. `.qa/SKILL.md` — **required**. If missing: "Run `/qa:discover` first."
2. `.qa/[feature-slug]-strategy.md` — **required**. If missing: "Run `/qa:strategy` first. Tests must be scoped to a confirmed RTM."
3. `.qa/COVERAGE-MAP.md` — read if present
4. `playwright.config.ts` or `cypress.config.ts` — read to understand existing config

Determine the E2E framework from SKILL.md (never guess).

Extract from the strategy file:
- All acceptance criteria (AC-01, AC-02, etc.)
- Which criteria have UI/E2E = ✅ — **plan only these**
- Out of scope items — **do not plan these**
- Constraints — respect them

### Step 2: Ask Only What Isn't in the Strategy

The strategy already captured requirements. Only ask for things genuinely missing:

1. "For the component code — should I read the source files to find selectors, or have you already added data-testid attributes?"

2. "Any test data setup needed before these tests can run? (e.g. 'needs a seeded product in the database', 'needs a specific user role to exist')"

Do not ask about scope, test types, or acceptance criteria — those are already confirmed in the strategy.

### Step 3: Spawn Research Agents

Spawn in parallel:

**Agent A — Component & Selector Analyst**:
> "Analyse the [feature] implementation in this codebase. Find: every interactive element (buttons, inputs, links, forms), their selectors (preferably data-testid, aria-label, or role), the component file(s), any validation logic, and API calls triggered. Output a selector inventory table: element → recommended selector → type → notes."

**Agent B — Flow & State Analyst**:
> "Map the complete user flow for [feature]. Find: every state the UI can be in (loading, error, empty, success, authenticated, unauthenticated), every transition, every redirect. Identify what data needs to exist for each state. List every error message and validation message. Map what changes in the URL across the flow."

**Agent C — API Intercept Analyst**:
> "Find all network requests made during the [feature] flow. List: endpoint, method, request body shape, response shape, error cases. Determine which requests should be intercepted/mocked in tests vs which should use real network (or a test server). Identify any WebSocket events if relevant."

**Agent D — Existing Test Gap Analyst**:
> "Check if any existing tests cover [feature]. Find them, list what they cover, and identify gaps. Check for: missing error state tests, missing loading state tests, missing mobile viewport tests, missing accessibility checks. Output: covered scenarios, gap scenarios."

### Step 4: Build the Plan

Create `.qa/plans/e2e-[feature-slug].md`:

````markdown
# E2E Test Plan: [Feature Name]

_Framework: [Playwright|Cypress] | Created: [date] | Status: pending_

## Coverage Target
[What this plan covers — list of scenarios]

## Test Data Requirements
[What needs to exist before tests run: user accounts, seeded data, env vars]

## File Structure
```
tests/e2e/[feature]/
├── [feature].spec.ts          # Main test file
├── [feature].page.ts          # Page Object Model
└── fixtures/
    └── [feature]-data.json    # Test fixtures
```

## Scenarios

<test-suite name="[Feature Name] E2E">

  <scenario id="1" priority="critical" tags="happy-path,smoke">
    <name>Happy path — [main scenario]</name>
    <preconditions>
      - User is not logged in
      - Test user exists: testuser@example.com / password123
    </preconditions>
    <steps>
      1. Navigate to [URL]
      2. Assert page title / heading visible
      3. Fill [selector] with [value]
      4. Click [selector]
      5. Assert [expected outcome]
      6. Assert URL is [expected URL]
    </steps>
    <assertions>
      - [Selector] is visible
      - URL matches [pattern]
      - API call POST /api/auth/login was made with correct payload
      - LocalStorage contains auth token
    </assertions>
    <intercepts>
      - Mock: POST /api/auth/login → 200 { token: "test-token" }
      - OR use real network (specify)
    </intercepts>
  </scenario>

  <scenario id="2" priority="high" tags="error-handling">
    <name>Error state — invalid credentials</name>
    <preconditions>User on login page</preconditions>
    <steps>
      1. Fill email with invalid@test.com
      2. Fill password with wrongpassword
      3. Click submit
      4. Assert error message visible: "[exact error text]"
      5. Assert user remains on login page
      6. Assert form fields retain their values (or are cleared per spec)
    </steps>
    <assertions>
      - Error message "[text]" visible within [N]ms
      - No navigation occurred
      - Submit button re-enabled after error
    </assertions>
  </scenario>

  <scenario id="3" priority="high" tags="accessibility">
    <name>Accessibility — keyboard navigation and screen reader</name>
    <steps>
      1. Navigate to page
      2. Tab through all interactive elements
      3. Assert focus order matches visual order
      4. Assert all inputs have aria-label or associated label
      5. Run axe accessibility scan
      6. Assert zero critical violations
    </steps>
  </scenario>

  <scenario id="4" priority="medium" tags="mobile">
    <name>Mobile viewport — [feature] on 375px</name>
    <viewport>375x812 (iPhone 14)</viewport>
    <steps>
      [Repeat happy path steps at mobile viewport]
      - Assert layout doesn't overflow
      - Assert tap targets are ≥ 44px
    </steps>
  </scenario>

</test-suite>

## Page Object Model Spec

```typescript
// [feature].page.ts
export class [Feature]Page {
  // Locators
  readonly emailInput = page.getByTestId('email-input')
  readonly passwordInput = page.getByTestId('password-input')
  readonly submitButton = page.getByRole('button', { name: 'Sign in' })
  readonly errorMessage = page.getByRole('alert')
  
  // Actions
  async fillCredentials(email: string, password: string) { ... }
  async submit() { ... }
  async expectError(message: string) { ... }
  async expectRedirectTo(url: string) { ... }
}
```

## Selector Inventory

| Element | Recommended Selector | Type | Notes |
|---|---|---|---|
| Email input | `[data-testid="email-input"]` | input | Add if missing |
| Submit button | `role=button[name="Sign in"]` | button | Use aria |
| Error message | `role=alert` | div | Semantic |

## Test Data

```json
{
  "validUser": { "email": "testuser@example.com", "password": "TestPass123!" },
  "invalidUser": { "email": "invalid@test.com", "password": "wrongpass" },
  "lockedUser": { "email": "locked@example.com", "password": "TestPass123!" }
}
```

## CI Configuration

```yaml
# Add to your CI pipeline
- name: E2E Tests — [Feature]
  run: npx playwright test tests/e2e/[feature]/ --reporter=html
  env:
    BASE_URL: ${{ secrets.TEST_BASE_URL }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## Missing Test IDs to Add

These selectors don't exist yet and should be added to the component:
- `data-testid="email-input"` on `<input type="email">`
- `data-testid="login-error"` on the error message element
- `data-testid="submit-login"` on the submit button

## Estimated Implementation Time
~[N] hours | [N] test files | [N] scenarios
````

### Step 5: Update Coverage Map

Update `.qa/COVERAGE-MAP.md` — mark the planned feature rows with `📋 planned`.

### Step 6: Summary

```
✅ E2E plan created: .qa/plans/e2e-[feature-slug].md

Scenarios planned: [N]
  🔴 Critical (smoke): [N]
  🟠 High: [N]
  🟡 Medium: [N]

Missing test IDs to add to components: [N]
Estimated implementation: ~[N] hours

Next: /qa:execute e2e-[feature-slug]
```

If the plan reveals any data-testid attributes that need to be added to the application code, list them clearly so the developer can add them before running `/qa:execute`.
