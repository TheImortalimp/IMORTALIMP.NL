/**
 * Overscope SO — standalone web build (jam-along-v2-SO/app.js)
 * ------------------------------------------------------------------
 * Forked from RLI·WEB 2.2.0's web/app.js, then re-voiced twice: for mood
 * and mellow, and now for AMBIENT HARMONY — chords held for bars at a time,
 * a drift line instead of a melody, and a jam-along that follows a tab's
 * PROGRESSION without competing with it.
 *
 * Eight instruments, every lane playable by mouse, every voice duellable by
 * cursor key:
 *   1 PADS   2 CHIMES   3 SYNTH   4 PAUK   5 KICK   6 SNARE   7 TOM   8 HATS
 *
 * Flow: boots into the SILENT cosine (no permissions asked). The browser
 * "decides the host" the moment the user grants one:
 *   · 🎙 Mic check      → getUserMedia        → live · mic  (monitors muted)
 *   · System mix        → getDisplayMedia      → live · display (pickup-only)
 *   · SO rig 🌙         → real WebAudio rig    → the ONE audible source
 *   · 🎧 Jam with a tab → pickup-only analysis → the rig follows its chords
 */

import { GXAudioEngine, RHYTHM_LEVELS, rhythmLayers } from './engine.js';
import { createScopeRenderer } from './renderer.js';

const engine = new GXAudioEngine({ fftSize: 2048 });

const renderer = createScopeRenderer({
  gridCanvas: document.getElementById('grid'),
  scopeCanvas: document.getElementById('scope'),
  hudCanvas: document.getElementById('hud')
}, { persistence: 0.82, glow: 0.7 });

const pill = document.getElementById('status-pill');
const note = document.getElementById('note');
const btnGroove = document.getElementById('btn-groove'); // a toggle
const RIG_NAME = 'SO ambient rig 🌙';

/* --------------------------- engine wiring --------------------------- */

engine.addEventListener('state', (e) => {
  const { state, source, detail } = e.detail;
  if (state === 'idle') pill.textContent = 'silent · idle';
  else if (state === 'simulated') {
    const flavour = engine.simStyle === 'silent' ? 'silent cosine'
      : engine.audibleSim ? `${RIG_NAME} endless composer` : 'silent cosine';
    pill.textContent = `simulated · ${flavour}`;
  } else pill.textContent = `${state} · ${source}${engine.audibleSim ? ` + rig 🌙` : ''}`;
  pill.className = `pill ${state}`;
  if (detail) pill.title = detail;
  renderer.setState({ state, source });
  // the rig button is a TOGGLE: its face always tells the truth
  btnGroove.textContent = engine.audibleSim ? '⏹ Rig off' : 'SO rig 🌙';
  btnGroove.classList.toggle('armed', engine.audibleSim);
  if (state === 'error') note.textContent = `⚠ ${detail}`;
  else if (state === 'simulated') note.textContent = detail; // says which sim you just picked
  else if (state === 'live') note.textContent = detail && detail.includes('rig')
    ? detail
    : 'Audio is read only — analysed for the scope, never played back, never sent anywhere.';
});

/* ------------------------------ frame pump --------------------------- */

function pump() {
  const frame = engine.readFrame();
  if (frame) renderer.setFrame(frame);
  updateDesk();
}
setInterval(pump, 33); // ~30 Hz

/* ---------------------- synth rig deck (D) --------------------------- */

const deskEl = document.getElementById('desk');
const deskSong = document.getElementById('desk-song');
const deskMeta = document.getElementById('desk-meta');
const deskGrid = document.getElementById('desk-grid');
const deskWires = document.getElementById('desk-wires');

const MIDI_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiOf(hz) {
  const n = Math.round(69 + 12 * Math.log2(hz / 440));
  return { n, name: `${MIDI_NAMES[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}` };
}

