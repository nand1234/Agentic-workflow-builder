# qa:execute_plan

**Mode 2 — implementation.** Reads an approved plan from `.claude/plans/` and writes the test code. Every file follows the framework skill. Atomic commits per file.

---

## Instructions

$ARGUMENTS = plan name (e.g. "e2e-user-authentication", "load-checkout", "security-auth").

If empty, list available plans and ask which to execute.

### STEP 1 — Load everything

Read in this order — all required before writing a line:
1. `.claude/SKILL.md`
2. `.claude/skills/playwright-standards.md` OR `.claude/skills/cypress-standards.md`
3. `.claude/plans/[plan-name].md`

If plan not found:
```
❌ Plan '[name]' not found.
Available plans: [list .claude/plans/ contents]
Create one first: /qa:plan [type] [feature]
```

### STEP 2 — Pre-flight

**Framework installed?** Check `package.json`. If missing:
```
⚠️  [Framework] not found.
npm install --save-dev @playwright/test
npx playwright install chromium firefox webkit
```

**Create directories if missing:**
```bash
mkdir -p tests/e2e/[feature] tests/api/[feature] tests/pages tests/fixtures
mkdir -p tests/helpers tests/data tests/constants tests/config
mkdir -p tests/load/scenarios tests/load/fixtures tests/load/config
mkdir -p tests/security tests/security/helpers
mkdir -p .claude/results
```

**Missing data-testid attributes** — if plan lists them, add now and ask:
```
⚠️  Missing data-testid attributes needed by this plan:
  src/[component] → data-testid="[id]" on [element]
Add them now? (yes / note as pending)
```

If yes: add surgically, commit separately:
```
chore(tests): add data-testid to [Component] for [feature] tests
```

### STEP 3 — Wave structure

Group implementation into waves:

**Wave 1 — Shared infrastructure (sequential):**
- Page Object files
- Test data JSON
- Helper additions if needed

**Wave 2 — Test scenarios (parallel by group):**
- P1 / critical scenarios
- Other scenario groups in parallel

**Wave 3 — Config (sequential):**
- Framework config updates
- CI workflow (if not present)

Show the wave plan before starting:
```
Wave 1: tests/pages/[Feature]Page.ts | tests/data/[feature].json
Wave 2: [feature].spec.ts (REQ-01, REQ-02) | [feature].mobile.spec.ts (REQ-03)
Wave 3: .github/workflows/e2e.yml
```

### STEP 4 — Wave 1: Infrastructure

**Page Object — enforce from skill:**
```typescript
// tests/pages/[Feature]Page.ts
import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'
import { ROUTES, ERROR_MESSAGES } from '../constants'

export class [Feature]Page extends BasePage {
  private readonly [element]: Locator   // private, data-testid preferred

  constructor(page: Page) {
    super(page)
    this.[element] = page.getByTestId('[id]')
  }

  async goto() { await this.navigate(ROUTES.[ROUTE]) }
  async [action]([p]: string) { await this.[element].fill([p]) }
  async expect[State]() { await expect(this.[element]).toBeVisible() }
}
```

Commit: `test(infra): add [feature] page object and fixtures`

### STEP 5 — Wave 2: Spec files

One spec file per scenario group. Implement exactly per the plan — no additions, no removals.

**Playwright:**
```typescript
import { test, expect } from '../../fixtures'  // NOT @playwright/test
import { [Feature]Page } from '../../pages/[Feature]Page'
import testData from '../../data/[feature].json'
import { ROUTES, ERROR_MESSAGES } from '../../constants'

test.describe('[Feature]', () => {
  let page: [Feature]Page
  test.beforeEach(async ({ page: p }) => { page = new [Feature]Page(p); await page.goto() })

  // REQ-01 — [requirement text]
  test('[plain English]', async () => {
    // Arrange → Act → Assert. No waitForTimeout. No inline selectors.
  })
})
```

**k6 script:**
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'
import { defaultThresholds } from '../config/thresholds.js'

export const options = { stages: [/* from plan */], thresholds: defaultThresholds }

export default function(data) {
  const token = data.tokens[__VU % data.tokens.length]
  const res = http.post(`${__ENV.API_URL}/[endpoint]`, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  })
  check(res, { 'status 200': r => r.status === 200, 'p95 ok': r => r.timings.duration < 500 })
  sleep(Math.random() * 2 + 1)
}
```

Commit per scenario group:
```
test([feature]): [scenario description] — REQ-[N]
```

### STEP 6 — Wave 3: CI config

Create `.github/workflows/[type].yml` if not present:
```yaml
name: [Type] Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build && npm run start &
      - run: npx wait-on http://localhost:3000 --timeout 30000
      - run: npx playwright test tests/[type]/[feature]/
        env:
          BASE_URL: ${{ secrets.TEST_BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: test-report, path: .claude/results/html-report/ }
```

Commit: `ci: add [type] test workflow for [feature]`

### STEP 7 — Run and verify

```bash
npx playwright test tests/e2e/[feature]/ --reporter=line
```

Diagnose failures before flagging:

| Problem | Fix |
|---|---|
| Selector not found | Verify data-testid added, check selector priority |
| Timeout | Add waitForResponse / waitForURL |
| Auth fails | Check .env.test credentials |
| Type error | Fix TypeScript, no any |
| Flaky | Proper wait condition, never sleep |

Only commit green tests. If test reveals app bug — document and flag, don't skip.

### STEP 8 — Output

```
✅ [plan-name] implemented

Files created: [N] — [list]

Results: [N] passed ✅  [N] failed ❌

Commits: [N]
  [list]

[If failures:]
Failures:
  ❌ [test] — [root cause] — [fix]

Next: /qa:run [suite]
```
