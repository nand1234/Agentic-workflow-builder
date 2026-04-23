# Claude Code Workflow System

A complete AI-assisted development workflow using Claude Code skills, subagents and worktrees.

---

## Onboarding — Run Once Per Project

```bash
# 1. Author your business workflows (manual — you own this)
# Edit docs/business/workflows.md

# 2. Back business workflows with code references
/enrich-business

# 3. Scan and document frontend architecture
/scan-frontend

# 4. Scan and document backend architecture
/scan-backend
```

---

## Feature Development Flow

```bash
# Step 0 — Design Review (optional but recommended if designs exist)
/review-design discount-codes https://www.figma.com/file/ABC123/Checkout
/review-design discount-codes ./designs/checkout.png
/review-design discount-codes https://www.figma.com/file/ABC123 ./designs/edge-cases.png
# Produces: docs/design/discount-codes.md

# Step 1 — Discovery (forked, isolated)
# Pass designs alongside description if available — discover will read them
/discover user can apply a discount code at checkout
# Produces: docs/requirements/discount-codes.md

# Step 2 — Planning (forked, isolated)
/plan discount-codes
# Produces: docs/tickets/discount-codes.md
# STOP — review and approve the plan before continuing

# Step 3 — Setup worktrees (run once per feature)
/setup-worktrees discount-codes
# Creates: feature/discount-codes CP branch
# Creates: DC-1001, DC-1002... branches and worktrees

# Step 4 — Check what is ready
/next-ticket discount-codes
# Shows: which tickets are unblocked

# Step 5 — Implement a ticket
/implement DC-1001 discount-codes
# Works in: .worktrees/DC-1001
# Implements + tests (100% coverage required) + records tests in RTM + commits + pushes
# STOP — review the ticket before verifying

# Step 5b — Verify coverage and RTM before merging
/verify-coverage DC-1001 discount-codes
# Runs all mapped tests, checks 100% coverage on all metrics
# Updates RTM status to ✅ PASSING
# Quality gate must pass before merge is allowed

# Step 6 — Merge approved ticket to CP branch
/merge-to-cp DC-1001 discount-codes
# Reads RTM — blocks if any AC is not ✅ PASSING
# Merges DC-1001 → feature/discount-codes
# Runs tests on CP branch
# Reports which tickets are now unblocked

# Repeat steps 4-6 until all tickets are merged to CP

# Step 7 — YOU manually merge CP branch to main/master
# git checkout main
# git merge feature/discount-codes --no-ff

# Step 8 — Sync living docs after feature lands
/sync-docs discount-codes
```

---

## Standalone Skills

```bash
# Understand how something works
/how password reset email is triggered
/how auth token is validated
/how cart total is calculated

# Review code before pushing
/review-pr

# Understand ticket status at any time
/next-ticket discount-codes
```

---

## Recovery Skills

```bash
# Revert a bad merge from CP branch
/rollback-ticket DC-1003 discount-codes

# Revise the plan based on feedback
/revise-plan discount-codes split DC-1003 into two separate tickets
```

---

## Branch Topology

```
main/master                          ← YOU merge here manually
    └── feature/discount-codes       ← CP branch
            ├── DC-1001              ← ticket branch (7 chars)
            ├── DC-1002
            ├── DC-1003
            ├── DC-1004
            └── DC-1005
```

**Agents never touch main or master. Ever.**

---

## Ticket Status Flow

```
todo → in-progress → done → merged-to-cp
                      ↑
              (rollback resets here)
```

---

## Directory Structure

