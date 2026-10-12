<?php
/**
 * Proves a blocked host still saves the article wav from the HTTP speech service.
 *
 * Run: php -d disable_functions=proc_open,exec tests/prove-remote-status.php
 *
 * @package Soti
 */

define('ABSPATH', sys_get_temp_dir() . '/soti-abspath/');
define('DAY_IN_SECONDS', 86400);
define('HOUR_IN_SECONDS', 3600);
define('MINUTE_IN_SECONDS', 60);

$uploads = sys_get_temp_dir() . '/soti-prove-' . getmypid();
if (!is_dir($uploads) && !mkdir($uploads, 0777, true)) {
    fwrite(STDERR, "mkdir failed\n");
    exit(1);
}

$GLOBALS['soti_transients'] = array();
$GLOBALS['soti_uploads']    = $uploads;

class WP_Error {
    /**
     * @var string
     */
    public $message;

    /**
     * @param string $code    Code.
     * @param string $message Message.
     */
    public function __construct($code, $message) {
        unset($code);
        $this->message = $message;
    }
}

/**
 * @param mixed $thing Value.
 * @return bool
 */
function is_wp_error($thing) {
    return $thing instanceof WP_Error;
}

/**
 * @param string $key Key.
 * @return mixed
 */
function get_transient($key) {
    return array_key_exists($key, $GLOBALS['soti_transients']) ? $GLOBALS['soti_transients'][ $key ] : false;
}

/**
 * @param string $key   Key.
 * @param mixed  $value Value.
 * @param int    $ttl   TTL.
 * @return bool
 */
function set_transient($key, $value, $ttl = 0) {
    unset($ttl);
    $GLOBALS['soti_transients'][ $key ] = $value;
    return true;
}

/**
 * @param string $key Key.
 * @return bool
 */
function delete_transient($key) {
    unset($GLOBALS['soti_transients'][ $key ]);
    return true;
}

/**
 * @param int $post_id Post id.
 * @return object|null
 */
function get_post($post_id) {
    if ((int) $post_id !== 42) {
        return null;
    }
    return (object) array(
        'ID'           => 42,
        'post_type'    => 'post',
        'post_status'  => 'publish',
        'post_content' => 'سلام دوستان.',
    );
}

/**
 * @return array<string,string>
 */
function wp_upload_dir() {
    return array(
        'basedir' => $GLOBALS['soti_uploads'],
        'baseurl' => 'https://example.test/wp-content/uploads',
        'error'   => '',
    );
}

/**
 * @param string $dir Directory.
 * @return bool
 */
function wp_mkdir_p($dir) {
    return is_dir($dir) || mkdir($dir, 0777, true);
}

/**
 * @param mixed $data Data.
 * @return string
 */
function wp_json_encode($data) {
    return (string) json_encode($data, JSON_UNESCAPED_UNICODE);
}

/**
 * @param string $url URL.
 * @return array<string,mixed>|false
 */
function wp_parse_url($url) {
    return parse_url($url);
}

/**
 * @param string $content Content.
 * @return string
 */
function strip_shortcodes($content) {
    return (string) $content;
}

/**
 * @param string $content Content.
 * @return string
 */
function wp_strip_all_tags($content) {
    return trim(strip_tags((string) $content));
}

/**
 * @return string
 */
function soti_tiny_wav() {
    $data = str_repeat("\x00\x10", 200);
    $size = strlen($data);
    return 'RIFF' . pack('V', 36 + $size) . 'WAVE'
        . 'fmt ' . pack('V', 16) . pack('v', 1) . pack('v', 1) . pack('V', 22050) . pack('V', 44100) . pack('v', 2) . pack('v', 16)
        . 'data' . pack('V', $size) . $data;
}

/**
 * @param string              $method Method.
 * @param string              $url    URL.
 * @param array<string,mixed> $args   Args.
 * @return array<string,mixed>|WP_Error
 */
