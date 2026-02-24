<?php
/**
 * Cart trigger shortcode.
 *
 * Registers [side_cart_trigger] shortcode.
 *
 * @package SideCart
 */

namespace SideCart;

defined( 'ABSPATH' ) || exit;

/**
 * Class Trigger_Shortcode
 */
class Trigger_Shortcode {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_shortcode( 'side_cart_trigger', array( $this, 'render_shortcode' ) );
	}

	/**
	 * Render the shortcode.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public function render_shortcode( $atts ): string {
		$atts = shortcode_atts(
			array(
				'text'       => __( 'Cart', 'side-cart' ),
				'show_badge' => 'true',
				'icon'       => 'bag',
				'class'      => '',
				'id'         => '',
			),
			$atts,
			'side_cart_trigger'
		);

		// Convert show_badge to boolean.
		$show_badge = filter_var( $atts['show_badge'], FILTER_VALIDATE_BOOLEAN );

		ob_start();
		scrt_get_template(
			'cart-trigger.php',
			array(
				'text'       => sanitize_text_field( $atts['text'] ),
				'show_badge' => $show_badge,
				'icon'       => sanitize_text_field( $atts['icon'] ),
				'class'      => sanitize_text_field( $atts['class'] ),
				'id'         => sanitize_text_field( $atts['id'] ),
			)
		);
		return ob_get_clean();
	}
}
