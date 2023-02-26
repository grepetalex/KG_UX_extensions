// ==UserScript==
// @name         KG_Chat_Users_Tracker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Count how much users are in chat and notify who entered and left the chat
// @author       Patcher 
// @match        *://klavogonki.ru/gamelist/
// @grant        none
// ==/UserScript==

(function () {

  // Define the function to randomize the color with exposed lightness parameter
  function randomHSLColor(lightness) {
    var hue = Math.floor(Math.random() * 360);
    var saturation = 20;
    var color = "hsl(" + hue + "," + saturation + "%," + lightness + "%)";
    return color;
  }

  // Reference for the existing popup
  let previousPopup = null;

  function showUserAction(user, action, isEntering) {
    const userPopup = document.createElement('div');
    userPopup.classList.add('userPopup');
    userPopup.innerText = `${user} ${action}`;

    // Set the initial styles for the user popup
    userPopup.style.position = 'fixed';
    userPopup.style.right = '-100%';
    userPopup.style.transform = 'translateY(-50%)';
    userPopup.style.opacity = '0';
    userPopup.style.color = isEntering ? '#83cf40' : '#f66b6b'; // green and red
    userPopup.style.backgroundColor = randomHSLColor(15);
    userPopup.style.border = `1px solid ${randomHSLColor(35)}`;
    userPopup.style.setProperty('border-radius', '4px 0 0 4px', 'important');
    userPopup.style.padding = '8px 16px';
    userPopup.style.display = 'flex';
    userPopup.style.alignItems = 'center';

    // Append the user popup to the body
    document.body.appendChild(userPopup);

    // Calculate the width and height of the user popup
    const popupWidth = userPopup.offsetWidth;
    const popupHeight = userPopup.offsetHeight;
    const verticalOffset = 2;

    // Set the position of the user popup relative to the previous popup
    let topPosition = '30vh';
    if (previousPopup !== null) {
      const previousPopupPosition = previousPopup.getBoundingClientRect();
      topPosition = `calc(${previousPopupPosition.bottom}px + ${popupHeight}px / 2 + ${verticalOffset}px)`;
    }
    userPopup.style.top = topPosition;
    userPopup.style.right = `-${popupWidth}px`;

    // Animate the user popup onto the screen
    userPopup.style.transition = 'all 0.3s ease-in-out';
    userPopup.style.right = '0';
    userPopup.style.opacity = '1';

    // Store a reference to the current popup
    previousPopup = userPopup;

    // Hide the user popup after a short delay
    setTimeout(() => {
      userPopup.style.transition = 'all 0.3s ease-in-out';
      userPopup.style.right = `-${popupWidth}px`;
      userPopup.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(userPopup);
        // Clear the reference to the previous popup
        if (previousPopup === userPopup) {
          previousPopup = null;
        }
      }, 300);
    }, 5000);
  }

  const userList = document.querySelector('.userlist-content');
  const userCount = document.createElement('div');
  userCount.classList.add('user-count');
  userCount.style.filter = 'grayscale(100%)';
  userCount.innerHTML = '0';
  document.body.appendChild(userCount);


  // Initialize variables to keep track of the current and previous users
  let currentUsers = [];
  let previousUsers = [];
  let hasObservedChanges = false;
  let prevUserCountValue = 0;

  // Initialize variables for the user count animation
  let currentTextContent = [];
  let isAnimating = false;


  // Create a mutation observer to detect when the user list is modified
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const newUserList = Array.from(userList.children).map(child => child.textContent);

        // Find new users and left users
        const newUsers = newUserList.filter(user => !currentUsers.includes(user));
        const leftUsers = currentUsers.filter(user => !newUserList.includes(user));

        // Update the user count
        const userCountValue = newUserList.length;
        const userCount = document.querySelector('.user-count');
        userCount.innerHTML = `${userCountValue}`;

        // Update grayscale filter
        userCount.style.filter = userCountValue > 0 ? 'none' : 'grayscale(100%)';

        // Check if the user count has changed and add pulse animation
        if (userCountValue !== prevUserCountValue) {
          userCount.classList.add('pulse');
          setTimeout(() => {
            userCount.classList.remove('pulse');
          }, 1000);
        }

        // Log new and left users
        if (hasObservedChanges) {
          newUsers.forEach((newUser) => {
            if (!previousUsers.includes(newUser)) {
              console.log(`%cNew user entered: ${newUser}`, 'color: green;');
              showUserAction(newUser, 'entered the chat', true);
            }
          });
          leftUsers.forEach((leftUser) => {
            console.log(`%cUser left: ${leftUser}`, 'color: red;');
            showUserAction(leftUser, 'left the chat', false);
          });
        } else {
          hasObservedChanges = true;
        }

        // Update the previous users and user count
        previousUsers = currentUsers;
        currentUsers = newUserList;
        prevUserCountValue = userCountValue;

        // Check if the user count animation needs to be started
        if (currentTextContent.length === 0 && newUserList.length > 0 && !isAnimating) {
          isAnimating = true;
          const actualUserCount = newUserList.length;
          const speed = 50; // Change the speed here (in milliseconds)
          let count = 0;
          const userCountIncrement = () => {
            if (count <= actualUserCount) {
              const progress = count / actualUserCount;
              const grayscale = 100 - progress * 100;
              userCount.innerHTML = `${count++}`;
              userCount.style.filter = `grayscale(${grayscale}%)`;
              setTimeout(userCountIncrement, speed);
            } else {
              currentTextContent = Array.from(userList.children).map(child => child.textContent);
              userCount.style.filter = 'none';
              userCount.classList.add('pulse');
              setTimeout(() => {
                userCount.classList.remove('pulse');
              }, 1000);
            }
          };
          setTimeout(userCountIncrement, speed);
        }
      }
    });
  });

  // Start observing the user list for changes
  const config = { childList: true };
  observer.observe(userList, config);


  // Styles
  const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');

  .user-count {
    font-family: 'Orbitron', sans-serif;
    font-size: 24px;
    color: #83cf40;
    position: fixed;
    top: 130px;
    right: 24px;
    background-color: #2b4317;
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #4b7328;
    transition: filter 0.2s ease-in-out;
  }

  .pulse {
    animation-name: pulse;
    animation-duration: 1s;
    animation-iteration-count: 1;
  }

  @keyframes pulse {
    0% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.5);
    }
    100% {
      filter: brightness(1);
    }
  }
`;

  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

})();