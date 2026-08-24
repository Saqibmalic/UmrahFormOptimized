/* ==================================================================
   Umrah Insights — Umrah packages landing page
   Two-stage enquiry flow, validation, tracking. No dependencies.

   FLOW
   ----
   Stage 1 (name, mobile, email, hotel standard) posts on its own and
   is banked immediately — someone who abandons stage 2 is still a
   contactable lead. Stage 2 enriches the same lead_id with trip
   detail. The Google Ads lead conversion fires at stage 1, because
   that is the moment you actually got something worth money.
   ================================================================== */
(function () {
  'use strict';

  /* ---- Google Ads conversion labels ---------------------------
     From Google Ads › Goals › Conversions › your action › tag setup.
     Format: 'AW-XXXXXXXXXX/AbCdEfGhIjKlMnOp'
     ------------------------------------------------------------ */
  var CONVERSIONS = {
    lead:     'AW-XXXXXXXXXX/REPLACE_LEAD_LABEL',
    call:     'AW-XXXXXXXXXX/REPLACE_CALL_LABEL',
    whatsapp: 'AW-XXXXXXXXXX/REPLACE_WHATSAPP_LABEL'
  };

  /* ---- Where leads go -----------------------------------------
     'sheets' — Google Apps Script web app writing to a Google Sheet.
                Works on any static host. Paste your /exec URL below.
     'php'    — submit-lead.php on your own PHP hosting.
     Both receive the identical JSON payload, so you can switch
     later without touching anything else.
     ------------------------------------------------------------ */
  var BACKEND = {
    mode: 'sheets',
    url:  'PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE'
    /* PHP hosting instead?  mode: 'php', url: 'submit-lead.php' */
  };

  if (BACKEND.url.indexOf('PASTE_YOUR') === 0) {
    console.warn('[Umrah Insights] No lead endpoint configured. Deploy google-apps-script.gs and ' +
                 'paste the /exec URL into BACKEND.url in assets/js/umrah.js — until you do, ' +
                 'enquiries will not be saved anywhere.');
  }

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var track = function (name, params) {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  };

  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ================= Validation ================================ */
  var MESSAGES = {
    name:  'Please enter your name.',
    email: 'Please enter an email address we can send the quote to.',
    phone: 'Please enter a mobile number we can reach you on.',
    tier:  'Please choose a hotel standard — or pick “Not sure”.'
  };
  var isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); };
  /* UK mobiles are 11 digits (07…), landlines 10–11, and +44 / 00 44
     prefixes are common on paid traffic. Accept 9–15 digits, which
     covers UK numbers written any of the usual ways plus expats. */
  var isPhone = function (v) {
    var d = v.replace(/\D/g, '');
    return d.length >= 9 && d.length <= 15;
  };

  var fieldOf = function (input) { return input.closest('.field'); };

  var setError = function (input, msg) {
    var field = fieldOf(input);
    if (!field) return;
    var err = field.querySelector('[data-err]');
    if (msg) {
      field.classList.add('is-bad');
      input.setAttribute('aria-invalid', 'true');
      if (err) err.textContent = msg;
    } else {
      field.classList.remove('is-bad');
      input.removeAttribute('aria-invalid');
      if (err) err.textContent = '';
    }
  };

  var validate = function (input) {
    var n = input.name;
    if (input.type === 'radio') {
      var group = input.form ? input.form.querySelectorAll('input[name="' + n + '"]') : [];
      var picked = Array.prototype.some.call(group, function (r) { return r.checked; });
      setError(input, picked ? null : MESSAGES[n] || 'Please choose an option.');
      return picked;
    }
    var v = input.value.trim();
    if (!v) { setError(input, MESSAGES[n] || 'This field is required.'); return false; }
    if (n === 'email' && !isEmail(v)) { setError(input, MESSAGES.email); return false; }
    if (n === 'phone' && !isPhone(v)) { setError(input, MESSAGES.phone); return false; }
    setError(input, null);
    return true;
  };

  var validateForm = function (form) {
    var ok = true, first = null, seen = {};
    $$('[required]', form).forEach(function (input) {
      if (input.type === 'radio') {
        if (seen[input.name]) return;
        seen[input.name] = true;
      }
      if (!validate(input)) { ok = false; if (!first) first = input; }
    });
    if (!ok && first) {
      first.focus({ preventScroll: true });
      var target = fieldOf(first) || first;
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      track('form_error', { form: form.id });
    }
    return ok;
  };

  /* Live feedback + light UK phone tidying */
  var wireForm = function (form) {
    var started = false;
    var begin = function () {
      if (started) return;
      started = true;
      track('form_start', { form: form.id });
    };
    $$('input, select, textarea', form).forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input.hasAttribute('required') && input.value.trim()) validate(input);
      });
      input.addEventListener('input', function () {
        var f = fieldOf(input);
        if (f && f.classList.contains('is-bad')) validate(input);
        begin();
      });
      input.addEventListener('change', function () {
        if (input.type === 'radio') validate(input);
        begin();
      });
    });
    var phone = form.querySelector('input[name="phone"]');
    if (phone) {
      phone.addEventListener('blur', function () {
        /* 07700900123 → 07700 900123. Anything international is left alone. */
        var v = phone.value.trim();
        if (/^0\d{10}$/.test(v)) phone.value = v.slice(0, 5) + ' ' + v.slice(5);
      });
    }
  };

  /* ---- Ad click context, carried into every submission -------- */
  var adContext = function () {
    var qs = new URLSearchParams(location.search), out = { page_url: location.href };
    ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
      .forEach(function (k) { if (qs.get(k)) out[k] = qs.get(k); });
    if (document.referrer) out.referrer = document.referrer;
    return out;
  };

  /* ---- Lead id, minted client-side ----------------------------
     Generated here so the flow never depends on reading the
     server's response — a Google Apps Script endpoint is
     cross-origin and its body is opaque to us. Both stages send
     the same id and the backend keys the record on it. */
  var leadId = null;
  var newLeadId = function () {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return 'UI-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' +
           Math.random().toString(36).slice(2, 7).toUpperCase();
  };

  var serialise = function (form) {
    var out = {};
    new FormData(form).forEach(function (v, k) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim();
    });
    return out;
  };

  /* ---- Transport ----------------------------------------------
     Apps Script rejects a preflight, so the sheets mode posts
     text/plain (a "simple request") and never reads the response.
     PHP mode posts JSON and can read it. Either way the UI does
     not wait on the network to advance the user. */
  var send = function (payload) {
    if (BACKEND.url.indexOf('PASTE_YOUR') === 0) {
      console.warn('[Umrah Insights] Enquiry not sent — no BACKEND.url configured.', payload);
      return Promise.resolve();
    }
    var isSheets = BACKEND.mode === 'sheets';
    return fetch(BACKEND.url, {
      method: 'POST',
      mode: isSheets ? 'no-cors' : 'cors',
      headers: { 'Content-Type': isSheets ? 'text/plain;charset=utf-8' : 'application/json' },
      body: JSON.stringify(payload)
    })['catch'](function (err) {
      console.error('[Umrah Insights] Enquiry POST failed', err);
    });
  };

  var submitStage = function (stage, data) {
    if (!leadId) leadId = newLeadId();
    var payload = Object.assign({ stage: stage, lead_id: leadId }, adContext(), data);
    return send(payload);
  };

  /* ================= Conversion tracking ======================= */
  var fireConversion = function (kind, params) {
    var label = CONVERSIONS[kind];
    if (typeof gtag === 'function' && label && label.indexOf('REPLACE') === -1) {
      gtag('event', 'conversion', { send_to: label });
    }
    track(kind === 'lead' ? 'generate_lead' : kind + '_click', params || {});
  };

  /* Every tel: and wa.me link on the page reports itself. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href*="wa.me"]');
    if (!a) return;
    var isCall = a.getAttribute('href').indexOf('tel:') === 0;
    fireConversion(isCall ? 'call' : 'whatsapp', { location: a.getAttribute('data-track') || 'unknown' });
  });

  /* ================= Package tabs ============================== */
  (function tabs() {
    var bar = $('.tabs');
    if (!bar) return;
    var buttons = $$('[role="tab"]', bar);
    var show = function (btn) {
      buttons.forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        var panel = document.getElementById(b.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      track('package_tab', { tier: btn.textContent.trim() });
    };
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { show(b); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var i = buttons.indexOf(b);
        var next = buttons[(i + (e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length];
        next.focus(); show(next);
      });
    });
  })();

  /* ================= Modal ===================================== */
  var modal      = $('#modal');
  var modalForm  = $('#modal-form');
  var detailForm = $('#detail-form');
  var lastFocus  = null;

  var stepEl = function (n) { return $('[data-step="' + n + '"]', modal); };

  var showStep = function (n) {
    [1, 2, 3].forEach(function (i) {
      var el = stepEl(i);
      if (el) el.hidden = i !== n;
    });
    var focusable = modal.querySelector('[data-step]:not([hidden]) input, [data-step]:not([hidden]) select, [data-step]:not([hidden]) button');
    if (focusable) focusable.focus();
  };

  var openModal = function (source, pkg) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    showStep(leadId ? 2 : 1);
    var hidden = modalForm && modalForm.querySelector('input[name="package_interest"]');
    if (hidden && pkg) hidden.value = pkg;
    /* A tier-specific button preselects the matching pill —
       one less decision for someone who already told us. */
    if (pkg && modalForm) {
      var pre = pkg.indexOf('5 star') === 0 ? '#m-t5' : (pkg.indexOf('4 star') === 0 ? '#m-t4' : null);
      if (pre) { var r = $(pre); if (r) r.checked = true; }
    }
    track('quote_open', { source: source || 'unknown', package: pkg || '' });
  };

  var closeModal = function () {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };

  document.addEventListener('click', function (e) {
    var open = e.target.closest && e.target.closest('[data-open-quote]');
    if (open) {
      e.preventDefault();
      /* On desktop the hero form is always visible — scrolling to it
         beats a modal. Below 1000px the form is far down the page,
         so the modal is the faster path. */
      var heroForm = $('#quote-form');
      if (heroForm && window.innerWidth > 1000 && !leadId) {
        heroForm.scrollIntoView({ block: 'center', behavior: 'smooth' });
        var pkg = open.getAttribute('data-pkg') || '';
        var pre = pkg.indexOf('5 star') === 0 ? '#t5' : (pkg.indexOf('4 star') === 0 ? '#t4' : null);
        if (pre) { var r = $(pre); if (r) r.checked = true; }
        $('#q-name').focus({ preventScroll: true });
        track('quote_scroll', { source: open.getAttribute('data-pkg') || '' });
        return;
      }
      openModal(open.getAttribute('data-track') || 'button', open.getAttribute('data-pkg') || '');
      return;
    }
    if (e.target.closest && e.target.closest('[data-close-modal]')) { closeModal(); return; }
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
    if (e.key !== 'Tab' || !modal || modal.hidden) return;
    /* Keep focus inside the dialog while it is open. */
    var f = $$('a[href], button:not([disabled]), input, select, textarea', modal)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ================= Stage 1 =================================== */
  var stageOne = function (form, onDone) {
    return function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var data = serialise(form);
      submitStage(1, data);
      fireConversion('lead', { tier: data.tier || '', package: data.package_interest || '' });

      /* The user moves on immediately — the POST completes in the
         background. Nothing about the next screen depends on it. */
      window.setTimeout(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        onDone(data);
      }, 350);
    };
  };

  if ($('#quote-form')) {
    var heroForm = $('#quote-form');
    wireForm(heroForm);
    heroForm.addEventListener('submit', stageOne(heroForm, function (data) {
      /* Carry the hero answers into the modal so stage 2 opens
         straight onto the trip questions. */
      if (modalForm) {
        ['name', 'email', 'phone'].forEach(function (k) {
          var el = modalForm.querySelector('[name="' + k + '"]');
          if (el && data[k]) el.value = data[k];
        });
      }
      openModal('hero-form', data.tier || '');
      showStep(2);
    }));
  }

  /* Inline lead bands — same stage 1, same conversion, then the
     modal opens straight onto the trip questions. */
  $$('.band__form').forEach(function (form) {
    wireForm(form);
    form.addEventListener('submit', stageOne(form, function (data) {
      if (modalForm) {
        ['name', 'email', 'phone'].forEach(function (k) {
          var el = modalForm.querySelector('[name="' + k + '"]');
          if (el && data[k]) el.value = data[k];
        });
      }
      openModal('lead-band', data.tier || '');
      showStep(2);
    }));
  });

  if (modalForm) {
    wireForm(modalForm);
    modalForm.addEventListener('submit', stageOne(modalForm, function () { showStep(2); }));
  }

  /* ================= Stage 2 =================================== */
  if (detailForm) {
    wireForm(detailForm);
    detailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = detailForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      var pkg = modalForm && modalForm.querySelector('input[name="package_interest"]');
      var data = serialise(detailForm);
      if (pkg && pkg.value) data.package_interest = pkg.value;
      submitStage(2, data);
      track('trip_details_added', {});
      window.setTimeout(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Send my details'; }
        showStep(3);
      }, 350);
    });
  }

  $$('[data-skip-detail]').forEach(function (b) {
    b.addEventListener('click', function () {
      track('trip_details_skipped', {});
      showStep(3);
    });
  });


  /* ================= Customer video wall =======================
     Each tile is a poster image until clicked. Only then does the
     real player load — a normal YouTube embed costs ~700KB per
     video and would wreck the load speed this page depends on. */
  (function videos() {
    var section = document.getElementById('reviews');
    if (!section) return;

    var live = 0;
    $$('.vid', section).forEach(function (fig) {
      var btn = $('.vid__btn', fig);
      var id  = btn && btn.getAttribute('data-video');

      /* Not configured yet → hide this tile rather than ship a
         broken play button. */
      if (!id || id.indexOf('REPLACE') === 0) { fig.hidden = true; return; }

      var poster = $('.vid__poster', fig);
      if (poster) {
        poster.addEventListener('error', function () { fig.hidden = true; });
      }
      live++;

      btn.addEventListener('click', function () {
        var type = btn.getAttribute('data-video-type') || 'youtube';
        var title = btn.getAttribute('data-video-title') || 'Customer story';
        var player;

        if (type === 'file') {
          player = document.createElement('video');
          player.src = id;
          player.controls = true;
          player.autoplay = true;
          player.playsInline = true;
          player.setAttribute('title', title);
          if (poster) player.poster = poster.getAttribute('src');
        } else {
          player = document.createElement('iframe');
          player.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
                       '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
          player.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
          player.allowFullscreen = true;
          player.setAttribute('title', title);
          player.setAttribute('loading', 'lazy');
        }

        btn.replaceWith(player);
        track('video_play', { video: id, position: title });
      });
    });

    /* All four still placeholders → keep the section hidden so the
       page is publishable before the videos are ready. */
    section.hidden = live === 0;
  })();

  /* ---- Scroll depth, so you can see where attention dies ------ */
  (function depth() {
    var marks = [25, 50, 75, 100], hit = {};
    var onScroll = function () {
      var h = document.documentElement;
      var pct = (h.scrollTop + window.innerHeight) / h.scrollHeight * 100;
      marks.forEach(function (m) {
        if (pct >= m && !hit[m]) { hit[m] = true; track('scroll_depth', { percent: m }); }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  })();
})();
