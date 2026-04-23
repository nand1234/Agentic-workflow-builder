---
name: discover
description: Requirement discovery for a new feature. Produces business requirements and BDD acceptance criteria. Use when starting a new feature or when asked to discover, analyse or define requirements.
context: fork
agent: requirements-analyst
disable-model-invocation: true
argument-hint: [feature description in plain English]
---

Perform full requirement discovery for: $ARGUMENTS

Step 0 — Design Check (if designs provided):
- Check if docs/design/$FEATURE_SLUG.md already exists
- If Figma URL or PNG files were passed alongside the feature description,
  run /review-design $FEATURE_SLUG $DESIGN_SOURCE before proceeding
- If design doc exists or is just created, read it fully before requirements analysis
  Design states and interactions must be reflected in acceptance criteria

Step 1 — Requirements Analysis:
- Read docs/business/workflows.md for business context
- Read docs/architecture/frontend.md for frontend context
- Read docs/architecture/backend.md for backend context
- Cross-reference the requirement against what already exists
- Identify what existing code, services and flows are relevant
- Ask only questions that cannot be answered from the codebase
- Save output to docs/requirements/$FEATURE_SLUG.md

Step 2 — Acceptance Criteria:
- Read the requirements doc just produced
- Write BDD Gherkin acceptance criteria
- Cover happy path, negative cases and edge cases
- Append to docs/requirements/$FEATURE_SLUG.md

Derive $FEATURE_SLUG from the requirement description.
e.g. "user can apply discount code" → discount-codes

Step 3 — Generate Requirement Traceability Matrix:
- Read the BDD acceptance criteria just written
- Assign a unique ID to every scenario: AC-001, AC-002, AC-003...
- Create RTM skeleton at docs/requirements/$FEATURE_SLUG-rtm.md
- Ticket, test file, test case and status columns left empty — filled later

RTM format:
| AC ID | Acceptance Criterion | Scenario Type | Ticket | Test File | Test Case | Status |
|-------|---------------------|--------------|--------|-----------|-----------|--------|
| AC-001 | [criterion summary] | happy path | pending | pending | pending | 🔲 NOT STARTED |
| AC-002 | [criterion summary] | negative | pending | pending | pending | 🔲 NOT STARTED |
| AC-003 | [criterion summary] | edge case | pending | pending | pending | 🔲 NOT STARTED |

Report when complete with path to both docs:
- docs/requirements/$FEATURE_SLUG.md
- docs/requirements/$FEATURE_SLUG-rtm.md
