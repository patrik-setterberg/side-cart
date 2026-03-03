/**
 * Side Cart — Interactivity API Store
 *
 * All cart state management and actions for the frontend drawer.
 * Uses generator functions with yield for async operations (not async/await).
 *
 * @package SideCart
 */

import './view.css';
import { store, getContext } from '@wordpress/interactivity';
import { createCartApiRequests } from './api/cart-api';
import { transformCartToState } from './utils/cart-transformers';
import {
	createToastHelpers,
	initFocusTrap,
	watchOpen,
	initCustomTriggers,
} from './utils/ui-helpers';

// Debounce state for quantity stepper buttons and the qty input.
const quantityTimers = new Map(); // itemKey -> timerId
const pendingQuantities = new Map(); // itemKey -> pending quantity
const refocusTargets = new Set(); // item keys whose qty input should be re-focused after update
const buttonRefocusTargets = new Map(); // itemKey -> 'plus' | 'minus' button to re-focus after update

const { state, actions } = store( 'side-cart', {
	state: {
		// Derived state — must be defined here (inside store) to be reactive.

		get hasItems() {
			return state.items && state.items.length > 0;
		},

		get hasDiscount() {
			return state.discountAmount > 0;
		},

		get badgeCount() {
			if ( state.badgeCountMode === 'unique' ) {
				return state.totalUniqueItems;
			}
			return state.totalItems;
		},

		get headerText() {
			const count = state.totalUniqueItems;
			if ( count === 0 || ! state.showItemCountInHeader ) {
				return state.drawerHeadingText;
			}
			const word = count === 1 ? state.headerItemSingular : state.headerItemPlural;
			return `${ state.drawerHeadingText } (${ count } ${ word })`;
		},

		get freeShippingRemaining() {
			if ( ! state.freeShippingThreshold ) {
				return 0;
			}
			const subtotalNum = parseFloat(
				state.subtotal.replace( /[^\d.-]/g, '' )
			);
			return Math.max( 0, state.freeShippingThreshold - subtotalNum );
		},

		get freeShippingPercent() {
			if ( ! state.freeShippingThreshold ) {
				return 0;
			}
			const subtotalNum = parseFloat(
				state.subtotal.replace( /[^\d.-]/g, '' )
			);
			const percent =
				( subtotalNum / state.freeShippingThreshold ) * 100;
			return Math.min( 100, Math.max( 0, percent ) );
		},

		get freeShippingMessage() {
			if ( ! state.freeShippingThreshold ) {
				return '';
			}
			const remaining = state.freeShippingRemaining;
			if ( remaining <= 0 ) {
				return state.freeShippingSuccessMessage;
			}
			// Replace {amount} placeholder
			const amount = new Intl.NumberFormat( 'en-US', {
				style: 'currency',
				currency: 'USD',
			} ).format( remaining );
			return state.freeShippingProgressMessage.replace(
				'{amount}',
				amount
			);
		},
	},

	actions: {
		toggle() {
			if ( state.isOpen ) {
				actions.close();
			} else {
				actions.open();
			}
		},

		open() {
			state.isOpen = true;
		},

		close() {
			state.isOpen = false;
		},

		onKeydown( event ) {
			if ( event.key === 'Escape' && state.isOpen ) {
				actions.close();
			}
		},

		*refreshCart() {
			state.isLoading = true;
			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch( ...api.fetchCart() );

				if ( ! response.ok ) {
					throw new Error( 'Failed to fetch cart' );
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );

				// Dispatch custom event
				document.dispatchEvent(
					new CustomEvent( 'scrt:cart-updated', {
						detail: { cart },
					} )
				);
			} catch ( error ) {
				console.error( 'Side Cart: Failed to refresh cart', error );
				actions.showToast( state.i18n.failedToUpdateCart, 'error' );
			} finally {
				state.isLoading = false;
			}
		},

		*removeItem() {
			const ctx = getContext();
			const itemKey = ctx.item.key;
			const itemName = ctx.item.name;
			const undoItem = {
				productId: ctx.item.productId,
				quantity: ctx.item.quantity,
				variation: ctx.item.variation,
			};

			state.isLoading = true;

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch( ...api.removeItem( itemKey ) );

				if ( ! response.ok ) {
					const errorData = yield response.json();
					throw new Error(
						errorData.message || state.i18n.failedToRemoveItem
					);
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );

				actions.showToast(
					state.i18n.itemRemovedFromCart.replace( '%s', itemName ),
					'success',
					{ undoItem }
				);

				// Dispatch custom event
				document.dispatchEvent(
					new CustomEvent( 'scrt:item-removed', {
						detail: { key: itemKey, name: itemName },
					} )
				);
			} catch ( error ) {
				console.error( 'Side Cart: Failed to remove item', error );
				actions.showToast(
					error.message || state.i18n.failedToRemoveItem,
					'error'
				);
			} finally {
				state.isLoading = false;
			}
		},

		updateQuantity( event ) {
			const ctx = getContext();
			const itemKey = ctx.item.key;
			const newQuantity = parseInt( event.target.value, 10 );

			if ( isNaN( newQuantity ) || newQuantity < 1 ) {
				return;
			}

			if ( newQuantity > ctx.item.maxQty ) {
				actions.showToast( state.i18n.quantityExceedsStock, 'error' );
				event.target.value = pendingQuantities.has( itemKey )
					? pendingQuantities.get( itemKey )
					: ctx.item.quantity;
				return;
			}

			// Optimistically update the displayed quantity right away.
			ctx.item.quantity = newQuantity;
			pendingQuantities.set( itemKey, newQuantity );

			// Mark this item's input for re-focus after the update.
			refocusTargets.add( itemKey );

			// Debounce the actual API call.
			clearTimeout( quantityTimers.get( itemKey ) );
			quantityTimers.set(
				itemKey,
				setTimeout( () => {
					quantityTimers.delete( itemKey );
					actions.commitQuantityUpdate( itemKey, newQuantity );
				}, 500 )
			);
		},

		increaseQuantity( event ) {
			const ctx = getContext();
			const itemKey = ctx.item.key;
			const currentQty = pendingQuantities.has( itemKey )
				? pendingQuantities.get( itemKey )
				: ctx.item.quantity;
			const newQuantity = currentQty + 1;

			if ( newQuantity > ctx.item.maxQty ) {
				actions.showToast( state.i18n.maximumQuantityReached, 'error' );
				return;
			}

			// Optimistically update the displayed quantity right away.
			ctx.item.quantity = newQuantity;
			pendingQuantities.set( itemKey, newQuantity );

			// Track keyboard activations (detail === 0) for re-focus after update.
			if ( event.detail === 0 ) {
				buttonRefocusTargets.set( itemKey, 'plus' );
			}

			// Debounce the actual API call.
			clearTimeout( quantityTimers.get( itemKey ) );
			quantityTimers.set(
				itemKey,
				setTimeout( () => {
					quantityTimers.delete( itemKey );
					actions.commitQuantityUpdate( itemKey, newQuantity );
				}, 500 )
			);
		},

		decreaseQuantity( event ) {
			const ctx = getContext();
			const itemKey = ctx.item.key;
			const currentQty = pendingQuantities.has( itemKey )
				? pendingQuantities.get( itemKey )
				: ctx.item.quantity;
			const newQuantity = currentQty - 1;

			if ( newQuantity < 1 ) {
				return;
			}

			// Optimistically update the displayed quantity right away.
			ctx.item.quantity = newQuantity;
			pendingQuantities.set( itemKey, newQuantity );

			// Track keyboard activations (detail === 0) for re-focus after update.
			if ( event.detail === 0 ) {
				buttonRefocusTargets.set( itemKey, 'minus' );
			}

			// Debounce the actual API call.
			clearTimeout( quantityTimers.get( itemKey ) );
			quantityTimers.set(
				itemKey,
				setTimeout( () => {
					quantityTimers.delete( itemKey );
					actions.commitQuantityUpdate( itemKey, newQuantity );
				}, 500 )
			);
		},

		*commitQuantityUpdate( itemKey, newQuantity ) {
			state.isLoading = true;

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch(
					...api.updateItemQuantity( itemKey, newQuantity )
				);

				if ( ! response.ok ) {
					const errorData = yield response.json();
					throw new Error(
						errorData.message || state.i18n.failedToUpdateQuantity
					);
				}

				// Item update endpoint returns single item, not full cart.
				yield response.json(); // Consume the response
				yield actions.refreshCart();

				// Dispatch custom event
				document.dispatchEvent(
					new CustomEvent( 'scrt:item-quantity-changed', {
						detail: { key: itemKey, quantity: newQuantity },
					} )
				);
			} catch ( error ) {
				console.error(
					'Side Cart: Failed to update quantity',
					error
				);
				actions.showToast(
					error.message || state.i18n.failedToUpdateQuantity,
					'error'
				);
				// Refresh to restore the correct server quantities.
				yield actions.refreshCart();
			} finally {
				state.isLoading = false;
				pendingQuantities.delete( itemKey );

				// Re-focus the quantity input if it was focused before the update.
				// Query the live DOM by item key (via data-item-key set by the
				// template) instead of using a stored reference, because
				// refreshCart() may have replaced the DOM node via data-wp-each.
				if ( refocusTargets.has( itemKey ) ) {
					refocusTargets.delete( itemKey );
					requestAnimationFrame( () => {
						const input = document.querySelector(
							`.scrt-qty-input[data-item-key="${ itemKey }"]`
						);
						if ( input ) {
							input.focus();
						}
					} );
				} else if ( buttonRefocusTargets.has( itemKey ) ) {
					const side = buttonRefocusTargets.get( itemKey );
					buttonRefocusTargets.delete( itemKey );
					requestAnimationFrame( () => {
						const btn = document.querySelector(
							`.scrt-qty-btn--${ side }[data-item-key="${ itemKey }"]`
						);
						if ( btn ) {
							btn.focus();
						}
					} );
				}
			}
		},

		applyCouponOnEnter( event ) {
			if ( event.key === 'Enter' ) {
				actions.applyCoupon( event );
			}
		},

		*applyCoupon( event ) {
			const inputEl = event.target
				.closest( '.scrt-coupon__input-group' )
				.querySelector( '.scrt-coupon__input' );
			const couponCode = inputEl.value.trim();

			if ( ! couponCode ) {
				return;
			}

			state.isLoading = true;

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch( ...api.applyCoupon( couponCode ) );

				if ( ! response.ok ) {
					const errorData = yield response.json();
					throw new Error(
						errorData.message || state.i18n.failedToApplyCoupon
					);
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );

				inputEl.value = '';
				actions.showToast( state.i18n.couponApplied, 'success' );
			} catch ( error ) {
				console.error( 'Side Cart: Failed to apply coupon', error );
				actions.showToast(
					error.message || state.i18n.failedToApplyCoupon,
					'error'
				);
			} finally {
				state.isLoading = false;
			}
		},

		*removeCoupon() {
			const ctx = getContext();
			const couponCode = ctx.coupon;

			state.isLoading = true;

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch( ...api.removeCoupon( couponCode ) );

				if ( ! response.ok ) {
					const errorData = yield response.json();
					throw new Error(
						errorData.message || state.i18n.failedToRemoveCoupon
					);
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );

				actions.showToast( state.i18n.couponRemoved, 'success' );
			} catch ( error ) {
				console.error( 'Side Cart: Failed to remove coupon', error );
				actions.showToast(
					error.message || state.i18n.failedToRemoveCoupon,
					'error'
				);
			} finally {
				state.isLoading = false;
			}
		},

		*emptyCart() {
			if ( ! window.confirm( state.i18n.emptyCartConfirm ) ) {
				return;
			}

			state.isLoading = true;

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch( ...api.emptyCart() );

				if ( ! response.ok ) {
					throw new Error( 'Failed to empty cart' );
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );

				actions.showToast( state.i18n.cartEmptied, 'success' );
			} catch ( error ) {
				console.error( 'Side Cart: Failed to empty cart', error );
				actions.showToast( state.i18n.failedToEmptyCart, 'error' );
			} finally {
				state.isLoading = false;
			}
		},

		updateStateFromCart( cart ) {
			const transformed = transformCartToState( cart, state.stockStatusLabels );

			state.items = transformed.items;
			state.totalItems = transformed.totalItems;
			state.totalUniqueItems = transformed.totalUniqueItems;
			state.subtotal = transformed.subtotal;
			state.cartTotal = transformed.cartTotal;
			state.discountTotal = transformed.discountTotal;
			state.discountAmount = transformed.discountAmount;
			state.appliedCoupons = transformed.appliedCoupons;
		},

		showToast( message, type = 'info', data = {} ) {
			const toastHelpers = createToastHelpers( state );
			toastHelpers.showToast( message, type, data );
		},

		dismissToast() {
			const ctx = getContext();
			const toastHelpers = createToastHelpers( state );
			toastHelpers.dismissToast( ctx.toast.id );
		},

		*undoRemoveItem() {
			const ctx = getContext();
			const { undoItem, id: toastId } = ctx.toast;

			const toastHelpers = createToastHelpers( state );
			toastHelpers.dismissToast( toastId );

			state.isLoading = true;

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch(
					...api.addItem(
						undoItem.productId,
						undoItem.quantity,
						undoItem.variation
					)
				);

				if ( ! response.ok ) {
					const errorData = yield response.json();
					throw new Error(
						errorData.message || state.i18n.failedToUpdateCart
					);
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );
			} catch ( error ) {
				console.error( 'Side Cart: Failed to undo remove', error );
				actions.showToast(
					error.message || state.i18n.failedToUpdateCart,
					'error'
				);
			} finally {
				state.isLoading = false;
			}
		},
	},

	callbacks: {
		initFocusTrap() {
			return initFocusTrap( state );
		},

		watchOpen() {
			watchOpen( state );
		},

		autoExpireToasts() {
			const toastHelpers = createToastHelpers( state );
			toastHelpers.autoExpireToasts();
		},

		initCustomTriggers() {
			initCustomTriggers( state, actions.open );
		},
	},
} );

/**
 * Handle the add-to-cart event: refresh cart data and auto-open if enabled.
 */
function handleAddedToCart() {
	actions.refreshCart();
	if ( state.autoOpen ) {
		actions.open();
	}
}

// AJAX add-to-cart on classic WooCommerce shop/archive pages.
if ( typeof jQuery !== 'undefined' ) {
	jQuery( document.body ).on( 'added_to_cart', handleAddedToCart );
}

// WooCommerce Blocks add-to-cart (product blocks, All Products block, etc.).
document.body.addEventListener( 'wc-blocks_added_to_cart', handleAddedToCart );
