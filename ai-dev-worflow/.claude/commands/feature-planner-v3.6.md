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

> **Check for a requirements file first.** If `.claude/requirements/[feature_name]_requirements.md` exists, read Section 8 (Planner Handoff Notes) and use those answers — skip asking the three questions below.  
> If no requirements file exists, ask the three questions and wait for answers before proceeding.  
> If requirements are incomplete or missing Section 8, run `/requirement_discovery` first.

1. **Entry point:** Where does this feature begin? (e.g. a new route, a UI action, a scheduled job)
2. **Expected output:** What is the exact result when it works correctly? (e.g. returns a JWT, updates a DB record, sends an email)
3. **Known constraints:** Are there any technical constraints, deadlines, or dependencies on other in-progress tickets?

> Do not generate the plan until all three are answered. Vague answers produce vague plans.

**If a requirements file was read**, also populate the following plan sections from it:
- Section 1 (Feature Description) ← from Requirements Section 1 + 3
- Impact Map ← inferred from Requirements Section 2 + 6
- Blast Radius ← from Requirements Section 5 (out of scope helps define boundaries)

---

## PHASE 1: Plan Mode — The Blueprint

**Create:** `.claude/plans/[feature_name].md`

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

> Check `.claude/plans/` for any open plan files touching the same anchors before filling this in.

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

| # | Status | Title | Jira Summary |
|---|---|---|---|
| 1 | ⬜ Pending | [task title] | `[FEATURE-KEY] Task 1: [task title]` |
| 2 | ⬜ Pending | [task title] | `[FEATURE-KEY] Task 2: [task title]` |
| 3 | ⬜ Pending | [task title] | `[FEATURE-KEY] Task 3: [task title]` |

> Statuses: ⬜ Pending → 🔄 In Progress → ✅ Complete → 🚫 Blocked

## 7. Task Specifications
> Each task below is fully self-contained.  
> To execute: pass the task block + `skills/SEARCH_PROTOCOL.md` as the only context needed.  
> No prior session memory required.
>
> **Jira tip:** Each task opens with a ready-to-copy title and one-line description.  
> Copy the `Title` line as the Jira issue summary. Copy `Description` as the issue body.

---

### Task 1: [Title]

> **Jira-ready:**  
> **Title:** `[FEATURE-KEY] Task 1: [Title]`  
> **Description:** `[One sentence: what is being built or changed, in which file/layer, and what it produces or enables.]`

**Status:** ⬜ Pending  
**Depends on:** None — this is the first task  
**File(s) to create/edit:** `[exact path]`  
**Test file:** `[exact test file path]`  
**Pattern reference:** `[Golden Pair file to follow]`  
**Input:** `[exact input — function signature, route, payload shape]`  
**Output:** `[exact expected output — return type, response shape, side effect]`  
**Mocks needed:** `[what to mock and how — or "none"]`  
**Implementation notes:** [specific decisions, constraints, or context needed to implement correctly]  
**Done when:**
- [ ] [specific, verifiable condition 1]
- [ ] [specific, verifiable condition 2]
- [ ] All unit tests below pass

**Unit tests (developer-owned) — all scenarios mocked:**
| # | Name | Scenario | Mocks |
|---|---|---|---|
| 1.U1 | `[test name]` | ✅ [happy path — what correct input produces] | `[what is mocked]` |
| 1.U2 | `[test name]` | ❌ [negative — what invalid input or failure produces] | `[what is mocked]` |
| 1.U3 | `[test name]` | ⚠️ [edge case — boundary, empty, or unexpected value] | `[what is mocked]` |

> Unit tests must pass before this task is marked ✅ Complete.  
> API and Cypress/E2E coverage is handled separately by the automation engineer (see Sections 9 and 10).

**Before starting this task, verify:**
- [ ] SEARCH_PROTOCOL.md has been read
- [ ] The file at `[path]` exists / does not yet exist (as expected)

---

### Task 2: [Title]

> **Jira-ready:**  
> **Title:** `[FEATURE-KEY] Task 2: [Title]`  
> **Description:** `[One sentence: what is being built or changed, in which file/layer, and what it produces or enables.]`

