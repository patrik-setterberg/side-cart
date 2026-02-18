# Side Cart — WooCommerce Side Cart Plugin Plan

> **Date:** 2026-02-16
> **Status:** Planning
> **WordPress:** 6.5+ required
> **WooCommerce:** Required dependency
> **PHP Namespace:** `SideCart`
> **Prefix:** `scrt_`
> **Text Domain:** `side-cart`

---

## Overview

A lightweight, accessible WooCommerce side-cart plugin. The frontend cart drawer is built with the **WordPress Interactivity API** (server-rendered, hydrated on the client). The admin settings page uses **React (`wp-element`)**. The cart communicates with WooCommerce via the **Store API (`wc/store/v1`)**.

### What sets it apart

- **Semantic HTML & full accessibility** — `<button>` elements, ARIA attributes, focus trapping, keyboard navigation, screen-reader announcements
- **Modern defaults** — clean design out of the box with CSS custom properties for easy theming
- **Performance** — Interactivity API is lighter than shipping a full React app to the frontend
- **Extensibility** — PHP hooks/filters and JS custom events for developers
- **High customizability** — granular admin settings; hooks and CSS custom properties for developers

---

## Reference Docs

| Doc | Contents |
|---|---|
| [docs/spec/settings-schema.md](docs/spec/settings-schema.md) | Full `$defaults` settings array with notes |
| [docs/spec/admin-tabs.md](docs/spec/admin-tabs.md) | Per-tab, per-section admin UI control detail |
| [docs/spec/css-custom-properties.md](docs/spec/css-custom-properties.md) | All `--scrt-*` CSS variables with defaults |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Coding conventions, escaping rules, end-to-end checklist for new settings |
| [TESTING.md](TESTING.md) | Theme compatibility testing matrix |
| [DECISIONS.md](DECISIONS.md) | Architectural decision log |

---

## Plugin Structure

```
side-cart/
│
├── side-cart.php                # Main plugin file (header, bootstrap, hooks)
├── uninstall.php                # Clean up options on uninstall
├── package.json                 # @wordpress/scripts, build config
├── webpack.config.js            # Custom entry points (admin + frontend module)
│
├── src/
│   ├── frontend/
│   │   ├── view.js              # Interactivity API store() — cart state & actions
│   │   └── view.css             # Cart drawer & floating basket styles
│   └── admin/
│       ├── index.js             # React admin app entry point
│       ├── App.jsx              # Settings UI root component
│       └── admin.css            # Admin page styles
│
├── build/                       # Compiled output (gitignored)
│
├── includes/
│   ├── class-plugin.php         # Core plugin class (singleton, hook wiring)
│   ├── class-cart-renderer.php  # Renders drawer HTML with data-wp-* directives
│   ├── class-admin.php          # Registers admin menu page, enqueues React
│   ├── class-rest-api.php       # Custom REST endpoints for plugin settings
│   ├── class-assets.php         # Script module + style registration
│   ├── class-template-loader.php # Template override resolution
│   ├── class-trigger-block.php  # Registers the cart trigger Gutenberg block
│   └── class-trigger-shortcode.php # Registers [side_cart_trigger] shortcode
│
├── blocks/
│   └── cart-trigger/
│       ├── block.json
│       ├── edit.js
│       ├── render.php
│       └── style.css
│
├── templates/
│   ├── cart-drawer.php          # Drawer markup (semantic HTML + directives)
│   ├── floating-basket.php      # Floating cart icon template
│   └── cart-trigger.php        # Trigger button template (used by block + shortcode)
│
├── languages/                   # .pot file for i18n
└── assets/
    └── icons/                   # SVG cart icons
```

---

## Implementation Phases

### Phase 1: Scaffold & Boilerplate

