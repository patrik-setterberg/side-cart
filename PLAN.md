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

A lightweight, accessible WooCommerce side-cart plugin. The frontend cart drawer is built with the **WordPress Interactivity API** (server-rendered, hydrated on the client). The admin settings page uses **React (`wp-element`)**. The cart communicates with WooCommerce via the **Store API (`wc/store/v1/cart`)**.

### What sets it apart

- **Semantic HTML & full accessibility** — `<button>` elements (not clickable `<span>`s), ARIA attributes, focus trapping, keyboard navigation, screen-reader announcements.
- **Modern defaults** — clean design out of the box with CSS custom properties for easy theming.
- **Performance** — Interactivity API is lighter than shipping a full React app to the frontend. Store API returns complete cart state in one response.
- **Extensibility** — PHP hooks/filters and JS custom events for developers. Cross-namespace Interactivity API store access.
- **High customizability** — granular admin settings for store owners; hooks and CSS custom properties for developers.

---

## Plugin Structure

```
side-cart/
│
├── side-cart.php                # Main plugin file (header, bootstrap, hooks)
├── uninstall.php                # Clean up options on uninstall
├── package.json                 # @wordpress/scripts, build config
├── webpack.config.js            # Custom entry points (admin + frontend module)
├── PLAN.md                      # This file
├── README.md                    # Plugin readme
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
│       ├── block.json           # Block metadata
│       ├── edit.js              # Block editor component
│       ├── render.php           # Server-side render (shared with shortcode)
│       └── style.css            # Block-specific styles
│
├── templates/
│   ├── cart-drawer.php          # Drawer markup (semantic HTML + directives)
│   ├── floating-basket.php      # Floating cart icon template
│   └── cart-trigger.php         # Trigger button template (used by block + shortcode)
│
├── languages/                   # .pot file for i18n
│
└── assets/
    └── icons/                   # SVG cart icons
```

---

## Implementation Phases

### Phase 1: Scaffold & Boilerplate

- [ ] Create directory structure
- [ ] Write `side-cart.php` with plugin header, constants, WooCommerce dependency check, class autoloading
- [ ] Create `package.json` with `@wordpress/scripts` and build commands
- [ ] Create `webpack.config.js` with two entry points (frontend module + admin script)
- [ ] Set up `.gitignore` (ignore `build/`, `node_modules/`)
- [ ] Create `uninstall.php` (delete `scrt_settings` option)

#### Main plugin file details

- **Constants:** `SCRT_VERSION`, `SCRT_PLUGIN_DIR`, `SCRT_PLUGIN_URL`, `SCRT_PLUGIN_FILE`
- **WooCommerce check:** on `plugins_loaded`, verify WooCommerce is active; show admin notice if missing
- **Autoloading:** `spl_autoload_register` for `SideCart\*` classes from `/includes`
- **Bootstrap:** instantiate `SideCart\Plugin` which wires all hooks

### Phase 2: Frontend — Cart Drawer (Interactivity API)

#### 2a. PHP Rendering

- [ ] `class-cart-renderer.php` — hooks into `wp_footer` to output the drawer
- [ ] `wp_interactivity_state('side-cart', [...])` — initialize state server-side with data from `WC()->cart`:
  - `items` (key, name, quantity, price, thumbnail URL, permalink, `maxQty` — see note below)
  - `totalItems` (int)
  - `subtotal` (formatted string)
  - `cartTotal` (float — raw numeric total for free shipping threshold comparison)
  - `currency` (symbol)
  - `freeShippingThreshold` (float|null — from WC free shipping method `min_amount`; null if not configured)
  - `isOpen` (false)
  - `isLoading` (false)
  - `cartUrl`, `checkoutUrl`
  - `storeApiNonce` (from WC Store API)
  - `storeApiBase` (rest_url path)
- [ ] Templates use semantic HTML with Interactivity API directives
- [ ] **`maxQty` source:** read from `item.quantity_limits.maximum` in the WC Store API cart response. WooCommerce derives this automatically from stock level, backorder settings, and per-product quantity rules. Map it directly onto each item in state. If `maximum` is `null` (no stock limit — e.g. digital products or backorders enabled), store `null` and omit the `max` attribute from the quantity input entirely.

#### 2b. Drawer Template (`templates/cart-drawer.php`)

Semantic structure:

