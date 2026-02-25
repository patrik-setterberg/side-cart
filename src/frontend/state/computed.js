/**
 * Computed State Getters
 *
 * All computed properties for the cart state.
 * These getters are used within the Interactivity API store.
 *
 * @package SideCart
 */

/**
 * Creates computed state getters that reference the provided state object
 *
 * @param {Object} state - The state object to compute from
 * @return {Object} Object with getter functions
 */
export function createComputedState( state ) {
	return {
		/**
		 * Check if cart has any items
		 *
		 * @return {boolean} True if cart has items
		 */
		get hasItems() {
			return state.items && state.items.length > 0;
		},

		/**
		 * Get the badge count based on current mode
		 *
		 * @return {number} Item count for badge display
		 */
		get badgeCount() {
			if ( state.badgeCountMode === 'unique' ) {
				return state.totalUniqueItems;
			}
			return state.totalItems;
		},

		/**
		 * Get the header text with item count
		 *
		 * @return {string} Formatted header text
		 */
		get headerText() {
			const count = state.totalUniqueItems;
			if ( count === 0 ) {
				return 'Your Cart';
			}
			return `Your Cart (${ count } ${ count === 1 ? 'item' : 'items' })`;
		},

		/**
		 * Calculate remaining amount to reach free shipping
		 *
		 * @return {number} Amount remaining (0 if threshold met or not configured)
		 */
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

		/**
		 * Calculate free shipping progress as percentage
		 *
		 * @return {number} Percentage (0-100)
		 */
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

		/**
		 * Get the free shipping message
		 *
		 * @return {string} Message showing progress or success
		 */
		get freeShippingMessage() {
			if ( ! state.freeShippingThreshold ) {
				return '';
			}
			const remaining = this.freeShippingRemaining;
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
	};
}
