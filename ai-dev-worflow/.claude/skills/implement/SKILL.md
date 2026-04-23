---
name: implement
description: Implements a specific ticket in its worktree with full test coverage
disable-model-invocation: true
allowed-tools: Read, Write, Bash(git *), Bash(npm *), Bash(npx *), Bash(python *), Bash(pytest *)
argument-hint: [TICKET-ID] [feature-slug]
---

Implement $ARGUMENTS

Parse: first argument is TICKET-ID (e.g. DC-1001), second is feature slug (e.g. discount-codes)

Steps:
1. Read docs/tickets/$FEATURE.md
2. Find the ticket entry for $TICKET_ID
3. Check all dependencies have status "merged-to-cp" — STOP if any do not
   Report exactly which dependencies are blocking and why
3b. Check if this ticket involves a structural or foundational change
    (DB schema, API contract, core service, cross-cutting concern)
    If yes — warn the user:
    ⚠️ This ticket contains a structural change.
    Recommend running /challenge $TICKET_ID $FEATURE before implementing.
    Ask user to confirm they want to proceed without challenge review.
4. Verify the worktree exists at .worktrees/$TICKET_ID — STOP if not
   Instruct user to run /setup-worktrees $FEATURE first
5. Update ticket status to "in-progress" in docs/tickets/$FEATURE.md
6. cd .worktrees/$TICKET_ID
7. Determine scope from ticket (frontend | backend | fullstack)
   - frontend or fullstack:
     Check if docs/design/$FEATURE.md exists
     If yes — read it, load design-context, implement against the design spec
     Match every UI state documented — loading, error, empty, success
     Match design tokens — colours, spacing, typography
     If open design questions exist — stop and surface them before implementing
   - backend only → follow backend-context standards
   - fullstack → follow both
8. Read docs/architecture/frontend.md and/or docs/architecture/backend.md
9. Implement the feature matching existing patterns exactly
10. Write unit tests — 100% coverage required:
    - Positive cases
    - Negative cases
    - Edge cases
11. Run tests — DO NOT proceed if any fail
    Report failures clearly and fix before continuing
13. Update RTM at docs/requirements/$FEATURE-rtm.md
    - Find all AC rows mapped to this ticket
    - For each AC, record the test file and test case name that covers it
    - Update status to 🔄 COVERED — PENDING VERIFICATION
    - Flag any AC with no test written as ⚠️ UNCOVERED — do not proceed
    - Save updated RTM

14. Commit to ticket branch
    git add .
    git commit -m "$TICKET_ID: $SHORT_DESCRIPTION"
15. Push ticket branch
    git push origin $TICKET_ID
16. Update ticket status to "done" in docs/tickets/$FEATURE.md
17. Remind user to run /verify-coverage $TICKET_ID $FEATURE before merging

HARD RULES:
- Only work inside .worktrees/$TICKET_ID
- Never git merge anything to main, master or CP branch
- Never git checkout main or master
- Never modify files outside the ticket scope
- Stop and report clearly if anything blocks progress
