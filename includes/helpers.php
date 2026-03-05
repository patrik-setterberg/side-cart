<?php
/**
 * Helper functions.
 *
 * Global helper functions for the plugin.
 *
 * @package SideCart
 */

defined( 'ABSPATH' ) || exit;

/**
 * Get cart icon SVG.
 *
 * @param string $icon Icon type (bag, cart, basket).
 * @return string SVG markup.
 */
function scrt_get_cart_icon_svg( string $icon = 'bag' ): string {
	$o = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

	$icons = array(
		'bag'     => $o . '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" x2="21" y1="6" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
		'handbag' => $o . '<path d="M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z"></path><path d="M8 11V6a4 4 0 0 1 8 0v5"></path></svg>',
		'cart'    => $o . '<circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>',
		'basket'  => $o . '<path d="m5 11 4-7"></path><path d="m19 11-4-7"></path><path d="M2 11h20"></path><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"></path><path d="m9 11 1 9"></path><path d="M4.5 15.5h15"></path><path d="m15 11-1 9"></path></svg>',
	);

	return $icons[ $icon ] ?? $icons['bag'];
}

/**
 * Get remove-item icon SVG.
 *
 * @param string $icon Icon type (trash, x).
 * @return string SVG markup.
 */
function scrt_get_remove_icon_svg( string $icon = 'trash' ): string {
	$o = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

	$icons = array(
		'trash' => $o . '<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>',
		'x'     => $o . '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
	);

	return $icons[ $icon ] ?? $icons['trash'];
}

/**
 * Get quantity button icon SVG.
 *
 * @param string $type Icon type (plus, minus).
 * @return string SVG markup.
 */
function scrt_get_quantity_icon_svg( string $type ): string {
	$o = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

	$icons = array(
		'plus'  => $o . '<path d="M5 12h14"></path><path d="M12 5v14"></path></svg>',
		'minus' => $o . '<path d="M5 12h14"></path></svg>',
	);

	return $icons[ $type ] ?? '';
}

/**
 * Get toast icon SVG.
 *
 * @param string $type Icon type (circle-alert, info, circle-check).
 * @return string SVG markup.
 */
function scrt_get_toast_icon_svg( string $type ): string {
	$o = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

	$icons = array(
		'circle-alert' => $o . '<circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>',
		'info'         => $o . '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
		'circle-check' => $o . '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>',
	);

	return $icons[ $type ] ?? $icons['info'];
}

/**
 * Get allowed SVG tags for wp_kses.
 *
 * @return array Allowed tags array.
 */
function scrt_get_svg_allowed_tags(): array {
	return array(
		'svg'      => array(
			'class'           => true,
			'aria-hidden'     => true,
			'aria-labelledby' => true,
			'role'            => true,
			'xmlns'           => true,
			'width'           => true,
			'height'          => true,
			'viewbox'         => true,
			'viewBox'         => true,
			'fill'            => true,
			'stroke'          => true,
			'stroke-width'    => true,
			'stroke-linecap'  => true,
			'stroke-linejoin' => true,
		),
		'g'        => array(
			'fill' => true,
		),
		'title'    => array(
			'title' => true,
		),
		'path'     => array(
			'd'               => true,
			'fill'            => true,
			'stroke'          => true,
			'stroke-width'    => true,
			'stroke-linecap'  => true,
			'stroke-linejoin' => true,
		),
		'line'     => array(
			'x1'              => true,
			'y1'              => true,
			'x2'              => true,
			'y2'              => true,
			'stroke'          => true,
			'stroke-width'    => true,
			'stroke-linecap'  => true,
			'stroke-linejoin' => true,
		),
		'circle'   => array(
			'cx'              => true,
			'cy'              => true,
			'r'               => true,
			'fill'            => true,
			'stroke'          => true,
			'stroke-width'    => true,
		),
		'polyline' => array(
			'points'          => true,
			'fill'            => true,
			'stroke'          => true,
			'stroke-width'    => true,
			'stroke-linecap'  => true,
			'stroke-linejoin' => true,
		),
		'rect'     => array(
			'x'               => true,
			'y'               => true,
			'width'           => true,
			'height'          => true,
			'fill'            => true,
			'stroke'          => true,
			'stroke-width'    => true,
			'rx'              => true,
			'ry'              => true,
		),
	);
}

/**
 * Load a template file.
 *
 * Wrapper for Template_Loader::get_template().
 *
 * @param string $template_name Template filename.
 * @param array  $args          Variables to pass to template.
 * @param string $template_path Theme subdirectory (default: 'side-cart').
 * @return void
 */
function scrt_get_template( string $template_name, array $args = array(), string $template_path = '' ): void {
	\SideCart\Template_Loader::get_template( $template_name, $args, $template_path );
}
