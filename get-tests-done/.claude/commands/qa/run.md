# qa:run

Run a test suite and capture timestamped results. Supports: e2e, performance, load, security, or all.

## Instructions

$ARGUMENTS contains the suite name: `e2e`, `performance`, `load`, `security`, or `all`. If empty, ask which suite to run.

Read `.qa/config.json` to determine tools and settings.

### Execute the Run

**E2E (Playwright):**
```bash
npx playwright test tests/e2e/ \
  --reporter=html,json \
  --output=.qa/results/playwright-$(date +%Y%m%d-%H%M)
```

**E2E (Cypress):**
```bash
npx cypress run \
  --reporter json \
  --reporter-options "output=.qa/results/cypress-$(date +%Y%m%d-%H%M).json"
```

**Performance:**
```bash
npx lhci autorun --config=lighthouserc.js
```

**Load (k6):**
```bash
k6 run tests/load/[target].k6.js \
  --out json=.qa/results/load-$(date +%Y%m%d-%H%M).json
```

**Security:**
```bash
npx playwright test tests/security/ --reporter=html,json
```

Stream output to the terminal. After completion, save results to `.qa/results/`.

### Summarise Results

After the run, parse output and display:

```
Run complete: [suite] — [date/time]
Duration: [N]s

Results:
  ✅ Passed: [N]
  ❌ Failed: [N]
  ⚠️  Skipped: [N]
  
[If failures:]
Failed tests:
  ❌ [test name] — [error snippet]
  ❌ [test name] — [error snippet]

Results saved: .qa/results/[filename]

Next: /qa:verify — analyse failures and create fix plans
      /qa:report — generate full coverage report
```
