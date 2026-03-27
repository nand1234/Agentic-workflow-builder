# qa:report

Generate a full QA status report: coverage across all suites, latest results, open issues, and trend over time. Saves to `.qa/REPORT.md` and outputs a readable summary.

## Instructions

### Step 1: Gather Data

Read all of:
- `.qa/QA-STRATEGY.md`
- `.qa/COVERAGE-MAP.md`
- `.qa/config.json`
- All files in `.qa/results/` (sorted by date)
- All files in `.qa/plans/`

### Step 2: Compute Coverage

For each tracked route/endpoint in COVERAGE-MAP.md, determine:
- E2E coverage: ✅ / ❌ / ⚠️ partial
- Performance coverage: ✅ / ❌ / ⚠️ partial
- Load coverage: ✅ / ❌ / ⚠️ partial
- Security coverage: ✅ / ❌ / ⚠️ partial

Calculate:
- Overall coverage %
- Coverage % per suite
- Coverage % for critical flows specifically

### Step 3: Latest Results Summary

From the most recent run results for each suite:
- Pass rate
- Flaky test rate (tests that sometimes pass/sometimes fail)
- Performance scores vs budgets
- Load test: p95/p99/error rate vs SLOs
- Security: open findings by severity

### Step 4: Write REPORT.md

Create `.qa/REPORT.md`:

```markdown
# QA Status Report

_Generated: [date] | By: GET TESTS DONE_

## Executive Summary

| Metric | Status |
|---|---|
| Overall Test Coverage | [N]% |
| E2E Pass Rate | [N]% |
| Perf Budget Compliance | [N]% |
| Load Test SLO Compliance | [N]% |
| Open Security Findings | [N] critical, [N] high |

## Coverage by Suite

### E2E (Cypress / Playwright)
- Total scenarios: [N]
- Passing: [N] ✅
- Failing: [N] ❌
- Not implemented: [N]
- Critical flows covered: [N]/[N] ([N]%)

### Performance (Lighthouse CI)
- Pages under test: [N]
- Passing all budgets: [N] ✅
- Budget violations: [N] ❌
- Worst performer: [page] — LCP [N]ms

### Load (k6 / Artillery)
- Endpoints under test: [N]
- Meeting SLOs: [N] ✅
- SLO violations: [N] ❌
- p95 response time: [N]ms (SLO: [N]ms)

### Security
- OWASP categories tested: [N]/10
- Critical findings: [N]
- High findings: [N]
- Resolved since last report: [N]

## Coverage Map

[Full route/endpoint coverage table from COVERAGE-MAP.md]

## Open Issues

### Critical (fix before next release)
[List of critical bugs and security findings]

### High
[List of high-priority items]

## Trends

[If multiple results exist — show pass rate trend over last N runs]
[Show performance score trends over time]

## Recommended Next Actions

1. [Most impactful coverage gap to fill]
2. [Most critical open issue to fix]
3. [Performance regression to address]
```

### Step 5: Output Summary

```
✅ Report generated: .qa/REPORT.md

Coverage: [N]% overall
  E2E: [N]% | Perf: [N]% | Load: [N]% | Security: [N]%

Latest run health:
  E2E: [N]/[N] passing ([N]%)
  Perf: LCP [N]ms (budget: [N]ms) [✅/❌]
  Load: p95 [N]ms, errors [N]% [✅/❌]
  Security: [N] open findings

Top priority actions:
  1. [action]
  2. [action]
  3. [action]
```
