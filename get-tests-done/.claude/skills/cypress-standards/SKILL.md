---
name : cypress-standards
description : **Read this before writing any Cypress test code.**
This is the law. Every file generated or modified must comply.
model: 

---

## 1. Core Principles

### SOLID Applied to Cypress

| Principle | What it means in Cypress |
|---|---|
| **Single Responsibility** | One custom command per action. One spec file per feature. One `it()` block tests one observable behaviour. |
| **Open/Closed** | Page classes are open for extension, closed for modification. Add new behaviour by creating a new command or extending the page class — never editing shared commands to handle a special case. |
| **Liskov Substitution** | If you have page classes, any subclass must work wherever the base is expected. Don't override methods with incompatible return types. |
| **Interface Segregation** | Don't add commands to `commands.ts` that only one test needs. One-off helpers belong in the spec file or a local helper, not in global commands. |
| **Dependency Inversion** | Tests depend on commands and page abstractions, not on raw `cy.get()` chains. The spec file never calls `cy.get('[data-testid="..."]')` directly. |

### DRY — Never Repeat These

- Selectors → Page Object class or custom command. **Never** inline `cy.get('#submit')` in a spec.
- Login → `cy.login()` custom command only. **Never** repeat `cy.visit('/login'); cy.get(...).type(...)` in a test.
- URLs → Cypress `baseUrl` config + `ROUTES` constants. **Never** write `http://localhost:3000` in a spec.
- Credentials → `Cypress.env()` loaded from `.env.test`. **Never** hardcode in source.
- Repeated assertions → custom commands (`cy.expectErrorMessage()`).
- API calls → `cy.apiRequest()` custom command or `cy.request()` wrappers.

### Clean Code Rules

- **Command names describe behaviour**: `cy.login()`, `cy.addItemToCart()`, `cy.expectCheckoutSuccess()` — not `cy.doStuff()`.
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
│       └── [feature].cy.ts       ← Imports: page, commands, constants only
├── api/                          ← API tests (cy.request based, no browser UI)
│   └── [resource]/
│       └── [resource].cy.ts
├── support/
│   ├── commands.ts               ← Global custom commands (DRY actions)
│   ├── e2e.ts                    ← Global hooks and imports
│   └── pages/                   ← Page Object classes
│       ├── BasePage.ts
│       └── [Feature]Page.ts
├── fixtures/                     ← Static test data (JSON)
│   └── [feature].json
├── constants/                    ← ROUTES, HTTP_STATUS, ERROR_MESSAGES
│   └── index.ts
└── helpers/                      ← Utility functions (data generators, etc)
    └── data.helper.ts
```

**Naming rules:**
- Spec files: `[feature].cy.ts` — lowercase, hyphenated
- Page classes: `[Feature]Page.ts` — PascalCase
- Fixtures: `[feature].json` — lowercase, hyphenated
- Commands: camelCase verb phrases (`loginAsAdmin`, `addItemToCart`)

---

## 3. Custom Commands

All shared, reusable actions live in `cypress/support/commands.ts`. This is the DRY hub.

```typescript
// cypress/support/commands.ts

// ─── Auth ──────────────────────────────────────────────────────────

// Uses cy.session() — login runs once and is cached per [email, password] pair
Cypress.Commands.add('login', (email?: string, password?: string) => {
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
        // Re-login if session is expired
        cy.request({ url: '/api/auth/me', failOnStatusCode: false })
          .its('status')
          .should('eq', 200)
      },
    }
  )
})

// ─── Selectors ─────────────────────────────────────────────────────

// Wraps data-testid lookup — the only place this pattern lives
Cypress.Commands.add('getByTestId', (id: string) =>
  cy.get(`[data-testid="${id}"]`)
)

// Role-based selector wrapper for consistency
Cypress.Commands.add('getByRole', (role: string, options?: { name: string | RegExp }) => {
  const nameAttr = options?.name
    ? `[name="${options.name}"], [aria-label="${options.name}"]`
    : ''
  return cy.get(`[role="${role}"]${nameAttr}`)
})

// ─── API ───────────────────────────────────────────────────────────

// All API calls in tests go through this — never raw cy.request() in specs
Cypress.Commands.add('apiRequest', <T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
) => {
  const apiUrl = Cypress.env('apiUrl')
  return cy.request<T>({
    method,
    url: `${apiUrl}${path}`,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    failOnStatusCode: false,   // always handle status in the test assertion
  })
})

// Get auth token for API tests
Cypress.Commands.add('getAuthToken', (email?: string, password?: string) => {
  const user = email ?? Cypress.env('TEST_USER_EMAIL')
  const pass = password ?? Cypress.env('TEST_USER_PASSWORD')
  return cy
    .request({ method: 'POST', url: `${Cypress.env('apiUrl')}/auth/login`, body: { email: user, password: pass } })
    .its('body.token')
})

// ─── Common Assertions ─────────────────────────────────────────────

