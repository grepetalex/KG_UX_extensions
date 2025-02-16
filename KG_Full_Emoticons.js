// ==UserScript==
// @name         KG_Full_Emoticons
// @namespace    http://klavogonki.ru/
// @version      1.3
// @description  Display a popup panel with every available emoticon on the site, remembering the last selected emoticon per category by name.
// @match        *://klavogonki.ru/g*
// @match        *://klavogonki.ru/forum/*
// @match        *://klavogonki.ru/u/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
  let eventListeners = [];
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
    Favourites: []
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
  const categoryHistory = [];
  let currentSortedEmoticons = [];
  let lastFocusedInput = null;

  const borderRadius = '0.2em';
  const boxShadow = `
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 2px 2px rgba(0, 0, 0, 0.08)
  `;

  const bodyLightness = getLightness(window.getComputedStyle(document.body).backgroundColor);
  const popupBackground = getAdjustedBackground("popupBackground");
  const defaultButtonBackground = getAdjustedBackground("defaultButton");
  const hoverButtonBackground = getAdjustedBackground("hoverButton");
  const activeButtonBackground = getAdjustedBackground("activeButton");
  const selectedButtonBackground = getAdjustedBackground("selectedButton");

  let lastUsedEmoticons = JSON.parse(localStorage.getItem("lastUsedEmoticons")) || {};
  Object.keys(categories).forEach(cat => {
    if (!lastUsedEmoticons.hasOwnProperty(cat) || !categories[cat].includes(lastUsedEmoticons[cat])) {
      lastUsedEmoticons[cat] = categories[cat][0] || '';
    }
  });

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

  function getAdjustedColor() {
    return bodyLightness < 50 ? "rgb(222, 222, 222)" : "rgb(22, 22, 22)";
  }

  function loadFavoriteEmoticons() {
    categories.Favourites = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
  }

  document.addEventListener("focusin", (e) => {
    if (e.target.matches("textarea, input.text")) {
      lastFocusedInput = e.target;
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (e.ctrlKey && e.button === 0 && e.target.matches("textarea, input.text")) {
      e.preventDefault();
      toggleEmoticonsPopup();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.code === "Semicolon") {
      e.preventDefault();
      toggleEmoticonsPopup();
    }
  });

  function closePopupOnKeydown(e) {
    const popup = document.querySelector(".emoticons-popup");
    const closeKeys = new Set(['Escape', ' ']);

    if (popup && closeKeys.has(e.key)) {
      e.preventDefault();
      removeEmoticonsPopup();
    }
  }

  function closePopupOnClickOutside(e) {
    const popup = document.querySelector(".emoticons-popup");
    if (popup && !popup.contains(e.target)) {
      removeEmoticonsPopup();
    }
  }

  function getPageContext() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const gmid = searchParams.get('gmid');
    const profileMatch = hash.match(/#\/(\d+)\//);

    return {
      isForum: path.includes('/forum/'),
      isGamelist: path.includes('/gamelist/'),
      isGame: !!gmid,
      isProfile: path === '/u/' && !!profileMatch,
      gmid: gmid || null,
      profileId: profileMatch?.[1] || null
    };
  }

  function getEmoticonCode(emoticon) {
    const { isForum } = getPageContext();
    return isForum
      ? `[img]https://klavogonki.ru/img/smilies/${emoticon}.gif[/img] `
      : `:${emoticon}: `;
  }

  function insertEmoticonCode(emoticon) {
    const context = getPageContext();
    let targetInput = lastFocusedInput;

    if (!targetInput) {
      if (context.isForum) targetInput = document.getElementById('fast-reply_textarea');
      else if (context.isGamelist) targetInput = document.querySelector('#chat-general.chat .messages input.text');
      else if (context.isGame) targetInput = document.querySelector('[id^="chat-game"].chat .messages input.text');

      if (!targetInput) {
        const labels = {
          isForum: "the forum",
          isProfile: "the profile",
          isGamelist: "general chat",
          isGame: "game chat"
        };
        const detected = Object.entries(labels)
          .filter(([key]) => context[key])
          .map(([_, value]) => value)
          .join(", ");
        alert(`Please focus on a text field in ${detected}.`);
        return;
      }
      targetInput.focus();
      lastFocusedInput = targetInput;
    }

    const code = getEmoticonCode(emoticon);
    const pos = targetInput.selectionStart || 0;
    targetInput.value =
      targetInput.value.slice(0, pos) + code + targetInput.value.slice(pos);
    targetInput.setSelectionRange(pos + code.length, pos + code.length);
    targetInput.focus();
  }

  function removeEventListeners() {
    eventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    eventListeners = [];
  }

  function removeEmoticonsPopup() {
    const popup = document.querySelector(".emoticons-popup");
    if (popup) {
      removeEventListeners();
      popup.remove();
      isPopupCreated = false;
    }
  }

  function toggleEmoticonsPopup() {
    if (isPopupCreated) {
      removeEmoticonsPopup();
    } else {
      setTimeout(() => {
        createEmoticonsPopup(activeCategory);
      }, 10);
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
      zIndex: "2000",
      top: "20vh",
      left: "50vw",
      transform: "translateX(-50%)",
      maxWidth: "50vw",
      minWidth: "630px",
      width: "50vw",
      maxHeight: "50vh",
      overflow: "hidden"
    });

    const headerButtons = document.createElement("div");
    headerButtons.classList.add("header-buttons");
    Object.assign(headerButtons.style, {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between"
    });
    popup.appendChild(headerButtons);

    const clearButton = document.createElement("button");
    clearButton.classList.add('clear-button');
    clearButton.title = "Clear usage data";
    clearButton.innerHTML = "🗑️";
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

    const closeButton = document.createElement("button");
    closeButton.classList.add('close-button');
    closeButton.title = "Close emoticons panel";
    closeButton.innerHTML = "❌";
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
    closeButton.addEventListener("click", removeEmoticonsPopup);

    headerButtons.appendChild(clearButton);
    headerButtons.appendChild(createCategoryContainer());
    headerButtons.appendChild(closeButton);
    createEmoticonsContainer(category).then((container) => {
      popup.appendChild(container);
      requestAnimationFrame(updateEmoticonHighlight);
    });
    popup.addEventListener("dblclick", removeEmoticonsPopup);

    const eventListenersArray = [
      { event: "keydown", handler: navigateEmoticons },
      { event: "keydown", handler: switchEmoticonCategory },
      { event: "keydown", handler: closePopupOnKeydown },
      { event: "click", handler: closePopupOnClickOutside }
    ];

    eventListenersArray.forEach(({ event, handler }) => {
      eventListeners.push({ event, handler });
      document.addEventListener(event, handler);
    });

    document.body.appendChild(popup);
    isPopupCreated = true;
  }

  function createCategoryContainer() {
    const container = document.createElement("div");
    container.className = "category-buttons";
    Object.assign(container.style, {
      display: "flex",
      justifyContent: "center",
    });
    for (let cat in categories) {
      if (categories.hasOwnProperty(cat)) {
        const btn = document.createElement("button");
        btn.classList.add("category-button");
        btn.innerHTML = categoryEmojis[cat];
        btn.dataset.category = cat;
        btn.title = cat;
        btn.style.background = (cat === activeCategory ? activeButtonBackground : defaultButtonBackground);
        btn.style.border = "none";
        btn.style.cursor = "pointer";
        btn.style.width = "50px";
        btn.style.height = "50px";
        btn.style.fontSize = "1.4em";
        btn.style.margin = "0 5px";
        btn.style.setProperty('border-radius', borderRadius, 'important');
        if (cat === "Favourites") {
          if (categories.Favourites.length === 0) {
            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";
          } else {
            btn.style.removeProperty("opacity");
            btn.style.removeProperty("pointer-events");
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
              btn.style.opacity = categories.Favourites.length ? "" : "0.5";
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
      btn.style.background = btn.dataset.category === newCategory ? activeButtonBackground : defaultButtonBackground;
      if (btn.dataset.category === "Favourites") {
        if (categories.Favourites.length === 0) {
          btn.style.opacity = "0.5";
          btn.style.pointerEvents = "none";
        } else {
          btn.style.removeProperty("opacity");
          btn.style.removeProperty("pointer-events");
        }
      }
    });
  }

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

  async function createEmoticonsContainer(category) {
    const container = document.createElement("div");
    container.className = "emoticon-buttons";

    currentSortedEmoticons = getSortedEmoticons(category);

    const promises = [];
    currentSortedEmoticons.forEach((emoticon) => {
      const btn = document.createElement("button");
      btn.classList.add('emoticon-button');
      const imgSrc = `/img/smilies/${emoticon}.gif`;
      btn.innerHTML = `<img src="${imgSrc}" alt="${emoticon}">`;
      btn.title = emoticon;

      btn.style.setProperty('border-radius', borderRadius, 'important');
      Object.assign(btn.style, {
        position: 'relative',
        border: "none",
        cursor: "pointer",
        filter: emoticon === lastUsedEmoticons[activeCategory] ? "sepia(0.7)" : "none",
        background: emoticon === lastUsedEmoticons[activeCategory]
          ? selectedButtonBackground
          : defaultButtonBackground
      });

      promises.push(new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.src = imgSrc;
      }));

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.ctrlKey) {
          insertEmoticonCode(emoticon);
        } else if (e.shiftKey) {
          const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
          const pos = fav.indexOf(emoticon);
          if (category === "Favourites" && pos !== -1) {
            fav.splice(pos, 1);
            categories.Favourites.splice(pos, 1);
          } else if (category !== "Favourites" && !fav.includes(emoticon)) {
            fav.push(emoticon);
            categories.Favourites.push(emoticon);
          }
          localStorage.setItem("favoriteEmoticons", JSON.stringify(fav));
          updateCategoryButtonsState(category);
          if (category === "Favourites") updateEmoticonsContainer();
        } else {
          insertEmoticonCode(emoticon);
          incrementEmoticonUsage(emoticon);
          lastUsedEmoticons[activeCategory] = emoticon;
          localStorage.setItem("lastUsedEmoticons", JSON.stringify(lastUsedEmoticons));
          removeEmoticonsPopup();
        }
        updateEmoticonHighlight();
      });

      container.appendChild(btn);
    });

    await Promise.all(promises);
    const { maxImageWidth, maxImageHeight } = await calculateMaxImageDimensions(currentSortedEmoticons);
    Object.assign(container.style, {
      display: "grid",
      gap: "10px",
      scrollbarWidth: "none",
      overflowY: "auto",
      overflowX: "hidden",
      maxHeight: "calc(-80px + 50vh)",
      gridTemplateColumns: `repeat(auto-fit, minmax(${maxImageWidth}px, 1fr))`,
      gridAutoRows: `minmax(${maxImageHeight}px, auto)`
    });
    return container;
  }

  async function calculateMaxImageDimensions(emoticonsImages) {
    const minValue = 34;
    const imageDimensions = await Promise.all(
      emoticonsImages.map((imageName) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.src = `/img/smilies/${imageName}.gif`;
        });
      })
    );
    const maxWidth = Math.max(minValue, ...imageDimensions.map(img => img.width));
    const maxHeight = Math.max(minValue, ...imageDimensions.map(img => img.height));
    return { maxImageWidth: maxWidth, maxImageHeight: maxHeight };
  }

  function updateEmoticonsContainer() {
    const old = document.querySelector(".emoticon-buttons");
    if (old) old.remove();
    createEmoticonsContainer(activeCategory).then((container) => {
      const popup = document.querySelector(".emoticons-popup");
      if (popup) {
        popup.appendChild(container);
        updateEmoticonHighlight();
      }
    });
  }

  function isEmoticonFavorite(emoticon) {
    const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
    return fav.includes(emoticon);
  }

  function changeActiveCategoryOnClick(newCategory) {
    if (newCategory === "Favourites" && categories.Favourites.length === 0) return;
    if (activeCategory !== "Favourites") {
      categoryHistory.push(activeCategory);
    }
    activeCategory = newCategory;
    localStorage.setItem("activeCategory", activeCategory);
    currentSortedEmoticons = getSortedEmoticons(activeCategory);
    updateCategoryButtonsState(activeCategory);
    updateEmoticonsContainer();
  }

  function switchEmoticonCategory(e) {
    const emoticonPopup = document.querySelector(".emoticons-popup");
    if (!emoticonPopup || (!["Tab", "KeyH", "KeyL"].includes(e.code) && !(e.code === "Tab" && e.shiftKey))) return;

    e.preventDefault();
    const keys = Object.keys(categories);
    const favs = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
    const navKeys = favs.length === 0 ? keys.filter(key => key !== "Favourites") : keys;
    let idx = navKeys.indexOf(activeCategory);
    if (idx === -1) idx = 0;

    let newIdx = ((e.code === "Tab" && !e.shiftKey) || e.code === "KeyL") && idx < navKeys.length - 1 ? idx + 1 :
      ((e.code === "KeyH" || (e.code === "Tab" && e.shiftKey)) && idx > 0) ? idx - 1 : idx;
    if (newIdx === idx) return;

    const next = navKeys[newIdx];
    currentSortedEmoticons = getSortedEmoticons(next);
    localStorage.setItem("activeCategory", next);
    changeActiveCategoryOnClick(next);
  }

  function updateEmoticonHighlight() {
    requestAnimationFrame(() => {
      const buttons = document.querySelectorAll(".emoticon-buttons button");
      buttons.forEach((btn) => {
        const emoticon = btn.title;
        const isSelected = emoticon === lastUsedEmoticons[activeCategory];
        if (isSelected) {
          btn.style.background = selectedButtonBackground;
          btn.style.filter = "sepia(0.7)";
        } else {
          btn.style.filter = "none";
          if (activeCategory !== "Favourites" && isEmoticonFavorite(emoticon)) {
            btn.style.background = activeButtonBackground;
          } else {
            btn.style.background = defaultButtonBackground;
          }
        }
      });
    });
  }

  function updateActiveEmoticon(direction) {
    const currentIndex = currentSortedEmoticons.indexOf(lastUsedEmoticons[activeCategory]);
    let newIndex = currentIndex === -1 ? 0 : currentIndex + direction;

    // Handle wrapping
    if (newIndex < 0) newIndex = currentSortedEmoticons.length - 1;
    if (newIndex >= currentSortedEmoticons.length) newIndex = 0;

    // Update state
    lastUsedEmoticons[activeCategory] = currentSortedEmoticons[newIndex];
    localStorage.setItem("lastUsedEmoticons", JSON.stringify(lastUsedEmoticons));

    // Update UI
    updateEmoticonHighlight();
  }

  function navigateEmoticons(e) {
    const popup = document.querySelector(".emoticons-popup");
    if (!popup || !currentSortedEmoticons || currentSortedEmoticons.length === 0) return;

    const handledKeys = new Set(['Enter', 'Semicolon', 'ArrowLeft', 'KeyJ', 'ArrowRight', 'KeyK']);
    if (!handledKeys.has(e.code)) return;

    e.preventDefault();

    if (e.code === "Enter" || e.code === "Semicolon") {
      const emoticon = lastUsedEmoticons[activeCategory];
      if (emoticon && currentSortedEmoticons.includes(emoticon)) {
        insertEmoticonCode(emoticon);
        incrementEmoticonUsage(emoticon);
        if (!e.ctrlKey) removeEmoticonsPopup();
      }
    }
    else if (e.code === "ArrowLeft" || e.code === "KeyJ") {
      updateActiveEmoticon(-1); // Move left
    }
    else if (e.code === "ArrowRight" || e.code === "KeyK") {
      updateActiveEmoticon(1); // Move right
    }
  }
})();