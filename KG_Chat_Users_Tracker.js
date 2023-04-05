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
    { name: 'Даниэль', gender: 'male' },
    { name: 'певец', gender: 'male' },
    { name: 'ВеликийИнка', gender: 'male' },
    { name: 'madinko', gender: 'female' },
    { name: 'Переборыч', gender: 'male' },
    { name: 'Advisor', gender: 'male' },
    { name: 'Хеопс', gender: 'male' },
    { name: 'Рустамко', gender: 'male' }
  ];


  // SOUND NOTIFICATION

  // Note values and their corresponding frequencies
  // C0 to B8
  const notesToFrequency = {};
  for (let i = 0; i < 88; i++) {
    const note = i - 48;
    const frequency = Math.pow(2, (note - 9) / 12) * 440;
    notesToFrequency[i] = frequency;
  }

  // List of notes to play for "User Left" && "User Entered" && "New Messages"
  const userEnteredNotes = [48, 60]; // C4, C5
  const userLeftNotes = [60, 48]; // C5, C4
  const newMessageNotes = [65];

  // Volume and duration settings
  const volumeEntered = 0.35;
  const volumeLeft = 0.35;
  const volumeNewMessage = 0.35;
  const duration = 80;
  const fadeTime = 10;

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

  // define the voice for text to speech
  const voice = speechSynthesis.getVoices().find((voice) => voice.name === 'Microsoft Pavel - Russian (Russia)');

  // define the utterance object
  const utterance = new SpeechSynthesisUtterance();
  utterance.lang = 'ru-RU';
  utterance.voice = voice;

  // Text to speech function
  function textToSpeech(text) {
    // Replace underscores with spaces and match only letters
    const lettersOnly = text.replace(/_/g, ' ').replace(/[^a-zA-Zа-яА-Я ]/g, '');

    // set the text content of the utterance
    utterance.text = lettersOnly;

    // speak the utterance
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
    playBeep(userEnteredNotes, volumeEntered);
    const userGender = getUserGender(user);
    const action = verbs[userGender].enter;
    const message = `${user} ${action}`;
    setTimeout(() => {
      textToSpeech(message);
    }, 300);
  }

  function userLeft(user) {
    playBeep(userLeftNotes, volumeLeft);
    const userGender = getUserGender(user);
    const action = verbs[userGender].leave;
    const message = `${user} ${action}`;
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

            // Gradually increase the opacity of the dimming background
            let opacity = 0;
            const interval = setInterval(() => {
              opacity += 0.05;
              dimming.style.opacity = opacity.toString();

              if (opacity >= 0.5) {
                clearInterval(interval);
              }
            }, 10);

            const bigImage = createBigImage(img.src, dimming);

            bigImage.style.top = '50%';
            bigImage.style.left = '50%';
            bigImage.style.transform = 'translate(-50%, -50%) scale(1)';
            bigImage.style.position = 'fixed';
            bigImage.style.zIndex = '999';
            bigImage.style.transformOrigin = 'center center';


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
  const debounceTimeout = 300;

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
                userEntered(newUser, userGender);
              }
            }
          });

          leftUsers.forEach((leftUser) => {
            const userGender = getUserGender(leftUser) || 'male'; // use 'male' as default
            const action = verbs[userGender].leave;
            showUserAction(leftUser, action, false);
            if (usersToTrack.some(user => user.name === leftUser)) {
              userLeft(leftUser, userGender);
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
            // read the text content of the new message and speak it
            const latestMessageTextContent = localStorage.getItem('latestMessageTextContent');
            const newMessageTextContent = getLatestMessageTextContent();

            // Get the sound switcher element and check which option is selected
            const soundSwitcher = document.querySelector('#voice, #beep, #silence');
            const isVoice = soundSwitcher && soundSwitcher.id === 'voice';
            const isBeep = soundSwitcher && soundSwitcher.id === 'beep';
            const isSilence = soundSwitcher && soundSwitcher.id === 'silence';

            // Get the value of the sound switcher from local storage
            // If no value, set as default voice to speak every new message 
            const soundSwitcherValue = localStorage.getItem('soundSwitcher') || 'voice';

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
              textToSpeech(newMessageTextContent);
              localStorage.setItem('latestMessageTextContent', newMessageTextContent);
            }

            // If it's the first time, update the latest message content in local storage and set isInitialized to true
            if (!isInitialized) {
              localStorage.setItem('latestMessageTextContent', newMessageTextContent);
              isInitialized = true;
            }

            // If mode is beep, play the beep sound for the new message
            if (isBeep && isInitialized && newMessageTextContent && newMessageTextContent !== latestMessageTextContent) {
              playBeep(newMessageNotes, volumeNewMessage);
              localStorage.setItem('latestMessageTextContent', newMessageTextContent);
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
    const textNodes = [...message.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
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

  // Button SVG icons muted and unmuted representation
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
  soundSwitcher.addEventListener('click', function () {
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

})();