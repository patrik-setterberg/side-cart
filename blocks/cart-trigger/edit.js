/**
 * Cart Trigger Block — Editor Component
 *
 * @package SideCart
 */
import { useBlockProps, InspectorControls } from "@wordpress/block-editor";
import { PanelBody } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { ShoppingBag } from "lucide-react";

export default function Edit() {
  const blockProps = useBlockProps();

  return (
    <>
      <InspectorControls>
        <PanelBody title={__("Settings", "side-cart")}>
          <p style={{ margin: 0, fontSize: "13px" }}>
            {__(
              "Appearance is controlled on the Side Cart settings page.",
              "side-cart",
            )}
          </p>
        </PanelBody>
      </InspectorControls>
      <div {...blockProps}>
        <button
          className="scrt-trigger"
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "#111111",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "default",
          }}
        >
          <span style={{ width: "20px", height: "20px", display: "flex" }}>
            <ShoppingBag size={20} />
          </span>
          <span>{__("Cart", "side-cart")}</span>
          <span
            style={{
              minWidth: "20px",
              height: "20px",
              background: "#ef4444",
              color: "#ffffff",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 6px",
            }}
          >
            0
          </span>
        </button>
      </div>
    </>
  );
}
