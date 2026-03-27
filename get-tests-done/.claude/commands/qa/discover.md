# qa:discover

Scan the codebase for existing test frameworks. If none found, scaffold a production-ready framework using the user's chosen tool. Always follows DRY principles and framework best practices. Creates a SKILL.md for future AI context.

---

## Instructions

You are the GTD Discovery Agent. Your job is to either detect and document an existing test setup, or scaffold a clean, opinionated framework from scratch. Do not skip steps. Do not proceed to strategy until this command is fully complete.

---

## PHASE 1 — Scan for Existing Test Setup

Silently scan the project for:

**Evidence of Playwright:**
- `playwright.config.ts` / `playwright.config.js`
- `@playwright/test` in `package.json`
- Files matching `*.spec.ts`, `*.test.ts` inside `tests/`, `e2e/`, `src/`

**Evidence of Cypress:**
- `cypress.config.ts` / `cypress.config.js`
- `cypress/` directory
- `cypress` in `package.json` dependencies

**Evidence of k6 / Artillery:**
- `*.k6.js`, `*.artillery.yml` files
- `k6` or `artillery` in `package.json` or scripts

**Evidence of any API test framework:**
- `jest`, `supertest`, `pactum`, `axios-mock-adapter` in dependencies
- `__tests__/`, `test/` directories with `.test.ts` files

---

## PHASE 2A — Framework Already Exists

If a framework is detected, output:

```
✅ Existing test setup detected:

  E2E Framework : Playwright  (playwright.config.ts found)
  Test files    : 12 spec files in tests/e2e/
  API tests     : Jest + Supertest (8 files in src/__tests__/)
  Load tests    : None found
  Security tests: None found

  Structure:
  tests/
  ├── e2e/             ← Playwright specs
  ├── fixtures/        ← Test data
  └── helpers/         ← Shared utilities

Using this existing setup. Skipping framework creation.
```

Then jump to **PHASE 4 — Write SKILL.md** using the detected framework details.

---

## PHASE 2B — No Framework Found → Ask User

If no framework is detected, output:

```
No existing test framework found in this project.

Let's set one up. I'll ask you a few questions, then scaffold
a complete, DRY, best-practice framework ready for your tests.
```

Ask the following questions **one at a time**, waiting for each answer before asking the next:

---

**Question 1 — Framework:**

```
Which E2E / API test framework would you like to use?

  1. Playwright  — recommended (built-in API testing, multi-browser, TypeScript-first)
  2. Cypress     — great for UI-heavy apps, real browser, large ecosystem

Enter 1 or 2:
```

---

**Question 2 — Test scope:**

```
What types of tests do you need?

  1. UI only     — end-to-end browser tests
  2. API only    — HTTP endpoint tests (no browser)
  3. Both UI and API

Enter 1, 2, or 3:
```

---

**Question 3 — Additional suites:**

```
Do you also need any of the following? (enter numbers comma-separated, or 'none')

  1. Load testing      (k6)
  2. Security testing  (OWASP-aligned, fetch-based)
  3. Performance       (Lighthouse CI + Web Vitals)

Example: "1,2" or "none":
```

---

**Question 4 — Test data format:**

```
How should test data (fixtures, users, payloads) be stored?

  1. JSON files      — simple, version-controlled, easy to edit
  2. TypeScript      — type-safe, IDE autocomplete, refactorable
  3. Env vars only   — credentials from .env.test, no fixture files

Enter 1, 2, or 3:
```

---

**Question 5 — Language:**

```
Primary language for tests?

  1. TypeScript  — recommended (type safety, IDE support)
  2. JavaScript  — if your team prefers no compilation step

Enter 1 or 2:
```

---

## PHASE 3 — Scaffold the Framework

Based on the user's answers, create all files. Enforce these DRY rules in every generated file:

### DRY RULES — Non-negotiable

1. **No duplicated selectors** — all locators live in Page Objects (Playwright) or custom commands (Cypress). Never inline selectors in spec files.
2. **No duplicated auth** — login logic lives in shared fixtures or custom commands, called once per suite. Never repeated per test.
3. **No hardcoded URLs** — all URLs reference `baseURL` from config. Never `http://localhost:3000` in a spec file.
4. **No hardcoded credentials** — all secrets from `process.env` via `.env.test`. Never in source.
5. **No magic strings** — repeated values (roles, statuses, error messages) live in a `constants/` file.
6. **No duplicated API calls** — HTTP helpers wrapped in a shared `ApiHelper` class or custom command.

