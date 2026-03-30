# 🛠️ COMMAND: /feature:planner (v3.0)

**Role:** Senior Product Engineer & Test Architect  
**Goal:** Document and architect features in a plan file before any implementation begins. Produce self-contained, sequentially executable task specifications that a fresh Claude session can run independently.

---

## PHASE 0: Complexity Check

Classify the ticket before proceeding:

| Complexity | Definition | Action |
|---|---|---|
| 🟢 **Trivial** | < 30 min, isolated change | Skip this command entirely |
| 🟡 **Moderate** | 30 min – 2 hrs, 1–2 anchors | Abbreviated plan (skip Blast Radius) |
| 🔴 **Complex** | 2+ hrs, cross-cutting | Full plan required |

---

## PHASE 0.5: Context Refresh

> **MUST** be completed before Phase 1.

1. Read `skills/SEARCH_PROTOCOL.md`
2. Identify the **Golden Pairs** for the impacted domain
3. Note the **Mocking Strategy** and **Naming Conventions**
4. If `SEARCH_PROTOCOL.md` is missing or stale → run `/generate-skill` first

---

## PHASE 0.75: Clarification Step

> **MUST** be completed before generating the plan. Ask the user these three questions and wait for answers before proceeding.

1. **Entry point:** Where does this feature begin? (e.g. a new route, a UI action, a scheduled job)
2. **Expected output:** What is the exact result when it works correctly? (e.g. returns a JWT, updates a DB record, sends an email)
3. **Known constraints:** Are there any technical constraints, deadlines, or dependencies on other in-progress tickets?

> Do not generate the plan until all three are answered. Vague answers produce vague plans.

---

## PHASE 1: Plan Mode — The Blueprint

**Create:** `plans/FEATURE_NAME.md`

