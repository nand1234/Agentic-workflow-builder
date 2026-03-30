---
name: playwright-test-standards
description: Read before writing any Playwright test code. Use this skill
  whenever generating, modifying, or reviewing Playwright spec files, page
  objects, fixtures, or playwright.config.ts. Covers folder structure, Page
  Object Model, selectors, waits, API tests, and clean code standards.
---

# Playwright Test Standards

## 1. Core Principles

### SOLID Applied to Tests

| Principle | What it means in Playwright |
|---|---|
| **Single Responsibility** | One page object per page/component. One spec file per feature. One `test()` block tests one behaviour — not three. |
| **Open/Closed** | `BasePage` is open for extension, closed for modification. Add a new page by extending `BasePage`, never by editing it. |
| **Liskov Substitution** | Any page object extending `BasePage` must be usable wherever `BasePage` is expected. Don't override base methods with incompatible behaviour. |
| **Interface Segregation** | Don't add methods to a page object that only one test needs. If a helper is only used once, it lives in the test file, not the shared page object. |
| **Dependency Inversion** | Tests depend on page object abstractions, not on raw Playwright `page` calls. The spec file never calls `page.locator()` directly. |

### DRY — Never Repeat These

- Selectors → Page Object only. **Never** inline `page.locator('#submit-btn')` in a spec file.
- Login → `auth.fixture.ts` only. **Never** repeat login steps in `beforeEach`.
- URLs → `env.ts` `baseUrl` only. **Never** write `http://localhost:3000` in a spec.
- Credentials → `.env.test` only. **Never** hardcode emails/passwords in source.
- Repeated assertions → custom `expect` helper or page object method.
- API calls in tests → `ApiHelper` class only.

### Clean Code Rules

- **Names describe behaviour**, not implementation: `expectLoginErrorVisible()` not `checkDiv()`.
- **No comments explaining *what* the code does** — the code should be self-explanatory. Comments only explain *why* something non-obvious is done.
- **Max 5 lines per test action block** — if a test step is longer, extract it to the page object.
- **Max 10 `expect()` calls per test** — if you need more, you're testing too many things at once.
- **No nested `test.describe` deeper than 2 levels.**
- **No `any` type** — always type page object methods and fixture return values.

---

## 2. File & Folder Conventions

```
tests/
├── e2e/                    ← One folder per feature
│   └── [feature]/
│       └── [feature].spec.ts       ← Only imports: fixtures, page objects, constants
├── api/                    ← API tests, no browser context
│   └── [resource]/
│       └── [resource].spec.ts
├── pages/                  ← Page Objects
│   ├── BasePage.ts         ← Abstract base — extend, never modify
│   └── [Feature]Page.ts   ← One file per page or major component
├── fixtures/
│   ├── index.ts            ← Single export point
│   └── auth.fixture.ts     ← Pre-authenticated contexts
├── helpers/
│   ├── api.helper.ts       ← All HTTP interactions
│   └── data.helper.ts      ← Test data generators
├── data/
│   └── [feature].json      ← Static test data (or .ts for typed data)
├── constants/
│   └── index.ts            ← ROUTES, HTTP_STATUS, ERROR_MESSAGES
└── config/
    └── env.ts              ← All process.env access — nowhere else
```

**Naming rules:**
- Spec files: `[feature].spec.ts` — lowercase, hyphenated
- Page objects: `[Feature]Page.ts` — PascalCase
- Fixtures: `[name].fixture.ts`
- Helpers: `[name].helper.ts`
- Test data: `[feature].json` or `[feature].data.ts`

---

## 3. Page Object Model

### The Pattern

