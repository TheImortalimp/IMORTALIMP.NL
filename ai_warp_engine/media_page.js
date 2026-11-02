/**
 * MEDIA_PAGE.JS — Master Integration & Audio-Visual Coordinator
 * 
 * Features:
 * - Web Audio API Analysis (Sub, Bass, Mid, Treble, Beat Transients, RMS)
 * - Synthetic Beat & Dub Music Engine (Self-contained Web Audio generator)
 * - Raum 1 & 2 ~ variant X-R showcase player (2 original synthesized tracks, bundled)
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
 * - Local Media Playback Engine (.mp4, .m4v, .mov, .avi, .mkv, .webm, .ogv, .mp3, .m4a, .aac, .wav, .ogg, .oga, .opus, .flac, .weba, .mka)
 * - Local Folder Picking & Image Slideshow for MP3 Audio Playback
 * - ID3 Album Cover Art Extraction
 * - Fullscreen Drag-and-Drop Handler
 * - Media Transport Bar with Timeline Scrubber & Time Display
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // Claim startup before the first await so repeated script tags cannot start competing engines.
    if (document.documentElement.dataset.warpStartup) return;
    document.documentElement.dataset.warpStartup = 'loading';
    const reportError = (message, error) => {
        console.error(message, error);
        const banner = document.getElementById('hudNotificationBanner');
        if (banner) {
            clearTimeout(banner.__timer);
            banner.textContent = message;
            banner.classList.add('show');
            banner.setAttribute('role', 'alert');
        }
    };
    window.addEventListener('error', (event) => {
        if (event.filename && /(?:glitch_engine|r3_gc3_factories|r3_ghost_vsync|ai_warp_engine|local_media|freeze_frame|media_page)\.js(?:\?|$)/.test(event.filename)) {
            reportError('AI WARP RUNTIME ERROR: ' + event.message, event.error);
        }
    });
    window.addEventListener('warp-render-error', (event) => {
        reportError('AI WARP EFFECT ERROR: ' + event.detail.stage, event.detail.error);
    });
    window.addEventListener('unhandledrejection', (event) => {
        reportError('AI WARP ASYNC ERROR: ' + String(event.reason && event.reason.message || event.reason), event.reason);
    });

    const initialization = (async () => {
    for (const name of ['GlitchEngine', 'GC3FactoryBank', 'R3GhostVsync', 'AiWarpEngine', 'LocalMediaPlayback', 'FreezeFrameCapture']) {
        if (!window[name]) throw new Error(`Required engine script did not load: ${name}`);
    }
    for (const id of ['glitchCanvas', 'localVideo', 'localAudio', 'localArtworkImg']) {
        if (document.querySelectorAll(`[id="${id}"]`).length !== 1) {
            throw new Error(`Expected exactly one #${id}; the app document is incomplete or duplicated.`);
        }
    }

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

    /* ── 1. LOAD CONFIGURATION (media_page.json) ─────────────────────────── */
    try {
        const resp = await fetch('media_page.json', { signal: AbortSignal.timeout(5000) });
        if (!resp.ok) throw new Error(`media_page.json: HTTP ${resp.status}`);
        configData = await resp.json();
        if (!configData || typeof configData !== 'object' || Array.isArray(configData)) {
            throw new Error('media_page.json must contain a configuration object.');
        }
        if (Array.isArray(configData.youtubePool)) ytPool = configData.youtubePool;
    } catch (e) {
        configData = null;
        console.warn('Could not load media_page.json, using built-in defaults:', e);
        reportError('CONFIGURATION UNAVAILABLE: USING BUILT-IN DEFAULTS', e);
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
            if (savedMilkdrop && Number.isFinite(+savedMilkdrop.opacity)) aiWarp.setMilkdropOpacity(savedMilkdrop.opacity);
            if (savedMilkdrop) aiWarp.milkdropOpacityLocked = !!savedMilkdrop.locked;
        } catch (e) {}
        try {
            const savedVoiceFx = JSON.parse(localStorage.getItem('ai_warp_voice_fx_controls') || 'null');
            if (savedVoiceFx) {
                if (Number.isFinite(+savedVoiceFx.bwInvert)) aiWarp.setVoiceFxSetting('bwInvert', savedVoiceFx.bwInvert);
                if (Number.isFinite(+savedVoiceFx.hueOffset)) aiWarp.setVoiceFxSetting('hueOffset', savedVoiceFx.hueOffset);
                if (savedVoiceFx.locks) {
                    aiWarp.voiceFxLocks.bwInvert = !!savedVoiceFx.locks.bwInvert;
                    aiWarp.voiceFxLocks.hueOffset = !!savedVoiceFx.locks.hueOffset;
                }
            }
        } catch (e) {
            console.warn('Could not load saved Voice FX controls:', e);
        }
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

    function saveVoiceFxControlState() {
        if (!aiWarp) return;
        try {
            localStorage.setItem('ai_warp_voice_fx_controls', JSON.stringify({
                bwInvert: aiWarp.voiceFxSettings.bwInvert,
                hueOffset: aiWarp.voiceFxSettings.hueOffset,
                locks: aiWarp.voiceFxLocks
            }));
        } catch (e) {
            console.warn('Could not save Voice FX controls:', e);
        }
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
    function showHudNotification(text, durationMs = 2200) {
        const banner = document.getElementById('hudNotificationBanner');
        if (!banner) return;
        banner.textContent = text;
        banner.classList.add('show');
        clearTimeout(banner.__timer);
        if (durationMs > 0) {
            banner.__timer = setTimeout(() => {
                banner.classList.remove('show');
            }, durationMs);
        }
    }

    window.open = () => {
        showHudNotification('EXTERNAL BROWSERS / NEW WINDOWS ARE DISABLED');
        return null;
    };
    const blockExternalLink = event => {
        const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
        if (!link) return;
        const url = new URL(link.href, location.href);
        if (link.hasAttribute('download') && (url.origin === location.origin || url.protocol === 'blob:' || url.protocol === 'data:')) return;
        if ((link.target && link.target !== '_self') || url.origin !== location.origin || event.type === 'auxclick') {
            event.preventDefault();
            event.stopImmediatePropagation();
            showHudNotification('EXTERNAL BROWSERS / NEW WINDOWS ARE DISABLED');
        }
    };
    document.addEventListener('click', blockExternalLink, true);
    document.addEventListener('auxclick', blockExternalLink, true);

/* ── 2. WEB AUDIO API & LIVE MICROPHONE AUDIO MONITOR ────────────────── */
    let isMicActive = false;
    let micStream = null;
    let micSourceNode = null;

    // Display Capture (getDisplayMedia): pixels and optional audio from shared display
    let captureStream = null;
    let captureSourceNode = null;
    let captureGainNode = null;
    let captureReturnToYouTube = false;
    const lensBridge = window.chrome && window.chrome.webview ? window.chrome.webview : null;
    const localPlayback = new window.LocalMediaPlayback(lensBridge,
        (text, persistent) => showHudNotification(text, persistent ? 0 : 2200), reportError);
    let localPlaybackGeneration = 0;
    let lensActive = false;
    let lensOpenPending = false;
    let lensRequestGeneration = 0;
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
            if (d.startsWith('control:blocked|')) {
                reportError('APP CONTROL: ' + d.substring(16), new Error(d.substring(16)));
                return;
            }
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
        pauseAllOtherMedia();
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

    // Easter egg: the System Protocol One OST is baked into the app (audio/system-protocol-one-ost.mp4)
    // and mirrored to its verified YouTube source, which is also the fallback when the local file is missing.
    const EASTER_EGG = Object.freeze({
        id: '0YVYefCo1l4',
        title: 'System Protocol One OST',
        author: 'PalmDesert',
        url: 'https://www.youtube.com/watch?v=0YVYefCo1l4',
        localFile: 'audio/system-protocol-one-ost.mp4'
    });

const BUILT_IN_YOUTUBE_PLAYLISTS = Object.freeze([
        Object.freeze({
            id: 'PLGQdK_CU4B7w',
            title: 'Featured YouTube Playlist',
            source: 'built-in',
            protected: true
        })
    ]);

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function parseYouTubePlaylistFeed(xmlText) {
        if (typeof DOMParser === 'undefined') throw new Error('XML parser is unavailable in this browser.');
        const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
        if (doc.querySelector('parsererror')) throw new Error('Playlist feed returned invalid XML.');

        const elements = Array.from(doc.getElementsByTagName('*'));
        const feedTitleNode = elements.find(node => node.localName === 'feedTitle');
        const titleNodes = elements.filter(node => node.localName === 'title');
        const videos = [];
        elements.filter(node => node.localName === 'entry').forEach(entry => {
            const entryElements = Array.from(entry.getElementsByTagName('*'));
            const idNode = entryElements.find(node => node.localName === 'videoId');
            const titleNode = entryElements.find(node => node.localName === 'title');
            const id = idNode ? idNode.textContent.trim() : '';
            if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
                videos.push({ id, title: titleNode ? titleNode.textContent.trim() : '' });
            }
        });
        const feedTitle = feedTitleNode ? feedTitleNode.textContent.trim()
            : (titleNodes.length ? titleNodes[0].textContent.trim() : '');
        return { title: feedTitle, videos };
    }

    class YouTubeKnowledgebase {
        constructor(initialCurated = []) {
            this.STORAGE_KEY = 'ai_warp_youtube_kb_v2';
            this.items = [];
            this.playlists = [];
            this.pendingPlaylistExtractions = new Map();
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
            if (!this.defaultCurated.some(x => x.id === EASTER_EGG.id)) {
                this.defaultCurated = this.defaultCurated.concat([{ id: EASTER_EGG.id, title: EASTER_EGG.title, source: 'curated' }]);
            }
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
                this.playlists = BUILT_IN_YOUTUBE_PLAYLISTS.map(playlist => Object.assign({}, playlist));
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
                BUILT_IN_YOUTUBE_PLAYLISTS.forEach(playlist => {
                    if (!this.playlists.some(item => item.id === playlist.id)) {
                        this.playlists.push(Object.assign({}, playlist));
                    }
                });
                this.save();
            }

            this.updateBadge();
        }

        save() {
            BUILT_IN_YOUTUBE_PLAYLISTS.forEach(playlist => {
                const existing = this.playlists.find(item => item.id === playlist.id);
                if (!existing) this.playlists.push(Object.assign({}, playlist));
                else Object.assign(existing, playlist, {
                    title: existing.title && existing.title !== playlist.title ? existing.title : playlist.title,
                    videoCount: existing.videoCount || 0,
                    dateExtracted: existing.dateExtracted || null
                });
            });
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
            const raw = String(inputStr).trim();
            const playlistIds = [], videoIds = [];
            const addPlaylist = id => {
                if (/^[A-Za-z0-9_-]{12,100}$/.test(id) && !playlistIds.includes(id)) playlistIds.push(id);
            };
            const addVideo = id => {
                if (/^[A-Za-z0-9_-]{11}$/.test(id) && !videoIds.includes(id)) videoIds.push(id);
            };
            const urls = raw.match(/(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/[^\s<>"']+/gi) || [];
            urls.forEach(rawUrl => {
                try {
                    const cleanedUrl = rawUrl.replace(/[),.;]+$/, '');
                    const url = new URL(/^https?:\/\//i.test(cleanedUrl) ? cleanedUrl : `https://${cleanedUrl}`);
                    const host = url.hostname.toLowerCase().replace(/^www\./, '');
                    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) return;
                    const playlistId = url.searchParams.get('list');
                    if (playlistId) addPlaylist(playlistId);
                    let videoId = url.searchParams.get('v');
                    if (!videoId && host === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0];
                    if (!videoId && /^\/(?:embed|shorts|live|v)\//.test(url.pathname)) {
                        videoId = url.pathname.split('/').filter(Boolean)[1];
                    }
                    if (videoId) addVideo(videoId);
                } catch (error) {
                    console.warn('Could not parse a YouTube URL from input:', error);
                }
            });
            raw.split(/[\s,;]+/).forEach(token => {
                const value = token.trim();
                if (/^[A-Za-z0-9_-]{11}$/.test(value)) addVideo(value);
                else if (/^[A-Za-z0-9_-]{12,100}$/.test(value)) addPlaylist(value);
            });
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
            if (!/^[A-Za-z0-9_-]{12,100}$/.test(String(playlistId || ''))) {
                throw new Error('Invalid YouTube playlist ID.');
            }
            if (this.pendingPlaylistExtractions.has(playlistId)) {
                return this.pendingPlaylistExtractions.get(playlistId);
            }
            const extraction = this.extractPlaylistFeed(playlistId, optionalTitle)
                .finally(() => this.pendingPlaylistExtractions.delete(playlistId));
            this.pendingPlaylistExtractions.set(playlistId, extraction);
            return extraction;
        }

        async extractPlaylistFeed(playlistId, optionalTitle = null) {
            const existing = this.playlists.find(playlist => playlist.id === playlistId);
            const plTitle = optionalTitle || (existing && existing.title) || `Playlist ${playlistId}`;
            const playlist = existing || { id: playlistId, title: plTitle, source: 'user', protected: false };
            playlist.title = plTitle;
            playlist.status = 'loading';
            this.playlists = [playlist, ...this.playlists.filter(item => item.id !== playlistId)];
            this.save();
            this.renderList();
            showHudNotification(`🔍 EXTRACTING PLAYLIST: ${playlistId}...`);

            const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
            const endpoints = [
                rssUrl,
                `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
                `https://corsproxy.io/?url=${encodeURIComponent(rssUrl)}`,
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`
            ];
            let feed = null;
            const failures = [];

            for (const endpoint of endpoints) {
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timeout = controller ? setTimeout(() => controller.abort(), 5000) : null;
                try {
                    if (typeof fetch !== 'function') throw new Error('Fetch is unavailable.');
                    const response = await fetch(endpoint, controller ? { signal: controller.signal } : {});
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const parsed = parseYouTubePlaylistFeed(await response.text());
                    if (!parsed.videos.length) throw new Error('Feed contained no video entries.');
                    feed = parsed;
                    break;
                } catch (error) {
                    failures.push(error.message || String(error));
                    console.warn(`Playlist feed request failed for ${new URL(endpoint).hostname}:`, error);
                } finally {
                    if (timeout) clearTimeout(timeout);
                }
            }

            let added = 0;
            if (feed) {
                if (!optionalTitle && feed.title && !playlist.protected) playlist.title = feed.title;
                feed.videos.forEach(video => {
                    if (this.addVideo(video.id, video.title || `YouTube · ${video.id}`, 'playlist', playlistId)) added++;
                });
                playlist.status = 'ready';
                playlist.lastExtractError = null;
            } else {
                playlist.status = 'unavailable';
                playlist.lastExtractError = failures.join('; ');
            }
            playlist.videoCount = this.items.filter(item => item.playlistId === playlistId).length;
            playlist.dateExtracted = Date.now();
            this.save();
            this.renderList();

            if (feed) {
                showHudNotification(`✨ EXTRACTED ${added} PLAYLIST VIDEOS · ${playlist.title}`);
            } else {
                showHudNotification(`PLAYLIST SAVED · FEED EXTRACTION UNAVAILABLE; USE PLAY TO OPEN IT DIRECTLY`);
            }
            return {
                playlistId,
                title: playlist.title,
                items: this.items.filter(item => item.playlistId === playlistId),
                extracted: !!feed,
                error: feed ? null : playlist.lastExtractError
            };
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
            const filteredPlaylists = this.playlists.filter(playlist => {
                if (!/^[A-Za-z0-9_-]{12,100}$/.test(playlist.id || '')) return false;
                if (searchTerm && !(playlist.title || '').toLowerCase().includes(searchTerm) &&
                    !playlist.id.toLowerCase().includes(searchTerm)) return false;
                return true;
            });

            this.updateStats();

            if (filtered.length === 0 && filteredPlaylists.length === 0) {
                ytKbList.innerHTML = `<div style="text-align:center; padding:30px; color:var(--theme-sub); font-size:12px;">No matching YouTube links in Knowledgebase.</div>`;
                return;
            }

            const activeVideoId = (ytHistoryIndex >= 0 && ytHistory[ytHistoryIndex]) ? ytHistory[ytHistoryIndex].id : null;

            const playlistMarkup = filteredPlaylists.length ? `
                <div class="yt-kb-section-heading">PROTECTED &amp; SAVED PLAYLISTS</div>
                ${filteredPlaylists.map(playlist => {
                    const status = playlist.status === 'loading' ? 'EXTRACTING…'
                        : playlist.status === 'ready' ? `${playlist.videoCount || 0} VIDEOS EXTRACTED`
                        : playlist.status === 'unavailable' ? `${playlist.videoCount || 0} VIDEOS · FEED UNAVAILABLE`
                        : `${playlist.videoCount || 0} VIDEOS · READY TO PLAY`;
                    return `
                        <div class="yt-kb-playlist-item" data-playlist="${escapeHtml(playlist.id)}">
                            <div class="yt-kb-playlist-icon" aria-hidden="true">▤</div>
                            <div class="yt-kb-info">
                                <div class="yt-kb-title" title="${escapeHtml(playlist.title || playlist.id)}">${escapeHtml(playlist.title || playlist.id)}</div>
                                <div class="yt-kb-meta">
                                    <span class="yt-kb-playlist-badge">${playlist.protected ? 'BUILT-IN · PROTECTED' : 'SAVED PLAYLIST'}</span>
                                    <span>ID: ${escapeHtml(playlist.id)}</span>
                                    <span>${status}</span>
                                </div>
                            </div>
                            <div class="yt-kb-item-actions">
                                <button class="wired-button kb-play-playlist-btn" data-id="${escapeHtml(playlist.id)}" title="Play this playlist directly on YouTube">▶ PLAY</button>
                                <button class="wired-button kb-extract-playlist-btn" data-id="${escapeHtml(playlist.id)}" title="Refresh extracted videos">↻ EXTRACT</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            ` : '';

            const videoMarkup = filtered.map(item => {
                const isActive = item.id === activeVideoId;
                const itemId = escapeHtml(item.id);
                const isEgg = item.id === EASTER_EGG.id;
                const title = escapeHtml((isEgg ? '\u{1F95A} ' : '') + (item.title || item.id));
                const source = ['curated', 'user', 'pasted', 'playlist'].includes(item.source) ? item.source : 'user';
                const sourceBadge = `<span class="yt-kb-source-badge ${source}">${escapeHtml(source)}${item.playlistId ? ' · PL' : ''}</span>`;
                const playInfo = item.playCount ? `· Played ${item.playCount}x` : '';
                return `
                    <div class="yt-kb-item ${isActive ? 'active-playing' : ''}" data-id="${itemId}">
                        <img class="yt-kb-thumb" src="https://i.ytimg.com/vi/${itemId}/mqdefault.jpg" alt="${itemId}" loading="lazy" onerror="this.style.opacity='0.2'">
                        <div class="yt-kb-info">
                            <div class="yt-kb-title" title="${title}">${title}</div>
                            <div class="yt-kb-meta">
                                ${sourceBadge}
                                <span>ID: ${itemId}</span>
                                <span>${escapeHtml(playInfo)}</span>
                            </div>
                        </div>
                        <div class="yt-kb-item-actions">
                            <button class="wired-button kb-play-item-btn" data-id="${itemId}" title="${isEgg ? 'Play the baked-in local video (falls back to YouTube)' : 'Play Video Now'}">▶ PLAY${isEgg ? ' LOCAL' : ''}</button>
                            <button class="wired-button kb-copy-item-btn" data-id="${itemId}" title="Copy Link">📋</button>
                            <button class="wired-button danger-btn kb-del-item-btn" data-id="${itemId}" title="Remove from Knowledgebase">✕</button>
                        </div>
                    </div>
                `;
            }).join('');
            ytKbList.innerHTML = playlistMarkup + (videoMarkup ? `<div class="yt-kb-section-heading">VIDEO LINKS</div>${videoMarkup}` : '');

            ytKbList.querySelectorAll('.kb-play-playlist-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const playlist = this.playlists.find(item => item.id === id);
                    if (!playlist) return;
                    if (playlist.status !== 'ready') {
                        this.extractPlaylist(id).catch(error => {
                            console.error(`Playlist extraction failed for ${id}:`, error);
                            showHudNotification(`PLAYLIST EXTRACTION FAILED: ${error.message}`);
                        });
                    }
                    ytHistory.push({ playlistId: id, title: playlist.title });
                    ytHistoryIndex = ytHistory.length - 1;
                    loadYouTube({ playlistId: id });
                });
            });

            ytKbList.querySelectorAll('.kb-extract-playlist-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    try {
                        await this.extractPlaylist(btn.getAttribute('data-id'));
                    } catch (error) {
                        console.error('Playlist extraction failed:', error);
                        showHudNotification(`PLAYLIST EXTRACTION FAILED: ${error.message}`);
                    }
                });
            });

            ytKbList.querySelectorAll('.kb-play-item-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const it = this.items.find(x => x.id === id);
                    if (it && it.id === EASTER_EGG.id) {
                        playEasterEgg();
                    } else if (it) {
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
                this.playlists = BUILT_IN_YOUTUBE_PLAYLISTS.map(playlist => Object.assign({}, playlist));
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
                    const importedPlaylistIds = new Set();
                    if (data && Array.isArray(data.items)) {
                        data.items.forEach(it => {
                            if (it && it.id && /^[a-zA-Z0-9_-]{11}$/.test(it.id)) {
                                this.addVideo(it.id, it.title, it.source || 'user', it.playlistId);
                                importedCount++;
                                if (/^[A-Za-z0-9_-]{12,100}$/.test(it.playlistId || '')) {
                                    importedPlaylistIds.add(it.playlistId);
                                }
                            }
                        });
                        if (Array.isArray(data.playlists)) {
                            data.playlists.forEach(pl => {
                                if (pl && /^[A-Za-z0-9_-]{12,100}$/.test(pl.id || '')) {
                                    importedPlaylistIds.add(pl.id);
                                }
                                if (pl && /^[A-Za-z0-9_-]{12,100}$/.test(pl.id || '') &&
                                    !this.playlists.some(p => p.id === pl.id)) {
                                    this.playlists.push(pl);
                                }
                            });
                        }
                        this.save();
                        this.renderList();
                        showHudNotification(`IMPORTED ${importedCount} LINKS INTO KNOWLEDGEBASE!`);
                        importedPlaylistIds.forEach(id => {
                            this.extractPlaylist(id).catch(error => {
                                console.error(`Playlist extraction failed for imported playlist ${id}:`, error);
                                showHudNotification(`PLAYLIST EXTRACTION FAILED: ${error.message}`);
                            });
                        });
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
            if (returnToYouTube) {
                const frame = ytPlayerMount && ytPlayerMount.querySelector('#ytIframe');
                if (frame && frame.contentWindow) {
                    frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
                }
            }
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

    async function startTabCapture(fromLens = false, expectedLensRequest = null) {
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
        if (fromLens) {
            if (expectedLensRequest !== lensRequestGeneration || !lensActive) {
                stream.getTracks().forEach(tr => tr.stop());
                return;
            }
        } else {
            pauseAllOtherMedia();
        }
        captureStream = stream;

        // Video frames → reuse #localVideo so engine drawCover + R3 factories sample real pixels
        localVideo.muted = true; // audio is analyzed via Web Audio only — never double-played
        localVideo.srcObject = stream;
        try { await localVideo.play(); } catch (e) { console.warn('capture play notice:', e); }
        if (captureStream !== stream || (fromLens && expectedLensRequest !== lensRequestGeneration)) return;
        if (aiWarp) aiWarp.setSourceMode('video', localVideo);

        // Teardown when the user hits the browser's "Stop sharing" or closes the tab
        const vTrack = stream.getVideoTracks()[0];
        if (vTrack) vTrack.addEventListener('ended', () => stopTabCapture(true));

        // Audio → analyser (real audio-reactive voices replace the synthetic YT cadence)
        let hasAudio = stream.getAudioTracks().length > 0;
        if (hasAudio) {
            try {
                initAudioContext();
                if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
                if (captureStream !== stream || (fromLens && expectedLensRequest !== lensRequestGeneration)) return;
                if (audioCtx && masterAnalyser) {
                    captureSourceNode = audioCtx.createMediaStreamSource(stream);
                    captureGainNode = audioCtx.createGain();
                    captureGainNode.gain.value = 1.0;
                    captureSourceNode.connect(captureGainNode);
                    captureGainNode.connect(masterAnalyser); // analysis only — no destination
                }
            } catch (e) { console.warn('capture audio routing notice:', e); hasAudio = false; }
        }

        if (captureStream !== stream || (fromLens && expectedLensRequest !== lensRequestGeneration)) return;
        currentMediaKind = 'capture';
        syncPlaybackClasses('capture');
        const capBtn = document.getElementById('ytCaptureTabBtn');
        if (capBtn) { capBtn.classList.add('capture-active'); capBtn.textContent = '🖥 SCREEN: LIVE'; }
        showHudNotification(hasAudio
            ? '🖥 SCREEN CAPTURE LIVE — window/tab pixels + audio drive the engine'
            : '🖥 SCREEN CAPTURE LIVE (no shared audio track) — enable shared audio in the picker or use the microphone input');
    }
    window.stopTabCapture = stopTabCapture;

    function pauseAllOtherMedia() {
        localPlaybackGeneration++;
        localPlayback.cancel();
        lensRequestGeneration++;
        const closeUncapturedLens = lensOpenPending || (lensActive && !captureStream);
        lensOpenPending = false;
        syncPlaybackClasses(null);
        stopTabCapture(false);
        if (closeUncapturedLens) {
            lensActive = false;
            if (lensBridge) {
                lensBridge.postMessage('lens:frames|stop');
                lensBridge.postMessage('lens:close');
            }
        }
        const embeddedYouTubeFrame = ytPlayerMount && ytPlayerMount.querySelector('#ytIframe');
        if (embeddedYouTubeFrame && embeddedYouTubeFrame.contentWindow) {
            embeddedYouTubeFrame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
        }
        if (!captureReturnToYouTube) {
            if (ytPlayerMount) ytPlayerMount.replaceChildren();
            if (ytWarpShell) ytWarpShell.style.display = 'none';
        }
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
            ytUrlInput.value = videoObj.id
                ? `https://www.youtube.com/watch?v=${videoObj.id}${videoObj.playlistId ? `&list=${videoObj.playlistId}` : ''}`
                : `https://www.youtube.com/playlist?list=${videoObj.playlistId}`;
        }
        if (lensActive && captureStream) {
            lensBridge.postMessage('lens:open|' + embedUrl);
            return true;
        }
        pauseAllOtherMedia();
        const requestGeneration = ++lensRequestGeneration;
        lensOpenPending = true;
        if (ytPlayerMount) ytPlayerMount.replaceChildren();
        if (ytWarpShell) ytWarpShell.style.display = 'none';
        lensBridge.postMessage('lens:open|' + embedUrl);
        await new Promise(r => setTimeout(r, 2500)); // the lens window must exist before it can be captured
        if (requestGeneration !== lensRequestGeneration) return null;
        lensOpenPending = false;
        lensActive = true;
        captureReturnToYouTube = false;
        await startTabCapture(true, requestGeneration);
        if (requestGeneration !== lensRequestGeneration) return null;
        if (!captureStream) {
            lensActive = false;
            lensBridge.postMessage('lens:close');
            return false;
        }
        showHudNotification('YT LENS LIVE: real YouTube pixels now drive all 34 voices + 29 warp modes');
        updateYouTubeUi();
        return true;
    }

    const YT_EMBED_HOSTS = ['https://www.youtube-nocookie.com', 'https://www.youtube.com'];
    let ytEmbedHostIndex = 0;
    let ytCurrentVideoObj = null;

    function buildYouTubeEmbedUrl(videoObj, hostIndex = ytEmbedHostIndex) {
        const params = new URLSearchParams({
            autoplay: '1',
            enablejsapi: '1',
            playsinline: '1',
            controls: '1',
            rel: '0',
            modestbranding: '1',
            loop: '1'
        });
        // Embeds on a hosted site need the page origin; file:// and the desktop host have none.
        if (/^https?:$/.test(window.location.protocol)) params.set('origin', window.location.origin);
        const host = YT_EMBED_HOSTS[hostIndex] || YT_EMBED_HOSTS[0];
        if (videoObj.id) {
            if (videoObj.playlistId) params.set('list', videoObj.playlistId);
            else params.set('playlist', videoObj.id);
            return `${host}/embed/${encodeURIComponent(videoObj.id)}?${params}`;
        }
        params.set('listType', 'playlist');
        params.set('list', videoObj.playlistId);
        return `${host}/embed/videoseries?${params}`;
    }

    // The embed reports playback errors (101/150/152/153 = embedding refused, 2/5 = bad request) through postMessage.
    window.addEventListener('message', (ev) => {
        if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(ev.origin)) return;
        const frame = document.getElementById('ytIframe');
        if (!frame || ev.source !== frame.contentWindow) return;
        let data = ev.data;
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { return; } }
        if (!data) return;
        if (data.event === 'onReady') {
            try { frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), ev.origin); } catch (e) {}
        }
        if (data.event === 'onError' && ytCurrentVideoObj) {
            if (ytEmbedHostIndex < YT_EMBED_HOSTS.length - 1) {
                ytEmbedHostIndex++;
                showHudNotification('YOUTUBE EMBED ERROR — retrying on alternate host');
                loadYouTube(ytCurrentVideoObj);
            } else {
                ytEmbedHostIndex = 0;
                showHudNotification('YOUTUBE: this video blocks embedding — use ↗ YOUTUBE, SHARE SCREEN capture, or another video');
            }
        }
    });

    function loadYouTube(videoObj, { requireLens = false } = {}) {
        if (!videoObj || (!videoObj.id && !videoObj.playlistId)) return;
        const embedUrl = buildYouTubeEmbedUrl(videoObj);
        const lensRequired = requireLens && !!lensBridge;
        if (lensBridge && !lensFailed) {
            loadYouTubeViaLens(videoObj, embedUrl).then((ok) => {
                if (ok === false) {
                    lensFailed = true;
                    if (lensRequired) {
                        showHudNotification('YT LENS UNAVAILABLE — playlist playback stopped');
                        return;
                    }
                    showHudNotification('YT LENS UNAVAILABLE — using the in-page player');
                    loadYouTube(videoObj);
                }
            });
            return;
        }
        if (lensRequired) {
            pauseAllOtherMedia();
            showHudNotification('YT LENS UNAVAILABLE — playlist playback stopped');
            return;
        }
        pauseAllOtherMedia();
        currentMediaKind = 'youtube';
        syncPlaybackClasses('youtube');
        ytCurrentVideoObj = videoObj;

        // Mount iframe
        if (ytPlayerMount) {
            ytPlayerMount.innerHTML = `
                <iframe id="ytIframe"
                    src="${embedUrl}"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen>
                </iframe>
            `;
            const mountedFrame = ytPlayerMount.querySelector('#ytIframe');
            // Handshake so the embed starts sending onReady / onError events.
            mountedFrame.addEventListener('load', () => {
                try { mountedFrame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) {}
            });
        }
        if (ytWarpShell) ytWarpShell.style.display = 'block';

        if (ytUrlInput) {
            ytUrlInput.value = videoObj.id
                ? `https://www.youtube.com/watch?v=${videoObj.id}${videoObj.playlistId ? `&list=${videoObj.playlistId}` : ''}`
                : `https://www.youtube.com/playlist?list=${videoObj.playlistId}`;
        }

        if (aiWarp) {
            aiWarp.setSourceMode('youtube');
        }

        if (!ytWarpBusToastShown) {
            ytWarpBusToastShown = true;
            showHudNotification('YOUTUBE → AI WARP BUS: 34 effect voices + 29 warp modes now drive the live video feed');
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
        const extractedPlaylist = parsed.playlistIds[0] || null;

        // If video ID detected:
        if (parsed.videoIds.length > 0) {
            parsed.playlistIds.forEach(id => {
                ytKb.extractPlaylist(id).catch(error => {
                    console.error(`Playlist extraction failed for ${id}:`, error);
                    showHudNotification(`PLAYLIST EXTRACTION FAILED: ${error.message}`);
                });
            });
            const primaryId = parsed.videoIds[0];
            const stored = ytKb.addVideo(primaryId, null, 'user', extractedPlaylist);
            // Also store any other video IDs from batch paste!
            for (let i = 1; i < parsed.videoIds.length; i++) {
                ytKb.addVideo(parsed.videoIds[i], null, 'user', extractedPlaylist);
            }
            ytHistory.push(stored);
            ytHistoryIndex = ytHistory.length - 1;
            loadYouTube(stored, { requireLens: !!extractedPlaylist });
            showHudNotification(`SAVED TO KB & PLAYING: https://youtu.be/${primaryId}`);
        } else if (extractedPlaylist) {
            parsed.playlistIds.forEach(id => {
                ytKb.extractPlaylist(id).catch(error => {
                    console.error(`Playlist extraction failed for ${id}:`, error);
                    showHudNotification(`PLAYLIST EXTRACTION FAILED: ${error.message}`);
                });
            });
            ytHistory.push({ playlistId: extractedPlaylist, title: `Playlist ${extractedPlaylist}` });
            ytHistoryIndex = ytHistory.length - 1;
            loadYouTube({ playlistId: extractedPlaylist }, { requireLens: true });
            showHudNotification(`PLAYING PLAYLIST: ${extractedPlaylist} · EXTRACTING VIDEOS IN BACKGROUND`);
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
                try {
                    const results = await Promise.all(parsed.playlistIds.map(id => ytKb.extractPlaylist(id)));
                    const extractedCount = results.reduce((total, result) => total + (result ? result.items.length : 0), 0);
                    showHudNotification(`PLAYLIST VAULT UPDATED · ${extractedCount} VIDEOS AVAILABLE`);
                } catch (error) {
                    console.error('Playlist extraction failed:', error);
                    showHudNotification(`PLAYLIST EXTRACTION FAILED: ${error.message}`);
                }
            } else {
                alert("No valid YouTube playlist ID found. Paste a YouTube playlist URL or ID.");
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
        ytKbAddBtn.addEventListener('click', async () => {
            const val = ytKbInput.value.trim();
            if (!val) return;
            const parsed = ytKb.parseInput(val);
            let count = 0;
            if (parsed.playlistIds.length > 0) {
                try {
                    const results = await Promise.all(parsed.playlistIds.map(id => ytKb.extractPlaylist(id)));
                    count += results.length;
                } catch (error) {
                    console.error('Playlist extraction failed:', error);
                    showHudNotification(`PLAYLIST EXTRACTION FAILED: ${error.message}`);
                    return;
                }
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
                try {
                    const results = await Promise.all(parsed.playlistIds.map(id => ytKb.extractPlaylist(id)));
                    ytKbInput.value = '';
                    ytKb.renderList();
                    showHudNotification(`PLAYLIST VAULT UPDATED · ${results.reduce((total, result) => total + result.items.length, 0)} VIDEOS AVAILABLE`);
                } catch (error) {
                    console.error('Playlist extraction failed:', error);
                    showHudNotification(`PLAYLIST EXTRACTION FAILED: ${error.message}`);
                }
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
    function resumeMediaPlayback(mediaEl) {
        const generation = localPlaybackGeneration;
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(error => reportError('AUDIO RESUME FAILED: ' + error.message, error));
        }
        mediaEl.play().catch(error => {
            if (error.name !== 'AbortError' && generation === localPlaybackGeneration) {
                reportError('MEDIA RESUME FAILED: ' + error.message, error);
            }
        });
    }

    if (openLocalMediaBtn && localFileInput) {
        openLocalMediaBtn.addEventListener('click', () => localFileInput.click());
    }

    if (mediaPlayPauseBtn) {
        mediaPlayPauseBtn.addEventListener('click', () => {
            if (currentMediaKind === 'audio' && localAudio && localAudio.src) {
                if (localAudio.paused) {
                    resumeMediaPlayback(localAudio);
                } else {
                    localAudio.pause();
                }
            } else if (currentMediaKind === 'video' && localVideo && localVideo.src) {
                if (localVideo.paused) {
                    resumeMediaPlayback(localVideo);
                } else {
                    localVideo.pause();
                }
            } else if (activeAudioElement) {
                if (activeAudioElement.paused) {
                    resumeMediaPlayback(activeAudioElement);
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
    async function playLocalVideo(file, customTitle = null, onFail = null) {
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

        localVideo.srcObject = null;
        localVideo.volume = 1.0;
        try {
            await localPlayback.play(localVideo, file, 'video');
            if (aiWarp) aiWarp.setSourceMode('video', localVideo);
            bindMediaTransportEvents(localVideo, customTitle || (typeof file === 'string' ? file : file.name));
        } catch (error) {
            if (error.name === 'AbortError') return;
            if (onFail) onFail();
            else reportError('LOCAL VIDEO FAILED: ' + error.message, error);
        }
    }

    function playEasterEgg() {
        const fallback = () => {
            const it = ytKb.items.find(x => x.id === EASTER_EGG.id) || { id: EASTER_EGG.id, title: EASTER_EGG.title };
            ytHistory.push(it);
            ytHistoryIndex = ytHistory.length - 1;
            loadYouTube(it);
            showHudNotification('LOCAL FILE MISSING · PLAYING FROM YOUTUBE: ' + EASTER_EGG.title);
        };
        playLocalVideo(EASTER_EGG.localFile, EASTER_EGG.title + ' · ' + EASTER_EGG.author, fallback);
        showHudNotification('\u{1F95A} EASTER EGG · ' + EASTER_EGG.title.toUpperCase());
    }

    // Konami code: up up down down left right left right B A
    (function () {
        const seq = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
        let pos = 0;
        window.addEventListener('keydown', (e) => {
            const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea' || tag === 'select') { pos = 0; return; }
            const k = (e.key || '').toLowerCase();
            pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
            if (pos === seq.length) { pos = 0; playEasterEgg(); }
        });
    })();

    // Play Local Audio (.mp3, .m4a) & Hook Folder Artwork Accompaniment
    async function playLocalAudio(file, customTitle = null) {
        pauseAllOtherMedia();
        const generation = localPlaybackGeneration;
        if (ytWarpShell) ytWarpShell.style.display = 'none';
        currentMediaKind = 'audio';
        syncPlaybackClasses('audio');
        activeAudioElement = localAudio;

        // 1. Try extracting embedded ID3 cover art
        const id3CoverUrl = await extractId3Artwork(file);
        if (generation !== localPlaybackGeneration) {
            if (id3CoverUrl) URL.revokeObjectURL(id3CoverUrl);
            return;
        }
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
        if (generation !== localPlaybackGeneration) return;
        routeElementToAudioContext(localAudio);

        localAudio.volume = 1.0;
        try {
            await localPlayback.play(localAudio, file, 'audio');
            bindMediaTransportEvents(localAudio, customTitle || file.name);
        } catch (error) {
            if (error.name !== 'AbortError') reportError('LOCAL AUDIO FAILED: ' + error.message, error);
        }
    }

    // Process a collection of files (from file input, folder picker, or drag-and-drop)
    async function handleIncomingFiles(fileList) {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        const isVideo = f => /\.(mp4|m4v|mov|avi|mkv|webm|ogv|ogm|3gp|av1|ivf|wmv|asf|mpg|mpeg|ts|mts|m2ts|flv|vob)$/i.test(f.name) || f.type.startsWith('video/');
        const isAudio = f => /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|weba|mka|spx|aif|aiff|wma|ac3|dts|amr)$/i.test(f.name) || f.type.startsWith('audio/');
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
                    if (isLocked) aiWarp.snapshotVoiceLock(name);
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
            warpBtn.textContent = `AI WARP: [${aiWarp.aiWarpActive ? 'ON' : 'OFF'}] (${aiWarp.aiWarpMode.replace(/_/g, ' ').toUpperCase()})`;
            warpBtn.classList.toggle('active', aiWarp.aiWarpActive);
        }

        const warpModeBtn = document.getElementById('warpModeCycleBtn');
        if (warpModeBtn) {
            const idx = aiWarp.aiWarpModeIndex;
            const total = aiWarp.aiWarpModes.length - 1;
            warpModeBtn.textContent = `MODE: ${aiWarp.aiWarpMode.replace(/_/g, ' ').toUpperCase()} [${idx}/${total}]`;
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
        const bwInvertControlSlider = document.getElementById('bwInvertControlSlider');
        const bwInvertControlBadge = document.getElementById('bwInvertControlBadge');
        const bwInvertControlPreview = document.getElementById('bwInvertControlPreview');
        const bwInvertControlLock = document.getElementById('bwInvertControlLock');
        const hueCycleControlSlider = document.getElementById('hueCycleControlSlider');
        const hueCycleControlBadge = document.getElementById('hueCycleControlBadge');
        const hueCycleControlPreview = document.getElementById('hueCycleControlPreview');
        const hueCycleControlLock = document.getElementById('hueCycleControlLock');
        if (bwInvertControlSlider) bwInvertControlSlider.value = aiWarp.voiceFxSettings.bwInvert;
        if (bwInvertControlBadge) bwInvertControlBadge.textContent = `${Math.round(aiWarp.voiceFxSettings.bwInvert * 100)}%`;
        if (bwInvertControlPreview) bwInvertControlPreview.style.opacity = String(aiWarp.voiceFxSettings.bwInvert);
        if (bwInvertControlLock) {
            bwInvertControlLock.textContent = aiWarp.voiceFxLocks.bwInvert ? '🔒' : '🔓';
            bwInvertControlLock.classList.toggle('locked', aiWarp.voiceFxLocks.bwInvert);
        }
        if (hueCycleControlSlider) hueCycleControlSlider.value = aiWarp.voiceFxSettings.hueOffset;
        if (hueCycleControlBadge) hueCycleControlBadge.textContent = `${Math.round(aiWarp.voiceFxSettings.hueOffset)}°`;
        if (hueCycleControlPreview) {
            hueCycleControlPreview.style.setProperty('--hue-position', `${(aiWarp.voiceFxSettings.hueOffset / 360) * 100}%`);
        }
        if (hueCycleControlLock) {
            hueCycleControlLock.textContent = aiWarp.voiceFxLocks.hueOffset ? '🔒' : '🔓';
            hueCycleControlLock.classList.toggle('locked', aiWarp.voiceFxLocks.hueOffset);
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
        [['speedLockBtn', aiWarp.masterLocks.speed], ['opacityLockBtn', aiWarp.masterLocks.opacity], ['ghostLockBtn', aiWarp.masterLocks.ghost], ['vsyncLockBtn', aiWarp.vsyncLocked]].forEach(([id, on]) => {
            const b = document.getElementById(id);
            if (b) { b.textContent = on ? '🔒' : '🔓'; b.classList.toggle('locked', !!on); }
        });
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
            showHudNotification(aiWarp.aiWarpActive ? `AI WARP: [ON] (${aiWarp.aiWarpMode.replace(/_/g, ' ').toUpperCase()})` : 'AI WARP: [OFF]');
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
            const idx = aiWarp.aiWarpModeIndex;
            const total = aiWarp.aiWarpModes.length - 1;
            showHudNotification(`WARP MODE: ${nextMode.replace(/_/g, ' ').toUpperCase()} [${idx}/${total}]`);
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
            showHudNotification(`WARP MODE: ${selected.replace(/_/g, ' ').toUpperCase()}`);
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
            saveVoiceFxControlState();
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

    if (aiWarp) {
        aiWarp.onSoftEyeProgress = (k, mode) => {
            if (softEyeBtn) softEyeBtn.style.setProperty('--k', k.toFixed(3));
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
            aiWarp.snapshotMasterLocks(['speed']);
            syncUiFromEngine();
            showHudNotification('SPEED: 0.1x (ZEROED)');
        };
    }

    const nullOpacityBtn = document.getElementById('null-opacity-btn');
    if (nullOpacityBtn) {
        nullOpacityBtn.onclick = () => {
            aiWarp.masterOpacity = 0.0;
            aiWarp.snapshotMasterLocks(['opacity']);
            syncUiFromEngine();
            showHudNotification('OPACITY: 0% (ZEROED)');
        };
    }

    const nullGhostBtn = document.getElementById('null-ghost-btn');
    if (nullGhostBtn) {
        nullGhostBtn.onclick = () => {
            aiWarp.setGhostLevel(0.0);
            aiWarp.ghostModeIndex = 0;
            aiWarp.snapshotMasterLocks(['ghost']);
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

    const vsyncLockBtn = document.getElementById('vsyncLockBtn');
    const milkdropOpacitySlider = document.getElementById('milkdropOpacitySlider');
    const milkdropOpacityValBadge = document.getElementById('milkdropOpacityValBadge');
    const milkdropOpacityLockBtn = document.getElementById('milkdropOpacityLockBtn');
    const bwInvertControlSlider = document.getElementById('bwInvertControlSlider');
    const bwInvertControlLock = document.getElementById('bwInvertControlLock');
    const hueCycleControlSlider = document.getElementById('hueCycleControlSlider');
    const hueCycleControlLock = document.getElementById('hueCycleControlLock');
    const voiceFxRandomizeBtn = document.getElementById('voiceFxRandomizeBtn');
    const nullMilkdropOpacityBtn = document.getElementById('null-milkdrop-opacity-btn');
    function activateTunedVoicePair(name) {
        [name, aiWarp.gc3EffectName(name)].forEach(voiceName => {
            if (!aiWarp.effectEnabled[voiceName]) aiWarp.setEffectEnabled(voiceName, true);
        });
    }
    if (vsyncLockBtn) {
        vsyncLockBtn.onclick = () => {
            aiWarp.setMasterLock('vsync', !aiWarp.vsyncLocked);
            vsyncLockBtn.textContent = aiWarp.vsyncLocked ? '🔒' : '🔓';
            vsyncLockBtn.classList.toggle('locked', aiWarp.vsyncLocked);
            showHudNotification(`V-SYNC ${aiWarp.vsyncLocked ? 'LOCKED' : 'UNLOCKED'}`);
        };
    }
    [['speed', 'speedLockBtn', 'SPEED'], ['opacity', 'opacityLockBtn', 'OPACITY'], ['ghost', 'ghostLockBtn', 'GHOST']].forEach(([key, id, label]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.onclick = () => {
            aiWarp.setMasterLock(key, !aiWarp.masterLocks[key]);
            const on = !!aiWarp.masterLocks[key];
            btn.textContent = on ? '🔒' : '🔓';
            btn.classList.toggle('locked', on);
            showHudNotification(`${label} ${on ? 'LOCKED (IMMUNE TO AUTO)' : 'UNLOCKED'}`);
        };
    });
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
    if (bwInvertControlSlider) {
        bwInvertControlSlider.oninput = () => {
            aiWarp.setVoiceFxSetting('bwInvert', parseFloat(bwInvertControlSlider.value));
            activateTunedVoicePair('B&W Invert');
            syncUiFromEngine();
            saveVoiceFxControlState();
        };
    }
    if (hueCycleControlSlider) {
        hueCycleControlSlider.oninput = () => {
            aiWarp.setVoiceFxSetting('hueOffset', parseFloat(hueCycleControlSlider.value));
            activateTunedVoicePair('Hue/Color Cycle');
            syncUiFromEngine();
            saveVoiceFxControlState();
        };
    }
    if (bwInvertControlLock) {
        bwInvertControlLock.onclick = () => {
            aiWarp.voiceFxLocks.bwInvert = !aiWarp.voiceFxLocks.bwInvert;
            syncUiFromEngine();
            saveVoiceFxControlState();
        };
    }
    if (hueCycleControlLock) {
        hueCycleControlLock.onclick = () => {
            aiWarp.voiceFxLocks.hueOffset = !aiWarp.voiceFxLocks.hueOffset;
            syncUiFromEngine();
            saveVoiceFxControlState();
        };
    }
    if (voiceFxRandomizeBtn) {
        voiceFxRandomizeBtn.onclick = () => {
            aiWarp.randomizeVoiceFxSettings();
            syncUiFromEngine();
            saveVoiceFxControlState();
            showHudNotification('UNLOCKED B&W / HUE SETTINGS RANDOMIZED');
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
                warpBtn.textContent = `AI WARP: [${aiWarp.aiWarpActive ? 'ON' : 'OFF'}] (${aiWarp.aiWarpMode.replace(/_/g, ' ').toUpperCase()})`;
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
            aiWarp.snapshotMasterLocks(['speed']);
            if (speedValBadge) speedValBadge.textContent = `${aiWarp.glitchSpeed.toFixed(1)}x`;
        };
    }

    if (opacitySlider) {
        opacitySlider.oninput = () => {
            aiWarp.masterOpacity = parseFloat(opacitySlider.value);
            aiWarp.snapshotMasterLocks(['opacity']);
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
            aiWarp.snapshotMasterLocks(['ghost']);
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
            aiWarp.snapshotMasterLocks(['vsync']);
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
            saveVoiceFxControlState();
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
                voiceFxSettings: Object.assign({}, aiWarp.voiceFxSettings),
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
                            const autoPreset = Object.assign({}, p, {
                                toggles: Object.assign({}, p.toggles || {})
                            });
                            delete autoPreset.voiceFxSettings;
                            delete autoPreset.toggles.autoGlitch;
                            aiWarp.applyPreset(autoPreset, true, 1600);
                            aiWarp.randomizeVoiceFxSettings();
                            aiWarp.rollAutoGlitch();
                            syncUiFromEngine();
                            saveVoiceFxControlState();
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
    const freezeCapture = new window.FreezeFrameCapture(lensBridge);
    if (freezeFrameBtn) {
        freezeFrameBtn.onclick = async () => {
            const mainCanvas = document.getElementById('glitchCanvas');
            try {
                const png = await freezeCapture.capture(mainCanvas, aiWarp.sourceMode);
                downloadFreezeFrame(png);
                showHudNotification('FREEZE FRAME 📷 // FULL LENS + FX PNG CAPTURED (NO HUD)');
            } catch (err) {
                reportError('FREEZE FRAME FAILED', err);
            }
        };
    }

    function downloadFreezeFrame(png) {
        const link = document.createElement('a');
        link.download = `ai-warp-freeze-frame-${Date.now()}.png`;
        link.href = png;
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
                if (localAudio.paused) resumeMediaPlayback(localAudio); else localAudio.pause();
            } else if ((currentMediaKind === 'video' || currentMediaKind === 'capture') && localVideo) {
                if (localVideo.paused) resumeMediaPlayback(localVideo); else localVideo.pause();
            } else if (activeAudioElement) {
                if (activeAudioElement.paused) resumeMediaPlayback(activeAudioElement); else activeAudioElement.pause();
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
            showHudNotification(`WARP MODE: ${nextMode.replace(/_/g, ' ').toUpperCase()}`);
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
    })();
    initialization.then(() => {
        document.documentElement.dataset.warpStartup = 'ready';
    }).catch((error) => {
        document.documentElement.dataset.warpStartup = 'failed';
        reportError('AI WARP STARTUP FAILED: ' + error.message + ' — reload after correcting the app files.', error);
    });
});
