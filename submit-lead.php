<?php
/**
 * Umrah Insights — landing page lead handler
 * ==========================================
 * Accepts both stages of the enquiry form, emails each one to $TO and
 * appends a row to leads.csv as a backup.
 *
 * Accepts either a JSON body (how assets/js/umrah.js posts) or a normal
 * form POST (the no-JavaScript fallback), so nothing is lost either way.
 *
 * Requires PHP 7.4+ and a working mail() — if your host blocks mail(),
 * point BACKEND.url in assets/js/umrah.js at Zapier, Make, or your CRM
 * instead; the JSON payload is identical.
 *
 * SECURITY: move leads.csv outside the web root if your host allows it.
 * robots.txt discourages crawlers but it is not access control.
 */

declare(strict_types=1);

// ── Configuration ────────────────────────────────────────────
$TO   = 'info@umrahinsights.co.uk';        // where enquiries land
$FROM = 'website@umrahinsights.co.uk';     // must be on your own domain or SPF will fail
$CSV  = __DIR__ . '/leads.csv';
$THANK_YOU = 'thank-you.html';

// ── Input ────────────────────────────────────────────────────
$raw = file_get_contents('php://input');
$data = [];
if ($raw !== '' && strpos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'json') !== false) {
    $data = json_decode($raw, true) ?: [];
} elseif ($raw !== '' && $raw[0] === '{') {          // text/plain JSON (simple request)
    $data = json_decode($raw, true) ?: [];
} else {
    $data = $_POST;
}

$isJson = ($raw !== '' && ($raw[0] ?? '') === '{');

// Bots fill every field they find. This one is hidden from humans.
if (!empty($data['website_hp'])) {
    respond($isJson, true, 'ok', $THANK_YOU);
}

$field = static function (array $d, string $k, int $max = 500): string {
    $v = isset($d[$k]) ? (string)$d[$k] : '';
    $v = trim(strip_tags($v));
    $v = str_replace(["\r", "\n"], ' ', $v);          // header-injection guard
    return mb_substr($v, 0, $max);
};

$stage  = ($field($data, 'stage') === '2') ? '2' : '1';
$leadId = preg_replace('/[^A-Z0-9\-]/i', '', $field($data, 'lead_id', 20));
if ($leadId === '') {
    $leadId = 'UI-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 5));
}

$name  = $field($data, 'name', 120);
$phone = $field($data, 'phone', 40);
$email = filter_var($field($data, 'email', 160), FILTER_VALIDATE_EMAIL) ?: '';
$tier  = $field($data, 'tier', 40);

$trip = [
    'Package interest'  => $field($data, 'package_interest', 80),
    'Departure airport' => $field($data, 'airport', 60),
    'Travel month'      => $field($data, 'travel_month', 60),
    'Nights'            => $field($data, 'nights', 40),
    'Travellers'        => $field($data, 'travellers', 40),
    'Room'              => $field($data, 'room', 40),
    'Budget'            => $field($data, 'budget', 40),
    'Notes'             => $field($data, 'notes', 2000),
];

$ads = [
    'GCLID'    => $field($data, 'gclid', 200),
    'Source'   => $field($data, 'utm_source', 100),
    'Medium'   => $field($data, 'utm_medium', 100),
    'Campaign' => $field($data, 'utm_campaign', 150),
    'Keyword'  => $field($data, 'utm_term', 150),
    'Content'  => $field($data, 'utm_content', 150),
    'Page'     => $field($data, 'page_url', 400),
];

// Stage 1 must be contactable; stage 2 only needs the id it enriches.
if ($stage === '1' && ($name === '' || ($phone === '' && $email === ''))) {
    respond($isJson, false, 'Please provide a name and a phone number or email.', $THANK_YOU, 422);
}

// ── Email ────────────────────────────────────────────────────
$lines = ["Lead ID:   $leadId", ''];
if ($stage === '1') {
    $subject = "New Umrah enquiry — {$name} [{$leadId}]";
    $lines[] = 'CALL THIS PERSON NOW — trip details may follow in a moment.';
    $lines[] = '';
    $lines[] = "Name:      $name";
    $lines[] = "Phone:     $phone";
    $lines[] = "Email:     $email";
    $lines[] = "Standard:  $tier";
    if ($trip['Package interest'] !== '') $lines[] = "Interest:  {$trip['Package interest']}";
} else {
    $subject = "Umrah trip details added [{$leadId}]";
    foreach ($trip as $label => $value) {
        if ($value !== '') $lines[] = str_pad($label . ':', 19) . $value;
    }
}
$lines[] = '';
foreach ($ads as $label => $value) {
    if ($value !== '') $lines[] = str_pad($label . ':', 19) . $value;
}

$headers = "From: Umrah Insights Website <{$FROM}>\r\n";
if ($email !== '') $headers .= "Reply-To: {$email}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
@mail($TO, $subject, implode("\n", $lines), $headers);

// ── CSV backup ───────────────────────────────────────────────
$row = array_merge(
    [date('c'), $leadId, $stage, $name, $phone, $email, $tier],
    array_values($trip),
    array_values($ads)
);
if (!file_exists($CSV)) {
    $head = array_merge(
        ['Timestamp', 'Lead ID', 'Stage', 'Name', 'Phone', 'Email', 'Hotel standard'],
        array_keys($trip),
        array_keys($ads)
    );
    if ($fh = @fopen($CSV, 'a')) { fputcsv($fh, $head); fclose($fh); }
}
if ($fh = @fopen($CSV, 'a')) {
    if (flock($fh, LOCK_EX)) { fputcsv($fh, $row); flock($fh, LOCK_UN); }
    fclose($fh);
}

respond($isJson, true, 'ok', $THANK_YOU, 200, $leadId);

// ── Response ─────────────────────────────────────────────────
function respond(bool $isJson, bool $ok, string $message, string $redirect,
                 int $code = 200, string $leadId = ''): void
{
    http_response_code($code);
    if ($isJson) {
        header('Content-Type: application/json');
        echo json_encode(['ok' => $ok, 'message' => $message, 'lead_id' => $leadId]);
    } elseif ($ok) {
        header('Location: ' . $redirect, true, 303);   // no-JS fallback path
    } else {
        header('Content-Type: text/plain; charset=UTF-8');
        echo $message;
    }
    exit;
}
