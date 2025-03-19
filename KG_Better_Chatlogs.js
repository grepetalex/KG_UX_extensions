// ==UserScript==
// @name         KG_Better_Chatlogs
// @namespace    https://klavogonki.ru
// @version      1.0.5
// @description  Restyle chatlogs: remove brackets, convert font to span.username, remove unwanted timezone elements, group messages into .message-item wrapped in .messages-wrapper, wrap links, wrap time/username in an .info container, and add smooth hover transitions with responsive design. Now with SVG navigation icons and tablet optimization.
// @author       Patcher
// @match        *://klavogonki.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {

  function run() {
    const BASE_URL = location.protocol + "//klavogonki.ru",
      CHATLOGS_URL = BASE_URL + "/chatlogs",
      IS_HOME = location.pathname === "/" || location.pathname === "",
      IS_CHAT = location.href.includes("/chatlogs/");

    if (IS_CHAT) {
      // Apply the background color immediately to prevent white flash
      document.documentElement.style.setProperty('background-color', '#1e1e1e', 'important');
      document.body.style.setProperty('background-color', '#1e1e1e', 'important');
    }

    const setStyle = (el, styles) =>
      Object.entries(styles).forEach(([prop, val]) => el.style.setProperty(prop, val, 'important'));

    const getCurrentChatlogsUrl = () => {
      const now = new Date(), pad = n => String(n).padStart(2, '0');
      return `${CHATLOGS_URL}/${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.html`;
    };

    // Wrap URLs into anchor tags (opens in a new tab)
    const linkify = (text, maxUrlLength = 50) => {
      return text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
        // Preserve the full URL in the href
        const fullUrl = match;

        // Create a display version with potential truncation
        let displayUrl = match;
        if (displayUrl.length > maxUrlLength) {
          // Extract domain part
          const urlObj = new URL(fullUrl);
          const domain = urlObj.hostname;

          // Get path portion without query parameters
          const path = urlObj.pathname;

          // Calculate how many characters we can display from the path
          const remainingChars = maxUrlLength - domain.length - 5; // 5 for "://", "..." and some buffer

          if (remainingChars > 10) {
            // Show beginning and end of path with ellipsis in the middle
            const firstPart = path.slice(0, remainingChars / 3);
            const lastPart = path.slice(-remainingChars / 3);
            displayUrl = `${urlObj.protocol}//${domain}${firstPart}...${lastPart}`;
          } else {
            // Just show domain with ellipsis
            displayUrl = `${urlObj.protocol}//${domain}/...`;
          }

          // If there are query parameters, indicate this
          if (urlObj.search) {
            displayUrl += '?...';
          }
        }

        return `<a href="${fullUrl}" target="_blank" title="${fullUrl}">${displayUrl}</a>`;
      });
    };

    const colorizeNicknames = () => {
      setStyle(document.body, { 'font-size': '1em', 'font-family': 'Montserrat' });
      const nicknameColors = {};
      document.querySelectorAll("font.mn").forEach(el => {
        const username = el.textContent.replace(/[<>]/g, '').trim(),
          span = document.createElement('span');
        span.className = 'username';
        span.textContent = username;
        if (el.getAttribute('style')) span.setAttribute('style', el.getAttribute('style'));
        el.parentNode.replaceChild(span, el);
      });
      document.querySelectorAll("span.username").forEach(el => {
        if (!el.style.color) {
          const nick = el.textContent;
          if (!nicknameColors[nick]) {
            const hue = Math.floor(Math.random() * 360),
              sat = Math.floor(Math.random() * 20) + 80;
            nicknameColors[nick] = `hsl(${hue}, ${sat}%, 70%)`;
          }
          el.style.setProperty('color', nicknameColors[nick], 'important');
        }
      });
    };

    const createSVG = (icon, data) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-${icon}">${data}</svg>`;

    const beautifyNavigation = () => {
      // Look for the nav wrapper (with class "w3c")
      let navWrapper = document.querySelector('.logdate .w3c') || document.querySelector('a.nav')?.parentNode;
      if (navWrapper) {
        // Change class from "w3c" to "navigation"
        navWrapper.classList.remove('w3c');
        navWrapper.classList.add('navigation');

        // Default desktop styles - will be overridden by media query for tablets
        setStyle(navWrapper, {
          'position': 'fixed',
          'height': 'auto',
          'width': 'auto',
          'right': '0.5em',
          'bottom': '50vh',
          'transform': 'translateY(50%)',
          'display': 'flex',
          'flex-direction': 'column',
          'gap': '0.5em',
          'z-index': '10000'
        });

        // Handle tablet responsive layout with JavaScript
        const checkTabletWidth = () => {
          if (window.innerWidth <= 1024) { // Tablet breakpoint
            setStyle(navWrapper, {
              'width': '100%',
              'right': '0',
              'bottom': '0.5em',
              'transform': 'none',
              'flex-direction': 'row',
              'justify-content': 'center',
              'gap': '0.5em'
            });
          } else {
            setStyle(navWrapper, {
              'width': 'auto',
              'right': '0.5em',
              'bottom': '50vh',
              'transform': 'translateY(50%)',
              'flex-direction': 'column',
              'justify-content': 'flex-start',
              'gap': '0.5em'
            });
          }
        };

        // Initial check and listen for resize events
        checkTabletWidth();
        window.addEventListener('resize', checkTabletWidth);

        const navButtons = navWrapper.querySelectorAll('a.nav');
        navButtons.forEach(btn => {
          setStyle(btn, {
            'display': 'flex',
            'justify-content': 'center',
            'align-items': 'center',
            'height': '40px',
            'width': '40px',
            'background-color': '#808080',
            'color': '#1b1b1b',
            'transition': 'background-color 0.15s'
          });
          // Uniform border-radius for all buttons
          btn.style.setProperty('border-radius', '4px', 'important');
          btn.addEventListener('mouseenter', () => btn.style.setProperty('background-color', '#a9a9a9', 'important'));
          btn.addEventListener('mouseleave', () => btn.style.setProperty('background-color', '#808080', 'important'));

          // Set appropriate SVG icon and class based on button text or href
          if (btn.getAttribute('href') === "./") {
            // Home button - fix to go to BASE_URL instead of chatlogs
            btn.href = BASE_URL;
            btn.innerHTML = createSVG('home', '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>');
            btn.classList.add('home');
          } else if (btn.textContent === "<") {
            // Backward button
            btn.innerHTML = createSVG('arrow-left', '<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>');
            btn.classList.add('backward');
          } else if (btn.textContent === ">") {
            // Forward button
            btn.innerHTML = createSVG('arrow-right', '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>');
            btn.classList.add('forward');
          }
        });
      } else {
        // If no nav wrapper exists, create a dedicated home button.
        let homeButton = document.querySelector('a.home-btn');
        if (!homeButton) {
          homeButton = document.createElement('a');
          homeButton.href = BASE_URL; // Fix to go to BASE_URL instead of chatlogs
          homeButton.className = 'home-btn home';
          document.body.appendChild(homeButton);
        }

        // Default position for desktop
        setStyle(homeButton, {
          'position': 'fixed',
          'right': '30px',
          'bottom': '50vh',
          'transform': 'translateY(-90px)',
          'height': '40px',
          'width': '40px',
          'display': 'flex',
          'justify-content': 'center',
          'align-items': 'center',
          'border-radius': '4px',
          'color': '#1b1b1b',
          'background-color': '#808080',
          'transition': 'background-color 0.15s',
          'z-index': '10000'
        });

        // Handle tablet responsive layout for standalone home button
        const checkTabletWidthForHome = () => {
          if (window.innerWidth <= 1024) { // Tablet breakpoint
            setStyle(homeButton, {
              'right': 'auto',
              'bottom': '0.5em',
              'left': '50%',
              'transform': 'translateX(-50%)'
            });
          } else {
            setStyle(homeButton, {
              'right': '30px',
              'bottom': '50vh',
              'left': 'auto',
              'transform': 'translateY(-90px)'
            });
          }
        };

        // Initial check and listen for resize events
        checkTabletWidthForHome();
        window.addEventListener('resize', checkTabletWidthForHome);

        homeButton.addEventListener('mouseenter', () => homeButton.style.setProperty('background-color', '#a9a9a9', 'important'));
        homeButton.addEventListener('mouseleave', () => homeButton.style.setProperty('background-color', '#808080', 'important'));
        homeButton.innerHTML = createSVG('home', '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>');
      }
    };

    const addChatlogsLink = () => {
      if (IS_HOME) {
        const menu = document.querySelector(".right .menu");
        if (menu) {
          // Check if the link already exists
          const existingLink = Array.from(menu.querySelectorAll('a')).find(a =>
            a.textContent === "Chatlogs" || a.href.includes("/chatlogs/"));

          if (!existingLink) {
            const a = document.createElement("a");
            a.href = getCurrentChatlogsUrl();
            a.textContent = "Chatlogs";
            menu.appendChild(a);
            console.log("Added Chatlogs link to menu");
          }
        } else {
          console.log("Menu not found");
        }
      }
    };

    const preventFutureNavigation = () => {
      const match = location.href.match(/\d{4}-\d{2}-\d{2}/);
      if (match) {
        const chatDate = new Date(match[0]),
          today = new Date();
        chatDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (chatDate > today) location.href = getCurrentChatlogsUrl();
      }
    };

    const removeElements = () => {
      document.querySelector('.legend')?.remove();
      document.querySelectorAll('.rc').forEach(el => {
        const title = el.querySelector('.rct');
        if (title && (title.textContent.includes('Room Configuration') || title.textContent.includes('Room Occupants')))
          el.remove();
      });
      document.querySelector('.roomtitle')?.remove();
      const dateElem = document.querySelector('.logdate');
      if (dateElem) {
        setStyle(dateElem, { 'border': 'none', 'margin-top': '0' });
        dateElem.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.nodeValue = ''; });
      }
      document.querySelectorAll('br').forEach(br => br.remove());
      document.querySelectorAll('.ts').forEach(el => { if (/GMT/i.test(el.textContent)) el.remove(); });
    };

    const restructureMessages = () => {
      const timeMarkers = Array.from(document.querySelectorAll('a.ts')).filter(el => !/GMT/i.test(el.textContent));
      if (!timeMarkers.length) return;
      const container = timeMarkers[0].parentNode;
      // Detach navWrapper (if any) so it isn't cleared.
      const navWrapper = container.querySelector('.w3c') || container.querySelector('.navigation');
      if (navWrapper) navWrapper.remove();

      const messagesWrapper = document.createElement('div');
      messagesWrapper.className = 'messages-wrapper';
      timeMarkers.forEach((current, i) => {
        const next = timeMarkers[i + 1] || null,
          messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        // Create .info container for time and username.
        const infoDiv = document.createElement('div');
        infoDiv.className = 'info';
        const timeText = current.textContent.replace(/[\[\]]/g, '').trim(),
          newTime = document.createElement('time');
        newTime.className = 'time';
        newTime.textContent = timeText;
        infoDiv.appendChild(newTime);
        let usernameEl = null, messageParts = [];
        for (let node = current.nextSibling; node && node !== next; node = node.nextSibling) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('username')) {
              usernameEl = node.cloneNode(true);
            } else {
              const txt = node.textContent.trim();
              if (txt) messageParts.push(txt);
            }
          } else if (node.nodeType === Node.TEXT_NODE) {
            const txt = node.textContent.trim();
            if (txt) messageParts.push(txt);
          }
        }
        if (usernameEl) infoDiv.appendChild(usernameEl);
        messageItem.appendChild(infoDiv);
        const pMessage = document.createElement('p');
        pMessage.className = 'message';
        pMessage.innerHTML = linkify(messageParts.join(' '));
        messageItem.appendChild(pMessage);
        messagesWrapper.appendChild(messageItem);
      });
      // Clear container and reinsert detached navWrapper (if any)
      container.innerHTML = '';
      if (navWrapper) container.appendChild(navWrapper);
      container.appendChild(messagesWrapper);
    };

    const injectCustomStyles = () => {
      document.head.insertAdjacentHTML('beforeend', '<meta name="viewport" content="width=device-width, initial-scale=1.0">');

      const style = document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
        .time { color: #666 !important; transition: color 0.2s !important; font-size: 0.8em !important; }
        .username { }
        .info { display: flex !important; align-items: center !important; gap: 10px !important; margin-right: 10px !important; }
        .message { color: #deb887 !important; margin: 0 !important; }
        a { color: #82B32A !important; }
        a:hover { color: #95cc30 !important; }
        .message-item { margin-bottom: 10px !important; display: flex !important; flex-direction: row !important; }
        .messages-wrapper { display: flex !important; flex-direction: column !important; }
        @media (max-width: 768px) {
          .message-item { flex-direction: column !important; }
        }
        @media (max-width: 1024px) {
          body {
            padding-bottom: 50px !important; /* Add padding for tablet view to prevent content from being hidden behind bottom navigation */
          }
        }
      `;
      document.head.appendChild(style);
    };

    const enhanceChatlogs = () => {
      if (!IS_CHAT) return;
      colorizeNicknames();
      beautifyNavigation();
      removeElements();
      restructureMessages();
      preventFutureNavigation();
    };

    const init = () => {
      injectCustomStyles();
      if (IS_CHAT) enhanceChatlogs();
      addChatlogsLink();
    };

    init();
  }

  run();

})();