// the live wiring board: one chip per voice (+ its fx), glowing while it
// fires — so "what is wired and what is not" is always in view.
const CHIPS = [
  ['pads', 'PADS ·bed·chorus'],
  ['chimes', 'CHIMES ·hall+halo'],
  ['synth', 'SYNTH ·drift·echo'],
  ['pauk', 'PAUK ·low'],
  ['kick', 'KICK'],
  ['snare', 'SNARE ·brush'],
  ['tom', 'TOM ▼'],
  ['hats', 'HATS ⟷'],
  ['tabfn', 'TAB 🎧 ·off'],
  ['fx', '→ sat → warmth → SCOPE / 🔊']
];
const chipEls = {};
{
  const frag = document.createDocumentFragment();
  for (const [id, label] of CHIPS) {
    const c = document.createElement('span');
    c.className = 'chip' + (id === 'fx' ? ' fx' : '');
    c.textContent = label;
    if (id !== 'fx' && id !== 'tabfn') c.dataset.instr = id; // the wiring board is playable
    frag.appendChild(c);
    chipEls[id] = c;
  }
  deskWires.appendChild(frag);
}

/* --------------- mouse input: every lane is an instrument -------------- */

// deck row label → rig instrument id (the TAB row listens, it doesn't play)
function instrumentForCell(rowLabel) {
  switch (rowLabel) {
    case 'PADS': return 'pads';
    case 'CHIMES': return 'chimes';
    case 'SYNTH': return 'synth';
    case 'PAUK': return 'pauk';
    case 'KICK': return 'kick';
    case 'SNARE': return 'snare';
    case 'TOM': return 'tom';
    case 'HATS': return 'hats';
    default: return null;
  }
}

async function strikeInstrument(id, cell, openHat = false) {
  let solo = false;
  let labelTxt = engine.playInstrument(id, { open: openHat });
  if (labelTxt == null) {
    // rig idle → the standalone solo kit answers: EVERY lane always plays
    solo = true;
    try { labelTxt = await engine.playSoloInstrument(id, { open: openHat }); }
    catch (err) { note.textContent = `⚠ ${String((err && err.message) || err)}`; return; }
  }
  if (labelTxt == null) return;
  const chip = chipEls[id];
  if (chip) {
    chip.classList.add('live');
    setTimeout(() => chip.classList.remove('live'), 180);
  }
  if (cell) {
    cell.classList.add('now');
    setTimeout(() => cell.classList.remove('now'), 160);
  }
  deskMeta.textContent = `🖱 you${solo ? ' ·solo kit' : ''}: ${labelTxt}`;
}

deskGrid.addEventListener('click', (e) => {
  const cell = e.target.closest('.dcell');
  if (!cell) return;
  const row = cell.closest('.drow');
  const lab = row && row.querySelector('.dlabel') ? row.querySelector('.dlabel').textContent : '';
  const id = instrumentForCell(lab);
  if (id) strikeInstrument(id, cell, e.shiftKey); // Shift+click a hat = open hat
});

deskWires.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip || !chip.dataset.instr) return;
  strikeInstrument(chip.dataset.instr, null, e.shiftKey);
});

// click anywhere on the SCOPE itself: a chime onto the spectrum (Shift = kick)
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#panel, #desk, #top-bar, #touch-dock, button, input, select, textarea, a, label, .chip, .dcell')) return;
  strikeInstrument(e.shiftKey ? 'kick' : 'chimes', null, false);
});

/* --------- the step lanes — each predicate MIRRORS scheduleStep --------- */

// The bed is continuous, so its lane reads as a held note (▬) with a ◆ at
// each chord change — the visual difference between "placed" and "played".
const bedHeld = (s, i) => (s.bed[(i / 16) | 0] ? true : false);
const driftAt = (s, i) => s.drift.some((d) => d.step === i);
const driftHeld = (s, i) => s.drift.some((d) => i > d.step && i < d.step + Math.round(d.durBeats * 4));
const kitAt = (lane) => (s, i) => s.kit[lane].some((k) => k.step === i);
// The live rhythm layer (numpad 9) is generated by the engine, not written
// into the song — so the deck asks the same pure function the scheduler does,
// and the lanes always show exactly what will sound.
const layerAt = (i, voice) => rhythmLayers(engine.params.rhythm | 0, i % 16).some((e) => e.voice === voice);
const KIT_VOICE = { kick: 'kick', snare: 'snare', tom: null, hats: 'hat' };

