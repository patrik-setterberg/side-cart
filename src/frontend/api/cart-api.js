/**
 * Cart API Request Builders
 *
 * Provides request configuration builders for WooCommerce Store API interactions.
 * These return fetch configuration objects that can be used with yield fetch().
 *
 * @package SideCart
 */

/**
 * Creates request configuration builders with the given API config
 *
 * @param {Object} config - API configuration
 * @param {string} config.storeApiBase - Base URL for Store API
 * @param {string} config.storeApiNonce - Nonce for authentication
 * @return {Object} Request configuration builders
 */
export function createCartApiRequests( config ) {
	const { storeApiBase, storeApiNonce } = config;

	/**
	 * Common headers for all requests
	 */
	const getHeaders = () => ( {
		'Content-Type': 'application/json',
		Nonce: storeApiNonce,
	} );

	return {
		/**
		 * Build fetch config for getting the cart
		 *
		 * @return {Array} [url, options] for fetch
		 */
		fetchCart() {
			return [
				`${ storeApiBase }cart`,
				{
					method: 'GET',
					headers: getHeaders(),
				},
			];
		},

		/**
		 * Build fetch config for removing an item
		 *
		 * @param {string} itemKey - The cart item key
		 * @return {Array} [url, options] for fetch
		 */
		removeItem( itemKey ) {
			return [
				`${ storeApiBase }cart/remove-item`,
				{
					method: 'POST',
					headers: getHeaders(),
					body: JSON.stringify( { key: itemKey } ),
				},
			];
		},

		/**
		 * Build fetch config for updating item quantity
		 *
		 * @param {string} itemKey - The cart item key
		 * @param {number} quantity - New quantity
		 * @return {Array} [url, options] for fetch
		 */
		updateItemQuantity( itemKey, quantity ) {
			return [
				`${ storeApiBase }cart/items/${ itemKey }`,
				{
					method: 'PUT',
					headers: getHeaders(),
					body: JSON.stringify( {
						quantity: parseInt( quantity, 10 ),
					} ),
				},
			];
		},

		/**
		 * Build fetch config for applying a coupon
		 *
		 * @param {string} couponCode - The coupon code
		 * @return {Array} [url, options] for fetch
		 */
		applyCoupon( couponCode ) {
			return [
				`${ storeApiBase }cart/apply-coupon`,
				{
					method: 'POST',
					headers: getHeaders(),
					body: JSON.stringify( { code: couponCode } ),
				},
			];
		},

		/**
		 * Build fetch config for removing a coupon
		 *
		 * @param {string} couponCode - The coupon code
		 * @return {Array} [url, options] for fetch
		 */
		removeCoupon( couponCode ) {
			return [
				`${ storeApiBase }cart/remove-coupon`,
				{
					method: 'POST',
					headers: getHeaders(),
					body: JSON.stringify( { code: couponCode } ),
				},
			];
		},

		/**
		 * Build fetch config for emptying the cart
		 *
		 * @return {Array} [url, options] for fetch
		 */
		emptyCart() {
			return [
				`${ storeApiBase }cart/items`,
				{
					method: 'DELETE',
					headers: getHeaders(),
				},
			];
		},
	};
}
