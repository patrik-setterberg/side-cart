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

const { state, actions } = store( 'side-cart', {
	state: {
		// Derived state — must be defined here (inside store) to be reactive.

		get hasItems() {
			return state.items && state.items.length > 0;
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
				actions.showToast( 'Failed to update cart', 'error' );
			} finally {
				state.isLoading = false;
			}
		},

		*removeItem() {
			const ctx = getContext();
			const itemKey = ctx.item.key;
			const itemName = ctx.item.name;

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
						errorData.message || 'Failed to remove item'
					);
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );

				actions.showToast( `${ itemName } removed from cart`, 'success' );

				// Dispatch custom event
				document.dispatchEvent(
					new CustomEvent( 'scrt:item-removed', {
						detail: { key: itemKey, name: itemName },
					} )
				);
			} catch ( error ) {
				console.error( 'Side Cart: Failed to remove item', error );
				actions.showToast(
					error.message || 'Failed to remove item',
					'error'
				);
			} finally {
				state.isLoading = false;
			}
		},

		*updateQuantity( event ) {
			const ctx = getContext();
			const itemKey = ctx.item.key;
			const newQuantity = parseInt( event.target.value, 10 );

			if ( isNaN( newQuantity ) || newQuantity < 1 ) {
				return;
			}

			if ( newQuantity > ctx.item.maxQty ) {
				actions.showToast( 'Quantity exceeds stock limit', 'error' );
				event.target.value = ctx.item.quantity;
				return;
			}

			state.isLoading = true;

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch( ...api.updateItemQuantity( itemKey, newQuantity ) );

				if ( ! response.ok ) {
					const errorData = yield response.json();
					const errorMessage = errorData.message || 'Failed to update quantity';

					actions.showToast( errorMessage, 'error' );

					// Restore the original quantity value in the input
					event.target.value = ctx.item.quantity;
					state.isLoading = false;
					return;
				}

				// Item update endpoint returns single item, not full cart
				// So we need to refresh the entire cart
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
					error.message || 'Failed to update quantity',
					'error'
				);
				event.target.value = ctx.item.quantity;
			} finally {
				state.isLoading = false;
			}
		},

		*increaseQuantity() {
			const ctx = getContext();
			const newQuantity = ctx.item.quantity + 1;

			if ( newQuantity > ctx.item.maxQty ) {
				actions.showToast( 'Maximum quantity reached', 'error' );
				return;
			}

			state.isLoading = true;

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch( ...api.updateItemQuantity( ctx.item.key, newQuantity ) );

				if ( ! response.ok ) {
					const errorData = yield response.json();
					const errorMessage = errorData.message || 'Failed to increase quantity';

					actions.showToast( errorMessage, 'error' );
					state.isLoading = false;
					return;
				}

				// Item update endpoint returns single item, not full cart
				// So we need to refresh the entire cart
				yield response.json(); // Consume the response
				yield actions.refreshCart();

				// Dispatch custom event
				document.dispatchEvent(
					new CustomEvent( 'scrt:item-quantity-changed', {
						detail: { key: ctx.item.key, quantity: newQuantity },
					} )
				);
			} catch ( error ) {
				console.error(
					'Side Cart: Failed to increase quantity',
					error
				);
				actions.showToast(
					error.message || 'Failed to increase quantity',
					'error'
				);
			} finally {
				state.isLoading = false;
			}
		},

		*decreaseQuantity() {
			const ctx = getContext();
			const newQuantity = ctx.item.quantity - 1;

			if ( newQuantity < 1 ) {
				return;
			}

			state.isLoading = true;

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch( ...api.updateItemQuantity( ctx.item.key, newQuantity ) );

				if ( ! response.ok ) {
					const errorData = yield response.json();
					throw new Error(
						errorData.message || 'Failed to decrease quantity'
					);
				}

				// Item update endpoint returns single item, not full cart
				// So we need to refresh the entire cart
				yield response.json(); // Consume the response
				yield actions.refreshCart();

				// Dispatch custom event
				document.dispatchEvent(
					new CustomEvent( 'scrt:item-quantity-changed', {
						detail: { key: ctx.item.key, quantity: newQuantity },
					} )
				);
			} catch ( error ) {
				console.error(
					'Side Cart: Failed to decrease quantity',
					error
				);
				actions.showToast(
					error.message || 'Failed to decrease quantity',
					'error'
				);
			} finally {
				state.isLoading = false;
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
						errorData.message || 'Failed to apply coupon'
					);
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );

				inputEl.value = '';
				actions.showToast( 'Coupon applied successfully', 'success' );
			} catch ( error ) {
				console.error( 'Side Cart: Failed to apply coupon', error );
				actions.showToast(
					error.message || 'Failed to apply coupon',
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
						errorData.message || 'Failed to remove coupon'
					);
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );

				actions.showToast( 'Coupon removed', 'success' );
			} catch ( error ) {
				console.error( 'Side Cart: Failed to remove coupon', error );
				actions.showToast(
					error.message || 'Failed to remove coupon',
					'error'
				);
			} finally {
				state.isLoading = false;
			}
		},

		*emptyCart() {
			if (
				! window.confirm(
					'Are you sure you want to empty your cart?'
				)
			) {
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

				actions.showToast( 'Cart emptied', 'success' );
			} catch ( error ) {
				console.error( 'Side Cart: Failed to empty cart', error );
				actions.showToast( 'Failed to empty cart', 'error' );
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
			state.appliedCoupons = transformed.appliedCoupons;
		},

		showToast( message, type = 'info' ) {
			const toastHelpers = createToastHelpers( state );
			toastHelpers.showToast( message, type );
		},

		dismissToast() {
			const ctx = getContext();
			const toastHelpers = createToastHelpers( state );
			toastHelpers.dismissToast( ctx.toast.id );
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
