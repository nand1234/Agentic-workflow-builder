# qa:verify

Analyse the most recent test run results. Distinguish app bugs from test code issues. Create fix plans.

## Instructions

$ARGUMENTS optionally names a results file. Default: most recent file in `.claude/results/`.

### Triage failures

For each failing test, determine:

**App bug** — the feature is broken
- The test is correct, the app isn't doing what it should
- Document: what failed, which file/function is likely responsible, severity

**Test code issue** — the test has a bug
- Stale selector (component changed)
- Missing wait / race condition
- Wrong test data / state assumption
- Only fails in CI (environment difference)

**False alarm** — intentional app change broke the test
- A button label changed, API response field renamed, route moved
- Test needs updating to match the new intended behaviour

**Performance regression** — metric drifted
- Which metric, by how much, likely cause

### Create fix plans

Write `.claude/plans/fixes-[date].md`:

```markdown
# Fix Plan — [date]

## App Bugs (fix the application)

### [APP-001] — [severity]
Test: [test name]
What broke: [description]
Likely cause: [file:line if identifiable]
Impact: [what the user experiences]

## Test Code Fixes (fix the test)

### [TST-001] — selector stale
Test: [test name]
Problem: [data-testid="old-id"] not found — element was renamed
Fix: Change to `getByRole('button', { name: /new label/i })`
File: tests/e2e/[feature].spec.ts:[line]

## False Alarms (update the test)

### [UPD-001]
Test: [test name]
What changed in the app: [description]
Test update needed: [what assertion to change]
```

### Output

```
Verification complete — [suite] — [date]

[N] tests total | ✅ [N] passed | ❌ [N] failed

Failure breakdown:
  🔴 App bugs        : [N]  ← fix the application
  🟡 Test code issues: [N]  ← /qa:execute fixes-[date]
  ⚠️  False alarms   : [N]  ← tests need updating after intentional changes

Fix plan: .claude/plans/fixes-[date].md

[If app bugs:]
⚠️  App bugs require developer attention before tests will pass:
  [list bugs with severity]

[If test fixes:]
To fix test code:
  /qa:execute fixes-[date]
```
