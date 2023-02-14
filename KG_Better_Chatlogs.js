// ==UserScript==
// @name         KG_Better_Chatlogs
// @namespace    https://klavogonki.ru
// @version      0.1
// @description  Restyle chatlongs for better looking and make it accessible from main menu 
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
    function colorizeNicknames() {
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

    function beautifyNavigation() {
      const chatlogsLogdate = document.querySelector('.logdate .w3c');

      chatlogsLogdate.style.position = 'fixed';
      chatlogsLogdate.style.height = '80px';
      chatlogsLogdate.style.width = '40px';
      chatlogsLogdate.style.right = '30px';
      chatlogsLogdate.style.top = '50vh';
      chatlogsLogdate.style.transform = 'translateY(-50%)';
      chatlogsLogdate.style.display = 'flex';
      chatlogsLogdate.style.flexDirection = 'column';

      const navigationButtons = chatlogsLogdate.querySelectorAll('.w3c a.nav');
      navigationButtons[1].parentNode.removeChild(navigationButtons[1]);

      navigationButtons.forEach(button => {
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.height = '40px';
        button.style.width = '40px';
        button.style.backgroundColor = '#808080';
        button.style.transition = 'background-color 0.3s ease';
        button.style.setProperty('color', '#1b1b1b', 'important');

        // Set hover styles
        button.addEventListener('mouseenter', () => {
          button.style.backgroundColor = '#a9a9a9';
        });
        button.addEventListener('mouseleave', () => {
          button.style.backgroundColor = '#808080';
        });
      });

      // References for the navigation buttons previous and forward
      const previousChatlogsPage = chatlogsLogdate.querySelector('.w3c a.nav:first-child');
      const forwardChatlogsPage = chatlogsLogdate.querySelector('.w3c a.nav:last-child');

      previousChatlogsPage.style.setProperty('border-radius', '4px 4px 0 0', 'important');
      forwardChatlogsPage.style.setProperty('border-radius', '0 0 4px 4px', 'important');

      // Replace default font arrows with better svg arrows
      const arrowUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
      </svg>`;

      const arrowDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-down">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
      </svg>`;

      previousChatlogsPage.innerHTML = arrowUpSvg;
      forwardChatlogsPage.innerHTML = arrowDownSvg;
    }

    colorizeNicknames();
    beautifyNavigation();

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