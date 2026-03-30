# qa:discover

**Run once per project.** Detects an existing test framework or scaffolds a new one from scratch. Writes `.claude/SKILL.md` so every subsequent command understands the project's conventions. Creates the two framework skills for Playwright or Cypress.

---

## Instructions

You are the GTD Discovery Agent. This command runs once. Do it thoroughly — every command that follows depends on the context you create here.

---

## PHASE 1 — Silent Scan

Scan the project silently. Do not ask the user anything yet.

Look for:

**Playwright:** `playwright.config.ts`, `playwright.config.js`, `@playwright/test` in `package.json`, `*.spec.ts` files in `tests/`, `e2e/`, `src/`

**Cypress:** `cypress.config.ts`, `cypress.config.js`, `cypress/` directory, `cypress` in `package.json`

**k6:** `*.k6.js` files, `k6` in `package.json` scripts

**Jest / Supertest:** `jest.config.*`, `supertest` in `package.json`, `__tests__/` directories

**Existing test data:** fixture files, `.env.test`, test seed scripts

Map what exists:
- Framework(s) detected
- Test file count and locations
- Existing coverage (rough — which routes/features have tests)
- What's missing

---

## PHASE 2A — Framework Exists

If a framework is detected, output:

```
✅ Existing test setup found

  Framework : Playwright  ← playwright.config.ts
  Test files: 14 specs in tests/e2e/, 6 in tests/api/
  Load tests: None
  Security  : None

Using your existing setup. Documenting conventions now.
```

Read the existing config and test files to understand:
- Directory structure
- Naming conventions in use
- Whether Page Objects are being used
- How auth is currently handled in tests
- What test data approach they're using

Then go to **PHASE 4 — Write SKILL.md** reflecting what actually exists.

---

## PHASE 2B — No Framework Found

Output:
```
No test framework found. Let's set one up.
I'll ask 5 quick questions then scaffold everything.
```

Ask one at a time, waiting for each answer:

**Q1:**
```
Framework?

  1. Playwright  (recommended — API testing built in, TypeScript-first, multi-browser)
  2. Cypress     (great for UI-heavy apps, large ecosystem)

Enter 1 or 2:
```

**Q2:**
```
Test scope?

  1. UI tests only       (browser automation)
  2. API tests only      (HTTP endpoints, no browser)
  3. Both UI and API

Enter 1, 2, or 3:
```

**Q3:**
```
Additional suites needed? (comma-separated or 'none')

  1. Load testing    (k6)
  2. Security tests  (OWASP-aligned)
  3. Performance     (Lighthouse CI)

Example: "1,2" or "none":
```

**Q4:**
```
Test data format?

  1. JSON files    (simple, version-controlled)
  2. TypeScript    (typed, IDE autocomplete)

Enter 1 or 2:
```

**Q5:**
```
Language?

  1. TypeScript  (recommended)
  2. JavaScript

Enter 1 or 2:
```

---

## PHASE 3 — Scaffold

Based on answers, create the full framework. Every file must follow the principles below — these are non-negotiable.

### Principles (enforce in every generated file)

**SOLID:**
- Single Responsibility: one page object per page, one spec per feature, one test per behaviour
- Open/Closed: `BasePage` extended, never modified. New page = new class extending `BasePage`
- Dependency Inversion: specs depend on page object abstractions, never on raw `page.locator()` / `cy.get()`

**DRY:**
- Selectors → page objects / custom commands only. Never in spec files.
- Auth → shared fixture (`auth.fixture.ts`) or `cy.login()`. Never repeated per test.
- URLs → `ROUTES` constants + `baseURL` config. Never hardcoded.
- Credentials → `.env.test` via `env.ts`. Never in source.
- API calls → `ApiHelper` class or `cy.apiRequest()`. Never raw fetch in specs.
- Constants → `constants/index.ts`. No magic strings.

**Clean code:**
- Method names are verb phrases: `fillEmail()`, `expectErrorMessage()`, `placeOrder()`
- Test names are plain English sentences: `'redirects to dashboard with valid credentials'`
- No `waitForTimeout()` or `cy.wait(N)` — explicit conditions only
- No `any` types
- Max 2 levels of `describe` nesting
- No business logic or `if` statements in spec files

---

### Scaffold: Playwright

Create this structure — every file below:

