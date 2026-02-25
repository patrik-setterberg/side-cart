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

const { state, actions, callbacks } = store( 'side-cart', {
	state: {
		// Computed getters
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
			if ( count === 0 ) {
				return 'Your Cart';
			}
			return `Your Cart (${ count } ${ count === 1 ? 'item' : 'items' })`;
		},

		get freeShippingRemaining() {
			if ( ! state.freeShippingThreshold ) {
				return 0;
			}
			// Parse subtotal string to number
			const subtotalNum = parseFloat(
				state.subtotal.replace( /[^\d.-]/g, '' )
			);
			const remaining = state.freeShippingThreshold - subtotalNum;
			return Math.max( 0, remaining );
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
				const response = yield fetch(
					`${ state.storeApiBase }cart`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							Nonce: state.storeApiNonce,
						},
					}
				);

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
				const response = yield fetch(
					`${ state.storeApiBase }cart/remove-item`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Nonce: state.storeApiNonce,
						},
						body: JSON.stringify( { key: itemKey } ),
					}
				);

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
				const response = yield fetch(
					`${ state.storeApiBase }cart/items/${ itemKey }`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Nonce: state.storeApiNonce,
						},
						body: JSON.stringify( {
							quantity: parseInt( newQuantity, 10 ),
						} ),
					}
				);

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
				const response = yield fetch(
					`${ state.storeApiBase }cart/items/${ ctx.item.key }`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Nonce: state.storeApiNonce,
						},
						body: JSON.stringify( {
							quantity: newQuantity,
						} ),
					}
				);

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
				const response = yield fetch(
					`${ state.storeApiBase }cart/items/${ ctx.item.key }`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Nonce: state.storeApiNonce,
						},
						body: JSON.stringify( {
							quantity: newQuantity,
						} ),
					}
				);

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
				const response = yield fetch(
					`${ state.storeApiBase }cart/apply-coupon`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Nonce: state.storeApiNonce,
						},
						body: JSON.stringify( { code: couponCode } ),
					}
				);

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
				const response = yield fetch(
					`${ state.storeApiBase }cart/remove-coupon`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Nonce: state.storeApiNonce,
						},
						body: JSON.stringify( { code: couponCode } ),
					}
				);

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
				const response = yield fetch(
					`${ state.storeApiBase }cart/items`,
					{
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
							Nonce: state.storeApiNonce,
						},
					}
				);

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
			// Helper to decode HTML entities
			const decodeHtml = ( html ) => {
				const txt = document.createElement( 'textarea' );
				txt.innerHTML = html;
				return txt.value;
			};

			// Helper to format price from Store API - returns plain text instead of HTML
			// because Interactivity API doesn't support complex HTML in data-wp-text
			const formatPrice = ( priceStr, currencyData ) => {
				if ( priceStr === null || priceStr === undefined || priceStr === '' ) {
					return '';
				}

				// The Store API uses raw_prices with a precision field
				// precision indicates how many decimal places the raw value has
				// e.g., precision:6 with price:'12000000' means 12000000 / 10^6 = 12
				const precision = currencyData?.precision ?? currencyData?.currency_minor_unit ?? 2;
				const divisor = Math.pow( 10, precision );
				const amount = parseFloat( priceStr ) / divisor;

				// For display, use currency_minor_unit (e.g., 0 for SEK = no decimals)
				const displayPrecision = currencyData?.currency_minor_unit ?? 0;
				const formatted = amount.toFixed( displayPrecision );

				// Get currency formatting
				const symbol = currencyData?.currency_symbol || 'kr';
				const prefix = currencyData?.currency_prefix || '';
				const suffix = currencyData?.currency_suffix || '';
				const decimalSep = currencyData?.currency_decimal_separator || ',';
				const thousandSep = currencyData?.currency_thousand_separator || ' ';

				// Format the number with thousand separators
				const parts = formatted.split( '.' );
				parts[ 0 ] = parts[ 0 ].replace(
					/\B(?=(\d{3})+(?!\d))/g,
					thousandSep
				);
				const displayAmount = parts.join( decimalSep );

				// Build price string - use suffix if provided, otherwise symbol
				// For SEK: suffix is " kr", symbol is also "kr" - use suffix to avoid duplication
				if ( suffix ) {
					return `${ prefix }${ displayAmount }${ suffix }`.trim();
				} else if ( prefix ) {
					return `${ prefix }${ symbol }${ displayAmount }`.trim();
				} else {
					return `${ displayAmount } ${ symbol }`.trim();
				}
			};

			// Map WC Store API cart response to state
			state.items = cart.items?.map( ( item ) => {
				// Format variation data for the template
				let variation = null;
				if (
					item.variation &&
					Array.isArray( item.variation ) &&
					item.variation.length > 0
				) {
					variation = item.variation.map( ( attr ) => ( {
						key: attr.attribute || attr.key,
						attribute: attr.attribute,
						value: attr.value,
					} ) );
				}

				// Get price data from Store API
				// Item prices use raw_prices with precision field (e.g., "12000000" with precision 6 = 12 kr)
				const currencyData = item.prices || item.totals || {};
				const rawPrices = item.prices?.raw_prices || {};
				const precision = rawPrices.precision || currencyData.currency_minor_unit || 2;

				return {
					key: item.key,
					productId: item.id,
					name: decodeHtml( item.name ),
					quantity: item.quantity,
					price: formatPrice( rawPrices.price, { ...currencyData, precision } ),
					lineTotal: formatPrice(
						item.totals?.line_total,
						currencyData
					),
					thumbnailUrl: item.images?.[ 0 ]?.src || '',
					permalink: item.permalink,
					sku: item.sku || '',
					maxQty: item.quantity_limits?.maximum || 9999,
					variation,
				};
			} ) || [];

			// Format totals - Store API returns totals as plain display strings (e.g., "394" = 394 kr)
			// Unlike item prices, these don't use precision and are already in display format
			const totalsCurrency = cart.items?.[ 0 ]?.prices || {};
			const subtotalValue = cart.totals?.total_items || '0';
			const totalValue = cart.totals?.total_price || '0';
			const symbol = totalsCurrency?.currency_symbol || 'kr';
			const suffix = totalsCurrency?.currency_suffix || '';

			state.totalItems = cart.items_count || 0;
			state.totalUniqueItems = cart.items?.length || 0;
			state.subtotal = suffix ? `${ subtotalValue }${ suffix }` : `${ subtotalValue } ${ symbol }`;
			state.cartTotal = suffix ? `${ totalValue }${ suffix }` : `${ totalValue } ${ symbol }`;
			state.appliedCoupons = cart.coupons?.map( ( c ) => c.code ) || [];
		},

		showToast( message, type = 'info' ) {
			const toast = {
				id: Date.now(),
				message,
				type,
			};
			state.toasts = [ ...state.toasts, toast ];
		},

		dismissToast() {
			const ctx = getContext();
			state.toasts = state.toasts.filter(
				( t ) => t.id !== ctx.toast.id
			);
		},
	},

	callbacks: {
		initFocusTrap() {
			const drawer = document.querySelector( '.scrt-drawer' );
			if ( ! drawer ) {
				return;
			}

			const focusableElements = drawer.querySelectorAll(
				'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			);

			if ( focusableElements.length === 0 ) {
				return;
			}

			const firstElement = focusableElements[ 0 ];
			const lastElement =
				focusableElements[ focusableElements.length - 1 ];

			const trapFocus = ( event ) => {
				if ( ! state.isOpen ) {
					return;
				}

				if ( event.key !== 'Tab' ) {
					return;
				}

				if ( event.shiftKey ) {
					if ( document.activeElement === firstElement ) {
						event.preventDefault();
						lastElement.focus();
					}
				} else if ( document.activeElement === lastElement ) {
					event.preventDefault();
					firstElement.focus();
				}
			};

			drawer.addEventListener( 'keydown', trapFocus );

			return () => {
				drawer.removeEventListener( 'keydown', trapFocus );
			};
		},

		watchOpen() {
			if ( state.isOpen ) {
				document.body.style.overflow = 'hidden';
				document.dispatchEvent( new CustomEvent( 'scrt:cart-opened' ) );

				// Focus first focusable element
				setTimeout( () => {
					const closeButton = document.querySelector(
						'.scrt-drawer__close'
					);
					if ( closeButton ) {
						closeButton.focus();
					}
				}, 100 );
			} else {
				document.body.style.overflow = '';
				document.dispatchEvent( new CustomEvent( 'scrt:cart-closed' ) );
			}
		},

		autoExpireToasts() {
			if ( state.toasts.length === 0 ) {
				return;
			}

			const latestToast = state.toasts[ state.toasts.length - 1 ];
			setTimeout( () => {
				state.toasts = state.toasts.filter(
					( t ) => t.id !== latestToast.id
				);
			}, 3000 );
		},

		initCustomTriggers() {
			if ( ! state.customTriggerSelector ) {
				return;
			}

			const customTriggers = document.querySelectorAll(
				state.customTriggerSelector
			);

			customTriggers.forEach( ( trigger ) => {
				trigger.addEventListener( 'click', () => {
					actions.open();
				} );

				// Inject badge
				const badgeContainer =
					trigger.querySelector( '[data-scrt-badge]' ) ||
					trigger.querySelector( '.scrt-badge' );

				if ( badgeContainer ) {
					const badge = document.createElement( 'span' );
					badge.className = 'scrt-badge';
					badge.setAttribute( 'data-wp-text', 'state.badgeCount' );
					badge.setAttribute(
						'data-wp-bind--hidden',
						'state.badgeCount === 0'
					);
					badgeContainer.appendChild( badge );
				}
			} );
		},
	},
} );

// Listen for WooCommerce add-to-cart event
if ( typeof jQuery !== 'undefined' ) {
	jQuery( document.body ).on( 'added_to_cart', () => {
		actions.refreshCart();
		actions.open();
	} );
}