**Status:** ⬜ Pending  
**Depends on:** Task 1 complete — `[what Task 1 produced that this task needs]`  
**File(s) to create/edit:** `[exact path]`  
**Test file:** `[exact test file path]`  
**Pattern reference:** `[Golden Pair file to follow]`  
**Input:** `[exact input]`  
**Output:** `[exact expected output]`  
**Mocks needed:** `[what to mock and how — or "none"]`  
**Implementation notes:** [specific decisions or context, including any decisions made in Task 1 that affect this task]  
**Done when:**
- [ ] [specific, verifiable condition 1]
- [ ] [specific, verifiable condition 2]
- [ ] All unit tests below pass

**Unit tests (developer-owned) — all scenarios mocked:**
| # | Name | Scenario | Mocks |
|---|---|---|---|
| 2.U1 | `[test name]` | ✅ [happy path — what correct input produces] | `[what is mocked]` |
| 2.U2 | `[test name]` | ❌ [negative — what invalid input or failure produces] | `[what is mocked]` |
| 2.U3 | `[test name]` | ⚠️ [edge case — boundary, empty, or unexpected value] | `[what is mocked]` |

> Unit tests must pass before this task is marked ✅ Complete.  
> API and Cypress/E2E coverage is handled separately by the automation engineer (see Sections 9 and 10).

**Before starting this task, verify:**
- [ ] Task 1 is marked ✅ Complete in the Task Queue
- [ ] `[file produced by Task 1]` exists at `[path]`

---

### Task 3: [Title]

> **Jira-ready:**  
> **Title:** `[FEATURE-KEY] Task 3: [Title]`  
> **Description:** `[One sentence: what is being built or changed, in which file/layer, and what it produces or enables.]`

**Status:** ⬜ Pending  
**Depends on:** Task 2 complete — `[what Task 2 produced that this task needs]`  
**File(s) to create/edit:** `[exact path]`  
**Test file:** `[exact test file path]`  
**Pattern reference:** `[Golden Pair file to follow]`  
**Input:** `[exact input]`  
**Output:** `[exact expected output]`  
**Mocks needed:** `[what to mock and how — or "none"]`  
**Implementation notes:** [specific decisions or context, including any decisions made in Tasks 1 and 2 that affect this task]  
**Done when:**
- [ ] [specific, verifiable condition 1]
- [ ] [specific, verifiable condition 2]
- [ ] All unit tests below pass
- [ ] Full unit test suite passes with no regressions

**Unit tests (developer-owned) — all scenarios mocked:**
| # | Name | Scenario | Mocks |
|---|---|---|---|
| 3.U1 | `[test name]` | ✅ [happy path — what correct input produces] | `[what is mocked]` |
| 3.U2 | `[test name]` | ❌ [negative — what invalid input or failure produces] | `[what is mocked]` |
| 3.U3 | `[test name]` | ⚠️ [edge case — boundary, empty, or unexpected value] | `[what is mocked]` |

> Unit tests must pass before this task is marked ✅ Complete.  
> API and Cypress/E2E coverage is handled separately by the automation engineer (see Sections 9 and 10).

**Before starting this task, verify:**
- [ ] Task 2 is marked ✅ Complete in the Task Queue
- [ ] `[file produced by Task 2]` exists at `[path]`

---

## 9. API Test Plan
> **For the automation engineer.** These scenarios are defined here so API test work can begin once all tasks are complete.  
> Developer tasks are not blocked by this section.

**Base URL:** `[e.g. http://localhost:3000/api]`  
**Auth required:** `[bearer token / session cookie / none]`  
**Test file to create:** `[e.g. tests/api/[feature-name].test.ts]`

| # | Name | Method + Route | Scenario |
|---|---|---|---|
| A.1 | `[test name]` | `[METHOD /path]` | ✅ [expected response on valid request] |
| A.2 | `[test name]` | `[METHOD /path]` | ❌ [expected response on invalid request] |
| A.3 | `[test name]` | `[METHOD /path]` | ⚠️ [edge case or contract boundary] |

> These tests are **not** part of any task's Done when criteria.  
> Ready to be picked up once Section 10 Session State shows all tasks ✅ Complete.

---

## 10. Cypress / E2E Test Plan
> **For the automation engineer.** These scenarios are defined here so E2E work can begin once all tasks are complete.  
> Developer tasks are not blocked by this section.

**Entry point:** `[URL or user action that starts the flow]`  
**Auth state required:** `[logged in as X / unauthenticated / etc.]`  
**Test file to create:** `[e.g. cypress/e2e/[feature-name].cy.ts]`