```typescript
// tests/pages/LoginPage.ts

import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { ROUTES, ERROR_MESSAGES } from '../constants'

export class LoginPage extends BasePage {
  // ─── Locators ─────────────────────────────────────────────
  // Grouped at the top. One property per element. Prefer:
  //   1. data-testid
  //   2. role + name
  //   3. label
  //   4. text (last resort)
  private readonly emailInput: Locator
  private readonly passwordInput: Locator
  private readonly submitButton: Locator
  private readonly errorMessage: Locator
  private readonly forgotPasswordLink: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput       = page.getByTestId('email-input')
    this.passwordInput    = page.getByTestId('password-input')
    this.submitButton     = page.getByRole('button', { name: /sign in/i })
    this.errorMessage     = page.getByRole('alert')
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })
  }

  // ─── Navigation ───────────────────────────────────────────
  async goto() {
    await this.navigate(ROUTES.LOGIN)
  }

  // ─── Actions ──────────────────────────────────────────────
  // Actions are verb phrases. They do one thing.
  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  // Compound action — acceptable when always done together
  async loginWith(email: string, password: string) {
    await this.fillCredentials(email, password)
    await this.submit()
  }

  // ─── Assertions ───────────────────────────────────────────
  // Assertion methods start with "expect". They are self-contained.
  async expectErrorMessage(text: string) {
    await expect(this.errorMessage).toBeVisible()
    await expect(this.errorMessage).toContainText(text)
  }

  async expectEmailValidationError() {
    await this.expectErrorMessage(ERROR_MESSAGES.INVALID_EMAIL)
  }

  async expectToBeOnLoginPage() {
    await this.expectUrl(ROUTES.LOGIN)
  }
}
```

### Rules

- **Locators are `private`** — spec files never access them directly.
- **Actions are `async`** and always `await` every Playwright call.
- **No `expect()` inside action methods** — actions do, assertions verify.
- **No test logic in page objects** — they don't know about test scenarios.
- **One page object per page or major component** — not one per test file.
- **Compound actions are acceptable** if the steps are always sequential (e.g. `loginWith` = fill + submit).

### What NOT to do

```typescript
// ❌ Selector inline in spec file
await page.locator('#email').fill('user@test.com')

// ❌ Raw locator string repeated in two places
const btn = page.locator('button[type="submit"]') // in spec
// ... same string in page object

// ❌ Test logic in page object
async loginAndAssertDashboard() {  // page objects don't assert business outcomes
  await this.loginWith(email, pass)
  await expect(this.page).toHaveURL('/dashboard') // belongs in the test
}

// ❌ Giant page object with 40 methods — split it
```

---

## 4. Spec File Structure

```typescript
// tests/e2e/auth/login.spec.ts

import { test, expect } from '../../fixtures'          // always from fixtures, not @playwright/test
import { LoginPage } from '../../pages/LoginPage'
import { DashboardPage } from '../../pages/DashboardPage'
import testData from '../../data/auth.json'
import { ROUTES, ERROR_MESSAGES } from '../../constants'

// ─── Describe block = one feature or scenario group ───────
test.describe('Login', () => {
  let loginPage: LoginPage

  // ─── Setup ────────────────────────────────────────────────
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  // ─── Tests ────────────────────────────────────────────────
  // Test name = plain English describing the behaviour
  // Format: "[subject] [verb] [outcome]"
  test('valid credentials redirect to dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page)

    await loginPage.loginWith(testData.validUser.email, testData.validUser.password)

    await dashboard.expectToBeOnDashboard()
    await dashboard.expectWelcomeMessage(testData.validUser.name)
  })

  test('invalid password shows error message', async () => {
    await loginPage.loginWith(testData.validUser.email, 'wrongpassword')

    await loginPage.expectErrorMessage(ERROR_MESSAGES.INVALID_CREDENTIALS)
    await loginPage.expectToBeOnLoginPage()
  })

  test('empty email shows validation error', async () => {
    await loginPage.submit()  // submit without filling

    await loginPage.expectEmailValidationError()
  })
})

// ─── Separate describe for authenticated scenarios ─────────
test.describe('Login — authenticated user', () => {
  test('already logged in user is redirected to dashboard', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage)

    await authenticatedPage.goto(ROUTES.LOGIN)

    await dashboard.expectToBeOnDashboard()  // should redirect, not show login
  })
})
```

