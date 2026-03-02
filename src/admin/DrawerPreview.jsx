/**
 * Side Cart Admin — Live Drawer Preview
 *
 * Renders a static, non-interactive preview of the cart drawer and
 * floating basket, reflecting the current settings in real-time.
 *
 * @package SideCart
 */

import { __ } from "@wordpress/i18n";
import imgWallet from "./images/leather-wallet.jpg";
import imgTote from "./images/tote-bag.jpg";

// Mock cart items displayed in the preview
const MOCK_ITEMS = [
  {
    name: "Premium Leather Wallet",
    price: "$49.99",
    lineTotal: "$49.99",
    quantity: 1,
    sku: "PLW-001",
    stockStatus: "instock",
    stockLabel: "In stock",
    variation: [{ attribute: "Color", value: "Brown" }],
    image: imgWallet,
  },
  {
    name: "Canvas Tote Bag",
    price: "$24.99",
    lineTotal: "$49.98",
    quantity: 2,
    sku: "CTB-002",
    stockStatus: "instock",
    stockLabel: "In stock",
    variation: [],
    image: imgTote,
  },
];

const MOCK_SUBTOTAL = "$74.97";
const MOCK_TOTAL = "$74.97";
const MOCK_BADGE_COUNT = 3;
const MOCK_SHIPPING_PERCENT = 60;

// SVG icons matching helpers.php::scrt_get_cart_icon_svg
const CART_ICONS = {
  bag: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  ),
  cart: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  ),
  basket: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 9 1.5 12h11L19 9"></path>
      <path d="M2 9h20"></path>
      <path d="M7.5 9V5a3.5 3.5 0 0 1 7 0v4"></path>
    </svg>
  ),
};

