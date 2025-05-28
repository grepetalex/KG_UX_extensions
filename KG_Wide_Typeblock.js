// ==UserScript==
// @name         KG_Wide_Typeblock
// @namespace    http://tampermonkey.net/
// @version      1.1.2 
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
  settings.isPartialMode = typeof settings.isPartialMode === 'boolean' ? settings.isPartialMode : false;
  settings.visibleLines = typeof settings.visibleLines === 'number' ? settings.visibleLines : 1;

  let isDragging = false;
  let startY = 0;
  let startDimming = 0;
  let dimmingBg = null;
  let styleElement = null;
  let isExiting = false;
  let observer = null;
  let hasAppliedOnce = false;

  function saveSettings() {
    localStorage.setItem('kg-wide-settings', JSON.stringify(settings));
  }

  // Get line height with fallback
  function getLineHeight() {
    const typeFocus = document.getElementById('typefocus');
    if (!typeFocus) return 0;
    
    const computedStyle = window.getComputedStyle(typeFocus);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    return lineHeight > 0 ? lineHeight : typeFocus.offsetHeight;
  }

  // Get max possible lines
  function getMaxLines() {
    const typeText = document.getElementById('typetext');
    const lineHeight = getLineHeight();
    return typeText && lineHeight > 0 ? Math.floor(typeText.scrollHeight / lineHeight) : 1;
  }

  // Consolidated text visibility management
  function updateTextVisibility() {
    const typeText = document.getElementById('typetext');
    const typeFocus = document.getElementById('typefocus');
    
    if (!typeText || !typeFocus) return;

    if (settings.isPartialMode) {
      const lineHeight = getLineHeight();
      if (lineHeight <= 0) return;

      // Clamp visible lines to valid range
      const maxLines = getMaxLines();
      settings.visibleLines = Math.max(1, Math.min(settings.visibleLines, maxLines));
      
      const visibleHeight = settings.visibleLines * lineHeight;
      
      // Apply only dynamic height
      typeText.style.setProperty('height', `${visibleHeight}px`, 'important');

      // Smart scroll positioning - keep focus visible
      const focusOffset = typeFocus.offsetTop;
      const maxScroll = typeText.scrollHeight - visibleHeight;
      
      // Keep focus in view, preferably at top for single line mode
      let targetScroll = settings.visibleLines === 1 ? focusOffset : Math.min(focusOffset, maxScroll);
      
      typeText.scrollTop = Math.max(0, targetScroll);
      
    } else {
      // Reset to full view
      typeText.style.removeProperty('height');
      typeFocus.style.removeProperty('top');
    }
  }

  // Lines count adjustment with wheel
  function adjustVisibleLines(delta) {
    if (!settings.isPartialMode) return;
    
    const maxLines = getMaxLines();
    const change = delta > 0 ? 1 : -1;
    
    settings.visibleLines = Math.max(1, Math.min(
      settings.visibleLines + change, 
      maxLines
    ));
    
    updateTextVisibility();
    saveSettings();
  }

  // Simplified toggle function
  function toggleTextVisibilityMode() {
    settings.isPartialMode = !settings.isPartialMode;
    updateTextVisibility();
    saveSettings();
  }

  // Function to align inputtextblock with typefocus
  function alignInputWithTypeFocus() {
    if (!isWideMode) return;

    const inputTextBlock = document.getElementById('inputtextblock');
    const typeFocus = document.getElementById('typefocus');
    const typeText = document.getElementById('typetext');

    if (!inputTextBlock || !typeFocus || !typeText) return;

    const typeTextRect = typeText.getBoundingClientRect();
    const typeFocusRect = typeFocus.getBoundingClientRect();

    // Calculate the offset of typefocus relative to typetext
    const offsetLeft = typeFocusRect.left - typeTextRect.left;

    // Convert to percentage relative to typetext width
    const offsetPercentage = (offsetLeft / typeTextRect.width) * 100;

    // Adjust for input padding (8px left + 8px right = 16px total)
    // Convert 8px to percentage relative to typetext width
    const paddingAdjustment = (8 / typeTextRect.width) * 100;

    // Apply margin-left to inputtextblock, accounting for left padding
    const adjustedOffset = offsetPercentage - paddingAdjustment;
    inputTextBlock.style.setProperty('margin-left', `${adjustedOffset}%`, 'important');
  }

  function createDimmingBackground() {
    dimmingBg = document.createElement('div');
    dimmingBg.id = 'kg-dimming-background';

    dimmingBg.title = `Для выхода: ESC или двойной клик (ЛКМ).
Для настройки затемнения: зажмите (ЛКМ) и тяните вверх/вниз на фоне.
Для настройки ширины блока с текстом: зажмите (ЛКМ) и тяните влево/вправо.
Для настройки положения блока с текстом: зажмите (ЛКМ) и тяните вверх/вниз.
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
    dimmingBg.addEventListener('mousemove', (e) => {
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
    dimmingBg.addEventListener('mouseup', (e) => {
      if (isDragging && e.button === 0) {
        isDragging = false;
      }
    });
    document.body.appendChild(dimmingBg);
    return dimmingBg;
  }

  // Optimized event handling for main block
  function setupMainBlockInteractions() {
    const mainBlock = document.getElementById('main-block');
    if (!mainBlock) return;

    // Helper to check if click is over input to prevent toggling text visibility mode
    const isOverInput = (e) => {
      const input = document.getElementById('inputtext');
      if (!input) return false;
      
      const rect = input.getBoundingClientRect();
      return e.clientX >= rect.left && e.clientX <= rect.right &&
             e.clientY >= rect.top && e.clientY <= rect.bottom;
    };

    // Combined event handler
    mainBlock.addEventListener('dblclick', (e) => {
      if (!isOverInput(e)) {
        toggleTextVisibilityMode();
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Wheel event for line adjustment
    mainBlock.addEventListener('wheel', (e) => {
      if (settings.isPartialMode) {
        adjustVisibleLines(-e.deltaY);
        e.preventDefault();
        e.stopPropagation();
      }
    }, { passive: false });

    // Simplified drag setup
    setupDragInteraction(mainBlock, isOverInput);
  }

  // Streamlined drag interaction
  function setupDragInteraction(element, isOverInput) {
    let isDragging = false;
    let dragData = null;

    const handleMouseMove = (e) => {
      if (isDragging && dragData) {
        updateBlockPosition(e, dragData);
        e.preventDefault();
      } else if (!isDragging) {
        // Update cursor based on position
        element.style.cursor = isOverInput(e) ? 'default' : 'move';
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0 && !isOverInput(e)) {
        isDragging = true;
        dragData = {
          startX: e.clientX,
          startY: e.clientY,
          startWidth: settings.mainBlockWidth,
          startTop: settings.typeBlockPosition,
          blockHeight: element.offsetHeight
        };
        document.body.style.userSelect = 'none';
        e.preventDefault();
      }
    };

    const handleMouseUp = (e) => {
      if (isDragging && e.button === 0) {
        isDragging = false;
        document.body.style.userSelect = '';
        element.style.cursor = '';
      }
    };

    // Attach events
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', () => element.style.cursor = '');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // Optimized position update
  function updateBlockPosition(e, data) {
    const { innerWidth: winWidth, innerHeight: winHeight } = window;
    const maxTop = 100 - (data.blockHeight / winHeight) * 100;
    
    // Calculate deltas
    const deltaX = e.clientX - data.startX;
    const deltaY = e.clientY - data.startY;
    
    // Update width (horizontal drag)
    settings.mainBlockWidth = Math.max(20, Math.min(95, 
      data.startWidth + (deltaX / winWidth) * 100
    ));
    
    // Update position (vertical drag)
    settings.typeBlockPosition = Math.max(0, Math.min(maxTop,
      data.startTop + (deltaY / winHeight) * 100
    ));
    
    updateStyles();
    saveSettings();
  }

  function updateStyles(opts = {}) {
    const inputTransition = opts.inputTransition !== false;
    const css = `
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
          min-width: 566px !important;
      }

      #typeblock {
          width: 100% !important;
          border: 2px solid rgba(0,0,0,0.3) !important;
          border-radius: 18px !important;
          background-color: #222222 !important;
          box-shadow: 0 0 5px rgba(0,0,0,0.4) !important;
      }

      #typeblock .rc {
          padding: 10px 10px 10px 20px !important;
      }

      #typeblock #param_keyboard {
        border-bottom: none !important;
        color: burlywood !important;  
      }

      #typetext {
        position: relative !important;
        overflow: hidden !important;
        transition: top 0.2s ease !important;
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

      #inputtextblock {
        display: flex !important;
        justify-content: flex-start !important;
        align-items: center !important;
        transition: margin-left 0.1s ease !important;
      }

      #typeblock #inputtext {
          width: 100% !important;
          position: relative !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0.5em 0 0 !important;
          padding: 8px !important;
          border-radius: 0.4em !important;
          outline: none !important;
          ${inputTransition ? 'transition: background-color 0.2s ease, color 0.2s ease !important;' : ''}
      }

      #main-block .handle,
      #report,
      #fixtypo,
      #entertip,
      #param_keyboard {
          display: none !important;
      }

      #typeblock .r.tl,
      #typeblock .r .tr,
      #typeblock .r .bl,
      #typeblock .r .br {
          background: transparent !important;
      }

      #keyboard {
          filter: invert(1) sepia(0) hue-rotate(40deg) grayscale(0.3) !important;
      }

      #keyboard_cont {
        margin-top: 0 !important; 
      }
  `;
    if (styleElement) styleElement.textContent = css;
    return css;
  }

  function exitWideMode() {
    if (!isWideMode) return;

    isExiting = true;

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
    const inputTextBlock = document.getElementById('inputtextblock');
    const typeText = document.getElementById('typetext');
    const typeFocus = document.getElementById('typefocus');

    if (typeblock) typeblock.style.backgroundColor = '';
    if (inputtext) {
      inputtext.style.setProperty('background-color', '', 'important');
      inputtext.style.setProperty('color', '', 'important');
    }
    if (inputTextBlock) {
      inputTextBlock.style.removeProperty('margin-left');
    }
    if (typeText) {
      typeText.style.removeProperty('height');
    }
    if (typeFocus) {
      typeFocus.style.removeProperty('top');
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

    createDimmingBackground();
    setupMainBlockInteractions();

    // Add all styles inside a style element with class name
    styleElement = document.createElement('style');
    styleElement.className = 'kg-wide-mode-styles';

    // Initial styles update (without transition for inputtext)
    styleElement.textContent = updateStyles({ inputTransition: false });
    document.head.appendChild(styleElement);

    // Set color/background-color directly on elements
    if (typeblock) typeblock.style.backgroundColor = '#222222';
    if (inputtext) {
      setInputColorState(inputtext);
      observeInput();
    }

    // Initial alignment
    alignInputWithTypeFocus();

    // Initialize text visibility mode
    updateTextVisibility();

    isWideMode = true;

    // Enable transition after wide mode is fully applied
    setTimeout(() => {
      if (styleElement) styleElement.textContent = updateStyles({ inputTransition: true });
    }, 0);
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

  // Enhanced mutation observer callback
  function handleContentChanges() {
    if (isWideMode) {
      alignInputWithTypeFocus();
      if (settings.isPartialMode) {
        updateTextVisibility();
      }
    }
  }

  // Create mutation observer to watch for changes
  function createObserver() {
    if (hasAppliedOnce) return;
    observer = new MutationObserver(() => {
      if (!isWideMode && !hasAppliedOnce && checkTypeblockVisibility() && !isExiting) applyWideStyles();
      const bookInfo = document.getElementById('bookinfo');
      if (bookInfo && isWideMode && bookInfo.style.display === '') exitWideMode();

      // Add real-time alignment when in wide mode
      handleContentChanges();
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
      if (!isWideMode) return;
      setInputColorState(el);
    };
    setColor();
    inputObserver = new MutationObserver(setColor);
    inputObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  function setInputColorState(el) {
    if (el.classList.contains('disabled')) {
      el.style.setProperty('color', '#333333', 'important');
      el.style.setProperty('background-color', '#131313', 'important');
      el.style.caretColor = '#333333';
      setSelectionStyle('#131313', '#333333');
    } else if (el.classList.contains('error')) {
      el.style.setProperty('color', '#111111', 'important');
      el.style.setProperty('background-color', '#dc143c', 'important');
      el.style.caretColor = '#7a0a1a';
      setSelectionStyle('#7a0a1a', '#ffa4b6');
    } else {
      el.style.setProperty('color', '#b8c0ca', 'important');
      el.style.setProperty('background-color', '#444444', 'important');
      el.style.caretColor = '#222';
      setSelectionStyle('#222', '#e0e0e0');
    }
  }

  function setSelectionStyle(bg, color) {
    let selStyle = document.getElementById('kg-inputtext-selection-style');
    if (!selStyle) {
      selStyle = document.createElement('style');
      selStyle.id = 'kg-inputtext-selection-style';
      document.head.appendChild(selStyle);
    }
    selStyle.textContent = `#inputtext::selection { background: ${bg} !important; color: ${color} !important; }`;
  }

  // Initialize the script immediately
  startObserver();

})();