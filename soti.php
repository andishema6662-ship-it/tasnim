<?php
/**
 * Plugin Name: شنیدار (Shenidar)
 * Plugin URI: https://github.com/andishema6662-ship-it/tasnim
 * Description: خواندن بلند متن خبر فارسی روی نوشته‌های تکی. دکمه‌های منیژه و بیژن صدای زن و مرد را انتخاب می‌کنند.
 * Version: 1.2.2
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Soti
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: soti
 *
 * @package Soti
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SOTI_VERSION', '1.2.2');
define('SOTI_FILE', __FILE__);

require_once __DIR__ . '/includes/class-soti-engine.php';
require_once __DIR__ . '/includes/class-soti-plugin.php';

Soti_Plugin::init();
register_activation_hook(SOTI_FILE, array('Soti_Plugin', 'activate'));
