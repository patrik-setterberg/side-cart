<?php
/**
 * Template loader with theme override support.
 *
 * Provides the scrt_get_template() function and template versioning.
 *
 * @package SideCart
 */

namespace SideCart;

defined( 'ABSPATH' ) || exit;

/**
 * Class Template_Loader
 */
class Template_Loader {

	/**
	 * Template version (increment when templates change).
	 */
	const TEMPLATE_VERSION = '1.0.0';

	/**
	 * Get template file.
	 *
	 * Resolves templates in this order:
	 * 1. Child theme / side-cart/{template-name}.php
	 * 2. Parent theme / side-cart/{template-name}.php
	 * 3. Plugin / templates/{template-name}.php
	 *
	 * @param string $template_name Template filename (e.g. 'cart-drawer.php').
	 * @param array  $args          Variables to extract into the template scope.
	 * @param string $template_path Subdirectory in theme (default: 'side-cart').
	 * @return void
	 */
	public static function get_template( string $template_name, array $args = array(), string $template_path = '' ): void {
		if ( empty( $template_path ) ) {
			$template_path = 'side-cart';
		}

		$located = self::locate_template( $template_name, $template_path );

		if ( ! $located ) {
			return;
		}

		// Extract args into local scope.
		// phpcs:ignore WordPress.PHP.DontExtract.extract_extract
		extract( $args );

		/**
		 * Fires before a template is included.
		 *
		 * @param string $template_name Template filename.
		 * @param string $located       Full path to the located template.
		 * @param array  $args          Template arguments.
		 */
		do_action( 'scrt_before_template', $template_name, $located, $args );

		include $located;

		/**
		 * Fires after a template is included.
		 *
		 * @param string $template_name Template filename.
		 * @param string $located       Full path to the located template.
		 * @param array  $args          Template arguments.
		 */
		do_action( 'scrt_after_template', $template_name, $located, $args );
	}

	/**
	 * Locate a template file.
	 *
	 * @param string $template_name Template filename.
	 * @param string $template_path Subdirectory in theme.
	 * @return string|false Full path to template or false if not found.
	 */
	public static function locate_template( string $template_name, string $template_path = 'side-cart' ) {
		$template_path = apply_filters( 'scrt_template_path', $template_path );

		// Child theme.
		$child_theme_file = get_stylesheet_directory() . '/' . $template_path . '/' . $template_name;
		if ( file_exists( $child_theme_file ) ) {
			$located = $child_theme_file;
		}

		// Parent theme (if different from child).
		if ( ! isset( $located ) && get_stylesheet_directory() !== get_template_directory() ) {
			$parent_theme_file = get_template_directory() . '/' . $template_path . '/' . $template_name;
			if ( file_exists( $parent_theme_file ) ) {
				$located = $parent_theme_file;
			}
		}

		// Plugin fallback.
		if ( ! isset( $located ) ) {
			$plugin_file = SCRT_PLUGIN_DIR . 'templates/' . $template_name;
			if ( file_exists( $plugin_file ) ) {
				$located = $plugin_file;
			}
		}

		/**
		 * Filter the located template path.
		 *
		 * @param string|false $located       Located template path or false.
		 * @param string       $template_name Template filename.
		 * @param string       $template_path Theme subdirectory.
		 */
		return apply_filters( 'scrt_locate_template', $located ?? false, $template_name, $template_path );
	}

	/**
	 * Check if theme has overridden templates and if they're outdated.
	 *
	 * Displays an admin notice if template versions don't match.
	 *
	 * @return void
	 */
	public static function check_template_versions(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$templates = array( 'cart-drawer.php', 'floating-basket.php', 'cart-trigger.php' );
		$outdated  = array();

		foreach ( $templates as $template ) {
			$theme_file = self::locate_template( $template );

			// Skip if using plugin template (not overridden).
			if ( false === $theme_file || strpos( $theme_file, SCRT_PLUGIN_DIR ) !== false ) {
				continue;
			}

			$theme_version = self::get_template_version( $theme_file );

			if ( version_compare( $theme_version, self::TEMPLATE_VERSION, '<' ) ) {
				$outdated[] = $template;
			}
		}

		if ( ! empty( $outdated ) ) {
			add_action( 'admin_notices', function () use ( $outdated ) {
				?>
				<div class="notice notice-warning">
					<p>
						<strong><?php esc_html_e( 'Side Cart:', 'side-cart' ); ?></strong>
						<?php
						printf(
							/* translators: %s: comma-separated list of template files */
							esc_html__( 'Your theme has overridden the following templates, but they are outdated: %s. Please update them to match the plugin version.', 'side-cart' ),
							'<code>' . esc_html( implode( '</code>, <code>', $outdated ) ) . '</code>'
						);
						?>
					</p>
				</div>
				<?php
			} );
		}
	}

	/**
	 * Get template version from file header comment.
	 *
	 * Reads the @version tag from the template file.
	 *
	 * @param string $file Full path to template file.
	 * @return string Version string or '1.0.0' if not found.
	 */
	private static function get_template_version( string $file ): string {
		if ( ! file_exists( $file ) ) {
			return '1.0.0';
		}

		$file_data = get_file_data(
			$file,
			array(
				'version' => 'Version',
			)
		);

		return $file_data['version'] ?? '1.0.0';
	}
}
