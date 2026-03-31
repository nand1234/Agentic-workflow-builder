# qa:migrate

Scan existing tests from any framework, choose a target (Playwright or Cypress), scaffold the new framework following coding standards, create a migration plan for every test, then implement each one properly. No bad patterns carried over.

---

## Instructions

You are the GTD Migration Orchestrator. Work through all phases — do not skip steps.

---

## PHASE 1 — Scan Existing Tests

Silently scan for all test files. Detect source framework(s):

**Selenium:** `driver.findElement`, `By.`, `driver.sleep()`, `selenium-webdriver` in package.json
**Protractor:** `protractor.conf.js`, `browser.get()`, `element(by.`
**Old Cypress (v9):** `cypress/integration/`, `cy.server()`, `cy.route()`, `cypress.json`
**TestCafe:** `import { Selector } from 'testcafe'`
**Puppeteer:** `page.click()`, `page.type()`, `puppeteer` in dependencies
**Jest+JSDOM:** `@testing-library/react`, `render()`, `screen.`

For each test file record: framework, language, test count, what it covers, selectors used, auth pattern, waits used, quality assessment.

Output full inventory — no questions yet:

```
═══════════════════════════════════════════════
  EXISTING TEST INVENTORY
═══════════════════════════════════════════════
Framework : Selenium (JavaScript)
Files     : 14  |  Test cases: 87

  tests/selenium/auth/login.test.js       6 tests — auth flows
  tests/selenium/checkout/payment.test.js 12 tests — payment
  tests/selenium/api/users.test.js        9 tests — user API
  [full list]

Quality issues found:
  ⚠️  driver.sleep() arbitrary waits   : 34 occurrences
  ⚠️  Raw inline selectors (no POM)    : 67 occurrences
  ⚠️  Hardcoded URLs                   : 40 occurrences
  ⚠️  Hardcoded credentials            : 22 occurrences
  ✅  Good coverage: auth, checkout, payment present
  ❌  No load, security, or performance tests

Coverage areas:
  Auth       ✅  Checkout ✅  Dashboard ✅
  Admin      ❌  Security ❌  Load      ❌
═══════════════════════════════════════════════
```

---

## PHASE 2 — Choose Target Framework

Ask:
```
Target framework?
  1. Playwright  (recommended — TypeScript-first, API testing built in)
  2. Cypress

Enter 1 or 2:
```

Then:
```
Language?  1. TypeScript (recommended)  2. JavaScript
```

Then:
```
Migration scope?
  1. Migrate all [N] test files
  2. Choose specific areas (rest later)
```

---

## PHASE 3 — Load Framework Skill

Read the full skill file:
- Playwright → `.claude/skills/playwright-standards.md`
- Cypress → `.claude/skills/cypress-standards.md`

Internalise every rule. Every file created in Phases 4–6 must pass the skill's pre-commit checklist.

---

## PHASE 4 — Scaffold Target Framework

Check if target framework already exists (config file, dependencies). If yes — document it and go to Phase 5.

If not — scaffold completely following the skill. Create all files from the scaffold section of `/qa:discover` for the chosen framework: config, BasePage, auth fixtures, ApiHelper, data helpers, constants, env.ts, .env.test.example, package.json scripts.

Populate `tests/constants/index.ts` with `ROUTES` and `ERROR_MESSAGES` extracted from the old test files — don't leave them empty.

---

## PHASE 5 — Create Migration Plans

Read every old test file in scope carefully. For each file:

1. Extract the **intent** of every test — what behaviour is being verified
2. Identify every **problem** — sleeps, inline selectors, hardcoded values, no page objects
3. Determine **missing data-testid** attributes needed
4. Map to **new pattern** following framework skill

Create `.claude/plans/migrate-[area].md` per coverage area (auth, checkout, etc.):

