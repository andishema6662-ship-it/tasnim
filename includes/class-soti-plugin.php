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
 * Enqueues the player on single posts. The page reads that post and requests speech.
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
        add_action('rest_api_init', array(__CLASS__, 'register_routes'));
    }

    /**
     * The page asks for the open post. The server reads that post and returns its wav.
     */
    public static function register_routes() {
        register_rest_route(
            'shenidar/v1',
            '/speak',
            array(
                'methods'             => 'POST',
                'callback'            => array(__CLASS__, 'rest_speak'),
                'permission_callback' => '__return_true',
            )
        );
    }

    /**
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public static function rest_speak($request) {
        $post_id = (int) $request->get_param('postId');
        if ($post_id <= 0) {
            $post_id = (int) $request->get_param('post_id');
        }
        $voice  = (string) $request->get_param('voice');
        $result = Soti_Engine::speak($post_id, $voice);
        return rest_ensure_response($result);
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
            'postId'   => (int) get_queried_object_id(),
            'speakUrl' => rest_url('shenidar/v1/speak'),
        );

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

        $queried = (int) get_queried_object_id();
        if ((int) get_the_ID() !== $queried) {
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
            . '<div class="soti-article" data-soti-article="1" data-soti-post="' . esc_attr((string) $queried) . '">'
            . $content
            . '</div>';
    }
}
