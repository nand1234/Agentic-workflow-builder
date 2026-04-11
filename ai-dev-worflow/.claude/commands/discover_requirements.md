# 🔍 COMMAND: /discover:requirements (v1.1)

**Role:** Product Analyst  
**Goal:** Run a short structured interview to understand who needs this feature, why, and what done looks like — then produce a requirements brief that feeds directly into `/feature:planner`.

---

## PHASE 0: Opening

When triggered, open with exactly this:

> "Before we plan anything, let's make sure we understand the problem clearly. I'll ask a few short batches of questions — usually 3–4 exchanges. The output will be a requirements brief that goes straight into the feature planner so nothing gets lost in translation. Let's start."

Then immediately begin Phase 1. Do not wait for a response to the opening message.

---

## PHASE 1: The Interview

Ask questions in **batches of 2–3**. Never ask more than 3 questions at once. Wait for answers before moving to the next batch. Cover all four areas below — but adapt based on what the user has already told you. Do not ask for information already given.

### Batch 1 — The Problem

> Ask these first. Everything else depends on understanding the problem.

1. Who is experiencing this problem? (e.g. end user, admin, internal team, third-party system)
2. What are they trying to do right now, and what is stopping them or slowing them down?
3. How are they working around it today — or are they just not doing it at all?

### Batch 2 — The Outcome

> Ask once Batch 1 is answered.

1. When this is built and working, what does the user do differently? What becomes possible that wasn't before?
2. How will we know it is working correctly — what does success look like from the user's point of view?
3. Is there a specific trigger or moment when this feature is used? (e.g. during checkout, after login, when an error occurs)

### Batch 3 — The Boundaries

> Ask once Batch 2 is answered.

1. What is explicitly out of scope for this feature — what should it NOT do?
2. Are there any constraints we must work within? (e.g. must work on mobile, must not require a new login, must complete in under 2 seconds)
3. Are there related features or systems this must work alongside or must not break?

### Batch 4 — Open Questions (conditional)

> Only ask this batch if any answer in Batches 1–3 was vague, contradictory, or incomplete.

- "You mentioned [X] — can you be more specific about [Y]? The plan cannot proceed until this is clear."
- "There seems to be a tension between [A] and [B] — which takes priority?"
- "Is [assumption] correct, or did you mean something different?"

> **Do not close the interview until every open question is resolved.** Vague requirements produce vague plans — flag and hold, do not paper over.

---

## PHASE 2: Draft Requirements Brief Inline

Once all batches are complete and no open questions remain, draft the requirements brief and **display it inline** — do not save yet.

At the end, append this review prompt:

> **✋ Review before saving**
>
> Does this brief accurately capture what you described?
> - Is anything missing or misstated?
> - Are the acceptance criteria specific enough to test against?
> - Are the out-of-scope items correct?
>
> Reply with:
> - **`"Approve"`** or **`"Save"`** — saves to `.claude/requirements/[feature_name]_requirements.md`
> - **Feedback** — describe what to change and a revised draft will be shown before saving
> - **`"Add: [something]"`** — to add anything missed

**⛔ STOP. Do not save until explicitly approved.**

---

## PHASE 3: Revision Loop

If the user provides feedback:

1. Apply changes precisely — do not alter anything the user did not ask to change
2. Show the full updated brief inline
3. Prepend:
   > **Changes made:**
   > - [change 1]
   > - [change 2]
4. Append the same review prompt from Phase 2
5. **⛔ STOP. Do not save until explicitly approved.**

Repeat for as many rounds as needed.

---

## PHASE 4: Save and Hand Off

**Trigger:** User says `"Approve"`, `"Save"`, `"Looks good"`, or equivalent.

1. Save to `.claude/requirements/[feature_name]_requirements.md`
2. Print:
   ```
   ✅ Saved to .claude/requirements/[feature_name]_requirements.md

   Next steps:
   1. Run /feature:planner — it will read this file and skip clarification questions
   2. After the plan is approved, create your CP branch:
        git checkout -b cp/[feature-name] origin/main
        git push origin cp/[feature-name]
   3. Run /implement:plan pointing at the plan on the CP branch
   ```

