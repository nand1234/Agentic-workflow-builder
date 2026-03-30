# 🛠️ COMMAND: /plan:bug-fix (v2.8)

**Role:** Senior Debugging Specialist  
**Goal:** Log the anatomy of a bug and its safety net before applying any fix

---

## PHASE 0: Complexity Check

| Complexity | Definition | Action |
|---|---|---|
| 🟢 **Trivial** | Obvious typo, config value, copy change | Fix directly, add one-liner to `logs/bug_history.log` |
| 🟡 **Moderate** | Logic error in 1–2 files | Abbreviated plan — skip full Blast Radius |
| 🔴 **Complex** | Cross-cutting, data integrity risk, production incident | Full plan required |

---

## PHASE 0.5: Context Refresh

> **MUST** be completed before Phase 1.

1. Read `skills/SEARCH_PROTOCOL.md`
2. Locate the **Logic Anchor** for the failing behaviour
3. Locate its corresponding **Test Anchor**
4. Review **Error Handling standards** to ensure the fix aligns with repo DNA

**Reproduce the bug first.** Do not begin RCA without a reliable reproduction case.

---

## PHASE 1: Plan Mode — RCA & Test Design

**Append to:** `logs/bug_history.log`

```markdown
---
## Bug: [Short Title]
**Date:** [date]  
**Severity:** 🔴 Critical / 🟡 Moderate / 🟢 Low  
**Reporter:** [name or system]  
**Status:** Investigating

### Reproduction Steps
1. [Step]
2. [Step]
3. [Observed result]

### Bug Description
[Detailed summary of the issue and its user impact.]

### Root Cause Analysis
**Expected behaviour:** [what should happen]  
**Actual behaviour:** [what is happening]  
**Root cause:** [specific file, function, line, or logic flaw]  
**Logic drift:** [why this diverged from the expected path]

### Triple-Test Contract
| Scenario | Layer | Reasoning |
|---|---|---|
| ✅ Positive | Unit / API | [Proves the fix works under normal conditions] |
| ❌ Negative | Unit / API | [Proves the bug condition is now handled correctly] |
| ⚠️ Edge | Unit / API | [Proves no regression in adjacent behaviour] |

### Fix Plan
- [ ] Step 1: [targeted change]
- [ ] Step 2: Implement the three tests above
- [ ] Step 3: Run full suite — confirm all pass
- [ ] Step 4: Update status to `Resolved`
```

**⛔ STOP HERE. Do not apply any fix. Await user approval.**

---

## PHASE 2: Implementation Mode

**Trigger:** User says `"Proceed"` or `"Approve"`

**Execution order:**

1. Apply the targeted code fix to the Logic Anchor
2. Implement all three tests (Positive, Negative, Edge) exactly as designed
3. Run the full test suite — confirm pass rate
4. Update `bug_history.log` status to `Resolved`
5. Prompt user for **branch/MR name** to associate with the log entry
6. Proceed to `/review-checklist` before merging

---

## Notes

- Never skip reproduction — RCA without a reliable repro is guesswork
- Keep fixes surgical — change only what is needed to fix the root cause
- If the fix reveals a second bug, open a separate plan entry — do not bundle
