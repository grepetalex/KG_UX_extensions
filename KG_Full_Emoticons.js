// ==UserScript==
// @name         KG_Full_Emoticons
// @namespace    http://klavogonki.ru/
// @version      0.1
// @description  Show all the emoticons
// @author       Patcher
// @match        *://klavogonki.ru/g*
// @match        *://klavogonki.ru/forum/*
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
  "8 March": [
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

let roomField = null;
let isEventListenersInitialized = false;
let isPopupCreated = false;
let activeCategory = 'Boys';

// Keep track of the last focused textarea
let lastFocusedTextarea = null;

// Function to determine which chat room we are in
function determineChatRoom() {
  if (!roomField) {
    const currentURL = window.location.href;
    const allowedDomains = ["klavogonki.ru"];

    if (allowedDomains.some(domain => currentURL.includes(domain))) {
      if (currentURL.includes("/gamelist")) {
        roomField = document.querySelector('#chat-general input.text');
        console.log("Chat Field (General):", roomField);
      } else if (currentURL.includes("/g/?gmid=")) {
        roomField = document.querySelector('div[id*="chat-game"] input.text');
        console.log("Chat Field (Game):", roomField);
      } else if (currentURL.includes("/forum")) {
        roomField = document.querySelectorAll('textarea');
        console.log("Chat Field (Forum):", roomField);
      }
    }
  }
  return roomField;
}

// Function to remove the emoticons popup
function removeEmoticonsPopup() {
  const popupBox = document.querySelector('.emoticons-popup');
  if (popupBox) {
    document.body.removeChild(popupBox);
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

// Function to toggle the emoticons popup on double click
function toggleEmoticonsPopup() {
  if (isPopupCreated) {
    removeEmoticonsPopup();
  } else {
    createEmoticonsPopup(activeCategory);
  }
}

// Function to handle focus on textareas
function handleTextareaFocus(event) {
  lastFocusedTextarea = event.target;
}

// Attach a focus event listener to all textareas
const textAreas = document.querySelectorAll('textarea');
textAreas.forEach(textArea => {
  textArea.addEventListener('focus', handleTextareaFocus);
});


// Function to initialize event listeners
function initializeEventListeners() {
  if (!isEventListenersInitialized) {
    document.addEventListener('keydown', function (event) {
      if (event.ctrlKey && event.code === 'Semicolon') {
        event.preventDefault();
        createEmoticonsPopup(activeCategory);
      } else if (event.key === 'Escape') {
        removeEmoticonsPopup();
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
            if (event.detail === 2) {
              event.preventDefault(); // Prevent the default behavior of double-click
              toggleEmoticonsPopup();
            }
          });
        });
      } else {
        roomField.addEventListener('mousedown', function (event) {
          if (event.detail === 2) {
            event.preventDefault(); // Prevent the default behavior of double-click
            toggleEmoticonsPopup();
          }
        });
      }
    }

    isEventListenersInitialized = true;
  }
}

