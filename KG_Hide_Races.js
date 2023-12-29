// ==UserScript==
// @name           KG_Hide_Races
// @namespace      klavogonki
// @match          *://klavogonki.ru/gamelist/*
// @author         Patcher
// @description    Adds the ability to hide already created or all the games in the game list.
// @version        3.2.0
// @icon           https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// ==/UserScript==

// Constants for SVG icon properties
const toggleButtonIconSize = 16;
const toggleButtonStrokeWidth = 2;

// Function to encode SVG as base64
function encodeSVG(svg) {
    const base64 = btoa(svg);
    return `url("data:image/svg+xml;base64,${base64}")`;
}

// Eye Icon
const eyeIcon = encodeSVG(`
    <svg xmlns='http://www.w3.org/2000/svg' width='${toggleButtonIconSize}' height='${toggleButtonIconSize}' viewBox='0 0 24 24' fill='none' stroke='lightgray' stroke-width='${toggleButtonStrokeWidth}' stroke-linecap='round' stroke-linejoin='round'>
        <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/>
        <circle cx='12' cy='12' r='3'/>
    </svg>
`);

// Eye Off Icon
const eyeOffIcon = encodeSVG(`
    <svg xmlns='http://www.w3.org/2000/svg' width='${toggleButtonIconSize}' height='${toggleButtonIconSize}' viewBox='0 0 24 24' fill='none' stroke='lightgray' stroke-width='${toggleButtonStrokeWidth}' stroke-linecap='round' stroke-linejoin='round'>
        <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24'/>
        <line x1='1' y1='1' x2='23' y2='23'/>
    </svg>
`);

// Slash Icon
const slashIcon = encodeSVG(`
    <svg xmlns='http://www.w3.org/2000/svg' width='${toggleButtonIconSize}' height='${toggleButtonIconSize}' viewBox='0 0 24 24' fill='none' stroke='lightgray' stroke-width='${toggleButtonStrokeWidth}' stroke-linecap='round' stroke-linejoin='round'>
        <circle cx='12' cy='12' r='10'/>
        <line x1='4.93' y1='4.93' x2='19.07' y2='19.07'/>
    </svg>
`);

// Restore saved style from localStorage if available
const savedStyleElement = document.createElement('style');
savedStyleElement.id = 'hiddenGamesStyleElement';
savedStyleElement.innerHTML = localStorage.KG_HideGamesStyle || '';
document.body.appendChild(savedStyleElement);

// Create a button to toggle hiding games
const hideGamesButtonElement = document.createElement('span');
const hideGamesInput = document.createElement('input');
hideGamesInput.title = 'Hide Games';
hideGamesInput.type = 'button';

// Add some styles
hideGamesInput.style.color = 'transparent';
hideGamesInput.style.border = 'none';
hideGamesInput.style.padding = '0';
hideGamesInput.style.display = 'inline-flex';
hideGamesInput.style.height = '35px';
hideGamesInput.style.width = '35px';
hideGamesInput.style.setProperty('border-radius', '50%', 'important');
hideGamesInput.style.cursor = 'pointer';
hideGamesInput.style.backgroundColor = '#585a5d';
hideGamesInput.style.backgroundRepeat = 'no-repeat';
hideGamesInput.style.backgroundPosition = 'center center';
hideGamesInput.style.transition = 'background-color 0.3s';

// Add hover effect
hideGamesInput.addEventListener('mouseover', function () {
    hideGamesInput.style.backgroundColor = '#7a731f';
});

hideGamesInput.addEventListener('mouseout', function () {
    hideGamesInput.style.backgroundColor = '#585a5d';
});

// Get the localStorage value
const localStorageValue = localStorage.KG_HideGamesStyle;

// Assign className and icon based on localStorage values
switch (localStorageValue) {
    case '#gamelist-active{display:none;}':
        hideGamesInput.className = 'hidden-active-races';
        hideGamesInput.style.backgroundImage = eyeOffIcon;
        break;
    case '#gamelist{display:none;}':
        hideGamesInput.className = 'hidden-all-races';
        hideGamesInput.style.backgroundImage = slashIcon;
        break;
    case '#gamelist{display:unset;}':
        hideGamesInput.className = 'not-hidden-races';
        hideGamesInput.style.backgroundImage = eyeIcon;
}

hideGamesButtonElement.appendChild(hideGamesInput);
document.getElementById('delete').parentNode.insertBefore(hideGamesButtonElement, document.getElementById('delete').nextSibling);

hideGamesButtonElement.addEventListener('click', function () {
    const styleElement = document.getElementById('hiddenGamesStyleElement');

    if (styleElement) {
        const currentStyle = styleElement.innerHTML;

        if (currentStyle.includes('#gamelist{display:unset;}')) {
            localStorage.KG_HideGamesStyle = styleElement.innerHTML = '#gamelist-active{display:none;}';
            hideGamesInput.className = 'hidden-active-races';
            hideGamesInput.style.backgroundImage = eyeOffIcon;
        } else if (currentStyle.includes('#gamelist-active{display:none;}')) {
            localStorage.KG_HideGamesStyle = styleElement.innerHTML = '#gamelist{display:none;}';
            hideGamesInput.className = 'hidden-all-races';
            hideGamesInput.style.backgroundImage = slashIcon;
        } else if (currentStyle.includes('#gamelist{display:none;}')) {
            localStorage.KG_HideGamesStyle = styleElement.innerHTML = '#gamelist{display:unset;}';
            hideGamesInput.className = 'not-hidden-races';
            hideGamesInput.style.backgroundImage = eyeIcon;
        }
    }
});