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
    // Input type text where the user types letter by letter
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

    let errorObserverEnabled = true; // Enable or disable error autocorrelation
    let inputBackup = ''; // String accumulator of the correct word until mistype will happen 

    // Observe mutations to input class for error handling
    const errorObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && inputElement.classList.contains('error')) {
          inputElement.value = inputBackup; // set the value to the backup
          lastCursorPosition = inputBackup.length; // update the cursor position
        } else {
          inputBackup = inputElement.value; // backup the value of the input element
        }
      });
    });

    if (errorObserverEnabled) {
      errorObserver.observe(inputElement, { attributes: true, attributeFilter: ['class'] });
    } else if (!errorObserverEnabled) {
      errorObserver.disconnect();
    }

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
        inputElement.style.outline = 'none'; // Clear outline after focus restored
        inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
      }
    });
  }

  let replayOnce = true;
  let automaticChecker = true;
  let checkerInterrupted = false;
  let timerId;

  const replay = `https://klavogonki.ru/g/${new URLSearchParams(window.location.search).get('gmid')}.replay`;
  const gameList = 'https://klavogonki.ru/gamelist/';


  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      console.log('Ctrl + Enter was pressed. Creating next race.');
      setTimeout(() => {
        window.location.href = replay;
      }, 100);
    } else if (event.key === 'Escape') {
      console.log('Esc was pressed. Moving on gamelist page.');
      setTimeout(() => {
        window.location.href = gameList;
      }, 100);
    } else if (event.shiftKey && event.code === 'Enter') {

      // Input type text where the user types letter by letter
      const inputElement = document.querySelector('#typeblock #inputtext');
      inputElement.style.transition = 'background 0.3s';

      if (!checkerInterrupted) {
        console.log("Changing checkerInterrupted flag to true to prevent automaticChecker.");
        checkerInterrupted = true;
        inputElement.style.setProperty('background', 'hsla(60, 100%, 50%, 0.95)', 'important'); // yellow with opacity 0.95
        setTimeout(() => {
          inputElement.style.setProperty('background', 'hsla(60, 100%, 50%, 0.1)', 'important'); // yellow with opacity 0.05
        }, 500);
      }

      else if (checkerInterrupted) {
        console.log("Restoring checkerInterrupted flag to false to turn on automaticChecker.");
        checkerInterrupted = false;
        inputElement.style.setProperty('background', 'hsla(140, 100%, 50%, 0.95)', 'important'); // green with opacity 0.95
        setTimeout(() => {
          inputElement.style.setProperty('background', 'hsla(140, 100%, 50%, 0.1)', 'important'); // green with opacity 0.05
        }, 500);
      }

    }
  };

  // Add keydown event listener for "Escape", "Enter" with "Ctrl" and "Space" keys
  window.addEventListener("keydown", handleKeyDown);

  function startGame() {
    game.hostStart();
    restoreCursorFocus();
  }

  // How much skipped races allowed except for the first race created manually
  const maxSkipCount = 1; // sec
  // Create next race after (N) seconds is out referencing the racing timer (not timeout)
  const startFromTimer = 2; // sec
  // Time in (N) milliseconds after the automatically skip will be triggered due to inactivity
  const timerDelay = 1500; // best default value 1500 ms

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

  // Run the function only when "doubleSpacePressed" flag is set to "false"
  function checkingAfterKeydown() {

    clearTimeout(timerId);
    automaticChecker = false;
    autoCheckCount = 0;
    localStorage.setItem('autoCheckCount', autoCheckCount);

    if (!checkerInterrupted) {
      timerId = setTimeout(() => {
        console.log('You stopped keydown action after triggering one. Activating automatic checker.');
        automaticChecker = true;
        automaticChecking();
      }, timerDelay);
    }

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

      // add keydown event listener to trigger "checkingAfterKeydown" function
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

          // add keydown event listener to trigger "checkingAfterKeydown" function
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