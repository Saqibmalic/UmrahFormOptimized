/**
 * Umrah Insights — Umrah packages landing page → Google Sheet
 * ==========================================================
 *
 * Receives both stages of the enquiry form and writes ONE ROW PER LEAD.
 * Stage 1 creates the row with a "New — call now" status; stage 2 fills
 * the trip columns in the SAME row and flips the status.
 *
 * SETUP (about 5 minutes)
 * -----------------------
 * 1. Create a Google Sheet. Name the first tab "Leads".
 * 2. Extensions → Apps Script. Delete the placeholder code, paste this file.
 * 3. Set NOTIFY_EMAIL below.
 * 4. Deploy → New deployment → type "Web app".
 *      Execute as:      Me
 *      Who has access:  Anyone            ← required, the page posts anonymously
 *    Deploy, authorise when prompted, and copy the /exec URL.
 * 5. Paste that URL into BACKEND.url in assets/js/umrah.js.
 *
 * After any code change you must Deploy → Manage deployments → edit →
 * "New version". Saving alone does not update the live URL.
 *
 * The header row is created automatically on the first submission.
 */

// ── Configuration ────────────────────────────────────────────
var SHEET_NAME   = 'Leads';
var NOTIFY_EMAIL = 'info@umrahinsights.co.uk';   // '' disables email alerts

var HEADERS = [
  'Timestamp', 'Lead ID', 'Status', 'Name', 'Phone', 'Email',
  'Hotel Standard', 'Package Interest', 'Departure Airport', 'Travel Month',
  'Nights', 'Travellers', 'Room', 'Budget', 'Notes',
  'GCLID', 'Source', 'Medium', 'Campaign', 'Keyword', 'Content', 'Page URL'
];

// Stage 2 writes six trip columns starting at "Departure Airport" (column I)
// plus Notes; keep this in step with HEADERS if you add fields.
var TRIP_START_COL = 9;

// ── Entry point ──────────────────────────────────────────────
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);                       // serialise concurrent submissions
  try {
    var data = JSON.parse(e.postData.contents);

    // Honeypot — accept silently so the bot does not retry.
    if (data.website_hp) {
      return json({ ok: true, lead_id: 'x' });
    }

    var sheet = getSheet();
    var leadId = String(data.lead_id || '').replace(/[^A-Z0-9\-]/gi, '').substring(0, 20);
    if (!leadId) {
      leadId = 'UI-' + Utilities.getUuid().replace(/-/g, '').substring(0, 8).toUpperCase();
    }

    if (String(data.stage) === '2') {
      handleTrip(sheet, leadId, data);
    } else {
      handleContact(sheet, leadId, data);
    }

    return json({ ok: true, lead_id: leadId });

  } catch (err) {
    // Never lose a lead to a bug — record the raw payload for recovery.
    try {
      getSheet().appendRow([new Date(), 'ERROR', 'Needs review', String(err),
                            (e && e.postData ? e.postData.contents : '').substring(0, 4000)]);
    } catch (ignored) {}
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput('Umrah Insights lead endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ── Stage 1: contact details → new row ───────────────────────
function handleContact(sheet, leadId, d) {
  sheet.appendRow([
    new Date(), leadId, 'New — call now',
    str(d.name), str(d.phone), str(d.email),
    str(d.tier), str(d.package_interest),
    '', '', '', '', '', '', '',
    str(d.gclid), str(d.utm_source), str(d.utm_medium),
    str(d.utm_campaign), str(d.utm_term), str(d.utm_content), str(d.page_url)
  ]);

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: str(d.email),
      subject: 'New Umrah enquiry — ' + str(d.name) + ' [' + leadId + ']',
      body: [
        'A new Umrah enquiry just came in. Trip details may follow in a moment.',
        'Call this person now — do not wait for the second step.',
        '',
        'Lead ID:   ' + leadId,
        'Name:      ' + str(d.name),
        'Phone:     ' + str(d.phone),
        'Email:     ' + str(d.email),
        'Standard:  ' + str(d.tier),
        'Interest:  ' + (str(d.package_interest) || '—'),
        '',
        'Campaign:  ' + str(d.utm_campaign) + '  |  Keyword: ' + str(d.utm_term),
        'GCLID:     ' + str(d.gclid),
        'Page:      ' + str(d.page_url)
      ].join('\n')
    });
  }
}

// ── Stage 2: trip detail → update that lead's row ────────────
function handleTrip(sheet, leadId, d) {
  var row = findRow(sheet, leadId);

  var values = [
    str(d.airport), str(d.travel_month), str(d.nights),
    str(d.travellers), str(d.room), str(d.budget), str(d.notes)
  ];

  if (row > 0) {
    sheet.getRange(row, TRIP_START_COL, 1, values.length).setValues([values]);
    sheet.getRange(row, 3).setValue('Trip details received');
    if (str(d.package_interest)) sheet.getRange(row, 8).setValue(str(d.package_interest));
  } else {
    // Stage 1 never landed (rare). Write a standalone row so nothing is lost.
    sheet.appendRow([new Date(), leadId, 'Trip details only — no contact row',
                     '', '', '', '', str(d.package_interest)].concat(values,
                     [str(d.gclid), str(d.utm_source), str(d.utm_medium),
                      str(d.utm_campaign), str(d.utm_term), str(d.utm_content), str(d.page_url)]));
  }

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Umrah trip details added [' + leadId + ']',
      body: [
        'Airport:    ' + (str(d.airport)      || '—'),
        'When:       ' + (str(d.travel_month) || '—'),
        'Nights:     ' + (str(d.nights)       || '—'),
        'Travellers: ' + (str(d.travellers)   || '—'),
        'Room:       ' + (str(d.room)         || '—'),
        'Budget:     ' + (str(d.budget)       || '—'),
        'Interest:   ' + (str(d.package_interest) || '—'),
        '',
        'Notes:',
        str(d.notes) || '—'
      ].join('\n')
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
         .setFontWeight('bold').setBackground('#0E5A43').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRow(sheet, leadId) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var ids = sheet.getRange(2, 2, last - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {          // newest first
    if (String(ids[i][0]).trim() === leadId) return i + 2;
  }
  return 0;
}

function str(v) {
  return (v === null || v === undefined) ? '' : String(v).substring(0, 4000);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
