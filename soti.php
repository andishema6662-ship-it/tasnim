<?php
/**
 * Plugin Name: شنیدار (Shenidar)
 * Plugin URI: https://github.com/andishema6662-ship-it/tasnim
 * Description: خواندن بلند متن همان نوشته. صفحهٔ خبر متن را می‌فرستد و فایل صوتی را پخش می‌کند.
 * Version: 1.7.0
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

define('SOTI_VERSION', '1.7.0');
define('SOTI_FILE', __FILE__);

require_once __DIR__ . '/includes/class-soti-plugin.php';

Soti_Plugin::init();
