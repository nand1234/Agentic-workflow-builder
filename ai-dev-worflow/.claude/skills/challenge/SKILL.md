---
name: challenge
description: Runs devil's advocate review on a structural or foundational change. Auto-triggers when a plan, architecture change or foundational decision is being made. Use when proposing changes to data models, API contracts, core services, or architectural patterns.
context: fork
agent: devil-advocate
argument-hint: [what is being changed or proposed]
---

Run a devil's advocate review on: $ARGUMENTS

Steps:
1. Read docs/business/workflows.md — understand business context
2. Read docs/architecture/frontend.md — understand frontend foundation
3. Read docs/architecture/backend.md — understand backend foundation
4. If a feature plan exists, read docs/tickets/$FEATURE.md
5. If a requirements doc exists, read docs/requirements/$FEATURE.md

6. Scan the codebase for existing code relevant to the proposed change
   - What currently exists that this touches
   - What depends on what is being changed
   - What patterns are established that this may break or bypass

7. Perform full devil's advocate review following agent instructions

8. Return structured findings with risk ratings and alternatives

Be thorough. A few minutes of challenge here saves days of refactoring later.
