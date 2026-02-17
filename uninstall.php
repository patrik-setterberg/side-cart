<?php
/**
 * Runs when the plugin is uninstalled (deleted via WP admin).
 *
 * Removes all data stored by Side Cart.
 *
 * @package SideCart
 */

// Guard: only run when WordPress triggers this file directly.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'scrt_settings' );
