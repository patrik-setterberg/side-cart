# Side Cart — Settings Schema

Canonical reference for all plugin settings. Stored as a single WordPress option: `scrt_settings`.

The PHP defaults live in `class-rest-api.php` (or a dedicated `Defaults` class). The REST POST endpoint validates against this schema. The React admin app reads these keys from `GET /side-cart/v1/settings`.

---

## Full Defaults

```php
$defaults = [

  // -------------------------------------------------------------------------
  // General
  // -------------------------------------------------------------------------
  'enabled'                 => true,
  'show_floating_basket'    => true,
  'basket_position'         => 'bottom-right', // bottom-right | bottom-left
  'drawer_position'         => 'right',         // right | left
  'badge_count_mode'        => 'total',          // total (sum of quantities) | unique (distinct line items)
  'custom_trigger_selector' => '',               // CSS selector for custom trigger elements

  // -------------------------------------------------------------------------
  // Drawer Header
  // -------------------------------------------------------------------------
  'show_drawer_heading' => true,
  'drawer_heading_text' => 'Your Cart',

  // -------------------------------------------------------------------------
  // Drawer Body
  // -------------------------------------------------------------------------
  'show_free_shipping_bar'        => true,   // hidden automatically if no WC free shipping method configured
  'free_shipping_message'         => "You're {amount} away from free shipping!",
  'free_shipping_success_message' => "You've unlocked free shipping!",
  'show_empty_state_icon'         => true,
  'empty_state_message'           => 'Your cart is empty.',

  // -------------------------------------------------------------------------
  // Cart Item
  // -------------------------------------------------------------------------
  'show_item_image'     => true,
  'show_item_name'      => true,
  'show_item_sku'       => false,
  'show_item_price'     => true,
  'item_price_mode'     => 'individual',  // individual | line_total (price × quantity)
  'show_item_variation' => false,          // stacked list of variation attributes (variable products only)
  'show_item_quantity'  => true,
  'show_item_remove'    => true,

  // -------------------------------------------------------------------------
  // Cart Totals
  // -------------------------------------------------------------------------
  'show_coupon_input' => true,   // text input + apply button above totals block
  'show_cart_totals'  => true,
  'show_subtotal'     => true,
  'show_shipping'     => false,
  'show_taxes'        => false,
  'show_discounts'    => true,   // includes applied coupon codes inline when coupons are active
  'show_total'        => true,

  // -------------------------------------------------------------------------
  // Drawer Footer
  // -------------------------------------------------------------------------
  'show_empty_cart_button'  => false,
  'show_view_cart_button'   => true,
  'show_continue_shopping'  => true,
  'continue_shopping'       => 'close',  // close | shop | custom
  'show_checkout_button'    => true,

  // -------------------------------------------------------------------------
  // Appearance
  // -------------------------------------------------------------------------
  'load_plugin_stylesheet' => true,   // Layer 2: enqueue side-cart-theme.css
  'customize_appearance'   => true,   // Layer 3: output inline CSS custom property overrides

  // Colors
  'primary_color'       => '#111111',
  'primary_hover_color' => '#333333',
  'primary_text_color'  => '#ffffff',
  'drawer_bg_color'     => '#ffffff',
  'drawer_header_bg'    => '#ffffff',
  'drawer_footer_bg'    => '#ffffff',
  'text_color'          => '#1a1a1a',
  'border_color'        => '#e5e5e5',
  'overlay_color'       => 'rgba(0, 0, 0, 0.4)',

  // Layout
  'drawer_width'    => 420,  // px
  'border_radius'   => 0,    // px — applied to drawer panel
  'button_radius'   => 4,    // px
  'overlay_blur'    => 0,    // px (backdrop-filter blur; forced to 0 in compat mode)
  'shadow'          => '0 4px 24px rgba(0, 0, 0, 0.12)',

  // Typography
  'font_family' => 'inherit',
  'font_size'   => 14,  // px

  // Product images
  'item_image_size'   => 64,  // px
  'item_image_radius' => 4,   // px

  // Floating basket
  'basket_bg'     => '#111111',
  'basket_color'  => '#ffffff',
  'basket_size'   => 56,     // px
  'basket_radius' => '50%',

  // Badge
  'badge_bg'    => '#ef4444',
  'badge_color' => '#ffffff',

  // Icons & animation
  'cart_icon'        => 'bag',    // bag | cart | basket
  'drawer_animation' => 'slide',  // slide | fade | none
                                  // prefers-reduced-motion overrides to none via CSS media query

  // Toasts
  'toast_bg'    => '#111111',
  'toast_color' => '#ffffff',

  // Empty state
  'empty_state_color' => '#999999',

  // -------------------------------------------------------------------------
  // Integrations
  // -------------------------------------------------------------------------
  'auto_open'              => true,   // Open drawer on add-to-cart
  'hide_on_cart_page'      => true,
  'hide_on_checkout'       => true,
  'disabled_pages'         => [],     // array of page IDs
  'continue_shopping_url'  => '',     // custom URL used when continue_shopping = 'custom'
  'override_cart_redirect' => true,   // prevent WC "redirect to cart" when side cart is active
  'compat_mode'            => false,  // see notes below

  // -------------------------------------------------------------------------
  // Advanced
  // -------------------------------------------------------------------------
  'custom_css' => '',

  // -------------------------------------------------------------------------
  // License
  // -------------------------------------------------------------------------
  'license_key'    => '',
  'license_status' => '',  // valid | expired | inactive
];
```

---

## Notes

### `continue_shopping` behavior

| Value | Behavior |
|---|---|
| `close` | Closes the drawer (default) |
| `shop` | Navigates to the WooCommerce shop page |
| `custom` | Navigates to `continue_shopping_url` |

The custom URL input in the General tab is only shown when the value is `custom`. The actual URL is stored in the Integrations setting `continue_shopping_url`.

### `compat_mode`

When `true`:

1. Falls back to jQuery `added_to_cart` event for add-to-cart detection instead of Store API events
2. Forces `--scrt-z-index: 999999` as an inline style override
3. Disables overlay `backdrop-filter` (sets `overlay_blur` to 0 at render time, ignoring the stored value)

A yellow admin notice is shown on the Integrations tab while active: _"Compatibility mode is on. Disable it once your theme conflict is resolved."_

### `load_plugin_stylesheet` / `customize_appearance` relationship

| load_plugin_stylesheet | customize_appearance | CSS loaded |
|---|---|---|
| OFF | OFF (greyed out) | Structural CSS only |
| ON | OFF | Structural + theme CSS |
| ON | ON | Structural + theme CSS + inline `--scrt-*` overrides |

When `customize_appearance` is OFF but `load_plugin_stylesheet` is ON, the admin shows an info box pointing developers at the CSS custom property reference.

### Settings excluded from "reset to defaults"

The **Advanced tab → Reset to defaults** action resets all keys _except_:

- `license_key`
- `license_status`

Requires a confirmation dialog before executing.
