# 👋 COMMAND: /onboarding (v1.0) — NEW

**Role:** Engineering Lead  
**Goal:** Get a new team member productive and aligned with the workflow in under 30 minutes

**When to run:** When a new team member joins, or when someone returns from extended leave

---

## Step 1: Read the Repo DNA (10 min)

Start here — everything in this workflow flows from these two files:

1. **`README.md`** — Folder structure and command quick reference
2. **`skills/SEARCH_PROTOCOL.md`** — The codebase's Golden Pairs, naming conventions, and mocking strategy

> If `SEARCH_PROTOCOL.md` does not exist yet, ask the team lead to run `/generate-skill` before your first ticket.

---

## Step 2: Understand the Golden Pairs (5 min)

Open the Golden Pair files listed in `SEARCH_PROTOCOL.md`.

For each pair, note:
- How functions are structured (Functional vs OOP)
- How tests are named and organised
- How external dependencies are mocked

**You do not need to memorise this.** You need to know where to look before writing new code.

---

## Step 3: Read One Plan File (5 min)

Open any recent file in `plans/` with `Status: Implemented`.

This shows you what a completed plan looks like — the Impact Map, the Triple-Test Matrix, and the Atomic Ticket Breakdown. Your first ticket will follow this same structure.

---

## Step 4: Understand the Complexity Classifier (2 min)

Before touching any ticket, classify it:

| Complexity | Definition | Action |
|---|---|---|
| 🟢 Trivial | < 30 min, isolated | Fix directly, one-liner log entry |
| 🟡 Moderate | 30 min – 2 hrs | Run `/feature:planner` or `/plan:bug-fix` |
| 🔴 Complex | 2+ hrs, cross-cutting | Full plan + Triple-Test required |

When in doubt, classify up — it is always cheaper to write a short plan than to fix a production bug.

---

## Step 5: Your First Ticket Checklist

Before submitting your first MR, confirm:

- [ ] I read `SEARCH_PROTOCOL.md` before writing any code
- [ ] I created a plan file in `plans/` (if Moderate or Complex)
- [ ] My code naming follows the conventions in `SEARCH_PROTOCOL.md`
- [ ] My mocking strategy matches the Golden Pair — I did not introduce a new pattern
- [ ] I ran `/review-checklist` before opening the MR

---

## Command Reference Card

| Command | When |
|---|---|
| `/generate-skill` | Run once at setup, or after a major refactor |
| `/feature:planner` | Before every Moderate/Complex feature |
| `/plan:bug-fix` | Before every Moderate/Complex bug fix |
| `/review-checklist` | Before every MR |
| `/retrospective` | End of every sprint |

---

## Questions?

If something in `SEARCH_PROTOCOL.md` looks outdated or a pattern you see in the codebase is not documented there, flag it to the team. The retrospective is the right place to propose updates — not mid-sprint.

Welcome to the team. 🙌
