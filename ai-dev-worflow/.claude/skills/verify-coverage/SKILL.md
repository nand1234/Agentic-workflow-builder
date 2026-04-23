---
name: verify-coverage
description: Verifies that all acceptance criteria for a ticket have passing tests and 100% coverage. Run after implement and before merge-to-cp.
context: fork
agent: coverage-verifier
disable-model-invocation: true
argument-hint: [TICKET-ID] [feature-slug]
---

Verify test coverage for: $ARGUMENTS

Parse: first argument is TICKET-ID (e.g. DC-1001), second is feature slug (e.g. discount-codes)

Steps:
1. Read docs/requirements/$FEATURE-rtm.md
2. Find all AC rows mapped to $TICKET_ID
3. Verify each AC has a mapped test file and test case
4. Run each mapped test — confirm passing
5. Run coverage report for all files touched by this ticket
6. Check every file reaches 100% on statements, branches, functions and lines
7. Update RTM status column with results
8. Save updated RTM to docs/requirements/$FEATURE-rtm.md

9. Produce verification report with quality gate verdict

Quality gate passes ONLY when:
- Every AC mapped to this ticket is ✅ PASSING
- Zero ACs are ⚠️ NO TEST FOUND
- Zero ACs are ❌ FAILING
- Every touched file shows 100% coverage on all metrics

If gate fails:
- List exactly what is missing or failing
- Do not suggest the ticket is done
- Recommend fixes before /merge-to-cp is run
