<?php
/**
 * Floating Basket Template
 *
 * Renders the floating cart button with badge.
 *
 * @version 1.0.0
 * @package SideCart
 *
 * @var array $settings Plugin settings array.
 */

defined( 'ABSPATH' ) || exit;

$position_class = 'scrt-basket--' . esc_attr( $settings['basket_position'] );
$icon_svg       = scrt_get_cart_icon_svg( $settings['cart_icon'] );
?>

<button
	class="scrt-basket <?php echo esc_attr( $position_class ); ?>"
	type="button"
	aria-label="<?php esc_attr_e( 'Open cart', 'side-cart' ); ?>"
	aria-expanded="false"
	data-wp-interactive="side-cart"
	data-wp-on--click="actions.toggle"
	data-wp-bind--aria-expanded="state.isOpen"
>
	<span class="scrt-basket__icon">
		<?php echo wp_kses( apply_filters( 'scrt_floating_basket_icon', $icon_svg, $settings['cart_icon'] ), scrt_get_svg_allowed_tags() ); ?>
	</span>

	<span
		class="scrt-basket__badge"
		data-wp-text="state.badgeCount"
		data-wp-bind--hidden="!state.totalItems"
		aria-label="<?php esc_attr_e( 'Items in cart', 'side-cart' ); ?>"
	></span>
</button>
