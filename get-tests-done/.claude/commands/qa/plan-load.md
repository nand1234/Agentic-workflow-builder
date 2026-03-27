# qa:plan-load

Create a detailed k6 or Artillery load test plan that mirrors realistic traffic patterns. Defines VU counts, ramp-up curves, SLOs, and failure thresholds. Produces a plan in `.qa/plans/` ready for `/qa:execute`.


> **Scope gate:** This command requires an approved strategy. Read `.qa/strategy/[feature]-strategy.md` before planning. Only create scenarios that map to RTM requirements marked for this test type. Do not add out-of-scope scenarios.


## Instructions

You are the GTD Load Planning Orchestrator. Load tests that don't model real traffic are useless — your job is to build scenarios that actually catch capacity problems before production does. **You are scoped to the RTM — plan only what was confirmed in the strategy.**

$ARGUMENTS contains the feature slug. If empty, ask: "Which feature slug from your strategy file? (e.g. 'checkout', 'auth')"

### Step 1: Load Context — Required Files

Read **all** of the following. Stop if required files are missing:

1. `.qa/SKILL.md` — **required**. If missing: "Run `/qa:discover` first."
2. `.qa/[feature-slug]-strategy.md` — **required**. If missing: "Run `/qa:strategy` first."
3. `.qa/COVERAGE-MAP.md` — read if present

Extract from strategy:
- SLOs confirmed by the user (p95, error rate, peak VUs) — use these exactly
- Which endpoints/flows have Load = ✅ — plan only these
- Constraints (e.g. "staging only", "mock Stripe")
- Out of scope — do not plan these

Determine load tool from SKILL.md (default: k6).

### Step 2: Ask Only What Isn't in the Strategy

Only ask if the strategy doesn't already contain it:

1. "I have your SLOs from the strategy: p95 < [N]ms, errors < [N]%, peak [N] VUs. Is this still accurate, or has anything changed?"

2. "How many test user accounts can I provision? I'll need a pool to rotate across virtual users — avoids single-account bottlenecks."

### Step 3: Spawn Research Agents

**Agent A — Endpoint Profiler**:
> "Profile the [target] endpoints. Find: full URL patterns, HTTP methods, request bodies, authentication headers required, response shapes, any rate limiting in place, caching headers, connection pooling settings. Check for any existing load test configuration. Look at database queries triggered by these endpoints."

**Agent B — Traffic Pattern Analyst**:
> "Look for any analytics, logs, or metrics in this codebase that reveal traffic patterns. Check: any APM config (Datadog, New Relic, etc), logging middleware, analytics events, README or runbooks. Estimate peak vs baseline traffic ratio. Identify bursty vs sustained patterns."

**Agent C — Bottleneck Identifier**:
> "Identify likely performance bottlenecks in the [target] implementation. Look for: N+1 queries, missing database indexes, synchronous operations that could be async, large response payloads, no pagination, missing caching, connection pool limits, memory-heavy operations. List by severity."

### Step 4: Build the Load Plan

Create `.qa/plans/load-[target-slug].md`:

````markdown
# Load Test Plan: [Target Name]

_Tool: [k6|Artillery] | Created: [date] | Status: pending_

## Target Endpoints

| Endpoint | Method | Auth | Expected p95 | Notes |
|---|---|---|---|---|
| /api/[endpoint] | POST | Bearer token | < 300ms | Core operation |
| /api/[endpoint] | GET | None | < 100ms | Cacheable |

## SLOs (Service Level Objectives)

| Metric | Threshold | Severity |
|---|---|---|
| p50 response time | < 150ms | warning |
| p95 response time | < 500ms | error |
| p99 response time | < 1000ms | critical |
| Error rate | < 0.1% | error |
| Throughput | > 100 req/s | info |

## Test Scenarios

### Scenario 1: Baseline / Smoke Load
_Verify the system handles minimal load without errors_

```
VUs: 5
Duration: 30s
Ramp: none (flat)
Goal: Zero errors, establish baseline latency
```

### Scenario 2: Average Load
_Simulate normal production traffic_

```
VUs: [calculated from traffic data or 50]
Duration: 5m
Ramp: 30s up → 4m hold → 30s down
Goal: All SLOs met under sustained average load
```

### Scenario 3: Peak Load (Stress Test)
_Find the breaking point — traffic spike scenario_

```
Stage 1: 0 → 20 VUs over 1m
Stage 2: 20 → 100 VUs over 2m  (average → peak)
Stage 3: 100 VUs hold for 3m
Stage 4: 100 → 0 VUs over 1m
Goal: Identify degradation point, confirm recovery
```

### Scenario 4: Spike Test
_Sudden traffic spike — flash sale / viral moment_

```
Stage 1: 5 VUs for 30s (baseline)
Stage 2: 5 → 200 VUs in 10s (spike!)
Stage 3: 200 VUs for 1m
Stage 4: 200 → 5 VUs in 10s (drop)
Goal: System survives spike and recovers cleanly
```

