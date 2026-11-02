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
        version: 'engine-1.3-hsl'
    };
})(typeof window !== 'undefined' ? window : this);
