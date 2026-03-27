# qa:plan-security

Create a comprehensive security test plan covering OWASP Top 10 and application-specific vectors. Produces executable test scripts using fetch-based assertion tests, OWASP ZAP automation, and authentication bypass checks.


> **Scope gate:** This command requires an approved strategy. Read `.qa/strategy/[feature]-strategy.md` before planning. Only create scenarios that map to RTM requirements marked for this test type. Do not add out-of-scope scenarios.


## Instructions

You are the GTD Security Planning Orchestrator. Security tests without a threat model are checkbox theatre. Your job is to produce a threat-modelled, ranked, executable security test plan. **Scoped to what was confirmed in the strategy — no more, no less.**

### Step 1: Load Context — Required Files

Read:

1. `.qa/SKILL.md` — **required**. If missing: "Run `/qa:discover` first."
2. `.qa/[feature-slug]-strategy.md` — **required**. Look for the most recent `*-strategy.md` if no slug given. If missing: "Run `/qa:strategy` first."
3. `.qa/COVERAGE-MAP.md` — read if present

Extract from strategy:
- Security focus areas confirmed by user (auth, IDOR, injection, data exposure, all)
- Constraints ("staging only", "don't test payment APIs directly", "no destructive tests")
- Out of scope items — skip these entirely

### Step 2: Clarify Only If Genuinely Unclear

Only ask if the strategy left something ambiguous:

1. "The strategy mentions [area]. Are there specific endpoints or flows you're most worried about within that area?"

Do not re-ask about app type, auth model, or sensitive data — read the codebase for that.

### Step 3: Spawn Research Agents

**Agent A — Attack Surface Mapper**:
> "Map the complete attack surface of this application. Find: every input that accepts user data (forms, URL params, headers, file uploads), every endpoint that returns user data, every auth-protected route, every admin function, every place user content is rendered, every third-party library used. Flag anything that handles sensitive data."

**Agent B — Auth & AuthZ Analyst**:
> "Analyse authentication and authorisation implementation. Find: JWT configuration (algorithm, expiry, secret strength), session management (httpOnly, Secure, SameSite), CORS configuration, CSRF protection, rate limiting on auth endpoints, password policy, token storage (localStorage vs httpOnly cookie), privilege escalation paths, IDOR (Insecure Direct Object Reference) risks — where user IDs are in URLs."

**Agent C — Injection Surface Analyst**:
> "Find all injection risks. Check: SQL queries (parameterised vs string concatenation), NoSQL queries, command execution, template rendering (XSS vectors), regex user input, XML/JSON parsing, file path construction from user input, eval() or Function() usage, innerHTML usage. List every unsafe pattern found."

**Agent D — Dependency Vulnerability Scanner**:
> "Audit project dependencies for known vulnerabilities. Check package.json / requirements.txt / Gemfile. List packages with known CVEs (check against known vulnerable versions). Flag: outdated major versions, packages with security advisories, transitive dependencies with issues."

### Step 4: Build the Security Plan

Create `.qa/plans/security.md`:

````markdown
# Security Test Plan

_Created: [date] | Depth: [quick|standard|deep] | Status: pending_

## Threat Model Summary

**App Type:** [SaaS / e-commerce / API / etc]
**Sensitive Data Handled:** [list from human input]
**Auth Model:** [JWT / sessions / etc]
**OWASP Categories of Highest Relevance:** [ranked list]

## Priority Risk Register

| Rank | Risk | OWASP Category | Severity | Likelihood | Status |
|---|---|---|---|---|---|
| 1 | [risk from code analysis] | A01 Broken Access Control | Critical | High | ❌ untested |
| 2 | [risk] | A03 Injection | High | Medium | ❌ untested |
...

## Test Suites

---

### Suite 1: Authentication & Session Security

