<?php
/**
 * Host-side Piper for one published post.
 *
 * Voice files and the Linux Piper build live in wp-content/uploads/shenidar-engine/.
 * Each article is written under wp-content/uploads/shenidar/. Nothing here calls a
 * remote speech API, and a missing exec permission never falls back to a recording.
 *
 * @package Soti
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Synthesizes the open post with the uploaded Piper voices.
 */
class Soti_Engine {

    const BLOCKED_MESSAGE = 'این میزبان اجازهٔ اجرای برنامهٔ گفتار را نمی‌دهد.';

    const UNAVAILABLE_MESSAGE = 'صدا در این سایت در دسترس نیست.';

    const MISSING_MESSAGE = 'متن این خبر پیدا نشد.';

    /**
     * Visitor voice id to the Piper file stem in the engine folder.
     *
     * @return array<string,string>
     */
    public static function voices() {
        return array(
            'manijeh' => 'fa_IR-mana-medium',
            'bijan'   => 'fa_IR-gyro-medium',
        );
    }

    /**
     * proc_open when the host allows it, otherwise exec.
     *
     * @return string
     */
    public static function runner() {
        $disabled = array_map('trim', explode(',', strtolower((string) ini_get('disable_functions'))));
        $proc     = function_exists('proc_open') && !in_array('proc_open', $disabled, true);
        $exec     = function_exists('exec') && !in_array('exec', $disabled, true);
        if ($proc) {
            return 'proc_open';
        }
        if ($exec) {
            return 'exec';
        }
        return '';
    }

    /**
     * @return string
     */
    public static function engine_dir() {
        $uploads = wp_upload_dir();
        if (!empty($uploads['error']) || empty($uploads['basedir'])) {
            return '';
        }
        return $uploads['basedir'] . '/shenidar-engine';
    }

    /**
     * @return string
     */
    public static function binary_path() {
        $dir = self::engine_dir();
        if ($dir === '') {
            return '';
        }
        $name = PHP_OS_FAMILY === 'Windows' ? 'piper.exe' : 'piper';
        return $dir . '/piper/' . $name;
    }

    /**
     * @return bool
     */
    public static function is_ready() {
        $binary = self::binary_path();
        $dir    = self::engine_dir();
        if ($binary === '' || !is_file($binary) || !is_dir(dirname($binary) . '/espeak-ng-data')) {
            return false;
        }
        foreach (self::voices() as $file) {
            $model = $dir . '/voices/' . $file . '.onnx';
            $json  = $model . '.json';
            if (!is_file($model) || filesize($model) < 1000000 || !is_file($json) || filesize($json) < 50) {
                return false;
            }
        }
        return true;
    }

    /**
     * Plain text of the stored post body. Widgets and comments are not in post_content.
     *
     * @param string $html Post content.
     * @return string
     */
    public static function article_text($html) {
        $html = strip_shortcodes((string) $html);
        $html = preg_replace('#<(script|style|noscript)\b[^>]*>.*?</\1>#is', ' ', $html);
        $text = wp_strip_all_tags((string) $html);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', (string) $text);
        $text = trim((string) $text);
        if (function_exists('mb_substr')) {
            return mb_substr($text, 0, 2500);
        }
        return substr($text, 0, 2500);
    }

