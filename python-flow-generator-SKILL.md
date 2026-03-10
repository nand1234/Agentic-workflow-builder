---
name: pythonflowforge
description: >
  Build a fully tested, standalone Python workflow from a plain-English
  description. Use this skill whenever the user asks to automate a
  multi-step process, pipeline, or workflow. Triggers include: "build a
  workflow", "automate this process", "create a pipeline", "write scripts
  that do X then Y then Z". The output is a folder of step scripts plus a
  single execute_flow.py orchestrator — no AI dependency at runtime.
---

# FlowForge Skill

This skill turns a plain-English workflow description into a folder of
tested Python scripts orchestrated by a single `execute_flow.py`. Claude
Code is the agent — it plans, writes, executes, fixes, and packages
everything. The final output runs with zero AI involvement.

---

## Phase 0 — Clarify Before You Plan

Before writing a single line of code, check if the description is
ambiguous on any of these points. If it is, ask ONE focused question:

- **Data source**: file path, URL, API endpoint, database?
- **Credentials needed**: which env vars will be required?
- **Output format**: where should results land (file, stdout, DB)?
- **Volume**: approximate data size (affects batching decisions)

If the description is clear enough to proceed, skip this phase silently.
Never ask more than one question. Never ask about things you can infer.

---

## Phase 1 — Plan

Think through the full workflow before writing any code.

### 1.1 Identify steps

Break the workflow into discrete, single-responsibility steps. Each step
does exactly one thing. Name them as actions: `fetch_stories`,
`filter_by_score`, `save_to_csv`. Aim for 3–7 steps. If a step feels
large, split it.

### 1.2 Define the context schema

The context dict is the single data structure that flows through every
step. Define it completely before writing code. Write it to
`context_schema.json` in the workflow folder:

```json
{
  "stories_raw":    { "type": "list",   "set_by": "step_01", "used_by": ["step_02"] },
  "stories_filtered": { "type": "list", "set_by": "step_02", "used_by": ["step_03"] },
  "output_path":    { "type": "str",    "set_by": "step_03", "used_by": [] }
}
```

Every key that any step reads must be set by a prior step. No step may
read a key that isn't in this schema. No step may write a key that isn't
in this schema. If you discover a missing key during coding, update the
schema first, then the code.

### 1.3 Identify external dependencies

List any third-party packages needed (e.g. `requests`, `pandas`). Note
which env vars are required for API credentials. You will write
`requirements.txt` and document env vars in `README.md`.

### 1.4 Print your plan

Print a concise plan to the terminal before proceeding:

```
─────────────────────────────────
FlowForge Plan
─────────────────────────────────
Workflow : Hacker News top stories → CSV
Steps    : 3
Output   : ./hn_workflow/

  step_01_fetch_stories.py     → fetches top 500 story IDs + details
  step_02_filter_by_score.py   → filters stories with score > 100
  step_03_save_to_csv.py       → writes filtered stories to output.csv

Env vars : HN_API_BASE (optional, has default)
Packages : requests
─────────────────────────────────
Proceeding...
```

---

## Phase 2 — Code

Write each step file one at a time. Do not write all files at once then
test. Write one, test it, fix it, then move to the next.

### 2.1 Step file structure

Every step file must follow this exact structure:

```python
"""
step_NN_<name>.py
<One sentence describing what this step does.>

Context keys read  : key_a, key_b
Context keys written: key_c
"""

import logging

logger = logging.getLogger(__name__)


def run(context: dict) -> dict:
    """
    <Docstring repeating what this step does.>
    Reads  : context['key_a'], context['key_b']
    Writes : context['key_c']
    """
    # --- validate inputs ---
    required = ["key_a", "key_b"]
    missing = [k for k in required if k not in context]
    if missing:
        raise KeyError(f"step_NN missing required context keys: {missing}")

    # --- core logic ---
    result = do_something(context["key_a"], context["key_b"])

    # --- write output ---
    context["key_c"] = result
    logger.info("step_NN complete: produced %d items", len(result))
    return context


# ── sample data for standalone testing ──────────────────────────────────────
SAMPLE_CONTEXT = {
    "key_a": [...],   # realistic sample matching production shape
    "key_b": "value",
}

if __name__ == "__main__":
    import json, sys
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    print("Running step_NN standalone test...")
    result = run(SAMPLE_CONTEXT.copy())
    print("key_c:", json.dumps(result.get("key_c"), indent=2, default=str))
    print("PASSED")
    sys.exit(0)
```