- [ ] Create directory structure
- [ ] `side-cart.php` — plugin header, constants (`SCRT_VERSION`, `SCRT_PLUGIN_DIR`, `SCRT_PLUGIN_URL`, `SCRT_PLUGIN_FILE`), WooCommerce dependency check on `plugins_loaded`, `spl_autoload_register` for `SideCart\*`, instantiate `SideCart\Plugin`
- [ ] `package.json` — `@wordpress/scripts`, build/start/lint commands
- [ ] `webpack.config.js` — two entry points: `frontend/view` (script module) + `admin/index` (standard script)
- [ ] `.gitignore` — ignore `build/`, `node_modules/`
- [ ] `uninstall.php` — delete `scrt_settings` option

### Phase 2: Frontend — Cart Drawer (Interactivity API)

#### 2a. PHP Rendering (`class-cart-renderer.php`)

- [ ] Hook into `wp_footer` to output drawer HTML
- [ ] `wp_interactivity_state('side-cart', [...])` — initialise server-side from `WC()->cart`:
  - `items` (key, name, quantity, price, thumbnail, permalink, `maxQty` from `quantity_limits.maximum`)
  - `totalItems`, `totalUniqueItems`, `subtotal`, `cartTotal`, `currency`
  - `freeShippingThreshold` (from WC free shipping `min_amount`; `null` if not configured)
  - `isOpen`, `isLoading`, `cartUrl`, `checkoutUrl`
  - `storeApiNonce`, `storeApiBase`
  - `customTriggerSelector`, `badgeCountMode`
  - `appliedCoupons`

#### 2b. Drawer Template (`templates/cart-drawer.php`)

- [ ] Semantic HTML: `<aside role="dialog" aria-modal="true">`, `<ul aria-live="polite">` for items, `<template data-wp-each>` for item loop
- [ ] Overlay + close-on-click
- [ ] Item row: thumbnail, name, SKU (conditional), variation (conditional), price, quantity controls (− / input / +), remove button
- [ ] Empty state (hidden when `state.hasItems`)
- [ ] Footer: subtotal, coupon chips (conditional), totals (conditional), CTA buttons
- [ ] Free shipping progress bar: `<progress>` with message above (hidden if `freeShippingThreshold` is `null`)
- [ ] Toast container (`<div aria-live="assertive">` with `<template data-wp-each>`)

#### 2c. Trigger System

- [ ] **Floating basket** (`templates/floating-basket.php`) — rendered when `show_floating_basket` is ON; badge bound to `state.badgeCount`
- [ ] **Gutenberg block** (`blocks/cart-trigger/`) — `register_block_type()`, `block.json`, `edit.js`, `render.php` using shared trigger template
- [ ] **Shortcode** `[side_cart_trigger]` (`class-trigger-shortcode.php`) — attrs: `text`, `show_badge`, `icon`, `class`, `id`
- [ ] **Custom CSS selector** — `initCustomTriggers()` callback in `view.js` attaches click listeners to `state.customTriggerSelector` elements; injects badge into child `[data-scrt-badge]` or `.scrt-badge`
- [ ] **Shared trigger template** (`templates/cart-trigger.php`) — icon + text + badge span, all bound to `side-cart` namespace

#### 2d. JavaScript Store (`src/frontend/view.js`)

State:
- [ ] `isOpen`, `isLoading`, `items`, `totalItems`, `totalUniqueItems`, `badgeCountMode`
- [ ] `subtotal`, `currency`, `cartUrl`, `checkoutUrl`, `storeApiNonce`, `storeApiBase`
- [ ] `customTriggerSelector`, `toasts`, `lastError`, `freeShippingThreshold`, `appliedCoupons`
- [ ] Computed getters: `hasItems`, `badgeCount`, `headerText`, `freeShippingRemaining`, `freeShippingPercent`

