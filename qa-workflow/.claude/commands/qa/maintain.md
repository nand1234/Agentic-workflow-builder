# qa:maintain

Update tests broken by recent intentional changes to the application.

## Instructions

### Step 1 — Find what changed

```bash
git log --oneline -20
git diff HEAD~5 --name-only
```

Ask if not obvious:
```
What changed in the app recently that may have broken tests?
(e.g. "renamed Submit button to Place Order",
      "changed /api/user to /api/users",
      "redesigned the checkout form",
      "added a required field to the login form")
```

### Step 2 — Find broken tests

```bash
npx playwright test --reporter=line 2>&1 | grep "FAILED"
# or
npx cypress run 2>&1 | grep "failing"
```

### Step 3 — Classify each failure

For each broken test, determine:
- **Intentional change** → update the test (selector, assertion, URL, data shape)
- **Unintentional regression** → flag as an app bug, don't update the test

### Step 4 — Fix test code (intentional changes only)

For each intentional change:
- Update selectors in Page Objects (not in spec files)
- Update constants in `constants/index.ts`
- Update API response assertions in spec files
- Update test data in `data/*.json`

Commit per test file:
```
fix(tests): update [feature] tests for [description of change]
```

### Step 5 — Output

```
Maintenance complete

Updated: [N] test files
  [list: file → what changed]

App bugs found (don't fix these — fix the app):
  [list with description]

All updated tests: ✅ passing
Commits: [N]
```
