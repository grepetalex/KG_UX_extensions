// ==UserScript==
// @name          KG_Recent_Games
// @namespace     klavogonki
// @version       1.0.0
// @description   Fast game creation buttons on main and gamelist page
// @match         *://klavogonki.ru/*
// @author        Patcher
// @icon          https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// ==/UserScript==

class RecentGamesManager {
  constructor() {
    this.maxGameCount = 5;
    this.gameData = [];
    this.sortableInstance = null;
    this.hoverTimeout = null;
    this.isHovered = false;
    
    this.gameTypes = {
      normal: 'Oбычный',
      abra: 'Абракадабра',
      referats: 'Яндекс.Рефераты',
      noerror: 'Безошибочный',
      marathon: 'Марафон',
      chars: 'Буквы',
      digits: 'Цифры',
      sprint: 'Спринт',
      voc: 'По словарю'
    };

    this.visibilities = {
      normal: 'открытый',
      private: 'дружеский',
      practice: 'одиночный'
    };

    this.ranks = [
      "новички", "любители", "таксисты", "профи", 
      "гонщики", "маньяки", "супермены", "кибергонщики", "экстракиберы"
    ];

    this.ranksMap = {
      'новичков': 1, 'любителей': 2, 'таксистов': 3, 'профи': 4,
      'гонщиков': 5, 'маньяков': 6, 'суперменов': 7, 
      'кибергонщиков': 8, 'экстракиберов': 9
    };

    this.init();
  }

  init() {
    this.loadSettings();
    this.loadGameData();
    this.injectStyles();
    this.createHoverArea();
    this.createContainer();
    this.handlePageSpecificLogic();
    this.exposeGlobalFunctions();
  }

  loadSettings() {
    try {
      const savedLimit = localStorage.getItem('recent_games_limit');
      if (savedLimit) {
        this.maxGameCount = Math.max(0, parseInt(savedLimit, 10));
      }
    } catch (error) {
      console.warn('Could not load settings from localStorage:', error);
    }
  }

  loadGameData() {
    try {
      const savedGames = localStorage.getItem('recent_games');
      if (savedGames) {
        this.gameData = JSON.parse(savedGames);
        this.migrateOldGameData();
        this.assignGameIds();
      }
    } catch (error) {
      console.warn('Could not load game data from localStorage:', error);
      this.gameData = [];
    }
  }

  migrateOldGameData() {
    this.gameData = this.gameData.map(game => {
      if (game.params.qual === 'on' || game.params.qual === '') {
        game.params.qual = game.params.qual === 'on' ? 1 : 0;
      }
      return game;
    });
  }

  assignGameIds() {
    this.gameData = this.gameData.map((game, index) => ({ ...game, id: index }));
  }

  saveGameData() {
    try {
      localStorage.setItem('recent_games', JSON.stringify(this.gameData));
    } catch (error) {
      console.warn('Could not save game data to localStorage:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('recent_games_limit', this.maxGameCount.toString());
    } catch (error) {
      console.warn('Could not save settings to localStorage:', error);
    }
  }

  createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) {
      element.className = options.className;
    }
    
