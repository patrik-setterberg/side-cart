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
	startCloseAnimation,
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
			const amount = new Intl.NumberFormat( state.locale, {
				style: 'currency',
				currency: state.currencyCode,
			} ).format( remaining );
			return state.freeShippingProgressMessage.replace(
				'{amount}',
				amount
			);
		},

		get triggerAriaLabel() {
			return state.isOpen ? state.i18n.closeCart : state.i18n.openCart;
		},

		get isErrorToast() {
			const ctx = getContext();
			const type = ctx?.toast?.type;
			return type === 'error' || type === 'warning';
		},

		get isSuccessToast() {
			const ctx = getContext();
			return ctx?.toast?.type === 'success';
		},

		get isInfoToast() {
			const ctx = getContext();
			const type = ctx?.toast?.type;
			return type !== 'error' && type !== 'warning' && type !== 'success';
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
			startCloseAnimation();
			state.isOpen = false;
		},

		continueShopping() {
			if ( state.continueShoppingAction === 'close' ) {
				actions.close();
			} else {
				window.location.href = state.continueShoppingUrl;
			}
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

		*addToCartFromForm( form ) {
			const formData = new FormData( form );
			const submitBtn = form.querySelector( '.single_add_to_cart_button' );

			const variationId = parseInt( formData.get( 'variation_id' ), 10 );
			// Simple products store the ID on the submit button (name="add-to-cart"),
			// which FormData doesn't include without a submitter reference.
			const productId = variationId ||
				parseInt( formData.get( 'product_id' ), 10 ) ||
				parseInt( formData.get( 'add-to-cart' ), 10 ) ||
				parseInt( submitBtn?.value, 10 );
			const quantity = parseInt( formData.get( 'quantity' ), 10 ) || 1;

			if ( ! productId ) {
				return;
			}

			// Variable product with no variation selected.
			if ( formData.has( 'variation_id' ) && ! variationId ) {
				actions.showToast( state.i18n.selectVariation, 'error' );
				return;
			}

			// Build variation array for the Store API.
			const variation = [];
			for ( const [ key, value ] of formData.entries() ) {
				if ( key.startsWith( 'attribute_' ) && value ) {
					variation.push( {
						attribute: key.replace( 'attribute_', '' ),
						value,
					} );
				}
			}

			if ( submitBtn ) {
				submitBtn.classList.add( 'scrt-adding-to-cart' );
				submitBtn.disabled = true;
			}

			try {
				const api = createCartApiRequests( {
					storeApiBase: state.storeApiBase,
					storeApiNonce: state.storeApiNonce,
				} );

				const response = yield fetch(
					...api.addItem(
						productId,
						quantity,
						variation.length ? variation : null
					)
				);

				if ( ! response.ok ) {
					const errorData = yield response.json();
					throw new Error(
						errorData.message || state.i18n.failedToAddToCart
					);
				}

				const cart = yield response.json();
				actions.updateStateFromCart( cart );

				document.dispatchEvent(
					new CustomEvent( 'scrt:item-added', {
						detail: { productId, quantity },
					} )
				);

				if ( state.autoOpen ) {
					actions.open();
				}
			} catch ( error ) {
				console.error( 'Side Cart: Failed to add to cart', error );
				actions.showToast(
					error.message || state.i18n.failedToAddToCart,
					'error'
				);
			} finally {
				if ( submitBtn ) {
					submitBtn.classList.remove( 'scrt-adding-to-cart' );
					submitBtn.disabled = false;
				}
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

		syncCustomTriggerBadges() {
			const count = state.badgeCount;
			document
				.querySelectorAll( '[data-scrt-custom-badge]' )
				.forEach( ( badge ) => {
					badge.textContent = count;
					badge.hidden = count === 0;
				} );
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

/**
 * Handle single product form submission via AJAX instead of page reload.
 */
function handleSingleProductFormSubmit( event ) {
	if ( ! state.ajaxSingleAddToCart || ! state.autoOpen ) {
		return;
	}

	const form = event.target;

	// Already handled by another script (e.g. Flatsome, Woodmart).
	if ( event.defaultPrevented ) {
		return;
	}

	// Only intercept WooCommerce single product forms.
	if ( ! form.classList.contains( 'cart' ) || ! form.closest( '.product' ) ) {
		return;
	}

	// Skip grouped products (need N API calls — not supported in v1).
	if ( form.querySelector( 'input[name^="quantity["]' ) ||
		form.closest( '.product-type-grouped' ) ) {
		return;
	}

	// Skip if submit button is disabled (e.g. no variation selected).
	const submitBtn = form.querySelector( '.single_add_to_cart_button' );
	if ( ! submitBtn || submitBtn.disabled || submitBtn.classList.contains( 'disabled' ) ) {
		return;
	}

	// Skip forms with non-standard fields (add-ons, custom fields).
	// Store API only supports id, quantity, variation.
	const formData = new FormData( form );
	const standardFields = new Set( [
		'product_id', 'variation_id', 'quantity', 'add-to-cart',
	] );
	let hasCustomFields = false;
	for ( const key of formData.keys() ) {
		if ( key.startsWith( 'attribute_' ) ) continue;
		if ( key.startsWith( '_' ) ) continue; // WP nonces, referer
		if ( standardFields.has( key ) ) continue;
		hasCustomFields = true;
		break;
	}
	if ( hasCustomFields ) {
		return;
	}

	event.preventDefault();
	actions.addToCartFromForm( form );
}

// AJAX add-to-cart on single product pages.
document.addEventListener( 'submit', handleSingleProductFormSubmit );
