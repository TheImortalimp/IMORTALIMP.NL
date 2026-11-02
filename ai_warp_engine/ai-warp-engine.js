/* AI WARP ENGINE 6.4.16 - single-file bundle: glitch_engine + r3_gc3_factories + r3_ghost_vsync + ai_warp_engine + media_page (verbatim, in load order) */

;/* ===== glitch_engine.js ===== */
/* =============================================================================
   GLITCH ENGINE — voice format for every board effect
   Ghost-Key: 'Gh0sTs 1n Th3 Sh3lLs - D1giTaL R3BiRtHs - f34Rd0t.C0mM4'

   Format (same as B&W Invert 0 / 50 / 75 / 100):
     map(level) → { t, hueDeg, invert, rail, realm, ... }
     reality[]  → analog / physical confine (CRT, phosphor, 75% negative cap)
     virtual[]  → digital / VR confine (full wheel, data, LED, infinite net)

   Ghost : OFF · DIA · SPECTRUM · CRT · PLASMA · LED
   V-Sync: OFF · ON (scanphasing) · GHOST_OFF (vertical color sync harmony)
           · FULL (sharp)
   Matrix: ASCII rain + Chord(s) edit IRL scripts vs machine glyphs
           on the same Ghost-Key / 0-50-75-100 rails
   R2    : SOFT-EYE — crescendo scheduler, light-burst gate, audio ear,
           Neon Aurora v2, pace tables (see bottom of file)
   ============================================================================= */
(function (root) {
    'use strict';

    var LANDMARKS = [0, 0.50, 0.75, 1.0];
    var GHOST_MODES = ['OFF', 'DIA', 'SPECTRUM', 'CRT', 'PLASMA', 'LED'];
    var VSYNC_MODES = ['OFF', 'ON', 'GHOST_OFF', 'FULL'];

    var GHOST_PROFILES = {
        OFF:      { realm: 'off',     split: 0,    chan: 0,    lines: 0,    glow: 0,    warp: 0,    blur: 0,    hueA: 0,   hueB: 0,   sat: 1,    gray: 0,    crt: 0, led: 0, dia: 0 },
        DIA:      { realm: 'reality', split: 0.88, chan: 0.72, lines: 0.50, glow: 0.22, warp: 0.38, blur: 0.35, hueA: 313, hueB: 145, sat: 1.22, gray: 0.06, crt: 0, led: 0, dia: 1 },
        SPECTRUM: { realm: 'mix',     split: 1.00, chan: 0.90, lines: 1.00, glow: 0.45, warp: 0.70, blur: 1.00, hueA: 135, hueB: 75,  sat: 1.45, gray: 0.30, crt: 0, led: 0, dia: 0 },
        CRT:      { realm: 'reality', split: 0.70, chan: 0.65, lines: 1.65, glow: 0.30, warp: 0.45, blur: 0.80, hueA: 55,  hueB: 25,  sat: 0.85, gray: 0.74, crt: 1, led: 0, dia: 0 },
        PLASMA:   { realm: 'virtual', split: 1.15, chan: 1.00, lines: 0.80, glow: 0.60, warp: 0.95, blur: 1.25, hueA: 195, hueB: 100, sat: 1.85, gray: 0.16, crt: 0, led: 0, dia: 0 },
        LED:      { realm: 'virtual', split: 1.38, chan: 1.22, lines: 0.22, glow: 0.90, warp: 1.12, blur: 0.12, hueA: 0,   hueB: 120, sat: 2.05, gray: 0.00, crt: 0, led: 1, dia: 0 }
    };

    var VSYNC_METHODS = {
        OFF:       { bar: 0,    tears: 0,    roll: 0,    hum: 0,    snap: 0, sharp: 0,   scanphase: 0,   harmony: 0 },
        ON:        { bar: 1.0,  tears: 0.55, roll: 0,    hum: 0.35, snap: 0, sharp: 0.62, scanphase: 1,   harmony: 0.28 },
        GHOST_OFF: { bar: 0.35, tears: 0.12, roll: 0.14, hum: 0.18, snap: 0, sharp: 0.40, scanphase: 0.32, harmony: 1.00 },
        FULL:      { bar: 1.15, tears: 1.0,  roll: 0.85, hum: 0.85, snap: 1, sharp: 1.00, scanphase: 0.88, harmony: 0.55 }
    };

    var VSYNC_LABELS = {
        OFF:       'V-Sync: OFF',
        ON:        'V-Sync: SCANPHASING',
        GHOST_OFF: 'V-Sync: VERTICAL COLOR HARMONY',
        FULL:      'V-Sync: SHARP'
    };

    function clamp01(v) {
        v = +v || 0;
        return v < 0 ? 0 : v > 1 ? 1 : v;
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function pick(rng, arr) { return arr[(rng() * arr.length) | 0]; }

    /* ----- TYPESETS pulled from the atlas (named scripts, not a flat DB) ----- */
    var GHOST_KEY = 'Gh0sTs 1n Th3 Sh3lLs - D1giTaL R3BiRtHs - f34Rd0t.C0mM4';
    var GHOST_KEY_STANZAS = ['Gh0sTs 1n Th3 Sh3lLs', 'D1giTaL R3BiRtHs', 'f34Rd0t.C0mM4'];
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
    };
    var TYPESET_REALITY = ['latin', 'cyrillic', 'greek', 'hebrew', 'arabic', 'devanagari', 'thai', 'hangul', 'hanzi', 'javanese'];
    var TYPESET_VIRTUAL = ['katakana', 'symbols', 'superscript', 'mathoperator'];
    var TYPESET_NAMES = TYPESET_REALITY.concat(TYPESET_VIRTUAL).concat(['ghostkey']);

    function ghostKeyHash(s) {
        var h = 0x811c9dc5;
        s = String(s || '');
        for (var i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
    }
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


    /* ----- B&W Invert 0 / 50 / 75 / 100 (canonical voice map) ----- */
    function bwInvertMap(level) {
        var t = clamp01(level);
        var invert = 0;
        var rail = 'hue';
        if (t <= 0.50) {
            invert = 0;
            rail = 'hue';
        } else if (t <= 0.75) {
            invert = ((t - 0.50) / 0.25) * 0.75;
            rail = 'emission';
        } else {
            invert = 0.75;
            rail = 'emission';
        }
        var kNeg = invert / 0.75;
        return {
            t: t,
            hueDeg: t * 360,
            invert: invert,
            contrast: 1 + kNeg * 0.14,
            sat: t <= 0.50 ? (1 + t * 0.08) : Math.max(0.72, 1 - kNeg * 0.18),
            rail: rail,
            live: t > 0.008,
            negative: invert,
            realm: t <= 0.50 ? 'reality' : 'virtual',
            landmark: t < 0.25 ? 0 : t < 0.625 ? 0.50 : t < 0.875 ? 0.75 : 1
        };
    }

    function bwInvertCssParts(level) {
        var m = bwInvertMap(level);
        if (!m.live) return [];
        var parts = ['hue-rotate(' + m.hueDeg.toFixed(1) + 'deg)'];
        if (m.invert > 0.004) {
            parts.push('invert(' + m.invert.toFixed(3) + ')');
            parts.push('contrast(' + m.contrast.toFixed(3) + ')');
            parts.push('brightness(' + (1 - (m.invert / 0.75) * 0.05).toFixed(3) + ')');
            if (m.sat < 0.98) parts.push('saturate(' + m.sat.toFixed(3) + ')');
        } else if (m.sat > 1.01) {
            parts.push('saturate(' + m.sat.toFixed(3) + ')');
        }
        return parts;
    }

    /* Each voice: primary realm + reality/virtual bands (min,max for ambient / peak).
       Reality = analog confine. Virtual = digital/VR confine. */
    var VOICES = {
        'B&W Invert':      { realm: 'mix',     reality: [0.00, 0.50], virtual: [0.75, 1.00], landmarks: true },
        'Hue/Color Cycle': { realm: 'virtual', reality: [0.04, 0.35], virtual: [0.40, 1.00] },
        'HSL Rainbow':     { realm: 'virtual', reality: [0.04, 0.32], virtual: [0.35, 1.00] },
        'Neon Grad':       { realm: 'mix',     reality: [0.04, 0.40], virtual: [0.20, 0.95] },
        'Scanlines':       { realm: 'reality', reality: [0.06, 0.55], virtual: [0.00, 0.28] },
        'VHS Glitch':      { realm: 'reality', reality: [0.05, 0.60], virtual: [0.00, 0.35] },
        'Data Bands':      { realm: 'reality', reality: [0.05, 0.58], virtual: [0.08, 0.70] },
        'Flash':           { realm: 'reality', reality: [0.04, 0.48], virtual: [0.10, 0.85] },
        'Strobe':          { realm: 'reality', reality: [0.03, 0.42], virtual: [0.12, 0.90] },
        'ASCII':           { realm: 'virtual', reality: [0.02, 0.28], virtual: [0.25, 1.00] },
        'Font Burn':       { realm: 'virtual', reality: [0.02, 0.30], virtual: [0.22, 1.00] },
        'Tech Artist':     { realm: 'virtual', reality: [0.02, 0.26], virtual: [0.28, 1.00] },
        'Data Bomb':       { realm: 'virtual', reality: [0.00, 0.22], virtual: [0.18, 0.92] },
        'Ink Glyphs':      { realm: 'mix',     reality: [0.04, 0.45], virtual: [0.20, 1.00] },
        'Gemini Bomb':     { realm: 'virtual', reality: [0.02, 0.24], virtual: [0.16, 0.88] },
        'Matrix ASCII':    { realm: 'mix',     reality: [0.08, 0.58], virtual: [0.22, 1.00] },
        'Matrix Chord':    { realm: 'mix',     reality: [0.06, 0.52], virtual: [0.20, 0.95] }
    };

    function ghostProfile(mode) {
        return GHOST_PROFILES[mode] || GHOST_PROFILES.SPECTRUM;
    }

    function vsyncMethod(mode) {
        return VSYNC_METHODS[mode] || VSYNC_METHODS.OFF;
    }

    /* Board realm from Ghost × V-Sync × Warp × B&W invert. */
    function realmFromBoard(ctx) {
        ctx = ctx || {};
        var gm = ctx.ghost || 'OFF';
        var vm = ctx.vsync || 'OFF';
        var gp = ghostProfile(gm);
        var bw = bwInvertMap(ctx.bw || 0);
        var warp = !!ctx.warp;
        if (gp.realm === 'off') {
            if (warp || bw.realm === 'virtual') return 'virtual';
            if (vm === 'FULL' || vm === 'ON') return 'reality';
            return 'mix';
        }
        if (gp.realm === 'reality' && bw.rail === 'hue' && !warp) return 'reality';
        if (gp.realm === 'virtual' || gp.led || warp || bw.landmark >= 0.75) return 'virtual';
        return 'mix';
    }

    function mapVoice(name, level, ctx) {
        if (name === 'B&W Invert') return bwInvertMap(level);
        var t = clamp01(level);
        var v = VOICES[name] || { realm: 'mix' };
        var realm = realmFromBoard(ctx);
        return {
            t: t,
            hueDeg: t * 360,
            rail: t <= 0.50 ? 'reality' : (t >= 0.75 ? 'virtual' : 'mix'),
            realm: v.realm,
            boardRealm: realm,
            live: t > 0.008,
            landmark: t < 0.25 ? 0 : t < 0.625 ? 0.50 : t < 0.875 ? 0.75 : 1
        };
    }

    function confineTarget(name, value, ctx) {
        var v = VOICES[name];
        if (!v) return clamp01(value);
        var realm = realmFromBoard(ctx);
        var rng = (ctx && ctx.rng) || Math.random;
        var band;
        if (realm === 'reality') band = v.reality;
        else if (realm === 'virtual') band = v.virtual;
        else band = rng() < 0.5 ? v.reality : v.virtual;
        if (!band) return clamp01(value);
        var lo = band[0], hi = band[1];
        var out = clamp01(value);
        if (out < lo) out = lerp(out, lo, 0.65);
        if (out > hi) out = lerp(out, hi, 0.65);
        if (v.landmarks || name === 'B&W Invert') {
            var marks = realm === 'reality' ? [0, 0.50] : realm === 'virtual' ? [0.75, 1.0] : LANDMARKS;
            var nearest = marks[0], dist = Math.abs(out - marks[0]);
            for (var i = 1; i < marks.length; i++) {
                var d = Math.abs(out - marks[i]);
                if (d < dist) { dist = d; nearest = marks[i]; }
            }
            if (dist < 0.12 || rng() < 0.35) out = nearest;
        }
        return clamp01(out);
    }

    function randomizeTarget(name, rng, ctx) {
        rng = rng || Math.random;
        var v = VOICES[name] || { reality: [0.04, 0.4], virtual: [0.1, 0.9], realm: 'mix' };
        var realm = realmFromBoard(ctx);
        var band = (realm === 'virtual') ? v.virtual : (realm === 'reality') ? v.reality :
            (rng() < 0.5 ? v.reality : v.virtual);
        if (!band) band = [0.05, 0.7];
        if (v.landmarks || name === 'B&W Invert') {
            var marks = realm === 'reality' ? [0, 0.50] : realm === 'virtual' ? [0.75, 1.0] : LANDMARKS;
            return pick(rng, marks);
        }
        return lerp(band[0], band[1], rng());
    }

    function comboGhostAnchor(mode) {
        return { OFF: 0, DIA: 28, SPECTRUM: 45, CRT: 18, PLASMA: 78, LED: 96 }[mode] || 0;
    }

    function comboVsyncAnchor(mode) {
        return { OFF: 0, ON: 8, GHOST_OFF: 32, FULL: 42 }[mode] || 0;
    }


    var CHROMA_VOICES = ['Hue/Color Cycle', 'HSL Rainbow', 'Neon Grad', 'Matrix Chord'];

    function hueCycleMap(level, ctx) {
        var t = clamp01(level);
        var sat = t <= 0.50 ? (1 + t * 0.10) : Math.max(0.92, 1.06 - (t - 0.50) * 0.16);
        var contrast = t <= 0.50 ? 1 : (1 + ((t - 0.50) / 0.50) * 0.07);
        return {
            t: t,
            hueDeg: t * 360,
            sat: sat,
            contrast: contrast,
            live: t > 0.008,
            realm: t <= 0.50 ? 'reality' : 'virtual',
            landmark: t < 0.25 ? 0 : t < 0.625 ? 0.50 : t < 0.875 ? 0.75 : 1
        };
    }
    /* Hue Saturation Lighting Rainbow — three rails, same 0 / 50 / 75 / 100 landmarks.
       H = full wheel. S = chroma prism. L = lighting rainbow (paper → glare → shade). */
    function hslRainbowMap(level, ctx) {
        var t = clamp01(level);
        var hueDeg = t * 360;
        var satPct, lightPct, satFilter, brightFilter, satSwing, lightSwing, hueStops;
        if (t <= 0.50) {
            satPct = 38 + t * 84;
            lightPct = 54 + t * 12;
            satFilter = 1 + t * 0.16;
            brightFilter = 1 + t * 0.04;
            satSwing = 14 + t * 12;
            lightSwing = 8 + t * 8;
            hueStops = 3;
        } else if (t <= 0.75) {
            var u = (t - 0.50) / 0.25;
            satPct = 80 + u * 18;
            lightPct = 60 + u * 18;
            satFilter = 1.08 + u * 0.14;
            brightFilter = 1.02 + u * 0.08;
            satSwing = 20 + u * 18;
            lightSwing = 12 + u * 14;
            hueStops = 5;
        } else {
            var v = (t - 0.75) / 0.25;
            satPct = 98 - v * 6;
            lightPct = 50 + 28 * Math.sin(v * Math.PI);
            satFilter = 1.22 - v * 0.04;
            brightFilter = 1.10 - v * 0.05;
            satSwing = 38 + v * 10;
            lightSwing = 26 + v * 12;
            hueStops = 7;
        }
        return {
            t: t,
            hueDeg: hueDeg,
            satPct: satPct,
            lightPct: lightPct,
            satFilter: satFilter,
            brightFilter: brightFilter,
            satSwing: satSwing,
            lightSwing: lightSwing,
            hueStops: hueStops,
            live: t > 0.008,
            realm: t <= 0.50 ? 'reality' : 'virtual',
            landmark: t < 0.25 ? 0 : t < 0.625 ? 0.50 : t < 0.875 ? 0.75 : 1
        };
    }
    function neonFilterMap(level, ctx) {
        var t = clamp01(level);
        var realm = realmFromBoard(ctx);
        return {
            t: t,
            sat: realm === 'reality' ? 46 + t * 16 : (realm === 'virtual' ? 72 + t * 26 : 58 + t * 22),
            veil: realm === 'reality' ? 0.07 + t * 0.09 : 0.12 + t * 0.18,
            light: realm === 'reality' ? 62 : 70,
            confMix: realm === 'virtual' ? 0.42 : 0.26,
            blend: realm === 'reality' ? 'soft-light' : 'screen',
            live: t > 0.008,
            realm: realm
        };
    }
    function colorShiftMap(level, ctx) {
        var t = clamp01(level);
        var realm = realmFromBoard(ctx);
        return {
            t: t,
            opacity: realm === 'virtual' ? 0.09 + t * 0.26 : (realm === 'reality' ? 0.05 + t * 0.14 : 0.07 + t * 0.20),
            sat: realm === 'virtual' ? 88 : (realm === 'reality' ? 58 : 74),
            blend: realm === 'reality' ? 'soft-light' : 'color-dodge',
            travel: realm === 'virtual' ? 2.0 : 3.2,
            live: t > 0.006,
            realm: realm
        };
    }
    function easeHueDeg(cur, tgt, k) {
        var d = ((tgt - cur) % 360 + 540) % 360 - 180;
        return ((cur + d * k) % 360 + 360) % 360;
    }
    function isChromaVoice(name) {
        return CHROMA_VOICES.indexOf(name) !== -1;
    }
    function chromaRateScale(name) {
        return isChromaVoice(name) ? 0.52 : 1;
    }

    function ghostSkinHue(mode) {
        return { DIA: 313, SPECTRUM: 165, CRT: 42, PLASMA: 295, LED: 145 }[mode];
    }


    /* =========================================================================
       R2 — SOFT-EYE · CRESCENDO · AUDIO EAR   (baked into the ghost)
       "an easier viewer experience": slow, gradual transitions between voices,
       no regular strobing/flashing, fewer Matrix bursts — with only OCCASIONAL
       'WILD' crescendos where the chroma voices (HSL Rainbow, Neon Aurora,
       Hue Cycle, B&W Dia shader) spin fast and Ghost/V-Sync fire colour +
       dia-inverted LIGHT BURSTS.  Timing comes from BOTH the audio ear
       (spectral flux onsets, energy build / drop) and the video canvas.
       ========================================================================= */
    var SOFT_EYE = {
        version: 'softeye-1',
        pace: {
            retargetK:   2.35,   /* randomizer retarget cadence × (slower)          */
            holdK:       1.90,   /* timing-mode hold ×                              */
            rateK:       0.55,   /* slider travel rate × in calm                    */
            wildRateK:   1.35,   /* slider travel rate × inside a crescendo         */
            restK:       1.80,   /* aesthetic-burst rest / hold ×                   */
            sparkK:      2.10,   /* auto-glitch spark interval ×                    */
            timedDurK:   1.55,   /* timed one-shot effect lifetime ×                */
            presetTravelMs:     [3400, 5400],
            presetTravelWildMs: [1300, 2000],
            presetAutoMs:       [9500, 19500],
            presetAutoWildMs:   [3800, 6600]
        },
        /* per-mode travel scale (the old 5 / 7 / 12 / 9 were the slams) */
        timingScale: { smooth: 0.90, snap: 2.0, flipflop: 1.7, burst: 2.6, linger: 0.35, flipBurst: 3.2, zoomBurst: 3.0 },
        wildOnlyModes: ['flipBurst', 'zoomBurst', 'burst'],
        calmModes: ['smooth', 'linger', 'flipflop', 'smooth', 'linger'],
        lightVoices: ['Flash', 'Strobe'],
        busyVoices:  ['ASCII', 'Matrix ASCII', 'Data Bomb', 'Gemini Bomb', 'Matrix Chord'],
        /* randomizer target ceilings while calm (k = 0). Lerped to 1.0 at k = 1. */
        calmCaps:  { 'Flash': 0.16, 'Strobe': 0.10, 'Matrix ASCII': 0.40, 'ASCII': 0.46, 'Data Bomb': 0.42, 'Gemini Bomb': 0.42, 'Matrix Chord': 0.55 },
        /* paint-alpha multipliers while calm (lerped to 1.0 at k = 1) */
        paintCalm: { 'Flash': 0.50, 'Strobe': 0.30, 'Matrix ASCII': 0.62, 'ASCII': 0.72, 'Data Bomb': 0.80, 'Gemini Bomb': 0.80 },
        /* Strobe pulse rate — kept BELOW the 3 Hz photosensitive band, always */
        strobeHz:  { calm: 1.05, wild: 2.60 },
        /* chroma spin multipliers (HSL Rainbow prism, Neon flow, Hue Cycle) */
        chromaSpin: { calm: 0.55, wild: 3.40, beatLift: 0.45 },
        /* Matrix ASCII stream population × */
        matrixK:   { calm: 0.48, wild: 1.0 },
        crescendo: {
            calmMs:    [40000, 85000],
            swellMs:   [2800, 5000],
            wildMs:    [4500, 9500],
            releaseMs: [5200, 8800],
            minGapMs:  30000,
            dropGapMs: 12000,       /* a real heard DROP may come sooner than the timer gap */
            presetWildOdds: 0.30,   /* a busy preset pick may CALL a crescendo */
            audioBuildOdds: 0.22,   /* per-second odds while the ear hears a build */
            audioDropOdds:  0.65    /* odds a heard DROP calls one (if gap allows) */
        },
        burst: {
            calmGapMs: [16000, 38000],
            wildGapMs: [1500, 3400],
            calmDurMs: [1700, 2600],
            wildDurMs: [650, 1250],
            calmOdds:  0.45,       /* calm timer fires a soft one only sometimes */
            onsetGate: 0.62        /* ear onset needed to pull a burst forward   */
        }
    };

    function smoothstep01(u) { u = clamp01(u); return u * u * (3 - 2 * u); }
    function easeInOutCubic01(t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function rangeRoll(rng, r) { return r[0] + (rng || Math.random)() * (r[1] - r[0]); }

    /* ----- CRESCENDO — calm → swell → wild → release → calm -------------- */
    function createCrescendo(opts) {
        opts = opts || {};
        var rng = opts.rng || Math.random;
        var C = Object.assign({}, SOFT_EYE.crescendo, opts);
        var st = { phase: 'calm', k: 0, since: 0, until: 0, source: 'boot', count: 0, lastWildEnd: -1e9, strength: 1, breath: 0 };
        function enter(phase, now, range) { st.phase = phase; st.since = now; st.until = now + rangeRoll(rng, range); }
        function begin(now, source, strength) {
            st.source = source || 'timer';
            st.strength = strength == null ? 1 : Math.max(0.35, clamp01(strength));
            st.count++;
            enter('swell', now, C.swellMs);
        }
        var api = {
            state: st,
            k: function () { return st.k; },
            phase: function () { return st.phase; },
            isWild: function () { return st.k > 0.5; },
            gapOk: function (now, gapMs) { return (now - st.lastWildEnd) >= (gapMs || C.minGapMs); },
            /* ask for a crescendo (preset roulette / audio). true = accepted */
            request: function (now, source, strength, odds) {
                if (st.phase !== 'calm') return false;
                if (!api.gapOk(now)) return false;
                if (odds != null && rng() >= odds) return false;
                begin(now, source, strength);
                return true;
            },
            step: function (now, dt, ear) {
                if (!st.until) { st.since = now; st.until = now + rangeRoll(rng, C.calmMs); }
                var u;
                if (st.phase === 'calm') {
                    st.k += (0 - st.k) * Math.min(1, dt * 1.2);
                    if (ear && ear.active && ear.ready) {
                        if (ear.drop > 0.48 && api.gapOk(now, C.dropGapMs) && rng() < C.audioDropOdds * ear.drop) { begin(now, 'audio-drop', 0.7 + 0.3 * ear.drop); ear.drop = 0; ear.buildCredit = 0; }
                        else if (api.gapOk(now) && ear.buildCredit > 3.5) { begin(now, 'audio-build', 0.6 + 0.4 * ear.build); ear.buildCredit = 0; }
                        else if (api.gapOk(now) && ear.build > 0.6 && rng() < C.audioBuildOdds * dt * ear.build) { begin(now, 'audio-build', 0.6 + 0.4 * ear.build); ear.buildCredit = 0; }
                    }
                    if (st.phase === 'calm' && now >= st.until) begin(now, 'timer', 0.55 + 0.45 * rng());
                } else if (st.phase === 'swell') {
                    u = clamp01((now - st.since) / (st.until - st.since));
                    st.k = smoothstep01(u) * st.strength;
                    if (u >= 1) enter('wild', now, C.wildMs);
                } else if (st.phase === 'wild') {
                    u = clamp01((now - st.since) / (st.until - st.since));
                    st.breath = 0.5 + 0.5 * Math.sin(now * 0.0019);
                    st.k = st.strength * (0.88 + 0.12 * st.breath);
                    if (u >= 1) enter('release', now, C.releaseMs);
                } else { /* release */
                    u = clamp01((now - st.since) / (st.until - st.since));
                    st.k = st.strength * (1 - easeInOutCubic01(u));
                    if (u >= 1) { st.phase = 'calm'; st.lastWildEnd = now; st.since = now; st.until = now + rangeRoll(rng, C.calmMs); st.k = 0; }
                }
                return st.k;
            }
        };
        return api;
    }

    /* ----- LIGHT-BURST GATE — colour / dia-inverted light events ---------- */
    function createBurstGate(opts) {
        opts = opts || {};
        var rng = opts.rng || Math.random;
        var B = Object.assign({}, SOFT_EYE.burst, opts);
        var st = { active: false, kind: 'dia', start: 0, dur: 1, amp: 0, nextAt: 0, count: 0, p: 0, env: 0, lastFire: -1e9 };
        function fire(now, k, ear) {
            var wild = k > 0.5;
            st.active = true;
            st.start = now;
            st.dur = rangeRoll(rng, wild ? B.wildDurMs : B.calmDurMs);
            st.amp = wild ? (0.7 + 0.3 * k) : (0.35 + 0.25 * rng());
            var r = rng();
            st.kind = r < 0.42 ? 'dia' : r < 0.78 ? 'color' : 'both';
            if (ear && ear.active && ear.bass > 0.6 && rng() < 0.5) st.kind = 'dia';
            st.count++;
            st.lastFire = now;
            st.nextAt = now + st.dur + rangeRoll(rng, wild ? B.wildGapMs : B.calmGapMs);
        }
        return {
            state: st,
            env: function () { return st.active ? st.env : 0; },
            kind: function () { return st.active ? st.kind : null; },
            step: function (now, dt, k, ear) {
                if (!st.nextAt) st.nextAt = now + rangeRoll(rng, B.calmGapMs) * 0.6;
                if (st.active) {
                    st.p = clamp01((now - st.start) / st.dur);
                    st.env = Math.pow(Math.sin(st.p * Math.PI), 1.35) * st.amp;   /* soft bell — never a cut */
                    if (st.p >= 1) { st.active = false; st.env = 0; }
                    return st.env;
                }
                var wild = k > 0.5;
                var onset = ear && ear.active ? ear.onset : 0;
                if (wild) {
                    /* entering a crescendo pulls a calm-scheduled gate forward */
                    if (st.nextAt - now > B.wildGapMs[1]) st.nextAt = now + rangeRoll(rng, B.wildGapMs) * 0.4;
                    if (now >= st.nextAt) fire(now, k, ear);
                    else if (onset > B.onsetGate && now - st.lastFire > B.wildGapMs[0]) fire(now, k, ear);
                } else if (st.nextAt - now < B.calmGapMs[0] * 0.35 && st.lastFire > now - B.wildGapMs[1] * 2) {
                    /* just left a crescendo: re-space onto the calm gap */
                    st.nextAt = now + rangeRoll(rng, B.calmGapMs) * 0.6;
                } else if (now >= st.nextAt) {
                    /* calm: only occasionally, and a heard drop makes it likely */
                    var odds = B.calmOdds + (ear && ear.active ? 0.45 * ear.drop : 0);
                    if (rng() < odds) fire(now, k, ear);
                    else st.nextAt = now + rangeRoll(rng, B.calmGapMs) * 0.5;
                }
                return 0;
            },
            /* value for the B&W Dia rail during a burst: rides cur → 0.75 (negative
               light emission) and back along the bell; if cur < 0.5 it passes the
               0.50 dia landmark on the way — the inverted light burst */
            diaValue: function (cur, env) {
                var top = 0.75;
                var e = clamp01(env);
                return cur + (top - cur) * e;
            }
        };
    }

    /* ----- AUDIO EAR — pure DSP on analyser byte arrays -------------------- */
    function createEar(opts) {
        opts = opts || {};
        var st = {
            active: false, source: 'none',
            level: 0, bass: 0, mid: 0, treb: 0,
            onset: 0, beat: 0, flux: 0, fluxAvg: 0.02,
            energy: 0, energyFast: 0, energyLong: 0, build: 0, drop: 0, buildCredit: 0,
            peakHold: 0.2, quietFor: 0, tempoK: 1, lastOnsetAt: -1e9, ibi: 0.5,
            warm: 0, ready: false
        };
        var prev = null;
        var hist = [];   /* 1 s ring of energy for drop detection */
        function bandMean(arr, lo, hi) {
            var s = 0, n = 0;
            for (var i = lo; i < hi && i < arr.length; i++) { s += arr[i]; n++; }
            return n ? s / (n * 255) : 0;
        }
        function commonDynamics(now, dt) {
            /* AGC — normalise against a slow peak hold so quiet mixes still read */
            st.peakHold = Math.max(st.level, st.peakHold - dt * 0.05, 0.12);
            var norm = clamp01(st.level / st.peakHold);
            st.energyFast += (norm - st.energyFast) * Math.min(1, dt / 0.35);
            st.energy += (norm - st.energy) * Math.min(1, dt / 2.2);
            st.energyLong += (norm - st.energyLong) * Math.min(1, dt / 14);
            hist.push({ t: now, e: st.energyFast });
            while (hist.length && now - hist[0].t > 2600) hist.shift();
            /* the quietest moment in the last ~2.6 s (skipping the newest 250 ms) */
            var quiet = 1, qi;
            for (qi = 0; qi < hist.length; qi++) { if (now - hist[qi].t > 400 && hist[qi].e < quiet) quiet = hist[qi].e; }
            if (quiet === 1) quiet = st.energyFast;
            /* warm-up: the AGC needs ~3.5 s before build / drop are trusted */
            st.warm += dt;
            st.ready = st.warm > 3.5;
            /* DROP: fast energy leaps well above the quietest recent moment
               (breakdown → drop) — decays on its own */
            var dropRaw = st.ready ? clamp01((st.energyFast - quiet - 0.12) / 0.24) * clamp01((0.55 - quiet) / 0.30 + 0.2) : 0;
            st.drop = Math.max(dropRaw, st.drop - dt * 1.6);
            /* BUILD: sustained rise of the 2 s energy over the 14 s baseline; a credit
               accumulates while the build holds (≈7 s of strong build = a call) and
               bleeds away when the music settles */
            st.build = st.ready ? clamp01((st.energy - st.energyLong - 0.06) / 0.20) * clamp01(st.energy / 0.55) : 0;
            st.buildCredit = st.ready ? Math.max(0, st.buildCredit + dt * ((st.build - 0.45) * (st.build > 0.45 ? 1 : 1.8))) : 0;
            if (norm < 0.12) st.quietFor += dt; else st.quietFor = 0;
            st.beat = Math.max(st.onset, st.beat - dt * 2.8);
        }
        return {
            state: st,
            /* live analyser feed — freq: Uint8Array(freqBinCount), time: Uint8Array(fftSize) */
            feedSpectrum: function (freq, time, dt, sampleRate, source) {
                var n = freq.length;
                var nyq = (sampleRate || 44100) / 2;
                var binHz = nyq / n;
                var b1 = Math.max(2, Math.round(160 / binHz)), b2 = Math.round(2000 / binHz), b3 = Math.min(n, Math.round(9000 / binHz));
                st.bass = bandMean(freq, 1, b1);
                st.mid = bandMean(freq, b1, b2);
                st.treb = bandMean(freq, b2, b3);
                var lvl;
                if (time && time.length) {
                    var acc = 0;
                    for (var i = 0; i < time.length; i += 2) { var v = (time[i] - 128) / 128; acc += v * v; }
                    lvl = Math.sqrt(acc / (time.length / 2)) * 2.2;
                } else lvl = st.bass * 0.5 + st.mid * 0.35 + st.treb * 0.15;
                st.level += (clamp01(lvl) - st.level) * Math.min(1, dt * 12);
                /* spectral flux → adaptive onset */
                if (!prev || prev.length !== n) { prev = new Float32Array(n); }
                var flux = 0, cnt = Math.min(n, b3);
                for (var j = 1; j < cnt; j++) { var d = freq[j] / 255 - prev[j]; if (d > 0) flux += d; prev[j] = freq[j] / 255; }
                flux /= cnt;
                st.flux = flux;
                st.fluxAvg += (flux - st.fluxAvg) * Math.min(1, dt / 1.6);
                var raw = flux / (st.fluxAvg * 1.55 + 0.004);
                var onset = clamp01((raw - 1) / 1.6);
                var now = performance.now();
                if (onset > 0.55 && now - st.lastOnsetAt > 180) {
                    var ibi = (now - st.lastOnsetAt) / 1000;
                    if (ibi < 2.5) st.ibi += (ibi - st.ibi) * 0.25;
                    st.lastOnsetAt = now;
                }
                st.onset = onset;
                st.tempoK = clamp01(0.5 / Math.max(0.25, st.ibi)) + 0.5;
                if (st.source !== (source || 'media')) { st.warm = 0; st.ready = false; st.peakHold = 0.2; hist.length = 0; }
                st.active = true;
                st.source = source || 'media';
                commonDynamics(now, dt);
                return st;
            },
            /* no audio reachable (YouTube iframe) — synthesize a pseudo-ear from the
               video canvas profile so the same automation still has a pulse */
            feedVisual: function (energy, motion, dt) {
                var lvl = clamp01(0.55 * (energy || 0) + 0.45 * (motion || 0));
                var jump = clamp01((lvl - st.level) * 5.5);
                st.level += (lvl - st.level) * Math.min(1, dt * 3);
                st.bass = clamp01(energy || 0); st.mid = lvl; st.treb = clamp01(motion || 0);
                st.onset = jump;
                st.active = false;
                st.source = 'canvas';
                commonDynamics(performance.now(), dt);
                return st;
            },
            reset: function () { prev = null; hist.length = 0; st.active = false; st.source = 'none'; st.onset = st.beat = st.drop = st.build = st.buildCredit = 0; st.warm = 0; st.ready = false; st.peakHold = 0.2; }
        };
    }

    /* ----- pace helpers the board reads every frame ------------------------ */
    function softCap(name, target, k) {
        var cap = SOFT_EYE.calmCaps[name];
        if (cap == null) return target;
        var lim = lerp(cap, 1, clamp01(k));
        return target > lim ? lim : target;
    }
    function softPaintK(name, k) {
        var c = SOFT_EYE.paintCalm[name];
        if (c == null) return 1;
        return lerp(c, 1, clamp01(k));
    }
    function softTimingScale(mode) {
        var v = SOFT_EYE.timingScale[mode];
        return v == null ? 1 : v;
    }
    function softPickMode(mode, k, rng) {
        rng = rng || Math.random;
        if (SOFT_EYE.wildOnlyModes.indexOf(mode) !== -1 && k < 0.5) {
            return pick(rng, SOFT_EYE.calmModes);
        }
        if (mode === 'snap' && k < 0.5 && rng() < 0.6) return 'smooth';
        return mode;
    }
    function softRateK(k) { return lerp(SOFT_EYE.pace.rateK, SOFT_EYE.pace.wildRateK, clamp01(k)); }
    function softCadenceK(k) { return lerp(SOFT_EYE.pace.retargetK, 1.0, clamp01(k)); }
    function softStrobeHz(k) { return lerp(SOFT_EYE.strobeHz.calm, SOFT_EYE.strobeHz.wild, clamp01(k)); }
    function softChromaSpin(k, beat) {
        return lerp(SOFT_EYE.chromaSpin.calm, SOFT_EYE.chromaSpin.wild, clamp01(k)) * (1 + SOFT_EYE.chromaSpin.beatLift * clamp01(beat || 0));
    }
    function softMatrixK(k) { return lerp(SOFT_EYE.matrixK.calm, SOFT_EYE.matrixK.wild, clamp01(k)); }
    function softGroupAllowed(effects, k) {
        for (var i = 0; i < effects.length; i++) {
            if (SOFT_EYE.lightVoices.indexOf(effects[i]) !== -1 && k < 0.45) return false;
        }
        return true;
    }

    /* ----- NEON AURORA v2 — the better Neon Grad ---------------------------
       Ribbons of light (2 calm / 3 wild) flowing across the frame on a slow
       angle, additive, with soft blooms at the ribbon crests.  `flow` is the
       ribbon travel (deg/s of phase) — rapid inside a crescendo. */
    function neonAuroraMap(level, ctx, k, beat) {
        var t = clamp01(level);
        k = clamp01(k || 0);
        var realm = realmFromBoard(ctx);
        var base = neonFilterMap(level, ctx);
        var spin = softChromaSpin(k, beat);
        return {
            t: t, realm: realm, live: t > 0.008,
            ribbons: k > 0.5 ? 3 : 2,
            flow: (14 + 26 * t) * spin,                       /* phase deg/s */
            angleRate: (1.6 + 2.2 * k) * (0.6 + 0.4 * t),     /* deg/s of the band angle */
            width: 0.22 + 0.16 * t + 0.10 * k,                /* ribbon half-width (frame frac) */
            sat: Math.min(100, base.sat + 18 + 14 * k),
            light: base.light + 4 + 6 * k,
            veil: base.veil * (0.9 + 0.5 * k),
            blend: realm === 'reality' ? 'soft-light' : 'screen',
            glowBlend: 'lighter',
            confMix: base.confMix,
            hueSpread: 38 + 42 * k,                            /* deg between ribbon hues */
            bloomA: 0.55 + 0.35 * k
        };
    }

    
    /* =========================================================================
       DEEPSEEK MACHINE PRESETS & ARCHETYPE GENERATOR (80 PRESETS)
       ========================================================================= */
    function mulberry32(a) {
        return function() {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function leetEncodeWord(word) {
        return String(word).toUpperCase()
            .replace(/A/g, '4').replace(/E/g, '3').replace(/I/g, '1')
            .replace(/O/g, '0').replace(/S/g, '5');
    }

    var CODEX_WORDS = [
        'RIVER', 'GLITCH', 'CANVAS', 'DEEPSEEK', 'WIRED', 'DEFCON', 'GHOST',
        'VSYNC', 'WARP', 'FADE', 'WHITE', 'BLACK', 'PROTOCOL', 'MACHINE',
        'PRESET', 'SPECTRUM', 'PLASMA', 'CRT', 'INVERT', 'EMISSION', 'DIA',
        'HUE', 'LOOP', 'CODEX', 'FONTBURN', '006', 'IMORTAL', 'REVISION',
        'NEON', 'PHOSPHOR', 'PRISM', 'VOID', 'SIGNAL', 'TAPE', 'AURORA',
        'MATRIX', 'CHORD', 'TYPESET', 'KATAKANA', 'CYRILLIC', 'HANZI', 'RAIN',
        'PULSAR', 'CHROMA', 'HARMONY', 'KINETIC', 'TERRESTRIAL', 'CYBER', 'ZENITH'
    ];

    function mintPresetTag(rng, used) {
        var codex = CODEX_WORDS;
        var pick = function () { return codex[(rng() * codex.length) | 0] || 'SIGNAL'; };
        for (var n = 0; n < 24; n++) {
            var a = pick(), b = pick();
            var forms = [
                a + ' ' + b,
                leetEncodeWord(a) + ' ' + b,
                a + '-' + b,
                '006 ' + a,
                a + ' ' + leetEncodeWord(b),
                b + ' ' + a,
                a + ' CODEX',
                'DIA ' + a,
                'GHOST ' + a,
                a + ' SHELL',
                'REBIRTH ' + b,
                'f34R ' + a
            ];
            var tag = forms[(rng() * forms.length) | 0];
            if (tag.length > 28) tag = (a + ' ' + b).slice(0, 28);
            if (!used[tag] && a !== b) { used[tag] = 1; return tag; }
        }
        var fallback = 'SEED ' + ((rng() * 0xFFFF) | 0).toString(16).toUpperCase();
        used[fallback] = 1;
        return fallback;
    }

    function randBwLevel(rng) {
        var roll = rng();
        if (roll < 0.22) return 0;
        if (roll < 0.48) return 0.50;
        if (roll < 0.82) return 0.75;
        return 1.0;
    }

    function buildMachinePresets(customSeed) {
        var CORE_FX = [
            'Neon Grad', 'Scanlines', 'Data Bands', 'Flash', 'HSL Rainbow', 'ASCII',
            'Font Burn', 'Strobe', 'Gemini Bomb', 'Tech Artist', 'VHS Glitch',
            'Data Bomb', 'Ink Glyphs', 'Matrix ASCII', 'Matrix Chord',
            'B&W Invert', 'Hue/Color Cycle'
        ];
        var GC3_FX = CORE_FX.map(function (name) { return name + ' GC#(3)'; });
        var FX = CORE_FX.concat(GC3_FX);
        var coreName = function (name) { return String(name).replace(/ GC#\(3\)$/, ''); };
        var WARP_MODES = [
            'liquid', 'prism', 'breathe', 'fold', 'aurora', 'vortex',
            'cybergrid', 'hyperdrive', 'kaleidoscope', 'quantum', 'ripple', 'analog_crt',
            'newblue_roll', 'newblue_active_cam', 'newblue_shear', 'newblue_wiggle',
            'newblue_zoom_blur', 'newblue_video_tile', 'newblue_twirl', 'newblue_light_ring',
            'newblue_earthquake', 'newblue_water_drop', 'newblue_rgb_shift', 'newblue_quad_mirror',
            'newblue_fish_eye', 'newblue_pinch', 'newblue_solarize', 'newblue_cathode_beam', 'newblue_neon_edges'
        ];
        var GHOST_MODES_LIST = ['OFF', 'DIA', 'SPECTRUM', 'CRT', 'PLASMA', 'LED'];
        var VSYNC_MODES_LIST = ['OFF', 'ON', 'GHOST_OFF', 'FULL'];

        // Fresh dynamic seed on every invocation/reload unless explicit seed passed
        var seed = (typeof customSeed === 'number' && customSeed !== 0xF34D07)
            ? customSeed
            : (((Date.now() ^ (Math.random() * 0xFFFFFF))) >>> 0) || 1;
        var rng = mulberry32(seed);
        var usedTags = Object.create(null);

        var DEFAULT_MASTERS = {
            effectIntensity: 0.85, motionScale: 0.80, blendSoftness: 0.50,
            continualSpeed: 0.85, autoGlitchPower: 0.70, boardEnergy: 0.65
        };

        var out = {};
        for (var i = 0; i < 80; i++) {
            var name = 'Deepseek-' + (i + 1);
            var tag = (i === 0) ? 'OLD SOUL' : mintPresetTag(rng, usedTags);
            var personality = rng();
            var alphas = {};
            for (var f = 0; f < FX.length; f++) alphas[FX[f]] = 0;

            var warpMode, warpStrength, masterOpacity;

            if (i === 0) {
                // Preserved baseline seed anchor: Deepseek-1 · OLD SOUL
                alphas['Neon Grad'] = 0.18;
                alphas['Scanlines'] = 0.14;
                alphas['Flash'] = 0.20;
                alphas['HSL Rainbow'] = 0.18;
                alphas['ASCII'] = 0.22;
                alphas['Font Burn'] = 0.26;
                alphas['Strobe'] = 0.24;
                alphas['Gemini Bomb'] = 0.20;
                alphas['Tech Artist'] = 0.18;
                alphas['VHS Glitch'] = 0.18;
                alphas['Data Bands'] = 0.12;
                // OLD SOUL remains calm, but now starts as a true two-bank scene.
                CORE_FX.forEach(function (fx, index) {
                    if (alphas[fx] > 0) alphas[fx + ' GC#(3)'] = +Math.min(0.18, alphas[fx] * (0.52 + (index % 4) * 0.04)).toFixed(3);
                });

                warpMode = 'liquid';
                warpStrength = 0.45;
                masterOpacity = 0.88;
            } else {
                // Presets 2..80: every scene starts with a paired core/R3 anchor.
                // The rotating anchor guarantees that all 17 new GC#(3) factories
                // receive preset coverage across each machine-preset bank.
                var anchor = CORE_FX[(i - 1) % CORE_FX.length];
                var anchorR3 = anchor + ' GC#(3)';
                alphas[anchor] = +(0.13 + rng() * 0.22).toFixed(3);
                alphas[anchorR3] = +(0.10 + rng() * 0.20).toFixed(3);
                // Add 1–4 restrained accents from either voice bank.
                var voiceCount = 1 + ((rng() * 4) | 0);
                var shuffled = FX.slice().sort(function () { return rng() - 0.5; });

                for (var v = 0; v < voiceCount; v++) {
                    var fx = shuffled[v];
                    var baseFx = coreName(fx);
                    if (fx === anchor || fx === anchorR3) continue;
                    if (baseFx === 'B&W Invert') {
                        alphas[fx] = rng() < 0.25 ? 0.22 : 0;
                    } else if (baseFx === 'Flash' || baseFx === 'Strobe') {
                        alphas[fx] = +(0.07 + rng() * 0.20).toFixed(3); // Soft/tasteful
                    } else {
                        alphas[fx] = +(0.08 + rng() * 0.28).toFixed(3);
                    }
                }

                // AI WARP randomized level and mode
                warpMode = WARP_MODES[(rng() * WARP_MODES.length) | 0];
                warpStrength = +(0.18 + rng() * 0.44).toFixed(2);
                masterOpacity = +(0.72 + rng() * 0.20).toFixed(2);
            }

            var gm = (i === 0) ? 'OFF' : (rng() < 0.35 ? 'OFF' : GHOST_MODES_LIST[(rng() * GHOST_MODES_LIST.length) | 0]);
            var vm = (i === 0) ? 'OFF' : (rng() < 0.35 ? 'OFF' : VSYNC_MODES_LIST[(rng() * VSYNC_MODES_LIST.length) | 0]);
            var gl = gm === 'OFF' ? 0 : +(0.18 + rng() * 0.45).toFixed(3);
            var vl = vm === 'OFF' ? 0 : +(0.20 + rng() * 0.45).toFixed(3);

            var ag = i !== 0 && rng() < 0.25 ? 1 : 0;
            var cr = i === 0 ? 0 : (rng() < 0.40 ? 1 : 0);
            var ta = i !== 0 && rng() < 0.22 ? 1 : 0;
            var am = i !== 0 && rng() < 0.25 ? 1 : 0;
            var softEye = i !== 0 && rng() < 0.20 ? (rng() < 0.5 ? 'SURGE' : 'CRESCENDO') : 'OFF';

            var lockMap = {};
            if (i !== 0 && rng() < 0.15) {
                var lk = FX[(rng() * FX.length) | 0];
                if (alphas[lk] > 0.10) lockMap[lk] = true;
            }

            var masterMix = Object.assign({}, DEFAULT_MASTERS);
            if (i !== 0) {
                masterMix.effectIntensity = +(0.50 + rng() * 0.35).toFixed(3);
                masterMix.motionScale = +(0.45 + rng() * 0.45).toFixed(3);
                masterMix.blendSoftness = +(0.30 + rng() * 0.50).toFixed(3);
                masterMix.continualSpeed = +(0.65 + rng() * 0.55).toFixed(3);
                masterMix.autoGlitchPower = +(0.40 + rng() * 0.45).toFixed(3);
                masterMix.boardEnergy = +(0.35 + rng() * 0.45).toFixed(3);
            }

            out[name] = {
                machine: true,
                tag: tag,
                seed: seed,
                alphas: alphas,
                masterOpacity: masterOpacity,
                ghostLevel: gl,
                ghostMode: gm,
                vsyncMode: vm,
                aiWarp: true,
                warpMode: warpMode,
                warpStrength: warpStrength,
                vsyncLevels: {
                    ON: vm === 'ON' ? vl : 0.50,
                    GHOST_OFF: vm === 'GHOST_OFF' ? vl : 0.55,
                    FULL: vm === 'FULL' ? vl : 0.60
                },
                masterControls: masterMix,
                locks: lockMap,
                toggles: {
                    autoGlitch: !!ag,
                    continualRandomize: !!cr,
                    timedAutomation: !!ta,
                    automatedMasters: !!am,
                    softEyeMode: softEye,
                    aiWarp: true
                }
            };
        }
        return out;
    }

    root.GlitchEngine = {
        LANDMARKS: LANDMARKS,
        GHOST_MODES: GHOST_MODES,
        VSYNC_MODES: VSYNC_MODES,
        GHOST_PROFILES: GHOST_PROFILES,
        VSYNC_METHODS: VSYNC_METHODS,
        VSYNC_LABELS: VSYNC_LABELS,
        VOICES: VOICES,
        bwInvertMap: bwInvertMap,
        bwInvertCssParts: bwInvertCssParts,
        mapVoice: mapVoice,
        ghostProfile: ghostProfile,
        vsyncMethod: vsyncMethod,
        realmFromBoard: realmFromBoard,
        confineTarget: confineTarget,
        randomizeTarget: randomizeTarget,
        comboGhostAnchor: comboGhostAnchor,
        comboVsyncAnchor: comboVsyncAnchor,
        ghostSkinHue: ghostSkinHue,
        GHOST_KEY: GHOST_KEY,
        GHOST_KEY_STANZAS: GHOST_KEY_STANZAS,
        TYPESETS: TYPESETS,
        TYPESET_REALITY: TYPESET_REALITY,
        TYPESET_VIRTUAL: TYPESET_VIRTUAL,
        TYPESET_NAMES: TYPESET_NAMES,
        ghostKeyHash: ghostKeyHash,
        ghostKeyMeta: ghostKeyMeta,
        matrixChords: matrixChords,
        pickMatrixChord: pickMatrixChord,
        pickTypeset: pickTypeset,
        pickGlyph: pickGlyph,
        glyphBank: glyphBank,
        typesetInfo: typesetInfo,
        hueCycleMap: hueCycleMap,
        hslRainbowMap: hslRainbowMap,
        neonFilterMap: neonFilterMap,
        colorShiftMap: colorShiftMap,
        easeHueDeg: easeHueDeg,
        CHROMA_VOICES: CHROMA_VOICES,
        isChromaVoice: isChromaVoice,
        chromaRateScale: chromaRateScale,
        /* R2 SOFT-EYE */
        SOFT_EYE: SOFT_EYE,
        createCrescendo: createCrescendo,
        createBurstGate: createBurstGate,
        createEar: createEar,
        softCap: softCap,
        softPaintK: softPaintK,
        softTimingScale: softTimingScale,
        softPickMode: softPickMode,
        softRateK: softRateK,
        softCadenceK: softCadenceK,
        softStrobeHz: softStrobeHz,
        softChromaSpin: softChromaSpin,
        softMatrixK: softMatrixK,
        softGroupAllowed: softGroupAllowed,
        neonAuroraMap: neonAuroraMap,
        smoothstep01: smoothstep01,
        easeInOutCubic01: easeInOutCubic01,
        mulberry32: mulberry32,
        buildMachinePresets: buildMachinePresets,
        mintPresetTag: mintPresetTag,
        version: 'engine-2.0-softeye'
    };
})(typeof window !== 'undefined' ? window : this);

;/* ===== r3_gc3_factories.js ===== */
/**
 * GC#(3) FACTORY BANK — Glitch Revision 3 integration
 * Source factory block: https://www.imortalimp.nl/glitch-canvas-html/Glitch-Revision-3.html
 *
 * Important: the factory source between the two R3 markers below is copied verbatim
 * from Revision 3. This bridge deliberately does not rewrite the R3 factory bodies.
 * It gives them an isolated Canvas/WebGL runtime and maps their original names onto
 * the separate " GC#(3)" voice rails in AI Warp Engine.
 *
 * No SVG filters, filter URLs, or SVG scripting are used here.
 */
(function (root) {
    'use strict';

    const GC3_SUFFIX = ' GC#(3)';
    const GC3_BASE_VOICES = [
        'ASCII', 'B&W Invert', 'Data Bands', 'Data Bomb', 'Flash', 'Font Burn',
        'Gemini Bomb', 'HSL Rainbow', 'Hue/Color Cycle', 'Ink Glyphs',
        'Matrix ASCII', 'Matrix Chord', 'Neon Grad', 'Scanlines', 'Strobe',
        'Tech Artist', 'VHS Glitch'
    ];

    /* R3 runtime bridge — only the host bindings live outside the verbatim block. */
    let gctx = null;
    let mainCanvas = null;
    let effectAlphas = Object.create(null);
    let masterOpacity = 0.95;
    let masterControls = { effectIntensity: 1, motionScale: 0.8, blendSoftness: 0.5, boardEnergy: 0.65 };
    let isAiWarpActive = true;
    let videoPalette = { hue: 205, sat: 65, light: 45, energy: 0.5, motion: 0.1, darkness: 0.55 };
    let comboProfile = { glowMult: 1, satMult: 1, contrastMult: 1 };
    let customTime = 0;
    let beat = 0;
    let currentEngine = null;
    let currentDepth = 1;
    let activeEffects = []; // only used by R3's one-shot helper; GC#(3) runs persistent factories.
    const renderBudget = { asciiCells: 21000 };
    /* Host scratch surface used by the Data Bands / VHS Glitch GC#(3) slicers. */
    const scratch = root.document && root.document.createElement ? root.document.createElement('canvas') : { width: 0, height: 0 };
    const scratchCtx = scratch.getContext ? scratch.getContext('2d') : null;
    /* Film-grain glow multiplier for the Data Bands slicer; follows the Motion master. */
    const motionGlow = () => 0.85 + 0.30 * Math.max(0, Math.min(1, masterControls.motionScale));
    /* R3's Data Bomb and ASCII factory block expects the original glyph atlas.
       This self-contained atlas is host plumbing; the R3 factory source below
       remains byte-for-byte unchanged. */
    function buildR3Atlas() {
        const chars = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+-=[]{}<>?/|░▒▓█▄▀■□△▲▽▼◆◇○●アイウエオカキクケコサシスセソ');
        const tile = 32, cols = 16, rows = Math.ceil(chars.length / cols);
        if (!root.document || typeof root.document.createElement !== 'function') {
            return { chars, count: chars.length, tile, canvas: null };
        }
        const canvas = root.document.createElement('canvas');
        canvas.width = cols * tile;
        canvas.height = rows * tile;
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            chars.forEach((ch, index) => ctx.fillText(ch, (index % cols) * tile + tile / 2, ((index / cols) | 0) * tile + tile / 2));
        }
        return { chars, count: chars.length, tile, canvas };
    }
    const atlas = buildR3Atlas();
    let tintAtlas = null;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, +v || 0));
    const clamp01 = (v) => clamp(v, 0, 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeExp = (a, b, dt, rate) => a + (b - a) * (1 - Math.exp(-Math.max(0, rate || 1) * Math.max(0, dt || 0)));

    function srcEnergyK() { return clamp(videoPalette.energy, 0.05, 1); }
    function srcMotionK() { return clamp(videoPalette.motion, 0, 1); }
    function srcAppetite() { return clamp01((videoPalette.sat - 30) / 60); }
    function srcSpreadK() { return clamp(1.15 - videoPalette.sat / 140, 0.35, 1.05); }
    function srcDarkK() { return clamp01(videoPalette.darkness); }
    const R16 = {
        bwInvCap: () => 0.75, scanGap: () => 2.5 * (1 - srcMotionK()),
        strobeP: () => 0.9 * (1.25 - 0.45 * srcEnergyK()), strobeW: () => 0.85 + 0.30 * srcEnergyK(),
        bandWob: () => 0.80 + 0.40 * srcMotionK(), vhsAmp: () => 0.80 + 0.20 * srcEnergyK() + 0.20 * srcMotionK(),
        bombReach: () => 0.85 + 0.30 * srcAppetite(), inkScale: () => 0.85 + 0.30 * srcDarkK(),
        sigilBias: () => 0.30 + 0.40 * srcDarkK(), neonVeil: () => 0.80 + 0.40 * srcDarkK(),
        wordVivid: () => srcAppetite(), fontScale: () => 0.85 + 0.30 * srcAppetite(),
        spinK: () => 0.62 + 1.12 * srcMotionK(), rainbowSat: () => 0.85 + 0.30 * srcAppetite(),
        asciiGap: () => 1.18 - 0.36 * srcAppetite(), geminiK: () => 0.80 + 0.40 * srcEnergyK(),
        inkLife: () => 0.75 + 0.50 * srcDarkK(), echoPace: () => 1.30 - 0.55 * srcEnergyK()
    };
    const SOFT = { ok: false, k: 1, beat: 0 };
    function softK() { return SOFT.k; }
    function getGhostMode() {
        return currentEngine ? currentEngine.ghostModes[currentEngine.ghostModeIndex] : 'OFF';
    }
    function getVsyncMode() {
        return currentEngine ? currentEngine.vsyncModes[currentEngine.vsyncModeIndex] : 'OFF';
    }
    function boardFilterCtx() {
        return { ghost: getGhostMode(), vsync: getVsyncMode(), warp: isAiWarpActive, bw: effectAlphas['B&W Invert'] || 0 };
    }
    function bwInvertMap(level) {
        if (root.GlitchEngine && typeof root.GlitchEngine.bwInvertMap === 'function') return root.GlitchEngine.bwInvertMap(level);
        const t = clamp01(level);
        return { hueDeg: t * 360, invert: t > 0.5 ? ((t - 0.5) / 0.5) * 0.75 : 0, sat: 1, contrast: 1, live: t > 0.008 };
    }
    function fxConfluenceHue(wobble) {
        const h = videoPalette.hue + (effectAlphas['Hue/Color Cycle'] || 0) * customTime * 0.018 + (wobble || 0);
        return ((h % 360) + 360) % 360;
    }
    function fxConfluenceHsl() { return { h: fxConfluenceHue(0), s: clamp(videoPalette.sat, 20, 100), l: clamp(videoPalette.light, 20, 80) }; }
    function fxConfluenceSat() { return fxConfluenceHsl().s; }
    function fxConfluenceLight() { return fxConfluenceHsl().l; }
    function effectLiveStrength(name) { return clamp01(effectAlphas[name] || 0) * masterOpacity; }
    function effectPaintAlpha(name, strength, mult) {
        return clamp01(strength) * masterOpacity * clamp(masterControls.effectIntensity, 0.1, 1.5) *
            Math.max(0.35, +mult || 1) * currentDepth;
    }

    /* ===== BEGIN VERBATIM GLITCH REVISION 3 FACTORY SOURCE ===== */
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

            /* ------------------------------------------------------------------ *
             *  7. FX HARMONIC ENSEMBLE — complete effects-factory rewrite          *
             *  Every effect is now a VOICE in one ensemble:                        *
             *   • THE KEY — a rotating chord of hues (root / third / fifth). Every  *
             *     color in every effect is drawn from the live chord, and chords    *
             *     voice-lead (each tone eases independently) every 7-15s, so all    *
             *     effects transition their palettes INTO each other, together.      *
             *   • THE BREATH — one slow master LFO (~11s). All voices swell with    *
             *     it; nothing jumps, everything breathes.                          *
             *   • RESONANCE — each voice has a fixed phase offset in a master       *
             *     ~23s cycle: voices take turns swelling while their neighbours     *
             *     recede — amplitude is HANDED OFF, never collided.                 *
             *   • CROSSTALK — every voice registers presence each frame; a busy     *
             *     board gently ducks everyone (auto-mix), and a voice that spikes   *
             *     earns a short "answer" from its resonance neighbour —             *
             *     call & response.                                                 *
             *   • THE STAGE — one shared anchor drifting on a slow Lissajous       *
             *     orbit. Neon blooms, Flash pulses, the Gemini twins and Data       *
             *     bursts all key into the SAME geometry, so they visibly relate.    *
             *   • TONED DOWN BY DESIGN — soft blend modes, low ceilings, eased      *
             *     envelopes, coherent sinusoidal motion. No hard cuts anywhere.     *
             * ------------------------------------------------------------------ */

            /* --- timed wrapper: hands the render fn its 0..1 progress so bursts
                   can fade in and out instead of popping ---------------------- */
            function createTimedEffect(fn, duration) {
                if (duration === undefined) duration = Math.random() < 0.38 ? 900 + Math.random() * 1100 : 2800 + Math
                    .random() * 2600;
                /* R1.5: a busy source snaps the triggers tighter — bursts end
                   sooner on energetic footage so the board stays articulate */
                duration *= (1.15 - 0.28 * srcEnergyK() - 0.10 * srcMotionK());
                /* R2 SOFT-EYE: one-shots live longer when calm so they read as a
                   swell rather than a pop */
                if (window.GlitchEngine && GlitchEngine.SOFT_EYE) duration *= lerp(GlitchEngine.SOFT_EYE.pace.timedDurK, 1, softK());
                const start = performance.now();
                let self;
                self = function() {
                    const elapsed = performance.now() - start;
                    if (elapsed > duration) {
                        const i = activeEffects.indexOf(self);
                        if (i > -1) activeEffects.splice(i, 1);
                        return;
                    }
                    fn(Math.min(1, elapsed / duration));
                };
                return self;
            }

            /* ================= THE KEY — Ghost-Key home triad ==================
             *  Stanza hues are the home chord:
             *    Gh0sTs 1n Th3 Sh3lLs  → GHOST_KEY_HUES[0]  (ghost magenta)
             *    D1giTaL R3BiRtHs      → GHOST_KEY_HUES[1]  (rebirth violet)
             *    f34Rd0t.C0mM4         → GHOST_KEY_HUES[2]  (fear phosphor)
             *  Modes walk around that home; the root always resolves toward
             *  the Ghost-Key, blended with the source palette.
             * ================================================================== */
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
            function fxLerpHue(a, b, t) {
                let d = ((b - a) % 360 + 540) % 360 - 180;
                return ((a + d * clamp01(t)) % 360 + 360) % 360;
            }

            /* v11.3 OLD-SOUL BLEND (006 lineage) — compact multi-alphabet glyph
               bank merged from the old ASCII scatter's sets (latin / katakana /
               cyrillic / greek / hebrew / symbols), used by the Chord Rain
               glyph-shimmer veil. */
            const FX_GLYPH_BANK = ('ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
                '0123456789!@#$%^&*()_+-=[]{}<>?/\\|' +
                'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
                'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ' +
                'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ' +
                'אבגדהוזחטיכלמנסעפצקרשת' +
                '░▒▓█│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬▀▄▌▐■□◆◇▲▼●○★☆').split('');

            /* ================= THE ENSEMBLE — breath / resonance / stage ====== */
            const FX_VOICE_NAMES = ['Neon Grad', 'Scanlines', 'Flash', 'HSL Rainbow', 'ASCII',
                'Font Burn', 'Strobe', 'Gemini Bomb', 'Tech Artist', 'Data Bands', 'VHS Glitch',
                'Data Bomb', 'Ink Glyphs', 'Matrix ASCII', 'Matrix Chord'
            ];
            /* fixed resonance offsets — neighbours in this list answer each other */
            const FX_RESOFF = {
                'Neon Grad': 0.00, 'Strobe': 0.09, 'Scanlines': 0.17, 'Data Bands': 0.26,
                'Flash': 0.34, 'Font Burn': 0.42, 'Tech Artist': 0.50, 'HSL Rainbow': 0.59,
                'Gemini Bomb': 0.67, 'ASCII': 0.76, 'VHS Glitch': 0.84, 'Data Bomb': 0.92,
                'Ink Glyphs': 0.96, 'Matrix ASCII': 0.80, 'Matrix Chord': 0.88
            };
            const FX_ENS = {
                breath: 0.5,          // slow master LFO 0..1 (~11s at rest)
                breathPhase: 0,       // R1.8: accumulated phase — the tempo can bend
                resPhase: 0,          // master resonance cycle 0..1 (~23s)
                stage: { x: 0.5, y: 0.5, r: 0.30 }, // shared anchor (normalized)
                presence: {},         // name -> smoothed live strength
                prevPresence: {},     // for attack detection (call & response)
                duck: {},             // name -> auto-mix multiplier
                answer: { name: null, until: 0 },   // the voice currently "answering"
                crowd: 0
            };
            /* presence is also tracked for the two filter-path effects (B&W Invert,
               Hue/Color Cycle) so canvas voices can KEY into them — but they are not
               canvas voices: they never gate, duck, or answer. */
            const FX_PRESENCE_NAMES = FX_VOICE_NAMES.concat(['B&W Invert', 'Hue/Color Cycle']);
            function stepFxEnsemble(now, dt) {
                const t = customTime * 0.001;
                /* R1.8: the source sets the board's HEARTBEAT — the master
                   breath LFO's tempo rides energy (accumulated phase, so the
                   tempo change never jumps the curve): calm video breathes
                   ~15s, lively video ~8.7s */
                FX_ENS.breathPhase = (FX_ENS.breathPhase + (dt / 11.3) * R16.breathRate()) % 1;
                FX_ENS.breath = 0.5 + 0.5 * Math.sin(FX_ENS.breathPhase * Math.PI * 2 + 0.7);
                /* R1.5: the source sets the ensemble's pulse — an energetic,
                   moving video speeds the resonance hand-offs between voices */
                const resRate = 0.72 + 0.55 * srcEnergyK() + 0.28 * srcMotionK();
                FX_ENS.resPhase = (FX_ENS.resPhase + (dt / 23.5) * resRate) % 1;
                /* the stage drifts on a slow Lissajous figure — every keyed voice
                   (bloom / flash / twins / burst) follows the same anchor */
                /* R1.8: busy video wanders the stage wider, calm video stays
                   home — amplitude-only, so the anchor never jumps */
                const stageK = R16.stageK();
                FX_ENS.stage.x = 0.5 + 0.30 * stageK * Math.sin(t * 0.21 + 1.1);
                FX_ENS.stage.y = 0.5 + 0.24 * stageK * Math.sin(t * 0.13 + 2.6);
                FX_ENS.stage.r = 0.24 + 0.13 * FX_ENS.breath + 0.09 * beat;

                /* presence: smoothed live strength of each voice (timed triggers,
                   auto glitch and continual randomization all land here) */
                let sum = 0;
                let caller = null, callerRise = 0;
                for (let i = 0; i < FX_PRESENCE_NAMES.length; i++) {
                    const name = FX_PRESENCE_NAMES[i];
                    let live = 0;
                    try { live = clamp01(typeof effectLiveStrength === 'function' ?
                        effectLiveStrength(name) : (smoothedStrength[name] || 0)); } catch (e) { live = 0; }
                    const prev = FX_ENS.presence[name] || 0;
                    const next = easeExp(prev, live, Math.max(0, dt), 2.4);
                    FX_ENS.presence[name] = next;
                    const isVoice = FX_RESOFF[name] !== undefined; // canvas voice only
                    if (isVoice) {
                        const rise = next - (FX_ENS.prevPresence[name] || 0);
                        if (rise > callerRise && rise > 0.05) { callerRise = rise; caller = name; }
                        sum += next;
                    }
                    FX_ENS.prevPresence[name] = next;
                }
                FX_ENS.crowd = clamp01(sum / 4);
                /* auto-mix: as the board fills, everyone yields a little — and the
                   caller's resonance neighbour gets a short answer boost */
                if (caller && now > (FX_ENS.answer.until || 0)) {
                    FX_ENS.answer.name = fxNextVoice(caller);
                    FX_ENS.answer.until = now + 1500;
                }
                const answering = (FX_ENS.answer.name && now < FX_ENS.answer.until) ? FX_ENS.answer.name : null;
                for (let i = 0; i < FX_VOICE_NAMES.length; i++) {
                    const name = FX_VOICE_NAMES[i];
                    const others = sum - (FX_ENS.presence[name] || 0);
                    const busy = Math.max(0, others - 1.15) * 0.24;
                    let mix = 1 - busy;
                    if (name === answering) mix *= 1.14; // the answer swells slightly
                    FX_ENS.duck[name] = clamp(mix, 0.55, 1);
                }
            }
            /* resonance neighbour = the next offset in the circle of fifths of phase */
            function fxNextVoice(name) {
                const off = FX_RESOFF[name];
                if (off === undefined) return null;
                let best = null, bestD = 9;
                for (const k in FX_RESOFF) {
                    if (k === name) continue;
                    let d = FX_RESOFF[k] - off;
                    if (d <= 0) d += 1;
                    if (d < bestD) { bestD = d; best = k; }
                }
                return best;
            }
            /* resonance gate 0.30..1 — every voice takes its turn */
            function fxGate(name) {
                const off = FX_RESOFF[name];
                if (off === undefined) return 1;
                /* R1.5: a lively source raises the gate floor — on energetic
                   video the resonance gates never fully close, so every voice
                   keeps at least a glow while it waits its turn */
                const lo = 0.30 + 0.14 * srcEnergyK();
                return lo + (1 - lo) * (0.5 + 0.5 * Math.sin(Math.PI * 2 * (FX_ENS.resPhase + off)));
            }
            /* soft bell envelope for timed bursts */
            const envArc = (p) => Math.sin(clamp01(p) * Math.PI);
            const smooth01 = (t) => (t <= 0) ? 0 : (t >= 1) ? 1 : t * t * (3 - 2 * t);

            /* =============== FACTORY 1 — NEON GRAD · "AURORA BLOOM" ==========
               The lead voice. Two soft blooms orbit the shared stage; their hues
               are chord tones, so they re-voice with every chord change. */
            let auroraPhase = 0, auroraAngle = 22, auroraLastT = null;   /* R2: shared aurora flow */
            function glitchNeonGradientOverlayFactory(getStrength, isPersistent) {
                const paintBloom = (x, y, r, hue, a) => {
                    if (a <= 0.004 || r < 2) return;
                    const g = gctx.createRadialGradient(x, y, 0, x, y, r);
                    g.addColorStop(0.00, fxHsla(hue, 62, 78, Math.min(0.55, a * 0.50)));
                    g.addColorStop(0.22, fxHsla(hue, 58, 66, a * 0.26));
                    g.addColorStop(0.55, fxHsla(hue, 52, 56, a * 0.12));
                    g.addColorStop(1.00, fxHsla(hue, 50, 50, 0));
                    gctx.fillStyle = g;
                    gctx.fillRect(x - r, y - r, r * 2, r * 2);
                };
                const renderFn = () => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    const t = customTime * 0.001;
                    const st = FX_ENS.stage;
                    /* the two blooms slowly orbit each other on the shared stage */
                    const orbit = 0.05 + 0.04 * FX_ENS.breath;
                    const x1 = (st.x + Math.cos(t * 0.11) * orbit) * w;
                    const y1 = (st.y + Math.sin(t * 0.17 + 1.3) * orbit) * h;
                    const x2 = (st.x - Math.cos(t * 0.13 + 0.7) * orbit) * w;
                    const y2 = (st.y - Math.sin(t * 0.19) * orbit) * h;
                    const r = Math.min(w, h) * (st.r + 0.05 * s) *
                        (0.90 + 0.20 * srcDarkK()); /* R1.6: bloom radius rides darkness */
                    const a = effectPaintAlpha('Neon Grad', s, (comboProfile.glowMult || 1) * 0.9);
                    const nf = (window.GlitchEngine && GlitchEngine.neonFilterMap)
                        ? GlitchEngine.neonFilterMap(s, boardFilterCtx())
                        : { sat: 62, veil: 0.12, light: 66, confMix: 0.3, blend: 'screen', realm: 'mix' };
                    const conf = fxConfluenceHue(0);
                    const bwN = bwInvertMap(effectAlphas['B&W Invert'] || 0);
                    const mix = nf.confMix || 0.3;
                    /* R2 NEON AURORA v2 — the better Neon Grad. Flowing light
                       RIBBONS (2 calm / 3 wild) cross the frame on a slowly
                       turning angle; crests bloom. Calm = a slow tide; inside a
                       crescendo the flow is rapid (×3.4) and beat-lifted. */
                    const au = (GlitchEngine.neonAuroraMap) ? GlitchEngine.neonAuroraMap(s, boardFilterCtx(), softK(), SOFT.beat) : null;
                    if (au) {
                        const dtA = auroraLastT == null ? 0.016 : Math.min(0.05, (customTime - auroraLastT) / 1000);
                        auroraLastT = customTime;
                        auroraPhase = (auroraPhase + au.flow * dtA) % 360;
                        auroraAngle = (auroraAngle + au.angleRate * dtA) % 360;
                    }
                    const h0 = (fxLerpHue(fxTone(0), conf, mix) + bwN.hueDeg * 0.20 +
                        (bwN.invert > 0.004 ? 180 * (bwN.invert / 0.75) * 0.25 : 0) + 360) % 360;
                    const h1 = (fxLerpHue(fxTone(1), conf, mix * 0.7) + bwN.hueDeg * 0.12 + 360) % 360;
                    const h2 = (fxLerpHue(fxTone(2), conf, mix) + bwN.hueDeg * 0.20 + 360) % 360;
                    gctx.save();
                    gctx.globalCompositeOperation = nf.blend || 'screen';
                    if ('filter' in gctx) {
                        const hslS = (typeof fxConfluenceSat === 'function') ? fxConfluenceSat() : (nf.sat || 62);
                        gctx.filter = 'saturate(' + (0.85 + ((nf.sat || 62) * 0.55 + hslS * 0.45) / 200).toFixed(3) + ')';
                    }
                    if (au) {
                        /* ribbons: a full-frame linear gradient along the turning
                           angle, hue-walked by the aurora phase, alpha-shaped as
                           soft bands (transparent → crest → transparent) */
                        const ang = auroraAngle * Math.PI / 180;
                        const cx = w / 2, cy = h / 2, L = Math.max(w, h) * 0.75;
                        const gx0 = cx - Math.cos(ang) * L, gy0 = cy - Math.sin(ang) * L;
                        const gx1 = cx + Math.cos(ang) * L, gy1 = cy + Math.sin(ang) * L;
                        const rib = gctx.createLinearGradient(gx0, gy0, gx1, gy1);
                        const n = au.ribbons;
                        const ribA = Math.min(0.34, a * 0.62) * (0.7 + 0.3 * FX_ENS.breath);
                        const stops = 24;
                        for (let i = 0; i <= stops; i++) {
                            const u = i / stops;
                            /* n travelling crests; phase walks them along the axis */
                            const ph = u * n * Math.PI * 2 - auroraPhase * Math.PI / 180;
                            const crest = Math.pow(0.5 + 0.5 * Math.sin(ph), 1.0 / Math.max(0.35, au.width * 2.2));
                            const hueU = (h0 + u * au.hueSpread * n + auroraPhase * 0.5 + 360) % 360;
                            rib.addColorStop(u, fxHsla(hueU, au.sat, au.light, ribA * crest));
                        }
                        gctx.fillStyle = rib;
                        gctx.fillRect(0, 0, w, h);
                        /* crest blooms ride the ribbons */
                        gctx.globalCompositeOperation = au.glowBlend || 'lighter';
                        paintBloom(x1, y1, r * 0.9, (h0 + auroraPhase * 0.5) % 360, a * au.bloomA * 0.8);
                        paintBloom(x2, y2, r * 0.7, (h2 + auroraPhase * 0.5) % 360, a * au.bloomA * 0.6);
                        gctx.globalCompositeOperation = nf.blend || 'screen';
                    } else {
                        paintBloom(x1, y1, r, h0, a);
                        paintBloom(x2, y2, r * 0.78, h2, a * 0.78);
                    }
                    /* faint breathing ring — the bloom's halo edge */
                    gctx.globalAlpha = Math.min(0.10, a * 0.16);
                    gctx.strokeStyle = fxHsla(h1, 55, 72, 1);
                    gctx.lineWidth = 1.5;
                    gctx.beginPath();
                    gctx.arc((st.x * w), (st.y * h), r * (0.72 + 0.06 * FX_ENS.breath), 0, Math.PI * 2);
                    gctx.stroke();
                    /* v11.3 SPECTRUM VEIL (006 Neon Grad, toned): one full-frame
                       radial veil whose five stops walk the hue ring from the
                       chord root (root + k*72°) — the old symmetric spectrum,
                       breathing with the ensemble, capped whisper-soft. */
                    const veilA = Math.min(0.14, a * 0.30) * (0.55 + 0.45 * FX_ENS.breath) *
                        R16.neonVeil() * (0.75 + 0.45 * (nf.veil || 0.12) / 0.20);
                    if (veilA > 0.004) {
                        const vg = gctx.createRadialGradient(x1, y1, 0, x1, y1, Math.max(w, h) * 0.85);
                        const rootHue = h0;
                        for (let k = 0; k < 5; k++) {
                            const stopH = fxLerpHue(rootHue, (rootHue + k * 72) % 360, 0.55 + 0.45 * FX_ENS.breath);
                            vg.addColorStop(k / 4, fxHsla(stopH,
                                (nf.sat || 64) * 0.6 + ((typeof fxConfluenceSat === 'function') ? fxConfluenceSat() : 64) * 0.4,
                                (nf.light || 58) * 0.65 + ((typeof fxConfluenceLight === 'function') ? fxConfluenceLight() : 58) * 0.35,
                                veilA * (k === 0 ? 0.85 : 0.60)));
                        }
                        gctx.fillStyle = vg;
                        gctx.fillRect(0, 0, w, h);
                    }
                    gctx.filter = 'none';
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 2 — SCANLINES · "COMB FIELD" =============
               Lines breathe (gap modulated by the master breath), the whole field
               slowly tilts back and forth, accents walk the chord. */
            function glitchScanlinesFactory(getStrength, isPersistent) {
                const renderFn = () => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    /* R1.6: the source's motion tightens the comb — busy
                       video weaves a denser field */
                    const gap = 3 + Math.round((1 - s) * 3 + FX_ENS.breath * 1.5 + R16.scanGap());
                    const thick = 1 + Math.floor(s * 1.5); // 006: strength-keyed line thickness
                    const drift = (customTime * 0.006) % (gap + 1);               // slow crawl
                    const tilt = Math.sin(customTime * 0.00008) * 0.10;           // ±5.7° tilt
                    const a = effectPaintAlpha('Scanlines', s, comboProfile.glowMult || 1);
                    if (a <= 0.004) return;
                    gctx.save();
                    gctx.translate(w / 2, h / 2);
                    gctx.rotate(tilt);
                    gctx.translate(-w / 2, -h / 2);
                    gctx.globalCompositeOperation = 'screen';
                    let n = 0;
                    const diag = Math.sqrt(w * w + h * h);
                    /* v11.3 (006 blend): non-accent lines share ONE uniform hue —
                       the chord root lerped toward the old file's cyan (200°) — so
                       the field reads as a single woven sheet; accents still walk
                       the chord. Lines take the old strength-keyed thickness and
                       every 8th line throws a faint mesh echo. */
                    const baseHue = fxLerpHue(fxTone(0), 200, 0.45);
                    for (let y = drift - gap; y < diag; y += gap + 1, n++) {
                        const isAccent = (n % 6 === 2);
                        const tone = isAccent ? fxTone(1 + (n % 2), 6) : baseHue;
                        const lineA = a * (isAccent ? (0.50 + 0.50 * FX_ENS.breath) : 0.32);
                        if (lineA < 0.01) continue;
                        gctx.fillStyle = fxHsla(tone, isAccent ? 74 : 46, isAccent ? 72 : 62, lineA);
                        gctx.fillRect(0, y, diag, thick);
                        if (n % 8 === 0) { // mesh echo — every 8th line doubles
                            gctx.fillStyle = fxHsla(fxTone(2, 8), 52, 68, lineA * 0.45);
                            gctx.fillRect(0, y + (gap + 1) * 0.5, diag, 1);
                        }
                    }
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 3 — FLASH · "APERTURE PULSE" =============
               No more full-screen slams: a localized soft pulse at the SHARED
               STAGE anchor (keys into the Neon bloom), landing on a chord tone,
               with an asymmetric decay envelope for timed bursts. */
            function glitchBrightFlashFactory(getStrength, isPersistent) {
                const renderFn = (progress) => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    const env = (progress !== undefined) ?
                        Math.pow(1 - clamp01(progress), 1.6) :          // fast hit, slow release
                        (0.35 + 0.65 * FX_ENS.breath);                    // breathing when persistent
                    const st = FX_ENS.stage;                              // shared anchor
                    const x = st.x * w,
                        y = st.y * h;
                    const r = Math.min(w, h) * (0.22 + 0.42 * s * env);
                    const a = effectPaintAlpha('Flash', s * env, comboProfile.glowMult || 1);
                    if (a <= 0.004) return;
                    const tone = fxTone(Math.floor(customTime * 0.00006) % 3, 4); // lands on the chord
                    const g = gctx.createRadialGradient(x, y, 0, x, y, r);
                    g.addColorStop(0.00, fxHsla(tone, 62, 88, Math.min(0.50, a * 0.70)));
                    g.addColorStop(0.35, fxHsla(tone, 58, 78, a * 0.30));
                    g.addColorStop(1.00, fxHsla(tone, 55, 70, 0));
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    gctx.fillStyle = g;
                    gctx.fillRect(0, 0, w, h);
                    /* v11.3 FULL-FRAME WASH (006 Flash tint, toned to a breath):
                       at strength the pulse leaks a faint same-tone wash so it
                       reads across the whole frame, not only its core. */
                    const wash = Math.min(0.08, a * 0.18) * env;
                    if (wash > 0.003) {
                        gctx.fillStyle = fxHsla(tone, 58, 74, wash);
                        gctx.fillRect(0, 0, w, h);
                    }
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 4 — HUE SATURATION LIGHTING RAINBOW =====
               Three confluent rails on the same 0 / 50 / 75 / 100 landmarks:
                 H — hue wheel around Ghost-Key confluence + chord
                 S — saturation prism (grey paper → full chroma)
                 L — lighting rainbow (shade → paper → glare, polarity with B&W)
               Reality paints 3 chord stops, soft-light. Virtual opens 5–7 stops
               and adds overlay (S) + luminosity (L) passes. */
            let hslSpinAcc = 0, hslSpinLastT = null;   /* R2: shared prism spin */
            function glitchHSLRainbowFactory(getStrength, isPersistent) {
                const renderFn = () => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    const a = effectPaintAlpha('HSL Rainbow', s, comboProfile.glowMult || 1);
                    if (a <= 0.004) return;
                    const map = (window.GlitchEngine && GlitchEngine.hslRainbowMap)
                        ? GlitchEngine.hslRainbowMap(s, boardFilterCtx())
                        : { hueDeg: s * 360, satPct: 74, lightPct: 64, satSwing: 18, lightSwing: 12, hueStops: 3, realm: 'mix' };
                    const t = customTime * 0.001;
                    /* R2 SOFT-EYE: the prism spin is an ACCUMULATOR — slow in calm,
                       rapid inside a crescendo (×3.4) and lifted by the ear's beat */
                    hslSpinAcc += (customTime - (hslSpinLastT == null ? customTime : hslSpinLastT)) * 0.008 *
                        R16.spinK() * GlitchEngine.softChromaSpin(softK(), SOFT.beat);
                    hslSpinLastT = customTime;
                    const spin = (hslSpinAcc + map.hueDeg * 0.18) % 360;
                    const conf = fxConfluenceHue(0);
                    const bw = bwInvertMap(effectAlphas['B&W Invert'] || 0);
                    const bwP = clamp01(FX_ENS.presence['B&W Invert'] || bw.t || 0);
                    const nStops = Math.max(3, map.hueStops || 3);
                    const satBase = (map.satPct || 74) * (1 - 0.55 * bwP) * R16.rainbowSat();
                    const lightBase = map.lightPct || 64;
                    const invK = bw.invert / 0.75;
                    gctx.save();
                    gctx.globalAlpha = Math.min(1, a * 1.12);

                    /* HUE rainbow — diagonal wash, chord × confluence × wheel */
                    const gH = gctx.createLinearGradient(0, 0, w * (map.realm === 'virtual' ? 1 : 0.42), h);
                    for (let i = 0; i < nStops; i++) {
                        const u = nStops === 1 ? 0 : i / (nStops - 1);
                        const tone = fxLerpHue(fxTone(i % 3), conf, 0.34);
                        const hue = (tone + map.hueDeg * u + spin + bw.hueDeg * 0.18 +
                            (invK > 0.004 ? 180 * invK * 0.22 : 0) + 360) % 360;
                        gH.addColorStop(u, fxHsla(hue, satBase, lightBase,
                            Math.min(0.48, a * (i === ((nStops / 2) | 0) ? 0.40 : 0.26))));
                    }
                    gctx.globalCompositeOperation = map.realm === 'reality' ? 'soft-light' : 'screen';
                    gctx.fillStyle = gH;
                    gctx.fillRect(0, 0, w, h);

                    /* SATURATION rainbow — cross-axis, grey → prism */
                    const gS = gctx.createLinearGradient(w, 0, 0, h);
                    for (let i = 0; i < nStops; i++) {
                        const u = nStops === 1 ? 0 : i / (nStops - 1);
                        const satK = clamp(satBase - (map.satSwing || 16) + (2 * (map.satSwing || 16)) * u +
                            Math.sin(t * 0.35 + i) * 6, 8, 100);
                        const hue = (conf + 120 + spin * 0.45 + i * (360 / nStops) + 360) % 360;
                        gS.addColorStop(u, fxHsla(hue, satK, lightBase, Math.min(0.32, a * 0.22)));
                    }
                    gctx.globalCompositeOperation = 'overlay';
                    gctx.fillStyle = gS;
                    gctx.fillRect(0, 0, w, h);

                    /* LIGHTING rainbow — luminosity walk, polarity with B&W invert */
                    const gL = gctx.createLinearGradient(0, h, w, 0);
                    for (let i = 0; i < nStops; i++) {
                        const u = nStops === 1 ? 0 : i / (nStops - 1);
                        let lK = lightBase - (map.lightSwing || 10) + (2 * (map.lightSwing || 10)) * u +
                            Math.sin(t * 0.22 + i * 0.9) * 7;
                        if (invK > 0.004) lK = lK * (1 - invK) + (100 - lK) * invK;
                        lK = clamp(lK, 6, 94);
                        gL.addColorStop(u, fxHsla(conf, Math.max(8, satBase * 0.22), lK, Math.min(0.28, a * 0.18)));
                    }
                    gctx.globalCompositeOperation = 'luminosity';
                    gctx.fillStyle = gL;
                    gctx.fillRect(0, 0, w, h);

                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 5 — STROBE · "FLICKER GATE" ==============
               Fires only inside its resonance window, in musical ruffs (short
               2-4 pulse bursts then rest), vignette-weighted so it reads as a
               camera flicker rather than a flat full-screen strobe. */
            function glitchStrobeFactory(getStrength, isPersistent) {
                const renderFn = () => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    const gate = fxGate('Strobe');
                    if (gate < 0.42) return;                              // outside its turn: silent
                    const t = customTime * 0.001;
                    /* R1.6: the source's energy sets the flicker cadence —
                       lively video shortens the ruff period and widens the
                       pulse window, calm video flickers lazily */
                    /* R2 SOFT-EYE: the ~11 Hz flicker is gone. The strobe is now a
                       SOFT PULSE — a shaped sine at ≤1.05 Hz calm / ≤2.6 Hz wild
                       (always under the 3 Hz photosensitive band), with a longer
                       ruff period when calm and no per-frame random dropouts
                       (those read as flashing). The ear's beat leans on the pulse. */
                    const k = softK();
                    const ruffP = R16.strobeP() * lerp(2.6, 1.1, k);
                    const ruffPhase = t % ruffP;
                    const inRuff = ruffPhase < ruffP * (0.28 + 0.22 * s) * R16.strobeW();
                    if (!inRuff) return;
                    const hz = GlitchEngine.softStrobeHz(k);
                    const pulse = Math.pow(0.5 + 0.5 * Math.sin(t * Math.PI * 2 * hz), 2.2);  /* swell, never a cut */
                    const ruffEnv = Math.sin(Math.PI * clamp01(ruffPhase / (ruffP * (0.28 + 0.22 * s) * R16.strobeW())));
                    const env = pulse * ruffEnv * (0.75 + 0.35 * clamp01(SOFT.beat));
                    if (env < 0.03) return;
                    const tone = fxTone(Math.floor(t) % 3);
                    const a = effectPaintAlpha('Strobe', s * env * (0.45 + 0.55 * gate), comboProfile.glowMult || 1);
                    if (a <= 0.004) return;
                    const g = gctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.16,
                        w / 2, h / 2, Math.max(w, h) * 0.72);
                    g.addColorStop(0, fxHsla(tone, 68, 86, Math.min(0.50, a)));
                    g.addColorStop(1, fxHsla(tone, 64, 80, a * 0.10));
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    gctx.fillStyle = g;
                    gctx.fillRect(0, 0, w, h);
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 6 — ASCII · "006 SCATTER × CHORD RAIN" ==
               R1.3 total redo: the voice rotates HEAVILY between the
               final-006 full-grid RAINBOW DIFFERENCE scatter (the dominant
               face) and the R1.2 RANDOM-APPEARING matrix stacks (the
               ensemble face) — crossfaded, leaning hard to 006.
               R1.2: the falling rain is replaced by RANDOM-APPEARING glyph
               stacks — the Prism-Ink spawn model in MATRIX style. The grid
               machinery (spacing / budget / shimmer veil) is kept. Stacks
               strike at uniform-random positions (they may overlap and may sit
               far apart); each is a bright phosphor head whose trail glyphs
               rain into place beneath it with a staggered delay, the head
               re-rolls its character while fresh, and everything decays like
               phosphor. The APPEARANCE FREQUENCY is set by the ASCII slider. */
            const ASCII_RAIN = {
                cols: 0,
                rows: 0,
                spacing: 14,
                drops: null,
                glyphs: null,
                hues: null,
                live: null,
                trails: null,
                speeds: null,
                rainFrac: 0.77,
                scale: 2.35,
                alphaMin: 0.55,
                alphaMax: 0.92
            };

            function rebuildAsciiRain(w, h, strength) {
                /* R1.7: vivid video densifies the grid, grey video opens it */
                const spacing = Math.max(10, Math.round((18 - strength * 7) * R16.asciiGap()));
                let cols = Math.max(4, Math.ceil(w / spacing));
                let rows = Math.max(4, Math.ceil(h / spacing));
                const cells = cols * rows;
                if (cells > renderBudget.asciiCells) {
                    const scale = Math.sqrt(cells / renderBudget.asciiCells);
                    cols = Math.max(4, Math.floor(cols / scale));
                    rows = Math.max(4, Math.floor(rows / scale));
                }
                const A = ASCII_RAIN;
                if (A.cols === cols && A.rows === rows && A.spacing === spacing && A.drops) return;
                A.spacing = spacing;
                A.cols = cols;
                A.rows = rows;
                A.drops = new Float32Array(cols);
                A.glyphs = new Uint16Array(cols * rows);
                A.hues = new Float32Array(cols);
                A.live = new Uint8Array(cols);
                A.trails = new Uint16Array(cols);
                A.speeds = new Float32Array(cols);
                const liveCount = Math.max(3, Math.round(cols * A.rainFrac));
                const setLen = atlas.count || 200;
                for (let c = 0; c < cols; c++) {
                    A.drops[c] = Math.random() * rows;
                    A.hues[c] = Math.random() * 3; // chord-tone index per column
                    A.live[c] = c < liveCount ? 1 : 0;
                    A.trails[c] = Math.max(8, Math.round(rows * (0.22 + Math.random() * 0.50)));
                    A.speeds[c] = 0.75 + Math.random() * 1.15;
                    for (let r = 0; r < rows; r++) {
                        A.glyphs[c * rows + r] = (Math.random() * setLen) | 0;
                    }
                }
                for (let i = 0; i < cols; i++) {
                    const j = (Math.random() * cols) | 0;
                    const tmp = A.live[i];
                    A.live[i] = A.live[j];
                    A.live[j] = tmp;
                }
            }

            function glitchASCIIArtOverlayFactory(getStrength, isPersistent) {
                /* R1.3 STYLE ROTOR (user request): this voice rotates HEAVILY
                   between two souls — the final-006 full-grid rainbow
                   'difference' scatter ('006', the DOMINANT face) and the
                   R1.2 random-appearing matrix stacks + shimmer veil ('ENS')
                   — crossfaded ~0.4s; 006 dwells ~3.2-6.8s, ENS strikes
                   ~1.2-2.7s (≈70/30, leaning hard to final-006). R1.2 kept:
                   ENS stack frequency is slider-governed. */
                const stacks = [];
                const MAX_STACKS = 36;
                const chSet = atlas.chars || window.__ASCII_CHARS || ['0', '1'];
                let spawnAccum = 0;
                let lastT = null;
                let rotStyle006 = true;   // '006' scatter vs 'ENS' stacks
                let rotUntil = 0;         // style-flip timestamp (customTime)
                let rotW = 1;             // eased 006 weight 0..1
                const spawnStack = (w, h, glyphPx, baseHue, life) => {
                    const depth = 2 + ((Math.random() * 5) | 0); // 2-6 trail glyphs
                    const st = {
                        x: Math.random() * w,                        // uniform-random:
                        y: Math.random() * h,                        // may overlap, may
                        hue: (baseHue + (Math.random() * 26 - 13) + 360) % 360, // sit far apart
                        size: glyphPx * (0.75 + Math.random() * 0.55),
                        born: customTime,
                        life: life,
                        glyphs: []
                    };
                    for (let k = 0; k < depth; k++) {
                        st.glyphs.push({
                            ch: chSet[(Math.random() * chSet.length) | 0],
                            delay: k * (55 + Math.random() * 75)     // rain-into-place stagger
                        });
                    }
                    stacks.push(st);
                };
                const renderFn = (progress) => {
                    const s = getStrength();
                    if (s <= 0) {
                        stacks.length = 0;
                        lastT = null;
                        rotStyle006 = true;   // R1.3: every activation opens
                        rotUntil = 0;         // on the dominant 006 face
                        rotW = 1;
                        return;
                    }
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    rebuildAsciiRain(w, h, s); // spacing/grid + shimmer machinery kept

                    const A = ASCII_RAIN;
                    const cols = A.cols,
                        rows = A.rows,
                        sp = A.spacing;
                    const glyphPx = Math.max(10, (sp - 2) * A.scale);
                    const master = effectPaintAlpha('ASCII', s, comboProfile.glowMult || 1);
                    if (master <= 0.004) return;
                    const now = customTime;
                    const dt = (lastT === null) ? 0.016 :
                        Math.max(0.001, Math.min(0.1, (now - lastT) / 1000));
                    lastT = now;
                    const timed = (progress !== undefined);
                    /* matrix green: the chord root pulled toward phosphor 120° */
                    const baseHue = fxLerpHue(fxTone(0), 120, 0.55);
                    /* R1.3 style rotor: flip the face on a clock, then ease
                       the weight over ~0.4s. Entering ENS seeds a 3-stack
                       flurry so the ensemble face announces its return. */
                    if (!rotUntil) rotUntil = now + 3200 + Math.random() * 3600;
                    if (now >= rotUntil) {
                        rotStyle006 = !rotStyle006;
                        rotUntil = now + (rotStyle006 ?
                            3200 + Math.random() * 3600 :
                            1200 + Math.random() * 1500);
                        if (!rotStyle006) {
                            for (let i = 0; i < 3 && stacks.length < MAX_STACKS; i++) {
                                spawnStack(w, h, glyphPx, baseHue, 800 + Math.random() * 900);
                            }
                        }
                    }
                    rotW += ((rotStyle006 ? 1 : 0) - rotW) *
                        Math.min(1, dt / 0.09);
                    /* STYLE '006' (dominant) — the final-006 full-grid rainbow
                       scatter: ONE fresh random hue per frame, 'difference'
                       blend, 50% cell density, every cell re-rolling its
                       glyph — the whole multi-alphabet field shimmering
                       per-frame. Spacing keeps the 006 formula 10+(1−s)·20,
                       budget-capped by asciiCells. */
                    if (rotW > 0.02) {
                        const sp006 = Math.max(10 + (1 - s) * 20,
                            Math.sqrt((w * h) / renderBudget.asciiCells));
                        gctx.save();
                        gctx.textBaseline = 'top';
                        gctx.globalCompositeOperation = 'difference';
                        /* R1.4: the scatter's rainbow is source-keyed — a
                           colorful video pulls the field toward its own
                           spectrum; a grey one lets the full wheel fly */
                        const scatterHue = (videoPalette.hue +
                            (Math.random() - 0.5) * 360 * srcSpreadK() + 360) % 360;
                        gctx.fillStyle = fxHsla(scatterHue, 100, 70,
                            Math.min(1, 0.8 * s) * rotW);
                        gctx.font = 'bold ' +
                            (sp006 + (Math.random() - 0.5) * s * 1.5).toFixed(1) +
                            'px monospace';
                        for (let yy = 0; yy < h; yy += sp006) {
                            for (let xx = 0; xx < w; xx += sp006) {
                                if (Math.random() < 0.5) {
                                    gctx.fillText(
                                        chSet[(Math.random() * chSet.length) | 0], xx, yy);
                                }
                            }
                        }
                        gctx.restore();
                    }
                    /* R1.2: the appearance FREQUENCY is set by the ASCII slider —
                       ~0.6 stacks/s at a whisper up to ~9/s at full, gently
                       breathing with the ensemble but always slider-governed */
                    let rate = (0.6 + 8.4 * s) * (0.65 + 0.35 * FX_ENS.breath) *
                        (0.7 + 0.3 * fxGate('ASCII')) * (1 - rotW) * /* R1.3 ENS weight */
                        (0.85 + 0.30 * srcEnergyK()); /* R1.5: source energy feeds the rain */
                    if (timed) {
                        rate *= (1 + 2.2 * envArc(progress));
                        if (progress < 0.06 && stacks.length === 0) {
                            for (let i = 0; i < 5; i++) spawnStack(w, h, glyphPx, baseHue,
                                700 + Math.random() * 1000);
                        }
                    }
                    spawnAccum += rate * dt;
                    while (spawnAccum >= 1) {
                        spawnAccum -= 1;
                        if (stacks.length < MAX_STACKS) {
                            spawnStack(w, h, glyphPx, baseHue,
                                timed ? 700 + Math.random() * 1100 : 1300 + Math.random() * 2000);
                        }
                    }
                    gctx.save();
                    gctx.textBaseline = 'top';
                    gctx.globalCompositeOperation = 'screen'; // phosphor glow
                    for (let i = stacks.length - 1; i >= 0; i--) {
                        const st = stacks[i];
                        const age = now - st.born;
                        if (age >= st.life + st.glyphs[st.glyphs.length - 1].delay) {
                            stacks.splice(i, 1);
                            continue;
                        }
                        const decay = Math.max(0, 1 - age / st.life); // phosphor decay
                        gctx.font = 'bold ' + st.size.toFixed(0) + 'px "Courier New", monospace';
                        for (let k = 0; k < st.glyphs.length; k++) {
                            const gph = st.glyphs[k];
                            const gAge = age - gph.delay;
                            if (gAge < 0) continue; // still raining into place
                            const cellY = st.y + k * st.size * 0.92;
                            if (cellY > h) break;
                            const kFade = Math.max(0, 1 - gAge / (st.life * 0.85));
                            if (k === 0) {
                                /* the head: bright, blooming, re-rolling its
                                   character while fresh — matrix shimmer */
                                if (decay > 0.5) gph.ch = chSet[(Math.random() * chSet.length) | 0];
                                const a = (1 - rotW) *
                                    Math.min(0.55, master * (0.25 + 0.75 * decay));
                                if (a > 0.015) {
                                    gctx.shadowColor = fxHsla(st.hue, 100, 62, 1);
                                    gctx.shadowBlur = 3 + 7 * decay;
                                    gctx.fillStyle = fxHsla(st.hue, 74, 84, a);
                                    gctx.fillText(gph.ch, st.x, cellY);
                                    gctx.shadowBlur = 0;
                                }
                            } else {
                                /* trail glyphs: dimmer, decaying faster */
                                const a = (1 - rotW) * master * 0.5 * kFade *
                                    (1 - k * 0.10) * (0.4 + 0.6 * decay);
                                if (a > 0.015) {
                                    gctx.fillStyle = fxHsla(st.hue, 54, 56, a);
                                    gctx.fillText(gph.ch, st.x, cellY);
                                }
                            }
                        }
                    }
                    gctx.font = 'bold ' + glyphPx.toFixed(0) + 'px "Courier New", monospace';
                    /* v11.3 GLYPH SHIMMER (006 ASCII scatter, tuned): a sparse
                       full-grid veil of multi-alphabet glyphs in 'difference'
                       blend — grid-aligned to the rain, chord-toned, its density
                       swelling with the ensemble breath and this voice's
                       presence. Cells refresh on a slow clock (~1.7s), never
                       per-frame, so the veil reads as weathered film, not TV
                       static. */
                    const shimmerA = Math.min(0.10, master * 0.22) *
                        (0.45 + 0.55 * FX_ENS.breath) * (0.55 + 0.45 * fxGate('ASCII')) *
                        (1 - rotW); // R1.3 ENS weight
                    if (shimmerA > 0.004) {
                        gctx.globalCompositeOperation = 'difference';
                        const dens = 0.045 + 0.055 * clamp01(FX_ENS.presence['ASCII'] || s) *
                            (0.5 + 0.5 * FX_ENS.breath);
                        const tick = Math.floor(customTime * 0.001 / 1.7); // slow cell clock
                        const bank = FX_GLYPH_BANK;
                        for (let c = 0; c < cols; c++) {
                            for (let rr = 0; rr < rows; rr++) {
                                const seed = ((c * 131 + rr * 337 + tick * 911) % 997) / 997;
                                if (seed > dens) continue;
                                const gTone = fxTone((c + rr) % 3, ((seed * 12) | 0) - 6);
                                gctx.fillStyle = fxHsla(gTone, 55, 70, shimmerA * (0.45 + 0.55 * seed));
                                gctx.fillText(bank[(c * 7 + rr * 13 + tick * 29) % bank.length],
                                    c * sp, rr * sp);
                            }
                        }
                    }
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

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
                const renderFn = () => {
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
                        gctx.font = (10 + Math.random() * 80 * s).toFixed(0) + 'px ' +
                            BURN_FONTS[(Math.random() * BURN_FONTS.length) | 0] +
                            ', monospace';
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
                    const a = effectPaintAlpha('Font Burn', s, comboProfile.glowMult || 1) *
                        (1 - rotW);
                    if (a <= 0.004) return;
                    const hueCycleStrength = effectAlphas['Hue/Color Cycle'] || 0;
                    /* anticipate the NEXT chord tone — the word leads the harmony */
                    const tone = fxTone(1 + ((Math.floor(customTime * 0.00014) + 1) % 2));
                    const x = px * w,
                        y = py * h;
                    gctx.save();
                    gctx.font = fontPx.toFixed(0) + 'px ' + BURN_FONTS[(Math.floor(customTime * 0.00007) %
                        BURN_FONTS.length)] + ', monospace';
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
                        gctx.fillText(text, x + ox, y + oy);
                    };
                    drawWord(wordA, a * (1 - blend), 0, 0);                    // fading echo
                    drawWord(wordB, a * blend, Math.cos(customTime * 0.001) * 2, 0); // rising voice
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 8 — GEMINI BOMB · "TWIN ORBIT" ===========
               Replaced the shape shrapnel with two soft counter-rotating ring
               glows on the shared stage — true twins: root tone and fifth tone,
               orbiting each other, connected by a faint chord line. */
            function glitchGeminiBombFactory(getStrength, isPersistent) {
                const born = customTime;
                /* v11.3 ECHO SHRAPNEL (006 Gemini Bomb, toned): 5-8 small
                   chord-toned shards from the old shape set (rect / circle /
                   triangle / star / cross) are ejected along the twins' orbit
                   tangent when a burst lands, and on resonance peaks in
                   persistent mode (slow, breath-keyed respawn). They ease out
                   on a soft fade — 'screen'-blended, absolute ceiling 0.3. */
                const SHAPES = ['rect', 'circle', 'triangle', 'star', 'cross'];
                const shards = [];
                let burstSpawned = false;
                let nextShrapnelAt = 0;
                const spawnShards = (ax, ay, bx, by, spin, w, h) => {
                    const nSh = 4 + ((Math.random() * (2 + 5 * srcAppetite())) | 0); /* R1.8: appetite seeds the shrapnel */
                    for (let i = 0; i < nSh; i++) {
                        const fromA = (i % 2 === 0);
                        const baseAng = fromA ? spin : (-spin + Math.PI);
                        const tang = baseAng + Math.PI * 0.5 * (Math.random() < 0.5 ? 1 : -1);
                        const spd = (0.01 + Math.random() * 0.022) * Math.min(w, h) * 0.6;
                        shards.push({
                            x: fromA ? ax : bx,
                            y: fromA ? ay : by,
                            vx: Math.cos(tang) * spd,
                            vy: Math.sin(tang) * spd,
                            shape: SHAPES[(Math.random() * SHAPES.length) | 0],
                            hue: fxTone((Math.random() * 3) | 0, ((Math.random() * 10) | 0) - 5),
                            size: 3 + Math.random() * 7,
                            rot: Math.random() * Math.PI * 2,
                            vrot: (Math.random() - 0.5) * 0.05,
                            life: 1
                        });
                    }
                };
                const drawShard = (sh, alpha) => {
                    gctx.save();
                    gctx.translate(sh.x, sh.y);
                    gctx.rotate(sh.rot);
                    gctx.globalAlpha = alpha;
                    gctx.fillStyle = fxHsla(sh.hue, 62, 68, 1);
                    const z = sh.size;
                    if (sh.shape === 'rect') {
                        gctx.fillRect(-z * 0.5, -z * 0.35, z, z * 0.7);
                    } else if (sh.shape === 'circle') {
                        gctx.beginPath();
                        gctx.arc(0, 0, z * 0.42, 0, Math.PI * 2);
                        gctx.fill();
                    } else if (sh.shape === 'triangle') {
                        gctx.beginPath();
                        gctx.moveTo(0, -z * 0.55);
                        gctx.lineTo(z * 0.5, z * 0.4);
                        gctx.lineTo(-z * 0.5, z * 0.4);
                        gctx.closePath();
                        gctx.fill();
                    } else if (sh.shape === 'star') {
                        const inner = z * 0.55 / 2.5;            // 006: inner = outer/2.5
                        gctx.beginPath();
                        for (let k = 0; k < 10; k++) {
                            const rr2 = (k % 2 === 0) ? z * 0.55 : inner;
                            const aa = -Math.PI * 0.5 + k * Math.PI / 5;
                            const px2 = Math.cos(aa) * rr2,
                                py2 = Math.sin(aa) * rr2;
                            if (k === 0) gctx.moveTo(px2, py2);
                            else gctx.lineTo(px2, py2);
                        }
                        gctx.closePath();
                        gctx.fill();
                    } else { // cross
                        gctx.fillRect(-z * 0.5, -z * 0.14, z, z * 0.28);
                        gctx.fillRect(-z * 0.14, -z * 0.5, z * 0.28, z);
                    }
                    gctx.restore();
                };
                const renderFn = (progress) => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    const t = (customTime - born) * 0.001;
                    const st = FX_ENS.stage;
                    const cx = st.x * w,
                        cy = st.y * h;                        // shared stage anchor
                    const orbitR = Math.min(w, h) * (0.07 + 0.15 * s);
                    const spin = t * (0.45 + 0.55 * s) * R16.geminiK(); /* R1.7: energy spins the twins */
                    const env = (progress !== undefined) ? envArc(progress) :
                        (0.40 + 0.60 * FX_ENS.breath);
                    const a = effectPaintAlpha('Gemini Bomb', s * env, comboProfile.glowMult || 1);
                    if (a <= 0.004) return;
                    /* v11.3 spawn: timed bursts throw once on landing; persistent
                       mode respawns on resonance peaks on a slow breath-keyed clock */
                    const nowMs = performance.now();
                    if (progress !== undefined) {
                        if (!burstSpawned && progress < 0.2) {
                            burstSpawned = true;
                            spawnShards(cx + Math.cos(spin) * orbitR, cy + Math.sin(spin) * orbitR,
                                cx + Math.cos(-spin + Math.PI) * orbitR, cy + Math.sin(-spin + Math.PI) * orbitR,
                                spin, w, h);
                        }
                    } else if (nowMs >= nextShrapnelAt && fxGate('Gemini Bomb') > 0.80) {
                        nextShrapnelAt = nowMs + 2400 + Math.random() * 2200 + (1 - FX_ENS.breath) * 1800;
                        spawnShards(cx + Math.cos(spin) * orbitR, cy + Math.sin(spin) * orbitR,
                            cx + Math.cos(-spin + Math.PI) * orbitR, cy + Math.sin(-spin + Math.PI) * orbitR,
                            spin, w, h);
                    }
                    const ax = cx + Math.cos(spin) * orbitR,
                        ay = cy + Math.sin(spin) * orbitR;
                    const bx = cx + Math.cos(-spin + Math.PI) * orbitR,
                        by = cy + Math.sin(-spin + Math.PI) * orbitR;
                    const ringR = Math.min(w, h) * (0.05 + 0.06 * s);
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    const twin = (x, y, rr, hue, aa) => {
                        const g = gctx.createRadialGradient(x, y, 0, x, y, rr * 2.4);
                        g.addColorStop(0, fxHsla(hue, 65, 80, Math.min(0.45, aa * 0.55)));
                        g.addColorStop(0.5, fxHsla(hue, 60, 66, aa * 0.22));
                        g.addColorStop(1, fxHsla(hue, 55, 60, 0));
                        gctx.fillStyle = g;
                        gctx.fillRect(x - rr * 2.4, y - rr * 2.4, rr * 4.8, rr * 4.8);
                        gctx.globalAlpha = Math.min(0.35, aa * 0.5);
                        gctx.strokeStyle = fxHsla(hue, 70, 78, 1);
                        gctx.lineWidth = 1.5;
                        gctx.beginPath();
                        gctx.arc(x, y, rr, 0, Math.PI * 2);
                        gctx.stroke();
                        gctx.globalAlpha = 1;
                    };
                    twin(ax, ay, ringR, fxTone(0), a);
                    twin(bx, by, ringR * 0.72, fxTone(2), a * 0.75);
                    /* the chord line between the twins */
                    gctx.globalAlpha = Math.min(0.16, a * 0.22);
                    gctx.strokeStyle = fxHsla(fxTone(1), 60, 74, 1);
                    gctx.lineWidth = 1;
                    gctx.beginPath();
                    gctx.moveTo(ax, ay);
                    gctx.lineTo(bx, by);
                    gctx.stroke();
                    /* v11.3 shrapnel pass — eased fade, absolute ceiling 0.3 */
                    for (let i = shards.length - 1; i >= 0; i--) {
                        const sh = shards[i];
                        sh.x += sh.vx;
                        sh.y += sh.vy;
                        sh.vx *= 0.985;
                        sh.vy *= 0.985;
                        sh.rot += sh.vrot;
                        sh.life -= 0.010 + 0.008 * s;
                        if (sh.life <= 0) { shards.splice(i, 1); continue; }
                        drawShard(sh, Math.min(0.3, a * 0.42) * smooth01(sh.life));
                    }
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 9 — DATA BANDS · "SIGNAL WEAVE" ==========
               Band offsets are now coherent — every band follows shared sinusoid
               fields (no per-frame randomness), the weave amplitude breathes,
               slices are larger/feathered by overlap, and the film-noise dots
               drift with the stage at half density. */
            function glitchVHSFactory(getStrength, isPersistent) {
                const renderFn = () => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 4 || h < 4) return;
                    const ytLive = !!(ytWarpShell && ytWarpShell.style.display !== 'none' && document.body.classList
                        .contains('playback-on'));
                    const localVid = !!(video && document.body.classList.contains('local-video') && video.readyState >=
                        2);

                    if (scratch.width !== w || scratch.height !== h) { scratch.width = w;
                        scratch.height = h; }

                    const phase = customTime * 0.00016;
                    /* v11.3 (006 blend): the weave amplitude swells on the beat
                       toward the old 15px wobble, but only while the beat holds */
                    const wobbleAmount = s * (7 * (0.6 + 0.4 * FX_ENS.breath) + 8 * clamp01(beat)) *
                        R16.bandWob(); /* R1.6: source motion feeds the weave */
                    const sliceHeight = 10;
                    let sliced = false;

                    const weave = () => {
                        for (let y = 0; y < h; y += sliceHeight) {
                            const band = y / sliceHeight;
                            /* two coherent fields — bands move as one woven sheet */
                            const wob = Math.sin(y / h * Math.PI * 3 + phase * 2) * wobbleAmount +
                                Math.sin(band * 0.35 + phase) * wobbleAmount * 0.45;
                            gctx.drawImage(scratch, 0, y, w, sliceHeight, wob, y, w, sliceHeight);
                        }
                    };
                    if (localVid) {
                        try {
                            scratchCtx.clearRect(0, 0, w, h);
                            scratchCtx.drawImage(video, 0, 0, w, h);
                            scratchCtx.drawImage(mainCanvas, 0, 0);
                            weave();
                            sliced = true;
                        } catch (e) {}
                    }
                    if (!sliced && !ytLive) {
                        scratchCtx.clearRect(0, 0, w, h);
                        scratchCtx.drawImage(mainCanvas, 0, 0);
                        weave();
                        sliced = true;
                    }

                    /* soft film noise — fewer, slower, stage-drifting */
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = Math.min(0.30, s * 0.22 * motionGlow());
                    const dots = Math.min(24, Math.floor(20 * s * R16.bandWob())); /* R1.7: motion feeds the grain */
                    const st = FX_ENS.stage;
                    /* v11.3 (006 blend): every other grain is painted 'overlay' —
                       the old composite that knots the noise INTO the picture
                       instead of sitting on top of it */
                    for (let i = 0; i < dots; i++) {
                        const x = ((i * 0.618 + st.x * 0.4 + customTime * 0.00001) % 1) * w;
                        const y = ((i * 0.381 + customTime * 0.00006) % 1) * h;
                        if (i & 1) {
                            gctx.globalCompositeOperation = 'overlay';
                            gctx.globalAlpha = Math.min(0.22, s * 0.16 * motionGlow());
                            gctx.fillStyle = 'rgba(255,255,255,0.5)';
                        } else {
                            gctx.globalCompositeOperation = 'screen';
                            gctx.globalAlpha = Math.min(0.30, s * 0.22 * motionGlow());
                            gctx.fillStyle = 'rgba(255,255,255,0.30)';
                        }
                        gctx.fillRect(x, y, 1.5, 1.5);
                    }
                    gctx.globalCompositeOperation = 'screen';
                    if (ytLive && !sliced) {
                        const rollY = ((customTime / 900) % 1) * h;
                        const bh = Math.max(3, 4 + s * 8);
                        const wob = Math.sin(rollY / 30 + phase) * wobbleAmount;
                        gctx.globalAlpha = Math.min(0.14, s * 0.10);
                        gctx.fillStyle = fxHsla(fxTone(0), 40, 90, 0.4);
                        gctx.fillRect(wob, rollY, w, bh);
                    }
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 10 — VHS GLITCH · "TAPE DRIFT" ===========
               The beam keeps its envelope physics, but: ripple amplitude is
               halved and breathes, the chroma-split pair is chord-toned (root /
               fifth instead of fixed red-cyan), and the comb overlay is a
               whisper. The drift eases with the ensemble breath. */
            function glitchVHSGlitchFactory(getStrength, isPersistent) {
                const renderFn = () => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 4 || h < 4) return;
                    const glow = ((comboProfile && comboProfile.glowMult) || 1);
                    const ytLive = !!(ytWarpShell && ytWarpShell.style.display !== 'none' && document.body.classList
                        .contains('playback-on'));
                    const localVid = !!(video && document.body.classList.contains('local-video') && video.readyState >=
                        2);

                    if (scratch.width !== w || scratch.height !== h) { scratch.width = w;
                        scratch.height = h; }

                    const speed = 0.00016 * (0.6 + s * 0.5 + 0.25 * FX_ENS.breath); // breathing tape
                    const phase = (customTime * speed) % 1;
                    const beamY = phase * (h + 80) - 40;
                    const rippleAmp = (3 + s * 9 * glow * (0.7 + 0.3 * FX_ENS.breath)) *
                        R16.vhsAmp(); /* R1.6: energy + motion feed the ripple */
                    const waveLen = 52 + (1 - s) * 40;
                    /* v11.3 (006 blend): slice height rides the voice gate
                       (4..6px like the old tape) and a coherent high-frequency
                       sine micro-slip — gated, never random — threads the beam */
                    const tGate = fxGate('VHS Glitch');
                    const sliceH = 4 + Math.floor(tGate * 2);

                    let sliced = false;
                    const trySlice = (srcDraw) => {
                        try {
                            scratchCtx.clearRect(0, 0, w, h);
                            srcDraw();
                            scratchCtx.drawImage(mainCanvas, 0, 0);
                            for (let y = 0; y < h; y += sliceH) {
                                const dist = (y - beamY) / (h * 0.22);
                                const envelope = Math.exp(-dist * dist * 2.2);
                                const curve = Math.sin(y / waveLen + customTime * 0.0011) * rippleAmp *
                                    envelope * s;
                                const curve2 = Math.sin(y / (waveLen * 0.55) + customTime * 0.0007) *
                                    rippleAmp * 0.35 * envelope * s;
                                const ox = curve + curve2 + Math.sin(y * 1.35 + customTime * 0.03) *
                                    (0.5 + 1.3 * tGate) * s;
                                try { gctx.drawImage(scratch, 0, y, w, sliceH, ox, y, w, sliceH); } catch (
                                e) {}
                            }
                            return true;
                        } catch (e) { return false; }
                    };

                    if (localVid && videoDistortStrength() < 0.08) {
                        sliced = trySlice(() => { scratchCtx.drawImage(video, 0, 0, w, h); });
                    }
                    if (!sliced && !ytLive) {
                        sliced = trySlice(() => {});
                    }

                    gctx.save();

                    /* comb — a whisper of interleaving darkness */
                    gctx.globalCompositeOperation = 'source-over';
                    gctx.globalAlpha = Math.min(0.18, 0.05 + s * 0.13) * glow;
                    gctx.fillStyle = 'rgba(0,0,0,0.35)';
                    const pitch = 2 + (s < 0.5 ? 1 : 0);
                    const drift = (customTime * 0.025 + phase * pitch * 4) % pitch;
                    for (let y = drift; y < h; y += pitch) {
                        const bend = Math.sin(y / waveLen + customTime * 0.001) * 0.5;
                        gctx.fillRect(bend, y, w, 1);
                    }

                    /* the beam — chord-toned halo */
                    gctx.globalCompositeOperation = 'screen';
                    const bandH = Math.max(6, h * (0.035 + s * 0.06));
                    const grad = gctx.createLinearGradient(0, beamY - bandH, 0, beamY + bandH);
                    const h0 = fxTone(0),
                        h2 = fxTone(2);
                    grad.addColorStop(0, fxHsla(h0, 70, 72, 0));
                    grad.addColorStop(0.45, fxHsla(h0, 78, 78, Math.min(0.30, 0.12 + s * 0.16)));
                    grad.addColorStop(0.55, fxHsla(h2, 80, 80, Math.min(0.32, 0.13 + s * 0.17)));
                    grad.addColorStop(1, fxHsla(h0, 70, 72, 0));
                    gctx.globalAlpha = Math.min(0.42, 0.15 + s * 0.25) * glow;
                    gctx.fillStyle = grad;
                    const beamCurve = Math.sin(customTime * 0.0008) * 9 * s;
                    gctx.fillRect(beamCurve * 0.3, beamY - bandH, w, bandH * 2);

                    /* chroma split — root/fifth pair at the beam edge */
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = Math.min(0.20, s * 0.14) * glow;
                    gctx.fillStyle = fxHsla(h0, 80, 72, 0.5);
                    gctx.fillRect(beamCurve, beamY - 1, w, 1.5);
                    gctx.fillStyle = fxHsla(h2, 80, 72, 0.5);
                    gctx.fillRect(-beamCurve * 0.7, beamY + 1.5, w, 1.5);

                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 11 — DATA BOMB · "CIPHER BURST" ===========
               The rain of random tiles becomes a radial constellation: a swell
               of glyphs expanding outward FROM the shared stage anchor on an
               eased bell envelope, chord-toned, fading as it diffuses. */
            function glitchDataBombFactory(getStrength, isPersistent) {
                const born = performance.now();
                const CYCLE = 2.6;
                const n = 36 + Math.round(16 * srcAppetite()); /* R1.8: appetite seeds the swarm */
                const moles = [];
                for (let i = 0; i < n; i++) {
                    moles.push({
                        ang: Math.random() * Math.PI * 2,
                        dist: 0.04 + Math.random() * 0.10,
                        spd: 0.10 + Math.random() * 0.24,
                        tone: i % 3,
                        glyph: 0,
                        spin: (Math.random() - 0.5) * 0.5,
                        sz: 0.7 + Math.random() * 0.6
                    });
                }
                const renderFn = (progress) => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    const tile = atlas.tile;
                    const src = tintAtlas || atlas.canvas;
                    if (!tile || !src) return;
                    const tAll = (performance.now() - born) * 0.001;
                    /* timed: one bell; persistent: the bell repeats on a slow cycle */
                    const tc = (progress !== undefined) ? clamp01(progress) : (tAll % CYCLE) / CYCLE;
                    const env = envArc(tc);
                    const st = FX_ENS.stage;
                    const cx = st.x * w,
                        cy = st.y * h;                     // burst from the shared stage
                    const a = effectPaintAlpha('Data Bomb', s * env, 1);
                    if (a <= 0.004) return;
                    const reach = Math.min(w, h);
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    for (let i = 0; i < n; i++) {
                        const m = moles[i];
                        const rr = (m.dist + m.spd * (tc * 1.6)) * reach *
                            R16.bombReach(); /* R1.6: appetite sets the burst reach */
                        const x = cx + Math.cos(m.ang + m.spin * tc * 2) * rr;
                        const y = cy + Math.sin(m.ang + m.spin * tc * 2) * rr * 0.85;
                        if (x < 0 || x > w || y < 0 || y > h) continue;
                        if (m.glyph === 0 || Math.random() < 0.02) m.glyph = (Math.random() * atlas.count) | 0;
                        const fade = 1 - tc * 0.8;                            // diffuses as it expands
                        gctx.globalAlpha = Math.min(0.5, a * fade * m.sz);
                        /* chord-toned tint wash behind each glyph */
                        gctx.fillStyle = fxHsla(fxTone(m.tone), 60, 60, 0.10);
                        gctx.fillRect(x, y, tile * 0.9, tile * 0.9);
                        gctx.drawImage(src, (m.glyph % 16) * tile, ((m.glyph / 16) | 0) * tile,
                            tile, tile, x, y, tile * 0.9, tile * 0.9);
                    }
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn, 1900);
            }

            /* =============== FACTORY 12 — INK GLYPHS · "PRISM INK" ============
               R1.1 (user request): randomly-appearing OPAQUE ink glyph stamps —
               ascii/symbol characters struck in THREE inks: RAINBOW
               (full-saturation hues), JETBLACK (near-black lacquer) and WHITE
               LIGHT (luminous white). Placement is uniform-random, so stamps
               MAY OVERLAP and MAY sit far apart ("spaced out") — no grid, no
               collision checks. Each glyph stamps in fast, holds, then lifts
               out; every stamp casts a darker offset under-copy so overlaps
               read as layered ink. The ensemble keys the APPEARANCE RATE
               (breath + resonance gate + auto-mix) — each stamp itself stays
               fully opaque by design. */
            function glitchInkGlyphsFactory(getStrength, isPersistent) {
                const glyphs = [];
                const MAX_INK = 30; // concurrent stamp cap
                /* R1.6: the ink's alphabet is split — letterforms vs sigils —
                   so the source's DARKNESS can choose the mix (see spawnGlyph):
                   dark video strikes dense code/sigil glyphs, bright video
                   stays with clean letterforms */
                const INK_ALPHA = ('ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
                    'abcdefghijklmnopqrstuvwxyz' +
                    '0123456789' +
                    '!@#$%^&*()_+-=[]{}|;:,.<>?/~`').split('');
                const INK_SIGIL = '░▒▓█▄▀■□◆◇▲▼●○★☆✦✧†‡§¶∞≈≠≤≥∑∫µ±÷×'.split('');
                const INK_BANK = INK_ALPHA.concat(INK_SIGIL);
                /* the three inks — rainbow dominates; jetblack and white
                   light strike through it like lacquer and glare */
                const pickInk = () => {
                    const roll = Math.random();
                    if (roll < 0.17) return 'jetblack';
                    if (roll < 0.34) return 'white';
                    return 'rainbow';
                };
                const spawnGlyph = (w, h, life) => {
                    glyphs.push({
                        x: Math.random() * w,                        // uniform-random:
                        y: Math.random() * h,                        // may overlap, may
                        ch: (Math.random() < R16.sigilBias()) ? /* R1.6: source picks the alphabet */
                            INK_SIGIL[(Math.random() * INK_SIGIL.length) | 0] :
                            INK_ALPHA[(Math.random() * INK_ALPHA.length) | 0], // sit far apart
                        /* R1.4: the rainbow ink orbits the source's spectrum —
                           vivid videos tighten the wheel, grey ones open it */
                        hue: (videoPalette.hue + (Math.random() - 0.5) * 360 * srcSpreadK() + 360) % 360,
                        kind: pickInk(),
                        size: (15 + Math.pow(Math.random(), 1.6) * 52) *
                            R16.inkScale(), /* R1.6: dark canvas, bigger ink */
                        rot: (Math.random() - 0.5) * 0.44,           // ±12.6° stamp tilt
                        vrot: (Math.random() - 0.5) * 0.10,
                        born: customTime,
                        life: life
                    });
                };
                let spawnAccum = 0;
                let lastT = null;
                const renderFn = (progress) => {
                    const s = getStrength();
                    if (s <= 0) { glyphs.length = 0; lastT = null; return; }
                    const w = mainCanvas.width,
                        h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    const now = customTime;
                    const dt = (lastT === null) ? 0.016 :
                        Math.max(0.001, Math.min(0.1, (now - lastT) / 1000));
                    lastT = now;
                    /* the ensemble keys the ink's appearance RATE, never its
                       opacity — the flow carries gate + duck + masters */
                    const flow = effectPaintAlpha('Ink Glyphs', s, comboProfile.glowMult || 1);
                    if (flow <= 0.004) return;
                    const timed = (progress !== undefined);
                    /* spawn pressure: a steady scatter when persistent; a
                       swelling flurry across a timed burst */
                    let rate = (0.8 + 5.4 * s) * (0.45 + 0.55 * FX_ENS.breath) *
                        (0.55 + 0.45 * fxGate('Ink Glyphs')) *
                        (0.85 + 0.30 * srcEnergyK()); /* R1.5: source energy feeds the ink flow */
                    if (timed) {
                        rate *= (1 + 2.6 * envArc(progress));
                        if (progress < 0.06 && glyphs.length === 0) {
                            for (let i = 0; i < 4; i++) spawnGlyph(w, h, 600 + Math.random() * 900);
                        }
                    }
                    spawnAccum += rate * flow * dt;
                    while (spawnAccum >= 1) {
                        spawnAccum -= 1;
                        if (glyphs.length < MAX_INK) {
                            spawnGlyph(w, h, (timed ? 600 + Math.random() * 1100 :
                                1900 + Math.random() * 2600) * R16.inkLife()); /* R1.8: dark canvas, ink lingers */
                        }
                    }
                    gctx.save();
                    gctx.globalCompositeOperation = 'source-over'; // true opaque ink
                    gctx.textAlign = 'center';
                    gctx.textBaseline = 'middle';
                    for (let i = glyphs.length - 1; i >= 0; i--) {
                        const g = glyphs[i];
                        const age = now - g.born;
                        if (age >= g.life) { glyphs.splice(i, 1); continue; }
                        /* stamp envelope: quick press-in, hold, quick lift-out —
                           opacity never fades, the stamp scale carries the exit */
                        let k = 1;
                        if (age < 140) k = 0.55 + 0.45 * smooth01(age / 140);
                        else if (age > g.life - 170) k = 0.55 + 0.45 * smooth01((g.life - age) / 170);
                        g.rot += g.vrot * dt;
                        gctx.save();
                        gctx.translate(g.x, g.y);
                        gctx.rotate(g.rot);
                        gctx.scale(k, k);
                        gctx.font = 'bold ' + g.size.toFixed(0) + 'px "Courier New", monospace';
                        /* under-copy — the offset layer that makes overlaps read
                           as stacked ink; white light gets a dark edge so it reads
                           on any background, jetblack gets a deeper black */
                        if (g.kind === 'white') {
                            gctx.fillStyle = fxHsla(g.hue, 40, 16, 1);
                            gctx.fillText(g.ch, g.size * 0.045, g.size * 0.045);
                            gctx.fillStyle = fxHsla(g.hue, 12, 96, 1);   // white light ink
                            gctx.fillText(g.ch, 0, 0);
                        } else if (g.kind === 'jetblack') {
                            gctx.fillStyle = fxHsla(g.hue, 30, 3, 1);
                            gctx.fillText(g.ch, g.size * 0.045, g.size * 0.045);
                            gctx.fillStyle = fxHsla(g.hue, 22, 7, 1);    // jetblack ink
                            gctx.fillText(g.ch, 0, 0);
                        } else {
                            gctx.fillStyle = fxHsla(g.hue, 100, 16, 1);
                            gctx.fillText(g.ch, g.size * 0.045, g.size * 0.045);
                            gctx.fillStyle = fxHsla(g.hue, 100, 58, 1);  // rainbow ink
                            gctx.fillText(g.ch, 0, 0);
                        }
                        gctx.restore();
                    }
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            const techArtist = { gl: null, canvas: null, prog: null, uni: {}, failed: false, w: 0, h: 0 };
            let taVel = { x: 0, y: 0 };


            /* =============== FACTORY 13 — MATRIX ASCII · TYPESET RAIN ==========
               Named typesets (not a flat DB). Reality draws IRL scripts:
               latin / cyrillic / greek / hebrew / arabic / devanagari / thai /
               hangul / hanzi / javanese. Virtual draws the machine rain:
               katakana (Wachowski) + CP437 box/block + Latin-1/dingbats +
               math operators. Mix interleaves both + Ghost-Key leet.
               Same Ghost-Key and 0/50/75/100 B&W rails as every other voice. */
            function glitchMatrixAsciiFactory(getStrength, isPersistent) {
                const streams = [];
                let lastT = null;
                const boardCtx = () => ({
                    ghost: getGhostMode(), vsync: getVsyncMode(),
                    warp: isAiWarpActive, bw: effectAlphas['B&W Invert'] || 0
                });
                const spawnStream = (w, h, realm) => {
                    const E = window.GlitchEngine;
                    const size = 11 + Math.random() * 13;
                    const depth = 8 + ((Math.random() * 16) | 0);
                    const glyphs = [];
                    for (let k = 0; k < depth; k++) {
                        glyphs.push({
                            ch: (E && E.pickGlyph) ? E.pickGlyph(realm, Math.random, k % 3) : '01'[(Math.random() * 2) | 0],
                            delay: k
                        });
                    }
                    return {
                        x: Math.random() * w,
                        y: -Math.random() * h * 0.6,
                        speed: (realm === 'virtual' ? 92 : realm === 'reality' ? 26 : 54) * (0.55 + Math.random()),
                        size: size,
                        glyphs: glyphs,
                        hueJit: (Math.random() - 0.5) * 18,
                        realm: realm
                    };
                };
                const renderFn = (progress) => {
                    const s = getStrength();
                    if (s <= 0) { streams.length = 0; lastT = null; return; }
                    const w = mainCanvas.width, h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    const E = window.GlitchEngine;
                    const realm = E ? E.realmFromBoard(boardCtx()) : 'mix';
                    const master = effectPaintAlpha('Matrix ASCII', s, comboProfile.glowMult || 1);
                    if (master <= 0.004) return;
                    const now = customTime;
                    const dt = lastT == null ? 0.016 : Math.min(0.05, (now - lastT) / 1000);
                    lastT = now;
                    /* R2 SOFT-EYE: fewer streams when calm (×0.48), full rain only in a crescendo */
                    const nWant = Math.round(((realm === 'virtual' ? 16 : 9) + s * (realm === 'virtual' ? 30 : 18)) *
                        GlitchEngine.softMatrixK(softK()));
                    while (streams.length < nWant) streams.push(spawnStream(w, h, realm));
                    if (streams.length > nWant) streams.length = nWant;
                    const bw = bwInvertMap(effectAlphas['B&W Invert'] || 0);
                    const home = (typeof GHOST_KEY_HUES !== 'undefined') ? GHOST_KEY_HUES : [313, 270, 145];
                    let baseHue;
                    if (realm === 'reality') baseHue = fxLerpHue(home[0], fxConfluenceHue(0), 0.45);
                    else if (realm === 'virtual') baseHue = fxLerpHue(120, home[2], 0.40);
                    else baseHue = fxConfluenceHue(0);
                    baseHue = (baseHue + bw.hueDeg + (bw.invert > 0.004 ? 180 * (bw.invert / 0.75) : 0) + 360) % 360;
                    gctx.save();
                    gctx.textBaseline = 'top';
                    gctx.globalCompositeOperation = realm === 'reality' ? 'source-over' : 'screen';
                    for (let i = 0; i < streams.length; i++) {
                        const st = streams[i];
                        if (st.realm !== realm && Math.random() < 0.04) {
                            streams[i] = spawnStream(w, h, realm);
                            continue;
                        }
                        st.y += st.speed * dt * (0.7 + 0.6 * s) * (0.85 + 0.30 * srcEnergyK());
                        if (st.y > h + 8) {
                            streams[i] = spawnStream(w, h, realm);
                            continue;
                        }
                        gctx.font = 'bold ' + st.size.toFixed(0) + 'px "Courier New", monospace';
                        const hue = (baseHue + st.hueJit + 360) % 360;
                        for (let k = 0; k < st.glyphs.length; k++) {
                            const cellY = st.y + k * st.size * 0.92;
                            if (cellY < -st.size || cellY > h) continue;
                            if (k === 0 && Math.random() < (realm === 'virtual' ? 0.38 : 0.12)) {
                                st.glyphs[k].ch = (E && E.pickGlyph) ? E.pickGlyph(realm, Math.random, 0) : st.glyphs[k].ch;
                            }
                            const head = k === 0;
                            const trail = 1 - k / st.glyphs.length;
                            const a = master * (head ? 0.95 : 0.16 + 0.55 * trail) *
                                (0.55 + 0.45 * fxGate('Matrix ASCII'));
                            if (a < 0.02) continue;
                            if (head) {
                                gctx.shadowColor = fxHsla(hue, 100, 70, 1);
                                gctx.shadowBlur = realm === 'virtual' ? 8 : 3;
                                gctx.fillStyle = fxHsla(hue, realm === 'reality' ? 52 : 90, 86, a);
                            } else {
                                gctx.shadowBlur = 0;
                                gctx.fillStyle = fxHsla(hue, realm === 'reality' ? 38 : 72, 46 + trail * 18, a * 0.85);
                            }
                            gctx.fillText(st.glyphs[k].ch, st.x, cellY);
                        }
                        gctx.shadowBlur = 0;
                    }
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            /* =============== FACTORY 14 — MATRIX CHORD(S) · HARMONIC RAIN ======
               Three streams = live Ghost-Key chord tones (root / third / fifth).
               Reality voicings: shell / flesh / paper / street / body (close analog).
               Virtual voicings: rain / net / code / infinite / fearcomma (wide digital).
               Typesets follow the same IRL-script vs machine-glyph split. */
            function glitchMatrixChordFactory(getStrength, isPersistent) {
                const drops = [[], [], []];
                let lastT = null;
                const boardCtx = () => ({
                    ghost: getGhostMode(), vsync: getVsyncMode(),
                    warp: isAiWarpActive, bw: effectAlphas['B&W Invert'] || 0
                });
                const renderFn = (progress) => {
                    const s = getStrength();
                    if (s <= 0) { drops[0].length = drops[1].length = drops[2].length = 0; lastT = null; return; }
                    const w = mainCanvas.width, h = mainCanvas.height;
                    if (w < 8 || h < 8) return;
                    const E = window.GlitchEngine;
                    const realm = E ? E.realmFromBoard(boardCtx()) : 'mix';
                    const master = effectPaintAlpha('Matrix Chord', s, comboProfile.glowMult || 1);
                    if (master <= 0.004) return;
                    const now = customTime;
                    const dt = lastT == null ? 0.016 : Math.min(0.05, (now - lastT) / 1000);
                    lastT = now;
                    const bw = bwInvertMap(effectAlphas['B&W Invert'] || 0);
                    const chord = FX_CHORDS[FX_KEY.idx] || FX_CHORDS[0];
                    const nPer = 4 + Math.round(s * 9);
                    gctx.save();
                    gctx.textBaseline = 'middle';
                    gctx.globalCompositeOperation = realm === 'reality' ? 'source-over' : 'screen';
                    for (let tone = 0; tone < 3; tone++) {
                        const hue = (fxTone(tone, 0) + bw.hueDeg +
                            (bw.invert > 0.004 ? 180 * (bw.invert / 0.75) : 0) + 360) % 360;
                        const bandX0 = (w / 3) * tone;
                        const list = drops[tone];
                        while (list.length < nPer) {
                            list.push({
                                x: bandX0 + Math.random() * (w / 3),
                                y: Math.random() * h,
                                v: (realm === 'virtual' ? 74 : 22) * (0.5 + Math.random()),
                                ch: (E && E.pickGlyph) ? E.pickGlyph(realm, Math.random, tone) : '♪',
                                size: 12 + Math.random() * 18
                            });
                        }
                        while (list.length > nPer) list.pop();
                        for (let i = 0; i < list.length; i++) {
                            const d = list[i];
                            d.y += d.v * dt * (0.8 + 0.5 * s) * (0.85 + 0.30 * srcEnergyK());
                            if (d.y > h + 20) {
                                d.y = -20;
                                d.x = bandX0 + Math.random() * (w / 3);
                                d.ch = (E && E.pickGlyph) ? E.pickGlyph(realm, Math.random, tone) : d.ch;
                            }
                            if (Math.random() < 0.08) {
                                d.ch = (E && E.pickGlyph) ? E.pickGlyph(realm, Math.random, tone) : d.ch;
                            }
                            gctx.font = 'bold ' + d.size.toFixed(0) + 'px "Courier New", monospace';
                            const a = master * (0.32 + 0.55 * (tone === 0 ? 1 : 0.72)) *
                                (0.55 + 0.45 * fxGate('Matrix Chord'));
                            if (a < 0.02) continue;
                            gctx.fillStyle = fxHsla(hue, realm === 'virtual' ? 86 : 48, 62, a);
                            gctx.fillText(d.ch, d.x, d.y);
                        }
                    }
                    const label = ((chord && chord.name) || 'shell').toUpperCase() + ' · ' + realm.toUpperCase();
                    const ax = (FX_ENS.stage.x || 0.5) * w;
                    const ay = (FX_ENS.stage.y || 0.5) * h;
                    gctx.globalCompositeOperation = 'lighter';
                    gctx.textAlign = 'center';
                    gctx.font = 'bold ' + (16 + s * 20).toFixed(0) + 'px "Courier New", monospace';
                    gctx.fillStyle = fxHsla(fxTone(0, 0), 82, 78, master * 0.50);
                    gctx.fillText(label, ax, ay);
                    gctx.textAlign = 'start';
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }

            function techArtistInit() {
                if (techArtist.gl || techArtist.failed) return techArtist.gl;
                const cv = document.createElement('canvas');
                const gl = cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false,
                    powerPreference: 'low-power' });
                if (!gl) { techArtist.failed = true; return null; }
                const vs = 'attribute vec2 aP;void main(){gl_Position=vec4(aP,0.0,1.0);}';
                const fs = [
                    'precision mediump float;',
                    'uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform vec2 uV;uniform float uHue;uniform float uE;',
                    'mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}',
                    'void main(){',
                    '  vec2 uv=(gl_FragCoord.xy*2.0-uRes)/uRes.y;',
                    '  float vm=length(uV);',
                    '  uv+=(uM-0.5)*0.35+uV*0.4*(0.6+0.4*sin(uT*0.6));',
                    '  vec3 rd=normalize(vec3(uv,1.0+vm*0.8));',
                    '  vec3 col=vec3(0.0);',
                    '  for(float i=0.0;i<14.0;i++){',
                    '    float z=i*1.05+0.1;',
                    '    vec3 p=z*rd;',
                    '    p.xz=rot(uT*0.2+uM.x*1.4+uV.x*2.0)*p.xz;',
                    '    p.yz=rot(uT*0.15+uM.y*1.2+uV.y*2.0)*p.yz;',
                    '    p.xy=rot(sin(uT*0.35+z*0.8+vm*5.0)*0.3)*p.xy;',
                    '    for(float d=1.0;d<4.0;d+=1.0){p-=sin(p*d+uT+i*0.1).yzx/(d*0.8);}',
                    '    vec3 q=abs(p);float mx=max(max(q.x,q.y),q.z);',
                    '    float s=p.z+p.y-uT;',
                    '    float dist=abs(2.0-mx)+abs(cos(s))/7.0;',
                    '    vec4 ph=vec4((uM.x-uM.y)*2.0+vm*3.0,2.0+uM.y*2.5+vm*2.0,4.0-uM.y*2.5-vm*2.0,0.0);',
                    '    col+=(cos(s-z*0.5-dist+ph.xyz+uHue)+1.0)/(dist*(0.5+vm*0.6)+0.015);',
                    '  }',
                    '  col=col*0.38/14.0;col=col/(1.0+col);col*=1.0+uE*0.12;',
                    '  col=smoothstep(0.15,0.85,col);',
                    '  gl_FragColor=vec4(col,1.0);',
                    '}'
                ].join('\n');

                function sh(type, src) {
                    const s = gl.createShader(type);
                    gl.shaderSource(s, src);
                    gl.compileShader(s);
                    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('TA shader:', gl
                            .getShaderInfoLog(s)); return null; }
                    return s;
                }
                const vsh = sh(gl.VERTEX_SHADER, vs),
                    fsh = sh(gl.FRAGMENT_SHADER, fs);
                if (!vsh || !fsh) { techArtist.failed = true; return null; }
                const prog = gl.createProgram();
                gl.attachShader(prog, vsh);
                gl.attachShader(prog, fsh);
                gl.linkProgram(prog);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { techArtist.failed = true; return null; }
                gl.useProgram(prog);
                const buf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
                const loc = gl.getAttribLocation(prog, 'aP');
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
                techArtist.gl = gl;
                techArtist.canvas = cv;
                techArtist.prog = prog;
                techArtist.uni = {
                    res: gl.getUniformLocation(prog, 'uRes'),
                    t: gl.getUniformLocation(prog, 'uT'),
                    m: gl.getUniformLocation(prog, 'uM'),
                    v: gl.getUniformLocation(prog, 'uV'),
                    hue: gl.getUniformLocation(prog, 'uHue'),
                    e: gl.getUniformLocation(prog, 'uE')
                };
                return gl;
            }

            const videoDistort = {
                gl: null,
                canvas: null,
                prog: null,
                tex: null,
                uni: {},
                failed: false,
                w: 0,
                h: 0,
                buf: null
            };

            function videoDistortInit() {
                if (videoDistort.gl || videoDistort.failed) return videoDistort.gl;
                const cv = document.createElement('canvas');
                const gl = cv.getContext('webgl', {
                    antialias: false,
                    alpha: false,
                    premultipliedAlpha: false,
                    powerPreference: 'low-power',
                    preserveDrawingBuffer: false
                });
                if (!gl) { videoDistort.failed = true; return null; }

                const vs =
                    'attribute vec2 aP;varying vec2 vUv;void main(){vUv=aP*0.5+0.5;gl_Position=vec4(aP,0.0,1.0);}';
                const fs = [
                    'precision mediump float;',
                    'varying vec2 vUv;',
                    'uniform sampler2D uVideo;',
                    'uniform float uTime;',
                    'uniform float uStrength;',
                    'uniform float uMotion;',
                    'uniform float uBeam;',
                    'uniform float uRipple;',
                    'uniform float uRgb;',
                    'uniform vec2 uRes;',
                    'void main(){',
                    '  vec2 uv=vUv;',
                    '  float s=clamp(uStrength,0.0,1.0);',
                    '  float m=clamp(uMotion,0.0,1.0);',
                    '  float beam=fract(uTime*0.12*uBeam);',
                    '  float dist=uv.y-beam;',
                    '  float env=exp(-dist*dist*28.0);',
                    '  float wave=sin(uv.y*22.0+uTime*2.2)*cos(uv.y*9.0+uTime*1.1);',
                    '  uv.x+=wave*0.018*s*m*uRipple*(0.35+0.65*env);',
                    '  uv.x+=sin(uv.y*6.0+uTime*0.7)*0.006*s*m;',
                    '  uv.y+=sin(uv.x*8.0+uTime*1.3)*0.004*s*m;',
                    '  float split=0.004*s*m*uRgb*(0.5+env);',
                    '  float r=texture2D(uVideo,clamp(uv+vec2(split,0.0),0.0,1.0)).r;',
                    '  float g=texture2D(uVideo,clamp(uv,0.0,1.0)).g;',
                    '  float b=texture2D(uVideo,clamp(uv-vec2(split,0.0),0.0,1.0)).b;',
                    '  vec3 col=vec3(r,g,b);',
                    '  float line=mod(gl_FragCoord.y,2.0);',
                    '  col*=0.92+0.08*step(1.0,line);',
                    '  col+=vec3(0.08,0.12,0.16)*env*s*0.5;',
                    '  gl_FragColor=vec4(col,1.0);',
                    '}'
                ].join('\n');

                function sh(type, src) {
                    const s = gl.createShader(type);
                    gl.shaderSource(s, src);
                    gl.compileShader(s);
                    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                        console.warn('VideoDistort shader:', gl.getShaderInfoLog(s));
                        return null;
                    }
                    return s;
                }
                const vsh = sh(gl.VERTEX_SHADER, vs),
                    fsh = sh(gl.FRAGMENT_SHADER, fs);
                if (!vsh || !fsh) { videoDistort.failed = true; return null; }
                const prog = gl.createProgram();
                gl.attachShader(prog, vsh);
                gl.attachShader(prog, fsh);
                gl.linkProgram(prog);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                    videoDistort.failed = true;
                    return null;
                }
                gl.useProgram(prog);
                const buf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
                const loc = gl.getAttribLocation(prog, 'aP');
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                videoDistort.gl = gl;
                videoDistort.canvas = cv;
                videoDistort.prog = prog;
                videoDistort.tex = tex;
                videoDistort.buf = buf;
                videoDistort.uni = {
                    video: gl.getUniformLocation(prog, 'uVideo'),
                    time: gl.getUniformLocation(prog, 'uTime'),
                    strength: gl.getUniformLocation(prog, 'uStrength'),
                    motion: gl.getUniformLocation(prog, 'uMotion'),
                    beam: gl.getUniformLocation(prog, 'uBeam'),
                    ripple: gl.getUniformLocation(prog, 'uRipple'),
                    rgb: gl.getUniformLocation(prog, 'uRgb'),
                    res: gl.getUniformLocation(prog, 'uRes')
                };
                gl.uniform1i(videoDistort.uni.video, 0);
                return gl;
            }

            function videoDistortStrength() {
                const vhs = effectAlphas['VHS Glitch'] || 0;
                const bands = effectAlphas['Data Bands'] || 0;
                const warp = isAiWarpActive ? 0.45 : 0;
                const base = Math.max(vhs, bands * 0.85, warp);
                return clamp01(base * masterOpacity * clamp01(masterControls.effectIntensity));
            }

            function renderVideoDistort(now) {
                if (!document.body.classList.contains('local-video')) return false;
                if (!video || video.readyState < 2 || video.paused && video.currentTime === 0) return false;
                const strength = videoDistortStrength();
                if (strength < 0.01) return false;
                const gl = videoDistortInit();
                if (!gl) return false;

                const motion = clamp01(masterControls.motionScale);
                const w = Math.max(2, (mainCanvas.width * 0.55) | 0);
                const h = Math.max(2, (mainCanvas.height * 0.55) | 0);
                if (videoDistort.canvas.width !== w || videoDistort.canvas.height !== h) {
                    videoDistort.canvas.width = w;
                    videoDistort.canvas.height = h;
                    gl.viewport(0, 0, w, h);
                }

                gl.useProgram(videoDistort.prog);
                gl.bindBuffer(gl.ARRAY_BUFFER, videoDistort.buf);
                const loc = gl.getAttribLocation(videoDistort.prog, 'aP');
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, videoDistort.tex);
                try {
                    // ORIENTATION: the vertex shader maps clip space to UV as
                    // vUv = aP*0.5+0.5, so v=0 is the BOTTOM of the quad. A raw
                    // texImage2D upload puts the video's FIRST (top) row at v=0,
                    // which renders the frame upside down. WebGL uploads are not
                    // flipped by default -- ask for it explicitly.
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
                } catch (e) {
                    return false;
                } finally {
                    // Restore the default: this flag is GL-context state, not
                    // per-texture, and this context is shared with any other
                    // uploads that (correctly) assume it is off.
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                }

                const vhs = effectAlphas['VHS Glitch'] || 0;
                const bands = effectAlphas['Data Bands'] || 0;
                gl.uniform1f(videoDistort.uni.time, now * 0.001);
                gl.uniform1f(videoDistort.uni.strength, strength);
                gl.uniform1f(videoDistort.uni.motion, motion);
                gl.uniform1f(videoDistort.uni.beam, 0.7 + vhs * 0.6);
                gl.uniform1f(videoDistort.uni.ripple, 0.5 + bands * 0.8 + vhs * 0.5);
                gl.uniform1f(videoDistort.uni.rgb, 0.4 + vhs * 0.9);
                gl.uniform2f(videoDistort.uni.res, w, h);
                gl.drawArrays(gl.TRIANGLES, 0, 3);

                gctx.save();
                gctx.globalCompositeOperation = 'source-over';
                gctx.globalAlpha = 1;
                gctx.drawImage(videoDistort.canvas, 0, 0, mainCanvas.width, mainCanvas.height);
                gctx.restore();
                return true;
            }

            function glitchTechArtistShaderFactory(getStrength, isPersistent) {
                const renderFn = () => {
                    const s = getStrength();
                    if (s <= 0) return;
                    const gl = techArtistInit();
                    if (!gl) return;
                    const w = Math.max(2, (mainCanvas.width * 0.5) | 0);
                    const h = Math.max(2, (mainCanvas.height * 0.5) | 0);
                    if (techArtist.canvas.width !== w || techArtist.canvas.height !== h) {
                        techArtist.canvas.width = w;
                        techArtist.canvas.height = h;
                        gl.viewport(0, 0, w, h);
                    }
                    taVel.x *= 0.92;
                    taVel.y *= 0.92;
                    gl.uniform2f(techArtist.uni.res, w, h);
                    gl.uniform1f(techArtist.uni.t, customTime * 0.002);
                    gl.uniform2f(techArtist.uni.m, techArtistMouse.x, techArtistMouse.y);
                    gl.uniform2f(techArtist.uni.v, taVel.x, taVel.y);
                    /* v11.2: the shader plays in the ensemble's KEY — its hue is the
                       chord root and its energy swells with the master breath */
                    gl.uniform1f(techArtist.uni.hue, fxTone(0) * 0.0174533);
                    gl.uniform1f(techArtist.uni.e, clamp01(videoPalette.energy) * (0.65 + 0.35 * FX_ENS.breath));
                    gl.drawArrays(gl.TRIANGLES, 0, 3);
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    /* toned + ensemble-mixed: resonance gate and auto-mix duck apply */
                    const gate = 0.40 + 0.60 * fxGate('Tech Artist');
                    const duck = FX_ENS.duck['Tech Artist'] || 1;
                    gctx.globalAlpha = Math.min(0.45, s * 0.45 * (comboProfile.glowMult || 1)) * gate * duck;
                    gctx.drawImage(techArtist.canvas, 0, 0, mainCanvas.width, mainCanvas.height);
                    gctx.restore();
                };
                return isPersistent ? renderFn : createTimedEffect(renderFn);
            }
            let techArtistMouse = { x: 0.5, y: 0.5 };
            window.addEventListener('mousemove', (ev) => {
                const nx = ev.clientX / window.innerWidth;
                const ny = 1 - (ev.clientY / window.innerHeight);
                const dx = nx - techArtistMouse.x,
                    dy = ny - techArtistMouse.y;
                techArtistMouse = { x: nx, y: ny };
                taVel.x = clamp(dx * 6, -1, 1);
                taVel.y = clamp(dy * 6, -1, 1);
            }, { passive: true });

    /* ===== END VERBATIM GLITCH REVISION 3 FACTORY SOURCE ===== */

    const R3_FACTORY_DEFS = [
        ['Neon Grad', glitchNeonGradientOverlayFactory],
        ['Scanlines', glitchScanlinesFactory],
        ['Flash', glitchBrightFlashFactory],
        ['HSL Rainbow', glitchHSLRainbowFactory],
        ['ASCII', glitchASCIIArtOverlayFactory],
        ['Font Burn', glitchFontBurnFactory],
        ['Strobe', glitchStrobeFactory],
        ['Gemini Bomb', glitchGeminiBombFactory],
        ['Tech Artist', glitchTechArtistShaderFactory],
        ['Data Bands', glitchVHSFactory],
        ['VHS Glitch', glitchVHSGlitchFactory],
        ['Data Bomb', glitchDataBombFactory],
        ['Ink Glyphs', glitchInkGlyphsFactory],
        ['Matrix ASCII', glitchMatrixAsciiFactory],
        ['Matrix Chord', glitchMatrixChordFactory]
    ];

    let lastFrameAt = -1;
    let lastFrameTime = 0;

    function bindR3Context(engine, context, now) {
        currentEngine = engine;
        gctx = context;
        mainCanvas = engine.canvas;
        customTime = now;
        masterOpacity = clamp01(engine.masterOpacity == null ? 0.95 : engine.masterOpacity);
        masterControls = {
            effectIntensity: clamp(engine.boardEnergy == null ? 0.65 : engine.boardEnergy, 0.1, 1.5),
            motionScale: engine.motionScale == null ? 0.8 : engine.motionScale,
            blendSoftness: engine.blendSoftness == null ? 0.5 : engine.blendSoftness,
            boardEnergy: engine.boardEnergy == null ? 0.65 : engine.boardEnergy
        };
        isAiWarpActive = !!engine.aiWarpActive;
        const p = engine.videoPalette || {};
        const saturation = p.sat == null ? 65 : (p.sat <= 1.001 ? p.sat * 100 : p.sat);
        const brightness = p.brightness == null ? 0.45 : p.brightness;
        const blend = root.R3GhostVsync && typeof root.R3GhostVsync.getWarpBlendProfile === 'function'
            ? root.R3GhostVsync.getWarpBlendProfile(engine.aiWarpMode) : { canvas:1, softEye:1, ear:1 };
        videoPalette = {
            hue: p.hue == null ? 205 : p.hue,
            sat: clamp(saturation, 10, 100),
            light: clamp(brightness <= 1.001 ? brightness * 100 : brightness, 10, 90),
            energy: clamp01((p.energy == null ? (engine.audioDrive || {}).drive || 0.5 : p.energy) * blend.canvas),
            motion: clamp01((p.motion == null ? 0.1 : p.motion) * blend.canvas),
            darkness: clamp01(p.darkness == null ? 1 - brightness : p.darkness)
        };
        comboProfile = { glowMult: 0.9 + videoPalette.energy * 0.25, satMult: 1, contrastMult: 1 };
        SOFT.k = clamp01((engine.softEyeK == null ? 1 : engine.softEyeK || 1) * blend.softEye);
        SOFT.beat = clamp01(((engine.audioDrive || {}).beat || 0) * blend.ear);
        beat = SOFT.beat;
        effectAlphas = new Proxy(Object.create(null), {
            get: (_, key) => typeof key === 'string' ? clamp01(engine.effectAlphas[key + GC3_SUFFIX] || 0) : 0,
            has: (_, key) => typeof key === 'string' && (key + GC3_SUFFIX) in engine.effectAlphas
        });
        if (lastFrameAt !== now) {
            const dt = lastFrameAt < 0 ? 0.016 : Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
            lastFrameAt = now;
            lastFrameTime = now;
            try { stepFxKey(now, dt); } catch (e) {}
            try { stepFxEnsemble(now, dt); } catch (e) {}
        }
    }

    function makeR3Runner(engine, baseName, factory) {
        const render = factory(() => clamp01(engine.liveAlpha(baseName + GC3_SUFFIX)), true);
        return function renderGC3Voice(context, now) {
            bindR3Context(engine, context, now || performance.now());
            const size = clamp(engine.sizeFor(baseName + GC3_SUFFIX), 0.2, 3);
            currentDepth = clamp01(engine.depthFor(baseName + GC3_SUFFIX));
            if (engine.liveAlpha(baseName + GC3_SUFFIX) <= 0.001 || currentDepth <= 0.001) return;
            context.save();
            if (Math.abs(size - 1) > 0.01) {
                context.translate(engine.canvas.width * 0.5, engine.canvas.height * 0.5);
                context.scale(size, size);
                context.translate(-engine.canvas.width * 0.5, -engine.canvas.height * 0.5);
            }
            try { render(); } finally { context.restore(); }
        };
    }

    /* Revision 3 keeps these two panel rails in its master/filter path rather than
       timed canvas factories. The bridge renders their equivalent directly on the
       Canvas, keeping the GC#(3) rails independent and fully SVG-free. */
    function makeBwRunner(engine) {
        const name = 'B&W Invert' + GC3_SUFFIX;
        return function renderGC3Bw(context, now) {
            bindR3Context(engine, context, now || performance.now());
            const s = engine.liveAlpha(name), depth = engine.depthFor(name);
            if (s <= 0.001 || depth <= 0.001) return;
            const map = bwInvertMap(s);
            context.save();
            context.globalCompositeOperation = 'difference';
            context.fillStyle = 'rgba(255,255,255,' + clamp01(Math.max(map.invert || 0, s * 0.24) * depth) + ')';
            context.fillRect(0, 0, engine.canvas.width, engine.canvas.height);
            context.restore();
        };
    }
    function makeHueRunner(engine) {
        const name = 'Hue/Color Cycle' + GC3_SUFFIX;
        return function renderGC3Hue(context, now) {
            bindR3Context(engine, context, now || performance.now());
            const s = engine.liveAlpha(name), depth = engine.depthFor(name);
            if (s <= 0.001 || depth <= 0.001) return;
            context.save();
            context.globalCompositeOperation = 'hue';
            context.fillStyle = 'hsla(' + ((now * 0.045 + videoPalette.hue) % 360).toFixed(1) + ',100%,50%,' +
                clamp01(s * depth * 0.62).toFixed(3) + ')';
            context.fillRect(0, 0, engine.canvas.width, engine.canvas.height);
            context.restore();
        };
    }

    root.GC3FactoryBank = {
        source: 'Glitch Revision 3',
        suffix: GC3_SUFFIX,
        baseVoices: GC3_BASE_VOICES.slice(),
        voiceNames: GC3_BASE_VOICES.map((name) => name + GC3_SUFFIX),
        createRunners(engine) {
            const runners = R3_FACTORY_DEFS.map(([name, factory]) => makeR3Runner(engine, name, factory));
            runners.push(makeBwRunner(engine), makeHueRunner(engine));
            return runners;
        }
    };
})(typeof window !== 'undefined' ? window : this);

;/* ===== r3_ghost_vsync.js ===== */
/**
 * R3 GHOST PROTOCOL + V-SYNC ENGINE
 * Canvas-only integration of the Ghost Protocol v11 / V-Sync v11 behaviour from
 * Glitch Revision 3. SVG filter mutation and filter URLs are deliberately omitted:
 * the same confluence, channel-split, tracking, scan, roll, burst, and automation
 * behaviour is rendered by Canvas/WebGL-safe primitives instead.
 */
(function (root) {
    'use strict';

    const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
    const clamp01 = value => clamp(value, 0, 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeExp = (a, b, dt, rate) => a + (b - a) * (1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt)));
    const mod = (value, range) => ((value % range) + range) % range;

    const FALLBACK_GHOSTS = {
        DIA:      { split: 0.88, chan: 0.72, lines: 0.50, glow: 0.22, warp: 0.38, blur: 0.35, hueA: 313, hueB: 145, sat: 1.22, gray: 0.06, crt: 0, led: 0, dia: 1, realm: 'mix' },
        SPECTRUM: { split: 1.00, chan: 0.90, lines: 1.00, glow: 0.45, warp: 0.70, blur: 1.00, hueA: 135, hueB: 75, sat: 1.45, gray: 0.30, crt: 0, led: 0, dia: 0, realm: 'mix' },
        CRT:      { split: 0.70, chan: 0.65, lines: 1.65, glow: 0.30, warp: 0.45, blur: 0.80, hueA: 55, hueB: 25, sat: 0.85, gray: 0.74, crt: 1, led: 0, dia: 0, realm: 'reality' },
        PLASMA:   { split: 1.15, chan: 1.00, lines: 0.80, glow: 0.60, warp: 0.95, blur: 1.25, hueA: 195, hueB: 100, sat: 1.85, gray: 0.16, crt: 0, led: 0, dia: 0, realm: 'virtual' },
        LED:      { split: 1.38, chan: 1.22, lines: 0.22, glow: 0.90, warp: 1.12, blur: 0.12, hueA: 0, hueB: 120, sat: 2.05, gray: 0.00, crt: 0, led: 1, dia: 0, realm: 'virtual' }
    };

    const FALLBACK_VSYNC = {
        ON:        { bar: 1.00, tears: 0.55, roll: 0.00, hum: 0.35, snap: 0, sharp: 0.62, scanphase: 1.00, harmony: 0.28 },
        GHOST_OFF: { bar: 0.35, tears: 0.12, roll: 0.14, hum: 0.18, snap: 0, sharp: 0.40, scanphase: 0.32, harmony: 1.00 },
        FULL:      { bar: 1.15, tears: 1.00, roll: 0.85, hum: 0.85, snap: 1, sharp: 1.00, scanphase: 0.88, harmony: 0.55 }
    };

    // Deterministic per-AI-Warp blend tuning. Values are intentionally restrained;
    // they shape Ghost/V-Sync character without changing the user's master levels.
    const WARP_BLEND = {
        liquid:                 [1.06,0.96,0.90,0.90,0.92, 0.82,0.82,0.70,0.86, 0],
        prism:                  [0.82,1.08,1.06,1.02,1.04, 1.02,0.92,0.78,0.92, 72],
        breathe:                [0.94,0.90,0.78,0.78,0.84, 0.72,0.72,0.62,0.78, 144],
        fold:                   [0.88,1.05,1.14,1.10,0.96, 0.92,1.08,0.94,1.02, 216],
        aurora:                 [1.12,1.08,0.82,0.86,1.12, 0.76,0.78,0.66,0.80, 288],
        vortex:                 [1.10,1.10,1.00,1.16,0.96, 1.08,1.14,1.04,1.08, 36],
        cybergrid:              [0.80,0.96,1.20,1.10,0.84, 1.10,1.12,0.92,1.12, 108],
        hyperdrive:              [1.18,1.04,0.92,1.14,1.08, 1.22,1.16,1.20,1.18, 180],
        kaleidoscope:           [0.88,1.18,0.92,0.96,1.02, 0.88,0.84,0.76,0.90, 252],
        quantum:                [1.04,1.20,1.12,1.10,0.90, 1.16,1.22,1.02,1.18, 324],
        ripple:                 [1.08,0.92,0.84,0.92,0.90, 0.78,0.86,0.74,0.84, 18],
        analog_crt:             [0.76,0.90,1.16,0.88,0.74, 0.82,1.00,0.78,0.92, 90],
        newblue_roll:           [0.92,0.98,1.02,0.96,0.88, 1.18,1.10,1.30,1.12, 162],
        newblue_active_cam:     [1.10,1.08,1.10,1.10,1.00, 1.12,1.08,1.12,1.12, 234],
        newblue_shear:          [0.82,0.98,1.12,1.14,0.88, 0.94,1.18,0.96,1.06, 306],
        newblue_wiggle:         [1.14,1.02,1.16,1.06,0.92, 1.20,1.06,1.08,1.14, 45],
        newblue_zoom_blur:      [1.16,0.92,0.90,1.12,1.06, 1.18,0.96,1.12,1.14, 117],
        newblue_video_tile:     [0.80,1.12,1.10,0.94,0.86, 0.98,1.12,0.82,1.02, 189],
        newblue_twirl:          [1.12,1.08,0.94,1.10,1.00, 0.96,0.98,0.92,0.98, 261],
        newblue_light_ring:     [0.94,0.98,0.78,0.82,1.18, 0.82,0.72,0.68,0.78, 333],
        newblue_earthquake:     [1.16,1.16,1.18,1.18,0.90, 1.24,1.24,1.18,1.22, 54],
        newblue_water_drop:     [1.08,0.94,0.84,0.92,1.00, 0.78,0.88,0.74,0.84, 126],
        newblue_rgb_shift:      [1.22,1.20,0.96,1.02,0.96, 1.02,0.94,0.82,0.96, 198],
        newblue_quad_mirror:    [0.80,1.10,0.92,0.90,0.94, 0.90,0.84,0.76,0.88, 270],
        newblue_fish_eye:       [1.06,0.92,0.86,0.98,0.98, 0.86,0.82,0.72,0.84, 342],
        newblue_pinch:          [0.92,0.94,0.90,0.94,0.92, 0.88,0.86,0.76,0.86, 63],
        newblue_solarize:       [0.92,1.14,0.94,0.98,1.02, 1.04,0.94,0.80,0.98, 135],
        newblue_cathode_beam:   [0.74,0.90,1.20,0.94,0.78, 0.84,1.08,0.82,0.94, 207],
        newblue_neon_edges:     [1.02,1.16,0.88,0.96,1.20, 0.94,0.82,0.74,0.90, 279]
    };
    const WARP_AUX = {
        liquid:[0.82,0.92,0.90,1.02,0.88], prism:[1.08,0.98,1.02,0.94,1.02], breathe:[0.78,0.88,0.92,0.88,0.78],
        fold:[1.04,0.96,0.94,1.06,0.98], aurora:[0.92,1.08,1.06,0.98,0.90], vortex:[1.06,1.02,1.06,1.10,1.08],
        cybergrid:[1.08,0.94,0.96,1.04,1.06], hyperdrive:[1.12,1.08,1.04,1.12,1.18], kaleidoscope:[0.98,1.02,0.98,0.96,0.92],
        quantum:[1.14,1.10,1.12,1.10,1.14], ripple:[0.84,0.90,0.94,0.92,0.82], analog_crt:[0.92,0.90,0.88,0.86,0.82],
        newblue_roll:[1.02,1.04,1.02,1.02,1.02], newblue_active_cam:[1.08,1.08,1.10,1.06,1.08], newblue_shear:[1.04,0.98,0.98,1.02,1.00],
        newblue_wiggle:[0.96,1.00,1.04,1.00,1.02], newblue_zoom_blur:[1.06,1.04,1.08,1.06,1.10], newblue_video_tile:[0.96,0.94,0.92,0.98,0.92],
        newblue_twirl:[1.00,1.00,1.02,1.00,1.00], newblue_light_ring:[0.90,1.00,1.00,0.94,0.88], newblue_earthquake:[1.16,1.12,1.08,1.16,1.18],
        newblue_water_drop:[0.86,0.92,0.96,0.92,0.84], newblue_rgb_shift:[1.10,1.04,1.00,1.04,1.04], newblue_quad_mirror:[0.94,0.96,0.94,0.96,0.90],
        newblue_fish_eye:[0.94,0.94,0.98,0.96,0.92], newblue_pinch:[0.92,0.94,0.96,0.94,0.90], newblue_solarize:[1.06,1.00,0.98,1.02,1.02],
        newblue_cathode_beam:[0.90,0.90,0.88,0.90,0.84], newblue_neon_edges:[1.08,1.06,1.02,1.02,1.04]
    };
    const DEFAULT_WARP_BLEND = [1,1,1,1,1,1,1,1,1,0];
    function warpBlendFor(mode) {
        const v = WARP_BLEND[mode] || DEFAULT_WARP_BLEND, a = WARP_AUX[mode] || [1,1,1,1,1];
        return { ghostSplit:v[0], ghostChroma:v[1], ghostLines:v[2], ghostWarp:v[3], ghostGlow:v[4],
            vsyncSpeed:v[5], vsyncTears:v[6], vsyncRoll:v[7], phase:v[8], huePhase:v[9],
            hardLight:a[0], softEye:a[1], ear:a[2], canvas:a[3], automation:a[4] };
    }
    function noise01(slot, salt) {
        const n = Math.sin(slot * 12.9898 + salt * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    function palette(engine) {
        const p = engine.videoPalette || {};
        const hue = mod(p.hue == null ? 205 : p.hue, 360);
        const sat = clamp(p.sat == null ? 66 : (p.sat <= 1.001 ? p.sat * 100 : p.sat), 18, 100);
        const light = clamp(p.brightness == null ? 48 : (p.brightness <= 1.001 ? p.brightness * 100 : p.brightness), 12, 88);
        const colors = Array.isArray(p.colors) && p.colors.length >= 4 ? p.colors : [
            { h: hue, s: sat, l: light }, { h: mod(hue + 72, 360), s: sat, l: light + 6 },
            { h: mod(hue + 188, 360), s: sat * 0.86, l: light - 8 }, { h: mod(hue + 286, 360), s: sat, l: light + 10 }
        ];
        return {
            hue, sat, light, colors,
            energy: clamp01(p.energy == null ? ((engine.audioDrive || {}).drive || 0.45) : p.energy),
            motion: clamp01(p.motion == null ? 0.12 : p.motion)
        };
    }

    function getGhostProfile(mode) {
        if (root.GlitchEngine && typeof root.GlitchEngine.ghostProfile === 'function') return root.GlitchEngine.ghostProfile(mode);
        return FALLBACK_GHOSTS[mode] || FALLBACK_GHOSTS.SPECTRUM;
    }

    function getVsyncMethod(mode) {
        if (root.GlitchEngine && typeof root.GlitchEngine.vsyncMethod === 'function') return root.GlitchEngine.vsyncMethod(mode);
        return FALLBACK_VSYNC[mode] || FALLBACK_VSYNC.ON;
    }

    function bwMap(value) {
        if (root.GlitchEngine && typeof root.GlitchEngine.bwInvertMap === 'function') return root.GlitchEngine.bwInvertMap(value);
        const level = clamp01(value);
        return { hueDeg: level * 360, invert: level > 0.5 ? (level - 0.5) * 1.5 * 0.75 : 0, live: level > 0.008 };
    }

    function create(engine) {
        const random = () => typeof engine.nextDeterministicValue === 'function' ? engine.nextDeterministicValue() : Math.random();
        const scripts = {
            ON: { level: Math.max(0.01, engine.vsyncLevel || 0.60), target: Math.max(0.01, engine.vsyncLevel || 0.60), nextAt: 0, lastPct: -1 },
            GHOST_OFF: { level: 0.60, target: 0.60, nextAt: 0, lastPct: -1 },
            FULL: { level: 0.66, target: 0.66, nextAt: 0, lastPct: -1 }
        };
        let heldLevel = Math.max(0.01, engine.vsyncLevel || 0.60);
        let manualVsyncUntil = 0;
        let manualGhostUntil = 0;
        let ghostTarget = clamp01(engine.ghostLevel || 0.55);
        let nextGhostRetargetAt = 0;
        let nextSystemBurstAt = 0;
        let lastBurstCount = 0;
        let burstOverride = null;
        let lastAutomationUiAt = 0;

        const getGhostMode = () => engine.ghostModes[engine.ghostModeIndex] || 'OFF';
        const getVsyncMode = () => engine.vsyncModes[engine.vsyncModeIndex] || 'OFF';
        const activeVsyncLevel = () => {
            const mode = getVsyncMode();
            return mode === 'OFF' ? 0 : (scripts[mode] ? scripts[mode].level : engine.vsyncLevel || 0);
        };
        const automationEnabled = () => !!(engine.isAutoGlitch || engine.isContinualRandom || engine.isTimedAuto || engine.isAutomatedMasters || engine.softEyeActive);

        function voiceLevel(name) {
            return clamp01((engine.effectAlphas[name] || 0) + (engine.effectAlphas[name + ' GC#(3)'] || 0));
        }

        function confluenceHue(now, extra) {
            const p = palette(engine);
            const ghostAnchor = root.GlitchEngine && root.GlitchEngine.comboGhostAnchor
                ? root.GlitchEngine.comboGhostAnchor(getGhostMode()) : ({ OFF: 0, DIA: 28, SPECTRUM: 45, CRT: 18, PLASMA: 78, LED: 96 }[getGhostMode()] || 0);
            const vsyncAnchor = root.GlitchEngine && root.GlitchEngine.comboVsyncAnchor
                ? root.GlitchEngine.comboVsyncAnchor(getVsyncMode()) : ({ OFF: 0, ON: 8, GHOST_OFF: 32, FULL: 42 }[getVsyncMode()] || 0);
            const hueCycle = voiceLevel('Hue/Color Cycle');
            const rainbow = voiceLevel('HSL Rainbow');
            const breath = Math.sin(now * 0.00034) * 12;
            return mod(p.hue + ghostAnchor * clamp01(engine.ghostLevel) + vsyncAnchor * clamp01(activeVsyncLevel()) +
                hueCycle * (now * 0.018) + rainbow * 48 + (engine.aiWarpActive ? engine.aiWarpHue || 0 : 0) * 0.18 + breath + (extra || 0), 360);
        }

        function ensureSnapshot() {
            const source = engine.canvas;
            if (!engine.r3SystemCanvas) {
                engine.r3SystemCanvas = document.createElement('canvas');
                engine.r3SystemCtx = engine.r3SystemCanvas.getContext('2d');
            }
            const snap = engine.r3SystemCanvas;
            const ctx = engine.r3SystemCtx;
            if (snap.width !== source.width || snap.height !== source.height) {
                snap.width = source.width;
                snap.height = source.height;
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.filter = 'none';
            ctx.clearRect(0, 0, snap.width, snap.height);
            ctx.drawImage(source, 0, 0);
            return snap;
        }

        function setGhostMode(mode, level) {
            if (!engine.ghostModes.includes(mode)) return getGhostMode();
            engine.ghostModeIndex = engine.ghostModes.indexOf(mode);
            if (level != null) engine.ghostLevel = clamp01(level);
            if (mode !== 'OFF' && engine.ghostLevel <= 0.01) engine.ghostLevel = 0.55;
            ghostTarget = engine.ghostLevel;
            manualGhostUntil = performance.now() + 1200;
            return getGhostMode();
        }

        function cycleGhostMode() {
            engine.ghostModeIndex = (engine.ghostModeIndex + 1) % engine.ghostModes.length;
            if (getGhostMode() !== 'OFF' && engine.ghostLevel <= 0.01) engine.ghostLevel = Math.max(0.55, ghostTarget || 0);
            // Revision 3 holds the Ghost rail while OFF; re-entering restores it.
            ghostTarget = engine.ghostLevel;
            manualGhostUntil = performance.now() + 1200;
            return getGhostMode();
        }

        function setGhostLevel(level, isManual) {
            engine.ghostLevel = clamp01(level);
            if (engine.ghostLevel > 0.02 && getGhostMode() === 'OFF') engine.ghostModeIndex = Math.max(1, engine.ghostModes.indexOf('SPECTRUM'));
            if (engine.ghostLevel <= 0.001) engine.ghostModeIndex = 0;
            ghostTarget = engine.ghostLevel;
            if (isManual !== false) manualGhostUntil = performance.now() + 4500;
            return engine.ghostLevel;
        }

        function setVsyncMode(mode, level) {
            if (engine.vsyncLocked || !engine.vsyncModes.includes(mode)) return getVsyncMode();
            engine.vsyncModeIndex = engine.vsyncModes.indexOf(mode);
            if (mode !== 'OFF') {
                const state = scripts[mode];
                const next = level == null ? Math.max(0.35, state.level, heldLevel * 0.75) : clamp01(level);
                state.level = next;
                state.target = next;
                state.nextAt = performance.now() + (1400 + random() * 1600) / warpBlendFor(engine.aiWarpMode).automation;
                heldLevel = Math.max(heldLevel, next);
                engine.vsyncLevel = next;
            } else {
                engine.vsyncLevel = heldLevel;
            }
            return getVsyncMode();
        }

        function cycleVsyncMode() {
            if (engine.vsyncLocked) return getVsyncMode();
            const nextIndex = (engine.vsyncModeIndex + 1) % engine.vsyncModes.length;
            const next = engine.vsyncModes[nextIndex];
            return setVsyncMode(next);
        }

        function setVsyncLevel(level, isManual) {
            let mode = getVsyncMode();
            const value = clamp01(level);
            if (mode === 'OFF' && value > 0.001) {
                mode = 'ON';
                engine.vsyncModeIndex = engine.vsyncModes.indexOf(mode);
            }
            if (mode !== 'OFF') {
                scripts[mode].level = value;
                scripts[mode].target = value;
                scripts[mode].nextAt = performance.now() + 1600;
            }
            heldLevel = value;
            engine.vsyncLevel = value;
            if (isManual !== false) manualVsyncUntil = performance.now() + 4500;
            return value;
        }

        function reset() {
            engine.ghostModeIndex = 0;
            engine.ghostLevel = 0;
            engine.vsyncModeIndex = 0;
            engine.vsyncLevel = 0;
            heldLevel = 0;
            ghostTarget = 0;
            Object.keys(scripts).forEach(key => { scripts[key].level = scripts[key].target = 0; });
        }

        function requestBurst(now, source, strength, kind) {
            const duration = 700 + random() * 1400;
            burstOverride = {
                source: source || 'manual', kind: kind || (random() < 0.42 ? 'dia' : random() < 0.62 ? 'color' : 'both'),
                start: now, duration, amp: clamp(strength == null ? 0.72 : strength, 0.2, 1)
            };
            if (engine.crescendo && typeof engine.crescendo.request === 'function') {
                try { engine.crescendo.request(now, source || 'manual', clamp01(strength || 0.8), 1); } catch (e) {}
            }
        }

        function burstState(now) {
            let env = 0;
            let kind = null;
            if (engine.burstGate && typeof engine.burstGate.env === 'function') {
                env = Math.max(env, engine.burstGate.env() || 0);
                kind = engine.burstGate.kind ? engine.burstGate.kind() : kind;
            }
            if (burstOverride) {
                const p = clamp01((now - burstOverride.start) / burstOverride.duration);
                if (p >= 1) burstOverride = null;
                else {
                    const overrideEnv = Math.pow(Math.sin(p * Math.PI), 1.35) * burstOverride.amp;
                    if (overrideEnv > env) { env = overrideEnv; kind = burstOverride.kind; }
                }
            }
            return { env: clamp01(env), kind: kind || 'dia' };
        }

        function feedEar(dt) {
            if (!engine.ear || typeof engine.ear.feedVisual !== 'function') return null;
            const a = engine.audioDrive || {};
            const p = palette(engine);
            const blend = warpBlendFor(engine.aiWarpMode);
            const energy = clamp01(Math.max(a.drive || 0, a.rms || 0, p.energy) * blend.ear);
            const motion = clamp01(Math.max(p.motion, a.treble || 0) * blend.canvas);
            try { return engine.ear.feedVisual(energy, motion, dt); } catch (e) { return null; }
        }

        function stepSoftEye(now, dt) {
            const ear = feedEar(dt);
            const blend = warpBlendFor(engine.aiWarpMode);
            let k = engine.softEyeK || 0;
            if (engine.crescendo && typeof engine.crescendo.step === 'function') {
                try { k = engine.crescendo.step(now, dt, engine.ear ? engine.ear.state : ear); } catch (e) {}
            }
            if (engine.burstGate && typeof engine.burstGate.step === 'function') {
                try { engine.burstGate.step(now, dt, k, engine.ear ? engine.ear.state : ear); } catch (e) {}
            }
            engine.softEyeK = clamp01(k * blend.softEye);
            const softModes = engine.softEyeModes || ['OFF', 'CALM', 'SURGE', 'CRESCENDO'];
            if (typeof engine.onSoftEyeProgress === 'function') engine.onSoftEyeProgress(engine.softEyeK, softModes[engine.softEyeModeIndex || 0] || 'CALM');
        }

        function stepVsyncScript(now, dt, systemK) {
            const mode = getVsyncMode();
            if (mode === 'OFF') { engine.vsyncLevel = heldLevel; return; }
            const state = scripts[mode];
            const automatic = automationEnabled();
            const manual = now < manualVsyncUntil;
            const p = palette(engine);
            if (engine.vsyncLocked) {
                state.target = state.level;
            } else if (automatic && !manual && now >= state.nextAt) {
                const band = mode === 'FULL' ? [0.40, 1.00] : mode === 'GHOST_OFF' ? [0.35, 1.00] : [0.30, 0.95];
                const dramatic = systemK > 0.55 && !engine.aiWarpActive && random() < 0.16;
                state.target = dramatic ? (random() < 0.5 ? 1 : 0.05) : band[0] + random() * (band[1] - band[0]);
                if (engine.aiWarpActive) state.target = Math.min(state.target, 0.90);
                const base = mode === 'FULL' ? 2600 : mode === 'ON' ? 3000 : 3600;
                state.nextAt = now + base * (0.6 + random()) * (engine.aiWarpActive ? 1.7 : 1) * lerp(1.9, 1, systemK) / warpBlendFor(engine.aiWarpMode).automation;
            }
            if (!manual && !engine.vsyncLocked) {
                const rate = (mode === 'FULL' ? 1.35 : mode === 'ON' ? 1 : 0.85) * (engine.aiWarpActive ? 0.65 : 1) * lerp(0.55, 1.2, systemK);
                state.level = easeExp(state.level, state.target, dt, rate);
            }
            heldLevel = Math.max(heldLevel, state.level);
            engine.vsyncLevel = clamp01(state.level);
        }

        function stepGhostAutomation(now, dt, systemK) {
            if (getGhostMode() === 'OFF') return;
            if (engine.isContinualRandom && now >= nextGhostRetargetAt && now >= manualGhostUntil) {
                const p = palette(engine);
                const upper = systemK > 0.55 ? 1 : 0.86;
                ghostTarget = clamp(0.22 + random() * (0.58 + p.energy * 0.18), 0.15, upper);
                nextGhostRetargetAt = now + (2200 + random() * 3600) * lerp(1.8, 1, systemK) / warpBlendFor(engine.aiWarpMode).automation;
            }
            if ((engine.isContinualRandom || engine.isAutoGlitch || engine.isTimedAuto || engine.isAutomatedMasters) && now >= manualGhostUntil) {
                const rate = (engine.isTimedAuto ? 1.8 : 0.8) * lerp(0.5, 1.25, systemK);
                engine.ghostLevel = clamp01(easeExp(engine.ghostLevel, ghostTarget, dt, rate));
            }
        }

        function step(now, dt) {
            const automatic = automationEnabled();
            if (automatic && !engine.softEyeActive) {
                stepSoftEye(now, dt);
            } else if (!automatic && !engine.softEyeActive && engine.burstGate && engine.burstGate.state && engine.burstGate.state.active) {
                // Let an already-started light event finish gracefully after automation stops.
                try { engine.burstGate.step(now, dt, 0, engine.ear ? engine.ear.state : null); } catch (e) {}
            }
            const systemK = clamp01(engine.softEyeK || 0);
            stepVsyncScript(now, dt, systemK);
            stepGhostAutomation(now, dt, systemK);

            if (automatic && engine.isAutoGlitch && now >= nextSystemBurstAt) {
                nextSystemBurstAt = now + (5400 + random() * 7200) * lerp(1.65, 0.72, systemK);
                if (getGhostMode() !== 'OFF' || getVsyncMode() !== 'OFF') requestBurst(now, 'auto-glitch', 0.46 + 0.40 * (engine.autoGlitchPower || 0.75));
            }
            const b = burstState(now);
            const count = engine.burstGate && engine.burstGate.state ? engine.burstGate.state.count : 0;
            if ((count > lastBurstCount || (burstOverride && b.env > 0.12)) && now - lastAutomationUiAt > 280) {
                lastBurstCount = count;
                lastAutomationUiAt = now;
                engine.triggerButtonEffect('ghost_pulse');
                if (getVsyncMode() !== 'OFF') engine.triggerButtonEffect('vsync_pulse');
            }
        }

        function drawGhost(now, snapshot) {
            const mode = getGhostMode();
            if (mode === 'OFF' || engine.ghostLevel <= 0.01 || !snapshot) return;
            const g = engine.gctx;
            const w = engine.canvas.width, h = engine.canvas.height;
            if (!w || !h) return;
            const t = now * 0.001;
            const p = palette(engine);
            const mp = getGhostProfile(mode);
            const blend = warpBlendFor(engine.aiWarpMode);
            const baseStrength = clamp01(engine.ghostLevel);
            const intensity = baseStrength * Math.max(0.05, engine.masterOpacity || 0) * 0.025;
            if (intensity <= 0) return;
            const crispK = engine.aiWarpActive ? 1.25 : 1;
            const dampK = engine.aiWarpActive ? 0.82 : 1;
            const pre = engine.ghostCanvas;
            const preCtx = engine.ghostCtx;
            if (pre.width !== w || pre.height !== h) { pre.width = w; pre.height = h; }
            const hue = confluenceHue(now, Math.sin(t * 0.8) * mp.hueA * 0.5 + Math.cos(t * 0.33) * mp.hueB * 0.5);
            const bw = bwMap(voiceLevel('B&W Invert'));
            const gray = clamp01((mp.gray || 0) * (0.55 + baseStrength * 0.45) + (bw.invert || 0) * 0.28);
            const contrast = 1.18 + baseStrength * 0.85 * crispK;
            const saturation = 1.05 + baseStrength * (mp.sat || 1) * 0.85;
            const brightness = 1.02 + baseStrength * 0.30;
            preCtx.save();
            preCtx.setTransform(1, 0, 0, 1, 0, 0);
            preCtx.globalAlpha = 1;
            preCtx.globalCompositeOperation = 'source-over';
            preCtx.clearRect(0, 0, w, h);
            // Canvas 2D standard filters only: no SVG pipeline or URL reference.
            preCtx.filter = `grayscale(${gray.toFixed(3)}) hue-rotate(${hue.toFixed(1)}deg) saturate(${saturation.toFixed(2)}) contrast(${contrast.toFixed(2)}) brightness(${brightness.toFixed(2)})${bw.invert > 0.004 ? ` invert(${bw.invert.toFixed(3)})` : ''}`;
            preCtx.drawImage(snapshot, 0, 0, w, h);
            preCtx.restore();
            preCtx.filter = 'none';

            const split = Math.min(20, (0.7 + baseStrength * 8) * (mp.split || 1) * blend.ghostSplit * (0.86 + 0.20 * p.energy));
            const channelAlpha = Math.min(0.20, (0.035 + intensity * 6.0) * (mp.chan || 1) * blend.ghostChroma) * dampK;
            const lineAlpha = Math.min(0.11, (0.012 + intensity * 3.0) * (mp.lines || 1) * blend.ghostLines) * dampK;
            const warpAlpha = Math.min(0.12, (0.010 + intensity * 3.2) * (mp.warp || 1) * blend.ghostWarp) * dampK;
            const burst = burstState(now);

            g.save();
            // Five softly offset spectral ghost copies replace the old purple edge.
            // 72-degree hue spacing covers the full RGB spectrum at once; the shared
            // phase drifts continuously so the color does not settle into one cast.
            g.globalCompositeOperation = 'screen';
            const rgbHue = mod(confluenceHue(now, t * 26) + blend.huePhase, 360);
            const rgbOffsets = [-split, -split * 0.5, 0, split * 0.5, split];
            for (let channel = 0; channel < 5; channel++) {
                g.filter = `hue-rotate(${mod(rgbHue + channel * 72, 360)}deg) saturate(1.26)`;
                g.globalAlpha = channelAlpha * 0.25;
                const yNudge = (channel - 2) * Math.max(0.35, split * 0.045);
                g.drawImage(pre, rgbOffsets[channel], yNudge, w, h);
            }
            g.filter = 'none';
            // Softer Old-Soul echo; retain the depth without a hard colored double edge.
            g.globalAlpha = channelAlpha * 0.18;
            g.filter = `blur(${((0.25 + intensity * 22) * (mp.blur || 1) * (0.85 + 0.25 * p.motion)).toFixed(2)}px)`;
            g.drawImage(pre, -split * 0.32, 0, w, h);
            g.drawImage(pre, split * 0.28, split * 0.08, w, h);
            g.filter = 'none';

            g.globalCompositeOperation = 'lighter';
            g.globalAlpha = lineAlpha;
            const lineCount = Math.round(((mp.crt ? 26 : 16) * (engine.aiWarpActive ? 0.7 : 1)));
            for (let i = 0; i < lineCount; i++) {
                const y = Math.floor(mod(i * 53 + now * 0.08, h));
                g.drawImage(pre, 0, y, w, 1, Math.sin(now * 0.012 + i * 1.73) * split * 1.6, y, w, 1);
            }

            g.globalCompositeOperation = 'screen';
            g.globalAlpha = warpAlpha;
            const columns = mp.crt ? 10 : 14;
            const columnWidth = Math.ceil(w / columns);
            const warpAmp = (0.5 + intensity * 58) * blend.ghostWarp;
            for (let col = 0; col < columns; col++) {
                const sx = col * columnWidth, sw = Math.min(columnWidth, w - sx);
                if (sw <= 0) continue;
                g.drawImage(pre, sx, 0, sw, h, sx + Math.sin(t * 5.2 + col * 0.65) * warpAmp,
                    Math.cos(t * 3.6 + col * 0.43) * warpAmp * 0.3025, sw, h);
            }

            if (mp.crt) {
                g.globalCompositeOperation = 'overlay'; g.globalAlpha = Math.min(0.08, 0.015 + intensity * 3);
                g.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = 0; y < h; y += 2) g.fillRect(0, y, w, 1);
            }
            if (mp.led) {
                g.globalCompositeOperation = 'screen'; g.globalAlpha = Math.min(0.16, 0.035 + intensity * 4.6);
                const sub = Math.max(1, Math.round(w / 240));
                for (let x = 0; x < w; x += sub * 3) {
                    g.fillStyle = 'rgba(255,36,36,0.55)'; g.fillRect(x, 0, sub, h);
                    g.fillStyle = 'rgba(36,255,72,0.55)'; g.fillRect(x + sub, 0, sub, h);
                    g.fillStyle = 'rgba(36,72,255,0.55)'; g.fillRect(x + sub * 2, 0, sub, h);
                }
            }
            if (mp.dia) {
                const dia = g.createLinearGradient(0, 0, w, h);
                const diaHue = mod(confluenceHue(now, t * 34), 360);
                dia.addColorStop(0, `hsla(${diaHue},84%,56%,1)`);
                dia.addColorStop(0.34, `hsla(${mod(diaHue + 120, 360)},82%,54%,1)`);
                dia.addColorStop(0.67, `hsla(${mod(diaHue + 240, 360)},84%,56%,1)`);
                dia.addColorStop(1, `hsla(${diaHue},84%,56%,1)`);
                g.globalCompositeOperation = 'soft-light'; g.globalAlpha = Math.min(0.12, 0.03 + intensity * 3.5); g.fillStyle = dia; g.fillRect(0, 0, w, h);
            }
            const curve = g.createLinearGradient(0, 0, 0, h);
            const colorAt = (index, delta) => { const c = p.colors[index] || p.colors[0]; return `hsla(${c.h.toFixed(1)},${Math.max(40, c.s).toFixed(0)}%,${clamp(c.l + delta, 18, 82).toFixed(0)}%,1)`; };
            curve.addColorStop(0, colorAt(0, -14)); curve.addColorStop(0.5, colorAt(3, 10)); curve.addColorStop(1, colorAt(2, -8));
            g.globalCompositeOperation = 'soft-light'; g.globalAlpha = Math.min(0.08, 0.02 + intensity * 4.8); g.fillStyle = curve; g.fillRect(0, 0, w, h);
            g.globalAlpha = Math.min(0.08, 0.02 + intensity * 4.2); g.fillStyle = `hsla(${confluenceHue(now, Math.sin(t * 1.2) * (mp.crt ? 9 : 18)).toFixed(1)},100%,58%,1)`; g.fillRect(0, 0, w, h);

            if (burst.env > 0.01) {
                const bHue = confluenceHue(now, t * 90 * (1 + 2 * clamp01(engine.softEyeK || 0)) + mp.hueA * 0.25);
                if (burst.kind === 'color' || burst.kind === 'both') {
                    const grad = g.createLinearGradient(0, 0, w, h);
                    grad.addColorStop(0, `hsla(${bHue},100%,60%,1)`); grad.addColorStop(0.5, `hsla(${mod(bHue + 120, 360)},100%,58%,1)`); grad.addColorStop(1, `hsla(${mod(bHue + 240, 360)},100%,60%,1)`);
                    g.globalCompositeOperation = 'screen'; g.globalAlpha = Math.min(0.30, 0.06 + 0.26 * burst.env) * dampK; g.fillStyle = grad; g.fillRect(0, 0, w, h);
                }
                if (burst.kind === 'dia' || burst.kind === 'both') {
                    g.globalCompositeOperation = 'difference'; g.globalAlpha = Math.min(0.55, 0.10 + 0.50 * burst.env) * dampK; g.drawImage(pre, split * 0.35 * burst.env, 0, w, h);
                    g.globalCompositeOperation = 'soft-light'; g.globalAlpha = Math.min(0.22, 0.28 * burst.env); g.fillStyle = `hsla(${mod(bHue + 180, 360)},90%,55%,1)`; g.fillRect(0, 0, w, h);
                }
            }
            const sweepY = Math.floor(mod(t * 0.11, 1) * h);
            const sweep = g.createLinearGradient(0, sweepY - 1, 0, sweepY + 1);
            const sweepHue = confluenceHue(now, mp.hueA * 0.5);
            sweep.addColorStop(0, `hsla(${sweepHue},100%,72%,0)`); sweep.addColorStop(0.5, `hsla(${sweepHue},100%,80%,1)`); sweep.addColorStop(1, `hsla(${sweepHue},100%,72%,0)`);
            g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(0.22, 0.05 + intensity * 4) * (mp.glow || 1) * blend.ghostGlow * 1.4 * dampK; g.fillStyle = sweep; g.fillRect(0, sweepY - 1, w, 2);
            g.restore();
        }

        function drawVsync(now, snapshot) {
            const mode = getVsyncMode();
            const levelRaw = activeVsyncLevel();
            if (mode === 'OFF' || levelRaw <= 0.01 || !snapshot) return;
            const g = engine.gctx, w = engine.canvas.width, h = engine.canvas.height;
            if (!w || !h) return;
            const p = palette(engine), method = getVsyncMethod(mode), blend = warpBlendFor(engine.aiWarpMode), t = now * 0.001;
            const level = Math.min(1, levelRaw * (mode === 'FULL' ? 1.5 : 1.25)) * (engine.aiWarpActive ? 1 : 0.9);
            const fade = clamp01(0.10 + engine.masterOpacity * 0.30);
            const ghostOn = getGhostMode() !== 'OFF' && engine.ghostLevel > 0.01;
            const ghostSync = ghostOn ? clamp01(engine.ghostLevel * 1.2) : 0;
            const bw = bwMap(voiceLevel('B&W Invert'));
            const scanHue = mod(confluenceHue(now, (ghostOn ? Math.sin(t * 1.2) * 18 : Math.sin(t * 0.7) * 16) + (method.harmony || 0) * 180 * ((bw.invert || 0) / 0.75)) + t * 20 * blend.vsyncSpeed + blend.huePhase, 360);
            const speed = (0.22 + level * 0.30) * blend.vsyncSpeed * (engine.aiWarpActive ? 0.85 : 1) * (0.85 + 0.30 * p.energy) * (0.55 + 0.45 * (method.scanphase == null ? 1 : method.scanphase));
            const scanY = mod(t * speed + Math.sin(t * 0.23) * 0.06 + Math.cos(t * 0.11 + 1.2) * 0.04, 1) * h;
            const phase = (Math.sin(t * 1.35 * (0.6 + 0.4 * method.tears)) * 0.22 + Math.cos(t * 0.53) * 0.11 + Math.sin(t * 62.832) * (0.012 + level * 0.035) * method.hum * (0.80 + 0.40 * p.motion)) * blend.phase;
            const rollActive = method.roll * blend.vsyncRoll > 0 && phase < -0.03 && Math.sin(t * 0.9 + 1.3) > -0.1;
            const rollPhase = rollActive ? mod(t * (0.05 + level * 0.12) * (phase >= 0 ? 1 : -1) * (0.6 + 0.4 * method.roll * blend.vsyncRoll), 1) : 0;
            const tearCount = Math.max(1, Math.round((mode === 'FULL' ? 9 : mode === 'ON' ? 5 : 2) * method.tears * blend.vsyncTears * (0.30 + 0.48 * level) * (0.80 + 0.20 * p.motion)));
            const tearGap = Math.max(2, Math.round(h / tearCount));
            const tearPulse = 0.6 + 0.4 * Math.abs(Math.sin(t * 1.2 + 0.7));
            const sliceHeight = Math.max(1, Math.round(h * (0.0035 / (0.80 + 0.35 * method.sharp)) * tearPulse));
            const jam = level * (0.12 + 0.10 * Math.abs(Math.sin(t * 6.13 + 1.7))) * method.tears * blend.vsyncTears * (0.78 + 0.22 * p.energy + 0.12 * p.motion);
            const burst = burstState(now);
            const noiseFrame = Math.floor(now / 50);

            g.save();
            const thick = Math.max(1, h * 0.0045);
            const head = g.createLinearGradient(0, scanY - thick * 4, 0, scanY + thick * 4);
            head.addColorStop(0, 'rgba(0,0,0,0)');
            head.addColorStop(0.25, `hsla(${scanHue},82%,52%,0.30)`);
            head.addColorStop(0.50, `hsla(${mod(scanHue + 144, 360)},86%,56%,0.48)`);
            head.addColorStop(0.75, `hsla(${mod(scanHue + 288, 360)},82%,52%,0.30)`);
            head.addColorStop(1, 'rgba(0,0,0,0)');
            g.globalCompositeOperation = 'source-over'; g.globalAlpha = Math.min(0.25, 0.025 + level * 0.085) * fade * (rollActive ? 1.25 : 1) * 0.55; g.fillStyle = head; g.fillRect(0, scanY - thick * 4, w, thick * 8);
            if (rollActive) { g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.065; g.fillStyle = `hsla(${scanHue},82%,62%,1)`; g.fillRect(0, scanY - thick * 14, w, Math.max(1, thick)); }

            const coreY = Math.max(1, Math.min(h - 1, Math.floor(scanY)));
            const halo = g.createLinearGradient(0, coreY - 5, 0, coreY + 5);
            const haloA = Math.min(0.14, (0.04 + level * 0.065) * method.bar * (0.88 + 0.12 * ghostSync));
            halo.addColorStop(0, `hsla(${scanHue},92%,68%,0)`);
            halo.addColorStop(0.25, `hsla(${mod(scanHue + 72, 360)},94%,66%,${(haloA * 0.65).toFixed(3)})`);
            halo.addColorStop(0.50, `hsla(${mod(scanHue + 144, 360)},96%,68%,${haloA.toFixed(3)})`);
            halo.addColorStop(0.75, `hsla(${mod(scanHue + 216, 360)},94%,66%,${(haloA * 0.65).toFixed(3)})`);
            halo.addColorStop(1, `hsla(${scanHue},92%,68%,0)`);
            g.globalCompositeOperation = 'screen'; g.globalAlpha = fade * 0.42; g.fillStyle = halo; g.fillRect(0, coreY - 5, w, 10);
            const beamAlpha = Math.min(0.48, (0.20 + level * 0.22) * method.bar) * (0.58 + fade * 0.42);
            // Five thin RGB-spectrum scan echoes replace the single warm-colored line.
            for (let channel = 0; channel < 5; channel++) {
                g.globalAlpha = beamAlpha * 0.24;
                g.fillStyle = `hsla(${mod(scanHue + channel * 72, 360)},94%,72%,1)`;
                g.fillRect(0, coreY + channel - 2, w, 1);
            }

            g.globalCompositeOperation = 'source-over'; g.globalAlpha = clamp01(0.55 + level * 0.4) * (0.55 + fade * 0.45);
            for (let i = 0; i < tearCount; i++) {
                const bandY = mod(scanY + i * tearGap, h);
                const offset = (Math.sin(t * 7.1 + i * 2.4) * 0.55 + Math.sin(t * 3.7 + i * 0.9) * 0.3) * jam * (phase >= 0 ? 1 : 0.55) * ((i & 1) ? -0.85 : 1);
                const by = Math.max(0, Math.min(h - sliceHeight, bandY));
                g.drawImage(snapshot, 0, by, w, sliceHeight, Math.round(offset * w * 0.5), by, w, sliceHeight);
            }
            if (rollActive) {
                const bandH = Math.max(8, Math.round(h * 0.16)), rY = Math.max(0, Math.min(h - bandH, Math.round(rollPhase * (h + bandH)) - bandH));
                g.globalAlpha = clamp01(0.30 + level * 0.40) * method.roll; g.drawImage(snapshot, 0, rY, w, bandH, Math.round(level * 3 + 1), rY, w, bandH);
                g.globalAlpha = clamp01(0.25 + level * 0.30) * method.roll; g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, rY, w, 1); g.fillRect(0, rY + bandH, w, 1);
                for (let y = scanY - thick * 10; y < scanY + thick * 10; y += 2 + Math.floor(level * 2)) {
                    if (y < 0 || y >= h) continue;
                    g.globalCompositeOperation = 'soft-light'; g.globalAlpha = (0.025 + noise01(noiseFrame + Math.floor(y * 0.1), 7) * 0.05) * level * fade * 0.7; g.fillStyle = `hsla(${mod(scanHue + 14 + Math.sin(t * 8.4 + y * 0.11) * 12, 360)},95%,60%,1)`; g.fillRect(0, y, w, 1);
                }
            }
            if (!ghostOn) {
                const spacing = Math.max(4, Math.round(Math.max(1, h * 0.008) * (14 - level * 9)));
                for (let y = mod(scanY, spacing); y < h; y += spacing) {
                    g.globalCompositeOperation = 'source-over'; g.globalAlpha = (0.03 + noise01(noiseFrame + Math.floor(y * 0.13), 11) * 0.07) * level * fade * 0.6;
                    g.fillStyle = `hsla(${mod(scanHue + noise01(noiseFrame + Math.floor(y * 0.09), 13) * 30 - 15, 360)},${Math.round(55 + Math.min(40, p.sat * 0.45))}%,58%,1)`; g.fillRect(0, y, w, 1);
                }
            }
            const sheen = g.createLinearGradient(0, scanY - thick * 9, 0, scanY + thick * 9);
            sheen.addColorStop(0, 'hsla(0,0%,0%,0)'); sheen.addColorStop(0.5, `hsla(${ghostSync > 0 ? scanHue : mod(195 + Math.sin(t * 0.8) * 12, 360)},90%,${ghostSync > 0 ? 46 : 58}%,1)`); sheen.addColorStop(1, 'hsla(0,0%,0%,0)');
            g.globalCompositeOperation = 'soft-light'; g.globalAlpha = Math.min(0.11, 0.012 + level * 0.055 + ghostSync * 0.035 + (rollActive ? 0.02 : 0)) * fade * 0.72; g.fillStyle = sheen; g.fillRect(0, scanY - thick * 9, w, thick * 18);
            if (level > 0.68) { g.globalCompositeOperation = 'overlay'; g.globalAlpha = (level - 0.68) * 0.20 * method.hum; g.fillStyle = 'rgba(0,0,0,0.5)'; for (let y = mod(t * 40, 3); y < h; y += 3) g.fillRect(0, y, w, 1); }

            if (burst.env > 0.01) {
                const bands = engine.softEyeK > 0.5 ? 5 : 3, bandH = h / bands, travel = 0.5 * (1 - Math.cos(Math.PI * clamp01(burst.env)));
                const baseHue = confluenceHue(now, t * 40 * (1 + clamp01(engine.softEyeK || 0)));
                for (let index = 0; index < bands; index++) {
                    const y0 = mod(index / bands + travel * 0.5, 1) * h, hBand = mod(baseHue + index * ((method.harmony || 0) > 0.5 ? 60 : 90), 360);
                    const grad = g.createLinearGradient(0, y0 - bandH * 0.5, 0, y0 + bandH * 0.5);
                    grad.addColorStop(0, `hsla(${hBand},100%,62%,0)`); grad.addColorStop(0.5, `hsla(${hBand},100%,62%,1)`); grad.addColorStop(1, `hsla(${hBand},100%,62%,0)`);
                    g.globalCompositeOperation = burst.kind === 'dia' || (burst.kind === 'both' && (index & 1)) ? 'difference' : 'screen'; g.globalAlpha = Math.min(0.42, (0.05 + 0.40 * burst.env) * fade * (method.bar || 0.6)); g.fillStyle = grad; g.fillRect(0, y0 - bandH * 0.5, w, bandH);
                }
            }
            g.restore();
        }

        return {
            scripts, getGhostMode, getVsyncMode, activeVsyncLevel,
            setGhostMode, cycleGhostMode, setGhostLevel, setVsyncMode, cycleVsyncMode, setVsyncLevel,
            requestBurst, reset, stepSoftEye, step,
            captureSnapshot: ensureSnapshot, renderGhost: drawGhost, renderVsync: drawVsync,
            getBurstState: burstState
        };
    }

    root.R3GhostVsync = { create, getWarpBlendProfile: warpBlendFor };
})(typeof window !== 'undefined' ? window : this);

;/* ===== ai_warp_engine.js ===== */
/**
 * AI WARP ENGINE — HYPER-INTEGRATED SYNTHESIS (v6.4.0-TAB-CAPTURE)
 *
 * 100% Fully Responsive, Robust & Animated:
 * - 📡 Tab Capture (getDisplayMedia): real pixels AND real audio from any shared tab
 *   (e.g. YouTube) flow through the full Canvas pipeline — all 34 voices sample actual
 *   frames via #localVideo, and tab audio drives masterAnalyser for true audio-reactivity
 * - 34 active glitch voices: 17 original Canvas voices plus 17 isolated GC#(3) Revision 3 rails
 * - YouTube Warp Bus: the cross-origin YouTube iframe feed is driven directly by all 29 AI Warp
 *   modes and all 34 effect voices via a cumulative CSS transform/filter/clip-path chain on
 *   #ytWarpShell, while self-drawing voices keep overlaying the stacked glitch canvas
 * - SVG Warp Lens: the live YouTube pixels are additionally rasterized through an inline
 *   feTurbulence → feDisplacementMap filter graph (compositor-level, display-only — the
 *   cross-origin pixels are never read back into JS), giving true per-pixel melting,
 *   tearing and liquefaction per warp mode, voice-boosted; toggle via setSvgWarpActive()
 * - Per-voice live sliders: LEVEL, SIZE (0.2x-3.0x), and DEPTH (0.0-1.0)
 * - Safe offscreen workCanvas buffers preventing canvas-on-canvas write collisions
 * - Procedural 2D + Three.js Raymarched Tech Artist fractal
 * - 15 International & Leet Typesets (Katakana, Box Drawing, Math, Leet, Cyrillic)
 * - Ghost Protocol R3/v11 Canvas engine: OFF, DIA, SPECTRUM, CRT, PLASMA, LED
 * - V-Sync R3/v11 Canvas engine: OFF, SCANPHASING, VERTICAL COLOR HARMONY, FULL
 * - R3 Soft-Eye, audio-ear burst gates, tracked V-Sync rails, and automation confluence
 * - 29 AI Warp Modes (12 core algorithmic + 17 NewBlue-inspired deformations)
 * - Canvas/WebGL displacement core + standard CSS color treatment; the only SVG usage is the
 *   compositor-level Warp Lens displacement on the YouTube shell (no JS pixel readback)
 */

(function (root) {
    'use strict';

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }
    function clamp01(val) {
        return Math.max(0, Math.min(1, +val || 0));
    }
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function buildMilkdropPresetBank() {
        const families = [
            { name:'Liquid Orbits', composite:'screen', yScale:0.78 },
            { name:'Spiral Soup', composite:'lighter', yScale:0.92 },
            { name:'Plasma Ribbons', composite:'screen', yScale:0.62 },
            { name:'Kaleido Foam', composite:'lighter', yScale:1.00 },
            { name:'Vortex Bloom', composite:'screen', yScale:0.70 },
            { name:'Phosphor Nebula', composite:'soft-light', yScale:0.86 },
            { name:'Lissajous Milk', composite:'lighter', yScale:1.08 },
            { name:'Caustic Swirl', composite:'screen', yScale:0.74 }
        ];
        return Array.from({ length: 80 }, (_, index) => {
            const familyIndex = Math.floor(index / 10), variation = index % 10, family = families[familyIndex];
            return {
                id: index + 1,
                name: `${family.name} ${String(variation + 1).padStart(2, '0')}`,
                family: family.name,
                composite: family.composite,
                hueOffset: (index * 47 + variation * 19) % 360,
                zoomBias: (variation - 4.5) * 0.0013 + (familyIndex - 3.5) * 0.00065,
                twist: 0.46 + familyIndex * 0.13 + variation * 0.095,
                feedback: 0.27 + (variation % 6) * 0.026 + familyIndex * 0.012,
                rings: 1 + ((familyIndex * 2 + variation) % 4),
                waveFreq: 3 + ((familyIndex * 3 + variation) % 10),
                waveAmp: 0.022 + (variation % 5) * 0.008 + familyIndex * 0.002,
                bloom: 0.42 + ((familyIndex + variation) % 6) * 0.085,
                opacity: 0.16 + ((familyIndex * 3 + variation) % 10) * 0.023,
                yScale: family.yScale + (variation - 4.5) * 0.012,
                mirror: ((familyIndex + variation) % 2) === 0
            };
        });
    }

    function drawCover(ctx, media, cw, ch) {
        if (!media) return;
        const mw = media.videoWidth || media.naturalWidth || media.width || cw;
        const mh = media.videoHeight || media.naturalHeight || media.height || ch;
        if (!mw || !mh) {
            try { ctx.drawImage(media, 0, 0, cw, ch); } catch(e) {}
            return;
        }
        const scale = Math.max(cw / mw, ch / mh);
        const nw = mw * scale;
        const nh = mh * scale;
        const cx = (cw - nw) * 0.5;
        const cy = (ch - nh) * 0.5;
        try { ctx.drawImage(media, cx, cy, nw, nh); } catch(e) {}
    }

    class AiWarpEngine {
        constructor(canvasId, options = {}) {
            this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
            if (!this.canvas) {
                console.error(`AiWarpEngine: Canvas "${canvasId}" not found.`);
                return;
            }
            this.gctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
            this.options = options;
            this._deterministicState = 0x6D2B79F5;
            this.automationPass = 0;

            // Warp Modes (12 Algorithmic Visual Deformations)
            this.aiWarpActive = options.aiWarpActive !== undefined ? !!options.aiWarpActive : true;
            this.aiWarpStrength = options.aiWarpStrength !== undefined ? options.aiWarpStrength : 0.65;
            this.aiWarpModes = [
                'liquid', 'prism', 'breathe', 'fold', 'aurora',
                'vortex', 'cybergrid', 'hyperdrive', 'kaleidoscope',
                'quantum', 'ripple', 'analog_crt',
                'newblue_roll', 'newblue_active_cam', 'newblue_shear', 'newblue_wiggle',
                'newblue_zoom_blur', 'newblue_video_tile', 'newblue_twirl', 'newblue_light_ring',
                'newblue_earthquake', 'newblue_water_drop', 'newblue_rgb_shift', 'newblue_quad_mirror',
                'newblue_fish_eye', 'newblue_pinch', 'newblue_solarize', 'newblue_cathode_beam', 'newblue_neon_edges'
            ];
            this.presetTransition = null;
            this.aiWarpModeIndex = 0;
            this.aiWarpMode = this.aiWarpModes[this.aiWarpModeIndex];
            this.aiWarpHue = 0;
            this.aiWarpSeed = Math.random() * 1000;
            this.aiWarpState = { disp: 2.0, freq: 0.001, pulse: 0.3, fold: 0, aurora: 0, scale: 1.0, driftX: 0, driftY: 0, skewX: 0, skewY: 0 };

            // Transient Button Effects Overlay
            this.transientEffects = [];

            // Timed Effects Automation Engine
            this.isTimedAuto = false;
            this.timedCadences = ['1_bar', '2_bar', '4_bar', 'soft_eye', 'lfo_wave', 'half_beat'];
            this.timedCadenceIndex = 1; // default '2_bar'
            this.timedAutomationState = {
                phase: 0,
                beat: 0,
                bar: 0,
                progress: 0,
                label: '2-BAR',
                lastBeatTriggered: -1,
                lastBarTriggered: -1
            };
            this.onCadenceProgress = null;

            // Ghost Protocol & V-Sync
            this.ghostModes = ['OFF', 'DIA', 'SPECTRUM', 'CRT', 'PLASMA', 'LED'];
            this.ghostModeIndex = 0;
            this.ghostLevel = 0.0;
            this.vsyncModes = ['OFF', 'ON', 'GHOST_OFF', 'FULL'];
            this.vsyncModeIndex = 0;
            this.vsyncLevel = 0.0;
            this.vsyncLocked = false;
            this.earMode = 'auto'; // 'auto' | 'audio' | 'canvas'

            // SVG Warp Lens — per-pixel displacement of the cross-origin YouTube
            // feed through an inline feTurbulence → feDisplacementMap graph.
            // Display-only (compositor rasterizes; JS never reads the pixels).
            this.svgWarpActive = true;
            this.svgWarpNodes = null;   // resolved lazily: { turb, disp } | false
            this._svgWarpLastBf = '';
            this._svgWarpLastScale = '';
            this._svgWarpLastType = '';

            // Master controls
            this.masterOpacity = 0.95;
            this.glitchSpeed = 1.2;
            this.boardEnergy = 0.65;
            this.motionScale = 0.80;
            this.blendSoftness = 0.50;
            this.continualSpeed = 0.85;
            this.autoGlitchPower = 0.75;

            this.isAutoGlitch = false;
            this.isContinualRandom = false;
            this.isAutomatedMasters = false;
            this.isWiredMode = false;

            // Video / Source Palette & Heartbeat
            this.videoPalette = { hue: 205, energy: 0.5, brightness: 0.5, motion: 0.1, sat: 1.0 };
            this.heartbeat = { phase: 0, breathRate: 1.0, stageK: 0.5 };
            this.sourceMode = 'generative'; // 'generative' | 'video' | 'webcam' | 'image' | 'youtube'
            this.activeVideoElement = null;
            this.activeImageElement = null;

            // Audio drive
            this.audioDrive = {
                bass: 0, mid: 0, treble: 0, sub: 0, lowMid: 0, highMid: 0, brilliance: 0,
                rms: 0, beat: 0, drive: 0, active: false
            };

            // Soft-Eye Crescendo & Pacing Engine (Default OFF so it doesn't auto-surge in background)
            this.softEyeActive = false;
            this.softEyeModes = ['OFF', 'CALM', 'SURGE', 'CRESCENDO'];
            this.softEyeModeIndex = 0;
            this.softEyeK = 0.0;
            this.onSoftEyeProgress = null;
            this.hardLightActive = false;
            this.milkdropActive = false;
            this.milkdropOpacity = 0.30;
            this.milkdropTargetOpacity = 0.30;
            this.milkdropOpacityLocked = false;
            this.milkdropLastRenderAt = 0;
            this.milkdropStartAt = 0;
            this.milkdropPresetIndex = -1;
            this.milkdropPresetDeck = buildMilkdropPresetBank();
            this.shuffleMilkdropPresetDeck();
            this.milkdropCurrentPreset = null;
            this.onMilkdropPresetChange = null;
            this.crescendo = null;
            this.burstGate = null;
            this.ear = null;

            // Auxiliary Offscreen Canvases
            this.workCanvas = document.createElement('canvas');
            this.workCtx = this.workCanvas.getContext('2d');
            this.ghostCanvas = document.createElement('canvas');
            this.ghostCtx = this.ghostCanvas.getContext('2d');
            this.genCanvas = document.createElement('canvas');
            this.genCtx = this.genCanvas.getContext('2d');
            this.milkdropFeedbackCanvas = document.createElement('canvas');
            this.milkdropFeedbackCtx = this.milkdropFeedbackCanvas.getContext('2d');
            this.milkdropNextCanvas = document.createElement('canvas');
            this.milkdropNextCtx = this.milkdropNextCanvas.getContext('2d');

            // Three.js Tech Artist Shader
            this.techArtistShader = null;
            this.techArtistMouse = { x: 0.5, y: 0.5 };
            this.techArtistLastMouse = { x: 0.5, y: 0.5 };
            this.techArtistVelocity = { x: 0, y: 0 };

            // 34 Glitch Voices: 17 core + 17 GC#(3)
            this.coreEffectNames = [
                'Neon Grad', 'Scanlines', 'Data Bands', 'Flash', 'HSL Rainbow', 'ASCII',
                'Font Burn', 'Strobe', 'Gemini Bomb', 'Tech Artist', 'VHS Glitch',
                'Data Bomb', 'Ink Glyphs', 'Matrix ASCII', 'Matrix Chord',
                'B&W Invert', 'Hue/Color Cycle'
            ];
            // The added R3 panel voices remain separate from the original 17 rails.
            this.gc3EffectNames = (window.GC3FactoryBank && Array.isArray(window.GC3FactoryBank.voiceNames))
                ? window.GC3FactoryBank.voiceNames.slice()
                : this.coreEffectNames.map(name => `${name} GC#(3)`);
            this.effectNames = this.coreEffectNames.concat(this.gc3EffectNames);

            this.effectAlphas = {};
            this.effectEnabled = {};
            this.effectUserDisabled = {};
            this.effectUserLevel = {};
            this.effectSizes = {};
            this.effectDepths = {};
            this.effectTargets = {};
            this.effectRetargetAt = {};
            this.effectLocks = {};
            // Automation-owned selections form core/R3 confluence pairs. They are
            // tracked separately so manual unlocked voices are never retired merely
            // because Continual Randomization chose a fresh factory pair.
            this.continualAutomationVoices = new Set();
            this.continualSelection = [];
            this.nextContinualSelectionAt = 0;

            this.effectNames.forEach(name => {
                this.effectAlphas[name] = 0.0;
                this.effectEnabled[name] = false;
                this.effectUserDisabled[name] = false;
                this.effectUserLevel[name] = 0.0;
                this.effectSizes[name] = 1.0;
                this.effectDepths[name] = 0.62;
                this.effectTargets[name] = 0.0;
                this.effectRetargetAt[name] = 0;
                this.effectLocks[name] = false;
            });


            this.initSoftEye();
            // R3 Ghost Protocol/V-Sync runs independently from the voice factory bank,
            // sharing this engine's canvas, audio ear, controls and automation rails.
            this.r3GhostVsync = (window.R3GhostVsync && typeof window.R3GhostVsync.create === 'function')
                ? window.R3GhostVsync.create(this) : null;
            this.initInteraction();
            this.resize();

            // Build active effects once with liveAlpha getters!
            this.activeEffects = [];
            this.factories = this.buildFactories();
            this.initEffectRunners();
            this.initGC3EffectRunners();

            // Start animation loop
            this.lastFrameTime = performance.now();
            this.animFrameId = requestAnimationFrame((now) => this.mainRenderLoop(now));
        }

        nextDeterministicValue() {
            this._deterministicState = (Math.imul(this._deterministicState, 1664525) + 1013904223) >>> 0;
            return this._deterministicState / 4294967296;
        }

        getWarpBlendProfile() {
            return window.R3GhostVsync && typeof window.R3GhostVsync.getWarpBlendProfile === 'function'
                ? window.R3GhostVsync.getWarpBlendProfile(this.aiWarpMode)
                : { hardLight:1, softEye:1, ear:1, canvas:1, automation:1 };
        }

        initSoftEye() {
            if (window.GlitchEngine) {
                const rng = () => this.nextDeterministicValue();
                const blend = this.getWarpBlendProfile();
                const calmK = Math.max(0.75, blend.softEye);
                this.crescendo = window.GlitchEngine.createCrescendo({
                    rng,
                    calmMs: [40000 / calmK, 85000 / calmK],
                    swellMs: [2800 / calmK, 5000 / calmK],
                    wildMs: [4500 / calmK, 9500 / calmK],
                    releaseMs: [5200 / calmK, 8800 / calmK]
                });
                this.burstGate = window.GlitchEngine.createBurstGate({ rng });
                this.ear = window.GlitchEngine.createEar();
            }
        }

        initInteraction() {
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', (e) => {
                const nx = e.clientX / Math.max(1, window.innerWidth);
                const ny = 1.0 - (e.clientY / Math.max(1, window.innerHeight));
                this.techArtistVelocity.x = Math.max(-1, Math.min(1, (nx - this.techArtistLastMouse.x) * 6));
                this.techArtistVelocity.y = Math.max(-1, Math.min(1, (ny - this.techArtistLastMouse.y) * 6));
                this.techArtistMouse = { x: nx, y: ny };
                this.techArtistLastMouse = { x: nx, y: ny };
            });
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = this.canvas.clientWidth || window.innerWidth;
            const h = this.canvas.clientHeight || window.innerHeight;
            if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
                this.canvas.width = Math.round(w * dpr);
                this.canvas.height = Math.round(h * dpr);
            }
            [this.workCanvas, this.ghostCanvas, this.genCanvas, this.milkdropFeedbackCanvas, this.milkdropNextCanvas].forEach(c => {
                if (c && (c.width !== this.canvas.width || c.height !== this.canvas.height)) {
                    c.width = this.canvas.width;
                    c.height = this.canvas.height;
                }
            });
            if (this.techArtistShader && this.techArtistShader.renderer) {
                this.techArtistShader.renderer.setSize(this.canvas.width, this.canvas.height);
                if (this.techArtistShader.uniforms.resolution) {
                    this.techArtistShader.uniforms.resolution.value.set(this.canvas.width, this.canvas.height);
                }
            }
        }

        setSourceMode(mode, element = null) {
            this.sourceMode = mode;
            if (mode === 'video') this.activeVideoElement = element;
            if (mode === 'image') this.activeImageElement = element;
            const ytShell = document.getElementById('ytWarpShell');
            if (ytShell) {
                const isYt = mode === 'youtube';
                ytShell.style.display = isYt ? 'block' : 'none';
                if (!isYt) {
                    // Leaving YouTube: hand the shell back clean — no stale Warp Bus styles
                    ytShell.style.transform = 'none';
                    ytShell.style.filter = 'none';
                    ytShell.style.clipPath = 'none';
                    ytShell.style.setProperty('-webkit-clip-path', 'none');
                    if (this.svgWarpNodes && this.svgWarpNodes.disp) {
                        this.svgWarpNodes.disp.setAttribute('scale', '0');
                        this._svgWarpLastScale = '0';
                    }
                }
            }
            if (typeof document !== 'undefined' && document.body) {
                document.body.classList.toggle('youtube-warp', mode === 'youtube');
            }
        }

        /* ── RAUM · X-R SHOW ─────────────────────────────────────────────────────
           Exclusive source mode for the bundled "pole - Я - raum" tracks: the album
           artwork runs as a slideshow on the main canvas and is warped by original
           glitch sequences that follow the track clock and its audio (beat re-entry,
           beat silence, crescendos). Leaving the mode restores the previous source. */
        startRaumShow(images, audioEl, trackNo) {
            if (!images || !images.length) return;
            const rs = this._raum || (this._raum = {
                scratch: document.createElement('canvas'), trail: document.createElement('canvas'),
                burst: 0, peak: 0.0001, bassAvg: 0, silent: false, silentSince: 0, reentry: 0, lastBeat: 0, prev: null
            });
            if (this.sourceMode !== 'raum') {
                rs.prev = { mode: this.sourceMode, video: this.activeVideoElement, image: this.activeImageElement };
            }
            rs.imgs = images; rs.audio = audioEl; rs.track = trackNo;
            rs.startedAt = performance.now(); rs.silent = false; rs.reentry = 0; rs.burst = 0.8;
            this.setSourceMode('raum');
        }

        endRaumShow(audioEl) {
            const rs = this._raum;
            if (!rs || this.sourceMode !== 'raum') return;
            if (audioEl && rs.audio !== audioEl) return;
            const p = rs.prev && rs.prev.mode !== 'raum' ? rs.prev : { mode: 'generative' };
            this.setSourceMode(p.mode, p.mode === 'video' ? p.video : p.image);
        }

        renderRaumShow(now, dt) {
            const rs = this._raum;
            const cw = this.canvas.width, ch = this.canvas.height;
            const g = this.gctx;
            if (!rs || !rs.imgs || !cw || !ch) return;
            const ad = this.audioDrive;
            const t = rs.audio ? rs.audio.currentTime : (now - rs.startedAt) / 1000;
            const ambient = rs.track >= 3;
            const bass = clamp01(ad.bass || 0), level = clamp01(ad.rms || 0);

            // Adaptive beat / silence detection (independent of the analyser's absolute scale)
            rs.peak = Math.max(level, rs.peak * 0.9993);
            rs.bassAvg += (bass - rs.bassAvg) * Math.min(1, dt * 3);
            if (bass > rs.bassAvg * 1.35 + 0.05 && now - rs.lastBeat > 150) {
                rs.burst = Math.min(1.6, 0.55 + bass);
                rs.lastBeat = now;
            }
            const quiet = level < rs.peak * 0.14;
            if (quiet && !rs.silent) { if (!rs.silentSince) rs.silentSince = now; if (now - rs.silentSince > 450) rs.silent = true; }
            if (!quiet) {
                rs.silentSince = 0;
                if (rs.silent) { rs.silent = false; rs.reentry = 1; rs.burst = 1.6; }
            }
            rs.burst *= Math.exp(-dt * 5);
            rs.reentry *= Math.exp(-dt * 1.8);
            rs.hush = (rs.hush || 0) + ((rs.silent ? 1 : 0) - (rs.hush || 0)) * Math.min(1, dt * 2.5);

            // Artwork slideshow with crossfade + Ken Burns drift
            const n = rs.imgs.length;
            const slideLen = ambient ? 11 : 7, fade = 1.6;
            const sIdx = Math.floor(t / slideLen), within = t - sIdx * slideLen;
            const drawSlide = (img, alpha, k) => {
                if (!img || !(img.naturalWidth > 0) || alpha <= 0.002) return;
                const z = 1.05 + 0.09 * k + bass * 0.03 + rs.burst * 0.02;
                const w = cw * z, h = ch * z;
                const sc = Math.max(w / img.naturalWidth, h / img.naturalHeight);
                const iw = img.naturalWidth * sc, ih = img.naturalHeight * sc;
                const px = Math.sin(t * 0.07 + sIdx) * cw * 0.02, py = Math.cos(t * 0.05 + sIdx) * ch * 0.02;
                g.globalAlpha = alpha;
                g.drawImage(img, (cw - iw) / 2 + px, (ch - ih) / 2 + py, iw, ih);
            };
            g.save();
            g.globalCompositeOperation = 'source-over';
            g.fillStyle = '#000'; g.fillRect(0, 0, cw, ch);
            const k = within / slideLen;
            drawSlide(rs.imgs[((sIdx % n) + n) % n], 1, k);
            if (within > slideLen - fade) {
                drawSlide(rs.imgs[(((sIdx + 1) % n) + n) % n], (within - (slideLen - fade)) / fade, 0);
            }
            g.globalAlpha = 1;
            g.restore();

            // Pick the glitch sequence from the track clock; envelope gives each sequence a crescendo
            const jungle = [0, 1, 3, 4, 2, 1, 0, 4], soft = [5, 3, 5, 2, 5, 0];
            const pool = ambient ? soft : jungle;
            const segLen = ambient ? 16 : 10;
            const seg = Math.floor(t / segLen), p = (t / segLen) - seg;
            let seq = pool[((seg % pool.length) + pool.length) % pool.length];
            const env = Math.sin(Math.PI * p);
            let amp = (ambient ? 0.18 : 0.35) + (ambient ? 0.45 : 0.65) * env;
            amp = Math.min(1.4, amp + rs.burst * (ambient ? 0.35 : 0.8) + rs.reentry * 0.5);
            amp *= 1 - rs.hush * 0.75;

            // Hidden signature sequence every 64 s of track time
            const sigPhase = t % 64;
            const signature = sigPhase > 41 && sigPhase < 45;
            const frameSeed = Math.floor(now / (ambient ? 140 : 70));
            const rnd = (() => { let s = (frameSeed * 2654435761 + seg * 97 + rs.track) >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; })();

            const sc = rs.scratch;
            if (sc.width !== cw || sc.height !== ch) { sc.width = cw; sc.height = ch; }
            const sx = sc.getContext('2d');
            sx.globalCompositeOperation = 'copy';
            sx.drawImage(this.canvas, 0, 0);
            sx.globalCompositeOperation = 'source-over';

            if (amp > 0.03) {
                g.save();
                if (signature) this._raumSignature(g, sc, cw, ch, t, rnd, sigPhase - 41);
                else if (rs.reentry > 0.55 && !ambient) this._raumReversal(g, sc, cw, ch, rnd, rs.reentry);
                else if (seq === 0) this._raumTear(g, sc, cw, ch, rnd, amp);
                else if (seq === 1) this._raumGrid(g, sc, cw, ch, rnd, amp);
                else if (seq === 2) this._raumMirror(g, sc, cw, ch, t, amp);
                else if (seq === 3) this._raumSmear(g, sc, cw, ch, rs, amp);
                else if (seq === 4) this._raumColumns(g, sc, cw, ch, rnd, amp);
                else this._raumRipple(g, cw, ch, t, amp, bass);
                g.restore();
            }
            // Always keep the trail buffer fresh for the datamosh smear
            const tr = rs.trail;
            if (tr.width !== cw || tr.height !== ch) { tr.width = cw; tr.height = ch; }
            tr.getContext('2d').drawImage(this.canvas, 0, 0);

            // Beat silence: giant reversed Я surfaces out of the dark
            if (rs.hush > 0.02) this._raumGlyph(g, cw, ch, t, rs.hush, 0.55);

            // Caption that decodes itself on track start
            this._raumCaption(g, cw, ch, now, rs);
        }

        _raumGlyph(g, cw, ch, t, a, size) {
            g.save();
            g.globalAlpha = Math.min(0.85, a * 0.8);
            g.translate(cw / 2, ch / 2);
            g.scale(-1, 1);
            g.font = `900 ${Math.floor(Math.min(cw, ch) * size * (1 + 0.02 * Math.sin(t * 2)))}px "Arial Black", Impact, sans-serif`;
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillStyle = '#fff'; g.globalCompositeOperation = 'difference';
            g.fillText('R', 0, 0);
            g.restore();
        }

        _raumCaption(g, cw, ch, now, rs) {
            const age = (now - rs.startedAt) / 1000;
            const full = `pole - Я - raum ${rs.track} - variant X-R  ·  AI WARP × COPILOT × RIVER LYLE REUVENI`;
            const shown = Math.min(full.length, Math.floor(age * 28));
            const glyphs = 'Я▓░▒#@%&01<>/\\';
            let text = '';
            for (let i = 0; i < full.length; i++) {
                text += i < shown || full[i] === ' ' ? full[i] : glyphs[(i * 7 + Math.floor(now / 60)) % glyphs.length];
            }
            const fs = Math.max(11, Math.floor(ch * 0.022));
            g.save();
            g.globalAlpha = age < 14 ? Math.min(1, (14 - age) / 3) * 0.9 : 0;
            g.font = `bold ${fs}px "Courier New", monospace`;
            g.textAlign = 'left'; g.textBaseline = 'bottom';
            g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, ch - fs * 2.2, g.measureText(text).width + fs * 2, fs * 2.2);
            g.fillStyle = '#fff'; g.fillText(text, fs, ch - fs * 0.6);
            g.restore();
        }

        // 0 · TEAR — horizontal strips shear sideways with a hue-split ghost
        _raumTear(g, src, cw, ch, rnd, amp) {
            const strips = Math.floor(6 + amp * 22);
            for (let i = 0; i < strips; i++) {
                const y = Math.floor(rnd() * ch), h = Math.floor(4 + rnd() * ch * 0.07 * amp);
                const dx = (rnd() - 0.5) * cw * 0.18 * amp;
                g.drawImage(src, 0, y, cw, h, dx, y, cw, h);
            }
            g.globalCompositeOperation = 'screen'; g.globalAlpha = Math.min(0.6, 0.18 + amp * 0.3);
            g.filter = 'hue-rotate(160deg) saturate(1.8)';
            g.drawImage(src, cw * 0.012 * amp, 0);
            g.filter = 'hue-rotate(-90deg) saturate(1.8)';
            g.drawImage(src, -cw * 0.012 * amp, 0);
            g.filter = 'none';
        }

        // 1 · GRID — echoes the boxed-grid artwork: tiles swap, flip and punch in
        _raumGrid(g, src, cw, ch, rnd, amp) {
            const cols = 6, rows = 4, tw = cw / cols, th = ch / rows;
            const hits = Math.floor(3 + amp * 12);
            for (let i = 0; i < hits; i++) {
                const c = Math.floor(rnd() * cols), r = Math.floor(rnd() * rows);
                const c2 = Math.floor(rnd() * cols), r2 = Math.floor(rnd() * rows);
                const flip = rnd() < 0.4;
                g.save();
                g.translate(c * tw + tw / 2, r * th + th / 2);
                if (flip) g.scale(-1, 1);
                const s = 1 + (rnd() - 0.3) * 0.25 * amp;
                g.scale(s, s);
                g.drawImage(src, c2 * tw, r2 * th, tw, th, -tw / 2, -th / 2, tw, th);
                g.restore();
                if (rnd() < 0.35) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.strokeRect(c * tw + 1, r * th + 1, tw - 2, th - 2); }
            }
        }

        // 2 · MIRROR — the backwards-Я fold: left half reflected onto the right
        _raumMirror(g, src, cw, ch, t, amp) {
            const fold = cw * (0.5 + 0.12 * Math.sin(t * 0.6));
            g.save();
            g.globalAlpha = Math.min(1, 0.45 + amp * 0.5);
            g.translate(fold * 2, 0); g.scale(-1, 1);
            g.drawImage(src, 0, 0, fold, ch, 0, 0, fold, ch);
            g.restore();
            g.globalCompositeOperation = 'difference'; g.globalAlpha = 0.25 * amp;
            g.fillStyle = '#fff'; g.fillRect(fold - 1, 0, 2, ch);
        }

        // 3 · SMEAR — datamosh-style persistence: previous frame drags, zooms and bleeds
        _raumSmear(g, src, cw, ch, rs, amp) {
            const tr = rs.trail;
            if (!tr.width) return;
            g.globalAlpha = Math.min(0.92, 0.45 + amp * 0.4);
            const z = 1.012 + amp * 0.02;
            g.drawImage(tr, -(cw * (z - 1)) / 2, -(ch * (z - 1)) / 2 - amp * 2, cw * z, ch * z);
            g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.12 * amp;
            g.filter = 'hue-rotate(40deg)';
            g.drawImage(src, 0, 0); g.filter = 'none';
        }

        // 4 · COLUMNS — vertical pixel-drag: single columns are stretched down or up
        _raumColumns(g, src, cw, ch, rnd, amp) {
            const cols = Math.floor(10 + amp * 40);
            for (let i = 0; i < cols; i++) {
                const x = Math.floor(rnd() * cw), w = Math.floor(2 + rnd() * cw * 0.02);
                const y0 = Math.floor(rnd() * ch * 0.8), len = Math.floor(ch * (0.1 + rnd() * 0.5 * amp));
                const down = rnd() < 0.5;
                g.drawImage(src, x, y0, w, 2, x, down ? y0 : y0 - len, w, len);
            }
        }

        // 5 · RIPPLE — slow glass-bell halos, for the ambient pair
        _raumRipple(g, cw, ch, t, amp, bass) {
            g.globalCompositeOperation = 'lighter';
            const cx = cw / 2 + Math.sin(t * 0.21) * cw * 0.1, cy = ch / 2 + Math.cos(t * 0.17) * ch * 0.1;
            const maxR = Math.hypot(cw, ch) * 0.55;
            for (let i = 0; i < 6; i++) {
                const ph = ((t * 0.12 + i / 6) % 1);
                const r = ph * maxR;
                g.strokeStyle = `hsla(${(200 + i * 28 + t * 4) % 360}, 70%, 75%, ${(1 - ph) * 0.35 * amp * (0.6 + bass)})`;
                g.lineWidth = 2 + (1 - ph) * 10 * amp;
                g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
            }
        }

        // Beat re-entry after silence — the frame is cut, reversed and flashed
        _raumReversal(g, src, cw, ch, rnd, a) {
            g.save();
            g.translate(cw, 0); g.scale(-1, 1);
            g.globalAlpha = Math.min(1, a);
            g.drawImage(src, 0, 0);
            g.restore();
            this._raumTear(g, src, cw, ch, rnd, 1.2 * a);
            g.globalCompositeOperation = 'difference'; g.globalAlpha = 0.35 * a;
            g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch);
        }

        // Signature (every 64 s): the album art tiles into a mirrored Я lattice
        _raumSignature(g, src, cw, ch, t, rnd, ph) {
            const a = Math.sin(Math.PI * Math.min(1, ph / 4));
            const n = 4, tw = cw / n, th = ch / n;
            g.globalAlpha = a;
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
                g.save();
                g.translate(c * tw + tw / 2, r * th + th / 2);
                if ((r + c) % 2) g.scale(-1, 1);
                if (r % 2) g.scale(1, -1);
                g.drawImage(src, -tw / 2, -th / 2, tw, th);
                g.restore();
            }
            g.globalAlpha = 1;
            this._raumGlyph(g, cw, ch, t, a * 0.9, 0.7);
            g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
            g.fillStyle = '#fff'; g.font = `bold ${Math.floor(ch * 0.035)}px "Courier New", monospace`;
            g.textAlign = 'center'; g.fillText('AI WARP · Я · X-R · SIGNATURE', cw / 2, ch * 0.94);
        }

        setAudioDrive(driveData) {
            if (!driveData) return;
            Object.assign(this.audioDrive, driveData);
        }

        setWarpMode(mode) {
            if (this.aiWarpModes.includes(mode)) {
                this.aiWarpMode = mode;
                this.aiWarpModeIndex = this.aiWarpModes.indexOf(mode);
            }
        }

        cycleWarpMode() {
            this.aiWarpModeIndex = (this.aiWarpModeIndex + 1) % this.aiWarpModes.length;
            this.aiWarpMode = this.aiWarpModes[this.aiWarpModeIndex];
            return this.aiWarpMode;
        }

        setAiWarpActive(active) {
            this.aiWarpActive = !!active;
            return this.aiWarpActive;
        }

        setAiWarpStrength(val) {
            this.aiWarpStrength = Math.max(0.0, Math.min(1.0, parseFloat(val) || 0.0));
            return this.aiWarpStrength;
        }

        // Toggle the SVG Warp Lens (YouTube per-pixel displacement rail)
        setSvgWarpActive(active) {
            this.svgWarpActive = !!active;
            if (!this.svgWarpActive && this.svgWarpNodes && this.svgWarpNodes.disp) {
                this.svgWarpNodes.disp.setAttribute('scale', '0');
                this._svgWarpLastScale = '0';
            }
            return this.svgWarpActive;
        }

        /* Per-mode SVG lens character: turbulence field shape + displacement
           amplitude. `s` is the effective warp strength, voices push amplitude. */
        resolveSvgWarpLens(mode, s, t, bass, mid, treble, drive, fx) {
            let bfX = 0.006, bfY = 0.010, amp = 42, type = 'fractalNoise';
            switch (mode) {
                case 'liquid':              bfX = 0.0035; bfY = 0.0075; amp = 46; break;
                case 'prism':               bfX = 0.006;  bfY = 0.012;  amp = 40; break;
                case 'breathe':             bfX = 0.003;  bfY = 0.005;  amp = 34 + 30 * (0.5 + 0.5 * Math.sin(t * 2)); break;
                case 'fold':                bfX = 0.013;  bfY = 0.0035; amp = 52; break;
                case 'aurora':              bfX = 0.0045; bfY = 0.009;  amp = 44; break;
                case 'vortex':              bfX = 0.008;  bfY = 0.008;  amp = 54; break;
                case 'cybergrid':           bfX = 0.02;   bfY = 0.02;   amp = 58; type = 'turbulence'; break;
                case 'hyperdrive':          bfX = 0.002;  bfY = 0.02;   amp = 60 + 40 * (drive || 0); break;
                case 'kaleidoscope':        bfX = 0.01;   bfY = 0.01;   amp = 48; break;
                case 'quantum':             bfX = 0.05;   bfY = 0.05;   amp = 72; type = 'turbulence'; break;
                case 'ripple':              bfX = 0.01;   bfY = 0.035;  amp = 50; break;
                case 'analog_crt':          bfX = 0.9;    bfY = 0.001;  amp = 26; type = 'turbulence'; break;
                case 'newblue_roll':        bfX = 0.005;  bfY = 0.02;   amp = 48; break;
                case 'newblue_active_cam':  bfX = 0.008;  bfY = 0.008;  amp = 64; break;
                case 'newblue_shear':       bfX = 0.02;   bfY = 0.004;  amp = 56; break;
                case 'newblue_wiggle':      bfX = 0.012;  bfY = 0.012;  amp = 44; break;
                case 'newblue_zoom_blur':   bfX = 0.004;  bfY = 0.004;  amp = 38; break;
                case 'newblue_video_tile':  bfX = 0.03;   bfY = 0.03;   amp = 30; type = 'turbulence'; break;
                case 'newblue_twirl':       bfX = 0.007;  bfY = 0.007;  amp = 50; break;
                case 'newblue_light_ring':  bfX = 0.006;  bfY = 0.02;   amp = 42; break;
                case 'newblue_earthquake':  bfX = 0.04;   bfY = 0.04;   amp = 86; type = 'turbulence'; break;
                case 'newblue_water_drop':  bfX = 0.01;   bfY = 0.03;   amp = 54; break;
                case 'newblue_rgb_shift':   bfX = 0.015;  bfY = 0.015;  amp = 58; break;
                case 'newblue_quad_mirror': bfX = 0.01;   bfY = 0.004;  amp = 46; break;
                case 'newblue_fish_eye':    bfX = 0.006;  bfY = 0.006;  amp = 64; break;
                case 'newblue_pinch':       bfX = 0.008;  bfY = 0.008;  amp = 58; break;
                case 'newblue_solarize':    bfX = 0.02;   bfY = 0.02;   amp = 50; break;
                case 'newblue_cathode_beam': bfX = 0.6;   bfY = 0.002;  amp = 30; type = 'turbulence'; break;
                case 'newblue_neon_edges':  bfX = 0.011;  bfY = 0.011;  amp = 48; break;
            }
            // Lavalamp drift so the noise field itself flows; bass swells the melt
            const wob = 1 + 0.22 * Math.sin(t * 0.63) + 0.13 * Math.sin(t * 1.17) + bass * 0.18;
            let scale = amp * s * wob;
            scale *= 1 + (fx.vhs * 0.7) + (fx.bands * 0.9) + (fx.strobe * 0.35) + (fx.bomb * 0.5);
            if (this.hardLightActive) scale *= 1.2 * this.getWarpBlendProfile().hardLight;
            scale = Math.max(0, Math.min(160, scale));
            return {
                bfX: bfX * (1 + 0.18 * Math.sin(t * 0.41)),
                bfY: bfY * (1 + 0.18 * Math.cos(t * 0.37)),
                scale, type
            };
        }

        // Live Alpha Calculation
        liveAlpha(name) {
            if (!this.effectEnabled[name]) return 0;
            const alpha = this.effectAlphas[name] !== undefined ? this.effectAlphas[name] : 0.0;
            return clamp01(alpha * this.masterOpacity);
        }

        sizeFor(name) {
            return this.effectSizes[name] !== undefined ? this.effectSizes[name] : 1.0;
        }

        depthFor(name) {
            return this.effectDepths[name] !== undefined ? this.effectDepths[name] : 0.62;
        }

        // Effect Manipulation APIs (User control takes absolute precedence)
        setEffectEnabled(name, enabled) {
            if (!this.effectNames.includes(name)) return;
            this.effectEnabled[name] = !!enabled;
            if (enabled) {
                this.effectUserDisabled[name] = false;
                const target = (this.effectUserLevel[name] && this.effectUserLevel[name] > 0.05) ? this.effectUserLevel[name] : 0.75;
                this.effectAlphas[name] = target;
                this.effectUserLevel[name] = target;
            } else {
                // User intentionally switched this voice OFF - block automations from re-enabling it!
                this.effectUserDisabled[name] = true;
                this.effectAlphas[name] = 0;
                this.effectUserLevel[name] = 0;
            }
        }

        toggleEffect(name) {
            if (!this.effectNames.includes(name)) return false;
            const next = !this.effectEnabled[name];
            this.setEffectEnabled(name, next);
            return next;
        }

        setEffectLevel(name, value) {
            if (!this.effectNames.includes(name)) return;
            const v = clamp01(value);
            this.effectUserLevel[name] = v;
            this.effectAlphas[name] = v;
            this.effectEnabled[name] = v > 0.005;
            if (v <= 0.005) {
                // Dragged to zero: mark as user-disabled so automations don't flip it back on
                this.effectUserDisabled[name] = true;
            } else {
                this.effectUserDisabled[name] = false;
            }
        }

        setEffectSize(name, value) {
            if (!this.effectNames.includes(name)) return;
            this.effectSizes[name] = clamp(parseFloat(value) || 1.0, 0.2, 3.0);
        }

        setEffectDepth(name, value) {
            if (!this.effectNames.includes(name)) return;
            this.effectDepths[name] = clamp01(parseFloat(value) || 0.62);
        }

        setEffectParam(name, param, value) {
            if (!this.effectNames.includes(name)) return;
            if (param === 'level' || param === 'alpha') {
                this.setEffectLevel(name, value);
            } else if (param === 'size') {
                this.setEffectSize(name, value);
            } else if (param === 'depth') {
                this.setEffectDepth(name, value);
            }
        }

        setEffect(name, enabled, alpha = null) {
            if (!this.effectNames.includes(name)) return;
            this.effectEnabled[name] = !!enabled;
            if (alpha !== null) {
                this.effectAlphas[name] = clamp01(parseFloat(alpha) || 0);
            } else if (enabled && (!this.effectAlphas[name] || this.effectAlphas[name] <= 0.01)) {
                this.effectAlphas[name] = 0.75;
            }
        }

        /* ── CORE + GC#(3) CONFLUENCE ROUTING ─────────────────────────────── */
        baseEffectName(name) {
            return String(name || '').replace(/ GC#\(3\)$/, '');
        }

        gc3EffectName(baseName) {
            return `${this.baseEffectName(baseName)} GC#(3)`;
        }

        isGC3Effect(name) {
            return String(name || '').endsWith(' GC#(3)');
        }

        isAutomationEligible(name, respectUserDisabled = true) {
            return this.effectNames.includes(name) && !this.effectLocks[name] &&
                (!respectUserDisabled || !this.effectUserDisabled[name]);
        }

        /* Select a complementary pair whenever both banks are available. Every
           automation calls this route, so a GC#(3) factory is never left outside
           the preset/automation vocabulary. */
        pickConfluenceVoices(baseCandidates = null, maxRails = 2, respectUserDisabled = true) {
            const requested = Array.isArray(baseCandidates) && baseCandidates.length
                ? baseCandidates.map(name => this.baseEffectName(name))
                : this.coreEffectNames.slice();
            const bases = [...new Set(requested.filter(base => this.coreEffectNames.includes(base)))];
            const turn = this.automationPass++;
            const modeKey = this.aiWarpMode || 'liquid';
            const score = (name) => {
                let h = 2166136261;
                const text = `${modeKey}|${turn}|${name}`;
                for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
                return h;
            };
            const shuffled = bases.sort((a, b) => score(a) - score(b));
            const both = [], singles = [];
            shuffled.forEach(base => {
                const pair = [base, this.gc3EffectName(base)].filter(name => this.isAutomationEligible(name, respectUserDisabled));
                if (pair.length === 2) both.push(pair);
                else if (pair.length === 1) singles.push(pair[0]);
            });
            const picked = [];
            if (both.length) picked.push(...both[0]);
            else if (singles.length) picked.push(singles.shift());
            while (picked.length < maxRails && singles.length) {
                const next = singles.shift();
                if (!picked.includes(next)) picked.push(next);
            }
            // When the requested pair has been locked/disabled, retain graceful
            // coverage from another eligible core/R3 pair rather than doing nothing.
            if (picked.length < Math.min(2, maxRails)) {
                for (const pair of both.slice(1)) {
                    for (const name of pair) if (!picked.includes(name) && picked.length < maxRails) picked.push(name);
                    if (picked.length >= maxRails) break;
                }
            }
            return picked.slice(0, maxRails);
        }

        activateAutomationVoices(names, now, low = 0.24, high = 0.60, trackContinual = false) {
            const selected = Array.isArray(names) ? names : [];
            const blend = this.getWarpBlendProfile();
            const turn = this.automationPass++;
            selected.forEach((name, index) => {
                if (!this.isAutomationEligible(name)) return;
                const bankBias = this.isGC3Effect(name) ? 0.92 : 1.0;
                const levelPick = this.nextDeterministicValue();
                const targetPick = this.nextDeterministicValue();
                const level = clamp01((low + levelPick * Math.max(0.01, high - low)) * bankBias * blend.automation);
                this.effectAlphas[name] = +level.toFixed(3);
                this.effectTargets[name] = +clamp01((low + targetPick * Math.max(0.01, high - low)) * blend.automation).toFixed(3);
                this.effectRetargetAt[name] = now + (1100 + (this.nextDeterministicValue() * 2300) + index * 120) / blend.automation;
                this.effectEnabled[name] = true;
                this.effectUserDisabled[name] = false;
                if (trackContinual) this.continualAutomationVoices.add(name);
            });
            return selected;
        }

        rotateContinualConfluence(now) {
            if (now < this.nextContinualSelectionAt) return;
            this.nextContinualSelectionAt = now + 4800 / this.getWarpBlendProfile().automation;
            const selected = this.pickConfluenceVoices(null, 2, true);
            if (!selected.length) return;
            const selectedSet = new Set(selected);
            // Fade only prior automation-owned picks; manual voice choices remain untouched.
            this.continualAutomationVoices.forEach(name => {
                if (selectedSet.has(name) || this.effectLocks[name] || this.effectUserDisabled[name]) return;
                this.effectAlphas[name] = +(this.effectAlphas[name] * 0.34).toFixed(3);
                if (this.effectAlphas[name] <= 0.05) {
                    this.effectAlphas[name] = 0;
                    this.effectEnabled[name] = false;
                    this.continualAutomationVoices.delete(name);
                }
            });
            this.continualSelection = this.activateAutomationVoices(selected, now, 0.20, 0.52, true);
        }

        /* Older 17-voice presets and user presets are upgraded at apply-time.
           Explicit GC#(3) values always win; missing GC#(3) companions inherit a
           restrained, deterministic confluence level from their core partner. */
        resolvePresetAlphas(preset) {
            const raw = (preset && preset.alphas) || {};
            const has = (key) => Object.prototype.hasOwnProperty.call(raw, key);
            const resolved = {};
            this.coreEffectNames.forEach((base, index) => {
                const gc3 = this.gc3EffectName(base);
                const coreExplicit = has(base);
                const gc3Explicit = has(gc3);
                const coreValue = coreExplicit ? clamp01(raw[base]) : 0;
                const gc3Value = gc3Explicit ? clamp01(raw[gc3]) : 0;
                // Stable per-voice weighting: source presets keep their personality,
                // while their first R3 application gains a complementary factory rail.
                const weight = 0.46 + ((index * 37 + (preset && preset.seed ? Number(preset.seed) : 17)) % 21) / 100;
                resolved[base] = coreExplicit ? coreValue : (gc3Explicit ? +(gc3Value * 0.62).toFixed(3) : 0);
                resolved[gc3] = gc3Explicit ? gc3Value : (coreExplicit && coreValue > 0.005
                    ? +Math.min(0.68, coreValue * weight).toFixed(3) : 0);
            });
            return resolved;
        }

        applyPresetAutomationProfile(preset) {
            if (!preset) return;
            if (preset.locks) {
                this.effectNames.forEach(name => {
                    const base = this.baseEffectName(name);
                    this.effectLocks[name] = !!(preset.locks[name] || (this.isGC3Effect(name) && preset.locks[base]));
                });
            }
            const toggles = preset.toggles || {};
            if (typeof toggles.autoGlitch === 'boolean') this.isAutoGlitch = toggles.autoGlitch;
            if (typeof toggles.continualRandomize === 'boolean') this.isContinualRandom = toggles.continualRandomize;
            if (typeof toggles.timedAutomation === 'boolean') this.isTimedAuto = toggles.timedAutomation;
            if (typeof toggles.automatedMasters === 'boolean') this.isAutomatedMasters = toggles.automatedMasters;
            if (typeof toggles.softEyeMode === 'string' && this.softEyeModes.includes(toggles.softEyeMode)) {
                this.softEyeModeIndex = this.softEyeModes.indexOf(toggles.softEyeMode);
                this.softEyeActive = toggles.softEyeMode !== 'OFF';
            }
        }

        setGhostMode(mode, level = null) {
            if (this.r3GhostVsync) return this.r3GhostVsync.setGhostMode(mode, level);
            if (this.ghostModes.includes(mode)) {
                this.ghostModeIndex = this.ghostModes.indexOf(mode);
                if (level !== null) this.ghostLevel = clamp01(level);
            }
            return this.ghostModes[this.ghostModeIndex];
        }

        setGhostLevel(level, isManual = true) {
            if (this.r3GhostVsync) return this.r3GhostVsync.setGhostLevel(level, isManual);
            this.ghostLevel = clamp01(level);
            if (this.ghostLevel > 0.02 && this.ghostModes[this.ghostModeIndex] === 'OFF') this.ghostModeIndex = 2;
            return this.ghostLevel;
        }

        cycleGhostMode() {
            if (this.r3GhostVsync) return this.r3GhostVsync.cycleGhostMode();
            this.ghostModeIndex = (this.ghostModeIndex + 1) % this.ghostModes.length;
            if (this.ghostModes[this.ghostModeIndex] !== 'OFF' && this.ghostLevel <= 0.01) this.ghostLevel = 0.55;
            return this.ghostModes[this.ghostModeIndex];
        }

        setVsyncMode(mode, level = null) {
            if (this.r3GhostVsync) return this.r3GhostVsync.setVsyncMode(mode, level);
            if (this.vsyncLocked) return this.vsyncModes[this.vsyncModeIndex];
            if (this.vsyncModes.includes(mode)) {
                this.vsyncModeIndex = this.vsyncModes.indexOf(mode);
                if (level !== null) this.vsyncLevel = clamp01(level);
            }
            return this.vsyncModes[this.vsyncModeIndex];
        }

        setVsyncLevel(level, isManual = true) {
            if (this.r3GhostVsync) return this.r3GhostVsync.setVsyncLevel(level, isManual);
            this.vsyncLevel = clamp01(level);
            if (this.vsyncLevel > 0.02 && this.vsyncModes[this.vsyncModeIndex] === 'OFF') this.vsyncModeIndex = 1;
            return this.vsyncLevel;
        }

        cycleVsyncMode() {
            if (this.r3GhostVsync) return this.r3GhostVsync.cycleVsyncMode();
            if (this.vsyncLocked) return this.vsyncModes[this.vsyncModeIndex];
            this.vsyncModeIndex = (this.vsyncModeIndex + 1) % this.vsyncModes.length;
            if (this.vsyncModes[this.vsyncModeIndex] !== 'OFF' && this.vsyncLevel <= 0.01) this.vsyncLevel = 0.60;
            return this.vsyncModes[this.vsyncModeIndex];
        }

        zeroAll() {
            // Trigger EMP Flatline Purge Shockwave on canvas
            this.triggerButtonEffect('emp_purge');

            this.continualAutomationVoices.clear();
            this.continualSelection = [];
            this.nextContinualSelectionAt = 0;
            this.effectNames.forEach(name => {
                this.effectAlphas[name] = 0;
                this.effectEnabled[name] = false;
                this.effectUserDisabled[name] = true;
                this.effectUserLevel[name] = 0;
                this.effectTargets[name] = 0;
            });
            this.ghostLevel = 0;
            this.vsyncLevel = 0;
            this.ghostModeIndex = 0;
            this.vsyncModeIndex = 0;
            if (this.r3GhostVsync) this.r3GhostVsync.reset();
            this.aiWarpStrength = 0;
            this.aiWarpActive = false;
            this.isAutoGlitch = false;
            this.isContinualRandom = false;
            this.isTimedAuto = false;
            this.softEyeActive = false;
            this.softEyeModeIndex = 0; // 'OFF'
            this.setMilkdropActive(false);
            if (typeof this.onAutomationChange === 'function') {
                this.onAutomationChange();
            }
        }

        triggerButtonEffect(type, meta = {}) {
            const now = performance.now();
            let duration = 350;
            if (type === 'emp_purge') duration = 650;
            else if (type === 'crescendo') duration = 2200;
            else if (type === 'ghost_pulse') duration = 480;
            else if (type === 'vsync_pulse') duration = 420;
            else if (type === 'ai_warp_pulse') duration = 520;
            else if (type === 'warp_mode_switch') duration = 400;
            else if (type === 'auto_glitch_pulse') duration = 380;
            else if (type === 'continual_rand_pulse') duration = 450;
            else if (type === 'timed_auto_pulse') duration = 400;

            this.transientEffects.push({
                type,
                meta,
                startTime: now,
                duration
            });
        }

        shuffleMilkdropPresetDeck() {
            for (let i = this.milkdropPresetDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.milkdropPresetDeck[i], this.milkdropPresetDeck[j]] = [this.milkdropPresetDeck[j], this.milkdropPresetDeck[i]];
            }
        }

        setMilkdropOpacity(value) {
            const level = clamp01(parseFloat(value));
            this.milkdropOpacity = level;
            this.milkdropTargetOpacity = level;
            return level;
        }

        setMilkdropActive(active) {
            this.milkdropActive = !!active;
            this.milkdropStartAt = this.milkdropActive ? performance.now() : 0;
            this.milkdropLastRenderAt = 0;
            if (this.milkdropActive) this.shuffleMilkdropPresetDeck();
            this.milkdropPresetIndex = -1;
            this.milkdropCurrentPreset = null;
            [this.milkdropFeedbackCtx, this.milkdropNextCtx].forEach(ctx => {
                if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
            });
            return this.milkdropActive;
        }

        milkdropVoiceBlend() {
            const totals = { weight:0, chroma:0, rhythm:0, texture:0, geometry:0 };
            const names = this.effectNames || [];
            for (let i = 0; i < names.length; i++) {
                const name = names[i];
                if (!this.effectEnabled[name]) continue;
                const level = clamp01((this.effectAlphas[name] || 0) * this.masterOpacity);
                if (level <= 0.005) continue;
                const base = String(name).replace(/ GC#\(3\)$/, '');
                let hash = 2166136261;
                for (let j = 0; j < base.length; j++) hash = Math.imul(hash ^ base.charCodeAt(j), 16777619) >>> 0;
                const grain = (hash % 997) / 996;
                const isChroma = /Neon Grad|HSL Rainbow|Hue\/Color Cycle|B&W Invert/.test(base);
                const isRhythm = /Flash|Strobe|Scanlines|Data Bands|VHS Glitch|Data Bomb/.test(base);
                const isTexture = /ASCII|Font Burn|Ink Glyphs|Matrix|Gemini Bomb/.test(base);
                const isGeometry = /Tech Artist|Neon Grad|VHS Glitch|Data Bands|Gemini Bomb/.test(base);
                totals.weight += level;
                totals.chroma += level * (isChroma ? 1.25 : 0.55 + grain * 0.35);
                totals.rhythm += level * (isRhythm ? 1.2 : 0.42 + (1 - grain) * 0.35);
                totals.texture += level * (isTexture ? 1.2 : 0.45 + grain * 0.28);
                totals.geometry += level * (isGeometry ? 1.15 : 0.48 + (1 - grain) * 0.3);
            }
            const d = totals.weight || 1;
            return {
                activity: clamp01(totals.weight / 3.2),
                chroma: clamp01(totals.chroma / d), rhythm: clamp01(totals.rhythm / d),
                texture: clamp01(totals.texture / d), geometry: clamp01(totals.geometry / d)
            };
        }

        /* Milkdrop/projectM-inspired Canvas feedback and wave automations.
           This is an original, dependency-free renderer: zoom/rotation feedback,
           audio-reactive polar waveforms, and soft metaball-like colour blooms. */
        renderMilkdrop(now) {
            if (!this.milkdropActive) return;
            const w = this.canvas.width, h = this.canvas.height;
            if (!w || !h || !this.milkdropNextCtx || !this.milkdropFeedbackCtx) return;
            if (!this.milkdropStartAt) this.milkdropStartAt = now;
            const elapsed = Math.max(0, now - this.milkdropStartAt);
            const modeBlend = this.getWarpBlendProfile();
            const presetDuration = 14000 / Math.max(0.65, modeBlend.automation);
            const presetIndex = Math.floor(elapsed / presetDuration) % this.milkdropPresetDeck.length;
            if (presetIndex !== this.milkdropPresetIndex || !this.milkdropCurrentPreset) {
                this.milkdropPresetIndex = presetIndex;
                this.milkdropCurrentPreset = this.milkdropPresetDeck[presetIndex];
                if (!this.milkdropOpacityLocked) this.milkdropTargetOpacity = this.milkdropCurrentPreset.opacity;
                if (typeof this.onMilkdropPresetChange === 'function') this.onMilkdropPresetChange(this.milkdropCurrentPreset, presetIndex);
            }
            const preset = this.milkdropCurrentPreset;
            const opacityDt = this.milkdropLastRenderAt ? Math.max(0, Math.min(0.1, (now - this.milkdropLastRenderAt) / 1000)) : 0;
            this.milkdropLastRenderAt = now;
            this.milkdropOpacity = lerp(this.milkdropOpacity, this.milkdropTargetOpacity, 1 - Math.exp(-opacityDt * 2.4));
            const t = elapsed * 0.001;
            const voiceBlend = this.milkdropVoiceBlend();
            const audio = this.audioDrive || {};
            const bass = clamp01((audio.bass || audio.drive || 0) * modeBlend.ear * (0.86 + voiceBlend.rhythm * 0.14));
            const mid = clamp01((audio.mid || audio.drive || 0) * modeBlend.ear * (0.88 + voiceBlend.texture * 0.12));
            const treble = clamp01((audio.treble || 0) * modeBlend.ear * (0.88 + voiceBlend.chroma * 0.12));
            const beat = clamp01((audio.beat || 0) * modeBlend.ear * (0.85 + voiceBlend.rhythm * 0.15));
            const hueBase = ((this.videoPalette.hue || 0) + preset.hueOffset + t * (8 + treble * 26 * modeBlend.vsyncSpeed) + modeBlend.huePhase) % 360;
            const zoom = 1.002 + preset.zoomBias + 0.006 * Math.sin(t * 0.42 + preset.id) + bass * 0.009
                + (modeBlend.canvas - 1) * 0.002 + voiceBlend.geometry * 0.0015;
            const spin = Math.sin(t * 0.31 + preset.id * 0.8) * (0.002 + beat * 0.012) * preset.twist
                * (0.72 + modeBlend.vsyncSpeed * 0.14 + modeBlend.vsyncRoll * 0.14) * modeBlend.phase;
            const fbAlpha = Math.min(0.24, preset.feedback * 0.48 + 0.025 * (0.5 + 0.5 * Math.sin(t * 0.47))
                + bass * 0.028 + modeBlend.ghostWarp * 0.012 + modeBlend.softEye * 0.008
                + voiceBlend.texture * 0.022 + voiceBlend.activity * 0.014);
            const dst = this.milkdropNextCtx, fb = this.milkdropFeedbackCtx;
            dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.clearRect(0, 0, w, h);
            dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1; dst.filter = 'none';
            dst.drawImage(this.canvas, 0, 0, w, h);
            // Smooth feedback loop: gently zoom, rotate, hue-shift and soften prior frames.
            dst.save(); dst.translate(w * 0.5, h * 0.5); dst.rotate(spin); dst.scale(zoom, zoom);
            dst.translate(-w * 0.5, -h * 0.5);
            dst.globalCompositeOperation = 'soft-light';
            dst.globalAlpha = fbAlpha;
            dst.filter = `hue-rotate(${(hueBase * 0.16 + modeBlend.ghostChroma * 8 + voiceBlend.chroma * 18).toFixed(1)}deg) saturate(${(1.02 + modeBlend.hardLight * 0.04 + voiceBlend.chroma * 0.12).toFixed(2)}) blur(${(0.22 + bass * 0.45 + modeBlend.softEye * 0.08).toFixed(2)}px)`;
            dst.drawImage(this.milkdropFeedbackCanvas, 0, 0, w, h); dst.restore(); dst.filter = 'none';
            // Distinctive Milkdrop-style polar waveforms, driven by the analyser when available.
            const cx = w * 0.5, cy = h * 0.5, minDim = Math.min(w, h);
            const rings = Math.max(1, Math.min(5, preset.rings + (voiceBlend.geometry > 0.72 ? 1 : 0) + (modeBlend.vsyncTears > 1.18 ? 1 : 0)));
            for (let ring = 0; ring < rings; ring++) {
                const points = 192 + Math.round(voiceBlend.texture * 48);
                const baseR = minDim * (0.14 + ring * 0.065 + bass * 0.035 + modeBlend.ghostSplit * 0.004);
                dst.beginPath();
                for (let i = 0; i <= points; i++) {
                    const a = i / points * Math.PI * 2;
                    const wave = Math.sin(a * (preset.waveFreq + ring * 2 + Math.round(modeBlend.vsyncTears * 0.6)) + t * (1.1 + ring * 0.24) * modeBlend.vsyncSpeed) * (preset.waveAmp * (0.78 + modeBlend.ghostWarp * 0.16 + voiceBlend.rhythm * 0.28) + mid * 0.085 + beat * 0.035)
                        + Math.sin(a * (7 + ring * 2 + Math.round(voiceBlend.chroma * 2)) - t * 0.73 * modeBlend.phase) * (0.012 + treble * 0.045);
                    const r = baseR * (1 + wave);
                    const angle = a + t * (0.07 + modeBlend.vsyncRoll * 0.012) * (ring % 2 ? -1 : 1);
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r * Math.max(0.48, Math.min(1.35, preset.yScale * modeBlend.canvas + 0.12 * Math.sin(t * 0.18)));
                    if (!i) dst.moveTo(x, y); else dst.lineTo(x, y);
                }
                dst.closePath(); dst.globalCompositeOperation = 'screen';
                dst.globalAlpha = Math.min(0.12, 0.016 + preset.bloom * 0.022 + 0.030 * bass + 0.012 * beat + modeBlend.ghostLines * 0.008 + voiceBlend.chroma * 0.015);
                dst.strokeStyle = `hsla(${(hueBase + ring * 72 + voiceBlend.chroma * 24) % 360},86%,${Math.min(62, 45 + ring * 2 + modeBlend.hardLight * 1.5)}%,0.72)`;
                dst.lineWidth = Math.max(0.8, minDim * (0.0009 + ring * 0.00022) * Math.min(1.15, modeBlend.ghostGlow)); dst.stroke();
            }
            // Soft liquid blooms: layered radial gradients create a soup-like colour mashup.
            dst.globalCompositeOperation = 'soft-light';
            dst.filter = `blur(${(minDim * (0.005 + modeBlend.softEye * 0.0015 + voiceBlend.texture * 0.0008)).toFixed(1)}px)`;
            const bloomCount = Math.max(2, Math.min(5, 2 + (preset.id % 3) + (voiceBlend.texture > 0.78 ? 1 : 0)));
            for (let i = 0; i < bloomCount; i++) {
                const a = t * (0.18 + i * 0.025) + i * Math.PI * 0.4;
                const x = cx + Math.cos(a * (0.82 + voiceBlend.geometry * 0.30)) * minDim * (0.15 + 0.045 * Math.sin(t * 0.37 + i) + voiceBlend.geometry * 0.025);
                const y = cy + Math.sin(a * (1.05 + modeBlend.phase * 0.12)) * minDim * (0.10 + 0.04 * Math.cos(t * 0.29 + i) + voiceBlend.texture * 0.02);
                const r = minDim * (0.04 + preset.bloom * 0.022 + 0.025 * bass + voiceBlend.geometry * 0.012 + 0.01 * Math.sin(t * 0.6 + i));
                const grad = dst.createRadialGradient(x, y, r * 0.05, x, y, r);
                grad.addColorStop(0, `hsla(${(hueBase + i * (45 + modeBlend.ghostChroma * 9) + voiceBlend.chroma * 34) % 360},88%,${Math.min(66, 52 + modeBlend.hardLight * 3)}%,${(0.030 + bass * 0.025 + voiceBlend.activity * 0.018).toFixed(3)})`);
                grad.addColorStop(0.48, `hsla(${(hueBase + i * 61 + 28 + voiceBlend.rhythm * 18) % 360},84%,52%,${(0.016 + voiceBlend.texture * 0.010).toFixed(3)})`);
                grad.addColorStop(1, 'hsla(0,0%,0%,0)');
                dst.globalAlpha = 0.34; dst.fillStyle = grad; dst.beginPath(); dst.arc(x, y, r, 0, Math.PI * 2); dst.fill();
                if (preset.mirror && i % 2 === 0) { dst.globalAlpha = 0.16; dst.beginPath(); dst.arc(w - x, h - y, r * 0.78, 0, Math.PI * 2); dst.fill(); }
            }
            dst.filter = 'none'; dst.restore();
            // Persist the composite for the next frame, then place it back on the voice canvas.
            fb.save(); fb.setTransform(1, 0, 0, 1, 0, 0); fb.clearRect(0, 0, w, h); fb.drawImage(this.milkdropNextCanvas, 0, 0); fb.restore();
            const g = this.gctx; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
            g.globalCompositeOperation = 'source-over'; g.filter = 'none';
            g.globalAlpha = clamp01(this.milkdropOpacity);
            if (g.globalAlpha > 0.001) g.drawImage(this.milkdropNextCanvas, 0, 0);
            g.restore();
        }

        renderTransientEffects(now) {
            if (this.transientEffects.length === 0) return;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const g = this.gctx;

            for (let i = this.transientEffects.length - 1; i >= 0; i--) {
                const eff = this.transientEffects[i];
                const elapsed = now - eff.startTime;
                if (elapsed >= eff.duration) {
                    this.transientEffects.splice(i, 1);
                    continue;
                }
                const progress = elapsed / eff.duration;

                g.save();
                if (eff.type === 'emp_purge') {
                    // EMP Flatline Purge Shockwave
                    if (progress < 0.20) {
                        const alpha = (1.0 - progress / 0.20) * 0.95;
                        g.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                        g.fillRect(0, 0, w, h);
                    } else if (progress < 0.65) {
                        const p2 = (progress - 0.20) / 0.45;
                        const halfH = (1.0 - p2) * (h / 2);
                        g.fillStyle = '#020408';
                        g.fillRect(0, 0, w, (h / 2) - halfH);
                        g.fillRect(0, (h / 2) + halfH, w, (h / 2) - halfH);

                        g.fillStyle = `rgba(255, 255, 255, ${1.0 - p2 * 0.3})`;
                        g.fillRect(0, (h / 2) - 1.5, w, 3);
                        g.fillStyle = `rgba(0, 229, 255, ${0.85 * (1.0 - p2 * 0.2)})`;
                        g.fillRect(0, (h / 2) - 4, w, 8);
                    } else {
                        const p3 = (progress - 0.65) / 0.35;
                        g.fillStyle = '#020408';
                        g.fillRect(0, 0, w, h);

                        const halfW = (1.0 - p3) * (w / 2);
                        if (halfW > 4) {
                            g.fillStyle = `rgba(255, 255, 255, ${1.0 - p3})`;
                            g.fillRect((w / 2) - halfW, (h / 2) - 1.5, halfW * 2, 3);
                            g.fillStyle = `rgba(0, 229, 255, ${0.9 * (1.0 - p3)})`;
                            g.fillRect((w / 2) - halfW, (h / 2) - 4, halfW * 2, 8);
                        } else {
                            const dotAlpha = (1.0 - p3);
                            g.beginPath();
                            g.arc(w / 2, h / 2, 3 + (1.0 - p3) * 5, 0, Math.PI * 2);
                            g.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
                            g.fill();
                            g.beginPath();
                            g.arc(w / 2, h / 2, 10 + (1.0 - p3) * 14, 0, Math.PI * 2);
                            g.fillStyle = `rgba(0, 229, 255, ${dotAlpha * 0.6})`;
                            g.fill();
                        }
                    }
                } else if (eff.type === 'ghost_pulse') {
                    const sweepX = progress * w * 1.3;
                    // One-shot mode-change sweep only: keep it at 5% opacity.
                    g.globalAlpha = 0.05;
                    const grad = g.createLinearGradient(sweepX - 120, 0, sweepX, 0);
                    grad.addColorStop(0, 'rgba(0, 255, 200, 0)');
                    grad.addColorStop(0.7, 'rgba(220, 20, 255, 0.45)');
                    grad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
                    g.fillStyle = grad;
                    g.fillRect(sweepX - 120, 0, 120, h);
                } else if (eff.type === 'vsync_pulse') {
                    const zapY = progress * h;
                    // One-shot mode-change scan line only: keep it at 5% opacity.
                    g.globalAlpha = 0.05;
                    g.fillStyle = `rgba(255, 255, 255, ${(1.0 - progress) * 0.9})`;
                    g.fillRect(0, zapY - 2, w, 4);
                    g.fillStyle = `rgba(255, 150, 0, ${(1.0 - progress) * 0.6})`;
                    g.fillRect(0, zapY - 8, w, 16);
                } else if (eff.type === 'ai_warp_pulse') {
                    const maxR = Math.sqrt(w * w + h * h) * 0.6;
                    const r = progress * maxR;
                    g.beginPath();
                    g.arc(w / 2, h / 2, r, 0, Math.PI * 2);
                    g.strokeStyle = `rgba(0, 255, 200, ${(1.0 - progress) * 0.85})`;
                    g.lineWidth = 6 * (1.0 - progress) + 2;
                    g.stroke();
                } else if (eff.type === 'warp_mode_switch') {
                    const alpha = (1.0 - progress) * 0.65;
                    g.fillStyle = `rgba(0, 229, 255, ${alpha * 0.5})`;
                    g.fillRect(0, (h / 2) - progress * h * 0.5, w, progress * h);
                } else if (eff.type === 'auto_glitch_pulse') {
                    const count = Math.round((1.0 - progress) * 12);
                    for (let k = 0; k < count; k++) {
                        const by = Math.random() * h;
                        const bh = 4 + Math.random() * 20;
                        g.fillStyle = `rgba(255, 30, 80, ${(1.0 - progress) * 0.7})`;
                        g.fillRect(0, by, w, bh);
                    }
                } else if (eff.type === 'continual_rand_pulse') {
                    const waveY = progress * h;
                    const grad = g.createLinearGradient(0, waveY - 40, 0, waveY + 40);
                    grad.addColorStop(0, 'rgba(0, 229, 255, 0)');
                    grad.addColorStop(0.5, `rgba(0, 255, 170, ${(1.0 - progress) * 0.6})`);
                    grad.addColorStop(1, 'rgba(255, 0, 128, 0)');
                    g.fillStyle = grad;
                    g.fillRect(0, waveY - 40, w, 80);
                } else if (eff.type === 'timed_auto_pulse') {
                    const p = Math.sin(progress * Math.PI);
                    g.strokeStyle = `rgba(255, 215, 0, ${p * 0.85})`;
                    g.lineWidth = 3;
                    g.strokeRect(20 * (1 - p), 20 * (1 - p), w - 40 * (1 - p), h - 40 * (1 - p));
                }
                g.restore();
            }
        }

        updateTimedAutomation(now, dt) {
            if (!this.isTimedAuto) return;
            const cadenceKey = this.timedCadences[this.timedCadenceIndex] || '2_bar';
            
            let periodSec = 3.692;
            let beatSec = 0.4615;
            let beatsTotal = 8;
            let label = '2-BAR';

            if (cadenceKey === 'half_beat') {
                periodSec = 0.2307; beatSec = 0.2307; beatsTotal = 1; label = 'RAPID';
            } else if (cadenceKey === '1_bar') {
                periodSec = 1.846; beatSec = 0.4615; beatsTotal = 4; label = '1-BAR';
            } else if (cadenceKey === '2_bar') {
                periodSec = 3.692; beatSec = 0.4615; beatsTotal = 8; label = '2-BAR';
            } else if (cadenceKey === '4_bar') {
                periodSec = 7.384; beatSec = 0.4615; beatsTotal = 16; label = '4-BAR';
            } else if (cadenceKey === 'soft_eye') {
                periodSec = 4.2; beatSec = 1.05; beatsTotal = 4; label = 'SOFT-EYE';
            } else if (cadenceKey === 'lfo_wave') {
                periodSec = 8.0; beatSec = 2.0; beatsTotal = 4; label = 'LFO WAVE';
            }

            const tSec = (now * 0.001) % periodSec;
            const progress = tSec / periodSec;
            const currentBeat = Math.floor(tSec / beatSec);

            this.timedAutomationState.phase = progress;
            this.timedAutomationState.beat = currentBeat;
            this.timedAutomationState.progress = Math.round(progress * 100);
            this.timedAutomationState.label = label;

            if (currentBeat !== this.timedAutomationState.lastBeatTriggered) {
                this.timedAutomationState.lastBeatTriggered = currentBeat;
                
                // Each timed beat chooses an eligible confluence pair: a retained
                // core voice plus its independently rendered GC#(3) factory rail.
                const b = currentBeat % 4;
                const basePool = (b === 0) ? ['Scanlines', 'VHS Glitch'] :
                                 (b === 1) ? ['Matrix ASCII', 'ASCII'] :
                                 (b === 2) ? ['Neon Grad', 'HSL Rainbow'] :
                                 ['Strobe', 'Data Bomb'];
                const pool = this.pickConfluenceVoices(basePool, 2, true);
                this.activateAutomationVoices(pool, now, 0.34, 0.68);

                // Gently decay voices not in the active paired beat pool so voices don't pile up.
                this.effectNames.forEach(name => {
                    if (!pool.includes(name) && !this.effectLocks[name] && this.effectAlphas[name] > 0.05) {
                        this.effectAlphas[name] = Math.max(0, +(this.effectAlphas[name] * 0.75).toFixed(2));
                        if (this.effectAlphas[name] <= 0.05) {
                            this.effectAlphas[name] = 0;
                            this.effectEnabled[name] = false;
                        }
                    }
                });

                if (typeof this.onAutomationChange === 'function') {
                    this.onAutomationChange();
                }
            }

            if (progress < 0.05 && this.timedAutomationState.lastBarTriggered !== Math.floor(now * 0.001 / periodSec)) {
                this.timedAutomationState.lastBarTriggered = Math.floor(now * 0.001 / periodSec);
                const nextMode = this.cycleWarpMode();
                this.triggerButtonEffect('warp_mode_switch');
                if (this.ghostModes[this.ghostModeIndex] !== 'OFF') {
                    this.triggerButtonEffect('ghost_pulse');
                }
                if (this.r3GhostVsync && (this.ghostModes[this.ghostModeIndex] !== 'OFF' || this.vsyncModes[this.vsyncModeIndex] !== 'OFF')) {
                    this.r3GhostVsync.requestBurst(now, 'timed-cadence', 0.56, currentBeat % 2 ? 'color' : 'dia');
                }
                if (typeof this.onAutomationChange === 'function') {
                    this.onAutomationChange();
                }
            }

            if (typeof this.onCadenceProgress === 'function') {
                this.onCadenceProgress(this.timedAutomationState);
            }
        }

        randomizeBoard() {
            this.triggerButtonEffect('continual_rand_pulse');
            // Clean board: choose a core/R3 confluence pair, plus at most one accent rail.
            const count = 2 + Math.floor(Math.random() * 2); // 2 or 3 voices MAX
            const selected = this.pickConfluenceVoices(null, count, false);
            
            this.effectNames.forEach(name => {
                if (this.effectLocks[name]) return;
                this.effectAlphas[name] = 0;
                this.effectUserLevel[name] = 0;
                this.effectEnabled[name] = false;
                this.effectUserDisabled[name] = false;
            });

            for (let i = 0; i < selected.length; i++) {
                const name = selected[i];
                const lvl = +(0.35 + Math.random() * 0.45).toFixed(2);
                this.effectAlphas[name] = lvl;
                this.effectUserLevel[name] = lvl;
                this.effectEnabled[name] = true;
                this.effectSizes[name] = +(0.8 + Math.random() * 1.2).toFixed(2);
                this.effectDepths[name] = +(0.4 + Math.random() * 0.45).toFixed(2);
            }

            // Pick random warp mode
            this.setWarpMode(this.aiWarpModes[Math.floor(Math.random() * this.aiWarpModes.length)]);
            this.aiWarpActive = true;
            this.aiWarpStrength = +(0.45 + Math.random() * 0.35).toFixed(2);

            if (typeof this.onAutomationChange === 'function') {
                this.onAutomationChange();
            }
        }

        stepAutomatedMasters(now, dt) {
            if (!this.isAutomatedMasters) return;
            if (!this.nextMasterRetargetAt || now > this.nextMasterRetargetAt) {
                const blend = this.getWarpBlendProfile();
                this.nextMasterRetargetAt = now + 4000 / blend.automation;
                this.targetGlitchSpeed = +(0.5 + this.nextDeterministicValue() * 2.0).toFixed(2);
                this.targetMasterOpacity = +(0.75 + this.nextDeterministicValue() * 0.25).toFixed(2);
                if (this.r3GhostVsync) {
                    if (this.ghostModes[this.ghostModeIndex] !== 'OFF') this.r3GhostVsync.setGhostLevel(0.24 + this.nextDeterministicValue() * 0.62, false);
                    if (this.vsyncModes[this.vsyncModeIndex] !== 'OFF' && !this.vsyncLocked) this.r3GhostVsync.setVsyncLevel(0.32 + this.nextDeterministicValue() * 0.58, false);
                }
                const masterPair = this.pickConfluenceVoices(null, 2, true);
                this.activateAutomationVoices(masterPair, now, 0.18, 0.46);
            }
            this.glitchSpeed = +(lerp(this.glitchSpeed, this.targetGlitchSpeed || 1.2, 0.04)).toFixed(3);
            this.masterOpacity = +(lerp(this.masterOpacity, this.targetMasterOpacity || 0.95, 0.04)).toFixed(3);
            if (typeof this.onAutomationChange === 'function') {
                this.onAutomationChange();
            }
        }

        softEyeStep(now, dt) {
            if (this.r3GhostVsync) {
                this.r3GhostVsync.stepSoftEye(now, dt);
                return;
            }
            if (!this.softEyeActive) return;
            const mode = this.softEyeModes[this.softEyeModeIndex] || 'CALM';
            if (mode === 'OFF') {
                this.softEyeK = 0;
                return;
            }
            const audio = this.audioDrive;
            const bass = audio.bass || 0;
            
            const speed = mode === 'CRESCENDO' ? 0.30 : mode === 'SURGE' ? 0.20 : 0.10;
            this.softEyeK = (this.softEyeK || 0) + (speed * dt) + (bass * 0.035);
            
            if (this.softEyeK >= 1.0) {
                this.softEyeK = 0.08;
                if (mode === 'SURGE' || mode === 'CRESCENDO') {
                    this.triggerCrescendo();
                }
            }

            if (typeof this.onSoftEyeProgress === 'function') {
                this.onSoftEyeProgress(this.softEyeK, mode);
            }
        }

        triggerCrescendo() {
            if (this.r3GhostVsync) this.r3GhostVsync.requestBurst(performance.now(), 'manual-crescendo', 1.0, 'both');
            // High-impact temporary pulse of only 1 or 2 flare voices (never leave 7 voices stuck on!)
            const burstList = ['Flash', 'Strobe', 'Flash GC#(3)', 'Strobe GC#(3)'];
            burstList.forEach(name => {
                if (this.effectNames.includes(name) && !this.effectLocks[name] && !this.effectUserDisabled[name]) {
                    this.effectAlphas[name] = +(0.70 + this.nextDeterministicValue() * 0.25).toFixed(2);
                    this.effectEnabled[name] = true;
                }
            });
            this.triggerButtonEffect('crescendo_blast');
            if (this.crescendo && this.crescendo.burstNow) {
                try { this.crescendo.burstNow(3.0); } catch(e) {}
            }
            if (typeof this.onAutomationChange === 'function') {
                this.onAutomationChange();
            }

            setTimeout(() => {
                burstList.forEach(name => {
                    if (!this.effectLocks[name] && !this.effectUserDisabled[name]) {
                        this.effectAlphas[name] = 0;
                        this.effectEnabled[name] = false;
                    }
                });
                if (typeof this.onAutomationChange === 'function') {
                    this.onAutomationChange();
                }
            }, 900);
        }

        /* ── SMOOTH PRESET INTERPOLATION & PROGRESSION ENGINE ────────────────── */
        transitionToPreset(preset, durationMs = 1500) {
            if (!preset) return;
            const targetAlphas = this.resolvePresetAlphas(preset);

            const targetStrength = preset.warpStrength !== undefined
                ? preset.warpStrength
                : (this.aiWarpStrength > 0.15 ? this.aiWarpStrength : 0.45);

            const targetSpeed = (preset.masterControls && preset.masterControls.continualSpeed !== undefined)
                ? preset.masterControls.continualSpeed
                : ((preset.masterControls && preset.masterControls.speed !== undefined) ? preset.masterControls.speed : 0.85);

            const targetOpacity = preset.masterOpacity !== undefined ? Math.max(0.70, preset.masterOpacity) : 0.88;

            const targetGhost = preset.ghostMode || 'OFF';
            const targetGhostLvl = preset.ghostLevel !== undefined ? preset.ghostLevel : 0.55;
            const targetVsync = preset.vsyncMode || 'OFF';
            const targetVsyncLvl = (preset.vsyncLevels && preset.vsyncLevels[targetVsync] !== undefined)
                ? preset.vsyncLevels[targetVsync]
                : 0.55;

            const targetWarpMode = preset.warpMode || this.aiWarpModes[Math.floor(Math.random() * this.aiWarpModes.length)];

            this.presetTransition = {
                active: true,
                startTime: performance.now(),
                duration: durationMs || 1500,
                startAlphas: Object.assign({}, this.effectAlphas),
                targetAlphas: targetAlphas,
                startStrength: this.aiWarpStrength,
                targetStrength: targetStrength,
                startSpeed: this.glitchSpeed,
                targetSpeed: targetSpeed,
                startOpacity: this.masterOpacity,
                targetOpacity: targetOpacity,
                targetWarpMode: targetWarpMode,
                targetGhostMode: targetGhost,
                targetGhostLevel: targetGhostLvl,
                targetVsyncMode: targetVsync,
                targetVsyncLevel: targetVsyncLvl,
                sourcePreset: preset,
                profileApplied: false,
                modeSwitched: false
            };

            this.aiWarpActive = true;
        }

        updatePresetTransition(now, dt) {
            const tr = this.presetTransition;
            if (!tr || !tr.active) return;
            const elapsed = now - tr.startTime;
            const p = Math.min(1.0, elapsed / tr.duration);
            // Smooth cubic hermite S-curve ease in-out: 3p^2 - 2p^3
            const ease = p * p * (3 - 2 * p);

            // 1. Cross-fade 17 Voice Alphas
            this.effectNames.forEach(fx => {
                const a0 = tr.startAlphas[fx] !== undefined ? tr.startAlphas[fx] : 0;
                const a1 = tr.targetAlphas[fx] !== undefined ? tr.targetAlphas[fx] : 0;
                const cur = a0 + (a1 - a0) * ease;
                this.effectAlphas[fx] = +cur.toFixed(3);
                this.effectEnabled[fx] = cur > 0.005;
                if (cur > 0.005) {
                    this.effectUserDisabled[fx] = false;
                }
            });

            // 2. Slew Master AI Warp Strength
            this.aiWarpStrength = +(tr.startStrength + (tr.targetStrength - tr.startStrength) * ease).toFixed(3);

            // 3. Slew Glitch Speed & Master Opacity
            this.glitchSpeed = +(tr.startSpeed + (tr.targetSpeed - tr.startSpeed) * ease).toFixed(3);
            this.masterOpacity = +(tr.startOpacity + (tr.targetOpacity - tr.startOpacity) * ease).toFixed(3);

            // 4. Midpoint switch for discrete modes (warp mode, ghost profile, vsync method)
            if (p >= 0.5 && !tr.modeSwitched) {
                tr.modeSwitched = true;
                if (tr.targetWarpMode) this.setWarpMode(tr.targetWarpMode);
                this.applyPresetAutomationProfile(tr.sourcePreset);
                tr.profileApplied = true;
                if (tr.targetGhostMode) this.setGhostMode(tr.targetGhostMode, tr.targetGhostLevel);
                if (!this.vsyncLocked && tr.targetVsyncMode) {
                    this.setVsyncMode(tr.targetVsyncMode, tr.targetVsyncLevel);
                }
            }

            // 5. Complete Transition
            if (p >= 1.0) {
                tr.active = false;
                // Lock exact target values
                this.effectNames.forEach(fx => {
                    const finalVal = tr.targetAlphas[fx] !== undefined ? tr.targetAlphas[fx] : 0;
                    this.effectAlphas[fx] = finalVal;
                    this.effectEnabled[fx] = finalVal > 0.005;
                });
                this.aiWarpStrength = tr.targetStrength;
                this.glitchSpeed = tr.targetSpeed;
                this.masterOpacity = tr.targetOpacity;
                if (tr.targetWarpMode) this.setWarpMode(tr.targetWarpMode);
            }

            // Notify UI so sliders and dials glide smoothly in real-time
            if (typeof this.onAutomationChange === 'function') {
                this.onAutomationChange();
            }
        }

        applyPreset(preset, smooth = false, durationMs = 1500) {
            if (!preset) return;
            if (smooth) {
                this.transitionToPreset(preset, durationMs);
                return;
            }
            if (this.presetTransition) this.presetTransition.active = false;
            if (preset.alphas) {
                const resolvedAlphas = this.resolvePresetAlphas(preset);
                this.effectNames.forEach(fx => {
                    const val = resolvedAlphas[fx] !== undefined ? resolvedAlphas[fx] : 0;
                    this.effectAlphas[fx] = val;
                    this.effectUserLevel[fx] = 1.0;
                    this.effectEnabled[fx] = val > 0.005;
                    if (val > 0.005) this.effectUserDisabled[fx] = false;
                });
            }
            this.applyPresetAutomationProfile(preset);
            if (preset.masterOpacity !== undefined) this.masterOpacity = Math.max(0.70, preset.masterOpacity);
            if (preset.ghostMode !== undefined) {
                this.setGhostMode(preset.ghostMode, preset.ghostLevel !== undefined ? preset.ghostLevel : 0.65);
            }
            if (!this.vsyncLocked && preset.vsyncMode !== undefined) {
                if (this.r3GhostVsync && preset.vsyncLevels) {
                    ['ON', 'GHOST_OFF', 'FULL'].forEach(mode => {
                        if (preset.vsyncLevels[mode] !== undefined) this.r3GhostVsync.setVsyncMode(mode, preset.vsyncLevels[mode]);
                    });
                }
                const vl = preset.vsyncLevels ? preset.vsyncLevels[preset.vsyncMode] : 0.55;
                this.setVsyncMode(preset.vsyncMode, vl);
            }
            // Ensure AI Warp remains dynamically active
            this.aiWarpActive = true;
            if (preset.warpStrength !== undefined) {
                this.aiWarpStrength = preset.warpStrength;
            } else if (this.aiWarpStrength <= 0.15) {
                this.aiWarpStrength = 0.45;
            }

            if (preset.warpMode) {
                this.setWarpMode(preset.warpMode);
            } else {
                const modes = this.aiWarpModes;
                this.setWarpMode(modes[Math.floor(Math.random() * modes.length)]);
            }

            if (preset.masterControls) {
                if (preset.masterControls.continualSpeed !== undefined) this.glitchSpeed = preset.masterControls.continualSpeed;
                else if (preset.masterControls.speed !== undefined) this.glitchSpeed = preset.masterControls.speed;
                if (preset.masterControls.motionScale !== undefined) this.motionScale = preset.masterControls.motionScale;
                if (preset.masterControls.boardEnergy !== undefined) this.boardEnergy = preset.masterControls.boardEnergy;
            }
        }

        /* ── GENERATIVE CYBER BACKDROP ────────────────────────────────────────── */
        renderGenerativeSource(now) {
            const ctx = this.genCtx;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const t = now * 0.001 * this.glitchSpeed;
            const audio = this.audioDrive;
            const bass = audio.bass || 0;
            const treble = audio.treble || 0;

            ctx.fillStyle = '#020307';
            ctx.fillRect(0, 0, w, h);

            // 1. Perspective Grid
            const horizon = h * 0.55;
            const gridCols = 24;
            const gridSpacing = w / gridCols;
            ctx.save();
            ctx.strokeStyle = `rgba(0, 255, 170, ${0.12 + bass * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let c = -gridCols; c <= gridCols * 2; c++) {
                const x0 = c * gridSpacing;
                ctx.moveTo(w * 0.5, horizon);
                ctx.lineTo(x0, h);
            }
            const numHoriz = 14;
            for (let i = 0; i < numHoriz; i++) {
                const yNorm = Math.pow(i / numHoriz, 2.2);
                const y = horizon + yNorm * (h - horizon);
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
            }
            ctx.stroke();

            // 2. Neon Horizon Glow
            const horizGrad = ctx.createLinearGradient(0, horizon - 80, 0, horizon + 80);
            horizGrad.addColorStop(0, 'rgba(0,0,0,0)');
            horizGrad.addColorStop(0.5, `rgba(255, 0, 128, ${0.18 + bass * 0.28})`);
            horizGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = horizGrad;
            ctx.fillRect(0, horizon - 80, w, 160);

            // 3. Central 3D Revolving Rings
            const cx = w * 0.5;
            const cy = horizon * 0.85;
            const radius = Math.min(w, h) * (0.16 + bass * 0.08);

            ctx.strokeStyle = `rgba(0, 229, 255, ${0.45 + treble * 0.4})`;
            ctx.lineWidth = 1.5;
            const rings = 8;
            for (let r = 0; r < rings; r++) {
                const angle = t * 0.8 + (r * Math.PI) / rings;
                const rx = radius * Math.cos(angle);
                const ry = radius * 0.45;
                ctx.beginPath();
                ctx.ellipse(cx, cy, Math.abs(rx) + 2, ry, angle * 0.3, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Audio reactive concentric burst rings
            if (bass > 0.25) {
                const bRadius = radius * (1.2 + bass * 1.5);
                ctx.beginPath();
                ctx.arc(cx, cy, bRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 183, 3, ${(bass - 0.2) * 0.6})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // 4. Cyber OSD Coordinates
            ctx.fillStyle = 'rgba(0, 255, 170, 0.7)';
            ctx.font = '11px monospace';
            ctx.fillText(`WARP//SYS: ${this.aiWarpMode.toUpperCase()} | FPS: 60 | BPM: 124`, 16, 24);
            ctx.fillText(`PALETTE//HUE: ${this.videoPalette.hue.toFixed(0)}° | DRIVE: ${(audio.drive || 0).toFixed(2)}`, 16, 40);
            ctx.fillText(`LOC: 52°22'N 4°53'E // IMORTALIMP.NL`, w - 240, 24);

            ctx.restore();
        }

        /* ── THREE.JS TECH ARTIST RAYMARCHER ──────────────────────────────────── */
        initTechArtistShader() {
            if (this.techArtistShader) return this.techArtistShader;
            if (!window.THREE) return null;
            try {
                const scene = new THREE.Scene();
                const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
                renderer.setSize(this.canvas.width, this.canvas.height, false);

                const uniforms = {
                    time: { value: 0 },
                    resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
                    mouse: { value: new THREE.Vector2(0.5, 0.5) },
                    velocity: { value: new THREE.Vector2(0, 0) },
                    depthScale: { value: 0.62 },
                    sizeScale: { value: 1.0 }
                };

                const material = new THREE.ShaderMaterial({
                    uniforms,
                    transparent: true,
                    vertexShader: `
                        varying vec2 vUv;
                        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
                    `,
                    fragmentShader: `
                        uniform float time;
                        uniform vec2 resolution;
                        uniform vec2 mouse;
                        uniform vec2 velocity;
                        uniform float depthScale;
                        uniform float sizeScale;
                        varying vec2 vUv;
                        mat2 rot(float a) { float s = sin(a); float c = cos(a); return mat2(c, -s, s, c); }
                        void main() {
                            vec2 FC = gl_FragCoord.xy;
                            vec2 r = resolution;
                            float t = time;
                            vec4 o = vec4(0.0);
                            vec2 uv = (FC * 2.0 - r.xy) / r.y;
                            vec2 m = (mouse - 0.5);
                            float vmag = length(velocity);
                            vec2 warp = m * 0.35 + velocity * 0.4;
                            uv += warp * (0.6 + 0.4 * sin(t * 0.6));
                            uv *= (1.0 / max(0.2, sizeScale));
                            vec3 rayDir = normalize(vec3(uv, 1.0 + vmag * 0.8));
                            float steps = 14.0 + depthScale * 8.0;
                            for(float i = 0.0; i < 22.0; i++) {
                                if (i > steps) break;
                                float z = i * 0.5 + 0.1;
                                vec3 p = z * rayDir;
                                vec2 mouseOffset = m * (1.4 + vmag * 2.0);
                                p.xz *= rot(t * 0.2 + mouseOffset.x + velocity.x * 2.0);
                                p.yz *= rot(t * 0.15 + mouseOffset.y + velocity.y * 2.0);
                                p.xy *= rot(sin(t * 0.35 + z * 0.6 + vmag * 5.0) * 0.25);
                                vec3 a = p;
                                float d;
                                for(d = 1.0; d < 4.0; d += 1.0) a -= sin(a * d + t + i * 0.1).yzx / (d * 0.8);
                                vec3 q = abs(a);
                                float mx = max(max(q.x, q.y), q.z);
                                float s = a.z + a.y - t;
                                d = abs(2.0 - mx) + abs(cos(s)) / 7.0;
                                float z_col = z + d;
                                float hueWarp = (m.x - m.y) * 2.0 + vmag * 3.0;
                                vec4 colorPhase = vec4(0.0 + hueWarp, 2.0 + mouse.y * 2.5, 4.0 - mouse.y * 2.5, 0.0);
                                o += (cos(s - z_col + colorPhase) + 1.0) / (d * (0.5 + vmag * 0.6) + 0.01);
                            }
                            o = o / steps;
                            o = o / (1.0 + o);
                            o = smoothstep(0.12, 0.88, o);
                            gl_FragColor = vec4(o.rgb, 0.95);
                        }
                    `
                });

                scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
                this.techArtistShader = { renderer, scene, camera, uniforms, canvas: renderer.domElement };
                return this.techArtistShader;
            } catch(e) {
                console.warn('Three.js shader init error, using procedural fallback:', e);
                return null;
            }
        }

        /* ── 17 GLITCH EFFECT FACTORIES ────────────────────────────────────────── */
        buildFactories() {
            const self = this;
            return {
                // 1. ASCII Art (Multi-script Typesets)
                asciiArt: (getStrength) => {
                    const ge = window.GlitchEngine;
                    let glyphList = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+-=[]{}<>?/|░▒▓█▄▀■□△▲▽▼◆◇○●';
                    if (ge && ge.TYPESETS && ge.TYPESETS.katakana) {
                        glyphList += ge.TYPESETS.katakana.chars + ge.TYPESETS.symbols.chars;
                    }
                    const glyphs = Array.from(glyphList);
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('ASCII');
                        const dp = self.depthFor('ASCII');
                        const w = self.canvas.width, h = self.canvas.height;
                        const cellSize = Math.max(8, Math.round(18 * sz));
                        const cols = Math.floor(w / cellSize);
                        const rows = Math.floor(h / cellSize);
                        gctx.save();
                        gctx.fillStyle = `rgba(0, 255, 170, ${clamp01(0.70 * s * dp * self.masterOpacity)})`;
                        gctx.font = `${Math.round(cellSize * 0.85)}px monospace`;
                        const skip = Math.max(1, Math.round(3 - dp * 2));
                        for (let r = 0; r < rows; r += skip) {
                            for (let c = 0; c < cols; c += skip) {
                                if (Math.random() < s * (0.45 + dp * 0.55)) {
                                    const char = glyphs[(Math.random() * glyphs.length) | 0];
                                    gctx.fillText(char, c * cellSize, r * cellSize);
                                }
                            }
                        }
                        gctx.restore();
                    };
                },

                // 2. Font Burn (Phosphor Heat Degradation)
                fontBurn: (getStrength) => {
                    const phrases = [
                        'GL1TCH//BURN', 'F34R.COMM4', 'GHOST IN THE SHELL', 'DATA//OVERFLOW',
                        'IMMORTAL IMP', 'SIGNAL LOST', 'NEON REBIRTH', 'C0DEX', 'VOIDLOOP',
                        'D1G1T4L R3B1RTH', 'MEMORY LEAK', 'PHOSPHOR DREAM', 'GHOST-KEY'
                    ];
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Font Burn');
                        const dp = self.depthFor('Font Burn');
                        const w = self.canvas.width, h = self.canvas.height;
                        gctx.save();
                        gctx.globalCompositeOperation = 'screen';
                        gctx.fillStyle = `rgba(255, 120, 20, ${0.55 * s * dp * self.masterOpacity})`;
                        gctx.font = `bold ${Math.round(36 * sz)}px monospace`;
                        const t = performance.now() * 0.002;
                        const count = Math.max(2, Math.round(6 * dp));
                        for (let i = 0; i < count; i++) {
                            const x = (Math.sin(t + i) * 0.4 + 0.5) * w;
                            const y = ((t * 80 + i * (140 * sz)) % h);
                            const phrase = phrases[i % phrases.length];
                            gctx.fillText(phrase, x - 180 * sz, y);
                        }
                        gctx.restore();
                    };
                },

                // 3. Neon Gradient (Additive Ribbon Flow)
                neonGradient: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Neon Grad');
                        const dp = self.depthFor('Neon Grad');
                        const w = self.canvas.width, h = self.canvas.height;
                        const t = performance.now() * 0.001 * (0.8 + sz * 0.4);
                        gctx.save();
                        gctx.globalCompositeOperation = 'screen';
                        const grad = gctx.createLinearGradient(0, 0, w, h);
                        const h1 = (t * 26) % 360;
                        const h2 = (h1 + 120 + sz * 30) % 360;
                        grad.addColorStop(0, `hsla(${h1}, 100%, 50%, ${0.45 * s * dp * self.masterOpacity})`);
                        grad.addColorStop(1, `hsla(${h2}, 100%, 50%, ${0.45 * s * dp * self.masterOpacity})`);
                        gctx.fillStyle = grad;
                        gctx.fillRect(0, 0, w, h);
                        gctx.restore();
                    };
                },

                // 4. Scanlines (CRT Phosphor Pitch)
                scanlines: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Scanlines');
                        const dp = self.depthFor('Scanlines');
                        const w = self.canvas.width, h = self.canvas.height;
                        const pitch = Math.max(1, Math.round(2 * sz));
                        gctx.save();
                        gctx.fillStyle = `rgba(0, 0, 0, ${clamp01(0.65 * s * dp * self.masterOpacity)})`;
                        for (let y = 0; y < h; y += pitch * 2) {
                            gctx.fillRect(0, y, w, pitch);
                        }
                        gctx.restore();
                    };
                },

                // 5. VHS Glitch (Head-Switching Flutter & Jitter)
                vhsGlitch: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('VHS Glitch');
                        const dp = self.depthFor('VHS Glitch');
                        const w = self.canvas.width, h = self.canvas.height;
                        // Copy to offscreen work canvas safely
                        self.workCanvas.width = w; self.workCanvas.height = h;
                        self.workCtx.clearRect(0, 0, w, h);
                        self.workCtx.drawImage(self.canvas, 0, 0);

                        gctx.save();
                        const slices = Math.round((8 + s * 14) * dp);
                        for (let i = 0; i < slices; i++) {
                            const y = Math.random() * h;
                            const sh = Math.max(2, (4 + Math.random() * 20) * sz);
                            const dx = (Math.random() - 0.5) * 55 * s * sz;
                            try {
                                gctx.drawImage(self.workCanvas, 0, y, w, sh, dx, y, w, sh);
                            } catch(e) {}
                        }
                        gctx.restore();
                    };
                },

                // 6. Data Bands (Tape Tracking Displacements)
                dataBands: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Data Bands');
                        const dp = self.depthFor('Data Bands');
                        const w = self.canvas.width, h = self.canvas.height;
                        gctx.save();
                        const bands = Math.round((4 + s * 8) * dp);
                        for (let i = 0; i < bands; i++) {
                            const y = Math.random() * h;
                            const bh = Math.max(4, (12 + Math.random() * 45) * sz);
                            gctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, ${0.45 * s * dp})`;
                            gctx.fillRect(0, y, w, bh);
                        }
                        gctx.restore();
                    };
                },

                // 7. Bright Flash (High-Gamma Flare)
                brightFlash: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.02) return;
                        const dp = self.depthFor('Flash');
                        const w = self.canvas.width, h = self.canvas.height;
                        gctx.save();
                        gctx.globalCompositeOperation = 'lighter';
                        gctx.fillStyle = `rgba(255, 255, 255, ${clamp01(0.70 * s * dp * self.masterOpacity)})`;
                        gctx.fillRect(0, 0, w, h);
                        gctx.restore();
                    };
                },

                // 8. HSL Rainbow (3-Pass Confluent Full-Spectrum Prism Wash)
                hslRainbow: (getStrength) => {
                    let spinAcc = 0;
                    let lastT = performance.now();
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('HSL Rainbow');
                        const dp = self.depthFor('HSL Rainbow');
                        const w = self.canvas.width, h = self.canvas.height;
                        const wallNow = performance.now();
                        const dt = (wallNow - lastT) * 0.001;
                        lastT = wallNow;

                        const audio = self.audioDrive;
                        const treble = audio.treble || 0;
                        const bass = audio.bass || 0;

                        // Continuous prism spin accumulator
                        spinAcc = (spinAcc + dt * 45 * (1.0 + sz * 0.6) + treble * 3.5) % 360;

                        gctx.save();
                        const alpha = clamp01(0.75 * s * dp * self.masterOpacity);

                        // Pass 1: Diagonal Full-Spectrum Hue Prism Wash (Screen Blend)
                        const angle = (wallNow * 0.0004 * sz) % (Math.PI * 2);
                        const x1 = w * 0.5 + Math.cos(angle) * w * 0.6;
                        const y1 = h * 0.5 + Math.sin(angle) * h * 0.6;
                        const x2 = w * 0.5 - Math.cos(angle) * w * 0.6;
                        const y2 = h * 0.5 - Math.sin(angle) * h * 0.6;
                        const gradH = gctx.createLinearGradient(x1, y1, x2, y2);
                        const stops = 10;
                        for (let i = 0; i <= stops; i++) {
                            const stopHue = (spinAcc + (i / stops) * 360) % 360;
                            gradH.addColorStop(i / stops, `hsla(${stopHue}, 100%, 55%, 0.45)`);
                        }
                        gctx.globalCompositeOperation = 'screen';
                        gctx.globalAlpha = alpha;
                        gctx.fillStyle = gradH;
                        gctx.fillRect(0, 0, w, h);

                        // Pass 2: Radial Chroma Dispersion Wash (Overlay Blend)
                        const cx = w * 0.5, cy = h * 0.5;
                        const maxR = Math.hypot(w, h) * 0.55;
                        const gradR = gctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
                        gradR.addColorStop(0, `hsla(${(spinAcc + 180) % 360}, 100%, 60%, ${0.50 * alpha})`);
                        gradR.addColorStop(0.5, `hsla(${(spinAcc + 90) % 360}, 100%, 50%, ${0.35 * alpha})`);
                        gradR.addColorStop(1, `hsla(${spinAcc % 360}, 100%, 45%, 0)`);
                        gctx.globalCompositeOperation = 'overlay';
                        gctx.fillStyle = gradR;
                        gctx.fillRect(0, 0, w, h);

                        // Pass 3: Cross-Axis Color Vibrance Walk (Color Blend)
                        const gradC = gctx.createLinearGradient(w, 0, 0, h);
                        for (let i = 0; i <= 6; i++) {
                            const chHue = (spinAcc * 1.5 + i * 60) % 360;
                            gradC.addColorStop(i / 6, `hsl(${chHue}, 100%, 50%)`);
                        }
                        gctx.globalCompositeOperation = 'color';
                        gctx.globalAlpha = alpha * 0.55;
                        gctx.fillStyle = gradC;
                        gctx.fillRect(0, 0, w, h);

                        gctx.restore();
                    };
                },

                // 9. Strobe (Safety-Capped Strobe Burst)
                strobe: (getStrength) => {
                    let frame = 0;
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.02) return;
                        const sz = self.sizeFor('Strobe');
                        const dp = self.depthFor('Strobe');
                        frame++;
                        const interval = Math.max(2, Math.round(5 / sz));
                        if (frame % interval !== 0) return;
                        const w = self.canvas.width, h = self.canvas.height;
                        gctx.save();
                        gctx.globalCompositeOperation = 'difference';
                        gctx.fillStyle = `rgba(255, 255, 255, ${clamp01(0.80 * s * dp * self.masterOpacity)})`;
                        gctx.fillRect(0, 0, w, h);
                        gctx.restore();
                    };
                },

                // 10. Gemini Bomb (Chromatic Shockwave Particulates)
                geminiBomb: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Gemini Bomb');
                        const dp = self.depthFor('Gemini Bomb');
                        const w = self.canvas.width, h = self.canvas.height;
                        const cx = w * 0.5, cy = h * 0.5;
                        gctx.save();
                        gctx.globalCompositeOperation = 'screen';
                        const count = Math.round((40 + s * 80) * dp);
                        for (let i = 0; i < count; i++) {
                            const ang = Math.random() * Math.PI * 2;
                            const dist = Math.random() * Math.min(w, h) * 0.5 * s * sz;
                            const px = cx + Math.cos(ang) * dist;
                            const py = cy + Math.sin(ang) * dist;
                            const pr = Math.max(1, (2 + Math.random() * 8) * sz);
                            gctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 60%, ${0.65 * s * dp})`;
                            gctx.fillRect(px, py, pr, pr);
                        }
                        gctx.restore();
                    };
                },

                // 11. Data Bomb (Macroblock Corruptions)
                dataBomb: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Data Bomb');
                        const dp = self.depthFor('Data Bomb');
                        const w = self.canvas.width, h = self.canvas.height;
                        self.workCanvas.width = w; self.workCanvas.height = h;
                        self.workCtx.clearRect(0, 0, w, h);
                        self.workCtx.drawImage(self.canvas, 0, 0);

                        gctx.save();
                        const blocks = Math.round((12 + s * 35) * dp);
                        for (let i = 0; i < blocks; i++) {
                            const bw = Math.max(10, (30 + Math.random() * 90) * sz);
                            const bh = Math.max(10, (20 + Math.random() * 60) * sz);
                            const bx = Math.random() * (w - bw);
                            const by = Math.random() * (h - bh);
                            const sx = Math.random() * (w - bw);
                            const sy = Math.random() * (h - bh);
                            try {
                                gctx.drawImage(self.workCanvas, sx, sy, bw, bh, bx, by, bw, bh);
                            } catch(e) {}
                        }
                        gctx.restore();
                    };
                },

                // 12. Ink Glyphs (Organic Calligraphy Fluid)
                inkGlyphs: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Ink Glyphs');
                        const dp = self.depthFor('Ink Glyphs');
                        const w = self.canvas.width, h = self.canvas.height;
                        gctx.save();
                        gctx.fillStyle = `rgba(8, 4, 18, ${clamp01(0.60 * s * dp * self.masterOpacity)})`;
                        const droplets = Math.round((8 + s * 16) * dp);
                        for (let i = 0; i < droplets; i++) {
                            const x = Math.random() * w;
                            const y = Math.random() * h;
                            const r = Math.max(4, (15 + Math.random() * 45) * sz);
                            gctx.beginPath();
                            gctx.arc(x, y, r, 0, Math.PI * 2);
                            gctx.fill();
                        }
                        gctx.restore();
                    };
                },

                // 13. Matrix ASCII (Digital Rain Streams)
                matrixAscii: (getStrength) => {
                    const ge = window.GlitchEngine;
                    let katakana = 'ｱｲｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ1234567890';
                    if (ge && ge.TYPESETS && ge.TYPESETS.katakana) katakana = ge.TYPESETS.katakana.chars;
                    let cols = [];
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Matrix ASCII');
                        const dp = self.depthFor('Matrix ASCII');
                        const w = self.canvas.width, h = self.canvas.height;
                        const colW = Math.max(10, Math.round(16 * sz));
                        const colCount = Math.floor(w / colW);
                        if (cols.length !== colCount) {
                            cols = new Array(colCount).fill(0).map(() => Math.floor(Math.random() * -60));
                        }
                        gctx.save();
                        gctx.font = `${colW}px monospace`;
                        const speed = Math.max(1, Math.round(1 + dp * 2));
                        for (let c = 0; c < colCount; c++) {
                            cols[c] += speed;
                            if (cols[c] * colW > h && Math.random() > 0.96) cols[c] = 0;
                            const y = cols[c] * colW;
                            const char = katakana[(Math.random() * katakana.length) | 0];
                            gctx.fillStyle = '#ffffff';
                            gctx.fillText(char, c * colW, y);
                            gctx.fillStyle = `rgba(0, 255, 120, ${clamp01(0.90 * s * dp * self.masterOpacity)})`;
                            gctx.fillText(char, c * colW, y - colW);
                        }
                        gctx.restore();
                    };
                },

                // 14. Matrix Chord (Polyphonic Harmonics)
                matrixChord: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Matrix Chord');
                        const dp = self.depthFor('Matrix Chord');
                        const w = self.canvas.width, h = self.canvas.height;
                        gctx.save();
                        gctx.globalCompositeOperation = 'screen';
                        gctx.fillStyle = `rgba(0, 229, 255, ${clamp01(0.60 * s * dp * self.masterOpacity)})`;
                        gctx.font = `${Math.round(20 * sz)}px monospace`;
                        const chords = ['[GHOST::01]', '[CHORD::R2]', '[NET::VOID]', '[WARP::OMNI]'];
                        for (let i = 0; i < chords.length; i++) {
                            const x = (i * (w / chords.length)) + 20;
                            const y = (performance.now() * 0.06 + i * (90 * sz)) % h;
                            gctx.fillText(chords[i], x, y);
                        }
                        gctx.restore();
                    };
                },

                // 15. B&W Invert (Landmarks 0, 50, 75, 100 & Contrast)
                bwInvert: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const dp = self.depthFor('B&W Invert');
                        const w = self.canvas.width, h = self.canvas.height;
                        gctx.save();
                        gctx.globalCompositeOperation = 'difference';
                        const level = s < 0.25 ? s * 2 : (s < 0.65 ? 0.5 : (s < 0.88 ? 0.75 : 1.0));
                        gctx.fillStyle = `rgba(255, 255, 255, ${clamp01(level * dp * self.masterOpacity)})`;
                        gctx.fillRect(0, 0, w, h);
                        gctx.restore();
                    };
                },

                // 16. Hue/Color Cycle (Continuous Harmonic Rotation)
                hueColorCycle: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Hue/Color Cycle');
                        const dp = self.depthFor('Hue/Color Cycle');
                        const w = self.canvas.width, h = self.canvas.height;
                        const t = performance.now() * 0.05 * sz;
                        gctx.save();
                        gctx.globalCompositeOperation = 'hue';
                        gctx.fillStyle = `hsla(${t % 360}, 100%, 50%, ${clamp01(0.75 * s * dp * self.masterOpacity)})`;
                        gctx.fillRect(0, 0, w, h);
                        gctx.restore();
                    };
                },

                // 17. Tech Artist (Three.js WebGL Raymarcher with 2D Fallback)
                techArtist: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Tech Artist');
                        const dp = self.depthFor('Tech Artist');

                        const shader = self.initTechArtistShader();
                        if (shader && shader.renderer) {
                            shader.uniforms.time.value = performance.now() * 0.001;
                            shader.uniforms.mouse.value.set(self.techArtistMouse.x, self.techArtistMouse.y);
                            shader.uniforms.velocity.value.set(self.techArtistVelocity.x, self.techArtistVelocity.y);
                            shader.uniforms.sizeScale.value = sz;
                            shader.uniforms.depthScale.value = dp;
                            shader.renderer.render(shader.scene, shader.camera);

                            gctx.save();
                            gctx.globalCompositeOperation = 'screen';
                            gctx.globalAlpha = clamp01(0.85 * s * dp * self.masterOpacity);
                            gctx.drawImage(shader.canvas, 0, 0);
                            gctx.restore();
                        } else {
                            const w = self.canvas.width, h = self.canvas.height;
                            const t = performance.now() * 0.001;
                            gctx.save();
                            gctx.globalCompositeOperation = 'screen';
                            const cx = w * self.techArtistMouse.x;
                            const cy = h * (1.0 - self.techArtistMouse.y);
                            const rays = Math.round(18 * sz);
                            for (let i = 0; i < rays; i++) {
                                const a = (i / rays) * Math.PI * 2 + t * 0.4;
                                const len = Math.min(w, h) * (0.3 + dp * 0.4);
                                gctx.strokeStyle = `hsla(${(i * 20 + t * 40) % 360}, 100%, 55%, ${0.45 * s * dp})`;
                                gctx.lineWidth = Math.max(1, 3 * sz);
                                gctx.beginPath();
                                gctx.moveTo(cx, cy);
                                gctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
                                gctx.stroke();
                            }
                            gctx.restore();
                        }
                    };
                }
            };
        }

        initEffectRunners() {
            this.activeEffects = [];
            const mapping = [
                { name: 'Neon Grad', key: 'neonGradient' },
                { name: 'Scanlines', key: 'scanlines' },
                { name: 'Data Bands', key: 'dataBands' },
                { name: 'Flash', key: 'brightFlash' },
                { name: 'HSL Rainbow', key: 'hslRainbow' },
                { name: 'ASCII', key: 'asciiArt' },
                { name: 'Font Burn', key: 'fontBurn' },
                { name: 'Strobe', key: 'strobe' },
                { name: 'Gemini Bomb', key: 'geminiBomb' },
                { name: 'Tech Artist', key: 'techArtist' },
                { name: 'VHS Glitch', key: 'vhsGlitch' },
                { name: 'Data Bomb', key: 'dataBomb' },
                { name: 'Ink Glyphs', key: 'inkGlyphs' },
                { name: 'Matrix ASCII', key: 'matrixAscii' },
                { name: 'Matrix Chord', key: 'matrixChord' },
                { name: 'B&W Invert', key: 'bwInvert' },
                { name: 'Hue/Color Cycle', key: 'hueColorCycle' }
            ];

            mapping.forEach(m => {
                if (this.factories[m.key]) {
                    const runner = this.factories[m.key](() => this.liveAlpha(m.name));
                    this.activeEffects.push(runner);
                }
            });
        }

        /* Revision 3 factory runners live in their own isolated bank. Their exact
           factory source is loaded before this engine, and names are suffixed so
           these rails cannot overwrite or retune the original 17 voices. */
        initGC3EffectRunners() {
            if (!window.GC3FactoryBank || typeof window.GC3FactoryBank.createRunners !== 'function') return;
            try {
                const runners = window.GC3FactoryBank.createRunners(this);
                if (Array.isArray(runners)) this.activeEffects.push(...runners);
            } catch (error) {
                console.warn('GC#(3) factory bank could not initialize:', error);
            }
        }

        /* ── R3 GHOST PROTOCOL + V-SYNC v11 (CANVAS ONLY) ──────────────────── */
        renderGhostProtocol(now, baseSnapshot = null) {
            if (this.r3GhostVsync) this.r3GhostVsync.renderGhost(now, baseSnapshot);
        }

        renderVsync(now, baseSnapshot = null) {
            if (this.r3GhostVsync) this.r3GhostVsync.renderVsync(now, baseSnapshot);
        }

        /* ── CANVAS AI WARP SLICER (12 ALGORITHMIC MODES) ────────────────────── */
        renderAiWarp(now) {
            if (!this.aiWarpActive || this.aiWarpStrength <= 0.01) return;
            const w = this.canvas.width, h = this.canvas.height;
            if (!w || !h) return;

            const s = this.aiWarpStrength * this.masterOpacity * this.getWarpBlendProfile().canvas;
            const t = now * 0.001 * this.glitchSpeed;
            const gctx = this.gctx;
            const mode = this.aiWarpMode;
            const audio = this.audioDrive;
            const bass = audio.bass || 0;
            const mid = audio.mid || 0;
            const treble = audio.treble || 0;

            this.workCanvas.width = w; this.workCanvas.height = h;
            this.workCtx.clearRect(0, 0, w, h);
            this.workCtx.drawImage(this.canvas, 0, 0);

            gctx.save();
            gctx.clearRect(0, 0, w, h);

            // 1. LIQUID: Multi-frequency bidirectional harmonic fluid waves
            if (mode === 'liquid') {
                const cols = 22 + Math.floor(s * 18);
                const colW = Math.ceil(w / cols);
                const ampX = (18 + s * 65 + bass * 40);
                const ampY = (10 + s * 35 + mid * 25);
                for (let c = 0; c < cols; c++) {
                    const sx = c * colW;
                    const sw = Math.min(colW, w - sx);
                    if (sw <= 0) continue;
                    const waveX = Math.sin(t * 3.4 + c * 0.45) * ampX + Math.cos(t * 1.7 + c * 0.22) * (ampX * 0.4);
                    const waveY = Math.sin(t * 2.8 + c * 0.35) * ampY;
                    try {
                        gctx.drawImage(this.workCanvas, sx, 0, sw, h, sx + waveX, waveY, sw, h);
                    } catch(e) {}
                }
            }
            // 2. PRISM: Multi-angle crystal refraction & chromatic dispersion
            else if (mode === 'prism') {
                const slices = 20 + Math.floor(s * 16);
                const sliceH = Math.ceil(h / slices);
                const disp = (12 + s * 55 + treble * 35);
                for (let i = 0; i < slices; i++) {
                    const sy = i * sliceH;
                    const sh = Math.min(sliceH, h - sy);
                    if (sh <= 0) continue;
                    const dx = Math.sin(t * 4.0 + i * 0.5) * disp;
                    try {
                        gctx.drawImage(this.workCanvas, 0, sy, w, sh, dx, sy, w, sh);
                    } catch(e) {}
                }
                gctx.globalCompositeOperation = 'screen';
                gctx.globalAlpha = 0.35 * s;
                try {
                    gctx.drawImage(this.workCanvas, -disp * 1.5, -disp * 0.5);
                    gctx.drawImage(this.workCanvas, disp * 1.5, disp * 0.5);
                } catch(e) {}
            }
            // 3. BREATHE: Organic radial expansion & spherical contraction
            else if (mode === 'breathe') {
                const scale = 1.0 + Math.sin(t * 2.5) * (0.07 + s * 0.12 + bass * 0.14);
                gctx.save();
                gctx.translate(w / 2, h / 2);
                gctx.scale(scale, scale);
                gctx.drawImage(this.workCanvas, -w / 2, -h / 2);
                if (bass > 0.3) {
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = (bass - 0.2) * 0.5 * s;
                    const bScale = 1.0 + bass * 0.15;
                    gctx.scale(bScale, bScale);
                    gctx.drawImage(this.workCanvas, -w / 2, -h / 2);
                }
                gctx.restore();
            }
            // 4. FOLD: Origami accordion dimensional pleating with crease shading
            else if (mode === 'fold') {
                const pleats = 28 + Math.floor(s * 14);
                const pw = Math.ceil(w / pleats);
                const amp = (16 + s * 50 + bass * 30);
                for (let p = 0; p < pleats; p++) {
                    const sx = p * pw;
                    const sw = Math.min(pw, w - sx);
                    if (sw <= 0) continue;
                    const isEven = p % 2 === 0;
                    const offset = (isEven ? 1.0 : -1.0) * amp * (0.6 + 0.4 * Math.sin(t * 3.0 + p * 0.2));
                    try {
                        gctx.drawImage(this.workCanvas, sx, 0, sw, h, sx + offset, 0, sw, h);
                        gctx.fillStyle = isEven ? `rgba(0, 0, 0, ${0.28 * s})` : `rgba(255, 255, 255, ${0.16 * s})`;
                        gctx.fillRect(sx + offset, 0, sw, h);
                    } catch(e) {}
                }
            }
            // 5. AURORA: Sinuous undulating neon ribbon curtains
            else if (mode === 'aurora') {
                const ribbons = 16 + Math.floor(s * 12);
                const rw = Math.ceil(w / ribbons);
                const drift = Math.sin(t * 1.5) * 40 * s;
                for (let r = 0; r < ribbons; r++) {
                    const sx = r * rw;
                    const sw = Math.min(rw, w - sx);
                    if (sw <= 0) continue;
                    const wave = Math.sin(t * 2.2 + r * 0.6) * (20 + s * 45) + drift;
                    try {
                        gctx.drawImage(this.workCanvas, sx, 0, sw, h, sx + wave, 0, sw, h);
                    } catch(e) {}
                }
                gctx.globalCompositeOperation = 'screen';
                gctx.globalAlpha = 0.25 * s;
                const auroraGrad = gctx.createLinearGradient(0, 0, w, h);
                auroraGrad.addColorStop(0, 'rgba(0, 255, 160, 0.4)');
                auroraGrad.addColorStop(0.5, 'rgba(0, 220, 255, 0.3)');
                auroraGrad.addColorStop(1, 'rgba(180, 20, 255, 0.45)');
                gctx.fillStyle = auroraGrad;
                gctx.fillRect(0, 0, w, h);
            }
            // 6. VORTEX: Centrifugal spiral black hole warp
            else if (mode === 'vortex') {
                const rings = 20 + Math.floor(s * 16);
                const maxR = Math.min(w, h) * 0.55;
                const ringW = maxR / rings;
                const cx = w / 2, cy = h / 2;
                gctx.drawImage(this.workCanvas, 0, 0);

                for (let i = rings - 1; i >= 1; i--) {
                    const r = i * ringW;
                    const spinAngle = (1.0 - (r / maxR)) * (1.2 + s * 2.2) * Math.sin(t * 2.5);
                    gctx.save();
                    gctx.beginPath();
                    gctx.arc(cx, cy, r, 0, Math.PI * 2);
                    gctx.clip();
                    gctx.translate(cx, cy);
                    gctx.rotate(spinAngle);
                    gctx.drawImage(this.workCanvas, -cx, -cy);
                    gctx.restore();
                }
            }
            // 7. CYBERGRID: Digital matrix quantized isometric block shear
            else if (mode === 'cybergrid') {
                const gridX = 12, gridY = 8;
                const bw = Math.ceil(w / gridX), bh = Math.ceil(h / gridY);
                const amp = (12 + s * 40 + mid * 25);
                for (let gx = 0; gx < gridX; gx++) {
                    for (let gy = 0; gy < gridY; gy++) {
                        const sx = gx * bw, sy = gy * bh;
                        const sw = Math.min(bw, w - sx), sh = Math.min(bh, h - sy);
                        if (sw <= 0 || sh <= 0) continue;
                        const isAlt = (gx + gy) % 2 === 0;
                        const shiftX = isAlt ? Math.sin(t * 4.0 + gy) * amp : -Math.sin(t * 4.0 + gy) * amp;
                        const shiftY = isAlt ? Math.cos(t * 3.5 + gx) * (amp * 0.4) : 0;
                        try {
                            gctx.drawImage(this.workCanvas, sx, sy, sw, sh, sx + shiftX, sy + shiftY, sw, sh);
                            if (s > 0.3) {
                                gctx.strokeStyle = isAlt ? `rgba(0, 255, 200, ${0.25 * s})` : `rgba(255, 0, 128, ${0.20 * s})`;
                                gctx.lineWidth = 1;
                                gctx.strokeRect(sx + shiftX, sy + shiftY, sw, sh);
                            }
                        } catch(e) {}
                    }
                }
            }
            // 8. HYPERDRIVE: Relativistic hyperspace starfield streak zoom
            else if (mode === 'hyperdrive') {
                const passes = 5;
                const cx = w / 2, cy = h / 2;
                gctx.drawImage(this.workCanvas, 0, 0);
                gctx.globalCompositeOperation = 'screen';
                for (let p = 1; p <= passes; p++) {
                    const zScale = 1.0 + (p * 0.035 * (s + bass * 0.5));
                    gctx.globalAlpha = (0.28 / p) * s;
                    gctx.save();
                    gctx.translate(cx, cy);
                    gctx.scale(zScale, zScale);
                    gctx.drawImage(this.workCanvas, -cx, -cy);
                    gctx.restore();
                }
            }
            // 9. KALEIDOSCOPE: 4-way & 8-way faceted crystal mandala symmetry
            else if (mode === 'kaleidoscope') {
                const cx = w / 2, cy = h / 2;
                gctx.save();
                gctx.translate(cx, cy);
                gctx.rotate(t * 0.4);
                const qw = Math.ceil(cx), qh = Math.ceil(cy);
                for (let rot = 0; rot < 4; rot++) {
                    gctx.save();
                    gctx.rotate(rot * (Math.PI / 2));
                    gctx.scale(rot % 2 === 0 ? 1 : -1, 1);
                    gctx.drawImage(this.workCanvas, 0, 0, qw, qh, 0, 0, qw, qh);
                    gctx.restore();
                }
                gctx.restore();
            }
            // 10. QUANTUM: Micro-quantum foam probabilistic slice teleportation
            else if (mode === 'quantum') {
                const bands = 45 + Math.floor(s * 25);
                const bh = Math.ceil(h / bands);
                const amp = (20 + s * 60 + treble * 35);
                for (let b = 0; b < bands; b++) {
                    const sy = b * bh;
                    const sh = Math.min(bh, h - sy);
                    if (sh <= 0) continue;
                    let dx = 0;
                    if (Math.random() < 0.35 * s) {
                        dx = (Math.random() - 0.5) * amp * 2.2;
                    }
                    try {
                        gctx.drawImage(this.workCanvas, 0, sy, w, sh, dx, sy, w, sh);
                    } catch(e) {}
                }
            }
            // 11. RIPPLE: Concentric circular water droplet impact shockwaves & optical displacement (FIXED)
            else if (mode === 'ripple') {
                const rings = 20 + Math.floor(s * 18);
                const maxR = Math.hypot(w, h) * 0.65;
                const rw = maxR / rings;
                const cx = w * 0.5, cy = h * 0.5;
                gctx.drawImage(this.workCanvas, 0, 0);

                for (let i = 0; i < rings; i++) {
                    try {
                        const r = (i + 1) * rw;
                        const wavePhase = Math.sin((r / maxR) * 16.0 - t * 7.5);
                        const displacement = wavePhase * (12 + s * 36 + bass * 30);
                        const rInner = Math.max(0.1, r - rw);
                        const rOuter = Math.max(rInner + 0.5, r);

                        gctx.save();
                        gctx.beginPath();
                        gctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
                        gctx.arc(cx, cy, rInner, 0, Math.PI * 2, true); // Annular donut clipping ring
                        gctx.clip();

                        // Concentric optical magnification & displacement
                        const zoom = 1.0 + (wavePhase * 0.08 * s);
                        gctx.translate(cx, cy);
                        gctx.scale(zoom, zoom);
                        gctx.translate(-cx + displacement * 0.5, -cy + displacement * 0.5);
                        gctx.drawImage(this.workCanvas, 0, 0);
                        gctx.restore();

                        // Glowing shockwave crest (strictly positive safe radius!)
                        const crestRadius = Math.max(0.5, r + displacement);
                        gctx.save();
                        gctx.beginPath();
                        gctx.arc(cx, cy, crestRadius, 0, Math.PI * 2);
                        gctx.lineWidth = Math.max(1, rw * 0.28);
                        gctx.strokeStyle = `rgba(0, 229, 255, ${Math.max(0, 0.24 * s * Math.abs(wavePhase))})`;
                        gctx.stroke();
                        gctx.restore();
                    } catch(e) {
                        // Protected against any canvas math exceptions
                    }
                }
            }
            // 12. ANALOG CRT: Spherical glass cathode tube & magnetic barrel distortion
            else if (mode === 'analog_crt') {
                const cols = 20;
                const colW = Math.ceil(w / cols);
                const barrelAmp = (15 + s * 45);
                for (let c = 0; c < cols; c++) {
                    const sx = c * colW;
                    const sw = Math.min(colW, w - sx);
                    if (sw <= 0) continue;
                    const normX = (sx - (w / 2)) / (w / 2);
                    const bulge = (1.0 - normX * normX) * barrelAmp;
                    const scanJitter = Math.sin(t * 15 + c) * 3;
                    try {
                        gctx.drawImage(this.workCanvas, sx, 0, sw, h, sx + scanJitter, -bulge * 0.4, sw, h + bulge * 0.8);
                    } catch(e) {}
                }
            }
            // 13. ROLL: NewBlue Rolling Shutter & film frame roll with vertical seam wrapping
            else if (mode === 'newblue_roll') {
                const yRoll = ((t * (100 + s * 220) + Math.sin(t * 1.5) * 60) % h + h) % h;
                const seamH = Math.floor(yRoll);
                try {
                    if (seamH < h) {
                        gctx.drawImage(this.workCanvas, 0, 0, w, h - seamH, 0, seamH, w, h - seamH);
                    }
                    if (seamH > 0) {
                        gctx.drawImage(this.workCanvas, 0, h - seamH, w, seamH, 0, 0, w, seamH);
                    }
                    // Film gate seam bar
                    gctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
                    gctx.fillRect(0, Math.max(0, seamH - 6), w, 12);
                    gctx.fillStyle = `rgba(255, 255, 255, ${0.45 * s})`;
                    gctx.fillRect(0, Math.max(0, seamH - 1), w, 2);
                    // Edge jitter near seam
                    const jitCount = 8;
                    for (let j = 0; j < jitCount; j++) {
                        const jy = Math.max(0, Math.min(h - 4, seamH - 20 + j * 5));
                        const jx = Math.sin(t * 25 + j) * (12 * s);
                        gctx.drawImage(this.workCanvas, 0, jy, w, 4, jx, jy, w, 4);
                    }
                } catch(e) {}
            }
            // 14. ACTIVE CAM: NewBlue Active Camera organic handheld gimbal shake & lens tremor
            else if (mode === 'newblue_active_cam') {
                const shakeX = (Math.sin(t * 4.2) * 16 + Math.sin(t * 9.5) * 8 + (Math.random() - 0.5) * 4) * s;
                const shakeY = (Math.cos(t * 3.8) * 14 + Math.cos(t * 8.3) * 6 + (Math.random() - 0.5) * 4) * s;
                const rotAngle = (Math.sin(t * 2.1) * 0.035 + Math.sin(t * 5.4) * 0.015) * s;
                const focalScale = 1.05 + (s * 0.08) + Math.sin(t * 1.8) * 0.03 * s;
                try {
                    gctx.save();
                    gctx.translate(w / 2 + shakeX, h / 2 + shakeY);
                    gctx.rotate(rotAngle);
                    gctx.scale(focalScale, focalScale);
                    gctx.drawImage(this.workCanvas, -w / 2, -h / 2);
                    gctx.restore();
                    if (s > 0.25) {
                        gctx.save();
                        gctx.globalCompositeOperation = 'screen';
                        gctx.globalAlpha = 0.20 * s;
                        gctx.drawImage(this.workCanvas, shakeX * 1.5, shakeY * 1.5);
                        gctx.restore();
                    }
                } catch(e) {}
            }
            // 15. SHEAR: NewBlue Shear Energy directional angular displacement & vector slant
            else if (mode === 'newblue_shear') {
                const bands = 26 + Math.floor(s * 18);
                const bh = Math.ceil(h / bands);
                const shearAngle = Math.sin(t * 3.0) * (0.35 + s * 0.65) + bass * 0.35;
                for (let i = 0; i < bands; i++) {
                    const sy = i * bh;
                    const sh = Math.min(bh, h - sy);
                    if (sh <= 0) continue;
                    const norm = (i / bands) - 0.5;
                    const dx = norm * shearAngle * (w * 0.25);
                    try {
                        gctx.drawImage(this.workCanvas, 0, sy, w, sh, dx, sy, w, sh);
                    } catch(e) {}
                }
            }
            // 16. WIGGLE: NewBlue Micro Wiggle rapid coordinate tremor & sub-pixel vibration
            else if (mode === 'newblue_wiggle') {
                const cols = 16, rows = 12;
                const tw = Math.ceil(w / cols), th = Math.ceil(h / rows);
                const maxJitter = (8 + s * 26 + mid * 18);
                for (let c = 0; c < cols; c++) {
                    for (let r = 0; r < rows; r++) {
                        const sx = c * tw, sy = r * th;
                        const sw = Math.min(tw, w - sx), sh = Math.min(th, h - sy);
                        if (sw <= 0 || sh <= 0) continue;
                        const jx = (Math.sin(t * 22.0 + c * 3.1 + r * 1.7) * 0.6 + (Math.random() - 0.5) * 0.4) * maxJitter;
                        const jy = (Math.cos(t * 19.0 + r * 2.9 + c * 1.3) * 0.6 + (Math.random() - 0.5) * 0.4) * maxJitter;
                        try {
                            gctx.drawImage(this.workCanvas, sx, sy, sw, sh, sx + jx, sy + jy, sw, sh);
                        } catch(e) {}
                    }
                }
            }
            // 17. ZOOM BLAST: NewBlue Zoom Blast explosive multi-pass radial zoom streaks
            else if (mode === 'newblue_zoom_blur') {
                const cx = w / 2, cy = h / 2;
                const passes = 7;
                const maxZoom = 0.07 + s * 0.26 + bass * 0.22;
                gctx.drawImage(this.workCanvas, 0, 0);
                gctx.save();
                gctx.globalCompositeOperation = 'screen';
                for (let p = 1; p <= passes; p++) {
                    const factor = 1.0 + (p / passes) * maxZoom;
                    gctx.globalAlpha = (0.35 / p) * s;
                    try {
                        gctx.save();
                        gctx.translate(cx, cy);
                        gctx.scale(factor, factor);
                        gctx.drawImage(this.workCanvas, -cx, -cy);
                        gctx.restore();
                    } catch(e) {}
                }
                gctx.restore();
            }
            // 18. VIDEO TILE: NewBlue Video Tile repeating mosaic matrix with staggered phase
            else if (mode === 'newblue_video_tile') {
                const grid = s > 0.5 ? 4 : 3;
                const tw = w / grid, th = h / grid;
                for (let gx = 0; gx < grid; gx++) {
                    for (let gy = 0; gy < grid; gy++) {
                        const phase = Math.sin(t * 3.0 + gx * 1.2 + gy * 0.9);
                        const scale = 0.92 + phase * 0.06 * s;
                        try {
                            gctx.save();
                            gctx.translate(gx * tw + tw / 2, gy * th + th / 2);
                            gctx.scale(scale, scale);
                            gctx.drawImage(this.workCanvas, -tw / 2, -th / 2, tw, th);
                            gctx.strokeStyle = `rgba(0, 240, 255, ${0.35 * s})`;
                            gctx.lineWidth = 1.5;
                            gctx.strokeRect(-tw / 2, -th / 2, tw, th);
                            gctx.restore();
                        } catch(e) {}
                    }
                }
            }
            // 19. TWIRL: NewBlue Polar Twirl continuous vortex spiral twisting canvas pixels
            else if (mode === 'newblue_twirl') {
                const rings = 26;
                const maxR = Math.min(w, h) * 0.55;
                const rw = maxR / rings;
                const cx = w / 2, cy = h / 2;
                gctx.drawImage(this.workCanvas, 0, 0);
                const maxTwist = (1.5 + s * 3.5 + mid * 2.0) * Math.sin(t * 2.0);
                for (let i = rings - 1; i >= 1; i--) {
                    const r = i * rw;
                    const twist = (1.0 - (r / maxR)) * maxTwist;
                    try {
                        gctx.save();
                        gctx.beginPath();
                        gctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
                        gctx.clip();
                        gctx.translate(cx, cy);
                        gctx.rotate(twist);
                        gctx.drawImage(this.workCanvas, -cx, -cy);
                        gctx.restore();
                    } catch(e) {}
                }
            }
            // 20. LIGHT RING: NewBlue Anamorphic optical lens flare with chromatic light rings
            else if (mode === 'newblue_light_ring') {
                gctx.drawImage(this.workCanvas, 0, 0);
                const flareY = h * 0.5 + Math.sin(t * 1.8) * (h * 0.25);
                try {
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    const flareGrad = gctx.createLinearGradient(0, flareY - 14, 0, flareY + 14);
                    flareGrad.addColorStop(0, 'rgba(0, 220, 255, 0)');
                    flareGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.75 * s})`);
                    flareGrad.addColorStop(1, 'rgba(0, 180, 255, 0)');
                    gctx.fillStyle = flareGrad;
                    gctx.fillRect(0, flareY - 14, w, 28);

                    const ringCount = 4;
                    for (let k = 1; k <= ringCount; k++) {
                        const ringR = Math.max(1, (45 * k + Math.sin(t * 3.0 + k) * 22) * (0.8 + s * 0.6));
                        gctx.beginPath();
                        gctx.arc(w / 2, flareY, ringR, 0, Math.PI * 2);
                        gctx.strokeStyle = k % 2 === 0 ? `rgba(0, 255, 200, ${0.45 * s})` : `rgba(255, 60, 180, ${0.45 * s})`;
                        gctx.lineWidth = 2.5;
                        gctx.stroke();
                    }
                    gctx.restore();
                } catch(e) {}
            }
            // 21. EARTHQUAKE: NewBlue Seismic Earthquake shockwave pulses & clamp jolt
            else if (mode === 'newblue_earthquake') {
                const pulse = Math.pow(Math.abs(Math.sin(t * 6.5)), 6.0);
                const quakeX = (Math.sin(t * 45.0) * (18 + s * 55) * pulse + (Math.random() - 0.5) * 6 * s);
                const quakeY = (Math.cos(t * 38.0) * (14 + s * 45) * pulse + (Math.random() - 0.5) * 6 * s);
                try {
                    gctx.drawImage(this.workCanvas, quakeX, quakeY);
                    if (pulse > 0.3) {
                        gctx.save();
                        gctx.globalCompositeOperation = 'screen';
                        gctx.globalAlpha = 0.35 * s * pulse;
                        gctx.drawImage(this.workCanvas, -quakeX * 1.5, -quakeY * 1.5);
                        gctx.restore();
                    }
                } catch(e) {}
            }
            // 22. WATER DROP: NewBlue Caustic Water Droplet refraction lens with concentric ripple waves
            else if (mode === 'newblue_water_drop') {
                const cx = w * 0.5 + Math.sin(t * 1.2) * (w * 0.15);
                const cy = h * 0.5 + Math.cos(t * 1.5) * (h * 0.15);
                const maxDropR = Math.min(w, h) * (0.28 + s * 0.28);
                gctx.drawImage(this.workCanvas, 0, 0);
                const dropRings = 16;
                for (let d = dropRings; d >= 1; d--) {
                    const r = (d / dropRings) * maxDropR;
                    const wave = Math.sin((d / dropRings) * 12.0 - t * 6.0);
                    const zoom = 1.0 + wave * 0.12 * s;
                    try {
                        gctx.save();
                        gctx.beginPath();
                        gctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
                        gctx.clip();
                        gctx.translate(cx, cy);
                        gctx.scale(zoom, zoom);
                        gctx.drawImage(this.workCanvas, -cx, -cy);
                        gctx.restore();
                    } catch(e) {}
                }
            }
            // 23. RGB FAST SHIFT: NewBlue 3-Axis Directional RGB Prism Dispersion
            else if (mode === 'newblue_rgb_shift') {
                const shiftAmp = (14 + s * 48 + treble * 25);
                const angleR = t * 2.8, angleB = t * 2.8 + (Math.PI * 4 / 3);
                const rx = Math.cos(angleR) * shiftAmp, ry = Math.sin(angleR) * shiftAmp;
                const bx = Math.cos(angleB) * shiftAmp, by = Math.sin(angleB) * shiftAmp;
                try {
                    gctx.drawImage(this.workCanvas, 0, 0);
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = 0.45 * s;
                    gctx.drawImage(this.workCanvas, rx, ry);
                    gctx.drawImage(this.workCanvas, bx, by);
                    gctx.restore();
                } catch(e) {}
            }
            // 24. QUAD MIRROR: NewBlue 4-Quadrant Bilateral Mirror reflection
            else if (mode === 'newblue_quad_mirror') {
                const halfW = Math.ceil(w / 2), halfH = Math.ceil(h / 2);
                try {
                    // Top-Left
                    gctx.drawImage(this.workCanvas, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
                    // Top-Right (mirror H)
                    gctx.save();
                    gctx.translate(w, 0);
                    gctx.scale(-1, 1);
                    gctx.drawImage(this.workCanvas, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
                    gctx.restore();
                    // Bottom-Left (mirror V)
                    gctx.save();
                    gctx.translate(0, h);
                    gctx.scale(1, -1);
                    gctx.drawImage(this.workCanvas, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
                    gctx.restore();
                    // Bottom-Right (mirror both)
                    gctx.save();
                    gctx.translate(w, h);
                    gctx.scale(-1, -1);
                    gctx.drawImage(this.workCanvas, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
                    gctx.restore();
                } catch(e) {}
            }
            // 25. FISH EYE: NewBlue Fisheye Lens ultra-wide spherical convex barrel distortion
            else if (mode === 'newblue_fish_eye') {
                const cx = w / 2, cy = h / 2;
                const maxR = Math.hypot(w, h) * 0.55;
                const shells = 22;
                const shellR = maxR / shells;
                gctx.drawImage(this.workCanvas, 0, 0);
                for (let i = shells; i >= 1; i--) {
                    const r = i * shellR;
                    const normR = r / maxR;
                    const bulge = 1.0 + (1.0 - normR * normR) * (0.35 + s * 0.65);
                    try {
                        gctx.save();
                        gctx.beginPath();
                        gctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
                        gctx.clip();
                        gctx.translate(cx, cy);
                        gctx.scale(bulge, bulge);
                        gctx.drawImage(this.workCanvas, -cx, -cy);
                        gctx.restore();
                    } catch(e) {}
                }
            }
            // 26. PINCH: NewBlue Pincushion optical vacuum contraction singularity
            else if (mode === 'newblue_pinch') {
                const cx = w / 2, cy = h / 2;
                const maxR = Math.hypot(w, h) * 0.55;
                const shells = 22;
                const shellR = maxR / shells;
                gctx.drawImage(this.workCanvas, 0, 0);
                for (let i = shells; i >= 1; i--) {
                    const r = i * shellR;
                    const normR = r / maxR;
                    const pinch = 1.0 - (1.0 - normR) * (0.28 + s * 0.42);
                    try {
                        gctx.save();
                        gctx.beginPath();
                        gctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
                        gctx.clip();
                        gctx.translate(cx, cy);
                        gctx.scale(pinch, pinch);
                        gctx.drawImage(this.workCanvas, -cx, -cy);
                        gctx.restore();
                    } catch(e) {}
                }
            }
            // 27. SOLARIZE: NewBlue Luma Solarization & Sabattier inversion wash
            else if (mode === 'newblue_solarize') {
                try {
                    gctx.drawImage(this.workCanvas, 0, 0);
                    gctx.save();
                    gctx.globalCompositeOperation = 'difference';
                    gctx.globalAlpha = 0.40 + s * 0.45;
                    gctx.drawImage(this.workCanvas, 0, 0);
                    gctx.restore();

                    gctx.save();
                    gctx.globalCompositeOperation = 'color-dodge';
                    gctx.globalAlpha = 0.28 * s;
                    const solHue = (t * 40.0) % 360;
                    gctx.fillStyle = `hsl(${solHue}, 90%, 50%)`;
                    gctx.fillRect(0, 0, w, h);
                    gctx.restore();
                } catch(e) {}
            }
            // 28. CATHODE BEAM: NewBlue Cathode Ray Tube electron beam raster deflection
            else if (mode === 'newblue_cathode_beam') {
                const lines = 36 + Math.floor(s * 25);
                const lh = Math.ceil(h / lines);
                const flyback = (t * 3.5) % 1.0;
                const flyY = flyback * h;
                for (let l = 0; l < lines; l++) {
                    const sy = l * lh;
                    const sh = Math.min(lh, h - sy);
                    if (sh <= 0) continue;
                    const distToFly = Math.abs(sy - flyY);
                    const beamJitter = distToFly < 45 ? (Math.random() - 0.5) * (18 + s * 45) : Math.sin(t * 12.0 + l * 0.3) * (4 + s * 12);
                    try {
                        gctx.drawImage(this.workCanvas, 0, sy, w, sh, beamJitter, sy, w, sh);
                    } catch(e) {}
                }
                gctx.fillStyle = `rgba(0, 255, 230, ${0.45 * s})`;
                gctx.fillRect(0, Math.max(0, flyY - 2), w, 4);
            }
            // 29. NEON EDGES: NewBlue High-contrast Sobel gradient edge detection
            else if (mode === 'newblue_neon_edges') {
                const edgeDist = 2 + s * 4;
                try {
                    gctx.drawImage(this.workCanvas, 0, 0);
                    gctx.save();
                    gctx.globalCompositeOperation = 'difference';
                    gctx.drawImage(this.workCanvas, -edgeDist, -edgeDist);
                    gctx.restore();

                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = 0.50 * s;
                    gctx.fillStyle = `hsl(${(t * 60) % 360}, 100%, 60%)`;
                    gctx.fillRect(0, 0, w, h);
                    gctx.restore();
                } catch(e) {}
            }

            // Universal High-impact Chromatic Separation Passes
            const chroma = (6 + s * 22 + treble * 16);
            gctx.globalCompositeOperation = 'screen';
            gctx.globalAlpha = 0.22 + s * 0.28;
            try {
                gctx.drawImage(this.workCanvas, -chroma, 0);
                gctx.drawImage(this.workCanvas, chroma, 0);
            } catch(e) {}

            // Mode Shimmer & Tint Wash
            gctx.globalCompositeOperation = 'soft-light';
            gctx.globalAlpha = 0.18 + s * 0.22;
            this.aiWarpHue = (this.videoPalette.hue * 0.4 + (now * 0.04) % 360 + (treble) * 160) % 360;
            gctx.fillStyle = `hsla(${this.aiWarpHue}, 85%, 55%, 1)`;
            gctx.fillRect(0, 0, w, h);

            gctx.restore();
        }

        /* ── YOUTUBE WARP BUS — 29 WARP MODES + ALL 34 VOICES ON THE LIVE FEED ─────
           The YouTube iframe is cross-origin, so its pixels can never be read into
           the Canvas. This bus therefore routes the *entire* AI Warp pipeline onto
           the #ytWarpShell element itself: every warp mode drives CSS 3D transforms
           / clip-path tears on the real video, and every glitch voice (17 core rails
           + 17 isolated `GC#(3)` rails) contributes to a cumulative CSS filter
           chain on the live feed. Self-drawing overlay voices (Scanlines, ASCII,
           Matrix, bombs…) keep painting onto the transparent glitch canvas stacked
           above the shell, so the YouTube picture is fully "drawn onto" the AI
           Warp effects and the effect voices. */
        updateYouTubeTransformsAndFilters(now, dt) {
            const ytShell = document.getElementById('ytWarpShell');
            if (!ytShell || ytShell.style.display === 'none') return;

            // Smoothed (damped) transform state
            if (!this.smoothedTransform) {
                this.smoothedTransform = {
                    skewX: 0, skewY: 0, rotZ: 0, rotX: 0, rotY: 0,
                    scaleX: 1.0, scaleY: 1.0, driftX: 0, driftY: 0
                };
            }

            const s = (this.aiWarpActive && this.aiWarpStrength > 0.005) ? (this.aiWarpStrength * this.masterOpacity) : 0;
            const t = now * 0.001 * this.glitchSpeed;
            const audio = this.audioDrive;
            const bass = audio.bass || 0;
            const mid = audio.mid || 0;
            const treble = audio.treble || 0;
            const drive = audio.drive || 0;
            const mode = this.aiWarpMode;

            /* ── VOICE BUS HELPERS ──────────────────────────────────────────────
               Each YouTube-facing contribution sums the core rail with its isolated
               ` GC#(3)` rail; SIZE/DEPTH resolve to the alpha-weighted average of
               both rails, so the live mixer sliders shape the video treatment too. */
            const la = (base) => clamp01(this.liveAlpha(base) + this.liveAlpha(base + ' GC#(3)'));
            const voiceSize = (base) => {
                const a1 = this.liveAlpha(base), a2 = this.liveAlpha(base + ' GC#(3)');
                const tot = a1 + a2;
                if (tot <= 0.0005) return 1.0;
                return (this.sizeFor(base) * a1 + this.sizeFor(base + ' GC#(3)') * a2) / tot;
            };
            const voiceDepth = (base) => {
                const a1 = this.liveAlpha(base), a2 = this.liveAlpha(base + ' GC#(3)');
                const tot = a1 + a2;
                if (tot <= 0.0005) return 0.62;
                return (this.depthFor(base) * a1 + this.depthFor(base + ' GC#(3)') * a2) / tot;
            };
            const fract = (v) => v - Math.floor(v);
            const gateHash = (slot, salt) => fract(Math.sin(slot * 12.9898 + salt * 78.233) * 43758.5453);

            // ── 1. VOICE BUS → cumulative filter/transform contributions ─────────
            const vInvert  = la('B&W Invert');
            const vRainbow = la('HSL Rainbow');
            const vHueCyc  = la('Hue/Color Cycle');
            const vFlash   = la('Flash');
            const vStrobe  = la('Strobe');
            const vNeon    = la('Neon Grad');
            const vTech    = la('Tech Artist');
            const vVhs     = la('VHS Glitch');
            const vBands   = la('Data Bands');
            const vScan    = la('Scanlines');
            const vBomb    = la('Data Bomb');
            const vGemini  = la('Gemini Bomb');
            const vGlyphs  = clamp01(la('ASCII') * 0.6 + la('Matrix ASCII') * 0.7 + la('Matrix Chord') * 0.6 + la('Ink Glyphs') * 0.5 + la('Font Burn') * 0.6);

            let hue = 0;
            let invertPct = Math.round(vInvert * 100);
            const warpBlend = this.getWarpBlendProfile();
            let brightness = 1.0 + (this.hardLightActive ? 0.20 * warpBlend.hardLight : 0);
            let contrast   = 1.0 + (this.hardLightActive ? 0.45 * warpBlend.hardLight : 0);
            let saturate   = 1.0 + (this.hardLightActive ? 0.60 * warpBlend.hardLight : 0) + treble * 0.4;
            let blurPx = 0, grayscale = 0, sepia = 0;
            let jx = 0, jy = 0, skewImm = 0, spin = 0, flipX = 1;
            let clipCss = '';

            if (s > 0.005) {
                // Slow AI-Warp signature tint drift on the live feed
                hue += ((t * 14) % 360) * s * 0.6;
            }

            if (vRainbow > 0.005) {
                const rs = 0.25 * (1.0 + voiceSize('HSL Rainbow') * 0.5);
                hue += vRainbow * ((now * rs) % 360);
                saturate += vRainbow * 0.5;
                contrast += vRainbow * 0.10;
            }
            if (vHueCyc > 0.005) {
                hue += vHueCyc * ((now * 0.06) % 360);
                saturate += vHueCyc * 0.15;
            }
            if (vInvert > 0.005) {
                contrast += vInvert * 0.15;
                grayscale += vInvert * 0.35;
            }
            if (vFlash > 0.005) {
                const cycle = 900 / Math.max(0.4, voiceSize('Flash'));
                const pulse = Math.exp(-((now % cycle) / cycle) * 5.0);   // snappy decay flash
                brightness += vFlash * (0.25 + 1.9 * pulse);
            }
            if (vStrobe > 0.005) {
                const freq = 6 + voiceSize('Strobe') * 9;                 // 6–15 Hz square wave
                const blink = fract(t * freq) < 0.5 ? 1.0 : 0.12;
                brightness *= (1 - vStrobe) + vStrobe * blink;
                contrast += vStrobe * 0.25;
            }
            if (vNeon > 0.005) {
                saturate += vNeon * 0.8;
                contrast += vNeon * 0.2;
            }
            if (vTech > 0.005) {
                hue += Math.sin(t * 0.5) * 20 * vTech;
            }
            if (vVhs > 0.005) {
                const holdMs = 130 / Math.max(0.35, voiceSize('VHS Glitch'));
                const slot = Math.floor(now / holdMs);
                if (fract(now / (holdMs * 3.7)) < 0.28 * vVhs * (0.4 + 0.6 * voiceDepth('VHS Glitch'))) {
                    jx += (gateHash(slot, 3) - 0.5) * 42 * vVhs;
                    skewImm += (gateHash(slot, 9) - 0.5) * 9 * vVhs;
                }
                jy += Math.sin(t * 1.05) * 7 * vVhs;                    // tape-tracking roll
                saturate -= vVhs * 0.30;
                contrast += vVhs * 0.12;
                brightness += Math.sin(t * 13.7) * 0.035 * vVhs;        // luma noise shimmer
            }
            if (vBands > 0.005) {
                const bs = voiceSize('Data Bands');
                const ivl = Math.max(90, 560 - bs * 120);               // tear cadence by SIZE
                const win = 120 * Math.min(1.5, bs);
                const slot = Math.floor(now / ivl);
                if ((now % ivl) < win) {
                    const r2 = gateHash(slot, 22), r3 = gateHash(slot, 23);
                    jx += (gateHash(slot, 21) > 0.5 ? 1 : -1) * (6 + 24 * r2) * vBands;
                    skewImm += (r3 - 0.5) * 6 * vBands;
                    const cropT = (0.5 + 3.0 * r2) * vBands;
                    const cropB = (0.5 + 3.0 * r3) * vBands;
                    clipCss = `inset(${cropT.toFixed(2)}% 0% ${cropB.toFixed(2)}% 0%)`;
                    hue += (r3 - 0.5) * 90 * vBands;
                }
            }
            if (vScan > 0.005) {
                contrast += vScan * 0.18;
                brightness -= vScan * 0.05;
            }
            if (vBomb > 0.005) {
                const slot = Math.floor(now / 700);
                if (gateHash(slot, 31) < vBomb * 0.55 && (now % 700) < 90) {
                    brightness += vBomb * 0.85;
                    jx += (gateHash(slot, 32) - 0.5) * 16 * vBomb;
                }
            }
            if (vGemini > 0.005) {
                saturate += vGemini * 0.30;
            }
            if (vGlyphs > 0.005) {
                contrast += vGlyphs * 0.07;   // glyph overlays read into the picture
            }

            // ── 2. AI WARP MODE BUS → damped spatial deformation of the shell ────
            let targetSkewX = 0, targetSkewY = 0, targetRotZ = 0, targetRotX = 0, targetRotY = 0;
            let targetScaleX = 1.0, targetScaleY = 1.0, targetDriftX = 0, targetDriftY = 0;
            let shadowSpec = null, shadowMag = 0;

            if (s > 0.005) {
                // Organic floating motion baseline (gentle harmonic sines)
                targetSkewX = (Math.sin(t * 0.75) * 3.8 + Math.sin(t * 1.4) * 1.8) * s + (bass * 2.5);
                targetSkewY = (Math.cos(t * 0.65) * 2.8 + Math.cos(t * 1.2) * 1.2) * s + (mid * 1.8);
                targetRotZ = (Math.sin(t * 0.45) * 1.8 * s) + (bass * 1.0);
                targetRotX = (Math.cos(t * 0.50) * 2.2 * s);
                targetRotY = (Math.sin(t * 0.55) * 2.6 * s);
                const scBase = 1.04 + (s * 0.08) + (bass * 0.035);
                targetScaleX = scBase;
                targetScaleY = scBase;
                targetDriftX = Math.sin(t * 0.60) * 18 * s;
                targetDriftY = Math.cos(t * 0.50) * 12 * s;

                switch (mode) {
                    case 'liquid':
                        targetDriftX += Math.sin(t * 0.9) * 14 * s;
                        targetSkewY += Math.sin(t * 1.1) * 2 * s;
                        break;
                    case 'prism':
                        hue += ((t * 28) % 360) * s;
                        saturate += 0.3 * s;
                        shadowSpec = 'rgb'; shadowMag = 2 + 4 * s;
                        break;
                    case 'breathe': {
                        const br = Math.sin(t * 2.0) * (0.05 * s + bass * 0.04);
                        targetScaleX += br; targetScaleY += br;
                        break;
                    }
                    case 'fold':
                        targetSkewX += Math.sin(t * 1.5) * 3.5 * s;
                        targetScaleX += Math.sin(t * 0.9) * 0.05 * s;
                        break;
                    case 'aurora':
                        hue += Math.sin(t * 0.35) * 45 * s;
                        brightness += Math.sin(t * 0.8) * 0.06 * s;
                        saturate += 0.2 * s;
                        break;
                    case 'vortex':
                        targetRotZ += Math.sin(t * 1.2) * (5 * s + bass * 4);
                        break;
                    case 'cybergrid': {
                        const slot = Math.floor(now / 520);
                        targetSkewX += (gateHash(slot, 41) - 0.5) * 8 * s;
                        targetDriftY += (gateHash(slot, 42) - 0.5) * 22 * s;
                        contrast += 0.15 * s;
                        break;
                    }
                    case 'hyperdrive': {
                        const z = (drive || 0) * 0.09 * s + Math.max(0, Math.sin(t * 2.6)) * 0.03 * s;
                        targetScaleX += z; targetScaleY += z;
                        shadowSpec = 'cyan'; shadowMag = 3 + 6 * s;
                        break;
                    }
                    case 'kaleidoscope':
                        if (fract(t * 0.30) > 0.62) flipX = -1;         // mirror segment
                        targetRotY += Math.sin(t * 0.7) * 18 * s;
                        hue += Math.sin(t * 0.5) * 30 * s;
                        break;
                    case 'quantum': {
                        const slot = Math.floor(now / 120);
                        jx += (gateHash(slot, 51) - 0.5) * 30 * s;
                        jy += (gateHash(slot, 52) - 0.5) * 22 * s;
                        if (gateHash(slot, 53) < 0.2 * s) blurPx += 2.5 * s;
                        break;
                    }
                    case 'ripple': {
                        const r = Math.sin(t * 4.0) * 0.02 * s;
                        targetScaleX += r; targetScaleY -= r * 0.5;
                        targetRotZ += Math.sin(t * 4.0) * 0.8 * s;
                        break;
                    }
                    case 'analog_crt':
                        brightness += Math.sin(t * 24) * 0.02 * s + 0.02 * s;
                        contrast += 0.10 * s;
                        saturate += 0.10 * s;
                        sepia += 0.10 * s;
                        targetScaleY += Math.sin(t * 0.9) * 0.006 * s;
                        break;
                    case 'newblue_roll': {
                        const cyc = fract(t * 0.18);
                        const tri = cyc < 0.5 ? cyc * 2 : (1 - cyc) * 2;  // ping-pong, no wrap pop
                        targetDriftY += (tri - 0.5) * 90 * s;
                        break;
                    }
                    case 'newblue_active_cam': {
                        const slot = Math.floor(now / 850);
                        jx += (gateHash(slot, 61) - 0.5) * 46 * s;
                        jy += (gateHash(slot, 62) - 0.5) * 30 * s;
                        const zs = 1 + (gateHash(slot, 63) - 0.5) * 0.16 * s;
                        targetScaleX *= zs; targetScaleY *= zs;
                        break;
                    }
                    case 'newblue_shear':
                        targetSkewX += (gateHash(Math.floor(now / 700), 71) > 0.5 ? 1 : -1) * 9 * s;
                        break;
                    case 'newblue_wiggle':
                        targetRotZ += Math.sin(t * 9) * 2.2 * s;
                        jx += Math.sin(t * 13) * 4 * s;
                        break;
                    case 'newblue_zoom_blur': {
                        const z = Math.sin(t * 1.8);
                        targetScaleX += z * 0.07 * s; targetScaleY += z * 0.07 * s;
                        blurPx += Math.max(0, z) * 2.2 * s;
                        break;
                    }
                    case 'newblue_video_tile': {
                        const slot = Math.floor(now / 1600);
                        if (gateHash(slot, 82) > 0.4) {
                            const zs = 1 - (0.08 + 0.10 * gateHash(slot, 81)) * s;
                            targetScaleX *= zs; targetScaleY *= zs;
                            targetDriftX += (gateHash(slot, 83) - 0.5) * 40 * s;
                        }
                        break;
                    }
                    case 'newblue_twirl':
                        spin = fract(t * (0.35 + 0.75 * s)) * 360;      // 360°≡0° → seamless spin
                        break;
                    case 'newblue_light_ring':
                        brightness += (0.5 + 0.5 * Math.sin(t * 6)) * 0.28 * s;
                        hue += Math.sin(t * 3) * 12 * s;
                        break;
                    case 'newblue_earthquake':
                        jx += (Math.sin(t * 27.3) + Math.sin(t * 17.7)) * 3.5 * s;
                        jy += (Math.cos(t * 23.1) + Math.sin(t * 29.7)) * 2.6 * s;
                        targetRotZ += Math.sin(t * 21) * 0.6 * s;
                        break;
                    case 'newblue_water_drop': {
                        const wv = Math.sin(t * 3) * 0.03 * s;
                        targetScaleX += wv; targetScaleY -= wv * 0.6;
                        targetSkewY += Math.sin(t * 2.3) * 1.5 * s;
                        break;
                    }
                    case 'newblue_rgb_shift':
                        shadowSpec = 'rgb'; shadowMag = 2 + 6 * s;
                        break;
                    case 'newblue_quad_mirror': {
                        const ph = fract(t * 0.22);
                        flipX = ((ph > 0.25 && ph < 0.5) || ph > 0.75) ? -1 : 1;
                        contrast += 0.05 * s;
                        break;
                    }
                    case 'newblue_fish_eye': {
                        const b = Math.sin(t * 1.3) * 0.10 * s;
                        targetScaleX += b; targetScaleY += b * 0.8;
                        targetRotX += Math.sin(t * 0.9) * 2 * s;
                        break;
                    }
                    case 'newblue_pinch': {
                        const p = (0.5 + 0.5 * Math.sin(t * 2.2)) * 0.08 * s;
                        targetScaleX -= p; targetScaleY -= p;
                        targetSkewX += Math.sin(t * 2.2) * 1.2 * s;
                        break;
                    }
                    case 'newblue_solarize':
                        saturate += 2.2 * s;
                        contrast += 0.6 * s;
                        if (gateHash(Math.floor(now / 950), 91) < 0.45) {
                            invertPct = Math.round(Math.min(100, invertPct + 45 * s));
                        }
                        sepia += 0.2 * s;
                        break;
                    case 'newblue_cathode_beam':
                        brightness += (0.5 + 0.5 * Math.sin(t * 7)) * 0.25 * s;
                        blurPx += Math.max(0, Math.sin(t * 7)) * 0.8 * s;
                        break;
                    case 'newblue_neon_edges':
                        saturate += 0.5 * s;
                        contrast += 0.35 * s;
                        shadowSpec = 'neon'; shadowMag = 4 + 7 * s;
                        break;
                }
            }

            // ── 3. Damping (exponential smoothing, frame-rate independent) ───────
            const damping = Math.min(1.0, Math.max(0.04, dt * 5.0));
            const sm = this.smoothedTransform;
            sm.skewX = lerp(sm.skewX, targetSkewX, damping);
            sm.skewY = lerp(sm.skewY, targetSkewY, damping);
            sm.rotZ = lerp(sm.rotZ, targetRotZ, damping);
            sm.rotX = lerp(sm.rotX, targetRotX, damping);
            sm.rotY = lerp(sm.rotY, targetRotY, damping);
            sm.scaleX = lerp(sm.scaleX, targetScaleX, damping);
            sm.scaleY = lerp(sm.scaleY, targetScaleY, damping);
            sm.driftX = lerp(sm.driftX, targetDriftX, damping);
            sm.driftY = lerp(sm.driftY, targetDriftY, damping);

            // ── 4. Assemble transform (damped channels + immediate bus terms) ────
            const fSkewX = sm.skewX + skewImm;
            const fSkewY = sm.skewY;
            const fRotZ = sm.rotZ + spin;
            const fScaleX = Math.max(0.05, sm.scaleX) * flipX;
            const fScaleY = Math.max(0.05, sm.scaleY);
            const fDriftX = sm.driftX + jx;
            const fDriftY = sm.driftY + jy;

            const busy = s > 0.005 || jx !== 0 || jy !== 0 || spin !== 0 || flipX !== 1 ||
                Math.abs(sm.scaleX - 1.0) > 0.002 || Math.abs(fSkewX) > 0.02;
            if (busy) {
                ytShell.style.transform = `perspective(900px) scale(${fScaleX.toFixed(4)}, ${fScaleY.toFixed(4)}) translate(${fDriftX.toFixed(2)}px, ${fDriftY.toFixed(2)}px) skew(${fSkewX.toFixed(2)}deg, ${fSkewY.toFixed(2)}deg) rotateZ(${fRotZ.toFixed(2)}deg) rotateX(${sm.rotX.toFixed(2)}deg) rotateY(${sm.rotY.toFixed(2)}deg)`;
            } else {
                ytShell.style.transform = 'none';
            }

            // ── 5. Chroma-split echoes (capped at one family + one glow) ─────────
            const shadows = [];
            if (vNeon > 0.01) {
                const ndx = (2 + voiceSize('Neon Grad') * 3 + treble * 5) * vNeon;
                const na = 0.55 * vNeon;
                shadows.push(`drop-shadow(${ndx.toFixed(1)}px 0 0 rgba(0,255,255,${na.toFixed(2)}))`);
                shadows.push(`drop-shadow(${(-ndx).toFixed(1)}px 0 0 rgba(255,43,214,${na.toFixed(2)}))`);
            } else if (vGemini > 0.01) {
                const gd = (2 + voiceSize('Gemini Bomb') * 3) * vGemini;
                shadows.push(`drop-shadow(${gd.toFixed(1)}px 0 0 rgba(0,255,180,${(0.5 * vGemini).toFixed(2)}))`);
                shadows.push(`drop-shadow(${(-gd).toFixed(1)}px 0 0 rgba(255,120,0,${(0.5 * vGemini).toFixed(2)}))`);
            } else if (shadowSpec === 'rgb' && s > 0.005) {
                shadows.push(`drop-shadow(${shadowMag.toFixed(1)}px 0 0 rgba(255,0,64,0.55))`);
                shadows.push(`drop-shadow(0 ${(-shadowMag * 0.6).toFixed(1)}px 0 rgba(0,255,128,0.45))`);
                shadows.push(`drop-shadow(${(-shadowMag).toFixed(1)}px 0 0 rgba(64,128,255,0.55))`);
            } else if (shadowSpec === 'neon' && s > 0.005) {
                shadows.push(`drop-shadow(${shadowMag.toFixed(1)}px 0 0 rgba(0,255,255,0.6))`);
                shadows.push(`drop-shadow(${(-shadowMag).toFixed(1)}px 0 0 rgba(255,43,214,0.6))`);
            } else if (shadowSpec === 'cyan' && s > 0.005) {
                shadows.push(`drop-shadow(0 0 ${shadowMag.toFixed(1)}px rgba(0,229,255,0.5))`);
            }
            if (vTech > 0.01 && shadows.length < 3) {
                shadows.push(`drop-shadow(0 0 ${(3 + 6 * vTech).toFixed(1)}px rgba(80,160,255,${(0.35 * vTech).toFixed(2)}))`);
            }

            // ── 5b. SVG WARP LENS — true per-pixel displacement of the YouTube feed ─
            // The browser rasterizes #ytWarpShell through the inline feTurbulence →
            // feDisplacementMap graph at the compositor level, so the actual video
            // pixels are warped (melted, torn, liquefied) — without JS ever reading
            // them (cross-origin safe). Applied BEFORE the CSS color chain below.
            let svgFilterUrl = '';
            if (this.svgWarpActive) {
                if (!this.svgWarpNodes) {
                    const turb = document.getElementById('ytWarpTurb');
                    const disp = document.getElementById('ytWarpDisp');
                    this.svgWarpNodes = (turb && disp) ? { turb, disp } : false;
                }
                if (this.svgWarpNodes && s > 0.005) {
                    const lens = this.resolveSvgWarpLens(mode, s, t, bass, mid, treble, drive,
                        { vhs: vVhs, bands: vBands, strobe: vStrobe, bomb: vBomb });
                    const bf = lens.bfX.toFixed(5) + ' ' + lens.bfY.toFixed(5);
                    const sc = lens.scale.toFixed(1);
                    if (this._svgWarpLastBf !== bf) {
                        this.svgWarpNodes.turb.setAttribute('baseFrequency', bf);
                        this._svgWarpLastBf = bf;
                    }
                    if (this._svgWarpLastScale !== sc) {
                        this.svgWarpNodes.disp.setAttribute('scale', sc);
                        this._svgWarpLastScale = sc;
                    }
                    if (this._svgWarpLastType !== lens.type) {
                        this.svgWarpNodes.turb.setAttribute('type', lens.type);
                        this._svgWarpLastType = lens.type;
                    }
                    svgFilterUrl = 'url(#ytSvgWarp) ';
                } else if (this.svgWarpNodes && this._svgWarpLastScale !== '0') {
                    this.svgWarpNodes.disp.setAttribute('scale', '0');
                    this._svgWarpLastScale = '0';
                }
            }

            // ── 6. Assemble cumulative filter chain (SVG lens + CSS color path) ─
            hue = ((hue % 360) + 360) % 360;
            brightness = Math.max(0.12, Math.min(3.5, brightness));
            contrast   = Math.max(0.50, Math.min(3.5, contrast));
            saturate   = Math.max(0.00, Math.min(4.0, saturate));
            blurPx     = Math.max(0, Math.min(12, blurPx));
            invertPct  = Math.max(0, Math.min(100, invertPct));
            grayscale  = clamp01(grayscale);
            sepia      = Math.max(0, Math.min(0.65, sepia));

            let filter = svgFilterUrl + `hue-rotate(${hue.toFixed(1)}deg) brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${saturate.toFixed(3)})`;
            if (invertPct > 0) filter += ` invert(${invertPct}%)`;
            if (grayscale > 0.01) filter += ` grayscale(${grayscale.toFixed(2)})`;
            if (sepia > 0.01) filter += ` sepia(${sepia.toFixed(2)})`;
            if (blurPx > 0.05) filter += ` blur(${blurPx.toFixed(1)}px)`;
            for (let i = 0; i < shadows.length && i < 3; i++) filter += ' ' + shadows[i];

            ytShell.style.filter = filter;
            ytShell.style.clipPath = clipCss || 'none';
            ytShell.style.setProperty('-webkit-clip-path', clipCss || 'none');
        }
        /* ── MASTER RENDER LOOP ────────────────────────────────────────────────── */
        mainRenderLoop(now) {
            const dt = (now - this.lastFrameTime) * 0.001;
            this.lastFrameTime = now;
            const cw = this.canvas.width;
            const ch = this.canvas.height;

            // 1. Capture visual source
            if (this.sourceMode === 'generative') {
                this.renderGenerativeSource(now);
                this.gctx.clearRect(0, 0, cw, ch);
                this.gctx.drawImage(this.genCanvas, 0, 0);
            } else if (this.sourceMode === 'video' && this.activeVideoElement && this.activeVideoElement.readyState >= 2) {
                this.gctx.clearRect(0, 0, cw, ch);
                drawCover(this.gctx, this.activeVideoElement, cw, ch);
            } else if (this.sourceMode === 'image' && this.activeImageElement) {
                this.gctx.clearRect(0, 0, cw, ch);
                drawCover(this.gctx, this.activeImageElement, cw, ch);
            } else if (this.sourceMode === 'raum') {
                this.renderRaumShow(now, dt);
            } else if (this.sourceMode === 'youtube') {
                // Embedded YouTube is cross-origin and cannot be sampled by Canvas.
                // Keep the video in its iframe and leave this canvas transparent here;
                // active voice renderers below paint their own FX layers onto it. The
                // original AI Warp Mode pass then processes those voice graphics (not
                // a synthetic/test bed). The CSS Warp Bus continues to affect the
                // iframe shell; capture the separate YouTube tab to process its pixels.
                this.gctx.clearRect(0, 0, cw, ch);
                this.updateYouTubeTransformsAndFilters(now, dt);
            }

            // 2. Automations: Continual Random, Auto Glitch, Timed Cadence, Automated Masters, Soft-Eye, Preset Slew Transition
            if (this.presetTransition && this.presetTransition.active) {
                this.updatePresetTransition(now, dt);
            }
            if (this.isContinualRandom || this.isAutoGlitch) {
                this.updateAutomation(now, dt);
            }
            if (this.isTimedAuto) {
                this.updateTimedAutomation(now, dt);
            }
            if (this.isAutomatedMasters) {
                this.stepAutomatedMasters(now, dt);
            }
            if (this.softEyeActive) {
                this.softEyeStep(now, dt);
            }
            if (this.r3GhostVsync) {
                this.r3GhostVsync.step(now, dt);
            }

            // 3. Render Active Glitch Voices (Persistent closures executed once per frame)
            for (let i = 0; i < this.activeEffects.length; i++) {
                try {
                    this.gctx.save();
                    this.activeEffects[i](this.gctx, now);
                    this.gctx.restore();
                } catch(e) {
                    console.warn('Effect render error:', e);
                }
            }

            // 4/5. Revision 3 captures one clean post-voice frame, then applies
            // V-Sync and Ghost Protocol confluence in their original R3 order.
            const r3SystemSnapshot = this.r3GhostVsync ? this.r3GhostVsync.captureSnapshot() : null;
            this.renderVsync(now, r3SystemSnapshot);
            this.renderGhostProtocol(now, r3SystemSnapshot);

            // 6. Run the original 29-mode Canvas Warp Slicer for every source. For
            //    YouTube, this processes the translucent in-page procedural FX bed;
            //    the iframe itself remains protected by browser cross-origin rules and
            //    is warped by the CSS Warp Bus above (or by captured source frames).
            this.renderAiWarp(now);
            this.renderMilkdrop(now);

            // 7. Transient Button Effects Overlay
            this.renderTransientEffects(now);


            this.animFrameId = requestAnimationFrame((n) => this.mainRenderLoop(n));
        }

        updateAutomation(now, dt) {
            let changed = false;
            const t = now * 0.001 * this.glitchSpeed;

            // Auto Glitch: Spontaneous high-impact surges on 1-2 voices only (respect userDisabled!)
            if (this.isAutoGlitch) {
                if (!this.nextAutoGlitchAt || now > this.nextAutoGlitchAt) {
                    this.nextAutoGlitchAt = now + 3600 / this.getWarpBlendProfile().automation;
                    const selection = this.pickConfluenceVoices(null, 2, true);
                    if (selection.length > 0) {
                        this.activateAutomationVoices(selection, now, 0.35, 0.80);
                        changed = true;
                        if (this.r3GhostVsync) this.r3GhostVsync.requestBurst(now, 'auto-glitch-spark', 0.48 + 0.38 * this.autoGlitchPower);
                    }
                }
            }

            // Continual Randomization rotates a selected core/R3 pair, then gently
            // modulates every enabled unlocked rail (including manual selections).
            if (this.isContinualRandom) {
                this.rotateContinualConfluence(now);
                this.effectNames.forEach((name, idx) => {
                    if (this.effectLocks[name] || this.effectUserDisabled[name] || !this.effectEnabled[name]) return;
                    if (now > (this.effectRetargetAt[name] || 0)) {
                        const blend = this.getWarpBlendProfile();
                        this.effectRetargetAt[name] = now + 2600 / blend.automation;
                        const seed = this.nextDeterministicValue();
                        this.effectTargets[name] = +clamp01((0.20 + seed * 0.55) * blend.automation).toFixed(2);
                    }
                    const target = this.effectTargets[name] || 0.40;
                    const oldVal = this.effectAlphas[name] || 0;
                    const osc = 0.02 * this.getWarpBlendProfile().automation * Math.sin(t * 3.2 + idx * 0.75);
                    const nextVal = clamp01(lerp(oldVal, target, 0.05) + osc);
                    if (Math.abs(nextVal - oldVal) > 0.005) {
                        this.effectAlphas[name] = +nextVal.toFixed(3);
                        this.effectEnabled[name] = nextVal > 0.01;
                        changed = true;
                    }
                });
            }

            if (changed && typeof this.onAutomationChange === 'function') {
                this.onAutomationChange();
            }
        }
    }

    root.AiWarpEngine = AiWarpEngine;
})(typeof window !== 'undefined' ? window : this);

;/* ===== media_page.js ===== */
/**
 * MEDIA_PAGE.JS — Master Integration & Audio-Visual Coordinator
 * 
 * Features:
 * - Web Audio API Analysis (Sub, Bass, Mid, Treble, Beat Transients, RMS)
 * - Synthetic Beat & Dub Music Engine (Self-contained Web Audio generator)
 * - Pole - R Showcase Audio Player (10 tracks by Stefan Betke / DIN)
 * - Spectrum Analyzer & Waveform Oscilloscope HUD
 * - Stereo VU Meters (Dual 12-segment ballistic LED bars)
 * - Theme Turbo Engine (Cyber, Neon, Gold, Cyan, CRT, Retro HUD)
 * - Preset Memory Browser (80 Machine Deepseek Presets + User Presets)
 * - Curated Auto Roulette Cycler
 * - 34-Voice Mixer Rack: 17 preserved core rails + 17 GC#(3) Revision 3 factory rails
 * - Freeze Frame PNG Screenshot Capture
 * - Tabified Collapsible UI Drawer
 * 
 * NEW FEATURES:
 * - YouTube Randoms Engine with Back / Forward / Random Navigation & History Stack
 * - Local Media Playback Engine (.mp4, .avi, .mkv, .mov, .mp3, .m4a)
 * - Local Folder Picking & Image Slideshow for MP3 Audio Playback
 * - ID3 Album Cover Art Extraction
 * - Fullscreen Drag-and-Drop Handler
 * - Media Transport Bar with Timeline Scrubber & Time Display
 */

document.addEventListener('DOMContentLoaded', async () => {
    'use strict';

    // Global audio references
    let audioCtx = null;
    let masterAnalyser = null;
    let masterGain = null;
    let micGainNode = null;
    let freqData = new Uint8Array(512);
    let timeData = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
        freqData[i] = 0;
        timeData[i] = 128;
    }
    let activeAudioElement = null;
    let isSynthRunning = false;
    let synthInterval = null;

    let aiWarp = null;
    let configData = null;
    let machinePresets = {};
    let userPresets = {};
    let presetListMode = 'machine'; // 'machine' | 'user'
    let isAutoPresetRunning = false;
    let autoPresetTimer = null;

    // Local Media & Artwork references
    const localVideo = document.getElementById('localVideo');
    // The R3 verbatim factory block reads the bare global `video` — expose the
    // local video element under that name so its live-feed branches work for
    // both local files and the shared display stream (which also plays via this element).
    window.video = localVideo;
    const localAudio = document.getElementById('localAudio');
    const localArtworkImg = document.getElementById('localArtworkImg');
    let localImagesPool = []; // Array of { name, url, blob }
    let currentArtworkIndex = 0;
    let artworkSlideshowTimer = null;
    let currentMediaKind = null; // 'video' | 'audio' | 'pole-r' | 'synth' | 'youtube'
    let ytWarpBusToastShown = false;

    // Audio Reactive EQ Gain Multipliers
    let eqGains = { bass: 1.2, mid: 1.0, treble: 1.0 };

    // Interactive Visualizer HUD Display Modes
    let spectrumDisplayMode = 0; // 0: 36 Bars, 1: Mirrored Dual-Peak, 2: Curved Area Wave
    let waveformDisplayMode = 0; // 0: Classic Cyan Beam, 1: Dual-Trace Phosphor, 2: Lissajous Orbit

    // YouTube Randoms references
    let ytPool = [];
    let ytHistory = [];
    let ytHistoryIndex = -1;

    /* ── 1. LOAD CONFIGURATION (ai-warp-engine.json) ─────────────────────────── */
    try {
        const resp = await fetch('ai-warp-engine.json');
        if (resp.ok) {
            configData = await resp.json();
            if (configData.youtubePool) ytPool = configData.youtubePool;
        }
    } catch (e) {
        console.warn('Could not load ai-warp-engine.json, using built-in defaults:', e);
    }

    if (ytPool.length === 0) {
        ytPool = [
            { id: 'u4TPBkN0vIc', title: '4K 60FPS Fractal Journey & Cosmic Geometry' },
            { id: 'gopYmb38DgM', title: 'Cyberpunk Neon Metropolis Synthwave Drift' },
            { id: 'jmEAP7aGo0o', title: 'DEFCON 1 Visualizer — Glitch Matrix Overdrive' },
            { id: 'uvSXL6ypLlw', title: 'Darksynth Cybernetic Glitch Protocol' },
            { id: 'NpSTV8WJATc', title: 'Retrowave Analog Dreams & Midnight Horizon' },
            { id: '8o6bdTOhIyE', title: 'Ambient Tape Decay & Lo-Fi Memory Loop' },
            { id: 'KlcsGjI6Jms', title: 'Night City Cyber Grid & Hologram Stream' },
            { id: 'B1CL4PqHh9k', title: 'Moonlight Sonata Synthesized Tape Artifacts' },
            { id: 'QsUmvGkXhnk', title: '8-Bit Chiptune Glitch Dimension' },
            { id: 'RgFaK6ZQifE', title: 'Electronic Warp Dimension & Prism Spectrum' },
            { id: 'kCP2xZvhJk0', title: 'Abstract Hyperspace Topological Distortion' },
            { id: 'DmStNF35o1w', title: 'Underground Berlin Acid Techno Visuals' },
            { id: 'SP2MeG95-Ko', title: 'Amiga Demoscene Realtime Shaders' },
            { id: 'fzTOv2R9jBw', title: 'VHS Aesthetic Tracking Tape Glitch' },
            { id: 'vnyLtdufSbE', title: 'Lofi Cyber Beats & Tokyo Rain Neon' },
            { id: 'R1UlclDAmwg', title: 'Glitch Core Cybernetic Breakcore Sync' }
        ];
    }

    // Initialize AiWarpEngine
    let lastAutomationSync = 0;
    if (window.AiWarpEngine) {
        aiWarp = new window.AiWarpEngine('glitchCanvas');
        window.aiWarpEngine = aiWarp;
        try {
            const savedMilkdrop = JSON.parse(localStorage.getItem('ai_warp_milkdrop_control') || 'null');
            if (savedMilkdrop && Number.isFinite(+savedMilkdrop.opacity)) aiWarp.setMilkdropOpacity(Math.min(0.38, Math.max(0, +savedMilkdrop.opacity)));
            if (savedMilkdrop) aiWarp.milkdropOpacityLocked = !!savedMilkdrop.locked;
        } catch (e) {}
        aiWarp.onAutomationChange = () => {
            const now = performance.now();
            if (now - lastAutomationSync > 50) { // ~20fps UI throttling
                lastAutomationSync = now;
                if (typeof syncUiFromEngine === 'function') syncUiFromEngine();
            }
        };
        aiWarp.onMilkdropPresetChange = () => {
            if (typeof syncUiFromEngine === 'function') syncUiFromEngine();
            saveMilkdropControlState();
        };
    }

    function saveMilkdropControlState() {
        if (!aiWarp) return;
        try {
            localStorage.setItem('ai_warp_milkdrop_control', JSON.stringify({
                opacity: aiWarp.milkdropTargetOpacity,
                locked: !!aiWarp.milkdropOpacityLocked
            }));
        } catch (e) {}
    }

    function generateFallbackPresets(customSeed) {
        const CORE_FX = [
            'Neon Grad', 'Scanlines', 'Data Bands', 'Flash', 'HSL Rainbow', 'ASCII',
            'Font Burn', 'Strobe', 'Gemini Bomb', 'Tech Artist', 'VHS Glitch',
            'Data Bomb', 'Ink Glyphs', 'Matrix ASCII', 'Matrix Chord',
            'B&W Invert', 'Hue/Color Cycle'
        ];
        const GC3_FX = CORE_FX.map(name => `${name} GC#(3)`);
        const FX = CORE_FX.concat(GC3_FX);
        const WARP_MODES = [
            'liquid', 'prism', 'breathe', 'fold', 'aurora', 'vortex',
            'cybergrid', 'hyperdrive', 'kaleidoscope', 'quantum', 'ripple', 'analog_crt',
            'newblue_roll', 'newblue_active_cam', 'newblue_shear', 'newblue_wiggle',
            'newblue_zoom_blur', 'newblue_video_tile', 'newblue_twirl', 'newblue_light_ring',
            'newblue_earthquake', 'newblue_water_drop', 'newblue_rgb_shift', 'newblue_quad_mirror',
            'newblue_fish_eye', 'newblue_pinch', 'newblue_solarize', 'newblue_cathode_beam', 'newblue_neon_edges'
        ];
        const seed = customSeed || ((Date.now() ^ (Math.random() * 0xFFFFFF)) >>> 0) || 1;
        let s = seed;
        const rng = () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
        const TAGS = ['OLD SOUL', 'CYBER DRIFT', 'PHOSPHOR GHOST', 'VOID PRISM', 'NEON CASCADE', 'CHROMA FLUX', 'HYPER REBIRTH', 'RETRO MATRIX'];
        const out = {};
        for (let i = 0; i < 80; i++) {
            const name = `Deepseek-${i + 1}`;
            const tag = i === 0 ? 'OLD SOUL' : (TAGS[i % TAGS.length] + ' ' + Math.floor(rng() * 99));
            const alphas = {};
            FX.forEach(f => alphas[f] = 0);
            if (i === 0) {
                alphas['Neon Grad'] = 0.18; alphas['Scanlines'] = 0.14; alphas['Flash'] = 0.20;
                alphas['HSL Rainbow'] = 0.18; alphas['ASCII'] = 0.22; alphas['Font Burn'] = 0.26;
                alphas['Strobe'] = 0.24; alphas['Gemini Bomb'] = 0.20; alphas['Tech Artist'] = 0.18;
                alphas['VHS Glitch'] = 0.18; alphas['Data Bands'] = 0.12;
                CORE_FX.forEach((fx, index) => { if (alphas[fx] > 0) alphas[`${fx} GC#(3)`] = +Math.min(0.18, alphas[fx] * (0.52 + (index % 4) * 0.04)).toFixed(3); });
            } else {
                const anchor = CORE_FX[(i - 1) % CORE_FX.length];
                alphas[anchor] = +(0.13 + rng() * 0.22).toFixed(3);
                alphas[`${anchor} GC#(3)`] = +(0.10 + rng() * 0.20).toFixed(3);
                const count = 1 + Math.floor(rng() * 4);
                const shuffled = [...FX].sort(() => rng() - 0.5);
                for (let v = 0; v < count; v++) {
                    const fx = shuffled[v];
                    if (fx === anchor || fx === `${anchor} GC#(3)`) continue;
                    const base = fx.replace(/ GC#\(3\)$/, '');
                    alphas[fx] = +(base === 'Flash' || base === 'Strobe' ? 0.07 + rng() * 0.20 : 0.08 + rng() * 0.28).toFixed(3);
                }
            }
            out[name] = {
                machine: true,
                tag: tag,
                seed: seed,
                alphas: alphas,
                masterOpacity: i === 0 ? 0.88 : +(0.72 + rng() * 0.20).toFixed(2),
                ghostLevel: i === 0 ? 0 : +(0.2 + rng() * 0.45).toFixed(3),
                ghostMode: i === 0 ? 'OFF' : (rng() < 0.4 ? 'OFF' : 'SPECTRUM'),
                vsyncMode: i === 0 ? 'OFF' : (rng() < 0.4 ? 'OFF' : 'ON'),
                aiWarp: true,
                warpMode: i === 0 ? 'liquid' : WARP_MODES[Math.floor(rng() * WARP_MODES.length)],
                warpStrength: i === 0 ? 0.45 : +(0.18 + rng() * 0.44).toFixed(2),
                toggles: {
                    autoGlitch: i !== 0 && rng() < 0.25,
                    continualRandomize: i !== 0 && rng() < 0.40,
                    timedAutomation: i !== 0 && rng() < 0.22,
                    automatedMasters: i !== 0 && rng() < 0.25,
                    softEyeMode: i !== 0 && rng() < 0.20 ? (rng() < 0.5 ? 'SURGE' : 'CRESCENDO') : 'OFF',
                    aiWarp: true
                }
            };
        }
        return out;
    }

    // Fresh Dynamic Machine Presets on Each Page Load/Reload, Preserving Deepseek-1 (OLD SOUL)
    const dynamicSeed = ((Date.now() ^ (Math.random() * 0xFFFFFF)) >>> 0) || 1;
    if (window.GlitchEngine && window.GlitchEngine.buildMachinePresets) {
        machinePresets = window.GlitchEngine.buildMachinePresets(dynamicSeed);
    } else {
        machinePresets = generateFallbackPresets(dynamicSeed);
    }

    // Load User Presets from localStorage
    try {
        const saved = localStorage.getItem('ai_warp_user_presets');
        if (saved) userPresets = JSON.parse(saved);
    } catch(e) {}

    
    /* ── HUD NOTIFICATION BANNER ────────────────────────────────────────── */
    function showHudNotification(text) {
        const banner = document.getElementById('hudNotificationBanner');
        if (!banner) return;
        banner.textContent = text;
        banner.classList.add('show');
        clearTimeout(banner.__timer);
        banner.__timer = setTimeout(() => {
            banner.classList.remove('show');
        }, 2200);
    }

/* ── 2. WEB AUDIO API & LIVE MICROPHONE AUDIO MONITOR ────────────────── */
    let isMicActive = false;
    let micStream = null;
    let micSourceNode = null;

    // Display Capture (getDisplayMedia): pixels and optional audio from shared display
    let captureStream = null;
    let captureSourceNode = null;
    let captureGainNode = null;
    let captureReturnToYouTube = false;
    const lensBridge = null; /* web build: no external lens window */
    let lensActive = false;
    let lensFailed = false;
    let lensFrameCanvas = null;
    let lensFrameBusy = false;
    const lensAudioFreq = new Uint8Array(512);
    const lensAudioWave = new Uint8Array(512);
    let lensAudioAt = 0;
    let lensAudioMode = 'none';
    if (lensBridge) {
        lensBridge.addEventListener('message', (ev) => {
            const d = ev.data;
            if (typeof d !== 'string') return;
            if (d === 'lens:closed' && lensActive) { lensActive = false; window.stopTabCapture(true); }
            else if (d.startsWith('lens:audiomode|')) { lensAudioMode = d.substring(15); }
            else if (d.startsWith('lens:audio|') && lensActive) {
                try {
                    const bin = atob(d.substring(11));
                    if (bin.length >= 1024) {
                        for (let i = 0; i < 512; i++) { lensAudioFreq[i] = bin.charCodeAt(i); lensAudioWave[i] = bin.charCodeAt(512 + i); }
                        lensAudioAt = performance.now();
                    }
                } catch (e) {}
            }
            else if (d.startsWith('lens:frame|') && lensFrameCanvas && !lensFrameBusy) {
                lensFrameBusy = true;
                const img = new Image();
                img.onload = () => {
                    if (lensFrameCanvas) lensFrameCanvas.getContext('2d').drawImage(img, 0, 0, lensFrameCanvas.width, lensFrameCanvas.height);
                    lensFrameBusy = false;
                };
                img.onerror = () => { lensFrameBusy = false; };
                img.src = 'data:image/jpeg;base64,' + d.substring(11);
            }
        });
    }
    const micToggleBtn = document.getElementById('micToggleBtn');

    function initAudioContext() {
        if (audioCtx) {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
            return audioCtx;
        }
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;

        audioCtx = new AudioContextClass();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.85;

        masterAnalyser = audioCtx.createAnalyser();
        masterAnalyser.fftSize = 1024;
        masterAnalyser.smoothingTimeConstant = 0.78;

        // Route masterGain to speakers AND to masterAnalyser
        masterGain.connect(audioCtx.destination);
        masterGain.connect(masterAnalyser);

        // Dedicated micGain node for microphone (does NOT route to destination, preventing acoustic howl!)
        micGainNode = audioCtx.createGain();
        micGainNode.gain.value = 2.0;
        micGainNode.connect(masterAnalyser);

        freqData = new Uint8Array(masterAnalyser.frequencyBinCount);
        timeData = new Uint8Array(masterAnalyser.frequencyBinCount);

        return audioCtx;
    }

    // Global user-gesture unlock for Web Audio
    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evtType => {
        window.addEventListener(evtType, () => {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
        }, { passive: true });
    });

    function routeElementToAudioContext(mediaEl) {
        if (!mediaEl) return;
        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (!mediaEl.__audioConnected) {
            try {
                const srcNode = audioCtx.createMediaElementSource(mediaEl);
                srcNode.connect(masterGain);
                mediaEl.__audioConnected = true;
            } catch(e) {
                console.warn('Media element routing notice:', e);
            }
        }
    }

    // Live Microphone Audio Monitor Handler (Robust & Zero-Feedback)
    if (micToggleBtn) {
        micToggleBtn.addEventListener('click', async () => {
            initAudioContext();
            if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});

            if (!isMicActive) {
                try {
                    const constraints = {
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false
                        }
                    };
                    micStream = await navigator.mediaDevices.getUserMedia(constraints).catch(() => {
                        return navigator.mediaDevices.getUserMedia({ audio: true });
                    });

                    micSourceNode = audioCtx.createMediaStreamSource(micStream);
                    if (micGainNode) {
                        micSourceNode.connect(micGainNode);
                    } else if (masterAnalyser) {
                        micSourceNode.connect(masterAnalyser);
                    }
                    isMicActive = true;
                    micToggleBtn.textContent = '🎙 MIC: ON [LIVE]';
                    micToggleBtn.classList.add('mic-active');
                    updateAudioMonitorBadge('MONITOR: LIVE MIC [ACTIVE]', true);
                    showHudNotification('LIVE MICROPHONE MONITOR ACTIVE');
                } catch(err) {
                    console.warn('Microphone error:', err);
                    alert('Could not access microphone: ' + (err.message || err));
                }
            } else {
                if (micStream) {
                    micStream.getTracks().forEach(t => t.stop());
                    micStream = null;
                }
                if (micSourceNode) {
                    try { micSourceNode.disconnect(); } catch(e) {}
                    micSourceNode = null;
                }
                isMicActive = false;
                micToggleBtn.textContent = '🎙 MIC: OFF';
                micToggleBtn.classList.remove('mic-active');
                updateAudioMonitorBadge('MONITOR: STANDBY', false);
                showHudNotification('MICROPHONE MONITOR MUTED');
            }
        });
    }

    // Synthetic Multi-Track Dub & Chiptune Engine (Keygen, Mellow Bass, Cyber-Hybrid)
    let synthStep = 0;
    const synthTracks = ['keygen', 'mellow', 'hybrid'];
    let currentSynthTrackIndex = -1;

    function playSynthKick(now) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
        g.gain.setValueAtTime(1.0, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.30);
    }

    function playSynthSnare(now) {
        if (!audioCtx) return;
        const bufferSize = audioCtx.sampleRate * 0.08;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 1.5;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        noise.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        noise.start(now);
    }

    function playSynthHihat(now) {
        if (!audioCtx) return;
        const bufferSize = audioCtx.sampleRate * 0.04;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(0.005, now + 0.04);
        noise.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        noise.start(now);
    }

    function playSynthLead(freq, now, dur = 0.1) {
        if (!audioCtx || !freq) return;
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2800, now);
        filter.frequency.exponentialRampToValueAtTime(600, now + dur);
        filter.Q.value = 5.0;
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + dur + 0.02);
    }

    function playDeepBass(freq, now, dur = 0.35) {
        if (!audioCtx || !freq) return;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.40, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + dur + 0.02);
    }

    function updateSynthButtons(activeTrack) {
        const btnKeygen = document.getElementById('btn-play-keygen');
        const btnMellow = document.getElementById('btn-play-mellow');
        const btnHybrid = document.getElementById('btn-play-hybrid');
        const btnStop = document.getElementById('btn-stop-synth');
        if (btnKeygen) btnKeygen.classList.toggle('active', activeTrack === 'keygen');
        if (btnMellow) btnMellow.classList.toggle('active', activeTrack === 'mellow');
        if (btnHybrid) btnHybrid.classList.toggle('active', activeTrack === 'hybrid');
        if (btnStop) btnStop.style.display = activeTrack ? 'inline-block' : 'none';
    }

    function stopSyntheticAudio() {
        isSynthRunning = false;
        currentSynthTrackIndex = -1;
        if (synthInterval) { clearInterval(synthInterval); synthInterval = null; }
        const synthBtn = document.getElementById('synthToggleBtn');
        if (synthBtn) {
            synthBtn.textContent = 'SYNTH DUB: OFF';
            synthBtn.classList.remove('active');
        }
        updateSynthButtons(null);
        updateAudioMonitorBadge('MONITOR: STANDBY', false);
        showHudNotification('SYNTHETIC ENGINE STOPPED');
    }

    function playSynthTrack(trackName) {
        initAudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (synthInterval) clearInterval(synthInterval);
        isSynthRunning = true;
        currentMediaKind = 'synth';
        syncPlaybackClasses(null); // generative canvas source — not a playback feed for R3 ytLive/localVid checks
        synthStep = 0;

        const synthBtn = document.getElementById('synthToggleBtn');
        const trackLabels = {
            keygen: 'KEYGEN TECHNO [138 BPM]',
            mellow: 'MELLOW BASS [96 BPM]',
            hybrid: 'CYBER-HYBRID [124 BPM]'
        };
        const title = trackLabels[trackName] || 'SYNTH DUB';
        if (synthBtn) {
            synthBtn.textContent = `SYNTH: ${title}`;
            synthBtn.classList.add('active');
        }
        updateSynthButtons(trackName);
        updateAudioMonitorBadge(`MONITOR: SYNTH [${trackName.toUpperCase()}]`, true);
        showHudNotification(`SYNTH TRACK: ${title}`);

        if (trackName === 'keygen') {
            const notes = [293.66, 349.23, 440, 523.25, 587.33, 440, 349.23, 293.66, 261.63, 329.63, 392, 523.25, 587.33, 523.25, 392, 329.63];
            const stepMs = (60 / 138 / 4) * 1000;
            synthInterval = setInterval(() => {
                if (!isSynthRunning || !audioCtx) return;
                const now = audioCtx.currentTime;
                const step = synthStep % 16;
                if (step % 4 === 0) playSynthKick(now);
                if (step === 4 || step === 12) playSynthSnare(now);
                if (step % 2 === 1) playSynthHihat(now);
                playSynthLead(notes[step], now, 0.09);
                synthStep++;
            }, stepMs);
        } else if (trackName === 'mellow') {
            const bass = [55, 55, 48.99, 48.99, 65.41, 65.41, 55, 55];
            const stepMs = (60 / 96 / 4) * 1000;
            synthInterval = setInterval(() => {
                if (!isSynthRunning || !audioCtx) return;
                const now = audioCtx.currentTime;
                const step = synthStep % 16;
                if (step === 0 || step === 3 || step === 8 || step === 10) {
                    const bFreq = bass[Math.floor((synthStep / 16) % bass.length)];
                    playDeepBass(bFreq, now, 0.35);
                }
                if (step === 4 || step === 12) playSynthSnare(now);
                if (step % 4 === 2) playSynthHihat(now);
                synthStep++;
            }, stepMs);
        } else {
            const notes = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63];
            const stepMs = (60 / 124 / 4) * 1000;
            synthInterval = setInterval(() => {
                if (!isSynthRunning || !audioCtx) return;
                const now = audioCtx.currentTime;
                const step = synthStep % 16;
                if (step % 4 === 0) playSynthKick(now);
                if (step === 4 || step === 12) playSynthSnare(now);
                if (step % 2 === 1) playSynthHihat(now);
                playSynthLead(notes[step % notes.length], now, 0.08);
                if (step === 0 || step === 10) playDeepBass(110, now, 0.4);
                synthStep++;
            }, stepMs);
        }
    }

    function toggleSyntheticAudio() {
        currentSynthTrackIndex = (currentSynthTrackIndex + 1) % (synthTracks.length + 1);
        if (currentSynthTrackIndex >= synthTracks.length) {
            stopSyntheticAudio();
        } else {
            playSynthTrack(synthTracks[currentSynthTrackIndex]);
        }
    }

    // Audio Monitor status badge
    const audioMonitorBadge = document.getElementById('audioMonitorBadge');
    function updateAudioMonitorBadge(label, active = true) {
        if (!audioMonitorBadge) return;
        if (audioMonitorBadge.textContent !== label) {
            audioMonitorBadge.textContent = label;
        }
        audioMonitorBadge.style.color = active ? 'var(--theme-accent)' : '#667788';
        audioMonitorBadge.style.borderColor = active ? 'var(--theme-line)' : 'rgba(255,255,255,0.12)';
        audioMonitorBadge.style.boxShadow = active ? '0 0 10px var(--theme-glow)' : 'none';
    }

    // Frame-to-frame motion (0..1) of the lens picture, used as the audio-reactive pulse.
    let fluxCv = null, fluxPrev = null, fluxVal = 0, fluxAt = 0;
    function lensFlux() {
        const now = performance.now();
        if (now - fluxAt < 60) return fluxVal;
        fluxAt = now;
        if (!localVideo || localVideo.readyState < 2) return fluxVal;
        if (!fluxCv) { fluxCv = document.createElement('canvas'); fluxCv.width = 32; fluxCv.height = 18; }
        const c = fluxCv.getContext('2d', { willReadFrequently: true });
        c.drawImage(localVideo, 0, 0, 32, 18);
        const d = c.getImageData(0, 0, 32, 18).data;
        let diff = 0;
        if (fluxPrev) for (let i = 0; i < d.length; i += 4) diff += Math.abs(d[i] - fluxPrev[i]) + Math.abs(d[i + 1] - fluxPrev[i + 1]) + Math.abs(d[i + 2] - fluxPrev[i + 2]);
        fluxPrev = d;
        const target = clamp01(diff / (576 * 3 * 40));
        fluxVal += (target - fluxVal) * 0.6;
        return fluxVal;
    }

    // Audio frequency analysis routine with YouTube Audio Sync Engine
    function getAudioEnergy() {
        let realAudioActive = false;

        if (masterAnalyser) {
            masterAnalyser.getByteFrequencyData(freqData);
            masterAnalyser.getByteTimeDomainData(timeData);

            let maxVal = 0;
            for (let i = 0; i < freqData.length; i++) {
                if (freqData[i] > maxVal) maxVal = freqData[i];
            }
            if (maxVal > 10) {
                realAudioActive = true;
            }
        }

        if (isMicActive) {
            updateAudioMonitorBadge('MONITOR: LIVE MIC [ACTIVE]', true);
        } else if (lensActive && performance.now() - lensAudioAt < 500) {
            // Real audio from the YT LENS (system loopback tapped by the desktop shell)
            if (freqData.length !== 512) { freqData = new Uint8Array(512); timeData = new Uint8Array(512); }
            freqData.set(lensAudioFreq); timeData.set(lensAudioWave);
            updateAudioMonitorBadge(lensAudioMode === 'direct' ? 'MONITOR: 📡 YT LENS AUDIO · DIRECT [ACTIVE]' : 'MONITOR: 📡 YT LENS AUDIO · SYSTEM [ACTIVE]', true);
        } else if (isSynthRunning) {
            const track = currentSynthTrackIndex >= 0 && synthTracks[currentSynthTrackIndex] ? synthTracks[currentSynthTrackIndex].toUpperCase() : 'SYNTH';
            updateAudioMonitorBadge(`MONITOR: ${track} [ACTIVE]`, true);
        } else if (currentMediaKind === 'capture' && captureStream && !lensActive) {
            updateAudioMonitorBadge('MONITOR: 🖥 SCREEN SHARE [ACTIVE]', true);
        } else if (localAudio && !localAudio.paused) {
            updateAudioMonitorBadge('MONITOR: LOCAL AUDIO [ACTIVE]', true);
        } else if (localVideo && !localVideo.paused && !lensActive) {
            updateAudioMonitorBadge('MONITOR: LOCAL VIDEO [ACTIVE]', true);
        } else if (activeAudioElement && !activeAudioElement.paused) {
            updateAudioMonitorBadge('MONITOR: RAUM · X-R [ACTIVE]', true);
        } else if (currentMediaKind === 'youtube' || (lensActive && currentMediaKind === 'capture')) {
            // High-octane dynamic YouTube audio frequency & waveform synthesizer
            const t = performance.now() * 0.001;
            const N = freqData.length;
            const flux = lensActive ? lensFlux() : 0; // lens audio is not capturable; picture motion drives the pulse
            const beatPhase = (t * 2.166) % 1.0; // 130 BPM cadence
            const kick = Math.min(1, Math.pow(Math.max(0, 1.0 - beatPhase * 3.6), 2.5) * (lensActive ? 0.55 : 1) + flux * 0.8);
            const snare = (Math.floor(t * 2.166) % 2 === 1) ? Math.pow(Math.max(0, 1.0 - ((beatPhase + 0.5) % 1.0) * 4.0), 2) * 0.8 : 0;
            const hihat = Math.pow(Math.max(0, 1.0 - ((t * 8.664) % 1.0) * 3.5), 2) * 0.7 * (lensActive ? 0.6 + flux : 1);
            const bassLfo = 0.5 + 0.5 * Math.sin(t * 4.2);

            for (let i = 0; i < N; i++) {
                const frac = i / N;
                let v = 0;
                if (frac < 0.06) {
                    v = (kick * 0.88 + bassLfo * 0.35) * (1 - frac * 12) * 255;
                } else if (frac < 0.28) {
                    const midWave = Math.sin(t * 12 + i * 0.3) * 0.3 + 0.7;
                    v = (snare * 0.75 + midWave * 0.35 + kick * 0.2) * 210;
                } else if (frac < 0.65) {
                    const trebWave = Math.sin(t * 22 + i * 0.6) * 0.4 + 0.6;
                    v = (hihat * 0.8 + trebWave * 0.25) * 180;
                } else {
                    v = (hihat * 0.45 + Math.random() * 0.15) * 130;
                }
                freqData[i] = Math.max(0, Math.min(255, Math.floor(v)));
            }

            for (let i = 0; i < timeData.length; i++) {
                const ph = (i / timeData.length) * Math.PI * 8;
                const wave = Math.sin(ph + t * 16) * (0.3 + kick * 0.5) +
                             Math.sin(ph * 2.5 + t * 32) * (snare * 0.35) +
                             (Math.random() - 0.5) * (hihat * 0.2);
                timeData[i] = Math.max(0, Math.min(255, Math.floor(128 + wave * 90)));
            }
            updateAudioMonitorBadge('MONITOR: YT SYNC [ACTIVE]', true);
            realAudioActive = true;
        } else if (!realAudioActive) {
            // Standby ambient pulse: Keeps oscilloscope and spectrum gently breathing in idle state
            const t = performance.now() * 0.001;
            const N = freqData.length;
            for (let i = 0; i < N; i++) {
                const frac = i / N;
                freqData[i] = Math.floor((Math.sin(t * 1.5 + frac * 8) * 0.08 + 0.10) * 255);
            }
            for (let i = 0; i < timeData.length; i++) {
                timeData[i] = Math.floor(128 + Math.sin(i * 0.1 + t * 2) * 8);
            }
            updateAudioMonitorBadge('MONITOR: STANDBY', false);
        }

        const N = freqData.length;
        const avg = (startFrac, endFrac) => {
            let sum = 0, count = 0;
            const s = Math.floor(startFrac * N), e = Math.floor(endFrac * N);
            for (let i = s; i < e && i < N; i++) { sum += freqData[i]; count++; }
            return count ? (sum / count / 255) : 0;
        };

        const sub = clamp01(avg(0, 0.04) * eqGains.bass);
        const bass = clamp01(avg(0.04, 0.14) * eqGains.bass);
        const lowMid = clamp01(avg(0.14, 0.28) * eqGains.mid);
        const mid = clamp01(avg(0.28, 0.55) * eqGains.mid);
        const highMid = clamp01(avg(0.55, 0.75) * eqGains.mid);
        const treble = clamp01(avg(0.75, 0.90) * eqGains.treble);
        const brilliance = clamp01(avg(0.90, 1.0) * eqGains.treble);

        let sumSq = 0;
        for (let i = 0; i < N; i++) {
            const v = (timeData[i] - 128) / 128;
            sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / N);
        const drive = clamp01(0.34 * bass + 0.30 * mid + 0.24 * treble + 0.12 * rms);
        const beat = (bass > 0.42 && bass > (lowMid * 1.3)) ? 1.0 : 0.0;

        return {
            sub, bass, lowMid, mid, highMid, treble, brilliance,
            rms, beat, drive, active: true
        };
    }

    function clamp01(v) { return Math.max(0, Math.min(1, +v || 0)); }

    /* ── 3. VISUALIZER HUD: SPECTRUM, OSCILLOSCOPE, STEREO VU ───────────── */
    const specCanvas = document.getElementById('spectrum-canvas');
    const waveCanvas = document.getElementById('waveform-canvas');
    const specCtx = specCanvas ? specCanvas.getContext('2d') : null;
    const waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;
    const vuBarL = document.getElementById('vu-bar-l');
    const vuBarR = document.getElementById('vu-bar-r');

    // Build 12 LED segments for VU meters
    if (vuBarL && vuBarL.children.length === 0) {
        for (let i = 0; i < 12; i++) {
            const seg = document.createElement('div');
            seg.className = `vu-segment ${i >= 10 ? 'red' : i >= 7 ? 'yellow' : 'green'}`;
            vuBarL.appendChild(seg);
        }
    }
    if (vuBarR && vuBarR.children.length === 0) {
        for (let i = 0; i < 12; i++) {
            const seg = document.createElement('div');
            seg.className = `vu-segment ${i >= 10 ? 'red' : i >= 7 ? 'yellow' : 'green'}`;
            vuBarR.appendChild(seg);
        }
    }

    function renderVisualizers() {
        try {
            const energy = getAudioEnergy();
            if (aiWarp) aiWarp.setAudioDrive(energy);

            // 1. Spectrum Analyzer Canvas (Supports 3 Interactive Modes)
            if (specCtx && specCanvas) {
                const w = specCanvas.width;
                const h = specCanvas.height;
                specCtx.fillStyle = '#050510';
                specCtx.fillRect(0, 0, w, h);

                if (spectrumDisplayMode === 0) {
                    // Mode 0: 36 Chromatic Equalizer Bars
                    const numBars = 36;
                    const barWidth = Math.max(2, (w / numBars) - 2);
                    for (let i = 0; i < numBars; i++) {
                        const binIdx = Math.floor((i / numBars) * (freqData.length * 0.85));
                        const val = (freqData[binIdx] || 0) / 255.0;
                        const barH = Math.max(2, val * (h - 6));

                        const grad = specCtx.createLinearGradient(0, h, 0, 0);
                        grad.addColorStop(0, '#00ffaa');
                        grad.addColorStop(0.65, '#00e5ff');
                        grad.addColorStop(1, '#ff007f');
                        specCtx.fillStyle = grad;
                        specCtx.fillRect(i * (barWidth + 2), h - barH, barWidth, barH);
                    }
                } else if (spectrumDisplayMode === 1) {
                    // Mode 1: Bilateral Mirrored Dual Peak
                    const halfBars = 20;
                    const barWidth = Math.max(2, ((w / 2) / halfBars) - 2);
                    const midX = w / 2;
                    for (let i = 0; i < halfBars; i++) {
                        const binIdx = Math.floor((i / halfBars) * (freqData.length * 0.75));
                        const val = (freqData[binIdx] || 0) / 255.0;
                        const barH = Math.max(2, val * (h - 6));
                        specCtx.fillStyle = '#00e5ff';
                        specCtx.fillRect(midX + i * (barWidth + 2), h - barH, barWidth, barH);
                        specCtx.fillStyle = '#ff007f';
                        specCtx.fillRect(midX - (i + 1) * (barWidth + 2), h - barH, barWidth, barH);
                    }
                } else {
                    // Mode 2: Curved Area Wave Fill
                    specCtx.beginPath();
                    specCtx.moveTo(0, h);
                    const points = 48;
                    for (let i = 0; i <= points; i++) {
                        const binIdx = Math.floor((i / points) * (freqData.length * 0.85));
                        const val = (freqData[binIdx] || 0) / 255.0;
                        const y = h - val * (h - 6);
                        specCtx.lineTo((i / points) * w, y);
                    }
                    specCtx.lineTo(w, h);
                    const fillGrad = specCtx.createLinearGradient(0, 0, 0, h);
                    fillGrad.addColorStop(0, 'rgba(0, 255, 170, 0.7)');
                    fillGrad.addColorStop(1, 'rgba(0, 229, 255, 0.05)');
                    specCtx.fillStyle = fillGrad;
                    specCtx.fill();
                    specCtx.strokeStyle = '#00ffaa';
                    specCtx.lineWidth = 1.5;
                    specCtx.stroke();
                }
            }

            // 2. Waveform Oscilloscope Canvas (Supports 3 Interactive Modes)
            if (waveCtx && waveCanvas) {
                const w = waveCanvas.width;
                const h = waveCanvas.height;
                waveCtx.fillStyle = 'rgba(5, 5, 16, 0.85)';
                waveCtx.fillRect(0, 0, w, h);

                if (waveformDisplayMode === 0) {
                    // Mode 0: Classic Cyan Beam
                    waveCtx.strokeStyle = '#00e5ff';
                    waveCtx.lineWidth = 1.5;
                    waveCtx.beginPath();
                    const len = timeData.length;
                    const sliceW = w / len;
                    for (let i = 0; i < len; i++) {
                        const v = timeData[i] / 128.0;
                        const y = (v * h) / 2;
                        if (i === 0) waveCtx.moveTo(0, y);
                        else waveCtx.lineTo(i * sliceW, y);
                    }
                    waveCtx.stroke();
                } else if (waveformDisplayMode === 1) {
                    // Mode 1: Dual-Trace Phosphor (Cyan + Magenta persistence)
                    const len = timeData.length;
                    const sliceW = w / len;
                    // Cyan trace
                    waveCtx.strokeStyle = 'rgba(0, 229, 255, 0.9)';
                    waveCtx.lineWidth = 1.5;
                    waveCtx.beginPath();
                    for (let i = 0; i < len; i++) {
                        const y = ((timeData[i] / 128.0) * h) / 2;
                        if (i === 0) waveCtx.moveTo(0, y);
                        else waveCtx.lineTo(i * sliceW, y);
                    }
                    waveCtx.stroke();
                    // Magenta echo trace
                    waveCtx.strokeStyle = 'rgba(255, 0, 127, 0.45)';
                    waveCtx.lineWidth = 1;
                    waveCtx.beginPath();
                    for (let i = 0; i < len; i++) {
                        const y = (((timeData[(i + 4) % len] / 128.0) * h) / 2) + 2;
                        if (i === 0) waveCtx.moveTo(0, y);
                        else waveCtx.lineTo(i * sliceW, y);
                    }
                    waveCtx.stroke();
                } else {
                    // Mode 2: Lissajous Phase Orbit
                    const cx = w / 2, cy = h / 2;
                    waveCtx.strokeStyle = '#00ffaa';
                    waveCtx.lineWidth = 1.5;
                    waveCtx.beginPath();
                    const pts = Math.min(128, timeData.length);
                    for (let i = 0; i < pts; i++) {
                        const xNorm = (timeData[i] - 128) / 128;
                        const yNorm = (timeData[(i + 32) % pts] - 128) / 128;
                        const px = cx + xNorm * (w * 0.45);
                        const py = cy + yNorm * (h * 0.45);
                        if (i === 0) waveCtx.moveTo(px, py);
                        else waveCtx.lineTo(px, py);
                    }
                    waveCtx.closePath();
                    waveCtx.stroke();
                }
            }

            // 3. Stereo VU Meters (Ballistic drive meter)
            if (vuBarL && vuBarR) {
                const lVal = Math.round(energy.drive * 12);
                const rVal = Math.round(clamp01(energy.drive * 1.05 + energy.bass * 0.15) * 12);
                const segsL = vuBarL.children;
                const segsR = vuBarR.children;
                for (let i = 0; i < 12; i++) {
                    if (segsL[i]) segsL[i].classList.toggle('active', i < lVal);
                    if (segsR[i]) segsR[i].classList.toggle('active', i < rVal);
                }
            }
        } catch(err) {
            console.warn('renderVisualizers frame error:', err);
        }

        requestAnimationFrame(renderVisualizers);
    }

    // Interactive Visualizer Mode Switchers (Click to Cycle Modes)
    if (specCanvas) {
        specCanvas.style.cursor = 'pointer';
        specCanvas.onclick = () => {
            spectrumDisplayMode = (spectrumDisplayMode + 1) % 3;
            const names = ['36 BARS', 'DUAL PEAK MIRROR', 'CURVED AREA FILL'];
            showHudNotification(`SPECTRUM ANALYZER: ${names[spectrumDisplayMode]}`);
        };
    }

    if (waveCanvas) {
        waveCanvas.style.cursor = 'pointer';
        waveCanvas.onclick = () => {
            waveformDisplayMode = (waveformDisplayMode + 1) % 3;
            const names = ['CYAN OSCILLOSCOPE', 'DUAL TRACE PHOSPHOR', 'LISSAJOUS PHASE ORBIT'];
            showHudNotification(`OSCILLOSCOPE: ${names[waveformDisplayMode]}`);
        };
    }

    // Kick off visualizer animation loop
    requestAnimationFrame(renderVisualizers);
    /* ── 4. YOUTUBE KNOWLEDGEBASE & RANDOMS ENGINE ───────────────────────── */
    const ytPrevBtn = document.getElementById('ytPrevBtn');
    const ytRandomBtn = document.getElementById('ytRandomBtn');
    const ytNextBtn = document.getElementById('ytNextBtn');
    const ytStatusBadge = document.getElementById('ytStatusBadge');
    const ytUrlInput = document.getElementById('ytUrlInput');
    const ytPlayerMount = document.getElementById('ytPlayerMount');
    const ytWarpShell = document.getElementById('ytWarpShell');
    const ytExtractPlaylistBtn = document.getElementById('ytExtractPlaylistBtn');
    const ytKbModalBtn = document.getElementById('ytKbModalBtn');

    // YouTube Knowledgebase Modal Elements
    const ytKbModal = document.getElementById('ytKbModal');
    const ytKbCloseBtn = document.getElementById('ytKbCloseBtn');
    const ytKbTotalCount = document.getElementById('ytKbTotalCount');
    const ytKbPlaylistCount = document.getElementById('ytKbPlaylistCount');
    const ytKbUserCount = document.getElementById('ytKbUserCount');
    const ytKbInput = document.getElementById('ytKbInput');
    const ytKbAddBtn = document.getElementById('ytKbAddBtn');
    const ytKbExtractBtn = document.getElementById('ytKbExtractBtn');
    const ytKbSearchInput = document.getElementById('ytKbSearchInput');
    const ytKbSourceFilter = document.getElementById('ytKbSourceFilter');
    const ytKbPlayRandomBtn = document.getElementById('ytKbPlayRandomBtn');
    const ytKbList = document.getElementById('ytKbList');
    const ytKbExportBtn = document.getElementById('ytKbExportBtn');
    const ytKbImportBtn = document.getElementById('ytKbImportBtn');
    const ytKbImportFile = document.getElementById('ytKbImportFile');
    const ytKbResetBtn = document.getElementById('ytKbResetBtn');
    const ytKbClearBtn = document.getElementById('ytKbClearBtn');

    class YouTubeKnowledgebase {
        constructor(initialCurated = []) {
            this.STORAGE_KEY = 'ai_warp_youtube_kb_v2';
            this.items = [];
            this.playlists = [];
            this.defaultCurated = (initialCurated && initialCurated.length > 0) ? initialCurated : [
                { id: 'u4TPBkN0vIc', title: '4K 60FPS Fractal Journey & Cosmic Geometry', source: 'curated' },
                { id: 'gopYmb38DgM', title: 'Cyberpunk Neon Metropolis Synthwave Drift', source: 'curated' },
                { id: 'jmEAP7aGo0o', title: 'DEFCON 1 Visualizer — Glitch Matrix Overdrive', source: 'curated' },
                { id: 'uvSXL6ypLlw', title: 'Darksynth Cybernetic Glitch Protocol', source: 'curated' },
                { id: 'NpSTV8WJATc', title: 'Retrowave Analog Dreams & Midnight Horizon', source: 'curated' },
                { id: '8o6bdTOhIyE', title: 'Ambient Tape Decay & Lo-Fi Memory Loop', source: 'curated' },
                { id: 'KlcsGjI6Jms', title: 'Night City Cyber Grid & Hologram Stream', source: 'curated' },
                { id: 'B1CL4PqHh9k', title: 'Moonlight Sonata Synthesized Tape Artifacts', source: 'curated' },
                { id: 'QsUmvGkXhnk', title: '8-Bit Chiptune Glitch Dimension', source: 'curated' },
                { id: 'RgFaK6ZQifE', title: 'Electronic Warp Dimension & Prism Spectrum', source: 'curated' },
                { id: 'kCP2xZvhJk0', title: 'Abstract Hyperspace Topological Distortion', source: 'curated' },
                { id: 'DmStNF35o1w', title: 'Underground Berlin Acid Techno Visuals', source: 'curated' },
                { id: 'SP2MeG95-Ko', title: 'Amiga Demoscene Realtime Shaders', source: 'curated' },
                { id: 'fzTOv2R9jBw', title: 'VHS Aesthetic Tracking Tape Glitch', source: 'curated' },
                { id: 'vnyLtdufSbE', title: 'Lofi Cyber Beats & Tokyo Rain Neon', source: 'curated' },
                { id: 'R1UlclDAmwg', title: 'Glitch Core Cybernetic Breakcore Sync', source: 'curated' }
            ];
            this.init();
        }

        init() {
            let loaded = false;
            try {
                if (typeof localStorage !== 'undefined') {
                    const raw = localStorage.getItem(this.STORAGE_KEY);
                    if (raw) {
                        const data = JSON.parse(raw);
                        if (data && Array.isArray(data.items)) {
                            this.items = data.items;
                            this.playlists = Array.isArray(data.playlists) ? data.playlists : [];
                            loaded = true;
                        }
                    }
                }
            } catch (e) {
                console.warn('Could not load YouTube Knowledgebase from storage:', e);
            }

            if (!loaded || this.items.length === 0) {
                this.items = this.defaultCurated.map(x => ({
                    id: x.id,
                    title: x.title,
                    source: 'curated',
                    playlistId: null,
                    dateAdded: Date.now(),
                    playCount: 0
                }));
                this.playlists = [];
                this.save();
            } else {
                // Ensure all default curated links are preserved in knowledgebase
                this.defaultCurated.forEach(seed => {
                    if (!this.items.some(it => it.id === seed.id)) {
                        this.items.push({
                            id: seed.id,
                            title: seed.title,
                            source: 'curated',
                            playlistId: null,
                            dateAdded: Date.now(),
                            playCount: 0
                        });
                    }
                });
                this.save();
            }

            this.updateBadge();
        }

        save() {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                        version: 2,
                        items: this.items,
                        playlists: this.playlists
                    }));
                }
            } catch (e) {
                console.warn('Failed to save YouTube Knowledgebase:', e);
            }
            ytPool = this.items;
            this.updateBadge();
            this.updateStats();
        }

        updateBadge() {
            if (ytKbModalBtn) {
                ytKbModalBtn.textContent = `📚 KB: [${this.items.length}]`;
                ytKbModalBtn.title = `YouTube Knowledgebase: ${this.items.length} random links stored in browser`;
            }
        }

        updateStats() {
            if (ytKbTotalCount) ytKbTotalCount.textContent = `TOTAL STORED: ${this.items.length} LINKS`;
            if (ytKbPlaylistCount) ytKbPlaylistCount.textContent = `PLAYLISTS: ${this.playlists.length}`;
            if (ytKbUserCount) {
                const userCount = this.items.filter(x => x.source === 'user' || x.source === 'pasted').length;
                ytKbUserCount.textContent = `USER ADDED: ${userCount}`;
            }
        }

        parseInput(inputStr) {
            if (!inputStr) return { videoIds: [], playlistIds: [] };
            inputStr = String(inputStr).trim();

            const playlistIds = [];
            const videoIds = [];

            // 1. Extract playlist IDs
            const plRegex = /(?:list=|\/playlist\?list=|^)([a-zA-Z0-9_-]{12,42})/g;
            let pm;
            while ((pm = plRegex.exec(inputStr)) !== null) {
                const pid = pm[1];
                if (pid.startsWith('PL') || pid.startsWith('UU') || pid.startsWith('FL') || pid.startsWith('RD') || pid.startsWith('OLAK5uy_') || pid.length >= 18) {
                    if (!playlistIds.includes(pid)) playlistIds.push(pid);
                }
            }

            // 2. Extract 11-char video IDs
            const vidRegex = /(?:watch\?v=|youtu\.be\/|embed\/|\/v\/|^)([a-zA-Z0-9_-]{11})(?:[?&/#\s]|$)/g;
            let vm;
            while ((vm = vidRegex.exec(inputStr)) !== null) {
                const vid = vm[1];
                if (!videoIds.includes(vid) && !vid.startsWith('PL') && !playlistIds.includes(vid)) {
                    videoIds.push(vid);
                }
            }

            return { videoIds, playlistIds };
        }

        addVideo(id, title = null, source = 'user', playlistId = null) {
            if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;

            let existing = this.items.find(x => x.id === id);
            if (existing) {
                if (title && (!existing.title || existing.title.startsWith('YouTube ·') || existing.title.startsWith('Custom:'))) {
                    existing.title = title;
                }
                if (playlistId && !existing.playlistId) existing.playlistId = playlistId;
                if (source !== 'curated') existing.source = source;
                this.save();
                return existing;
            }

            const item = {
                id,
                title: title || `YouTube · ${id}`,
                source: source || 'user',
                playlistId: playlistId || null,
                dateAdded: Date.now(),
                playCount: 0
            };

            this.items.unshift(item);
            this.save();

            // Background metadata fetch via YouTube oEmbed
            if (typeof fetch !== 'undefined' && (!title || title.startsWith('YouTube ·') || title.startsWith('Custom:'))) {
                fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}&format=json`)
                    .then(r => r.json())
                    .then(data => {
                        if (data && data.title) {
                            item.title = data.title;
                            item.author = data.author_name;
                            this.save();
                            this.renderList();
                        }
                    })
                    .catch(() => {});
            }

            return item;
        }

        removeVideo(id) {
            this.items = this.items.filter(x => x.id !== id);
            this.save();
            this.renderList();
        }

        getRandomVideo(currentId = null, playlistIdFilter = null) {
            let pool = this.items;
            if (playlistIdFilter) {
                const filtered = pool.filter(x => x.playlistId === playlistIdFilter);
                if (filtered.length > 0) pool = filtered;
            }
            if (pool.length === 0) return null;

            let picked;
            let attempts = 0;
            do {
                picked = pool[Math.floor(Math.random() * pool.length)];
                attempts++;
            } while (picked.id === currentId && attempts < 10 && pool.length > 1);

            picked.playCount = (picked.playCount || 0) + 1;
            this.save();
            return picked;
        }

        async extractPlaylist(playlistId, optionalTitle = null) {
            if (!playlistId) return null;
            showHudNotification(`🔍 EXTRACTING PLAYLIST: ${playlistId}...`);

            const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
            const proxies = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
                `https://corsproxy.io/?url=${encodeURIComponent(rssUrl)}`,
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`
            ];

            let extracted = [];
            let plTitle = optionalTitle || `Playlist ${playlistId}`;

            // 1. Try public RSS proxies
            if (typeof fetch !== 'undefined') {
                for (const url of proxies) {
                    try {
                        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
                        if (res.ok) {
                            const text = await res.text();
                            const vids = [...text.matchAll(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/g)].map(m => m[1]);
                            const titles = [...text.matchAll(/<title>(.*?)<\/title>/g)].map(m => m[1]);
                            if (vids.length > 0) {
                                if (titles[0] && !optionalTitle) plTitle = titles[0];
                                vids.forEach((vid, idx) => {
                                    const vTitle = titles[idx + 1] || `Track #${idx + 1}`;
                                    const it = this.addVideo(vid, vTitle, 'playlist', playlistId);
                                    if (it) extracted.push(it);
                                });
                                break;
                            }
                        }
                    } catch (e) {}
                }
            }

            // 2. Save playlist record into Knowledgebase
            const plEntry = {
                id: playlistId,
                title: plTitle,
                videoCount: extracted.length || 0,
                dateExtracted: Date.now()
            };
            this.playlists = this.playlists.filter(p => p.id !== playlistId);
            this.playlists.unshift(plEntry);
            this.save();
            this.renderList();

            if (extracted.length > 0) {
                showHudNotification(`✨ EXTRACTED ${extracted.length} VIDEOS FROM PLAYLIST! TOTAL: ${this.items.length} LINKS`);
            } else {
                showHudNotification(`PLAYLIST REGISTERED: ${playlistId} (QUEUED FOR EMBED PLAYBACK)`);
            }

            return { playlistId, title: plTitle, items: extracted };
        }

        renderList() {
            if (!ytKbList) return;
            const searchTerm = (ytKbSearchInput ? ytKbSearchInput.value : '').toLowerCase().trim();
            const sourceFilter = ytKbSourceFilter ? ytKbSourceFilter.value : 'all';

            let filtered = this.items.filter(item => {
                if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
                if (searchTerm) {
                    const matchTitle = (item.title || '').toLowerCase().includes(searchTerm);
                    const matchId = (item.id || '').toLowerCase().includes(searchTerm);
                    const matchPl = (item.playlistId || '').toLowerCase().includes(searchTerm);
                    if (!matchTitle && !matchId && !matchPl) return false;
                }
                return true;
            });

            this.updateStats();

            if (filtered.length === 0) {
                ytKbList.innerHTML = `<div style="text-align:center; padding:30px; color:var(--theme-sub); font-size:12px;">No matching YouTube links in Knowledgebase.</div>`;
                return;
            }

            const activeVideoId = (ytHistoryIndex >= 0 && ytHistory[ytHistoryIndex]) ? ytHistory[ytHistoryIndex].id : null;

            ytKbList.innerHTML = filtered.map(item => {
                const isActive = item.id === activeVideoId;
                const sourceBadge = `<span class="yt-kb-source-badge ${item.source}">${item.source}${item.playlistId ? ' · PL' : ''}</span>`;
                const playInfo = item.playCount ? `· Played ${item.playCount}x` : '';
                return `
                    <div class="yt-kb-item ${isActive ? 'active-playing' : ''}" data-id="${item.id}">
                        <img class="yt-kb-thumb" src="https://i.ytimg.com/vi/${item.id}/mqdefault.jpg" alt="${item.id}" loading="lazy" onerror="this.style.opacity='0.2'">
                        <div class="yt-kb-info">
                            <div class="yt-kb-title" title="${item.title || item.id}">${item.title || item.id}</div>
                            <div class="yt-kb-meta">
                                ${sourceBadge}
                                <span>ID: ${item.id}</span>
                                <span>${playInfo}</span>
                            </div>
                        </div>
                        <div class="yt-kb-item-actions">
                            <button class="wired-button kb-play-item-btn" data-id="${item.id}" title="Play Video Now">▶ PLAY</button>
                            <button class="wired-button kb-copy-item-btn" data-id="${item.id}" title="Copy Link">📋</button>
                            <button class="wired-button danger-btn kb-del-item-btn" data-id="${item.id}" title="Remove from Knowledgebase">✕</button>
                        </div>
                    </div>
                `;
            }).join('');

            // Attach event listeners for each item
            ytKbList.querySelectorAll('.kb-play-item-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const it = this.items.find(x => x.id === id);
                    if (it) {
                        ytHistory.push(it);
                        ytHistoryIndex = ytHistory.length - 1;
                        loadYouTube(it);
                        showHudNotification(`PLAYING FROM KB: ${it.title || it.id}`);
                        this.renderList();
                    }
                });
            });

            ytKbList.querySelectorAll('.kb-copy-item-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const url = `https://www.youtube.com/watch?v=${id}`;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(url).then(() => showHudNotification(`COPIED: ${url}`));
                    }
                });
            });

            ytKbList.querySelectorAll('.kb-del-item-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    this.removeVideo(id);
                });
            });
        }

        resetToCurated() {
            if (confirm("Reset YouTube Knowledgebase back to curated defaults? Custom and extracted links will be cleared.")) {
                this.items = this.defaultCurated.map(x => ({
                    id: x.id,
                    title: x.title,
                    source: 'curated',
                    playlistId: null,
                    dateAdded: Date.now(),
                    playCount: 0
                }));
                this.playlists = [];
                this.save();
                this.renderList();
                showHudNotification("KNOWLEDGEBASE RESET TO 16 CURATED DEFAULTS");
            }
        }

        clearCustom() {
            if (confirm("Clear all custom user and playlist links? Curated default links will remain.")) {
                this.items = this.items.filter(x => x.source === 'curated');
                this.playlists = [];
                this.save();
                this.renderList();
                showHudNotification("CLEARED CUSTOM LINKS FROM KNOWLEDGEBASE");
            }
        }

        exportJson() {
            const dataStr = JSON.stringify({
                version: 2,
                exportedAt: new Date().toISOString(),
                totalItems: this.items.length,
                playlists: this.playlists,
                items: this.items
            }, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `youtube_knowledgebase_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showHudNotification(`EXPORTED ${this.items.length} LINKS AS JSON`);
        }

        importJson(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    let importedCount = 0;
                    if (data && Array.isArray(data.items)) {
                        data.items.forEach(it => {
                            if (it && it.id && /^[a-zA-Z0-9_-]{11}$/.test(it.id)) {
                                this.addVideo(it.id, it.title, it.source || 'user', it.playlistId);
                                importedCount++;
                            }
                        });
                        if (Array.isArray(data.playlists)) {
                            data.playlists.forEach(pl => {
                                if (pl && pl.id && !this.playlists.some(p => p.id === pl.id)) {
                                    this.playlists.push(pl);
                                }
                            });
                        }
                        this.save();
                        this.renderList();
                        showHudNotification(`IMPORTED ${importedCount} LINKS INTO KNOWLEDGEBASE!`);
                    } else {
                        alert("Invalid JSON format. Expected { items: [...] }");
                    }
                } catch (err) {
                    alert("Error parsing JSON file: " + err.message);
                }
            };
            reader.readAsText(file);
        }
    }

    // Initialize Knowledgebase and sync initial pool
    const ytKb = new YouTubeKnowledgebase(ytPool);
    window.ytKb = ytKb;
    ytPool = ytKb.items;

    // Playback body classes consumed by the R3 factories (ytLive/localVid branches)
    // and the YouTube Warp Bus — these were previously never toggled, which left
    // the YouTube feed outside the effects pipeline.
    function syncPlaybackClasses(kind) {
        const b = document.body.classList;
        b.toggle('playback-on', kind === 'youtube' || kind === 'video' || kind === 'audio' || kind === 'pole-r' || kind === 'capture');
        b.toggle('local-video', kind === 'video' || kind === 'capture'); // capture feeds real frames through the same localVideo element
        b.toggle('youtube-feed', kind === 'youtube');
        b.toggle('capture-feed', kind === 'capture');
    }

    // ── SCREEN / WINDOW / TAB CAPTURE (getDisplayMedia) ─────────────────────
    // Captured frames use the Canvas pipeline while shared audio and the
    // independently enabled microphone both feed the analyser only.
    // Embedded YouTube cannot be sampled by Canvas. For full original FX, the user
    // captures the same video from a separate YouTube tab/window. Pause the embedded
    // copy during capture to avoid doubled audio; resume it when capture stops.
    function commandEmbeddedYouTube(command) {
        const frame = ytPlayerMount && ytPlayerMount.querySelector('#ytIframe');
        if (!frame || !frame.contentWindow) return;
        try {
            frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), 'https://www.youtube-nocookie.com');
        } catch (e) { /* player may not have initialized its API yet */ }
    }

    function stopTabCapture(notify = true) {
        const wasActive = !!captureStream;
        const returnToYouTube = captureReturnToYouTube;
        if (captureStream) {
            captureStream.getTracks().forEach(tr => tr.stop());
            captureStream = null;
        }
        if (captureSourceNode) { try { captureSourceNode.disconnect(); } catch (e) {} captureSourceNode = null; }
        if (captureGainNode) { try { captureGainNode.disconnect(); } catch (e) {} captureGainNode = null; }
        if (localVideo) {
            try { localVideo.pause(); } catch (e) {}
            if (localVideo.srcObject) localVideo.srcObject = null;
            localVideo.muted = false; // hand the element back to local-file playback
        }
        const capBtn = document.getElementById('ytCaptureTabBtn');
        if (capBtn) { capBtn.classList.remove('capture-active'); capBtn.textContent = '🖥 SHARE SCREEN / WINDOW'; }
        if (currentMediaKind === 'capture') {
            currentMediaKind = returnToYouTube ? 'youtube' : null;
            syncPlaybackClasses(currentMediaKind);
            if (aiWarp) aiWarp.setSourceMode(returnToYouTube ? 'youtube' : 'generative');
            if (returnToYouTube) commandEmbeddedYouTube('playVideo');
        }
        if (wasActive) captureReturnToYouTube = false;
        if (lensActive && wasActive) { lensActive = false; try { lensBridge.postMessage('lens:frames|stop'); lensBridge.postMessage('lens:close'); } catch (e) {} }
        if (wasActive) lensFrameCanvas = null;
        if (wasActive && notify) {
            showHudNotification(returnToYouTube
                ? '🖥 SCREEN CAPTURE STOPPED — YouTube canvas feed restored'
                : '🖥 SCREEN CAPTURE STOPPED — returning to generative field');
        }
    }

    function openLensFrameStream() {
        const cv = document.createElement('canvas');
        cv.width = 960; cv.height = 540;
        const cx = cv.getContext('2d');
        cx.fillStyle = '#000'; cx.fillRect(0, 0, cv.width, cv.height);
        lensFrameCanvas = cv;
        lensFrameBusy = false;
        const s = cv.captureStream(30);
        lensBridge.postMessage('lens:frames|start');
        return Promise.resolve(s);
    }

    async function startTabCapture(fromLens = false) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            showHudNotification('🖥 SCREEN CAPTURE NOT SUPPORTED HERE — use a secure page in a supported browser');
            return;
        }
        captureReturnToYouTube = fromLens === true ? false : currentMediaKind === 'youtube';
        let stream;
        try {
            stream = fromLens === true ? await openLensFrameStream()
                : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } catch (err) {
            captureReturnToYouTube = false;
            if (err && err.name !== 'NotAllowedError') {
                console.warn('Screen capture error:', err);
                showHudNotification('🖥 SCREEN CAPTURE FAILED — check browser permissions');
            } else {
                showHudNotification('🖥 SCREEN CAPTURE CANCELLED / DENIED');
            }
            return;
        }
        const wasYouTubeSource = captureReturnToYouTube;
        if (wasYouTubeSource) commandEmbeddedYouTube('pauseVideo');
        pauseAllOtherMedia();
        captureStream = stream;

        // Video frames → reuse #localVideo so engine drawCover + R3 factories sample real pixels
        localVideo.muted = true; // audio is analyzed via Web Audio only — never double-played
        localVideo.srcObject = stream;
        try { await localVideo.play(); } catch (e) { console.warn('capture play notice:', e); }
        if (aiWarp) {
            // Captured frames are same-origin MediaStream video, so restore the original
            // full pixel-processing path (not the limited cross-origin YouTube CSS bus).
            aiWarp.setSourceMode('video', localVideo);
            aiWarp.setAiWarpActive(true);
            if (aiWarp.aiWarpStrength <= 0.01) aiWarp.setAiWarpStrength(0.65);
        }

        // Teardown when the user hits the browser's "Stop sharing" or closes the tab
        const vTrack = stream.getVideoTracks()[0];
        if (vTrack) vTrack.addEventListener('ended', () => stopTabCapture(true));

        // Audio → analyser (real audio-reactive voices replace the synthetic YT cadence)
        let hasAudio = stream.getAudioTracks().length > 0;
        if (hasAudio) {
            try {
                initAudioContext();
                if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
                if (audioCtx && masterAnalyser) {
                    captureSourceNode = audioCtx.createMediaStreamSource(stream);
                    captureGainNode = audioCtx.createGain();
                    captureGainNode.gain.value = 1.0;
                    captureSourceNode.connect(captureGainNode);
                    captureGainNode.connect(masterAnalyser); // analysis only — no destination
                }
            } catch (e) { console.warn('capture audio routing notice:', e); hasAudio = false; }
        }

        currentMediaKind = 'capture';
        syncPlaybackClasses('capture');
        const capBtn = document.getElementById('ytCaptureTabBtn');
        if (capBtn) { capBtn.classList.add('capture-active'); capBtn.textContent = '🖥 SCREEN: LIVE'; }
        showHudNotification(hasAudio
            ? '🖥 FULL AI WARP FX LIVE — captured YouTube pixels + shared audio drive the original Canvas engine'
            : '🖥 FULL AI WARP FX LIVE — captured pixels active; enable tab audio in the picker for audio-reactive FX');
    }
    window.stopTabCapture = stopTabCapture;

    function pauseAllOtherMedia() {
        syncPlaybackClasses(null);
        stopTabCapture(false);
        stopSyntheticAudio();
        if (activeAudioElement && typeof activeAudioElement.pause === 'function') activeAudioElement.pause();
        document.querySelectorAll('#poleR-grid .poleR-play-btn').forEach(b => { b.textContent = 'PLAY ▶'; });
        if (localAudio && typeof localAudio.pause === 'function') localAudio.pause();
        if (localVideo && typeof localVideo.pause === 'function') localVideo.pause();
        const transport = document.getElementById('mediaTransportBar');
        if (transport) transport.style.display = 'none';
        if (artworkSlideshowTimer) { clearInterval(artworkSlideshowTimer); artworkSlideshowTimer = null; }
    }

    function updateYouTubeUi() {
        if (ytPrevBtn) ytPrevBtn.disabled = ytHistoryIndex <= 0;
        if (ytNextBtn) ytNextBtn.textContent = (ytHistoryIndex < ytHistory.length - 1) ? 'NEXT ⮞' : 'RANDOM 🎲';

        if (ytStatusBadge && ytHistoryIndex >= 0 && ytHistory[ytHistoryIndex]) {
            const cur = ytHistory[ytHistoryIndex];
            ytStatusBadge.textContent = `[${ytHistoryIndex + 1}/${ytHistory.length}] ${cur.title || cur.id}`;
            ytStatusBadge.title = cur.title || cur.id;
        }
        if (ytKb) ytKb.updateBadge();
    }

    // ── YT LENS (desktop app only) ──────────────────────────────────────────
    // The cross-origin YouTube iframe cannot be read by the canvas, so inside the app the video plays in a
    // separate "AI WARP LENS" window which is captured (auto-selected) and fed through the full canvas pipeline.
    async function loadYouTubeViaLens(videoObj, embedUrl) {
        if (ytUrlInput) {
            const listStr = videoObj.playlistId ? `&list=${videoObj.playlistId}` : '';
            ytUrlInput.value = `https://www.youtube.com/watch?v=${videoObj.id}${listStr}`;
        }
        if (lensActive && captureStream) {
            lensBridge.postMessage('lens:open|' + embedUrl);
            return true;
        }
        pauseAllOtherMedia();
        lensBridge.postMessage('lens:open|' + embedUrl);
        await new Promise(r => setTimeout(r, 2500)); // the lens window must exist before it can be captured
        lensActive = true;
        captureReturnToYouTube = false;
        await startTabCapture(true);
        if (!captureStream) { lensActive = false; lensBridge.postMessage('lens:close'); return false; }
        showHudNotification('YT LENS LIVE: real YouTube pixels now drive all 34 voices + 29 warp modes');
        updateYouTubeUi();
        return true;
    }

    function loadYouTube(videoObj) {
        if (!videoObj || !videoObj.id) return;
        if (lensBridge && !lensFailed) {
            const plp = videoObj.playlistId ? `&list=${videoObj.playlistId}` : `&playlist=${videoObj.id}`;
            const embed = `https://www.youtube-nocookie.com/embed/${videoObj.id}?autoplay=1&enablejsapi=1&playsinline=1&controls=1&rel=0&modestbranding=1&loop=1${plp}`;
            loadYouTubeViaLens(videoObj, embed).then((ok) => {
                if (!ok) { lensFailed = true; showHudNotification('YT LENS UNAVAILABLE — using the in-page player'); loadYouTube(videoObj); }
            });
            return;
        }
        pauseAllOtherMedia();
        currentMediaKind = 'youtube';
        syncPlaybackClasses('youtube');

        // Mount iframe
        const plParam = videoObj.playlistId ? `&list=${videoObj.playlistId}` : `&playlist=${videoObj.id}`;
        if (ytPlayerMount) {
            ytPlayerMount.innerHTML = `
                <iframe id="ytIframe"
                    src="https://www.youtube-nocookie.com/embed/${videoObj.id}?autoplay=1&enablejsapi=1&playsinline=1&controls=1&rel=0&modestbranding=1&loop=1${plParam}"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowfullscreen>
                </iframe>
            `;
        }
        if (ytWarpShell) ytWarpShell.style.display = 'block';

        if (ytUrlInput) {
            const listStr = videoObj.playlistId ? `&list=${videoObj.playlistId}` : '';
            ytUrlInput.value = `https://www.youtube.com/watch?v=${videoObj.id}${listStr}`;
        }

        if (aiWarp) {
            aiWarp.setSourceMode('youtube');
        }

        if (!ytWarpBusToastShown) {
            ytWarpBusToastShown = true;
            showHudNotification('YOUTUBE EMBED: AI Warp modes process active voice-canvas graphics. Enable one or more voice rails; capture the source tab to process actual video pixels.');
        }

        updateYouTubeUi();
        if (ytKbModal && ytKbModal.classList.contains('open')) {
            ytKb.renderList();
        }
    }

    function playRandomYouTube() {
        const currentId = (ytHistoryIndex >= 0 && ytHistory[ytHistoryIndex]) ? ytHistory[ytHistoryIndex].id : null;
        const nextVideo = ytKb.getRandomVideo(currentId);
        if (!nextVideo) return;

        ytHistory.push(nextVideo);
        ytHistoryIndex = ytHistory.length - 1;
        loadYouTube(nextVideo);
        showHudNotification(`RANDOM ROLL [${ytKb.items.length} in KB]: ${nextVideo.title || nextVideo.id}`);
    }

    function prevYouTube() {
        if (ytHistoryIndex > 0) {
            ytHistoryIndex--;
            loadYouTube(ytHistory[ytHistoryIndex]);
        }
    }

    function nextYouTube() {
        if (ytHistoryIndex < ytHistory.length - 1) {
            ytHistoryIndex++;
            loadYouTube(ytHistory[ytHistoryIndex]);
        } else {
            playRandomYouTube();
        }
    }

    if (ytPrevBtn) ytPrevBtn.addEventListener('click', prevYouTube);
    if (ytNextBtn) ytNextBtn.addEventListener('click', nextYouTube);
    if (ytRandomBtn) ytRandomBtn.addEventListener('click', playRandomYouTube);

    const ytLoadBtn = document.getElementById('ytLoadBtn');
    const ytPlaylistBtn = document.getElementById('ytPlaylistBtn');
    async function loadEnteredYouTubeUrl() {
        if (!ytUrlInput) return;
        const raw = ytUrlInput.value || '';
        const parsed = ytKb.parseInput(raw);

        // If playlist detected, extract and remember it!
        let extractedPlaylist = null;
        if (parsed.playlistIds.length > 0) {
            extractedPlaylist = parsed.playlistIds[0];
            ytKb.extractPlaylist(extractedPlaylist);
        }

        // If video ID detected:
        if (parsed.videoIds.length > 0) {
            const primaryId = parsed.videoIds[0];
            const stored = ytKb.addVideo(primaryId, null, 'user', extractedPlaylist);
            // Also store any other video IDs from batch paste!
            for (let i = 1; i < parsed.videoIds.length; i++) {
                ytKb.addVideo(parsed.videoIds[i], null, 'user', extractedPlaylist);
            }
            ytHistory.push(stored);
            ytHistoryIndex = ytHistory.length - 1;
            loadYouTube(stored);
            showHudNotification(`SAVED TO KB & PLAYING: https://youtu.be/${primaryId}`);
        } else if (extractedPlaylist) {
            // Only a playlist link was given
            showHudNotification(`EXTRACTING PLAYLIST: ${extractedPlaylist}`);
            const res = await ytKb.extractPlaylist(extractedPlaylist);
            if (res && res.items && res.items.length > 0) {
                const picked = res.items[Math.floor(Math.random() * res.items.length)];
                ytHistory.push(picked);
                ytHistoryIndex = ytHistory.length - 1;
                loadYouTube(picked);
                showHudNotification(`🎲 REROLLED FROM EXTRACTED PLAYLIST: ${picked.title || picked.id}`);
            } else {
                // Mount playlist directly in player
                pauseAllOtherMedia();
                currentMediaKind = 'youtube';
                syncPlaybackClasses('youtube');
                if (ytPlayerMount) {
                    ytPlayerMount.innerHTML = `
                        <iframe id="ytIframe"
                            src="https://www.youtube-nocookie.com/embed?listType=playlist&list=${extractedPlaylist}&autoplay=1&enablejsapi=1&playsinline=1&controls=1"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowfullscreen>
                        </iframe>
                    `;
                }
                if (ytWarpShell) ytWarpShell.style.display = 'block';
                if (aiWarp) aiWarp.setSourceMode('youtube');
                updateYouTubeUi();
            }
        } else {
            alert('Please enter a valid YouTube video URL, playlist link, or 11-character video ID');
        }
    }

    if (ytLoadBtn) ytLoadBtn.addEventListener('click', loadEnteredYouTubeUrl);
    if (ytPlaylistBtn) {
        ytPlaylistBtn.addEventListener('click', () => {
            if (!ytUrlInput) return;
            ytUrlInput.value = 'https://www.youtube.com/playlist?list=PLGQdK_CU4B7w';
            loadEnteredYouTubeUrl();
        });
    }

    if (ytUrlInput) {
        ytUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                loadEnteredYouTubeUrl();
            }
        });
    }

    // Extract Playlist Button
    if (ytExtractPlaylistBtn) {
        ytExtractPlaylistBtn.addEventListener('click', async () => {
            let val = ytUrlInput ? ytUrlInput.value.trim() : '';
            let parsed = ytKb.parseInput(val);
            if (parsed.playlistIds.length === 0) {
                val = prompt("Enter a YouTube Playlist URL or Playlist ID to extract into Knowledgebase:", "https://www.youtube.com/playlist?list=PL...");
                if (!val) return;
                parsed = ytKb.parseInput(val);
            }
            if (parsed.playlistIds.length > 0) {
                const pid = parsed.playlistIds[0];
                const res = await ytKb.extractPlaylist(pid);
                if (res && res.items && res.items.length > 0) {
                    const pick = res.items[Math.floor(Math.random() * res.items.length)];
                    ytHistory.push(pick);
                    ytHistoryIndex = ytHistory.length - 1;
                    loadYouTube(pick);
                    showHudNotification(`🎲 REROLLED FROM EXTRACTED PLAYLIST: ${pick.title || pick.id}`);
                }
            } else {
                alert("No valid YouTube playlist ID found. Expected PL..., UU..., or playlist?list=...");
            }
        });
    }

    // Knowledgebase Modal Open/Close Controls
    if (ytKbModalBtn && ytKbModal) {
        ytKbModalBtn.addEventListener('click', () => {
            ytKbModal.classList.add('open');
            ytKb.renderList();
        });
    }

    if (ytKbCloseBtn && ytKbModal) {
        ytKbCloseBtn.addEventListener('click', () => {
            ytKbModal.classList.remove('open');
        });
    }

    if (ytKbModal) {
        ytKbModal.addEventListener('click', (e) => {
            if (e.target === ytKbModal) ytKbModal.classList.remove('open');
        });
    }

    if (ytKbSearchInput) {
        ytKbSearchInput.addEventListener('input', () => ytKb.renderList());
    }
    if (ytKbSourceFilter) {
        ytKbSourceFilter.addEventListener('change', () => ytKb.renderList());
    }

    if (ytKbAddBtn && ytKbInput) {
        ytKbAddBtn.addEventListener('click', () => {
            const val = ytKbInput.value.trim();
            if (!val) return;
            const parsed = ytKb.parseInput(val);
            let count = 0;
            if (parsed.playlistIds.length > 0) {
                ytKb.extractPlaylist(parsed.playlistIds[0]);
                count++;
            }
            if (parsed.videoIds.length > 0) {
                parsed.videoIds.forEach(id => {
                    ytKb.addVideo(id, null, 'user');
                    count++;
                });
            }
            if (count > 0) {
                showHudNotification(`ADDED ${count} ITEM(S) TO KNOWLEDGEBASE`);
                ytKbInput.value = '';
                ytKb.renderList();
            } else {
                alert("Please enter a valid YouTube video URL, playlist link, or video ID.");
            }
        });
    }

    if (ytKbExtractBtn && ytKbInput) {
        ytKbExtractBtn.addEventListener('click', async () => {
            const val = ytKbInput.value.trim();
            const parsed = ytKb.parseInput(val);
            if (parsed.playlistIds.length > 0) {
                await ytKb.extractPlaylist(parsed.playlistIds[0]);
                ytKbInput.value = '';
                ytKb.renderList();
            } else {
                alert("Please enter a YouTube playlist URL or Playlist ID in the box above.");
            }
        });
    }

    if (ytKbPlayRandomBtn) {
        ytKbPlayRandomBtn.addEventListener('click', () => {
            playRandomYouTube();
            if (ytKbModal) ytKbModal.classList.remove('open');
        });
    }

    if (ytKbExportBtn) {
        ytKbExportBtn.addEventListener('click', () => ytKb.exportJson());
    }

    if (ytKbImportBtn && ytKbImportFile) {
        ytKbImportBtn.addEventListener('click', () => ytKbImportFile.click());
        ytKbImportFile.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                ytKb.importJson(e.target.files[0]);
            }
        });
    }

    if (ytKbResetBtn) {
        ytKbResetBtn.addEventListener('click', () => ytKb.resetToCurated());
    }

    if (ytKbClearBtn) {
        ytKbClearBtn.addEventListener('click', () => ytKb.clearCustom());
    }

    // YouTube Clipboard Copy & Paste Controls
    const ytCopyUrlBtn = document.getElementById('ytCopyUrlBtn');
    const ytPasteUrlBtn = document.getElementById('ytPasteUrlBtn');

    if (ytCopyUrlBtn && ytUrlInput) {
        ytCopyUrlBtn.addEventListener('click', () => {
            const val = ytUrlInput.value || '';
            if (!val) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(val).then(() => {
                    ytCopyUrlBtn.textContent = 'COPIED! ✓';
                    ytCopyUrlBtn.classList.add('copied');
                    showHudNotification('YOUTUBE URL COPIED TO CLIPBOARD');
                    setTimeout(() => {
                        ytCopyUrlBtn.textContent = '📋 COPY URL';
                        ytCopyUrlBtn.classList.remove('copied');
                    }, 2000);
                }).catch(() => {
                    fallbackCopyText(val);
                });
            } else {
                fallbackCopyText(val);
            }
        });
    }

    function fallbackCopyText(text) {
        if (ytUrlInput) {
            ytUrlInput.select();
            document.execCommand('copy');
            if (ytCopyUrlBtn) {
                ytCopyUrlBtn.textContent = 'COPIED! ✓';
                ytCopyUrlBtn.classList.add('copied');
                showHudNotification('YOUTUBE URL COPIED');
                setTimeout(() => {
                    ytCopyUrlBtn.textContent = '📋 COPY URL';
                    ytCopyUrlBtn.classList.remove('copied');
                }, 2000);
            }
        }
    }

    // Open the selected source in a separate tab so the browser's display-capture
    // picker can route those real frames into the full original Canvas FX pipeline.
    const ytOpenSourceBtn = document.getElementById('ytOpenSourceBtn');
    if (ytOpenSourceBtn) ytOpenSourceBtn.addEventListener('click', () => {
        const raw = (ytUrlInput && ytUrlInput.value || '').trim();
        if (!raw) { showHudNotification('LOAD A YOUTUBE SOURCE FIRST'); return; }
        try {
            const u = new URL(raw);
            const allowed = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'];
            if (!allowed.includes(u.hostname.toLowerCase())) throw new Error('not a YouTube URL');
            window.open(u.href, '_blank', 'noopener,noreferrer');
            showHudNotification('YOUTUBE SOURCE OPENED — return here, click FULL FX CAPTURE, and choose that tab/window');
        } catch (e) {
            showHudNotification('ENTER OR LOAD A VALID YOUTUBE URL FIRST');
        }
    });

    // Display capture toggle button (lives in the YouTube cluster)
    const ytCaptureTabBtn = document.getElementById('ytCaptureTabBtn');
    if (ytCaptureTabBtn) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            ytCaptureTabBtn.disabled = true;
            ytCaptureTabBtn.title = 'Screen capture requires a secure page and a browser that supports getDisplayMedia';
        }
        ytCaptureTabBtn.addEventListener('click', () => {
            if (captureStream) stopTabCapture(true);
            else startTabCapture();
        });
    }

    if (ytPasteUrlBtn) {
        ytPasteUrlBtn.addEventListener('click', async () => {
            try {
                let text = '';
                if (navigator.clipboard && navigator.clipboard.readText) {
                    text = await navigator.clipboard.readText();
                }
                if (!text && ytUrlInput) text = ytUrlInput.value;
                if (!text) {
                    alert('Clipboard is empty. Please copy a YouTube URL first.');
                    return;
                }
                const parsed = ytKb.parseInput(text);
                let extractedPlaylist = null;
                if (parsed.playlistIds.length > 0) {
                    extractedPlaylist = parsed.playlistIds[0];
                    ytKb.extractPlaylist(extractedPlaylist);
                }
                if (parsed.videoIds.length > 0) {
                    const primaryId = parsed.videoIds[0];
                    const customObj = ytKb.addVideo(primaryId, null, 'pasted', extractedPlaylist);
                    for (let i = 1; i < parsed.videoIds.length; i++) {
                        ytKb.addVideo(parsed.videoIds[i], null, 'pasted', extractedPlaylist);
                    }
                    ytHistory.push(customObj);
                    ytHistoryIndex = ytHistory.length - 1;
                    loadYouTube(customObj);
                    showHudNotification(`SAVED & PLAYING: https://youtu.be/${primaryId}`);
                } else if (extractedPlaylist) {
                    if (ytUrlInput) ytUrlInput.value = text;
                    loadEnteredYouTubeUrl();
                } else {
                    alert('Clipboard does not contain a valid YouTube video or playlist link.');
                }
            } catch(err) {
                console.warn('Clipboard read error:', err);
                if (ytUrlInput && ytUrlInput.value) {
                    loadEnteredYouTubeUrl();
                }
            }
        });
    }

/* ── 5. LOCAL MEDIA PLAYBACK (.MP4, .AVI, .MKV, .MOV, .MP3, .M4A) ─────── */
    const localFileInput = document.getElementById('localFileInput');
    const localFolderInput = document.getElementById('localFolderInput');
    const localArtworkInput = document.getElementById('localArtworkInput');
    const openLocalMediaBtn = document.getElementById('openLocalMediaBtn');
    const openLocalFolderBtn = document.getElementById('openLocalFolderBtn');
    const addArtworkBtn = document.getElementById('addArtworkBtn');
    const dropOverlay = document.getElementById('dropOverlay');

    const mediaTransportBar = document.getElementById('mediaTransportBar');
    const mediaPrevTrackBtn = document.getElementById('mediaPrevTrackBtn');
    const mediaPlayPauseBtn = document.getElementById('mediaPlayPauseBtn');
    const mediaNextTrackBtn = document.getElementById('mediaNextTrackBtn');
    const mediaSeekSlider = document.getElementById('mediaSeekSlider');
    const mediaTimeDisplay = document.getElementById('mediaTimeDisplay');
    const mediaTitleBadge = document.getElementById('mediaTitleBadge');
    const artworkBadge = document.getElementById('artworkBadge');
    const prevArtworkBtn = document.getElementById('prevArtworkBtn');
    const nextArtworkBtn = document.getElementById('nextArtworkBtn');
    const artworkControls = document.getElementById('artworkControls');

    let localAudioPool = [];
    let currentAudioIndex = 0;
    let localVideoPool = [];
    let currentVideoIndex = 0;

    // Trigger buttons
    if (openLocalMediaBtn && localFileInput) {
        openLocalMediaBtn.addEventListener('click', () => localFileInput.click());
    }

    if (mediaPlayPauseBtn) {
        mediaPlayPauseBtn.addEventListener('click', () => {
            if (currentMediaKind === 'audio' && localAudio && localAudio.src) {
                if (localAudio.paused) {
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                    localAudio.play();
                } else {
                    localAudio.pause();
                }
            } else if (currentMediaKind === 'video' && localVideo && localVideo.src) {
                if (localVideo.paused) {
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                    localVideo.play();
                } else {
                    localVideo.pause();
                }
            } else if (activeAudioElement) {
                if (activeAudioElement.paused) {
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                    activeAudioElement.play();
                } else {
                    activeAudioElement.pause();
                }
            } else if (isSynthRunning) {
                toggleSyntheticAudio();
            } else {
                showHudNotification('OPENING LOCAL MEDIA FILE PICKER...');
                if (localFileInput) localFileInput.click();
            }
        });
    }
    if (openLocalFolderBtn && localFolderInput) {
        openLocalFolderBtn.addEventListener('click', () => localFolderInput.click());
    }
    if (addArtworkBtn && localArtworkInput) {
        addArtworkBtn.addEventListener('click', () => localArtworkInput.click());
    }

    // Helper: format seconds to MM:SS
    function fmtTime(sec) {
        if (isNaN(sec) || sec < 0) sec = 0;
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function updateTransportUi(mediaEl) {
        if (!mediaEl || !mediaTransportBar) return;
        mediaTransportBar.style.display = 'flex';
        const cur = mediaEl.currentTime || 0;
        const dur = mediaEl.duration || 0;
        if (dur > 0 && mediaSeekSlider) {
            mediaSeekSlider.value = (cur / dur) * 100;
        }
        if (mediaTimeDisplay) {
            mediaTimeDisplay.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
        }
        if (mediaPlayPauseBtn) {
            mediaPlayPauseBtn.textContent = mediaEl.paused ? 'PLAY ▶' : 'PAUSE ❚❚';
        }
        if (mediaPrevTrackBtn && mediaNextTrackBtn) {
            const hasMultiple = localAudioPool.length > 1;
            mediaPrevTrackBtn.style.display = hasMultiple ? 'inline-block' : 'none';
            mediaNextTrackBtn.style.display = hasMultiple ? 'inline-block' : 'none';
        }
    }

    function bindMediaTransportEvents(mediaEl, titleText) {
        if (!mediaEl) return;
        if (mediaTitleBadge) mediaTitleBadge.textContent = titleText;
        updateTransportUi(mediaEl);

        mediaEl.ontimeupdate = () => updateTransportUi(mediaEl);
        mediaEl.onplay = () => updateTransportUi(mediaEl);
        mediaEl.onpause = () => updateTransportUi(mediaEl);
        mediaEl.onended = () => {
            if (currentMediaKind === 'audio' && localAudioPool.length > 1) {
                playLocalAudioIndex(currentAudioIndex + 1);
            } else {
                updateTransportUi(mediaEl);
            }
        };

        // Play/pause is handled by the single click listener bound at startup (a second handler here toggled twice = no-op).

        if (mediaSeekSlider) {
            mediaSeekSlider.oninput = () => {
                const dur = mediaEl.duration || 0;
                if (dur > 0) {
                    mediaEl.currentTime = (parseFloat(mediaSeekSlider.value) / 100) * dur;
                }
            };
        }
    }

    // Pure JS ID3 Album Cover Art Extractor
    function extractId3Artwork(file) {
        return file.slice(0, Math.min(file.size, 2 * 1024 * 1024)).arrayBuffer().then(buf => {
            const bytes = new Uint8Array(buf);
            if (bytes.length < 10 || String.fromCharCode(bytes[0], bytes[1], bytes[2]) !== 'ID3') return null;
            let pos = 10;
            while (pos + 10 <= bytes.length) {
                const id = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
                const size = ((bytes[pos + 4] & 0x7f) << 21) | ((bytes[pos + 5] & 0x7f) << 14) |
                             ((bytes[pos + 6] & 0x7f) << 7) | (bytes[pos + 7] & 0x7f);
                if (size <= 0) break;
                if (id === 'APIC') {
                    const enc = bytes[pos + 10];
                    let mimeEnd = pos + 11;
                    while (mimeEnd < pos + 10 + size && bytes[mimeEnd] !== 0) mimeEnd++;
                    let mime = '';
                    for (let k = pos + 11; k < mimeEnd; k++) mime += String.fromCharCode(bytes[k]);
                    let imgStart = mimeEnd + 1 + (enc === 1 || enc === 2 ? 2 : 1);
                    if (imgStart < pos + 10 + size) {
                        const blob = new Blob([bytes.slice(imgStart, pos + 10 + size)], { type: mime || 'image/jpeg' });
                        return URL.createObjectURL(blob);
                    }
                    break;
                }
                pos += 10 + size;
            }
            return null;
        }).catch(() => null);
    }

    // Procedural High-Res Artwork Generator (Default Accompaniment for MP3s)
    function generateProceduralArtworkPool() {
        const specs = [
            { title: 'HYPER-SPECTRAL DISPLACEMENT', hue: 180 },
            { title: 'NEURAL SUB-BASS RESONANCE', hue: 280 },
            { title: 'CHROMATIC CYBER CASCADE', hue: 38 },
            { title: 'ANALOG CRT BEAT MATRIX', hue: 330 }
        ];
        return specs.map((s, idx) => {
            const c = document.createElement('canvas');
            c.width = 1280;
            c.height = 720;
            const ctx = c.getContext('2d');

            const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
            grad.addColorStop(0, `hsl(${s.hue}, 85%, 10%)`);
            grad.addColorStop(0.5, `hsl(${(s.hue + 60) % 360}, 90%, 20%)`);
            grad.addColorStop(1, `hsl(${(s.hue + 140) % 360}, 80%, 8%)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, c.width, c.height);

            // Tech grid lines
            ctx.strokeStyle = `hsla(${s.hue}, 100%, 65%, 0.22)`;
            ctx.lineWidth = 1.5;
            for (let x = 40; x < c.width; x += 55) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
            }
            for (let y = 30; y < c.height; y += 55) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
            }

            // Concentric radar halos
            for (let r = 80; r < 480; r += 60) {
                ctx.beginPath();
                ctx.arc(c.width / 2, c.height / 2, r, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${(s.hue + r * 0.3) % 360}, 100%, 75%, 0.35)`;
                ctx.stroke();
            }

            // Central cyber diamond
            ctx.save();
            ctx.translate(c.width / 2, c.height / 2);
            ctx.rotate(Math.PI / 4);
            ctx.strokeStyle = `hsl(${(s.hue + 40) % 360}, 100%, 75%)`;
            ctx.lineWidth = 3;
            ctx.strokeRect(-120, -120, 240, 240);
            ctx.restore();

            // HUD Typography
            ctx.fillStyle = `hsl(${s.hue}, 100%, 85%)`;
            ctx.font = 'bold 26px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(s.title, c.width / 2, c.height / 2 + 10);
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.fillText(`VISUAL ACCOMPANIMENT // SYSTEM CARD 0${idx + 1}`, c.width / 2, c.height / 2 + 45);

            return { name: s.title, url: c.toDataURL('image/jpeg', 0.92) };
        });
    }

    /* ── FOLDER IMAGES / ARTWORK SLIDESHOW FOR MP3/M4A ───────────────────── */
    function setArtworkIndex(idx) {
        if (localImagesPool.length === 0) return;
        currentArtworkIndex = (idx + localImagesPool.length) % localImagesPool.length;
        const item = localImagesPool[currentArtworkIndex];
        if (item && localArtworkImg) {
            localArtworkImg.src = item.url;
            localArtworkImg.onload = () => {
                if (aiWarp && currentMediaKind === 'audio') {
                    aiWarp.setSourceMode('image', localArtworkImg);
                }
            };
            if (localArtworkImg.complete && aiWarp && currentMediaKind === 'audio') {
                aiWarp.setSourceMode('image', localArtworkImg);
            }
        }
        if (artworkBadge) {
            artworkBadge.textContent = `IMG [${currentArtworkIndex + 1}/${localImagesPool.length}]`;
            artworkBadge.title = item ? item.name : '';
        }
        if (artworkControls) artworkControls.style.display = 'flex';
    }

    function addImageToArtworkPool(fileOrUrl, name = 'Artwork') {
        const url = (typeof fileOrUrl === 'string') ? fileOrUrl : URL.createObjectURL(fileOrUrl);
        localImagesPool.push({ name, url });
        setArtworkIndex(localImagesPool.length - 1);
        startArtworkSlideshow();
    }

    function startArtworkSlideshow() {
        if (artworkSlideshowTimer) clearInterval(artworkSlideshowTimer);
        if (localImagesPool.length <= 1) return;
        artworkSlideshowTimer = setInterval(() => {
            if (currentMediaKind === 'audio' && localImagesPool.length > 1) {
                setArtworkIndex(currentArtworkIndex + 1);
            }
        }, 10000); // 10s rotation
    }

    if (prevArtworkBtn) prevArtworkBtn.addEventListener('click', () => setArtworkIndex(currentArtworkIndex - 1));
    if (nextArtworkBtn) nextArtworkBtn.addEventListener('click', () => setArtworkIndex(currentArtworkIndex + 1));

    // Track Navigation (⏮ PREV / NEXT ⏭)
    function playLocalAudioIndex(idx) {
        if (localAudioPool.length === 0) return;
        currentAudioIndex = (idx + localAudioPool.length) % localAudioPool.length;
        const file = localAudioPool[currentAudioIndex];
        playLocalAudio(file, `[${currentAudioIndex + 1}/${localAudioPool.length}] ${file.name}`);
    }

    if (mediaPrevTrackBtn) {
        mediaPrevTrackBtn.addEventListener('click', () => {
            if (localAudioPool.length > 1) playLocalAudioIndex(currentAudioIndex - 1);
        });
    }

    if (mediaNextTrackBtn) {
        mediaNextTrackBtn.addEventListener('click', () => {
            if (localAudioPool.length > 1) playLocalAudioIndex(currentAudioIndex + 1);
        });
    }

    // Play Local Video (.mp4, .avi, .mkv, .mov)
    function playLocalVideo(file, customTitle = null) {
        pauseAllOtherMedia();
        if (ytWarpShell) ytWarpShell.style.display = 'none';
        currentMediaKind = 'video';
        syncPlaybackClasses('video');
        activeAudioElement = localVideo;
        if (artworkControls) artworkControls.style.display = 'none';

        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        routeElementToAudioContext(localVideo);

        const url = URL.createObjectURL(file);
        localVideo.src = url;
        localVideo.volume = 1.0;
        localVideo.play().then(() => {
            if (aiWarp) aiWarp.setSourceMode('video', localVideo);
            bindMediaTransportEvents(localVideo, customTitle || file.name);
        }).catch(err => {
            console.warn('Video playback notice (may require H.264/AAC codec container):', err);
        });
    }

    // Play Local Audio (.mp3, .m4a) & Hook Folder Artwork Accompaniment
    async function playLocalAudio(file, customTitle = null) {
        pauseAllOtherMedia();
        if (ytWarpShell) ytWarpShell.style.display = 'none';
        currentMediaKind = 'audio';
        syncPlaybackClasses('audio');
        activeAudioElement = localAudio;

        // 1. Try extracting embedded ID3 cover art
        const id3CoverUrl = await extractId3Artwork(file);
        if (id3CoverUrl) {
            localImagesPool.unshift({ name: `${file.name} (Embedded Cover)`, url: id3CoverUrl });
            setArtworkIndex(0);
        } else if (localImagesPool.length > 0) {
            setArtworkIndex(currentArtworkIndex);
        } else {
            // Provide procedural accompaniment if no images exist yet
            localImagesPool = generateProceduralArtworkPool();
            setArtworkIndex(0);
        }
        startArtworkSlideshow();

        // 2. Start audio playback
        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
            await audioCtx.resume().catch(() => {});
        }
        routeElementToAudioContext(localAudio);

        const url = URL.createObjectURL(file);
        localAudio.src = url;
        localAudio.volume = 1.0;
        localAudio.play().then(() => {
            bindMediaTransportEvents(localAudio, customTitle || file.name);
        }).catch(err => {
            console.warn('Audio playback error:', err);
        });
    }

    // Process a collection of files (from file input, folder picker, or drag-and-drop)
    async function handleIncomingFiles(fileList) {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        const isVideo = f => /\.(mp4|avi|mkv|mov|webm|m4v)$/i.test(f.name) || f.type.startsWith('video/');
        const isAudio = f => /\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(f.name) || f.type.startsWith('audio/');
        const isImage = f => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.name) || f.type.startsWith('image/');

        const images = files.filter(isImage);
        const audios = files.filter(isAudio);
        const videos = files.filter(isVideo);

        // If folder or files contain images, load them into localImagesPool
        if (images.length > 0) {
            localImagesPool = images.map(imgFile => ({
                name: imgFile.name,
                url: URL.createObjectURL(imgFile)
            }));
            setArtworkIndex(0);
            startArtworkSlideshow();
        }

        // Handle Audio
        if (audios.length > 0) {
            localAudioPool = audios;
            currentAudioIndex = 0;
            await playLocalAudio(audios[0], `[1/${audios.length}] ${audios[0].name}`);
        } else if (videos.length > 0) {
            localVideoPool = videos;
            currentVideoIndex = 0;
            playLocalVideo(videos[0], `[1/${videos.length}] ${videos[0].name}`);
        } else if (images.length > 0) {
            // Just images dropped / picked
            if (aiWarp) aiWarp.setSourceMode('image', localArtworkImg);
            if (mediaTransportBar) mediaTransportBar.style.display = 'flex';
            if (mediaTitleBadge) mediaTitleBadge.textContent = `Folder Artwork [${images.length} images]`;
        }
    }

    // Hook Input Change Handlers
    if (localFileInput) {
        localFileInput.addEventListener('change', (e) => handleIncomingFiles(e.target.files));
    }
    if (localFolderInput) {
        localFolderInput.addEventListener('change', (e) => handleIncomingFiles(e.target.files));
    }
    if (localArtworkInput) {
        localArtworkInput.addEventListener('change', (e) => handleIncomingFiles(e.target.files));
    }

    // Drag-and-Drop on Window
    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropOverlay) dropOverlay.classList.add('active');
    });
    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropOverlay && (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
            dropOverlay.classList.remove('active');
        }
    });
    window.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropOverlay) dropOverlay.classList.remove('active');
        if (e.dataTransfer && e.dataTransfer.files) {
            handleIncomingFiles(e.dataTransfer.files);
        }
    });

    /* ── 6. POLE - R SHOWCASE AUDIO PLAYER & MODAL DRAWER ─────────────────── */
    const poleRDrawerBtn = document.getElementById('poleRDrawerBtn');
    const poleRCloseBtn = document.getElementById('poleRCloseBtn');
    const poleRDrawer = document.getElementById('pole-r-drawer');

    if (poleRDrawerBtn && poleRDrawer) {
        poleRDrawerBtn.addEventListener('click', () => {
            const isOpen = poleRDrawer.classList.toggle('open');
            poleRDrawerBtn.classList.toggle('active', isOpen);
            if (isOpen) showHudNotification('RAUM · X-R SHOWCASE DRAWER OPEN');
        });
    }
    if (poleRCloseBtn && poleRDrawer) {
        poleRCloseBtn.addEventListener('click', () => {
            poleRDrawer.classList.remove('open');
            if (poleRDrawerBtn) poleRDrawerBtn.classList.remove('active');
        });
    }
    const poleTracks = (configData && configData.tracks) || [
        { n: 1, t: 'pole - Я - raum 1 - variant X-R', s: 'R1·XR', d: 435, r: 1, c: 'original synthesized work by GitHub Copilot, prompted by River Lyle Reuveni · dedicated to Stefan Betke (Pole)', file: 'audio/pole - Я - raum 1 - variant X-R.mp3' },
        { n: 2, t: 'pole - Я - raum 2 - variant X-R', s: 'R2·XR', d: 485, r: 2, c: 'original synthesized work by GitHub Copilot, prompted by River Lyle Reuveni · dedicated to Stefan Betke (Pole)', file: 'audio/pole - Я - raum 2 - variant X-R.mp3' },
        { n: 3, t: 'pole - Я - raum 3 - variant X-R', s: 'R3·XR', d: 543, r: 3, c: 'original ambient synthesized work by GitHub Copilot, prompted by River Lyle Reuveni · dedicated to Stefan Betke (Pole)', file: 'audio/pole - Я - raum 3 - variant X-R.mp3' },
        { n: 4, t: 'pole - Я - raum 4 - variant X-R', s: 'R4·XR', d: 543, r: 4, c: 'original ambient synthesized work by GitHub Copilot, prompted by River Lyle Reuveni · dedicated to Stefan Betke (Pole)', file: 'audio/pole - Я - raum 4 - variant X-R.mp3' }
    ];

    const poleGrid = document.getElementById('poleR-grid');
    const raumImages = [1, 2, 3, 4].map(n => { const im = new Image(); im.src = `audio/cover-raum-${n}.jpg`; return im; });
    const raumBack = new Image(); raumBack.src = 'audio/back-cover.jpg';
    raumImages.push(raumBack);
    if (poleGrid) {
        poleTracks.forEach(t => {
            const item = document.createElement('article');
            item.className = 'poleR-item';
            const numStr = ('0' + t.n).slice(-2);
            item.innerHTML = `
                <img class="poleR-cover" src="audio/cover-raum-${t.n}.jpg" alt="Cover art: ${t.t}" loading="lazy">
                <header>
                    <span class="poleR-num">${numStr}</span>
                    <h3>${t.t} <small>(${Math.floor(t.d / 60)}:${('0' + (t.d % 60)).slice(-2)})</small></h3>
                    <span class="poleR-room">ROOM ${t.r}</span>
                </header>
                <p class="poleR-credit">${t.c}</p>
                <div class="poleR-controls">
                    <button class="poleR-play-btn" data-track="${t.n}">PLAY ▶</button>
                    <audio preload="none" src="${encodeURI(t.file)}"></audio>
                </div>
            `;
            poleGrid.appendChild(item);

            const playBtn = item.querySelector('.poleR-play-btn');
            const audioEl = item.querySelector('audio');
            if (audioEl) {
                const leaveShow = () => { if (aiWarp && aiWarp.endRaumShow) aiWarp.endRaumShow(audioEl); };
                audioEl.addEventListener('pause', leaveShow);
                audioEl.addEventListener('ended', () => {
                    leaveShow();
                    const b = item.querySelector('.poleR-play-btn');
                    if (b) b.textContent = 'PLAY ▶';
                });
            }
            if (playBtn && audioEl) {
                playBtn.onclick = () => {
                    initAudioContext();
                    if (audioCtx.state === 'suspended') audioCtx.resume();

                    if (audioEl.paused) {
                        poleGrid.querySelectorAll('audio').forEach(a => {
                            if (a !== audioEl) {
                                a.pause();
                                const b = a.parentElement ? a.parentElement.querySelector('.poleR-play-btn') : null;
                                if (b) b.textContent = 'PLAY ▶';
                            }
                        });
                        pauseAllOtherMedia();
                        currentMediaKind = 'pole-r';
                        syncPlaybackClasses('pole-r');

                        routeElementToAudioContext(audioEl);
                        audioEl.play().catch(e => {
                            console.warn('Playback error (falling back to synth):', e);
                            playSynthTrack('mellow');
                        });
                        playBtn.textContent = 'PAUSE ❚❚';
                        activeAudioElement = audioEl;
                        // Artwork slideshow + exclusive glitch sequences replace whatever was on the canvas
                        if (aiWarp && aiWarp.startRaumShow) {
                            const order = raumImages.slice(t.n - 1, 4).concat(raumImages.slice(0, t.n - 1), [raumBack]);
                            aiWarp.startRaumShow(order, audioEl, t.n);
                        }
                    } else {
                        audioEl.pause();
                        playBtn.textContent = 'PLAY ▶';
                    }
                };
            }
        });
    }

        /* ── 8. 34-VOICE MIXER RACK GENERATOR ───────────────────────────────── */
    const effectCol = document.getElementById('effect-toggle-column');
    if (effectCol && aiWarp) {
        effectCol.innerHTML = '<div class="effect-palette-heading"><span>GLITCH PALETTE</span><small>34 VOICES · 17 CORE + 17 GC#(3)</small></div>';

        aiWarp.effectNames.forEach(name => {
            if (name === 'ASCII GC#(3)') {
                const divider = document.createElement('div');
                divider.className = 'effect-palette-heading gc3-divider';
                divider.innerHTML = '<span>GLITCH REVISION 3</span><small>17 R3 VOICES · GC#(3)</small>';
                effectCol.appendChild(divider);
            }
            const row = document.createElement('div');
            row.className = 'effect-control-row';
            if (name.endsWith(' GC#(3)')) row.classList.add('gc3-voice');
            row.setAttribute('data-effect', name);

            row.innerHTML = `
                <div class="effect-row-top">
                    <button class="effect-toggle-btn" data-effect="${name}">${name}</button>
                    <input type="range" class="effect-level-fader" min="0" max="1" step="0.01" value="0" title="Level Fader (0-100%)">
                    <span class="level-val">0%</span>
                    <button class="effect-lock-btn" title="Lock level against automation" data-effect="${name}">🔓</button>
                </div>
                <div class="effect-row-params">
                    <label><span class="param-size-text">SIZE 1.0x</span><input type="range" class="param-size" min="0.2" max="3" step="0.05" value="1" title="Scale factor"></label>
                    <label><span class="param-depth-text">DEPTH 62%</span><input type="range" class="param-depth" min="0" max="1" step="0.01" value="0.62" title="Depth intensity"></label>
                </div>
            `;
            effectCol.appendChild(row);

            const toggleBtn = row.querySelector('.effect-toggle-btn');
            const levelFader = row.querySelector('.effect-level-fader');
            const levelVal = row.querySelector('.level-val');
            const sizeSlider = row.querySelector('.param-size');
            const depthSlider = row.querySelector('.param-depth');
            const sizeText = row.querySelector('.param-size-text');
            const depthText = row.querySelector('.param-depth-text');
            const lockBtn = row.querySelector('.effect-lock-btn');

            if (toggleBtn) {
                toggleBtn.onclick = () => {
                    const active = aiWarp.toggleEffect(name);
                    syncUiFromEngine();
                    showHudNotification(`VOICE [${name}] ${active ? 'ENABLED [ON]' : 'DISABLED [OFF]'}`);
                };
            }

            if (levelFader) {
                levelFader.oninput = () => {
                    const val = parseFloat(levelFader.value);
                    aiWarp.setEffectLevel(name, val);
                    const active = val > 0.005;
                    row.classList.toggle('is-active', active);
                    if (toggleBtn) {
                        toggleBtn.classList.toggle('active', active);
                        toggleBtn.textContent = active ? `${name} [ON]` : name;
                    }
                    if (levelVal) levelVal.textContent = `${Math.round(val * 100)}%`;
                };
            }

            if (sizeSlider) {
                sizeSlider.oninput = () => {
                    const s = parseFloat(sizeSlider.value);
                    aiWarp.setEffectSize(name, s);
                    if (sizeText) sizeText.textContent = `SIZE ${s.toFixed(1)}x`;
                };
            }

            if (depthSlider) {
                depthSlider.oninput = () => {
                    const d = parseFloat(depthSlider.value);
                    aiWarp.setEffectDepth(name, d);
                    if (depthText) depthText.textContent = `DEPTH ${Math.round(d * 100)}%`;
                };
            }

            if (lockBtn) {
                lockBtn.onclick = () => {
                    aiWarp.effectLocks[name] = !aiWarp.effectLocks[name];
                    const isLocked = !!aiWarp.effectLocks[name];
                    lockBtn.textContent = isLocked ? '🔒' : '🔓';
                    lockBtn.classList.toggle('locked', isLocked);
                    showHudNotification(`VOICE [${name}] ${isLocked ? 'LOCKED (IMMUNE TO AUTO)' : 'UNLOCKED'}`);
                };
            }
        });
    }

    /* ── MIXER VIEWPORT GUARD ──────────────────────────────────────────────
       The left rail is bounded by the actual secondary HUD and bottom automation
       dock. It therefore never scrolls behind the dock, even when controls wrap. */
    function syncMixerViewport() {
        const topRail = document.getElementById('ytMediaBar');
        const bottomRail = document.getElementById('glitch-bottom-bar');
        const gap = 12;
        const top = topRail ? Math.ceil(topRail.getBoundingClientRect().bottom + gap) : 96;
        const bottom = bottomRail ? Math.ceil(bottomRail.getBoundingClientRect().height) : 148;
        document.documentElement.style.setProperty('--mixer-top', `${top}px`);
        document.documentElement.style.setProperty('--bottom-dock-height', `${bottom}px`);
    }
    syncMixerViewport();
    if (window.ResizeObserver) {
        const mixerRailObserver = new ResizeObserver(syncMixerViewport);
        const topRail = document.getElementById('ytMediaBar');
        const bottomRail = document.getElementById('glitch-bottom-bar');
        if (topRail) mixerRailObserver.observe(topRail);
        if (bottomRail) mixerRailObserver.observe(bottomRail);
    }
    window.addEventListener('resize', syncMixerViewport, { passive: true });

    /* ── MASTER UI SYNCHRONIZATION FUNCTION ─────────────────────────────── */
    function syncUiFromEngine() {
        if (!aiWarp) return;

        // 1. Sync 17 Voice rows in Mixer Rack
        if (effectCol) {
            aiWarp.effectNames.forEach(name => {
                const row = effectCol.querySelector(`[data-effect="${name}"]`);
                if (row) {
                    const alpha = aiWarp.effectAlphas[name] || 0;
                    const enabled = !!aiWarp.effectEnabled[name] && alpha > 0.005;
                    const toggleBtn = row.querySelector('.effect-toggle-btn');
                    const levelFader = row.querySelector('.effect-level-fader');
                    const levelVal = row.querySelector('.level-val');
                    const sizeSlider = row.querySelector('.param-size');
                    const depthSlider = row.querySelector('.param-depth');
                    const sizeText = row.querySelector('.param-size-text');
                    const depthText = row.querySelector('.param-depth-text');

                    row.classList.toggle('is-active', enabled);
                    if (toggleBtn) {
                        toggleBtn.classList.toggle('active', enabled);
                        toggleBtn.textContent = enabled ? `${name} [ON]` : name;
                    }
                    if (levelFader) levelFader.value = alpha;
                    if (levelVal) levelVal.textContent = `${Math.round(alpha * 100)}%`;
                    if (sizeSlider && aiWarp.effectSizes[name] !== undefined) {
                        sizeSlider.value = aiWarp.effectSizes[name];
                        if (sizeText) sizeText.textContent = `SIZE ${aiWarp.effectSizes[name].toFixed(1)}x`;
                    }
                    if (depthSlider && aiWarp.effectDepths[name] !== undefined) {
                        depthSlider.value = aiWarp.effectDepths[name];
                        if (depthText) depthText.textContent = `DEPTH ${Math.round(aiWarp.effectDepths[name] * 100)}%`;
                    }
                }
            });
        }

        // 2. Sync Master Toggle Buttons
        const warpBtn = document.getElementById('aiWarpBtn');
        if (warpBtn) {
            warpBtn.textContent = `AI WARP: [${aiWarp.aiWarpActive ? 'ON' : 'OFF'}] (${aiWarp.aiWarpMode.toUpperCase()})`;
            warpBtn.classList.toggle('active', aiWarp.aiWarpActive);
        }

        const warpModeBtn = document.getElementById('warpModeCycleBtn');
        if (warpModeBtn) {
            const idx = aiWarp.aiWarpModeIndex + 1;
            const total = aiWarp.aiWarpModes.length;
            warpModeBtn.textContent = `MODE: ${aiWarp.aiWarpMode.toUpperCase()} [${idx}/${total}]`;
        }

        const warpModeSelect = document.getElementById('warpModeSelect');
        if (warpModeSelect && warpModeSelect.value !== aiWarp.aiWarpMode) {
            warpModeSelect.value = aiWarp.aiWarpMode;
        }

        const ghostBtn = document.getElementById('ghostProtocolBtn');
        if (ghostBtn) {
            const isGhostOn = aiWarp.ghostModes[aiWarp.ghostModeIndex] !== 'OFF';
            const ghostMode = aiWarp.ghostModes[aiWarp.ghostModeIndex];
            const ghostProfile = (window.GlitchEngine && window.GlitchEngine.ghostProfile) ? window.GlitchEngine.ghostProfile(ghostMode) : null;
            ghostBtn.textContent = isGhostOn ? `GHOST: ${ghostMode}${ghostProfile && ghostProfile.realm ? ` [${ghostProfile.realm.toUpperCase()}]` : ''} ${Math.round(aiWarp.ghostLevel * 100)}%` : 'GHOST: OFF';
            ghostBtn.classList.toggle('active', isGhostOn);
        }

        const vsyncBtn = document.getElementById('vsyncScanBtn');
        if (vsyncBtn) {
            const isVsyncOn = aiWarp.vsyncModes[aiWarp.vsyncModeIndex] !== 'OFF';
            const vsyncMode = aiWarp.vsyncModes[aiWarp.vsyncModeIndex];
            const vsyncLabels = { ON: 'SCANPHASING', GHOST_OFF: 'COLOR HARMONY', FULL: 'SHARP' };
            vsyncBtn.textContent = isVsyncOn ? `V-SYNC: ${vsyncLabels[vsyncMode] || vsyncMode} ${Math.round(aiWarp.vsyncLevel * 100)}%` : `V-SYNC: OFF · HOLD ${Math.round(aiWarp.vsyncLevel * 100)}%`;
            vsyncBtn.classList.toggle('active', isVsyncOn);
        }

        const autoGlitchBtn = document.getElementById('autoGlitchBtn');
        if (autoGlitchBtn) {
            autoGlitchBtn.textContent = `AUTO GLITCH: ${aiWarp.isAutoGlitch ? 'ON' : 'OFF'}`;
            autoGlitchBtn.classList.toggle('active', aiWarp.isAutoGlitch);
        }

        const continualRandBtn = document.getElementById('continualRandomizeBtn');
        if (continualRandBtn) {
            continualRandBtn.textContent = `CONTINUAL RAND: ${aiWarp.isContinualRandom ? 'ON' : 'OFF'}`;
            continualRandBtn.classList.toggle('active', aiWarp.isContinualRandom);
        }

        const timedAutoBtn = document.getElementById('timedAutoBtn');
        if (timedAutoBtn) {
            const label = aiWarp.timedAutomationState ? aiWarp.timedAutomationState.label : '2-BAR';
            timedAutoBtn.textContent = aiWarp.isTimedAuto ? `TIMED AUTO: ${label} [ON]` : 'TIMED AUTO: OFF';
            timedAutoBtn.classList.toggle('active', aiWarp.isTimedAuto);
        }

        const autoMastersBtn = document.getElementById('autoMastersBtn');
        if (autoMastersBtn) {
            autoMastersBtn.textContent = `AUTO MASTERS: ${aiWarp.isAutomatedMasters ? 'ON' : 'OFF'}`;
            autoMastersBtn.classList.toggle('active', aiWarp.isAutomatedMasters);
        }

        const hardLightBtn = document.getElementById('hardLightBtn');
        if (hardLightBtn) {
            hardLightBtn.textContent = `HARD-LIGHT: ${aiWarp.hardLightActive ? 'ON' : 'OFF'}`;
            hardLightBtn.classList.toggle('active', aiWarp.hardLightActive);
        }

        const softEyeBtn = document.getElementById('softEyeBtn');
        if (softEyeBtn) {
            const mode = aiWarp.softEyeModes[aiWarp.softEyeModeIndex] || 'CALM';
            softEyeBtn.textContent = `SOFT-EYE: ${mode}`;
            softEyeBtn.classList.toggle('active', mode !== 'OFF');
        }

        const milkdropBtn = document.getElementById('milkdropBtn');
        if (milkdropBtn) {
            const preset = aiWarp.milkdropCurrentPreset;
            milkdropBtn.textContent = aiWarp.milkdropActive && preset
                ? `DROP THE MILK? ${String(aiWarp.milkdropPresetIndex + 1).padStart(2, '0')}/80`
                : `DROP THE MILK? ${aiWarp.milkdropActive ? 'ON' : 'OFF'}`;
            milkdropBtn.title = aiWarp.milkdropActive && preset
                ? `Now playing ${preset.name}; shuffled 80-effect deck auto-advances on a mode-aware ~12–17 second cadence.`
                : 'Toggle DROP THE MILK? — randomized 80-effect Milkdrop/projectM-inspired feedback automation.';
            milkdropBtn.classList.toggle('active', !!aiWarp.milkdropActive);
        }
        const milkdropOpacitySlider = document.getElementById('milkdropOpacitySlider');
        const milkdropOpacityValBadge = document.getElementById('milkdropOpacityValBadge');
        const milkdropOpacityLockBtn = document.getElementById('milkdropOpacityLockBtn');
        const milkdropOpacity = aiWarp.milkdropTargetOpacity == null ? aiWarp.milkdropOpacity : aiWarp.milkdropTargetOpacity;
        if (milkdropOpacitySlider) milkdropOpacitySlider.value = milkdropOpacity;
        if (milkdropOpacityValBadge) milkdropOpacityValBadge.textContent = `${Math.round(milkdropOpacity * 100)}%`;
        if (milkdropOpacityLockBtn) {
            milkdropOpacityLockBtn.textContent = aiWarp.milkdropOpacityLocked ? '🔒' : '🔓';
            milkdropOpacityLockBtn.classList.toggle('locked', !!aiWarp.milkdropOpacityLocked);
            milkdropOpacityLockBtn.title = aiWarp.milkdropOpacityLocked ? 'Milkdrop opacity locked; preset automation will leave this level unchanged.' : 'Lock Milkdrop opacity against preset automation.';
        }

        const earBtn = document.getElementById('earBtn');
        if (earBtn) {
            const m = aiWarp.earMode || 'auto';
            earBtn.textContent = `EAR: ${m.toUpperCase()}`;
            earBtn.className = `wired-button ear-${m} active`;
        }

        // 3. Sync Master Sliders & Badges
        const warpSlider = document.getElementById('ai-warp-strength-slider');
        const warpValBadge = document.getElementById('warpStrengthValBadge');
        if (warpSlider) {
            warpSlider.value = aiWarp.aiWarpStrength;
            if (warpValBadge) warpValBadge.textContent = `${Math.round(aiWarp.aiWarpStrength * 100)}%`;
        }

        const speedSlider = document.getElementById('glitch-speed-slider');
        const opacitySlider = document.getElementById('glitch-opacity-slider');
        const ghostSlider = document.getElementById('ghostProtocolSlider');
        const vsyncSlider = document.getElementById('vsyncScanSlider');
        const speedValBadge = document.getElementById('speedValBadge');
        const opacityValBadge = document.getElementById('opacityValBadge');
        const ghostValBadge = document.getElementById('ghostValBadge');
        const vsyncValBadge = document.getElementById('vsyncValBadge');

        if (speedSlider) {
            speedSlider.value = aiWarp.glitchSpeed;
            if (speedValBadge) speedValBadge.textContent = `${aiWarp.glitchSpeed.toFixed(1)}x`;
        }
        if (opacitySlider) {
            opacitySlider.value = aiWarp.masterOpacity;
            if (opacityValBadge) opacityValBadge.textContent = `${Math.round(aiWarp.masterOpacity * 100)}%`;
        }
        if (ghostSlider) {
            ghostSlider.value = aiWarp.ghostLevel;
            if (ghostValBadge) ghostValBadge.textContent = `${Math.round(aiWarp.ghostLevel * 100)}%`;
        }
        if (vsyncSlider) {
            vsyncSlider.value = aiWarp.vsyncLevel;
            if (vsyncValBadge) vsyncValBadge.textContent = `${Math.round(aiWarp.vsyncLevel * 100)}%`;
        }
    }

    /* ── 9. MASTER DOCK BUTTONS & CONTROLS WIRING ───────────────────────── */
    // Synth controls
    const synthBtn = document.getElementById('synthToggleBtn');
    if (synthBtn) synthBtn.onclick = toggleSyntheticAudio;

    const btnPlayKeygen = document.getElementById('btn-play-keygen');
    if (btnPlayKeygen) btnPlayKeygen.onclick = () => { currentSynthTrackIndex = 0; playSynthTrack('keygen'); };

    const btnPlayMellow = document.getElementById('btn-play-mellow');
    if (btnPlayMellow) btnPlayMellow.onclick = () => { currentSynthTrackIndex = 1; playSynthTrack('mellow'); };

    const btnPlayHybrid = document.getElementById('btn-play-hybrid');
    if (btnPlayHybrid) btnPlayHybrid.onclick = () => { currentSynthTrackIndex = 2; playSynthTrack('hybrid'); };

    const btnStopSynth = document.getElementById('btn-stop-synth');
    if (btnStopSynth) btnStopSynth.onclick = stopSyntheticAudio;

    // AI Warp toggle & cycle
    const aiWarpBtn = document.getElementById('aiWarpBtn');
    if (aiWarpBtn) {
        aiWarpBtn.onclick = () => {
            aiWarp.aiWarpActive = !aiWarp.aiWarpActive;
            if (aiWarp.aiWarpActive) aiWarp.triggerButtonEffect('ai_warp_pulse');
            syncUiFromEngine();
            showHudNotification(aiWarp.aiWarpActive ? `AI WARP: [ON] (${aiWarp.aiWarpMode.toUpperCase()})` : 'AI WARP: [OFF]');
        };
    }

    const warpModeBtn = document.getElementById('warpModeCycleBtn');
    const warpModeSelect = document.getElementById('warpModeSelect');

    if (warpModeBtn) {
        warpModeBtn.onclick = () => {
            const nextMode = aiWarp.cycleWarpMode();
            aiWarp.aiWarpActive = true;
            aiWarp.triggerButtonEffect('warp_mode_switch');
            if (warpModeSelect) warpModeSelect.value = nextMode;
            syncUiFromEngine();
            const idx = aiWarp.aiWarpModeIndex + 1;
            const total = aiWarp.aiWarpModes.length;
            showHudNotification(`WARP MODE: ${nextMode.toUpperCase()} [${idx}/${total}]`);
        };
    }

    if (warpModeSelect) {
        warpModeSelect.value = aiWarp.aiWarpMode;
        warpModeSelect.onchange = () => {
            const selected = warpModeSelect.value;
            aiWarp.setWarpMode(selected);
            aiWarp.aiWarpActive = true;
            aiWarp.triggerButtonEffect('warp_mode_switch');
            syncUiFromEngine();
            showHudNotification(`WARP MODE: ${selected.toUpperCase()}`);
        };
    }

    // Ghost Protocol
    const ghostBtn = document.getElementById('ghostProtocolBtn');
    if (ghostBtn) {
        ghostBtn.onclick = () => {
            if (aiWarp.ghostModes[aiWarp.ghostModeIndex] === 'OFF') {
                aiWarp.setGhostMode('SPECTRUM', 0.65);
                aiWarp.triggerButtonEffect('ghost_pulse');
            } else {
                const nextGhost = aiWarp.cycleGhostMode();
                if (nextGhost !== 'OFF') {
                    aiWarp.triggerButtonEffect('ghost_pulse');
                    if (aiWarp.ghostLevel <= 0.05) aiWarp.setGhostLevel(0.65);
                } else {
                    // R3 OFF is a bypass: retain the level for the next mode cycle.
                }
            }
            syncUiFromEngine();
            const curGhost = aiWarp.ghostModes[aiWarp.ghostModeIndex];
            showHudNotification(curGhost !== 'OFF' ? `GHOST: ${curGhost} [ON]` : `GHOST: OFF · ${Math.round(aiWarp.ghostLevel * 100)}% HELD`);
        };
    }

    // V-Sync Scan
    const vsyncBtn = document.getElementById('vsyncScanBtn');
    if (vsyncBtn) {
        vsyncBtn.onclick = () => {
            if (aiWarp.vsyncModes[aiWarp.vsyncModeIndex] === 'OFF') {
                aiWarp.setVsyncMode('FULL', 0.65);
                aiWarp.triggerButtonEffect('vsync_pulse');
            } else {
                const nextVsync = aiWarp.cycleVsyncMode();
                if (nextVsync !== 'OFF') {
                    aiWarp.triggerButtonEffect('vsync_pulse');
                    if (aiWarp.vsyncLevel <= 0.05) aiWarp.setVsyncLevel(0.65);
                } else {
                    // R3 OFF is a bypass: retain the V-Sync rail for instant re-entry.
                }
            }
            syncUiFromEngine();
            const curVsync = aiWarp.vsyncModes[aiWarp.vsyncModeIndex];
            showHudNotification(curVsync !== 'OFF' ? `V-SYNC: ${curVsync} [ON]` : `V-SYNC: OFF · ${Math.round(aiWarp.vsyncLevel * 100)}% HELD`);
        };
    }

    // Auto Glitch
    const autoGlitchBtn = document.getElementById('autoGlitchBtn');
    if (autoGlitchBtn) {
        autoGlitchBtn.onclick = () => {
            aiWarp.isAutoGlitch = !aiWarp.isAutoGlitch;
            if (aiWarp.isAutoGlitch) aiWarp.triggerButtonEffect('auto_glitch_pulse');
            syncUiFromEngine();
            showHudNotification(aiWarp.isAutoGlitch ? 'AUTO GLITCH: [ON] ENGAGED' : 'AUTO GLITCH: [OFF] STOPPED');
        };
    }

    // Randomize Board
    const randomizeBtn = document.getElementById('randomizeBtn');
    if (randomizeBtn) {
        randomizeBtn.onclick = () => {
            aiWarp.randomizeBoard();
            if (warpModeSelect) warpModeSelect.value = aiWarp.aiWarpMode;
            syncUiFromEngine();
            showHudNotification('🎲 EFFECTS BOARD RANDOMIZED');
        };
    }

    // Continual Randomize
    const continualRandBtn = document.getElementById('continualRandomizeBtn');
    if (continualRandBtn) {
        continualRandBtn.onclick = () => {
            aiWarp.isContinualRandom = !aiWarp.isContinualRandom;
            if (aiWarp.isContinualRandom) aiWarp.triggerButtonEffect('continual_rand_pulse');
            syncUiFromEngine();
            showHudNotification(aiWarp.isContinualRandom ? 'CONTINUAL RAND: [ON] ENGAGED' : 'CONTINUAL RAND: [OFF] STOPPED');
        };
    }

    // Automated Masters
    const autoMastersBtn = document.getElementById('autoMastersBtn');
    if (autoMastersBtn) {
        autoMastersBtn.onclick = () => {
            aiWarp.isAutomatedMasters = !aiWarp.isAutomatedMasters;
            syncUiFromEngine();
            showHudNotification(aiWarp.isAutomatedMasters ? 'AUTOMATED MASTERS: [ON] DRIFTING' : 'AUTOMATED MASTERS: [OFF] STOPPED');
        };
    }

    // Hard-Light Mode
    const hardLightBtn = document.getElementById('hardLightBtn');
    if (hardLightBtn) {
        hardLightBtn.onclick = () => {
            aiWarp.hardLightActive = !aiWarp.hardLightActive;
            document.body.classList.toggle('hard-light', aiWarp.hardLightActive);
            syncUiFromEngine();
            showHudNotification(aiWarp.hardLightActive ? 'ELECTRIC HARD-LIGHT: [ON]' : 'HARD-LIGHT: [OFF]');
        };
    }

    // Soft-Eye Pacing
    const softEyeBtn = document.getElementById('softEyeBtn');
    if (softEyeBtn) {
        softEyeBtn.onclick = () => {
            aiWarp.softEyeModeIndex = (aiWarp.softEyeModeIndex + 1) % aiWarp.softEyeModes.length;
            const mode = aiWarp.softEyeModes[aiWarp.softEyeModeIndex];
            aiWarp.softEyeActive = mode !== 'OFF';
            syncUiFromEngine();
            showHudNotification(`SOFT-EYE PACING: ${mode}`);
        };
    }

    if (aiWarp) {
        aiWarp.onSoftEyeProgress = (k, mode) => {
            if (softEyeBtn) softEyeBtn.style.setProperty('--k', k.toFixed(3));
        };
    }

    // DROP THE MILK? — deterministic soupy feedback + Milkdrop/projectM-inspired automation.
    const milkdropBtn = document.getElementById('milkdropBtn');
    if (milkdropBtn) {
        milkdropBtn.onclick = () => {
            aiWarp.setMilkdropActive(!aiWarp.milkdropActive);
            syncUiFromEngine();
            showHudNotification(aiWarp.milkdropActive
                ? 'DROP THE MILK? [ON] · SOUPY FEEDBACK / POLAR WAVES / AUTO PRESETS'
                : 'DROP THE MILK? [OFF]');
        };
    }

    // Ear Input
    const earBtn = document.getElementById('earBtn');
    if (earBtn) {
        const earModes = ['auto', 'audio', 'canvas'];
        let earIdx = 0;
        earBtn.onclick = () => {
            earIdx = (earIdx + 1) % earModes.length;
            const mode = earModes[earIdx];
            aiWarp.earMode = mode;
            earBtn.textContent = `EAR: ${mode.toUpperCase()}`;
            earBtn.className = `wired-button ear-${mode} active`;
            showHudNotification(`AUDIO REACTIVE EAR: ${mode.toUpperCase()}`);
        };
    }

    // Timed Automation
    const timedAutoBtn = document.getElementById('timedAutoBtn');
    if (timedAutoBtn) {
        timedAutoBtn.onclick = () => {
            if (!aiWarp.isTimedAuto) {
                aiWarp.isTimedAuto = true;
                aiWarp.timedCadenceIndex = 1;
                aiWarp.triggerButtonEffect('timed_auto_pulse');
            } else {
                aiWarp.timedCadenceIndex = (aiWarp.timedCadenceIndex + 1) % (aiWarp.timedCadences.length + 1);
                if (aiWarp.timedCadenceIndex >= aiWarp.timedCadences.length) {
                    aiWarp.isTimedAuto = false;
                    aiWarp.timedCadenceIndex = 0;
                } else {
                    aiWarp.triggerButtonEffect('timed_auto_pulse');
                }
            }
            syncUiFromEngine();
            const label = aiWarp.timedCadences[aiWarp.timedCadenceIndex] ? aiWarp.timedCadences[aiWarp.timedCadenceIndex].toUpperCase() : 'OFF';
            showHudNotification(aiWarp.isTimedAuto ? `TIMED AUTOMATION: [ON] · ${label}` : 'TIMED AUTOMATION: [OFF]');
        };
    }

    const cadenceBadge = document.getElementById('cadenceClockBadge');
    if (aiWarp) {
        aiWarp.onCadenceProgress = (state) => {
            if (!cadenceBadge) return;
            if (aiWarp.isTimedAuto) {
                const bCount = (state.beat % 4) + 1;
                const bIcon = '■'.repeat(bCount) + '□'.repeat(4 - bCount);
                cadenceBadge.textContent = `CADENCE: ${state.label} [${bIcon}] ${state.progress}%`;
                cadenceBadge.classList.toggle('pulse', state.progress < 15);
            } else {
                cadenceBadge.textContent = 'CADENCE: IDLE';
                cadenceBadge.classList.remove('pulse');
            }
        };
    }

    // Crescendo
    const crescendoBtn = document.getElementById('crescendoBtn');
    if (crescendoBtn) {
        crescendoBtn.onclick = () => {
            aiWarp.triggerButtonEffect('crescendo');
            if (aiWarp.triggerCrescendo) aiWarp.triggerCrescendo();
            syncUiFromEngine();
            showHudNotification('CRESCENDO OVERDRIVE ⚡ · ALL ENGINES OVERLOADED');
        };
    }

    // Rails
    const railButtons = document.querySelectorAll('.rail-btn');
    railButtons.forEach(btn => {
        btn.onclick = () => {
            const railVal = parseFloat(btn.getAttribute('data-rail')) || 1.0;
            aiWarp.masterOpacity = railVal;
            aiWarp.aiWarpStrength = railVal;
            aiWarp.effectNames.forEach(name => {
                if (!aiWarp.effectLocks[name] && aiWarp.effectEnabled[name]) {
                    aiWarp.effectAlphas[name] = +(railVal * (aiWarp.effectUserLevel[name] || 1.0)).toFixed(2);
                }
            });
            syncUiFromEngine();
            showHudNotification(`MASTER INTENSITY RAIL: ${Math.round(railVal * 100)}% APPLIED`);
        };
    });

    // Zero All (EMP Purge)
    const zeroAllBtn = document.getElementById('zeroAllBtn');
    if (zeroAllBtn) {
        zeroAllBtn.onclick = () => {
            aiWarp.zeroAll();
            syncUiFromEngine();
            showHudNotification('⚡ EMP PURGE DISCHARGE // ALL 34 VOICES + R3 SYSTEM RAILS ZEROED');
        };
    }

    // Quick Zero Sliders
    const nullSpeedBtn = document.getElementById('null-speed-btn');
    if (nullSpeedBtn) {
        nullSpeedBtn.onclick = () => {
            aiWarp.glitchSpeed = 0.1;
            syncUiFromEngine();
            showHudNotification('SPEED: 0.1x (ZEROED)');
        };
    }

    const nullOpacityBtn = document.getElementById('null-opacity-btn');
    if (nullOpacityBtn) {
        nullOpacityBtn.onclick = () => {
            aiWarp.masterOpacity = 0.0;
            syncUiFromEngine();
            showHudNotification('OPACITY: 0% (ZEROED)');
        };
    }

    const nullGhostBtn = document.getElementById('null-ghost-btn');
    if (nullGhostBtn) {
        nullGhostBtn.onclick = () => {
            aiWarp.setGhostLevel(0.0);
            aiWarp.ghostModeIndex = 0;
            syncUiFromEngine();
            showHudNotification('GHOST LEVEL: 0% (ZEROED)');
        };
    }

    const nullVsyncBtn = document.getElementById('null-vsync-btn');
    if (nullVsyncBtn) {
        nullVsyncBtn.onclick = () => {
            aiWarp.setVsyncLevel(0.0);
            aiWarp.vsyncModeIndex = 0;
            syncUiFromEngine();
            showHudNotification('V-SYNC LEVEL: 0% (ZEROED)');
        };
    }

    const milkdropOpacitySlider = document.getElementById('milkdropOpacitySlider');
    const milkdropOpacityValBadge = document.getElementById('milkdropOpacityValBadge');
    const milkdropOpacityLockBtn = document.getElementById('milkdropOpacityLockBtn');
    const nullMilkdropOpacityBtn = document.getElementById('null-milkdrop-opacity-btn');
    const vsyncLockBtn = document.getElementById('vsyncLockBtn');
    if (vsyncLockBtn) {
        vsyncLockBtn.onclick = () => {
            aiWarp.vsyncLocked = !aiWarp.vsyncLocked;
            vsyncLockBtn.textContent = aiWarp.vsyncLocked ? '🔒' : '🔓';
            vsyncLockBtn.classList.toggle('locked', aiWarp.vsyncLocked);
            showHudNotification(`V-SYNC ${aiWarp.vsyncLocked ? 'LOCKED' : 'UNLOCKED'}`);
        };
    }

    if (milkdropOpacityLockBtn) {
        milkdropOpacityLockBtn.onclick = () => {
            aiWarp.milkdropOpacityLocked = !aiWarp.milkdropOpacityLocked;
            if (!aiWarp.milkdropOpacityLocked && aiWarp.milkdropCurrentPreset) {
                aiWarp.milkdropTargetOpacity = aiWarp.milkdropCurrentPreset.opacity;
            }
            syncUiFromEngine();
            saveMilkdropControlState();
            showHudNotification(`DROP THE MILK OPACITY ${aiWarp.milkdropOpacityLocked ? 'LOCKED' : 'UNLOCKED'}`);
        };
    }
    if (nullMilkdropOpacityBtn) {
        nullMilkdropOpacityBtn.onclick = () => {
            aiWarp.setMilkdropOpacity(0);
            syncUiFromEngine();
            saveMilkdropControlState();
            showHudNotification('DROP THE MILK OPACITY: 0%');
        };
    }

    // Master AI Warp Strength Slider & Quick Actions
    const nullWarpBtn = document.getElementById('null-warp-btn');
    if (nullWarpBtn) {
        nullWarpBtn.onclick = () => {
            aiWarp.aiWarpStrength = 0.0;
            aiWarp.aiWarpActive = false;
            syncUiFromEngine();
            showHudNotification('AI WARP STRENGTH: 0% [NO WARP]');
        };
    }

    const burstWarpBtn = document.getElementById('burst-warp-btn');
    if (burstWarpBtn) {
        burstWarpBtn.onclick = () => {
            aiWarp.aiWarpStrength = 1.0;
            aiWarp.aiWarpActive = true;
            syncUiFromEngine();
            showHudNotification('AI WARP STRENGTH: 100% [FULL BURST ⚡]');
        };
    }

    const warpSlider = document.getElementById('ai-warp-strength-slider');
    const warpValBadge = document.getElementById('warpStrengthValBadge');
    if (warpSlider) {
        warpSlider.oninput = () => {
            const val = parseFloat(warpSlider.value);
            aiWarp.aiWarpStrength = val;
            aiWarp.aiWarpActive = val > 0.005;
            if (warpValBadge) warpValBadge.textContent = `${Math.round(val * 100)}%`;
            const warpBtn = document.getElementById('aiWarpBtn');
            if (warpBtn) {
                warpBtn.textContent = `AI WARP: [${aiWarp.aiWarpActive ? 'ON' : 'OFF'}] (${aiWarp.aiWarpMode.toUpperCase()})`;
                warpBtn.classList.toggle('active', aiWarp.aiWarpActive);
            }
        };
    }

    // Slider inputs
    const speedSlider = document.getElementById('glitch-speed-slider');
    const opacitySlider = document.getElementById('glitch-opacity-slider');
    const ghostSlider = document.getElementById('ghostProtocolSlider');
    const vsyncSlider = document.getElementById('vsyncScanSlider');
    const speedValBadge = document.getElementById('speedValBadge');
    const opacityValBadge = document.getElementById('opacityValBadge');
    const ghostValBadge = document.getElementById('ghostValBadge');
    const vsyncValBadge = document.getElementById('vsyncValBadge');

    if (speedSlider) {
        speedSlider.oninput = () => {
            aiWarp.glitchSpeed = parseFloat(speedSlider.value);
            if (speedValBadge) speedValBadge.textContent = `${aiWarp.glitchSpeed.toFixed(1)}x`;
        };
    }

    if (opacitySlider) {
        opacitySlider.oninput = () => {
            aiWarp.masterOpacity = parseFloat(opacitySlider.value);
            if (opacityValBadge) opacityValBadge.textContent = `${Math.round(aiWarp.masterOpacity * 100)}%`;
        };
    }

    if (ghostSlider) {
        ghostSlider.oninput = () => {
            const val = parseFloat(ghostSlider.value);
            aiWarp.setGhostLevel(val);
            if (ghostValBadge) ghostValBadge.textContent = `${Math.round(val * 100)}%`;
            if (val > 0.02 && aiWarp.ghostModes[aiWarp.ghostModeIndex] === 'OFF') {
                aiWarp.setGhostMode('SPECTRUM');
            } else if (val <= 0.02) {
                aiWarp.setGhostMode('OFF');
            }
            syncUiFromEngine();
        };
    }

    if (vsyncSlider) {
        vsyncSlider.oninput = () => {
            const val = parseFloat(vsyncSlider.value);
            aiWarp.setVsyncLevel(val);
            if (vsyncValBadge) vsyncValBadge.textContent = `${Math.round(val * 100)}%`;
            if (val > 0.02 && aiWarp.vsyncModes[aiWarp.vsyncModeIndex] === 'OFF') {
                aiWarp.setVsyncMode('FULL');
            } else if (val <= 0.02) {
                aiWarp.setVsyncMode('OFF');
            }
            syncUiFromEngine();
        };
    }
    if (milkdropOpacitySlider) {
        milkdropOpacitySlider.oninput = () => {
            const val = parseFloat(milkdropOpacitySlider.value);
            aiWarp.setMilkdropOpacity(val);
            if (milkdropOpacityValBadge) milkdropOpacityValBadge.textContent = `${Math.round(val * 100)}%`;
            saveMilkdropControlState();
        };
    }

    // Custom Background Button & File Picker
    const customBgBtn = document.getElementById('customBgBtn');
    const customBgFile = document.getElementById('customBgFile');
    if (customBgBtn && customBgFile) {
        customBgBtn.onclick = () => customBgFile.click();
        customBgFile.onchange = (e) => {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                files.forEach(imgFile => {
                    localImagesPool.push({
                        name: imgFile.name,
                        url: URL.createObjectURL(imgFile)
                    });
                });
                setArtworkIndex(localImagesPool.length - 1);
                startArtworkSlideshow();
                showHudNotification(`LOADED ${files.length} CUSTOM BACKGROUND IMAGES`);
            }
        };
    }

    /* ── 7. PRESET SYSTEM: MACHINE (80 PRESETS) & USER MODES ────────────── */
    const presetSelect = document.getElementById('presetSelect');
    const presetListToggleBtn = document.getElementById('presetListToggleBtn');
    const presetAutoBtn = document.getElementById('presetAutoBtn');
    const presetSaveBtn = document.getElementById('presetSaveBtn');
    const presetDeleteBtn = document.getElementById('presetDeleteBtn');
    const presetNameInput = document.getElementById('presetNameInput');
    const presetPrevBtn = document.getElementById('presetPrevBtn');
    const presetNextBtn = document.getElementById('presetNextBtn');

    function populatePresetList() {
        if (!presetSelect) return;
        presetSelect.innerHTML = '';
        const store = presetListMode === 'machine' ? machinePresets : userPresets;
        const keys = Object.keys(store);

        if (keys.length === 0 && presetListMode === 'user') {
            const opt = document.createElement('option');
            opt.textContent = '(No user presets saved)';
            opt.disabled = true;
            presetSelect.appendChild(opt);
            return;
        }

        keys.forEach(k => {
            const p = store[k];
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = p.tag ? `${k} · ${p.tag}` : k;
            presetSelect.appendChild(opt);
        });

        if (presetListToggleBtn) {
            presetListToggleBtn.textContent = presetListMode.toUpperCase();
            presetListToggleBtn.className = `wired-button preset-mode-${presetListMode}`;
        }
    }

    function applySelectedPreset(smooth = false) {
        if (!presetSelect || !aiWarp) return;
        const key = presetSelect.value;
        const store = presetListMode === 'machine' ? machinePresets : userPresets;
        if (store[key]) {
            aiWarp.applyPreset(store[key], smooth, 1400);
            syncUiFromEngine();
        }
    }

    if (presetSelect) {
        presetSelect.onchange = () => {
            applySelectedPreset(true);
            const store = presetListMode === 'machine' ? machinePresets : userPresets;
            const p = store[presetSelect.value];
            showHudNotification(`PRESET: ${presetSelect.value}${p && p.tag ? ' · ' + p.tag : ''} (SMOOTH)`);
        };
    }

    if (presetListToggleBtn) {
        presetListToggleBtn.onclick = () => {
            presetListMode = presetListMode === 'machine' ? 'user' : 'machine';
            populatePresetList();
            applySelectedPreset(true);
        };
    }

    if (presetPrevBtn) {
        presetPrevBtn.onclick = () => {
            const store = presetListMode === 'machine' ? machinePresets : userPresets;
            const keys = Object.keys(store);
            if (keys.length === 0) return;
            let idx = keys.indexOf(presetSelect.value);
            idx = (idx - 1 + keys.length) % keys.length;
            presetSelect.value = keys[idx];
            applySelectedPreset(true);
            const p = store[keys[idx]];
            showHudNotification(`PRESET [${idx + 1}/${keys.length}]: ${keys[idx]}${p && p.tag ? ' · ' + p.tag : ''} (SMOOTH)`);
        };
    }

    if (presetNextBtn) {
        presetNextBtn.onclick = () => {
            const store = presetListMode === 'machine' ? machinePresets : userPresets;
            const keys = Object.keys(store);
            if (keys.length === 0) return;
            let idx = keys.indexOf(presetSelect.value);
            idx = (idx + 1) % keys.length;
            presetSelect.value = keys[idx];
            applySelectedPreset(true);
            const p = store[keys[idx]];
            showHudNotification(`PRESET [${idx + 1}/${keys.length}]: ${keys[idx]}${p && p.tag ? ' · ' + p.tag : ''} (SMOOTH)`);
        };
    }

    if (presetSaveBtn) {
        presetSaveBtn.onclick = () => {
            const name = (presetNameInput && presetNameInput.value.trim()) || `User-${Object.keys(userPresets).length + 1}`;
            userPresets[name] = {
                tag: 'USER PRESET',
                alphas: Object.assign({}, aiWarp.effectAlphas),
                locks: Object.assign({}, aiWarp.effectLocks),
                toggles: {
                    autoGlitch: !!aiWarp.isAutoGlitch,
                    continualRandomize: !!aiWarp.isContinualRandom,
                    timedAutomation: !!aiWarp.isTimedAuto,
                    automatedMasters: !!aiWarp.isAutomatedMasters,
                    softEyeMode: aiWarp.softEyeModes[aiWarp.softEyeModeIndex] || 'OFF',
                    aiWarp: !!aiWarp.aiWarpActive
                },
                masterOpacity: aiWarp.masterOpacity,
                ghostMode: aiWarp.ghostModes[aiWarp.ghostModeIndex],
                ghostLevel: aiWarp.ghostLevel,
                vsyncMode: aiWarp.vsyncModes[aiWarp.vsyncModeIndex],
                vsyncLevels: aiWarp.r3GhostVsync ? {
                    ON: aiWarp.r3GhostVsync.scripts.ON.level,
                    GHOST_OFF: aiWarp.r3GhostVsync.scripts.GHOST_OFF.level,
                    FULL: aiWarp.r3GhostVsync.scripts.FULL.level
                } : { ON: aiWarp.vsyncLevel, GHOST_OFF: aiWarp.vsyncLevel, FULL: aiWarp.vsyncLevel },
                aiWarp: aiWarp.aiWarpActive,
                warpMode: aiWarp.aiWarpMode,
                warpStrength: aiWarp.aiWarpStrength
            };
            try {
                localStorage.setItem('ai_warp_user_presets', JSON.stringify(userPresets));
            } catch(e) {}
            presetListMode = 'user';
            populatePresetList();
            presetSelect.value = name;
            if (presetNameInput) presetNameInput.value = '';
            showHudNotification(`SAVED USER PRESET: ${name}`);
        };
    }

    if (presetDeleteBtn) {
        presetDeleteBtn.onclick = () => {
            if (presetListMode !== 'user') {
                showHudNotification('MACHINE PRESETS CANNOT BE DELETED');
                return;
            }
            const key = presetSelect.value;
            if (userPresets[key]) {
                delete userPresets[key];
                try {
                    localStorage.setItem('ai_warp_user_presets', JSON.stringify(userPresets));
                } catch(e) {}
                populatePresetList();
                applySelectedPreset(true);
                showHudNotification(`DELETED USER PRESET: ${key}`);
            }
        };
    }

    if (presetAutoBtn) {
        presetAutoBtn.onclick = () => {
            isAutoPresetRunning = !isAutoPresetRunning;
            presetAutoBtn.classList.toggle('active', isAutoPresetRunning);
            presetAutoBtn.textContent = isAutoPresetRunning ? 'AUTO: RUNNING ↺' : ' -ʁ%AUTO%ʁ- ';

            if (isAutoPresetRunning) {
                showHudNotification('⚡ PRESET AUTO-CYCLER ENGAGED (SMOOTH PROGRESSION)');
                const cycle = () => {
                    if (!isAutoPresetRunning) return;

                    const userKeys = Object.keys(userPresets);
                    const machineKeys = Object.keys(machinePresets);

                    // When automation starts, allow randomized next preset to be either the user or machine list
                    let chosenPool = 'machine';
                    if (userKeys.length > 0 && Math.random() < 0.5) {
                        chosenPool = 'user';
                    }

                    const store = chosenPool === 'user' ? userPresets : machinePresets;
                    const keys = Object.keys(store);

                    if (keys.length > 0) {
                        const randomKey = keys[Math.floor(Math.random() * keys.length)];

                        // Switch list mode tab if changed
                        if (presetListMode !== chosenPool) {
                            presetListMode = chosenPool;
                            if (presetListToggleBtn) {
                                presetListToggleBtn.textContent = presetListMode.toUpperCase();
                                presetListToggleBtn.className = `wired-button preset-mode-${presetListMode}`;
                            }
                            populatePresetList();
                        }

                        if (presetSelect) presetSelect.value = randomKey;
                        const p = store[randomKey];
                        if (p && aiWarp) {
                            // Smooth interpolated progression over 1.6s
                            aiWarp.applyPreset(p, true, 1600);
                            showHudNotification(`⚡ AUTO-PRESET [${chosenPool.toUpperCase()}]: ${randomKey}${p.tag ? ' · ' + p.tag : ''} (SMOOTH TRANSITION)`);
                        }
                    }
                    const nextMs = 4500 + Math.random() * 2500;
                    autoPresetTimer = setTimeout(cycle, nextMs);
                };
                cycle();
            } else {
                if (autoPresetTimer) clearTimeout(autoPresetTimer);
                showHudNotification('PRESET AUTO-CYCLER STOPPED');
            }
        };
    }

    populatePresetList();
    if (presetSelect && presetSelect.options.length > 0) {
        presetSelect.selectedIndex = 0;
        // Start with a clean, focused board (user selects presets when desired)
        syncUiFromEngine();
    }

    /* ── 10. FREEZE FRAME (SCREENSHOT CAPTURE) ──────────────────────────── */
    const freezeFrameBtn = document.getElementById('freezeFrameBtn');
    if (freezeFrameBtn) {
        freezeFrameBtn.onclick = () => {
            const mainCanvas = document.getElementById('glitchCanvas');
            if (window.html2canvas) {
                html2canvas(document.body, { backgroundColor: null, useCORS: true }).then(canvas => {
                    downloadCanvas(canvas);
                }).catch(() => {
                    if (mainCanvas) downloadCanvas(mainCanvas);
                });
            } else if (mainCanvas) {
                downloadCanvas(mainCanvas);
            }
            showHudNotification('FREEZE FRAME 📷 // SCREENSHOT CAPTURED');
        };
    }

    function downloadCanvas(canvas) {
        const link = document.createElement('a');
        link.download = `ai-warp-freeze-frame-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /* ── 11. TABIFIED COLLAPSIBLE UI (HIDE / SHOW 100% OF U.I.) ─────────── */
    const uiTab = document.getElementById('ui-toggle-tab');
    const toggleUiBtn = document.getElementById('toggle-ui-btn');
    let isUiHidden = false;

    function toggleFullscreenUi(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        isUiHidden = !isUiHidden;
        document.body.classList.toggle('ui-collapsed', isUiHidden);
        document.body.classList.toggle('ui-hidden', isUiHidden);

        if (toggleUiBtn) {
            toggleUiBtn.textContent = isUiHidden ? 'SHOW CONTROL U.I. ◀' : 'HIDE CONTROL U.I. ▶';
        }
        if (uiTab) {
            uiTab.classList.toggle('ui-collapsed', isUiHidden);
            uiTab.setAttribute('title', isUiHidden ? 'Click to Restore HUD' : 'Click to Collapse UI');
        }
        showHudNotification(isUiHidden ? 'FULLSCREEN IMMERSION // HUD COLLAPSED' : 'CONTROL HUD RESTORED');
    }

    if (toggleUiBtn) toggleUiBtn.onclick = toggleFullscreenUi;
    if (uiTab) {
        uiTab.onclick = (e) => {
            if (e.target !== toggleUiBtn) toggleFullscreenUi(e);
        };
    }

    /* ── 12. THEME ENGINE ───────────────────────────────────────────────── */
    const themeButtons = document.querySelectorAll('[data-theme]');
    themeButtons.forEach(btn => {
        btn.onclick = () => {
            const themeKey = btn.getAttribute('data-theme');
            applyTheme(themeKey);
        };
    });

    function applyTheme(themeKey) {
        const themePresets = {
            cyber: { accent: '#00ffaa', sub: '#00d084', bg: '#04070a', card: '#0c1218', line: 'rgba(0,255,170,.32)', glow: 'rgba(0,255,170,.45)', text: '#e0fff4' },
            neon:  { accent: '#ff007f', sub: '#00e5ff', bg: '#090314', card: '#140824', line: 'rgba(255,0,127,.36)', glow: 'rgba(255,0,127,.50)', text: '#ffe0f0' },
            gold:  { accent: '#ffb703', sub: '#fb8500', bg: '#0d0904', card: '#191309', line: 'rgba(255,183,3,.34)', glow: 'rgba(255,183,3,.45)', text: '#fff5d6' },
            cyan:  { accent: '#00e5ff', sub: '#0090ff', bg: '#030a10', card: '#081724', line: 'rgba(0,229,255,.35)', glow: 'rgba(0,229,255,.48)', text: '#d6f8ff' },
            white: { accent: '#ffffff', sub: '#a0a0a8', bg: '#121214', card: '#1e1e22', line: 'rgba(255,255,255,.28)', glow: 'rgba(255,255,255,.35)', text: '#f4f4f6' },
            retro: { accent: '#bb86fc', sub: '#03dac6', bg: '#080512', card: '#140e2b', line: 'rgba(187,134,252,.32)', glow: 'rgba(187,134,252,.45)', text: '#f0e6ff' }
        };
        const t = (configData && configData.themes && configData.themes[themeKey]) || themePresets[themeKey] || themePresets.cyber;
        const rootStyle = document.documentElement.style;
        rootStyle.setProperty('--theme-accent', t.accent);
        rootStyle.setProperty('--theme-sub', t.sub);
        rootStyle.setProperty('--theme-bg', t.bg);
        rootStyle.setProperty('--theme-card', t.card);
        rootStyle.setProperty('--theme-line', t.line);
        rootStyle.setProperty('--theme-glow', t.glow);
        rootStyle.setProperty('--theme-text', t.text);

        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === themeKey);
        });
        showHudNotification(`THEME ACTIVATED: ${themeKey.toUpperCase()}`);
    }

    applyTheme('cyber');

    /* ── 14. AUDIO REACTIVE EQ GAIN DRAWER ────────────────────────────────── */
    const eqDrawerBtn = document.getElementById('eqDrawerBtn');
    const eqCloseBtn = document.getElementById('eqCloseBtn');
    const eqDrawer = document.getElementById('eqDrawer');
    const eqBassGain = document.getElementById('eqBassGain');
    const eqMidGain = document.getElementById('eqMidGain');
    const eqTrebleGain = document.getElementById('eqTrebleGain');
    const eqBassVal = document.getElementById('eqBassVal');
    const eqMidVal = document.getElementById('eqMidVal');
    const eqTrebleVal = document.getElementById('eqTrebleVal');

    if (eqDrawerBtn && eqDrawer) {
        eqDrawerBtn.onclick = () => {
            const isOpen = eqDrawer.classList.toggle('open');
            eqDrawerBtn.classList.toggle('active', isOpen);
            if (isOpen) showHudNotification('AUDIO REACTIVE EQ SENSITIVITY OPEN');
        };
    }

    if (eqCloseBtn && eqDrawer) {
        eqCloseBtn.onclick = () => {
            eqDrawer.classList.remove('open');
            if (eqDrawerBtn) eqDrawerBtn.classList.remove('active');
        };
    }

    if (eqBassGain) {
        eqBassGain.oninput = () => {
            eqGains.bass = parseFloat(eqBassGain.value);
            if (eqBassVal) eqBassVal.textContent = `${eqGains.bass.toFixed(1)}x`;
        };
    }

    if (eqMidGain) {
        eqMidGain.oninput = () => {
            eqGains.mid = parseFloat(eqMidGain.value);
            if (eqMidVal) eqMidVal.textContent = `${eqGains.mid.toFixed(1)}x`;
        };
    }

    if (eqTrebleGain) {
        eqTrebleGain.oninput = () => {
            eqGains.treble = parseFloat(eqTrebleGain.value);
            if (eqTrebleVal) eqTrebleVal.textContent = `${eqGains.treble.toFixed(1)}x`;
        };
    }

    const eqPresetButtons = document.querySelectorAll('.eq-preset-btn');
    eqPresetButtons.forEach(btn => {
        btn.onclick = () => {
            const p = btn.getAttribute('data-eq');
            if (p === 'bass') { eqGains = { bass: 2.2, mid: 0.9, treble: 0.9 }; }
            else if (p === 'vocal') { eqGains = { bass: 0.9, mid: 2.0, treble: 1.0 }; }
            else if (p === 'crisp') { eqGains = { bass: 0.8, mid: 1.0, treble: 2.2 }; }
            else { eqGains = { bass: 1.0, mid: 1.0, treble: 1.0 }; }

            if (eqBassGain) eqBassGain.value = eqGains.bass;
            if (eqMidGain) eqMidGain.value = eqGains.mid;
            if (eqTrebleGain) eqTrebleGain.value = eqGains.treble;
            if (eqBassVal) eqBassVal.textContent = `${eqGains.bass.toFixed(1)}x`;
            if (eqMidVal) eqMidVal.textContent = `${eqGains.mid.toFixed(1)}x`;
            if (eqTrebleVal) eqTrebleVal.textContent = `${eqGains.treble.toFixed(1)}x`;
            showHudNotification(`EQ PRESET: ${p.toUpperCase()}`);
        };
    });

    /* ── 15. KEYBOARD SHORTCUTS MODAL & VJ PERFORMANCE HOTKEYS ─────────────── */
    const shortcutsBtn = document.getElementById('shortcutsBtn');
    const shortcutsCloseBtn = document.getElementById('shortcutsCloseBtn');
    const shortcutsModal = document.getElementById('shortcutsModal');

    function toggleShortcutsModal() {
        if (!shortcutsModal) return;
        const isOpen = shortcutsModal.classList.toggle('open');
        if (shortcutsBtn) shortcutsBtn.classList.toggle('active', isOpen);
    }

    if (shortcutsBtn) shortcutsBtn.onclick = toggleShortcutsModal;
    if (shortcutsCloseBtn) shortcutsCloseBtn.onclick = toggleShortcutsModal;

    // Global VJ Performance Hotkeys
    window.onkeydown = (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
            if (e.key === 'Escape') document.activeElement.blur();
            return;
        }

        const key = e.key.toLowerCase();

        if (e.key === '?' || (e.shiftKey && key === '/')) {
            toggleShortcutsModal();
            return;
        }

        if (e.code === 'Space') {
            e.preventDefault();
            if (currentMediaKind === 'audio' && localAudio) {
                if (localAudio.paused) localAudio.play(); else localAudio.pause();
            } else if ((currentMediaKind === 'video' || currentMediaKind === 'capture') && localVideo) {
                if (localVideo.paused) localVideo.play().catch(() => {}); else localVideo.pause();
            } else if (activeAudioElement) {
                if (activeAudioElement.paused) activeAudioElement.play(); else activeAudioElement.pause();
            } else {
                toggleSyntheticAudio();
            }
            return;
        }

        if (key === 'w') {
            const nextMode = aiWarp.cycleWarpMode();
            aiWarp.triggerButtonEffect('warp_mode_switch');
            if (warpModeSelect) warpModeSelect.value = nextMode;
            syncUiFromEngine();
            showHudNotification(`WARP MODE: ${nextMode.toUpperCase()}`);
            return;
        }

        if (key === 'g') {
            const gBtn = document.getElementById('ghostProtocolBtn');
            if (gBtn) gBtn.click();
            return;
        }

        if (key === 'v') {
            const vBtn = document.getElementById('vsyncScanBtn');
            if (vBtn) vBtn.click();
            return;
        }

        if (key === 'a') {
            const aBtn = document.getElementById('autoGlitchBtn');
            if (aBtn) aBtn.click();
            return;
        }

        if (key === 'r') {
            const rBtn = document.getElementById('randomizeBtn');
            if (rBtn) rBtn.click();
            return;
        }

        if (key === 't') {
            const tBtn = document.getElementById('timedAutoBtn');
            if (tBtn) tBtn.click();
            return;
        }

        if (key === 'c') {
            const cBtn = document.getElementById('crescendoBtn');
            if (cBtn) cBtn.click();
            return;
        }

        if (key === 'd') {
            const milkBtn = document.getElementById('milkdropBtn');
            if (milkBtn) milkBtn.click();
            return;
        }

        if (key === 'z') {
            const zBtn = document.getElementById('zeroAllBtn');
            if (zBtn) zBtn.click();
            return;
        }

        if (key === 'm') {
            const mBtn = document.getElementById('micToggleBtn');
            if (mBtn) mBtn.click();
            return;
        }

        if (key === 'n') {
            const nBtn = document.getElementById('ytCaptureTabBtn');
            if (nBtn && !nBtn.disabled) nBtn.click();
            return;
        }

        if (key === 'y') {
            const playlistBtn = document.getElementById('ytPlaylistBtn');
            if (playlistBtn) playlistBtn.click();
            return;
        }

        if (key === 'e') {
            const earModeBtn = document.getElementById('earBtn');
            if (earModeBtn) earModeBtn.click();
            return;
        }

        if (key === 'h') {
            toggleFullscreenUi();
            return;
        }

        if (key === 's') {
            const freezeBtn = document.getElementById('freezeFrameBtn');
            if (freezeBtn) freezeBtn.click();
            return;
        }

        // Keys 1..9 quick-toggle glitch voices 1..9
        if (e.key >= '1' && e.key <= '9') {
            const idx = parseInt(e.key, 10) - 1;
            if (idx < aiWarp.effectNames.length) {
                const name = aiWarp.effectNames[idx];
                const active = aiWarp.toggleEffect(name);
                syncUiFromEngine();
                showHudNotification(`HOTKEY [${e.key}]: ${name} ${active ? '[ON]' : '[OFF]'}`);
            }
        }
    };

    // Initial master UI sync
    syncUiFromEngine();
});
