// ==UserScript==
// @name         KG_Daily_Progress
// @namespace    klavogonki
// @version      2.0.0
// @description  Visual progress bar for "Daily Task"
// @author       AkaSomeone
// @match        *://klavogonki.ru/*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// ==/UserScript==

const initializationTimeout = 300; // Timeout duration in milliseconds

let observer;

const setupObserver = () => {
  window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
  const target = document.querySelector('.daily-task');
  if (!target) {
    console.log('DailyProgress: Task panel not found, cannot continue.');
    return false;
  }
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'original-title') {
        updateProgress();
      }
    });
  });
  observer.observe(target, { attributes: true });
  return true;
};

const areElementsAvailable = () => {
  const gauge = document.querySelector('.daily-task');
  return !!gauge;
};

const waitAndInitialize = () => {
  // Use setTimeout with the specified timeout duration
  setTimeout(() => {
    if (areElementsAvailable()) {
      updateProgress();
      setupObserver();
    } else {
      console.log(`DailyProgress: Task panel not found after ${initializationTimeout}ms, initialization aborted.`);
    }
  }, initializationTimeout);
};

const getOrCreateProgressBar = (gauge) => {
  let pb = document.getElementById('daily-task-progress-bar');

  if (pb) return pb;

  pb = document.createElement('div');
  pb.id = 'daily-task-progress-bar';
  pb.style.position = 'absolute';
  pb.style.top = 0;
  pb.style.backgroundColor = 'cornsilk';
  pb.style.height = '44px';
  pb.style.width = 0;
  pb.style.opacity = 0.2;

  gauge.appendChild(pb);

  return pb;
};

const getDailyTaskGauge = () => {
  const elements = document.getElementsByClassName('daily-task');
  if (!elements.length) throw new Error('Element not found.');
  return elements[0];
};

const getProgress = (gauge) => {
  const customProps = gauge.getAttributeNames();
  if (!customProps.includes('original-title')) throw new Error('Attribute \'original-title\' not found.');

  const title = gauge.getAttribute('original-title');
  if (!title) {
    return null;
  }

  if (title === 'Completed') {
    return { done: 1, total: 1 };
  }

  const match = /(\d{1,2})\D+(\d{1,2})/.exec(title);
  if (!match || match.length !== 3) {
    console.log(`DailyProgress: Unexpected title format. Title: ${title}`);
    return null; // or handle the unexpected format accordingly
  }

  const done = parseInt(match[1]);
  const total = parseInt(match[2]);
  if (isNaN(done) || isNaN(total)) {
    console.log(`DailyProgress: Race count not found in title. Title: ${title}`);
    return null; // or handle the missing race count accordingly
  }

  return { done, total };
};

const updateProgress = () => {
  try {
    const gauge = getDailyTaskGauge();
    const progress = getProgress(gauge);
    if (progress === null || !progress.done || progress.done === progress.total) {
      return;
    }
    const pb = getOrCreateProgressBar(gauge);
    pb.style.width = `${(100 * progress.done / progress.total)}%`;
  } catch (error) {
    console.log(`DailyProgress: Error updating. ${error.message}`);
  }
};

// Start initialization
waitAndInitialize();