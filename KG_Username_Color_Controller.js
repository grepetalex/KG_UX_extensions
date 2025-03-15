// ==UserScript==
// @name         KG_Username_Color_Controller
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Complete control over username colors by limiting lightness, saturation, and filtering hue ranges on klavogonki.ru/gamelist
// @author       You
// @match        *://klavogonki.ru/gamelist*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configurable settings
    const COLOR_SETTINGS = {
        // Maximum lightness (0-100)
        MAX_LIGHTNESS: 30,

        // Maximum saturation (0-100)
        MAX_SATURATION: 80,

        // Hue range settings (0-360)
        HUE_FILTER_ACTIVE: false, // Set to true to enable hue filtering
        HUE_MIN: 0,              // Minimum hue value to allow
        HUE_MAX: 360,            // Maximum hue value to allow

        // What to do with colors outside the hue range
        // 'adjust' - Adjust to nearest valid hue
        // 'grayscale' - Convert to grayscale
        HUE_FILTER_ACTION: 'adjust'
    };

    // Function to convert RGB to HSL
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    // Function to convert HSL to RGB
    function hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    // Function to parse RGB color from computed style
    function parseRgbColor(rgbString) {
        const matches = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (matches) {
            return {
                r: parseInt(matches[1], 10),
                g: parseInt(matches[2], 10),
                b: parseInt(matches[3], 10)
            };
        }
        return null;
    }

    // Function to parse HEX color
    function parseHexColor(hexString) {
        hexString = hexString.replace('#', '');

        if (hexString.length === 3) {
            const r = parseInt(hexString[0] + hexString[0], 16);
            const g = parseInt(hexString[1] + hexString[1], 16);
            const b = parseInt(hexString[2] + hexString[2], 16);
            return { r, g, b };
        } else if (hexString.length === 6) {
            const r = parseInt(hexString.substring(0, 2), 16);
            const g = parseInt(hexString.substring(2, 4), 16);
            const b = parseInt(hexString.substring(4, 6), 16);
            return { r, g, b };
        }
        return null;
    }

    // Function to get RGB color from any color format
    function getRgbColor(color) {
        if (color.startsWith('rgb')) {
            return parseRgbColor(color);
        } else if (color.startsWith('#')) {
            return parseHexColor(color);
        } else {
            // For named colors or other formats
            const tempElement = document.createElement('div');
            tempElement.style.color = color;
            document.body.appendChild(tempElement);
            const rgb = parseRgbColor(window.getComputedStyle(tempElement).color);
            document.body.removeChild(tempElement);
            return rgb;
        }
    }

    // Function to check if a hue is within the allowed range
    function isHueInRange(hue) {
        if (!COLOR_SETTINGS.HUE_FILTER_ACTIVE) return true;

        // Handle wrapping around 360 degrees
        if (COLOR_SETTINGS.HUE_MIN <= COLOR_SETTINGS.HUE_MAX) {
            return hue >= COLOR_SETTINGS.HUE_MIN && hue <= COLOR_SETTINGS.HUE_MAX;
        } else {
            // Range wraps around 360, e.g., 300-60 means 300-360 and 0-60
            return hue >= COLOR_SETTINGS.HUE_MIN || hue <= COLOR_SETTINGS.HUE_MAX;
        }
    }

    // Function to adjust hue to nearest valid value
    function adjustHue(hue) {
        if (isHueInRange(hue)) return hue;

        if (COLOR_SETTINGS.HUE_FILTER_ACTION === 'grayscale') {
            return 0; // Hue 0 with 0 saturation will be grayscale
        }

        // Find closest valid hue
        const distToMin = Math.min(
            Math.abs(hue - COLOR_SETTINGS.HUE_MIN),
            Math.abs(hue - COLOR_SETTINGS.HUE_MIN + 360),
            Math.abs(hue - COLOR_SETTINGS.HUE_MIN - 360)
        );

        const distToMax = Math.min(
            Math.abs(hue - COLOR_SETTINGS.HUE_MAX),
            Math.abs(hue - COLOR_SETTINGS.HUE_MAX + 360),
            Math.abs(hue - COLOR_SETTINGS.HUE_MAX - 360)
        );

        return distToMin < distToMax ? COLOR_SETTINGS.HUE_MIN : COLOR_SETTINGS.HUE_MAX;
    }

    // Function to process and limit color properties
    function processColor(element) {
        // Skip if already processed
        if (element.classList.contains('processed-username-color')) {
            return;
        }

        // Mark as processed
        element.classList.add('processed-username-color');

        // Get computed color
        const computedStyle = window.getComputedStyle(element);
        const color = computedStyle.color;

        // Parse color
        const rgb = getRgbColor(color);

        if (rgb) {
            // Convert to HSL
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            let needsUpdate = false;

            // Check lightness
            if (hsl.l > COLOR_SETTINGS.MAX_LIGHTNESS) {
                hsl.l = COLOR_SETTINGS.MAX_LIGHTNESS;
                needsUpdate = true;
            }

            // Check saturation
            if (hsl.s > COLOR_SETTINGS.MAX_SATURATION) {
                hsl.s = COLOR_SETTINGS.MAX_SATURATION;
                needsUpdate = true;
            }

            // Check hue range
            if (COLOR_SETTINGS.HUE_FILTER_ACTIVE && !isHueInRange(hsl.h)) {
                if (COLOR_SETTINGS.HUE_FILTER_ACTION === 'grayscale') {
                    hsl.s = 0; // Make grayscale by removing saturation
                } else {
                    hsl.h = adjustHue(hsl.h);
                }
                needsUpdate = true;
            }

            // Update color if needed
            if (needsUpdate) {
                element.style.color = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            }
        }
    }

    // Function to check and process all username elements inside messages
    function processUsernameElements() {
        const messages = document.querySelector('.messages');
        if (messages) {
            const usernameElements = messages.querySelectorAll('.username:not(.processed-username-color)');
            usernameElements.forEach(username => {
                processColor(username);
            });
        }
    }

    // Process existing elements when the script starts
    processUsernameElements();

    // Set up MutationObserver to watch for new elements
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;

        mutations.forEach((mutation) => {
            // Check for added nodes
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                shouldProcess = true;
            }
        });

        if (shouldProcess) {
            processUsernameElements();
        }
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();