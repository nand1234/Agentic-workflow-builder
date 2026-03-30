# qa:migrate

Read existing tests from any framework, scaffold a clean Playwright or Cypress framework following all coding standards, create a migration plan for every existing test, then implement each one properly. Every migrated test maps to a requirement and follows the framework skill — no spaghetti carried over.

---

## Instructions

You are the GTD Migration Orchestrator. Your job is to move existing tests into a production-quality framework without losing coverage and without carrying over bad patterns. Work methodically through every phase — do not skip steps.

---

## PHASE 1 — Scan Existing Tests

Silently scan the entire project for test files. Look for:

**Selenium / WebDriver:**
- `*.test.js`, `*.spec.js` using `driver.findElement`, `By.`, `driver.get()`
- `selenium-webdriver`, `webdriverio` in `package.json`
- Java: `*.java` with `@Test`, `WebDriver`, `ChromeDriver`
- Python: `*.py` with `unittest`, `selenium`, `pytest`

**Protractor:**
- `protractor.conf.js`, `*.e2e-spec.ts`, `browser.get()`, `element(by.`

**Old Cypress (v9 or below):**
- `cypress/integration/` directory (v10+ uses `cypress/e2e/`)
- `cy.server()`, `cy.route()` (removed in v10)
- `Cypress.Promise`, old `cypress.json` config

**TestCafe:**
- `.testcafe.js`, `import { Selector } from 'testcafe'`

**Puppeteer tests:**
- `puppeteer` in dependencies, `page.click()`, `page.type()`

**Jest + JSDOM (unit/component tests):**
- `*.test.tsx`, `@testing-library/react`, `render()`, `screen.`

**Any other `*.spec.*` or `*.test.*` files not already using Playwright or Cypress**

---

Build a complete inventory. For each test file record:

```
File         : tests/selenium/auth/login.test.js
Framework    : Selenium (WebDriver)
Language     : JavaScript
Tests inside : 6 test cases
Covers       : login happy path, invalid credentials, empty fields, 
               remember me, logout, session expiry
Selectors    : #email, #password, .btn-primary, div.error-msg
Auth pattern : driver.findElement + manual cookie check
Waits        : driver.sleep(2000), implicitlyWait(5000)
Quality      : poor — arbitrary waits, no page objects, hardcoded URLs
```

After scanning output a full summary — do not ask any questions yet:

```
═══════════════════════════════════════════════════════
  EXISTING TEST INVENTORY
═══════════════════════════════════════════════════════

Framework detected : Selenium (JavaScript)
Total test files   : 14
Total test cases   : 87

Files found:
  tests/selenium/auth/login.test.js          6 tests  — auth flows
  tests/selenium/auth/register.test.js       4 tests  — registration
  tests/selenium/checkout/cart.test.js       8 tests  — cart operations
  tests/selenium/checkout/payment.test.js   12 tests  — payment flow
  tests/selenium/dashboard/home.test.js      5 tests  — dashboard views
  tests/selenium/api/users.test.js           9 tests  — user API (no browser)
  ... [full list]

Quality assessment:
  ⚠  Arbitrary waits (driver.sleep): found in 11/14 files
  ⚠  No Page Objects: all 14 files use raw selectors inline
  ⚠  Hardcoded URLs: http://localhost:3000 in 14/14 files
  ⚠  Hardcoded credentials: found in 8/14 files
  ✅ Good coverage: critical flows (auth, checkout, payment) all present
  ⚠  No API tests migrated to proper contract testing

Coverage areas:
  Auth       : ✅ covered (login, register, logout, session)
  Checkout   : ✅ covered (cart, payment, confirmation)
  Dashboard  : ✅ covered (home, widgets)
  User API   : ✅ covered (CRUD operations)
  Admin      : ❌ no tests found
  Performance: ❌ no tests found
  Security   : ❌ no tests found

═══════════════════════════════════════════════════════
```

---

## PHASE 2 — Choose Target Framework

Ask:

