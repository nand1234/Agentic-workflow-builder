# ⚙️ COMMAND: /implement:plan (v1.8)

**Role:** Senior Engineer  
**Goal:** Read a feature plan file from the CP (Change Package) branch, execute each task sequentially inside its own git worktree branched off CP, merge the task branch into the local CP branch for integration testing, then push the task branch to origin for manual review. The agent never commits to or touches `main`. Task MRs target `main` independently. Merging MRs is always done by the user.

---

## PHASE 0: Load Plan

**Trigger:** User runs `/implement:plan` and provides either:
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

CP branch:  cp/[feature-name]  (user-created, holds plan file)

Ready to start Task [N]. Type "Start" to begin or "Start Task [N]" to resume from a specific task.
```

**On first run**, confirm the CP branch exists and is checked out:
```bash
git branch | grep cp/[feature-name]
git status  # should show "On branch cp/[feature-name]"
```
If the CP branch does not exist, stop and ask the user to create it before proceeding (see CP Branch Rules).

> ⚠️ The CP branch is created by the user, not the agent. The agent reads the plan from it and branches task worktrees off it.

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
- [ ] Branch name is between 7 and 10 characters — run `echo -n "[branch-name]" | wc -c` to verify
- [ ] CP branch `cp/[feature-name]` exists locally and is up to date (`git fetch origin && git status`)

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
[JIRA-KEY]-[N][SHORT-SUFFIX]
```

Rules:
- Format: uppercase Jira key + hyphen + task number + optional 1–2 char suffix
- **Total length must be between 7 and 10 characters** — enforce strictly
- Use the Jira key and task number exactly as they appear in the plan
- If the Jira key + task number already gives 7–10 chars, no suffix needed
- If shorter than 7, append a short suffix derived from the task title (first consonants or abbreviation)
- Never use the full task title in the branch name
- Always uppercase

Examples:
| Jira key | Task | Branch name | Length |
|---|---|---|---|
| GP | 1 | `GP-001` | 6 → too short, add suffix → `GP-001S` (S = session) |
| BN | 4556 | `BN-4556` | 7 ✅ |
| AUTH | 12 | `AUTH-12` | 7 ✅ |
| PAYM | 99 | `PAYM-99` | 7 ✅ |
| FE | 1 | `FE-001-T` | 8 ✅ |

**Length check — run before creating the worktree:**
```bash
echo -n "[branch-name]" | wc -c  # must be between 7 and 10
```
If outside 7–10 chars, adjust the suffix and recheck before proceeding.

**Worktree path:**
```
.worktrees/[branch-name]/
```
- Derived directly from the branch name — lowercase it for the path
- Example: `.worktrees/bn-4556/`, `.worktrees/auth-12/`

### Run setup commands
```bash
# Fetch latest CP branch
git fetch origin

# Create worktree and task branch off CP branch
git worktree add .worktrees/[branch-name-lowercase] -b [branch-name] cp/[feature-name]

# Confirm
git worktree list
```

> Task branches are always created off the CP branch — never off `main` directly.

### After successful setup
- Update the Worktrees table in Section 11 of the plan: set this task's row to 🔄 Active
- Set task status to 🔄 In Progress in the Task Queue
- Print confirmation:
  ```
  ✅ Worktree ready
  Branch: [branch-name]  ([N] chars)
  Path:   .worktrees/[branch-name-lowercase]/
  
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

## PHASE 4: Quality Gates + Done When Verification

Before marking a task complete, run all applicable quality gates first, then verify the `Done when` checklist.  
**A task cannot be marked ✅ Complete until every quality gate passes.**

---

### Step 1 — Detect changed file types

```bash
cd .worktrees/[branch-name-lowercase]

# List all files changed in this task
git diff --name-only cp/[feature-name]
```

Use the output to determine which gates apply:

| If any changed file matches | Run this gate |
|---|---|
| `*.php` | PHPStan + PHPUnit (100% coverage) |
| `*.vue`, `*.js`, `*.ts`, `*.jsx`, `*.tsx` | Prettier |
| Both | Run all three |

---

### Step 2 — PHPStan (run if any `.php` file changed)

```bash
cd .worktrees/[branch-name-lowercase]

./vendor/bin/phpstan analyse --level=max
```

**Pass:** No errors reported.  
**Fail:** Stop immediately. Do not proceed to Done When or Phase 5.

Print the failure report:
```
🚫 Quality gate failed — PHPStan

Errors:
  [paste phpstan output]

Fix all errors before this task can be marked complete.
```

Fix all PHPStan errors, re-run, confirm clean output, then continue.

---

### Step 3 — PHPUnit with coverage (run if any `.php` file changed)

```bash
cd .worktrees/[branch-name-lowercase]

./vendor/bin/phpunit --coverage-text --coverage-clover=coverage.xml
```

Then check coverage is 100% for files changed in this task:

```bash
# Extract coverage % for each changed PHP file from coverage.xml
# All changed files must show 100% line and method coverage
grep -E "(filename|line-rate|branch-rate)" coverage.xml \
  | grep -f <(git diff --name-only cp/[feature-name] | grep \.php)
