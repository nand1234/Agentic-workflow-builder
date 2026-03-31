# GET TESTS DONE

**A two-mode QA automation system for Claude Code.**
Covers E2E (Playwright / Cypress), API, Load (k6), Security (OWASP), and Performance (Lighthouse).

```bash
npx get-tests-done@latest
```

---

## Two Modes

### Mode 1 — Quick (daily work)

For bug fixes, regressions, small features. One command, no ceremony.

```
/qa:discover                    ← once per project
/qa:test [describe it]          ← everything else
```

```
/qa:test the login form shows an error for an invalid email
/qa:test POST /api/orders returns 400 when items array is empty
/qa:test the dashboard redirects unauthenticated users to /login
/qa:test the checkout total updates when quantity changes
```

Reads your code → writes a properly structured test → runs it → commits it.

---

### Mode 2 — Structured (features, releases, compliance)

For significant features where you need requirement traceability or multi-suite coverage.

```
/qa:discover
/qa:strategy [feature]          ← requirements → RTM → hard stop for approval
/qa:plan-e2e [feature]          ← only after strategy confirmed
/qa:plan-load [feature]         ← only if RTM includes load
/qa:plan-security [feature]     ← only if RTM includes security
/qa:plan-performance [feature]  ← only if RTM includes performance
/qa:execute [plan]              ← implement the approved plan
/qa:run [suite]
/qa:verify
/qa:report
```

---

## Commands

| Command | Mode | What it does |
|---|---|---|
| `/qa:discover` | Both | Detect or scaffold framework. Write SKILL.md and coding standards. |
| `/qa:test [description]` | 1 | Plain English → production-quality test, committed. |
| `/qa:strategy [feature]` | 2 | Requirements → RTM → hard stop until user confirms. |
| `/qa:plan-e2e [feature]` | 2 | E2E test plan scoped to approved RTM. |
| `/qa:plan-load [feature]` | 2 | k6 load plan with SLOs. |
| `/qa:plan-security [feature]` | 2 | OWASP security plan. |
| `/qa:plan-performance [feature]` | 2 | Lighthouse / Web Vitals plan. |
| `/qa:execute [plan]` | 2 | Implement test code from a plan file. |
| `/qa:run [suite]` | Both | Run e2e / api / load / security / performance. |
| `/qa:verify` | Both | Diagnose failures. Distinguish app bugs from test bugs. |
| `/qa:report` | Both | Coverage + results across all suites. |
| `/qa:coverage-gap` | Both | Find untested routes and requirements. Ranked by risk. |
| `/qa:maintain` | Both | Fix tests broken by intentional app changes. |
| `/qa:help` | Both | Full command reference. |

---

## What /qa:discover Creates

```
tests/
├── e2e/                   ← E2E specs (one folder per feature)
├── api/                   ← API specs (no browser)
├── pages/
│   └── BasePage.ts        ← Extend per page — never modify
├── fixtures/
│   ├── index.ts           ← Import test+expect from here
│   └── auth.fixture.ts    ← Pre-auth contexts (DRY — no repeated login)
├── helpers/
│   ├── api.helper.ts      ← All HTTP calls go through this
│   └── data.helper.ts     ← Dynamic test data generators
├── constants/
│   └── index.ts           ← ROUTES, HTTP_STATUS, ERROR_MESSAGES
└── config/
    └── env.ts             ← All env config — never use process.env in tests

.claude/
├── SKILL.md                         ← Framework conventions (written by /qa:discover)
├── skills/
│   ├── playwright-standards.md      ← SOLID, DRY, patterns, anti-patterns
│   └── cypress-standards.md
├── strategy/                        ← Approved RTMs (Mode 2)
├── plans/                           ← Test plans (Mode 2)
└── results/                         ← Test run results
```

---

## Framework Standards

Both skill files cover:

- **SOLID principles** applied specifically to test code
- **Page Object Model** with full working examples
- **DRY rules** — where selectors, auth, URLs, constants must live
- **Selector priority** — `data-testid` → role → label → text → CSS (last resort)
- **Explicit waits only** — `waitForTimeout()` and `cy.wait(N)` are banned
- **Good vs bad** side-by-side examples
- **Pre-commit checklist** — 12 binary checks before any file is committed

---

## Installation

```bash
npx get-tests-done@latest
# or
git clone https://github.com/your-org/get-tests-done
node bin/install.js --claude --local
```

Verify in Claude Code:
```
/qa:help
```

---

## Which Mode?

| Situation | Use |
|---|---|
| Bug fix — want a regression test | `/qa:test [describe the bug scenario]` |
| Small feature addition | `/qa:test [describe the behaviour]` |
| Significant new feature | `/qa:strategy` → Mode 2 |
| Pre-release coverage check | `/qa:coverage-gap` |
| Tests broken after a refactor | `/qa:maintain` |
| Stakeholder needs traceability | `/qa:strategy` → Mode 2 |
| Security audit | `/qa:strategy` → `/qa:plan-security` |
| Load testing before launch | `/qa:strategy` → `/qa:plan-load` |

---

MIT License.
