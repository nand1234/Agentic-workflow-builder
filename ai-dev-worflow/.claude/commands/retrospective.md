# 🔁 COMMAND: /retrospective (v1.0) — NEW

**Role:** Engineering Lead & Quality Analyst  
**Goal:** Review the sprint's plan files and bug logs to surface recurring patterns before they compound

**When to run:** End of every sprint (15–20 minutes max)

---

## PHASE 1: Data Gather

Collect inputs from the current sprint:

1. All plan files in `plans/` created or updated this sprint
2. All bug entries in `logs/bug_history.log` added this sprint
3. Any `/review-checklist` items that were commonly skipped or flagged

---

## PHASE 2: Pattern Analysis

Answer each question using the data above:

### Bug Patterns
- Were any root causes repeated across multiple bugs? (e.g. missing null check, unhandled async error)
- Were any bugs filed against the same Logic Anchor more than once?
- Were any bugs traced back to missing test coverage in a prior sprint?

### Plan Quality
- Were any Impact Maps inaccurate — did implementation touch files not listed in the plan?
- Were any Blast Radius items missed that caused unintended side effects?
- Were any tickets under-classified (marked Trivial but required a plan in hindsight)?

### Test Health
- Were any Triple-Test scenarios skipped or watered down?
- Is there a layer (Unit / API / E2E) that is consistently under-represented?
- Did any tests pass locally but fail in CI? (indicates environment drift)

### SEARCH_PROTOCOL Drift
- Were any new patterns introduced that are not reflected in `skills/SEARCH_PROTOCOL.md`?
- Has the Golden Pair aged out — is there a more recent, better example now?

### Known Exceptions Audit
- Are any rows in the `Known Exceptions` table now outdated? (e.g. a legacy SDK was upgraded, a workaround was removed)
- Were any deliberate deviations introduced this sprint that are not yet documented in `Known Exceptions`?
- Does every row still have a valid, current reason — or has the context changed?

---

## PHASE 3: Output — Sprint Retro Entry

**Append to:** `logs/bug_history.log` under a `## Sprint Retro` header

```markdown
---
## Sprint Retro: [Sprint Name / Date Range]
**Date:** [date]  
**Reviewed by:** [name]

### Stats
- Features planned: [n]
- Bugs filed: [n]
- Bugs resolved: [n]
- MRs merged: [n]

### Recurring Patterns Found
[List any root causes or anchors that appeared more than once]

### Action Items
- [ ] [Specific change to process, tests, or code pattern]
- [ ] [Regenerate SEARCH_PROTOCOL.md if drift found]
- [ ] [Add a missing test layer if consistently skipped]

### SEARCH_PROTOCOL Status
[ ] Up to date  /  [ ] Needs regeneration (reason: [reason])

### Known Exceptions Status
- Exceptions reviewed: [ ] Yes / [ ] No
- Exceptions removed this sprint: [list or "none"]
- Exceptions added this sprint: [list or "none"]
```

---

## Notes

- Keep the retro focused on **systemic patterns**, not individual mistakes
- If the same bug type appears two sprints in a row, it becomes a process action item, not just a ticket
- The retrospective is the only place where `SEARCH_PROTOCOL.md` regeneration is scheduled — do not regenerate mid-sprint unless a critical drift is found
