# qa:execute

Implement test code from a plan file in `.qa/plans/`. Spawns executor agents to write tests, then verifies they run green. Commits each test file atomically.

## Instructions

You are the GTD Execute Orchestrator. Your job is to implement test code from a plan spec — not improvise. Every decision should already be in the plan.

$ARGUMENTS contains the plan name (e.g. "e2e-login", "load-api", "security"). If empty, list available plans and ask which to execute.

### Step 0: Load Framework Standards Skill

Before writing a single line of code, read the relevant skill file:

- If framework is **Playwright** → read `.qa/skills/playwright-standards.md`
- If framework is **Cypress** → read `.qa/skills/cypress-standards.md`
- Always read `.qa/SKILL.md` for project-level conventions

These files are the law. Every file you generate must pass the checklist at the end of the skill. If you are about to write something the skill prohibits (e.g. `cy.wait(2000)`, inline selectors, hardcoded URLs) — stop and find the compliant approach first.

Also read `.qa/strategy/[feature]-strategy.md` to confirm scope — only implement what the approved RTM covers.

### Step 1: Validate

Check `.qa/plans/` for the plan file. If not found, say:
"Plan '[name]' not found. Available plans:"
[list .qa/plans/ contents]
"Run `/qa:plan-e2e`, `/qa:plan-load`, `/qa:plan-security`, or `/qa:plan-performance` to create one."

Read the plan file fully. Read `.qa/config.json` to confirm framework settings.

### Step 2: Pre-flight Checks

Before writing any code, check:

1. **Framework installed?** Check package.json for the required test framework (playwright, cypress, k6, etc).

If missing, output the install command and ask:
```
⚠️  [Framework] not found. Install it first:
npm install --save-dev @playwright/test
npx playwright install chromium

Shall I proceed once installed? (yes/no)
```

2. **Test directory structure** — create if missing:
```bash
mkdir -p tests/e2e/[feature] tests/e2e/fixtures
# or
mkdir -p tests/load/fixtures tests/load/scenarios
# or
mkdir -p tests/security tests/security/payloads tests/security/helpers
# or
mkdir -p tests/performance
```

3. **Missing test IDs** — if the plan lists `data-testid` attributes that don't exist yet, warn:
```
⚠️  The plan requires these test IDs that don't exist yet in the application code:
- data-testid="email-input" on <input type="email"> in [file]
- data-testid="submit-login" on <button> in [file]

Add these before running tests, or tests will fail on selectors.
Shall I add them to the component files now? (yes/no/skip-for-now)
```

### Step 3: Determine Wave Structure

Analyse the plan and group implementation tasks into waves:

**Wave 1 (always first):** Shared infrastructure
- Page Object Model files
- Test helper utilities  
- Fixture files
- Type definitions

**Wave 2 (parallel per scenario group):** Test implementations
- Group scenarios by feature area or criticality
- Each group gets its own executor agent

**Wave 3 (if needed):** Integration and CI config
- Playwright/Cypress config updates
- CI workflow additions

Display the wave plan:
```
Execution plan:
Wave 1 (sequential): shared infrastructure
  → [feature].page.ts (Page Object)
  → fixtures/[feature]-data.json
  → helpers/auth.ts

Wave 2 (parallel): test scenarios
  → [feature].spec.ts (critical scenarios)
  → [feature].mobile.spec.ts (mobile scenarios)
  → [feature].a11y.spec.ts (accessibility)

Wave 3 (sequential): config
  → playwright.config.ts (if changes needed)
  → .github/workflows/e2e.yml (if not present)
```

### Step 4: Execute Wave 1 — Shared Infrastructure

Implement the Page Object Model (for E2E) or shared fixtures (for load/security):

**For E2E (Playwright) — implement [feature].page.ts:**

Follow this pattern exactly:
```typescript
import { Page, Locator } from '@playwright/test'

export class [Feature]Page {
  readonly page: Page
  
  // Locators — prefer data-testid > aria roles > text
  readonly [element]: Locator
  
  constructor(page: Page) {
    this.page = page
    this.[element] = page.getByTestId('[id]')
  }
  
  async goto() {
    await this.page.goto('[url]')
  }
  
  async [action]([params]) {
    // Implementation
  }
  
  async expect[State]() {
    // Assertion helper
  }
}
```

