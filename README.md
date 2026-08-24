# Umrah Insights — 4★ & 5★ Umrah packages landing page (UK paid traffic)

A single-purpose, ads-first landing page built to capture Umrah enquiries from **UK** Google Ads
traffic, targeting 4-star and 5-star buyers. Static HTML/CSS/JS — no build step, no framework, no
dependencies. Drop it on any host.

```
index.html            The landing page + two-stage enquiry flow
thank-you.html        Post-submit page (noindex) where the backup conversion fires
privacy-policy.html   Required by Google Ads — must be reachable
terms.html            Trust signal + required for travel lead-gen
submit-lead.php       PHP lead handler (both stages, CSV backup)
google-apps-script.gs Google Sheets backend — no server needed
assets/css/umrah.css  All styling. Brand tokens live in :root at the top.
assets/js/umrah.js    Two-stage flow, validation, tabs, modal, tracking
```

---

## 0. Read this first — what I could and could not verify

The container this was built in could not reach `umrahinsights.co.uk` (blocked by the network
egress proxy), so the brand details below came from search results rather than from your site.
**Check each one before you spend money on clicks.**

| Used on the page | Source | Action |
|---|---|---|
| Phone `020 3355 0818` | search result | verify |
| Address `13 Station Road, London SE25 5AH` | search result | verify |
| `info@umrahinsights.co.uk` | assumed | verify |
| WhatsApp `wa.me/442033550818` | assumed = landline | **replace with your real WhatsApp number** |
| "Serving UK pilgrims since 2013" | search result | verify (one source said 2006) |
| 5★ from £995 (7n), £1,025 (10n), £1,080 (12n), £1,175 (14n) | your package pages, via search | verify |
| 4★ £960 (12n) | your package pages, via search | verify |
| 4★ 7 / 10 / 14 night prices | **not found** → shown as `£REPLACE` | fill in |
| 5★ hotels: Elaf Al Mashaer, Al Haram Madinah | your 7-night package page | verify |
| 4★ hotel names | **not found** → marked REPLACE | fill in |
| ATOL licence number, company number | **not found** → marked REPLACE | fill in |
| The three testimonials | **placeholders** | replace with real quotes — see below |

**Colours.** I could not read your live stylesheet, so the palette is a deep green + gold scheme
chosen to suit the brand. Every colour on the page resolves from six tokens at the top of
`assets/css/umrah.css`:

```css
--green: #0E5A43;  --green-dk: #08402F;  --green-lt: #14755A;
--gold:  #C8A24A;  --gold-dk:  #8C6D22;  --sand:     #F6F1E7;
```

Send me your real hex codes (or a screenshot) and swapping those six lines re-themes the whole page.
Nothing else hardcodes a colour.

---

## 1. Before you go live — the required edits

| # | What | Where |
|---|------|-------|
| 1 | Replace `AW-XXXXXXXXXX` with your Google Ads conversion ID | `index.html`, `thank-you.html` (head) |
| 2 | Replace `G-XXXXXXXXXX` with your GA4 measurement ID | same files |
| 3 | Replace `REPLACE_LEAD_LABEL` / `REPLACE_CALL_LABEL` / `REPLACE_WHATSAPP_LABEL` | `assets/js/umrah.js` (top), `thank-you.html` |
| 4 | Replace the three `REPLACE` testimonials with **real, attributable** quotes | `index.html` → `#reviews` |
| 5 | Fill in the `£REPLACE` prices and the 4★ hotel names | `index.html` → `#packages`, `#hotels` |
| 6 | Fill in ATOL licence number and company number | `index.html` footer, `terms.html` |
| 7 | Set the real WhatsApp number (search `wa.me/442033550818`) | `index.html`, `thank-you.html` |
| 8 | Choose your backend and set `BACKEND` | `assets/js/umrah.js` (top) |
| 9 | Set the recipient email — `NOTIFY_EMAIL` (Sheets) or `$TO`/`$FROM` (PHP) | `google-apps-script.gs` / `submit-lead.php` |
| 10 | Update `<link rel="canonical">` and the OG URLs to the real URL | `index.html` (head), and the `TravelAgency` block in the JSON-LD |
| 11 | Date the two legal pages, add your ICO registration if you have one | `privacy-policy.html`, `terms.html` |
| 12 | Add your four customer videos + poster frames (section 3 below) | `index.html` → `#reviews`, `assets/img/` |
| 13 | Fill in the Ramadan dates and three `£REPLACE` prices, and check the year | `index.html` → `#ramadan` |