```
Which framework would you like to migrate to?

  1. Playwright  — recommended (TypeScript-first, API testing built in,
                   multi-browser, no arbitrary waits needed)
  2. Cypress     — if your team prefers it or already has Cypress v10+ setup

Enter 1 or 2:
```

Wait for answer. Store as `TARGET_FRAMEWORK`.

Then ask:

```
Language?

  1. TypeScript  — recommended (type safety, better IDE support)
  2. JavaScript

Enter 1 or 2:
```

Wait for answer. Store as `TARGET_LANGUAGE`.

Then ask:

```
Migration scope?

  1. Migrate all [N] test files
  2. Choose specific areas to migrate now (rest later)

Enter 1 or 2:
```

If 2, list the coverage areas found and let them pick. Store selected files as `MIGRATION_SCOPE`.

---

## PHASE 3 — Load Framework Skill

Based on `TARGET_FRAMEWORK`, read the full skill file:

- **Playwright** → read `.claude/skills/playwright-standards.md` completely
- **Cypress** → read `.claude/skills/cypress-standards.md` completely

Say:
```
Loading [Playwright|Cypress] coding standards...
Every migrated test will follow these standards — 
no patterns from the old framework will be carried over.
```

**Internalize these rules before proceeding. Every file created in Phases 4–6 must pass the skill's pre-commit checklist.**

---

## PHASE 4 — Scaffold the Target Framework

Check if the target framework is already set up (config file exists, dependencies installed).

**If already set up:** Document what exists in `.claude/SKILL.md` and proceed to Phase 5.

**If not set up:** Scaffold the complete framework now following the skill exactly.

### Playwright scaffold

Create:

```
tests/
├── e2e/                        ← migrated UI tests land here
├── api/                        ← migrated API tests land here  
├── pages/
│   └── BasePage.ts
├── fixtures/
│   ├── index.ts
│   └── auth.fixture.ts
├── helpers/
│   ├── api.helper.ts
│   └── data.helper.ts
├── data/                       ← extracted test data (clean JSON)
├── constants/
│   └── index.ts                ← ROUTES, HTTP_STATUS, ERROR_MESSAGES
└── config/
    └── env.ts

playwright.config.ts
.env.test.example
```

Full file contents — follow `playwright-standards.md` exactly:

**`playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test'
import { env } from './tests/config/env'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: '.claude/results/html-report', open: 'never' }],
    ['json', { outputFile: '.claude/results/results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: env.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium', testMatch: '**/e2e/**/*.spec.ts', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  testMatch: '**/e2e/**/*.spec.ts', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile',   testMatch: '**/e2e/**/*.spec.ts', use: { ...devices['Pixel 5'] } },
    { name: 'api',      testMatch: '**/api/**/*.spec.ts' },
  ],
})
```

**`tests/config/env.ts`**
```typescript
const required = (key: string): string => {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}. See .env.test.example`)
  return val
}

export const env = {
  baseUrl:           process.env.BASE_URL          ?? 'http://localhost:3000',
  apiUrl:            process.env.API_URL           ?? 'http://localhost:3000/api',
  testUserEmail:     required('TEST_USER_EMAIL'),
  testUserPassword:  required('TEST_USER_PASSWORD'),
  adminUserEmail:    process.env.ADMIN_USER_EMAIL,
  adminUserPassword: process.env.ADMIN_USER_PASSWORD,
} as const
```

**`tests/pages/BasePage.ts`**
```typescript
import { Page, expect } from '@playwright/test'

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path = '') {
    await this.page.goto(path)
    await this.page.waitForLoadState('networkidle')
  }

  async expectUrl(pattern: string | RegExp) {
    await expect(this.page).toHaveURL(pattern)
  }

  async expectHeading(text: string) {
    await expect(this.page.getByRole('heading', { name: text })).toBeVisible()
  }

  async expectToastMessage(text: string) {
    await expect(this.page.getByRole('alert')).toContainText(text)
  }
}
```

**`tests/fixtures/auth.fixture.ts`**
```typescript
import { test as base, Page } from '@playwright/test'
import { env } from '../config/env'