```html
<div data-wp-interactive="side-cart" data-wp-class--scrt-open="state.isOpen">
  <!-- Overlay / backdrop -->
  <div
    class="scrt-overlay"
    data-wp-on--click="actions.close"
    data-wp-bind--hidden="!state.isOpen"
  ></div>

  <!-- Drawer panel -->
  <aside
    class="scrt-drawer"
    role="dialog"
    aria-label="<?php esc_attr_e('Shopping cart', 'side-cart'); ?>"
    aria-modal="true"
    data-wp-bind--hidden="!state.isOpen"
    data-wp-init="callbacks.initFocusTrap"
  >
    <!-- Header -->
    <header class="scrt-drawer__header">
      <h2 class="scrt-drawer__title" data-wp-text="state.headerText"></h2>
      <button
        class="scrt-drawer__close"
        aria-label="<?php esc_attr_e('Close cart', 'side-cart'); ?>"
        data-wp-on--click="actions.close"
      >
        <!-- SVG close icon -->
      </button>
    </header>

    <!-- Items list -->
    <ul class="scrt-drawer__items" aria-live="polite">
      <template data-wp-each="state.items">
        <li class="scrt-item" data-wp-key="context.item.key">
          <img
            class="scrt-item__image"
            data-wp-bind--src="context.item.thumbnail"
            data-wp-bind--alt="context.item.name"
          />
          <div class="scrt-item__details">
            <a
              class="scrt-item__name"
              data-wp-bind--href="context.item.permalink"
              data-wp-text="context.item.name"
            ></a>
            <span
              class="scrt-item__price"
              data-wp-text="context.item.price"
            ></span>
            <div class="scrt-item__quantity">
              <button
                aria-label="Decrease quantity"
                data-wp-on--click="actions.decreaseQuantity"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                data-wp-bind--max="context.item.maxQty"
                data-wp-bind--value="context.item.quantity"
                data-wp-on--change="actions.setQuantity"
                aria-label="Quantity"
              />
              <button
                aria-label="Increase quantity"
                data-wp-on--click="actions.increaseQuantity"
              >
                +
              </button>
            </div>
          </div>
          <button
            class="scrt-item__remove"
            aria-label="Remove item"
            data-wp-on--click="actions.removeItem"
          >
            <!-- SVG trash icon -->
          </button>
        </li>
      </template>
    </ul>

    <!-- Empty state -->
    <div class="scrt-drawer__empty" data-wp-bind--hidden="state.hasItems">
      <p><?php esc_html_e('Your cart is empty.', 'side-cart'); ?></p>
    </div>

    <!-- Footer -->
    <footer class="scrt-drawer__footer" data-wp-bind--hidden="!state.hasItems">
      <div class="scrt-drawer__subtotal">
        <span><?php esc_html_e('Subtotal:', 'side-cart'); ?></span>
        <span data-wp-text="state.subtotal"></span>
      </div>
      <a class="scrt-drawer__checkout" data-wp-bind--href="state.checkoutUrl">
        <?php esc_html_e('Checkout', 'side-cart'); ?>
      </a>
      <a class="scrt-drawer__view-cart" data-wp-bind--href="state.cartUrl">
        <?php esc_html_e('View Cart', 'side-cart'); ?>
      </a>
    </footer>
  </aside>
</div>
```

#### 2c. Floating Basket (`templates/floating-basket.php`)

Only rendered when `show_floating_basket` is ON. Controlled via the General settings tab.

```html
<?php if ( $args['show_floating_basket'] ) : ?>
<button
  class="scrt-basket"
  data-wp-interactive="side-cart"
  data-wp-on--click="actions.toggle"
  data-wp-bind--aria-expanded="state.isOpen"
  aria-label="<?php esc_attr_e('Open cart', 'side-cart'); ?>"
  style="--scrt-basket-bottom: 20px; --scrt-basket-right: 20px;"
>
  <!-- SVG cart icon -->
  <span
    class="scrt-basket__badge"
    data-wp-text="state.badgeCount"
    data-wp-bind--hidden="!state.hasItems"
    aria-hidden="true"
  ></span>
</button>
<?php endif; ?>
```

#### 2c-2. Cart Trigger System

Three ways for admins/developers to place cart trigger buttons anywhere on the site:

**1. Gutenberg Block (`cart-trigger/`)**

A "Side Cart Trigger" block that renders a button. Block settings:

- Button text (default: "Cart")
- Show/hide badge count
- Icon position (left / right / icon-only)
- Block-level styling (inherits theme button styles)

Registered via `class-trigger-block.php` using `register_block_type()`. The block's `render.php` uses the shared trigger template.

**2. Shortcode `[side_cart_trigger]`**

```
[side_cart_trigger text="Cart" show_badge="true" icon="bag" class="my-custom-class"]
```

Attributes:

- `text` — Button label (default: "Cart")
- `show_badge` — Show item count badge (default: true)
- `icon` — Cart icon: bag | cart | basket | none (default: bag)
- `class` — Additional CSS classes
- `id` — Custom element ID

Registered via `class-trigger-shortcode.php`. Renders the same shared trigger template.

**3. Custom CSS Selector (`custom_trigger_selector` setting)**

Admins enter a CSS selector (e.g. `.my-cart-btn, #header-cart-link`) in the General settings tab. The frontend JS attaches click listeners to all matching elements. If a matched element contains a child with class `scrt-badge` (or `data-scrt-badge`), the badge count is injected into it.

**Badge count wiring:** The trigger template uses the shared `side-cart` Interactivity API namespace (`data-wp-interactive="side-cart"`). This means any trigger rendered by the block, shortcode, or custom selector shares the same store state. The badge element binds directly to `state.badgeCount` and `state.hasItems` via `data-wp-text` and `data-wp-bind--hidden` — no separate observer or secondary initialisation needed. Multiple triggers on the same page all update simultaneously because they share the same namespace.

**Shared trigger template (`templates/cart-trigger.php`):**

```html
<button
  class="scrt-trigger <?php echo esc_attr( $args['class'] ?? '' ); ?>"
  data-wp-interactive="side-cart"
  data-wp-on--click="actions.toggle"
  data-wp-bind--aria-expanded="state.isOpen"
  aria-label="<?php esc_attr_e('Toggle cart', 'side-cart'); ?>"
>
  <?php if ( ! empty( $args['icon'] ) && $args['icon'] !== 'none' ) : ?>
  <span class="scrt-trigger__icon"
    ><?php scrt_cart_icon( $args['icon'] ); ?></span
  >
  <?php endif; ?> <?php if ( ! empty( $args['text'] ) ) : ?>
  <span class="scrt-trigger__text"
    ><?php echo esc_html( $args['text'] ); ?></span
  >
  <?php endif; ?> <?php if ( $args['show_badge'] ?? true ) : ?>
  <span
    class="scrt-trigger__badge"
    data-wp-text="state.badgeCount"
    data-wp-bind--hidden="!state.hasItems"
    aria-hidden="true"
  ></span>
  <?php endif; ?>
</button>
```

**Custom selector listener (in `view.js`):**

