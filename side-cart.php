<?php
/**
 * Plugin Name:       Side Cart
 * Plugin URI:        https://github.com/patrik-setterberg/side-cart
 * Description:       A lightweight, accessible WooCommerce side-cart drawer built with the WordPress Interactivity API.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      8.0
 * Author:            Patrik Setterberg
 * Author URI:        https://github.com/patrik-setterberg
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       side-cart
 * Domain Path:       /languages
 *
 * @package SideCart
 */

defined( 'ABSPATH' ) || exit;

// Plugin constants.
define( 'SCRT_VERSION', '1.0.0' );
define( 'SCRT_PLUGIN_FILE', __FILE__ );
define( 'SCRT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SCRT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Autoloader.
require_once SCRT_PLUGIN_DIR . 'includes/bootstrap.php';

/**
 * Check if WooCommerce is active and initialize the plugin.
 */
function scrt_init(): void {
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', 'scrt_woocommerce_missing_notice' );
		return;
	}

	SideCart\Plugin::instance();
}
add_action( 'plugins_loaded', 'scrt_init' );

/**
 * Admin notice shown when WooCommerce is not active.
 */
function scrt_woocommerce_missing_notice(): void {
	?>
	<div class="notice notice-error">
		<p>
			<?php
			printf(
				/* translators: %s: WooCommerce plugin link */
				esc_html__( 'Side Cart requires %s to be installed and active.', 'side-cart' ),
				'<a href="https://woocommerce.com/" target="_blank" rel="noopener noreferrer">WooCommerce</a>'
			);
			?>
		</p>
	</div>
	<?php
}
