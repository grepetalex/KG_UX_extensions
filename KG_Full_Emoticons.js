// ==UserScript==
// @name         KG_Full_Emoticons
// @namespace    http://klavogonki.ru/
// @version      0.6
// @description  Show all the emoticons
// @author       Patcher
// @match        *://klavogonki.ru/g*
// @match        *://klavogonki.ru/forum/*
// @match        *://klavogonki.ru/u/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

const categories = {
  "Boys": [
    "smile", "biggrin", "angry", "blink", "blush", "cool", "dry", "excl", "happy",
    "huh", "laugh", "mellow", "ohmy", "ph34r", "rolleyes", "sad", "sleep", "tongue",
    "unsure", "wacko", "wink", "wub", "first", "second", "third", "power", "badcomp",
    "complaugh", "crazy", "boredom", "cry", "bye", "dance", "gamer", "rofl", "beer",
    "kidtruck", "angry2", "spiteful", "sorry", "boykiss", "kissed", "yes", "no", "heart",
    "hi", "ok", "facepalm", "friends", "shok", "megashok", "dash", "music", "acute", "victory",
    "scare", "clapping", "whistle", "popcorn", "hello", "rose", "good", "silence", "bad", "tea",
    "sick", "confuse", "rofl2", "nervous", "chaingun", "diablo", "cult", "russian", "birthday",
    "champ2", "champ", "confetti", "formula1"
  ],
  "Girls": [
    "girlnotebook", "girlkiss", "curtsey", "girlblum", "girlcrazy", "girlcry",
    "girlwink", "girlwacko", "umbrage", "girlinlove", "girldevil", "girlimpossible",
    "girlwitch", "hysteric", "tender", "spruceup", "girlsad", "girlscare", "girltea",
    "girlsick", "grose", "cheerful", "cheerleader", "girlconfuse", "spruceup1",
    "angrygirl", "clapgirl", "goody", "hiya", "girlsilence", "girlstop", "girlnervous",
    "girlwonder", "girlwonder", "kgrace", "kgagainstaz", "girlkissboy", "girlmusic"
  ],
  "Christmas": [
    "cheers", "christmasevil", "heyfrombag", "merrychristmas", "moose", "santa",
    "santa2", "santa3", "santasnegurka", "snegurka", "snegurochka", "snowball",
    "snowgirlwave", "snowhand", "snowhit", "snowman", "spruce"
  ],
  "Inlove": [
    "adultery", "airkiss", "cave", "flowers", "flowers2", "frog", "girlfrog",
    "girlheart2", "girllove", "grose", "heart2", "heartcake", "hug", "inlove",
    "nolove", "smell", "wecheers", "wedance", "wedding", "wine"
  ],
  "Army": [
    "ak47", "armyfriends", "armyscare", "armystar", "armytongue", "barret",
    "bayanist", "budenov", "captain", "comandos", "fly", "foolrifle", "girlpogran",
    "girlranker", "girlrogatka", "girlvdv", "kirpich", "partizan", "pogran",
    "pogranflowers", "pogranmail", "pogranmama", "pogranminigun", "pogranrose",
    "pograntort", "prival", "radistka", "ranker", "rogatka", "soldier", "tank",
    "uzi", "vdv", "vpered", "vtik"
  ],
  "WomenDay": [
    "boystroking", "cheerleader", "confetti", "enjoygift", "firework", "girlicecream",
    "girlmad", "girlobserve", "girlrevolve", "girlshighfive", "girlstroking", "girlsuper",
    "grats", "hairdryer", "leisure", "primp", "respect", "serenade", "spruceup"
  ],
  "Halloween": [
    "alien", "batman", "bebebe", "bite", "carpet", "clown", "corsair", "cowboy",
    "cyborg", "dandy", "death", "dwarf", "gangster", "ghost", "girlpirate", "holmes",
    "indigenous", "jester", "mafia", "musketeer", "paladin", "pioneer", "pirate",
    "pirates", "robot", "rocker", "spider", "supergirl", "terminator", "turtle",
    "vampire", "witch", "wizard"
  ]
};

