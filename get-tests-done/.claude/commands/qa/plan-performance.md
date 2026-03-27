# qa:plan-performance

Create a Lighthouse CI / Web Vitals performance test plan with budgets, thresholds, and automated regression detection. Produces executable Lighthouse CI config and Playwright-based performance assertions.


> **Scope gate:** This command requires an approved strategy. Read `.qa/strategy/[feature]-strategy.md` before planning. Only create scenarios that map to RTM requirements marked for this test type. Do not add out-of-scope scenarios.


## Instructions

You are the GTD Performance Planning Orchestrator. Performance budgets without baselines are guesses. Your job is to establish real baselines and create tests that catch regressions before they ship.

$ARGUMENTS can specify a page or flow (e.g. "homepage", "dashboard", "checkout"). If empty, plan performance tests for all key pages.

### Step 1: Load Context

Read:
- `.qa/QA-STRATEGY.md`
- `.qa/config.json`
- `.qa/COVERAGE-MAP.md`

### Step 2: Gather Performance Context

Ask (one at a time):

1. "What are the most performance-critical pages? (Pages where users will immediately leave if slow — usually homepage, product page, checkout, login)"

2. "What's your target audience's typical connection? (e.g. 'enterprise users on fast wifi', 'mobile-first in emerging markets', 'mixed'). This determines throttling settings."

3. "Do you have existing performance data? (Lighthouse scores, Core Web Vitals from Search Console, p95 load times from analytics). If yes, paste them. If not, I'll establish baselines."

4. "Server-side or client-side rendering? Or SSG/ISR? This affects which metrics matter most."

5. "Any known heavy assets? (large hero images, third-party scripts, analytics bloat, font loading issues)"

### Step 3: Spawn Research Agents

**Agent A — Asset & Bundle Analyst**:
> "Analyse the frontend bundle and assets. Find: JavaScript bundle size and chunks, CSS bundle size, image sizes and formats, web font loading strategy, third-party scripts loaded (analytics, chat widgets, ads), lazy loading implementation, code splitting configuration. Flag: uncompressed assets, non-next-gen image formats, render-blocking scripts."

**Agent B — Rendering & Hydration Analyst**:
> "Analyse the rendering strategy. Determine: SSR vs CSR vs SSG vs ISR, time-to-first-byte factors, hydration approach (full vs partial/islands), critical rendering path, above-the-fold content loading, deferred script loading. Identify what blocks the initial render."

**Agent C — Performance Config Auditor**:
> "Audit existing performance configuration. Check: image optimization settings, caching headers, CDN configuration if present, gzip/brotli compression, HTTP/2 or HTTP/3, preload/prefetch hints, service worker if any, existing Lighthouse CI config. Compare against current best practices."

### Step 4: Build the Performance Plan

Create `.qa/plans/performance.md`:

````markdown
# Performance Test Plan

_Tool: Lighthouse CI + Playwright | Created: [date] | Status: pending_

## Pages Under Test

| Page | URL Pattern | Priority | Render Strategy |
|---|---|---|---|
| Homepage | / | Critical | [SSR/SSG/CSR] |
| Dashboard | /dashboard | High | [SSR/CSR] |
| [Page] | [url] | Medium | [strategy] |

## Performance Budgets

### Core Web Vitals Thresholds

| Metric | Green | Yellow | Red | Our Target |
|---|---|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5–4s | > 4s | < [N]ms |
| FID / INP (Interaction to Next Paint) | < 100ms | 100–300ms | > 300ms | < [N]ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1–0.25 | > 0.25 | < [N] |
| TTFB (Time to First Byte) | < 800ms | 800ms–1.8s | > 1.8s | < [N]ms |
| FCP (First Contentful Paint) | < 1.8s | 1.8–3s | > 3s | < [N]ms |
| TBT (Total Blocking Time) | < 200ms | 200–600ms | > 600ms | < [N]ms |

### Resource Budgets

| Resource | Budget | Current (baseline) |
|---|---|---|
| JavaScript (compressed) | < 200KB | [from Agent A] |
| CSS (compressed) | < 50KB | [from Agent A] |
| Images per page | < 500KB | [from Agent A] |
| Total page weight | < 1MB | [from Agent A] |
| Third-party scripts | < 100KB | [from Agent A] |
| Web fonts | < 100KB | [from Agent A] |

### Lighthouse Score Thresholds

| Category | Minimum Score | Target |
|---|---|---|
| Performance | 80 | 90 |
| Accessibility | 90 | 95 |
| Best Practices | 85 | 95 |
| SEO | 90 | 100 |

## Test Scenarios