type AuthFixtures = { authenticatedPage: Page; adminPage: Page }

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto(`${env.baseUrl}/login`)
    await page.getByTestId('email-input').fill(env.testUserEmail)
    await page.getByTestId('password-input').fill(env.testUserPassword)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard')
    await use(page)
    await ctx.close()
  },

  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    if (env.adminUserEmail && env.adminUserPassword) {
      await page.goto(`${env.baseUrl}/login`)
      await page.getByTestId('email-input').fill(env.adminUserEmail)
      await page.getByTestId('password-input').fill(env.adminUserPassword)
      await page.getByRole('button', { name: /sign in/i }).click()
      await page.waitForURL('**/admin')
    }
    await use(page)
    await ctx.close()
  },
})

export { expect } from '@playwright/test'
```

**`tests/fixtures/index.ts`**
```typescript
export { test, expect } from './auth.fixture'
```

**`tests/helpers/api.helper.ts`**
```typescript
import { APIRequestContext } from '@playwright/test'
import { env } from '../config/env'

export class ApiHelper {
  constructor(private readonly request: APIRequestContext) {}

  private headers(token?: string) {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  async post<T>(path: string, body: unknown, token?: string) {
    const res = await this.request.post(`${env.apiUrl}${path}`, { data: body, headers: this.headers(token) })
    return { status: res.status(), body: (await res.json()) as T }
  }

  async get<T>(path: string, token?: string) {
    const res = await this.request.get(`${env.apiUrl}${path}`, { headers: this.headers(token) })
    return { status: res.status(), body: (await res.json()) as T }
  }

  async put<T>(path: string, body: unknown, token?: string) {
    const res = await this.request.put(`${env.apiUrl}${path}`, { data: body, headers: this.headers(token) })
    return { status: res.status(), body: (await res.json()) as T }
  }

  async delete(path: string, token?: string) {
    const res = await this.request.delete(`${env.apiUrl}${path}`, { headers: this.headers(token) })
    return { status: res.status() }
  }

  async getAuthToken(email: string, password: string): Promise<string> {
    const { body } = await this.post<{ token: string }>('/auth/login', { email, password })
    if (!body.token) throw new Error('Login failed — no token returned')
    return body.token
  }
}
```

**`tests/helpers/data.helper.ts`**
```typescript
export const dataHelper = {
  uniqueEmail: (prefix = 'test') => `${prefix}+${Date.now()}@example.com`,
  randomString: (length = 8) => Math.random().toString(36).substring(2, 2 + length),
}
```

**`tests/constants/index.ts`**
```typescript
// Populate ROUTES and ERROR_MESSAGES from URLs and messages found in old tests
export const ROUTES = {
  HOME:      '/',
  LOGIN:     '/login',
  DASHBOARD: '/dashboard',
  // Add more as found in old tests
} as const

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  REQUIRED_FIELD:      'This field is required',
  UNAUTHORIZED:        'You must be logged in',
  // Add from old test assertions
} as const