// Define emoji symbols for categories
const categoryEmojis = {
  "Boys": "😃",
  "Girls": "👧",
  "Christmas": "🎄",
  "Inlove": "❤️",
  "Army": "🔫",
  "WomenDay": "🌼",
  "Halloween": "🎃",
};

let roomField = null;
let isEventListenersInitialized = false;
let isPopupCreated = false;
let activeCategory = 'Boys';

// Keep track of the last focused textarea
let lastFocusedTextarea = null;

// Flags to prevent multiple detections of Profile textareas
let hasDetectedProfileTextarea = false;

// Function to debounce resetting the flags
function debounceResetFlags() {
  setTimeout(() => {
    hasDetectedProfileTextarea = false;
  }, 3000);
}

// Function to handle focus on textareas only for forum
function handleTextareaFocus(event) {
  lastFocusedTextarea = event.target;
}

// Function to determine which chat room we are in
function determineChatRoom() {
  // Check if the roomField has not been set yet
  if (!roomField) {
    // Get the current URL of the webpage
    const currentURL = window.location.href;

    // Define an array of allowed domains
    const allowedDomains = ["klavogonki.ru"];

    // Check if the current URL includes any allowed domains
    if (allowedDomains.some(domain => currentURL.includes(domain))) {
      // Check the URL path to determine the context
      if (currentURL.includes("/gamelist")) {
        // Set roomField to the General chat input field
        roomField = document.querySelector('#chat-general input.text');
        // console.log("Chat Field (General):", roomField);
      } else if (currentURL.includes("/g/?gmid=")) {
        // Set roomField to the Game chat input field
        roomField = document.querySelector('div[id*="chat-game"] input.text');
        // console.log("Chat Field (Game):", roomField);
      } else if (currentURL.includes("/forum")) {
        // Select all forum textareas
        let allForumTextareas = document.querySelectorAll('textarea');
        // Set roomField to an array of Forum textareas
        roomField = allForumTextareas;
        console.log("Chat Field (Forum):", roomField);
        allForumTextareas.forEach(textArea => {
          textArea.addEventListener('focus', handleTextareaFocus);
        });
      } else if (currentURL.includes("/u/")) {
        // Check if neither Direct Message, Saved Message, nor Journal has been detected yet
        if (!hasDetectedProfileTextarea) {
          // Create a Mutation Observer to watch for changes in the document
          const observer = new MutationObserver(() => {
            // Check for the presence of Direct Message, Saved Message, Edit Bio and Journal textareas
            const directMessageTextarea = document.querySelector('.dlg-send-user-message .message-text textarea');
            const savedMessageTextarea = document.querySelector('.profile-messages .dialog-write textarea');
            const editBioTextarea = document.querySelector('.profile-edit-bio .edit textarea');
            const journalMessageTextarea = document.querySelectorAll('.profile-root .journal .write textarea');

            // Find the focused textarea among the detected textareas
            for (const textarea of journalMessageTextarea) {
              if (document.activeElement === textarea) {
                // Store in the global variable
                lastFocusedTextarea = textarea;
                break;
              }
            }

            // Set roomField based on the detected textarea
            if (directMessageTextarea && !hasDetectedProfileTextarea) {
              // Set roomField to the Direct Message textarea
              roomField = directMessageTextarea;
              console.log("Chat Field (Direct Message):", roomField);
            } else if (savedMessageTextarea && !hasDetectedProfileTextarea) {
              // Set roomField to the Saved Message textarea
              roomField = savedMessageTextarea;
              console.log("Chat Field (Saved Message):", roomField);
            } else if (lastFocusedTextarea && !hasDetectedProfileTextarea) {
              // Set roomField to the last focused textarea
              roomField = lastFocusedTextarea;
              console.log("Chat Field (Journal):", roomField);
            } else if (editBioTextarea && !hasDetectedProfileTextarea) {
              // Set roomField to the Edit Bio Textarea
              roomField = editBioTextarea;
              console.log("Chat Field (Edit Bio):", roomField);
            }

            // Initialize event listeners for this textarea
            initializeEventListeners();
            // Set the flag to prevent further detections
            hasDetectedProfileTextarea = true;
            // Debounce resetting the flags
            debounceResetFlags();
          });

          // Start observing mutations in the document's structure
          observer.observe(document.documentElement, { childList: true, subtree: true });
        }
      }
    }
  }
  // Return the determined or detected roomField
  return roomField;
}

