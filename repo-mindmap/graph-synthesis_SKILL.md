# Skill 2 — Graph Synthesis

## Purpose
Read all per-file analyses from Skill 1 and synthesise them into three structured graphs (frontend, backend, combined) plus a call map that tracks which functions call which across the entire codebase.

## Input
- All `.json` files from `.codemap/files/`
- `arch.json` from `.codemap/`

## Output
Saved to `.codemap/graphs.json`

---

## Instructions

### Step 1 — Load all file analyses
```bash
ls .codemap/files/
```
Read every `.json` file. Build a complete picture of all files, their layers, domains and functions.

### Step 2 — Build the call map
For every function across all files, find every other function that calls it.

This is the most important step — it powers the animated cross-links in the visualiser.

For each function `F` in file `X`:
- Search all other files for any function that lists `F.name` in its `calls` array
- Record those as `calledBy` for `F`

Output shape:
```json
{
  "callMap": {
    "UserService.findAll": {
      "definedIn": "UserService.php",
      "calledBy": [
        { "fn": "index", "file": "UserController.php" },
        { "fn": "create", "file": "OrderController.php" }
      ]
    },
    "useUsers.fetchUsers": {
      "definedIn": "useUsers.ts",
      "calledBy": [
        { "fn": "setup", "file": "UsersPage.vue" }
      ]
    }
  }
}
```

### Step 3 — Build frontend graph
Include only files with layer: `pages`, `components`, `composables`, `store`, `api`

**Nodes** — one per file:
```json
{
  "id": "unique string e.g. fe_0",
  "label": "filename without extension",
  "layer": "pages|components|composables|store|api",
  "file": "exact filename e.g. UsersPage.vue",
  "domain": "domain name from arch.json"
}
```

**Edges** — one per import relationship:
- File A imports from File B → edge from A to B
- Direction: caller → callee
```json
{
  "from": "node id",
  "to": "node id",
  "label": "uses|imports|calls"
}
```

Layer ordering (top to bottom):
```
pages → components → composables → store → api
```

### Step 4 — Build backend graph
Include only files with layer: `controllers`, `services`, `repositories`, `entities`, `db`

Same node + edge structure as frontend graph.

Layer ordering (top to bottom):
```
controllers → services → repositories → entities → db
```

### Step 5 — Build combined graph
Include ALL files from both frontend and backend.

**Nodes** — same as above but add `side` field:
```json
{
  "id": "string",
  "label": "string",
  "side": "frontend|backend",
  "layer": "string",
  "file": "string",
  "domain": "string"
}
```

**Edges** — include all internal edges plus API boundary crossings:

API boundary crossings happen when:
- A frontend `api` layer file calls an endpoint that matches a backend controller route
- e.g. `userApi.ts` calls `GET /api/users` → `UserController.index` handles `GET /api/users`

Mark these edges with `"type": "api"`:
```json
{
  "from": "fe_api_node_id",
  "to": "be_controller_node_id",
  "label": "GET /api/users",
  "type": "api"
}
```

Group nodes by domain in the combined view — nodes in the same domain should have sequential IDs so the layout groups them together.

### Step 6 — Save output
Write to `.codemap/graphs.json`:

```json
{
  "callMap": {
    "ServiceName.methodName": {
      "definedIn": "filename",
      "calledBy": [
        { "fn": "methodName", "file": "filename" }
      ]
    }
  },
  "frontend": {
    "nodes": [
      {
        "id": "fe_0",
        "label": "UsersPage",
        "layer": "pages",
        "file": "UsersPage.vue",
        "domain": "Users"
      }
    ],
    "edges": [
      {
        "from": "fe_0",
        "to": "fe_2",
        "label": "uses"
      }
    ]
  },
  "backend": {
    "nodes": [
      {
        "id": "be_0",
        "label": "UserController",
        "layer": "controllers",
        "file": "UserController.php",
        "domain": "Users"
      }
    ],
    "edges": [
      {
        "from": "be_0",
        "to": "be_1",
        "label": "calls"
      }
    ]
  },
  "combined": {
    "nodes": [
      {
        "id": "fe_0",
        "label": "UsersPage",
        "side": "frontend",
        "layer": "pages",
        "file": "UsersPage.vue",
        "domain": "Users"
      },
      {
        "id": "be_0",
        "label": "UserController",
        "side": "backend",
        "layer": "controllers",
        "file": "UserController.php",
        "domain": "Users"
      }
    ],
    "edges": [
      {
        "from": "fe_api_0",
        "to": "be_0",
        "label": "GET /api/users",
        "type": "api"
      }
    ]
  }
}
```

### Step 7 — Report to user
```
✓ Skill 2 complete

  Frontend nodes: {n}
  Backend nodes:  {n}
  Combined edges: {n}
  API crossings:  {n}
  Shared functions (called by 2+): {n}

Proceeding to artifact generation...
```

---

## Rules
- Build the call map before building graphs — graphs depend on it
- Match function calls by name — be fuzzy if needed (e.g. `findAll` matches `userService->findAll()`)
- API boundary crossings must match route method + path exactly
- Every node must have a unique ID
- Edges must only reference IDs that exist in the nodes array
- If a function is called by more than one caller, it is a shared function — this is the most valuable data in the output
