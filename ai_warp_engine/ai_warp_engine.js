;/* ===== ai_warp_engine.js ===== */
/**
 * AI WARP ENGINE — HYPER-INTEGRATED SYNTHESIS (v6.4.38.21-ULTIMATE)
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
 * - Canvas/WebGL displacement core + final full-canvas B&W/Hue treatment; the only SVG usage
 *   is the compositor-level Warp Lens displacement on the YouTube shell (no JS pixel readback)
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

    function deepFreeze(value) {
        if (value && typeof value === 'object' && !Object.isFrozen(value)) {
            Object.freeze(value);
            Object.values(value).forEach(deepFreeze);
        }
        return value;
    }

    // The raymarcher is drawn at most this large and scaled onto the lens canvas.
    const TECH_ARTIST_MAX_PIXELS = 2560 * 1440;
    // A failed WebGL start is retried this rarely, so a GPU-less session never stalls frames on it.
    const TECH_ARTIST_RETRY_MS = 5000;

    /* Hardcoded 6.4.36 effect registry. The effect banks below are the untouched 6.4.36
       sources and their LF-normalised SHA-256 values are pinned here and in the test-suite.
       Every voice, warp mode, Ghost/V-Sync rail and Milkdrop preset is plain in-page
       Canvas/WebGL code: nothing is transcoded, piped or rendered by an external tool. */
    const FX_MANIFEST = deepFreeze({
        baseline: '6.4.36',
        voices: {
            core: [
                'Neon Grad', 'Scanlines', 'Data Bands', 'Flash', 'HSL Rainbow', 'ASCII',
                'Font Burn', 'Strobe', 'Gemini Bomb', 'Tech Artist', 'VHS Glitch',
                'Data Bomb', 'Ink Glyphs', 'Matrix ASCII', 'Matrix Chord',
                'B&W Invert', 'Hue/Color Cycle'
            ],
            gc3: [
                'ASCII GC#(3)', 'B&W Invert GC#(3)', 'Data Bands GC#(3)', 'Data Bomb GC#(3)',
                'Flash GC#(3)', 'Font Burn GC#(3)', 'Gemini Bomb GC#(3)', 'HSL Rainbow GC#(3)',
                'Hue/Color Cycle GC#(3)', 'Ink Glyphs GC#(3)', 'Matrix ASCII GC#(3)',
                'Matrix Chord GC#(3)', 'Neon Grad GC#(3)', 'Scanlines GC#(3)', 'Strobe GC#(3)',
                'Tech Artist GC#(3)', 'VHS Glitch GC#(3)'
            ]
        },
        warp: {
            zero: 'ai_zero',
            modes: [
                'liquid', 'prism', 'breathe', 'fold', 'aurora',
                'vortex', 'cybergrid', 'hyperdrive', 'kaleidoscope',
                'quantum', 'ripple', 'analog_crt',
                'newblue_roll', 'newblue_active_cam', 'newblue_shear', 'newblue_wiggle',
                'newblue_zoom_blur', 'newblue_video_tile', 'newblue_twirl', 'newblue_light_ring',
                'newblue_earthquake', 'newblue_water_drop', 'newblue_rgb_shift', 'newblue_quad_mirror',
                'newblue_fish_eye', 'newblue_pinch', 'newblue_solarize', 'newblue_cathode_beam', 'newblue_neon_edges'
            ]
        },
        ghostModes: ['OFF', 'DIA', 'SPECTRUM', 'CRT', 'PLASMA', 'LED'],
        vsyncModes: ['OFF', 'ON', 'GHOST_OFF', 'FULL'],
        softEyeModes: ['OFF', 'CALM', 'SURGE', 'CRESCENDO'],
        timedCadences: ['1_bar', '2_bar', '4_bar', 'soft_eye', 'lfo_wave', 'half_beat'],
        milkdrop: { presets: 80 },
        banks: {
            'glitch_engine.js': '5d8a18d078a5543ecd3a90c34f714fe85b741eee934281a944a38071cbef9650',
            'r3_gc3_factories.js': '67fe9840e64133584825cd1e73310349eb80d8909f77ec23493b0c9a80217448',
            'r3_ghost_vsync.js': '7138afb8cbaec5280f9fc613f28f5c8f1802dfc2558033dfb0ca8d544fef7167',
            'yt_lens.html': 'b32b8ffc1e874129cc75aa40e66036d021f7aa35054eac8751a6d1f391227334'
        }
    });

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
            ctx.drawImage(media, 0, 0, cw, ch);
            return;
        }
        const scale = Math.max(cw / mw, ch / mh);
        const nw = mw * scale;
        const nh = mh * scale;
        const cx = (cw - nw) * 0.5;
        const cy = (ch - nh) * 0.5;
        ctx.drawImage(media, cx, cy, nw, nh);
    }

    class AiWarpEngine {
        constructor(canvasId, options = {}) {
            this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
            if (!this.canvas || typeof this.canvas.getContext !== 'function') {
                throw new Error(`AiWarpEngine: Canvas "${canvasId}" not found.`);
            }
            // Present complete FX frames rather than allowing low-latency mid-pass scanout.
            this.gctx = this.canvas.getContext('2d', { alpha: true, desynchronized: false });
            if (!this.gctx) throw new Error('AiWarpEngine: Canvas 2D rendering is unavailable.');
            this.options = options;
            this._deterministicState = 0x6D2B79F5;
            this.automationPass = 0;

            // Warp Modes (12 Algorithmic Visual Deformations)
            this.aiWarpActive = options.aiWarpActive !== undefined ? !!options.aiWarpActive : true;
            this.aiWarpStrength = options.aiWarpStrength !== undefined ? options.aiWarpStrength : 0.65;
            this.aiWarpModes = [
                'ai_zero',
                'liquid', 'prism', 'breathe', 'fold', 'aurora',
                'vortex', 'cybergrid', 'hyperdrive', 'kaleidoscope',
                'quantum', 'ripple', 'analog_crt',
                'newblue_roll', 'newblue_active_cam', 'newblue_shear', 'newblue_wiggle',
                'newblue_zoom_blur', 'newblue_video_tile', 'newblue_twirl', 'newblue_light_ring',
                'newblue_earthquake', 'newblue_water_drop', 'newblue_rgb_shift', 'newblue_quad_mirror',
                'newblue_fish_eye', 'newblue_pinch', 'newblue_solarize', 'newblue_cathode_beam', 'newblue_neon_edges'
            ];
            this.presetTransition = null;
            this.aiWarpModeIndex = this.aiWarpModes.indexOf('liquid');
            this.aiWarpMode = this.aiWarpModes[this.aiWarpModeIndex];
            this.aiWarpHue = 0;
            this.aiWarpSeed = Math.random() * 1000;
            this.aiWarpState = { disp: 2.0, freq: 0.001, pulse: 0.3, fold: 0, aurora: 0, scale: 1.0, driftX: 0, driftY: 0, skewX: 0, skewY: 0 };
            this.warpTime = 0;
            this.warpClockAt = null;
            this.warpRenderedMode = null;
            this.warpTransitionAt = null;
            this.warpTransitionDuration = 240;
            this.hasCompletedFrame = false;

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
            this.warpCanvas = document.createElement('canvas');
            this.warpCtx = this.warpCanvas.getContext('2d');
            this.warpTransitionCanvas = document.createElement('canvas');
            this.warpTransitionCtx = this.warpTransitionCanvas.getContext('2d');
            this.completedFrameCanvas = document.createElement('canvas');
            this.completedFrameCtx = this.completedFrameCanvas.getContext('2d');
            this.milkdropFeedbackCanvas = document.createElement('canvas');
            this.milkdropFeedbackCtx = this.milkdropFeedbackCanvas.getContext('2d');
            this.milkdropNextCanvas = document.createElement('canvas');
            this.milkdropNextCtx = this.milkdropNextCanvas.getContext('2d');
            if (![this.workCtx, this.ghostCtx, this.genCtx, this.warpCtx, this.warpTransitionCtx,
                this.completedFrameCtx, this.milkdropFeedbackCtx, this.milkdropNextCtx].every(Boolean)) {
                throw new Error('AiWarpEngine: Could not allocate the effects rendering buffers.');
            }
            this.renderErrors = new Map();

            // Three.js Tech Artist Shader
            this.techArtistShader = null;
            this.techArtistRetryAt = 0;
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
            this.voiceLockSnap = {};
            this.masterLocks = { speed: false, opacity: false, ghost: false };
            this.masterLockSnap = {};
            this.voiceFxSettings = { bwInvert: 1, hueOffset: 0 };
            this.voiceFxLocks = { bwInvert: false, hueOffset: false };
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
            this.fxRegistryReport = this.verifyFxRegistry();
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
            if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.resize());
            if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(this.canvas);
            window.addEventListener('mousemove', (e) => {
                const nx = e.clientX / Math.max(1, window.innerWidth);
                const ny = 1.0 - (e.clientY / Math.max(1, window.innerHeight));
                this.techArtistVelocity.x = Math.max(-1, Math.min(1, (nx - this.techArtistLastMouse.x) * 6));
                this.techArtistVelocity.y = Math.max(-1, Math.min(1, (ny - this.techArtistLastMouse.y) * 6));
                this.techArtistMouse = { x: nx, y: ny };
                this.techArtistLastMouse = { x: nx, y: ny };
            });
        }

        measureCanvasLayout() {
            const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
            const cssWidth = this.canvas.clientWidth || window.innerWidth;
            const cssHeight = this.canvas.clientHeight || window.innerHeight;
            return { cssWidth, cssHeight, dpr, width: Math.round(cssWidth * dpr), height: Math.round(cssHeight * dpr) };
        }

        getTechArtistBufferSize(width = this.canvas.width, height = this.canvas.height) {
            const scale = Math.min(1, Math.sqrt(TECH_ARTIST_MAX_PIXELS / Math.max(1, width * height)));
            return { width: Math.max(2, Math.round(width * scale)), height: Math.max(2, Math.round(height * scale)) };
        }

        // Keeps every effect buffer at exactly the lens-canvas size so no layer is cropped or off-centre,
        // and re-draws the last picture into the new buffers so a resize never shows a blank frame.
        resize() {
            const layout = this.measureCanvasLayout();
            if (layout.cssWidth < 2 || layout.cssHeight < 2) return false;
            const { width, height } = layout;
            const buffers = [this.canvas, this.workCanvas, this.ghostCanvas, this.genCanvas, this.warpCanvas,
                this.warpTransitionCanvas, this.completedFrameCanvas, this.milkdropFeedbackCanvas, this.milkdropNextCanvas];
            const changed = buffers.some(c => c && (c.width !== width || c.height !== height));
            if (changed) {
                this.resizeBuffers(width, height);
                this.warpRenderedMode = null;
                this.warpTransitionAt = null;
            }
            this.syncTechArtistSize();
            return changed;
        }

        resizeBuffers(width, height) {
            const scratch = this.workCanvas;
            // Assigning a canvas size clears it, so the pictures that must survive pass through the scratch buffer.
            const carried = [
                [this.canvas, [this.canvas, this.completedFrameCanvas]],
                [this.genCanvas, [this.genCanvas]],
                [this.milkdropFeedbackCanvas, [this.milkdropFeedbackCanvas]]
            ];
            for (const [source, targets] of carried) {
                const hasPicture = source.width > 0 && source.height > 0
                    && targets.some(c => c.width !== width || c.height !== height);
                if (hasPicture) {
                    scratch.width = source.width;
                    scratch.height = source.height;
                    this.workCtx.drawImage(source, 0, 0);
                }
                for (const target of targets) {
                    if (target.width === width && target.height === height) continue;
                    target.width = width;
                    target.height = height;
                    if (hasPicture) target.getContext('2d').drawImage(scratch, 0, 0, width, height);
                }
            }
            [this.workCanvas, this.ghostCanvas, this.warpCanvas, this.warpTransitionCanvas, this.milkdropNextCanvas].forEach(c => {
                if (c.width !== width || c.height !== height) {
                    c.width = width;
                    c.height = height;
                }
            });
        }

        syncTechArtistSize() {
            const shader = this.techArtistShader;
            if (!shader || !shader.renderer) return null;
            const size = this.getTechArtistBufferSize();
            if (shader.width !== size.width || shader.height !== size.height) {
                shader.renderer.setPixelRatio(1);
                shader.renderer.setSize(size.width, size.height, false);
                shader.uniforms.resolution.value.set(size.width, size.height);
                shader.width = size.width;
                shader.height = size.height;
            }
            return shader;
        }

        // Diagnostic: reports whether every effect buffer matches the lens canvas for the current CSS size and DPR.
        getCanvasLayout() {
            const layout = this.measureCanvasLayout();
            const named = {
                main: this.canvas, work: this.workCanvas, ghost: this.ghostCanvas, gen: this.genCanvas,
                warp: this.warpCanvas, warpTransition: this.warpTransitionCanvas,
                completedFrame: this.completedFrameCanvas, milkdropFeedback: this.milkdropFeedbackCanvas,
                milkdropNext: this.milkdropNextCanvas
            };
            const buffers = {};
            const mismatched = [];
            for (const [name, canvas] of Object.entries(named)) {
                buffers[name] = { width: canvas.width, height: canvas.height };
                if (canvas.width !== layout.width || canvas.height !== layout.height) mismatched.push(name);
            }
            let techArtist = null;
            const shader = this.techArtistShader;
            if (shader && shader.renderer) {
                const expected = this.getTechArtistBufferSize(layout.width, layout.height);
                const uniform = shader.uniforms.resolution.value;
                techArtist = {
                    width: shader.canvas.width, height: shader.canvas.height,
                    resolution: { width: uniform.x, height: uniform.y }, expected
                };
                if (shader.canvas.width !== expected.width || shader.canvas.height !== expected.height
                    || uniform.x !== shader.canvas.width || uniform.y !== shader.canvas.height) mismatched.push('techArtist');
            }
            return {
                css: { width: layout.cssWidth, height: layout.cssHeight }, dpr: layout.dpr,
                expected: { width: layout.width, height: layout.height },
                buffers, techArtist, mismatched, aligned: mismatched.length === 0
            };
        }

        /* ── FROZEN 6.4.36 EFFECT REGISTRY ─────────────────────────────────────── */
        // Never throws or blocks playback: a mismatch is reported once and the engine keeps running.
        verifyFxRegistry() {
            const problems = [];
            const same = (label, actual, expected) => {
                if (!Array.isArray(actual) || actual.length !== expected.length || actual.some((v, i) => v !== expected[i])) {
                    problems.push(`${label} differ from the ${FX_MANIFEST.baseline} registry.`);
                }
            };
            same('Core voices', this.coreEffectNames, FX_MANIFEST.voices.core);
            same('GC#(3) voices', this.gc3EffectNames, FX_MANIFEST.voices.gc3);
            same('AI Warp modes', this.aiWarpModes, [FX_MANIFEST.warp.zero].concat(FX_MANIFEST.warp.modes));
            same('Ghost modes', this.ghostModes, FX_MANIFEST.ghostModes);
            same('V-Sync modes', this.vsyncModes, FX_MANIFEST.vsyncModes);
            same('Soft-Eye modes', this.softEyeModes, FX_MANIFEST.softEyeModes);
            same('Timed cadences', this.timedCadences, FX_MANIFEST.timedCadences);
            if (this.milkdropPresetDeck.length !== FX_MANIFEST.milkdrop.presets) problems.push('The Milkdrop preset deck size changed.');
            const voiceCount = FX_MANIFEST.voices.core.length + FX_MANIFEST.voices.gc3.length;
            if (this.activeEffects.length !== voiceCount) {
                problems.push(`Expected ${voiceCount} voice runners but found ${this.activeEffects.length}.`);
            }
            if (!this.r3GhostVsync) problems.push('The R3 Ghost Protocol / V-Sync rails are not running.');
            if (problems.length) console.warn('AI WARP FX registry:', problems.join(' '));
            return {
                ok: problems.length === 0, baseline: FX_MANIFEST.baseline,
                voices: this.activeEffects.length, warpModes: FX_MANIFEST.warp.modes.length, problems
            };
        }

        // Re-hashes the effect banks actually served to this page against the pinned 6.4.36 sources.
        async attestEffectBanks(baseUrl = '') {
            const report = { baseline: FX_MANIFEST.baseline, ok: false, files: {}, problems: [] };
            const subtle = window.crypto && window.crypto.subtle;
            if (!subtle || typeof window.fetch !== 'function') {
                report.problems.push('Hashing is unavailable in this context.');
                return report;
            }
            for (const [file, expected] of Object.entries(FX_MANIFEST.banks)) {
                try {
                    const response = await window.fetch(baseUrl + file, { cache: 'no-store' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const raw = new Uint8Array(await response.arrayBuffer());
                    const bytes = new Uint8Array(raw.length);
                    let length = 0;
                    for (let i = 0; i < raw.length; i++) {
                        if (raw[i] === 13 && raw[i + 1] === 10) continue;
                        bytes[length++] = raw[i];
                    }
                    const digest = await subtle.digest('SHA-256', bytes.subarray(0, length));
                    const actual = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
                    report.files[file] = { sha256: actual, match: actual === expected };
                    if (actual !== expected) report.problems.push(`${file} differs from the ${FX_MANIFEST.baseline} source.`);
                } catch (error) {
                    report.files[file] = { sha256: null, match: false };
                    report.problems.push(`${file} could not be verified: ${error && error.message || error}`);
                }
            }
            report.ok = report.problems.length === 0;
            return report;
        }

        setSourceMode(mode, element = null) {
            this.hasCompletedFrame = false;
            this.warpRenderedMode = null;
            this.warpTransitionAt = null;
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
                if (mode === 'ai_zero') {
                    this.warpRenderedMode = null;
                    this.warpTransitionAt = null;
                    this.hasCompletedFrame = false;
                    this.applyZeroMotionGhost();
                }
            }
        }

        cycleWarpMode() {
            this.setWarpMode(this.aiWarpModes[(this.aiWarpModeIndex + 1) % this.aiWarpModes.length]);
            return this.aiWarpMode;
        }

        setAiWarpActive(active) {
            this.aiWarpActive = !!active;
            if (!this.aiWarpActive) {
                this.warpRenderedMode = null;
                this.warpTransitionAt = null;
                this.hasCompletedFrame = false;
            }
            return this.aiWarpActive;
        }

        setAiWarpStrength(val) {
            this.aiWarpStrength = Math.max(0.0, Math.min(1.0, parseFloat(val) || 0.0));
            if (this.aiWarpStrength <= 0.01) {
                this.warpRenderedMode = null;
                this.warpTransitionAt = null;
                this.hasCompletedFrame = false;
            }
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
            if (mode === 'ai_zero') return { bfX, bfY, scale: 0, type };
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
                case 'newblue_twirl':       bfX = 0.004;  bfY = 0.004;  amp = 30; break;
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
                this.warpRenderedMode = null;
                this.warpTransitionAt = null;
            }
            this.snapshotVoiceLock(name);
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
                this.warpRenderedMode = null;
                this.warpTransitionAt = null;
            } else {
                this.effectUserDisabled[name] = false;
            }
            this.snapshotVoiceLock(name);
        }

        setEffectSize(name, value) {
            if (!this.effectNames.includes(name)) return;
            this.effectSizes[name] = clamp(parseFloat(value) || 1.0, 0.2, 3.0);
            this.snapshotVoiceLock(name);
        }

        setEffectDepth(name, value) {
            if (!this.effectNames.includes(name)) return;
            this.effectDepths[name] = clamp01(parseFloat(value) || 0.62);
            this.snapshotVoiceLock(name);
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

        setVoiceFxSetting(name, value) {
            if (name === 'bwInvert') this.voiceFxSettings.bwInvert = clamp01(value);
            else if (name === 'hueOffset' && Number.isFinite(Number(value))) {
                this.voiceFxSettings.hueOffset = ((Number(value) % 360) + 360) % 360;
            }
        }

        randomizeVoiceFxSettings() {
            if (!this.voiceFxLocks.bwInvert) {
                this.voiceFxSettings.bwInvert = +(0.12 + Math.random() * 0.88).toFixed(2);
            }
            if (!this.voiceFxLocks.hueOffset) {
                this.voiceFxSettings.hueOffset = Math.floor(Math.random() * 360);
            }
            return this.voiceFxSettings;
        }

        rollAutoGlitch() {
            this.isAutoGlitch = Math.random() < 0.5;
            if (this.isAutoGlitch) this.triggerButtonEffect('auto_glitch_pulse');
            return this.isAutoGlitch;
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

        /* ── HARD LOCKS (v6.4.27) ────────────────────────────────────────────
           A locked voice or master keeps its exact level/size/depth/state no
           matter which automation (Continual Random, Timed Auto, Automated
           Masters, Soft-Eye, presets, board rolls) tries to move it. Manual
           edits update the held value. */
        snapshotVoiceLock(name) {
            if (!this.effectLocks[name]) { delete this.voiceLockSnap[name]; return; }
            this.voiceLockSnap[name] = {
                alpha: this.effectAlphas[name], level: this.effectUserLevel[name],
                enabled: this.effectEnabled[name], disabled: this.effectUserDisabled[name],
                size: this.effectSizes[name], depth: this.effectDepths[name]
            };
        }

        snapshotMasterLocks(keys = ['speed', 'opacity', 'ghost', 'vsync']) {
            keys.forEach(key => {
                const locked = key === 'vsync' ? this.vsyncLocked : this.masterLocks[key];
                if (!locked) { delete this.masterLockSnap[key]; return; }
                if (key === 'speed') this.masterLockSnap.speed = this.glitchSpeed;
                else if (key === 'opacity') this.masterLockSnap.opacity = this.masterOpacity;
                else if (key === 'ghost') this.masterLockSnap.ghost = { mode: this.ghostModeIndex, level: this.ghostLevel };
                else if (key === 'vsync') this.masterLockSnap.vsync = { mode: this.vsyncModeIndex, level: this.vsyncLevel };
            });
        }

        setMasterLock(key, locked) {
            if (key === 'vsync') this.vsyncLocked = !!locked;
            else if (key in this.masterLocks) this.masterLocks[key] = !!locked;
            else return;
            this.snapshotMasterLocks([key]);
        }

        enforceLocks() {
            for (let i = 0; i < this.effectNames.length; i++) {
                const name = this.effectNames[i];
                if (!this.effectLocks[name]) {
                    if (this.voiceLockSnap[name]) delete this.voiceLockSnap[name];
                    continue;
                }
                const snap = this.voiceLockSnap[name];
                if (!snap) { this.snapshotVoiceLock(name); continue; }
                this.effectAlphas[name] = snap.alpha;
                this.effectTargets[name] = snap.alpha;
                this.effectUserLevel[name] = snap.level;
                this.effectEnabled[name] = snap.enabled;
                this.effectUserDisabled[name] = snap.disabled;
                this.effectSizes[name] = snap.size;
                this.effectDepths[name] = snap.depth;
            }
            ['speed', 'opacity', 'ghost', 'vsync'].forEach(key => {
                const locked = key === 'vsync' ? this.vsyncLocked : this.masterLocks[key];
                if (!locked) { delete this.masterLockSnap[key]; return; }
                const snap = this.masterLockSnap[key];
                if (snap === undefined) { this.snapshotMasterLocks([key]); return; }
                if (key === 'speed') { this.glitchSpeed = snap; this.targetGlitchSpeed = snap; }
                else if (key === 'opacity') { this.masterOpacity = snap; this.targetMasterOpacity = snap; }
                else if (key === 'ghost') { this.ghostModeIndex = snap.mode; this.ghostLevel = snap.level; }
                else if (key === 'vsync') { this.vsyncModeIndex = snap.mode; this.vsyncLevel = snap.level; }
            });
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
                    this.effectLocks[name] = !!this.effectLocks[name] || !!(preset.locks[name] || (this.isGC3Effect(name) && preset.locks[base]));
                });
            }
            const toggles = preset.toggles || {};
            if (preset.voiceFxSettings) {
                if (!this.voiceFxLocks.bwInvert && Number.isFinite(Number(preset.voiceFxSettings.bwInvert))) {
                    this.setVoiceFxSetting('bwInvert', preset.voiceFxSettings.bwInvert);
                }
                if (!this.voiceFxLocks.hueOffset && Number.isFinite(Number(preset.voiceFxSettings.hueOffset))) {
                    this.setVoiceFxSetting('hueOffset', preset.voiceFxSettings.hueOffset);
                }
            }
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
                if (this.effectLocks[name]) return;
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
            this.randomizeVoiceFxSettings();
            this.rollAutoGlitch();
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
            this.setWarpMode(this.randomWarpMode());
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

            const targetWarpMode = preset.warpMode || this.randomWarpMode();

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
                if (this.effectLocks[fx]) return;
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
                    if (this.effectLocks[fx]) return;
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
                    if (this.effectLocks[fx]) return;
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
                this.setWarpMode(this.randomWarpMode());
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
            const t = this.getWarpTime(now);
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
            // A failed WebGL start (no GPU, remote session, lost context) retries slowly instead of on every frame.
            if (this.techArtistRetryAt && performance.now() < this.techArtistRetryAt) return null;
            try {
                const scene = new THREE.Scene();
                const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                const size = this.getTechArtistBufferSize();
                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                // The drawing buffer is exactly size.width x size.height (pixel ratio 1) so the
                // resolution uniform, gl_FragCoord and the 2D blit all share one coordinate space.
                renderer.setPixelRatio(1);
                renderer.setSize(size.width, size.height, false);

                const uniforms = {
                    time: { value: 0 },
                    resolution: { value: new THREE.Vector2(size.width, size.height) },
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
                this.techArtistShader = { renderer, scene, camera, uniforms, canvas: renderer.domElement, width: size.width, height: size.height };
                return this.techArtistShader;
            } catch(e) {
                this.techArtistRetryAt = performance.now() + TECH_ARTIST_RETRY_MS;
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
                        const a = clamp01(0.78 * s * dp * self.masterOpacity);
                        gctx.save();
                        gctx.globalCompositeOperation = 'screen';
                        const ang = t * 0.35;
                        const L = Math.max(w, h) * 0.75;
                        const grad = gctx.createLinearGradient(w / 2 - Math.cos(ang) * L, h / 2 - Math.sin(ang) * L, w / 2 + Math.cos(ang) * L, h / 2 + Math.sin(ang) * L);
                        const h1 = (t * 26) % 360;
                        const stops = 6;
                        for (let i = 0; i <= stops; i++) {
                            const crest = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(i * 1.7 - t * 1.4));
                            grad.addColorStop(i / stops, `hsla(${(h1 + i * (60 + sz * 15)) % 360}, 100%, 55%, ${a * crest})`);
                        }
                        gctx.fillStyle = grad;
                        gctx.fillRect(0, 0, w, h);
                        // Soft orbiting bloom plus an overlay wash so the colour reaches the whole composition
                        const bx = w * (0.5 + 0.28 * Math.cos(t * 0.6)), by = h * (0.5 + 0.28 * Math.sin(t * 0.8));
                        const br = Math.max(w, h) * (0.45 + 0.15 * sz);
                        const bloom = gctx.createRadialGradient(bx, by, 0, bx, by, br);
                        bloom.addColorStop(0, `hsla(${(h1 + 180) % 360}, 100%, 60%, ${a * 0.65})`);
                        bloom.addColorStop(1, `hsla(${(h1 + 180) % 360}, 100%, 50%, 0)`);
                        gctx.fillStyle = bloom;
                        gctx.fillRect(0, 0, w, h);
                        gctx.globalCompositeOperation = 'overlay';
                        gctx.fillStyle = `hsla(${(h1 + 60) % 360}, 100%, 50%, ${a * 0.55})`;
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

                // 15. The final canvas compositor applies full-image B&W and Hue filters.
                bwInvert: () => () => {},
                hueColorCycle: () => () => {},

                // 17. Tech Artist (Three.js WebGL Raymarcher with 2D Fallback)
                techArtist: (getStrength) => {
                    return (gctx) => {
                        const s = getStrength();
                        if (s <= 0.01) return;
                        const sz = self.sizeFor('Tech Artist');
                        const dp = self.depthFor('Tech Artist');

                        const shader = self.initTechArtistShader();
                        if (shader && shader.renderer) {
                            self.syncTechArtistSize();
                            shader.uniforms.time.value = performance.now() * 0.001;
                            shader.uniforms.mouse.value.set(self.techArtistMouse.x, self.techArtistMouse.y);
                            shader.uniforms.velocity.value.set(self.techArtistVelocity.x, self.techArtistVelocity.y);
                            shader.uniforms.sizeScale.value = sz;
                            shader.uniforms.depthScale.value = dp;
                            shader.renderer.render(shader.scene, shader.camera);

                            gctx.save();
                            gctx.globalCompositeOperation = 'screen';
                            gctx.globalAlpha = clamp01(0.85 * s * dp * self.masterOpacity);
                            gctx.drawImage(shader.canvas, 0, 0, self.canvas.width, self.canvas.height);
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
        applyZeroMotionGhost() {
            try {
                if (this.ghostModes[this.ghostModeIndex] === 'OFF') this.setGhostMode('SPECTRUM', 0.28);
                else if (this.ghostLevel > 0.34) this.setGhostLevel(0.28, false);
            } catch (e) {}
        }

        randomWarpMode() {
            const pool = this.aiWarpModes.filter(m => m !== 'ai_zero');
            return pool[Math.floor(Math.random() * pool.length)];
        }

        renderAiWarp(now) {
            if (!this.aiWarpActive || this.aiWarpStrength <= 0.01 || this.aiWarpMode === 'ai_zero') {
                this.warpRenderedMode = null;
                this.warpTransitionAt = null;
                return;
            }
            const w = this.canvas.width, h = this.canvas.height;
            if (!w || !h) return;
            if (this.warpRenderedMode && this.warpRenderedMode !== this.aiWarpMode) {
                this.warpTransitionCtx.clearRect(0, 0, w, h);
                this.warpTransitionCtx.drawImage(this.warpCanvas, 0, 0);
                this.warpTransitionAt = now;
            }
            this.workCtx.clearRect(0, 0, w, h);
            this.workCtx.drawImage(this.canvas, 0, 0);
            this.warpCtx.clearRect(0, 0, w, h);
            try {
                this.renderAiWarpFrame(now, this.warpCtx);
                if (this.warpTransitionAt !== null) {
                    const p = clamp01((now - this.warpTransitionAt) / this.warpTransitionDuration);
                    this.warpCtx.save();
                    this.warpCtx.globalAlpha = 1 - p * p * (3 - 2 * p);
                    this.warpCtx.drawImage(this.warpTransitionCanvas, 0, 0);
                    this.warpCtx.restore();
                    if (p >= 1) this.warpTransitionAt = null;
                }
            } catch (error) {
                // Discard the failed pass, including any unbalanced nested canvas saves.
                this.warpCanvas.width = w;
                this.warpRenderedMode = null;
                this.warpTransitionAt = null;
                throw error;
            }
            this.gctx.save();
            this.gctx.globalCompositeOperation = 'copy';
            this.gctx.drawImage(this.warpCanvas, 0, 0);
            this.gctx.restore();
            this.warpRenderedMode = this.aiWarpMode;
        }

        getWarpTime(now) {
            if (this.warpClockAt !== null) {
                const dt = Math.min(0.1, Math.max(0, (now - this.warpClockAt) * 0.001));
                this.warpTime += dt * this.glitchSpeed;
            }
            this.warpClockAt = now;
            return this.warpTime;
        }

        renderAiWarpFrame(now, gctx) {
            const w = this.canvas.width, h = this.canvas.height;
            if (!w || !h) return;

            const s = this.aiWarpStrength * this.masterOpacity * this.getWarpBlendProfile().canvas;
            const t = this.getWarpTime(now);
            const mode = this.aiWarpMode;
            const audio = this.audioDrive;
            const bass = audio.bass || 0;
            const mid = audio.mid || 0;
            const treble = audio.treble || 0;

            gctx.save();

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
                    } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
                }
                gctx.globalCompositeOperation = 'screen';
                gctx.globalAlpha = 0.35 * s;
                try {
                    gctx.drawImage(this.workCanvas, -disp * 1.5, -disp * 0.5);
                    gctx.drawImage(this.workCanvas, disp * 1.5, disp * 0.5);
                } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
            // 6. VORTEX: continuous multi-ring whirlpool. Inner rings spin harder and are pulled inward,
            // log-spiral light arms ride the flow, and each ring lags in hue for a depth shimmer.
            else if (mode === 'vortex') {
                const cx = w / 2, cy = h / 2;
                const maxR = Math.hypot(w, h) * 0.5;
                const rings = 28 + Math.floor(s * 20);
                const ringW = maxR / rings;
                const flow = t * (0.55 + s * 0.7);
                const twist = (2.2 + s * 3.6 + bass * 1.4) * (0.88 + 0.12 * Math.sin(t * 0.8));
                const pull = 0.16 + s * 0.2 + bass * 0.1;
                gctx.drawImage(this.workCanvas, 0, 0);

                for (let i = rings - 1; i >= 1; i--) {
                    const k = i / rings;
                    const core = Math.pow(1 - k, 1.7);
                    const ang = core * twist + core * flow * 1.4;
                    const sc = 1 - pull * Math.pow(1 - k, 2.2);
                    gctx.save();
                    gctx.beginPath();
                    gctx.arc(cx, cy, i * ringW, 0, Math.PI * 2);
                    gctx.clip();
                    gctx.translate(cx, cy);
                    gctx.rotate(ang);
                    gctx.scale(sc, sc);
                    gctx.drawImage(this.workCanvas, -cx, -cy);
                    gctx.restore();
                }

                const arms = 5;
                gctx.save();
                gctx.globalCompositeOperation = 'screen';
                gctx.lineCap = 'round';
                gctx.lineWidth = 1.5 + s * 2.5 + bass * 2;
                for (let a = 0; a < arms; a++) {
                    const base = (a / arms) * Math.PI * 2 + flow * 1.1;
                    gctx.strokeStyle = 'hsla(' + ((this.videoPalette.hue + a * 40 + t * 30) % 360).toFixed(0) + ',90%,65%,' + (0.10 + s * 0.16 + treble * 0.12).toFixed(3) + ')';
                    gctx.beginPath();
                    for (let j = 0; j <= 48; j++) {
                        const f = j / 48;
                        const rr = maxR * (0.04 + 0.96 * f);
                        const th = base + Math.pow(1 - f, 1.7) * (twist + flow * 1.4) * -1 + f * 1.2;
                        const x = cx + Math.cos(th) * rr, y = cy + Math.sin(th) * rr;
                        if (j === 0) gctx.moveTo(x, y); else gctx.lineTo(x, y);
                    }
                    gctx.stroke();
                }
                gctx.restore();
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
                        } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                } catch(e) { throw e; }
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
                } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                        } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                        } catch(e) { throw e; }
                    }
                }
            }
            // 19. TWIRL: NewBlue Polar Twirl continuous vortex spiral twisting canvas pixels
            else if (mode === 'newblue_twirl') {
                const rings = 34;
                const maxR = Math.min(w, h) * 0.55;
                const rw = maxR / rings;
                const cx = w / 2, cy = h / 2;
                gctx.drawImage(this.workCanvas, 0, 0);
                // Slow, eased breathing twist (about +/-1 rad at full strength) instead of a fast swing.
                const twistTarget = (0.35 + s * 0.55 + mid * 0.25) * (Math.sin(t * 0.55) * 0.75 + Math.sin(t * 0.23 + 1.3) * 0.25);
                this._twirlTwist = (this._twirlTwist || 0) + (twistTarget - (this._twirlTwist || 0)) * 0.06;
                const maxTwist = this._twirlTwist;
                for (let i = rings - 1; i >= 1; i--) {
                    const r = i * rw;
                    const fall = 1.0 - (r / maxR);
                    const twist = fall * fall * (3 - 2 * fall) * maxTwist;
                    try {
                        gctx.save();
                        gctx.beginPath();
                        gctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
                        gctx.clip();
                        gctx.translate(cx, cy);
                        gctx.rotate(twist);
                        gctx.drawImage(this.workCanvas, -cx, -cy);
                        gctx.restore();
                    } catch(e) { throw e; }
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
                } catch(e) { throw e; }
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
                } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                } catch(e) { throw e; }
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
                } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                } catch(e) { throw e; }
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
                    } catch(e) { throw e; }
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
                } catch(e) { throw e; }
            }

            // Fill slice/rotation gaps before the color passes, never exposing the untreated lens.
            gctx.globalCompositeOperation = 'destination-over';
            gctx.globalAlpha = 1;
            gctx.drawImage(this.workCanvas, 0, 0);

            // Universal High-impact Chromatic Separation Passes
            const chroma = (6 + s * 22 + treble * 16);
            gctx.globalCompositeOperation = 'screen';
            gctx.globalAlpha = 0.22 + s * 0.28;
            try {
                gctx.drawImage(this.workCanvas, -chroma, 0);
                gctx.drawImage(this.workCanvas, chroma, 0);
            } catch(e) { throw e; }

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

            const s = (this.aiWarpActive && this.aiWarpMode !== 'ai_zero' && this.aiWarpStrength > 0.005) ? (this.aiWarpStrength * this.masterOpacity) : 0;
            const t = this.getWarpTime(now);
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
            const vInvert  = la('B&W Invert') * this.voiceFxSettings.bwInvert;
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
                hue += vHueCyc * ((now * 0.06 + this.voiceFxSettings.hueOffset) % 360);
                saturate += vHueCyc * 0.15;
            }
            if (vInvert > 0.005) {
                contrast += vInvert * 0.15;
                grayscale = vInvert;
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
                        spin = Math.sin(t * 0.45) * (6 + 12 * s);       // gentle sway instead of a constant spin
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
            const damping = 1 - Math.exp(-Math.max(0, dt) * 5.0);
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
        updateCanvasVoiceFilter(now) {
            const pairStrength = (name) => clamp01(
                this.liveAlpha(name) * Math.min(1, this.depthFor(name) / 0.62) +
                this.liveAlpha(name + ' GC#(3)') * Math.min(1, this.depthFor(name + ' GC#(3)') / 0.62)
            );
            const bwStrength = pairStrength('B&W Invert') * this.voiceFxSettings.bwInvert;
            const hueStrength = pairStrength('Hue/Color Cycle');
            const hueCore = this.liveAlpha('Hue/Color Cycle');
            const hueGc3 = this.liveAlpha('Hue/Color Cycle GC#(3)');
            const hueTotal = hueCore + hueGc3;
            const hueSize = hueTotal > 0
                ? (this.sizeFor('Hue/Color Cycle') * hueCore + this.sizeFor('Hue/Color Cycle GC#(3)') * hueGc3) / hueTotal
                : 1;
            const canvasFilters = [];
            if (this.hardLightActive) canvasFilters.push('contrast(1.25) saturate(1.35) brightness(1.08)');
            const pageFilters = [];
            if (bwStrength > 0.001) {
                pageFilters.push(`grayscale(${bwStrength.toFixed(3)}) invert(${bwStrength.toFixed(3)})`);
            }
            if (hueStrength > 0.001) {
                const hue = (now * 0.05 * hueSize + this.voiceFxSettings.hueOffset) % 360;
                pageFilters.push(`hue-rotate(${(hue * hueStrength).toFixed(1)}deg)`);
            }
            const canvasFilter = canvasFilters.length ? canvasFilters.join(' ') : 'none';
            const pageFilter = pageFilters.length ? pageFilters.join(' ') : 'none';
            const root = document.documentElement;
            if (this.canvas.style.filter !== canvasFilter) this.canvas.style.filter = canvasFilter;
            if (root.style.filter !== pageFilter) root.style.filter = pageFilter;
        }

        /* ── MASTER RENDER LOOP ────────────────────────────────────────────────── */
        reportRenderError(stage, error) {
            const message = String(error && error.message || error);
            if (this.renderErrors.get(stage) === message) return;
            this.renderErrors.set(stage, message);
            console.error(`AI WARP render error (${stage}):`, error);
            window.dispatchEvent(new CustomEvent('warp-render-error', { detail: { stage, error } }));
        }

        mainRenderLoop(now) {
            // Queue the next frame before rendering so a transient pass failure cannot stop playback.
            this.animFrameId = requestAnimationFrame((n) => this.mainRenderLoop(n));
            const dt = Math.min(0.1, Math.max(0, (now - this.lastFrameTime) * 0.001));
            this.lastFrameTime = now;
            this.gctx.save();
            try {
                this.renderFrame(now, dt);
                this.completedFrameCtx.globalCompositeOperation = 'copy';
                this.completedFrameCtx.drawImage(this.canvas, 0, 0);
                this.hasCompletedFrame = true;
                this.renderErrors.delete('frame');
            } catch (error) {
                // A failed source/system pass must not publish a naked or half-rendered lens.
                this.canvas.width = this.canvas.width;
                if (this.hasCompletedFrame) this.gctx.drawImage(this.completedFrameCanvas, 0, 0);
                this.reportRenderError('frame', error);
            } finally {
                this.gctx.restore();
            }
        }

        renderFrame(now, dt) {
            const cw = this.canvas.width;
            const ch = this.canvas.height;

            // 1. Capture visual source
            if (this.sourceMode === 'generative') {
                this.renderGenerativeSource(now);
                this.gctx.clearRect(0, 0, cw, ch);
                this.gctx.drawImage(this.genCanvas, 0, 0);
            } else if (this.sourceMode === 'video') {
                // Keep animating FX over a clean cached source while the decoder buffers.
                if (this.activeVideoElement && this.activeVideoElement.readyState >= 2) {
                    this.genCtx.save();
                    try {
                        this.genCtx.globalCompositeOperation = 'copy';
                        drawCover(this.genCtx, this.activeVideoElement, cw, ch);
                    } finally {
                        this.genCtx.restore();
                    }
                }
                this.gctx.clearRect(0, 0, cw, ch);
                this.gctx.drawImage(this.genCanvas, 0, 0);
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
            this.enforceLocks();
            this.getWarpTime(now);
            if (this.sourceMode === 'youtube') this.updateYouTubeTransformsAndFilters(now, dt);

            // 3. Render Active Glitch Voices (Persistent closures executed once per frame)
            for (let i = 0; i < this.activeEffects.length; i++) {
                this.gctx.save();
                try {
                    this.activeEffects[i](this.gctx, now);
                    this.renderErrors.delete(`voice ${i + 1}`);
                } catch(e) {
                    this.reportRenderError(`voice ${i + 1}`, e);
                } finally {
                    this.gctx.restore();
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

            // Apply the image-wide FX after every source and overlay has been rendered.
            this.updateCanvasVoiceFilter(now);

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

    AiWarpEngine.FX_MANIFEST = FX_MANIFEST;
    root.AiWarpEngine = AiWarpEngine;
})(typeof window !== 'undefined' ? window : this);
