/**
 * Cart Trigger Block — Editor Component
 *
 * @package SideCart
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ShoppingBag, ShoppingCart, ShoppingBasket, Handbag } from 'lucide-react';



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
							{ label: __( 'Handbag', 'side-cart' ), value: 'handbag' },
							{ label: __( 'Shopping Cart', 'side-cart' ), value: 'cart' },
							{ label: __( 'Shopping Basket', 'side-cart' ), value: 'basket' },
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
						<span style={ { width: '20px', height: '20px', display: 'flex' } }>
							{ icon === 'bag' && <ShoppingBag size={ 20 } /> }
							{ icon === 'handbag' && <Handbag size={ 20 } /> }
							{ icon === 'cart' && <ShoppingCart size={ 20 } /> }
							{ icon === 'basket' && <ShoppingBasket size={ 20 } /> }
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

registerBlockType('SIDECARTTEST', {
  edit: Edit,
});