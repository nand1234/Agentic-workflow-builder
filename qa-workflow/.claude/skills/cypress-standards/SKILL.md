---
name: cypress-standards
description: Read this before writing any Cypress test code. Use this skill
  whenever generating, modifying, or reviewing Cypress spec files, page objects,
  custom commands, helper classes, fixtures, or cypress.config.ts. Enforces
  Page Object Model, centralised JSON test data, helper classes with step()
  annotations, and shared custom commands for cross-page logic. Always trigger
  this skill for any Cypress-related task, even if the user only asks for a
  single test or a small change.
---

# Cypress Test Standards

Every file generated or modified must comply with these standards. No exceptions.

---

## 1. Core Principles

### SOLID Applied to Cypress

| Principle | What it means in Cypress |
|---|---|
| **Single Responsibility** | One custom command per action. One spec file per feature. One `it()` block tests one observable behaviour. |
| **Open/Closed** | Page classes are open for extension, closed for modification. Add new behaviour by creating a new command or extending the page class — never editing shared commands to handle a special case. |
| **Liskov Substitution** | Any page subclass must work wherever the base is expected. Don't override methods with incompatible return types. |
| **Interface Segregation** | Don't add commands to `commands.ts` that only one test needs. One-off helpers belong in the spec file or a local helper, not in global commands. |
| **Dependency Inversion** | Tests depend on commands and page abstractions, not on raw `cy.get()` chains. Spec files never call `cy.get('[data-testid="..."]')` directly. |

### DRY — Never Repeat These

- **Selectors** → Page Object class or custom command. Never inline `cy.get('#submit')` in a spec.
- **Login** → `cy.login()` custom command only. Never repeat `cy.visit('/login'); cy.get(...).type(...)` in a test.
- **URLs** → `ROUTES` constants + Cypress `baseUrl`. Never write `http://localhost:3000` in a spec.
- **Credentials** → `Cypress.env()` loaded from `.env.test`. Never hardcode in source.
- **Test data** → JSON fixture files only. Never hardcode names, emails, or values in specs.
- **Repeated assertions** → custom commands (`cy.expectErrorMessage()`).
- **API calls** → `cy.apiRequest()` custom command.

### Clean Code Rules

- **Command names describe behaviour**: `cy.login()`, `cy.addItemToCart()`, `cy.expectCheckoutSuccess()`.
- **No comments explaining *what* the code does** — it should be self-explanatory. Comments only explain *why* a non-obvious thing is done.
- **Max 15 lines per `it()` block** — if longer, extract actions to commands or page methods.
- **No `cy.wait(N)` anywhere** — use `cy.intercept().wait()` or assertions instead.
- **No `cy.get()` in spec files** — always go through a page object method or custom command.
- **No nested `describe` deeper than 2 levels.**

---

## 2. File & Folder Conventions

```
cypress/
├── e2e/                          ← One folder per feature
│   └── [feature]/
│       └── [feature].cy.ts
├── api/                          ← API tests (cy.request based, no UI)
│   └── [resource]/
│       └── [resource].cy.ts
├── support/
│   ├── commands.ts               ← Global custom commands (cross-page, DRY actions)
│   ├── e2e.ts                    ← Global hooks and imports
│   └── pages/                   ← Page Object classes
│       ├── BasePage.ts
│       └── [Feature]Page.ts
├── helpers/                      ← Helper classes with business logic
│   └── [Feature]Helper.ts
├── fixtures/                     ← ALL test data lives here as JSON
│   └── [feature].json
└── constants/                    ← ROUTES, HTTP_STATUS, ERROR_MESSAGES
    └── index.ts
```

**Naming rules:**
- Spec files: `[feature].cy.ts` — lowercase, hyphenated
- Page classes: `[Feature]Page.ts` — PascalCase
- Helper classes: `[Feature]Helper.ts` — PascalCase
- Fixtures: `[feature].json` — lowercase, hyphenated
- Commands: camelCase verb phrases (`loginAsAdmin`, `addItemToCart`)

---

## 3. Test Data — Centralised in JSON Fixtures

**All test data lives in `cypress/fixtures/`**. No hardcoded strings, emails, names, or values anywhere in specs, page objects, or helpers.

```json
// cypress/fixtures/users.json
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
// cypress/fixtures/products.json
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

**Loading fixtures in specs:**

```typescript
// Load at the top of the spec — never inline
const users = require('../../fixtures/users.json')
const products = require('../../fixtures/products.json')