function soti_http($method, $url, $args) {
    if (!empty($GLOBALS['soti_http_fail'])) {
        return new WP_Error('http_request_failed', 'request failed');
    }
    if ($method === 'POST' && strpos($url, 'https://api.tts.ai/v1/tts/') === 0) {
        $GLOBALS['soti_last_body'] = isset($args['body']) ? (string) $args['body'] : '';
        return array(
            'body'     => wp_json_encode(
                array(
                    'uuid'       => 'abc123abc123abc123abc123abc123ab',
                    'status'     => 'completed',
                    'result_url' => 'https://cdn.tts.ai/abc123abc123abc123abc123abc123ab/tts_output.wav',
                )
            ),
            'response' => array('code' => 200),
        );
    }
    if ($method === 'GET' && strpos($url, 'https://cdn.tts.ai/') === 0) {
        return array(
            'body'     => soti_tiny_wav(),
            'response' => array('code' => 200),
        );
    }
    return new WP_Error('http_request_failed', 'unexpected url');
}

/**
 * @param string              $url  URL.
 * @param array<string,mixed> $args Args.
 * @return array<string,mixed>|WP_Error
 */
function wp_remote_post($url, $args = array()) {
    return soti_http('POST', $url, $args);
}

/**
 * @param string              $url  URL.
 * @param array<string,mixed> $args Args.
 * @return array<string,mixed>|WP_Error
 */
function wp_remote_get($url, $args = array()) {
    return soti_http('GET', $url, $args);
}

/**
 * @param array<string,mixed>|WP_Error $response Response.
 * @return int
 */
function wp_remote_retrieve_response_code($response) {
    if (!is_array($response) || empty($response['response']['code'])) {
        return 0;
    }
    return (int) $response['response']['code'];
}

/**
 * @param array<string,mixed>|WP_Error $response Response.
 * @return string
 */
function wp_remote_retrieve_body($response) {
    if (!is_array($response) || !isset($response['body'])) {
        return '';
    }
    return (string) $response['body'];
}

require dirname(__DIR__) . '/includes/class-soti-engine.php';

$runner = Soti_Engine::runner();
echo "runner={$runner}\n";
if ($runner !== '') {
    fwrite(STDERR, "proc_open or exec is still available\n");
    exit(1);
}

$blocked = 'این میزبان اجازهٔ اجرای برنامهٔ گفتار را نمی‌دهد.';
$missing = 'صدا در این سایت در دسترس نیست.';

$GLOBALS['soti_http_fail'] = true;
$failed = Soti_Engine::speak(42, 'bijan');
$wavs   = glob($uploads . '/shenidar/*/*/*.wav');
$fail_ok = is_array($failed)
    && empty($failed['ok'])
    && empty($failed['url'])
    && isset($failed['message'])
    && $failed['message'] === $missing
    && $failed['message'] !== $blocked
    && $wavs === array();

$GLOBALS['soti_http_fail'] = false;
$spoken = Soti_Engine::speak(42, 'bijan');
$wavs   = glob($uploads . '/shenidar/*/*/*.wav');
$body   = isset($GLOBALS['soti_last_body']) ? $GLOBALS['soti_last_body'] : '';
$speak_ok = is_array($spoken)
    && !empty($spoken['ok'])
    && !empty($spoken['url'])
    && strpos($spoken['url'], '/shenidar/42/bijan/') !== false
    && substr($spoken['url'], -4) === '.wav'
    && $spoken['message'] === ''
    && $spoken['message'] !== $blocked
    && is_array($wavs)
    && count($wavs) === 1
    && filesize($wavs[0]) > 44
    && strpos($body, 'سلام دوستان.') !== false
    && strpos($body, 'fa_IR-gyro-medium') !== false;

$GLOBALS['soti_http_fail'] = true;
$again = Soti_Engine::speak(42, 'bijan');
$again_ok = is_array($again)
    && !empty($again['ok'])
    && $again['url'] === $spoken['url']
    && $again['message'] === '';

$ok = $fail_ok && $speak_ok && $again_ok;
echo 'fail_message=' . (isset($failed['message']) ? $failed['message'] : '') . "\n";
echo 'url=' . (isset($spoken['url']) ? $spoken['url'] : '') . "\n";
echo $ok ? "PASS\n" : "FAIL\n";
exit($ok ? 0 : 1);
