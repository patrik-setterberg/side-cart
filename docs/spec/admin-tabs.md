# Side Cart — Admin Settings UI Spec

Detailed breakdown of every tab and control in the React admin app (`src/admin/`).

The admin page is a top-level WordPress menu entry ("Side Cart", `dashicons-cart`). It uses `@wordpress/components` throughout — `TabPanel`, `ToggleControl`, `ColorPicker`, `RangeControl`, `TextControl`, `TextareaControl`, `SelectControl`, `Button`, `Notice`, `Spinner`, `Card`, `CardBody`.

Settings are fetched via `GET /side-cart/v1/settings` and saved via `POST /side-cart/v1/settings` using `@wordpress/api-fetch`. Save feedback uses `@wordpress/notices`.

See [settings-schema.md](./settings-schema.md) for the full list of keys and defaults.

---

## Shared UX Behaviour

### Dirty state

- `isDirty` is `true` whenever the live form state diverges from the last-saved `savedSettings` ref.
- Reset to `false` on successful save or explicit discard.
- **In-page sticky banner:** `Notice` (warning variant) at the top of the active tab when `isDirty` is `true` — _"You have unsaved changes. [Save now] [Discard]"_
- **`beforeunload` safety net:** `window.addEventListener('beforeunload', ...)` registered while `isDirty` is `true`, removed on save or discard — triggers the browser's native "Leave site?" dialog.

### Per-tab save

Each tab saves independently. Switching tabs with unsaved changes triggers the in-page banner, not a blocking dialog.

---

## Tab: General

Controls the core drawer behaviour and all content visibility toggles.

### Section: Global

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Enable side cart | Toggle | `enabled` | Master switch; disabling hides all frontend output |
| Show floating basket | Toggle | `show_floating_basket` | |
| Basket position | Select | `basket_position` | bottom-right / bottom-left |
| Drawer position | Select | `drawer_position` | right / left |
| Badge count mode | Select | `badge_count_mode` | "Total quantity" / "Unique items" |
| Custom trigger CSS selector | Text | `custom_trigger_selector` | e.g. `.my-cart-btn, #header-cart` |

### Section: Drawer Header

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Show drawer heading | Toggle | `show_drawer_heading` | |
| Heading text | Text | `drawer_heading_text` | Greyed out when heading toggle is OFF |

### Section: Drawer Body

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Show free shipping bar | Toggle | `show_free_shipping_bar` | Hidden automatically if no WC free shipping method is configured. Threshold read server-side from WC free shipping `min_amount`. |
| Progress message | Text | `free_shipping_message` | Supports `{amount}` placeholder. Shown when threshold not yet reached. |
| Success message | Text | `free_shipping_success_message` | Shown when threshold is reached |
| Show empty state icon | Toggle | `show_empty_state_icon` | |
| Empty state message | Text | `empty_state_message` | |

### Section: Cart Item

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Show product image | Toggle | `show_item_image` | |
| Show product name | Toggle | `show_item_name` | |
| Show product SKU | Toggle | `show_item_sku` | |
| Show variation attributes | Toggle | `show_item_variation` | Variable products only; renders a stacked `<ul>` of attribute: value pairs |
| Show price | Toggle | `show_item_price` | |
| Price display mode | Select | `item_price_mode` | "Individual price" / "Line total (price × quantity)". Only shown when price toggle is ON. |
| Show quantity controls | Toggle | `show_item_quantity` | Decrease button + number input + increase button |
| Show remove button | Toggle | `show_item_remove` | |

### Section: Cart Totals

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Show coupon input | Toggle | `show_coupon_input` | Text input + "Apply" button above totals. Applied coupons shown as removable chips. |
| Show cart totals block | Toggle | `show_cart_totals` | Collapses all sub-options below when OFF |
| Show subtotal | Toggle | `show_subtotal` | |
| Show shipping | Toggle | `show_shipping` | Approximate shipping cost |
| Show taxes | Toggle | `show_taxes` | |
| Show discounts | Toggle | `show_discounts` | When ON with active coupons, renders coupon codes inline next to the label |
| Show total | Toggle | `show_total` | |

### Section: Drawer Footer

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Show "Empty cart" button | Toggle | `show_empty_cart_button` | |
| Show "View cart" button | Toggle | `show_view_cart_button` | Navigates to WC cart page |
| Show "Continue shopping" button | Toggle | `show_continue_shopping` | |
| Continue shopping behavior | Select | `continue_shopping` | "Close drawer" / "Go to shop page" / "Custom URL". Only shown when button is ON. |
| Custom URL | Text | `continue_shopping_url` | Only shown when behavior is "Custom URL" (stored under Integrations key) |
| Show "Proceed to checkout" button | Toggle | `show_checkout_button` | |

