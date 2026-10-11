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
        add_action('rest_api_init', array(__CLASS__, 'register_routes'));
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
        $uploads  = wp_upload_dir();
        $boot     = array(
            'selector' => $selector,
            'postId'   => (int) get_queried_object_id(),
        );

        if (empty($uploads['error']) && !empty($uploads['baseurl'])) {
            $boot['audioBase']     = $uploads['baseurl'] . '/shenidar';
            $boot['saveEndpoint']  = rest_url('shenidar/v1/audio');
            $boot['nonce']         = wp_create_nonce('wp_rest');
        }

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
     * Saves synthesized article audio under wp-content/uploads/shenidar/.
     */
    public static function register_routes() {
        register_rest_route(
            'shenidar/v1',
            '/audio',
            array(
                'methods'             => 'POST',
                'callback'            => array(__CLASS__, 'save_audio'),
                'permission_callback' => array(__CLASS__, 'can_save_audio'),
            )
        );
    }

    /**
     * Visitors who loaded the post may store the clip they just synthesized.
     *
     * @param WP_REST_Request $request Request.
     * @return bool
     */
    public static function can_save_audio($request) {
        $nonce = $request->get_header('X-WP-Nonce');
        return is_string($nonce) && wp_verify_nonce($nonce, 'wp_rest') !== false;
    }

    /**
     * Writes one WAV for a post, voice, and chunk.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public static function save_audio($request) {
        $post_id = (int) $request->get_param('post_id');
        $voice   = (string) $request->get_param('voice');
        $key     = (string) $request->get_param('key');
        $post    = get_post($post_id);

        if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
            return new WP_Error('shenidar_post', 'post', array('status' => 404));
        }

        if ($voice !== 'manijeh' && $voice !== 'bijan') {
            return new WP_Error('shenidar_voice', 'voice', array('status' => 400));
        }

        if (!preg_match('/^[a-f0-9]{1,16}-[0-9]{1,6}$/', $key)) {
            return new WP_Error('shenidar_key', 'key', array('status' => 400));
        }

        $files = $request->get_file_params();
        $file  = isset($files['audio']) && is_array($files['audio']) ? $files['audio'] : null;
        if (!$file && isset($_FILES['audio']) && is_array($_FILES['audio'])) {
            $file = $_FILES['audio'];
        }

        $tmp  = $file && isset($file['tmp_name']) ? (string) $file['tmp_name'] : '';
        $size = $file && isset($file['size']) ? (int) $file['size'] : 0;
        if ($tmp === '' || !is_uploaded_file($tmp) || $size < 44 || $size > 2000000) {
            return new WP_Error('shenidar_audio', 'audio', array('status' => 400));
        }

        $header = file_get_contents($tmp, false, null, 0, 4);
        if ($header !== 'RIFF') {
            return new WP_Error('shenidar_wav', 'wav', array('status' => 400));
        }

        $uploads = wp_upload_dir();
        if (!empty($uploads['error'])) {
            return new WP_Error('shenidar_uploads', 'uploads', array('status' => 500));
        }

        $dir = $uploads['basedir'] . '/shenidar/' . $post_id . '/' . $voice;
        if (!wp_mkdir_p($dir)) {
            return new WP_Error('shenidar_dir', 'dir', array('status' => 500));
        }

        $dest = $dir . '/' . $key . '.wav';
        if (!move_uploaded_file($tmp, $dest)) {
            return new WP_Error('shenidar_write', 'write', array('status' => 500));
        }

        return rest_ensure_response(
            array(
                'url' => $uploads['baseurl'] . '/shenidar/' . $post_id . '/' . $voice . '/' . $key . '.wav',
            )
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
