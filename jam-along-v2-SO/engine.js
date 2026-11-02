/**
 * Overscope SO — audio engine (v2-SO · AMBIENT revision)
 * ==================================================================
 * Forked from RLI·WEB 2.2.0 (jam-along-spectrumoscilloscope) and re-voiced
 * twice: first for mood and mellow, now for AMBIENT HARMONY.
 *
 * WHAT THIS REVISION CHANGED, AND WHY
 *   The previous revision was still a rhythmic piece wearing mellow clothes:
 *   a chord every bar, a plucked melody line, chime graces between grid
 *   steps, tom rolls into the loop point — harmony at the service of rhythm.
 *
 *   This revision inverts that. Harmony comes first and lasts:
 *     · 8-bar cycle, only 2-4 chords, each held 2-6 BARS (7-21 s at 68 BPM)
 *     · chords are PLACED into a continuous bed that crossfades over ~5 s
 *       between them — nothing retriggers, nothing has an attack
 *     · the synth is no longer a melody: it is a DRIFT line of 3-6 very long
 *       notes per cycle that glide a tone or two between chord tones
 *     · chimes mark chord arrivals and shimmer, ringing 5-9 s, and are
 *       never used as ornaments on a rhythm
 *     · the kit is a handful of soft weighted events; the live "Pulse"
 *       control thins them deterministically
 *
 * THE EIGHT INSTRUMENTS (all in key, all playable by hand)
 *   1 pads    — the chord bed: root + triad + shimmer, 2 oscillators per tone,
 *               per-voice drift LFOs, slow phaser, 2-tap chorus
 *   2 chimes  — inharmonic bell FM, index collapses in ~1 s → pure ring,
 *               behind a 4.6 kHz lowpass, into the hall AND a 9 s halo
 *   3 synth   — the drift voice: long notes that glide between chord tones
 *               under a slowly opening filter
 *   4 pauk    — timpani: low sine relaxing in pitch, 1.5× kettle partial
 *   5 kick    — 112→46 Hz sine, linear soft attack (no click at all)
 *   6 snare   — a BRUSH: dark noise swelled in over 30 ms + a tuned body
 *   7 tom     — deep, round, long tail
 *   8 hats    — a soft tick, 5600 Hz
 *
 * THE CHAIN (built for soothing, not impact):
 *   voices → bed bus ─┬─ dry ───────────────┐
 *                     └─ 2-tap chorus ──────┤→ sat (tanh) → warmth (drifting
 *   chimes/drift ──────────────────────────┤   5.2-8.8 kHz LP) → SCOPE / 🔊
 *   kit ───────────────────────────────────┘
 *                    ↘ pre-delay → 5.5 s dark hall ─┘
 *                    ↘ 9 s halo (chimes) ───────────┘
 *
 * Source-agnostic signal host, unchanged from the template. Feeds the
 * oscilloscope renderer via quantized frames: time-domain waveform +
 * log-spaced spectrum bands + envelope/peak meters.
 *
 * Sources (priority order, first available wins in 'auto' mode):
 *   tab      — chrome.tabCapture of the "now playing" audible tab.
 *   display  — getDisplayMedia (machine-wide mix with "Also share system
 *              audio"). Analysis-only: the source plays itself, so a relay
 *              would double it / feed back.
 *   mic      — getUserMedia microphone. Monitors muted (feedback guard).
 *   simulator— procedural synth signal. Always available, guarantees the
 *              scope never goes dead-even with zero permissions.
 *
 * Peak model (unchanged):
 *   fast/slow RMS envelopes → a "hard peak" fires when the fast envelope
 *   overshoots max(floor, slow * ratio). peakIntensity (0..1) tells the
 *   renderer how far to blend orange → red.
 */

export const EngineState = Object.freeze({
  IDLE: 'idle',
  ARMING: 'arming',
  LIVE: 'live',
  SIMULATED: 'simulated',
  AWAITING_GESTURE: 'awaiting-gesture',
  ERROR: 'error'
});

export const SourceKind = Object.freeze({
  NONE: 'none',
  TAB: 'tab',
  DISPLAY: 'display',
  MIC: 'mic',
  SIMULATOR: 'simulator'
});


/* ------------------------------------------------------------------ */
/* Generative composer — pure functions (node-testable, no WebAudio)    */
/* ------------------------------------------------------------------ */

/** Deterministic PRNG so one seed reproduces one whole song (32-bit). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KEY_NAMES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
const KEY_ROOTS = KEY_NAMES.map((_, i) => 110 * Math.pow(2, i / 12)); // A2 ≈110 Hz …

/** The rig's home tempo — slow. Nothing here is in a hurry. */
export const MELLOW_BPM = 68;
/** The rig never follows a tab outside this window — ambient stays ambient. */
export const JAM_BPM_MIN = 48;
export const JAM_BPM_MAX = 96;

/** Structure: eight bars per cycle, so a chord can actually be inhabited. */
export const BARS_PER_SONG = 8;
export const STEPS_PER_BAR = 16;
export const STEPS_PER_SONG = 128;

// mode: [semitones, weight] — MOODY FIRST, and the bright modes are barely
// guests any more. Aeolian/dorian at 82% is what "symphonic ambient" sounds like.
const MODES = [
  ['aeolian',    [0, 2, 3, 5, 7, 8, 10], 0.46], // the moody minor — the default character
  ['dorian',     [0, 2, 3, 5, 7, 9, 10], 0.36], // cool, hopeful-minor, melancholic lift
  ['mixolydian', [0, 2, 4, 5, 7, 9, 10], 0.11], // warm and open
  ['ionian',     [0, 2, 4, 5, 7, 9, 11], 0.07]  // rare: a sunbreak
];
/**
 * CONSONANCE — the discipline that keeps the sequencing from ever sliding
 * between major and minor colour.
 * ====================================================================
 * The rule set is deliberately tiny, because a small closed rule is one that
 * can be held true by construction and then *audited*:
 *
 *   ONE avoid set, used for both harmony and melody:
 *     INTERVAL CLASSES 1 and 6 — the semitone (a minor 2nd and a major 7th are
 *     the same class, heard from either side) and the tritone. These are the
 *     two things that make an ambient drone curdle. Every other class —
 *     unison, 2nd, 3rd, 4th, 5th, 6th, octave — stays available.
 *
 *   WHY THIS KILLS THE MAJOR/MINOR FLIP SPECIFICALLY:
 *     A major third and a minor third differ by exactly one semitone. So a
 *     line can only slide from one to the other by moving BY a semitone, or by
 *     landing A semitone from a sounding tone. `safeMove` forbids the first,
 *     `isConsonantHz` forbids the second. There is no path between them, and
 *     the tests name that specific move so it can never come back.
 *
 *   AND THE INVARIANT THAT MAKES IT AUTOMATIC:
 *     every sustained voice the composer writes is a CHORD TONE of the chord
 *     sounding at that moment. The tones of a major/minor triad are 3 or 4 and
 *     7 semitones apart — all safe — so a chord-tone-only arrangement cannot be
 *     dissonant and cannot leave the key. `songDissonances()` audits exactly
 *     that over the finished song, and the suite runs it across 400 seeds.
 */
export const SUS_AVOID = [1, 6];

/**
 * INTERVAL CLASS between two frequencies: 0-6, octave-free and genuinely
 * symmetric — pcInt(a, b) === pcInt(b, a) for every pair, which the rule set
 * depends on. A minor 2nd and a major 7th both come back as 1, because they
 * are the same class heard from either side; a tritone is 6.
 */
export function pcInt(aHz, bHz) {
  const a = Math.round(12 * Math.log2(aHz / 440));
  const b = Math.round(12 * Math.log2(bHz / 440));
  const d = Math.abs(((a - b) % 12 + 12) % 12);
  return d > 6 ? 12 - d : d;
}

/** Is `hz` free of any avoid-interval against every tone in `tones`? */
export function isConsonantHz(hz, tones) {
  if (!tones || !tones.length) return true;
  for (const t of tones) if (SUS_AVOID.indexOf(pcInt(hz, t)) >= 0) return false;
  return true;
}

/**
 * A melodic move is safe when it is not a semitone either way (the major/minor
 * flip) and not a tritone. Drift moves by a tone or two anyway, so this costs
 * the music nothing.
 */
export function safeMove(fromHz, toHz) {
  const d = Math.abs(12 * Math.log2(toHz / fromHz)) % 12;
  return SUS_AVOID.indexOf(Math.round(d)) < 0;
}

/**
 * Snap a pitch to the nearest tone consonant with `tones`: the pitch itself
 * when already safe, else the nearest safe chord tone, else the nearest safe
 * octave. Total — always returns a finite frequency.
 */
export function nearestConsonantHz(hz, tones) {
  if (!isFinite(hz)) return tones && tones.length ? tones[0] : 440;
  if (isConsonantHz(hz, tones)) return hz;
  if (tones && tones.length) {
    let best = null, bestD = Infinity;
    for (const t of tones) {
      const d = Math.abs(Math.log2(t / hz));
      if (d < bestD && isConsonantHz(t, tones)) { bestD = d; best = t; }
    }
    if (best !== null) return best;
  }
  for (const oct of [0, 1, -1, 2, -2]) {
    const c = hz * Math.pow(2, oct);
    if (isConsonantHz(c, tones)) return c;
  }
  return hz;
}

const PENT_MAJOR = [0, 2, 4, 7, 9];
const PENT_MINOR = [0, 3, 5, 7, 10];

/**
 * Compose one 8-bar ambient cycle from a seed.
 *
 * THE AMBIENT REVISION — what changed from v2-SO, and why
 * ------------------------------------------------------
 * The previous revision was still, at heart, a *rhythmic* piece: a chord per
 * bar, a plucked melody line, chime graces between grid steps, tom rolls into
 * the loop point. Every one of those puts harmony at the service of rhythm.
 *
 * This revision inverts that. Harmony comes first and lasts:
 *
 *   · HARMONIC RHYTHM — 8-bar cycle, only 2-4 chords, each held for 2-6 BARS.
 *     At 68 BPM that is 7-21 seconds per chord. There is no per-bar chord
 *     change anywhere in this file.
 *   · THE BED — every chord is voiced across three octaves (root, triad,
 *     shimmer) and handed to the engine as a CONTINUOUS drone that crossfades
 *     between chords. Chords are placed, not played. Nothing retriggers.
 *   · DRIFT — instead of a melody, a handful of very long notes (8-24 beats)
 *     that glide by a tone or two between chord tones. That is the only
 *     melodic motion in the piece, and there are 3-6 of them per cycle.
 *   · CHIMES — no longer ornaments on melody steps. They mark chord arrivals
 *     and a couple of shimmer points, and ring for 5-9 seconds.
 *   · KIT — kick/snare/hat/tom reduced to a handful of soft events, each with
 *     a WEIGHT so the live "Pulse" control can thin them out deterministically.
 *
 * Degenerate `hints` from the jam follower steer key/mode/density only, and
 * without disturbing the RNG stream, so hinted and unhinted runs are each
 * fully deterministic.
 */