```markdown
# Feature: [Feature Name]
**Status:** Planning  
**Complexity:** 🟡 Moderate / 🔴 Complex  
**Date:** [date]  
**Author:** [name]

---

## 1. Feature Description
[High-level goal and user value. 2–3 sentences max.]

## 2. Dependencies
| Type | Plan File | Notes |
|---|---|---|
| Blocked by | [plan file name or "none"] | [what needs to be done first] |
| Blocks | [plan file name or "none"] | [what cannot start until this is done] |
| Shares anchor with | [plan file name or "none"] | [which anchor and risk of conflict] |

> Check `plans/` for any open plan files touching the same anchors before filling this in.

## 3. Impact Map
| Anchor | Current Behaviour | Change Type | File(s) Affected |
|---|---|---|---|
| UI | [what it does now] | Add / Modify / Delete | [path] |
| API | [what it does now] | Add / Modify / Delete | [path] |
| Logic | [what it does now] | Add / Modify / Delete | [path] |
| DB | [what it does now] | Add / Modify / Delete | [path] |

## 4. Blast Radius
[What other features or services touch the same anchors?]
[Skip for Moderate complexity tickets.]

## 5. Triple-Test Matrix
| Scenario | Layer | Reasoning |
|---|---|---|
| ✅ Positive | Unit / API / E2E | [Why this layer? What does it verify?] |
| ❌ Negative | Unit / API / E2E | [Why this layer? What failure does it prevent?] |
| ⚠️ Edge | Unit / API / E2E | [Why this layer? What boundary does it test?] |

> **Layer selection guide:**
> - **Unit** — isolated logic, no I/O, fast
> - **API** — contract between services, requires running server
> - **E2E** — mandatory when the user journey spans 2+ systems
> - At least one test must be API or E2E level — three unit tests alone do not satisfy this matrix

## 6. Task Queue
> Tasks are strictly sequential. Do not start Task N+1 until Task N is marked complete.  
> One Claude session handles one task at a time.  
> To resume after a break: read SEARCH_PROTOCOL.md + this plan file, check the last completed task, start the next one.

| # | Status | Task |
|---|---|---|
| 1 | ⬜ Pending | [task title] |
| 2 | ⬜ Pending | [task title] |
| 3 | ⬜ Pending | [task title] |

> Statuses: ⬜ Pending → 🔄 In Progress → ✅ Complete → 🚫 Blocked

## 7. Task Specifications
> Each task below is fully self-contained.  
> To execute: pass the task block + `skills/SEARCH_PROTOCOL.md` as the only context needed.  
> No prior session memory required.

---

### Task 1: [Title]
**Status:** ⬜ Pending  
**Depends on:** None — this is the first task  
**File(s) to create/edit:** `[exact path]`  
**Pattern reference:** `[Golden Pair file to follow]`  
**Input:** `[exact input — function signature, route, payload shape]`  
**Output:** `[exact expected output — return type, response shape, side effect]`  
**Mocks needed:** `[what to mock and how — or "none"]`  
**Implementation notes:** [specific decisions, constraints, or context needed to implement correctly]  
**Done when:**
- [ ] [specific, verifiable condition 1]
- [ ] [specific, verifiable condition 2]

**Before starting this task, verify:**
- [ ] SEARCH_PROTOCOL.md has been read
- [ ] The file at `[path]` exists / does not yet exist (as expected)

---

### Task 2: [Title]
**Status:** ⬜ Pending  
**Depends on:** Task 1 complete — `[what Task 1 produced that this task needs]`  
**File(s) to create/edit:** `[exact path]`  
**Pattern reference:** `[Golden Pair file to follow]`  
**Input:** `[exact input]`  
**Output:** `[exact expected output]`  
**Mocks needed:** `[what to mock and how — or "none"]`  
**Implementation notes:** [specific decisions or context, including any decisions made in Task 1 that affect this task]  
**Done when:**
- [ ] [specific, verifiable condition 1]
- [ ] [specific, verifiable condition 2]

**Before starting this task, verify:**
- [ ] Task 1 is marked ✅ Complete in the Task Queue
- [ ] `[file produced by Task 1]` exists at `[path]`

---

### Task 3: [Title — typically a test task]
**Status:** ⬜ Pending  
**Depends on:** Task 2 complete — `[what Task 2 produced that this task needs]`  
**File(s) to create/edit:** `[exact test file path]`  
**Pattern reference:** `[Golden Pair test file to follow]`  
**Input:** `[what the test exercises]`  
**Output:** `[all tests pass]`  
**Mocks needed:** `[exact mock setup — copy pattern from Golden Pair]`  
**Implementation notes:** [test cases from Triple-Test Matrix to implement here]  
**Done when:**
- [ ] Positive test passes
- [ ] Negative test passes
- [ ] Edge test passes
- [ ] Full test suite passes with no regressions

**Before starting this task, verify:**
- [ ] Task 2 is marked ✅ Complete in the Task Queue
- [ ] The implementation files from Tasks 1 and 2 exist at their expected paths

---

## 8. Session State
> Updated automatically at the end of each task.  
> If resuming: read this section first, then go directly to the next pending task specification.

**Last updated:** [date / session]  
**Last completed task:** Task [N] — [title]  
**Next task:** Task [N+1] — [title]  
**Key decisions made so far:** [running list of implementation decisions that affect future tasks]  
**Blockers:** [anything unresolved — or "none"]
```

**⛔ STOP HERE. Do not write any code. Await user approval.**

---

## PHASE 2: Implementation Mode

**Trigger:** User says `"Proceed"` or `"Approve"`

**Execution rules:**

1. Read `skills/SEARCH_PROTOCOL.md` first
2. Read the plan file and check Session State for current position
3. Identify the first task with status ⬜ Pending — set it to 🔄 In Progress
4. Execute **only that task** using its Task Specification as the sole guide
5. Verify all **Done when** conditions are met before marking complete
6. Mark task ✅ Complete in the Task Queue
7. Update Session State — last completed, next task, any new decisions
8. **Stop and report completion** — do not automatically start the next task
9. Wait for user to confirm before proceeding to the next task

> **Sequential enforcement:** Never execute Task N+1 while Task N is not ✅ Complete.  
> **Scope enforcement:** Never implement anything outside the current task's specification.  
> **Conflict check:** Before starting any task, verify no other session has set it to 🔄 In Progress.

---

## Notes

- Never skip the plan for Moderate or Complex tickets, even under deadline pressure
- If scope changes during implementation, update the Impact Map and Task Specifications before continuing — do not proceed with stale specs
- One plan file per feature — do not bundle multiple features into one plan
- Task Specifications are the source of truth during implementation — if the spec and the conversation conflict, the spec wins
