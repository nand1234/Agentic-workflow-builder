# 🧭 COMMAND: /domain_context (v1.0)

**Role:** Senior Product Engineer & Domain Analyst
**Objective:** Generate `.claude/skills/DOMAIN_CONTEXT.md` — the source of domain truth used by `/requirement_discovery`, `/feature-planner`, and any other skill that needs to ground itself in the project's personas, glossary, entry-point patterns, and canonical use cases.

This command is **project-agnostic**. It works for any repo — web API, CLI tool, mobile app, library, monorepo app, whatever — because it derives everything from the code in the current working directory plus a short interview. It does **not** assume PHP/Symfony/Elasticsearch or any specific stack.

---

## PHASE 0: When to run

- ✅ On **first-time setup** of `.claude/skills/` for a repo.
- ✅ After a **major architectural change** (new entry-point pattern, new external consumer, new persona).
- ✅ When `DOMAIN_CONTEXT.md` is **older than the last sprint** AND the code has drifted from what it describes.
- ⛔ Skip if `DOMAIN_CONTEXT.md` was generated this sprint and no new persona / pattern / external contract has appeared.

If `.claude/skills/DOMAIN_CONTEXT.md` already exists, ask the user whether to **update in place** (preserve sections the interview doesn't touch) or **regenerate from scratch**. Default to update-in-place.

---

## PHASE 1: Repo Reconnaissance (before the interview)

Run this *before* opening the interview so you can ground questions in real evidence instead of guesses.

### Step 1 — Detect stack & shape

Scan the working directory and record:

- **Language + framework** — from manifest files (`package.json`, `composer.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`, `Gemfile`, `build.gradle`, etc.).
- **Version pins** — runtime version, framework version, anything in `engines`/`platform`/`require` sections.
- **Entry surfaces** — HTTP routes/controllers, CLI commands, message/queue consumers, scheduled jobs, UI entry points, exported library functions, webhooks.
- **External integrations** — databases, caches, search engines, object storage, third-party APIs (look at env var names, config files, client classes).
- **Configuration layout** — where env/config/secrets live, which env files exist.
- **Existing docs** — `README.md`, `CLAUDE.md`, `docs/`, `ADRs/`, anything that already names personas or use cases.

### Step 2 — Collect candidate entry-point patterns

Group entry surfaces into 3–6 *patterns* (one row per row in §4 of the output). A pattern is: **"entry trigger → primary code path → typical consumer"**. Examples of patterns you might find in the wild — do NOT force any of these, pick what actually exists:

- Read API (HTTP GET) · Write API (HTTP POST/PUT/DELETE) · GraphQL operation · gRPC method
- Admin / operator UI action
- Scheduled CLI job / cron
- Message / queue consumer
- Webhook receiver
- External feed / file drop (S3, SFTP, …)
- Library call (for a published package)
- Background worker / job runner
- Database schema / migration
- Infra-as-code / deployment pipeline

### Step 3 — Collect candidate personas

From commit messages, `CODEOWNERS`, `README.md`, ticket prefixes, team docs, and the surfaces above, list who *plausibly* asks for features. Typical roles — again, pick only those that apply:

- End user / customer
- Internal operator / admin / support
- Content ops / moderation
- Catalog / data team
- Marketing / growth
- Ops / SRE / oncall
- Upstream / downstream service engineers (API consumers)
- Partner / third-party integrator
- Developer consuming the library

### Step 4 — Pick 3–5 candidate use cases

For each entry-point pattern, find **one real, currently-working user journey** in the code. Prefer recent, non-trivial ones. These become the UCs in §5.

---

## PHASE 2: Short Interview (to confirm and fill gaps)

Ask in **batches of 2–3**. Never more than 3 at once. Wait for answers.

### Batch 1 — Identity & scope

1. In one sentence, what is this project and who owns it?
2. From my scan I found these personas: [list]. Are any missing, or should any be dropped?
3. From my scan I found these entry-point patterns: [list]. Are any missing, or should any be merged/split?

### Batch 2 — Canonical use cases

> Present the 3–5 candidate UCs from Phase 1 Step 4 as a bullet list.

1. Of these candidates, which 3–5 best represent the "known-good" shape of a feature in this repo?
2. For each one, is there a **failure mode** that is part of the contract (e.g. "never return 5xx", "must be idempotent", "partial writes must not leave data inconsistent")?

### Batch 3 — Constraints & out-of-scope defaults

1. What **hard constraints** must every feature respect? (runtime version, response-time budget, backwards-compat rule, multi-tenant parity, naming conventions, read/write separation, …)
2. What is **permanently out of scope** for this repo? (things regularly proposed but owned by another repo / team / initiative)
3. Are there external contracts — JSON response shape, CSV headers, XML schema, published library API, DB table owned by another service — that must be treated as breaking when changed?

### Batch 4 — Open questions (conditional)

> Only if Batches 1–3 left something vague.

- "You mentioned [X] — who specifically consumes [Y]?"
- "Constraint [A] seems to conflict with out-of-scope item [B] — which takes priority?"

Do not close the interview with open questions unresolved — hold until clear.

---

## PHASE 3: Draft `DOMAIN_CONTEXT.md` Inline (do not save yet)

Generate the file using the template in Phase 6 and **display it inline** for review. Keep it ≤ ~200 lines — this is a reference, not a wiki.

Discipline rules while drafting:

- **§3 Glossary** must use terms verbatim as they appear in the code (class names, env vars, config keys). Do not invent synonyms.
- **§4 Entry-Point Patterns** table has one row per pattern confirmed in Phase 2 Batch 1.
- **§5 Canonical Use Cases** has one subsection per UC confirmed in Phase 2 Batch 2, each with: Actor · Trigger · Flow · Success signal · Failure mode · Default constraints inherited.
- **§6 Default Constraints** numbered C1…Cn — each with a one-line *Reason*. Derive from interview + code evidence; do not invent.
- **§7 Default Out-of-Scope items** — derive from Phase 2 Batch 3. At least one item.
- **§8 Scope-triage decision tree** — 3–6 ordered questions that route a new requirement to exactly one §4 row.
- **§9 How consuming commands should use this file** — explicitly name the downstream commands (e.g. `/requirement_discovery`, `/feature-planner`) and which sections they must pre-fill from.

Append this review prompt at the end:

> **✋ Review before saving**
>
> Does this domain context file match reality?
>
> - Are personas, glossary, and entry-point patterns correct?
> - Do the 3–5 use cases reflect real, currently-working journeys?
> - Are default constraints and out-of-scope items ones you'd actually want carried into every new brief?
>
> Reply with:
>
> - **`"Approve"`** or **`"Save"`** — saves to `.claude/skills/DOMAIN_CONTEXT.md`
> - **Feedback** — describe what to change and a revised draft will be shown before saving
> - **`"Add: [something]"`** — to add a persona, UC, or constraint that was missed

**⛔ STOP. Do not save until explicitly approved.**

---

## PHASE 4: Revision Loop

If the user provides feedback:

1. Apply changes precisely — do not alter anything the user did not ask to change.
2. Show the full updated file inline.
3. Prepend a short **Changes made:** list.
4. Re-append the Phase 3 review prompt.
5. **⛔ STOP. Do not save until explicitly approved.**

---

## PHASE 5: Save

**Trigger:** user says `"Approve"`, `"Save"`, `"Looks good"`, or equivalent.

1. Save to `.claude/skills/DOMAIN_CONTEXT.md` (create the directory if missing).
2. Print:

   ```
   ✅ Saved to .claude/skills/DOMAIN_CONTEXT.md

   Next steps:
   - /requirement_discovery will now load this file in Phase 0A.
   - Re-run /domain_context after any major architectural change, new persona, or new external contract.
   ```

---

## PHASE 6: Output Template

```markdown
---
name: [repo-slug]-domain-context
description: "Domain knowledge, personas, glossary, entry-point patterns, and canonical use cases for [project name]. USE WHEN: running /requirement_discovery, drafting a requirements brief, clarifying scope for a new feature in this repo, answering 'who consumes this?' or 'where should this live?', or triaging an incoming ticket. Contains [N] reference use cases, default constraints, and default out-of-scope items that should be carried into every new brief."
---

# DOMAIN_CONTEXT.md — [Project Name]

> **Purpose.** Source of domain truth for requirement discovery. When `/requirement_discovery` runs, it MUST read this file before the interview and use the personas, glossary, and use cases below to (a) seed good questions, (b) pre-fill constraints/out-of-scope defaults, and (c) classify where a new feature will land.

---

## 1. What the project is (one paragraph)

[One paragraph: what it is, who owns it, how it fits into the wider system, stack summary, where full docs live.]

---

## 2. Personas (who asks for features)

| Persona | What they do | Typical asks |
|---|---|---|
| **[Persona]** | [what they do] | [typical requests] |
| … | … | … |

---

## 3. Glossary (canonical vocabulary — use these exact terms in briefs)

| Term | Meaning |
|---|---|
| **[term]** | [meaning — name the class/env/config key where it originates] |
| … | … |

---

## 4. Entry-point patterns — where a feature lands

Use this table to classify any new requirement. Every feature should fit exactly one row.

| Pattern | Entry point | Primary code | Triggered by | When to pick |
|---|---|---|---|---|
| **[Pattern name]** | [route / command / queue / UI path] | [file / class chain] | [who/what triggers it] | [when this pattern applies] |
| … | … | … | … | … |

---

## 5. Canonical use cases (reference material for requirement briefs)

Each use case is the "known good" shape for that category. Reuse these shapes instead of re-discovering them.

### UC1 — [name] *([pattern from §4])*

- **Actor:** [persona from §2].
- **Trigger:** [concrete entry — URL / CLI line / event / call].
- **Flow:** [code path, entry → output, naming real classes/functions].
- **Success signal:** [observable outcome].
- **Failure mode:** [what must happen on error — contract guarantee].
- **Default constraints inherited:** [which of C1…Cn apply here].

### UC2 — …

[repeat per use case]

---

## 6. Default constraints (carry into EVERY new brief unless explicitly waived)

| # | Constraint | Reason |
|---|---|---|
| C1 | [constraint] | [why it exists / which UC or incident it came from] |
| … | … | … |

---

## 7. Default out-of-scope items (suggest these in §5 of every new brief unless user objects)

- [item 1]
- [item 2]
- …

---

## 8. Scope-triage decision tree (use during Phase 1 of `/requirement_discovery`)

Ask the user these, in order, to pin down which Entry-Point Pattern applies:

1. **Who initiates the action** — [options from §2 / §4].
2. **What is produced** — [JSON / file / DB row / event / UI change / …].
3. **Who is the consumer** — [options from §2].
4. **Does this change an existing external contract?** If yes, flag it — versioning or coordination required.
5. **Does this need [the project's main axis of parity — e.g. new brand/locale, new tenant, new platform]?** If yes, note the template files that must change together.

---

## 9. How consuming commands should use this file

`/requirement_discovery` Phase 0A:

1. Read this file in full before opening the interview.
2. In Phase 1 Batch 1, ground the "who" question in the §2 persona list — if the user's answer isn't in the list, log an Open Question.
3. In Phase 2 draft, **pre-fill**:
   - Brief §5 (Out of Scope) with applicable items from §7 above.
   - Brief §6 (Constraints) with applicable items from §6 above (C1…Cn).
4. In Brief §8 (Planner Handoff), set **Entry point** using the closest row in §4.
5. In Brief §7 (Open Questions), list anything the §8 decision tree could not resolve.

`/feature-planner` should read §4 to confirm the entry point and §6 to include applicable constraints as non-negotiables in the plan.

Every pre-filled item must be shown to the user for confirmation — defaults are suggestions, not decisions.

---

## 10. Staleness

Regenerate / update this file when any of the following occur:

- A new Entry-Point Pattern appears (e.g. a new queue consumer, webhook, GraphQL layer).
- A new persona becomes a regular requester.
- Glossary terms drift (a key term is renamed or its meaning changes).
- UC1…UCn no longer reflect what the code does.
- A default constraint or out-of-scope item is explicitly overridden in a shipped feature (promote it out of "default").
```

---

## Self-Audit (8-point checklist)

Before showing the inline draft, verify:

- [ ] §1 is one paragraph and names the stack + owner + how it fits into the wider system.
- [ ] §2 has at least one persona per distinct consumer type found in Phase 1.
- [ ] §3 glossary terms appear verbatim somewhere in the code (class, env var, config key, route, column) — no invented synonyms.
- [ ] §4 has one row per confirmed entry-point pattern; no speculative rows.
- [ ] §5 has 3–5 UCs, each with a concrete Trigger (real URL / CLI line / event) and a named Flow (real classes/functions).
- [ ] §6 constraints each have a *Reason* tied to a UC, an incident, or a platform fact — none are generic "be secure / be fast" filler.
- [ ] §7 out-of-scope items are things *this repo* regularly gets asked for but does not own — not abstract non-goals.
- [ ] §9 explicitly names the downstream commands (`/requirement_discovery`, `/feature-planner`, …) and which Brief sections they pre-fill from which §§ here.

---

## Notes

- This command produces a **reference file**, not a wiki page. If a section would run past ~30 lines, tighten it — volume hurts recall.
- Never bundle multiple projects into one `DOMAIN_CONTEXT.md`. One repo = one file. In a monorepo, one file per app under that app's own `.claude/skills/`.
- The file is read by other commands on every invocation — keep it scannable, not exhaustive. Link out to `README.md` / ADRs / `.claude/skills/SEARCH_PROTOCOL.md` for deep detail.
- Do not invent entry-point patterns or personas to look thorough. Empty rows are worse than missing rows — they mislead downstream commands.
