<?php
require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    zp_respond(405, ['ok' => false, 'message' => 'POST required']);
}

$cfg = zp_load_config();
if (!zp_merchant_ok($cfg['merchant_id'])) {
    zp_respond(400, ['ok' => false, 'message' => 'Merchant ID روی سرور تنظیم نشده']);
}

$body = zp_json_body();
$authority = trim((string) ($body['authority'] ?? ''));
$toman = (int) ($body['amount_toman'] ?? $body['amount'] ?? 0);
$status = strtoupper(trim((string) ($body['status'] ?? 'OK')));

if ($authority === '' || $toman < 1) {
    zp_respond(400, ['ok' => false, 'message' => 'authority و amount_toman لازم است']);
}

if ($status !== '' && $status !== 'OK') {
    zp_respond(200, [
        'ok' => false,
        'cancelled' => true,
        'message' => 'پرداخت توسط کاربر لغو شد یا ناموفق بود (Status=NOK)',
        'authority' => $authority,
    ]);
}

$amount = zp_amount_for_api($toman, $cfg['currency']);
$urls = zp_base_urls($cfg['sandbox']);

$result = zp_curl_json($urls['verify'], [
    'merchant_id' => $cfg['merchant_id'],
    'amount' => $amount,
    'authority' => $authority,
]);

$data = $result['data'] ?? [];
$code = (int) ($data['code'] ?? 0);

// 100 = first verify success; 101 = already verified
if ($code === 100 || $code === 101) {
    zp_respond(200, [
        'ok' => true,
        'already_verified' => $code === 101,
        'code' => $code,
        'ref_id' => $data['ref_id'] ?? null,
        'card_pan' => $data['card_pan'] ?? null,
        'card_hash' => $data['card_hash'] ?? null,
        'fee' => $data['fee'] ?? null,
        'fee_type' => $data['fee_type'] ?? null,
        'authority' => $authority,
        'amount_toman' => $toman,
        'amount_sent' => $amount,
        'currency' => $cfg['currency'],
        'sandbox' => $cfg['sandbox'],
        'message' => $data['message'] ?? 'Verified',
    ]);
}

$err = $result['errors'] ?? 'verify failed';
zp_respond(502, [
    'ok' => false,
    'message' => is_array($err) ? ($err['message'] ?? json_encode($err, JSON_UNESCAPED_UNICODE)) : (string) $err,
    'code' => $code,
    'authority' => $authority,
    'zarinpal' => $result['errors'] ?? null,
]);
