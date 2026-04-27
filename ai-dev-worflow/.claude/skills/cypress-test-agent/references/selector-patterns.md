# Cypress Selector Patterns — Reference

---

## ✅ Preferred — `data-testid`

```js
// Raw attribute selector
cy.get('[data-testid="btn-checkout"]').click()

// Via custom command (if the framework defines one)
cy.getByTestId('btn-checkout').click()
cy.findByTestId('input-check-in-date').type('2024-12-01')
```

**Why:** Stable across style and structure refactors, decoupled from CSS classes.

---

## ✅ Acceptable fallback — semantic role (only when data-testid is absent)

```js
cy.contains('button', 'Continue to Checkout').click()
cy.findByRole('button', { name: 'Add to Cart' })
```

Always flag to the user that the element needs a `data-testid` added.

---

## ❌ Never use these

```js
cy.get('.btn-primary')                           // CSS class — breaks on refactor
cy.get('form button:last-child')                 // positional — breaks on DOM changes
cy.xpath('//button[contains(@class,"submit")]')  // XPath — fragile and unreadable
```

---

## Assertion Cheat Sheet

```js
// Visibility
cy.get('[data-testid="review-summary"]').should('be.visible')
cy.get('[data-testid="payment-section"]').should('not.exist')
cy.get('[data-testid="loading-spinner"]').should('not.be.visible')

// Text
cy.get('[data-testid="price-total"]').should('contain.text', '$120')
cy.get('[data-testid="confirm-msg"]').should('have.text', 'Booking confirmed')

// Input value
cy.get('[data-testid="input-guests"]').should('have.value', '2')

// URL
cy.url().should('include', '/review')
cy.url().should('eq', 'http://localhost:3000/checkout')

// Disabled / enabled
cy.get('[data-testid="btn-confirm"]').should('be.disabled')
cy.get('[data-testid="btn-submit"]').should('not.be.disabled')

// Count
cy.get('[data-testid="review-item"]').should('have.length', 3)

// Attribute
cy.get('[data-testid="hero-image"]').should('have.attr', 'src').and('include', 'cdn')
```

---

## Page Ready — Waiting Before Scraping or Asserting

Prefer element-based waits over bare `cy.wait(ms)`:

```js
// ✅ Best — wait for a specific element to confirm the page is rendered
cy.get('[data-testid="page-root"]').should('be.visible')

// ✅ Wait for a network request to settle
cy.intercept('GET', '/api/experience/*').as('getExperience')
cy.wait('@getExperience')

// ⚠️  Use bare cy.wait() only for truly unpredictable async renders
cy.wait(500)
```

---

## Viewport Patterns

```js
// Cypress device presets
cy.viewport('iphone-x')    // 375 × 812
cy.viewport('ipad-2')      // 768 × 1024
cy.viewport(1280, 800)     // explicit desktop

// In a context block
context('Mobile', () => {
  beforeEach(() => cy.viewport('iphone-x'))
  it('shows review summary on mobile', () => { ... })
})
```

---

## Finding Custom Commands

Before writing any selector or helper call, check what already exists:

```bash
grep "Cypress.Commands.add" cypress/support/commands.js
```

Common patterns to look for:
```js
cy.login()                               // auth
cy.startSession({ user: fixtures.guest })
cy.visitExperience(id)                   // nav helpers
cy.getByTestId('element-name')           // selector helpers
cy.waitForPageLoad()                     // wait helpers
```

Always reuse — never duplicate existing commands.
