// ==UserScript==
// @name         KG_Wide_Typeblock
// @namespace    http://tampermonkey.net/
// @version      1.0.9 
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
  settings.inputTextWidth = typeof settings.inputTextWidth === 'number' ? settings.inputTextWidth : 30;

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
Для настройки ширины блока с текстом: зажмите (ЛКМ) и тяните влево/вправо.
Для настройки положения блока с текстом: зажмите (ЛКМ) и тяните вверх/вниз.
Для настройки ширины поля ввода: зажмите(ЛКМ) и тяните влево/вправо.
`;

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

  // Helper for drag events
  function addDragListener({
    element, onStart, onMove, onEnd, cursorTest, cursorType
  }) {
    let dragging = false;
    let dragData = null;
    let isOnEdge = false;

    function mousemove(e) {
      if (dragging) {
        onMove(e, dragData);
        e.preventDefault();
      } else if (cursorTest) {
        if (cursorTest(e)) {
          element.style.cursor = cursorType || 'ew-resize';
          isOnEdge = true;
        } else {
          element.style.cursor = '';
          isOnEdge = false;
        }
      }
    }
    function mousedown(e) {
      if (e.button === 0 && (!cursorTest || isOnEdge)) {
        dragging = true;
        dragData = onStart(e);
        document.body.style.userSelect = 'none';
        element.style.userSelect = 'none';
        if (element.blur) element.blur();
        e.preventDefault();
      }
    }
    function mouseup(e) {
      if (dragging && e.button === 0) {
        dragging = false;
        document.body.style.userSelect = '';
        element.style.userSelect = '';
        onEnd && onEnd(e, dragData);
      }
    }
    element.addEventListener('mousemove', mousemove);
    element.addEventListener('mouseleave', () => {
      element.style.cursor = '';
      isOnEdge = false;
    });
    element.addEventListener('mousedown', mousedown);
    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', mouseup);
  }

  function makeInputTextDraggable() {
    const input = document.getElementById('inputtext');
    if (!input) return;

    // Make the entire input draggable horizontally
    addDragListener({
      element: input,
      cursorTest: (e) => {
        // Allow dragging anywhere on the input element
        const rect = input.getBoundingClientRect();
        return e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom;
      },
      cursorType: 'ew-resize',
      onStart: (e) => ({
        startX: e.clientX,
        startWidth: settings.inputTextWidth
      }),
      onMove: (e, data) => {
        const winWidth = window.innerWidth;
        let deltaX = e.clientX - data.startX;
        let newWidth = data.startWidth + (deltaX / winWidth) * 100;
        newWidth = Math.max(20, Math.min(100, newWidth));
        settings.inputTextWidth = newWidth;
        updateStyles();
        saveSettings();
      },
      onEnd: () => {
        // Restore focus to input after drag ends
        setTimeout(() => input.focus(), 0);
      }
    });
  }

  function makeMainBlockDraggable() {
    const mainBlock = document.getElementById('main-block');
    if (!mainBlock) return;

    addDragListener({
      element: mainBlock,
      cursorTest: (e) => {
        // Only show move cursor when NOT over the input text
        const input = document.getElementById('inputtext');
        if (input) {
          const rect = input.getBoundingClientRect();
          const isOverInput = e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom;
          return !isOverInput; // Return true only when NOT over input
        }
        return true;
      },
      cursorType: 'move',
      onStart: (e) => {
        // Prevent drag if mouse is over #inputtext or its children
        const input = document.getElementById('inputtext');
        if (input) {
          const rect = input.getBoundingClientRect();
          const isOverInput = e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom;
          if (isOverInput) {
            return null; // Do not start drag
          }
        }

        const block = document.getElementById('main-block');
        const blockHeight = block ? block.offsetHeight : 0;
        return {
          startX: e.clientX,
          startY: e.clientY,
          startWidth: settings.mainBlockWidth,
          startTop: settings.typeBlockPosition,
          blockHeight
        };
      },
      onMove: (e, data) => {
        if (!data) return; // Not dragging if started on input
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const maxTop = 100 - (data.blockHeight / winHeight) * 100;
        let deltaX = e.clientX - data.startX;
        let deltaY = e.clientY - data.startY;
        // Horizontal drag: width
        let newWidth = data.startWidth + (deltaX / winWidth) * 100;
        newWidth = Math.max(20, Math.min(95, newWidth));
        settings.mainBlockWidth = newWidth;
        // Vertical drag: position
        let newTop = data.startTop + (deltaY / winHeight) * 100;
        newTop = Math.max(0, Math.min(maxTop, newTop));
        settings.typeBlockPosition = newTop;
        updateStyles();
        saveSettings();
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
        cursor: ns-resize !important;
        user-select: none !important;
      }

      #main-block {
          position: fixed !important;
          width: ${settings.mainBlockWidth}vw !important;
          left: 50% !important;
          top: ${settings.typeBlockPosition}vh !important;
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

      #typetext img {
          width: 100% !important;
          height: auto !important;
          border-radius: 14px !important;
          filter: invert(93.3%) grayscale(1) !important;
      }

      #typetext #beforefocus {
          color:rgba(162, 174, 187, 0.5) !important;
      } 

      #typetext #typefocus {
          color: lightgreen !important;
      }

      #typetext #afterfocus {
          color: #a2aebb !important;
      }

      #typetext #typefocus.highlight_error {
          color: coral !important;
      }

      #fixtypo {
        color: coral !important;
      }

      #inputtextblock {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
      }

      #typeblock #inputtext {
          width: ${settings.inputTextWidth}% !important;
          position: relative !important;
          box-shadow: none !important;
          border: none !important;
          margin: 1em 0 0.5em !important;
          border-radius: 0.2em !important;
          outline: none !important;
          margin: 1em 0 0.5em !important;
          user-select: none !important;
          transition: background-color 0.2s ease, color 0.2s ease !important;
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
    makeInputTextDraggable();



    // Create dimming backgrou
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