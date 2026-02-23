# Side Cart — Free vs. Premium Feature Split

## Core Principle

The free version must be genuinely useful — functional enough to earn installs, reviews, and trust on the WordPress.org directory. Premium gates should feel like a natural upgrade for store owners who are serious about their business, not like the free version was deliberately crippled.

Good premium gates are features that:

- Directly increase **revenue** for the store owner (AOV lifts, conversion rate)
- Require ongoing **infrastructure** from you (license checks, SaaS-adjacent features)
- Are valued by **professional/agency** users, not just hobbyists
- Would be painful to lose once adopted (stickiness)

---

## Free — Core Cart Drawer Experience

Everything a store needs to have a working, attractive side cart.

**Core drawer functionality**

- Cart drawer (open/close, overlay, escape key)
- Full item list: thumbnail, name, variation, quantity controls, remove button
- Subtotal display
- Checkout button
- Empty cart state

**Triggers**

- Floating basket button (all positions)
- Gutenberg block trigger
- Shortcode trigger

**Basic appearance (free subset)**

- Drawer position (left/right)
- Cart icon selection (bag/cart/basket)
- Primary color (single color control)
- Load plugin stylesheet toggle
- Open/close animation style

**Integrations**

- Auto-open on add-to-cart
- Hide on cart/checkout pages
- WooCommerce variable product support

**Accessibility & i18n**

- Full WCAG 2.1 AA compliance
- Translation-ready (.pot file)

**Developer features**

- CSS custom properties (`--scrt-*`) for theming without admin UI
- PHP hooks and filters
- JS custom events
- Template override system
- Custom CSS textarea (Advanced tab)

---

## Premium — Revenue & Conversion Features

### Conversion Boosters (v1 launch — all included)

**Free Shipping Progress Bar**

- Visual progress bar showing how close the customer is to the free shipping threshold
- "Add $X more to get free shipping!" messaging
- Customizable messages (before / after threshold reached)
- _Why premium:_ Directly increases Average Order Value. #1 most-requested feature in competing plugins.

**Coupon Code Input**

- Inline coupon field with Apply button inside the drawer
- Applied coupons shown as removable chips with discount amount
- _Why premium:_ Keeps shoppers in the cart flow instead of leaving to find a coupon code. Reduces abandonment.

**Cross-Sells / Related Products**

- Show 1–3 product recommendations inside the drawer (configurable count)
- Data source: WooCommerce cross-sell product relationship (set per-product in WC admin)
- Optional carousel or list layout
- _Why premium:_ Directly increases cart size. Classic upsell opportunity.

**Reward Tiers / Spend Milestones**

- Configurable thresholds: "Spend $50 → free shipping", "Spend $75 → free gift", "Spend $100 → 10% off"
- Progress bar per milestone; unlocked state shows a message
- _Why premium:_ Gamification of checkout. Measurable AOV lift.

**Sale Badge / Discount Percentage Display**

- Display "XX% off" badge next to product prices for items on sale
- Configurable badge style: inline text, pill badge, or corner ribbon
- Optional text customization (e.g., "Save XX%", "XX% OFF", "-XX%")
- Color and typography controls in visual customizer
- _Why premium:_ Highlights value proposition, creates urgency, increases perceived savings. Strong conversion signal.

**Abandoned Cart Recovery**

- Email capture field in the side cart drawer ("Save your cart" / "Email me my cart")
- Automatic detection of abandoned carts (configurable inactivity threshold, e.g., 30+ minutes)
- Automated email sequence: 1-3 recovery emails at configurable intervals (1hr, 24hr, 48hr)
- Email templates showing cart contents with product images and direct restoration links
- Secure cart restoration via tokenized URLs (one-click return to cart)
- Optional discount code incentives in recovery emails
- Admin panel: timing configuration, email template customization, enable/disable
- GDPR-compliant: explicit consent, unsubscribe links, auto-deletion after retention period
- Analytics: track recovery rate and revenue recovered
- _Why premium:_ Requires infrastructure (database, WP-Cron, email delivery). Industry average 10-15% cart recovery rate = direct measurable revenue. Extremely sticky — store owners won't give up recovered sales. Major competitive differentiator.

### Appearance & Customization (v1 launch)

**Full Visual Customizer (Admin UI)**

- Free users get: drawer position, cart icon, choice of 2-3 preset color themes
- Premium unlocks the full customizer:
  - Colors: primary, primary hover, primary text, drawer bg, header/footer bg, text, border, overlay
  - Layout: drawer width, border radius, button radius, overlay blur, shadow
  - Typography: font family, font size
  - Product images: size, border radius
  - Floating basket: background color, icon color, size, border radius
  - Badge: color, text color
  - Toasts: background, text color
  - Empty state: color
