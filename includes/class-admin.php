<?php
/**
 * Admin class.
 *
 * Registers the admin menu page and enqueues the React bundle.
 *
 * @package SideCart
 */

namespace SideCart;

defined( 'ABSPATH' ) || exit;

/**
 * Class Admin
 */
class Admin {

	/**
	 * Admin page slug.
	 */
	const PAGE_SLUG = 'side-cart';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_menu_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
	}

	/**
	 * Register the admin menu page.
	 *
	 * @return void
	 */
	public function register_menu_page(): void {
		add_menu_page(
			__( 'Side Cart', 'side-cart' ),
			__( 'Side Cart', 'side-cart' ),
			'manage_options',
			self::PAGE_SLUG,
			array( $this, 'render_page' ),
			'dashicons-cart',
			56
		);
	}

	/**
	 * Render the admin page.
	 *
	 * @return void
	 */
	public function render_page(): void {
		echo '<div id="scrt-admin-root"></div>';
	}

	/**
	 * Enqueue admin assets.
	 *
	 * @param string $hook Current admin page hook.
	 * @return void
	 */
	public function enqueue_admin_assets( string $hook ): void {
		// Only enqueue on our admin page.
		if ( 'toplevel_page_' . self::PAGE_SLUG !== $hook ) {
			return;
		}

		$asset_file = SCRT_PLUGIN_DIR . 'build/admin/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		// Enqueue the admin bundle.
		wp_enqueue_script(
			'side-cart-admin',
			SCRT_PLUGIN_URL . 'build/admin/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		// Enqueue admin styles.
		wp_enqueue_style(
			'side-cart-admin',
			SCRT_PLUGIN_URL . 'build/admin/index.css',
			array( 'wp-components' ),
			$asset['version']
		);

		// Enqueue frontend stylesheets so the preview component can use its CSS classes.
		// Structure (Layer 1) is always needed; theme (Layer 2) provides the visual design.
		wp_enqueue_style(
			'side-cart-structure',
			SCRT_PLUGIN_URL . 'build/frontend/structure.css',
			array(),
			SCRT_VERSION
		);
		wp_enqueue_style(
			'side-cart-theme',
			SCRT_PLUGIN_URL . 'build/frontend/view.css',
			array( 'side-cart-structure' ),
			SCRT_VERSION
		);

		// Pass settings to the React app.
		wp_localize_script(
			'side-cart-admin',
			'scrtAdmin',
			array(
				'apiUrl' => esc_url_raw( rest_url( 'side-cart/v1' ) ),
				'nonce'  => wp_create_nonce( 'wp_rest' ),
			)
		);
	}
}