### Rules

- Import `test` and `expect` from `../../fixtures` — **not** from `@playwright/test`.
- One `test.describe` per scenario group — don't mix authenticated and unauthenticated in one block.
- Test names are plain English sentences describing observable behaviour.
- `beforeEach` only contains setup — never assertions.
- `afterEach` only for cleanup — never for assertions.
- No business logic in spec files. If you're writing an `if` statement in a test, something is wrong.
- Each `test()` is independent — never depends on state from a previous test.

---

## 5. Fixtures

```typescript
// tests/fixtures/auth.fixture.ts
// Purpose: eliminate repeated login setup across tests

import { test as base, Page, BrowserContext } from '@playwright/test'
import { env } from '../config/env'
import { LoginPage } from '../pages/LoginPage'

type AuthFixtures = {
  authenticatedPage: Page       // standard user, pre-logged-in
  adminPage: Page               // admin user, pre-logged-in
  authContext: BrowserContext   // raw context if you need a fresh page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loginPage = new LoginPage(page)     // use page object, not raw calls

    await loginPage.goto()
    await loginPage.loginWith(env.testUserEmail, env.testUserPassword)
    await page.waitForURL('**/dashboard')

    await use(page)
    await context.close()
  },

  adminPage: async ({ browser }, use) => {
    // Same pattern for admin
    const context = await browser.newContext()
    const page = await context.newPage()
    const loginPage = new LoginPage(page)

    await loginPage.goto()
    await loginPage.loginWith(env.adminUserEmail!, env.adminUserPassword!)
    await page.waitForURL('**/admin')

    await use(page)
    await context.close()
  },

  authContext: async ({ browser }, use) => {
    const context = await browser.newContext()
    await use(context)
    await context.close()
  },
})

export { expect } from '@playwright/test'
```

### Rules

- Fixtures handle **cross-cutting concerns** — auth state, test data seeding, cleanup.
- Never put test assertions in a fixture.
- Always close contexts in the cleanup phase (after `use()`).
- Use `storageState` for session persistence if login is slow — save once, reuse.

---

## 6. API Tests

```typescript
// tests/api/auth/login.spec.ts
// API tests: no browser, test HTTP contract directly

import { test, expect } from '@playwright/test'   // no auth fixture needed for most API tests
import { ApiHelper } from '../../helpers/api.helper'
import testData from '../../data/auth.json'
import { HTTP_STATUS } from '../../constants'

test.describe('POST /api/auth/login', () => {
  let api: ApiHelper

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request)
  })

  test('returns 200 and token for valid credentials', async () => {
    const { status, body } = await api.post<{ token: string }>(
      '/auth/login',
      { email: testData.validUser.email, password: testData.validUser.password }
    )

    expect(status).toBe(HTTP_STATUS.OK)
    expect(body.token).toBeDefined()
    expect(typeof body.token).toBe('string')
  })

  test('returns 401 for invalid password', async () => {
    const { status, body } = await api.post<{ error: string }>(
      '/auth/login',
      { email: testData.validUser.email, password: 'wrong' }
    )

    expect(status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(body.error).toBeDefined()
    // Assert error message doesn't leak internals
    expect(body.error).not.toMatch(/sql|query|exception|stack/i)
  })

  test('returns 400 for missing email field', async () => {
    const { status } = await api.post('/auth/login', { password: 'test' })

    expect(status).toBe(HTTP_STATUS.BAD_REQUEST)
  })
})
```

### Rules

- API tests use `request` fixture directly — no browser launched.
- Always assert **both** status code AND response body shape.
- Assert that error responses don't leak stack traces or SQL.
- Test one contract per `test()` — status, then body, not mixed.

---

## 7. Test Data

**JSON format (default):**

```json
// tests/data/auth.json
{
  "validUser": {
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  },
  "lockedUser": {
    "email": "locked@example.com",
    "password": "TestPass123!"
  },
  "invalidUser": {
    "email": "notexist@example.com",
    "password": "WrongPass123!"
  }
}
```

