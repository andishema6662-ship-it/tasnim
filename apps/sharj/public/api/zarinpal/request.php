<?php
require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    zp_respond(405, ['ok' => false, 'message' => 'POST required']);
}

$cfg = zp_load_config();
if (!$cfg['enabled']) {
    zp_respond(403, ['ok' => false, 'message' => 'درگاه غیرفعال است']);
}
if (!zp_merchant_ok($cfg['merchant_id'])) {
    zp_respond(400, [
        'ok' => false,
        'message' => 'Merchant ID در config سرور تنظیم نشده. فایل config.example.php را ببینید.',
    ]);
}

$body = zp_json_body();
$toman = (int) ($body['amount_toman'] ?? $body['amount'] ?? 0);
$description = trim((string) ($body['description'] ?? 'پرداخت شارژبان'));
$callback = trim((string) ($body['callback_url'] ?? $cfg['callback_url']));
$mobile = preg_replace('/\D+/', '', (string) ($body['mobile'] ?? '')) ?: null;
$orderId = trim((string) ($body['order_id'] ?? ''));
$email = trim((string) ($body['email'] ?? ''));

if ($toman < 1000) {
    zp_respond(400, [
        'ok' => false,
        'message' => 'حداقل مبلغ ۱٬۰۰۰ تومان است',
        'currency' => $cfg['currency'],
    ]);
}
if ($callback === '') {
    zp_respond(400, ['ok' => false, 'message' => 'callback_url لازم است']);
}

$amount = zp_amount_for_api($toman, $cfg['currency']);
$urls = zp_base_urls($cfg['sandbox']);

$payload = [
    'merchant_id' => $cfg['merchant_id'],
    'amount' => $amount,
    'currency' => $cfg['currency'],
    'description' => $description,
    'callback_url' => $callback,
    'metadata' => array_filter([
        'mobile' => $mobile,
        'email' => $email ?: null,
        'order_id' => $orderId ?: null,
    ]),
];

$result = zp_curl_json($urls['request'], $payload);
$data = $result['data'] ?? [];
$code = (int) ($data['code'] ?? 0);
$authority = (string) ($data['authority'] ?? '');

if ($code === 100 && $authority !== '') {
    zp_respond(200, [
        'ok' => true,
        'authority' => $authority,
        'fee' => $data['fee'] ?? null,
        'sandbox' => $cfg['sandbox'],
        'currency' => $cfg['currency'],
        'amount_sent' => $amount,
        'amount_toman' => $toman,
        'start_pay_url' => $urls['startPay'] . $authority,
        'message' => $data['message'] ?? 'Success',
    ]);
}

$err = $result['errors'] ?? $result['_error'] ?? 'request failed';
zp_respond(502, [
    'ok' => false,
    'message' => is_array($err) ? ($err['message'] ?? json_encode($err, JSON_UNESCAPED_UNICODE)) : (string) $err,
    'zarinpal' => [
        'code' => $code,
        'errors' => $result['errors'] ?? null,
        'http' => $result['_http'] ?? null,
    ],
]);