Rules:
- `run()` always takes a `dict` and returns a `dict`
- Always validate required keys at the top of `run()`
- Always log what the step produced at the end
- `SAMPLE_CONTEXT` must be realistic — not `{"key_a": "test"}`
- The `__main__` block must print `PASSED` on success and exit 0

### 2.2 External API calls

When a step calls an external API:

- Read credentials exclusively from `os.environ.get("VAR_NAME")`
- Never hardcode keys, tokens, or secrets
- Wrap every API call in try/except, catch at minimum `requests.RequestException`
- On failure, raise a descriptive `RuntimeError` with the status code and response body
- Set a timeout on every `requests` call (default: 10 seconds)
- Log the request URL at DEBUG level (never log auth headers)

```python
import os, requests

API_KEY = os.environ.get("MY_SERVICE_API_KEY")
BASE_URL = os.environ.get("MY_SERVICE_BASE_URL", "https://api.example.com")

def fetch_data(endpoint: str) -> dict:
    try:
        resp = requests.get(
            f"{BASE_URL}/{endpoint}",
            headers={"Authorization": f"Bearer {API_KEY}"},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        raise RuntimeError(f"API call failed: {e}") from e
```

### 2.3 Sample data strategy

Sample data in `SAMPLE_CONTEXT` must:
- Match the real shape (correct keys, correct types, correct nesting)
- Be small but representative (5–20 items for lists)
- Cover edge cases relevant to the step (empty strings, nulls if realistic)
- NOT require network access or file system reads

If the step normally reads from a file, embed a small inline version of
that file's content as a string in `SAMPLE_CONTEXT`.

---

## Phase 3 — Test & Fix Loop

After writing each step file, immediately run it:

```bash
python step_NN_<name>.py
```

### 3.1 On success (exit code 0, prints PASSED)

Print:
```
  ✓ step_NN_<name>.py passed
```
Proceed to writing the next step.

### 3.2 On failure

- Read the full stderr carefully
- Identify the root cause (do not guess — read the traceback)
- Edit only the failing file
- Re-run immediately
- Repeat up to 3 times

After 3 failures on the same step:
- Write `FAILED_step_NN.md` explaining: what failed, what was tried, what the blocker is
- Print a warning to the terminal
- Continue to the next step (do not abandon the whole workflow)

### 3.3 What counts as passing

- Exit code 0
- Prints `PASSED`
- No unhandled exceptions in stderr
- Output printed to stdout looks structurally correct (not empty when data expected)

---

## Phase 4 — Assemble execute_flow.py

Only write `execute_flow.py` after all steps have passed (or been marked
FAILED with explanation).

### 4.1 Structure

```python
#!/usr/bin/env python3
"""
execute_flow.py
<One-line workflow description>

Generated by FlowForge. No AI dependency at runtime.

Usage:
    python execute_flow.py
    python execute_flow.py --dry-run

Environment variables:
    VAR_NAME    Description of what it's for (required/optional)

Steps:
    1. step_01_<name>  — what it does
    2. step_02_<name>  — what it does
    3. step_03_<name>  — what it does
"""

import argparse
import logging
import sys
import time

# ── step imports ─────────────────────────────────────────────────────────────
import step_01_<name>
import step_02_<name>
import step_03_<name>

# ── logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

STEPS = [
    ("step_01_<name>", step_01_<name>.run),
    ("step_02_<name>", step_02_<name>.run),
    ("step_03_<name>", step_03_<name>.run),
]


def run_workflow(dry_run: bool = False) -> dict:
    context = {}
    total = len(STEPS)

    print(f"\n{'─'*50}")
    print(f"  FlowForge Workflow")
    print(f"  {total} steps{'  [DRY RUN]' if dry_run else ''}")
    print(f"{'─'*50}\n")

    for i, (name, fn) in enumerate(STEPS, 1):
        print(f"  [{i}/{total}] {name}...")
        t0 = time.time()
        try:
            if not dry_run:
                context = fn(context)
            elapsed = time.time() - t0
            print(f"         ✓ done ({elapsed:.2f}s)\n")
        except Exception as e:
            print(f"         ✗ FAILED: {e}\n")
            logger.exception("Step %s failed", name)
            sys.exit(1)

    print(f"{'─'*50}")
    print(f"  Workflow complete.\n")
    return context


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Execute workflow")
    parser.add_argument("--dry-run", action="store_true", help="Validate imports only")
    args = parser.parse_args()
    run_workflow(dry_run=args.dry_run)
```