**TypeScript format (when type safety matters):**

```typescript
// tests/data/auth.data.ts
export interface User {
  email: string
  password: string
  name?: string
}

export const authData = {
  validUser: {
    email: 'testuser@example.com',
    password: 'TestPass123!',
    name: 'Test User',
  } satisfies User,

  lockedUser: {
    email: 'locked@example.com',
    password: 'TestPass123!',
  } satisfies User,
} as const
```

### Rules

- Test data files are **static** — no generated UUIDs at the top level.
- Use `data.helper.ts` for dynamic data generation (random emails, etc).
- Credentials in data files reference **test accounts that must exist in the test DB**.
- Never use production data in test fixtures — even anonymised.

---

## 8. Selectors — Priority Order

Always use the **first applicable** option. Never skip down to a lower option if a better one exists.

```
1. data-testid        → page.getByTestId('submit-button')
2. ARIA role + name   → page.getByRole('button', { name: /sign in/i })
3. ARIA label         → page.getByLabel('Email address')
4. Placeholder        → page.getByPlaceholder('Enter your email')
5. Text content       → page.getByText('Sign in')
6. CSS (last resort)  → page.locator('.submit-btn')  ← avoid
```

**If `data-testid` doesn't exist** — add it to the component. Don't fall back to CSS.

**Never use:**
- `nth-child` selectors
- XPath
- Class names that look auto-generated (`.sc-bdXxxt`, `.css-1ab2cd`)
- IDs that look auto-generated

---

## 9. Waits — Explicit Only

```typescript
// ✅ Correct — explicit condition
await expect(page.getByRole('alert')).toBeVisible()
await page.waitForURL('**/dashboard')
await page.waitForResponse('**/api/auth/login')
await expect(submitButton).toBeEnabled()

// ❌ Never — arbitrary timeout
await page.waitForTimeout(2000)
await new Promise(resolve => setTimeout(resolve, 1000))
```

**If a test is flaky** — fix the wait condition, never add a sleep.

---

## 10. What Clean Test Code Looks Like

### Good

```typescript
test('checkout completes successfully with valid card', async ({ authenticatedPage }) => {
  const cart = new CartPage(authenticatedPage)
  const checkout = new CheckoutPage(authenticatedPage)

  await cart.goto()
  await cart.addItem(testData.products.basic)
  await cart.proceedToCheckout()

  await checkout.fillCard(testData.cards.valid)
  await checkout.placeOrder()

  await checkout.expectOrderConfirmation()
  await checkout.expectConfirmationEmailSent(testData.validUser.email)
})
```

### Bad

```typescript
test('test checkout', async ({ page }) => {
  // login
  await page.goto('http://localhost:3000/login')
  await page.locator('#email').fill('testuser@example.com')
  await page.locator('#password').fill('TestPass123!')
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(2000)

  // go to cart
  await page.goto('http://localhost:3000/cart')
  await page.locator('.add-to-cart-btn').first().click()
  await page.waitForTimeout(1000)

  // checkout
  await page.locator('[data-v-1234=""]').fill('4242424242424242')
  // ... 30 more lines
})
```

The bad version: hardcoded URL, hardcoded credentials, raw CSS selectors, arbitrary timeouts, no page objects, tests multiple unrelated things, impossible to maintain.

---

## 11. Quick Reference Checklist

Before committing any test file, verify:

- [ ] Spec imports `test` from `../../fixtures`, not `@playwright/test`
- [ ] No selectors in the spec file — all in page objects
- [ ] No login steps in the spec file — using auth fixture
- [ ] No hardcoded URLs — using `ROUTES` constants or `baseURL`
- [ ] No hardcoded credentials — using `testData` or `env`
- [ ] No `waitForTimeout` calls
- [ ] Test names are plain English sentences
- [ ] Each `test()` tests one behaviour
- [ ] Page object methods are named as verb phrases
- [ ] No `any` types
- [ ] No nested describes deeper than 2 levels
