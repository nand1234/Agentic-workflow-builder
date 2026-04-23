---
name: scan-frontend
description: Scans frontend codebase and produces architecture standards document. Run once on project start and after major refactors.
context: fork
agent: logic-explorer
disable-model-invocation: true
---

Scan the entire frontend codebase and produce docs/architecture/frontend.md.

Cover every section below. Back every claim with real file references.
This document will be used as the standard for all future frontend implementation.

## Component Architecture
- Component patterns used (atomic, feature-based, page-based etc)
- Folder structure and naming conventions
- How components are organised and exported
- Props patterns and TypeScript usage

## State Management
- How global state is managed (redux, zustand, context etc)
- How local state is managed
- Where state lives and why
- Data flow patterns

## Styling Standards
- CSS approach (modules, tailwind, styled-components etc)
- Theming and design token usage
- Responsive and breakpoint patterns
- Class naming conventions

## API Integration
- How API calls are made (fetch, axios, react-query etc)
- Error handling patterns
- Loading state patterns
- Response typing

## Routing
- Router used and configuration
- Route naming conventions
- Protected route patterns

## Testing Standards
- Test framework and libraries used
- Test file naming and location
- What gets tested and how
- Mocking patterns
- Coverage expectations

## Key Conventions
- Patterns that repeat across the codebase
- Anti-patterns seen that should be avoided
- Import ordering and aliasing

Write in clear, instructional language.
A developer reading this should know exactly how to write code that fits in.