```js
callbacks: {
  initCustomTriggers() {
    const selector = state.customTriggerSelector;
    if ( ! selector ) return;
    document.querySelectorAll( selector ).forEach( el => {
      el.addEventListener( 'click', ( e ) => {
        e.preventDefault();
        actions.toggle();
      });
      // Inject badge into child [data-scrt-badge] or .scrt-badge if present
      const badge = el.querySelector( '[data-scrt-badge], .scrt-badge' );
      if ( badge ) {
        // Reactively update badge text via a watcher
      }
    });
  },
}
```

#### 2d. JavaScript Store (`src/frontend/view.js`)

```js
import { store, getContext, getElement } from "@wordpress/interactivity";

const { state } = store("side-cart", {
  state: {
    isOpen: false,
    isLoading: false,
    items: [],
    totalItems: 0, // sum of all quantities
    totalUniqueItems: 0, // count of distinct line items
    badgeCountMode: "total", // 'total' (quantities) | 'unique' (distinct items)
    subtotal: "",
    currency: "",
    cartUrl: "",
    checkoutUrl: "",
    storeApiNonce: "",
    storeApiBase: "",
    customTriggerSelector: "", // CSS selector from admin setting
    toasts: [], // { id, message, type: 'success'|'info'|'error', visible }
    lastError: null, // set on failed Store API calls, cleared on next successful action
    freeShippingThreshold: null, // set server-side from WC free shipping min_amount; null if no method configured

    get freeShippingRemaining() {
      if ( ! state.freeShippingThreshold ) return null;
      return Math.max( 0, state.freeShippingThreshold - parseFloat( state.cartTotal ) );
    },
    get freeShippingPercent() {
      if ( ! state.freeShippingThreshold ) return 0;
      return Math.min( 100, ( parseFloat( state.cartTotal ) / state.freeShippingThreshold ) * 100 );
    },
    appliedCoupons: [], // array of coupon code strings currently applied to the cart

    get hasItems() {
      return state.totalItems > 0;
    },
    get badgeCount() {
      return state.badgeCountMode === "unique"
        ? state.totalUniqueItems
        : state.totalItems;
    },
    get headerText() {
      return `Cart (${state.badgeCount})`;
    },
  },

  actions: {
    toggle() {
      state.isOpen = !state.isOpen;
    },
    open() {
      state.isOpen = true;
    },
    close() {
      state.isOpen = false;
    },

    *removeItem() {
      const ctx = getContext();
      state.isLoading = true;
      // POST to /wc/store/v1/cart/remove-item { key }
      // Update state from response
      state.isLoading = false;
      document.dispatchEvent(new CustomEvent("scrt:item-removed"));
    },

    *updateQuantity() {
      /* POST /wc/store/v1/cart/update-item */
      /* On success: update state, clear lastError */
      /* On stock conflict (400/409): show toast with API message, snap quantity back to
         item.quantity_limits.maximum, re-fetch cart to sync state */
      /* On network failure (fetch throws): show toast "Couldn't connect. Please try again.",
         revert quantity input to previous value */
      /* On generic API error (5xx): show toast "Something went wrong. Please refresh and try again." */
      /* Always: set lastError on failure, set isLoading = false */
    },
    *increaseQuantity() {
      /* +1 then call updateQuantity */
    },
    *decreaseQuantity() {
      /* -1 then call updateQuantity */
    },
    *refreshCart() {
      /* GET /wc/store/v1/cart, update full state */
      /* On item 404 (item key no longer valid): show toast "One item is no longer available
         and was removed from your cart.", then apply updated cart state */
    },
    *applyCoupon() {
      /* POST /wc/store/v1/cart/apply-coupon { code } */
      /* On success: refresh cart state, show success toast */
      /* On invalid coupon (400): show error toast with API message */
    },
    *removeCoupon() {
      /* POST /wc/store/v1/cart/remove-coupon { code } */
      /* On success: refresh cart state */
    },
    showToast({ message, type = "success" }) {
      /* push to state.toasts with unique id, auto-dismiss after ~3s */
    },
    dismissToast() {
      /* remove toast by id from state.toasts */
    },
  },

  callbacks: {
    initFocusTrap() {
      /* trap focus inside drawer when open */
    },
    onKeydown() {
      /* Escape key closes drawer */
    },
    watchOpen() {
      /* toggle body scroll lock, dispatch events */
    },
    autoExpireToasts() {
      /* data-wp-watch: remove toasts older than 3s */
    },
  },
});
```

**Store API interaction pattern:**

```js
const response = yield fetch(`${state.storeApiBase}cart/remove-item`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Nonce': state.storeApiNonce,
  },
  body: JSON.stringify({ key: ctx.item.key }),
});
const cart = yield response.json();
// Map cart response to state.items, state.totalItems, state.subtotal
// For each item: maxQty = item.quantity_limits.maximum ?? null
```

**WooCommerce event integration:**

```js
// Listen for WC's classic AJAX add-to-cart event
jQuery(document.body).on("added_to_cart", () => {
  store("side-cart").actions.refreshCart();
  store("side-cart").actions.open();
});
```

_(jQuery dependency only for this WC event listener; consider feature-detecting it.)_

#### 2e. Styles

Three CSS layers, progressively loaded based on the two Appearance tab toggles:

**Layer 1: Structural CSS (`side-cart-structure.css`) — always loaded**

Minimal CSS required for the drawer to _function_: positioning, transforms, visibility, overlay, z-index, toast stacking. No aesthetic opinions. Always enqueued. (~30 lines)

All structural values use CSS custom properties so developers can override even the functional layer:

```css
:root {
  --scrt-z-index: 999999;
  --scrt-drawer-width: 420px;
  --scrt-transition-duration: 300ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --scrt-transition-duration: 0ms;
  }
}

@media (max-width: 480px) {
  :root {
    --scrt-drawer-width: 100vw;
  }
}
```