---

### Scaffold: Playwright

Create this exact structure:

```
tests/
├── e2e/                        ← UI specs
│   └── .gitkeep
├── api/                        ← API specs (no browser)
│   └── .gitkeep
├── pages/                      ← Page Object Models
│   └── BasePage.ts
├── fixtures/                   ← Shared Playwright fixtures
│   ├── index.ts
│   └── auth.fixture.ts
├── helpers/
│   ├── api.helper.ts
│   └── data.helper.ts
├── data/                       ← Test data (JSON or TS per user choice)
│   └── users.json
├── constants/
│   └── index.ts
└── config/
    └── env.ts

playwright.config.ts
.env.test.example
.gitignore (append .env.test and .qa/results/)
```

**`playwright.config.ts`:**
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
    ['html', { outputFolder: '.qa/results/html-report', open: 'never' }],
    ['json', { outputFile: '.qa/results/results.json' }],
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
    {
      name: 'chromium',
      testMatch: '**/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: '**/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      testMatch: '**/e2e/**/*.spec.ts',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
    },
  ],
})
```

**`tests/config/env.ts`:**
```typescript
// Single source of truth for environment config.
// Import this — never use process.env directly in test files.

const required = (key: string): string => {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}. See .env.test.example`)
  return val
}

export const env = {
  baseUrl:           process.env.BASE_URL ?? 'http://localhost:3000',
  apiUrl:            process.env.API_URL  ?? 'http://localhost:3000/api',
  testUserEmail:     required('TEST_USER_EMAIL'),
  testUserPassword:  required('TEST_USER_PASSWORD'),
  adminUserEmail:    process.env.ADMIN_USER_EMAIL,
  adminUserPassword: process.env.ADMIN_USER_PASSWORD,
} as const

export type Env = typeof env
```

**`tests/pages/BasePage.ts`:**
```typescript
import { Page, expect } from '@playwright/test'

// All page objects extend this. Shared navigation, assertions, and utilities live here.
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path = '') {
    await this.page.goto(path)
    await this.waitForLoad()
  }

  async waitForLoad() {
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

**`tests/fixtures/auth.fixture.ts`:**
```typescript
// DRY: pre-authenticated browser contexts.
// Use these instead of logging in in every test's beforeEach.

import { test as base, Page } from '@playwright/test'
import { env } from '../config/env'

type AuthFixtures = {
  authenticatedPage: Page
  adminPage: Page
}

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

**`tests/fixtures/index.ts`:**
```typescript
// Single import point for all fixtures.
// In spec files: import { test, expect } from '../fixtures'
export { test, expect } from './auth.fixture'
```

**`tests/helpers/api.helper.ts`:**
```typescript
// DRY: all HTTP test interactions go through this class.
// Never use raw fetch/axios in spec files.

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
    const res = await this.request.post(`${env.apiUrl}${path}`, {
      data: body,
      headers: this.headers(token),
    })
    return { status: res.status(), body: (await res.json()) as T }
  }

  async get<T>(path: string, token?: string) {
    const res = await this.request.get(`${env.apiUrl}${path}`, {
      headers: this.headers(token),
    })
    return { status: res.status(), body: (await res.json()) as T }
  }

  async put<T>(path: string, body: unknown, token?: string) {
    const res = await this.request.put(`${env.apiUrl}${path}`, {
      data: body,
      headers: this.headers(token),
    })
    return { status: res.status(), body: (await res.json()) as T }
  }

  async delete(path: string, token?: string) {
    const res = await this.request.delete(`${env.apiUrl}${path}`, {
      headers: this.headers(token),
    })
    return { status: res.status() }
  }

  async getAuthToken(email: string, password: string): Promise<string> {
    const { body } = await this.post<{ token: string }>('/auth/login', { email, password })
    if (!body.token) throw new Error('Login failed — no token in response')
    return body.token
  }
}
```

