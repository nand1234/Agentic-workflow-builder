# qa:execute

**Mode 2 — implementation.** Reads an approved plan file from `.claude/plans/` and implements the test code. Follows framework standards exactly. Commits each file atomically.

---

## Instructions

$ARGUMENTS is the plan name (e.g. "e2e-user-authentication", "load-checkout", "security-auth").

### STEP 1 — Load standards and plan

Read in this order — all required before writing code:

1. `.claude/SKILL.md`
2. `.claude/skills/playwright-standards.md` OR `.claude/skills/cypress-standards.md`
3. `.claude/plans/[plan-name].md`

If plan not found:
```
❌ Plan '[name]' not found.

Available plans:
[list .claude/plans/ contents]

Create a plan first:
  Mode 2 (structured): /qa:plan-e2e | /qa:plan-load | /qa:plan-security | /qa:plan-performance
  Mode 1 (quick):      /qa:test [describe it in plain English]
```

### STEP 2 — Pre-flight

Check framework is installed:

**Playwright:** `@playwright/test` in package.json → if missing: `npm install --save-dev @playwright/test && npx playwright install chromium firefox webkit`

**Cypress:** `cypress` in package.json → if missing: `npm install --save-dev cypress`

**k6:** binary available → if missing: show install instructions for the OS

Create directories if they don't exist:
```bash
mkdir -p tests/e2e/[feature] tests/api/[feature] tests/pages tests/fixtures tests/helpers tests/data tests/constants tests/config
mkdir -p tests/load/scenarios tests/load/fixtures tests/load/config
mkdir -p tests/security tests/security/helpers
mkdir -p .claude/results
```

**Missing test IDs** — if the plan lists `data-testid` attributes that don't exist yet:

List them clearly and ask:
```
⚠️  These data-testid attributes are needed but don't exist yet:

  src/auth/LoginForm.tsx  →  data-testid="email-input"  (on <input type="email">)
  src/auth/LoginForm.tsx  →  data-testid="login-submit"  (on <button type="submit">)

Add them to the components before tests will pass.
Shall I add them now? (yes / no — I'll note them as pending if no)
```

If yes: add surgically — only the attributes, no other changes. Commit separately:
`chore(tests): add data-testid attributes for [feature] tests`

### STEP 3 — Wave structure

Group implementation into waves:

**Wave 1 — Shared infrastructure (always sequential):**
- Page Object file(s)
- Fixture files
- Test data (JSON)
- Helper updates if needed

**Wave 2 — Test scenarios (parallel by group):**
- Critical/P1 scenarios first
- Additional scenario groups in parallel

**Wave 3 — Config (if needed):**
- Framework config updates
- CI workflow file

Show the wave plan before starting:
```
Implementation plan:

Wave 1 (sequential — infrastructure):
  → tests/pages/LoginPage.ts
  → tests/data/auth.json

Wave 2 (parallel — test scenarios):
  → tests/e2e/auth/login-happy-path.spec.ts     (REQ-01, REQ-04)
  → tests/e2e/auth/login-error-states.spec.ts   (REQ-02)
  → tests/e2e/auth/login-lockout.spec.ts        (REQ-03)

Wave 3 (sequential — config):
  → .github/workflows/e2e.yml  (if not present)
```

### STEP 4 — Wave 1: Infrastructure

Implement Page Objects following the framework skill exactly.

**Every Page Object must:**
- Extend `BasePage`
- Have all locators as `private readonly` properties at the top
- Use selector priority: `data-testid` → role → label → text
- Have action methods as verb phrases (no assertions inside)
- Have assertion methods starting with `expect`
- Return `this` (Cypress) or be `async` (Playwright)

**Every test data file must:**
- Use real-looking values (not "foo", "bar", "test123")
- Include all states the tests need (valid, invalid, edge cases)
- Never contain production data

Commit Wave 1:
```
test(infra): add [feature] page object and fixtures
```

### STEP 5 — Wave 2: Test scenarios

For each scenario in the plan, implement following the spec exactly.

**Playwright spec rules (enforce from playwright-standards.md):**
- `import { test, expect } from '../../fixtures'` — not from `@playwright/test`
- One `test.describe` per scenario group
- Plain English test names: `'redirects to dashboard with valid credentials'`
- `beforeEach` for setup only — no assertions
- No `waitForTimeout` — use explicit conditions
- No selectors in spec files — through page objects only
- No hardcoded values — through constants and fixtures only

**Cypress spec rules (enforce from cypress-standards.md):**
- No `cy.get()` in spec files — through page objects only
- No `cy.wait(N)` — use intercepts or assertion retries
- `cy.login()` for auth — never repeat login steps
- Fluent page object chain in spec file

**Each test must:**
- Map to a specific REQ ID from the plan (add as a comment: `// REQ-01`)
- Test one behaviour
- Be independent (no dependency on test order)
- Clean up any state it creates

Commit each scenario group:
```
test([feature]): add [scenario description] — REQ-[N]
```

### STEP 6 — Wave 3: Config

**Playwright config** — update if needed (add project, adjust paths).

**CI workflow** — create `.github/workflows/e2e.yml` if it doesn't exist:

```yaml
name: E2E Tests — [feature]
on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Start app
        run: npm run build && npm run start &
      - name: Wait for app
        run: npx wait-on http://localhost:3000 --timeout 30000
      - name: Run E2E tests
        run: npx playwright test tests/e2e/[feature]/
        env:
          BASE_URL: ${{ secrets.TEST_BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: .claude/results/html-report/
```

Commit:
```
ci: add E2E test workflow for [feature]
```

### STEP 7 — Run and verify

Run the implemented tests:

**Playwright:**
```bash
npx playwright test tests/e2e/[feature]/ --reporter=line
```

**Cypress:**
```bash
npx cypress run --spec "cypress/e2e/[feature]/**"
```

**If tests fail** — diagnose and fix before committing. Common causes:

| Problem | Fix |
|---|---|
| Selector not found | Verify `data-testid` was added. Check selector priority order. |
| Timeout | Add explicit wait: `waitForResponse`, `waitForURL`, `waitForLoadState` |
| Auth fails | Check `.env.test` credentials exist and test user is seeded |
| Type error | Fix TypeScript — never cast to `any` |
| Flaky test | Add network intercept and `cy.wait('@alias')` or `await page.waitForResponse()` |

Only commit passing tests. If a test reveals a real app bug, document it and flag it — don't skip the test.

### STEP 8 — Output

```
✅ [plan-name] implemented

Files created: [N]
  tests/pages/[Feature]Page.ts
  tests/e2e/[feature]/[feature].spec.ts
  tests/data/[feature].json
  [etc]

Test results:
  ✅ [N] passing
  ❌ [N] failing  ← (with fix plans if any)

Commits: [N]
  chore(tests): add data-testid to [Component]
  test(infra): add [feature] page object and fixtures
  test([feature]): [scenario description] — REQ-01
  test([feature]): [scenario description] — REQ-02
  ci: add E2E test workflow for [feature]

Next:
  /qa:run e2e       ← run the full suite
  /qa:verify        ← if anything failed
  /qa:report        ← coverage and status overview
```
