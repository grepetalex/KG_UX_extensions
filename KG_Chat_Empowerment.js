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

  // Define the users to track and notify with popup and audio
  const usersToTrack = [
    { name: 'Даниэль', gender: 'male', pronunciation: 'Даниэль' }, // ------- 01
    { name: 'певец', gender: 'male', pronunciation: 'Певец' }, // ----------- 02
    { name: 'Баристарх', gender: 'male', pronunciation: 'Баристарх' }, // --- 03
    { name: 'madinko', gender: 'female', pronunciation: 'Мадинко' }, // ----- 04
    { name: 'Переборыч', gender: 'male', pronunciation: 'Переборыч' }, // --- 05
    { name: 'Advisor', gender: 'male', pronunciation: 'Адвайзер' }, // ------ 06
    { name: 'Хеопс', gender: 'male', pronunciation: 'Хеопс' }, // ----------- 07
    { name: 'Рустамко', gender: 'male', pronunciation: 'Рустамко' }, // ----- 08
    { name: 'ExpLo1t', gender: 'female', pronunciation: 'Эксплоит' }, // ---- 09
    { name: 'инфо-пчелы', gender: 'male', pronunciation: 'Инфо-Пчёлы' }, // - 10
    { name: 'Razmontana', gender: 'male', pronunciation: 'Размонтана' } // -- 11
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

  // CTRL && ALT KEY EVENTS

  // Define the isCtrlKeyPressed and isAltKeyPressed variables as booleans
  let isCtrlKeyPressed = false;
  let isAltKeyPressed = false;

  // Add event listeners for the Ctrl and Alt keys
  document.addEventListener('keydown', (event) => {
    // Check if the Control key was pressed down
    if (event.key === 'Control') {
      isCtrlKeyPressed = true;
    }
    // Check if the Alt key was pressed down
    if (event.key === 'Alt') {
      isAltKeyPressed = true;
    }
  });

  document.addEventListener('keyup', (event) => {
    // Check if the Control key was released
    if (event.key === 'Control') {
      isCtrlKeyPressed = false;
    }
    // Check if the Alt key was released
    if (event.key === 'Alt') {
      isAltKeyPressed = false;
    }
  });

  // Add a blur event listener to the document to reset the variables when the document loses focus
  document.addEventListener('blur', () => {
    if (isCtrlKeyPressed && isAltKeyPressed) {
      console.log('Ctrl and Alt keys were true');
      isCtrlKeyPressed = false;
      isAltKeyPressed = false;
    } else if (isCtrlKeyPressed) {
      console.log('Ctrl key was true');
      isCtrlKeyPressed = false;
    } else if (isAltKeyPressed) {
      console.log('Alt key was true');
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

  // Define voice speed limits
  const minVoiceSpeed = 0;
  const maxVoiceSpeed = 2.5;

  // Define voice pitch limits
  const minVoicePitch = 0;
  const maxVoicePitch = 2.0;

  // Define the default voice speed as a global variable
  let voiceSpeed = parseFloat(localStorage.getItem('voiceSpeed') || '1.5');

  // Define the default voice pitch as a global variable
  let voicePitch = parseFloat(localStorage.getItem('voicePitch') || '1.0');

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

  // Functions to play beep for user entering and leaving
  function userEntered(user) {
    playBeep(userEnteredFrequencies, beepVolume);
    const userGender = getUserGender(user);
    const userToTrack = usersToTrack.find(userToTrack => userToTrack.name === user);
    const action = verbs[userGender].enter;
    const message = `${userToTrack.pronunciation} ${action}`;
    setTimeout(() => {
      textToSpeech(message, voiceSpeed);
    }, 300);
  }

  function userLeft(user) {
    playBeep(userLeftFrequencies, beepVolume);
    const userGender = getUserGender(user);
    const userToTrack = usersToTrack.find(userToTrack => userToTrack.name === user);
    const action = verbs[userGender].leave;
    const message = `${userToTrack.pronunciation} ${action}`;
    setTimeout(() => {
      textToSpeech(message, voiceSpeed);
    }, 300);
  }


  // POPUPS

  // Define the function to generate HSL color with user parameters for hue, saturation, lightness
  function getHSLColor(hue, saturation, lightness) {
    // Set default value for hue
    if (typeof hue === 'undefined') { hue = 180; }
    // Set default value for saturation
    if (typeof saturation === 'undefined') { saturation = 50; }
    // Set default value for lightness
    if (typeof lightness === 'undefined') { lightness = 50; }
    var color = `hsl(${hue},${saturation}%,${lightness}%)`;
    return color;
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
      chatNotification.style.padding = '6px';
      chatNotification.style.display = 'inline-flex';
      chatNotification.style.margin = '4px';

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
    * Looks for links that contains ".jpg" or ".jpeg" or ".png" or ".gif" or "webp" extension and creates a thumbnail with the image.
    * If a thumbnail already exists, it skips the link and looks for the next one.
    * When a thumbnail is clicked, it creates a dimming layer and a big image that can be closed by clicking on the dimming layer or the big image itself.
  */
  function convertImageLinkToImage() {
    // get the container for all chat messages
    const messagesContainer = document.querySelector('.messages-content div');
    // get all links inside the messages container
    const links = messagesContainer.querySelectorAll('p a');

    // loop through all links
    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      // References for the images that contains extensions of the images
      let jpg = link.href.includes(".jpg");
      let jpeg = link.href.includes(".jpeg");
      let png = link.href.includes(".png");
      let gif = link.href.includes(".gif");
      let webp = link.href.includes(".webp");

      // check if link ends with ".jpg" | ".jpeg" | ".png" | ".gif" | ".webp"
      if (jpg || jpeg || png || gif || webp) {
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
          // function to create a big image with a dimming layer
          const createBigImage = function (src, dimming) {
            const bigImage = document.createElement('img');
            bigImage.src = src;
            bigImage.classList.add('scaled-thumbnail');
            bigImage.style.maxHeight = '90vh';
            bigImage.style.maxWidth = '90vw';

            document.body.appendChild(bigImage);

            bigImage.addEventListener('click', function () {
              document.body.removeChild(bigImage);
              document.body.removeChild(dimming);
            });

            return bigImage;
          }

          // create a new thumbnail
          const thumbnail = document.createElement('div');
          thumbnail.classList.add('thumbnail');
          thumbnail.style.width = '6vw';
          thumbnail.style.minWidth = '100px';
          thumbnail.style.height = 'auto';
          thumbnail.style.cursor = 'pointer';

          // create an image inside the thumbnail
          const img = document.createElement('img');
          img.src = link.href;
          img.style.maxHeight = '100%';
          img.style.maxWidth = '100%';
          img.style.backgroundColor = 'transparent';

          thumbnail.appendChild(img);

          // insert the thumbnail after the link
          link.parentNode.insertBefore(thumbnail, link.nextSibling);

          // add click event to thumbnail to create big image and dimming layer
          thumbnail.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const dimming = document.createElement('div');
            dimming.style.background = 'black';
            dimming.style.top = '0';
            dimming.style.left = '0';
            dimming.style.right = '0';
            dimming.style.bottom = '0';
            dimming.style.position = 'fixed';
            dimming.style.opacity = '0';
            dimming.style.zIndex = '998';

            document.body.appendChild(dimming);

            const bigImage = createBigImage(img.src, dimming);

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


            // ZOOM AND MOVE -- START

            // Ability to zoom the image with mouse wheel up and down
            // Move the image in the browser viewport with pressed mouse wheel

            // set the initial zoom scale and scaling factor
            let zoomScale = 1;
            let scalingFactor = 0.1;

            // set up variables for dragging
            let isDragging = false;
            let startX = 0;
            let startY = 0;
            let translateX = -50;
            let translateY = -50;

            // add event listener to bigImage for wheel event
            bigImage.addEventListener('wheel', function (event) {
              // determine the direction of the mouse wheel movement
              const deltaY = event.deltaY;
              const direction = deltaY < 0 ? 1 : -1;

              // update the zoom scale based on the direction and scaling factor
              zoomScale += direction * scalingFactor * zoomScale;

              // clamp the zoom scale to a minimum of 1
              zoomScale = Math.max(zoomScale, 1);

              // apply the new zoom scale and transform origin
              bigImage.style.transformOrigin = 'center center';
              bigImage.style.transform = `translate(${translateX}%, ${translateY}%) scale(${zoomScale})`;

              // prevent the default scrolling behavior
              event.preventDefault();
            });

            // add event listener to bigImage for mousedown event
            bigImage.addEventListener('mousedown', function (event) {
              // check if the middle mouse button is pressed
              if (event.button === 1) {
                // set the dragging flag and record the start position
                isDragging = true;
                startX = event.clientX;
                startY = event.clientY;
              }
            });

            // add event listener to document for mousemove event
            document.addEventListener('mousemove', function (event) {
              if (isDragging) {
                // calculate the distance moved since the last mousemove event
                const deltaX = event.clientX - startX;
                const deltaY = event.clientY - startY;

                // update the translate values
                translateX += deltaX / 10;
                translateY += deltaY / 10;

                // apply the new translate values
                bigImage.style.transform = `translate(${translateX}%, ${translateY}%) scale(${zoomScale})`;

                // update the start position
                startX = event.clientX;
                startY = event.clientY;
              }
            });

            // add event listener to document for mouseup event
            document.addEventListener('mouseup', function (event) {
              // reset the dragging flag
              isDragging = false;
            });

            // ZOOM AND MOVE -- END


            // Attach a click event listener to the dimming element
            dimming.addEventListener('click', function () {
              removeDimmingContainer();
            });

            // Attach a keydown event listener to the document object
            document.addEventListener('keydown', function (event) {
              // Check if the key pressed was the "Escape" key
              if (event.key === 'Escape') {
                // Call the removeDimmingContainer function to remove the dimming and bigImage elements
                removeDimmingContainer();
              }
            });

            // Define the removeDimmingContainer function
            function removeDimmingContainer() {
              // Check if the dimming and bigImage elements are present in the document body
              if (document.body.contains(dimming) && document.body.contains(bigImage)) {

                // Gradually decrease the opacity of the dimming and bigImage elements
                let opacity = 0.5;
                const interval = setInterval(() => {
                  opacity -= 0.1;
                  dimming.style.opacity = opacity;
                  bigImage.style.opacity = opacity;
                  if (opacity <= 0) {
                    clearInterval(interval);
                    // Remove the dimming and bigImage elements from the document body
                    document.body.removeChild(dimming);
                    document.body.removeChild(bigImage);
                  }
                }, 10);
              }
            }

          }); // thumbnail event end

          // add styling to the thumbnail
          thumbnail.style.backgroundColor = 'transparent';
          thumbnail.style.padding = '2px';
          thumbnail.style.margin = '6px';
          // add mouseover and mouseout event listeners to the thumbnail
          thumbnail.addEventListener('mouseover', function () {
            img.style.opacity = 0.7;
            img.style.transition = 'opacity 0.3s';
          });

          thumbnail.addEventListener('mouseout', function () {
            img.style.opacity = 1;
          });
        }
      }
    }
  }

  /*
   * This function searches for all links in the chat messages container that contain a YouTube video URL
   * and replaces the link with an embedded YouTube video player.
  */
  function convertYoutubeLinkToIframe() {
    // get the container for all chat messages
    const messagesContainer = document.querySelector('.messages-content div');
    // get all links inside the messages container
    const links = messagesContainer.querySelectorAll('p a');

    // loop through all links
    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      // Valid youtube video if includes
      let youtubeFullLink = link.href.includes('youtube.com/watch?v=');
      let youtubeShareLink = link.href.includes('youtu.be');
      let youtubeLiveLink = link.href.includes('youtube.com/live');
      let youtubeEmbedLink = link.href.includes('youtube.com/embed');

      // Check if youtube link contains valid video link
      if (youtubeFullLink || youtubeShareLink || youtubeLiveLink || youtubeEmbedLink) {
        // create a new iframe
        const iframe = document.createElement('iframe');
        iframe.width = '280';
        iframe.height = '157.5';

        // Check if the link is youtubeFullLink
        if (youtubeFullLink) {
          let videoId = link.href.split('v=')[1];
          const ampersandPosition = videoId.indexOf('&');
          if (ampersandPosition !== -1) {
            videoId = videoId.substring(0, ampersandPosition);
          }
          iframe.src = `https://www.youtube.com/embed/${videoId}`;
        }

        // Check if the link is youtubeShareLink
        if (youtubeShareLink) {
          iframe.src = link.href.replace('youtu.be', 'www.youtube.com/embed');
        }

        // Check if the link is youtubeLiveLink
        if (youtubeLiveLink) {
          let videoId = link.href.split("/").pop().split("?")[0];
          iframe.src = `https://www.youtube.com/embed/${videoId}`;
        }

        // Check if the link is youtubeEmbeddedLink
        if (youtubeEmbedLink) {
          iframe.src = link.href;
        }

        iframe.allowFullscreen = true;
        iframe.style.display = 'flex';
        iframe.style.margin = '6px';
        iframe.style.border = 'none';

        // replace the link with the iframe
        link.parentNode.replaceChild(iframe, link);
      }
    }
  }

  // Function to highlight users from 'usersToTrack' array in the userlist
  function highlightTrackingUsers() {
    // Select all ins elements from the userlist
    const insElements = document.querySelectorAll('.userlist-content ins');

    // Iterate over the ins elements and check if they contain an anchor element
    for (const ins of insElements) {
      const anchor = ins.querySelector('a.name');
      if (anchor) {
        // Retrieve the username from the anchor textContent
        const name = anchor.textContent.trim();
        // Find the user in 'usersToTrack' array by their name
        const userToTrack = usersToTrack.find(user => user.name === name);
        // If the user is found and not revoked, set their anchor text color to green
        if (userToTrack && !ins.classList.contains('revoked')) {
          anchor.style.setProperty('color', '#83cf40', 'important');
          anchor.style.setProperty('text-shadow', '0 0 1px #83cf40', 'important');
        }
        // If the user is found and is revoked, set their anchor text color to a red
        else if (userToTrack && ins.classList.contains('revoked')) {
          anchor.style.setProperty('color', '#ff8080', 'important');
          anchor.style.setProperty('text-shadow', '0 0 1px #ff8080', 'important');
        }
      }
    }
  }

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
  empowermentButtonsPanel.style.top = '120px';
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
                userEntered(newUser, userGender); // use `newUser` instead of `newUser.name`
              }
            }
          });

          leftUsers.forEach((leftUser) => {
            const userGender = getUserGender(leftUser) || 'male'; // use 'male' as default
            const action = verbs[userGender].leave;
            showUserAction(leftUser, action, false);
            // Prevent voice notification if mode is silence
            if (!isSilence && usersToTrack.some(user => user.name === leftUser)) {
              userLeft(leftUser, userGender); // use `leftUser` instead of `leftUser.name`
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

  // Create a separate MutationObserver to watch for changes to the tracking user list
  const trackingUsersObserver = new MutationObserver(() => {
    // Whenever the tracking user list changes, call the highlightTrackingUsers function
    highlightTrackingUsers();
  });

  // Start observing the tracking user list for changes to highlight them
  trackingUsersObserver.observe(userList, { childList: true });

  // Button to close the chat
  const chatCloseButton = document.querySelector('.mostright');

  // Event listener for keydown event
  document.addEventListener('keydown', (event) => {
    // Check if Ctrl key and Space key are pressed simultaneously
    if (event.ctrlKey && event.key === ' ') {
      // Trigger click event on chatCloseButton
      chatCloseButton.click();
      setTimeout(() => {
        // Check if the chat is closed or opened
        const chatHidden = document.querySelector('#chat-wrapper.chat-hidden');
        if (!chatHidden) {
          // Call the function to assign all the removing functionality again after the chat was closed
          executeMessageRemover();
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

    // Remove the "<" and ">" symbols from the username if they are present
    usernameText = usernameText.replace(/</g, '').replace(/>/g, '');

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

  // Skip reading the messages on page load to read them normally when the user is present and the page is stable
  let isInitialized = false;
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
            // Attach contextmenu event listener for messages deletion
            attachEventsToMessages();
            // read the text content of the new message and speak it
            const latestMessageTextContent = localStorage.getItem('latestMessageTextContent');

            // Get the latest message text content
            const newMessageTextContent = getLatestMessageTextContent().messageText;

            // Get the username of the user who sent the latest message
            const latestMessageUsername = getLatestMessageTextContent().usernameText.textContent;

            // Get the sound switcher element and check which option is selected
            const soundSwitcher = document.querySelector('#voice, #beep, #silence');
            const isVoice = soundSwitcher && soundSwitcher.id === 'voice';
            const isBeep = soundSwitcher && soundSwitcher.id === 'beep';

            // Get the message mode element and check which option is selected
            const messageMode = document.querySelector('#every-message, #mention-message');
            const isEveryMessage = messageMode && messageMode.id === 'every-message';
            const isMentionMessage = messageMode && messageMode.id === 'mention-message';

            // References for the images extensions
            let jpg = 'a[href*=".jpg"]';
            let jpeg = 'a[href*=".jpeg"]';
            let png = 'a[href*=".png"]';
            let gif = 'a[href*=".gif"]';
            let webp = 'a[href*=".webp"]';

            // Check if the new message contains a link with an image before calling the convertImageLinkToImage function
            const linkWithImage = node.querySelector(`${jpg}, ${jpeg}, ${png}, ${gif}, ${webp}`);
            if (linkWithImage) {
              convertImageLinkToImage(linkWithImage);
            }

            // Check if the new message contains a valid link with a YouTube video before calling the convertYoutubeLinkToIframe function
            const linkWithYoutubeVideo = node.querySelector('a[href*="youtube.com/watch?v="], a[href*="youtu.be"]');
            if (linkWithYoutubeVideo) {
              convertYoutubeLinkToIframe(linkWithYoutubeVideo);
            }

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

            // Call the function to scroll to the bottom of the chat
            scrollMessages();
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


  let soundSwitcher, soundSwitcherIcon;
  let messageMode, messageModeIcon;

  function createSoundSwitcherButton() {
    // Create a new element with class 'sound-switcher-button' and id 'silence'
    soundSwitcher = document.createElement('div');
    // Retrieve the value from localStorage key "messageNotificationState"
    const messageNotificationState = localStorage.getItem('messageNotificationState') || 'silence';
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

    const messageNotificationTitle = localStorage.getItem('messageNotificationTitle');
    // Assign title for the current notification state
    soundSwitcher.title = messageNotificationTitle ? messageNotificationTitle : 'Do not disturb';

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
          localStorage.setItem('messageNotificationState', 'beep');
          localStorage.setItem('messageNotificationTitle', 'Notify with beep signal');
          break;
        case 'beep':
          this.id = 'voice';
          this.title = 'Notify with voice API';
          localStorage.setItem('messageNotificationState', 'voice');
          localStorage.setItem('messageNotificationTitle', 'Notify with voice API');
          break;
        case 'voice':
          this.id = 'silence';
          this.title = 'Do not disturb';
          localStorage.setItem('messageNotificationState', 'silence');
          localStorage.setItem('messageNotificationTitle', 'Do not disturb');
          break;
      }
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
    // Retrieve the value from localStorage key "messageModeState" for messagesMode
    const messageModeState = localStorage.getItem('messageModeState') || 'every-message';
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

    // Retrieve the value from localStorage key "messageModeTitle" for messagesMode
    const messageModeTitle = localStorage.getItem('messageModeTitle');
    // Assign title for the current notification state
    messageMode.title = messageModeTitle ? messageModeTitle : 'Notify about every message';

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
          localStorage.setItem('messageModeState', 'mention-message');
          localStorage.setItem('messageModeTitle', 'Notify about mention message');
          break;
        case 'mention-message':
          this.id = 'every-message';
          this.title = 'Notify about every message';
          localStorage.setItem('messageModeState', 'every-message');
          localStorage.setItem('messageModeTitle', 'Notify about every message');
          break;
      }
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

  // Add event listeners for Ctrl + Left Click to increase voice speed
  // Add event listeners for Shift + Left Click to increase voice pitch
  soundSwitcher.addEventListener('click', (event) => {
    if (isCtrlKeyPressed && event.button === 0) { // check for Ctrl + Left Click
      const newSpeed = parseFloat(voiceSpeed) + 0.1; // Calculate new speed without rounding
      const limitedSpeed = Math.min(newSpeed, maxVoiceSpeed); // Limit maximum voice speed
      if (limitedSpeed !== voiceSpeed) {
        voiceSpeed = parseFloat(limitedSpeed.toFixed(1)); // Round and assign to voiceSpeed
        localStorage.setItem('voiceSpeed', voiceSpeed.toString());
        showVoiceSettings();
      }
    }
    else if (isAltKeyPressed && event.button === 0) { // check for Shift + Left Click
      const newPitch = parseFloat(voicePitch) + 0.1; // Calculate new pitch without rounding
      const limitedPitch = Math.min(newPitch, maxVoicePitch); // Limit maximum voice pitch
      if (limitedPitch !== voicePitch) {
        voicePitch = parseFloat(limitedPitch.toFixed(1)); // Round and assign to voicePitch
        localStorage.setItem('voicePitch', voicePitch.toString());
        showVoiceSettings();
      }
    }
  });

  // Add event listeners for Ctrl + Right Click to decrease voice speed
  // Add event listeners for Shift + Right Click to decrease voice pitch
  soundSwitcher.addEventListener('contextmenu', (event) => {
    if (isCtrlKeyPressed && event.button === 2) { // check for Ctrl + Right Click
      event.preventDefault();
      const newSpeed = parseFloat(voiceSpeed) - 0.1; // Calculate new speed without rounding
      const limitedSpeed = Math.max(newSpeed, minVoiceSpeed); // Limit minimum voice speed
      if (limitedSpeed !== voiceSpeed) {
        voiceSpeed = parseFloat(limitedSpeed.toFixed(1)); // Round and assign to voiceSpeed
        localStorage.setItem('voiceSpeed', voiceSpeed.toString());
        showVoiceSettings();
      }
    }
    else if (isAltKeyPressed && event.button === 2) { // check for Shift + Right Click
      event.preventDefault();
      const newPitch = parseFloat(voicePitch) - 0.1; // Calculate new pitch without rounding
      const limitedPitch = Math.max(newPitch, minVoicePitch); // Limit minimum voice pitch
      if (limitedPitch !== voicePitch) {
        voicePitch = parseFloat(limitedPitch.toFixed(1)); // Round and assign to voicePitch
        localStorage.setItem('voicePitch', voicePitch.toString());
        showVoiceSettings();
      }
    }
  });



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

    // If either element is disabled, enable them and set background color to red with 50% transparency
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

  // create a new MutationObserver to wait for the chat to fully load with all messages
  var waitForChatObserver = new MutationObserver(mutations => {
    // Get the container for all chat messages
    const messagesContainer = document.querySelector('.messages-content div');
    // Get all the message elements from messages container
    const messages = document.querySelectorAll('.messages-content div p');

    // References for the images extensions
    let jpg = 'a[href*=".jpg"]';
    let jpeg = 'a[href*=".jpeg"]';
    let png = 'a[href*=".png"]';
    let gif = 'a[href*=".gif"]';
    let webp = 'a[href*=".webp"]';

    // check if the chat element has been added to the DOM
    if (document.contains(messagesContainer)) {
      // check if there are at least 20 messages in the container
      if (messages.length >= 20) {
        // stop observing the DOM
        waitForChatObserver.disconnect();
        executeMessageRemover();

        // Check if any of the messages contain a link with an image and convert it to an image
        const linksWithImages = messagesContainer.querySelectorAll(`${jpg}, ${jpeg}, ${png}, ${gif}, ${webp}`);
        linksWithImages.forEach(linkWithImage => convertImageLinkToImage(linkWithImage));

        // Check if any of the messages contain a valid link with a YouTube video and convert it to an iframe
        const linksWithYoutubeVideos = messagesContainer.querySelectorAll('a[href*="youtube.com/watch?v="], a[href*="youtu.be"]');
        linksWithYoutubeVideos.forEach(linkWithYoutubeVideo => convertYoutubeLinkToIframe(linkWithYoutubeVideo));

        // Call the function to scroll to the bottom of the chat
        scrollMessages();

        // Call the function to re-highlight all the mention words of the messages
        highlightMentionWords();

        // Enable chat if blocked
        debouncedCheckForAccessibility();
      }
    }
  });

  // start observing the DOM for changes
  waitForChatObserver.observe(document, { childList: true, subtree: true });

})();