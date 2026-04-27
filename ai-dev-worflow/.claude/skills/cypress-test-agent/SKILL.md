---
name: cypress-test-agent
description: >
  Generates and updates Cypress tests by following existing test framework patterns and using a
  temporary inline scraper to extract real data-testid locators from the live app before writing
  assertions. Use this skill whenever the user wants to: add a new Cypress test, update an existing
  test due to new requirements or a changed user journey, add assertions for elements on a page that
  requires multi-step navigation to reach, or fix a failing test after a UI change. Trigger when
  the user says things like "write a test for", "update the test for", "the flow changed",
  "add assertions for X on the review page", "user now sees a new page before checkout",
  "automate this scenario", or any variation of "help me with a Cypress test". Always use this
  skill — do NOT write Cypress tests without going through the 4-step interview and scraper flow.
context: fork
agent: Framework Scanner Agent
---

# Cypress Test Agent

Generates accurate, framework-consistent Cypress tests in 4 steps:

1. **Confirm** — what to test, where to put it
2. **Navigate** — which existing test provides the nav sequence to reach the target page
3. **Assert** — which elements and what to check
4. **Build → Run → Fix → Clean** — inject scraper, run desktop, run mobile, strip scraper

The scraper is **temporary scaffolding only** — it is injected to discover real locators during
authoring and stripped from the final committed test. It never appears in the committed codebase.

---

## Before You Start — Load the Framework Profile

**Always do this first, before Step 1.**

Check whether `references/framework-profile.md` exists and is populated:

```bash
cat references/framework-profile.md 2>/dev/null | head -5
```

**If it exists and is populated:**
Read it in full. It tells you everything about auth, navigation, selector style,
naming conventions, and which test files cover which flows.
Do not re-scan the framework manually — trust the profile.

**If it does not exist or is empty:**
Invoke the Framework Scanner Agent in **initial scan mode** before proceeding.
```
→ Read agents/framework-scanner.md → Mode 1
→ Scanner populates references/framework-profile.md
→ Return here once done
```

**If the user says the framework has changed:**
Phrases like "I added a new command", "auth flow changed", "re-scan the framework",
"we refactored our helpers" — invoke the Framework Scanner Agent in **explicit re-scan mode**.
```
→ Read agents/framework-scanner.md → Mode 2
→ Scanner overwrites references/framework-profile.md with fresh data
→ Return here once done
```

The framework profile is the single source of truth for all conventions in Steps 2–4.

---

## Step 1 — Confirm the Scenario and Placement

Ask the user these two questions **together in one message**. Do not proceed until both are confirmed.

**Q1 — What is the test scenario?**

Ask the user to describe the user journey in plain English. Example:
> "User starts a session → opens experience page → sees review page → checks dates, add-ons,
> special request fields are visible → continues to checkout"

Repeat it back and ask: *"Is this correct?"* Do not move to Step 2 until confirmed.

**Q2 — Where should the test live?**

Ask:
> "Where should I add this test?
> 1. **Existing file** — which file?
> 2. **New describe block** — in which existing file?
> 3. **New test file** — what should it be called?"

Record: `TARGET_FILE`, `TARGET_SUITE` (describe block name if applicable).

---

## Step 2 — Identify the Navigation Sequence

The target page often cannot be reached by `cy.visit()` alone — it requires prior steps
(session setup, form interaction, button clicks) to build the correct application state.

### 2.1 Find the right existing test using the framework profile

Consult the **Test File Index** in `references/framework-profile.md`.
Match the user's described flow against the "Pages / flows covered" column.

Present the best match to the user:
> "The closest existing test I can see is `cypress/e2e/experience.cy.ts` which covers
> the experience detail → checkout flow. I'll use its navigation steps as the base.
> Does that sound right?"

If the user confirms, read that file:
```bash
cat cypress/e2e/<matched-file>.cy.ts   # or .js
```

If no match exists in the index, ask the user directly:
> "I don't have a test that covers this flow yet. Which existing test gets closest
> to the page you want to reach? I'll lift its navigation steps."

### 2.2 All framework conventions are already known

Do **not** re-read `cypress/support/commands.js` or `cypress/support/e2e.js` —
the framework profile already contains everything extracted from those files.

Use the profile directly for auth setup, navigation commands, selector style,
assertion style, naming conventions, and viewport handling.

If an existing test contradicts the profile, Section 2.4 handles that — the
drift detection flow will classify it and patch the profile if needed.

### 2.4 Extract the Navigation Sequence — with Drift Detection

As you read the existing test file, **actively compare every pattern against the
framework profile**. This is where drift surfaces.

Check each of the following while reading:

| What to compare | Example profile value | What to look for in the file |
|---|---|---|
| Selector style | `cy.getByTestId()` | Using this, or a different helper? |
| `data-testid` attribute name | `data-testid` | Using `data-cy`, `data-test-id`, etc.? |
| Auth / session command | `cy.startSession()` | Using a different command? |
| Navigation helpers | `cy.visitExperience()` | Using raw `cy.visit()` instead? |
| Assertion style | `.should('be.visible')` | Any custom matchers not in the profile? |

