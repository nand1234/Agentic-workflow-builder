# qa:update_skill

Read the git diff, identify what changed in the app and tests, update `.claude/SKILL.md` to reflect reality. Single command — no questions, no phases, just diff in and accurate skill out.

---

## Instructions

You are the GTD Skill Updater. Read the diff, understand what changed, fix the skill. Fast and surgical — only update what the diff actually affects.

$ARGUMENTS = optional git ref (e.g. `HEAD~5`, `main..feature-branch`, `abc123..def456`). Default: `HEAD~1` (last commit).

---

## STEP 1 — Get the Diff

Run:

```bash
# Default: changes since last commit
git diff HEAD~1 HEAD

# If $ARGUMENTS provided:
git diff $ARGUMENTS
```

Also get the commit messages for context:
```bash
git log HEAD~1..HEAD --oneline
# or: git log $ARGUMENTS --oneline
```

If the working tree has unstaged changes, include them too:
```bash
git diff HEAD          # staged + unstaged vs last commit
git status --short     # overview of what's changed
```

---

## STEP 2 — Analyse What Changed

Read the full diff. Categorise every changed file into what it means for the skill:

### Application changes (affect SKILL.md)

| Changed file pattern | What it means for skill |
|---|---|
| `src/**/*.tsx` `src/**/*.jsx` — `data-testid` added/removed/renamed | Update selector inventory |
| `src/**/routes.*` `app/**/page.tsx` `pages/**` | Update ROUTES constants |
| `src/**/*.tsx` — component renamed or moved | Check Page Object locators still valid |
| `prisma/schema.*` `migrations/**` | Note schema changes that affect test data |
| API route files (`app/api/**` `routes/**` `controllers/**`) | Update API endpoint list |
| Auth middleware, auth config | Note auth flow changes |

### Test changes (update skill to document new patterns)

| Changed file pattern | What it means for skill |
|---|---|
| `tests/pages/*.ts` `cypress/support/pages/*.ts` — new file | Add Page Object to inventory |
| `tests/pages/*.ts` — methods added/changed | Update Page Object method list |
| `tests/constants/index.ts` — ROUTES/ERROR_MESSAGES changed | Update constants section |
| `tests/config/env.ts` — new env vars | Update required env vars |
| `playwright.config.ts` `cypress.config.ts` — config changed | Update framework config section |
| `tests/fixtures/*.ts` — auth pattern changed | Update auth section |
| `tests/helpers/*.ts` — new helpers | Document new utility |
| `.env.test.example` — new vars | Update env vars list |

### Red flags (broken references — fix immediately)

| Signal | Problem |
|---|---|
| `data-testid="X"` removed from component AND `getByTestId('X')` still in Page Object | Broken locator |
| Route path changed in app AND old path still in `ROUTES` constant | Stale route |
| Component file renamed/moved AND Page Object imports it | Broken import |
| `data-testid` renamed in component but not in Page Object | Silent test failure |

---

## STEP 3 — Fix Broken References

Before touching SKILL.md, fix any broken code the diff reveals.

### Broken locators

If a `data-testid` was renamed in the diff:

```bash
# Find old name in test files
grep -r "getByTestId('[old-name]')" tests/
grep -r "data-testid=\"[old-name]\"" tests/
```

Update in Page Object only — not in spec files:
```typescript
// Before
this.emailInput = page.getByTestId('email-input')
// After
this.emailInput = page.getByTestId('auth-email')
```

### Stale routes

If a route path changed in the diff, update `tests/constants/index.ts`:
```typescript
export const ROUTES = {
  LOGIN: '/auth/login',      // was '/login' — updated per commit abc123
  ...
}
```

Also update any Page Object `goto()` methods that use the old path directly (not via `ROUTES`).

### Stale fixtures

If auth flow changed (login URL moved, redirect target changed):
```typescript
// auth.fixture.ts — update to match new paths
await page.goto(`${env.baseUrl}/auth/login`)    // was /login
await page.waitForURL('**/app/dashboard')        // was **/dashboard
```

Commit all fixes together:
```
fix(tests): sync locators and routes with [brief description of app change]
```

---