it('logs in with valid credentials', () => {
  loginPage.loginWith(users.valid.email, users.valid.password)
})
```

**Rules:**
- One fixture file per domain (`users.json`, `products.json`, `orders.json`).
- Never duplicate data across fixture files — reference a single source.
- Fixture values must not be reassigned or mutated in tests.
- If a test needs unique data per run (e.g. unique email), generate it in a helper — never hardcode a timestamp in the spec.

---

## 4. Helper Classes

Helper classes contain **business logic, data generation, and multi-step utilities** that don't belong in page objects or commands. Every public method must use `cy.step()` to describe what it is doing.

```typescript
// cypress/helpers/CheckoutHelper.ts

export class CheckoutHelper {

  /**
   * Generates a unique guest email to avoid conflicts across test runs.
   */
  generateGuestEmail(): string {
    cy.step('Generate unique guest email for test run')
    const timestamp = Date.now()
    return `guest+${timestamp}@example.com`
  }

  /**
   * Builds an order payload from fixture data.
   * Use when seeding an order via API before a UI test.
   */
  buildOrderPayload(product: { sku: string; price: number }, quantity: number) {
    cy.step('Build order payload from product fixture data')
    return {
      items: [{ sku: product.sku, quantity, unitPrice: product.price }],
      total: product.price * quantity,
    }
  }

  /**
   * Seeds an order directly via API so the UI test starts at the right state.
   */
  seedOrder(token: string, product: { sku: string; price: number }, quantity = 1) {
    cy.step('Seed order via API to set up UI test precondition')
    const payload = this.buildOrderPayload(product, quantity)
    cy.apiRequest('POST', '/orders', payload, token)
      .its('status')
      .should('eq', 201)
  }
}
```

**Rules:**
- Every public method starts with `cy.step('...')` — plain English description of what the step does.
- Helper classes contain **no selectors** and make **no UI assertions** — that belongs in page objects.
- Helpers may call `cy.apiRequest()` to seed or clean up data.
- One helper class per domain (`CheckoutHelper`, `UserHelper`, `ProductHelper`).
- Instantiate in `beforeEach` or at the top of the `describe` block, not inside `it()`.

---

## 5. Custom Commands — Cross-Page Shared Logic

`cypress/support/commands.ts` is the home for **any action or assertion used across more than one page or spec**. If it's used in only one place, it does not belong here.

```typescript
// cypress/support/commands.ts

// ─── Auth ──────────────────────────────────────────────────────────

Cypress.Commands.add('login', (email?: string, password?: string) => {
  cy.step('Login via session cache')
  const user = email ?? Cypress.env('TEST_USER_EMAIL')
  const pass = password ?? Cypress.env('TEST_USER_PASSWORD')

  cy.session(
    [user, pass],
    () => {
      cy.visit('/login')
      cy.getByTestId('email-input').type(user)
      cy.getByTestId('password-input').type(pass)
      cy.getByRole('button', { name: /sign in/i }).click()
      cy.url().should('include', '/dashboard')
    },
    {
      validate: () => {
        cy.request({ url: '/api/auth/me', failOnStatusCode: false })
          .its('status')
          .should('eq', 200)
      },
    }
  )
})

// ─── Selectors ─────────────────────────────────────────────────────

Cypress.Commands.add('getByTestId', (id: string) =>
  cy.get(`[data-testid="${id}"]`)
)

Cypress.Commands.add('getByRole', (role: string, options?: { name: string | RegExp }) =>
  cy.get(`[role="${role}"]`).contains(options?.name ?? '')
)

// ─── API ───────────────────────────────────────────────────────────

Cypress.Commands.add('apiRequest', <T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
) => {
  cy.step(`API ${method} ${path}`)
  return cy.request<T>({
    method,
    url: `${Cypress.env('apiUrl')}${path}`,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('getAuthToken', (email?: string, password?: string) => {
  cy.step('Get auth token via API')
  const user = email ?? Cypress.env('TEST_USER_EMAIL')
  const pass = password ?? Cypress.env('TEST_USER_PASSWORD')
  return cy
    .request({ method: 'POST', url: `${Cypress.env('apiUrl')}/auth/login`, body: { email: user, password: pass } })
    .its('body.token')
})

// ─── Common Assertions ─────────────────────────────────────────────

Cypress.Commands.add('expectToastMessage', (text: string) => {
  cy.step(`Expect toast message: "${text}"`)
  cy.get('[role="alert"]').should('be.visible').and('contain.text', text)
})

Cypress.Commands.add('expectErrorMessage', (text: string) => {
  cy.step(`Expect error message: "${text}"`)
  cy.get('[role="alert"]').should('be.visible').and('contain.text', text)
})

// ─── Type declarations ─────────────────────────────────────────────

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      getByTestId(id: string): Chainable<JQuery<HTMLElement>>
      getByRole(role: string, options?: { name: string | RegExp }): Chainable<JQuery<HTMLElement>>
      apiRequest<T>(method: string, path: string, body?: unknown, token?: string): Chainable<Response<T>>
      getAuthToken(email?: string, password?: string): Chainable<string>
      expectToastMessage(text: string): Chainable<void>
      expectErrorMessage(text: string): Chainable<void>
    }
  }
}
```

**Rules:**
- Commands are for **cross-page, cross-spec** shared logic only.
- Every command uses `cy.step()` to describe what it does.
- Commands do **one thing** — no giant commands that login AND navigate AND assert.
- Always declare TypeScript types at the bottom. No untyped commands.
- `failOnStatusCode: false` is set inside `cy.apiRequest()` — never in the spec.

---

## 6. Page Object Classes

Page objects encapsulate **selectors and UI interactions** for a single page or major component. Every public method uses `cy.step()`.

```typescript
// cypress/support/pages/LoginPage.ts