// Function to remove the emoticons popup
function removeEmoticonsPopup() {
  const popupBox = document.querySelector('.emoticons-popup');
  if (popupBox) {
    document.body.removeChild(popupBox);

    // Remove event listener for the "Tab" key press
    document.removeEventListener('keydown', changeCategoryOnTabPress);

    isPopupCreated = false; // Reset the flag when the popup is removed
  }
}

// Function to calculate the maximum image width and height for a given category
function calculateMaxImageDimensions(category) {
  const maxImageWidth = 34;
  const maxImageHeight = 34;

  const maxImageWidthCalculated = category.reduce((maxWidth, emoticon) => {
    const emoticonName = emoticon;
    const imgSrc = `/img/smilies/${emoticonName}.gif`;
    const img = new Image();
    img.src = imgSrc;
    const imageWidth = img.width;
    return Math.max(maxWidth, imageWidth);
  }, maxImageWidth);

  return { maxImageWidth: maxImageWidthCalculated, maxImageHeight };
}

// Function to initialize event listeners
function initializeEventListeners() {
  if (!isEventListenersInitialized) {
    document.addEventListener('keydown', function (event) {
      if (event.ctrlKey && event.code === 'Semicolon') {
        event.preventDefault();
        toggleEmoticonsPopup(); // Toggle the emoticons panel
        // console.log('Ctrl + Semicolon pressed');
      } else if (event.key === 'Escape') {
        removeEmoticonsPopup(); // Close the emoticons panel if it exists
        console.log('Escape key pressed');
      }
    });

    // Attach a mousedown event listener to the document and use event delegation
    document.addEventListener('mousedown', function (event) {
      // Check if the target element matches any of the textarea selectors
      const textareaSelectors = [
        '.dlg-send-user-message .message-text textarea',
        '.profile-messages .dialog-write textarea',
        '.profile-edit-bio .edit textarea',
        '.profile-root .journal .write textarea'
      ];

      if (textareaSelectors.some(selector => event.target.matches(selector))) {
        if (event.shiftKey && event.detail === 2) {
          event.preventDefault(); // Prevent the default behavior of double-click
          toggleEmoticonsPopup();
          console.log('Textarea Double-Click Event Executed');
        }
      }
    });

    // Attempt to find the chat input field
    roomField = determineChatRoom();

    // Check if the chat input field was found
    if (roomField) {
      // Attach a mousedown event listener to the chat field(s)
      if (roomField instanceof NodeList || roomField instanceof HTMLCollection) {
        roomField.forEach(textArea => {
          textArea.addEventListener('mousedown', function (event) {
            if (event.shiftKey && event.detail === 2) {
              event.preventDefault(); // Prevent the default behavior of double-click
              toggleEmoticonsPopup();
              console.log('Chat Field Double-Click Event Executed');
            }
          });
        });
      } else {
        roomField.addEventListener('mousedown', function (event) {
          if (event.shiftKey && event.detail === 2) {
            event.preventDefault(); // Prevent the default behavior of double-click
            toggleEmoticonsPopup();
            console.log('Chat Field Double-Click Event Executed');
          }
        });
      }
    }

    isEventListenersInitialized = true;
  }
}

// Toggles the emoticons panel by checking its existence and taking appropriate action.
function toggleEmoticonsPopup() {
  // Find the emoticons panel element with the class '.emoticons-popup'
  const emoticonsPopup = document.querySelector('.emoticons-popup');

  // Check if the emoticons panel element exists in the document
  if (emoticonsPopup) {
    // If the panel exists, close it by removing it from the DOM
    removeEmoticonsPopup();
  } else {
    // If the panel doesn't exist, create and display it with the active category
    createEmoticonsPopup(activeCategory);
  }
}

