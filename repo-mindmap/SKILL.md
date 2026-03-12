# CodeMap — Orchestrator

## Trigger
When the user types `analyserepo /path/to/project`, follow this skill exactly.
Do not skip steps. Do not assume. Do not summarise files instead of analysing them.

---

## Skill files
All skills live alongside this file:
```
/mnt/skills/user/codemap/
├── SKILL.md                   ← this file (orchestrator)
├── architecture_SKILL.md     ← Skill 0: architecture discovery
├── file-analysis_SKILL.md    ← Skill 1: per-file deep analysis
├── graph-synthesis_SKILL.md  ← Skill 2: graph synthesis
└── visualiser-template.jsx    ← React visualiser template
```

Read each skill file before running that phase.

---

## Output directory structure
All output lives inside the project at `.codemap/`:

```
/path/to/project/.codemap/
├── session.json          ← current run state (resume tracker)
├── files.json            ← full prioritised file list
├── arch.json             ← Skill 0 output
├── graphs.json           ← Skill 2 output
└── files/
    └── {filename}.json   ← one per file, Skill 1 output
```

Create `.codemap/` and `.codemap/files/` if they do not exist:
```bash
mkdir -p /path/to/project/.codemap/files
```

---

## Phase 0 — Directory Scan & Session Management

### Scan all files
```bash
find /path/to/project \
  -type f \( -name "*.php" -o -name "*.vue" -o -name "*.ts" -o -name "*.js" \) \
  ! -path "*/vendor/*" \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  ! -path "*/storage/*" \
  ! -path "*/bootstrap/cache/*" \
  ! -name "*.config.*" \
  ! -name "*.spec.*" \
  ! -name "*.test.*" \
  | sort
```

### Assign priority tiers
| Tier | Pattern | Why |
|------|---------|-----|
| 1 | `index.php`, `main.ts`, `App.vue`, `Kernel.php`, `bootstrap/app.php` | Entry points |
| 2 | `*Controller.php` | Request handlers |
| 3 | `*Service.php` | Business logic |
| 4 | `*Repository.php` | Data access |
| 5 | `*Entity.php`, `*Model.php` | Data shape |
| 6 | `use*.ts`, `use*.js` (composables) | Frontend logic |
| 7 | `*Store.ts`, `*store.ts` | Frontend state |
| 8 | `*Page.vue`, `*View.vue` | Frontend pages |
| 9 | `*.vue` components | Frontend UI |
| 10 | Everything else | Config, helpers |

### Save files.json
```json
{
  "scannedAt": "ISO timestamp",
  "totalFiles": 0,
  "files": [
    { "path": "full/path/to/file", "name": "filename.php", "tier": 1, "ext": "php" }
  ]
}
```

### Check for existing session
- If `session.json` exists and `status === "in_progress"`:
  → Tell user: "Resuming session. {n} files already analysed, {remaining} remaining."
  → Use the existing `remaining` list — do NOT re-scan
- If `session.json` does not exist or `status === "complete"`:
  → Start fresh session

### Create or reset session.json
```json
{
  "sessionId": "YYYY-MM-DD-HHmmss",
  "startedAt": "ISO timestamp",
  "projectPath": "/path/to/project",
  "totalFiles": 0,
  "analysed": [],
  "remaining": ["full/path/to/file in tier order"],
  "status": "in_progress"
}
```

---

## Phase 1 — Run Skill 0

Read the skill file first:
```bash
cat /mnt/skills/user/codemap/architecture_SKILL.md
```
Then follow it exactly. Save output to `.codemap/arch.json`.

---

## Phase 2 — Run Skill 1

Read the skill file first:
```bash
cat /mnt/skills/user/codemap/file-analysis_SKILL.md
```

Work through every file in `remaining` from `session.json` in tier order.

For each file:
1. Read the file with `cat`
2. Analyse it following skill1 instructions
3. Save to `.codemap/files/{filename}.json`
4. Update `session.json` — move path from `remaining` to `analysed`

### Context limit check
After every 20 files output:
```
✓ {n}/{total} files analysed and saved.
```

If context is approaching limits, stop and tell the user:
```
⚠ Context limit approaching.
  {n} files analysed and saved to .codemap/files/
  {remaining} files still remaining.

Run `analyserepo /path/to/project` to continue.
I will pick up exactly where I left off.
```
Then stop. Do not proceed to Phase 3 or 4.

Only proceed to Phase 3 when `remaining` in `session.json` is empty.

---

## Phase 3 — Run Skill 2

Read the skill file first:
```bash
cat /mnt/skills/user/codemap/graph-synthesis_SKILL.md
```
Then follow it exactly. Save output to `.codemap/graphs.json`.

---

## Phase 4 — Generate React Artifact

### Read the template
```bash
cat /mnt/skills/user/codemap/visualiser-template.jsx
```

### Load all data
```bash
cat /path/to/project/.codemap/arch.json
cat /path/to/project/.codemap/graphs.json
ls /path/to/project/.codemap/files/
```
Read every file in `.codemap/files/` to build the `fileMap` object.

### Inject data
Replace the `const DATA = { ... }` block at the top of the template with:
```js
const DATA = {
  arch:    { /* full contents of arch.json */ },
  graphs:  { /* full contents of graphs.json */ },
  fileMap: {
    "UserController.php": { /* contents of UserController.php.json */ },
    "UserService.php":    { /* contents of UserService.php.json */ },
    // one entry per file
  }
};
```

### Output the artifact
Output the complete filled React artifact in the conversation.

### Mark session complete
Update `session.json` → set `status: "complete"`.

### Tell the user
```
✓ Analysis complete

  Files analysed:         {n}
  Domains detected:       {n}
  Architectural patterns: {n}
  Shared functions:       {n} (called from 2+ places)
  API boundary crossings: {n}

The interactive mind map is ready above.

  • Expand/collapse folders and files in the tree
  • Click any function → animated cross-links appear
  • Click pills in detail panel → jump to caller/callee
  • 🔴 dot = no try/catch detected

Results saved to {projectPath}/.codemap/ for future reference.
```

---

## Global rules
- Never skip a file
- Never assume file contents — always read with `cat`
- Always save to disk after each file — context loss must never lose work
- Always check `session.json` before starting — resume if `in_progress`
- Always overwrite existing `.json` files — never skip because one exists
- Read each skill file before running that phase
- Do not proceed to Phase 3 until ALL files are in `analysed`
- Do not proceed to Phase 4 until `graphs.json` exists
