# qa:plan-e2e

**Mode 2 — structured planning.** Reads an approved strategy RTM and produces a detailed, executable Playwright/Cypress test plan. Only plans what the RTM approved. Run `/qa:strategy` first.

---

## Instructions

$ARGUMENTS is the feature name matching an approved strategy file (e.g. "user-authentication").

### STEP 1 — Load and validate

Read in order:
1. `.claude/SKILL.md`
2. `.claude/skills/[framework]-standards.md`
3. `.claude/strategy/[feature]-strategy.md`

If strategy file missing:
```
❌ No approved strategy for '[feature]'.
Run /qa:strategy [feature] first — test planning needs an approved RTM.
```

Check RTM has UI/E2E column with at least one ✅. If not:
```
The approved strategy for '[feature]' doesn't include UI/E2E tests.
Nothing to plan here. Check the RTM or run /qa:strategy to update it.
```

Determine framework from SKILL.md.

---

### STEP 2 — Analyse the codebase

Spawn a research agent to find, for each RTM requirement marked ✅ UI/E2E:

- The page/component files involved
- Existing `data-testid` attributes (and which are missing)
- Existing Page Objects for this area (if any)
- API calls made during the flow (for network intercepts)
- All UI states: loading, error, empty, success, authenticated, unauthenticated

**Scope rule:** Only analyse pages/components relevant to RTM requirements. Do not expand.

---

### STEP 3 — Create the plan

Create `.claude/plans/e2e-[feature].md`:

````markdown
# E2E Test Plan: [feature]

_Strategy: .claude/strategy/[feature]-strategy.md_
_Framework: [Playwright|Cypress]_
_Created: [date] | Status: pending_

## RTM Coverage

| REQ ID | Requirement | Scenarios |
|---|---|---|
| REQ-01 | [req] | happy path, error state |
| REQ-02 | [req] | validation |

## Missing test IDs (add to components before executing)

| Component | Element | data-testid to add |
|---|---|---|
| `src/auth/LoginForm.tsx` | Email input | `email-input` |
| `src/auth/LoginForm.tsx` | Submit button | `login-submit` |

## File structure to create

```
tests/e2e/[feature]/
└── [feature].spec.ts

tests/pages/
└── [Feature]Page.ts    ← create if doesn't exist

tests/data/
└── [feature].json
```

## Page Object spec

```typescript
export class [Feature]Page extends BasePage {
  // Locators
  private readonly [element]: Locator  // getByTestId('[id]')

  // Actions
  async goto() { await this.navigate(ROUTES.[ROUTE]) }
  async [action]([param]: string) { ... }

  // Assertions  
  async expect[State]() { ... }
}
```

## Test scenarios

Only scenarios that map to RTM requirements are included below.

<scenario id="1" req="REQ-01" priority="P1">
  <name>[plain English — maps to acceptance criterion]</name>
  <auth>none | standard-user | admin</auth>
  <preconditions>
    - [exact state needed]
  </preconditions>
  <steps>
    1. Navigate to [URL]
    2. [Action on element with selector]
    3. [Next action]
    4. Assert [expected outcome]
  </steps>
  <assertions>
    - [Specific, testable assertion]
    - [URL assertion if redirect occurs]
    - [Network request assertion if API call matters]
  </assertions>
</scenario>

<scenario id="2" req="REQ-02" priority="P1">
  ...
</scenario>

## Test data

```json
{
  "validUser": { "email": "testuser@example.com", "password": "TestPass123!" },
  "invalidUser": { "email": "wrong@example.com", "password": "badpass" }
}
```

## CI snippet

```yaml
- name: E2E — [feature]
  run: npx playwright test tests/e2e/[feature]/
  env:
    BASE_URL: ${{ secrets.TEST_BASE_URL }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```
````

---

### STEP 4 — Output

```
✅ E2E plan created: .claude/plans/e2e-[feature].md

RTM requirements covered: [N]
Scenarios planned        : [N]
  P1 (release blockers)  : [N]
  P2                     : [N]

⚠️  Add these data-testid attributes before executing:
  src/[component] → data-testid="[id]"  (on [element description])
  [list all missing]

Next: /qa:execute e2e-[feature]
```
