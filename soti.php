<?php
/**
 * Plugin Name: صوتی
 * Plugin URI: https://github.com/andishema6662-ship-it/tasnim
 * Description: خواندن بلند متن خبر فارسی روی نوشته‌های تکی. دکمه‌های منیژه و بیژن صدای زن و مرد را انتخاب می‌کنند.
 * Version: 1.0.0
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

define('SOTI_VERSION', '1.0.0');
define('SOTI_FILE', __FILE__);

require_once __DIR__ . '/includes/class-soti-plugin.php';

Soti_Plugin::init();
