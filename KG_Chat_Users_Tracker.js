// ==UserScript==
// @name         KG_Chat_Users_Tracker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Count how much users are in chat and notify who entered and left the chat
// @author       Patcher
// @match        *://klavogonki.ru/gamelist/
// @grant        none
// ==/UserScript==

(function () {
  // SOUND NOTIFICATION
  // Note values and their corresponding frequencies
  // C0 to B8
  const notesToFrequency = {};
  for (let i = 0; i < 88; i++) {
    const note = i - 48;
    const frequency = Math.pow(2, (note - 9) / 12) * 440;
    notesToFrequency[i] = frequency;
  }

  // List of major and minor notes to play
  const majorNotes = [48, 60]; // C4, C5
  const minorNotes = [60, 48]; // C5, C4

  // Volume and duration settings
  const volumeEntered = 0.35;
  const volumeLeft = 0.35;
  const duration = 120;
  const fadeTime = 50;

  // Function to play a beep given a list of notes and a volume
  async function playBeep(notes, volume) {
    const context = new AudioContext();
    for (const note of notes) {
      if (note === 0) {
        // Rest note
        await new Promise((resolve) => setTimeout(resolve, duration));
      } else {
        // Play note
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.connect(gain);
        oscillator.frequency.value = notesToFrequency[note];
        oscillator.type = "triangle";

        // Create low pass filter to cut frequencies below 250Hz
        const lowPassFilter = context.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.value = 250;
        oscillator.connect(lowPassFilter);

        // Create high pass filter to cut frequencies above 16kHz
        const highPassFilter = context.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.value = 16000;
        lowPassFilter.connect(highPassFilter);

        gain.connect(context.destination);
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(volume, context.currentTime + fadeTime / 1000);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration * 0.001);
        gain.gain.setValueAtTime(volume, context.currentTime + (duration - fadeTime) / 1000);
        gain.gain.linearRampToValueAtTime(0, context.currentTime + duration / 1000);
        await new Promise((resolve) => setTimeout(resolve, duration));
      }
    }
  }

  // Text to speech
  function textToSpeech(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.voice = speechSynthesis.getVoices().find((voice) => voice.name === 'Microsoft Pavel - Russian (Russia)');

    speechSynthesis.speak(utterance);
  }

  // Functions to play beep for user entering and leaving
  function userEntered(user) {
    playBeep(majorNotes, volumeEntered);
    const message = `${user} зашёл`
    setTimeout(() => {
      textToSpeech(message);
    }, 300);
  }

  function userLeft(user) {
    playBeep(minorNotes, volumeLeft);
    const message = `${user} вышел`
    setTimeout(() => {
      textToSpeech(message);
    }, 300);
  }


  // POPUPS
  // Define the function to generate HSL color with user parameters for hue, saturation, lightness 
  function getHSLColor(hue, saturation, lightness) {
    // Set default value for hue
    if (typeof hue === 'undefined') {
      hue = 180;
    }
    // Set default value for saturation
    if (typeof saturation === 'undefined') {
      saturation = 50;
    }
    // Set default value for lightness
    if (typeof lightness === 'undefined') {
      lightness = 50;
    }
    var color = `hsl(${hue},${saturation}%,${lightness}%)`;
    return color;
  }

  // Reference for the existing popup
  let previousPopup = null;

  function showUserAction(user, action, presence) {
    const userPopup = document.createElement('div');
    userPopup.classList.add('userPopup');
    userPopup.innerText = `${user} ${action}`;

    // Set the initial styles for the user popup
    userPopup.style.position = 'fixed';
    userPopup.style.right = '-100%';
    userPopup.style.transform = 'translateY(-50%)';
    userPopup.style.opacity = '0';
    userPopup.style.color = presence ? getHSLColor(100, 50, 50) : getHSLColor(0, 50, 70); // fontColor green && red 
    userPopup.style.backgroundColor = presence ? getHSLColor(100, 50, 10) : getHSLColor(0, 50, 15); // backgroundColor green && red 
    userPopup.style.border = presence ? `1px solid ${getHSLColor(100, 50, 25)}` : `1px solid ${getHSLColor(0, 50, 40)}`; // borderColor green && red
    userPopup.style.setProperty('border-radius', '4px 0 0 4px', 'important');
    userPopup.style.padding = '8px 16px';
    userPopup.style.display = 'flex';
    userPopup.style.alignItems = 'center';

    // Append the user popup to the body
    document.body.appendChild(userPopup);

    // Calculate the width and height of the user popup
    const popupWidth = userPopup.offsetWidth;
    const popupHeight = userPopup.offsetHeight;
    const verticalOffset = 2;

    // Set the position of the user popup relative to the previous popup
    let topPosition = '30vh';
    if (previousPopup !== null) {
      const previousPopupPosition = previousPopup.getBoundingClientRect();
      topPosition = `calc(${previousPopupPosition.bottom}px + ${popupHeight}px / 2 + ${verticalOffset}px)`;
    }
    userPopup.style.top = topPosition;
    userPopup.style.right = `-${popupWidth}px`;

    // Animate the user popup onto the screen
    userPopup.style.transition = 'all 0.3s ease-in-out';
    userPopup.style.right = '0';
    userPopup.style.opacity = '1';

    // Store a reference to the current popup
    previousPopup = userPopup;

    // Hide the user popup after a short delay
    setTimeout(() => {
      userPopup.style.transition = 'all 0.3s ease-in-out';
      userPopup.style.right = `-${popupWidth}px`;
      userPopup.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(userPopup);
        // Clear the reference to the previous popup
        if (previousPopup === userPopup) {
          previousPopup = null;
        }
      }, 300);
    }, 5000);
  }

  // FUNCTIONALITY
  // Define references to retrieve and create
  const userList = document.querySelector('.userlist-content');
  const userCount = document.createElement('div');
  userCount.classList.add('user-count');
  userCount.style.filter = 'grayscale(100%)';
  userCount.innerHTML = '0';
  document.body.appendChild(userCount);

  // Initialize variables to keep track of the current and previous users
  let currentUsers = [];
  let previousUsers = [];
  let hasObservedChanges = false;
  let prevUserCountValue = 0;

  // Initialize variables for the user count animation
  let currentTextContent = [];
  let isAnimating = false;

  // Define the users to track and notify with popup and audio
  const usersToTrack = [
    'Даниэль', // Покупатель
    'певец', // Тараторка
    'ВеликийИнка', // Зачинщик
    'madinko' // Ябеда
  ];

  // Mutation observer to track all the users with only graphical popup notification
  // Also play notification sound "Left" or "Entered" if the one of them is identical from "usersToTrack" array
  // Create a mutation observer to detect when the user list is modified
  const observeUsers = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Retrieve all users textContent from userList ins elements
        const newUserList = Array.from(userList.children).map(child => child.textContent);

        // Find new users and left users
        const newUsers = newUserList.filter(user => !currentUsers.includes(user));
        const leftUsers = currentUsers.filter(user => !newUserList.includes(user));

        // Update the user count
        const userCountValue = newUserList.length;
        const userCount = document.querySelector('.user-count');

        // Update grayscale filter
        userCount.style.filter = userCountValue > 0 ? 'none' : 'grayscale(100%)';

        // Check if the user count animation needs to be started
        if (currentTextContent.length === 0 && newUserList.length > 0 && !isAnimating) {
          isAnimating = true;
          const actualUserCount = newUserList.length;
          const speed = 20; // Change the speed here (in milliseconds)
          let count = 0;
          const userCountIncrement = () => {
            if (count <= actualUserCount) {
              const progress = count / actualUserCount;
              const grayscale = 100 - progress * 100;
              userCount.innerHTML = `${count++}`;
              userCount.style.filter = `grayscale(${grayscale}%)`;
              setTimeout(userCountIncrement, speed);
            } else {
              currentTextContent = Array.from(userList.children).map(child => child.textContent);
              userCount.style.filter = 'none';
              userCount.classList.add('pulse');
              setTimeout(() => {
                userCount.classList.remove('pulse');
              }, 1000);
            }
          };
          setTimeout(userCountIncrement, speed);
        } // Animation END

        // Check if the user count has changed and add pulse animation
        if (userCountValue !== prevUserCountValue) {
          userCount.classList.add('pulse');
          setTimeout(() => {
            userCount.classList.remove('pulse');
          }, 1000);
        }

        // Log new and left users
        if (hasObservedChanges) {
          newUsers.forEach((newUser) => {
            if (!previousUsers.includes(newUser)) {
              showUserAction(newUser, 'зашёл', true);
              if (usersToTrack.includes(newUser)) {
                userEntered(newUser);
              }
            }
          });
          leftUsers.forEach((leftUser) => {
            showUserAction(leftUser, 'вышел', false);
            if (usersToTrack.includes(leftUser)) {
              userLeft(leftUser);
            }
          });
        } else {
          hasObservedChanges = true;
        }

        // Update the previous users and user count
        previousUsers = currentUsers;
        currentUsers = newUserList;
        prevUserCountValue = userCountValue;

      }
    });
  });

  // Start observing users
  const config = { childList: true };
  observeUsers.observe(userList, config);


  // STYLIZATION
  const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');

  .user-count {
    font-family: 'Orbitron', sans-serif;
    font-size: 24px;
    color: #83cf40;
    position: fixed;
    top: 130px;
    right: 24px;
    background-color: #2b4317;
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #4b7328;
    transition: filter 0.2s ease-in-out;
  }

  .pulse {
    animation-name: pulse;
    animation-duration: 1s;
    animation-iteration-count: 1;
  }

  @keyframes pulse {
    0% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.5);
    }
    100% {
      filter: brightness(1);
    }
  }
`;

  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

})();