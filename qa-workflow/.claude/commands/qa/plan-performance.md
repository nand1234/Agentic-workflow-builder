# qa:plan-performance

**Mode 2 — structured planning.** Creates a Lighthouse CI / Web Vitals performance plan scoped to the approved RTM. Run `/qa:strategy` first.

---

## Instructions

$ARGUMENTS is the feature name.

### STEP 1 — Load and validate

Read: `.claude/SKILL.md`, `.claude/strategy/[feature]-strategy.md`

If strategy missing → stop: `❌ Run /qa:strategy [feature] first.`
Check RTM has Performance column with at least one ✅.

### STEP 2 — Gather context (ask once)

```
Quick questions for the performance plan:

1. Which pages need performance tests? (or "all key pages")
2. Target audience connection? (fast wifi / mobile 3G / mixed)
3. Any existing Lighthouse scores or Web Vitals data? (paste or "none")
4. Rendering strategy? (SSR / CSR / SSG / ISR)
```

### STEP 3 — Analyse assets

Spawn agent to check: JS bundle size, image formats, font loading, third-party scripts, render-blocking resources, existing caching headers.

### STEP 4 — Create the plan

Create `.claude/plans/performance-[feature].md`:

````markdown
# Performance Test Plan: [feature]

_Tool: Lighthouse CI | Created: [date] | Status: pending_

## Pages Under Test

| Page | URL | Priority |
|---|---|---|
| [Page] | [url] | Critical |

## Budgets

| Metric | Target | Google "Good" threshold |
|---|---|---|
| LCP | < [N]ms | < 2500ms |
| INP | < [N]ms | < 200ms |
| CLS | < [N] | < 0.1 |
| TTFB | < [N]ms | < 800ms |
| FCP | < [N]ms | < 1800ms |
| JS bundle | < [N]KB | — |

## Lighthouse CI config

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: ['[list of pages]'],
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: [N] }],
        'cumulative-layout-shift': ['error', { maxNumericValue: [N] }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'uses-optimized-images': 'warn',
        'render-blocking-resources': 'warn',
        'unused-javascript': 'warn',
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}
```

## Scenarios

1. **Desktop baseline** — Chromium, broadband, all pages
2. **Mobile 3G** — Pixel 5 emulation, slow 3G, critical pages only
3. **Bundle regression** — assert JS stays under budget on every build
4. **Image check** — all images WebP/AVIF, width/height set, lazy below fold

## Known issues to fix first

[From asset analysis — quick wins that move scores most]
1. [issue] — estimated [N]ms LCP improvement
2. [issue]

## CI integration

```yaml
- name: Lighthouse CI
  run: |
    npm run build && npm run start &
    npx lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```
````

### STEP 5 — Output

```
✅ Performance plan created: .claude/plans/performance-[feature].md

Pages: [N] | Budgets: LCP < [N]ms | CLS < [N] | JS < [N]KB

Quick wins to implement first:
  [Top 2 from analysis]

Next: /qa:execute performance-[feature]
```