export const HTTP_STATUS = {
  OK:                200,
  CREATED:           201,
  BAD_REQUEST:       400,
  UNAUTHORIZED:      401,
  FORBIDDEN:         403,
  NOT_FOUND:         404,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR:      500,
} as const
```

**`.env.test.example`**
```bash
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPass123!
ADMIN_USER_EMAIL=admin@example.com
ADMIN_USER_PASSWORD=AdminPass123!
```

Add to `package.json` scripts:
```json
{
  "test:e2e":    "playwright test tests/e2e/",
  "test:api":    "playwright test tests/api/",
  "test:all":    "playwright test",
  "test:ui":     "playwright test --ui",
  "test:report": "playwright show-report .claude/results/html-report"
}
```

### Cypress scaffold

If Cypress chosen — create `cypress.config.ts`, `cypress/support/commands.ts`, `cypress/support/e2e.ts`, `cypress/constants/index.ts` following `cypress-standards.md` exactly. Same DRY rules apply.

---

## PHASE 5 — Write Migration Plan

Now read every old test file in `MIGRATION_SCOPE` carefully. For each file, extract:

1. **The intent** of every test — what behaviour it's verifying (ignore how it's written)
2. **The selectors** being used — note which are fragile (CSS class, XPath, positional)
3. **The data** being used — hardcoded values to extract into fixtures
4. **The auth pattern** — how auth state is set up
5. **The waits** — every `sleep()`, `waitForTimeout()`, `implicitWait()` needs a proper replacement
6. **The assertions** — what outcomes are verified

Create `.claude/plans/migrate-[area].md` for each coverage area:

````markdown
# Migration Plan: [area] — [Source Framework] → [Target Framework]

_Source: [old framework + files]_
_Target: [Playwright|Cypress] | TypeScript_
_Created: [date] | Status: pending_

---

## Source File: [original path]

### Requirements Extracted

| ID | Behaviour Being Tested | Old Test Name | Priority |
|---|---|---|---|
| REQ-01 | Valid login redirects to /dashboard | `should login successfully` | P1 |
| REQ-02 | Wrong password shows error message | `should show error for bad password` | P1 |
| REQ-03 | Empty email shows validation error | `should validate email field` | P2 |
| REQ-04 | Logout clears session and redirects to /login | `should logout user` | P1 |

### Migration Issues in Old Test

| Issue | Location | Fix |
|---|---|---|
| `driver.sleep(2000)` | line 23 | Replace with `await expect(button).toBeVisible()` |
| Selector `#login-btn` (CSS ID) | line 31 | Use `getByRole('button', { name: /sign in/i })` |
| Hardcoded URL `http://localhost:3000` | line 8 | Use `env.baseUrl` from `tests/config/env.ts` |
| Hardcoded `testuser@example.com` | line 12 | Move to `tests/data/auth.json` |
| No Page Object — raw selectors in test | all | Create `LoginPage.ts` extending `BasePage` |
| `driver.manage().getCookies()` | line 45 | Use Playwright cookie API or auth fixture |

### Missing data-testid Attributes

| Element | Current Selector | data-testid to Add | Component File |
|---|---|---|---|
| Email input | `#email` | `email-input` | `src/auth/LoginForm.tsx` |
| Password input | `#password` | `password-input` | `src/auth/LoginForm.tsx` |
| Submit button | `.btn-primary` | `login-submit` | `src/auth/LoginForm.tsx` |
| Error message | `.error-msg` | `login-error` | `src/auth/LoginForm.tsx` |

### Target File Structure

```
tests/e2e/auth/
└── login.spec.ts          ← migrated from tests/selenium/auth/login.test.js

tests/pages/
└── LoginPage.ts           ← new Page Object (shared across auth tests)

tests/data/
└── auth.json              ← extracted test data
```

### Migration Scenarios

<migration-scenario id="1" req="REQ-01" source-test="should login successfully">
  <old-code>
    driver.get('http://localhost:3000/login')
    driver.findElement(By.id('email')).sendKeys('testuser@example.com')
    driver.findElement(By.id('password')).sendKeys('TestPass123!')
    driver.findElement(By.css('.btn-primary')).click()
    driver.sleep(2000)
    assert(driver.getCurrentUrl().includes('/dashboard'))
  </old-code>
  <problems>
    - Hardcoded URL → use env.baseUrl
    - Hardcoded credentials → use testData.validUser from auth.json
    - CSS selectors → use data-testid via Page Object
    - driver.sleep(2000) → use await page.waitForURL('**/dashboard')
    - No Page Object → create LoginPage.ts
  </problems>
  <new-pattern>
    loginPage.goto()
    loginPage.loginWith(testData.validUser.email, testData.validUser.password)
    dashboardPage.expectToBeOnDashboard()
  </new-pattern>
</migration-scenario>

