**Role:** Senior Engineer  
**Goal:** Read a feature plan file, execute each task sequentially inside its own git worktree, push the task branch to origin with an MR, merge into a local feature branch for integration testing, verify all Done when conditions, update the plan's Session State after each task, and stop for user confirmation before moving to the next task.

---

## Branching Strategy

```
main
 │
 ├─── task-1-branch ──► push to origin ──► MR for review
 │         │
 ├─── task-2-branch ──► push to origin ──► MR for review
 │         │
 └─── task-3-branch ──► push to origin ──► MR for review
           │
feature/[feature-name]  (LOCAL ONLY — merge each task branch here for integration testing)
```

- **Task branches** are pushed to origin so other devs can review each MR independently.
- **Feature branch** stays local — used only to merge all task branches together and test the feature as a whole.
- Task branches are branched from `master` (not from each other), unless a task explicitly depends on an unmerged prior task.
- Once all tasks are done and tested on the feature branch, the individual task MRs are merged into `master` one by one (or the feature branch is used to create a single MR — user decides at the end).

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
Plan loaded: [Feature Name]
Plan file: .claude/plans/[feature_name].md

Tasks:
  Task 1 — [title]
  Task 2 — [title]
  Task 3 — [title]

Session State:
  Last completed: [Task N or "none"]
  Next task: [Task N+1]
  Active worktrees: [list or "none"]
  Feature branch: [name or "not created yet"]

Ready to start Task [N]. Type "Start" to begin or "Start Task [N]" to resume from a specific task.
```

**STOP. Wait for user to say "Start" or "Start Task [N]" before proceeding.**

---

## PHASE 1: Pre-Task Checks

Before executing any task, run these checks in order. Stop and report if any fail.

### 1A — Plan integrity
- [ ] Plan file exists and is readable
- [ ] Task to execute has status Pending (not In Progress or Complete)
- [ ] All dependency tasks listed in `Depends on:` are marked Complete
- [ ] No other session has set this task to In Progress — if it is, stop and report

### 1B — Git state
- [ ] Git repo is clean — no uncommitted changes on current branch (`git status`)
- [ ] `master` branch is up to date (`git fetch && git status`)
- [ ] No existing worktree for this task (`git worktree list`) — if one exists, stop and report

### 1C — Task spec completeness
- [ ] `File(s) to create/edit` field is filled
- [ ] `Input` and `Output` fields are filled
- [ ] `Done when` checklist has at least one item
- [ ] Unit tests table has at least one row

If any check fails print which check failed and what the user needs to resolve. Do not proceed.

---

## PHASE 2: Worktree & Feature Branch Setup

Once all Phase 1 checks pass, set up the feature branch (if first task) and the task worktree.

### 2A — Create local feature branch (first task only)

If this is Task 1 and no feature branch exists yet:

```bash
# Create local feature branch from master
git checkout master && git pull
git checkout -b feature/[feature-name]
git checkout master
```

The feature branch is **never pushed to origin**. It exists only for local integration testing.

### 2B — Derive task branch names automatically from the plan

**Branch name:**
```
[jira-key-lowercase]/task-[N]-[slugified-task-title]
```
- Lowercase the Jira key
- Slugify the task title: lowercase, spaces to hyphens, strip special characters
- Example: `bn-xxxx/task-1-add-worldline-inline-payment-feature-flag`

**Worktree path:**
```
.worktrees/[jira-key-lowercase]-task-[N]/
```
- Example: `.worktrees/bn-xxxx-task-1/`

### 2C — Create the worktree

```bash
# Pull latest master
git checkout master && git pull

# Create worktree and branch
git worktree add .worktrees/[jira-key]-task-[N] -b [branch-name]

