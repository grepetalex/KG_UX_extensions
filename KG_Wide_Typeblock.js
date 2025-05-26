// ==UserScript==
// @name         KG_Wide_Typeblock
// @namespace    http://tampermonkey.net/
// @version      1.0.8 
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
  let settingsRaw = localStorage.getItem('kg-wide-settings');
  let settings;
  try {
    settings = settingsRaw ? JSON.parse(settingsRaw) : {};
  } catch {
    settings = {};
  }
  // Set defaults if missing or null
  settings.dimmingLevel = typeof settings.dimmingLevel === 'number' ? settings.dimmingLevel : 50;
  settings.mainBlockWidth = typeof settings.mainBlockWidth === 'number' ? settings.mainBlockWidth : 90;
  settings.typeBlockPosition = typeof settings.typeBlockPosition === 'number' ? settings.typeBlockPosition : 25;

  let isDragging = false;
  let startY = 0;
  let startDimming = 0;
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
Для настройки затемнения: зажмите (ЛКМ) и тяните вверх/вниз на фоне.
Для настройки ширины: зажмите (ЛКМ) и тяните влево/вправо на основном блоке.
Для настройки позиционирования: зажмите (ЛКМ) и тяните вверх/вниз на основном блоке.`;

    // Double click to exit
    dimmingBg.addEventListener('dblclick', (e) => {
      exitWideMode();
      e.preventDefault();
    });

    // Mouse events for dimming element dragging up/down
    dimmingBg.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        isDragging = true;
        startY = e.clientY;
        startDimming = settings.dimmingLevel;
        e.preventDefault();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaY = startY - e.clientY; // up = increase, down = decrease
        const sensitivity = 0.5;
        let newDimming = startDimming + (deltaY * sensitivity);
        newDimming = Math.max(0, Math.min(100, newDimming));
        settings.dimmingLevel = newDimming;
        updateStyles();
        saveSettings();
        e.preventDefault();
      }
    });
    document.addEventListener('mouseup', (e) => {
      if (isDragging && e.button === 0) {
        isDragging = false;
      }
    });
    document.body.appendChild(dimmingBg);
    return dimmingBg;
  }

  function makeMainBlockDraggable() {
    const mainBlock = document.getElementById('main-block');
    if (!mainBlock) return;
    let isBlockDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let dragStartWidth = 0, dragStartTop = 0;
    mainBlock.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        isBlockDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartWidth = settings.mainBlockWidth;
        dragStartTop = settings.typeBlockPosition;
        document.body.style.userSelect = 'none';
        e.preventDefault();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (isBlockDragging) {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const block = document.getElementById('main-block');
        const blockHeight = block ? block.offsetHeight : 0;
        const maxTop = 100 - (blockHeight / winHeight) * 100;
        let deltaX = e.clientX - dragStartX;
        let deltaY = e.clientY - dragStartY;
        // Horizontal drag: width
        let newWidth = dragStartWidth + (deltaX / winWidth) * 100;
        newWidth = Math.max(20, Math.min(95, newWidth));
        settings.mainBlockWidth = newWidth;
        // Vertical drag: position
        let newTop = dragStartTop + (deltaY / winHeight) * 100;
        newTop = Math.max(0, Math.min(maxTop, newTop));
        settings.typeBlockPosition = newTop;
        updateStyles();
        saveSettings();
        e.preventDefault();
      }
    });
    document.addEventListener('mouseup', (e) => {
      if (isBlockDragging && e.button === 0) {
        isBlockDragging = false;
        document.body.style.userSelect = '';
      }
    });
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
          position: fixed !important;
          width: ${settings.mainBlockWidth}vw !important;
          left: 50% !important;
          top: ${settings.typeBlockPosition}% !important;
          transform: translateX(-50%) !important;
          z-index: 2000 !important;
          pointer-events: auto !important;
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
        
      #typetext img {
          width: 100% !important;
          height: auto !important;
          border-radius: 14px !important;
          filter: invert(93.3%) grayscale(1) !important;
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

    hasAppliedOnce = true;

    // Create dimming background first
    createDimmingBackground();
    makeMainBlockDraggable();

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
    if (hasAppliedOnce) return;
    observer = new MutationObserver(() => {
      if (!isWideMode && !hasAppliedOnce && checkTypeblockVisibility() && !isExiting) applyWideStyles();
      const bookInfo = document.getElementById('bookinfo');
      if (bookInfo && isWideMode && bookInfo.style.display === '') exitWideMode();
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