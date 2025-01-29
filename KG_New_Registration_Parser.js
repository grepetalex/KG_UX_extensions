// ==UserScript==
// @name         KG_New_Registration_Parser
// @namespace    http://tampermonkey.net/
// @version      2025-01-25
// @description  Let's have a look at this sun of a beach
// @author       Patcher
// @match        *://klavogonki.ru/gamelist/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

function cleanUserRegistrationsData() {
  // Get the data from localStorage
  let userRegistrationsData = JSON.parse(localStorage.getItem('userRegistrationsData'));

  // Check if data exists
  if (!userRegistrationsData) {
    console.log("No user registrations data found.");
    return;
  }

  // Get the current date in YYYY-MM-DD format
  const currentDate = new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD

  // Filter the data, keeping only the records that match the current date
  const filteredData = userRegistrationsData.filter(user => {
    const registeredDate = user.registeredDate.split(' ')[0]; // Get only the date part (before the space)
    return registeredDate === currentDate; // Compare with the current date
  });

  // Check if any data was removed (if filtered data is less than original data length)
  if (filteredData.length !== userRegistrationsData.length) {
    // Log the filtered data to the console if something was removed
    console.log("Filtered user registrations data (removed non-today's data):", filteredData);

    // Save the filtered data back to localStorage
    localStorage.setItem('userRegistrationsData', JSON.stringify(filteredData));

    console.log("User registrations data updated. Only today's data remains.");
  }
} cleanUserRegistrationsData();

// Function to copy the text content from all child elements of a given container to the clipboard
function copyContainerText(container) {
  // Get the current date in the format YYYY-MM-DD
  const currentDate = new Date().toISOString().split('T')[0];

  // Collect text content from all child elements and join them with a newline
  const textContent = Array.from(container.children)
    .map(e => e.textContent) // Get text content of each child
    .join('\n'); // Join with newline between each child

  // Prepend the current date and add empty lines before and after content
  const finalText = `${currentDate}\n\n${textContent}\n\n`;

  // Copy the collected text to the clipboard
  navigator.clipboard.writeText(finalText)
    .catch(err => console.error('Failed to copy text:', err)); // Log any errors
}

