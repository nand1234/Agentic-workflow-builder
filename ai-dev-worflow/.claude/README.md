# ⚙️ AI Dev Workflow — Small Team Edition

A lightweight, plan-first development workflow designed for small teams. Prevents production bugs, enforces test culture, and externalises tribal knowledge — without ceremony creep.

**Overall Rating: ⭐ 8/10 — Recommended for adoption**

---

## 📁 Folder Structure

```
ai-dev-workflow/
├── README.md                        ← You are here
│
├── skills/
│   └── SEARCH_PROTOCOL.md           ← Generated codebase DNA (run /generate-skill first)
│
├── plans/
│   └── FEATURE_NAME.md              ← One plan file per feature or bug fix
│
├── logs/
│   └── bug_history.log              ← Running log of all bugs and RCAs
│
└── commands/
    ├── generate-skill.md            ← /generate-skill command reference
    ├── feature-planner.md           ← /feature:planner command reference
    ├── plan-bug-fix.md              ← /plan:bug-fix command reference
    ├── review-checklist.md          ← /review-checklist command (new)
    ├── retrospective.md             ← /retrospective command (new)
    └── onboarding.md                ← /onboarding command (new)
```

---

## 🚀 Getting Started

**First time setup — run in order:**

1. Run `/generate-skill` → produces `skills/SEARCH_PROTOCOL.md`
2. Share `commands/onboarding.md` with any new team member
3. Use `/feature:planner` before every non-trivial feature
4. Use `/plan:bug-fix` before every non-trivial bug fix
5. Run `/retrospective` at the end of each sprint

---

## ⚡ Complexity Classifier

Before using any command, classify the ticket:

| Complexity | Definition | Action |
|---|---|---|
| 🟢 **Trivial** | < 30 min, isolated change | Skip planning, one-liner log entry only |
| 🟡 **Moderate** | 30 min – 2 hrs, touches 1–2 anchors | Use plan, abbreviated test matrix |
| 🔴 **Complex** | 2+ hrs, cross-cutting concerns | Full plan + Triple-Test Contract required |

---

## 📋 Command Quick Reference

| Command | When to Use |
|---|---|
| `/generate-skill` | First time setup, or after major refactor |
| `/feature:planner` | Before building any moderate/complex feature |
| `/plan:bug-fix` | Before fixing any moderate/complex bug |
| `/review-checklist` | Before every merge request |
| `/retrospective` | End of each sprint |
| `/onboarding` | When a new team member joins |

---

## 💡 The Team Pitch

> *"How much time did we lose last quarter to bugs that a plan file would have caught?"*

This workflow is a **safety net, not a process**. The plan-first gate catches architectural mistakes before they're written into code — which is always cheaper to fix than after.
