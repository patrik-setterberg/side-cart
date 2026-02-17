<?php
/**
 * Core plugin class.
 *
 * Singleton that wires all hooks and bootstraps sub-components.
 *
 * @package SideCart
 */

namespace SideCart;

defined( 'ABSPATH' ) || exit;

/**
 * Class Plugin
 */
final class Plugin {

	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static ?Plugin $instance = null;

	/**
	 * Returns (and creates on first call) the singleton instance.
	 */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor — private to enforce singleton.
	 */
	private function __construct() {
		$this->init_hooks();
	}

	/**
	 * Wire up all WordPress hooks.
	 */
	private function init_hooks(): void {
		add_action( 'init', array( $this, 'load_textdomain' ) );
	}

	/**
	 * Load plugin text domain for translations.
	 */
	public function load_textdomain(): void {
		load_plugin_textdomain(
			'side-cart',
			false,
			dirname( plugin_basename( SCRT_PLUGIN_FILE ) ) . '/languages'
		);
	}
}
