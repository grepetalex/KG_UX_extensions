// ==UserScript==
// @name         KG_Wide_Typeblock
// @namespace    http://tampermonkey.net/
// @version      1.0.5 
// @description  try to take over the world!
// @author       Patcher
// @match        *://klavogonki.ru/g/?gmid=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  let isWideMode = false;

  // Load settings from localStorage
  let settings = localStorage.getItem('kg-wide-settings')
    ? JSON.parse(localStorage.getItem('kg-wide-settings'))
    : { dimmingLevel: 50, mainBlockWidth: 90 };

  let isDragging = false;
  let startY = 0;
  let startX = 0;
  let startDimming = 0;
  let startWidth = 0;
  let dimmingBg = null;
  let styleElement = null;
  let isExiting = false; // Flag to prevent automatic re-application during exit
  let observer = null; // Store observer reference
  let hasAppliedOnce = false; // Flag to track if styles have been applied once

  function saveSettings() {
    localStorage.setItem('kg-wide-settings', JSON.stringify(settings));
  }

  function createDimmingBackground() {
    dimmingBg = document.createElement('div');
    dimmingBg.id = 'kg-dimming-background';
    dimmingBg.title = `Для выхода: ESC или двойной клик (ЛКМ).
Для настройки затемнения: зажмите (ЛКМ) и тяните вверх/вниз.
Для настройки ширины: зажмите (ЛКМ) и тяните влево/вправо.`;

    // Double click to exit
    dimmingBg.addEventListener('dblclick', (e) => {
      exitWideMode();
      e.preventDefault();
    });

    // Mouse events for dimming and width control
    dimmingBg.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left mouse button
        isDragging = true;
        startY = e.clientY;
        startX = e.clientX;
        startDimming = settings.dimmingLevel;
        startWidth = settings.mainBlockWidth;
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaY = startY - e.clientY; // Inverted: up = increase, down = decrease
        const deltaX = e.clientX - startX; // Right = increase, left = decrease
        const sensitivity = 0.5; // Adjust sensitivity for dimming
        const widthSensitivity = 0.1; // Adjust sensitivity for width

        let newDimming = startDimming + (deltaY * sensitivity);
        let newWidth = startWidth + (deltaX * widthSensitivity);

        // Clamp dimming between 0 and 100
        newDimming = Math.max(0, Math.min(100, newDimming));
        settings.dimmingLevel = newDimming;

        // Clamp width between 20 and 95
        newWidth = Math.max(20, Math.min(95, newWidth));
        settings.mainBlockWidth = newWidth;

        // Determine cursor based on movement direction
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        let cursor = 'move';

        if (absX > absY) {
          cursor = 'ew-resize'; // Horizontal resize
        } else if (absY > absX) {
          cursor = 'ns-resize'; // Vertical resize
        }

        dimmingBg.style.cursor = cursor + ' !important';

        // Update the CSS
        updateStyles();

        // Save to localStorage
        saveSettings();

        e.preventDefault();
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isDragging && e.button === 0) {
        isDragging = false;
        // Reset cursor to move when not dragging
        if (dimmingBg) {
          dimmingBg.style.cursor = 'move';
        }
      }
    });

    document.body.appendChild(dimmingBg);
    return dimmingBg;
  }

  function updateStyles() {
    if (!styleElement) return;

    styleElement.textContent = `
      #kg-dimming-background {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(0, 0, 0, ${settings.dimmingLevel / 100}) !important;
        z-index: 1999 !important;
        cursor: move !important;
        user-select: none !important;
      }

      #main-block {
          position: absolute !important;
          width: ${settings.mainBlockWidth}vw !important;
          left: 50% !important;
          top: 35% !important;
          transform: translate(-50%, -50%) !important;
          z-index: 2000 !important;
      }

      #typeblock {
          width: 100% !important;
          border: 2px solid rgba(0,0,0,0.3) !important;
          border-radius: 18px !important;
          background-color: #222222 !important;
          box-shadow: 0 0 5px rgba(0,0,0,0.4) !important;
      }

      #typeblock #param_keyboard {
        border-bottom: none !important;
        color: burlywood !important;  
      }

      #typetext {
          color: #a2aebb !important;
      }

      #typetext #typefocus {
          color: lightgreen !important;
      }

      #typetext #typefocus.highlight_error {
          color: coral !important;
      }

      #fixtypo {
        color: coral !important;
      }

      #inputtext {
          width: 80% !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          position: relative !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0.2em 0.5em !important;
          border-radius: 0.2em !important;
          outline: none !important;
          margin-top: 22px !important;
      }

      #main-block .handle,
      #report {
          display: none !important;
      }

      #typeblock .r.tl,
      #typeblock .r .tr,
      #typeblock .r .bl,
      #typeblock .r .br {
          background: transparent !important;
      }
  `;
  }

  function exitWideMode() {
    if (!isWideMode) return;

    isExiting = true; // Set flag to prevent re-application

    // Remove dimming background
    if (dimmingBg && dimmingBg.parentNode) {
      dimmingBg.parentNode.removeChild(dimmingBg);
      dimmingBg = null;
    }

    // Remove style element directly
    if (styleElement) {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      styleElement = null;
    }

    // Remove direct styles from elements
    const typeblock = document.getElementById('typeblock');
    const inputtext = document.getElementById('inputtext');
    if (typeblock) typeblock.style.backgroundColor = '';
    if (inputtext) {
      inputtext.style.setProperty('background-color', '', 'important');
      inputtext.style.setProperty('color', '', 'important');
    }

    // Also try to remove by class name as fallback
    const fallbackStyle = document.querySelector('style.kg-wide-mode-styles');
    if (fallbackStyle) {
      fallbackStyle.remove();
    }

    isWideMode = false;

    // Clear the exit flag after a short delay to allow DOM to settle
    setTimeout(() => {
      isExiting = false;
    }, 100);
  }

  function applyWideStyles() {
    if (isWideMode || hasAppliedOnce) return;

    const mainBlock = document.getElementById('main-block');
    const typeblock = document.getElementById('typeblock');
    const inputtext = document.getElementById('inputtext');

    if (!mainBlock || !typeblock || !inputtext) {
      return;
    }

    // Permanently disconnect observer once we're applying styles
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    hasAppliedOnce = true;

    // Create dimming background first
    createDimmingBackground();

    // Add all styles inside a style element with class name
    styleElement = document.createElement('style');
    styleElement.className = 'kg-wide-mode-styles';

    // Initial styles update
    updateStyles();

    document.head.appendChild(styleElement);

    // Set color/background-color directly on elements
    if (typeblock) typeblock.style.backgroundColor = '#222222';
    if (inputtext) {
      inputtext.style.setProperty('background-color', '#444444', 'important');
      inputtext.style.setProperty('color', '#b8c0ca', 'important');
      observeInput();
    }
    isWideMode = true;
  }

  // ESC key handler - Enhanced to work globally
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isWideMode) {
      exitWideMode();
      e.preventDefault();
      e.stopPropagation();
    }
  }, true); // Use capture phase to ensure it works

  function checkTypeblockVisibility() {
    const typetext = document.getElementById('typetext');

    if (!typetext) return false;

    const computedStyle = window.getComputedStyle(typetext);
    const isVisible = computedStyle.display !== 'none' &&
      computedStyle.visibility !== 'hidden' &&
      typetext.offsetParent !== null;

    return isVisible;
  }

  // Create mutation observer to watch for changes
  function createObserver() {
    if (hasAppliedOnce) {
      return;
    }

    observer = new MutationObserver(function () {
      // Only check if we haven't applied styles yet
      if (!isWideMode && !hasAppliedOnce && checkTypeblockVisibility()) {
        if (!isExiting) {
          applyWideStyles();
        }
      }
    });

    return observer;
  }

  // Start observing immediately
  function startObserver() {
    if (hasAppliedOnce) return;

    const targetNode = document.body || document.documentElement;
    const obs = createObserver();
    if (!obs) return;

    obs.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Check initial state
    if (checkTypeblockVisibility()) {
      applyWideStyles();
    }
  }

  // Single compact MutationObserver for #inputtext .error/.disabled color
  let inputObserver;
  function observeInput() {
    if (inputObserver) return;
    const el = document.getElementById('inputtext');
    if (!el) return;
    const setColor = () => {
      if (el.classList.contains('disabled')) {
        el.style.setProperty('color', '#333333', 'important');
        el.style.setProperty('background-color', '#131313', 'important');
      } else if (el.classList.contains('error')) {
        el.style.setProperty('color', '#111111', 'important');
        el.style.setProperty('background-color', '#dc143c', 'important');
      } else {
        el.style.setProperty('color', '#b8c0ca', 'important');
        el.style.setProperty('background-color', '#444444', 'important');
      }
    };
    setColor();
    inputObserver = new MutationObserver(setColor);
    inputObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  // Initialize the script immediately
  startObserver();

})();