import { ROUTES, ERROR_MESSAGES } from '../../constants'

export class LoginPage {

  visit() {
    cy.step('Navigate to login page')
    cy.visit(ROUTES.LOGIN)
    return this
  }

  fillEmail(email: string) {
    cy.step(`Enter email: ${email}`)
    cy.getByTestId('email-input').clear().type(email)
    return this
  }

  fillPassword(password: string) {
    cy.step('Enter password')
    cy.getByTestId('password-input').clear().type(password)
    return this
  }

  submit() {
    cy.step('Click sign in button')
    cy.getByRole('button', { name: /sign in/i }).click()
    return this
  }

  // Compound action — steps always done together
  loginWith(email: string, password: string) {
    return this.fillEmail(email).fillPassword(password).submit()
  }

  clickForgotPassword() {
    cy.step('Click forgot password link')
    cy.getByRole('link', { name: /forgot password/i }).click()
    return this
  }

  // ─── Assertions ─────────────────────────────────────────────

  expectErrorMessage(text: string) {
    cy.step(`Expect error message: "${text}"`)
    cy.expectErrorMessage(text)
    return this
  }

  expectInvalidCredentialsError() {
    return this.expectErrorMessage(ERROR_MESSAGES.INVALID_CREDENTIALS)
  }

  expectToBeVisible() {
    cy.step('Expect login page to be visible')
    cy.url().should('include', ROUTES.LOGIN)
    cy.getByTestId('email-input').should('be.visible')
    return this
  }
}
```

**Rules:**
- Every public method starts with `cy.step('...')`.
- Methods return `this` for fluent chaining.
- Locators live **inside** page methods — never exposed as properties.
- Assertion methods are prefixed with `expect`.
- Action methods are verb phrases (`fillEmail`, `submit`, `clickForgotPassword`).
- Page classes have **no knowledge of other pages**.
- One class per page or major UI component.

---

## 7. Spec File Structure

```typescript
// cypress/e2e/auth/login.cy.ts

import { LoginPage } from '../../support/pages/LoginPage'
import { DashboardPage } from '../../support/pages/DashboardPage'
import { ROUTES } from '../../constants'

// All test data from fixtures — never hardcoded
const users = require('../../fixtures/users.json')

describe('Login', () => {
  let loginPage: LoginPage

  beforeEach(() => {
    loginPage = new LoginPage()
    loginPage.visit()
  })

  it('redirects to dashboard with valid credentials', () => {
    const dashboard = new DashboardPage()
    loginPage.loginWith(users.valid.email, users.valid.password)
    dashboard.expectToBeVisible()
    dashboard.expectWelcomeMessage(users.valid.name)
  })

  it('shows error message with wrong password', () => {
    loginPage.loginWith(users.valid.email, users.invalid.password)
    loginPage.expectInvalidCredentialsError()
    loginPage.expectToBeVisible()
  })

  it('shows validation error when email is empty', () => {
    loginPage.fillPassword(users.valid.password).submit()
    loginPage.expectErrorMessage('Email is required')
  })
})

describe('Login — already authenticated', () => {
  beforeEach(() => {
    cy.login()
  })

  it('redirects logged-in user away from login page', () => {
    cy.visit(ROUTES.LOGIN)
    cy.url().should('include', ROUTES.DASHBOARD)
  })
})
```

**Rules:**
- Import from `../../constants` and `../../fixtures` only — no hardcoded values.
- `beforeEach` contains setup only — never assertions.
- `it()` names are plain English describing observable behaviour.
- Each `it()` tests exactly one thing and is independent.
- No `cy.get()` calls in spec files — all selectors go through page objects or commands.
- No `if` statements or business logic in spec files.
- Max 15 lines per `it()` block.

---

## 8. API Tests

```typescript
// cypress/api/auth/login.cy.ts

import { HTTP_STATUS } from '../../constants'

const users = require('../../fixtures/users.json')

