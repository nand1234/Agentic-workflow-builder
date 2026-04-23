---
name: sync-docs
description: Re-enriches business and architecture docs after a ticket or feature lands. Keeps living docs accurate.
context: fork
agent: logic-explorer
disable-model-invocation: true
argument-hint: [feature-slug or TICKET-ID]
---

Sync all living docs after recent implementation: $ARGUMENTS

Steps:
1. Identify what changed recently
   git diff $CP_BRANCH~1 $CP_BRANCH --name-only
   Or if a feature just fully landed:
   git diff main $CP_BRANCH --name-only

2. Scope the update to only affected areas

3. Update docs/business/workflows.md
   - Find workflows affected by changed files
   - Update code references for those workflows only
   - Add new workflows if new business flows were introduced
   - Update gaps section — resolve any gaps that are now covered
   - Add new gaps if new untested behaviour was introduced
   - Preserve all human-authored business descriptions exactly

4. Update docs/architecture/frontend.md if frontend files changed
   - Update any patterns or conventions that changed
   - Add new patterns if new approaches were introduced
   - Flag anything that now deviates from the documented standard

5. Update docs/architecture/backend.md if backend files changed
   - Update any patterns or conventions that changed
   - Add new patterns if new approaches were introduced
   - Flag anything that now deviates from the documented standard

6. Report:
   - Which docs were updated
   - What changed in each doc
   - Any new gaps discovered
   - Any new patterns documented

Only update sections affected by the recent changes.
Never rewrite docs from scratch — preserve all existing content.
Append or update in place only.
