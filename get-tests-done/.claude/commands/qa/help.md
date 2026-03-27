# qa:help

Show all GET TESTS DONE commands with the correct workflow order.

## Instructions

Display the following help reference.

---

## GET TESTS DONE — Command Reference

### The Workflow (follow this order)

```
1. /qa:discover     ← Detect or scaffold test framework + write SKILL.md
2. /qa:strategy     ← Define requirements, acceptance criteria, build RTM
                       ⛔ HARD STOP — nothing proceeds until RTM is approved
3. /qa:plan-*       ← Plan ONLY what was approved in the strategy RTM
4. /qa:execute      ← Implement test code from approved plans
5. /qa:run          ← Run the suite, capture results
6. /qa:verify       ← Diagnose failures, create fix plans
7. /qa:report       ← Full coverage + RTM status report
```

---

### Step 1: Discovery

| Command | What it does |
|---|---|
| `/qa:discover` | Scan for existing test framework. If none: ask framework (Playwright/Cypress), test types (UI/API/both), data format, language. Scaffold DRY framework with Page Objects, auth fixtures, API helpers, env config. Write `.qa/SKILL.md`. |

---

### Step 2: Strategy — Hard Stop

| Command | What it does |
|---|---|
| `/qa:strategy` | Collect requirements + acceptance criteria. Build Requirement Traceability Matrix. Show RTM to user. **Will not save or continue until user types "confirmed".** Loops on feedback until approved. Saves to `.qa/strategy/[feature]-strategy.md`. |

---

### Step 3: Planning (RTM-scoped only)

| Command | What it does |
|---|---|
| `/qa:plan-e2e [feature]` | Plan Playwright/Cypress E2E specs — only requirements marked ✅ UI in RTM |
| `/qa:plan-load [feature]` | Plan k6 load scenarios + SLOs — only if RTM includes load |
| `/qa:plan-security` | Plan OWASP security tests — only if RTM includes security |
| `/qa:plan-performance` | Plan Lighthouse/Web Vitals budgets — only if RTM includes performance |

---

### Step 4–7: Build, Run, Fix, Report

| Command | What it does |
|---|---|
| `/qa:execute [plan]` | Implement test code from a `.qa/plans/` plan file. Follows DRY rules from SKILL.md. Atomic git commits per file. |
| `/qa:run [suite]` | Run `e2e` / `api` / `load` / `security` / `performance` suite. Saves timestamped results. |
| `/qa:verify` | Analyse results. Distinguish app bugs from test bugs. Create fix plans. |
| `/qa:report` | RTM coverage table + latest results. Shows which requirements have passing tests. |

---

### Utilities

| Command | What it does |
|---|---|
| `/qa:quick` | Ad-hoc test for one scenario — no plan cycle needed |
| `/qa:coverage-gap` | Find requirements or routes with no test coverage |
| `/qa:maintain` | Update tests broken by intentional app changes after a release |

---

### Files GTD Creates

```
.qa/
├── SKILL.md                           ← Framework conventions (read before writing tests)
├── strategy/
│   └── [feature]-strategy.md         ← Approved RTM — one file per feature
├── plans/
│   ├── e2e-[feature].md
│   ├── load-[feature].md
│   ├── security.md
│   └── performance.md
├── results/                          ← Timestamped run results
└── config.json

tests/
├── e2e/                              ← E2E specs
├── api/                              ← API specs
├── pages/                            ← Page Objects (DRY — selectors here only)
├── fixtures/                         ← Shared auth contexts (DRY — no repeated login)
├── helpers/                          ← ApiHelper, data generators
├── constants/                        ← Shared constants (no magic strings)
├── config/env.ts                     ← All env config (never import process.env in specs)
└── load/ | security/ | performance/
```

---

### Quick Start

```
/qa:discover
/qa:strategy
  → review RTM, type "confirmed"
/qa:plan-e2e [feature]
/qa:execute e2e-[feature]
/qa:run e2e
/qa:verify
/qa:report
```