**Do not skip #4.** Google Ads prohibits fabricated testimonials, and a disapproval on a lead-gen
travel account is hard to reverse. If you don't have quotes yet, delete the whole `#reviews`
section — an absent section costs you far less than a fake one.

**Do not skip #6 either.** Claiming ATOL protection without displaying your licence number is both
an ad-policy risk and a CAA compliance problem.

---

## 2. The two-stage enquiry flow

```
Stage 1 — name, mobile, email, hotel standard (4 fields)
   │     ↓ posts on its own, with a client-minted lead_id
   │     ↓ GOOGLE ADS LEAD CONVERSION FIRES HERE
   │     ↓ you receive "New Umrah enquiry — call this person now"
   ▼
Stage 2 — airport, travel month, nights, travellers, room, budget, notes
         ↓ posts as a follow-up against the same lead_id
         ↓ you receive "Umrah trip details added [LEAD ID]"
         └─ or they hit "Skip — call me instead" and you still have
            a fully contactable lead
```

**Why stage 1 posts by itself:** a long form that only submits at the end throws away every buyer
who quits halfway — and Umrah buyers quit at "what's your budget". Here the contact record is banked
the moment it's complete, so the qualifying questions can be as thorough as you like without costing
leads. The conversion fires at stage 1 for the same reason: that's the moment you got something
worth money, and it's the signal you want Smart Bidding to optimise towards.

On desktop, package buttons scroll to the always-visible hero form instead of opening the modal —
one interaction rather than two. Below 1000px the form is far down the page, so they open the modal.

Without JavaScript the hero form posts normally to `submit-lead.php` and redirects to the thank-you
page. Nothing is lost (this only works on PHP hosting — see below).


---

## 2b. Customer video testimonials

Four vertical (9:16) slots, sized for phone-shot footage. **Nothing loads until someone clicks** —
each tile is just a poster image, because a normal YouTube embed pulls roughly 700KB of scripts per
video and would undo the load speed this page depends on.

For each of the four tiles in `index.html` → `#reviews`:

1. Set `data-video`:
   - **YouTube:** the 11-character video ID (`youtube.com/shorts/AbCdEfGhIjK` → `AbCdEfGhIjK`),
     with `data-video-type="youtube"`. Plays via youtube-nocookie.
   - **Self-hosted MP4:** a path such as `assets/video/story-1.mp4`, with `data-video-type="file"`.
     Keep each file under ~15MB and encode H.264/AAC, 720×1280.
2. Drop a poster frame at `assets/img/video-01.jpg` … `video-04.jpg`, **405 × 720**, under 150KB.
   Pick a frame where the person's face is visible and they are mid-sentence — a frozen smile reads
   as stock footage.
3. Rewrite the `<figcaption>`: name, package, month. `Aisha, 5 star 10 nights, March` beats
   "Happy customer".

**Safe to publish before the videos are ready:** while all four are still `REPLACE_VIDEO_n` the
whole section stays hidden, and any single tile whose poster image fails to load hides itself.

Two things worth knowing:

- **Get permission in writing**, even informally over WhatsApp. A testimonial video of an identifiable
  person is personal data under UK GDPR, and Google Ads will ask you to substantiate testimonials if
  a reviewer flags the page.
