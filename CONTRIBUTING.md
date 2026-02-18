# Contributing to Side Cart

This document covers everything you need to know to work on this codebase consistently — conventions, patterns, and the workflow for common tasks.

---

## Project overview

Side Cart is a paid WooCommerce plugin. The frontend cart drawer uses the **WordPress Interactivity API** (server-rendered PHP, hydrated on the client). The admin settings page uses **React (`wp-element`)**. Cart data comes from the **WooCommerce Store API (`wc/store/v1`)**.

**Requirements:** WordPress 6.5+, WooCommerce active.

Further reading:

- [PLAN.md](../PLAN.md) — implementation phases and task checklist
- [DECISIONS.md](../DECISIONS.md) — architectural decision log with rationale
- [docs/spec/](./docs/spec/) — settings schema, admin UI detail, CSS custom properties

---

## Getting started

```bash
npm install
npm run start    # watch mode
npm run build    # production build
npm run lint:js  # JS linting
npm run lint:css # CSS linting
```

Build output goes to `build/` (gitignored). The auto-generated `.asset.php` files in `build/` are used for script dependencies and versioning — don't edit them manually.

---

## Naming conventions

Consistency here matters because WordPress is a global namespace. We use a short, unique prefix everywhere.

| Thing | Convention | Example |
|---|---|---|
| PHP namespace | `SideCart` | `SideCart\CartRenderer` |
| PHP functions | `scrt_` prefix | `scrt_get_template()` |
| WordPress options | `scrt_` prefix | `scrt_settings` |
| WordPress hooks | `scrt_` prefix | `scrt_before_cart_drawer` |
| PHP constants | `SCRT_` prefix | `SCRT_VERSION` |
| CSS classes | `scrt-` prefix, BEM sub-elements | `scrt-drawer__header` |
| Interactivity API namespace | `side-cart` | `store('side-cart', {})` |
| REST namespace | `side-cart/v1` | `/wp-json/side-cart/v1/settings` |
| JS custom events | `scrt:` prefix | `scrt:cart-updated` |
| Text domain | `side-cart` | `__( 'Text', 'side-cart' )` |

---

## PHP conventions

### File structure

One class per file. File names follow the WordPress convention: `class-{slug}.php`.

```
includes/class-cart-renderer.php  →  class SideCart\CartRenderer
includes/class-rest-api.php       →  class SideCart\RestApi
```

Classes are autoloaded via `spl_autoload_register` registered in `side-cart.php`. No Composer autoloading.

### Escaping — escape at output

Always escape at the point of output, not earlier. Escaping a value when you store it in a variable gives false confidence if the variable gets reused in a different context.

| Output context | Function(s) |
|---|---|
| HTML text content | `esc_html()`, `esc_html_e()`, `esc_html__()` |
| HTML attribute values | `esc_attr()`, `esc_attr_e()`, `esc_attr__()` |
| URLs (href, src, action) | `esc_url()` |
| Inline JS data | `wp_json_encode()` |
| SQL queries | `$wpdb->prepare()` |

```php
// Good — escaped at output
echo '<a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a>';

// Bad — escaped too early, gives false confidence
$safe_label = esc_html( $label );
// ... $safe_label used in an attribute later, wrong escaping function
```

### Sanitization — sanitize on save

When accepting input (REST requests, form submissions), sanitize before storing. Use the most specific sanitizer available for the data type.

| Data type | Sanitizer |
|---|---|
| Plain text (single line) | `sanitize_text_field()` |
| Multi-line text | `sanitize_textarea_field()` |
| Integer | `absint()` (positive) or `(int)` |
| Float | `(float)` |
| Boolean | `rest_sanitize_boolean()` |
| Hex color | `sanitize_hex_color()` |
| CSS value | `sanitize_text_field()` + allowlist check |
| Array | `array_map()` with appropriate sanitizer per element |
| Page ID array | `array_map( 'absint', $value )` |

### Templates

Never include templates directly. Always go through the helper, which handles child theme → parent theme → plugin fallback:

```php
// Good
scrt_get_template( 'cart-drawer.php', [
    'show_floating_basket' => $settings['show_floating_basket'],
] );

// Bad
include SCRT_PLUGIN_DIR . 'templates/cart-drawer.php';
```

The `$args` array is extracted into scope inside the template, so `$args['show_floating_basket']` becomes `$show_floating_basket`. Keep template variables flat — avoid nested arrays in args.

### Hooks

All hooks use the `scrt_` prefix. Actions fire before/after major operations. Filters always receive the thing being filtered as the first argument and must return it.

```php
// Action
do_action( 'scrt_before_cart_drawer', $args );

// Filter — always return the value
$state = apply_filters( 'scrt_interactivity_state', $state );
```

Document new hooks with a brief comment explaining when they fire and what arguments they receive.

