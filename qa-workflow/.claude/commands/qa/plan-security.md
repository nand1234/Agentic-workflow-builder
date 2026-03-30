# qa:plan-security

**Mode 2 — structured planning.** Creates an OWASP-aligned security test plan scoped to the approved RTM. Run `/qa:strategy` first.

---

## Instructions

$ARGUMENTS is the feature name.

### STEP 1 — Load and validate

Read: `.claude/SKILL.md`, `.claude/strategy/[feature]-strategy.md`

If strategy missing → stop: `❌ Run /qa:strategy [feature] first.`

Check RTM has Security column with at least one ✅.

### STEP 2 — Analyse attack surface

Spawn a research agent to find, for the RTM-relevant features only:
- Every user input that accepts data
- Auth mechanism and token handling
- IDOR risks (user IDs in URLs/params)
- Endpoints that mutate data
- Any file upload handling
- CORS and security header config

### STEP 3 — Threat model

Prioritise OWASP categories based on what the feature actually does:

| Feature type | Highest risk categories |
|---|---|
| Auth/login | A07 (Auth Failures), A01 (Access Control) |
| Data mutation | A01 (Access Control/IDOR), A03 (Injection) |
| File upload | A03 (Injection), A01 (Path Traversal) |
| Multi-tenant | A01 (IDOR), A02 (Crypto) |
| Public API | A03 (Injection), A05 (Misconfiguration) |

### STEP 4 — Create the plan

Create `.claude/plans/security-[feature].md`:

````markdown
# Security Test Plan: [feature]

_Strategy: .claude/strategy/[feature]-strategy.md_
_Created: [date] | Status: pending_

## Threat Model

| Risk | OWASP | Severity | Likelihood |
|---|---|---|---|
| [risk from analysis] | A01 | Critical | High |

## Test Suites

Only suites relevant to the approved RTM requirements are included.

### Suite: Authentication & Brute Force (if auth in scope)

<test id="auth-01" req="REQ-[N]" severity="critical">
  <n>Brute force protection — rate limiting on login</n>
  <method>Fetch script</method>
  <action>
    Send 20 sequential POST /api/auth/login with wrong password.
    Assert: 429 Too Many Requests returned before attempt 10.
    Assert: Retry-After header present.
  </action>
  <pass>Rate limiting active</pass>
  <fail-impact>Accounts can be brute-forced</fail-impact>
</test>

### Suite: Access Control (if protected resources in scope)

<test id="ac-01" req="REQ-[N]" severity="critical">
  <n>IDOR — user cannot access another user's resource</n>
  <method>Two-account fetch script</method>
  <action>
    Login as User A. Get resource ID (e.g. /api/orders/123).
    Login as User B. GET /api/orders/123 with User B's token.
    Assert: 403 Forbidden — not 200 or 404.
  </action>
</test>

### Suite: Injection (if user input in scope)

<test id="inj-01" req="REQ-[N]" severity="high">
  <n>SQL injection on [endpoint]</n>
  <payloads>
    - ' OR '1'='1
    - ' OR 1=1--
    - '; DROP TABLE users;--
  </payloads>
  <action>
    Send each payload to [field].
    Assert: No 500 errors.
    Assert: No auth bypass.
    Assert: Response time consistent (no timing-based blind SQLi).
  </action>
</test>

### Suite: Security Headers

<test id="hdr-01" severity="medium">
  <n>Security response headers present</n>
  <action>
    GET [page]. Check response headers.
    Assert present: Content-Security-Policy, X-Content-Type-Options: nosniff,
                    X-Frame-Options, Strict-Transport-Security (HTTPS),
                    Referrer-Policy.
    Assert absent: X-Powered-By, verbose Server header.
  </action>
</test>

## File structure

```
tests/security/
├── [feature]-auth.security.ts
├── [feature]-access-control.security.ts
├── [feature]-injection.security.ts
├── headers.security.ts
└── helpers/
    ├── two-account.ts        ← DRY helper for IDOR tests
    └── payloads.ts           ← Attack payload constants
```

## Run commands

```bash
npx playwright test tests/security/ --reporter=html
```

⚠️  Run against staging only. Never production.
````

### STEP 5 — Output

```
✅ Security plan created: .claude/plans/security-[feature].md

Suites: [N] (scoped to approved RTM)
Tests : [N] total — [N] critical, [N] high, [N] medium

Likely issues from code analysis:
  [Top 2-3 findings]

Next: /qa:execute security-[feature]
⚠️  Staging environment only.
```