const DECK_ROWS = [
  ['PADS', (s, i) => bedHeld(s, i),
    (s, i, b, st) => (st === 0 && s.isSpanStart(b) ? '\u25c6' + (s.chordNames[b].split('\u00b7 ')[1] || '') : '\u25ac')],
  ['CHIMES', (s, i) => s.chimePlan.some((c) => c.step === i), (s, i) => {
    const c = s.chimePlan.find((e) => e.step === i);
    return c ? midiOf(c.hz).name : '\u2727';
  }],
  ['SYNTH', (s, i) => driftAt(s, i) || driftHeld(s, i),
    (s, i) => (driftAt(s, i) ? midiOf(s.drift.find((d) => d.step === i).hz).name + '\u219d' : '\u25ac')],
  // pauk: written floor OR the layer's soft answer
  ['PAUK', (s, i) => s.pauk.some((p) => p.step === i && engine.params.pulse >= p.w) || layerAt(i, 'pauk'),
    (s, i) => {
      const p = s.pauk.find((e) => e.step === i);
      if (p) return p.vel >= 0.5 ? '\u25a0' : '\u25aa';
      return layerAt(i, 'pauk') ? '\uff0b' : '';
    }],
  ...['KICK', 'SNARE', 'TOM', 'HATS'].map((label) => {
    const lane = label.toLowerCase();
    const voice = KIT_VOICE[lane];
    return [label,
      (s, i) => (kitAt(lane)(s, i) && engine.params.pulse >= (s.kit[lane].find((k) => k.step === i) || {}).w)
        || (voice ? layerAt(i, voice) : false),
      (s, i) => {
        const k = s.kit[lane].find((e) => e.step === i);
        const gatedIn = k && engine.params.pulse >= k.w;
        if (gatedIn) return String(Math.round(k.vel * 100));
        if (voice && layerAt(i, voice)) return '\uff0b';   // a live layer event
        return '';
      }];
  })
];

let deskKey = null;      // `${songNo}:${bar}` — rebuild token for the grid
let deskCells = null;    // [row][step] cell divs for the current bar
let deskTabCells = null; // the TAB lane (learned tab's rolling energy — per frame)

function buildTabLane(frag) {
  const row = document.createElement('div');
  row.className = 'drow tabrow';
  const lab = document.createElement('span');
  lab.className = 'dlabel';
  lab.textContent = 'TAB';
  row.appendChild(lab);
  deskTabCells = [];
  for (let st = 0; st < 16; st++) {
    const c = document.createElement('span');
    c.className = 'dcell';
    c.textContent = '·';
    row.appendChild(c);
    deskTabCells.push(c);
  }
  frag.appendChild(row);
}
let deskPrevStep = -1;

function buildIdleGrid() {
  deskGrid.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const [label] of DECK_ROWS) {
    const row = document.createElement('div');
    row.className = 'drow quiet'; // ghost map: wired, currently silent
    const lab = document.createElement('span');
    lab.className = 'dlabel';
    lab.textContent = label;
    row.appendChild(lab);
    for (let st = 0; st < 16; st++) {
      const c = document.createElement('span');
      c.className = 'dcell';
      c.textContent = '·';
      row.appendChild(c);
    }
    frag.appendChild(row);
  }
  buildTabLane(frag);
  deskGrid.appendChild(frag);
  deskCells = null;
}

function deckIdle() {
  if (deskKey !== '__idle') { deskKey = '__idle'; buildIdleGrid(); }
  deskPrevStep = -1;
  if (!deskSong.textContent.startsWith('—')) {
    deskSong.textContent = '— rig idle · start “SO rig 🌙” —';
    deskMeta.textContent = 'all 8 lanes stay wired above (dashed = silent) — ▶ the composer places chords into the bed (◆ = a chord arrives, ▬ = it is being held) · 🖱 click any lane or chip to play it';
  }
  for (const id in chipEls) chipEls[id].classList.remove('live');
}