async function parseUserRegistrations(startId) {
  const maxRetries = 3;
  const delay = 150;
  let attempt = 0;

  // If startId is not provided, check the saved lastParsedId in localStorage
  if (!startId) {
    const savedData = JSON.parse(localStorage.getItem('userRegistrationsData')) || [];
    const lastParsedId = localStorage.getItem('lastParsedId');

    // If lastParsedId exists, start from it; otherwise, start from the last ID + 1
    if (lastParsedId) {
      startId = Number(lastParsedId) + 1; // Start from the next ID after the last parsed one
    } else if (savedData.length === 0) {
      console.log("Error: startId is required!");
      return;
    } else {
      startId = Number(savedData[savedData.length - 1].id) + 1; // Start from the last ID + 1
    }
  }

  console.log(`Starting to parse from user ID: ${startId}`);

  // Get saved data and IDs already processed
  const savedData = JSON.parse(localStorage.getItem('userRegistrationsData')) || [];
  const processedIds = new Set(savedData.map(item => item.id)); // Using ID to ensure unique entries

  // Check if the starting ID already exists in localStorage, if so stop the process
  if (processedIds.has(startId)) {
    console.log(`User ID ${startId} already exists in localStorage, stopping the parsing process.`);
    return; // Stop the process immediately if startId exists
  }

  let currentId = startId;

  while (true) {
    // Check if the current ID already exists in localStorage, if so stop the process
    if (processedIds.has(currentId)) {
      console.log(`User ID ${currentId} already exists in localStorage, stopping the parsing process.`);
      break; // Stop the process completely
    }

    try {
      const [summaryData, profileData] = await Promise.all([
        fetch(`https://klavogonki.ru/api/profile/get-summary?id=${currentId}`).then(res => res.json()),
        fetch(`https://klavogonki.ru/api/profile/get-index-data?userId=${currentId}`).then(res => res.json())
      ]);

      if (!summaryData?.user?.login || !summaryData.title || !profileData?.stats?.registered) {
        throw new Error('Invalid data format received from the API.');
      }

      const { title: rank, user: { login, avatar = null } } = summaryData;
      const registeredDate = profileData.stats.registered.sec
        ? convertSecondsToDate(profileData.stats.registered.sec)
        : 'Invalid Date';

      const { sec = 0, usec = 0 } = summaryData.user.avatar || {};
      const avatarTimestamp = convertToUpdatedTimestamp(sec, usec);

      const userData = { id: currentId, login, rank, registeredDate, avatar, avatarTimestamp };
      console.log(userData);

      // Add user data to localStorage only if not already present
      savedData.push(userData);

      // Call the function to create the profile container when valid user data is available
      createUserProfileContainer(userData);

      // Update processedIds after adding new data to avoid duplicate entries in the future
      processedIds.add(currentId);

      // Increment the ID by 1 after a successful fetch (ensure it's an integer)
      currentId = Number(currentId) + 1; // Ensure currentId is treated as a number
      attempt = 0; // Reset attempt counter

    } catch (error) {
      attempt++;

      console.log(`Error fetching data for ID ${currentId}:`, error.message);

      // If max retries are reached for this ID, stop
      if (attempt >= maxRetries) {
        console.log(`Max retries reached for ID ${currentId}. Stopping the parsing process.`);
        break;
      }

      // Retrying the same ID
      console.log(`Retrying attempt ${attempt} for ID ${currentId}...`);
      await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
    }
  }

  // Sort saved data by ID in ascending order after the process is complete
  savedData.sort((a, b) => a.id - b.id);

  // Update localStorage with sorted data
  localStorage.setItem('userRegistrationsData', JSON.stringify(savedData));

  // Update the lastParsedId key in localStorage with the ID of the last processed user
  localStorage.setItem('lastParsedId', currentId - 1);

  console.log(`Parsing process stopped.`);
}

// Function to convert seconds to a human-readable date format
function convertSecondsToDate(seconds) {
  const date = new Date(seconds * 1000);
  return date.toISOString().slice(0, 19).replace('T', ' '); // Converts to 'YYYY-MM-DD HH:mm:ss' format
}

// Function to convert sec and usec to the 'updated' timestamp
function convertToUpdatedTimestamp(sec, usec) {
  // Create the full timestamp by combining sec and usec (in microseconds)
  return sec.toString() + Math.floor(usec / 1000).toString();
}

parseUserRegistrations();