// Reusable assertion commands — reduces duplication across specs
Cypress.Commands.add('expectToastMessage', (text: string) => {
  cy.getByRole('alert').should('be.visible').and('contain.text', text)
})

Cypress.Commands.add('expectErrorMessage', (text: string) => {
  cy.getByRole('alert').should('be.visible').and('contain.text', text)
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

### Rules

- Every shared action goes here — **one source of truth**.
- Commands are **verb phrases**: `login`, `addItemToCart`, `expectCheckoutSuccess`.
- Commands do **one thing** — no giant commands that login AND navigate AND assert.
- If a command is only used in one spec, it doesn't belong here. Put it in that spec file.
- Always declare TypeScript types at the bottom. No untyped commands.

---

## 4. Page Object Classes

Cypress doesn't enforce Page Objects but they're essential for DRY selectors at scale.

```typescript
// cypress/support/pages/LoginPage.ts

import { ROUTES, ERROR_MESSAGES } from '../../constants'

// Page classes in Cypress return chainable commands, not async/await
export class LoginPage {
  // ─── Navigation ─────────────────────────────────────────────
  visit() {
    cy.visit(ROUTES.LOGIN)
    return this
  }

  // ─── Actions ────────────────────────────────────────────────
  // Fluent interface — methods return `this` to allow chaining
  fillEmail(email: string) {
    cy.getByTestId('email-input').clear().type(email)
    return this
  }

  fillPassword(password: string) {
    cy.getByTestId('password-input').clear().type(password)
    return this
  }

  submit() {
    cy.getByRole('button', { name: /sign in/i }).click()
    return this
  }

  // Compound action — acceptable, steps always done together
  loginWith(email: string, password: string) {
    return this.fillEmail(email).fillPassword(password).submit()
  }

  clickForgotPassword() {
    cy.getByRole('link', { name: /forgot password/i }).click()
    return this
  }

  // ─── Assertions ─────────────────────────────────────────────
  // Assert methods start with "expect"
  expectErrorMessage(text: string) {
    cy.expectErrorMessage(text)   // delegates to shared command
    return this
  }

  expectInvalidCredentialsError() {
    return this.expectErrorMessage(ERROR_MESSAGES.INVALID_CREDENTIALS)
  }

  expectToBeVisible() {
    cy.url().should('include', ROUTES.LOGIN)
    cy.getByTestId('email-input').should('be.visible')
    return this
  }
}
```

**Fluent interface usage in specs:**

```typescript
const loginPage = new LoginPage()

loginPage
  .visit()
  .fillEmail('wrong@example.com')
  .fillPassword('badpass')
  .submit()
  .expectInvalidCredentialsError()
```

### Rules

- Page methods return `this` for fluent chaining — don't return `cy.chainable` unless necessary.
- Locators (`cy.getByTestId(...)`) live **inside** page methods — never exposed as properties.
- Assertion methods start with `expect`.
- Action methods are verb phrases, not noun phrases.
- One class per page or major UI component.
- Classes don't know about other pages — navigation to another page belongs in the spec or a flow helper.

---

## 5. Spec File Structure

```typescript
// cypress/e2e/auth/login.cy.ts

import { LoginPage } from '../../support/pages/LoginPage'
import { DashboardPage } from '../../support/pages/DashboardPage'
import { ROUTES } from '../../constants'

// Load test data once at the top
const users = require('../../fixtures/users.json')

// ─── Describe = one feature or scenario group ──────────────
describe('Login', () => {
  let loginPage: LoginPage

  // ─── Setup ────────────────────────────────────────────────
  beforeEach(() => {
    loginPage = new LoginPage()
    loginPage.visit()
  })

  // ─── Test names: plain English, describe the behaviour ────
  it('redirects to dashboard with valid credentials', () => {
    const dashboard = new DashboardPage()

    loginPage.loginWith(users.valid.email, users.valid.password)

    dashboard.expectToBeVisible()
    dashboard.expectWelcomeMessage(users.valid.name)
  })

  it('shows error message with wrong password', () => {
    loginPage.loginWith(users.valid.email, 'wrongpassword')

    loginPage.expectInvalidCredentialsError()
    loginPage.expectToBeVisible()   // stayed on login page
  })

  it('shows validation error when email is empty', () => {
    loginPage.fillPassword(users.valid.password).submit()

    loginPage.expectErrorMessage('Email is required')
  })
})

// ─── Separate describe for different auth state ────────────
describe('Login — already authenticated', () => {
  beforeEach(() => {
    cy.login()   // uses shared command — session cached
  })

  it('redirects logged-in user away from login page', () => {
    cy.visit(ROUTES.LOGIN)
    cy.url().should('include', ROUTES.DASHBOARD)
  })
})
```

### Rules

- Import from `../../constants` and `../../fixtures` — not hardcoded values.
- `beforeEach` contains only setup — never assertions.
- `it()` names are plain English: "shows error with wrong password", not "test login error".
- Each `it()` is independent — no shared state between tests.
- `cy.login()` in `beforeEach` for authenticated tests — never inline login steps.
- No business logic in spec files. No `if` statements.

---

## 6. API Tests

```typescript
// cypress/api/auth/login.cy.ts
// Tests HTTP contract directly — no page objects needed

import { HTTP_STATUS, ERROR_MESSAGES } from '../../constants'

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
      password: 'wrong',
    }).then(({ status, body }) => {
      expect(status).to.eq(HTTP_STATUS.UNAUTHORIZED)
      expect(body).to.have.property('error')
      // Error must not leak internals
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

### Rules

- Always use `cy.apiRequest()` — never raw `cy.request()` in spec files.
- Always set `failOnStatusCode: false` in the command (already done in the shared command).
- Assert status code AND response body — never just one.
- Don't assert exact error message text if it might change — assert the shape and absence of sensitive data.

---

## 7. Selectors — Priority Order

Always use the **first applicable** option:

```
1. data-testid        → cy.getByTestId('submit-button')
2. ARIA role          → cy.getByRole('button', { name: /sign in/i })
3. ARIA label         → cy.contains('label', 'Email').next('input')
4. Text content       → cy.contains('Sign in')
5. CSS (last resort)  → cy.get('.submit-btn')  ← avoid
```

**If `data-testid` doesn't exist** — add it to the component. Don't fall back to CSS.

**Never use:**
- `cy.get(':nth-child(3)')` — positional selectors
- `cy.get('[class*="sc-"]')` — auto-generated class names
- `cy.xpath(...)` — XPath
- Long CSS chains: `cy.get('.nav > ul > li:first > a')`

---

## 8. Waits — Never Arbitrary

```typescript
// ✅ Correct — wait for the thing you actually need
cy.intercept('POST', '/api/auth/login').as('loginRequest')
cy.getByTestId('submit-button').click()
cy.wait('@loginRequest')
cy.url().should('include', '/dashboard')

// ✅ Correct — assertion retries automatically
cy.getByRole('alert').should('be.visible').and('contain.text', 'Welcome')

// ✅ Correct — wait for element state
cy.getByTestId('submit-button').should('not.be.disabled')

// ❌ Never — arbitrary wait
cy.wait(2000)
cy.wait(500)
```

**Golden rule:** If a test is flaky, the fix is always a better wait condition — never `cy.wait(N)`.

### Intercepting Network Requests (the right way)

```typescript
// Set up intercept BEFORE the action that triggers it
cy.intercept('POST', '/api/orders').as('createOrder')

// Trigger the action
checkoutPage.placeOrder()

// Wait for the specific request
cy.wait('@createOrder').then(({ request, response }) => {
  expect(response?.statusCode).to.eq(201)
  expect(request.body).to.have.property('items')
})
```

---

## 9. Configuration

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
      runMode: 2,    // CI: retry twice before marking as failed
      openMode: 0,   // Local: no retries — see failures immediately
    },
    env: {
      apiUrl: process.env.API_URL ?? 'http://localhost:3000/api',
      TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
      TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
    },
  },
})
```

### Rules

- `baseUrl` always from `process.env` with a localhost fallback.
- `retries` always set — 2 for CI, 0 for local.
- `video: true` and `screenshotOnRunFailure: true` always on — debugging CI failures without these is painful.
- All secrets via `env:` block loaded from `process.env` — never hardcoded.

---

## 10. What Clean Cypress Code Looks Like

### Good

```typescript
it('user completes checkout with saved card', () => {
  const cart = new CartPage()
  const checkout = new CheckoutPage()

  cy.login()
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
  cy.get('#email').type('testuser@example.com')
  cy.get('#pass').type('TestPass123!')
  cy.get('button').click()
  cy.wait(2000)
  cy.get('.product:first').find('button').click()
  cy.wait(500)
  cy.get('[data-v-3e818d24]').click()
  cy.get('input[name="cc"]').type('4242424242424242')
  // ... 25 more lines
})
```

The bad version: hardcoded URL, hardcoded credentials, meaningless test name, raw selectors, arbitrary waits, does 6 things in one test, impossible to maintain.

---

## 11. Quick Reference Checklist

Before committing any Cypress file, verify:

- [ ] No `cy.get()` calls in spec files — all in page objects or commands
- [ ] No `cy.visit()` with hardcoded URLs — using `ROUTES` constants or baseUrl
- [ ] No hardcoded credentials — using `Cypress.env()`
- [ ] No `cy.wait(N)` anywhere — using intercepts or assertion retries
- [ ] `cy.login()` used for auth, not repeated login steps
- [ ] Test names describe observable behaviour in plain English
- [ ] Each `it()` tests one thing
- [ ] Page object methods are named as verb phrases and return `this`
- [ ] New commands are typed in the `declare global` block
- [ ] `failOnStatusCode: false` set in `cy.apiRequest()` (in the command, not the spec)