### Scenario 5: Soak Test (Extended)
_Run overnight to find memory leaks, connection exhaustion_

```
VUs: 30 (moderate load)
Duration: 60m
Goal: Error rate stays flat, response times don't drift upward
```

## k6 Script Spec

<test-plan tool="k6">

  <setup>
    <n>Auth token pool setup</n>
    <action>
      Pre-authenticate [N] test users before test starts.
      Store tokens in shared array: const tokens = open('./fixtures/tokens.json')
      Rotate tokens round-robin across VUs to avoid single-user bottleneck.
    </action>
  </setup>

  <scenario id="average-load" executor="ramping-vus">
    <n>Average load — [target]</n>
    <stages>
      { duration: '30s', target: 50 },
      { duration: '4m', target: 50 },
      { duration: '30s', target: 0 }
    </stages>
    <action>
      1. Pick token from pool: tokens[__VU % tokens.length]
      2. POST [endpoint] with realistic request body (see fixtures)
      3. Check response: status === 200
      4. Check response time: res.timings.duration < 500
      5. Parse response body — assert required fields present
      6. Add think time: sleep(Math.random() * 2 + 1) // 1-3s
    </action>
    <thresholds>
      http_req_duration: ['p(95)<500', 'p(99)<1000']
      http_req_failed: ['rate<0.001']
    </thresholds>
  </scenario>

  <scenario id="spike-test" executor="ramping-vus">
    <n>Spike test — [target]</n>
    <stages>
      { duration: '30s', target: 5 },
      { duration: '10s', target: 200 },
      { duration: '1m', target: 200 },
      { duration: '10s', target: 5 }
    </stages>
  </scenario>

  <fixtures>
    <file>tests/load/fixtures/tokens.json — pre-generated auth tokens</file>
    <file>tests/load/fixtures/[target]-payloads.json — realistic request bodies</file>
  </fixtures>

</test-plan>

## File Structure

```
tests/load/
├── [target-slug].k6.js          # Main k6 script
├── scenarios/
│   ├── baseline.js
│   ├── average-load.js
│   ├── spike.js
│   └── soak.js
├── fixtures/
│   ├── tokens.json              # Pre-baked auth tokens
│   └── [target]-payloads.json  # Realistic request bodies
└── thresholds.js                # Shared SLO definitions
```

## Realistic Payload Fixtures

```json
[
  { "email": "loadtest-01@example.com", "password": "LoadTest123!" },
  { "email": "loadtest-02@example.com", "password": "LoadTest123!" }
]
```

Generate [N] realistic payloads — sample from production data shapes (anonymised), not lorem ipsum.

## Pre-Test Checklist

Before running:
- [ ] Target environment is isolated from production
- [ ] Database has been seeded with test data
- [ ] [N] test user accounts created
- [ ] Monitoring dashboards open (Datadog / Grafana / etc)
- [ ] Notify team — load tests affect shared staging envs
- [ ] Check rate limits won't block the test

## Expected Bottlenecks (Address Before Running)

[From Agent C output — list bottlenecks identified in code analysis]

1. [Bottleneck 1] — [recommendation]
2. [Bottleneck 2] — [recommendation]

## Run Commands

```bash
# Baseline (run first)
k6 run --vus 5 --duration 30s tests/load/[target-slug].k6.js

# Average load
k6 run tests/load/scenarios/average-load.js

# Full stress test
k6 run tests/load/scenarios/spike.js --out json=results/load-$(date +%Y%m%d).json

# With cloud output (k6 Cloud)
k6 cloud tests/load/[target-slug].k6.js
```

## Alerts: When to Abort

Stop the test immediately if:
- Error rate exceeds 5%
- p99 exceeds 5000ms
- Database connection pool exhausted
- OOM errors in application logs
- Downstream service health checks fail

## Result Interpretation Guide

| Result | Meaning | Action |
|---|---|---|
| p95 < SLO, errors < 0.1% | ✅ Pass | Ship it |
| p95 close to SLO (within 10%) | ⚠️ Warning | Monitor in prod |
| p95 > SLO or errors > 0.1% | ❌ Fail | Fix before release |
| Gradual degradation in soak | 🔴 Memory leak | Investigate |
````

### Step 5: Update Coverage Map

Mark load coverage for the planned endpoints in `.qa/COVERAGE-MAP.md`.

### Step 6: Summary

```
✅ Load plan created: .qa/plans/load-[target-slug].md

Endpoints covered: [N]
Scenarios planned: 5 (baseline → average → peak → spike → soak)
Likely bottlenecks identified: [N]

⚠️  Address these before running:
[List top 2-3 bottlenecks from code analysis]

Next: /qa:execute load-[target-slug]

Note: Pre-create [N] test user accounts in your staging environment before executing.
```
