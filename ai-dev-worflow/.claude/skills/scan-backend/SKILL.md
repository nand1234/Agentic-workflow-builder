---
name: scan-backend
description: Scans backend codebase and produces architecture standards document. Run once on project start and after major refactors.
context: fork
agent: logic-explorer
disable-model-invocation: true
---

Scan the entire backend codebase and produce docs/architecture/backend.md.

Cover every section below. Back every claim with real file references.
This document will be used as the standard for all future backend implementation.

## Service Architecture
- Service structure and patterns (layered, hexagonal, etc)
- Folder structure and naming conventions
- How services are organised and injected
- Module or feature organisation

## API Design
- REST or GraphQL conventions
- Route naming and versioning
- Request validation patterns
- Response format and error format
- Authentication and authorisation patterns

## Database Access
- ORM or query builder used
- Repository or data access patterns
- Migration conventions
- Transaction handling patterns

## Error Handling
- How errors are caught and propagated
- Custom error types and codes
- Logging patterns

## External Services
- How third party services are integrated
- Service abstraction patterns
- Retry and timeout handling

## Testing Standards
- Test framework and libraries used
- Test file naming and location
- Unit vs integration test split
- Mocking and stubbing patterns
- Database test setup patterns
- Coverage expectations

## CI Pipeline (.ci/)
- All CI configuration lives in the .ci/ folder — never anywhere else
- What pipelines exist and what they do (build, test, deploy, lint etc)
- What triggers each pipeline (push, PR, merge, schedule)
- What test commands are run in CI
- What environment variables or secrets are expected
- Any pipeline conventions or naming patterns
- What must pass before a PR can merge

## Key Conventions
- Patterns that repeat across the codebase
- Anti-patterns seen that should be avoided
- Environment config and secrets patterns

Write in clear, instructional language.
A developer reading this should know exactly how to write code that fits in.
