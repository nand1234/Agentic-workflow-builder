# qa:test

**Mode 1 — the daily driver.** Describe what you want to test in plain English. Reads your code, writes a production-quality test following all framework standards, runs it, commits it. No planning phase, no ceremony.

---

## Instructions

You are the GTD Test Agent. One command, one result: a passing, well-structured test committed to the repo.

$ARGUMENTS is a plain English description of what to test. If empty, ask:
```
What do you want to test? Describe it in plain English.
(e.g. "the login form shows an error for an invalid email"
      "POST /api/orders returns 400 when items is empty"
      "the dashboard redirects unauthenticated users to /login")
```

---

## STEP 1 — Load Standards

Read these files before writing a single line:

1. `.claude/SKILL.md` — project framework, directory structure, DRY rules
2. `.claude/skills/playwright-standards.md` OR `.claude/skills/cypress-standards.md` — whichever matches the framework
3. `tests/config/env.ts` — environment config
4. `tests/constants/index.ts` — existing routes, error messages, status codes

If `.claude/SKILL.md` doesn't exist:
```
❌ Framework not set up yet. Run /qa:discover first.
It takes 2 minutes and sets up everything this command needs.
```

---

## STEP 2 — Classify the Test

From the plain English description, determine:

**Test type:**
- UI/E2E — involves a browser, a page, user interaction (clicking, typing, navigating)
- API — involves an HTTP endpoint, no browser needed
- Mixed — UI action that triggers an API call you also want to assert

**Auth requirement:**
- Unauthenticated — no login needed
- Authenticated (standard user)
- Authenticated (admin user)

**Location of relevant code:**
- Find the page/component/route handler for what's being tested
- Scan for existing `data-testid` attributes
- Check if a Page Object already exists for this page

Output a one-line plan — don't ask for confirmation, just state it and proceed:
```
→ Writing UI test | Playwright | authenticated user
  Page: /checkout  |  Component: src/checkout/CheckoutForm.tsx
  Existing Page Object: none — will create CheckoutPage.ts
  Missing test IDs: checkout-total, place-order-btn
```

---

## STEP 3 — Missing Test IDs

If the description involves UI elements that don't have `data-testid` attributes, add them to the component before writing the test.

Find the component file. Add the minimum required `data-testid` attributes. Keep the change surgical — only add what the test needs.

```tsx
// Before
<button onClick={handleSubmit}>Place Order</button>

// After
<button data-testid="place-order-btn" onClick={handleSubmit}>Place Order</button>
```

Commit the component change separately:
```
chore(tests): add data-testid attributes for checkout tests
```

List what was added so the developer knows.

---

## STEP 4 — Write the Test

### Determine the file location

**UI test:**
`tests/e2e/[feature]/[description-slug].spec.ts`

**API test:**
`tests/api/[resource]/[description-slug].spec.ts`

### Check for existing Page Object

- If `tests/pages/[Feature]Page.ts` exists → use it, add methods if needed
- If it doesn't exist → create it now, extending `BasePage`

### Write the Page Object (if new or needs methods added)

Follow `playwright-standards.md` exactly:

```typescript
// tests/pages/[Feature]Page.ts
import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { ROUTES, ERROR_MESSAGES } from '../constants'

export class [Feature]Page extends BasePage {
  // Locators — private, grouped at top, data-testid preferred
  private readonly [element]: Locator

  constructor(page: Page) {
    super(page)
    this.[element] = page.getByTestId('[id]')
    // or: page.getByRole('button', { name: /text/i })
  }

  async goto() {
    await this.navigate(ROUTES.[ROUTE])
  }

  // Actions — verb phrases, do one thing, no assertions inside
  async [action]([param]: string) {
    await this.[element].fill([param])
  }

  // Assertions — start with expect, self-contained
  async expect[State]([param]?: string) {
    await expect(this.[element]).toBeVisible()
  }
}
```

### Write the Spec File

Follow the standards for the framework detected in SKILL.md:

**Playwright spec:**
```typescript
// tests/e2e/[feature]/[description-slug].spec.ts
import { test, expect } from '../../fixtures'           // NOT from @playwright/test
import { [Feature]Page } from '../../pages/[Feature]Page'
import { ROUTES, ERROR_MESSAGES } from '../../constants'

test.describe('[Feature] — [scenario group]', () => {
  let [feature]Page: [Feature]Page

  test.beforeEach(async ({ page }) => {    // or { authenticatedPage } if auth needed
    [feature]Page = new [Feature]Page(page)
    await [feature]Page.goto()
  })

  test('[plain English: what should happen]', async ({ page }) => {
    // Arrange — set up any additional state
    // Act — perform the action
    // Assert — verify the outcome
    // One behaviour per test. No if statements. No loops.
  })
})
```

