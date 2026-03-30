# qa:help

Display the GET TESTS DONE command reference.

## Instructions

Display the following exactly.

---

## GET TESTS DONE

Two modes. Use the one that fits the work.

---

### MODE 1 — Quick (daily work)

For bug fixes, small features, regressions, ad-hoc tests.
**One command. No planning. No ceremony.**

```
/qa:discover          ← run once per project to set up the framework
/qa:test [describe it in plain English]
```

Examples:
```
/qa:test the login form shows an error for an invalid email address
/qa:test the checkout total updates when quantity is changed
/qa:test POST /api/orders returns 400 when items array is empty
/qa:test the dashboard redirects unauthenticated users to /login
```

That's it. Reads your code, writes the test, runs it, commits it.

---

### MODE 2 — Structured (new features, releases, compliance)

For significant features where you need requirements traceability,
multi-suite coverage, or stakeholder sign-off.

```
/qa:discover          ← run once per project
/qa:strategy          ← requirements → RTM → approval gate (hard stop)
/qa:plan-e2e          ← only after strategy approved
/qa:plan-load         ← only if RTM includes load tests
/qa:plan-security     ← only if RTM includes security
/qa:plan-performance  ← only if RTM includes performance
/qa:execute [plan]    ← implement the approved plan
/qa:run [suite]       ← run it
/qa:verify            ← diagnose failures
/qa:report            ← coverage + results
```

---

### Migration (existing tests → new framework)

```
/qa:migrate           ← scan existing tests → choose target framework →
                         scaffold framework → create migration plans →
                         implement every test to framework standard
```

Works from any source: Selenium, Protractor, Puppeteer, TestCafe, old Cypress, Jest/JSDOM.

---

### Maintenance

```
/qa:coverage-gap      ← find untested routes/endpoints before a release
/qa:maintain          ← fix tests broken by intentional app changes
```

---

### Which mode should I use?

| Situation | Mode |
|---|---|
| Fixing a bug and want a regression test | Mode 1 — `/qa:test` |
| Adding a small improvement | Mode 1 — `/qa:test` |
| Building a significant new feature | Mode 2 |
| Migrating existing tests to a new framework | `/qa:migrate` |
| Pre-release coverage check | `/qa:coverage-gap` |
| Tests broken after a refactor | `/qa:maintain` |
| Stakeholder needs test traceability | Mode 2 |
| Security audit requirement | Mode 2 — `/qa:plan-security` |
| Load testing before a launch | Mode 2 — `/qa:plan-load` |

---

### Files

```
.claude/
├── SKILL.md                     ← Framework conventions (auto-generated)
├── skills/
│   ├── playwright-standards.md  ← Playwright coding rules
│   └── cypress-standards.md     ← Cypress coding rules
├── strategy/
│   └── [feature]-strategy.md   ← Approved RTM (Mode 2 only)
└── plans/
    └── [type]-[feature].md      ← Test plans (Mode 2 only)

tests/                           ← All generated test code lives here
├── e2e/
├── api/
├── pages/                       ← Page Objects
├── fixtures/                    ← Auth fixtures
├── helpers/                     ← ApiHelper, data helpers
├── constants/                   ← ROUTES, HTTP_STATUS, ERROR_MESSAGES
└── config/env.ts                ← All env config
```
