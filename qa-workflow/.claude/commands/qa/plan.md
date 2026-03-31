# qa:plan

**Mode 2 — create a scoped test plan.** Reads the approved strategy RTM and produces a detailed, executable plan for the specified test type. Only plans what the RTM approved.

Types: `e2e` | `load` | `security` | `performance`

Usage: `/qa:plan e2e user-authentication` or `/qa:plan load checkout-api`

---

## Instructions

$ARGUMENTS = `[type] [feature]` (e.g. "e2e user-authentication", "load checkout-api").

If empty, ask:
```
Plan type? e2e | load | security | performance
Feature name? (must match an approved strategy file)
```

### STEP 1 — Load and validate

Read:
1. `.claude/SKILL.md`
2. `.claude/skills/[framework]-standards.md`
3. `.claude/strategy/[feature]-strategy.md`

If strategy missing:
```
❌ No approved strategy for '[feature]'. Run /qa:strategy [feature] first.
```

Check RTM has the requested type marked ✅ for at least one requirement. If not:
```
The approved strategy for '[feature]' doesn't include [type] tests.
Run /qa:strategy [feature] to add them.
```

**Scope rule:** Only plan scenarios that map to RTM requirements marked ✅ for this type. No additions.

### STEP 2 — Analyse the codebase

Spawn a research agent to read — for RTM-relevant requirements only:

**For e2e:** component files, existing data-testid attributes, missing ones, existing Page Objects, API calls made during the flow, all UI states (loading, error, empty, success)

**For load:** endpoint paths, request/response shapes, auth required, rate limiting, database queries, likely bottlenecks (N+1 queries, missing indexes)

**For security:** user inputs, auth mechanism, IDOR risks (IDs in URLs), CORS config, security headers, injection surfaces

**For performance:** bundle sizes, image formats, render-blocking resources, third-party scripts, rendering strategy (SSR/CSR/SSG)

### STEP 3 — Create plan file

Create `.claude/plans/[type]-[feature].md`.

---

#### E2E plan structure

```markdown
# E2E Test Plan: [feature]
_Strategy: .claude/strategy/[feature]-strategy.md | Framework: [Playwright|Cypress] | Created: [date]_

## RTM Coverage
| REQ ID | Requirement | Scenarios planned |
|---|---|---|
| REQ-01 | [req] | happy path, error state |

## Missing data-testid (add before executing)
| Component | Element | data-testid to add |
|---|---|---|
| src/[component] | [element] | [id] |

## File structure
tests/e2e/[feature]/[feature].spec.ts
tests/pages/[Feature]Page.ts  ← create if missing
tests/data/[feature].json

## Page Object spec
[TypeScript interface showing required locators and methods]

## Scenarios
<scenario id="1" req="REQ-01" priority="P1">
  <n>[plain English]</n>
  <auth>none | standard-user | admin</auth>
  <preconditions>[exact state needed]</preconditions>
  <steps>[numbered steps with selector/action pairs]</steps>
  <assertions>[specific, testable outcomes]</assertions>
</scenario>

[one per RTM requirement marked ✅ UI/E2E]

## Test data
[JSON structure needed]

## CI snippet
[GitHub Actions yaml for this suite]
```

---

#### Load plan structure

```markdown
# Load Test Plan: [feature]
_Tool: k6 | Created: [date]_

## Endpoints under test
| Endpoint | Method | Auth | Target p95 |

## SLOs
| Metric | Threshold | Severity |
| p95 | < 500ms | error |
| error rate | < 0.1% | error |

## Scenarios
1. Baseline — 5 VUs, 30s (run first, always)
2. Average load — ramp to [N] VUs, hold 4m
3. Spike — 5 → [10x] VUs in 10s, hold 1m, recover
4. Soak — [N] VUs, 60min (weekly, not every CI run)

## k6 script spec
[k6 options, stages, thresholds, token pool approach]

## Likely bottlenecks (fix before running)
[from code analysis]

## Run commands
[k6 run commands for each scenario]
```

---

#### Security plan structure

```markdown
# Security Test Plan: [feature]
_Created: [date]_

## Threat model
| Risk | OWASP | Severity | Likelihood |

## Test suites (scoped to approved RTM only)

### Auth & brute force (if auth in scope)
<test id="auth-01" req="REQ-[N]" severity="critical">
  <n>[description]</n>
  <method>fetch script | Playwright</method>
  <action>[exact attack + assertions]</action>
  <pass>[what passing looks like]</pass>
</test>

### Access control (if protected resources in scope)
[IDOR tests, privilege escalation]

### Injection (if user input in scope)
[SQLi, XSS payloads and assertions]

### Security headers
[header presence checks]

## File structure
tests/security/[feature]-[suite].security.ts
tests/security/helpers/two-account.ts
tests/security/helpers/payloads.ts

## Run commands
⚠️ Staging only — never production
```

---

#### Performance plan structure

```markdown
# Performance Test Plan: [feature]
_Tool: Lighthouse CI | Created: [date]_

## Pages under test
| Page | URL | Priority |

## Budgets
| Metric | Target | Google threshold |
| LCP | < [N]ms | < 2500ms |
| CLS | < [N] | < 0.1 |
| JS bundle | < [N]KB | — |

## Lighthouse CI config (lighthouserc.js)
[full config with assert thresholds from budgets]

## Scenarios
1. Desktop baseline
2. Mobile 3G
3. Bundle regression check
4. Image optimisation check

## Known issues to fix first
[from asset analysis — ordered by LCP/score impact]

## CI integration
[GitHub Actions yaml]
```

---

### STEP 4 — Output

```
✅ Plan created: .claude/plans/[type]-[feature].md

RTM requirements covered: [N]
[Type-specific summary — scenarios, SLOs, test count, etc.]

[If e2e — list missing data-testid to add first]
[If load — list top bottlenecks to fix first]
[If security — list likely issues from code analysis]

Next: /qa:execute_plan [type]-[feature]
```
