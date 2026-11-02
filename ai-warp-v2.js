/* ==========================================================================
   AI WARP v2 — "masterfully integrated" warp engine, colour-washout rebuild
   --------------------------------------------------------------------------
   Drop-in replacement for the inline runtime script block whose id is
   "ai-warp-runtime", on media_page_MASTERFULLY_INTEGRATED.html.
   (Spelled without the angle brackets on purpose: this file gets inlined
   into the page, and a literal script-open tag in a comment would throw
   off any tag-counting tooling or HTML sanity check.)

   Design goal: keep the displacement warp and the audio reactivity EXACTLY as
   they are, and make the COLOUR response translucent and brightness-neutral
   instead of clipped and blown out.

   Three structural changes vs v1:

   1. LUMA-PRESERVING COLOUR  (feBlend mode="luminosity")
      v1 applied hueRotate + saturate straight onto the page. hueRotate is not
      perceptually uniform — rotating yellow->blue changes luminance a lot — so
      the page visibly flashed bright/dark. v2 blends the recoloured image back
      against the warped original in `luminosity` mode, which keeps the original
      brightness and takes only hue + saturation. LUMA_PROTECT controls how much.

   2. SOFT-KNEE HIGHLIGHT SHOULDER  (feComponentTransfer type="table")
      v1's saturate peaked at 2.05x at 50% slider, which pushes channels past
      1.0 and clips to flat white. v2 caps saturation near 1.0-1.18x AND runs a
      filmic shoulder over the highlights so nothing can hard-clip.

   3. REAL TRANSPARENCY ON THE COLOUR OVERFLOW
      v1 pinned the canvas at opacity 1 and floored the stack at 0.25, so the
      slider could not actually fade the colour. v2 composites the colour layer
      over the warped source at an explicit alpha (COLOR_TINT_MAX) and drives
      both the canvas and the stack from the slider with no floor.

   Every knob lives in CFG below.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ==========================================================
     CFG — tune here. Everything is live (re-read every frame
     for master/bass/treble; the table is rebuilt on demand).
     ========================================================== */
  var CFG = {
    /* ---- the headline knob: transparency of the colour overflow ---- */
    COLOR_TINT_MAX: 0.55,   /* v1: effectively 1.00 (canvas opacity pinned to 1) */
    COLOR_TINT_FLOOR: 0.18, /* how much tint stays at silence, so it never dies */
    LUMA_PROTECT: 0.85,     /* 0..1 — how hard original brightness is preserved  */

    /* ---- bounded hue ---- */
    HUE_WINDOW: 46,         /* +/- degrees. v1: 0..280 one-way swing           */
    HUE_DRIFT_DEG_S: 1.5,   /* slow idle drift, kept from v1                   */
    HUE_SLEW: 0.07,         /* per-frame slew rate; kills transient hue jumps  */

    /* ---- bounded saturation ---- */
    SAT_BASE: 1.00,         /* v1: 1.2 + master*0.6   (1.50x at 50%)           */
    SAT_AUDIO_MAX: 0.18,    /* v1: + treble*master*1.1 (2.05x at 50%, treble 1)*/
    SHOULDER_KNEE: 0.62,    /* highlight soft-clip starts here                 */
    SHOULDER_TOP: 0.96,     /* white point ceiling — the actual anti-blowout   */
    SHOULDER_CURVE: 2.2,    /* shoulder roundness, higher = gentler roll-off   */

    /* ---- canvas veil ---- */
    CANVAS_ALPHA_MAX: 0.55, /* v1: 1.0 with a hard 0.25 floor on the stack     */
    STACK_ALPHA_FLOOR: 0.0, /* v1: 0.25                                        */
    PLANE_SAT: 82,          /* % — v1: 100                                     */
    PLANE_LIGHT: 52,        /* % — v1: 58                                      */
    GIF_ALPHA_MAX: 0.22,    /* v1: min(0.55, ...)                              */
    VIVID_GAIN: 0.72,       /* scales every canvas alpha                       */

    /* ---- geometry: unchanged from v1 by default ---- */
    WARP_SCALE_GAIN: 1.0,

    /* Which operand supplies the LUMINANCE in feBlend mode="luminosity".
       MEASURED in Chromium 153: luma comes from `in`, chroma from `in2` --
       the OPPOSITE of the CSS Compositing spec wording ("luminance of the
       backdrop, hue and saturation of the source", where source = in).
       probeLumaBlendOrder() checks at runtime and flips this if a browser
       follows the spec text instead. Set to null to skip the probe. */
    LUMA_BLEND_LUMA_FROM: 'in'
  };

  /* ==========================================================
     BROWSER PROBE — resolves the feBlend in/in2 ambiguity once.
     Renders a 4x4 red-over-white patch through mode="luminosity"
     in a data-URL SVG and reads the pixel back. Fully wrapped in
     try/catch: any failure keeps the measured default.
     ========================================================== */
  function probeLumaBlendOrder(cb) {
    if (!CFG.LUMA_BLEND_LUMA_FROM) return cb(CFG.LUMA_BLEND_LUMA_FROM);
    try {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4">'
        + '<filter id="p" color-interpolation-filters="sRGB" '
        + 'x="0" y="0" width="4" height="4">'
        + '<feFlood flood-color="#ffffff" result="b"/>'
        + '<feFlood flood-color="#ff0000" result="s"/>'
        + '<feBlend in="s" in2="b" mode="luminosity"/></filter>'
        + '<rect width="4" height="4" fill="#000" filter="url(#p)"/></svg>';
      var img = new Image();
      img.onload = function () {
        var order = null;
        try {
          var cv = document.createElement('canvas');
          cv.width = cv.height = 4;
          var cx = cv.getContext('2d');
          cx.drawImage(img, 0, 0);
          var d = cx.getImageData(2, 2, 1, 1).data;
          /* red's luma  -> neutral grey  (green ~ 76)  => luma came from `in`
             white's luma -> light red    (green ~191)  => luma came from `in2` */
          order = (d[1] < 128) ? 'in' : 'in2';
        } catch (e) { order = null; }
        cb(order || CFG.LUMA_BLEND_LUMA_FROM);
      };
      img.onerror = function () { cb(CFG.LUMA_BLEND_LUMA_FROM); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    } catch (e) { cb(CFG.LUMA_BLEND_LUMA_FROM); }
  }

  /** Point the luminosity feBlend so displaced supplies luma, soft supplies chroma. */
  function applyLumaBlendOrder(lumaFrom) {
    var blend = document.getElementById('ai-luma-blend');
    if (!blend) return;
    if (lumaFrom === 'in2') {
      blend.setAttribute('in', 'soft');
      blend.setAttribute('in2', 'displaced');
    } else {
      blend.setAttribute('in', 'displaced');
      blend.setAttribute('in2', 'soft');
    }
    blend.setAttribute('data-luma-from', lumaFrom);
  }

  /* ==========================================================
     PURE MATH — exported so it can be unit-tested headlessly
     ========================================================== */

  /** Filmic soft shoulder as an feComponentTransfer table string. */
  function softShoulderTable(knee, top, n, curve) {
    knee = (typeof knee === 'number') ? knee : CFG.SHOULDER_KNEE;
    top = (typeof top === 'number') ? top : CFG.SHOULDER_TOP;
    n = n || 17;
    curve = (typeof curve === 'number') ? curve : CFG.SHOULDER_CURVE;
    var denom = Math.tanh(curve);
    var out = [];
    for (var i = 0; i < n; i++) {
      var c = i / (n - 1);
      var v;
      if (c <= knee) {
        v = c;                                   /* identity through the mids */
      } else {
        var s = (c - knee) / (1 - knee);         /* 0..1 across the shoulder  */
        v = knee + (top - knee) * (Math.tanh(s * curve) / denom);
      }
      if (v > top) v = top;
      out.push(v.toFixed(4));
    }
    return out.join(' ');
  }

  /** v1 verbatim, kept only so the A/B demo and the docs can cite it. */
  function satValueV1(master, treble) {
    return 1.2 + master * 0.6 + treble * master * 1.1;
  }

  /** v2: bounded, and it can never exceed SAT_BASE + SAT_AUDIO_MAX. */
  function satValueV2(master, treble) {
    var v = CFG.SAT_BASE + treble * master * CFG.SAT_AUDIO_MAX;
    var max = CFG.SAT_BASE + CFG.SAT_AUDIO_MAX;
    return v > max ? max : v;
  }

  /** v1 verbatim: 0..280 one-way, treble-driven. */
  function hueTargetV1(master, treble, t, themeOff) {
    return (treble * master * 280 + (t / 50) * master * 0.15 + (themeOff || 0)) % 360;
  }

  /** v2: signed swing inside a window, plus the same slow drift. */
  function hueTargetV2(master, treble, t, themeOff) {
    var swing = (treble * 2 - 1) * CFG.HUE_WINDOW * master;   /* -W .. +W */
    var drift = (t / 50) * master * 0.15;                      /* 1.5 deg/s @ 50% */
    var a = swing + drift + (themeOff || 0);
    return ((a % 360) + 360) % 360;
  }

  /** Frame-rate independent slew limiter, normalised to [0,360). */
  function slewTo(current, target, rate) {
    var d = target - current;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    var next = current + d * rate;
    return ((next % 360) + 360) % 360;
  }

  /**
   * Alpha of the recoloured layer over the warped source — the "transparency
   * of the colour overflow" knob. The floor is a floor on the AUDIO response
   * (so a whisper of tint survives silence), and the whole thing scales with
   * the slider so 0% really is 0%.
   */
  function tintAlphaV2(master, treble) {
    var audioResp = CFG.COLOR_TINT_FLOOR + (1 - CFG.COLOR_TINT_FLOOR) * treble;
    return master * audioResp * CFG.COLOR_TINT_MAX;
  }

  /** Canvas veil opacity — driven by the slider, no floor. */
  function canvasAlphaV2(master, bass, treble) {
    return master * CFG.CANVAS_ALPHA_MAX * CFG.VIVID_GAIN * (0.6 + bass * 0.25 + treble * 0.35);
  }

  var MATH = {
    softShoulderTable: softShoulderTable,
    satValueV1: satValueV1,
    satValueV2: satValueV2,
    hueTargetV1: hueTargetV1,
    hueTargetV2: hueTargetV2,
    slewTo: slewTo,
    tintAlphaV2: tintAlphaV2,
    canvasAlphaV2: canvasAlphaV2,
    CFG: CFG
  };
  root.AIWarpV2Math = MATH;

  /* ==========================================================
     DOM RUNTIME
     ========================================================== */
  if (typeof document === 'undefined') return;   /* headless / node import */

  var DEFAULT_MASTER = 0.5;
  var GIF_BASE = 0.80;
  var __hueState = 0;
  var __tableApplied = false;

  function $(id) { return document.getElementById(id); }

  function getMaster() {
    var slider = $('ai-warp-opacity-slider');
    var v = slider ? parseFloat(slider.value) : DEFAULT_MASTER;
    return isFinite(v) ? v : DEFAULT_MASTER;
  }

  function updateLabel(master) {
    var label = $('ai-warp-opacity-value');
    if (label) label.textContent = Math.round(master * 100) + '%';
  }

  function resizeCanvas() {
    var c = $('ai-warp-canvas');
    if (!c) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.floor(window.innerWidth * dpr);
    c.height = Math.floor(window.innerHeight * dpr);
  }

  function readSpectrum() {
    var a = window.__aiWarpAnalyser || null;
    try {
      if (!a && typeof analyser !== 'undefined') a = analyser;
      if (!a && typeof synthAnalyser !== 'undefined') a = synthAnalyser;
    } catch (e) {}
    if (!a) return { bass: 0, treble: 0, active: false };
    try {
      var data = new Uint8Array(a.frequencyBinCount);
      a.getByteFrequencyData(data);
      var n = data.length, bassSum = 0, bassN = 0, trebSum = 0, trebN = 0;
      var bassEnd = Math.max(2, Math.floor(n * 0.12));
      for (var i = 0; i < bassEnd; i++) { bassSum += data[i]; bassN++; }
      var trebStart = Math.floor(n * 0.70);
      for (var j = trebStart; j < n; j++) { trebSum += data[j]; trebN++; }
      return {
        bass: bassN ? (bassSum / bassN) / 255 : 0,
        treble: trebN ? (trebSum / trebN) / 255 : 0,
        active: true
      };
    } catch (e2) { return { bass: 0, treble: 0, active: false }; }
  }

  /** Write the soft-shoulder table into the filter once. */
  function ensureShoulderTable() {
    if (__tableApplied) return;
    var tbl = softShoulderTable(CFG.SHOULDER_KNEE, CFG.SHOULDER_TOP, 17, CFG.SHOULDER_CURVE);
    ['ai-soft-r', 'ai-soft-g', 'ai-soft-b'].forEach(function (id) {
      var el = $(id);
      if (el) el.setAttribute('tableValues', tbl);
    });
    __tableApplied = true;
  }

  /* ---- v2 filter animation: same geometry, restrained colour ---- */
  function applyParams(master, bass, treble, t) {
    ensureShoulderTable();

    var feLarge = $('ai-turbulence-large');
    var feSmall = $('ai-turbulence-small');
    var feDisp = $('ai-displacement');
    var feHue = $('ai-color-matrix');
    var feSat = $('ai-saturate-matrix');
    var feLumaA = $('ai-luma-protect-alpha');
    var feTintA = $('ai-tint-alpha');
    var stack = $('ai-warp-stack');
    var canvasEl = $('ai-warp-canvas');

    window.__aiWarpBass = (window.__aiWarpBass || 0) * 0.82 + bass * 0.18;
    window.__aiWarpTreble = (window.__aiWarpTreble || 0) * 0.82 + treble * 0.18;
    var b = window.__aiWarpBass;
    var tr = window.__aiWarpTreble;

    /* geometry: unchanged v1 formula, scaled by WARP_SCALE_GAIN */
    var masterBeat = (Math.sin(t / 200) + 1) / 2;
    var idleFloor = 6 * master;
    var warpScale = (idleFloor + b * master * 48 * (0.45 + masterBeat * 0.55)) * CFG.WARP_SCALE_GAIN;

    var largeFreq = 0.0025 + Math.sin(t / 8000) * 0.0015 + b * 0.005;
    var smallFreq = 0.035 + Math.cos(t / 3000) * 0.02 + tr * 0.025;

    /* colour: bounded window + slew-limited, so no transient jumps */
    var themeOff = window.__THEME_HUE_OFFSET || 0;
    var hueTarget = hueTargetV2(master, tr, t, themeOff);
    __hueState = slewTo(__hueState, hueTarget, CFG.HUE_SLEW);

    var satValue = satValueV2(master, tr);
    var tint = tintAlphaV2(master, tr);

    if (feLarge) feLarge.setAttribute('baseFrequency', String(largeFreq));
    if (feSmall) feSmall.setAttribute('baseFrequency', String(smallFreq));
    if (feDisp) feDisp.setAttribute('scale', String(warpScale));
    if (feHue) feHue.setAttribute('values', String(__hueState.toFixed(3)));
    if (feSat) feSat.setAttribute('values', String(satValue.toFixed(4)));
    if (feTintA) feTintA.setAttribute('tableValues', '0 ' + tint.toFixed(4));
    if (feLumaA) feLumaA.setAttribute('tableValues', '0 ' + CFG.LUMA_PROTECT.toFixed(4));

    /* canvas veil: slider-driven, no floor, no pin at 1 */
    var ca = canvasAlphaV2(master, b, tr);
    if (canvasEl) {
      canvasEl.style.opacity = ca.toFixed(4);
      canvasEl.style.visibility = master > 0.01 ? 'visible' : 'hidden';
    }

    if (master > 0.01) {
      window.__aiWarpCssFilter = 'url(#ai-warp-filter)';
      document.body.style.filter = window.__aiWarpCssFilter;
    } else {
      window.__aiWarpCssFilter = '';
      document.body.style.filter = 'none';
      if (feDisp) feDisp.setAttribute('scale', '0');
      if (feHue) feHue.setAttribute('values', '0');
      if (feSat) feSat.setAttribute('values', '1');
      if (feTintA) feTintA.setAttribute('tableValues', '0 0');
    }

    var stackA = Math.max(CFG.STACK_ALPHA_FLOOR, master);
    if (stack) stack.style.opacity = String(stackA.toFixed(4));
  }

  /* ---- canvas colour layer ----
     v1 accumulated fully-saturated planes with `screen` until the canvas went
     near-white, then laid that veil over the page at alpha >= 0.25. v2 keeps
     the same render but drops source saturation/lightness and scales alpha,
     so the veil stays translucent instead of becoming a white film.       */
  function hsl(h, a) {
    return 'hsla(' + h.toFixed(1) + ',' + CFG.PLANE_SAT + '%,' + CFG.PLANE_LIGHT + '%,' + a.toFixed(4) + ')';
  }

  function drawColorVeil(ctx, w, h, master, bass, treble, t) {
    if (!ctx || master < 0.01) return;
    ctx.clearRect(0, 0, w, h);

    var vivid = master * (0.5 + bass * 0.75 + treble * 0.95) * CFG.VIVID_GAIN;

    var img = $('ai-warp-hue-img');
    if (img && img.complete && img.naturalWidth > 0) {
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var sc = Math.max(w / iw, h / ih) * 1.1;
      var dw = iw * sc, dh = ih * sc;
      var dx = (w - dw) * 0.5 + Math.sin(t / 6000) * w * 0.03;
      var dy = (h - dh) * 0.5 + Math.cos(t / 8000) * h * 0.025;
      var ca = GIF_BASE * master * 0.35 * (0.85 + treble * 0.2);
      if (ca > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(CFG.GIF_ALPHA_MAX, ca);
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      }
    }

    /* three soft two-tone planes, angles derived from time so it stays alive */
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var p = 0; p < 3; p++) {
      var ang = (t / (9000 + p * 2600) + p * 0.9);
      var off = Math.sin(t / (7000 + p * 1500)) * 0.28;
      var hueA = (__hueState + p * 120) % 360;
      var hueB = (hueA + 55) % 360;
      var cx = w * 0.5 + off * w, cy = h * 0.5 + off * h * 0.3;
      var cos = Math.cos(ang), sin = Math.sin(ang);
      var reach = Math.max(w, h);
      var g = ctx.createLinearGradient(cx - cos * reach, cy - sin * reach, cx + cos * reach, cy + sin * reach);
      var a = 0.26 * vivid;
      g.addColorStop(0.00, hsl(hueA, a));
      g.addColorStop(0.34, hsl(hueA, a * 0.55));
      g.addColorStop(0.50, hsl((hueA + hueB) / 2, 0));
      g.addColorStop(0.66, hsl(hueB, a * 0.55));
      g.addColorStop(1.00, hsl(hueB, a));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  function tick() {
    var master = getMaster();
    updateLabel(master);
    var t = Date.now();
    var spec = readSpectrum();
    var bass = spec.bass, treble = spec.treble;
    if (!spec.active) {
      bass = 0.22 + 0.12 * Math.sin(t / 1600);
      treble = 0.18 + 0.1 * Math.cos(t / 2400);
    }
    applyParams(master, bass, treble, t);
    var canvas = $('ai-warp-canvas');
    if (canvas) drawColorVeil(canvas.getContext('2d'), canvas.width, canvas.height, master, bass, treble, t);
    window.__aiWarpRaf = requestAnimationFrame(tick);
  }

  function start() {
    /* resolve the feBlend operand order for this browser before painting */
    probeLumaBlendOrder(function (order) {
      CFG.LUMA_BLEND_LUMA_FROM = order;
      applyLumaBlendOrder(order);
      root.__aiWarpLumaBlendOrder = order;
    });

    /* keep the control bar out of the filtered body (a filtered ancestor
       becomes the containing block for position:fixed descendants) */
    var controlEl = $('ai-warp-opacity-control');
    if (controlEl && controlEl.parentNode === document.body) {
      document.documentElement.appendChild(controlEl);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    var slider = $('ai-warp-opacity-slider');
    if (slider) {
      slider.value = String(DEFAULT_MASTER);
      slider.addEventListener('input', function () { updateLabel(getMaster()); });
    }
    updateLabel(DEFAULT_MASTER);
    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  root.AIWarpV2 = { CFG: CFG, math: MATH, applyParams: applyParams, start: start,
                    probeLumaBlendOrder: probeLumaBlendOrder,
                    applyLumaBlendOrder: applyLumaBlendOrder };
})(typeof window !== 'undefined' ? window : globalThis);