    if (options.id) {
      element.id = options.id;
    }
    
    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }
    
    if (options.textContent) {
      element.textContent = options.textContent;
    }
    
    if (options.href) {
      element.href = options.href;
    }
    
    if (options.title) {
      element.title = options.title;
    }
    
    if (options.src) {
      element.src = options.src;
    }
    
    if (options.style) {
      Object.assign(element.style, options.style);
    }
    
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    return element;
  }

  generateGameName(game) {
    const gameType = this.gameTypes[game.params.gametype];
    const { vocName, timeout, type: visibility, level_from, level_to, qual } = game.params;
    
    const nameSpan = this.createElement('span', {
      className: `recent-game-name gametype-${game.params.gametype}`,
      textContent: vocName === '' ? gameType : `«${vocName}»`
    });
    
    const descSpan = this.createElement('span', {
      className: 'recent-game-description'
    });
    
    const qualSpan = this.createElement('span', {
      className: 'recent-game-qual',
      textContent: qual ? ' (к)' : ''
    });
    
    let levelText = '';
    if (level_from !== 1 || level_to !== 9) {
      const levelFromName = this.ranks[level_from - 1];
      const levelToName = this.ranks[level_to - 1];
      levelText = ` ${levelFromName} - ${levelToName}`;
    }
    
    const levelsSpan = this.createElement('span', {
      className: 'recent-game-levels',
      textContent: levelText
    });
    
    descSpan.textContent = `${this.visibilities[visibility]}, ${timeout} сек.`;
    descSpan.appendChild(qualSpan);
    if (levelText) {
      descSpan.appendChild(levelsSpan);
    }
    
    const container = this.createElement('div');
    container.appendChild(nameSpan);
    container.appendChild(descSpan);
    
    return container.innerHTML;
  }

  generateGameLink(game) {
    const { gametype, vocId, type, level_from, level_to, timeout, qual } = game.params;
    
    const params = new URLSearchParams({
      gametype,
      type,
      level_from: level_from.toString(),
      level_to: level_to.toString(),
      timeout: timeout.toString(),
      submit: '1'
    });
    
    if (vocId !== '') {
      params.set('voc', vocId);
    }
    
    if (qual) {
      params.set('qual', '1');
    }
    
    return `${location.protocol}//klavogonki.ru/create/?${params.toString()}`;
  }

  createGameElement(game, id) {
    const li = this.createElement('li', {
      className: `recent-game${game.pin ? ' pin-game' : ''}`,
      id: `recent-game-${id}`
    });

    const handle = this.createElement('div', {
      className: 'recent-game-handle'
    });
    handle.appendChild(this.createElement('img', { src: '/img/blank.gif' }));

    const buttons = this.createElement('div', {
      className: 'recent-game-buttons'
    });

    const pinButton = this.createElement('div', {
      className: 'recent-game-pin',
      title: 'Зафиксировать'
    });
    pinButton.appendChild(this.createElement('img', { src: '/img/pin.png' }));
    pinButton.addEventListener('click', () => this.pinGame(id));

    const deleteButton = this.createElement('div', {
      className: 'recent-game-delete',
      title: 'Удалить'
    });
    deleteButton.appendChild(this.createElement('img', { src: '/img/cross_small.png' }));
    deleteButton.addEventListener('click', () => this.deleteGame(id));

    buttons.appendChild(pinButton);
    buttons.appendChild(deleteButton);

    const link = this.createElement('a', {
      href: this.generateGameLink(game),
      innerHTML: this.generateGameName(game)
    });

    li.appendChild(handle);
    li.appendChild(buttons);
    li.appendChild(link);

    return li;
  }

  getPinnedGameCount() {
    return this.gameData.filter(game => game.pin).length;
  }

  createHoverArea() {
    const hoverArea = this.createElement('div', {
      id: 'recent-games-hover-area'
    });

    hoverArea.addEventListener('mouseenter', () => {
      this.showContainer();
    });

    hoverArea.addEventListener('mouseleave', () => {
      this.hideContainerWithDelay();
    });

    document.body.appendChild(hoverArea);
  }

  createContainer() {
    const container = this.createElement('div', {
      id: 'recent-games-container'
    });

    const gamesList = this.createElement('ul', {
      id: 'recent-games'
    });

    this.populateGamesList(gamesList);
    container.appendChild(gamesList);

    // Add counter controls at the bottom of the panel
    const controls = this.createCounterControls();
    container.appendChild(controls);

    container.addEventListener('mouseenter', () => {
      this.showContainer();
    });

    container.addEventListener('mouseleave', () => {
      this.hideContainerWithDelay();
    });

    document.body.appendChild(container);
    this.initSortable();
  }

  populateGamesList(gamesList) {
    gamesList.innerHTML = '';
    const pinnedCount = this.getPinnedGameCount();
    const maxGamesToShow = Math.min(this.gameData.length, this.maxGameCount + pinnedCount);

    for (let i = 0; i < maxGamesToShow; i++) {
      const gameElement = this.createGameElement(this.gameData[i], i);
      gamesList.appendChild(gameElement);
    }
  }

  showContainer() {
    this.isHovered = true;
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    const container = document.getElementById('recent-games-container');
    if (container) {
      container.classList.add('visible');
    }
  }

  hideContainerWithDelay() {
    this.isHovered = false;
    
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    
    this.hoverTimeout = setTimeout(() => {
      if (!this.isHovered) {
        const container = document.getElementById('recent-games-container');
        if (container) {
          container.classList.remove('visible');
        }
      }
    }, 2000);
  }

  refreshContainer() {
    const gamesList = document.getElementById('recent-games');
    if (gamesList) {
      this.populateGamesList(gamesList);
      this.initSortable();
    }
  }

  findGameIndex(id) {
    return this.gameData.findIndex(game => game.id == id);
  }

  deleteGame(id) {
    const index = this.findGameIndex(id);
    if (index === -1) return null;

    const deletedGame = this.gameData.splice(index, 1)[0];
    this.assignGameIds();
    this.saveGameData();
    this.refreshContainer();

    return deletedGame;
  }

  pinGame(id) {
    const gameIndex = this.findGameIndex(id);
    if (gameIndex === -1) return;

    // Find insertion point (after all pinned games)
    let insertIndex = 0;
    for (let i = 0; i < this.gameData.length; i++) {
      if (!this.gameData[i].pin) {
        insertIndex = i;
        break;
      }
    }

    this.gameData[gameIndex].pin = 1;
    
    if (gameIndex !== insertIndex) {
      const gameObject = this.gameData.splice(gameIndex, 1)[0];
      this.gameData.splice(insertIndex, 0, gameObject);
    }

    this.assignGameIds();
    this.saveGameData();
    this.refreshContainer();
  }

  saveCurrentGameParams() {
    const gameDesc = document.getElementById('gamedesc');
    if (!gameDesc) {
      throw new Error('#gamedesc element not found.');
    }

    const span = gameDesc.querySelector('span');
    if (!span) {
      throw new Error('#gamedesc span element not found.');
    }

    const descText = gameDesc.textContent;
    if (/соревнование/.test(descText) || !this.maxGameCount) {
      return false;
    }

    const gameParams = this.parseGameParams(span, descText);
    const gameParamsString = JSON.stringify(gameParams);

    // Remove existing game if found (unless it's pinned)
    for (let i = 0; i < this.gameData.length; i++) {
      if (JSON.stringify(this.gameData[i].params) === gameParamsString) {
        if (this.gameData[i].pin) {
          return;
        } else {
          this.gameData.splice(i, 1);
          break;
        }
      }
    }

    // Maintain max game count
    const pinnedCount = this.getPinnedGameCount();
    while (this.gameData.length >= this.maxGameCount + pinnedCount) {
      this.gameData.pop();
    }

    const newGame = {
      params: gameParams,
      id: -1,
      pin: 0
    };

    this.gameData.splice(pinnedCount, 0, newGame);
    this.assignGameIds();
    this.saveGameData();
  }

  parseGameParams(span, descText) {
    const gameType = span.className.split('-').pop();
    const vocName = gameType === 'voc' ? span.textContent.replace(/[«»]/g, '') : '';
    
    let vocId = '';
    if (gameType === 'voc') {
      const vocLink = span.querySelector('a');
      if (vocLink) {
        const match = vocLink.href.match(/vocs\/(\d+)/);
        vocId = match ? parseInt(match[1], 10) : '';
      }
    }

    let type = 'normal';
    if (/одиночный/.test(descText)) {
      type = 'practice';
    } else if (/друзьями/.test(descText)) {
      type = 'private';
    }

    let levelFrom = 1;
    let levelTo = 9;
    const levelMatches = descText.match(/для (\S+)–(\S+),/);
    if (levelMatches) {
      levelFrom = this.ranksMap[levelMatches[1]] || 1;
      levelTo = this.ranksMap[levelMatches[2]] || 9;
    }

    const timeoutMatches = descText.match(/таймаут\s(\d+)\s(сек|мин)/);
    const timeout = timeoutMatches 
      ? (timeoutMatches[2] === 'сек' ? parseInt(timeoutMatches[1], 10) : parseInt(timeoutMatches[1], 10) * 60)
      : 60;

    const qualification = /квалификация/.test(descText) ? 1 : 0;

    return {
      gametype: gameType,
      vocName,
      vocId,
      type,
      level_from: levelFrom,
      level_to: levelTo,
      timeout,
      qual: qualification,
      premium_abra: 0
    };
  }

  createCounterControls() {
    const container = this.createElement('span', {
      id: 'recent-games-options',
      textContent: 'История: '
    });

    const decreaseBtn = this.createElement('span', {
      id: 'recent-games-count-dec',
      innerHTML: '&#9668;'
    });

    const countDisplay = this.createElement('span', {
      id: 'recent-games-count',
      textContent: this.maxGameCount.toString()
    });

    const increaseBtn = this.createElement('span', {
      id: 'recent-games-count-inc',
      innerHTML: '&#9658;'
    });

    decreaseBtn.addEventListener('click', () => this.changeGameCount(-1));
    increaseBtn.addEventListener('click', () => this.changeGameCount(1));

    container.appendChild(decreaseBtn);
    container.appendChild(countDisplay);
    container.appendChild(increaseBtn);

    return container;
  }

  changeGameCount(delta) {
    if (delta < 0 && this.maxGameCount > 0) {
      this.maxGameCount--;
    } else if (delta > 0) {
      this.maxGameCount++;
    }

    const countDisplay = document.getElementById('recent-games-count');
    if (countDisplay) {
      countDisplay.textContent = this.maxGameCount.toString();
    }

    this.saveSettings();
    this.refreshContainer();
  }

  initSortable() {
    if (typeof Sortable !== 'undefined' && Sortable.create) {
      try {
        if (this.sortableInstance) {
          this.sortableInstance.destroy();
        }
        
        this.sortableInstance = Sortable.create('recent-games', {
          direction: 'vertical',
          only: 'pin-game',
          handle: 'recent-game-handle',
          onChange: (element) => this.handleSortableChange(element)
        });
      } catch (error) {
        console.warn('Could not initialize sortable:', error);
      }
    }
  }

  handleSortableChange(element) {
    const idMatch = element.id.match(/\d+$/);
    if (!idMatch) return;

    const id = parseInt(idMatch[0], 10);
    const oldIndex = this.findGameIndex(id);
    const newIndex = Array.from(document.querySelectorAll('#recent-games .recent-game')).indexOf(element);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const movedGame = this.gameData.splice(oldIndex, 1)[0];
      this.gameData.splice(newIndex, 0, movedGame);
      this.assignGameIds();
      this.saveGameData();
    }
  }

  injectStyles() {
    const styles = {
      '#recent-games-hover-area': {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '50px',
        height: '100vh',
        zIndex: '9998',
        backgroundColor: 'transparent',
        pointerEvents: 'auto'
      },
      '#recent-games-container': {
        position: 'fixed',
        left: '-250px',
        top: '20px',
        width: 'auto',
        minWidth: '200px',
        maxWidth: '300px',
        maxHeight: 'calc(100vh - 40px)',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderLeft: 'none',
        borderRadius: '0 8px 8px 0',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        zIndex: '9999',
        padding: '10px 0',
        transition: 'left 0.3s ease-in-out',
        overflowY: 'auto',
        overflowX: 'hidden'
      },
      '#recent-games-container.visible': {
        left: '0'
      },
      '#recent-games': {
        margin: '0',
        padding: '0',
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      },
      '.recent-game': {
        position: 'relative',
        margin: '0 10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9',
        transition: 'all 0.2s ease'
      },
      '.recent-game.pin-game': {
        border: '2px solid #4CAF50',
        backgroundColor: '#f0f8f0'
      },
      '.recent-game:hover': {
        borderColor: '#666',
        backgroundColor: '#f4f4f4',
        transform: 'translateX(2px)'
      },
      '.recent-game.pin-game:hover': {
        borderColor: '#45a049'
      },
      '.recent-game a': {
        display: 'block',
        padding: '8px 12px',
        textDecoration: 'none',
        color: '#333'
      },
      '.recent-game-name': {
        display: 'block',
        fontWeight: 'bold',
        fontSize: '12px',
        marginBottom: '2px'
      },
      '.recent-game-description': {
        display: 'block',
        fontSize: '10px',
        color: '#666',
        lineHeight: '1.2'
      },
      '.recent-game-qual': {
        color: '#f00',
        fontWeight: 'bold'
      },
      '.recent-game-levels': {
        display: 'block',
        fontSize: '9px',
        color: '#888',
        marginTop: '1px'
      },
      '.recent-game-handle': {
        display: 'none',
        position: 'absolute',
        left: '2px',
        top: '2px',
        width: '12px',
        height: '12px',
        cursor: 'move',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23666\'%3E%3Cpath d=\'M9 3h2v2H9V3zm4 0h2v2h-2V3zM9 7h2v2H9V7zm4 0h2v2h-2V7zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z\'/%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        opacity: '0.5'
      },
      '.pin-game .recent-game-handle': {
        display: 'block'
      },
      '.recent-game-buttons': {
        position: 'absolute',
        right: '4px',
        top: '4px',
        display: 'flex',
        gap: '2px',
        opacity: '0',
        transition: 'opacity 0.2s ease'
      },
      '.recent-game:hover .recent-game-buttons': {
        opacity: '1'
      },
      '.recent-game-pin, .recent-game-delete': {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease'
      },
      '.recent-game-pin:hover': {
        backgroundColor: 'rgba(76, 175, 80, 0.2)'
      },
      '.recent-game-delete:hover': {
        backgroundColor: 'rgba(244, 67, 54, 0.2)'
      },
      '.recent-game-pin img, .recent-game-delete img': {
        width: '10px',
        height: '10px',
        opacity: '0.6'
      },
      '.recent-game-pin:hover img, .recent-game-delete:hover img': {
        opacity: '1'
      },
      '.pin-game .recent-game-pin': {
        display: 'none'
      },
      '#recent-games-options': {
        fontFamily: 'sans-serif',
        margin: '10px 0 0 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '13px',
        gap: '6px',
        color: '#444',
        userSelect: 'none',
      },
      '#recent-games-count': {
        margin: '0 6px',
        fontWeight: 'bold',
        fontSize: '14px',
        minWidth: '18px',
        textAlign: 'center',
        color: '#222',
      },
      '#recent-games-count-inc, #recent-games-count-dec': {
        cursor: 'pointer',
        fontSize: '16px',
        padding: '2px 6px',
        borderRadius: '3px',
        transition: 'background 0.15s',
        userSelect: 'none',
      },
      '#recent-games-count-inc:hover, #recent-games-count-dec:hover': {
        background: '#e0e0e0',
      },
    };

    const styleElement = this.createElement('style');
    let cssText = '';

    Object.entries(styles).forEach(([selector, rules]) => {
      cssText += `${selector} { `;
      Object.entries(rules).forEach(([property, value]) => {
        cssText += `${property.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}; `;
      });
      cssText += '} ';
    });

    styleElement.textContent = cssText;
    document.head.appendChild(styleElement);
  }

  handlePageSpecificLogic() {
    const { href } = location;

    // Game page - save game parameters
    if (/https?:\/\/klavogonki\.ru\/g\/\?gmid=/.test(href)) {
      const gameLoading = document.getElementById('gameloading');
      if (!gameLoading) {
        throw new Error('#gameloading element not found.');
      }

      if (gameLoading.style.display !== 'none') {
        const observer = new MutationObserver(() => {
          observer.disconnect();
          this.saveCurrentGameParams();
        });
        observer.observe(gameLoading, { attributes: true });
      } else {
        this.saveCurrentGameParams();
      }
    }

    // Game list page - show counter controls in original location
    if (/https?:\/\/klavogonki\.ru\/gamelist\//.test(href)) {
      const controls = this.createCounterControls();
      
      const gamelistCreate = document.querySelector('.gamelist-create');
      if (gamelistCreate) {
        const form = gamelistCreate.querySelector('form');
        if (form) {
          form.appendChild(controls);
        }
      }
    }
  }

  exposeGlobalFunctions() {
    // Expose functions globally for debugging
    window.recentGamesManager = this;
  }
}

// Initialize immediately without waiting for DOM
function initializeRecentGames() {
  if (!document.getElementById('KTS_RecentGames')) {
    new RecentGamesManager();
    
    // Mark as initialized
    const marker = document.createElement('div');
    marker.id = 'KTS_RecentGames';
    marker.style.display = 'none';
    document.body.appendChild(marker);
  }
}

// Initialize immediately
initializeRecentGames();