---
name: plan
description: Creates implementation plan with shippable tickets and dependencies from a requirements doc. Use after discover or when asked to plan or break down a feature.
context: fork
agent: tech-planner
disable-model-invocation: true
argument-hint: [feature-slug]
---

Create the implementation plan for: $ARGUMENTS

Steps:
1. Check docs/requirements/$ARGUMENTS.md exists — STOP if it does not
   Requirements doc is missing. Run /discover first:
   /discover [describe your feature]
   Cannot plan without requirements and acceptance criteria.
2. Read docs/requirements/$ARGUMENTS.md for requirements and acceptance criteria
2. Read docs/business/workflows.md for business context
3. Check if docs/design/$ARGUMENTS.md exists
   If it does — read it fully
   Use component inventory to inform frontend ticket breakdown
   Use UI states to ensure each state is covered by a ticket or subtask
   Use open design questions to flag risks in the plan
4. Read docs/architecture/frontend.md and docs/architecture/backend.md
4. Check docs/tickets/ for existing ticket prefixes to avoid ID collision
5. Break the feature into small shippable tickets
6. Map dependencies between tickets
7. Detect potential file conflicts between parallel tickets
8. Define implementation sequence
9. Update RTM at docs/requirements/$ARGUMENTS-rtm.md
   - For each ticket created, map it to the AC IDs it satisfies
   - Update the Ticket column for each mapped AC row
   - Flag any AC rows with no ticket mapped as ⚠️ NO TICKET — gap in plan
   - Save updated RTM

10. Before saving — identify if any tickets involve structural or foundational changes:
   - New DB tables or schema changes
   - New API contracts or breaking changes to existing ones
   - New core services or major restructure of existing ones
   - New cross-cutting concerns (auth, caching, error handling etc)
   - New external dependencies or integrations

   If any are found, flag them clearly:
   ⚠️ STRUCTURAL CHANGE DETECTED: $TICKET_ID — $DESCRIPTION
   Recommend running /challenge before proceeding with those tickets

10. Save to docs/tickets/$ARGUMENTS.md

Report when complete with:
- Total ticket count
- Implementation sequence
- Any conflict warnings
- Suggested CP branch name
- Any structural changes flagged — recommend /challenge on those

Await user approval before any code is touched.
