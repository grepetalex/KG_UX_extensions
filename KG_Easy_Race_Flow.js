/* eslint-disable no-undef */
// ==UserScript==
// @name         KG_Easy_Race_Flow
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  No more hotkeys & Limitless error correction & Lost focuses - Optimized
// @author       Patcher
// @match        *://klavogonki.ru/g/?gmid=*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    maxSkipCount: 4,        // How many skipped races allowed except for the first race created manually
    startFromTimer: 4,      // Create next race after (N) seconds is out referencing the racing timer
    timerDelay: 500,        // Milliseconds after auto skip is triggered due to inactivity
    statusCheckDelay: 300,  // Delay before checking race status
    highlightDuration: 500, // Duration of the feedback highlight
    persistentHighlight: true, // Keep a light highlight to indicate mode
    keyBindings: {
      createNextRace: { ctrl: true, key: 'Enter' },
      gameList: { key: 'Escape' },
      toggleAutoChecker: { shift: true, key: 'Enter' }
    },
    selectors: {
      statusInner: '#status-inner',
      racing: '#racing',
      racingTime: '#racing_time',
      paused: '#paused',
      finished: '#finished',
      inputElement: '#typeblock #inputtext',
      gameDesc: '#gamedesc'
    }
  };

  // State management
  const STATE = {
    replayOnce: true,
    automaticChecker: true,
    checkerInterrupted: localStorage.getItem('checkerInterrupted') === 'true' || false,
    timerId: null,
    inputBackup: '',
    lastCursorPosition: 0,
    autoCheckCount: parseInt(localStorage.getItem('autoCheckCount')) || 0,
    elementsReady: false
  };

  // DOM elements cache
  const ELEMENTS = {};

  // Observers
  const OBSERVERS = {
    cursorObserver: null,
    errorObserver: null,
    statusObserver: null,
    elementObserver: null
  };

  // URLs
  const URLS = {
    gameList: 'https://klavogonki.ru/gamelist/'
  };

  // Helper functions
  const HELPERS = {
    /**
     * Update element cache with current DOM elements
     * @returns {boolean} Whether all required elements are available
     */
    updateElements: function () {
      let allPresent = true;

      // Update each element in the cache
      for (const [key, selector] of Object.entries(CONFIG.selectors)) {
        ELEMENTS[key] = document.querySelector(selector);
        if (!ELEMENTS[key] && key !== 'gameDesc') { // gameDesc is optional
          allPresent = false;
        }
      }

      return allPresent;
    },

    /**
     * Creates a game link URL based on the current game settings
     * @returns {string} The constructed game link URL
     */
    createGameLink: function () {
      const protocol = 'https';
      const hostname = 'klavogonki.ru';
      const pathname = '/create/';
      const type = 'normal';
      const levelFrom = '1';
      const levelTo = '9';

      // Ensure gameDesc element is retrieved if needed
      const gameDescriptionElement = ELEMENTS.gameDesc || document.querySelector(CONFIG.selectors.gameDesc);

      // Extract timeout value from the text nodes
      const timeout = (gameDescriptionElement?.textContent.match(/таймаут\s*(\d+)/)?.[1] || '10');

      // Extract gametype and voc values
      const gametype = gameDescriptionElement?.querySelector('span')?.getAttribute('class')?.replace(/-/g, '=');
      const voc = gameDescriptionElement?.querySelector('a')?.getAttribute('href').match(/\d+/)?.[0];

      // Construct the URL
      return `${protocol}://${hostname}${pathname}?type=${type}&level_from=${levelFrom}&level_to=${levelTo}&timeout=${timeout}&submit=1${voc ? `&voc=${voc}` : ''}${gametype ? `&${gametype}` : ''}`;
    },

    /**
     * Navigate to a given URL with a slight delay
     * @param {string} url - The URL to navigate to
     * @param {number} delay - Delay in milliseconds before navigation
     */
    navigateTo: function (url, delay = CONFIG.timerDelay) {
      setTimeout(() => {
        window.location.href = url;
      }, delay);
    },

    /**
     * Highlight the input element to provide visual feedback
     * @param {string} color - HSL color value for the highlight
     * @param {number} opacity - Initial opacity of the highlight
     */
    highlightInput: function (color, opacity = 0.95) {
      if (!ELEMENTS.inputElement) return;

      ELEMENTS.inputElement.style.transition = 'background 0.3s';
      ELEMENTS.inputElement.style.setProperty('background', `hsla(${color}, 100%, 50%, ${opacity})`, 'important');

      if (CONFIG.persistentHighlight) {
        // Keep a light highlight to indicate the current mode
        setTimeout(() => {
          ELEMENTS.inputElement.style.setProperty('background', `hsla(${color}, 100%, 50%, 0.2)`, 'important');
        }, CONFIG.highlightDuration);
      } else {
        // Fade highlight completely
        setTimeout(() => {
          ELEMENTS.inputElement.style.setProperty('background', `hsla(${color}, 100%, 50%, 0.1)`, 'important');
        }, CONFIG.highlightDuration);
      }
    },

    /**
     * Parse racing time into total seconds
     * @param {string} timeText - The racing time in MM:SS format
     * @returns {number} - Total seconds
     */
    parseRacingTime: function (timeText) {
      const [minutes, seconds] = timeText.split(':').map(parseFloat);
      return minutes * 60 + seconds;
    }
  };

  // Core functionality
  const CORE = {
    /**
     * Initialize the script
     */
    init: function () {
      CORE.waitForElements();

      // If checker is interrupted when loading page, set automaticChecker to false
      if (STATE.checkerInterrupted) {
        STATE.automaticChecker = false;
        console.log('Automatic checker disabled based on saved preference.');
      }
    },

    /**
     * Wait for all required page elements to be available
     */
    waitForElements: function () {
      // First attempt to get all elements
      if (HELPERS.updateElements()) {
        console.log('All necessary elements present. Starting the game.');
        STATE.elementsReady = true;
        CORE.setupGame();
        return;
      }

      // Set up a mutation observer to wait for elements
      OBSERVERS.elementObserver = new MutationObserver(() => {
        if (STATE.elementsReady) return;

        if (HELPERS.updateElements()) {
          console.log('All necessary elements present. Starting the game.');
          STATE.elementsReady = true;
          OBSERVERS.elementObserver.disconnect();
          CORE.setupGame();
        }
      });

      OBSERVERS.elementObserver.observe(document.body, { childList: true, subtree: true });
    },

    /**
     * Set up the game - initialize event listeners and observers
     */
    setupGame: function () {
      // Start the game
      if (typeof game !== 'undefined' && game.hostStart) {
        game.hostStart();
      }

      // Set up cursor focus handling
      CORE.setupCursorFocus();

      // Set up status observer for race state changes
      OBSERVERS.statusObserver = new MutationObserver(() => {
        CORE.checkRaceStatus();
      });

      OBSERVERS.statusObserver.observe(ELEMENTS.statusInner, { childList: true, subtree: true });

      // Set up key event listeners
      window.addEventListener('keydown', CORE.handleKeyDown);

      // Apply initial color to input field based on saved state
      if (ELEMENTS.inputElement) {
        const color = STATE.checkerInterrupted ? '60' : '140'; // Yellow or Green
        HELPERS.highlightInput(color, 0.4); // Less intense for initial state
        console.log(`Automatic navigation is ${STATE.checkerInterrupted ? 'disabled' : 'enabled'}.`);
      }
    },

    /**
     * Set up cursor focus handling for the input element
     */
    setupCursorFocus: function () {
      if (!ELEMENTS.inputElement || ELEMENTS.inputElement.tagName !== 'INPUT' ||
        ELEMENTS.inputElement.type !== 'text') return;

      // Initialize lastCursorPosition
      STATE.lastCursorPosition = ELEMENTS.inputElement.value.length;

      // Set up cursor observer
      OBSERVERS.cursorObserver = new MutationObserver(() => {
        if (document.activeElement === ELEMENTS.inputElement) {
          const selectionStart = ELEMENTS.inputElement.selectionStart;
          const selectionEnd = ELEMENTS.inputElement.selectionEnd;

          if (selectionStart === selectionEnd) {
            ELEMENTS.inputElement.setSelectionRange(STATE.lastCursorPosition, STATE.lastCursorPosition);
          } else {
            STATE.lastCursorPosition = selectionEnd;
          }
        }
      });

      OBSERVERS.cursorObserver.observe(ELEMENTS.inputElement, {
        attributes: true,
        attributeFilter: ['value']
      });

      // Set up error observer
      OBSERVERS.errorObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            if (ELEMENTS.inputElement.classList.contains('error')) {
              ELEMENTS.inputElement.value = STATE.inputBackup;
              STATE.lastCursorPosition = STATE.inputBackup.length;
            } else {
              STATE.inputBackup = ELEMENTS.inputElement.value;
            }
          }
        });
      });

      OBSERVERS.errorObserver.observe(ELEMENTS.inputElement, {
        attributes: true,
        attributeFilter: ['class']
      });

      // Set up focus events
      ELEMENTS.inputElement.addEventListener('focus', () => {
        STATE.lastCursorPosition = ELEMENTS.inputElement.value.length;
      });

      ELEMENTS.inputElement.addEventListener('blur', () => {
        ELEMENTS.inputElement.setSelectionRange(ELEMENTS.inputElement.value.length, ELEMENTS.inputElement.value.length);
      });

      // Handle click events
      document.addEventListener('click', (event) => {
        if (event.target === ELEMENTS.inputElement) return;

        if (ELEMENTS.inputElement.contains(event.target)) {
          const selectionStart = ELEMENTS.inputElement.selectionStart;
          const selectionEnd = ELEMENTS.inputElement.selectionEnd;

          if (selectionStart === selectionEnd) {
            ELEMENTS.inputElement.setSelectionRange(STATE.lastCursorPosition, STATE.lastCursorPosition);
          } else {
            STATE.lastCursorPosition = selectionEnd;
          }
        } else {
            // Do not restore focus if clicking these specified elements
            const allowedToFocus = ['input.text', '.userpanel .user-block .user-dropdown'];
            for (let sel of allowedToFocus) {
            if (event.target.closest(sel)) {
              return;
            }
            }
          ELEMENTS.inputElement.focus();
          ELEMENTS.inputElement.style.outline = 'none';
          ELEMENTS.inputElement.setSelectionRange(ELEMENTS.inputElement.value.length, ELEMENTS.inputElement.value.length);
        }
      });
    },

    /**
     * Handle keydown events for global shortcuts
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown: function (event) {
      const { ctrl, key } = CONFIG.keyBindings.createNextRace;
      if (event.ctrlKey === ctrl && event.key === key) {
        console.log('Ctrl + Enter was pressed. Creating next race.');
        HELPERS.navigateTo(HELPERS.createGameLink());
        return;
      }

      const gameListBinding = CONFIG.keyBindings.gameList;
      if (event.key === gameListBinding.key) {
        console.log('Esc was pressed. Moving on gamelist page.');
        HELPERS.navigateTo(URLS.gameList);
        return;
      }

      const toggleBinding = CONFIG.keyBindings.toggleAutoChecker;
      if (event.shiftKey === toggleBinding.shift && event.key === toggleBinding.key) {
        STATE.checkerInterrupted = !STATE.checkerInterrupted;
        // Save state to localStorage
        localStorage.setItem('checkerInterrupted', STATE.checkerInterrupted);

        console.log(`${STATE.checkerInterrupted ? 'Disabled' : 'Enabled'} automatic checker.`);
        HELPERS.highlightInput(STATE.checkerInterrupted ? '60' : '140'); // Yellow or Green

        // If we're disabling the automatic checker, also disable automaticChecker
        // This ensures no automatic navigation happens even if user stops typing
        if (STATE.checkerInterrupted) {
          STATE.automaticChecker = false;
          // Clear any pending automatic navigation timers
          clearTimeout(STATE.timerId);
        }
        return;
      }

      // Reset automatic checker on any keypress, but only if checker is not interrupted
      if (!STATE.checkerInterrupted) {
        STATE.automaticChecker = false;
        CORE.resetAutoChecker();
      }
    },

    /**
     * Reset the automatic checker after user activity
     */
    resetAutoChecker: function () {
      clearTimeout(STATE.timerId);
      STATE.autoCheckCount = 0;
      localStorage.setItem('autoCheckCount', STATE.autoCheckCount);

      if (!STATE.checkerInterrupted) {
        STATE.timerId = setTimeout(() => {
          console.log('You stopped keydown action. Activating automatic checker.');
          STATE.automaticChecker = true;
          CORE.checkRaceStatus();
        }, CONFIG.timerDelay);
      }
    },

    /**
     * Check the current race status and take appropriate actions
     */
    checkRaceStatus: function () {
      // Ensure we have the necessary elements
      if (!ELEMENTS.racing || !ELEMENTS.finished || !ELEMENTS.racingTime) return;

      setTimeout(() => {
        // Check for race end
        if (ELEMENTS.racing.style.display !== 'none' && ELEMENTS.finished.style.display !== 'none') {
          // Only navigate to the next race if auto checker is not interrupted
          if (!STATE.checkerInterrupted) {
            console.log('Game over. Creating new race.');
            HELPERS.navigateTo(HELPERS.createGameLink());
          } else {
            console.log('Game over. Auto navigation disabled. Use Ctrl+Enter to create new race.');
          }
          return;
        }

        // Check for inactive player during race
        if (ELEMENTS.racing.style.display !== 'none' && ELEMENTS.finished.style.display === 'none') {
          const totalSeconds = HELPERS.parseRacingTime(ELEMENTS.racingTime.textContent);

          // Only perform automated actions if automatic checker is not interrupted
          if (totalSeconds >= CONFIG.startFromTimer && STATE.automaticChecker && STATE.replayOnce && !STATE.checkerInterrupted) {
            STATE.replayOnce = false;

            if (STATE.autoCheckCount < CONFIG.maxSkipCount) {
              STATE.autoCheckCount++;
              localStorage.setItem('autoCheckCount', STATE.autoCheckCount);
              console.log('You were inactive after race started. Moving to the next race.');

              // Navigate to next race with exponential backoff retry strategy
              CORE.navigateWithRetry();
            } else {
              localStorage.setItem('autoCheckCount', 0);
              console.log('You are out of maximum skip count. Moving to the game list page.');
              HELPERS.navigateTo(URLS.gameList);
            }
          }
        }
      }, CONFIG.statusCheckDelay);
    },

    /**
     * Navigate to the next race with exponential backoff retry strategy
     */
    navigateWithRetry: function () {
      // Don't attempt navigation if checker is interrupted
      if (STATE.checkerInterrupted) {
        console.log('Navigation cancelled - automatic checker is disabled.');
        return;
      }

      HELPERS.navigateTo(HELPERS.createGameLink());

      // Initialize retry strategy
      let currentRetryDelay = CONFIG.timerDelay;
      const maxRetryDelay = 60000; // 60 seconds

      const doubleReplay = async () => {
        // Check if checker is still enabled before proceeding
        if (STATE.checkerInterrupted) {
          console.log('Retry cancelled - automatic checker is disabled.');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, currentRetryDelay));
        console.log(`Retrying in ${currentRetryDelay / 1000} seconds...`);

        // Check again before navigating
        if (STATE.checkerInterrupted) {
          console.log('Navigation cancelled - automatic checker is disabled.');
          return;
        }

        // Navigate to new game
        HELPERS.navigateTo(HELPERS.createGameLink(), 0);

        // Exponentially increase delay with cap
        currentRetryDelay = Math.min(currentRetryDelay * 2, maxRetryDelay);
        console.log(`Next retry delay set to ${currentRetryDelay / 1000} seconds`);

        // Schedule next retry only if checker is not interrupted
        if (!STATE.checkerInterrupted) {
          setTimeout(doubleReplay, currentRetryDelay);
        }
      };

      // Start retry process after initial delay only if checker is not interrupted
      if (!STATE.checkerInterrupted) {
        setTimeout(doubleReplay, CONFIG.timerDelay);
      }
    }
  };

  // Initialize the script
  CORE.init();
})();