const TAB_GLYPHS = ['·', '▁', '▂', '▃', '▄', '▅', '▆', '▇'];
const pcName = (pc) => MIDI_NAMES[(pc + 9) % 12]; // engine pitch classes are A=0, MIDI_NAMES is C-based

/** The tab lane + the TAB chip: energy bars, the FOLLOWED CHORD, the progression. */
function updateTabLane() {
  const info = engine.learnInfo();
  if (deskTabCells) {
    for (let k = 0; k < 16; k++) {
      const lvl = Math.max(0, Math.min(1, info.hist[k] * 2.6));
      const c = deskTabCells[k];
      c.textContent = TAB_GLYPHS[Math.round(lvl * 7)];
      c.classList.toggle('on', lvl > 0.25);
    }
  }
  if (chipEls.tabfn) {
    chipEls.tabfn.classList.toggle('live', info.active && info.onsetFlash);
    if (!info.active) {
      chipEls.tabfn.textContent = 'TAB 🎧 ·off';
    } else {
      const bits = ['TAB 🎧'];
      bits.push(info.bpm ? `≈${info.bpm} BPM` : 'listening…');
      if (info.locked) bits.push('🔒');
      if (info.chord) bits.push(`♫ ${info.chord}`);
      else if (info.keyPc != null) bits.push(`key≈${pcName(info.keyPc)}`);
      if (info.resting) bits.push('·breathing');
      chipEls.tabfn.textContent = bits.join(' ');
    }
  }
}

