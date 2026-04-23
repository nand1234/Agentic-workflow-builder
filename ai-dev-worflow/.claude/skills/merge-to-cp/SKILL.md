---
name: merge-to-cp
description: Merges an approved done ticket into the CP branch. Run after you have reviewed and approved a ticket.
disable-model-invocation: true
allowed-tools: Read, Write, Bash(git *), Bash(npm *), Bash(npx *), Bash(python *), Bash(pytest *)
argument-hint: [TICKET-ID] [feature-slug]
---

Merge $ARGUMENTS to CP branch.

Parse: first argument is TICKET-ID (e.g. DC-1001), second is feature slug (e.g. discount-codes)

Steps:
1. Read docs/tickets/$FEATURE.md
2. Find the ticket entry for $TICKET_ID
3. Confirm ticket status is "done" — STOP if not
   Report current status and what needs to happen first

4. Read RTM at docs/requirements/$FEATURE-rtm.md
   Find all AC rows mapped to $TICKET_ID
   Check every AC status:
   - Any ⚠️ NO TEST FOUND → STOP
     Cannot merge — acceptance criteria have no test coverage
     Run /verify-coverage $TICKET_ID $FEATURE to identify gaps
   - Any ❌ FAILING → STOP
     Cannot merge — tests are failing
     Fix failing tests before merging
   - Any 🔄 COVERED — PENDING VERIFICATION → STOP
     Coverage not yet verified — run /verify-coverage $TICKET_ID $FEATURE first
   - Any 🔲 NOT STARTED → STOP
     AC has no ticket or test — implementation is incomplete
   - All ✅ PASSING → proceed

5. Get CP branch name from docs/tickets/$FEATURE.md

5. Switch to CP branch
   git checkout $CP_BRANCH

6. Merge ticket branch with no-ff to preserve history
   git merge $TICKET_ID --no-ff -m "merge $TICKET_ID into $CP_BRANCH"
   If merge conflict — STOP, report the conflicting files, do not resolve automatically

7. Run full test suite on CP branch
   Run whichever test command is standard for this codebase
   If tests fail — STOP, report which tests failed, do not push

8. If tests pass — push CP branch
   git push origin $CP_BRANCH

9. Update ticket status to "merged-to-cp" in docs/tickets/$FEATURE.md

10. Report:
    - Merge successful
    - Tests passed
    - Which tickets are now unblocked (check dependencies)
    - Suggest running /next-ticket $FEATURE to see updated status

HARD RULES:
- Only ever merge to CP branch — never to main or master
- Never force push
- Never resolve merge conflicts automatically — always stop and report
- Never push if tests fail
- Always update ticket status after successful merge