- **Subtitle them.** Most people watch these muted, in public, on mobile. Burned-in captions roughly
  double completion on this kind of tile. YouTube's auto-captions are not enough if the speaker has
  an accent — burn them in when you edit.

## 2c. Ramadan section

`#ramadan` is a dedicated dark block between packages and hotels, with its own three cards (first ten
nights / last ten nights / full month) and its own CTAs. It exists because "ramadan umrah packages"
is the highest-intent and highest-value term in this vertical, and because Ramadan buyers convert on
scarcity rather than price — the copy leans on allocation, not discount.

Fill in the two date ranges and the three prices, and **check the year in the heading** before each
season. Run it as its own ad group pointed at `…/#ramadan` so the ad, the landing anchor and the
copy all match.

## 2d. Where the lead-capture points are

Nine entry points, all feeding the same two-stage flow and the same conversion:

| # | Where | What it is |
|---|---|---|
| 1 | Hero | Full 4-field form, above the fold on desktop and second screen on mobile |
| 2–5 | Package cards | "Get exact price" — preselects the tier the buyer clicked |
| 6 | Ramadan cards | "Register interest" — tagged with which Ramadan window |
| 7 | Hotel tier cards | "See availability for my dates" |
| 8–9 | Two inline bands | 3-field mini form (name, mobile, standard) after hotels and before the FAQ |
| + | Sticky mobile bar | Call · WhatsApp · Get my quote, always visible |
| + | Closing CTA | Button + phone |
| + | Header & footer | Phone, WhatsApp, email |

The mini bands post the same stage-1 payload and fire the same conversion, then open the modal
straight onto the trip questions. **Every button on the page carries the context of where it was
clicked** into your sheet (`Package Interest`), so you can see which section actually produces
enquiries and cut the ones that don't.

On desktop, package buttons scroll to the hero form rather than opening a modal — one interaction
instead of two, and the form is already on screen. On mobile they open the modal.

---

## 3. Where the leads go — pick one

Set `BACKEND` at the top of `assets/js/umrah.js`. Both options receive an identical JSON payload, so
you can switch later without touching anything else.

### Option A — Google Sheet (recommended if your advisers work from a sheet)

One row per lead. Stage 1 creates the row with **"New — call now"**; stage 2 fills the trip columns
in the *same row* and flips the status. You also get an email alert per stage.

Setup is in the header comment of `google-apps-script.gs` — about 5 minutes: create a sheet →
Extensions → Apps Script → paste the file → Deploy as Web app (**Execute as: Me**, **Who has access:
Anyone**) → copy the `/exec` URL → paste it into `BACKEND.url` as `{ mode: 'sheets', url: '…/exec' }`.

Columns: `Timestamp · Lead ID · Status · Name · Phone · Email · Hotel Standard · Package Interest ·
Departure Airport · Travel Month · Nights · Travellers · Room · Budget · Notes · GCLID · Source ·
Medium · Campaign · Keyword · Content · Page URL`

`Status` is a plain text cell — have advisers overwrite it with Contacted / Quoted / Deposit /
Booked / Lost. **The GCLID column is the important one:** it's what lets you upload offline
conversions later, so Google learns which enquiries actually turned into bookings rather than just
which ones filled in a form.

This option needs no server, so the page can live on free static hosting.

### Option B — `submit-lead.php` on your own hosting

Emails each stage to `$TO` and appends to `leads.csv`. Needs PHP 7.4+ and a working `mail()`.
Move `leads.csv` outside the web root if your host allows it — it's a plain-text file of every lead.

You can also point `BACKEND.url` at Zapier, Make, or your CRM — anything that accepts a JSON POST.
Payload keys are the field `name` attributes plus `stage`, `lead_id`, `gclid`, the `utm_*` set and
`page_url`.

### If you want leads in your WhatsApp inbox

You already have a WhatsApp app (`umrah-whatsapp`). Once this page is live, pointing `BACKEND.url`
at an endpoint in that app — instead of a sheet — would let a new enquiry open a WhatsApp
conversation automatically. Worth doing after the page has proven it converts, not before.