function updateDesk() {
  try {
    updateTabLane(); // the TAB lane runs even while the rig is silent
    const now = engine.demoNow;
    if (!now || !engine.audibleSim) return deckIdle();
    const { song, songNo, bar, step } = now;
    const key = `${songNo}:${bar}`;
    // rebuild when the bar/song changed — OR whenever the grid is somehow
    // empty/broken. Auto-heal: lanes can never stay ghosted.
    if (key !== deskKey || !deskCells || deskGrid.childElementCount !== DECK_ROWS.length + 1) {
      deskSong.textContent = `NOW PLAYING — ${song.label}`;
      const base = bar * 16;
      const cells = [];
      const frag = document.createDocumentFragment();
      for (const [label, has, txt] of DECK_ROWS) {
        const row = document.createElement('div');
        row.className = 'drow';
        const lab = document.createElement('span');
        lab.className = 'dlabel';
        lab.textContent = label;
        row.appendChild(lab);
        const steps = [];
        let any = false; // quiet-lane flag: wired but silent this bar
        for (let st = 0; st < 16; st++) {
          const i = base + st;
          const on = has(song, i, bar, st);
          any = any || on;
          const c = document.createElement('span');
          c.className = 'dcell' + (on ? ' on' : '');
          c.textContent = on ? (txt ? txt(song, i, bar, st) : '■') : '·';
          row.appendChild(c);
          steps.push(c);
        }
        if (!any) row.classList.add('quiet');
        frag.appendChild(row);
        cells.push(steps);
      }
      buildTabLane(frag);
      deskGrid.innerHTML = '';   // swap only after the fragment is complete
      deskGrid.appendChild(frag);
      deskCells = cells;
      deskKey = key;             // success token set LAST — a failed frame retries
      deskPrevStep = -1;
    }
    if (step !== deskPrevStep) {
      // move the playhead, refresh the wiring-board glow + NowPlaying readout
      if (deskPrevStep >= 0 && deskCells) for (const row of deskCells) row[deskPrevStep].classList.remove('now');
      for (const id in chipEls) chipEls[id].classList.remove('live');
      if (deskCells) for (const row of deskCells) row[step].classList.add('now');
      deskPrevStep = step;
      const i = bar * 16 + step;
      const pulse = engine.params.pulse;
      const liveNow = {
        // the bed is continuous: its chip glows on a chord ARRIVAL
        pads: step === 0 && song.isSpanStart(bar),
        chimes: song.chimePlan.some((c) => c.step === i),
        // the drift line holds, so its chip stays lit across the long note
        synth: driftAt(song, i) || driftHeld(song, i),
        pauk: song.pauk.some((p) => p.step === i && pulse >= p.w) || layerAt(i, 'pauk'),
        kick: (song.kit.kick.some((k) => k.step === i && pulse >= k.w)) || layerAt(i, 'kick'),
        snare: (song.kit.snare.some((k) => k.step === i && pulse >= k.w)) || layerAt(i, 'snare'),
        tom: song.kit.tom.some((k) => k.step === i && pulse >= k.w),
        hats: (song.kit.hats.some((k) => k.step === i && pulse >= k.w)) || layerAt(i, 'hat'),
        fx: true
      };
      for (const id in chipEls) chipEls[id].classList.toggle('live', !!liveNow[id]);
      const sounding = song.drift.find((d) => d.step === i) || null;
      const noteTxt = sounding
        ? "\u266a drift " + midiOf(sounding.hz).name + " \u2192 " + midiOf(sounding.hz2 || sounding.hz).name +
          " \u00b7 held " + sounding.durBeats + " beats"
        : "\u266a \u2014";
      const ti = engine.learnInfo();
      let tabTxt = '';
      if (ti.active) {
        tabTxt = ' \u00b7 tab\u2248' + (ti.bpm ? ti.bpm + ' BPM' : '\u2026') + (ti.locked ? ' \ud83d\udd12 tempo+phase' : '');
        if (ti.chord) tabTxt += ' \u266b ' + ti.chord + (ti.chordConf > 0.5 ? ' \ud83d\udd12' : ' \u2248');
        if (ti.prog && ti.prog.length > 1) tabTxt += ' [' + ti.prog.slice(-4).map((x) => x.name).join(' \u2192 ') + ']';
        if (ti.resting) tabTxt += ' \u00b7 breathing';
      }
      const held = song.isSpanStart(bar)
        ? '\u2190 ' + song.chordNames[bar] + ' arrives'
        : 'held \u00b7 ' + song.chordNames[bar];
      deskMeta.textContent = 'bar ' + (bar + 1) + '/' + song.bed.length + ' \u00b7 ' + held + ' \u00b7 ' + noteTxt + tabTxt;
    }
  } catch (err) {
    deskKey = null; deskCells = null; // next frame heals the board
    // keep the last failure visible for debugging instead of swallowing it
    if (typeof window !== 'undefined' && window.__rli) window.__rli.deskError = err;
  }
}

/* -------------------- arrow keys = human MIDI input ------------------ */

async function pluckHuman(region) {
  let hz = engine.pluckFromPool(region);
  let solo = false;
  if (hz == null) {
    // the deck stays playable with the rig OFF: solo plucks draw from the
    // learned tab's harmony when jam mode is on, else the key pool.
    solo = true;
    try { hz = await engine.pluckSolo(region); }
    catch (err) { note.textContent = `⚠ ${String((err && err.message) || err)}`; return; }
  }
  if (!hz) return;
  const m = midiOf(hz);
  chipEls.synth.classList.add('live');
  setTimeout(() => chipEls.synth.classList.remove('live'), 180);
  const line = `🎹 you${solo ? ' ·solo deck' : ''}: ${m.name} = MIDI ${m.n} = ${hz.toFixed(1)} Hz`;
  if (engine.demoNow) deskMeta.textContent = line;
  else deskMeta.textContent = `${line} — cursor keys always play; ▶ “SO rig 🌙” grows the full rig around them`;
}

/* --------------------- numpad: the instrument surface ---------------- */

// 1-8 play the eight lanes in deck order. 9 opens up rhythm, one layer per tap,
// wrapping back to the ambient baseline. 0 zeroes the rhythm state and starts
// the rig again from a fresh seed.
const NUMPAD_INSTRUMENTS = {
  Numpad1: 'pads', Numpad2: 'chimes', Numpad3: 'synth', Numpad4: 'pauk',
  Numpad5: 'kick', Numpad6: 'snare', Numpad7: 'tom', Numpad8: 'hats'
};

