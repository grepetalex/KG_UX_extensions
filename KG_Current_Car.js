// ==UserScript==
// @name         KG_User_Car
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Display latest selected car preview everywhere with draggable container; update storage only on own profile and auto-sync on background and class changes
// @author       Patcher
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @include      *://klavogonki.ru/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_HTML_KEY = 'KGUserCarHTML';
  const CONTAINER_ID = 'car-container';
  const PREVIEW_ID = 'car-preview';
  const POSITION_STORAGE_KEY = 'KGUserCarPosition';

  // Default position
  const DEFAULT_POSITION = { top: '50px', right: '5px' };

  /**
   * Load saved position or use default
   */
  function getStoredPosition() {
    const stored = localStorage.getItem(POSITION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_POSITION;
  }

  /**
   * Save position to localStorage
   */
  function savePosition(position) {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  }

  /**
   * Make element draggable
   */
  function makeDraggable(element) {
    let isDragging = false;
    let offsetX, offsetY;

    // Add cursor style to indicate draggable
    element.style.cursor = 'move';

    element.addEventListener('mousedown', function(e) {
      // Only handle left click
      if (e.button !== 0) return;
      
      isDragging = true;
      const rect = element.getBoundingClientRect();
      
      // Calculate offset from click position to element edges
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      // Prevent text selection during drag
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      
      // Calculate new position
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      
      // Set position with fixed positioning
      element.style.left = x + 'px';
      element.style.right = 'auto';
      element.style.top = y + 'px';
      
      // Ensure container stays visible
      if (parseInt(element.style.left) < 0) element.style.left = '0px';
      if (parseInt(element.style.top) < 0) element.style.top = '0px';
      if (parseInt(element.style.left) > window.innerWidth - 50) element.style.left = (window.innerWidth - 50) + 'px';
      if (parseInt(element.style.top) > window.innerHeight - 50) element.style.top = (window.innerHeight - 50) + 'px';
    });

    document.addEventListener('mouseup', function() {
      if (!isDragging) return;
      
      isDragging = false;
      
      // Save the new position
      const position = {
        top: element.style.top,
        left: element.style.left,
        right: 'auto'
      };
      savePosition(position);
    });
  }

  /**
   * Render or update the outer container and inner preview.
   * @param {HTMLElement} clone - cloned .car element
   */
  function renderPreviewClone(clone) {
    let outer = document.getElementById(CONTAINER_ID);
    const position = getStoredPosition();
    
    if (!outer) {
      outer = document.createElement('div');
      outer.id = CONTAINER_ID;
      
      // Apply position from storage or default
      Object.assign(outer.style, {
        position: 'fixed',
        padding: '1em',
        boxSizing: 'border-box',
        zIndex: '9999',
        ...position
      });
      
      document.documentElement.appendChild(outer);
      makeDraggable(outer);
    }

    // Get background color and set adaptive border using color-mix
    const bgColor = getComputedStyle(document.body).backgroundColor;

    const [r, g, b] = bgColor.match(/\d+/g).map(Number);
    const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    const borderColor = l > 127 ? '#e6e6e6' : '#2f2f2f';

    // Use color-mix to darken or lighten the background color for the border
    outer.style.setProperty('border', `2px solid ${borderColor}`, 'important');
    outer.style.setProperty('border-radius', '0.5em', 'important');
    outer.style.setProperty('box-shadow', `rgba(0, 0, 0, 0.4) 0px 1px 6px`, 'important');
    outer.style.backgroundColor = bgColor;

    let preview = document.getElementById(PREVIEW_ID);
    if (!preview) {
      preview = document.createElement('div');
      preview.id = PREVIEW_ID;
      Object.assign(preview.style, {
        width: '100px',
        height: '50px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      });
      outer.appendChild(preview);
    }
    preview.innerHTML = '';
    preview.appendChild(clone);
  }

  /**
   * Recursively copy only the computed 'background' property.
   */
  function copyBackgroundOnly(src, tgt) {
    const bg = getComputedStyle(src).getPropertyValue('background');
    if (bg && bg !== 'none') {
      tgt.style.setProperty('background', bg, getComputedStyle(src).getPropertyPriority('background'));
    }
    Array.from(src.children).forEach((child, i) => {
      if (tgt.children[i]) copyBackgroundOnly(child, tgt.children[i]);
    });
  }

  /**
   * Checks if the visited profile matches the logged-in user.
   */
  function isOwnProfile() {
    const panelName = document.querySelector('.userpanel .user-block .name span');
    const profileName = document.querySelector('.profile-root .profile-header .username .name');
    return panelName && profileName && panelName.textContent.trim() === profileName.textContent.trim();
  }

  /**
   * Build a clone element from stored HTML and inline backgrounds.
   */
  function buildCloneFromHTML(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const clone = document.createElement('div');
    clone.innerHTML = html;
    clone.className = 'car';
    Object.assign(clone.style, { maxWidth: '100%', maxHeight: '100%', boxSizing: 'border-box' });
    copyBackgroundOnly(temp, clone);
    return clone;
  }

  /**
   * Observe real .car for inline style changes and class changes within .car-base.
   */
  function observeCarChanges(carElem) {
    const observer = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'attributes') {
          if (m.attributeName === 'style' || m.attributeName === 'class') {
            const html = carElem.innerHTML;
            if (isOwnProfile()) {
              localStorage.setItem(STORAGE_HTML_KEY, html);
            }
            const stored = localStorage.getItem(STORAGE_HTML_KEY);
            if (stored) renderPreviewClone(buildCloneFromHTML(stored));
            break;
          }
        }
      }
    });
    observer.observe(carElem, { attributes: true, attributeFilter: ['style', 'class'], subtree: true });
  }

  /**
   * Init for profile pages: capture, store if own profile, render, and observe changes.
   */
  function initProfile() {
    const observer = new MutationObserver((_, obs) => {
      const car = document.querySelector('.car');
      if (car && car.querySelector('.imgcont')) {
        obs.disconnect();
        const html = car.innerHTML;
        if (isOwnProfile()) {
          const prev = localStorage.getItem(STORAGE_HTML_KEY);
          if (html && html !== prev) localStorage.setItem(STORAGE_HTML_KEY, html);
        }
        const stored = localStorage.getItem(STORAGE_HTML_KEY);
        if (stored) renderPreviewClone(buildCloneFromHTML(stored));
        observeCarChanges(car);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  /**
   * Init for other pages: wait for body, then render stored preview.
   */
  function initOther() {
    const observer = new MutationObserver((_, obs) => {
      if (document.body) {
        obs.disconnect();
        const stored = localStorage.getItem(STORAGE_HTML_KEY);
        if (stored) renderPreviewClone(buildCloneFromHTML(stored));
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Route based on URL
  if (/\/u\/#\//.test(location.href)) initProfile(); else initOther();
})();