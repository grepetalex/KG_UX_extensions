// Base URL for Klavogonki.
const baseUrl = 'https://klavogonki.ru';

// Message property keys from the API.
const MESSAGE_KEYS = {
  ID: 'id',
  USER_ID: 'user_id',
  RESPONDENT_ID: 'respondent_id',
  TEXT: 'text',
  DATE: 'date'
};

// User property keys from the API.
const USER_KEYS = {
  ID: 'id',
  LOGIN: 'login',
  AVATAR: 'avatar' // May be an object (with sec/usec) or a URL string.
};

// UI style constants.
const mainBackgroundColor = '#1b1b1b';
const containerBorderRadius = '0.4em';
const margin = '0.6em';
const padding = '1em';
const headerAvatarSize = '5em';
const messageAvatarSize = '3em';
const avatarBorderRadius = '0.2em';
const respondentUsernameColor = 'coral';
const meUsernameColor = 'cadetblue';
const respondentMessageColor = 'antiquewhite';
const meMessageColor = 'burlywood';

/**
 * Clears all children from a container element.
 * @param {HTMLElement} container - The container element to clear.
 */
function clearContainer(container) {
  container.replaceChildren();
}

// Injects CSS styles dynamically into the document head.
function injectStyles() {
  const styleElement = document.createElement('style');
  styleElement.classList.add('dynamic-styles');
  styleElement.innerHTML = `
    .messages-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      z-index: 1000;
      background-color: rgba(0, 0, 0, 0.5);
    }
    .messages-container {
      overflow-y: auto;
      overflow-x: hidden;
      height: 100vh;
      width: 600px;
    }
    .chat-container {
      padding: ${padding};
      border-radius: ${containerBorderRadius} !important;
      margin: ${margin};
      background-color: ${mainBackgroundColor};
      cursor: pointer;
    }
    .chat-container__opened {
      background-color: ${mainBackgroundColor};
    }
    .chat-container__back-button {
      border-radius: ${containerBorderRadius} !important;
      padding: ${padding};
      background-color: steelblue;
      color: lightsteelblue;
      border: none;
      cursor: pointer;
      font-size: 1em;
      margin: ${margin};
    }
    .chat-header {
      display: flex;
      align-items: center;
      margin-bottom: ${margin};
    }
    .chat-header__username {
      font-size: 1.2em;
      font-weight: bold;
      color: ${respondentUsernameColor} !important;
    }
    .chat-header__avatar {
      width: ${headerAvatarSize};
      height: ${headerAvatarSize};
      border-radius: ${avatarBorderRadius} !important;
      margin-right: ${margin};
    }
    .chat-message {
      display: flex;
      align-items: flex-start;
      margin: ${margin} 0;
    }
    .chat-message__respondent .chat-message__text {
      color: ${respondentMessageColor} !important;
    }
    .chat-message__me .chat-message__text {
      color: ${meMessageColor} !important; 
    }
    .chat-message__avatar {
      width: ${messageAvatarSize};
      height: ${messageAvatarSize}; 
      border-radius: ${avatarBorderRadius} !important; 
      margin-right: ${margin};
    }
    .chat-message__username {
      font-size: 1em;
      font-weight: bold;
      color: orange !important;
      margin-right: ${margin};
      line-height: 1.4;
    } 
    /* Logged-in user's username style */
      .chat-message__me-username {
      color: ${meUsernameColor} !important; /* Light blue color for 'me' */
    }

    /* Respondent's username style */
      .chat-message__respondent-username {
      color: ${respondentUsernameColor} !important; /* Goldenrod color for respondent */
    }
    .chat-message__text {
      font-size: 1em;
      line-height: 1.4;
    }
    .chat-container__user-info {
      color: ${respondentUsernameColor} !important;
      font-size: 1.2em;
      font-weight: bold;
    }
    .chat-container__message-text {
      margin: ${margin} 0;
      font-size: 1em;
      color: ${respondentMessageColor} !important;
    }
    .chat-container__timestamp {
      font-size: 0.8em;
      color: #888;
    }
    .chat-container__me {
      text-align: right;
      margin: ${margin};
    }
    .chat-container__respondent {
      text-align: left;
      margin: ${margin};
    }
  `;
  document.head.appendChild(styleElement);
}