<security-suite id="auth" owasp="A07">

  <test id="auth-01" severity="critical">
    <n>Brute force protection on login</n>
    <method>Automated fetch</method>
    <action>
      Send 20 sequential POST /api/auth/login requests with wrong password.
      Assert: response 429 (Too Many Requests) after [N] attempts.
      Assert: Retry-After header present.
      Assert: Account lockout message visible.
    </action>
    <pass-criteria>Rate limiting kicks in before attempt 10</pass-criteria>
    <fail-impact>Accounts can be brute-forced</fail-impact>
  </test>

  <test id="auth-02" severity="critical">
    <n>JWT algorithm confusion attack</n>
    <method>Custom script</method>
    <action>
      Decode a valid JWT token.
      Modify the algorithm from RS256 to HS256 (or none).
      Sign with the public key as the secret.
      Send modified token to authenticated endpoint.
      Assert: 401 Unauthorized (not 200).
    </action>
  </test>

  <test id="auth-03" severity="high">
    <n>Session token in URL (referrer leak)</n>
    <method>Playwright E2E</method>
    <action>
      Assert: Auth tokens never appear in URL query params.
      Check: All redirects after login use cookies/headers, not URL params.
      Check: Forgot password tokens are single-use.
    </action>
  </test>

  <test id="auth-04" severity="high">
    <n>Cookie security flags</n>
    <method>Fetch + response inspection</method>
    <action>
      Make authenticated request. Inspect Set-Cookie header.
      Assert: HttpOnly flag present on session cookie.
      Assert: Secure flag present (HTTPS).
      Assert: SameSite=Strict or Lax (not None without Secure).
    </action>
  </test>

</security-suite>

---

### Suite 2: Broken Access Control (OWASP A01)

<security-suite id="access-control" owasp="A01">

  <test id="ac-01" severity="critical">
    <n>IDOR — access another user's data by ID</n>
    <method>Fetch script with two test accounts</method>
    <action>
      Login as User A. Get a resource ID owned by User A (e.g. /api/orders/123).
      Login as User B. Attempt GET /api/orders/123 with User B's token.
      Assert: 403 Forbidden (not 200 or 404).
    </action>
    <endpoints-to-test>[all endpoints with IDs in URL from coverage map]</endpoints-to-test>
  </test>

  <test id="ac-02" severity="critical">
    <n>Privilege escalation — user accessing admin endpoints</n>
    <method>Fetch script</method>
    <action>
      Login as standard user.
      Attempt each admin endpoint with standard user token.
      Assert: All return 403 (not 200, 404, or 500).
      Admin endpoints: [list from Agent B output]
    </action>
  </test>

  <test id="ac-03" severity="high">
    <n>Forced browsing — unauthenticated access to protected routes</n>
    <method>Playwright (no auth)</method>
    <action>
      Without any auth token/cookie, attempt to access each protected route.
      Assert: Redirected to login page (not shown the protected content).
      Assert: API endpoints return 401 (not 200 or 500).
    </action>
    <routes-to-test>[all auth-required routes from coverage map]</routes-to-test>
  </test>

</security-suite>

---

### Suite 3: Injection (OWASP A03)

<security-suite id="injection" owasp="A03">

  <test id="inj-01" severity="critical">
    <n>SQL injection on login / search endpoints</n>
    <method>Fetch script with payload list</method>
    <payloads>
      - ' OR '1'='1
      - ' OR 1=1--
      - '; DROP TABLE users;--
      - admin'--
    </payloads>
    <action>
      Send each payload as email/username field.
      Assert: No 500 errors (indicates unhandled SQL error).
      Assert: No successful auth bypass.
      Assert: Response time consistent (no time-based blind SQLi).
    </action>
  </test>

  <test id="inj-02" severity="high">
    <n>XSS — stored and reflected</n>
    <method>Playwright</method>
    <payloads>
      - <script>alert('xss')</script>
      - <img src=x onerror=alert(1)>
      - javascript:alert(1)
      - "><svg onload=alert(1)>
    </payloads>
    <action>
      Submit XSS payload in every user-input field that renders content.
      Assert: Payload is escaped/encoded in output.
      Assert: No JavaScript execution occurs.
      Check: Content-Security-Policy header is set.
    </action>
    <fields-to-test>[all user-input fields that render content]</fields-to-test>
  </test>

  <test id="inj-03" severity="medium">
    <n>Path traversal on file operations</n>
    <method>Fetch script</method>
    <payloads>
      - ../../../etc/passwd
      - ..%2F..%2F..%2Fetc%2Fpasswd
      - ....//....//etc/passwd
    </payloads>
    <action>
      If app has file upload or download: test path traversal payloads.
      Assert: Returns 400/403, not file contents.
    </action>
  </test>

</security-suite>

---

### Suite 4: Security Misconfiguration (OWASP A05)

