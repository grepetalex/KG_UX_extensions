// ==UserScript==
// @name         KG_Easy_Race_Flow
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  No more hotkeys && Limitless error correction && Lost focuses
// @author       Patcher
// @match        *://klavogonki.ru/g/?gmid=*
// @grant        none
// ==/UserScript==

(function () {

  // Deal with lost cursor focus on the fly
  // Automatically clear the input if error to avoid backspace pressing
  function restoreCursorFocus() {
    const inputElement = document.querySelector('#typeblock #inputtext');

    // Check if input element exists and is a text input
    if (!inputElement || inputElement.tagName !== 'INPUT' || inputElement.type !== 'text') return;

    // Initialize lastCursorPosition to end of input value
    let lastCursorPosition = inputElement.value.length;

    // Observe mutations to input value for cursor movement
    const cursorObserver = new MutationObserver(() => {
      if (document.activeElement === inputElement) {
        const selectionStart = inputElement.selectionStart;
        const selectionEnd = inputElement.selectionEnd;
        if (selectionStart === selectionEnd) inputElement.setSelectionRange(lastCursorPosition, lastCursorPosition);
        else lastCursorPosition = selectionEnd;
      }
    });
    cursorObserver.observe(inputElement, { attributes: true, attributeFilter: ['value'] });

    // Observe mutations to input class for error handling
    const errorObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && inputElement.classList.contains('error')) {
          inputElement.value = '';
          lastCursorPosition = 0;
        }
      });
    });
    errorObserver.observe(inputElement, { attributes: true, attributeFilter: ['class'] });

    // Reset lastCursorPosition on input focus
    inputElement.addEventListener('focus', () => lastCursorPosition = inputElement.value.length);

    // Set cursor to end of input value on blur
    inputElement.addEventListener('blur', () => inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length));

    // Handle cursor movement and focus on click events
    document.addEventListener('click', (event) => {
      if (event.target === inputElement) return;
      if (inputElement.contains(event.target)) {
        const selectionStart = inputElement.selectionStart;
        const selectionEnd = inputElement.selectionEnd;
        if (selectionStart === selectionEnd) inputElement.setSelectionRange(lastCursorPosition, lastCursorPosition);
        else lastCursorPosition = selectionEnd;
      } else {
        inputElement.focus();
        inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
      }
    });
  }

  let replayOnce = true;
  let automaticChecker = true;
  let timerId;

  const replay = `https://klavogonki.ru/g/${new URLSearchParams(window.location.search).get('gmid')}.replay`;
  const gameList = 'https://klavogonki.ru/gamelist/';

  function handleKeyDown(event) {
    if (event.ctrlKey && event.key === "Enter") {
      setTimeout(() => {
        window.location.href = replay;
      }, 100);
    } else if (event.key === "Escape") {
      setTimeout(() => {
        window.location.href = gameList;
      }, 100);
    }
  }

  // Add keydown event listener for "Escape" key
  window.addEventListener("keydown", handleKeyDown);

  function startGame() {
    game.hostStart();
    restoreCursorFocus();
  }

  const maxSkipCount = 1;
  const startFromTimer = 2;
  const timerDelay = 1500;

  let autoCheckCount = localStorage.getItem('autoCheckCount') ? parseInt(localStorage.getItem('autoCheckCount')) : 0;

  function automaticChecking() {
    const racing = document.querySelector('#racing');
    const racingTime = document.querySelector('#racing_time');
    const finished = document.querySelector('#finished');

    // Small delay before checking the elements display state
    setTimeout(() => {

      // first check for the race end
      if (racing.style.display !== 'none' && finished.style.display !== 'none') {
        // wait for a delay after the game ends before replaying
        setTimeout(() => {
          console.log('Game over. Creating new race.');
          window.location.href = replay;
        }, timerDelay);
      }
      else if (racing.style.display !== 'none' && finished.style.display == 'none') {
        const [minutes, seconds] = racingTime.textContent.split(':').map(parseFloat);
        const totalSeconds = minutes * 60 + seconds;

        if (totalSeconds >= startFromTimer && automaticChecker && replayOnce) {
          replayOnce = false;
          if (autoCheckCount < maxSkipCount) {
            autoCheckCount++;
            localStorage.setItem('autoCheckCount', autoCheckCount);
            console.log('You was inactive after race started. Moving next race.');
            window.location.href = replay;
          } else {
            localStorage.setItem('autoCheckCount', 0);
            console.log('You are out of maximum skip count. Moving on game list page.');
            window.location.href = gameList;
          }
        }
      }

    }, 300);
  }

  function checkingAfterKeydown() {
    clearTimeout(timerId);
    automaticChecker = false;
    autoCheckCount = 0;
    localStorage.setItem('autoCheckCount', autoCheckCount);
    timerId = setTimeout(() => {
      console.log('You stopped keydown action after triggering one. Activating automatic checker.');
      automaticChecker = true;
      automaticChecking();
    }, timerDelay);
  }

  const waitForElements = () => {
    // Define the target elements
    const statusInner = document.querySelector('#status-inner');
    const racing = document.querySelector('#racing');
    const racingTime = document.querySelector('#racing_time');
    const paused = document.querySelector('#paused');
    const finished = document.querySelector('#finished');

    if (statusInner && racing && racingTime && paused && finished) {
      // All elements are present, so do something with them
      console.log('All necessary elements present. Starting the game.');
      startGame();

      const statusObserver = new MutationObserver(() => {
        automaticChecking();
      });

      statusObserver.observe(statusInner, { childList: true, subtree: true });

      // add keydown event listener
      window.addEventListener('keydown', () => {
        automaticChecker = false;
        checkingAfterKeydown();
      });
    } else {
      // At least one element is missing, so set up a mutation observer to check for it
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node === statusInner || node === racing || node === racingTime || node === paused || node === finished) {
              console.log(`${node.id} present`);
            }
          });
        });
        // Check if all elements are now present
        if (statusInner && racing && racingTime && paused && finished) {
          // All elements are present, so do something with them
          console.log('All necessary elements present. Starting the game.');
          // Add your code here to do something with the elements
          observer.disconnect(); // Stop observing once all elements are present
          startGame();

          const statusObserver = new MutationObserver(() => {
            automaticChecking();
          });

          statusObserver.observe(statusInner, { childList: true, subtree: true });

          // add keydown event listener
          window.addEventListener('keydown', () => {
            automaticChecker = false;
            checkingAfterKeydown();
          });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  waitForElements();

})();