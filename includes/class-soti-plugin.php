<?php
/**
 * Front-end player for singular posts.
 *
 * @package Soti
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enqueues the player on single posts and wraps the article body.
 */
class Soti_Plugin {

    /**
     * Whether the mount point was already added for this request.
     *
     * @var bool
     */
    private static $rendered = false;

    /**
     * Hooks the public article player.
     */
    public static function init() {
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue'));
        add_filter('the_content', array(__CLASS__, 'filter_content'), 12);
    }

    /**
     * Loads CSS and JS only on singular posts.
     */
    public static function enqueue() {
        if (!is_singular('post')) {
            return;
        }

        wp_enqueue_style(
            'soti',
            plugins_url('assets/soti.css', SOTI_FILE),
            array(),
            SOTI_VERSION
        );

        wp_enqueue_script(
            'soti',
            plugins_url('assets/soti.js', SOTI_FILE),
            array(),
            SOTI_VERSION,
            true
        );

        $config = apply_filters(
            'soti_config',
            array(
                'selector' => '.soti-article',
            )
        );

        if (!is_array($config)) {
            $config = array();
        }

        $selector = isset($config['selector']) ? (string) $config['selector'] : '.soti-article';
        $boot     = array(
            'selector' => $selector,
        );

        // A site-owned proxy may be set here. Subscription keys are never printed.
        if (isset($config['azure_endpoint']) && is_string($config['azure_endpoint'])) {
            $endpoint = esc_url_raw($config['azure_endpoint']);
            if ($endpoint !== '') {
                $boot['azureEndpoint'] = $endpoint;
            }
        }

        wp_add_inline_script(
            'soti',
            'window.SOTI_BOOT = ' . wp_json_encode($boot) . ';',
            'before'
        );
    }

    /**
     * Places the player mount and marks the post body for the script.
     *
     * @param string $content Post content.
     * @return string
     */
    public static function filter_content($content) {
        if (!is_singular('post') || !in_the_loop() || !is_main_query()) {
            return $content;
        }

        if (is_feed() || is_admin()) {
            return $content;
        }

        if (function_exists('wp_is_json_request') && wp_is_json_request()) {
            return $content;
        }

        if (self::$rendered || !is_string($content)) {
            return $content;
        }

        if (trim(wp_strip_all_tags($content)) === '') {
            return $content;
        }

        self::$rendered = true;

        return '<div class="soti-mount" data-soti-mount="1"></div>'
            . '<div class="soti-article" data-soti-article="1">'
            . $content
            . '</div>';
    }
}