/**
 * Converts seconds and microseconds into a combined timestamp string.
 * @param {number} sec - The seconds component.
 * @param {number} usec - The microseconds component.
 * @returns {string} The combined timestamp.
 */
function convertToUpdatedTimestamp(sec, usec) {
  return sec.toString() + Math.floor(usec / 1000).toString();
}

/**
 * Returns the avatar URL for the logged-in user.
 * Retrieves the avatar src from the element ".userpanel .user-block .name img".
 * @returns {string|undefined} The logged-in user's avatar URL, or undefined if not found.
 */
function getMyAvatarUrl() {
  return document.querySelector('.userpanel .user-block .name img')?.src;
}

/**
 * Returns the avatar URL for a respondent.
 * If the user's avatar is an object containing sec and usec, the URL is constructed;
 * otherwise, the string value or a placeholder is returned.
 *
 * @param {Object} user - The user object.
 * @returns {string} The respondent's avatar URL.
 */
function getRespondentAvatarUrl(user) {
  const avatar = user[USER_KEYS.AVATAR];
  if (avatar && typeof avatar === 'object' && 'sec' in avatar && 'usec' in avatar) {
    return `${baseUrl}/storage/avatars/${user[USER_KEYS.ID]}_big.png?updated=${convertToUpdatedTimestamp(avatar.sec, avatar.usec)}`;
  }
  return avatar || 'https://via.placeholder.com/50';
}

/**
 * Retrieves messages and user details from the API.
 * @returns {Promise<Object>} The JSON data from the API.
 */
async function fetchMessages() {
  try {
    const response = await fetch(`${baseUrl}/api/profile/get-messages-contacts`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
}

/**
 * Renders chat conversation previews in the main container.
 * @param {Array} messages - The list of message objects.
 * @param {Object} users - The users mapped by their IDs.
 */
function displayChats(messages, users) {
  let wrapper = document.querySelector('.messages-wrapper') ||
    Object.assign(document.createElement('div'), { className: 'messages-wrapper' });
  if (!wrapper.parentNode) document.body.appendChild(wrapper);

  // Add click event to remove the wrapper
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) { // Ensure we only remove the wrapper if it's directly clicked, not on child elements
      wrapper.remove();
    }
  });

  let mainContainer = document.querySelector('.messages-container');
  if (!mainContainer) {
    mainContainer = document.createElement('div');
    mainContainer.classList.add('messages-container');
    wrapper.appendChild(mainContainer);
  }
  clearContainer(mainContainer);

  messages.forEach(message => {
    const respondentId = message[MESSAGE_KEYS.RESPONDENT_ID];
    const user = users[respondentId];
    const chatContainer = createChatContainer(message, user);
    chatContainer.addEventListener('click', async () => {
      clearContainer(mainContainer);
      await displayDialog(message, user, mainContainer);
    });
    mainContainer.appendChild(chatContainer);
  });
}

/**
 * Creates a container element for a single chat preview.
 * @param {Object} message - A message object.
 * @param {Object} user - The respondent's user object.
 * @returns {HTMLElement} The chat container element.
 */
function createChatContainer(message, user) {
  const chatContainer = document.createElement('div');
  chatContainer.classList.add('chat-container');

  const userInfo = document.createElement('div');
  userInfo.classList.add('chat-header'); // Wrap in a header container

  // Avatar before username
  const avatar = document.createElement('img');
  avatar.classList.add('chat-message__avatar');
  avatar.src = getRespondentAvatarUrl(user);
  userInfo.appendChild(avatar);

  const username = document.createElement('div');
  username.textContent = user[USER_KEYS.LOGIN];
  username.classList.add('chat-container__user-info');
  userInfo.appendChild(username);

  chatContainer.appendChild(userInfo);

  const messageText = document.createElement('div');
  messageText.textContent = message[MESSAGE_KEYS.TEXT];
  messageText.classList.add('chat-container__message-text');
  chatContainer.appendChild(messageText);

  const date = new Date(message[MESSAGE_KEYS.DATE].sec * 1000);
  const timestamp = document.createElement('div');
  timestamp.textContent = date.toLocaleString();
  timestamp.classList.add('chat-container__timestamp');
  chatContainer.appendChild(timestamp);

  return chatContainer;
}

