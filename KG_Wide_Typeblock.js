// ==UserScript==
// @name         KG_Wide_Typeblock
// @namespace    http://tampermonkey.net/
// @version      1.0.0 
// @description  try to take over the world!
// @author       Patcher
// @match        *://klavogonki.ru/g/?gmid=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  let isWideMode = false;
  let dimmingLevel = localStorage.getItem('kg-dimming-level') ? parseInt(localStorage.getItem('kg-dimming-level')) : 50;
  let isDragging = false;
  let startY = 0;
  let startDimming = 0;
  let dimmingBg = null;
  let styleElement = null;
  let originalStyles = new Map();

  function savePreviousStyles() {
    const mainBlock = document.getElementById('main-block');

    if (mainBlock) {
      originalStyles.set('main-block', {
        position: mainBlock.style.position,
        width: mainBlock.style.width,
        left: mainBlock.style.left,
        top: mainBlock.style.top,
        transform: mainBlock.style.transform,
        zIndex: mainBlock.style.zIndex
      });
    }
  }

  function restoreOriginalStyles() {
    const mainBlock = document.getElementById('main-block');
    
    if (mainBlock && originalStyles.has('main-block')) {
      const styles = originalStyles.get('main-block');
      Object.assign(mainBlock.style, styles);
    }

    // Show handle elements again
    const handleElements = document.querySelectorAll('.handle');
    handleElements.forEach(el => {
      el.style.display = '';
    });
  }

  function createDimmingBackground() {
    dimmingBg = document.createElement('div');
    dimmingBg.id = 'kg-dimming-background';
    dimmingBg.title = 'Для выхода: ESC или двойной клик. Для настройки затемнения: зажмите и тяните вверх/вниз.';
    dimmingBg.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(0, 0, 0, ${dimmingLevel / 100}) !important;
        z-index: 1999 !important;
        cursor: ns-resize !important;
        user-select: none !important;
    `;

    // Double click to exit
    dimmingBg.addEventListener('dblclick', (e) => {
      exitWideMode();
      e.preventDefault();
    });

    // Mouse events for dimming control
    dimmingBg.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left mouse button
        isDragging = true;
        startY = e.clientY;
        startDimming = dimmingLevel;
        dimmingBg.style.cursor = 'ns-resize';
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaY = startY - e.clientY; // Inverted: up = increase, down = decrease
        const sensitivity = 0.5; // Adjust sensitivity
        let newDimming = startDimming + (deltaY * sensitivity);

        // Clamp between 0 and 100
        newDimming = Math.max(0, Math.min(100, newDimming));
        dimmingLevel = newDimming;

        dimmingBg.style.backgroundColor = `rgba(0, 0, 0, ${dimmingLevel / 100})`;

        // Save to localStorage
        localStorage.setItem('kg-dimming-level', Math.round(dimmingLevel));

        e.preventDefault();
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isDragging && e.button === 0) {
        isDragging = false;
        dimmingBg.style.cursor = 'ns-resize';
      }
    });

    document.body.appendChild(dimmingBg);
    return dimmingBg;
  }

  function exitWideMode() {
    if (!isWideMode) return;

    // Remove dimming background
    if (dimmingBg && dimmingBg.parentNode) {
      dimmingBg.parentNode.removeChild(dimmingBg);
      dimmingBg = null;
    }

    // Remove custom styles
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
      styleElement = null;
    }

    // Restore original styles
    restoreOriginalStyles();

    isWideMode = false;
    console.log('KG_Wide: Wide mode exited');
  }

  function applyWideStyles() {
    if (isWideMode) return;

    const mainBlock = document.getElementById('main-block');
    const typeblock = document.getElementById('typeblock');
    const inputtext = document.getElementById('inputtext');

    if (!mainBlock || !typeblock || !inputtext) {
      console.log('KG_Wide: Required elements not found');
      return;
    }

    // Save current styles before modifying
    savePreviousStyles();

    // Create dimming background first
    createDimmingBackground();

    // Hide elements with class "handle"
    const handleElements = mainBlock.querySelectorAll('.handle');
    handleElements.forEach(el => {
      el.style.display = 'none !important';
    });

    // Add !important styles via CSS
    styleElement = document.createElement('style');
    styleElement.textContent = `
      #main-block {
          position: absolute !important;
          width: 90vw !important;
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
          color: #b8c0ca !important;
          border: none !important;
          background: #444444 !important;
          padding: 0.2em 0.5em !important;
          border-radius: 0.2em !important;
          outline: none !important;
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

    document.head.appendChild(styleElement);

    isWideMode = true;
    console.log('KG_Wide: Wide mode applied successfully');
  }

  // ESC key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isWideMode) {
      exitWideMode();
      e.preventDefault();
    }
  });

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
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      // Check if typetext becomes visible
      if (checkTypeblockVisibility() && !isWideMode) {
        console.log('KG_Wide: Typetext is now visible, applying wide styles');
        applyWideStyles();
      }
    });
  });

  // Start observing immediately
  function startObserver() {
    const targetNode = document.body || document.documentElement;

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    console.log('KG_Wide: MutationObserver started');

    // Check initial state
    if (checkTypeblockVisibility()) {
      console.log('KG_Wide: Typetext already visible on load');
      applyWideStyles();
    }
  }

  // Initialize the script immediately
  startObserver();

  // Fallback check every 2 seconds for the first 30 seconds
  let checkCount = 0;
  const maxChecks = 15;

  const intervalCheck = setInterval(() => {
    checkCount++;

    if (checkTypeblockVisibility() && !isWideMode) {
      console.log('KG_Wide: Typetext found via interval check');
      applyWideStyles();
      clearInterval(intervalCheck);
    }

    if (checkCount >= maxChecks) {
      console.log('KG_Wide: Stopping interval checks');
      clearInterval(intervalCheck);
    }
  }, 2000);

})();