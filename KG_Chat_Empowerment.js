// ==UserScript==
// @name         KG_Chat_Empowerment
// @namespace    klavogonki
// @version      0.2
// @description  Enhance the chat abilities
// @author       Patcher
// @match        *://klavogonki.ru/g*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @updateURL    https://raw.githubusercontent.com/VimiummuimiV/KG_Goddies/refs/heads/master/KG_Chat_Empowerment.js
// @downloadURL  https://raw.githubusercontent.com/VimiummuimiV/KG_Goddies/refs/heads/master/KG_Chat_Empowerment.js
// @grant        none
// ==/UserScript==

(function () {

  // USERS DEFINITION

  // Your actual nickname to use it as an exclusion for the message beep and voice notifications
  const myNickname = document.querySelector('.userpanel .user-block .user-dropdown .name span').textContent;

  // Function to dynamically append font link to the head
  function appendFontLink(fontFamily, fontWeights) {
    // Check if the font link element with the specified class already exists
    const existingFont = document.querySelector(`.font-${fontFamily.replace(/\s/g, '-')}`);

    // If it doesn't exist, create a new link element and append it to the document head
    if (!existingFont) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s/g, '+')}:wght@${fontWeights.join(';')}&display=swap`;
      fontLink.classList.add(`font-${fontFamily.replace(/\s/g, '-')}`);

      // Append the font link element to the document head
      document.head.appendChild(fontLink);
    }
  }

  // Specify the font weights you want to include
  const montserratFontWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
  const orbitronFontWeights = ['400', '500', '600', '700', '800', '900'];
  const robotoMonoFontWeights = ['100', '200', '300', '400', '500', '600', '700'];

  // Call the function to append Montserrat font link
  appendFontLink('Montserrat', montserratFontWeights);

  // Call the function to append Orbitron font link
  appendFontLink('Orbitron', orbitronFontWeights);

  // Call the function to append Roboto Mono font link
  appendFontLink('Roboto Mono', robotoMonoFontWeights);

  // Define voice speed limits
  const minVoiceSpeed = 0;
  const maxVoiceSpeed = 2.5;

  // Define voice pitch limits
  const minVoicePitch = 0;
  const maxVoicePitch = 2.0;

  // Define default voice speed and pitch
  const defaultVoiceSpeed = 1.5;
  const defaultVoicePitch = 1.0;

  // Retrieve KG_Chat_Empowerment from localStorage or create an object with empty voiceSettings if it doesn't exist
  // This is the main key for the settings
  let KG_Chat_Empowerment = JSON.parse(localStorage.getItem('KG_Chat_Empowerment'));

  // If KG_Chat_Empowerment doesn't exist in localStorage, create it with an empty voiceSettings object
  if (!KG_Chat_Empowerment) {
    KG_Chat_Empowerment = {
      voiceSettings: {
        voiceSpeed: defaultVoiceSpeed, // Set default values for voiceSpeed
        voicePitch: defaultVoicePitch, // Set default values for voicePitch
      },
      messageSettings: {},
    };
    localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));
  }

  // Define the default voice speed and pitch
  let voiceSpeed = KG_Chat_Empowerment.voiceSettings.voiceSpeed !== null
    ? KG_Chat_Empowerment.voiceSettings.voiceSpeed
    : defaultVoiceSpeed; // Default value if KG_Chat_Empowerment.voiceSettings.voiceSpeed is null

  let voicePitch = KG_Chat_Empowerment.voiceSettings.voicePitch !== null
    ? KG_Chat_Empowerment.voiceSettings.voicePitch
    : defaultVoicePitch; // Default value if KG_Chat_Empowerment.voiceSettings.voicePitch is null

  // Define the users to track and notify with popup and audio
  let usersToTrack = [
    { name: 'Даниэль', gender: 'Male', pronunciation: 'Даниэль' }
  ];

  // Notify if someone addresses me using these aliases (case-insensitive)
  let mentionKeywords = [];

  // Define a list of moderator whose new user nicknames in the chat list should have a shield icon.
  let moderator = [];

  // Define user list of users whose messages should be hidden
  let ignored = [];

  // Define empty array for the toggle settings
  let toggle = [];

  // Check and load settings from localStorage if available and not empty
  const storedUsersToTrack = JSON.parse(localStorage.getItem('usersToTrack')) || [];
  const storedMentionKeywords = JSON.parse(localStorage.getItem('mentionKeywords')) || [];
  const storedModerators = JSON.parse(localStorage.getItem('moderator')) || [];
  const storedIgnored = JSON.parse(localStorage.getItem('ignored')) || [];

  // Replace usersToTrack with stored value if it exists and is not empty
  usersToTrack = storedUsersToTrack?.length ? storedUsersToTrack : usersToTrack;
  // Replace mentionKeywords with stored value if it exists and is not empty
  mentionKeywords = storedMentionKeywords?.length ? storedMentionKeywords : mentionKeywords;
  mentionKeywords.push(myNickname); // Actual nickname
  // Replace moderator with stored value if it exists and is not empty
  moderator = storedModerators?.length ? storedModerators : moderator;
  // Replace ignored with stored value if it exists and is not empty
  ignored = storedIgnored?.length ? storedIgnored : ignored;

  // Key Events: CTRL and ALT

  // Initialize variables to track the state of Ctrl and Alt keys
  let isCtrlKeyPressed = false;
  let isAltKeyPressed = false;

  // Helper function to set key state based on key events
  const setKeyPressed = (key, value) => {
    if (key === 'Control') isCtrlKeyPressed = value;
    if (key === 'Alt') isAltKeyPressed = value;
  };

  // Add event listeners for keydown and keyup events
  document.addEventListener('keydown', (event) => setKeyPressed(event.key, true));
  document.addEventListener('keyup', (event) => setKeyPressed(event.key, false));

  // Add a blur event listener to reset variables when the document loses focus
  document.addEventListener('blur', () => {
    // Check if Ctrl or Alt keys were pressed
    if (isCtrlKeyPressed || isAltKeyPressed) {
      // Log the combination of keys that were true
      console.log(`${isCtrlKeyPressed ? 'Ctrl ' : ''}${isAltKeyPressed ? 'Alt ' : ''}key was true`);
      // Reset key states
      isCtrlKeyPressed = false;
      isAltKeyPressed = false;
    }
  });


  // SOUND NOTIFICATION

  // Function to create the audio context and return a Promise that resolves when the context is ready
  function createAudioContext() {
    const audioContext = new AudioContext();
    return new Promise(resolve => {
      audioContext.onstatechange = function () {
        if (audioContext.state === 'running') {
          resolve(audioContext);
        }
      };
    });
  }

  // Create the audio context and wait for it to be ready
  const audioContextPromise = createAudioContext();

  // List of frequencies to play for "User Left" && "User Entered" && "New Messages"
  const userEnteredFrequencies = [300, 600];
  const userLeftFrequencies = [600, 300];
  const usualMessageFrequencies = [500];
  const mentionMessageFrequencies = [600, 800];

  // Volume of the reader voice
  const voiceVolume = 0.8;
  // Volume of the beep signal
  const beepVolume = 0.2;
  // Duration for each frequency
  const duration = 80;
  // Smooth inception and termination for each note
  const fade = 10;
  // Space between each note to make noticeable pauses
  const delay = 100;

  // Function to play a beep given a list of frequencies
  function playBeep(frequencies, volume) {
    audioContextPromise.then(audioContext => {
      for (let i = 0; i < frequencies.length; i++) {
        const frequency = frequencies[i];
        if (frequency === 0) {
          // Rest note
          setTimeout(() => { }, duration);
        } else {
          // Play note
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.connect(gain);
          oscillator.frequency.value = frequency;
          oscillator.type = "sine";

          // Create low pass filter to cut frequencies below 250Hz
          const lowPassFilter = audioContext.createBiquadFilter();
          lowPassFilter.type = 'lowpass';
          lowPassFilter.frequency.value = 250;
          oscillator.connect(lowPassFilter);

          // Create high pass filter to cut frequencies above 16kHz
          const highPassFilter = audioContext.createBiquadFilter();
          highPassFilter.type = 'highpass';
          highPassFilter.frequency.value = 16000;
          lowPassFilter.connect(highPassFilter);

          gain.connect(audioContext.destination);
          gain.gain.setValueAtTime(0, audioContext.currentTime);
          gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + fade / 1000);
          oscillator.start(audioContext.currentTime + i * delay / 1000);
          oscillator.stop(audioContext.currentTime + (i * delay + duration) / 1000);
          gain.gain.setValueAtTime(volume, audioContext.currentTime + (i * delay + (duration - fade)) / 1000);
          gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + (i * delay + duration) / 1000);
        }
      }
    });
  }

  // Create a promise that will resolve when the list of available voices is populated
  const awaitVoices = new Promise(resolve => {
    // Create a speech synthesis object
    const synth = window.speechSynthesis;
    // Retrieve the list of available voices
    let voices = synth.getVoices();

    // Define the voice names for Pavel and Irina
    const pavelVoiceName = 'Microsoft Pavel - Russian (Russia)';
    const irinaVoiceName = 'Microsoft Irina - Russian (Russia)';

    // Find and store Pavel's voice
    let pavelVoice = voices.find(voice => voice.name === pavelVoiceName);
    // Find and store Irina's voice
    let irinaVoice = voices.find(voice => voice.name === irinaVoiceName);

    // If either voice is not found or the voices list is empty, wait for it to populate
    if (!pavelVoice || !irinaVoice || voices.length === 0) {
      synth.addEventListener('voiceschanged', () => {
        voices = synth.getVoices();
        pavelVoice = voices.find(voice => voice.name === pavelVoiceName);
        irinaVoice = voices.find(voice => voice.name === irinaVoiceName);

        // If both voices are found, continue with the initialization
        if (pavelVoice && irinaVoice) {
          // Define the utterance object as a global variable
          const utterance = new SpeechSynthesisUtterance();
          // Set the "lang" property of the utterance object to 'ru-RU'
          utterance.lang = 'ru-RU';
          // Set the "voice" property of the utterance object to Pavel's voice
          utterance.voice = irinaVoice;
          // Resolve the promise
          resolve({ synth, utterance, voices, pavelVoice, irinaVoice });
        }
      });
    } else {
      // Define the utterance object as a global variable
      const utterance = new SpeechSynthesisUtterance();
      // Set the "lang" property of the utterance object to 'ru-RU'
      utterance.lang = 'ru-RU';
      // Set the "voice" property of the utterance object to (Needed) voice
      utterance.voice = irinaVoice;
      // Resolve the promise
      resolve({ synth, utterance, voices, pavelVoice, irinaVoice });
    }
  });

  // Converts text to speech using the Web Speech API.
  async function textToSpeech(text, voiceSpeed = voiceSpeed) {
    return new Promise(async (resolve) => {
      // Wait for the voices to be loaded asynchronously
      const { synth, utterance, voice } = await awaitVoices;

      const cleanedMessage = text
        .replace(/_/g, '-') // Replace underscores with hyphens
        .replace(/https?:\/\/([a-zA-Z0-9\-\.]+)(\/[^\s]*)?/g, (_, p1) => p1) // Replace URLs with domains
        .split(' ').map(word => word.replace(/\d+/g, '')).filter(Boolean).join(' ').trim(); // Clean digits and format

      // Set utterance properties, such as text to be spoken, rate, volume, pitch, and voice
      Object.assign(utterance, {
        text: cleanedMessage, // Cleaned message to be spoken
        rate: voiceSpeed, // Speed at which the speech will be delivered
        volume: voiceVolume, // Volume level of the speech
        pitch: voicePitch, // Pitch of the speech
        voice: voice // The selected voice for the utterance
      });

      // Speak the utterance using the Web Speech synthesis engine
      synth.speak(utterance);

      // Resolve the promise once the speech finishes
      utterance.onend = resolve; // Trigger resolve to indicate completion
    });
  }

  const verbs = {
    Male: { enter: 'зашёл', leave: 'вышел' },
    Female: { enter: 'зашла', leave: 'вышла' }
  };

  function getUserGender(userName) {
    const user = usersToTrack.find((user) => user.name === userName);
    return user ? user.gender : null;
  }

  // Handles user entering and leaving actions
  function userAction(user, actionType, userGender) {
    const userToTrack = usersToTrack.find(userToTrack => userToTrack.name === user);
    const action = actionType === "enter" ? verbs[userGender].enter : verbs[userGender].leave;
    const frequencies = actionType === "enter" ? userEnteredFrequencies : userLeftFrequencies;
    const message = `${userToTrack.pronunciation} ${action}`;

    playBeep(frequencies, beepVolume);

    setTimeout(() => {
      textToSpeech(message, voiceSpeed);
    }, 300);
  }

  // POPUPS

  // Generate HSL color with optional parameters for hue, saturation, lightness
  function getHSLColor(hue = 180, saturation = 50, lightness = 50) {
    return `hsl(${hue},${saturation}%,${lightness}%)`;
  }

  // Function to purge chat user actions with a smooth step-by-step animation
  // Parameters:
  //   - delayBetweenAnimations: Delay between each animation step (default: 300ms)
  //   - smoothScrollDuration: Duration of smooth scrolling (default: 500ms)
  function purgeStaticChatNotifications(delayBetweenAnimations = 300, smoothScrollDuration = 500) {
    // Get all elements with the class .static-chat-notification
    const staticChatNotifications = Array.from(document.querySelectorAll('.static-chat-notification')).reverse();

    // Get the chat container
    const chatContainer = document.querySelector(".messages-content");

    // Return early if the chat container does not exist
    if (!chatContainer) return;

    // Function to check if an element is visible in the viewport
    function isElementVisible(element) {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }

    // Function to apply the animation to an element
    async function animateOut(element, index) {
      // Calculate the delay for each element
      const delay = index * delayBetweenAnimations;

      // Apply opacity and translation animation with delay
      await new Promise(resolve => setTimeout(resolve, delay));
      element.style.transition = `opacity ${delayBetweenAnimations / 1000}s cubic-bezier(0.83, 0, 0.17, 1), transform ${delayBetweenAnimations / 1000}s cubic-bezier(0.83, 0, 0.17, 1)`;
      element.style.opacity = 0;
      element.style.transform = `translateX(1em)`;

      // After the animation duration, remove the element
      await new Promise(resolve => setTimeout(resolve, delayBetweenAnimations));
      element.remove();

      // Check if the next notification is visible
      const nextIndex = index + 1;
      const nextElement = staticChatNotifications[nextIndex];

      if (nextElement) {
        // Use await to ensure element is visible before scrolling
        if (!isElementVisible(nextElement)) {
          await scrollToNextElement(nextElement, chatContainer, smoothScrollDuration);
        }
        // Remove the next element after scrolling or if already visible
        nextElement.remove();
      } else {
        // If last element, smooth scroll back to the bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, smoothScrollDuration));
        chatContainer.style.scrollBehavior = 'auto';
        const containers = document.querySelectorAll('.static-chat-notifications-container');
        containers.forEach(container => container.remove());
      }
    }

    // Function to handle smooth scrolling to the next element
    async function scrollToNextElement(nextElement, chatContainer, smoothScrollDuration) {
      const closestContainer = nextElement.closest('.static-chat-notifications-container');
      const containerHeight = closestContainer ? closestContainer.offsetHeight : 0;
      const extraSpace = 200;

      const distanceToTop = nextElement.offsetTop - chatContainer.offsetTop - containerHeight - extraSpace;
      chatContainer.style.scrollBehavior = 'smooth';
      chatContainer.scrollTop = distanceToTop;

      // Wait for smooth scroll animation to finish
      await new Promise(resolve => setTimeout(resolve, smoothScrollDuration));
    }

    // Use forEach on the reversed array and apply animations
    staticChatNotifications.forEach((element, index) => {
      animateOut(element, index);
    });
  }

  // Constants for SVG icon properties
  const actionIconWidth = 16;
  const actionIconHeight = 16;
  const actionStrokeWidth = 2;

  // SVG icon for entering
  const enterIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${actionIconWidth}" height="${actionIconHeight}"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${actionStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="icon-enter icon-feather icon-log-in">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
    <polyline points="10 17 15 12 10 7"></polyline>
    <line x1="15" y1="12" x2="3" y2="12"></line>
  </svg>
`;

  // SVG icon for leaving
  const leaveIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${actionIconWidth}" height="${actionIconHeight}"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${actionStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="icon-leave icon-feather icon-log-out">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
`;

  // Function to check if notifications should be shown based on localStorage settings
  function shouldShowNotifications(type) {
    const toggleData = JSON.parse(localStorage.getItem('toggle')) || []; // Retrieve toggle settings or default to empty array

    // Define toggle names based on notification type
    const toggleNames = {
      static: 'showChatStaticNotifications',
      dynamic: 'showGlobalDynamicNotifications'
    };

    // Check if the specified notification toggle is set to 'yes'
    return toggleData.some(toggle =>
      toggle.name === toggleNames[type] && toggle.option === 'yes'
    );
  }

  // Timeout before the dynamicChatNotification should be removed
  const dynamicChatNotificationTimeout = 5000;
  // Set the initial top distance for the first dynamicChatNotification
  const dynamicChatNotificationTopOffset = 160;

  function showUserAction(user, iconType, presence) {
    // Make sure if the user is tracked and has the state 'thawed' (watched) to notify about presence in the chat to leave static stamps
    const isTrackedUser = usersToTrack.some((trackedUser) =>
      trackedUser.name === user && trackedUser.state === 'thawed'
    );

    // Get current time in format "[hour:minutes:seconds]"
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Determine the icon based on the action type (enter/leave)
    const actionIcon = document.createElement('div');
    actionIcon.classList.add('action-icon');
    actionIcon.style.margin = '0 4px';
    // Fix issue with white border on default white site theme
    actionIcon.style.setProperty('border', 'none', 'important');
    actionIcon.innerHTML = iconType;

    // Append containers with notifications inside the chat only for the tracked users
    // Ensure static notifications are enabled for tracked users
    if (isTrackedUser && shouldShowNotifications('static')) {
      // Get the container for all chat messages
      const messagesContainer = document.querySelector('.messages-content div');

      // Get the last child of messagesContainer
      const latestChild = messagesContainer.lastElementChild;

      // Check if the latest child is a static-chat-notifications-container
      const isLatestContainer = latestChild && latestChild.classList.contains('static-chat-notifications-container');

      // If the latest child is not a container or the container doesn't exist, create a new one
      if (!isLatestContainer) {
        // Create a new container for chat notifications
        const staticChatNotificationsContainer = document.createElement('div');
        staticChatNotificationsContainer.classList.add('static-chat-notifications-container');
        // Append the container to the messages container
        messagesContainer.appendChild(staticChatNotificationsContainer);
      }

      // Create a new div element for the chat notification
      const staticChatNotification = document.createElement('div');

      // Add a double-click event listener to initiate the removal of chat user actions
      staticChatNotification.addEventListener('dblclick', () => {
        // Call the function to purge chat user actions with a delay of (N)ms between animations and (N) scroll speed
        purgeStaticChatNotifications(150, 100);
      });

      // Set the text content of the chat notification to include the user and time
      staticChatNotification.innerHTML = `${user} ${actionIcon.outerHTML} ${time}`;
      // Add main class for chat notifications
      staticChatNotification.classList.add('static-chat-notification');

      // Check if the presence is true or false
      if (presence) {
        // Add the 'user-entered' class to the chat notification
        staticChatNotification.classList.add('user-entered');
        // Set the background color, font color, and border color for the chat notification
        staticChatNotification.style.color = getHSLColor(100, 50, 50);
        staticChatNotification.style.backgroundColor = getHSLColor(100, 50, 10);
        staticChatNotification.style.setProperty('border', `1px solid ${getHSLColor(100, 50, 25)}`, 'important');
      } else {
        // Add the 'user-left' class to the chat notification
        staticChatNotification.classList.add('user-left');
        // Set the background color, font color, and border color for the chat notification
        staticChatNotification.style.color = getHSLColor(0, 50, 70);
        staticChatNotification.style.backgroundColor = getHSLColor(0, 50, 15);
        staticChatNotification.style.setProperty('border', `1px solid ${getHSLColor(0, 50, 40)}`, 'important');
      }

      // Set the padding, display, and margin for the chat notification
      staticChatNotification.style.padding = '8px';
      staticChatNotification.style.display = 'inline-flex';
      staticChatNotification.style.margin = '4px 2px';
      staticChatNotification.style.fontSize = '1em';

      // Append the chat notification to the latest chat notifications container
      messagesContainer.lastElementChild.appendChild(staticChatNotification);

      // Call the function to scroll to the bottom of the chat
      scrollMessagesToBottom();
    } // Static notifications END

    // Handle dynamic notifications only if dynamic notifications are enabled for all users
    if (shouldShowNotifications('dynamic')) {

      // Check dynamicChatNotificationsContainer for accessibility
      let dynamicChatNotificationsContainer = document.querySelector('.dynamic-chat-notifications-container');
      // Create container for dynamic chat notifications if not exist in DOM
      if (!dynamicChatNotificationsContainer) {
        // Container doesn't exist, so create it
        dynamicChatNotificationsContainer = document.createElement('div');
        dynamicChatNotificationsContainer.classList.add('dynamic-chat-notifications-container');
        dynamicChatNotificationsContainer.style.pointerEvents = 'none';
        dynamicChatNotificationsContainer.style.position = 'fixed';
        dynamicChatNotificationsContainer.style.display = 'flex';
        dynamicChatNotificationsContainer.style.flexDirection = 'column';
        dynamicChatNotificationsContainer.style.top = '0';
        dynamicChatNotificationsContainer.style.bottom = '0';
        dynamicChatNotificationsContainer.style.left = '0';
        dynamicChatNotificationsContainer.style.right = '0';
        dynamicChatNotificationsContainer.style.paddingTop = dynamicChatNotificationTopOffset + 'px';

        // Append the container to the body
        document.body.appendChild(dynamicChatNotificationsContainer);
      }

      // Create dynamicChatNotification element
      const dynamicChatNotification = document.createElement('div');
      dynamicChatNotification.classList.add('dynamic-chat-notification');

      // Set the text content of the dynamicChatNotification to include the user and append the icon
      dynamicChatNotification.insertAdjacentHTML('beforeend', `${user}${actionIcon.outerHTML}${time}`);

      // Set the initial static styles for the dynamicChatNotification
      dynamicChatNotification.style.position = 'relative';
      dynamicChatNotification.style.width = 'fit-content';
      dynamicChatNotification.style.display = 'flex';
      dynamicChatNotification.style.marginBottom = '0.2em';
      dynamicChatNotification.style.padding = '8px 16px 8px 12px';
      dynamicChatNotification.style.alignItems = 'center';
      dynamicChatNotification.style.left = '0';
      // Set the initial dynamicChatNotification transform beyond the screen of its 100% width
      dynamicChatNotification.style.transform = 'translateX(-100%)';
      dynamicChatNotification.style.opacity = '1';
      dynamicChatNotification.style.transition = 'transform 0.3s cubic-bezier(0.83, 0, 0.17, 1), opacity 0.3s cubic-bezier(0.83, 0, 0.17, 1)';
      // Set the dynamic colorization of the dynamicChatNotification
      dynamicChatNotification.style.color = presence ? getHSLColor(100, 50, 50) : getHSLColor(0, 50, 70); // fontColor green && red
      dynamicChatNotification.style.backgroundColor = presence ? getHSLColor(100, 50, 10) : getHSLColor(0, 50, 15); // backgroundColor green && red
      dynamicChatNotification.style.border = presence ? `1px solid ${getHSLColor(100, 50, 25)}` : `1px solid ${getHSLColor(0, 50, 40)}`; // borderColor green && red
      dynamicChatNotification.style.setProperty('border-radius', '0 4px 4px 0', 'important');

      // Append dynamicChatNotification to dynamicChatNotificationsContainer
      dynamicChatNotificationsContainer.appendChild(dynamicChatNotification);

      // Animate dynamicChatNotification
      setTimeout(() => {
        // Initiate the animation by showing the dynamicChatNotification
        dynamicChatNotification.style.transform = 'translateX(0)';

        setTimeout(() => {
          // After (N) seconds, hide it beyond the screen
          dynamicChatNotification.style.transform = 'translateX(-100%)';

          setTimeout(() => {
            // Remove the dynamicChatNotification from DOM after 300ms
            dynamicChatNotificationsContainer.removeChild(dynamicChatNotification);
          }, 300); // Remove
        }, dynamicChatNotificationTimeout); // Hide
      }, 300);
    } // Dynamic notifications END

  }


  // FUNCTIONALITY

  /*
     * Converts links to images in chat messages by creating a thumbnail and a big image on click.
     * Looks for links that contain ".jpg" or ".jpeg" or ".png" or ".gif" or "webp" extension and creates a thumbnail with the image.
     * If a thumbnail already exists, it skips the link and looks for the next one.
     * When a thumbnail is clicked, it creates a dimming layer and a big image that can be closed by clicking on the dimming layer or the big image itself.
     * Allows navigation through images using the left (<) and right (>) arrow keys.
     */

  // Define global variables for the current big image and dimming background
  let bigImage = null;

  // Define an array to store all the thumbnail links and their corresponding image URLs
  const thumbnailLinks = [];
  let currentImageIndex = 0;
  const imageChangeDelay = 50; // Prevent double slide by single press adding slight delay
  let isChangingImage = false; // Flag to track if an image change is in progress

  // Emoji for the image extension
  const imageExtensionEmoji = '📸';
  // Emoji for the web domain
  const webDomainEmoji = '🖥️';

  // List of trusted domains
  const trustedDomains = [
    'imgur.com',
    'pikabu.ru',
    'userapi.com', // vk.com
    'ibb.co', // imgbb.com
    'yaplakal.com',
    'freepik.com'
  ];

  /**
   * Checks if a given URL's domain is trusted.
   * @param {string} url - The URL to check.
   * @returns {{isTrusted: boolean, domain: string, isValid: boolean}} - Result and the extracted domain.
   */
  function isTrustedDomain(url) {
    let isValid = true; // Assume URL is valid initially
    let domain = '';

    try {
      // Parse the URL
      const parsedURL = new URL(url);
      // Split the lowercase hostname into parts
      const hostnameParts = parsedURL.hostname.toLowerCase().split('.');
      // Get the last two parts of the hostname if there are more than two, otherwise, use all parts
      const lastTwoHostnameParts = hostnameParts.length > 2 ? hostnameParts.slice(-2) : hostnameParts;
      // Join the last two parts to form the domain
      domain = lastTwoHostnameParts.join('.');
      // Check if the domain is trusted
      const isTrusted = trustedDomains.includes(domain);

      // Return an object with the result, the domain, and the validity of the URL
      return { isTrusted, domain, isValid };
    } catch (error) {
      // If an error occurs, the URL is invalid
      isValid = false;
      return { isTrusted: false, domain: '', isValid };
    }
  }

  /**
   * Function to check if a given URL has an allowed image extension
   * @param {string} url - The URL to check
   * @returns {Object} - An object with properties 'allowed' (boolean), 'extension' (string), and 'valid' (boolean)
   */
  function isAllowedImageExtension(url) {
    let valid = true; // Assume URL is valid initially

    try {
      // Use URL API to get pathname
      const extensionMatch = new URL(url).pathname.match(/\.([^.]+)$/);
      // Extract the file extension from the pathname (if any)
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
      // List of allowed image file extensions
      const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      // Check if the extracted extension is in the list of allowed extensions
      const allowed = allowedImageExtensions.includes(extension);
      // Return an object with the result, the extracted extension, and the validity of the URL
      return { valid, allowed, extension };
    } catch (error) {
      // If an error occurs, the URL is invalid
      valid = false;
      return { valid, allowed: false, extension: '' };
    }
  }

  function convertImageLinksToImage(containerType) {
    // Define a mapping for container types to their respective selectors
    const containerSelectors = {
      generalMessages: '.messages-content div', // For general chat
      chatlogsMessages: '.chat-logs-container', // For chat logs
      personalMessages: '.messages-container' // For personal messages panel
    };

    // Get the container based on the passed containerType
    const containerSelector = containerSelectors[containerType];

    // If a valid container selector exists, process the links
    if (containerSelector) {
      const container = document.querySelector(containerSelector);
      if (container) {
        // Get all links inside the container
        const links = container.querySelectorAll('a:not(.skipped)');

        // loop through all links
        for (let i = 0; i < links.length; i++) {
          const link = links[i];

          // Check if the link has a valid href
          if (!link.href || !link.href.startsWith('http')) {
            continue; // Skip invalid links
          }

          // Check if the link's href includes allowed image extension
          const { allowed, extension } = isAllowedImageExtension(link.href);

          // Check if the link's href includes trusted domain
          const { isTrusted, domain } = isTrustedDomain(link.href);

          // Check if the link's href includes the allowed image extension and the domain is trusted
          if (allowed && isTrusted) {

            // Change the text content of the link to indicate it's an image with extension and trusted domain
            link.textContent = `${imageExtensionEmoji} Image (${extension.toUpperCase()}) ${webDomainEmoji} Hostname (${domain})`;

            // Assign the href value as the title
            link.title = link.href;

            // check if thumbnail already exists
            const thumbnail = link.nextSibling;
            if (!thumbnail || !thumbnail.classList || !thumbnail.classList.contains('thumbnail')) {
              // create a new thumbnail
              const thumbnail = document.createElement('div');
              thumbnail.classList.add('thumbnail');
              thumbnail.style.width = '6vw';
              thumbnail.style.minWidth = '100px';
              thumbnail.style.maxHeight = '200px';
              thumbnail.style.height = 'auto';
              thumbnail.style.cursor = 'pointer';
              thumbnail.style.backgroundColor = 'transparent';
              thumbnail.style.padding = '2px';
              thumbnail.style.margin = '6px';

              // create an image inside the thumbnail
              const img = document.createElement('img');
              img.src = link.href; // Assign the src directly

              // Add an onload event to check if the image is loaded successfully
              img.onload = function () {
                // Check if the domain is trusted
                if (isTrustedDomain(link.href)) {
                  thumbnail.appendChild(img);

                  // insert the thumbnail after the link
                  link.parentNode.insertBefore(thumbnail, link.nextSibling);

                  // Store the thumbnail link and its corresponding image URL
                  thumbnailLinks.push({ link, imgSrc: link.href });

                  // add click event to thumbnail to create a big image and dimming layer
                  thumbnail.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Reset bigImage to null before processing the new thumbnail click
                    bigImage = null;

                    currentImageIndex = thumbnailLinks.findIndex((item) => item.imgSrc === link.href);

                    // Check if bigImage is already created
                    if (!bigImage) {
                      // Create the big image
                      bigImage = createBigImage(img.src);

                      bigImage.style.top = '50%';
                      bigImage.style.left = '50%';
                      bigImage.style.transform = 'translate(-50%, -50%) scale(1)';
                      bigImage.style.position = 'fixed';
                      bigImage.style.opacity = '0';
                      bigImage.style.zIndex = '999';
                      bigImage.style.transformOrigin = 'center center';

                      // Fade in the big image
                      fadeTargetElement(bigImage, 'show');

                      // To show the dimming background
                      fadeDimmingElement('show');

                      // Attach a keydown event listener to the document object
                      document.addEventListener('keydown', function (event) {
                        // Check if the key pressed was the "Escape" key
                        if (event.key === 'Escape') {
                          // Fade out the big image
                          fadeTargetElement(bigImage, 'hide');
                          fadeDimmingElement('hide');
                        }
                        // Check if the key pressed was the left arrow key (<)
                        else if (event.key === 'ArrowLeft') {
                          // Navigate to the previous image
                          navigateImages(-1);
                        }
                        // Check if the key pressed was the right arrow key (>)
                        else if (event.key === 'ArrowRight') {
                          // Navigate to the next image
                          navigateImages(1);
                        }
                      });
                    }
                  }); // thumbnail event end

                  // add mouseover and mouseout event listeners to the thumbnail
                  thumbnail.addEventListener('mouseover', function () {
                    img.style.opacity = 0.7;
                    img.style.transition = 'opacity 0.3s';
                  });

                  thumbnail.addEventListener('mouseout', function () {
                    img.style.opacity = 1;
                  });

                  // Call the function to scroll to the bottom of the specified container
                  scrollMessagesToBottom(containerType);
                } else {
                  // Handle the case where the domain is not trusted
                  console.error("Not a trusted domain:", link.href);

                  // Add a class to the link to skip future conversion attempts
                  link.classList.add('skipped');
                }
              };

              // Add an onerror event to handle cases where the image fails to load
              img.onerror = function () {
                // Handle the case where the image failed to load (e.g., it's a fake image)
                console.error("Failed to load image:", link.href);

                // Add a class to the link to skip future conversion attempts
                link.classList.add('skipped');
              };

              img.style.maxHeight = '100%';
              img.style.maxWidth = '100%';
              img.style.backgroundColor = 'transparent';
            }
          }
        }
      }
    }
  } // end convertImageLinksToImage

  // Function to create a big image with a dimming layer
  function createBigImage(src) {
    const bigImage = document.createElement('img');
    bigImage.src = src;
    bigImage.classList.add('scaled-thumbnail');
    bigImage.style.maxHeight = '90vh';
    bigImage.style.maxWidth = '90vw';

    document.body.appendChild(bigImage);

    // ZOOM AND MOVE -- START

    // Set the initial zoom scale and scaling factor
    let zoomScale = 1;
    let scalingFactor = 0.1;

    // Set up variables for dragging
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = -50; // Initial translation in percentage
    let translateY = -50; // Initial translation in percentage

    // Define the movement speed
    const movementSpeed = 5;

    // Function to handle zooming
    function handleZoom(event) {
      // Determine the direction of the mouse wheel movement
      const deltaY = event.deltaY;
      const direction = deltaY < 0 ? 1 : -1;

      // Update the zoom scale based on the direction and scaling factor
      zoomScale += direction * scalingFactor * zoomScale;

      // Clamp the zoom scale to a minimum of 1
      zoomScale = Math.max(zoomScale, 1);

      // Apply the new zoom scale and transform origin
      bigImage.style.transformOrigin = 'center center';
      bigImage.style.transform = `translate(${translateX}%, ${translateY}%) scale(${zoomScale})`;

      // Prevent the default scrolling behavior
      event.preventDefault();
    }

    // Function to update the image position smoothly
    function updateImagePosition(event) {
      if (isDragging) {
        // Calculate the distance moved since the last mousemove event
        const deltaX = (event.clientX - startX) / zoomScale * movementSpeed;
        const deltaY = (event.clientY - startY) / zoomScale * movementSpeed;

        // Update the translate values in percentages
        translateX += (deltaX / bigImage.clientWidth) * 100;
        translateY += (deltaY / bigImage.clientHeight) * 100;

        // Apply the new translate values in percentages
        bigImage.style.transform = `translate(${translateX}%, ${translateY}%) scale(${zoomScale})`;

        // Update the start position
        startX = event.clientX;
        startY = event.clientY;
      }
    }

    // Add event listener for mousedown
    const mouseDownHandler = (event) => {
      // Check if the middle mouse button is pressed
      if (event.button === 1) {
        isDragging = true; // Set the dragging flag
        [startX, startY] = [event.clientX, event.clientY]; // Calculate initial position
      }
    };

    // Add event listener for mouseup
    const mouseUpHandler = () => {
      isDragging = false; // Reset the dragging flag
    };

    // Add event listener for mousemove
    const mouseMoveHandler = updateImagePosition; // Assuming updateImagePosition is defined elsewhere

    // Add event listener for wheel
    const wheelHandler = handleZoom; // Assuming handleZoom is defined elsewhere

    // Attach event listeners
    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('wheel', wheelHandler);

    // Create a MutationObserver to watch for the removal of scaled-thumbnail elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check if nodes have been removed
        if (mutation.removedNodes.length) {
          mutation.removedNodes.forEach((node) => {
            // Check if the removed node is the scaled-thumbnail
            if (node.classList && node.classList.contains('scaled-thumbnail')) {
              // Remove all event listeners directly
              document.removeEventListener('mousedown', mouseDownHandler);
              document.removeEventListener('mouseup', mouseUpHandler);
              document.removeEventListener('mousemove', mouseMoveHandler);
              document.removeEventListener('wheel', wheelHandler);

              // Disconnect the observer after handling the removal
              observer.disconnect();
            }
          });
        }
      }
    });

    // Start observing the body or the relevant parent container
    observer.observe(document.body, {
      childList: true, // Watch for the addition/removal of child nodes
      subtree: true, // Observe all descendants
    });

    return bigImage;
  }

  // ZOOM AND MOVE -- END

  // Function to navigate between images within bounds
  function navigateImages(direction) {
    const newIndex = currentImageIndex + direction;

    // Ensure the new index stays within bounds
    if (newIndex >= 0 && newIndex < thumbnailLinks.length) {
      if (isChangingImage) {
        return; // If an image change is already in progress, do nothing
      }

      isChangingImage = true; // Set the flag to indicate image change is in progress

      // Update the bigImage with the new image URL
      if (bigImage) {
        bigImage.src = thumbnailLinks[newIndex].imgSrc;
      }

      // Set a timeout to reset the flag after a short delay
      setTimeout(() => {
        isChangingImage = false;
      }, imageChangeDelay); // Adjust the delay duration as needed (e.g., 50 milliseconds)

      // Update the current index
      currentImageIndex = newIndex;
    }
  }

  // Function to convert YouTube links to embedded iframes based on the specified container
  function convertYoutubeLinksToIframe(containerType) {
    // Define a mapping for container types to their respective selectors
    const containerSelectors = {
      generalMessages: '.messages-content div', // For general chat
      chatlogsMessages: '.chat-logs-container', // For chat logs
      personalMessages: '.messages-container' // For personal messages panel
    };

    // Get the container based on the passed containerType
    const containerSelector = containerSelectors[containerType];

    // If a valid container selector exists, process the links
    if (containerSelector) {
      const container = document.querySelector(containerSelector);
      if (container) {
        // Find all links within the container
        const links = container.querySelectorAll('a');

        // Process each link
        links.forEach(link => {
          const url = link.href;

          // Use the regular expression to match different YouTube link formats and extract the video ID
          const match = url.match(/(?:shorts\/|live\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);

          // If the link is a valid YouTube link, replace it with an embedded iframe
          if (match && match[1]) {
            const videoId = match[1];

            // Create a new iframe element
            const iframe = document.createElement('iframe');
            iframe.width = '280';
            iframe.height = '157.5';
            iframe.allowFullscreen = true;
            iframe.style.display = 'flex';
            iframe.style.margin = '6px';
            iframe.style.border = 'none';

            // Set the iframe source to embed the YouTube video
            iframe.src = `https://www.youtube.com/embed/${videoId}`;

            // Replace the original link with the iframe
            link.parentNode.replaceChild(iframe, link);
          }
        });
      }
    } else {
      console.error('Invalid container type specified');
    }

    // Call the function to scroll to the bottom of the specified container
    scrollMessagesToBottom(containerType);
  } // end convertYoutubeLinksToIframe

  const empowermentButtonsMargin = 4; // Margin for the empowerment buttons

  // Retrieve body element to inject this beast elements
  const bodyElement = document.querySelector('body');
  // Create parent container for the beast elements
  const empowermentButtonsPanel = document.createElement('div');
  empowermentButtonsPanel.classList.add('empowerment-panel');

  // Create user count container to store the user count number
  const userCount = document.createElement('div');
  userCount.title = 'Current Chat Users Count';
  userCount.classList.add('user-count-indicator');
  userCount.style.filter = 'grayscale(100%)';
  userCount.style.transition = '0.2s ease-in-out';
  userCount.style.fontFamily = "'Orbitron', sans-serif";
  userCount.style.fontSize = '24px';
  userCount.style.color = '#83cf40';
  userCount.style.backgroundColor = '#2b4317';
  userCount.style.width = '48px';
  userCount.style.height = '48px';
  userCount.style.display = 'flex';
  userCount.style.justifyContent = 'center';
  userCount.style.alignItems = 'center';
  userCount.style.border = '1px solid #4b7328';
  userCount.style.margin = `${empowermentButtonsMargin}px`;
  // Set initial value as 0
  userCount.innerHTML = '0';

  // Append user count element inside empowerment panel
  empowermentButtonsPanel.appendChild(userCount);
  // Apply positioning styles for the empowerment panel
  empowermentButtonsPanel.style.position = 'fixed';
  empowermentButtonsPanel.style.top = '60px';
  empowermentButtonsPanel.style.right = '12px';
  empowermentButtonsPanel.style.padding = '6px';
  empowermentButtonsPanel.style.zIndex = '1000';
  // Append panel element inside the body
  bodyElement.appendChild(empowermentButtonsPanel);

  const userCountStyles = `
  .pulse {
    animation-name: pulse;
    animation-duration: 0.5s;
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

  // Append styles in head element for the user count element
  const userCountStylesElement = document.createElement('style');
  userCountStylesElement.classList.add('user-count-pulse');
  userCountStylesElement.textContent = userCountStyles;
  document.head.appendChild(userCountStylesElement);

  // Constants for fade speed control
  const fadeIntervalTime = 10; // Time between each opacity change step in ms
  const fadeDuration = 100; // Total fade duration in ms

  // Function to create and fade the dimming element
  function fadeDimmingElement(action) {
    // Check if the dimming element already exists
    let dimming = document.querySelector('.dimming-background');

    // If the action is 'hide' and the dimming element doesn't exist, return
    if (action === 'hide' && !dimming) return;

    // Create the dimming element only if it doesn't exist
    if (!dimming) {
      dimming = document.createElement('div');
      dimming.classList.add('dimming-background');
      dimming.style.background = 'black';
      dimming.style.top = '0';
      dimming.style.left = '0';
      dimming.style.right = '0';
      dimming.style.bottom = '0';
      dimming.style.position = 'fixed';
      dimming.style.opacity = '0';
      dimming.style.zIndex = '998';

      // Append the dimming element to the body
      document.body.appendChild(dimming);

      // Add click event listener to remove the dimming element and the upper element
      dimming.addEventListener('click', function () {
        // First, check for .popup-panel, then check for previousElementSibling
        const elementToRemove = document.querySelector('.popup-panel') || dimming.previousElementSibling;
        elementToRemove?.parentNode?.removeChild(elementToRemove);
        fadeDimmingElement('hide');
      });

    }

    let opacity = parseFloat(dimming.style.opacity) || 0; // Current opacity
    const targetOpacity = action === 'show' ? 0.5 : 0; // Target opacity based on action
    const step = (targetOpacity - opacity) / (fadeDuration / fadeIntervalTime); // Calculate the change in opacity per step

    const interval = setInterval(() => {
      opacity += step; // Update the opacity
      if ((step > 0 && opacity >= targetOpacity) || (step < 0 && opacity <= targetOpacity)) {
        opacity = targetOpacity; // Cap opacity
        clearInterval(interval); // Stop the interval
        if (targetOpacity === 0) {
          // Check if the element is still a child of document.body before removing it
          if (document.body.contains(dimming)) {
            document.body.removeChild(dimming); // Remove the element from the DOM
          }
        }
      }
      dimming.style.opacity = opacity.toString(); // Update the opacity
    }, fadeIntervalTime);

    // If the action is 'hide', check for and remove the .scaled-thumbnail using fadeTargetElement
    if (action === 'hide') {
      const scaledThumbnail = document.querySelector('.scaled-thumbnail');
      if (scaledThumbnail) {
        fadeTargetElement(scaledThumbnail, 'hide'); // Use fadeTargetElement to fade out and remove the scaled-thumbnail
      }
    }

  }

  // Function to gradually fade a target element to show or hide it
  function fadeTargetElement(element, action) {
    if (!element) return; // Return if the element does not exist

    const targetOpacity = action === 'show' ? 1 : 0; // Set target opacity based on action
    let opacity = parseFloat(element.style.opacity) || 0; // Get the current opacity
    const step = (targetOpacity - opacity) / (fadeDuration / fadeIntervalTime); // Calculate the change in opacity per step

    const interval = setInterval(() => {
      opacity += step; // Update the opacity
      if ((step > 0 && opacity >= targetOpacity) || (step < 0 && opacity <= targetOpacity)) {
        opacity = targetOpacity; // Set opacity to the target value
        clearInterval(interval); // Clear the interval

        // Check if element still has a parent before removing it
        if (targetOpacity === 0 && element.parentNode) {
          element.parentNode.removeChild(element); // Remove the target element from the DOM
        }
      }
      element.style.opacity = opacity.toString(); // Update the element's opacity
    }, fadeIntervalTime);

    // Add a double click event listener to hide the element
    element.addEventListener('dblclick', (event) => {
      // Check if any panel is open
      const isPanelOpen = document.querySelector('.popup-panel');

      // If any panel is open and the double-clicked target is the scaled image, do not hide the dimming element
      if (!isPanelOpen || !event.target.closest('.scaled-thumbnail')) {
        fadeDimmingElement('hide'); // Hide the dimming element on double click, unless the target is a scaled image and a panel is open
      }

      fadeTargetElement(element, 'hide'); // Always hide the target element on double click
    });

  }

  // Function to remove the previous panel if it exists
  function removePreviousPanel() {
    const existingPanel = document.querySelector('.popup-panel');
    if (existingPanel) existingPanel.remove();
  }

  // NEW CHAT CACHE CONTROL PANEL (START)

  // Rank order mapping
  const rankOrder = {
    'Экстракибер': 1,
    'Кибергонщик': 2,
    'Супермен': 3,
    'Маньяк': 4,
    'Гонщик': 5,
    'Профи': 6,
    'Таксист': 7,
    'Любитель': 8,
    'Новичок': 9
  };

  // Rank color mapping
  const rankColors = {
    'Экстракибер': '#06B4E9', // Light Blue
    'Кибергонщик': '#5681ff', // Medium Blue
    'Супермен': '#B543F5', // Purple
    'Маньяк': '#DA0543', // Red
    'Гонщик': '#FF8C00', // Orange
    'Профи': '#C1AA00', // Yellow
    'Таксист': '#2DAB4F', // Green
    'Любитель': '#61B5B3', // Light Cyan
    'Новичок': '#AFAFAF' // Grey
  };

  // Function to display the cached user list panel
  function showCachePanel() {
    // Remove any previous panel before creating a new one
    removePreviousPanel();
    // Check if the panel already exists
    if (document.querySelector('.cached-users-panel')) return;

    // Get data from localStorage
    const fetchedUsersData = localStorage.getItem('fetchedUsers');

    // Initialize users by parsing fetched data or setting as empty object
    let users = JSON.parse(fetchedUsersData) || {};

    // Create a container div with class 'cached-users-panel'
    const cachedUsersPanel = document.createElement('div');
    cachedUsersPanel.className = 'cached-users-panel popup-panel';
    // Set initial styles
    cachedUsersPanel.style.opacity = '0';
    cachedUsersPanel.style.backgroundColor = '#1b1b1b';
    cachedUsersPanel.style.setProperty('border-radius', '0.6em', 'important');
    cachedUsersPanel.style.position = 'fixed';
    cachedUsersPanel.style.top = '100px';
    cachedUsersPanel.style.left = '50%';
    cachedUsersPanel.style.transform = 'translateX(-50%)';
    cachedUsersPanel.style.width = '80vw';
    cachedUsersPanel.style.height = '80vh';
    cachedUsersPanel.style.zIndex = '999';

    // Attach a keydown event listener to the document object
    document.addEventListener('keydown', function (event) {
      // Check if the key pressed was the "Escape" key
      if (event.key === 'Escape') {
        // Fade out the cached users panel
        fadeTargetElement(cachedUsersPanel, 'hide');
        fadeDimmingElement('hide');
      }
    });

    // Create a container div with class 'panel-header'
    const panelHeaderContainer = document.createElement('div');
    panelHeaderContainer.className = 'panel-header';
    panelHeaderContainer.style.display = 'flex';
    panelHeaderContainer.style.flexDirection = 'row';
    panelHeaderContainer.style.justifyContent = 'space-between';
    panelHeaderContainer.style.padding = '0.6em';

    // Create a container div with class 'drop-time'
    const dropTime = document.createElement('div');
    dropTime.className = 'drop-time';
    dropTime.style.display = 'flex';
    dropTime.style.justifyContent = 'center';
    dropTime.style.alignItems = 'center';
    dropTime.style.minWidth = 'fit-content';

    // Create span with description for threshold time element
    const dropTimeThresholdDescription = document.createElement('span');
    dropTimeThresholdDescription.className = 'drop-time-threshold-description';
    dropTimeThresholdDescription.textContent = '🚧 Threshold';
    dropTimeThresholdDescription.style.padding = '0.6em';
    dropTimeThresholdDescription.style.color = '#c6b209';

    const dropTimeThreshold = document.createElement('span');
    dropTimeThreshold.className = 'drop-time-threshold';
    dropTimeThreshold.style.padding = '0.6em';
    dropTimeThreshold.style.color = 'lightcoral';
    dropTimeThreshold.style.fontFamily = "'Roboto Mono', monospace";
    dropTimeThreshold.style.fontSize = '1.1em';
    dropTimeThreshold.style.fontWeight = 'bold';
    dropTimeThreshold.style.setProperty('border-radius', '0.2em', 'important');
    dropTimeThreshold.style.border = '1px solid rgba(240, 128, 128, 0.20)';
    dropTimeThreshold.style.backgroundColor = 'rgba(240, 128, 128, 0.05)';
    dropTimeThreshold.style.transition = 'filter 0.3s';
    dropTimeThreshold.style.cursor = 'pointer';

    // Add mouseover event to apply brightness filter
    dropTimeThreshold.addEventListener('mouseover', () => {
      dropTimeThreshold.style.filter = 'sepia(1)'; // Increase brightness on hover
    });

    // Add mouseout event to reset filter
    dropTimeThreshold.addEventListener('mouseout', () => {
      dropTimeThreshold.style.filter = 'sepia(0)'; // Reset brightness on mouse out
    });

    // Get the value from the localStorage key 'cacheRefreshThresholdHours'
    const storedThresholdTime = localStorage.getItem('cacheRefreshThresholdHours');
    // Update the innerHTML with the stored value (default to '00:00:00' if the key is not set)
    dropTimeThreshold.innerHTML = storedThresholdTime || '00:00:00';
    // Attach click event to the dropTimeThreshold element
    dropTimeThreshold.addEventListener('click', setCacheRefreshTime);

    // Create span with description for expiration time element
    const dropTimeExpirationDescription = document.createElement('span');
    dropTimeExpirationDescription.className = 'drop-time-expiration-description';
    dropTimeExpirationDescription.textContent = '💣 Countdown';
    dropTimeExpirationDescription.style.padding = '0.6em';
    dropTimeExpirationDescription.style.color = '#d0562c';

    const dropTimeExpiration = document.createElement('span');
    dropTimeExpiration.className = 'drop-time-expiration';
    dropTimeExpiration.style.padding = '0.6em';
    dropTimeExpiration.style.color = 'antiquewhite';
    dropTimeExpiration.style.fontFamily = "'Roboto Mono', monospace";
    dropTimeExpiration.style.fontSize = '1.1em';

    // Function to prompt the user for a cache refresh time and update the content
    function setCacheRefreshTime() {
      let isValidInput = false;

      // Keep prompting the user until valid input is provided or they click "Cancel"
      while (!isValidInput) {
        // Prompt the user for a time
        const userInput = prompt('Enter a cache refresh time (e.g., HH, HH:mm, or HH:mm:ss):');

        // Get the dropTimeThreshold element
        const dropTimeThreshold = document.querySelector('.drop-time-threshold');

        // Validate the user input
        const timeRegex = /^([0-9]+|[01][0-9]|2[0-4])(:([0-5]?[0-9])(:([0-5]?[0-9]))?)?$/; // HH, HH:mm, or HH:mm:ss

        if (userInput === null) {
          // User clicked "Cancel," exit the loop
          isValidInput = true;
        } else if (timeRegex.test(userInput)) {
          // Valid input, extract hours and set default values for minutes and seconds if not provided
          const formattedInput = userInput.split(':');
          const hours = ('0' + formattedInput[0]).slice(-2);
          const minutes = ('0' + (formattedInput[1] || '00')).slice(-2);
          const seconds = ('0' + (formattedInput[2] || '00')).slice(-2);

          // Update the content of the dropTimeThreshold element
          dropTimeThreshold.textContent = `${hours}:${minutes}:${seconds}`;

          // Combine the values and store in localStorage with the key 'cacheRefreshThresholdHours'
          const formattedTime = `${hours}:${minutes}:${seconds}`;
          localStorage.setItem('cacheRefreshThresholdHours', formattedTime);

          // Remove fetchedUsers, lastClearTime, and nextClearTime keys
          localStorage.removeItem('fetchedUsers');
          localStorage.removeItem('lastClearTime');
          localStorage.removeItem('nextClearTime');

          // Reload the current page after (N) time after changing the cache threshold
          setTimeout(() => location.reload(), 1000);

          // Set isValidInput to true to exit the loop
          isValidInput = true;
        } else {
          // Alert the user for invalid input
          alert('Invalid time format. Please enter a valid time in the format HH, HH:mm, or HH:mm:ss.');
        }
      }
    }

    // Append the childs to the drop time parent element
    dropTime.appendChild(dropTimeThresholdDescription);
    dropTime.appendChild(dropTimeThreshold);
    dropTime.appendChild(dropTimeExpirationDescription);
    dropTime.appendChild(dropTimeExpiration);

    // Append the drop time element to the panel header container
    panelHeaderContainer.appendChild(dropTime);

    // Create a container div for the search input
    const cacheSearchContainer = document.createElement('div');
    cacheSearchContainer.className = 'search-for-cached-users';
    cacheSearchContainer.style.width = '100%';
    cacheSearchContainer.style.margin = '0 20px';
    cacheSearchContainer.style.display = 'flex';

    // Create the input field for searching users
    const cacheSearchInput = document.createElement('input');
    cacheSearchInput.className = 'cached-users-search-input';
    cacheSearchInput.type = 'text';
    cacheSearchInput.style.outline = 'none';
    cacheSearchInput.style.width = '100%';
    cacheSearchInput.style.padding = '10px';
    cacheSearchInput.style.margin = '0 1em';
    cacheSearchInput.style.fontSize = '1em';
    cacheSearchInput.style.fontFamily = 'Montserrat';
    cacheSearchInput.style.setProperty('color', 'bisque', 'important');
    cacheSearchInput.style.setProperty('border-radius', '0.2em', 'important');
    cacheSearchInput.style.boxSizing = 'border-box';
    cacheSearchInput.style.backgroundColor = '#111';
    cacheSearchInput.style.border = '1px solid #222';

    // Append search input to the search container
    cacheSearchContainer.appendChild(cacheSearchInput);

    // Add click event listener to clear the search input by LMB click with Ctrl key pressed
    cacheSearchInput.addEventListener('click', () => isCtrlKeyPressed && (cacheSearchInput.value = ''));

    // Add event listener to listen for keydown events
    cacheSearchInput.addEventListener('keydown', async (event) => {
      const oldUsersContainer = document.querySelector('.old-users');
      const newUsersContainer = document.querySelector('.new-users');
      const fetchedUsersContainer = document.querySelector('.fetched-users');

      // Handle Backspace key
      if (event.key === 'Backspace' && event.target.value.length === 0) {
        oldUsersContainer.style.display = 'grid';
        newUsersContainer.style.display = 'grid';

        const searchResultsContainer = document.querySelector('.search-results');
        if (searchResultsContainer && fetchedUsersContainer) {
          fetchedUsersContainer.removeChild(searchResultsContainer);
        }
      }
      // Handle Enter key
      else if (event.key === 'Enter') {
        const inputValue = event.target.value.trim();

        // If input is empty, set it to 'user '
        if (inputValue.length === 0) {
          event.preventDefault(); // Prevent the default behavior
          event.target.value = 'user '; // Set input to 'user '
        }
      }
    });

    // Create a function to handle the search process
    const handleSearch = async (username) => {
      const oldUsersContainer = document.querySelector('.old-users');
      const newUsersContainer = document.querySelector('.new-users');
      const fetchedUsersContainer = document.querySelector('.fetched-users');

      if (username) {
        // Temporarily hide old and new user containers
        oldUsersContainer.style.display = 'none';
        newUsersContainer.style.display = 'none';

        // Find or create the search results container
        let searchResultsContainer = document.querySelector('.search-results');
        if (!searchResultsContainer) {
          searchResultsContainer = createUserContainer('search-results');
          fetchedUsersContainer.appendChild(searchResultsContainer); // Append if it's newly created
        } else {
          // Clear previous search results if the container already exists
          searchResultsContainer.innerHTML = null; // Clear existing elements
        }

        const userElements = []; // Initialize userElements array

        try {
          // Fetch user IDs by username
          const userIds = await getUserIdByName(username);

          // Iterate over each user ID and retrieve profile data
          await Promise.all(userIds.map(async (userId) => {
            // Retrieve the user's profile data once
            const profileData = await getUserProfileData(userId, false); // Do not touch localStorage key "fetchedUsers"

            // Create user element data using the retrieved profile data
            const userData = {
              rank: profileData.rank, // Assign rank directly
              login: profileData.login,
              registered: profileData.registeredDate, // Set registered to registeredDate
              bestSpeed: profileData.bestSpeed,
              ratingLevel: profileData.ratingLevel,
              friends: profileData.friends,
              cars: profileData.cars,
              avatarTimestamp: profileData.avatarTimestamp,
              avatar: profileData.avatar // Include avatar in userData
            };

            // Create the user element with userId and userData
            const userElementData = createCachePanelUserElement(userId, userData);
            if (userElementData) {
              userElements.push(userElementData);
            }
          }));

          // Sort userElements by rank and best speed
          userElements.sort((a, b) =>
            a.order !== b.order ? a.order - b.order : b.bestSpeed - a.bestSpeed
          );

          // Append user elements to the search results container
          userElements.forEach(({ userElement }) => {
            searchResultsContainer.appendChild(userElement);
          });

          // Create and append the description for search results
          const searchDescription = createDescription(`Search Results for: ${username}`, 'search-results-description');
          searchResultsContainer.prepend(searchDescription); // Append description as the first element

        } catch (error) {
          console.error('Error fetching user profile:', error);

          // Create an error message element and append it to the container
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-message';
          errorMessage.textContent = `Error fetching user profile: ${error.message}`;
          errorMessage.style.width = 'fit-content';
          errorMessage.style.whiteSpace = 'nowrap';
          errorMessage.style.fontFamily = 'Montserrat';
          errorMessage.style.color = 'lightcoral';
          searchResultsContainer.appendChild(errorMessage);
        }
      }
    };

    // Debounce the handleSearch function to prevent excessive calls
    cacheSearchInput.addEventListener(
      'input',
      debounce((event) => {
        const inputValue = event.target.value.trim();
        const searchMode = localStorage.getItem('cachePanelSearchMode');

        // Extract username if input starts with 'user ', or use input directly in 'fetch' mode
        const username = inputValue.startsWith('user ')
          ? inputValue.substring(5).trim()
          : (searchMode === 'fetch' ? inputValue : '');

        // Trigger search if a valid username exists
        if (username) handleSearch(username);
      }, debounceTimeout)
    );

    // Append the search container to the panel header container
    panelHeaderContainer.appendChild(cacheSearchContainer);

    // Use a mutation observer to wait for the element to appear in the DOM
    const observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.type === 'childList' && mutation.addedNodes.length > 0)) {
        const cachePanelSearchInput = document.querySelector('.cached-users-search-input');
        const cachePanelLogins = Array.from(document.querySelectorAll('.fetched-users .login'));

        // Fuzzy match scoring function
        const getFuzzyMatchScore = (query, text) => {
          let score = 0, queryIndex = 0;
          for (const char of text.toLowerCase()) {
            if (queryIndex < query.length && char === query[queryIndex].toLowerCase()) {
              score += 2; // Increment score for matching character
              queryIndex++; // Increment index for the next character
            }
          }
          return queryIndex === query.length ? score : 0;
        };

        // Filter items based on input query
        const filterItems = query => {
          cachePanelLogins.forEach(item => {
            const userContainer = item.closest('.user');
            userContainer.style.display = (!query || getFuzzyMatchScore(query, item.textContent) > 0) ? 'grid' : 'none';
          });
        };

        // Set focus to the search input field
        cachePanelSearchInput.focus();

        // Add input event listener to filter items as the user types
        cachePanelSearchInput.addEventListener('input', () => filterItems(cachePanelSearchInput.value.trim()));

        observer.disconnect();
      }
    });

    // Start observing the panel header container for changes
    observer.observe(panelHeaderContainer, { childList: true, subtree: true });

    // Create a container div with class 'panel-control-buttons'
    const panelControlButtons = document.createElement('div');
    panelControlButtons.className = 'panel-control-buttons';
    panelControlButtons.style.display = 'flex';

    // Helper function to apply common styles to a button
    function applyHeaderButtonStyles(button, backgroundColor, margin = '0 0.5em') {
      button.style.backgroundColor = backgroundColor;
      button.style.width = '48px';
      button.style.height = '48px';
      button.style.display = 'flex';
      button.style.justifyContent = 'center';
      button.style.alignItems = 'center';
      button.style.cursor = 'pointer';
      button.style.setProperty('border-radius', '0.2em', 'important');
      button.style.margin = margin; // Set margin using the provided value
      button.style.filter = 'brightness(1)';
      button.style.transition = 'filter 0.3s ease';
    }

    // Create cache panel search mode button with the provided SVG icon
    const cachePanelSearchMode = document.createElement('div');
    cachePanelSearchMode.className = 'user-mode-button';
    cachePanelSearchMode.innerHTML = usersSVG;
    // Apply common styles using the helper function
    applyHeaderButtonStyles(cachePanelSearchMode, 'darkslateblue');

    // Set the initial value or existing for cachePanelSearchMode if it doesn't exist
    const currentSearchMode = localStorage.getItem('cachePanelSearchMode') || (localStorage.setItem('cachePanelSearchMode', 'cache'), 'cache');

    // Set the title dynamically
    cachePanelSearchMode.title = `Current active mode: ${currentSearchMode}`;

    // Function to update styles based on the current mode
    function updateStyles(mode) {
      const backgroundColor = mode === 'fetch' ? '#b2a4f9' : 'darkslateblue';
      const strokeColor = mode === 'fetch' ? 'darkslateblue' : '#b2a4f9';

      // Apply the new background color using the helper function
      applyHeaderButtonStyles(cachePanelSearchMode, backgroundColor);

      // Update the SVG stroke color
      const svg = cachePanelSearchMode.querySelector('svg');
      if (svg) {
        svg.setAttribute('stroke', strokeColor);
      }
    }

    // Initial mode setup
    updateStyles(currentSearchMode);

    // Add click event listener to the cache panel search mode button
    cachePanelSearchMode.addEventListener('click', () => {
      // Toggle between 'cache' and 'fetch' values
      const currentMode = localStorage.getItem('cachePanelSearchMode');
      const newMode = currentMode === 'cache' ? 'fetch' : 'cache';
      // Set new mode in localStorage
      localStorage.setItem('cachePanelSearchMode', newMode);
      // Update styles based on the new mode
      updateStyles(newMode);
      // Set the title dynamically based on the new mode
      cachePanelSearchMode.title = `Current active mode: ${newMode}`;
      // Optional: Log the current mode for debugging
      // console.log(`Current mode: ${newMode}`);
    });

    // Append the search mode button to the panel header container
    panelControlButtons.appendChild(cachePanelSearchMode);

    // Create a clear cache button with the provided SVG icon
    const clearCacheButton = document.createElement('div');
    clearCacheButton.className = 'clear-cache-button';
    clearCacheButton.title = 'Clear cache';
    clearCacheButton.innerHTML = trashSVG;
    // Apply common styles using the helper function
    applyHeaderButtonStyles(clearCacheButton, 'brown');

    // Add a click event listener to the clear cache button
    clearCacheButton.addEventListener('click', () => {
      // Call the helper function to hide and remove the cachedUsersPanel
      hideCachePanel();
      // Clear the cache manually and reset the timer
      refreshFetchedUsers(true, cacheRefreshThresholdHours);

      // Set the user count element to 0
      const userCountElement = document.querySelector('.cache-panel-load-button .user-count');
      if (userCountElement) userCountElement.textContent = '0'; // Set the user count to 0
    });

    // Append the clear cache button to the panel header container
    panelControlButtons.appendChild(clearCacheButton);

    // Create a close button with the provided SVG icon
    const closePanelButton = document.createElement('div');
    closePanelButton.className = 'close-panel-button';
    closePanelButton.title = 'Close panel';
    closePanelButton.innerHTML = closeSVG;
    // Apply common styles using the helper function
    applyHeaderButtonStyles(closePanelButton, 'darkolivegreen', '0 0 0 0.5em');

    // Add a click event listener to the close panel button
    closePanelButton.addEventListener('click', () => {
      // Remove the cached-users-panel when the close button is clicked
      hideCachePanel();
    });

    // Create an array containing the buttons we want to apply the events to
    const buttons = [clearCacheButton, closePanelButton];

    // Iterate through each button in the array
    buttons.forEach(button => {
      // Add a mouseover event listener to change the button's brightness on hover
      button.addEventListener('mouseover', () => {
        button.style.filter = 'brightness(0.8)'; // Dim the button
      });

      // Add a mouseout event listener to reset the button's brightness when not hovered
      button.addEventListener('mouseout', () => {
        button.style.filter = 'brightness(1)'; // Reset to original brightness
      });
    });

    // Append the close button to the panel header container
    panelControlButtons.appendChild(closePanelButton);

    // Append the panel control buttons element inside the panel header container
    panelHeaderContainer.appendChild(panelControlButtons);

    // Create a container div with class 'fetched-users'
    const fetchedUsersContainer = document.createElement('div');
    fetchedUsersContainer.className = 'fetched-users';

    // Set grid layout properties
    fetchedUsersContainer.style.display = 'grid'; // Use grid layout
    fetchedUsersContainer.style.gridTemplateRows = '1fr 1fr'; // Stack two rows for new and old users
    fetchedUsersContainer.style.height = 'calc(100% - (64px + 0.6em))'; // Set height for main container
    fetchedUsersContainer.style.overflowY = 'auto'; // Enable vertical scrolling if needed

    // Function to create a user container with common styles
    function createUserContainer(className) {
      const userContainer = document.createElement('div');
      userContainer.className = className;

      // Add common CSS styles for grid layout and centering
      userContainer.style.display = 'grid';
      userContainer.style.gridAutoFlow = 'dense'; // Allows items to fill empty spaces
      userContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))'; // Responsive columns
      userContainer.style.gap = '12px'; // Space between items
      userContainer.style.padding = '24px';
      userContainer.style.height = 'fit-content';

      return userContainer;
    }

    // Create containers for old and new users
    const oldUsersContainer = createUserContainer('old-users');
    const newUsersContainer = createUserContainer('new-users');

    // Function to create a description for user groups
    function createDescription(text, className) {
      const description = document.createElement('span');
      description.className = className;
      description.textContent = text;
      description.style.color = 'bisque';
      description.style.fontFamily = 'Montserrat';
      description.style.fontSize = '1em';
      description.style.margin = '0';
      description.style.padding = '0.4em 0.2em';
      // Make description span all columns
      description.style.gridColumn = '1 / -1';
      description.style.height = 'fit-content';
      return description;
    }

    // Create and style descriptions for old and new users
    const oldUsersDescription = createDescription('Active Users', 'old-users-description'); // Create description for old users
    const newUsersDescription = createDescription('New Registrations', 'new-users-description'); // Create description for new users

    // Append descriptions to their respective containers
    oldUsersContainer.appendChild(oldUsersDescription); // Append description to old users container
    newUsersContainer.appendChild(newUsersDescription); // Append description to new users container

    // Append containers to the fetchedUsersContainer
    fetchedUsersContainer.appendChild(oldUsersContainer);
    fetchedUsersContainer.appendChild(newUsersContainer);

    // Create an array to hold user elements
    const userElements = [];

    // Get current date for comparison
    const currentDate = new Date();

    // Helper function to check if registered date is within the last 24 hours
    const isNewUser = (registered) => {
      const registeredDate = new Date(registered);
      const timeDifference = currentDate - registeredDate; // Difference in milliseconds
      return timeDifference <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    };

    // This function creates a user element for the cache panel with detailed user information and metrics.
    const createCachePanelUserElement = (userId, userData) => {
      // Create the main container for the user.
      const userElement = document.createElement('div');
      userElement.className = 'user';
      userElement.style.padding = '0.2em';
      userElement.style.margin = '0.4em 0.2em';
      userElement.style.display = 'grid';
      userElement.style.gridTemplateColumns = 'auto 1fr';
      userElement.style.alignItems = 'center';
      userElement.style.height = 'fit-content';

      // Define base styling for tracked and untracked users.
      const baseStyle = {
        marginLeft: '8px',
        borderRadius: '2px !important'
      };

      // Styles for tracked and untracked users.
      const styles = {
        tracked: { ...baseStyle, color: 'greenyellow', backgroundColor: 'darkgreen', fontWeight: 'bold', padding: '0 6px' },
        untracked: { ...baseStyle, color: 'orange', fontWeight: 'normal' }
      };

      // Helper function to convert styles into a CSS string.
      const generateStylesString = (styles) =>
        Object.entries(styles)
          .map(([key, value]) => `${key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}: ${value}`)
          .join('; ');

      // Choose the appropriate style based on whether the user is tracked.
      const chosenStyles = userData.tracked ? styles.tracked : styles.untracked;

      // Create an avatar container.
      const avatarElement = document.createElement('div');
      avatarElement.className = 'avatar';
      avatarElement.style.marginRight = '8px';

      // Handle avatar URL and display logic.
      const avatarTimestamp = fetchedUsers[userId]?.avatarTimestamp;
      const bigAvatarUrl = `/storage/avatars/${userId}_big.png`;

      if ((avatarTimestamp && avatarTimestamp !== '00') || (userData.avatar && Object.keys(userData.avatar).length > 0)) {
        const finalAvatarUrl = `${bigAvatarUrl}?updated=${avatarTimestamp}`;
        const imgElement = document.createElement('img');
        imgElement.src = finalAvatarUrl;
        imgElement.alt = `${userData.login}'s avatar`;
        imgElement.style.height = '24px';
        imgElement.style.width = '24px';
        imgElement.style.objectFit = 'cover';
        avatarElement.appendChild(imgElement);
      } else {
        // Display a random emoji avatar if no avatar is available.
        avatarElement.style.fontSize = '1.8rem';
        avatarElement.innerHTML = getRandomEmojiAvatar();
      }

      // Create the login element with a link to the user's profile.
      const loginElement = document.createElement('a');
      loginElement.className = 'login';
      loginElement.textContent = userData.login;
      loginElement.href = `https://klavogonki.ru/profile/${userId}`;

      // If the user has visit data, display it.
      if (userData.visits !== undefined) {
        loginElement.innerHTML += `<span style="${generateStylesString(chosenStyles)}">${userData.visits}</span>`;
      }

      // Set styles and hover behavior for the login link.
      loginElement.style.setProperty('color', 'skyblue', 'important');
      loginElement.style.textDecoration = 'none';
      loginElement.style.fontFamily = 'Montserrat';
      loginElement.style.transition = 'color 0.3s ease';

      loginElement.addEventListener('mouseover', () => {
        loginElement.style.setProperty('color', 'cornsilk', 'important');
      });

      loginElement.addEventListener('mouseout', () => {
        loginElement.style.setProperty('color', 'skyblue', 'important');
      });

      // Load a given URL into the iframe.
      const loadProfileInIframe = (url) => {
        // Create an iframe to display user profile pages.
        const profileIframe = document.createElement('iframe');
        profileIframe.classList.add('profile-iframe-container');
        profileIframe.style.border = 'none';
        profileIframe.src = url;
        profileIframe.style.display = 'flex';
        profileIframe.style.position = 'fixed';
        profileIframe.style.zIndex = '999';
        profileIframe.style.width = '75vw';
        profileIframe.style.minWidth = '1000px';
        profileIframe.style.height = '80vh';
        profileIframe.style.top = '48.5vh';
        profileIframe.style.left = '50vw';
        profileIframe.style.transform = 'translate(-50%, -50%)';

        document.body.appendChild(profileIframe); // Append iframe to the document body.

        // Function to handle the space key press.
        const removeIframe = () => {
          profileIframe.remove(); // Remove the iframe from the document.
          document.removeEventListener('keydown', handleSpaceKey); // Clean up the event listener from the document.
        };

        const handleSpaceKey = (event) => {
          if (event.code === 'Space') {
            event.preventDefault(); // Prevent scroll caused by the space key.
            removeIframe(); // Call the remove function.
          }
        };

        // Add event listener for the 'keydown' event to listen for space key presses.
        document.addEventListener('keydown', handleSpaceKey);

        // Prevent space key scrolling inside the iframe.
        profileIframe.onload = () => {
          // Add event listener for the iframe's contentWindow to listen for space key presses.
          profileIframe.contentWindow.addEventListener('keydown', handleSpaceKey);

          // Add event listener for double click to remove the iframe.
          profileIframe.contentWindow.addEventListener('dblclick', removeIframe);

          // Create the MutationObserver to watch for specific elements being removed.
          const observer = new MutationObserver((mutations) => {
            if (mutations.some(mutation =>
              Array.from(mutation.removedNodes).some(node =>
                node.nodeType === Node.ELEMENT_NODE &&
                (node.classList.contains('dimming-background') || node.classList.contains('cached-users-panel'))
              )
            )) {
              removeIframe(); // Call the remove function.
              observer.disconnect(); // Stop observing.
            }
          });

          // Start observing the document body for changes.
          observer.observe(document.body, { childList: true, subtree: true });
        };
      };

      // Load the user's profile in the iframe on click.
      loginElement.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent page navigation.
        loadProfileInIframe(loginElement.href);
      });

      // Helper function to create metric elements (speed, rating, etc.).
      const createMetricElement = (className, color, icon, value, title, url) => {
        const element = document.createElement('span');
        element.className = className;
        element.style.color = color;
        element.innerHTML = `${icon}${value || 0}&nbsp;&nbsp;`;
        element.title = title;
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => loadProfileInIframe(url));
        return element;
      };

      // Create individual metric elements for the user.
      const bestSpeedElement = createMetricElement(
        'best-speed',
        'cyan',
        '🚀',
        userData.bestSpeed,
        'Best speed',
        `https://klavogonki.ru/u/#/${userId}/stats/normal/`
      );

      const ratingLevelElement = createMetricElement(
        'rating-level',
        'gold',
        '⭐',
        userData.ratingLevel,
        'Rating level',
        `https://klavogonki.ru/top/rating/today?s=${userData.login}`
      );

      const carsElement = createMetricElement(
        'cars-count',
        'lightblue',
        '🚖',
        userData.cars,
        'Cars count',
        `https://klavogonki.ru/u/#/${userId}/car/`
      );

      const friendsElement = createMetricElement(
        'friends-count',
        'lightgreen',
        '🤝',
        userData.friends,
        'Friends count',
        `https://klavogonki.ru/u/#/${userId}/friends/list/`
      );

      // Group all metrics into a container.
      const userMetrics = document.createElement('div');
      userMetrics.className = 'user-metrics';
      userMetrics.style.marginTop = '4px';
      userMetrics.style.gridColumn = 'span 2';
      userMetrics.append(bestSpeedElement, ratingLevelElement, carsElement, friendsElement);

      // Create the user data container and append login and rank elements.
      const userDataElement = document.createElement('div');
      userDataElement.className = 'user-data';
      userDataElement.appendChild(loginElement);

      const rankElement = document.createElement('div');
      rankElement.className = 'rank';
      rankElement.textContent = userData.rank || 'N/A';
      rankElement.style.color = rankColors[userData.rank] || 'white';
      rankElement.style.padding = '2px 0';
      userDataElement.appendChild(rankElement);

      // Add a registered date element with hover behavior.
      const registeredElement = document.createElement('div');
      registeredElement.className = 'registered';
      registeredElement.textContent = userData.registered || 'N/A';
      registeredElement.style.color = 'cadetblue';
      registeredElement.style.fontSize = '12px';

      let hoverTimer;
      const originalContent = registeredElement.textContent;

      registeredElement.addEventListener('mouseover', () => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          registeredElement.textContent = calculateTimeOnSite(userData.registered);
        }, 300);
      });

      registeredElement.addEventListener('mouseout', () => {
        clearTimeout(hoverTimer);
        registeredElement.textContent = originalContent;
      });

      // Append registered element to user data and user data to user element.
      userDataElement.appendChild(registeredElement);
      userElement.append(avatarElement, userDataElement, userMetrics);

      // Return the created user element and its relevant data.
      return {
        userElement,
        order: rankOrder[userData.rank] || 10,
        bestSpeed: userData.bestSpeed || 0,
        registered: userData.registered
      };
    };

    // Check if the current mode is 'cache'
    if (localStorage.getItem('cachePanelSearchMode') === 'cache') {
      // Iterate through each user
      Object.keys(users).forEach(async (userId) => {
        const userData = users[userId];
        const userElementData = createCachePanelUserElement(userId, userData);
        userElements.push(userElementData);
      });

      // Sort userElements by rank and best speed
      userElements.sort((a, b) =>
        // First by rank, then by speed
        a.order !== b.order ? a.order - b.order : b.bestSpeed - a.bestSpeed
      );

      // Distribute userElements into new or old users containers
      userElements.forEach(({ userElement, registered }) => {
        // Choose container
        const targetContainer = isNewUser(registered) ? newUsersContainer : oldUsersContainer;
        // Append userElement
        targetContainer.appendChild(userElement);
      });
    }

    // Append the panel-header container to the cached-users-panel
    cachedUsersPanel.appendChild(panelHeaderContainer);
    // Append the fetched-users container to the cached-users-panel
    cachedUsersPanel.appendChild(fetchedUsersContainer);

    // Append the cached-users-panel to the body
    document.body.appendChild(cachedUsersPanel);

    // Fade in the cached users panel
    fadeTargetElement(cachedUsersPanel, 'show');

    // Show the dimming background
    fadeDimmingElement('show');

    // Function to update the remaining time
    function updateRemainingTime() {
      const lastClearTime = localStorage.getItem('lastClearTime');
      const nextClearTime = localStorage.getItem('nextClearTime');
      const dropTimeExpiration = document.querySelector('.drop-time-expiration');

      if (lastClearTime && nextClearTime && dropTimeExpiration) {
        const currentTime = new Date().getTime();

        // Calculate the remaining time until the next cache clear
        const remainingTime = nextClearTime - currentTime;

        // If remaining time is zero or less, execute the refreshFetchedUsers function
        remainingTime <= 0
          ? refreshFetchedUsers(true, cacheRefreshThresholdHours)
          : updatedropTimeExpiration(dropTimeExpiration, remainingTime);
      }
    }

    // Create a mapping of seconds to clock emojis
    const emojiMap = {
      0: '🕛',
      5: '🕐',
      10: '🕑',
      15: '🕒',
      20: '🕓',
      25: '🕔',
      30: '🕕',
      35: '🕖',
      40: '🕗',
      45: '🕘',
      50: '🕙',
      55: '🕚',
    };

    // Function to update the drop-time-expiration span
    function updatedropTimeExpiration(dropTimeExpiration, remainingTime) {
      // Calculate hours, minutes, and seconds
      const hours = String(Math.floor(remainingTime / (60 * 60 * 1000))).padStart(2, '0');
      const minutes = String(Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000))).padStart(2, '0');
      const seconds = String(Math.floor((remainingTime % (60 * 1000)) / 1000)).padStart(2, '0');

      // Create the formatted time string
      const remainingTimeString = `${hours}:${minutes}:${seconds}`;

      // Determine the current seconds
      const parsedSeconds = parseInt(seconds, 10);

      // Use the parsed seconds to find the emoji index, moving one forward
      const nextInterval = Math.ceil(parsedSeconds / 5) * 5; // Move to the next 5-second mark
      const currentEmoji = emojiMap[nextInterval] || emojiMap[0]; // Default to 00 if not found

      // Update the drop-time-expiration span with the time and emoji
      dropTimeExpiration.textContent = `${remainingTimeString} ${currentEmoji}`;
    }

    // Call the function to update the remaining time every second
    setInterval(updateRemainingTime, 1000);

    // Initial update
    updateRemainingTime();
  }

  // Global function to smoothly hide and remove the cachedUsersPanel
  function hideCachePanel() {
    const cachedUsersPanel = document.querySelector('.cached-users-panel');

    if (cachedUsersPanel) {
      // Call the fade function for the cachedUsersPanel
      fadeTargetElement(cachedUsersPanel, 'hide');
      // Call the fade function for the dimming element
      fadeDimmingElement('hide');
    }
  }

  // NEW CHAT CACHE CONTROL PANEL (END)


  // NEW CHAT USER LIST (START)

  // Add styles for hover effects dynamically to the head
  const newChatUserListStyles = document.createElement('style');

  // Apply class to the style element
  newChatUserListStyles.classList.add('new_chat_user_list');

  newChatUserListStyles.innerHTML = `
    #chat-general .userlist-content {
      opacity: 0;
    }

    #chat-general .smile-tab {
      background-color: ${((c) => c[0] == '#' ? c : '#' + c.match(/\d+/g).map(Number).map(x => x.toString(16).padStart(2, '0')).join(''))
      (getComputedStyle(document.querySelector('.chat .messages')).backgroundColor)};
      position: relative;
      z-index: 1;
    }

    .chat-user-list {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 20px;
        padding-top: 8px;
        width: 200px;
        height: 94%;
        overflow-y: auto;
        overflow-x: hidden;
        background-color: ${((c) => c[0] == '#' ? c : '#' + c.match(/\d+/g).map(Number).map(x => x.toString(16).padStart(2, '0')).join(''))
      (getComputedStyle(document.querySelector('.chat .messages')).backgroundColor)};
    }

    .chat-user-list [class^="rank-group"] {
        display: flex;
        flex-direction: column;
    }

    .chat-user-list [class^="user"] {
        display: inline-flex;
        margin: 2px 0;
    }

    .chat-user-list .avatar {
        width: 24px;
        height: 24px;
        display: inline-flex;
    }

    .chat-user-list .avatar img,
    .fetched-users .avatar img {
        transition: transform 0.3s;
        transform-origin: left;
    }

    .chat-user-list .avatar img:hover,
    .fetched-users .avatar img:hover {
        transform: scale(2);
    }

    .chat-user-list .name {
        text-decoration: none;
        display: inline-flex;
        width: auto;
        height: 24px;
        line-height: 24px;
        padding: 0 8px;
        max-width: 124px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .chat-user-list .name:hover {
        text-decoration: underline;
    }

    .chat-user-list .profile,
    .chat-user-list .tracked,
    .chat-user-list .ignored,
    .chat-user-list .moderator {
        display: inline-flex;
        width: 24px;
        height: 24px;
        justify-content: center;
        align-items: center;
    }

    svg.feather-meh,
    svg.feather-smile,
    svg.feather-frown {
        stroke: #A47C5E;
    }

    /* Common rotation animation */
    @keyframes rotateProfileIconAnimation {
        0% {
            transform: rotate(0deg) scale(1);
            transition-timing-function: ease-in-out;
        }
        50% {
            transform: rotate(180deg) scale(1.2);
            transition-timing-function: linear;
        }
        100% {
            transform: rotate(360deg) scale(1);
        }
    }

    /* Animation for online status */
    .chat-user-list svg.online {
        stroke: lightgreen;
        animation: rotateProfileIconAnimation 1s forwards;
    }

    /* Animation for offline status */
    .chat-user-list svg.offline {
        stroke: chocolate;
        animation: rotateProfileIconAnimation 1s forwards;
    }

    /* Shake Profile Icon Animation for Small Icons */
    @keyframes shakeProfileIconAnimation {
        0% { transform: translate(0.5px, 0.5px) rotate(0deg); }
        10% { transform: translate(-0.5px, -1px) rotate(-1deg); }
        20% { transform: translate(-1.5px, 0px) rotate(1deg); }
        30% { transform: translate(1.5px, 1px) rotate(0deg); }
        40% { transform: translate(0.5px, -0.5px) rotate(1deg); }
        50% { transform: translate(-0.5px, 1px) rotate(-1deg); }
        60% { transform: translate(-1.5px, 0.5px) rotate(0deg); }
        70% { transform: translate(1.5px, 0.5px) rotate(-1deg); }
        80% { transform: translate(-0.5px, -0.5px) rotate(1deg); }
        90% { transform: translate(0.5px, 1px) rotate(0deg); }
        100% { transform: translate(0.5px, -1px) rotate(-1deg); }
    }

    /* Apply shake animation to sto profile svg iconkwith the class eProfileIconAnimation */
    .chat-user-list svg.online:hover,
    .chat-user-list svg.offline:hover {
      animation: shakeProfileIconAnimation 0.5s linear infinite;
    }
`;

  document.head.appendChild(newChatUserListStyles);

  // Function to validate required user data
  function validateUserData(user) {
    const requiredFields = ['rank', 'login', 'registered', 'bestSpeed', 'ratingLevel', 'friends', 'cars', 'avatarTimestamp'];
    return user && typeof user === 'object' && requiredFields.every(field => user?.[field] !== undefined);
  }

  // Function to get profile summary and registration data
  async function getUserProfileData(userId, useLocalStorage = true) {
    return new Promise(async (resolve, reject) => {
      let cachedUserInfo = useLocalStorage ? JSON.parse(localStorage.getItem('fetchedUsers')) || {} : {};
      const user = cachedUserInfo[userId];

      // Validate if user data exists and has the required properties
      if (useLocalStorage && validateUserData(user)) {
        // If all data is cached, resolve with the cached data
        resolve({
          rank: user.rank,
          login: user.login,
          registeredDate: user.registered,
          bestSpeed: user.bestSpeed,
          ratingLevel: user.ratingLevel,
          friends: user.friends, // Use cached friends count
          cars: user.cars, // Use cached cars count
          avatar: user.avatar, // Get avatar availability state
          avatarTimestamp: user.avatarTimestamp // Cached avatar timestamp
        });
      } else {
        try {
          // Fetch profile summary and registered date
          const summaryApiUrl = `https://klavogonki.ru/api/profile/get-summary?id=${userId}`;
          const profileApiUrl = `https://klavogonki.ru/api/profile/get-index-data?userId=${userId}`;

          // Fetch both profile summary and registration data in parallel
          const [summaryResponse, profileResponse] = await Promise.all([
            fetch(summaryApiUrl),
            fetch(profileApiUrl),
          ]);

          // Check if both responses are successful
          if (!summaryResponse.ok || !profileResponse.ok) {
            throw new Error('Failed to fetch data from one of the APIs.');
          }

          const summaryData = await summaryResponse.json();
          const profileData = await profileResponse.json();

          if (
            summaryData?.user?.login &&
            summaryData.title &&
            profileData?.stats?.registered
          ) {
            // Extract the relevant data
            const rank = summaryData.title;
            const login = summaryData.user.login;
            const registered = profileData.stats.registered.sec
              ? convertSecondsToDate(profileData.stats.registered.sec)
              : 'Invalid Date';

            // Extract new fields
            const bestSpeed = profileData.stats.best_speed || 0; // Default to 0 if undefined
            const ratingLevel = profileData.stats.rating_level || 0; // Default to 0 if undefined
            const friends = profileData.stats.friends_cnt || 0; // Extract friends count
            const cars = profileData.stats.cars_cnt || 0; // Extract cars count

            // Extract sec and usec from user.avatar, with null check
            const avatar = summaryData.user?.avatar || null; // Default to null if undefined or not present
            const sec = summaryData.user.avatar?.sec || 0; // Default to 0 if undefined or null
            const usec = summaryData.user.avatar?.usec || 0; // Default to 0 if undefined or null
            const avatarTimestamp = convertToUpdatedTimestamp(sec, usec); // Combine sec and usec to get avatar timestamp

            // Cache the fetched data if useLocalStorage is true, excluding the avatar
            if (useLocalStorage) {
              cachedUserInfo[userId] = {
                rank: rank,
                login: login,
                registered: registered,
                bestSpeed: bestSpeed,
                ratingLevel: ratingLevel,
                friends: friends, // Cache friends count
                cars: cars, // Cache cars count
                avatar: avatar,
                avatarTimestamp: avatarTimestamp // Cache avatar timestamp
              };

              // Update localStorage with the new cached data
              localStorage.setItem('fetchedUsers', JSON.stringify(cachedUserInfo));
            }

            // Resolve with the combined data
            resolve({
              rank: rank,
              login: login,
              registeredDate: registered,
              bestSpeed: bestSpeed,
              ratingLevel: ratingLevel,
              friends: friends,
              cars: cars,
              avatar: avatar, // Return avatar for current session
              avatarTimestamp: avatarTimestamp // Include avatar timestamp in the result
            });
          } else {
            throw new Error('Invalid data format received from the API.');
          }
        } catch (error) {
          console.error(`Error fetching user profile data for ${userId}:`, error);
          reject(error);
        }
      }
    });
  }

  // Function to convert seconds to a human-readable date format
  function convertSecondsToDate(seconds) {
    const date = new Date(seconds * 1000);
    return date.toISOString().slice(0, 19).replace('T', ' '); // Converts to 'YYYY-MM-DD HH:mm:ss' format
  }

  // Function to convert sec and usec to the 'updated' timestamp
  function convertToUpdatedTimestamp(sec, usec) {
    // Create the full timestamp by combining sec and usec (in microseconds)
    return sec.toString() + Math.floor(usec / 1000).toString();
  }

  // Helper to fetch JSON and validate response
  async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return response.json();
  }

  // Helper function to get user IDs by username via the search API
  async function getUserIdByName(userName) {
    const searchApiUrl = `https://klavogonki.ru/api/profile/search-users?query=${userName}`;
    const searchResults = await fetchJSON(searchApiUrl);

    const foundUsers = searchResults.all; // Get all search results
    if (!foundUsers || foundUsers.length === 0) throw new Error(`User ${userName} not found.`);

    // Return an array of user IDs
    return foundUsers.map(user => user.id);
  }

  // Function to calculate time spent on the site
  function calculateTimeOnSite(registeredDate) {
    const totalSeconds = Math.floor((new Date() - new Date(registeredDate)) / 1000);
    const years = Math.floor(totalSeconds / (365 * 24 * 60 * 60));
    const months = Math.floor((totalSeconds % (365 * 24 * 60 * 60)) / (30.44 * 24 * 60 * 60));
    const days = Math.floor((totalSeconds % (30.44 * 24 * 60 * 60)) / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    const timeComponents = [];

    if (years > 0) {
      timeComponents.push(`${years} year${years > 1 ? 's' : ''}`);
      if (months > 0) timeComponents.push(`${months} month${months > 1 ? 's' : ''}`);
    } else if (months > 1 || (months === 1 && days > 0)) {
      timeComponents.push(`${months} month${months > 1 ? 's' : ''}`);
      if (days > 0) timeComponents.push(`${days} day${days > 1 ? 's' : ''}`);
    } else if (days > 0) {
      timeComponents.push(`${days} day${days > 1 ? 's' : ''}`);
      if (hours > 0) timeComponents.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      if (minutes > 0) timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    } else if (hours > 0) {
      timeComponents.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      if (minutes > 0) timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    } else if (minutes > 0) {
      timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      if (seconds > 0) timeComponents.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    } else {
      timeComponents.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    }

    return timeComponents.filter(Boolean).join(' '); // Filter out empty strings and join components
  }

  // Function to get rank color based on status title
  function getRankColor(mainTitle) {
    const statusColors = {
      'Экстракибер': '#06B4E9', // Light Blue
      'Кибергонщик': '#5681ff', // Medium Blue
      'Супермен': '#B543F5', // Purple
      'Маньяк': '#DA0543', // Red
      'Гонщик': '#FF8C00', // Orange
      'Профи': '#C1AA00', // Yellow
      'Таксист': '#2DAB4F', // Green
      'Любитель': '#61B5B3', // Light Cyan
      'Новичок': '#AFAFAF' // Grey
    };

    return statusColors[mainTitle] || '#000000'; // Default to black color if status title not found
  }

  // Function to get rank class based on status title in English
  function getRankClass(mainTitle) {
    const statusClasses = {
      'Экстракибер': 'extra',
      'Кибергонщик': 'cyber',
      'Супермен': 'superman',
      'Маньяк': 'maniac',
      'Гонщик': 'racer',
      'Профи': 'profi',
      'Таксист': 'driver',
      'Любитель': 'amateur',
      'Новичок': 'newbie'
    };

    const defaultClass = 'unknown';
    const rankClass = statusClasses[mainTitle] || defaultClass;

    if (rankClass === defaultClass) {
      console.log(`Class not found for status title: ${mainTitle}. Using default class: ${defaultClass}`);
    }

    return rankClass;
  }

  // Function to handle private message
  function insertPrivate(userId) {
    const userName = document.querySelector(`.name[data-user="${userId}"]`).textContent;
    const message = `<${userName}>`;

    const textElement = document.querySelector('.messages .text');
    textElement.value = message;

    textElement.focus();
    textElement.selectionEnd = textElement.value.length;

    console.log(`Setting private message to: ${message}`);
  }

  const infoSVG = (userId, isRevoked) => {
    const statusClass = isRevoked ? 'offline' : 'online';

    return `
        <svg xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="feather feather-info ${statusClass}">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
  };

  // Inline SVG source for the "meh" icon
  const mehSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-meh">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="8" y1="15" x2="16" y2="15"></line>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>`;

  // Inline SVG source for the "smile" icon
  const smileSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-smile">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>`;

  // Inline SVG source for the "frown" icon
  const frownSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-frown">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>`;

  // SVG icon for the moderator with gradient
  const moderatorSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="url(#moderatorGradient)"  <!-- Use a gradient fill -->
        stroke="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-shield">
        <!-- Define the gradient -->
        <defs>
            <linearGradient id="moderatorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color: gold; stop-opacity: 1" />
                <stop offset="100%" style="stop-color: darkorange; stop-opacity: 1" />
            </linearGradient>
        </defs>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>`;

  // SVG icon for the tracked with gradient stroke
  const trackedSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="16"
       height="16"
       viewBox="0 0 24 24"
       fill="url(#trackedGradient)"  <!-- Use a gradient fill -->
       class="feather feather-star">
      <!-- Define the gradient for the fill -->
      <defs>
        <linearGradient id="trackedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: LightSkyBlue; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: DeepSkyBlue; stop-opacity: 1" />
        </linearGradient>
      </defs>
      <!-- Use the gradient for the fill -->
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
               stroke="url(#trackedGradient)"
               stroke-width="2"
               stroke-linecap="round"
               stroke-linejoin="round"
      ></polygon>
  </svg>`;

  // SVG icon for ignored users
  const ignoredSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="lightsalmon"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-slash">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>`;

  // Helper function to get a random SVG
  // function getRandomIconSVG() {
  //   const svgs = [mehSVG, smileSVG, frownSVG];
  //   const randomIndex = Math.floor(Math.random() * svgs.length);
  //   return svgs[randomIndex];
  // }

  // Variable to store the last selected emoji
  let lastEmojiAvatar = null;

  // Helper function to get a random emoji avatar
  function getRandomEmojiAvatar() {
    let newEmoji;
    do {
      newEmoji = emojiFaces[Math.floor(Math.random() * emojiFaces.length)];
    } while (newEmoji === lastEmojiAvatar);

    lastEmojiAvatar = newEmoji;
    return newEmoji;
  }

  const emojiFaces = [
    // People Emojis (Facial expressions)
    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆',
    '😉', '😊', '😋', '😎', '😏', '😐', '😑', '😒',
    '😓', '😔', '😕', '😖', '😗', '😘', '😙', '😚',
    '😜', '😝', '😛', '🤑', '🤗', '🤔', '🤐', '🤨',
    '😣', '😥', '😮', '🤯', '😳', '😱', '😨', '😰',
    '😢', '🤪', '😵', '😲', '🤤', '😷', '🤒', '🤕',
    '🤢', '🤧', '😇', '🥳', '🥺', '😬', '😴', '😌',
    '🤥', '🥴', '🥵', '🥶', '🤧', '🤭', '🤫', '😠',
    '😡', '😳', '😞', '😟', '😕',

    // Cat Emojis (Expressive faces of cats)
    '🐱', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',

    // Other Animal Emojis (Various animals' faces)
    '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
    '🙈', '🙉', '🙊', '🐔', '🦄'
  ];

  // Array to store user IDs and their status titles
  let fetchedUsers = JSON.parse(localStorage.getItem('fetchedUsers')) || {};

  // Function to create a user element with avatar, name, and profile link based on user details
  function createUserChatElement(userId, mainTitle, userName, isRevoked) {
    const avatarTimestamp = fetchedUsers[userId]?.avatarTimestamp;

    // Ensure the bigAvatarUrl is only constructed if avatarTimestamp is not '00'
    const bigAvatarUrl = avatarTimestamp !== '00' ? `/storage/avatars/${userId}_big.png?updated=${avatarTimestamp}` : '';

    const newUserElement = document.createElement('div');
    const rankClass = getRankClass(mainTitle);
    newUserElement.classList.add(`user${userId}`, rankClass); // Assign the rank class

    const newAvatarElement = document.createElement('div');
    newAvatarElement.classList.add('avatar');

    // Only create and append an image element if avatarTimestamp is not '00'
    if (avatarTimestamp !== '00') {
      const avatarImage = document.createElement('img');
      avatarImage.src = bigAvatarUrl;
      newAvatarElement.appendChild(avatarImage);
    } else {
      // Insert a random SVG icon instead of an image when avatarTimestamp is '00'
      // newAvatarElement.innerHTML = getRandomIconSVG();
      newAvatarElement.style.fontSize = '1.8rem';
      newAvatarElement.innerHTML = getRandomEmojiAvatar();
    }

    const newNameElement = document.createElement('a');
    newNameElement.classList.add('name');
    newNameElement.title = 'Написать в приват';
    newNameElement.dataset.user = userId;
    newNameElement.textContent = userName;

    const rankColor = getRankColor(mainTitle);
    newNameElement.style.setProperty('color', rankColor, 'important');

    const newProfileElement = document.createElement('a');
    newProfileElement.classList.add('profile');
    newProfileElement.title = 'Профиль';
    newProfileElement.target = '_blank';
    newProfileElement.href = `/profile/${userId}/`;
    newProfileElement.innerHTML = infoSVG(userId, isRevoked); // Update this line

    newNameElement.addEventListener('click', function () {
      insertPrivate(userId);
    });

    newUserElement.appendChild(newAvatarElement);
    newUserElement.appendChild(newNameElement);
    newUserElement.appendChild(newProfileElement);

    // Check if there is a user in 'usersToTrack' array by their name and state
    const userToTrack = usersToTrack.find((user) =>
      user.name === userName && user.state === 'thawed'
    );

    if (userToTrack) {
      const trackedIcon = document.createElement('div');
      trackedIcon.title = 'Tracked user';
      trackedIcon.classList.add('tracked');
      trackedIcon.innerHTML = trackedSVG;
      newUserElement.appendChild(trackedIcon);
    }

    // Check if the user is in the ignore list
    const isIgnoredUser = ignored.includes(userName);

    // Create and hide a message element if the user is in ignored
    if (isIgnoredUser) {
      const ignoredIcon = document.createElement('div');
      ignoredIcon.title = 'Ignored user';
      ignoredIcon.classList.add('ignored');
      ignoredIcon.innerHTML = ignoredSVG;
      newUserElement.appendChild(ignoredIcon);
    }

    // Check if there is an <img> element with a src attribute containing the word "moderator" inside the <ins> element
    const hasModeratorIcon = document.querySelector(`.userlist-content ins.user${userId} img[src*="moderator"]`);

    // Check if the user is in the moderator list
    const isModerator = moderator.includes(userName);

    // If a moderator icon is found or the current user is in the moderator array, append the moderator icon.
    if (hasModeratorIcon || isModerator) {
      const moderatorIcon = document.createElement('div');
      moderatorIcon.classList.add('moderator');
      moderatorIcon.innerHTML = moderatorSVG; // Assuming 'moderatorSVG' contains the SVG for the icon
      newUserElement.appendChild(moderatorIcon);
    }

    return newUserElement;
  }

  // Function to update users in the custom chat
  async function refreshUserList(retrievedLogin, actionType) {
    try {
      // Get the original user list container
      const originalUserListContainer = document.querySelector('.userlist-content');

      // Get or create the user list container
      let userListContainer = document.querySelector('.chat-user-list');
      if (!userListContainer) {
        userListContainer = document.createElement('div');
        userListContainer.classList.add('chat-user-list');

        // Find the element with the class "userlist"
        const userlistElement = document.querySelector('.userlist');

        // Append the userListContainer to the userlistElement if found
        if (userlistElement) {
          userlistElement.appendChild(userListContainer);
        }
      }

      // Define the rank order
      const rankOrder = ['extra', 'cyber', 'superman', 'maniac', 'racer', 'profi', 'driver', 'amateur', 'newbie'];

      // Create an object to store subparent elements for each rank class
      const rankSubparents = {};

      // Check if subparent elements already exist, if not, create them
      rankOrder.forEach(rankClass => {
        const existingSubparent = userListContainer.querySelector(`.rank-group-${rankClass}`);
        if (!existingSubparent) {
          rankSubparents[rankClass] = document.createElement('div');
          rankSubparents[rankClass].classList.add(`rank-group-${rankClass}`);
          userListContainer.appendChild(rankSubparents[rankClass]);
        } else {
          rankSubparents[rankClass] = existingSubparent;
        }
      });

      // Create a set to store existing user IDs in the updated user list
      const existingUserIds = new Set();

      // Iterate over each user element in the original user list
      for (const userElement of originalUserListContainer.querySelectorAll('ins')) {
        const nameElement = userElement.querySelector('.name');
        const userId = nameElement.getAttribute('data-user');
        const userName = nameElement.textContent;

        // Check if the user already exists in the updated user list
        if (!existingUserIds.has(userId)) {
          try {
            // Retrieve the user's profile data
            const { rank: mainTitle, login, registeredDate, bestSpeed, ratingLevel, friends, cars, avatarTimestamp } = await getUserProfileData(userId);

            // If the user data is not already stored in the fetchedUsers object
            if (!fetchedUsers[userId]) {
              // Set rank, login, registeredDate, bestSpeed, ratingLevel, friends, cars, and avatarTimestamp
              fetchedUsers[userId] = {
                rank: mainTitle,
                login,
                registered: registeredDate,
                bestSpeed,
                ratingLevel,
                friends,
                cars,
                avatarTimestamp
              };
            } else {
              // Update the user's data
              fetchedUsers[userId].rank = mainTitle;
              fetchedUsers[userId].login = login;
              fetchedUsers[userId].registered = registeredDate;
              fetchedUsers[userId].bestSpeed = bestSpeed;
              fetchedUsers[userId].ratingLevel = ratingLevel;
              fetchedUsers[userId].friends = friends;
              fetchedUsers[userId].cars = cars;
              fetchedUsers[userId].avatarTimestamp = avatarTimestamp;
            }

            // If actionType is 'enter' and retrievedLogin === userName, multiply the visits for the entered user
            if (actionType === 'enter' && retrievedLogin === userName) {
              fetchedUsers[userId].visits = (fetchedUsers[userId].visits || 0) + 1;
              // Check if the user is in the usersToTrack array
              fetchedUsers[userId].tracked = usersToTrack.some(userToTrack => userToTrack.name === retrievedLogin);
            }

            // Check if the user with the same ID already exists in the corresponding rank group
            const existingUserElement = rankSubparents[getRankClass(mainTitle)].querySelector(`.user${userId}`);
            if (!existingUserElement) {
              const newUserElement = createUserChatElement(userId, mainTitle, userName, userElement.classList.contains('revoked'));
              // Add the user to the corresponding rank group
              rankSubparents[getRankClass(mainTitle)].appendChild(newUserElement);
            }

            // Update existing user IDs
            existingUserIds.add(userId);
          } catch (error) {
            console.error(`Error fetching profile summary for user ${userId}:`, error);
          }
        }
      }

      // Additional removal logic based on your provided code
      userListContainer.querySelectorAll('.chat-user-list [class^="user"]').forEach(userElement => {
        const userId = userElement.querySelector('.name').getAttribute('data-user');
        if (!existingUserIds.has(userId)) {
          userElement.remove();
        }
      });

      // Update localStorage outside the if conditions
      localStorage.setItem('fetchedUsers', JSON.stringify(fetchedUsers));

      // Call updateUserCountText to refresh user count display
      updateUserCountText();

    } catch (error) {
      console.error('Error refreshing user list:', error);
    }
  }

  // Helper function to convert time string to single hours
  function convertToSingleHours(timeString) {
    const [hours, minutes = 0, seconds = 0] = timeString.split(':').map(Number);
    return hours + minutes / 60 + seconds / 3600;
  }

  // Global constant for default cache refresh threshold in hours
  const defaultCacheRefreshThresholdHours = 24;

  // Get the value from localStorage
  let storedFresholdTimeKey = localStorage.getItem('cacheRefreshThresholdHours');

  // If the key doesn't exist, set it to the default value
  if (!storedFresholdTimeKey) {
    storedFresholdTimeKey = defaultCacheRefreshThresholdHours;
    localStorage.setItem('cacheRefreshThresholdHours', storedFresholdTimeKey);
  }

  // Convert the value to single hours
  let cacheRefreshThresholdHours = convertToSingleHours(storedFresholdTimeKey);

  // Function to refresh or manually clear fetched users and reset the timer
  // @param {boolean} isManual - If true, clears cache unconditionally; if false, clears based on threshold (default is false)
  // @param {number} thresholdHours - Time threshold in hours for automatic cache clearing (default is 24 hours)
  function refreshFetchedUsers(isManual = false, thresholdHours = 24) {
    // Retrieve the last clear time from localStorage
    const lastClearTime = localStorage.getItem('lastClearTime');
    const timeElapsed = lastClearTime ? (new Date().getTime() - lastClearTime) / (1000 * 60 * 60) : Infinity;

    // If clearing manually or the time threshold has been reached, clear the cache
    if (isManual || timeElapsed >= thresholdHours) {
      // Clear the fetchedUsers from localStorage
      localStorage.removeItem('fetchedUsers');

      // Reset the in-memory fetchedUsers object
      fetchedUsers = {};

      // Reset the timer by updating 'lastClearTime' and 'nextClearTime'
      const nextClearTime = new Date().getTime() + thresholdHours * 60 * 60 * 1000;
      localStorage.setItem('lastClearTime', new Date().getTime().toString());
      localStorage.setItem('nextClearTime', nextClearTime.toString());

      // Optional: Notify the user about the cache clearing
      // const message = isManual
      //   ? `Cache manually cleared. Next clearing time: ${new Date(nextClearTime)}`
      //   : `Cache automatically cleared. Next clearing time: ${new Date(nextClearTime)}`;

      // alert(message);
    }
  }


  // NEW CHAT USER LIST (END)


  // Define reference for chat user list
  const userList = document.querySelector('.userlist-content');

  // Initialize variables to keep track of the current and previous users
  let currentUsers = [];
  let previousUsers = [];
  // Set flag to false to prevent initialization of the notifications
  // About entered and left users on the page load after refreshing the page
  let hasObservedChanges = false;
  let prevUserCountValue = 0;

  // Initialize variables for the user count animation
  let currentTextContent = [];
  let isAnimated = false;

  // Define a constant to set the debounce delay
  const debounceTimeout = 1500;

  // Define a debounce function to limit the rate at which the mutation observer callback is called
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  // Mutation observer to track all the users with only graphical popup notification
  // Also play notification sound "Left" or "Entered" if the one of them is identical from "usersToTrack" array
  // Create a mutation observer to detect when the user list is modified
  const chatUsersObserver = new MutationObserver(debounce((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Get the sound switcher element and check which option is selected
        const soundSwitcher = document.querySelector('#voice, #beep, #silence');
        const isSilence = soundSwitcher && soundSwitcher.id === 'silence';

        // Check if the chat is closed or opened
        const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');
        // Retrieve all users textContent from userList ins elements
        const newUserList = Array.from(userList.children).map(child => child.textContent);

        // Find new users and left users
        const newUsers = newUserList.filter(user => !currentUsers.includes(user));
        const leftUsers = currentUsers.filter(user => !newUserList.includes(user));

        // Retrieve fresh user count length
        const userCountValue = newUserList.length;
        // Retrieve the counter element
        const userCount = document.querySelector('.user-count-indicator');

        // Update grayscale filter
        userCount.style.filter = userCountValue > 0 ? 'none' : 'grayscale(100%)';

        // Check if the user count animation needs to be started only when the chat is not closed
        if (!chatHidden && currentTextContent.length === 0 && newUserList.length > 0 && !isAnimated) {
          isAnimated = true; // Set this to true immediately to prevent starting a new animation
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
              addPulseEffect(userCount);
            }
          };
          setTimeout(userCountIncrement, speed);
        } // Animation END

        // Check if chat is not closed and animation is finished
        if (!chatHidden && isAnimated) {
          // Check if the user count has changed and add pulse animation
          if (userCountValue !== prevUserCountValue) {
            addPulseEffect(userCount);
            // Updating the counter element value
            userCount.innerHTML = userCountValue;
          }
        }

        // Check if chat is not closed and animation is not in progress
        if (!chatHidden && hasObservedChanges) {
          newUsers.forEach((newUser) => {
            if (!previousUsers.includes(newUser)) {
              const userGender = getUserGender(newUser) || 'male'; // use 'male' as default
              // Check if the user is in the usersToTrack array for 'enter'
              const isUserToTrackEnter = usersToTrack.some(user =>
                user.name === newUser && user.state === 'thawed'
              );
              const iconType = enterIcon;
              showUserAction(newUser, iconType, true);
              // Pass 'enter' as the action type and the user's login to refreshUserList
              refreshUserList(newUser, "enter");
              // Prevent voice notification if mode is silence
              if (!isSilence && isUserToTrackEnter) {
                userAction(newUser, "enter", userGender);
              }
            }
          });

          leftUsers.forEach((leftUser) => {
            const userGender = getUserGender(leftUser) || 'male'; // use 'male' as default
            // Check if the user is in the usersToTrack array for 'leave'
            const isUserToTrackLeave = usersToTrack.some(user =>
              user.name === leftUser && user.state === 'thawed'
            );
            const iconType = leaveIcon;
            showUserAction(leftUser, iconType, false);
            // Pass 'leave' as the action type and the user's login to refreshUserList
            refreshUserList(leftUser, "leave");
            // Prevent voice notification if mode is silence
            if (!isSilence && isUserToTrackLeave) {
              userAction(leftUser, "leave", userGender);
            }
          });

        } else {
          // Indicator should look deactivated after the chat is closed
          userCount.style.filter = "grayscale(1)";
          userCount.innerHTML = "0";
          // Set flag to true to initialize notifications about entered and left users
          hasObservedChanges = true;
        }

        // Update the previous users and user count
        previousUsers = currentUsers;
        currentUsers = newUserList;
        prevUserCountValue = userCountValue;

      }
    });
  }, debounceTimeout));

  // Start observing the chat user list for changes to notify about them
  chatUsersObserver.observe(userList, { childList: true });

  // Button to close the chat
  const chatCloseButton = document.querySelector('.mostright');

  // Event listener for mostright click event
  chatCloseButton.addEventListener('click', () => {
    // Trigger the logic you want to perform when the mostright button is clicked
    setTimeout(() => {
      // Check if the chat is not closed
      const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');
      if (chatHidden) {
        // Avoid "newMessagesObserver" run the call functions multiple times when the chat opens again
        isInitialized = false;
      } else {
        // Call the function to assign all the removing functionality again after the chat was closed
        executeMessageRemover();
        // Set chat field focus
        setChatFieldFocus();
        // Allow after "N" delay to run the "newMessagesObserver" call functions safely without repeating
        isInitialized = false;
        setTimeout(() => (isInitialized = false), 3000);
      }
    }, 300);
  });

  // Function to restore the chat state based on 'shouldShowPopupMessage' key in localStorage
  function restoreChatState() {
    // Main chat parent wrap element
    const chatMainWrapper = document.querySelector('#chat-fixed-placeholder');

    // Check if the key exists in localStorage
    if ('shouldShowPopupMessage' in localStorage) {
      // Retrieve the value from localStorage
      const shouldShowPopupMessage = JSON.parse(localStorage.getItem('shouldShowPopupMessage'));

      // Set the display property based on the retrieved value
      chatMainWrapper.style.display = shouldShowPopupMessage ? 'none' : 'unset';
    } else {
      // Default to 'none' if the key doesn't exist
      chatMainWrapper.style.display = 'none';
    }
  }

  // Call restoreChatState when needed, for example, on page load
  restoreChatState();

  // Check if the key exists in localStorage
  if (!('shouldShowPopupMessage' in localStorage)) {
    localStorage.setItem('shouldShowPopupMessage', false);
  }

  // Custom chat hider with hotkeys Ctr + Space
  document.addEventListener('keydown', (event) => {
    // Check if Ctrl key and Space key are pressed simultaneously
    if (event.ctrlKey && event.code === 'Space') {
      // Main chat parent wrap element
      const chatMainWrapper = document.querySelector('#chat-fixed-placeholder');
      // Check if the 'style' attribute is present
      const hasStyleAttribute = chatMainWrapper.hasAttribute('style');
      // Check if the 'display' property is set on chatMainWrapper element
      const isDisplayUnset = chatMainWrapper.style.display === 'unset';
      // Popup messages container element
      const popupMessagesContainer = document.querySelector('.popup-messages-container');

      // Toggle the display property
      if (hasStyleAttribute) {
        if (isDisplayUnset) {
          // Set the display property to 'none'
          chatMainWrapper.style.display = 'none';
          localStorage.setItem('shouldShowPopupMessage', true);
        } else {
          // Set the display property to 'unset'
          chatMainWrapper.style.display = 'unset';
          localStorage.setItem('shouldShowPopupMessage', false);

          // Retrieve the chat input field and length popup container based on the current URL
          const { inputField } = retrieveChatElementsByRoomType(); // Use your helper function

          // Check if inputField is valid before focusing
          if (inputField) {
            inputField.focus(); // Set focus to the chat input field
          } else {
            console.error('Input field not found. Cannot set focus.');
          }
        }
      } else {
        // Initial case: Set the display property to 'none'
        chatMainWrapper.style.display = 'none';
        localStorage.setItem('shouldShowPopupMessage', true);
      }

      // Remove the element with class 'popup-messages-container' if it exists and display is 'unset'
      if (popupMessagesContainer && hasStyleAttribute && isDisplayUnset) {
        popupMessagesContainer.remove();
      }
    }
  });

  // EVERY NEW MESSAGE READER

  // Initialize the variable to keep track of the last username seen
  let lastUsername = null;

  // Set the flag as false for the mention beep sound to trigger at first usual beep sound for usual messages
  let isMention = false;

  // Function to check if a username is mentioned in the message
  function isMentionForMe(message) {
    const messageLowercase = message.toLowerCase();
    return mentionKeywords.some(keyword => messageLowercase.includes(keyword.toLowerCase()));
  }

  // Function to replace username mentions with their respective pronunciations
  function replaceWithPronunciation(text) {
    if (text === null) {
      return text;
    }

    const replaceUsername = (username) => {
      const user = usersToTrack.find(user => user.name === username);
      return user ? user.pronunciation : username;
    }

    const pattern = new RegExp(usersToTrack.map(user => user.name).join('|'), 'g');
    return text.replace(pattern, replaceUsername);
  }

  // Function to highlight mention words based on the specified container type
  function highlightMentionWords(containerType = 'generalMessages') {
    // Define a mapping for container types to their respective selectors and message elements
    const containerSelectors = {
      generalMessages: { container: '.messages-content div', messageElement: 'p' }, // For general chat
      chatlogsMessages: { container: '.chat-logs-container', messageElement: '.message-text' }, // For chat logs
      personalMessages: { container: '.messages-container', messageElement: '.message-text' } // For personal messages panel
    };

    // Get the container and message element details based on the passed containerType
    const { container: containerSelector, messageElement: messageSelector } = containerSelectors[containerType];

    // If a valid container selector exists, process the messages
    if (containerSelector) {
      const containers = document.querySelectorAll(containerSelector); // Get all containers of the specified type

      // Loop through each container
      containers.forEach((container) => {
        // Get all the message elements from the current container
        const messages = container.querySelectorAll(messageSelector);

        // Loop through each chat message element
        messages.forEach((message) => {
          // Loop through each text node inside the message element
          Array.from(message.childNodes).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              // Split the text node content into words
              const regex = /[\s]+|[^\s\wа-яА-ЯёЁ]+|[\wа-яА-ЯёЁ]+/g;
              const words = node.textContent.match(regex); // Split using the regex

              // Create a new fragment to hold the new nodes
              const fragment = document.createDocumentFragment();

              // Loop through each word in the text node
              words.forEach((word) => {
                // Check if the word is included in the "mentionKeywords" array (case insensitive)
                if (mentionKeywords.map(alias => alias.toLowerCase()).includes(word.toLowerCase())) {
                  // Create a new <span> element with the mention class
                  const mentionHighlight = document.createElement('span');
                  mentionHighlight.classList.add('mention');
                  mentionHighlight.textContent = word;

                  // Highlight styles
                  mentionHighlight.style.color = '#83cf40';
                  mentionHighlight.style.backgroundColor = '#2b4317';
                  mentionHighlight.style.border = '1px solid #4b7328';
                  mentionHighlight.style.padding = '2px';
                  mentionHighlight.style.display = 'inline-flex';

                  // Append the new <span> element to the fragment
                  fragment.appendChild(mentionHighlight);
                } else {
                  // Check if the word is already inside a mention span
                  const span = document.createElement('span');
                  span.innerHTML = word;
                  if (span.querySelector('.mention')) {
                    // If it is, simply append the word to the fragment
                    fragment.appendChild(word);
                  } else {
                    // If it isn't, create a new text node with the word
                    const textNode = document.createTextNode(word);

                    // Append the new text node to the fragment
                    fragment.appendChild(textNode);
                  }
                }
              });

              // Replace the original text node with the new fragment
              node.parentNode.replaceChild(fragment, node);
            }
          });
        });
      });
    } else {
      console.error('Invalid container type specified');
    }
  }

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // Achromatic
    } else {
      const delta = max - min;
      s = l < 0.5 ? delta / (max + min) : delta / (2 - max - min);
      h = (
        max === r
          ? (g - b) / delta + (g < b ? 6 : 0)
          : max === g
            ? (b - r) / delta + 2
            : (r - g) / delta + 4
      ) / 6;
    }

    h = Math.round(h * 360); // Convert to degrees
    s = Math.min(Math.round(s * 100), 90); // Cap saturation at 90
    l = Math.round(l * 100); // Convert lightness to 0–100

    // Adjust hue to allow only 0–230 and 280–360 ranges
    if (h > 215 && h < 280) {
      h = h < 255 ? 215 : 280; // Shift to nearest valid range
    }

    return { h, s, l };
  };


  const hslToRgb = (h, s, l) => {
    s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) r = g = b = l * 255; // Achromatic
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        return t < 1 / 6 ? p + (q - p) * 6 * t :
          t < 1 / 2 ? q :
            t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 :
              p;
      };
      r = Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255);
      g = Math.round(hue2rgb(p, q, h / 360) * 255);
      b = Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255);
    }
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Normalize chat username color to be readable in the personal messages panel
  function normalizeUsernameColor(initialColor) {
    const [r, g, b] = initialColor.match(/\d+/g).map(Number);
    const { h, s, l } = rgbToHsl(r, g, b);

    // Adjust lightness to ensure it's at least 50
    const normalizedLightness = l < 50 ? 50 : l;
    const finalColor = hslToRgb(h, s, normalizedLightness);

    // Round the RGB values in one go
    return finalColor;
  }

  // Function to get the cleaned text content of the latest message with username prefix
  function getLatestMessageData() {
    // Select the last <p> element specifically
    const messageElement = document.querySelector('.messages-content div p:last-of-type');
    // Return null if no message found
    if (!messageElement) return null;

    // Helper function to check if a node is a text node
    const isTextNode = (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '';
    // Helper function to check if a node is an img (emoticon)
    const isImageNode = (node) => node.nodeName === 'IMG' && node.getAttribute('title');
    // Helper function to check if a node is an anchor (link)
    const isAnchorNode = (node) => node.nodeName === 'A' && node.getAttribute('href');

    // Function to collect message parts (text + emoticons + links) from any container
    const collectMessageParts = (container) =>
      [...container.childNodes]
        .map(node =>
          isTextNode(node) ? node.textContent.trim() :
            isImageNode(node) ? node.getAttribute('title') :
              isAnchorNode(node) ? node.getAttribute('href') : ''
        )
        .filter(Boolean); // Remove empty strings

    // Initialize variables for message texts
    let commonMessageText = '';
    let privateMessageText = '';
    let systemMessageText = '';
    const systemUsername = 'Клавобот';

    // Process common message
    const commonMessageParts = collectMessageParts(messageElement);
    commonMessageText = commonMessageParts.join(' ').trim(); // Final common message text

    // Process private message
    const privateMessageContainer = messageElement.querySelector('.room.private');
    if (privateMessageContainer && privateMessageContainer.textContent.includes('[шепчет вам]')) {
      const privateMessageElement = messageElement.querySelector('span.private');
      if (privateMessageElement) {
        const privateMessageParts = collectMessageParts(privateMessageElement);
        privateMessageText = privateMessageParts.join(' ').trim(); // Final private message
      }
    }

    // Process system message
    const systemMessageElement = messageElement.querySelector('.system-message');
    if (systemMessageElement) {
      const systemMessageParts = collectMessageParts(systemMessageElement);
      // Join system message parts into final systemMessageText
      systemMessageText = systemMessageParts.join(' ').trim(); // Final system message
      // Clear <Клавобот> from systemMessageText
      systemMessageText = systemMessageText.replace(/<Клавобот>\s*/g, '');
    }

    // Retrieve or initialize personalMessages from localStorage
    const personalMessages = JSON.parse(localStorage.getItem('personalMessages')) || {};

    // Helper to get the current date in YYYY-MM-DD format
    const getCurrentDate = () => new Date().toLocaleDateString('en-CA');

    // Helper function to handle messages
    const handleMessage = (messageType, messageText) => {
      const time = messageElement.querySelector('.time')?.textContent || 'N/A';
      const usernameElement = messageElement.querySelector('.username span[data-user]');
      const userId = usernameElement ? usernameElement.getAttribute('data-user') : null;
      const username = usernameElement ? usernameElement.textContent : systemUsername;
      const usernameColor = usernameElement ? usernameElement.parentElement.style.color : 'rgb(180, 180, 180)';
      const normalizedColor = normalizeUsernameColor(usernameColor);

      // Create a unique key based on the time and username to avoid collisions
      const messageKey = `${time}_${username}`;

      // Store the message data in personalMessages with the new order
      personalMessages[messageKey] = {
        time,
        date: getCurrentDate(),
        username,
        usernameColor: normalizedColor,
        message: messageText,
        type: messageType,
        userId
      };

      // Save to localStorage only if the user is not in the ignored
      if (!ignored.includes(username)) {
        localStorage.setItem('personalMessages', JSON.stringify(personalMessages));
      }
    };

    // Check if the message contains a mention for the current user
    const usernameElement = messageElement.querySelector('.username');
    let usernameText = (usernameElement && usernameElement.textContent)
      ? usernameElement.textContent.replace(/</g, '').replace(/>/g, '')
      : systemUsername; // Default to systemUsername if not found

    let usernamePrefix = ''; // Initialize usernamePrefix

    // Determine the final message text based on the availability of common, private, or system messages
    let finalMessageText = commonMessageText; // Start with the common message

    if (privateMessageText) {
      finalMessageText = `${privateMessageText}`; // If it's a private message
      handleMessage('private', finalMessageText);
    } else if (systemMessageText && isMentionForMe(systemMessageText)) {
      finalMessageText = `${systemMessageText}`; // If there's a system message with a mention
      handleMessage('system', finalMessageText);
    }

    // Handle mentions
    if (isMentionForMe(finalMessageText)) {
      isMention = true;
      usernamePrefix = `${replaceWithPronunciation(usernameText)} обращается: `; // Use usernameText directly
      handleMessage('mention', finalMessageText); // Pass 'mention' and the original final message text
      highlightMentionWords();
    } else if (usernameText !== lastUsername) {
      isMention = false;
      usernamePrefix = `${replaceWithPronunciation(usernameText)} пишет: `; // Use usernameText directly
    }

    lastUsername = usernameText; // Update the last seen username

    // Combine the username prefix and the final message text
    const messageWithPronunciation = `${usernamePrefix}${replaceWithPronunciation(finalMessageText)}`;

    // Return all relevant message data including the system message
    return {
      modifiedMessageText: messageWithPronunciation || systemMessageText, // If messageWithPronunciation is null, assign systemMessageText
      originalMessageText: finalMessageText || systemMessageText, // If finalMessageText is null, assign systemMessageText
      usernameText: usernameText // Always return usernameText
    };
  }

  // Prevent the "readNewMessages" function from being called multiple times until all messages in the set have been read
  let isReading = false;

  // Create a Set to store the new messages
  const newMessages = new Set();

  // This function adds a new message to the Set and triggers the "readNewMessages" function if the Set was empty before
  function addNewMessage(message) {
    // Check if the new message is not already in the Set
    if (!newMessages.has(message)) {
      // Add the new message to the Set
      newMessages.add(message);
      // If the "readNewMessages" function is not already in progress, trigger it
      if (!isReading) {
        // Change the flag to true to be initialized accent beep sound for mention message
        isReading = true;
        readNewMessages();
      }
    }
  }

  // This function reads the new messages from the Set and removes them after reading
  async function readNewMessages() {
    // Read each message in sequence from the Set
    for (let message of newMessages) {
      // Call the textToSpeech function to read the message
      await textToSpeech(message, voiceSpeed);
      // Remove the message from the Set after reading
      newMessages.delete(message);
    }
    // Set the isReading flag to false after reading all messages
    isReading = false;
  }

  // Track if the user has loaded messages for the first time
  let firstTime = true;
  // The distance from the bottom at which we should trigger auto-scrolling
  const scrollThreshold = 600;

  // Scrolls the specified container to the bottom if the user has scrolled close enough
  function scrollMessagesToBottom(containerType = 'generalMessages') {
    // Define a mapping for container types to their respective selectors
    const containerSelectors = {
      generalMessages: '.messages-content', // For general chat
      chatlogsMessages: '.chat-logs-container', // For chat logs
      personalMessages: '.messages-container' // For personal messages panel
    };

    // Get the container based on the passed containerType
    const containerSelector = containerSelectors[containerType];

    // If the container selector is not defined, return
    if (!containerSelector) return;

    // Get the container element
    const container = document.querySelector(containerSelector);
    if (!container) return; // Return if the container doesn't exist

    // If it's the user's first time loading messages, auto-scroll to the bottom
    if (firstTime) {
      container.scrollTop = container.scrollHeight;
      firstTime = false;
    } else {
      // Calculate how far the user is from the bottom
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      // If the user is close enough to the bottom, auto-scroll to the bottom
      if (distanceFromBottom <= scrollThreshold) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }

  // Function to scroll messages to the middle of the parent container
  async function scrollMessagesToMiddle(parent, element) {
    const { top, height } = element.getBoundingClientRect(); // Get the position and height of the found element
    const { top: parentTop, height: parentHeight } = parent.getBoundingClientRect(); // Get the position and height of the parent

    // Calculate the middle position of the parent container
    const parentMiddle = parentTop + parentHeight / 2;

    // Determine how far to scroll to center the found element
    const scrollOffset = top - parentMiddle + height / 2;

    // Scroll to the found element to center it within the parent
    parent.scrollBy({
      top: scrollOffset,
      behavior: 'smooth'
    });

    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for the scroll to complete
    parent.style.scrollBehavior = 'auto'; // Reset scroll behavior
    addShakeEffect(element); // Add a shake effect to the found element
  }

  function applyChatMessageGrouping() {
    // Get the messages container element
    const messagesContainer = document.getElementById('chat-content');

    // Get all the chat message elements from the messages container
    const chatMessages = messagesContainer.querySelectorAll('.messages-content div p');

    // Initialize variables
    let previousUser = null;
    let isFirstMessage = true;
    let spacing = '14px';

    // Loop through the chat messages
    for (let i = 0; i < chatMessages.length; i++) {
      const message = chatMessages[i];
      const usernameElement = message.querySelector('span.username');

      // Check if it's a system message with the "system-message" class
      const isSystemMessage = message.querySelector('.system-message');

      if (isSystemMessage) {
        // Apply margins to system messages
        message.style.marginTop = spacing;
        message.style.marginBottom = spacing;
      } else if (usernameElement) { // Check if the message contains a username
        // Get the username from the current message
        const usernameElementWithDataUser = usernameElement.querySelector('span[data-user]');

        if (!usernameElementWithDataUser) {
          continue; // Skip messages without a data-user element
        }

        let usernameText = usernameElementWithDataUser.textContent;

        // Remove the "<" and ">" symbols from the username if they are present
        usernameText = usernameText.replace(/</g, '').replace(/>/g, '');

        // Apply margin-top for the first message or when the user changes
        if (previousUser === null || usernameText !== previousUser) {
          // Check if it's not the first message overall
          if (!isFirstMessage) {
            // Add margin-top to create separation between the current message and the previous message
            message.style.marginTop = spacing;
          }
        } else {
          // Check if it's not the first message of the current user
          if (!isFirstMessage) {
            // Remove the margin-bottom property from the current message to remove any previously set margin
            message.style.removeProperty('margin-bottom');
          }
        }

        // Check if there is a next message
        const hasNextMessage = i < chatMessages.length - 1;

        // Check if there is a next message and it contains a username
        if (hasNextMessage) {
          const nextMessage = chatMessages[i + 1];
          const nextUsernameElement = nextMessage.querySelector('span.username');

          if (nextUsernameElement) {
            const nextUsernameElementWithDataUser = nextUsernameElement.querySelector('span[data-user]');

            if (!nextUsernameElementWithDataUser) {
              continue; // Skip messages without a data-user element
            }

            // Get the username from the next message
            const nextUsernameText = nextUsernameElementWithDataUser.textContent;

            // Apply margin-bottom for the last message of each user
            if (usernameText !== nextUsernameText) {
              message.style.marginBottom = spacing;
            }
          }
        }

        // Update the previousUser variable to store the current username
        previousUser = usernameText;
        // Set isFirstMessage to false to indicate that this is not the first message overall
        isFirstMessage = false;
      }
    }
  }

  // Call the function to apply chat message grouping
  applyChatMessageGrouping();

  // Algorithm to check for similarity between two strings
  function similarity(s1, s2) {
    const [longer, shorter] = s1.length >= s2.length ? [s1, s2] : [s2, s1];
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / longerLength;
  }

  function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = Array(s2.length + 1).fill(0).map((_, j) => j);
    for (let i = 1; i <= s1.length; i++) {
      let lastValue = costs[0];
      costs[0] = i;
      for (let j = 1; j <= s2.length; j++) {
        const newValue = costs[j];
        costs[j] = s1.charAt(i - 1) === s2.charAt(j - 1) ? lastValue : Math.min(Math.min(newValue, lastValue), costs[j - 1]) + 1;
        lastValue = newValue;
      }
    }
    return costs[s2.length];
  }

  // Time difference threshold (in milliseconds) to identify spam
  const timeDifferenceThreshold = 400;
  // Message limit per timeDifferenceThreshold
  const messageLimit = 1;
  // Object to track user-specific data
  let userChatData = {};
  // Maximum number of consecutive times a user is allowed to exceed the message limit
  const thresholdMaxTries = 10;

  // Function to format time difference
  function formatTimeDifference(difference) {
    // Define time units
    const units = ['hour', 'minute', 'second', 'millisecond'];

    // Calculate values for each time unit
    const values = [
      Math.floor(difference / (1000 * 60 * 60)), // hours
      Math.floor((difference / (1000 * 60)) % 60), // minutes
      Math.floor((difference / 1000) % 60), // seconds
      difference % 1000 // milliseconds
    ];

    // Map each non-zero value to a formatted string with its corresponding unit
    const formattedStrings = values
      .map((value, index) => (value > 0 ? `${value} ${units[index]}${value > 1 ? 's' : ''}` : ''));

    // Filter out empty strings (units with a value of 0) and join the remaining strings
    const formattedTime = formattedStrings
      .filter(Boolean)
      .join(' ');

    // Return the formatted time string
    return formattedTime;
  }

  // Helper function to remove all messages by a user
  function removeUserMessages(userId) {
    const userMessages = document.querySelectorAll(`.messages-content span[data-user="${userId}"]`);
    userMessages.forEach(message => {
      const pTag = message.closest('p');
      if (pTag) {
        pTag.remove();
      }
    });
  }

  const digits = '0-9';
  const whitespaces = '\\s';
  const latinChars = 'a-zA-Z';
  const cyrillicChars = 'а-яА-ЯёЁ';
  const commonSymbols = '!@#$%^&*()-_=+[\\]{}|;:\'",.<>/?`~';

  // Special symbols as characters
  const copyrightSymbol = '\\u00A9'; // ©
  const trademarkSymbol = '\\u2122'; // ™
  const registeredSymbol = '\\u00AE'; // ®
  const leftDoubleAngleQuote = '\\u00AB'; // «
  const rightDoubleAngleQuote = '\\u00BB'; // »
  const plusMinus = '\\u00B1'; // ±
  const multiplication = '\\u00D7'; // ×
  const division = '\\u00F7'; // ÷
  const degreeSymbol = '\\u00B0'; // °
  const notEqual = '\\u2260'; // ≠
  const lessThanOrEqual = '\\u2264'; // ≤
  const greaterThanOrEqual = '\\u2265'; // ≥
  const infinity = '\\u221E'; // ∞
  const euroSymbol = '\\u20AC'; // €
  const poundSymbol = '\\u00A3'; // £
  const yenSymbol = '\\u00A5'; // ¥
  const sectionSymbol = '\\u00A7'; // §
  const bulletPoint = '\\u2022'; // •
  const ellipsis = '\\u2026'; // …
  const minus = '\\u2212'; // −
  const enDash = '\\u2013'; // –
  const emDash = '\\u2014'; // —

  // Arrow and Mathematical symbols as Unicode escape sequences
  const leftArrow = '\\u2190'; // ←
  const rightArrow = '\\u2192'; // →
  const upArrow = '\\u2191'; // ↑
  const downArrow = '\\u2193'; // ↓

  const half = '\\u00BD'; // ½
  const oneThird = '\\u2153'; // ⅓
  const twoThirds = '\\u2154'; // ⅔

  const summation = '\\u2211'; // ∑
  const acuteAccent = '\\u00B4'; // ´

  const emojiRanges = '\\uD83C-\\uDBFF\\uDC00-\\uDFFF';

  // Initialized to store characters found in a message that are not allowed
  let disallowedChars = null;

  function messageContainsAllowedChars(message) {
    const allowedCharsRegex = new RegExp(
      `[${digits}${latinChars}${cyrillicChars}${whitespaces}${commonSymbols}` +
      `${copyrightSymbol}${trademarkSymbol}${registeredSymbol}${leftDoubleAngleQuote}${rightDoubleAngleQuote}` +
      `${plusMinus}${multiplication}${division}${degreeSymbol}${notEqual}${lessThanOrEqual}${greaterThanOrEqual}` +
      `${infinity}${euroSymbol}${poundSymbol}${yenSymbol}${sectionSymbol}${bulletPoint}${ellipsis}${minus}${enDash}${emDash}` +
      `${leftArrow}${rightArrow}${upArrow}${downArrow}${half}${oneThird}${twoThirds}${summation}` +
      `${acuteAccent}${emojiRanges}]+`, 'g'
    );

    const allowedChars = message.match(allowedCharsRegex);

    if (allowedChars && allowedChars.join('') === message) {
      return true;
    } else {
      disallowedChars = message.replace(allowedCharsRegex, '');
      return false;
    }
  }

  // Helper function to handle threshold check
  function handleThresholdExceeded(userId, generateLogUserInfo) {
    if (userChatData[userId].thresholdMaxTries >= thresholdMaxTries) {
      // Set 'banned' to true after passing the max thresholdMaxTries to remove user messages passing the messages limit checking
      userChatData[userId].banned = true;
      console.log(generateLogUserInfo(), 'color: pink');
      console.log(`%c${userChatData[userId].userName} cannot send messages anymore`, 'color: pink');
    }
  }

  // Function to track and handle spam messages
  function banSpammer() {
    // Get the current timestamp
    const currentTime = new Date().getTime();

    // Select the last p element in the chat
    const latestMessage = document.querySelector('.messages-content p:last-child');

    if (latestMessage) {
      // Get user ID from the last message
      const userIdElement = latestMessage.querySelector('span[data-user]');
      const userId = userIdElement ? userIdElement.getAttribute('data-user') : null;

      // Initialize user-specific data outside the if block
      if (!userChatData[userId]) {
        userChatData[userId] = {
          messagesCount: 0,
          thresholdMaxTries: 0,
          time: currentTime,
          userName: userIdElement ? userIdElement.textContent : 'Unknown User',
          previousTime: null,
          firstInteraction: true,
          banned: false
        };
      }

      // Calculate time difference
      const timeDifference = currentTime - userChatData[userId].time;

      // Function to generate log information dynamically
      function generateLogUserInfo() {
        return `%cID: ${userId}, Name: ${userChatData[userId].userName}, ` +
          `Time Difference: ${formatTimeDifference(timeDifference)}, ` +
          `Messages Count: ${userChatData[userId].messagesCount}, ` +
          `Spam Tries: ${userChatData[userId].thresholdMaxTries}, ` +
          `Banned: ${userChatData[userId].banned}`;
      }

      // Check if the message contains not allowed chars
      if (!messageContainsAllowedChars(latestMessage.textContent, userId) && !userChatData[userId].banned) {
        // Increase thresholdMaxTries on every limit pass
        userChatData[userId].thresholdMaxTries++;
        // If the message contains not allowed chars, log the information
        console.log(
          `%c${userChatData[userId].userName} has sent a message with not allowed characters ${disallowedChars}.
          Threshold: ${userChatData[userId].thresholdMaxTries}.`,
          'color: orange;'
        );
        handleThresholdExceeded(userId, generateLogUserInfo);
      }

      // Special handling for the first interaction
      if (userChatData[userId].firstInteraction) {
        console.log(`%c${userChatData[userId].userName} posted the first message for the current chat session.`, 'color: yellow');
        userChatData[userId].firstInteraction = false;
      }

      // Check if the user is banned
      else if (userChatData[userId].banned) {
        // Remove all the messages by that user continuously until banned
        removeUserMessages(userId);
      } else {
        if (timeDifference < timeDifferenceThreshold) {
          // Check if the time difference is less than the threshold
          userChatData[userId].messagesCount++;

          if (userChatData[userId].messagesCount > messageLimit) {
            // Remove all messages by that user if messages limit was exceeded
            removeUserMessages(userId);

            // Increase thresholdMaxTries on every limit pass
            userChatData[userId].thresholdMaxTries++;

            handleThresholdExceeded(userId, generateLogUserInfo);

            // Log the information immediately after updating the values if not banned
            if (!userChatData[userId].banned) {
              console.log(generateLogUserInfo(), 'color: red');
            }
          } else {
            // Log the information immediately after updating the values if not banned and not exceeding the limit
            console.log(generateLogUserInfo(), 'color: green');
          }
        } else {
          // If none of the above conditions are met, update user-specific data for the current interaction
          userChatData[userId].previousTime = userChatData[userId].time;
          userChatData[userId].time = currentTime;
          userChatData[userId].messagesCount = 1;

          // Log the information immediately after updating the values if not banned and not exceeding the limit
          console.log(generateLogUserInfo(), 'color: green');
        }
      }
    }
  }


  // POPUP MESSAGES START

  const popupMessageIconSize = 16;

  // SVG markup for a clock icon
  const clockSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="${popupMessageIconSize - 2}"
       height="${popupMessageIconSize - 2}"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       stroke-width="2"
       stroke-linecap="round"
       stroke-linejoin="round"
       class="feather feather-clock">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
`;

  // SVG for the "chevron right" icon, used in a popup chat messages
  const actionSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-chevron-right">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>`;

  // SVG markup for a user icon
  const userSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="${popupMessageIconSize - 2}"
       height="${popupMessageIconSize - 2}"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       stroke-width="2"
       stroke-linecap="round"
       stroke-linejoin="round"
       class="feather feather-user">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
`;

  const popupChatMessageStyles = document.createElement('style');
  popupChatMessageStyles.textContent = `
    .popup-messages-container {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: start;
      user-select: none;
      pointer-events: none;
      position: fixed;
      left: 0;
      right: 0;
      top: 50px;
      bottom: 0;
    }

    .popup-chat-message {
      display: flex;
      align-items: center;
      background-color: hsl(100, 50%, 10%);
      position: relative;
      max-width: 70vw;
      border-radius: 0.2em !important;
      color: hsl(100, 50%, 50%);
      border: 1px solid hsl(100, 50%, 25%);
      padding: 4px;
      margin: 6px 15vw;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
      animation: fadeIn 0.3s ease-in-out forwards;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .popup-chat-message.fade-out {
      animation: fadeOut 0.3s ease-in-out forwards;
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }

    .popup-chat-message > div {
      padding: 2px;
      display: flex;
      font-family: 'Montserrat', sans-serif;
    }

    .popup-chat-message .time,
    .popup-chat-message .time-icon {
      opacity: 0.7;
    }
`;

  popupChatMessageStyles.classList.add('popup-chat-message-styles');

  document.head.appendChild(popupChatMessageStyles);

  // Set the maximum number of popup messages to display globally
  const maxPopupMessagesCount = 10;

  // Define an object to store the hue for each username
  const usernameHueMap = {};
  // Increase step for noticeable color changes
  const hueStep = 15;

  // Define the function to show popup messages when the main chat is hidden by hotkeys Ctrl + Space (only)
  function showPopupMessage() {
    // Check if the key 'shouldShowPopupMessage' exists and has a value of true
    const shouldShowPopupMessage = localStorage.getItem('shouldShowPopupMessage');

    // Stop execution if shouldShowPopupMessage is false
    if (shouldShowPopupMessage !== 'true') {
      return;
    }

    // Get the last message in the chat
    const latestMessage = document.querySelector('.messages-content p:last-of-type');

    if (latestMessage) {
      // Extract elements for time and username from the latest message
      const time = latestMessage.querySelector('.time');
      const username = latestMessage.querySelector('.username');

      // Get all nodes and concatenate their values
      const nodes = Array.from(latestMessage.childNodes);
      const elements = nodes.map(node => {
        // Handle plain text nodes
        if (node.nodeType === Node.TEXT_NODE) {
          return { type: 'text', value: node.nodeValue.trim() };
        }

        // Handle element nodes
        else if (node.nodeType === Node.ELEMENT_NODE) {
          // Handle private <a> element (with lock emoji for <a>)
          if (node.tagName.toLowerCase() === 'a' && node.classList.contains('private')) {
            return { type: 'text', value: '📢\u00A0' }; // Non-breaking space after lock emoji
          }

          // Handle private <span> element (no lock emoji for <span>)
          if (node.tagName.toLowerCase() === 'span' && node.classList.contains('private')) {
            return { type: 'text', value: node.textContent.trim() };
          }

          // Handle <img> element
          if (node.tagName.toLowerCase() === 'img') {
            const imgTitle = node.getAttribute('title');
            return { type: 'img', title: imgTitle };
          }

          // Handle regular <a> element (without 'private' class)
          if (node.tagName.toLowerCase() === 'a') {
            const anchorHref = node.getAttribute('href');
            return { type: 'anchor', href: anchorHref };
          }
        }
      }).filter(Boolean);

      // Extract relevant data from the time and username elements
      const cleanTime = time.textContent.replace(/[\[\]]/g, '');
      const cleanUsername = username.textContent.replace(/[<>]/g, '');

      // Check if the hue for this username is already stored
      let hueForUsername = usernameHueMap[cleanUsername];

      // If the hue is not stored, generate a new random hue with the specified step
      if (!hueForUsername) {
        hueForUsername = Math.floor(Math.random() * (360 / hueStep)) * hueStep;
        // Store the generated hue for this username
        usernameHueMap[cleanUsername] = hueForUsername;
      }

      // Create or get the main container for all messages
      let popupMessagesContainer = document.querySelector('.popup-messages-container');
      if (!popupMessagesContainer) {
        popupMessagesContainer = document.createElement('div');
        popupMessagesContainer.classList.add('popup-messages-container');
        document.body.appendChild(popupMessagesContainer);
      }

      // Check if the total number of messages in the container exceeds the maximum
      if (popupMessagesContainer.childElementCount >= maxPopupMessagesCount) {
        // Get the oldest message
        const oldestMessage = popupMessagesContainer.firstChild;

        // Apply a CSS class to initiate the fade-out animation
        oldestMessage.classList.add('fade-out');

        // After the animation duration, remove the message from the DOM
        setTimeout(() => {
          popupMessagesContainer.removeChild(oldestMessage);
        }, 300); // Adjust the time to match your CSS animation duration
      }

      // Create a container div for each message
      const popupChatMessage = document.createElement('div');
      popupChatMessage.classList.add('popup-chat-message');
      // Apply the hue-rotate filter to the entire message container
      popupChatMessage.style.filter = `hue-rotate(${hueForUsername}deg)`;

      // Append time SVG icon before the time
      const timeIcon = document.createElement('div');
      timeIcon.classList.add('time-icon');
      timeIcon.innerHTML = clockSVG;

      // Append spans for each part with respective classes
      const timeElement = document.createElement('div');
      timeElement.classList.add('time');
      timeElement.textContent = cleanTime;

      // Append user SVG icon after the time
      const userIcon = document.createElement('div');
      userIcon.classList.add('user-icon');
      userIcon.innerHTML = userSVG;

      const usernameElement = document.createElement('div');
      usernameElement.classList.add('username');
      usernameElement.textContent = cleanUsername;

      // Append action SVG icon after the username
      const actionIcon = document.createElement('div');
      actionIcon.classList.add('action-icon');
      actionIcon.innerHTML = actionSVG;

      const messageElement = document.createElement('div');
      messageElement.classList.add('message');

      // Append elements to the message container
      popupChatMessage.appendChild(timeIcon);
      popupChatMessage.appendChild(timeElement);
      popupChatMessage.appendChild(userIcon);
      popupChatMessage.appendChild(usernameElement);
      popupChatMessage.appendChild(actionIcon);
      popupChatMessage.appendChild(messageElement);

      // Fill the message container with text, images, and anchors
      elements.forEach(element => {
        const elementContainer = document.createElement('div');

        if (element.type === 'text') {
          elementContainer.textContent = element.value;
        } else if (element.type === 'img') {
          elementContainer.innerHTML = `&nbsp;${element.title}&nbsp;`;
        } else if (element.type === 'anchor') {
          elementContainer.innerHTML = `&nbsp;${element.href}&nbsp;`;
        }

        messageElement.appendChild(elementContainer);
      });

      // Append the message container to the main container
      popupMessagesContainer.appendChild(popupChatMessage);
    }
  }

  // POPUP MESSAGES END

  // Function to convert Cyrillic characters to Latin
  function convertCyrillicToLatin(input) {
    const cyrillicToLatinMap = {
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
      'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
      'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
      'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
      'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
      'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': 'y', // 'ъ' maps to 'y'
      'Ы': 'Y', 'Ь': 'i', // 'ь' maps to 'i'
      'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
      'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
      'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
      'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
      'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
      'ш': 'sh', 'щ': 'shch', 'ъ': 'y', // 'ъ' maps to 'y'
      'ы': 'y', 'ь': 'i', // 'ь' maps to 'i'
      'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    // Convert the input string to Latin using the mapping
    return input.split('').map(char => cyrillicToLatinMap[char] || char).join('');
  }

  // Function to convert Russian usernames
  function convertRussianUsernameToLatin(username) {
    // Use the conversion function on the username
    return convertCyrillicToLatin(username);
  }

  // Skip reading the messages on page load to read them normally when the user is present and the page is stable
  let isInitialized = false;
  // Define the maximum number of messages per user
  const maxMessagesPerUser = 5;
  // Set a similarity threshold (you can adjust this value as needed)
  const similarityThreshold = 0.8;
  // Create a map to hold messages for each user
  const messagesForSimilarityCheck = new Map();

  // Function to remove all messages from users in the ignored
  function removeIgnoredUserMessages() {
    document.querySelectorAll('.messages-content p').forEach(message => {
      const usernameElement = message.querySelector('.username'); // Adjust selector if needed
      const username = usernameElement?.textContent?.replace(/[<>]/g, '') || null;

      if (username && ignored.includes(username)) {
        // console.log(`Hidden message from ignored user: ${username}`);
        // Convert Cyrillic username to Latin
        const latinUsername = convertRussianUsernameToLatin(username);
        message.classList.add('ignored-user', latinUsername);
        message.style.display = 'none'; // Hide the message
      }
    });
  }

  // Function to play sound as a notification for system message banned
  function playSound() {
    const marioGameOver = 'https://github.com/VimiummuimiV/Sounds/raw/refs/heads/main/Mario_Game_Over.mp3';
    const audio = new Audio(marioGameOver);
    audio.play();
  }

  // Function to detect a system ban message based on the message text content
  function isBanMessageFromSystem(messageText) {
    return ['Клавобот', 'Пользователь', 'заблокирован'].every(word => messageText.includes(word));
  }

  /**
   * Normalizes the color of usernames and resets their filter based on the specified mode.
   *
   * @param {NodeList|Element} usernameElements - A NodeList of username elements or a single username element.
   * @param {string} mode - The mode of operation; either 'one' to process a single username or 'all' to process multiple.
   */
  function normalizeAndResetUsernames(usernameElements, mode) {
    // Exit if usernameElements is null or undefined
    if (!usernameElements) return console.error("usernameElements is null or undefined.");

    if (mode === 'one') {
      // Directly process the single username element
      const userSpan = usernameElements.querySelector('span[data-user]'); // Get the span[data-user] inside the .username element
      const computedColor = getComputedStyle(usernameElements).color; // Get the computed color of the usernameElement
      const normalizedColor = normalizeUsernameColor(computedColor); // Normalize the color
      usernameElements.style.setProperty('color', normalizedColor, 'important'); // Apply the normalized color to usernameElement
      userSpan.style.setProperty('filter', 'invert(0)', 'important'); // Reset the filter for userSpan
    } else if (mode === 'all') {
      // Process all username elements within the context of the provided NodeList
      const elementsToProcess = Array.from(usernameElements); // Convert NodeList to an array
      elementsToProcess.forEach(usernameElement => {
        const userSpan = usernameElement.querySelector('span[data-user]'); // Get the span[data-user] inside the .username element
        if (!userSpan) return; // Exit if userSpan does not exist

        const computedColor = getComputedStyle(usernameElement).color; // Get the computed color of the usernameElement
        const normalizedColor = normalizeUsernameColor(computedColor); // Normalize the color
        usernameElement.style.setProperty('color', normalizedColor, 'important'); // Apply the normalized color to usernameElement
        userSpan.style.setProperty('filter', 'invert(0)', 'important'); // Reset the filter for userSpan
      });
    } else {
      console.error("Invalid mode. Use 'one' or 'all'.");
    }
  }

  // Create a mutation observer to watch for new messages being added
  const newMessagesObserver = new MutationObserver(mutations => {
    // If isInitialized is false, return without doing anything
    if (!isInitialized) {
      isInitialized = true;

      // Remove the 'sessionChatMessages' key from localStorage if it exists
      localStorage.getItem('sessionChatMessages') && localStorage.removeItem('sessionChatMessages');

      // Normalize chat usernames color for dark theme
      const allUsernameElements = document.querySelectorAll('.username'); // Get all username elements
      normalizeAndResetUsernames(allUsernameElements, 'all'); // Process all username elements

      return; // Stop processing further
    }

    for (let mutation of mutations) {
      if (mutation.type === 'childList') {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P') {
            const singleUsernameElement = node.querySelector('.username'); // Get a single username element
            normalizeAndResetUsernames(singleUsernameElement, 'one'); // Process the single username element

            // Get previous message from localStorage
            let previousMessageText = localStorage.getItem('previousMessageText');

            // Get the latest message data
            let latestMessageData = getLatestMessageData();

            // Get the modified and original actual messages of the user who sent it
            let actualModifiedMessageText = latestMessageData?.modifiedMessageText || null;
            let actualOriginalMessageText = latestMessageData?.originalMessageText || null;
            // Get the actual username of the user who sent the latest message
            let latestMessageUsername = latestMessageData?.usernameText || null;

            // Initialize the user's message array if it doesn't exist
            messagesForSimilarityCheck.set(latestMessageUsername, messagesForSimilarityCheck.get(latestMessageUsername) || []);

            // Get the user's messages
            const userMessages = messagesForSimilarityCheck.get(latestMessageUsername);

            // Check if the new message is similar to any existing message in the user's message array
            const isSimilarMessage = userMessages.some(msg => {
              const messageSimilarity = similarity(actualOriginalMessageText, msg); // Store similarity value in a constant
              return messageSimilarity > similarityThreshold;
            });

            // If the message is similar, set filter opacity and blur
            if (isSimilarMessage) {
              node.style.filter = 'opacity(0.3) blur(1px)';
            } else {
              // Add the new message to the user's message array and update the map
              userMessages.push(actualOriginalMessageText); // Push the new message into the user's message array
              messagesForSimilarityCheck.set(latestMessageUsername, userMessages); // Update the map with the latest messages for the user

              // Prepare the sessionMessages object to store chat messages in the desired format
              let sessionMessages = JSON.parse(localStorage.getItem('sessionChatMessages')) || {}; // Retrieve existing session messages or initialize an empty object

              // Ensure there's an entry for the current user in sessionMessages
              sessionMessages[latestMessageUsername] = sessionMessages[latestMessageUsername] || []; // Create an array if the username doesn't exist

              // Add the new message to the user's array in sessionMessages
              sessionMessages[latestMessageUsername].push(actualOriginalMessageText); // Append the new message to the user's message array

              // Check if the number of messages for the user exceeds the maximum allowed
              if (userMessages.length > maxMessagesPerUser) {
                messagesForSimilarityCheck.delete(latestMessageUsername); // Remove the user from the messagesForSimilarityCheck map
                delete sessionMessages[latestMessageUsername]; // Delete the user's messages from sessionMessages
              }

              // Save the updated session messages back to localStorage to persist changes
              localStorage.setItem('sessionChatMessages', JSON.stringify(sessionMessages)); // Update localStorage with the new sessionMessages
            }

            // Convert Cyrillic username to Latin
            const latinUsername = convertRussianUsernameToLatin(latestMessageUsername);

            // Detect and handle the ban message (play sound if detected)
            if (isBanMessageFromSystem(actualModifiedMessageText)) {
              console.log('Ban message detected:', actualModifiedMessageText);
              playSound(); // Play the Mario Game Over sound
            }

            // Check if the username is in the ignored
            if (latestMessageUsername && ignored.includes(latestMessageUsername)) {
              node.classList.add('ignored-user', latinUsername);
              node.style.display = 'none'; // Hide the message
              continue; // Skip the rest of the processing for this message
            }

            // Get the sound switcher element and check which option is selected
            const soundSwitcher = document.querySelector('#voice, #beep, #silence');
            const isVoice = soundSwitcher && soundSwitcher.id === 'voice';
            const isBeep = soundSwitcher && soundSwitcher.id === 'beep';

            // Get the message mode element and check which option is selected
            const messageMode = document.querySelector('#every-message, #mention-message');
            const isEveryMessageMode = messageMode && messageMode.id === 'every-message';
            const isMentionMessageMode = messageMode && messageMode.id === 'mention-message';

            // Define the constant for the private message check
            const privateMessageIndicator = '[шепчет вам]';
            // Check if the message element contains a private message
            const privateMessageContainer = node.querySelector('.room.private');
            const isPrivateMessage = privateMessageContainer && privateMessageContainer.textContent.includes(privateMessageIndicator);

            // If mode is voice, speak the new message and update the latest message content in local storage
            if (isVoice && isInitialized && actualModifiedMessageText && actualModifiedMessageText !== previousMessageText) {
              // Update localStorage key "previousMessageText"
              localStorage.setItem('previousMessageText', actualModifiedMessageText);

              // Do not read personal messages. Only unique other people's messages.
              if (latestMessageUsername && !latestMessageUsername.includes(myNickname)) {

                // Read all messages in every-message mode
                if (isEveryMessageMode) {
                  console.log('Triggered Voice: Every message mode');
                  addNewMessage(actualModifiedMessageText);
                }
                // Read mention messages only in mention-message mode
                else if (isMentionMessageMode && isMention) {
                  console.log('Triggered Voice: Mention message mode');
                  addNewMessage(actualModifiedMessageText);
                }
                // Read when private messages is addressed to you
                else if (isPrivateMessage) {
                  console.log('Triggered Voice: Private message');
                  addNewMessage(actualModifiedMessageText);
                }
                else {
                  console.log('No matching condition for Voice Mode');
                }

              }
            }

            // If mode is beep, play the beep sound for the new message
            if (isBeep && isInitialized && actualModifiedMessageText && actualModifiedMessageText !== previousMessageText) {

              // Update localStorage key "previousMessageText"
              localStorage.setItem('previousMessageText', actualModifiedMessageText);

              // Do not read personal messages. Only unique other people's messages.
              if (latestMessageUsername && !latestMessageUsername.includes(myNickname)) {

                // Beep all messages in every-message mode
                if (isEveryMessageMode) {
                  console.log('Triggered Beep: Every message mode');
                  const frequenciesToPlay = isMention ? mentionMessageFrequencies : usualMessageFrequencies;
                  playBeep(frequenciesToPlay, beepVolume);
                }
                // Beep mention messages only in mention-message mode
                else if (isMentionMessageMode && isMention) {
                  console.log('Triggered Beep: Mention message mode');
                  const frequenciesToPlay = mentionMessageFrequencies;
                  playBeep(frequenciesToPlay, beepVolume);
                }
                // Beep when private messages are addressed to you
                else if (isPrivateMessage) {
                  console.log('Triggered Beep: Private message');
                  const frequenciesToPlay = mentionMessageFrequencies;
                  playBeep(frequenciesToPlay, beepVolume);
                }
                else {
                  console.log('No matching condition for Beep Mode');
                }

                // Reset mention flag if it was true
                if (isMention) isMention = false;
              }
            }

            if (isInitialized) {
              // Attach contextmenu event listener for messages deletion
              attachEventsToMessages();
              // Convert image links to visible image containers
              convertImageLinksToImage('generalMessages');
              // Convert YouTube links to visible iframe containers
              convertYoutubeLinksToIframe('generalMessages'); // For general chat
              // Call the function to apply the chat message grouping
              applyChatMessageGrouping();
              // Call the function to scroll to the bottom of the chat
              scrollMessagesToBottom();
              // Call the banSpammer function to track and handle potential spam messages
              banSpammer();
              // Call the function to show the latest popup message
              showPopupMessage();
              // Call the function to update the total and new message count display
              updatePersonalMessageCounts();
            }
          }
        }
      }
    }
  });

  // Observe changes to the messages container element
  const messagesContainer = document.querySelector('.messages-content div');
  newMessagesObserver.observe(messagesContainer, { childList: true, subtree: true });


  // SOUND GRAPHICAL SWITCHER

  const iconStrokeWidth = 1.8;
  const iconSize = 28;
  const iconSilenceStroke = 'hsl(355, 80%, 65%)'; // red
  const iconBeepStroke = 'hsl(55, 80%, 65%)'; // yellow
  const iconVoiceStroke = 'hsl(80, 80%, 40%)'; // green
  const svgUrl = "http://www.w3.org/2000/svg";

  // Icons for sound switcher button
  // Button SVG icons "silence", "beep", "voice" representation
  const iconSoundSilence = `<svg xmlns="${svgUrl}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconSilenceStroke}" stroke-width="${iconStrokeWidth}" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <line x1="23" y1="9" x2="17" y2="15"></line>
      <line x1="17" y1="9" x2="23" y2="15"></line>
      </svg>`;
  const iconSoundBeep = `<svg xmlns="${svgUrl}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconBeepStroke}" stroke-width="${iconStrokeWidth}" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity="0.3"></path>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>`;
  const iconSoundVoice = `<svg xmlns="${svgUrl}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconVoiceStroke}" stroke-width="${iconStrokeWidth}" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>`;

  // Icons for message mode button
  // Button SVG icons "every", "mention" representation
  const iconModeEvery = `<svg xmlns="${svgUrl}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="hsl(100, 50%, 50%)" stroke-width="${iconStrokeWidth}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>`;
  const iconModeMention = `<svg xmlns="${svgUrl}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="hsl(180, 60%, 50%)" stroke-width="${iconStrokeWidth}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
      </svg>`;
  // Icon for the out of range value
  const iconRangeisOut = `<svg xmlns="${svgUrl}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-slash">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
      </svg>`;
  // Icon for userlistCache
  const iconUserlistCache = `<svg xmlns="${svgUrl}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="#b4d583" stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-database">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      </svg>`;
  // Icon for personal messages
  const iconPersonalMessages = `<svg xmlns="${svgUrl}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="#ffa07a" stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-mail">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
      </svg>`;
  // Icon for chat logs
  const iconChatLogs = `<svg xmlns="${svgUrl}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none"
    stroke="cornflowerblue" stroke-width="${iconStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"
    class="feather feather-message-circle">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>`;

  // Declare variables for the sound switcher button and its icon
  let soundSwitcher, soundSwitcherIcon;
  // Declare variables for the message mode button and its icon
  let messageMode, messageModeIcon;

  // Helper function to add pulse effect
  function addPulseEffect(element) {
    element.classList.add('pulse');
    setTimeout(() => {
      element.classList.remove('pulse');
    }, 300);
  }

  // Helper function to add jump effect like a ball with more keyframes
  function addJumpEffect(element, initialTranslateX = 50, initialTranslateY = 50) {
    const transforms = [
      `translate(${initialTranslateX}%, ${initialTranslateY}%)`, // Initial start position
      `translate(${initialTranslateX}%, ${initialTranslateY - 30}%)`, // Jump up
      `translate(${initialTranslateX}%, ${initialTranslateY - 50}%)`, // Higher jump peak
      `translate(${initialTranslateX}%, ${initialTranslateY}%)`, // Return to original position
      `translate(${initialTranslateX}%, ${initialTranslateY + 10}%)`, // Slight bounce down
      `translate(${initialTranslateX}%, ${initialTranslateY + 20}%)`, // Adjust slightly up
      `translate(${initialTranslateX}%, ${initialTranslateY}%)` // Final position (original)
    ];

    // Define an initial delay and a decrement factor for timing
    let delay = 300; // Start with 300ms
    const decrement = 40; // Decrease the delay by 40ms for each keyframe

    transforms.forEach((transform, index) => {
      setTimeout(() => {
        element.style.transform = transform; // Apply the current transform
      }, delay); // Schedule the transform
      delay -= decrement; // Decrease delay for the next keyframe
    });
  }

  // Helper function to add a shake effect for messages not found in the personal messages panel.
  function addShakeEffect(element) {
    const transforms = [
      'translate3d(0, 0, 0)', // Initial start position
      'translate3d(-2px, 0, 0)', // Shake left (larger)
      'translate3d(4px, 0, 0)', // Shake right (larger)
      'translate3d(-8px, 0, 0)', // Shake left more (larger)
      'translate3d(8px, 0, 0)', // Shake right more (larger)
      'translate3d(-2px, 0, 0)', // Shake left (larger)
      'translate3d(0, 0, 0)' // Return to original position
    ];

    // Define an initial delay and a decrement factor for timing
    let delay = 100; // Start with 100ms
    const increment = 50; // Increase the delay by 50ms for each keyframe

    transforms.forEach((transform, index) => {
      setTimeout(() => {
        element.style.transform = transform; // Apply the current transform
        element.style.transition = 'transform 0.1s ease'; // Ensure smooth transition
      }, delay); // Schedule the transform
      delay += increment; // Increase delay for the next keyframe
    });
  }

  // Helper function to add a blink effect using color opacity.
  function addBlinkEffect(element) {
    // Set the initial color to bisque with full opacity.
    element.style.backgroundColor = 'rgba(255, 228, 196, 1)'; // bisque color.

    const opacities = [1, 0, 1, 0]; // Full -> Hidden -> Full -> End at Hidden.
    const delay = 100; // Static delay of 200ms between frames.

    // Repeat the blink effect three times.
    for (let i = 0; i < 3; i++) {
      opacities.forEach((opacity, index) => {
        setTimeout(() => {
          // Apply the opacity to the background color.
          element.style.backgroundColor = `rgba(255, 228, 196, ${opacity})`;
          element.style.transition = 'background-color 0.3s ease'; // Smooth transition.
        }, delay * (i * opacities.length + index)); // Schedule the color change.
      });
    }
  }

  // Helper function to apply common styles to buttons
  function applyBaseButtonStyles(element) {
    Object.assign(element.style, {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '48px',
      height: '48px',
      cursor: 'pointer',
      margin: `${empowermentButtonsMargin}px`,
      backgroundColor: '#212226',
      border: '1px solid #45474b',
    });
  }

  // CREATE SOUND SWITCHER BUTTON (START)

  function createSoundSwitcherButton() {
    // Create a new element with class 'sound-switcher-button' and id 'silence'
    soundSwitcher = document.createElement('div');
    // Retrieve the value from localStorage key "messageNotificationState"
    const messageNotificationState = KG_Chat_Empowerment.messageSettings.messageNotificationState || 'silence';
    // Add the class 'sound-switcher-button' to the 'soundSwitcher' element
    soundSwitcher.classList.add('sound-switcher-button');
    // Initial button id if the localStorage key isn't created with assigned value by user
    soundSwitcher.id = messageNotificationState;
    // Retrieve the value from localStorage key "messageNotificationTitle"

    // Apply base button styles
    applyBaseButtonStyles(soundSwitcher);

    // Retrieve the value from KG_Chat_Empowerment.messageSettings.messageNotificationTitle
    const messageNotificationTitle = KG_Chat_Empowerment.messageSettings.messageNotificationTitle || 'Do not disturb';
    // Assign title for the current notification state
    soundSwitcher.title = messageNotificationTitle;

    // Create sound switcher button icon container
    soundSwitcherIcon = document.createElement('span');
    // Add class to icon container
    soundSwitcherIcon.classList.add('sound-switcher-icon');

    // Append icon container inside sound switcher button
    soundSwitcher.appendChild(soundSwitcherIcon);
    // Append sound switcher button to chat buttons panel
    empowermentButtonsPanel.appendChild(soundSwitcher);
  } createSoundSwitcherButton();

  // Add the isAltKeyPressed condition to the soundSwitcher event listener
  soundSwitcher.addEventListener('click', function (event) {
    // Only execute the code if both isCtrlKeyPressed and isAltKeyPressed are false
    if (!isCtrlKeyPressed && !isAltKeyPressed) {

      // Get progress bar elements if they exist in the DOM
      let currentVoiceSpeed = document.querySelector('.current-voice-speed');
      let currentVoicePitch = document.querySelector('.current-voice-pitch');

      // Remove voice speed setting progress bar
      if (currentVoiceSpeed) {
        currentVoiceSpeed.remove();
      }

      // Remove voice pitch setting progress bar
      if (currentVoicePitch) {
        currentVoicePitch.remove();
      }

      // Add pulse effect for soundSwitcher
      addPulseEffect(this);

      switch (this.id) {
        case 'silence':
          this.id = 'beep';
          this.title = 'Notify with beep signal';
          KG_Chat_Empowerment.messageSettings.messageNotificationState = 'beep';
          KG_Chat_Empowerment.messageSettings.messageNotificationTitle = 'Notify with beep signal';
          break;
        case 'beep':
          this.id = 'voice';
          this.title = 'Notify with voice API';
          KG_Chat_Empowerment.messageSettings.messageNotificationState = 'voice';
          KG_Chat_Empowerment.messageSettings.messageNotificationTitle = 'Notify with voice API';
          break;
        case 'voice':
          this.id = 'silence';
          this.title = 'Do not disturb';
          KG_Chat_Empowerment.messageSettings.messageNotificationState = 'silence';
          KG_Chat_Empowerment.messageSettings.messageNotificationTitle = 'Do not disturb';
          break;
      }
      // Stringify KG_Chat_Empowerment before updating in localStorage
      localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));

      updateSoundSwitcherIcon();
    }
  });

  function updateSoundSwitcherIcon() {
    switch (soundSwitcher.id) {
      case 'silence':
        soundSwitcherIcon.innerHTML = iconSoundSilence;
        break;
      case 'beep':
        soundSwitcherIcon.innerHTML = iconSoundBeep;
        break;
      case 'voice':
        soundSwitcherIcon.innerHTML = iconSoundVoice;
        break;
    }
  } updateSoundSwitcherIcon();

  // This function combines the results of the above functions to return an object
  // with both the speed and pitch percentages as strings with a "%" sign appended.
  function getVoiceSettingsPercentage() {
    const speedPercent = ((voiceSpeed - minVoiceSpeed) / (maxVoiceSpeed - minVoiceSpeed)) * 100;
    const pitchPercent = ((voicePitch - minVoicePitch) / (maxVoicePitch - minVoicePitch)) * 100;

    return {
      speed: `${speedPercent}%`,
      pitch: `${pitchPercent}%`,
    };
  }

  // Function to assign common styles for voice speed and pitch elements
  function assignVoiceSettingsStyles(voiceSettings) {
    voiceSettings.style.position = 'absolute';
    voiceSettings.style.top = '65px';
    voiceSettings.style.right = '70px';
    voiceSettings.style.opacity = 0;
    voiceSettings.style.transition = 'opacity 0.3s ease';
    voiceSettings.style.fontFamily = 'Orbitron, sans-serif';
  }

  /*
  * Shows the current voice speed or pitch as a span element with appropriate styles.
  * If the Ctrl key is pressed, displays the current voice speed.
  * If the Alt key is pressed, displays the current voice pitch.
  */
  function showVoiceSettings() {
    let voiceSettings = document.querySelector('.voice-settings');
    let currentVoiceSpeed = document.querySelector('.current-voice-speed');
    let currentVoicePitch = document.querySelector('.current-voice-pitch');

    if (isCtrlKeyPressed) {
      // Create voiceSettings if it doesn't exist
      if (!voiceSettings) {
        voiceSettings = document.createElement('div');
        voiceSettings.classList.add('voice-settings');
        soundSwitcher.appendChild(voiceSettings);
        assignVoiceSettingsStyles(voiceSettings);
        void voiceSettings.offsetWidth;
        voiceSettings.style.opacity = '1';
      }

      // Remove currentVoicePitch if it exists
      if (currentVoicePitch) {
        currentVoicePitch.remove();
      }

      // Create currentVoiceSpeed if it doesn't exist
      if (!currentVoiceSpeed) {
        currentVoiceSpeed = document.createElement('span');
        currentVoiceSpeed.classList.add('current-voice-speed');
        voiceSettings.appendChild(currentVoiceSpeed);
      }

      // Create progress text info
      let voiceSpeedInfo = voiceSettings.querySelector('.current-voice-speed .voice-value-info');
      if (!voiceSpeedInfo) {
        voiceSpeedInfo = document.createElement('span');
        voiceSpeedInfo.classList.add('voice-value-info');
        voiceSettings.querySelector('.current-voice-speed').appendChild(voiceSpeedInfo);
        voiceSpeedInfo.style.display = 'flex';
        voiceSpeedInfo.style.width = '100%';
        voiceSpeedInfo.style.justifyContent = 'center';
        voiceSpeedInfo.style.marginBottom = '6px';
        voiceSpeedInfo.style.color = 'hsl(100, 50%, 50%)';
      }

      if (voiceSpeedInfo) {
        // Set the text content of voiceSpeed
        if (voiceSpeed <= minVoiceSpeed || voiceSpeed >= maxVoiceSpeed) {
          voiceSpeedInfo.innerHTML = iconRangeisOut;
        } else {
          voiceSpeedInfo.innerHTML = voiceSpeed.toFixed(1);
        }
      }

      // Create a new progress element if it doesn't exist
      let voiceSpeedProgress = voiceSettings.querySelector('.current-voice-speed .voice-progress');
      if (!voiceSpeedProgress) {
        voiceSpeedProgress = document.createElement('span');
        voiceSpeedProgress.classList.add('voice-progress');
        // Create the progress fill element
        let fill = document.createElement('span');
        fill.classList.add('voice-progress-fill');
        // Append the fill element to the progress element
        voiceSpeedProgress.appendChild(fill);
        // Append the progress element to the voice settings element
        voiceSettings.querySelector('.current-voice-speed').appendChild(voiceSpeedProgress);
      }

      // Update progress fill width based on voice pitch percentage
      voiceSpeedProgress.querySelector('.voice-progress-fill').style.width = getVoiceSettingsPercentage().speed;

      // Apply styles to the progress and fill elements
      const progressStyle = {
        display: 'block',
        width: '120px',
        height: '12px',
        backgroundColor: 'hsl(90, 60%, 30%)',
        borderRadius: '6px'
      };

      const fillStyle = {
        display: 'block',
        height: '100%',
        backgroundColor: 'hsl(90, 60%, 50%)',
        borderRadius: '6px'
      };

      for (let property in progressStyle) {
        voiceSpeedProgress.style[property] = progressStyle[property];
      }

      for (let property in fillStyle) {
        voiceSpeedProgress.querySelector('.voice-progress-fill').style[property] = fillStyle[property];
      }

      // Clear any existing timeout on voiceSettings and set a new one
      if (voiceSettings.timeoutId) {
        clearTimeout(voiceSettings.timeoutId);
      }

      voiceSettings.timeoutId = setTimeout(() => {
        voiceSettings.style.opacity = '0';
        setTimeout(() => {
          voiceSettings.remove();
        }, 500);
      }, 2000);

    } else if (isAltKeyPressed) {
      // Create voiceSettings if it doesn't exist
      if (!voiceSettings) {
        voiceSettings = document.createElement('div');
        voiceSettings.classList.add('voice-settings');
        soundSwitcher.appendChild(voiceSettings);
        assignVoiceSettingsStyles(voiceSettings);
        void voiceSettings.offsetWidth;
        voiceSettings.style.opacity = '1';
      }

      // Remove currentVoiceSpeed if it exists
      if (currentVoiceSpeed) {
        currentVoiceSpeed.remove();
      }

      // Create currentVoicePitch if it doesn't exist
      if (!currentVoicePitch) {
        currentVoicePitch = document.createElement('span');
        currentVoicePitch.classList.add('current-voice-pitch');
        voiceSettings.appendChild(currentVoicePitch);
      }

      // Create progress text info
      let voicePitchInfo = voiceSettings.querySelector('.current-voice-pitch .voice-value-info');
      if (!voicePitchInfo) {
        voicePitchInfo = document.createElement('span');
        voicePitchInfo.classList.add('voice-value-info');
        voiceSettings.querySelector('.current-voice-pitch').appendChild(voicePitchInfo);
        voicePitchInfo.style.display = 'flex';
        voicePitchInfo.style.width = '100%';
        voicePitchInfo.style.justifyContent = 'center';
        voicePitchInfo.style.marginBottom = '6px';
        voicePitchInfo.style.color = 'hsl(180, 60%, 50%)';
      }

      if (voicePitchInfo) {
        // Set the text content of voicePitch
        if (voicePitch <= minVoicePitch || voicePitch >= maxVoicePitch) {
          voicePitchInfo.innerHTML = iconRangeisOut;
        } else {
          voicePitchInfo.innerHTML = voicePitch.toFixed(1);
        }
      }

      // Create a new progress element if it doesn't exist
      let pitchProgress = voiceSettings.querySelector('.current-voice-pitch .voice-progress');
      if (!pitchProgress) {
        pitchProgress = document.createElement('span');
        pitchProgress.classList.add('voice-progress');
        // Create the progress fill element
        let fill = document.createElement('span');
        fill.classList.add('voice-progress-fill');
        // Append the fill element to the progress element
        pitchProgress.appendChild(fill);
        // Append the progress element to the voice settings element
        voiceSettings.querySelector('.current-voice-pitch').appendChild(pitchProgress);
      }

      // Update progress fill width based on voice pitch percentage
      pitchProgress.querySelector('.voice-progress-fill').style.width = getVoiceSettingsPercentage().pitch;

      // Apply styles to the progress and fill elements
      const progressStyle = {
        display: 'block',
        width: '120px',
        height: '12px',
        backgroundColor: 'hsl(180, 60%, 30%)',
        borderRadius: '6px'
      };

      const fillStyle = {
        display: 'block',
        height: '100%',
        backgroundColor: 'hsl(180, 60%, 50%)',
        borderRadius: '6px'
      };

      for (let property in progressStyle) {
        pitchProgress.style[property] = progressStyle[property];
      }

      for (let property in fillStyle) {
        pitchProgress.querySelector('.voice-progress-fill').style[property] = fillStyle[property];
      }

      // Clear any existing timeout on voiceSettings and set a new one
      if (voiceSettings.timeoutId) {
        clearTimeout(voiceSettings.timeoutId);
      }

      voiceSettings.timeoutId = setTimeout(() => {
        voiceSettings.style.opacity = '0';
        setTimeout(() => {
          voiceSettings.remove();
        }, 500);
      }, 2000);

    } else {
      // If neither Ctrl nor Alt is pressed, remove voiceSettings if it exists
      if (voiceSettings) {
        voiceSettings.remove();
      }
    }
  }

  // Add event listeners for both regular click and right-click (contextmenu)
  soundSwitcher.addEventListener('click', handleVoiceChange);
  soundSwitcher.addEventListener('contextmenu', handleVoiceChange);

  // Event handler function for handling both click and right-click events
  function handleVoiceChange(event) {
    event.preventDefault(); // Prevent default context menu on right-click

    // Check if it's a left click or right click
    const isLeftClick = event.button === 0;
    const isRightClick = event.button === 2;

    // Check for Ctrl + Left Click or Ctrl + Right Click
    if ((isCtrlKeyPressed && isLeftClick) || (isCtrlKeyPressed && isRightClick)) {
      // Determine whether to change voice speed or pitch
      const prop = 'voiceSpeed';
      // Calculate new value and limit it within specified bounds
      const newValue = parseFloat(KG_Chat_Empowerment.voiceSettings[prop]) +
        (isLeftClick ? -0.1 : 0.1);
      const limitedValue = Math.min(maxVoiceSpeed, Math.max(minVoiceSpeed, newValue));
      // Update the voice setting with the limited value
      updateVoiceSetting(prop, limitedValue);
    }
    // Check for Alt + Left Click or Alt + Right Click
    else if ((isAltKeyPressed && isLeftClick) || (isAltKeyPressed && isRightClick)) {
      // Determine whether to change voice speed or pitch
      const prop = 'voicePitch';
      // Calculate new value and limit it within specified bounds
      const newValue = parseFloat(KG_Chat_Empowerment.voiceSettings[prop]) +
        (isLeftClick ? -0.1 : 0.1);
      const limitedValue = Math.min(maxVoicePitch, Math.max(minVoicePitch, newValue));
      // Update the voice setting with the limited value
      updateVoiceSetting(prop, limitedValue);
    }
  }

  // Function to update the voice setting, round the value, and update storage
  function updateVoiceSetting(prop, value) {
    // Round the value to one decimal place
    const roundedValue = parseFloat(value.toFixed(1));
    // Update the voice setting in the application state
    KG_Chat_Empowerment.voiceSettings[prop] = roundedValue;
    // Update voiceSpeed and voicePitch variables
    if (prop === 'voiceSpeed') {
      voiceSpeed = roundedValue;
    } else if (prop === 'voicePitch') {
      voicePitch = roundedValue;
    }
    // Store the updated state in localStorage
    localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));
    // Show the updated voice settings
    showVoiceSettings();
  }

  // CREATE SOUND SWITCHER BUTTON (END)


  // CREATE MESSAGE MODE BUTTON (START)

  function createMessageModeButton() {
    // Create a new element with class 'message-mode-button' and id 'every-messages'
    messageMode = document.createElement('div');
    // Retrieve the value from KG_Chat_Empowerment.messageSettings.messageModeState
    const messageModeState = KG_Chat_Empowerment.messageSettings.messageModeState || 'every-message';
    // Add the class 'message-mode-button' to the 'messagesMode' element
    messageMode.classList.add('message-mode-button');
    // Initial button id if the localStorage key isn't created with assigned value by user
    messageMode.id = messageModeState;

    // Apply base button styles
    applyBaseButtonStyles(messageMode);

    // Retrieve the value from KG_Chat_Empowerment.messageSettings.messageModeTitle
    const messageModeTitle = KG_Chat_Empowerment.messageSettings.messageModeTitle || 'Notify about every message';
    // Assign title for the current notification state
    messageMode.title = messageModeTitle;

    // Create message mode button icon container
    messageModeIcon = document.createElement('span');
    // Add class to icon container
    messageModeIcon.classList.add('message-mode-icon');

    // Append icon container inside message mode button
    messageMode.appendChild(messageModeIcon);
    // Append sound switcher button to chat buttons panel
    empowermentButtonsPanel.appendChild(messageMode);
  } createMessageModeButton();

  // Add the isAltKeyPressed condition to the messagesMode event listener
  messageMode.addEventListener('click', function (event) {
    // Only execute when isCtrlKeyPressed or isAltKeyPressed are false
    if (!isCtrlKeyPressed || !isAltKeyPressed) {

      // Add pulse effect for messageMode
      addPulseEffect(this);

      switch (this.id) {
        case 'every-message':
          this.id = 'mention-message';
          this.title = 'Notify about mention message';
          KG_Chat_Empowerment.messageSettings.messageModeState = 'mention-message';
          KG_Chat_Empowerment.messageSettings.messageModeTitle = 'Notify about mention message';
          break;
        case 'mention-message':
          this.id = 'every-message';
          this.title = 'Notify about every message';
          KG_Chat_Empowerment.messageSettings.messageModeState = 'every-message';
          KG_Chat_Empowerment.messageSettings.messageModeTitle = 'Notify about every message';
          break;
      }

      // Stringify KG_Chat_Empowerment before updating in localStorage
      localStorage.setItem('KG_Chat_Empowerment', JSON.stringify(KG_Chat_Empowerment));

      updateMessageModeIcon();
    }
  });

  function updateMessageModeIcon() {
    switch (messageMode.id) {
      case 'every-message':
        messageModeIcon.innerHTML = iconModeEvery;
        break;
      case 'mention-message':
        messageModeIcon.innerHTML = iconModeMention;
        break;
    }
  } updateMessageModeIcon();

  // CREATE MESSAGE MODE BUTTON (END)


  // CREATE USER LIST CACHE BUTTON (START)

  // Function to create the button for showCachePanel
  function createShowUserListCacheButton() {
    // Create a new element with class 'cache-panel-load-button'
    const showUserListCacheButton = document.createElement('div');

    // Add the class 'cache-panel-load-button' to the button
    showUserListCacheButton.classList.add('cache-panel-load-button');

    // Apply base button styles
    applyBaseButtonStyles(showUserListCacheButton);

    // Add cache-specific styles directly
    showUserListCacheButton.style.position = 'relative';
    showUserListCacheButton.style.zIndex = '3';

    // Add data base icon to the button
    showUserListCacheButton.innerHTML = iconUserlistCache;

    // Create the small indicator for user count
    const userCount = document.createElement('div');
    userCount.classList.add('user-count');
    userCount.style.display = 'flex';
    userCount.style.position = 'absolute';
    userCount.style.justifyContent = 'center';
    userCount.style.alignItems = 'center';
    userCount.style.left = '0';
    userCount.style.bottom = '0';
    userCount.style.transform = 'translate(-50%, 50%)';
    userCount.style.zIndex = '1';
    userCount.style.height = '20px';
    userCount.style.padding = '0 4px';
    userCount.style.setProperty('border-radius', '2px', 'important');
    userCount.style.backgroundColor = '#9db380';
    userCount.style.color = 'rgb(2, 2, 2)';
    userCount.style.fontSize = '12px';
    userCount.style.fontFamily = 'Roboto';
    userCount.style.fontWeight = 'bold';

    // Initially set the count based on localStorage
    const fetchedUsers = JSON.parse(localStorage.getItem('fetchedUsers')) || {};
    const userCountValue = Object.keys(fetchedUsers).length;
    userCount.textContent = userCountValue;

    showUserListCacheButton.appendChild(userCount);

    // Assign a title to the button
    showUserListCacheButton.title = 'Show Cache Panel';

    // Add a click event listener to the button
    showUserListCacheButton.addEventListener('click', function () {

      // Add pulse effect for cacheButton
      addPulseEffect(showUserListCacheButton);

      // Call showCachePanel function to show the cache panel
      showCachePanel();
    });

    // Append the button to the existing panel
    empowermentButtonsPanel.appendChild(showUserListCacheButton);
  } createShowUserListCacheButton();

  // Function to update the user count displayed near the cache button based on localStorage
  function updateUserCountText() {
    const userCountElement = document.querySelector('.cache-panel-load-button .user-count');
    if (!userCountElement) return; // Ensure the element exists

    const newUserCount = Object.keys(JSON.parse(localStorage.getItem('fetchedUsers')) || {}).length.toString();

    // Update the text content and add pulse effect if the count has changed
    if (newUserCount !== userCountElement.textContent) {
      userCountElement.textContent = newUserCount;
      addPulseEffect(userCountElement);
    }
  }

  // CREATE USER LIST CACHE BUTTON (END)


  // CREATE PERSONAL MESSAGES BUTTON (START)

  // Function to create the button for opening personal messages
  function createPersonalMessagesButton() {
    // Create a new element with class 'personal-messages-button'
    const showPersonalMessagesButton = document.createElement('div');
    showPersonalMessagesButton.classList.add('personal-messages-button');

    // Apply base button styles
    applyBaseButtonStyles(showPersonalMessagesButton);

    // Add personal messages-specific styles
    showPersonalMessagesButton.style.position = 'relative';
    showPersonalMessagesButton.style.zIndex = '2';
    showPersonalMessagesButton.innerHTML = iconPersonalMessages; // Add icon

    // Create the small indicator for all message count
    const allMessageIndicator = createMessageCountIndicator('total-message-count', '#fa8072');
    const personalMessages = JSON.parse(localStorage.getItem('personalMessages')) || {};
    allMessageIndicator.textContent = Object.keys(personalMessages).length;

    // Position the all message count to the left
    allMessageIndicator.style.left = '0';
    allMessageIndicator.style.transform = 'translate(-50%, 50%)';
    showPersonalMessagesButton.appendChild(allMessageIndicator);

    // Create the small indicator for new message count
    const newMessageIndicator = createMessageCountIndicator('new-message-count', '#ffd700');

    // Get the new messages count from localStorage or set to 0 if not present
    let newMessagesCount = Number(localStorage.getItem('newMessagesCount')) || (localStorage.setItem('newMessagesCount', '0'), 0);

    newMessageIndicator.textContent = newMessagesCount;

    // Check the newMessagesCount value and set visibility
    newMessageIndicator.style.visibility = newMessagesCount > 0 ? 'visible' : 'hidden'; // Set visibility based on count

    // Position the new message count to the right
    newMessageIndicator.style.right = '0';
    newMessageIndicator.style.transform = 'translate(50%, 50%)';
    showPersonalMessagesButton.appendChild(newMessageIndicator);

    // Assign a title to the button
    showPersonalMessagesButton.title = 'Show Personal Messages';

    // Add a click event listener to the button
    showPersonalMessagesButton.addEventListener('click', function () {
      addPulseEffect(showPersonalMessagesButton); // Add pulse effect
      const personalMessagesCount = Object.keys(JSON.parse(localStorage.getItem('personalMessages')) || {}).length;
      // Open the personal messages panel only when there are messages present.
      if (personalMessagesCount > 0) {
        showPersonalMessagesPanel(); // Show the personal messages panel
        // Reset newMessagesCount in localStorage to 0 when opening the panel
        localStorage.setItem('newMessagesCount', '0');
        newMessagesCount = 0; // Reset the local variable
        newMessageIndicator.textContent = newMessagesCount; // Update the displayed count
      }
    });

    // Append the button to the existing panel
    empowermentButtonsPanel.appendChild(showPersonalMessagesButton);
  }

  // Helper function to create a message count indicator
  function createMessageCountIndicator(className, backgroundColor) {
    const messageCount = document.createElement('div');
    messageCount.classList.add(className);
    messageCount.style.display = 'flex';
    messageCount.style.position = 'absolute';
    messageCount.style.justifyContent = 'center';
    messageCount.style.alignItems = 'center';
    messageCount.style.height = '20px'; // Fixed height for all indicators
    messageCount.style.padding = '0 4px';
    messageCount.style.setProperty('border-radius', '2px', 'important');
    messageCount.style.backgroundColor = backgroundColor;
    messageCount.style.color = 'rgb(2, 2, 2)';
    messageCount.style.fontSize = '12px';
    messageCount.style.fontFamily = 'Roboto';
    messageCount.style.fontWeight = 'bold';
    messageCount.style.bottom = '0'; // Common bottom positioning for both indicators
    return messageCount;
  }

  // Call the function to create the button
  createPersonalMessagesButton();

  // Find chat message by time in range and matching username
  async function findChatMessage(targetTime, targetUsername, allowScroll) {
    const parent = document.querySelector('.messages-content'); // Chat container
    if (!parent) return null; // Return null if the container isn't found

    // Convert time string "[HH:MM:SS]" to total seconds
    const timeStringToSeconds = (str) =>
      str.replace(/[\[\]]/g, '').split(':').reduce((acc, time, i) =>
        acc + Number(time) * (60 ** (2 - i)), 0
      );

    const initialTimeValue = timeStringToSeconds(targetTime); // Target time in seconds

    // Helper to find <p> elements by matching time and username
    const findMatchingElement = (condition) =>
      Array.from(parent.querySelectorAll('p')).find((p) => {
        const timeElement = p.querySelector('.time'); // Get the child element with class 'time'
        const usernameElement = p.querySelector('.username span[data-user]'); // Get the username element

        if (timeElement && usernameElement) {
          const currentTimeValue = timeStringToSeconds(timeElement.textContent.trim());
          const usernameText = usernameElement.textContent.trim(); // Extract the text content of the username

          // Check if the time and username match the conditions
          return condition(currentTimeValue) && usernameText === targetUsername;
        }
        return false;
      });

    // 1. Try to find an exact match first
    let foundElement = findMatchingElement(
      (currentTimeValue) => currentTimeValue === initialTimeValue
    );

    // 2. If no exact match, search within ±2 seconds
    if (!foundElement) {
      foundElement = findMatchingElement(
        (currentTimeValue) => Math.abs(currentTimeValue - initialTimeValue) <= 2
      );
    }

    if (foundElement && allowScroll) {
      await scrollMessagesToMiddle(parent, foundElement); // Call the extracted scrolling function
    }

    return foundElement || false; // Return found element or false if not found
  }

  /**
   * Adjusts a given time to Moscow time.
   *
   * @param {string} inputTime - The time string in "HH:MM:SS" format to adjust.
   * @returns {string} - The adjusted time in "HH:MM:SS" format.
   */
  function calibrateToMoscowTime(inputTime) {
    // Get the system's current timezone offset in minutes (negative for UTC+)
    const systemOffset = new Date().getTimezoneOffset();

    // Moscow's timezone offset is UTC+3, so it's -180 minutes
    const moscowOffset = -180;

    // Calculate the difference between the system timezone and Moscow's timezone
    const difference = systemOffset - moscowOffset;

    // Split the input time string (HH:MM:SS) and convert to numbers
    const [hours, minutes, seconds] = inputTime.split(':').map(Number);

    // Create a new Date object and set the hours, minutes, and seconds based on the input time
    const inputDate = new Date();
    inputDate.setHours(hours, minutes, seconds, 0);

    // Adjust the input time by the calculated time difference in milliseconds
    const adjustedTime = new Date(inputDate.getTime() + difference * 60000);

    // Format the adjusted time in HH:MM:SS format and return as a string
    return `${String(adjustedTime.getHours()).padStart(2, '0')}:` +
      `${String(adjustedTime.getMinutes()).padStart(2, '0')}:` +
      `${String(adjustedTime.getSeconds()).padStart(2, '0')}`;
  }

  // Function to display the personal messages panel
  function showPersonalMessagesPanel() {
    // Remove any previous panel before creating a new one
    removePreviousPanel();
    // Check if the cached messages panel already exists
    if (document.querySelector('.cached-messages-panel')) return;

    // Reset the new messages indicator to 0
    const newMessagesCountElement = document.querySelector('.personal-messages-button .new-message-count');
    if (newMessagesCountElement) newMessagesCountElement.textContent = '0';
    newMessagesCountElement.style.visibility = 'hidden';
    // Remove the localStorage key for new personal messages after opening the messages panel (always)
    localStorage.removeItem('newMessagesCount');

    // Get data from localStorage
    const cachedMessagesData = localStorage.getItem('personalMessages');

    // Initialize messages by parsing fetched data or setting as empty array
    let messages = JSON.parse(cachedMessagesData) || [];

    // Create a container div with class 'cached-messages-panel'
    const cachedMessagesPanel = document.createElement('div');
    cachedMessagesPanel.className = 'cached-messages-panel popup-panel';
    // Set initial styles
    cachedMessagesPanel.style.opacity = '0';
    cachedMessagesPanel.style.backgroundColor = '#1b1b1b';
    cachedMessagesPanel.style.setProperty('border-radius', '0.6em', 'important');
    cachedMessagesPanel.style.position = 'fixed';
    cachedMessagesPanel.style.top = '100px';
    cachedMessagesPanel.style.left = '50%';
    cachedMessagesPanel.style.transform = 'translateX(-50%)';
    cachedMessagesPanel.style.width = '50vw';
    cachedMessagesPanel.style.height = '80vh';
    cachedMessagesPanel.style.zIndex = '999';
    cachedMessagesPanel.style.minWidth = '1000px';

    // Create a container div for the panel header
    const panelHeaderContainer = document.createElement('div');
    panelHeaderContainer.className = 'panel-header';
    panelHeaderContainer.style.display = 'flex';
    panelHeaderContainer.style.flexDirection = 'row';
    panelHeaderContainer.style.justifyContent = 'flex-end'; // Aligns to the right
    panelHeaderContainer.style.padding = '0.6em';

    // Create the search input container and append it to the panel header
    const messagesSearchContainer = document.createElement('div');
    messagesSearchContainer.className = 'search-for-personal-messages';
    messagesSearchContainer.style.width = '100%';
    messagesSearchContainer.style.margin = '0 20px';
    messagesSearchContainer.style.display = 'flex';

    // Create the input field for searching personal messages
    const messagesSearchInput = document.createElement('input');
    messagesSearchInput.className = 'personal-messages-search-input';
    messagesSearchInput.type = 'text';
    messagesSearchInput.style.outline = 'none';
    messagesSearchInput.style.width = '100%';
    messagesSearchInput.style.padding = '10px';
    messagesSearchInput.style.margin = '0 1em';
    messagesSearchInput.style.fontSize = '1em';
    messagesSearchInput.style.fontFamily = 'Montserrat';
    messagesSearchInput.style.color = 'bisque';
    messagesSearchInput.style.setProperty('border-radius', '0.2em', 'important');
    messagesSearchInput.style.boxSizing = 'border-box';
    messagesSearchInput.style.backgroundColor = '#111';
    messagesSearchInput.style.border = '1px solid #222';

    // Append the search input to the search container
    messagesSearchContainer.appendChild(messagesSearchInput);

    // Create a container div with class 'panel-control-buttons'
    const panelControlButtons = document.createElement('div');
    panelControlButtons.className = 'panel-control-buttons';
    panelControlButtons.style.display = 'flex';

    // Helper function to apply common styles to a button
    function applyHeaderButtonStyles(button, backgroundColor, margin = '0 0.5em') {
      button.style.backgroundColor = backgroundColor;
      button.style.width = '48px';
      button.style.height = '48px';
      button.style.display = 'flex';
      button.style.justifyContent = 'center';
      button.style.alignItems = 'center';
      button.style.cursor = 'pointer';
      button.style.setProperty('border-radius', '0.2em', 'important');
      button.style.margin = margin; // Set margin using the provided value
      button.style.filter = 'brightness(1)';
      button.style.transition = 'filter 0.3s ease';
    }

    // Create a copy personal messages button element
    const copyPersonalMessagesButton = document.createElement('div');
    copyPersonalMessagesButton.className = 'copy-personal-messages-button';
    // Set the inner HTML of the copy personal messages button element with the clipboard SVG
    copyPersonalMessagesButton.innerHTML = clipboardSVG;
    copyPersonalMessagesButton.title = 'Copy Personal Messages';
    // Apply common styles to the button element
    applyHeaderButtonStyles(copyPersonalMessagesButton, 'steelblue');

    // Event listener to copy the text content of the messages container
    copyPersonalMessagesButton.addEventListener('click', () => {
      addJumpEffect(copyPersonalMessagesButton, 0, 0);
      const textContent = Array.from(document.querySelector('.messages-container').children)
        .filter(node => window.getComputedStyle(node).display !== 'none') // Ignore hidden messages
        .map(node => node.classList.contains('date-item') ? node.textContent.trim() :
          [node.querySelector('.message-time'), node.querySelector('.message-username'), node.querySelector('.message-text')]
            .map(el => el?.textContent.trim()).filter(Boolean).join(' '))
        .filter(Boolean).join(' \n');

      // Copy to clipboard
      navigator.clipboard.writeText(textContent).catch(console.error);
    });

    // Create a clear cache button with the provided SVG icon
    const clearCacheButton = document.createElement('div');
    clearCacheButton.className = 'clear-cache-button';
    clearCacheButton.title = 'Clear personal messages';
    clearCacheButton.innerHTML = trashSVG;
    applyHeaderButtonStyles(clearCacheButton, 'brown');

    // Add a click event listener to the clear cache button
    clearCacheButton.addEventListener('click', () => {
      // Clear the messages container
      messagesContainer.innerHTML = null;

      // Set the 'personalMessages' key in localStorage to an empty object
      localStorage.setItem('personalMessages', JSON.stringify({}));

      // Fade out the cached messages panel when the clear cache button is clicked
      fadeTargetElement(cachedMessagesPanel, 'hide');
      fadeDimmingElement('hide');

      // Update the message count displayed in the personal messages button
      const messagesCountElement = document.querySelector('.personal-messages-button .total-message-count');
      if (messagesCountElement) messagesCountElement.textContent = '0';
    });

    // Create a close button with the provided SVG icon
    const closePanelButton = document.createElement('div');
    closePanelButton.className = 'close-panel-button';
    closePanelButton.title = 'Close panel';
    closePanelButton.innerHTML = closeSVG;
    applyHeaderButtonStyles(closePanelButton, 'darkolivegreen', '0 0 0 0.5em');

    // Add a click event listener to the close panel button
    closePanelButton.addEventListener('click', () => {
      // Fade out the cached messages panel when the close button is clicked
      fadeTargetElement(cachedMessagesPanel, 'hide');
      fadeDimmingElement('hide');
    });

    // Create an array containing the buttons we want to apply the events to
    const buttons = [clearCacheButton, closePanelButton];

    // Iterate through each button in the array
    buttons.forEach(button => {
      // Add a mouseover event listener to change the button's brightness on hover
      button.addEventListener('mouseover', () => {
        button.style.filter = 'brightness(0.8)'; // Dim the button
      });

      // Add a mouseout event listener to reset the button's brightness when not hovered
      button.addEventListener('mouseout', () => {
        button.style.filter = 'brightness(1)'; // Reset to original brightness
      });
    });

    // Append the search container to the panel header container
    panelHeaderContainer.appendChild(messagesSearchContainer);

    panelControlButtons.appendChild(copyPersonalMessagesButton);

    // Append the clear cache button to the panel header container
    panelControlButtons.appendChild(clearCacheButton);

    // Append the close button to the panel control buttons
    panelControlButtons.appendChild(closePanelButton);

    // Append the panel control buttons element inside the panel header container
    panelHeaderContainer.appendChild(panelControlButtons);

    // Append the header to the cached messages panel
    cachedMessagesPanel.appendChild(panelHeaderContainer);

    // Create a container for the messages
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'messages-container';
    messagesContainer.style.overflowY = 'auto'; // Enable scrolling for messages
    messagesContainer.style.height = 'calc(100% - 70px)'; // Adjust height considering header
    messagesContainer.style.padding = '1em';

    let lastUsername = null; // Store the last username processed
    let pingCheckCounter = 0; // Initialize a counter
    let maxPingChecks = 100; // Set the limit to 100
    let pingMessages = false; // Initialize pingMessages as false
    let lastDate = null; // Store the last processed date

    const today = new Intl.DateTimeFormat('en-CA').format(new Date()); // 'en-CA' gives 'YYYY-MM-DD' format

    // Create an array to store message elements for later appending
    const messageElements = [];

    // Define messageColors and timeColors inside the loop
    const timeColors = {
      private: 'coral',
      mention: 'darkseagreen'
    };

    const messageColors = {
      private: 'coral',
      mention: 'lightsteelblue',
      default: 'slategray' // Default color if type is not private or mention
    };

    // Loop through the messages and create elements
    Object.entries(messages).forEach(([, { time, date, username, usernameColor, message, type, userId }]) => {
      // If the current date is different from the last processed one, create a new date-item
      if (lastDate !== date) {
        const dateItem = document.createElement('div');
        dateItem.className = 'date-item';
        // show "Today" if date matches
        dateItem.textContent = date === today ? 'Today ⏳' : `${date} 📅`;
        dateItem.style.position = 'relative';
        dateItem.style.font = '1em Montserrat';
        dateItem.style.color = 'burlywood';
        dateItem.style.backgroundColor = 'rgba(222, 184, 135, 0.1)';
        dateItem.style.width = 'fit-content';
        dateItem.style.margin = '2em 1em 1em';
        dateItem.style.padding = '0.4em 0.8em';
        dateItem.style.textAlign = 'center';
        dateItem.style.setProperty('border-radius', '0.4em', 'important');
        dateItem.style.left = '50%';
        dateItem.style.transform = 'translateX(-50%)';

        messagesContainer.appendChild(dateItem); // Append the date-item to the container
        lastDate = date; // Update the last processed date
      }

      // Create a message-item for the current message
      const messageElement = document.createElement('div');
      messageElement.className = 'message-item';
      messageElement.style.padding = '0.2em';

      // Add margin-top if this is the first message of a new username group
      if (username !== lastUsername) {
        messageElement.style.marginTop = '0.6em';
        lastUsername = username; // Update the lastUsername
      }

      // Remove square brackets from the time string
      const formattedTime = time.replace(/[\[\]]/g, '').trim();

      // Create time, username, and message elements
      const timeElement = document.createElement('span');
      timeElement.className = 'message-time';
      timeElement.textContent = formattedTime;
      timeElement.title = `Moscow Time: ${calibrateToMoscowTime(formattedTime)}`;
      timeElement.style.margin = '0px 0.4em';
      timeElement.style.height = 'fit-content';

      timeElement.style.color = timeColors[type] || 'slategray';

      // Add click event listener for "mention" type
      if (type === 'mention') {
        timeElement.style.cursor = 'pointer';
        timeElement.style.transition = 'color 0.2s ease';

        // Hover effect to change color
        timeElement.addEventListener('mouseover', function () {
          timeElement.style.color = 'lightgreen';
        });

        timeElement.addEventListener('mouseout', function () {
          timeElement.style.color = timeColors[type];
        });

        // Open the chat log URL on click from personal messages panel
        timeElement.addEventListener('click', function () {
          const url = `https://klavogonki.ru/chatlogs/${date}.html#${calibrateToMoscowTime(formattedTime)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        });
      }

      const usernameElement = document.createElement('span');
      usernameElement.className = 'message-username';
      usernameElement.textContent = username;
      usernameElement.style.color = usernameColor;
      usernameElement.style.display = 'inline-flex';
      usernameElement.style.cursor = 'pointer';
      usernameElement.style.margin = '0px 0.4em';
      usernameElement.style.height = 'fit-content';

      // Add click event only if userId is defined
      usernameElement.addEventListener('click', () => {
        if (userId) { // Check if userId is defined
          const url = `https://klavogonki.ru/u/#/${userId}/`; // Construct the user profile URL
          window.open(url, '_blank', 'noopener,noreferrer'); // Open in a new tab
        } else {
          addShakeEffect(usernameElement); // Call the shake effect if userId is not defined
        }
      });

      const messageTextElement = document.createElement('span');
      messageTextElement.className = 'message-text';
      messageTextElement.style.cursor = 'pointer'; // Pointer cursor
      messageTextElement.style.margin = '0px 0.4em';
      messageTextElement.style.height = 'fit-content';

      // Replace smiley codes with <img> tags, and then wrap links with <a> tags
      messageTextElement.innerHTML = message
        // Replace smiley codes like :word: with <img> tags
        .replace(/:(?=\w*[a-zA-Z])(\w+):/g,
          (_, word) => `<img src="/img/smilies/${word}.gif" alt=":${word}:" title=":${word}:" class="smile">`
        )
        // Wrap http and https links with <a> tags
        .replace(/(https?:\/\/[^\s]+)/gi,
          (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        );

      // Add click event listener for the messageTextElement
      messageTextElement.addEventListener('click', async function () {
        if (isCtrlKeyPressed) {
          // Remove the message-item from the DOM
          messageElement.remove();
          // Construct the localStorage data selector for personal messages data
          const time = messageElement.querySelector('.message-time').textContent;
          const username = messageElement.querySelector('.message-username').textContent;

          // Construct the message key for personal messages data
          const messageKey = `[${time}]_${username}`;

          // Retrieve localStorage personalMessages data
          const personalMessages = JSON.parse(localStorage.getItem('personalMessages')) || {};

          // Check if the message exists in personalMessages
          if (personalMessages[messageKey]) {
            // Remove the message from the personalMessages object
            delete personalMessages[messageKey];
            // Update the localStorage personalMessages data
            localStorage.setItem('personalMessages', JSON.stringify(personalMessages));
            // Update the total message count displayed in the personal messages button
            const messagesCountElement = document.querySelector('.personal-messages-button .total-message-count');
            if (messagesCountElement) {
              messagesCountElement.textContent = Number(messagesCountElement.textContent) - 1;
            }
          }

          return; // Exit the function
        }

        // Call the function to search for the chat message by time in range and username
        const foundMessage = await findChatMessage(time, username, true);
        if (foundMessage) {
          // Fade out the cached messages panel if the message is found
          fadeTargetElement(cachedMessagesPanel, 'hide');
          fadeDimmingElement('hide');
        } else {
          // Add shake effect to the parent if no message is found
          addShakeEffect(messageTextElement.parentElement);
        }
      });

      // Store elements for (pingable messages) colorization after all processing
      const messageData = {
        messageTextElement,
        time,
        username,
        type
      };

      // Add messageData to the array for later processing
      messageElements.push(messageData);

      // Append time, username, and message to the message element
      messageElement.appendChild(timeElement);
      messageElement.appendChild(usernameElement);
      messageElement.appendChild(messageTextElement);

      // Append the message element to the messages container
      messagesContainer.appendChild(messageElement);
    });

    requestAnimationFrame(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll after next repaint
      // Convert image links to clickable thumbnail previews and embed YouTube videos as iframes for personal messages
      convertImageLinksToImage('personalMessages');
      convertYoutubeLinksToIframe('personalMessages');
      highlightMentionWords('personalMessages');
    });

    // Process the colorization logic in reverse order
    messageElements.reverse().forEach(async ({ messageTextElement, time, username, type }) => {
      if (pingCheckCounter < maxPingChecks) {
        pingMessages = await findChatMessage(time, username, false);
        pingCheckCounter++; // Increment the counter

        if (pingCheckCounter >= maxPingChecks) {
          pingMessages = false;
          console.log("Reached maximum ping checks, resetting pingMessages.");
        }
      }

      // Colorize the messageTextElement accordingly (Pingable messages)
      messageTextElement.style.color =
        pingMessages && type === 'mention' ? 'lightgreen' :
          pingMessages && type === 'private' ? 'lemonchiffon' :
            messageColors[type] || 'slategray';
    });

    // Append the messages container to the cached messages panel
    cachedMessagesPanel.appendChild(messagesContainer);

    // Append the cached messages panel to the body
    document.body.appendChild(cachedMessagesPanel);

    // Fade in the cached messages panel
    fadeTargetElement(cachedMessagesPanel, 'show');
    // Show the dimming background
    fadeDimmingElement('show');

    // Add click event listener to clear the search input by LMB click with Ctrl key pressed
    messagesSearchInput.addEventListener('click', () => isCtrlKeyPressed && (messagesSearchInput.value = ''));

    // Event listener to handle input search for matching personal messages
    // It searches through messages grouped by date and displays the corresponding date
    // Only if there are matching messages in that group.
    messagesSearchInput.addEventListener('input', () => {
      const query = messagesSearchInput.value.toLowerCase().replace(/_/g, ' ');

      messagesContainer.querySelectorAll('.date-item').forEach(dateEl => {
        let showDateForGroup = false;
        let nextEl = dateEl.nextElementSibling;

        // Iterate through messages in the current group (until the next date item)
        while (nextEl && !nextEl.classList.contains('date-item')) {
          const match = (nextEl.querySelector('.message-time')?.textContent.toLowerCase().replace(/_/g, ' ') + ' ' +
            nextEl.querySelector('.message-username')?.textContent.toLowerCase().replace(/_/g, ' ') + ' ' +
            nextEl.querySelector('.message-text')?.textContent.toLowerCase().replace(/_/g, ' ')).includes(query);

          nextEl.style.display = match ? '' : 'none';
          showDateForGroup = showDateForGroup || match; // Show date if any match found in the group

          nextEl = nextEl.nextElementSibling;
        }

        dateEl.style.display = showDateForGroup ? '' : 'none'; // Show or hide the date based on the match results in the group
      });
    });

    // Focus on the search input using requestAnimationFrame
    function focusOnSearchField() { requestAnimationFrame(function () { messagesSearchInput.focus(); }); } focusOnSearchField();

    // Attach a keydown event listener to the document object
    document.addEventListener('keydown', function (event) {
      // Check if the key pressed was the "Escape" key
      if (event.key === 'Escape') {
        // Fade out the cached messages panel
        fadeTargetElement(cachedMessagesPanel, 'hide');
        fadeDimmingElement('hide');
      }
    });
  }

  // Initialize previousTotalCount with the current personal messages count from localStorage
  let previousTotalCount =
    (localStorage.personalMessages && Object.keys(JSON.parse(localStorage.personalMessages)).length) || 0;

  /**
   * Updates total and new personal message counts near the personal messages button.
   * - Increments new message count only when total message count increases.
   * - Manages visibility and pulse effects for the new message indicator.
   */
  function updatePersonalMessageCounts() {
    const totalCountElement = document.querySelector('.personal-messages-button .total-message-count');
    const newCountElement = document.querySelector('.personal-messages-button .new-message-count');
    if (!totalCountElement || !newCountElement) return; // Exit if elements are missing

    const personalMessages = JSON.parse(localStorage.getItem('personalMessages')) || {};
    const totalCount = Object.keys(personalMessages).length;

    let newCount = Number(localStorage.getItem('newMessagesCount')) || 0;
    if (totalCount > previousTotalCount) {
      newCount++;
      localStorage.setItem('newMessagesCount', newCount);
      addPulseEffect(newCountElement); // Apply pulse effect for new messages
      addJumpEffect(newCountElement); // Apply jump effect for new messages
    }

    // Update counts in the UI
    totalCountElement.textContent = totalCount;
    newCountElement.textContent = newCount;

    // Manage visibility of the new message indicator
    newCountElement.style.visibility = newCount > 0 ? 'visible' : 'hidden';

    // Apply pulse effect if total count changes
    if (totalCount !== previousTotalCount) addPulseEffect(totalCountElement);

    previousTotalCount = totalCount; // Update previous count
  }

  // CREATE PERSONAL MESSAGES BUTTON (END)


  // CREATE CHAT LOGS BUTTON (START)

  // Function to create the button for opening chat logs
  function createChatLogsButton() {
    const showChatLogsButton = document.createElement('div');
    showChatLogsButton.classList.add('chat-logs-button');

    // Apply base button styles
    applyBaseButtonStyles(showChatLogsButton);

    showChatLogsButton.style.position = 'relative';
    showChatLogsButton.style.zIndex = '1';
    showChatLogsButton.innerHTML = iconChatLogs; // Add icon

    showChatLogsButton.title = 'Show Chat Logs';

    showChatLogsButton.addEventListener('click', function () {
      addPulseEffect(showChatLogsButton); // Add pulse effect
      showChatLogsPanel();
    });

    empowermentButtonsPanel.appendChild(showChatLogsButton);
  }

  // Call the function to create the button
  createChatLogsButton();

  // Function to fetch chat logs from the specified URL for a given date
  const fetchChatLogs = async (date, messagesContainer) => {
    // Clear the messagesContainer if it exists
    messagesContainer && (messagesContainer.innerHTML = '');

    // Format date to 'YYYY-MM-DD'
    const formattedDate = new Intl.DateTimeFormat('en-CA').format(new Date(date));

    // Generate a random 20-digit number
    const randomParam = Math.floor(Math.random() * 10 ** 20);

    // Construct the URL to fetch chat logs for the specified date with the random parameter
    const url = `https://klavogonki.ru/chatlogs/${formattedDate}.html?rand=${randomParam}`;

    // Function to parse the HTML and extract chat log entries
    const parseChatLog = (html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      return [...doc.querySelectorAll('.ts')].map((timeElement) => {
        const usernameElement = timeElement.nextElementSibling;
        const messageNode = usernameElement?.nextSibling;

        const extractMessageText = (node) => {
          if (!node) return '';
          return [...node.childNodes].reduce((acc, child) => {
            if (child.nodeType === Node.TEXT_NODE) {
              acc += child.textContent;
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              if (child.tagName === 'A') {
                acc += child.textContent;
              } else if (child.tagName === 'BR') {
                return acc;
              }
            }
            return acc;
          }, '').trim();
        };

        if (usernameElement?.classList.contains('mn') && messageNode) {
          let messageText = '';

          if (messageNode.nodeType === Node.ELEMENT_NODE) {
            messageText = extractMessageText(messageNode);
          } else if (messageNode.nodeType === Node.TEXT_NODE) {
            const nextSibling = usernameElement.nextElementSibling;
            if (nextSibling && nextSibling.tagName === 'A') {
              messageText = `${messageNode.textContent.trim()} ${nextSibling.textContent.trim()}`;
            } else {
              messageText = messageNode.textContent.trim();
            }
          }

          if (!messageText) {
            const combinedText = extractMessageText(usernameElement.nextSibling);
            messageText = combinedText;
          }

          return {
            time: timeElement.textContent.trim().replace(/[\[\]]/g, ''),
            username: usernameElement.textContent.trim().replace(/<|>/g, ''),
            message: messageText || null,
          };
        }

        // Handle case where username is not found, and instead, `mne` class is present (system message)
        const systemMessageElement = timeElement.nextElementSibling;
        if (systemMessageElement && systemMessageElement.classList.contains('mne')) {
          // Extract the text directly from the <font> element
          const messageText = systemMessageElement.textContent.trim();
          return {
            time: timeElement.textContent.trim().replace(/[\[\]]/g, ''),
            username: 'Клавобот', // Assign 'Клавобот' for system messages
            message: messageText || null,
          };
        }

        return null;
      }).filter(Boolean);
    };

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');

      const html = await response.text();
      return { chatlogs: parseChatLog(html), url }; // Return chat logs and the URL
    } catch (error) {
      console.error('Fetch error:', error);
      return { chatlogs: [] }; // Return an empty array in case of an error
    }
  };


  function getRandomDateInRange() {
    const startDate = new Date('2012-02-12'); // Start date
    const endDate = new Date(); // Current date

    // Calculate the difference in milliseconds
    const dateDifference = endDate - startDate;

    // Generate a random number of milliseconds between 0 and dateDifference
    const randomMilliseconds = Math.floor(Math.random() * dateDifference);

    // Create a random date by adding the random milliseconds to the start date
    const randomDate = new Date(startDate.getTime() + randomMilliseconds);

    // Format the date to 'YYYY-MM-DD' using Intl.DateTimeFormat
    const formattedDate = new Intl.DateTimeFormat('en-CA').format(randomDate);

    return formattedDate;
  }

  // Function to get user ID by username (with caching in localStorage)
  async function getUserId(username) {
    const userIdsCache = JSON.parse(localStorage.getItem('userIdsCache') || '{}');

    // If the user ID is cached, return it
    if (userIdsCache[username]) return userIdsCache[username];

    try {
      // Fetch the user ID
      const [userId] = await getUserIdByName(username);
      if (userId) {
        userIdsCache[username] = userId;
        localStorage.setItem('userIdsCache', JSON.stringify(userIdsCache));
        return userId;
      }
    } catch (error) {
      console.error(`Error fetching user ID for ${username}:`, error);
    }

    return null; // Return null if no user found
  }

  let visibleMentionMessages = false; // Initialize the visibility state of mention messages
  // Toggles the visibility of .message-item elements that do not contain a .mention child element
  async function toggleMentionVisibility() {
    visibleMentionMessages = !visibleMentionMessages; // Toggle the global state
    console.log(visibleMentionMessages); // Debug log

    document.querySelectorAll('.message-item').forEach(item => {
      if (item.querySelector('.mention')) return;
      item.style.display = visibleMentionMessages ? 'none' : '';
    });
  }

  // Function to display the chat logs panel
  async function showChatLogsPanel() {
    // Remove any previous panel before creating a new one
    removePreviousPanel();
    // Check if the chat logs panel already exists; if it does, exit the function to avoid duplication
    if (document.querySelector('.chat-logs-panel')) return;

    // Create a container div with class 'chat-logs-panel'
    const chatLogsPanel = document.createElement('div');
    chatLogsPanel.className = 'chat-logs-panel popup-panel';

    // Set initial styles for the chat logs panel
    chatLogsPanel.style.opacity = '0';
    chatLogsPanel.style.backgroundColor = '#1b1b1b';
    chatLogsPanel.style.setProperty('border-radius', '0.6em', 'important');
    chatLogsPanel.style.position = 'fixed';
    chatLogsPanel.style.top = '100px';
    chatLogsPanel.style.left = '50%';
    chatLogsPanel.style.transform = 'translateX(-50%)';
    chatLogsPanel.style.width = '80vw';
    chatLogsPanel.style.height = '80vh';
    chatLogsPanel.style.zIndex = '999';
    chatLogsPanel.style.minWidth = '1000px';
    chatLogsPanel.style.display = 'grid';
    chatLogsPanel.style.flexDirection = 'column';
    chatLogsPanel.style.gridTemplateColumns = '1fr';
    chatLogsPanel.style.gridTemplateRows = 'min-content';
    chatLogsPanel.style.gridTemplateAreas = `
      "header header header"
      "messages scroll-buttons users"
    `;

    // Create a container div for the panel header
    const panelHeaderContainer = document.createElement('div');
    panelHeaderContainer.className = 'panel-header';
    panelHeaderContainer.style.display = 'flex';
    panelHeaderContainer.style.flexDirection = 'row';
    panelHeaderContainer.style.gridArea = 'header';
    panelHeaderContainer.style.justifyContent = 'flex-end';
    panelHeaderContainer.style.padding = '0.6em';

    // Create a container div with class 'panel-control-buttons'
    const panelControlButtons = document.createElement('div');
    panelControlButtons.className = 'panel-control-buttons';
    panelControlButtons.style.display = 'flex';

    // Create a container div for the search input
    const chatlogsSearchContainer = document.createElement('div');
    chatlogsSearchContainer.className = 'search-for-chatlogs-messages';
    chatlogsSearchContainer.style.width = '100%';
    chatlogsSearchContainer.style.margin = '0 20px';
    chatlogsSearchContainer.style.display = 'flex';

    // Create the input field for searching users
    const chatlogsSearchInput = document.createElement('input');
    chatlogsSearchInput.className = 'chatlogs-search-input';
    chatlogsSearchInput.type = 'text';
    chatlogsSearchInput.style.outline = 'none';
    chatlogsSearchInput.style.height = '48px';
    chatlogsSearchInput.style.width = '100%';
    chatlogsSearchInput.style.padding = '10px';
    chatlogsSearchInput.style.margin = '0 1em';
    chatlogsSearchInput.style.fontSize = '1em';
    chatlogsSearchInput.style.fontFamily = 'Montserrat';
    chatlogsSearchInput.style.setProperty('color', 'bisque', 'important');
    chatlogsSearchInput.style.setProperty('border-radius', '0.2em', 'important');
    chatlogsSearchInput.style.boxSizing = 'border-box';
    chatlogsSearchInput.style.backgroundColor = '#111';
    chatlogsSearchInput.style.border = '1px solid #222';

    // Append search input to the search container
    chatlogsSearchContainer.appendChild(chatlogsSearchInput);
    // Append the search container to the panel header container
    panelHeaderContainer.appendChild(chatlogsSearchContainer);

    // Add input event listener to filter items as the user types
    chatlogsSearchInput.addEventListener('input', () => filterItems(chatlogsSearchInput.value));

    // Add click event listener to clear the search input by LMB click with Ctrl key pressed
    chatlogsSearchInput.addEventListener('click', () => isCtrlKeyPressed && (chatlogsSearchInput.value = ''));

    // Focus on the search input using requestAnimationFrame
    function focusOnSearchField() { requestAnimationFrame(function () { chatlogsSearchInput.focus(); }); } focusOnSearchField();

    // Helper function to apply common styles to a header button
    function applyHeaderButtonStyles(button, backgroundColor, margin = '0 0.5em') {
      button.style.backgroundColor = backgroundColor;
      button.style.width = '48px';
      button.style.height = '48px';
      button.style.display = 'flex';
      button.style.justifyContent = 'center';
      button.style.alignItems = 'center';
      button.style.cursor = 'pointer';
      button.style.setProperty('border-radius', '0.2em', 'important');
      button.style.margin = margin; // Set margin using the provided value
      button.style.filter = 'brightness(1)';
      button.style.transition = 'filter 0.3s ease';
    }

    // Helper function to apply common styles to a scroll button
    function applyScrollButtonStyles(button) {
      button.style.width = '48px';
      button.style.height = '48px';
      button.style.display = 'flex';
      button.style.justifyContent = 'center';
      button.style.alignItems = 'center';
      button.style.cursor = 'pointer';
      button.style.setProperty('border-radius', '0.2em', 'important');
      button.style.backgroundColor = '#282b2f';
      button.style.margin = '0.5em 0';
      button.style.filter = 'brightness(1)';
      button.style.transition = 'filter 0.3s ease';
    }

    // Create a date input toggle with similar styles as the close button
    const dateInputToggle = document.createElement('div');
    dateInputToggle.className = 'date-panel-button';
    dateInputToggle.innerHTML = calendarSVG;
    // Apply common styles using the helper function with a different background color
    applyHeaderButtonStyles(dateInputToggle, 'steelblue');
    dateInputToggle.style.margin = '0px 0.5em 0 0';

    // Function to toggle visibility of an element
    function toggleDateInputVisibility(element) {
      element.style.display = element.style.display === 'none' ? 'flex' : 'none';
    }

    // Function to show the date input if it is currently hidden
    function showDateInput(element) {
      if (element.style.display === 'none') element.style.display = 'flex';
    }

    // Toggle the visibility of the date input when the toggle is clicked
    dateInputToggle.addEventListener('click', () => {
      toggleDateInputVisibility(dateInput);
    });

    // Create the date input field
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'chatlogs-date-input';

    // Apply consistent styles
    dateInput.style.backgroundColor = '#111';
    dateInput.style.color = 'bisque';
    dateInput.style.border = '1px solid #222';
    dateInput.style.width = 'fit-content';
    dateInput.style.height = '48px';
    dateInput.style.padding = '10px';
    dateInput.style.fontSize = '1em';
    dateInput.style.fontFamily = 'Montserrat';
    dateInput.style.display = 'none'; // Hidden by default
    dateInput.style.setProperty('border-radius', '0.2em', 'important');
    dateInput.style.boxSizing = 'border-box';
    dateInput.style.margin = '0 0.5em';

    // Append the date button and input field to the control buttons container
    panelControlButtons.appendChild(dateInputToggle);
    panelControlButtons.appendChild(dateInput);

    // Create a toggle mention messages component
    const toggleMentionMessages = document.createElement('div');
    toggleMentionMessages.className = 'toggle-mention-messages';
    // Set the inner HTML of the toggle component with a suitable SVG or text
    toggleMentionMessages.innerHTML = iconPersonalMessages;
    toggleMentionMessages.title = 'Toggle Mention Messages';
    // Apply common styles to the component
    applyHeaderButtonStyles(toggleMentionMessages, 'saddlebrown');

    // Add a click event listener to toggle the visibility of messages without mentions
    toggleMentionMessages.addEventListener('click', async () => {
      await toggleMentionVisibility();
    });

    // Append the toggle mention messages component to the control panel
    panelControlButtons.appendChild(toggleMentionMessages);

    // Create a copy chatlogs button element
    const copyChatLogsUrl = document.createElement('div');
    copyChatLogsUrl.className = 'copy-current-chatlogs-url';
    // Set the inner HTML of the copy chat logs element with the clipboard SVG
    copyChatLogsUrl.innerHTML = clipboardSVG;
    copyChatLogsUrl.title = 'Copy Chat Logs Url';
    // Apply common styles to the button element
    applyHeaderButtonStyles(copyChatLogsUrl, 'steelblue');

    // Add a click event listener to copy chatLogsUrlForCopy to the clipboard
    copyChatLogsUrl.addEventListener('click', () => {
      addJumpEffect(copyChatLogsUrl, 0, 0);
      navigator.clipboard.writeText(chatLogsUrlForCopy)
        .then(() => {
          console.log('Chat logs URL copied to clipboard:', chatLogsUrlForCopy);
          // Optionally, you can provide user feedback here (e.g., show a message)
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    });

    panelControlButtons.appendChild(copyChatLogsUrl);

    // Retrieve `shouldShowActiveUsers` from localStorage or set it to 'shown' if it doesn't exist
    const shouldShowActiveUsers = localStorage.getItem('shouldShowActiveUsers') || (localStorage.setItem('shouldShowActiveUsers', 'shown'), 'shown');

    // Create a toggle active users button
    const toggleActiveUsers = document.createElement('div');
    toggleActiveUsers.className = 'toggle-active-users';
    updateActiveUsersToggle(shouldShowActiveUsers); // Set initial SVG based on stored state
    applyHeaderButtonStyles(toggleActiveUsers, '#144e9d'); // Apply common styles

    // Set initial title based on stored state
    toggleActiveUsers.title = shouldShowActiveUsers === 'shown' ? 'Hide User List' : 'Show User List';

    // Function to update the toggle button's SVG and title based on current state
    function updateActiveUsersToggle(state) {
      toggleActiveUsers.innerHTML = state === 'shown' ? toggleLeftSVG : toggleRightSVG; // Toggle between SVGs
      toggleActiveUsers.title = state === 'shown' ? 'Hide User List' : 'Show User List'; // Update title based on state
    }

    // Function to toggle active users and update localStorage, SVG, and title
    function toggleActiveUsersState() {
      const newState = localStorage.getItem('shouldShowActiveUsers') === 'shown' ? 'hidden' : 'shown'; // Determine new state
      localStorage.setItem('shouldShowActiveUsers', newState); // Update localStorage
      updateActiveUsersToggle(newState); // Update the displayed SVG and title

      if (newState === 'shown') {
        // Call renderActiveUsers to update the display of active users based on their message counts
        renderActiveUsers(usernameMessageCountMap, chatLogsPanel);
      } else {
        // Remove the active users container if the state is hidden
        const activeUsersContainer = chatLogsPanel.querySelector('.active-users');
        if (activeUsersContainer) {
          chatLogsPanel.removeChild(activeUsersContainer);
        }
      }
    }

    // Add click event to toggle active users
    toggleActiveUsers.addEventListener('click', toggleActiveUsersState);

    // Append the toggle active users to the panel control buttons
    panelControlButtons.appendChild(toggleActiveUsers);

    // Create and style the chevron left button
    const oneDayBackward = document.createElement('div');
    oneDayBackward.className = 'chevron-left-button';
    oneDayBackward.title = 'Previous Day';
    oneDayBackward.innerHTML = chevronLeftSVG; // Assuming you have chevronLeftSVG defined
    applyHeaderButtonStyles(oneDayBackward, 'darkcyan');

    // Create and style the chevron right button
    const oneDayForward = document.createElement('div');
    oneDayForward.className = 'chevron-right-button';
    oneDayForward.title = 'Next Day';
    oneDayForward.innerHTML = chevronRightSVG; // Assuming you have chevronRightSVG defined
    applyHeaderButtonStyles(oneDayForward, 'darkcyan');

    // Create and style the shuffle button
    const randomDay = document.createElement('div');
    randomDay.className = 'shuffle-button';
    randomDay.title = 'Random Date';
    randomDay.innerHTML = shuffleSVG; // Assuming you have shuffleSVG defined
    applyHeaderButtonStyles(randomDay, 'darkslateblue');

    // Function to get current date or fallback to today's date
    function getEffectiveDate() {
      return dateInput.value ? new Date(dateInput.value) : new Date(); // Use dateInput value or today's date
    }

    // Event listener for the chevron left button
    oneDayBackward.addEventListener('click', async () => {
      const currentDate = getEffectiveDate(); // Get the effective date
      currentDate.setDate(currentDate.getDate() - 1); // Go one day back
      const formattedDate = new Intl.DateTimeFormat('en-CA').format(currentDate);
      dateInput.value = formattedDate; // Update the date input
      dateInputToggle.title = `Current date: ${formattedDate}`; // Update title
      await loadChatLogs(currentDate); // Load chat logs for the updated date
      showDateInput(dateInput);
      focusOnSearchField();
    });

    // Event listener for the chevron right button
    oneDayForward.addEventListener('click', async () => {
      const currentDate = getEffectiveDate(); // Get the effective date
      currentDate.setDate(currentDate.getDate() + 1); // Go one day forward
      const formattedDate = new Intl.DateTimeFormat('en-CA').format(currentDate);
      dateInput.value = formattedDate; // Update the date input
      dateInputToggle.title = `Current date: ${formattedDate}`; // Update title
      await loadChatLogs(currentDate); // Load chat logs for the updated date
      showDateInput(dateInput);
      focusOnSearchField();
    });

    // Event listener for the shuffle button
    randomDay.addEventListener('click', async () => {
      const randomDate = getRandomDateInRange(); // Get a random date
      const formattedDate = new Intl.DateTimeFormat('en-CA').format(new Date(randomDate));
      dateInput.value = formattedDate; // Update the date input
      dateInputToggle.title = `Current date: ${formattedDate}`; // Update title
      await loadChatLogs(randomDate); // Load chat logs for the random date
      showDateInput(dateInput);
      focusOnSearchField();
    });

    // Append buttons to the control buttons container
    panelControlButtons.appendChild(oneDayBackward);
    panelControlButtons.appendChild(oneDayForward);
    panelControlButtons.appendChild(randomDay);

    // Create a close button with the provided SVG icon
    const closePanelButton = document.createElement('div');
    closePanelButton.className = 'close-panel-button';
    closePanelButton.title = 'Close panel';
    closePanelButton.innerHTML = closeSVG;
    // Apply common styles using the helper function
    applyHeaderButtonStyles(closePanelButton, 'darkolivegreen', '0 0 0 0.5em');

    // Add a click event listener to the close panel button
    closePanelButton.addEventListener('click', () => {
      // Fade out the chat logs panel when the close button is clicked
      fadeTargetElement(chatLogsPanel, 'hide');
      fadeDimmingElement('hide');
    });

    // Append close button to control buttons, and control buttons to header
    panelControlButtons.appendChild(closePanelButton);
    panelHeaderContainer.appendChild(panelControlButtons);


    // Create a container for the chat logs
    const chatLogsContainer = document.createElement('div');
    chatLogsContainer.className = 'chat-logs-container';
    chatLogsContainer.style.overflowY = 'auto';
    chatLogsContainer.style.height = 'calc(100% - 1em)';
    chatLogsContainer.style.padding = '1em';
    chatLogsContainer.style.display = 'flex';
    chatLogsContainer.style.gridArea = 'messages';
    chatLogsContainer.style.flexDirection = 'column';

    // Create a container for the chat logs scroll buttons
    const scrollButtonsContainer = document.createElement('div');
    scrollButtonsContainer.className = 'scroll-buttons-container';
    scrollButtonsContainer.style.display = 'flex';
    scrollButtonsContainer.style.justifyContent = 'center';
    scrollButtonsContainer.style.gridArea = 'scroll-buttons';
    scrollButtonsContainer.style.flexDirection = 'column';
    scrollButtonsContainer.style.height = 'calc(100% - 1em)';
    scrollButtonsContainer.style.padding = '1em';

    // Function to scroll the chat logs
    function scrollChatLogs(direction, isFullScroll) {
      if (chatLogsContainer) {
        const scrollAmount = isFullScroll ? chatLogsContainer.scrollHeight : chatLogsContainer.clientHeight;

        if (direction === 'up') {
          chatLogsContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        } else if (direction === 'down') {
          chatLogsContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }

        // Update button opacity after scrolling
        updateScrollButtonOpacity();
      }
    }

    // Compact function to update scroll button styles based on scroll position
    function updateScrollButtonOpacity() {
      if (chatLogsContainer) {
        const tolerance = 3; // Account for minor discrepancies
        const isAtTop = chatLogsContainer.scrollTop === 0;
        const isAtBottom = chatLogsContainer.scrollTop + chatLogsContainer.clientHeight >= chatLogsContainer.scrollHeight - tolerance;

        // Helper to set opacity and pointer-events
        const setButtonState = (button, condition) => {
          button.style.opacity = condition ? '0.3' : '1';
          button.style.pointerEvents = condition ? 'none' : 'auto';
        };

        // Apply state to buttons
        [fullScrollUpButton, partialScrollUpButton].forEach(btn => setButtonState(btn, isAtTop));
        [fullScrollDownButton, partialScrollDownButton].forEach(btn => setButtonState(btn, isAtBottom));
      }
    }

    // Create the "Full Scroll Up" button (chevrons)
    const fullScrollUpButton = document.createElement('div');
    fullScrollUpButton.innerHTML = chevronsUpSVG;
    applyScrollButtonStyles(fullScrollUpButton);
    fullScrollUpButton.title = 'Scroll Up (Full)';
    fullScrollUpButton.addEventListener('click', () => scrollChatLogs('up', true)); // Full scroll up
    scrollButtonsContainer.appendChild(fullScrollUpButton);

    // Create the "Partial Scroll Up" button (single chevron)
    const partialScrollUpButton = document.createElement('div');
    partialScrollUpButton.innerHTML = chevronUpSVG;
    applyScrollButtonStyles(partialScrollUpButton);
    partialScrollUpButton.title = 'Scroll Up (Partial)';
    partialScrollUpButton.addEventListener('click', () => scrollChatLogs('up', false)); // Single scroll up
    scrollButtonsContainer.appendChild(partialScrollUpButton);

    // Create the "Partial Scroll Down" button (single chevron)
    const partialScrollDownButton = document.createElement('div');
    partialScrollDownButton.innerHTML = chevronDownSVG;
    applyScrollButtonStyles(partialScrollDownButton);
    partialScrollDownButton.title = 'Scroll Down (Partial)';
    partialScrollDownButton.addEventListener('click', () => scrollChatLogs('down', false)); // Single scroll down
    scrollButtonsContainer.appendChild(partialScrollDownButton);

    // Create the "Full Scroll Down" button (chevrons)
    const fullScrollDownButton = document.createElement('div');
    fullScrollDownButton.innerHTML = chevronsDownSVG;
    applyScrollButtonStyles(fullScrollDownButton);
    fullScrollDownButton.title = 'Scroll Down (Full)';
    fullScrollDownButton.addEventListener('click', () => scrollChatLogs('down', true)); // Full scroll down
    scrollButtonsContainer.appendChild(fullScrollDownButton);

    // Initial check for button opacity
    updateScrollButtonOpacity();

    // Listen for scroll events to dynamically update button opacity
    chatLogsContainer.addEventListener('scroll', updateScrollButtonOpacity);

    // Append the header and chat logs container to the chat logs panel
    chatLogsPanel.appendChild(panelHeaderContainer);
    chatLogsPanel.appendChild(chatLogsContainer);
    chatLogsPanel.appendChild(scrollButtonsContainer);

    // Create an array containing the buttons we want to apply the events to
    const buttons = [
      fullScrollUpButton,
      fullScrollDownButton,
      partialScrollUpButton,
      partialScrollDownButton,
      toggleMentionMessages,
      copyChatLogsUrl,
      toggleActiveUsers,
      dateInputToggle,
      oneDayBackward,
      oneDayForward,
      randomDay,
      closePanelButton
    ];

    // Iterate through each button in the array
    buttons.forEach(button => {
      // Add a mouseover event listener to change the button's brightness on hover
      button.addEventListener('mouseover', () => {
        button.style.filter = 'brightness(0.8)'; // Dim the button
      });

      // Add a mouseout event listener to reset the button's brightness when not hovered
      button.addEventListener('mouseout', () => {
        button.style.filter = 'brightness(1)'; // Reset to original brightness
      });
    });

    // Append the chat logs panel to the body
    document.body.appendChild(chatLogsPanel);

    // Fade in the chat logs panel and dimming background
    fadeTargetElement(chatLogsPanel, 'show');
    fadeDimmingElement('show');

    // Define an object to store the hue for each username
    const usernameHueMap = {};
    const hueStep = 15;
    let lastDisplayedUsername = null; // Variable to track the last displayed username
    // Initialize a map to track message counts for unique usernames
    const usernameMessageCountMap = new Map();
    // Store the current chat logs URL for clipboard copy.
    let chatLogsUrlForCopy = ''; // Store the current chat logs URL for copying

    // Function to load and display chat logs into the container
    const loadChatLogs = async (date) => {
      // Fetch chat logs and pass the chatLogsContainer as the parent container
      const { chatlogs, url } = await fetchChatLogs(date, chatLogsContainer);

      // Assign the fetched URL to the chatLogsUrlForCopy variable
      chatLogsUrlForCopy = url;

      // Clear previous counts
      usernameMessageCountMap.clear();

      chatlogs.forEach(async ({ time, username, message }) => {
        // Update message count for each unique username
        usernameMessageCountMap.set(username, (usernameMessageCountMap.get(username) || 0) + 1);

        // Create a container for each message
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-item');
        messageContainer.style.padding = '0.2em'; // Set padding for the message container
        messageContainer.style.display = 'inline-flex';
        messageContainer.style.cursor = 'pointer'; // Set cursor to pointer on hover for click effect
        // Attach click event to scroll the chat logs container to the middle of the parent container on LMB click
        messageContainer.addEventListener('click', async () => {
          // Call toggleMentionVisibility to show all messages and scroll when a message is clicked on visibleMentionMessages is true
          if (visibleMentionMessages) await toggleMentionVisibility();
          // Use helper function to scroll the chat logs container to the middle of the parent container
          await scrollMessagesToMiddle(chatLogsContainer, messageContainer);
        });

        // Create time element
        const timeElement = document.createElement('span');
        timeElement.className = 'message-time';

        // Update the timeElement's text content with the adjusted time
        timeElement.textContent = time;
        timeElement.style.color = 'darkseagreen';
        timeElement.style.margin = '0 0.4em';
        timeElement.style.cursor = 'pointer';
        timeElement.style.transition = 'color 0.2s ease'; // Smooth color transition
        timeElement.style.height = 'fit-content';

        // Add hover effect to change color to light green
        timeElement.addEventListener('mouseover', () => {
          timeElement.style.color = 'lightgreen';
        });

        // Revert back to original color on mouse out
        timeElement.addEventListener('mouseout', () => {
          timeElement.style.color = 'darkseagreen';
        });

        // Open the chat log URL on click
        timeElement.addEventListener('click', function () {
          const url = `https://klavogonki.ru/chatlogs/${date}.html#${time}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        });

        // Create username element
        const usernameElement = document.createElement('span');
        usernameElement.className = 'message-username';
        usernameElement.textContent = username; // Use the original username for display
        usernameElement.style.cursor = 'pointer';
        usernameElement.style.margin = '0 0.4em';
        usernameElement.style.height = 'fit-content';

        // Add click event to navigate to the user's profile or shake the username if userId is not found
        usernameElement.addEventListener('click', async () => {
          const userId = await getUserId(username); // Fetch the user ID on click

          if (userId) {
            const url = `https://klavogonki.ru/u/#/${userId}/`;
            window.open(url, '_blank', 'noopener,noreferrer');
          } else {
            // Add shake effect if userId doesn't exist
            addShakeEffect(usernameElement); // Define this function for the shake effect
          }
        });

        // Check if the hue for this username is already stored
        let hueForUsername = usernameHueMap[username]; // Use the original username as the key

        // If the hue is not stored, generate a new random hue with the specified step
        if (!hueForUsername) {
          hueForUsername = Math.floor(Math.random() * (210 / hueStep)) * hueStep; // Limit hue to a maximum of 210
          // Store the generated hue for this username
          usernameHueMap[username] = hueForUsername; // Store hue using the original username as the key
        }

        // Apply the hue color to the username element
        usernameElement.style.color = `hsl(${hueForUsername}, 80%, 50%)`;

        // Create message text element
        const messageTextElement = document.createElement('span');
        messageTextElement.className = 'message-text';
        messageTextElement.style.color = 'lightsteelblue';
        messageTextElement.style.margin = '0 0.4em';
        messageTextElement.style.overflowWrap = 'anywhere';
        messageTextElement.style.height = 'fit-content';

        // Replace smiley codes with <img> tags, and then wrap links with <a> tags
        messageTextElement.innerHTML = message
          // Replace smiley codes like :word: with <img> tags
          .replace(/:(?=\w*[a-zA-Z])(\w+):/g,
            (_, word) => `<img src="/img/smilies/${word}.gif" alt=":${word}:" title=":${word}:" class="smile">`
          )
          // Wrap http and https links with <a> tags
          .replace(/(https?:\/\/[^\s]+)/gi,
            (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
          );

        // Apply margin for the first message of a new user
        messageContainer.style.marginTop = lastDisplayedUsername !== username ? '0.6em' : '';

        // Update the last displayed username
        lastDisplayedUsername = username;

        // Append elements to the message container
        messageContainer.appendChild(timeElement);
        messageContainer.appendChild(usernameElement);
        messageContainer.appendChild(messageTextElement);

        // Append the message container to the chat logs container
        chatLogsContainer.appendChild(messageContainer);
      });

      // Call renderActiveUsers to update the display of active users based on their message counts
      renderActiveUsers(usernameMessageCountMap, chatLogsPanel, chatlogsSearchInput);

      requestAnimationFrame(() => {
        chatLogsContainer.scrollTop = chatLogsContainer.scrollHeight; // Scroll to the very bottom
        convertImageLinksToImage('chatlogsMessages')
        convertYoutubeLinksToIframe('chatlogsMessages');
        highlightMentionWords('chatlogsMessages');
      });

    };

    // Renders the active users based on their message counts from the provided map
    function renderActiveUsers(usernameMessageCountMap, parentContainer, searchField) {
      // Check if active users should be shown
      if (localStorage.getItem('shouldShowActiveUsers') === 'shown') {
        // Check if the activeUsers container already exists
        let activeUsers = parentContainer.querySelector('.active-users');

        // If it doesn't exist, create it
        if (!activeUsers) {
          activeUsers = document.createElement('div');
          activeUsers.className = 'active-users';
          activeUsers.style.padding = '1em';
          activeUsers.style.height = 'calc(100% - 1em)';
          activeUsers.style.width = 'fit-content';
          activeUsers.style.overflowY = 'auto';
          activeUsers.style.overflowX = 'hidden';
          activeUsers.style.gridArea = 'users';
          activeUsers.style.display = 'flex';
          activeUsers.style.flexDirection = 'column';

          // Append the newly created activeUsers container to the parent container
          parentContainer.appendChild(activeUsers);
        }

        // Sort usernames by message count in descending order
        const sortedUsernames = Array.from(usernameMessageCountMap.entries())
          .sort(([, countA], [, countB]) => countB - countA); // Sort in descending order

        // Clear previous user list in the activeUsers container
        activeUsers.innerHTML = ''; // Clear previous user list

        // Append sorted users to the activeUsers container
        sortedUsernames.forEach(([username, count]) => {
          // Create a user element
          const userElement = document.createElement('div');
          userElement.className = 'active-user-item';
          userElement.style.display = 'flex';
          userElement.style.height = 'fit-content';
          userElement.style.alignItems = 'center';
          userElement.style.justifyContent = 'left';
          userElement.style.margin = '0.2em 0';
          userElement.style.cursor = 'pointer';
          userElement.style.transition = 'filter 0.15s';

          // Compact event listeners for mouse over and mouse out
          userElement.addEventListener('mouseover', () => (userElement.style.filter = 'brightness(0.8)'));
          userElement.addEventListener('mouseout', () => (userElement.style.filter = 'brightness(1)'));

          // Add click event to populate the search input with the clicked username
          userElement.addEventListener('click', () => {
            const currentValue = chatlogsSearchInput.value.trim();
            const usernameEntry = isCtrlKeyPressed ? `, ${username}` : username;

            if (isCtrlKeyPressed) {
              // Only add the username if it's not already present
              if (!currentValue.includes(username)) {
                chatlogsSearchInput.value += currentValue ? usernameEntry : username;
              }
            } else {
              // If Ctrl key isn't pressed, replace the input value with the clicked username
              chatlogsSearchInput.value = username;
            }

            // Call the filter function with the updated input value
            filterItems(chatlogsSearchInput.value);
          });


          // Create nickname element
          const nicknameElement = document.createElement('span');
          nicknameElement.className = 'active-user-name';
          nicknameElement.textContent = username;
          nicknameElement.style.padding = '0.4em';

          // Fetch the color for the username from the hue map
          const userHue = usernameHueMap[username] || 0; // Fallback to 0 if hue not found
          nicknameElement.style.color = `hsl(${userHue}, 80%, 50%)`; // Apply the hue color

          // Create message count element
          const messageCountElement = document.createElement('span');
          messageCountElement.className = 'active-user-messages-count';
          messageCountElement.textContent = count;
          messageCountElement.style.padding = '0.4em';
          messageCountElement.style.color = `hsl(${userHue}, 80%, 50%)`; // Apply the hue color
          messageCountElement.style.backgroundColor = `hsla(${userHue}, 80%, 50%, 0.2)`;
          messageCountElement.style.setProperty('border-radius', '0.2em', 'important');

          // Append elements to user element
          userElement.appendChild(messageCountElement);
          userElement.appendChild(nicknameElement);

          // Append user element to activeUsers container
          activeUsers.appendChild(userElement);
        });
      }
    }

    // Load today's chat logs initially
    const today = new Intl.DateTimeFormat('en-CA').format(new Date()); // 'en-CA' gives 'YYYY-MM-DD' format
    await loadChatLogs(today); // Load today's logs

    // Set the max attribute to today's date
    dateInput.max = today; // Disable future dates
    dateInput.value = today; // Set the initial value to today's date
    dateInputToggle.title = `Current date: ${today}`; // Set the title with the current date

    // Add an event listener for the date input change
    dateInput.addEventListener('change', async (event) => {
      const selectedDate = event.target.value; // Get the selected date
      await loadChatLogs(selectedDate); // Load chat logs for the selected date
      dateInputToggle.title = `Current date: ${selectedDate}`; // Update the title with the selected date
    });

    // Retrieves details from message items including usernames and message text.
    function getMessageDetails(messageItems) {
      // Cache message details including text, username, and message content
      return messageItems.map(item => {
        const usernameElement = item.querySelector('.message-username');
        const username = usernameElement ? usernameElement.textContent.toLowerCase().trim() : ''; // Get username text, if available
        const messageTextElement = item.querySelector('.message-text');
        const messageText = messageTextElement ? messageTextElement.textContent.toLowerCase().trim() : ''; // Get message text, if available
        return { username, messageText };
      });
    }

    // Filters message items based on the provided query and displays matching messages.
    function filterItems(query) {
      // Helper function to replace underscores and hyphens with spaces and convert to lowercase
      function normalizeText(text) {
        return text.replace(/[_-]/g, ' ').toLowerCase(); // Replaces _ and - with spaces
      }

      // Normalize query by removing underscores and hyphens, then trimming spaces
      const queryWithoutSymbols = normalizeText(query).trim();

      // Retrieve message items within the filterItems function
      const messageItems = Array.from(document.querySelectorAll('.chat-logs-container > .message-item'));

      const messageDetails = getMessageDetails(messageItems); // Get the message details
      const isEmptyQuery = !queryWithoutSymbols;

      // Split query by commas and trim parts
      const queryParts = queryWithoutSymbols.split(',').map(part => part.trim()).filter(Boolean);

      // Count matching usernames
      const matchingUsernamesCount = queryParts.filter(part =>
        messageDetails.some(detail => normalizeText(detail.username) === part)
      ).length;

      // Determine if User Mode is active (2 or more matching usernames)
      const isUserMode = matchingUsernamesCount >= 2;

      // Filter message items based on the query
      messageItems.forEach((item, index) => {
        const messageContainer = item.closest('.message-item'); // Get the closest message item container
        const messageDetailsItem = messageDetails[index];

        let shouldDisplay = false;

        // Normalize underscores and hyphens in the username and message text
        const normalizedUsername = normalizeText(messageDetailsItem.username);
        const normalizedMessageText = normalizeText(messageDetailsItem.messageText);

        if (isEmptyQuery) {
          // Display all messages if the query is empty
          shouldDisplay = true;
        } else if (isUserMode) {
          // User Mode: Match only by username
          shouldDisplay = queryParts.some(part => normalizedUsername === part);
        } else {
          // Simple Mode: Treat the entire query (including commas) as part of the text search
          shouldDisplay = normalizedUsername.includes(queryWithoutSymbols) ||
            normalizedMessageText.includes(queryWithoutSymbols);
        }

        // Apply visibility based on shouldDisplay
        messageContainer.style.display = shouldDisplay ? 'inline-flex' : 'none';
      });
    }

    // Attach a keydown event listener to the document object
    document.addEventListener('keydown', function (event) {
      // Check if the key pressed was the "Escape" key
      if (event.key === 'Escape') {
        // Fade out the chat logs panel
        fadeTargetElement(chatLogsPanel, 'hide');
        fadeDimmingElement('hide');
      }
    });
  }

  // CREATE CHAT LOGS BUTTON (END)


  // CREATE PANEL GRAPHICAL SETTINGS BUTTON (START)

  // Global function to handle file input and process uploaded settings
  async function handleUploadSettings(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      // Return a Promise to handle the asynchronous reading
      return new Promise((resolve, reject) => {
        reader.onload = function (e) {
          const jsonData = e.target.result; // Get the raw JSON string
          try {
            const settingsData = JSON.parse(jsonData); // Attempt to parse the JSON data
            // Call a function to process the uploaded settings data
            processUploadedSettings(settingsData);
            resolve(); // Resolve the promise if successful
          } catch (error) {
            console.error('Error parsing JSON data:', error.message); // Log the error message
            console.error('Invalid JSON:', jsonData); // Log the raw JSON string for debugging
            // Optional: Notify the user about the error
            alert('Failed to parse JSON data. Please check the format and try again.');
            reject(error); // Reject the promise on error
          }
        };

        reader.onerror = function (e) {
          console.error('Error reading file:', e.target.error); // Handle file reading errors
          reject(e.target.error); // Reject the promise on error
        };

        reader.readAsText(file); // Read the file as text
      });
    }
  }

  // Function to download settings as a JSON file
  function handleDownloadSettings(settingsData) {
    if (!settingsData || typeof settingsData !== 'object') {
      console.error('Invalid settings data for download.');
      alert('Cannot export settings. Please try again.');
      return;
    }

    try {
      // Define constants for indentation sizes within the function
      const tabSize2 = '  '; // 2 spaces
      const tabSize4 = '    '; // 4 spaces

      // Convert 'usersToTrack' to single-line entries with proper indentation
      const usersToTrackFormatted = settingsData.usersToTrack
        .map((user) => `${tabSize4}${JSON.stringify(user)}`) // Use defined const for indentation
        .join(',\n'); // Join with a new line for better formatting

      // Convert 'toggle' to formatted entries with proper indentation
      const toggleFormatted = settingsData.toggle
        .map(toggle => `${tabSize4}${JSON.stringify(toggle)}`) // Format each toggle item
        .join(',\n'); // Join with a new line for better formatting

      // Build the JSON structure with appropriate formatting using string concatenation
      const jsonData = '{\n' +
        `${tabSize2}"usersToTrack": [\n` +
        `${usersToTrackFormatted}\n` +
        `${tabSize2}],\n` +
        `${tabSize2}"mentionKeywords": [\n` +
        `${settingsData.mentionKeywords.map(keyword => `${tabSize4}"${keyword}"`).join(',\n')}\n` +
        `${tabSize2}],\n` +
        `${tabSize2}"moderator": [\n` + // Added moderator
        `${settingsData.moderator.map(moderator => `${tabSize4}"${moderator}"`).join(',\n')}\n` +
        `${tabSize2}],\n` +
        `${tabSize2}"ignored": [\n` +
        `${settingsData.ignored.map(user => `${tabSize4}"${user}"`).join(',\n')}\n` +
        `${tabSize2}],\n` +
        `${tabSize2}"toggle": [\n` + // Added toggle
        `${toggleFormatted}\n` +
        `${tabSize2}]\n` +
        '}';

      // Generate a filename with the current date (YYYY-MM-DD)
      const currentDate = new Intl.DateTimeFormat('en-CA').format(new Date());
      const filename = `KG_Chat_Empowerment_Settings_${currentDate}.json`;

      // Create a Blob from the JSON string and prepare it for download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link to trigger the download
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.download = filename;
      document.body.appendChild(tempLink); // Append link to body

      tempLink.click(); // Trigger download
      document.body.removeChild(tempLink); // Clean up link

      URL.revokeObjectURL(url); // Clean up the Blob URL
    } catch (error) {
      console.error('Error exporting settings:', error);
      alert('Failed to export settings. Please try again.');
    }
  }

  // Function to retrieve settings from localStorage and combine them into a single object
  function getSettingsData() {
    // Retrieve data from localStorage using the appropriate keys
    const usersToTrack = JSON.parse(localStorage.getItem('usersToTrack')) || [];
    const mentionKeywords = JSON.parse(localStorage.getItem('mentionKeywords')) || [];
    const moderator = JSON.parse(localStorage.getItem('moderator')) || [];
    const ignored = JSON.parse(localStorage.getItem('ignored')) || [];
    const toggle = JSON.parse(localStorage.getItem('toggle')) || [];

    // Combine the retrieved data into a single object
    const settingsData = {
      usersToTrack: usersToTrack,
      mentionKeywords: mentionKeywords,
      moderator: moderator,
      ignored: ignored,
      toggle: toggle
    };

    return settingsData;
  }

  // Create a button to upload and apply new settings
  function createSettingsButton() {
    // Create a new element with class 'settings-button'
    const showSettingsButton = document.createElement('div');
    // Add the class 'settings-button' to the button
    showSettingsButton.classList.add('settings-button');

    showSettingsButton.title = 'Show Settings Panel';

    // Apply base button styles
    applyBaseButtonStyles(showSettingsButton);

    // Add settings-specific styles directly
    showSettingsButton.style.position = 'relative';

    // Add settings icon to the button (use the SVG icon you provided)
    showSettingsButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="bisque" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sliders">
      <line x1="4" y1="21" x2="4" y2="14"></line>
      <line x1="4" y1="10" x2="4" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12" y2="3"></line>
      <line x1="20" y1="21" x2="20" y2="16"></line>
      <line x1="20" y1="12" x2="20" y2="3"></line>
      <line x1="1" y1="14" x2="7" y2="14"></line>
      <line x1="9" y1="8" x2="15" y2="8"></line>
      <line x1="17" y1="16" x2="23" y2="16"></line>
    </svg>
  `;

    // Create a hidden file input for uploading settings
    const importFileInput = document.createElement('input');
    importFileInput.type = 'file';
    importFileInput.accept = '.json'; // Specify the file type if needed (e.g., JSON)
    importFileInput.style.display = 'none'; // Hide the file input

    // Add an event listener to handle file selection
    importFileInput.addEventListener('change', handleUploadSettings);

    // Add a click event listener to the button
    showSettingsButton.addEventListener('click', function () {
      // Add pulse effect for the settings button
      addPulseEffect(showSettingsButton);

      if (isAltKeyPressed) {
        // Export settings
        const settingsData = getSettingsData(); // Retrieve the settings data
        handleDownloadSettings(settingsData); // Pass the retrieved settings data to the download function
      }
      else if (isCtrlKeyPressed) {
        // Import settings
        importFileInput.click();
      }
      else {
        // If Alt or Ctrl is not pressed open settings panel
        showSettingsPanel();
      }
    });

    // Append the file input to the button
    showSettingsButton.appendChild(importFileInput);

    // Append the button to the existing panel
    empowermentButtonsPanel.appendChild(showSettingsButton);
  }

  // Call the function to create the settings button
  createSettingsButton();

  // Save the current settings to localStorage
  function saveSettingsToLocalStorage() {
    localStorage.setItem('usersToTrack', JSON.stringify(usersToTrack));
    localStorage.setItem('mentionKeywords', JSON.stringify(mentionKeywords));
    localStorage.setItem('moderator', JSON.stringify(moderator));
    localStorage.setItem('ignored', JSON.stringify(ignored));
    localStorage.setItem('toggle', JSON.stringify(toggle));
  }

  // Process and apply uploaded settings
  function processUploadedSettings({
    usersToTrack: u = [],
    mentionKeywords: mk = [],
    moderator: md = [],
    ignored: i = [],
    toggle: t = []
  }) {
    // Ensure the uploaded values are valid arrays or default to the existing ones
    usersToTrack = Array.isArray(u) ? u : usersToTrack;
    mentionKeywords = Array.isArray(mk) ? mk : mentionKeywords;
    moderator = Array.isArray(md) ? md : moderator;
    ignored = Array.isArray(i) ? i : ignored;
    toggle = Array.isArray(t) ? t : toggle;

    // Save to localStorage after applying the settings
    saveSettingsToLocalStorage();
    console.log('Uploaded settings applied:', { usersToTrack, mentionKeywords, moderator, ignored, toggle });
  }

  // Inline SVG source for the "x" icon (close button)
  const closeSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="lightgreen"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-x">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;

  // Inline SVG source for the "chevrons up" icon
  const chevronsUpSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-chevrons-up">
      <polyline points="17 11 12 6 7 11"></polyline>
      <polyline points="17 18 12 13 7 18"></polyline>
  </svg>`;

  // Inline SVG source for the "chevron up" icon
  const chevronUpSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-chevron-up">
      <polyline points="18 15 12 9 6 15"></polyline>
  </svg>`;

  // Inline SVG source for the "chevron down" icon
  const chevronDownSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-chevron-down">
      <polyline points="6 9 12 15 18 9"></polyline>
  </svg>`;

  // Inline SVG source for the "chevrons down" icon
  const chevronsDownSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-chevrons-down">
      <polyline points="7 13 12 18 17 13"></polyline>
      <polyline points="7 6 12 11 17 6"></polyline>
  </svg>`;

  // Inline SVG source for the "toggle-right" icon
  const toggleRightSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 25 25"
      fill="none"
      stroke="#89bbff"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-toggle-right">
      <rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
      <circle cx="16" cy="12" r="3"></circle>
  </svg>`;

  // Inline SVG source for the "toggle-left" icon
  const toggleLeftSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 25 25"
      fill="none"
      stroke="#89bbff"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-toggle-left">
      <rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
      <circle cx="8" cy="12" r="3"></circle>
  </svg>
  `;

  // Inline SVG source for the "calendar" icon
  const calendarSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="lightsteelblue"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-calendar">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>`;

  // Inline SVG source for the "clipboard" icon
  const clipboardSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="lightsteelblue"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-clipboard">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>`;

  // SVG for the "chevron left" icon, used to change chat logs one day backward
  const chevronLeftSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1ce5e5"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-chevron-left">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>`;

  // SVG for the "chevron right" icon, used to change chat logs one day forward
  const chevronRightSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1ce5e5"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-chevron-right">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>`;

  // SVG for the "shuffle" icon, used to select a random year, month, and day
  const shuffleSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#a99bff"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-shuffle">
      <polyline points="16 3 21 3 21 8"></polyline>
      <line x1="4" y1="20" x2="21" y2="3"></line>
      <polyline points="21 16 21 21 16 21"></polyline>
      <line x1="15" y1="15" x2="21" y2="21"></line>
      <line x1="4" y1="4" x2="9" y2="9"></line>
    </svg>`;

  // Inline SVG source for the trash icon
  const trashSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="darkorange" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" class="feather feather-trash-2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>`;

  // Inline SVG source for the users icon
  const usersSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round" class="feather feather-users">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>`;

  // Inline SVG source for the "download" icon (export button)
  const exportSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#90b9ee"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-download">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>`;

  // Inline SVG source for the "upload" icon (import button)
  const importSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d190ee"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-upload">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>`;

  // Inline SVG source for the "save" icon (save button)
  const saveSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#90eedc"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-save">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>`;

  // Inline SVG source for the "remove" icon (remove button)
  const removeSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ee9090"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-trash">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>`;

  // Inline SVG source for the "snowflake" icon
  const snowflakeSVG = `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="20"
       height="20"
       viewBox="0 0 24 24"
       fill="none"
       stroke="lightsteelblue"
       stroke-width="2"
       stroke-linecap="round"
       stroke-linejoin="round"
       class="feather feather-snowflake">
    <g id="snowflake">
      <line x1="12.06" y1="2.74" x2="12.06" y2="12.06" />
      <line x1="20.12" y1="7.4" x2="12.06" y2="12.06" />
      <line x1="20.12" y1="16.71" x2="12.06" y2="12.06" />
      <line x1="12.06" y1="21.37" x2="12.06" y2="12.06" />
      <line x1="3.99" y1="16.71" x2="12.06" y2="12.06" />
      <line x1="3.99" y1="7.4" x2="12.06" y2="12.06" />
      <polyline points="8.96,4.67 12.06,7.77 15.16,4.67"/>
      <polyline points="16.9,5.68 15.76,9.92 20,11.05"/>
      <polyline points="20,13.06 15.76,14.2 16.9,18.43"/>
      <polyline points="15.16,19.44 12.06,16.34 8.96,19.44"/>
      <polyline points="7.21,18.43 8.35,14.2 4.11,13.06"/>
      <polyline points="4.11,11.05 8.35,9.92 7.21,5.68"/>
    </g>
  </svg>
`;

  // Inline SVG source for the "add" icon (add button)
  const addSVG = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d190ee"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-plus">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>`;

  // Function to display the settings panel
  function showSettingsPanel() {
    // Remove any previous panel before creating a new one
    removePreviousPanel();
    // Check if the settings panel already exists
    if (document.querySelector('.settings-panel')) return;

    // Create the settings panel container
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'settings-panel popup-panel';

    // Set initial styles
    settingsPanel.style.opacity = '0';
    settingsPanel.style.backgroundColor = '#1b1b1b';
    settingsPanel.style.setProperty('border-radius', '0.6em', 'important');
    settingsPanel.style.position = 'fixed';
    settingsPanel.style.top = '100px';
    settingsPanel.style.left = '50%';
    settingsPanel.style.transform = 'translateX(-50%)';
    settingsPanel.style.width = '50vw';
    settingsPanel.style.height = '80vh';
    settingsPanel.style.zIndex = '999';
    settingsPanel.style.minWidth = '1000px';

    // Add a keydown event listener for the Esc key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        // Fade out the settings panel and dimming element when the Esc key is pressed
        fadeTargetElement(settingsPanel, 'hide');
        fadeDimmingElement('hide');
      }
    });

    // Create a container div for the panel header
    const panelHeaderContainer = document.createElement('div');
    panelHeaderContainer.className = 'panel-header';
    panelHeaderContainer.style.display = 'flex';
    panelHeaderContainer.style.flexDirection = 'row';
    panelHeaderContainer.style.justifyContent = 'flex-end'; // Aligns to the right
    panelHeaderContainer.style.padding = '0.6em';

    // Helper function to apply common styles to a button
    function applyHeaderButtonStyles(button, backgroundColor, margin = '0 0.5em') {
      button.style.backgroundColor = backgroundColor;
      button.style.width = '48px';
      button.style.height = '48px';
      button.style.display = 'flex';
      button.style.justifyContent = 'center';
      button.style.alignItems = 'center';
      button.style.cursor = 'pointer';
      button.style.setProperty('border-radius', '0.2em', 'important');
      button.style.margin = margin; // Set margin using the provided value
      button.style.filter = 'brightness(1)';
      button.style.transition = 'filter 0.3s ease';
    }

    // Create a close button with the provided SVG icon
    const closePanelButton = document.createElement('div');
    closePanelButton.className = 'close-panel-button';
    closePanelButton.innerHTML = closeSVG;
    closePanelButton.title = 'Close panel';
    // Apply common styles using the helper function
    applyHeaderButtonStyles(closePanelButton, 'darkolivegreen', '0 0 0 0.5em');

    // Add a click event listener to the close panel button
    closePanelButton.addEventListener('click', () => {
      // Fade out the settings panel when the close button is clicked
      fadeTargetElement(settingsPanel, 'hide');
      fadeDimmingElement('hide');
    });

    // Create a clear cache button with the provided SVG icon
    const clearCacheButton = document.createElement('div');
    clearCacheButton.className = 'clear-cache-button';
    clearCacheButton.innerHTML = trashSVG;
    clearCacheButton.title = 'Clear settings';

    // Apply common styles using the helper function
    applyHeaderButtonStyles(clearCacheButton, 'brown');

    // Add a click event listener to the clear cache button
    clearCacheButton.addEventListener('click', () => {
      clearSettingsContainers();
    })

    // Create an import button with the provided SVG icon
    const importSettingsButton = document.createElement('div');
    importSettingsButton.className = 'import-settings-button';
    importSettingsButton.innerHTML = importSVG;
    importSettingsButton.title = 'Import settings';

    // Apply common styles using the helper function
    applyHeaderButtonStyles(importSettingsButton, '#502f6b');

    // Create a save button with the provided SVG icon
    const saveSettingsButton = document.createElement('div');
    saveSettingsButton.className = 'save-settings-button';
    saveSettingsButton.innerHTML = saveSVG;
    saveSettingsButton.title = 'Save settings';
    saveSettingsButton.style.opacity = '0';

    function initializeSaveButtonLogic(saveButton) {
      const container = document.querySelector('.settings-content-container');
      if (!container) return console.error("Container not found.");

      const showButton = () => (saveButton.style.opacity = '1');
      const hideButton = () => (saveButton.style.opacity = '0');

      // Get previous values from localStorage
      const previousValues = getSettingsData();

      const handleInputChange = () => {
        const currentValues = {
          usersToTrack: [],
          mentionKeywords: [],
          moderator: [],
          ignored: [],
          toggle: []
        };

        // Process tracked items
        container.querySelectorAll('.settings-tracked-container .tracked-item').forEach(item => {
          const usernameField = item.querySelector('.tracked-username-field');
          const genderField = item.querySelector('.tracked-gender-select');
          const pronunciationField = item.querySelector('.tracked-pronunciation-field');
          const snowflakeButton = item.querySelector('.assigned-thawed-config, .assigned-frozen-config');

          const usernameValue = usernameField ? usernameField.value.trim() : '';
          const genderValue = genderField ? genderField.value.trim() : '';
          const pronunciationValue = pronunciationField ? pronunciationField.value.trim() : '';
          // Determine the state based on the button's class
          const state = snowflakeButton.classList.contains('assigned-frozen-config') ? 'frozen' : 'thawed';

          // Push current values to usersToTrack
          currentValues.usersToTrack.push({
            name: usernameValue,
            gender: genderValue,
            pronunciation: pronunciationValue,
            state
          });
        });

        // Process mention items
        container.querySelectorAll('.settings-mention-container .mention-item').forEach(item => {
          const mentionField = item.querySelector('.mention-field');
          const mentionValue = mentionField ? mentionField.value.trim() : '';
          currentValues.mentionKeywords.push(mentionValue);
        });

        // Process moderator
        container.querySelectorAll('.settings-moderator-container .moderator-item').forEach(item => {
          const moderatorField = item.querySelector('.moderator-field');
          const moderatorValue = moderatorField ? moderatorField.value.trim() : '';
          currentValues.moderator.push(moderatorValue);
        });

        // Process ignored items
        container.querySelectorAll('.settings-ignored-container .ignored-item').forEach(item => {
          const ignoredField = item.querySelector('.ignored-field');
          const ignoredValue = ignoredField ? ignoredField.value.trim() : '';
          currentValues.ignored.push(ignoredValue);
        });

        // Process toggle (yes/no) settings based on select elements within each toggle-setting item
        container.querySelectorAll('.settings-toggle-container .toggle-item').forEach(item => {
          const descriptionElement = item.querySelector('.toggle-description'); // Get the description element
          const selectElement = item.querySelector('.toggle-select'); // Select the toggle (select) element within the current toggle-item
          const selectedValue = selectElement ? selectElement.value.trim() : 'no'; // Default to 'no' if not selected

          // Get the data-toggle-name attribute value from the descriptionElement
          const toggleName = descriptionElement.getAttribute('data-toggle-name');

          // Push the current toggle setting as an object into the toggle array
          if (toggleName) {
            currentValues.toggle.push({
              name: toggleName, // Store the toggle name
              option: selectedValue // Store the selected value directly
            });
          }
        });

        // Check if any values have changed compared to previous state
        const valuesChanged = JSON.stringify(previousValues) !== JSON.stringify(currentValues);

        // Show or hide the save button based on whether values have changed
        valuesChanged ? showButton() : hideButton();

        return currentValues; // Return current values for saving later
      };

      // Attach click event to save settings when there are changes
      saveButton.addEventListener('click', () => {
        const currentValues = handleInputChange(); // Get current values before saving
        processUploadedSettings(currentValues); // Process and save the current settings
        // Update previousValues to the current state after saving
        Object.assign(previousValues, currentValues);
        hideButton(); // Optionally hide the button after saving
      });

      // Add input listeners to existing fields
      container.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('input', handleInputChange);
      });

      // Function to attach event listeners to dynamically added input and select elements
      const attachEventListeners = (element) => {
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
          element.addEventListener('input', handleInputChange);
          // console.log('Listener attached to:', element);
        } else {
          // Check its children for input or select elements
          element.querySelectorAll('input, select').forEach((child) => {
            child.addEventListener('input', handleInputChange);
            // console.log('Listener attached to child:', child);
          });
        }
      };

      // Create a mutation observer to monitor changes in the target container
      const observer = new MutationObserver(debounce((mutationsList) => {
        mutationsList.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // console.log('Added:', node);
                attachEventListeners(node); // Attach event listeners to new elements
              }
            });

            mutation.removedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // console.log('Removed:', node);
                handleInputChange(); // Call handleInputChange to check the state after any changes
              }
            });
          }
        });
      }, 300));

      // Start observing the target container for child list changes
      observer.observe(container, {
        childList: true,
        subtree: true, // Observe all descendants as well
      });
    }

    // Apply common styles using the helper function
    applyHeaderButtonStyles(saveSettingsButton, '#2f6b63');

    // Create a hidden file input for importing settings
    const importFileInput = document.createElement('input');
    importFileInput.type = 'file';
    importFileInput.accept = '.json'; // Specify the file type
    importFileInput.style.display = 'none'; // Hide the file input

    // Add an event listener for the import file input
    importFileInput.addEventListener('change', async (event) => {
      await handleUploadSettings(event); // Wait for processing uploaded settings
      // Clear the containers before populating new data
      clearSettingsContainers();
      // Populate the UI with updated settings
      populateSettings();
    });

    // Function to clear the content of settings containers
    function clearSettingsContainers() {
      const containers = [
        '.settings-tracked-container',
        '.settings-mention-container',
        '.settings-moderator-container',
        '.settings-ignored-container'
      ];

      containers.forEach(selector => {
        const container = document.querySelector(selector);
        // Find the .add-setting-button if it exists
        const addButton = container.querySelector('.add-setting-button');
        if (container) {
          container.innerHTML = ''; // Clear the container
        }
        // Re-add the .add-setting-button if it was found
        addButton && container.appendChild(addButton);
      });
    }

    // Add a click event listener to the import button
    importSettingsButton.addEventListener('click', () => {
      importFileInput.click(); // Trigger file input click
    });

    // Append the file input to the import button
    importSettingsButton.appendChild(importFileInput);

    // Create an export button with the provided SVG icon
    const exportSettingsButton = document.createElement('div');
    exportSettingsButton.className = 'export-settings-button';
    exportSettingsButton.innerHTML = exportSVG;
    exportSettingsButton.title = 'Export settings';

    // Apply common styles using the helper function
    applyHeaderButtonStyles(exportSettingsButton, '#2f4c6b');

    // Example of how to use the getSettingsData function in the export event
    exportSettingsButton.addEventListener('click', function () {
      const settingsData = getSettingsData(); // Retrieve the settings data
      handleDownloadSettings(settingsData); // Pass the retrieved settings data to the download function
    });

    // Create an array containing the buttons we want to apply the events to
    const buttons = [
      clearCacheButton,
      closePanelButton,
      importSettingsButton,
      exportSettingsButton
    ];

    // Iterate through each button in the array
    buttons.forEach(button => {
      // Add a mouseover event listener to change the button's brightness on hover
      button.addEventListener('mouseover', () => {
        button.style.filter = 'brightness(0.8)'; // Dim the button
      });

      // Add a mouseout event listener to reset the button's brightness when not hovered
      button.addEventListener('mouseout', () => {
        button.style.filter = 'brightness(1)'; // Reset to original brightness
      });
    });

    // Append the buttons to the panel header container
    panelHeaderContainer.appendChild(saveSettingsButton);
    panelHeaderContainer.appendChild(importSettingsButton);
    panelHeaderContainer.appendChild(exportSettingsButton);
    panelHeaderContainer.appendChild(clearCacheButton);
    panelHeaderContainer.appendChild(closePanelButton);

    // Append the header to the settings panel
    settingsPanel.appendChild(panelHeaderContainer);

    // Append the header to the settings panel
    settingsPanel.appendChild(panelHeaderContainer);

    // Create a container for the settings content
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-content-container';
    settingsContainer.style.overflowY = 'auto'; // Enable scrolling for settings content
    settingsContainer.style.height = 'calc(100% - 70px)'; // Adjust height considering header
    settingsContainer.style.padding = '1em';

    // Helper function to assign styles to description elements
    function assignDescriptionStyles(element) {
      element.style.position = 'relative';
      element.style.font = '1em Montserrat';
      element.style.color = 'burlywood';
      element.style.backgroundColor = 'rgba(222, 184, 135, 0.1)';
      element.style.width = 'fit-content';
      element.style.margin = '2em 1em 1em';
      element.style.padding = '0.4em 0.8em';
      element.style.textAlign = 'center';
      element.style.setProperty('border-radius', '0.4em', 'important');
      element.style.left = '50%';
      element.style.transform = 'translateX(-50%)';
    }

    // Array of settings types with corresponding emoji
    const settingsTypes = [
      { type: 'tracked', emoji: '👀' },
      { type: 'mention', emoji: '📢' },
      { type: 'moderator', emoji: '⚔️' },
      { type: 'ignored', emoji: '🛑' },
      { type: 'toggle', emoji: '🔘' }
    ];

    // Loop through each type and create description and container elements
    settingsTypes.forEach(({ type, emoji }) => {
      const description = document.createElement('div');
      description.className = `settings-${type}-description`; // Add specific class for description

      assignDescriptionStyles(description);

      // Create the description container directly
      const container = document.createElement('div');
      container.className = `settings-${type}-container`; // Add specific class for container

      // Set the text content with first letter capitalized and append emoji
      description.textContent = `${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} ${emoji}`;

      settingsContainer.appendChild(description);
      settingsContainer.appendChild(container);
    });


    // Append the settings content container to the settings panel
    settingsPanel.appendChild(settingsContainer);

    // Applies common styles to an settings input field element
    function styleInput(input) {
      input.style.height = '30px';
      input.style.maxWidth = '200px';
      input.style.minWidth = '150px';
      input.style.padding = '0.4em';
      input.style.font = '1em Montserrat';
      input.style.fontFamily = 'Montserrat';
      input.style.color = 'bisque';
      input.style.setProperty('border-radius', '0.2em', 'important');
      input.style.boxSizing = 'border-box';
      input.style.backgroundColor = 'rgb(17,17,17)';
      input.style.border = '1px solid rgb(34,34,34)';
    }

    /* Applies common styles to a button element for saving or removing actions.
    * @param {HTMLElement} button - The button element to style.
    * @param {string} strokeColor - The stroke color for the button.
    * @param {string} backgroundColor - The background color for the button.
    * @param {boolean} disabled - Whether the button should be styled as disabled.
    */
    function styleButton(button, strokeColor, backgroundColor, disabled) {
      button.style.stroke = strokeColor;
      button.style.width = '30px';
      button.style.height = '30px';
      button.style.display = 'flex';
      button.style.justifyContent = 'center';
      button.style.alignItems = 'center';
      button.style.backgroundColor = backgroundColor;
      button.style.setProperty('border-radius', '0.2em', 'important');
      button.style.cursor = 'pointer';
      button.style.transition = 'filter 0.3s';

      // Compact event listeners for mouse over and mouse out
      button.addEventListener('mouseover', () => (button.style.filter = 'brightness(0.8)'));
      button.addEventListener('mouseout', () => (button.style.filter = 'brightness(1)'));

      if (disabled) {
        button.style.filter = 'grayscale(1)';
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.5';
      } else {
        button.style.filter = 'grayscale(0)';
      }
    }

    // Applies common styles to a select element and its options
    function styleSelect(select) {
      select.style.height = '30px';
      select.style.maxWidth = '120px';
      select.style.minWidth = '105px';
      select.style.padding = '0.4em';
      select.style.font = '1em Montserrat';
      select.style.fontFamily = 'Montserrat';
      select.style.setProperty('color', 'bisque', 'important');
      select.style.setProperty('border-radius', '0.2em', 'important');
      select.style.boxSizing = 'border-box';
      select.style.setProperty('background-color', 'rgb(17,17,17)', 'important');
      select.style.setProperty('border', '1px solid rgb(34,34,34)', 'important');

      // Style each option element
      Array.from(select.options).forEach(option => {
        option.style.height = '30px';
        option.style.setProperty('background-color', 'rgb(17,17,17)', 'important');
        option.style.setProperty('color', 'bisque', 'important');
        option.style.fontFamily = 'Montserrat';
      });
    }

    // Common function to attach click event for removing an item
    function attachRemoveListener(removeButton, item) {
      removeButton.addEventListener('click', () => {
        item.remove(); // Remove the parent element
      });
    }

    // Function to attach click event for toggling between "assigned-thawed-config" and "assigned-frozen-config"
    function attachSnowflakeListener(snowflakeButton, username) {
      snowflakeButton.addEventListener('click', () => {
        const isFrozen = snowflakeButton.classList.toggle('assigned-frozen-config');
        snowflakeButton.classList.toggle('assigned-thawed-config');

        // Set opacity based on the assigned class
        snowflakeButton.style.opacity = isFrozen ? '1' : '0.3';

        // Update localStorage using the helper function
        updateUserState(username, isFrozen ? 'frozen' : 'thawed');
      });
    }

    // Helper function to create a container element
    function createContainer(type, layout = 'inline-flex') {
      const item = document.createElement('div');
      item.className = `${type}-item`;
      item.style.display = layout;
      item.style.gap = '0.5em';
      item.style.padding = '0.25em';
      return item;
    }

    // Helper function to create an input element
    function createInput(type, value = '', placeholder = '') {
      const input = document.createElement('input');
      input.className = `${type}-field`;
      input.value = value;
      input.placeholder = placeholder;
      styleInput(input);
      return input;
    }

    // Helper function to create a remove button with styles and event listener
    function createRemoveButton(type, item) {
      const removeButton = document.createElement('div');
      removeButton.className = `remove-${type}-word`;
      removeButton.innerHTML = removeSVG;
      attachRemoveListener(removeButton, item);
      styleButton(removeButton, '#ee9090', '#6b2f2f', false);
      return removeButton;
    }

    // Helper function to create a snowflake button with styles and event listener
    function createSnowflakeButton(state = 'thawed', username) {
      const snowflakeButton = document.createElement('div');
      snowflakeButton.className = `assigned-${state}-config`;

      // Set initial opacity based on the state
      snowflakeButton.style.opacity = state === 'thawed' ? '0.3' : '1';
      snowflakeButton.innerHTML = snowflakeSVG;

      attachSnowflakeListener(snowflakeButton, username); // Pass username here
      styleButton(snowflakeButton, 'lightsteelblue', 'steelblue', false);

      return snowflakeButton;
    }

    // Function to update a specific user in localStorage to add the state property
    function updateUserState(username, state) {
      const usersData = localStorage.getItem("usersToTrack");
      if (usersData) {
        const updatedUsers = JSON.parse(usersData).map(user =>
          user.name === username ? { ...user, state } : user
        );
        localStorage.setItem("usersToTrack", JSON.stringify(updatedUsers));
      }
    }

    // Function to create a tracked item (with gender select)
    function createTrackedItem(user) {
      const item = createContainer('tracked', 'flex');

      const usernameInput = createInput('tracked-username', user.name, 'Username');
      const pronunciationInput = createInput('tracked-pronunciation', user.pronunciation, 'Pronunciation');
      const removeButton = createRemoveButton('tracked', item);

      // Set the initial state based on the user's state property, defaulting to 'thawed' if it doesn't exist
      const initialState = (user.state === 'frozen') ? 'frozen' : 'thawed';
      const snowflakeButton = createSnowflakeButton(initialState, user.name); // Pass username

      const genderSelect = document.createElement('select');
      genderSelect.className = 'tracked-gender-select';
      const genders = [
        { value: 'Male', emoji: '👨' },
        { value: 'Female', emoji: '👩' },
      ];
      genders.forEach(({ value, emoji }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = `${emoji} ${value}`;
        if (user.gender === value) option.selected = true;
        genderSelect.appendChild(option);
      });
      styleSelect(genderSelect);

      item.appendChild(usernameInput);
      item.appendChild(genderSelect);
      item.appendChild(pronunciationInput);
      item.appendChild(removeButton);
      item.appendChild(snowflakeButton);

      return item;
    }

    // Function to create a mention item
    function createMentionItem(keyword) {
      const item = createContainer('mention');
      const mentionInput = createInput('mention', keyword, 'Mention Keyword');
      const removeButton = createRemoveButton('mention', item);

      item.appendChild(mentionInput);
      item.appendChild(removeButton);

      return item;
    }

    // Function to create a moderator item
    function createModeratorItem(moderator) {
      const item = createContainer('moderator');
      const moderatorInput = createInput('moderator', moderator, 'Moderator Name');
      const removeButton = createRemoveButton('moderator', item);

      item.appendChild(moderatorInput);
      item.appendChild(removeButton);

      return item;
    }

    // Function to create an ignored item
    function createIgnoredItem(user) {
      const item = createContainer('ignored');
      const ignoredInput = createInput('ignored', user, 'Ignored User');
      const removeButton = createRemoveButton('ignored', item);

      item.appendChild(ignoredInput);
      item.appendChild(removeButton);

      return item;
    }

    // Function to create a toggle item with a description and select for yes/no options
    function createToggleItem(toggle, name, optionValue) {
      const item = createContainer('toggle', 'flex');
      item.style.alignItems = 'center';

      // Create the select element for yes/no
      const select = document.createElement('select');
      select.className = 'toggle-select';

      // Create the description element
      const description = document.createElement('span');
      description.className = 'toggle-description';
      description.innerText = toggle.description;
      // Set the custom data attribute for the setting using the name parameter
      description.setAttribute('data-toggle-name', name); // Set data-toggle-name to the name parameter

      // Add click event to open the image in a new tab
      description.style.cursor = 'pointer'; // Add pointer cursor to indicate it's clickable
      description.style.color = 'burlywood';
      description.style.transition = 'color 0.15s ease-in-out';

      description.addEventListener('click', () => {
        if (toggle.image) {
          window.open(toggle.image, '_blank'); // Open the image in a new tab
        }
      });

      // Compact mouseover and mouseout events
      description.addEventListener('mouseover', function () { description.style.color = 'lightgoldenrodyellow'; })
      description.addEventListener('mouseout', function () { description.style.color = 'burlywood'; });

      // Define options with emojis for yes and no
      const options = [
        { value: 'yes', emoji: '✔️' },
        { value: 'no', emoji: '❌' }
      ];

      // Create options for the select element
      options.forEach(({ value, emoji }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = `${emoji} ${value}`; // Format text as "✔️ yes" or "❌ no"
        select.appendChild(option);
      });

      // Set the initial value of the select based on the optionValue parameter
      select.value = optionValue; // Assign the optionValue to the select element

      // Style the select element
      styleSelect(select); // Call the styling function

      // Append the description and select to the toggle item
      item.appendChild(select);
      item.appendChild(description);

      return item; // Return the created toggle item
    }

    // Populate settings dynamically
    function populateSettings() {
      const containers = {
        usersToTrack: '.settings-tracked-container',
        mentionKeywords: '.settings-mention-container',
        moderator: '.settings-moderator-container',
        ignored: '.settings-ignored-container'
      };

      const creators = {
        usersToTrack: createTrackedItem,
        mentionKeywords: createMentionItem,
        moderator: createModeratorItem,
        ignored: createIgnoredItem
      };

      const data = getSettingsData();

      Object.entries(data).forEach(([key, items]) => {
        const container = document.querySelector(containers[key]);
        if (!container) return; // Skip if the container is null
        container.style.width = '100%';

        // Apply specific styles for mention and ignored containers
        if (key === 'mentionKeywords' || key === 'moderator' || key === 'ignored') {
          container.style.display = 'inline-flex';
          container.style.flexWrap = 'wrap';
          container.style.alignItems = 'center';
        }

        // Create and append existing items
        items.forEach(item => container.appendChild(creators[key](item)));

        // Create and append the add button with the appropriate creator
        const addButton = createAddButton(containers[key], creators[key]);
        container.appendChild(addButton);
      });

      // Retrieve the toggle settings from localStorage
      const storedToggleSettings = JSON.parse(localStorage.getItem('toggle')) || [];

      // Create and append toggle items directly for the toggle settings
      const toggleContainer = document.querySelector('.settings-toggle-container');
      const toggleSettings = [
        {
          name: 'showChatStaticNotifications',
          description: 'Show chat static notifications',
          image: 'https://i.imgur.com/oUPSi9I.jpeg'
        },
        {
          name: 'showGlobalDynamicNotifications',
          description: 'Show global dynamic notifications',
          image: 'https://i.imgur.com/8ffCdUG.jpeg'
        }
      ];


      // Create and append toggle items directly
      toggleSettings.forEach(toggle => {
        // Find the stored setting for the current toggle or default to 'yes'
        const storedSetting = storedToggleSettings.find(item => item.name === toggle.name);
        const optionValue = storedSetting ? storedSetting.option : 'yes'; // Default to 'yes' if not set
        const toggleItem = createToggleItem(toggle, toggle.name, optionValue); // Pass the toggle and name
        toggleContainer.appendChild(toggleItem); // Append the toggle item to the container
      });

    }

    // Function to create an "Add" button for dynamic item creation
    function createAddButton(containerSelector, itemCreator) {
      const addButton = document.createElement('div');
      const middleWord = containerSelector.split('-')[1]; // Extract key type (e.g., tracked, mention)
      const existingButton = document.querySelector(`.add-${middleWord}-item`); // Check if the button already exists

      if (existingButton) return existingButton; // Return the existing button if it exists

      // Set class, content, and style for the button
      addButton.className = `add-setting-button add-${middleWord}-item`;
      addButton.innerHTML = addSVG; // Add SVG icon to the button
      styleButton(addButton, '#d190ee', '#502f6b', false); // Style the button
      addButton.style.margin = '0.4em';

      // On click, validate the last item and create a new one if valid
      addButton.addEventListener('click', () => {
        const container = document.querySelector(containerSelector); // Get the container element

        // Get all settings {type} items and select the last one
        const allItems = container.querySelectorAll(`.${middleWord}-item`);
        const lastItem = allItems.length > 0 ? allItems[allItems.length - 1] : null;

        // Check if the last item has any input fields
        const inputFields = lastItem ? lastItem.querySelectorAll('input') : []; // Get all input fields in the last item
        const hasEmptyFields = Array.from(inputFields).some(field => field.value.trim().length === 0); // Check for empty fields

        // Allow creation only if the last item has no empty fields (or if there are no items yet)
        const canCreateNewItem = !lastItem || !hasEmptyFields;

        if (canCreateNewItem) {
          // Create a new empty item based on the item creator function
          const emptyItem = itemCreator === createTrackedItem
            ? itemCreator({ name: '', pronunciation: '' }) // Remove gender from tracked item creation
            : itemCreator('');

          // Check if the new item is a valid HTMLElement before inserting
          if (emptyItem instanceof HTMLElement) {
            container.insertBefore(emptyItem, addButton); // Insert the new item before the Add button
          } else {
            console.error('Invalid item created.'); // Log an error if the item is not valid
          }
        } else {
          // Alert the user if the last item is filled
          alert('Please fill in the previous item before adding a new one.');
        }
      });

      return addButton; // Return the created button
    }

    // Append the settings panel to the body
    document.body.appendChild(settingsPanel);

    // Call the function to populate settings on page load
    populateSettings();

    // Make save button work as expected
    initializeSaveButtonLogic(saveSettingsButton);

    // Fade in the settings panel and dimming background element
    fadeTargetElement(settingsPanel, 'show');
    fadeDimmingElement('show');
  }

  // CREATE PANEL GRAPHICAL SETTINGS BUTTON (END)


  // Function to retrieve the chat input field and length popup container based on the current URL
  function retrieveChatElementsByRoomType() {
    const currentURL = window.location.href; // Get the current URL
    let inputField, lengthPopupContainer;

    if (currentURL.includes('gamelist')) {
      inputField = document.querySelector('#chat-general .text'); // Selector for the general chat input
      lengthPopupContainer = document.querySelector('#chat-general .messages'); // Selector for the general chat messages
    } else if (currentURL.includes('gmid')) {
      inputField = document.querySelector('[id^="chat-game"] .text'); // Selector for the game chat input
      lengthPopupContainer = document.querySelector('[id^="chat-game"] .messages'); // Selector for the game chat messages
    } else {
      console.error('No matching room type found in the URL.');
      return null; // Return null if no matching type is found
    }

    return { inputField, lengthPopupContainer }; // Return both the input field and the length popup container
  }


  // CHAT POPUP INDICATOR LENGTH (START)

  // Select the input element and length popup container using the helper function
  const { inputField: chatField, lengthPopupContainer } = retrieveChatElementsByRoomType();

  // Create a style element for animations
  const lengthPopupAnimations = document.createElement('style');
  lengthPopupAnimations.textContent = `
    @keyframes bounceIn {
      0% { transform: translateY(0); opacity: 0; }
      50% { transform: translateY(-10px); opacity: 1; }
      100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes bounceOut {
      0% { transform: translateY(0); opacity: 1; }
      50% { transform: translateY(-10px); opacity: 1; }
      100% { transform: translateY(0); opacity: 0; }
    }
    .length-field-popup {
      position: absolute; font: bold 12px Montserrat; bottom: 40px; height: 20px;
      display: flex; align-items: center; justify-content: center; padding: 2px 4px; margin: 2px;
      line-height: 20px; opacity: 0;
    }`;

  document.head.appendChild(lengthPopupAnimations);

  const lengthPopup = document.createElement('div');
  lengthPopup.className = 'length-field-popup';
  lengthPopupContainer.appendChild(lengthPopup);

  // Rename the timeout variable to be more descriptive
  let hidePopupTimeout;

  // Track the previous input length
  let previousLength = 0;

  // Function to update the color of the length popup
  function updateLengthPopupColor(length) {
    if (!lengthPopup) {
      console.error('lengthPopup is not defined');
      return;
    }

    let textColor;

    // Determine color based on the length
    if (length === 0) {
      textColor = 'hsl(200, 20%, 50%)'; // Light Blue
    } else if (length >= 1 && length <= 90) {
      textColor = 'hsl(120, 100%, 40%)'; // Bright Green
    } else if (length > 90 && length <= 100) {
      const factor = (length - 90) / 10;
      const h = Math.round(120 + factor * (60 - 120)); // Interpolating hue
      textColor = `hsl(${h}, 100%, 40%)`;
    } else if (length > 100 && length <= 190) {
      textColor = 'hsl(60, 100%, 50%)'; // Bright Yellow
    } else if (length > 190 && length <= 200) {
      const factor = (length - 190) / 10;
      const h = Math.round(60 + factor * (30 - 60)); // Interpolating hue
      textColor = `hsl(${h}, 100%, 50%)`;
    } else if (length > 200 && length <= 250) {
      textColor = 'hsl(40, 100%, 50%)'; // Orange (Updated)
    } else if (length > 250 && length <= 300) {
      const factor = (length - 250) / 50;
      const h = Math.round(40 + factor * (0 - 40)); // Interpolating hue
      textColor = `hsl(${h}, 100%, 70%)`;
    } else {
      textColor = 'hsl(0, 100%, 70%)'; // Red (Updated)
    }

    // Apply the text color to the length popup
    lengthPopup.style.color = textColor;
  }

  // Function to show the length popup with updated color and arrow direction
  function showLengthPopup(length) {
    let displayText;

    // Check if a symbol is added (→) or removed (←)
    if (length > previousLength) {
      displayText = `${length} 🡆`; // Typing: Right arrow after the length
    } else if (length < previousLength) {
      displayText = `🡄 ${length}`; // Deleting: Left arrow before the length
    } else {
      displayText = `${length}`; // No change: No arrows
    }

    lengthPopup.textContent = displayText; // Display the length and arrow
    lengthPopup.style.opacity = '1'; // Ensure it's visible
    updateLengthPopupColor(length); // Update the text color based on length
    lengthPopup.style.animation = 'bounceIn 0.5s forwards'; // Apply bounce-in animation

    // Update the previous length
    previousLength = length;
  }

  function hideLengthPopup() {
    lengthPopup.style.animation = 'bounceOut 0.5s forwards';
    setTimeout(() => {
      lengthPopup.style.opacity = '0';
    }, 500);
  }

  // Event listener for input
  chatField.addEventListener('input', function () {
    clearTimeout(hidePopupTimeout);

    const length = chatField.value.length;
    showLengthPopup(length); // Show the length popup with updated length and arrow

    // Calculate position of the popup
    const fieldTextWidthCalculator = document.createElement('span');
    fieldTextWidthCalculator.style.visibility = 'hidden';
    fieldTextWidthCalculator.style.whiteSpace = 'nowrap';
    fieldTextWidthCalculator.style.font = getComputedStyle(chatField).font;
    fieldTextWidthCalculator.textContent = chatField.value;
    document.body.appendChild(fieldTextWidthCalculator);

    const inputWidth = fieldTextWidthCalculator.offsetWidth;
    const newLeft = chatField.offsetLeft + inputWidth + 5;
    const maxLeft = chatField.offsetLeft + chatField.offsetWidth - lengthPopup.offsetWidth;
    lengthPopup.style.left = `${Math.min(newLeft, maxLeft)}px`;

    document.body.removeChild(fieldTextWidthCalculator);

    // Reset the timeout for hiding the popup
    hidePopupTimeout = setTimeout(hideLengthPopup, 1000);
  });

  // Event listener for keydown (Enter key)
  chatField.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      showLengthPopup(0);
      lengthPopup.style.left = '0px';
      lengthPopup.style.color = 'hsl(200, 20%, 50%)'; // Light Blue
      // Reset the timeout for hiding the popup
      hidePopupTimeout = setTimeout(hideLengthPopup, 1000);
    }
  });

  // CHAT POPUP INDICATOR LENGTH (END)


  // REMOVE UNWANTED MESSAGES

  /*
  ** This algorithm enables the removal of unpleasant messages in the chat that are unwanted.
  ** The messages are saved in localStorage and remain there until they are visible in the chat.
  ** Once a message is no longer visible in the chat, its corresponding value in localStorage is also removed.
  ** This method is helpful in storing only necessary unwanted messages, preventing an overgrowth of values over time.
  */

  function executeMessageRemover() {
    attachEventsToMessages();
    createToggleButton();
    wipeDeletedMessages();
  } // executeMessageRemover function END

  // Functions to assign different toggle button styles
  // Red color tones
  function assignHiddenButtonStyle(toggleButton) {
    toggleButton.style.backgroundColor = 'hsl(0, 20%, 10%)';
    toggleButton.style.color = 'hsl(0, 50%, 50%)';
    toggleButton.style.border = '1px solid hsl(0, 50%, 50%)';
  }
  // Green color tones
  function assignShowButtonStyle(toggleButton) {
    toggleButton.style.backgroundColor = 'hsl(90, 20%, 10%)';
    toggleButton.style.color = 'hsl(90, 50%, 50%)';
    toggleButton.style.border = '1px solid hsl(90, 50%, 50%)';
  }
  // Yellow color tones
  function assignHideButtonStyle(toggleButton) {
    toggleButton.style.backgroundColor = 'hsl(50, 20%, 10%)';
    toggleButton.style.color = 'hsl(50, 50%, 50%)';
    toggleButton.style.border = '1px solid hsl(50, 50%, 50%)';
  }

  // Function to assign styles to the delete button
  function assignDeleteButtonStyles(deleteButton, event) {
    // Set the delete button styles
    deleteButton.style.position = 'fixed';
    deleteButton.style.top = `${event.clientY}px`;
    deleteButton.style.left = `${event.clientX}px`;
    deleteButton.style.zIndex = 999;
    deleteButton.style.padding = '8px 16px';
    deleteButton.style.backgroundColor = 'hsl(0, 50%, 20%)';
    deleteButton.style.color = 'hsl(0, 60%, 70%)';
    deleteButton.style.border = '1px solid hsl(0, 50%, 35%)';
    deleteButton.style.transition = 'all 0.3s';
    deleteButton.style.filter = 'brightness(1)';

    // Set the hover styles
    deleteButton.addEventListener('mouseenter', () => {
      deleteButton.style.filter = 'brightness(1.5)';
    });

    // Set the mouse leave styles
    deleteButton.addEventListener('mouseleave', () => {
      deleteButton.style.filter = 'brightness(1)';
    });
  }

  // Functions to assign selection to the messages
  function assignMessageSelection(message) {
    message.style.setProperty('background-color', 'hsla(0, 50%, 30%, .5)', 'important');
    message.style.setProperty('box-shadow', 'inset 0px 0px 0px 1px rgb(191, 64, 64)', 'important');
    message.style.setProperty('background-clip', 'padding-box', 'important');
  }
  // Clear the selection
  function clearMessageSelection() {
    const messages = document.querySelectorAll('.messages-content div p');
    messages.forEach(message => {
      message.style.removeProperty('background-color');
      message.style.removeProperty('box-shadow');
      message.style.removeProperty('background-clip');
    });
  }

  // Declare a new Set to hold selected messages
  const selectedMessages = new Set();
  // To store the data of the right mouse button drag
  let isDragging = false;
  let isRightMouseButton = false;

  // Function to attach events on every message what doesn't have any event assigned
  function attachEventsToMessages() {
    const messages = document.querySelectorAll('.messages-content div p');
    // Store timeoutID to regulate it by multiple events
    let timeoutId = null;

    messages.forEach(message => {
      // Check if the element has the 'contextmenu' id before adding a new event listener
      if (!message.hasAttribute('id') || message.getAttribute('id') !== 'contextmenu') {

        message.addEventListener('mousedown', event => {
          isRightMouseButton = event.button === 2;
          if (isRightMouseButton) {
            isDragging = true;
            clearTimeout(timeoutId);

            // Extract content from various types of child nodes
            const messageContent = getMessageContent(message);
            if (!selectedMessages.has(messageContent)) {
              selectedMessages.add(messageContent);
              console.log('Added new message inside the selectedMessages Set:', messageContent);
            }

            assignMessageSelection(message);
          }
        });

        message.addEventListener('mouseup', event => {
          isRightMouseButton = event.button === 2;
          if (isRightMouseButton) {
            isDragging = false;
          }
        });

        message.addEventListener('mouseover', event => {
          if (isDragging && isRightMouseButton) {
            // Extract content from various types of child nodes
            const messageContent = getMessageContent(message);
            if (!selectedMessages.has(messageContent)) {
              selectedMessages.add(messageContent);
              console.log('Added new message inside the selectedMessages Set:', messageContent);
            }

            assignMessageSelection(message);
          }
        });

        // Add id contextmenu to check in the future if the element has the event
        message.setAttribute('id', 'contextmenu');
        // Add an event listener for right-clicks on messages
        message.addEventListener('contextmenu', event => {
          // Prevent the default context menu from appearing
          event.preventDefault();
          // Wrap the message into visible selection to visually know what message will be deleted
          assignMessageSelection(message);

          // Check if a delete-message button already exists in the document
          const deleteButton = document.querySelector('.delete-message');

          if (deleteButton) {
            // If it exists, remove it
            deleteButton.remove();
          }

          // Create a new delete-message button
          const newDeleteButton = document.createElement('button');
          newDeleteButton.innerText = 'Delete';
          newDeleteButton.classList.add('delete-message');

          // Attach event click to new delete-message button
          newDeleteButton.addEventListener('click', () => {
            deleteSelectedMessages(message);
            newDeleteButton.remove();
            createToggleButton();
            selectedMessages.clear();
          });

          // Style the delete button
          assignDeleteButtonStyles(newDeleteButton, event);

          // Set the hover styles
          newDeleteButton.addEventListener('mouseenter', () => {
            newDeleteButton.style.filter = 'brightness(1.5)';
          });

          // Set the mouse leave styles
          newDeleteButton.addEventListener('mouseleave', () => {
            newDeleteButton.style.filter = 'brightness(1)';
          });

          // Append the new delete-message button to the document body
          document.body.appendChild(newDeleteButton);

          function hideDeleteButton() {
            // Set a new timeout to remove the delete button
            timeoutId = setTimeout(() => {
              if (!newDeleteButton.matches(':hover')) {
                newDeleteButton.remove();
                clearMessageSelection(message);
                selectedMessages.clear();
              }
            }, 1000);
          }

          hideDeleteButton();

          // Add event listener for the mouseleave event on the delete button
          newDeleteButton.addEventListener('mouseleave', () => {
            hideDeleteButton();
          });

          // Add event listener for the mouseenter event on the delete button to clear the previous timeout
          newDeleteButton.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
          });

        });
      }
    });
  }

  // Function to extract content from various types of child nodes within a message element
  function getMessageContent(messageElement) {
    // Query the .time and .username elements
    const timeElement = messageElement.querySelector('.time');
    const usernameElement = messageElement.querySelector('.username');

    // Extract content from .time and .username elements
    const timeContent = timeElement ? timeElement.textContent.trim() : '';
    const usernameContent = usernameElement ? ` ${usernameElement.textContent.trim()} ` : '';

    // Extract content from other types of child nodes
    const otherContentArray = Array.from(messageElement.childNodes)
      .filter(node => node !== timeElement && node !== usernameElement)
      .map(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent; // Handle #text node without trimming
        } else if (node.tagName === 'A') {
          return node.getAttribute('href').trim(); // Handle #anchor (link) node
        } else if (node.tagName === 'IMG') {
          return node.title.trim(); // Handle #img node
        } else if (node.tagName === 'IFRAME') {
          return node.getAttribute('src').trim(); // Handle #iframe node
        }
        return ''; // Return empty string for other node types
      });

    // Concatenate content while respecting the order of child nodes
    const allContentArray = [timeContent, usernameContent, ...otherContentArray];

    return allContentArray.join('');
  }

  function deleteSelectedMessages() {
    // Retrieve and backup all current selectedMessages and convert into Array
    const messagesToDelete = [...selectedMessages];

    // Get all message elements
    const messages = document.querySelectorAll('.messages-content div p');

    // Loop over each selected message content
    messagesToDelete.forEach((messageContent) => {
      // Find the corresponding DOM element
      const messageElement = Array.from(messages).find(message => getMessageContent(message) === messageContent);

      // Check if the element is found before using it
      if (messageElement) {
        // Retrieve the stored deleted messages array, or create an empty array if none exist
        const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');
        // Add the deleted message content to the array if it doesn't already exist
        if (!deletedMessages.includes(messageContent)) {
          deletedMessages.push(messageContent);
        }
        // Store the updated deleted messages array in localStorage
        localStorage.setItem('deletedChatMessagesContent', JSON.stringify(deletedMessages));
        // Remove the message from the selectedMessages Set
        selectedMessages.delete(messageContent);
      }
    });

    // Hide all the messages that match the localStorage value
    wipeDeletedMessages();
  }

  // Function to remove from localStorage deleted messages values what are not anymore matching the chat message
  // And also make messages in the chat to be invisible only for whose what are matching the localStorage message
  function wipeDeletedMessages() {
    const messages = document.querySelectorAll('.messages-content div p');
    // Retrieve the stored deleted messages array
    const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');
    // Remove any deleted messages from the array that no longer exist in the chat messages container
    const newDeletedMessages = deletedMessages.filter(content => {
      return Array.from(messages).some(message => getMessageContent(message) === content);
    });
    // Remove messages from the chat that match the deleted messages in localStorage
    deletedMessages.forEach(deletedMessage => {
      messages.forEach(message => {
        if (getMessageContent(message) === deletedMessage) {
          message.style.display = 'none';
        }
      });
    });
    // Store the updated deleted messages array in localStorage
    localStorage.setItem('deletedChatMessagesContent', JSON.stringify(newDeletedMessages));
  } // wipeDeletedMessages END

  // Declare toggleButton variable outside of the function so it is a global variable
  let toggleButton;

  // Function to create the button only if localStorage "deletedChatMessagesContent" has at least one deleted message value
  function createToggleButton() {
    // Retrieve the stored deleted messages array
    const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');

    // Only create the toggle button if there are deleted messages to show/hide
    if (deletedMessages.length > 0) {
      // Check if the button already exists in the DOM
      toggleButton = document.getElementById('toggleButton');
      if (toggleButton === null) {
        // Create the toggle button
        toggleButton = document.createElement('button');
        toggleButton.id = 'toggleButton';
        toggleButton.addEventListener('click', toggleHiddenMessages);
        toggleButton.style.position = 'absolute';
        toggleButton.style.top = '0';
        toggleButton.style.right = '0';
        toggleButton.style.padding = '8px 16px';
        // Initial textContent if at least one message is hidden
        toggleButton.innerText = 'Hidden';
        // Initial styles for the Hidden button
        assignHiddenButtonStyle(toggleButton);
        toggleButton.style.transition = 'all 0.3s';
        toggleButton.style.filter = 'brightness(1)';
        let backupTextContent = toggleButton.textContent;

        // Set the hover styles
        toggleButton.addEventListener('mouseenter', () => {
          if (isCtrlKeyPressed) {
            backupTextContent = toggleButton.textContent;
            toggleButton.textContent = 'Restore';
            toggleButton.style.filter = 'grayscale(1) brightness(2)';
          } else {
            toggleButton.style.filter = 'grayscale(0) brightness(2)';
          }
        });

        // Set the mouse leave styles
        toggleButton.addEventListener('mouseleave', () => {
          const isRestore = toggleButton.textContent === 'Restore';
          if (isCtrlKeyPressed || !isCtrlKeyPressed && isRestore) {
            toggleButton.textContent = backupTextContent;
          }
          toggleButton.style.filter = 'hue-rotate(0) brightness(1)';
        });

        messagesContainer.appendChild(toggleButton);
      }
    }
  }

  // Function to toggle messages display state from "NONE" to "BLOCK" and reverse
  function toggleHiddenMessages() {
    const messages = document.querySelectorAll('.messages-content div p');
    // Retrieve the stored deleted messages array
    const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');

    if (isCtrlKeyPressed) {
      // Set deletedChatMessagesContent in local storage as an empty array
      localStorage.setItem('deletedChatMessagesContent', JSON.stringify([]));

      // Display all messages
      messages.forEach(message => {
        message.style.display = 'block';
        message.style.removeProperty('background-color');
        message.style.removeProperty('box-shadow');
        message.style.removeProperty('background-clip');
      });

      toggleButton.remove();
    }

    if (!isCtrlKeyPressed) {

      // Check if there are any deleted messages in the local storage
      if (deletedMessages.length === 0) {
        // Hide the toggle button if there are no deleted messages
        toggleButton.style.display = 'none';
        return;
      } else {
        // Show the toggle button if there are deleted messages
        toggleButton.style.display = 'block';
      }

      // Toggle the display of each message that matches the key "deletedChatMessagesContent" data
      messages.forEach(message => {
        const messageContent = getMessageContent(message);

        if (deletedMessages.includes(messageContent)) {
          // Show hidden messages if innerText is "Hidden" and display equal "NONE"
          if (toggleButton.innerText === 'Hidden') {
            if (message.style.display === 'none') {
              // Change display to "BLOCK"
              message.style.display = 'block';
              // Wrap the message into visible selection to visually know what message will be deleted
              message.style.setProperty('background-color', 'hsla(0, 50%, 30%, .5)', 'important');
              message.style.setProperty('box-shadow', 'inset 0px 0px 0px 1px rgb(191, 64, 64)', 'important');
              message.style.setProperty('background-clip', 'padding-box', 'important');
            }
            // Show hidden messages if innerText is "Show" and display equal "NONE"
          } else if (toggleButton.innerText === 'Show') {
            if (message.style.display === 'none') {
              message.style.display = 'block';
              // Wrap the message into visible selection to visually know what message will be deleted
              message.style.setProperty('background-color', 'hsla(0, 50%, 30%, .5)', 'important');
              message.style.setProperty('box-shadow', 'inset 0px 0px 0px 1px rgb(191, 64, 64)', 'important');
              message.style.setProperty('background-clip', 'padding-box', 'important');
            }
          } else if (toggleButton.innerText === 'Hide') {
            if (message.style.display === 'block') {
              message.style.display = 'none';
              message.style.removeProperty('background-color');
              message.style.removeProperty('box-shadow');
              message.style.removeProperty('background-clip');
            }
          }
        }
      });

      // Toggle the button text and style
      if (toggleButton.innerText === 'Hide') {
        toggleButton.innerText = 'Show';
        assignShowButtonStyle(toggleButton);
      } else {
        toggleButton.innerText = 'Hide';
        assignHideButtonStyle(toggleButton);
      }

    }

  } // toggleHiddenMessages function END

  // Icon for the disabled chat button
  const iconDenied = `<svg xmlns="${svgUrl}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(255, 100, 100)" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-slash">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
      </svg>`;

  function checkForChatState() {
    // Get references to the chat field and send button elements
    let chatField = document.querySelector('.chat .text');
    let chatSend = document.querySelector('.chat .send');

    // Define the text patterns to check for in the chatField value
    const blockedChatMessage = 'Вы не можете отправлять сообщения'; // Message indicating sending is blocked
    const lostConnectionMessage = 'Связь с сервером потеряна'; // Message indicating connection loss

    const initialTimeoutDuration = 5000; // Default timeout duration in milliseconds
    // Get the previous timeout duration from localStorage, or use 5000 (5 seconds) if not set
    let timeoutDuration = parseInt(localStorage.getItem('chatTimeoutDuration')) || initialTimeoutDuration;

    // Function to handle changes when the chatField gets disabled
    const handleChatStateChange = async () => {
      // Reset timeout to 3 seconds only once at the beginning, if it's not the default
      if (!chatField.disabled && timeoutDuration !== initialTimeoutDuration) {
        timeoutDuration = initialTimeoutDuration;
        localStorage.setItem('chatTimeoutDuration', timeoutDuration.toString());
        return;
      }

      // Get the current value of chatField
      const chatFieldValue = chatField.value;

      // If the chatField is disabled, check for the blocked or lost connection messages
      if (chatField.disabled) {
        // If the chatField contains the blocked message
        if (chatFieldValue.includes(blockedChatMessage)) {
          // Enable the chatField and send button, applying styles to indicate the state
          chatField.disabled = chatSend.disabled = false; // Enable chatField and send button
          // Apply styles to the chatSend button with !important
          chatSend.style.setProperty('background-color', 'rgb(160, 35, 35)', 'important');
          chatSend.style.setProperty('background-image', `url("data:image/svg+xml,${encodeURIComponent(iconDenied)}")`, 'important');
          chatSend.style.setProperty('background-repeat', 'no-repeat', 'important');
          chatSend.style.setProperty('background-position', 'center', 'important');
          chatSend.style.setProperty('color', 'transparent', 'important');
          chatField.value = null; // Clear the chatField content
        }
        // If the chatField contains the lost connection message
        else if (chatFieldValue.includes(lostConnectionMessage)) {
          // Increment the timeout duration by 1 second (1000 ms) and store it in localStorage
          timeoutDuration += 1000;
          localStorage.setItem('chatTimeoutDuration', timeoutDuration.toString());

          // Reload the page after the timeout duration
          await new Promise(resolve => setTimeout(resolve, timeoutDuration));
          window.location.reload();
        }
      }
    };

    // Run the function once on page load
    handleChatStateChange();

    // Observe the chatField for 'disabled' attribute changes
    if (chatField) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          // Run the function when the 'disabled' attribute changes
          if (mutation.attributeName === 'disabled') handleChatStateChange();
          console.log('Mutation observer triggered:', mutation);
        });
      });
      observer.observe(chatField, { attributes: true });
    }
  }

  // CHAT SWITCHER

  // Get all elements with the 'general' class
  let generalChatTabs = document.querySelectorAll('.general');
  // Get all elements with the 'game' class
  let gameChatTabs = document.querySelectorAll('.game');

  // Function to set focus on the chat input field based on the current URL on page load
  function setChatFieldFocus() {
    // Check if the chat is closed or opened
    const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');

    // Determine the current URL and chat type based on URL keywords
    const currentURL = window.location.href;
    let chatInput; // Variable to store the chat input element

    if (currentURL.includes('gamelist')) {
      // If the URL contains "gamelist," it's a general chat
      chatInput = document.querySelector('#chat-general .text');
    } else if (currentURL.includes('gmid')) {
      // If the URL contains "gmid," it's a game chat
      chatInput = document.querySelector('[id^="chat-game"] .text');
    }

    // Run if the chat is not closed and a chat input element is found
    if (!chatHidden && chatInput) {
      chatInput.focus(); // Set focus on the selected chat input field
    }
  }

  // Function to set focus on the chat input field based on active chat tab on tab key press
  function toggleFocusAndSwitchTab() {
    // Check if the chat is closed or opened
    const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');

    // Get general chat tabs and game chat tabs
    let generalChatTabs = document.querySelectorAll('.general');
    let gameChatTabs = document.querySelectorAll('.game');

    // Find the first visible general chat tab that is not active
    let visibleGeneralChatTab = Array.from(generalChatTabs).find(function (tab) {
      let computedStyle = window.getComputedStyle(tab);
      return computedStyle.display !== 'none' && !tab.classList.contains('active');
    });

    // Find the first visible game chat tab that is not active
    let visibleGameChatTab = Array.from(gameChatTabs).find(function (tab) {
      let computedStyle = window.getComputedStyle(tab);
      return computedStyle.display !== 'none' && !tab.classList.contains('active');
    });

    // Run if a chat tab is found
    if (!chatHidden && (visibleGeneralChatTab || visibleGameChatTab)) {
      // Click on the visible chat tab
      if (visibleGeneralChatTab) {
        visibleGeneralChatTab.click();
      } else if (visibleGameChatTab) {
        visibleGameChatTab.click();
      }

      // Determine the chat input element based on visible tabs
      let chatInput; // Variable to store the chat input element

      if (visibleGeneralChatTab) {
        // If the visible chat tab is a general chat tab, focus on general chat input
        chatInput = document.querySelector('#chat-general .text');
      } else if (visibleGameChatTab) {
        // If the visible chat tab is a game chat tab, focus on game chat input
        chatInput = document.querySelector('[id^="chat-game"] .text');
      }

      // Run if a chat input element is found
      if (chatInput) {
        chatInput.focus(); // Set focus on the selected chat input field
      }
    }
  }

  // Function to handle click event and log the clicked element
  function switchChatTab(event) {
    console.log('Clicked element:', event.target);
    let activeTab = event.target.classList.contains('general') ? 'general' : 'game';
    localStorage.setItem('activeChatTab', activeTab);
  }

  // Add click event listeners to the general chat tabs
  generalChatTabs.forEach(function (tab) {
    tab.addEventListener('click', switchChatTab);
  });

  // Add click event listeners to the game chat tabs
  gameChatTabs.forEach(function (tab) {
    tab.addEventListener('click', switchChatTab);
  });

  // Add keydown event listener to the document
  document.addEventListener('keydown', function (event) {
    // Check if the Tab key is pressed
    if (event.key === 'Tab') {
      // Call toggleFocusAndSwitchTab function when Tab key is pressed
      toggleFocusAndSwitchTab();
      // Prevent the default tab behavior (moving focus to the next element in the DOM)
      event.preventDefault();
    }
  });

  // Function to restore chat tab from localStorage and set the focus for game page
  function restoreChatTabAndFocus() {
    let activeTab = localStorage.getItem('activeChatTab');
    let chatInput; // Variable to store the chat input element to be focused

    if (activeTab === 'general') {
      let visibleGeneralChatTab = Array.from(generalChatTabs).find(function (tab) {
        let computedStyle = window.getComputedStyle(tab);
        return computedStyle.display !== 'none' && !tab.classList.contains('active');
      });
      if (visibleGeneralChatTab) {
        visibleGeneralChatTab.click();
        chatInput = document.querySelector('#chat-general .text');
      }
    } else if (activeTab === 'game') {
      let visibleGameChatTab = Array.from(gameChatTabs).find(function (tab) {
        let computedStyle = window.getComputedStyle(tab);
        return computedStyle.display !== 'none' && !tab.classList.contains('active');
      });
      if (visibleGameChatTab) {
        visibleGameChatTab.click();
        chatInput = document.querySelector('[id^="chat-game"] .text');
      }
    }

    // Set focus on the chat input field if chatInput is defined
    if (chatInput) {
      chatInput.focus();
    }
  }

  // Function to break text into pieces of a maximum length
  function breakSentence(text) {
    const maxLength = 300; // Maximum length of each piece
    const words = text.split(' '); // Split the text into words
    const pieces = []; // Array to hold the final pieces
    let currentPiece = ''; // Variable to build the current piece

    words.forEach((word) => {
      // Check if adding the next word would exceed maxLength
      if ((currentPiece + word).length > maxLength) {
        // Push the current piece to pieces and reset currentPiece
        pieces.push(currentPiece.trim());
        currentPiece = word + ' '; // Start a new piece with the current word
      } else {
        currentPiece += word + ' '; // Add the word to the current piece
      }
    });

    // Push the last piece if it exists
    if (currentPiece) {
      pieces.push(currentPiece.trim());
    }

    return pieces;
  }

  // Function to send the message in parts
  async function sendMessageInParts(message) {
    const pieces = breakSentence(message); // Break the message into pieces
    const inputField = document.querySelector('.text'); // Get the input field element
    const sendButton = document.querySelector('.send'); // Get the send button element

    // Disable the input field only if the message is longer than 300 characters
    const isLongMessage = message.length > 300;
    if (isLongMessage) {
      inputField.disabled = true; // Disable input field for long messages
    }

    for (let index = 0; index < pieces.length; index++) {
      // Set the input field to the current piece
      const fullMessage = pieces[index]; // Use the current piece
      inputField.value = fullMessage;

      // Log each piece and its length
      console.log(`Sending piece ${index + 1}: "${fullMessage}" (Length: ${fullMessage.length})`);

      // Simulate sending the message
      sendButton.click(); // Click the send button

      // If not the last piece, generate a random delay before sending the next one
      if (index < pieces.length - 1) {
        const randomDelay = Math.floor(Math.random() * 500) + 500; // 500 ms to 1000 ms
        console.log(`Waiting for ${randomDelay} ms before sending the next piece.`);
        await new Promise(resolve => setTimeout(resolve, randomDelay)); // Use await for async delay
      }
    }

    // Re-enable the input field after all pieces have been sent, if it was disabled
    if (isLongMessage) {
      inputField.disabled = false;
    }
  }

  // Function to set up the input field listener
  function setupInputFieldListener() {
    const inputField = document.querySelector('.text'); // Get the input field element
    inputField.setAttribute('maxlength', '1000'); // Set the initial maxlength attribute to 1000
    inputField.addEventListener('keydown', (event) => {
      const message = inputField.value; // Get the current message
      // Check if the pressed key is Enter
      if (event.key === 'Enter') {
        // If the message is longer than 300, prevent the default behavior and send it in parts
        if (message.length > 300) {
          event.preventDefault(); // Prevent the default behavior (like a newline)
          // Call the function to send the message in parts
          sendMessageInParts(message);
          console.log(`Long message processed: "${message}"`);

          // Clear the input field after sending
          inputField.value = '';
        } else {
          // If the message is no longer than 300, just allow the default behavior (like a newline)
          console.log(`Short message processed: "${message}"`);
        }
      }
    });
  }

  // Function to set up input field backup and restore
  function setupInputBackup(inputSelector) {
    const inputField = document.querySelector(inputSelector); // Select the input element
    if (inputField) {
      // Restore the input value
      inputField.value = localStorage.getItem('inputBackup') || '';
      // Backup on input with debounce
      inputField.addEventListener('input', debounce(() => localStorage.setItem('inputBackup', inputField.value), 250));
      // Clear local storage on Enter
      inputField.addEventListener('keydown', (event) => { if (event.key === 'Enter') localStorage.removeItem('inputBackup'); });
    }
  }

  // create a new MutationObserver to wait for the chat to fully load with all messages
  let waitForChatObserver = new MutationObserver(mutations => {
    // Get the container for all chat messages
    const messagesContainer = document.querySelector('.messages-content div');
    // Get all the message elements from messages container
    const messages = document.querySelectorAll('.messages-content div p');

    // check if the chat element has been added to the DOM
    if (document.contains(messagesContainer)) {


      // check if there are at least 20 messages in the container
      if (messages.length >= 20) {
        // stop observing the DOM
        waitForChatObserver.disconnect();
        // Call the function to check for chat state and handle changes when the chatField gets disabled
        checkForChatState();
        // Remove ignored users' messages if the page is not initialized
        removeIgnoredUserMessages();
        // Convert image links to visible image containers
        convertImageLinksToImage('generalMessages');
        // Convert YouTube links to visible iframe containers
        convertYoutubeLinksToIframe('generalMessages'); // For general chat
        // Restore chat tab from localStorage
        restoreChatTabAndFocus();
        // Call the function with the selector for the input field
        setupInputBackup('#chat-general .text');
        // Call the function to re-highlight all the mention words of the messages
        highlightMentionWords();
        // Call the function to apply the chat message grouping
        applyChatMessageGrouping();
        // Call the function to scroll to the bottom of the chat
        scrollMessagesToBottom();
        // Call the function to refresh the user list and clear the cache if needed
        refreshFetchedUsers(false, cacheRefreshThresholdHours);
        // Refresh experimental custom chat user list on old list changes
        refreshUserList();
        // Call the setChatFieldFocus function when the page loads
        setChatFieldFocus();
        // Execute the function to trigger the process of chat cleaning after the youtube and images convertation to avoid issues
        executeMessageRemover();
        // Initialize the input field listener to handle message sending when Enter is pressed
        setupInputFieldListener();
      }
    }
  });

  // start observing the DOM for changes
  waitForChatObserver.observe(document, { childList: true, subtree: true });
})();