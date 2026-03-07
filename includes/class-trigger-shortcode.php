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
				'class' => '',
				'id'    => '',
			),
			$atts,
			'side_cart_trigger'
		);

		$saved_settings = get_option( Rest_API::OPTION_KEY, array() );
		$text           = $saved_settings['trigger_text'] ?? __( 'Cart', 'side-cart' );
		$show_badge     = $saved_settings['show_trigger_badge'] ?? true;
		$icon           = $saved_settings['cart_icon'] ?? 'bag';

		ob_start();
		scrt_get_template(
			'cart-trigger.php',
			array(
				'text'       => $text,
				'show_badge' => $show_badge,
				'icon'       => $icon,
				'class'      => sanitize_text_field( $atts['class'] ),
				'id'         => sanitize_text_field( $atts['id'] ),
			)
		);
		return ob_get_clean();
	}
}
