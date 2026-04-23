---
name: revise-plan
description: Revises an existing implementation plan based on your feedback. Preserves already merged tickets.
context: fork
agent: tech-planner
disable-model-invocation: true
argument-hint: [feature-slug] [feedback or change description]
---

Revise the implementation plan for: $ARGUMENTS

Parse: first argument is the feature slug, remaining arguments are your feedback/change request

Steps:
1. Read docs/tickets/$FEATURE.md — current plan
2. Read docs/requirements/$FEATURE.md — requirements and acceptance criteria
3. Read docs/architecture/frontend.md and docs/architecture/backend.md

4. Identify locked tickets — status is "in-progress", "done" or "merged-to-cp"
   These tickets MUST NOT be changed or removed
   Report them as locked at the start

5. Identify revisable tickets — status is "todo"
   These can be modified, split, merged or removed based on feedback

6. Apply the requested changes:
   - Revise ticket descriptions, scope or dependencies as needed
   - Add new tickets if the feedback requires new work
   - Remove or merge tickets if the feedback reduces scope
   - Re-map dependencies after any changes
   - Re-run conflict detection on revised parallel tickets
   - Assign new ticket IDs to any new tickets (continuing the sequence)
   - Update implementation sequence

7. Show a diff of what changed:
   ## Changes Made
   ### Added
   - $TICKET_ID — reason
   ### Modified
   - $TICKET_ID — what changed and why
   ### Removed
   - $TICKET_ID — reason
   ### Locked (unchanged)
   - $TICKET_ID — status: $STATUS

8. Save revised plan to docs/tickets/$FEATURE.md
   Preserve all locked ticket entries exactly as they are

9. Report:
   - Summary of changes
   - New total ticket count
   - Updated implementation sequence
   - Any new worktrees needed (for new tickets)
   - Remind user to run /setup-worktrees for any new tickets added

HARD RULES:
- Never modify or remove tickets with status in-progress, done or merged-to-cp
- Never change ticket IDs that already exist
- Preserve CP branch name unless user explicitly requests a change
