---
name: how
description: Explains how something works in the codebase with execution path, file references and backing tests. Use when asked "how does X work", "where is X handled", "explain X flow", "trace X", "walk me through X".
context: fork
agent: logic-explorer
argument-hint: [what you want to understand]
---

Explain how $ARGUMENTS works in this codebase.

Structure your response exactly as:

## Flow Summary
One paragraph plain English explanation a non-technical person could understand

## Execution Path
Step by step trace with file:line references
Format: Step N → file/path.ts:line — what happens here

## Key Files
| File | Role |
|------|------|

## Tests That Back This
| Test File | What it proves |
|-----------|----------------|

## Gaps
Behaviour that exists in code but has no test coverage.
Flag each gap as: ⚠️ UNTESTED: [description]

If nothing is untested, write: All behaviour is covered by tests.

Only claim what the code proves. Never assume or invent.
