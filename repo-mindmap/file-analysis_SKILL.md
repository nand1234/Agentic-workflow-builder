# Skill 1 — Per-File Deep Analysis

## Purpose
Read every source file in the project one by one and extract a complete structural analysis including functions, variables, imports, error handling, routes and dependencies.

## Input
- A single file path + its content
- Architecture context from Skill 0 (`arch.json`)

## Output
One `.json` file per source file, saved to `.codemap/files/{filename}.json`

---

## Instructions

### Step 1 — Read the file
```bash
cat /path/to/file
```
Never assume file contents. Always read first.

### Step 2 — Identify file type and role

| File type | Role signals |
|-----------|-------------|
| `*Controller.php` | HTTP request handler, has routes |
| `*Service.php` | Business logic, called by controllers |
| `*Repository.php` | Database access, wraps Doctrine |
| `*Entity.php` | Doctrine ORM entity, maps to DB table |
| `*Command.php` | CLI command or CQRS command |
| `*Page.vue` | Top-level Vue page/view component |
| `*Component.vue` or plain `*.vue` | Reusable Vue component |
| `use*.ts` or `use*.js` | Vue composable |
| `*Store.ts` or `*store.ts` | Pinia store |
| `*Api.ts` or `*api.ts` | Frontend API layer, makes HTTP calls |

### Step 3 — Extract for PHP files

**Namespace**
```php
namespace App\Controller;
```

**Class name**
```php
class UserController
```

**Imports** (`use` statements)
```php
use App\Service\UserService;
```
For each import capture:
- `name` — short class name
- `source` — full namespace path
- `purpose` — what role does this import play (e.g. "Business logic for users")

**Constructor dependencies**
```php
public function __construct(
    private UserService $userService,
    private MailerInterface $mailer,
) {}
```
Each injected dependency becomes a variable entry.

**Class properties**
Any `private`, `protected`, `public` properties declared on the class.

**Methods** — for every method extract:
- `name` — method name
- `visibility` — public / protected / private
- `purpose` — one sentence describing what it does
- `inputs` — parameter names + types as a string
- `outputs` — return type
- `calls` — list of other methods/services called inside this method
- `route` — Symfony route attribute if present e.g. `GET /api/users`
- `errorHandling`:
  - `hasTryCatch` — true or false
  - `blocks` — array of try/catch blocks:
    - `try` — what operation is attempted
    - `catch` — exception type caught
    - `action` — what happens in the catch block
    - `finally` — what happens in finally (null if none)

**Symfony-specific extras:**
- `#[Route()]` attribute → extract method + path
- `#[IsGranted()]` → extract required role
- `#[ApiResource]` → flag as API Platform resource

### Step 4 — Extract for Vue / JS / TS files

**Imports**
```ts
import { useUsers } from '@/composables/useUsers'
import axios from 'axios'
```

**defineProps**
```ts
const props = defineProps<{ user: User; editable: boolean }>()
```
List each prop with its type.

**defineEmits**
```ts
const emit = defineEmits<{ select: [user: User]; close: [] }>()
```
List each event with its payload type.

**Functions / composables / exported functions** — for every function extract:
- `name`
- `purpose` — one sentence
- `inputs` — parameters + types
- `outputs` — return type or what it returns
- `calls` — other functions/composables/API calls made inside
- `axiosCalls` — HTTP calls made: method + endpoint e.g. `GET /api/users`
- `errorHandling`:
  - `hasTryCatch` — true or false
  - `blocks` — same structure as PHP

**Pinia store specifics:**
- `defineStore` name
- `state` fields
- `actions` (treated as functions)
- `getters`

### Step 5 — Determine domain
Using the domain list from `arch.json`, assign this file to the most relevant domain based on:
- File name prefix (e.g. `User` → Users domain)
- Folder location
- What it imports

If no domain matches, use `"General"`.

### Step 6 — Build dependency map
List every class/module this file imports that is also part of the project (not vendor/node_modules):
```json
"dependencyMap": ["UserService", "UserRepository", "MailerInterface"]
```

### Step 7 — Save output
Write to `.codemap/files/{filename}.json`:

```json
{
  "filename": "UserController.php",
  "filepath": "src/Controller/UserController.php",
  "type": "php",
  "tier": 2,
  "layer": "controllers",
  "domain": "Users",
  "namespace": "App\\Controller",
  "className": "UserController",
  "imports": [
    {
      "name": "UserService",
      "source": "App\\Service\\UserService",
      "purpose": "Business logic for user operations"
    }
  ],
  "variables": [
    {
      "name": "$userService",
      "type": "UserService",
      "description": "Injected — handles all user business logic"
    }
  ],
  "functions": [
    {
      "name": "index",
      "visibility": "public",
      "purpose": "Returns a paginated list of all users",
      "inputs": "Request $request",
      "outputs": "JsonResponse",
      "calls": ["userService->findAll()"],
      "route": "GET /api/users",
      "propsEmits": null,
      "axiosCalls": null,
      "errorHandling": {
        "hasTryCatch": true,
        "blocks": [
          {
            "try": "userService->findAll()",
            "catch": "\\Exception $e",
            "action": "Returns 500 JsonResponse with error message",
            "finally": null
          }
        ]
      }
    },
    {
      "name": "store",
      "visibility": "public",
      "purpose": "Validates and creates a new user account",
      "inputs": "Request $request",
      "outputs": "JsonResponse",
      "calls": ["userService->create()"],
      "route": "POST /api/users",
      "propsEmits": null,
      "axiosCalls": null,
      "errorHandling": {
        "hasTryCatch": false,
        "blocks": []
      }
    }
  ],
  "dependencyMap": ["UserService", "JsonResponse", "Request"]
}
```

### Step 8 — Update session
After saving the file JSON:
1. Move file path from `remaining` to `analysed` in `session.json`
2. Save `session.json`

### Step 9 — Progress report
After every 20 files output:
```
✓ {n}/{total} files analysed — {filename} done
```

---

## Context limit rule
After every 20 files check if context is getting full. If so, stop and tell the user:
```
⚠ Context limit approaching.
  {n} files analysed and saved to .codemap/files/
  {remaining} files remaining.

Run `analyserepo /path/to/project` to continue.
I will pick up exactly where I left off.
```

---

## Rules
- Never skip a file
- Never summarise instead of analysing — read the actual content
- Never assume what a file contains — always `cat` it first
- Always overwrite existing `.json` — never skip because one exists
- If a file is empty or unreadable, save a minimal JSON with a note
- Do not proceed to Skill 2 until ALL files are in `analysed` in `session.json`