# Confirm
git worktree list
```

### After successful setup
- Update the Worktrees table in Section 11 of the plan: set this task's row to Active
- Set task status to In Progress in the Task Queue
- Print confirmation:
  ```
  Worktree ready
  Branch: [branch-name]
  Path:   .worktrees/[jira-key]-task-[N]/
  Feature branch: feature/[feature-name]
  
  Starting implementation of Task [N]: [title]
  ```

---

## PHASE 3: Task Implementation

Execute the task using its Task Specification as the **sole source of truth**. No prior session memory, no assumptions beyond what the spec states.

### Implementation order within each task

1. Read `skills/SEARCH_PROTOCOL.md` if it exists — identify the Golden Pair for this task's domain
2. Create or edit files listed in `File(s) to create/edit` — follow the `Pattern reference` exactly
3. Implement logic described in `Input` to `Output`
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
Blocked on Task [N]: [title]

Blocker: [description of what is missing or unclear]
Options:
  1. Clarify the spec — describe what needs to change
  2. Skip this task — mark as Blocked and move to the next
  3. Abort — stop the implementation session
```
Update the task status to Blocked in the Task Queue and Session State. Wait for user instruction.

---

## PHASE 4: Done When Verification

Before marking a task complete, verify every item in the `Done when` checklist.

Work through each checkbox explicitly:

```
Verifying Done when for Task [N]:
  [condition 1] — [how it was verified]
  [condition 2] — [how it was verified]
  All unit tests pass — [test output summary]
```

If any condition cannot be verified the task stays In Progress. Report what is unresolved and wait for user input.

Only when **all** conditions are checked proceed to Phase 5.

---

## PHASE 5: Commit, Push, MR & Merge to Feature Branch

### 5A — Run quality gates
Run the quality gates as per `CLAUDE.md` before committing:
```bash
cd .worktrees/[jira-key]-task-[N]
# Run relevant quality gates (phpstan, phpcs, tests, etc.)
```

### 5B — Commit the work
```bash
cd .worktrees/[jira-key]-task-[N]

# Stage all files changed in this task
git add [file(s) listed in task spec]

# Commit with a structured message
git commit -m "[jira-key] Task [N]: [task title]

- [one line per Done when condition met]
- Unit tests: [N] passing

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### 5C — Push task branch to origin and create MR
```bash
# Push the task branch to origin
git push -u origin [branch-name]
```

Create a merge request using `gh` or `glab` (whichever is available):
```bash
# GitLab example
glab mr create --title "[jira-key] Task [N]: [task title]" --description "$(cat <<'EOF'
## Summary
- [1-3 bullet points describing what this task does]

## Done when
- [list from task spec]

## Test plan
- [N] unit tests passing
- Quality gates passing

## Part of
Feature: [Feature Name] (Task [N] of [total])

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" --target-branch master
```

If `glab` / `gh` is not available, print the push confirmation and instruct the user to create the MR manually.

### 5D — Merge task branch into local feature branch
```bash
# Go back to project root
cd [project root]

# Merge the task branch into the local feature branch
git checkout feature/[feature-name]
git merge [branch-name] --no-ff -m "Merge [branch-name] into feature/[feature-name]"
git checkout master
```

This keeps the feature branch up to date with all completed tasks for integration testing.

### 5E — Update the plan file
In `.claude/plans/[feature_name].md`:

1. **Task Queue** — mark this task Complete
2. **Task Specification** — mark this task's status Complete
3. **Session State** — update:
   - `Last updated`: today's date
   - `Last completed task`: Task [N] — [title]
   - `Next task`: Task [N+1] — [title] (or "All tasks complete" if last)
   - `Key decisions made so far`: append any new decisions from this task
   - `MR link`: add the MR URL if created
4. **Worktrees table** — set this task's row to Pushed (MR created)

### 5F — Commit the updated plan
```bash
cd [project root]
git checkout master
git add .claude/plans/[feature_name].md
git commit -m "[jira-key] Update plan: Task [N] complete"
```

---

## PHASE 6: Task Completion Report

Print a summary and stop:

```
Task [N] complete: [title]

Branch:    [branch-name]
Worktree:  .worktrees/[jira-key]-task-[N]/
MR:        [MR URL or "create manually"]
Files changed:
  - [file 1]
  - [file 2]
Tests:     [N] unit tests passing

Done when:
  [condition 1]
  [condition 2]
  All unit tests pass

Feature branch: feature/[feature-name] (updated — includes Tasks 1 through [N])

Next task: Task [N+1] — [title]

Commands:
  "Next" or "Start Task [N+1]" — start the next task
  "Test feature" — switch to feature branch to test the integrated feature
  "Stop" — end the session
