# qa:plan-load

**Mode 2 — structured planning.** Creates a k6 load test plan scoped to what the approved RTM requires. Run `/qa:strategy` first.

---

## Instructions

$ARGUMENTS is the feature name matching an approved strategy (e.g. "checkout-flow").

### STEP 1 — Load and validate

Read: `.claude/SKILL.md`, `.claude/strategy/[feature]-strategy.md`

If strategy missing → stop: `❌ Run /qa:strategy [feature] first.`

Check RTM has Load column with at least one ✅. If not:
```
The approved strategy for '[feature]' doesn't include load tests.
Update the strategy via /qa:strategy to add them.
```

### STEP 2 — Gather load context (ask once, all together)

```
A few quick questions for the load plan:

1. What's normal traffic? (e.g. "~200 req/min, spikes to 800 at 9am")
   → If unknown, I'll use conservative defaults.

2. SLOs? (e.g. "p95 < 500ms, error rate < 0.1%")
   → If none defined, what would make you wake up at 3am?

3. Target environment? (staging URL — never run load tests on production)

4. Auth needed? How many test accounts can I use for the token pool?
```

Wait for answers before proceeding.

### STEP 3 — Analyse endpoints

From the approved RTM requirements, identify the specific endpoints to load test. Check:
- Request/response shapes
- Auth required
- Any rate limiting already in place
- Database queries triggered (N+1 risks, missing indexes)
- Likely bottlenecks from the code

### STEP 4 — Create the plan

Create `.claude/plans/load-[feature].md`:

````markdown
# Load Test Plan: [feature]

_Strategy: .claude/strategy/[feature]-strategy.md_
_Tool: k6 | Created: [date] | Status: pending_

## Endpoints Under Test

| Endpoint | Method | Auth | SLO p95 |
|---|---|---|---|
| /api/[endpoint] | POST | Bearer | < 500ms |

## SLOs

| Metric | Threshold | Action if breached |
|---|---|---|
| p95 response time | < 500ms | block release |
| p99 response time | < 1000ms | investigate |
| Error rate | < 0.1% | block release |

## Scenarios

### 1. Baseline (always run first)
```
VUs: 5 | Duration: 30s | Goal: zero errors, establish baseline
```

### 2. Average load
```
Ramp: 30s → [N] VUs → hold 4m → ramp down 30s
Goal: all SLOs met under sustained normal traffic
```

### 3. Spike
```
5 VUs → [10x spike in 10s] → hold 1m → drop back
Goal: system survives and recovers
```

### 4. Soak (run weekly, not on every CI run)
```
[N] VUs | 60 minutes
Goal: no memory leak, no connection exhaustion, error rate stays flat
```

## k6 Script Spec

<script file="tests/load/[feature].k6.js">

  <setup>
    Pre-auth [N] test users, store tokens in array.
    Rotate round-robin across VUs — never share a single account.
  </setup>

  <scenario id="average-load" executor="ramping-vus">
    <stages>[from answers above]</stages>
    <thresholds>[from SLOs above]</thresholds>
    <action>
      1. Pick token: tokens[__VU % tokens.length]
      2. POST [endpoint] with realistic payload (see fixtures/[feature]-payloads.json)
      3. check(res, { 'status 200': r => r.status === 200 })
      4. check(res, { 'response time ok': r => r.timings.duration < 500 })
      5. sleep(Math.random() * 2 + 1)   // 1-3s think time — real users don't hammer
    </action>
  </scenario>

</script>

## File structure

```
tests/load/
├── [feature].k6.js
├── scenarios/
│   ├── baseline.js
│   ├── average.js
│   └── spike.js
└── fixtures/
    └── [feature]-payloads.json   ← realistic request bodies, not lorem ipsum
```

## Likely bottlenecks (fix before running)

[From code analysis — ranked by risk]
1. [bottleneck] — [recommendation]

## Run commands

```bash
# Always run baseline first
k6 run --vus 5 --duration 30s tests/load/[feature].k6.js

# Average load
k6 run tests/load/scenarios/average.js

# Full suite with output
k6 run tests/load/[feature].k6.js --out json=.claude/results/load-$(date +%Y%m%d).json
```

## Abort if

- Error rate exceeds 5% at any point
- p99 exceeds 5000ms
- Application logs show OOM or connection pool exhaustion
````

### STEP 5 — Output

```
✅ Load plan created: .claude/plans/load-[feature].md

Endpoints: [N]
Scenarios : baseline, average, spike, soak
SLOs      : p95 < [N]ms | errors < [N]%

⚠️  Fix before running:
  [Top 2 bottlenecks from analysis]

Next: /qa:execute load-[feature]
Note: Pre-create [N] test user accounts in staging before executing.
```
