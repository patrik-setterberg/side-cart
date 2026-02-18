# Side Cart — Claude Session Context

Quick-start reference for AI-assisted development sessions. For full coding conventions, see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## What this plugin is

A paid WooCommerce side cart plugin.

- **Frontend drawer:** WordPress Interactivity API (server-rendered, client-hydrated)
- **Admin settings:** React (`wp-element`)
- **Cart data:** WooCommerce Store API (`wc/store/v1`)
- **Requirements:** WordPress 6.5+, WooCommerce active

---

## Key identifiers

| Thing | Value |
|---|---|
| PHP namespace | `SideCart` |
| Hook/option/constant prefix | `scrt_` |
| Text domain | `side-cart` |
| Settings option | `scrt_settings` (single row) |
| Interactivity API namespace | `side-cart` |
| REST namespace | `side-cart/v1` |

---

## Key files

| File | Role |
|---|---|
| `side-cart.php` | Plugin header, constants, dependency check, autoloader, bootstrap |
| `includes/class-plugin.php` | Singleton; wires all hooks |
| `includes/class-cart-renderer.php` | Renders drawer HTML; initialises Interactivity API state |
| `includes/class-assets.php` | Script module + style registration and enqueueing |
| `includes/class-admin.php` | Admin menu page; enqueues React bundle |
| `includes/class-rest-api.php` | `side-cart/v1` REST endpoints for settings |
| `includes/class-template-loader.php` | Template resolution (child theme → parent → plugin) |
| `src/frontend/view.js` | Interactivity API store — all cart state and actions |
| `src/admin/App.jsx` | React settings UI root |
| `templates/cart-drawer.php` | Drawer markup with `data-wp-*` directives |
| `templates/floating-basket.php` | Floating basket button |
| `templates/cart-trigger.php` | Shared trigger button (block + shortcode) |

---

## Reference docs

| Doc | Contents |
|---|---|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Canonical coding conventions — read this first |
| [docs/spec/settings-schema.md](../docs/spec/settings-schema.md) | Full `$defaults` settings array |
| [docs/spec/admin-tabs.md](../docs/spec/admin-tabs.md) | Per-tab admin UI control detail |
| [docs/spec/css-custom-properties.md](../docs/spec/css-custom-properties.md) | All `--scrt-*` CSS variables |
| [TESTING.md](../TESTING.md) | Theme compatibility testing matrix |
| [DECISIONS.md](../DECISIONS.md) | Architectural decision log |
| [PLAN.md](../PLAN.md) | Phase checklist |

---

## Patterns to copy-paste

### Interactivity API async action

```js
*removeItem() {
  const ctx = getContext();
  state.isLoading = true;
  const response = yield fetch( `${state.storeApiBase}cart/remove-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Nonce': state.storeApiNonce },
    body: JSON.stringify({ key: ctx.item.key }),
  });
  const cart = yield response.json();
  // map cart → state
  state.isLoading = false;
}
```

Use `yield`, not `async/await`. The Interactivity API requires generator functions.

### Template rendering (PHP)

```php
scrt_get_template( 'cart-drawer.php', $args );
```

Never `include` templates directly — always through `scrt_get_template()`.

### Inline CSS override generation

```php
$overrides = [];
if ( $settings['primary_color'] !== '#111111' ) {
  $overrides[] = '--scrt-primary: ' . sanitize_hex_color( $settings['primary_color'] ) . ';';
}
if ( ! empty( $overrides ) ) {
  wp_add_inline_style( 'side-cart-theme', ':root { ' . implode( ' ', $overrides ) . ' }' );
}
```

Only output properties that differ from defaults — never the full list.

---

## Things to avoid

- `async/await` in `view.js` — use generator functions with `yield`
- React on the frontend — Interactivity API only
- `!important` in theme CSS — only acceptable for z-index compat mode fixes
- Direct `include` of templates — use `scrt_get_template()`
- Multiple `wp_options` rows — everything goes in `scrt_settings`
- Escaping input at save time — sanitize on save, escape on output