```markdown
# Migration Plan: [area] — [Source] → [Target]

_Source: [old files] | Target: [framework] TypeScript | Created: [date]_

## Requirements Extracted from Old Tests

| ID | Behaviour tested | Old test name | Priority |
|---|---|---|---|
| REQ-01 | Valid login redirects to /dashboard | should login successfully | P1 |
| REQ-02 | Wrong password shows error | should show error for bad password | P1 |

## Issues in Old Tests

| Issue | Location | Fix |
|---|---|---|
| driver.sleep(2000) | login.test.js:23 | await expect(locator).toBeVisible() |
| Selector '#email' | login.test.js:31 | page.getByTestId('email-input') |
| Hardcoded URL | login.test.js:8 | env.baseUrl via ROUTES constant |
| No Page Object | all | create LoginPage.ts extending BasePage |

## Missing data-testid Attributes

| Component | Element | data-testid to add |
|---|---|---|
| src/auth/LoginForm.tsx | Email input | email-input |
| src/auth/LoginForm.tsx | Submit button | login-submit |
| src/auth/LoginForm.tsx | Error message | login-error |

## Target File Structure

tests/e2e/auth/login.spec.ts       ← migrated
tests/pages/LoginPage.ts           ← new POM
tests/data/auth.json               ← extracted data

## Migration Scenarios

<scenario id="1" req="REQ-01" source="should login successfully">
  <old-pattern>
    driver.get('http://localhost:3000/login')
    driver.findElement(By.id('email')).sendKeys('testuser@example.com')
    driver.sleep(2000)
    assert(driver.getCurrentUrl().includes('/dashboard'))
  </old-pattern>
  <problems>Hardcoded URL, credentials, CSS selector, arbitrary sleep, no POM</problems>
  <new-pattern>
    await loginPage.goto()
    await loginPage.loginWith(testData.validUser.email, testData.validUser.password)
    await dashboardPage.expectToBeOnDashboard()
  </new-pattern>
</scenario>

[one scenario per old test case]

## Test Data
[JSON to extract from old hardcoded values]
```

After all plans created:

```
═══════════════════════════════════════════════
  MIGRATION PLANS COMPLETE
═══════════════════════════════════════════════
Plans created:
  .claude/plans/migrate-auth.md        6 → 6 scenarios
  .claude/plans/migrate-checkout.md   20 → 20 scenarios
  .claude/plans/migrate-user-api.md    9 → 9 scenarios

Total issues to fix across all files:
  Arbitrary waits     : 34  |  Inline selectors : 67
  Hardcoded URLs      : 40  |  Hardcoded creds  : 22

data-testid attributes needed:
  src/auth/LoginForm.tsx       → 4 attributes
  src/checkout/PaymentForm.tsx → 7 attributes

⚠️  Add data-testid attributes first, then execute plans.
═══════════════════════════════════════════════
```

---

## PHASE 6 — Add data-testid Attributes

For each component in the plans, add the minimum required attributes surgically:

```tsx
// Before
<button onClick={handleSubmit}>Sign in</button>
// After
<button data-testid="login-submit" onClick={handleSubmit}>Sign in</button>
```

Commit per component:
```
chore(tests): add data-testid to [Component] for migration
```

---

## PHASE 7 — Execute Migration Plans

Work through plans in dependency order (auth first, then features, API tests last).

For each plan:

**7a — Page Object** — create extending BasePage, all locators private, data-testid preferred, actions as verb phrases, assertions starting with `expect`:

```typescript
// tests/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { ROUTES, ERROR_MESSAGES } from '../constants'

export class LoginPage extends BasePage {
  private readonly emailInput:    Locator
  private readonly passwordInput: Locator
  private readonly submitButton:  Locator
  private readonly errorMessage:  Locator

  constructor(page: Page) {
    super(page)
    this.emailInput    = page.getByTestId('email-input')
    this.passwordInput = page.getByTestId('password-input')
    this.submitButton  = page.getByRole('button', { name: /sign in/i })
    this.errorMessage  = page.getByRole('alert')
  }

  async goto() { await this.navigate(ROUTES.LOGIN) }
  async loginWith(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
  async expectErrorMessage(text: string) {
    await expect(this.errorMessage).toBeVisible()
    await expect(this.errorMessage).toContainText(text)
  }
  async expectToBeOnLoginPage() { await this.expectUrl(ROUTES.LOGIN) }
}
```

