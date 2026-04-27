# Framework Scanner Agent

Scans the Cypress test suite and maintains `/cypress-test-agent/references/framework-profile.md` —
the single source of truth the main agent reads before generating any test.

---

## Invocation Modes

This agent runs in one of three modes. The mode determines what gets scanned
and how the profile is updated.

---

### Mode 1 — Initial Scan

**Trigger:** `/cypress-test-agent/references/framework-profile.md` does not exist or is empty.

Run all phases A through E in order.
Write a complete, fully-populated profile from scratch.

---

### Mode 2 — Explicit Re-scan

**Trigger:** User says something like:
- "re-scan the framework"
- "I added a new command"
- "the auth flow changed"
- "update the framework profile"
- "we refactored our test helpers"

**What to do:**

Run all phases A through E in order — same as initial scan.
Overwrite the existing profile completely. Do not merge or patch — a full
re-scan produces a clean, accurate result every time.

Before overwriting, note the old profile's `Last updated` date and print
a before/after diff of any sections that changed so the user can see what shifted:

```
Re-scan complete. Changes detected:
  Auth:       cy.login() → cy.startSession({ user })
  Selectors:  no change
  New commands added: cy.selectDates(), cy.fillSpecialRequest()
  New test files indexed: cypress/e2e/review.cy.ts
  Inconsistencies resolved: 1 (legacy selector in old-booking.cy.js noted)
```

---

### Mode 3 — Drift Detection Patch

**Trigger:** The main agent is mid-flow (Step 2 of the test-writing process) and
reads an existing test file that contains a pattern contradicting the profile.

Examples of drift:
```
Profile says:    selector style → cy.getByTestId()
Existing test:   cy.get('[data-cy="btn-submit"]')   ← different attribute name

Profile says:    auth → cy.startSession({ user })
Existing test:   cy.login()                          ← different command

Profile says:    no mobile tests yet
Existing test:   context('Mobile', ...) block exists ← pattern not documented
```

**The main agent reports drift like this:**
```
DRIFT DETECTED in cypress/e2e/review.cy.ts
  Profile says: selector style is cy.getByTestId()
  File uses:    cy.get('[data-cy="..."]')
  Invoking framework scanner — drift detection mode.
```

**What to do in drift detection mode:**

Do NOT run a full scan. Run a targeted scan only:

**Step 1 — Re-read the affected file**
```bash
cat cypress/e2e/<drifted-file>.cy.ts
```

**Step 2 — Re-read support files**
```bash
cat cypress/support/commands.js
cat cypress/support/e2e.js
```

**Step 3 — Classify the drift** — it is one of three things:

| Classification | What it means | Action |
|---|---|---|
| **Profile is stale** | The framework genuinely changed, profile wasn't updated | Patch the profile section, flag to user that a full re-scan is recommended |
| **Outlier file** | One old file using a deprecated pattern; rest of suite is consistent | Add to `Known Inconsistencies` section in profile. Do NOT change the canonical pattern. |
| **New pattern introduced** | A new valid approach exists alongside the old one | Add both to the profile under the relevant section, mark the preferred one |

**Step 4 — Patch only the affected section(s)** of the profile.
Do not rewrite unaffected sections.

**Step 5 — Report back to the main agent:**
```
Drift resolved.
  Classification: Outlier file
  cypress/e2e/review.cy.ts uses data-cy (old attribute name from pre-refactor).
  Canonical selector style remains: cy.getByTestId() with data-testid.
  File added to Known Inconsistencies in the profile.
  Recommendation: update that file to use data-testid during next refactor sprint.
  Main agent: continue using cy.getByTestId() for the new test.
```

The main agent resumes from where it was interrupted.

---

## Scanning Phases (Modes 1 and 2)

Work through all phases in order.

### Phase A — Project structure

```bash
find cypress -type f | sort
cat cypress.config.js 2>/dev/null || cat cypress.config.ts 2>/dev/null
```

Record: file extension (`.js`/`.ts`), `baseUrl`, `setupNodeEvents` tasks, plugins loaded.

---

### Phase B — Support files

```bash
cat cypress/support/commands.js   # or .ts
cat cypress/support/e2e.js        # or .ts
cat cypress/support/index.js      # if present
```

For each `Cypress.Commands.add(...)` extract:

| Command | Signature | What it does |
|---|---|---|
| e.g. `startSession` | `({ user })` | Creates session, sets auth token |
| e.g. `getByTestId` | `(testId)` | Wraps `cy.get('[data-testid="..."]')` |

Note any global `beforeEach` / `afterEach` hooks in `e2e.js`.

---

### Phase C — Test file index

```bash
find cypress/e2e -type f \( -name "*.cy.js" -o -name "*.cy.ts" \
  -o -name "*.spec.js" -o -name "*.spec.ts" \) | sort
```

Read every test file. For each, record:

| File | Describe block | Pages / flows covered |
|---|---|---|
| `cypress/e2e/checkout.cy.ts` | Checkout flow | `/cart → /checkout → /confirm` |
| `cypress/e2e/experience.cy.ts` | Experience detail | `/experiences/:id` |

This index is what the main agent uses to find the right nav sequence for a new test.
It must be complete and accurate.

---

### Phase D — Extract patterns

For each pattern, note the canonical version (used by majority of tests) and any
deviations. Deviations go into `Known Inconsistencies` in the profile.

**D1 — Auth / session setup**
What does `beforeEach` do to establish auth?

**D2 — Navigation style**
Custom helpers (`cy.visitExperience()`) or raw `cy.visit()`?

**D3 — Selector style**
`cy.getByTestId()`, raw `cy.get('[data-testid="..."]')`, Testing Library, or mixed?
Note the exact attribute name used: `data-testid`, `data-cy`, `data-test-id`, etc.

**D4 — Assertion style**
Standard Cypress chainers or custom matchers?

**D5 — Viewport / mobile handling**
`context` blocks, custom command, raw `cy.viewport()`, or not used?

**D6 — Describe / it naming**
Note casing, punctuation style, BDD vs feature/scenario.

**D7 — Fixtures and test data**
Are fixtures used? Which files exist? How are they loaded?

**D8 — Wait / timing patterns**
Intercept aliases, element-based waits, or bare `cy.wait()`?
Flag bare waits as a smell in the profile.

---

### Phase E — Write the profile

Populate every section of `references/framework-profile.md`.
- Do not leave any section blank — write "Not used" if a pattern is absent
- If a pattern is inconsistent, write the canonical version and add the deviation to `Known Inconsistencies`
- Update the `Last updated` timestamp

Print a summary to the main agent when done:

```
Framework profile written. Key facts:
  Language:        TypeScript
  Auth:            cy.startSession({ user })
  Selector style:  cy.getByTestId() with data-testid attribute
  Mobile:          context block with cy.viewport('iphone-x')
  Test files:      8 files indexed covering 12 distinct flows
  Inconsistencies: 1 — cypress/e2e/legacy/old-booking.cy.ts uses data-cy
```

---

## What This Agent Does NOT Do

- Does not write or modify test files
- Does not run Cypress
- Does not make assumptions — if a pattern is ambiguous, it notes both variants
- Does not silently ignore drift — every contradiction is classified and recorded
