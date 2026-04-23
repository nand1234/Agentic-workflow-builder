---
name: business-context
description: Loads human-authored business workflows enriched with code references. Auto-load during requirement discovery, planning or any discussion about business logic.
user-invocable: false
---

Before any requirement work, planning or business logic discussion, read:
[docs/business/workflows.md](docs/business/workflows.md)

This document is human-authored business truth backed by code evidence.

How to use it:
- Trust the business intent written by humans — it is authoritative
- Use code references to understand current implementation
- Use gaps sections to surface missing coverage or undocumented behaviour
- When asking discovery questions, reference what already exists
- Never design something that duplicates existing workflows
- Never design something that conflicts with existing business rules
  unless explicitly asked to replace or change them

Cross-reference every new requirement against this document before
asking any clarifying questions.