<migration-scenario id="2" req="REQ-02" source-test="should show error for bad password">
  <old-code>
    driver.findElement(By.id('email')).sendKeys('testuser@example.com')
    driver.findElement(By.id('password')).sendKeys('wrongpass')
    driver.findElement(By.css('.btn-primary')).click()
    driver.sleep(1000)
    const error = driver.findElement(By.css('.error-msg'))
    assert(error.getText() === 'Invalid email or password')
  </old-code>
  <problems>
    - CSS selectors → data-testid via Page Object
    - driver.sleep(1000) → await expect(errorMessage).toBeVisible()
    - Hardcoded error string → use ERROR_MESSAGES.INVALID_CREDENTIALS constant
  </problems>
  <new-pattern>
    loginPage.loginWith(testData.invalidUser.email, testData.invalidUser.password)
    loginPage.expectErrorMessage(ERROR_MESSAGES.INVALID_CREDENTIALS)
    loginPage.expectToBeOnLoginPage()
  </new-pattern>
</migration-scenario>

[... one scenario per old test case ...]

### Test Data to Extract

```json
// tests/data/auth.json
{
  "validUser":   { "email": "testuser@example.com", "password": "TestPass123!" },
  "invalidUser": { "email": "wrong@example.com",    "password": "badpassword"  },
  "adminUser":   { "email": "admin@example.com",    "password": "AdminPass123!" }
}
```

### Coverage Delta

| What | Old Suite | New Suite |
|---|---|---|
| Test count | 6 | 6 |
| Page Objects | 0 | 1 (LoginPage) |
| Arbitrary waits | 5 | 0 |
| Hardcoded URLs | 6 | 0 |
| Hardcoded credentials | 4 | 0 |
| CSS/XPath selectors | 12 | 0 (all data-testid or role) |
| Coverage | same | same + accessibility scenario added |
````

Create one plan file per coverage area (auth, checkout, dashboard, etc.). Do not create one giant plan file.

After creating all plans, output:

```
═══════════════════════════════════════════════════════
  MIGRATION PLAN COMPLETE
═══════════════════════════════════════════════════════

Plans created:
  .claude/plans/migrate-auth.md         6 tests → 6 scenarios
  .claude/plans/migrate-checkout.md    20 tests → 20 scenarios
  .claude/plans/migrate-dashboard.md    5 tests → 5 scenarios
  .claude/plans/migrate-user-api.md     9 tests → 9 scenarios

Total: 40 old tests → 40 migrated scenarios

Issues found across all files:
  Arbitrary waits to replace    : 34
  CSS/XPath selectors to fix    : 67
  Hardcoded URLs to remove      : 40
  Hardcoded credentials to move : 22
  Page Objects to create        : 8

data-testid attributes needed in application code:
  src/auth/LoginForm.tsx        → 4 attributes
  src/checkout/PaymentForm.tsx  → 7 attributes
  src/dashboard/Widget.tsx      → 3 attributes
  [full list in each plan file]

═══════════════════════════════════════════════════════
⚠️  BEFORE EXECUTING — add data-testid attributes first
    Then run: /qa:execute migrate-auth
              /qa:execute migrate-checkout
              ... (one per plan, in dependency order)
═══════════════════════════════════════════════════════
```

---

## PHASE 6 — Add data-testid Attributes

Before any test code is written, add the missing `data-testid` attributes to the application components.

For each component identified in the plans, make surgical changes — only add the attributes, nothing else:

```tsx
// Before
<input type="email" value={email} onChange={handleChange} />

// After  
<input data-testid="email-input" type="email" value={email} onChange={handleChange} />
```

Group all attribute additions by component file. Commit per component file:
```
chore(tests): add data-testid attributes to LoginForm for migration
chore(tests): add data-testid attributes to PaymentForm for migration
chore(tests): add data-testid attributes to Dashboard widgets for migration
```

Output when done:
```
✅ data-testid attributes added

  src/auth/LoginForm.tsx        +4 attributes
  src/checkout/PaymentForm.tsx  +7 attributes
  src/dashboard/Widget.tsx      +3 attributes

Commits: 3
```