---

## JavaScript conventions

### Interactivity API (frontend — `src/frontend/view.js`)

The Interactivity API uses generator functions for async actions, not `async/await`. This is a hard requirement — `async/await` will not work in this context.

```js
// Correct
*removeItem() {
  const ctx = getContext();
  state.isLoading = true;
  const response = yield fetch( `${state.storeApiBase}cart/remove-item`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Nonce': state.storeApiNonce,
    },
    body: JSON.stringify({ key: ctx.item.key }),
  });
  const cart = yield response.json();
  // map cart response onto state
  state.isLoading = false;
},

// Wrong — will not work
async removeItem() {
  const response = await fetch( /* ... */ );
}
```

Other rules for `view.js`:

- Never manipulate the DOM directly. All reactivity goes through state mutations inside `store('side-cart', {})`.
- Dispatch custom DOM events for external integrations, not internal communication: `document.dispatchEvent(new CustomEvent('scrt:cart-updated', { detail: { cart } }))`.
- State lives in the `state` object. Per-item data lives in context (`getContext()`). Don't mix them up.

### React (admin — `src/admin/`)

- Use `@wordpress/components` for all UI — `TabPanel`, `ToggleControl`, `ColorPicker`, `RangeControl`, `TextControl`, `TextareaControl`, `SelectControl`, `Button`, `Notice`, `Spinner`, `Card`, `CardBody`. Don't pull in external UI libraries.
- Use `@wordpress/api-fetch` for all REST calls. It handles the WP nonce automatically.
- Don't ship React to the frontend. The Interactivity API is the frontend framework.

### i18n

Every user-facing string must be wrapped.

```php
// PHP
echo esc_html__( 'Your cart is empty.', 'side-cart' );
```

```js
// JS
import { __, _n, sprintf } from '@wordpress/i18n';
const label = __( 'Your cart is empty.', 'side-cart' );
```

Regenerate the `.pot` file after adding strings:

```bash
wp i18n make-pot . languages/side-cart.pot
```

---

## CSS conventions

Three layers, strictly separated. Never blur the boundaries between them.

| Layer | File | Loaded when | Purpose |
|---|---|---|---|
| 1 — Structural | `side-cart-structure.css` | Always | Positioning, transforms, z-index, overlay, toast stacking. No aesthetic opinions. |
| 2 — Theme | `side-cart-theme.css` | `load_plugin_stylesheet` ON | Full visual design. All values via `--scrt-*` custom properties. |
| 3 — Inline overrides | `<style id="scrt-custom-properties">` | `customize_appearance` ON | Admin-controlled `--scrt-*` overrides. Only differing properties output. |

Layer 1 properties (z-index, drawer width, transition duration) also use `--scrt-*` custom properties so even the functional layer is overridable by developers.

**Class naming:** `scrt-` prefix with BEM sub-elements.

```css
.scrt-drawer {}
.scrt-drawer__header {}
.scrt-drawer__close {}
.scrt-item {}
.scrt-item__price {}
```

**No `!important`** — except in compat mode z-index overrides, where it's unavoidable due to third-party theme conflicts.

See [docs/spec/css-custom-properties.md](./docs/spec/css-custom-properties.md) for the full variable reference.

---

## Settings

All settings are stored in a single `wp_options` row: `scrt_settings`. Never create additional rows for individual settings — it complicates migrations and adds DB queries.

The full defaults array and per-key notes are in [docs/spec/settings-schema.md](./docs/spec/settings-schema.md).

### Adding a new setting — end-to-end checklist

Touch all of these, in order:

1. **[docs/spec/settings-schema.md](./docs/spec/settings-schema.md)** — add the key, default value, and a note to the relevant section
2. **`includes/class-rest-api.php`** — add to `$defaults`; add a validation rule to the `POST /settings` schema
3. **[docs/spec/admin-tabs.md](./docs/spec/admin-tabs.md)** — add the control to the correct tab/section table
4. **`src/admin/App.jsx`** — add the React control in the correct tab
5. **`includes/class-assets.php`** (appearance settings only) — map the setting to a `--scrt-*` property in the inline override generator; compare against the default before outputting
6. **`includes/class-cart-renderer.php`** or template (if it affects frontend output) — pass through `wp_interactivity_state()` or as a template arg
7. **`src/frontend/view.js`** (if reactive) — add to state; add a computed getter if needed
8. **`languages/side-cart.pot`** — regenerate if you added translatable strings

---

## Commit style

Short imperative subject line, present tense, no period:

```
Add free shipping bar to drawer body
Fix quantity input not respecting maxQty
Refactor template loader to support child themes
```

Scope the subject to what changed — don't bundle unrelated fixes in one commit. No ticket numbers (we don't use an issue tracker yet).