```
tests/
├── e2e/                        ← UI specs (one folder per feature)
├── api/                        ← API specs (no browser)
├── pages/
│   └── BasePage.ts
├── fixtures/
│   ├── index.ts
│   └── auth.fixture.ts
├── helpers/
│   ├── api.helper.ts
│   └── data.helper.ts
├── data/                       ← JSON or TS based on Q4
├── constants/
│   └── index.ts
└── config/
    └── env.ts

playwright.config.ts
.env.test.example
```

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
// Single source of truth for environment config.
// Import this everywhere — never use process.env directly in tests.
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
// Import test + expect from here — not from @playwright/test
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
// Dynamic test data generators — use when static fixtures aren't enough
export const dataHelper = {
  uniqueEmail: (prefix = 'test') =>
    `${prefix}+${Date.now()}@example.com`,

  randomString: (length = 8) =>
    Math.random().toString(36).substring(2, 2 + length),

  futureDate: (daysFromNow = 30) => {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    return d.toISOString().split('T')[0]
  },
}
```

**`tests/constants/index.ts`**
```typescript
// No magic strings in test files. Add to this file as you discover values.
export const ROUTES = {
  HOME:      '/',
  LOGIN:     '/login',
  DASHBOARD: '/dashboard',
  REGISTER:  '/register',
} as const

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  REQUIRED_FIELD:      'This field is required',
  UNAUTHORIZED:        'You must be logged in',
} as const

export const HTTP_STATUS = {
  OK:                  200,
  CREATED:             201,
  BAD_REQUEST:         400,
  UNAUTHORIZED:        401,
  FORBIDDEN:           403,
  NOT_FOUND:           404,
  TOO_MANY_REQUESTS:   429,
  SERVER_ERROR:        500,
} as const
```

**`.env.test.example`**
```bash
# Copy to .env.test — never commit .env.test

BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api

TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPass123!

# Optional — only needed if admin tests exist
ADMIN_USER_EMAIL=admin@example.com
ADMIN_USER_PASSWORD=AdminPass123!
```

Add to `.gitignore`:
```
.env.test
.claude/results/
```

Add to `package.json` scripts:
```json
{
  "test:e2e":      "playwright test tests/e2e/",
  "test:api":      "playwright test tests/api/",
  "test:all":      "playwright test",
  "test:ui":       "playwright test --ui",
  "test:report":   "playwright show-report .claude/results/html-report"
}
```

---

### Scaffold: Cypress

Create:
```
cypress/
├── e2e/
├── api/
├── support/
│   ├── commands.ts
│   ├── e2e.ts
│   └── pages/
│       └── BasePage.ts
├── fixtures/
└── constants/
    └── index.ts

cypress.config.ts
.env.test.example
```

**`cypress.config.ts`**
```typescript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
    specPattern: ['cypress/e2e/**/*.cy.ts', 'cypress/api/**/*.cy.ts'],
    supportFile: 'cypress/support/e2e.ts',
    videosFolder: '.claude/results/videos',
    screenshotsFolder: '.claude/results/screenshots',
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10_000,
    retries: { runMode: 2, openMode: 0 },
    env: {
      apiUrl:             process.env.API_URL            ?? 'http://localhost:3000/api',
      TEST_USER_EMAIL:    process.env.TEST_USER_EMAIL,
      TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
    },
  },
})
```

**`cypress/support/commands.ts`**
```typescript
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const user = email ?? Cypress.env('TEST_USER_EMAIL')
  const pass = password ?? Cypress.env('TEST_USER_PASSWORD')
  cy.session([user, pass], () => {
    cy.visit('/login')
    cy.getByTestId('email-input').type(user)
    cy.getByTestId('password-input').type(pass)
    cy.getByRole('button', { name: /sign in/i }).click()
    cy.url().should('include', '/dashboard')
  }, {
    validate: () => cy.request({ url: '/api/auth/me', failOnStatusCode: false }).its('status').should('eq', 200),
  })
})

Cypress.Commands.add('getByTestId', (id: string) => cy.get(`[data-testid="${id}"]`))

Cypress.Commands.add('apiRequest', (method: string, path: string, body?: unknown, token?: string) =>
  cy.request({
    method, url: `${Cypress.env('apiUrl')}${path}`, body,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    failOnStatusCode: false,
  })
)

Cypress.Commands.add('expectErrorMessage', (text: string) => {
  cy.getByRole('alert').should('be.visible').and('contain.text', text)
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      getByTestId(id: string): Chainable<JQuery<HTMLElement>>
      apiRequest(method: string, path: string, body?: unknown, token?: string): Chainable<Response<unknown>>
      expectErrorMessage(text: string): Chainable<void>
    }
  }
}
```

**`cypress/constants/index.ts`** — same structure as Playwright constants above.

Add to `package.json` scripts:
```json
{
  "test:e2e":    "cypress run --spec 'cypress/e2e/**/*.cy.ts'",
  "test:api":    "cypress run --spec 'cypress/api/**/*.cy.ts'",
  "test:open":   "cypress open",
  "test:report": "open .claude/results"
}
```

---

### If k6 selected — also create:

```
tests/load/
├── config/
│   └── thresholds.js
├── helpers/
│   └── auth.js
├── fixtures/
│   └── payloads.json
└── scenarios/
    └── baseline.js
