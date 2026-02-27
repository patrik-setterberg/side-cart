<?php
/**
 * Cart renderer with Interactivity API state initialization.
 *
 * Outputs the cart drawer HTML and initializes the Interactivity API state.
 *
 * @package SideCart
 */

namespace SideCart;

defined( 'ABSPATH' ) || exit;

/**
 * Class Cart_Renderer
 */
class Cart_Renderer {

	/**
	 * Plugin settings.
	 *
	 * @var array
	 */
	private array $settings;

	/**
	 * REST API instance.
	 *
	 * @var Rest_API
	 */
	private Rest_API $rest_api;

	/**
	 * Constructor.
	 *
	 * @param Rest_API $rest_api REST API instance.
	 */
	public function __construct( Rest_API $rest_api ) {
		$this->rest_api = $rest_api;
		$this->settings = $rest_api->get_all_settings();

		// Initialize state during wp_enqueue_scripts (required for Interactivity API).
		// We use priority 100 to ensure it runs after WooCommerce's scripts are enqueued.
		add_action( 'wp_enqueue_scripts', array( $this, 'init_state' ), 100 );

		// Render templates in footer.
		add_action( 'wp_footer', array( $this, 'render_cart_drawer' ) );

		if ( $this->settings['show_floating_basket'] ) {
			add_action( 'wp_footer', array( $this, 'render_floating_basket' ) );
		}
	}

	/**
	 * Initialize Interactivity API state.
	 *
	 * Must be called during wp_enqueue_scripts to ensure state is registered
	 * before WordPress outputs the script tag.
	 *
	 * @return void
	 */
	public function init_state(): void {
		if ( ! $this->should_render() ) {
			return;
		}

		$state = $this->get_initial_state();

		// Initialize Interactivity API state.
		if ( function_exists( 'wp_interactivity_state' ) ) {
			wp_interactivity_state( 'side-cart', $state );
		} else {
			// Fallback for older WordPress versions - output state manually.
			add_action(
				'wp_footer',
				function () use ( $state ) {
					printf(
						'<script type="application/json" id="wp-interactivity-data-side-cart">%s</script>',
						wp_json_encode( array( 'state' => array( 'side-cart' => $state ) ), JSON_HEX_TAG | JSON_HEX_AMP )
					);
				},
				1 // Very early in wp_footer.
			);
		}
	}

	/**
	 * Render the cart drawer.
	 *
	 * @return void
	 */
	public function render_cart_drawer(): void {
		if ( ! $this->should_render() ) {
			return;
		}

		// Render the drawer template (state already initialized in init_state).
		scrt_get_template( 'cart-drawer.php', array( 'settings' => $this->settings ) );
	}

	/**
	 * Render the floating basket button.
	 *
	 * @return void
	 */
	public function render_floating_basket(): void {
		if ( ! $this->should_render() ) {
			return;
		}

		scrt_get_template( 'floating-basket.php', array( 'settings' => $this->settings ) );
	}

