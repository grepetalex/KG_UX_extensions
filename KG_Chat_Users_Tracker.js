// ==UserScript==
// @name         KG_Chat_Empowerment
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Enhance the chat abilities
// @author       Patcher
// @match        *://klavogonki.ru/g*
// @grant        none
// ==/UserScript==

(function () {

  // USERS DEFINITION

  // Define the users to track and notify with popup and audio
  const usersToTrack = [
    { name: 'Даниэль', gender: 'male', pronunciation: 'Даниэль' },
    { name: 'певец', gender: 'male', pronunciation: 'Певец' },
    { name: 'Баристарх', gender: 'male', pronunciation: 'Баристарх' },
    { name: 'madinko', gender: 'female', pronunciation: 'Мадинко' },
    { name: 'Переборыч', gender: 'male', pronunciation: 'Переборыч' },
    { name: 'Advisor', gender: 'male', pronunciation: 'Адвайзер' },
    { name: 'Хеопс', gender: 'male', pronunciation: 'Хеопс' },
    { name: 'Рустамко', gender: 'male', pronunciation: 'Рустамко' },
    { name: 'ExpLo1t', gender: 'female', pronunciation: 'Эксплоит' }
  ];


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
  const newMessageFrequencies = [500];

  // Volume of new message and left, entered users
  const volume = 0.3;
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

  // Define the utterance object as a global variable
  const utterance = new SpeechSynthesisUtterance();
  // Define the voice for text to speech as Pavel
  const voice = speechSynthesis.getVoices().find((voice) => voice.name === 'Microsoft Pavel - Russian (Russia)');
  // Set the "default" property of the Russian voice to true to make it the default voice for the utterance
  voice.default = true;
  // Set the "lang" property of the utterance object to 'ru-RU'
  utterance.lang = 'ru-RU';
  // Set the "voice" property of the utterance object to the Russian voice
  utterance.voice = voice;

  // Define voice speed limits
  const minVoiceSpeed = 0.5;
  const maxVoiceSpeed = 2.5;

  // Define the default voice speed as a global variable
  let voiceSpeed = parseFloat(localStorage.getItem('voiceSpeed') || '1.5');

  function textToSpeech(text, voiceSpeed = voiceSpeed) {
    // Replace underscores with spaces
    const message = text.replace(/_/g, ' ');
    // Set the text content of the utterance
    utterance.text = message;
    // Set the speed of the utterance
    utterance.rate = voiceSpeed;
    // Calculate the volume of the utterance based on the global volume value
    const dynamicVolume = volume * 6;
    // Set the volume of the utterance
    utterance.volume = dynamicVolume;
    // Speak the utterance
    speechSynthesis.speak(utterance);
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
    playBeep(userEnteredFrequencies, volume);
    const userGender = getUserGender(user);
    const userToTrack = usersToTrack.find(userToTrack => userToTrack.name === user);
    const action = verbs[userGender].enter;
    const message = `${userToTrack.pronunciation} ${action}`;
    setTimeout(() => {
      textToSpeech(message, voiceSpeed);
    }, 300);
  }

  function userLeft(user) {
    playBeep(userLeftFrequencies, volume);
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

  /**
     * Converts links to images in chat messages by creating a thumbnail and a big image on click.
     * Looks for links that contains ".jpg" or ".jpeg" or "png" or ".gif" and creates a thumbnail with the image.
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
          thumbnail.style.width = '6vw'; // set the initial thumbnail size
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

  /**
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
      // Check if youtube link contains full or shortened "youtube" link
      if (link.href.includes('youtube.com/watch?v=') || link.href.includes('youtu.be')) {
        // create a new iframe
        const iframe = document.createElement('iframe');
        iframe.width = '280';
        iframe.height = '157.5';

        // check if the link contains the v parameter
        if (link.href.includes('youtube.com') && link.href.includes('v=')) {
          let videoId = link.href.split('v=')[1];
          const ampersandPosition = videoId.indexOf('&');
          if (ampersandPosition !== -1) {
            videoId = videoId.substring(0, ampersandPosition);
          }
          iframe.src = `https://www.youtube.com/embed/${videoId}`;
        } else {
          // replace youtu.be with www.youtube.com/embed in the src
          iframe.src = link.href.replace('youtu.be', 'www.youtube.com/embed');
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
        const userCount = document.querySelector('.user-count');

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
              }, 1000);
            }
          };
          setTimeout(userCountIncrement, speed);
        } // Animation END

        // Check if chat is not closed and animation completed
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

        // Log new and left users if any changes are observed and chat is not hidden
        if (!chatHidden && hasObservedChanges) {
          newUsers.forEach((newUser) => {
            if (!previousUsers.includes(newUser)) {
              const userGender = getUserGender(newUser) || 'male'; // use 'male' as default
              const action = verbs[userGender].enter;
              showUserAction(newUser, action, true);
              if (usersToTrack.some(user => user.name === newUser)) {
                userEntered(newUser, userGender); // use `newUser` instead of `newUser.name`
              }
            }
          });

          leftUsers.forEach((leftUser) => {
            const userGender = getUserGender(leftUser) || 'male'; // use 'male' as default
            const action = verbs[userGender].leave;
            showUserAction(leftUser, action, false);
            if (usersToTrack.some(user => user.name === leftUser)) {
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


  // EVERY NEW MESSAGE READER

  // Avoid reading on load page to read the messages normally on stable presence
  let isInitialized = false;

  // create a mutation observer to watch for new messages being added
  const newMessagesObserver = new MutationObserver(mutations => {
    for (let mutation of mutations) {
      if (mutation.type === 'childList') {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P') {
            // Attach contextmenu event listener for messages deletion
            attachEventsToMessages();
            // read the text content of the new message and speak it
            const latestMessageTextContent = localStorage.getItem('latestMessageTextContent');
            const newMessageTextContent = getLatestMessageTextContent();

            // Get the sound switcher element and check which option is selected
            const soundSwitcher = document.querySelector('#voice, #beep, #silence');
            const isVoice = soundSwitcher && soundSwitcher.id === 'voice';
            const isBeep = soundSwitcher && soundSwitcher.id === 'beep';
            const isSilence = soundSwitcher && soundSwitcher.id === 'silence';

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
              textToSpeech(newMessageTextContent, voiceSpeed);
              localStorage.setItem('latestMessageTextContent', newMessageTextContent);
            }

            // If mode is beep, play the beep sound for the new message
            if (isBeep && isInitialized && newMessageTextContent && newMessageTextContent !== latestMessageTextContent) {
              playBeep(newMessageFrequencies, volume);
              localStorage.setItem('latestMessageTextContent', newMessageTextContent);
            }

            // If it's the first time, update the latest message content in local storage and set isInitialized to true
            if (!isInitialized) {
              localStorage.setItem('latestMessageTextContent', newMessageTextContent);
              isInitialized = true;
            }
          }
        }
      }
    }
  });

  // function to get the cleaned text content of the latest message
  function getLatestMessageTextContent() {
    const message = document.querySelector('.messages-content div p:last-child');
    if (!message) {
      return null;
    }

    const isTextNode = (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '';
    const textNodes = [...message.childNodes].filter(isTextNode);
    const text = textNodes.map(node => node.textContent).join('').trim();

    const time = message.querySelector('.time');
    const username = message.querySelector('.username');
    const timeText = time ? time.textContent : '';
    const usernameText = username ? username.textContent : '';

    return text.replace(timeText, '').replace(usernameText, '').trim();
  }

  // observe changes to the messages container element
  const messagesContainer = document.querySelector('.messages-content div');
  newMessagesObserver.observe(messagesContainer, { childList: true, subtree: true });

  // SOUND GRAPHICAL SWITCHER

  // Button SVG icons "silence", "beep", "voice" representation
  const iconSoundSilence = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(355, 80%, 65%)" stroke-width="1.4"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-volume-x">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <line x1="23" y1="9" x2="17" y2="15"></line>
      <line x1="17" y1="9" x2="23" y2="15"></line>
      </svg>`;
  const iconSoundBeep = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(55, 80%, 65%)" stroke-width="1.4"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-volume-1">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>`;
  const iconSoundVoice = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(80, 80%, 40%)" stroke-width="1.4"
  stroke-linecap="round" stroke-linejoin="round" class="feather feather-volume-2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>`;

  // Define the isCtrlKeyPressed variable as a boolean
  let isCtrlKeyPressed = false;

  // Add event listeners for the Ctrl key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Control') {
      isCtrlKeyPressed = true;
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === 'Control') {
      isCtrlKeyPressed = false;
    }
  });

  // New message sound notification graphical switcher as a button
  const chatButtonsPanel = document.querySelector('.chat .messages table td:nth-child(3)');
  // Avoid panel squeezing
  chatButtonsPanel.style.minWidth = '105px';
  const soundSwitcher = document.createElement('div');

  // Retrieve the value from localStorage key "messageNotificationState"
  const messageNotificationState = localStorage.getItem('messageNotificationState') || 'silence';

  soundSwitcher.classList.add('chat-opt-btn');
  // Initial button id if the localStorage key isn't created
  soundSwitcher.id = messageNotificationState;
  // Retrieve the value from localStorage key "messageNotificationTitle"
  const messageNotificationTitle = localStorage.getItem('messageNotificationTitle');
  soundSwitcher.title = messageNotificationTitle ? messageNotificationTitle : 'Do not disturb';
  soundSwitcher.addEventListener('click', function (event) {
    if (!isCtrlKeyPressed) { // Only execute the code if isCtrlKey is false
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
      updateSoundIcon();
    }
  });

  const iconRangeisOut = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="feather feather-slash">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
      </svg>`;

  function showCurrentSpeed(currentSpeed) {
    let currentVoiceSpeed = document.querySelector('.current-voice-speed');

    if (!currentVoiceSpeed) {
      currentVoiceSpeed = document.createElement('span');
      currentVoiceSpeed.classList.add('current-voice-speed');
      currentVoiceSpeed.style.position = 'absolute';
      currentVoiceSpeed.style.bottom = '45px';
      currentVoiceSpeed.style.fontFamily = 'Orbitron, sans-serif';
      soundSwitcher.appendChild(currentVoiceSpeed);
    }

    if (currentSpeed <= minVoiceSpeed || currentSpeed >= maxVoiceSpeed) {
      currentVoiceSpeed.innerHTML = iconRangeisOut;
    } else {
      currentVoiceSpeed.textContent = currentSpeed.toFixed(1);
    }

    if (currentVoiceSpeed.timeoutId) {
      clearTimeout(currentVoiceSpeed.timeoutId);
    }

    currentVoiceSpeed.timeoutId = setTimeout(() => {
      currentVoiceSpeed.remove();
    }, 1000);
  }

  // Add event listeners for Ctrl + Left Click to increase voice speed
  soundSwitcher.addEventListener('click', (event) => {
    if (isCtrlKeyPressed && event.ctrlKey && event.button === 0) { // check for ctrl + left click
      const newSpeed = parseFloat(voiceSpeed) + 0.1; // Calculate new speed without rounding
      const limitedSpeed = Math.min(newSpeed, maxVoiceSpeed); // Limit maximum voice speed
      if (limitedSpeed !== voiceSpeed) {
        voiceSpeed = parseFloat(limitedSpeed.toFixed(1)); // Round and assign to voiceSpeed
        localStorage.setItem('voiceSpeed', voiceSpeed.toString());
        showCurrentSpeed(voiceSpeed);
      }
    }
  });

  // Add event listeners for Ctrl + Right Click to decrease voice speed
  soundSwitcher.addEventListener('contextmenu', (event) => {
    if (isCtrlKeyPressed && event.ctrlKey && event.button === 2) { // check for ctrl + right click
      event.preventDefault();
      const newSpeed = parseFloat(voiceSpeed) - 0.1; // Calculate new speed without rounding
      const limitedSpeed = Math.max(newSpeed, minVoiceSpeed); // Limit minimum voice speed
      if (limitedSpeed !== voiceSpeed) {
        voiceSpeed = parseFloat(limitedSpeed.toFixed(1)); // Round and assign to voiceSpeed
        localStorage.setItem('voiceSpeed', voiceSpeed.toString());
        showCurrentSpeed(voiceSpeed);
      }
    }
  });

  const soundIcon = document.createElement('span');
  soundIcon.classList.add('sound-icon');

  function updateSoundIcon() {
    switch (soundSwitcher.id) {
      case 'silence':
        soundIcon.innerHTML = iconSoundSilence;
        break;
      case 'beep':
        soundIcon.innerHTML = iconSoundBeep;
        break;
      case 'voice':
        soundIcon.innerHTML = iconSoundVoice;
        break;
    }
  }

  // Initially update icon on every page load
  updateSoundIcon();

  soundSwitcher.appendChild(soundIcon);
  chatButtonsPanel.appendChild(soundSwitcher);


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
    // Assign empty variable with data
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
    let messages = document.querySelectorAll('.messages-content div p');
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

  // create a new MutationObserver to wait for the chat to fully load with all messages
  var waitForChatObserver = new MutationObserver(function (mutations) {
    // Get all the message elements from messages container
    const messages = document.querySelectorAll('.messages-content div p');

    // check if the chat element has been added to the DOM
    if (document.contains(messagesContainer)) {
      // check if there are at least 20 messages in the container
      if (messages.length >= 20) {
        // stop observing the DOM
        waitForChatObserver.disconnect();
        executeMessageRemover();
      }
    }
  });

  // start observing the DOM for changes
  waitForChatObserver.observe(document, { childList: true, subtree: true });

})();