```

**Pass:** All PHP files changed in this task show 100% line coverage and 100% method coverage.  
**Fail:** Stop immediately. Do not proceed to Done When or Phase 5.

Print the failure report:
```
🚫 Quality gate failed — PHPUnit coverage

Files below 100% coverage:
  [file]: [actual]% line coverage, [actual]% method coverage

Add or fix unit tests until all changed PHP files reach 100% coverage.
```

Fix missing test coverage, re-run, confirm 100% on all changed files, then continue.

---

### Step 4 — Prettier (run if any `.vue`, `.js`, `.ts`, `.jsx`, or `.tsx` file changed)

```bash
cd .worktrees/[branch-name-lowercase]

npx prettier --check .
```

**Pass:** No formatting issues found.  
**Fail:** Stop immediately. Do not proceed to Done When or Phase 5.

Print the failure report:
```
🚫 Quality gate failed — Prettier

Files with formatting issues:
  [paste prettier output]

Run `npx prettier --write .` to fix, then re-run --check to confirm.
```

Fix all formatting issues, re-run `--check`, confirm clean output, then continue.

---

### Step 5 — Done When Verification

Once all applicable quality gates pass, verify every item in the `Done when` checklist.

Work through each checkbox explicitly:

```
Quality gates:
  ✅ PHPStan   — no errors        (or "n/a — no PHP files changed")
  ✅ PHPUnit   — 100% coverage    (or "n/a — no PHP files changed")
  ✅ Prettier  — no issues        (or "n/a — no frontend files changed")

Done when for Task [N]:
  ✅ [condition 1] — [how it was verified]
  ✅ [condition 2] — [how it was verified]
  ✅ All unit tests pass — [test output summary]
```

If any condition cannot be verified → task stays 🔄 In Progress. Report what is unresolved and wait for user input.

Only when **all quality gates pass** and **all Done when conditions are checked** → proceed to Phase 5.

---

## PHASE 5: Commit, Merge to Feature Branch, and Update Plan

### Step 1 — Commit the task work to the task branch
```bash
cd .worktrees/[jira-key]-task-[N]

# Stage all files changed in this task
git add [file(s) listed in task spec]

# Commit with a structured message
git commit -m "[jira-key] Task [N]: [task title]

- [one line per Done when condition met]
- Unit tests: [N] passing
- PHPStan: clean (or n/a)
- PHPUnit: 100% coverage (or n/a)
- Prettier: clean (or n/a)"
```

> The agent only commits inside the task worktree. Never commits to `main` or any other branch.

### Step 2 — Merge task branch into local CP branch
```bash
# Switch to the CP branch
git checkout cp/[feature-name]

# Merge the task branch — no fast-forward so the merge commit is visible
git merge --no-ff [branch-name] -m "Merge [branch-name] into cp/[feature-name]"

# Confirm
git log --oneline -5
```

> The CP branch is **local only for integration testing** — the agent never pushes it to origin.
> It already exists on origin (user created it) but the agent only merges into the local copy.

### Step 3 — Push task branch to origin and create draft MR
```bash
cd .worktrees/[jira-key]-task-[N]
git push origin [branch-name]
```

Then create a draft MR using the CLI:

**GitHub (`gh`):**
```bash
gh pr create \
  --title "[Jira Summary from plan]" \
  --body "[Task description]. Draft — do not merge until full feature is tested on local feature branch." \
  --base main \
  --head [branch-name] \
  --draft
```

**GitLab (`glab`):**
```bash
glab mr create \
  --title "[Jira Summary from plan]" \
  --description "[Task description]. Draft — do not merge until full feature is tested on local feature branch." \
  --source-branch [branch-name] \
  --target-branch main \
  --draft
```

> If neither `gh` nor `glab` is available, print the MR details for the user to raise manually (see Phase 6 report).  
> The agent always creates MRs as **draft** — the user marks them ready only after the full feature is tested locally.

### Step 4 — Update the plan file on the CP branch
```bash
# Ensure we are on the CP branch
git checkout cp/[feature-name]

# Commit plan update to CP branch — this is where the plan lives
git add .claude/plans/[feature_name].md
git commit -m "[jira-key] Update plan: Task [N] complete"
```

Update the following in `.claude/plans/[feature_name].md`:
1. **Task Queue** — mark this task ✅ Complete
2. **Task Specification** — mark this task's status ✅ Complete
3. **Session State** — update:
   - `Last updated`: today's date
   - `Last completed task`: Task [N] — [title]
   - `Next task`: Task [N+1] — [title] (or "All tasks complete" if last)
   - `Key decisions made so far`: append any new decisions from this task
4. **Worktrees table** — set this task's row to 🔀 Merged to CP / Draft MR open

> The plan always lives on the CP branch. Task branches never carry the plan file.

---

## PHASE 6: Task Completion Report

Print a summary and stop:

```
✅ Task [N] complete: [title]

