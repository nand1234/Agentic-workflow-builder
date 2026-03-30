# qa:coverage-gap

Find routes, endpoints, or requirements with no test coverage. Ranked by risk.

## Instructions

### Scan

1. Read all strategy files in `.claude/strategy/` — extract all requirements
2. Scan test files for scenario names and comments — find which REQ IDs are covered
3. Scan route files (`src/app/`, `pages/`, `routes/`, controller files) for endpoints not in any test

### Score each gap

- Critical: in a strategy as P1 with no test → score 5
- High: payment, auth, data mutation, no test → score 4
- Medium: protected route, no test → score 3
- Low: read-only, public, no test → score 1

### Output

```
Coverage Gap Analysis — [date]

Routes/endpoints found : [N]
Currently tested       : [N] ([N]%)
Untested               : [N]

Priority gaps (address in this order):

🔴 Critical — no tests, P1 requirement:
  1. REQ-03 in user-authentication — account lockout has no test
     → /qa:test the account locks after 5 failed login attempts
     → OR /qa:plan-e2e user-authentication (Mode 2, already has strategy)

🟠 High — no tests, high-risk area:
  2. POST /api/payments — payment processing, 0% coverage
     → /qa:test [describe the happy path]
     → /qa:strategy payment-flow (Mode 2 for full coverage)

🟡 Medium:
  3. /admin/users — admin panel, 0% coverage
     → /qa:test admin can deactivate a user account

Routes not in any strategy (newly discovered):
  - /api/webhooks/stripe — not tracked
  - /admin/exports — not tracked
```
