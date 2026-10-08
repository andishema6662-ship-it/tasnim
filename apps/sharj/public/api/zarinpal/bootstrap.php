<?php
/**
 * Shared loader for ZarinPal PHP endpoints.
 * Prefers config outside webroot, then local config.php, then example (sandbox).
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function zp_cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function zp_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return $_POST ?: [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function zp_respond(int $http, array $payload): void
{
    http_response_code($http);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function zp_load_config(): array
{
    $candidates = [];
    if (!empty(getenv('ZARINPAL_CONFIG_PATH'))) {
        $candidates[] = getenv('ZARINPAL_CONFIG_PATH');
    }
    // Outside public_html on typical cPanel: /home/USER/zarinpal-config.php
    $home = getenv('HOME') ?: '';
    if ($home !== '') {
        $candidates[] = rtrim($home, '/') . '/zarinpal-config.php';
    }
    // Two levels up from public_html/api/zarinpal → home sibling
    $candidates[] = dirname(__DIR__, 3) . '/zarinpal-config.php';
    $candidates[] = __DIR__ . '/config.php';

    $cfg = null;
    foreach ($candidates as $path) {
        if ($path && is_readable($path)) {
            $loaded = include $path;
            if (is_array($loaded)) {
                $cfg = $loaded;
                $cfg['_config_path'] = $path;
                break;
            }
        }
    }

    if ($cfg === null) {
        $example = include __DIR__ . '/config.example.php';
        $cfg = is_array($example) ? $example : [];
        $cfg['_config_path'] = null;
        $cfg['_using_example'] = true;
    }

    $cfg['merchant_id'] = trim((string) ($cfg['merchant_id'] ?? ''));
    $cfg['sandbox'] = (bool) ($cfg['sandbox'] ?? true);
    $cfg['enabled'] = (bool) ($cfg['enabled'] ?? true);
    $cfg['currency'] = strtoupper((string) ($cfg['currency'] ?? 'IRT')) === 'IRR' ? 'IRR' : 'IRT';
    $cfg['callback_url'] = (string) ($cfg['callback_url'] ?? 'https://sharzhban.ir/pay/callback');
    $cfg['admin_token'] = (string) ($cfg['admin_token'] ?? '');
    return $cfg;
}

function zp_base_urls(bool $sandbox): array
{
    $host = $sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
    return [
        'request' => $host . '/pg/v4/payment/request.json',
        'verify' => $host . '/pg/v4/payment/verify.json',
        'startPay' => $host . '/pg/StartPay/',
    ];
}

/** Convert app Toman amount to ZarinPal integer for the chosen currency. */
function zp_amount_for_api(int $toman, string $currency): int
{
    if ($toman < 1) {
        return 0;
    }
    return $currency === 'IRR' ? $toman * 10 : $toman;
}

function zp_curl_json(string $url, array $body): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 45,
    ]);
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($raw === false) {
        return ['_http' => $code, '_error' => $err ?: 'curl failed', 'data' => [], 'errors' => ['message' => $err]];
    }
    $parsed = json_decode($raw, true);
    if (!is_array($parsed)) {
        return ['_http' => $code, '_error' => 'invalid json', 'data' => [], 'errors' => ['message' => $raw]];
    }
    $parsed['_http'] = $code;
    return $parsed;
}

function zp_merchant_ok(string $id): bool
{
    // UUID-like 36 chars; sandbox accepts placeholders
    return (bool) preg_match(
        '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/',
        $id
    ) || (bool) preg_match('/^x{8}-x{4}-x{4}-x{4}-x{12}$/i', $id);
}

zp_cors();