describe('POST /auth/login', () => {
  it('returns 200 and token for valid credentials', () => {
    cy.apiRequest('POST', '/auth/login', {
      email: users.valid.email,
      password: users.valid.password,
    }).then(({ status, body }) => {
      expect(status).to.eq(HTTP_STATUS.OK)
      expect(body).to.have.property('token')
      expect(body.token).to.be.a('string')
    })
  })

  it('returns 401 for invalid password', () => {
    cy.apiRequest('POST', '/auth/login', {
      email: users.valid.email,
      password: users.invalid.password,
    }).then(({ status, body }) => {
      expect(status).to.eq(HTTP_STATUS.UNAUTHORIZED)
      expect(body).to.have.property('error')
      expect(body.error).to.not.match(/sql|query|exception|stack/i)
    })
  })

  it('returns 400 when email field is missing', () => {
    cy.apiRequest('POST', '/auth/login', { password: 'test' })
      .its('status')
      .should('eq', HTTP_STATUS.BAD_REQUEST)
  })
})
```

**Rules:**
- Always use `cy.apiRequest()` — never raw `cy.request()` in spec files.
- Assert both status code AND response body.
- All request payloads use fixture data — no hardcoded values.

---

## 9. Selectors — Priority Order

Always use the **first applicable** option:

```
1. data-testid   → cy.getByTestId('submit-button')
2. ARIA role     → cy.getByRole('button', { name: /sign in/i })
3. ARIA label    → cy.contains('label', 'Email').next('input')
4. Text content  → cy.contains('Sign in')
5. CSS           → cy.get('.submit-btn')  ← last resort, avoid
```

If `data-testid` doesn't exist — add it to the component. Don't fall back to CSS.

**Never use:**
- `cy.get(':nth-child(3)')` — positional selectors
- `cy.get('[class*="sc-"]')` — auto-generated class names
- Long CSS chains: `cy.get('.nav > ul > li:first > a')`

---

## 10. Waits — Never Arbitrary

```typescript
// ✅ Wait for the specific network request
cy.intercept('POST', '/api/auth/login').as('loginRequest')
cy.getByTestId('submit-button').click()
cy.wait('@loginRequest')
cy.url().should('include', '/dashboard')

// ✅ Assertion retries automatically
cy.get('[role="alert"]').should('be.visible').and('contain.text', 'Welcome')

// ✅ Wait for element state
cy.getByTestId('submit-button').should('not.be.disabled')

// ❌ Never
cy.wait(2000)
cy.wait(500)
```

---

## 11. Configuration

```typescript
// cypress.config.ts

import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
    specPattern: ['cypress/e2e/**/*.cy.ts', 'cypress/api/**/*.cy.ts'],
    supportFile: 'cypress/support/e2e.ts',
    videosFolder: '.qa/results/videos',
    screenshotsFolder: '.qa/results/screenshots',
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10_000,
    requestTimeout: 15_000,
    responseTimeout: 15_000,
    viewportWidth: 1280,
    viewportHeight: 720,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      apiUrl: process.env.API_URL ?? 'http://localhost:3000/api',
      TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
      TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
    },
  },
})
```

---

## 12. What Good Code Looks Like

### Good

```typescript
it('user completes checkout with saved card', () => {
  const cart = new CartPage()
  const checkout = new CheckoutPage()
  const helper = new CheckoutHelper()

  cy.login()
  helper.seedOrder(token, products.basic)
  cart.visit().addItem(products.basic).proceedToCheckout()
  checkout.useSavedCard().placeOrder()
  checkout.expectOrderConfirmation()
})
```

### Bad

```typescript
it('test', () => {
  cy.wait(1000)
  cy.visit('http://localhost:3000/login')
  cy.get('#email').type('testuser@example.com')   // hardcoded credential
  cy.get('#pass').type('TestPass123!')             // hardcoded credential
  cy.get('button').click()
  cy.wait(2000)                                    // arbitrary wait
  cy.get('.product:first').find('button').click()  // positional + CSS selector
})
```

---

## 13. Pre-Commit Checklist

Before committing any Cypress file, verify:

- [ ] No `cy.get()` calls in spec files — all through page objects or commands
- [ ] No hardcoded URLs — using `ROUTES` constants or `baseUrl`
- [ ] No hardcoded credentials, emails, or test values — all from `fixtures/*.json`
- [ ] No `cy.wait(N)` anywhere — using intercepts or assertion retries
- [ ] Every page object method and helper method starts with `cy.step()`
- [ ] Every custom command starts with `cy.step()`
- [ ] Custom commands are cross-page — one-off logic stays in the spec or helper
- [ ] `cy.login()` used for auth — never inline login steps
- [ ] Test names describe observable behaviour in plain English
- [ ] Each `it()` tests one thing and is under 15 lines
- [ ] New commands are typed in the `declare global` block
- [ ] `failOnStatusCode: false` set inside `cy.apiRequest()`, not in the spec