function rhythmReadout() {
  const L = engine.params.rhythm | 0;
  const el = document.getElementById('rhythm-readout');
  if (!el) return;
  el.textContent = `RHYTHM ${L}/${RHYTHM_LEVELS}`
    + (L === 0 ? ' \u00b7 ambient baseline' : ' \u00b7 ' + rhythmWord(L));
  el.title = 'Numpad 9 adds a rhythm layer (and wraps back to the ambient baseline). '
    + 'Numpad 0 zeroes it and restarts the rig from a fresh seed.';
}

/** Plain-language description of what a level adds. */
function rhythmWord(L) {
  return ['\u2014', 'off-quarter ticks', '+ off-eighth ticks & a brush ghost',
    '+ on-beat ticks & a soft pauk answer', '+ eighth ticks & a soft kick'][L] || '';
}

/** Numpad 9: one more layer, then back to the ambient baseline. */
function stepRhythm() {
  const next = (engine.params.rhythm | 0) + 1;
  const L = engine.applyRhythm(next > RHYTHM_LEVELS ? 0 : next);
  const pulseEl = document.getElementById('pulse');
  if (pulseEl) pulseEl.value = String(engine.params.pulse);   // the gate follows the level
  deskKey = null;                                            // redraw the lanes
  rhythmReadout();
  deskMeta.textContent = L === 0
    ? '\u25cf rhythm back to the ambient baseline \u00b7 all layers off'
    : `\u25cf rhythm ${L}/${RHYTHM_LEVELS} \u00b7 ${rhythmWord(L)}`;
}

/**
 * Numpad 0: zero the rhythm state and bring the rig up again from a FRESH
 * SEED — a brand-new key, mode, chord cycle and kit, not a restart of the
 * same song. Also a way to start the rig from cold with one key.
 */
async function freshSeedStart() {
  engine.applyRhythm(0);
  const pulseEl = document.getElementById('pulse');
  if (pulseEl) pulseEl.value = String(engine.params.pulse);
  rhythmReadout();
  deskKey = null;
  await guard(async () => {
    await engine.startAudibleGroove();   // builds a new rig; the seed is drawn fresh
    btnGroove.textContent = '\u23f9 Rig off';
    btnGroove.classList.add('armed');
    note.textContent = `\u24ff fresh seed \u00b7 rhythm zeroed \u00b7 ${engine._demo.song.label}`;
  });
}

/* ------------------------------ controls ----------------------------- */

async function guard(fn) {
  try {
    await fn();
  } catch (err) {
    note.textContent = `⚠ ${String((err && err.message) || err)}`;
  }
}

document.getElementById('btn-mic').addEventListener('click', () => guard(() => engine.startMicrophone()));
document.getElementById('btn-sys').addEventListener('click', () => guard(() => engine.startDisplayCapture()));
document.getElementById('btn-silent').addEventListener('click', () => guard(() => engine.startSimulated('silent cosine', { style: 'silent' })));
// the rig button is a TOGGLE: on → the rig joins whatever is live (blend);
// off → the rig leaves, the active capture recovers instantly, no stream loss.
btnGroove.addEventListener('click', () => guard(() =>
  engine.audibleSim ? engine.stopAudibleGroove() : engine.startAudibleGroove()));
document.getElementById('btn-stop').addEventListener('click', () => guard(() => engine.stop()));

// Desktop Tab Follower
document.getElementById('btn-learn').addEventListener('click', () => guard(async () => {
  note.textContent = '🎧 pick ONE browser TAB + tick "Share tab audio" — it is only analysed, never relayed…';
  await engine.learnFromTab();
  const surface = (engine.learnInfo() || {}).surface;
  note.textContent = surface === 'monitor'
    ? '🎧 screen mix selected — for single tab accuracy, choose its browser Tab in the picker.'
    : '🎧 jam mode active — following tab key, tempo, and chord progression softly.';
}));