/**
 * Displays the full message dialog between the logged-in user and the selected respondent.
 * @param {Object} message - The initial message object.
 * @param {Object} user - The respondent's user object.
 * @param {HTMLElement} mainContainer - The container where the dialog will be rendered.
 */
async function displayDialog(message, user, mainContainer) {
  try {
    const respondentId = message[MESSAGE_KEYS.RESPONDENT_ID];
    const dialogResponse = await fetch(`${baseUrl}/api/profile/get-messages-dialog?respondentId=${respondentId}`);
    if (!dialogResponse.ok) throw new Error(`HTTP error! Status: ${dialogResponse.status}`);
    const dialogData = await dialogResponse.json();

    const loggedInUserName = document.querySelector('.userpanel .user-block .user-dropdown .name')?.textContent.trim() || 'Me';
    const loggedInUserAvatar = getMyAvatarUrl();

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.classList.add('chat-container__back-button');
    backButton.addEventListener('click', () => {
      clearContainer(mainContainer);
      InitializeMessenger();
    });
    mainContainer.appendChild(backButton);

    const chatContainer = document.createElement('div');
    chatContainer.classList.add('chat-container', 'chat-container__opened');
    mainContainer.appendChild(chatContainer);

    // Chat header with respondent's avatar first, then name.
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('chat-header');

    const headerAvatar = document.createElement('img');
    headerAvatar.classList.add('chat-header__avatar');
    headerAvatar.src = getRespondentAvatarUrl(user);
    headerContainer.appendChild(headerAvatar);

    const headerUsername = document.createElement('div');
    headerUsername.textContent = user[USER_KEYS.LOGIN];
    headerUsername.classList.add('chat-header__username');
    headerContainer.appendChild(headerUsername);

    chatContainer.appendChild(headerContainer);

    dialogData.messages.forEach(msg => {
      const messageContainer = document.createElement('div');
      messageContainer.classList.add('chat-message');

      const messageAvatar = document.createElement('img');
      messageAvatar.classList.add('chat-message__avatar');
      const messageTextContainer = document.createElement('div');
      messageTextContainer.classList.add('chat-message__text');

      const usernameContainer = document.createElement('div');
      usernameContainer.classList.add('chat-message__username');

      if (msg.folder === 'out') {
        messageContainer.classList.add('chat-message__me');
        messageAvatar.src = loggedInUserAvatar;
        usernameContainer.textContent = loggedInUserName;
        usernameContainer.classList.add('chat-message__me-username'); // Class for the logged-in user
        messageTextContainer.textContent = `${msg[MESSAGE_KEYS.TEXT]}`;
      } else {
        messageContainer.classList.add('chat-message__respondent');
        messageAvatar.src = getRespondentAvatarUrl(user);
        usernameContainer.textContent = user[USER_KEYS.LOGIN];
        usernameContainer.classList.add('chat-message__respondent-username'); // Class for the respondent
        messageTextContainer.textContent = `${msg[MESSAGE_KEYS.TEXT]}`;
      }

      // Append username and message to the container
      messageContainer.appendChild(messageAvatar);
      messageContainer.appendChild(usernameContainer);
      messageContainer.appendChild(messageTextContainer);

      chatContainer.appendChild(messageContainer);
    });
  } catch (error) {
    console.error('Error fetching dialog:', error);
  }
}

// Fetches messages from the API and displays the chat previews.
async function InitializeMessenger() {
  const data = await fetchMessages();
  if (data) displayChats(data.messages, data.users);
}

// Initialization: Inject styles and fetch/display messages on page load.
injectStyles();
InitializeMessenger();