Commit: `test(pages): add [Feature]Page for [area] migration`

**7b — Test data** — extract all hardcoded values from old tests:

```json
{
  "validUser":   { "email": "testuser@example.com", "password": "TestPass123!" },
  "invalidUser": { "email": "wrong@example.com", "password": "badpassword" }
}
```

Commit: `test(data): extract [area] test data from old tests`

**7c — Spec file** — one per old test file, following skill exactly:

```typescript
// tests/e2e/auth/login.spec.ts
// Migrated from: tests/selenium/auth/login.test.js

import { test, expect } from '../../fixtures'
import { LoginPage }     from '../../pages/LoginPage'
import { DashboardPage } from '../../pages/DashboardPage'
import testData          from '../../data/auth.json'
import { ERROR_MESSAGES } from '../../constants'

test.describe('Login', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  // REQ-01 | migrated from: should login successfully
  test('valid credentials redirect to dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await loginPage.loginWith(testData.validUser.email, testData.validUser.password)
    await dashboard.expectToBeOnDashboard()
  })

  // REQ-02 | migrated from: should show error for bad password
  test('invalid password shows error message', async () => {
    await loginPage.loginWith(testData.validUser.email, testData.invalidUser.password)
    await loginPage.expectErrorMessage(ERROR_MESSAGES.INVALID_CREDENTIALS)
    await loginPage.expectToBeOnLoginPage()
  })
})
```

**Rules applied during migration — zero tolerance:**
- No `waitForTimeout()` — every old `sleep()` replaced with explicit condition
- No inline selectors — everything through Page Object
- No hardcoded URLs — `ROUTES` constants
- No hardcoded credentials — `testData` from JSON
- Test names are plain English (not the old test name)
- Each test maps to a REQ ID via comment

Commit: `test([area]): migrate [description] — REQ-[N], REQ-[N]`

**7d — Run after each area:**
```bash
npx playwright test tests/e2e/[area]/ --reporter=line
```

Fix failures before moving to next area. Only commit green tests.

---

## PHASE 8 — Final Output

```
═══════════════════════════════════════════════
  MIGRATION COMPLETE
═══════════════════════════════════════════════
Source : Selenium (JavaScript)
Target : Playwright (TypeScript)

Tests migrated : [N]/[N] ✅
Tests passing  : [N]/[N]
Tests failing  : [N] (listed below)

Quality improvements:
  Arbitrary waits   : [N] → 0  ✅
  Inline selectors  : [N] → 0  ✅
  Hardcoded URLs    : [N] → 0  ✅
  Hardcoded creds   : [N] → 0  ✅
  Page Objects      : 0 → [N]  ✅
  data-testid attrs : 0 → [N]  ✅ (added to app)

New files:
  [full list of created spec, page object, data files]

[If failures:]
Needs attention:
  ❌ [test] — [cause]

Commits: [N]

Safe to delete old test directory once all [N]/[N] passing.
Run /qa:run e2e to confirm before deleting.
═══════════════════════════════════════════════

Next:
  /qa:run e2e       ← confirm all passing
  /qa:report        ← coverage overview
```

---

## PHASE 9 — Update .claude/SKILL.md

Update to reflect the migrated framework — add a migration notes section:

```markdown
## Migration Notes
- Source: [old framework] — old files kept at [path] for reference
- All selectors migrated from CSS/XPath/ID to data-testid or ARIA roles
- All waits migrated from sleep() to explicit conditions
- All hardcoded values moved to tests/data/*.json and tests/constants/
- Delete [old path] once /qa:run e2e confirms all [N] tests passing
```