---

## 4. Google Ads setup

### Conversion actions

Create three. Make the form **Primary**; keep calls Primary too if your advisers close on the phone.

| Action | Type | Counting | Value |
|---|---|---|---|
| Umrah Enquiry Form | Website → `generate_lead` | One | Set one (e.g. £60 = avg margin × close rate) |
| Phone Click | Website → phone click | One | Same |
| WhatsApp Click | Website → click | One | Lower — it's a softer signal |

Setting values matters more than most advertisers think: once you have ~30 conversions/month you can
move from Maximise Conversions to **Maximise Conversion Value**, and a 5★ family enquiry will
outbid a single-traveller 3★ enquiry automatically.

The form conversion fires on submit *and* on `thank-you.html` (Google de-duplicates). Every `tel:`
and `wa.me` link on the page fires its own conversion.

### Campaign structure

Run **Search only**, UK, English + Urdu as languages, and split 5★ and 4★ into separate ad groups so
the ad copy matches the click. The page has matching on-page copy for every one of these, which is
what lifts the landing-page-experience half of Quality Score.

| Ad group | Core keywords | Landing URL |
|---|---|---|
| 5 star Umrah | `5 star umrah packages`, `luxury umrah package uk`, `5 star umrah 2026` | `/umrah-packages-uk/` |
| 4 star Umrah | `4 star umrah packages`, `4 star umrah package uk` | `…/#packages` |
| Umrah packages (core) | `umrah packages uk`, `umrah package 2026`, `all inclusive umrah package` | `/umrah-packages-uk/` |
| By city | `umrah packages from london / manchester / birmingham / glasgow` | `/umrah-packages-uk/` |
| By duration | `7 night umrah package`, `10 nights umrah package`, `14 night umrah` | `…/#packages` |
| Ramadan / Easter | `ramadan umrah packages`, `easter umrah packages` | `…/#packages` |
| Family & group | `family umrah packages`, `group umrah packages uk` | `…/#faq` |
| Instalments | `umrah packages with instalments`, `umrah pay monthly` | `…/#how` |

Start on **Phrase** and **Exact**. Broad match in this niche burns budget on "how to perform umrah"
traffic within a day.

### Negative keyword list — add before your first click

```
how to, dua, niyyah, steps, guide, ruling, hadith, meaning, in urdu, in arabic,
free, cheapest, cheap, budget, 3 star, hajj (unless you sell hajj on this page),
jobs, vacancy, agent jobs, visa only, visa price, ticket only, flight only,
from pakistan, from india, from usa, from canada, from dubai, from nigeria,
company registration, iata licence, atol licence how to, umrah kit, ihram buy,
zamzam, images, pictures, youtube, vlog, wikipedia
```

Location targeting must be set to **"Presence: people in your targeted locations"** — not the
default "presence or interest", which is how UK Umrah advertisers end up paying for clicks from
Pakistan and Nigeria.

### Ad copy angles that match this page

Every headline below has an on-page proof point. That alignment is the point.

- `5 Star Umrah Packages 2026 — From £995`
- `Hotels Minutes From The Haram`
- `ATOL Protected · Deposit & Instalments`
- `Named Hotels — Never "5 Star Or Similar"`
- `Our Own Staff In Makkah & Madinah`
- `Quote Within The Hour, 9am–9pm`
- `Flights, E-Visa & Transfers Included`

Sitelinks: Packages & Prices (`#packages`), Hotels (`#hotels`), What's Included (`#included`),
FAQs (`#faq`).
Callouts: ATOL Protected · Instalment Plans · 24/7 Ground Staff · London, Manchester, Birmingham.
Structured snippet (Types): 7 Nights, 10 Nights, 12 Nights, 14 Nights, Ramadan, Family Groups.
Add a **call extension** with 020 3355 0818 and a **lead form asset** as a backup capture path.