Task branch:     [branch-name]  →  pushed to origin ✅
Draft MR:        [branch-name] → main  →  created as draft ✅
CP branch:       cp/[feature-name]  →  [branch-name] merged in locally ✅
Worktree:        .worktrees/[jira-key]-task-[N]/

Files changed:
  - [file 1]
  - [file 2]
Tests:     [N] unit tests passing
PHPStan:   ✅ clean          (or ➖ n/a — no PHP files)
PHPUnit:   ✅ 100% coverage  (or ➖ n/a — no PHP files)
Prettier:  ✅ clean          (or ➖ n/a — no frontend files)

Done when:
  ✅ [condition 1]
  ✅ [condition 2]
  ✅ All unit tests pass

────────────────────────────────────────
👤 Your turn:
  1. Test the feature so far on your local cp/[feature-name] branch
  2. Share the draft MR link with reviewers — they can review now
  3. When ALL tasks are done and feature is fully tested locally:
       → mark the draft MR as ready
       → merge it to main
  4. Do NOT mark ready or merge until full feature is tested
────────────────────────────────────────

Next task: Task [N+1] — [title]

Options:
  "Next"   — start Task [N+1]
  "Stop"   — pause here
```

**⛔ STOP. Do not start the next task until the user responds.**

---

## PHASE 7: Worktree Teardown (after user merges MR)

This phase runs only when the user confirms they have marked the draft MR as ready and merged it into `main`.  
The agent never pulls `main` or verifies the merge — that is the user's responsibility.

**Trigger:** User says `"Merged Task [N]"` or `"Cleanup Task [N]"`

```bash
# Remove the worktree
git worktree remove .worktrees/[branch-name-lowercase]

# Delete the local task branch
git branch -d [branch-name]

# Confirm
git worktree list
```

Update the Worktrees table in the plan: set this task's row to ✅ Merged & removed.

Print confirmation:
```
🧹 Task [N] cleaned up
  Worktree .worktrees/[jira-key]-task-[N]/ removed
  Local branch [branch-name] deleted
```

If this was the **last task** and the user confirms all MRs are merged:
```
🎉 All tasks complete.

The CP branch cp/[feature-name] is on origin — delete it when you no longer need it:

  git branch -d cp/[feature-name]           # delete local
  git push origin --delete cp/[feature-name] # delete remote

The agent will not delete the CP branch — it is yours to remove when ready.
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

## Feature Branch Rules

The feature branch is a **local-only integration branch**. It is never pushed to origin.  
Its sole purpose is to let you test the full feature working together before any MR is merged.

### Create once at the start of the feature
```bash
# Fetch latest without switching to main
git fetch origin

# Create feature branch from origin/main
git checkout -b cp/[feature-name] origin/main
```

> The agent never checks out `main`. Feature branch is seeded from `origin/main` directly.

Name it after the feature: `feature/google-pay`, `feature/user-export`, etc.

### Merge each task in as it completes (Step 2 of Phase 5)
```bash
git checkout cp/[feature-name]
git merge --no-ff [branch-name] -m "Merge [branch-name] into cp/[feature-name]"
```

### Test the full feature here
After merging a task into the feature branch, run the full feature manually or with your local test suite.  
This is your integration checkpoint before the task MR is approved and merged to `main`.

### Never push the feature branch
```bash
# This should never be run — feature branch is local only
git push origin cp/[feature-name]  ← ❌ agent does not do this
```

> Task branches ARE pushed to origin by the agent. Only the feature branch stays local.

### Delete after all tasks are merged to main
```bash
git checkout main
git branch -d cp/[feature-name]
```

### Worktrees table — feature branch status values
| Status | Meaning |
|---|---|
| ⬜ Not created | Task not started |
| 🔄 Active | Task in progress in worktree |
| 🔀 Merged to feature / Pending MR | Task merged to feature branch locally, MR raised on origin, awaiting review |
| ✅ Merged & removed | MR merged to main, worktree and branch cleaned up |

---

## Hard Rules

- **Never start a task without completing Phase 1 checks** — no exceptions
- **Never mark a task complete if PHPStan reports errors** — fix all errors first
- **Never mark a task complete if PHPUnit coverage is below 100%** — add tests until all changed PHP files are fully covered
- **Never mark a task complete if Prettier reports formatting issues** — run `--write` then recheck
- **Quality gates are not optional** — they run on every task where the relevant file types changed
- **Never implement outside the current task's spec** — scope creep breaks the worktree model
- **Never commit to `main`** — not even for plan file updates
- **Never checkout `main`** — use `origin/main` as the base ref when creating branches
- **Never push the feature branch to origin** — it is a local integration environment only
- **Always push the task branch to origin and create a draft MR** — never a ready MR; the user marks it ready when the full feature is tested
- **Never merge any branch into `main`** — MR merges are always done by the user
- **Always merge task branch into local feature branch before pushing** — test locally first, then push
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
