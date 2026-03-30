---
name: playwright-standards
description: Read this before writing any Playwright test code. Use this skill
  whenever generating, modifying, or reviewing Playwright spec files, page
  objects, fixtures, helper classes, test data, or playwright.config.ts.
  Enforces Page Object Model, centralised JSON test data, helper classes with
  step() annotations, Playwright fixtures for page injection, and
  storageState-based auth. Always trigger this skill for any Playwright-related
  task, even a single test or a small change.
---

# Playwright Test Standards

Every file generated or modified must comply with these standards. No exceptions.

---

## 1. Core Principles

### SOLID Applied to Playwright

| Principle | What it means in Playwright |
|---|---|
| **Single Responsibility** | One page class per page. One spec file per feature. One `test()` block tests one observable behaviour. |
| **Open/Closed** | Page classes are open for extension, closed for modification. Add new behaviour by extending `BasePage` — never editing shared page methods to handle a special case. |
| **Liskov Substitution** | Any page subclass must work wherever `BasePage` is expected. Don't override methods with incompatible signatures. |
| **Interface Segregation** | Don't add methods to a page class that only one test needs. One-off helpers belong in a helper class, not in a shared page. |
| **Dependency Inversion** | Tests depend on page objects and fixtures, not on raw `page.locator()` chains. Spec files never call `page.getByTestId()` directly. |

### DRY — Never Repeat These

- **Locators** → Page Object class only. Never inline `page.locator('#submit')` in a spec.
- **Auth** → `storageState` via setup project. Never repeat login steps in tests.
- **URLs** → `ROUTES` constants + `baseURL` in config. Never write `http://localhost:3000` in a spec.
- **Credentials** → `process.env` loaded from `.env.test`. Never hardcode in source.
- **Test data** → JSON fixture files only. Never hardcode names, emails, or values in specs.
- **Page instantiation** → Playwright fixtures (via `base.ts`). Never `new LoginPage(page)` inside a spec.
- **API calls** → `request` fixture or a dedicated `ApiHelper` class.

### Clean Code Rules

- **Method names describe behaviour**: `fillEmail()`, `submitForm()`, `expectErrorMessage()`.
- **No comments explaining *what* the code does** — it must be self-explanatory. Comments only explain *why* a non-obvious thing is done.
- **Max 15 lines per `test()` block** — if longer, extract actions to page methods or helpers.
- **No `page.waitForTimeout(N)` anywhere** — use auto-waiting locators or `waitFor` conditions.
- **No raw locators in spec files** — always go through a page object method.
- **No nested `test.describe` deeper than 2 levels.**

---

## 2. File & Folder Conventions

```
playwright/
├── tests/                        ← One folder per feature
│   └── [feature]/
│       └── [feature].spec.ts
├── api/                          ← API tests (request fixture, no UI)
│   └── [resource]/
│       └── [resource].spec.ts
├── pages/                        ← Page Object classes
│   ├── BasePage.ts
│   └── [Feature]Page.ts
├── fixtures/                     ← Custom Playwright fixtures (page injection)
│   └── base.ts                   ← Single fixture file — extends test with all pages
├── helpers/                      ← Helper classes with business logic
│   └── [Feature]Helper.ts
├── data/                         ← ALL test data as JSON
│   └── [feature].json
├── constants/                    ← ROUTES, HTTP_STATUS, ERROR_MESSAGES
│   └── index.ts
├── auth.setup.ts                 ← Login once, save storageState
├── playwright/.auth/             ← Saved auth state (gitignored)
│   └── user.json
└── playwright.config.ts
```

**Naming rules:**
- Spec files: `[feature].spec.ts` — lowercase, hyphenated
- Page classes: `[Feature]Page.ts` — PascalCase
- Helper classes: `[Feature]Helper.ts` — PascalCase
- Data files: `[feature].json` — lowercase, hyphenated
- Fixture keys: camelCase noun phrases (`loginPage`, `checkoutPage`)

---

## 3. Test Data — Centralised in JSON

**All test data lives in `playwright/data/`**. No hardcoded strings, emails, names, or values anywhere in specs, page objects, or helpers.