Actions (all async as generator functions):
- [ ] `toggle`, `open`, `close`
- [ ] `removeItem` — POST `cart/remove-item`
- [ ] `updateQuantity` — POST `cart/update-item`; handle stock conflict (400/409), network failure, generic error
- [ ] `increaseQuantity`, `decreaseQuantity`
- [ ] `refreshCart` — GET `cart`; handle item-no-longer-available (404)
- [ ] `applyCoupon` — POST `cart/apply-coupon`
- [ ] `removeCoupon` — POST `cart/remove-coupon`
- [ ] `showToast`, `dismissToast`

Callbacks:
- [ ] `initFocusTrap` — trap focus inside open drawer
- [ ] `onKeydown` — Escape closes drawer
- [ ] `watchOpen` — toggle body scroll lock, dispatch `scrt:cart-opened` / `scrt:cart-closed`
- [ ] `autoExpireToasts` — auto-dismiss after ~3s
- [ ] `initCustomTriggers` — attach click listeners to custom selector elements

WC integration:
- [ ] Listen for `added_to_cart` jQuery event → `refreshCart()` + `open()`

#### 2e. Styles

- [ ] `side-cart-structure.css` (Layer 1) — positioning, transforms, z-index, overlay, toast stacking; always enqueued; structural values use `--scrt-*` custom properties
- [ ] `side-cart-theme.css` (Layer 2) — full aesthetic stylesheet; enqueued when `load_plugin_stylesheet` ON; all values as `--scrt-*` properties (see [css-custom-properties.md](docs/spec/css-custom-properties.md))
- [ ] Inline override block (Layer 3) — `wp_add_inline_style` when `customize_appearance` ON; only differing properties output

### Phase 3: Asset Registration (`class-assets.php`)

- [ ] Register frontend as script module: `wp_register_script_module('side-cart-view', ..., ['@wordpress/interactivity'])`
- [ ] Enqueue on frontend: `wp_enqueue_script_module('side-cart-view')`
- [ ] Always enqueue: `side-cart-structure` style
- [ ] Conditionally enqueue: `side-cart-theme` style when `load_plugin_stylesheet` ON
- [ ] Conditionally output inline overrides when `customize_appearance` ON
- [ ] Skip all enqueues when WooCommerce is not active

### Phase 4: Admin Settings Page (React)

- [ ] **`class-admin.php`** — `add_menu_page()` (slug `side-cart`, icon `dashicons-cart`, cap `manage_options`); enqueue React bundle only on this page; use auto-generated `.asset.php` for deps
- [ ] **`class-rest-api.php`** — namespace `side-cart/v1`; `GET /settings` returns `scrt_settings`; `POST /settings` validates, sanitizes, saves; permission: `manage_options`; see [settings-schema.md](docs/spec/settings-schema.md) for full defaults and [admin-tabs.md](docs/spec/admin-tabs.md) for UI detail
- [ ] **`src/admin/App.jsx`** — 5-tab interface: General, Appearance, Integrations, Advanced, License
- [ ] Dirty state tracking (`isDirty`), sticky unsaved-changes banner, `beforeunload` safety net
- [ ] Per-tab save via `@wordpress/api-fetch`

### Phase 5: Theme Template Overrides (`class-template-loader.php`)

- [ ] `scrt_get_template( $name, $args )` — resolves: child theme → parent theme → plugin; apply filter `scrt_locate_template`; extract `$args` + include
- [ ] Filter `scrt_template_path` (default subdirectory: `side-cart`)
- [ ] Template versioning: `SCRT_TEMPLATE_VERSION` constant; `@version` comment in each template; compare with `get_file_data()` on admin loads; admin notice if theme overrides are outdated

### Phase 6: WooCommerce Integration (`class-plugin.php`)

- [ ] Hook `woocommerce_add_to_cart_fragments` for non-JS basket count fallback
- [ ] Respect WC cart/checkout URLs
- [ ] Handle variable products / selected variations
- [ ] Conditionally disable on cart/checkout pages (per settings)

### Phase 7: Accessibility Audit

