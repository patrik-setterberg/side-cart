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
 * @var string $icon         Icon type (bag, handbag, cart, basket).
 * @var string $class        Additional CSS classes.
 * @var string $id           Element ID.
 * @var string $style        Inline CSS (scoped custom properties for block instances).
 */

defined( 'ABSPATH' ) || exit;

$text       = $text ?? __( 'Cart', 'side-cart' );
$show_badge = $show_badge ?? true;
$icon       = $icon ?? 'bag';
$class      = $class ?? '';
$id         = $id ?? '';
$style      = $style ?? '';

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
	<?php if ( ! empty( $style ) ) : ?>
		style="<?php echo esc_attr( $style ); ?>"
	<?php endif; ?>
	type="button"
	aria-label="<?php esc_attr_e( 'Open cart', 'side-cart' ); ?>"
	aria-expanded="false"
	data-wp-interactive="side-cart"
	data-wp-on--click="actions.toggle"
	data-wp-bind--aria-expanded="state.isOpen"
	data-wp-bind--aria-label="state.triggerAriaLabel"
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
			data-wp-bind--hidden="!state.totalItems"
			data-scrt-badge
			hidden
		></span>
	<?php endif; ?>
</button>
