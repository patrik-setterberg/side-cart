/**
 * Cart Data Transformers
 *
 * Utilities for transforming WooCommerce Store API cart data into
 * the format needed by the Interactivity API state.
 *
 * @package SideCart
 */

/**
 * Decode HTML entities in a string
 *
 * @param {string} html - HTML string with entities
 * @return {string} Decoded string
 */
export function decodeHtml( html ) {
	const doc = new DOMParser().parseFromString( html, 'text/html' );
	return doc.documentElement.textContent ?? '';
}

/**
 * Format a price value from the Store API
 *
 * The Store API uses raw_prices with a precision field to represent decimal values.
 * For example, precision:6 with price:'12000000' means 12000000 / 10^6 = 12
 *
 * @param {string} priceStr - Raw price string from API
 * @param {Object} currencyData - Currency configuration
 * @param {number} currencyData.precision - Number of decimal places in raw value
 * @param {number} currencyData.currency_minor_unit - Decimal places for display
 * @param {string} currencyData.currency_symbol - Currency symbol
 * @param {string} currencyData.currency_prefix - Text before amount
 * @param {string} currencyData.currency_suffix - Text after amount
 * @param {string} currencyData.currency_decimal_separator - Decimal separator
 * @param {string} currencyData.currency_thousand_separator - Thousands separator
 * @return {string} Formatted price string
 */
export function formatPrice( priceStr, currencyData ) {
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
}

/**
 * Transform a cart item from Store API format to state format
 *
 * @param {Object} item              - Cart item from Store API
 * @param {Object} stockStatusLabels - Label map, e.g. { instock: 'In stock', ... }
 * @return {Object} Transformed cart item
 */
export function transformCartItem( item, stockStatusLabels = {} ) {
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

	// Detect sale: when sale_price exists and differs from regular_price
	const onSale =
		rawPrices.sale_price !== undefined &&
		rawPrices.sale_price !== '' &&
		rawPrices.sale_price !== rawPrices.regular_price;

	const stockStatus = item.stock_status || 'instock';

	return {
		key: item.key,
		productId: item.id,
		name: decodeHtml( item.name ),
		quantity: item.quantity,
		price: formatPrice( rawPrices.price, { ...currencyData, precision } ),
		regularPrice: onSale
			? formatPrice( rawPrices.regular_price, { ...currencyData, precision } )
			: '',
		onSale,
		lineTotal: formatPrice(
			item.totals?.line_total,
			currencyData
		),
		thumbnailUrl: item.images?.[ 0 ]?.src || '',
		permalink: item.permalink,
		sku: item.sku || '',
		maxQty: item.quantity_limits?.maximum || 9999,
		stockStatus,
		stockStatusLabel: stockStatusLabels[ stockStatus ] || stockStatus,
		variation,
	};
}

/**
 * Transform full cart data from Store API to state format
 *
 * @param {Object} cart              - Cart data from Store API
 * @param {Object} stockStatusLabels - Label map passed from Interactivity state
 * @return {Object} Transformed cart state
 */
export function transformCartToState( cart, stockStatusLabels = {} ) {
	// Map items
	const items = cart.items?.map( ( item ) => transformCartItem( item, stockStatusLabels ) ) || [];

	// Format totals - Store API returns totals as plain display strings (e.g., "394" = 394 kr)
	// Unlike item prices, these don't use precision and are already in display format
	const totalsCurrency = cart.items?.[ 0 ]?.prices || {};
	const subtotalValue = cart.totals?.total_items || '0';
	const totalValue = cart.totals?.total_price || '0';
	const symbol = totalsCurrency?.currency_symbol || 'kr';
	const suffix = totalsCurrency?.currency_suffix || '';

	const discountValue = cart.totals?.total_discount || '0';
	const discountAmount = parseFloat( discountValue );

	return {
		items,
		totalItems: cart.items_count || 0,
		totalUniqueItems: cart.items?.length || 0,
		subtotal: suffix ? `${ subtotalValue }${ suffix }` : `${ subtotalValue } ${ symbol }`,
		cartTotal: suffix ? `${ totalValue }${ suffix }` : `${ totalValue } ${ symbol }`,
		discountTotal: suffix ? `${ discountValue }${ suffix }` : `${ discountValue } ${ symbol }`,
		discountAmount,
		appliedCoupons: cart.coupons?.map( ( c ) => c.code ) || [],
	};
}