// Helper function to check if an element matches a selector
function matchesSelector(element, selector) {
  return element && element.matches && element.matches(selector);
}

// Get current body background color
const bodyBackgroundColor = window.getComputedStyle(document.body).backgroundColor;
// Store the lightness with the helper function getLightness
const bodyLightness = getLightness(bodyBackgroundColor);

// Function to get lightness from an RGB color string and round it
function getLightness(color) {
  const match = color.match(/\d+/g);
  if (match && match.length === 3) {
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const lightness = Math.round(((max + min) / 2) * 100); // Round to the nearest integer
    return lightness;
  }
  return 0;
}

// Function to get the adjusted background color in HSL format
function getAdjustedBackground(caseType) {
  let adjustment = 0;

  switch (caseType) {
    case 'popupBackground':
      adjustment = 10;
      break;
    case 'defaultButton':
      adjustment = 15;
      break;
    case 'hoverButton':
      adjustment = 25;
      break;
    case 'activeButton':
      adjustment = 35;
      break;
    default:
      adjustment = 0; // Default case, no adjustment
  }

  const adjustedLightness = bodyLightness < 50 ? bodyLightness + adjustment : bodyLightness - adjustment;
  const adjustedBackgroundColor = `hsl(0, 0%, ${adjustedLightness}%)`;
  return adjustedBackgroundColor;
}

// Store adjusted backgrounds for elements
const popupBackground = getAdjustedBackground('popupBackground');
const defaultButtonBackground = getAdjustedBackground('defaultButton');
const hoverButtonBackground = getAdjustedBackground('hoverButton');
const activeButtonBackground = getAdjustedBackground('activeButton');

