// ==UserScript==
// @name          KG_Recent_Games
// @namespace     klavogonki
// @version       1.0.2
// @description   Fast game creation buttons on main and gamelist page with theme switcher
// @match         *://klavogonki.ru/*
// @author        Patcher
// @icon          https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// ==/UserScript==

class RecentGamesManager {
  constructor() {
    this.maxGameCount = 5;
    this.gameData = [];
    this.hoverTimeout = null;
    this.isHovered = false;
    this.isDragging = false;
    this.draggedElement = null;
    this.dragOffset = { x: 0, y: 0 };

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

    // Load theme from localStorage, default to light
    this.currentTheme = localStorage.getItem('recent_games_theme') || 'light';

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
    this.applyTheme(); // Apply initial theme
  }

  // --- Theme Management Methods ---

  applyTheme() {
    const container = document.getElementById('recent-games-container');
    if (container) {
      container.classList.remove('light-theme', 'dark-theme');
      container.classList.add(`${this.currentTheme}-theme`);
    }
  }

  updateThemeToggle() {
    const svg = document.querySelector('#recent-games-container .theme-toggle svg');
    if (svg) {
      if (this.currentTheme === 'light') {
        svg.innerHTML = `<circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#FFB300'); // Material yellow for sun (light)
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.classList.add('feather-sun');
        svg.classList.remove('feather-moon');
      } else {
        svg.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#90CAF9'); // Material blue for moon (dark)
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.classList.add('feather-moon');
        svg.classList.remove('feather-sun');
      }
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('recent_games_theme', this.currentTheme);
    this.applyTheme();
    this.updateThemeToggle();
  }

  createThemeToggle() {
    const toggleButton = this.createElement('div', {
      className: 'theme-toggle',
      title: 'Switch theme'
    });

    const svg = this.createElement('svg', {
      viewBox: '0 0 24 24',
      width: '16',
      height: '16'
    });

    toggleButton.appendChild(svg);

    toggleButton.addEventListener('click', () => {
      this.toggleTheme();
    });

    this.updateThemeToggle(); // Set initial icon

    return toggleButton;
  }

  // --- Existing Methods with Modifications ---

  createGameElement(game, id) {
    const li = this.createElement('li', {
      className: `recent-game${game.pin ? ' pin-game' : ''}`,
      id: `recent-game-${id}`
    });

    const handle = this.createElement('div', {
      className: 'recent-game-handle',
      innerHTML: `<svg viewBox="0 0 24 24" width="12" height="12">
        <path d="M9 3h2v2H9V3zm4 0h2v2h-2V3zM9 7h2v2H9V7zm4 0h2v2h-2V7zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z" fill="currentColor"/>
      </svg>`
    });

    const buttons = this.createElement('div', {
      className: 'recent-game-buttons'
    });

    const pinButton = this.createElement('div', {
      className: 'recent-game-pin',
      title: 'Зафиксировать',
      innerHTML: `<svg viewBox="0 0 24 24" width="10" height="10">
        <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" fill="currentColor"/>
      </svg>`
    });
    pinButton.addEventListener('click', () => this.pinGame(id));

    const deleteButton = this.createElement('div', {
      className: 'recent-game-delete',
      title: 'Удалить',
      innerHTML: `<svg viewBox="0 0 24 24" width="10" height="10">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" fill="currentColor"/>
      </svg>`
    });
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

    if (game.pin) {
      this.addDragFunctionality(li, handle, id);
    }

    return li;
  }

  createControls() {
    const controlsContainer = this.createElement('div', {
      className: 'recent-games-controls'
    });

    const options = this.createElement('span', {
      id: 'recent-games-options',
      textContent: 'История: '
    });

    const decreaseBtn = this.createElement('span', {
      id: 'recent-games-count-dec',
      innerHTML: `<svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" fill="currentColor"/>
      </svg>`
    });

    const countDisplay = this.createElement('span', {
      id: 'recent-games-count',
      textContent: this.maxGameCount.toString()
    });

    const increaseBtn = this.createElement('span', {
      id: 'recent-games-count-inc',
      innerHTML: `<svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" fill="currentColor"/>
      </svg>`
    });

    decreaseBtn.addEventListener('click', () => this.changeGameCount(-1));
    increaseBtn.addEventListener('click', () => this.changeGameCount(1));

    options.appendChild(decreaseBtn);
    options.appendChild(countDisplay);
    options.appendChild(increaseBtn);

    controlsContainer.appendChild(options);
    controlsContainer.appendChild(this.createThemeToggle());

    return controlsContainer;
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

    const controls = this.createControls();
    container.appendChild(controls);

    container.addEventListener('mouseenter', () => {
      this.showContainer();
    });

    container.addEventListener('mouseleave', () => {
      this.hideContainerWithDelay();
    });

    document.body.appendChild(container);
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
        top: '100px',
        width: 'auto',
        minWidth: '200px',
        maxWidth: '250px',
        maxHeight: 'calc(100vh - 200px)',
        backgroundColor: '#fff', // Material Light: White
        border: '1px solid #e0e0e0', // Material Light: Light gray border
        borderLeft: 'none',
        borderRadius: '0 8px 8px 0',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        zIndex: '9999',
        padding: '10px 0',
        transition: 'left 0.3s ease-in-out',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
        color: '#212121' // Material Light: Dark gray text
      },
      '#recent-games-container.visible': {
        left: '0'
      },
      '#recent-games-container.dark-theme': {
        backgroundColor: '#181A1B', // Material Deep Dark
        borderColor: '#23272A', // Material Deep Dark border
        color: '#e0e0e0'
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
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#fafafa', // Material Light: Card
        transition: 'all 0.2s ease'
      },
      '.dark-theme .recent-game': {
        borderColor: '#23272A',
        backgroundColor: '#23272A', // Material Deep Dark card
        color: '#e0e0e0'
      },
      '.recent-game.pin-game': {
        border: '2px solid #4CAF50',
        backgroundColor: '#f0f8f0'
      },
      '.dark-theme .recent-game.pin-game': {
        border: '2px solid #43A047',
        backgroundColor: '#1e2b22'
      },
      '.recent-game:hover': {
        borderColor: '#bdbdbd',
        backgroundColor: '#f4f4f4',
        transform: 'translateX(2px)'
      },
      '.dark-theme .recent-game:hover': {
        borderColor: '#616161',
        backgroundColor: '#23272A',
        color: '#fff'
      },
      '.recent-game.dragging': {
        opacity: '0.7',
        transform: 'rotate(2deg)',
        zIndex: '10000'
      },
      '.recent-game a': {
        display: 'block',
        padding: '8px 12px',
        textDecoration: 'none',
        color: 'inherit'
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
        opacity: '0.5'
      },
      '.recent-game-handle svg': {
        width: '100%',
        height: '100%'
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
      '.dark-theme .recent-game-pin': {
        borderColor: '#616161' // Material Dark: Medium gray
      },
      '.dark-theme .recent-game-delete': {
        borderColor: '#616161' // Material Dark: Medium gray
      },
      '.recent-game-pin:hover': {
        backgroundColor: 'rgba(76, 175, 80, 0.2)'
      },
      '.recent-game-delete:hover': {
        backgroundColor: 'rgba(244, 67, 54, 0.2)'
      },
      '.recent-game-pin svg, .recent-game-delete svg': {
        width: '10px',
        height: '10px',
        opacity: '0.6'
      },
      '.recent-game-pin:hover svg, .recent-game-delete:hover svg': {
        opacity: '1'
      },
      '.pin-game .recent-game-pin': {
        display: 'none'
      },
      '.recent-games-controls': {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 10px',
        marginTop: '10px'
      },
      '#recent-games-options': {
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        fontSize: '13px',
        gap: '6px',
        color: '#444',
        userSelect: 'none'
      },
      '#recent-games-count': {
        margin: '0 6px',
        fontWeight: 'bold',
        fontSize: '14px',
        minWidth: '18px',
        textAlign: 'center',
        color: '#222'
      },
      '#recent-games-count-inc, #recent-games-count-dec': {
        cursor: 'pointer',
        fontSize: '16px',
        padding: '2px 6px',
        borderRadius: '3px',
        transition: 'background 0.15s',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      '#recent-games-count-inc:hover, #recent-games-count-dec:hover': {
        background: '#e0e0e0'
      },
      '.dark-theme #recent-games-count-inc:hover, .dark-theme #recent-games-count-dec:hover': {
        background: '#616161' // Material Dark: Medium gray hover
      },
      '.theme-toggle': {
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px'
      },
      '.theme-toggle svg': {
        width: '24px',
        height: '24px',
        display: 'block',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        fill: 'none',
        transition: 'stroke 0.2s, fill 0.2s',
      },
      '.dark-theme .theme-toggle svg': {
        stroke: '#FFD600', // Sun/Moon icon accent for dark
      },
      '.theme-toggle svg.feather-sun': {
        stroke: '#FFB300', // Sun accent for light
      },
      '.theme-toggle svg.feather-moon': {
        stroke: '#90CAF9', // Moon accent for light
      },
      '.dark-theme .theme-toggle svg.feather-sun': {
        stroke: '#FFD600', // Sun accent for dark
      },
      '.dark-theme .theme-toggle svg.feather-moon': {
        stroke: '#90CAF9', // Moon accent for dark
      }
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

  // --- Remaining Unchanged Methods ---

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

  addDragFunctionality(element, handle, _id) {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.draggedElement = element;

      const rect = element.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      element.classList.add('dragging');

      document.addEventListener('mousemove', this.handleDragMove.bind(this));
      document.addEventListener('mouseup', this.handleDragEnd.bind(this));
    });
  }

  handleDragMove(e) {
    if (!this.isDragging || !this.draggedElement) return;

    e.preventDefault();

    const gamesList = document.getElementById('recent-games');
    const pinnedGames = Array.from(gamesList.querySelectorAll('.pin-game:not(.dragging)'));

    let insertAfter = null;

    for (const pinnedGame of pinnedGames) {
      const rect = pinnedGame.getBoundingClientRect();
      const middle = rect.top + rect.height / 2;

      if (e.clientY < middle) {
        break;
      }
      insertAfter = pinnedGame;
    }

    if (insertAfter) {
      insertAfter.parentNode.insertBefore(this.draggedElement, insertAfter.nextSibling);
    } else {
      const firstPinned = gamesList.querySelector('.pin-game:not(.dragging)');
      if (firstPinned) {
        gamesList.insertBefore(this.draggedElement, firstPinned);
      }
    }
  }

  handleDragEnd(_e) {
    if (!this.isDragging || !this.draggedElement) return;

    this.isDragging = false;
    this.draggedElement.classList.remove('dragging');

    this.updateGameOrderFromDOM();

    this.draggedElement = null;

    document.removeEventListener('mousemove', this.handleDragMove.bind(this));
    document.removeEventListener('mouseup', this.handleDragEnd.bind(this));
  }

  updateGameOrderFromDOM() {
    const gameElements = Array.from(document.querySelectorAll('#recent-games .recent-game'));
    const newGameData = [];

    gameElements.forEach(element => {
      const id = parseInt(element.id.replace('recent-game-', ''), 10);
      const game = this.gameData.find(g => g.id === id);
      if (game) {
        newGameData.push(game);
      }
    });

    this.gameData = newGameData;
    this.assignGameIds();
    this.saveGameData();
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
    }, 250);
  }

  refreshContainer() {
    const gamesList = document.getElementById('recent-games');
    if (gamesList) {
      this.populateGamesList(gamesList);
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

  handlePageSpecificLogic() {
    const { href } = location;

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

    if (/https?:\/\/klavogonki\.ru\/gamelist\//.test(href)) {
      const controls = this.createControls();

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
    window.recentGamesManager = this;
  }
}

function initializeRecentGames() {
  if (!document.getElementById('KTS_RecentGames')) {
    new RecentGamesManager();

    const marker = document.createElement('div');
    marker.id = 'KTS_RecentGames';
    marker.style.display = 'none';
    document.body.appendChild(marker);
  }
}

initializeRecentGames();