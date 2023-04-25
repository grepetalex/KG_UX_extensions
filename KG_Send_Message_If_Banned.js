// ==UserScript==
// @name         KG_Send_Message_If_Blocked
// @namespace    klavogonki
// @version      0.1
// @description  Chell Off Banned
// @author       Patcher
// @match        https://klavogonki.ru/gamelist/
// @grant        none
// ==/UserScript==

(function () {

  // Get references to the chat text and send elements
  let chatText, chatSend;

  // Set interval to wait for the chat text and send elements to become available
  let accessibilityIntervalTries = 0;
  const maxAccessibilityIntervalTries = 100;
  const accessibilityInterval = setInterval(() => {
    chatText = document.querySelector('.chat .text');
    chatSend = document.querySelector('.chat .send');

    // If the chat text and send elements are found and not disabled, remove the interval and enable input
    if (chatText && chatSend && !chatText.disabled && !chatSend.disabled) {
      clearInterval(accessibilityInterval);
      chatText.disabled = false;
      chatSend.disabled = false;

      // Initialize stored message from localStorage
      const storedMessage = localStorage.getItem('messageToSend') || '';

      // Add keydown event listener to the chat text element
      if (chatText) {
        chatText.addEventListener('keydown', function (e) {
          // If the key pressed is the Enter key (keyCode 13)
          if (e.keyCode === 13) {
            // Store the value of the chat text element in localStorage under the key 'messageToSend'
            localStorage.setItem('messageToSend', chatText.value);

            // Reload the page to trigger the check for localStorage value
            location.reload();
          }
        });
      }

      // Set interval to continuously check the latest message and send the stored message until they match
      let sendIntervalTries = 0;
      const maxSendIntervalTries = 100;
      const sendInterval = setInterval(() => {
        // Get the latest message from the chat
        const latestMessage = Array.from(document.querySelectorAll('.chat p'))
          .map(node => Array.from(node.childNodes)
            .filter(child => child.nodeType === Node.TEXT_NODE || (child.nodeName === 'SPAN' && !child.classList.contains('time') && !child.classList.contains('username')))
            .map(textNode => textNode.textContent)
            .join('')
          )
          .pop();

        // If the latest message matches the stored message, clear the interval
        if (latestMessage === storedMessage) {
          clearInterval(sendInterval);
        } else {
          // Otherwise, fill the chat text element with the stored message and click the chat send element to send the message
          chatText.value = storedMessage;
          chatSend.click();
          console.log(`Sent message: ${storedMessage}`);

          // Make them again accessible if they are disabled again
          if (chatText.disabled && chatSend.disabled) {
            chatText.disabled = false;
            chatSend.disabled = false;
          }

          sendIntervalTries++;
          if (sendIntervalTries >= maxSendIntervalTries) {
            clearInterval(sendInterval);
            clearInterval(accessibilityInterval);
            console.log(`Max tries exceeded (${maxSendIntervalTries}), clearing interval.`);
          }
        }
      }, 100); // Message match interval
    } else {
      accessibilityIntervalTries++;
      if (accessibilityIntervalTries >= maxAccessibilityIntervalTries) {
        clearInterval(accessibilityInterval);
        console.log(`Max tries exceeded (${maxAccessibilityIntervalTries}), clearing interval.`);
      }
    }
  }, 100); // Chat accessibility interval

})();