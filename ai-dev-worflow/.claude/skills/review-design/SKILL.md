---
name: review-design
description: Analyses Figma URLs and/or PNG screenshots and produces a detailed design spec for implementation. Use when a feature has designs attached, when asked to review a design, or before implementing any UI changes.
context: fork
agent: design-reviewer
disable-model-invocation: true
argument-hint: [feature-slug] [figma-url or path/to/images]
---

Review designs for: $ARGUMENTS

Parse arguments:
- First argument is always the feature slug (e.g. discount-codes)
- Remaining arguments are design sources:
  - Figma URL: starts with https://www.figma.com
  - PNG paths: file paths to image files

Steps:
1. Read docs/requirements/$FEATURE.md if it exists — understand the feature context
2. Read docs/architecture/frontend.md — understand existing component patterns

3. Determine input type from arguments:

   IF Figma URL provided:
   - Extract FILE_KEY from URL
   - Attempt Figma API fetch:
     curl -H "X-Figma-Token: $FIGMA_TOKEN" \
       "https://api.figma.com/v1/files/$FILE_KEY"
   - If FIGMA_TOKEN not set or fetch fails:
     Note the limitation and proceed with visual analysis only
     Inform user how to set FIGMA_TOKEN for richer data:
     export FIGMA_TOKEN=your_token_here

   IF PNG files provided:
   - Read each image file
   - Perform full visual analysis

   IF both provided:
   - Use Figma API for component structure and tokens
   - Use PNGs for visual state and interaction analysis
   - Merge findings into single output

4. Perform full design review following agent instructions
5. Save output to docs/design/$FEATURE.md
6. Report completion with:
   - Number of screens reviewed
   - Number of components identified (new vs existing)
   - Number of UI states found
   - Any open design questions that need answers before implementation
   - Suggest running /discover or /plan next if not already done