```json
// playwright/data/users.json
{
  "valid": {
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  },
  "admin": {
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "name": "Admin User"
  },
  "invalid": {
    "email": "wrong@example.com",
    "password": "badpass"
  }
}
```

```json
// playwright/data/products.json
{
  "basic": {
    "name": "Basic Widget",
    "sku": "WGT-001",
    "price": 9.99
  },
  "premium": {
    "name": "Premium Widget",
    "sku": "WGT-PRO",
    "price": 49.99
  }
}
```

**Loading data in specs and helpers:**

```typescript
// Import at the top of the file — never inline
import users from '../../data/users.json'
import products from '../../data/products.json'

test('logs in with valid credentials', async ({ loginPage }) => {
  await loginPage.loginWith(users.valid.email, users.valid.password)
})
```

**Rules:**
- One data file per domain (`users.json`, `products.json`, `orders.json`).
- Never duplicate data across data files — one source of truth.
- Data values must not be mutated in tests.
- If a test needs unique data per run (e.g. unique email), generate it in a helper — never construct it inline in the spec.

---

## 4. Helper Classes

Helper classes contain **business logic, data generation, and API seed operations** that don't belong in page objects. Every public method must open with `await test.step()`.

```typescript
// playwright/helpers/CheckoutHelper.ts

import { APIRequestContext } from '@playwright/test'
import { test } from '../fixtures/base'
import products from '../data/products.json'

export class CheckoutHelper {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * Generates a unique guest email to avoid conflicts across parallel test runs.
   */
  async generateGuestEmail(): Promise<string> {
    return test.step('Generate unique guest email for test run', async () => {
      const timestamp = Date.now()
      return `guest+${timestamp}@example.com`
    })
  }

  /**
   * Seeds an order directly via API so the UI test starts at the right state.
   */
  async seedOrder(
    token: string,
    product: { sku: string; price: number },
    quantity = 1
  ): Promise<void> {
    await test.step('Seed order via API to set up UI test precondition', async () => {
      const payload = {
        items: [{ sku: product.sku, quantity, unitPrice: product.price }],
        total: product.price * quantity,
      }
      const response = await this.request.post('/api/orders', {
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok()) throw new Error(`Seed order failed: ${response.status()}`)
    })
  }
}
```

**Rules:**
- Every public method wraps its body in `test.step('...', async () => { ... })`.
- Helper classes contain **no locators** and make **no UI assertions** — that belongs in page objects.
- Helpers may call the `request` fixture to seed or clean up data.
- One helper class per domain (`CheckoutHelper`, `UserHelper`, `ProductHelper`).
- Inject via the `fixtures/base.ts` fixture or instantiate in `test.beforeEach` — never inside a `test()` block.

---

## 5. Playwright Fixtures — Page Injection

Playwright fixtures are the **only** way page objects enter a spec file. Never instantiate page classes manually inside a test.

```typescript
// playwright/fixtures/base.ts

import { test as baseTest, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { CheckoutPage } from '../pages/CheckoutPage'
import { CartPage } from '../pages/CartPage'
import { CheckoutHelper } from '../helpers/CheckoutHelper'

// Declare the shape of all custom fixtures
type CustomFixtures = {
  loginPage: LoginPage
  dashboardPage: DashboardPage
  checkoutPage: CheckoutPage
  cartPage: CartPage
  checkoutHelper: CheckoutHelper
}

export const test = baseTest.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page))
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page))
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page))
  },
  checkoutHelper: async ({ request }, use) => {
    await use(new CheckoutHelper(request))
  },
})

// Always re-export expect so specs import from one place
export { expect }
```

**Specs import `test` and `expect` from `fixtures/base.ts`, never from `@playwright/test` directly.**

```typescript
// ✅ Correct
import { test, expect } from '../../fixtures/base'

// ❌ Wrong — bypasses custom fixtures
import { test, expect } from '@playwright/test'
```

**Rules:**
- Every page class has exactly one fixture entry in `base.ts`.
- Fixtures use the `page` built-in — never create a new browser context inside a fixture unless specifically testing multi-context behaviour.
- Fixtures are composable — a helper fixture can depend on `request`; a page fixture depends on `page`.
- Always `await use(...)` — never return the value directly.

---

## 6. Authentication — storageState Setup Project

