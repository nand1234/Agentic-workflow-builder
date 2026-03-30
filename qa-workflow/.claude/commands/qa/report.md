# qa:report

Generate a full status report — coverage, latest results, open issues.

## Instructions

Read all of: `.claude/SKILL.md`, `.claude/strategy/` (all files), all files in `.claude/results/`, all files in `.claude/plans/`.

### Build the report

**Coverage:** For each strategy file found, map requirements to test status (passing ✅ / failing ❌ / not implemented yet ○).

**Results:** Latest run per suite — pass rate, key metrics.

**Open issues:** Unresolved items from verify runs.

Write `.claude/REPORT.md` and display a summary:

```
QA Report — [date]

Overall: [N]% of approved requirements have passing tests

By suite:
  E2E          [N]/[N] scenarios passing ([N]%)
  API          [N]/[N] passing
  Load         p95 [N]ms vs [N]ms SLO [✅/❌]
  Security     [N] open findings ([N] critical)
  Performance  LCP [N]ms vs [N]ms budget [✅/❌]

Requirements coverage (from approved strategies):
  [feature-1]: [N]/[N] REQs with passing tests
  [feature-2]: [N]/[N] REQs with passing tests

Open issues:
  🔴 [N] app bugs
  🟡 [N] test fixes needed

Report saved: .claude/REPORT.md
```
