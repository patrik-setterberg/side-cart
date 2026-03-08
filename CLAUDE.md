# Side Cart — CLAUDE.md

WooCommerce side cart drawer plugin. Frontend uses the **WordPress Interactivity API** (server-rendered, client-hydrated). Admin uses **React (`wp-element`)**. Cart data from the **WooCommerce Store API (`wc/store/v1`)**. Requires WordPress 6.5+ and WooCommerce.

## Key identifiers

| Thing | Value |
|---|---|
| PHP namespace | `SideCart` |
| Hook / option / constant prefix | `scrt_` / `scrt_` / `SCRT_` |
| CSS class prefix | `scrt-` (BEM sub-elements: `scrt-drawer__header`) |
| Interactivity API namespace | `side-cart` |
| REST namespace | `side-cart/v1` |
| Settings option key | `scrt_settings` (single `wp_options` row) |
| Text domain | `side-cart` |
| JS custom events | `scrt:` prefix (e.g. `scrt:cart-updated`) |

## Build

```bash
npm run build    # production
npm run start    # watch mode
npm run lint:js
npm run lint:css
```

Output goes to `build/` (gitignored). Three webpack configs: frontend (ES module), admin (React), blocks. The `.asset.php` files in `build/` are auto-generated — never edit them manually.

## Key files

| File | Role |
|---|---|
| `side-cart.php` | Plugin header, constants, autoloader bootstrap |
| `includes/class-plugin.php` | Singleton; wires all hooks |
| `includes/class-cart-renderer.php` | Renders drawer HTML; initialises Interactivity API state |
| `includes/class-assets.php` | Script + style registration, inline CSS var overrides |
| `includes/class-admin.php` | Admin menu page; enqueues React bundle |
| `includes/class-rest-api.php` | `GET/POST side-cart/v1/settings`; all defaults here |
| `includes/class-template-loader.php` | Template resolution (child theme → parent → plugin) |
| `includes/helpers.php` | SVG icon functions, `scrt_get_template()` wrapper |
| `src/frontend/view.js` | Interactivity API store — all cart state and actions |
| `src/admin/App.jsx` | React settings root (5 tabs) |
| `src/admin/DrawerPreview.jsx` | Live preview component shown on General & Appearance tabs |
| `templates/cart-drawer.php` | Drawer markup with `data-wp-*` directives |
| `templates/cart-trigger.php` | Shared trigger button (block + shortcode) |

## Critical patterns

### Interactivity API — use `yield`, never `async/await`

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
  state.isLoading = false;
},
```

- `async/await` **does not work** in Interactivity API actions.
- Never manipulate the DOM directly — mutate state only.
- Per-item data lives in `getContext()`, not `state`.

### Template rendering

```php
scrt_get_template( 'cart-drawer.php', $args );  // Good
include SCRT_PLUGIN_DIR . 'templates/cart-drawer.php';  // Bad
```

The `$args` array is extracted into template scope as flat variables.

### Inline CSS overrides

```php
$overrides = [];
if ( $settings['primary_color'] !== '#111111' ) {
    $overrides[] = '--scrt-primary: ' . sanitize_hex_color( $settings['primary_color'] ) . ';';
}
if ( ! empty( $overrides ) ) {
    wp_add_inline_style( 'side-cart-theme', ':root { ' . implode( ' ', $overrides ) . ' }' );
}
```

Only output properties that differ from defaults.

### PHP escaping / sanitization

- **Sanitize on save**, **escape at output** — never the reverse.
- Contexts: `esc_html()`, `esc_attr()`, `esc_url()`, `wp_json_encode()`, `$wpdb->prepare()`.
- Sanitizers: `sanitize_text_field()`, `sanitize_hex_color()`, `absint()`, `rest_sanitize_boolean()`.

### Admin React

- UI: `@wordpress/components` only (`TabPanel`, `ToggleControl`, `ColorPicker`, `RangeControl`, etc.).
- REST calls: `@wordpress/api-fetch` (handles WP nonce automatically).
- Never ship React to the frontend — Interactivity API only there.

### Icons

SVG helpers in `includes/helpers.php`: `scrt_get_cart_icon_svg()`, `scrt_get_remove_icon_svg()`, `scrt_get_quantity_icon_svg()`, `scrt_get_toast_icon_svg()`. React components use `lucide-react` directly.

## Adding a new setting — checklist

Touch all of these in order:

1. `docs/spec/settings-schema.md` — document the key and default
2. `includes/class-rest-api.php` — add to `get_defaults()`; add validation rule to POST schema
3. `docs/spec/admin-tabs.md` — add control to the correct tab table
4. `src/admin/App.jsx` — add React control in the correct tab
5. `includes/class-assets.php` *(appearance only)* — map to `--scrt-*` var; compare vs default before outputting
6. `includes/class-cart-renderer.php` / template *(if it affects frontend output)*
7. `src/frontend/view.js` *(if reactive)* — add to state / computed getters
8. Regenerate `.pot` if translatable strings were added

## Things to avoid

- `async/await` in `view.js` — generator functions with `yield` only
- React on the frontend — Interactivity API only
- `!important` in CSS — only acceptable for z-index compat mode fixes
- Direct `include` of templates — always use `scrt_get_template()`
- Multiple `wp_options` rows — everything goes in `scrt_settings`
- Escaping at save time — sanitize on save, escape on output

## Reference docs

- [CONTRIBUTING.md](CONTRIBUTING.md) — full coding conventions (canonical)
- [docs/spec/settings-schema.md](docs/spec/settings-schema.md) — full `$defaults` array
- [docs/spec/admin-tabs.md](docs/spec/admin-tabs.md) — per-tab admin UI detail
- [docs/spec/css-custom-properties.md](docs/spec/css-custom-properties.md) — all `--scrt-*` CSS vars
- [DECISIONS.md](DECISIONS.md) — architectural decision log
- [PLAN.md](PLAN.md) — implementation phase checklist
