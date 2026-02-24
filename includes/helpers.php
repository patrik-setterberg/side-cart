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
	$icons = array(
		'bag'    => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
		'cart'   => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
		'basket' => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 9 1.5 12h11L19 9"></path><path d="M2 9h20"></path><path d="M7.5 9V5a3.5 3.5 0 0 1 7 0v4"></path></svg>',
	);

	return $icons[ $icon ] ?? $icons['bag'];
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
