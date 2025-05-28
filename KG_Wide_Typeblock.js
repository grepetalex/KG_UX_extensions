// ==UserScript==
// @name         KG_Wide_Typeblock
// @namespace    http://tampermonkey.net/
// @version      1.1.3
// @description  try to take over the world!
// @author       Patcher
// @match        *://klavogonki.ru/g/?gmid=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Default Settings
  const defaultSettings = {
    dimmingLevel: 50,
    mainBlockWidth: 90,
    typeBlockPosition: 25,
    visibleLines: 1
  };

  // State Variables
  let isWideMode = false;
  let isPartialMode = false;
  let currentTheme = 'dark';
  let dimmingBg = null;
  let styleElement = null;
  let isExiting = false;
  let observer = null;
  let hasAppliedOnce = false;

  // Theme Configuration
  const themes = {
    dark: {
      background: '#222222',
      text: {
        before: '#414548',
        focus: '#90ee90',
        after: '#a2aebb',
        error: '#ff7f50'
      },
      input: {
        background: '#444444',
        text: '#b8c0ca',
        caret: '#222',
        selection: {
          background: '#222',
          text: '#e0e0e0'
        },
        disabled: {
          background: '#131313',
          text: '#333333',
          caret: '#333333',
          selection: {
            background: '#131313',
            text: '#333333'
          }
        },
        error: {
          background: '#dc143c',
          text: '#111111',
          caret: '#7a0a1a',
          selection: {
            background: '#7a0a1a',
            text: '#ffa4b6'
          }
        }
      }
    },
    light: {
      background: '#f3f3f3',
      text: {
        before: '#a6b2bd',
        focus: '#0f738a',
        after: '#677584',
        error: '#d63301'
      },
      input: {
        background: '#e0e0e0',
        text: '#222222',
        caret: '#333333',
        selection: {
          background: '#c0c0c0',
          text: '#000000'
        },
        disabled: {
          background: '#ededed',
          text: '#b0b0b0',
          caret: '#b0b0b0',
          selection: {
            background: '#ededed',
            text: '#b0b0b0'
          }
        },
        error: {
          background: '#d05050',
          text: '#6f0b0b',
          caret: '#6f0b0b',
          selection: {
            background: '#6f0b0b',
            text: '#ffa4a4'
          }
        }
      }
    }
  };

  // Load and Merge Settings
  let settingsRaw = localStorage.getItem('kg-wide-settings');
  let settings;
  try {
    settings = settingsRaw ? JSON.parse(settingsRaw) : {};
  } catch {
    settings = {};
  }
  settings = Object.assign({}, defaultSettings, settings);

  // Settings Helper Functions
  function saveSettings() {
    localStorage.setItem('kg-wide-settings', JSON.stringify(settings));
  }

  function getSetting(key) {
    return settings[key];
  }

  function setSetting(key, value) {
    settings[key] = value;
    saveSettings();
  }

  // Get line height of the type focus element
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

  // Text Visibility Management
  function updateTextVisibility() {
    const typeText = document.getElementById('typetext');
    const typeFocus = document.getElementById('typefocus');
    if (!typeText || !typeFocus) return;

    if (isPartialMode) {
      const lineHeight = getLineHeight();
      if (lineHeight <= 0) return;
      const maxLines = getMaxLines();
      const visibleLines = Math.max(1, Math.min(getSetting('visibleLines'), maxLines));
      setSetting('visibleLines', visibleLines);
      const visibleHeight = visibleLines * lineHeight;
      typeText.style.setProperty('height', `${visibleHeight}px`, 'important');
      const focusOffset = typeFocus.offsetTop;
      const maxScroll = typeText.scrollHeight - visibleHeight;
      let targetScroll = visibleLines === 1 ? focusOffset : Math.min(focusOffset, maxScroll);
      typeText.scrollTop = Math.max(0, targetScroll);
    } else {
      typeText.style.removeProperty('height');
      typeFocus.style.removeProperty('top');
    }
  }
  function adjustVisibleLines(delta) {
    if (!isPartialMode) return;
    const maxLines = getMaxLines();
    const change = delta > 0 ? 1 : -1;
    const newVisibleLines = Math.max(1, Math.min(getSetting('visibleLines') + change, maxLines));
    setSetting('visibleLines', newVisibleLines);
    updateTextVisibility();
  }
  function toggleTextVisibilityMode() {
    setSetting('isPartialMode', !getSetting('isPartialMode'));
    isPartialMode = getSetting('isPartialMode');
    updateTextVisibility();
  }

  // Input Alignment
  function alignInputWithTypeFocus() {
    if (!isWideMode) return;
    const inputTextBlock = document.getElementById('inputtextblock');
    const typeFocus = document.getElementById('typefocus');
    const typeText = document.getElementById('typetext');
    if (!inputTextBlock || !typeFocus || !typeText) return;
    const typeTextRect = typeText.getBoundingClientRect();
    const typeFocusRect = typeFocus.getBoundingClientRect();
    const offsetLeft = typeFocusRect.left - typeTextRect.left;
    const offsetPercentage = (offsetLeft / typeTextRect.width) * 100;
    const paddingAdjustment = (8 / typeTextRect.width) * 100;
    const adjustedOffset = offsetPercentage - paddingAdjustment;
    inputTextBlock.style.setProperty('margin-left', `${adjustedOffset}%`, 'important');
  }

  // --- Wide Mode Event Listener Management ---
  const eventListeners = [];
  function addEvent(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    eventListeners.push({ target, type, handler, options });
  }
  function removeEvents() {
    eventListeners.forEach(({ target, type, handler, options }) => {
      target.removeEventListener(type, handler, options);
    });
    eventListeners.length = 0;
  }

  // Dimming Background
  function createDimmingBackground() {
    dimmingBg = document.createElement('div');
    dimmingBg.id = 'kg-dimming-background';
    dimmingBg.title = `Для выхода: ESC или двойной клик (ЛКМ).
Для переключения темы: Alt + T или Ctrl + клик (ЛКМ) по фону.
Для настройки затемнения: зажмите (ЛКМ) и тяните вверх/вниз на фоне.
Для настройки ширины блока с текстом: зажмите (ЛКМ) и тяните влево/вправо.
Для настройки положения блока с текстом: зажмите (ЛКМ) и тяните вверх/вниз.
Для изменения количества видимых строк: прокрутите колесо мыши вверх/вниз на блоке с текстом.`;

    const dblClickHandler = (e) => {
      exitWideMode();
      e.preventDefault();
    };

    addEvent(dimmingBg, 'dblclick', dblClickHandler);

    // Ctrl + Click toggles theme
    const ctrlClickHandler = (e) => {
      if (e.button === 0 && e.ctrlKey) {
        toggleTheme();
        e.preventDefault();
        e.stopPropagation();
      }
    };
    addEvent(dimmingBg, 'click', ctrlClickHandler);

    // Drag logic handlers
    let dimDrag = { isDragging: false, startY: 0, startDimming: 0 };
    const mouseDown = (e) => {
      if (e.button === 0) {
        dimDrag.isDragging = true;
        dimDrag.startY = e.clientY;
        dimDrag.startDimming = getSetting('dimmingLevel');
        e.preventDefault();
      }
    };

    const mouseMove = (e) => {
      if (dimDrag.isDragging) {
        const deltaY = dimDrag.startY - e.clientY;
        const sensitivity = 0.5;
        let newDimming = dimDrag.startDimming + (deltaY * sensitivity);
        newDimming = Math.max(0, Math.min(100, newDimming));
        setSetting('dimmingLevel', newDimming);
        updateStyles();
        e.preventDefault();
      }
    };

    const mouseUp = (e) => {
      if (dimDrag.isDragging && e.button === 0) {
        dimDrag.isDragging = false;
      }
    };
    addEvent(dimmingBg, 'mousedown', mouseDown);
    addEvent(dimmingBg, 'mousemove', mouseMove);
    addEvent(dimmingBg, 'mouseup', mouseUp);
    document.body.appendChild(dimmingBg);
    return dimmingBg;
  }

  // Main Block Interactions
  function setupMainBlockInteractions() {
    const mainBlock = document.getElementById('main-block');
    if (!mainBlock) return;
    const isOverInput = (e) => {
      const input = document.getElementById('inputtext');
      if (!input) return false;
      const rect = input.getBoundingClientRect();
      return e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;
    };

    const dblClick = (e) => {
      if (!isOverInput(e)) {
        toggleTextVisibilityMode();
        e.preventDefault();
        e.stopPropagation();
      }
    };

    addEvent(mainBlock, 'dblclick', dblClick);
    const wheel = (e) => {
      if (getSetting('isPartialMode')) {
        adjustVisibleLines(-e.deltaY);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    addEvent(mainBlock, 'wheel', wheel, { passive: false });

    // Use a factory function that captures current state when drag starts
    setupDragInteraction(mainBlock, (e, data) => {
      const { innerWidth: winWidth, innerHeight: winHeight } = window;
      const maxTop = 100 - (data.blockHeight / winHeight) * 100;
      const deltaX = e.clientX - data.startX;
      const deltaY = e.clientY - data.startY;
      const newWidth = Math.max(20, Math.min(95, data.startWidth + (deltaX / winWidth) * 100));
      const newTop = Math.max(0, Math.min(maxTop, data.startTop + (deltaY / winHeight) * 100));
      setSetting('mainBlockWidth', newWidth);
      setSetting('typeBlockPosition', newTop);
      updateStyles();
    }, () => ({
      // This function is called when drag starts, capturing current values
      startWidth: getSetting('mainBlockWidth'),
      startTop: getSetting('typeBlockPosition'),
      blockHeight: mainBlock.offsetHeight
    }), isOverInput);
  }

  // Drag Interaction Setup
  function setupDragInteraction(element, onDrag, dragDataFactory = () => ({}), condition = () => false) {

    let isDragging = false;
    let data = null;

    const handleMouseMove = (e) => {
      if (isDragging && data) {
        onDrag(e, data);
        e.preventDefault();
      } else if (!isDragging) {
        element.style.cursor = condition(e) ? 'default' : 'move';
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0 && !condition(e)) {
        isDragging = true;
        // Capture current state when drag starts, not when setup happens
        const dragData = typeof dragDataFactory === 'function' ? dragDataFactory() : dragDataFactory;
        data = {
          startX: e.clientX,
          startY: e.clientY,
          ...dragData
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

    addEvent(element, 'mousemove', handleMouseMove);
    addEvent(element, 'mousedown', handleMouseDown);
    addEvent(element, 'mouseleave', () => element.style.cursor = '');
    addEvent(document, 'mousemove', handleMouseMove);
    addEvent(document, 'mouseup', handleMouseUp);
  }

  // Styles Management
  function updateStyles(opts = {}) {
    const inputTransition = opts.inputTransition !== false;
    const css = `
      #kg-dimming-background {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(0, 0, 0, ${getSetting('dimmingLevel') / 100}) !important;
        z-index: 1999 !important;
        cursor: ns-resize !important;
        user-select: none !important;
      }

      #main-block {
          position: fixed !important;
          width: ${getSetting('mainBlockWidth')}vw !important;
          left: 50% !important;
          top: ${getSetting('typeBlockPosition')}vh !important;
          transform: translateX(-50%) !important;
          z-index: 2000 !important;
          pointer-events: auto !important;
          min-width: 566px !important;
      }
    
      #typeblock {
          width: 100% !important;
          border: 2px solid rgba(0,0,0,0.3) !important;
          border-radius: 18px !important;
          background-color: ${themes[currentTheme].background} !important;
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
          filter: ${currentTheme === 'dark' ? 'invert(93.3%) grayscale(1)' : 'none'} !important;
      }

      #typetext #beforefocus {
          color: ${themes[currentTheme].text.before} !important;
      }

      #typetext #typefocus {
          color: ${themes[currentTheme].text.focus} !important;
      }

      #typetext #afterfocus {
          color: ${themes[currentTheme].text.after} !important;
      }

      #typetext #typefocus.highlight_error {
          color: ${themes[currentTheme].text.error} !important;
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

  function resetStyles() {
    // Remove all inline styles for a full reset
    const idsToReset = ['typeblock', 'typetext', 'inputtext', 'inputtextblock', 'typefocus'];
    idsToReset.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.removeAttribute('style');
    });
    // Remove selection style
    const selStyle = document.getElementById('kg-inputtext-selection-style');
    if (selStyle) selStyle.remove();
  }

  // Mode Management
  function exitWideMode() {
    if (!isWideMode) return;

    isExiting = true;
    removeEvents();
    removeGlobalKeydown();

    if (dimmingBg && dimmingBg.parentNode) {
      dimmingBg.parentNode.removeChild(dimmingBg);
      dimmingBg = null;
    }

    if (styleElement) {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      styleElement = null;
    }

    resetStyles();

    const fallbackStyle = document.querySelector('style.kg-wide-mode-styles');
    if (fallbackStyle) {
      fallbackStyle.remove();
    }

    isWideMode = false;

    setTimeout(() => {
      isExiting = false;
    }, 100);
  }

  function applyWideStyles() {
    if (isWideMode || hasAppliedOnce) return;

    // Load isPartialMode from settings when entering wide mode
    if (typeof settings.isPartialMode === 'boolean') {
      isPartialMode = settings.isPartialMode;
    }

    const mainBlock = document.getElementById('main-block');
    const typeblock = document.getElementById('typeblock');
    const inputtext = document.getElementById('inputtext');

    if (!mainBlock || !typeblock || !inputtext) return;

    hasAppliedOnce = true;

    createDimmingBackground();
    setupMainBlockInteractions();

    styleElement = document.createElement('style');
    styleElement.className = 'kg-wide-mode-styles';
    styleElement.textContent = updateStyles({ inputTransition: false });
    document.head.appendChild(styleElement);

    if (typeblock) typeblock.style.backgroundColor = '#222222';
    if (inputtext) {
      setInputColorState(inputtext);
      observeInput();
    }

    alignInputWithTypeFocus();
    updateTextVisibility();

    isWideMode = true;

    addGlobalKeydown();

    setTimeout(() => {
      if (styleElement) styleElement.textContent = updateStyles({ inputTransition: true });
    }, 0);
  }
  // Event Listeners
  let globalKeydownHandler = null;

  function addGlobalKeydown() {
    if (globalKeydownHandler) return;
    globalKeydownHandler = (e) => {
      if (e.key === 'Escape' && isWideMode) {
        exitWideMode();
        e.preventDefault();
        e.stopPropagation();
      } else if (e.altKey && e.key.toLowerCase() === 't' && isWideMode) {
        toggleTheme();
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', globalKeydownHandler, true);
  }

  function removeGlobalKeydown() {
    if (globalKeydownHandler) {
      document.removeEventListener('keydown', globalKeydownHandler, true);
      globalKeydownHandler = null;
    }
  }

  // Visibility Check
  function checkTypeblockVisibility() {
    const typetext = document.getElementById('typetext');
    if (!typetext) return false;
    const computedStyle = window.getComputedStyle(typetext);
    return computedStyle.display !== 'none' &&
      computedStyle.visibility !== 'hidden' &&
      typetext.offsetParent !== null;
  }

  function handleContentChanges() {
    if (isWideMode) {
      alignInputWithTypeFocus();
      if (getSetting('isPartialMode')) {
        updateTextVisibility();
      }
    }
  }

  // Mutation Observer
  function createObserver() {
    if (hasAppliedOnce) return;
    observer = new MutationObserver(() => {
      if (!isWideMode && !hasAppliedOnce && checkTypeblockVisibility() && !isExiting) applyWideStyles();
      const bookInfo = document.getElementById('bookinfo');
      if (bookInfo && isWideMode && bookInfo.style.display === '') exitWideMode();
      handleContentChanges();
    });
    return observer;
  }

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
    if (checkTypeblockVisibility()) {
      applyWideStyles();
    }
  }

  // Input Observation
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
    const theme = themes[currentTheme];
    if (el.classList.contains('disabled')) {
      el.style.setProperty('color', theme.input.disabled.text, 'important');
      el.style.setProperty('background-color', theme.input.disabled.background, 'important');
      el.style.caretColor = theme.input.disabled.text;
      setSelectionStyle(theme.input.disabled.background, theme.input.disabled.text);
    } else if (el.classList.contains('error')) {
      el.style.setProperty('color', theme.input.error.text, 'important');
      el.style.setProperty('background-color', theme.input.error.background, 'important');
      el.style.caretColor = theme.input.error.caret;
      setSelectionStyle(theme.input.error.selection.background, theme.input.error.selection.text);
    } else {
      el.style.setProperty('color', theme.input.text, 'important');
      el.style.setProperty('background-color', theme.input.background, 'important');
      el.style.caretColor = theme.input.selection.background;
      setSelectionStyle(theme.input.selection.background, theme.input.selection.text);
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

  // Toggle Theme Function
  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    if (isWideMode) {
      updateStyles();
      const inputtext = document.getElementById('inputtext');
      if (inputtext) {
        setInputColorState(inputtext);
      }
    }
  }

  // Initialize
  startObserver();
})();