**Layer 2: Theme CSS (`side-cart-theme.css`) — loaded when "Load plugin stylesheet" is ON**

The full aesthetic stylesheet: colors, spacing, typography, borders, shadows, button styles, toast appearance, responsive refinements. All values use CSS custom properties with sensible defaults:

```css
:root {
  /* Drawer */
  --scrt-drawer-bg: #ffffff;
  --scrt-drawer-color: #1a1a1a;
  --scrt-drawer-header-bg: #ffffff;
  --scrt-drawer-header-border: #e5e5e5;
  --scrt-drawer-footer-bg: #ffffff;
  --scrt-drawer-footer-border: #e5e5e5;
  --scrt-drawer-padding: 20px;

  /* Colors */
  --scrt-primary: #111111;
  --scrt-primary-hover: #333333;
  --scrt-primary-text: #ffffff;
  --scrt-border: #e5e5e5;
  --scrt-overlay-bg: rgba(0, 0, 0, 0.4);

  /* Buttons */
  --scrt-button-radius: 4px;
  --scrt-button-padding: 12px 24px;
  --scrt-button-font-size: 14px;
  --scrt-button-font-weight: 600;

  /* Product items */
  --scrt-item-padding: 16px 0;
  --scrt-item-border: #e5e5e5;
  --scrt-item-image-size: 64px;
  --scrt-item-image-radius: 4px;
  --scrt-item-name-font-size: 14px;
  --scrt-item-price-font-size: 14px;
  --scrt-item-price-color: #666666;
  --scrt-quantity-input-width: 48px;

  /* Floating basket */
  --scrt-basket-size: 56px;
  --scrt-basket-bg: #111111;
  --scrt-basket-color: #ffffff;
  --scrt-basket-radius: 50%;
  --scrt-basket-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  --scrt-badge-bg: #ef4444;
  --scrt-badge-color: #ffffff;
  --scrt-badge-size: 20px;
  --scrt-badge-font-size: 11px;

  /* General */
  --scrt-radius: 0px;
  --scrt-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  --scrt-font-family: inherit;
  --scrt-font-size: 14px;

  /* Toasts */
  --scrt-toast-bg: #111111;
  --scrt-toast-color: #ffffff;
  --scrt-toast-radius: 6px;
  --scrt-toast-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --scrt-toast-padding: 12px 16px;
  --scrt-toast-font-size: 13px;
  --scrt-toast-success-accent: #22c55e;
  --scrt-toast-error-accent: #ef4444;

  /* Empty state */
  --scrt-empty-color: #999999;
  --scrt-empty-icon-size: 48px;
}
```

Developers who want the default look but need tweaks simply override specific properties in their theme CSS. No need to touch the admin settings.

**Layer 3: Inline overrides — applied when "Customize appearance" is ON**

The admin UI controls generate an inline `<style>` block (via `wp_add_inline_style`) that sets the `--scrt-*` properties to admin-chosen values. Only properties that differ from defaults are output.

```html
<!-- Generated by class-assets.php when customize_appearance is ON -->
<style id="scrt-custom-properties">
  :root {
    --scrt-primary: #2563eb;
    --scrt-drawer-bg: #fafafa;
    --scrt-radius: 8px;
  }
</style>
```

**Summary of the three tiers:**

| Load plugin stylesheet | Customize appearance | CSS loaded                                                                                           |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| OFF                    | OFF (greyed out)     | `side-cart-structure.css` only. Developer writes all styles.                                         |
| ON                     | OFF                  | `side-cart-structure.css` + `side-cart-theme.css`. Developer overrides via CSS custom properties.    |
| ON                     | ON                   | `side-cart-structure.css` + `side-cart-theme.css` + inline `--scrt-*` overrides from admin settings. |

````

#### 2f. Toast Notifications

Lightweight toast messages shown when the cart is updated (item added, removed, quantity changed). Rendered outside the drawer so they're visible even when the drawer is closed.

