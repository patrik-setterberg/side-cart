<?php
/**
 * Autoloader for the SideCart namespace.
 *
 * Maps SideCart\ClassName to includes/class-classname.php.
 *
 * @package SideCart
 */

defined( 'ABSPATH' ) || exit;

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
		$parts    = explode( '\\', $relative );
		$filename = 'class-' . strtolower( implode( DIRECTORY_SEPARATOR, $parts ) ) . '.php';

		$file = SCRT_PLUGIN_DIR . 'includes' . DIRECTORY_SEPARATOR . $filename;

		if ( file_exists( $file ) ) {
			require_once $file;
		}
	}
);