<perf-suite>

  <scenario id="desktop-baseline" device="desktop">
    <n>Desktop — full page performance baseline</n>
    <throttling>
      CPU: 4x slowdown
      Network: broadband (no throttle)
    </throttling>
    <pages>[all critical pages]</pages>
    <assertions>
      - All Lighthouse scores meet minimums
      - All Core Web Vitals in green
      - No render-blocking resources
      - All images have width/height attributes
    </assertions>
  </scenario>

  <scenario id="mobile-3g" device="mobile">
    <n>Mobile — 3G throttled (real-world emerging markets)</n>
    <throttling>
      Device: Moto G4 emulation
      CPU: 6x slowdown
      Network: Slow 3G (400ms RTT, 400Kbps down)
    </throttling>
    <pages>[critical pages only]</pages>
    <assertions>
      - LCP < 4000ms (relaxed for 3G)
      - CLS < 0.1 (layout stable regardless of connection)
      - FCP < 3000ms
      - Page usable within 5s of navigation
    </assertions>
  </scenario>

  <scenario id="js-regression" device="desktop">
    <n>JavaScript bundle regression check</n>
    <method>webpack-bundle-analyzer / bundlesize</method>
    <action>
      Build production bundle.
      Assert: Total JS < [budget]KB.
      Assert: No single chunk > [N]KB.
      Assert: Code splitting working (route-based chunks exist).
    </action>
  </scenario>

  <scenario id="image-optimization" device="desktop">
    <n>Image optimization check</n>
    <action>
      Audit all images on each page.
      Assert: All images served in WebP or AVIF.
      Assert: All images have explicit width/height.
      Assert: No images above fold > 100KB.
      Assert: Images use lazy loading below fold.
      Assert: No layout shift from images loading (CLS < 0.05 from images).
    </action>
  </scenario>

  <scenario id="third-party-impact" device="desktop">
    <n>Third-party script impact audit</n>
    <action>
      Load page with and without third-party scripts blocked.
      Measure performance delta.
      Assert: Third-party scripts don't add > [N]ms to TBT.
      Assert: Analytics scripts are deferred, not blocking.
      Identify: Any single third-party > 50KB uncompressed.
    </action>
  </scenario>

  <scenario id="cls-interaction" device="mobile">
    <n>CLS during page interaction (INP)</n>
    <action>
      Navigate to page. Wait for full load.
      Scroll through page — measure layout shifts.
      Click interactive elements — measure INP.
      Assert: CLS < 0.1 during full session.
      Assert: INP < 200ms for all interactions.
    </action>
  </scenario>

</perf-suite>

## Lighthouse CI Configuration

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/[key-page]',
      ],
      settings: {
        preset: 'desktop',
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'time-to-first-byte': ['warn', { maxNumericValue: 600 }],
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'render-blocking-resources': 'warn',
        'unused-javascript': 'warn',
        'uses-text-compression': 'error',
        'uses-responsive-images': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

## Playwright Performance Assertions

```typescript
// tests/performance/vitals.perf.ts
import { test, expect } from '@playwright/test'

test('Core Web Vitals — Homepage', async ({ page }) => {
  await page.goto('/')
  
  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics: Record<string, number> = {}
      
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            metrics.lcp = entry.startTime
          }
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })
      
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.cls = (entry as any).value
        }
      }).observe({ entryTypes: ['layout-shift'] })
      
      setTimeout(() => resolve(metrics), 3000)
    })
  })
  
  expect(vitals.lcp).toBeLessThan(2500)
  expect(vitals.cls).toBeLessThan(0.1)
})
```

## File Structure

```
tests/performance/
├── vitals.perf.ts           # Core Web Vitals assertions
├── bundles.perf.ts          # Bundle size checks
├── images.perf.ts           # Image optimization checks
├── third-party.perf.ts      # Third-party impact
└── lighthouse/
    ├── desktop.config.js    # Desktop Lighthouse config
    └── mobile.config.js     # Mobile Lighthouse config

lighthouserc.js              # Root Lighthouse CI config
```

## CI Integration

```yaml
# .github/workflows/performance.yml
- name: Build app
  run: npm run build && npm run start &

- name: Run Lighthouse CI
  run: npx lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

- name: Performance Playwright tests
  run: npx playwright test tests/performance/
```

## Known Performance Issues

[From Agent A + B + C output — ranked by impact]

1. [Issue] — [estimated LCP/CLS/TBT impact] — [fix recommendation]
2. [Issue] — [estimated impact] — [fix]

## Quick Wins (Fix Before Implementing Tests)

[Items from analysis that are easy wins and will move scores most]
````

### Step 5: Update Coverage Map

Mark performance coverage for planned pages.

### Step 6: Summary

```
✅ Performance plan created: .qa/plans/performance.md

Pages under test: [N]
Scenarios: [N] (desktop baseline, mobile 3G, JS regression, images, CLS)
Budget: LCP < [N]ms | CLS < [N] | JS < [N]KB

⚠️  Quick wins to implement first:
[Top 3 from analysis]

Next: /qa:execute performance
      Then run: npx lhci autorun
```
