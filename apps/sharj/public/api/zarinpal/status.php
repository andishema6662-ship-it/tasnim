<?php
require __DIR__ . '/bootstrap.php';

$cfg = zp_load_config();
$mid = $cfg['merchant_id'];
$masked = '';
if ($mid !== '' && strlen($mid) >= 8) {
    $masked = substr($mid, 0, 4) . '…' . substr($mid, -4);
}

zp_respond(200, [
    'ok' => true,
    'provider' => 'zarinpal',
    'enabled' => $cfg['enabled'],
    'sandbox' => $cfg['sandbox'],
    'currency' => $cfg['currency'],
    'callback_url' => $cfg['callback_url'],
    'merchant_configured' => zp_merchant_ok($mid) && !preg_match('/^x+$/i', str_replace('-', '', $mid)),
    'merchant_masked' => $masked,
    'using_example_config' => !empty($cfg['_using_example']),
    'amount_note' => $cfg['currency'] === 'IRT'
        ? 'مبالغ اپ به تومان (IRT) برای زرین‌پال ارسال می‌شود.'
        : 'مبالغ اپ (تومان) ×۱۰ به‌صورت ریال (IRR) ارسال می‌شود.',
]);
