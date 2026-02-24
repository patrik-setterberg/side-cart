<?php
/**
 * Autoloader for the SideCart namespace.
 *
 * Maps SideCart\ClassName to includes/class-classname.php.
 *
 * @package SideCart
 */

defined( 'ABSPATH' ) || exit;

// Load helper functions first (needed by other classes).
require_once SCRT_PLUGIN_DIR . 'includes/helpers.php';

// Autoloader for classes
spl_autoload_register(
	function ( string $class_name ): void {
		// Only handle classes in the SideCart namespace.
		if ( strpos( $class_name, 'SideCart\\' ) !== 0 ) {
			return;
		}

		// Strip the namespace prefix.
		$relative = substr( $class_name, strlen( 'SideCart\\' ) );

		// Convert namespace separators to directory separators and build
		// a WP-style filename: ClassName -> class-classname.php
		// Replace underscores with hyphens for WordPress naming convention.
		$parts    = explode( '\\', $relative );
		$filename = 'class-' . str_replace( '_', '-', strtolower( implode( DIRECTORY_SEPARATOR, $parts ) ) ) . '.php';

		$file = SCRT_PLUGIN_DIR . 'includes' . DIRECTORY_SEPARATOR . $filename;

		if ( file_exists( $file ) ) {
			require_once $file;
		}
	}
);
