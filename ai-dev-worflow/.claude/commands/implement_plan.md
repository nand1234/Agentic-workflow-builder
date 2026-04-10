**Role:** Senior Engineer  
**Goal:** Read a feature plan file, execute each task sequentially inside its own git worktree, verify all Done when conditions, update the plan's Session State after each task, and stop for user confirmation before moving to the next task.

---

## PHASE 0: Load Plan

- A path to a plan file (e.g. `.claude/plans/google_pay.md`)
- The plan content pasted directly into the conversation

**On load, extract and confirm:**

| Field | Where in plan |
|---|---|
| Feature name | Plan header |
| Jira key prefix | Task Queue — Jira Summary column |
| All task titles and statuses | Section 6 — Task Queue |
| Full task specifications | Section 7 — Task Specifications |
| Session State | Section 11 |
| Worktrees table | Section 11 — Worktrees |

**Print a load summary before doing anything else:**

```
📋 Plan loaded: [Feature Name]
📁 Plan file: .claude/plans/[feature_name].md

Tasks:
  ⬜ Task 1 — [title]
  ⬜ Task 2 — [title]
  ⬜ Task 3 — [title]

Session State:
  Last completed: [Task N or "none"]
  Next task: [Task N+1]
  Active worktrees: [list or "none"]

Ready to start Task [N]. Type "Start" to begin or "Start Task [N]" to resume from a specific task.
```

**⛔ STOP. Wait for user to say "Start" or "Start Task [N]" before proceeding.**

---

## PHASE 1: Pre-Task Checks

Before executing any task, run these checks in order. Stop and report if any fail.

### 1A — Plan integrity
- [ ] Plan file exists and is readable
- [ ] Task to execute has status ⬜ Pending (not 🔄 In Progress or ✅ Complete)
- [ ] All dependency tasks listed in `Depends on:` are marked ✅ Complete
- [ ] No other session has set this task to 🔄 In Progress — if it is, stop and report

### 1B — Git state
- [ ] Git repo is clean — no uncommitted changes on current branch (`git status`)
- [ ] `main` branch is up to date (`git fetch && git status`)
- [ ] No existing worktree for this task (`git worktree list`) — if one exists, stop and report

### 1C — Task spec completeness
- [ ] `File(s) to create/edit` field is filled
- [ ] `Input` and `Output` fields are filled
- [ ] `Done when` checklist has at least one item
- [ ] Unit tests table has at least one row

If any check fails → print which check failed and what the user needs to resolve. Do not proceed.

---

## PHASE 2: Worktree Setup

Once all Phase 1 checks pass, create the worktree for this task.

### Derive names automatically from the plan

**Branch name:**
```
[jira-key-lowercase]/task-[N]-[slugified-task-title]
```
- Lowercase the Jira key
- Slugify the task title: lowercase, spaces → hyphens, strip special characters
- Example: `gp/task-1-create-worldline-session-endpoint`

**Worktree path:**
```
.worktrees/[jira-key-lowercase]-task-[N]/
```
- Example: `.worktrees/gp-task-1/`

### Run setup commands
```bash
# Pull latest main
git checkout main && git pull

# Create worktree and branch
git worktree add .worktrees/[jira-key]-task-[N] -b [branch-name]

# Confirm
git worktree list
```

### After successful setup
- Update the Worktrees table in Section 11 of the plan: set this task's row to 🔄 Active
- Set task status to 🔄 In Progress in the Task Queue
- Print confirmation:
  ```
  ✅ Worktree ready
  Branch: [branch-name]
  Path:   .worktrees/[jira-key]-task-[N]/
  
  Starting implementation of Task [N]: [title]
  ```

---

## PHASE 3: Task Implementation

Execute the task using its Task Specification as the **sole source of truth**. No prior session memory, no assumptions beyond what the spec states.

### Implementation order within each task

1. Read `skills/SEARCH_PROTOCOL.md` and identify the Golden Pair for this task's domain
2. Create or edit files listed in `File(s) to create/edit` — follow the `Pattern reference` exactly
3. Implement logic described in `Input` → `Output`
4. Apply all `Implementation notes` decisions — do not deviate
5. Create the test file listed in `Test file`
6. Implement every unit test in the unit tests table:
   - Name the test exactly as specified in the `Name` column
   - Cover the scenario described in the `Scenario` column
   - Apply mocks described in the `Mocks` column
7. Run the tests — all must pass before continuing

### Scope enforcement
- **Only touch files listed in `File(s) to create/edit`** — no opportunistic refactors
- **Only implement what the current task spec describes** — if something is missing from the spec, stop and ask rather than infer
- **Do not write API or Cypress tests** — those are in Sections 9 and 10 for the automation engineer