const CLOSE_ICON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const TRASH_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const EMPTY_CART_ICON = (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

/**
 * Map plugin settings to CSS custom properties.
 * Only applied when load_plugin_stylesheet + customize_appearance are both on.
 */
export function buildCssVars(settings) {
  if (!settings.load_plugin_stylesheet || !settings.customize_appearance) {
    return {};
  }

  const vars = {};

  const colorMap = {
    primary_color: "--scrt-primary",
    primary_hover_color: "--scrt-primary-hover",
    primary_text_color: "--scrt-primary-text",
    drawer_bg_color: "--scrt-drawer-bg",
    drawer_header_bg: "--scrt-drawer-header-bg",
    drawer_footer_bg: "--scrt-drawer-footer-bg",
    text_color: "--scrt-drawer-color",
    border_color: "--scrt-border",
    overlay_color: "--scrt-overlay-bg",
    basket_bg: "--scrt-basket-bg",
    basket_color: "--scrt-basket-color",
    badge_bg: "--scrt-badge-bg",
    badge_color: "--scrt-badge-color",
    toast_bg: "--scrt-toast-bg",
    toast_color: "--scrt-toast-color",
    empty_state_color: "--scrt-empty-color",
  };

  for (const [key, cssVar] of Object.entries(colorMap)) {
    if (settings[key]) {
      vars[cssVar] = settings[key];
    }
  }

  if (settings.drawer_width) vars["--scrt-drawer-width"] = `${settings.drawer_width}px`;
  if (settings.border_radius !== undefined) vars["--scrt-radius"] = `${settings.border_radius}px`;
  if (settings.button_radius !== undefined) vars["--scrt-button-radius"] = `${settings.button_radius}px`;
  if (settings.overlay_blur !== undefined) vars["--scrt-overlay-blur"] = `${settings.overlay_blur}px`;
  if (settings.font_size) vars["--scrt-font-size"] = `${settings.font_size}px`;
  if (settings.font_family) vars["--scrt-font-family"] = settings.font_family;
  if (settings.item_image_size) vars["--scrt-item-image-size"] = `${settings.item_image_size}px`;
  if (settings.item_image_radius !== undefined) vars["--scrt-item-image-radius"] = `${settings.item_image_radius}px`;
  if (settings.basket_size) vars["--scrt-basket-size"] = `${settings.basket_size}px`;
  if (settings.basket_radius) vars["--scrt-basket-radius"] = settings.basket_radius;
  if (settings.shadow) vars["--scrt-shadow"] = settings.shadow;

  return vars;
}

/**
 * Main preview component.
 */
export default function DrawerPreview({ settings }) {
  const cssVars = buildCssVars(settings);

  const headingText = settings.show_item_count_in_header
    ? `${settings.drawer_heading_text} (${MOCK_BADGE_COUNT} items)`
    : settings.drawer_heading_text;

  const freeShippingMsg = (settings.free_shipping_message || "").replace(
    "{amount}",
    "$25.01"
  );

  const drawerClasses = [
    "scrt-drawer",
    "scrt-drawer--right",
    "scrt-drawer--animation-none",
  ].join(" ");

  return (
    <div className="scrt-preview" style={cssVars} aria-hidden="true">
      {/* Drawer */}
      <div className="scrt-preview__drawer-wrap">
        <aside className={drawerClasses}>
          {/* Drawer header */}
          <div className="scrt-drawer__header">
            {settings.show_drawer_heading && (
              <h2 className="scrt-drawer__heading">{headingText}</h2>
            )}
            <button
              className="scrt-drawer__close"
              type="button"
              tabIndex={-1}
            >
              {CLOSE_ICON}
            </button>
          </div>

          {/* Drawer body */}
          <div className="scrt-drawer__body">
            {/* Free shipping bar */}
            {settings.show_free_shipping_bar && (
              <div className="scrt-shipping-bar">
                <div className="scrt-shipping-bar__message">{freeShippingMsg}</div>
                <progress
                  className="scrt-shipping-bar__progress"
                  value={MOCK_SHIPPING_PERCENT}
                  max="100"
                />
              </div>
            )}

            {/* Items */}
            <div className="scrt-items">
              <ul className="scrt-items__list">
                {MOCK_ITEMS.map((item, i) => (
                  <li key={i} className="scrt-item">
                    {settings.show_item_image && (
                      <div className="scrt-item__image">
                        <img src={item.image} alt={item.name} />
                      </div>
                    )}

                    <div className="scrt-item__details">
                      {settings.show_item_name && (
                        <h3 className="scrt-item__name">
                          <span>{item.name}</span>
                        </h3>
                      )}
                      {settings.show_item_sku && (
                        <div className="scrt-item__sku">
                          {__("SKU:", "side-cart")} {item.sku}
                        </div>
                      )}
                      {settings.show_item_stock_status && (
                        <div
                          className="scrt-item__stock"
                          data-status={item.stockStatus}
                        >
                          <span>{item.stockLabel}</span>
                        </div>
                      )}
                      {settings.show_item_variation && item.variation.length > 0 && (
                        <div className="scrt-item__variation">
                          <ul className="scrt-item__variation-list">
                            {item.variation.map((attr, j) => (
                              <li key={j}>
                                <span>{attr.attribute}</span>:{" "}
                                <span>{attr.value}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {settings.show_item_price && (
                        <div className="scrt-item__price">
                          {settings.item_price_mode === "line_total"
                            ? item.lineTotal
                            : item.price}
                        </div>
                      )}
                    </div>

                    <div className="scrt-item__actions">
                      {settings.show_item_quantity && (
                        <div className="scrt-item__quantity">
                          <button
                            className="scrt-qty-btn scrt-qty-btn--minus"
                            type="button"
                            tabIndex={-1}
                          >
                            −
                          </button>
                          <input
                            className="scrt-qty-input"
                            type="number"
                            value={item.quantity}
                            readOnly
                            tabIndex={-1}
                          />
                          <button
                            className="scrt-qty-btn scrt-qty-btn--plus"
                            type="button"
                            tabIndex={-1}
                          >
                            +
                          </button>
                        </div>
                      )}
                      {settings.show_item_remove && (
                        <button
                          className="scrt-item__remove"
                          type="button"
                          tabIndex={-1}
                        >
                          {TRASH_ICON}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empty cart button */}
            {settings.show_empty_cart_button && (
              <div className="scrt-empty-cart-wrap">
                <button
                  className="scrt-button scrt-button--text scrt-button--empty-cart"
                  type="button"
                  tabIndex={-1}
                >
                  {__("Empty Cart", "side-cart")}
                </button>
              </div>
            )}
          </div>

          {/* Drawer footer */}
          <div className="scrt-drawer__footer">
            {/* Coupon input */}
            {settings.show_coupon_input && (
              <div className="scrt-coupon">
                <div className="scrt-coupon__input-group">
                  <input
                    className="scrt-coupon__input"
                    type="text"
                    placeholder={__("Coupon code", "side-cart")}
                    readOnly
                    tabIndex={-1}
                  />
                  <button className="scrt-coupon__button" type="button" tabIndex={-1}>
                    {__("Apply", "side-cart")}
                  </button>
                </div>
              </div>
            )}

            {/* Cart totals */}
            {settings.show_cart_totals && (
              <div className="scrt-totals">
                {settings.show_subtotal && (
                  <div className="scrt-totals__row">
                    <span className="scrt-totals__label">
                      {__("Subtotal", "side-cart")}
                    </span>
                    <span className="scrt-totals__value">{MOCK_SUBTOTAL}</span>
                  </div>
                )}
                {settings.show_shipping && (
                  <div className="scrt-totals__row">
                    <span className="scrt-totals__label">
                      {__("Shipping", "side-cart")}
                    </span>
                    <span className="scrt-totals__value">
                      {__("Calculated at checkout", "side-cart")}
                    </span>
                  </div>
                )}
                {settings.show_taxes && (
                  <div className="scrt-totals__row">
                    <span className="scrt-totals__label">
                      {__("Tax", "side-cart")}
                    </span>
                    <span className="scrt-totals__value">
                      {__("Calculated at checkout", "side-cart")}
                    </span>
                  </div>
                )}
                {settings.show_total && (
                  <div className="scrt-totals__row scrt-totals__row--total">
                    <span className="scrt-totals__label">
                      {__("Total", "side-cart")}
                    </span>
                    <span className="scrt-totals__value">{MOCK_TOTAL}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="scrt-actions">
              {settings.show_checkout_button && (
                <span className="scrt-button scrt-button--primary scrt-button--checkout">
                  {__("Proceed to Checkout", "side-cart")}
                </span>
              )}
              <div className="scrt-actions__secondary">
                {settings.show_view_cart_button && (
                  <span className="scrt-button scrt-button--secondary">
                    {__("View Cart", "side-cart")}
                  </span>
                )}
                {settings.show_continue_shopping && (
                  <span className="scrt-button scrt-button--secondary">
                    {__("Continue Shopping", "side-cart")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

    </div>
  );
}

/**
 * Floating basket button rendered outside the preview panel,
 * floating at the bottom-right of the settings column.
 */
export function BasketPreview({ settings }) {
  const cssVars = buildCssVars(settings);

  return (
    <div className="scrt-preview__floating-basket" style={cssVars} aria-hidden="true">
      <button
        className={`scrt-basket scrt-basket--${settings.basket_position || "bottom-right"}`}
        type="button"
        tabIndex={-1}
      >
        <span className="scrt-basket__icon">
          {CART_ICONS[settings.cart_icon] || CART_ICONS.bag}
        </span>
        <span className="scrt-basket__badge">{MOCK_BADGE_COUNT}</span>
      </button>
    </div>
  );
}