export function composeSong(seed, songNo = 1, hints = {}) {
  const rnd = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  const modeWeights = hints.mode === 'bright' ? [0.16, 0.24, 0.28, 0.32]
    : hints.mode === 'dark' ? [0.56, 0.34, 0.07, 0.03] : null;
  const densityBias = typeof hints.density === 'number'
    ? Math.max(0.55, Math.min(1.15, 0.85 + hints.density * 0.3)) : 1;

  let x = rnd(), acc = 0, modeName = 'aeolian', scale = MODES[0][1];
  for (let k = 0; k < MODES.length; k++) {
    const [name, semis, w0] = MODES[k];
    acc += modeWeights ? modeWeights[k] : w0;
    if (x <= acc) { modeName = name; scale = semis; break; }
  }

  let keyIdx = Math.floor(rnd() * KEY_ROOTS.length);
  if (hints.keyPc != null && rnd() < (hints.strength ?? 0.7)) keyIdx = hints.keyPc; // adopt the tab's key
  const key = KEY_ROOTS[keyIdx];
  const st = (root, semi) => root * Math.pow(2, semi / 12);

  /**
   * Octave-fold a frequency into a band. Every register is bounded this way
   * rather than trusted to the seed: it is what keeps the low end orchestral
   * (not muddy), the bed warm, the chimes crystalline instead of corrosive,
   * and stops any two voices fighting over the same octave.
   */
  const fold = (hz, lo, hi) => { let f = hz; while (f > hi) f /= 2; while (f < lo) f *= 2; return f; };

  /* --------------------- harmonic rhythm: 2-4 chords, 8 bars ------------ */

  // 2 chords = 4 bars each (the drone end of the spectrum), 4 = 2 bars each.
  const nChords = rnd() < 0.45 ? 2 : rnd() < 0.62 ? 3 : 4;
  const spans = [];
  {
    let left = BARS_PER_SONG, n = nChords;
    while (n > 0) {
      const maxHere = left - (n - 1) * 2;          // every span is at least 2 bars
      const take = n === 1 ? left : 2 + Math.floor(rnd() * Math.max(1, maxHere - 1));
      spans.push(take); left -= take; n--;
    }
  }

  // Triad quality, computed from the mode rather than assumed, and the Roman
  // numeral DERIVED from it. The old fixed ['I','ii',...] table labelled
  // aeolian's VII as "vii°" while it was sounding a plain major triad.
  const triadOf = (d) => {
    const third = scale[(d + 2) % 7] + (d + 2 >= 7 ? 12 : 0) - scale[d];
    const fifth = scale[(d + 4) % 7] + (d + 4 >= 7 ? 12 : 0) - scale[d];
    const quality = third === 4 ? (fifth === 8 ? 'aug' : 'major')
      : fifth === 6 ? 'dim' : 'minor';
    return { third, fifth, quality };
  };
  const NUMERAL = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const romanOf = (d) => {
    const q = triadOf(d).quality, n = NUMERAL[d];
    return q === 'major' ? n : q === 'aug' ? n + '+' : q === 'dim' ? n.toLowerCase() + '°' : n.toLowerCase();
  };
  // A diminished or augmented triad contains a tritone (or an augmented fifth)
  // BY CONSTRUCTION, and the bed would hold it for 7-21 seconds. That is the
  // one thing the rules above cannot make safe, so those degrees are simply
  // never chosen: dorian's vi° and ionian's vii° are dropped.
  const WORKS = (d) => {
    const q = triadOf(d).quality;
    return q === 'major' || q === 'minor';
  };

  // degrees: tonic to open, then IV / vi / ii / V — no leading tone, and no
  // forced cadence anywhere. Ambient harmony wanders; it doesn't resolve.
  const DEG_WEIGHTS = [[1, 0.20], [3, 0.30], [4, 0.14], [5, 0.28], [6, 0.08]];
  const pickDegree = () => {
    for (let attempt = 0; attempt < 12; attempt++) {
      let r = rnd(), a = 0, d = 5;
      for (const [deg, w] of DEG_WEIGHTS) { a += w; if (r <= a) { d = deg; break; } }
      if (WORKS(d)) return d;                      // never a diminished / augmented triad
    }
    return 5;                                      // the v — minor in every mode used here
  };
  const prog = [0];
  for (let k = 1; k < nChords; k++) {
    let d = pickDegree();
    if (d === prog[k - 1]) d = WORKS((d + 3) % 7) ? (d + 3) % 7 : pickDegree();
    prog.push(d);
  }


  // Flatten the spans into per-bar lookups (8 entries).
  const chordAt = [], chordNames = [], chordRoots = [];
  {
    let bar = 0;
    spans.forEach((len, si) => {
      const d = prog[si];
      const root = fold(st(key, scale[d]), 110, 220);            // 110-220 Hz: the snare's body tone
      const q = triadOf(d).quality;
      const quality = q === 'major' ? '' : q === 'minor' ? 'm' : q === 'dim' ? '°' : '+';
      const name = `${romanOf(d)} · ${KEY_NAMES[(keyIdx + scale[d]) % 12]}${quality}`;
      for (let k = 0; k < len && bar < BARS_PER_SONG; k++, bar++) {
        chordAt[bar] = si; chordNames[bar] = name; chordRoots[bar] = root;
      }
    });
  }
  const isSpanStart = (bar) => bar === 0 || chordAt[bar] !== chordAt[bar - 1];

  /* --------------- THE BED — a drone, voiced in three octaves ----------- */

  // For each bar: the tones the drone should be holding. Root deep, triad
  // warm, one shimmer tone on top. The engine crossfades between these; it
  // never re-attacks them.
  const bed = [];
  for (let bar = 0; bar < BARS_PER_SONG; bar++) {
    const si = chordAt[bar], d = prog[si];
    const root = chordRoots[bar];
    const triad = [0, 2, 4].map((k) => {
      const idx = d + k;
      return fold(st(key * 2, scale[idx % 7] + (idx >= 7 ? 12 : 0)), 165, 440);
    });
    // the shimmer: the fifth, an octave or two above the triad
    const shimmer = fold(st(root, scale[(d + 4) % 7] + (d + 4 >= 7 ? 12 : 0) - scale[d]), 660, 1320);
    const tones = [
      { hz: fold(root, 65, 130), lvl: 0.075, layer: 'low' },
      ...triad.map((hz) => ({ hz, lvl: 0.048, layer: 'mid' })),
      { hz: shimmer, lvl: 0.020, layer: 'high' }
    ];
    bed.push({
      tones, mid: triad, low: fold(root, 65, 130), high: shimmer,
      // The signature identifies the CHORD, not the bar — so a chord held for
      // six bars is one voicing and the bed crossfades once, not six times.
      signature: `song:${si}:${chordNames[bar]}`
    });
  }

  /* -------------- DRIFT — the only melodic motion in the piece ---------- */

  // A handful of very long notes per cycle that glide a tone or two between
  // chord tones. This is the "slight melodic harmonic drift": the line does
  // not have a rhythm, it has a direction.
  const drift = [];
  {
    let last = null;
    for (let si = 0; si < nChords; si++) {
      const bar0 = spans.slice(0, si).reduce((a, b) => a + b, 0);
      const spanBars = spans[si];
      const d = prog[si];
      // The chord's OWN tones. The drift never invents a pitch — so it can
      // never slide a major third onto a minor third, and it can never leave
      // the chord that is sounding underneath it.
      const tones = [0, 2, 4].map((j) => {
        const idx = d + j;
        return fold(st(key * 2, scale[idx % 7] + (idx >= 7 ? 12 : 0)), 190, 620);
      });
      // Only positions where a long note still FITS inside this chord. A drift
      // note used to be able to ring up to 24 beats into the next chord, which
      // is how an old chord's third ends up sitting a semitone above the new
      // chord's root. Now a note always ends inside its own harmony.
      const slots = [];
      for (let b = 0; b < spanBars; b++) {
        for (const sInBar of [0, 4, 8]) {
          const beatsLeft = (spanBars - b) * 4 - sInBar / 4;
          if (beatsLeft >= 6) slots.push({ bar: bar0 + b, step: bar0 * STEPS_PER_BAR + b * STEPS_PER_BAR + sInBar, beatsLeft });
        }
      }
      if (!slots.length) continue;
      const nNotes = spanBars >= 4 ? (rnd() < 0.5 ? 1 : 2) : (rnd() < 0.6 ? 1 : 0);
      for (let k = 0; k < nNotes; k++) {
        const slot = slots[Math.floor(rnd() * slots.length)];
        const from = last ? nearestPitch(last, tones) : tones[Math.floor(rnd() * tones.length)];
        // Glide target: a chord tone that is a SAFE move away — never a
        // semitone (that is the major/minor flip) and never a tritone. The
        // nearest such tone is the "slight melodic harmonic drift"; the second
        // nearest is allowed occasionally so it is not always the same step.
        // …and SLIGHT: within a fifth of where it already is. Tones folded into
        // the 190-620 band can sit most of an octave apart, so without this cap
        // the "nearest chord tone" could be a 9-semitone lurch. If nothing safe
        // is within reach the line simply holds — which is what a drone does.
        const safe = tones
          .filter((hz) => {
            const semi = Math.abs(12 * Math.log2(hz / from));
            return semi > 0.5 && semi <= 7.5 && safeMove(from, hz);
          })
          .sort((a, b) => Math.abs(Math.log2(a / from)) - Math.abs(Math.log2(b / from)));
        const target = safe.length
          ? (rnd() < 0.3 && safe.length > 1 ? safe[1] : safe[0])
          : from;                                  // no safe neighbour: hold the tone
        const durBeats = Math.max(4, Math.min(pick([12, 16, 20, 24]), Math.floor(slot.beatsLeft) - 1));
        drift.push({
          step: slot.step, hz: nearestConsonantHz(from, tones), hz2: target,
          durBeats, vel: 0.075 + rnd() * 0.035
        });
        last = from;
      }
    }
    drift.sort((a, b) => a.step - b.step);
  }

  /* ------------- CHIMES — arrivals and shimmer, never ornaments --------- */

  const chimePlan = [];
  {
    let bar = 0;
    for (let si = 0; si < nChords; si++) {
      const d = prog[si];
      const arr = [0, 2, 4].map((j) => {
        const idx = d + j;
        return fold(st(key * 8, scale[idx % 7] + (idx >= 7 ? 12 : 0)), 900, 2600);
      });
      // THE ARRIVAL is one gesture, not a run of notes: a bell and its third,
      // eight steps apart, ringing the new chord in. That is the whole event.
      // A bell that is still ringing when the chord moves is a suspension, so
      // each chime is clipped to end inside its own span (68 BPM → 0.882 s a
      // beat). Two bars is 14.1 s, so in practice this only trims the second
      // bell on the shortest spans.
      const beatS = 60 / MELLOW_BPM;
      const left0 = spans[si] * 4 * beatS;
      const left8 = left0 - 8 * beatS;
      chimePlan.push({ step: bar * STEPS_PER_BAR, hz: arr[0], vel: 0.095, dur: Math.min(8.0, Math.max(2.0, left0 - 1.5)) });
      chimePlan.push({ step: bar * STEPS_PER_BAR + 8, hz: arr[2], vel: 0.07, dur: Math.min(6.5, Math.max(2.0, left8 - 1.5)) });
      // and then, rarely, a single shimmer far from the arrival — drift, not
      // decoration. 35% of spans, at most one.
      //
      // THE OFFSET IS RELATIVE TO THIS SPAN. It used to be a fixed 32-56 steps,
      // which is 2-3.5 bars — so on a 2-bar span the shimmer landed in the NEXT
      // chord, ringing the OLD chord's third over the new one. That is the
      // discord this revision exists to remove, and it was a plain arithmetic
      // bug: a fixed offset cannot know how long the chord lasts.
      const maxOff = spans[si] * STEPS_PER_BAR - 8;
      if (rnd() < 0.35 && maxOff >= 12) {
        const off = Math.round((0.5 + rnd() * 0.375) * maxOff / 4) * 4;   // mid-to-late, still inside
        const remainS = (spans[si] * 4 - off / 4) * (60 / MELLOW_BPM);
        chimePlan.push({
          step: bar * STEPS_PER_BAR + off,
          hz: arr[Math.floor(rnd() * arr.length)], vel: 0.04,
          dur: Math.min(pick([6.0, 8.0, 10.0]), Math.max(2.0, remainS - 1.5))
        });
      }
      bar += spans[si];
    }
    chimePlan.sort((a, b) => a.step - b.step);
  }

  /* --------------- PAUK — the low floor, a few times a cycle ------------ */

  const pauk = [];
  {
    let bar = 0;
    for (let si = 0; si < nChords; si++) {
      const root = fold(chordRoots[bar], 48, 88);
      // The chord's own fifth, from the scale — not a hard-coded perfect fifth
      // (which is a tritone away from a diminished chord's root).
      // NB: fold() can land a hair above `hi` when the band is under an octave
      // wide (48*2 > 88), so the fifth is folded into the pauk's own documented
      // 48-110 register rather than a looser one — that keeps it a timpani.
      const fifthSemis = scale[(prog[si] + 4) % 7] + (prog[si] + 4 >= 7 ? 12 : 0) - scale[prog[si]];
      const fifth = fold(root * Math.pow(2, fifthSemis / 12), 48, 110);
      pauk.push({ step: bar * STEPS_PER_BAR, hz: root, vel: 0.6, w: 0.1 });
      // one answer inside a long span, soft
      if (spans[si] >= 4 && rnd() < 0.6) {
        pauk.push({ step: bar * STEPS_PER_BAR + 32, hz: root, vel: 0.34, w: 0.4 });
        if (rnd() < 0.4) pauk.push({ step: bar * STEPS_PER_BAR + 48, hz: fifth, vel: 0.26, w: 0.62 });
      }
      const nextBar = bar + spans[si];
      if (nextBar < BARS_PER_SONG && rnd() < 0.3) {
        pauk.push({ step: nextBar * STEPS_PER_BAR - 4, hz: root, vel: 0.22, w: 0.55 });
      }
      bar = nextBar;
    }
    pauk.sort((a, b) => a.step - b.step);
  }

  /* --------------------- KIT — a handful of soft events ----------------- */
  // Each event carries a WEIGHT: the engine plays it when the live "Pulse"
  // control is at or above that weight, so the control thins the kit out
  // deterministically and the deck can draw exactly what will sound.
  const kit = { kick: [], snare: [], tom: [], hats: [] };
  {
    let bar = 0;
    for (let si = 0; si < nChords; si++) {
      const s0 = bar * STEPS_PER_BAR, len = spans[si];
      kit.kick.push({ step: s0, vel: 0.6, w: 0.10 });                      // the chord's floor
      if (rnd() < 0.4) kit.kick.push({ step: s0 + 8, vel: 0.3, w: 0.56 }); // only if Pulse is lifted
      // A soft brush marking the far side of the span — never a backbeat.
      // The first span always gets one, so a 4-chord cycle (where every span
      // is only 2 bars) can't leave the lane dark for a whole song.
      const brushAt = Math.min(STEPS_PER_SONG - 1, s0 + STEPS_PER_BAR + 8);
      if (si === 0 || (len >= 3 && rnd() < 0.8) || rnd() < 0.3) {
        kit.snare.push({ step: brushAt, vel: 0.22, w: 0.30 });
      }
      if (rnd() < 0.25) kit.snare.push({ step: s0 + 8, vel: 0.13, w: 0.74 });
      // one tick per span
      kit.hats.push({ step: Math.min(STEPS_PER_SONG - 1, s0 + (len - 1) * STEPS_PER_BAR + 8), vel: 0.18, w: 0.44 });
      bar += len;
    }
    // one deep tom per cycle, maybe — texture, not a fill
    if (rnd() < 0.4) {
      const bar = pick([2, 3, 4, 5, 6]);
      kit.tom.push({ step: bar * STEPS_PER_BAR + 12, hz: fold(chordRoots[bar], 48, 84), vel: 0.28, w: 0.70 });
    }
    for (const k of Object.keys(kit)) kit[k].sort((a, b) => a.step - b.step);
  }

  /* ------------------------ playable material --------------------------- */

  const pent = (modeName === 'ionian' || modeName === 'mixolydian') ? PENT_MAJOR : PENT_MINOR;
  const pool = [...pent, ...pent.map((p) => p + 12)];
  const chimeFold = (pIdx) => fold(st(key * 8, pool[pIdx]), 900, 2600);
  // the synth's playable register: below the chimes, above the bed's warmth
  const MEL_CEIL = 620;
  let melBase = key * 2;
  if (melBase > 300) melBase /= 2;
  let MEL_TOP = pool.length - 1;
  while (MEL_TOP > 2 && melBase * Math.pow(2, pool[MEL_TOP] / 12) > MEL_CEIL) MEL_TOP--;
  const poolHz = pool.map((p) => st(melBase, p));
  const chimeHz = pool.map((_, i) => chimeFold(i));

  const song = {
    seed, songNo, key, keyIdx, keyName: KEY_NAMES[keyIdx], modeName, scale,
    nChords, spans, prog, chordAt, chordNames, chordRoots, bed,
    drift, chimePlan, pauk, kit,
    poolHz, chimeHz, isSpanStart,
    // how each chord hand-off should feel
    bedFade: 5.0,                      // seconds of crossfade between chords
    follow: null,                      // filled by the harmony follower while locked
    label: `${KEY_NAMES[keyIdx]} ${modeName} · ${nChords} chords / ${BARS_PER_SONG} bars · ambient`
  };
  return song;
}

/* ------------------------------------------------------------------ */
/* The consonance auditor — the whole rule set, checked on a finished song */
/* ------------------------------------------------------------------ */

/**
 * Walk a composed cycle and report every dissonance in its SEQUENCING.
 *
 * This is the same rule set the composer builds with, re-derived from the
 * finished song rather than trusted from the code that made it — so it catches
 * a future edit that quietly reintroduces a bad interval. Hand-played notes are
 * not in here: this audits what the rig plays by itself.
 *
 * Returns [] for a clean song. Each entry: { where, detail, step }.
 */
export function songDissonances(song) {
  const bad = [];
  const beatSteps = 4;                       // 4 steps to a beat
  const chimeSteps = (durS) => durS / (60 / MELLOW_BPM) * beatSteps;

  // ---- every sustained voice as [startStep, endStep, hz, where] ----------
  const held = [];
  for (let bar = 0; bar < BARS_PER_SONG; bar++) {
    // the bed's drone holds the triad AND the low root and the shimmer
    for (const t of song.bed[bar].tones) {
      held.push({ from: bar * STEPS_PER_BAR, to: (bar + 1) * STEPS_PER_BAR, hz: t.hz, where: `bed@${bar}` });
    }
  }
  for (const d of song.drift) {
    held.push({ from: d.step, to: d.step + d.durBeats * beatSteps, hz: d.hz, hz2: d.hz2, where: `drift@${d.step}` });
  }
  for (const c of song.chimePlan) {
    held.push({ from: c.step, to: c.step + chimeSteps(c.dur), hz: c.hz, where: `chime@${c.step}` });
  }
  for (const p of song.pauk) held.push({ from: p.step, to: p.step + 4, hz: p.hz, where: `pauk@${p.step}` });

  // 1. HARMONY — no sustained voice may form an avoid interval with another
  //    voice that is sounding at the same time. This is the check that would
  //    catch a major third left ringing over a new minor chord.
  for (let i = 0; i < held.length; i++) {
    for (let j = i + 1; j < held.length; j++) {
      const a = held[i], b = held[j];
      if (a.from >= b.to || b.from >= a.to) continue;          // never overlap
      const ap = [a.hz, a.hz2].filter(Boolean), bp = [b.hz, b.hz2].filter(Boolean);
      let hit = null;
      for (const x of ap) for (const y of bp) {
        const iv = pcInt(x, y);
        if (SUS_AVOID.indexOf(iv) >= 0) hit = iv;
      }
      if (hit !== null) {
        bad.push({ where: `${a.where} vs ${b.where}`, detail: `${hit} semitones (pc)`, step: Math.max(a.from, b.from) });
      }
    }
  }

  // 2. MELODY — no glide may be a semitone (the major/minor flip) or tritone.
  for (const d of song.drift) {
    if (d.hz2 && !safeMove(d.hz, d.hz2)) {
      bad.push({ where: `drift@${d.step}`, detail: `glide ${d.hz.toFixed(1)}→${d.hz2.toFixed(1)} is an avoided move`, step: d.step });
    }
  }

  // 3. CHORD MEMBERSHIP — every sequenced voice is a tone of the chord
  //    sounding at its own start. This is the invariant that makes the rest
  //    automatic, so it is checked directly and by name.
  const chordTonesAt = (step) => {
    const bar = Math.max(0, Math.min(BARS_PER_SONG - 1, Math.floor(step / STEPS_PER_BAR)));
    const si = song.chordAt[bar];
    const scale = song.scale, d = song.prog[si];
    const pcs = [0, 2, 4].map((j) => (song.keyIdx + scale[(d + j) % 7] + (d + j >= 7 ? 12 : 0)) % 12);
    return pcs;
  };
  for (const d of song.drift) {
    const pcs = chordTonesAt(d.step);
    if (pcs.indexOf(pcInt(d.hz, 440 * Math.pow(2, 0 / 12))) < 0) {
      const selfPc = Math.round(12 * Math.log2(d.hz / 440));
      const pc = ((selfPc % 12) + 12) % 12;
      if (pcs.indexOf(pc) < 0) bad.push({ where: `drift@${d.step}`, detail: `pitch class ${pc} is not in the chord (${pcs.join(',')})`, step: d.step });
    }
  }

  // 4. CHORD FIT — no sustained voice may outlive the harmony it belongs to.
  //    (Chimes are clipped at compose time; this proves it.)
  for (const c of song.chimePlan) {
    const bar = Math.floor(c.step / STEPS_PER_BAR);
    const si = song.chordAt[bar];
    let endBar = bar;
    while (endBar + 1 < BARS_PER_SONG && song.chordAt[endBar + 1] === si) endBar++;
    const spanEnd = (endBar + 1) * STEPS_PER_BAR;
    if (c.step + chimeSteps(c.dur) > spanEnd + 2) {
      bad.push({ where: `chime@${c.step}`, detail: `rings ${((c.step + chimeSteps(c.dur) - spanEnd) / beatSteps).toFixed(1)} beats past its chord`, step: c.step });
    }
  }
  for (const d of song.drift) {
    const bar = Math.floor(d.step / STEPS_PER_BAR);
    const si = song.chordAt[bar];
    let endBar = bar;
    while (endBar + 1 < BARS_PER_SONG && song.chordAt[endBar + 1] === si) endBar++;
    if (d.step + d.durBeats * beatSteps > (endBar + 1) * STEPS_PER_BAR) {
      bad.push({ where: `drift@${d.step}`, detail: 'note rings past its chord change', step: d.step });
    }
  }

  // 5. NO DIMINISHED OR AUGMENTED BED — the one thing the interval rules
  //    cannot make safe, so it must never be chosen at all.
  for (let bar = 0; bar < BARS_PER_SONG; bar++) {
    const mid = song.bed[bar].mid;
    for (let i = 0; i < mid.length; i++) {
      for (let j = i + 1; j < mid.length; j++) {
        const iv = pcInt(mid[i], mid[j]);
        if (SUS_AVOID.indexOf(iv) >= 0) {
          bad.push({ where: `bed@${bar}`, detail: `triad contains a ${iv}-semitone interval`, step: bar * STEPS_PER_BAR });
        }
      }
    }
  }
  return bad;
}