// Function to create the emoticons popup for a given category
function createEmoticonsPopup(category) {
  if (!isPopupCreated) {
    const popupBox = document.createElement('div');

    // Add a double-click event listener to popupBox if it exists
    if (popupBox) {
      popupBox.addEventListener('dblclick', removeEmoticonsPopup);
    }

    popupBox.style.position = 'fixed';
    popupBox.style.display = 'grid';

    // Define the grid properties for the popup
    popupBox.style.gridTemplateRows = "50px auto";
    popupBox.style.gridGap = '10px';

    // Calculate background color for the popup
    const bodyBackgroundColor = window.getComputedStyle(document.body).backgroundColor;
    const bodyLightness = getLightness(bodyBackgroundColor);
    const popupLightness = bodyLightness < 50 ? bodyLightness + 10 : bodyLightness - 10;
    const adjustedPopupLightness = Math.min(100, Math.max(0, popupLightness));
    const popupBackgroundColor = `hsl(0, 0%, ${adjustedPopupLightness}%)`;

    popupBox.style.backgroundColor = popupBackgroundColor;
    popupBox.style.border = 'none';
    popupBox.style.padding = '10px';
    popupBox.style.zIndex = '9999';
    popupBox.style.top = '50%';
    popupBox.style.left = '50%';
    popupBox.style.transform = 'translate(-50%, -50%)';
    popupBox.style.maxWidth = '50vw';
    popupBox.style.width = '50vw';
    popupBox.style.maxHeight = '50vh';
    popupBox.style.overflow = 'auto';

    // Create category buttons inside the popup
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('category-buttons');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';

    for (const categoryKey in categories) {
      if (categories.hasOwnProperty(categoryKey)) {
        const button = document.createElement('button');
        button.textContent = categoryKey;
        button.dataset.category = categoryKey; // Set a dataset attribute for identifying the category

        const savedCategory = localStorage.getItem('activeCategory');
        const isButtonActive = savedCategory === categoryKey;

        // Determine the button lightness based on whether it's the active category or not
        let buttonLightness = bodyLightness;

        if (isButtonActive) {
          buttonLightness = bodyLightness < 50 ? bodyLightness + 20 : bodyLightness - 20;
        } else {
          buttonLightness = bodyLightness < 50 ? bodyLightness + 15 : bodyLightness - 15;
        }

        const adjustedButtonLightness = Math.min(100, Math.max(0, buttonLightness));
        const buttonBackgroundColor = `hsl(0, 0%, ${adjustedButtonLightness}%)`;

        button.style.backgroundColor = buttonBackgroundColor;
        button.style.border = 'none';
        button.style.outline = 'none';
        button.style.marginRight = '5px';
        button.style.cursor = 'pointer';

        button.addEventListener('click', () => {
          changeActiveCategory(categoryKey);
        });

        button.addEventListener('mouseover', () => {
          const currentButtonLightness = getLightness(button.style.backgroundColor);
          const hoverLightness = bodyLightness < 50
            ? currentButtonLightness + 10
            : currentButtonLightness - 10;

          const adjustedHoverLightness = Math.min(100, Math.max(0, hoverLightness));
          const hoverBackgroundColor = `hsl(0, 0%, ${adjustedHoverLightness}%)`;

          button.style.backgroundColor = hoverBackgroundColor;
        });

        button.addEventListener('mouseout', () => {
          button.style.backgroundColor = buttonBackgroundColor;
        });

        buttonContainer.appendChild(button);
      }
    }

    popupBox.appendChild(buttonContainer);

    const emoticonButtonsContainer = document.createElement('div');
    emoticonButtonsContainer.classList.add('emoticon-buttons');
    emoticonButtonsContainer.style.display = 'none'; // Initially hide the container
    emoticonButtonsContainer.style.gridGap = '10px';

    const imageLoadPromises = [];

    categories[category].forEach(emoticon => {
      const button = document.createElement('button');
      const emoticonName = emoticon;
      const imgSrc = `/img/smilies/${emoticonName}.gif`;
      const imgAlt = emoticonName;
      const buttonTitle = emoticonName;

      const buttonLightness = bodyLightness < 50 ? bodyLightness + 15 : bodyLightness - 15;
      const adjustedButtonLightness = Math.min(100, Math.max(0, buttonLightness));
      const buttonBackgroundColor = `hsl(0, 0%, ${adjustedButtonLightness}%)`;

      button.style.backgroundColor = buttonBackgroundColor;
      button.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;
      button.title = buttonTitle;
      button.style.border = 'none';
      button.style.outline = 'none';

      const imageLoadPromise = new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          resolve();
        };
        img.src = imgSrc;
      });

      imageLoadPromises.push(imageLoadPromise);

      button.addEventListener('click', function (event) {
        if (!event.ctrlKey) {
          insertEmoticonCode(emoticon);
          removeEmoticonsPopup();
        } else {
          // If Ctrl key is pressed, just insert the emoticon code
          insertEmoticonCode(emoticon);
        }
      });

      button.addEventListener('mouseover', () => {
        const currentButtonLightness = getLightness(button.style.backgroundColor);
        const hoverLightness = bodyLightness < 50
          ? currentButtonLightness + 10
          : currentButtonLightness - 10;

        const adjustedHoverLightness = Math.min(100, Math.max(0, hoverLightness));
        const hoverBackgroundColor = `hsl(0, 0%, ${adjustedHoverLightness}%)`;

        button.style.backgroundColor = hoverBackgroundColor;
      });

      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = buttonBackgroundColor;
      });

      emoticonButtonsContainer.appendChild(button);
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
  const roomField = lastFocusedTextarea || determineChatRoom();
  if (roomField) {
    const cursorPosition = roomField.selectionStart;
    let emoticonCode;

    // Check if the current URL indicates a forum page
    const isForumPage = window.location.href.includes("/forum");

    // Set the format based on whether it's a forum or not
    if (isForumPage) {
      // Forum BBCode format
      emoticonCode = `[img]https://klavogonki.ru/img/smilies/${emoticon}.gif[/img] `;
    } else {
      // Chat format
      emoticonCode = `:${emoticon}: `;
    }

    // Get the current value of the input field
    const currentValue = roomField.value;

    // Insert the emoticon code at the cursor position
    const newValue =
      currentValue.substring(0, cursorPosition) +
      emoticonCode +
      currentValue.substring(cursorPosition);

    // Update the input field value with the new value
    roomField.value = newValue;

    // Set the cursor position after the inserted emoticon
    roomField.setSelectionRange(cursorPosition + emoticonCode.length, cursorPosition + emoticonCode.length);

    // Focus on the input field
    roomField.focus();
  }
}

// Function to get lightness from an RGB color string
function getLightness(color) {
  const match = color.match(/\d+/g);
  if (match && match.length === 3) {
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const lightness = ((max + min) / 2) * 100;
    return lightness;
  }
  return 0;
}

// Function to change the active category
function changeActiveCategory(newCategory) {
  // Save the new active category to localStorage
  localStorage.setItem('activeCategory', newCategory);

  // Update the activeCategory variable
  activeCategory = newCategory;

  // Remove the existing emoticons popup (if any)
  removeEmoticonsPopup();

  // Create a new emoticons popup with the updated category
  createEmoticonsPopup(activeCategory);
}

// Initialize event listeners and create the emoticons popup with the default category
initializeEventListeners();

// Retrieve the active category from localStorage or use the default category if not found
activeCategory = localStorage.getItem('activeCategory') || 'Boys';