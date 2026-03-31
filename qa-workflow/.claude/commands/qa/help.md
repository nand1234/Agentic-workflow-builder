# qa:help

Display the GET TESTS DONE command reference.

## Instructions

Display the following exactly.

---

## GET TESTS DONE — 9 Commands

```
/qa:discover      /qa:test        /qa:strategy     /qa:plan
/qa:execute_plan       /qa:run         /qa:report       /qa:migrate
/qa:update_skill
```

---

### MODE 1 — Quick (daily work)

```
/qa:discover                         ← once per project
/qa:test [describe it]               ← everything else
```

```
/qa:test the login form shows an error for an invalid email
/qa:test POST /api/orders returns 400 when items array is empty
/qa:test the Submit button was renamed to Place Order — update the tests
```

---

### MODE 2 — Structured (features, releases, compliance)

```
/qa:discover
/qa:strategy [feature]               ← requirements → RTM → hard stop
/qa:plan [type] [feature]            ← e2e | load | security | performance
/qa:execute_plan [plan]                   ← implement the approved plan
/qa:run [suite]                      ← run + diagnose + fix plans
/qa:report                           ← coverage + gaps + results
```

---

### Migration

```
/qa:migrate                          ← scan existing tests → scaffold → plan → implement
```

---

### Keep Skill Current

```
/qa:update_skill                     ← reads git diff (HEAD~1), fixes broken locators,
                                        updates SKILL.md to match what changed
/qa:update_skill HEAD~5              ← diff against 5 commits ago
/qa:update_skill main..feature-xyz   ← diff between branches
```

Run after any commit that renames components, changes routes, or adds data-testid attributes.

---

### All 9 Commands

| Command | What it does |
|---|---|
| `/qa:discover` | Detect or scaffold framework. Write SKILL.md and coding standards. |
| `/qa:test [description]` | Plain English → committed passing test. Handles maintenance too. |
| `/qa:strategy [feature]` | Requirements → RTM → hard stop until confirmed. |
| `/qa:plan [type] [feature]` | Scoped test plan. Types: `e2e` `load` `security` `performance` |
| `/qa:execute_plan [plan]` | Implement test code from an approved plan file. |
| `/qa:run [suite]` | Run tests, diagnose failures, create fix plans. |
| `/qa:report` | Coverage status, gaps by risk, latest results. |
| `/qa:migrate` | Migrate existing tests to new framework at full quality. |
| `/qa:update_skill [ref]` | Git diff → fix broken references → update SKILL.md. |

---

### Which command?

| Situation | Use |
|---|---|
| Bug fix / regression test | `/qa:test [describe the scenario]` |
| Test broken after UI change | `/qa:test [describe what changed]` |
| New significant feature | `/qa:strategy` → Mode 2 |
| Run the test suite | `/qa:run [e2e\|api\|load\|security\|all]` |
| What's not tested? | `/qa:report` |
| Migrating from Selenium / old framework | `/qa:migrate` |
| Just merged a PR — sync the skill | `/qa:update_skill` |
| Renamed components / routes | `/qa:update_skill` |
| Tests failing after a refactor | `/qa:update_skill` then `/qa:run` |

---

### Files

```
.claude/
├── SKILL.md                      ← framework conventions (kept current by update_skill)
├── skills/
│   ├── playwright-standards.md   ← SOLID, DRY, POM patterns, anti-patterns
│   └── cypress-standards.md
├── strategy/                     ← approved RTMs (Mode 2)
├── plans/                        ← test plans (Mode 2 + migrate)
└── results/                      ← run results + fix plans

tests/
├── e2e/       api/       load/
├── security/  performance/
├── pages/     fixtures/  helpers/
├── data/      constants/
└── config/env.ts
```