Authentication runs **once** in a setup project and saves browser state to disk. Tests reuse that state — they never perform login steps.

```typescript
// playwright/auth.setup.ts

import { test as setup, expect } from '@playwright/test'
import { ROUTES } from './constants'
import users from './data/users.json'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto(ROUTES.LOGIN)
  await page.getByTestId('email-input').fill(users.valid.email)
  await page.getByTestId('password-input').fill(users.valid.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/dashboard/)

  // Save signed-in state — all tests reuse this
  await page.context().storageState({ path: authFile })
})
```

```typescript
// playwright.config.ts (relevant excerpt)

projects: [
  {
    name: 'setup',
    testMatch: '**/auth.setup.ts',
  },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/user.json',
    },
    dependencies: ['setup'],
  },
],
```

**Rules:**
- `playwright/.auth/` must be in `.gitignore` — auth state files contain sensitive cookies.
- Never perform login steps inside a `test()` block or `beforeEach`. Use `storageState`.
- For tests that need a **different user role**, create a separate setup file and a separate project entry (e.g. `admin.setup.ts` → `playwright/.auth/admin.json`).
- For tests that must test the login page itself, use `test.use({ storageState: { cookies: [], origins: [] } })` to start unauthenticated.

---

## 7. Page Object Classes

Page objects encapsulate **locators and UI interactions** for a single page. Every public method wraps its body in `test.step()`.

```typescript
// playwright/pages/LoginPage.ts

import { Page, Locator, expect } from '@playwright/test'
import { test } from '../fixtures/base'
import { BasePage } from './BasePage'
import { ROUTES, ERROR_MESSAGES } from '../constants'

export class LoginPage extends BasePage {
  // Locators are private readonly — never exposed outside the class
  private readonly emailInput: Locator
  private readonly passwordInput: Locator
  private readonly submitButton: Locator
  private readonly errorAlert: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.getByTestId('email-input')
    this.passwordInput = page.getByTestId('password-input')
    this.submitButton = page.getByRole('button', { name: /sign in/i })
    this.errorAlert = page.getByRole('alert')
  }

  // ─── Navigation ──────────────────────────────────────────────────

  async goto(): Promise<void> {
    await test.step('Navigate to login page', async () => {
      await this.page.goto(ROUTES.LOGIN)
    })
  }

  // ─── Actions ─────────────────────────────────────────────────────

  async fillEmail(email: string): Promise<void> {
    await test.step(`Enter email: ${email}`, async () => {
      await this.emailInput.fill(email)
    })
  }

  async fillPassword(password: string): Promise<void> {
    await test.step('Enter password', async () => {
      await this.passwordInput.fill(password)
    })
  }

  async submitForm(): Promise<void> {
    await test.step('Click sign in button', async () => {
      await this.submitButton.click()
    })
  }

  // Compound action — steps always performed together
  async loginWith(email: string, password: string): Promise<void> {
    await test.step(`Login as ${email}`, async () => {
      await this.fillEmail(email)
      await this.fillPassword(password)
      await this.submitForm()
    })
  }

  // ─── Assertions ──────────────────────────────────────────────────

  async expectErrorMessage(text: string): Promise<void> {
    await test.step(`Expect error message: "${text}"`, async () => {
      await expect(this.errorAlert).toBeVisible()
      await expect(this.errorAlert).toContainText(text)
    })
  }

  async expectInvalidCredentialsError(): Promise<void> {
    await this.expectErrorMessage(ERROR_MESSAGES.INVALID_CREDENTIALS)
  }

  async expectToBeVisible(): Promise<void> {
    await test.step('Expect login page to be visible', async () => {
      await expect(this.page).toHaveURL(new RegExp(ROUTES.LOGIN))
      await expect(this.emailInput).toBeVisible()
    })
  }
}
```

```typescript
// playwright/pages/BasePage.ts

import { Page } from '@playwright/test'

export abstract class BasePage {
  constructor(protected readonly page: Page) {}
}
```

**Rules:**
- Every public method wraps its body in `test.step('...', async () => { ... })`.
- Locators are `private readonly` properties defined in the constructor — never inline in methods.
- All locators use Playwright's built-in locators (`getByRole`, `getByTestId`, `getByLabel`) — never raw CSS.
- Assertion methods are prefixed with `expect`.
- Action methods are verb phrases (`fillEmail`, `submitForm`, `clickForgotPassword`).
- Page classes have **no knowledge of other pages**.
- One class per page or major UI component.

