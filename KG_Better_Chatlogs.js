// ==UserScript==
// @name         KG_Better_Chatlogs
// @namespace    https://klavogonki.ru
// @version      0.1
// @description  Chatlogs link && Chatlogs Styles
// @author       Puncher
// @match        *://klavogonki.ru/*
// @grant        none
// ==/UserScript==

(function () {
  // Enforce https protocol
  function switchToHttps() {
    if (window.location.protocol === "http:") {
      setTimeout(() => {
        document.title = `Switching to https protocol`;
        setTimeout(() => {
          window.location.protocol = "https:";
        }, 1000);
      }, 1000);
    }
  }

  function setChatlogsStyles() {
    const chatLogsUrl = window.location.protocol + "//klavogonki.ru/chatlogs";

    if (window.location.href.startsWith(chatLogsUrl)) {
      // Set the font size for the entire page
      document.body.style.fontSize = '22px';

      // Get all font tags on the page
      let fontTags = document.getElementsByTagName("font");
      let colors = {};

      // Loop through each font tag
      for (var i = 0; i < fontTags.length; i++) {
        let text = fontTags[i].textContent;
        if (!colors[text]) {
          colors[text] = getRandomColor();
        }
        fontTags[i].setAttribute("style", "color: " + colors[text] + " !important");
      }

      function getRandomColor() {
        let h = Math.floor(Math.random() * 360); // random hue
        let s = Math.floor(Math.random() * 20) + 80; // saturation between 80% and 100%
        let l = 70; // static lightness value 
        return "hsl(" + h + "," + s + "%," + l + "%)";
      }
    }
  }

  function setChatlogsLink() {
    const rootUrl = window.location.protocol + "//klavogonki.ru/";

    if (window.location.href.startsWith(rootUrl) && !window.location.href.startsWith(rootUrl + "chatlogs/")) {
      let currentDate = new Date();
      let currentYear = currentDate.getFullYear();
      let currentMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
      let currentDay = ("0" + currentDate.getDate()).slice(-2);
      let linkHref = `https://klavogonki.ru/chatlogs/${currentYear}-${currentMonth}-${currentDay}.html`;
      let mainMenu = document.querySelector(".right .menu");

      if (mainMenu) {
        let chatlogsLink = document.createElement("a");
        chatlogsLink.href = linkHref;
        chatlogsLink.textContent = "Chatlogs";
        mainMenu.appendChild(chatlogsLink);
      }
    }
  }

  switchToHttps();
  setChatlogsStyles();
  setChatlogsLink();

})();