- [ ] All interactive elements are `<button>` or `<a>`
- [ ] Focus trapped inside open drawer; returned to trigger on close
- [ ] Escape key closes drawer
- [ ] `aria-live="polite"` on items/totals region; `aria-live="assertive"` on toasts
- [ ] `aria-expanded` on floating basket; `aria-modal="true"` on drawer
- [ ] Visible focus indicators on all interactive elements
- [ ] WCAG 2.1 AA color contrast (4.5:1 for text)
- [ ] VoiceOver testing

### Phase 8: i18n

- [ ] PHP: `__()`, `_e()`, `esc_html__()`, `esc_attr__()` with text domain `side-cart`
- [ ] JS: `import { __, _n, sprintf } from '@wordpress/i18n'`
- [ ] Generate `.pot`: `wp i18n make-pot . languages/side-cart.pot`
- [ ] `load_plugin_textdomain('side-cart', ...)` in bootstrap

### Phase 9: Theme Compatibility Testing

See [TESTING.md](TESTING.md) for the full theme list and checklist per theme.

---

## Build Configuration

### `webpack.config.js` — two entry points

```js
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = [
  // Frontend (script module for Interactivity API)
  {
    ...defaultConfig,
    entry: { 'frontend/view': './src/frontend/view.js' },
    output: {
      path: path.resolve(__dirname, 'build'),
      module: true,
      chunkFormat: 'module',
      library: { type: 'module' },
    },
    experiments: { outputModule: true },
  },
  // Admin (standard script for React)
  {
    ...defaultConfig,
    entry: { 'admin/index': './src/admin/index.js' },
    output: { path: path.resolve(__dirname, 'build') },
  },
];
```

---

## Developer Extensibility

### PHP Hooks

| Hook | Type | Description |
|---|---|---|
| `scrt_before_cart_drawer` | Action | Fires before the drawer HTML |
| `scrt_after_cart_drawer` | Action | Fires after the drawer HTML |
| `scrt_before_cart_items` | Action | Inside drawer, before items list |
| `scrt_after_cart_items` | Action | Inside drawer, after items list |
| `scrt_cart_item_data` | Filter | Modify data passed for each cart item |
| `scrt_floating_basket_icon` | Filter | Replace the basket SVG icon |
| `scrt_drawer_classes` | Filter | Add CSS classes to the drawer container |
| `scrt_settings_defaults` | Filter | Modify default settings values |
| `scrt_interactivity_state` | Filter | Modify the initial Interactivity API state |

### JS Custom Events

| Event | Detail | When |
|---|---|---|
| `scrt:cart-opened` | — | Drawer opens |
| `scrt:cart-closed` | — | Drawer closes |
| `scrt:cart-updated` | `{ cart }` | Cart state refreshed from API |
| `scrt:item-removed` | `{ key, name }` | Item removed |
| `scrt:item-quantity-changed` | `{ key, quantity }` | Quantity updated |

---

## Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | Interactivity API | Lighter than React on frontend; server-rendered; progressive enhancement; native WP |
| Admin framework | React (`wp-element`) | Rich component library; standard for WP admin UIs |
| Cart API | WC Store API (`wc/store/v1`) | Modern, unauthenticated, complete cart state, no jQuery dependency |
| Settings storage | Single `scrt_settings` option | Simpler migration, single DB query, atomic updates |
| Admin menu | Top-level page | Not nested under WooCommerce |
| CSS approach | CSS custom properties | Themeable by developers, overridable from admin via inline styles |
| Prefix | `scrt_` | Short, unique, avoids collision |

---

## Future Enhancements (Post-MVP)

- [ ] Related products / cross-sells in drawer (MAYBE, PROBABLY NOT)
- [ ] Inline shipping calculator
- [ ] Save for later / wishlist (MAYBE)
- [ ] Express checkout buttons (Apple Pay, Google Pay, PayPal)
- [ ] Per-page enable/disable rules
- [ ] WP Customizer integration for live style preview
