---
name: scan-business
description: Legacy scan approach. Prefer enrich-business which backs human-authored workflows with code references.
disable-model-invocation: true
---

Note: The recommended approach is:
1. Manually author docs/business/workflows.md with your business knowledge
2. Run /enrich-business to back each workflow with real code references

If docs/business/workflows.md does not exist yet, this skill will
create a starter template for you to fill in.

Create docs/business/workflows.md with this template if it does not exist:

---
# Business Workflows

<!-- 
  Fill in each workflow in plain English.
  Describe business intent, not technical implementation.
  The /enrich-business skill will find the code that backs each workflow.
-->

## [Workflow Name]
[Describe what triggers this workflow, the steps involved,
key business rules, decisions made, and the end outcome.
Write as if explaining to a non-technical stakeholder.]

## [Workflow Name]
...

---

Template created at docs/business/workflows.md.
Fill it in with your business knowledge, then run /enrich-business.