```
.claude/
├── agents/
│   ├── logic-explorer.md          # Read-only codebase investigator
│   ├── requirements-analyst.md    # Business requirements + open questions
│   ├── bdd-writer.md              # Gherkin acceptance criteria
│   ├── tech-planner.md            # Ticket breakdown + dependency mapping
│   ├── frontend-engineer.md       # Frontend implementation + tests
│   ├── backend-engineer.md        # Backend implementation + tests
│   └── pr-reviewer.md             # Code review against standards
│
└── skills/
    ├── discover/                  # Phase 1 — requirements + BDD criteria
    ├── plan/                      # Phase 2 — ticket breakdown
    ├── implement/                 # Phase 3 — code + tests per ticket
    ├── merge-to-cp/               # Merge approved ticket to CP branch
    ├── rollback-ticket/           # Revert a merge from CP branch
    ├── revise-plan/               # Update plan based on feedback
    ├── setup-worktrees/           # Create branches and worktrees
    ├── next-ticket/               # Show unblocked tickets
    ├── verify-coverage/           # Verify RTM coverage + 100% unit test gate
    ├── review-pr/                 # Standalone PR review
    ├── review-design/             # Design analysis from Figma URL or PNG
    ├── how/                       # Standalone logic discovery
    ├── scan-frontend/             # Generate frontend architecture doc
    ├── scan-backend/              # Generate backend architecture doc
    ├── enrich-business/           # Back business workflows with code
    ├── sync-docs/                 # Update docs after implementation
    ├── frontend-context/          # Silent — auto-loaded for frontend work
    ├── backend-context/           # Silent — auto-loaded for backend work
    └── business-context/          # Silent — auto-loaded for requirements work

├── docs/
│   ├── architecture/
│   │   ├── frontend.md                # Generated by /scan-frontend
│   │   └── backend.md                 # Generated by /scan-backend
│   ├── business/
│   │   └── workflows.md               # Human-authored, enriched by /enrich-business
│   ├── design/
│   │   └── $FEATURE.md                # Generated by /review-design
│   ├── requirements/
│   │   ├── $FEATURE.md                # Generated by /discover
│   │   └── $FEATURE-rtm.md            # RTM — generated by /discover, updated throughout
│   └── tickets/
│       └── $FEATURE.md                # Generated by /plan

.worktrees/                        # Local only — gitignored
├── DC-1001/
├── DC-1002/
└── ...
```

---

## Worktree Cleanup

Worktrees are yours to manage. When you are done with a feature:

```bash
# Remove worktrees manually when ready
git worktree remove .worktrees/DC-1001
git worktree remove .worktrees/DC-1002

# Delete remote ticket branches when done
git push origin --delete DC-1001
git push origin --delete DC-1002
```

---

## Architecture — Two Complementary Layers

This system uses two orthogonal mechanisms that solve different problems. They do not overlap.

### Forked Subagents — Context Isolation
Every research and analysis skill runs in a forked subagent with its own clean context.
This solves **context rot** and **context window limits** — each worker has its own room,
sees only its own task, and returns a summary to the main conversation.

Without this: long sessions degrade as accumulated history pollutes every decision.

### Advisor (Opus) — Intelligence Escalation
The `/advisor` command in Claude Code pairs Sonnet (executor) with Opus (advisor).
The advisor reads the full conversation history and provides strategic guidance
mid-execution when the executor hits something complex. It has no tools — reasoning only.

Without this: a capable executor can still make poor architectural decisions on hard problems.

### Why Both Are Needed

| | Forked Subagents | Advisor (Opus) |
|---|---|---|
| **Purpose** | Context isolation | Intelligence escalation |
| **When triggered** | Per skill/phase | Mid-execution, on demand |
| **What it sees** | Only its own task | Full conversation history |
| **Can it act?** | Yes — reads, writes, runs code | No — reasoning only, no tools |
| **Solves** | Context rot, window limits | Wrong decisions, blind spots |

### Where the Advisor Earns Its Place
Not every step needs escalation. Opus is consulted on maybe 4-5 moments per feature:
- `/plan` — sanity check ticket breakdown before anything is committed to
- `/implement` — consulted before writing structural or foundational code
- `/challenge` — devil's advocate review of architectural decisions
- `/verify-coverage` — checks RTM gaps before the quality gate closes
- `/merge-to-cp` — flags anything suspicious before CP branch is touched

Everything else — `/how`, `/review-design`, `/next-ticket`, `/sync-docs` — Sonnet handles cleanly.

### Recommended Setup
```bash
# Start Claude Code
claude

# Enable Opus as advisor (run once per session)
/advisor
# Select: claude-opus-4-7

# Run your workflow as normal — advisor is consulted automatically when needed
/discover ...
/plan ...
/implement ...
```

---

| Principle | How it is enforced |
|---|---|
| Context isolation | All research skills use `context: fork` |
| No context rot | Subagents never inherit conversation history |
| Human owns business truth | workflows.md is manually authored |
| Human owns merges to main | Agents hard-blocked from touching main/master |
| Approval gates everywhere | `disable-model-invocation: true` on all action skills |
| Dependency safety | /implement stops if dependencies not merged-to-cp |
| Living docs | /sync-docs runs after every feature to keep docs honest |