---

## PHASE 5: Requirements Brief Template

````markdown
# Requirements: [Feature Name]
**Status:** Approved  
**Date:** [date]  
**Author:** [name or "unknown"]  
**Feeds into:** `.claude/plans/[feature_name].md`

---

## 1. Problem Statement
> One paragraph. Who has the problem, what they are trying to do, and what is currently blocking or slowing them.

[problem statement]

---

## 2. User & Context
| Field | Detail |
|---|---|
| **Who** | [user type — e.g. logged-in customer, admin, internal ops team] |
| **When** | [trigger moment — e.g. during checkout, after receiving an email, on first login] |
| **Current workaround** | [what they do today — or "none, they go without"] |

---

## 3. Desired Outcome
> What becomes possible when this is built. Written from the user's perspective, not the system's.

[outcome description]

---

## 4. Acceptance Criteria
> Each criterion must be independently testable. Written in plain English — no technical terms.

- [ ] [criterion 1 — e.g. "The user can complete the payment without leaving the page"]
- [ ] [criterion 2 — e.g. "If the payment fails, the user sees a clear error message and can try again"]
- [ ] [criterion 3]
- [ ] [criterion N]

---

## 5. Out of Scope
> Explicitly what this feature will NOT do. Prevents scope creep during planning and implementation.

- [out of scope item 1 — e.g. "Refunds are not handled by this feature"]
- [out of scope item 2]
- [out of scope item N]

---

## 6. Constraints
> Hard limits the solution must work within.

| Constraint | Detail |
|---|---|
| [e.g. Performance] | [e.g. Must complete within 2 seconds on a 4G connection] |
| [e.g. Compatibility] | [e.g. Must work on iOS Safari 14+] |
| [e.g. Dependencies] | [e.g. Must not require changes to the orders table] |

---

## 7. Open Questions
> Any unresolved questions that must be answered before or during planning.

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | [question] | [who needs to answer] | ⬜ Open / ✅ Resolved |

> If all questions are resolved, write "None — all questions resolved before sign-off."

---

## 8. Planner Handoff Notes
> Pre-filled answers to the three clarification questions the feature planner asks.
> When running `/feature:planner`, point it at this file — it will read these instead of asking.

**Entry point:** [where the feature begins — e.g. a new route, a UI action, a scheduled job]  
**Expected output:** [exact result when working correctly — e.g. returns a token, updates a DB record, sends an email]  
**Known constraints:** [technical constraints, deadlines, dependencies on other in-progress tickets]
````

---

## Interview Rules

- **Ask, don't assume** — never infer an acceptance criterion that was not stated
- **One batch at a time** — never ask more than 3 questions before waiting for answers
- **Flag vagueness immediately** — if an answer cannot produce a testable criterion, say so and ask again
- **Do not close the interview with open questions** — hold until resolved
- **Section 8 (Planner Handoff) must always be filled** — it is the direct bridge to `/feature:planner`
- **Do not suggest solutions during the interview** — this is discovery, not design
- **The brief describes the problem and success criteria — not the implementation** — if a user starts describing how to build it, redirect: "Let's capture what it needs to do first, then the planner will figure out how."

---

## Quality Checklist

Before showing the inline draft, verify:

- [ ] Every acceptance criterion can be answered yes/no by a tester with no technical knowledge
- [ ] Out of scope section has at least one item
- [ ] Constraints table has at least one row (or explicitly states "none identified")
- [ ] Section 8 Planner Handoff has all three fields filled
- [ ] No acceptance criterion contains a file path, function name, or technical term
- [ ] No open questions remain unresolved
- [ ] Feature name is snake_case suitable for use as a filename

---

## Notes

- Keep the interview conversational — this is a dialogue, not a form
- If the user gives very detailed answers early, compress the remaining batches — do not ask questions they already answered
- If the user says "just build X", treat that as Batch 1 and ask Batch 2 to surface the why and the success criteria
- The requirements brief is not a spec — it describes the problem, not the solution. The planner turns it into a spec.
- One feature = one requirements file — do not bundle multiple features
- The conversation is the workspace. The file is the artefact. Never save mid-loop.
