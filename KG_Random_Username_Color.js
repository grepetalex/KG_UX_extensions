// ==UserScript==
// @name         KG_Random_Username_Color
// @namespace    http://tampermonkey.net/
// @version      2024-10-12
// @description  Try to highlight yourself in a different colors
// @author       Patcher
// @match        https://klavogonki.ru/gamelist/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

// Function to generate a random hex color
function getRandomColor() {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16); // Generate a random hex number
  return randomColor.padStart(6, '0'); // Ensure it's 6 digits long
}

// Function to retrieve the XSRF token from cookies
function getXSRFToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; XSRF-TOKEN=`);
  if (parts.length === 2) return parts.pop().split(';').shift(); // Return the token value
  return null; // Return null if the token is not found
}

// Debounce function to limit how often a function can be called
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Function to backup input value to localStorage
function backupInputValue() {
  const inputField = document.querySelector('.text'); // Select the input element
  if (inputField) {
    localStorage.setItem('inputBackup', inputField.value); // Store the current input value
  }
}

// Function to restore input value from localStorage with a delay
function restoreInputValue() {
  setTimeout(() => {
    const inputField = document.querySelector('.text'); // Select the input element
    const backupValue = localStorage.getItem('inputBackup'); // Retrieve the backup value
    if (inputField && backupValue) {
      inputField.value = backupValue; // Restore the input value
    }
  }, 2000);
}

restoreInputValue();

// Function to change the color if more than a minute has passed
async function changeColorIfNeeded() {
  const lastChangeTime = localStorage.getItem('lastColorChangeTime'); // Retrieve the last change time from localStorage
  const currentTime = Date.now(); // Get the current time

  // Check if the difference is more than 1 minute (60000 milliseconds)
  if (!lastChangeTime || currentTime - lastChangeTime > 60000) {
    const color = getRandomColor(); // Get a new random color
    const xsrfToken = getXSRFToken(); // Retrieve the XSRF token

    if (!xsrfToken) {
      console.error('XSRF token not found'); // Handle missing token
      return; // Exit if the token is not available
    }

    // Make the fetch request to set the color profile
    await fetch("https://klavogonki.ru/api/profile/set-color-profile", {
      credentials: "include",
      headers: {
        "X-XSRF-TOKEN": xsrfToken // Include the XSRF token in the headers
      },
      body: JSON.stringify({ color: color }), // Set the color in the body
      method: "POST",
      mode: "cors"
    });

    console.log(`Color changed to: #${color}`); // Log the new color
    localStorage.setItem('lastColorChangeTime', currentTime); // Store the current time in localStorage

    // Backup input value before reload
    backupInputValue();
    location.reload(); // Reload the current page
  }
}

// Select the target node for observing new messages
const targetNode = document.querySelector('.messages-content');

// Options for the observer (which mutations to observe)
const config = { childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = function (mutationsList) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        // Check if the added node is a <p> element
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P') {
          changeColorIfNeeded(); // Call the color change function when a new <p> is added
        }
      });
    }
  }
};

// Create an instance of MutationObserver with the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

// Start the initial check for color changes
changeColorIfNeeded();

// Select the input field and add an event listener with debounce
const inputField = document.querySelector('.text'); // Select the input element
if (inputField) {
  inputField.addEventListener('input', debounce(backupInputValue, 500)); // Update localStorage after 500ms of no input
}