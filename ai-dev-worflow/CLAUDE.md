# Project conventions — loaded every Claude Code session

## Directory Structure
- All CI config lives in `.ci/` — never anywhere else
- All Claude skills and agents live in `.claude/`
- All documentation lives in `docs/`
  - `docs/requirements/` — feature requirements and BDD criteria
  - `docs/design/` — design review output from Figma or PNG
  - `docs/tickets/` — implementation plans and ticket status
  - `docs/architecture/` — frontend and backend standards
  - `docs/business/` — human-authored business workflows
- Worktrees are local only — `.worktrees/` is gitignored

## Git Rules — Non-Negotiable
- Never touch `main` or `master` directly — ever
- All feature work goes through a CP branch (`feature/$FEATURE`)
- All ticket branches are named with 7-char IDs e.g. `DC-1001`
- All ticket branches are created off the CP branch — never off main
- Merging ticket → CP is done via `/merge-to-cp` after your approval
- Merging CP → main is always a manual step done by you

## Quality Gates — All Must Pass Before Any Merge to CP
1. **100% unit test coverage** — positive, negative and edge cases required
2. **All tests passing** — zero failures, zero skipped
3. **RTM fully covered** — every acceptance criterion has a mapped passing test
4. **No AC left uncovered** — `/verify-coverage` must show all ✅ PASSING
5. **No structural change unreviewed** — `/challenge` must be run on any DB, API or core service change

If any gate fails — stop, fix, re-verify. Do not proceed.

## Workflow Entry Points
- First time setup: fill in `docs/business/workflows.md`, then run `/enrich-business`, `/scan-frontend`, `/scan-backend`
- New feature: `/discover` → `/plan` → `/setup-worktrees` → `/implement` → `/verify-coverage` → `/merge-to-cp`
- Standalone: `/how`, `/review-pr`, `/challenge`, `/review-design`
- After feature lands: `/sync-docs`

## Read First
See `README.md` for the full workflow guide.