// Function to create a user profile container with the provided user data
function createUserProfileContainer(userData) {
  // Check if the wrapper already exists
  let userProfileWrapper = document.getElementById('user-profile-wrapper');

  // If the wrapper doesn't exist, create it
  if (!userProfileWrapper) {
    userProfileWrapper = document.createElement('div');
    userProfileWrapper.id = 'user-profile-wrapper';

    // Apply styles to the main wrapper
    userProfileWrapper.style.display = 'flex';
    userProfileWrapper.style.flexDirection = 'column';
    userProfileWrapper.style.alignItems = 'start';
    userProfileWrapper.style.width = '700px';
    userProfileWrapper.style.maxHeight = '50vh';
    userProfileWrapper.style.padding = '20px';
    userProfileWrapper.style.backgroundColor = 'rgb(27, 27, 27)';
    userProfileWrapper.style.left = '50%';
    userProfileWrapper.style.position = 'absolute';
    userProfileWrapper.style.top = '50%';
    userProfileWrapper.style.transform = 'translate(-50%, -50%)';
    userProfileWrapper.style.zIndex = '910';

    // Apply vertical scrolling and hide horizontal scrolling
    userProfileWrapper.style.overflowY = 'auto';
    userProfileWrapper.style.overflowX = 'hidden';

    // Apply border-radius with !important using setProperty
    userProfileWrapper.style.setProperty('border-radius', '8px', 'important');

    // Append the wrapper to the document body
    document.body.appendChild(userProfileWrapper);

    // Add the double-click event listener to remove the wrapper
    userProfileWrapper.addEventListener('dblclick', function () {
      copyContainerText(registeredDataContainer); // Copy the text content to the clipboard
      userProfileWrapper.remove(); // Remove the wrapper when double-clicked
    });
  }

  // Get or create the registeredDataContainer
  let registeredDataContainer = document.getElementById('registered-data');
  if (!registeredDataContainer) {
    registeredDataContainer = document.createElement('div');
    registeredDataContainer.id = 'registered-data';
    registeredDataContainer.style.display = 'flex';
    registeredDataContainer.style.flexDirection = 'column'; // Stack items vertically
    registeredDataContainer.style.alignItems = 'start'; // Align items to the start
    registeredDataContainer.style.padding = '2px';
    registeredDataContainer.style.marginTop = '2px';

    // Append the registeredDataContainer to the main wrapper once, not every time
    userProfileWrapper.appendChild(registeredDataContainer);
  }

  // Helper function to create a registered element with an optional trailing space
  function createRegisteredElement(content, color, appendSymbol = true, symbol = ' ') {
    const span = document.createElement('span');
    span.style.padding = '4px 4px'; // Add padding to the span
    span.textContent = content + (appendSymbol ? symbol : ''); // Add the symbol only if needed
    span.style.color = color; // Apply the color to the span
    return span;
  }

  // Helper function to create a registered row container
  function createRegisteredRow(contentElements) {
    const registeredRow = document.createElement('div');
    registeredRow.id = 'registered-item';
    registeredRow.style.display = 'flex';
    registeredRow.style.flexDirection = 'row'; // Stack items horizontally
    registeredRow.style.alignItems = 'center'; // Align items to the center
    registeredRow.style.padding = '2px';
    registeredRow.style.marginTop = '2px';

    contentElements.forEach(element => registeredRow.appendChild(element));
    return registeredRow;
  }

  // Create elements for id, login, rank, registeredDate and avatar, and group them into one row
  const idElement = createRegisteredElement(userData.id, 'lightblue');
  const loginElement = createRegisteredElement(userData.login, 'lightgreen');
  loginElement.style.cursor = 'pointer';
  loginElement.addEventListener('click', () => {
    const userProfileUrl = `https://klavogonki.ru/u/#/${userData.id}`;
    window.open(userProfileUrl, '_blank'); // Open profile in a new tab
  });
  const rankElement = createRegisteredElement(userData.rank, 'lightyellow');
  const registeredDateElement = createRegisteredElement(userData.registeredDate, 'orange', false);

  // Check if avatarTimestamp is not '00' before creating the avatar element
  let avatarElement = null;
  if (userData.avatarTimestamp !== '00') {
    avatarElement = document.createElement('img');
    avatarElement.src = `https://klavogonki.ru/storage/avatars/${userData.id}_big.png?updated=${userData.avatarTimestamp}`;
    avatarElement.alt = `👤`;
    avatarElement.style.height = '25px';
    avatarElement.style.marginLeft = '4px'; // Add margin to separate from the text
    avatarElement.style.transformOrigin = 'left left'; // Set the transform origin to the top-left corner
    avatarElement.style.setProperty('border-radius', '0', 'important');
    avatarElement.style.cursor = 'pointer';

    // Add transition for smooth effects
    avatarElement.style.transition = 'transform 0.15s ease-in, border-radius 0.15s ease-in';
    avatarElement.style.zIndex = '0';

    // Add mouseover event for scaling and border-radius
    avatarElement.addEventListener('mouseover', () => {
      avatarElement.style.transform = 'scale(5)'; // Scale to 5x size
      avatarElement.style.setProperty('border-radius', '4px', 'important'); // Apply border-radius 4px with !important
      avatarElement.style.zIndex = '10';
    });

    // Add mouseout event to reset scaling and border-radius
    avatarElement.addEventListener('mouseout', () => {
      avatarElement.style.transform = 'scale(1)'; // Reset to original size
      avatarElement.style.setProperty('border-radius', '0', 'important'); // Reset border-radius to 0 with !important
      avatarElement.style.zIndex = '0';
    });
  }

  // Combine all elements into one row
  const rowContent = [idElement, loginElement, rankElement, registeredDateElement];
  avatarElement && rowContent.push(avatarElement);

  registeredDataContainer.appendChild(createRegisteredRow(rowContent));

  // Update the user counter after adding a new profile container
  createUserCounter(userProfileWrapper, registeredDataContainer);

  // Automatically scroll to the bottom of the wrapper after appending new content
  userProfileWrapper.scrollTop = userProfileWrapper.scrollHeight;
}

