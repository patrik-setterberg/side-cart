# Monetization Notes — Deferred Decisions & Feature Ideas

> Items here are intentionally deferred. Review when approaching launch.

---

## Licensing Model (Under Consideration)

**Annual vs. lifetime:**
- Annual creates recurring revenue that funds ongoing development and support.
- Lifetime licenses are a cash advance against future work — risky unless used as a limited launch promotion.
- Recommendation (not committed): default to annual; offer lifetime as a launch promo only.

**Suggested pricing tiers (rough, not committed):**
- Single site: ~$39–49/year
- Up to 3 sites: ~$79–99/year
- Agency (unlimited sites): ~$149–199/year
- Lifetime (single site, launch promo): ~$129 (≈3× annual)

**License platform options:**
- **Freemius** — WordPress-native. Handles activation, deactivation, updates, trials, metered billing. Most popular for WP plugins. Best fit given WordPress.org distribution.
- **Lemon Squeezy** — Simpler, modern SaaS. Less WP-specific but clean API and developer experience.
- **Paddle** — Good for international sales tax handling. More complex setup.
- Decision pending. Freemius is the pragmatic default if no strong reason to choose otherwise.

---

## Additional Premium Feature Ideas (Under Consideration)

Not committed to any version. Evaluate based on demand signals after launch.

### Sticky Add-to-Cart Bar
A fixed bar at the bottom (or top) of single product pages that appears when the "Add to Cart" button scrolls out of view. Clicking it adds to cart and opens the side cart. High conversion impact — this pattern is standard in top Shopify themes (Dawn, etc.) and largely absent from WooCommerce plugins.

### FOMO / Urgency Messaging
Per-item messaging inside the drawer:
- "Only 2 left in stock" — from WooCommerce stock quantity
- "X people have this in their cart" — requires view-count logic or third-party plugin integration
Works well for impulse categories (fashion, gifts, limited editions).

### Gift Wrapping / Order Notes Field
A text field inside the drawer for gift messages or order notes. Writes to WooCommerce order meta. Simple implementation, high demand from gift-oriented stores (jewelry, candles, subscription boxes).

### Drawer Analytics Dashboard
Track drawer open rate, conversion rate (opens → checkout initiated), and revenue influenced by the drawer. Requires server-side event logging. Extremely sticky once adopted — this is a SaaS play. High implementation effort but strong retention and potential for tiered agency pricing.

### Multi-Currency Display
Ensure all prices in the drawer reflect the selected currency when a currency switcher plugin is active (WPML WooCommerce Multilingual, Currency Switcher for WooCommerce, etc.). A compatibility/integration layer rather than a standalone feature.

### WooCommerce Subscriptions Support
Display subscription billing intervals, trial information, and recurring amounts correctly in the drawer. Requires a WooCommerce Subscriptions compatibility layer. Subscriptions is one of the most-used WC extensions — proper support is a differentiator.

### Cart Recovery / Exit Intent
When a user shows exit intent (mouse leaving viewport) with items in cart, trigger a lightbox offering a discount coupon, then open the side cart. Integrates with email capture for cart abandonment flows. High complexity; potential conflict with dedicated abandonment plugins.

---

## WordPress.org Distribution Notes

- Free version distributed on WordPress.org for discoverability and reviews.
- Premium purchased via own site; license key entered in the plugin's License tab (already planned).
- WordPress.org plugin review guidelines prohibit: obfuscated code, undisclosed remote calls, license checks that break free functionality. The license check must only gate premium feature rendering.
- Maintain a single codebase with feature flags, not two separate plugin packages. Simpler to maintain and ship updates.