- _Why premium:_ Developers can theme via CSS custom properties for free. The admin GUI is the convenience layer for non-technical store owners. Preset themes in free version ensure good aesthetics while creating clear upgrade path.

**Custom CSS Selector Triggers**

- Attach the cart to any element via a CSS selector
- Inject badge count into custom trigger elements
- _Why premium:_ Power-user/agency feature. Low casual-user demand.

### Advanced UX & Conversion (post-v1)

**Express Checkout Buttons**

- Apple Pay, Google Pay, PayPal Express buttons inside the drawer
- One-click checkout for authenticated payment methods
- Integrates with WooCommerce payment gateway APIs
- _Why premium:_ Massive conversion booster (reduces checkout friction significantly). Highly valued by agencies and professional stores. Complex integration justifies premium pricing.

**Inline Shipping Calculator**

- Country/state/postcode selector inside the drawer
- Live shipping estimate before checkout
- _Why premium:_ Reduces checkout abandonment from shipping cost anxiety.

**Per-Page / Per-Product Rules**

- Disable drawer on specific pages
- Disable for specific product categories
- _Why premium:_ Edge case valued by agencies managing complex stores.

**Countdown Timers & Urgency Triggers**

- Configurable countdown timer in cart drawer ("Complete checkout in X minutes")
- Stock scarcity indicators ("Only 3 left in stock!")
- Limited-time offer banners in drawer
- _Why premium:_ Psychological urgency triggers demonstrably increase conversion rates. Professional feature for marketing-focused stores.

**Analytics & Reporting Dashboard**

- Cart abandonment rate tracking
- Conversion metrics (cart-to-checkout rate)
- Revenue recovered from abandoned cart emails
- A/B testing results for different cart configurations
- Top abandoned products
- _Why premium:_ Requires data infrastructure. Shows measurable ROI from the plugin, creating extreme stickiness. Valued by data-driven store owners.

**Save for Later / Wishlist** _(under consideration)_

- Move item out of cart into a saved list
- Requires user account or cookie storage strategy

---

## Gating UX in the Admin

For locked premium settings: show them greyed out with a lock icon and "Upgrade to unlock" — **do not hide them**. Seeing what you're missing converts better than hiding it.

The Appearance tab needs deliberate design from the start: some controls render ungated (the free subset), others render locked. Build this split in from the beginning rather than retrofitting it.

---

## Summary Table

| Feature                                      | Free | Premium   |
| -------------------------------------------- | ---- | --------- |
| Core cart drawer                             | ✓    | —         |
| Checkout button                              | ✓    | —         |
| Floating basket trigger                      | ✓    | —         |
| Gutenberg block trigger                      | ✓    | —         |
| Shortcode trigger                            | ✓    | —         |
| Drawer position (left/right)                 | ✓    | —         |
| Cart icon selection                          | ✓    | —         |
| Preset color themes (2-3 options)            | ✓    | —         |
| Auto-open on add-to-cart                     | ✓    | —         |
| Variable product support                     | ✓    | —         |
| Accessibility (WCAG 2.1 AA)                  | ✓    | —         |
| i18n / translation ready                     | ✓    | —         |
| CSS custom properties theming                | ✓    | —         |
| PHP hooks/filters                            | ✓    | —         |
| JS custom events                             | ✓    | —         |
| Template overrides                           | ✓    | —         |
| Custom CSS textarea                          | ✓    | —         |
| **Free shipping progress bar**               | —    | ✓ v1      |
| **Coupon code input**                        | —    | ✓ v1      |
| **Cross-sells / related products**           | —    | ✓ v1      |
| **Reward tiers / spend milestones**          | —    | ✓ v1      |
| **Sale badge / discount % display**          | —    | ✓ v1      |
| **Abandoned cart recovery (email)**          | —    | ✓ v1      |
| **Full visual customizer (color/layout UI)** | —    | ✓ v1      |
| **Custom CSS selector triggers**             | —    | ✓ v1      |
| **Express checkout buttons**                 | —    | ✓ post-v1 |
| **Countdown timers & urgency triggers**      | —    | ✓ post-v1 |
| **Analytics & reporting dashboard**          | —    | ✓ post-v1 |
| **Inline shipping calculator**               | —    | ✓ post-v1 |
| **Per-page / per-product rules**             | —    | ✓ post-v1 |
| **Save for later / wishlist**                | —    | maybe     |

---

## Implementation Note

Premium feature code can be written unconditionally in a single codebase. The license check gates rendering only — it does not break free functionality. This is required for WordPress.org distribution compliance. Decide on the license check architecture before implementing any premium features.
