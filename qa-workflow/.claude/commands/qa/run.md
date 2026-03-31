# qa:run

Run a test suite, capture results, diagnose failures, and produce fix plans — all in one step. Works in both Mode 1 and Mode 2.

---

## Instructions

$ARGUMENTS = suite name: `e2e` | `api` | `load` | `security` | `performance` | `all`

If empty, ask which suite to run.

Read `.claude/SKILL.md` for framework and paths.

---

### STEP 1 — Run

**Playwright (e2e or api):**
```bash
npx playwright test tests/[suite]/ \
  --reporter=html,json \
  --output=.claude/results/html-report
```

**Cypress:**
```bash
npx cypress run \
  --reporter json \
  --reporter-options "output=.claude/results/cypress-$(date +%Y%m%d-%H%M).json"
```

**k6 (load):**
```bash
k6 run tests/load/[target].k6.js \
  --out json=.claude/results/load-$(date +%Y%m%d-%H%M).json
```

**Security:**
```bash
npx playwright test tests/security/ --reporter=html,json
```

**Performance:**
```bash
npx lhci autorun --config=lighthouserc.js
```

Stream output. Save results to `.claude/results/[suite]-[timestamp].json`.

---

### STEP 2 — Diagnose Failures

If any tests failed, analyse each one immediately. Classify:

**App bug** — feature is broken, test is correct
- Document: what failed, likely file/function responsible, severity

**Test code issue** — test has a bug
- Stale selector (component changed)
- Race condition / missing wait
- Wrong test data or state assumption
- Only fails in CI (environment difference)

**False alarm** — intentional app change broke the test
- Button label changed, route renamed, API response field renamed
- Test needs updating to match new intended behaviour

**Performance regression** (perf/load)
- Which metric, by how much, likely cause

---

### STEP 3 — Create Fix Plans (if failures exist)

Write `.claude/plans/fixes-[date].md`:

```markdown
# Fix Plan — [date]

## App Bugs (fix the application, not the test)
### [APP-001] — [severity]
Test: [test name]
What broke: [description]
Likely cause: [file:line if identifiable]

## Test Code Fixes (fix the test)
### [TST-001] — stale selector
Test: [test name]
Problem: data-testid="old-id" not found
Fix: Change to getByRole('button', { name: /new label/i })
File: tests/e2e/[feature].spec.ts:[line]

## False Alarms (update the test)
### [UPD-001]
Test: [test name]
What changed in app: [description]
Update needed: [what to change]
To fix: /qa:test [describe what changed]

## Performance Regressions
### [PERF-001]
Metric: LCP — Before: 1800ms | After: 3200ms | Delta: +78%
Likely cause: [from bundle/code analysis]
Fix: [recommendation]
```

---

### STEP 4 — Output

```
Run complete — [suite] — [timestamp]
Duration: [N]s

  ✅ Passed : [N]
  ❌ Failed : [N]
  ⚠️  Skipped: [N]

[If all passing:]
All tests green ✅
Run /qa:report for full coverage overview.

[If failures:]
Failure breakdown:
  🔴 App bugs         : [N]  ← fix the application
  🟡 Test code issues : [N]  ← /qa:test [describe the fix]
  ⚠️  False alarms    : [N]  ← /qa:test [describe what changed]
  📉 Perf regressions : [N]

Fix plan: .claude/plans/fixes-[date].md

[App bugs — list with severity:]
  ❌ [APP-001] critical — [description]

[Test fixes — use /qa:test to fix:]
  To fix test issues: /qa:test [describe the change that broke the test]

Results saved: .claude/results/[filename]
```
