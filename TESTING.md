# Side Cart — Theme Compatibility Testing

Test the plugin against the most popular WordPress themes to verify the drawer renders correctly, styles don't conflict, and the overall experience looks polished.

---

## Themes to Test

| Theme | Notes |
|---|---|
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

---

## Checklist Per Theme

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

---

## Things to Watch For

- Themes that set `overflow: hidden` on `<body>` or `<html>` — can break scroll lock
- Themes with very high z-index stacking contexts (sticky headers at `z-index: 9999+`)
- Builder themes that inject their own modal/overlay system
- Themes with aggressive CSS resets that affect `<button>`, `<input>`, or `<dialog>`
- Themes that enqueue jQuery in the footer (may affect WC event listeners)

---

## Known Mitigations

| Issue | Mitigation |
|---|---|
| Z-index conflicts | Compatibility mode forces `--scrt-z-index: 999999` as inline style |
| `backdrop-filter` stacking context conflicts | Compatibility mode disables overlay blur |
| Body scroll lock broken | Use `overflow: hidden` on `<html>` with `scrollbar-gutter: stable` as fallback |
| jQuery loaded late | Compatibility mode defers `added_to_cart` listener to `DOMContentLoaded` |
