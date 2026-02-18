# Side Cart — CSS Custom Properties Reference

All `--scrt-*` properties are defined on `:root` in `side-cart-theme.css` (Layer 2). They are available whenever the **"Load plugin stylesheet"** setting is ON.

Admin-controlled overrides (Layer 3) are output as an inline `<style id="scrt-custom-properties">` block via `wp_add_inline_style`. Only properties that differ from the defaults below are included in that block.

Developers can override any property in their theme stylesheet — no need to touch the admin settings.

---

## Structural properties (Layer 1 — always available)

These live in `side-cart-structure.css` and are always loaded, even when the plugin stylesheet is OFF.

```css
:root {
  --scrt-z-index:             999999;
  --scrt-drawer-width:        420px;
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

---

## Theme properties (Layer 2 — requires plugin stylesheet ON)

### Drawer

| Property | Default | Notes |
|---|---|---|
| `--scrt-drawer-bg` | `#ffffff` | Drawer panel background |
| `--scrt-drawer-color` | `#1a1a1a` | Drawer text color |
| `--scrt-drawer-header-bg` | `#ffffff` | Header section background |
| `--scrt-drawer-header-border` | `#e5e5e5` | Header bottom border color |
| `--scrt-drawer-footer-bg` | `#ffffff` | Footer section background |
| `--scrt-drawer-footer-border` | `#e5e5e5` | Footer top border color |
| `--scrt-drawer-padding` | `20px` | Horizontal padding inside the panel |

### Colors

| Property | Default | Notes |
|---|---|---|
| `--scrt-primary` | `#111111` | Primary button background, accents |
| `--scrt-primary-hover` | `#333333` | Primary button hover state |
| `--scrt-primary-text` | `#ffffff` | Text on primary buttons |
| `--scrt-border` | `#e5e5e5` | General border color |
| `--scrt-overlay-bg` | `rgba(0, 0, 0, 0.4)` | Backdrop overlay color |

### Buttons

| Property | Default | Notes |
|---|---|---|
| `--scrt-button-radius` | `4px` | Border radius on action buttons |
| `--scrt-button-padding` | `12px 24px` | Padding on action buttons |
| `--scrt-button-font-size` | `14px` | Font size on action buttons |
| `--scrt-button-font-weight` | `600` | Font weight on action buttons |

### Product items

| Property | Default | Notes |
|---|---|---|
| `--scrt-item-padding` | `16px 0` | Vertical padding between items |
| `--scrt-item-border` | `#e5e5e5` | Separator color between items |
| `--scrt-item-image-size` | `64px` | Product thumbnail width and height |
| `--scrt-item-image-radius` | `4px` | Product thumbnail border radius |
| `--scrt-item-name-font-size` | `14px` | Product name font size |
| `--scrt-item-price-font-size` | `14px` | Price font size |
| `--scrt-item-price-color` | `#666666` | Price text color |
| `--scrt-quantity-input-width` | `48px` | Width of the quantity number input |

### Floating basket

| Property | Default | Notes |
|---|---|---|
| `--scrt-basket-size` | `56px` | Basket button width and height |
| `--scrt-basket-bg` | `#111111` | Basket button background |
| `--scrt-basket-color` | `#ffffff` | Basket icon color |
| `--scrt-basket-radius` | `50%` | Basket button border radius |
| `--scrt-basket-shadow` | `0 2px 12px rgba(0, 0, 0, 0.15)` | Basket button drop shadow |

### Badge

| Property | Default | Notes |
|---|---|---|
| `--scrt-badge-bg` | `#ef4444` | Badge background (red) |
| `--scrt-badge-color` | `#ffffff` | Badge text color |
| `--scrt-badge-size` | `20px` | Badge width and height |
| `--scrt-badge-font-size` | `11px` | Badge numeral font size |

### General

| Property | Default | Notes |
|---|---|---|
| `--scrt-radius` | `0px` | Border radius on the drawer panel itself |
| `--scrt-shadow` | `0 4px 24px rgba(0, 0, 0, 0.12)` | Drawer panel drop shadow |
| `--scrt-font-family` | `inherit` | Inherits from theme by default |
| `--scrt-font-size` | `14px` | Base font size inside the drawer |

### Toasts

| Property | Default | Notes |
|---|---|---|
| `--scrt-toast-bg` | `#111111` | Toast background |
| `--scrt-toast-color` | `#ffffff` | Toast text color |
| `--scrt-toast-radius` | `6px` | Toast border radius |
| `--scrt-toast-shadow` | `0 4px 12px rgba(0, 0, 0, 0.15)` | Toast drop shadow |
| `--scrt-toast-padding` | `12px 16px` | Toast internal padding |
| `--scrt-toast-font-size` | `13px` | Toast font size |
| `--scrt-toast-success-accent` | `#22c55e` | Left border / accent color for success toasts |
| `--scrt-toast-error-accent` | `#ef4444` | Left border / accent color for error toasts |

### Empty state

| Property | Default | Notes |
|---|---|---|
| `--scrt-empty-color` | `#999999` | Empty state text and icon color |
| `--scrt-empty-icon-size` | `48px` | Empty state icon size |

---

## Example: overriding in a theme stylesheet

```css
/* No admin settings needed — just override the properties you want */
:root {
  --scrt-primary: #2563eb;
  --scrt-drawer-bg: #fafafa;
  --scrt-radius: 8px;
  --scrt-button-radius: 8px;
  --scrt-font-family: 'Inter', sans-serif;
}
```

## Example: inline output when "Customize appearance" is ON

Only differing properties are output — not the full list:

```html
<style id="scrt-custom-properties">
  :root {
    --scrt-primary: #2563eb;
    --scrt-drawer-bg: #fafafa;
    --scrt-radius: 8px;
  }
</style>
```
