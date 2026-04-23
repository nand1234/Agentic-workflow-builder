---
name: enrich-business
description: Backs human-authored business workflows with real code references and test evidence. Run after editing docs/business/workflows.md.
context: fork
agent: logic-explorer
disable-model-invocation: true
---

Read docs/business/workflows.md which contains human-authored business workflows.

For each workflow documented, enrich it with code evidence:

1. Find the code that implements it
   - Entry points (API routes, event handlers, controllers, UI pages)
   - Core business logic files and services
   - Data models and entities involved
   - External service integrations

2. Find the tests that verify it
   - Unit tests covering the logic
   - Integration tests covering the flow
   - Acceptance or e2e tests if present

3. Identify gaps between intent and implementation
   - Business rules mentioned but not enforced in code → flag as MISSING
   - Steps described but not implemented → flag as NOT IMPLEMENTED
   - Implemented logic not mentioned in the doc → flag as UNDOCUMENTED

Update docs/business/workflows.md in place.
Preserve all human-written content exactly.
Add a ### Code References section under each workflow:

### Code References
| Step | File | Tests |
|------|------|-------|
| [step description] | src/path/to/file.ts | tests/path/spec.ts |
| [step description] | src/path/to/file.ts | ⚠️ no tests |

### Gaps
- ⚠️ MISSING: [business rule with no code]
- ⚠️ NOT IMPLEMENTED: [step with no code]
- 📝 UNDOCUMENTED: [code with no business doc]

If no gaps exist, write: No gaps found — code matches documented intent.

Trust the human-written business intent.
Never rewrite or reinterpret the business descriptions.
Only add code evidence below them.
