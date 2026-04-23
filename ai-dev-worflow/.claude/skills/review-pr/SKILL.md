---
name: review-pr
description: Reviews staged and unstaged git changes for both frontend and backend. Use before pushing or raising a PR.
context: fork
agent: pr-reviewer
disable-model-invocation: true
---

Review all current changes in this branch.

Steps:
1. Get all changes
   git diff HEAD
   git diff --cached
   git status
2. Read docs/architecture/frontend.md for frontend standards
3. Read docs/architecture/backend.md for backend standards
4. Identify which changed files are frontend and which are backend
5. Review all changes against the relevant standards
6. Check test coverage for every changed file
7. Produce structured review report

Be specific — reference file names and line numbers in feedback.
Distinguish between must-fix issues and suggestions.
Give a clear final verdict: APPROVE or REQUEST CHANGES.
