# Licensing Platform Options

## Quick Comparison

### Freemius (Recommended)
- **Type**: Managed SaaS, WordPress-native
- **Cost**: 7% revenue-share after $5k (27% first $1k, 17% $1k-$5k)
- **Setup**: 5-minute SDK integration
- **Best for**: WordPress.org distribution, plugin developers

### Appsero
- **Type**: Managed SaaS, WordPress-native
- **Cost**: Similar revenue-share to Freemius
- **Setup**: Quick integration
- **Best for**: Analytics-focused developers

### WC Key Manager
- **Type**: WooCommerce plugin
- **Cost**: One-time purchase
- **Setup**: Moderate (requires WooCommerce)
- **Best for**: Existing WooCommerce stores

### Easy Digital Downloads (EDD)
- **Type**: Self-hosted
- **Cost**: $299/year minimum (licensing + subscriptions extensions)
- **Setup**: Complex (multiple extensions needed)
- **Best for**: Full control, high customization needs

### WooCommerce + Extensions
- **Type**: Self-hosted
- **Cost**: $199+/year (Subscriptions + license plugins)
- **Setup**: Most complex
- **Best for**: Deep WooCommerce integration needs

### Lemon Squeezy
- **Type**: Managed SaaS
- **Cost**: ~5-7% + payment processing
- **Setup**: Simple, modern API
- **Best for**: Non-WordPress products, clean developer experience

### Paddle
- **Type**: Managed SaaS, merchant of record
- **Cost**: ~5% + payment processing
- **Setup**: Complex
- **Best for**: International sales, tax compliance priority

---

## Why Freemius is the Strongest Choice

### 1. WordPress.org Compliance Built-In
Freemius is purpose-built for WordPress.org plugin guidelines. It understands how to gate premium features without breaking free functionality - critical for our free/premium model. The platform knows the rules because it's designed specifically for this use case.

### 2. Single Codebase Support
Supports our plan to maintain one codebase with feature flags rather than two separate plugin packages. The SDK lets us wrap premium features in simple conditionals:
```php
if ( fs_is_premium() ) {
    // Premium feature code
}
```

### 3. Zero License Management Code
Freemius handles everything automatically:
- Generates unique license keys on purchase
- Emails keys securely to customers
- Validates license activation/deactivation
- Manages multi-site licensing
- Syncs licensing with billing
- Delivers automatic updates to licensed users

We write zero license key generation or validation logic.

### 4. Built-In Renewal System
Perfect for our $39/year annual model:
- Automatic recurring billing
- Renewal reminder emails sent 30 days before expiration
- Dunning mechanism for failed payments (automated recovery emails)
- Manual renewal email trigger available in dashboard
- Canceled subscription email campaigns before license expiry

The 14-day reminder you mentioned? Freemius does 30 days automatically, which is even better for customer experience.

### 5. Cost-Effective at Our Scale
At $39/year pricing with 7% revenue-share (after $5k lifetime sales):
- Cost per sale: $2.73
- Includes: licensing, updates, renewals, email automation, tax compliance (US sales tax, EU VAT, UK VAT), customer portal, analytics, affiliate management
- No server costs for update delivery
- No payment gateway integration work
- No tax compliance engineering

The revenue-share becomes lower as we grow - progressive pricing that rewards success.

### 6. Fast Integration
5-minute SDK integration vs. weeks building licensing infrastructure. The SDK provides:
- WordPress admin integration
- License activation UI
- Update mechanism
- Plan detection
- Feature gating helpers

### 7. Additional Distribution Channel
Freemius marketplace exposes our plugin to WordPress users browsing premium plugins, adding discovery beyond WordPress.org and our own marketing.

### 8. Proven & Popular
Most widely-used licensing solution for WordPress plugins. Large community, extensive documentation, battle-tested at scale.

### 9. Analytics & Insights Included
- Customer lifetime value tracking
- Churn analysis
- Trial conversion rates
- Revenue reporting
- Activation analytics

Useful for optimizing pricing and features without additional tools.

### 10. Future-Proofing
Recent 2026 updates include:
- Usage-based refunds for lifetime upgrades
- Simpler setup flow
- More flexible controls
- AI-ready documentation

Active development and modern features vs. maintaining our own licensing system.

---

## How It Works in Practice

1. Customer purchases premium plan via Freemius checkout
2. Freemius generates license key and emails to customer
3. Customer enters license key in plugin License tab
4. Plugin uses Freemius SDK to verify plan level
5. Premium features unlock automatically
6. Updates delivered automatically to licensed installations
7. 30 days before renewal, reminder email sent
8. Auto-renewal processes, license extends
9. If payment fails, Dunning emails recover revenue

---

## Decision

**Freemius is the pragmatic default** given WordPress.org distribution, annual subscription model, and desire to ship quickly without building licensing infrastructure.

Consider alternatives only if:
- Need full control and willing to pay $299+/year (EDD)
- Already deeply integrated with WooCommerce (WooCommerce extensions)
- Building multi-platform product beyond WordPress (Lemon Squeezy)
- International tax handling is primary concern (Paddle)

For a WordPress plugin with free/premium tiers distributed via WordPress.org, Freemius is purpose-built for exactly this scenario.
