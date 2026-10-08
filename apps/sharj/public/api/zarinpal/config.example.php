<?php
/**
 * Copy to config.php on the server (same folder) OR place at
 * /home/USER/zarinpal-config.php (outside public_html) and set
 * ZARINPAL_CONFIG_PATH in bootstrap if needed.
 *
 * NEVER commit real merchant IDs. config.php is gitignored.
 *
 * Amount unit: app stores تومان (Toman). With currency=IRT we send Toman
 * amounts to ZarinPal. With currency=IRR we multiply by 10 (Rial).
 */
return [
    /** 36-char merchant UUID from panel.zarinpal.com */
    'merchant_id' => 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',

    /** true → sandbox.zarinpal.com (test); false → payment.zarinpal.com */
    'sandbox' => true,

    /** Master switch — when false, request.php rejects new payments */
    'enabled' => true,

    /**
     * IRT = تومان (matches app UI amounts)
     * IRR = ریال (amount × 10)
     */
    'currency' => 'IRT',

    /** SPA callback (ZarinPal redirects here with Authority & Status) */
    'callback_url' => 'https://sharzhban.ir/pay/callback',

    /** Optional: require this header/token for save-config.php */
    'admin_token' => '',
];
