# qa:test

**Mode 1 — daily driver.** Plain English → committed passing test. Also handles maintenance: describe what changed, it finds and fixes affected tests. No ceremony.

---

## Instructions

$ARGUMENTS = plain English description. If empty, ask:
```
New test:    "the login form shows an error for an invalid email"
Maintenance: "the Submit button was renamed to Place Order"
```

### STEP 1 — Load Standards

Read before writing anything:
1. `.claude/SKILL.md`
2. `.claude/skills/playwright-standards.md` OR `.claude/skills/cypress-standards.md`
3. `tests/config/env.ts` and `tests/constants/index.ts`

If `.claude/SKILL.md` missing → stop: `❌ Run /qa:discover first.`

---

### STEP 2 — Classify

**Maintenance signals:** "renamed", "changed to", "now returns", "removed", "moved to", "tests broken"
**New test signals:** "should", "returns", "shows", "redirects", anything describing a behaviour

---

### PATH A — Maintenance

Find affected files:
```bash
grep -rl "[changed term]" tests/ --include="*.spec.ts"
```

Classify each failure:
- **Intentional change** → update the test
- **Regression** → flag as app bug, do not update

**Where to update (never in spec files directly):**

| Change | Update here |
|---|---|
| Button label / selector | Page Object in `tests/pages/` |
| Route / URL | `ROUTES` in `tests/constants/index.ts` |
| Error message | `ERROR_MESSAGES` in `tests/constants/index.ts` |
| API response field | Spec assertion + TS type |

Run after each file, commit per file:
```
fix(tests): update [feature] tests — [what changed]
```

Output:
```
✅ Maintenance complete — [N] files updated, all passing

[If regressions found:]
⚠️  App bugs found — fix the app, not the tests:
  [list]
```

---

### PATH B — New Test

Determine: UI/E2E | API | Mixed, and auth level (none / user / admin).

Scan for the component or handler. Note existing data-testid attributes.

State plan in one line and proceed:
```
→ UI test | Playwright | unauthenticated | LoginForm.tsx | creating LoginPage.ts
```

**Add missing data-testid attributes** (surgical, commit separately):
```tsx
<button data-testid="login-submit" onClick={handleSubmit}>Sign in</button>
```
```
chore(tests): add data-testid to [Component]
```

**Page Object** — create or add methods to existing:
```typescript
// tests/pages/[Feature]Page.ts
import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { ROUTES, ERROR_MESSAGES } from '../constants'

export class [Feature]Page extends BasePage {
  private readonly [element]: Locator

  constructor(page: Page) {
    super(page)
    this.[element] = page.getByTestId('[id]')
  }

  async goto() { await this.navigate(ROUTES.[ROUTE]) }
  async [action]([param]: string) { await this.[element].fill([param]) }
  async expect[State]() { await expect(this.[element]).toBeVisible() }
}
```

**Playwright spec:**
```typescript
// tests/e2e/[feature]/[slug].spec.ts
import { test, expect } from '../../fixtures'        // NOT @playwright/test
import { [Feature]Page } from '../../pages/[Feature]Page'
import testData from '../../data/[feature].json'
import { ROUTES, ERROR_MESSAGES } from '../../constants'

test.describe('[Feature]', () => {
  let featurePage: [Feature]Page

  test.beforeEach(async ({ page }) => {
    featurePage = new [Feature]Page(page)
    await featurePage.goto()
  })

  test('[plain English description]', async ({ page }) => {
    // Arrange → Act → Assert. One behaviour. No if statements.
  })
})
```

**Cypress spec:**
```typescript
// cypress/e2e/[feature]/[slug].cy.ts
import { [Feature]Page } from '../../support/pages/[Feature]Page'
const page = new [Feature]Page()

describe('[Feature]', () => {
  beforeEach(() => { page.visit() })
  it('[plain English description]', () => {
    // Fluent page object chain. No cy.get(). No cy.wait(N).
  })
})
```

**API spec:**
```typescript
// tests/api/[resource]/[slug].spec.ts
import { test, expect } from '@playwright/test'
import { ApiHelper } from '../../helpers/api.helper'
import { HTTP_STATUS } from '../../constants'
import { env } from '../../config/env'

test.describe('[METHOD] /api/[resource]', () => {
  let api: ApiHelper
  let token: string

  test.beforeAll(async ({ request }) => {
    api = new ApiHelper(request)
    token = await api.getAuthToken(env.testUserEmail, env.testUserPassword)
  })

  test('[description]', async () => {
    const { status, body } = await api.post<{ error: string }>('/[resource]', { }, token)
    expect(status).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(body.error).toBeDefined()
  })
})
```

**Rules — no exceptions:**
- `import { test, expect } from '../../fixtures'` not `@playwright/test` (UI tests)
- No selectors in spec files — page objects only
- No `waitForTimeout()` or `cy.wait(N)` — explicit conditions only
- No hardcoded URLs — `ROUTES` constants
- No hardcoded credentials — `testData` or `env`
- No `any` types — one behaviour per test

**Run:**
```bash
npx playwright test tests/e2e/[feature]/[slug].spec.ts --reporter=line
```

Diagnose and fix if failing. Only commit when green.

**Commit:**
```
test(pages): add [Feature] page object
test([feature]): [plain English description]
```

**Output:**
```
✅ Done — tests/e2e/[feature]/[slug].spec.ts — ✅ passing
[If page object created / test IDs added — list them]
```