// Mobile / Room Microphone Now-Playing Follower
const btnLearnMic = document.getElementById('btn-learn-mic');
if (btnLearnMic) {
  btnLearnMic.addEventListener('click', () => guard(async () => {
    note.textContent = '📱 requesting microphone to listen to room / now-playing music…';
    await engine.learnFromMic();
    note.textContent = '📱 jam mode active — listening through microphone. The rig is learning now-playing chords from your room/speakers!';
  }));
}

// Device Audio File Jam Follower
const btnLearnFile = document.getElementById('btn-learn-file');
const inputFile = document.getElementById('input-audio-file');
if (btnLearnFile && inputFile) {
  btnLearnFile.addEventListener('click', () => inputFile.click());
  inputFile.addEventListener('change', () => {
    const file = inputFile.files && inputFile.files[0];
    if (file) {
      guard(async () => {
        note.textContent = `📂 loading ${file.name}…`;
        await engine.learnFromFile(file);
        note.textContent = `📂 playing & following ${file.name} — the ambient rig harmonizes with it!`;
      });
    }
  });
}

engine.addEventListener('learn', (e) => {
  if (!e.detail.active) note.textContent = '🎧 tab / now-playing learning stopped (the composer roams free again).';
});

const bind = (id, fn) => document.getElementById(id).addEventListener('input', (e) => fn(e.target));
bind('smoothing', (t) => engine.applyConfig({ smoothing: Number(t.value) }));
bind('air', (t) => engine.applyConfig({ air: Number(t.value) }));     // reverb + chorus depth
bind('pulse', (t) => engine.applyConfig({ pulse: Number(t.value) })); // percussion budget, read per step
bind('pulse', () => { deskKey = null; });                            // redraw: the lanes show what will sound
bind('volume', (t) => engine.applyConfig({ volume: Number(t.value) })); // the deck's own fader
bind('persistence', (t) => renderer.setOption('persistence', Number(t.value)));
bind('glow', (t) => renderer.setOption('glow', Number(t.value)));
bind('ampScale', (t) => renderer.setOption('ampScale', Number(t.value)));
bind('spectrum', (t) => renderer.setOption('showSpectrum', t.checked));

window.addEventListener('resize', () => renderer.resize());
// FLOW RECOVERY: returning to this tab never means re-acquiring anything —
// streams were never stopped. Just wake a suspended context and the scope
// picks the flow back up mid-stride.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && engine.ctx && engine.ctx.state === 'suspended') {
    engine.ctx.resume().catch(() => {});
  }
});
window.addEventListener('keydown', (e) => {
  // Numpad first: it is the instrument surface. Guarded on e.code so the
  // top-row number keys stay free, and on modifiers so browser shortcuts win.
  if (!e.metaKey && !e.ctrlKey && !e.altKey) {
    if (e.code === 'Numpad0') { e.preventDefault(); freshSeedStart(); return; }
    if (e.code === 'Numpad9') { e.preventDefault(); stepRhythm(); return; }
    if (e.code in NUMPAD_INSTRUMENTS) {
      e.preventDefault(); strikeInstrument(NUMPAD_INSTRUMENTS[e.code], null, e.shiftKey); return;
    }
  }
  const ARROW_REGION = { ArrowUp: 'high', ArrowDown: 'low', ArrowLeft: 'mid', ArrowRight: 'mid' };
  if (e.key in ARROW_REGION) { e.preventDefault(); pluckHuman(ARROW_REGION[e.key]); return; }
  if (e.key === 'h' || e.key === 'H') {
    document.getElementById('panel').classList.toggle('hidden');
    syncNavButtons();
  }
  if (e.key === 'd' || e.key === 'D') {
    deskEl.classList.toggle('hidden');
    syncNavButtons();
  }
  if (e.key === 'f' || e.key === 'F') {
    toggleFullScreen();
  }
});

/* ------------------------- mobile & tablet navigation ------------------------- */

