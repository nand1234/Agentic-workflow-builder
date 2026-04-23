---
name: backend-context
description: Loads backend architecture standards and conventions. Auto-load when implementing backend tickets, writing backend code or reviewing backend changes.
user-invocable: false
---

Before implementing any backend code, read and strictly follow:
[docs/architecture/backend.md](docs/architecture/backend.md)

This is the source of truth for:
- How services should be structured and named
- How API endpoints should be designed
- How database access should be handled
- How errors should be handled and propagated
- How external services should be integrated
- How tests should be written
- What patterns to follow
- What anti-patterns to avoid

## CI Convention
All CI configuration must live in the .ci/ folder — never anywhere else.
Before proposing or creating any CI changes, read existing files in .ci/ first.
Match the existing pipeline structure, naming and trigger conventions exactly.
Never create CI files outside .ci/ under any circumstance.
