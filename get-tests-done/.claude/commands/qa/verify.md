# qa:verify

Analyse test results, diagnose failures, and produce fix plans ready for `/qa:execute`. Distinguishes between test bugs vs application bugs.

## Instructions

You are the GTD Verification Orchestrator.

$ARGUMENTS can optionally specify a results file. If empty, read the most recent file in `.qa/results/`.

### Step 1: Load Results

Read the latest results file. Parse failure details: test name, error message, stack trace, screenshot (if Playwright), timing.

### Step 2: Triage Failures

For each failing test, spawn a diagnostic agent:

> "Analyse this test failure: [paste failure]. Determine:
> 1. Is this a TEST bug (wrong selector, timing issue, bad assertion) or an APPLICATION bug (feature broken)?
> 2. Root cause — be specific.
> 3. Fix recommendation — concrete code change.
> 4. Estimated fix time."

### Step 3: Categorise

Group failures:

**Application bugs** (feature is broken):
- Describe the bug
- Affected code location
- Severity: critical/high/medium

**Test bugs** (test code issue):
- Selector stale/wrong
- Race condition (missing wait)
- Bad test data / state assumption
- Environment-specific (only fails in CI)

**Performance regressions** (for perf/load suites):
- Which metric degraded
- By how much vs baseline
- Likely cause

**False alarms** (tests that need updating due to intentional changes):
- What changed in the app
- What the test assertion needs updating to

### Step 4: Create Fix Plans

For each failure, create a fix plan entry in `.qa/plans/fixes-[date].md`:

```markdown
# Fix Plan — [date]

## Application Bugs

### [BUG-001] [Test name] — [severity]
**What broke:** [description]
**Root cause:** [specific cause]
**Fix location:** [file:line]
**Fix:** [exact code change]

## Test Code Fixes

### [FIX-001] Selector stale — [test name]
**Problem:** data-testid="old-id" no longer exists
**Fix:** Change to getByRole('button', { name: 'Submit' })
**File:** tests/e2e/[feature].spec.ts:[line]

## Performance Regressions

### [PERF-001] LCP regression on /dashboard
**Before:** 1800ms | **After:** 3200ms | **Delta:** +1400ms (+78%)
**Likely cause:** [identified from bundle diff / code change]
**Fix:** [recommendation]
```

### Step 5: Present Summary

```
Verification complete — [suite] — [date]

Total: [N] tests | ✅ [N] passed | ❌ [N] failed

Failure breakdown:
  🔴 Application bugs: [N] — features are broken
  🟡 Test code issues: [N] — tests need fixing
  ⚠️  False alarms: [N] — tests need updating for intentional changes
  📉 Performance regressions: [N]

Fix plan saved: .qa/plans/fixes-[date].md

Critical application bugs requiring immediate attention:
  1. [BUG-001]: [description]

To fix:
  Application bugs → fix the code, then /qa:run [suite]
  Test code fixes  → /qa:execute fixes-[date]
  
/qa:report — generate full status report
```