```html
<div
  class="scrt-toasts"
  data-wp-interactive="side-cart"
  aria-live="assertive"
  aria-atomic="false"
>
  <template data-wp-each="state.toasts">
    <output
      class="scrt-toast"
      data-wp-class--scrt-toast--success="context.item.type === 'success'"
      data-wp-class--scrt-toast--error="context.item.type === 'error'"
      data-wp-key="context.item.id"
      role="status"
    >
      <span data-wp-text="context.item.message"></span>
      <button
        class="scrt-toast__dismiss"
        aria-label="Dismiss"
        data-wp-on--click="actions.dismissToast"
      >
        ×
      </button>
    </output>
  </template>
</div>
````

**Behavior:**

- Appear in the bottom-left or top-right corner (configurable, independent of basket position)
- Slide in, auto-dismiss after ~3 seconds
- Stacked — multiple toasts queue vertically
- `<output>` + `aria-live="assertive"` ensures screen readers announce them
- Dismissible via close button or auto-expire
- Triggered by all cart mutations: `removeItem`, `updateQuantity`, `refreshCart` (after add-to-cart)
- Respects `prefers-reduced-motion` (no animation, instant show/hide)

**Toast messages (translatable):**

- "{Product name}" added to cart
- "{Product name}" removed from cart
- Cart updated
- Error updating cart (on API failure)

### Phase 3: Asset Registration (`class-assets.php`)

- [ ] Register frontend view as **script module**: `wp_register_script_module('side-cart-view', ..., ['@wordpress/interactivity'])`
- [ ] Enqueue on frontend: `wp_enqueue_script_module('side-cart-view')`
- [ ] **Always enqueue:** `wp_enqueue_style('side-cart-structure', ...)` — structural/functional CSS
- [ ] **Conditionally enqueue** (when `load_plugin_stylesheet` is ON): `wp_enqueue_style('side-cart-theme', ...)` — aesthetic CSS
- [ ] **Conditionally output** (when `customize_appearance` is ON): `wp_add_inline_style('side-cart-theme', ...)` — admin-set CSS custom property overrides (only properties that differ from defaults)
- [ ] Conditionally load only when WooCommerce is active

### Phase 4: Admin Settings Page (React)

#### 4a. PHP Admin (`class-admin.php`)

- [ ] Register top-level menu page with `add_menu_page()`:
  - Page title: "Side Cart"
  - Menu title: "Side Cart"
  - Capability: `manage_options`
  - Slug: `side-cart`
  - Icon: `dashicons-cart`
  - Render callback outputs `<div id="scrt-admin-root"></div>`
- [ ] Enqueue React bundle only on this admin page (check `$hook`)
- [ ] Use auto-generated `.asset.php` for dependencies

#### 4b. REST API (`class-rest-api.php`)

- [ ] Namespace: `side-cart/v1`
- [ ] `GET /side-cart/v1/settings` — returns `get_option('scrt_settings', $defaults)`
- [ ] `POST /side-cart/v1/settings` — validates, sanitizes, saves to `scrt_settings`
- [ ] Permission callback: `current_user_can('manage_options')`
- [ ] Schema validation on POST (expected keys, types, allowed values)

**Default settings:**

```php
$defaults = [
  // General
  'enabled'              => true,
  'show_floating_basket' => true,
  'basket_position'      => 'bottom-right', // bottom-right | bottom-left
  'drawer_position'      => 'right',        // right | left
  'badge_count_mode'     => 'total',        // total (sum of quantities) | unique (distinct line items)
  'custom_trigger_selector' => '',          // CSS selector for custom trigger elements

  // Drawer Header
  'show_drawer_heading'  => true,
  'drawer_heading_text'  => 'Your Cart',

  // Drawer Body
  'show_free_shipping_bar'    => true,           // hidden automatically if no WC free shipping method configured
  'free_shipping_message'     => "You're {amount} away from free shipping!",
  'free_shipping_success_message' => "You've unlocked free shipping!",
  'show_empty_state_icon'  => true,
  'empty_state_message'    => 'Your cart is empty.',

  // Cart Item
  'show_item_image'      => true,
  'show_item_name'       => true,
  'show_item_sku'        => false,
  'show_item_price'      => true,
  'item_price_mode'      => 'individual',   // individual | line_total (price × quantity)
  'show_item_variation'  => false,          // stacked list of variation attributes (variable products only)
  'show_item_quantity'   => true,
  'show_item_remove'     => true,

  // Cart Totals
  'show_coupon_input'    => true,           // text input + apply button above cart totals
  'show_cart_totals'     => true,
  'show_subtotal'        => true,
  'show_shipping'        => false,
  'show_taxes'           => false,
  'show_discounts'       => true,
  'show_total'           => true,

  // Drawer Footer
  'show_empty_cart_button'  => false,
  'show_view_cart_button'   => true,
  'show_continue_shopping'  => true,
  'continue_shopping'       => 'close',     // close | shop | custom — behavior of the continue shopping button
  'show_checkout_button'    => true,

  // Appearance
  'load_plugin_stylesheet' => true,   // Layer 2: enqueue side-cart-theme.css
  'customize_appearance'   => true,   // Layer 3: output inline CSS overrides from settings below
  'show_thumbnails'        => true,
  'show_quantity'          => true,
  'primary_color'          => '#111111',
  'primary_hover_color'    => '#333333',
  'primary_text_color'     => '#ffffff',
  'drawer_width'           => 420,       // px
  'drawer_bg_color'        => '#ffffff',
  'drawer_header_bg'       => '#ffffff',
  'drawer_footer_bg'       => '#ffffff',
  'text_color'             => '#1a1a1a',
  'border_color'           => '#e5e5e5',
  'border_radius'          => 0,         // px
  'button_radius'          => 4,         // px
  'overlay_color'          => 'rgba(0, 0, 0, 0.4)',
  'overlay_blur'           => 0,         // px (backdrop-filter blur)
  'shadow'                 => '0 4px 24px rgba(0, 0, 0, 0.12)',
  'font_family'            => 'inherit',
  'font_size'              => 14,        // px
  'item_image_size'        => 64,        // px
  'item_image_radius'      => 4,         // px
  'basket_bg'              => '#111111',
  'basket_color'           => '#ffffff',
  'basket_size'            => 56,        // px
  'basket_radius'          => '50%',
  'badge_bg'               => '#ef4444',
  'badge_color'            => '#ffffff',
  'cart_icon'              => 'bag',     // bag | cart | basket
  'toast_bg'               => '#111111',
  'toast_color'            => '#ffffff',
  'empty_state_color'      => '#999999',
  'drawer_animation'       => 'slide',   // slide | fade | none — applied as data-scrt-animation attribute;
                                         // prefers-reduced-motion overrides to none via CSS media query

  // Integrations
  'auto_open'            => true,      // Open drawer on add-to-cart
  'hide_on_cart_page'    => true,
  'hide_on_checkout'     => true,
  'disabled_pages'       => [],        // array of page IDs
  'continue_shopping_url'=> '',        // custom URL used when continue_shopping = 'custom'
  'override_cart_redirect' => true,    // prevent WC "redirect to cart" when side cart is active
  'compat_mode'          => false,     // when true: (1) listen for jQuery added_to_cart event instead of
                                      // Store API events for add-to-cart detection; (2) output
                                      // --scrt-z-index: 999999 as an inline style override; (3) force
                                      // overlay blur to 0 (disables backdrop-filter to fix stacking
                                      // context conflicts). Yellow admin notice shown on Integrations tab
                                      // while active: "Compatibility mode is on. Disable it once your
                                      // theme conflict is resolved."

  // Advanced
  'custom_css'           => '',

  // License
  'license_key'          => '',
  'license_status'       => '',        // valid | expired | inactive
];
```

#### 4c. React App (`src/admin/`)

- [ ] `index.js` — `createRoot` + render `<App />`
- [ ] `App.jsx` — tabbed settings interface with 5 tabs:

  | Tab | Controls  
  | **General** | Enable/disable side cart, show/hide floating basket, basket position (bottom-right / bottom-left), drawer position (right / left), badge count mode (total / unique), custom trigger CSS selector — plus drawer header, body, item, totals, and footer sections detailed in §4c-i below |
  | **Appearance** | **"Load plugin stylesheet"** toggle (ON by default) — controls whether `side-cart-theme.css` is enqueued. **"Customize appearance"** toggle (ON by default, greyed out when stylesheet is off) — reveals all visual controls below. When stylesheet is ON but Customize is OFF, show info box: _"The default styles are active. Override them with CSS custom properties (e.g. `--scrt-primary`) in your theme stylesheet. Toggle 'Customize appearance' to use visual controls instead."_ plus a collapsible reference of all `--scrt-*` variables. **Visual controls** (shown when both toggles ON): Primary color, primary hover color, primary text color, drawer background, drawer header/footer background, text color, border color, drawer width, border radius, button radius, overlay color, overlay blur, box shadow, font family, font size, product image size + radius, basket background/color/size/radius, badge colors, cart icon selector (visual picker), toast colors, empty state color, show/hide thumbnails, show/hide quantity controls, drawer animation style (slide / fade / none — `prefers-reduced-motion` overrides to none via CSS) |
  | **Integrations** | Auto-open drawer on add-to-cart, hide on cart page, hide on checkout page, disable on specific pages (page picker), continue shopping custom URL (used when continue shopping behavior is set to "Custom URL" in General), override WC cart redirect setting, compatibility mode toggle — when on: falls back to jQuery `added_to_cart` event, forces `--scrt-z-index: 999999`, disables overlay `backdrop-filter`; yellow notice shown on tab while active |
  | **Advanced** | Custom CSS (`TextareaControl`), reset all settings to defaults button (resets everything except `license_key` and `license_status` — requires confirmation dialog before executing) |
  | **License** | License key input, activation/deactivation button, license status display (free / active / expired), link to upgrade for free users |

#### 4c-i. General Tab — Detailed Sections

##### Drawer Header
- [ ] Toggle: show/hide a heading in the drawer header (`show_drawer_heading`)
- [ ] Text input: heading text (`drawer_heading_text`, e.g. "Your Cart") — disabled/greyed out when heading toggle is off

##### Drawer Body
- [ ] Toggle: show free shipping progress bar (`show_free_shipping_bar`, default on) — hidden automatically if WooCommerce has no free shipping method configured. Threshold read server-side from WC free shipping method `min_amount`. Renders a `<progress>` element with a message above it.
  - [ ] Text input: progress message (`free_shipping_message`) — supports `{amount}` placeholder, e.g. "You're {amount} away from free shipping!"
  - [ ] Text input: success message (`free_shipping_success_message`) — shown when threshold is reached, e.g. "You've unlocked free shipping!"
- [ ] Toggle: show/hide empty state icon (`show_empty_state_icon`)
- [ ] Text input: empty state message (`empty_state_message`, e.g. "Your cart is empty.")

##### Individual Product (Cart Item)
- [ ] Toggle: show product image (`show_item_image`)
- [ ] Toggle: show product name (`show_item_name`)
- [ ] Toggle: show product SKU (`show_item_sku`)
- [ ] Toggle: show variation attributes (`show_item_variation`, default off) — for variable products only; renders a stacked `<ul class="scrt-item__variation">` beneath the product name, one `<li>` per attribute (`attribute: value`). Source: `context.item.variation[]` from Store API. Hidden automatically for simple products with no variation data.
- [ ] Toggle: show price (`show_item_price`)
  - [ ] Sub-option (select, shown when price is on): price display mode (`item_price_mode`) — "Individual price" | "Line total (price × quantity)"
- [ ] Toggle: show quantity controls — decrease button, number input, increase button (`show_item_quantity`)
- [ ] Toggle: show remove item button (`show_item_remove`)

##### Cart Totals
- [ ] Toggle: show coupon input (`show_coupon_input`, default on) — renders a text input + "Apply" button above the totals block. On apply: POST to `/wc/store/v1/cart/apply-coupon`, refresh cart state, show success or error toast. On remove: POST to `/wc/store/v1/cart/remove-coupon`. Applied coupons displayed as removable chips below the input.
- [ ] Toggle: show cart totals block (`show_cart_totals`) — collapses all sub-options when off
- [ ] Toggle: show subtotal line (`show_subtotal`)
- [ ] Toggle: show approximate shipping cost (`show_shipping`)
- [ ] Toggle: include taxes / VAT (`show_taxes`)
- [ ] Toggle: include discounts (`show_discounts`) — when on, renders a discount line sourced from `totals.total_discount`. If coupons are applied, the applied coupon codes are shown inline next to the label (e.g. "Discount (SAVE10, WELCOME): -£5.00"), pulled from `state.appliedCoupons`.
- [ ] Toggle: show total cost line (`show_total`)

##### Drawer Footer
- [ ] Toggle: show "Empty cart" button (`show_empty_cart_button`)
- [ ] Toggle: show "View cart" button — navigates to WooCommerce cart page (`show_view_cart_button`)
- [ ] Toggle: show "Continue shopping" button (`show_continue_shopping`)
  - [ ] Sub-option (select, shown when button is on): behavior (`continue_shopping`) — "Close drawer" | "Go to shop page" | "Custom URL"
  - [ ] Text input: custom URL — shown only when behavior is "Custom URL" (references `continue_shopping_url` from Integrations settings)
- [ ] Toggle: show "Proceed to checkout" button (`show_checkout_button`)

- [ ] Use `@wordpress/components`: `TabPanel`, `ToggleControl`, `ColorPicker`, `RangeControl`, `TextControl`, `TextareaControl`, `SelectControl`, `Button`, `Notice`, `Spinner`, `Card`, `CardBody`
- [ ] Use `@wordpress/api-fetch` for GET/POST to `/side-cart/v1/settings`
- [ ] Use `@wordpress/notices` for save feedback
- [ ] Dirty state tracking — `isDirty` is `true` whenever live form state diverges from the last-saved `savedSettings` ref; reset to `false` on successful save
  - [ ] In-page sticky banner: rendered via `@wordpress/components` `Notice` (warning variant) at the top of the tab when `isDirty` is `true` — "You have unsaved changes. [Save now] [Discard]"
  - [ ] `beforeunload` safety net: `window.addEventListener('beforeunload', ...)` registered while `isDirty` is `true`, removed on save or discard — triggers the browser's native "Leave site?" dialog
- [ ] Per-tab save — each tab saves independently so users don't lose context
- [ ] License tab: activation calls a separate `POST /side-cart/v1/license/activate` endpoint

### Phase 5: Theme Template Overrides (`class-template-loader.php`)

Theme developers and store owners can override any Side Cart template by copying it into their theme:

```
wp-content/themes/<theme-name>/side-cart/cart-drawer.php
wp-content/themes/<theme-name>/side-cart/floating-basket.php
```

This follows the same pattern WooCommerce uses (`yourtheme/woocommerce/*.php`).

#### Template loader implementation

- [ ] Create `scrt_get_template( $template_name, $args = [] )` helper:
  1. Look in `get_stylesheet_directory() . '/side-cart/' . $template_name` (child theme)
  2. Look in `get_template_directory() . '/side-cart/' . $template_name` (parent theme)
  3. Fall back to `SCRT_PLUGIN_DIR . 'templates/' . $template_name` (plugin default)
  4. Apply filter `scrt_locate_template` so developers can override the resolution
  5. Extract `$args` into scope and `include` the resolved path
- [ ] All template includes in the plugin go through `scrt_get_template()` — never direct `include`
- [ ] Filter `scrt_template_path` to allow changing the theme subdirectory name (default `side-cart`)
- [ ] Document the override mechanism in a `templates/README.md` for discoverability

#### Template versioning

- [ ] Define `SCRT_TEMPLATE_VERSION` constant in `side-cart.php` (e.g. `'1.0.0'`) — bump this whenever a template's markup changes in a way that would break theme overrides
- [ ] Each template file contains a version comment on line 2: `@version 1.0.0`
- [ ] In `scrt_get_template()`, after resolving a theme override path, extract the `@version` value from the file header using `get_file_data()` (the same function WordPress uses for plugin headers)
- [ ] Compare extracted version against `SCRT_TEMPLATE_VERSION` using `version_compare()`
- [ ] If the theme's version is older, register an admin notice (shown only to users with `manage_options`): _"The following Side Cart templates are outdated and may need updating: `cart-drawer.php`. [Learn how to update theme templates.]"_ — same pattern WooCommerce uses
- [ ] Only check on admin page loads to avoid frontend overhead

### Phase 6: WooCommerce Integration (`class-plugin.php`)

- [ ] Intercept WC AJAX add-to-cart: hook into `woocommerce_add_to_cart_fragments` to keep floating basket count accurate for non-JS scenarios
- [ ] Listen for WC Store API events on the client side
- [ ] Respect WC settings for cart/checkout page URLs
- [ ] Handle variable products (respect selected variation)
- [ ] Conditionally disable on cart/checkout pages (configurable)

### Phase 7: Accessibility Audit

- [ ] All interactive elements are `<button>` or `<a>`
- [ ] Focus trapped inside open drawer
- [ ] Focus returned to trigger element on close
- [ ] `Escape` key closes drawer
- [ ] `aria-live="polite"` on cart totals / items region
- [ ] `aria-expanded` on floating basket
- [ ] `aria-modal="true"` on drawer
- [ ] Visible focus indicators on all interactive elements
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text)
- [ ] Screen reader testing with VoiceOver

### Phase 8: i18n

- [ ] All PHP strings: `__()`, `_e()`, `esc_html__()`, `esc_attr__()` with text domain `side-cart`
- [ ] All JS strings: `import { __, _n, sprintf } from '@wordpress/i18n'`
- [ ] Generate `.pot` file: `wp i18n make-pot . languages/side-cart.pot`
- [ ] Set up translation loading: `load_plugin_textdomain('side-cart', ...)`

### Phase 9: Theme Compatibility Testing

Test the plugin against the ~10 most popular WordPress themes to verify that the drawer renders correctly, styles don't conflict, and the overall experience looks polished.

**Themes to test:**

| Theme | Notes |
| --- | --- |
| Storefront | WooCommerce's own theme — baseline |
| Astra | Most installed free theme; heavy customizer options |
| OceanWP | Popular multipurpose; ships its own WC extensions |
| Flatsome | Top-selling WooCommerce theme on ThemeForest |
| Divi | Builder-based; known for z-index and specificity conflicts |
| Avada | Most sold ThemeForest theme overall; Fusion Builder |
| Hello Elementor | Minimal base for Elementor sites |
| GeneratePress | Lightweight, popular among performance-focused stores |
| Kadence | Growing fast; ships its own WC blocks |
| Twenty Twenty-Five | WordPress default — good baseline for block themes |

**Checklist per theme:**

- [ ] Drawer opens and closes correctly
- [ ] Floating basket renders at correct position without being obscured
- [ ] No z-index conflicts with headers, nav, or other sticky elements
- [ ] Overlay covers the full viewport
- [ ] Drawer panel width and scrolling behave correctly
- [ ] Cart items, quantities, and totals display without layout breakage
- [ ] Checkout and View Cart buttons are visible and styled acceptably
- [ ] Focus trap works — keyboard navigation stays inside open drawer
- [ ] No JS console errors
- [ ] Structural CSS-only mode (stylesheet OFF) still functions correctly
- [ ] Theme's own cart/mini-cart doesn't conflict or double-render

**Things to watch for:**

- Themes that set `overflow: hidden` on `<body>` or `<html>` (can break scroll lock)
- Themes with very high z-index stacking contexts (sticky headers at `z-index: 9999+`)
- Builder themes that inject their own modal/overlay system
- Themes with aggressive CSS resets that affect `<button>`, `<input>`, or `<dialog>`
- Themes that enqueue jQuery in the footer (may affect WC event listeners)

---

## Build Configuration

### `package.json`

```json
{
  "name": "side-cart",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "wp-scripts build",
    "start": "wp-scripts start",
    "lint:js": "wp-scripts lint-js src/",
    "lint:css": "wp-scripts lint-style src/"
  },
  "devDependencies": {
    "@wordpress/scripts": "^30.0.0"
  }
}
```

### `webpack.config.js`

Two entry points:

1. **`frontend/view`** — built as a script module (`--experimental-modules`) for the Interactivity API
2. **`admin/index`** — built as a standard script for wp-admin React

```js
const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const path = require("path");

module.exports = [
  // Frontend (script module for Interactivity API)
  {
    ...defaultConfig,
    entry: { "frontend/view": "./src/frontend/view.js" },
    output: {
      path: path.resolve(__dirname, "build"),
      module: true,
      chunkFormat: "module",
      library: { type: "module" },
    },
    experiments: { outputModule: true },
  },
  // Admin (standard script for React)
  {
    ...defaultConfig,
    entry: { "admin/index": "./src/admin/index.js" },
    output: { path: path.resolve(__dirname, "build") },
  },
];
```

---

## Developer Extensibility

### PHP Hooks

| Hook                        | Type   | Description                                |
| --------------------------- | ------ | ------------------------------------------ |
| `scrt_before_cart_drawer`   | Action | Fires before the drawer HTML               |
| `scrt_after_cart_drawer`    | Action | Fires after the drawer HTML                |
| `scrt_before_cart_items`    | Action | Inside drawer, before items list           |
| `scrt_after_cart_items`     | Action | Inside drawer, after items list            |
| `scrt_cart_item_data`       | Filter | Modify data passed for each cart item      |
| `scrt_floating_basket_icon` | Filter | Replace the basket SVG icon                |
| `scrt_drawer_classes`       | Filter | Add CSS classes to the drawer container    |
| `scrt_settings_defaults`    | Filter | Modify default settings values             |
| `scrt_interactivity_state`  | Filter | Modify the initial Interactivity API state |

### JS Custom Events

| Event                        | Detail              | When                          |
| ---------------------------- | ------------------- | ----------------------------- |
| `scrt:cart-opened`           | —                   | Drawer opens                  |
| `scrt:cart-closed`           | —                   | Drawer closes                 |
| `scrt:cart-updated`          | `{ cart }`          | Cart state refreshed from API |
| `scrt:item-removed`          | `{ key, name }`     | Item removed                  |
| `scrt:item-quantity-changed` | `{ key, quantity }` | Quantity updated              |

### Cross-Namespace Store Access

Other Interactivity API stores can read side cart state:

```js
// From another plugin's store
store("myOtherPlugin", {
  callbacks: {
    watchCart() {
      const cartState = store("side-cart").state;
      console.log("Items in cart:", cartState.totalItems);
    },
  },
});
```

---

## Technical Decisions

| Decision           | Choice                        | Rationale                                                                           |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------- |
| Frontend framework | Interactivity API             | Lighter than React on frontend; server-rendered; progressive enhancement; native WP |
| Admin framework    | React (`wp-element`)          | Rich component library (`@wordpress/components`); standard for WP admin UIs         |
| Cart API           | WC Store API (`wc/store/v1`)  | Modern, unauthenticated, returns complete cart state, no jQuery dependency          |
| Settings storage   | Single `scrt_settings` option | Simpler migration, single DB query, atomic updates                                  |
| Admin menu         | Top-level page                | Per requirement — not nested under WooCommerce                                      |
| CSS approach       | CSS custom properties         | Themeable by developers, overridable from admin settings via inline styles          |
| Prefix             | `scrt_`                       | Short, unique, avoids collision                                                     |

---

## Future Enhancements (Post-MVP)

These are possibly planned but **not in the initial build**:

- [ ] **Related products / cross-sells** — product recommendations inside the drawer (MAYBE, PROBABLY NOT)
- [ ] **Shipping calculator** — inline shipping estimate
- [ ] **Save for later** — move items to a wishlist (MAYBE)
- [ ] **Express checkout buttons** — Apple Pay, Google Pay, PayPal via WC payment request API
- [ ] **Animation presets** — slide, fade, scale entrance options
- [ ] **Multiple cart icon options** — admin choosable from a set
- [ ] **Per-page enable/disable rules** — granular page/post type targeting
- [ ] **WP Customizer integration** — live preview of style changes
