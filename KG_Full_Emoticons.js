// ==UserScript==
// @name         KG_Full_Emoticons
// @namespace    http://klavogonki.ru/
// @version      0.8
// @description  Display a popup panel with every available emoticon on the site.
// @match        *://klavogonki.ru/g*
// @match        *://klavogonki.ru/forum/*
// @match        *://klavogonki.ru/u/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
  // --------------------------
  // Data & Global Variables
  // --------------------------
  const categories = {
    Boys: [
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
    Girls: [
      "girlnotebook", "girlkiss", "curtsey", "girlblum", "girlcrazy", "girlcry",
      "girlwink", "girlwacko", "umbrage", "girlinlove", "girldevil", "girlimpossible",
      "girlwitch", "hysteric", "tender", "spruceup", "girlsad", "girlscare", "girltea",
      "girlsick", "grose", "cheerful", "cheerleader", "girlconfuse", "spruceup1",
      "angrygirl", "clapgirl", "goody", "hiya", "girlsilence", "girlstop", "girlnervous",
      "girlwonder", "girlwonder", "kgrace", "kgagainstaz", "girlkissboy", "girlmusic"
    ],
    Christmas: [
      "cheers", "christmasevil", "heyfrombag", "merrychristmas", "moose", "santa",
      "santa2", "santa3", "santasnegurka", "snegurka", "snegurochka", "snowball",
      "snowgirlwave", "snowhand", "snowhit", "snowman", "spruce"
    ],
    Inlove: [
      "adultery", "airkiss", "cave", "flowers", "flowers2", "frog", "girlfrog",
      "girlheart2", "girllove", "grose", "heart2", "heartcake", "hug", "inlove",
      "nolove", "smell", "wecheers", "wedance", "wedding", "wine", "val", "girlval", "bemine"
    ],
    Army: [
      "ak47", "armyfriends", "armyscare", "armystar", "armytongue", "barret",
      "bayanist", "budenov", "captain", "comandos", "fly", "foolrifle", "girlpogran",
      "girlranker", "girlrogatka", "girlvdv", "kirpich", "partizan", "pogran",
      "pogranflowers", "pogranmail", "pogranmama", "pogranminigun", "pogranrose",
      "pograntort", "prival", "radistka", "ranker", "rogatka", "soldier", "tank",
      "uzi", "vdv", "vpered", "vtik"
    ],
    WomenDay: [
      "boystroking", "cheerleader", "confetti", "enjoygift", "firework", "girlicecream",
      "girlmad", "girlobserve", "girlrevolve", "girlshighfive", "girlstroking", "girlsuper",
      "grats", "hairdryer", "leisure", "primp", "respect", "serenade", "spruceup"
    ],
    Halloween: [
      "alien", "batman", "bebebe", "bite", "carpet", "clown", "corsair", "cowboy",
      "cyborg", "dandy", "death", "dwarf", "gangster", "ghost", "girlpirate", "holmes",
      "indigenous", "jester", "mafia", "musketeer", "paladin", "pioneer", "pirate",
      "pirates", "robot", "rocker", "spider", "supergirl", "terminator", "turtle",
      "vampire", "witch", "wizard"
    ],
    Favourites: [] // Loaded from localStorage
  };

  const categoryEmojis = {
    Boys: "😃",
    Girls: "👧",
    Christmas: "🎄",
    Inlove: "❤️",
    Army: "🔫",
    WomenDay: "🌼",
    Halloween: "🎃",
    Favourites: "🌟"
  };

  let activeCategory = localStorage.getItem("activeCategory") || "Boys";
  let isPopupCreated = false;
  let currentEmoticonIndex = 0;
  const categoryHistory = [];
  let currentSortedEmoticons = [];
  let lastFocusedInput = null;

  const borderRadius = '0.2em';
  const boxShadow = `
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 2px 2px rgba(0, 0, 0, 0.08)
  `;

  // --------------------------
  // Style Helpers: Calculate Background Colors
  // --------------------------
  const bodyLightness = getLightness(window.getComputedStyle(document.body).backgroundColor);
  const popupBackground = getAdjustedBackground("popupBackground");
  const defaultButtonBackground = getAdjustedBackground("defaultButton");
  const hoverButtonBackground = getAdjustedBackground("hoverButton");
  const activeButtonBackground = getAdjustedBackground("activeButton");
  const selectedButtonBackground = getAdjustedBackground("selectedButton");

  // Returns lightness (0-100) from an RGB color string.
  function getLightness(color) {
    const match = color.match(/\d+/g);
    if (match && match.length === 3) {
      const [r, g, b] = match.map(Number);
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      return Math.round(((max + min) / 2) * 100);
    }
    return 0;
  }
  // Returns an HSL background color based on the type.
  function getAdjustedBackground(type) {
    const adjustments = {
      popupBackground: 10,
      defaultButton: 15,
      hoverButton: 25,
      activeButton: 35,
      selectedButton: 45,
    };
    const adjustment = adjustments[type] || 0;
    const adjustedLightness =
      bodyLightness < 50 ? bodyLightness + adjustment : bodyLightness - adjustment;
    return `hsl(0, 0%, ${adjustedLightness}%)`;
  }

  // --------------------------
  // Favorite Emoticons Handling
  // --------------------------
  function loadFavoriteEmoticons() {
    categories.Favourites = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
  }

  // --------------------------
  // Event Delegation on Text Inputs/Textareas
  // --------------------------
  document.addEventListener("focusin", (e) => {
    if (e.target.matches("textarea, input.text")) {
      lastFocusedInput = e.target;
    }
  });
  document.addEventListener("mouseup", (e) => {
    if (e.ctrlKey && e.button === 0 && e.target.matches("textarea, input.text")) {
      e.preventDefault();
      setTimeout(() => toggleEmoticonsPopup(), 10);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.code === "Semicolon") {
      e.preventDefault();
      toggleEmoticonsPopup();
    }
  });
  document.addEventListener("keydown", handleKeydownForEmoticons);
  // Handle keyboard close events
  document.addEventListener("keydown", (e) => {
    const popup = document.querySelector(".emoticons-popup");
    const closeKeys = new Set(['Escape', ' ']);

    if (popup && closeKeys.has(e.key)) {
      e.preventDefault();
      removeEmoticonsPopup();
    }
  });

  // Handle click-outside events
  document.addEventListener("click", (e) => {
    const popup = document.querySelector(".emoticons-popup");
    if (popup && !popup.contains(e.target)) {
      removeEmoticonsPopup();
    }
  });

  // --------------------------
  // Emoticon Code Determination & Insertion
  // --------------------------
  function getEmoticonCode(emoticon) {
    return window.location.pathname.includes("/forum")
      ? `[img]https://klavogonki.ru/img/smilies/${emoticon}.gif[/img] `
      : `:${emoticon}: `;
  }
  function insertEmoticonCode(emoticon) {
    if (!lastFocusedInput) {
      alert("No input field in focus.");
      return;
    }
    const code = getEmoticonCode(emoticon);
    const pos = lastFocusedInput.selectionStart || 0;
    const currentVal = lastFocusedInput.value || "";
    lastFocusedInput.value = currentVal.slice(0, pos) + code + currentVal.slice(pos);
    lastFocusedInput.setSelectionRange(pos + code.length, pos + code.length);
    lastFocusedInput.focus();
  }

  // --------------------------
  // Popup Creation & Removal
  // --------------------------
  function removeEmoticonsPopup() {
    const popup = document.querySelector(".emoticons-popup");
    if (popup) {
      popup.remove();
      isPopupCreated = false;
    }
  }
  function toggleEmoticonsPopup() {
    if (isPopupCreated) {
      removeEmoticonsPopup();
    } else {
      currentEmoticonIndex = 0;
      createEmoticonsPopup(activeCategory);
    }
  }
  function createEmoticonsPopup(category) {
    if (isPopupCreated) return;
    loadFavoriteEmoticons();
    const popup = document.createElement("div");
    popup.className = "emoticons-popup";
    popup.style.setProperty('border-radius', '0.4em', 'important');
    popup.style.setProperty('box-shadow', boxShadow, 'important');
    Object.assign(popup.style, {
      position: "fixed",
      display: "grid",
      gridTemplateRows: "50px auto",
      gap: "10px",
      backgroundColor: popupBackground,
      padding: "10px",
      zIndex: "9999",
      top: "50vh",
      left: "50vw",
      transform: "translate(-50%, -50%)",
      maxWidth: "50vw",
      minWidth: "630px",
      width: "50vw",
      maxHeight: "50vh",
      overflow: "auto"
    })
    const headerButtons = document.createElement("div");
    headerButtons.classList.add("header-buttons");
    Object.assign(headerButtons.style, {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      position: "sticky",
      top: "0"
    })
    popup.appendChild(headerButtons);

    // Create the clear button (Trash icon 🗑️)
    const clearButton = document.createElement("button");
    clearButton.classList.add('clear-button');
    clearButton.innerHTML = "🗑️"; // Trash emoji
    clearButton.style.setProperty('border-radius', borderRadius, 'important');
    Object.assign(clearButton.style, {
      border: "none",
      background: "hsl(40deg 50% 15%)",
      cursor: "pointer",
      boxSizing: "border-box",
      width: "50px",
      height: "50px",
      marginRight: "5px",
      fontSize: "1.4em"
    });

    clearButton.addEventListener("click", () => {
      if (confirm("Clear emoticon usage data?")) {
        localStorage.removeItem("emoticonUsageData");
      }
    });

    // Create the close button (Cross icon ❌)
    const closeButton = document.createElement("button");
    closeButton.classList.add('close-button');
    closeButton.innerHTML = "❌"; // Cross emoji
    closeButton.style.setProperty('border-radius', borderRadius, 'important');
    Object.assign(closeButton.style, {
      border: "none",
      background: "hsl(0deg 50% 15%)",
      cursor: "pointer",
      boxSizing: "border-box",
      width: "50px",
      height: "50px",
      marginLeft: "5px",
      fontSize: "1.1em"
    });

    closeButton.addEventListener("click", () => {
      removeEmoticonsPopup(); // Assuming this function exists elsewhere
    });

    headerButtons.appendChild(clearButton);
    headerButtons.appendChild(createCategoryContainer());
    headerButtons.appendChild(closeButton);
    createEmoticonsContainer(category).then((container) => {
      popup.appendChild(container);
      // Ensure highlight update happens after layout.
      requestAnimationFrame(updateEmoticonHighlight);
    })
    popup.addEventListener("dblclick", removeEmoticonsPopup);
    document.addEventListener("keydown", changeCategoryOnTabPress);
    document.body.appendChild(popup);
    isPopupCreated = true;
  }

  // --------------------------
  // Category Buttons & State
  // --------------------------
  function createCategoryContainer() {
    const container = document.createElement("div");
    container.className = "category-buttons";
    Object.assign(container.style, {
      display: "flex",
      justifyContent: "center",
    })
    for (let cat in categories) {
      if (categories.hasOwnProperty(cat)) {
        const btn = document.createElement("button");
        btn.classList.add("category-button");
        btn.innerHTML = categoryEmojis[cat];
        btn.dataset.category = cat;
        btn.style.background = (cat === activeCategory ? activeButtonBackground : defaultButtonBackground);
        btn.style.border = "none";
        btn.style.cursor = "pointer";
        btn.style.width = "50px";
        btn.style.height = "50px";
        btn.style.fontSize = "1.4em";
        btn.style.margin = "0 5px";
        btn.style.setProperty('border-radius', borderRadius, 'important');
        if (cat === "Favourites") {
          if (categories.Favourites.length) {
            btn.style.opacity = "";
          } else {
            btn.style.opacity = "0.5";
          }
          btn.addEventListener("click", ((btn) => {
            return (e) => {
              if (e.shiftKey) {
                localStorage.removeItem("favoriteEmoticons");
                categories.Favourites = [];
                if (categoryHistory.length) {
                  activeCategory = categoryHistory.pop();
                  localStorage.setItem("activeCategory", activeCategory);
                  updateCategoryButtonsState(activeCategory);
                  updateEmoticonsContainer();
                }
              }
            };
          })(btn));
        }
        btn.addEventListener("click", ((cat) => {
          return (e) => {
            if (!e.shiftKey && !e.ctrlKey) {
              changeActiveCategoryOnClick(cat);
            }
          };
        })(cat));
        btn.addEventListener("mouseover", () => {
          btn.style.background = hoverButtonBackground;
        });
        btn.addEventListener("mouseout", ((btn, cat) => {
          return () => {
            btn.style.background = (cat === activeCategory ? activeButtonBackground : defaultButtonBackground);
            if (cat === "Favourites") {
              if (categories.Favourites.length) {
                btn.style.opacity = "";
              } else {
                btn.style.opacity = "0.5";
              }
            }
          };
        })(btn, cat));
        container.appendChild(btn);
      }
    }
    return container;
  }
  function updateCategoryButtonsState(newCategory) {
    document.querySelectorAll(".category-buttons button").forEach((btn) => {
      if (btn.dataset.category === newCategory) {
        btn.style.background = activeButtonBackground;
      } else {
        btn.style.background = defaultButtonBackground;
      }
      if (btn.dataset.category === "Favourites") {
        if (categories.Favourites.length) {
          btn.style.opacity = "";
        } else {
          btn.style.opacity = "0.5";
        }
      }
    });
  }

  // --------------------------
  // Emoticon Usage Data
  // --------------------------
  function loadEmoticonUsageData() {
    return JSON.parse(localStorage.getItem("emoticonUsageData")) || {};
  }
  function saveEmoticonUsageData(data) {
    localStorage.setItem("emoticonUsageData", JSON.stringify(data));
  }
  function incrementEmoticonUsage(emoticon) {
    const data = loadEmoticonUsageData();
    data[activeCategory] = data[activeCategory] || {};
    data[activeCategory][emoticon] = (data[activeCategory][emoticon] || 0) + 1;
    saveEmoticonUsageData(data);
  }
  function getSortedEmoticons(category) {
    const usage = loadEmoticonUsageData()[category] || {};
    return categories[category].slice().sort((a, b) => (usage[b] || 0) - (usage[a] || 0));
  }

  // --------------------------
  // Emoticon Buttons Container
  // --------------------------
  async function createEmoticonsContainer(category) {
    const container = document.createElement("div");
    container.className = "emoticon-buttons";
    container.style.display = "none";
    container.style.gap = "10px";
    currentSortedEmoticons = getSortedEmoticons(category);
    const promises = [];
    currentSortedEmoticons.forEach((emoticon, idx) => {
      const btn = document.createElement("button");
      btn.classList.add('emoticon-button');
      const imgSrc = `/img/smilies/${emoticon}.gif`;
      btn.innerHTML = `<img src="${imgSrc}" alt="${emoticon}">`;
      btn.title = emoticon;
      btn.style.border = "none";
      btn.style.cursor = "pointer";
      btn.style.setProperty('border-radius', borderRadius, 'important');
      btn.style.background = (idx === currentEmoticonIndex ? selectedButtonBackground : defaultButtonBackground);
      promises.push(
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.src = imgSrc;
        })
      );
      btn.addEventListener("click", ((emoticon) => {
        return (e) => {
          if (e.ctrlKey) {
            insertEmoticonCode(emoticon);
          } else if (e.shiftKey && activeCategory === "Favourites") {
            const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
            const pos = fav.indexOf(emoticon);
            if (pos !== -1) {
              fav.splice(pos, 1);
              localStorage.setItem("favoriteEmoticons", JSON.stringify(fav));
              const favIndex = categories.Favourites.indexOf(emoticon);
              if (favIndex !== -1) {
                categories.Favourites.splice(favIndex, 1);
              }
              updateCategoryButtonsState(activeCategory);
              updateEmoticonsContainer();
            }
          } else if (e.shiftKey && activeCategory !== "Favourites") {
            const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
            if (!fav.includes(emoticon)) {
              fav.push(emoticon);
              localStorage.setItem("favoriteEmoticons", JSON.stringify(fav));
              categories.Favourites.push(emoticon);
              updateCategoryButtonsState(activeCategory);
              requestAnimationFrame(updateEmoticonHighlight);
            }
          } else {
            insertEmoticonCode(emoticon);
            incrementEmoticonUsage(emoticon);
            removeEmoticonsPopup();
          }
        };
      })(emoticon));
      btn.addEventListener("mouseover", () => {
        btn.style.background = hoverButtonBackground;
      });
      btn.addEventListener("mouseout", ((idx, title) => {
        return () => {
          if (idx === currentEmoticonIndex) {
            btn.style.background = selectedButtonBackground;
          } else {
            if (activeCategory === "Favourites") {
              btn.style.background = defaultButtonBackground;
            } else {
              if (isEmoticonFavorite(title)) {
                btn.style.background = activeButtonBackground;
              } else {
                btn.style.background = defaultButtonBackground;
              }
            }
          }
        };
      })(idx, btn.title));
      container.appendChild(btn);
    });
    await Promise.all(promises);
    const { maxImageWidth, maxImageHeight } = calculateMaxImageDimensions(categories[category]);
    container.style.gridTemplateColumns = `repeat(auto-fit, minmax(${maxImageWidth}px, 1fr))`;
    container.style.gridAutoRows = `minmax(${maxImageHeight}px, auto)`;
    container.style.display = "grid";
    requestAnimationFrame(updateEmoticonHighlight);
    return container;
  }
  // Update calculateMaxImageDimensions to use currentSortedEmoticons
  function calculateMaxImageDimensions() {
    let maxWidth = 34,
      maxHeight = 34;
    currentSortedEmoticons.forEach((emoticon) => {
      const img = new Image();
      img.src = `/img/smilies/${emoticon}.gif`;
      maxWidth = Math.max(maxWidth, img.width);
      maxHeight = Math.max(maxHeight, img.height);
    });
    return { maxImageWidth: maxWidth, maxImageHeight: maxHeight };
  }
  function updateEmoticonsContainer() {
    const old = document.querySelector(".emoticon-buttons");
    if (old) old.remove();
    createEmoticonsContainer(activeCategory).then((container) => {
      const popup = document.querySelector(".emoticons-popup");
      if (popup) popup.appendChild(container);
    });
  }
  function isEmoticonFavorite(emoticon) {
    const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
    return fav.includes(emoticon);
  }

  // --------------------------
  // Category Switching & Navigation
  // --------------------------
  function changeActiveCategoryOnClick(newCategory) {
    if (newCategory === "Favourites" && (JSON.parse(localStorage.getItem("favoriteEmoticons")) || []).length === 0) {
      return;
    }
    if (activeCategory !== "Favourites") {
      categoryHistory.push(activeCategory);
    }
    activeCategory = newCategory;
    localStorage.setItem("activeCategory", activeCategory);
    currentEmoticonIndex = 0; // Reset the current emoticon index
    currentSortedEmoticons = getSortedEmoticons(activeCategory); // Add this line
    updateCategoryButtonsState(activeCategory);
    updateEmoticonsContainer();
    requestAnimationFrame(updateEmoticonHighlight);
  }
  function changeCategoryOnTabPress(e) {
    if (e.key === "Tab" && document.querySelector(".emoticons-popup")) {
      e.preventDefault();
      const keys = Object.keys(categories);
      let idx = keys.indexOf(localStorage.getItem("activeCategory"));
      idx = (idx + 1) % keys.length;
      if (
        keys[idx] === "Favourites" &&
        (JSON.parse(localStorage.getItem("favoriteEmoticons")) || []).length === 0
      ) {
        idx = 0;
      }
      const next = keys[idx];
      currentEmoticonIndex = 0; // Reset the current emoticon index on Tab press
      currentSortedEmoticons = getSortedEmoticons(next); // Add this line
      localStorage.setItem("activeCategory", next);
      changeActiveCategoryOnClick(next);
      requestAnimationFrame(updateEmoticonHighlight);
    }
  }
  function updateEmoticonHighlight() {
    requestAnimationFrame(() => {
      const buttons = document.querySelectorAll(".emoticon-buttons button");
      buttons.forEach((btn, idx) => {
        if (idx === currentEmoticonIndex) {
          btn.style.background = selectedButtonBackground;
        } else {
          const emoticon = btn.title;
          if (activeCategory !== "Favourites" && isEmoticonFavorite(emoticon)) {
            btn.style.background = activeButtonBackground;
          } else {
            btn.style.background = defaultButtonBackground;
          }
        }
      });
    });
  }
  function handleKeydownForEmoticons(e) {
    // Get the emoticon popup element
    const popup = document.querySelector(".emoticons-popup");
    if (!popup) return; // Exit if the popup is not found

    // Ensure there are available emoticons to navigate
    if (!currentSortedEmoticons || currentSortedEmoticons.length === 0) return;

    // Handle "Enter" key: insert the selected emoticon
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default action (e.g., form submission)

      const emoticon = currentSortedEmoticons[currentEmoticonIndex];
      insertEmoticonCode(emoticon); // Insert the selected emoticon
      incrementEmoticonUsage(emoticon); // Track usage for sorting

      // If "Ctrl + Enter" is pressed, close the emoticon popup
      if (e.ctrlKey) removeEmoticonsPopup();
    }
    // Handle left navigation: Move selection left (previous emoticon)
    else if (e.code === "ArrowLeft" || e.code === "KeyH") {
      e.preventDefault(); // Prevent unwanted scrolling or default behavior

      // Move index to the previous emoticon, looping if necessary
      currentEmoticonIndex =
        (currentEmoticonIndex - 1 + currentSortedEmoticons.length) % currentSortedEmoticons.length;

      updateEmoticonHighlight(); // Update the UI highlight
    }
    // Handle right navigation: Move selection right (next emoticon)
    else if (e.code === "ArrowRight" || e.code === "KeyL") {
      e.preventDefault(); // Prevent unwanted scrolling or default behavior

      // Move index to the next emoticon, looping if necessary
      currentEmoticonIndex =
        (currentEmoticonIndex + 1) % currentSortedEmoticons.length;

      updateEmoticonHighlight(); // Update the UI highlight
    }
  }
})();