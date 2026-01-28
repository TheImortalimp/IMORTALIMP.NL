/**
 * WATCH_DOGS SVG Animation Engine
 * Inspired by the iconic Watch_Dogs startup screen
 * Features: ASCII glitch effects, SVG animations, cyan/white/black color scheme
 * Author: River - www.imortalimp.nl
 */

class WatchDogsEffect {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        // Configuration
        this.config = {
            primaryColor: options.primaryColor || '#00d9ff', // Cyan
            secondaryColor: options.secondaryColor || '#ffffff', // White
            backgroundColor: options.backgroundColor || '#000000', // Black
            glitchIntensity: options.glitchIntensity || 0.7,
            animationSpeed: options.animationSpeed || 1.0,
            showLogo: options.showLogo !== false,
            showASCII: options.showASCII !== false,
            showScanlines: options.showScanlines !== false,
            autoStart: options.autoStart !== false,
            loopAnimation: options.loopAnimation !== false,
            ...options
        };

        // State
        this.svgNS = 'http://www.w3.org/2000/svg';
        this.animationFrame = null;
        this.time = 0;
        this.glitchActive = false;
        this.elements = {};

        // ASCII characters for glitch effect
        this.asciiChars = '01█▓▒░@#$%&*<>{}[]|/\\~-_=+';
        this.hackingText = [
            'SYSTEM ACCESS',
            'DECRYPTING...',
            'ctOS BREACH',
            'NETWORK INFILTRATION',
            'DATA STREAM ACTIVE',
            'UNAUTHORIZED ACCESS',
            'FIREWALL BYPASSED',
            'ROOT ACCESS GRANTED'
        ];

