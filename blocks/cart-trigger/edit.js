/**
 * Cart Trigger Block — Editor Component
 *
 * @package SideCart
 */

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes } ) {
	const { text, showBadge, icon } = attributes;
	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'side-cart' ) }>
					<TextControl
						label={ __( 'Button Text', 'side-cart' ) }
						value={ text }
						onChange={ ( value ) => setAttributes( { text: value } ) }
					/>
					<ToggleControl
						label={ __( 'Show Badge', 'side-cart' ) }
						checked={ showBadge }
						onChange={ ( value ) => setAttributes( { showBadge: value } ) }
					/>
					<SelectControl
						label={ __( 'Icon', 'side-cart' ) }
						value={ icon }
						options={ [
							{ label: __( 'Shopping Bag', 'side-cart' ), value: 'bag' },
							{ label: __( 'Shopping Cart', 'side-cart' ), value: 'cart' },
							{ label: __( 'Basket', 'side-cart' ), value: 'basket' },
						] }
						onChange={ ( value ) => setAttributes( { icon: value } ) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<button
					className="scrt-trigger"
					type="button"
					style={ {
						display: 'inline-flex',
						alignItems: 'center',
						gap: '8px',
						padding: '8px 16px',
						background: '#111111',
						color: '#ffffff',
						border: 'none',
						borderRadius: '4px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: 'pointer',
					} }
				>
					{ icon && (
						<span style={ { width: '20px', height: '20px' } }>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								{ icon === 'bag' && (
									<>
										<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
										<line x1="3" y1="6" x2="21" y2="6" />
										<path d="M16 10a4 4 0 0 1-8 0" />
									</>
								) }
								{ icon === 'cart' && (
									<>
										<circle cx="9" cy="21" r="1" />
										<circle cx="20" cy="21" r="1" />
										<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
									</>
								) }
								{ icon === 'basket' && (
									<>
										<path d="m5 9 1.5 12h11L19 9" />
										<path d="M2 9h20" />
										<path d="M7.5 9V5a3.5 3.5 0 0 1 7 0v4" />
									</>
								) }
							</svg>
						</span>
					) }
					{ text && <span>{ text }</span> }
					{ showBadge && (
						<span
							style={ {
								minWidth: '20px',
								height: '20px',
								background: '#ef4444',
								color: '#ffffff',
								borderRadius: '10px',
								fontSize: '11px',
								fontWeight: '600',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								padding: '0 6px',
							} }
						>
							0
						</span>
					) }
				</button>
			</div>
		</>
	);
}
