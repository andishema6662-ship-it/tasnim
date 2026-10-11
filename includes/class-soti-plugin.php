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
 * Enqueues the player on single posts and asks the server to render audio.
 */
class Soti_Plugin {

    /**
     * Whether the mount point was already added for this request.
     *
     * @var bool
     */
    private static $rendered = false;

    /**
     * Hooks the public article player and the server renderer.
     */
    public static function init() {
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue'));
        add_filter('the_content', array(__CLASS__, 'filter_content'), 12);
        add_action('rest_api_init', array(__CLASS__, 'register_routes'));
        add_action('admin_notices', array(__CLASS__, 'admin_notice'));
        add_action('transition_post_status', array(__CLASS__, 'on_status'), 10, 3);
        add_action('save_post_post', array(__CLASS__, 'on_save'), 20, 3);
        add_action('soti_install_engine', array('Soti_Engine', 'install'));
        add_action('soti_generate_post', array('Soti_Engine', 'generate'), 10, 1);
    }

    /**
     * Schedules the server download after the plugin is turned on.
     */
    public static function activate() {
        if (Soti_Engine::runner() === '') {
            update_option('soti_programs_blocked', '1', false);
            return;
        }
        delete_option('soti_programs_blocked');
        if (!Soti_Engine::is_ready() && !wp_next_scheduled('soti_install_engine')) {
            wp_schedule_single_event(time() + 5, 'soti_install_engine');
        }
    }

    /**
     * One notice when the host refuses to run programs.
     */
    public static function admin_notice() {
        if (!current_user_can('edit_posts') || Soti_Engine::runner() !== '') {
            return;
        }
        echo '<div class="notice notice-warning"><p>'
            . esc_html('این میزبان اجرای برنامه را بسته است. شنیدار صدا را با درخواست HTTP روی سرور ذخیره می‌کند.')
            . '</p></div>';
    }

    /**
     * @param string  $new  New status.
     * @param string  $old  Old status.
     * @param WP_Post $post Post.
     */
    public static function on_status($new, $old, $post) {
        unset($old);
        if (!$post instanceof WP_Post || $post->post_type !== 'post' || $new !== 'publish') {
            return;
        }
        self::queue_post((int) $post->ID);
    }

    /**
     * @param int     $post_id Post id.
     * @param WP_Post $post    Post.
     * @param bool    $update  Whether this is an update.
     */
    public static function on_save($post_id, $post, $update) {
        unset($update);
        if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id)) {
            return;
        }
        if (!$post instanceof WP_Post || $post->post_status !== 'publish') {
            return;
        }
        self::queue_post((int) $post_id);
    }

    /**
     * @param int $post_id Post id.
     */
    private static function queue_post($post_id) {
        if (Soti_Engine::runner() === '') {
            update_option('soti_programs_blocked', '1', false);
        } else {
            delete_option('soti_programs_blocked');
        }
        delete_transient('soti_fails_' . (int) $post_id);
        Soti_Engine::schedule($post_id);
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
        $post_id  = (int) get_queried_object_id();
        $boot     = array(
            'selector'  => $selector,
            'postId'    => $post_id,
            'statusUrl' => add_query_arg('post_id', $post_id, rest_url('shenidar/v1/status')),
        );

        wp_add_inline_script(
            'soti',
            'window.SOTI_BOOT = ' . wp_json_encode($boot) . ';',
            'before'
        );
    }

    /**
     * Status for the player, and a loopback that renders on the server.
     */
    public static function register_routes() {
        register_rest_route(
            'shenidar/v1',
            '/status',
            array(
                'methods'             => 'GET',
                'callback'            => array(__CLASS__, 'status'),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'post_id' => array(
                        'type'              => 'integer',
                        'required'          => true,
                        'sanitize_callback' => 'absint',
                    ),
                ),
            )
        );

        register_rest_route(
            'shenidar/v1',
            '/generate',
            array(
                'methods'             => 'POST',
                'callback'            => array(__CLASS__, 'generate_request'),
                'permission_callback' => array(__CLASS__, 'can_generate'),
            )
        );
    }

    /**
     * @param WP_REST_Request $request Request.
     * @return bool
     */
    public static function can_generate($request) {
        $post_id = (int) $request->get_param('post_id');
        $token   = (string) $request->get_param('token');
        if ($post_id <= 0 || $token === '') {
            return false;
        }
        return hash_equals(Soti_Engine::token($post_id), $token);
    }

    /**
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public static function status($request) {
        $post_id = (int) $request->get_param('post_id');
        $post    = get_post($post_id);
        if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
            $body = array(
                'state' => 'unavailable',
                'clips' => array(
                    'manijeh' => null,
                    'bijan'   => null,
                ),
            );
        } else {
            $body = Soti_Engine::public_status($post_id);
            if ($body['state'] === 'preparing') {
                Soti_Engine::schedule($post_id);
            }
        }
        $response = rest_ensure_response($body);
        $response->header('Cache-Control', 'no-store');
        return $response;
    }

    /**
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public static function generate_request($request) {
        $post_id = (int) $request->get_param('post_id');
        Soti_Engine::generate($post_id);
        $response = rest_ensure_response(Soti_Engine::public_status($post_id));
        $response->header('Cache-Control', 'no-store');
        return $response;
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
