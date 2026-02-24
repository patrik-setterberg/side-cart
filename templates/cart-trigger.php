<?php
/**
 * Cart Trigger Template
 *
 * Shared trigger button template used by shortcode and block.
 *
 * @version 1.0.0
 * @package SideCart
 *
 * @var string $text         Button text.
 * @var bool   $show_badge   Whether to show the badge.
 * @var string $icon         Icon type (bag, cart, basket).
 * @var string $class        Additional CSS classes.
 * @var string $id           Element ID.
 */

defined( 'ABSPATH' ) || exit;

$text       = $text ?? __( 'Cart', 'side-cart' );
$show_badge = $show_badge ?? true;
$icon       = $icon ?? 'bag';
$class      = $class ?? '';
$id         = $id ?? '';

$button_classes = array( 'scrt-trigger' );
if ( ! empty( $class ) ) {
	$button_classes[] = $class;
}

$icon_svg = scrt_get_cart_icon_svg( $icon );
?>

<button
	<?php if ( ! empty( $id ) ) : ?>
		id="<?php echo esc_attr( $id ); ?>"
	<?php endif; ?>
	class="<?php echo esc_attr( implode( ' ', $button_classes ) ); ?>"
	type="button"
	aria-label="<?php esc_attr_e( 'Open cart', 'side-cart' ); ?>"
	aria-expanded="false"
	data-wp-interactive="side-cart"
	data-wp-on--click="actions.toggle"
	data-wp-bind--aria-expanded="state.isOpen"
>
	<?php if ( ! empty( $icon ) ) : ?>
		<span class="scrt-trigger__icon">
			<?php echo wp_kses( $icon_svg, scrt_get_svg_allowed_tags() ); ?>
		</span>
	<?php endif; ?>

	<?php if ( ! empty( $text ) ) : ?>
		<span class="scrt-trigger__text"><?php echo esc_html( $text ); ?></span>
	<?php endif; ?>

	<?php if ( $show_badge ) : ?>
		<span
			class="scrt-trigger__badge"
			data-wp-text="state.badgeCount"
			data-wp-bind--hidden="state.badgeCount === 0"
			data-scrt-badge
		></span>
	<?php endif; ?>
</button>