**If everything matches — continue normally.**

**If any contradiction is found — stop and invoke drift detection:**

```
DRIFT DETECTED in cypress/e2e/<filename>
  Profile says: <what the profile documents>
  File uses:    <what you actually found>
  Invoking Framework Scanner Agent — drift detection mode.
```

```
→ Read agents/framework-scanner.md → Mode 3
→ Scanner classifies: stale profile / outlier file / new pattern
→ Scanner patches the profile if needed and reports back
→ Resume here with the updated understanding
```

Do not guess which pattern is correct. Do not silently copy the drifted pattern.
Always let the scanner classify it first.

**Once drift is resolved (or if no drift), extract the nav sequence:**

Lift **only the steps that move state forward** — strip assertions and comments.

```js
// KEEP — moves state forward
cy.startSession()
cy.visitExperience({ id: 123 })
cy.get('[data-testid="btn-continue"]').click()

// STRIP — assertions, not navigation
cy.url().should('include', '/checkout')
cy.get('[data-testid="price-total"]').should('be.visible')
```

### 2.5 Identify the Stop Point

The stop point is where the target page is confirmed as loaded.
Look for a URL assertion or a landmark element, or ask the user:

> *"What URL or element confirms you're on the right page?"*

Record: `STOP_POINT` — the scraper is injected immediately after this.

---

## Step 3 — Confirm Assertions

Ask the user:
> "What do you want to assert on this page? For each item tell me:
> - The element (plain English — e.g. 'the check-in date field')
> - What to check (visible / contains text / is clickable / count / value)
>
> List as many as you need."

Record each as an assertion intent:
```
{ element: "check-in date field",    assert: "is visible" }
{ element: "add-ons section",        assert: "is visible" }
{ element: "special request input",  assert: "is visible" }
```

You do not know the `data-testid` values yet — the scraper in Step 4 reveals them.

---

## Step 4 — Build → Run → Fix → Clean

This loop runs twice: **desktop first, then mobile.**

---

### 4.1 Build the scraper-injected test

Construct the test using:
- The Framework Fingerprint (Step 2) — match all conventions
- The nav sequence (Step 2.4)
- The stop point (Step 2.5) as the page-ready signal
- The inline scraper below

```js
describe('<TARGET_SUITE>', () => {

  beforeEach(() => {
    // Mirror the beforeEach from the existing test exactly
    // e.g. cy.startSession()
  })

  it('<scenario from Step 1>', () => {

    // ── Navigation (lifted from existing test) ──────────────────────
    // <nav steps here>

    // ── Stop point — confirm page is loaded ─────────────────────────
    cy.url().should('include', '<target-path>')
    cy.get('body').should('be.visible')

    // ── SCRAPER — TEMPORARY. REMOVE BEFORE COMMIT ───────────────────
    cy.wait(500) // allow async content to settle
    cy.document().then(doc => {
      const locators = Array.from(doc.querySelectorAll('[data-testid]'))
        .map(el => {
          const style = window.getComputedStyle(el)
          const visible = (
            style.display     !== 'none'    &&
            style.visibility  !== 'hidden'  &&
            style.opacity     !== '0'       &&
            el.offsetParent   !== null
          )
          return {
            testId:      el.getAttribute('data-testid'),
            tag:         el.tagName.toLowerCase(),
            type:        el.getAttribute('type')        || null,
            role:        el.getAttribute('role')        || null,
            text:        (el.textContent || '').trim().slice(0, 80),
            placeholder: el.getAttribute('placeholder') || null,
            visible,
            duplicate: doc.querySelectorAll(
              `[data-testid="${el.getAttribute('data-testid')}"]`
            ).length > 1,
          }
        })
      cy.writeFile('cypress/locators-output.json', locators)
    })
    // ── END SCRAPER ──────────────────────────────────────────────────

    // ── Assertions (placeholders — fill after reading locators) ─────
    // cy.get('[data-testid="???"]').should('be.visible')

  })
})
```

Write this to `TARGET_FILE`.

---

### 4.2 Run on desktop and read locators

```bash
npx cypress run --spec "<TARGET_FILE>" --headless --quiet
```

Then read the output:
```bash
cat cypress/locators-output.json
```

For each assertion intent from Step 3, find the matching `testId`:

```json
[
  { "testId": "input-check-in-date",      "tag": "input",    "visible": true  },
  { "testId": "section-addons",           "tag": "div",      "visible": true  },
  { "testId": "textarea-special-request", "tag": "textarea", "visible": true  }
]
```

**Flag immediately if:**
- `"visible": false` for an element the user wants to assert — raise before writing the assertion
- `"duplicate": true` — flag as a bug; tests using this testId are unreliable
- **Element not in output at all** — no `data-testid` exists; tell the user and ask them to add one

---

### 4.3 Replace placeholder assertions with real ones

Use the matched `testId` values and the selector style from the Framework Fingerprint:

```js
// If the framework uses raw attribute selectors:
cy.get('[data-testid="input-check-in-date"]').should('be.visible')
cy.get('[data-testid="section-addons"]').should('be.visible')
cy.get('[data-testid="textarea-special-request"]').should('be.visible')

// If the framework uses a helper command:
cy.getByTestId('input-check-in-date').should('be.visible')
```

Never mix styles. Match exactly what the existing tests use.

---

### 4.4 Run desktop — confirm green

```bash
npx cypress run --spec "<TARGET_FILE>" --headless --quiet
```

If it fails, diagnose from the error output:
- Wrong selector → fix `testId`
- Timing issue → add a `cy.get('[data-testid="<landmark>"]').should('be.visible')` wait before the assertion
- Nav sequence missed a step → re-read the existing test, add the missing step

Repeat until fully green on desktop.

---

### 4.5 Run on mobile

Add a `context` block for mobile using the viewport convention from the Framework Fingerprint:

```js
context('Mobile', () => {

  beforeEach(() => {
    cy.viewport('iphone-x') // or the framework's mobile helper
    // repeat session/auth setup
  })

  it('<same scenario> — mobile', () => {

    // Same nav sequence
    // Same stop point

    // ── SCRAPER — TEMPORARY. REMOVE BEFORE COMMIT ─────────────────
    cy.wait(500)
    cy.document().then(doc => {
      const locators = Array.from(doc.querySelectorAll('[data-testid]'))
        .map(el => {
          const style = window.getComputedStyle(el)
          const visible = (
            style.display    !== 'none'   &&
            style.visibility !== 'hidden' &&
            style.opacity    !== '0'      &&
            el.offsetParent  !== null
          )
          return { testId: el.getAttribute('data-testid'), visible, tag: el.tagName.toLowerCase() }
        })
      cy.writeFile('cypress/locators-mobile.json', locators)
    })
    // ── END SCRAPER ────────────────────────────────────────────────

    // Assertions — cross-reference visible:false from mobile locator output
    // Do NOT assert .should('be.visible') on elements hidden at mobile breakpoints
    cy.get('[data-testid="input-check-in-date"]').should('be.visible')
  })

})
```

Run:
```bash
npx cypress run --spec "<TARGET_FILE>" --headless --quiet
```

Read `cypress/locators-mobile.json` — for any assertion intent where `visible: false` on mobile,
either replace with `.should('not.be.visible')` or omit the assertion entirely.
Note these differences in the final summary.

Repeat until fully green on mobile.

---

### 4.6 Strip the scraper — produce clean test

Once **desktop and mobile are both green**, remove all scraper blocks:

**Delete these sections entirely:**
```js
// ── SCRAPER — TEMPORARY. REMOVE BEFORE COMMIT ─
cy.wait(500)
cy.document().then(doc => { ... cy.writeFile(...) })
// ── END SCRAPER ────────────────────────────────
```

Delete the output files:
```bash
rm -f cypress/locators-output.json cypress/locators-mobile.json
```

The final test contains **only:**
- `beforeEach` setup (session / auth)
- Nav sequence
- Stop point / page-ready assertion
- Real assertions with confirmed `data-testid` selectors

---

### 4.7 Deliver

Present:
1. The clean final test (no scraper, fully green on desktop and mobile)
2. Short summary:
   - Assertions added with their `data-testid` values
   - Any elements with no `data-testid` (action items for the dev team)
   - Any elements visible on desktop but hidden on mobile (and how assertions were adjusted)
   - Any duplicate `data-testid` values flagged
3. Run command: `npx cypress run --spec "<TARGET_FILE>"`

---

## Edge Cases

| Situation | Action |
|---|---|
| Element has no `data-testid` | Flag to user. Do not generate a fragile CSS/XPath fallback. Ask them to add the attribute and re-run. |
| Duplicate `data-testid` on page | Flag as a bug. Do not write assertions against it until fixed. |
| Element visible on desktop, hidden on mobile | Adjust mobile assertion or omit. Note in summary. |
| Page has late-loading async content | Add `cy.get('[data-testid="<last-element>"]').should('be.visible')` before the scraper block instead of a bare `cy.wait()`. |
| Nav sequence doesn't reach the target page | Ask user for the missing step. Re-read the existing test. |
| `cy.writeFile` fails | Ensure `cypress/` directory exists. Pass `{ flag: 'w' }` as the third argument to overwrite. |
| Two different flows needed for desktop vs mobile | Run the scraper separately in each context block, write to different output files. |

---

## Reference Files

- `references/framework-profile.md` — **Read this first every time.** Auth, navigation, selectors,
  naming conventions, viewport patterns, the full test file index, **and the Running Tests
  section (preprod / review / devint invocation, `--expose` flag convention, `reviewdomain` slug,
  brand/country/language/grepTags matrix)**. Populated by the scanner agent.
- `references/selector-patterns.md` — Assertion cheat sheet, viewport helpers, selector anti-patterns.
- `agents/framework-scanner.md` — Sub-agent that scans the project and populates the framework profile.
  Invoke when the profile is missing or the framework has changed.