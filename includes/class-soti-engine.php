<?php
/**
 * Server-side Piper install and article audio.
 *
 * @package Soti
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Downloads Piper on the server and writes one clip per voice.
 */
class Soti_Engine {

    const RELEASE = 'https://github.com/rhasspy/piper/releases/download/2023.11.14-2/';

    /**
     * Voices the editor never loads in the visitor browser.
     *
     * @return array<string,array<string,string>>
     */
    public static function voices() {
        return array(
            'manijeh' => array(
                'file'   => 'fa_IR-mana-medium',
                'model'  => 'https://huggingface.co/MahtaFetrat/Mana-Persian-Piper/resolve/main/fa_IR-mana-medium.onnx',
                'config' => 'https://huggingface.co/MahtaFetrat/Mana-Persian-Piper/resolve/main/fa_IR-mana-medium.onnx.json',
            ),
            'bijan'   => array(
                'file'   => 'fa_IR-ganji-medium',
                'model'  => 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/ganji/medium/fa_IR-ganji-medium.onnx',
                'config' => 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/ganji/medium/fa_IR-ganji-medium.onnx.json',
            ),
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
        if ($binary === '' || !is_file($binary) || !is_dir($dir . '/piper/espeak-ng-data')) {
            return false;
        }
        foreach (self::voices() as $voice) {
            $model = $dir . '/voices/' . $voice['file'] . '.onnx';
            $json  = $model . '.json';
            if (!is_file($model) || filesize($model) < 1000000 || !is_file($json) || filesize($json) < 50) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param int $post_id Post id.
     * @return string
     */
    public static function token($post_id) {
        return wp_hash('soti|' . (int) $post_id);
    }

    /**
     * Queue a server render. Visitors do not run this.
     *
     * @param int $post_id Post id.
     */
    public static function schedule($post_id) {
        $post_id = (int) $post_id;
        if ($post_id <= 0 || self::runner() === '') {
            return;
        }
        if (!self::is_ready() && !wp_next_scheduled('soti_install_engine')) {
            wp_schedule_single_event(time() + 1, 'soti_install_engine');
        }
        $args = array($post_id);
        if (!wp_next_scheduled('soti_generate_post', $args)) {
            wp_schedule_single_event(time() + 5, 'soti_generate_post', $args);
        }
        if (get_transient('soti_queued_' . $post_id)) {
            if (function_exists('spawn_cron')) {
                spawn_cron();
            }
            return;
        }
        set_transient('soti_queued_' . $post_id, '1', 90);
        self::loopback($post_id);
        if (function_exists('spawn_cron')) {
            spawn_cron();
        }
    }

    /**
     * @param int $post_id Post id.
     */
    public static function loopback($post_id) {
        $post_id = (int) $post_id;
        wp_remote_post(
            rest_url('shenidar/v1/generate'),
            array(
                'timeout'  => 0.01,
                'blocking' => false,
                'body'     => array(
                    'post_id' => $post_id,
                    'token'   => self::token($post_id),
                ),
            )
        );
    }

    /**
     * @param int $post_id Post id.
     * @return array<string,mixed>
     */
    public static function public_status($post_id) {
        $clips = array(
            'manijeh' => null,
            'bijan'   => null,
        );
        if (self::runner() === '') {
            return array(
                'state' => 'unavailable',
                'clips' => $clips,
            );
        }
        $ready = 0;
        foreach (array_keys(self::voices()) as $voice) {
            $path = self::clip_path($post_id, $voice);
            if ($path !== '' && is_file($path) && filesize($path) > 44) {
                $clips[ $voice ] = self::clip_url($post_id, $voice);
                $ready++;
            }
        }
        return array(
            'state' => $ready === 2 ? 'ready' : 'preparing',
            'clips' => $clips,
        );
    }

    /**
     * Download the binary and both voices into uploads.
     *
     * @return bool
     */
    public static function install() {
        if (self::is_ready()) {
            return true;
        }
        if (self::runner() === '' || self::engine_dir() === '') {
            return false;
        }
        if (get_transient('soti_installing')) {
            return false;
        }
        set_transient('soti_installing', '1', 20 * MINUTE_IN_SECONDS);
        if (function_exists('set_time_limit')) {
            set_time_limit(0);
        }
        $ok = self::install_now();
        delete_transient('soti_installing');
        return $ok;
    }

    /**
     * Render both voices for a published post.
     *
     * @param int $post_id Post id.
     * @return bool
     */
    public static function generate($post_id) {
        $post_id = (int) $post_id;
        if ($post_id <= 0 || self::runner() === '') {
            return false;
        }
        if (get_transient('soti_running_' . $post_id)) {
            return false;
        }
        set_transient('soti_running_' . $post_id, '1', 10 * MINUTE_IN_SECONDS);
        if (function_exists('set_time_limit')) {
            set_time_limit(0);
        }
        $ok = false;
        if (self::install()) {
            $post = get_post($post_id);
            if ($post && $post->post_type === 'post' && $post->post_status === 'publish') {
                $text = self::article_text($post->post_content);
                $ok   = $text !== '' && self::write_voices($post_id, $text);
            }
        }
        delete_transient('soti_running_' . $post_id);
        delete_transient('soti_queued_' . $post_id);
        return $ok;
    }

    /**
     * @return bool
     */
    private static function install_now() {
        self::stretch_http(true);
        $dir = self::engine_dir();
        self::ensure_dir($dir);
        self::ensure_dir($dir . '/voices');
        $archive = self::archive();
        if (!$archive) {
            self::stretch_http(false);
            return false;
        }
        $packed = self::fetch($archive['url']);
        if ($packed === '') {
            self::stretch_http(false);
            return false;
        }
        $extracted = $archive['kind'] === 'zip' ? self::unzip($packed, $dir) : self::untar($packed, $dir);
        @unlink($packed);
        if (!$extracted) {
            self::stretch_http(false);
            return false;
        }
        $binary = self::binary_path();
        if ($binary !== '' && is_file($binary)) {
            @chmod($binary, 0755);
        }
        foreach (self::voices() as $voice) {
            $model = $dir . '/voices/' . $voice['file'] . '.onnx';
            $json  = $model . '.json';
            if (!self::fetch_to($voice['model'], $model, 1000000)) {
                self::stretch_http(false);
                return false;
            }
            if (!self::fetch_to($voice['config'], $json, 50)) {
                self::stretch_http(false);
                return false;
            }
        }
        self::stretch_http(false);
        return self::is_ready();
    }

    /**
     * @param bool $on Whether downloads may take several minutes.
     */
    private static function stretch_http($on) {
        if ($on) {
            add_filter('http_request_args', array(__CLASS__, 'http_args'));
            return;
        }
        remove_filter('http_request_args', array(__CLASS__, 'http_args'));
    }

    /**
     * @param array<string,mixed> $args Request args.
     * @return array<string,mixed>
     */
    public static function http_args($args) {
        $args['timeout'] = 300;
        return $args;
    }

    /**
     * @return array<string,string>|null
     */
    private static function archive() {
        $machine = strtolower((string) php_uname('m'));
        $family  = PHP_OS_FAMILY;
        if ($family === 'Windows') {
            if (in_array($machine, array('amd64', 'x86_64'), true)) {
                return array(
                    'url'  => self::RELEASE . 'piper_windows_amd64.zip',
                    'kind' => 'zip',
                );
            }
            return null;
        }
        if ($family === 'Darwin') {
            $name = in_array($machine, array('arm64', 'aarch64'), true) ? 'piper_macos_aarch64.tar.gz' : 'piper_macos_x64.tar.gz';
            return array(
                'url'  => self::RELEASE . $name,
                'kind' => 'tar',
            );
        }
        if (in_array($machine, array('aarch64', 'arm64'), true)) {
            $name = 'piper_linux_aarch64.tar.gz';
        } elseif (in_array($machine, array('armv7l', 'armv6l'), true)) {
            $name = 'piper_linux_armv7l.tar.gz';
        } elseif (in_array($machine, array('x86_64', 'amd64'), true)) {
            $name = 'piper_linux_x86_64.tar.gz';
        } else {
            return null;
        }
        return array(
            'url'  => self::RELEASE . $name,
            'kind' => 'tar',
        );
    }

    /**
     * @param string $url File URL.
     * @return string Temp path, or empty.
     */
    private static function fetch($url) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        $tmp = download_url($url, 300);
        if (is_wp_error($tmp)) {
            return '';
        }
        return $tmp;
    }

    /**
     * @param string $url  File URL.
     * @param string $dest Destination.
     * @param int    $min  Minimum accepted size.
     * @return bool
     */
    private static function fetch_to($url, $dest, $min) {
        if (is_file($dest) && filesize($dest) >= $min) {
            return true;
        }
        $tmp = self::fetch($url);
        if ($tmp === '') {
            return false;
        }
        $dir = dirname($dest);
        self::ensure_dir($dir);
        $part = $dest . '.part';
        $ok   = @copy($tmp, $part);
        @unlink($tmp);
        if (!$ok || !is_file($part) || filesize($part) < $min) {
            @unlink($part);
            return false;
        }
        return @rename($part, $dest);
    }

    /**
     * @param string $archive Archive path.
     * @param string $dest    Directory.
     * @return bool
     */
    private static function untar($archive, $dest) {
        $tar = is_file('/usr/bin/tar') ? '/usr/bin/tar' : 'tar';
        $ran = self::run(array($tar, '-xzf', $archive, '-C', $dest), '', $dest);
        return $ran === 0 && is_file(self::binary_path());
    }

    /**
     * @param string $archive Archive path.
     * @param string $dest    Directory.
     * @return bool
     */
    private static function unzip($archive, $dest) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        WP_Filesystem();
        $result = unzip_file($archive, $dest);
        return !is_wp_error($result) && is_file(self::binary_path());
    }

    /**
     * @param int    $post_id Post id.
     * @param string $text    Article text.
     * @return bool
     */
    private static function write_voices($post_id, $text) {
        $chunks = self::chunks($text);
        if (!$chunks) {
            return false;
        }
        $dir = self::clip_dir($post_id);
        if ($dir === '') {
            return false;
        }
        foreach (self::voices() as $voice => $spec) {
            $model  = self::engine_dir() . '/voices/' . $spec['file'] . '.onnx';
            $dest   = self::clip_path($post_id, $voice);
            $part   = $dest . '.part.wav';
            $pieces = array();
            $built  = true;
            foreach ($chunks as $index => $chunk) {
                $piece = $dir . '/' . $voice . '-' . $index . '.part.wav';
                if (self::synthesize($model, $chunk, $piece) !== 0) {
                    $built = false;
                    break;
                }
                $pieces[] = $piece;
            }
            if ($built && self::concat_wavs($pieces, $part) && @rename($part, $dest)) {
                foreach ($pieces as $piece) {
                    @unlink($piece);
                }
                continue;
            }
            @unlink($part);
            foreach ($pieces as $piece) {
                @unlink($piece);
            }
        }
        return is_file(self::clip_path($post_id, 'manijeh')) && is_file(self::clip_path($post_id, 'bijan'));
    }

    /**
     * @param string $model Model path.
     * @param string $text  Plain text.
     * @param string $dest  Wav path.
     * @return int
     */
    private static function synthesize($model, $text, $dest) {
        $binary = self::binary_path();
        $cwd    = self::engine_dir() . '/piper';
        $data   = $cwd . '/espeak-ng-data';
        $code   = self::run(
            array(
                $binary,
                '--model',
                $model,
                '--output_file',
                $dest,
                '--espeak_data',
                $data,
                '--quiet',
            ),
            $text,
            $cwd
        );
        if ($code !== 0 || !is_file($dest) || filesize($dest) < 44) {
            @unlink($dest);
            return 1;
        }
        return 0;
    }

    /**
     * @param array<int,string> $command Command and args.
     * @param string            $stdin   Text for the process.
     * @param string            $cwd     Working directory.
     * @return int
     */
    private static function run($command, $stdin, $cwd) {
        $runner = self::runner();
        if ($runner === '' || !$command) {
            return 1;
        }
        if ($runner === 'proc_open') {
            $env = array(
                'PATH'             => (string) getenv('PATH'),
                'HOME'             => self::engine_dir(),
                'LANG'             => 'C.UTF-8',
                'LC_ALL'           => 'C.UTF-8',
                'LD_LIBRARY_PATH'  => $cwd,
            );
            $pipes = array();
            $proc  = proc_open(
                $command,
                array(
                    0 => array('pipe', 'r'),
                    1 => array('pipe', 'w'),
                    2 => array('pipe', 'w'),
                ),
                $pipes,
                $cwd,
                $env
            );
            if (!is_resource($proc)) {
                return 1;
            }
            fwrite($pipes[0], $stdin);
            fclose($pipes[0]);
            stream_get_contents($pipes[1]);
            stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            return proc_close($proc);
        }
        $input = wp_tempnam('soti-text');
        if (!$input) {
            return 1;
        }
        file_put_contents($input, $stdin);
        $parts = array();
        foreach ($command as $part) {
            $parts[] = escapeshellarg($part);
        }
        $command_line = 'cd ' . escapeshellarg($cwd)
            . ' && LD_LIBRARY_PATH=' . escapeshellarg($cwd)
            . ' LANG=C.UTF-8 LC_ALL=C.UTF-8 '
            . implode(' ', $parts)
            . ' < ' . escapeshellarg($input);
        $output = array();
        $code   = 1;
        exec($command_line, $output, $code);
        @unlink($input);
        return (int) $code;
    }

    /**
     * @param string $content Post content.
     * @return string
     */
    private static function article_text($content) {
        $text = strip_shortcodes((string) $content);
        $text = wp_strip_all_tags($text);
        $text = preg_replace('/\s+/u', ' ', $text);
        $text = trim((string) $text);
        if (self::strlen_u($text) > 8000) {
            $text = self::substr_u($text, 0, 8000);
        }
        return $text;
    }

    /**
     * @param string $text Plain text.
     * @return array<int,string>
     */
    private static function chunks($text) {
        $text = trim($text);
        if ($text === '') {
            return array();
        }
        $parts = preg_split('/(?<=[\.!\?؟])\s+/u', $text);
        if (!is_array($parts) || !$parts) {
            $parts = array($text);
        }
        $chunks = array();
        $buffer = '';
        foreach ($parts as $part) {
            $part = trim((string) $part);
            if ($part === '') {
                continue;
            }
            while (self::strlen_u($part) > 400) {
                $chunks[] = self::substr_u($part, 0, 400);
                $part     = trim(self::substr_u($part, 400));
            }
            if ($part === '') {
                continue;
            }
            $next = $buffer === '' ? $part : $buffer . ' ' . $part;
            if ($buffer !== '' && self::strlen_u($next) > 400) {
                $chunks[] = $buffer;
                $buffer   = $part;
            } else {
                $buffer = $next;
            }
        }
        if ($buffer !== '') {
            $chunks[] = $buffer;
        }
        return $chunks;
    }

    /**
     * @param array<int,string> $paths Piece paths.
     * @param string            $dest  Output path.
     * @return bool
     */
    private static function concat_wavs($paths, $dest) {
        $fmt  = null;
        $data = '';
        foreach ($paths as $path) {
            $pcm = self::wav_pcm($path);
            if (!$pcm) {
                return false;
            }
            if ($fmt === null) {
                $fmt = $pcm['fmt'];
            } elseif ($fmt !== $pcm['fmt']) {
                return false;
            }
            $data .= $pcm['data'];
        }
        if ($fmt === null || $data === '') {
            return false;
        }
        $fmt      = substr($fmt, 0, 16);
        $dataSize = strlen($data);
        $raw      = 'RIFF' . pack('V', 36 + $dataSize) . 'WAVE'
            . 'fmt ' . pack('V', 16) . $fmt
            . 'data' . pack('V', $dataSize) . $data;
        return file_put_contents($dest, $raw) !== false;
    }

    /**
     * @param string $path Wav path.
     * @return array<string,string>|null
     */
    private static function wav_pcm($path) {
        $raw = file_get_contents($path);
        if (!is_string($raw) || strlen($raw) < 44 || substr($raw, 0, 4) !== 'RIFF' || substr($raw, 8, 4) !== 'WAVE') {
            return null;
        }
        $offset = 12;
        $length = strlen($raw);
        $fmt    = null;
        $data   = null;
        while ($offset + 8 <= $length) {
            $id   = substr($raw, $offset, 4);
            $size = unpack('V', substr($raw, $offset + 4, 4));
            $size = isset($size[1]) ? (int) $size[1] : 0;
            if ($offset + 8 + $size > $length) {
                break;
            }
            $body = substr($raw, $offset + 8, $size);
            if ($id === 'fmt ') {
                $fmt = $body;
            } elseif ($id === 'data') {
                $data = $body;
            }
            $offset += 8 + $size + ($size % 2);
        }
        if ($fmt === null || $data === null) {
            return null;
        }
        return array(
            'fmt'  => substr($fmt, 0, 16),
            'data' => $data,
        );
    }

    /**
     * @param int    $post_id Post id.
     * @param string $voice   Voice id.
     * @return string
     */
    private static function clip_path($post_id, $voice) {
        $dir = self::clip_dir($post_id);
        if ($dir === '' || ($voice !== 'manijeh' && $voice !== 'bijan')) {
            return '';
        }
        return $dir . '/' . $voice . '.wav';
    }

    /**
     * @param int    $post_id Post id.
     * @param string $voice   Voice id.
     * @return string
     */
    private static function clip_url($post_id, $voice) {
        $uploads = wp_upload_dir();
        if (!empty($uploads['error']) || empty($uploads['baseurl'])) {
            return '';
        }
        return $uploads['baseurl'] . '/shenidar/' . (int) $post_id . '/' . $voice . '.wav';
    }

    /**
     * @param int $post_id Post id.
     * @return string
     */
    private static function clip_dir($post_id) {
        $uploads = wp_upload_dir();
        if (!empty($uploads['error']) || empty($uploads['basedir'])) {
            return '';
        }
        $dir = $uploads['basedir'] . '/shenidar/' . (int) $post_id;
        return self::ensure_dir($dir) ? $dir : '';
    }

    /**
     * @param string $dir Directory.
     * @return bool
     */
    private static function ensure_dir($dir) {
        if (!wp_mkdir_p($dir)) {
            return false;
        }
        $index = $dir . '/index.php';
        if (!is_file($index)) {
            file_put_contents($index, "<?php\n// Silence is golden.\n");
        }
        return true;
    }

    /**
     * @param string $text Text.
     * @return int
     */
    private static function strlen_u($text) {
        return function_exists('mb_strlen') ? (int) mb_strlen($text, 'UTF-8') : strlen($text);
    }

    /**
     * @param string $text  Text.
     * @param int    $start Start.
     * @param int    $len   Length. Null reads the rest.
     * @return string
     */
    private static function substr_u($text, $start, $len = null) {
        if (function_exists('mb_substr')) {
            $length = $len === null ? self::strlen_u($text) : $len;
            return (string) mb_substr($text, $start, $length, 'UTF-8');
        }
        return $len === null ? substr($text, $start) : substr($text, $start, $len);
    }
}
