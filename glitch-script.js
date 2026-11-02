document.addEventListener('DOMContentLoaded', () => {

    class GlitchController {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.error(`Canvas element with id "${canvasId}" not found.`);
                return;
            }
            this.gctx = this.canvas.getContext('2d');
            this.ghostCanvas = document.createElement('canvas');
            this.ghostCtx = this.ghostCanvas.getContext('2d');
            this.ghostFxCanvas = document.createElement('canvas');
            this.ghostFxCtx = this.ghostFxCanvas.getContext('2d');
            this.workCanvas = document.createElement('canvas');
            this.workCtx = this.workCanvas.getContext('2d');

            // Core state
            this.lastFrameTime = performance.now();
            this.customTime = 0;
            this.masterBeat = 0;
            this.isLooping = false;

            // Controllable parameters
            this.timeScale = 1.0;
            this.masterOpacity = 0.5; // Default from glitch-test.html
            this.effectAlphas = {};
            this.effectEnabled = {};
            this.effectUserLevel = {};
            this.effectSize = {};
            this.effectDepth = {};
            this.effectLive = {};
            this.effectTarget = {};
            this.effectPhase = {};
            this.effectRate = {};
            this.effectRetargetAt = {};
            this.confluenceClock = 0;
            this.masterEffectIntensity = 1.0;
            this.motionScale = 1.0;
            this.blendSoftness = 0.55;
            this.boardEnergy = 0.65;
            this.continualSpeed = 0.85;
            this.autoGlitchPower = 0.75;
            this.vsyncLevel = 0.60;
            this.randomSeed = 0.52;
            this.softEyeActive = false;
            this.softEyeK = 1;
            this.softEyeBurstEnvelope = 0;
            this.softEyeCrescendo = null;
            this.softEyeBurst = null;
            this.softEyeEar = null;
            this.hardLightActive = false;
            this.autoGlitchActive = false;
            this.autoEffectExpiries = new Map();
            this.nextAutoGlitchAt = 0;
            this.manualCrescendoPulse = null;
            this.manualCrescendoCooldownUntil = 0;
            this.crescendoButtonTimer = null;
            this.crescendoCooldownMs = 7000;
            this.crescendoPulseMs = 4600;

            this.activeEffects = [];
            this.factories = this.buildFactories();
            this.defineEffects();
            try { this.init(); } catch (err) { console.error('Glitch init failed', err); }
        }

        defineEffects() {
            // Defines all available effects, their factories, and default alpha values.
            this.effectDefinitions = [
                { name: 'Neon Grad', factory: this.factories.neonGradient, defaultAlpha: 0.0 },
                { name: 'Scanlines', factory: this.factories.scanlines, defaultAlpha: 0.0 },
                { name: 'Data Bands', factory: this.factories.vhs, defaultAlpha: 0.0 },
                { name: 'Flash', factory: this.factories.brightFlash, defaultAlpha: 0.0 },
                { name: 'HSL Rainbow', factory: this.factories.hslRainbow, defaultAlpha: 0.0 },
                { name: 'ASCII', factory: this.factories.asciiArt, defaultAlpha: 0.0 },
                { name: 'Font Burn', factory: this.factories.fontBurn, defaultAlpha: 0.0 },
                { name: 'Strobe', factory: this.factories.strobe, defaultAlpha: 0.0 },
                { name: 'Gemini Bomb', factory: this.factories.geminiBomb, defaultAlpha: 0.0 },
                { name: 'Tech Artist', factory: this.factories.techArtist, defaultAlpha: 0.0 },
                { name: 'VHS Glitch', factory: this.factories.vhsGlitch, defaultAlpha: 0.0 },
                { name: 'Data Bomb', factory: this.factories.dataBomb, defaultAlpha: 0.0 },
                { name: 'Ink Glyphs', factory: this.factories.inkGlyphs, defaultAlpha: 0.0 },
                { name: 'Matrix ASCII', factory: this.factories.matrixAscii, defaultAlpha: 0.0 },
                { name: 'Matrix Chord', factory: this.factories.matrixChord, defaultAlpha: 0.0 },
                { name: 'B&W Invert', defaultAlpha: 0.0 },
                { name: 'Hue/Color Cycle', defaultAlpha: 0.0 }
            ];
        }

        init() {
            this.techArtistShader = null;
            this.techArtistMouse = { x: 0.5, y: 0.5 };
            this.techArtistLastMouse = { x: 0.5, y: 0.5 };
            this.techArtistVelocity = { x: 0, y: 0 };
            this.resize();
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', (event) => {
                const newX = event.clientX / window.innerWidth;
                const newY = 1.0 - (event.clientY / window.innerHeight);
                this.techArtistVelocity.x = Math.max(-1, Math.min(1, (newX - this.techArtistLastMouse.x) * 6));
                this.techArtistVelocity.y = Math.max(-1, Math.min(1, (newY - this.techArtistLastMouse.y) * 6));
                this.techArtistMouse = { x: newX, y: newY };
                this.techArtistLastMouse = { x: newX, y: newY };
            });

            this.setupGlobalHooks();

            // Initialize alphas to their defaults
            this.effectDefinitions.forEach(def => {
                this.effectAlphas[def.name] = def.defaultAlpha;
                this.effectEnabled[def.name] = false;
                this.effectUserLevel[def.name] = 1;
                this.effectSize[def.name] = 1;
                this.effectDepth[def.name] = 0.62;
                this.effectLive[def.name] = 0;
                this.effectTarget[def.name] = 0;
                this.effectPhase[def.name] = Math.random() * Math.PI * 2;
                this.effectRate[def.name] = 0.6 + Math.random() * 2.4;
                this.effectRetargetAt[def.name] = 0;
            });
            
            // Build the active effects list from factories
            this.effectDefinitions.forEach(def => {
                if (def.factory) {
                    const getStrength = () => this.confluenceStrength(def.name);
                    this.activeEffects.push(def.factory(getStrength));
                }
            });

            if (!this.isLooping) {
                this.mainRenderLoop();
            }
        }
        
        setupGlobalHooks() {
            // Allows glitch-test.html's slider to control master opacity
            window.__setGlitchMasterOpacity = (value) => {
                this.masterOpacity = parseFloat(value);
            };

            // Allows glitch-test.html's buttons to toggle effects on and off
            window.__toggleEffect = (effectName, isActive) => this.setEffectEnabled(effectName, isActive, 'manual');
            window.__setEffectIntensity = (effectName, value) => this.setEffectIntensity(effectName, value, true);
            window.__setEffectSize = (effectName, value) => this.setEffectSize(effectName, value, true);
            window.__setEffectDepth = (effectName, value) => this.setEffectDepth(effectName, value, true);
            window.__setMasterEffectIntensity = (value) => { this.masterEffectIntensity = this.clamp01(value); };
            window.__setMotionScale = (value) => { this.motionScale = Math.max(0.1, Math.min(2.5, parseFloat(value) || 1)); };
            window.__setBlendSoftness = (value) => { this.blendSoftness = this.clamp01(value); };
            window.__setBoardEnergy = (value) => { this.boardEnergy = this.clamp01(value); };
            window.__setContinualSpeed = (value) => { this.continualSpeed = this.clamp01(value); };
            window.__setAutoGlitchPower = (value) => { this.autoGlitchPower = this.clamp01(value); };
            window.__setVsyncLevel = (value) => { this.vsyncLevel = this.clamp01(value); };
            window.__setRandomSeed = (value) => { this.randomSeed = this.clamp01(value); };
            window.__toggleSoftEye = () => this.toggleSoftEye();
            window.__callCrescendo = () => this.callCrescendo();
            window.__toggleHardLight = () => this.toggleHardLight();
            window.__toggleAutoGlitch = () => this.toggleAutoGlitch();
            window.__randomizeEffects = () => this.randomizeEffects();
            window.__zeroAllEffects = () => this.zeroAllEffects();
            
            // This is kept for compatibility with the HTML, but is a no-op
            window.initializeGlitchCanvases = () => {};

            this.ghostModes = (window.GlitchEngine && window.GlitchEngine.GHOST_MODES)
                ? window.GlitchEngine.GHOST_MODES.slice() : ['OFF', 'DIA', 'SPECTRUM', 'CRT', 'PLASMA', 'LED'];
            this.ghostModeIndex = 0;
            this.ghostLevel = 1;
            this.vsyncModes = (window.GlitchEngine && window.GlitchEngine.VSYNC_MODES)
                ? window.GlitchEngine.VSYNC_MODES.slice() : ['OFF', 'ON', 'GHOST_OFF', 'FULL'];
            this.vsyncModeIndex = 0;
            this.aiWarpActive = false;
            this.aiWarpStrength = 0.5;
            this.aiWarpHue = 0;
            this.cachedAiWarp = { hue: -999, largeFreq: -999, smallFreq: -999, distortion: -999 };
            this.resetSoftEyeEngine();

            window.__setGhostLevel = (value) => {
                this.ghostLevel = Math.max(0, Math.min(1, parseFloat(value) || 0));
            };
            window.__getGhostMode = () => this.ghostModes[this.ghostModeIndex] || 'OFF';
            window.__getVsyncMode = () => this.vsyncModes[this.vsyncModeIndex] || 'OFF';
            window.__cycleVsyncMode = () => {
                this.vsyncModeIndex = (this.vsyncModeIndex + 1) % this.vsyncModes.length;
                this.emitUiState();
                return window.__getVsyncMode();
            };
            window.__setAiWarp = (on) => {
                this.aiWarpActive = !!on;
                window.__aiWarpActive = this.aiWarpActive;
                this.emitUiState();
                document.body.classList.toggle('ai-warp-on', this.aiWarpActive);
                if (!this.aiWarpActive) {
                    const overlay = document.getElementById('color-shift-overlay');
                    if (overlay) overlay.style.opacity = '0';
                    ['hue-bg', 'bg-custom', 'glitchCanvas'].forEach((id) => {
                        const el = document.getElementById(id);
                        if (el) { el.style.filter = ''; el.style.transform = ''; }
                    });
                }
            };
            window.__setAiWarpStrength = (value) => {
                this.aiWarpStrength = Math.max(0, Math.min(1, parseFloat(value) || 0));
            };
            window.__aiWarpActive = false;
            window.__cycleGhostMode = () => {
                this.ghostModeIndex = (this.ghostModeIndex + 1) % this.ghostModes.length;
                const mode = this.ghostModes[this.ghostModeIndex];
                document.body.classList.toggle('ghost-on', mode !== 'OFF');
                this.emitUiState();
                return mode;
            };
            this.bindOverlayControls();
        }

        bindOverlayControls() {
            const ghostBtn = document.getElementById('ghost-mode-btn');
            const ghostSlider = document.getElementById('ghost-strength-slider');
            const vsyncBtn = document.getElementById('vsync-mode-btn');
            const warpBtn = document.getElementById('ai-warp-btn');
            const softEyeBtn = document.getElementById('soft-eye-btn');
            const hardLightBtn = document.getElementById('hard-light-btn');
            const callBurstBtn = document.getElementById('call-crescendo-btn');
            const autoGlitchBtn = document.getElementById('auto-glitch-btn');
            const randomizeBtn = document.getElementById('randomize-effects-btn');
            const zeroBtn = document.getElementById('zero-effects-btn');
            const engineDockToggle = document.getElementById('engine-dock-toggle');
            const engineDock = document.getElementById('engine-control-dock');
            const warpSlider = document.getElementById('ai-warp-slider');
            if (ghostBtn && !ghostBtn.dataset.bound) {
                ghostBtn.dataset.bound = '1';
                ghostBtn.addEventListener('click', () => {
                    const mode = window.__cycleGhostMode();
                    ghostBtn.textContent = 'GHOST ' + mode;
                    ghostBtn.style.borderColor = mode === 'OFF' ? '' : '#0f0';
                    ghostBtn.style.color = mode === 'OFF' ? '' : '#0f0';
                });
            }
            if (ghostSlider && !ghostSlider.dataset.bound) {
                ghostSlider.dataset.bound = '1';
                ghostSlider.addEventListener('input', () => window.__setGhostLevel(parseFloat(ghostSlider.value)));
                window.__setGhostLevel(parseFloat(ghostSlider.value));
            }
            if (vsyncBtn && !vsyncBtn.dataset.bound) {
                vsyncBtn.dataset.bound = '1';
                vsyncBtn.addEventListener('click', () => {
                    const mode = window.__cycleVsyncMode();
                    vsyncBtn.textContent = 'V-SYNC ' + mode.replace('_', ' ');
                    const on = mode !== 'OFF';
                    vsyncBtn.style.borderColor = on ? '#0f0' : '';
                    vsyncBtn.style.color = on ? '#0f0' : '';
                });
            }
            if (softEyeBtn && !softEyeBtn.dataset.bound) {
                softEyeBtn.dataset.bound = '1';
                softEyeBtn.addEventListener('click', (event) => {
                    if (event.shiftKey) this.callCrescendo(); else this.toggleSoftEye();
                });
            }
            if (hardLightBtn && !hardLightBtn.dataset.bound) {
                hardLightBtn.dataset.bound = '1';
                hardLightBtn.addEventListener('click', () => this.toggleHardLight());
            }
            if (callBurstBtn && !callBurstBtn.dataset.bound) {
                callBurstBtn.dataset.bound = '1';
                this.crescendoButton = callBurstBtn;
                callBurstBtn.addEventListener('click', () => this.callCrescendo());
                this.updateCrescendoButton();
            }
            if (autoGlitchBtn && !autoGlitchBtn.dataset.bound) {
                autoGlitchBtn.dataset.bound = '1'; autoGlitchBtn.addEventListener('click', () => this.toggleAutoGlitch());
            }
            if (randomizeBtn && !randomizeBtn.dataset.bound) {
                randomizeBtn.dataset.bound = '1'; randomizeBtn.addEventListener('click', () => this.randomizeEffects());
            }
            if (zeroBtn && !zeroBtn.dataset.bound) {
                zeroBtn.dataset.bound = '1'; zeroBtn.addEventListener('click', () => this.zeroAllEffects());
            }
            if (engineDockToggle && engineDock && !engineDockToggle.dataset.bound) {
                engineDockToggle.dataset.bound = '1';
                engineDockToggle.addEventListener('click', () => {
                    engineDock.hidden = !engineDock.hidden;
                    engineDockToggle.textContent = engineDock.hidden ? 'SHOW EXTRA PANEL' : 'HIDE EXTRA PANEL';
                    engineDockToggle.setAttribute('aria-expanded', String(!engineDock.hidden));
                });
            }
            if (warpBtn && !warpBtn.dataset.bound) {
                warpBtn.dataset.bound = '1';
                warpBtn.addEventListener('click', () => {
                    const on = !this.aiWarpActive;
                    window.__setAiWarp(on);
                    warpBtn.textContent = on ? 'WARP ON' : 'WARP OFF';
                    warpBtn.style.borderColor = on ? '#0f0' : '';
                    warpBtn.style.color = on ? '#0f0' : '';
                });
            }
            if (warpSlider && !warpSlider.dataset.bound) {
                warpSlider.dataset.bound = '1';
                warpSlider.addEventListener('input', () => window.__setAiWarpStrength(parseFloat(warpSlider.value)));
                window.__setAiWarpStrength(parseFloat(warpSlider.value));
            }
        }

        clamp01(value) {
            const n = parseFloat(value);
            return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
        }

        emitUiState() {
            try {
                window.dispatchEvent(new CustomEvent('glitch-ui-state', { detail: {
                    effects: { ...this.effectEnabled }, levels: { ...this.effectUserLevel },
                    sizes: { ...this.effectSize }, depths: { ...this.effectDepth },
                    softEye: this.softEyeActive, hardLight: this.hardLightActive,
                    autoGlitch: this.autoGlitchActive, warp: this.aiWarpActive, ghost: window.__getGhostMode(), vsync: window.__getVsyncMode()
                }}));
            } catch (e) {}
        }

        setEffectEnabled(name, enabled, source) {
            if (typeof this.effectAlphas[name] === 'undefined') return;
            if (source !== 'auto') this.autoEffectExpiries.delete(name);
            this.effectEnabled[name] = !!enabled;
            if (enabled) {
                this.effectLive[name] = Math.max(0.12, this.effectLive[name] || (0.38 + Math.random() * 0.38));
                this.effectTarget[name] = 0.24 + Math.random() * 0.68;
                this.effectRate[name] = (0.25 + Math.random() * 1.8) * (0.45 + this.continualSpeed * 1.15);
                this.effectAlphas[name] = this.effectLive[name] * (this.effectUserLevel[name] ?? 1);
                this.effectRetargetAt[name] = 0;
            } else {
                this.effectLive[name] = 0;
                this.effectTarget[name] = 0;
                this.effectAlphas[name] = 0;
            }
            this.emitUiState();
        }

        setEffectIntensity(name, value, silent) {
            if (typeof this.effectAlphas[name] === 'undefined') return;
            this.effectUserLevel[name] = this.clamp01(value);
            this.effectAlphas[name] = (this.effectLive[name] || 0) * this.effectUserLevel[name];
            if (!silent) this.emitUiState();
        }

        setEffectSize(name, value, silent) {
            if (typeof this.effectSize[name] === 'undefined') return;
            const n = parseFloat(value);
            this.effectSize[name] = Number.isFinite(n) ? Math.max(0.4, Math.min(2.4, n)) : 1;
            if (!silent) this.emitUiState();
        }

        setEffectDepth(name, value, silent) {
            if (typeof this.effectDepth[name] === 'undefined') return;
            this.effectDepth[name] = this.clamp01(value);
            if (!silent) this.emitUiState();
        }

        sizeFor(name) { return this.effectSize[name] ?? 1; }
        depthFor(name) { return this.effectDepth[name] ?? 0.62; }
        seedHue(name) {
            const E = window.GlitchEngine;
            const hash = E && E.ghostKeyHash ? E.ghostKeyHash(`${name}:${Math.round(this.randomSeed * 10000)}`) : Math.round(this.randomSeed * 10000 + name.length * 731);
            return hash % 360;
        }

        resetSoftEyeEngine() {
            const E = window.GlitchEngine;
            this.softEyeCrescendo = E && E.createCrescendo ? E.createCrescendo() : null;
            this.softEyeBurst = E && E.createBurstGate ? E.createBurstGate() : null;
            this.softEyeEar = E && E.createEar ? E.createEar() : null;
            this.softEyeK = this.softEyeActive ? 0 : 1;
            this.softEyeBurstEnvelope = 0;
        }

        toggleSoftEye() {
            this.softEyeActive = !this.softEyeActive;
            this.resetSoftEyeEngine();
            document.body.classList.toggle('soft-eye-on', this.softEyeActive);
            this.emitUiState();
            return this.softEyeActive;
        }

        manualCrescendoBoost(effectName, now = performance.now()) {
            const pulse = this.manualCrescendoPulse;
            if (!pulse || !pulse.effects.has(effectName)) return 1;
            const progress = Math.max(0, Math.min(1, (now - pulse.startedAt) / pulse.duration));
            if (progress >= 1) {
                this.manualCrescendoPulse = null;
                return 1;
            }
            const rise = 0.62;
            let envelope;
            if (progress < rise) {
                const t = progress / rise;
                envelope = t * t * (3 - 2 * t);
            } else {
                const t = (progress - rise) / (1 - rise);
                envelope = 1 - t * t * (3 - 2 * t);
            }
            return 1 + 0.9 * Math.max(0, envelope);
        }

        updateCrescendoButton() {
            const button = this.crescendoButton || document.getElementById('call-crescendo-btn');
            if (!button) return;
            if (this.crescendoButtonTimer && window.clearTimeout) {
                window.clearTimeout(this.crescendoButtonTimer);
                this.crescendoButtonTimer = null;
            }
            const remaining = Math.max(0, this.manualCrescendoCooldownUntil - performance.now());
            button.disabled = remaining > 0;
            button.textContent = remaining > 0
                ? `CRESCENDO · ${Math.ceil(remaining / 1000)}s`
                : 'CALL CRESCENDO';
            if (remaining > 0 && window.setTimeout) {
                this.crescendoButtonTimer = window.setTimeout(() => this.updateCrescendoButton(), Math.min(1000, remaining));
            }
        }

        callCrescendo() {
            const now = performance.now();
            if (now < this.manualCrescendoCooldownUntil) return false;
            const activeEffects = new Set(Object.keys(this.effectEnabled).filter(name => this.effectEnabled[name]));
            if (!this.softEyeActive) {
                this.softEyeActive = true;
                document.body.classList.add('soft-eye-on');
                this.resetSoftEyeEngine();
            }
            const softEyeAccepted = !!(this.softEyeCrescendo && this.softEyeCrescendo.request(now, 'manual', 1, 1));
            if (!activeEffects.size && !softEyeAccepted) {
                this.emitUiState();
                return false;
            }
            this.manualCrescendoPulse = { startedAt: now, duration: this.crescendoPulseMs, effects: activeEffects };
            this.manualCrescendoCooldownUntil = now + this.crescendoCooldownMs;
            this.updateCrescendoButton();
            this.emitUiState();
            return true;
        }

        toggleHardLight() {
            this.hardLightActive = !this.hardLightActive;
            document.body.classList.toggle('hard-light', this.hardLightActive);
            this.emitUiState();
            return this.hardLightActive;
        }

        toggleAutoGlitch() {
            this.autoGlitchActive = !this.autoGlitchActive;
            this.nextAutoGlitchAt = performance.now() + 350;
            if (!this.autoGlitchActive) {
                for (const name of this.autoEffectExpiries.keys()) this.setEffectEnabled(name, false, 'auto');
                this.autoEffectExpiries.clear();
            }
            this.emitUiState();
            return this.autoGlitchActive;
        }

        randomizeEffects() {
            const names = this.effectDefinitions.map(d => d.name).filter(n => n !== 'B&W Invert' && n !== 'Hue/Color Cycle');
            const active = names.filter(n => this.effectEnabled[n]);
            if (!active.length) {
                const pool = names.slice().sort(() => Math.random() - 0.5).slice(0, 3);
                pool.forEach(n => this.setEffectEnabled(n, true, 'random'));
            } else {
                active.forEach(n => {
                    this.effectTarget[n] = 0.15 + Math.random() * 0.83;
                    this.effectRate[n] = 0.25 + Math.random() * 1.8;
                    this.effectRetargetAt[n] = this.confluenceClock + 800 + Math.random() * 3500;
                    this.setEffectIntensity(n, 0.45 + Math.random() * 0.55);
                });
            }
            this.emitUiState();
        }

        zeroAllEffects() {
            Object.keys(this.effectEnabled).forEach(n => this.setEffectEnabled(n, false, 'reset'));
            this.autoGlitchActive = false;
            this.autoEffectExpiries.clear();
            this.softEyeActive = false;
            this.softEyeK = 1;
            this.softEyeBurstEnvelope = 0;
            this.manualCrescendoPulse = null;
            this.hardLightActive = false;
            document.body.classList.remove('soft-eye-on', 'hard-light', 'ghost-on', 'ai-warp-on');
            this.ghostModeIndex = 0;
            this.vsyncModeIndex = 0;
            if (window.__setAiWarp) window.__setAiWarp(false);
            else { this.aiWarpActive = false; window.__aiWarpActive = false; }
            this.applyMasterFilters();
            this.emitUiState();
        }

        updateSoftEye(now, deltaMs) {
            const E = window.GlitchEngine;
            if (!this.softEyeActive || !this.softEyeCrescendo || !this.softEyeEar) {
                this.softEyeK = 1;
                this.softEyeBurstEnvelope = 0;
                return;
            }
            const dt = Math.max(0.001, Math.min(0.1, deltaMs / 1000));
            const pseudoEar = this.softEyeEar.feedVisual(this.masterBeat || 0, Math.abs(Math.sin(this.customTime * 0.0021)), dt);
            this.softEyeK = this.softEyeCrescendo.step(now, dt, pseudoEar);
            this.softEyeBurstEnvelope = this.softEyeBurst
                ? this.softEyeBurst.step(now, dt, this.softEyeK, pseudoEar) : 0;
            if (E && E.softCap) {
                this.softEyeK = Math.max(0, Math.min(1, this.softEyeK));
            }
        }

        updateAutoGlitch(now) {
            for (const [name, expiry] of this.autoEffectExpiries.entries()) {
                if (now >= expiry) {
                    this.autoEffectExpiries.delete(name);
                    this.setEffectEnabled(name, false, 'auto');
                }
            }
            if (!this.autoGlitchActive || now < this.nextAutoGlitchAt) return;
            const names = this.effectDefinitions.map(d => d.name).filter(n => !['B&W Invert', 'Hue/Color Cycle'].includes(n) && !this.effectEnabled[n]);
            if (names.length) {
                const name = names[(Math.random() * names.length) | 0];
                this.setEffectEnabled(name, true, 'auto');
                const wild = this.softEyeActive && this.softEyeK > 0.5;
                const power = this.autoGlitchPower;
                this.effectTarget[name] = 0.18 + Math.random() * (0.28 + power * 0.62);
                this.setEffectIntensity(name, 0.28 + power * 0.58, true);
                this.emitUiState();
                const lifeScale = 0.7 + power * 0.55;
                this.autoEffectExpiries.set(name, now + ((wild ? 2400 : 3600) + Math.random() * (wild ? 2200 : 4200)) * lifeScale);
            }
            const pace = this.softEyeActive && window.GlitchEngine && window.GlitchEngine.SOFT_EYE
                ? window.GlitchEngine.SOFT_EYE.pace.sparkK : 1;
            const powerRate = 1.55 - this.autoGlitchPower * 0.95;
            this.nextAutoGlitchAt = now + (3000 + Math.random() * 5000) * pace * powerRate;
        }

        renderSoftEyeBurst(gctx, w, h) {
            const env = this.softEyeBurstEnvelope;
            if (!this.softEyeActive || env <= 0.01) return;
            const E = window.GlitchEngine;
            const kind = this.softEyeBurst && this.softEyeBurst.kind ? this.softEyeBurst.kind() : 'color';
            const hue = E && E.ghostSkinHue ? (E.ghostSkinHue(window.__getGhostMode()) || 313) : 313;
            const dia = kind === 'dia' || kind === 'both';
            gctx.save();
            gctx.globalCompositeOperation = dia ? 'screen' : 'soft-light';
            gctx.globalAlpha = Math.min(0.12, 0.075 * env);
            const grad = gctx.createLinearGradient(0, h * 0.15, w, h * 0.85);
            grad.addColorStop(0, `hsla(${dia ? hue : (hue + 42) % 360}, 90%, ${dia ? 70 : 55}%, 1)`);
            grad.addColorStop(0.5, `hsla(${(hue + 145) % 360}, 85%, 54%, 1)`);
            grad.addColorStop(1, `hsla(${(hue + 275) % 360}, 90%, 48%, 1)`);
            gctx.fillStyle = grad;
            gctx.fillRect(0, 0, w, h);
            gctx.restore();
        }

        resize() {
            const dpr = window.devicePixelRatio || 1;
            const width = this.canvas.offsetWidth;
            const height = this.canvas.offsetHeight;
            if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
                this.canvas.width = width * dpr;
                this.canvas.height = height * dpr;
            }
            // Ghost/composite buffers are allocated lazily only when the corresponding feature is used.
        }

        liveAlpha(name) {
            return this.effectEnabled[name] ? (this.effectAlphas[name] || 0) : 0;
        }

        rainbowHue(offset = 0) {
            const rain = this.liveAlpha('HSL Rainbow');
            if (rain <= 0.01) return null;
            return (this.customTime * 0.08 + offset + rain * 40) % 360;
        }

        hash01(n) {
            const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
            return x - Math.floor(x);
        }

        tickConfluence(deltaMs) {
            this.confluenceClock += Math.max(0, deltaMs);
            const t = this.confluenceClock;
            const dt = Math.max(0, deltaMs) / 1000;
            const names = this.effectDefinitions.map((d) => d.name).filter((n) => this.effectEnabled[n]);
            this.effectDefinitions.forEach((def) => {
                const name = def.name;
                if (!this.effectEnabled[name]) {
                    const live = this.effectLive[name] || 0;
                    const fade = 1 - Math.exp(-4.2 * dt);
                    this.effectLive[name] = live * (1 - fade);
                    this.effectAlphas[name] = this.effectLive[name] * (this.effectUserLevel[name] ?? 1);
                    return;
                }
                if (t >= (this.effectRetargetAt[name] || 0)) {
                    const neighbor = names.length ? this.liveAlpha(names[Math.floor(Math.random() * names.length)]) : 0.5;
                    const lo = 0.12 + Math.random() * 0.2;
                    const hi = 0.55 + Math.random() * 0.45;
                    let target = lo + Math.random() * (hi - lo);
                    target = target * 0.65 + neighbor * 0.35;
                    this.effectTarget[name] = Math.max(0.08, Math.min(1, target));
                    this.effectRate[name] = (0.18 + Math.random() * 1.6) * (0.45 + this.continualSpeed * 1.15);
                    this.effectRetargetAt[name] = t + (280 + Math.random() * 1400) / (0.5 + this.continualSpeed * 0.9);
                    this.effectPhase[name] = (this.effectPhase[name] || 0) + (Math.random() - 0.5) * 2.4;
                }
                const live = this.effectLive[name] || 0;
                const target = this.effectTarget[name] || 0;
                const k = 1 - Math.exp(-(this.effectRate[name] || 0.6) * dt);
                const osc = 0.04 * Math.sin(t * 0.001 * (this.effectRate[name] || 1) * 6 + (this.effectPhase[name] || 0));
                this.effectLive[name] = Math.max(0.05, Math.min(1, live + (target - live) * k + osc));
                this.effectAlphas[name] = this.effectLive[name] * (this.effectUserLevel[name] ?? 1);
            });
        }

        boardContext() {
            return {
                ghost: window.__getGhostMode ? window.__getGhostMode() : 'OFF',
                vsync: window.__getVsyncMode ? window.__getVsyncMode() : 'OFF',
                warp: !!this.aiWarpActive,
                bw: this.liveAlpha('B&W Invert')
            };
        }

        confluenceStrength(name) {
            if (!this.effectEnabled[name]) return 0;
            const own = this.liveAlpha(name) || 0;
            const hue = this.liveAlpha('Hue/Color Cycle');
            const scan = this.liveAlpha('Scanlines');
            const vhs = this.liveAlpha('VHS Glitch');
            const bands = this.liveAlpha('Data Bands');
            const bomb = this.liveAlpha('Data Bomb');
            const strobe = this.liveAlpha('Strobe');
            const flash = this.liveAlpha('Flash');
            const rainbow = this.liveAlpha('HSL Rainbow');
            const neon = this.liveAlpha('Neon Grad');
            const t = this.customTime * 0.001;
            const phase = this.effectPhase[name] || 0;
            const rate = this.effectRate[name] || 1;
            const breathe = 0.55 + 0.45 * Math.sin(t * rate * 1.15 + phase);
            const lfo2 = 0.62 + 0.38 * Math.sin(t * (0.22 + rate * 0.5) + phase * 1.7);
            const grain = 0.75 + 0.35 * this.hash01(t * 3.1 + phase * 11);
            let mix = own * breathe * lfo2 * grain;
            mix *= 0.7 + hue * 0.35 + rainbow * 0.2;
            mix *= 0.85 + scan * 0.28 * (0.5 + 0.5 * Math.sin(t * 3.4 + phase));
            mix *= 0.88 + (vhs + bands) * 0.22;
            mix *= 0.86 + bomb * 0.3 * Math.abs(Math.sin(t * 5.2 + phase));
            mix *= 0.9 + strobe * 0.18 * this.hash01(t * 9 + phase);
            mix *= 0.92 + flash * 0.12 + neon * 0.1;
            mix *= 0.65 + this.masterBeat * 0.34;
            mix *= 0.45 + this.masterOpacity * 0.65;
            mix *= this.masterEffectIntensity * (0.68 + this.boardEnergy * 0.48);
            mix *= 0.82 + this.blendSoftness * 0.28;
            mix *= this.manualCrescendoBoost(name);
            if (this.softEyeActive) {
                const E = window.GlitchEngine;
                if (E && E.softPaintK) mix *= E.softPaintK(name, this.softEyeK);
                if (E && E.softCap) mix = E.softCap(name, mix, this.softEyeK);
            }
            if (this.ghostModeIndex > 0) mix *= 0.82 + this.ghostLevel * 0.2;
            if (this.aiWarpActive) mix *= 0.88 + this.aiWarpStrength * 0.12;
            return Math.max(0, Math.min(1.15, mix));
        }

        applyMasterFilters() {
            const filters = [];
            const E = window.GlitchEngine;
            const bwStrength = this.liveAlpha('B&W Invert') * this.manualCrescendoBoost('B&W Invert') * this.masterOpacity * this.sizeFor('B&W Invert') * (0.35 + this.depthFor('B&W Invert') * 0.65);
            if (bwStrength > 0.008) {
                if (E && E.bwInvertCssParts) filters.push(...E.bwInvertCssParts(bwStrength));
                else filters.push(`grayscale(${Math.min(1, bwStrength / 0.75)}) invert(${Math.max(0, (bwStrength - 0.5) / 0.5)})`);
            }
            const hueStrength = this.liveAlpha('Hue/Color Cycle') * this.manualCrescendoBoost('Hue/Color Cycle') * this.masterOpacity;
            if (hueStrength > 0.008) {
                const hueMap = E && E.hueCycleMap ? E.hueCycleMap(hueStrength, this.boardContext()) : { hueDeg: hueStrength * 360, sat: 1, contrast: 1 };
                const cycleSize = this.sizeFor('Hue/Color Cycle'), cycleDepth = this.depthFor('Hue/Color Cycle');
                filters.push(`hue-rotate(${(hueMap.hueDeg * cycleSize).toFixed(2)}deg) saturate(${(1 + ((hueMap.sat || 1) - 1) * (0.35 + cycleDepth * 0.9)).toFixed(3)}) contrast(${(1 + ((hueMap.contrast || 1) - 1) * (0.35 + cycleDepth * 0.9)).toFixed(3)})`);
            }
            if (this.hardLightActive) filters.push('contrast(1.08) saturate(1.12)');
            const value = filters.length > 0 ? filters.join(' ') : 'none';
            const container = document.getElementById('glitch-container');
            if (container) container.style.filter = value;
        }

        ensureBuffers(needs = {}) {
            const w = this.canvas.width;
            const h = this.canvas.height;
            if (!w || !h) return;
            const requested = [];
            if (needs.ghost) requested.push(this.ghostCanvas);
            if (needs.ghostFx) requested.push(this.ghostFxCanvas);
            if (needs.work) requested.push(this.workCanvas);
            requested.forEach((canvas) => {
                if (canvas && (canvas.width !== w || canvas.height !== h)) {
                    canvas.width = w;
                    canvas.height = h;
                }
            });
        }

        stampBackground(gctx, w, h) {
            const custom = document.getElementById('bg-custom');
            const hue = document.getElementById('hue-bg');
            const src = (custom && custom.style.display !== 'none' && custom.width) ? custom : hue;
            if (!src) return;
            try { gctx.drawImage(src, 0, 0, w, h); } catch (e) {}
        }

        captureGlitchSource(targetCanvas, targetCtx, w, h) {
            const scale = Math.min(1, 1280 / Math.max(1, w), 720 / Math.max(1, h));
            const sampleW = Math.max(1, Math.round(w * scale));
            const sampleH = Math.max(1, Math.round(h * scale));
            if (targetCanvas.width !== sampleW || targetCanvas.height !== sampleH) {
                targetCanvas.width = sampleW;
                targetCanvas.height = sampleH;
            }
            targetCtx.clearRect(0, 0, sampleW, sampleH);
            this.stampBackground(targetCtx, sampleW, sampleH);
            try { targetCtx.drawImage(this.canvas, 0, 0, sampleW, sampleH); } catch (e) {}
            return { width: sampleW, height: sampleH, scaleX: sampleW / w, scaleY: sampleH / h };
        }

        mergeConfluence(gctx, w, h) {
            const vhs = this.liveAlpha('VHS Glitch');
            const bands = this.liveAlpha('Data Bands');
            const scan = this.liveAlpha('Scanlines');
            const bomb = this.liveAlpha('Data Bomb');
            const hue = this.liveAlpha('Hue/Color Cycle');
            const rainbow = this.liveAlpha('HSL Rainbow');
            const neon = this.liveAlpha('Neon Grad');
            const ghostOn = this.ghostModeIndex > 0 ? this.ghostLevel : 0;
            const warp = this.aiWarpActive ? this.aiWarpStrength : 0;
            // Plain ASCII is a self-contained cached overlay; do not invoke the full-frame compositor for it.
            const mix = vhs + bands + scan + bomb + hue + rainbow + neon + ghostOn + warp;
            if (mix < 0.04) return;

            this.ensureBuffers({ work: true });
            if (!this.workCanvas || !this.workCanvas.width) return;
            this.workCtx.clearRect(0, 0, this.workCanvas.width, this.workCanvas.height);
            this.workCtx.drawImage(this.canvas, 0, 0);

            const split = (8 + vhs * 18 + ghostOn * 14 + warp * 16) * (0.45 + this.masterBeat);
            gctx.save();
            gctx.globalCompositeOperation = 'screen';
            gctx.globalAlpha = Math.min(0.28, (0.045 + (vhs + hue + rainbow) * 0.09) * (0.55 + this.blendSoftness * 0.75));
            try {
                gctx.drawImage(this.workCanvas, split, 0);
                gctx.drawImage(this.workCanvas, -split, 0);
            } catch (e) {}
            gctx.restore();

            const shearEnergy = bands + bomb + scan;
            if (shearEnergy > 0.04) {
                const shears = Math.min(18, 3 + Math.floor(shearEnergy * 8));
                gctx.save();
                for (let i = 0; i < shears; i++) {
                    const y = ((i * 97 + this.customTime * 0.08) % h);
                    const bh = 3 + (bomb + bands) * 16;
                    const dx = Math.sin(this.customTime * 0.004 + i * 1.7) * (18 + bands * 28 + warp * 22);
                    gctx.globalAlpha = 0.35 + this.masterBeat * 0.2;
                    try { gctx.drawImage(this.workCanvas, 0, y, this.workCanvas.width, bh, dx, y, w, bh); } catch (e) {}
                }
                gctx.restore();
            }

            if (neon + rainbow + hue > 0.15) {
                gctx.save();
                gctx.globalCompositeOperation = 'overlay';
                gctx.globalAlpha = Math.min(0.35, 0.1 + (neon + rainbow + hue) * 0.12);
                const grd = gctx.createLinearGradient(0, 0, w, h);
                const hv = (this.customTime * 0.05 + hue * 180) % 360;
                grd.addColorStop(0, `hsla(${hv}, 100%, 55%, 1)`);
                grd.addColorStop(0.5, `hsla(${(hv + 120) % 360}, 100%, 50%, 1)`);
                grd.addColorStop(1, `hsla(${(hv + 240) % 360}, 100%, 55%, 1)`);
                gctx.fillStyle = grd;
                gctx.fillRect(0, 0, w, h);
                gctx.restore();
            }
        }

        mainRenderLoop() {
            this.isLooping = true;
            try {
            const now = performance.now();
            const deltaTime = now - this.lastFrameTime;
            this.lastFrameTime = now;

            this.timeScale = window.__glitchSpeed !== undefined ? window.__glitchSpeed : 1.0;
            this.tickConfluence(deltaTime);
            const dataBombStrength = this.confluenceStrength('Data Bomb');
            const vhsPull = this.liveAlpha('VHS Glitch') * 0.12 + this.liveAlpha('Data Bands') * 0.08;
            const effectiveTimeScale = this.timeScale * this.motionScale * (1.0 - dataBombStrength * 0.75) * (1.0 + vhsPull * Math.sin(this.customTime * 0.004));
            this.customTime += deltaTime * effectiveTimeScale;
            this.masterBeat = (Math.sin(this.customTime / 200) + 1) / 2;
            this.masterBeat = (this.masterBeat + 0.35 * Math.sin(this.customTime / 73 + this.liveAlpha('Hue/Color Cycle') * 4)) * 0.5
                + 0.5 * (0.5 + 0.5 * Math.sin(this.customTime / 410));
            this.updateSoftEye(now, deltaTime);
            this.updateAutoGlitch(now);

            const dpr = window.devicePixelRatio || 1;
            const cssW = this.canvas.offsetWidth || window.innerWidth;
            const cssH = this.canvas.offsetHeight || window.innerHeight;
            const ghostOn = this.ghostModeIndex > 0 && this.ghostLevel > 0.01;
            const warpOn = !!this.aiWarpActive && this.aiWarpStrength > 0.01;
            this.gctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.gctx.save();
            this.gctx.scale(dpr, dpr);

            const anyFx = Object.keys(this.effectEnabled).some((n) => this.effectEnabled[n]);
            if (anyFx) {
                this.gctx.save();
                this.gctx.globalAlpha = 0.16 + this.masterOpacity * 0.1;
                this.gctx.fillStyle = '#000';
                this.gctx.fillRect(0, 0, cssW, cssH);
                this.gctx.restore();
            }

            this.activeEffects.forEach((fn) => {
                try { fn(this.gctx); } catch (err) { console.warn('effect', err); }
            });
            try { this.mergeConfluence(this.gctx, cssW, cssH); } catch (err) { console.warn('merge', err); }
            try { this.renderSoftEyeBurst(this.gctx, cssW, cssH); } catch (err) { console.warn('soft-eye burst', err); }
            this.gctx.restore();

            // Allocate/copy full-resolution ghost buffers only when an active Ghost/V-Sync mode consumes them.
            const ghostNeedsFrame = (this.ghostModeIndex > 0 && this.ghostLevel > 0.01)
                || (this.vsyncModeIndex > 0 && this.vsyncLevel > 0.005);
            if (ghostNeedsFrame) {
                this.ensureBuffers({ ghost: true, ghostFx: this.ghostModeIndex > 0 && this.ghostLevel > 0.01 });
                this.ghostCtx.drawImage(this.canvas, 0, 0);
            }
            try { this.renderGhostProtocol(now); } catch (err) { console.warn('ghost', err); }
            try { this.renderVsync(now); } catch (err) { console.warn('vsync', err); }
            try { this.renderAiWarp(now); } catch (err) { console.warn('warp', err); }
            try { this.updateAiWarpSvg(now); } catch (err) { console.warn('warpSvg', err); }
            try { this.applyMasterFilters(); } catch (err) { console.warn('filters', err); }
            } catch (err) {
                console.warn('frame', err);
            }
            requestAnimationFrame(() => this.mainRenderLoop());
        }

        buildFactories() {
            return {
            asciiArt: (getStrength) => {
                // Keep text painting off the main frame path: render a small cached ASCII layer at ~6 FPS.
                const glyphs = Array.from('01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+-=[]{}<>?/\\|░▒▓█▄▀■□△▲▽▼◆◇○●');
                const asciiCanvas = document.createElement('canvas');
                const asciiCtx = asciiCanvas.getContext('2d');
                let cachedKey = '';
                let samples = [];
                let lastPaintAt = -1;
                let nextRainAt = 0;
                let rainColumns = [];
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0.01 || !asciiCtx) return;
                    const sizeScale = this.sizeFor('ASCII');
                    const depth = this.depthFor('ASCII');
                    const viewW = this.canvas.offsetWidth || this.canvas.width || window.innerWidth;
                    const viewH = this.canvas.offsetHeight || this.canvas.height || window.innerHeight;
                    const layerScale = Math.min(1, 1280 / Math.max(1, viewW), 720 / Math.max(1, viewH));
                    const layerW = Math.max(1, Math.round(viewW * layerScale));
                    const layerH = Math.max(1, Math.round(viewH * layerScale));
                    if (asciiCanvas.width !== layerW || asciiCanvas.height !== layerH) {
                        asciiCanvas.width = layerW;
                        asciiCanvas.height = layerH;
                        cachedKey = '';
                        lastPaintAt = -1;
                    }
                    const cssCell = Math.max(8, (11 + (1 - strength) * 10) * sizeScale);
                    const wanted = Math.max(48, Math.min(560, Math.ceil((viewW / cssCell) * (viewH / cssCell))));
                    const aspect = layerW / Math.max(1, layerH);
                    const cols = Math.max(1, Math.floor(Math.sqrt(wanted * aspect)));
                    const rows = Math.max(1, Math.ceil(wanted / cols));
                    const key = `${layerW}:${layerH}:${cols}:${rows}:${Math.floor(wanted / 64)}:${sizeScale.toFixed(2)}`;
                    const gridChanged = key !== cachedKey;
                    if (gridChanged) {
                        cachedKey = key;
                        samples = [];
                        for (let row = 0; row < rows && samples.length < wanted; row++) {
                            for (let col = 0; col < cols && samples.length < wanted; col++) {
                                samples.push({ x: (col + 0.5) * layerW / cols, y: (row + 0.5) * layerH / rows });
                            }
                        }
                    }
                    const wallNow = performance.now();
                    const repaint = gridChanged || lastPaintAt < 0 || wallNow - lastPaintAt >= 150;
                    if (repaint) {
                        rainColumns = rainColumns.filter((column) => wallNow - column.startedAt < column.life && column.headY < viewH + 120);
                        if (wallNow >= nextRainAt) {
                            const count = Math.min(Math.max(0, 4 - rainColumns.length), 2 + Math.floor(Math.random() * 3));
                            for (let i = 0; i < count; i++) rainColumns.push({
                                x: Math.random() * viewW, startedAt: wallNow, speed: 190 + Math.random() * 230,
                                length: 6 + Math.floor(Math.random() * 6), hue: Math.random() * 360,
                                headY: 0, size: Math.max(10, Math.min(22, (14 + depth * 6) * sizeScale)),
                                life: 2000 + Math.random() * 1200
                            });
                            nextRainAt = wallNow + 9000 + Math.random() * 9000;
                        }
                        rainColumns.forEach((column) => { column.headY = (wallNow - column.startedAt) * column.speed / 1000; });
                        asciiCtx.clearRect(0, 0, layerW, layerH);
                        asciiCtx.textAlign = 'center';
                        asciiCtx.textBaseline = 'middle';
                        asciiCtx.globalCompositeOperation = 'source-over';
                        asciiCtx.shadowBlur = 0;
                        asciiCtx.font = `bold ${Math.max(6, Math.min(22, cssCell * layerScale * 0.82))}px monospace`;
                        const rainbow = this.liveAlpha('HSL Rainbow') > 0.02;
                        const gridPaintCap = Math.min(300, samples.length);
                        for (let slot = 0; slot < gridPaintCap; slot++) {
                            if (Math.random() < 0.08) continue;
                            const i = Math.min(samples.length - 1, Math.floor((slot + Math.random()) * samples.length / gridPaintCap));
                            const sample = samples[i];
                            const hue = rainbow ? (this.rainbowHue(sample.x / layerScale + sample.y / layerScale * 0.35) ?? 0) : Math.random() * 360;
                            asciiCtx.fillStyle = `hsla(${hue},100%,72%,${Math.min(0.95, 0.84 * strength * (0.36 + depth * 0.64))})`;
                            asciiCtx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], sample.x, sample.y);
                        }
                        if (rainColumns.length) {
                            asciiCtx.font = `bold ${Math.max(6, Math.min(18, Math.max(10, cssCell * 0.82) * layerScale))}px monospace`;
                            for (const column of rainColumns) {
                                for (let i = 0; i < column.length; i++) {
                                    const y = column.headY - i * column.size;
                                    if (y < -column.size || y > viewH + column.size) continue;
                                    const hue = rainbow ? (this.rainbowHue(column.x + i * 19) ?? column.hue) : column.hue;
                                    asciiCtx.fillStyle = `hsla(${hue},100%,${i === 0 ? 84 : 56}%,${i === 0 ? 0.98 : Math.max(0.12, 0.82 * (1 - i / column.length))})`;
                                    asciiCtx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], column.x * layerScale, y * layerScale);
                                }
                            }
                        }
                        lastPaintAt = wallNow;
                    }
                    gctx.save();
                    gctx.globalCompositeOperation = 'difference';
                    gctx.globalAlpha = 0.94;
                    gctx.imageSmoothingEnabled = false;
                    gctx.drawImage(asciiCanvas, 0, 0, viewW, viewH);
                    gctx.restore();
                };
            },

            fontBurn: (getStrength) => {
                const phrases = [
                    'GL1TCH//BURN', 'F34R.COMM4', 'GHOST IN THE SHELL', 'DATA//OVERFLOW',
                    'IMMORTAL IMP', 'SIGNAL LOST', 'NEON REBIRTH', 'C0DEX', 'VOIDLOOP',
                    '404: NOT FOUND', 'D1G1T4L R3B1RTH', 'MEMORY LEAK', 'BLACK ICE',
                    'SYNTHWAVE', 'PHOSPHOR DREAM', 'REPLICANT', 'GHOST-KEY',
                    'FREQUENCY SHIFT', 'SYSTEM//AWAKE', 'NO SIGNAL / STILL HERE',
                    'NULL-0XF947', 'THE WIRED', 'BURN CODEX', 'DARKNET UPLINK',
                    'ANOMALY DETECTED', 'PIXEL AFTERIMAGE', 'ZERO ALL / REBIRTH'
                ];
                const fonts = ['Impact', 'Arial Black', 'Courier New', 'Georgia', 'Trebuchet MS', 'Verdana'];
                const burns = [];
                let nextSpawnAt = 0;
                let releaseAt = 0;
                return (gctx) => {
                    const strength = getStrength();
                    const now = this.customTime;
                    const w = this.canvas.offsetWidth || window.innerWidth;
                    const h = this.canvas.offsetHeight || window.innerHeight;
                    const sizeScale = this.sizeFor('Font Burn');
                    const depth = this.depthFor('Font Burn');
                    const active = !!this.effectEnabled['Font Burn'] && strength > 0.015;
                    if (active) {
                        releaseAt = 0;
                        const interval = 2850 - Math.min(1150, strength * 800);
                        if (now >= nextSpawnAt && burns.length < 4) {
                            for (let j = 0; j < 1 && burns.length < 4; j++) {
                                const text = phrases[(Math.random() * phrases.length) | 0];
                                const minDim = Math.min(w, h);
                                const nominal = (42 + Math.random() * 58 + strength * 24) * sizeScale;
                                const fontSize = Math.max(Math.min(42 * sizeScale, minDim * 0.19), Math.min(nominal, minDim * 0.34));
                                const E = window.GlitchEngine;
                                const hues = E && E.ghostKeyMeta ? E.ghostKeyMeta().hues : [313, 270, 145];
                                const cycle = this.liveAlpha('Hue/Color Cycle');
                                const hue = (cycle > 0.03 ? (cycle * 360 + Math.random() * 46) : hues[(Math.random() * 3) | 0]) + this.seedHue('Font Burn') * 0.32;
                                burns.push({
                                    text, font: fonts[(Math.random() * fonts.length) | 0], size: fontSize,
                                    x: w * (0.12 + Math.random() * 0.76), y: h * (0.16 + Math.random() * 0.68),
                                    hue, created: now, life: 6200 + Math.random() * 4800,
                                    drift: (Math.random() - 0.5) * (14 + depth * 20),
                                    tilt: (Math.random() - 0.5) * 0.095,
                                    seed: Math.random() * Math.PI * 2,
                                    offAt: 0, accent: Math.random() < 0.5 ? 1 : 2
                                });
                            }
                            nextSpawnAt = now + interval * (0.72 + Math.random() * 0.72);
                        }
                    } else if (!releaseAt && burns.length) {
                        releaseAt = now + 620;
                        burns.forEach(b => { if (!b.offAt) b.offAt = now; });
                    }
                    gctx.save();
                    gctx.textAlign = 'center';
                    gctx.textBaseline = 'middle';
                    gctx.globalCompositeOperation = 'screen';
                    for (let i = burns.length - 1; i >= 0; i--) {
                        const b = burns[i];
                        const progress = Math.max(0, Math.min(1, (now - b.created) / b.life));
                        if (progress >= 1 || (b.offAt && now >= releaseAt)) { burns.splice(i, 1); continue; }
                        const envelope = Math.pow(Math.sin(Math.PI * progress), 0.42);
                        const offFade = b.offAt ? Math.max(0, 1 - (now - b.offAt) / 620) : 1;
                        if (offFade <= 0.01) { burns.splice(i, 1); continue; }
                        const pulse = 0.90 + 0.10 * Math.sin(now * 0.003 + b.seed);
                        const alpha = Math.min(0.92, (0.34 + strength * 0.55) * envelope * pulse * offFade);
                        const grow = 0.88 + 0.20 * Math.sin(Math.PI * progress);
                        const x = b.x + Math.sin(now * 0.0012 + b.seed) * b.drift * progress;
                        const y = b.y - (progress - 0.5) * 16 * sizeScale;
                        const px = b.size * grow;
                        gctx.save();
                        gctx.translate(x, y);
                        gctx.rotate(b.tilt + Math.sin(now * 0.0015 + b.seed) * 0.012 * depth);
                        gctx.font = `900 ${px.toFixed(0)}px "${b.font}", "Courier New", sans-serif`;
                        const maxWidth = Math.max(80, w * (0.88 - depth * 0.08));
                        const blur = 8 + depth * 30 + strength * 16;
                        // Deep chromatic underprint + warm core gives the burn a readable layered edge.
                        gctx.globalAlpha = alpha * (0.24 + depth * 0.34);
                        gctx.shadowColor = `hsla(${(b.hue + 188) % 360},100%,58%,0.95)`;
                        gctx.shadowBlur = blur * 0.72;
                        gctx.fillStyle = `hsla(${(b.hue + 188) % 360},100%,61%,1)`;
                        gctx.fillText(b.text, -2 - depth * 5, 1 + depth * 2, maxWidth);
                        gctx.globalAlpha = alpha;
                        gctx.shadowColor = `hsla(${b.hue},100%,66%,0.98)`;
                        gctx.shadowBlur = blur;
                        gctx.fillStyle = `hsla(${b.hue},88%,${58 + envelope * 27}%,1)`;
                        gctx.fillText(b.text, 0, 0, maxWidth);
                        gctx.restore();
                    }
                    gctx.restore();
                };
            },

            neonGradient: (getStrength) => {
                const baseHue = Math.random() * 360;
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0.01) return;
                    const w = Math.max(1, this.canvas.offsetWidth), h = Math.max(1, this.canvas.offsetHeight);
                    const E = window.GlitchEngine, ctx = this.boardContext();
                    const wildK = this.softEyeActive ? this.softEyeK : 0.35 + this.masterBeat * 0.35;
                    const map = E && E.neonAuroraMap ? E.neonAuroraMap(strength, ctx, wildK, this.masterBeat) : null;
                    const ribbonCount = map ? map.ribbons : 2;
                    const hue0 = ((this.rainbowHue(0) ?? baseHue + this.customTime * 0.035) + this.seedHue('Neon Grad') * 0.28) % 360;
                    const flow = map ? map.flow : 12 + strength * 25;
                    const spread = map ? map.hueSpread : 42;
                    const sizeScale = this.sizeFor('Neon Grad'), depth = this.depthFor('Neon Grad');
                    const halfWidth = (map ? map.width : 0.25) * Math.min(w, h) * sizeScale;
                    const angle = ((this.customTime * 0.001 * (map ? map.angleRate : 1.8)) % 360) * Math.PI / 180;
                    gctx.save();
                    gctx.globalCompositeOperation = map ? map.blend : 'screen';
                    gctx.globalAlpha = Math.min(0.55, strength * (map ? map.veil * 2.2 : 0.30) * (0.38 + depth * 0.72));
                    for (let r = 0; r < ribbonCount; r++) {
                        const hue = (hue0 + r * spread + 360) % 360;
                        const centerY = h * (0.28 + r * (0.44 / Math.max(1, ribbonCount - 1)));
                        const grad = gctx.createLinearGradient(0, centerY - halfWidth, w, centerY + halfWidth);
                        grad.addColorStop(0, `hsla(${hue},95%,58%,0)`);
                        grad.addColorStop(0.3, `hsla(${hue},100%,66%,0.72)`);
                        grad.addColorStop(0.55, `hsla(${(hue + 36) % 360},100%,72%,0.82)`);
                        grad.addColorStop(1, `hsla(${(hue + 100) % 360},95%,52%,0)`);
                        gctx.save(); gctx.translate(w / 2, h / 2); gctx.rotate(angle + r * 0.22); gctx.translate(-w / 2, -h / 2);
                        gctx.beginPath();
                        for (let x = -w * 0.1; x <= w * 1.1; x += Math.max(8, w / 48)) {
                            const y = centerY + Math.sin(x / Math.max(1, w) * Math.PI * (1.3 + r * 0.2) + this.customTime * 0.001 * flow * 0.08 + r) * halfWidth * 0.54;
                            if (x < -w * 0.1 + 1) gctx.moveTo(x, y); else gctx.lineTo(x, y);
                        }
                        gctx.strokeStyle = grad; gctx.lineWidth = 2 + strength * (5 + r * 2); gctx.shadowColor = `hsla(${hue},100%,62%,0.9)`; gctx.shadowBlur = 6 + depth * (12 + strength * 30); gctx.stroke();
                        gctx.restore();
                    }
                    const glow = gctx.createRadialGradient(w * 0.5, h * 0.52, 0, w * 0.5, h * 0.52, Math.max(w, h) * 0.58);
                    glow.addColorStop(0, `hsla(${(hue0 + this.customTime * 0.01) % 360},90%,56%,${0.10 * strength})`);
                    glow.addColorStop(1, 'rgba(0,0,0,0)'); gctx.globalCompositeOperation = 'screen'; gctx.globalAlpha = 0.75; gctx.fillStyle = glow; gctx.fillRect(0, 0, w, h);
                    gctx.restore();
                };
            },

            scanlines: (getStrength) => {
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0) return;
                    const hue = this.liveAlpha('Hue/Color Cycle');
                    const vhs = this.liveAlpha('VHS Glitch');
                    const yOffset = this.masterBeat * (5 + vhs * 18) * strength + Math.sin(this.customTime * 0.003) * 6 * strength;
                    const sizeScale = this.sizeFor('Scanlines'), depth = this.depthFor('Scanlines');
                    const lineHeight = Math.max(1, Math.round((1 + strength * (1.5 + this.liveAlpha('Data Bomb') * 3)) * sizeScale));
                    const lineGap = Math.max(1, Math.round((3 + (1 - strength) * (4 - vhs * 2)) / (0.65 + sizeScale * 0.35)));
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = Math.min(0.72, strength * (0.28 + this.liveAlpha('HSL Rainbow') * 0.2) * (0.34 + depth * 0.76));
                    gctx.fillStyle = `hsl(${(190 + hue * 160 + this.customTime * 0.04) % 360}, 85%, 62%)`;
                    for (let y = yOffset % (lineHeight + lineGap); y < this.canvas.offsetHeight; y += lineHeight + lineGap) {
                        gctx.fillRect(0, y, this.canvas.offsetWidth, lineHeight);
                    }
                    gctx.restore();
                };
            },

            vhs: (getStrength) => {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0.01) return;
                    const w = this.canvas.offsetWidth || this.canvas.width || window.innerWidth;
                    const h = this.canvas.offsetHeight || this.canvas.height || window.innerHeight;
                    const source = this.captureGlitchSource(tempCanvas, tempCtx, w, h);
                    const sizeScale = this.sizeFor('Data Bands');
                    const depth = this.depthFor('Data Bands');
                    const count = Math.min(20, Math.max(7, Math.round(6 + strength * 10 + depth * 4)));
                    const hue = (this.seedHue('Data Bands') + this.customTime * (0.018 + depth * 0.025)) % 360;
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    for (let i = 0; i < count; i++) {
                        const phase = this.customTime * (0.0007 + strength * 0.0008) + i * 2.17;
                        const bandH = Math.max(4, Math.min(34, Math.round((5 + Math.random() * 8) * sizeScale * (0.52 + depth * 0.65))));
                        const bandW = Math.max(24, w * (0.28 + Math.random() * 0.68));
                        const sx = Math.random() * Math.max(1, w - bandW);
                        const y = Math.max(0, Math.min(h - bandH, (i * h / count + Math.sin(phase) * h * 0.025 + h) % h));
                        const dx = Math.sin(phase * 1.7) * (4 + sizeScale * 8 + strength * (10 + depth * 18))
                            + (Math.random() - 0.5) * depth * 10;
                        gctx.globalAlpha = Math.min(0.52, 0.12 + strength * (0.18 + depth * 0.16));
                        try { gctx.drawImage(tempCanvas, sx * source.scaleX, y * source.scaleY, bandW * source.scaleX, bandH * source.scaleY, sx + dx, y, bandW, bandH); } catch (e) {}
                        gctx.globalAlpha *= 0.52;
                        gctx.fillStyle = `hsla(${(hue + i * 17) % 360},100%,68%,0.72)`;
                        gctx.fillRect(sx + dx, y, bandW, Math.max(1, Math.round(bandH * 0.09)));
                    }
                    // Sparse analog-like dust, bounded independently of canvas size.
                    gctx.globalCompositeOperation = 'overlay';
                    gctx.globalAlpha = Math.min(0.28, strength * (0.08 + depth * 0.12));
                    for (let i = 0; i < 8 + Math.round(strength * 20); i++) {
                        const x = Math.random() * w;
                        const y = Math.random() * h;
                        const speck = 1 + Math.random() * (1 + sizeScale);
                        gctx.fillStyle = `hsla(${hue},45%,${65 + Math.random() * 30}%,0.65)`;
                        gctx.fillRect(x, y, speck, speck);
                    }
                    gctx.restore();
                };
            },

            vhsGlitch: (getStrength) => {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0.01) return;
                    const w = this.canvas.offsetWidth || this.canvas.width || window.innerWidth;
                    const h = this.canvas.offsetHeight || this.canvas.height || window.innerHeight;
                    const source = this.captureGlitchSource(tempCanvas, tempCtx, w, h);
                    const sizeScale = this.sizeFor('VHS Glitch');
                    const depth = this.depthFor('VHS Glitch');
                    const sliceCount = Math.min(42, Math.max(12, Math.round(16 + strength * 24)));
                    const sliceHeight = Math.max(2, Math.ceil(h / sliceCount));
                    const amplitude = (5 + sizeScale * 8 + depth * 14) * strength;
                    const t = this.customTime;
                    gctx.save();
                    gctx.globalCompositeOperation = 'source-over';
                    gctx.globalAlpha = Math.min(0.52, 0.12 + strength * (0.22 + depth * 0.14));
                    for (let y = 0, band = 0; y < h; y += sliceHeight, band++) {
                        const bh = Math.min(sliceHeight, h - y);
                        const wave = Math.sin(y / Math.max(8, 18 / sizeScale) + t / (105 / sizeScale)) * amplitude;
                        const tear = Math.random() < 0.05 + strength * 0.10
                            ? (Math.random() - 0.5) * (18 + depth * 34) * sizeScale : 0;
                        const dx = wave + tear + (band % 9 === 0 ? Math.sin(t * 0.009 + band) * (4 + depth * 12) : 0);
                        const sourceY = y * source.scaleY;
                        const sourceH = Math.min(bh * source.scaleY, source.height - sourceY);
                        if (sourceH > 0) {
                            try { gctx.drawImage(tempCanvas, 0, sourceY, source.width, sourceH, dx, y, w, bh); } catch (e) {}
                        }
                    }
                    // A few displaced chroma echoes and a fixed-size scan texture sell the tape tear.
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = Math.min(0.22, 0.035 + strength * (0.08 + depth * 0.07));
                    const echoCount = Math.min(6, 2 + Math.round(strength * 4));
                    for (let i = 0; i < echoCount; i++) {
                        const y = (i * h / echoCount + t * (0.012 + strength * 0.018)) % h;
                        const bh = Math.max(2, Math.min(sliceHeight * 2, Math.round((4 + sizeScale * 7) * (0.65 + depth))));
                        const dx = (i % 2 ? 1 : -1) * (2 + sizeScale * 3 + depth * 7) * strength;
                        const sourceY = y * source.scaleY;
                        const sourceH = Math.min(bh * source.scaleY, source.height - sourceY);
                        if (sourceH > 0) {
                            try { gctx.drawImage(tempCanvas, 0, sourceY, source.width, sourceH, dx, y, w, bh); } catch (e) {}
                        }
                        gctx.fillStyle = i % 2 ? 'rgba(50,230,255,0.42)' : 'rgba(255,55,135,0.42)';
                        gctx.fillRect(dx, y, w, 1);
                    }
                    gctx.globalCompositeOperation = 'multiply';
                    gctx.globalAlpha = Math.min(0.17, strength * (0.035 + depth * 0.07));
                    gctx.fillStyle = '#07111a';
                    const scanCount = 48;
                    for (let i = 0; i < scanCount; i++) {
                        const y = (i * h / scanCount + (t * 0.018) % (h / scanCount)) % h;
                        gctx.fillRect(0, y, w, Math.max(1, h / 900));
                    }
                    gctx.restore();
                };
            },

            brightFlash: (getStrength) => {
                let nextFlashAt = 0;
                return (gctx) => {
                    const strength = getStrength();
                    const depth = this.depthFor('Flash');
                    const wallNow = performance.now();
                    if (strength <= 0.02 || wallNow < nextFlashAt) return;
                    if (Math.random() > Math.min(0.48, strength * 0.36)) return;
                    // Revision 3 burst envelope: wall-clock spacing stays safe even at high motion scale.
                    nextFlashAt = wallNow + 520 + Math.random() * 980;
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = Math.min(0.20, (0.025 + Math.random() * (0.07 + this.liveAlpha('Strobe') * 0.035)) * strength * (0.30 + depth * 0.70));
                    const w = this.canvas.offsetWidth, h = this.canvas.offsetHeight;
                    const sizeScale = this.sizeFor('Flash');
                    const hue = (Math.random() * 360 + this.liveAlpha('Hue/Color Cycle') * 180) % 360;
                    const x = w * (0.2 + Math.random() * 0.6), y = h * (0.2 + Math.random() * 0.6);
                    const radius = Math.min(w, h) * (0.14 + sizeScale * 0.22);
                    const glow = gctx.createRadialGradient(x, y, 0, x, y, radius);
                    glow.addColorStop(0, `hsla(${hue},82%,${72 + this.masterBeat * 12}%,1)`);
                    glow.addColorStop(0.45, `hsla(${(hue + 32) % 360},78%,68%,0.55)`);
                    glow.addColorStop(1, `hsla(${hue},70%,60%,0)`);
                    gctx.fillStyle = glow;
                    gctx.fillRect(0, 0, w, h);
                    gctx.restore();
                };
            },

            hslRainbow: (getStrength) => {
                const start = this.customTime;
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0.01) return;
                    const depth = this.depthFor('HSL Rainbow');
                    const sizeScale = this.sizeFor('HSL Rainbow');
                    const w = this.canvas.offsetWidth, h = this.canvas.offsetHeight;
                    const E = window.GlitchEngine;
                    const ctx = this.boardContext();
                    const map = E && E.hslRainbowMap ? E.hslRainbowMap(strength, ctx) : { hueDeg: 0, hueStops: 5, satPct: 90, lightPct: 58 };
                    const softK = this.softEyeActive ? this.softEyeK : 0.35;
                    const spinK = E && E.softChromaSpin ? E.softChromaSpin(softK, this.masterBeat) : 1;
                    const hue = (map.hueDeg * sizeScale + this.seedHue('HSL Rainbow') * 0.30 + (this.customTime - start) * 0.035 * spinK + this.liveAlpha('Hue/Color Cycle') * 60) % 360;
                    const grad = gctx.createLinearGradient(0, 0, w * (0.35 + 0.65 * Math.sin(this.customTime * 0.0003)), h);
                    const stops = Math.max(3, Math.min(7, map.hueStops || 5));
                    for (let i = 0; i < stops; i++) {
                        const t = i / (stops - 1), hh = (hue + t * 360) % 360;
                        grad.addColorStop(t, `hsla(${hh},${map.satPct}%,${map.lightPct + Math.sin(this.customTime * 0.001 + i) * (map.lightSwing || 12)}%,1)`);
                    }
                    gctx.save();
                    gctx.globalCompositeOperation = ctx.ghost === 'CRT' ? 'soft-light' : 'screen';
                    gctx.globalAlpha = Math.min(0.48, strength * (0.12 + this.masterBeat * 0.16) * (0.30 + depth * 0.78));
                    gctx.fillStyle = grad; gctx.fillRect(0, 0, w, h);
                    gctx.globalCompositeOperation = 'overlay'; gctx.globalAlpha *= 0.38;
                    gctx.fillStyle = `hsla(${(hue + 180) % 360},70%,52%,1)`; gctx.fillRect(0, 0, w, h);
                    gctx.restore();
                };
            },

            strobe: (getStrength) => {
                let nextPulseAt = 0;
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0.02) return;
                    const depth = this.depthFor('Strobe');
                    const sizeScale = this.sizeFor('Strobe');
                    const E = window.GlitchEngine;
                    const softK = this.softEyeActive ? this.softEyeK : 0.35;
                    const maxHz = E && E.softStrobeHz ? Math.min(2.5, E.softStrobeHz(softK)) : 1.4;
                    const now = performance.now();
                    if (now < nextPulseAt || Math.random() > strength * 0.72) return;
                    nextPulseAt = now + 1000 / Math.max(0.6, maxHz);
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = Math.min(0.17, strength * 0.13 * (0.28 + depth * 0.72));
                    const w = this.canvas.offsetWidth, h = this.canvas.offsetHeight;
                    const bandH = Math.max(8, h * (0.10 + sizeScale * 0.10));
                    const y = ((this.customTime * (0.07 + depth * 0.05)) % (h + bandH)) - bandH;
                    const hue = Math.random() * 360;
                    const pulse = gctx.createLinearGradient(0, y, 0, y + bandH);
                    pulse.addColorStop(0, `hsla(${hue},76%,72%,0)`);
                    pulse.addColorStop(0.5, `hsla(${hue},76%,72%,0.95)`);
                    pulse.addColorStop(1, `hsla(${hue},76%,72%,0)`);
                    gctx.fillStyle = pulse;
                    gctx.fillRect(0, y, w, bandH);
                    gctx.restore();
                };
            },

            geminiBomb: (getStrength) => {
                const possibleShapes = ['rect', 'circle', 'triangle', 'star', 'cross'];
                const possiblePatterns = ['solid', 'striped-h', 'striped-v'];
                const numShapes = 2 + Math.floor(Math.random() * 20);
                const shapes = [];
                for (let i = 0; i < numShapes; i++) {
                    shapes.push({
                        x: this.canvas.offsetWidth * 0.5,
                        y: this.canvas.offsetHeight * 0.5,
                        baseSize: 5 + Math.random() * 15,
                        shapeType: possibleShapes[Math.floor(Math.random() * possibleShapes.length)],
                        pattern: possiblePatterns[Math.floor(Math.random() * possiblePatterns.length)],
                        angle: Math.random() * Math.PI * 2,
                        speed: (1 + Math.random() * 8),
                        hue: Math.random() * 360
                    });
                }
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0) return;
                    const w = this.canvas.offsetWidth;
                    const h = this.canvas.offsetHeight;
                    const sizeScale = this.sizeFor('Gemini Bomb'), depth = this.depthFor('Gemini Bomb');
                    gctx.save();
                    gctx.globalCompositeOperation = 'lighter';
                    shapes.forEach((shape) => {
                        shape.x += Math.cos(shape.angle) * shape.speed * strength * this.timeScale * (0.45 + depth * 1.15);
                        shape.y += Math.sin(shape.angle) * shape.speed * strength * this.timeScale * (0.45 + depth * 1.15);
                        const currentSize = (shape.baseSize + this.masterBeat * 10) * strength * (0.35 + sizeScale * 0.82);
                        if (shape.x < 0 || shape.x > w || shape.y < 0 || shape.y > h) {
                            shape.x = w * 0.5;
                            shape.y = h * 0.5;
                            shape.angle = Math.random() * Math.PI * 2;
                            shape.speed = (1 + Math.random() * 8);
                        }
                        gctx.fillStyle = `hsla(${shape.hue}, 100%, 68%, ${Math.min(1, 0.55 * strength * (0.38 + depth * 0.82))})`;
                        gctx.shadowColor = `hsla(${shape.hue},100%,62%,0.9)`;
                        gctx.shadowBlur = 2 + depth * 14;
                        gctx.strokeStyle = gctx.fillStyle;
                        gctx.lineWidth = 1;
                        gctx.save();
                        gctx.beginPath();
                        if (shape.shapeType === 'rect') {
                            gctx.rect(shape.x - currentSize / 2, shape.y - currentSize / 2, currentSize, currentSize);
                        } else if (shape.shapeType === 'circle') {
                            gctx.arc(shape.x, shape.y, currentSize / 2, 0, Math.PI * 2);
                        } else if (shape.shapeType === 'triangle') {
                            const a0 = Math.PI / 2;
                            gctx.moveTo(shape.x + currentSize / 2 * Math.cos(a0), shape.y + currentSize / 2 * Math.sin(a0));
                            gctx.lineTo(shape.x + currentSize / 2 * Math.cos(a0 + 2 * Math.PI / 3), shape.y + currentSize / 2 * Math.sin(a0 + 2 * Math.PI / 3));
                            gctx.lineTo(shape.x + currentSize / 2 * Math.cos(a0 + 4 * Math.PI / 3), shape.y + currentSize / 2 * Math.sin(a0 + 4 * Math.PI / 3));
                        } else if (shape.shapeType === 'star') {
                            const spikes = 5;
                            const outerRadius = currentSize / 2;
                            const innerRadius = outerRadius / 2.5;
                            let rot = Math.PI / 2 * 3;
                            const step = Math.PI / spikes;
                            gctx.moveTo(shape.x, shape.y - outerRadius);
                            for (let i = 0; i < spikes; i++) {
                                gctx.lineTo(shape.x + Math.cos(rot) * outerRadius, shape.y + Math.sin(rot) * outerRadius);
                                rot += step;
                                gctx.lineTo(shape.x + Math.cos(rot) * innerRadius, shape.y + Math.sin(rot) * innerRadius);
                                rot += step;
                            }
                            gctx.lineTo(shape.x, shape.y - outerRadius);
                        } else {
                            const armWidth = currentSize / 3;
                            gctx.rect(shape.x - armWidth / 2, shape.y - currentSize / 2, armWidth, currentSize);
                            gctx.rect(shape.x - currentSize / 2, shape.y - armWidth / 2, currentSize, armWidth);
                        }
                        gctx.closePath();
                        if (shape.pattern === 'solid') {
                            gctx.fill();
                        } else {
                            gctx.clip();
                            const isVertical = shape.pattern === 'striped-v';
                            const stripeSpacing = 4;
                            const b = {
                                x1: shape.x - currentSize / 2 - stripeSpacing,
                                y1: shape.y - currentSize / 2 - stripeSpacing,
                                x2: shape.x + currentSize / 2 + stripeSpacing,
                                y2: shape.y + currentSize / 2 + stripeSpacing
                            };
                            gctx.beginPath();
                            if (isVertical) {
                                for (let x = b.x1; x < b.x2; x += stripeSpacing) {
                                    gctx.moveTo(x, b.y1);
                                    gctx.lineTo(x, b.y2);
                                }
                            } else {
                                for (let y = b.y1; y < b.y2; y += stripeSpacing) {
                                    gctx.moveTo(b.x1, y);
                                    gctx.lineTo(b.x2, y);
                                }
                            }
                            gctx.stroke();
                        }
                        gctx.restore();
                    });
                    gctx.restore();
                };
            },

            dataBomb: (getStrength) => {
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0) return;
                    const w = this.canvas.offsetWidth;
                    const h = this.canvas.offsetHeight;
                    const sizeScale = this.sizeFor('Data Bomb'), depth = this.depthFor('Data Bomb');
                    gctx.save();
                    gctx.globalCompositeOperation = 'difference';
                    const bands = 2 + Math.floor((4 + strength * (18 + this.liveAlpha('VHS Glitch') * 10 + this.liveAlpha('Scanlines') * 6)) * (0.45 + depth * 0.75));
                    for (let i = 0; i < bands; i++) {
                        const y = (Math.random() * h + Math.sin(this.customTime * 0.01 + i) * 40 * strength + h) % h;
                        const bh = (2 + Math.random() * (18 + this.liveAlpha('Data Bands') * 20) * strength) * sizeScale;
                        gctx.globalAlpha = Math.min(0.8, (0.18 + strength * (0.32 + this.masterBeat * 0.12)) * (0.25 + depth * 0.75));
                        gctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 60%, 1)`;
                        gctx.fillRect(0, y, w, bh);
                    }
                    gctx.restore();
                };
            },

            inkGlyphs: (getStrength) => {
                const particles = [];
                let lastSpawn = 0;
                const engine = () => window.GlitchEngine;
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0.01) { particles.length = 0; return; }
                    const w = this.canvas.offsetWidth || window.innerWidth;
                    const h = this.canvas.offsetHeight || window.innerHeight;
                    const sizeScale = this.sizeFor('Ink Glyphs'), depth = this.depthFor('Ink Glyphs');
                    const now = this.customTime;
                    const E = engine();
                    const realm = E && E.realmFromBoard ? E.realmFromBoard({
                        ghost: window.__getGhostMode ? window.__getGhostMode() : 'OFF',
                        vsync: window.__getVsyncMode ? window.__getVsyncMode() : 'OFF',
                        warp: this.aiWarpActive, bw: this.liveAlpha('B&W Invert')
                    }) : 'mix';
                    const maxParticles = Math.max(20, Math.min(100, Math.round(32 + depth * 68)));
                    if (now - lastSpawn > Math.max(50, 115 - strength * 55) && particles.length < maxParticles) {
                        lastSpawn = now;
                        const count = 1 + Math.floor(Math.random() * (1 + strength * (2 + depth * 4)));
                        for (let i = 0; i < count && particles.length < maxParticles; i++) {
                            particles.push({
                                x: Math.random() * w, y: Math.random() * h,
                                vx: (Math.random() - 0.5) * (14 + strength * 34),
                                vy: (Math.random() - 0.5) * (14 + strength * 34),
                                age: 0, life: (900 + Math.random() * 2200) * (0.75 + depth * 0.55),
                                size: (18 + Math.random() * 42 * strength) * sizeScale,
                                ch: E && E.pickGlyph ? E.pickGlyph(realm, Math.random, i % 3) : '※',
                                hue: E && E.ghostKeyMeta ? E.ghostKeyMeta().hues[i % 3] : (280 + i * 43) % 360,
                                spin: (Math.random() - 0.5) * 0.8
                            });
                        }
                    }
                    const dt = 16 * Math.max(0.25, this.timeScale || 1);
                    gctx.save();
                    gctx.textAlign = 'center';
                    gctx.textBaseline = 'middle';
                    gctx.globalCompositeOperation = 'screen';
                    for (let i = particles.length - 1; i >= 0; i--) {
                        const p = particles[i]; p.age += dt;
                        if (p.age >= p.life) { particles.splice(i, 1); continue; }
                        p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
                        const life = Math.sin(Math.PI * p.age / p.life);
                        const a = Math.min(0.90, strength * (0.14 + life * (0.42 + depth * 0.46)));
                        gctx.save();
                        gctx.translate(p.x, p.y);
                        gctx.rotate(p.spin * p.age * 0.001);
                        gctx.font = `bold ${p.size.toFixed(0)}px "Courier New", monospace`;
                        gctx.shadowColor = `hsla(${p.hue},100%,65%,0.9)`;
                        gctx.shadowBlur = 3 + depth * (7 + 16 * life);
                        gctx.fillStyle = `hsla(${p.hue},85%,${58 + life * 24}%,${a})`;
                        gctx.fillText(p.ch, 0, 0);
                        gctx.restore();
                    }
                    gctx.restore();
                };
            },

            matrixAscii: (getStrength) => {
                const streams = [];
                let last = 0, paintCursor = 0;
                let nextRainAt = 0, rainUntil = 0;
                const spawn = (w, h, realm, E) => {
                    const size = (13 + Math.random() * 13) * this.sizeFor('Matrix ASCII');
                    const depth = this.depthFor('Matrix ASCII');
                    const n = 7 + Math.floor(Math.random() * (5 + depth * 8));
                    const glyphs = [];
                    for (let i = 0; i < n; i++) glyphs.push(E && E.pickGlyph ? E.pickGlyph(realm, Math.random, i % 3) : '01'[i % 2]);
                    return { x: Math.random() * w, y: -Math.random() * h * Math.random(), speed: (realm === 'virtual' ? 82 : 42) * (0.5 + Math.random()),
                        size, glyphs, hue: Math.random() * 32 - 16 };
                };
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0.01) { streams.length = 0; last = 0; return; }
                    const w = this.canvas.offsetWidth || window.innerWidth;
                    const h = this.canvas.offsetHeight || window.innerHeight;
                    const E = window.GlitchEngine;
                    const realm = E && E.realmFromBoard ? E.realmFromBoard({
                        ghost: window.__getGhostMode ? window.__getGhostMode() : 'OFF',
                        vsync: window.__getVsyncMode ? window.__getVsyncMode() : 'OFF',
                        warp: this.aiWarpActive, bw: this.liveAlpha('B&W Invert')
                    }) : 'virtual';
                    const now = this.customTime;
                    const wallNow = performance.now();
                    const dt = last ? Math.min(0.05, Math.max(0.008, (now - last) / 1000)) : 0.016;
                    last = now;
                    if (wallNow >= nextRainAt) {
                        if (Math.random() < 0.72) rainUntil = wallNow + 1900 + Math.random() * 2300;
                        nextRainAt = wallNow + 6500 + Math.random() * 9500;
                    }
                    const rainBurst = wallNow < rainUntil;
                    const sizeScale = this.sizeFor('Matrix ASCII'), depth = this.depthFor('Matrix ASCII');
                    const naturalWanted = Math.round((8 + strength * (16 + depth * 14)) * (realm === 'virtual' ? 1 : 0.7) * (1.45 / sizeScale));
                    const wanted = Math.max(4, Math.min(rainBurst ? 22 : 6, naturalWanted));
                    while (streams.length < wanted) streams.push(spawn(w, h, realm, E));
                    if (streams.length > wanted) streams.length = wanted;
                    const ghost = E && E.ghostKeyMeta ? E.ghostKeyMeta() : { hues: [135, 75, 313] };
                    const baseHue = ((realm === 'reality' ? ghost.hues[0] : realm === 'virtual' ? 120 : ghost.hues[2]) + this.seedHue('Matrix ASCII') * 0.25) % 360;
                    // Hard cap text work even during Matrix rain bursts; rotate columns for even coverage.
                    for (const stream of streams) {
                        stream.y += stream.speed * dt * (0.7 + strength);
                        if (stream.y > h + 30) Object.assign(stream, spawn(w, h, realm, E));
                    }
                    gctx.save();
                    gctx.textBaseline = 'top';
                    gctx.globalCompositeOperation = realm === 'reality' ? 'source-over' : 'screen';
                    let paintBudget = 160;
                    const start = streams.length ? paintCursor % streams.length : 0;
                    for (let s = 0; s < streams.length && paintBudget > 0; s++) {
                        const stream = streams[(start + s) % streams.length];
                        const hue = (baseHue + stream.hue + this.customTime * 0.008 + 360) % 360;
                        gctx.font = `bold ${stream.size.toFixed(0)}px "Courier New", monospace`;
                        for (let i = 0; i < stream.glyphs.length && paintBudget > 0; i++) {
                            const y = stream.y + i * stream.size * 0.93;
                            if (y < -stream.size || y > h) continue;
                            if (i === 0 && Math.random() < 0.16 && E && E.pickGlyph) stream.glyphs[i] = E.pickGlyph(realm, Math.random, 0);
                            const tail = 1 - i / stream.glyphs.length;
                            const alpha = strength * (i === 0 ? 0.82 : (0.10 + tail * 0.46) * (0.26 + depth * 0.82));
                            gctx.shadowBlur = i === 0 ? 3 + depth * 9 : 0;
                            gctx.shadowColor = `hsl(${hue},100%,70%)`;
                            gctx.fillStyle = `hsla(${hue},${realm === 'reality' ? 52 : 88}%,${i === 0 ? 84 : 45 + tail * 18}%,${Math.min(0.92, alpha)})`;
                            gctx.fillText(stream.glyphs[i], stream.x, y);
                            paintBudget--;
                        }
                    }
                    if (streams.length) paintCursor = (paintCursor + 1) % streams.length;
                    gctx.shadowBlur = 0;
                    gctx.restore();
                };
            },

            matrixChord: (getStrength) => {
                const lanes = [[], [], []];
                let last = 0, nextChordAt = 0, chord = null;
                const pickChord = (realm, E) => E && E.pickMatrixChord ? E.pickMatrixChord(realm, Math.random) : { name: 'spectrum', steps: [0, 120, 240] };
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0.01) { lanes.forEach((lane) => lane.splice(0)); last = 0; return; }
                    const w = this.canvas.offsetWidth || window.innerWidth;
                    const h = this.canvas.offsetHeight || window.innerHeight;
                    const E = window.GlitchEngine;
                    const realm = E && E.realmFromBoard ? E.realmFromBoard({
                        ghost: window.__getGhostMode ? window.__getGhostMode() : 'OFF',
                        vsync: window.__getVsyncMode ? window.__getVsyncMode() : 'OFF',
                        warp: this.aiWarpActive, bw: this.liveAlpha('B&W Invert')
                    }) : 'mix';
                    const now = this.customTime;
                    const dt = last ? Math.min(0.05, Math.max(0.008, (now - last) / 1000)) : 0.016;
                    last = now;
                    if (!chord || now >= nextChordAt) { chord = pickChord(realm, E); nextChordAt = now + 6500 + Math.random() * 7000; }
                    const hues = E && E.ghostKeyMeta ? E.ghostKeyMeta().hues : [313, 270, 145];
                    const sizeScale = this.sizeFor('Matrix Chord'), depth = this.depthFor('Matrix Chord');
                    const baseHue = (hues[0] + this.seedHue('Matrix Chord') * 0.24 + this.customTime * (0.002 + depth * 0.003)) % 360;
                    const count = 3 + Math.round((4 + strength * 7) * (0.45 + depth * 0.75));
                    gctx.save();
                    gctx.textAlign = 'center';
                    gctx.textBaseline = 'middle';
                    gctx.globalCompositeOperation = realm === 'reality' ? 'source-over' : 'screen';
                    for (let tone = 0; tone < 3; tone++) {
                        const lane = lanes[tone];
                        const x0 = w * tone / 3;
                        while (lane.length < count) lane.push({ x: x0 + Math.random() * w / 3, y: Math.random() * h, v: (realm === 'virtual' ? 74 : 32) * (0.5 + Math.random()),
                            ch: E && E.pickGlyph ? E.pickGlyph(realm, Math.random, tone) : '0', size: (14 + Math.random() * 22) * sizeScale });
                        if (lane.length > count) lane.length = count;
                        const hue = (baseHue + (chord.steps[tone] || 0) + 360) % 360;
                        lane.forEach((drop) => {
                            drop.y += drop.v * dt * (0.75 + strength);
                            if (drop.y > h + 24) {
                                drop.y = -20; drop.x = x0 + Math.random() * w / 3;
                                drop.ch = E && E.pickGlyph ? E.pickGlyph(realm, Math.random, tone) : drop.ch;
                            }
                            if (Math.random() < 0.035 && E && E.pickGlyph) drop.ch = E.pickGlyph(realm, Math.random, tone);
                            gctx.font = `bold ${drop.size.toFixed(0)}px "Courier New", monospace`;
                            gctx.shadowColor = `hsla(${hue},95%,65%,0.9)`;
                            gctx.shadowBlur = (tone === 0 ? 4 : 2) + depth * (tone === 0 ? 11 : 6);
                            gctx.fillStyle = `hsla(${hue},${realm === 'virtual' ? 86 : 52}%,65%,${Math.min(0.88, strength * (tone === 0 ? 0.55 : 0.40) * (0.30 + depth * 0.78))})`;
                            gctx.fillText(drop.ch, drop.x, drop.y);
                        });
                    }
                    gctx.shadowBlur = 0;
                    gctx.restore();
                };
            },

            techArtist: (getStrength) => {
                const self = this;
                return (gctx) => {
                    const strength = getStrength();
                    if (strength <= 0) return;
                    const shader = self.initTechArtistShader();
                    if (!shader) return;
                    self.techArtistVelocity.x *= 0.92;
                    self.techArtistVelocity.y *= 0.92;
                    const sizeScale = self.sizeFor('Tech Artist'), depth = self.depthFor('Tech Artist');
                    shader.uniforms.time.value = self.customTime * 0.002 * (0.55 + depth * 0.9);
                    shader.uniforms.mouse.value.set(self.techArtistMouse.x, self.techArtistMouse.y);
                    shader.uniforms.velocity.value.set(self.techArtistVelocity.x * sizeScale, self.techArtistVelocity.y * sizeScale);
                    shader.uniforms.resolution.value.set(self.canvas.offsetWidth, self.canvas.offsetHeight);
                    shader.renderer.setSize(self.canvas.offsetWidth, self.canvas.offsetHeight, false);
                    shader.renderer.render(shader.scene, shader.camera);
                    gctx.save();
                    gctx.globalCompositeOperation = 'screen';
                    gctx.globalAlpha = Math.min(1, strength * (0.22 + depth * 0.78));
                    gctx.drawImage(shader.canvas, 0, 0, self.canvas.offsetWidth, self.canvas.offsetHeight);
                    gctx.restore();
                };
            }
            };
        }

        renderGhostProtocol(now) {
            const mode = this.ghostModes[this.ghostModeIndex] || 'OFF';
            if (mode === 'OFF' || this.ghostLevel <= 0.01) return;
            this.ensureBuffers({ ghost: true, ghostFx: true });
            const width = this.canvas.width;
            const height = this.canvas.height;
            if (!width || !height || !this.ghostCanvas.width) return;
            const t = now * 0.001;
            const s = Math.min(1, this.ghostLevel) * (0.45 + this.masterOpacity * 0.4);
            const engineProfile = window.GlitchEngine && window.GlitchEngine.ghostProfile
                ? window.GlitchEngine.ghostProfile(mode) : null;
            const modeProfile = engineProfile ? {
                split: engineProfile.split || 1,
                lines: engineProfile.lines || 1,
                glow: engineProfile.glow || 1,
                warp: engineProfile.warp || 1,
                crt: engineProfile.crt || 0,
                hue: engineProfile.hueA || 170,
                led: engineProfile.led || 0,
                dia: engineProfile.dia || 0
            } : ({
                SPECTRUM: { split: 1.0, lines: 1.0, glow: 0.85, warp: 1.0, crt: 0, hue: 170 },
                CRT:      { split: 0.65, lines: 1.5, glow: 0.6, warp: 0.45, crt: 1, hue: 95 },
                PLASMA:   { split: 1.2, lines: 0.8, glow: 1.1, warp: 1.25, crt: 0, hue: 205 },
                DIA:      { split: 0.88, lines: 0.50, glow: 0.22, warp: 0.38, crt: 0, hue: 313, dia: 1 },
                LED:      { split: 1.38, lines: 0.22, glow: 0.90, warp: 1.12, crt: 0, hue: 145, led: 1 }
            }[mode] || { split: 1, lines: 1, glow: 1, warp: 1, crt: 0, hue: 170 });
            const split = (8 + s * 22) * modeProfile.split;
            const gctx = this.gctx;

            this.ghostFxCtx.clearRect(0, 0, width, height);
            this.ghostFxCtx.globalAlpha = 1;
            this.ghostFxCtx.drawImage(this.ghostCanvas, 0, 0);

            gctx.save();
            gctx.globalCompositeOperation = 'screen';
            gctx.globalAlpha = 0.14 + s * 0.18;
            gctx.drawImage(this.ghostFxCanvas, -split, 0);
            gctx.globalAlpha = 0.1 + s * 0.14;
            gctx.drawImage(this.ghostFxCanvas, split, split * 0.12);
            if (this.liveAlpha('HSL Rainbow') > 0.02) {
                const rh = this.rainbowHue(90) || 180;
                gctx.globalAlpha = 0.08 + s * 0.1;
                gctx.fillStyle = `hsla(${rh}, 100%, 55%, 1)`;
                gctx.fillRect(0, 0, width, height);
            }

            gctx.globalCompositeOperation = 'lighter';
            gctx.globalAlpha = 0.08 + s * 0.12 * modeProfile.lines;
            const lineCount = modeProfile.crt ? 22 : 14;
            for (let i = 0; i < lineCount; i++) {
                const y = Math.floor(((i * 53) + now * 0.1) % height);
                const lh = 2 + (i % 3);
                const drift = Math.sin(t * 4 + i * 0.8) * split;
                gctx.drawImage(this.ghostFxCanvas, 0, y, width, lh, drift, y, width, lh);
            }

            gctx.globalAlpha = 0.07 + s * 0.14 * modeProfile.warp;
            const columns = modeProfile.crt ? 12 : 16;
            const colW = Math.ceil(width / columns);
            const amp = 6 + s * 28 * modeProfile.warp;
            for (let c = 0; c < columns; c++) {
                const sx = c * colW;
                const sw = Math.min(colW, width - sx);
                if (sw <= 0) continue;
                const wave = Math.sin(t * 3.6 + c * 0.55) * amp;
                gctx.drawImage(this.ghostFxCanvas, sx, 0, sw, height, sx + wave, 0, sw, height);
            }

            if (modeProfile.crt) {
                gctx.globalCompositeOperation = 'multiply';
                gctx.globalAlpha = 0.08 + s * 0.08;
                for (let y = 0; y < height; y += 3) {
                    gctx.fillStyle = 'rgba(0,15,0,0.5)';
                    gctx.fillRect(0, y, width, 1);
                }
            }

            gctx.globalCompositeOperation = 'soft-light';
            gctx.globalAlpha = 0.08 + s * 0.12 * modeProfile.glow;
            const rain = this.rainbowHue(40);
            const hue = (rain != null ? rain : modeProfile.hue + Math.sin(t * 0.7) * 24);
            const grad = gctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, `hsla(${hue % 360}, 80%, 45%, 1)`);
            grad.addColorStop(0.5, `hsla(${(hue + 120) % 360}, 80%, 42%, 1)`);
            grad.addColorStop(1, `hsla(${(hue + 240) % 360}, 75%, 38%, 1)`);
            gctx.fillStyle = grad;
            gctx.fillRect(0, 0, width, height);
            if (modeProfile.dia) {
                // DIA keeps a restrained analog double-image / prism edge.
                gctx.globalCompositeOperation = 'screen';
                gctx.globalAlpha = 0.045 + s * 0.035;
                gctx.drawImage(this.ghostFxCanvas, -split * 0.42, split * 0.18);
            }
            if (modeProfile.led) {
                // LED adds a subtle phosphor pixel lattice without a heavy full-screen filter.
                gctx.globalCompositeOperation = 'multiply';
                gctx.globalAlpha = 0.035 + s * 0.035;
                gctx.fillStyle = '#142019';
                const dpr = window.devicePixelRatio || 1;
                // Draw a sparse scan lattice with O(width + height), not one call per pixel cell.
                const pitch = Math.max(28, Math.round(38 * dpr));
                const line = Math.max(1, Math.round(dpr));
                for (let y = 0; y < height; y += pitch) gctx.fillRect(0, y, width, line);
                for (let x = 0; x < width; x += pitch) gctx.fillRect(x, 0, line, height);
            }
            gctx.restore();
        }


        renderVsync(now) {
            const mode = this.vsyncModes[this.vsyncModeIndex] || 'OFF';
            if (mode === 'OFF' || this.vsyncLevel <= 0.005) return;
            this.ensureBuffers({ ghost: true });
            if (!this.ghostCanvas || !this.ghostCanvas.width) return;
            const E = window.GlitchEngine;
            const profile = E && E.vsyncMethod ? E.vsyncMethod(mode) : {
                bar: mode === 'FULL' ? 1 : 0.5, tears: mode === 'FULL' ? 1 : 0.45,
                roll: mode === 'FULL' ? 0.8 : 0, hum: 0.35, snap: mode === 'FULL' ? 1 : 0,
                sharp: 0.6, scanphase: 0.7, harmony: mode === 'GHOST_OFF' ? 1 : 0.25
            };
            const w = this.canvas.width, h = this.canvas.height;
            const g = this.gctx;
            if (!w || !h) return;
            const t = now * 0.001;
            const level = this.vsyncLevel;
            if (level <= 0.005) return;
            const phase = (now * (0.025 + profile.scanphase * 0.04)) % h;
            g.save();
            g.globalCompositeOperation = 'screen';
            if (profile.roll > 0.01) {
                const rollY = (now * (0.018 + profile.roll * 0.06)) % h;
                g.globalAlpha = 0.045 * level * profile.roll;
                g.drawImage(this.ghostCanvas, 0, 0, w, h, 0, rollY - h, w, h);
                g.drawImage(this.ghostCanvas, 0, 0, w, h, 0, rollY, w, h);
            }
            const tears = Math.min(10, Math.round(profile.tears * 8));
            for (let i = 0; i < tears; i++) {
                const y = Math.floor((i * 137 + phase * (0.5 + i % 3 * 0.2)) % h);
                const bandH = Math.max(1, Math.floor(1 + profile.sharp * 3));
                const dx = Math.sin(t * 8 + i * 2.17) * (2 + profile.tears * 14) * level;
                g.globalAlpha = (0.05 + profile.tears * 0.075) * level;
                g.drawImage(this.ghostCanvas, 0, y, w, bandH, dx, y, w, bandH);
                if (profile.harmony > 0.35) {
                    g.globalAlpha = 0.035 * profile.harmony * level;
                    g.drawImage(this.ghostCanvas, 0, y, w, bandH, -dx * 0.55, y + 1, w, bandH);
                }
            }
            const barY = Math.floor(phase % h);
            const barH = Math.max(1, Math.floor(1 + profile.bar * 4));
            const bar = g.createLinearGradient(0, barY, 0, barY + barH);
            bar.addColorStop(0, 'rgba(255,255,255,0)');
            bar.addColorStop(0.5, `rgba(190,245,255,${(0.10 + profile.bar * 0.14) * level})`);
            bar.addColorStop(1, 'rgba(255,255,255,0)');
            g.globalAlpha = 1;
            g.fillStyle = bar;
            g.fillRect(0, barY, w, barH);
            if (profile.hum > 0.01) {
                g.globalCompositeOperation = 'multiply';
                g.globalAlpha = Math.min(0.11, profile.hum * 0.08) * level;
                g.fillStyle = '#10202a';
                const spacing = Math.max(3, Math.round(8 - profile.hum * 4));
                for (let y = Math.floor(phase % spacing); y < h; y += spacing) g.fillRect(0, y, w, 1);
            }
            if (profile.snap > 0.01) {
                g.globalCompositeOperation = 'overlay';
                g.globalAlpha = 0.055 * profile.snap * level;
                g.drawImage(this.ghostCanvas, 0, 0);
            }
            g.restore();
        }

        renderAiWarp(now) {
            if (!this.aiWarpActive || this.aiWarpStrength <= 0.01) return;
            this.ensureBuffers({ work: true });
            const w = this.canvas.width;
            const h = this.canvas.height;
            if (!w || !h || !this.workCanvas.width) return;
            const s = this.aiWarpStrength;
            const t = now * 0.001;
            const gctx = this.gctx;
            this.workCtx.globalCompositeOperation = 'source-over';
            this.workCtx.globalAlpha = 1;
            this.workCtx.clearRect(0, 0, w, h);
            const custom = document.getElementById('bg-custom');
            const hueBg = document.getElementById('hue-bg');
            const bg = (custom && custom.style.display !== 'none' && custom.width) ? custom : hueBg;
            try { if (bg) this.workCtx.drawImage(bg, 0, 0, w, h); } catch (e) {}
            try { this.workCtx.drawImage(this.canvas, 0, 0); } catch (e) {}

            gctx.save();
            gctx.globalCompositeOperation = 'source-over';
            gctx.globalAlpha = 1;
            const cols = 14 + Math.floor(s * 10);
            const colW = Math.ceil(w / cols);
            const amp = 6 + s * 36;
            for (let c = 0; c < cols; c++) {
                const sx = c * colW;
                const sw = Math.min(colW, w - sx);
                if (sw <= 0) continue;
                const wave = Math.sin(t * 2.4 + c * 0.45) * amp + Math.sin(t * 5.1 + c * 0.9) * amp * 0.25;
                gctx.drawImage(this.workCanvas, sx, 0, sw, h, sx + wave, 0, sw, h);
            }
            const chroma = 2 + s * 10;
            gctx.globalCompositeOperation = 'lighter';
            gctx.globalAlpha = 0.08 + s * 0.1;
            gctx.drawImage(this.workCanvas, -chroma, 0);
            gctx.globalAlpha = 0.06 + s * 0.08;
            gctx.drawImage(this.workCanvas, chroma, 0);
            gctx.globalCompositeOperation = 'soft-light';
            gctx.globalAlpha = 0.06 + s * 0.1;
            const hue = (now * 0.015 + this.liveAlpha('Hue/Color Cycle') * 90) % 360;
            gctx.fillStyle = `hsla(${hue}, 55%, 45%, 1)`;
            gctx.fillRect(0, 0, w, h);
            gctx.restore();

            const hueEl = document.getElementById('hue-bg');
            if (hueEl) {
                hueEl.style.filter = `hue-rotate(${(now * 0.02) % 360}deg) saturate(${1 + s * 0.15})`;
                hueEl.style.transform = `scale(${1.01 + s * 0.02})`;
            }
        }

        updateAiWarpSvg(now) {
            if (!this.aiWarpActive) {
                const overlay = document.getElementById('color-shift-overlay');
                if (overlay) overlay.style.opacity = '0';
                return;
            }
            const s = this.aiWarpStrength;
            this.aiWarpHue = (now * 0.012) % 360;
            let overlay = document.getElementById('color-shift-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'color-shift-overlay';
                Object.assign(overlay.style, {
                    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                    pointerEvents: 'none', mixBlendMode: 'soft-light', zIndex: '8', opacity: '0'
                });
                document.body.appendChild(overlay);
            }
            overlay.style.opacity = (0.04 + s * 0.08).toFixed(3);
            overlay.style.background = `linear-gradient(130deg, hsl(${this.aiWarpHue % 360}, 40%, 42%), hsl(${(this.aiWarpHue + 140) % 360}, 35%, 38%))`;
        }

        initTechArtistShader() {
            if (this.techArtistShader || !window.THREE) return this.techArtistShader;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000000);
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            renderer.setSize(window.innerWidth, window.innerHeight, false);
            const uniforms = {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                mouse: { value: new THREE.Vector2(0.5, 0.5) },
                velocity: { value: new THREE.Vector2(0, 0) }
            };
            const material = new THREE.ShaderMaterial({
                uniforms,
                transparent: true,
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec2 resolution;
                    uniform vec2 mouse;
                    uniform vec2 velocity;
                    varying vec2 vUv;
                    mat2 rot(float a) {
                        float s = sin(a);
                        float c = cos(a);
                        return mat2(c, -s, s, c);
                    }
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
                        vec3 rayDir = normalize(vec3(uv, 1.0 + vmag * 0.8));
                        for(float i = 0.0; i < 20.0; i++) {
                            float z = i * 0.5 + 0.1;
                            vec3 p = z * rayDir;
                            vec2 mouseOffset = m * (1.4 + vmag * 2.0);
                            p.xz *= rot(t * 0.2 + mouseOffset.x + velocity.x * 2.0);
                            p.yz *= rot(t * 0.15 + mouseOffset.y + velocity.y * 2.0);
                            p.xy *= rot(sin(t * 0.35 + z * 0.6 + vmag * 5.0) * 0.25);
                            vec3 a = p;
                            float d;
                            for(d = 1.0; d < 4.0; d += 1.0) {
                                a -= sin(a * d + t + i*0.1).yzx / (d * 0.8);
                            }
                            vec3 q = abs(a);
                            float mx = max(max(q.x, q.y), q.z);
                            float s = a.z + a.y - t;
                            d = abs(2.0 - mx) + abs(cos(s)) / 7.0;
                            float z_col = z + d;
                            float hueWarp = (m.x - m.y) * 2.0 + vmag * 3.0;
                            vec4 colorPhase = vec4(0.0 + hueWarp, 2.0 + mouse.y * 2.5 + vmag * 2.0, 4.0 - mouse.y * 2.5 - vmag * 2.0, 0.0 + hueWarp * 0.5);
                            o += (cos(s - z_col + colorPhase) + 1.0) / (d * (0.5 + vmag * 0.6) + 0.01);
                        }
                        o = o / 20.0;
                        o = o / (1.0 + o);
                        o = smoothstep(0.15, 0.85, o);
                        gl_FragColor = o;
                        gl_FragColor.a = 1.0;
                    }
                `
            });
            scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
            this.techArtistShader = { renderer, scene, camera, uniforms, canvas: renderer.domElement };
            return this.techArtistShader;
        }
    }

    window.glitchController = new GlitchController('glitchCanvas');
});