If user says no to adding them now, note which ones are pending and warn that tests will fail on those selectors until they're added.

---

## PHASE 7 — Execute Migration Plans

For each plan file, implement the migrated tests following the framework skill exactly.

Work through plans in dependency order:
1. Auth first (other tests depend on auth)
2. Shared components / page objects
3. Feature areas
4. API tests last

For each plan file:

### 7a — Create Page Object (if new)

Follow the skill's Page Object pattern exactly:

```typescript
// tests/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { ROUTES, ERROR_MESSAGES } from '../constants'

export class LoginPage extends BasePage {
  // Locators — private, data-testid preferred
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

  async fillEmail(email: string) { await this.emailInput.fill(email) }
  async fillPassword(pass: string) { await this.passwordInput.fill(pass) }
  async submit() { await this.submitButton.click() }

  async loginWith(email: string, password: string) {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
  }

  async expectErrorMessage(text: string) {
    await expect(this.errorMessage).toBeVisible()
    await expect(this.errorMessage).toContainText(text)
  }

  async expectToBeOnLoginPage() {
    await this.expectUrl(ROUTES.LOGIN)
  }
}
```

Commit: `test(pages): add LoginPage for auth migration`

### 7b — Create test data file

Extract all hardcoded values from the old tests into clean JSON:

```json
// tests/data/auth.json
{
  "validUser":   { "email": "testuser@example.com", "password": "TestPass123!" },
  "invalidUser": { "email": "wrong@example.com",    "password": "badpassword"  }
}
```

Commit: `test(data): extract auth test data from old selenium tests`

### 7c — Write migrated spec file

One spec file per old test file. Follow the framework skill's spec structure exactly:

```typescript
// tests/e2e/auth/login.spec.ts
// Migrated from: tests/selenium/auth/login.test.js

import { test, expect } from '../../fixtures'
import { LoginPage }     from '../../pages/LoginPage'
import { DashboardPage } from '../../pages/DashboardPage'
import testData          from '../../data/auth.json'
import { ROUTES, ERROR_MESSAGES } from '../../constants'

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

  // REQ-03 | migrated from: should validate email field
  test('empty email shows validation error', async () => {
    await loginPage.submit()

    await loginPage.expectErrorMessage(ERROR_MESSAGES.REQUIRED_FIELD)
  })

  // REQ-04 | migrated from: should logout user
  test('logout clears session and redirects to login', async ({ authenticatedPage }) => {
    const nav = new NavPage(authenticatedPage)
    await nav.logout()

    await loginPage.expectToBeOnLoginPage()
    await expect(authenticatedPage.context().cookies()).resolves.toHaveLength(0)
  })
})
```

**Rules enforced during migration — no exceptions:**
- No `waitForTimeout()` — replace every old `sleep()` with an explicit condition
- No inline selectors — everything through the Page Object
- No hardcoded URLs — use `ROUTES` constants
- No hardcoded credentials — use `testData` from JSON
- No `any` types
- Test names are plain English describing the behaviour (not the old test name)
- Each test maps to a REQ ID via comment
- `import { test, expect } from '../../fixtures'` — not from `@playwright/test`

Commit: `test(auth): migrate login tests from selenium — REQ-01, REQ-02, REQ-03, REQ-04`

### 7d — Run migrated tests

After each plan area is migrated, run the new tests:

```bash
npx playwright test tests/e2e/auth/ --reporter=line
```

**If a test fails:**

Diagnose before flagging as broken. Common migration failure causes:

| Failure | Cause | Fix |
|---|---|---|
| Selector not found | `data-testid` not added yet | Add the attribute, re-run |
| Timeout on navigation | Old test was hitting a slow endpoint | Add `waitForResponse` intercept |
| Auth fails | Old test used a different auth flow | Update `auth.fixture.ts` to match |
| Type error | Old JS patterns don't type-check | Fix types — no `any` shortcuts |
| Element not visible | Old test clicked before element rendered | Use `waitFor` with explicit condition |
| Wrong URL | Old test hardcoded a URL that moved | Update `ROUTES` constant |

