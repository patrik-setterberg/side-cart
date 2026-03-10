# Side Cart — Decision Log

A running log of architectural decisions, research findings, and general thinking.

---

## 2026-03-10 — AJAX add-to-cart on single product pages

**Decision:** Intercept the WooCommerce single product `<form class="cart">` submit, POST to the Store API (`wc/store/v1/cart/add-item`) instead, and open the drawer — no page reload.

**Setting:** `ajax_single_add_to_cart` (default `true`), only active when `auto_open` is also ON. The state check lives inside the `submit` event handler, not at listener registration time, because the Interactivity API state isn't hydrated yet when the module initializes.

**Scope boundaries — what we deliberately skip:**

| Case | Reason |
|---|---|
| Grouped products | Submit `quantity[product_id]` for N children; Store API only accepts one item per request. Would need N sequential calls + partial-failure handling. |
| Forms with custom fields (add-ons, etc.) | Store API `add-item` only supports `id`, `quantity`, `variation`. Extra fields would be silently dropped. |
| Forms where `defaultPrevented` is already true | Another script (Flatsome, Woodmart, etc.) is handling it. |
| Disabled submit button | WooCommerce disables the button when no variation is selected. |

For skipped cases the native form submit fires normally (page reload).

**Key implementation detail — `FormData` and simple products:**

WooCommerce simple products put the product ID on the submit button (`<button name="add-to-cart" value="123">`). `new FormData(form)` without an explicit submitter does **not** include the button's name/value pair. The code falls back to reading `submitBtn.value` directly.

---

## 2026-02-16 — Interactivity API as frontend framework

**Decision:** Use the WordPress Interactivity API (requires WP 6.5+) for the cart drawer frontend instead of React or vanilla JS.

**Key numbers:**

- ~85% of all WordPress sites run 6.5+ (source: wordpress.org/about/stats, Feb 2026)
- Active WooCommerce stores skew newer — estimated ~95% on 6.5+ (modern WooCommerce requires WP 6.4+ anyway)
- The real exclusion for our target market is ~3–5%, and those stores typically can't run modern WooCommerce plugins at all

**Why it's sound for a paid plugin:**

- Core API since WP 6.5 (Feb 2024) — not experimental
- WordPress's stated direction for frontend interactivity
- No JS framework shipped to the frontend — lighter than React on every page load
- Server-rendered HTML with client hydration — better performance, progressive enhancement, SEO-friendly
- Requiring WP 6.5+ in Feb 2026 (~2 years post-release) is within industry norms for premium plugins
- Premium WooCommerce plugins routinely require 6.2+ or 6.4+

**Trade-offs accepted:**

- Smaller ecosystem / fewer community examples than React
- Async actions use generator functions (minor learning curve)
- Can't use React component libraries on the frontend (don't need them for a cart drawer)

---