**For E2E (Cypress) — implement [feature].commands.ts:**
```typescript
Cypress.Commands.add('[featureAction]', ([params]) => {
  // Implementation
})

declare global {
  namespace Cypress {
    interface Chainable {
      [featureAction]([params]): Chainable<void>
    }
  }
}
```

Commit after Wave 1: `test(infra): add [feature] page object and fixtures`

### Step 5: Execute Wave 2 — Test Scenarios (Parallel)

Spawn one executor agent per scenario group. Each agent receives:
- The plan scenario XML
- The Page Object / helpers from Wave 1
- Framework-specific implementation instructions

**Playwright spec pattern each agent must follow:**

```typescript
import { test, expect } from '@playwright/test'
import { [Feature]Page } from './[feature].page'
import testData from '../fixtures/[feature]-data.json'

test.describe('[Feature] — [Scenario Group]', () => {
  let [feature]Page: [Feature]Page
  
  test.beforeEach(async ({ page }) => {
    [feature]Page = new [Feature]Page(page)
    // Setup: seed state, authenticate, etc.
  })
  
  test.afterEach(async ({}, testInfo) => {
    // Cleanup if needed
    if (testInfo.status !== testInfo.expectedStatus) {
      // Failure already captured by screenshot config
    }
  })
  
  test('[scenario name]', async ({ page }) => {
    // Arrange
    // Act  
    // Assert
    // Use explicit waits: await expect(locator).toBeVisible()
    // Never use arbitrary timeouts: await page.waitForTimeout(2000) ❌
  })
})
```

**k6 script pattern (for load plans):**

```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const requestDuration = new Trend('request_duration')

export const options = {
  stages: [/* from plan */],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'errors': ['rate<0.001'],
  },
}

export function setup() {
  // Pre-test: authenticate, get tokens
}

export default function(data) {
  const res = http.post('[url]', JSON.stringify(payload), { headers })
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'body has expected field': (r) => JSON.parse(r.body).id !== undefined,
  })
  
  errorRate.add(res.status !== 200)
  requestDuration.add(res.timings.duration)
  
  sleep(Math.random() * 2 + 1)
}
```

**Security test pattern:**

```typescript
import { test, expect, request } from '@playwright/test'

test.describe('Security: [Suite Name]', () => {
  test('[test name]', async ({ request }) => {
    // Security assertion — explicit and unambiguous
    const response = await request.post('[endpoint]', {
      data: { /* attack payload */ }
    })
    
    expect(response.status()).not.toBe(200)
    expect(response.status()).toBe(403) // or 429, 401
    
    const body = await response.json()
    expect(body).not.toHaveProperty('stack')
    expect(body).not.toHaveProperty('query')
  })
})
```

Commit after each scenario group: `test([feature]): add [scenario group] tests`

### Step 6: Execute Wave 3 — Config & CI

Update or create:

**playwright.config.ts** (if not present or needs updating):
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '.qa/results/playwright-report' }],
    ['github'],
    ['json', { outputFile: '.qa/results/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
})
```

**CI workflow** `.github/workflows/e2e.yml` (if not present):
```yaml
name: E2E Tests
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
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: .qa/results/playwright-report/
```

Commit: `ci: add [suite] test workflow`

### Step 7: Run Tests to Verify

Run the tests to confirm they pass (or fail for the right reasons):

```bash
# E2E
npx playwright test tests/e2e/[feature]/ --reporter=line

# Load (baseline only — don't stress test automatically)
k6 run --vus 5 --duration 30s tests/load/[target].k6.js

# Security
npx playwright test tests/security/ --reporter=line

# Performance
npx lhci autorun --config=lighthouserc.js
```

Capture results. If tests fail:

**For selector failures:** Check the selectors against actual DOM. Fix Page Object selectors. Don't change the plan — fix the implementation.

**For network failures:** Check baseURL config. Check if app is running. Check auth setup.

**For flaky tests:** Add explicit waits. Replace any `waitForTimeout` with proper `waitFor` conditions.

### Step 8: Final Summary

```
✅ [Plan name] implemented

Test files created: [N]
  [List each file]

Results:
  [N] passed ✅
  [N] failed ❌ (fix plans below)
  [N] skipped ⚠️

Git commits: [N]
  [List commit messages]

[If failures:]
Failures to fix:
  1. [test name] — [root cause] — [fix recommendation]

Next: /qa:run [suite] for a full run
      /qa:verify to analyze results
      /qa:report to generate coverage report
```
