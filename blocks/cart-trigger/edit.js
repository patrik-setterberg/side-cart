/**
 * Cart Trigger Block — Editor Component
 *
 * @package SideCart
 */
import { useBlockProps, InspectorControls } from "@wordpress/block-editor";
import {
  PanelBody,
  TextControl,
  ToggleControl,
  SelectControl,
  RangeControl,
  ColorPicker,
  Button,
} from "@wordpress/components";
import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import {
  ShoppingBag,
  Handbag,
  ShoppingCart,
  ShoppingBasket,
} from "lucide-react";
import "../../src/frontend/cart-trigger.css";

const ICONS = {
  bag: ShoppingBag,
  handbag: Handbag,
  cart: ShoppingCart,
  basket: ShoppingBasket,
};

function ColorControl({ label, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleOpen = () => {
    setDraft(value);
    setIsOpen(true);
  };

  const handleApply = () => {
    onChange(draft);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: isOpen ? "8px" : "0",
        }}
      >
        <button
          type="button"
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            background: value,
            cursor: "pointer",
            flexShrink: 0,
          }}
          onClick={handleOpen}
          aria-label={label}
        />
        <span style={{ fontSize: "13px" }}>{label}</span>
        <span style={{ fontSize: "12px", color: "#666", marginLeft: "auto" }}>
          {value}
        </span>
      </div>
      {isOpen && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "8px",
            background: "#fff",
          }}
        >
          <ColorPicker color={draft} onChange={setDraft} enableAlpha />
          <div style={{ display: "flex", gap: "8px", padding: "4px 8px 0" }}>
            <Button variant="primary" onClick={handleApply}>
              {__("Apply", "side-cart")}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              {__("Cancel", "side-cart")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Edit({ attributes, setAttributes }) {
  const blockProps = useBlockProps();
  const {
    triggerText,
    icon,
    showBadge,
    triggerBg,
    triggerColor,
    triggerFontSize,
    triggerIconSize,
    triggerRadius,
    triggerBadgeBg,
    triggerBadgeColor,
  } = attributes;

  const IconComponent = ICONS[icon] ?? ICONS.bag;

  const cssVars = {
    "--scrt-trigger-bg": triggerBg,
    "--scrt-trigger-color": triggerColor,
    "--scrt-trigger-font-size": `${triggerFontSize}px`,
    "--scrt-trigger-icon-size": `${triggerIconSize}px`,
    "--scrt-trigger-radius": `${triggerRadius}px`,
    "--scrt-trigger-badge-bg": triggerBadgeBg,
    "--scrt-trigger-badge-color": triggerBadgeColor,
  };

  return (
    <>
      <InspectorControls>
        <PanelBody title={__("Content", "side-cart")}>
          <TextControl
            label={__("Button text", "side-cart")}
            value={triggerText}
            onChange={(value) => setAttributes({ triggerText: value })}
          />
          <SelectControl
            label={__("Icon", "side-cart")}
            value={icon}
            options={[
              { label: __("Shopping Bag", "side-cart"), value: "bag" },
              { label: __("Handbag", "side-cart"), value: "handbag" },
              { label: __("Shopping Cart", "side-cart"), value: "cart" },
              { label: __("Shopping Basket", "side-cart"), value: "basket" },
            ]}
            onChange={(value) => setAttributes({ icon: value })}
          />
          <ToggleControl
            label={__("Show badge", "side-cart")}
            checked={showBadge}
            onChange={(value) => setAttributes({ showBadge: value })}
          />
        </PanelBody>
        <PanelBody title={__("Colors", "side-cart")} initialOpen={false}>
          <ColorControl
            label={__("Background", "side-cart")}
            value={triggerBg}
            onChange={(value) => setAttributes({ triggerBg: value })}
          />
          <ColorControl
            label={__("Text & icon color", "side-cart")}
            value={triggerColor}
            onChange={(value) => setAttributes({ triggerColor: value })}
          />
          <ColorControl
            label={__("Badge background", "side-cart")}
            value={triggerBadgeBg}
            onChange={(value) => setAttributes({ triggerBadgeBg: value })}
          />
          <ColorControl
            label={__("Badge text color", "side-cart")}
            value={triggerBadgeColor}
            onChange={(value) => setAttributes({ triggerBadgeColor: value })}
          />
        </PanelBody>
        <PanelBody title={__("Dimensions", "side-cart")} initialOpen={false}>
          <RangeControl
            label={__("Font size (px)", "side-cart")}
            value={triggerFontSize}
            onChange={(value) => setAttributes({ triggerFontSize: value })}
            min={12}
            max={24}
          />
          <RangeControl
            label={__("Icon size (px)", "side-cart")}
            value={triggerIconSize}
            onChange={(value) => setAttributes({ triggerIconSize: value })}
            min={12}
            max={32}
          />
          <RangeControl
            label={__("Border radius (px)", "side-cart")}
            value={triggerRadius}
            onChange={(value) => setAttributes({ triggerRadius: value })}
            min={0}
            max={50}
          />
        </PanelBody>
      </InspectorControls>
      <div {...blockProps}>
        <button type="button" className="scrt-trigger" style={cssVars}>
          <span className="scrt-trigger__icon">
            <IconComponent />
          </span>
          {triggerText && (
            <span className="scrt-trigger__text">{triggerText}</span>
          )}
          {showBadge && (
            <span className="scrt-trigger__badge">0</span>
          )}
        </button>
      </div>
    </>
  );
}
