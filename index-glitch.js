/* index-glitch.js
   Overlay engine for the homepage YouTube embeds.
   Drop-in upgrade: same hosts, richer analog look, cheaper to run.

   Hosts:
     1) #musicForCodeContainer
     2) #musicForCode-2
     3) #double-oh-six-yt
   Canvas sits ON TOP of the iframe (pointer-events:none).

   Live tweak in the console:
     __indexGlitch.setMix({ ascii: 0.4, burn: 0.9, rainbow: 0.2 })

   ASCII RAIN + GEMINI BOMB (added from Glitch-Revision-3.html /
   glitch-canvas-html/glitch-engine.js):
     • the rain's glyphs now come from the engine's named TYPESETS
       (latin cyrillic greek hebrew arabic devanagari thai hangul hanzi
        javanese · katakana box/block CP437 math · ghostkey leet), picked
       through the engine's own pickTypeset / pickGlyph so the mix weights
       match Revision-3. The embedded copy is the fallback; the real
       glitch-engine.js is fetched at runtime and adopted if reachable.
     • Gemini Bomb rides under the rain as two counter-rotating twins
       (root + fifth) that throw GLYPH shrapnel along the orbit tangent.

     __indexGlitch.glyphs.setRealm('virtual')   // machine rain
     __indexGlitch.glyphs.setRealm('mix')       // everything (default)
     __indexGlitch.glyphs.engine()              // 'live' | 'embedded'
     __indexGlitch.setMix({ gemini: 0.8, geminiShards: 1 })

   TYPOGRAPHY — font bases + variations:
     Each falling stream locks one font BASE (a palette of monospace stream
     faces for the rain, display faces for the burn stamps) plus a variation
     drawn out of it — weight across the base's usable range, italic where
     the face has one, optical size, and wide HUD tracking on the burn.
     Five webfonts are fetched at runtime (Orbitron, JetBrains Mono,
     Share Tech Mono, VT323, Chakra Petch) and layer on top of the faces
     the homepage already serves (Staatliches, Unica One, the_black_bloc);
     system faces are the floor if none of them arrive. Every stack ends
     with a script-aware tail, so katakana, Devanagari, Thai, Arabic,
     Hebrew, Hanzi and Javanese each drop through to a face that covers
     them instead of rendering as tofu.

     __indexGlitch.type.bases()               // the palette
     __indexGlitch.type.check()               // which faces are live
     __indexGlitch.type.loaded()              // webfonts ready?
     __indexGlitch.type.recolumn()            // re-roll the per-column faces
     __indexGlitch.type.setFont('Impact')     // force one face everywhere
     __indexGlitch.setMix({ typeScale: 1.15, typeJitter: 0, burnTrack: 2 })
*/
(function () {
  'use strict';
  if (window.__indexGlitchLoaded) {
    /* hot-reload: tear down previous loop if the file is injected twice */
    try { window.__indexGlitch && window.__indexGlitch.destroy && window.__indexGlitch.destroy(); } catch (e) {}
  }
  window.__indexGlitchLoaded = true;

  var MIX = {
    master: 0.74,
    scanlines: 0.38,
    rainbow: 0.24,
    ascii: 0.48,
    asciiRain: 0.77,   /* fraction of columns that are falling */
    asciiScale: 2.50,  /* glyph size vs cell (250%) */
    asciiAlphaMin: 0.50,
    asciiAlphaMax: 0.75,
    /* --- ASCII rain: glyph banks (glitch-engine.js) --- */
    /* 'mix' = every bank interleaved (default) · 'virtual' = katakana /
       box-drawing / CP437 / math machine rain · 'reality' = IRL scripts */
    asciiRealm: 'mix',
    asciiEmoji: false,     /* let the emoji-range pictographs through */
    /* '' = let the TYPE_BASES system choose per column (default).
       Set an explicit stack here to force ONE face across the whole rain. */
    asciiFont: '',
    /* --- typography: font bases + variations --- */
    typeLoad: 1,           /* fetch the webfont pack (0 = system faces only) */
    typeScale: 1.00,       /* global size multiplier for every glyph */
    typeJitter: 1,         /* per-column weight / slant / size variation */
    typeRack: 6,           /* distinct rain font strings (see buildTypeRack) */
    burnTrack: 1,          /* letter-spacing multiplier on the burn stamps */
    /* --- Gemini Bomb · twin orbit + glyph shrapnel --- */
    gemini: 0.55,          /* twin orbit strength */
    geminiShards: 1,       /* eject glyph shards along the orbit tangent */
    /* stand-in board for glitch-engine.js realm / chord picking */
    board: { ghost: 'OFF', vsync: 'OFF' },
    burn: 0.88,
    neon: 0.20,
    bands: 0.22,
    flash: 0.10,
    chroma: 0.55,
    tear: 0.28,
    grain: 0.16,
    spike: 0.70
  };

  /* ================================================================== *
   *  ASCII RAIN GLYPH BANKS — glitch-engine.js TYPESETS (verbatim)     *
   *                                                                   *
   *  The old flat bank (latin … mathoperator, hand-copied from the     *
   *  youtube-canvas page) is gone. The rain now draws from the same    *
   *  named typesets Glitch-Revision-3.html uses, lifted straight out    *
   *  of glitch-canvas-html/glitch-engine.js:                            *
   *                                                                   *
   *    reality  latin cyrillic greek hebrew arabic devanagari thai     *
   *             hangul hanzi javanese                                  *
   *    virtual  katakana (Wachowski) box/block/geometric symbols        *
   *             CP437 Latin-1 + dingbats  math operators                *
   *    mix      ghostkey — the Ghost-Key leet alphabet                  *
   *                                                                   *
   *  pickTypeset / pickGlyph / glyphBank are the engine's own, so the   *
   *  mix weights match the Revision-3 page exactly (7% ghostkey, then   *
   *  a uniform draw across the realm's sets).                           *
   *                                                                   *
   *  LIVE HOT-SWAP: if the real glitch-engine.js is reachable it is     *
   *  fetched at runtime and adopted on the spot — so future edits to    *
   *  that file flow into the homepage rain with no redeploy. The        *
   *  embedded copy below is the offline fallback.                       *
   * ================================================================== */

  /* --- board context (overlay stubs) --------------------------------- *
     glitch-engine.js derives the glyph realm from Ghost x V-Sync x Warp
     x B&W Invert. The homepage has no board UI, so MIX.board stands in.
     These three names were already referenced by stepFxKey() but never
     declared anywhere — it threw every tick and the try/catch at the call
     site swallowed it, which left the whole harmonic key frozen on its
     seed chord (so fxTone() was a constant). Declaring them revives it. */
  var isAiWarpActive = false;
  function getGhostMode() { return (MIX.board && MIX.board.ghost) || 'OFF'; }
  function getVsyncMode() { return (MIX.board && MIX.board.vsync) || 'OFF'; }

  var TYPESETS = {
      latin: { script: "latin", source: "ASCII / Basic Latin printable — typewriter, passport, terminal IRL", realm: "reality", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:\"<>,./?`~ " },
      cyrillic: { script: "cyrillic", source: "Cyrillic + Ukrainian/Belarusian/Macedonian extras (Windows-1251 world)", realm: "reality", chars: "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяІЇЄЎЃЅЋЌЏіїєўѓѕћќџ" },
      greek: { script: "greek", source: "Greek + tonos (ISO 8859-7 print/signage)", realm: "reality", chars: "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψωςΆΈΉΊΌΎΏάέήίόύώΐΰϊϋ" },
      hebrew: { script: "hebrew", source: "Hebrew block — IRL square script", realm: "reality", chars: "אבגדהוזחטיכךלמםנןסעפףצץקרשת׳״־" },
      arabic: { script: "arabic", source: "Arabic letters — IRL abjad", realm: "reality", chars: "ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهويأبتثجحخدذرزسشصضطظعغفقكلمنهويى" },
      devanagari: { script: "devanagari", source: "Devanagari (Hindi/Sanskrit ISCII lineage)", realm: "reality", chars: "अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहँंःॐ०१२३४५६७८९" },
      thai: { script: "thai", source: "Thai — IRL abugida", realm: "reality", chars: "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮัาำิีึืุูใไ่้็๋์ๆ๐๑๒๓๔๕๖๗๘๙" },
      hangul: { script: "hangul", source: "Hangul jamo (keyboard/jamo, not precomposed syllables)", realm: "reality", chars: "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㄲㄸㅃㅆㅉㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ" },
      hanzi: { script: "hanzi", source: "Common Chinese mixed Hans/Hant frequency", realm: "reality", chars: "的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分的一是在不了有和人這中大為上個國我以要他時來用們生到作地於出就分子你说年着那她也得里后自会家可下而过天去能对小多然心学么之都好看起发当没成只如事把还第样道想种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感" },
      javanese: { script: "javanese", source: "Aksara Jawa (Unicode Javanese block)", realm: "reality", chars: "ꦀꦄꦅꦆꦇꦈꦉꦊꦋꦌꦍꦎꦏꦐꦑꦒꦓꦔꦕꦖꦗꦘꦙꦚꦛꦜꦝꦞꦟꦠꦡꦢꦣꦤꦥꦦꦧꦨꦩꦪꦫꦬꦭꦮꦯꦰꦱꦲ꧀꧐꧑꧒꧓꧔꧕꧖꧗꧘꧙" },
      katakana: { script: "katakana", source: "Japanese Katakana + dakuten — Wachowski digital rain / JIS X 0201", realm: "virtual", chars: "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポァィゥェォッヴー" },
      symbols: { script: "box-block", source: "Box Drawing + Block Elements + geometric + arrows (IBM CP437 / VGA)", realm: "virtual", chars: "░▒▓█─│┌┐└┘├┤┬┴┼═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬━┃┄┅┆┇┈┉┊┋┍┎┏┑┒┓┕┖┗┙┚┛┝┞┟┠┡┢┣┥┦┧┨┩┪┫┭┮┯┰┱┲┳┵┶┷┸┹┺┻┽┾┿╀╁╂╃╄╅╆╇╈╉╊╋╌╍╎╏╭╮╯╰╱╲╳╴╵╶╷╸╹╺╻╼╽╾╿▀▁▂▃▄▅▆▇▉▊▋▌▍▎▏▐▔▕■□◆◇▲△▼▽●○◦★☆←↑→↓↔×÷±≠≈≤≥∞√∑∏∫∂∆" },
      superscript: { script: "cp437-misc", source: "Latin-1 + CP437 extras + dingbats + misc symbols (machine IBM PC)", realm: "virtual", chars: "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»ÁÂÀ©¢¥ãÃ¤ðÐÊËÈıÍÎÏ¦ÌÓßÔÒõÕµþÞÚÛÙýÝ¯´≡±‗¾¶§÷¸°¨·¹³²■•̫͡ʕ͓ʔ❁◡‿♥♠♦♣♪♫☼►◄↕‼▬↨↑↓→←∟↔▲▼≈≠≤≥∑∏∫☮☯✞✡☪☢☣⚕⚖⚗⚙⚛☘☤⚚⚜✠☥♀♂⚢⚣⚤⚥⚦⚧✂✒✉☎✆✇✈☏⛴⛷⛸♨♻⚐⚑⚔⚘⚝⚞⚟✁✃✄☦☧☨☩☫☬☭☸☹☺☻☽☾♡♢♤♧♬♭♮♯⚒✎✏✑✓✔✕✖✗✘✙✚✛✜✝✟□△▶▷▽◀◁◆◇○●◦★☆⚰⚱🗜🛰🛩🕹ᔑʖᓵ↸ᒷ⎓⊣⍑⋮ꖎᒲᑑ∷ᓭℸ⚍⍊⨅" },
      mathoperator: { script: "math", source: "Unicode Mathematical Operators + gothic/math alphanumerics", realm: "virtual", chars: "∀∁∂∃∄∆∇∎−∓∔∕∕∗∗∙√∛∜∝∞∴∵∸∺∿≀⊌⊍⊎⊓⊔⊕⊖⊗⊘⊙⊚⊛⊜⊝⊞⊟⊠⊡⊢⊢⊺⊺⊼⊽⊿⋄⋄⋆⋇⋉⋊⋋⋌⋒⋓⟎⟏⟑⟒⟓⟓⧜⧝⧞⧸⧹⨝⨝⨝⨠⨠⨹⨺⨻⨼⨼⨼⨿⩤⩥⫶⫼⫽⫾⫿≫∦𝕲∭∄∂⋥ ⊶≋⧉ ⨇⩈𝕸 𝛙ℵ⪌⟁ ⟆⦆⌘𝛴⦻⎈" },
      ghostkey: { script: 'leet', source: 'Ghost-Key stanza alphabet (leetspeak IRL/VR hinge)', realm: 'mix', chars: "Gh0sT1n3SlLDgiaRBtHf4d.CmM" }
  }

  var TYPESET_REALITY = ['latin', 'cyrillic', 'greek', 'hebrew', 'arabic', 'devanagari', 'thai', 'hangul', 'hanzi', 'javanese'];
  var TYPESET_VIRTUAL = ['katakana', 'symbols', 'superscript', 'mathoperator'];
  var TYPESET_NAMES = TYPESET_REALITY.concat(TYPESET_VIRTUAL).concat(['ghostkey']);

  function ghostKeyMeta(key) {
      key = key || GHOST_KEY;
      var stanzas = GHOST_KEY_STANZAS;
      var seed = ghostKeyHash(key);
      var hues = stanzas.map(function (st) { return ghostKeyHash(st) % 360; });
      var r = hues[0];
      var rel = function (h) { return ((h - r) % 360 + 360) % 360; };
      return {
          key: key,
          stanzas: stanzas.slice(),
          seed: seed,
          hues: hues.slice(),
          home: hues[0],
          fear: seed % 360,
          steps: [0, rel(hues[1]), rel(hues[2])]
      };
  }

  function matrixChords() {
      var gk = ghostKeyMeta();
      return [
          { name: 'shell',     realm: 'reality', steps: gk.steps.slice() },
          { name: 'flesh',     realm: 'reality', steps: [0, 70, 145] },
          { name: 'paper',     realm: 'reality', steps: [0, 48, 96] },
          { name: 'street',    realm: 'reality', steps: [0, 38, 112] },
          { name: 'body',      realm: 'reality', steps: [0, 90, 165] },
          { name: 'rain',      realm: 'virtual', steps: [0, 120, 240] },
          { name: 'net',       realm: 'virtual', steps: [0, 150, 210] },
          { name: 'code',      realm: 'virtual', steps: [0, 180, 270] },
          { name: 'infinite',  realm: 'virtual', steps: [0, 137.5, 222.5] },
          { name: 'fearcomma', realm: 'virtual', steps: [0, (gk.fear % 90) + 40, 160 + (gk.seed % 80)] }
      ];
  }

  function typesetNamesFor(realm) {
      if (realm === 'virtual') return TYPESET_VIRTUAL.slice();
      if (realm === 'reality') return TYPESET_REALITY.slice();
      return TYPESET_REALITY.concat(TYPESET_VIRTUAL);
  }

  function pickTypeset(realm, rng) {
      rng = rng || Math.random;
      if (rng() < 0.07) return 'ghostkey';
      if (realm === 'virtual' && rng() < 0.46) return 'katakana';
      if (realm === 'reality' && rng() < 0.30) return 'latin';
      var names = typesetNamesFor(realm);
      return names[(rng() * names.length) | 0];
  }

  function pickGlyph(realm, rng, toneIndex) {
      rng = rng || Math.random;
      var name = pickTypeset(realm, rng);
      if (toneIndex === 1 && realm === 'virtual' && rng() < 0.25) name = 'mathoperator';
      if (toneIndex === 2 && realm === 'reality' && rng() < 0.20) name = 'hanzi';
      var set = TYPESETS[name] || TYPESETS.latin;
      var chars = set.chars || '01';
      var ch = chars[(rng() * chars.length) | 0];
      if (ch === ' ' || !ch) ch = chars[(rng() * chars.length) | 0] || '0';
      return ch;
  }

  function glyphBank(realm) {
      var names = typesetNamesFor(realm).concat(['ghostkey']);
      var out = '';
      for (var i = 0; i < names.length; i++) {
          var set = TYPESETS[names[i]];
          if (set) out += set.chars;
      }
      return out.split('');
  }

  function pickMatrixChord(realm, rng) {
      rng = rng || Math.random;
      var all = matrixChords();
      var pool = all.filter(function (c) { return realm === 'mix' || c.realm === realm; });
      if (!pool.length) pool = all;
      return pool[(rng() * pool.length) | 0];
  }

  function typesetInfo() {
      var out = {};
      TYPESET_NAMES.forEach(function (n) {
          var s = TYPESETS[n];
          out[n] = { script: s.script, source: s.source, realm: s.realm, count: s.chars.length };
      });
      return out;
  }

  /* ---- live hot-swap to the real engine ---------------------------- */
  var GE = null;                       /* adopted window.GlitchEngine, if any */
  var GE_READY = false;
  var ENGINE_SRCS = [
    '/glitch-canvas-html/glitch-engine.js',
    'https://www.imortalimp.nl/glitch-canvas-html/glitch-engine.js'
  ];

  function adoptGlyphEngine(engine) {
    if (!engine || typeof engine.pickGlyph !== 'function') return false;
    GE = engine;
    GE_READY = true;
    /* pull the engine's ghostkey chord voicings into the burn's key */
    try {
      if (typeof FX_CHORDS !== 'undefined' && engine.matrixChords) {
        engine.matrixChords().forEach(function (ch) {
          if (!FX_CHORDS.some(function (c) { return c.name === ch.name; })) {
            FX_CHORDS.push({ name: ch.name, steps: ch.steps.slice(), realm: ch.realm });
          }
        });
      }
    } catch (e) {}
    /* re-mint the rain's glyph pool from the live banks */
    try {
      ASCII_CHARS = buildGlyphPool(MIX.asciiRealm);
      for (var i = 0; i < layers.length; i++) {
        var L = layers[i];
        if (!L.ascii) continue;
        L.ascii.set = ASCII_CHARS;
        for (var g = 0; g < L.ascii.glyphs.length; g++) {
          L.ascii.glyphs[g] = (Math.random() * ASCII_CHARS.length) | 0;
        }
      }
    } catch (e) {}
    kick();
    return true;
  }

  function loadGlyphEngine() {
    if (GE_READY || loadGlyphEngine.tried) return;
    loadGlyphEngine.tried = true;
    if (window.GlitchEngine && adoptGlyphEngine(window.GlitchEngine)) return;
    var idx = 0;
    (function next() {
      if (idx >= ENGINE_SRCS.length) return;
      var s = document.createElement('script');
      s.src = ENGINE_SRCS[idx++];
      s.async = true;
      /* deliberately NO crossOrigin: this is a plain classic script and we
         only need window.GlitchEngine to appear. Requesting it in CORS mode
         would make the load fail outright on any host that does not send
         Access-Control-Allow-Origin (a staging domain, file://, …). */
      s.onload = function () {
        if (!window.GlitchEngine || !adoptGlyphEngine(window.GlitchEngine)) next();
      };
      s.onerror = next;
      (document.head || document.documentElement).appendChild(s);
    })();
  }

  /* ---- code-point-safe glyph pool ---------------------------------- *
     The banks carry astral-plane chars (the math alphanumerics, a few
     emoji) and stray combining marks. A naive .split('') shatters the
     astral ones into lone surrogates and the combining marks render as
     invisible overstrikes — both show up as tofu boxes in the rain, so
     the pool is filtered to single, paintable code points. */
  var RE_COMBINING = /[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0730-\u074A\u07A6-\u07B0\u0900-\u0903\u093A-\u094E\u0951-\u0957\u0962-\u0963\u0981-\u0983\u09BC\u09C1-\u09C4\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB-\u0EBC\u0EC8-\u0ECD\u0F18-\u0F19\u0F35\u0F37\u0F3E-\u0F3F\u0F71-\u0F7E\u0F80-\u0F84\u0F86-\u0F87\u0FC6\u20D0-\u20F0\uFE00-\uFE0F]/;

  function isPaintableGlyph(ch) {
    if (!ch) return false;
    var cp = ch.codePointAt(0);
    if (cp == null) return false;
    /* lone surrogate — half of a shattered astral pair */
    if (cp >= 0xD800 && cp <= 0xDFFF) {
      if (ch.length < 2) return false;
    }
    if (cp === 0x20 || cp === 0xA0) return false;          /* blank cell */
    if (RE_COMBINING.test(ch)) return false;               /* overstrike */
    if (!MIX.asciiEmoji && cp >= 0x1F000 && cp <= 0x1FAFF) return false;
    if (!MIX.asciiEmoji && cp >= 0x1F1E6 && cp <= 0x1F1FF) return false;
    return true;
  }

  /* One glyph, drawn through whichever engine is live. */
  function pickRainGlyph(tone) {
    var E = GE;
    for (var t = 0; t < 8; t++) {
      var ch = (E && E.pickGlyph)
        ? E.pickGlyph(MIX.asciiRealm, Math.random, tone == null ? (t % 3) : tone)
        : pickGlyph(MIX.asciiRealm, Math.random, tone == null ? (t % 3) : tone);
      if (isPaintableGlyph(ch)) return ch;
    }
    return '0';
  }

  /* A pool pre-sampled with the engine's own distribution, so the per-frame
     head-glyph roll stays as cheap as the old flat-array version. */
  function buildGlyphPool(realm, n) {
    n = n || 6144;
    var out = [];
    var tries = 0;
    while (out.length < n && tries < n * 14) {
      tries++;
      var ch = (GE && GE.pickGlyph)
        ? GE.pickGlyph(realm, Math.random, out.length % 3)
        : pickGlyph(realm, Math.random, out.length % 3);
      if (!isPaintableGlyph(ch)) continue;
      out.push(ch);
    }
    if (!out.length) out = '0123456789ABCDEF'.split('');
    return out;
  }

  /* keep the old name alive — rebuildAscii() and drawAscii() read it */
  var ASCII_CHARS = buildGlyphPool(MIX.asciiRealm);

  var BURN = [
    'GL1TCH', 'BURN', 'DATA', 'CORRUPT', '006', 'DOUBLE-OH-SIX',
    'IMORTALIMP', 'MUSIC FOR CODE', 'RIVER LYLE R.', 'ANNE F.',
    '404', 'SYSFAIL', 'NEON', 'CYBER', 'SIGNAL', 'WIRED', 'PIXEL',
    'NOISE', 'ERROR', 'FREQ', 'JACK IN', 'MATRIX', 'N3T', 'CRASH',
    'OVERRIDE', 'GHOST', 'Z3R0', '1MMORTAL', 'SYNAPSE', 'GL1TCHWAVE',
    'NEONCORE', 'V1RTUAL', 'SPECTRE', 'PHREAK', 'TERMINAL', 'PROTOCOL',
    'FIREWALL', 'BLACK ICE', 'GLITCHMODE', 'BYTECRASH', 'SYNTHWAVE',
    'N3ON', 'DARKNET', 'UPLINK', 'DOWNLINK', 'REPLICANT', 'VOIDLOOP',
    'CHANNEL 006', 'STANDBY', 'LOAD//', 'SYS32', 'ROOTKIT', 'DDoS',
    'HACK_THE_PLANET', 'GHOST_IN_THE_MACHINE', 'Z3R0-DAY', 'NEXUS-7',
    'LICENSE TO GLITCH', 'ON HER MAJESTY\'S SECRET SIG', 'CASINO ROYALE',
    'FOR YOUR EYES ONLY', 'THE LIVING DAYLIGHTS', 'GOLDENEYE',
    'GLORIA', 'NERVOUS', 'TEST', 'PILOT', '_ENSNARE'
  ];

  var KEYS = [
    'DOUBLE-OH-SIX', '006', 'GL1TCH', 'MUSIC FOR CODE', 'IMORTALIMP',
    'CHANNEL 006', 'NEONCORE', 'SYSFAIL', 'WIRED', 'DATA-BURN',
    'GLORIA', 'NERVOUS', 'TEST', 'PILOT', '_ENSNARE'
  ];

  /* ================================================================== *
   *  TYPOGRAPHY — font bases + variations                              *
   *                                                                   *
   *  Both voices used to be stuck on a single face: the rain drew      *
   *  everything through one monospace stack at one weight, and the     *
   *  burn picked from a flat list of family names that were half       *
   *  dead ('BlackOut 2AM' is installed on nobody's machine) and got    *
   *  ', monospace' bolted on the end as a fallback.                    *
   *                                                                   *
   *  Now there is a palette of named BASES. Each base declares its     *
   *  usable weight range, whether it has a true italic, an optical     *
   *  size correction, and whether it reads best in caps. The rain       *
   *  picks one base per falling column and varies weight / slant /      *
   *  size within it; the burn picks one per word-stamp and adds         *
   *  wide HUD-style tracking.                                          *
   *                                                                   *
   *  Cross-script note: none of these latin faces cover katakana,       *
   *  Devanagari, Thai, Arabic, Hebrew, Hanzi or Javanese. That is       *
   *  fine — CSS font fallback is resolved PER GLYPH, so every stack     *
   *  ends with SCRIPT_TAIL and each script simply drops through to      *
   *  the face that covers it.                                          *
   * ================================================================== */

  /* Webfont pack. Injected at runtime so this file stays drop-in; add the
     same href as a <link> in index.html instead if you'd rather have the
     preconnect + earlier discovery (the code checks for an existing tag
     and will not load it twice). */
  var TYPEFACE_HREF = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:ital' +
    ',wght@0,300;0,600;0,700;1,600&family=JetBrains+Mono:ital,wght@0,300..800;1,300..800' +
    '&family=Orbitron:wght@400..900&family=Share+Tech+Mono&family=VT323&display=swap';

  var SCRIPT_TAIL = [
    /* Japanese kana */
    "'Hiragino Kaku Gothic ProN'", "'Yu Gothic'", "'Noto Sans CJK JP'", "'MS Gothic'", 'Meiryo',
    /* Hangul */
    "'Noto Sans CJK KR'", "'Malgun Gothic'", "'Apple SD Gothic Neo'",
    /* Hanzi */
    "'Noto Sans CJK SC'", "'Microsoft YaHei'", "'PingFang SC'", "'Noto Sans CJK TC'",
    /* Devanagari / Indic */
    "'Nirmala UI'", "'Noto Sans Devanagari'", 'Mangal',
    /* Arabic */
    "'Noto Sans Arabic'", "'Segoe UI'", 'Tahoma',
    /* Hebrew */
    "'Noto Sans Hebrew'", 'David', "'Arial Hebrew'",
    /* Thai */
    "'Noto Sans Thai'", "'Leelawadee UI'",
    /* Javanese */
    "'Noto Sans Javanese'",
    /* symbols / CP437 */
    "'Segoe UI Symbol'", "'Noto Sans Symbols'", "'Noto Sans Symbols 2'", "'Apple Symbols'",
    'monospace'
  ].join(', ');

  /* role: 'rain' (monospace stream faces) · 'display' (burn stamps) ·
           'both' (works as either)
     wght:  usable weight range — variable fonts get the full sweep
     ital:  has a real italic
     scale: optical size correction (VT323 is tiny on the em, Orbitron wide)
     upper: reads best set in caps */
  var TYPE_BASES = [
    /* --- webfont pack (fetched at runtime) --- */
    { id: 'jbmono',   label: 'JetBrains Mono',  role: 'rain',    wght: [300, 800], ital: true, scale: 1.00, stack: "'JetBrains Mono'" },
    { id: 'techmono', label: 'Share Tech Mono', role: 'rain',    wght: [400, 400], ital: false, scale: 1.04, stack: "'Share Tech Mono'" },
    { id: 'vt323',    label: 'VT323',           role: 'rain',    wght: [400, 400], ital: false, scale: 1.15, stack: 'VT323' },
    { id: 'chakra',   label: 'Chakra Petch',    role: 'both',    wght: [300, 700], ital: true,  scale: 1.00, stack: "'Chakra Petch'" },
    { id: 'orbitron', label: 'Orbitron',        role: 'display', wght: [400, 900], ital: false, scale: 0.90, stack: 'Orbitron' },
    /* --- already served by the homepage --- */
    { id: 'staat',    label: 'Staatliches',     role: 'display', wght: [400, 400], ital: false, scale: 0.94, upper: true, stack: 'Staatliches' },
    { id: 'unica',    label: 'Unica One',       role: 'display', wght: [400, 400], ital: false, scale: 1.06, upper: true, stack: "'Unica One'" },
    { id: 'bloc',     label: 'the_black_bloc',  role: 'display', wght: [400, 400], ital: false, scale: 0.92, upper: true, stack: "'the_black_bloc'" },
    /* --- system floor: these are always there, webfonts or not --- */
    { id: 'courier',  label: 'Courier New',     role: 'rain',    wght: [400, 700], ital: true,  scale: 1.00, stack: "'Courier New', Courier" },
    { id: 'consolas', label: 'Consolas',        role: 'rain',    wght: [400, 700], ital: true,  scale: 1.00, stack: "Consolas, 'Lucida Console'" }
  ];

  function typeBase(id) {
    for (var i = 0; i < TYPE_BASES.length; i++) if (TYPE_BASES[i].id === id) return TYPE_BASES[i];
    return TYPE_BASES[0];
  }
  function typePool(role) {
    var pool = [];
    for (var i = 0; i < TYPE_BASES.length; i++) {
      var b = TYPE_BASES[i];
      if (role === 'both' || b.role === role || b.role === 'both') pool.push(b);
    }
    return pool.length ? pool : TYPE_BASES.slice();
  }
  function typePick(role, rng) {
    rng = rng || Math.random;
    var pool = typePool(role);
    return pool[(rng() * pool.length) | 0];
  }

  /* Weights snap to 100s and sizes to half-pixels. The browser keeps a
     separate resolved instance per unique font string, so letting every
     column ask for weight 448 / 521 / 646 costs real frame time — measured
     at ~11fps with 27 distinct strings against ~19.5fps with 6. Snapping
     keeps the variation visible and the instance count bounded. */
  function snapWeight(w) { return clamp(Math.round((+w || 400) / 100) * 100, 100, 900); }

  /* the one place a canvas font string gets built */
  function typeFont(b, px, wght, italic) {
    b = b || TYPE_BASES[0];
    px = Math.max(6, (px || 12) * (b.scale || 1) * MIX.typeScale);
    px = Math.round(px * 2) / 2;
    var lo = b.wght[0], hi = b.wght[1];
    var w = (wght == null) ? Math.round((lo + hi) * 0.5) : snapWeight(wght);
    w = clamp(w, lo, hi);
    return (italic && b.ital ? 'italic ' : '') + w + ' ' + px.toFixed(1) + 'px ' +
      b.stack + ', ' + SCRIPT_TAIL;
  }

  /* TYPE RACK — the rain's font palette, built once per layout.
     Columns share slots instead of each minting its own weight/size/slant
     combination, which caps the number of live font instances at the rack
     size no matter how many columns there are. */
  function buildTypeRack(cellPx, n) {
    n = Math.max(1, n | 0);
    var faces = typePool('rain');
    var rack = [];
    for (var i = 0; i < n; i++) {
      var b = faces[i % faces.length];
      var t = n > 1 ? i / (n - 1) : 0.5;
      var w = b.wght[0] + (b.wght[1] - b.wght[0]) * t;   /* weight climbs */
      var sc = 0.90 + 0.22 * (0.5 + 0.5 * Math.cos(i * 2.1));  /* size oscillates */
      var it = !!(b.ital && (i % 3 === 2));                    /* every 3rd italic */
      if (!MIX.typeJitter) { w = (b.wght[0] + b.wght[1]) * 0.5; sc = 1; it = false; }
      rack.push(rainFont(b, cellPx * sc, w, it));
    }
    return rack;
  }
  /* the rain's version — honours an explicit MIX.asciiFont override */
  function rainFont(b, px, wght, italic) {
    if (MIX.asciiFont) return 'bold ' + Math.max(6, px).toFixed(1) + 'px ' + MIX.asciiFont;
    return typeFont(b, px, wght, italic);
  }

  /* letter-spacing (wide HUD tracking on the burn). Chromium 99+,
     Safari 17.4+, Firefox 127+ — silently skipped where unsupported. */
  var HAS_TRACK = (function () {
    try { return 'letterSpacing' in document.createElement('canvas').getContext('2d'); }
    catch (e) { return false; }
  })();
  function setTrack(ctx, px) {
    if (!HAS_TRACK) return;
    try { ctx.letterSpacing = ((+px || 0)).toFixed(2) + 'px'; } catch (e) {}
  }

  var TYPE_READY = false;   /* the stylesheet has been requested */
  var TYPE_LOADED = false;  /* document.fonts says the faces are usable */
  function typefacesReady() {
    TYPE_READY = true;
    try {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { TYPE_LOADED = true; kick(); });
      } else { TYPE_LOADED = true; }
    } catch (e) { TYPE_LOADED = true; }
  }
  function loadTypefaces() {
    if (!MIX.typeLoad || loadTypefaces.tried) return;
    loadTypefaces.tried = true;
    try {
      if (!document.head) { typefacesReady(); return; }
      if (document.querySelector('link[href="' + TYPEFACE_HREF + '"]')) { typefacesReady(); return; }
      var pre = document.createElement('link');
      pre.rel = 'preconnect';
      pre.href = 'https://fonts.gstatic.com';
      pre.crossOrigin = 'anonymous';
      document.head.appendChild(pre);
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = TYPEFACE_HREF;
      l.onload = typefacesReady;
      l.onerror = typefacesReady;
      document.head.appendChild(l);
    } catch (e) { typefacesReady(); }
  }

  /* the burn's stamp palette — TYPE_BASES ids, tech / cyber lean */

  var FONTS = ['orbitron', 'staat', 'unica', 'bloc', 'chakra'];

  /* ------------------------------------------------------------------
     Font Burn factory — ported from Glitch-Revision-3.html
     (glitchFontBurnFactory, FACTORY 7 · “006 SPRAY × WORD ECHO”) together
     with the dependency closure it reads on that page:

       - the GHOST-KEY codex   (BURN_WORDS / GHOST_KEY_PHRASES / BURN_FONTS)
       - the FX harmonic key   (FX_CHORDS / FX_KEY / stepFxKey / fxTone)
       - the fxHsla / fxLerpHue colour helpers
       - the R16 source-modifier entries the factory reads
         (wordVivid / wordDark / fontScale / echoPace)
       - effectPaintAlpha with the Revision-3 paint ceiling for Font Burn

     Overlay adaptations are marked [port] inline; in short:
       - the engine calls burnFn(ctx, canvas, flavour, boost), so renderFn
         takes gctx / mainCanvas as parameters instead of page closures;
       - the per-layer spike boost feeds effectPaintAlpha's mult;
       - the source palette is synthetic (the overlay cannot sample the
         cross-origin YouTube iframe) — see stepPalette below;
       - 'Hue/Color Cycle' is fed live in tick() from the engine's colour
         cycle (rescaled to a full 0..1 swing) so the burn's black-text /
         prism / white-text phases breathe with the rest of the overlay;
       - the factory always runs persistent.

     The engine instantiates it in Layer() as layer.burnFx, next to the
     scheduled drawBurn() pass, which is unchanged.
     ------------------------------------------------------------------ */

  /* --- tiny helpers (Revision-3, verbatim) --- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const clamp01 = (v) => clamp(v, 0, 1);

  /* ================================================================ *
   *  GHOST-KEY — Font Burn Codex + Harmonic Key seed                 *
   *  ' Gh0sTs 1n Th3 Sh3lLs - D1giTaL R3BiRtHs - f34Rd0t.C0mM4 '     *
   *  Three stanzas hash to the home triad (ghost / rebirth / fear).  *
   *  The Codex is minted from the key, GitS tropes, digital-rebirth  *
   *  lexicon, fear.dot.comma punctuation, and encoded KEY-hex.       *
   * ================================================================ */
  const GHOST_KEY = 'Gh0sTs 1n Th3 Sh3lLs - D1giTaL R3BiRtHs - f34Rd0t.C0mM4';
  const GHOST_KEY_STANZAS = ['Gh0sTs 1n Th3 Sh3lLs', 'D1giTaL R3BiRtHs', 'f34Rd0t.C0mM4'];
  function ghostKeyHash(s) {
      let h = 0x811c9dc5;
      for (let i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 0x01000193);
      }
      return h >>> 0;
  }
  function ghostDeLeet(s) {
      return String(s).replace(/0/g, 'O').replace(/1/g, 'I').replace(/3/g, 'E')
          .replace(/4/g, 'A').replace(/5/g, 'S').replace(/7/g, 'T');
  }
  const GHOST_KEY_SEED = ghostKeyHash(GHOST_KEY);
  const GHOST_KEY_HUES = GHOST_KEY_STANZAS.map((st) => ghostKeyHash(st) % 360);
  /* stanza hues: Gh0sTs… → magenta-ghost, D1giTaL… → violet-rebirth,
     F34Rd0t… → phosphor-teal. Full-key hash sits at amber-fear. */
  const GHOST_KEY_HOME = GHOST_KEY_HUES[0];
  const GHOST_KEY_FEAR = GHOST_KEY_SEED % 360;

  function buildGhostKeyCodex() {
      const bag = [];
      const add = (s) => {
          if (s == null) return;
          const w = String(s).trim();
          if (w.length >= 2 && w.length <= 40) bag.push(w);
      };
      add(GHOST_KEY);
      GHOST_KEY_STANZAS.forEach((st) => {
          add(st);
          add(st.toUpperCase());
          add(ghostDeLeet(st).toUpperCase());
          st.split(/[\s.\-]+/).forEach((p) => {
              add(p);
              add(p.toUpperCase());
              add(ghostDeLeet(p).toUpperCase());
          });
      });
      [
          'GHOST', 'GHOSTS', 'Gh0sT', 'Gh0sTs', 'SHELL', 'SHELLS', 'Sh3lL', 'Sh3lLs',
          'DIGITAL', 'D1giTaL', 'REBIRTH', 'REBIRTHS', 'R3BiRtH', 'R3BiRtHs',
          'FEAR', 'F34R', 'DOT', 'D0T', 'COMMA', 'C0mM4', 'C0MM4',
          'GHOSTS IN THE SHELLS', 'DIGITAL REBIRTHS', 'FEAR.DOT.COMMA',
          'THE NET IS VAST', 'AND INFINITE'
      ].forEach(add);
      [
          'MAJOR', 'KUSANAGI', 'BATOU', 'TOGUSA', 'ARAMAKI', 'SECTION 9',
          'THERMOPTIC', 'OPTIC CAMO', 'CYBERBRAIN', 'GHOST DUB', 'GHOST HACK',
          'PUPPET MASTER', 'PROJECT 2501', 'LAUGHING MAN', 'STAND ALONE',
          'COMPLEX', 'TACHIKOMA', 'INNOCENCE', 'NET DIVE', 'BARRIER',
          'PROSTHETIC', 'CYBORG', 'SAC', 'PUBLIC SECURITY', 'FULL CYBORG',
          'BRAIN CASE', 'SOUL COPY', 'BODY BANK', 'SHELL UNIT', 'GHOST WAVE',
          'MEME', 'SURFACE', 'DEPTH', 'ACCESS', 'LOG IN', 'WIRED', 'UNWIRED'
      ].forEach(add);
      [
          'RECOMPILE', 'REINCARNATE', 'RESURRECT', 'NEW FLESH', 'BOOTSTRAP',
          'UPLOAD SOUL', 'DOWNLOAD GHOST', 'MIGRATE', 'CHRYSALIS', 'AWAKEN',
          'SECOND LIFE', 'THIRD SHELL', 'REBORN CODE', 'FRESH BOOT',
          'BACKUP GHOST', 'RESTORE POINT', 'EMERGE', 'TRANSMIGRATION',
          'DIGITAL WOMB', 'CODE BORN', 'LIVE AGAIN', 'REBOOT HEART',
          'NEW SHELL', 'OLD GHOST', 'NEXT FLESH'
      ].forEach(add);
      [
          'F34RD0T', 'C0MM4', 'FEAR.DOT', 'DOT COMMA', 'PARSE ERROR',
          'SYNTAX FEAR', 'TOKEN FEAR', 'DELIMITER', 'TERMINATOR',
          'ELLIPSIS', 'PUNCTUM', 'COMMA SPLICE', 'FEAR PROTOCOL',
          'DOT GHOST', 'COMMA 4', 'F34R NET', '404 FEAR', 'FEAR NOT FOUND',
          'COMMA BOMB', 'DOT STORM', 'f34Rd0t.C0mM4'
      ].forEach(add);
      [
          'GL1TCH', 'SIGNAL', 'NULL', 'VOID', 'SYSFAIL', 'OVERCLOCK', 'MATRIX',
          'CODEX', 'NEON', 'PRISM', 'PHOSPHOR', 'SPECTRE', 'PHREAK', 'TERMINAL',
          'PROTOCOL', 'ROOTKIT', 'FIREWALL', 'BLACK ICE', 'WIREFRAME',
          'PIXELDUST', 'SYNTHWAVE', 'DARKNET', 'HARDLINE', 'UPLINK', 'DOWNLINK',
          'REPLICANT', 'SINGULARITY', 'ENTROPY', 'ANOMALY', 'FLUX', 'CASCADE',
          'RESONANCE', 'SPECTRUM', 'HOLOGRAPHIC', 'FRACTAL', 'CIPHER', '006',
          'IMORTAL', 'RIVER', 'WIRED', 'DEFCON', 'INVERT', 'DIA', 'HUE',
          'N3ON', 'Z3R0', 'V1RUS', 'C0DEX', 'GL1TCHWAVE'
      ].forEach(add);
      const A = ['GHOST', 'SHELL', 'DIGITAL', 'REBIRTH', 'FEAR', 'DOT', 'COMMA', 'MAJOR', 'NET', 'SOUL'];
      const B = ['SHELL', 'HACK', 'DIVE', 'COPY', 'CAMO', 'WAVE', 'KEY', 'CODE', 'BORN', 'COMMA'];
      for (let i = 0; i < A.length; i++) {
          for (let j = 0; j < B.length; j++) {
              if (A[i] !== B[j]) add(A[i] + ' ' + B[j]);
          }
      }
      let h = GHOST_KEY_SEED;
      for (let i = 0; i < 24; i++) {
          h = Math.imul(h ^ (h >>> 15), 0x6D2B79F5) >>> 0;
          add('KEY-' + h.toString(16).toUpperCase().slice(0, 6));
          add('0x' + ((h >>> 8) & 0xFFFF).toString(16).toUpperCase().padStart(4, '0'));
      }
      add('RIVER LYLE R.');
      add('ANNE FABER');
      add('IMORTALIMP');
      add('006');
      const seen = Object.create(null);
      const out = [];
      for (let i = 0; i < bag.length; i++) {
          if (!seen[bag[i]]) { seen[bag[i]] = 1; out.push(bag[i]); }
      }
      return out;
  }
  const BURN_WORDS = buildGhostKeyCodex();
  const GHOST_KEY_PHRASES = GHOST_KEY_STANZAS.concat([
      GHOST_KEY, 'GHOSTS IN THE SHELLS', 'DIGITAL REBIRTHS',
      'FEAR.DOT.COMMA', 'THE NET IS VAST', 'AND INFINITE',
      'f34Rd0t.C0mM4', 'Gh0sTs 1n Th3 Sh3lLs'
  ]);

  const BURN_FONTS = ['BlackOut 2AM', 'Courier New', 'Lucida Console', 'Consolas', 'Impact', 'Arial Black', 'Georgia', 'Verdana', 'Trebuchet MS'];

  /* --- Source palette (overlay adaptation) -----------------------------
     On Glitch-Revision-3, stepPalette() samples the live video frames into
     videoPalette and the whole board reads it (R1.4–R1.8). The homepage
     overlay sits on a cross-origin YouTube iframe and cannot read those
     pixels, so this port drifts the same table on slow LFOs — every Font
     Burn behaviour that keys into the source (the wordVivid word bank,
     echoPace chase speed, fontScale sizing, effectPaintAlpha breathing,
     the FX_KEY root blend) keeps its dynamics. --- */
  const PALETTE_FALLBACK = { hue: 205, sat: 78, light: 60, energy: 0.45 };
  const videoPalette = {
    hue: PALETTE_FALLBACK.hue,
    sat: PALETTE_FALLBACK.sat,
    light: PALETTE_FALLBACK.light,
    energy: PALETTE_FALLBACK.energy,
    contrast: 0.40,   /* R1.4 SOURCE PROFILE: luminance spread */
    motion: 0.20,     /* R1.4: frame-to-frame movement */
    darkness: 0.40,   /* R1.4: 1 - light */
    colors: [],
    complement: (PALETTE_FALLBACK.hue + 180) % 360,
    accent: (PALETTE_FALLBACK.hue + 115) % 360,
    target: null,
    lastSampleAt: 0,
    valid: false
  };
  function stepPalette(now, dt) {
    const ts = now / 1000;
    videoPalette.hue = (((PALETTE_FALLBACK.hue +
      70 * Math.sin(ts / 61) + 35 * Math.sin(ts / 17.3)) % 360) + 360) % 360;
    videoPalette.sat = 62 + 22 * Math.sin(ts / 29.1 + 2.1);
    videoPalette.light = 56 + 12 * Math.sin(ts / 53.7 + 4.2);
    videoPalette.darkness = clamp01(1 - videoPalette.light / 100);
    videoPalette.energy = 0.45 + 0.28 * Math.sin(ts / 47.3 + 1.3);
    videoPalette.motion = 0.22 + 0.18 * Math.sin(ts / 13.7 + 0.7);
    videoPalette.contrast = 0.40 + 0.10 * Math.sin(ts / 37.9 + 3.1);
    videoPalette.complement = (videoPalette.hue + 180) % 360;
    videoPalette.accent = (videoPalette.hue + 115) % 360;
  }

  /* --- source-profile readers (Revision-3, verbatim) --- */
  function srcEnergyK() { return clamp(videoPalette.energy, 0.05, 1); }
  function srcAppetite() { return clamp01((videoPalette.sat - 30) / 60); }
  function srcDarkK() { return clamp01(videoPalette.darkness || 0.4); }

  /* --- R16 source-modifier table — burn-relevant subset (Revision-3) ---
     The full table on Revision-3 drives the entire effect board; only
     these four entries are read by glitchFontBurnFactory, so only they
     made the crossing. They read the synthetic palette above. */
  const R16 = {
    /* ---- R1.7: the canvas is the code ---- */
    wordVivid: () => (srcAppetite() >= srcDarkK()) ?
      (0.10 + 0.85 * srcAppetite()) : (1 - (0.10 + 0.85 * srcDarkK())),
    wordDark:  () => 1 - R16.wordVivid(),           /* Font Burn bank shares */
    fontScale: () => 0.85 + 0.30 * srcAppetite(),   /* burn word size */
    /* ---- R1.8: the heartbeat ---- */
    echoPace:  () => 1.30 - 0.55 * srcEnergyK()     /* burn echo retarget */
  };


  /* --- FX harmonic key (Revision-3, verbatim) ---------------------------
     The rotating hue chord every burn colour is drawn from; stepFxKey is
     stepped from tick() before any layer paints, exactly like the
     Revision-3 main loop does. The GlitchEngine merge below simply
     no-ops while glitch-engine.js is not loaded on the page. --- */

  const GHOST_KEY_STEPS = (function() {
      const r = GHOST_KEY_HUES[0];
      const rel = (h) => ((h - r) % 360 + 360) % 360;
      return [0, rel(GHOST_KEY_HUES[1]), rel(GHOST_KEY_HUES[2])];
  })();
  const FX_CHORDS = [
      { name: 'shell',      steps: GHOST_KEY_STEPS.slice() },
      { name: 'thermoptic', steps: [0, 140, 230] },
      { name: 'section9',   steps: [0, 90, 195] },
      { name: 'puppet',     steps: [0, 70, 175] },
      { name: 'laughing',   steps: [0, 155, 245] },
      { name: 'rebirth',    steps: [0, 115, 210] },
      { name: 'fearcomma',  steps: [0, (GHOST_KEY_FEAR % 90) + 40, 160 + (GHOST_KEY_SEED % 80)] }
  ];
  if (window.GlitchEngine && GlitchEngine.matrixChords) {
      GlitchEngine.matrixChords().forEach((ch) => {
          if (!FX_CHORDS.some((c) => c.name === ch.name)) {
              FX_CHORDS.push({ name: ch.name, steps: ch.steps.slice(), realm: ch.realm });
          } else {
              const hit = FX_CHORDS.find((c) => c.name === ch.name);
              if (hit && !hit.realm) hit.realm = ch.realm;
          }
      });
  }
  const FX_KEY = {
      root: GHOST_KEY_HUES[0],
      rootTarget: GHOST_KEY_HUES[0],
      tones: GHOST_KEY_HUES.slice(),
      toneTargets: GHOST_KEY_HUES.slice(),
      idx: 0,
      nextAt: 0,
      home: GHOST_KEY_HUES[0],
      ghostKey: GHOST_KEY
  };
  function stepFxKey(now, dt) {
      if (now >= FX_KEY.nextAt) {
          FX_KEY.nextAt = now + 7000 + Math.random() * 8000;
          /* walk the progression like a ii-V-I: step ±1, never a random
             leap — the chord always resolves somewhere near home */
          FX_KEY.idx = (FX_KEY.idx + (Math.random() < 0.62 ? 1 : -1) + FX_CHORDS.length) %
              FX_CHORDS.length;
          /* R1.5: the source's COLOR APPETITE voices the harmony — a
             vivid video pushes the wide sparkling chords (lydian,
             mixolydian, hungarian), a grey one sinks into the dark
             minors (dorian, phrygian, aeolian) */
          const ap = srcAppetite();
          const realm = (window.GlitchEngine && GlitchEngine.realmFromBoard)
              ? GlitchEngine.realmFromBoard({
                  ghost: getGhostMode(), vsync: getVsyncMode(),
                  warp: isAiWarpActive, bw: effectAlphas['B&W Invert'] || 0
              }) : 'mix';
          if (window.GlitchEngine && GlitchEngine.pickMatrixChord && Math.random() < 0.62) {
              const picked = GlitchEngine.pickMatrixChord(realm, Math.random);
              const idx = FX_CHORDS.findIndex((c) => c.name === picked.name);
              if (idx >= 0) FX_KEY.idx = idx;
          } else if (Math.random() < 0.45) {
              if (ap > 0.55) FX_KEY.idx = [1, 4, 5, 0][(Math.random() * 4) | 0]; /* thermoptic / laughing / rebirth / shell */
              else if (ap < 0.30) FX_KEY.idx = [2, 3, 6][(Math.random() * 3) | 0]; /* section9 / puppet / fearcomma */
          }
          const chord = FX_CHORDS[FX_KEY.idx];
          /* voice-leading: keep each tone's target nearest its current
             value so the transition is a slide, not a jump */
          for (let i = 0; i < 3; i++) {
              let t = (FX_KEY.rootTarget + chord.steps[i]) % 360;
              let d = t - FX_KEY.tones[i];
              if (d > 180) t -= 360;
              if (d < -180) t += 360;
              FX_KEY.toneTargets[i] = t;
          }
      }
      /* the root resolves toward the Ghost-Key home, blended with
         the sampled video palette — the ensemble plays in the key
         of the shell, colored by whatever is on screen */
      FX_KEY.rootTarget = fxLerpHue(GHOST_KEY_HUES[0], videoPalette.hue, 0.42);
      let dr = FX_KEY.rootTarget - FX_KEY.root;
      if (dr > 180) dr -= 360;
      if (dr < -180) dr += 360;
      const k = 1 - Math.exp(-0.35 * Math.max(0, dt));
      FX_KEY.root += dr * k;
      for (let i = 0; i < 3; i++) {
          let d = FX_KEY.toneTargets[i] - FX_KEY.tones[i];
          if (d > 180) d -= 360;
          if (d < -180) d += 360;
          FX_KEY.tones[i] = (FX_KEY.tones[i] + d * (1 - Math.exp(-0.9 * Math.max(0, dt))) + 720) % 360;
      }
      FX_KEY.root = (FX_KEY.root + 720) % 360;
  }

  /* --- fx colour helpers (Revision-3, verbatim) --- */

  /* chord tone i as an absolute hue, with optional small detune */
  function fxTone(i, detune) {
      const t = FX_KEY.tones[((i % 3) + 3) % 3] + (detune || 0);
      return ((t % 360) + 360) % 360;
  }
  function fxHsla(h, s, l, a) {
      return 'hsla(' + (h.toFixed(1)) + ',' + (Math.round(clamp(s, 0, 100))) + '%,' +
          (Math.round(clamp(l, 0, 100))) + '%,' + (clamp01(a)).toFixed(3) + ')';
  }

  /* v11.3 hue lerp — shortest-arc interpolation between two hues */
  /* v11.3 eased fade — used by the Gemini shrapnel */
  const smooth01 = (t) => (t <= 0) ? 0 : (t >= 1) ? 1 : t * t * (3 - 2 * t);

  function fxLerpHue(a, b, t) {
      let d = ((b - a) % 360 + 540) % 360 - 180;
      return ((a + d * clamp01(t)) % 360 + 360) % 360;
  }

  /* --- live alpha table & paint ceiling (overlay adaptation) -----------
     On Revision-3, effectAlphas mirrors the effect sliders and
     effectPaintAlpha rides the ensemble gates (fxGate / FX_ENS duck /
     SOFT-EYE / master intensity), none of which exist in the overlay
     engine — they read as 1 here. What survived verbatim: the toned-down
     v11.2 paint ceiling and the R1.5 source breathing. 'Hue/Color Cycle'
     is refreshed from the engine's hueCycle every tick, and the per-layer
     spike boost arrives as the mult argument. --- */
  var effectAlphas = { 'Hue/Color Cycle': 0.5 };
  var comboProfile = { hueOffset: 0, satMult: 1, glowMult: 1, contrastMult: 1 };
  /* 'Gemini Bomb' gets a higher peak than the 0.55 default: on Revision-3 it
     is a triggered burst that can hit full strength, and its ring gradient
     already throws most of that away — at 0.55 the twins were nearly
     invisible behind the rain. */
  var EFFECT_ALPHA_CAPS = { 'Font Burn': 0.50, 'Gemini Bomb': 0.90 };
  function effectPaintAlpha(name, strength, mult) {
    const s = Math.max(0, Math.min(1, +strength || 0));
    if (s <= 0) return 0;
    const cap = EFFECT_ALPHA_CAPS[name];
    const peak = (cap == null) ? 0.55 : cap;
    const m = (mult == null) ? 1 : Math.max(0.35, +mult || 1);
    /* R1.5: the source breathes — an energetic source lifts the paint,
       a calm one holds it back */
    const srcK = 0.86 + 0.28 * srcEnergyK();
    return Math.min(1, s * peak * m * srcK);
  }

  /* R1.6: the burn's own clock — random phase per page load (like
     Revision-3's customTime seeding), stepped in tick() */
  var customTime = Math.random() * 86400000;

  /* ============ FACTORY 7 — FONT BURN · "006 SPRAY × WORD ECHO" =====
     R1.3 total redo: the voice rotates HEAVILY between its two souls
     — the final-006 PER-FRAME WORD SPRAY (the dominant face: fresh
     mashup text, 9-font rotation, prism/black/white hue-cycle
     phases, fired every frame) and the ensemble WORD ECHO (each
     instance drifts its position with eased motion, old and new
     words CROSSFADE through each other, color anticipating the next
     chord tone). Crossfaded ~0.4s, leaning hard to 006; both faces
     still key into the Hue/Color Cycle level. */
  function glitchFontBurnFactory(getStrength, isPersistent) {
      /* R1.7: the source's COLORING picks the vocabulary — the word
         pool is banked (vivid NEON/SYNTH/CHROME vs dark
         NULL/VOID/SYSFAIL) and the live bank share sits in the
         modifier table (wordVivid / wordDark) */
      const BURN_VIVID = /NEON|N3ON|CYBER|SYNTH|CHROME|GLOW|SPECTRUM|SPECTRE|PRISM|DREAM|SUNSET|WAVE|PUNK|CITY|AURORA|PIXELDUST|RETROBYTE|RAIN|LASER|FLUX|BLOOM|LIGHT|SHELL|REBIRTH|DIGITAL|D1giTaL|THERMOPTIC|CAMO|MAJOR|TACHIKOMA|INFINITE|PHOSPHOR|HOLO/i;
      const BURN_DARK = /NULL|VOID|FAIL|CRASH|ERROR|BURN|DARK|BLACK|GHOST|ZERO|Z3R0|DELETE|WIPE|FATAL|VIRUS|V1RUS|CORRUPT|DEAD|KILL|ICE|SHADOW|DARKNET|SYSFAIL|BURNOUT|OVERLOAD|FEAR|F34R|COMMA|C0MM4|PUPPET|DUB|BARRIER|INNOCENCE|HACK/i;
      const BURN_KEYS = GHOST_KEY_PHRASES.concat(BURN_WORDS.slice(0, 96));
      const pickWord = () => {
          if (Math.random() < 0.14) {
              return BURN_KEYS[(Math.random() * Math.min(BURN_KEYS.length, 12)) | 0];
          }
          const wv = R16.wordVivid();
          for (let tries = 0; tries < 8; tries++) {
              const wd = BURN_WORDS[(Math.random() * BURN_WORDS.length) | 0];
              const viv = BURN_VIVID.test(wd), dk = BURN_DARK.test(wd);
              if (viv && !dk && Math.random() < wv) return wd;
              if (dk && !viv && Math.random() < 1 - wv) return wd;
              if (!viv && !dk && Math.random() < 0.20) return wd;
              if (viv && dk && Math.random() < 0.5) return wd;
          }
          return BURN_WORDS[(Math.random() * BURN_WORDS.length) | 0];
      };
      let wordA = pickWord(),
          wordB = pickWord();
      let blend = 1;
      let px = 0.1 + Math.random() * 0.8,
          py = 0.1 + Math.random() * 0.8;
      let tx = px,
          ty = py;
      let fontPx = 26,
          fontTarget = 26;
      let nextRetargetAt = 0;
      /* R1.3 STYLE ROTOR (user request): heavy rotation between the
         ensemble Word Echo and the final-006 per-frame word spray,
         presentation leaning hard toward 006 (~70/30 dwell). */
      let rotStyle006 = true;
      let rotUntil = 0;
      let rotW = 1;
      let lastT = null;
      /* [port] the overlay engine calls burnFn(ctx, canvas, flavour, boost) —
                   Revision-3 reads gctx / mainCanvas from the page closure */
                const renderFn = (gctx, mainCanvas, flavor, boost) => {
          const s = getStrength();
          if (s <= 0) {
              rotStyle006 = true;   // R1.3: every activation opens
              rotUntil = 0;         // on the dominant 006 face
              rotW = 1;
              lastT = null;
              return;
          }
          const w = mainCanvas.width,
              h = mainCanvas.height;
          if (w < 8 || h < 8) return;
          const now = performance.now();
          const dt = (lastT === null) ? 0.016 :
              Math.max(0.001, Math.min(0.1, (now - lastT) / 1000));
          lastT = now;
          /* R1.3 style rotor: flip the face on a clock, then ease
             the weight over ~0.4s. Entering ENS forces a fresh
             retarget so the echo announces its return. */
          if (!rotUntil) rotUntil = now + 3400 + Math.random() * 3400;
          if (now >= rotUntil) {
              rotStyle006 = !rotStyle006;
              rotUntil = now + (rotStyle006 ?
                  3400 + Math.random() * 3400 :
                  1100 + Math.random() * 1600);
              if (!rotStyle006) nextRetargetAt = now;
          }
          rotW += ((rotStyle006 ? 1 : 0) - rotW) *
              Math.min(1, dt / 0.09);
          /* STYLE '006' (dominant) — the final-006 per-frame word
             spray: a fresh phrase EVERY FRAME (half of them
             keyPhrase + ' '/'-' + phrase mashups) in a randomly
             rolled font of the 9-font set, at 10+rand·80·s px,
             at a random position, painted in the 006 3-phase
             hue-cycle coloring: Hue/Color Cycle < 0.05 → black
             text with a white bloom ('multiply'); > 0.95 → white
             text with a black bloom; else the colorProgress·360
             prism fill with an inverse-hue shadow ('lighter'). */
          if (rotW > 0.02) {
              let text;
              /* R1.7: the whole spray draws from the source-banked
                 vocabulary (pickWord) — mashups keep their shape but
                 every word answers the canvas */
              if (Math.random() < 0.5) {
                  text = pickWord() + (Math.random() < 0.5 ? ' ' : '-') + pickWord();
              } else {
                  text = pickWord();
              }
              const hcyc = effectAlphas['Hue/Color Cycle'] || 0;
              let fH = 0, fS = 0, fL = 0, sH = 0, sS = 0, sL = 0, blur, comp;
              if (hcyc < 0.05) {           // B&W low: black text, white bloom
                  fL = 0; sL = 100; blur = 2 + s * 5; comp = 'multiply';
              } else if (hcyc > 0.95) {    // B&W high: white text, black bloom
                  fL = 100; sL = 0; blur = 2 + s * 5; comp = 'lighter';
              } else {                     // prism: colorProgress wheel fill
                  const cp = (hcyc - 0.05) / 0.9;
                  /* R1.4: the prism fill bends toward the source's
                     key — a colorful video recolors the burn */
                  fH = fxLerpHue(cp * 360, videoPalette.hue, 0.32 * srcAppetite());
                  sH = (fH + 180) % 360;
                  fS = 100; fL = 50; sS = 100; sL = 50;
                  blur = 5 + s * 25; comp = 'lighter';
              }
              gctx.save();
              /* TYPE: a fresh display base per spray word, weight sliding
                 with strength, lightly tracked */
              var _sb = typePick('display', Math.random);
              var _spx = Math.round((10 + Math.random() * 80 * s) / 4) * 4;  /* 4px ladder */
              var _sw = _sb.wght[0] + (_sb.wght[1] - _sb.wght[0]) * (0.45 + 0.55 * s);
              gctx.font = typeFont(_sb, _spx, _sw, _sb.ital && Math.random() < 0.12);
              setTrack(gctx, _spx * (0.03 + Math.random() * 0.10) * MIX.burnTrack);
              gctx.textBaseline = 'alphabetic';
              gctx.globalCompositeOperation = comp;
              gctx.fillStyle = fxHsla(fH, fS, fL, Math.min(1, 0.8 * s) * rotW);
              gctx.shadowColor = fxHsla(sH, sS, sL, 1);
              gctx.shadowBlur = blur;
              gctx.fillText(text, Math.random() * w, Math.random() * h);
              gctx.restore();
          }
          /* STYLE 'ENS' (secondary) — the ensemble Word Echo. */
          if (now >= nextRetargetAt) {
              nextRetargetAt = now + (1800 + Math.random() * 2400) *
                  R16.echoPace(); /* R1.8: lively video, faster word chase */
              tx = 0.08 + Math.random() * 0.84;
              ty = 0.08 + Math.random() * 0.78;
              fontTarget = (16 + Math.random() * 52 * (0.4 + 0.6 * s)) *
                  R16.fontScale(); /* R1.7: appetite sizes the burn */
              wordA = wordB;
              /* v11.3 (006 keyPhrases mashup): two phrases welded with
                 a random ' ' or '-' separator — the old word-collision */
              wordB = (Math.random() < 0.4) ?
                  (pickWord() + (Math.random() < 0.5 ? ' ' : '-') + pickWord()) : pickWord();
              blend = 0;
          }
          blend = Math.min(1, blend + 0.022 + 0.022 * s);      // ~1s crossfade
          px += (tx - px) * 0.035;                              // eased drift
          py += (ty - py) * 0.035;
          fontPx += (fontTarget - fontPx) * 0.05;
          /* R1.3: the echo alpha rides the style weight — the ENS
             face fades out as the 006 spray takes over */
          const a = effectPaintAlpha('Font Burn', s, boost || comboProfile.glowMult || 1) *  /* [port] spike boost pumps the glow */
              (1 - rotW);
          if (a <= 0.004) return;
          const hueCycleStrength = effectAlphas['Hue/Color Cycle'] || 0;
          /* anticipate the NEXT chord tone — the word leads the harmony */
          const tone = fxTone(1 + ((Math.floor(customTime * 0.00014) + 1) % 2));
          const x = px * w,
              y = py * h;
          gctx.save();
          /* TYPE: slow rotation through the display bases (~14s per step),
             set wide and tracked — the HUD read-out voice */
          var _pool = typePool('display');
          var _eb = _pool[Math.floor(customTime * 0.00007) % _pool.length];
          gctx.font = typeFont(_eb, fontPx, null, false);
          setTrack(gctx, fontPx * 0.12 * MIX.burnTrack);
          gctx.textBaseline = 'middle';
          const drawWord = (text, alpha, ox, oy) => {
              if (alpha <= 0.01) return;
              if (hueCycleStrength < 0.05) {
                  gctx.globalCompositeOperation = 'multiply';
                  gctx.fillStyle = fxHsla(tone, 8, 4, Math.min(0.5, alpha * 0.7));
                  gctx.shadowColor = fxHsla(tone, Math.max(55, videoPalette.sat), 86, 1);
                  gctx.shadowBlur = 2 + s * 3;
              } else {
                  gctx.globalCompositeOperation = 'screen';
                  const cyc = (tone + hueCycleStrength * 360) % 360;
                  gctx.fillStyle = fxHsla(cyc, 88, 62, Math.min(0.5, alpha * 0.6));
                  gctx.shadowColor = fxHsla((cyc + 180) % 360, 70, 60, 1);
                  gctx.shadowBlur = 4 + s * 10;
              }
              gctx.fillText(_eb.upper ? String(text).toUpperCase() : text, x + ox, y + oy);
          };
          drawWord(wordA, a * (1 - blend), 0, 0);                    // fading echo
          drawWord(wordB, a * blend, Math.cos(customTime * 0.001) * 2, 0); // rising voice
          gctx.restore();
      };
      return renderFn;  /* [port] engine integration: the overlay always runs the
                   factory persistent — the timed-burst wrapper
                   (createTimedEffect) stayed on Revision-3 */
  }


  var layers = [];
  var time = 0;
  var last = 0;
  var hueCycle = 0.55;
  var running = false;
  var destroyed = false;
  var rafId = 0;
  var io = null;
  var ro = null;
  var noiseTile = null;
  var noisePat = null;

  function reduced() {
    try {
      return window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function closestId(el, id) {
    if (!el) return false;
    if (el.id === id) return true;
    return !!(el.closest && el.closest('#' + id));
  }

  function makeNoise(size) {
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var img = g.createImageData(size, size);
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function ensureStage(host) {
    if (!host) return null;
    if (host.classList.contains('index-glitch-stage')) return host;
    var stage = host.querySelector('.index-glitch-stage');
    if (stage) return stage;

    var iframe = host.querySelector('iframe');
    if (!iframe) return null;

    stage = document.createElement('div');
    stage.className = 'index-glitch-stage';
    iframe.parentNode.insertBefore(stage, iframe);
    stage.appendChild(iframe);

    var existing = host.querySelector(
      'canvas.index-glitch-canvas, canvas.glitch-canvas, #musicForCodeCanvas'
    );
    if (existing && existing.parentNode !== stage) {
      stage.appendChild(existing);
    }
    return stage;
  }

  function ensureCanvas(stage) {
    var canvas = stage.querySelector('canvas.index-glitch-canvas') ||
                 stage.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      stage.appendChild(canvas);
    }
    canvas.classList.add('index-glitch-canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.pointerEvents = 'none';
    return canvas;
  }

  function rebuildAscii(layer) {
    var spacing = layer.flavor === '006' ? 18 : 16;
    var cols = Math.max(4, Math.ceil(layer.w / spacing));
    var rows = Math.max(4, Math.ceil(layer.h / spacing));
    var live = Math.max(3, Math.round(cols * MIX.asciiRain));
    layer.ascii = {
      spacing: spacing,
      cols: cols,
      rows: rows,
      drops: new Float32Array(cols),
      glyphs: new Uint16Array(cols * rows),
      hues: new Float32Array(cols),
      live: new Uint8Array(cols),
      trails: new Uint16Array(cols),
      speeds: new Float32Array(cols),
      set: ASCII_CHARS,
      /* TYPE: a small shared rack of font strings; each stream locks a slot */
      rack: buildTypeRack((spacing - 2) * MIX.asciiScale, MIX.typeRack),
      slot: new Uint8Array(cols)
    };
    for (var c = 0; c < cols; c++) {
      /* Each falling stream locks ONE rack slot, so the rain reads as
         typographically varied while every individual stream stays
         coherent — and the live font-instance count stays bounded. */
      layer.ascii.slot[c] = (Math.random() * layer.ascii.rack.length) | 0;
      layer.ascii.drops[c] = Math.random() * rows;
      layer.ascii.hues[c] = layer.flavor === '006'
        ? (180 + Math.random() * 140) % 360
        : Math.random() * 360;
      layer.ascii.live[c] = c < live ? 1 : 0;
      /* streak length per column: 22%–72% of the column height, so drops
         trail into long vertical streams instead of teardrop comets */
      layer.ascii.trails[c] = Math.max(8, Math.round(rows * (0.22 + Math.random() * 0.50)));
      /* per-column fall speed variety */
      layer.ascii.speeds[c] = 0.75 + Math.random() * 1.15;
      for (var r = 0; r < rows; r++) {
        layer.ascii.glyphs[c * rows + r] =
          (Math.random() * layer.ascii.set.length) | 0;
      }
    }
    /* scatter live columns */
    for (var i = 0; i < cols; i++) {
      var j = (Math.random() * cols) | 0;
      var tmp = layer.ascii.live[i];
      layer.ascii.live[i] = layer.ascii.live[j];
      layer.ascii.live[j] = tmp;
    }
  }

  var BURN_MODES = ['sync', 'tight', 'wide', 'scatter', 'cluster', 'wave', 'solo', 'storm'];

  function burnText(flavor) {
    var spy = flavor === '006';
    var roll = Math.random();
    if (spy && roll < 0.38) {
      return pick(['006', 'DOUBLE-OH-SIX', 'CHANNEL 006', 'LICENSE TO GLITCH', '00-6']);
    }
    if (roll < 0.34) return pick(BURN);
    if (roll < 0.62) return pick(KEYS) + (Math.random() < 0.5 ? ' ' : '-') + pick(BURN);
    if (roll < 0.82) return pick(BURN) + '//' + pick(KEYS);
    return pick(KEYS) + ' ' + pick(BURN) + ' ' + pick(BURN);
  }

  function freshBurn(flavor, i, delay) {
    var spy = flavor === '006';
    /* TYPE: pick the base once, then draw a weight / slant / tracking
       variation out of it so no two stamps are set identically */
    var _tb = typeBase(pick(FONTS));
    var _tw = _tb.wght[0] + Math.random() * (_tb.wght[1] - _tb.wght[0]);
    return {
      text: burnText(flavor),
      x: 0.02 + Math.random() * 0.78,
      y: 0.14 + Math.random() * 0.72,
      size: 13 + Math.random() * (spy ? 48 : 38),
      font: _tb.id,
      wght: Math.round(_tw),
      italic: !!(_tb.ital && Math.random() < 0.14),
      track: 0.04 + Math.random() * 0.16,   /* em — wide HUD tracking */
      hue: spy
        ? (Math.random() < 0.5 ? 180 + Math.random() * 40 : 300 + Math.random() * 40)
        : (hueCycle * 360 + (Math.random() - 0.5) * 90 + i * 40) % 360,
      life: 0.40 + Math.random() * 1.45,
      age: -(delay || 0),
      skew: (Math.random() - 0.5) * 0.25,
      split: 1 + Math.random() * 3
    };
  }

  function applyBurnSchedule(layer) {
    var mode = pick(BURN_MODES);
    /* occasionally invent a hybrid: half-sync / half-scatter */
    if (Math.random() < 0.18) mode = 'hybrid';
    layer.burnMode = mode;
    layer.burnModeLeft = 1600 + Math.random() * 4800;

    var n;
    if (mode === 'solo') n = 1;
    else if (mode === 'storm') n = 6 + ((Math.random() * 5) | 0);
    else if (mode === 'sync' || mode === 'tight') n = 3 + ((Math.random() * 3) | 0);
    else if (mode === 'cluster') n = 4 + ((Math.random() * 3) | 0);
    else if (mode === 'wave') n = 4 + ((Math.random() * 4) | 0);
    else n = 2 + ((Math.random() * 5) | 0);

    var chorusLife = 0.55 + Math.random() * 0.7;
    var burns = [];
    var clusterCut = Math.ceil(n * 0.45);
    for (var i = 0; i < n; i++) {
      var delay = 0;
      if (mode === 'sync') delay = 0;
      else if (mode === 'tight') delay = Math.random() * 0.14;
      else if (mode === 'wide') delay = i * (0.28 + Math.random() * 0.55);
      else if (mode === 'scatter') delay = Math.random() * 1.9;
      else if (mode === 'cluster') delay = i < clusterCut ? Math.random() * 0.07 : 0.55 + Math.random() * 1.25;
      else if (mode === 'wave') delay = i * (0.10 + Math.random() * 0.10);
      else if (mode === 'solo') delay = Math.random() * 0.2;
      else if (mode === 'storm') delay = Math.random() * 0.28;
      else if (mode === 'hybrid') delay = (i % 2 === 0) ? Math.random() * 0.06 : 0.4 + Math.random() * 1.1;

      var b = freshBurn(layer.flavor, i, delay);
      if (mode === 'sync') b.life = chorusLife;
      if (mode === 'tight') b.life = chorusLife + (Math.random() - 0.5) * 0.12;
      burns.push(b);
    }
    layer.burns = burns;
  }

  function Layer(stage) {
    this.stage = stage;
    this.canvas = ensureCanvas(stage);
    this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
    this.visible = false;
    this.w = 2;
    this.h = 2;
    this.dpr = 1;
    this.ascii = null;
    this.flavor = closestId(stage, 'double-oh-six-yt') ? '006' : 'music';
    this.burns = [];
    this.burnMode = 'scatter';
    this.burnModeLeft = 0;
    this.burnFx = glitchFontBurnFactory(
      function () { return MIX.burn * MIX.master; },
      true
    );
    this.bandY = Math.random();
    this.flash = 0;
    this.phase = Math.random() * 10000;
    this.spike = 0;
    this.nextSpike = 2500 + Math.random() * 4000;
    this.tearY = Math.random();
    this.chroma = 0;
  }

  function sizeCanvas(layer) {
    var rect = layer.stage.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    var w = Math.max(2, Math.floor(rect.width * dpr));
    var h = Math.max(2, Math.floor(rect.height * dpr));
    if (layer.canvas.width !== w || layer.canvas.height !== h) {
      layer.canvas.width = w;
      layer.canvas.height = h;
      layer.w = w;
      layer.h = h;
      layer.dpr = dpr;
      rebuildAscii(layer);
    }
  }

  function drawGrain(ctx, w, h, t, s) {
    if (s <= 0.01 || !noisePat) return;
    ctx.save();
    ctx.globalAlpha = 0.22 * s * MIX.master;
    ctx.globalCompositeOperation = 'overlay';
    var ox = ((t * 0.13) | 0) % 64;
    var oy = ((t * 0.21) | 0) % 64;
    ctx.translate(-ox, -oy);
    ctx.fillStyle = noisePat;
    ctx.fillRect(0, 0, w + 64, h + 64);
    ctx.restore();
  }

  function drawScanlines(ctx, w, h, t, s) {
    if (s <= 0.01) return;
    var lh = 1 + (s * 2) | 0;
    var gap = lh * 2 + 1;
    var off = (t * 0.04 * s) % gap;
    ctx.save();
    ctx.globalAlpha = 0.50 * s * MIX.master;
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    for (var y = off - gap; y < h; y += gap) {
      ctx.fillRect(0, y, w, lh);
    }
    ctx.restore();
  }

  function drawRainbow(ctx, w, h, t, s, flavor) {
    if (s <= 0.01) return;
    var hue = (t * 0.016) % 360;
    if (flavor === '006') hue = 180 + Math.sin(t * 0.0007) * 50;
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = s * MIX.master * 0.50;
    var ang = (t * 0.00012) % 1;
    var g = ctx.createLinearGradient(
      w * ang, 0,
      w * (1 - ang), h
    );
    g.addColorStop(0, 'hsl(' + hue + ',100%,52%)');
    g.addColorStop(0.5, 'hsl(' + ((hue + 120) % 360) + ',100%,50%)');
    g.addColorStop(1, 'hsl(' + ((hue + 240) % 360) + ',100%,52%)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = s * MIX.master * 0.14;
    ctx.fillStyle = 'hsl(' + ((hue + (flavor === '006' ? 140 : 60)) % 360) + ',100%,55%)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function drawNeon(ctx, w, h, t, s, flavor) {
    if (s <= 0.01) return;
    var beat = (Math.sin(t / 240) + 1) * 0.5;
    var x = w * (0.5 + Math.sin(t / 920) * 0.20);
    var y = h * (0.5 + Math.cos(t / 1140) * 0.16);
    var r = (Math.min(w, h) * 0.22) + beat * Math.min(w, h) * 0.30 * s;
    var hue = flavor === '006'
      ? 190 + beat * 80
      : (t * 0.035) % 360;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'hsla(' + hue + ',100%,70%,' + (0.50 * s * MIX.master) + ')');
    g.addColorStop(0.5, 'hsla(' + ((hue + 70) % 360) + ',100%,58%,' + (0.18 * s * MIX.master) + ')');
    g.addColorStop(1, 'hsla(' + hue + ',100%,50%,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function drawAscii(layer, ctx, dt, boost) {
    if (MIX.ascii <= 0 || !layer.ascii) return;
    var a = layer.ascii;
    var sp = a.spacing;
    var cols = a.cols;
    var rows = a.rows;
    var set = a.set;
    var speed = 1.15 * (dt / 16.67);
    var glyphPx = Math.max(10, (sp - 2) * MIX.asciiScale);
    var aMin = MIX.asciiAlphaMin;
    var aMax = MIX.asciiAlphaMax;

    ctx.save();
    ctx.font = (a.rack && a.rack[0]) || rainFont(typeBase('courier'), glyphPx, 700, false);
    ctx.textBaseline = 'top';
    ctx.globalCompositeOperation = 'lighter';

    for (var c = 0; c < cols; c++) {
      if (!a.live[c]) continue;
      /* TYPE: the stream's own locked face — one font assignment per column,
         pulling from the shared rack so nothing new gets instantiated */
      if (a.rack) ctx.font = a.rack[a.slot[c] % a.rack.length];
      a.drops[c] += speed * a.speeds[c];
      if (a.drops[c] >= rows) {
        a.drops[c] -= rows;
        a.hues[c] = layer.flavor === '006'
          ? (170 + Math.random() * 160) % 360
          : (a.hues[c] + 35 + Math.random() * 90) % 360;
      }
      /* slow per-column hue drift so colours wander while falling */
      a.hues[c] = (a.hues[c] + 0.3 * a.speeds[c]) % 360;
      var head = a.drops[c] | 0;
      if (head >= 0 && head < rows) {
        /* the head mutates as it falls, like Revision-3's stream head —
           cheaper than pickGlyph() per frame, same distribution, because
           the pool was pre-sampled from the engine */
        a.glyphs[c * rows + head] = (Math.random() * set.length) | 0;
      }
      /* long per-column streaks — drops spread down the column instead of
         falling as short teardrop comets */
      var trail = a.trails[c];
      if (trail > rows) trail = rows;
      for (var k = 0; k < trail; k++) {
        var r = head - k;
        if (r < 0) r += rows;
        if (r < 0 || r >= rows) continue;
        var gid = a.glyphs[c * rows + r] % set.length;
        var ch = set[gid];
        var tt = trail <= 1 ? 1 : (1 - k / (trail - 1));
        var alpha = aMin + (aMax - aMin) * tt;
        /* per-glyph colour variance: each character keeps its own stable
           hue offset / saturation / lightness instead of a uniform wash */
        var jump = (gid % 23) - 11;
        if (k === 0) {
          ctx.fillStyle = 'hsla(' + ((a.hues[c] + jump + 360) % 360) + ',100%,' +
            (88 + (gid % 9)) + '%,' + alpha + ')';
        } else {
          ctx.fillStyle = 'hsla(' + ((a.hues[c] + k * 6 + jump + 360) % 360) + ',' +
            (82 + (gid % 19)) + '%,' + (46 + (gid % 23)) + '%,' + alpha + ')';
        }
        ctx.fillText(ch, c * sp, r * sp);
      }
    }
    ctx.restore();
  }

  /* =============== GEMINI BOMB · "TWIN ORBIT" · GLYPH SHRAPNEL =========
     Ported from Glitch-Revision-3.html FACTORY 8 and re-voiced in glyphs.

     What survived from Revision-3:
       - the shared drifting stage anchor (FX_ENS.stage)
       - two counter-rotating twins at orbitR = min(w,h) * (0.07 + 0.15*s)
       - spin = t * (0.45 + 0.55*s) * geminiK, geminiK riding source energy
       - twin A = root tone (fxTone 0), twin B = the fifth (fxTone 2)
       - the faint chord line strung between them
       - shrapnel ejected along the orbit tangent on a breath-keyed clock
       - 'screen' blend, eased smooth01 fade, absolute 0.3 ceiling

     What changed: Revision-3 threw rect / circle / triangle / star / cross
     shards. Here every shard is a glyph from the rain bank, and each twin
     carries its own slowly mutating glyph — the bomb is made of language.
     Motion is dt-scaled so it holds pace off 60Hz. */
  function glitchGeminiGlyphFactory(getStrength, isPersistent) {
    var shards = [];
    var nextShrapnelAt = 0;
    /* TYPE: each twin locks a display base; twin A (root) sits heavier than
       twin B (the fifth), so the pair reads as one voice at two weights */
    var twins = [
      { ch: 'G', at: 0, base: typePick('display', Math.random), wght: 0.80, ital: false },
      { ch: 'G', at: 0, base: typePick('display', Math.random), wght: 0.60, ital: false }
    ];

    function spawnShards(ax, ay, bx, by, spin, w, h, self) {
      var n = 4 + ((Math.random() * (2 + 5 * srcAppetite())) | 0);
      for (var i = 0; i < n; i++) {
        var fromA = (i % 2 === 0);
        var baseAng = fromA ? spin : (-spin + Math.PI);
        var tang = baseAng + Math.PI * 0.5 * (Math.random() < 0.5 ? 1 : -1);
        var spd = (0.01 + Math.random() * 0.022) * Math.min(w, h) * 0.6;
        /* TYPE: shards lean on the rain faces but a few come off the
           display palette, so the debris is typographically mixed */
        /* TYPE: shards ride the layer's existing rain rack and let the
           context scale them to size, rather than minting a fresh font
           string each — every distinct string costs the browser a resolved
           instance, and shards spawn continuously. Coarse size ladder. */
        var sz = 9 + Math.round(Math.random() * 5) * 3;   /* 9,12,15,18,21,24 */
        var rk = (self && self.ascii && self.ascii.rack) ? self.ascii.rack : null;
        var st = rk ? rk[(Math.random() * rk.length) | 0] : null;
        var pxm = st ? st.match(/\s([\d.]+)px/) : null;
        var basePx = pxm ? parseFloat(pxm[1]) : 0;
        shards.push({
          x: fromA ? ax : bx,
          y: fromA ? ay : by,
          vx: Math.cos(tang) * spd,
          vy: Math.sin(tang) * spd,
          ch: pickRainGlyph(fromA ? 0 : 2),
          tone: fromA ? 0 : 2,
          size: sz,
          font: st || rainFont(typeBase('courier'), sz, 700, false),
          scale: (st && basePx) ? (sz / basePx) : 1,
          rot: (Math.random() - 0.5) * 0.4,
          vrot: (Math.random() - 0.5) * 0.05,
          life: 1
        });
      }
    }

    function renderFn(progress) {
      var s = getStrength();
      if (s <= 0) { shards.length = 0; return; }
      var w = this.w, h = this.h;
      if (w < 8 || h < 8) return;

      var t = customTime * 0.001;
      /* shared stage anchor — the same slow drift every voice keys into */
      var cx = w * (0.5 + 0.16 * Math.sin(t * 0.11 + (this.phase || 0)));
      var cy = h * (0.5 + 0.13 * Math.cos(t * 0.083 + (this.phase || 0)));

      var orbitR = Math.min(w, h) * (0.07 + 0.15 * s);
      var geminiK = 0.80 + 0.40 * srcEnergyK();   /* R1.7: energy spins the twins */
      var spin = t * (0.45 + 0.55 * s) * geminiK;
      /* R1.8 breath: ~11.3s master LFO, phase-offset per layer */
      var breath = 0.5 + 0.5 * Math.sin(t * 0.556 + (this.phase || 0));
      var env = (progress !== undefined) ? smooth01(1 - progress) : (0.40 + 0.60 * breath);
      var a = effectPaintAlpha('Gemini Bomb', s * env, comboProfile.glowMult || 1);
      if (a <= 0.004) return;

      var ax = cx + Math.cos(spin) * orbitR, ay = cy + Math.sin(spin) * orbitR;
      var bx = cx + Math.cos(-spin + Math.PI) * orbitR, by = cy + Math.sin(-spin + Math.PI) * orbitR;
      var ringR = Math.min(w, h) * (0.05 + 0.06 * s);

      /* v11.3 spawn clock — breath-keyed respawn, slow */
      var nowMs = performance.now();
      if (MIX.geminiShards && nowMs >= nextShrapnelAt) {
        nextShrapnelAt = nowMs + 2400 + Math.random() * 2200 + (1 - breath) * 1800;
        spawnShards(ax, ay, bx, by, spin, w, h, this);
      }

      var g = this.ctx;
      if (!g) return;
      g.save();
      g.globalCompositeOperation = 'screen';
      g.textAlign = 'center';
      g.textBaseline = 'middle';

      /* the chord line strung between the twins */
      g.globalAlpha = Math.min(0.16, a * 0.22);
      g.strokeStyle = fxHsla(fxTone(1), 60, 74, 1);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(ax, ay);
      g.lineTo(bx, by);
      g.stroke();
      g.globalAlpha = 1;

      /* the twins — ring glow + a glyph riding each one */
      function twin(x, y, rr, tone, aa, slot) {
        var hue = fxTone(tone);
        var grd = g.createRadialGradient(x, y, 0, x, y, rr * 2.4);
        grd.addColorStop(0, fxHsla(hue, 65, 80, Math.min(0.45, aa * 0.55)));
        grd.addColorStop(0.5, fxHsla(hue, 60, 66, aa * 0.22));
        grd.addColorStop(1, fxHsla(hue, 55, 60, 0));
        g.fillStyle = grd;
        g.fillRect(x - rr * 2.4, y - rr * 2.4, rr * 4.8, rr * 4.8);

        g.globalAlpha = Math.min(0.35, aa * 0.5);
        g.strokeStyle = fxHsla(hue, 70, 78, 1);
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(x, y, rr, 0, Math.PI * 2);
        g.stroke();

        /* the glyph itself — mutates on its own slow clock */
        var tw = twins[slot];
        if (t * 1000 >= tw.at) {
          tw.at = t * 1000 + 260 + Math.random() * 900;
          tw.ch = pickRainGlyph(tone === 0 ? 0 : 2);
        }
        g.globalAlpha = Math.min(0.92, aa * 2.2);
        /* TYPE: the twin's own base, weighted inside its usable range */
        var twb = twins[slot].base;
        var twW = twb.wght[0] + (twb.wght[1] - twb.wght[0]) * twins[slot].wght;
        g.font = rainFont(twb, Math.max(10, rr * 0.95), twW, twins[slot].ital);
        g.shadowColor = fxHsla(hue, 100, 72, 1);
        g.shadowBlur = 10 + 10 * aa;
        g.fillStyle = fxHsla(hue, 88, 92, 1);
        g.fillText(tw.ch, x, y);
        g.shadowBlur = 0;
        g.globalAlpha = 1;
      }
      twin(ax, ay, ringR, 0, a, 0);
      twin(bx, by, ringR * 0.72, 2, a * 0.75, 1);

      /* v11.3 glyph shrapnel — eased fade, absolute ceiling 0.3 */
      var fscale = Math.min(3, (this.dt || 16.67) / 16.67);
      for (var i = shards.length - 1; i >= 0; i--) {
        var sh = shards[i];
        sh.x += sh.vx * fscale;
        sh.y += sh.vy * fscale;
        var damp = Math.pow(0.985, fscale);
        sh.vx *= damp;
        sh.vy *= damp;
        sh.rot += sh.vrot * fscale;
        sh.life -= (0.010 + 0.008 * s) * fscale;
        if (sh.life <= 0) { shards.splice(i, 1); continue; }
        if (Math.random() < 0.03 * fscale) sh.ch = pickRainGlyph(sh.tone);
        var hueS = fxTone(sh.tone, ((Math.random() * 10) | 0) - 5);
        g.save();
        g.translate(sh.x, sh.y);
        /* scale the context to shard size so the font string stays shared */
        if (sh.scale && Math.abs(sh.scale - 1) > 0.01) g.scale(sh.scale, sh.scale);
        g.rotate(sh.rot);
        g.globalAlpha = Math.min(0.3, a * 0.42) * smooth01(sh.life);
        g.font = sh.font || rainFont(typeBase('courier'), sh.size, 700, false);
        g.shadowColor = fxHsla(hueS, 100, 70, 1);
        g.shadowBlur = 6;
        g.fillStyle = fxHsla(hueS, 62, 78, 1);
        g.fillText(sh.ch, 0, 0);
        g.restore();
      }
      g.restore();
    }
    return renderFn;
  }

  /* per-layer Gemini instance + draw pass (sits UNDER the rain) */
  function drawGemini(layer, ctx, dt) {
    if (MIX.gemini <= 0) return;
    if (!layer.geminiFx) layer.geminiFx = glitchGeminiGlyphFactory(function () {
      return MIX.gemini * MIX.master;
    }, true);
    layer.dt = dt;
    try { layer.geminiFx.call(layer); } catch (e) { layer.geminiFx = null; }
  }

  function drawBurn(layer, ctx, dt, boost) {
    var s = MIX.burn * MIX.master * boost;
    if (s <= 0.01) return;
    if (!layer.burns || !layer.burns.length || layer.burnModeLeft <= 0) {
      applyBurnSchedule(layer);
    }
    layer.burnModeLeft -= dt;

    var w = layer.w;
    var h = layer.h;
    var chroma = MIX.chroma * s;
    var list = layer.burns;
    var mode = layer.burnMode;
    var scatter = (mode === 'scatter' || mode === 'hybrid');
    var allDone = true;

    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      b.age += dt / 1000;

      if (b.age < 0) { allDone = false; continue; }

      if (b.age >= b.life) {
        if (scatter) {
          list[i] = b = freshBurn(layer.flavor, i, Math.random() * 1.4);
          allDone = false;
          continue;
        }
        continue;
      }
      allDone = false;

      var fade = 1;
      if (b.age < 0.09) fade = b.age / 0.09;
      else if (b.age > b.life - 0.14) fade = Math.max(0, (b.life - b.age) / 0.14);

      var x = b.x * w;
      var y = b.y * h;
      var size = b.size * (layer.dpr || 1);
      ctx.save();
      var _fb = typeBase(b.font);
      var _txt = _fb.upper ? String(b.text).toUpperCase() : b.text;
      ctx.font = typeFont(_fb, size, b.wght, b.italic);
      setTrack(ctx, (b.track || 0) * size * MIX.burnTrack);
      ctx.textBaseline = 'alphabetic';
      ctx.translate(x, y);
      ctx.transform(1, 0, b.skew, 1, 0, 0);

      var split = b.split * chroma * (layer.dpr || 1) * (0.6 + boost);
      var a = 0.78 * s * fade;

      if (chroma > 0.05) {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255,0,180,' + a + ')';
        ctx.fillText(_txt, split, 0);
        ctx.fillStyle = 'rgba(0,255,255,' + a + ')';
        ctx.fillText(_txt, -split, 0);
      }

      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.fillStyle = 'hsla(' + b.hue + ',100%,62%,1)';
      ctx.shadowColor = 'hsla(' + ((b.hue + 180) % 360) + ',100%,50%,1)';
      ctx.shadowBlur = 5 + s * 16;
      ctx.fillText(_txt, 0, 0);
      ctx.restore();
    }

    if (allDone || layer.burnModeLeft <= 0) applyBurnSchedule(layer);
  }

  function drawBands(layer, ctx, t, s, boost) {
    var str = s * MIX.master * boost;
    if (str <= 0.01) return;
    var w = layer.w;
    var h = layer.h;
    layer.bandY = (layer.bandY + 0.00042 * (1 + str * 2.2)) % 1;
    var y = layer.bandY * h;
    var bh = Math.max(3, h * (0.025 + str * 0.055));
    var wobble = Math.sin(t / 170 + y / 36) * 22 * str;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.38 * str;
    ctx.fillStyle = 'rgba(255,0,180,0.5)';
    ctx.fillRect(wobble, y, w, bh);
    ctx.fillStyle = 'rgba(0,255,255,0.45)';
    ctx.fillRect(-wobble, y + 2, w, bh);
    ctx.restore();
  }

  function drawTear(layer, ctx, t, s, boost) {
    var str = s * MIX.master * boost;
    if (str <= 0.01) return;
    var w = layer.w;
    var h = layer.h;
    if (w < 8 || h < 8) return;
    layer.tearY = (layer.tearY + 0.0011 * (1 + boost)) % 1;
    var slices = 1 + ((str * 3 + (boost > 1.2 ? 2 : 0)) | 0);
    for (var i = 0; i < slices; i++) {
      var y = ((layer.tearY + i * 0.31) % 1) * h;
      var th = Math.max(2, (6 + Math.random() * 18 * str) * (layer.dpr || 1));
      if (y + th > h) continue;
      var dx = (Math.random() - 0.5) * 28 * str * (layer.dpr || 1);
      try {
        ctx.drawImage(layer.canvas, 0, y, w, th, dx, y, w, th);
      } catch (e) {}
    }
  }

  function drawFlash(layer, ctx, dt, boost) {
    var s = MIX.flash * MIX.master * boost;
    if (s <= 0.01) return;
    if (Math.random() < 0.010 * s * boost) {
      layer.flash = 0.18 + Math.random() * 0.32 * s;
      layer.flashHue = layer.flavor === '006'
        ? (Math.random() < 0.5 ? 190 : 320)
        : Math.random() * 360;
    }
    if (layer.flash <= 0) return;
    ctx.save();
    ctx.globalAlpha = layer.flash;
    ctx.fillStyle = 'hsl(' + (layer.flashHue || 0) + ',90%,88%)';
    ctx.fillRect(0, 0, layer.w, layer.h);
    ctx.restore();
    layer.flash *= Math.pow(0.84, dt / 16.67);
    if (layer.flash < 0.01) layer.flash = 0;
  }

  function paint(layer, dt, t) {
    var ctx = layer.ctx;
    var w = layer.w;
    var h = layer.h;
    if (w < 4 || h < 4 || !ctx) return;
    var localT = t + layer.phase;

    layer.nextSpike -= dt;
    if (layer.nextSpike <= 0) {
      layer.spike = 1;
      layer.nextSpike = 3200 + Math.random() * 5200;
    }
    if (layer.spike > 0) {
      layer.spike *= Math.pow(0.90, dt / 16.67);
      if (layer.spike < 0.02) layer.spike = 0;
    }
    var boost = 1 + layer.spike * MIX.spike;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (reduced()) {
      drawScanlines(ctx, w, h, localT, MIX.scanlines * 0.45);
      return;
    }

    drawRainbow(ctx, w, h, localT, MIX.rainbow, layer.flavor);
    drawNeon(ctx, w, h, localT, MIX.neon, layer.flavor);
    drawGemini(layer, ctx, dt);   /* twin orbit + glyph shrapnel, under the rain */
    drawAscii(layer, ctx, dt, boost);
    if (layer.burnFx) layer.burnFx(ctx, layer.canvas, layer.flavor, boost);
    drawBurn(layer, ctx, dt, boost);
    drawBands(layer, ctx, localT, MIX.bands, boost);
    drawTear(layer, ctx, localT, MIX.tear, boost);
    drawScanlines(ctx, w, h, localT, MIX.scanlines);
    drawGrain(ctx, w, h, localT, MIX.grain);
    drawFlash(layer, ctx, dt, boost);
  }

  function tick(now) {
    if (destroyed) return;
    running = true;
    var dt = Math.min(50, now - last || 16);
    last = now;
    time += dt;
    hueCycle = 0.5 + Math.sin(time / 7800) * 0.45;

    /* Font Burn (Revision-3 port): step the shared palette + harmonic key
       before any layer paints, like the Revision-3 main loop */
    customTime += dt;
    stepPalette(now, dt / 1000);
    /* rescaled to a full 0..1 swing (the engine's own hueCycle only travels
       0.05..0.95) so all three colour phases of the burn — black-text /
       prism / white-text — actually occur each cycle */
    effectAlphas['Hue/Color Cycle'] = 0.5 + Math.sin(time / 7800) * 0.5;
    try { stepFxKey(now, dt / 1000); } catch (e) {}

    var any = false;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      if (!L.visible) continue;
      any = true;
      paint(L, dt, time);
    }
    if (any && !document.hidden) {
      rafId = requestAnimationFrame(tick);
    } else {
      running = false;
      rafId = 0;
    }
  }

  function kick() {
    if (destroyed || running) return;
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function collectStages() {
    var seen = [];
    var out = [];
    function take(host) {
      var stage = ensureStage(host);
      if (!stage) return;
      for (var i = 0; i < seen.length; i++) {
        if (seen[i] === stage) return;
      }
      seen.push(stage);
      out.push(stage);
    }
    var nodes = document.querySelectorAll('.index-glitch-stage');
    for (var i = 0; i < nodes.length; i++) take(nodes[i]);
    take(document.getElementById('musicForCodeContainer'));
    take(document.getElementById('musicForCode-2'));
    take(document.getElementById('double-oh-six-yt'));
    return out;
  }

  function setMix(partial) {
    if (!partial) return MIX;
    for (var k in partial) {
      if (!Object.prototype.hasOwnProperty.call(MIX, k)) continue;
      var v = partial[k];
      if (typeof v === 'number') {
        /* typeRack is a COUNT of font strings, not a 0..1 mix level —
           clamping it to 2 collapsed the whole rack */
        MIX[k] = (k === 'typeRack')
          ? Math.max(1, Math.min(32, Math.round(v)))
          : Math.max(0, Math.min(2, v));
      } else if (typeof v === 'string' || typeof v === 'boolean') {
        MIX[k] = v;                       /* asciiRealm, asciiFont, ... */
        if (k === 'asciiRealm') {
          ASCII_CHARS = buildGlyphPool(MIX.asciiRealm);
          for (var i = 0; i < layers.length; i++) {
            if (layers[i].ascii) layers[i].ascii.set = ASCII_CHARS;
          }
        }
        /* typography keys change the built font strings, so re-lay them */
        if (k === 'asciiFont' || k === 'typeScale' || k === 'typeJitter' ||
            k === 'typeRack' || k === 'asciiScale') {
          for (var t = 0; t < layers.length; t++) {
            if (layers[t].ascii) rebuildAscii(layers[t]);
          }
        }
      } else if (v && typeof v === 'object' && k === 'board') {
        MIX.board = { ghost: v.ghost || MIX.board.ghost, vsync: v.vsync || MIX.board.vsync };
      }
    }
    kick();
    return MIX;
  }

  function destroy() {
    destroyed = true;
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (io) try { io.disconnect(); } catch (e) {}
    if (ro) try { ro.disconnect(); } catch (e) {}
    io = ro = null;
    layers = [];
    window.__indexGlitchLoaded = false;
  }


  var poppedLayer = null;

  function ytWin(iframe) {
    try { return iframe.contentWindow; } catch (e) { return null; }
  }

  function ytSend(iframe, payload) {
    var w = ytWin(iframe);
    if (!w || !w.postMessage) return;
    try { w.postMessage(JSON.stringify(payload), '*'); } catch (e) {}
  }

  function ytCommand(iframe, func, args) {
    ytSend(iframe, { event: 'command', func: func, args: args || [] });
  }

  function ytListen(iframe) {
    if (!iframe) return;
    ytSend(iframe, { event: 'listening', id: iframe.id || '' });
    ytCommand(iframe, 'addEventListener', ['onStateChange']);
    ytCommand(iframe, 'addEventListener', ['onReady']);
  }

  function layerForIframe(iframe) {
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].iframe === iframe) return layers[i];
    }
    return null;
  }

  function layerForSource(src) {
    for (var i = 0; i < layers.length; i++) {
      var f = layers[i].iframe;
      if (f && ytWin(f) === src) return layers[i];
    }
    return null;
  }

  var MUSIC_FOR_CODE_PLAYLIST = {
    id: 'OLAK5uy_m03HqHvTnyx_ENXw9chAJxqL3aRj9rHm0',
    title: 'Music For Code',
    artist: 'nervous_testpilot',
    tracks: [
      { id: '3SvXAN3aWno', title: 'Why You Got to Be', duration: '3:50', index: 0 },
      { id: 'BcrcGgvgCYM', title: 'Make the Symbols Work', duration: '5:18', index: 1 },
      { id: 'h01sAyVDSkE', title: 'Music for Code', duration: '5:38', index: 2 },
      { id: 'k2bXnMslTno', title: 'Wishbone', duration: '4:52', index: 3 },
      { id: '3C6CHLaZzf8', title: 'I Thought', duration: '2:23', index: 4 }
    ]
  };

  function isMusicForCodeLayer(layer) {
    if (!layer || !layer.stage) return false;
    var host = layer.stage.parentElement;
    if (host && (host.id === 'musicForCodeContainer' || host.id === 'musicForCode-2')) return true;
    if (layer.stage.id === 'musicForCodeContainer' || layer.stage.id === 'musicForCode-2') return true;
    if (layer.iframe && layer.iframe.src && layer.iframe.src.indexOf('OLAK5uy_m03HqHvTnyx_ENXw9chAJxqL3aRj9rHm0') !== -1) return true;
    return false;
  }

  function ensureTrackSelector(layer) {
    if (!isMusicForCodeLayer(layer)) return;
    if (layer.trackSelectBtn) return;
    injectDropdownStyles();

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'index-glitch-dropdown-btn';
    btn.setAttribute('aria-label', 'Select video from playlist');
    btn.setAttribute('title', 'Select video from playlist');
    btn.innerHTML = '<span class="dropdown-v-icon">V</span>';

    var panel = document.createElement('div');
    panel.className = 'index-glitch-dropdown-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Playlist Track Selection');

    var header = document.createElement('div');
    header.className = 'index-glitch-dropdown-header';
    header.innerHTML =
      '<div class="dropdown-header-top">' +
        '<span class="dropdown-tag">PLAYLIST // SELECTION</span>' +
        '<span class="dropdown-count">' + MUSIC_FOR_CODE_PLAYLIST.tracks.length + ' TRACKS</span>' +
      '</div>' +
      '<div class="dropdown-title">' + MUSIC_FOR_CODE_PLAYLIST.title + '</div>' +
      '<div class="dropdown-sub">' + MUSIC_FOR_CODE_PLAYLIST.artist + '</div>';
    panel.appendChild(header);

    var list = document.createElement('div');
    list.className = 'index-glitch-track-list';

    layer.activeTrackIndex = 0;
    var trackItems = [];

    MUSIC_FOR_CODE_PLAYLIST.tracks.forEach(function (track, idx) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'index-glitch-track-item' + (idx === 0 ? ' is-active' : '');
      item.setAttribute('data-index', idx);
      item.setAttribute('data-video-id', track.id);
      item.innerHTML =
        '<span class="track-num">0' + (idx + 1) + '</span>' +
        '<div class="track-details">' +
          '<span class="track-name">' + track.title + '</span>' +
          '<span class="track-meta">' + MUSIC_FOR_CODE_PLAYLIST.artist + '</span>' +
        '</div>' +
        '<span class="track-duration">' + track.duration + '</span>' +
        '<span class="track-indicator">▶</span>';

      item.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        selectTrack(layer, idx);
        closeDropdown(layer);
      });

      list.appendChild(item);
      trackItems.push(item);
    });
    panel.appendChild(list);

    var footer = document.createElement('div');
    footer.className = 'index-glitch-dropdown-footer';
    footer.innerHTML = '<a href="https://youtube.com/playlist?list=' + MUSIC_FOR_CODE_PLAYLIST.id + '" target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a>';
    panel.appendChild(footer);

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(layer);
    });

    layer.stage.appendChild(btn);
    layer.stage.appendChild(panel);
    layer.trackSelectBtn = btn;
    layer.dropdownPanel = panel;
    layer.trackItems = trackItems;
  }

  function openDropdown(layer) {
    if (!layer || !layer.dropdownPanel) return;
    layer.dropdownPanel.classList.add('is-open');
    if (layer.trackSelectBtn) layer.trackSelectBtn.classList.add('is-open');
  }

  function closeDropdown(layer) {
    if (!layer || !layer.dropdownPanel) return;
    layer.dropdownPanel.classList.remove('is-open');
    if (layer.trackSelectBtn) layer.trackSelectBtn.classList.remove('is-open');
  }

  function toggleDropdown(layer) {
    if (!layer || !layer.dropdownPanel) return;
    if (layer.dropdownPanel.classList.contains('is-open')) {
      closeDropdown(layer);
    } else {
      openDropdown(layer);
    }
  }

  function selectTrack(layer, trackIndex) {
    var track = MUSIC_FOR_CODE_PLAYLIST.tracks[trackIndex];
    if (!track || !layer || !layer.iframe) return;

    layer.activeTrackIndex = trackIndex;
    layer.currentPlayingId = track.id;
    updateTrackItemHighlights(layer, trackIndex);

    if (!layer.popped) {
      expandLayer(layer);
    }

    if (!layer.ytReady) {
      var baseSrc = 'https://www.youtube.com/embed/' + track.id + '?list=' + MUSIC_FOR_CODE_PLAYLIST.id + '&autoplay=1&enablejsapi=1&loop=1';
      if (layer.iframe.src !== baseSrc) {
        layer.iframe.src = baseSrc;
      }
    } else {
      ytCommand(layer.iframe, 'playVideoAt', [trackIndex]);
      ytCommand(layer.iframe, 'playVideo', []);
    }

    clearTimeout(layer.trackSwitchTimer);
    layer.trackSwitchTimer = setTimeout(function () {
      if (!layer.ytReady || (layer.currentReportedId && layer.currentReportedId !== track.id)) {
        var baseSrc = 'https://www.youtube.com/embed/' + track.id + '?list=' + MUSIC_FOR_CODE_PLAYLIST.id + '&autoplay=1&enablejsapi=1&loop=1';
        if (layer.iframe.src !== baseSrc) {
          layer.iframe.src = baseSrc;
        }
      }
    }, 700);
  }

  function updateTrackItemHighlights(layer, trackIndex) {
    if (!layer.trackItems) return;
    layer.trackItems.forEach(function (el, idx) {
      if (idx === trackIndex) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
    });
  }

  function injectDropdownStyles() {
    if (document.getElementById('index-glitch-dropdown-styles')) return;
    var style = document.createElement('style');
    style.id = 'index-glitch-dropdown-styles';
    style.textContent = [
      '.index-glitch-dropdown-btn {',
      '  position: absolute; z-index: 3; right: 12px; top: 12px; width: 30px; height: 30px;',
      '  display: none; align-items: center; justify-content: center; cursor: pointer;',
      '  border: 1px solid rgba(0, 255, 255, 0.55); background: rgba(10, 10, 16, 0.72);',
      '  color: #d8faff; font-family: "Share Tech Mono", "Courier New", monospace;',
      '  font-size: 13px; font-weight: 700; line-height: 1; border-radius: 5px; opacity: 0.30;',
      '  transition: opacity .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease;',
      '  pointer-events: auto; padding: 0;',
      '}',
      '.index-glitch-stage:hover .index-glitch-dropdown-btn { display: flex; opacity: 0.85; }',
      '.index-glitch-stage.is-popout .index-glitch-dropdown-btn { display: flex; opacity: 0.75; top: 48px; z-index: 100000; }',
      '.index-glitch-stage.is-popout .index-glitch-dropdown-btn:hover,',
      '.index-glitch-stage.is-popout .index-glitch-dropdown-btn:focus-visible,',
      '.index-glitch-dropdown-btn.is-open {',
      '  opacity: 1; background: rgba(20, 20, 30, 0.92); border-color: rgba(0, 255, 255, 0.85);',
      '  box-shadow: 0 0 10px rgba(0, 255, 255, 0.65); outline: none;',
      '}',
      '.index-glitch-dropdown-btn .dropdown-v-icon { display: inline-block; transition: transform .2s ease; }',
      '.index-glitch-dropdown-btn.is-open .dropdown-v-icon { transform: rotate(180deg); color: #ff69b4; }',
      '.index-glitch-dropdown-panel {',
      '  position: absolute; top: 86px; right: 12px; width: min(320px, calc(100vw - 24px));',
      '  max-height: calc(100vh - 100px); max-height: calc(100dvh - 100px);',
      '  background: rgba(10, 12, 22, 0.94); border: 1px solid rgba(0, 255, 255, 0.5);',
      '  box-shadow: 0 0 25px rgba(0, 255, 255, 0.35), 0 8px 32px rgba(0, 0, 0, 0.85), inset 0 0 15px rgba(255, 0, 128, 0.12);',
      '  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);',
      '  border-radius: 4px; z-index: 100001; display: none; flex-direction: column;',
      '  overflow: hidden; font-family: "Share Tech Mono", "JetBrains Mono", "Courier New", monospace;',
      '  animation: igDropdownFade .2s ease-out; pointer-events: auto;',
      '}',
      '.index-glitch-dropdown-panel.is-open { display: flex; }',
      '@keyframes igDropdownFade { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }',
      '.index-glitch-dropdown-header { padding: 12px 14px 10px; border-bottom: 1px solid rgba(0, 255, 255, 0.2); background: rgba(0, 255, 255, 0.05); }',
      '.dropdown-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }',
      '.dropdown-tag { font-size: 10px; letter-spacing: 1.5px; color: #ff69b4; font-weight: 700; text-transform: uppercase; }',
      '.dropdown-count { font-size: 10px; color: #00ffff; border: 1px solid rgba(0, 255, 255, 0.4); padding: 1px 6px; border-radius: 3px; background: rgba(0, 255, 255, 0.1); letter-spacing: 0.5px; }',
      '.dropdown-title { font-size: 15px; font-weight: 700; color: #ffffff; text-shadow: 0 0 8px rgba(0, 255, 255, 0.6); line-height: 1.2; }',
      '.dropdown-sub { font-size: 11px; color: #a0c0d0; margin-top: 2px; }',
      '.index-glitch-track-list { overflow-y: auto; max-height: 50vh; padding: 6px; display: flex; flex-direction: column; gap: 4px; }',
      '.index-glitch-track-list::-webkit-scrollbar { width: 4px; }',
      '.index-glitch-track-list::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.4); border-radius: 2px; }',
      '.index-glitch-track-item {',
      '  display: flex; align-items: center; gap: 10px; padding: 8px 10px;',
      '  background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);',
      '  border-left: 3px solid transparent; border-radius: 3px; color: #d8faff;',
      '  cursor: pointer; text-align: left; font-family: inherit; transition: all .15s ease;',
      '  width: 100%; box-sizing: border-box;',
      '}',
      '.index-glitch-track-item:hover, .index-glitch-track-item:focus-visible {',
      '  background: rgba(255, 105, 180, 0.15); border-color: rgba(255, 105, 180, 0.6);',
      '  border-left: 3px solid #ff69b4; color: #ffffff; box-shadow: 0 0 10px rgba(255, 105, 180, 0.35);',
      '  transform: translateX(2px); outline: none;',
      '}',
      '.index-glitch-track-item.is-active {',
      '  background: rgba(0, 255, 255, 0.16); border-color: rgba(0, 255, 255, 0.6);',
      '  border-left: 3px solid #00ffff; box-shadow: 0 0 12px rgba(0, 255, 255, 0.4);',
      '}',
      '.index-glitch-track-item .track-num { font-size: 12px; font-weight: 700; color: #00ffff; opacity: 0.85; min-width: 20px; }',
      '.index-glitch-track-item.is-active .track-num { color: #ff69b4; text-shadow: 0 0 6px #ff69b4; }',
      '.index-glitch-track-item .track-details { flex: 1; min-width: 0; display: flex; flex-direction: column; }',
      '.index-glitch-track-item .track-name { font-size: 13px; font-weight: 600; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.index-glitch-track-item.is-active .track-name { color: #00ffff; text-shadow: 0 0 8px rgba(0, 255, 255, 0.8); }',
      '.index-glitch-track-item .track-meta { font-size: 10px; color: #8899aa; }',
      '.index-glitch-track-item .track-duration { font-size: 11px; color: #88bbcc; margin-left: 4px; }',
      '.index-glitch-track-item .track-indicator { font-size: 11px; color: #00ffff; opacity: 0; transition: opacity .15s ease; }',
      '.index-glitch-track-item:hover .track-indicator, .index-glitch-track-item.is-active .track-indicator { opacity: 1; }',
      '.index-glitch-track-item.is-active .track-indicator { color: #ff69b4; text-shadow: 0 0 6px #ff69b4; }',
      '.index-glitch-dropdown-footer { padding: 8px 14px; border-top: 1px solid rgba(0, 255, 255, 0.15); background: rgba(0, 0, 0, 0.3); display: flex; justify-content: flex-end; }',
      '.index-glitch-dropdown-footer a { font-size: 11px; color: #00ffff; text-decoration: none; opacity: 0.8; transition: opacity .15s ease, color .15s ease; }',
      '.index-glitch-dropdown-footer a:hover { opacity: 1; color: #ff69b4; text-decoration: underline; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureCloseBtn(layer) {
    if (layer.closeBtn) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'index-glitch-close';
    btn.setAttribute('aria-label', 'Close full window player');
    btn.textContent = '✕';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      collapseLayer(layer, true);
    });
    layer.stage.appendChild(btn);
    layer.closeBtn = btn;
  }

  function ensurePopBtn(layer) {
    if (layer.popBtn) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'index-glitch-popbtn';
    btn.setAttribute('aria-label', 'Open full window player');
    btn.title = 'Full window';
    btn.textContent = '⛶';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      expandLayer(layer);
    });
    layer.stage.appendChild(btn);
    layer.popBtn = btn;
  }

  function expandLayer(layer) {
    if (!layer || layer.popped) return;
    if (poppedLayer && poppedLayer !== layer) collapseLayer(poppedLayer, true);
    var stage = layer.stage;
    var rect = stage.getBoundingClientRect();
    var ph = document.createElement('div');
    ph.className = 'index-glitch-placeholder';
    ph.style.width = '100%';
    ph.style.height = Math.max(1, rect.height) + 'px';
    if (stage.parentNode) stage.parentNode.insertBefore(ph, stage);
    layer.placeholder = ph;
    stage.classList.add('is-popout');
    document.documentElement.classList.add('index-glitch-popout');
    document.body.classList.add('index-glitch-popout');
    layer.popped = true;
    layer.visible = true;
    poppedLayer = layer;
    ensureCloseBtn(layer);
    ensureTrackSelector(layer);
    sizeCanvas(layer);
    kick();
    requestAnimationFrame(function () { sizeCanvas(layer); kick(); });
    setTimeout(function () { sizeCanvas(layer); kick(); }, 80);
  }

  function collapseLayer(layer, pause) {
    if (!layer || !layer.popped) return;
    if (layer.dropdownPanel) closeDropdown(layer);
    layer.stage.classList.remove('is-popout');
    if (layer.placeholder && layer.placeholder.parentNode) {
      layer.placeholder.parentNode.removeChild(layer.placeholder);
    }
    layer.placeholder = null;
    layer.popped = false;
    if (poppedLayer === layer) poppedLayer = null;
    if (!poppedLayer) {
      document.documentElement.classList.remove('index-glitch-popout');
      document.body.classList.remove('index-glitch-popout');
    }
    if (pause && layer.iframe) ytCommand(layer.iframe, 'pauseVideo');
    sizeCanvas(layer);
    kick();
  }

  function onYtState(layer, state) {
    if (state === 1) expandLayer(layer);          /* PLAYING */
    else if (state === 0) collapseLayer(layer, false); /* ENDED */
  }

  function parseYtMessage(data) {
    if (data == null) return null;
    if (typeof data === 'string') {
      if (data.charAt(0) !== '{' && data.charAt(0) !== '[') return null;
      try { data = JSON.parse(data); } catch (e) { return null; }
    }
    if (typeof data !== 'object') return null;
    return data;
  }

  function bindYouTubePopout() {
    layers.forEach(function (layer, i) {
      var iframe = layer.stage.querySelector('iframe');
      if (!iframe) return;
      if (!iframe.id) iframe.id = 'ig-yt-auto-' + i;
      layer.iframe = iframe;
      ensureCloseBtn(layer);
      ensurePopBtn(layer);
      ensureTrackSelector(layer);
      iframe.addEventListener('load', function () { ytListen(iframe); });
      ytListen(iframe);
    });

    /* Keep pinging until YouTube answers — first load often misses the handshake. */
    var tries = 0;
    var ping = setInterval(function () {
      tries += 1;
      layers.forEach(function (layer) {
        if (layer.iframe && !layer.ytReady) ytListen(layer.iframe);
      });
      if (tries > 20) clearInterval(ping);
    }, 500);

    if (!window.__indexGlitchYtMsg) {
      window.__indexGlitchYtMsg = true;
      window.addEventListener('message', function (e) {
        var origin = String(e.origin || '');
        if (origin.indexOf('youtube.com') === -1 && origin.indexOf('youtube-nocookie.com') === -1) return;
        var data = parseYtMessage(e.data);
        if (!data) return;
        var layer = layerForSource(e.source);
        if (!layer) return;
        layer.ytReady = true;
        var state = null;
        if (data.event === 'onStateChange') {
          state = typeof data.info === 'number' ? data.info : (data.info && data.info.playerState);
        } else if (data.event === 'infoDelivery' && data.info && typeof data.info.playerState === 'number') {
          state = data.info.playerState;
        } else if (data.event === 'initialDelivery' && data.info && typeof data.info.playerState === 'number') {
          state = data.info.playerState;
        }
        if (typeof state === 'number') onYtState(layer, state);
        if (data.info && isMusicForCodeLayer(layer)) {
          if (typeof data.info.playlistIndex === 'number' && layer.activeTrackIndex !== data.info.playlistIndex) {
            layer.activeTrackIndex = data.info.playlistIndex;
            updateTrackItemHighlights(layer, data.info.playlistIndex);
          } else if (data.info.videoData && data.info.videoData.video_id) {
            var vId = data.info.videoData.video_id;
            layer.currentReportedId = vId;
            MUSIC_FOR_CODE_PLAYLIST.tracks.forEach(function (t, idx) {
              if (t.id === vId && layer.activeTrackIndex !== idx) {
                layer.activeTrackIndex = idx;
                updateTrackItemHighlights(layer, idx);
              }
            });
          }
        }
      });
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (poppedLayer && poppedLayer.dropdownPanel && poppedLayer.dropdownPanel.classList.contains('is-open')) {
        closeDropdown(poppedLayer);
        e.stopPropagation();
        return;
      }
      if (poppedLayer) {
        collapseLayer(poppedLayer, true);
      }
    }
  });

  document.addEventListener('click', function (e) {
    if (poppedLayer && poppedLayer.dropdownPanel && poppedLayer.dropdownPanel.classList.contains('is-open')) {
      if (!poppedLayer.dropdownPanel.contains(e.target) && (!poppedLayer.trackSelectBtn || !poppedLayer.trackSelectBtn.contains(e.target))) {
        closeDropdown(poppedLayer);
      }
    }
  });


  function init() {
    loadGlyphEngine();     /* adopt the live glitch-engine.js when it lands */
    loadTypefaces();       /* fetch the webfont pack, then repaint */
    noiseTile = makeNoise(64);
    try { noisePat = document.createElement('canvas').getContext('2d').createPattern(noiseTile, 'repeat'); } catch (e) {}

    var stages = collectStages();
    stages.forEach(function (stage) {
      var layer = new Layer(stage);
      sizeCanvas(layer);
      layers.push(layer);
    });
    if (!layers.length) return;

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var en = entries[i];
          for (var j = 0; j < layers.length; j++) {
            if (layers[j].stage === en.target) {
              layers[j].visible = en.isIntersecting && en.intersectionRatio > 0.015;
            }
          }
        }
        kick();
      }, { threshold: [0, 0.015, 0.1, 0.35] });
      layers.forEach(function (L) { io.observe(L.stage); });
    } else {
      layers.forEach(function (L) { L.visible = true; });
    }

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          for (var j = 0; j < layers.length; j++) {
            if (layers[j].stage === entries[i].target) sizeCanvas(layers[j]);
          }
        }
      });
      layers.forEach(function (L) { ro.observe(L.stage); });
    } else {
      window.addEventListener('resize', function () {
        layers.forEach(sizeCanvas);
      }, { passive: true });
    }

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) kick();
    });

    window.__indexGlitch = {
      layers: layers,
      mix: MIX,
      setMix: setMix,
      kick: kick,
      destroy: destroy,
      expand: expandLayer,
      collapse: collapseLayer,
      /* --- glyph banks (glitch-engine.js TYPESETS) --- */
      glyphs: {
        bank: function () { return ASCII_CHARS.slice(); },
        count: function () { return ASCII_CHARS.length; },
        typesets: function () { return typesetInfo(); },
        realm: function () { return MIX.asciiRealm; },
        setRealm: function (r) { return setMix({ asciiRealm: r }); },
        /* is the live glitch-engine.js in charge, or the embedded copy? */
        engine: function () { return GE_READY ? 'live' : 'embedded'; },
        engineName: function () { return (GE && GE.version) || 'embedded-copy'; },
        reload: function () { loadGlyphEngine.tried = false; GE_READY = false; GE = null; loadGlyphEngine(); },
        pick: pickRainGlyph
      },
      /* --- typography --- */
      type: {
        /* every base, with the weight range it can actually use */
        bases: function () {
          return TYPE_BASES.map(function (b) {
            return { id: b.id, label: b.label, role: b.role, wght: b.wght,
                     ital: b.ital, upper: !!b.upper, scale: b.scale };
          });
        },
        /* is each face really usable right now? (webfont loaded or system) */
        check: function () {
          var out = {};
          try {
            TYPE_BASES.forEach(function (b) {
              out[b.id] = document.fonts.check('16px ' + b.stack);
            });
          } catch (e) {}
          return out;
        },
        loaded: function () { return TYPE_LOADED; },
        href: function () { return TYPEFACE_HREF; },
        reload: function () { loadTypefaces.tried = false; loadTypefaces(); },
        /* force one face across the whole rain, or '' to hand it back
           to the per-column TYPE system */
        setFont: function (stack) { return setMix({ asciiFont: stack || '' }); },
        /* re-roll the per-column faces without a resize */
        recolumn: function () {
          layers.forEach(function (L) { if (L.ascii) rebuildAscii(L); });
          kick();
        },
        /* the live rack — the distinct font strings the rain can draw */
        rack: function () {
          return layers.length && layers[0].ascii ? layers[0].ascii.rack.slice() : [];
        }
      },
      /* --- Gemini Bomb --- */
      gemini: {
        burst: function () {
          for (var i = 0; i < layers.length; i++) {
            var L = layers[i];
            if (L.geminiFx && L.geminiFx.burst) L.geminiFx.burst();
          }
          kick();
        }
      }
    };

    /* first paint even before IO callback */
    layers.forEach(function (L) {
      var r = L.stage.getBoundingClientRect();
      if (r.bottom > 0 && r.top < (window.innerHeight || 800)) L.visible = true;
    });
    kick();
    bindYouTubePopout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
