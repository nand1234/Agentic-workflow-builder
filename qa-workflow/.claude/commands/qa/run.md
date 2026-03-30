# qa:run

Run a test suite and capture results. Works in both Mode 1 and Mode 2.

## Instructions

$ARGUMENTS: `e2e`, `api`, `load`, `security`, `performance`, or `all`. If empty, ask which suite.

Read `.claude/SKILL.md` and `.claude/config.json` to determine the framework and paths.

### Run the suite

**E2E — Playwright:**
```bash
npx playwright test tests/e2e/ \
  --reporter=html,json \
  --output=.claude/results/html-report
```

**E2E — Cypress:**
```bash
npx cypress run \
  --reporter json \
  --reporter-options "output=.claude/results/cypress-$(date +%Y%m%d-%H%M).json"
```

**API — Playwright:**
```bash
npx playwright test tests/api/ --reporter=line,json
```

**Load — k6:**
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

Save results to `.claude/results/[suite]-[timestamp].json`.

### Output

```
Run complete — [suite] — [timestamp]
Duration: [N]s

  ✅ Passed : [N]
  ❌ Failed : [N]
  ⚠️  Skipped: [N]

[If failures:]
Failed tests:
  ❌ [test name] — [error in one line]
  ❌ [test name] — [error in one line]

Results saved: .claude/results/[filename]

Next:
  /qa:verify  ← diagnose failures, create fix plans
  /qa:report  ← full coverage and status
```