---

## Tab: Appearance

Controls the visual layer. Has two top-level toggles that gate further controls.

### Top-level toggles

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Load plugin stylesheet | Toggle | `load_plugin_stylesheet` | Enqueues `side-cart-theme.css`. When OFF, "Customize appearance" is greyed out. |
| Customize appearance | Toggle | `customize_appearance` | Reveals visual controls below. Greyed out when stylesheet is OFF. |

**When stylesheet is ON but Customize is OFF:** Show an info box —
_"The default styles are active. Override them with CSS custom properties (e.g. `--scrt-primary`) in your theme stylesheet. Toggle 'Customize appearance' to use visual controls instead."_ — with a collapsible reference of all `--scrt-*` variables (link to [css-custom-properties.md](./css-custom-properties.md)).

### Visual controls (shown when both toggles are ON)

#### Colors

| Control | Type | Setting key |
|---|---|---|
| Primary color | ColorPicker | `primary_color` |
| Primary hover color | ColorPicker | `primary_hover_color` |
| Primary text color | ColorPicker | `primary_text_color` |
| Drawer background | ColorPicker | `drawer_bg_color` |
| Drawer header background | ColorPicker | `drawer_header_bg` |
| Drawer footer background | ColorPicker | `drawer_footer_bg` |
| Text color | ColorPicker | `text_color` |
| Border color | ColorPicker | `border_color` |
| Overlay color | ColorPicker | `overlay_color` |

#### Layout

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Drawer width | RangeControl (px) | `drawer_width` | |
| Border radius | RangeControl (px) | `border_radius` | Drawer panel corners |
| Button radius | RangeControl (px) | `button_radius` | Action buttons |
| Overlay blur | RangeControl (px) | `overlay_blur` | `backdrop-filter` blur; forced to 0 in compat mode |
| Box shadow | Text | `shadow` | CSS shadow value |

#### Typography

| Control | Type | Setting key |
|---|---|---|
| Font family | Text | `font_family` |
| Font size | RangeControl (px) | `font_size` |

#### Product images

| Control | Type | Setting key |
|---|---|---|
| Image size | RangeControl (px) | `item_image_size` |
| Image border radius | RangeControl (px) | `item_image_radius` |

#### Floating basket

| Control | Type | Setting key |
|---|---|---|
| Background color | ColorPicker | `basket_bg` |
| Icon color | ColorPicker | `basket_color` |
| Size | RangeControl (px) | `basket_size` |
| Border radius | Text | `basket_radius` |

#### Badge

| Control | Type | Setting key |
|---|---|---|
| Background color | ColorPicker | `badge_bg` |
| Text color | ColorPicker | `badge_color` |

#### Icons & animation

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Cart icon | Visual picker | `cart_icon` | bag / cart / basket — show actual SVG previews |
| Drawer animation | Select | `drawer_animation` | slide / fade / none. `prefers-reduced-motion` overrides to none via CSS regardless of this setting. |

#### Toasts

| Control | Type | Setting key |
|---|---|---|
| Toast background | ColorPicker | `toast_bg` |
| Toast text color | ColorPicker | `toast_color` |

#### Empty state

| Control | Type | Setting key |
|---|---|---|
| Empty state color | ColorPicker | `empty_state_color` |

---

## Tab: Integrations

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Auto-open on add-to-cart | Toggle | `auto_open` | |
| Hide on cart page | Toggle | `hide_on_cart_page` | |
| Hide on checkout page | Toggle | `hide_on_checkout` | |
| Disable on specific pages | Page picker | `disabled_pages` | Array of page IDs |
| Override WC cart redirect | Toggle | `override_cart_redirect` | Prevents WC "redirect to cart" when side cart is active |
| Compatibility mode | Toggle | `compat_mode` | When ON: uses jQuery `added_to_cart` event, forces `--scrt-z-index: 999999`, disables `backdrop-filter`. Yellow `Notice` shown on this tab while active: _"Compatibility mode is on. Disable it once your theme conflict is resolved."_ |

---

## Tab: Advanced

| Control | Type | Setting key | Notes |
|---|---|---|---|
| Custom CSS | TextareaControl | `custom_css` | Output in a `<style>` tag on the frontend |
| Reset to defaults | Button | — | Resets all settings except `license_key` and `license_status`. Requires a confirmation dialog before executing. |

---

## Tab: License

| Control | Type | Setting key | Notes |
|---|---|---|---|
| License key | Text | `license_key` | |
| Activate / Deactivate | Button | — | Calls `POST /side-cart/v1/license/activate` or `/deactivate` |
| License status | Display | `license_status` | free / active / expired |
| Upgrade link | Link | — | Shown for free users |
