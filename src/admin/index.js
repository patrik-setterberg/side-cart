/**
 * Side Cart Admin — Entry Point
 *
 * @package SideCart
 */

import { createRoot } from '@wordpress/element';
import App from './App';
import './admin.css';

// Wait for DOM to be ready
document.addEventListener( 'DOMContentLoaded', () => {
	const rootElement = document.getElementById( 'scrt-admin-root' );

	if ( rootElement ) {
		const root = createRoot( rootElement );
		root.render( <App /> );
	}
} );