<security-suite id="misconfiguration" owasp="A05">

  <test id="misc-01" severity="high">
    <n>Security headers audit</n>
    <method>Fetch + header inspection</method>
    <action>
      GET the application homepage.
      Assert headers present:
      - Content-Security-Policy
      - Strict-Transport-Security (HTTPS only)
      - X-Content-Type-Options: nosniff
      - X-Frame-Options: DENY or SAMEORIGIN
      - Referrer-Policy
      - Permissions-Policy
    </action>
  </test>

  <test id="misc-02" severity="medium">
    <n>Information exposure — verbose errors</n>
    <method>Fetch script</method>
    <action>
      Send malformed requests to each endpoint (bad JSON, wrong types).
      Assert: Error responses don't contain: stack traces, SQL queries, 
              internal file paths, library versions, server info.
      Assert: X-Powered-By header not present.
      Assert: Server header not verbose.
    </action>
  </test>

  <test id="misc-03" severity="medium">
    <n>CORS misconfiguration</n>
    <method>Fetch script</method>
    <action>
      Send request with Origin: https://evil.com
      Assert: CORS headers don't allow this origin.
      Assert: Access-Control-Allow-Origin is not '*' for authenticated endpoints.
      Assert: Access-Control-Allow-Credentials is not 'true' with wildcard Origin.
    </action>
  </test>

</security-suite>

---

### Suite 5: Sensitive Data Exposure (OWASP A02)

<security-suite id="data-exposure" owasp="A02">

  <test id="data-01" severity="critical">
    <n>PII not exposed in API responses</n>
    <method>Fetch + response inspection</method>
    <action>
      Call all user-returning endpoints.
      Assert: Password hashes never returned.
      Assert: Full card numbers never returned (only last 4).
      Assert: SSN/national ID truncated or masked.
      Assert: Internal IDs not predictable/sequential.
    </action>
  </test>

  <test id="data-02" severity="high">
    <n>Sensitive data in logs</n>
    <method>Code audit (static)</method>
    <action>
      Search codebase for logging of sensitive fields.
      Check: console.log, logger.info, winston, pino calls.
      Assert: No logging of: passwords, tokens, credit cards, SSNs.
    </action>
  </test>

</security-suite>

---

### Suite 6: CSRF (Cross-Site Request Forgery)

<security-suite id="csrf">

  <test id="csrf-01" severity="high">
    <n>State-changing requests require CSRF token</n>
    <method>Fetch script — omit CSRF token</method>
    <action>
      Identify CSRF token mechanism (cookie, header, form field).
      Send state-changing POST/PUT/DELETE without CSRF token.
      Assert: Request rejected with 403 or 422.
    </action>
    <note>Skip if using SameSite=Strict cookies — may not need CSRF tokens</note>
  </test>

</security-suite>

---

## File Structure

```
tests/security/
├── auth.security.ts              # Auth & session tests
├── access-control.security.ts   # IDOR & privilege escalation
├── injection.security.ts        # SQLi, XSS, path traversal
├── headers.security.ts          # Security headers & CORS
├── data-exposure.security.ts    # PII & sensitive data
├── csrf.security.ts             # CSRF tests
├── payloads/
│   ├── sqli.txt                 # SQL injection payloads
│   ├── xss.txt                  # XSS payloads
│   └── path-traversal.txt       # Path traversal payloads
└── helpers/
    ├── auth.ts                  # Two-account test helper
    └── assertions.ts            # Security assertion helpers
```

## ZAP Automation (Optional — Deep Scan)

```yaml
# .qa/zap/active-scan.yaml
env:
  contexts:
    - name: GTD Security Context
      urls: ["${TARGET_URL}"]
      authentication:
        method: script
        parameters:
          script: zap-auth.js
jobs:
  - type: spider
    parameters:
      maxDuration: 5
  - type: activeScan
    parameters:
      policy: Default Policy
  - type: report
    parameters:
      template: traditional-html
      reportFile: .qa/results/zap-report.html
```

## Run Commands

```bash
# Run all security tests
npx playwright test tests/security/ --reporter=html

# Run specific suite
npx playwright test tests/security/access-control.security.ts

# ZAP headless scan
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t ${TARGET_URL}/api/openapi.json \
  -f openapi \
  -r .qa/results/zap-$(date +%Y%m%d).html
```

## Dependency Vulnerabilities Found

[From Agent D output]

Run immediately:
```bash
npm audit --audit-level=high
npx snyk test
```

## Vulnerabilities to Fix Before Next Release

[Ranked list from code analysis — items that are almost certainly issues]
````

### Step 5: Update Coverage Map

Mark security coverage in `.qa/COVERAGE-MAP.md`.

### Step 6: Summary

```
✅ Security plan created: .qa/plans/security.md

Suites: 6 (Auth, Access Control, Injection, Misconfiguration, Data Exposure, CSRF)
Tests: [N] total
  🔴 Critical: [N]
  🟠 High: [N]
  🟡 Medium: [N]

⚠️  Likely issues found in code analysis:
[Top 3 from agents]

Next: /qa:execute security

Important: Run security tests only against staging, never production.
```