// Function to create the emoticons popup for a given category
function createEmoticonsPopup(category) {
  // POPUP ITSELF
  if (!isPopupCreated) {
    const popupBox = document.createElement('div');

    if (popupBox) {
      // Add event listener for the "double-click"
      popupBox.addEventListener('dblclick', removeEmoticonsPopup);

      // Add event listener for the "Tab" key press
      document.addEventListener('keydown', changeCategoryOnTabPress);
    }

    // CLOSE BUTTON
    // Create a close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&#x2716;'; // Unicode character (X)
    closeButton.style.backgroundColor = 'rgb(57, 19, 19)';
    closeButton.style.color = 'rgb(217, 140, 140)';
    closeButton.style.border = '1px solid rgb(153, 51, 51)';
    closeButton.style.outline = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.width = '50px';
    closeButton.style.height = '50px';
    closeButton.style.margin = '8px';
    closeButton.style.position = 'absolute';
    closeButton.style.right = '0';

    // Add a click event listener to the close button
    closeButton.addEventListener('click', function () {
      removeEmoticonsPopup();
    });

    // Append the close button to the popupBox
    popupBox.appendChild(closeButton);

    popupBox.style.position = 'fixed';
    popupBox.style.display = 'grid';
    popupBox.style.gridTemplateRows = "50px auto";
    popupBox.style.gridGap = '10px';
    popupBox.style.backgroundColor = popupBackground;
    popupBox.style.border = 'none';
    popupBox.style.padding = '10px';
    popupBox.style.zIndex = '9999';
    popupBox.style.top = '50%';
    popupBox.style.left = '50%';
    popupBox.style.transform = 'translate(-50%, 150px)';
    popupBox.style.maxWidth = '50vw';
    popupBox.style.minWidth = '550px';
    popupBox.style.width = '50vw';
    popupBox.style.maxHeight = '50vh';
    popupBox.style.overflow = 'auto';
    popupBox.style.top = '0';

    // CATEGORY BUTTONS
    // Create a container for category buttons
    const categoryButtonsContainer = document.createElement('div');
    categoryButtonsContainer.classList.add('category-buttons');
    categoryButtonsContainer.style.display = 'flex';
    categoryButtonsContainer.style.justifyContent = 'center';

    // Create a function to add event listeners for category buttons
    function addCategoryButtonListeners(categoryButton, categoryKey) {
      // Add a click event listener to the category buttons
      categoryButton.addEventListener('click', () => {
        // Call a function to set the active category
        changeActiveCategoryOnClick(categoryKey);
      });

      categoryButton.addEventListener('mouseover', () => {
        categoryButton.style.backgroundColor = hoverButtonBackground;
      });

      categoryButton.addEventListener('mouseout', () => {
        // Update the background color based on whether it's the active category or not
        categoryButton.style.backgroundColor = categoryKey === activeCategory ? activeButtonBackground : defaultButtonBackground;
      });
    }

    // Create category buttons inside the popup
    for (const categoryKey in categories) {
      if (categories.hasOwnProperty(categoryKey)) {
        const categoryButton = document.createElement('button');
        categoryButton.innerHTML = categoryEmojis[categoryKey]; // Use emoji symbol
        categoryButton.dataset.category = categoryKey; // Set a dataset attribute for identifying the category

        const savedCategory = localStorage.getItem('activeCategory');
        const isButtonActive = savedCategory === categoryKey;

        // Determine the button background color based on whether it's the active category or not
        const categoryButtonBackground = isButtonActive ? activeButtonBackground : defaultButtonBackground;

        categoryButton.style.backgroundColor = categoryButtonBackground;
        categoryButton.style.border = 'none';
        categoryButton.style.outline = 'none';
        categoryButton.style.marginRight = '5px';
        categoryButton.style.cursor = 'pointer';
        categoryButton.style.minWidth = '50px';
        categoryButton.style.minHeight = '50px';
        categoryButton.style.fontSize = '1.4em';

        // Add event listeners for the category button using the function
        addCategoryButtonListeners(categoryButton, categoryKey);

        categoryButtonsContainer.appendChild(categoryButton);
      }
    }

    popupBox.appendChild(categoryButtonsContainer);

    // EMOTICON BUTTONS
    // Create a container for emoticon buttons
    const emoticonButtonsContainer = document.createElement('div');
    emoticonButtonsContainer.classList.add('emoticon-buttons');
    emoticonButtonsContainer.style.display = 'none'; // Initially hide the container
    emoticonButtonsContainer.style.gridGap = '10px';

    const imageLoadPromises = [];

    categories[category].forEach(emoticon => {
      const emoticonButton = document.createElement('button');
      const emoticonName = emoticon;
      const imgSrc = `/img/smilies/${emoticonName}.gif`;
      const imgAlt = emoticonName;
      const buttonTitle = emoticonName;
      emoticonButton.style.backgroundColor = defaultButtonBackground;
      emoticonButton.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;
      emoticonButton.title = buttonTitle;
      emoticonButton.style.border = 'none';
      emoticonButton.style.outline = 'none';

      const imageLoadPromise = new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          resolve();
        };
        img.src = imgSrc;
      });

      imageLoadPromises.push(imageLoadPromise);

      emoticonButton.addEventListener('click', function (event) {
        if (!event.ctrlKey) {
          insertEmoticonCode(emoticon);
          removeEmoticonsPopup();
        } else {
          // If Ctrl key is pressed, just insert the emoticon code
          insertEmoticonCode(emoticon);
        }
      });

      emoticonButton.addEventListener('mouseover', () => {
        emoticonButton.style.backgroundColor = hoverButtonBackground;
      });

      emoticonButton.addEventListener('mouseout', () => {
        emoticonButton.style.backgroundColor = defaultButtonBackground;
      });

      emoticonButtonsContainer.appendChild(emoticonButton);
    });

    // Wait for all images to load before updating grid properties and making it visible
    Promise.all(imageLoadPromises).then(() => {
      // Calculate the maximum image width and height again after all images are loaded
      const { maxImageWidth: newMaxImageWidth, maxImageHeight: newMaxImageHeight } = calculateMaxImageDimensions(categories[category]);

      // Update grid properties with new values
      emoticonButtonsContainer.style.gridTemplateColumns = `repeat(auto-fit, minmax(${newMaxImageWidth}px, 1fr))`;
      emoticonButtonsContainer.style.gridAutoRows = `minmax(${newMaxImageHeight}px, auto)`;

      // Make it visible after all images are loaded
      emoticonButtonsContainer.style.display = 'grid';
    });

    popupBox.appendChild(emoticonButtonsContainer);

    popupBox.classList.add('emoticons-popup');
    document.body.appendChild(popupBox);
    isPopupCreated = true;
  }
}