/* ------------------------------------------------------------------ */
/* Jam-lock helpers — pure math (node-testable)                         */
/* ------------------------------------------------------------------ */

/**
 * Fold a learned tempo into the ambient follow window. Below the floor it
 * doubles, above the ceiling it halves — so a slow ballad is followed at its
 * own pace and a 150 BPM dance track is followed at 75, never dragged up into
 * a tempo this music has no business playing.
 */
export function jamFollowBpm(bpm) {
  if (!bpm || !isFinite(bpm) || bpm <= 0) return null;
  let b = bpm;
  while (b < JAM_BPM_MIN) b *= 2;
  while (b > JAM_BPM_MAX) b /= 2;
  return Math.max(JAM_BPM_MIN, Math.min(JAM_BPM_MAX, b));
}

/* ------------------------------------------------------------------ */
/* Rhythm layers — what numpad 9 opens up                               */
/* ------------------------------------------------------------------ */

/** How many taps of "more rhythm" the rig goes through before wrapping home. */
export const RHYTHM_LEVELS = 4;
/** The Pulse value level 0 rests at (and what numpad 0 restores). */
export const RHYTHM_BASE_PULSE = 0.45;

/**
 * The live rhythm layer for one step of a bar. Level 0 is the ambient
 * baseline and returns nothing: every note you hear is the composer's own.
 * Each level above that adds a layer of soft percussion ON TOP of whatever
 * the composer wrote — so tapping 9 opens the arrangement up rather than
 * rewriting it.
 *
 *   L1  off-quarter ticks                      (2 per bar)
 *   L2  off-eighth ticks + a brush ghost       (4 + 1 per bar)
 *   L3  on-beat ticks + a soft pauk answer     (4 + 1 + 1 per bar)
 *   L4  eighth ticks + a soft kick             (8 + 1 + 1 per bar)
 *
 * The hat branch is a single else-if chain on purpose: exactly one tick
 * decision per step, densest applicable level wins, so two layers can never
 * double-trigger the same step.
 *
 * Pure and exported so the scheduler, the deck AND the tests all read the
 * same definition of "what level N sounds like".
 */
export function rhythmLayers(level, stepInBar) {
  const L = Math.max(0, Math.min(RHYTHM_LEVELS, Math.round(level) || 0));
  const st = ((stepInBar % 16) + 16) % 16;
  const out = [];
  if (L <= 0) return out;

  // hats — one decision per step
  if (L >= 4 && st % 2 === 0) out.push({ voice: 'hat', vel: 0.06 });
  else if (L >= 3 && st % 4 === 0) out.push({ voice: 'hat', vel: 0.08 });
  else if (L >= 2 && st % 4 === 2) out.push({ voice: 'hat', vel: 0.09 });
  else if (L >= 1 && st % 8 === 4) out.push({ voice: 'hat', vel: 0.12 });

  if (L >= 2 && st === 14) out.push({ voice: 'snare', vel: 0.10 });
  if (L >= 3 && st === 12) out.push({ voice: 'pauk', vel: 0.20 });
  if (L >= 4 && st === 10) out.push({ voice: 'kick', vel: 0.26 });
  return out;
}

/** How many percussive events a level adds across one 16-step bar. */
export function rhythmLayerDensity(level) {
  let n = 0;
  for (let st = 0; st < 16; st++) n += rhythmLayers(level, st).length;
  return n;
}

/** Nearest time on the grid `origin + k*step` to time t (predictive sync). */
export function gridQuantize(t, origin, step) {
  if (!step) return t;
  return origin + Math.round((t - origin) / step) * step;
}

/** Signed distance from t to the nearest grid boundary (±step/2). */
export function gridPhase(t, origin, step) {
  if (!step) return 0;
  const d = gridQuantize(t, origin, step) - t;
  return Math.max(-step / 2, Math.min(step / 2, d));
}

/**
 * LOOSE QUANTIZE — pull a note toward the tab's grid, but never all the way
 * onto it. `looseness` 0 = exactly on the grid, 1 = leave it where it fell.
 * The ambient default (~0.75) keeps a phrase clearly *with* the tab while it
 * still sounds like it was played by a hand, a hair behind the beat.
 */
export function softQuantize(t, origin, step, looseness = 0.75) {
  const g = gridQuantize(t, origin, step);
  const L = Math.max(0, Math.min(1, looseness));
  return t + (g - t) * (1 - L);
}

/** Swing: push the off-beat 8th late by `swing` of a 16th. */
export function swingOffset(t, origin, step, swing = 0.18) {
  if (!step) return 0;
  const k = Math.round((t - origin) / step);
  return (k % 4 === 2) ? step * swing : 0;
}

/**
 * Standalone performance pool for cursor-key plucking without the rig:
 * 10 notes = 2 pentatonic octaves above the given pitch class (A=0 engine
 * convention — matches composeSong's poolHz construction, so a learned tab's
 * key produces exactly the notes that harmonize with it).
 */
export function soloPoolHz(keyPc = 3, minor = false) {
  const pent = minor ? PENT_MINOR : PENT_MAJOR;
  const root = 220 * Math.pow(2, (((keyPc % 12) + 12) % 12) / 12);
  return [...pent, ...pent.map((p) => p + 12)].map((p) => root * Math.pow(2, p / 12));
}

/* ------------------------- chord / progression math ------------------- */

/**
 * 24 chord templates (12 major + 12 minor) in the engine's pitch-class
 * convention, where 0 = A. Matching a live chromagram against these is how
 * the rig learns the tab's PROGRESSION instead of just its key.
 */
export const CHORD_TEMPLATES = (() => {
  const T = [];
  for (let pc = 0; pc < 12; pc++) {
    T.push({ pc, minor: false, name: KEY_NAMES[pc],     tones: [0, 4, 7].map((i) => (pc + i) % 12) });
    T.push({ pc, minor: true,  name: KEY_NAMES[pc] + 'm', tones: [0, 3, 7].map((i) => (pc + i) % 12) });
  }
  return T;
})();

/**
 * Best-matching triad for a chromagram. Score = mean energy on the chord
 * tones minus mean energy outside them, with a bonus when the detected bass
 * pitch-class agrees with the root (bass-led inversion detection).
 * Returns { pc, minor, name, tones, score } or null when there is nothing
 * worth naming.
 */
export function bestChord(chroma, bassPc = null) {
  let total = 0;
  for (let i = 0; i < 12; i++) total += chroma[i] || 0;
  if (total <= 1e-5) return null;
  const n = new Array(12);
  for (let i = 0; i < 12; i++) n[i] = (chroma[i] || 0) / total;

  let best = null;
  for (const t of CHORD_TEMPLATES) {
    let inSum = 0, outSum = 0;
    for (let i = 0; i < 12; i++) {
      if (t.tones.indexOf(i) >= 0) inSum += n[i]; else outSum += n[i];
    }
    let score = inSum / 3 - outSum / 9;
    if (bassPc != null && t.pc === bassPc) score += 0.18; // the bass names the root
    if (!best || score > best.score) best = { pc: t.pc, minor: t.minor, name: t.name, tones: t.tones, score };
  }
  return best;
}

/**
 * Chord tones as Hz, folded into one register band. A4-referenced (the same
 * A=0 pitch-class convention the templates and the chromagram use), octave-
 * shifted until every tone lands inside [loHz, hiHz].
 */
export function chordHz(chord, loHz = 180, hiHz = 760) {
  if (!chord) return [];
  const out = [];
  for (const pc of chord.tones) {
    let hz = 440 * Math.pow(2, pc / 12);
    while (hz < loHz) hz *= 2;
    while (hz > hiHz) hz /= 2;
    out.push(hz);
  }
  return out.sort((a, b) => a - b);
}

/**
 * VOICE LEADING — the nearest pitch in `candidates` to `from`, preferring
 * minimal movement. This is what makes the drift line move by a tone instead
 * of jumping, and what makes jam replies trace the tab's changes.
 */
