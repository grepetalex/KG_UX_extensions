// ==UserScript==
// @name         KG_Easy_Race_Creation
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  No more hotkeys
// @author       Patcher
// @match        *://klavogonki.ru/g/?gmid=*
// @grant        none
// ==/UserScript==

(function () {

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
  }

  const maxSkipCount = 1;
  const startFromTimer = 2;
  const timerDelay = 1500;

  let autoCheckCount = localStorage.getItem('autoCheckCount') ? parseInt(localStorage.getItem('autoCheckCount')) : 0;

  function automaticChecking() {
    const racing = document.querySelector('#racing');
    const racingTime = document.querySelector('#racing_time');
    const finished = document.querySelector('#finished');

    // first check for the race end
    if (racing.style.display !== 'none' && finished.style.display !== 'none') {
      // wait for a delay after the game ends before replaying
      setTimeout(() => {
        alert('Game over. Moving next race.');
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
          alert('You was inactive after race started. Moving next race.');
          window.location.href = replay;
        } else {
          localStorage.setItem('autoCheckCount', 0);
          alert('You are out of maximum skip count. Moving on game list page.');
          window.location.href = gameList;
        }
      }
    }
  }

  function checkingAfterKeydown() {
    clearTimeout(timerId);
    automaticChecker = false;
    autoCheckCount = 0;
    localStorage.setItem('autoCheckCount', autoCheckCount);
    timerId = setTimeout(() => {
      alert('You stopped typing. Activating automatic checker to skip the race.');
      automaticChecker = true;
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
      alert('All elements present');
      startGame();

      const statusObserver = new MutationObserver(() => {
        setTimeout(() => {
          automaticChecking();
        }, 300);
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
              alert(`${node.id} present`);
            }
          });
        });
        // Check if all elements are now present
        if (statusInner && racing && racingTime && paused && finished) {
          // All elements are present, so do something with them
          alert('All elements present');
          // Add your code here to do something with the elements
          observer.disconnect(); // Stop observing once all elements are present
          startGame();

          const statusObserver = new MutationObserver(() => {
            setTimeout(() => {
              automaticChecking();
            }, 300);
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