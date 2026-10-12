<?php
/**
 * Speaks one published post.
 *
 * Piper runs when this host allows programs and the engine files are present.
 * Otherwise PHP sends that post's own text to the HTTP speech service and stores
 * the wav under wp-content/uploads/shenidar/{post}/{voice}/.
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
        $uploads = wp_upload_dir();
        if (!empty($uploads['error']) || empty($uploads['basedir']) || empty($uploads['baseurl'])) {
            return $empty;
        }
        $hash = substr(hash('sha256', $voice . "\n" . $text), 0, 16);
        $dir  = $uploads['basedir'] . '/shenidar/' . $post_id . '/' . $voice;
        $name = $hash . '.wav';
        $path = $dir . '/' . $name;
        $url  = rtrim((string) $uploads['baseurl'], '/') . '/shenidar/' . $post_id . '/' . $voice . '/' . $name;
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
        $wrote = false;
        if (self::runner() !== '' && self::is_ready()) {
            $wrote = self::synthesize($text, $voice, $tmp);
        }
        if (!$wrote) {
            $wrote = self::synthesize_http($text, $voice, $tmp);
        }
        if (!$wrote || !is_file($tmp) || filesize($tmp) < 44) {
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

    /**
     * Ask the HTTP speech service for this article and write one wav.
     *
     * @param string $text  Article text.
     * @param string $voice manijeh or bijan.
     * @param string $dest  Wav path.
     * @return bool
     */
    private static function synthesize_http($text, $voice, $dest) {
        $voices = self::voices();
        $parts  = array();
        foreach (self::text_chunks($text, 450) as $chunk) {
            $wav = self::remote_wav($voices[$voice], $chunk);
            if ($wav === '') {
                return false;
            }
            $parts[] = $wav;
        }
        $joined = self::join_wavs($parts);
        if ($joined === '' || strlen($joined) < 44) {
            return false;
        }
        return file_put_contents($dest, $joined) !== false;
    }

    /**
     * Pieces short enough for one anonymous request.
     *
     * @param string $text  Article text.
     * @param int    $limit Character limit.
     * @return array<int,string>
     */
    private static function text_chunks($text, $limit) {
        $text = trim($text);
        if ($text === '') {
            return array();
        }
        if (self::char_len($text) <= $limit) {
            return array($text);
        }
        $sentences = preg_split('/(?<=[\.!\?؟])\s+/u', $text);
        if (!is_array($sentences) || $sentences === array()) {
            $sentences = array($text);
        }
        $chunks = array();
        $buf    = '';
        foreach ($sentences as $sentence) {
            foreach (self::split_long(trim((string) $sentence), $limit) as $piece) {
                if ($piece === '') {
                    continue;
                }
                if ($buf === '') {
                    $buf = $piece;
                    continue;
                }
                $joined = $buf . ' ' . $piece;
                if (self::char_len($joined) <= $limit) {
                    $buf = $joined;
                    continue;
                }
                $chunks[] = $buf;
                $buf      = $piece;
            }
        }
        if ($buf !== '') {
            $chunks[] = $buf;
        }
        return $chunks;
    }

    /**
     * @param string $text  One sentence.
     * @param int    $limit Character limit.
     * @return array<int,string>
     */
    private static function split_long($text, $limit) {
        if ($text === '') {
            return array();
        }
        if (self::char_len($text) <= $limit) {
            return array($text);
        }
        $words = preg_split('/\s+/u', $text);
        if (!is_array($words)) {
            $words = array($text);
        }
        $out = array();
        $buf = '';
        foreach ($words as $word) {
            $word = trim((string) $word);
            if ($word === '') {
                continue;
            }
            if (self::char_len($word) > $limit) {
                if ($buf !== '') {
                    $out[] = $buf;
                    $buf   = '';
                }
                $start = 0;
                $len   = self::char_len($word);
                while ($start < $len) {
                    $out[]  = self::char_slice($word, $start, $limit);
                    $start += $limit;
                }
                continue;
            }
            $joined = $buf === '' ? $word : $buf . ' ' . $word;
            if (self::char_len($joined) <= $limit) {
                $buf = $joined;
                continue;
            }
            $out[] = $buf;
            $buf   = $word;
        }
        if ($buf !== '') {
            $out[] = $buf;
        }
        return $out;
    }

    /**
     * @param string $voice_file Piper voice id.
     * @param string $text       One short chunk of this article.
     * @return string Wav bytes, or empty.
     */
    private static function remote_wav($voice_file, $text) {
        $response = wp_remote_post(
            'https://api.tts.ai/v1/tts/',
            array(
                'timeout' => 30,
                'headers' => array(
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                ),
                'body'    => wp_json_encode(
                    array(
                        'model'    => 'piper',
                        'text'     => $text,
                        'voice'    => $voice_file,
                        'language' => 'fa',
                        'format'   => 'wav',
                    )
                ),
            )
        );
        $job = self::decode_job($response);
        if ($job === null) {
            return '';
        }
        $audio = self::audio_url_from_job($job);
        if ($audio === '' && !empty($job['uuid']) && is_string($job['uuid']) && preg_match('/^[a-f0-9]{16,64}$/', $job['uuid'])) {
            for ($try = 0; $try < 12; $try++) {
                sleep(1);
                $poll = wp_remote_get(
                    'https://api.tts.ai/v1/speech/results/?uuid=' . rawurlencode($job['uuid']),
                    array(
                        'timeout' => 20,
                        'headers' => array(
                            'Accept' => 'application/json',
                        ),
                    )
                );
                $status = self::decode_job($poll);
                if ($status === null) {
                    continue;
                }
                if (isset($status['status']) && $status['status'] === 'failed') {
                    return '';
                }
                $audio = self::audio_url_from_job($status);
                if ($audio !== '') {
                    break;
                }
            }
        }
        if (!self::safe_tts_url($audio)) {
            return '';
        }
        return self::download_wav($audio);
    }

    /**
     * @param array<string,mixed>|WP_Error $response Response.
     * @return array<string,mixed>|null
     */
    private static function decode_job($response) {
        if (is_wp_error($response) || (int) wp_remote_retrieve_response_code($response) !== 200) {
            return null;
        }
        $data = json_decode((string) wp_remote_retrieve_body($response), true);
        return is_array($data) ? $data : null;
    }

    /**
     * @param array<string,mixed> $job Job payload.
     * @return string
     */
    private static function audio_url_from_job($job) {
        if (isset($job['status']) && $job['status'] === 'failed') {
            return '';
        }
        if (isset($job['status']) && $job['status'] !== 'completed') {
            return '';
        }
        foreach (array('result_url', 'url') as $key) {
            if (!empty($job[ $key ]) && is_string($job[ $key ])) {
                return $job[ $key ];
            }
        }
        return '';
    }

    /**
     * @param string $url Download URL.
     * @return bool
     */
    private static function safe_tts_url($url) {
        if (!is_string($url) || $url === '') {
            return false;
        }
        $parts = wp_parse_url($url);
        if (!is_array($parts) || empty($parts['scheme']) || strtolower((string) $parts['scheme']) !== 'https') {
            return false;
        }
        $host = isset($parts['host']) ? strtolower((string) $parts['host']) : '';
        return $host === 'tts.ai' || substr($host, -7) === '.tts.ai';
    }

    /**
     * @param string $url Wav URL on the speech host.
     * @return string
     */
    private static function download_wav($url) {
        $file = wp_remote_get(
            $url,
            array(
                'timeout' => 60,
            )
        );
        if (is_wp_error($file) || (int) wp_remote_retrieve_response_code($file) !== 200) {
            return '';
        }
        $body = (string) wp_remote_retrieve_body($file);
        if (strlen($body) < 44 || strlen($body) > 2000000 || self::wav_pcm($body) === null) {
            return '';
        }
        return $body;
    }

    /**
     * @param array<int,string> $parts Wav files.
     * @return string
     */
    private static function join_wavs($parts) {
        $fmt  = null;
        $data = '';
        foreach ($parts as $bytes) {
            $parsed = self::wav_pcm($bytes);
            if ($parsed === null) {
                return '';
            }
            if ($fmt === null) {
                $fmt = $parsed['fmt'];
            } elseif ($parsed['fmt'] !== $fmt) {
                return '';
            }
            $data .= $parsed['data'];
        }
        if ($fmt === null || $data === '') {
            return '';
        }
        $body = 'WAVE' . 'fmt ' . pack('V', strlen($fmt)) . $fmt . 'data' . pack('V', strlen($data)) . $data;
        return 'RIFF' . pack('V', strlen($body)) . $body;
    }

    /**
     * @param string $bytes Wav bytes.
     * @return array{fmt:string,data:string}|null
     */
    private static function wav_pcm($bytes) {
        if (strlen($bytes) < 44 || substr($bytes, 0, 4) !== 'RIFF' || substr($bytes, 8, 4) !== 'WAVE') {
            return null;
        }
        $offset = 12;
        $length = strlen($bytes);
        $fmt    = null;
        $data   = null;
        while ($offset + 8 <= $length) {
            $id   = substr($bytes, $offset, 4);
            $size = unpack('V', substr($bytes, $offset + 4, 4));
            $size = isset($size[1]) ? (int) $size[1] : 0;
            $offset += 8;
            if ($size < 0 || $offset + $size > $length) {
                return null;
            }
            $chunk = substr($bytes, $offset, $size);
            if ($id === 'fmt ') {
                $fmt = substr($chunk, 0, 16);
            } elseif ($id === 'data') {
                $data = $chunk;
            }
            $offset += $size + ($size % 2);
        }
        if ($fmt === null || strlen($fmt) < 16 || $data === null || strlen($data) < 2) {
            return null;
        }
        return array(
            'fmt'  => $fmt,
            'data' => $data,
        );
    }

    /**
     * @param string $text Text.
     * @return int
     */
    private static function char_len($text) {
        if (function_exists('mb_strlen')) {
            return (int) mb_strlen($text);
        }
        return strlen($text);
    }

    /**
     * @param string $text  Text.
     * @param int    $start Start.
     * @param int    $len   Length.
     * @return string
     */
    private static function char_slice($text, $start, $len) {
        if (function_exists('mb_substr')) {
            return (string) mb_substr($text, $start, $len);
        }
        return substr($text, $start, $len);
    }
}