	/**
	 * Check if cart should be rendered on this page.
	 *
	 * @return bool
	 */
	private function should_render(): bool {
		// Don't render if disabled.
		if ( ! $this->settings['enabled'] ) {
			return false;
		}

		// Don't render on admin pages.
		if ( is_admin() ) {
			return false;
		}

		// Don't render on cart page if setting is enabled.
		if ( $this->settings['hide_on_cart_page'] && is_cart() ) {
			return false;
		}

		// Don't render on checkout page if setting is enabled.
		if ( $this->settings['hide_on_checkout'] && is_checkout() ) {
			return false;
		}

		// Check if current page is in disabled pages list.
		if ( ! empty( $this->settings['disabled_pages'] ) && is_page( $this->settings['disabled_pages'] ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Get initial Interactivity API state.
	 *
	 * @return array
	 */
	private function get_initial_state(): array {
		// Ensure WooCommerce is available.
		if ( ! function_exists( 'WC' ) ) {
			return $this->get_empty_state();
		}

		// Ensure cart is initialized and session loaded.
		if ( ! did_action( 'woocommerce_cart_loaded_from_session' ) ) {
			// Try to initialize the cart session.
			if ( WC()->cart ) {
				WC()->cart->get_cart();
			}
		}

		if ( ! WC()->cart ) {
			return $this->get_empty_state();
		}

		$cart = WC()->cart;

		// Ensure cart totals are calculated.
		$cart->calculate_totals();

		if ( $cart->is_empty() ) {
			return $this->get_empty_state();
		}

		// Compute stock status labels - use WooCommerce defaults or custom overrides.
		$wc_stock_labels     = wc_get_product_stock_status_options();
		$override            = ! empty( $this->settings['stock_status_label_override'] );
		$stock_status_labels = array(
			'instock'     => ( $override && ! empty( $this->settings['stock_status_label_instock'] ) )
				? $this->settings['stock_status_label_instock']
				: $wc_stock_labels['instock'],
			'outofstock'  => ( $override && ! empty( $this->settings['stock_status_label_outofstock'] ) )
				? $this->settings['stock_status_label_outofstock']
				: $wc_stock_labels['outofstock'],
			'onbackorder' => ( $override && ! empty( $this->settings['stock_status_label_onbackorder'] ) )
				? $this->settings['stock_status_label_onbackorder']
				: $wc_stock_labels['onbackorder'],
		);

		$items = array();

		foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
			$product = $cart_item['data'];

			if ( ! $product ) {
				continue;
			}

			// Get thumbnail URL instead of HTML.
			$thumbnail_id  = $product->get_image_id();
			$thumbnail_url = '';
			if ( $thumbnail_id ) {
				$thumbnail_url = wp_get_attachment_image_url( $thumbnail_id, 'thumbnail' );
			}

			// Fallback to placeholder if no image.
			if ( ! $thumbnail_url ) {
				$thumbnail_url = wc_placeholder_img_src( 'thumbnail' );
			}

			// Get maximum quantity - check stock management.
			$max_qty = 9999;
			if ( $product->managing_stock() ) {
				$stock_qty = $product->get_stock_quantity();
				if ( $stock_qty !== null ) {
					$max_qty = max( 1, $stock_qty );
				}
			} elseif ( ! $product->is_in_stock() ) {
				$max_qty = $cart_item['quantity']; // Can't increase beyond current quantity if out of stock.
			}

			// Format prices as plain text instead of HTML for Interactivity API compatibility
			$price_args      = array( 'decimals' => wc_get_price_decimals() );
			$formatted_price = strip_tags( wc_price( $product->get_price(), $price_args ) );
			$formatted_total = strip_tags( wc_price( $cart_item['line_total'], $price_args ) );

			$item_data = array(
				'key'          => $cart_item_key,
				'productId'    => $cart_item['product_id'],
				'name'         => html_entity_decode( $product->get_name(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'quantity'     => $cart_item['quantity'],
				'price'        => html_entity_decode( $formatted_price, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'lineTotal'    => html_entity_decode( $formatted_total, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'thumbnailUrl' => $thumbnail_url,
				'permalink'    => $product->get_permalink(),
				'sku'              => $product->get_sku(),
				'maxQty'           => $max_qty,
				'stockStatus'      => $product->get_stock_status(),
				'stockStatusLabel' => $stock_status_labels[ $product->get_stock_status() ] ?? $product->get_stock_status(),
			);

			// Add variation data if applicable.
			if ( isset( $cart_item['variation'] ) && ! empty( $cart_item['variation'] ) ) {
				$variation_data = array();
				foreach ( $cart_item['variation'] as $key => $value ) {
					$variation_data[] = array(
						'key'       => $key,
						'attribute' => wc_attribute_label( $key, $product ),
						'value'     => $value,
					);
				}
				$item_data['variation'] = $variation_data;
			}

			$items[] = apply_filters( 'scrt_cart_item_data', $item_data, $cart_item, $product );
		}

		$free_shipping_threshold = $this->get_free_shipping_threshold();

		// Format totals as plain text for Interactivity API
		$formatted_subtotal = strip_tags( wc_price( $cart->get_subtotal(), $price_args ) );
		$formatted_total    = strip_tags( wc_price( $cart->get_total( 'edit' ), $price_args ) );

		$state = array(
			'isOpen'                  => false,
			'isLoading'               => false,
			'autoOpen'                => (bool) $this->settings['auto_open'],
			'showItemCountInHeader'   => (bool) $this->settings['show_item_count_in_header'],
			'drawerHeadingText'       => html_entity_decode( esc_html( $this->settings['drawer_heading_text'] ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'headerItemSingular'      => __( 'item', 'side-cart' ),
			'headerItemPlural'        => __( 'items', 'side-cart' ),
			'items'                   => $items,
			'totalItems'              => $cart->get_cart_contents_count(),
			'totalUniqueItems'        => count( $cart->get_cart() ),
			'subtotal'                => html_entity_decode( $formatted_subtotal, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'cartTotal'               => html_entity_decode( $formatted_total, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'currency'                => get_woocommerce_currency_symbol(),
			'freeShippingThreshold'   => $free_shipping_threshold,
			'cartUrl'                 => wc_get_cart_url(),
			'checkoutUrl'             => wc_get_checkout_url(),
			'storeApiNonce'           => wp_create_nonce( 'wc_store_api' ),
			'storeApiBase'            => esc_url_raw( rest_url( 'wc/store/v1/' ) ),
			'customTriggerSelector'   => $this->settings['custom_trigger_selector'],
			'badgeCountMode'          => $this->settings['badge_count_mode'],
			'stockStatusLabels'       => $stock_status_labels,
			'appliedCoupons'          => $cart->get_applied_coupons(),
			'toasts'                  => array(),
			'lastError'               => null,
		);

		return apply_filters( 'scrt_interactivity_state', $state );
	}

	/**
	 * Get empty cart state.
	 *
	 * @return array
	 */
	private function get_empty_state(): array {
		// Compute stock status labels so refreshCart() works after an AJAX add-to-cart
		// even when the cart was empty on page load.
		$wc_stock_labels     = function_exists( 'wc_get_product_stock_status_options' ) ? wc_get_product_stock_status_options() : array();
		$override            = ! empty( $this->settings['stock_status_label_override'] );
		$stock_status_labels = array(
			'instock'     => ( $override && ! empty( $this->settings['stock_status_label_instock'] ) )
				? $this->settings['stock_status_label_instock']
				: ( $wc_stock_labels['instock'] ?? 'In stock' ),
			'outofstock'  => ( $override && ! empty( $this->settings['stock_status_label_outofstock'] ) )
				? $this->settings['stock_status_label_outofstock']
				: ( $wc_stock_labels['outofstock'] ?? 'Out of stock' ),
			'onbackorder' => ( $override && ! empty( $this->settings['stock_status_label_onbackorder'] ) )
				? $this->settings['stock_status_label_onbackorder']
				: ( $wc_stock_labels['onbackorder'] ?? 'On backorder' ),
		);

		return array(
			'isOpen'                  => false,
			'isLoading'               => false,
			'autoOpen'                => (bool) $this->settings['auto_open'],
			'showItemCountInHeader'   => (bool) $this->settings['show_item_count_in_header'],
			'drawerHeadingText'       => html_entity_decode( esc_html( $this->settings['drawer_heading_text'] ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'headerItemSingular'      => __( 'item', 'side-cart' ),
			'headerItemPlural'        => __( 'items', 'side-cart' ),
			'items'                   => array(),
			'totalItems'              => 0,
			'totalUniqueItems'        => 0,
			'subtotal'                => wc_price( 0 ),
			'cartTotal'               => wc_price( 0 ),
			'currency'                => get_woocommerce_currency_symbol(),
			'freeShippingThreshold'   => null,
			'cartUrl'                 => wc_get_cart_url(),
			'checkoutUrl'             => wc_get_checkout_url(),
			'storeApiNonce'           => wp_create_nonce( 'wc_store_api' ),
			'storeApiBase'            => esc_url_raw( rest_url( 'wc/store/v1/' ) ),
			'customTriggerSelector'   => $this->settings['custom_trigger_selector'],
			'badgeCountMode'          => $this->settings['badge_count_mode'],
			'stockStatusLabels'       => $stock_status_labels,
			'appliedCoupons'          => array(),
			'toasts'                  => array(),
			'lastError'               => null,
		);
	}

	/**
	 * Get free shipping threshold from WooCommerce settings.
	 *
	 * @return float|null Threshold amount or null if not configured.
	 */
	private function get_free_shipping_threshold(): ?float {
		$shipping_zones = \WC_Shipping_Zones::get_zones();

		foreach ( $shipping_zones as $zone ) {
			foreach ( $zone['shipping_methods'] as $method ) {
				if ( $method->id === 'free_shipping' && $method->enabled === 'yes' ) {
					$min_amount = $method->get_option( 'min_amount' );

					if ( ! empty( $min_amount ) ) {
						return (float) $min_amount;
					}
				}
			}
		}

		// Check worldwide zone (zone ID 0).
		$worldwide_zone = new \WC_Shipping_Zone( 0 );
		$methods        = $worldwide_zone->get_shipping_methods( true );

		foreach ( $methods as $method ) {
			if ( $method->id === 'free_shipping' && $method->enabled === 'yes' ) {
				$min_amount = $method->get_option( 'min_amount' );

				if ( ! empty( $min_amount ) ) {
					return (float) $min_amount;
				}
			}
		}

		return null;
	}
}
