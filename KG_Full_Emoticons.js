// ==UserScript==
// @name         KG_Full_Emoticons
// @namespace    http://klavogonki.ru/
// @version      0.1
// @description  Show all the emoticons
// @author       Patcher
// @match        *://klavogonki.ru/g*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

const categories = {
  "Boys": [
    ":heart:", ":facepalm:", ":friends:", ":shok:", ":megashok:", ":dash:", ":music:", ":acute:",
    ":victory:", ":scare:", ":clapping:", ":whistle:", ":popcorn:", ":hello:", ":rose:", ":good:",
    ":silence:", ":bad:", ":tea:", ":sick:", ":confuse:", ":rofl2:", ":nervous:", ":chaingun:",
    ":diablo:", ":cult:", ":russian:", ":birthday:", ":champ2:", ":champ:", ":confetti:", ":formula1:"
  ],
  "Girls": [
    ":girlnotebook:", ":girlkiss:", ":curtsey:", ":girlblum:", ":girlcrazy:", ":girlcry:",
    ":girlwink:", ":girlwacko:", ":umbrage:", ":girlinlove:", ":girldevil:", ":girlimpossible:",
    ":girlwitch:", ":hysteric:", ":tender:", ":spruceup:", ":girlsad:", ":girlscare:", ":girltea:",
    ":girlsick:", ":grose:", ":cheerful:", ":cheerleader:", ":girlconfuse:", ":spruceup1:",
    ":angrygirl:", ":clapgirl:", ":goody:", ":hiya:", ":girlsilence:", ":girlstop:", ":girlnervous:",
    ":girlwonder:", ":girlwonder:", ":kgrace:", ":kgagainstaz:", ":girlkissboy:", ":girlmusic:"
  ],
  "Christmas": [
    ":cheers:", ":christmasevil:", ":heyfrombag:", ":merrychristmas:", ":moose:", ":santa:",
    ":santa2:", ":santa3:", ":santasnegurka:", ":snegurka:", ":snegurochka:", ":snowball:",
    ":snowgirlwave:", ":snowhand:", ":snowhit:", ":snowman:", ":spruce:"
  ],
  "Inlove": [
    ":adultery:", ":airkiss:", ":cave:", ":flowers:", ":flowers2:", ":frog:", ":girlfrog:",
    ":girlheart2:", ":girllove:", ":grose:", ":heart2:", ":heartcake:", ":hug:", ":inlove:",
    ":nolove:", ":smell:", ":wecheers:", ":wedance:", ":wedding:", ":wine:"
  ],
  "Army": [
    ":ak47:", ":armyfriends:", ":armyscare:", ":armystar:", ":armytongue:", ":barret:",
    ":bayanist:", ":budenov:", ":captain:", ":comandos:", ":fly:", ":foolrifle:", ":girlpogran:",
    ":girlranker:", ":girlrogatka:", ":girlvdv:", ":kirpich:", ":partizan:", ":pogran:",
    ":pogranflowers:", ":pogranmail:", ":pogranmama:", ":pogranminigun:", ":pogranrose:",
    ":pograntort:", ":prival:", ":radistka:", ":ranker:", ":rogatka:", ":soldier:", ":tank:",
    ":uzi:", ":vdv:", ":vpered:", ":vtik:"
  ],
  "8 March": [
    ":boystroking:", ":cheerleader:", ":confetti:", ":enjoygift:", ":firework:", ":girlicecream:",
    ":girlmad:", ":girlobserve:", ":girlrevolve:", ":girlshighfive:", ":girlstroking:", ":girlsuper:",
    ":grats:", ":hairdryer:", ":leisure:", ":primp:", ":respect:", ":serenade:", ":spruceup:"
  ],
  "Halloween": [
    ":alien:", ":batman:", ":bebebe:", ":bite:", ":carpet:", ":clown:", ":corsair:", ":cowboy:",
    ":cyborg:", ":dandy:", ":death:", ":dwarf:", ":gangster:", ":ghost:", ":girlpirate:", ":holmes:",
    ":indigenous:", ":jester:", ":mafia:", ":musketeer:", ":paladin:", ":pioneer:", ":pirate:",
    ":pirates:", ":robot:", ":rocker:", ":spider:", ":supergirl:", ":terminator:", ":turtle:",
    ":vampire:", ":witch:", ":wizard:"
  ]
};

let roomField = null;
let isEventListenersInitialized = false;
let isPopupCreated = false;
let activeCategory = 'Boys';

// Function to determine which chat room we are in
function determineChatRoom() {
  if (!roomField) {
    if (window.location.href.startsWith("https://klavogonki.ru/gamelist")) {
      roomField = document.querySelector('#chat-general input.text');
      console.log("Chat Field (General):", roomField);
    } else if (window.location.href.startsWith("https://klavogonki.ru/g/?gmid=")) {
      roomField = document.querySelector('div[id*="chat-game"] input.text');
      console.log("Chat Field (Game):", roomField);
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
    const emoticonName = emoticon.substring(1, emoticon.length - 1);
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
        createEmoticonsPopup(activeCategory);
      } else if (event.key === 'Escape') {
        removeEmoticonsPopup();
      }
    });

    isEventListenersInitialized = true;
  }
}

// Function to create the emoticons popup for a given category
function createEmoticonsPopup(category) {
  if (!isPopupCreated) {
    const popupBox = document.createElement('div');
    popupBox.style.position = 'fixed';
    popupBox.style.display = 'grid';

    // Calculate the maximum image width and height for a given category
    const { maxImageWidth, maxImageHeight } = calculateMaxImageDimensions(categories[category]);

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
        button.addEventListener('click', () => {
          changeActiveCategory(categoryKey);
        });

        // Apply button styles
        const buttonLightness = bodyLightness < 50 ? bodyLightness + 15 : bodyLightness - 15;
        const adjustedButtonLightness = Math.min(100, Math.max(0, buttonLightness));
        const buttonBackgroundColor = `hsl(0, 0%, ${adjustedButtonLightness}%)`;

        button.style.backgroundColor = buttonBackgroundColor;
        button.style.border = 'none';
        button.style.outline = 'none';
        button.style.marginRight = '5px';
        button.style.cursor = 'pointer';

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
    emoticonButtonsContainer.style.display = 'grid';
    emoticonButtonsContainer.style.gridGap = '10px';
    emoticonButtonsContainer.style.gridTemplateColumns = `repeat(auto-fit, minmax(${maxImageWidth}px, 1fr))`;
    emoticonButtonsContainer.style.gridAutoRows = `minmax(${maxImageHeight}px, auto)`;

    categories[category].forEach(emoticon => {
      const button = document.createElement('button');
      const emoticonName = emoticon.substring(1, emoticon.length - 1);
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

    popupBox.appendChild(emoticonButtonsContainer);

    popupBox.classList.add('emoticons-popup');
    document.body.appendChild(popupBox);
    isPopupCreated = true;
  }
}

// Function to insert emoticon code into the input field
function insertEmoticonCode(emoticon) {
  const roomField = determineChatRoom();
  if (roomField) {
    const cursorPosition = roomField.selectionStart;
    const emoticonCode = `${emoticon} `;

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