# qa:report

Full QA status: coverage across all approved requirements, gaps ranked by risk, latest run results. Combines coverage reporting and gap analysis in one view.

---

## Instructions

Read all of:
- `.claude/SKILL.md`
- `.claude/strategy/` — all strategy files
- `.claude/plans/` — all plan files
- `.claude/results/` — all result files (sorted by date, latest per suite)

Scan `tests/` and route files (`src/app/`, `pages/`, `routes/`) to find actual current coverage.

---

### STEP 1 — Compute Requirements Coverage

For each strategy file, cross-reference RTM requirements against:
1. Whether a test plan exists for that requirement
2. Whether test files exist implementing that plan
3. Whether the latest run shows those tests passing

Status per requirement:
- ✅ Planned + implemented + passing
- ⚠️ Planned + implemented + failing
- 📋 Planned + not yet implemented
- ○ In RTM but no plan yet
- ❌ Not in any RTM (coverage gap)

---

### STEP 2 — Find Coverage Gaps

Scan route files and API handlers for endpoints/pages not covered by any test.

Score each gap:
- P1 requirement in strategy with no passing test → Critical
- Auth-related, payment, data mutation, no test → High
- Protected route, no test → Medium
- Read-only, public, no test → Low

---

### STEP 3 — Write .claude/REPORT.md

```markdown
# QA Report — [date]

## Summary

| Metric | Status |
|---|---|
| Requirements with passing tests | [N]/[N] ([N]%) |
| E2E pass rate | [N]% |
| Performance budget compliance | [N]% |
| Load SLO compliance | [N]% |
| Open security findings | [N] critical, [N] high |

## Requirements Coverage

[For each strategy file:]
### [feature] — [N]/[N] requirements passing

| REQ | Requirement | Priority | Status |
|---|---|---|---|
| REQ-01 | [req] | P1 | ✅ passing |
| REQ-02 | [req] | P1 | ⚠️ failing |
| REQ-03 | [req] | P2 | 📋 not implemented |

## Latest Results

### E2E — [date]
[N] passed | [N] failed | [N] skipped

### Performance — [date]
LCP: [N]ms (budget: [N]ms) [✅/❌]
CLS: [N] (budget: [N]) [✅/❌]

### Load — [date]
p95: [N]ms (SLO: [N]ms) [✅/❌]
Errors: [N]% (SLO: <0.1%) [✅/❌]

### Security — [date]
[N] critical | [N] high | [N] medium open findings

## Coverage Gaps (ranked by risk)

### 🔴 Critical
1. REQ-03 in [feature] — account lockout — no test implemented
   → /qa:test [plain English description]  OR  /qa:execute_plan [plan if exists]

2. POST /api/payments — payment processing — 0% coverage
   → /qa:test [description]  OR  /qa:strategy payment-flow (Mode 2)

### 🟠 High
[list]

### 🟡 Medium
[list]

### Routes not in any strategy (newly discovered)
- [route] — not tracked

## Open Issues
[From latest fix plans]

## Recommended Next Actions
1. [Most impactful gap]
2. [Most critical open failure]
3. [Performance regression if any]
```

---

### STEP 4 — Output

```
QA Report — [date]

Requirements: [N]/[N] passing ([N]%)
  [feature-1]: [N]/[N] ✅
  [feature-2]: [N]/[N] ⚠️

Latest runs:
  E2E         [N]/[N] passing
  Performance LCP [N]ms [✅/❌]
  Load        p95 [N]ms [✅/❌]
  Security    [N] open findings

Top gaps (by risk):
  🔴 [gap 1]  → /qa:test [description]
  🟠 [gap 2]  → /qa:plan [type] [feature]
  🟡 [gap 3]

Report saved: .claude/REPORT.md
```
