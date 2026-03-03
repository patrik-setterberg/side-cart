<?php
/**
 * Cart Drawer Template
 *
 * This template outputs the cart drawer HTML with Interactivity API directives.
 *
 * @version 1.0.0
 * @package SideCart
 *
 * @var array $settings Plugin settings array.
 */

defined( 'ABSPATH' ) || exit;

$drawer_classes = apply_filters(
	'scrt_drawer_classes',
	array(
		'scrt-drawer',
		'scrt-drawer--' . esc_attr( $settings['drawer_position'] ),
		'scrt-drawer--animation-' . esc_attr( $settings['drawer_animation'] ),
	)
);
?>

<?php do_action( 'scrt_before_cart_drawer', $settings ); ?>

<div
	data-wp-interactive="side-cart"
	data-wp-watch="callbacks.watchOpen"
	data-wp-on--keydown="actions.onKeydown"
>
	<!-- Overlay -->
	<div
		class="scrt-overlay"
		data-wp-bind--hidden="!state.isOpen"
		data-wp-on--click="actions.close"
		aria-hidden="true"
	></div>

	<!-- Drawer -->
	<aside
		class="<?php echo esc_attr( implode( ' ', $drawer_classes ) ); ?>"
		role="dialog"
		aria-modal="true"
		aria-label="<?php echo esc_attr( $settings['drawer_heading_text'] ); ?>"
		data-wp-bind--hidden="!state.isOpen"
		data-wp-init="callbacks.initFocusTrap"
	>
		<!-- Header -->
		<div class="scrt-drawer__header">
			<?php if ( $settings['show_drawer_heading'] ) : ?>
				<h2 class="scrt-drawer__heading" data-wp-text="state.headerText"></h2>
			<?php endif; ?>
			<button
				class="scrt-drawer__close"
				type="button"
				aria-label="<?php esc_attr_e( 'Close cart', 'side-cart' ); ?>"
				data-wp-on--click="actions.close"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>

		<!-- Body -->
		<div class="scrt-drawer__body">
			<?php do_action( 'scrt_before_cart_items', $settings ); ?>

			<!-- Free Shipping Bar -->
			<?php if ( $settings['show_free_shipping_bar'] ) : ?>
				<div
					class="scrt-shipping-bar"
					data-wp-bind--hidden="!state.freeShippingThreshold"
				>
					<div class="scrt-shipping-bar__message" data-wp-text="state.freeShippingMessage"></div>
					<progress
						class="scrt-shipping-bar__progress"
						data-wp-bind--value="state.freeShippingPercent"
						max="100"
					></progress>
				</div>
			<?php endif; ?>

			<!-- Cart Items -->
			<div class="scrt-items" data-wp-bind--hidden="!state.hasItems">
				<ul class="scrt-items__list" aria-live="polite">
					<template data-wp-each--item="state.items">
						<li class="scrt-item" data-wp-key="context.item.key">
							<?php if ( $settings['show_item_image'] ) : ?>
								<div class="scrt-item__image">
									<a data-wp-bind--href="context.item.permalink">
										<img
											data-wp-bind--src="context.item.thumbnailUrl"
											data-wp-bind--alt="context.item.name"
											width="150"
											height="150"
											loading="lazy"
										>
									</a>
								</div>
							<?php endif; ?>

							<div class="scrt-item__details">
								<?php if ( $settings['show_item_name'] ) : ?>
									<h3 class="scrt-item__name">
										<a data-wp-bind--href="context.item.permalink" data-wp-text="context.item.name"></a>
									</h3>
								<?php endif; ?>

								<?php if ( $settings['show_item_sku'] ) : ?>
									<div class="scrt-item__sku" data-wp-bind--hidden="!context.item.sku">
										<?php esc_html_e( 'SKU:', 'side-cart' ); ?> <span data-wp-text="context.item.sku"></span>
									</div>
								<?php endif; ?>

								<?php if ( $settings['show_item_stock_status'] ) : ?>
									<div class="scrt-item__stock" data-wp-bind--data-status="context.item.stockStatus">
										<span data-wp-text="context.item.stockStatusLabel"></span>
									</div>
								<?php endif; ?>

								<?php if ( $settings['show_item_variation'] ) : ?>
									<div class="scrt-item__variation" data-wp-bind--hidden="!context.item.variation">
										<ul class="scrt-item__variation-list">
											<template data-wp-each--attr="context.item.variation">
												<li data-wp-key="context.attr.key">
													<span data-wp-text="context.attr.attribute"></span>:
													<span data-wp-text="context.attr.value"></span>
												</li>
											</template>
										</ul>
									</div>
								<?php endif; ?>

								<?php if ( $settings['show_item_price'] ) : ?>
									<div class="scrt-item__price">
										<?php if ( 'line_total' === $settings['item_price_mode'] ) : ?>
											<span data-wp-text="context.item.lineTotal"></span>
										<?php elseif ( $settings['show_sale_price'] ) : ?>
											<span data-wp-text="context.item.price"></span>
											<del class="scrt-item__price-regular" data-wp-bind--hidden="!context.item.onSale" data-wp-text="context.item.regularPrice"></del>
										<?php else : ?>
											<span data-wp-text="context.item.price"></span>
										<?php endif; ?>
									</div>
								<?php endif; ?>
							</div>

							<div class="scrt-item__actions">
								<?php if ( $settings['show_item_quantity'] ) : ?>
									<div class="scrt-item__quantity">
										<button
											class="scrt-qty-btn scrt-qty-btn--minus"
											type="button"
											aria-label="<?php esc_attr_e( 'Decrease quantity', 'side-cart' ); ?>"
											data-wp-bind--data-item-key="context.item.key"
											data-wp-on--click="actions.decreaseQuantity"
											data-wp-bind--disabled="context.item.quantity <= 1 || state.isLoading"
										>
											−
										</button>
										<input
											class="scrt-qty-input"
											type="number"
											min="1"
											data-wp-bind--max="context.item.maxQty"
											data-wp-bind--value="context.item.quantity"
											data-wp-bind--data-item-key="context.item.key"
											data-wp-on--change="actions.updateQuantity"
											data-wp-bind--disabled="state.isLoading"
											aria-label="<?php esc_attr_e( 'Quantity', 'side-cart' ); ?>"
										/>
										<button
											class="scrt-qty-btn scrt-qty-btn--plus"
											type="button"
											aria-label="<?php esc_attr_e( 'Increase quantity', 'side-cart' ); ?>"
											data-wp-bind--data-item-key="context.item.key"
											data-wp-on--click="actions.increaseQuantity"
											data-wp-bind--disabled="context.item.quantity >= context.item.maxQty || state.isLoading"
										>
											+
										</button>
									</div>
								<?php endif; ?>

								<?php if ( $settings['show_item_remove'] ) : ?>
									<button
										class="scrt-item__remove"
										type="button"
										aria-label="<?php esc_attr_e( 'Remove item', 'side-cart' ); ?>"
										data-wp-on--click="actions.removeItem"
										data-wp-bind--disabled="state.isLoading"
									>
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="3 6 5 6 21 6"></polyline>
											<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
										</svg>
									</button>
								<?php endif; ?>
							</div>
						</li>
					</template>
				</ul>
			</div>

			<!-- Empty State -->
			<div class="scrt-empty" data-wp-bind--hidden="state.hasItems">
				<?php if ( $settings['show_empty_state_icon'] ) : ?>
					<svg class="scrt-empty__icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="9" cy="21" r="1"></circle>
						<circle cx="20" cy="21" r="1"></circle>
						<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
					</svg>
				<?php endif; ?>
				<p class="scrt-empty__message"><?php echo esc_html( $settings['empty_state_message'] ); ?></p>
			</div>

			<?php if ( $settings['show_empty_cart_button'] ) : ?>
				<div class="scrt-empty-cart-wrap" data-wp-bind--hidden="!state.hasItems">
					<button
						class="scrt-button scrt-button--text scrt-button--empty-cart"
						type="button"
						data-wp-on--click="actions.emptyCart"
						data-wp-bind--disabled="state.isLoading"
					>
						<?php esc_html_e( 'Empty Cart', 'side-cart' ); ?>
					</button>
				</div>
			<?php endif; ?>

			<?php do_action( 'scrt_after_cart_items', $settings ); ?>
		</div>

		<!-- Footer -->
		<div class="scrt-drawer__footer" data-wp-bind--hidden="!state.hasItems">
			<!-- Coupon Input -->
			<?php if ( $settings['show_coupon_input'] ) : ?>
				<div class="scrt-coupon">
					<div class="scrt-coupon__input-group">
						<input
							class="scrt-coupon__input"
							type="text"
							placeholder="<?php esc_attr_e( 'Coupon code', 'side-cart' ); ?>"
							data-wp-bind--disabled="state.isLoading"
							aria-label="<?php esc_attr_e( 'Coupon code', 'side-cart' ); ?>"
							data-wp-on--keydown="actions.applyCouponOnEnter"
						/>
						<button
							class="scrt-coupon__button"
							type="button"
							data-wp-on--click="actions.applyCoupon"
							data-wp-bind--disabled="state.isLoading"
						>
							<?php esc_html_e( 'Apply', 'side-cart' ); ?>
						</button>
					</div>

					<!-- Applied Coupons -->
					<div class="scrt-coupon__chips" data-wp-bind--hidden="state.appliedCoupons.length === 0">
						<template data-wp-each--coupon="state.appliedCoupons">
							<span class="scrt-coupon__chip" data-wp-key="context.coupon">
								<span data-wp-text="context.coupon"></span>
								<button
									class="scrt-coupon__chip-remove"
									type="button"
									aria-label="<?php esc_attr_e( 'Remove coupon', 'side-cart' ); ?>"
									data-wp-on--click="actions.removeCoupon"
									data-wp-bind--disabled="state.isLoading"
								>
									×
								</button>
							</span>
						</template>
					</div>
				</div>
			<?php endif; ?>

			<!-- Cart Totals -->
			<?php if ( $settings['show_cart_totals'] ) : ?>
				<div class="scrt-totals">
					<?php if ( $settings['show_subtotal'] ) : ?>
						<div class="scrt-totals__row">
							<span class="scrt-totals__label"><?php esc_html_e( 'Subtotal', 'side-cart' ); ?></span>
							<span class="scrt-totals__value" data-wp-text="state.subtotal"></span>
						</div>
					<?php endif; ?>

					<?php if ( $settings['show_shipping'] ) : ?>
						<div class="scrt-totals__row">
							<span class="scrt-totals__label"><?php esc_html_e( 'Shipping', 'side-cart' ); ?></span>
							<span class="scrt-totals__value"><?php esc_html_e( 'Calculated at checkout', 'side-cart' ); ?></span>
						</div>
					<?php endif; ?>

					<?php if ( $settings['show_taxes'] ) : ?>
						<div class="scrt-totals__row">
							<span class="scrt-totals__label"><?php esc_html_e( 'Tax', 'side-cart' ); ?></span>
							<span class="scrt-totals__value"><?php esc_html_e( 'Calculated at checkout', 'side-cart' ); ?></span>
						</div>
					<?php endif; ?>

					<?php if ( $settings['show_discounts'] ) : ?>
						<div class="scrt-totals__row scrt-totals__row--discount" data-wp-bind--hidden="!state.hasDiscount">
							<span class="scrt-totals__label">
								<?php esc_html_e( 'Discount', 'side-cart' ); ?>
								<span class="scrt-totals__coupon-codes" data-wp-text="state.appliedCoupons.join(', ')"></span>
							</span>
							<span class="scrt-totals__value">−<span data-wp-text="state.discountTotal"></span></span>
						</div>
					<?php endif; ?>

					<?php if ( $settings['show_total'] ) : ?>
						<div class="scrt-totals__row scrt-totals__row--total">
							<span class="scrt-totals__label"><?php esc_html_e( 'Total', 'side-cart' ); ?></span>
							<span class="scrt-totals__value" data-wp-text="state.cartTotal"></span>
						</div>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<!-- Action Buttons -->
			<div class="scrt-actions">
				<?php if ( $settings['show_checkout_button'] ) : ?>
					<a
						class="scrt-button scrt-button--primary scrt-button--checkout"
						data-wp-bind--href="state.checkoutUrl"
					>
						<?php esc_html_e( 'Proceed to Checkout', 'side-cart' ); ?>
					</a>
				<?php endif; ?>

				<div class="scrt-actions__secondary">
					<?php if ( $settings['show_view_cart_button'] ) : ?>
						<a
							class="scrt-button scrt-button--secondary"
							data-wp-bind--href="state.cartUrl"
						>
							<?php esc_html_e( 'View Cart', 'side-cart' ); ?>
						</a>
					<?php endif; ?>

					<?php if ( $settings['show_continue_shopping'] ) : ?>
						<?php
						$continue_action = 'actions.close';
						if ( 'shop' === $settings['continue_shopping'] ) {
							$shop_url        = get_permalink( wc_get_page_id( 'shop' ) );
							$continue_action = "window.location.href = '" . esc_url( $shop_url ) . "'";
						} elseif ( 'custom' === $settings['continue_shopping'] && ! empty( $settings['continue_shopping_url'] ) ) {
							$continue_action = "window.location.href = '" . esc_url( $settings['continue_shopping_url'] ) . "'";
						}
						?>
						<button
							class="scrt-button scrt-button--secondary"
							type="button"
							data-wp-on--click="<?php echo esc_attr( $continue_action ); ?>"
						>
							<?php esc_html_e( 'Continue Shopping', 'side-cart' ); ?>
						</button>
					<?php endif; ?>

					</div>
			</div>
		</div>

		<!-- Loading Overlay -->
		<div class="scrt-loading" data-wp-bind--hidden="!state.isLoading">
			<div class="scrt-spinner"></div>
		</div>
	</aside>

	<!-- Toast Container -->
	<div class="scrt-toasts" aria-live="assertive" aria-atomic="true" data-wp-watch="callbacks.autoExpireToasts">
		<template data-wp-each--toast="state.toasts">
			<div
				class="scrt-toast scrt-toast--<?php echo esc_attr( 'context.toast.type' ); ?>"
				data-wp-key="context.toast.id"
				role="alert"
			>
				<span data-wp-text="context.toast.message"></span>
				<button
					class="scrt-toast__undo"
					type="button"
					data-wp-bind--hidden="!context.toast.undoItem"
					data-wp-on--click="actions.undoRemoveItem"
					data-wp-text="state.i18n.undo"
				></button>
			</div>
		</template>
	</div>
</div>

<?php do_action( 'scrt_after_cart_drawer', $settings ); ?>