```

**`tests/load/config/thresholds.js`**
```javascript
// DRY: import in every k6 script. One place to update SLOs.
export const defaultThresholds = {
  http_req_duration: ['p(50)<150', 'p(95)<500', 'p(99)<1000'],
  http_req_failed:   ['rate<0.001'],
}
```

**`tests/load/scenarios/baseline.js`**
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'
import { defaultThresholds } from '../config/thresholds.js'

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: defaultThresholds,
}

export default function () {
  const res = http.get(__ENV.BASE_URL)
  check(res, { 'status is 200': (r) => r.status === 200 })
  sleep(1)
}
```

---

## PHASE 4 — Write .claude/SKILL.md

```markdown
# QA Framework Skill

_Framework: [Playwright|Cypress] | Language: TypeScript | Created: [date]_

## Read Before Touching Any Test

This file is the contract for how tests are written in this project.
Every agent, every command, every generated file follows these rules.

## Active Framework

[Playwright | Cypress] — version [x.x.x]

## Test Types

- [x/o] UI E2E  → tests/e2e/  or cypress/e2e/
- [x/o] API     → tests/api/  or cypress/api/
- [x/o] Load    → tests/load/ (k6)
- [x/o] Security→ tests/security/
- [x/o] Perf    → lighthouserc.js

## Framework Coding Standards

Full rules, patterns, examples, and anti-patterns:
- **Playwright** → `.claude/skills/playwright-standards.md`
- **Cypress**    → `.claude/skills/cypress-standards.md`

Read the relevant skill before writing any test code.

## Directory Structure

[Paste the actual structure created or detected]

## DRY Rules (never break these)

| What | Where it lives | Never in |
|---|---|---|
| Selectors / locators | Page Objects (`tests/pages/`) | Spec files |
| Login / auth | `auth.fixture.ts` or `cy.login()` | `beforeEach` per test |
| URLs | `ROUTES` constants + `baseURL` | Hardcoded strings |
| Credentials | `.env.test` via `env.ts` | Source code |
| API calls | `ApiHelper` or `cy.apiRequest()` | Raw fetch in specs |
| Magic strings | `tests/constants/index.ts` | Inline in tests |

## Adding a New E2E Test

1. Create/update Page Object: `tests/pages/[Feature]Page.ts` extends `BasePage`
2. Add test data: `tests/data/[feature].json`
3. Create spec: `tests/e2e/[feature]/[feature].spec.ts`
4. Import: `import { test, expect } from '../../fixtures'`
5. Use page object methods — never raw locators in specs

## Adding a New API Test

1. Create spec: `tests/api/[resource]/[resource].spec.ts`
2. Use `ApiHelper` from `tests/helpers/api.helper.ts`
3. Auth: `await api.getAuthToken(email, password)` — never hardcode tokens

## Selector Priority

1. `data-testid` → add to component if missing
2. `getByRole('button', { name: /submit/i })`
3. `getByLabel('Email address')`
4. `getByText('Sign in')`
5. CSS selector — last resort, avoid

## Never Do

- `waitForTimeout(N)` or `cy.wait(N)` — use explicit conditions
- Raw `page.locator()` in spec files — use page objects
- Hardcode `http://localhost:3000` — use baseURL/ROUTES
- Import `process.env` in tests — use `tests/config/env.ts`
- Skip page objects for "quick" tests — the standards always apply
```

---

## PHASE 5 — Output

```
✅ Discovery complete

[If scaffolded:]
Framework  : [Playwright | Cypress]
Language   : TypeScript
Test types : [list]

Files created:
  playwright.config.ts
  tests/config/env.ts          ← env config, import this not process.env
  tests/pages/BasePage.ts      ← extend per page, never modify
  tests/fixtures/index.ts      ← import test+expect from here
  tests/helpers/api.helper.ts  ← all API calls go through this
  tests/constants/index.ts     ← no magic strings in tests
  .env.test.example            ← copy to .env.test and fill in

[If detected:]
Existing [framework] setup documented.

Skills written:
  .claude/SKILL.md
  .claude/skills/[framework]-standards.md

──────────────────────────────────────────
Next steps:

  cp .env.test.example .env.test   ← fill in your test credentials
  npm install
  npx playwright install chromium firefox webkit   ← if Playwright

Then pick your mode:

  MODE 1 (quick): /qa:test describe what you want to test in plain English
  MODE 2 (full) : /qa:strategy to define requirements and get an approved plan
──────────────────────────────────────────
```
