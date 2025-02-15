// ==UserScript==
// @name         KG_Full_Emoticons
// @namespace    http://klavogonki.ru/
// @version      1.1
// @description  Display a popup panel with every available emoticon on the site.
// @match        *://klavogonki.ru/g*
// @match        *://klavogonki.ru/forum/*
// @match        *://klavogonki.ru/u/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
  // Store the event listeners globally
  let eventListeners = [];
  // --------------------------
  // Data & Global Variables
  // --------------------------
  const categories = {
    Boys: [
      { name: "smile", url: "https://i.imgur.com/xzX4ROI.gif" },
      { name: "biggrin", url: "https://i.imgur.com/1izlFKX.gif" },
      { name: "angry", url: "https://i.imgur.com/7EZu5kN.gif" },
      { name: "blink", url: "https://i.imgur.com/jeVusPJ.gif" },
      { name: "blush", url: "https://i.imgur.com/r4aZiOW.gif" },
      { name: "cool", url: "https://i.imgur.com/ZT1WJ2G.gif" },
      { name: "dry", url: "https://i.imgur.com/0tTjGUe.gif" },
      { name: "excl", url: "https://i.imgur.com/ybeTMvE.gif" },
      { name: "happy", url: "https://i.imgur.com/vivMTfk.gif" },
      { name: "huh", url: "https://i.imgur.com/ekNIzS3.gif" },
      { name: "laugh", url: "https://i.imgur.com/z55dYmU.gif" },
      { name: "mellow", url: "https://i.imgur.com/pFxWDUo.gif" },
      { name: "ohmy", url: "https://i.imgur.com/DLzzmCI.gif" },
      { name: "ph34r", url: "https://i.imgur.com/Ws3W9uV.gif" },
      { name: "rolleyes", url: "https://i.imgur.com/OkpQ7rC.gif" },
      { name: "sad", url: "https://i.imgur.com/qxObHmk.gif" },
      { name: "sleep", url: "https://i.imgur.com/7LHHW7Z.gif" },
      { name: "tongue", url: "https://i.imgur.com/QsVoBrE.gif" },
      { name: "unsure", url: "https://i.imgur.com/v1XblKg.gif" },
      { name: "wacko", url: "https://i.imgur.com/6CduKCz.gif" },
      { name: "wink", url: "https://i.imgur.com/L60fUMB.gif" },
      { name: "wub", url: "https://i.imgur.com/jORcTG2.gif" },
      { name: "first", url: "https://i.imgur.com/na7IM9v.gif" },
      { name: "second", url: "https://i.imgur.com/gAjowLu.gif" },
      { name: "third", url: "https://i.imgur.com/jQwmDht.gif" },
      { name: "power", url: "https://i.imgur.com/sjV841n.gif" },
      { name: "badcomp", url: "https://i.imgur.com/mtYR6VH.gif" },
      { name: "complaugh", url: "https://i.imgur.com/fiyPmai.gif" },
      { name: "crazy", url: "https://i.imgur.com/TnjoCwa.gif" },
      { name: "boredom", url: "https://i.imgur.com/zNrahaO.gif" },
      { name: "cry", url: "https://i.imgur.com/tKnJBT7.gif" },
      { name: "bye", url: "https://i.imgur.com/5Co5wg6.gif" },
      { name: "dance", url: "https://i.imgur.com/JsQau5J.gif" },
      { name: "gamer", url: "https://i.imgur.com/xvCjZDj.gif" },
      { name: "rofl", url: "https://i.imgur.com/IaNQMVz.gif" },
      { name: "beer", url: "https://i.imgur.com/HL0cn2F.gif" },
      { name: "angry2", url: "https://i.imgur.com/az8LGqF.gif" },
      { name: "spiteful", url: "https://i.imgur.com/2qb0IZ8.gif" },
      { name: "sorry", url: "https://i.imgur.com/5mk3wHK.gif" },
      { name: "boykiss", url: "https://i.imgur.com/d3t5OEH.gif" },
      { name: "kissed", url: "https://i.imgur.com/xl9qT4b.gif" },
      { name: "yes", url: "https://i.imgur.com/X7WJOZD.gif" },
      { name: "no", url: "https://i.imgur.com/TSJBa3L.gif" },
      { name: "heart", url: "https://i.imgur.com/mkPcBgD.gif" },
      { name: "hi", url: "https://i.imgur.com/jPge57f.gif" },
      { name: "ok", url: "https://i.imgur.com/0XtQCf1.gif" },
      { name: "facepalm", url: "https://i.imgur.com/d2GeMNd.gif" },
      { name: "friends", url: "https://i.imgur.com/kM3Qt3A.gif" },
      { name: "shok", url: "https://i.imgur.com/gB9EX3g.gif" },
      { name: "megashok", url: "https://i.imgur.com/mhK4kL2.gif" },
      { name: "dash", url: "https://i.imgur.com/P5TV0vH.gif" },
      { name: "music", url: "https://i.imgur.com/7DbX8OC.gif" },
      { name: "acute", url: "https://i.imgur.com/1G1lwqS.gif" },
      { name: "victory", url: "https://i.imgur.com/5OLLeVP.gif" },
      { name: "scare", url: "https://i.imgur.com/DsZMP0O.gif" },
      { name: "clapping", url: "https://i.imgur.com/0af69uN.gif" },
      { name: "whistle", url: "https://i.imgur.com/SPHSXpP.gif" },
      { name: "popcorn", url: "https://i.imgur.com/Z3ENOfC.gif" },
      { name: "hello", url: "https://i.imgur.com/vJLoI8j.gif" },
      { name: "rose", url: "https://i.imgur.com/myQE7Zt.gif" },
      { name: "good", url: "https://i.imgur.com/HPUgC4I.gif" },
      { name: "silence", url: "https://i.imgur.com/UShpo97.gif" },
      { name: "bad", url: "https://i.imgur.com/25cU2j0.gif" },
      { name: "tea", url: "https://i.imgur.com/1DUZXRr.gif" },
      { name: "sick", url: "https://i.imgur.com/qdjiV5Z.gif" },
      { name: "confuse", url: "https://i.imgur.com/HBiNPPQ.gif" },
      { name: "rofl2", url: "https://i.imgur.com/eFr2i3h.gif" },
      { name: "nervous", url: "https://i.imgur.com/KVIJBeT.gif" },
      { name: "chaingun", url: "https://i.imgur.com/1vUdY8X.gif" },
      { name: "diablo", url: "https://i.imgur.com/oXaQqOA.gif" },
      { name: "cult", url: "https://i.imgur.com/WNWJUpQ.gif" },
      { name: "russian", url: "https://i.imgur.com/MIkn3cW.gif" },
      { name: "birthday", url: "https://i.imgur.com/OoX8Svq.gif" },
      { name: "champ2", url: "https://i.imgur.com/Zz5b5tA.gif" },
      { name: "champ", url: "https://i.imgur.com/fdjzIwI.gif" },
      { name: "confetti", url: "https://i.imgur.com/sV37HeR.gif" },
      { name: "formula1", url: "https://i.imgur.com/HALH1eA.gif" }
    ],
    Girls: [
      { name: "girlnotebook", url: "https://i.imgur.com/O5ynsPg.gif" },
      { name: "girlkiss", url: "https://i.imgur.com/4eP0nNe.gif" },
      { name: "curtsey", url: "https://i.imgur.com/bcl5fH8.gif" },
      { name: "girlblum", url: "https://i.imgur.com/XYfb9i1.gif" },
      { name: "girlcrazy", url: "https://i.imgur.com/r7VvZL0.gif" },
      { name: "girlcry", url: "https://i.imgur.com/tyR1jUQ.gif" },
      { name: "girlwink", url: "https://i.imgur.com/fHToNdU.gif" },
      { name: "girlwacko", url: "https://i.imgur.com/Z5XPvpi.gif" },
      { name: "umbrage", url: "https://i.imgur.com/FPENERv.gif" },
      { name: "girlinlove", url: "https://i.imgur.com/uDNwf6q.gif" },
      { name: "girldevil", url: "https://i.imgur.com/R9zJvwf.gif" },
      { name: "girlimpossible", url: "https://i.imgur.com/JjSjFtN.gif" },
      { name: "girlwitch", url: "https://i.imgur.com/bHMam3r.gif" },
      { name: "hysteric", url: "https://i.imgur.com/r8f3z6a.gif" },
      { name: "tender", url: "https://i.imgur.com/igKWq6Q.gif" },
      { name: "spruceup", url: "https://i.imgur.com/NoONjdI.gif" },
      { name: "girlsad", url: "https://i.imgur.com/5MuGstW.gif" },
      { name: "girlscare", url: "https://i.imgur.com/XlZHr5f.gif" },
      { name: "girltea", url: "https://i.imgur.com/NFshNoo.gif" },
      { name: "girlsick", url: "https://i.imgur.com/JMtQE3n.gif" },
      { name: "grose", url: "https://i.imgur.com/vWzMbI0.gif" },
      { name: "cheerful", url: "https://i.imgur.com/5oOpo9D.gif" },
      { name: "cheerleader", url: "https://i.imgur.com/NjC1VvH.gif" },
      { name: "girlconfuse", url: "https://i.imgur.com/DWVYZg9.gif" },
      { name: "spruceup1", url: "https://i.imgur.com/wjoaTbH.gif" },
      { name: "angrygirl", url: "https://i.imgur.com/2weI6WJ.gif" },
      { name: "clapgirl", url: "https://i.imgur.com/exvbGhj.gif" },
      { name: "goody", url: "https://i.imgur.com/g9hBLOY.gif" },
      { name: "hiya", url: "https://i.imgur.com/yjakGun.gif" },
      { name: "girlsilence", url: "https://i.imgur.com/8X3zfHF.gif" },
      { name: "girlstop", url: "https://i.imgur.com/cHatIQz.gif" },
      { name: "girlnervous", url: "https://i.imgur.com/6dJ9jjA.gif" },
      { name: "girlwonder", url: "https://i.imgur.com/iWR7yTc.gif" },
      { name: "girlkissboy", url: "https://i.imgur.com/1eePWVo.gif" },
      { name: "girlmusic", url: "https://i.imgur.com/Yw3HP4G.gif" }
    ],
    Christmas: [
      { name: "cheers", url: "https://i.imgur.com/1xZfeux.gif" },
      { name: "christmasevil", url: "https://i.imgur.com/wM7hm9f.gif" },
      { name: "heyfrombag", url: "https://i.imgur.com/zxSzE6k.gif" },
      { name: "merrychristmas", url: "https://i.imgur.com/4LtNyP4.gif" },
      { name: "moose", url: "https://i.imgur.com/5tIelVB.gif" },
      { name: "snegurka", url: "https://i.imgur.com/LTW0I7U.gif" },
      { name: "snowgirlwave", url: "https://i.imgur.com/VAIYeeC.gif" },
      { name: "snowman", url: "https://i.imgur.com/HjWSGuB.gif" },
      { name: "spruce", url: "https://i.imgur.com/lo0oUoY.gif" }
    ],
    Inlove: [
      { name: "adultery", url: "https://i.imgur.com/Kb45ETK.gif" },
      { name: "airkiss", url: "https://i.imgur.com/vv081cT.gif" },
      { name: "flowers", url: "https://i.imgur.com/oc1oyQR.gif" },
      { name: "flowers2", url: "https://i.imgur.com/CehwtS6.gif" },
      { name: "girlheart2", url: "https://i.imgur.com/V7idplC.gif" },
      { name: "girllove", url: "https://i.imgur.com/9IX9DyP.gif" },
      { name: "grose", url: "https://i.imgur.com/vWzMbI0.gif" },
      { name: "heart2", url: "https://i.imgur.com/Z4AxNzW.gif" },
      { name: "hug", url: "https://i.imgur.com/vaOkURD.gif" },
      { name: "inlove", url: "https://i.imgur.com/0Sebbkf.gif" },
      { name: "nolove", url: "https://i.imgur.com/uwgunbM.gif" },
      { name: "smell", url: "https://i.imgur.com/DcyzqBg.gif" },
      { name: "wedance", url: "https://i.imgur.com/oFXtHfI.gif" },
      { name: "wedding", url: "https://i.imgur.com/qBFQSIf.gif" },
      { name: "wine", url: "https://i.imgur.com/J3km0Nb.gif" }
    ],
    Army: [
      { name: "ak47", url: "https://i.imgur.com/jahkb54.gif" },
      { name: "armyscare", url: "https://i.imgur.com/gen1udM.gif" },
      { name: "barret", url: "https://i.imgur.com/bQpHMDe.gif" },
      { name: "captain", url: "https://i.imgur.com/e2qQkpA.gif" },
      { name: "comandos", url: "https://i.imgur.com/1x70VOh.gif" },
      { name: "girlpogran", url: "https://i.imgur.com/uH5TSxV.gif" },
      { name: "girlranker", url: "https://i.imgur.com/BTIHyhM.gif" },
      { name: "girlrogatka", url: "https://i.imgur.com/ryIYzZk.gif" },
      { name: "girlvdv", url: "https://i.imgur.com/wBDUZZ0.gif" },
      { name: "pogranmail", url: "https://i.imgur.com/f0gThdD.gif" },
      { name: "pogranminigun", url: "https://i.imgur.com/TFyZHtP.gif" },
      { name: "pogranrose", url: "https://i.imgur.com/SPUSRyq.gif" },
      { name: "pograntort", url: "https://i.imgur.com/UFHXc6u.gif" },
      { name: "prival", url: "https://i.imgur.com/qTmiROR.gif" },
      { name: "radistka", url: "https://i.imgur.com/2BH0BX9.gif" },
      { name: "ranker", url: "https://i.imgur.com/I0rfdKZ.gif" },
      { name: "rogatka", url: "https://i.imgur.com/ryIYzZk.gif" },
      { name: "soldier", url: "https://i.imgur.com/fSmJef1.gif" },
      { name: "tank", url: "https://i.imgur.com/0UMVnDq.gif" },
      { name: "uzi", url: "https://i.imgur.com/ZWh5aEi.gif" },
      { name: "vdv", url: "https://i.imgur.com/lx2ZtCN.gif" },
      { name: "vpered", url: "https://i.imgur.com/xHoukNc.gif" },
      { name: "vtik", url: "https://i.imgur.com/9vUiPNj.gif" }
    ],
    WomenDay: [
      { name: "boystroking", url: "https://i.imgur.com/HD3LI6i.gif" },
      { name: "cheerleader", url: "https://i.imgur.com/NjC1VvH.gif" },
      { name: "confetti", url: "https://i.imgur.com/sV37HeR.gif" },
      { name: "enjoygift", url: "https://i.imgur.com/C5jMoIX.gif" },
      { name: "firework", url: "https://i.imgur.com/cZvbVmD.gif" },
      { name: "girlicecream", url: "https://i.imgur.com/GCDf6sw.gif" },
      { name: "girlmad", url: "https://i.imgur.com/5dJvOIi.gif" },
      { name: "girlobserve", url: "https://i.imgur.com/q6ty1KP.gif" },
      { name: "girlrevolve", url: "https://i.imgur.com/gEivr1Y.gif" },
      { name: "girlshighfive", url: "https://i.imgur.com/rbRq7Y9.gif" },
      { name: "girlstroking", url: "https://i.imgur.com/eUU9yTU.gif" },
      { name: "girlsuper", url: "https://i.imgur.com/8yCM1tV.gif" },
      { name: "grats", url: "https://i.imgur.com/qeb1vWk.gif" },
      { name: "hairdryer", url: "https://i.imgur.com/XFWTRLW.gif" },
      { name: "leisure", url: "https://i.imgur.com/V5FcqKY.gif" },
      { name: "primp", url: "https://i.imgur.com/w9NE0cf.gif" },
      { name: "respect", url: "https://i.imgur.com/tKaN8e6.gif" },
      { name: "serenade", url: "https://i.imgur.com/oENk4xa.gif" },
      { name: "spruceup", url: "https://i.imgur.com/NoONjdI.gif" }
    ],
    Halloween: [
      { name: "alien", url: "https://i.imgur.com/GDLbmiZ.gif" },
      { name: "batman", url: "https://i.imgur.com/wHHAD7c.gif" },
      { name: "bebebe", url: "https://i.imgur.com/Epu6Fz6.gif" },
      { name: "bite", url: "https://i.imgur.com/BvBjcPa.gif" },
      { name: "carpet", url: "https://i.imgur.com/APWNfGG.gif" },
      { name: "clown", url: "https://i.imgur.com/00CYz93.gif" },
      { name: "corsair", url: "https://i.imgur.com/z2IMwlg.gif" },
      { name: "cowboy", url: "https://i.imgur.com/Qcx1z4C.gif" },
      { name: "cyborg", url: "https://i.imgur.com/lTwI5up.gif" },
      { name: "dandy", url: "https://i.imgur.com/b9QY78j.gif" },
      { name: "death", url: "https://i.imgur.com/UkYZZWY.gif" },
      { name: "dwarf", url: "https://i.imgur.com/cZtvhnw.gif" },
      { name: "gangster", url: "https://i.imgur.com/smotlWQ.gif" },
      { name: "ghost", url: "https://i.imgur.com/59IVj4Q.gif" },
      { name: "girlpirate", url: "https://i.imgur.com/tThI1JG.gif" },
      { name: "holmes", url: "https://i.imgur.com/MaO1Xrh.gif" },
      { name: "indigenous", url: "https://i.imgur.com/qU2AiTP.gif" },
      { name: "jester", url: "https://i.imgur.com/Gyq2Sma.gif" },
      { name: "mafia", url: "https://i.imgur.com/zIAxMU4.gif" },
      { name: "musketeer", url: "https://i.imgur.com/tO416xm.gif" },
      { name: "paladin", url: "https://i.imgur.com/wK1lPLY.gif" },
      { name: "pioneer", url: "https://i.imgur.com/nAi4HPf.gif" },
      { name: "pirate", url: "https://i.imgur.com/HrOMwzv.gif" },
      { name: "pirates", url: "https://i.imgur.com/PBJI6m4.gif" },
      { name: "robot", url: "https://i.imgur.com/AVsrLYH.gif" },
      { name: "rocker", url: "https://i.imgur.com/YUaAGSf.gif" },
      { name: "spider", url: "https://i.imgur.com/0h64DMz.gif" },
      { name: "supergirl", url: "https://i.imgur.com/kZ7KePp.gif" },
      { name: "terminator", url: "https://i.imgur.com/vQAaXt2.gif" },
      { name: "turtle", url: "https://i.imgur.com/N7lbJa7.gif" },
      { name: "vampire", url: "https://i.imgur.com/fw92koM.gif" },
      { name: "witch", url: "https://i.imgur.com/p8cLrVc.gif" },
      { name: "wizard", url: "https://i.imgur.com/zqlxhrN.gif" }
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

  // Function to convert image to base64
  async function convertImageToBase64(url) {
    try {
      const response = await fetch(url);
      const imageBlob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // Return the base64 string
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob); // Read the image blob as data URL
      });
    } catch (error) {
      console.error(`Error converting image ${url}:`, error);
      return null; // Return null in case of error
    }
  }

  // Function to store emoticons in localStorage
  async function storeEmoticons() {
    const storedEmoticons = {};

    // Loop through all categories and their emoticons
    for (const category in categories) {
      // Skip this category if it's empty (or not an array)
      if (!Array.isArray(categories[category]) || categories[category].length === 0) {
        console.log(`Skipping empty category: ${category}`);
        continue;
      }

      storedEmoticons[category] = {}; // Initialize empty category object

      for (const emoticon of categories[category]) {
        // Use the URL from the categories object
        const imageUrl = emoticon.url;
        const base64Image = await convertImageToBase64(imageUrl); // Convert image to base64

        if (base64Image) {
          storedEmoticons[category][emoticon.name] = base64Image; // Store base64 image in the object
        } else {
          console.error(`Failed to convert image for emoticon: ${emoticon.name}`);
        }
      }
    }

    // Store the result in localStorage
    localStorage.setItem('storedEmoticonsBase64', JSON.stringify(storedEmoticons));
  }

  // Check if emoticons are already stored in localStorage
  async function initializeEmoticonsStorage() {
    // Check if the key 'storedEmoticonsBase64' exists in localStorage
    if (!localStorage.getItem('storedEmoticonsBase64')) {
      try {
        // Store emoticons only if they are not already in localStorage
        await storeEmoticons(); // Trigger the emoticon storing process
      } catch (error) {
        console.error('Error storing emoticons in localStorage:', error);
      }
    } else {
      console.log('Emoticons already stored in localStorage. No action taken.');
    }
  }

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

  function removeEventListeners() {
    // Loop through all stored event listeners and remove them
    eventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });

    // Clear the event listeners array after removal
    eventListeners = [];
  }

  function removeEmoticonsPopup() {
    const popup = document.querySelector(".emoticons-popup");
    if (popup) {
      // Remove all event listeners
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
        currentEmoticonIndex = 0;
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
    })
    const headerButtons = document.createElement("div");
    headerButtons.classList.add("header-buttons");
    Object.assign(headerButtons.style, {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between"
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

    // Define the event listeners as an array of objects
    const eventListenersArray = [
      { event: "keydown", handler: handleKeydownForEmoticons },
      { event: "keydown", handler: switchEmoticonCategory },
      { event: "keydown", handler: closePopupOnKeydown },
      { event: "click", handler: closePopupOnClickOutside }
    ];

    // Store the event listeners and add them to the document
    eventListenersArray.forEach(({ event, handler }) => {
      eventListeners.push({ event, handler }); // Store the event and handler in the array
      document.addEventListener(event, handler); // Add the event listener
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
          // Handle "Favourites" button state
          if (categories.Favourites.length === 0) {
            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";
          } else {
            // Remove the properties from the inline style
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
      // Update background based on the active category
      if (btn.dataset.category === newCategory) {
        btn.style.background = activeButtonBackground;
      } else {
        btn.style.background = defaultButtonBackground;
      }

      // Handle "Favourites" button state
      if (btn.dataset.category === "Favourites") {
        if (categories.Favourites.length === 0) {
          btn.style.opacity = "0.5";
          btn.style.pointerEvents = "none";
        } else {
          // Remove the properties from the inline style
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
    // For Favorites, the array is strings; others are objects
    return categories[category].slice().sort((a, b) => {
      const aName = (category === "Favourites" ? a : a.name);
      const bName = (category === "Favourites" ? b : b.name);
      return (usage[bName] || 0) - (usage[aName] || 0);
    });
  }

  // Create a map for base64 images and collect promises for image loading
  async function createEmoticonsContainer(category) {
    const container = document.createElement("div");
    container.classList.add("emoticon-buttons");

    // Retrieve stored emoticons from localStorage (if available)
    let storedEmoticonsBase64 = JSON.parse(localStorage.getItem('storedEmoticonsBase64')) || {};

    // If no emoticons are stored yet, initialize them
    if (!storedEmoticonsBase64[category]) {
      // Wait until emoticons are initialized
      await initializeEmoticonsStorage();
      storedEmoticonsBase64 = JSON.parse(localStorage.getItem('storedEmoticonsBase64')); // Refresh the data
    }

    const currentSortedEmoticons = getSortedEmoticons(category);
    const emoticonBase64Images = {};
    const promises = [];

    currentSortedEmoticons.forEach((emoticonData, idx) => {
      const btn = document.createElement("button");
      btn.classList.add('emoticon-button');

      // Determine emoticon name based on category
      let emoticonName;
      if (category === "Favourites") {
        emoticonName = emoticonData; // Favorites stores names as strings
      } else {
        emoticonName = emoticonData.name; // Other categories use objects with 'name'
      }

      // Retrieve base64 image data
      let base64Image;
      if (category === "Favourites") {
        // Search all categories except Favorites for the emoticon's base64
        for (const catKey in storedEmoticonsBase64) {
          if (catKey === "Favourites") continue;
          if (storedEmoticonsBase64[catKey][emoticonName]) {
            base64Image = storedEmoticonsBase64[catKey][emoticonName];
            break;
          }
        }
      } else {
        // Directly access the category's stored data
        base64Image = storedEmoticonsBase64[category]?.[emoticonName];
      }

      if (base64Image) {
        btn.innerHTML = `<img src="${base64Image}" alt="${emoticonName}">`;
      } else {
        console.warn(`Base64 image for "${emoticonName}" not found.`);
        return; // Skip creating the button if image is missing
      }

      btn.title = emoticonData.name;
      btn.style.position = 'relative';
      btn.style.border = "none";
      btn.style.cursor = "pointer";
      btn.style.setProperty('border-radius', borderRadius, 'important');
      btn.style.background = (idx === currentEmoticonIndex ? selectedButtonBackground : defaultButtonBackground);

      // Create promise for image loading to calculate max dimensions
      promises.push(
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.src = base64Image;
        })
      );

      // Add usage count element
      const usageData = loadEmoticonUsageData();
      const categoryUsage = usageData[activeCategory] || {};
      const count = categoryUsage[emoticonData.name] || 0;

      const countElement = document.createElement('div');
      countElement.classList.add("emoticon-usage-counter");
      countElement.textContent = count;
      Object.assign(countElement.style, {
        position: 'absolute',
        bottom: '0',
        right: '0',
        fontSize: '0.7em',
        fontWeight: 'bold',
        fontFamily: 'Tahoma',
        color: getAdjustedColor(),
        padding: '0.4em 0.8em',
        pointerEvents: 'none'
      });

      btn.appendChild(countElement);

      // Event listeners for button interaction
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.ctrlKey) {
          insertEmoticonCode(emoticonData.name);
        } else if (e.shiftKey && activeCategory === "Favourites") {
          // Remove from favorites logic
          const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
          const pos = fav.indexOf(emoticonData.name);
          if (pos !== -1) {
            fav.splice(pos, 1);
            localStorage.setItem("favoriteEmoticons", JSON.stringify(fav));
            const favIndex = categories.Favourites.indexOf(emoticonData.name);
            if (favIndex !== -1) {
              categories.Favourites.splice(favIndex, 1);
            }
            updateCategoryButtonsState(activeCategory);
            updateEmoticonsContainer();
          }
        } else if (e.shiftKey && activeCategory !== "Favourites") {
          // Add to favorites logic
          const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
          if (!fav.includes(emoticonName)) { // Use emoticonName here
            fav.push(emoticonName);
            localStorage.setItem("favoriteEmoticons", JSON.stringify(fav));
            categories.Favourites.push(emoticonName);
            // Update UI
            updateCategoryButtonsState(activeCategory);
            requestAnimationFrame(updateEmoticonHighlight);
          }
        } else {
          insertEmoticonCode(emoticonData.name);
          incrementEmoticonUsage(emoticonData.name);
          removeEmoticonsPopup();
        }
      });

      btn.addEventListener("mouseover", () => {
        btn.style.background = hoverButtonBackground;
      });

      btn.addEventListener("mouseout", () => {
        if (idx === currentEmoticonIndex) {
          btn.style.background = selectedButtonBackground;
        } else {
          if (activeCategory === "Favourites") {
            btn.style.background = defaultButtonBackground;
          } else {
            if (isEmoticonFavorite(emoticonData.name)) {
              btn.style.background = activeButtonBackground;
            } else {
              btn.style.background = defaultButtonBackground;
            }
          }
        }
      });

      container.appendChild(btn);
    });

    // Calculate the maximum image dimensions from base64 images
    const { maxImageWidth, maxImageHeight } = await calculateMaxImageDimensions(emoticonBase64Images);

    // Apply final styles after image sizes are calculated
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

    requestAnimationFrame(updateEmoticonHighlight);
    return container;
  }

  // Function to calculate max image dimensions from base64 image data
  async function calculateMaxImageDimensions(emoticonsBase64Images) {
    const minValue = 34;
    const images = Object.values(emoticonsBase64Images);

    const imageDimensions = await Promise.all(images.map((base64Image) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = base64Image;
      });
    }));

    const maxWidth = Math.max(minValue, ...imageDimensions.map(img => img.width));
    const maxHeight = Math.max(minValue, ...imageDimensions.map(img => img.height));
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

  function switchEmoticonCategory(e) {
    const emoticonPopup = document.querySelector(".emoticons-popup");

    // If there's no emoticon popup or the key pressed isn't one of the valid keys, return early
    if (!emoticonPopup || (!["Tab", "KeyH", "KeyL"].includes(e.code) && !(e.code === "Tab" && e.shiftKey))) return;

    e.preventDefault();

    // Get the list of categories and favorites
    const keys = Object.keys(categories);
    const favs = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];

    // Determine which categories should be navigated, excluding "Favourites" if there are no favorites
    const navKeys = favs.length === 0 ? keys.filter(key => key !== "Favourites") : keys;

    // Get the index of the current active category from local storage, default to 0 if not found
    let idx = navKeys.indexOf(localStorage.getItem("activeCategory"));
    if (idx === -1) idx = 0;

    // Conditions for forward and backward navigation
    let newIdx =
      // Move forward if "Tab" is pressed without shift or "KeyL" is pressed, and we're not at the last category
      ((e.code === "Tab" && !e.shiftKey) || e.code === "KeyL") && idx < navKeys.length - 1 ? idx + 1 :
        // Move backward if "KeyH" is pressed or "Tab" with shift is pressed, and we're not at the first category
        ((e.code === "KeyH" || (e.code === "Tab" && e.shiftKey)) && idx > 0) ? idx - 1 :
          // Stay in the same category if no forward or backward movement is triggered
          idx;

    // If the new index is the same as the current one, do nothing
    if (newIdx === idx) return;

    // Get the next category to navigate to
    const next = navKeys[newIdx];

    currentEmoticonIndex = 0;
    currentSortedEmoticons = getSortedEmoticons(next);
    localStorage.setItem("activeCategory", next);
    changeActiveCategoryOnClick(next);
    requestAnimationFrame(updateEmoticonHighlight);
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

      // Close the emoticon popup ONLY if Ctrl is NOT pressed
      if (!e.ctrlKey) removeEmoticonsPopup();
    }
    // Handle left navigation: Move selection left (previous emoticon)
    else if (e.code === "ArrowLeft" || e.code === "KeyJ") {
      e.preventDefault(); // Prevent unwanted scrolling or default behavior

      // Move index to the previous emoticon, looping if necessary
      currentEmoticonIndex =
        (currentEmoticonIndex - 1 + currentSortedEmoticons.length) % currentSortedEmoticons.length;

      updateEmoticonHighlight(); // Update the UI highlight
    }
    // Handle right navigation: Move selection right (next emoticon)
    else if (e.code === "ArrowRight" || e.code === "KeyK") {
      e.preventDefault(); // Prevent unwanted scrolling or default behavior

      // Move index to the next emoticon, looping if necessary
      currentEmoticonIndex =
        (currentEmoticonIndex + 1) % currentSortedEmoticons.length;

      updateEmoticonHighlight(); // Update the UI highlight
    }
  }
})();