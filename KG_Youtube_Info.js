// ==UserScript==
// @name         KG_Youtube_Info
// @namespace    https://klavogonki.ru/
// @version      2025-04-10
// @description  Set additional information about YouTube videos in the chat as Youtube channel name and video title
// @author       Patcher
// @match        *://klavogonki.ru/gamelist/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const emojis = {
    youtube: '▶️',
    channel: '📺',
    title: '📹',
    type: '🎬️'
  };

  // Extracts video information from a URL
  function getVideoInfo(url) {
    const youtubeMatch = url.match(/(?:shorts\/|live\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      const videoType = url.includes('shorts/') ? 'Shorts' :
        url.includes('live/') ? 'Live' :
          url.includes('watch?v=') ? 'Watch' :
            url.includes('youtu.be/') ? 'Share' : 'YouTube';
      return { youtubeMatch: true, videoId, videoType };
    }

    return { youtubeMatch: false };
  }

  // Fetches YouTube metadata using the oEmbed endpoint
  async function fetchYouTubeMetadata(videoId) {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    try {
      const response = await fetch(oembedUrl);
      const data = await response.json();
      const title = data.title || 'Title not found';
      const channel = data.author_name || 'Channel not found';
      return { title, channel };
    } catch (error) {
      console.error('Error fetching YouTube metadata:', error);
      return { title: 'Error', channel: 'Error' };
    }
  }

  // Function to get chat elements
  function getChatElements() {
    const messagesContainer = document.querySelector('.messages-content');
    if (!messagesContainer) return null;
    const messages = messagesContainer.querySelectorAll('p');
    return { messagesContainer, messages };
  }

  // Process YouTube links in a given container
  async function processYouTubeLinks(container) {
    const links = container.querySelectorAll('a:not(.processed-youtube-link)');
    for (const link of links) {
      const videoInfo = getVideoInfo(link.href);
      if (!videoInfo) continue;

      link.classList.add('processed-youtube-link');
      let newContent = `${emojis.youtube} YouTube ${emojis.type} [${videoInfo.videoType}]`;
      
      if (videoInfo.youtubeMatch) {
        const metadata = await fetchYouTubeMetadata(videoInfo.videoId);
        newContent += ` ${emojis.channel} ${metadata.channel} - ${emojis.title} ${metadata.title}`;
      } else {
        newContent += ` ${link.innerHTML}`;
      }
      
      link.innerHTML = newContent;
    }
  }

  // Observe new messages and process YouTube links
  function observeMessages() {
    const chatElements = getChatElements();
    if (!chatElements) return;

    const { messagesContainer } = chatElements;
    const observer = new MutationObserver(() => {
      processYouTubeLinks(messagesContainer);
    });

    observer.observe(messagesContainer, { childList: true, subtree: true });
  }

  // Initial processing of all links
  function initialize() {
    const chatElements = getChatElements();
    if (!chatElements) return;

    const { messagesContainer } = chatElements;
    processYouTubeLinks(messagesContainer);
    observeMessages();
  }

  // Start the script
  initialize();
})();