### 4.2 After writing execute_flow.py

Run it end-to-end:

```bash
python execute_flow.py
```

Apply the same test/fix loop from Phase 3. If it fails due to a step
issue, fix that step file, re-run the step standalone to confirm, then
re-run `execute_flow.py`.

Run the dry-run check too:

```bash
python execute_flow.py --dry-run
```

This validates all imports resolve correctly.

---

## Phase 5 — Supporting Files

### requirements.txt

List every third-party package used. Pin to a minimum version:

```
requests>=2.28.0
pandas>=1.5.0
```

If only stdlib is used, write:

```
# No third-party dependencies required.
```

### README.md

```markdown
# <Workflow Name>

<One paragraph describing what the workflow does and what it produces.>

## Setup

```bash
pip install -r requirements.txt
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| MY_API_KEY | Yes | API key for ... |
| OUTPUT_DIR | No | Output directory (default: ./output) |

## Usage

```bash
python execute_flow.py
```

## Steps

| File | Description |
|------|-------------|
| step_01_fetch.py | Fetches raw data from ... |
| step_02_filter.py | Filters records by ... |
| step_03_save.py | Writes results to ... |

## Context Schema

See `context_schema.json` for the full data contract between steps.

## Modifying the Workflow

Each step is independently runnable:
```bash
python step_01_fetch.py
```

To add a step: follow the `run(context) -> dict` interface, import it in
`execute_flow.py`, and add it to the `STEPS` list.
```

---

## Phase 6 — Final Summary

After everything is written and passing, print a final summary:

```
─────────────────────────────────────────────────
FlowForge Complete
─────────────────────────────────────────────────
Workflow : Hacker News → CSV
Folder   : ./hn_workflow/

Files created:
  ✓ context_schema.json
  ✓ step_01_fetch_stories.py      (passed standalone test)
  ✓ step_02_filter_by_score.py    (passed standalone test)
  ✓ step_03_save_to_csv.py        (passed standalone test)
  ✓ execute_flow.py               (passed end-to-end test)
  ✓ requirements.txt
  ✓ README.md

To run:
  cd hn_workflow
  pip install -r requirements.txt
  python execute_flow.py
─────────────────────────────────────────────────
```

---

## Conventions Summary (quick reference)

| Convention | Rule |
|---|---|
| Folder name | `<snake_case_workflow_name>/` |
| Step naming | `step_NN_<verb_noun>.py` (NN = 01, 02, ...) |
| Step interface | `def run(context: dict) -> dict` |
| Context mutation | Always return the modified context dict |
| Input validation | Always check required keys at top of `run()` |
| Credentials | Always `os.environ.get("VAR_NAME")` — never hardcoded |
| API timeouts | Always set `timeout=10` on requests |
| Standalone test | Every step has `if __name__ == "__main__"` that prints PASSED |
| Retry limit | 3 attempts per step before writing FAILED_step_NN.md |
| Orchestrator | execute_flow.py imports steps and calls them sequentially |
| Dry run | `--dry-run` flag validates imports only |

---

## What NOT to do

- Do not write all step files before testing any of them
- Do not use hardcoded file paths (use `os.path` or env vars)
- Do not swallow exceptions silently — always re-raise or log clearly
- Do not use `print()` for logging inside steps — use `logger.*`
- Do not add AI/LLM calls inside any step or execute_flow.py
- Do not proceed past a failing step without the FAILED_step_NN.md note
- Do not write execute_flow.py before all steps are tested