```

**STOP. Do not start the next task until the user responds.**

---

## PHASE 7: Feature Branch Testing

**Trigger:** User says `"Test feature"` at any point after at least one task is merged into the feature branch.

```bash
git checkout feature/[feature-name]
# User can now run the full test suite, start the app, etc.
```

Print:
```
Switched to feature branch: feature/[feature-name]
This branch contains: Tasks [list of merged task numbers]

You can now test the integrated feature.

When done testing:
  "Back to master" — return to master and continue with the next task
  "Start Task [N]" — continue implementation
```

When user is done testing:
```bash
git checkout master
```

---

## PHASE 8: Worktree Cleanup (after task MR is merged into master)

This phase runs only when the user confirms a task MR has been merged into master.

**Trigger:** User says `"Merged Task [N]"` or `"Cleanup Task [N]"`

```bash
# Remove the worktree
git worktree remove .worktrees/[jira-key]-task-[N]

# Delete the local branch (already merged via MR)
git branch -d [branch-name]

# Confirm
git worktree list
```

Update the Worktrees table in the plan: set this task's row to Merged & removed.

Print confirmation:
```
Worktree cleaned up
Branch [branch-name] removed
.worktrees/[jira-key]-task-[N]/ removed
```

---

## PHASE 9: Feature Complete

**Trigger:** All tasks are marked Complete and all MRs are merged (or user says `"Feature complete"`).

```bash
# Update feature branch with latest master (all MRs merged)
git checkout master && git pull
git checkout feature/[feature-name]
git merge master

# Verify feature branch is in sync with master
git diff master..feature/[feature-name] --stat
```

If the feature branch is in sync with master (no diff), the feature branch can be safely deleted:
```bash
git checkout master
git branch -d feature/[feature-name]
```

Print:
```
Feature complete: [Feature Name]

All tasks:
  Task 1 — [title] — MR merged
  Task 2 — [title] — MR merged
  Task 3 — [title] — MR merged

Feature branch feature/[feature-name] cleaned up.
All individual MRs have been merged into master.
```

If the feature branch has divergence from master (e.g. merge conflict resolutions), inform the user and let them decide whether to keep or delete it.

---

## Resuming a Session

If the plan already has tasks in progress (e.g. after a break):

1. Load the plan and read Section 11 Session State
2. Print the load summary from Phase 0
3. Identify the last completed task and the next pending task
4. Check the Worktrees table — if a worktree already exists for the next task, skip Phase 2 and go straight to Phase 3
5. Check if the feature branch exists (`git branch --list feature/[feature-name]`)
6. Ask the user to confirm before resuming:
   ```
   Resuming from Task [N]: [title]
   Existing worktree found at .worktrees/[jira-key]-task-[N]/
   Feature branch: feature/[feature-name] (contains Tasks 1-[N-1])
   Type "Resume" to continue or "Start fresh" to recreate the worktree.
   ```

---

## Hard Rules

- **Never start a task without completing Phase 1 checks** — no exceptions
- **Never implement outside the current task's spec** — scope creep breaks the worktree model
- **Never commit to `master` directly** — all implementation work goes in the task branch
- **Never push the feature branch to origin** — it is local-only for integration testing
- **Never auto-advance to the next task** — always stop and wait for the user after Phase 6
- **Never skip the Done when verification** — partial completion is not completion
- **Never delete a worktree that has uncommitted changes** — report and wait for user
- **The plan file is the source of truth** — if memory and the plan conflict, the plan wins
- **Run quality gates before every commit** — as per CLAUDE.md

---

## Notes

- If `skills/SEARCH_PROTOCOL.md` is missing, skip that step in Phase 3 — do not block on it
- If the plan has no Session State section, treat all tasks as Pending and start from Task 1
- If a task's `Pattern reference` points to a file that does not exist, stop and report — do not guess the pattern
- One session handles one task at a time — do not parallelize across worktrees
- The feature branch may have merge conflicts when merging task branches — resolve them during Phase 5D and note in the plan
- If `glab` is not available for MR creation, print the branch name and instruct the user to create the MR manually via the GitLab UI
- Task branches are based on `master` by default. If a task depends on an unmerged prior task, branch from that task's branch instead and note the dependency in the MR description