export function nearestPitch(from, candidates) {
  if (!candidates || !candidates.length) return from;
  let best = candidates[0], bestD = Infinity;
  for (const hz of candidates) {
    const d = Math.abs(Math.log2(hz / from));
    if (d < bestD) { bestD = d; best = hz; }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Palette — blue → green → yellow, orange/red reserved for hard peaks */
/* ------------------------------------------------------------------ */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * Map a normalized amplitude/value to the brand palette.
 *   v 0.0 → blue (h≈225) · 0.5 → green (h≈140) · 1.0 → yellow (h≈55)
 *   peakIntensity > 0 blends toward orange (h≈30) → red (h≈0) as it rises.
 * @returns {[number, number, number]} rgb 0-255
 */
export function gxPalette(v, peakIntensity = 0) {
  const t = clamp01(v);
  const hue = t < 0.5 ? 225 + (140 - 225) * (t / 0.5) : 140 + (55 - 140) * ((t - 0.5) / 0.5);
  let [r, g, b] = hslToRgb(hue, 1.0, 0.55);

  const p = clamp01(peakIntensity);
  if (p > 0) {
    const [pr, pg, pb] = hslToRgb(30 - 30 * p, 1.0, 0.52);
    const w = 0.35 + 0.65 * p;
    r = Math.round(r + (pr - r) * w);
    g = Math.round(g + (pg - g) * w);
    b = Math.round(b + (pb - b) * w);
  }
  return [r, g, b];
}

/** CSS helper: gxPaletteCss(0.8) → "rgb(…,…,…)" */
export function gxPaletteCss(v, peakIntensity = 0) {
  const [r, g, b] = gxPalette(v, peakIntensity);
  return `rgb(${r},${g},${b})`;
}


/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

const DEFAULT_PARAMS = {
  fftSize: 2048,          // FFT window for the real path
  smoothing: 0.82,        // analyser temporal smoothing (scope "phosphor decay")
  minDb: -85,
  maxDb: -25,
  bands: 64,              // spectrum bars per frame
  waveformPoints: 512,    // waveform samples per frame (quantized 0-255)
  lowHz: 30,
  highHz: 16000,

  // envelope / peak metering
  fastAttack: 0.55, fastRelease: 0.10,
  slowAttack: 0.06, slowRelease: 0.004,
  hardPeakRatio: 1.9,     // fast > slow * ratio → hard peak
  hardPeakFloor: 0.45,    // …but never below this absolute floor

  autoSimulate: true,     // drop to simulator when a source ends unexpectedly

  // --- the live character controls ---------------------------------------
  air: 0.7,               // 0 = dry and close, 1 = deep hall + wide chorus
  pulse: 0.45,            // percussion budget: kit events carry a weight, and
                          // only those at or below this level are played
  volume: 1.0,            // the deck's own output fader (numpad 0 restores it)
  rhythm: 0               // 0 = ambient baseline; numpad 9 steps it up to
                          // RHYTHM_LEVELS, layering soft percussion on top
};

const SIM_SAMPLE_RATE = 48000; // virtual rate for the synthesized path

export class GXAudioEngine extends EventTarget {
  constructor(params = {}) {
    super();
    this.params = { ...DEFAULT_PARAMS, ...params };

    this.state = EngineState.IDLE;
    this.source = SourceKind.NONE;
    this.detail = 'engine constructed';

    // WebAudio graph (created lazily)
    this.ctx = null;
    this.analyser = null;
    this.monitorGain = null;
    this.srcNode = null;
    this.stream = null;

    // Analysis buffers
    this._time = null;        // Float32Array(fftSize)
    this._freq = null;        // Float32Array(frequencyBinCount)
    this._bandBins = null;    // [[binLo, binHi], …] for the real path
    this._bandCenters = null; // geometric band center freqs (sim + renderer)

    // Meters
    this._m = { envFast: 0, envSlow: 0, peakHold: 0, hardPeak: false, peakIntensity: 0, rms: 0, peak: 0 };

    // Simulator clock
    this._simStart = 0;
    this._simStyle = 'groove'; // 'groove' (120 BPM synth) | 'silent' (calm cosine)
    this._demo = null;         // { timer, master } of the audible rig, when playing
    this._audibleSim = false;  // true → read the rig via the analyser, not _simFill
    this._learn = null;        // sidecar learn-a-tab analysis channel
    this._learnHints = {};     // composer hints distilled from the learned tab
    this._kit = null;          // shared solo bus, built lazily
    // human-readable name this rig answers to in status lines
    this.label = 'SO ambient rig 🌙';
    // jam clock: the learned tab's beat grid. locked → the rig tempo-FOLLOWS
    // bpm (bounded to the ambient window) and LEANS its step grid toward the
    // tab's beats; the phrase budget keeps the replies breathing.
    this._jam = null;
    // harmonic follower: the tab's chord, how sure we are, and the rolling
    // progression we have heard — the thing this revision jams along TO.
    this._follow = null;
    this._resetFollow();
  }

  /* ------------------------------- config ------------------------------ */

  applyConfig(p = {}) {
    Object.assign(this.params, p);
    this._buildBands();
    if (this.analyser) this._applyAnalyserParams();
    this._applyLiveParams();
  }

  /**
   * The deck's own output level, with a mild taper so the fader feels
   * musical rather than linear: 0.5 on the slider is about -12 dB, not -6.
   */
  _deckVolume() {
    const v = Math.max(0, Math.min(1, this.params.volume));
    return v * v;
  }

  /**
   * Numpad 9's control. Each tap adds a rhythm layer on top of the ambient
   * baseline AND lifts the Pulse gate, so more of the composer's own written
   * percussion comes through as well. Level 0 is the ambient default and is
   * what numpad 0 restores. Returns the level actually set.
   */
  applyRhythm(level) {
    const L = Math.max(0, Math.min(RHYTHM_LEVELS, Math.round(level) || 0));
    this.params.rhythm = L;
    this.params.pulse = L === 0
      ? RHYTHM_BASE_PULSE
      : Math.min(0.95, RHYTHM_BASE_PULSE + L * 0.125);
    this._applyLiveParams();
    return L;
  }

  /**
   * Push the live controls into the running graph. Air scales the two reverb
   * levels, the chorus blend and the master lowpass. Deck volume scales the
   * whole instrument surface. Pulse and Rhythm are read per step by the
   * scheduler, so they need no graph change.
   *
   * The analyser tap sits UPSTREAM of the deck fader — the same way capture
   * sources are analysed before monitorGain — so turning the desk down never
   * stops the scope from drawing what is being performed.
   */
  _applyLiveParams() {
    if (!this.ctx) return;
    const air = Math.max(0, Math.min(1, this.params.air));
    if (this.deckGain) {
      try { this.deckGain.gain.value = this._deckVolume(); } catch (_) { /* noop */ }
    }
    if (this._demo && this._demo.fx) {
      const fx = this._demo.fx;
      try {
        fx.hall.out.gain.value = 0.10 + air * 0.34;
        fx.halo.out.gain.value = 0.06 + air * 0.26;
        fx.chorusWet.gain.value = 0.25 + air * 0.35;
        fx.warm.frequency.value = 5200 + air * 3600;
      } catch (_) { /* a torn-down rig raced us; harmless */ }
    }
    if (this._kit && this._kit.tone) {
      this._kit.tone.frequency.value = 3000 + air * 2200;
    }
  }

  _buildBands() {
    const { bands, lowHz, highHz } = this.params;
    this._bandCenters = new Float64Array(bands);
    for (let i = 0; i < bands; i++) {
      // geometric spacing: centers sit between log-scaled edges
      const e0 = lowHz * Math.pow(highHz / lowHz, i / bands);
      const e1 = lowHz * Math.pow(highHz / lowHz, (i + 1) / bands);
      this._bandCenters[i] = Math.sqrt(e0 * e1);
    }
    if (this.analyser && this.ctx) this._mapBandsToBins();
  }

  _mapBandsToBins() {
    const { bands } = this.params;
    const perHz = this.analyser.fftSize / this.ctx.sampleRate;
    this._bandBins = [];
    for (let i = 0; i < bands; i++) {
      const e0 = this.params.lowHz * Math.pow(this.params.highHz / this.params.lowHz, i / bands);
      const e1 = this.params.lowHz * Math.pow(this.params.highHz / this.params.lowHz, (i + 1) / bands);
      const lo = Math.max(0, Math.floor(e0 * perHz));
      const hi = Math.min(this.analyser.frequencyBinCount - 1, Math.max(lo, Math.ceil(e1 * perHz) - 1));
      this._bandBins.push([lo, hi]);
    }
  }

  /* ---------------------------- state events --------------------------- */

  setState(state, source, detail = '') {
    // detail matters too: re-selecting a simulator style keeps state+source
    // identical, and without it in the check the UI never hears the click.
    const changed = state !== this.state || source !== this.source || detail !== this.detail;
    this.state = state;
    this.source = source;
    this.detail = detail;
    if (changed) {
      this.dispatchEvent(new CustomEvent('state', { detail: { state, source, detail, ts: Date.now() } }));
    }
  }


  /** Active simulator flavour: 'silent' | 'groove'. */
  get simStyle() {
    return this._simStyle;
  }

  /** True while the audible WebAudio rig performs the groove. */
  get audibleSim() {
    return this._audibleSim;
  }

  /**
   * The eight instruments, in deck order. Three of them are now ambient
   * textures rather than rhythmic voices:
   *   pads   — the continuous chord bed (root + triad + shimmer), crossfaded
   *   chimes — long bells that ring arrivals and shimmer
   *   synth  — the DRIFT line: very long notes that glide between chord tones
   */
  static get INSTRUMENTS() {
    return ['pads', 'chimes', 'synth', 'pauk', 'kick', 'snare', 'tom', 'hats'];
  }

  /**
   * Human performance: one long drift note from the current chord, drawn from
   * the same material the composer uses (arrow keys in the web UI).
   * region: 'low' | 'mid' | 'high'. `at` schedules it onto a future time.
   */
  pluckFromPool(region = 'mid', at = null, vel = 0.09) {
    if (!this._demo || !this.ctx) return null;
    const { live } = this._demo;
    const song = live.song;
    const bar = this.demoNow ? this.demoNow.bar : 0;
    const tones = (song.bed && song.bed[bar]) ? song.bed[bar].mid : song.poolHz.slice(0, 3);
    const src = region === 'high' ? song.chimeHz : region === 'low' ? song.poolHz.slice(0, 4) : tones;
    const hz = src[Math.floor(Math.random() * src.length)];
    // a hand-played note gets the same slow attack as the composer's drift
    live.drift(at == null ? this.ctx.currentTime + 0.02 : at, { hz, hz2: hz, durBeats: 8, vel });
    return hz;
  }

  /**
   * The pool a solo pluck draws from: the live song's material when the rig is
   * up, else the learned tab's key, else C major as an honest fallback.
   */
  _soloPool() {
    if (this._demo) return this._demo.live.song.poolHz;
    const h = this._learnHints || {};
    return soloPoolHz(h.keyPc != null ? h.keyPc : 3, h.mode === 'dark');
  }

  /**
   * The note material a solo (rig-off) performance draws from — harmony when
   * the follower has a chord, the key pool otherwise. Shared by the mouse kit
   * AND the cursor keys.
   */
  _soloMaterial() {
    const pool = this._soloPool();
    const f = this._follow;
    if (f && f.chord && f.conf > 0.3) {
      const ch = chordHz(f.chord, pool[0], pool[0] * 2);
      if (ch.length) return { chord: ch, pool };
    }
    return { chord: null, pool };
  }

  /**
   * The shared solo output: one bus carrying every human-played voice —
   * 100% our own synthesis (captured audio is never relayed), routed to the
   * speakers AND the analyser so clicks land visibly on the scope. Here it is
   * deliberately dark and wide: a gentle lowpass plus a soft-clipping stage,
   * so even a fast hand stays soothing.
   */
  _soloKit() {
    if (!this._kit) {
      const ctx = this.ctx;
      const bus = ctx.createGain();
      bus.gain.value = 0.6; // headroom for rapid-fire clicking
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass'; tone.frequency.value = 4200; tone.Q.value = 0.3;
      const clip = this._softClip(1.2);
      bus.connect(tone); tone.connect(clip);
      clip.connect(this.deckGain);   // → the same deck fader the rig speaks through
      clip.connect(this.analyser);   // …and the scope, upstream of the fader
      this._kit = { bus, tone, clip };
    }
    return this._kit;
  }

  /** A gentle tanh saturation stage: rounds transients instead of clipping them. */
  _softClip(drive = 1.5) {
    const ctx = this.ctx;
    const ws = ctx.createWaveShaper();
    const n = 1024, curve = new Float32Array(n), k = Math.tanh(drive);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * drive) / k;
    }
    ws.curve = curve;
    if (ws.oversample !== undefined) ws.oversample = '4x';
    return ws;
  }

  /** A small shared lowpass is how "mellow" is enforced on every solo voice. */
  _warmth(t, hz = 3600) {
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(hz, t); f.Q.value = 0.4;
    return f;
  }

  /**
   * Cursor-key performance WITHOUT the demo rig: a long, slow drift note.
   * Synthesized here only — captured tab/mic audio stays pickup-only and is
   * never relayed; this voice is 100% our own synth, routed to the speakers
   * directly AND to the analyser so the scope measures it like any signal.
   */
  async pluckSolo(region = 'mid') {
    this._ensureGraph();
    if (this.ctx.state === 'suspended') await this.ctx.resume(); // keydown/click = gesture
    const ctx = this.ctx, { bus } = this._soloKit();
    const { pool, chord } = this._soloMaterial();
    const src = (chord && chord.length) ? chord : pool;
    const i = region === 'high' ? src.length - 1 : region === 'low' ? 0 : Math.floor(src.length / 2);
    const hz = src[Math.max(0, Math.min(src.length - 1, i))];
    const t = ctx.currentTime + 0.02, dur = 3.2;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    const g2 = ctx.createGain(), lp = this._warmth(t, 2400), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(hz, t);
    o2.type = 'sine'; o2.frequency.setValueAtTime(hz * 1.005, t); // a slow beating partner
    g2.gain.value = 0.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.9);   // a long, unhurried arrival
    g.gain.setValueAtTime(0.11, t + dur * 0.6);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.4);
    // slow vibrato — the note breathes while it holds
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.17; lg.gain.value = 5;
    lfo.connect(lg); lg.connect(o.detune);
    lfo.start(t); lfo.stop(t + dur + 1.5);
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(bus);
    o.start(t); o2.start(t); o.stop(t + dur + 1.5); o2.stop(t + dur + 1.5);
    return hz;
  }

  /**
   * THE MOUSE JAM: the standalone solo kit — every lane plays even with the
   * rig OFF, voiced the same slow way the rig is (long attacks, long tails,
   * soft edges).
   */
  async playSoloInstrument(id, opts = {}) {
    this._ensureGraph();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    const ctx = this.ctx, { bus } = this._soloKit();
    const t = ctx.currentTime + 0.02;
    const { pool, chord } = this._soloMaterial();
    switch (id) {
      /* ---- 1 · PADS — a light chord, held a long time ---- */
      case 'pads': {
        const notes = (chord && chord.length) ? chord : [pool[0], pool[2], pool[4]];
        notes.forEach((hz, k) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass'; lp.frequency.setValueAtTime(820, t); lp.Q.value = 0.3;
          o.type = 'triangle'; o.frequency.value = hz;
          o.detune.value = Math.random() * 8 - 4;
          const tt = t + k * 0.16;                       // a slow strum, one breath per voice
          g.gain.setValueAtTime(0.0001, tt);
          g.gain.linearRampToValueAtTime(0.06, tt + 1.4);   // long, light attack
          g.gain.setValueAtTime(0.06, tt + 4.0);
          g.gain.linearRampToValueAtTime(0.0001, tt + 6.5);
          o.connect(lp); lp.connect(g); g.connect(bus);
          o.start(tt); o.stop(tt + 6.6);
        });
        return 'PADS · light chord, held';
      }
      /* ---- 2 · CHIMES — long, distant, never corrosive ---- */
      case 'chimes': {
        const hz = (chord && chord.length ? chord[0] : pool[4]) * 3;
        const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain();
        const lp = this._warmth(t, 4200), g = ctx.createGain();
        c.type = 'sine'; c.frequency.setValueAtTime(hz, t);
        m.type = 'sine'; m.frequency.setValueAtTime(hz * 2.76, t);   // inharmonic bell ratio
        mg.gain.setValueAtTime(hz * 0.85, t);
        mg.gain.exponentialRampToValueAtTime(hz * 0.01, t + 1.1);    // index collapses → pure ring
        m.connect(mg); mg.connect(c.frequency);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.085, t + 0.02);             // a soft mallet, not a spike
        g.gain.linearRampToValueAtTime(0.0001, t + 6.0);             // and then it just rings away
        c.connect(lp); lp.connect(g); g.connect(bus);
        c.start(t); m.start(t); c.stop(t + 6.1); m.stop(t + 6.1);
        return 'CHIMES · long crystal';
      }
      /* ---- 3 · SYNTH — the drift voice: a long note that glides ---- */
      case 'synth': {
        const mid = (chord && chord.length) ? chord[Math.floor(chord.length / 2)]
          : pool[Math.floor(pool.length / 2)];
        const target = (chord && chord.length > 1)
          ? chord[(chord.indexOf(mid) + 1) % chord.length] : mid * Math.pow(2, 2 / 12);
        const o = ctx.createOscillator(), o2 = ctx.createOscillator();
        const g2 = ctx.createGain(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        lp.type = 'lowpass'; lp.Q.value = 0.8;
        lp.frequency.setValueAtTime(520, t);
        lp.frequency.linearRampToValueAtTime(1650, t + 3.2);          // a very slow opening
        lp.frequency.linearRampToValueAtTime(700, t + 6.0);
        o.type = 'triangle';
        o.frequency.setValueAtTime(mid, t);                            // …and the pitch drifts
        o.frequency.linearRampToValueAtTime(target, t + 4.5);
        o2.type = 'sine'; o2.frequency.setValueAtTime(mid * 1.004, t);
        o2.frequency.linearRampToValueAtTime(target * 1.004, t + 4.5);
        g2.gain.value = 0.42;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.10, t + 1.6);
        g.gain.setValueAtTime(0.10, t + 4.2);
        g.gain.linearRampToValueAtTime(0.0001, t + 7.5);
        o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(bus);
        o.start(t); o2.start(t); o.stop(t + 7.6); o2.stop(t + 7.6);
        return 'SYNTH · drifting line';
      }
      /* ---- 4 · PAUK — timpani, soft mallet ---- */
      case 'pauk': {
        const hz = Math.max(46, Math.min(96, (chord && chord.length ? chord[0] : pool[0]) / 3));
        const o = ctx.createOscillator(), g = ctx.createGain();
        const o5 = ctx.createOscillator(), g5 = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(hz * 1.02, t);
        o.frequency.linearRampToValueAtTime(hz * 0.95, t + 1.2);      // the skin relaxing
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.5, t + 0.02);
        g.gain.linearRampToValueAtTime(0.0001, t + 2.2);
        o5.type = 'sine'; o5.frequency.setValueAtTime(hz * 1.5, t);
        g5.gain.setValueAtTime(0.12, t);
        g5.gain.linearRampToValueAtTime(0.0001, t + 0.8);
        o5.connect(g5); g5.connect(bus);
        o.connect(g); g.connect(bus);
        o.start(t); o5.start(t); o.stop(t + 2.3); o5.stop(t + 2.3);
        return 'PAUK · low floor';
      }
      /* ---- 5 · KICK — a soft pulse, felt more than heard ---- */
      case 'kick': {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(112, t);
        o.frequency.exponentialRampToValueAtTime(46, t + 0.18);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.5, t + 0.012);               // no click at all
        g.gain.linearRampToValueAtTime(0.0001, t + 0.5);
        o.connect(g); g.connect(bus);
        o.start(t); o.stop(t + 0.52);
        return 'KICK';
      }
      /* ---- 6 · SNARE — a brush, not a crack ---- */
      case 'snare': {
        const { noiseBuf } = this._soloKit();
        const s = ctx.createBufferSource();
        s.buffer = noiseBuf; s.loop = true; s.start(t); s.stop(t + 0.5);
        const f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = 'bandpass'; f.frequency.value = 950; f.Q.value = 0.5;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.16, t + 0.03);               // soft swell
        g.gain.linearRampToValueAtTime(0.0001, t + 0.5);
        s.connect(f); f.connect(g); g.connect(bus);
        return 'SNARE · brush';
      }
      /* ---- 7 · TOM — deep and slow ---- */
      case 'tom': {
        const hz = (chord && chord.length) ? chord[0] / 2 : pool[1];
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(Math.max(60, Math.min(150, hz)), t);
        o.frequency.linearRampToValueAtTime(Math.max(48, Math.min(120, hz)) * 0.72, t + 0.5);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.02);
        g.gain.linearRampToValueAtTime(0.0001, t + 1.3);              // a long, round tail
        o.connect(g); g.connect(bus);
        o.start(t); o.stop(t + 1.35);
        return 'TOM ▼';
      }
      /* ---- 8 · HATS — a soft tick ---- */
      case 'hats': {
        const { noiseBuf } = this._soloKit();
        const open = !!opts.open;
        const s = ctx.createBufferSource();
        s.buffer = noiseBuf; s.loop = true; s.start(t); s.stop(t + (open ? 0.7 : 0.16));
        const f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = 'highpass'; f.frequency.value = 5600;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(open ? 0.075 : 0.05, t + 0.004);
        g.gain.linearRampToValueAtTime(0.0001, t + (open ? 0.7 : 0.16));
        s.connect(f); f.connect(g); g.connect(bus);
        return open ? 'open hat' : 'hat';
      }
      default:
        return null;
    }
  }

  /**
   * Mouse input on the deck: play ANY rig voice instantly, voiced from the
   * CURRENT chord (or, while jam-locked, from the tab's chord).
   * Returns a short label for the UI, or null when the rig isn't running.
   */
  playInstrument(id, opts = {}) {
    if (!this._demo || !this.ctx) return null;
    const L = this._demo.live, v = L.voices, song = L.song;
    const bar = Math.max(0, Math.min(BARS_PER_SONG - 1, (this.demoNow || { bar: 0 }).bar));
    const t = this.ctx.currentTime + 0.02;
    const voicing = this._barVoicing(song, bar);
    switch (id) {
      case 'pads': v.padOneShot(t, voicing, 6.0); return `PADS · ${this._barChordName(song, bar)}`;
      case 'chimes': {
        const pool = song.chimeHz;
        v.chime(t, pool[Math.floor(pool.length * 0.5)], 0.075, 7.0); return 'CHIMES · long crystal';
      }
      case 'synth': return this.pluckFromPool('mid') ? 'SYNTH · drifting line' : null;
      case 'pauk': v.pauk(t, song.chordRoots[bar] / 2, 0.7); return `PAUK · ${this._barChordName(song, bar)} root`;
      case 'kick': v.kick(t, 0.9); return 'KICK';
      case 'snare': v.snare(t, 0.8, song.chordRoots[bar]); return `SNARE · tuned to ${this._barChordName(song, bar)}`;
      case 'tom': v.tom(t, song.chordRoots[bar] / 1.7, 0.7); return 'TOM ▼';
      case 'hats': v.hat(t, !!opts.open, 0.9); return opts.open ? 'open hat' : 'hat';
      default: return null;
    }
  }

  /**
   * The voicing the pads should hold in this bar: the composer's own triad,
   * unless the harmony follower has locked onto the tab — then it is the
   * TAB's chord, so the bed is literally holding the progression it hears.
   */
  _barVoicing(song, bar) {
    const f = this._follow;
    if (f && f.chord) {
      const ch = chordHz(f.chord, song.bed[bar].mid[0] / 1.5, song.bed[bar].mid[0] * 1.5);
      if (ch.length) return ch;
    }
    return song.bed[bar].mid;
  }

  /** Display name for a bar's harmony — the tab's chord while following, else the composer's. */
  _barChordName(song, bar) {
    const f = this._follow;
    if (f && f.chord) return `tab ${f.chord.name}${f.conf > 0.5 ? ' 🔒' : ' ≈'}`;
    return song.chordNames[bar];
  }

  /**
   * Live rig position for UI decks: { song, songNo, bar, step, stepIdx } of
   * the step AUDIBLE right now (the scheduler runs slightly ahead of time).
   * null unless the rig is playing. bar is 0-7.
   */
  get demoNow() {
    if (!this._demo || !this.ctx) return null;
    const L = this._demo.live;
    const ahead = Math.max(0, Math.ceil((L.nextTime - this.ctx.currentTime) / L.stepDur));
    const now = Math.max(0, L.absStep - ahead);
    const i = now % STEPS_PER_SONG;
    return { song: L.song, songNo: L.songNo, bar: (i / STEPS_PER_BAR) | 0, step: i % STEPS_PER_BAR, stepIdx: i };
  }

  /* --------------------------- WebAudio graph -------------------------- */


  _ensureGraph() {
    if (this.ctx) return;
    const AC = self.AudioContext || self.webkitAudioContext;
    this.ctx = new AC({ latencyHint: 'interactive' });
    this.analyser = this.ctx.createAnalyser();
    this.monitorGain = this.ctx.createGain();
    // analyser → monitor → speakers: captured audio stays audible to the user.
    this.analyser.connect(this.monitorGain);
    this.monitorGain.connect(this.ctx.destination);
    // the demo rig gets its OWN speaker path, independent of monitorGain:
    // captured sources stay pickup-only (monitor 0) while the rig can play
    // ALONGSIDE them — that is what makes blending and instant, lossless
    // source recovery possible.
    this.rigOut = this.ctx.createGain();
    this.rigOut.gain.value = 1;
    // THE DECK FADER. The rig and the standalone solo kit both speak through
    // this, so one slider owns the whole instrument surface. The analyser tap
    // stays upstream of it (see _buildDemoRig / _soloKit), so the scope keeps
    // drawing the performance even at zero volume.
    this.deckGain = this.ctx.createGain();
    this.deckGain.gain.value = this._deckVolume();
    this.rigOut.connect(this.deckGain);
    this.deckGain.connect(this.ctx.destination);
    this._applyAnalyserParams();
  }

  _applyAnalyserParams() {
    const a = this.analyser, p = this.params;
    a.fftSize = p.fftSize;
    a.smoothingTimeConstant = p.smoothing;
    a.minDecibels = p.minDb;
    a.maxDecibels = p.maxDb;
    this._time = new Float32Array(a.fftSize);
    this._freq = new Float32Array(a.frequencyBinCount);
    this._mapBandsToBins();
  }

  /** Capture-only teardown — the rig (if playing) is deliberately left alive. */
  _disconnectCapture() {
    try { this.srcNode && this.srcNode.disconnect(); } catch (_) { /* already gone */ }
    this.srcNode = null;
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        try { track.stop(); } catch (_) { /* noop */ }
      }
      this.stream = null;
    }
  }

  /** Rig-only teardown — any live capture keeps flowing (lossless recovery). */
  _disconnectRig() {
    if (this._demo) {
      clearInterval(this._demo.timer);
      try { this._demo.master.disconnect(); } catch (_) { /* noop */ }
      // …and the rig's whole tail. `master.disconnect()` alone would leave the
      // sat→warm→analyser/rigOut chain attached to the live graph, so every
      // restart (numpad 0 is a restart) would stack another silent one on top.
      try { this._demo.tail && this._demo.tail.disconnect(); } catch (_) { /* noop */ }
      for (const n of this._demo.stopNodes || []) { try { n.stop(); } catch (_) { /* noop */ } }
      this._demo = null;
    }
    this._audibleSim = false;
  }

  /** Full teardown: rig AND capture. */
  _disconnectSource() {
    this._disconnectRig();
    this._disconnectCapture();
  }

  async _attachStream(stream, kind, monitorLevel, detail) {
    this._ensureGraph();
    await this.ctx.resume();
    this._disconnectCapture(); // swap the CAPTURE only — a playing rig survives source switches
    this.stream = stream;
    this.srcNode = this.ctx.createMediaStreamSource(stream);
    this.srcNode.connect(this.analyser); // analyser reads capture + rig: the scope shows the true blend
    this.monitorGain.gain.setTargetAtTime(monitorLevel, this.ctx.currentTime, 0.05);
    const track = stream.getAudioTracks()[0];
    if (track) track.addEventListener('ended', () => this._onStreamEnded(kind));
    this.setState(EngineState.LIVE, kind,
      this._audibleSim ? `${detail} + demo groove 🔊 blended on the scope` : detail);
  }

  _onStreamEnded(kind) {
    if (kind !== this.source) return;
    this._disconnectCapture();
    if (this._audibleSim && this._demo) {
      // the stream ended mid-blend: the rig carries the flow onward — the
      // scope never goes dark, and nothing had to be re-acquired.
      this.setState(EngineState.SIMULATED, SourceKind.SIMULATOR,
        `${kind} capture ended — the groove keeps the flow alive 🔊`);
    } else if (this.params.autoSimulate) {
      this.startSimulated(`${kind} source ended; simulator meanwhile`);
    } else {
      this.setState(EngineState.IDLE, SourceKind.NONE, `${kind} source ended`);
    }
  }

  /* ------------------------------ sources ------------------------------ */

  /** Attach to a captured "now playing" tab. streamId comes from chrome.tabCapture.getMediaStreamId(). */
  async startTabCapture(streamId) {
    this.setState(EngineState.ARMING, SourceKind.TAB, 'opening captured tab stream');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
      video: false
    });
    await this._attachStream(stream, SourceKind.TAB, 1.0, 'tab audio captured (monitor passthrough on)');
  }

  /**
   * Whole-machine / per-tab mix via display capture. Fails without a user-gesture consent.
   *
   * PICKUP-ONLY: attaches at relay 0. The signal feeds the analyser (scope +
   * spectrum math) and goes nowhere else — no playback, no network. The source
   * (music tab / OS speaker mix) keeps playing itself; this page only listens.
   */
  async startDisplayCapture() {
    this.setState(EngineState.ARMING, SourceKind.DISPLAY, 'requesting display/system audio consent');
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
      throw new Error('System mix (getDisplayMedia) is not available on mobile/tablet browsers. Use "🎙 Mic check" to visualize room audio!');
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        // Chromium requires a video track: pin it tiny/1 fps rather than
        // stopping it — ending the video track can end the whole capture
        // (system/tab audio included) on some builds.
        video: { frameRate: { max: 1 }, width: { max: 64 }, height: { max: 64 } },
        audio: {
          echoCancellation: false, noiseSuppression: false, autoGainControl: false,
          suppressLocalAudioPlayback: false,
          systemAudio: 'include'
        },
        selfBrowserSurface: 'include',
        surfaceSwitching: 'exclude',
        systemAudio: 'include',
        monitorTypeSurfaces: 'include'
      });
    } catch (err) {
      // older engines choking on capture-behaviour keys → plain request
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        });
      } catch (err2) {
        throw new Error((err2 && err2.message) || (err && err.message) || 'Screen/tab audio capture cancelled.');
      }
    }
    const [videoTrack] = stream.getVideoTracks();
    if (videoTrack) videoTrack.enabled = false; // keep the session alive at ~zero cost
    if (!stream.getAudioTracks().length) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error('No audio shared — in the picker tick "Also share system audio" (Entire Screen) or "Share tab audio" (a tab)');
    }
    const surface = videoTrack && videoTrack.getSettings && videoTrack.getSettings().displaySurface;
    const what = surface === 'monitor' ? 'system mix · full speaker feed'
      : surface === 'browser' ? 'browser tab audio'
      : surface === 'window' ? 'window audio' : 'display audio';
    await this._attachStream(stream, SourceKind.DISPLAY, 0.0, `${what} — pickup only, analysed locally, nothing played back`);
  }

  /** Microphone line-in. Monitor muted to prevent feedback howl. Mobile and public WiFi friendly. */
  async startMicrophone() {
    this.setState(EngineState.ARMING, SourceKind.MIC, 'requesting microphone');
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        location.replace('https:' + location.href.substring(location.protocol.length));
        return;
      }
      throw new Error('Microphone access requires HTTPS or is unsupported by this browser.');
    }
    let stream;
    try {
      // Primary attempt: high-fidelity raw audio for analysis
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false
      });
    } catch (err) {
      // Mobile / iOS Safari fallback: some devices reject disabling processing
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
      } catch (fallbackErr) {
        throw new Error((fallbackErr && fallbackErr.message) || (err && err.message) || 'Microphone permission denied.');
      }
    }
    await this._attachStream(stream, SourceKind.MIC, 0.0, 'microphone captured (monitor muted)');
  }

  /** Procedural signal — always available, keeps the wallpaper alive. */
  async startSimulated(detail = 'procedural signal', opts = {}) {
    this._disconnectSource();
    // Buffers normally come from the WebAudio graph; build them for the
    // synth path so readFrame() works without any capture permission.
    if (!this._time || this._time.length !== this.params.fftSize) {
      this._time = new Float32Array(this.params.fftSize);
    }
    if (!this._bandCenters) this._buildBands();
    this._simStyle = opts.style === 'silent' ? 'silent' : 'groove';
    this._simStart = performance.now();
    this.setState(EngineState.SIMULATED, SourceKind.SIMULATOR, detail);
  }

  /**
   * The demo groove performed by the ENDLESS COMPOSER: every 16 bars (~32 s)
   * a brand-new song is generated — key, mode, chord progression, bass style,
   * melody motif and drum feel all re-rolled harmonized (see composeSong).
   * Real WebAudio instruments (FM bass & lead, pads, noise-kit drums) perform
   * through the analyser, so the scope reads the true audio you hear and the
   * loop-end crash red-flash is a measured peak. The only audible source.
   * Needs a user gesture (autoplay policy) — call it from the button click.
   */
  async startAudibleGroove() {
    this._ensureGraph();
    await this.ctx.resume(); // the button click satisfies the autoplay policy
    // BLEND MODE: any live capture STAYS attached — the scope overlaps the
    // two signals in one flow, the tab keeps playing itself untouched, and
    // monitorGain never moves (pickup-only holds). The rig speaks via rigOut.
    this._disconnectRig(); // replace any previous rig, nothing else
    this._audibleSim = true;
    this._simStyle = 'groove';
    this._simStart = performance.now();
    this._demo = this._buildDemoRig();
    if (this.stream) {
      this.setState(EngineState.LIVE, this.source,
        `${this.label} blended over ${this.source} — scope reads the overlap, capture stays pickup-only`);
    } else {
      this.setState(EngineState.SIMULATED, SourceKind.SIMULATOR,
        `${this.label} — ${this._demo.song.label}`);
    }
  }

  /**
   * Toggle partner of startAudibleGroove: tear down ONLY the rig. A live
   * capture keeps streaming — the scope recovers its active selection in
   * mid-flow, without stream loss; otherwise the silent cosine keeps the
   * phosphor moving.
   */
  async stopAudibleGroove(detail = '') {
    if (!this._demo && !this._audibleSim) return;
    this._disconnectRig();
    if (this.stream) {
      this.setState(EngineState.LIVE, this.source,
        detail || `${this.source} capture recovered — rig off, the flow never dropped`);
    } else {
      await this.startSimulated(detail || 'rig off — silent cosine keeps the scope flowing', { style: 'silent' });
    }
  }


  /**
   * While the harmony follower is locked, the BED is holding the TAB's chord —
   * so a note written against the composer's chord can be a semitone away from
   * the one actually sounding. Every pitched voice the rig plays by itself goes
   * through here, which is what makes the invariant
   *
   *     every sequenced voice is a tone of the chord sounding at that instant
   *
   * hold in jam-along mode too, and not only in the composer's own songs.
   * Identity when nothing is locked, so solo behaviour is unchanged.
   */
  _voiced(song, bar, hz) {
    const f = this._follow;
    if (!f || !f.chord) return hz;
    const v = this._barVoicing(song, Math.max(0, Math.min(BARS_PER_SONG - 1, bar)));
    return v && v.length ? nearestConsonantHz(hz, v) : hz;
  }

  /**
   * A drift note under jam-lock: the glide's start AND target re-voiced against
   * the tab's chord, refused if the move would be a semitone (the major/minor
   * flip), and clipped to at most 8 beats so the note cannot outlive the chord
   * it was checked against — a tab chord is usually a bar or more, so 8 beats
   * is about one chord's worth of drift. Returns the note untouched, by
   * reference, when nothing is locked.
   */
  _followDrift(song, bar, d) {
    const f = this._follow;
    if (!f || !f.chord) return d;
    const hz = this._voiced(song, bar, d.hz);
    let hz2 = this._voiced(song, bar, d.hz2);
    if (!safeMove(hz, hz2)) hz2 = hz;
    return { hz, hz2, durBeats: Math.min(d.durBeats, 8), vel: d.vel };
  }

  /**
   * Build the generative WebAudio rig — the AMBIENT revision.
   *
   * Eight instruments, but only four of them are rhythmic any more:
   *   1 pads   2 chimes   3 synth(drift)   4 pauk   5 kick   6 snare   7 tom   8 hats
   *
   * The signal path is built for soothing rather than impact:
   *
   *   voices → bed bus ─┬─ dry ──────────────┐
   *                     └─ 2-tap chorus ─────┤
   *   chimes/drift ─────────────────────────┤→ sat (tanh) → warmth (drifting
   *   kit ──────────────────────────────────┘   5.2-8.8 kHz LP) → scope / 🔊
   *                    ↘ pre-delay → hall (5.5 s, dark) ─┘
   *                    ↘ halo (9 s, darker, chimes only) ┘
   *
   * Returns { timer, master, song, live, fx, stopNodes }.
   */
  _buildDemoRig() {
    const ctx = this.ctx;
    const P = this.params;

    /* ------------------------- master chain ------------------------- */
    // A gentle tanh saturation rounds every transient before it reaches the
    // speakers — this is the single biggest reason the rig sounds soothing
    // rather than "digital". Then one slow-drifting lowpass across the whole
    // rack, so nothing is ever brightly static.
    const master = ctx.createGain();
    master.gain.value = 0.30;        // headroom: the bed is continuous, so peaks add up

    const sat = this._softClip(1.35);
    const warm = ctx.createBiquadFilter();
    warm.type = 'lowpass'; warm.Q.value = 0.25;
    warm.frequency.value = 5200 + P.air * 3600;

    master.connect(sat); sat.connect(warm);
    warm.connect(this.analyser);     // the scope measures the rig (blended with any capture)
    warm.connect(this.rigOut);       // …and speaks on its own path — pickup-only capture is untouched

    const lfoNodes = [];
    const warmLfo = ctx.createOscillator(); warmLfo.frequency.value = 0.021; // ~48 s breath
    const warmDepth = ctx.createGain(); warmDepth.gain.value = 900;
    warmLfo.connect(warmDepth); warmDepth.connect(warm.frequency);
    warmLfo.start(); lfoNodes.push(warmLfo);

    /* --------------------------- reverb rack ------------------------- */
    // A long, dark hall with a pre-delay — the room the music sits in. Fed
    // through a highpass so the tail never turns into mud.
    const makeHall = (seconds, decay, damp, level) => {
      const pre = ctx.createDelay(0.5); pre.delayTime.value = 0.045;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 150;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = damp; lp.Q.value = 0.3;
      const conv = ctx.createConvolver();
      conv.buffer = (() => {
        const len = Math.floor(ctx.sampleRate * seconds);
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const d = buf.getChannelData(ch);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
        return buf;
      })();
      const out = ctx.createGain(); out.gain.value = level;
      const input = ctx.createGain();
      input.connect(pre); pre.connect(hp); hp.connect(lp); lp.connect(conv);
      conv.connect(out); out.connect(sat);
      return { input, out };
    };
    const hall = makeHall(5.5, 1.9, 2600, 0.10 + P.air * 0.34);
    const halo = makeHall(9.0, 1.5, 1800, 0.06 + P.air * 0.26);
    // route a voice into a reverb input (defaults to the main hall).
    // NB: an arrow function has no `arguments`, so the destination is an
    // explicit third parameter rather than a sniff at the arg list.
    const send = (node, amount, dest = null) => {
      if (!amount) return;
      const g = ctx.createGain(); g.gain.value = amount;
      node.connect(g); g.connect((dest || hall).input);
    };

    /* ---------------------- the bed bus (pads) ----------------------- */
    // Chords are HELD here, not played: the bed is one continuous stream of
    // oscillators that crossfades between chords. 3 allpass stages sweep
    // slowly underneath (a phaser that takes ~9 s to breathe), and two chorus
    // taps spread the result wide.
    const bedBus = ctx.createGain(); bedBus.gain.value = 1;
    const bedMix = ctx.createGain(); bedMix.gain.value = 1; bedMix.connect(master);

    const phLfo = ctx.createOscillator(); phLfo.frequency.value = 0.055; // ~18 s inhale/exhale
    const phDepth = ctx.createGain(); phDepth.gain.value = 420;
    phLfo.connect(phDepth); lfoNodes.push(phLfo);
    let phNode = bedBus;
    for (let k = 0; k < 3; k++) {
      const ap = ctx.createBiquadFilter();
      ap.type = 'allpass'; ap.frequency.value = 320 + k * 190; ap.Q.value = 0.4;
      phDepth.connect(ap.frequency);
      phNode.connect(ap); phNode = ap;
    }
    const phWet = ctx.createGain(); phWet.gain.value = 0.34;
    phNode.connect(phWet); phWet.connect(bedMix);

    // chorus: two delay taps swept by one slow LFO, panned apart
    const chorusLfo = ctx.createOscillator(); chorusLfo.frequency.value = 0.083;
    const chorusDepth = ctx.createGain(); chorusDepth.gain.value = 0.0035;
    chorusLfo.connect(chorusDepth); lfoNodes.push(chorusLfo);
    const chorusWet = ctx.createGain(); chorusWet.gain.value = 0.25 + P.air * 0.35;
    bedBus.connect(bedMix);                                   // dry
    [[0.017, -0.55], [0.027, 0.55]].forEach(([dly, pan]) => {
      const d = ctx.createDelay(0.2); d.delayTime.value = dly;
      chorusDepth.connect(d.delayTime);
      const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      bedBus.connect(d);
      if (p) { p.pan.value = pan; d.connect(p); p.connect(chorusWet); }
      else d.connect(chorusWet);
    });
    chorusWet.connect(bedMix);

    // the bed breathes: a very slow amplitude swell under everything
    const breath = ctx.createOscillator(); breath.frequency.value = 0.037;
    const breathDepth = ctx.createGain(); breathDepth.gain.value = 0.12;
    breath.connect(breathDepth); breathDepth.connect(bedBus.gain);
    breath.start(); lfoNodes.push(breath);

    send(bedBus, 0.5);

    // a soft duck under the kick — a nudge, not EDM glue
    const pump = (t) => {
      bedBus.gain.cancelScheduledValues(t);
      bedBus.gain.setTargetAtTime(0.86, t, 0.06);
      bedBus.gain.setTargetAtTime(1.0, t + 0.3, 0.25);
    };

    const bpm = MELLOW_BPM, spb = 60 / bpm;   // 68 BPM at home — nothing is in a hurry
    let curSpb = spb;

    // dotted-quarter echo for the drift voice — dark and barely there
    const dIn = ctx.createGain(); dIn.gain.value = 0.55;
    const dly = ctx.createDelay(3.0); dly.delayTime.value = spb * 0.75;
    const dFilter = ctx.createBiquadFilter(); dFilter.type = 'lowpass'; dFilter.frequency.value = 1300;
    const dFb = ctx.createGain(); dFb.gain.value = 0.3;
    const dOut = ctx.createGain(); dOut.gain.value = 0.2;
    dIn.connect(dly); dly.connect(dFilter); dFilter.connect(dFb); dFb.connect(dly);
    dFilter.connect(dOut); dOut.connect(master);

    // humanization: micro-timing jitter, larger than the template's because
    // nothing here is trying to lock to a grid
    const subtle = (amt = 0.02) => (Math.random() * 2 - 1) * amt;

    /* ----------------------------- the bed ---------------------------- */
    let bedGroup = null;
    const bedStopAll = () => {
      if (bedGroup) {
        for (const n of bedGroup.oscs) { try { n.stop(); } catch (_) { /* already stopped */ } }
        bedGroup = null;
      }
    };

    /**
     * Hand the bed a new chord. This is the ONLY way a chord is placed: no
     * attack, no retrigger — the old voicing fades out under the new one over
     * ~5 seconds, so the harmony slides rather than changes.
     */
    const revoiceBed = (voicing, at, fade) => {
      if (!voicing) return;
      if (bedGroup && bedGroup.sig === voicing.signature) return;
      const prev = bedGroup;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(1, at + fade);
      g.connect(bedBus);
      const oscs = [];
      for (const tn of voicing.tones) {
        // each tone is a pair: a triangle body and a sine a few cents sharp,
        // so the chord shimmers against itself
        for (const [type, mult, lvl] of [['triangle', 1, 1], ['sine', 1.006, 0.42]]) {
          const o = ctx.createOscillator(), vg = ctx.createGain();
          o.type = type; o.frequency.value = tn.hz * mult;
          vg.gain.value = tn.lvl * lvl;
          const lfo = ctx.createOscillator(), lg = ctx.createGain();
          lfo.frequency.value = 0.025 + Math.random() * 0.075;   // every voice drifts on its own clock
          lg.gain.value = 3.5 + Math.random() * 5.5;             // ±4-9 cents
          lfo.connect(lg); lg.connect(o.detune);
          lfo.start(at); oscs.push(lfo);
          o.connect(vg); vg.connect(g);
          o.start(at); oscs.push(o);
        }
      }
      bedGroup = { sig: voicing.signature, g, oscs };
      if (prev) {
        const pf = Math.max(1.5, fade * 0.9);
        try { prev.g.gain.cancelScheduledValues(at); } catch (_) { /* noop */ }
        prev.g.gain.setValueAtTime(1, at);
        prev.g.gain.linearRampToValueAtTime(0.0001, at + pf);
        const dying = prev.oscs;
        setTimeout(() => { for (const n of dying) { try { n.stop(); } catch (_) { /* noop */ } } }, (pf + 0.5) * 1000);
      }
      return bedGroup;
    };

    /** Build an engine-side voicing from the tab's chord, for jam following. */
    const tabVoicing = (chord) => {
      const mid = chordHz(chord, 180, 440);
      if (!mid.length) return null;
      const root = chordHz(chord, 65, 130)[0] || mid[0] / 2;
      const high = chordHz(chord, 660, 1320)[0] || mid[0] * 2;
      return {
        tones: [
          { hz: root, lvl: 0.075 }, { hz: mid[0], lvl: 0.048 },
          { hz: mid[1], lvl: 0.048 }, { hz: mid[2], lvl: 0.048 },
          { hz: high, lvl: 0.020 }
        ],
        mid, low: root, high,
        signature: `tab:${chord.name}`
      };
    };

    /** The voicing this bar should be holding — the tab's chord wins when we know it. */
    const bedVoicingFor = (song, bar) => {
      const f = this._follow;
      if (f && f.chord && f.conf > 0.35) {
        const v = tabVoicing(f.chord);
        if (v) return v;
      }
      return song.bed[bar];
    };

    /** A hand-played pad hit: the same chord, but as a one-shot with a long attack. */
    const padOneShot = (t, freqs, dur = 6) => {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.3;
      lp.connect(bedBus);
      freqs.forEach((fq, k) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = fq;
        o.detune.value = Math.random() * 8 - 4;
        const tt = t + k * 0.18;                       // a slow strum, one breath per voice
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.linearRampToValueAtTime(0.055, tt + 1.2);
        g.gain.setValueAtTime(0.055, tt + dur * 0.7);
        g.gain.linearRampToValueAtTime(0.0001, tt + dur);
        o.connect(g); g.connect(lp);
        o.start(tt); o.stop(tt + dur + 0.05);
      });
    };

    /* ------------------------- 2 · CHIMES ------------------------- */
    // Crystal, never corrosive: inharmonic bell FM whose index collapses in
    // about a second, leaving a pure sine ringing for 5-9 s in the hall and
    // the halo. Soft mallet attack, no spike anywhere.
    const chime = (t, hz, vel = 0.08, dur = 6) => {
      const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain();
      const lp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 4600; lp.Q.value = 0.25;
      c.type = 'sine'; c.frequency.setValueAtTime(hz, t);
      m.type = 'sine'; m.frequency.setValueAtTime(hz * 2.76, t);
      mg.gain.setValueAtTime(hz * 0.8, t);
      mg.gain.exponentialRampToValueAtTime(Math.max(0.5, hz * 0.008), t + 1.1);
      m.connect(mg); mg.connect(c.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.022);      // a mallet, not a click
      g.gain.linearRampToValueAtTime(0.0001, t + dur);     // then it simply rings away
      c.connect(lp); lp.connect(g);
      g.connect(master); send(g, 0.6); send(g, 0.5, halo);
      c.start(t); m.start(t); c.stop(t + dur + 0.1); m.stop(t + dur + 0.1);
    };

    /* -------------------------- 3 · SYNTH ------------------------- */
    // The drift voice. One long note that GLIDES to a neighbouring chord
    // tone while a slow filter opens and closes over it. This is the only
    // melodic motion in the piece — a direction, not a rhythm.
    const drift = (t, note) => {
      const d = typeof note === 'number' ? { hz: note, hz2: note, durBeats: 8, vel: 0.09 } : note;
      const dur = Math.max(1.6, d.durBeats * curSpb);
      const o = ctx.createOscillator(), o2 = ctx.createOscillator();
      const g2 = ctx.createGain(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = 'lowpass'; lp.Q.value = 0.7;
      const cut = 400 + Math.random() * 300;
      lp.frequency.setValueAtTime(cut, t);
      lp.frequency.linearRampToValueAtTime(cut * 2.7, t + dur * 0.45);   // a very slow opening
      lp.frequency.linearRampToValueAtTime(cut * 1.1, t + dur);
      o.type = 'triangle';
      o.frequency.setValueAtTime(d.hz, t);
      o.frequency.linearRampToValueAtTime(d.hz2 || d.hz, t + dur * 0.8); // THE drift
      o2.type = 'sine'; o2.frequency.setValueAtTime(d.hz * 1.005, t);
      o2.frequency.linearRampToValueAtTime((d.hz2 || d.hz) * 1.005, t + dur * 0.8);
      g2.gain.value = 0.4;
      const atk = Math.min(2.4, dur * 0.35);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(d.vel, t + atk);
      g.gain.setValueAtTime(d.vel, t + dur * 0.7);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 2.0);
      o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
      g.connect(master); g.connect(dIn); send(g, 0.55);
      o.start(t); o2.start(t); o.stop(t + dur + 2.1); o2.stop(t + dur + 2.1);
      return d.hz;
    };

    /* --------------------------- 4 · PAUK ------------------------- */
    // Timpani: a low sine that relaxes in pitch as the skin settles, the 1.5×
    // kettle partial, and a felt-mallet thump. Soft attack, long tail.
    const pauk = (t, hz, vel = 1) => {
      const f = Math.max(44, Math.min(110, hz));
      const o = ctx.createOscillator(), g = ctx.createGain();
      const o5 = ctx.createOscillator(), g5 = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f * 1.02, t);
      o.frequency.linearRampToValueAtTime(f * 0.95, t + 1.1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5 * vel, t + 0.018);            // no click
      g.gain.linearRampToValueAtTime(0.0001, t + 2.0 + vel * 0.6);
      o5.type = 'sine'; o5.frequency.setValueAtTime(f * 1.5, t);
      g5.gain.setValueAtTime(0.12 * vel, t);
      g5.gain.linearRampToValueAtTime(0.0001, t + 0.8);
      o5.connect(g5); g5.connect(master);
      o.connect(g); g.connect(master); send(g, 0.4);
      o.start(t); o5.start(t); o.stop(t + 2.7); o5.stop(t + 2.7);
    };

    /* --------------------------- 5 · KICK ------------------------- */
    const kick = (t, vel = 1) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(112, t);
      o.frequency.exponentialRampToValueAtTime(46, t + 0.18);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5 * vel, t + 0.012);            // a push, not a punch
      g.gain.linearRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.52);
    };

    /* --------------------------- 6 · SNARE ------------------------ */
    // A brush: dark band noise that swells in over 30 ms, plus a body tone
    // tuned to the chord root. Nothing here snaps.
    const snare = (t, vel = 1, bodyHz = 180) => {
      const len = Math.floor(ctx.sampleRate * 0.5);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = buf;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.3;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 950; f.Q.value = 0.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16 * vel, t + 0.03);            // a swell, not a hit
      g.gain.linearRampToValueAtTime(0.0001, t + 0.5);
      s.connect(f); f.connect(lp); lp.connect(g); g.connect(master); send(g, 0.3);
      s.start(t); s.stop(t + 0.55);
      const o = ctx.createOscillator(), g2 = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(Math.max(70, Math.min(240, bodyHz)), t);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.linearRampToValueAtTime(0.09 * vel, t + 0.02);
      g2.gain.linearRampToValueAtTime(0.0001, t + 0.4);
      o.connect(g2); g2.connect(master);
      o.start(t); o.stop(t + 0.42);
    };

    /* -------------------------- 7 · TOM ------------------------- */
    const tom = (t, hz, vel = 1) => {
      const f = Math.max(55, Math.min(160, hz));
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.linearRampToValueAtTime(f * 0.74, t + 0.5);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.24 * vel, t + 0.02);
      g.gain.linearRampToValueAtTime(0.0001, t + 1.3);                 // a long, round tail
      o.connect(g); g.connect(master); send(g, 0.35);
      o.start(t); o.stop(t + 1.35);
    };

    /* ------------------------- 8 · HATS ------------------------- */
    let hatSide = 1;
    const hat = (t, open = false, vel = 1) => {
      const len = Math.floor(ctx.sampleRate * 0.7);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5600;
      const g = ctx.createGain();
      const lvl = open ? 0.075 : 0.05;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(lvl * vel * (0.9 + Math.random() * 0.2), t + 0.004);
      g.gain.linearRampToValueAtTime(0.0001, t + (open ? 0.7 : 0.16));
      s.connect(f);
      if (ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        hatSide = -hatSide;
        p.pan.value = 0.3 * hatSide * (0.75 + Math.random() * 0.5);
        f.connect(p); p.connect(g);
      } else f.connect(g);
      g.connect(master);
      s.start(t); s.stop(t + (open ? 0.75 : 0.2));
    };

    /* --------------------- the composer wheel --------------------- */

    const SONG_STEPS = STEPS_PER_SONG * 3;   // three 8-bar cycles, then a new key
    let songNo = 1;
    let song = composeSong((Math.random() * 2 ** 31) | 0, songNo, this._learnHints || {});
    let absStep = 0;
    let nextTime = ctx.currentTime + 0.15;
    const live = { song, songNo, absStep, nextTime, stepDur: spb / 4 };
    live.drift = drift;                        // human performance input
    live.revoiceBed = revoiceBed;
    live.voices = { padOneShot, chime, drift, pauk, kick, snare, tom, hat };

    const scheduleStep = (pos, t) => {
      const i = pos % STEPS_PER_SONG;
      const bar = (i / STEPS_PER_BAR) | 0, stInBar = i % STEPS_PER_BAR;


      const pulse = this.params.pulse;         // live: how much percussion is allowed
      const hits = (arr) => arr.filter((e) => e.step === i);

      // THE BED — placed at bar lines, and only if the harmony actually
      // changed. No attack, no retrigger: a crossfade.
      if (stInBar === 0) {
        const f = this._follow;
        const fading = (f && f.conf > 0.35) ? song.bedFade * 0.8 : song.bedFade;
        revoiceBed(bedVoicingFor(song, bar), t, fading);
      }

      // kit — every event carries a weight, so the Pulse control thins the
      // kit deterministically and the deck draws exactly what will sound
      for (const k of hits(song.kit.kick)) if (pulse >= k.w) { kick(t + subtle(0.012), k.vel); pump(t); }
      for (const k of hits(song.kit.snare)) if (pulse >= k.w) snare(t + subtle(0.016), k.vel, this._voiced(song, bar, song.chordRoots[bar]));
      for (const k of hits(song.kit.hats)) if (pulse >= k.w) hat(t + subtle(0.014), false, k.vel);
      for (const k of hits(song.kit.tom)) if (pulse >= k.w) tom(t + subtle(0.02), k.hz || song.chordRoots[bar] / 1.7, k.vel);

      // the pauk floor
      for (const p of hits(song.pauk)) if (pulse >= p.w) pauk(t + subtle(0.014), this._voiced(song, bar, p.hz), p.vel);

      // RHYTHM LAYERS — what numpad 9 opens up. Level 0 adds nothing at all
      // (the ambient baseline); each tap layers soft, in-key percussion on top
      // of whatever the composer wrote, and lifts the Pulse gate so more of
      // its own events come through too.
      const lvl = this.params.rhythm | 0;
      if (lvl > 0) {
        for (const ev of rhythmLayers(lvl, stInBar)) {
          if (ev.voice === 'hat') hat(t + subtle(0.01), false, ev.vel);
          else if (ev.voice === 'snare') snare(t + subtle(0.012), ev.vel, this._voiced(song, bar, song.chordRoots[bar]));
          else if (ev.voice === 'pauk') pauk(t + subtle(0.012), this._voiced(song, bar, song.chordRoots[bar] / 2), ev.vel);
          else if (ev.voice === 'kick') kick(t + subtle(0.01), ev.vel);
        }
      }

      // drift + chimes are HARMONY, not pulse: the Pulse control never mutes them
      for (const d of hits(song.drift)) drift(t + subtle(0.05), this._followDrift(song, bar, d));
      for (const c of hits(song.chimePlan)) chime(t + subtle(0.03), this._voiced(song, bar, c.hz), c.vel, c.dur);
    };

    // classic lookahead scheduler: wake often, schedule slightly ahead.
    // The jam lock leans the grid toward the tab's beats — but gently: the
    // nudges are small, deadbanded, and capped, because this music should
    // sit BEHIND a tab, not snap onto it.
    const timer = setInterval(() => {
      const J = this._jam;
      const jamOn = !!(J && J.locked && J.bpm);
      const targetSpb = jamOn ? 60 / J.bpm : spb;
      curSpb += (targetSpb - curSpb) * (jamOn ? 0.05 : 0.03);   // lean in slowly, drift home slowly
      if (live.phaseNudge) {
        nextTime = Math.max(ctx.currentTime + 0.01, nextTime + live.phaseNudge);
        live.phaseNudge = 0;
      }
      while (nextTime < ctx.currentTime + 0.25) {                // deeper lookahead: long fades need it
        const pos = absStep % SONG_STEPS;
        if (pos === 0 && absStep > 0) {
          songNo++;
          song = composeSong((Math.random() * 2 ** 31) | 0, songNo, this._learnHints || {});
          live.song = song;
          live.songNo = songNo;
          if (this.stream) {
            this.setState(EngineState.LIVE, this.source,
              `${this.label} blended over ${this.source} — ${song.label}`);
          } else {
            this.setState(EngineState.SIMULATED, SourceKind.SIMULATOR,
              `${this.label} — ${song.label}`);
          }
        }
        scheduleStep(pos, nextTime);
        nextTime += curSpb / 4;
        absStep++;
      }
      live.absStep = absStep;
      live.nextTime = nextTime;
      live.stepDur = curSpb / 4;
      dly.delayTime.setTargetAtTime(curSpb * 0.75, ctx.currentTime, 0.1);
    }, 40);

    // teardown handle: the bed owns oscillators created long after build time
    const bedKiller = { stop() { bedStopAll(); } };

    return {
      timer, master, song, live,
      // `tail` is the last node in the chain (before the scope/fader taps);
      // teardown disconnects it so restarts cannot leak silent chains
      tail: warm,
      fx: { hall, halo, bedBus, chorusWet, warm, sat },
      stopNodes: [bedKiller, ...lfoNodes]
    };
  }

  async stop() {
    this.unlearnFromTab();
    this._disconnectSource();
    this.setState(EngineState.IDLE, SourceKind.NONE, 'stopped by user');
  }

  /* --------------------- jam along — the follower --------------------- */

  /**
   * Attach a PICKUP-ONLY analysis channel to a single browser tab's audio
   * (the user picks the tab surface in the share dialog). The tab audio is
   * never relayed and never modified — we only listen, and play *with* it.
   *
   * It learns the tab's key (bass pitch-class voting), its CHORD PROGRESSION
   * (a 12-bin chromagram matched against 24 triads, bass-led roots), its
   * tempo (onset IOI median, folded into the ambient window) and its
   * brightness/density.
   */
  /**
   * Attach a PICKUP-ONLY analysis channel to ANY audio source:
   * browser tab stream, microphone stream (for room/speakers now-playing on mobile),
   * or a media element.
   */
  attachLearnStream(stream, surface = 'tab', audioEl = null) {
    this._ensureGraph();
    this.unlearnFromTab();
    const node = audioEl
      ? this.ctx.createMediaElementSource(audioEl)
      : this.ctx.createMediaStreamSource(stream);
    const an = this.ctx.createAnalyser();
    an.fftSize = 4096;              // doubled: better low-end resolution for chord roots
    an.smoothingTimeConstant = 0.4;
    node.connect(an); // analysis channel ENDS here — nothing reaches the speakers for mic/tab
    if (audioEl) {
      node.connect(this.ctx.destination); // files play so the user hears what is being followed
    }
    this._learn = {
      stream, node, an, surface, audioEl,
      time: new Float32Array(an.fftSize),
      freq: new Float32Array(an.frequencyBinCount),
      hist: new Array(16).fill(0),
      votes: new Array(12).fill(0),
      chroma: new Float32Array(12),   // raw chromagram accumulator
      chromaS: new Float32Array(12),  // smoothed chromagram (the one we match)
      bassEMA: 0, onsetTimes: [], lastOnset: 0,
      features: { rms: 0, keyPc: null, bright: 0.5, bpm: null, onsetFlashTs: 0 },
      timer: setInterval(() => this._learnTick(), 100)
    };
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) track.addEventListener('ended', () => this.unlearnFromTab());
    } else if (audioEl) {
      audioEl.addEventListener('ended', () => this.unlearnFromTab(), { once: true });
    }
    this.dispatchEvent(new CustomEvent('learn', { detail: { active: true, surface } }));
  }

  /**
   * Attach a PICKUP-ONLY analysis channel to a single browser tab's audio
   * (the user picks the tab surface in the share dialog).
   */
  async learnFromTab() {
    this._ensureGraph();
    await this.ctx.resume();
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
      throw new Error('Tab audio capture is unavailable on mobile/tablets. Use "📱 Jam with Mic (Now-Playing)" to listen to room music, or pick an audio file!');
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { max: 1 }, width: { max: 64 }, height: { max: 64 } },
        audio: {
          echoCancellation: false, noiseSuppression: false, autoGainControl: false,
          suppressLocalAudioPlayback: false // the tab keeps playing itself needfully
        },
        selfBrowserSurface: 'include', surfaceSwitching: 'exclude',
        systemAudio: 'include', monitorTypeSurfaces: 'include'
      });
    } catch (err) {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        });
      } catch (err2) {
        throw new Error((err2 && err2.message) || (err && err.message) || 'Tab capture cancelled.');
      }
    }
    if (!stream.getAudioTracks().length) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error('No audio shared — in the picker, choose a browser TAB and tick "Share tab audio".');
    }
    const [videoTrack] = stream.getVideoTracks();
    const surface = videoTrack && videoTrack.getSettings && videoTrack.getSettings().displaySurface;
    if (videoTrack) videoTrack.enabled = false; // keep-alive at ~zero cost

    this.attachLearnStream(stream, surface || 'tab');
  }

  /**
   * Mobile & Tablet Friendly Now-Playing:
   * Uses microphone to listen to music playing in the room or from speakers,
   * extracts the chord progression via 4096-bin chromagram, and harmonizes with it!
   */
  async learnFromMic() {
    this._ensureGraph();
    await this.ctx.resume();
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        location.replace('https:' + location.href.substring(location.protocol.length));
        return;
      }
      throw new Error('Microphone access requires HTTPS or is unsupported by this browser.');
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false
      });
    } catch (err) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
      } catch (fallbackErr) {
        throw new Error((fallbackErr && fallbackErr.message) || (err && err.message) || 'Microphone permission denied.');
      }
    }
    if (!stream.getAudioTracks().length) {
      throw new Error('No microphone audio track available.');
    }
    this.attachLearnStream(stream, 'mic · now-playing room');
  }

  /**
   * Jam with an audio file (MP3/WAV/etc.) loaded from device:
   * Plays the track and lets the SO rig harmonize and jam with its chords.
   */
  async learnFromFile(file) {
    this._ensureGraph();
    await this.ctx.resume();
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = url;
    audio.loop = true;
    audio.crossOrigin = 'anonymous';
    await audio.play();
    this.attachLearnStream(null, 'file · ' + file.name, audio);
  }

  unlearnFromTab() {
    if (!this._learn) return;
    clearInterval(this._learn.timer);
    try { this._learn.node.disconnect(); } catch (_) { /* noop */ }
    if (this._learn.stream) {
      for (const t of this._learn.stream.getTracks()) { try { t.stop(); } catch (_) { /* noop */ } }
    }
    if (this._learn.audioEl) {
      try {
        this._learn.audioEl.pause();
        this._learn.audioEl.src = '';
      } catch (_) { /* noop */ }
    }
    this._learn = null;
    this._learnHints = {};
    this._resetFollow();
    this.dispatchEvent(new CustomEvent('learn', { detail: { active: false } }));
  }

  /** Clear the harmonic follower + the jam clock back to their home state. */
  _resetFollow() {
    this._jam = {
      bpm: null, ioi: 0, locked: false, lastBeatCtx: 0,
      // the phrasing budget: how many notes are left in this breath, and
      // when the rig is allowed to speak again
      phraseLeft: 1, restUntil: 0, lastReplyAt: 0, lastReplyHz: 220
    };
    this._follow = { chord: null, prev: null, conf: 0, stable: 0, prog: [], changedAt: 0 };
  }

  get learning() {
    return !!this._learn;
  }

  /**
   * Snapshot for UI decks: rolling energy history, best-guess musical
   * features, the FOLLOWED PROGRESSION, and the jam-lock state.
   */
  learnInfo() {
    const L = this._learn;
    const f0 = this._follow || {};
    if (!L) {
      return {
        active: false, hist: new Array(16).fill(0), keyPc: null, bright: 0.5, bpm: null,
        locked: false, followBpm: null, onsetFlash: false,
        chord: null, chordConf: 0, prog: [], resting: false, looseness: 0
      };
    }
    const f = L.features;
    const J = this._jam;
    return {
      active: true, hist: L.hist.slice(), keyPc: f.keyPc, bright: f.bright, bpm: f.bpm,
      locked: J.locked, followBpm: J.bpm,
      onsetFlash: performance.now() - f.onsetFlashTs < 200, surface: L.surface,
      chord: f0.chord ? f0.chord.name : null,
      chordConf: f0.conf || 0,
      prog: (f0.prog || []).slice(-8),
      resting: !!(J.restUntil && performance.now() < J.restUntil),
      looseness: J.locked ? 0.72 : 0.85   // how far off the grid the replies may sit
    };
  }

  /**
   * One analysis tick (~100 ms). Everything the follower knows is updated
   * here: energy history, key votes, the chord chromagram, the tempo/phase
   * jam clock, and — when the rig is running — the rare ambient replies.
   */
  _learnTick() {
    const L = this._learn;
    if (!L) return;
    L.an.getFloatTimeDomainData(L.time);
    L.an.getFloatFrequencyData(L.freq);

    const f = L.features;
    const J = this._jam;

    // ---- energy + rolling 16-step history (the deck's TAB lane) ----
    let sum = 0;
    for (let i = 0; i < L.time.length; i++) sum += L.time[i] * L.time[i];
    const rms = Math.sqrt(sum / L.time.length);
    L.hist.push(rms);
    L.hist.shift();
    f.rms += (rms - f.rms) * 0.2;

    const perHz = L.an.fftSize / this.ctx.sampleRate;
    const nyq = L.freq.length - 1;

    // ---- pitch-class → FFT bin table, built once and reused every tick ----
    // THE CHROMA BAND STARTS AT 200 Hz, and that floor is not arbitrary: bin
    // width is sampleRate/fftSize (≈11.7 Hz at 4096), while a semitone at
    // 130 Hz is only 7.8 Hz wide. Below ~200 Hz a bin is WIDER than a
    // semitone, so low fundamentals would fold onto the wrong pitch class.
    // Harmonics of those same notes sit comfortably inside the band and carry
    // the same pitch classes — and the separate bass vote below still reads
    // the fundamentals (30-260 Hz) to name the ROOT.
    L.bands = L.bands || (() => {
      const b = [];
      for (let pc = 0; pc < 12; pc++) b.push([]);
      for (let bin = 0; bin <= nyq; bin++) {
        const hz = bin / perHz;
        if (hz < 200 || hz > 2400) continue;   // below 200 is unresolvable, above 2.4 k is air
        const midi = 69 + 12 * Math.log2(hz / 440);
        // MIDI is C-based (C = 0); this engine's pitch classes are A-based
        // (A = 0, see KEY_NAMES / the bass vote / CHORD_TEMPLATES). +3 makes
        // C→3 and A→0. Getting this wrong is a tritone, not a typo.
        const pc = (((Math.round(midi) + 3) % 12) + 12) % 12;
        b[pc].push(bin);
      }
      return b.map((list) => ({ bins: list }));
    })();

    // ---- chromagram: fold the spectrum into 12 pitch classes ----
    L.chroma.fill(0);
    for (let pc = 0; pc < 12; pc++) {
      const bins = L.bands[pc].bins;
      let acc = 0;
      for (let k = 0; k < bins.length; k++) {
        const db = L.freq[bins[k]];
        if (db > -78) acc += Math.pow(10, db / 20);       // linear magnitude, gated
      }
      L.chroma[pc] = acc / Math.max(1, bins.length);
    }
    // smooth over ~1.3 s so a single passing note can't flip the chord
    let rawSum = 0;
    for (let pc = 0; pc < 12; pc++) { L.chromaS[pc] += (L.chroma[pc] - L.chromaS[pc]) * 0.22; rawSum += L.chromaS[pc]; }

    // ---- bass band 30-260 Hz: strongest bin → pitch-class vote + chord root
    const lo = Math.max(1, Math.floor(30 * perHz));
    const hi = Math.min(nyq, Math.ceil(260 * perHz));
    let best = -Infinity, bestBin = 0;
    for (let b = lo; b <= hi; b++) if (L.freq[b] > best) { best = L.freq[b]; bestBin = b; }
    const bassLin = Math.pow(10, best / 20);
    L.bassEMA = L.bassEMA * 0.9 + bassLin * 0.1;

    let bassPc = null;
    if (best > -55) { // only vote when the bass actually speaks
      const hz = bestBin / perHz;
      bassPc = ((Math.round(12 * Math.log2(hz / 55)) % 12) + 12) % 12; // A = 0
      L.votes[bassPc] += 1;
      if (L.votes.reduce((a, b2) => a + b2) > 8) f.keyPc = L.votes.indexOf(Math.max(...L.votes));
    }

    // ---- brightness ≈ fraction of spectral energy in the top half (mode hint)
    let low = 0, tot = 0;
    for (let b = 1; b < L.freq.length; b++) {
      const v = Math.pow(10, L.freq[b] / 20);
      tot += v;
      if (b >= Math.floor(L.freq.length / 2)) low += v;
    }
    f.bright += ((tot > 0 ? low / tot : 0.5) - f.bright) * 0.1;

    // ---- THE PROGRESSION: match the chromagram against 24 triads ----
    // A chord only "counts" once it has held for two consecutive ticks, so a
    // passing tone or a drum hit can't yank the harmony around mid-bar.
    const F = this._follow;
    if (rawSum > 1e-4) {
      const cand = bestChord(L.chromaS, bassPc);
      if (cand) {
        if (F.chord && cand.pc === F.chord.pc && cand.minor === F.chord.minor) {
          F.stable = Math.min(8, F.stable + 1);
          F.conf = Math.min(1, F.conf + 0.08);
        } else {
          F.stable = Math.max(0, F.stable - 1);
          if (F.stable === 0) {
            F.prev = F.chord;
            F.chord = cand;
            F.changedAt = performance.now();
            F.conf = 0.35;
            F.prog.push({ name: cand.name, at: performance.now() });
            if (F.prog.length > 16) F.prog.shift();
            this._onTabChordChange(cand);
          }
        }
      }
    }

    // ---- onset detection on bass flux → tempo estimate + gentle phase lean ----
    const flux = Math.max(0, bassLin - L.bassEMA * 1.6);
    const now = performance.now();
    if (flux > 0.02 && bassLin > 0.02 && now - L.lastOnset > 300) { // long refractory: beats, not 16ths
      L.lastOnset = now;
      f.onsetFlashTs = now;
      L.onsetTimes.push(now);
      if (L.onsetTimes.length > 9) L.onsetTimes.shift();
      const onCtx = this.ctx.currentTime + (now - performance.now()) / 1000;
      J.lastBeatCtx = onCtx;

      if (L.onsetTimes.length >= 4) {
        const iois = L.onsetTimes.slice(1).map((t2, i2) => t2 - L.onsetTimes[i2]).sort((a, b2) => a - b2);
        J.ioi = iois[Math.floor(iois.length / 2)] / 1000;
        const bpm = jamFollowBpm(60000 / (J.ioi * 1000));
        if (bpm) { f.bpm = Math.round(bpm); J.bpm = bpm; }
        J.locked = L.onsetTimes.length >= 6;
      }

      const live = this._demo && this._demo.live;
      if (live && J.ioi) {
        // PHASE LEAN (not lock): pull the rig's next step boundary toward the
        // tab's 16th grid by at most 12 ms per onset, ignoring anything under
        // 6 ms. The groove converges loosely and then sits a hair BEHIND the
        // tab — which is where an accompaniment sounds right.
        const d = gridPhase(live.nextTime, onCtx, J.ioi / 4);
        if (Math.abs(d) > 0.006) {
          live.phaseNudge = (live.phaseNudge || 0) + Math.max(-0.012, Math.min(0.012, -d * 0.4));
        }
        this._jamReply(onCtx, flux, live);
      }
    }
    // the beat went quiet → release the lock and let the follower coast
    if (J.locked && now - (L.lastOnset || 0) > 3000) J.locked = false;

    // hints for the NEXT song rotation
    this._learnHints = {
      keyPc: f.keyPc,
      mode: f.bright > 0.42 ? 'bright' : 'dark',
      strength: 0.7,
      density: f.bpm ? Math.max(0, Math.min(1, (f.bpm - 70) / 70)) : 0.5
    };
  }

  /**
   * A chord change just landed in the tab. The bed itself is re-voiced onto
   * the new chord at the next bar line (see bedVoicingFor), so here we only
   * mark the moment: a chime on the new fifth, ringing out into the halo.
   */
  _onTabChordChange(chord) {
    const live = this._demo && this._demo.live;
    if (!live || !this._audibleSim || !chord) return;
    const t = this.ctx.currentTime + 0.05;
    const tones = chordHz(chord, 880, 1900);
    if (tones.length) live.voices.chime(t, tones[Math.min(1, tones.length - 1)], 0.05, 8.0);
  }

  /**
   * THE AMBIENT REPLY — the quietest thing this rig does.
   *
   * The template fired coin-flip plucks on the tab's 8ths. The previous
   * revision answered in phrases. This one barely answers at all: a single
   * long drift note (10-20 beats, ~10-18 seconds), voice-led to the nearest
   * tone of the tab's current chord, dropped softly behind the beat, and then
   * a long rest before anything else is allowed to happen.
   *
   * It is deliberately rarer than the music it accompanies. That restraint is
   * the whole point: the rig's job is to make the tab sound like it is in a
   * bigger room, not to trade licks with it.
   */
  _jamReply(onCtx, flux, live) {
    const J = this._jam, L = this._learn;
    const now = performance.now();

    // ---- phrasing budget: one note, then a long breath ----
    if (J.restUntil && now < J.restUntil) return;
    if (J.restUntil && now >= J.restUntil) { J.restUntil = 0; J.phraseLeft = 1; }
    if (J.phraseLeft <= 0) {
      J.restUntil = now + 3500 + Math.random() * 4500;      // 3.5-8 s of silence
      return;
    }
    if (now - J.lastReplyAt < 1200) return;                  // at most one note per 1.2 s

    const song = live.song;
    const busy = Math.max(0, Math.min(1, this._learnHints.density ?? 0.5));
    // far rarer than either previous revision: a coin flip that usually loses
    const degree = (J.locked ? 0.22 : 0.10) * (1 - busy * 0.5);
    if (Math.random() > degree) return;

    // ---- where does it land? behind the tab's next half-bar, swung ----
    const earliest = this.ctx.currentTime + 0.12;
    let t = gridQuantize(earliest, onCtx, J.ioi) + swingOffset(earliest, onCtx, J.ioi / 2, 0.15);
    if (t < earliest) t += J.ioi;
    t = softQuantize(t, onCtx, J.ioi / 2, J.locked ? 0.6 : 0.8);

    // ---- what note? voice-lead to the tab's chord, else the song's pool ----
    const F = this._follow;
    let hz;
    if (F && F.chord && F.conf > 0.3) {
      const tones = chordHz(F.chord, song.poolHz[0] * 0.75, song.poolHz[0] * 1.8);
      hz = nearestPitch(J.lastReplyHz || song.poolHz[4], tones);
    } else {
      const pool = song.poolHz;
      hz = nearestPitch(J.lastReplyHz || pool[4], pool);
    }
    J.lastReplyHz = hz;
    J.lastReplyAt = now;
    J.phraseLeft -= 1;

    // ---- how hard? barely ----
    const loud = Math.max(0, Math.min(1, flux / 0.12));
    const vel = Math.min(0.085, 0.05 + 0.035 * loud) * (1 - busy * 0.3);
    live.drift(t, { hz, hz2: hz, durBeats: 10 + Math.floor(Math.random() * 11), vel });
  }


  /* ------------------------------ analysis ----------------------------- */

  /**
   * Build one quantized broadcast frame, or null when there is no live signal.
   * Frame shape (all integers so it survives JSON messaging cheaply):
   *   { ts, state, source,
   *     wave:  [0..255] × waveformPoints   (127/128 ≈ zero line)
   *     spec:  [0..255] × bands
   *     levels:{ rms, peak, peakHold, hardPeak, peakIntensity, bass, mids, highs } }
   */
  readFrame() {
    const live = this.state === EngineState.LIVE || this.state === EngineState.SIMULATED;
    if (!live || !this._time) return null;

    const pts = this.params.waveformPoints;
    // audible demo rig plays through the analyser, so it reads like real audio;
    // the math sims (silent cosine / silent groove) fill the buffers directly.
    const simMath = this.state === EngineState.SIMULATED && !this._audibleSim;

    // 1. time domain
    if (simMath) this._simFill(this._time);
    else this.analyser.getFloatTimeDomainData(this._time);

    // CRASH-IN overlay: while the math sims draw the idle flow, any measured
    // HUMAN audio (mouse kit, arrow-key plucks) is blended in — clicks land
    // visibly ON the scope, and the peak meter below can still flash red.
    if (simMath && this.ctx) {
      const an = this._time2 || (this._time2 = new Float32Array(this._time.length));
      this.analyser.getFloatTimeDomainData(an);
      for (let i = 0; i < an.length; i++) {
        const s = this._time[i] + an[i];
        this._time[i] = s < -1 ? -1 : s > 1 ? 1 : s;
      }
    }

    // 2. spectrum (sim skyline merged with the measured solo spectrum)
    const specNorm = simMath ? this._simSpectrum() : this._analyserSpectrum();
    if (simMath && this.ctx) {
      const real = this._analyserSpectrum();
      for (let i = 0; i < specNorm.length; i++) if (real[i] > specNorm[i]) specNorm[i] = real[i];
    }

    // 3. meters (from the same time block the renderer will see — after the
    // overlay, so a hard mouse crash registers like any true audio peak)
    this._updateMeters(this._time);
    const m = this._m;

    // 4. quantize
    const wave = new Array(pts);
    const stride = this._time.length / pts;
    for (let j = 0; j < pts; j++) {
      // peak-preserving downsample: loudest sample in each window wins
      const start = Math.floor(j * stride);
      let best = 0;
      for (let k = 0; k < stride; k++) {
        const v = this._time[Math.min(this._time.length - 1, start + k)];
        if (Math.abs(v) > Math.abs(best)) best = v;
      }
      wave[j] = Math.round(127.5 + Math.max(-1, Math.min(1, best)) * 127.5);
    }

    const spec = new Array(specNorm.length);
    for (let i = 0; i < specNorm.length; i++) spec[i] = Math.round(clamp01(specNorm[i]) * 255);

    const third = Math.max(1, Math.floor(spec.length / 3));
    const segAvg = (a, b) => {
      let s = 0;
      for (let i = a; i < b; i++) s += spec[i];
      return s / Math.max(1, b - a) / 255;
    };

    return {
      ts: Date.now(),
      state: this.state,
      source: this.source,
      wave,
      spec,
      levels: {
        rms: m.rms,
        peak: m.peak,
        peakHold: m.peakHold,
        hardPeak: m.hardPeak,
        peakIntensity: m.peakIntensity,
        bass: segAvg(0, third),
        mids: segAvg(third, third * 2),
        highs: segAvg(third * 2, spec.length)
      }
    };
  }

  /** Real path: fold analyser dB bins into normalized bands. */
  _analyserSpectrum() {
    this.analyser.getFloatFrequencyData(this._freq);
    const { minDb, maxDb } = this.params;
    const out = new Float32Array(this._bandBins.length);
    for (let i = 0; i < this._bandBins.length; i++) {
      const [lo, hi] = this._bandBins[i];
      let best = -Infinity;
      for (let b = lo; b <= hi; b++) if (this._freq[b] > best) best = this._freq[b];
      out[i] = best === -Infinity ? 0 : clamp01((best - minDb) / (maxDb - minDb));
    }
    return out;
  }

  _updateMeters(buf) {
    let sum = 0, peak = 0;
    for (let i = 0; i < buf.length; i++) {
      const a = Math.abs(buf[i]);
      sum += buf[i] * buf[i];
      if (a > peak) peak = a;
    }
    const rms = Math.sqrt(sum / buf.length);

    const m = this._m, p = this.params;
    m.envFast += (rms - m.envFast) * (rms > m.envFast ? p.fastAttack : p.fastRelease);
    m.envSlow += (rms - m.envSlow) * (rms > m.envSlow ? p.slowAttack : p.slowRelease);
    m.peakHold = Math.max(peak, m.peakHold * 0.995);

    const thresh = Math.max(p.hardPeakFloor, m.envSlow * p.hardPeakRatio);
    m.hardPeak = m.envFast > thresh;
    const raw = clamp01((m.envFast - thresh) / Math.max(1e-6, 1 - thresh));
    // peakIntensity spikes instantly on a hard peak, then eases off (phosphor decay)
    m.peakIntensity = m.hardPeak ? Math.max(0.5, raw) : m.peakIntensity * 0.86;

    m.rms = rms;
    m.peak = peak;
  }

  /* ----------------------------- simulator ----------------------------- */

  /** 120 BPM synthetic groove with periodic hard hits (fills the shared time buffer). */
  _simFill(buf) {
    if (this._simStyle === 'silent') return this._simFillSilent(buf);
    const sr = SIM_SAMPLE_RATE;
    const now = (performance.now() - this._simStart) / 1000;
    const beatHz = 2; // 120 BPM

    for (let i = 0; i < buf.length; i++) {
      const t = now + i / sr;
      const tb = (t * beatHz) % 1;                    // phase within one beat
      const kickEnv = Math.exp(-7 * tb);
      const barPhase = (t * beatHz) / 16;             // 16-beat cycle
      const crashEnv = Math.exp(-30 * (barPhase % 1));
      const dropBar = Math.floor(barPhase) % 8 === 4; // every 8th cycle hits harder
      const gain = dropBar ? 1.45 : 1.0;

      const f0 = 55 + 27 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 11)); // slow bass glide
      let s = 0.62 * kickEnv * Math.sin(2 * Math.PI * f0 * t + 6 * Math.sin(2 * Math.PI * f0 * t) * kickEnv);
      s += 0.20 * Math.sin(2 * Math.PI * 220 * t) * (0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 7));
      s += 0.14 * Math.sin(2 * Math.PI * 277.2 * t + 1.3);
      s += 0.10 * Math.sin(2 * Math.PI * 329.6 * t + 2.1);
      s += 0.10 * (Math.random() * 2 - 1) * Math.exp(-22 * ((t * beatHz * 2) % 1)); // offbeat hats
      s += 0.55 * (Math.random() * 2 - 1) * crashEnv;                                // crash → hard peak

      buf[i] = Math.tanh(s * gain * 1.1) * 0.9;
    }
  }

  /** Calm idle signal: one breathing cosine + faint harmonics. Never peaks red. */
  _simFillSilent(buf) {
    const sr = SIM_SAMPLE_RATE;
    const now = (performance.now() - this._simStart) / 1000;
    const breathe = 0.75 + 0.25 * Math.sin((2 * Math.PI * now) / 23);
    const f = 176;
    for (let i = 0; i < buf.length; i++) {
      const t = now + i / sr;
      const ph = 2 * Math.PI * f * t + 0.4 * Math.sin((2 * Math.PI * t) / 37);
      let v = Math.cos(ph) + 0.14 * Math.cos(2 * ph + 0.6) + 0.06 * Math.sin(2 * Math.PI * (f / 2) * t + 1.1);
      buf[i] = v * 0.62 * breathe * 0.82;
    }
  }

  /** Analytic spectrum matching the constructs in _simFill (no FFT needed). */
  _simSpectrum() {
    if (this._simStyle === 'silent') return this._simSpectrumSilent();
    const t = (performance.now() - this._simStart) / 1000;
    const beatHz = 2;
    const kickNow = Math.exp(-7 * ((t * beatHz) % 1));
    const hatNow = Math.exp(-22 * ((t * beatHz * 2) % 1));
    const crashNow = Math.exp(-30 * (((t * beatHz) / 16) % 1));
    const padEnv = 0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 7);
    const dropBar = Math.floor((t * beatHz) / 16) % 8 === 4 ? 1.45 : 1.0;

    const out = new Float32Array(this._bandCenters.length);
    for (let i = 0; i < this._bandCenters.length; i++) {
      const f = this._bandCenters[i];
      let e = 0.05;
      e += 0.85 * kickNow * dropBar * Math.exp(-((f - 60) ** 2) / (2 * 90 ** 2));   // kick/bass
      e += 0.30 * padEnv * (Math.exp(-((f - 240) ** 2) / (2 * 130 ** 2))
                          + Math.exp(-((f - 300) ** 2) / (2 * 150 ** 2)));          // pads
      e += 0.20 * hatNow * Math.exp(-((f - 5200) ** 2) / (2 * 3400 ** 2));          // hats
      e += 0.65 * crashNow * dropBar * Math.exp(-((f - 5000) ** 2) / (2 * 4500 ** 2)); // crash
      e += 0.03 * Math.random();
      out[i] = clamp01(e);
    }
    return out;
  }

  /** Idle spectrum floor: low harmonic bumps at the cosine's partials + shimmer. */
  _simSpectrumSilent() {
    const t = (performance.now() - this._simStart) / 1000;
    const breathe = 0.75 + 0.25 * Math.sin((2 * Math.PI * t) / 23);
    const out = new Float32Array(this._bandCenters.length);
    for (let i = 0; i < this._bandCenters.length; i++) {
      const f = this._bandCenters[i];
      let v = 0.06;
      v += 0.32 * breathe * Math.exp(-((f - 176) ** 2) / (2 * 70 ** 2));
      v += 0.14 * breathe * Math.exp(-((f - 352) ** 2) / (2 * 110 ** 2));
      v += 0.05 * Math.exp(-((f - 88) ** 2) / (2 * 40 ** 2));
      v += 0.03 * (0.5 + 0.5 * Math.sin(i * 1.7 + t * 0.9)) * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 41));
      out[i] = clamp01(v);
    }
    return out;
  }

  /* -------------------------- full-res taps ---------------------------- */

  /** Unquantized waveform copy for diagnostics / future high-res renderers. */
  getWaveformFull() {
    if (!this._time) return null;
    this.readFrame(); // refresh the shared buffer via the normal pipeline
    return Float32Array.from(this._time);
  }

  getLevels() {
    const { rms, peak, peakHold, hardPeak, peakIntensity, envFast, envSlow } = this._m;
    return { rms, peak, peakHold, hardPeak, peakIntensity, envFast, envSlow };
  }

  get bandCentersHz() {
    return this._bandCenters ? Array.from(this._bandCenters) : [];
  }
}

