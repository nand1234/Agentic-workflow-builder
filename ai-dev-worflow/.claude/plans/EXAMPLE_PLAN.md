# Feature: [Feature Name]

> **This is an example plan file. Copy and rename it for each new feature.**  
> Filename convention: `plans/FEATURE_NAME.md` — use kebab-case.

---

**Status:** Planning / Implemented / Abandoned  
**Complexity:** 🟡 Moderate / 🔴 Complex  
**Date:** [date]  
**Author:** [name]  
**MR / Branch:** [link or branch name — filled in after implementation]

---

## 1. Feature Description

[High-level goal and user value. 2–3 sentences. Answer: what does this do, and why does it matter to the user?]

---

## 2. Dependencies

| Type | Plan File | Notes |
|---|---|---|
| Blocked by | [plan file name or "none"] | [what needs to be done first] |
| Blocks | [plan file name or "none"] | [what cannot start until this is done] |
| Shares anchor with | [plan file name or "none"] | [which anchor and risk of conflict] |

> Check `plans/` for any open plan files touching the same anchors before filling this in.

---

## 3. Impact Map

| Anchor | Current Behaviour | Change Type | File(s) Affected |
|---|---|---|---|
| UI | [what it does now] | Add / Modify / Delete | `src/components/...` |
| API | [what it does now] | Add / Modify / Delete | `src/routes/...` |
| Logic | [what it does now] | Add / Modify / Delete | `src/services/...` |
| DB | [what it does now] | Add / Modify / Delete | `src/models/...` |

---

## 4. Blast Radius

[What other features, services, or modules touch the same anchors listed above?]  
[Who or what could break if these files change unexpectedly?]  
[Skip this section for Moderate complexity tickets.]

---

## 5. Triple-Test Matrix

| Scenario | Layer | Reasoning |
|---|---|---|
| ✅ Positive | Unit / API / E2E | [What normal success case does this verify? Why this layer?] |
| ❌ Negative | Unit / API / E2E | [What failure or invalid input does this protect against? Why this layer?] |
| ⚠️ Edge | Unit / API / E2E | [What boundary condition or unusual input does this cover? Why this layer?] |

**Layer selection guide:**
- **Unit** — isolated logic, no I/O, fast feedback
- **API** — contract between services, requires a running server
- **E2E** — mandatory when the user journey spans 2 or more systems
- **At least one test must be API or E2E level** — three unit tests alone do not satisfy this matrix

---

## 6. Task Queue

> Tasks are strictly sequential. Do not start Task N+1 until Task N is marked complete.  
> One Claude session handles one task at a time.  
> To resume after a break: read SEARCH_PROTOCOL.md + this plan file, check the last completed task, start the next one.

| # | Status | Task |
|---|---|---|
| 1 | ⬜ Pending | [e.g. Create UserService with login method] |
| 2 | ⬜ Pending | [e.g. Add login route and wire to UserService] |
| 3 | ⬜ Pending | [e.g. Write Positive test — valid credentials return token] |
| 4 | ⬜ Pending | [e.g. Write Negative test — invalid credentials return 401] |
| 5 | ⬜ Pending | [e.g. Write Edge test — expired token handled correctly] |
| 6 | ⬜ Pending | [e.g. Run full test suite and verify no regressions] |

> Statuses: ⬜ Pending → 🔄 In Progress → ✅ Complete → 🚫 Blocked

---

## 7. Task Specifications

> Each task below is fully self-contained.  
> To execute: pass the task block + `skills/SEARCH_PROTOCOL.md` as the only context needed.  
> No prior session memory required.

---

### Task 1: [e.g. Create UserService with login method]
**Status:** ⬜ Pending  
**Depends on:** None — this is the first task  
**File(s) to create/edit:** `src/services/userService.ts`  
**Pattern reference:** `src/services/authService.ts` (Golden Pair)  
**Input:** `login(email: string, password: string): Promise<{ token: string, expiresIn: number }>`  
**Output:** Returns signed JWT on success, throws `AuthenticationError` on failure  
**Mocks needed:** None — unit logic only, DB mock added in test task  
**Implementation notes:** Use async/await with try/catch. Follow same error class pattern as authService. Token expiry is 15 minutes.  
**Done when:**
- [ ] `src/services/userService.ts` exists
- [ ] `login()` function is exported
- [ ] Function throws `AuthenticationError` for invalid credentials
- [ ] No test file needed yet — covered in Task 3

**Before starting this task, verify:**
- [ ] SEARCH_PROTOCOL.md has been read
- [ ] `src/services/authService.ts` (Golden Pair) has been reviewed for pattern reference

---

### Task 2: [e.g. Add login route and wire to UserService]
**Status:** ⬜ Pending  
**Depends on:** Task 1 complete — `UserService.login()` exists at `src/services/userService.ts`  
**File(s) to create/edit:** `src/routes/auth.ts`  
**Pattern reference:** `src/routes/users.ts` (Golden Pair)  
**Input:** `POST /auth/login` with body `{ email: string, password: string }`  
**Output:** `200 { token, expiresIn }` on success / `401 { error }` on failure  
**Mocks needed:** None at route level — service is real, mocked in tests  
**Implementation notes:** Follow same Express router pattern as users.ts. Use existing error middleware for 401 responses — do not add new error handling patterns.  
**Done when:**
- [ ] Route exists at `POST /auth/login`
- [ ] Route calls `UserService.login()` and returns correct response shape
- [ ] Error middleware handles `AuthenticationError` → 401 correctly

**Before starting this task, verify:**
- [ ] Task 1 is marked ✅ Complete in the Task Queue
- [ ] `src/services/userService.ts` exists with exported `login()` function

---

### Task 3: [e.g. Write Positive test — valid credentials return token]
**Status:** ⬜ Pending  
**Depends on:** Task 2 complete — route and service both exist  
**File(s) to create/edit:** `__tests__/services/userService.test.ts`  
**Pattern reference:** `__tests__/services/authService.test.ts` (Golden Pair test)  
**Input:** Valid credentials `{ email: 'user@example.com', password: 'correct' }`  
**Output:** Returns `{ token: string, expiresIn: 900 }`  
**Mocks needed:** `jest.mock('../models/user')` — see Golden Pair for exact pattern  
**Implementation notes:** This is the Positive case from the Triple-Test Matrix. Follow exact describe/it naming pattern from Golden Pair.  
**Done when:**
- [ ] Test file exists at correct path
- [ ] Positive test passes
- [ ] Mock setup follows Golden Pair pattern exactly

**Before starting this task, verify:**
- [ ] Task 2 is marked ✅ Complete in the Task Queue
- [ ] Both `src/services/userService.ts` and `src/routes/auth.ts` exist

---

## 8. Session State

> Updated at the end of each task.  
> If resuming: read this section first, then go directly to the next pending task specification.

**Last updated:** [date / session]  
**Last completed task:** Task [N] — [title]  
**Next task:** Task [N+1] — [title]  
**Key decisions made so far:** [running list — e.g. "Using AuthenticationError class from existing auth module, not creating new one"]  
**Blockers:** [anything unresolved — or "none"]