        this.init();
    }

    init() {
        this.createSVGContainer();
        this.createBackground();
        if (this.config.showScanlines) this.createScanlines();
        if (this.config.showASCII) this.createASCIIGrid();
        if (this.config.showLogo) this.createLogo();
        this.createGlitchOverlay();
        this.createDataStreams();
        this.createHexGrid();
        
        if (this.config.autoStart) {
            this.start();
        }
    }

    createSVGContainer() {
        this.svg = document.createElementNS(this.svgNS, 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', '0 0 1920 1080');
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        this.svg.style.position = 'absolute';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        
        // Create defs for filters and patterns
        this.defs = document.createElementNS(this.svgNS, 'defs');
        this.svg.appendChild(this.defs);
        
        this.createFilters();
        this.container.appendChild(this.svg);
    }

    createFilters() {
        // Glitch filter
        const glitchFilter = document.createElementNS(this.svgNS, 'filter');
        glitchFilter.setAttribute('id', 'glitch-filter');
        
        const turbulence = document.createElementNS(this.svgNS, 'feTurbulence');
        turbulence.setAttribute('type', 'fractalNoise');
        turbulence.setAttribute('baseFrequency', '0.05');
        turbulence.setAttribute('numOctaves', '2');
        turbulence.setAttribute('result', 'turbulence');
        
        const displace = document.createElementNS(this.svgNS, 'feDisplacementMap');
        displace.setAttribute('in', 'SourceGraphic');
        displace.setAttribute('in2', 'turbulence');
        displace.setAttribute('scale', '0');
        displace.setAttribute('xChannelSelector', 'R');
        displace.setAttribute('yChannelSelector', 'G');
        displace.id = 'glitch-displace';
        
        glitchFilter.appendChild(turbulence);
        glitchFilter.appendChild(displace);
        this.defs.appendChild(glitchFilter);
        
        // RGB Split filter
        const rgbFilter = document.createElementNS(this.svgNS, 'filter');
        rgbFilter.setAttribute('id', 'rgb-split');
        
        const feOffset1 = document.createElementNS(this.svgNS, 'feOffset');
        feOffset1.setAttribute('in', 'SourceGraphic');
        feOffset1.setAttribute('dx', '-5');
        feOffset1.setAttribute('result', 'layerR');
        
        const feOffset2 = document.createElementNS(this.svgNS, 'feOffset');
        feOffset2.setAttribute('in', 'SourceGraphic');
        feOffset2.setAttribute('dx', '5');
        feOffset2.setAttribute('result', 'layerB');
        
        rgbFilter.appendChild(feOffset1);
        rgbFilter.appendChild(feOffset2);
        this.defs.appendChild(rgbFilter);

        // Glow filter
        const glowFilter = document.createElementNS(this.svgNS, 'filter');
        glowFilter.setAttribute('id', 'glow-filter');
        glowFilter.setAttribute('x', '-50%');
        glowFilter.setAttribute('y', '-50%');
        glowFilter.setAttribute('width', '200%');
        glowFilter.setAttribute('height', '200%');
        
        const feGaussian = document.createElementNS(this.svgNS, 'feGaussianBlur');
        feGaussian.setAttribute('stdDeviation', '4');
        feGaussian.setAttribute('result', 'coloredBlur');
        
        const feMerge = document.createElementNS(this.svgNS, 'feMerge');
        const feMergeNode1 = document.createElementNS(this.svgNS, 'feMergeNode');
        feMergeNode1.setAttribute('in', 'coloredBlur');
        const feMergeNode2 = document.createElementNS(this.svgNS, 'feMergeNode');
        feMergeNode2.setAttribute('in', 'SourceGraphic');
        
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        glowFilter.appendChild(feGaussian);
        glowFilter.appendChild(feMerge);
        this.defs.appendChild(glowFilter);
    }

    createBackground() {
        const bg = document.createElementNS(this.svgNS, 'rect');
        bg.setAttribute('width', '100%');
        bg.setAttribute('height', '100%');
        bg.setAttribute('fill', this.config.backgroundColor);
        this.svg.appendChild(bg);
        this.elements.background = bg;
    }

    createScanlines() {
        const pattern = document.createElementNS(this.svgNS, 'pattern');
        pattern.setAttribute('id', 'scanlines');
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        pattern.setAttribute('width', '100%');
        pattern.setAttribute('height', '4');
        
        const line = document.createElementNS(this.svgNS, 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '0');
        line.setAttribute('x2', '100%');
        line.setAttribute('y2', '0');
        line.setAttribute('stroke', this.config.primaryColor);
        line.setAttribute('stroke-width', '1');
        line.setAttribute('opacity', '0.1');
        
        pattern.appendChild(line);
        this.defs.appendChild(pattern);
        
        const scanlineRect = document.createElementNS(this.svgNS, 'rect');
        scanlineRect.setAttribute('width', '100%');
        scanlineRect.setAttribute('height', '100%');
        scanlineRect.setAttribute('fill', 'url(#scanlines)');
        
        const animateTransform = document.createElementNS(this.svgNS, 'animateTransform');
        animateTransform.setAttribute('attributeName', 'transform');
        animateTransform.setAttribute('type', 'translate');
        animateTransform.setAttribute('from', '0 0');
        animateTransform.setAttribute('to', '0 4');
        animateTransform.setAttribute('dur', '0.1s');
        animateTransform.setAttribute('repeatCount', 'indefinite');
        
        scanlineRect.appendChild(animateTransform);
        this.svg.appendChild(scanlineRect);
        this.elements.scanlines = scanlineRect;
    }

    createASCIIGrid() {
        const group = document.createElementNS(this.svgNS, 'g');
        group.setAttribute('id', 'ascii-grid');
        group.setAttribute('opacity', '0.15');
        
        const cols = 40;
        const rows = 30;
        
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 1920;
            const y = Math.random() * 1080;
            const char = this.asciiChars[Math.floor(Math.random() * this.asciiChars.length)];
            
            const text = document.createElementNS(this.svgNS, 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('font-family', 'Courier New, monospace');
            text.setAttribute('font-size', Math.random() * 20 + 10);
            text.setAttribute('fill', Math.random() > 0.5 ? this.config.primaryColor : this.config.secondaryColor);
            text.setAttribute('opacity', Math.random() * 0.5 + 0.1);
            text.textContent = char;
            
            // Animate opacity
            const animate = document.createElementNS(this.svgNS, 'animate');
            animate.setAttribute('attributeName', 'opacity');
            animate.setAttribute('values', '0.1;0.5;0.1');
            animate.setAttribute('dur', (Math.random() * 2 + 1) + 's');
            animate.setAttribute('repeatCount', 'indefinite');
            
            text.appendChild(animate);
            group.appendChild(text);
        }
        
        this.svg.appendChild(group);
        this.elements.asciiGrid = group;
    }

    createLogo() {
        const logoGroup = document.createElementNS(this.svgNS, 'g');
        logoGroup.setAttribute('id', 'watch-dogs-logo');
        logoGroup.setAttribute('transform', 'translate(960, 400)');
        logoGroup.setAttribute('filter', 'url(#glow-filter)');
        
        // Stylized "_" underscore
        const underscore = document.createElementNS(this.svgNS, 'path');
        underscore.setAttribute('d', 'M -200 50 L 200 50 L 200 70 L -200 70 Z');
        underscore.setAttribute('fill', this.config.primaryColor);
        
        // Animated stroke dash
        const underscoreStroke = document.createElementNS(this.svgNS, 'path');
        underscoreStroke.setAttribute('d', 'M -200 50 L 200 50 L 200 70 L -200 70 Z');
        underscoreStroke.setAttribute('fill', 'none');
        underscoreStroke.setAttribute('stroke', this.config.secondaryColor);
        underscoreStroke.setAttribute('stroke-width', '2');
        underscoreStroke.setAttribute('stroke-dasharray', '10 5');
        
        const animateDash = document.createElementNS(this.svgNS, 'animate');
        animateDash.setAttribute('attributeName', 'stroke-dashoffset');
        animateDash.setAttribute('from', '0');
        animateDash.setAttribute('to', '15');
        animateDash.setAttribute('dur', '0.5s');
        animateDash.setAttribute('repeatCount', 'indefinite');
        underscoreStroke.appendChild(animateDash);
        
        // Main text: WATCH_DOGS
        const mainText = document.createElementNS(this.svgNS, 'text');
        mainText.setAttribute('x', '0');
        mainText.setAttribute('y', '0');
        mainText.setAttribute('font-family', 'Arial, sans-serif');
        mainText.setAttribute('font-size', '80');
        mainText.setAttribute('font-weight', 'bold');
        mainText.setAttribute('fill', this.config.secondaryColor);
        mainText.setAttribute('text-anchor', 'middle');
        mainText.textContent = 'WATCH_DOGS';
        
        // Glitch effect on text
        const glitchText1 = mainText.cloneNode(true);
        glitchText1.setAttribute('fill', this.config.primaryColor);
        glitchText1.setAttribute('opacity', '0.7');
        
        const animateX1 = document.createElementNS(this.svgNS, 'animate');
        animateX1.setAttribute('attributeName', 'x');
        animateX1.setAttribute('values', '0;-3;2;-2;0');
        animateX1.setAttribute('dur', '0.3s');
        animateX1.setAttribute('repeatCount', 'indefinite');
        glitchText1.appendChild(animateX1);
        
        const glitchText2 = mainText.cloneNode(true);
        glitchText2.setAttribute('fill', '#ff0000');
        glitchText2.setAttribute('opacity', '0.3');
        
        const animateX2 = document.createElementNS(this.svgNS, 'animate');
        animateX2.setAttribute('attributeName', 'x');
        animateX2.setAttribute('values', '0;3;-2;2;0');
        animateX2.setAttribute('dur', '0.3s');
        animateX2.setAttribute('repeatCount', 'indefinite');
        glitchText2.appendChild(animateX2);
        
        // Tagline
        const tagline = document.createElementNS(this.svgNS, 'text');
        tagline.setAttribute('x', '0');
        tagline.setAttribute('y', '120');
        tagline.setAttribute('font-family', 'Courier New, monospace');
        tagline.setAttribute('font-size', '24');
        tagline.setAttribute('fill', this.config.primaryColor);
        tagline.setAttribute('text-anchor', 'middle');
        tagline.textContent = '> CONNECTION ESTABLISHED';
        
        const animateOpacity = document.createElementNS(this.svgNS, 'animate');
        animateOpacity.setAttribute('attributeName', 'opacity');
        animateOpacity.setAttribute('values', '0.5;1;0.5');
        animateOpacity.setAttribute('dur', '2s');
        animateOpacity.setAttribute('repeatCount', 'indefinite');
        tagline.appendChild(animateOpacity);
        
        logoGroup.appendChild(glitchText2);
        logoGroup.appendChild(glitchText1);
        logoGroup.appendChild(mainText);
        logoGroup.appendChild(underscore);
        logoGroup.appendChild(underscoreStroke);
        logoGroup.appendChild(tagline);
        
        // Fade in animation
        const fadeIn = document.createElementNS(this.svgNS, 'animate');
        fadeIn.setAttribute('attributeName', 'opacity');
        fadeIn.setAttribute('from', '0');
        fadeIn.setAttribute('to', '1');
        fadeIn.setAttribute('dur', '2s');
        fadeIn.setAttribute('fill', 'freeze');
        logoGroup.appendChild(fadeIn);
        
        this.svg.appendChild(logoGroup);
        this.elements.logo = logoGroup;
    }

    createGlitchOverlay() {
        const group = document.createElementNS(this.svgNS, 'g');
        group.setAttribute('id', 'glitch-overlay');
        group.setAttribute('opacity', '0');
        
        // Create random glitch bars
        for (let i = 0; i < 20; i++) {
            const rect = document.createElementNS(this.svgNS, 'rect');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', Math.random() * 1080);
            rect.setAttribute('width', '1920');
            rect.setAttribute('height', Math.random() * 20 + 5);
            rect.setAttribute('fill', Math.random() > 0.5 ? this.config.primaryColor : this.config.secondaryColor);
            rect.setAttribute('opacity', Math.random() * 0.5 + 0.2);
            
            group.appendChild(rect);
        }
        
        this.svg.appendChild(group);
        this.elements.glitchOverlay = group;
    }

    createDataStreams() {
        const group = document.createElementNS(this.svgNS, 'g');
        group.setAttribute('id', 'data-streams');
        
        // Create vertical data streams
        for (let i = 0; i < 10; i++) {
            const x = (i * 200) + 100;
            
            const line = document.createElementNS(this.svgNS, 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', '0');
            line.setAttribute('x2', x);
            line.setAttribute('y2', '1080');
            line.setAttribute('stroke', this.config.primaryColor);
            line.setAttribute('stroke-width', '1');
            line.setAttribute('opacity', '0.2');
            line.setAttribute('stroke-dasharray', '10 20');
            
            const animate = document.createElementNS(this.svgNS, 'animate');
            animate.setAttribute('attributeName', 'stroke-dashoffset');
            animate.setAttribute('from', '0');
            animate.setAttribute('to', '30');
            animate.setAttribute('dur', (Math.random() + 0.5) + 's');
            animate.setAttribute('repeatCount', 'indefinite');
            
            line.appendChild(animate);
            group.appendChild(line);
            
            // Add data text along the stream
            const text = document.createElementNS(this.svgNS, 'text');
            text.setAttribute('x', x + 5);
            text.setAttribute('y', '100');
            text.setAttribute('font-family', 'Courier New, monospace');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', this.config.primaryColor);
            text.setAttribute('opacity', '0.5');
            
            const textPath = document.createElementNS(this.svgNS, 'animateTransform');
            textPath.setAttribute('attributeName', 'transform');
            textPath.setAttribute('type', 'translate');
            textPath.setAttribute('from', '0 0');
            textPath.setAttribute('to', '0 980');
            textPath.setAttribute('dur', (Math.random() * 5 + 3) + 's');
            textPath.setAttribute('repeatCount', 'indefinite');
            
            text.textContent = this.generateRandomHex(8);
            text.appendChild(textPath);
            group.appendChild(text);
        }
        
        this.svg.appendChild(group);
        this.elements.dataStreams = group;
    }

    createHexGrid() {
        const group = document.createElementNS(this.svgNS, 'g');
        group.setAttribute('id', 'hex-grid');
        group.setAttribute('opacity', '0.1');
        
        const hexSize = 30;
        const cols = Math.ceil(1920 / (hexSize * 1.5));
        const rows = Math.ceil(1080 / (hexSize * Math.sqrt(3)));
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * hexSize * 1.5;
                const y = row * hexSize * Math.sqrt(3) + (col % 2) * hexSize * Math.sqrt(3) / 2;
                
                const hex = this.createHexagon(x, y, hexSize);
                hex.setAttribute('stroke', this.config.primaryColor);
                hex.setAttribute('stroke-width', '1');
                hex.setAttribute('fill', 'none');
                
                if (Math.random() > 0.9) {
                    const animate = document.createElementNS(this.svgNS, 'animate');
                    animate.setAttribute('attributeName', 'opacity');
                    animate.setAttribute('values', '0.1;0.5;0.1');
                    animate.setAttribute('dur', (Math.random() * 3 + 2) + 's');
                    animate.setAttribute('repeatCount', 'indefinite');
                    hex.appendChild(animate);
                }
                
                group.appendChild(hex);
            }
        }
        
        this.svg.appendChild(group);
        this.elements.hexGrid = group;
    }

    createHexagon(x, y, size) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            points.push(`${px},${py}`);
        }
        
        const polygon = document.createElementNS(this.svgNS, 'polygon');
        polygon.setAttribute('points', points.join(' '));
        return polygon;
    }

    generateRandomHex(length) {
        const chars = '0123456789ABCDEF';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    triggerGlitch(duration = 200) {
        if (this.glitchActive) return;
        this.glitchActive = true;
        
        // Apply glitch effect
        const displace = document.getElementById('glitch-displace');
        if (displace) {
            displace.setAttribute('scale', '50');
        }
        
        if (this.elements.glitchOverlay) {
            this.elements.glitchOverlay.setAttribute('opacity', '0.7');
        }
        
        // Random repositioning of glitch bars
        const bars = this.elements.glitchOverlay?.children;
        if (bars) {
            for (let bar of bars) {
                bar.setAttribute('y', Math.random() * 1080);
            }
        }
        
        // Reset after duration
        setTimeout(() => {
            if (displace) {
                displace.setAttribute('scale', '0');
            }
            if (this.elements.glitchOverlay) {
                this.elements.glitchOverlay.setAttribute('opacity', '0');
            }
            this.glitchActive = false;
        }, duration);
    }

    addHackingText(text, x = 960, y = 800) {
        const textEl = document.createElementNS(this.svgNS, 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('font-family', 'Courier New, monospace');
        textEl.setAttribute('font-size', '24');
        textEl.setAttribute('fill', this.config.primaryColor);
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('filter', 'url(#glow-filter)');
        textEl.textContent = `> ${text}`;
        
        // Fade in
        const fadeIn = document.createElementNS(this.svgNS, 'animate');
        fadeIn.setAttribute('attributeName', 'opacity');
        fadeIn.setAttribute('from', '0');
        fadeIn.setAttribute('to', '1');
        fadeIn.setAttribute('dur', '0.5s');
        fadeIn.setAttribute('fill', 'freeze');
        textEl.appendChild(fadeIn);
        
        this.svg.appendChild(textEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            const fadeOut = document.createElementNS(this.svgNS, 'animate');
            fadeOut.setAttribute('attributeName', 'opacity');
            fadeOut.setAttribute('from', '1');
            fadeOut.setAttribute('to', '0');
            fadeOut.setAttribute('dur', '1s');
            fadeOut.setAttribute('fill', 'freeze');
            textEl.appendChild(fadeOut);
            
            setTimeout(() => {
                textEl.remove();
            }, 1000);
        }, 3000);
    }

    startGlitchSequence() {
        const glitchInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                this.triggerGlitch(Math.random() * 300 + 100);
            }
        }, 2000);
        
        this.glitchIntervalId = glitchInterval;
        return glitchInterval;
    }

    startHackingSequence() {
        let index = 0;
        const hackInterval = setInterval(() => {
            if (index < this.hackingText.length) {
                this.addHackingText(this.hackingText[index]);
                index++;
            } else {
                index = 0;
            }
        }, 4000);
        
        this.hackIntervalId = hackInterval;
        return hackInterval;
    }

    start() {
        this.startGlitchSequence();
        if (this.config.loopAnimation) {
            this.startHackingSequence();
        }
    }

    stop() {
        if (this.glitchIntervalId) {
            clearInterval(this.glitchIntervalId);
        }
        if (this.hackIntervalId) {
            clearInterval(this.hackIntervalId);
        }
    }

    destroy() {
        this.stop();
        if (this.container && this.svg) {
            this.container.removeChild(this.svg);
        }
    }

    // Public API methods
    setGlitchIntensity(value) {
        this.config.glitchIntensity = Math.max(0, Math.min(1, value));
    }

    setColors(primary, secondary, background) {
        if (primary) this.config.primaryColor = primary;
        if (secondary) this.config.secondaryColor = secondary;
        if (background && this.elements.background) {
            this.config.backgroundColor = background;
            this.elements.background.setAttribute('fill', background);
        }
    }

    toggleLayer(layerName, visible) {
        if (this.elements[layerName]) {
            this.elements[layerName].style.display = visible ? 'block' : 'none';
        }
    }
}

// Export for use in modules or standalone
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WatchDogsEffect;
}