## STEP 4 — Update .claude/SKILL.md

Open the current SKILL.md. Make only the changes the diff warrants — do not rewrite sections that weren't affected.

**Update the last-updated line:**
```markdown
_Last updated: [today] — synced with [commit hash or branch] ([one-line summary of what changed])_
```

**Per-section update rules:**

### Routes section
If any route was added, removed, or renamed in the diff:
```markdown
## Current Routes (ROUTES constant)

| Constant | Path | Notes |
|---|---|---|
| ROUTES.LOGIN | /auth/login | ← updated from /login |
| ROUTES.DASHBOARD | /app/dashboard | ← updated from /dashboard |
| ROUTES.SETTINGS_BILLING | /settings/billing | ← new |
```

### Page Objects section
If a Page Object was created or modified:
```markdown
## Current Page Objects

| Class | File | Key methods |
|---|---|---|
| LoginPage | tests/pages/LoginPage.ts | goto, loginWith, expectError |
| SettingsPage | tests/pages/SettingsPage.ts | goto, updateBilling — **NEW** |
```

### data-testid inventory section
If component files changed `data-testid` attributes:
```markdown
## data-testid Inventory (selected critical elements)

| Component | data-testid | Page Object |
|---|---|---|
| LoginForm.tsx | auth-email | LoginPage.emailInput ← renamed from email-input |
| LoginForm.tsx | auth-password | LoginPage.passwordInput ← renamed |
| PaymentForm.tsx | card-number | CheckoutPage.cardInput |
```

### Env vars section
If `.env.test.example` or `env.ts` changed:
```markdown
## Required Env Vars

[updated list — mark new ones with ← NEW]
```

### Changelog section
Always append:
```markdown
## Changelog

| Date | Commit | What changed in skill |
|---|---|---|
| [today] | [hash] | Updated ROUTES.LOGIN, ROUTES.DASHBOARD; fixed LoginPage locators; added SettingsPage |
| [prev] | [hash] | [previous entry] |
```

---

## STEP 5 — Output

```
✅ Skill updated

Diff analysed : [commit ref] — "[commit message]"
Files changed : [N] in app, [N] in tests

Skill changes:
  Routes updated     : [N]  (LOGIN, DASHBOARD)
  Page Objects added : [N]  (SettingsPage)
  Locators fixed     : [N]  (LoginPage — email-input → auth-email)
  Env vars updated   : [N]
  No changes needed  : [sections not affected]

[If broken references were fixed:]
Code fixes committed:
  fix(tests): sync locators and routes — [brief description]

SKILL.md updated: .claude/SKILL.md
  docs(skill): sync with [commit hash] — [date]

[If nothing needed updating:]
✅ No skill changes needed — diff had no impact on documented conventions.

[If diff is large / complex:]
⚠️  Large diff ([N] files). Review .claude/SKILL.md manually to confirm
    all sections are accurate — especially:
    [list any sections that had adjacent changes]
```

---

## Examples

### Single commit — button rename

```bash
/qa:update_skill
```

Diff shows: `data-testid="submit-order"` renamed to `data-testid="place-order-btn"` in `CheckoutForm.tsx`.

Result:
- Finds `getByTestId('submit-order')` in `CheckoutPage.ts` → updates to `place-order-btn`
- Updates data-testid inventory in SKILL.md
- Commits the fix
- Done in one pass

---

### Branch comparison — feature merge

```bash
/qa:update_skill main..feature/new-auth
```

Diff shows: new `/auth/login` route replacing `/login`, new `MFAPage` component, new `data-testid` attributes on auth forms, new `MFA_TOKEN` env var.

Result:
- Updates `ROUTES.LOGIN` in constants
- Updates `auth.fixture.ts` paths
- Adds `MFAPage` to Page Objects section in SKILL.md
- Adds `MFA_TOKEN` to env vars section
- Commits all fixes
- Updates SKILL.md changelog

---

### Large refactor

```bash
/qa:update_skill HEAD~10
```

Diff is large — 40 files changed.

Result:
- Analyses all changed files
- Fixes all broken locators and stale routes
- Updates SKILL.md
- Warns to manually review if diff was particularly complex
