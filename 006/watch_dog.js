document.addEventListener('DOMContentLoaded', () => {
        // --- Noir Glitchy Typewriter Text Column ---
        const noirText = "A Wallpaper Engine web wallpaper, Inspired by the game WATCH_DOGS";
        const noirSvg = document.getElementById('noir-svg-text');
        const noirLink = document.getElementById('noir-steam-link');
        const noirBtn = document.getElementById('noir-info-btn');
        if (noirSvg && noirLink && noirBtn) {
            const lineHeight = 28;
            const fontSize = 16;
            const fontFamily = 'Courier New, Courier, monospace';
            const charsPerLine = 22;
            const baseSoundUrl = 'https://imortalimp.nl/006/';
            const printerKeys = [
                'keypress1.mp3', 'keypress2.mp3', 'keypress3.mp3', 'keypress4.mp3'
            ].map(f => baseSoundUrl + f);
            const printerReturn = baseSoundUrl + 'printer_return.mp3';
            // Preload sounds
            const keySounds = printerKeys.map(src => { let a = new Audio(src); a.volume = 0.18; return a; });
            const returnSound = new Audio(printerReturn); returnSound.volume = 0.22;
            function playKeySound(idx) {
                let s;
                if (typeof idx === 'number') {
                    s = keySounds[idx % keySounds.length];
                } else {
                    s = keySounds[Math.floor(Math.random() * keySounds.length)];
                }
                s.currentTime = 0; s.play();
            }
            function playReturnSound() { returnSound.currentTime = 0; returnSound.play(); }

            function splitTextToLines(text, maxChars) {
                const words = text.split(' ');
                const lines = [];
                let current = '';
                for (let i = 0; i < words.length; i++) {
                    if ((current + (current ? ' ' : '') + words[i]).length > maxChars) {
                        if (current) lines.push(current);
                        current = words[i];
                    } else {
                        current += (current ? ' ' : '') + words[i];
                    }
                }
                if (current) lines.push(current);
                return lines;
            }

            noirLink.style.opacity = 0;
            noirSvg.innerHTML = '';
            noirBtn.style.display = '';

            noirBtn.onclick = function() {
                noirBtn.style.display = 'none';
                const lines = splitTextToLines(noirText, charsPerLine);
                let lineIdx = 0;
                let printedLines = [];
                function printLine(line, doneCallback) {
                    let i = 0;
                    function typeChar() {
                        if (i > line.length) {
                            if (doneCallback) doneCallback();
                            return;
                        }
                        noirSvg.innerHTML = '';
                        let yy = fontSize + 8;
                        for (let l = 0; l < printedLines.length; l++) {
                            const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            textElem.setAttribute('x', 0);
                            textElem.setAttribute('y', yy);
                            textElem.setAttribute('fill', '#DC143C');
                            textElem.setAttribute('font-family', fontFamily);
                            textElem.setAttribute('font-size', fontSize);
                            textElem.setAttribute('font-weight', 'bold');
                            textElem.setAttribute('text-anchor', 'start');
                            textElem.setAttribute('style', 'text-shadow:0 2px 8px #000,0 0 2px #000;');
                            textElem.textContent = printedLines[l];
                            noirSvg.appendChild(textElem);
                            yy += lineHeight;
                        }
                        if (i <= line.length) {
                            const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            textElem.setAttribute('x', 0);
                            textElem.setAttribute('y', yy);
                            textElem.setAttribute('fill', '#DC143C');
                            textElem.setAttribute('font-family', fontFamily);
                            textElem.setAttribute('font-size', fontSize);
                            textElem.setAttribute('font-weight', 'bold');
                            textElem.setAttribute('text-anchor', 'start');
                            textElem.setAttribute('style', 'text-shadow:0 2px 8px #000,0 0 2px #000;');
                            textElem.textContent = line.slice(0, i);
                            noirSvg.appendChild(textElem);
                        }
                        if (i < line.length) {
                            playKeySound(i % keySounds.length);
                            setTimeout(typeChar, 44 + Math.random() * 60);
                        } else {
                            printedLines.push(line);
                            if (doneCallback) setTimeout(doneCallback, 120);
                        }
                        i++;
                    }
                    typeChar();
                }
                function typeAllLines() {
                    function nextLine() {
                        if (lineIdx < lines.length) {
                            printLine(lines[lineIdx], () => {
                                lineIdx++;
                                nextLine();
                            });
                        } else {
                            noirLink.style.opacity = 1;
                            playReturnSound();
                            setTimeout(() => {
                                noirSvg.style.opacity = 0;
                                noirLink.style.opacity = 0;
                            }, 20000);
                        }
                    }
                    nextLine();
                }
                typeAllLines();
            };
        }
    // --- Tint Sliders UI Integration ---
    // Default all tints to 0
    let logoTintHue = 0;
    let backgroundTintHue = 0;
    let asciiTintHue = 0;

    function updateTintsFromSliders() {
        const logoSlider = document.getElementById('logo-tint-slider');
        const bgSlider = document.getElementById('background-tint-slider');
        const asciiSlider = document.getElementById('ascii-tint-slider');
        if (logoSlider) logoTintHue = parseFloat(logoSlider.value) || 0;
        if (bgSlider) backgroundTintHue = parseFloat(bgSlider.value) || 0;
        if (asciiSlider) asciiTintHue = parseFloat(asciiSlider.value) || 0;
        setHueRotate(logoTintMatrix, logoTintHue);
        setHueRotate(backgroundTintMatrix, backgroundTintHue);
        setHueRotate(asciiTintMatrix, asciiTintHue);
        if (typeof updateBlend === 'function') updateBlend(performance.now());
    }

    function setSlidersFromTints() {
        const logoSlider = document.getElementById('logo-tint-slider');
        const bgSlider = document.getElementById('background-tint-slider');
        const asciiSlider = document.getElementById('ascii-tint-slider');
        // Always set to 0 on load
        if (logoSlider) logoSlider.value = 0;
        if (bgSlider) bgSlider.value = 0;
        if (asciiSlider) asciiSlider.value = 0;
        logoTintHue = 0;
        backgroundTintHue = 0;
        asciiTintHue = 0;
    }

    // ...existing code...
    // All SVG/DOM setup and variable declarations go here
    // ...existing code...

    // MOVE SLIDER SETUP TO END, after all variables and DOM are ready
    // (This block should be at the very end of the DOMContentLoaded handler)
    setTimeout(() => {
        setSlidersFromTints();
        const logoSlider = document.getElementById('logo-tint-slider');
        const bgSlider = document.getElementById('background-tint-slider');
        const asciiSlider = document.getElementById('ascii-tint-slider');
        if (logoSlider) logoSlider.addEventListener('input', updateTintsFromSliders);
        if (bgSlider) bgSlider.addEventListener('input', updateTintsFromSliders);
        if (asciiSlider) asciiSlider.addEventListener('input', updateTintsFromSliders);
        setHueRotate(logoTintMatrix, logoTintHue);
        setHueRotate(backgroundTintMatrix, backgroundTintHue);
        setHueRotate(asciiTintMatrix, asciiTintHue);
    }, 0);
    const container = document.getElementById('glitch-container');
    if (!container) {
        return;
    }
    const svgNS = "http://www.w3.org/2000/svg";

    // SVG setup
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 474 474');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    container.appendChild(svg);

    // Colors
    const colors = {
        black: '#000000',
        grey: '#808080',
        white: '#FFFFFF',
        cyan: '#00FFFF',
        crimson: '#DC143C'
    };
    const colorNames = ['black', 'grey', 'white', 'cyan'];
    const rareAccent = 'crimson';
    const palettePairs = [
        ['black', 'grey'],
        ['black', 'white'],
        ['black', 'cyan'],
        ['grey', 'white'],
        ['grey', 'cyan'],
        ['white', 'cyan']
    ];
    const invertedColors = {
        black: 'white',
        grey: 'white',
        white: 'black',
        cyan: 'black'
    };
    let currentBgColor = colors.black;
    let baseBgColor = colors.black;

    // Create defs
    const defs = document.createElementNS(svgNS, 'defs');
    svg.appendChild(defs);

    const logoTintFilter = document.createElementNS(svgNS, 'filter');
    logoTintFilter.setAttribute('id', 'logoTintFilter');
    const logoTintMatrix = document.createElementNS(svgNS, 'feColorMatrix');
    logoTintMatrix.setAttribute('type', 'hueRotate');
    logoTintMatrix.setAttribute('values', '0');
    logoTintFilter.appendChild(logoTintMatrix);
    defs.appendChild(logoTintFilter);

    const backgroundTintFilter = document.createElementNS(svgNS, 'filter');
    backgroundTintFilter.setAttribute('id', 'backgroundTintFilter');
    const backgroundTintMatrix = document.createElementNS(svgNS, 'feColorMatrix');
    backgroundTintMatrix.setAttribute('type', 'hueRotate');
    backgroundTintMatrix.setAttribute('values', '0');
    backgroundTintFilter.appendChild(backgroundTintMatrix);
    defs.appendChild(backgroundTintFilter);

    const asciiTintFilter = document.createElementNS(svgNS, 'filter');
    asciiTintFilter.setAttribute('id', 'asciiTintFilter');
    const asciiTintMatrix = document.createElementNS(svgNS, 'feColorMatrix');
    asciiTintMatrix.setAttribute('type', 'hueRotate');
    asciiTintMatrix.setAttribute('values', '0');
    asciiTintFilter.appendChild(asciiTintMatrix);
    defs.appendChild(asciiTintFilter);

    const fullpageBWFilter = document.createElementNS(svgNS, 'filter');
    fullpageBWFilter.setAttribute('id', 'fullpageBWFilter');
    fullpageBWFilter.setAttribute('x', '-10%');
    fullpageBWFilter.setAttribute('y', '-10%');
    fullpageBWFilter.setAttribute('width', '120%');
    fullpageBWFilter.setAttribute('height', '120%');
    const fullpageBWMatrix = document.createElementNS(svgNS, 'feColorMatrix');
    fullpageBWMatrix.setAttribute('type', 'saturate');
    fullpageBWMatrix.setAttribute('values', '0');
    fullpageBWFilter.appendChild(fullpageBWMatrix);
    defs.appendChild(fullpageBWFilter);

    const fullpageGroup = document.createElementNS(svgNS, 'g');
    fullpageGroup.setAttribute('id', 'fullpageGroup');
    svg.appendChild(fullpageGroup);

    // Main group
    const mainGroup = document.createElementNS(svgNS, 'g');
    mainGroup.setAttribute('id', 'mainGroupBase');
    fullpageGroup.appendChild(mainGroup);

    // Background placeholder (empty for now)
    const backgroundGroup = document.createElementNS(svgNS, 'g');
    backgroundGroup.setAttribute('id', 'backgroundGroupPlaceholder');
    mainGroup.appendChild(backgroundGroup);

    const backgroundRect = document.createElementNS(svgNS, 'rect');
    backgroundRect.setAttribute('x', '0');
    backgroundRect.setAttribute('y', '0');
    backgroundRect.setAttribute('width', '474');
    backgroundRect.setAttribute('height', '474');
    backgroundRect.setAttribute('fill', currentBgColor);
    backgroundGroup.appendChild(backgroundRect);

    const smokeFilter = document.createElementNS(svgNS, 'filter');
    smokeFilter.setAttribute('id', 'smokeFilter');
    smokeFilter.setAttribute('x', '-25%');
    smokeFilter.setAttribute('y', '-25%');
    smokeFilter.setAttribute('width', '150%');
    smokeFilter.setAttribute('height', '150%');
    defs.appendChild(smokeFilter);

    const smokeTurbulence = document.createElementNS(svgNS, 'feTurbulence');
    smokeTurbulence.setAttribute('type', 'turbulence');
    smokeTurbulence.setAttribute('baseFrequency', '0.012 0.08');
    smokeTurbulence.setAttribute('numOctaves', '2');
    smokeTurbulence.setAttribute('seed', '4');
    smokeTurbulence.setAttribute('result', 'smokeNoise');
    smokeFilter.appendChild(smokeTurbulence);

    const smokeDisplacement = document.createElementNS(svgNS, 'feDisplacementMap');
    smokeDisplacement.setAttribute('in', 'SourceGraphic');
    smokeDisplacement.setAttribute('in2', 'smokeNoise');
    smokeDisplacement.setAttribute('scale', '14');
    smokeDisplacement.setAttribute('xChannelSelector', 'R');
    smokeDisplacement.setAttribute('yChannelSelector', 'G');
    smokeDisplacement.setAttribute('result', 'smokeDisplaced');
    smokeFilter.appendChild(smokeDisplacement);

    const smokeBlur = document.createElementNS(svgNS, 'feGaussianBlur');
    smokeBlur.setAttribute('in', 'smokeDisplaced');
    smokeBlur.setAttribute('stdDeviation', '1.6');
    smokeBlur.setAttribute('result', 'smokeBlurred');
    smokeFilter.appendChild(smokeBlur);

    const smokeComposite = document.createElementNS(svgNS, 'feBlend');
    smokeComposite.setAttribute('in', 'SourceGraphic');
    smokeComposite.setAttribute('in2', 'smokeBlurred');
    smokeComposite.setAttribute('mode', 'screen');
    smokeFilter.appendChild(smokeComposite);

    const smokeGroup = document.createElementNS(svgNS, 'g');
    smokeGroup.setAttribute('id', 'smokeGroup');
    smokeGroup.setAttribute('filter', 'url(#smokeFilter)');
    smokeGroup.style.mixBlendMode = 'screen';
    backgroundGroup.appendChild(smokeGroup);

    const smokeGradientA = document.createElementNS(svgNS, 'linearGradient');
    smokeGradientA.setAttribute('id', 'smokeGradientA');
    smokeGradientA.setAttribute('x1', '0%');
    smokeGradientA.setAttribute('y1', '0%');
    smokeGradientA.setAttribute('x2', '100%');
    smokeGradientA.setAttribute('y2', '0%');
    defs.appendChild(smokeGradientA);

    const smokeAStop1 = document.createElementNS(svgNS, 'stop');
    smokeAStop1.setAttribute('offset', '0%');
    smokeAStop1.setAttribute('stop-color', colors.cyan);
    smokeAStop1.setAttribute('stop-opacity', '0.0');
    smokeGradientA.appendChild(smokeAStop1);

    const smokeAStop2 = document.createElementNS(svgNS, 'stop');
    smokeAStop2.setAttribute('offset', '55%');
    smokeAStop2.setAttribute('stop-color', colors.white);
    smokeAStop2.setAttribute('stop-opacity', '0.52');
    smokeGradientA.appendChild(smokeAStop2);

    const smokeAStop3 = document.createElementNS(svgNS, 'stop');
    smokeAStop3.setAttribute('offset', '100%');
    smokeAStop3.setAttribute('stop-color', colors.grey);
    smokeAStop3.setAttribute('stop-opacity', '0.0');
    smokeGradientA.appendChild(smokeAStop3);

    const smokeGradientB = document.createElementNS(svgNS, 'radialGradient');
    smokeGradientB.setAttribute('id', 'smokeGradientB');
    smokeGradientB.setAttribute('cx', '50%');
    smokeGradientB.setAttribute('cy', '50%');
    smokeGradientB.setAttribute('r', '50%');
    defs.appendChild(smokeGradientB);

    const smokeBStop1 = document.createElementNS(svgNS, 'stop');
    smokeBStop1.setAttribute('offset', '0%');
    smokeBStop1.setAttribute('stop-color', colors.white);
    smokeBStop1.setAttribute('stop-opacity', '0.48');
    smokeGradientB.appendChild(smokeBStop1);

    const smokeBStop2 = document.createElementNS(svgNS, 'stop');
    smokeBStop2.setAttribute('offset', '70%');
    smokeBStop2.setAttribute('stop-color', colors.cyan);
    smokeBStop2.setAttribute('stop-opacity', '0.32');
    smokeGradientB.appendChild(smokeBStop2);

    const smokeBStop3 = document.createElementNS(svgNS, 'stop');
    smokeBStop3.setAttribute('offset', '100%');
    smokeBStop3.setAttribute('stop-color', colors.black);
    smokeBStop3.setAttribute('stop-opacity', '0.0');
    smokeGradientB.appendChild(smokeBStop3);

    const smokePaths = [];
    const createSmokePath = (d, fillId, opacity) => {
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', `url(#${fillId})`);
        path.setAttribute('opacity', opacity.toString());
        path.style.mixBlendMode = 'screen';
        smokeGroup.appendChild(path);
        smokePaths.push(path);
        return path;
    };

    createSmokePath(
        'M-110 470 C -40 395 30 350 105 338 C 165 328 222 300 255 270 C 295 235 318 195 340 165 C 360 135 410 100 468 68 C 540 30 610 -18 700 -90 L 700 640 L -110 640 Z',
        'smokeGradientA',
        0.5
    );
    createSmokePath(
        'M-140 140 C -50 230 30 265 115 255 C 195 245 250 205 295 160 C 330 125 372 98 435 70 C 520 30 610 6 720 -20 L 720 -140 L -140 -140 Z',
        'smokeGradientB',
        0.42
    );
    createSmokePath(
        'M-70 570 C 30 530 105 495 182 470 C 255 446 320 420 370 385 C 425 345 455 315 520 280 C 590 245 665 210 760 160 L 760 780 L -70 780 Z',
        'smokeGradientA',
        0.36
    );
    createSmokePath(
        'M-40 330 C 40 280 120 250 195 238 C 265 226 315 210 350 185 C 385 160 430 125 485 95 C 545 62 620 20 700 -30 L 700 420 L -40 420 Z',
        'smokeGradientB',
        0.28
    );
    createSmokePath(
        'M-160 360 C -70 330 15 320 90 310 C 150 300 210 275 255 245 C 310 210 360 170 415 140 C 470 110 545 72 650 30 L 650 520 L -160 520 Z',
        'smokeGradientA',
        0.26
    );

    const smokeParticleGradient = document.createElementNS(svgNS, 'radialGradient');
    smokeParticleGradient.setAttribute('id', 'smokeParticleGradient');
    smokeParticleGradient.setAttribute('cx', '50%');
    smokeParticleGradient.setAttribute('cy', '50%');
    smokeParticleGradient.setAttribute('r', '50%');
    defs.appendChild(smokeParticleGradient);

    const smokeParticleStop1 = document.createElementNS(svgNS, 'stop');
    smokeParticleStop1.setAttribute('offset', '0%');
    smokeParticleStop1.setAttribute('stop-color', colors.white);
    smokeParticleStop1.setAttribute('stop-opacity', '0.55');
    smokeParticleGradient.appendChild(smokeParticleStop1);

    const smokeParticleStop2 = document.createElementNS(svgNS, 'stop');
    smokeParticleStop2.setAttribute('offset', '60%');
    smokeParticleStop2.setAttribute('stop-color', colors.cyan);
    smokeParticleStop2.setAttribute('stop-opacity', '0.22');
    smokeParticleGradient.appendChild(smokeParticleStop2);

    const smokeParticleStop3 = document.createElementNS(svgNS, 'stop');
    smokeParticleStop3.setAttribute('offset', '100%');
    smokeParticleStop3.setAttribute('stop-color', colors.black);
    smokeParticleStop3.setAttribute('stop-opacity', '0.0');
    smokeParticleGradient.appendChild(smokeParticleStop3);

    const smokeParticleGroup = document.createElementNS(svgNS, 'g');
    smokeParticleGroup.setAttribute('id', 'smokeParticleGroup');
    smokeParticleGroup.style.mixBlendMode = 'screen';
    smokeGroup.appendChild(smokeParticleGroup);

    const smokeParticles = Array.from({ length: 42 }, () => {
        const circle = document.createElementNS(svgNS, 'circle');
        const radius = 8 + Math.random() * 26;
        circle.setAttribute('r', radius.toFixed(2));
        circle.setAttribute('cx', (Math.random() * 520 - 20).toFixed(2));
        circle.setAttribute('cy', (Math.random() * 520 - 20).toFixed(2));
        circle.setAttribute('fill', 'url(#smokeParticleGradient)');
        circle.setAttribute('opacity', (0.15 + Math.random() * 0.25).toFixed(2));
        smokeParticleGroup.appendChild(circle);
        return circle;
    });

    const logoPathString = [
        `M2665 4223 c11 -6 60 -18 109 -26 49 -9 93 -22 97 -29 7 -10 9 -10 9 0 0 6 5 12 11 12 5 0 7 -4 4 -10 -3 -5 0 -7 8 -5 7 3 27 -1 43 -10 16 -8 37 -15 47 -15 9 0 17 -5 17 -11 0 -5 5 -7 10 -4 6 3 10 1 10 -5 0 -6 4 -9 8 -6 5 3 21 -2 36 -10 16 -7 35 -14 42 -14 8 0 14 -4 14 -10 0 -5 7 -6 17 -3 11 4 14 3 9 -5 -5 -8 1 -12 18 -12 13 0 26 -3 28 -7 2 -5 18 -19 37 -32 19 -13 31 -19 27 -12 -10 15 3 14 19 -3 8 -7 11 -17 7 -20 -3 -4 1 -4 11 0 14 5 15 9 6 20 -10 12 -9 13 5 8 9 -3 19 -16 22 -29 3 -12 22 -30 45 -42 22 -11 40 -24 40 -29 -1 -5 3 -9 8 -9 6 0 16 -6 23 -12 6 -7 18 -13 25 -13 7 0 13 -5 13 -11 0 -5 5 -7 12 -3 6 4 8 3 5 -3 -4 -6 0 -16 8 -23 13 -11 14 -10 9 6 -5 15 -2 14 11 -4 9 -13 23 -21 30 -18 9 3 11 -2 8 -15 -4 -15 -2 -18 12 -12 12 4 16 3 11 -5 -6 -11 27 -36 36 -27 3 3 5 -2 5 -10 0 -8 -5 -11 -10 -8 -6 4 -7 1 -3 -6 5 -7 15 -10 23 -7 8 3 12 2 10 -2 -3 -4 9 -20 25 -37 17 -16 28 -25 24 -18 -4 7 0 10 10 9 9 -1 21 -11 26 -22 9 -18 9 -18 -6 0 -12 14 -16 16 -16 5 0 -20 11 -32 43 -49 16 -8 24 -16 18 -18 -7 -2 -3 -12 10 -23 12 -10 19 -19 15 -19 -4 0 -1 -6 6 -14 7 -8 17 -11 22 -8 5 3 6 0 3 -5 -4 -6 4 -18 18 -27 16 -11 22 -22 18 -33 -4 -10 -2 -14 5 -9 6 4 24 -18 45 -54 18 -33 37 -57 40 -53 4 3 8 0 9 -8 0 -8 2 -19 2 -24 2 -14 48 -89 58 -93 4 -2 4 -10 1 -19 -4 -11 -3 -14 6 -9 6 4 11 4 10 -1 -2 -7 6 -27 57 -140 8 -17 14 -36 14 -42 0 -6 5 -11 11 -11 5 0 8 -4 5 -8 -3 -5 2 -28 10 -52 8 -24 12 -50 9 -59 -3 -8 -3 -12 2 -8 10 10 63 -231 55 -251 -3 -9 -1 -13 5 -9 6 4 9 -20 9 -64 -1 -39 1 -72 4 -74 13 -8 -3 -350 -19 -418 -5 -20 -7 -47 -5 -60 4 -21 4 -21 -6 -2 -8 15 -9 10 -4 -22 3 -24 2 -43 -3 -43 -9 0 -39 -97 -35 -112 1 -5 -3 -8 -9 -8 -5 0 -7 -5 -4 -10 4 -6 1 -18 -7 -27 -9 -12 -9 -15 -1 -9 9 5 11 2 7 -8 -3 -9 -10 -16 -16 -16 -5 0 -6 -4 -3 -10 3 -5 1 -10 -5 -10 -7 0 -10 -6 -7 -14 3 -8 -1 -22 -8 -33 -8 -10 -15 -25 -15 -34 0 -9 -7 -22 -15 -29 -8 -7 -13 -16 -10 -20 3 -5 1 -12 -5 -15 -8 -5 -7 -11 1 -21 9 -11 8 -15 -5 -20 -9 -3 -13 -10 -10 -15 3 -5 -3 -6 -12 -2 -13 5 -16 3 -11 -10 3 -9 3 -17 -2 -17 -8 0 -20 -21 -43 -77 -7 -18 -17 -33 -21 -33 -5 0 -5 5 -1 12 4 7 3 8 -5 4 -6 -4 -9 -12 -6 -17 4 -5 -3 -22 -14 -38 -12 -16 -21 -34 -21 -40 0 -6 -11 -18 -25 -27 -14 -9 -25 -23 -25 -30 0 -8 -7 -17 -15 -20 -8 -4 -12 -10 -9 -15 3 -5 0 -9 -6 -9 -6 0 -8 -4 -5 -10 3 -5 1 -10 -5 -10 -6 0 -8 -5 -4 -12 5 -7 2 -9 -7 -6 -10 4 -24 -7 -38 -28 -13 -19 -28 -34 -33 -34 -5 0 -7 -4 -4 -9 3 -5 -2 -15 -11 -22 -11 -10 -14 -10 -9 -2 5 9 2 11 -9 7 -11 -5 -13 -10 -6 -17 12 -12 -8 -37 -25 -30 -7 2 -15 -1 -20 -8 -4 -7 -3 -10 4 -5 6 3 14 2 17 -4 4 -6 3 -9 -2 -8 -11 3 -73 -20 -73 -27 0 -3 4 -4 9 0 5 3 12 1 15 -4 7 -11 -22 -24 -35 -16 -5 4 -6 -2 -2 -11 4 -12 3 -15 -5 -10 -8 4 -10 2 -6 -7 3 -8 0 -18 -6 -22 -6 -3 -10 -3 -9 2 3 20 -2 25 -16 13 -8 -7 -12 -16 -9 -21 3 -5 -3 -6 -12 -2 -13 5 -16 3 -11 -10 3 -9 3 -16 -1 -15 -13 3 -62 -25 -62 -35 0 -6 5 -6 13 0 6 6 21 13 32 16 18 7 19 6 3 -6 -10 -8 -15 -17 -11 -21 4 -4 0 -4 -10 0 -11 4 -17 1 -17 -7 0 -8 -5 -6 -13 6 -11 14 -16 15 -22 5 -6 -9 -4 -11 5 -5 9 5 11 4 6 -4 -4 -6 -11 -9 -15 -6 -5 2 -20 -6 -34 -19 -14 -13 -29 -20 -34 -15 -4 4 -17 1 -27 -7 -20 -14 -20 -14 0 -15 10 -1 23 -1 27 0 5 1 6 -3 3 -7 -3 -5 -18 -7 -32 -4 -22 4 -26 2 -21 -11 4 -10 2 -14 -6 -11 -7 2 -30 -2 -52 -11 -22 -8 -30 -13 -17 -11 12 2 20 0 16 -5 -3 -5 -16 -9 -30 -9 -14 0 -27 -6 -30 -14 -3 -8 -12 -12 -19 -10 -7 3 -30 -4 -51 -15 -21 -12 -44 -21 -51 -21 -7 0 -13 -4 -13 -10 0 -5 -3 -9 -7 -8 -13 4 -103 -24 -109 -33 -8 -14 -26 -10 -18 4 4 6 -2 4 -13 -5 -10 -10 -42 -21 -69 -24 -27 -4 -54 -11 -60 -15 -6 -5 -37 -11 -69 -14 -32 -3 -62 -8 -66 -11 -24 -14 -407 -26 -424 -13 -6 4 -28 6 -50 4 -22 -1 -46 2 -52 7 -7 6 -24 7 -39 4 -14 -4 -23 -3 -20 2 3 5 -7 7 -22 5 -20 -3 -23 -2 -13 5 10 7 5 10 -20 10 -19 0 -54 5 -79 11 -25 6 -60 11 -78 11 -20 0 -31 4 -27 10 7 11 4 12 -39 14 -16 1 -31 7 -33 13 -3 7 -11 9 -20 6 -9 -4 -14 -2 -10 3 3 6 -15 16 -39 23 -25 8 -48 20 -51 28 -4 11 -8 11 -21 1 -12 -10 -14 -10 -8 0 4 7 1 12 -9 12 -10 0 -13 -5 -9 -12 4 -7 3 -8 -5 -4 -6 4 -9 11 -6 16 3 4 -21 18 -53 30 -31 13 -64 31 -72 41 -8 10 -25 20 -38 22 -12 2 -40 20 -61 40 -22 20 -47 37 -56 37 -9 0 -13 5 -10 10 3 6 -3 10 -15 10 -11 0 -23 7 -26 15 -4 8 -10 12 -15 9 -5 -3 -8 0 -7 8 2 7 -3 12 -10 10 -8 -1 -11 2 -8 7 7 11 -22 24 -35 15 -5 -3 -9 4 -9 16 0 12 -4 18 -10 15 -5 -3 -10 -1 -10 5 0 15 -26 41 -33 34 -3 -3 -11 3 -18 15 -10 15 -16 17 -26 9 -10 -8 -12 -7 -8 5 4 9 -3 24 -17 37 -13 11 -23 25 -23 31 0 5 -3 9 -7 9 -5 0 -13 0 -19 0 -8 0 -8 -4 0 -14 9 -11 9 -16 0 -22 -7 -4 -9 -3 -5 4 3 6 2 13 -4 17 -6 4 -8 11 -4 16 3 5 0 17 -8 26 -11 14 -11 16 2 9 8 -4 5 1 -7 12 -12 11 -19 23 -15 27 4 4 -3 6 -14 3 -17 -4 -20 -2 -17 12 3 12 -6 26 -25 40 -20 15 -28 28 -24 38 4 11 1 14 -12 9 -11 -4 -16 -2 -14 6 5 25 -46 92 -63 82 -3 -2 -6 2 -6 9 0 8 7 12 16 10 9 -3 6 1 -6 7 -12 6 -24 21 -27 33 -5 16 -8 18 -15 7 -6 -9 -8 -5 -9 14 0 19 3 23 9 14 5 -8 9 -10 9 -6 0 5 -9 20 -20 34 -11 14 -20 32 -20 39 0 8 -5 13 -12 12 -7 -2 -12 4 -13 12 0 8 -8 30 -18 47 -9 18 -18 35 -18 38 0 2 -3 14 -6 24 -3 11 -4 22 -2 24 2 2 -4 11 -13 21 -10 10 -18 23 -18 29 0 7 4 6 10 -3 5 -8 10 -10 10 -4 0 5 -6 16 -13 22 -6 7 -12 16 -12 20 -1 4 -6 17 -13 29 -7 12 -11 26 -10 30 2 4 -3 22 -9 38 -17 43 -36 143 -37 192 -1 22 -4 39 -8 37 -3 -2 -8 20 -11 49 -6 63 -1 462 6 497 3 14 13 63 22 110 9 47 26 110 37 140 11 30 21 60 22 65 6 32 40 122 51 135 6 8 15 22 19 30 4 8 0 6 -8 -4 -26 -32 -18 -10 13 36 15 24 31 56 35 71 4 15 11 25 16 22 6 -3 7 1 4 9 -4 9 0 18 9 21 9 4 13 18 11 40 -2 37 10 55 20 29 4 -10 2 -13 -6 -8 -7 4 -8 3 -4 -5 10 -15 22 -7 29 19 3 13 1 18 -6 13 -7 -3 -4 3 7 15 10 12 23 19 29 15 6 -3 7 -1 3 6 -10 15 13 43 27 34 6 -4 7 -1 3 6 -5 8 11 34 41 69 28 31 55 67 62 80 7 12 16 20 22 17 5 -4 9 -1 9 6 0 14 56 70 63 63 2 -3 8 7 11 21 4 14 11 23 16 20 6 -3 10 1 10 9 0 8 4 18 10 21 6 3 7 -1 4 -12 -3 -10 2 -6 11 10 8 15 19 27 24 27 12 0 76 60 76 72 0 6 8 12 18 14 10 1 27 10 38 20 10 9 19 13 19 8 0 -5 7 2 16 14 8 12 19 20 23 17 5 -2 16 4 26 15 10 11 22 17 28 13 5 -3 7 -1 3 5 -3 5 0 13 6 16 7 4 3 4 -10 2 -12 -2 -20 0 -16 5 8 14 44 11 45 -3 0 -10 2 -10 6 0 2 6 11 12 19 12 8 0 14 4 14 10 0 5 7 6 17 3 10 -4 14 -2 10 4 -6 10 40 38 56 35 4 -1 10 4 13 12 3 8 11 13 18 10 6 -2 27 7 46 21 19 14 41 25 51 25 9 0 33 7 53 15 19 8 41 14 48 13 7 -2 12 3 11 9 -2 7 0 12 5 11 4 -1 26 1 50 5 28 5 41 11 36 19 -4 6 -3 8 3 5 5 -3 36 0 69 7 32 7 76 14 97 15 21 1 62 8 90 16 63 18 519 15 552 -2z m-598 1 c-3 -3 -12 -4 -19 -1 -8 3 -5 6 6 6 11 1 17 -2 13 -5z`,
        `M2155 4127 c-49 -4 -97 -8 -105 -9 -8 -1 -21 -7 -28 -15 -7 -7 -30 -14 -50 -15 -20 0 -41 -2 -47 -3 -58 -13 -75 -19 -75 -26 0 -5 -5 -9 -11 -9 -6 0 -7 6 -2 13 4 6 -5 4 -20 -6 -14 -9 -34 -18 -44 -20 -41 -7 -123 -39 -123 -48 0 -6 -4 -8 -9 -4 -5 3 -12 1 -16 -5 -3 -5 -15 -10 -26 -10 -10 0 -19 -4 -19 -8 0 -5 -19 -17 -42 -28 -24 -10 -45 -21 -48 -24 -8 -10 -44 -23 -60 -22 -11 1 -11 0 -2 -4 18 -8 -4 -34 -30 -34 -10 0 -21 -6 -24 -14 -3 -8 -14 -13 -25 -11 -10 2 -18 -1 -16 -8 1 -7 -4 -11 -10 -10 -7 2 -13 -2 -13 -8 0 -5 -4 -8 -9 -5 -5 3 -25 -12 -45 -34 -20 -22 -36 -38 -36 -35 0 3 -11 -5 -25 -17 -13 -11 -21 -26 -18 -31 4 -6 0 -8 -9 -5 -8 4 -22 -2 -31 -13 -9 -10 -14 -19 -10 -19 3 0 -3 -8 -15 -18 -17 -15 -19 -21 -9 -31 9 -10 8 -11 -7 -5 -16 6 -18 4 -13 -12 7 -19 7 -19 -8 0 -13 17 -15 18 -15 3 0 -9 -4 -17 -10 -17 -5 0 -10 -6 -10 -14 0 -8 -8 -17 -17 -19 -16 -4 -15 -5 1 -6 20 -1 20 -1 0 -17 -10 -8 -13 -12 -5 -8 10 5 12 3 7 -5 -6 -8 -11 -9 -20 -2 -10 8 -18 5 -32 -11 -13 -14 -14 -19 -4 -14 8 4 6 0 -4 -8 -11 -9 -16 -16 -10 -16 5 0 1 -5 -9 -11 -14 -8 -16 -14 -7 -24 10 -12 8 -13 -9 -10 -12 2 -19 0 -16 -4 2 -5 -2 -14 -10 -21 -8 -7 -15 -19 -15 -27 0 -8 -5 -11 -12 -7 -7 5 -9 0 -6 -14 5 -16 2 -19 -11 -15 -9 4 -13 2 -8 -2 4 -5 1 -15 -6 -24 -21 -25 -71 -114 -60 -108 5 3 10 0 10 -7 0 -9 -7 -12 -16 -8 -14 5 -14 4 -1 -13 9 -11 10 -16 3 -11 -8 4 -13 2 -13 -7 0 -8 -7 -20 -15 -27 -8 -7 -20 -30 -27 -51 -6 -22 -17 -44 -25 -50 -7 -6 -13 -16 -13 -22 0 -6 6 -3 13 7 13 17 14 12 8 -47 -1 -5 -5 -6 -9 -3 -4 2 -14 -4 -21 -16 -10 -16 -10 -19 1 -12 11 6 11 5 0 -8 -7 -9 -14 -29 -15 -46 -1 -16 -5 -28 -8 -26 -7 4 -24 -83 -20 -103 1 -7 -3 -13 -8 -13 -5 0 -10 -8 -10 -17 0 -10 -2 -38 -5 -63 -11 -84 -14 -375 -5 -435 5 -33 9 -79 10 -103 1 -23 5 -45 10 -48 5 -3 9 -13 9 -23 0 -10 7 -51 16 -91 11 -48 19 -67 25 -58 12 19 11 1 -1 -23 -8 -15 -7 -21 4 -25 12 -5 24 -34 32 -79 6 -32 18 -54 27 -48 6 3 7 1 3 -5 -8 -13 58 -152 80 -168 12 -10 12 -13 2 -18 -7 -3 -2 -4 12 -2 24 5 24 4 6 -9 -11 -8 -15 -15 -8 -15 15 0 44 -55 34 -65 -4 -5 -2 -6 4 -2 5 3 18 -10 29 -29 10 -19 22 -34 28 -34 5 0 6 -8 3 -17 -4 -10 -4 -14 0 -10 9 9 64 -55 57 -67 -3 -5 -1 -6 4 -3 6 4 17 -1 24 -10 12 -14 12 -16 -1 -8 -13 8 -13 7 -1 -9 8 -9 22 -21 32 -27 15 -8 18 -6 13 8 -5 14 -4 15 4 4 6 -8 8 -20 5 -27 -2 -6 5 -18 16 -26 12 -8 18 -18 14 -21 -3 -4 1 -7 9 -7 9 0 18 -7 22 -15 3 -8 12 -15 20 -15 8 0 19 -6 23 -13 4 -8 17 -19 28 -26 15 -9 16 -11 3 -7 -10 3 -18 1 -18 -4 0 -6 5 -11 10 -11 11 -2 25 -5 38 -9 4 -1 11 -2 16 -1 5 1 3 -6 -5 -15 -10 -13 -11 -16 -1 -10 9 5 21 0 33 -13 11 -12 24 -19 29 -16 5 3 17 -5 27 -18 24 -31 110 -90 172 -118 28 -12 47 -27 44 -32 -3 -6 -1 -7 5 -4 14 9 43 -3 36 -14 -3 -5 2 -6 10 -3 9 3 16 2 16 -4 0 -6 22 -16 50 -23 27 -7 47 -16 45 -20 -3 -3 6 -6 20 -6 13 0 42 -10 65 -22 43 -22 65 -28 40 -10 -12 9 -11 9 5 4 11 -4 40 -15 65 -23 25 -8 52 -18 60 -22 8 -4 28 -6 43 -4 15 1 25 0 23 -4 -2 -4 19 -8 46 -10 28 -2 60 -8 71 -13 14 -8 18 -8 13 0 -4 7 1 11 13 11 12 0 21 -4 21 -9 0 -10 348 -10 365 1 6 3 35 9 65 13 81 10 88 12 169 33 40 11 78 25 84 31 6 6 16 11 21 11 6 0 4 -5 -4 -10 -10 -7 -11 -10 -2 -10 7 0 15 6 18 14 3 8 15 11 31 8 20 -4 24 -2 18 8 -5 8 -4 11 3 6 6 -3 26 2 45 13 19 11 39 17 43 13 5 -4 3 0 -3 8 -9 12 -7 15 14 17 19 1 22 -1 12 -8 -8 -5 -9 -9 -3 -9 6 0 21 9 34 20 12 11 26 17 31 15 4 -3 10 -1 14 5 4 6 11 7 17 4 7 -4 8 -2 4 4 -6 11 6 16 27 13 4 0 7 4 7 10 0 6 7 8 16 5 8 -3 12 -2 9 4 -3 6 1 10 9 10 9 0 16 5 16 11 0 6 7 9 15 6 8 -4 17 -1 21 5 5 7 2 8 -6 3 -8 -5 -11 -4 -7 2 3 5 24 18 47 28 22 10 40 24 40 31 0 7 5 16 12 20 7 4 8 3 4 -4 -12 -19 20 -14 35 6 13 16 13 16 -6 2 -19 -14 -19 -14 -4 5 9 11 19 27 22 35 4 12 6 12 6 -2 1 -11 6 -15 16 -12 13 5 13 8 0 21 -19 18 -19 20 0 20 8 0 12 -4 9 -9 -11 -17 9 -7 27 14 17 21 19 21 13 3 -3 -12 1 -9 11 8 8 15 20 27 25 27 6 0 10 8 10 18 0 14 2 15 10 2 8 -13 10 -13 10 2 0 9 9 20 21 23 11 4 18 9 15 12 -3 3 6 14 19 25 15 11 22 25 18 31 -4 7 2 5 12 -3 10 -8 16 -10 12 -4 -3 6 5 22 19 37 14 15 22 32 18 39 -4 6 -3 8 3 5 11 -7 43 27 43 48 0 7 4 17 10 20 6 4 7 -1 4 -12 -3 -10 3 -4 13 12 11 17 19 33 19 36 -1 3 6 13 14 22 31 34 36 43 32 55 -2 8 2 10 14 5 11 -4 15 -3 11 4 -10 15 3 44 15 37 6 -4 9 -1 6 7 -3 8 2 20 11 27 9 8 10 10 2 7 -9 -5 -8 1 4 19 17 26 33 37 19 14 -4 -8 -3 -9 2 -5 5 5 9 14 9 20 2 27 18 67 27 67 6 0 5 7 -2 16 -11 12 -11 15 0 12 7 -2 18 12 24 30 6 18 14 31 17 28 3 -3 6 0 7 7 0 6 3 23 7 37 3 14 7 30 8 35 2 6 5 15 8 20 4 6 14 42 24 80 9 39 20 77 23 85 6 16 6 16 16 100 4 30 11 80 16 110 7 45 12 134 11 213 -1 43 -13 163 -23 222 -6 39 -10 78 -9 89 2 11 -2 16 -8 12 -7 -5 -11 6 -11 31 0 37 -16 94 -34 122 -6 10 -5 12 2 7 7 -4 12 -2 12 3 0 6 -4 11 -10 11 -5 0 -10 6 -10 14 0 18 -67 198 -77 205 -4 3 -15 15 -23 25 -12 16 -12 18 -1 11 9 -5 8 2 -5 24 -10 17 -22 31 -26 31 -4 0 -7 3 -6 8 2 7 -21 53 -31 62 -3 3 -15 21 -25 40 -22 39 -46 61 -59 53 -5 -3 -4 4 2 15 8 15 8 23 -1 28 -7 4 -8 3 -4 -4 4 -7 5 -12 1 -12 -3 0 -10 12 -15 26 -8 21 -15 25 -36 21 -28 -5 -54 26 -32 39 6 4 8 3 5 -2 -3 -6 -2 -16 3 -23 6 -11 11 -8 20 9 8 15 8 20 1 16 -6 -4 -11 0 -11 9 0 11 -5 15 -16 11 -10 -4 -13 -2 -8 6 4 6 0 16 -8 22 -8 6 -17 19 -21 29 -4 10 -11 15 -17 12 -5 -3 -10 -2 -10 4 0 5 -9 13 -20 16 -11 4 -18 11 -15 16 4 5 -1 12 -9 15 -9 3 -13 11 -9 17 3 6 1 7 -5 3 -6 -3 -16 3 -22 14 -6 11 -16 17 -22 14 -7 -5 -9 -2 -6 8 7 18 -25 41 -39 27 -16 -16 -43 1 -40 24 1 13 -3 21 -10 20 -7 -2 -10 4 -7 12 5 11 2 13 -12 8 -11 -4 -15 -3 -11 4 4 6 -14 21 -38 33 -25 13 -45 27 -45 32 0 5 -4 7 -9 4 -5 -4 -22 7 -37 23 -15 16 -33 27 -41 24 -7 -3 -13 0 -13 6 0 6 -8 11 -19 11 -10 0 -24 7 -31 15 -7 8 -16 13 -20 10 -4 -3 -11 3 -14 12 -5 12 -9 14 -18 5 -7 -7 -17 -12 -23 -12 -5 0 -4 4 3 9 10 6 7 11 -15 19 -15 6 -47 20 -71 31 -24 12 -40 15 -36 8 4 -7 -2 -4 -14 7 -12 11 -28 16 -38 12 -12 -5 -15 -2 -10 11 6 15 5 16 -5 6 -7 -7 -22 -13 -33 -13 -17 0 -18 2 -6 10 8 5 11 10 5 11 -30 3 -137 26 -181 40 -17 5 -39 6 -49 2 -10 -3 -16 -2 -13 3 4 5 -15 10 -40 11 -129 7 -357 7 -437 0z m-500 -167 c3 -6 -1 -7 -9 -4 -18 7 -21 14 -7 14 6 0 13 -4 16 -10z m1600 -59 c3 -5 1 -12 -5 -16 -5 -3 -10 1 -10 9 0 18 6 21 15 7z m-1973 -141 c-30 -29 -40 -25 -12 5 13 14 26 23 28 20 3 -3 -4 -14 -16 -25z m-8 -42 c-3 -4 -11 -5 -19 -1 -21 7 -19 12 4 10 11 0 18 -5 15 -9z m-111 -73 c-4 -11 -1 -13 11 -9 9 3 16 2 16 -3 0 -5 -10 -9 -23 -9 -13 0 -24 6 -24 13 0 7 4 13 9 13 5 0 6 5 2 12 -4 7 -3 8 4 4 6 -4 9 -13 5 -21z m91 -111 c9 -3 16 -13 16 -21 0 -8 4 -12 9 -9 7 5 24 -48 18 -58 -1 -1 4 -10 11 -18 16 -20 62 -110 62 -122 0 -5 8 -18 18 -29 9 -11 11 -17 5 -13 -9 5 -11 2 -7 -8 3 -9 10 -14 14 -11 10 6 22 -24 14 -36 -3 -5 -1 -9 3 -9 5 0 17 -13 26 -30 10 -16 15 -30 11 -30 -4 0 5 -11 20 -25 14 -13 26 -30 26 -37 -1 -7 -7 -2 -15 12 -11 19 -14 21 -15 8 0 -10 10 -27 23 -39 12 -12 15 -18 7 -14 -10 6 -8 1 4 -13 11 -12 15 -22 11 -22 -4 0 0 -9 10 -20 10 -11 15 -20 10 -20 -4 0 1 -8 12 -17 10 -10 13 -14 7 -10 -9 6 -11 2 -7 -12 3 -12 10 -21 15 -21 5 0 7 -4 4 -9 -3 -4 3 -16 14 -26 11 -10 20 -22 20 -28 0 -5 13 -36 30 -68 16 -33 28 -59 25 -59 -2 0 12 -27 31 -60 19 -33 36 -70 37 -81 1 -12 6 -18 15 -14 9 3 12 -1 7 -15 -3 -11 -1 -28 5 -37 11 -17 11 -17 6 0 -4 11 -2 16 5 11 6 -3 9 -15 6 -25 -3 -11 -1 -19 5 -19 6 0 7 -7 4 -16 -3 -8 -2 -12 4 -9 6 3 10 -1 10 -9 0 -9 5 -16 11 -16 5 0 7 -5 3 -12 -5 -7 -2 -9 7 -6 10 4 15 -1 15 -12 0 -10 -5 -16 -10 -12 -6 3 0 -8 12 -25 12 -17 20 -32 19 -35 -1 -2 5 4 14 14 9 9 19 14 23 11 3 -4 6 0 6 8 0 8 9 21 19 29 11 7 18 17 15 21 -3 5 4 14 16 21 11 7 20 18 20 24 0 6 16 24 35 40 19 16 35 36 35 44 0 13 1 13 10 0 9 -13 10 -13 10 1 0 8 9 25 20 37 11 12 20 27 20 34 0 9 3 9 10 -2 8 -13 10 -12 10 3 0 9 5 17 10 17 6 0 10 6 10 14 0 8 10 22 22 30 12 9 18 16 13 16 -6 0 -2 5 8 11 9 5 17 15 17 20 0 6 -5 7 -12 3 -7 -4 -8 -3 -4 5 6 9 12 9 24 -1 10 -7 14 -9 10 -4 -4 5 17 36 46 70 29 33 56 69 59 79 4 9 12 17 19 17 9 0 8 -3 -2 -10 -8 -5 -11 -10 -6 -10 6 0 20 9 32 21 l22 21 11 -21 c7 -12 19 -21 29 -21 13 0 14 -2 3 -9 -10 -7 -9 -11 8 -23 11 -8 20 -17 18 -19 -1 -2 3 2 9 9 9 10 12 6 12 -14 0 -15 7 -31 16 -36 9 -5 22 -16 29 -24 6 -8 34 -38 62 -66 27 -29 43 -48 35 -43 -8 4 0 -7 17 -25 18 -18 30 -36 27 -41 -3 -5 2 -6 11 -3 11 5 14 2 8 -12 -4 -12 -3 -15 5 -10 8 4 12 0 12 -11 0 -12 3 -14 8 -6 5 8 16 -1 32 -27 14 -22 28 -40 32 -40 5 0 8 -7 8 -16 0 -8 4 -13 8 -10 5 3 16 -8 26 -25 9 -16 22 -27 27 -23 5 3 7 9 5 13 -7 10 32 7 41 -4 5 -4 2 -4 -6 0 -11 6 -13 4 -7 -10 5 -15 4 -16 -9 -5 -23 19 -20 -6 5 -37 11 -14 20 -21 20 -15 0 6 6 9 14 6 8 -3 19 3 25 15 16 30 13 40 -4 11 -8 -14 -14 -20 -15 -15 0 6 7 21 16 33 8 12 12 28 8 35 -5 7 0 6 11 -3 10 -8 16 -10 12 -3 -4 6 0 19 9 28 9 9 14 19 10 22 -3 3 2 12 12 20 9 8 12 12 6 9 -6 -3 -11 1 -11 9 0 8 4 12 9 9 4 -3 8 2 8 11 0 10 5 13 12 9 7 -5 9 -2 6 7 -3 8 0 23 8 34 8 10 14 29 14 41 0 13 4 26 10 29 6 3 7 -1 4 -12 -5 -17 -5 -17 6 0 6 9 8 22 5 27 -3 6 -2 10 3 10 5 0 12 14 16 31 3 17 10 28 15 25 5 -3 11 8 15 26 3 17 14 37 24 45 9 8 11 12 5 8 -15 -7 65 156 81 167 6 4 7 8 3 8 -4 0 13 40 38 90 42 79 51 104 54 133 1 5 5 6 10 3 5 -3 15 15 22 40 8 25 21 53 29 62 8 9 15 23 16 30 2 29 5 33 15 26 7 -4 10 -1 7 7 -3 8 5 30 18 50 13 20 21 48 20 63 -2 15 -1 24 2 21 3 -3 16 4 28 16 29 27 75 23 89 -8 5 -13 13 -23 18 -23 4 0 5 -5 2 -10 -4 -6 -6 -452 -6 -991 1 -775 -2 -980 -12 -976 -9 3 -13 220 -15 1006 l-2 1002 -23 -3 c-26 -4 -14 19 -266 -503 -103 -214 -225 -466 -270 -559 -44 -92 -81 -172 -81 -177 0 -19 -17 -5 -73 60 -32 37 -68 79 -80 92 -191 211 -377 431 -372 439 3 6 2 10 -4 10 -5 0 -67 -66 -138 -147 -70 -81 -149 -170 -174 -198 -25 -27 -85 -96 -133 -152 -48 -57 -90 -103 -94 -102 -4 0 -53 95 -110 212 -147 305 -286 593 -396 822 -73 152 -101 201 -116 203 -20 3 -20 0 -20 -1001 0 -853 -2 -1006 -14 -1010 -8 -3 -16 2 -19 15 -3 11 -5 462 -4 1002 2 856 4 984 17 998 15 18 46 23 74 12z m107 -354 c59 -124 156 -326 216 -450 60 -124 138 -285 173 -358 l63 -132 -25 -28 c-13 -15 -103 -117 -199 -227 -273 -315 -352 -405 -356 -405 -2 0 -3 422 -2 938 0 690 3 930 11 912 6 -14 60 -126 119 -250z m2154 -670 c0 -517 -2 -940 -4 -940 -2 0 -13 12 -25 27 -11 15 -71 84 -131 153 -190 215 -399 455 -413 471 -10 14 3 48 84 215 53 110 119 246 146 304 28 58 111 228 184 379 74 151 134 275 134 277 0 6 20 54 22 54 2 0 3 -423 3 -940z m-2646 744 c-6 -8 -17 -14 -23 -14 -6 0 -3 5 7 11 9 6 14 15 11 21 -4 7 -2 8 5 4 9 -6 9 -11 0 -22z m-118 -187 c-10 -9 -11 -8 -5 6 3 10 9 15 12 12 3 -3 0 -11 -7 -18z m1644 -246 c21 -30 39 -51 324 -375 l174 -197 -63 -127 -63 -127 -398 3 -399 2 -61 126 -61 126 25 27 c13 14 37 42 54 61 17 19 111 127 209 240 99 113 190 220 204 237 14 18 27 32 30 32 3 1 14 -12 25 -28z m-541 -819 c-41 -2 -107 -2 -148 0 l-74 3 96 109 96 108 51 -108 52 -109 -73 -3z m1119 135 c-3 -5 -1 -7 4 -4 6 4 39 -25 73 -63 l62 -70 -149 0 -149 0 54 110 54 111 29 -37 c16 -20 26 -41 22 -47z m-917 -397 c63 -129 152 -314 199 -411 47 -97 92 -194 101 -214 l16 -38 38 84 c21 46 67 143 102 214 35 72 116 237 178 368 l114 237 162 0 162 0 197 -225 c109 -124 206 -230 217 -236 24 -13 23 -24 -2 -26 -11 -1 -18 2 -15 8 4 5 0 9 -7 9 -7 0 -19 9 -26 20 -7 12 -18 18 -25 14 -7 -4 -9 -4 -6 0 4 4 -6 21 -22 38 -15 17 -26 35 -23 40 3 4 -3 5 -12 1 -12 -4 -15 -3 -10 5 4 7 1 12 -9 12 -9 0 -15 5 -13 12 3 7 -14 26 -36 43 -23 17 -41 37 -41 44 0 6 -11 21 -25 31 -14 11 -19 20 -12 20 7 0 10 5 7 11 -5 7 -14 4 -28 -8 -12 -9 -16 -11 -9 -3 16 19 15 30 -3 30 -13 0 -19 11 -17 31 1 3 -9 4 -22 2 -13 -3 -28 2 -35 11 -8 9 -10 16 -6 16 5 0 0 9 -9 19 -13 14 -14 21 -5 27 8 5 10 3 4 -6 -6 -9 -4 -11 4 -5 19 11 -2 26 -43 30 -19 2 -41 7 -47 11 -8 4 -9 3 -5 -4 5 -8 -4 -12 -31 -11 -37 1 -38 1 -8 9 20 5 2 7 -51 6 -46 0 -80 -5 -76 -10 3 -5 0 -6 -6 -2 -20 12 -57 -12 -79 -53 -12 -23 -18 -39 -12 -35 8 4 8 1 0 -13 -6 -11 -7 -24 -3 -29 4 -5 -2 -2 -12 6 -18 14 -19 14 -8 -6 13 -25 7 -35 -16 -27 -10 4 -14 3 -10 -2 4 -4 3 -16 -2 -26 -6 -10 -11 -30 -12 -45 -2 -16 -10 -29 -20 -32 -10 -2 -18 -10 -18 -16 0 -7 -10 -32 -22 -57 -22 -43 -28 -66 -29 -102 0 -9 -4 -15 -8 -12 -5 2 -17 -5 -27 -16 -11 -12 -17 -22 -15 -23 3 -1 -31 -81 -52 -121 -6 -11 -21 -39 -32 -62 -12 -24 -26 -39 -31 -35 -4 4 -2 -2 6 -12 8 -11 10 -17 5 -14 -6 4 -15 -5 -22 -18 -8 -18 -8 -22 0 -17 7 3 9 3 5 -2 -4 -4 -2 -15 5 -23 6 -9 7 -13 1 -9 -13 8 -79 -54 -69 -65 2 -2 -5 -9 -15 -16 -16 -10 -18 -9 -13 5 5 13 2 15 -12 9 -11 -4 -16 -4 -12 0 4 4 -1 13 -11 21 -10 9 -11 12 -2 7 11 -6 10 -2 -2 13 -10 11 -18 27 -18 37 0 9 -4 15 -9 12 -10 -7 -24 40 -16 53 2 5 -3 8 -12 7 -10 0 -18 6 -18 14 0 8 -13 43 -29 77 -15 34 -28 65 -27 68 1 3 -5 13 -14 21 -8 9 -13 20 -10 25 3 5 -3 19 -14 31 -12 12 -21 30 -21 40 0 10 -5 18 -11 18 -5 0 -7 5 -4 10 3 6 2 10 -4 10 -9 0 -32 55 -30 74 0 5 -3 12 -8 15 -14 10 -39 45 -26 38 7 -5 9 0 6 13 -3 11 -11 20 -19 20 -7 0 -19 19 -25 43 -7 23 -21 54 -31 69 -10 14 -18 33 -18 42 0 9 -5 16 -12 16 -6 0 -9 3 -5 6 3 4 0 19 -8 34 -12 23 -24 29 -85 40 -55 10 -82 11 -114 3 -22 -7 -57 -9 -76 -7 -28 4 -42 0 -63 -20 -17 -16 -22 -26 -14 -29 7 -3 4 -6 -6 -6 -11 -1 -15 -6 -11 -13 4 -6 3 -8 -4 -4 -6 3 -13 2 -17 -4 -4 -6 -11 -7 -17 -4 -7 4 -8 2 -4 -5 9 -14 -48 -73 -59 -63 -4 4 -6 0 -3 -8 3 -8 -8 -27 -24 -42 -19 -16 -27 -31 -22 -39 4 -8 3 -10 -4 -5 -7 4 -12 2 -12 -4 0 -6 -4 -9 -9 -5 -6 3 -15 -5 -22 -17 -7 -13 -19 -28 -27 -34 -9 -7 -12 -16 -7 -24 5 -7 4 -11 -1 -7 -13 8 -47 -20 -39 -32 3 -6 -1 -11 -10 -11 -10 0 -13 -5 -9 -12 5 -7 2 -9 -9 -5 -12 4 -14 2 -10 -10 4 -11 2 -14 -5 -9 -7 4 -12 5 -12 2 0 -2 -3 -13 -6 -23 -5 -15 -4 -16 6 -3 10 13 11 13 7 0 -2 -8 -10 -14 -16 -12 -6 1 -11 -2 -11 -8 0 -5 -9 -10 -20 -10 -26 0 -26 20 -1 27 11 3 21 13 23 23 2 10 88 116 192 234 l189 216 165 -2 165 -3 113 -235z m702 233 c-2 -5 -20 -42 -40 -83 -20 -41 -95 -196 -168 -345 -72 -148 -141 -291 -152 -317 -22 -52 -33 -59 -43 -27 -4 11 -47 104 -97 207 -50 103 -132 274 -184 380 l-93 192 391 0 c214 0 388 -3 386 -7z m-935 -30 c-7 -2 -21 -2 -30 0 -10 3 -4 5 12 5 17 0 24 -2 18 -5z m-423 -273 c0 -5 -5 -10 -11 -10 -5 0 -7 5 -4 10 3 6 8 10 11 10 2 0 4 -4 4 -10z`,
        `M1260 3185 c-5 -195 -6 -1547 -1 -1533 2 7 32 39 65 72 34 32 55 55 47 51 -10 -6 -12 -4 -5 6 5 8 9 18 9 24 0 5 7 10 16 10 18 0 51 30 42 39 -4 3 1 6 10 6 16 0 50 52 42 64 -3 3 -2 4 1 2 9 -6 54 36 49 45 -3 4 4 11 15 14 17 5 19 10 9 21 -9 12 -6 16 20 25 22 8 30 16 27 26 -3 8 -2 12 2 9 4 -2 28 19 54 47 25 29 62 70 82 92 19 22 36 45 36 52 0 17 -17 25 -23 11 -3 -7 -6 -1 -6 15 -1 15 -5 35 -10 45 -5 9 -12 25 -15 35 -3 10 -10 16 -15 13 -4 -3 -8 5 -8 17 1 12 -10 40 -24 62 -13 22 -23 43 -21 48 1 4 -3 7 -9 7 -5 0 -7 5 -4 10 3 6 1 10 -5 10 -6 0 -9 4 -6 9 3 5 -4 20 -15 35 -11 14 -17 31 -13 37 4 7 3 9 -3 6 -6 -4 -13 5 -16 21 -3 15 -15 37 -27 50 -11 12 -18 27 -14 33 3 6 -3 23 -13 38 -11 14 -24 38 -28 51 -4 14 -14 29 -21 35 -7 5 -15 22 -18 37 -2 14 -9 35 -15 46 -6 11 -7 23 -3 27 4 5 1 5 -5 1 -11 -6 -18 6 -10 18 1 3 -8 15 -21 29 -13 13 -22 31 -20 38 2 8 -2 13 -9 12 -6 -1 -10 5 -9 15 3 19 -41 119 -62 141 -7 7 -11 20 -8 28 3 8 1 11 -4 8 -6 -3 -10 3 -10 15 0 12 -4 19 -9 15 -5 -3 -12 5 -14 17 -2 13 -6 -35 -7 -107z m203 -1275 c3 -10 -1 -24 -8 -30 -10 -9 -13 -7 -10 7 2 10 4 24 4 31 1 18 8 15 14 -8z`,
        `M3474 3292 c-6 -4 -15 -22 -19 -40 -4 -21 -12 -32 -19 -29 -15 6 -17 -23 -3 -40 11 -16 -5 -39 -35 -49 -12 -3 -17 -11 -14 -20 4 -10 2 -12 -6 -8 -7 5 -9 2 -5 -9 3 -9 3 -17 -1 -19 -4 -2 -16 -18 -26 -37 -10 -19 -14 -31 -7 -27 8 6 8 1 0 -18 -7 -14 -16 -23 -22 -19 -5 3 -6 -3 -2 -16 4 -15 3 -21 -6 -19 -7 2 -13 -1 -14 -7 0 -5 -7 -21 -14 -33 -7 -13 -10 -26 -7 -29 3 -3 -5 -14 -17 -24 -12 -10 -19 -18 -14 -19 9 0 -39 -96 -52 -105 -6 -3 -8 -12 -5 -19 3 -8 1 -17 -5 -21 -14 -8 -63 -113 -66 -138 -1 -11 -7 -22 -14 -27 -7 -4 -12 -10 -12 -14 3 -22 -1 -35 -19 -54 -11 -12 -20 -28 -20 -37 0 -9 -6 -18 -14 -21 -8 -3 -13 -16 -11 -30 1 -14 0 -22 -3 -20 -10 10 -33 -24 -35 -53 -1 -16 -5 -27 -8 -25 -7 4 -22 -26 -19 -36 1 -3 8 -4 17 -2 9 2 12 -1 8 -8 -4 -7 8 -25 28 -43 19 -18 37 -40 40 -49 4 -10 21 -27 39 -38 18 -11 29 -20 24 -20 -4 0 5 -15 20 -33 16 -18 37 -44 47 -57 10 -14 15 -19 11 -11 -4 8 -3 12 3 8 6 -4 16 -20 23 -37 10 -24 15 -28 26 -19 11 9 15 8 20 -4 3 -9 3 -20 0 -26 -4 -5 3 -12 14 -16 11 -4 17 -11 14 -17 -5 -7 -1 -9 8 -5 22 8 30 -3 15 -21 -10 -13 -9 -14 11 -3 22 12 23 11 12 -9 -8 -15 -8 -20 -1 -16 6 4 11 1 11 -8 0 -8 11 -23 25 -34 13 -11 22 -21 20 -24 -2 -2 4 -4 14 -4 11 0 17 6 14 13 -3 7 -8 11 -13 8 -4 -2 -15 2 -25 9 -17 12 -17 13 4 11 12 -1 26 -6 31 -11 13 -13 22 -57 11 -50 -4 3 -8 -1 -8 -8 0 -8 6 -12 13 -9 6 2 15 -1 20 -8 5 -8 3 -10 -7 -5 -8 4 -6 1 4 -7 10 -9 18 -18 18 -21 -2 -11 13 -8 17 3 2 6 -1 11 -7 11 -6 0 -8 7 -4 16 9 25 9 1574 0 1574 -4 0 -3 9 3 20 12 22 11 23 -6 12z m-467 -994 c-3 -8 -6 -5 -6 6 -1 11 2 17 5 13 3 -3 4 -12 1 -19z m-17 -52 c0 -2 -7 -7 -16 -10 -8 -3 -12 -2 -9 4 6 10 25 14 25 6z`,
        `M3404 3159 c-19 -22 -19 -22 4 -10 12 6 22 16 22 21 0 15 -5 12 -26 -11z`,
        `M2361 2791 c-7 -5 -11 -13 -8 -18 4 -6 -7 -20 -23 -32 -26 -18 -29 -19 -25 -4 3 10 -1 6 -8 -10 -7 -15 -16 -25 -19 -21 -3 3 -9 -4 -13 -15 -3 -12 -11 -21 -16 -21 -6 0 -8 -4 -5 -8 3 -5 -4 -14 -14 -22 -10 -8 -17 -17 -14 -22 3 -4 1 -8 -4 -8 -13 0 -82 -67 -82 -79 0 -6 -4 -11 -10 -11 -5 0 -10 -5 -10 -11 0 -5 5 -7 10 -4 6 3 10 4 10 1 0 -3 -16 -12 -36 -21 -19 -8 -33 -19 -29 -25 3 -5 1 -10 -4 -10 -6 0 -11 -5 -11 -11 0 -5 5 -7 12 -3 7 4 8 3 4 -5 -6 -9 -12 -9 -24 1 -10 7 -14 8 -10 4 4 -5 -8 -26 -27 -48 -19 -21 -35 -45 -35 -53 0 -8 -6 -12 -13 -9 -13 5 -51 -50 -53 -77 -1 -9 -4 -21 -8 -28 -4 -6 -2 -11 4 -11 7 0 9 -7 6 -16 -3 -8 -2 -13 3 -10 5 3 12 -6 15 -20 10 -37 36 -75 48 -68 6 4 5 -3 -1 -15 -8 -14 -8 -21 -1 -21 5 0 9 -5 8 -11 -2 -6 6 -13 17 -15 11 -2 183 -4 383 -4 335 0 411 5 389 26 -4 4 0 16 10 26 9 10 13 18 9 18 -4 0 4 15 18 33 15 19 26 41 26 50 0 9 4 18 9 21 12 8 21 46 10 46 -5 0 -10 -10 -10 -22 -1 -18 -2 -19 -6 -5 -3 10 0 24 7 31 8 11 4 19 -17 36 -15 12 -22 18 -14 14 10 -5 12 -3 7 5 -5 7 -11 10 -14 7 -11 -11 -41 26 -34 42 5 15 4 16 -13 2 -17 -14 -18 -13 -12 2 3 10 3 17 -1 17 -19 -3 -25 2 -13 10 12 8 10 12 -12 22 -20 9 -24 15 -15 21 9 5 8 8 -5 8 -10 0 -15 5 -12 10 4 6 1 9 -6 8 -7 -2 -17 6 -23 17 -7 13 -19 19 -31 17 l-20 -4 20 15 c19 15 19 16 1 23 -11 4 -21 2 -27 -7 -6 -9 -9 -10 -9 -2 0 6 5 15 10 18 6 4 8 11 4 16 -8 14 -35 -10 -27 -25 3 -6 2 -8 -2 -3 -5 4 -10 18 -12 30 -2 17 -1 19 7 7 6 -10 10 -11 10 -2 0 6 -11 22 -25 34 -13 11 -22 26 -18 32 3 6 0 6 -7 -1 -11 -10 -11 -15 1 -29 9 -12 10 -15 2 -10 -7 4 -18 16 -24 28 -8 15 -8 19 0 14 22 -14 10 13 -21 45 -18 19 -31 37 -30 42 1 4 -3 7 -9 7 -6 0 -17 7 -26 16 -9 8 -22 13 -29 10 -7 -3 -16 0 -20 6 -4 6 -3 8 4 4 14 -8 24 8 16 28 -7 18 -13 19 -33 7z m24 -11 c3 -5 1 -10 -4 -10 -6 0 -11 5 -11 10 0 6 2 10 4 10 3 0 8 -4 11 -10z m105 -120 c6 -11 9 -20 8 -20 -2 0 -11 9 -21 20 -9 11 -13 20 -7 20 5 0 14 -9 20 -20z m-493 -309 c0 -11 -5 -18 -9 -15 -4 3 -5 11 -1 19 7 21 12 19 10 -4z m-6 -304 c-10 -9 -11 -8 -5 6 3 10 9 15 12 12 3 -3 0 -11 -7 -18z`,
        `M2325 2760 c-3 -6 1 -7 9 -4 18 7 21 14 7 14 -6 0 -13 -4 -16 -10z`,
        `M1784 2149 c-3 -5 -2 -9 3 -9 4 -1 -5 -8 -20 -16 -15 -8 -25 -19 -21 -25 10 -16 12 -59 3 -53 -5 3 -7 -1 -4 -8 6 -15 139 -18 152 -3 4 4 3 5 -4 1 -6 -3 -15 -1 -18 5 -4 5 -13 8 -19 6 -7 -3 -13 1 -13 8 0 7 7 11 15 8 12 -5 12 -2 3 15 -7 12 -16 22 -21 22 -5 0 -14 10 -21 21 -8 17 -8 20 1 14 8 -5 11 -3 8 5 -5 16 -36 22 -44 9z`,
        `M1723 2062 c-7 -12 -8 -24 -2 -33 7 -11 9 -9 9 7 0 11 5 25 12 32 7 7 8 12 2 12 -5 0 -14 -8 -21 -18z`,
        `M1690 2041 c0 -5 5 -13 10 -16 6 -3 10 -2 10 4 0 5 -4 13 -10 16 -5 3 -10 2 -10 -4z`,
        `M2901 2115 c-13 -27 -24 -52 -24 -55 0 -3 -6 -9 -14 -15 -13 -10 -5 -11 125 -19 18 -2 35 1 38 6 3 5 12 4 20 -3 12 -10 13 -9 9 4 -4 8 -18 18 -33 22 -20 5 -23 8 -11 16 12 7 11 9 -3 9 -10 0 -18 6 -18 13 0 7 -9 18 -20 25 -12 7 -18 18 -13 25 5 8 2 8 -9 -1 -14 -11 -17 -10 -20 5 -2 12 -11 2 -27 -32z`,
        `M2828 1953 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z`,
        `M3149 1901 c7 -5 10 -14 7 -20 -10 -15 23 -27 35 -12 5 6 6 9 2 6 -3 -3 -12 4 -20 15 -8 11 -20 20 -26 20 -8 0 -7 -3 2 -9z`,
        `M3307 1729 c7 -7 15 -10 18 -7 3 3 -2 9 -12 12 -14 6 -15 5 -6 -5z`,
        `M2695 1711 c-3 -5 -2 -12 3 -15 5 -3 9 1 9 9 0 17 -3 19 -12 6z`,
        `M2607 1530 c-3 -11 -3 -20 -1 -20 2 0 8 9 14 20 6 11 7 20 2 20 -6 0 -12 -9 -15 -20z`,
        `M2353 1953 c64 -2 170 -2 235 0 64 1 11 3 -118 3 -129 0 -182 -2 -117 -3z`,
        `M2033 1937 c0 -8 6 -14 13 -14 7 0 10 5 7 11 -3 6 -2 7 2 3 17 -15 14 -36 -3 -30 -15 6 -14 4 1 -14 10 -12 20 -27 21 -35 1 -7 10 -28 19 -46 10 -18 15 -38 11 -44 -4 -7 -3 -8 4 -4 7 4 12 1 12 -8 0 -8 5 -16 11 -18 6 -2 12 -15 12 -30 1 -14 5 -24 9 -22 4 2 10 -6 13 -18 4 -13 15 -32 24 -42 9 -11 10 -16 4 -12 -7 4 -13 2 -13 -3 0 -6 5 -11 10 -11 6 0 10 -6 10 -14 0 -8 5 -16 10 -18 6 -2 12 -13 14 -25 6 -29 36 -73 50 -73 6 0 4 -5 -4 -10 -10 -7 -11 -10 -2 -11 27 -3 31 -4 39 -13 5 -5 3 -6 -5 -2 -9 5 -12 -1 -10 -23 1 -17 6 -31 10 -31 4 0 8 -9 8 -21 0 -11 5 -17 10 -14 6 3 10 -2 10 -12 0 -11 6 -25 13 -32 10 -11 9 -12 -3 -6 -13 8 -13 7 0 -11 30 -38 51 -45 43 -13 -5 16 -8 18 -15 7 -8 -11 -9 -10 -6 1 2 8 11 15 20 17 12 1 15 -3 11 -14 -4 -10 -3 -14 1 -11 4 4 8 16 11 27 2 11 8 29 14 40 6 11 7 22 4 26 -3 3 1 6 11 6 10 0 14 5 10 11 -3 6 -3 14 2 18 22 15 56 100 49 123 -4 14 -3 18 3 10 6 -9 16 3 33 40 13 29 28 56 34 60 5 4 7 8 2 8 -9 0 19 57 38 80 8 8 14 17 14 20 0 3 5 19 11 35 6 17 11 32 11 35 0 3 8 13 16 23 9 9 12 17 8 17 -5 0 1 9 13 20 26 25 29 38 5 19 -17 -13 -17 -12 -2 6 9 11 19 25 22 31 5 9 -66 12 -276 14 -155 1 -307 3 -338 6 -42 3 -56 0 -56 -9z`,
        `M3455 3740 c3 -5 11 -10 16 -10 6 0 7 5 4 10 -3 6 -11 10 -16 10 -6 0 -7 -4 -4 -10z`,
        `M1310 966 c0 -2 8 -10 18 -17 15 -13 16 -12 3 4 -13 16 -21 21 -21 13z`,
        `M3315 3980 c-3 -5 -1 -10 4 -10 6 0 11 5 11 10 0 6 -2 10 -4 10 -3 0 -8 -4 -11 -10z`,
        `M4035 1550 c-3 -6 1 -7 9 -4 18 7 21 14 7 14 -6 0 -13 -4 -16 -10z`
    ].join(' ');

    const logoTintGroup = document.createElementNS(svgNS, 'g');
    logoTintGroup.setAttribute('id', 'logoTintGroup');
    mainGroup.appendChild(logoTintGroup);

    // Watch Dogs Logo
    const logoGroup = document.createElementNS(svgNS, 'g');
    logoGroup.style.mixBlendMode = 'normal';
    logoTintGroup.appendChild(logoGroup);

    const logoG = document.createElementNS(svgNS, 'g');
    logoG.setAttribute('transform', 'translate(0, 474) scale(0.1, -0.1)');

    const logoPath = document.createElementNS(svgNS, 'path');
    logoPath.setAttribute('d', logoPathString);
    logoPath.setAttribute('fill', 'none');
    logoPath.setAttribute('stroke', colors.cyan);
    logoPath.setAttribute('stroke-width', '40');
    logoG.appendChild(logoPath);
    logoGroup.appendChild(logoG);

    const logoGlitchGroup = document.createElementNS(svgNS, 'g');
    logoGlitchGroup.setAttribute('id', 'logoGlitchGroup');
    logoGlitchGroup.style.mixBlendMode = 'screen';
    logoGlitchGroup.style.display = 'none';
    logoGlitchGroup.style.opacity = '0';
    logoGroup.appendChild(logoGlitchGroup);

    const logoGlitchG = document.createElementNS(svgNS, 'g');
    logoGlitchG.setAttribute('transform', 'translate(0, 474) scale(0.1, -0.1)');
    logoGlitchGroup.appendChild(logoGlitchG);

    const logoGlitchSliceClip = document.createElementNS(svgNS, 'clipPath');
    logoGlitchSliceClip.setAttribute('id', 'logoGlitchSliceClip');
    logoGlitchSliceClip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    defs.appendChild(logoGlitchSliceClip);

    const logoGlitchFilter = document.createElementNS(svgNS, 'filter');
    logoGlitchFilter.setAttribute('id', 'logoGlitchFilter');
    logoGlitchFilter.setAttribute('x', '-20%');
    logoGlitchFilter.setAttribute('y', '-20%');
    logoGlitchFilter.setAttribute('width', '140%');
    logoGlitchFilter.setAttribute('height', '140%');
    defs.appendChild(logoGlitchFilter);

    const logoGlitchTurbulence = document.createElementNS(svgNS, 'feTurbulence');
    logoGlitchTurbulence.setAttribute('type', 'turbulence');
    logoGlitchTurbulence.setAttribute('baseFrequency', '0.01 0.2');
    logoGlitchTurbulence.setAttribute('numOctaves', '1');
    logoGlitchTurbulence.setAttribute('seed', '2');
    logoGlitchTurbulence.setAttribute('result', 'noise');
    logoGlitchFilter.appendChild(logoGlitchTurbulence);

    const logoGlitchDisplacement = document.createElementNS(svgNS, 'feDisplacementMap');
    logoGlitchDisplacement.setAttribute('in', 'SourceGraphic');
    logoGlitchDisplacement.setAttribute('in2', 'noise');
    logoGlitchDisplacement.setAttribute('scale', '0');
    logoGlitchDisplacement.setAttribute('xChannelSelector', 'R');
    logoGlitchDisplacement.setAttribute('yChannelSelector', 'G');
    logoGlitchFilter.appendChild(logoGlitchDisplacement);

    const logoSliceRects = Array.from({ length: 8 }, () => {
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('width', '474');
        rect.setAttribute('height', '8');
        logoGlitchSliceClip.appendChild(rect);
        return rect;
    });

    const createLogoGlitchPath = () => {
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', logoPathString);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-width', '40');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        return path;
    };

    const logoGlitchPrimary = createLogoGlitchPath();
    const logoGlitchRed = createLogoGlitchPath();
    const logoGlitchCyan = createLogoGlitchPath();
    const logoGlitchSlice = createLogoGlitchPath();
    logoGlitchSlice.setAttribute('clip-path', 'url(#logoGlitchSliceClip)');

    logoGlitchG.appendChild(logoGlitchPrimary);
    logoGlitchG.appendChild(logoGlitchRed);
    logoGlitchG.appendChild(logoGlitchCyan);
    logoGlitchG.appendChild(logoGlitchSlice);
    function hexToRgb(hex) {
        const normalized = hex.replace('#', '');
        const value = normalized.length === 3
            ? normalized.split('').map((v) => v + v).join('')
            : normalized;
        return {
            r: parseInt(value.slice(0, 2), 16),
            g: parseInt(value.slice(2, 4), 16),
            b: parseInt(value.slice(4, 6), 16)
        };
    }

    function rgbToHex({ r, g, b }) {
        const toHex = (v) => v.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function blendColor(from, to, t) {
        return {
            r: Math.round(lerp(from.r, to.r, t)),
            g: Math.round(lerp(from.g, to.g, t)),
            b: Math.round(lerp(from.b, to.b, t))
        };
    }

    function rgbToHsl({ r, g, b }) {
        const rn = r / 255;
        const gn = g / 255;
        const bn = b / 255;
        const max = Math.max(rn, gn, bn);
        const min = Math.min(rn, gn, bn);
        const delta = max - min;
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;
        if (delta !== 0) {
            s = delta / (1 - Math.abs(2 * l - 1));
            switch (max) {
                case rn:
                    h = ((gn - bn) / delta) % 6;
                    break;
                case gn:
                    h = (bn - rn) / delta + 2;
                    break;
                default:
                    h = (rn - gn) / delta + 4;
                    break;
            }
            h = h * 60;
            if (h < 0) h += 360;
        }
        return { h, s, l };
    }

    function hslToRgb({ h, s, l }) {
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let rn = 0;
        let gn = 0;
        let bn = 0;
        if (h >= 0 && h < 60) {
            rn = c;
            gn = x;
        } else if (h < 120) {
            rn = x;
            gn = c;
        } else if (h < 180) {
            gn = c;
            bn = x;
        } else if (h < 240) {
            gn = x;
            bn = c;
        } else if (h < 300) {
            rn = x;
            bn = c;
        } else {
            rn = c;
            bn = x;
        }
        return {
            r: Math.round((rn + m) * 255),
            g: Math.round((gn + m) * 255),
            b: Math.round((bn + m) * 255)
        };
    }

    function hueShiftHex(hex, degrees) {
        const hue = Number.isFinite(degrees) ? degrees : 0;
        if (hue === 0) return hex;
        const hsl = rgbToHsl(hexToRgb(hex));
        hsl.h = (hsl.h + hue) % 360;
        return rgbToHex(hslToRgb(hsl));
    }

    function clampChannel(value) {
        return Math.max(0, Math.min(255, value));
    }

    function buildLogoGlitchColors(baseHex) {
        const base = hexToRgb(baseHex);
        const redTint = rgbToHex({
            r: clampChannel(base.r + 90),
            g: clampChannel(base.g - 40),
            b: clampChannel(base.b - 40)
        });
        const cyanTint = rgbToHex({
            r: clampChannel(base.r - 40),
            g: clampChannel(base.g + 60),
            b: clampChannel(base.b + 60)
        });
        return { redTint, cyanTint };
    }

    function randomizeLogoGlitchSlices() {
        logoSliceRects.forEach((rect) => {
            const height = 4 + Math.random() * 12;
            const y = Math.random() * (474 - height);
            rect.setAttribute('y', y.toFixed(2));
            rect.setAttribute('height', height.toFixed(2));
        });
        logoGlitchTurbulence.setAttribute('seed', Math.floor(Math.random() * 100).toString());
    }

    function applyLogoGlitchIntensity(intensity, now = 0) {
        logoGlitchActive = intensity > 0;
        if (intensity <= 0) {
            logoGlitchGroup.style.display = 'none';
            logoGlitchGroup.style.opacity = '0';
            logoGroup.removeAttribute('filter');
            logoGroup.removeAttribute('transform');
            logoGlitchDisplacement.setAttribute('scale', '0');
            return;
        }

        const baseHex = logoPath.getAttribute('stroke') || colors.cyan;
        const { redTint, cyanTint } = buildLogoGlitchColors(baseHex);
        logoGlitchPrimary.setAttribute('stroke', baseHex);
        logoGlitchRed.setAttribute('stroke', redTint);
        logoGlitchCyan.setAttribute('stroke', cyanTint);
        logoGlitchSlice.setAttribute('stroke', baseHex);

        const offsetBase = 12 * intensity;
        const rOffset = (Math.random() - 0.5) * offsetBase;
        const cOffset = (Math.random() - 0.5) * offsetBase;
        logoGlitchRed.setAttribute('transform', `translate(${rOffset.toFixed(2)} 0)`);
        logoGlitchCyan.setAttribute('transform', `translate(${(-cOffset).toFixed(2)} 0)`);

        const sliceShift = (Math.random() - 0.5) * 20 * intensity;
        logoGlitchSlice.setAttribute('transform', `translate(${sliceShift.toFixed(2)} 0)`);
        if (Math.random() < 0.35 || Math.sin(now * 0.015) > 0.6) {
            randomizeLogoGlitchSlices();
        }

        const jitterX = (Math.random() - 0.5) * 10 * intensity;
        const jitterY = (Math.random() - 0.5) * 6 * intensity;
        logoGroup.setAttribute('transform', `translate(${jitterX.toFixed(2)} ${jitterY.toFixed(2)})`);

        const baseFreqX = 0.008 + intensity * 0.04;
        const baseFreqY = 0.12 + intensity * 0.5;
        logoGlitchTurbulence.setAttribute('baseFrequency', `${baseFreqX.toFixed(3)} ${baseFreqY.toFixed(3)}`);
        logoGlitchDisplacement.setAttribute('scale', (6 + intensity * 28).toFixed(2));
        logoGroup.setAttribute('filter', 'url(#logoGlitchFilter)');

        logoGlitchGroup.style.display = 'block';
        logoGlitchGroup.style.opacity = Math.min(1, intensity * 1.1).toFixed(2);
    }


    let transitionState = null;
    let backgroundTransition = null;
    let smokeTransition = null;
    let lastGlitchTime = 0;
    let glitchOffset = 0;
    let glitchAnimationId = null;
    let glitchActive = false;
    let lastGlitchStart = 0;
    const MIN_GLITCH_INTERVAL = 3000;
    let pendingGlitchTimeout = null;
    let glitchHardTimeout = null;
    let glitchFocus = { x: 237, y: 237, r: 160 };
    let glitchTargets = [];
    let currentGlitchIntensity = 0;
    let invertTransition = null;
    let invertTimer = null;
    let invertStrobeActive = false;
    let invertStrobeTimer = null;
    let invertStrobeMono = false;
    let pageBWModeActive = false;
    let pageBWTimer = null;
    let pageBWStrobeActive = false;
    let pageBWStrobeTimer = null;
    let logoGlitchActive = false;
    let lastGlitchEnd = 0;
    let logoGlitchAnimationId = null;
    const LOGO_GLITCH_DURATION = 1000;
    const LOGO_GLITCH_INTERVAL = 10000;

    const TARGET_FPS = 30;
    const GLITCH_FPS = 12;
    let blendAnimationId = null;
    let lastBlendFrame = 0;
    let isPaused = false;
    const managedTimeouts = new Set();
    let colorIndex = 0;
    // (removed duplicate declarations)

    function setHueRotate(matrix, value) {
        const normalized = Number.isFinite(value) ? value : 0;
        matrix.setAttribute('values', normalized.toFixed(2));
    }

    function applyTintValues() {
        setHueRotate(logoTintMatrix, 0);
        setHueRotate(backgroundTintMatrix, 0);
        setHueRotate(asciiTintMatrix, 0);
    }

    const readSliderValue = (prop, fallback) => {
        if (!prop || prop.value === undefined || prop.value === null) return fallback;
        const parsed = typeof prop.value === 'number' ? prop.value : parseFloat(prop.value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    window.wallpaperPropertyListener = window.wallpaperPropertyListener || {};
    window.wallpaperPropertyListener.applyUserProperties = function (properties) {
        if (!properties) return;
        logoTintHue = readSliderValue(properties.logo_tint, logoTintHue);
        backgroundTintHue = readSliderValue(properties.background_tint, backgroundTintHue);
        asciiTintHue = readSliderValue(properties.ascii_tint, asciiTintHue);
        applyTintValues();
    };
    applyTintValues();

    function setManagedTimeout(fn, delay) {
        const id = setTimeout(() => {
            managedTimeouts.delete(id);
            fn();
        }, delay);
        managedTimeouts.add(id);
        return id;
    }

    function clearManagedTimeouts() {
        managedTimeouts.forEach((id) => clearTimeout(id));
        managedTimeouts.clear();
    }

    let audioCtx = null;
    let masterGain = null;
    let filterNode = null;
    let chordGain = null;
    let melodyGain = null;
    let audioStarted = false;
    let currentChordRoot = 45;
    let restartAudioSequence = null;
    let audioSequenceActive = false;

    function randomColorName() {
        return colorNames[Math.floor(Math.random() * colorNames.length)];
    }

    function pickContrastingPair(excludeNames = []) {
        const filtered = palettePairs.filter((pair) => !excludeNames.includes(pair[0]) && !excludeNames.includes(pair[1]));
        const pool = filtered.length ? filtered : palettePairs;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function pickBackgroundTarget(logoFromHex, logoToHex) {
        const logoFromName = colorNameFromHex(logoFromHex) || 'white';
        const logoToName = colorNameFromHex(logoToHex) || 'white';
        const pair = pickContrastingPair([logoFromName, logoToName]);
        const targetName = pair[Math.floor(Math.random() * pair.length)];
        return colors[targetName];
    }

    function pickSmokePair(logoFromHex, logoToHex) {
        const logoFromName = colorNameFromHex(logoFromHex) || 'white';
        const logoToName = colorNameFromHex(logoToHex) || 'white';
        const pair = pickContrastingPair([logoFromName, logoToName]);
        return pair.map((name) => colors[name]);
    }

    function colorNameFromHex(hex) {
        const normalized = hex.toLowerCase();
        const entry = Object.entries(colors).find(([, value]) => value.toLowerCase() === normalized);
        return entry ? entry[0] : null;
    }

    function invertHexToPalette(hex, fallbackName = 'white') {
        const name = colorNameFromHex(hex);
        const invertedName = name ? invertedColors[name] : fallbackName;
        return colors[invertedName] || colors[fallbackName] || colors.white;
    }

    function nearestPaletteColor(rgb) {
        let best = 'white';
        let bestDist = Infinity;
        Object.entries(colors).forEach(([name, hex]) => {
            const paletteRgb = hexToRgb(hex);
            const dr = paletteRgb.r - rgb.r;
            const dg = paletteRgb.g - rgb.g;
            const db = paletteRgb.b - rgb.b;
            const dist = dr * dr + dg * dg + db * db;
            if (dist < bestDist) {
                bestDist = dist;
                best = name;
            }
        });
        return colors[best];
    }

    function invertRgbToPalette(rgb) {
        return nearestPaletteColor({
            r: 255 - rgb.r,
            g: 255 - rgb.g,
            b: 255 - rgb.b
        });
    }

    function getLuminance(rgb) {
        return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    }

    function invertRgbToBW(rgb) {
        return getLuminance(rgb) > 0.5 ? colors.black : colors.white;
    }

    function invertHexToBW(hex) {
        return invertRgbToBW(hexToRgb(hex));
    }

    function pickContrastColor(bgHex) {
        const lum = getLuminance(hexToRgb(bgHex));
        return lum > 0.5 ? colors.black : colors.white;
    }

    function avoidLogoColor(hex, logoHex) {
        return hex.toLowerCase() === logoHex.toLowerCase() ? pickContrastColor(logoHex) : hex;
    }

    function getPaletteSet(logoHex) {
        return [colors.black, colors.grey, colors.white, colors.cyan].map((hex) => avoidLogoColor(hex, logoHex));
    }

    function applyInvertToColor(hex, invertPulse, invertMono, invertT) {
        if (invertPulse) {
            return invertMono ? invertHexToBW(hex) : invertRgbToPalette(hexToRgb(hex));
        }
        if (invertT !== null) {
            const from = hexToRgb(hex);
            const to = hexToRgb(invertRgbToPalette(from));
            return rgbToHex(blendColor(from, to, invertT));
        }
        return hex;
    }

    function randomDifferentColorName(exclude) {
        let pick = randomColorName();
        while (pick === exclude) {
            pick = randomColorName();
        }
        return pick;
    }

    function randomColorExcluding(excludes) {
        let pick = randomColorName();
        while (excludes.includes(pick)) {
            pick = randomColorName();
        }
        return pick;
    }

    function randomColorExcludingValues(excludeValues) {
        let pick = randomColorName();
        while (excludeValues.includes(colors[pick])) {
            pick = randomColorName();
        }
        return pick;
    }

    function queueNextInvertCycle() {
        if (invertTimer) {
            clearTimeout(invertTimer);
        }
        invertTimer = setManagedTimeout(() => {
            if (isPaused) return;
            if (!invertTransition) {
                startInvertCycle();
            }
        }, 7000 + Math.random() * 9000);
    }

    function startInvertCycle() {
        if (invertTransition) return;
        const baseBgHex = currentBgColor;
        const baseLogoHex = logoPath.getAttribute('stroke');
        const invertedBgHex = invertRgbToPalette(hexToRgb(baseBgHex));
        let invertedLogoHex = invertRgbToPalette(hexToRgb(baseLogoHex));
        if (invertedLogoHex === invertedBgHex) {
            invertedLogoHex = pickContrastColor(invertedBgHex);
        }
        invertTransition = {
            phase: 'to-invert',
            startTime: performance.now(),
            duration: 2400 + Math.random() * 2200,
            base: {
                bg: hexToRgb(baseBgHex),
                logo: hexToRgb(baseLogoHex)
            },
            inverted: {
                bg: hexToRgb(invertedBgHex),
                logo: hexToRgb(invertedLogoHex)
            }
        };
    }

    function scheduleInvertStrobe() {
        if (invertStrobeTimer) {
            clearTimeout(invertStrobeTimer);
        }
        invertStrobeTimer = setManagedTimeout(() => {
            if (isPaused) return;
            invertStrobeActive = true;
            invertStrobeMono = Math.random() < 0.6;
            const duration = 350 + Math.random() * 750;
            setManagedTimeout(() => {
                invertStrobeActive = false;
                scheduleInvertStrobe();
            }, duration);
        }, 5000 + Math.random() * 9000);
    }

    function schedulePageBWMode() {
        if (pageBWTimer) {
            clearTimeout(pageBWTimer);
        }
        const cycleDuration = 12000 + Math.random() * 6000;
        const bwDuration = cycleDuration / 3;
        pageBWModeActive = true;
        pageBWTimer = setManagedTimeout(() => {
            pageBWModeActive = false;
            pageBWTimer = setManagedTimeout(() => {
                if (isPaused) return;
                schedulePageBWMode();
            }, cycleDuration - bwDuration);
        }, bwDuration);
    }

    function schedulePageBWStrobe() {
        if (pageBWStrobeTimer) {
            clearTimeout(pageBWStrobeTimer);
        }
        pageBWStrobeTimer = setManagedTimeout(() => {
            if (isPaused) return;
            pageBWStrobeActive = true;
            const duration = 120 + Math.random() * 320;
            setManagedTimeout(() => {
                pageBWStrobeActive = false;
                schedulePageBWStrobe();
            }, duration);
        }, 4000 + Math.random() * 7000);
    }

    function forceResetVisuals() {
        const logoColor = randomColorName();
        logoPath.setAttribute('stroke', colors[logoColor]);
        if (logoPath.getAttribute('stroke') === currentBgColor) {
            logoPath.setAttribute('stroke', pickContrastColor(currentBgColor));
        }
        logoGroup.setAttribute('opacity', '1');
        mainGroup.setAttribute('opacity', '1');
        mainGroup.removeAttribute('mask');
        mainGroup.removeAttribute('filter');
        mainGroup.style.mixBlendMode = 'normal';
    }

    function startAudio() {
        if (audioStarted) return;
        audioStarted = true;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.18;
        masterGain.connect(audioCtx.destination);

        filterNode = audioCtx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 1400;
        filterNode.Q.value = 0.6;
        filterNode.connect(masterGain);

        chordGain = audioCtx.createGain();
        chordGain.gain.value = 0.2;
        chordGain.connect(filterNode);

        melodyGain = audioCtx.createGain();
        melodyGain.gain.value = 0.1;
        melodyGain.connect(filterNode);

        const chordOscillators = [0, 3, 7].map(() => audioCtx.createOscillator());
        chordOscillators.forEach((osc) => {
            osc.type = 'sine';
            osc.connect(chordGain);
            osc.start();
        });

        const melodyOscA = audioCtx.createOscillator();
        const melodyOscB = audioCtx.createOscillator();
        melodyOscA.type = 'triangle';
        melodyOscB.type = 'triangle';
        melodyOscA.detune.value = -2;
        melodyOscB.detune.value = 2;
        melodyOscA.connect(melodyGain);
        melodyOscB.connect(melodyGain);
        melodyOscA.start();
        melodyOscB.start();

        const baseMidi = 36;
        const melodicMinorOffsets = [0, 2, 3, 5, 7, 9, 11];
        let melodySequence = Array.from({ length: 8 }, () => melodicMinorOffsets[Math.floor(Math.random() * melodicMinorOffsets.length)]);
        let melodyIndex = 0;

        const setChordFromRoot = (rootMidi) => {
            const chord = [0, 3, 7].map((interval) => rootMidi + interval);
            chord.forEach((midi, index) => {
                const freq = 440 * Math.pow(2, (midi - 69) / 12);
                chordOscillators[index].frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.2);
            });
        };

        const regenerateSequences = () => {
            melodySequence = Array.from({ length: 8 }, () => melodicMinorOffsets[Math.floor(Math.random() * melodicMinorOffsets.length)]);
            melodyIndex = 0;
        };

        let stepIndex = 0;
        const stepPattern = [1, 0, 0, 1, 0, 0, 1, 0];
        const rhythmPattern = [1200, 1500, 1800, 1400, 1600, 2000];
        let chordHold = 0;

        const scheduleMelodyStep = () => {
            if (!audioCtx || isPaused) {
                audioSequenceActive = false;
                return;
            }
            audioSequenceActive = true;
            const playStep = stepPattern[stepIndex % stepPattern.length] === 1;
            stepIndex += 1;

            if (playStep) {
                const offset = melodySequence[melodyIndex % melodySequence.length];
                melodyIndex += 1;

                const melodyMidi = baseMidi + offset + 12;
                currentChordRoot = baseMidi + offset;
                if (chordHold % 2 === 0) {
                    setChordFromRoot(currentChordRoot);
                }
                chordHold += 1;

                const freq = 440 * Math.pow(2, (melodyMidi - 69) / 12);
                melodyOscA.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.03);
                melodyOscB.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.03);
            }

            const base = 700 + Math.random() * 500;
            filterNode.frequency.setTargetAtTime(base + currentGlitchIntensity * 1200, audioCtx.currentTime, 0.4);
            if (melodyIndex % melodySequence.length === 0) {
                regenerateSequences();
            }
            const next = rhythmPattern[stepIndex % rhythmPattern.length];
            setManagedTimeout(scheduleMelodyStep, next);
        };

        restartAudioSequence = scheduleMelodyStep;
        scheduleMelodyStep();

    }


    function fastCutColors() {
        const logoColorName = randomColorName();
        logoPath.setAttribute('stroke', colors[logoColorName]);
        if (logoPath.getAttribute('stroke') === currentBgColor) {
            logoPath.setAttribute('stroke', pickContrastColor(currentBgColor));
        }
    }

    function applyGlitchIntensity(intensity, now = 0) {
        currentGlitchIntensity = intensity;
        const strobeOn = Math.sin(now * 10.5) > 0;
        const asciiOpacity = intensity > 0
            ? (strobeOn ? 0.95 : 0.85)
            : 0;
        glitchLayer.setAttribute('opacity', asciiOpacity.toFixed(2));
        glitchLayer.style.display = intensity > 0 ? 'block' : 'none';
        mainGroup.setAttribute('opacity', '1');
        mainGroup.removeAttribute('filter');
        mainGroup.removeAttribute('mask');
        mainGroup.style.mixBlendMode = 'normal';
        logoGroup.setAttribute('opacity', '1');
        logoGroup.removeAttribute('filter');
        logoGroup.style.transform = '';
    }

    function endGlitch(now = performance.now()) {
        applyGlitchIntensity(0, now);
        logoGroup.style.transform = '';
        glitchLayer.style.display = 'none';
        glitchLayer.setAttribute('opacity', '0');
        mainGroup.setAttribute('opacity', '1');
        mainGroup.removeAttribute('filter');
        mainGroup.style.mixBlendMode = 'normal';
        logoGroup.setAttribute('opacity', '1');
        forceResetVisuals();
        glitchActive = false;
        lastGlitchEnd = now;
        if (glitchAnimationId) {
            cancelAnimationFrame(glitchAnimationId);
            glitchAnimationId = null;
        }
        if (logoGlitchAnimationId) {
            cancelAnimationFrame(logoGlitchAnimationId);
            logoGlitchAnimationId = null;
        }
        applyLogoGlitchIntensity(0, performance.now());
        stopGlitchRenderLoop();
        if (glitchHardTimeout) {
            clearTimeout(glitchHardTimeout);
            glitchHardTimeout = null;
        }
    }

    function triggerGlitch(force = false) {
        if (isPaused) return;
        const nowTime = performance.now();
        if (glitchAnimationId) {
            if (!force) return;
            cancelAnimationFrame(glitchAnimationId);
            glitchAnimationId = null;
            glitchActive = false;
            stopGlitchRenderLoop();
            endGlitch(performance.now());
        }

        const elapsed = nowTime - lastGlitchStart;
        if (!force && elapsed < MIN_GLITCH_INTERVAL) {
            if (!pendingGlitchTimeout) {
                const delay = Math.max(0, MIN_GLITCH_INTERVAL - elapsed);
                pendingGlitchTimeout = setManagedTimeout(() => {
                    pendingGlitchTimeout = null;
                    triggerGlitch(true);
                }, delay);
            }
            return;
        }

        if (pendingGlitchTimeout) {
            clearTimeout(pendingGlitchTimeout);
            pendingGlitchTimeout = null;
        }

        lastGlitchStart = nowTime;
        const focusX = 60 + Math.random() * 354;
        const focusY = 60 + Math.random() * 354;
        const focusR = 40 + Math.random() * 60;
        glitchFocus = { x: focusX, y: focusY, r: focusR };
        glitchTargets = Array.from({ length: Math.floor(Math.random() * 4) + 3 }, () => ({
            x: 40 + Math.random() * 394,
            y: 40 + Math.random() * 394,
            r: 30 + Math.random() * 50
        }));
        fastCutColors();
        transitionState = null;
        glitchActive = true;
        createGlitchChar(glitchLayer);
        startGlitchRenderLoop();
        applyGlitchIntensity(0.85, nowTime);
        // Glitch-triggered sound effects removed; keep only melody and chords.

        const duration = 1000;
        const startTime = performance.now();
        if (glitchHardTimeout) {
            clearTimeout(glitchHardTimeout);
        }
        glitchHardTimeout = setManagedTimeout(() => {
            if (glitchAnimationId || glitchActive) {
                endGlitch(performance.now());
            }
        }, duration + 200);

        function animateGlitch(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const intensity = Math.sin(progress * Math.PI);
            if (glitchTargets.length > 0) {
                const index = Math.floor(progress * glitchTargets.length) % glitchTargets.length;
                const target = glitchTargets[index];
                glitchFocus = target;
            }
            glitchActive = progress < 1;
            applyGlitchIntensity(intensity, currentTime);

            if (progress < 1) {
                glitchAnimationId = requestAnimationFrame(animateGlitch);
            } else {
                endGlitch(currentTime);
            }
        }

        glitchAnimationId = requestAnimationFrame(animateGlitch);
    }

    function scheduleGlitch() {
        const delay = 10000;
        setManagedTimeout(() => {
            if (isPaused) return;
            triggerGlitch();
            scheduleGlitch();
        }, delay);
    }

    function triggerLogoGlitch() {
        if (isPaused) return;
        if (logoGlitchAnimationId) {
            return;
        }

        const duration = LOGO_GLITCH_DURATION;
        const startTime = performance.now();
        randomizeLogoGlitchSlices();

        function animateLogoGlitch(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const intensity = Math.sin(progress * Math.PI);
            applyLogoGlitchIntensity(intensity, currentTime);

            if (progress < 1) {
                logoGlitchAnimationId = requestAnimationFrame(animateLogoGlitch);
            } else {
                applyLogoGlitchIntensity(0, currentTime);
                logoGlitchAnimationId = null;
            }
        }

        logoGlitchAnimationId = requestAnimationFrame(animateLogoGlitch);
    }

    function scheduleLogoGlitch() {
        const delay = LOGO_GLITCH_INTERVAL;
        setManagedTimeout(() => {
            if (isPaused) return;
            triggerLogoGlitch();
            scheduleLogoGlitch();
        }, delay);
    }

    function startColorBlend() {
        colorIndex = (colorIndex + 1) % colorNames.length;
        const logoColorName = randomColorName();

        transitionState = {
            startTime: performance.now(),
            duration: 20000 + Math.random() * 12000,
            from: {
                logo: hexToRgb(logoPath.getAttribute('stroke'))
            },
            to: {
                logo: hexToRgb(colors[logoColorName])
            }
        };

        const bgFrom = currentBgColor;
        const bgTo = pickBackgroundTarget(logoPath.getAttribute('stroke'), colors[logoColorName]);
        backgroundTransition = {
            startTime: performance.now(),
            duration: 18000 + Math.random() * 8000,
            from: hexToRgb(bgFrom),
            to: hexToRgb(bgTo)
        };

        const [smokeFromA, smokeFromB] = pickSmokePair(currentBgColor, logoPath.getAttribute('stroke'));
        const [smokeToA, smokeToB] = pickSmokePair(colors[logoColorName], bgTo);
        smokeTransition = {
            startTime: performance.now(),
            duration: 22000 + Math.random() * 9000,
            fromA: hexToRgb(smokeFromA),
            fromB: hexToRgb(smokeFromB),
            toA: hexToRgb(smokeToA),
            toB: hexToRgb(smokeToB)
        };
    }

    function updateBlend(now) {
        if (isPaused) {
            blendAnimationId = null;
            return;
        }
        const minFrameTime = 1000 / TARGET_FPS;
        if (now - lastBlendFrame < minFrameTime) {
            blendAnimationId = requestAnimationFrame(updateBlend);
            return;
        }
        lastBlendFrame = now;
        if (!transitionState) {
            startColorBlend();
        }

        const { startTime, duration, from, to } = transitionState;
        const t = Math.min(1, (now - startTime) / duration);
        const ease = t * t * (3 - 2 * t);
        const glitchPulse = Math.max(0, Math.sin(now / 160)) * 0.02;

        if (now - lastGlitchTime > 3500 + Math.random() * 2500) {
            lastGlitchTime = now;
            glitchOffset = (Math.random() - 0.5) * 0.04;
        }

        const blendT = Math.min(1, Math.max(0, ease + glitchOffset * glitchPulse));
        const blendedLogo = rgbToHex(blendColor(from.logo, to.logo, blendT));
        let finalLogo = blendedLogo;

        const invertPulse = (glitchActive || invertStrobeActive) && Math.sin(now * 0.085) > 0;
        const invertMono = invertStrobeActive && invertStrobeMono;
        const invertT = invertTransition
            ? Math.min(1, (now - invertTransition.startTime) / invertTransition.duration)
            : null;

        if (pageBWModeActive || pageBWStrobeActive) {
            fullpageGroup.setAttribute('filter', 'url(#fullpageBWFilter)');
        } else {
            fullpageGroup.removeAttribute('filter');
        }

        if (backgroundTransition) {
            const bgT = Math.min(1, (now - backgroundTransition.startTime) / backgroundTransition.duration);
            const bgEase = bgT * bgT * (3 - 2 * bgT);
            let blendedBg = rgbToHex(blendColor(backgroundTransition.from, backgroundTransition.to, bgEase));
            blendedBg = applyInvertToColor(blendedBg, invertPulse, invertMono, invertT);
            baseBgColor = blendedBg;
            const tintedBg = hueShiftHex(baseBgColor, backgroundTintHue);
            currentBgColor = tintedBg;
            backgroundRect.setAttribute('fill', tintedBg);
            if (bgT >= 1) {
                backgroundTransition = null;
            }
        } else {
            const tintedBg = hueShiftHex(baseBgColor, backgroundTintHue);
            currentBgColor = tintedBg;
            backgroundRect.setAttribute('fill', tintedBg);
        }

        if (smokeTransition) {
            const smokeT = Math.min(1, (now - smokeTransition.startTime) / smokeTransition.duration);
            const smokeEase = smokeT * smokeT * (3 - 2 * smokeT);
            let smokeColorA = rgbToHex(blendColor(smokeTransition.fromA, smokeTransition.toA, smokeEase));
            let smokeColorB = rgbToHex(blendColor(smokeTransition.fromB, smokeTransition.toB, smokeEase));

            const logoHex = logoPath.getAttribute('stroke');
            const paletteSet = getPaletteSet(logoHex);
            const paletteDark = paletteSet[0];
            const paletteMid = paletteSet[1];
            const paletteLight = paletteSet[2];
            const paletteAccent = paletteSet[3];

            smokeColorA = avoidLogoColor(smokeColorA, logoHex);
            smokeColorB = avoidLogoColor(smokeColorB, logoHex);

            smokeColorA = applyInvertToColor(smokeColorA, invertPulse, invertMono, invertT);
            smokeColorB = applyInvertToColor(smokeColorB, invertPulse, invertMono, invertT);
            let smokeColorC = applyInvertToColor(paletteMid, invertPulse, invertMono, invertT);
            let smokeColorD = applyInvertToColor(paletteAccent, invertPulse, invertMono, invertT);
            let smokeColorE = applyInvertToColor(paletteDark, invertPulse, invertMono, invertT);
            let smokeColorF = applyInvertToColor(paletteLight, invertPulse, invertMono, invertT);

            smokeColorA = hueShiftHex(smokeColorA, backgroundTintHue);
            smokeColorB = hueShiftHex(smokeColorB, backgroundTintHue);
            smokeColorC = hueShiftHex(smokeColorC, backgroundTintHue);
            smokeColorD = hueShiftHex(smokeColorD, backgroundTintHue);
            smokeColorE = hueShiftHex(smokeColorE, backgroundTintHue);
            smokeColorF = hueShiftHex(smokeColorF, backgroundTintHue);

            smokeAStop1.setAttribute('stop-color', smokeColorE);
            smokeAStop2.setAttribute('stop-color', smokeColorA);
            smokeAStop3.setAttribute('stop-color', smokeColorF);
            smokeBStop1.setAttribute('stop-color', smokeColorC);
            smokeBStop2.setAttribute('stop-color', smokeColorB);
            smokeBStop3.setAttribute('stop-color', smokeColorD);

            smokeParticleStop1.setAttribute('stop-color', smokeColorF);
            smokeParticleStop2.setAttribute('stop-color', smokeColorB);
            smokeParticleStop3.setAttribute('stop-color', smokeColorE);

            if (smokeT >= 1) {
                smokeTransition = null;
            }
        }

        const swirlTime = now * 0.0004;
        const smokeTime = now * 0.00025;
        const smokeFreqX = 0.008 + Math.sin(smokeTime * 0.9) * 0.004;
        const smokeFreqY = 0.06 + Math.cos(smokeTime * 1.2) * 0.03;
        smokeTurbulence.setAttribute('baseFrequency', `${smokeFreqX.toFixed(4)} ${smokeFreqY.toFixed(4)}`);
        smokeTurbulence.setAttribute('seed', Math.floor(20 + Math.abs(Math.sin(smokeTime) * 60)).toString());
        const smokeScale = 10 + Math.sin(smokeTime * 1.4) * 6;
        smokeDisplacement.setAttribute('scale', smokeScale.toFixed(2));
        smokePaths.forEach((path, index) => {
            const phase = swirlTime + index * 1.4;
            const driftX = Math.sin(phase) * (8 + index * 2);
            const driftY = Math.cos(phase * 1.3) * (6 + index);
            const rotate = Math.sin(phase * 0.6) * 2.5;
            path.setAttribute('transform', `translate(${driftX.toFixed(2)} ${driftY.toFixed(2)}) rotate(${rotate.toFixed(2)} 237 237)`);
        });

        smokeParticles.forEach((particle, index) => {
            const phase = swirlTime * 1.8 + index * 0.35;
            const driftX = Math.sin(phase) * (12 + (index % 5) * 2.4);
            const driftY = Math.cos(phase * 1.15) * (10 + (index % 4) * 2.1);
            const scale = 0.9 + Math.sin(phase * 0.7) * 0.12;
            particle.setAttribute('transform', `translate(${driftX.toFixed(2)} ${driftY.toFixed(2)}) scale(${scale.toFixed(3)})`);
        });

        if (invertPulse) {
            if (invertMono) {
                finalLogo = invertHexToBW(finalLogo);
            } else {
                finalLogo = invertRgbToPalette(hexToRgb(finalLogo));
            }
        } else if (invertTransition) {
            const tInv = invertT ?? 0;
            const fromColors = invertTransition.phase === 'to-invert' ? invertTransition.base : invertTransition.inverted;
            const toColors = invertTransition.phase === 'to-invert' ? invertTransition.inverted : invertTransition.base;
            finalLogo = rgbToHex(blendColor(fromColors.logo, toColors.logo, tInv));
            if (tInv >= 1) {
                if (invertTransition.phase === 'to-invert') {
                    const hold = 450 + Math.random() * 700;
                    const base = invertTransition.base;
                    const inverted = invertTransition.inverted;
                    setManagedTimeout(() => {
                        invertTransition = {
                            phase: 'to-base',
                            startTime: performance.now(),
                            duration: 2200 + Math.random() * 2000,
                            base,
                            inverted
                        };
                    }, hold);
                } else {
                    invertTransition = null;
                    queueNextInvertCycle();
                }
            }
        }
        if (finalLogo === currentBgColor) {
            finalLogo = pickContrastColor(currentBgColor);
        }
        finalLogo = hueShiftHex(finalLogo, logoTintHue);
        logoPath.setAttribute('stroke', finalLogo);

        if (!glitchActive) {
            logoGroup.setAttribute('opacity', '1');
            glitchLayer.style.display = 'none';
            glitchLayer.setAttribute('opacity', '0');
            mainGroup.setAttribute('opacity', '1');
            mainGroup.removeAttribute('mask');
            mainGroup.removeAttribute('filter');
            mainGroup.style.mixBlendMode = 'normal';
            lastGoodState = {
                bg: currentBgColor,
                logo: logoPath.getAttribute('stroke')
            };
            if (now - lastGlitchEnd < 1500) {
                forceResetVisuals();
            }
        }

        if (t >= 1) {
            const delay = 6000 + Math.random() * 6000;
            setManagedTimeout(startColorBlend, delay);
        }

        blendAnimationId = requestAnimationFrame(updateBlend);
    }

    function startLoops() {
        if (isPaused) return;
        scheduleGlitch();
        scheduleLogoGlitch();
        queueNextInvertCycle();
        scheduleInvertStrobe();
        schedulePageBWMode();
        schedulePageBWStrobe();
        if (!blendAnimationId) {
            blendAnimationId = requestAnimationFrame(updateBlend);
        }
    }

    function stopLoops() {
        isPaused = true;
        clearManagedTimeouts();
        pageBWModeActive = false;
        pageBWStrobeActive = false;
        fullpageGroup.removeAttribute('filter');
        audioSequenceActive = false;
        if (glitchActive) {
            endGlitch(performance.now());
        }
        if (blendAnimationId) {
            cancelAnimationFrame(blendAnimationId);
            blendAnimationId = null;
        }
        if (glitchAnimationId) {
            cancelAnimationFrame(glitchAnimationId);
            glitchAnimationId = null;
        }
        stopGlitchRenderLoop();
        if (glitchHardTimeout) {
            clearTimeout(glitchHardTimeout);
            glitchHardTimeout = null;
        }
        if (pendingGlitchTimeout) {
            clearTimeout(pendingGlitchTimeout);
            pendingGlitchTimeout = null;
        }
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }
    }

    function resumeLoops() {
        if (!isPaused) return;
        isPaused = false;
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (audioStarted && restartAudioSequence && !audioSequenceActive) {
            restartAudioSequence();
        }
        startLoops();
    }

    startLoops();

    const audioHint = document.createElement('div');
    audioHint.textContent = 'Click or press any key to enable audio';
    audioHint.style.position = 'fixed';
    audioHint.style.top = '16px';
    audioHint.style.left = '50%';
    audioHint.style.transform = 'translateX(-50%)';
    audioHint.style.padding = '8px 14px';
    audioHint.style.background = 'rgba(0, 0, 0, 0.6)';
    audioHint.style.border = '1px solid rgba(0, 255, 255, 0.4)';
    audioHint.style.borderRadius = '6px';
    audioHint.style.color = '#ffffff';
    audioHint.style.fontFamily = 'Courier New, monospace';
    audioHint.style.fontSize = '12px';
    audioHint.style.letterSpacing = '1px';
    audioHint.style.zIndex = '10';
    document.body.appendChild(audioHint);

    const enableAudio = () => {
        startAudio();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (audioHint.parentNode) {
            audioHint.parentNode.removeChild(audioHint);
        }
        document.removeEventListener('pointerdown', enableAudio);
        document.removeEventListener('keydown', enableAudio);
    };

    document.addEventListener('pointerdown', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });

    document.addEventListener('click', () => {
        if (!audioStarted) {
            enableAudio();
        }
        triggerGlitch(true);
        triggerLogoGlitch();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopLoops();
        } else {
            resumeLoops();
        }
    });


    // Glitch characters
    const glitchChars = '01';
    const rareDigits = '23456789';
    const mathSymbols = '±×÷≈≠≤≥√∞∑∏∫∂∆Ωπµ';
    const glitchFontSize = 6;
    const glitchGroup = document.createElementNS(svgNS, 'g');
    glitchGroup.setAttribute('id', 'asciiGlitchGroup');
    svg.appendChild(glitchGroup);

    const glitchLayer = document.createElementNS(svgNS, 'g');
    glitchLayer.setAttribute('opacity', '0');
    glitchLayer.style.mixBlendMode = 'screen';
    glitchGroup.appendChild(glitchLayer);


    const MAX_GLITCH_CHARS = 600;

    function pruneGlitchLayer(layer) {
        if (layer.childNodes.length <= MAX_GLITCH_CHARS) return;
        while (layer.childNodes.length > MAX_GLITCH_CHARS) {
            layer.removeChild(layer.firstChild);
        }
    }

    function createGlitchChar(layer) {
        if (!glitchActive) {
            return;
        }
        pruneGlitchLayer(layer);
        const baseAsciiColor = Math.random() < 0.5 ? colors.white : colors.cyan;
        const tintedAsciiColor = hueShiftHex(baseAsciiColor, asciiTintHue);
        const tintedAsciiAccent = hueShiftHex(colors.crimson, asciiTintHue);
        const fontSize = glitchFontSize;
        const chars = [];
        const areaCount = Math.floor(Math.random() * 3) + 2;
        const lineGap = fontSize + 2;
        const totalLines = Math.floor(474 / lineGap) - 1;
        const lineYs = Array.from({ length: totalLines }, (_, i) => 10 + i * lineGap);

        for (let area = 0; area < areaCount; area += 1) {
            const lineCount = Math.floor(Math.random() * 4) + 3;
            const baseLineLength = Math.floor(Math.random() * 22) + 12;
            const blotchScale = 0.4 + Math.random() * 0.9;
            const areaWidth = Math.max(24, Math.min(180, baseLineLength * (fontSize * 0.9) * blotchScale));
            const useTarget = glitchTargets.length && Math.random() < 0.6;
            const target = useTarget
                ? glitchTargets[Math.floor(Math.random() * glitchTargets.length)]
                : { x: Math.random() * 474, y: Math.random() * 474 };
            const areaX = Math.max(0, Math.min(474 - areaWidth, target.x - areaWidth / 2 + (Math.random() - 0.5) * 80));
            const leftX = areaX;
            const rightX = areaX + areaWidth;
            const lineLength = Math.floor(Math.random() * 140) + 70;
            const lineIndices = [];
            while (lineIndices.length < lineCount) {
                const index = Math.floor(Math.random() * lineYs.length);
                if (!lineIndices.includes(index)) {
                    lineIndices.push(index);
                }
            }

            const expandedIndices = new Set();
            lineIndices.forEach((index) => {
                expandedIndices.add(index);
                if (index > 0) expandedIndices.add(index - 1);
                if (index < lineYs.length - 1) expandedIndices.add(index + 1);
            });

            Array.from(expandedIndices).forEach((index) => {
                const y = lineYs[index];
                for (let i = 0; i < lineLength; i += 1) {
                    const char = document.createElementNS(svgNS, 'text');
                    const charSpacing = fontSize * 0.75;
                    const x = leftX + i * charSpacing;

                    char.setAttribute('x', x.toFixed(2));
                    char.setAttribute('y', y.toFixed(2));
                    char.setAttribute('font-size', fontSize);
                    char.setAttribute('font-family', 'Courier New, monospace');
                    char.setAttribute('opacity', '0.95');
                    char.style.mixBlendMode = 'screen';
                    const roll = Math.random();
                    const charPool = roll < 0.01 ? mathSymbols : (roll < 0.99 ? glitchChars : rareDigits);
                    const glyph = charPool[Math.floor(Math.random() * charPool.length)];
                    char.textContent = glyph;
                    char.setAttribute('fill', glitchChars.includes(glyph) ? tintedAsciiColor : tintedAsciiAccent);

                    layer.appendChild(char);
                    chars.push(char);
                }
            });
        }

        setTimeout(() => {
            chars.forEach((char) => {
                if (char.parentNode === layer) {
                    layer.removeChild(char);
                }
            });
        }, Math.random() * 1000 + 200);
    }

    let glitchRenderActive = false;
    let glitchRenderId = null;
    let lastRenderTime = 0;

    function glitchRenderLoop(now) {
        if (!glitchRenderActive) {
            glitchRenderId = null;
            return;
        }
        const minFrameTime = 1000 / GLITCH_FPS;
        if (now - lastRenderTime > minFrameTime && glitchActive && !isPaused) {
            lastRenderTime = now;
            createGlitchChar(glitchLayer);
        }
        glitchRenderId = requestAnimationFrame(glitchRenderLoop);
    }

    function startGlitchRenderLoop() {
        if (glitchRenderActive) return;
        glitchRenderActive = true;
        glitchRenderId = requestAnimationFrame(glitchRenderLoop);
    }

    function stopGlitchRenderLoop() {
        glitchRenderActive = false;
        if (glitchRenderId) {
            cancelAnimationFrame(glitchRenderId);
            glitchRenderId = null;
        }
    }
});