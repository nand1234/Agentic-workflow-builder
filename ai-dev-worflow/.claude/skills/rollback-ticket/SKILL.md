---
name: rollback-ticket
description: Reverts a ticket merge from the CP branch if something went wrong after merging.
disable-model-invocation: true
allowed-tools: Read, Write, Bash(git *), Bash(npm *), Bash(npx *), Bash(python *), Bash(pytest *)
argument-hint: [TICKET-ID] [feature-slug]
---

Rollback $ARGUMENTS from CP branch.

Parse: first argument is TICKET-ID (e.g. DC-1001), second is feature slug (e.g. discount-codes)

Steps:
1. Read docs/tickets/$FEATURE.md
2. Find the ticket entry for $TICKET_ID
3. Confirm ticket status is "merged-to-cp" — STOP if not
   Cannot rollback a ticket that was never merged
4. Get CP branch name from docs/tickets/$FEATURE.md

5. Switch to CP branch
   git checkout $CP_BRANCH

6. Find the merge commit for this ticket
   git log --oneline --grep="merge $TICKET_ID" -1
   Show the commit hash and message to the user for confirmation
   STOP here and ask user to confirm before proceeding

7. Once confirmed — revert the merge commit
   git revert -m 1 $MERGE_COMMIT_HASH --no-edit
   -m 1 keeps the CP branch as the mainline

8. Run full test suite to confirm CP branch is stable
   If tests fail — STOP, report which tests failed

9. If tests pass — push CP branch
   git push origin $CP_BRANCH

10. Update ticket status back to "done" in docs/tickets/$FEATURE.md
    (ticket is done but no longer merged — ready to re-merge when fixed)

11. Check if any tickets depended on this one and are now "in-progress" or "done"
    Report those tickets — their dependency is no longer in CP branch
    Suggest they may need to be re-implemented or rebased

12. Report:
    - Rollback successful
    - CP branch is stable
    - $TICKET_ID status reset to "done"
    - Any downstream tickets affected

HARD RULES:
- Always confirm with user before executing the revert
- Never force push
- Never modify main or master
- Always run tests after revert before pushing
- Never delete the ticket branch — it still contains the work
