// ==UserScript==
// @name         KG_Chat_Empowerment
// @namespace    klavogonki
// @version      0.2
// @description  Enhance the chat abilities
// @author       Patcher
// @match        *://klavogonki.ru/g*
// @grant        none
// ==/UserScript==

(function () {

  // USERS DEFINITION

  // Your actual nickname to use it as an exclusion for the message beep and voice notifications
  const myNickname = document.querySelector('.userpanel .user-block .user-dropdown .name span').textContent;

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
  const usersToTrack = [
    { name: 'Даниэль', gender: 'male', pronunciation: 'Даниэль' }, // ------------ 01
    { name: 'певец', gender: 'male', pronunciation: 'Певец' }, // ---------------- 02
    { name: 'Баристарх', gender: 'male', pronunciation: 'Баристарх' }, // -------- 03
    { name: 'madinko', gender: 'female', pronunciation: 'Мадинко' }, // ---------- 04
    { name: 'Переборыч', gender: 'male', pronunciation: 'Переборыч' }, // -------- 05
    { name: 'Advisor', gender: 'male', pronunciation: 'Адвайзер' }, // ----------- 06
    { name: 'Хеопс', gender: 'male', pronunciation: 'Хеопс' }, // ---------------- 07
    { name: 'Рустамко', gender: 'male', pronunciation: 'Рустамко' }, // ---------- 08
    { name: 'ExpLo1t', gender: 'female', pronunciation: 'Эксплоит' }, // --------- 09
    { name: 'инфо-пчелы', gender: 'male', pronunciation: 'Инфо-Пчёлы' }, // ------ 10
    { name: 'Razmontana', gender: 'male', pronunciation: 'Размонтана' }, // ------ 11
    { name: 'un4given', gender: 'male', pronunciation: 'Унч' }, // --------------- 12
    { name: 'iChessKnock', gender: 'male', pronunciation: 'Чеснок' }, // --------- 13
    { name: 'TolikWorkaholic', gender: 'male', pronunciation: 'Анатолий' } // ---- 14
  ];

  // Notify me if someone is addressing to me using such aliases
  // Case-insensitive. It can be written fully in lowercase or fully in uppercase or in any other ways.
  const mentionKeywords = [
    // Actual nickname
    myNickname,
    // Possible nickname keywords
    'Душа',
    'Панчер'
  ];


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
    // Define the voice for text to speech as Pavel
    let voice = voices.find(voice => voice.name === 'Microsoft Pavel - Russian (Russia)');

    // If the voices list is empty, wait for it to populate
    if (voices.length === 0) {
      synth.addEventListener('voiceschanged', () => {
        voices = synth.getVoices();
        voice = voices.find(voice => voice.name === 'Microsoft Pavel - Russian (Russia)');
        // If the voice is found, continue with the initialization
        if (voice) {
          // Define the utterance object as a global variable
          const utterance = new SpeechSynthesisUtterance();
          // Set the "lang" property of the utterance object to 'ru-RU'
          utterance.lang = 'ru-RU';
          // Set the "voice" property of the utterance object to the Russian voice
          utterance.voice = voice;
          // Resolve the promise
          resolve({ synth, utterance, voices, voice });
        }
      });
    } else {
      // Define the utterance object as a global variable
      const utterance = new SpeechSynthesisUtterance();
      // Set the "lang" property of the utterance object to 'ru-RU'
      utterance.lang = 'ru-RU';
      // Set the "voice" property of the utterance object to the Russian voice
      utterance.voice = voice;
      // Resolve the promise
      resolve({ synth, utterance, voices, voice });
    }
  });

  function textToSpeech(text, voiceSpeed = voiceSpeed) {
    return new Promise(async (resolve) => {
      // Wait for the voices to be loaded
      const { synth, utterance, voices, voice } = await awaitVoices;

      // Replace underscores with spaces
      const message = text.replace(/_/g, ' ');

      // Set the text content of the utterance
      utterance.text = message;
      // Set the speed of the utterance
      utterance.rate = voiceSpeed;
      // Calculate the volume of the utterance based on the global volume value
      // const dynamicVolume = volume * 6;
      // Set the volume of the utterance
      // utterance.volume = dynamicVolume;
      utterance.volume = voiceVolume;
      // Set the pitch of the utterance
      utterance.pitch = voicePitch;
      // Set the voice of the utterance
      utterance.voice = voice;

      // Speak the utterance
      synth.speak(utterance);

      // Wait for the utterance to end before resolving the Promise
      utterance.onend = () => {
        resolve();
      };
    });
  }

  const verbs = {
    male: { enter: 'зашёл', leave: 'вышел' },
    female: { enter: 'зашла', leave: 'вышла' }
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

  // Reference for the existing popup
  let previousPopup = null;

  function showUserAction(user, action, presence) {
    // Make sure if the user is tracked to notify about presence in the chat to leave static stamps
    const isTrackedUser = usersToTrack.some((trackedUser) => trackedUser.name === user);

    if (isTrackedUser) {
      // Get current time in format "[hour:minutes:seconds]"
      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });


      // Create a new div element for the chat notification
      const chatNotification = document.createElement('div');

      // Set the text content of the chat notification to include the user, action, and time
      chatNotification.innerText = `${user} ${action} в ${time}`;

      // Check if the presence is true or false
      if (presence) {
        // Add the 'user-entered' class to the chat notification
        chatNotification.classList.add('user-entered');
        // Set the background color, font color, and border color for the chat notification
        chatNotification.style.color = getHSLColor(100, 50, 50);
        chatNotification.style.backgroundColor = getHSLColor(100, 50, 10);
        chatNotification.style.setProperty('border', `1px solid ${getHSLColor(100, 50, 25)}`, 'important');
      } else {
        // Add the 'user-left' class to the chat notification
        chatNotification.classList.add('user-left');
        // Set the background color, font color, and border color for the chat notification
        chatNotification.style.color = getHSLColor(0, 50, 70);
        chatNotification.style.backgroundColor = getHSLColor(0, 50, 15);
        chatNotification.style.setProperty('border', `1px solid ${getHSLColor(0, 50, 40)}`, 'important');
      }

      // Set the padding, display, and margin for the chat notification
      chatNotification.style.padding = '4px';
      chatNotification.style.display = 'inline-flex';
      chatNotification.style.margin = '4px 2px';
      chatNotification.style.fontSize = '0.8em';

      // Get the container for all chat messages
      const messagesContainer = document.querySelector('.messages-content div');

      // Append the chat notification to the messages container
      messagesContainer.appendChild(chatNotification);

      // Call the function to scroll to the bottom of the chat
      scrollMessages();
    }

    // Create the userPopup element
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

  /*
   * Converts links to images in chat messages by creating a thumbnail and a big image on click.
   * Looks for links that contain ".jpg" or ".jpeg" or ".png" or ".gif" or "webp" extension and creates a thumbnail with the image.
   * If a thumbnail already exists, it skips the link and looks for the next one.
   * When a thumbnail is clicked, it creates a dimming layer and a big image that can be closed by clicking on the dimming layer or the big image itself.
   * Allows navigation through images using the left (<) and right (>) arrow keys.
   */

  // Define global variables for the current big image and dimming background
  let bigImage = null;
  let dimming = null;

  // Define an array to store all the thumbnail links and their corresponding image URLs
  const thumbnailLinks = [];
  let currentImageIndex = 0;
  const imageChangeDelay = 50; // Prevent double slide by single press adding slight delay
  let isChangingImage = false; // Flag to track if an image change is in progress

  function convertImageLinkToImage() {
    // get the container for all chat messages
    const messagesContainer = document.querySelector('.messages-content div');
    // get all links inside the messages container
    const links = messagesContainer.querySelectorAll('p a:not(.skipped)');

    // loop through all links
    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      // List of allowed image file extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

      // Check if the link's href ends with any of the specified image extensions
      if (imageExtensions.some(ext => link.href.includes(ext))) {
        const url = new URL(link.href);
        const imageExtension = url.pathname.split('.').pop().toLowerCase();

        // Change the text content of the link to image.extension
        const imageTextContent = 'image.' + imageExtension;
        link.textContent = imageTextContent;

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

          // Add an onload event to check if the image is loaded successfully
          img.onload = function () {
            // Make an HTTP request to the image URL to check headers
            fetch(link.href, { method: 'HEAD' })
              .then(response => {
                // Check if the response content type corresponds to an image
                if (response.headers.get('content-type') && response.headers.get('content-type').startsWith('image/')) {
                  thumbnail.appendChild(img);

                  // insert the thumbnail after the link
                  link.parentNode.insertBefore(thumbnail, link.nextSibling);

                  // Store the thumbnail link and its corresponding image URL
                  thumbnailLinks.push({ link, imgSrc: link.href });

                  // add click event to thumbnail to create a big image and dimming layer
                  thumbnail.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    currentImageIndex = thumbnailLinks.findIndex((item) => item.imgSrc === link.href); // Set the currentImageIndex directly

                    const clickedImageURL = link.href; // Store the clicked image URL
                    const currentIndex = thumbnailLinks.findIndex((item) => item.imgSrc === clickedImageURL); // Find the index of the clicked image in thumbnailLinks

                    // Check if bigImage and dimming are already created
                    if (!bigImage && !dimming) {
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

                      document.body.appendChild(dimming);

                      bigImage = createBigImage(img.src, dimming);

                      bigImage.style.top = '50%';
                      bigImage.style.left = '50%';
                      bigImage.style.transform = 'translate(-50%, -50%) scale(1)';
                      bigImage.style.position = 'fixed';
                      bigImage.style.opacity = '0';
                      bigImage.style.zIndex = '999';
                      bigImage.style.transformOrigin = 'center center';

                      // Gradually increase the opacity of the dimming background and bigImage
                      let opacity = 0;
                      const interval = setInterval(() => {
                        opacity += 0.05;
                        // Change the opacity from 0 up to 0.5
                        if (opacity <= 0.5) {
                          dimming.style.opacity = opacity.toString();
                        }
                        bigImage.style.opacity = opacity.toString();

                        // Change the opacity from 0 up to 1
                        if (opacity >= 1) {
                          clearInterval(interval);
                        }
                      }, 10);

                      // Attach a keydown event listener to the document object
                      document.addEventListener('keydown', function (event) {
                        // Check if the key pressed was the "Escape" key
                        if (event.key === 'Escape') {
                          removeDimmingContainer();
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

                  // Call the function to scroll to the bottom of the chat
                  scrollMessages();

                } else {
                  // Handle the case where the fetched content is not an image
                  console.error("Not an image:", link.href);

                  // Add a class to the link to skip future conversion attempts
                  link.classList.add('skipped');
                }
              })
              .catch(error => {
                // Handle fetch errors
                console.error("Error fetching image:", error);

                // Add a class to the link to skip future conversion attempts
                link.classList.add('skipped');
              });
          };

          // Add an onerror event to handle cases where the image fails to load
          img.onerror = function () {
            // Handle the case where the image failed to load (e.g., it's a fake image)
            console.error("Failed to load image:", link.href);

            // Add a class to the link to skip future conversion attempts
            link.classList.add('skipped');
          };

          img.src = link.href;
          img.style.maxHeight = '100%';
          img.style.maxWidth = '100%';
          img.style.backgroundColor = 'transparent';
        }
      }
    }

  } // end convertImageLinkToImage

  // Function to create a big image with a dimming layer
  function createBigImage(src, dimming) {
    const bigImage = document.createElement('img');
    bigImage.src = src;
    bigImage.classList.add('scaled-thumbnail');
    bigImage.style.maxHeight = '90vh';
    bigImage.style.maxWidth = '90vw';

    document.body.appendChild(bigImage);

    // Add click event listener to the dimming background for removal
    dimming.addEventListener('click', function () {
      removeDimmingContainer();
    });

    bigImage.addEventListener('click', function () {
      removeDimmingContainer();
    });

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

    // Define the movement speed (adjust this as needed)
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

    // Add an event listener to bigImage for wheel event
    bigImage.addEventListener('wheel', handleZoom);

    // Add an event listener to bigImage for mousedown event
    bigImage.addEventListener('mousedown', function (event) {
      // Check if the middle mouse button is pressed
      if (event.button === 1) {
        // Set the dragging flag
        isDragging = true;

        // Calculate the initial position relative to the image's position
        startX = event.clientX;
        startY = event.clientY;
      }
    });

    // Function to update the image position smoothly
    function updateImagePosition(event) {
      if (isDragging) {
        // Calculate the distance moved since the last mousemove event
        const deltaX = (event.clientX - startX) / zoomScale; // Adjusted for zoomScale
        const deltaY = (event.clientY - startY) / zoomScale; // Adjusted for zoomScale

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

    // Add an event listener to document for mousemove event
    document.addEventListener('mousemove', updateImagePosition);

    // Add an event listener to document for mouseup event
    document.addEventListener('mouseup', function (event) {
      // Reset the dragging flag
      isDragging = false;
    });

    // Add an event listener to elements with class "dimming-background" for wheel event
    const dimmingBackgroundElements = document.querySelectorAll('.dimming-background');
    dimmingBackgroundElements.forEach((dimmingBackgroundElement) => {
      dimmingBackgroundElement.addEventListener('wheel', handleZoom);
    });

    // ZOOM AND MOVE -- END

    return bigImage;
  }

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

  let isRemovingDimming = false; // Add a flag to track removal process

  // Function to remove the dimming container
  function removeDimmingContainer() {
    if (dimming && !isRemovingDimming) {
      isRemovingDimming = true; // Set the flag to true

      // Gradually decrease the opacity of the dimming and bigImage elements
      let opacity = 0.5;
      const interval = setInterval(() => {
        opacity -= 0.1;
        dimming.style.opacity = opacity;
        if (bigImage) {
          bigImage.style.opacity = opacity;
        }
        if (opacity <= 0) {
          clearInterval(interval);

          // Check if the flag is still true before removing elements
          if (isRemovingDimming) {
            // Reset the currentImageIndex to 0
            currentImageIndex = 0;

            // Remove the dimming element from the document body
            document.body.removeChild(dimming);
            // Reset the global variable
            dimming = null;
            if (bigImage) {
              // Remove the bigImage element from the document body
              document.body.removeChild(bigImage);
              // Reset the global variable
              bigImage = null;
            }
            isRemovingDimming = false; // Reset the flag
          }
        }
      }, 10);
    }
  }

  // Function to convert YouTube links to embedded iframes in a chat messages container
  function convertYoutubeLinkToIframe() {
    // Get the container for all chat messages
    const messagesContainer = document.querySelector('.messages-content div');

    // Find all links inside the messages container
    const links = messagesContainer.querySelectorAll('p a');

    // Loop through each link
    for (const link of links) {
      const url = link.href;

      // Use the regular expression to match different YouTube link formats and extract the video ID
      const match = url.match(/(?:shorts\/|live\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);

      // If the link is a valid YouTube link, replace it with an embedded iframe
      if (match && match[1]) {
        // Extract the video ID from the matched result
        const videoId = match[1];

        // Create a new iframe element
        const iframe = document.createElement('iframe');

        // Set attributes and styles for the iframe
        iframe.width = '280';
        iframe.height = '157.5';
        iframe.allowFullscreen = true;
        iframe.style.display = 'flex';
        iframe.style.margin = '6px';
        iframe.style.border = 'none';

        // Set the iframe source to embed the YouTube video
        iframe.src = `https://www.youtube.com/embed/${videoId}`;

        // Replace the original link with the newly created iframe in the DOM
        link.parentNode.replaceChild(iframe, link);
      }
    }

    // Call the function to scroll to the bottom of the chat
    scrollMessages();

  } // end convertYoutubeLinkToIframe

  // // Function to highlight users from 'usersToTrack' array in the userlist
  // function highlightTrackingUsers() {
  //   // Select all ins elements from the userlist
  //   const insElements = document.querySelectorAll('.userlist-content ins');

  //   // Iterate over the ins elements and check if they contain an anchor element
  //   for (const ins of insElements) {
  //     const anchor = ins.querySelector('a.name');
  //     if (anchor) {
  //       // Retrieve the username from the anchor textContent
  //       const name = anchor.textContent.trim();
  //       // Find the user in 'usersToTrack' array by their name
  //       const userToTrack = usersToTrack.find(user => user.name === name);
  //       // If the user is found and not revoked, set their anchor text color to green
  //       if (userToTrack && !ins.classList.contains('revoked')) {
  //         anchor.style.setProperty('color', '#83cf40', 'important');
  //         anchor.style.setProperty('text-shadow', '0 0 1px #83cf40', 'important');
  //       }
  //       // If the user is found and is revoked, set their anchor text color to a red
  //       else if (userToTrack && ins.classList.contains('revoked')) {
  //         anchor.style.setProperty('color', '#ff8080', 'important');
  //         anchor.style.setProperty('text-shadow', '0 0 1px #ff8080', 'important');
  //       }
  //     }
  //   }
  // }

  const empowermentButtonsMargin = 2;

  // Retrieve body element to inject this beast elements
  const bodyElement = document.querySelector('body');
  // Create parent container for the beast elements
  const empowermentButtonsPanel = document.createElement('div');
  empowermentButtonsPanel.classList.add('empowerment-panel');

  // Create user count container to store the user count number
  const userCount = document.createElement('div');
  userCount.classList.add('user-count-indicator');
  userCount.style.filter = 'grayscale(100%)';
  userCount.style.transition = '0.2s ease-in-out';
  userCount.style.fontFamily = 'Orbitron';
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
  // Append panel element inside the body
  bodyElement.appendChild(empowermentButtonsPanel);

  const userCountStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');

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


  // NEW CHAT CACHE CONTROL PANEL (START)

  // Function to display the cached user list panel
  function showCachePanel() {
    // Check if the panel already exists
    if (document.querySelector('.cached-users-panel')) {
      return;
    }

    // Get data from localStorage
    const fetchedUsersData = localStorage.getItem('fetchedUsers');

    // Check if data exists
    if (fetchedUsersData) {
      // Parse JSON data
      const users = JSON.parse(fetchedUsersData);

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

      // Create a container div with class 'cached-users-panel'
      const cachedUsersPanel = document.createElement('div');
      cachedUsersPanel.className = 'cached-users-panel';
      // Set initial styles
      cachedUsersPanel.style.opacity = '0';
      cachedUsersPanel.style.transition = 'opacity 0.6s cubic-bezier(.05,.95,.45,.95)';

      cachedUsersPanel.style.backgroundColor = '#1b1b1b';
      cachedUsersPanel.style.setProperty('border-radius', '0.6em', 'important');
      cachedUsersPanel.style.position = 'fixed';
      cachedUsersPanel.style.top = '100px';
      cachedUsersPanel.style.left = '50%';
      cachedUsersPanel.style.transform = 'translateX(-50%)';
      cachedUsersPanel.style.width = '90vw';
      cachedUsersPanel.style.height = '80vh';
      cachedUsersPanel.style.zIndex = '120';

      // Helper function to smoothly hide and remove the cachedUsersPanel
      function hideCachePanel() {
        // Set the opacity to 0 to smoothly hide the element
        cachedUsersPanel.style.opacity = '0';

        // After a short delay (or transition duration), remove the element
        setTimeout(() => {
          // Remove the cachedUsersPanel from the DOM
          cachedUsersPanel.parentNode.removeChild(cachedUsersPanel);
        }, 300);
      }

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

      // Check if the font link element with class 'font-roboto-mono' already exists
      const existingFontRobotoMono = document.querySelector('.font-roboto-mono');

      // If it doesn't exist, create a new link element and append it to the document head
      if (!existingFontRobotoMono) {
        var fontLinkRobotoMono = document.createElement('link');
        fontLinkRobotoMono.rel = 'stylesheet';
        fontLinkRobotoMono.href = 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400&display=swap';
        fontLinkRobotoMono.classList.add('font-roboto-mono');

        // Append the Roboto Mono font link element to the document head
        document.head.appendChild(fontLinkRobotoMono);
      }

      // Create span with description for threshold time element 
      const dropTimeThresholdDescription = document.createElement('span');
      dropTimeThresholdDescription.className = 'drop-time-threshold-description';
      dropTimeThresholdDescription.textContent = 'Threshold';
      dropTimeThresholdDescription.style.padding = '0.6em';
      dropTimeThresholdDescription.style.color = 'gray';

      const dropTimeThreshold = document.createElement('span');
      dropTimeThreshold.className = 'drop-time-threshold';
      dropTimeThreshold.style.padding = '0.6em';
      dropTimeThreshold.style.color = 'chocolate';
      dropTimeThreshold.style.fontFamily = "'Roboto Mono', monospace";
      dropTimeThreshold.style.fontSize = '1.1em';
      dropTimeThreshold.style.cursor = 'pointer';
      // Get the value from the localStorage key 'cacheRefreshThresholdHours'
      const storedThresholdTime = localStorage.getItem('cacheRefreshThresholdHours');
      // Update the innerHTML with the stored value (default to '00:00:00' if the key is not set)
      dropTimeThreshold.innerHTML = storedThresholdTime || '00:00:00';
      // Attach click event to the dropTimeThreshold element
      dropTimeThreshold.addEventListener('click', setCacheRefreshTime);

      // Create span with description for expiration time element
      const dropTimeExpirationDescription = document.createElement('span');
      dropTimeExpirationDescription.className = 'drop-time-expiration-description';
      dropTimeExpirationDescription.textContent = 'Countdown';
      dropTimeExpirationDescription.style.padding = '0.6em';
      dropTimeExpirationDescription.style.color = 'gray';

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
          const timeRegex = /^([01]?[0-9]|2[0-3])(:([0-5]?[0-9])(:([0-5]?[0-9]))?)?$/; // HH, HH:mm, or HH:mm:ss
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

      // Create a container div with class 'panel-control-buttons'
      const panelControlButtons = document.createElement('div');
      panelControlButtons.className = 'panel-control-buttons';
      panelControlButtons.style.display = 'flex';

      // Inline SVG source for the trash icon
      const trashIconSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="darkorange" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" class="feather feather-trash-2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>`;

      // Create a clear cache button with the provided SVG icon
      const clearCacheButton = document.createElement('div');
      clearCacheButton.className = 'clear-cache-button';
      clearCacheButton.innerHTML = trashIconSVG;
      clearCacheButton.style.backgroundColor = 'brown';
      clearCacheButton.style.width = '48px';
      clearCacheButton.style.height = '48px';
      clearCacheButton.style.display = 'flex';
      clearCacheButton.style.justifyContent = 'center';
      clearCacheButton.style.alignItems = 'center';
      clearCacheButton.style.cursor = 'pointer';
      clearCacheButton.style.setProperty('border-radius', '0.2em', 'important');
      clearCacheButton.style.marginRight = '16px'; // Adjust the margin as needed

      // Add a hover effect with brightness transition
      clearCacheButton.style.filter = 'brightness(1)';
      clearCacheButton.style.transition = 'filter 0.3s ease';

      // Add a mouseover event listener to the clear cache button
      clearCacheButton.addEventListener('mouseover', () => {
        clearCacheButton.style.filter = 'brightness(0.8)';
      });

      // Add a mouseout event listener to the clear cache button
      clearCacheButton.addEventListener('mouseout', () => {
        clearCacheButton.style.filter = 'brightness(1)';
      });

      // Add a click event listener to the clear cache button
      clearCacheButton.addEventListener('click', () => {
        // Call the helper function to hide and remove the cachedUsersPanel
        hideCachePanel();
        // Call refreshFetchedUsers with conditionally set to false and cacheRefreshThresholdHours
        refreshFetchedUsers(false, cacheRefreshThresholdHours);
      });

      // Append the clear cache button to the panel header container
      panelControlButtons.appendChild(clearCacheButton);

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

      // Create a close button with the provided SVG icon
      const closePanelButton = document.createElement('div');
      closePanelButton.className = 'close-panel-button';
      closePanelButton.innerHTML = closeSVG;
      closePanelButton.style.backgroundColor = 'darkolivegreen';
      closePanelButton.style.width = '48px';
      closePanelButton.style.height = '48px';
      closePanelButton.style.display = 'flex';
      closePanelButton.style.justifyContent = 'center';
      closePanelButton.style.alignItems = 'center';
      closePanelButton.style.cursor = 'pointer';
      closePanelButton.style.setProperty('border-radius', '0.2em', 'important');

      // Add a hover effect with brightness transition
      closePanelButton.style.filter = 'brightness(1)';
      closePanelButton.style.transition = 'filter 0.3s ease';

      // Add a mouseover event listener to the close panel button
      closePanelButton.addEventListener('mouseover', () => {
        closePanelButton.style.filter = 'brightness(0.8)';
      });

      // Add a mouseout event listener to the close panel button
      closePanelButton.addEventListener('mouseout', () => {
        closePanelButton.style.filter = 'brightness(1)';
      });

      // Add a click event listener to the close panel button
      closePanelButton.addEventListener('click', () => {
        // Remove the cached-users-panel when the close button is clicked
        hideCachePanel();
      });

      // Append the close button to the panel header container
      panelControlButtons.appendChild(closePanelButton);

      // Append the panel control buttons element inside the panel header container
      panelHeaderContainer.appendChild(panelControlButtons);

      // Create a container div with class 'fetched-users'
      const fetchedUsersContainer = document.createElement('div');
      fetchedUsersContainer.className = 'fetched-users';

      // Add CSS styles for grid layout and centering
      fetchedUsersContainer.style.display = 'grid';
      fetchedUsersContainer.style.gridAutoFlow = 'dense'; // Allows items to fill empty spaces
      fetchedUsersContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
      fetchedUsersContainer.style.gridTemplateRows = 'repeat(auto-fill, minmax(60px, 1fr))';
      fetchedUsersContainer.style.gap = '12px';
      fetchedUsersContainer.style.padding = '24px';
      fetchedUsersContainer.style.overflowY = 'auto';
      fetchedUsersContainer.style.height = 'calc(100% - (64px + 0.6em))';

      // Create an array to hold user elements
      const userElements = [];

      // Iterate through each user
      Object.keys(users).forEach((userId) => {
        const userData = users[userId];

        // Create a div for each user with class 'user'
        const userElement = document.createElement('div');
        userElement.className = 'user';
        userElement.style.padding = '0.2em';
        userElement.style.margin = '0.2em';

        // Create anchor element for userId
        const userIdAnchor = document.createElement('a');
        userIdAnchor.className = 'id';
        userIdAnchor.textContent = userId;
        userIdAnchor.href = `https://klavogonki.ru/profile/${userId}`;
        userIdAnchor.target = '_blank';
        userIdAnchor.style.setProperty('color', 'skyblue', 'important');
        userIdAnchor.style.textDecoration = 'none';
        userIdAnchor.style.fontFamily = "'Roboto Mono', monospace";
        userIdAnchor.style.fontSize = '1.1em';
        userIdAnchor.style.transition = 'color 0.3s ease'; // Add smooth transition

        // Add underline on hover and change color to a lighter shade of skyblue
        userIdAnchor.addEventListener('mouseover', () => {
          userIdAnchor.style.textDecoration = 'underline';
          userIdAnchor.style.setProperty('color', 'lightblue', 'important');
        });
        userIdAnchor.addEventListener('mouseout', () => {
          userIdAnchor.style.textDecoration = 'none';
          userIdAnchor.style.setProperty('color', 'skyblue', 'important');
        });

        const rankElement = document.createElement('div');
        rankElement.className = 'rank';
        rankElement.textContent = userData.rank;
        rankElement.style.color = rankColors[userData.rank] || 'white';

        const loginElement = document.createElement('div');
        loginElement.className = 'login';
        loginElement.textContent = userData.login;
        loginElement.style.color = 'antiquewhite';

        // Append anchor, rank, and login divs to the user div
        userElement.appendChild(userIdAnchor);
        userElement.appendChild(rankElement);
        userElement.appendChild(loginElement);

        // Append the user div to the userElements array
        userElements.push({ userElement, order: rankOrder[userData.rank] || 10 });
      });

      // Sort userElements array based on order
      userElements.sort((a, b) => a.order - b.order);

      // Append sorted user elements to the fetched-users container
      userElements.forEach(({ userElement }) => {
        fetchedUsersContainer.appendChild(userElement);
      });

      // Append the panel-header container to the cached-users-panel
      cachedUsersPanel.appendChild(panelHeaderContainer);
      // Append the fetched-users container to the cached-users-panel
      cachedUsersPanel.appendChild(fetchedUsersContainer);

      // Append the cached-users-panel to the body
      document.body.appendChild(cachedUsersPanel);

      // Trigger a reflow by accessing offsetHeight to apply the initial styles
      cachedUsersPanel.offsetHeight;

      // Update the opacity to 1 to smoothly reveal the element
      cachedUsersPanel.style.opacity = '1';

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
            ? refreshFetchedUsers(false, cacheRefreshThresholdHours)
            : updatedropTimeExpiration(dropTimeExpiration, remainingTime);
        }
      }

      // Function to update the drop-time-expiration span
      function updatedropTimeExpiration(dropTimeExpiration, remainingTime) {
        // Calculate hours, minutes, and seconds
        const hours = String(Math.floor(remainingTime / (60 * 60 * 1000))).padStart(2, '0');
        const minutes = String(Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000))).padStart(2, '0');
        const seconds = String(Math.floor((remainingTime % (60 * 1000)) / 1000)).padStart(2, '0');

        // Create a custom formatted string
        const remainingTimeString = `${hours}:${minutes}:${seconds}`;

        // Update the drop-time-expiration span using the cached reference
        dropTimeExpiration.textContent = remainingTimeString;
      }

      // Call the function to update the remaining time every second
      setInterval(updateRemainingTime, 1000);

      // Initial update
      updateRemainingTime();
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
    .chat-user-list .avatar img {
        transition: transform 0.3s;
        transform-origin: left;
    }
    .chat-user-list .avatar img:hover {
        transform: scale(2);
    }

    .chat-user-list .name {
        text-decoration: none;
        display: inline-flex;
        width: auto;
        height: 24px;
        line-height: 24px;
        padding: 0 8px;
    }
    .chat-user-list .name:hover {
        text-decoration: underline;
    }

    .chat-user-list .profile,
    .chat-user-list .tracked,
    .chat-user-list .moderator {
        display: inline-flex;
        width: 24px;
        height: 24px;
        justify-content: center;
        align-items: center;
    }

    .chat-user-list svg.feather-meh,
    .chat-user-list svg.feather-smile,
    .chat-user-list svg.feather-frown {
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

  // Function to get profile summary from API or local storage cache
  async function getProfileSummary(userId) {
    return new Promise(async (resolve, reject) => {
      const cachedUserInfo = JSON.parse(localStorage.getItem('fetchedUsers')) || {};

      if (cachedUserInfo[userId]) {
        resolve({ rank: cachedUserInfo[userId].rank, login: cachedUserInfo[userId].login });
      } else {
        try {
          const apiUrl = `https://klavogonki.ru/api/profile/get-summary?id=${userId}`;
          const response = await fetch(apiUrl);

          if (!response.ok) {
            throw new Error('Network response was not ok.');
          }

          const data = await response.json();

          if (data && data.user && data.user.login && data.title) {
            const rank = data.title; // Use the title directly from the main user object
            const login = data.user.login;

            cachedUserInfo[userId] = {
              rank: rank,
              login: login,
            };

            localStorage.setItem('fetchedUsers', JSON.stringify(cachedUserInfo));
            resolve({ rank, login });
          } else {
            throw new Error('Invalid data format received from the API.');
          }
        } catch (error) {
          console.error(`Error fetching profile summary for user ${userId}:`, error);
          reject(error);
        }
      }
    });
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

  // Helper function to get a random SVG
  function getRandomIconSVG() {
    const svgs = [mehSVG, smileSVG, frownSVG];
    const randomIndex = Math.floor(Math.random() * svgs.length);
    return svgs[randomIndex];
  }

  // Array to store user IDs and their status titles
  const fetchedUsers = JSON.parse(localStorage.getItem('fetchedUsers')) || {};

  // Function to create a user element with avatar, name, and profile link based on user details
  function createUserElement(userId, mainTitle, userName, isRevoked) {
    const bigAvatarUrl = `/storage/avatars/${userId}_big.png`;

    const newUserElement = document.createElement('div');
    const rankClass = getRankClass(mainTitle);
    newUserElement.classList.add(`user${userId}`, rankClass); // Assign the rank class

    const newAvatarElement = document.createElement('div');
    newAvatarElement.classList.add('avatar');

    // Check if the .name element has the 'style' attribute
    const userElement = document.querySelector(`.userlist-content .user${userId} .name`);
    const hasStyle = userElement && userElement.hasAttribute('style');

    if (hasStyle) {
      const avatarContent = document.createElement('img'); // Create the img element
      avatarContent.src = bigAvatarUrl;
      newAvatarElement.appendChild(avatarContent); // Append the img element inside the condition
    } else {
      newAvatarElement.innerHTML = getRandomIconSVG();
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

    // Check if there is a user in 'usersToTrack' array by their name
    const userToTrack = usersToTrack.find((user) => user.name === userName);

    if (userToTrack) {
      const trackedIcon = document.createElement('div');
      trackedIcon.classList.add('tracked');
      trackedIcon.innerHTML = trackedSVG;
      newUserElement.appendChild(trackedIcon);
    }

    // Check if there is an <img> element with a src attribute containing the word "moderator" inside the ins element
    const hasModeratorIcon = document.querySelector(`.userlist-content ins.user${userId} img[src*="moderator"]`);

    if (hasModeratorIcon) {
      const moderatorIcon = document.createElement('div');
      moderatorIcon.classList.add('moderator');
      moderatorIcon.innerHTML = moderatorSVG;
      newUserElement.appendChild(moderatorIcon);
    }

    return newUserElement;
  }

  // Function to update users in the custom chat
  async function refreshUserList() {
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
            // Use getProfileSummary instead of getMainTitle
            const { rank: mainTitle, login } = await getProfileSummary(userId);

            if (!fetchedUsers[userId]) {
              fetchedUsers[userId] = { rank: mainTitle, login };
              localStorage.setItem('fetchedUsers', JSON.stringify(fetchedUsers));
            }

            // Pass the new parameter isRevoked to createUserElement
            const isRevoked = userElement.classList.contains('revoked');

            const rankClass = getRankClass(mainTitle);

            // Check if the user with the same ID already exists in the corresponding rank group
            const existingUserElement = rankSubparents[rankClass].querySelector(`.user${userId}`);
            if (!existingUserElement) {
              const newUserElement = createUserElement(userId, mainTitle, userName, isRevoked);

              // Add the user to the corresponding rank group
              rankSubparents[rankClass].appendChild(newUserElement);
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
  const defaultCacheRefreshThresholdHours = 8;

  // Get the value from localStorage
  let storedFresholdTimeKey = localStorage.getItem('cacheRefreshThresholdHours');

  // If the key doesn't exist, set it to the default value
  if (!storedFresholdTimeKey) {
    storedFresholdTimeKey = defaultCacheRefreshThresholdHours;
    localStorage.setItem('cacheRefreshThresholdHours', storedFresholdTimeKey);
  }

  // Convert the value to single hours
  let cacheRefreshThresholdHours = convertToSingleHours(storedFresholdTimeKey);

  // Function to refresh fetched users with optional conditional behavior
  // @param {boolean} conditionally - If true, clears the cache conditionally; if false, clears unconditionally (default is true)
  // @param {number} thresholdHours - Time threshold in hours for conditional cache clearing (default is 8 hours)
  function refreshFetchedUsers(conditionally = true, thresholdHours) {

    const shouldShowCachePanel = JSON.parse(localStorage.getItem('shouldShowCachePanel')) ??
      (() => { localStorage.setItem('shouldShowCachePanel', false); return false; })();

    // Check if shouldShowCachePanel is true, then call the showCachePanel function
    if (shouldShowCachePanel) {
      // Call showCachePanel function to show the cache panel
      setTimeout(() => showCachePanel(), 2000);

      // Set shouldShowCachePanel to false after calling showCachePanel
      localStorage.setItem('shouldShowCachePanel', false);
    }

    // Set the default threshold to 24 hours if not provided at the function call
    thresholdHours = thresholdHours !== undefined ? thresholdHours : 8;

    // Retrieve the last clear time from localStorage
    const lastClearTime = localStorage.getItem('lastClearTime');

    // Check if cache clearing should be done conditionally
    if (conditionally) {
      // Determine if the cache should be cleared based on the time elapsed
      const shouldClearCache = !lastClearTime || (new Date().getTime().toString() - lastClearTime) / (1000 * 60 * 60) >= thresholdHours;

      // If cache should be cleared, perform the following actions
      if (shouldClearCache) {
        // Conditionally remove 'fetchedUsers' and set 'lastClearTime'
        localStorage.removeItem('fetchedUsers');
        localStorage.setItem('lastClearTime', new Date().getTime().toString());

        // Set the 'nextClearTime' in localStorage
        const nextClearTime = new Date().getTime() + thresholdHours * 60 * 60 * 1000;
        localStorage.setItem('nextClearTime', nextClearTime.toString());

        // Set shouldShowCachePanel to true after performing automatic cache clearing
        localStorage.setItem('shouldShowCachePanel', true);

        // Alert for automatic cache clearing triggered by the function
        alert(`Automatic cache clearing is triggered by the function. Next clearing time: ${new Date(nextClearTime)}`);

        // Reload the current page after (N) time conditionally
        setTimeout(() => location.reload(), 1000);
      }
    } else {
      // Unconditionally remove 'fetchedUsers' and set 'lastClearTime'
      localStorage.removeItem('fetchedUsers');
      localStorage.setItem('lastClearTime', new Date().getTime().toString());

      // Set the 'nextClearTime' in localStorage
      const nextClearTime = new Date().getTime() + thresholdHours * 60 * 60 * 1000;
      localStorage.setItem('nextClearTime', nextClearTime.toString());

      // Set shouldShowCachePanel to true after performing manual cache clearing
      localStorage.setItem('shouldShowCachePanel', true);

      // Alert for manual cache clearing triggered by the user
      alert(`Manual cache clearing is triggered by the user. Next clearing time: ${new Date(nextClearTime)}`);

      // Reload the current page after (N) time unconditionally
      setTimeout(() => location.reload(), 1000);
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
  let isAnimating = false;

  // Define a constant to set the debounce delay
  const debounceTimeout = 1000;

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
        if (!chatHidden && currentTextContent.length === 0 && newUserList.length > 0 && !isAnimating) {
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
                isAnimating = false; // set isAnimating to false after the animation
              }, 500);
            }
          };
          setTimeout(userCountIncrement, speed);
        } // Animation END

        // Check if chat is not closed and animation not in progress
        if (!chatHidden && !isAnimating) {
          // Check if the user count has changed and add pulse animation
          if (userCountValue !== prevUserCountValue) {
            userCount.classList.add('pulse');
            // Updating the counter element value
            userCount.innerHTML = userCountValue;
            setTimeout(() => {
              userCount.classList.remove('pulse');
            }, 1000);
          }
        }

        // Check if chat is not closed and animation is not in progress
        if (!chatHidden && hasObservedChanges) {
          newUsers.forEach((newUser) => {
            if (!previousUsers.includes(newUser)) {
              const userGender = getUserGender(newUser) || 'male'; // use 'male' as default
              const action = verbs[userGender].enter;
              showUserAction(newUser, action, true);
              // Prevent voice notification if mode is silence
              if (!isSilence && usersToTrack.some(user => user.name === newUser)) {
                userAction(newUser, "enter", userGender);
              }
            }
          });

          leftUsers.forEach((leftUser) => {
            const userGender = getUserGender(leftUser) || 'male'; // use 'male' as default
            const action = verbs[userGender].leave;
            showUserAction(leftUser, action, false);
            // Prevent voice notification if mode is silence
            if (!isSilence && usersToTrack.some(user => user.name === leftUser)) {
              userAction(leftUser, "leave", userGender);
            }
          });

          // Refresh experimental custom chat user list on old list changes
          refreshUserList();

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

  // // Create a separate MutationObserver to watch for changes to the tracking user list
  // const trackingUsersObserver = new MutationObserver(() => {
  //   // Whenever the tracking user list changes, call the highlightTrackingUsers function
  //   highlightTrackingUsers();
  // });

  // // Start observing the tracking user list for changes to highlight them
  // trackingUsersObserver.observe(userList, { childList: true });

  // Button to close the chat
  const chatCloseButton = document.querySelector('.mostright');

  // Event listener for keydown event
  document.addEventListener('keydown', (event) => {
    // Check if Ctrl key and Space key are pressed simultaneously
    if (event.ctrlKey && event.key === ' ') {
      // Trigger click event on chatCloseButton
      chatCloseButton.click();
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
    }
  });


  // EVERY NEW MESSAGE READER

  // Initialize the variable to keep track of the last username seen
  let lastUsername = null;

  // Set the flag as false for the mention beep sound to trigger at first usual beep sound for usual messages
  let isMention = false;

  // Function to check if a username is mentioned in the message
  function isMentionForMe(message) {
    // return mentionKeywords.some(keyword => message.includes(keyword));
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

  // Function what will highlight every mention word in the mention message only
  function highlightMentionWords() {
    // Get the container for all chat messages
    const messagesContainer = document.querySelector('.messages-content div');
    // Get all the message elements from messages container
    const messages = messagesContainer.querySelectorAll('.messages-content div p');

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
  }

  // Function to get the cleaned text content of the latest message with username prefix
  function getLatestMessageTextContent() {
    const messageElement = document.querySelector('.messages-content div p:last-child');
    if (!messageElement) {
      return null;
    }

    const isTextNode = (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '';
    const textNodes = [...messageElement.childNodes].filter(isTextNode);
    const messageText = textNodes.map(node => node.textContent).join('').trim();

    const username = messageElement.querySelector('.username');
    let usernameText = username ? username.textContent : null;

    // Check if usernameText is not null before replacing "<" and ">" symbols
    if (usernameText !== null) {
      // Remove the "<" and ">" symbols from the username if they are present
      usernameText = usernameText.replace(/</g, '').replace(/>/g, '');
    }

    let usernamePrefix = '';

    // If the current username is an alias what is about you, use a "is addressing" prefix
    if (isMentionForMe(messageText)) {
      isMention = true;
      usernamePrefix = `${replaceWithPronunciation(usernameText)} обращается: `;
      highlightMentionWords();
    }
    // If the current username is the same as the last username seen, use a "is writing" prefix
    else if (usernameText !== lastUsername) {
      isMention = false;
      usernamePrefix = `${replaceWithPronunciation(usernameText)} пишет: `;
    }

    lastUsername = usernameText;

    const messageWithPronunciation = `${usernamePrefix}${replaceWithPronunciation(messageText)}`;
    return { messageText: messageWithPronunciation, usernameText: username };
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

  // Scrolls the chat container to the bottom if the user has scrolled close enough
  function scrollMessages() {
    // Get the chat container
    const chatContainer = document.querySelector(".messages-content");

    // If it's the user's first time loading messages, auto-scroll to the bottom
    if (firstTime) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
      firstTime = false;
    } else {
      // Calculate how far the user is from the bottom
      const distanceFromBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
      // If the user is close enough to the bottom, auto-scroll to the bottom
      if (distanceFromBottom <= scrollThreshold) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
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

  // Jaro-Winkler Distance Calculation Function
  function calculateDistance(s1, s2) {
    const windowSize = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = Array(s1.length).fill(false);
    const s2Matches = Array(s2.length).fill(false);
    let commonMatches = 0;

    // Distance calculation
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(i + windowSize + 1, s2.length);

      for (let j = start; j < end; j++) {
        if (!s2Matches[j] && s1[i] === s2[j]) {
          s1Matches[i] = s2Matches[j] = true;
          commonMatches++;
          break;
        }
      }
    }

    if (commonMatches === 0) {
      return 0; // No common characters, distance is 0
    }

    // Transposition calculation
    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (s1Matches[i]) {
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k++]) transpositions++;
      }
    }

    const similarity = (commonMatches / s1.length + commonMatches / s2.length + (commonMatches - transpositions) / commonMatches) / 3;

    // Adjustment
    const prefixLength = Math.min(4, Math.min(s1.length, s2.length));
    let commonPrefix = 0;
    for (let i = 0; i < prefixLength && s1[i] === s2[i]; i++) {
      commonPrefix++;
    }

    const adjustment = commonPrefix * 0.1 * (1 - similarity);

    const distance = similarity + adjustment;

    return distance;
  }


  // Extracts Message Text, Excludes First Word if Ends with Comma
  function extractMessageText(message) {
    const messageContent = Array.from(message.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .join(' ');

    const words = messageContent.split(/\s+/);

    if (words.length > 1) {
      // Check if the first word ends with a comma
      const firstWord = words[0];
      const isCommaSeparated = firstWord.endsWith(',');

      // Exclude the first word if it ends with a comma
      const [, ...remainingWords] = words;

      return isCommaSeparated ? remainingWords.join(' ') : messageContent;
    }

    return messageContent;
  }

  // Function to remove spam messages based on Jaro-Winkler distance
  function removeSpamMessages() {
    // Get the messages container element
    const messagesContainer = document.getElementById('chat-content');

    // Get all the chat message elements from the messages container
    const chatMessages = messagesContainer.querySelectorAll('.messages-content div p');

    // Object to store user logs
    const userLogs = {};

    // Iterate through each chat message
    chatMessages.forEach((message, index) => {
      // Extract the text content without considering the time and username
      const messageText = extractMessageText(message);

      // Extract the user's username and user ID
      const usernameElement = message.querySelector('.username span[data-user]');
      if (!usernameElement) {
        return; // Skip messages without a username
      }

      const userId = usernameElement.getAttribute('data-user');
      const nickname = usernameElement.textContent;

      // Find or create user log entry
      if (!userLogs[nickname]) {
        userLogs[nickname] = { userId, keptMessages: [], removedMessages: [] };
      }

      // Get the user log
      const userLog = userLogs[nickname];

      // Iterate through preceding messages for the same user for comparison
      let hidden = false;
      for (let i = 0; i < index; i++) {
        const previousMessage = chatMessages[i];
        const previousUsernameElement = previousMessage.querySelector('.username span[data-user]');

        // Skip messages without a username
        if (!previousUsernameElement) {
          continue;
        }

        const previousUserId = previousUsernameElement.getAttribute('data-user');

        // Compare messages only if they belong to the same user
        if (userId === previousUserId) {
          const previousMessageText = extractMessageText(previousMessage);

          // Calculate Jaro-Winkler distance and set a threshold for similarity
          const similarityThreshold = 0.9;

          const similarity = calculateDistance(messageText, previousMessageText);

          if (similarity >= similarityThreshold) {
            // Apply logic to hide or remove the message
            message.style.transition = 'transform 2s ease';
            message.style.transformOrigin = 'right';
            message.style.transform = 'scale(1)';
            message.style.color = 'coral';

            setTimeout(() => {
              message.style.transition = 'transform 0.3s ease';
              message.style.transform = 'scale(0)';

              setTimeout(() => {
                message.remove();
                // Add the message to removedMessages for the specific user
                userLog.removedMessages.push({ index, text: messageText });
                hidden = true;
              }, 300);
            }, 2000);

            break; // Break the loop to avoid removing multiple occurrences
          }
        }
      }
    });
  }

  // Time difference threshold (in milliseconds) to identify spam (increased to 1 second)
  const timeDifferenceThreshold = 2000;
  // Message limit within a specific time frame (set this value to 2 for more than 2 messages in 1 second)
  const messageLimit = 5;
  // Object to track user-specific data
  let userChatData = {};
  // Maximum number of consecutive times a user is allowed to exceed the message limit
  const thresholdMaxTries = 5;

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

            // Check if the thresholdMaxTries is equal or more than the limit
            userChatData[userId].thresholdMaxTries++;

            if (userChatData[userId].thresholdMaxTries >= thresholdMaxTries) {
              // Set 'banned' to true after passing the max thresholdMaxTries to remove user messages passing the messages limit checking
              userChatData[userId].banned = true;
              console.log(generateLogUserInfo(), 'color: pink');
              console.log(`%c${userChatData[userId].userName} cannot send messages anymore`, 'color: pink');
            } else {
              // Log the information immediately after updating the values if not banned
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

  // Skip reading the messages on page load to read them normally when the user is present and the page is stable
  let isInitialized = false;

  // create a mutation observer to watch for new messages being added
  const newMessagesObserver = new MutationObserver(mutations => {
    // If isInitialized is false return without doing anything
    if (!isInitialized) {
      isInitialized = true;
      return;
    }

    for (let mutation of mutations) {
      if (mutation.type === 'childList') {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P') {
            // read the text content of the new message and speak it
            const latestMessageTextContent = localStorage.getItem('latestMessageTextContent');

            // Get the latest message text content
            const latestMessageTextContentResult = getLatestMessageTextContent();
            const newMessageTextContent = latestMessageTextContentResult.messageText;

            // Get the username of the user who sent the latest message
            let latestMessageUsername = null;
            if (latestMessageTextContentResult && latestMessageTextContentResult.usernameText) {
              latestMessageUsername = latestMessageTextContentResult.usernameText.textContent;
            }

            // Get the sound switcher element and check which option is selected
            const soundSwitcher = document.querySelector('#voice, #beep, #silence');
            const isVoice = soundSwitcher && soundSwitcher.id === 'voice';
            const isBeep = soundSwitcher && soundSwitcher.id === 'beep';

            // Get the message mode element and check which option is selected
            const messageMode = document.querySelector('#every-message, #mention-message');
            const isEveryMessage = messageMode && messageMode.id === 'every-message';
            const isMentionMessage = messageMode && messageMode.id === 'mention-message';

            // If mode is voice, speak the new message and update the latest message content in local storage
            if (isVoice && isInitialized && newMessageTextContent && newMessageTextContent !== latestMessageTextContent) {
              // Update localStorage key "latestMessageTextContent"
              // If "newMessageTextContent" value doesn't match "latestMessageTextContent" value
              localStorage.setItem('latestMessageTextContent', newMessageTextContent);
              // Speak the new message only if it's not addressed to your nickname
              if (latestMessageUsername && !latestMessageUsername.includes(myNickname)) {
                if (isEveryMessage) {
                  // Add the new message to the Set
                  addNewMessage(newMessageTextContent);
                } else if (isMentionMessage) {
                  // Make sure if the user is tracked before adding new message in a queue for reading
                  const isTrackedUser = usersToTrack.some((trackedUser) => newMessageTextContent.includes(trackedUser.pronunciation));
                  if (isTrackedUser) {
                    // Add the new message to the Set
                    addNewMessage(newMessageTextContent);
                  }
                }
              }
            }

            // If mode is beep, play the beep sound for the new message
            if (isBeep && isInitialized && newMessageTextContent && newMessageTextContent !== latestMessageTextContent) {
              // Update localStorage key "latestMessageTextContent"
              // If "newMessageTextContent" value doesn't match "latestMessageTextContent" value
              localStorage.setItem('latestMessageTextContent', newMessageTextContent);
              // Play the beep sound only if the message is not addressed to your nickname
              if (latestMessageUsername && !latestMessageUsername.includes(myNickname)) {
                // Play mention frequencies if the message is addressed to you
                if (isMention) {
                  playBeep(mentionMessageFrequencies, beepVolume);
                  // Return value as default to continue make a beep sound as a usual message
                  isMention = false;
                }
                // Play usual frequencies if the message is addressed to other users or not addressed to anybody
                else {
                  if (isEveryMessage) {
                    playBeep(usualMessageFrequencies, beepVolume);
                  }
                }
              }
            }

            if (isInitialized) {
              // Attach contextmenu event listener for messages deletion
              attachEventsToMessages();
              // Convert image links to visible image containers
              convertImageLinkToImage();
              // Convert YouTube links to visible iframe containers
              convertYoutubeLinkToIframe();
              // Call the function to apply the chat message grouping
              applyChatMessageGrouping();
              // Calls the removeSpamMessages function to filter and hide similar chat messages based on Jaro-Winkler distance.
              removeSpamMessages();
              // Call the function to scroll to the bottom of the chat
              scrollMessages();
              // Call the banSpammer function to track and handle potential spam messages
              banSpammer();
            }

          }
        }
      }
    }
  });

  // observe changes to the messages container element
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
  const iconUserlistCache = `<svg xmlns="${svgUrl}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="lightcoral" stroke-width="${iconStrokeWidth}"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-database">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      </svg>`;


  let soundSwitcher, soundSwitcherIcon;
  let messageMode, messageModeIcon;

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

    // Append some styles
    soundSwitcher.style.display = 'flex';
    soundSwitcher.style.justifyContent = 'center';
    soundSwitcher.style.alignItems = 'center';
    soundSwitcher.style.width = '48px';
    soundSwitcher.style.height = '48px';
    soundSwitcher.style.cursor = 'pointer';
    soundSwitcher.style.margin = `${empowermentButtonsMargin}px`;
    soundSwitcher.style.backgroundColor = '#212226';
    soundSwitcher.style.border = '1px solid #45474b';

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

      // Add the 'pulse' class to the element
      this.classList.add('pulse');

      // Remove the 'pulse' class after one second
      setTimeout(() => {
        this.classList.remove('pulse');
      }, 500);

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


  function createMessageModeButton() {
    // Create a new element with class 'message-mode-button' and id 'every-messages'
    messageMode = document.createElement('div');
    // Retrieve the value from KG_Chat_Empowerment.messageSettings.messageModeState
    const messageModeState = KG_Chat_Empowerment.messageSettings.messageModeState || 'every-message';
    // Add the class 'message-mode-button' to the 'messagesMode' element
    messageMode.classList.add('message-mode-button');
    // Initial button id if the localStorage key isn't created with assigned value by user
    messageMode.id = messageModeState;

    // Append some styles
    messageMode.style.display = 'flex';
    messageMode.style.justifyContent = 'center';
    messageMode.style.alignItems = 'center';
    messageMode.style.width = '48px';
    messageMode.style.height = '48px';
    messageMode.style.cursor = 'pointer';
    messageMode.style.margin = `${empowermentButtonsMargin}px`;
    messageMode.style.backgroundColor = '#212226';
    messageMode.style.border = '1px solid #45474b';

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


  // Function to create the button for showCachePanel
  function createShowUserListCacheButton() {
    // Create a new element with class 'cache-panel-load-button'
    const showUserListCacheButton = document.createElement('div');

    // Add the class 'cache-panel-load-button' to the button
    showUserListCacheButton.classList.add('cache-panel-load-button');

    // Append some styles
    showUserListCacheButton.style.display = 'flex';
    showUserListCacheButton.style.justifyContent = 'center';
    showUserListCacheButton.style.alignItems = 'center';
    showUserListCacheButton.style.width = '48px';
    showUserListCacheButton.style.height = '48px';
    showUserListCacheButton.style.cursor = 'pointer';
    showUserListCacheButton.style.margin = `${empowermentButtonsMargin}px`; // Use the correct margin variable
    showUserListCacheButton.style.border = '1px solid #27ae60'; // Border color, you can change it
    showUserListCacheButton.style.backgroundColor = '#212226';
    showUserListCacheButton.style.border = '1px solid #45474b';

    // Add data base icon to the button
    showUserListCacheButton.innerHTML = iconUserlistCache;

    // Assign a title to the button
    showUserListCacheButton.title = 'Show User List Cache Panel';

    // Add a click event listener to the button
    showUserListCacheButton.addEventListener('click', function () {
      // Add the 'pulse' class to create a visual effect
      showUserListCacheButton.classList.add('pulse');
      // Remove the 'pulse' class after 500ms to stop the visual effect
      setTimeout(() => {
        showUserListCacheButton.classList.remove('pulse');
      }, 500);

      // Call showCachePanel function to show the cache panel
      showCachePanel();
    });

    // Append the button to the existing buttons panel
    empowermentButtonsPanel.appendChild(showUserListCacheButton);
  } createShowUserListCacheButton();


  // Add the isAltKeyPressed condition to the messagesMode event listener
  messageMode.addEventListener('click', function (event) {
    // Only execute when isCtrlKeyPressed or isAltKeyPressed are false
    if (!isCtrlKeyPressed || !isAltKeyPressed) {

      // Add the 'pulse' class to the element
      this.classList.add('pulse');

      // Remove the 'pulse' class after one second
      setTimeout(() => {
        this.classList.remove('pulse');
      }, 500);

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

  // REMOVE UNWANTED MESSAGES

  /*
  ** This algorithm enables the removal of unpleasant messages in the chat that are unwanted.
  ** The messages are saved in localStorage and remain there until they are visible in the chat.
  ** Once a message is no longer visible in the chat, its corresponding value in localStorage is also removed.
  ** This method is helpful in storing only necessary unwanted messages, preventing an overgrowth of values over time.
  */

  // Set messages initially as empty variable
  let messages;

  function executeMessageRemover() {
    // Store let messages with data
    messages = document.querySelectorAll('.messages-content div p');

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
  // Set selection
  function assignMessageSelection(message) {
    message.style.setProperty('background-color', 'hsla(0, 50%, 30%, .5)', 'important');
    message.style.setProperty('box-shadow', 'inset 0px 0px 0px 1px rgb(191, 64, 64)', 'important');
    message.style.setProperty('background-clip', 'padding-box', 'important');
  }
  // Clear the selection
  function clearMessageSelection(message) {
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
    // Assign empty variable with data
    messages = document.querySelectorAll('.messages-content div p');
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
            if (!selectedMessages.has(message.textContent)) {
              selectedMessages.add(message.textContent);
              console.log('Added new message inside the selectedMessages Set:', message.textContent);
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
            if (!selectedMessages.has(message.textContent)) {
              selectedMessages.add(message.textContent);
              console.log('Added new message inside the selectedMessages Set:', message.textContent);
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

        }); // contextmenu Event END
      }
    }); // messages addEventListener END
  } // attachEventsToMessages function END

  function deleteSelectedMessages(messageSelection) {
    // Retrieve and backup all current selectedMessages and convert into Array
    const messagesToDelete = [...selectedMessages];

    // Loop over each selected message elements
    messagesToDelete.forEach((message) => {
      // Get the message text content
      const messageContent = message;
      // Retrieve the stored deleted messages array, or create an empty array if none exist
      const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');
      // Add the deleted message content to the array if it doesn't already exist
      if (!deletedMessages.includes(messageContent)) {
        deletedMessages.push(messageContent);
      }
      // Store the updated deleted messages array in localStorage
      localStorage.setItem('deletedChatMessagesContent', JSON.stringify(deletedMessages));
      // Remove the message from the selectedMessages Set
      selectedMessages.delete(message);
    });

    // Hide all the messages what are matching the localStorage value
    wipeDeletedMessages();
  }

  // Function to remove from localStorage deleted messages values what are not anymore matching the chat message
  // And also make messages in the chat to be invisible only for whose what are matching the localStorage message
  function wipeDeletedMessages() {
    // Retrieve the stored deleted messages array
    const deletedMessages = JSON.parse(localStorage.getItem('deletedChatMessagesContent') || '[]');
    // Remove any deleted messages from the array that no longer exist in the chat messages container
    const newDeletedMessages = deletedMessages.filter(content => {
      return Array.from(messages).some(message => message.innerText === content);
    });
    // Remove messages from the chat that match the deleted messages in localStorage
    deletedMessages.forEach(deletedMessage => {
      messages.forEach(message => {
        if (message.innerText === deletedMessage) {
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
        if (deletedMessages.includes(message.innerText)) {
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

  // Define the checkForAccessibility function
  function checkForAccessibility() {
    // Get references to the chat text and send elements
    let chatText = document.querySelector('.chat .text');
    let chatSend = document.querySelector('.chat .send');

    // If either element is disabled, enable them and set send button background color to red with 50% transparency
    if (chatText.disabled || chatSend.disabled) {
      chatText.disabled = false;
      chatSend.disabled = false;
      chatSend.style.setProperty('background-color', 'rgb(160, 35, 35)', 'important');
      chatSend.style.setProperty('background-image', `url("data:image/svg+xml,${encodeURIComponent(iconDenied)}")`, 'important');
      chatSend.style.setProperty('background-repeat', 'no-repeat', 'important');
      chatSend.style.setProperty('background-position', 'center', 'important');
      chatSend.style.setProperty('color', 'transparent', 'important');
      chatText.value = null;
    }
  }

  // Create a debounced version of the checkForAccessibility function
  const debouncedCheckForAccessibility = debounce(checkForAccessibility, debounceTimeout);


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
        executeMessageRemover();

        // Calls the removeSpamMessages function to filter and hide similar chat messages based on Jaro-Winkler distance.
        removeSpamMessages();

        // Convert image links to visible image containers
        convertImageLinkToImage();

        // Convert YouTube links to visible iframe containers
        convertYoutubeLinkToIframe();

        // Restore chat tab from localStorage
        restoreChatTabAndFocus();

        // Call the function to re-highlight all the mention words of the messages
        highlightMentionWords();

        // Call the function to apply the chat message grouping
        applyChatMessageGrouping();

        // Enable chat if blocked
        debouncedCheckForAccessibility();

        // Call the function to scroll to the bottom of the chat
        scrollMessages();

        // Call the function to refresh the user list and clear the cache if needed
        refreshFetchedUsers(true, cacheRefreshThresholdHours);

        // Refresh experimental custom chat user list on old list changes
        refreshUserList();

        // Call the setChatFieldFocus function when the page loads
        setChatFieldFocus();

      }
    }
  });

  // start observing the DOM for changes
  waitForChatObserver.observe(document, { childList: true, subtree: true });

})();