// Function to insert emoticon code into the input field
function insertEmoticonCode(emoticon) {
  // Get the input or textarea element (roomField)
  const roomField = lastFocusedTextarea || determineChatRoom();

  // Check if roomField is not a valid input or textarea element
  if (!roomField || !(roomField instanceof HTMLInputElement) && !(roomField instanceof HTMLTextAreaElement)) {
    console.log('roomField is not in focus. Please click on the input field to select it before inserting the emoticon code.');
    return; // Exit the function early
  }

  // Get the cursor position
  const cursorPosition = roomField.selectionStart || 0; // Default to 0 if selectionStart is not supported

  // Check if the current URL indicates a forum page
  const isForumPage = window.location.href.includes("/forum");

  // Set the format based on whether it's a forum or not
  let emoticonCode;
  if (isForumPage) {
    // Forum BBCode format
    emoticonCode = `[img]https://klavogonki.ru/img/smilies/${emoticon}.gif[/img] `;
  } else {
    // Chat format
    emoticonCode = `:${emoticon}: `;
  }

  // Get the current value of the input field
  const currentValue = roomField.value || '';

  // Insert the emoticon code at the cursor position
  const newValue = currentValue.slice(0, cursorPosition) + emoticonCode + currentValue.slice(cursorPosition);

  // Update the input field value with the new value
  roomField.value = newValue;

  // Set the cursor position after the inserted emoticon
  roomField.setSelectionRange(cursorPosition + emoticonCode.length, cursorPosition + emoticonCode.length);

  // Focus on the input field
  roomField.focus();
}

// Function to change the active category
function changeActiveCategoryOnClick(newCategory) {
  // Save the new active category to localStorage
  localStorage.setItem('activeCategory', newCategory);

  // Update the activeCategory variable
  activeCategory = newCategory;

  // Remove the existing emoticons popup (if any)
  removeEmoticonsPopup();

  // Create a new emoticons popup with the updated category
  createEmoticonsPopup(activeCategory);
}

const categoryKeys = Object.keys(categories); // Define categoryKeys

// Function to change the active category based on the "Tab" key press
function changeCategoryOnTabPress(event) {
  const emoticonsPopup = document.querySelector('.emoticons-popup');

  if (event.key === 'Tab' && emoticonsPopup !== null) {
    event.preventDefault();

    // Get the currently active category from localStorage
    const activeCategory = localStorage.getItem('activeCategory');

    // Find the index of the active category in categoryKeys
    const activeCategoryIndex = categoryKeys.indexOf(activeCategory);

    // Determine the index of the next category to focus, cycling if necessary
    const nextCategoryIndex = (activeCategoryIndex + 1) % categoryKeys.length;

    // Get the name of the next category
    const nextCategory = categoryKeys[nextCategoryIndex];

    // Update the active category in localStorage
    localStorage.setItem('activeCategory', nextCategory);

    // Optionally, you can call changeActiveCategory to handle the category change
    changeActiveCategoryOnClick(nextCategory);

    // Log the active category for debugging
    // console.log(`Active Category: ${nextCategory}`);
  }
}

// Initialize event listeners and create the emoticons popup with the default category
initializeEventListeners();

// Retrieve the active category from localStorage or use the default category if not found
activeCategory = localStorage.getItem('activeCategory') || 'Boys';