// ==UserScript==
// @name         KG_HideSpamRaces
// @namespace    http://klavogonki.ru
// @version      0.1
// @description  This script will hide all the races what are created for bad purposes
// @author       Patcher
// @match        *://klavogonki.ru/gamelist/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

// Constants for the threshold and time limits
const itemThreshold = 1; // Number of items
const timeLimitInSeconds = 3; // Time in seconds

// Function to process a single .item element
function processItem(item) {
  const profileElement = item.querySelector('.profile');
  if (profileElement) {
    const profileText = profileElement.textContent.trim();

    // Initialize the profileTextCount object for this profile text
    if (!profileTextCount[profileText]) {
      profileTextCount[profileText] = {
        count: 0,
        lastTimestamp: 0,
        exceededLimit: false,
      };
    }

    const currentTime = Date.now();
    const lastTimestamp = profileTextCount[profileText].lastTimestamp;

    // Check if the user has created more than itemThreshold items with the same profile text within the time limit
    if (profileTextCount[profileText].count >= itemThreshold && currentTime - lastTimestamp <= timeLimitInSeconds * 1000) {
      // Set a flag to indicate that this user has exceeded the limit
      profileTextCount[profileText].exceededLimit = true;
    } else {
      // Debugging: Log the item that was not removed
      // console.log('Saved item with profile text:', profileText);
    }

    // Update the count and timestamp for this profile text in the object
    profileTextCount[profileText].count += 1;
    profileTextCount[profileText].lastTimestamp = currentTime;
  }
}

// Function to hide all items of a user who exceeded the limit with a delay
function hideItemsWithExceededLimit(profileText) {
  document.querySelectorAll('#gamelist .item').forEach(itemToHide => {
    const itemProfileElement = itemToHide.querySelector('.profile');
    if (itemProfileElement && itemProfileElement.textContent.trim() === profileText) {
      // Check if the item still exists in the DOM before attempting to hide it
      if (itemToHide.parentNode) {
        // Hide the item by setting display to "none"
        itemToHide.style.display = 'none';
        // Debugging: Log the hidden item and profile text
        // console.log('Hidden item with profile text:', profileText);
        // Clear the user's data after hiding
        delete profileTextCount[profileText];
      }
    }
  });
}

// Create an object to store the count and timestamp of each profile text
const profileTextCount = {};

// Iterate through existing .item elements
document.querySelectorAll('#gamelist .item').forEach(item => {
  processItem(item);
});

// Create a MutationObserver to watch for changes in #gamelist
const observer = new MutationObserver(mutationsList => {
  mutationsList.forEach(mutation => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Iterate through newly added .item elements
      mutation.addedNodes.forEach(addedNode => {
        if (addedNode.nodeType === 1 && addedNode.classList.contains('item')) {
          processItem(addedNode);
        }
      });
    }
  });

  // Check for users who exceeded the limit and hide their items
  Object.keys(profileTextCount).forEach(profileText => {
    if (profileTextCount[profileText].exceededLimit) {
      hideItemsWithExceededLimit(profileText);
    }
  });
});

// Start observing #gamelist for changes
const gamelist = document.getElementById('gamelist');
observer.observe(gamelist, { childList: true, subtree: true });