### Track calls properly

Most Umrah leads on mobile paid traffic call rather than type. Turn on **call reporting** with a
Google forwarding number, or the phone conversions will be undercounted and Smart Bidding will
optimise towards the wrong half of your traffic.

---

## 5. Testing it before you spend

The page is static, so with Option A the whole thing — including the form writing to your sheet —
works on free hosting in minutes: GitHub Pages, Netlify Drop, or Cloudflare Pages. Those are
static-only, so `submit-lead.php` will not run there.

Test with `?gclid=TEST123&utm_campaign=test&utm_term=5+star+umrah` appended to the URL, then confirm
those values land in your sheet. Also check:

- Google Ads tag fires (use Tag Assistant), and the conversion registers in the Ads UI.
- The mobile sticky bar shows, and both `tel:` and WhatsApp open correctly on a real phone.
- The page passes Core Web Vitals — landing page experience feeds Quality Score. There are no image
  files on this page at all, so it should be near-instant; keep it that way if you add photos.
- `robots.txt` and a sitemap entry exist at the **domain root** if you want this page indexed
  organically as well as used for ads.

---

## 6. Why the page is built this way

- **Text is trimmed to the scannable minimum, not removed.** Long paragraphs kill conversion, but
  thin pages score badly on landing page experience and get the "low value content" treatment in ad
  review — travel lead-gen is a policy-sensitive vertical. The compromise here: short lines,
  front-loaded, in scannable blocks; the FAQ carries the depth Google's raters look for behind
  accordions, where a human only reads what they care about. Word count is roughly a third lower
  than a typical Umrah landing page while covering more questions.
- **Form above the fold, four fields.** Every extra field costs completions. Qualifying questions
  (budget, airport, dates) come after the lead is already banked.
- **No exit paths.** The nav is anchor links only. The only outbound links are the legal pages and
  one footer link to your main site — a paid click that leaks to your homepage is a wasted click.
- **The message-match is the star rating.** Someone clicking a "5 star umrah" ad lands on a page
  whose headline, tabs, hotel section and form all say "5 star". That match is half of Quality Score
  and most of the conversion rate.
- **Honest price ranges.** Most Umrah competitors hide prices behind an enquiry. Publishing "from"
  prices filters out the £600 shopper before they cost you an adviser's time, and reads as
  transparent to both users and Google's landing page raters.
- **A "not included" list.** Nobody in this industry publishes one. It is the single most trust-
  building block on the page, and it pre-empts the complaint that generates refund requests.
- **The objection section (`#why`) names real failure modes** — "5 star or similar", nobody to call
  at 2am, the price that grows. Naming the fear you already fix converts better than listing
  features.
- **Zero image files.** The hero pattern and every icon is inline SVG or a data URI, so LCP is text
  and the page loads instantly on 4G in a mosque car park. Add real photography of your hotels when
  you have it — that will convert better than any illustration — but budget the bytes.
- **`gclid` pass-through.** Hidden in every submission, so a booking can be traced back to the exact
  keyword, and later uploaded as an offline conversion to teach Smart Bidding which enquiries were
  actually worth money. This is the single highest-leverage thing on the page after the form itself.
- **Consent line under the button**, naming the company and the contact methods, with a linked
  privacy policy — expected for UK lead-gen collecting phone numbers, and it reduces form anxiety.

---

## 7. What to test first

1. **Headline** — the current trust angle vs. a price-direct one
   (`5 Star Umrah From £995 — Flights, Visa & Hotels Included`).
2. **Hotel standard field** — required (current, better lead quality) vs. optional (more leads).
3. **Price block on/off.** It filters hard. Measure cost per *deposit taken*, not cost per lead.
4. **WhatsApp prominence.** Umrah buyers in the UK are heavy WhatsApp users; making it the primary
   CTA on mobile may beat the form outright. Worth a proper test rather than a guess.

Give each test two weeks or 100 conversions, whichever comes later.
