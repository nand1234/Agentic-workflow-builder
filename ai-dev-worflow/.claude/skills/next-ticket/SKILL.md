---
name: next-ticket
description: Shows which tickets are ready to implement based on dependency status. Use to know what to work on next.
disable-model-invocation: true
allowed-tools: Read
argument-hint: [feature-slug]
---

Check implementation status for feature: $ARGUMENTS

Read docs/tickets/$ARGUMENTS.md and produce a status report.

Logic:
- READY: status is "todo" AND all dependencies have status "merged-to-cp"
- BLOCKED: status is "todo" AND one or more dependencies are NOT "merged-to-cp"
- IN PROGRESS: status is "in-progress"
- DONE (awaiting merge): status is "done"
- MERGED: status is "merged-to-cp"

Output format:

## $ARGUMENTS — Ticket Status

### ✅ Ready to Implement
List each ready ticket:
- $TICKET_ID — $DESCRIPTION (no dependencies | dependencies all merged)

### 🔄 In Progress
- $TICKET_ID — $DESCRIPTION

### ⏳ Done — Awaiting Your Approval to Merge to CP
- $TICKET_ID — $DESCRIPTION
  Run: /merge-to-cp $TICKET_ID $ARGUMENTS

### 🚫 Blocked
List each blocked ticket with reason:
- $TICKET_ID — $DESCRIPTION
  Waiting for: $DEPENDENCY_ID (status: $STATUS), $DEPENDENCY_ID (status: $STATUS)

### ✔️ Merged to CP
- $TICKET_ID — $DESCRIPTION

### Feature Progress
X of Y tickets merged to CP

### RTM Coverage
Read docs/requirements/$FEATURE-rtm.md and show:
| Status | Count |
|--------|-------|
| ✅ PASSING | X |
| 🔄 Covered — pending verification | X |
| ⚠️ No test found | X |
| ❌ Failing | X |
| 🔲 Not started | X |
| **Total ACs** | X |

If any AC is not ✅ PASSING, list them explicitly so the user knows what needs fixing.

If all tickets are merged to CP:
🎉 All tickets complete. Feature branch $CP_BRANCH is ready for your review.

Recommended steps before merging to main/master:
1. Run /review-pr to review the full feature diff on $CP_BRANCH
2. Run /sync-docs $FEATURE to update all living docs
3. Manually merge $CP_BRANCH to main/master when satisfied
   git checkout main
   git merge $CP_BRANCH --no-ff
