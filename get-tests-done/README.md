# GET TESTS DONE

**A spec-driven, context-engineered, multi-agent QA automation system for Claude Code.**

Covers E2E (Cypress / Playwright), Performance (Lighthouse / Web Vitals), Load (k6 / Artillery), and Security (OWASP / ZAP).

Solves **test rot** — the quality degradation that happens when tests are written ad-hoc, without strategy, and with no living spec.

```
npx get-tests-done@latest
```

---

## Why I Built This

QA automation fails in predictable ways: tests are written after the fact, selectors break silently, load tests never match production traffic, security scans run once at launch and never again.

GTD fixes the workflow. Describe what you want to test. The system figures out *how* to test it — proper selectors, realistic load profiles, OWASP-aligned security checks, Core Web Vitals thresholds — and builds the test suite for you.

No more vibes-based testing. Just a ruthlessly effective system for building test suites that actually catch regressions.

---

## How It Works

### 1. Discover Your App

```
/qa:discover
```

Spawns parallel agents to map your app: routes, APIs, auth flows, key user journeys, existing test coverage. Produces `QA-STRATEGY.md` and `COVERAGE-MAP.md`. Every subsequent command reads these.

---

### 2. Plan Your Tests

Choose what to plan — or plan everything at once:

```
/qa:plan-e2e [feature]        # Cypress / Playwright E2E tests
/qa:plan-performance          # Lighthouse / Web Vitals budgets
/qa:plan-load [endpoint]      # k6 / Artillery load profiles
/qa:plan-security             # OWASP Top 10 + custom vectors
```

Each command:
1. **Researches** — reads your app code, existing tests, and tech stack
2. **Plans** — creates atomic, XML-structured test plans
3. **Verifies** — checks plans against your QA strategy before writing a line of test code

Plans live in `.qa/plans/` and are readable, editable, and re-runnable.

---

### 3. Execute — Write the Test Code

```
/qa:execute [plan-name]
```

Spawns qa-executor agents per plan (parallel where safe). Each agent:
- Implements the test file(s) per the spec
- Uses best-practice patterns for the framework (Page Object Model for Playwright, custom commands for Cypress)
- Commits per test file with atomic git history
- Verifies tests run green before moving on

---

### 4. Run & Verify

```
/qa:run [suite]               # Run a specific suite: e2e | perf | load | security
/qa:verify                    # Analyse results, diagnose failures, generate fix plans
/qa:report                    # Full coverage + results report
```

---

### 5. Keep Tests Alive

```
/qa:quick                     # Ad-hoc test for a specific scenario
/qa:coverage-gap              # Find untested routes, flows, or endpoints
/qa:maintain                  # Update tests broken by recent changes
```

---

## Commands

| Command | What it does |
|---|---|
| `/qa:discover` | Map app structure, routes, APIs, auth flows → `QA-STRATEGY.md` |
| `/qa:plan-e2e [feature]` | Plan Cypress/Playwright E2E tests for a feature or page |
| `/qa:plan-performance` | Plan Lighthouse/Web Vitals budgets and thresholds |
| `/qa:plan-load [target]` | Plan k6/Artillery load test scenarios and SLOs |
| `/qa:plan-security` | Plan OWASP Top 10 + custom security test vectors |
| `/qa:execute [plan]` | Implement test code from a plan file |
| `/qa:run [suite]` | Run a test suite and capture results |
| `/qa:verify` | Analyse results, auto-diagnose failures, create fix plans |
| `/qa:report` | Generate full coverage and results report |
| `/qa:quick` | Ad-hoc test generation without full planning cycle |
| `/qa:coverage-gap` | Identify untested flows and generate gap plans |
| `/qa:maintain` | Update broken tests after app changes |
| `/qa:help` | Show all commands |

---

## File Structure

```
.qa/
├── QA-STRATEGY.md          # What we test and why
├── COVERAGE-MAP.md         # Route/API/flow coverage status
├── plans/
│   ├── e2e-auth.md         # E2E plan: authentication flows
│   ├── e2e-checkout.md     # E2E plan: checkout flow
│   ├── load-api.md         # Load plan: API endpoints
│   ├── security.md         # Security plan: OWASP vectors
│   └── performance.md      # Performance plan: Core Web Vitals
├── results/
│   ├── e2e-2025-03-26.md   # E2E run results
│   ├── load-2025-03-26.md  # Load run results
│   └── security-2025-03-26.md
└── REPORT.md               # Latest aggregated report
```

---

## Tech Stack Support

| Category | Supported Tools |
|---|---|
| E2E | Cypress, Playwright |
| Performance | Lighthouse CI, Web Vitals, PageSpeed |
| Load | k6, Artillery, Autocannon |
| Security | OWASP ZAP, custom fetch-based checks, Snyk |
| Reporting | Allure, HTML reports, Slack/GitHub PR comments |

---

## Installation

```bash
npx get-tests-done@latest
```

Or install manually — clone and run:

```bash
git clone https://github.com/your-org/get-tests-done
cd get-tests-done
node bin/install.js --claude --local
```

**Verify:**
```
/qa:help
```

---

## Configuration

Settings stored in `.qa/config.json`. Configure during `/qa:discover` or update anytime.

| Setting | Options | Default | What it controls |
|---|---|---|---|
| `e2e.framework` | `cypress`, `playwright` | `playwright` | E2E test runner |
| `load.tool` | `k6`, `artillery` | `k6` | Load testing tool |
| `security.depth` | `quick`, `standard`, `deep` | `standard` | Security scan depth |
| `perf.budget` | object | see below | Core Web Vitals thresholds |
| `mode` | `interactive`, `yolo` | `interactive` | Auto-approve vs confirm |
| `commits` | `true`, `false` | `true` | Atomic git commits per test |

Default performance budget:
```json
{
  "lcp": 2500,
  "fid": 100,
  "cls": 0.1,
  "ttfb": 600,
  "fcp": 1800
}
```

---

MIT License. Build tests that don't rot.
