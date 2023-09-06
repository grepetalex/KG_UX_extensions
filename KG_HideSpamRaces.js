// ==UserScript==
// @name         KG_HideSpamRaces
// @namespace    http://klavogonki.ru
// @version      0.2
// @description  This script will hide all the races what are created for bad purposes
// @author       Patcher
// @match        *://klavogonki.ru/gamelist/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

// Constants for the threshold and time limits
const itemThreshold = 1; // Number of items
const timeLimitInSeconds = 3; // Time in seconds
const showItemInfo = true; // Boolean flag to control element creation and updating

// Create a single raceItem element if showItemInfo is true
const raceItem = showItemInfo ? document.createElement('div') : null;
if (showItemInfo && raceItem) {
  raceItem.classList.add('raceItems');
  document.body.appendChild(raceItem);

  // Add initial styles to the raceItem element
  raceItem.style.display = 'flex';
  raceItem.style.position = 'fixed';
  raceItem.style.padding = '6px';
  raceItem.style.bottom = '6px';
  raceItem.style.left = '6px';
}

// Function to update the raceItem element if showItemInfo is true
function updateRaceItem(profileText, exceededLimit) {
  if (showItemInfo && raceItem) {
    // Update the additional classes and background color based on whether it's removed or saved
    if (exceededLimit) {
      raceItem.classList.add('removed');
      raceItem.classList.remove('saved');
      raceItem.style.backgroundColor = 'hsl(0, 50%, 15%)';
      raceItem.style.color = 'hsl(0, 50%, 70%)';
      raceItem.style.setProperty('border', '1px solid hsl(0, 50%, 40%)', 'important');
    } else {
      raceItem.classList.remove('removed');
      raceItem.classList.add('saved');
      raceItem.style.backgroundColor = 'hsl(100, 50%, 10%)';
      raceItem.style.color = 'hsl(100, 50%, 50%)';
      raceItem.style.setProperty('border', '1px solid hsl(100, 50%, 25%)', 'important');
    }

    // Set the text content
    raceItem.textContent = profileText;
  }
}

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
    }

    // Update the raceItem element
    updateRaceItem(profileText, profileTextCount[profileText].exceededLimit);

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
        console.log('Hidden item with profile text:', profileText);
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