### If blocked during implementation
Stop immediately and report:
```
🚫 Blocked on Task [N]: [title]

Blocker: [description of what is missing or unclear]
Options:
  1. Clarify the spec — describe what needs to change
  2. Skip this task — mark as 🚫 Blocked and move to the next
  3. Abort — stop the implementation session
```
Update the task status to 🚫 Blocked in the Task Queue and Session State. Wait for user instruction.

---

## PHASE 4: Done When Verification

Before marking a task complete, verify every item in the `Done when` checklist.

Work through each checkbox explicitly:

```
Verifying Done when for Task [N]:
  ✅ [condition 1] — [how it was verified]
  ✅ [condition 2] — [how it was verified]
  ✅ All unit tests pass — [test output summary]
```

If any condition cannot be verified → task stays 🔄 In Progress. Report what is unresolved and wait for user input.

Only when **all** conditions are checked → proceed to Phase 5.

---

## PHASE 5: Commit and Update Plan

### Commit the work
```bash
cd .worktrees/[jira-key]-task-[N]

# Stage all files changed in this task
git add [file(s) listed in task spec]

# Commit with a structured message
git commit -m "[jira-key] Task [N]: [task title]

- [one line per Done when condition met]
- Unit tests: [N] passing"
```

### Update the plan file
In `.claude/plans/[feature_name].md`:

1. **Task Queue** — mark this task ✅ Complete
2. **Task Specification** — mark this task's status ✅ Complete
3. **Session State** — update:
   - `Last updated`: today's date
   - `Last completed task`: Task [N] — [title]
   - `Next task`: Task [N+1] — [title] (or "All tasks complete" if last)
   - `Key decisions made so far`: append any new decisions from this task
4. **Worktrees table** — keep this task's row as 🔄 Active (not yet merged)

### Commit the updated plan
```bash
# Plan update goes on main, not the task branch
cd [project root]
git add .claude/plans/[feature_name].md
git commit -m "[jira-key] Update plan: Task [N] complete"
```

---

## PHASE 6: Task Completion Report

Print a summary and stop:

```
✅ Task [N] complete: [title]

Branch:    [branch-name]
Worktree:  .worktrees/[jira-key]-task-[N]/
Files changed:
  - [file 1]
  - [file 2]
Tests:     [N] unit tests passing

Done when:
  ✅ [condition 1]
  ✅ [condition 2]
  ✅ All unit tests pass

Next task: Task [N+1] — [title]

To continue: type "Next" or "Start Task [N+1]"
To ship this task first: open a PR from branch [branch-name] → main
To stop here: type "Stop"
```

**⛔ STOP. Do not start the next task until the user responds.**

---

## PHASE 7: Worktree Teardown (after PR merge)

This phase runs only when the user confirms a task branch has been merged.

**Trigger:** User says `"Merged Task [N]"` or `"Cleanup Task [N]"`

```bash
# Remove the worktree
git worktree remove .worktrees/[jira-key]-task-[N]

# Delete the local branch
git branch -d [branch-name]

# Confirm
git worktree list
```

Update the Worktrees table in the plan: set this task's row to ✅ Merged & removed.

Print confirmation:
```
🧹 Worktree cleaned up
Branch [branch-name] removed
.worktrees/[jira-key]-task-[N]/ removed
```

---

## Resuming a Session

If the plan already has tasks in progress (e.g. after a break):

1. Load the plan and read Section 11 Session State
2. Print the load summary from Phase 0
3. Identify the last completed task and the next pending task
4. Check the Worktrees table — if a worktree already exists for the next task, skip Phase 2 and go straight to Phase 3
5. Ask the user to confirm before resuming:
   ```
   Resuming from Task [N]: [title]
   Existing worktree found at .worktrees/[jira-key]-task-[N]/
   Type "Resume" to continue or "Start fresh" to recreate the worktree.
   ```

---

## Hard Rules

- **Never start a task without completing Phase 1 checks** — no exceptions
- **Never implement outside the current task's spec** — scope creep breaks the worktree model
- **Never commit to `main` directly** — all implementation work goes in the task branch
- **Never auto-advance to the next task** — always stop and wait for the user after Phase 6
- **Never skip the Done when verification** — partial completion is not completion
- **Never delete a worktree that has uncommitted changes** — report and wait for user
- **The plan file is the source of truth** — if memory and the plan conflict, the plan wins

---

## Notes

- If `skills/SEARCH_PROTOCOL.md` is missing, stop at Phase 3 step 1 and ask the user to provide it or run `/generate-skill` first
- If the plan has no Session State section, treat all tasks as ⬜ Pending and start from Task 1
- If a task's `Pattern reference` points to a file that does not exist, stop and report — do not guess the pattern
- One session handles one task at a time — do not parallelize across worktrees