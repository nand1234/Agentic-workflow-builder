# Agentic workflow builder

Describe a workflow in plain English. Claude Code plans it, code it, tests it, fixes errors, and delivers a standalone `execute_flow.py` — no AI needed at runtime.

---

## How It Works

1. Load the skill into Claude Code by pointing it at `SKILL.md`
2. Describe your workflow in plain English
3. Claude Code does the rest — plans, codes, tests, fixes, packages
4. You get a folder of clean Python scripts ready to run

---

## Skill File

The `SKILL.md` file contains the full instructions Claude Code follows — conventions, the test/fix loop, file structure, and the orchestrator pattern. Read it if you want to understand or modify how FlowForge works.