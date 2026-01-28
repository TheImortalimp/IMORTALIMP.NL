# WATCH_DOGS SVG Animation Effect

A pure SVG animation library inspired by the iconic WATCH_DOGS game startup screen, featuring the signature black, white, and cyan color scheme with ASCII art glitch effects.

## Features

- **Pure SVG Animation** - No canvas, all vector-based animations
- **Watch_Dogs Aesthetic** - Authentic cyan/white/black color scheme
- **ASCII Glitch Effects** - Randomized ASCII character overlays
- **Customizable** - Full control over colors, intensity, and layers
- **Lightweight** - No dependencies, pure vanilla JavaScript
- **Responsive** - Adapts to any screen size
- **Interactive** - Manual glitch triggers and custom text injection

## Demo

Open `watch_dog_demo.html` in your browser to see the full effect with an interactive control panel.

## Quick Start

### Basic Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; overflow: hidden; }
        #container { width: 100vw; height: 100vh; position: relative; }
    </style>
</head>
<body>
    <div id="container"></div>
    <script src="watch_dog.js"></script>
    <script>
        const effect = new WatchDogsEffect('container', {
            autoStart: true
        });
    </script>
</body>
</html>
```

## Configuration Options

```javascript
const effect = new WatchDogsEffect('container-id', {
    // Colors
    primaryColor: '#00d9ff',        // Cyan (default)
    secondaryColor: '#ffffff',      // White (default)
    backgroundColor: '#000000',     // Black (default)
    
    // Behavior
    glitchIntensity: 0.7,          // 0-1, default 0.7
    animationSpeed: 1.0,            // Speed multiplier
    autoStart: true,                // Auto-start animations
    loopAnimation: false,           // Loop hacking text
    
    // Layer Visibility
    showLogo: true,                 // Show WATCH_DOGS logo
    showASCII: true,                // Show ASCII grid
    showScanlines: true,            // Show scanline effect
});
```

## API Methods

### Start/Stop Control

```javascript
// Start all animations
effect.start();

// Stop all animations
effect.stop();

// Clean up and remove
effect.destroy();
```

### Glitch Effects

```javascript
// Trigger manual glitch (duration in ms)
effect.triggerGlitch(300);

// Start automatic glitch sequence
effect.startGlitchSequence();
```

### Text and Content

```javascript
// Add hacking text (text, x, y)
effect.addHackingText('SYSTEM BREACH', 960, 800);

// Start automatic hacking text sequence
effect.startHackingSequence();
```

### Customization

```javascript
// Change colors
effect.setColors('#00ff00', '#ffffff', '#000000');

// Set glitch intensity (0-1)
effect.setGlitchIntensity(0.9);

// Toggle layers
effect.toggleLayer('logo', true);
effect.toggleLayer('asciiGrid', false);
effect.toggleLayer('scanlines', true);
effect.toggleLayer('hexGrid', true);
effect.toggleLayer('dataStreams', true);
```

## Integration with www.imortalimp.nl

### Background Effect

```html
<div id="watch-dogs-bg" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;"></div>

<script src="watch_dog.js"></script>
<script>
    const bgEffect = new WatchDogsEffect('watch-dogs-bg', {
        primaryColor: '#00d9ff',
        backgroundColor: '#000000',
        glitchIntensity: 0.5,
        showLogo: false,  // Hide logo for background
        autoStart: true,
        loopAnimation: false
    });
</script>
```

### Hero Section

```html
<section id="hero" style="position: relative; height: 100vh;">
    <div id="hero-effect"></div>
    <div style="position: relative; z-index: 10;">
        <!-- Your content here -->
    </div>
</section>

<script>
    const heroEffect = new WatchDogsEffect('hero-effect', {
        showLogo: true,
        autoStart: true,
        loopAnimation: true
    });
</script>
```

### Trigger on Events

```javascript
// Trigger glitch on button click
document.getElementById('cta-button').addEventListener('click', () => {
    effect.triggerGlitch(200);
    effect.addHackingText('ACCESS GRANTED');
});

// Trigger on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        effect.triggerGlitch(150);
    }
});
```

## Files Included

- `watch_dog.js` - Main JavaScript library (pure SVG animation engine)
- `watch_dog.css` - Stylesheet for demo control panel
- `watch_dog_demo.html` - Full-featured demo with control panel
- `README.md` - This documentation file

## Keyboard Shortcuts (Demo)

- `G` - Trigger glitch effect
- `H` - Add random hacking text
- `P` - Toggle control panel

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Performance

The effect uses pure SVG with CSS animations for optimal performance. All animations are GPU-accelerated where possible.

## Customization Examples

### Green Matrix Style
```javascript
const matrixEffect = new WatchDogsEffect('container', {
    primaryColor: '#00ff00',
    secondaryColor: '#00ff00',
    backgroundColor: '#000000'
});
```

### Red Alert Style
```javascript
const alertEffect = new WatchDogsEffect('container', {
    primaryColor: '#ff0000',
    secondaryColor: '#ffffff',
    backgroundColor: '#000000'
});
```

### Minimal Clean
```javascript
const minimalEffect = new WatchDogsEffect('container', {
    showASCII: false,
    showScanlines: false,
    showLogo: true
});
```

## Credits

- Inspired by Ubisoft's WATCH_DOGS franchise
- Created for www.imortalimp.nl
- Pure SVG implementation by River

## License

Free to use for personal and commercial projects.

## Support

For issues or questions, visit www.imortalimp.nl

---

**Built with ❤️ for the hacking aesthetic**