---

## 8. Spec File Structure

```typescript
// playwright/tests/auth/login.spec.ts

// Always import from fixtures/base — never from @playwright/test
import { test, expect } from '../../fixtures/base'
import { ROUTES } from '../../constants'
import users from '../../data/users.json'

test.describe('Login', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto()
  })

  test('redirects to dashboard with valid credentials', async ({ loginPage, dashboardPage }) => {
    await loginPage.loginWith(users.valid.email, users.valid.password)
    await dashboardPage.expectToBeVisible()
    await dashboardPage.expectWelcomeMessage(users.valid.name)
  })

  test('shows error message with wrong password', async ({ loginPage }) => {
    await loginPage.loginWith(users.valid.email, users.invalid.password)
    await loginPage.expectInvalidCredentialsError()
    await loginPage.expectToBeVisible()
  })

  test('shows validation error when email is empty', async ({ loginPage }) => {
    await loginPage.fillPassword(users.valid.password)
    await loginPage.submitForm()
    await loginPage.expectErrorMessage('Email is required')
  })
})

// Tests that must start unauthenticated override storageState
test.describe('Login — already authenticated', () => {
  test.use({ storageState: 'playwright/.auth/user.json' })

  test('redirects logged-in user away from login page', async ({ page }) => {
    await page.goto(ROUTES.LOGIN)
    await expect(page).toHaveURL(new RegExp(ROUTES.DASHBOARD))
  })
})
```

**Rules:**
- Import `test` and `expect` from `../../fixtures/base` only.
- Import all test data from `../../data/*.json` — no hardcoded values.
- `beforeEach` contains setup only — never assertions.
- `test()` names are plain English describing observable behaviour.
- Each `test()` tests exactly one thing and is fully independent.
- No raw locator calls in spec files — all selectors go through page objects.
- No `if` statements or business logic in spec files.
- Max 15 lines per `test()` block.

---

## 9. API Tests

```typescript
// playwright/api/auth/login.spec.ts

import { test, expect } from '@playwright/test'
import { HTTP_STATUS } from '../../constants'
import users from '../../data/users.json'

test.describe('POST /auth/login', () => {

  test('returns 200 and token for valid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: users.valid.email, password: users.valid.password },
    })
    const body = await response.json()

    expect(response.status()).toBe(HTTP_STATUS.OK)
    expect(body).toHaveProperty('token')
    expect(typeof body.token).toBe('string')
  })

  test('returns 401 for invalid password', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: users.valid.email, password: users.invalid.password },
    })
    const body = await response.json()

    expect(response.status()).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(body).toHaveProperty('error')
    expect(body.error).not.toMatch(/sql|query|exception|stack/i)
  })

  test('returns 400 when email field is missing', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { password: 'test' },
    })
    expect(response.status()).toBe(HTTP_STATUS.BAD_REQUEST)
  })
})
```

**Rules:**
- Use the built-in `request` fixture — no custom HTTP clients.
- Always assert both status code AND response body.
- All request payloads use data from `data/*.json` — no hardcoded values.
- API spec files may import directly from `@playwright/test` — they don't use page fixtures.

---

## 10. Locators — Priority Order

Always use the **first applicable** option (matches official Playwright priority):

```
1. getByRole()       → page.getByRole('button', { name: /sign in/i })
2. getByTestId()     → page.getByTestId('submit-button')
3. getByLabel()      → page.getByLabel('Email address')
4. getByPlaceholder()→ page.getByPlaceholder('Enter your email')
5. getByText()       → page.getByText('Sign in')
6. CSS (last resort) → page.locator('.submit-btn')  ← avoid
```

If `data-testid` doesn't exist — add it to the component. Don't fall back to CSS.

**Never use:**
- `page.locator(':nth-child(3)')` — positional selectors
- `page.locator('[class*="sc-"]')` — auto-generated class names
- `page.locator('xpath=...')` — XPath
- Long CSS chains: `page.locator('.nav > ul > li:first > a')`

