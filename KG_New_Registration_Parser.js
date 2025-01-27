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
  const currentDate = new Date().toISOString().split('T')[0];

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

function createUserProfileContainer(userData) {
  // Check if the container already exists
  let container = document.getElementById('user-profile-container');

  // If the container doesn't exist, create it
  if (!container) {
    container = document.createElement('div');
    container.id = 'user-profile-container';

    // Apply styles
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'start';
    container.style.width = '700px';
    container.style.maxHeight = '50vh';
    container.style.padding = '20px';
    container.style.backgroundColor = 'rgb(27, 27, 27)';
    container.style.left = '50%';
    container.style.position = 'absolute';
    container.style.top = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.zIndex = '910';

    // Apply vertical scrolling and hide horizontal scrolling
    container.style.overflowY = 'auto';
    container.style.overflowX = 'hidden';

    // Apply border-radius with !important using setProperty
    container.style.setProperty('border-radius', '8px', 'important');

    // Append the container to the document body
    document.body.appendChild(container);

    // Add the double-click event listener to remove the container
    container.addEventListener('dblclick', function () {
      container.remove(); // Remove the container when double-clicked
    });
  }

  // Create a container for all the elements with inline-flex
  const elementsContainer = document.createElement('div');
  elementsContainer.style.display = 'flex';
  elementsContainer.style.flexDirection = 'row'; // Stack elements horizontally
  elementsContainer.style.alignItems = 'center'; // Align elements to the start
  elementsContainer.style.padding = '2px';
  elementsContainer.style.marginTop = '2px';

  // Helper function to create a span element with small padding and color
  function createSpanElement(content, color) {
    const span = document.createElement('span');
    span.style.padding = '2px'; // Small padding around the span
    span.style.marginBottom = '4px'; // Optional: Space between elements vertically
    span.style.marginRight = '4px'; // Optinal: Space between elements horizontally
    span.textContent = content;
    span.style.color = color; // Apply the color to the span
    return span;
  }

  // Create and append the ID span element
  elementsContainer.appendChild(createSpanElement(userData.id, 'lightblue'));

  // Create and append the login span element (non-clickable)
  const loginSpan = createSpanElement(userData.login, 'lightgreen');
  loginSpan.style.cursor = 'pointer'; // Make it look clickable
  loginSpan.addEventListener('click', () => {
    const userProfileUrl = `https://klavogonki.ru/u/#/${userData.id}`;
    window.open(userProfileUrl, '_blank'); // Open profile in a new tab
  });
  elementsContainer.appendChild(loginSpan); // Append login span after adding event listener

  // Create and append the rank span element
  elementsContainer.appendChild(createSpanElement(userData.rank, 'lightyellow'));

  // Create and append the registered date span element
  elementsContainer.appendChild(createSpanElement(userData.registeredDate, 'orange'));

  // Check if avatarTimestamp is not '00' before creating the avatar element
  if (userData.avatarTimestamp !== '00') {
    // Create the avatar element directly inside the container
    const avatarElement = document.createElement('img');
    avatarElement.src = `https://klavogonki.ru/storage/avatars/${userData.id}_big.png?updated=${userData.avatarTimestamp}`;
    avatarElement.alt = `👤`;
    avatarElement.style.height = '25px';
    avatarElement.style.setProperty('border-radius', '0', 'important');
    avatarElement.style.padding = '2px'; // Padding around the image
    avatarElement.style.marginBottom = '4px'; // Optional: Space below the avatar
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

    // Append the avatar element to the container
    elementsContainer.appendChild(avatarElement);
  }

  // Append the elementsContainer to the main container
  container.appendChild(elementsContainer);

  // Automatically scroll to the bottom of the container after appending new content
  container.scrollTop = container.scrollHeight;

  // Call createUserCounter after everything is created, passing the container directly
  createUserCounter(container);
}

/**
 * Creates a new counter inside the container to display the number of child elements.
 * Removes the previous counter and creates a new one at the end of the container every time.
 * 
 * @param {HTMLElement} container - The container element where the counter will be created.
 * @throws {Error} - Throws an error if the provided container is not a valid HTMLElement.
 */
function createUserCounter(container) {
  // Check if the provided container is a valid HTML element
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error("Invalid container element.");
  }

  // Find the existing counter and remove it if it exists
  let existingCounter = container.querySelector(".user-counter");
  if (existingCounter) {
    existingCounter.remove(); // Remove the previous counter
  }

  // Create a new counter element
  const counter = document.createElement("div");
  counter.className = "user-counter"; // Assign a class name for styling

  // Apply custom styles to the counter element
  Object.assign(counter.style, {
    padding: "16px", // Add padding
    fontWeight: "bold", // Make the text bold
    fontFamily: "Consolas", // Set a monospace font for consistency
    fontSize: "16px", // Set the font size
    color: "lightsalmon", // Set the text color
  });

  // Count the children excluding the counter itself
  const childCount = Array.from(container.children).filter(child => !child.classList.contains("user-counter")).length;

  // Update the counter text
  counter.textContent = childCount;

  // Append the new counter as the last child of the container
  container.appendChild(counter);
}

let isRightClickHeld = false;
let timerId = null;

document.body.addEventListener('mousedown', (event) => {
  if (event.button === 2) { // Right mouse button
    // Check if #user-profile-container exists
    if (document.getElementById('user-profile-container')) {
      return; // Exit if the container already exists
    }
    // Start the timer on right mouse button press
    timerId = setTimeout(() => {
      isRightClickHeld = true; // Mark that the button has been held for 3 seconds
      // Fetch saved user registration data from localStorage (or use an empty array if no data exists)
      const savedData = JSON.parse(localStorage.getItem('userRegistrationsData')) || [];
      savedData.forEach(createUserProfileContainer); // Create user profile containers from saved data
    }, 300);
  }
});

document.body.addEventListener('mouseup', (event) => {
  if (event.button === 2) { // Right mouse button
    clearTimeout(timerId); // Clear the timer when the button is released
  }
});

// Prevent the context menu from showing if the button was held for 3 seconds
document.body.addEventListener('contextmenu', (event) => {
  if (isRightClickHeld) {
    event.preventDefault();
    isRightClickHeld = false; // Reset the flag
  }
});