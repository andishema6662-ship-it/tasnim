<?php
/**
 * Proves a published post reaches a real wav URL when proc_open is disabled.
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
 * @param string               $method Method.
 * @param string               $url    URL.
 * @param array<string,mixed>  $args   Args.
 * @return array<string,mixed>|WP_Error
 */
function soti_http($method, $url, $args) {
    $headers = array();
    if (!empty($args['headers']) && is_array($args['headers'])) {
        foreach ($args['headers'] as $name => $value) {
            $headers[] = $name . ': ' . $value;
        }
    }
    $context = stream_context_create(
        array(
            'http' => array(
                'method'          => $method,
                'header'          => implode("\r\n", $headers),
                'content'         => $method === 'POST' && isset($args['body']) ? $args['body'] : '',
                'timeout'         => isset($args['timeout']) ? (int) $args['timeout'] : 20,
                'ignore_errors'   => true,
                'follow_location' => 1,
            ),
        )
    );
    $body = @file_get_contents($url, false, $context);
    $code = 0;
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $line) {
            if (preg_match('#^HTTP/\\S+\\s+(\\d+)#', $line, $match)) {
                $code = (int) $match[1];
            }
        }
    }
    if ($body === false) {
        return new WP_Error('http_request_failed', 'request failed');
    }
    return array(
        'body'     => $body,
        'response' => array('code' => $code),
    );
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

$saw_unavailable = false;
$final           = array();
for ($try = 1; $try <= 80; $try++) {
    $post = get_post(42);
    if ($post && $post->post_type === 'post' && $post->post_status === 'publish') {
        Soti_Engine::step(42);
    }
    $final = Soti_Engine::public_status(42);
    $job   = get_transient('soti_job_42');
    $voice = is_array($job) && isset($job['voice']) ? $job['voice'] : '-';
    $phase = is_array($job) && $job['result_url'] !== '' ? 'fetch' : (is_array($job) && $job['uuid'] !== '' ? 'poll' : 'submit');
    echo "step {$try} state={$final['state']} voice={$voice} phase={$phase} manijeh=" . ($final['clips']['manijeh'] ? 'yes' : 'no') . " bijan=" . ($final['clips']['bijan'] ? 'yes' : 'no') . "\n";
    if ($final['state'] === 'unavailable') {
        $saw_unavailable = true;
        break;
    }
    if ($final['state'] === 'ready' && !empty($final['clips']['manijeh']) && !empty($final['clips']['bijan'])) {
        break;
    }
    sleep(2);
}

$manijeh = $uploads . '/shenidar/42/manijeh.wav';
$bijan   = $uploads . '/shenidar/42/bijan.wav';
$ok      = !$saw_unavailable
    && isset($final['state']) && $final['state'] === 'ready'
    && !empty($final['clips']['manijeh'])
    && !empty($final['clips']['bijan'])
    && is_file($manijeh) && is_file($bijan)
    && file_get_contents($manijeh, false, null, 0, 4) === 'RIFF'
    && file_get_contents($bijan, false, null, 0, 4) === 'RIFF';

echo 'manijeh_url=' . (isset($final['clips']['manijeh']) ? $final['clips']['manijeh'] : '') . "\n";
echo 'bijan_url=' . (isset($final['clips']['bijan']) ? $final['clips']['bijan'] : '') . "\n";
echo 'unavailable_seen=' . ($saw_unavailable ? 'yes' : 'no') . "\n";
echo $ok ? "PASS\n" : "FAIL\n";
exit($ok ? 0 : 1);