**Chaining and filtering (correct pattern):**

```typescript
// Filter a locator to a specific item before interacting
const product = this.page.getByRole('listitem').filter({ hasText: 'Basic Widget' })
await product.getByRole('button', { name: 'Add to cart' }).click()
```

---

## 11. Waits — Never Arbitrary

Playwright auto-waits on every locator action. Never add manual timeouts.

```typescript
// ✅ Correct — locator auto-waits for element to be visible and enabled
await this.submitButton.click()

// ✅ Correct — wait for a specific network response
const responsePromise = page.waitForResponse('**/api/auth/login')
await loginPage.submitForm()
const response = await responsePromise
expect(response.status()).toBe(200)

// ✅ Correct — wait for navigation
await Promise.all([
  page.waitForURL('**/dashboard'),
  loginPage.submitForm(),
])

// ✅ Correct — assertion retries automatically until timeout
await expect(page.getByRole('alert')).toBeVisible()

// ❌ Never — arbitrary wait
await page.waitForTimeout(2000)
await page.waitForTimeout(500)
```

---

## 12. Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html', { outputFolder: '.qa/results/html' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',       // captures trace on first retry — essential for CI debugging
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Auth setup runs first — saves storageState to playwright/.auth/user.json
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // API tests — no browser, no storageState needed
    {
      name: 'api',
      testDir: './playwright/api',
      use: { baseURL: process.env.API_URL ?? 'http://localhost:3000' },
    },
  ],
})
```

**Rules:**
- `baseURL` always from `process.env` with a localhost fallback.
- `retries` always set — `2` for CI (`process.env.CI`), `0` for local.
- `trace: 'on-first-retry'` always on — without traces, debugging CI failures is painful.
- `screenshot` and `video` set to `'only-on-failure'` / `'retain-on-failure'`.
- All secrets via `process.env` — never hardcoded.
- `forbidOnly: !!process.env.CI` prevents `test.only` from accidentally blocking CI.

---

## 13. What Good Code Looks Like

### Good

```typescript
test('user completes checkout with saved card', async ({
  cartPage,
  checkoutPage,
  checkoutHelper,
}) => {
  await checkoutHelper.seedOrder(token, products.basic)
  await cartPage.goto()
  await cartPage.addItem(products.basic)
  await cartPage.proceedToCheckout()
  await checkoutPage.useSavedCard()
  await checkoutPage.placeOrder()
  await checkoutPage.expectOrderConfirmation()
})
```

### Bad

```typescript
test('test', async ({ page }) => {
  await page.waitForTimeout(1000)
  await page.goto('http://localhost:3000/login')        // hardcoded URL
  await page.fill('#email', 'testuser@example.com')    // hardcoded credential + raw locator
  await page.fill('#pass', 'TestPass123!')             // hardcoded credential + raw locator
  await page.click('button')                           // ambiguous selector
  await page.waitForTimeout(2000)                      // arbitrary wait
  await page.click('.product:first-child button')      // positional + CSS
  // ... 25 more lines
})
```

The bad version: hardcoded URL, hardcoded credentials, meaningless test name, raw locators, arbitrary waits, tests 6 things at once, impossible to maintain.

---

## 14. Pre-Commit Checklist

Before committing any Playwright file, verify:

- [ ] `test` and `expect` imported from `fixtures/base.ts` — not from `@playwright/test`
- [ ] No raw locator calls in spec files — all through page object methods
- [ ] No hardcoded URLs — using `ROUTES` constants or `baseURL`
- [ ] No hardcoded credentials, emails, or test values — all from `data/*.json`
- [ ] No `page.waitForTimeout(N)` anywhere — using auto-waiting locators or `waitForResponse`
- [ ] Every page object method wraps its body in `test.step()`
- [ ] Every helper method wraps its body in `test.step()`
- [ ] Locators are `private readonly` properties defined in the constructor — not inline in methods
- [ ] Auth handled via `storageState` — no login steps in `test()` or `beforeEach`
- [ ] Test names describe observable behaviour in plain English
- [ ] Each `test()` tests one thing and is under 15 lines
- [ ] New page classes registered in `fixtures/base.ts`
- [ ] `playwright/.auth/` is in `.gitignore`