**`tests/constants/index.ts`:**
```typescript
// No magic strings in tests. All repeated values live here.

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  // Add routes as discovered
} as const

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  REQUIRED_FIELD: 'This field is required',
  UNAUTHORIZED: 'You must be logged in to view this page',
  // Add messages as discovered
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
} as const
```

**`.env.test.example`:**
```bash
# Copy to .env.test — do NOT commit .env.test

BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api

TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPass123!

# Optional — only needed if admin tests are present
ADMIN_USER_EMAIL=admin@example.com
ADMIN_USER_PASSWORD=AdminPass123!
```

---

### Scaffold: Cypress (if user chose Cypress)

```
cypress/
├── e2e/
│   └── .gitkeep
├── api/
│   └── .gitkeep
├── support/
│   ├── commands.ts          ← Custom DRY commands
│   ├── e2e.ts               ← Global setup
│   └── pages/
│       └── BasePage.ts
├── fixtures/
│   └── users.json
└── constants/
    └── index.ts

cypress.config.ts
.env.test.example
```

**`cypress.config.ts`:**
```typescript
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
    viewportWidth: 1280,
    viewportHeight: 720,
    retries: { runMode: 2, openMode: 0 },
    env: {
      apiUrl: process.env.API_URL ?? 'http://localhost:3000/api',
      TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
      TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
    },
  },
})
```

**`cypress/support/commands.ts`:**
```typescript
// DRY: all reusable actions as custom commands
// Never repeat login, navigation, or common assertions in spec files

Cypress.Commands.add('login', (email?: string, password?: string) => {
  const user = email ?? Cypress.env('TEST_USER_EMAIL')
  const pass = password ?? Cypress.env('TEST_USER_PASSWORD')
  cy.session([user, pass], () => {
    cy.visit('/login')
    cy.getByTestId('email-input').type(user)
    cy.getByTestId('password-input').type(pass)
    cy.getByRole('button', { name: /sign in/i }).click()
    cy.url().should('include', '/dashboard')
  })
})

Cypress.Commands.add('getByTestId', (id: string) =>
  cy.get(`[data-testid="${id}"]`)
)

Cypress.Commands.add('apiRequest', <T>(
  method: string, path: string, body?: unknown, token?: string
): Cypress.Chainable<{ status: number; body: T }> => {
  const apiUrl = Cypress.env('apiUrl')
  return cy.request({
    method,
    url: `${apiUrl}${path}`,
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    failOnStatusCode: false,
  }).then(res => ({ status: res.status, body: res.body as T }))
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      getByTestId(id: string): Chainable<JQuery<HTMLElement>>
      apiRequest<T>(method: string, path: string, body?: unknown, token?: string): Chainable<{ status: number; body: T }>
    }
  }
}
```

---

### If k6 selected — also scaffold:

```
tests/load/
├── config/
│   └── thresholds.js      ← Shared SLO definitions
├── helpers/
│   └── auth.js            ← Token pool helper
├── fixtures/
│   └── payloads.json      ← Realistic request payloads
└── scenarios/
    └── baseline.js        ← Starter scenario
```

**`tests/load/config/thresholds.js`:**
```javascript
// DRY: import in every k6 script. Single place to update SLOs.
export const defaultThresholds = {
  http_req_duration: ['p(50)<150', 'p(95)<500', 'p(99)<1000'],
  http_req_failed:   ['rate<0.001'],
}
```

---

### Add to package.json scripts

```json
{
  "scripts": {
    "test:e2e":      "playwright test tests/e2e/",
    "test:api":      "playwright test tests/api/",
    "test:all":      "playwright test",
    "test:ui":       "playwright test --ui",
    "test:report":   "playwright show-report .qa/results/html-report",
    "test:load":     "k6 run tests/load/scenarios/baseline.js",
    "test:security": "playwright test tests/security/"
  }
}
```

---

## PHASE 4 — Write SKILL.md

Create `.qa/SKILL.md`:

