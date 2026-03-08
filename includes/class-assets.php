<?php
/**
 * Assets management class.
 *
 * Handles script module and stylesheet registration and enqueueing.
 *
 * @package SideCart
 */

namespace SideCart;

defined( 'ABSPATH' ) || exit;

/**
 * Class Assets
 */
class Assets {

	/**
	 * Plugin settings.
	 *
	 * @var array
	 */
	private array $settings;

	/**
	 * REST API instance.
	 *
	 * @var Rest_API
	 */
	private Rest_API $rest_api;

	/**
	 * Constructor.
	 *
	 * @param Rest_API $rest_api REST API instance.
	 */
	public function __construct( Rest_API $rest_api ) {
		$this->rest_api = $rest_api;
		$this->settings = $rest_api->get_all_settings();

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
	}

	/**
	 * Enqueue frontend assets.
	 *
	 * @return void
	 */
	public function enqueue_frontend_assets(): void {
		// Don't enqueue if plugin is disabled.
		if ( ! $this->settings['enabled'] ) {
			return;
		}

		// Don't enqueue on cart/checkout if settings say so.
		if ( $this->settings['hide_on_cart_page'] && is_cart() ) {
			return;
		}

		if ( $this->settings['hide_on_checkout'] && is_checkout() ) {
			return;
		}

		// Check disabled pages.
		if ( ! empty( $this->settings['disabled_pages'] ) && is_page( $this->settings['disabled_pages'] ) ) {
			return;
		}

		// Enqueue script module.
		$this->enqueue_script_module();

		// Enqueue stylesheets.
		$this->enqueue_stylesheets();

		// Output custom CSS.
		$this->output_custom_css();
	}

	/**
	 * Enqueue the Interactivity API script module.
	 *
	 * @return void
	 */
	private function enqueue_script_module(): void {
		// Register the script module with Interactivity API dependency.
		wp_register_script_module(
			'side-cart-view',
			SCRT_PLUGIN_URL . 'build/frontend/view.js',
			array( '@wordpress/interactivity' ),
			SCRT_VERSION
		);

		// Enqueue the script module.
		wp_enqueue_script_module( 'side-cart-view' );

		// Also enqueue the Interactivity API itself.
		wp_enqueue_script_module( '@wordpress/interactivity' );
	}

	/**
	 * Enqueue stylesheets based on settings.
	 *
	 * @return void
	 */
	private function enqueue_stylesheets(): void {
		// Layer 1: Always enqueue structure CSS from built assets.
		wp_enqueue_style(
			'side-cart-structure',
			SCRT_PLUGIN_URL . 'build/frontend/view.css',
			array(),
			SCRT_VERSION
		);

		// Layer 2 & 3: Inline CSS overrides (conditional).
		if ( $this->settings['load_plugin_stylesheet'] && $this->settings['customize_appearance'] ) {
			$this->add_inline_overrides();
		}
	}

	/**
	 * Add inline CSS custom property overrides.
	 *
	 * Only outputs properties that differ from the defaults.
	 *
	 * @return void
	 */
	private function add_inline_overrides(): void {
		$overrides = array();
		$defaults  = $this->rest_api->get_defaults();

		// Color properties.
		$color_map = array(
			'primary_color'       => '--scrt-primary',
			'primary_hover_color' => '--scrt-primary-hover',
			'primary_text_color'  => '--scrt-primary-text',
			'drawer_bg_color'     => '--scrt-drawer-bg',
			'drawer_header_bg'    => '--scrt-drawer-header-bg',
			'drawer_footer_bg'    => '--scrt-drawer-footer-bg',
			'text_color'          => '--scrt-drawer-color',
			'border_color'        => '--scrt-border',
			'overlay_color'       => '--scrt-overlay-bg',
			'basket_bg'           => '--scrt-basket-bg',
			'basket_color'        => '--scrt-basket-color',
			'badge_bg'            => '--scrt-badge-bg',
			'badge_color'         => '--scrt-badge-color',
			'toast_bg'            => '--scrt-toast-bg',
			'toast_color'         => '--scrt-toast-color',
			'empty_state_color'   => '--scrt-empty-color',
		);

		foreach ( $color_map as $setting_key => $css_var ) {
			if ( isset( $this->settings[ $setting_key ] ) && $this->settings[ $setting_key ] !== $defaults[ $setting_key ] ) {
				$overrides[] = $css_var . ': ' . sanitize_hex_color( $this->settings[ $setting_key ] ) . ';';
			}
		}

		// Layout properties.
		$layout_map = array(
			'drawer_width'       => array( '--scrt-drawer-width', 'px' ),
			'border_radius'     => array( '--scrt-radius', 'px' ),
			'button_radius'     => array( '--scrt-button-radius', 'px' ),
			'overlay_blur'      => array( '--scrt-overlay-blur', 'px' ),
			'font_size'         => array( '--scrt-font-size', 'px' ),
			'item_image_size'   => array( '--scrt-item-image-size', 'px' ),
			'item_image_radius' => array( '--scrt-item-image-radius', 'px' ),
			'basket_size'       => array( '--scrt-basket-size', 'px' ),
			'basket_icon_size'  => array( '--scrt-basket-icon-size', 'px' ),
		);

		foreach ( $layout_map as $setting_key => $data ) {
			list( $css_var, $unit ) = $data;
			if ( isset( $this->settings[ $setting_key ] ) && $this->settings[ $setting_key ] !== $defaults[ $setting_key ] ) {
				$overrides[] = $css_var . ': ' . absint( $this->settings[ $setting_key ] ) . $unit . ';';
			}
		}

		// Text properties.
		if ( $this->settings['shadow'] !== $defaults['shadow'] ) {
			$overrides[] = '--scrt-shadow: ' . sanitize_text_field( $this->settings['shadow'] ) . ';';
		}

		if ( $this->settings['font_family'] !== $defaults['font_family'] ) {
			$overrides[] = '--scrt-font-family: ' . sanitize_text_field( $this->settings['font_family'] ) . ';';
		}

		if ( $this->settings['basket_radius'] !== $defaults['basket_radius'] ) {
			$overrides[] = '--scrt-basket-radius: ' . sanitize_text_field( $this->settings['basket_radius'] ) . ';';
		}

		// Compat mode: force z-index.
		if ( $this->settings['compat_mode'] ) {
			$overrides[] = '--scrt-z-index: 999999 !important;';
			// Disable overlay blur in compat mode.
			$overrides[] = '--scrt-overlay-blur: 0px !important;';
		}

		// Output inline style if we have overrides.
		if ( ! empty( $overrides ) ) {
			$inline_css = ':root { ' . implode( ' ', $overrides ) . ' }';
			wp_add_inline_style( 'side-cart-structure', $inline_css );
		}
	}

	/**
	 * Output custom CSS from advanced settings.
	 *
	 * @return void
	 */
	private function output_custom_css(): void {
		if ( empty( $this->settings['custom_css'] ) ) {
			return;
		}

		$custom_css = wp_strip_all_tags( $this->settings['custom_css'] );

		if ( ! empty( $custom_css ) ) {
			wp_add_inline_style( 'side-cart-structure', $custom_css );
		}
	}
}
