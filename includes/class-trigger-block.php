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
		$text       = ! empty( $attributes['triggerText'] ) ? $attributes['triggerText'] : __( 'Cart', 'side-cart' );
		$show_badge = $attributes['showBadge'] ?? true;
		$icon       = $attributes['icon'] ?? 'bag';
		$class_name = $attributes['className'] ?? '';

		// Build scoped inline CSS custom properties for this block instance.
		$defaults = array(
			'triggerBg'          => '#111111',
			'triggerColor'       => '#ffffff',
			'triggerFontSize'    => 14,
			'triggerIconSize'    => 20,
			'triggerRadius'      => 4,
			'triggerBadgeBg'     => '#ef4444',
			'triggerBadgeColor'  => '#ffffff',
		);

		$var_map = array(
			'triggerBg'         => array( '--scrt-trigger-bg', 'color' ),
			'triggerColor'      => array( '--scrt-trigger-color', 'color' ),
			'triggerFontSize'   => array( '--scrt-trigger-font-size', 'px' ),
			'triggerIconSize'   => array( '--scrt-trigger-icon-size', 'px' ),
			'triggerRadius'     => array( '--scrt-trigger-radius', 'px' ),
			'triggerBadgeBg'    => array( '--scrt-trigger-badge-bg', 'color' ),
			'triggerBadgeColor' => array( '--scrt-trigger-badge-color', 'color' ),
		);

		$vars = array();
		foreach ( $var_map as $attr_key => $data ) {
			list( $css_var, $type ) = $data;
			$value                  = $attributes[ $attr_key ] ?? $defaults[ $attr_key ];
			if ( $value !== $defaults[ $attr_key ] ) {
				if ( 'color' === $type ) {
					$vars[] = $css_var . ': ' . sanitize_hex_color( $value ) . ';';
				} else {
					$vars[] = $css_var . ': ' . absint( $value ) . 'px;';
				}
			}
		}

		$style = ! empty( $vars ) ? implode( ' ', $vars ) : '';

		ob_start();
		scrt_get_template(
			'cart-trigger.php',
			array(
				'text'       => $text,
				'show_badge' => $show_badge,
				'icon'       => $icon,
				'class'      => $class_name,
				'id'         => '',
				'style'      => $style,
			)
		);
		return ob_get_clean();
	}
}
