/**
 * Side Cart Admin — Main App Component
 *
 * Full 5-tab settings interface with dirty state tracking.
 *
 * @package SideCart
 */

import { useState, useEffect, useRef } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import DrawerPreview, { BasketPreview, buildCssVars } from "./DrawerPreview";
import {
  TabPanel,
  ToggleControl,
  SelectControl,
  TextControl,
  TextareaControl,
  RangeControl,
  Button,
  Notice,
  Spinner,
  Card,
  CardBody,
  ColorPicker,
} from "@wordpress/components";

export default function App() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const savedSettingsRef = useRef(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Dirty state tracking
  useEffect(() => {
    if (!settings || !savedSettingsRef.current) {
      return;
    }

    const isDifferent =
      JSON.stringify(settings) !== JSON.stringify(savedSettingsRef.current);
    setIsDirty(isDifferent);
  }, [settings]);

  // Beforeunload safety net
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch({
        path: "/side-cart/v1/settings",
      });
      setSettings(data);
      savedSettingsRef.current = data;
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await apiFetch({
        path: "/side-cart/v1/settings",
        method: "POST",
        data: settings,
      });

      savedSettingsRef.current = response.settings;
      setSettings(response.settings);
      setIsDirty(false);
      setSaveMessage({
        type: "success",
        text: __("Settings saved successfully.", "side-cart"),
      });

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveMessage({
        type: "error",
        text: error.message || __("Failed to save settings.", "side-cart"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    if (
      window.confirm(
        __("Are you sure you want to discard your changes?", "side-cart"),
      )
    ) {
      setSettings({ ...savedSettingsRef.current });
      setIsDirty(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="scrt-admin-loading">
        <Spinner />
        <p>{__("Loading settings...", "side-cart")}</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <Notice status="error" isDismissible={false}>
        {__("Failed to load settings.", "side-cart")}
      </Notice>
    );
  }

  const showPreview = ["general", "appearance"].includes(activeTab);
  const cssVars = buildCssVars(settings);

  return (
    <div
      className={`scrt-admin${showPreview ? " scrt-admin--with-preview" : ""}`}
      style={showPreview ? cssVars : undefined}
    >
      <div className="scrt-admin-header">
        <h1>{__("Side Cart Settings", "side-cart")}</h1>
      </div>

      {saveMessage && (
        <Notice
          status={saveMessage.type}
          isDismissible
          onRemove={() => setSaveMessage(null)}
        >
          {saveMessage.text}
        </Notice>
      )}

      {isDirty && (
        <Notice status="warning" isDismissible={false}>
          <div className="scrt-unsaved-banner">
            <span>{__("You have unsaved changes.", "side-cart")}</span>
            <div className="scrt-unsaved-actions">
              <Button
                variant="primary"
                onClick={saveSettings}
                isBusy={isSaving}
                disabled={isSaving}
              >
                {__("Save Now", "side-cart")}
              </Button>
              <Button
                variant="secondary"
                onClick={discardChanges}
                disabled={isSaving}
              >
                {__("Discard", "side-cart")}
              </Button>
            </div>
          </div>
        </Notice>
      )}

      <div className="scrt-admin__body">
        <div className="scrt-admin__settings">
          <TabPanel
            className="scrt-tab-panel"
            tabs={[
              {
                name: "general",
                title: __("General", "side-cart"),
              },
              {
                name: "appearance",
                title: __("Appearance", "side-cart"),
              },
              {
                name: "integrations",
                title: __("Integrations", "side-cart"),
              },
              {
                name: "advanced",
                title: __("Advanced", "side-cart"),
              },
              {
                name: "license",
                title: __("License", "side-cart"),
              },
            ]}
            onSelect={setActiveTab}
          >
            {(tab) => (
              <div className="scrt-tab-content">
                {tab.name === "general" && (
                  <GeneralTab settings={settings} updateSetting={updateSetting} />
                )}
                {tab.name === "appearance" && (
                  <AppearanceTab
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}
                {tab.name === "integrations" && (
                  <IntegrationsTab
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}
                {tab.name === "advanced" && (
                  <AdvancedTab
                    settings={settings}
                    updateSetting={updateSetting}
                    onResetDefaults={loadSettings}
                  />
                )}
                {tab.name === "license" && (
                  <LicenseTab settings={settings} updateSetting={updateSetting} />
                )}

                <div className="scrt-tab-footer">
                  <Button
                    variant="primary"
                    onClick={saveSettings}
                    isBusy={isSaving}
                    disabled={isSaving || !isDirty}
                  >
                    {__("Save Changes", "side-cart")}
                  </Button>
                </div>
              </div>
            )}
          </TabPanel>
          {showPreview && settings.show_floating_basket && (
            <BasketPreview settings={settings} />
          )}
        </div>
      </div>

      {showPreview && <DrawerPreview settings={settings} />}
    </div>
  );
}

// General Tab Component
function GeneralTab({ settings, updateSetting }) {
  return (
    <>
      <Card>
        <CardBody>
          <h2>{__("Global Settings", "side-cart")}</h2>
          <ToggleControl
            label={__("Enable side cart", "side-cart")}
            checked={settings.enabled}
            onChange={(value) => updateSetting("enabled", value)}
          />
          <ToggleControl
            label={__("Show floating basket", "side-cart")}
            checked={settings.show_floating_basket}
            onChange={(value) => updateSetting("show_floating_basket", value)}
          />
          <SelectControl
            label={__("Basket position", "side-cart")}
            value={settings.basket_position}
            options={[
              { label: __("Bottom Right", "side-cart"), value: "bottom-right" },
              { label: __("Bottom Left", "side-cart"), value: "bottom-left" },
            ]}
            onChange={(value) => updateSetting("basket_position", value)}
            help={settings.basket_position === "bottom-left"
              ? __("Position is only visible on the frontend — the preview always shows the basket on the right.", "side-cart")
              : undefined}
          />
          <SelectControl
            label={__("Drawer position", "side-cart")}
            value={settings.drawer_position}
            options={[
              { label: __("Right", "side-cart"), value: "right" },
              { label: __("Left", "side-cart"), value: "left" },
            ]}
            onChange={(value) => updateSetting("drawer_position", value)}
            help={settings.drawer_position === "left"
              ? __("Position is only visible on the frontend — the preview always shows the drawer on the right.", "side-cart")
              : undefined}
          />
          <SelectControl
            label={__("Badge count mode", "side-cart")}
            value={settings.badge_count_mode}
            options={[
              { label: __("Total quantity", "side-cart"), value: "total" },
              { label: __("Unique items", "side-cart"), value: "unique" },
            ]}
            onChange={(value) => updateSetting("badge_count_mode", value)}
          />
          <TextControl
            label={__("Custom trigger CSS selector", "side-cart")}
            help={__("e.g., .my-cart-btn, #header-cart", "side-cart")}
            value={settings.custom_trigger_selector}
            onChange={(value) =>
              updateSetting("custom_trigger_selector", value)
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2>{__("Drawer Header", "side-cart")}</h2>
          <ToggleControl
            label={__("Show drawer heading", "side-cart")}
            checked={settings.show_drawer_heading}
            onChange={(value) => updateSetting("show_drawer_heading", value)}
          />
          <TextControl
            label={__("Heading text", "side-cart")}
            value={settings.drawer_heading_text}
            onChange={(value) => updateSetting("drawer_heading_text", value)}
            disabled={!settings.show_drawer_heading}
          />
          <ToggleControl
            label={__("Show item count in header", "side-cart")}
            help={__('Appends "(X items)" to the heading text.', "side-cart")}
            checked={settings.show_item_count_in_header}
            onChange={(value) =>
              updateSetting("show_item_count_in_header", value)
            }
            disabled={!settings.show_drawer_heading}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2>{__("Drawer Body", "side-cart")}</h2>
          <ToggleControl
            label={__("Show free shipping bar", "side-cart")}
            checked={settings.show_free_shipping_bar}
            onChange={(value) => updateSetting("show_free_shipping_bar", value)}
          />
          <TextControl
            label={__("Progress message", "side-cart")}
            help={__("Use {amount} as placeholder", "side-cart")}
            value={settings.free_shipping_message}
            onChange={(value) => updateSetting("free_shipping_message", value)}
          />
          <TextControl
            label={__("Success message", "side-cart")}
            value={settings.free_shipping_success_message}
            onChange={(value) =>
              updateSetting("free_shipping_success_message", value)
            }
          />
          <ToggleControl
            label={__("Show empty state icon", "side-cart")}
            checked={settings.show_empty_state_icon}
            onChange={(value) => updateSetting("show_empty_state_icon", value)}
          />
          <TextControl
            label={__("Empty state message", "side-cart")}
            value={settings.empty_state_message}
            onChange={(value) => updateSetting("empty_state_message", value)}
          />
          <ToggleControl
            label={__('Show "Empty cart" button', "side-cart")}
            checked={settings.show_empty_cart_button}
            onChange={(value) => updateSetting("show_empty_cart_button", value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2>{__("Cart Item", "side-cart")}</h2>
          <ToggleControl
            label={__("Show product image", "side-cart")}
            checked={settings.show_item_image}
            onChange={(value) => updateSetting("show_item_image", value)}
          />
          <ToggleControl
            label={__("Show product name", "side-cart")}
            checked={settings.show_item_name}
            onChange={(value) => updateSetting("show_item_name", value)}
          />
          <ToggleControl
            label={__("Show product SKU", "side-cart")}
            checked={settings.show_item_sku}
            onChange={(value) => updateSetting("show_item_sku", value)}
          />
          <ToggleControl
            label={__("Show stock status", "side-cart")}
            checked={settings.show_item_stock_status}
            onChange={(value) => updateSetting("show_item_stock_status", value)}
          />
          <ToggleControl
            label={__("Show variation attributes", "side-cart")}
            checked={settings.show_item_variation}
            onChange={(value) => updateSetting("show_item_variation", value)}
          />
          <ToggleControl
            label={__("Show price", "side-cart")}
            checked={settings.show_item_price}
            onChange={(value) => updateSetting("show_item_price", value)}
          />
          {settings.show_item_price && (
            <SelectControl
              label={__("Price display mode", "side-cart")}
              value={settings.item_price_mode}
              options={[
                {
                  label: __("Individual price", "side-cart"),
                  value: "individual",
                },
                {
                  label: __("Line total (price × quantity)", "side-cart"),
                  value: "line_total",
                },
              ]}
              onChange={(value) => updateSetting("item_price_mode", value)}
            />
          )}
          {settings.show_item_price &&
            settings.item_price_mode !== "line_total" && (
              <ToggleControl
                label={__("Show original price for sale items", "side-cart")}
                help={__(
                  "Displays the regular price with strikethrough next to the sale price.",
                  "side-cart",
                )}
                checked={settings.show_sale_price}
                onChange={(value) => updateSetting("show_sale_price", value)}
              />
            )}
          <ToggleControl
            label={__("Show quantity controls", "side-cart")}
            checked={settings.show_item_quantity}
            onChange={(value) => updateSetting("show_item_quantity", value)}
          />
          <ToggleControl
            label={__("Show remove button", "side-cart")}
            checked={settings.show_item_remove}
            onChange={(value) => updateSetting("show_item_remove", value)}
          />
        </CardBody>
      </Card>

      {settings.show_item_stock_status && (
        <Card>
          <CardBody>
            <h2>{__("Stock Status Labels", "side-cart")}</h2>
            <ToggleControl
              label={__("Override stock status labels", "side-cart")}
              help={__(
                "By default, WooCommerce's built-in labels are used.",
                "side-cart",
              )}
              checked={settings.stock_status_label_override}
              onChange={(value) =>
                updateSetting("stock_status_label_override", value)
              }
            />
            {settings.stock_status_label_override && (
              <>
                <TextControl
                  label={__("In stock label", "side-cart")}
                  value={settings.stock_status_label_instock}
                  placeholder={__("In stock", "side-cart")}
                  onChange={(value) =>
                    updateSetting("stock_status_label_instock", value)
                  }
                />
                <TextControl
                  label={__("Out of stock label", "side-cart")}
                  value={settings.stock_status_label_outofstock}
                  placeholder={__("Out of stock", "side-cart")}
                  onChange={(value) =>
                    updateSetting("stock_status_label_outofstock", value)
                  }
                />
                <TextControl
                  label={__("On backorder label", "side-cart")}
                  value={settings.stock_status_label_onbackorder}
                  placeholder={__("Available on backorder", "side-cart")}
                  onChange={(value) =>
                    updateSetting("stock_status_label_onbackorder", value)
                  }
                />
              </>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <h2>{__("Cart Totals", "side-cart")}</h2>
          <ToggleControl
            label={__("Show coupon input", "side-cart")}
            checked={settings.show_coupon_input}
            onChange={(value) => updateSetting("show_coupon_input", value)}
          />
          <ToggleControl
            label={__("Show cart totals block", "side-cart")}
            checked={settings.show_cart_totals}
            onChange={(value) => updateSetting("show_cart_totals", value)}
          />
          {settings.show_cart_totals && (
            <>
              <ToggleControl
                label={__("Show subtotal", "side-cart")}
                checked={settings.show_subtotal}
                onChange={(value) => updateSetting("show_subtotal", value)}
              />
              <ToggleControl
                label={__("Show shipping", "side-cart")}
                checked={settings.show_shipping}
                onChange={(value) => updateSetting("show_shipping", value)}
              />
              <ToggleControl
                label={__("Show taxes", "side-cart")}
                checked={settings.show_taxes}
                onChange={(value) => updateSetting("show_taxes", value)}
              />
              <ToggleControl
                label={__("Show discounts", "side-cart")}
                checked={settings.show_discounts}
                onChange={(value) => updateSetting("show_discounts", value)}
              />
              <ToggleControl
                label={__("Show total", "side-cart")}
                checked={settings.show_total}
                onChange={(value) => updateSetting("show_total", value)}
              />
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2>{__("Drawer Footer", "side-cart")}</h2>
          <ToggleControl
            label={__('Show "View cart" button', "side-cart")}
            checked={settings.show_view_cart_button}
            onChange={(value) => updateSetting("show_view_cart_button", value)}
          />
          <ToggleControl
            label={__('Show "Continue shopping" button', "side-cart")}
            checked={settings.show_continue_shopping}
            onChange={(value) => updateSetting("show_continue_shopping", value)}
          />
          {settings.show_continue_shopping && (
            <>
              <SelectControl
                label={__("Continue shopping behavior", "side-cart")}
                value={settings.continue_shopping}
                options={[
                  { label: __("Close drawer", "side-cart"), value: "close" },
                  { label: __("Go to shop page", "side-cart"), value: "shop" },
                  { label: __("Custom URL", "side-cart"), value: "custom" },
                ]}
                onChange={(value) => updateSetting("continue_shopping", value)}
              />
              {settings.continue_shopping === "custom" && (
                <TextControl
                  label={__("Custom URL", "side-cart")}
                  value={settings.continue_shopping_url}
                  onChange={(value) =>
                    updateSetting("continue_shopping_url", value)
                  }
                />
              )}
            </>
          )}
          <ToggleControl
            label={__('Show "Proceed to checkout" button', "side-cart")}
            checked={settings.show_checkout_button}
            onChange={(value) => updateSetting("show_checkout_button", value)}
          />
        </CardBody>
      </Card>
    </>
  );
}

// Appearance Tab Component
function AppearanceTab({ settings, updateSetting }) {
  const canCustomize =
    settings.load_plugin_stylesheet && settings.customize_appearance;

  return (
    <>
      <Card>
        <CardBody>
          <h2>{__("Style Settings", "side-cart")}</h2>
          <ToggleControl
            label={__("Load plugin stylesheet", "side-cart")}
            checked={settings.load_plugin_stylesheet}
            onChange={(value) => updateSetting("load_plugin_stylesheet", value)}
          />
          <ToggleControl
            label={__("Customize appearance", "side-cart")}
            checked={settings.customize_appearance}
            onChange={(value) => updateSetting("customize_appearance", value)}
            disabled={!settings.load_plugin_stylesheet}
          />
          {settings.load_plugin_stylesheet &&
            !settings.customize_appearance && (
              <Notice status="info" isDismissible={false}>
                {__(
                  "The default styles are active. Override them with CSS custom properties (e.g., --scrt-primary) in your theme stylesheet.",
                  "side-cart",
                )}
              </Notice>
            )}
        </CardBody>
      </Card>

      {canCustomize && (
        <>
          <Card>
            <CardBody>
              <h2>{__("Colors", "side-cart")}</h2>
              <ColorControl
                label={__("Primary color", "side-cart")}
                value={settings.primary_color}
                onChange={(value) => updateSetting("primary_color", value)}
              />
              <ColorControl
                label={__("Primary hover color", "side-cart")}
                value={settings.primary_hover_color}
                onChange={(value) =>
                  updateSetting("primary_hover_color", value)
                }
              />
              <ColorControl
                label={__("Primary text color", "side-cart")}
                value={settings.primary_text_color}
                onChange={(value) => updateSetting("primary_text_color", value)}
              />
              <ColorControl
                label={__("Drawer background", "side-cart")}
                value={settings.drawer_bg_color}
                onChange={(value) => updateSetting("drawer_bg_color", value)}
              />
              <ColorControl
                label={__("Drawer header background", "side-cart")}
                value={settings.drawer_header_bg}
                onChange={(value) => updateSetting("drawer_header_bg", value)}
              />
              <ColorControl
                label={__("Drawer footer background", "side-cart")}
                value={settings.drawer_footer_bg}
                onChange={(value) => updateSetting("drawer_footer_bg", value)}
              />
              <ColorControl
                label={__("Text color", "side-cart")}
                value={settings.text_color}
                onChange={(value) => updateSetting("text_color", value)}
              />
              <ColorControl
                label={__("Border color", "side-cart")}
                value={settings.border_color}
                onChange={(value) => updateSetting("border_color", value)}
              />
              <TextControl
                label={__("Overlay color", "side-cart")}
                help={__("e.g., rgba(0, 0, 0, 0.4)", "side-cart")}
                value={settings.overlay_color}
                onChange={(value) => updateSetting("overlay_color", value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2>{__("Layout", "side-cart")}</h2>
              <RangeControl
                label={__("Drawer width (px)", "side-cart")}
                value={settings.drawer_width}
                onChange={(value) => updateSetting("drawer_width", value)}
                min={300}
                max={600}
              />
              <RangeControl
                label={__("Border radius (px)", "side-cart")}
                value={settings.border_radius}
                onChange={(value) => updateSetting("border_radius", value)}
                min={0}
                max={24}
              />
              <RangeControl
                label={__("Button radius (px)", "side-cart")}
                value={settings.button_radius}
                onChange={(value) => updateSetting("button_radius", value)}
                min={0}
                max={24}
              />
              <RangeControl
                label={__("Overlay blur (px)", "side-cart")}
                value={settings.overlay_blur}
                onChange={(value) => updateSetting("overlay_blur", value)}
                min={0}
                max={20}
              />
              <TextControl
                label={__("Box shadow", "side-cart")}
                value={settings.shadow}
                onChange={(value) => updateSetting("shadow", value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2>{__("Typography", "side-cart")}</h2>
              <TextControl
                label={__("Font family", "side-cart")}
                value={settings.font_family}
                onChange={(value) => updateSetting("font_family", value)}
              />
              <RangeControl
                label={__("Font size (px)", "side-cart")}
                value={settings.font_size}
                onChange={(value) => updateSetting("font_size", value)}
                min={12}
                max={20}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2>{__("Product Images", "side-cart")}</h2>
              <RangeControl
                label={__("Image size (px)", "side-cart")}
                value={settings.item_image_size}
                onChange={(value) => updateSetting("item_image_size", value)}
                min={48}
                max={120}
              />
              <RangeControl
                label={__("Image border radius (px)", "side-cart")}
                value={settings.item_image_radius}
                onChange={(value) => updateSetting("item_image_radius", value)}
                min={0}
                max={24}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2>{__("Floating Basket", "side-cart")}</h2>
              <ColorControl
                label={__("Background color", "side-cart")}
                value={settings.basket_bg}
                onChange={(value) => updateSetting("basket_bg", value)}
              />
              <ColorControl
                label={__("Icon color", "side-cart")}
                value={settings.basket_color}
                onChange={(value) => updateSetting("basket_color", value)}
              />
              <RangeControl
                label={__("Size (px)", "side-cart")}
                value={settings.basket_size}
                onChange={(value) => updateSetting("basket_size", value)}
                min={40}
                max={80}
              />
              <TextControl
                label={__("Border radius", "side-cart")}
                value={settings.basket_radius}
                onChange={(value) => updateSetting("basket_radius", value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2>{__("Badge", "side-cart")}</h2>
              <ColorControl
                label={__("Background color", "side-cart")}
                value={settings.badge_bg}
                onChange={(value) => updateSetting("badge_bg", value)}
              />
              <ColorControl
                label={__("Text color", "side-cart")}
                value={settings.badge_color}
                onChange={(value) => updateSetting("badge_color", value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2>{__("Icons & Animation", "side-cart")}</h2>
              <SelectControl
                label={__("Cart icon", "side-cart")}
                value={settings.cart_icon}
                options={[
                  { label: __("Shopping Bag", "side-cart"), value: "bag" },
                  { label: __("Shopping Cart", "side-cart"), value: "cart" },
                  { label: __("Basket", "side-cart"), value: "basket" },
                ]}
                onChange={(value) => updateSetting("cart_icon", value)}
              />
              <SelectControl
                label={__("Drawer animation", "side-cart")}
                value={settings.drawer_animation}
                options={[
                  { label: __("Slide", "side-cart"), value: "slide" },
                  { label: __("Fade", "side-cart"), value: "fade" },
                  { label: __("None", "side-cart"), value: "none" },
                ]}
                onChange={(value) => updateSetting("drawer_animation", value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2>{__("Toasts", "side-cart")}</h2>
              <ColorControl
                label={__("Toast background", "side-cart")}
                value={settings.toast_bg}
                onChange={(value) => updateSetting("toast_bg", value)}
              />
              <ColorControl
                label={__("Toast text color", "side-cart")}
                value={settings.toast_color}
                onChange={(value) => updateSetting("toast_color", value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2>{__("Empty State", "side-cart")}</h2>
              <ColorControl
                label={__("Empty state color", "side-cart")}
                value={settings.empty_state_color}
                onChange={(value) => updateSetting("empty_state_color", value)}
              />
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}

// Integrations Tab Component
function IntegrationsTab({ settings, updateSetting }) {
  return (
    <>
      <Card>
        <CardBody>
          <h2>{__("WooCommerce Integration", "side-cart")}</h2>
          <ToggleControl
            label={__("Auto-open on add-to-cart", "side-cart")}
            checked={settings.auto_open}
            onChange={(value) => updateSetting("auto_open", value)}
          />
          <ToggleControl
            label={__("Hide on cart page", "side-cart")}
            checked={settings.hide_on_cart_page}
            onChange={(value) => updateSetting("hide_on_cart_page", value)}
          />
          <ToggleControl
            label={__("Hide on checkout page", "side-cart")}
            checked={settings.hide_on_checkout}
            onChange={(value) => updateSetting("hide_on_checkout", value)}
          />
          <ToggleControl
            label={__("Override WC cart redirect", "side-cart")}
            checked={settings.override_cart_redirect}
            onChange={(value) => updateSetting("override_cart_redirect", value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2>{__("Theme Compatibility", "side-cart")}</h2>
          <ToggleControl
            label={__("Compatibility mode", "side-cart")}
            help={__(
              "Forces high z-index and disables backdrop blur",
              "side-cart",
            )}
            checked={settings.compat_mode}
            onChange={(value) => updateSetting("compat_mode", value)}
          />
          {settings.compat_mode && (
            <Notice status="warning" isDismissible={false}>
              {__(
                "Compatibility mode is on. Disable it once your theme conflict is resolved.",
                "side-cart",
              )}
            </Notice>
          )}
        </CardBody>
      </Card>
    </>
  );
}

// Advanced Tab Component
function AdvancedTab({ settings, updateSetting, onResetDefaults }) {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (
      !window.confirm(
        __(
          "Are you sure you want to reset all settings to defaults? This cannot be undone.",
          "side-cart",
        ),
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      await apiFetch({
        path: "/side-cart/v1/settings",
        method: "POST",
        data: {},
      });
      onResetDefaults();
    } catch (error) {
      console.error("Failed to reset settings:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Card>
        <CardBody>
          <h2>{__("Custom CSS", "side-cart")}</h2>
          <TextareaControl
            label={__("Custom CSS", "side-cart")}
            help={__(
              "Add custom CSS rules to further customize the cart appearance.",
              "side-cart",
            )}
            value={settings.custom_css}
            onChange={(value) => updateSetting("custom_css", value)}
            rows={10}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2>{__("Reset Settings", "side-cart")}</h2>
          <p>
            {__(
              "Reset all settings to their default values. License information will be preserved.",
              "side-cart",
            )}
          </p>
          <Button
            variant="secondary"
            isDestructive
            onClick={handleReset}
            isBusy={isResetting}
            disabled={isResetting}
          >
            {__("Reset to Defaults", "side-cart")}
          </Button>
        </CardBody>
      </Card>
    </>
  );
}

// License Tab Component
function LicenseTab({ settings, updateSetting }) {
  return (
    <Card>
      <CardBody>
        <h2>{__("License", "side-cart")}</h2>
        <TextControl
          label={__("License key", "side-cart")}
          value={settings.license_key}
          onChange={(value) => updateSetting("license_key", value)}
          type="password"
        />
        <p>
          {__("License status:", "side-cart")}{" "}
          <strong>
            {settings.license_status || __("Not activated", "side-cart")}
          </strong>
        </p>
        <Notice status="info" isDismissible={false}>
          {__(
            "License activation will be implemented in a future version.",
            "side-cart",
          )}
        </Notice>
      </CardBody>
    </Card>
  );
}

// Color Control Helper Component
function ColorControl({ label, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="scrt-color-control">
      <div className="scrt-color-control__label">{label}</div>
      <div className="scrt-color-control__wrapper">
        <button
          className="scrt-color-control__swatch"
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={label}
        />
        <TextControl
          value={value}
          onChange={onChange}
          className="scrt-color-control__input"
        />
      </div>
      {isOpen && (
        <div className="scrt-color-control__picker">
          <ColorPicker color={value} onChangeComplete={onChange} />
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
            style={{ marginTop: "10px", width: "100%" }}
          >
            {__("Close", "side-cart")}
          </Button>
        </div>
      )}
    </div>
  );
}
