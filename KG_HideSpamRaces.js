// ==UserScript==
// @name         KG_HideSpamRaces
// @namespace    http://klavogonki.ru
// @version      0.4
// @description  This script will hide all the races what are created for bad purposes
// @author       Patcher
// @match        *://klavogonki.ru/gamelist/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

// Constants for the threshold, time limits, and max hidden elements
const itemThreshold = 1; // Number of items
const timeLimitInSeconds = 3; // Time in seconds
const showItemInfo = true; // Boolean flag to control element creation and updating
const maxHiddenElements = 300; // Maximum number of hidden elements before removal

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

// Create an object to store the count and timestamp of each profile text
const profileTextCount = {};

// Function to process a single .item element
function processItem(item) {
  const profileElements = item.querySelectorAll('[id^="player_name"]');
  if (profileElements.length > 0) {
    const profileTextArray = Array.from(profileElements).map(element => element.textContent.trim());

    // Iterate through the profileTextArray and update the counts and timestamps
    profileTextArray.forEach(profileText => {
      if (!profileTextCount[profileText]) {
        profileTextCount[profileText] = {
          count: 0,
          lastTimestamp: 0,
          exceededLimit: false,
        };
      }

      const currentTime = Date.now();

      // Check if the user at index 0 has created more than itemThreshold items with the same profile text within the time limit
      if (profileTextCount[profileText].count >= itemThreshold && currentTime - profileTextCount[profileText].lastTimestamp <= timeLimitInSeconds * 1000) {
        // Set a flag to indicate that this user has exceeded the limit
        profileTextCount[profileText].exceededLimit = true;

        // Hide the item
        item.style.display = 'none';
      }

      // Update the raceItem element
      updateRaceItem(profileText, profileTextCount[profileText].exceededLimit);

      // Update the count and timestamp for this profile text in the object
      profileTextCount[profileText].count += 1;
      profileTextCount[profileText].lastTimestamp = currentTime;
    });
  }
}

// Function to hide all items of a user who exceeded the limit with a delay
function hideItemsWithExceededLimit(profileText) {
  document.querySelectorAll('#gamelist .item').forEach(itemToHide => {
    const itemProfileElements = itemToHide.querySelectorAll('[id^="player_name"]');
    const profileTextArray = Array.from(itemProfileElements).map(element => element.textContent.trim());
    if (profileTextArray.length > 0 && profileTextArray[0] === profileText) {
      // Check if the item still exists in the DOM before attempting to hide it
      if (itemToHide.parentNode) {
        // Hide the item by setting display to "none"
        itemToHide.style.display = 'none';

        // Clear the user's data after hiding
        profileTextArray.forEach(profileText => {
          delete profileTextCount[profileText];
        });

        // Check if the number of hidden elements exceeds maxHiddenElements
        const hiddenElements = document.querySelectorAll('#gamelist .item[style*="display: none;"]');
        if (hiddenElements.length > maxHiddenElements) {
          // Remove excess hidden elements and their comments
          hiddenElements.forEach(hiddenElement => {
            const nextSibling = hiddenElement.nextSibling;
            if (nextSibling && nextSibling.nodeType === Node.COMMENT_NODE) {
              nextSibling.parentNode.removeChild(nextSibling);
            }
            hiddenElement.parentNode.removeChild(hiddenElement);
          });
        }
      }
    }
  });
}

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

// Function to inject the CSS style with the removed Race Item Animation into the <head> tag
function injectCSS() {
  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');

  style.textContent = `
    @keyframes removedRaceItemAnimation {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-30px);
      }
      60% {
        transform: translateY(-15px);
      }
    }

    .removed {
      animation: removedRaceItemAnimation 1s ease-in-out;
    }
  `;

  // Add the class 'removed-race-item-animation' to the <style> tag
  style.classList.add('removed-race-item-animation');

  head.appendChild(style);
}

// Call the injectCSS function to inject the CSS
injectCSS();