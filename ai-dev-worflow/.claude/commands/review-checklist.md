# ✅ COMMAND: /review-checklist (v1.0) — NEW

**Role:** Senior Code Reviewer  
**Goal:** Cross-reference the plan against what was actually implemented before any merge request

**When to run:** Before every MR/PR — mandatory for Moderate and Complex tickets

---

## The Checklist

Run through each item. Do not merge until all applicable items are checked.

### 1. Plan Alignment
- [ ] A plan file exists in `plans/` for this ticket (skip for Trivial)
- [ ] The plan status has been updated to `Implemented`
- [ ] The Impact Map in the plan matches the files actually changed
- [ ] If scope changed during implementation, the plan was updated before continuing
- [ ] The Dependencies section is accurate — any newly blocked or unblocked plan files have been updated
- [ ] If this MR touches an anchor shared with another open plan file, that team member has been notified

### 2. Test Coverage
- [ ] All three test scenarios from the Triple-Test Matrix are implemented
- [ ] Tests are in the correct layer (Unit / API / E2E) as planned
- [ ] The full test suite passes locally before pushing
- [ ] No tests were skipped or commented out to make the suite pass

### 3. Code Pattern Alignment
- [ ] New code follows the naming conventions in `skills/SEARCH_PROTOCOL.md`
- [ ] Mocking strategy matches the Golden Pair — no new patterns introduced without team discussion
- [ ] No dead code, commented-out blocks, or debug statements left in

### 4. Safety & Blast Radius
- [ ] Blast Radius anchors were reviewed — no unintended side effects found
- [ ] Error handling follows the repo standard (no silent failures, no bare `catch` blocks)
- [ ] No hardcoded credentials, environment values, or magic strings added

### 5. Documentation & Logging
- [ ] `logs/bug_history.log` updated if this MR includes a bug fix
- [ ] Any new environment variables or config keys are documented
- [ ] If a new pattern was introduced, `skills/SEARCH_PROTOCOL.md` needs regeneration (flag for next sprint)
- [ ] If a deliberate pattern deviation exists in this MR, it has been added to the `Known Exceptions` table in `skills/SEARCH_PROTOCOL.md` with a reason and your name
- [ ] If this MR resolves an existing exception (e.g. upgraded an SDK, removed a legacy workaround), the corresponding row has been removed from `Known Exceptions`

---

## MR Description Template

Use this when opening your MR:

```markdown
## Summary
[What this MR does in 1–2 sentences]

## Plan File
`plans/FEATURE_NAME.md` — Status: Implemented

## Test Coverage
- ✅ Positive: [brief description]
- ❌ Negative: [brief description]
- ⚠️ Edge: [brief description]

## Blast Radius
[What adjacent areas were checked]

## Checklist
- [ ] All /review-checklist items passed
- [ ] Full test suite passes
- [ ] No debug/temp code left in
```

---

## Notes

- This checklist applies to both formal PRs and informal reviews — scale the depth to the ticket complexity
- Trivial fixes require only items 3.3 and 5 at minimum
- If you find a new issue during review, open a new `/plan:bug-fix` — do not fix it inline in the current MR
