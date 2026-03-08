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
	 * Accepted attributes:
	 *   text       - Button label (default: "Cart")
	 *   icon       - Icon type: bag | handbag | cart | basket (default: "bag")
	 *   show_badge - Show item count badge: 1|true or 0|false (default: true)
	 *   class      - Extra CSS class(es)
	 *   id         - Element ID
	 *
	 * Style overrides (all optional — falls back to CSS defaults):
	 *   bg         - Button background color (hex)
	 *   color      - Text & icon color (hex)
	 *   font_size  - Font size in px (integer)
	 *   icon_size  - Icon size in px (integer)
	 *   radius     - Border radius in px (integer)
	 *   badge_bg   - Badge background color (hex)
	 *   badge_color - Badge text color (hex)
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public function render_shortcode( $atts ): string {
		$atts = shortcode_atts(
			array(
				'text'        => __( 'Cart', 'side-cart' ),
				'icon'        => 'bag',
				'show_badge'  => '1',
				'class'       => '',
				'id'          => '',
				'bg'          => '',
				'color'       => '',
				'font_size'   => '',
				'icon_size'   => '',
				'radius'      => '',
				'badge_bg'    => '',
				'badge_color' => '',
			),
			$atts,
			'side_cart_trigger'
		);

		// Build scoped inline CSS vars from any style attributes that were set.
		$vars = array();

		if ( ! empty( $atts['bg'] ) ) {
			$vars[] = '--scrt-trigger-bg: ' . sanitize_hex_color( $atts['bg'] ) . ';';
		}
		if ( ! empty( $atts['color'] ) ) {
			$vars[] = '--scrt-trigger-color: ' . sanitize_hex_color( $atts['color'] ) . ';';
		}
		if ( ! empty( $atts['font_size'] ) ) {
			$vars[] = '--scrt-trigger-font-size: ' . absint( $atts['font_size'] ) . 'px;';
		}
		if ( ! empty( $atts['icon_size'] ) ) {
			$vars[] = '--scrt-trigger-icon-size: ' . absint( $atts['icon_size'] ) . 'px;';
		}
		if ( ! empty( $atts['radius'] ) ) {
			$vars[] = '--scrt-trigger-radius: ' . absint( $atts['radius'] ) . 'px;';
		}
		if ( ! empty( $atts['badge_bg'] ) ) {
			$vars[] = '--scrt-trigger-badge-bg: ' . sanitize_hex_color( $atts['badge_bg'] ) . ';';
		}
		if ( ! empty( $atts['badge_color'] ) ) {
			$vars[] = '--scrt-trigger-badge-color: ' . sanitize_hex_color( $atts['badge_color'] ) . ';';
		}

		ob_start();
		scrt_get_template(
			'cart-trigger.php',
			array(
				'text'       => sanitize_text_field( $atts['text'] ),
				'show_badge' => filter_var( $atts['show_badge'], FILTER_VALIDATE_BOOLEAN ),
				'icon'       => sanitize_text_field( $atts['icon'] ),
				'class'      => sanitize_text_field( $atts['class'] ),
				'id'         => sanitize_text_field( $atts['id'] ),
				'style'      => implode( ' ', $vars ),
			)
		);
		return ob_get_clean();
	}
}
