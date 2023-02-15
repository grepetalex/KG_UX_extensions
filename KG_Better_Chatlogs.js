// ==UserScript==
// @name         KG_Better_Chatlogs
// @namespace    https://klavogonki.ru
// @version      0.1
// @description  Restyle chatlogs for better looking and make it accessible from main menu 
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

  // Function to add styling to the chatlogs page
  function setChatlogsStyles() {
    const chatLogsUrl = window.location.protocol + "//klavogonki.ru/chatlogs";

    // Check if user is on the chatlogs page
    if (window.location.href.startsWith(chatLogsUrl)) {
      // Colorize nicknames on chatlogs page
      function colorizeNicknames() {
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

        // Get random color for the nickname
        function getRandomColor() {
          let h = Math.floor(Math.random() * 360); // random hue
          let s = Math.floor(Math.random() * 20) + 80; // saturation between 80% and 100%
          let l = 70; // static lightness value
          return "hsl(" + h + "," + s + "%," + l + "%)";
        }
      }

      // Beautify navigation on the chatlogs page
      function beautifyNavigationButtons() {
        // Reference for the navigation buttons wrapper
        const chatlogsNavigationWrapper = document.querySelector('.logdate .w3c');

        // Exit the function if chatlogsNavigationWrapper doesn't exist
        if (!chatlogsNavigationWrapper) {
          return;
        }

        chatlogsNavigationWrapper.style.position = 'fixed';
        chatlogsNavigationWrapper.style.height = '80px';
        chatlogsNavigationWrapper.style.width = '40px';
        chatlogsNavigationWrapper.style.right = '30px';
        chatlogsNavigationWrapper.style.top = '50vh';
        chatlogsNavigationWrapper.style.transform = 'translateY(-50%)';
        chatlogsNavigationWrapper.style.display = 'flex';
        chatlogsNavigationWrapper.style.flexDirection = 'column';

        // Remove the second button on the chatlogs page
        const navigationButtons = chatlogsNavigationWrapper.querySelectorAll('.w3c a.nav');
        navigationButtons[1].parentNode.removeChild(navigationButtons[1]);

        // Style each navigation button
        navigationButtons.forEach(button => {
          button.style.display = 'flex';
          button.style.justifyContent = 'center';
          button.style.alignItems = 'center';
          button.style.height = '40px';
          button.style.width = '40px';
          button.style.backgroundColor = '#808080';
          button.style.transition = 'background-color 0.3s ease';
          button.style.setProperty('color', '#1b1b1b', 'important');

          // Change navigation button background color on hover
          button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#a9a9a9';
          });
          button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#808080';
          });
        });

        // References for the navigation buttons previous and forward
        const previousChatlogsPage = chatlogsNavigationWrapper.querySelector('.w3c a.nav:first-child');
        const forwardChatlogsPage = chatlogsNavigationWrapper.querySelector('.w3c a.nav:last-child');

        previousChatlogsPage.style.setProperty('border-radius', '4px 4px 0 0', 'important');
        forwardChatlogsPage.style.setProperty('border-radius', '0 0 4px 4px', 'important');

        // Style each svg arrow and set their HTML content
        const arrowUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
      </svg>`;

        const arrowDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-down">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
      </svg>`;

        // Assign svg arrows instead default font ugly arrows
        previousChatlogsPage.innerHTML = arrowUpSvg;
        forwardChatlogsPage.innerHTML = arrowDownSvg;
      }

      // Restyle home page link and position it near the navigation buttons
      function beautifyHomePageButton() {

        // Store link following to the home page
        const exitChatlogs = document.querySelector('a[href="/"]');

        // If exitChatlogs is null, return without doing anything
        if (!exitChatlogs) {
          return;
        }

        // Store svg house icon for the home page button instead textContent data
        const homePageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-home">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>`;

        // Assign svg home icon to the home button
        exitChatlogs.innerHTML = homePageSvg;

        // Add styles to the exitChatlogs button
        exitChatlogs.style.position = 'fixed';
        exitChatlogs.style.right = '30px';
        exitChatlogs.style.top = '50vh';
        exitChatlogs.style.transform = 'translateY(-90px)'
        exitChatlogs.style.height = '40px';
        exitChatlogs.style.width = '40px';
        exitChatlogs.style.display = 'flex';
        exitChatlogs.style.justifyContent = 'center';
        exitChatlogs.style.alignItems = 'center';
        exitChatlogs.style.setProperty('border-radius', '4px', 'important');
        exitChatlogs.style.setProperty('color', '#1b1b1b', 'important');
        exitChatlogs.style.backgroundColor = '#808080';
        exitChatlogs.style.transition = 'background-color 0.3s ease';

        // Change the background color on mouse over and out
        exitChatlogs.addEventListener('mouseenter', () => {
          exitChatlogs.style.backgroundColor = '#a9a9a9';
        });

        exitChatlogs.addEventListener('mouseleave', () => {
          exitChatlogs.style.backgroundColor = '#808080';
        });

      }

      colorizeNicknames();
      beautifyNavigationButtons();
      beautifyHomePageButton();
    }
  }

  const homePage = window.location.protocol + "//klavogonki.ru/";
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
  const currentDay = ("0" + currentDate.getDate()).slice(-2);
  const actualChatlogsLink = `https://klavogonki.ru/chatlogs/${currentYear}-${currentMonth}-${currentDay}.html`;

  function setChatlogsLink() {
    if (window.location.href.startsWith(homePage) && !window.location.href.startsWith(homePage + "chatlogs/")) {
      const mainMenu = document.querySelector(".right .menu");
      if (mainMenu) {
        const chatlogsLink = document.createElement("a");
        chatlogsLink.href = actualChatlogsLink;
        chatlogsLink.textContent = "Chatlogs";
        mainMenu.appendChild(chatlogsLink);
      }
    }
  }

  function preventUnexistentNavigation() {
    // Get the chatlogs date from the URL using a regular expression
    const chatlogsDateMatch = window.location.href.match(/\d{4}-\d{2}-\d{2}/);

    if (chatlogsDateMatch) {
      // Convert the chatlogs date to a Date object
      const chatlogsDate = new Date(chatlogsDateMatch[0]);
      const chatlogsDay = chatlogsDate.getDate();
      const currentDay = currentDate.getDate();

      // Compare the chatlogs day and current day numbers
      if (chatlogsDay > currentDay) {
        // If the chatlogs day number is greater, redirect to the latest actual chatlogs link
        window.location.href = actualChatlogsLink;
      }
    }
  }

  // Define a function to remove unnecessary elements from the webpage
  function removeUnnecessaryElements() {

    // Remove validation links if they exist
    const validatorLinks = document.querySelector('.legend');
    if (validatorLinks) {
      validatorLinks.remove();
    }

    // Find all elements with class "rc"
    const rcElements = document.querySelectorAll('.rc');

    // Loop through each "rc" element and remove the ones with specified text content
    rcElements.forEach((element) => {
      if (element.textContent.includes('Room Configuration') || element.textContent.includes('Room Occupants')) {
        element.remove(); // Remove the "rc" element if it has the specified text content
      }
    });

    // Remove element with class "roomtitle"
    const roomTitleElement = document.querySelector('.roomtitle');
    if (roomTitleElement) {
      roomTitleElement.remove(); // Remove the element with class "roomtitle"
    }

    // Reference for the current date info header textContent
    const chatlogsDateString = document.querySelector('.logdate');
    if (chatlogsDateString) {
      // Remove border and margin top of chatlogsDateString
      chatlogsDateString.style.border = 'none';
      chatlogsDateString.style.marginTop = '0px';

      // Remove only text without removing all the elements inside the parent
      chatlogsDateString.childNodes[0].nodeValue = '';
    }

    // Remove timezone text element
    const chatlogsTimezone = document.querySelector('.ts');
    if (chatlogsTimezone) {
      chatlogsTimezone.remove(); // Remove the element with class "ts"
    }

    // Get the first two <br> tags in the content
    const brTags = document.querySelectorAll('body br:nth-of-type(-n+2)');
    if (brTags) {
      // Remove two first useless br tags
      brTags.forEach((br) => {
        br.parentNode.removeChild(br);
      });
    }

  }

  if (window.location.href.includes("/chatlogs/")) {
    preventUnexistentNavigation(); // Prevents the user from navigating to non-existent chat logs
    removeUnnecessaryElements(); // Remove all the garbage
    setChatlogsStyles(); // Restyles the chat logs page by setting new styles to various elements on the page
  }

  switchToHttps(); // Switch from http to https protocol
  setChatlogsLink(); // Add additional link to chatlogs in the main menu for the fastest accessibility

})();