    /**
     * Speak one published post. The returned URL is that post's own wav, or empty.
     *
     * @param int    $post_id Post id.
     * @param string $voice   manijeh or bijan.
     * @return array{ok:bool,url:string,message:string}
     */
    public static function speak($post_id, $voice) {
        $empty = array(
            'ok'      => false,
            'url'     => '',
            'message' => self::UNAVAILABLE_MESSAGE,
        );
        $post_id = (int) $post_id;
        $voice   = $voice === 'bijan' ? 'bijan' : 'manijeh';
        $post    = get_post($post_id);
        if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
            $empty['message'] = self::MISSING_MESSAGE;
            return $empty;
        }
        $text = self::article_text($post->post_content);
        if ($text === '') {
            $empty['message'] = self::MISSING_MESSAGE;
            return $empty;
        }
        if (self::runner() === '') {
            $empty['message'] = self::BLOCKED_MESSAGE;
            return $empty;
        }
        if (!self::is_ready()) {
            return $empty;
        }
        $uploads = wp_upload_dir();
        if (!empty($uploads['error']) || empty($uploads['basedir']) || empty($uploads['baseurl'])) {
            return $empty;
        }
        $hash = substr(hash('sha256', $voice . "\n" . $text), 0, 16);
        $dir  = $uploads['basedir'] . '/shenidar/' . $post_id;
        $name = $voice . '-' . $hash . '.wav';
        $path = $dir . '/' . $name;
        $url  = rtrim((string) $uploads['baseurl'], '/') . '/shenidar/' . $post_id . '/' . $name;
        if (is_file($path) && filesize($path) > 44) {
            return array(
                'ok'      => true,
                'url'     => $url,
                'message' => '',
            );
        }
        if (!wp_mkdir_p($dir)) {
            return $empty;
        }
        $tmp = $path . '.part';
        if (is_file($tmp)) {
            unlink($tmp);
        }
        if (!self::synthesize($text, $voice, $tmp) || !is_file($tmp) || filesize($tmp) < 44) {
            if (is_file($tmp)) {
                unlink($tmp);
            }
            return $empty;
        }
        if (!rename($tmp, $path)) {
            unlink($tmp);
            return $empty;
        }
        return array(
            'ok'      => true,
            'url'     => $url,
            'message' => '',
        );
    }

    /**
     * @param string $text  Article text.
     * @param string $voice manijeh or bijan.
     * @param string $dest  Wav path.
     * @return bool
     */
    private static function synthesize($text, $voice, $dest) {
        $voices = self::voices();
        $binary = self::binary_path();
        $model  = self::engine_dir() . '/voices/' . $voices[$voice] . '.onnx';
        $espeak = dirname($binary) . '/espeak-ng-data';
        if (!is_file($binary) || !is_file($model) || !is_dir($espeak)) {
            return false;
        }
        $runner = self::runner();
        if ($runner === 'proc_open') {
            return self::synthesize_proc($binary, $model, $espeak, $text, $dest);
        }
        if ($runner === 'exec') {
            return self::synthesize_exec($binary, $model, $espeak, $text, $dest);
        }
        return false;
    }

    /**
     * @param string $binary Piper binary.
     * @param string $model  Onnx path.
     * @param string $espeak espeak-ng-data directory.
     * @param string $text   Article text.
     * @param string $dest   Wav path.
     * @return bool
     */
    private static function synthesize_proc($binary, $model, $espeak, $text, $dest) {
        $env   = self::process_env(dirname($binary));
        $pipes = array();
        $proc  = proc_open(
            array($binary, '--model', $model, '--output_file', $dest, '--espeak_data', $espeak),
            array(
                0 => array('pipe', 'r'),
                1 => array('pipe', 'w'),
                2 => array('pipe', 'w'),
            ),
            $pipes,
            dirname($binary),
            $env
        );
        if (!is_resource($proc)) {
            return false;
        }
        fwrite($pipes[0], $text);
        fclose($pipes[0]);
        stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        $code = proc_close($proc);
        return $code === 0 && is_file($dest) && filesize($dest) > 44;
    }

    /**
     * @param string $binary Piper binary.
     * @param string $model  Onnx path.
     * @param string $espeak espeak-ng-data directory.
     * @param string $text   Article text.
     * @param string $dest   Wav path.
     * @return bool
     */
    private static function synthesize_exec($binary, $model, $espeak, $text, $dest) {
        $input = tempnam(sys_get_temp_dir(), 'soti');
        if ($input === false) {
            return false;
        }
        file_put_contents($input, $text);
        $line   = 'LD_LIBRARY_PATH=' . escapeshellarg(dirname($binary))
            . ' ' . escapeshellarg($binary)
            . ' --model ' . escapeshellarg($model)
            . ' --output_file ' . escapeshellarg($dest)
            . ' --espeak_data ' . escapeshellarg($espeak)
            . ' < ' . escapeshellarg($input);
        $output = array();
        $code   = 1;
        exec($line, $output, $code);
        unlink($input);
        return $code === 0 && is_file($dest) && filesize($dest) > 44;
    }

    /**
     * @param string $library_dir Directory that holds Piper's shared libraries.
     * @return array<string,string>
     */
    private static function process_env($library_dir) {
        $env = array();
        foreach (array('PATH', 'LANG', 'LC_ALL', 'TMPDIR', 'TMP', 'TEMP') as $key) {
            $value = getenv($key);
            if (is_string($value) && $value !== '') {
                $env[$key] = $value;
            }
        }
        $env['LD_LIBRARY_PATH'] = $library_dir;
        $env['HOME']            = self::engine_dir() !== '' ? self::engine_dir() : sys_get_temp_dir();
        return $env;
    }
}
