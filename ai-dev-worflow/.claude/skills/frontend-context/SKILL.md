---
name: frontend-context
description: Loads frontend architecture standards and conventions. Auto-load when implementing frontend tickets, writing frontend code or reviewing frontend changes.
user-invocable: false
---

Before implementing any frontend code, read and strictly follow:
[docs/architecture/frontend.md](docs/architecture/frontend.md)

This is the source of truth for:
- How components should be structured and named
- How state should be managed
- How styles should be written
- How API calls should be made
- How tests should be written
- What patterns to follow
- What anti-patterns to avoid

Do not introduce any pattern not already present in this document
unless the ticket explicitly requires something new.
If something new is needed, flag it and ask before implementing.