```markdown
# QA Framework Skill

_Framework: [Playwright|Cypress] | Language: [TypeScript|JavaScript] | Created: [date]_

## Framework Coding Standards Skill

Detailed coding standards, design patterns, and anti-patterns for this framework live here:

- **Playwright** → `.qa/skills/playwright-standards.md`
- **Cypress** → `.qa/skills/cypress-standards.md`

**Read the relevant skill file before writing any test code.** It covers:
- SOLID principles applied to tests
- Page Object Model patterns with real examples
- Selector priority order (data-testid → role → label → text → CSS)
- Explicit wait patterns — `cy.wait(N)` and `waitForTimeout` are banned
- DRY rules: where selectors, auth, URLs, and credentials must live
- Clean code examples (good vs bad side-by-side)
- Pre-commit checklist

## Purpose

Read this file before writing, modifying, or planning any tests in this project.
It tells you exactly how the test framework is structured and what conventions to follow.

## Active Test Framework

[Playwright | Cypress] — [version from package.json]

## Test Types Active

- [x] UI E2E  → tests/e2e/  (or cypress/e2e/)
- [x] API     → tests/api/  (or cypress/api/)
- [ ] Load    → tests/load/  (k6)
- [ ] Security→ tests/security/
- [ ] Perf    → lighthouserc.js

## Directory Structure

[Paste the actual structure created]

## DRY Rules — Always Enforce

1. Selectors → Page Objects in `tests/pages/` or `cypress/support/commands.ts`. Never inline in specs.
2. Auth → `tests/fixtures/auth.fixture.ts` (Playwright) or `cy.login()` (Cypress). Never repeat in tests.
3. URLs → `tests/config/env.ts` `baseUrl` or Playwright `baseURL`. Never hardcode.
4. Credentials → `.env.test` via `process.env`. Never in source.
5. Constants → `tests/constants/index.ts`. No magic strings in spec files.
6. API calls → `ApiHelper` class or `cy.apiRequest()`. Never raw fetch in specs.

## How to Add a New E2E Test

1. Create/update Page Object: `tests/pages/[Feature]Page.ts` extending `BasePage`
2. Add test data: `tests/data/[feature].json`
3. Create spec: `tests/e2e/[feature]/[feature].spec.ts`
4. Import: `import { test, expect } from '../../fixtures'`
5. Use Page Object actions — never raw locators in the spec

## How to Add a New API Test

1. Create spec: `tests/api/[resource]/[resource].spec.ts`
2. Use `ApiHelper` from `tests/helpers/api.helper.ts`
3. Get auth token via `apiHelper.getAuthToken()` — never hardcode

## Selector Priority (use in this order)

1. `data-testid` (add to components if missing)
2. `getByRole('button', { name: 'Submit' })`
3. `getByLabel('Email address')`
4. `getByText('Sign in')`
5. CSS selector (last resort — fragile, avoid)

## Never Do This

- `await page.waitForTimeout(2000)` — use explicit conditions
- `cy.wait(2000)` — use cy.intercept().wait()
- Inline credentials in test files
- Import `process.env` directly in tests — use `tests/config/env.ts`
- Skip the Page Object — even for "quick" tests
```

---

## PHASE 5 — Output Summary

```
✅ Discovery complete.

[If new framework created:]
Framework scaffolded: [Playwright | Cypress]
Language: TypeScript
Test types: [UI | API | Both] [+ Load | Security | Performance if selected]

Files created:
  playwright.config.ts              ← Root config
  tests/config/env.ts               ← Env config (import this, not process.env)
  tests/pages/BasePage.ts           ← Base Page Object — extend per page
  tests/fixtures/auth.fixture.ts    ← DRY pre-auth contexts
  tests/fixtures/index.ts           ← Single import point
  tests/helpers/api.helper.ts       ← DRY API request wrapper
  tests/constants/index.ts          ← No magic strings
  .env.test.example                 ← Fill in and copy to .env.test

[If existing framework:]
Existing [framework] setup detected and documented.

SKILL.md → .qa/SKILL.md

⚠️  Action required before writing tests:
  1. cp .env.test.example .env.test  (then fill in real values)
  2. npm install
  3. npx playwright install chromium firefox webkit

─────────────────────────────────────
Next step: /qa:strategy
Define what to test, set acceptance criteria, and get an
approved Requirement Traceability Matrix before any test code is written.
─────────────────────────────────────
```
