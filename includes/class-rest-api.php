<?php
/**
 * REST API endpoints for plugin settings.
 *
 * Registers the `side-cart/v1` namespace with GET/POST endpoints for settings.
 *
 * @package SideCart
 */

namespace SideCart;

defined( 'ABSPATH' ) || exit;

/**
 * Class Rest_API
 */
class Rest_API {

	/**
	 * REST namespace.
	 */
	const NAMESPACE = 'side-cart/v1';

	/**
	 * Settings option key.
	 */
	const OPTION_KEY = 'scrt_settings';

	/**
	 * Register hooks.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 */
	public function register_routes(): void {
		// GET /side-cart/v1/settings
		register_rest_route(
			self::NAMESPACE,
			'/settings',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'check_permissions' ),
			)
		);

		// POST /side-cart/v1/settings
		register_rest_route(
			self::NAMESPACE,
			'/settings',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'save_settings' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => $this->get_settings_args(),
			)
		);
	}

	/**
	 * Check if the current user has permission to manage settings.
	 *
	 * @return bool
	 */
	public function check_permissions(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get plugin settings.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function get_settings( $request ) {
		$settings = $this->get_all_settings();
		return rest_ensure_response( $settings );
	}

	/**
	 * Save plugin settings.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function save_settings( $request ) {
		$new_settings = $request->get_json_params();
		$merged       = array_merge( $this->get_defaults(), $new_settings );

		update_option( self::OPTION_KEY, $merged );

		return rest_ensure_response(
			array(
				'success'  => true,
				'settings' => $merged,
			)
		);
	}

	/**
	 * Get all settings (saved + defaults).
	 *
	 * @return array
	 */
	public function get_all_settings(): array {
		$saved    = get_option( self::OPTION_KEY, array() );
		$defaults = $this->get_defaults();

		return wp_parse_args( $saved, $defaults );
	}

	/**
	 * Get settings schema for validation.
	 *
	 * @return array
	 */
	private function get_settings_args(): array {
		return array(
			// General
			'enabled'                       => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_floating_basket'          => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'basket_position'               => array(
				'type'              => 'string',
				'enum'              => array( 'bottom-right', 'bottom-left' ),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'drawer_position'               => array(
				'type'              => 'string',
				'enum'              => array( 'right', 'left' ),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'badge_count_mode'              => array(
				'type'              => 'string',
				'enum'              => array( 'total', 'unique' ),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'custom_trigger_selector'       => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),

			// Drawer Header
			'show_drawer_heading'           => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'drawer_heading_text'           => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'show_item_count_in_header'     => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),

			// Drawer Body
			'show_free_shipping_bar'        => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'free_shipping_message'         => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'free_shipping_success_message' => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'show_empty_state_icon'         => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'empty_state_message'           => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),

			// Cart Item
			'show_item_image'               => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_item_name'                => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_item_sku'                 => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_item_stock_status'        => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'stock_status_label_override'   => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'stock_status_label_instock'    => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'stock_status_label_outofstock' => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'stock_status_label_onbackorder' => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'show_item_price'               => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'item_price_mode'               => array(
				'type'              => 'string',
				'enum'              => array( 'individual', 'line_total' ),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'show_sale_price'               => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_item_variation'           => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_item_quantity'            => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_item_remove'              => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),

			// Cart Totals
			'show_coupon_input'             => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_cart_totals'              => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_subtotal'                 => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_shipping'                 => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_taxes'                    => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_discounts'                => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_total'                    => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),

			// Drawer Footer
			'show_empty_cart_button'        => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_view_cart_button'         => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'show_continue_shopping'        => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'continue_shopping'             => array(
				'type'              => 'string',
				'enum'              => array( 'close', 'shop', 'custom' ),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'show_checkout_button'          => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),

			// Appearance
			'load_plugin_stylesheet'        => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'customize_appearance'          => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'primary_color'                 => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'primary_hover_color'           => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'primary_text_color'            => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'drawer_bg_color'               => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'drawer_header_bg'              => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'drawer_footer_bg'              => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'text_color'                    => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'border_color'                  => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'overlay_color'                 => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'drawer_width'                  => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'border_radius'                 => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'button_radius'                 => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'overlay_blur'                  => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'shadow'                        => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'font_family'                   => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'font_size'                     => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'item_image_size'               => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'item_image_radius'             => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'basket_bg'                     => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'basket_color'                  => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'basket_size'                   => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'basket_icon_size'              => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'basket_radius'                 => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'badge_bg'                      => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'badge_color'                   => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'trigger_bg'                    => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'trigger_color'                 => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'trigger_font_size'             => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'trigger_icon_size'             => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'trigger_radius'                => array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'trigger_text'                  => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'show_trigger_badge'            => array(
				'type' => 'boolean',
			),
			'cart_icon'                     => array(
				'type'              => 'string',
				'enum'              => array( 'bag', 'handbag', 'cart', 'basket' ),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'remove_icon'                   => array(
				'type'              => 'string',
				'enum'              => array( 'trash', 'x' ),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'drawer_animation'              => array(
				'type'              => 'string',
				'enum'              => array( 'slide', 'fade', 'none' ),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'toast_bg'                      => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'toast_color'                   => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),
			'empty_state_color'             => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
			),

			// Integrations
			'auto_open'                     => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'hide_on_cart_page'             => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'hide_on_checkout'              => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'disabled_pages'                => array(
				'type'              => 'array',
				'items'             => array( 'type' => 'integer' ),
				'sanitize_callback' => function ( $value ) {
					return array_map( 'absint', (array) $value );
				},
			),
			'continue_shopping_url'         => array(
				'type'              => 'string',
				'sanitize_callback' => 'esc_url_raw',
			),
			'override_cart_redirect'        => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),
			'compat_mode'                   => array(
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			),

			// Advanced
			'custom_css'                    => array(
				'type'              => 'string',
				'sanitize_callback' => 'wp_strip_all_tags',
			),

			// License
			'license_key'                   => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'license_status'                => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
		);
	}

	/**
	 * Get default settings.
	 *
	 * @return array
	 */
	public function get_defaults(): array {
		$defaults = array(
			// General
			'enabled'                       => true,
			'show_floating_basket'          => true,
			'basket_position'               => 'bottom-right',
			'drawer_position'               => 'right',
			'badge_count_mode'              => 'total',
			'custom_trigger_selector'       => '',

			// Drawer Header
			'show_drawer_heading'           => true,
			'drawer_heading_text'           => __( 'Your Cart', 'side-cart' ),
			'show_item_count_in_header'     => true,

			// Drawer Body
			'show_free_shipping_bar'        => true,
			'free_shipping_message'         => __( "You're {amount} away from free shipping!", 'side-cart' ),
			'free_shipping_success_message' => __( "You've unlocked free shipping!", 'side-cart' ),
			'show_empty_state_icon'         => true,
			'empty_state_message'           => __( 'Your cart is empty.', 'side-cart' ),

			// Cart Item
			'show_item_image'               => true,
			'show_item_name'                => true,
			'show_item_sku'                 => false,
			'show_item_stock_status'        => false,
			'stock_status_label_override'   => false,
			'stock_status_label_instock'    => '',
			'stock_status_label_outofstock' => '',
			'stock_status_label_onbackorder' => '',
			'show_item_price'               => true,
			'item_price_mode'               => 'individual',
			'show_sale_price'               => true,
			'show_item_variation'           => false,
			'show_item_quantity'            => true,
			'show_item_remove'              => true,

			// Cart Totals
			'show_coupon_input'             => true,
			'show_cart_totals'              => true,
			'show_subtotal'                 => true,
			'show_shipping'                 => false,
			'show_taxes'                    => false,
			'show_discounts'                => true,
			'show_total'                    => true,

			// Drawer Footer
			'show_empty_cart_button'        => false,
			'show_view_cart_button'         => true,
			'show_continue_shopping'        => true,
			'continue_shopping'             => 'close',
			'show_checkout_button'          => true,

			// Appearance
			'load_plugin_stylesheet'        => true,
			'customize_appearance'          => true,
			'primary_color'                 => '#111111',
			'primary_hover_color'           => '#333333',
			'primary_text_color'            => '#ffffff',
			'drawer_bg_color'               => '#ffffff',
			'drawer_header_bg'              => '#ffffff',
			'drawer_footer_bg'              => '#ffffff',
			'text_color'                    => '#1a1a1a',
			'border_color'                  => '#e5e5e5',
			'overlay_color'                 => '#00000066',
			'drawer_width'                  => 420,
			'border_radius'                 => 0,
			'button_radius'                 => 4,
			'overlay_blur'                  => 0,
			'shadow'                        => '0 4px 24px rgba(0, 0, 0, 0.12)',
			'font_family'                   => 'inherit',
			'font_size'                     => 14,
			'item_image_size'               => 64,
			'item_image_radius'             => 4,
			'trigger_bg'                    => '#111111',
			'trigger_color'                 => '#ffffff',
			'trigger_font_size'             => 14,
			'trigger_icon_size'             => 20,
			'trigger_radius'                => 4,
			'basket_bg'                     => '#111111',
			'basket_color'                  => '#ffffff',
			'basket_size'                   => 56,
			'basket_icon_size'              => 24,
			'basket_radius'                 => '50%',
			'badge_bg'                      => '#ef4444',
			'badge_color'                   => '#ffffff',
			'trigger_text'                  => __( 'Cart', 'side-cart' ),
			'show_trigger_badge'            => true,
			'cart_icon'                     => 'bag',
			'remove_icon'                   => 'trash',
			'drawer_animation'              => 'slide',
			'toast_bg'                      => '#111111',
			'toast_color'                   => '#ffffff',
			'empty_state_color'             => '#999999',

			// Integrations
			'auto_open'                     => true,
			'hide_on_cart_page'             => true,
			'hide_on_checkout'              => true,
			'disabled_pages'                => array(),
			'continue_shopping_url'         => '',
			'override_cart_redirect'        => true,
			'compat_mode'                   => false,

			// Advanced
			'custom_css'                    => '',

			// License
			'license_key'                   => '',
			'license_status'                => '',
		);

		return apply_filters( 'scrt_settings_defaults', $defaults );
	}
}
