<?php
/**
 * Cart trigger block registration.
 *
 * Registers the side-cart/cart-trigger Gutenberg block.
 *
 * @package SideCart
 */

namespace SideCart;

defined( 'ABSPATH' ) || exit;

/**
 * Class Trigger_Block
 */
class Trigger_Block {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_block' ) );
	}

	/**
	 * Register the cart trigger block.
	 *
	 * @return void
	 */
	public function register_block(): void {
		register_block_type(
			SCRT_PLUGIN_DIR . '/build/blocks/cart-trigger',
			array(
				'render_callback' => array( $this, 'render_block' ),
			)
		);
	}

	/**
	 * Render the block.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $content    Block inner content.
	 * @return string
	 */
	public function render_block( $attributes, $content ): string {
		$text       = $attributes['text'] ?? __( 'Cart', 'side-cart' );
		$show_badge = $attributes['showBadge'] ?? true;
		$icon       = $attributes['icon'] ?? 'bag';
		$class_name = $attributes['className'] ?? '';

		ob_start();
		scrt_get_template(
			'cart-trigger.php',
			array(
				'text'       => $text,
				'show_badge' => $show_badge,
				'icon'       => $icon,
				'class'      => $class_name,
				'id'         => '',
			)
		);
		return ob_get_clean();
	}
}
