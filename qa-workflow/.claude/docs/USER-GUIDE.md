# GET TESTS DONE — User Guide

## Philosophy

Good test automation has three properties that are hard to maintain simultaneously:

1. **Coverage** — the right things are tested
2. **Reliability** — tests don't flake, don't rot, don't lie
3. **Speed** — tests run fast enough to be part of the feedback loop

Most test suites start with some of these and erode over time. Tests get skipped in CI. Selectors go stale. Load tests run against fake traffic profiles. Security tests run once at launch.

GET TESTS DONE solves this by treating tests as first-class specifications — not afterthoughts.

---

## The Core Workflow

### For a new codebase

```
/qa:discover                    # Map the app — what exists, what needs testing
/qa:plan-e2e auth               # Plan E2E tests for your auth flow (most critical first)
/qa:execute e2e-auth            # Implement the tests
/qa:run e2e                     # Run them
/qa:plan-security               # Plan OWASP security tests
/qa:execute security            # Implement security tests
/qa:plan-load checkout-api      # Plan load tests for your critical API
/qa:execute load-checkout-api   # Implement load tests
/qa:plan-performance            # Plan Web Vitals budgets
/qa:execute performance         # Implement Lighthouse CI
/qa:report                      # Full coverage overview
```

### For an existing codebase with some tests

```
/qa:discover                    # Audit what exists — may find gaps you didn't know about
/qa:coverage-gap                # Ranked list of coverage gaps
/qa:plan-e2e [top gap]          # Fill the most critical gap first
```

### For a specific regression

```
/qa:quick the login button is broken after the header redesign
```

### Maintenance

```
/qa:maintain                    # After a release — update tests broken by intentional changes
/qa:coverage-gap                # After a major feature — find new coverage gaps
/qa:verify                      # After a failed CI run — diagnose failures
```

---

## Understanding Plan Files

Plans live in `.qa/plans/` and use XML structure. They're designed to be:
- **Human-readable** — edit them before executing if the auto-generated plan doesn't match your intent
- **Executable** — `/qa:execute` reads them directly
- **Version-controlled** — commit them so you can see how your test strategy evolves

Example plan excerpt:
```xml
<scenario id="1" priority="critical" tags="happy-path,smoke">
  <n>Successful login with valid credentials</n>
  <preconditions>
    - User account exists: testuser@example.com / TestPass123!
    - User is on the /login page
  </preconditions>
  <steps>
    1. Fill email input with testuser@example.com
    2. Fill password input with TestPass123!
    3. Click "Sign in" button
    4. Wait for navigation to /dashboard
  </steps>
  <assertions>
    - URL is /dashboard
    - Welcome message with user's name is visible
    - Auth cookie is set with HttpOnly flag
  </assertions>
</scenario>
```

---

## Framework Setup

### Playwright (default — recommended)

```bash
npm install --save-dev @playwright/test
npx playwright install chromium firefox webkit
```

Config: `playwright.config.ts` (GTD creates this for you)

### Cypress

```bash
npm install --save-dev cypress
```

Config: `cypress.config.ts` (GTD creates this for you)

### k6 (load testing)

```bash
brew install k6
# or
docker pull grafana/k6
```

### Lighthouse CI (performance)

```bash
npm install --save-dev @lhci/cli
```

Config: `lighthouserc.js` (GTD creates this for you)

---

## Configuration Reference

`.qa/config.json`:

```json
{
  "e2e": {
    "framework": "playwright",
    "baseUrl": "http://localhost:3000",
    "screenshotsOnFailure": true,
    "videoOnFailure": true,
    "defaultTimeout": 10000,
    "retries": {
      "ci": 2,
      "local": 0
    }
  },
  "load": {
    "tool": "k6",
    "defaultVUs": 50,
    "defaultDuration": "60s",
    "userPoolSize": 100
  },
  "security": {
    "depth": "standard",
    "owasp": true,
    "authTests": true,
    "zapEnabled": false
  },
  "performance": {
    "tool": "lighthouse",
    "runs": 3,
    "budget": {
      "lcp": 2500,
      "fid": 100,
      "cls": 0.1,
      "ttfb": 600,
      "fcp": 1800,
      "tbt": 200
    },
    "scores": {
      "performance": 80,
      "accessibility": 90,
      "bestPractices": 85,
      "seo": 90
    }
  },
  "mode": "interactive",
  "commits": true,
  "discoveredAt": "2025-03-26T00:00:00Z"
}
```

---

## CI Integration

### GitHub Actions — Full Suite

```yaml
name: QA Suite

on:
  push:
    branches: [main]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build && npm run start &
      - run: npx playwright test tests/e2e/
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-report
          path: .qa/results/playwright-report/

  security:
    runs-on: ubuntu-latest
    needs: e2e
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build && npm run start &
      - run: npx playwright test tests/security/

  performance:
    runs-on: ubuntu-latest
    needs: e2e
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build && npm run start &
      - run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### Load Tests — Manual / Scheduled Only

Don't run load tests on every push. Run them:
- Before every major release
- On a weekly schedule against staging
- When you change a high-traffic endpoint

```yaml
name: Load Tests (Manual)
on:
  workflow_dispatch:
    inputs:
      scenario:
        description: 'Scenario to run (baseline/average/spike)'
        default: 'average'

jobs:
  load:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/setup-k6-action@v1
      - run: k6 run tests/load/scenarios/${{ inputs.scenario }}.js
```

---

## Tips

**Start with the riskiest area, not the easiest area.** If your payment flow has zero tests, start there, not the homepage.

**Test IDs before tests.** Before running `/qa:execute e2e-*`, add `data-testid` attributes to your components. GTD will identify which ones are missing.

**Never load test production.** Always test against a staging environment with production-like data.

**Security tests early, not at release.** Security debt compounds. Run `/qa:plan-security` early in the project lifecycle.

**Flaky tests are worse than no tests.** A test that sometimes passes is actively harmful — it erodes trust in the whole suite. Fix flakiness immediately.
