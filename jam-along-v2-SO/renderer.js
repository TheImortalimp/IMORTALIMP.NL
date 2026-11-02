/**
 * Oscilloscope GX — CRT renderer (ui/renderer.js)
 * ------------------------------------------------------------------
 * Shared canvas renderer used by the fullscreen scope page and the popup.
 * Consumes the quantized engine frames and paints:
 *   · phosphor persistence trail (exponential fade, like a real CRT)
 *   · per-segment trace coloured blue → green → yellow by amplitude
 *   · red/orange flash + markers reserved for hard peaks
 *   · log-spaced spectrum bars smeared into the phosphor
 *   · static graticule + HUD readouts on separate layers
 */

import { gxPalette } from './engine.js';

export const RENDER_DEFAULTS = {
  persistence: 0.82,   // trail memory: 0 = instant, 0.95 = very long afterglow
  glow: 0.7,           // bloom strength for the fresh trace
  ampScale: 1.0,       // vertical amplitude multiplier
  traceWidth: 2.2,     // core trace width in px (css units)
  showSpectrum: true,
  spectrumHeight: 0.18 // fraction of canvas height reserved for bars
};

const BG_FILL = [2, 9, 5]; // near-black phosphor green

export function createScopeRenderer({ gridCanvas = null, scopeCanvas, hudCanvas = null }, opts = {}) {
  const options = { ...RENDER_DEFAULTS, ...opts };
  const scopeCtx = scopeCanvas.getContext('2d');
  const hudCtx = hudCanvas ? hudCanvas.getContext('2d') : null;
  const gridCtx = gridCanvas ? gridCanvas.getContext('2d') : null;

  // Offscreen persistence buffer — the actual "phosphor" surface.
  const persist = document.createElement('canvas');
  const pctx = persist.getContext('2d');

  let cssW = 0, cssH = 0, dpr = 1;
  let fps = 0, lastT = performance.now(), raf = 0;

  /* ------------------------------- sizing ------------------------------ */

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    cssW = scopeCanvas.clientWidth || scopeCanvas.width;
    cssH = scopeCanvas.clientHeight || scopeCanvas.height;
    for (const c of [gridCanvas, scopeCanvas, hudCanvas, persist]) {
      if (!c) continue;
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
    }
    for (const ctx of [gridCtx, scopeCtx, hudCtx, pctx]) {
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    pctx.fillStyle = `rgb(${BG_FILL[0]},${BG_FILL[1]},${BG_FILL[2]})`;
    pctx.fillRect(0, 0, cssW, cssH);
    drawGrid();
  }

  /* ------------------------------ graticule ---------------------------- */

  function drawGrid() {
    if (!gridCtx) return;
    const g = gridCtx;
    g.clearRect(0, 0, cssW, cssH);

    // radial ambient glow
    const rad = g.createRadialGradient(cssW / 2, cssH / 2, 0, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.7);
    rad.addColorStop(0, 'rgba(18,36,18,0.55)');
    rad.addColorStop(1, 'rgba(2,8,4,0)');
    g.fillStyle = rad;
    g.fillRect(0, 0, cssW, cssH);

    const div = 10; // major divisions
    const sub = 5;  // minor subdivisions
    const stepX = cssW / div, stepY = cssH / (div * cssH / cssW); // keep cells square-ish
    const stepYv = cssH / Math.max(1, Math.round(cssH / stepX));

    g.lineWidth = 1;
    // minor grid
    g.strokeStyle = 'rgba(64,255,128,0.055)';
    g.beginPath();
    for (let x = 0; x <= cssW + 0.5; x += stepX / sub) { g.moveTo(x, 0); g.lineTo(x, cssH); }
    for (let y = 0; y <= cssH + 0.5; y += stepYv / sub) { g.moveTo(0, y); g.lineTo(cssW, y); }
    g.stroke();
    // major grid
    g.strokeStyle = 'rgba(64,255,128,0.16)';
    g.beginPath();
    for (let i = 0; i <= div; i++) { const x = i * stepX; g.moveTo(x, 0); g.lineTo(x, cssH); }
    for (let y = 0; y <= cssH + 0.5; y += stepYv) { g.moveTo(0, y); g.lineTo(cssW, y); }
    g.stroke();
    // centre cross (zero line)
    g.strokeStyle = 'rgba(96,255,160,0.35)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, cssH / 2); g.lineTo(cssW, cssH / 2);
    g.moveTo(cssW / 2, 0); g.lineTo(cssW / 2, cssH);
    g.stroke();
  }

  /* ------------------------------- render ------------------------------ */

  /** Render one engine frame. Also updates HUD. Safe to call with null. */
  function render(frame, state) {
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    lastT = now;
    fps += (1000 / dt - fps) * 0.05;

    // 1. phosphor fade
    const fade = Math.min(0.5, Math.max(0.03, 1 - options.persistence * 0.92 - 0.05));
    pctx.globalCompositeOperation = 'source-over';
    pctx.fillStyle = `rgba(${BG_FILL[0]},${BG_FILL[1]},${BG_FILL[2]},${fade})`;
    pctx.fillRect(0, 0, cssW, cssH);

    if (frame) {
      drawSpectrum(pctx, frame);
      drawTrace(pctx, frame);
      if (frame.levels && frame.levels.hardPeak) drawPeakFlash(pctx, frame);
    }

    // 2. composite persistence → visible scope canvas
    scopeCtx.clearRect(0, 0, cssW, cssH);
    scopeCtx.drawImage(persist, 0, 0, cssW, cssH);

    // 3. HUD overlay (no persistence)
    if (hudCtx) drawHud(hudCtx, frame, state);

    raf = requestAnimationFrame(() => render(pendingFrame, pendingState));
  }

  function tracePoints(frame) {
    const n = frame.wave.length;
    const ptsX = new Float32Array(n), ptsY = new Float32Array(n), ptsV = new Float32Array(n);
    const midY = options.showSpectrum ? cssH * (1 - options.spectrumHeight) * 0.5 : cssH / 2;
    const amp = midY * 0.8 * options.ampScale;
    for (let i = 0; i < n; i++) {
      const v = (frame.wave[i] - 127.5) / 127.5;             // -1..1
      ptsX[i] = (i / (n - 1)) * cssW;
      ptsY[i] = midY - v * amp;
      ptsV[i] = Math.min(1, Math.abs(v) * 1.35);              // amplitude → palette position
    }
    return { n, ptsX, ptsY, ptsV };
  }

  function drawTrace(ctx, frame) {
    const { n, ptsX, ptsY, ptsV } = tracePoints(frame);
    const pi = frame.levels ? frame.levels.peakIntensity : 0;

    // glow underlay: single cheap pass using the frame's dominant colour
    let sum = 0;
    for (let i = 0; i < n; i++) sum += ptsV[i];
    const [gr, gg, gb] = gxPalette(sum / n, pi);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${gr},${gg},${gb},${0.16 * options.glow + 0.04})`;
    ctx.lineWidth = (options.traceWidth * 3.2) || 7;
    ctx.beginPath();
    ctx.moveTo(ptsX[0], ptsY[0]);
    for (let i = 1; i < n; i++) ctx.lineTo(ptsX[i], ptsY[i]);
    ctx.stroke();

    // bright core: per-segment gradient (blue→green→yellow, hot on peaks)
    ctx.lineWidth = options.traceWidth;
    if (options.glow > 0) { ctx.shadowBlur = 10 * options.glow; }
    const step = Math.max(1, Math.floor(n / Math.max(64, cssW * 1.5)));
    for (let i = 0; i < n - step; i += step) {
      const v = (ptsV[i] + ptsV[i + step]) / 2;
      const [r, g, b] = gxPalette(v, pi);
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      if (options.glow > 0) ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
      ctx.beginPath();
      ctx.moveTo(ptsX[i], ptsY[i]);
      ctx.lineTo(ptsX[i + step], ptsY[i + step]);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // spectral smear: per-band peak caps fall slower than the bars themselves,
  // so the skyline keeps breathing for a beat after every hit
  let specPeaks = null;

  function drawSpectrum(ctx, frame) {
    if (!options.showSpectrum || !frame.spec) return;
    const pi = frame.levels ? frame.levels.peakIntensity : 0;
    const n = frame.spec.length;
    const zoneTop = cssH * (1 - options.spectrumHeight);
    const maxH = cssH * options.spectrumHeight - 6;
    const barW = cssW / n;
    if (!specPeaks || specPeaks.length !== n) specPeaks = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const v = frame.spec[i] / 255;
      specPeaks[i] = Math.max(v, specPeaks[i] * 0.962);
      if (v >= 0.015) {
        const h = v * maxH;
        const [r, g, b] = gxPalette(v, pi * 0.85);
        ctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
        ctx.fillRect(i * barW + 1, cssH - h, Math.max(1, barW - 2), h);
      }
      if (specPeaks[i] >= 0.02) {
        const ph = specPeaks[i];
        const [cr, cg, cb] = gxPalette(ph, pi * 0.6);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.16 + 0.24 * ph})`;
        ctx.fillRect(i * barW + 1, cssH - ph * maxH - 2.5, Math.max(1, barW - 2), 2);
      }
    }
    // separator line
    ctx.fillStyle = 'rgba(96,255,160,0.12)';
    ctx.fillRect(0, zoneTop - 1, cssW, 1);
  }

  function drawPeakFlash(ctx, frame) {
    const pi = frame.levels.peakIntensity;
    const grd = ctx.createRadialGradient(cssW / 2, cssH / 2, cssH * 0.2, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.7);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, `rgba(${pi > 0.7 ? '255,40,0' : '255,120,0'},${0.12 + 0.25 * pi})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, cssW, cssH);
  }

  function drawHud(ctx, frame, state) {
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.font = '11px "DejaVu Sans Mono", "Consolas", monospace';
    ctx.textBaseline = 'top';

    const st = state || (frame && { state: frame.state, source: frame.source }) || { state: 'unknown', source: 'none' };
    const live = st.state === 'live';
    const dot = live ? '#7CFC00' : st.state === 'simulated' ? '#ffd24a' : st.state === 'awaiting-gesture' ? '#ff9c3a' : '#ff5555';

    ctx.fillStyle = 'rgba(150,255,190,0.9)';
    ctx.fillText('OSCILLOSCOPE GX', 14, 12);
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(150, 17, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(180,255,210,0.75)';
    ctx.fillText(`${String(st.state).toUpperCase()} · ${String(st.source).toUpperCase()}`, 162, 12);

    // right-side scope readouts, echoing the cover art
    const lv = (frame && frame.levels) || { rms: 0, peakHold: 0, peakIntensity: 0, bass: 0, mids: 0, highs: 0 };
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(180,255,210,0.8)';
    ctx.fillText(`CH1 ${(lv.rms * 5).toFixed(2)}V RMS`, cssW - 14, 12);
    ctx.fillText(`PK ${(lv.peakHold * 5).toFixed(2)}V  ·  ${fps.toFixed(0)} FPS`, cssW - 14, 26);
    if (lv.hardPeak) {
      ctx.fillStyle = `rgba(255,${lv.peakIntensity > 0.7 ? 40 : 120},0,0.95)`;
      ctx.fillText('▲ HARD PEAK', cssW - 14, 40);
    }
    ctx.textAlign = 'left';

    // bass/mids/highs mini meters, bottom-left
    const groups = [['BASS', lv.bass], ['MIDS', lv.mids], ['HIGH', lv.highs]];
    let bx = 14;
    const by = cssH - 16;
    for (const [label, val] of groups) {
      ctx.fillStyle = 'rgba(150,255,190,0.6)';
      ctx.fillText(label, bx, by - 14);
      ctx.fillStyle = 'rgba(120,255,170,0.18)';
      ctx.fillRect(bx, by, 52, 4);
      const [r, g, b] = gxPalette(val || 0, lv.peakIntensity);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(bx, by, 52 * Math.min(1, val || 0), 4);
      bx += 66;
    }

    ctx.fillStyle = 'rgba(150,255,190,0.45)';
    ctx.textAlign = 'right';
    ctx.fillText('RIVER-LYLE-IMORTALIMP', cssW - 14, by);
    ctx.textAlign = 'left';
  }

  /* ---------------------------- public API ----------------------------- */

  let pendingFrame = null, pendingState = null;

  return {
    /** Call for every incoming engine frame/state. */
    setFrame(frame) { pendingFrame = frame; },
    setState(state) { pendingState = state; },
    setOption(key, value) {
      options[key] = value;
      if (key === 'showSpectrum') drawGrid();
    },
    getOption: (key) => options[key],
    options,
    resize,
    start() { resize(); lastT = performance.now(); raf = requestAnimationFrame(() => render(pendingFrame, pendingState)); },
    stop() { cancelAnimationFrame(raf); }
  };
}
