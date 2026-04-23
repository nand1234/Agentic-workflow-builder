---
name: setup-worktrees
description: Creates git worktrees for all tickets in a feature plan. Run after /plan is approved.
disable-model-invocation: true
allowed-tools: Read, Write, Bash(git *), Bash(mkdir *), Bash(echo *)
argument-hint: [feature-slug]
---

Set up git worktrees for feature: $ARGUMENTS

Steps:
1. Read docs/tickets/$ARGUMENTS.md
2. Get CP branch name and all ticket IDs from the plan

3. Create CP branch off current branch if it does not exist
   git checkout -b $CP_BRANCH
   git push -u origin $CP_BRANCH
   If it already exists: git checkout $CP_BRANCH

4. Create .worktrees/ directory if it does not exist
   mkdir -p .worktrees

5. Create .worktrees/.gitignore if it does not exist
   echo "*" > .worktrees/.gitignore
   echo "!.gitignore" >> .worktrees/.gitignore

6. For each ticket in implementation sequence order:
   a. Create ticket branch off CP branch
      git checkout $CP_BRANCH
      git checkout -b $TICKET_ID
      git push -u origin $TICKET_ID
   b. Create worktree for ticket branch
      git worktree add .worktrees/$TICKET_ID $TICKET_ID
   c. Confirm worktree created successfully

7. Switch back to CP branch when done
   git checkout $CP_BRANCH

8. Report summary:
   - CP branch created/confirmed
   - All worktrees created
   - Implementation sequence reminder
   - Suggest running /next-ticket $ARGUMENTS to see what is ready

HARD RULES:
- All ticket branches must be created off CP branch
- Never create any branch off main or master
- Never merge anything
- .worktrees/ is local only — never committed (covered by .gitignore)
- Stop and report clearly if any git operation fails