/**
 * Creates or updates a counter inside the specified container to display the number of child elements
 * from the target container, or from the counter container if no target container is provided. 
 * The `.user-counter` element is excluded from the count.
 *
 * @param {HTMLElement} counterContainer - The container element where the counter will be created.
 * @param {HTMLElement} [targetContainer] - The container element whose child elements will be counted.
 * @throws {Error} - Throws an error if the provided counter container is not a valid HTMLElement.
 */
function createUserCounter(counterContainer, targetContainer = counterContainer) {
  // Check if the provided counterContainer is a valid HTML element
  if (!counterContainer || !(counterContainer instanceof HTMLElement)) {
    throw new Error("Invalid counter container element.");
  }

  // Find the existing counter or create a new one if it doesn't exist
  let counter = counterContainer.querySelector(".user-counter");
  if (!counter) {
    counter = document.createElement("div");
    counter.className = "user-counter"; // Assign a class name for styling

    // Apply custom styles to the counter element
    Object.assign(counter.style, {
      padding: "16px", // Add padding
      fontWeight: "bold", // Make the text bold
      fontFamily: "Consolas", // Set a monospace font for consistency
      fontSize: "16px", // Set the font size
      color: "lightsalmon", // Set the text color
    });

    // Append the new counter as the last child of the counterContainer
    counterContainer.appendChild(counter);
  }

  // Count the children of the targetContainer, excluding the .user-counter element
  const childCount = Array.from(targetContainer.children)
    .filter(child => !child.classList.contains("user-counter")).length;

  // Update the counter text
  counter.textContent = childCount;
}

let isRightClickHeld = false;
let timerId = null;

document.body.addEventListener('mousedown', (event) => {
  if (event.button === 2) { // Right mouse button
    // Get the user profile container if it exists
    const userProfileContainer = document.getElementById('user-profile-wrapper');

    // Start the timer for right mouse click hold (300ms)
    if (!timerId) {
      timerId = setTimeout(() => {
        isRightClickHeld = true; // Mark that the button has been held for (300ms)
        if (userProfileContainer) {
          userProfileContainer.remove(); // Remove the container after (300ms)
        } else {
          // Fetch saved user registration data from localStorage (or use an empty array if no data exists)
          const savedData = JSON.parse(localStorage.getItem('userRegistrationsData')) || [];
          savedData.forEach(createUserProfileContainer); // Create user profile containers from saved data
        }
      }, 300); // (300ms)
    }
  }
});

document.body.addEventListener('mouseup', (event) => {
  if (event.button === 2) { // Right mouse button
    clearTimeout(timerId); // Clear the timer when the button is released
    timerId = null; // Reset timerId
  }
});

// Prevent the context menu from showing if the button was held for (300ms)
document.body.addEventListener('contextmenu', (event) => {
  if (isRightClickHeld) {
    event.preventDefault();
    isRightClickHeld = false; // Reset the flag after the (300ms) hold
  }
});