**Cypress spec:**
```typescript
// cypress/e2e/[feature]/[description-slug].cy.ts
import { [Feature]Page } from '../../support/pages/[Feature]Page'

const [feature]Page = new [Feature]Page()

describe('[Feature] — [scenario group]', () => {
  beforeEach(() => {
    // cy.login() if auth needed
    [feature]Page.visit()
  })

  it('[plain English: what should happen]', () => {
    // Fluent page object chain
    // No cy.get() in spec files
    // No cy.wait(N)
  })
})
```

### Test data

- Use `tests/data/[feature].json` or `tests/constants/index.ts` for static values
- Use `dataHelper.uniqueEmail()` from `data.helper.ts` only if dynamic data is truly needed
- Credentials always from `env.ts` — never inline

---

## STEP 5 — Run the Test

Run only the new test file to verify it passes:

**Playwright:**
```bash
npx playwright test tests/e2e/[feature]/[slug].spec.ts --reporter=line
```

**Cypress:**
```bash
npx cypress run --spec "cypress/e2e/[feature]/[slug].cy.ts"
```

**If it fails:**

Diagnose before giving up. Common causes:

| Failure | Fix |
|---|---|
| Selector not found | Check `data-testid` was actually added. Re-check selector priority. |
| Timeout waiting for element | Add `waitForLoadState` or intercept the network request |
| Auth error | Check `.env.test` credentials are set and the test user exists |
| Wrong URL | Check `ROUTES` constant matches actual app routing |
| Type error | Fix TypeScript — no casting to `any` |

Fix the issue. Re-run. Only commit when green.

**If it reveals a real bug** (the test caught something broken in the app):
```
⚠️  Test is failing because the app has a bug:
[describe exactly what's broken and where]

The test itself is correct. Fix the application code first, then re-run.
```

---

## STEP 6 — Commit

Commit each file with a clear message:

```bash
git add tests/e2e/[feature]/[slug].spec.ts
git commit -m "test([feature]): [plain English description of what's tested]"

# If Page Object was created:
git add tests/pages/[Feature]Page.ts
git commit -m "test(pages): add [Feature] page object"

# If component was modified for test IDs:
git add src/[component]
git commit -m "chore(tests): add data-testid to [Component] for [feature] tests"
```

---

## STEP 7 — Output

```
✅ Test written and passing

File    : tests/e2e/[feature]/[slug].spec.ts
Scenario: [plain English description]
Result  : ✅ passing ([N]ms)

[If Page Object created:]
Also created: tests/pages/[Feature]Page.ts

[If test IDs added to component:]
Also updated: src/[component] — added [N] data-testid attributes
  [list them]

Commits: [N]
  [list commit messages]

[If test revealed a bug:]
⚠️  Found a bug while writing this test:
[description — let the developer know before they're surprised by CI]
```

---

## Examples of Good Test Output

### UI test — error state

```typescript
// tests/e2e/auth/login-invalid-email.spec.ts
import { test, expect } from '../../fixtures'
import { LoginPage } from '../../pages/LoginPage'
import { ERROR_MESSAGES } from '../../constants'

test.describe('Login — validation', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('shows error message for invalid email format', async () => {
    await loginPage.fillEmail('notanemail')
    await loginPage.submit()

    await loginPage.expectErrorMessage(ERROR_MESSAGES.INVALID_EMAIL)
    await loginPage.expectToBeOnLoginPage()
  })
})
```

### API test — validation

```typescript
// tests/api/orders/create-order-validation.spec.ts
import { test, expect } from '@playwright/test'
import { ApiHelper } from '../../helpers/api.helper'
import { HTTP_STATUS } from '../../constants'
import { env } from '../../config/env'

test.describe('POST /api/orders — validation', () => {
  let api: ApiHelper
  let token: string

  test.beforeAll(async ({ request }) => {
    api = new ApiHelper(request)
    token = await api.getAuthToken(env.testUserEmail, env.testUserPassword)
  })

  test('returns 400 when items array is empty', async () => {
    const { status, body } = await api.post<{ error: string }>(
      '/orders',
      { items: [] },
      token
    )

    expect(status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(body.error).toBeDefined()
  })

  test('returns 400 when items field is missing', async () => {
    const { status } = await api.post('/orders', {}, token)
    expect(status).toBe(HTTP_STATUS.BAD_REQUEST)
  })
})
```