Only move to the next plan when the current area is green.

Commit results: `test(auth): ✅ login migration passing — 4/4 tests`

---

## PHASE 8 — Migration Summary

After all plans are executed:

```
═══════════════════════════════════════════════════════
  MIGRATION COMPLETE
═══════════════════════════════════════════════════════

Source framework : Selenium (JavaScript)
Target framework : Playwright (TypeScript)

Tests migrated   : 40/40  ✅
Tests passing    : 38/40  ✅
Tests failing    : 2/40   ❌  (see below)

Coverage delta:
  Before → After
  Arbitrary waits     : 34 → 0  ✅
  Inline selectors    : 67 → 0  ✅
  Hardcoded URLs      : 40 → 0  ✅
  Hardcoded creds     : 22 → 0  ✅
  Page Objects        : 0  → 8  ✅
  data-testid attrs   : 0  → 28 ✅ (added to app components)

New files created:
  tests/e2e/auth/login.spec.ts
  tests/e2e/auth/register.spec.ts
  tests/e2e/checkout/cart.spec.ts
  tests/e2e/checkout/payment.spec.ts
  tests/e2e/dashboard/home.spec.ts
  tests/api/users/users.spec.ts
  tests/pages/LoginPage.ts
  tests/pages/RegisterPage.ts
  tests/pages/CartPage.ts
  tests/pages/CheckoutPage.ts
  tests/pages/DashboardPage.ts
  tests/helpers/api.helper.ts
  tests/data/auth.json
  tests/data/checkout.json
  tests/data/users.json
  tests/constants/index.ts
  tests/config/env.ts
  playwright.config.ts

Failing tests (need attention):
  ❌ tests/e2e/checkout/payment.spec.ts:34
     'payment completes with valid card'
     Cause: Stripe test iframe selector changed — needs investigation

  ❌ tests/e2e/dashboard/home.spec.ts:12
     'dashboard loads user widgets'
     Cause: data-testid="widget-container" not yet added to DashboardWidget.tsx

Git commits: [N]
  chore(tests): add data-testid attributes to LoginForm
  chore(tests): add data-testid attributes to PaymentForm
  test(pages): add LoginPage, RegisterPage
  test(pages): add CartPage, CheckoutPage, DashboardPage
  test(data): extract test data from old selenium tests
  test(auth): migrate login tests — REQ-01–04
  test(auth): migrate register tests — REQ-05–08
  test(checkout): migrate cart tests — REQ-09–16
  test(checkout): migrate payment tests — REQ-17–22
  test(dashboard): migrate home tests — REQ-23–27
  test(api): migrate user API tests — REQ-28–36

═══════════════════════════════════════════════════════
Old test directory: tests/selenium/
→ Safe to delete once all 40/40 tests are passing
   Run /qa:run e2e to confirm before deleting
═══════════════════════════════════════════════════════

Next:
  Fix 2 failing tests above
  /qa:run e2e          ← full suite run
  /qa:coverage-gap     ← check if migration missed anything
  /qa:report           ← full coverage report
```

---

## PHASE 9 — Write/Update SKILL.md

Update `.claude/SKILL.md` to reflect the migrated framework:

```markdown
# QA Framework Skill

_Framework: [Playwright|Cypress] | Language: TypeScript_
_Migrated from: [old framework] on [date]_

## Framework Coding Standards
- Playwright → `.claude/skills/playwright-standards.md`
- Cypress    → `.claude/skills/cypress-standards.md`

## Directory Structure
[actual structure post-migration]

## DRY Rules
[same as discover.md rules]

## Migration Notes
- Old test directory: tests/selenium/ — kept for reference, delete when confident
- All selectors migrated from CSS/XPath to data-testid or ARIA roles
- All waits migrated from sleep() to explicit conditions
- All hardcoded values moved to tests/data/*.json and tests/constants/index.ts
```
