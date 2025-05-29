// ==UserScript==
// @name         KG_Wide_Typeblock
// @namespace    http://tampermonkey.net/
// @version      1.1.6
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
    mainBlockPosition: 25,
    visibleLines: 1,
    fontSize: 16,
    theme: 'dark'
  };

  // State Variables
  let isWideMode = false;
  let isPartialMode = false;
  let currentTheme = null;
  let dimmingBg = null;
  let styleElement = null;
  let isManualExit = false;

  // Theme Configuration
  const disabledLight = 'hsl(0, 0%, 85%)';
  const disabledDark = 'hsl(0, 0%, 10%)';

  const themes = {
    dark: {
      background: 'hsl(0, 0%, 15%)',
      borderColor: 'hsl(0, 0%, 20%)',
      text: {
        before: 'hsl(200, 10%, 40%)',
        focus: 'hsl(120, 70%, 70%)',
        after: 'hsl(200, 10%, 70%)',
        error: 'hsl(0, 85%, 70%)'
      },
      input: {
        background: 'hsl(120, 15%, 25%)',
        text: 'hsl(120, 15%, 75%)',
        caret: 'hsl(120, 15%, 75%)',
        selection: {
          background: 'hsl(120, 15%, 75%)',
          text: 'hsl(120, 15%, 25%)'
        },
        disabled: {
          background: disabledDark,
          text: disabledDark,
          caret: disabledDark,
          selection: {
            background: disabledDark,
            text: disabledDark
          }
        },
        error: {
          background: 'hsl(350, 80%, 50%)',
          text: 'hsl(350, 80%, 20%)',
          caret: 'hsl(350, 80%, 20%)',
          selection: {
            background: 'hsl(350, 80%, 20%)',
            text: 'hsl(350, 80%, 50%)'
          }
        }
      }
    },
    light: {
      background: 'hsl(0, 0%, 95%)',
      borderColor: 'hsl(0, 0%, 70%)',
      text: {
        before: 'hsl(200, 15%, 70%)',
        focus: 'hsl(150, 30%, 30%)',
        after: 'hsl(200, 15%, 40%)',
        error: 'hsl(350, 80%, 45%)'
      },
      input: {
        background: 'hsl(150, 30%, 70%)',
        text: 'hsl(150, 30%, 20%)',
        caret: 'hsl(150, 30%, 20%)',
        selection: {
          background: 'hsl(150, 30%, 20%)',
          text: 'hsl(150, 30%, 70%)'
        },
        disabled: {
          background: disabledLight,
          text: disabledLight,
          caret: disabledLight,
          selection: {
            background: disabledLight,
            text: disabledLight
          }
        },
        error: {
          background: 'hsl(350, 80%, 60%)',
          text: 'hsl(350, 80%, 30%)',
          caret: 'hsl(350, 80%, 30%)',
          selection: {
            background: 'hsl(350, 80%, 30%)',
            text: 'hsl(350, 80%, 60%)'
          }
        }
      }
    }
  };

  // Personal settings for different modes
  const CUSTOM_SETTINGS_KEY = 'kg-wide-custom-settings';
  const DEFAULT_SETTINGS_KEY = 'kg-wide-settings';

  function getCurrentModeKey() {
    const gamedesc = document.getElementById('gamedesc');
    if (!gamedesc) return null;
    const modeClass = Array.from(gamedesc.querySelectorAll('[class^="gametype-"]'))
      .map(el => Array.from(el.classList).find(cls => cls.startsWith('gametype-')))
      .find(Boolean);
    if (!modeClass) return null;
    if (modeClass === 'gametype-voc') {
      // Compact: get voc id from first /vocs/\d+ in href
      const a = gamedesc.querySelector('.gametype-voc a[href*="/vocs/"]');
      const id = a && a.href.match(/\/vocs\/(\d+)/)?.[1];
      if (id) return modeClass + '-' + id;
    }
    return modeClass;
  }

  function loadCustomSettings() {
    let custom = {};
    try {
      custom = JSON.parse(localStorage.getItem(CUSTOM_SETTINGS_KEY) || '{}');
    } catch { custom = {}; }
    return custom;
  }

  function saveCustomSettings(custom) {
    localStorage.setItem(CUSTOM_SETTINGS_KEY, JSON.stringify(custom));
  }
  function getSettingsForMode(modeKey) {
    const custom = loadCustomSettings();
    return (modeKey && custom[modeKey]) ? custom[modeKey] : null;
  }
  function setSettingsForMode(modeKey, newSettings) {
    const custom = loadCustomSettings();
    custom[modeKey] = newSettings;
    saveCustomSettings(custom);
  }
  function removeSettingsForMode(modeKey) {
    const custom = loadCustomSettings();
    delete custom[modeKey];
    saveCustomSettings(custom);
  }

  // Settings Management
  function getCurrentSettings() {
    const modeKey = getCurrentModeKey();
    let base = {};
    try {
      base = JSON.parse(localStorage.getItem(DEFAULT_SETTINGS_KEY) || '{}');
    } catch { base = {}; }
    const custom = getSettingsForMode(modeKey);
    return Object.assign({}, defaultSettings, base, custom || {});
  }

  function saveCurrentSettings(settingsObj) {
    const modeKey = getCurrentModeKey();
    if (getSettingsForMode(modeKey)) {
      setSettingsForMode(modeKey, settingsObj);
    } else {
      localStorage.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(settingsObj));
    }
  }

  // Settings state
  let settings;
  setTimeout(() => {
    settings = getCurrentSettings();
    currentTheme = settings.theme || defaultSettings.theme;
  }, 3000);

  // Settings Helper Functions
  function getSetting(key) {
    return settings[key];
  }

  function setSetting(key, value) {
    settings[key] = value;
    if (key === 'theme') currentTheme = value;
    saveCurrentSettings(settings);
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
      // Use the value from settings directly, do not clamp to maxLines here
      let visibleLines = getSetting('visibleLines');
      // Clamp only for display, not for saving
      const maxLines = getMaxLines();
      const clampedLines = Math.max(1, Math.min(visibleLines, maxLines));
      const visibleHeight = clampedLines * lineHeight;
      typeText.style.setProperty('height', `${visibleHeight}px`, 'important');
      const focusOffset = typeFocus.offsetTop;
      const maxScroll = typeText.scrollHeight - visibleHeight;
      let targetScroll = clampedLines === 1 ? focusOffset : Math.min(focusOffset, maxScroll);
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
    let newVisibleLines = getSetting('visibleLines') + change;
    newVisibleLines = Math.max(1, Math.min(newVisibleLines, maxLines));
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
      if (getSetting('isPartialMode') && !e.ctrlKey) {
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
      setSetting('mainBlockWidth', Math.round(newWidth * 10) / 10);
      setSetting('mainBlockPosition', Math.round(newTop * 10) / 10);
      updateStyles();
      // Reset height to allow dynamic resizing with auto height back with mutation observer
      const typeText = document.getElementById('typetext');
      typeText && (typeText.style.removeProperty('height'));
    }, () => ({
      // This function is called when drag starts, capturing current values
      startWidth: getSetting('mainBlockWidth'),
      startTop: getSetting('mainBlockPosition'),
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
          top: ${getSetting('mainBlockPosition')}vh !important;
          transform: translateX(-50%) !important;
          z-index: 2000 !important;
          pointer-events: auto !important;
          min-width: 566px !important;
      }
    
      #typeblock {
          width: 100% !important;
          border: 2px solid ${themes[currentTheme].borderColor} !important;
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
          filter: ${currentTheme === 'dark' ? 'invert(1) sepia(0) hue-rotate(40deg) grayscale(0.3)' : 'none'} !important;
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
  function exitWideMode(isManual = false) {
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
    isManualExit = isManual;
  }

  function enterWideMode() {
    if (isWideMode) return;
    isManualExit = false;

    // Load isPartialMode from settings when entering wide mode
    if (typeof settings.isPartialMode === 'boolean') {
      isPartialMode = settings.isPartialMode;
    }

    const mainBlock = document.getElementById('main-block');
    const typeblock = document.getElementById('typeblock');
    const inputtext = document.getElementById('inputtext');

    if (!mainBlock || !typeblock || !inputtext) return;

    createDimmingBackground();
    setupMainBlockInteractions();
    setupFontSizeManagement();
    setupRememberButton();

    styleElement = document.createElement('style');
    styleElement.className = 'kg-wide-mode-styles';
    styleElement.textContent = updateStyles({ inputTransition: false });
    document.head.appendChild(styleElement);

    if (typeblock) typeblock.style.backgroundColor = '#222222';
    if (inputtext) {
      // Show custom help popup on hover with CTRL key held down
      const helpText = `
        [Помощь:] (Ctrl) + (наведите курсор) на строку ввода.<br>
        [Выход:] (ESC) или (двойной клик) по строке ввода.<br>
        [Тема:] (Alt + T) или (Ctrl + клик) по фону.<br>
        [Затемнение:] зажмите (ЛКМ) и тяните (вверх/вниз) по фону.<br>
        [Ширина блока:] зажмите (ЛКМ) и тяните (влево/вправо) по блоку.<br>
        [Положение блока:] зажмите (ЛКМ) и тяните (вверх/вниз) по блоку.<br>
        [Режим отображения текста:] (двойной клик) по блоку (Построчно/Полностью).<br>
        [Количество строк:] (прокрутите колесо) мыши (вверх/вниз) по блоку.<br>
        [Размер шрифта:] (Ctrl) + (колесо мыши) (вверх/вниз) по блоку.<br>
        [Кастомные настройки:] (ПКМ) по строке ввода (Запомнить/Забыть).<br>
      `;

      let helpPopup = null;
      let ctrlDown = false;

      // Helper to wrap anything in [] with span.help-highlight
      function highlightHelpKeywords(text, color) {
        // Replace all [keyword:] with span
        return text.replace(/\[(.+?:)\]/g, (_m, kw) => `<span class='help-highlight' style='color: ${color}'>${kw}</span>`);
      }

      const showHelp = () => {
        if (!ctrlDown) return;
        if (!helpPopup) {
          helpPopup = document.createElement('div');
          helpPopup.className = 'kg-help-popup';
          document.body.appendChild(helpPopup);
        }
        const theme = themes[currentTheme];
        // Highlight keywords in helpText
        helpPopup.innerHTML = highlightHelpKeywords(helpText, theme.text.focus);
        // Calculate position: below by default, above if not enough space, and prevent overflow
        const rect = inputtext.getBoundingClientRect();
        const margin = 6;
        helpPopup.style.width = 'fit-content';
        helpPopup.style.maxWidth = '90vw';
        helpPopup.style.display = 'block';
        const popupHeight = helpPopup.offsetHeight || 140;
        // Calculate position
        let top = rect.bottom + window.scrollY + margin;
        let left = rect.left + window.scrollX;
        // Align left side of popup with left side of input
        left = rect.left + window.scrollX;
        // If not enough space below, show above
        if (top + popupHeight > window.innerHeight + window.scrollY) {
          top = rect.top + window.scrollY - popupHeight - margin;
        }
        // Prevent overflow top
        if (top < window.scrollY) {
          top = window.scrollY + margin;
        }
        // Prevent overflow bottom
        if (top + popupHeight > window.innerHeight + window.scrollY) {
          top = window.innerHeight + window.scrollY - popupHeight - margin;
        }
        Object.assign(helpPopup.style, {
          position: 'absolute',
          zIndex: 2010,
          left: left + 'px',
          top: top + 'px',
          background: theme.background,
          color: theme.text.after,
          border: `2px solid ${theme.borderColor}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          padding: '12px 18px',
          fontSize: '15px',
          fontFamily: 'Tahoma, Arial, sans-serif',
          whiteSpace: 'pre-line',
          pointerEvents: 'none',
          userSelect: 'none',
          maxWidth: '90vw',
          display: 'block',
          minHeight: popupHeight + 'px',
        });
        // Add highlight color for help-highlight class
        helpPopup.querySelectorAll('.help-highlight').forEach(el => {
          el.style.color = theme.text.focus;
          el.style.fontWeight = 'bold';
        });
      };

      const hideHelp = () => { if (helpPopup) helpPopup.style.display = 'none'; };

      const ctrlKeyHandler = e => {
        ctrlDown = e.ctrlKey;
        if (ctrlDown && inputtext.matches(':hover')) showHelp();
        else hideHelp();
      };

      addEvent(window, 'keydown', ctrlKeyHandler);
      addEvent(window, 'keyup', ctrlKeyHandler);

      addEvent(inputtext, 'mouseenter', () => { if (ctrlDown) showHelp(); });
      addEvent(inputtext, 'mouseleave', hideHelp);

      setInputColorState(inputtext);
      observeInput();
    }

    handleContentChanges();
    updateSavedIndicator();

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
      // Use e.code === 'KeyT' for layout independence
      if (e.key === 'Escape' && isWideMode) {
        exitWideMode(true);
        e.preventDefault();
        e.stopPropagation();
      } else if (e.altKey && e.code === 'KeyT' && isWideMode) {
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
      updateTextVisibility();
      applyFontSize();
    }
  }

  let behaviorObserver = null;
  function startObserver() {
    behaviorObserver = new MutationObserver(() => {
      const bookInfo = document.getElementById('bookinfo');
      if (bookInfo && isWideMode && bookInfo.style.display === '') exitWideMode();
      if (!isWideMode && !isManualExit && checkTypeblockVisibility()) enterWideMode();
      if (isWideMode) handleContentChanges();
    });

    behaviorObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    if (!isWideMode && checkTypeblockVisibility()) {
      enterWideMode();
    }
  }

  // Initialize
  startObserver();

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
      // Remove unwanted placeholder value if present and input is disabled
      el.value = '';
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

  // Font Size Management
  function getFontSize() {
    let size = getSetting('fontSize');
    if (typeof size !== 'number' || isNaN(size)) size = 16;
    return Math.max(12, Math.min(48, size));
  }

  function setFontSize(size) {
    size = Math.max(12, Math.min(48, size));
    setSetting('fontSize', size);
    applyFontSize();
  }

  function applyFontSize() {
    const typetext = document.getElementById('typetext');
    const inputtext = document.getElementById('inputtext');
    const size = getFontSize();
    if (typetext) {
      typetext.style.fontSize = size + 'px';
      typetext.style.lineHeight = (size * 1.2) + 'px';
    }
    inputtext && (inputtext.style.fontSize = size + 'px');
  }

  // Listen for ctrl+wheel to change font size in wide mode (only on main block)
  function setupFontSizeManagement() {
    const mainBlock = document.getElementById('main-block');
    if (!mainBlock) return;
    addEvent(mainBlock, 'wheel', function (e) {
      if (e.ctrlKey && isWideMode) {
        e.preventDefault();
        if (e.deltaY < 0) setFontSize(getFontSize() + 2);
        else if (e.deltaY > 0) setFontSize(getFontSize() - 2);
      }
    }, { passive: false });
  }

  // Toggle Theme Function
  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setSetting('theme', currentTheme);
    if (isWideMode) {
      updateStyles();
      updateSavedIndicator();
      const inputtext = document.getElementById('inputtext');
      if (inputtext) {
        setInputColorState(inputtext);
      }
    }
  }

  // Toggle Wide Mode Function
  const toggleWideMode = () => isWideMode ? exitWideMode(true) : enterWideMode();

  // Add double-click event to input text element
  document.addEventListener('dblclick', (e) => {
    const inputText = document.getElementById('inputtext');
    if (inputText && e.target === inputText) {
      toggleWideMode();
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // Setup right click button to remember or forget settings for the current mode
  function setupRememberButton() {
    const input = document.getElementById('inputtext');
    if (!input) return;
    let btn = null;
    function removeBtn() {
      btn && btn.remove(); btn = null;
    }
    input.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      const modeKey = getCurrentModeKey();
      const hasCustom = !!getSettingsForMode(modeKey);
      btn = document.createElement('button');
      btn.textContent = hasCustom ? 'Забыть' : 'Запомнить';
      btn.style.position = 'absolute';
      btn.style.zIndex = '2020';
      btn.style.fontSize = '16px';
      btn.style.padding = '6px 16px';
      btn.style.background = themes[currentTheme].input.background;
      btn.style.color = themes[currentTheme].input.text;
      btn.style.setProperty('box-shadow', '0 2px 4px rgba(0,0,0,0.2)', 'important');
      btn.style.setProperty('border', `2px solid ${themes[currentTheme].borderColor}`, 'important');
      btn.style.setProperty('border-radius', '0.4em', 'important');
      btn.style.cursor = 'pointer';
      btn.onmousedown = ev => ev.stopPropagation();
      btn.onclick = function (ev) {
        ev.preventDefault();
        if (hasCustom) {
          removeSettingsForMode(modeKey);
          settings = getCurrentSettings();
          saveCurrentSettings(settings);
        } else {
          setSettingsForMode(modeKey, Object.assign({}, settings));
        }
        updateSavedIndicator();
        removeBtn();
      };
      document.body.appendChild(btn);
      btn.addEventListener('mouseleave', removeBtn);
      const rect = btn.getBoundingClientRect();
      btn.style.left = (e.pageX - rect.width / 2) + 'px';
      btn.style.top = (e.pageY - rect.height / 2) + 'px';
    });
  }

  function updateSavedIndicator() {
    const mainBlock = document.getElementById('main-block');
    if (!mainBlock) return;

    const modeKey = getCurrentModeKey();
    const hasCustom = !!getSettingsForMode(modeKey);
    let span = document.getElementById('kg-saved-indicator');

    if (hasCustom) {
      if (span) {
        // Update theme colors if indicator exists
        span.style.backgroundColor = themes[currentTheme].input.background;
        // Update SVG stroke color
        const svg = span.querySelector('svg');
        if (svg) {
          svg.setAttribute('stroke', themes[currentTheme].input.text);
        }
        return;
      }
      span = document.createElement('span');
      span.id = 'kg-saved-indicator';
      span.style.position = 'absolute';
      span.style.right = '-35px';
      span.style.top = '50%';
      span.style.transform = 'translateY(-50%)';
      span.style.display = 'flex';
      span.style.alignItems = 'center';
      span.style.justifyContent = 'center';
      span.style.width = '28px';
      span.style.height = '28px';
      span.style.backgroundColor = themes[currentTheme].input.background;
      span.style.setProperty('border-radius', '0.2em', 'important');
      span.style.setProperty('box-shadow', '0 2px 4px rgba(0,0,0,0.2)', 'important');
      span.style.zIndex = '2100';
      span.innerHTML = `
        <svg
          width="20" height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="${themes[currentTheme].input.text}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
      `;
      mainBlock.appendChild(span);
    } else {
      if (span) span.remove();
    }
  }

})();