const panelEl = document.getElementById('panel');
const btnTogglePanel = document.getElementById('btn-toggle-panel');
const btnToggleDesk = document.getElementById('btn-toggle-desk');
const btnToggleTouch = document.getElementById('btn-toggle-touch');
const touchDock = document.getElementById('touch-dock');
const btnClosePanel = document.getElementById('btn-close-panel');
const btnCloseDesk = document.getElementById('btn-close-desk');
const btnFs = document.getElementById('btn-fs');

function syncNavButtons() {
  if (btnTogglePanel) btnTogglePanel.classList.toggle('active', !panelEl.classList.contains('hidden'));
  if (btnToggleDesk) btnToggleDesk.classList.toggle('active', !deskEl.classList.contains('hidden'));
  if (btnToggleTouch && touchDock) btnToggleTouch.classList.toggle('active', !touchDock.classList.contains('hidden'));
}

if (btnTogglePanel) {
  btnTogglePanel.addEventListener('click', () => {
    const willShow = panelEl.classList.contains('hidden');
    panelEl.classList.toggle('hidden');
    if (willShow && window.innerWidth <= 640 && !deskEl.classList.contains('hidden')) {
      deskEl.classList.add('hidden');
    }
    syncNavButtons();
  });
}

if (btnToggleDesk) {
  btnToggleDesk.addEventListener('click', () => {
    const willShow = deskEl.classList.contains('hidden');
    deskEl.classList.toggle('hidden');
    if (willShow && window.innerWidth <= 640 && !panelEl.classList.contains('hidden')) {
      panelEl.classList.add('hidden');
    }
    syncNavButtons();
  });
}

if (btnToggleTouch && touchDock) {
  btnToggleTouch.addEventListener('click', () => {
    touchDock.classList.toggle('hidden');
    syncNavButtons();
  });
}

if (btnClosePanel) {
  btnClosePanel.addEventListener('click', () => {
    panelEl.classList.add('hidden');
    syncNavButtons();
  });
}

if (btnCloseDesk) {
  btnCloseDesk.addEventListener('click', () => {
    deskEl.classList.add('hidden');
    syncNavButtons();
  });
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}
if (btnFs) btnFs.addEventListener('click', toggleFullScreen);

/* ------------------------- quick touch jam dock ------------------------- */

const bindTap = (id, fn) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    fn();
  });
};

bindTap('dock-chime', () => strikeInstrument('chimes', null, false));
bindTap('dock-kick', () => strikeInstrument('kick', null, false));
bindTap('dock-pluck', () => pluckHuman('high'));
bindTap('dock-rhythm', () => stepRhythm());
bindTap('dock-seed', () => freshSeedStart());

/* ------------------------- public wifi & webaudio unlock ------------------------- */

const wifiBadge = document.getElementById('wifi-badge');
if (wifiBadge) {
  if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    wifiBadge.textContent = '🔒 HTTPS verified · Public WiFi safe';
    wifiBadge.className = 'wifi-badge';
  } else {
    wifiBadge.textContent = '⚠ Insecure HTTP · Tap to upgrade to HTTPS';
    wifiBadge.className = 'wifi-badge insecure';
    wifiBadge.style.cursor = 'pointer';
    wifiBadge.addEventListener('click', () => {
      location.replace('https:' + location.href.substring(location.protocol.length));
    });
  }
}

// iOS Safari / Chrome user-gesture unlock for AudioContext
function unlockAudio() {
  if (engine && engine.ctx && engine.ctx.state === 'suspended') {
    engine.ctx.resume().catch(() => {});
  }
}
document.addEventListener('touchstart', unlockAudio, { passive: true, capture: true });
document.addEventListener('touchend', unlockAudio, { passive: true, capture: true });
document.addEventListener('pointerdown', unlockAudio, { passive: true, capture: true });

/* -------------------------------- boot ------------------------------- */

engine.startSimulated('silent cosine — grant mic to go live', { style: 'silent' });
rhythmReadout();
renderer.start();

// console handle for tinkering
window.__rli = { engine, renderer };