| # | Name | Scenario |
|---|---|---|
| E2E.1 | `[test name]` | ✅ [full happy-path user journey] |
| E2E.2 | `[test name]` | ❌ [error state visible to the user] |
| E2E.3 | `[test name]` | ⚠️ [boundary or async edge case] |

> These tests are **not** part of any task's Done when criteria.  
> Ready to be picked up once Section 10 Session State shows all tasks ✅ Complete.

---

## 11. Session State
> Updated automatically at the end of each task.  
> If resuming: read this section first, then go directly to the next pending task specification.

**Last updated:** [date / session]  
**Last completed task:** Task [N] — [title]  
**Next task:** Task [N+1] — [title]  
**Key decisions made so far:** [running list of implementation decisions that affect future tasks]  
**Blockers:** [anything unresolved — or "none"]

**Worktrees:**
| Task | Branch | Worktree Path | Status |
|---|---|---|---|
| Task 1 | `[branch-name]` | `.worktrees/[jira-key]-task-1/` | ⬜ Not created / 🔄 Active / ✅ Merged & removed |
| Task 2 | `[branch-name]` | `.worktrees/[jira-key]-task-2/` | ⬜ Not created / 🔄 Active / ✅ Merged & removed |
| Task 3 | `[branch-name]` | `.worktrees/[jira-key]-task-3/` | ⬜ Not created / 🔄 Active / ✅ Merged & removed |
```

**⛔ STOP HERE. Do not write any code. Await user approval.**

---

## PHASE 2: Implementation Mode

**Trigger:** User says `"Proceed"` or `"Approve"`

**Execution rules:**

1. Read `skills/SEARCH_PROTOCOL.md` first
2. Read the plan file and check Session State for current position
3. Identify the first task with status ⬜ Pending — set it to 🔄 In Progress
4. **Create a git worktree and branch for this task** (see Git Worktree Rules below)
5. Execute **only that task** inside the worktree using its Task Specification as the sole guide
6. Verify all **Done when** conditions are met before marking complete
7. Mark task ✅ Complete in the Task Queue
8. Update Session State — last completed, next task, any new decisions, worktree path
9. **Stop and report completion** — do not automatically start the next task
10. Wait for user to confirm before proceeding to the next task

> **Sequential enforcement:** Never execute Task N+1 while Task N is not ✅ Complete.  
> **Scope enforcement:** Never implement anything outside the current task's specification.  
> **Conflict check:** Before starting any task, verify no other session has set it to 🔄 In Progress.

---

## Git Worktree Rules

Every task gets its own git worktree and branch so it can be reviewed, merged, and shipped independently.

### Branch naming convention
```
[jira-key]/task-[N]-[slugified-task-title]
```
Examples:
- `gp-001/task-1-create-worldline-session-endpoint`
- `gp-002/task-2-initialise-worldline-js-sdk`

Slugify rules: lowercase, spaces → hyphens, remove special characters.

### Worktree path convention
```
.worktrees/[jira-key]-task-[N]/
```
Examples:
- `.worktrees/gp-001-task-1/`
- `.worktrees/gp-002-task-2/`

### Setup commands (run at the start of each task)
```bash
# Create branch off main (or the base branch for this project)
git checkout main && git pull

# Create the worktree and branch in one step
git worktree add .worktrees/[jira-key]-task-[N] -b [branch-name]

# Confirm worktree is ready
git worktree list
```

### Teardown (run after the task branch is merged)
```bash
# Remove the worktree once the PR is merged
git worktree remove .worktrees/[jira-key]-task-[N]

# Delete the local branch
git branch -d [branch-name]
```

### Worktree enforcement rules
- **One worktree per task** — never share a worktree across tasks
- **Never commit directly to `main`** — all work happens in the task branch
- **Branch off `main`** unless the task depends on a previous unmerged task, in which case branch off that task's branch and note it in Session State
- **Record the worktree path and branch name in Session State** after creation so a resumed session can locate it immediately
- If a worktree already exists for a task when starting, stop and report it — do not overwrite

---

## Notes

- Never skip the plan for Moderate or Complex tickets, even under deadline pressure
- If scope changes during implementation, update the Impact Map and Task Specifications before continuing — do not proceed with stale specs
- One plan file per feature — do not bundle multiple features into one plan
- Task Specifications are the source of truth during implementation — if the spec and the conversation conflict, the spec wins