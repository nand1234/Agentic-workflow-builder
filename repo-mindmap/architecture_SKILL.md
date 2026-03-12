# Skill 0 — Architecture Discovery

## Purpose
Analyse the overall architecture of a codebase from its file structure and produce a structured summary of domains, patterns, tech stack and data flow.

## Input
- Full list of file paths from the project
- Project root path

## Output
Saved to `.codemap/arch.json`

---

## Instructions

### Step 1 — Read the file list
You already have the file list from `files.json`. Do not re-scan the directory.

### Step 2 — Analyse the structure
From the file paths alone, identify:

**Tech Stack**
- PHP files → likely Symfony (check for `src/Controller`, `src/Service`, `src/Entity`, `src/Repository`)
- Vue/TS files → likely Vue 3 (check for `composables/`, `stores/`, `pages/`, `components/`)
- Check for `composer.json`, `package.json` names if available

**Domains / Features**
- Group files by their name prefix e.g. `User`, `Order`, `Product`, `Auth`
- Each domain typically has a Controller + Service + Repository + Entity on backend and a Page + Composable + Store on frontend
- Assign each domain a distinct hex color

**Architectural Patterns**
Look for these patterns based on folder/file naming:
| Pattern | Signal |
|---------|--------|
| Repository Pattern | `src/Repository/` folder exists |
| Service Layer | `src/Service/` folder, thin controllers |
| CQRS | `Command/`, `Query/`, `Handler/` folders |
| Event-Driven | `Event/`, `EventListener/`, `EventSubscriber/` |
| DTO Pattern | `DTO/`, `Request/` folders with data objects |
| Composition API | `composables/` folder in frontend |
| Pinia Store | `stores/` folder in frontend |
| API Platform | `api/` resources or `#[ApiResource]` in entities |

**Entry Points**
Identify likely entry points:
- `public/index.php` — Symfony HTTP entry
- `src/Kernel.php` — Symfony kernel
- `frontend/src/main.ts` or `src/main.ts` — Vue entry
- `App.vue` — Vue root component

**Data Flow**
Describe how a typical request flows through the system e.g.:
`HTTP Request → Symfony Router → Controller → Service → Repository → Doctrine ORM → Database → JsonResponse`

### Step 3 — Save output
Write to `.codemap/arch.json`:

```json
{
  "appPurpose": "One sentence — what does this application do?",
  "architecture": "2-3 sentences describing the overall architecture style and organisation",
  "dataFlow": "Step by step description of how a request flows through the system",
  "techStack": [
    "Symfony 6.4",
    "Vue 3",
    "Doctrine ORM",
    "Pinia",
    "TypeScript",
    "JWT Auth"
  ],
  "patterns": [
    {
      "name": "Repository Pattern",
      "description": "All database access is isolated in Repository classes injected into Services"
    },
    {
      "name": "Service Layer",
      "description": "Business logic lives in Service classes, Controllers remain thin"
    }
  ],
  "domains": [
    {
      "name": "Auth",
      "description": "Login, registration, JWT token management",
      "color": "#4080ff",
      "files": ["AuthController.php", "AuthService.php", "LoginPage.vue"]
    },
    {
      "name": "Users",
      "description": "User profiles, CRUD operations",
      "color": "#3ecf82",
      "files": ["UserController.php", "UserService.php", "UsersPage.vue"]
    }
  ],
  "entryPoints": [
    "public/index.php",
    "src/Kernel.php",
    "frontend/src/main.ts"
  ]
}
```

### Step 4 — Report to user
After saving, output a summary:

```
✓ Skill 0 complete

  App:      {appPurpose}
  Domains:  {domain names}
  Patterns: {pattern names}
  Stack:    {tech stack}

Proceeding to Skill 1 — per-file analysis...
```

---

## Rules
- Do not read individual file contents in this skill — work from file paths only
- Do not invent domains that are not evidenced by the file structure
- Assign visually distinct colors to each domain
- If the architecture is unclear, say so honestly in the `architecture` field
