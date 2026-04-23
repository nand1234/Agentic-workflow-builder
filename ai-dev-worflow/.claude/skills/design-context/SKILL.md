---
name: design-context
description: Loads design review output for a feature. Auto-load when implementing frontend tickets that have associated designs.
user-invocable: false
---

Before implementing any frontend code for this feature, check if a design review exists:
docs/design/$FEATURE.md

If it exists, read it fully and follow it strictly:
- Build every component listed in the component inventory
- Implement every UI state documented — do not skip loading, error or empty states
- Follow the design tokens extracted — match colours, spacing and typography exactly
- Implement all interactions and navigation flows described
- Address all implementation notes before considering a ticket done

If open design questions exist in the doc, flag them before starting implementation.
Do not make assumptions about ambiguous design decisions — surface them first.

If no design doc exists for this feature, proceed with standard implementation.
