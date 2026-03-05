/**
 * UI Helper Functions
 *
 * Utilities for managing UI interactions, toasts, focus trapping,
 * and custom triggers.
 *
 * @package SideCart
 */

/**
 * Creates toast management functions
 *
 * @param {Object} state - The state object
 * @return {Object} Toast helper functions
 */
export function createToastHelpers( state ) {
	return {
		/**
		 * Show a toast notification
		 *
		 * @param {string} message - Toast message
		 * @param {string} type - Toast type (info, success, error)
		 */
		showToast( message, type = 'info', data = {} ) {
			const toast = {
				id: Date.now(),
				message,
				type,
				...data,
			};
			state.toasts = [ ...state.toasts, toast ];
		},

		/**
		 * Dismiss a specific toast
		 *
		 * @param {number} toastId - ID of toast to dismiss
		 */
		dismissToast( toastId ) {
			state.toasts = state.toasts.filter( ( t ) => t.id !== toastId );
		},

		/**
		 * Auto-expire toasts after 3 seconds
		 * Called as a callback when toasts array changes
		 */
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
	};
}

/**
 * Initialize focus trap for the drawer
 *
 * @param {Object} state - The state object
 * @return {Function|undefined} Cleanup function or undefined
 */
export function initFocusTrap( state ) {
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
}

/**
 * Watch for drawer open/close state changes
 *
 * @param {Object} state - The state object
 */
export function watchOpen( state ) {
	const drawer = document.querySelector( '.scrt-drawer' );
	const overlay = document.querySelector( '.scrt-overlay' );

	if ( state.isOpen ) {
		document.body.style.overflow = 'hidden';
		document.dispatchEvent( new CustomEvent( 'scrt:cart-opened' ) );

		// Force a style flush so the browser registers the current "from" state
		// (transform: translateX(100%)) before the open transition starts.
		if ( drawer ) {
			void drawer.offsetWidth;
			drawer.classList.add( 'scrt-drawer--is-open' );
		}
		if ( overlay ) {
			void overlay.offsetWidth;
			overlay.classList.add( 'scrt-overlay--is-open' );
		}

		// Focus the close button after the drawer has begun opening
		setTimeout( () => {
			const closeButton = document.querySelector( '.scrt-drawer__close' );
			if ( closeButton ) {
				closeButton.focus();
			}
		}, 100 );
	} else {
		// Close animation is triggered in close() BEFORE state.isOpen is set to
		// false, so the hidden attribute hasn't been added yet and the transition
		// runs cleanly. Here we just handle the side-effects.
		document.body.style.overflow = '';
		document.dispatchEvent( new CustomEvent( 'scrt:cart-closed' ) );
	}
}

/**
 * Start the close animation on the drawer and overlay.
 * Must be called BEFORE state.isOpen is set to false so that
 * the hidden attribute hasn't been added yet.
 */
export function startCloseAnimation() {
	const drawer = document.querySelector( '.scrt-drawer' );
	const overlay = document.querySelector( '.scrt-overlay' );

	if ( drawer ) {
		void drawer.offsetWidth; // register transform: translateX(0) as "from" state
		drawer.classList.remove( 'scrt-drawer--is-open' );
	}
	if ( overlay ) {
		overlay.classList.remove( 'scrt-overlay--is-open' );
	}
}

/**
 * Initialize custom trigger elements
 *
 * @param {Object} state - The state object
 * @param {Function} openAction - Function to call to open cart
 */
export function initCustomTriggers( state, openAction ) {
	if ( ! state.customTriggerSelector ) {
		return;
	}

	const customTriggers = document.querySelectorAll(
		state.customTriggerSelector
	);

	customTriggers.forEach( ( trigger ) => {
		trigger.addEventListener( 'click', () => {
			openAction();
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
}
