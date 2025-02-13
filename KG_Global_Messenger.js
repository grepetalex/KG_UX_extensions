// ==UserScript==
// @name         KG_Profile_Messenger 
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Try just to open it at last easier than ever before.
// @author       Patcher
// @match        http*://klavogonki.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
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
  const containerFixedWidth = '40vw';
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
      height: 80vh;
      overflow-y: auto;
      scrollbar-width: none;
      width: ${containerFixedWidth};
      min-width: 400px;
    }
    .messages-container-inner {
      height: 80vh; 
      overflow-y: auto;
      scrollbar-width: none;
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
      display: flex;
      flex-direction: column;
    }
    .chat-container__opened .chat-header {
      padding: ${padding};
      border-radius: ${containerBorderRadius} !important;
      background-color: ${mainBackgroundColor};
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.1) !important;
      border: 1px solid #deb8871a !important;
      position: sticky;
      top: ${padding};
    }
    .chat-container__back-button {
      width: 100%;
      border-radius: ${containerBorderRadius} !important;
      border: 1px solid #313131 !important;
      padding: ${padding} 3em;
      margin-left: ${margin};
      background-color: #111;
      color: burlywood;
      cursor: pointer;
      font-size: 1em;
    }
    .chat-header {
      display: flex;
      align-items: center;
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
    .chat-message__username-timestamp {
      display: flex;
      align-items: center; 
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
      margin-right: ${margin};
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
    /* Floating send field */
    .chat-container__send-field {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      width: 100% !important;
      padding: ${margin} !important;
      z-index: 1010; /* Ensures the send field stays on top */
    }

    .chat-container__textarea {
      width: 100% !important;
      padding: ${padding} !important;
      background-color: #111 !important;
      border: 1px solid #313131 !important;
      border-radius: ${containerBorderRadius} !important;
      color: ${meMessageColor} !important;
      font-size: 1em !important;
      resize: none !important;
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
    return avatar;
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
   * Scrolls the chat container to the bottom.
   *
   * This function selects the element with the class 'chat-container__opened'
   * and sets its scrollTop property to its scrollHeight, effectively scrolling
   * the container to the bottom.
   */
  function scrollToBottom() {
    const chatContainer = document.querySelector('.messages-container-inner');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  /**
   * Sends a message to a respondent and adds it to the chat UI.
   *
   * @param {string} text - The message text to be sent.
   * @param {string} respondentId - The ID of the respondent to whom the message is sent.
   * @returns {Promise<void>} - Sends the message and renders it on the UI.
   */
  async function sendMessage(text, respondentId) {
    const csrfToken = document.cookie.split('; ').find(cookie => cookie.startsWith('XSRF-TOKEN='))?.split('=')[1];
    if (!csrfToken) return console.error('CSRF token not found.');

    try {
      const response = await fetch(`${baseUrl}/api/profile/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ text, respondentId }),
      });

      const data = await response.json();
      if (response.ok && data.ok === 1) {
        // Use createMessageElement to render the new message on the UI
        const loggedInUserName = document.querySelector('.userpanel .user-block .user-dropdown .name')?.textContent.trim() || 'Me';
        const loggedInUserAvatar = getMyAvatarUrl();

        const messageElement = createMessageElement(data.message, { [USER_KEYS.ID]: respondentId, [USER_KEYS.LOGIN]: 'Respondent' }, loggedInUserName, loggedInUserAvatar);

        // Assuming you have a container where new messages are added (e.g., 'messages-container-inner')
        const chatContainer = document.querySelector('.messages-container-inner');
        chatContainer.appendChild(messageElement);

        // Scroll to the bottom of the messages container after sending a message
        scrollToBottom();
      } else {
        console.error('Error sending message:', data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
        const mainContainer = document.querySelector('.messages-container');
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

    const date = new Date(message[MESSAGE_KEYS.DATE].sec * 1000);
    const timestamp = document.createElement('div');
    timestamp.textContent = date.toLocaleString();
    timestamp.classList.add('chat-container__timestamp');
    userInfo.appendChild(timestamp);

    chatContainer.appendChild(userInfo);

    const messageText = document.createElement('div');
    messageText.textContent = message[MESSAGE_KEYS.TEXT];
    messageText.classList.add('chat-container__message-text');
    chatContainer.appendChild(messageText);

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

      const chatContainer = document.createElement('div');
      chatContainer.classList.add('chat-container', 'chat-container__opened');
      mainContainer.appendChild(chatContainer);

      // Chat header with respondent's avatar first, then name, and back button.
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

      headerContainer.appendChild(backButton);
      chatContainer.appendChild(headerContainer);

      // Container for messages
      const messagesContainer = document.createElement('div');
      messagesContainer.classList.add('messages-container-inner');
      chatContainer.appendChild(messagesContainer);

      dialogData.messages.forEach(msg => {
        const messageElement = createMessageElement(msg, user, loggedInUserName, loggedInUserAvatar);
        messagesContainer.appendChild(messageElement);
      });

      // Create send field (textarea for typing messages)
      createSendField(chatContainer, respondentId, user, loggedInUserName, loggedInUserAvatar);
      // Scroll to the bottom of the messages container after messages are created
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching dialog:', error);
    }
  }

  /**
   * Creates a message element for the chat dialog.
   * @param {Object} msg - The message object.
   * @param {Object} user - The respondent's user object.
   * @param {string} loggedInUserName - The logged-in user's name.
   * @param {string} loggedInUserAvatar - The logged-in user's avatar URL.
   * @returns {HTMLElement} The message element.
   */
  function createMessageElement(msg, user, loggedInUserName, loggedInUserAvatar) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('chat-message');

    const messageAvatar = document.createElement('img');
    messageAvatar.classList.add('chat-message__avatar');

    const messageContentContainer = document.createElement('div');
    messageContentContainer.classList.add('chat-message__content');

    const usernameAndTimestampContainer = document.createElement('div');
    usernameAndTimestampContainer.classList.add('chat-message__username-timestamp');

    const usernameContainer = document.createElement('div');
    usernameContainer.classList.add('chat-message__username');

    const timestampContainer = document.createElement('div');
    timestampContainer.classList.add('chat-container__timestamp');

    const messageTextContainer = document.createElement('div');
    messageTextContainer.classList.add('chat-message__text');

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

    const date = new Date(msg[MESSAGE_KEYS.DATE].sec * 1000);
    timestampContainer.textContent = date.toLocaleString();

    // Append username and timestamp to their container
    usernameAndTimestampContainer.appendChild(usernameContainer);
    usernameAndTimestampContainer.appendChild(timestampContainer);

    // Append username-timestamp container and message text to the content container
    messageContentContainer.appendChild(usernameAndTimestampContainer);
    messageContentContainer.appendChild(messageTextContainer);

    // Append avatar and content container to the main message container
    messageContainer.appendChild(messageAvatar);
    messageContainer.appendChild(messageContentContainer);

    return messageContainer;
  }

  /**
   * Creates a send field with a textarea at the bottom of the chat container.
   * The message is sent when Shift + Enter is pressed.
   * @param {HTMLElement} chatContainer - The chat container where the field will be added.
   * @param {string} respondentId - The ID of the respondent to send the message to.
   * @param {Object} user - The respondent's user object.
   * @param {string} loggedInUserName - The logged-in user's name.
   * @param {string} loggedInUserAvatar - The logged-in user's avatar URL.
   */
  function createSendField(chatContainer, respondentId, user, loggedInUserName, loggedInUserAvatar) {
    const sendFieldContainer = document.createElement('div');
    sendFieldContainer.classList.add('chat-container__send-field');

    // Create textarea
    const textArea = document.createElement('textarea');
    textArea.classList.add('chat-container__textarea');

    sendFieldContainer.appendChild(textArea);
    chatContainer.appendChild(sendFieldContainer);
    textArea.focus();

    // Add event listener for Shift + Enter
    textArea.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) return; // Allow new line with Shift + Enter
        e.preventDefault(); // Prevent default behavior (new line)
        const text = textArea.value.trim();
        // Clear the textarea immediately before sending the message
        textArea.value = '';
        if (text) {
          // Call sendMessage function here, for example:
          sendMessage(text, respondentId).then(message => {
            if (message) {
              // Display new message
              const messageElement = createMessageElement(message, user, loggedInUserName, loggedInUserAvatar);
              chatContainer.appendChild(messageElement);
              textArea.value = ''; // Clear textarea
            }
          });
        }
      }
    });
  }

  injectStyles();

  // Fetches messages from the API and displays the chat previews.
  async function InitializeMessenger() {
    const data = await fetchMessages();
    if (data) displayChats(data.messages, data.users);
  }

  let isMouseDown = false; // To track if LMB is pressed
  let initialY = 0; // To store the initial vertical position of the cursor

  // Add event listener for mouse down (LMB press)
  document.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Check if it's the left mouse button (0 is LMB)
      isMouseDown = true;
      initialY = e.clientY; // Store initial Y position of the cursor
    }
  });

  // Add event listener for mouse move to track the cursor's movement
  document.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
      const distanceMoved = e.clientY - initialY; // Calculate distance moved from initial position
      if (distanceMoved > 300) { // If moved more than 300px downward
        // Trigger the desired action
        InitializeMessenger();
        isMouseDown = false; // Reset to prevent repeated triggers
      }
    }
  });

  // Add event listener for mouse up to reset mouse state
  document.addEventListener('mouseup', () => {
    isMouseDown = false; // Reset the mouse down state
  });
})();