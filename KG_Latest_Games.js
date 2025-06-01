// ==UserScript==
// @name          KG_Latest_Games
// @namespace     klavogonki
// @version       1.0.8
// @description   Fast game creation buttons on all the pages
// @match         *://klavogonki.ru/*
// @author        Patcher
// @icon          https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// ==/UserScript==

// Color Configuration
const THEME_COLORS = {
  light: {
    // Main colors
    '--rg-bg-primary': 'hsl(0, 0%, 100%)',
    '--rg-bg-secondary': 'hsl(0, 0%, 98%)',
    '--rg-bg-card': 'hsl(0, 0%, 98%)',
    '--rg-bg-card-pinned': 'hsl(120, 50%, 96%)',
    '--rg-bg-hover': 'hsl(0, 0%, 96%)',

    // Border colors
    '--rg-border-primary': 'hsl(0, 0%, 88%)',
    '--rg-border-hover': 'hsl(0, 0%, 74%)',
    '--rg-border-pinned': 'hsl(122, 39%, 49%)',

    // Text colors
    '--rg-text-primary': 'hsl(0, 0%, 15%)',
    '--rg-text-secondary': 'hsl(0, 0%, 40%)',
    '--rg-text-tertiary': 'hsl(0, 0%, 55%)',
    '--rg-text-options': 'hsl(0, 0%, 30%)',
    '--rg-text-count': 'hsl(0, 0%, 15%)',

    // Game type colors
    '--rg-gametype-voc': 'hsl(215, 75%, 50%)',
    '--rg-gametype-normal': 'hsl(130, 50%, 30%)',
    '--rg-gametype-abra': 'hsl(215, 20%, 40%)',
    '--rg-gametype-referats': 'hsl(80, 55%, 30%)',
    '--rg-gametype-noerror': 'hsl(200, 45%, 35%)',
    '--rg-gametype-marathon': 'hsl(340, 65%, 45%)',
    '--rg-gametype-chars': 'hsl(35, 100%, 30%)',
    '--rg-gametype-digits': 'hsl(0, 0%, 50%)',
    '--rg-gametype-sprint': 'hsl(5, 40%, 40%)',

    // Icon colors
    '--rg-icon-primary': 'currentColor',
    '--rg-icon-pin': 'hsl(122, 39%, 49%)',
    '--rg-icon-pin-fill': 'hsl(122, 39%, 49%)',
    '--rg-icon-delete': 'hsl(4, 90%, 58%)',
    '--rg-icon-theme-sun': 'hsl(48, 100%, 41%)',
    '--rg-icon-theme-moon': 'hsl(207, 89%, 76%)',

    // Interactive colors
    '--rg-hover-pin': 'hsla(122, 39%, 49%, 0.2)',
    '--rg-hover-delete': 'hsla(4, 90%, 58%, 0.2)',
    '--rg-hover-control': 'hsl(0, 0%, 92%)',
    '--rg-hover-control-btn': 'hsl(213, 77%, 96%)',

    // Pinned card backgrounds and borders by gameType
    '--rg-bg-card-pinned-voc': 'hsl(215, 80%, 95%)',
    '--rg-border-pinned-voc': 'hsl(215, 80%, 80%)',

    '--rg-bg-card-pinned-normal': 'hsl(130, 50%, 90%)',
    '--rg-border-pinned-normal': 'hsl(130, 50%, 70%)',

    '--rg-bg-card-pinned-abra': 'hsl(215, 20%, 90%)',
    '--rg-border-pinned-abra': 'hsl(215, 20%, 70%)',

    '--rg-bg-card-pinned-referats': 'hsl(80, 55%, 90%)',
    '--rg-border-pinned-referats': 'hsl(80, 55%, 70%)',

    '--rg-bg-card-pinned-noerror': 'hsl(200, 45%, 90%)',
    '--rg-border-pinned-noerror': 'hsl(200, 45%, 70%)',

    '--rg-bg-card-pinned-marathon': 'hsl(340, 65%, 90%)',
    '--rg-border-pinned-marathon': 'hsl(340, 65%, 70%)',

    '--rg-bg-card-pinned-chars': 'hsl(35, 100%, 90%)',
    '--rg-border-pinned-chars': 'hsl(35, 100%, 70%)',

    '--rg-bg-card-pinned-digits': 'hsl(0, 0%, 90%)',
    '--rg-border-pinned-digits': 'hsl(0, 0%, 70%)',

    '--rg-bg-card-pinned-sprint': 'hsl(5, 40%, 90%)',
    '--rg-border-pinned-sprint': 'hsl(5, 40%, 70%)',
  },
  dark: {
    // Main colors
    '--rg-bg-primary': 'hsl(210, 10%, 11%)',
    '--rg-bg-secondary': 'hsl(220, 10%, 15%)',
    '--rg-bg-card': 'hsl(220, 10%, 15%)',
    '--rg-bg-card-pinned': 'hsl(140, 20%, 15%)',
    '--rg-bg-hover': 'hsl(220, 10%, 15%)',

    // Border colors
    '--rg-border-primary': 'hsl(220, 10%, 15%)',
    '--rg-border-hover': 'hsl(0, 0%, 38%)',
    '--rg-border-pinned': 'hsl(133, 43%, 47%)',

    // Text colors
    '--rg-text-primary': 'hsl(0, 0%, 88%)',
    '--rg-text-secondary': 'hsl(0, 0%, 88%)',
    '--rg-text-tertiary': 'hsl(0, 0%, 88%)',
    '--rg-text-options': 'hsl(0, 0%, 88%)',
    '--rg-text-count': 'hsl(48, 100%, 50%)',

    // Game type colors
    '--rg-gametype-voc': 'hsl(215, 80%, 65%)',
    '--rg-gametype-normal': 'hsl(130, 50%, 60%)',
    '--rg-gametype-abra': 'hsl(215, 20%, 60%)',
    '--rg-gametype-referats': 'hsl(80, 55%, 40%)',
    '--rg-gametype-noerror': 'hsl(200, 45%, 65%)',
    '--rg-gametype-marathon': 'hsl(340, 70%, 55%)',
    '--rg-gametype-chars': 'hsl(35, 100%, 45%)',
    '--rg-gametype-digits': 'hsl(0, 0%, 50%)',
    '--rg-gametype-sprint': 'hsl(5, 40%, 60%)',

    // Icon colors
    '--rg-icon-primary': 'hsl(207, 89%, 76%)',
    '--rg-icon-pin': 'hsl(133, 43%, 47%)',
    '--rg-icon-pin-fill': 'hsl(133, 43%, 47%)',
    '--rg-icon-delete': 'hsl(4, 100%, 75%)',
    '--rg-icon-theme-sun': 'hsl(48, 100%, 50%)',
    '--rg-icon-theme-moon': 'hsl(207, 89%, 76%)',

    // Interactive colors
    '--rg-hover-pin': 'hsla(133, 43%, 47%, 0.2)',
    '--rg-hover-delete': 'hsla(4, 100%, 75%, 0.2)',
    '--rg-hover-control': 'hsl(0, 0%, 38%)',
    '--rg-hover-control-btn': 'hsl(213, 81.60%, 29.80%)',

    // Pinned card backgrounds and borders by gameType
    '--rg-bg-card-pinned-voc': 'hsl(215, 80%, 10%)',
    '--rg-border-pinned-voc': 'hsl(215, 80%, 30%)',

    '--rg-bg-card-pinned-normal': 'hsl(130, 50%, 10%)',
    '--rg-border-pinned-normal': 'hsl(130, 50%, 30%)',

    '--rg-bg-card-pinned-abra': 'hsl(215, 20%, 10%)',
    '--rg-border-pinned-abra': 'hsl(215, 20%, 30%)',

    '--rg-bg-card-pinned-referats': 'hsl(80, 55%, 10%)',
    '--rg-border-pinned-referats': 'hsl(80, 55%, 30%)',

    '--rg-bg-card-pinned-noerror': 'hsl(200, 45%, 10%)',
    '--rg-border-pinned-noerror': 'hsl(200, 45%, 30%)',

    '--rg-bg-card-pinned-marathon': 'hsl(340, 65%, 10%)',
    '--rg-border-pinned-marathon': 'hsl(340, 65%, 30%)',

    '--rg-bg-card-pinned-chars': 'hsl(40, 100%, 10%)',
    '--rg-border-pinned-chars': 'hsl(40, 100%, 30%)',

    '--rg-bg-card-pinned-digits': 'hsl(0, 0%, 10%)',
    '--rg-border-pinned-digits': 'hsl(0, 0%, 30%)',

    '--rg-bg-card-pinned-sprint': 'hsl(5, 40%, 10%)',
    '--rg-border-pinned-sprint': 'hsl(5, 40%, 30%)',
  }
};

// Utility to generate a unique random string id
function generateRandomId() {
  // 12-char alphanumeric, URL-safe
  return Array.from(crypto.getRandomValues(new Uint8Array(9)))
    .map(b => (b % 36).toString(36))
    .join('');
}

class LatestGamesManager {
  constructor() {
    this.maxGameCount = 5;
    this.gameData = [];
    this.hoverTimeout = null;
    this.isHovered = false;
    this.isDragging = false;
    this.wasDragging = false;
    this.dragThreshold = 50;
    this.draggedElement = null;
    this.dragOffset = { x: 0, y: 0 };
    this.dragDirection = 0;
    this.lastDragDirection = 0;
    this.rotationAccumulator = 0;
    this.rotationDegreeLimit = 5;
    this.lastDragY = 0;
    this.hidePanelDelay = 1000;
    this.globalEvents = {};

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
    this.currentTheme = localStorage.getItem('latest_games_theme') || 'light';

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
    this.applyTheme();
  }

  // --- Theme Management Methods ---

  // Applies the current theme to the container
  applyTheme() {
    const container = document.getElementById('latest-games-container');
    if (container) {
      container.classList.remove('light-theme', 'dark-theme');
      container.classList.add(`${this.currentTheme}-theme`);
    }
  }

  // Updates the theme icon based on the current theme
  updateThemeIcon(svg) {
    if (this.currentTheme === 'light') {
      svg.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg"
      class="feather feather-sun"
      width="16" height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    } else {
      svg.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg"
      class="feather feather-moon"
      width="16" height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    }
  }

  // Updates the theme toggle icon based on the current theme
  updateThemeToggle() {
    const svg = document.querySelector('#latest-games-container .theme-toggle svg');
    if (svg) {
      this.updateThemeIcon(svg);
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('latest_games_theme', this.currentTheme);
    this.applyTheme();
    this.updateThemeToggle();
  }

  // Creates the theme toggle button with an SVG icon
  createThemeToggle() {
    const toggleButton = this.createElement('div', {
      className: 'theme-toggle control-button',
      title: 'Изменить тему (Светлая/Темная)'
    });

    const svg = this.createElement('svg', {
      viewBox: '0 0 24 24'
    });

    // Set initial icon
    this.updateThemeIcon(svg);

    toggleButton.appendChild(svg);

    toggleButton.addEventListener('click', () => {
      this.toggleTheme();
    });

    return toggleButton;
  }

  // Add display mode toggle button
  createDisplayModeToggle() {
    const displayMode = this.getDisplayMode();
    const toggleButton = this.createElement('div', {
      className: 'display-mode-toggle control-button',
      title: 'Переключить режим отображения (Верттикальный/Горизонтальный)'
    });
    const svg = this.createElement('svg', {
      viewBox: '0 0 24 24'
    });
    this.updateDisplayModeIcon(svg, displayMode);
    toggleButton.appendChild(svg);
    toggleButton.addEventListener('click', () => {
      const newMode = this.getDisplayMode() === 'scroll' ? 'wrap' : 'scroll';
      this.setDisplayMode(newMode);
      this.updateDisplayModeIcon(svg, newMode);
      this.updateDisplayModeClass();
    });
    return toggleButton;
  }

  getDisplayMode() {
    return localStorage.getItem('latest_games_display_mode') || 'scroll';
  }

  setDisplayMode(mode) {
    localStorage.setItem('latest_games_display_mode', mode);
  }

  updateDisplayModeIcon(svg, mode) {
    if (mode === 'wrap') {
      svg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
    } else {
      svg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/></svg>`;
    }
  }

  updateDisplayModeClass() {
    const container = document.getElementById('latest-games-container');
    const gamesList = document.getElementById('latest-games');
    if (!container || !gamesList) return;
    const mode = this.getDisplayMode();
    container.classList.toggle('display-mode-wrap', mode === 'wrap');
    gamesList.classList.toggle('display-mode-wrap', mode === 'wrap');
    this.updateContainerLeftOffset();
  }

  updateContainerLeftOffset() {
    const container = document.getElementById('latest-games-container');
    if (!container) return;
    const mode = this.getDisplayMode();
    if (mode === 'wrap') {
      container.style.left = 'calc(-1 * (100vw - 100px))';
    } else {
      container.style.left = '-350px';
    }
  }

  // --- Existing Methods with Modifications ---

  createGameElement(game, id) {
    const gametypeClass = game.pin ? ` pin-gametype-${game.params.gametype}` : '';
    const li = this.createElement('li', {
      className: `latest-game${game.pin ? ' pin-game' : ''}${gametypeClass}`,
      id: `latest-game-${id}` // Use string id
    });

    const buttons = this.createElement('div', {
      className: 'latest-game-buttons'
    });

    const pinButton = this.createElement('div', {
      className: 'latest-game-pin',
      title: game.pin ? 'Открепить' : 'Закрепить',
      innerHTML: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
             class="feather feather-anchor">
          <circle cx="12" cy="5" r="3"></circle>
          <line x1="12" y1="22" x2="12" y2="8"></line>
          <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
        </svg>
      `
    });
    pinButton.addEventListener('click', () => this.pinGame(id));

    const deleteButton = this.createElement('div', {
      className: 'latest-game-delete',
      title: 'Удалить',
      innerHTML: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
             class="feather feather-x">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `
    });
    deleteButton.addEventListener('click', () => this.deleteGame(id));

    buttons.appendChild(pinButton);
    buttons.appendChild(deleteButton);

    const link = this.createElement('a', {
      href: this.generateGameLink(game),
      innerHTML: this.generateGameName(game)
    });

    link.addEventListener('click', (e) => {
      if (this.wasDragging) {
        e.preventDefault();
        // Reset flag so next click works normally
        this.wasDragging = false;
      }
    });

    li.appendChild(buttons);
    li.appendChild(link);

    if (game.pin) {
      this.addDragFunctionality(li, id);
    }

    return li;
  }

  createControls() {
    const controlsContainer = this.createElement('div', {
      className: 'latest-games-controls'
    });

    // Pin all button
    const pinAllBtn = this.createElement('span', {
      className: 'latest-games-pinall control-button',
      title: 'Закрепить все',
      innerHTML: `<svg class="control-button-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
    });
    pinAllBtn.onclick = () => {
      this.gameData.forEach(g => g.pin = 1);
      this.saveGameData();
      this.refreshContainer();
    };

    // Unpin all button
    const unpinAllBtn = this.createElement('span', {
      className: 'latest-games-unpinall control-button',
      title: 'Открепить все',
      innerHTML: `<svg class="control-button-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`
    });
    unpinAllBtn.onclick = () => {
      this.gameData.forEach(g => g.pin = 0);
      this.saveGameData();
      this.refreshContainer();
    };

    // Import settings button
    const importBtn = this.createElement('span', {
      className: 'latest-games-import control-button',
      title: 'Импортировать настройки из JSON файла',
      innerHTML: `<svg class="control-button-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`
    });
    importBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (typeof data === 'object' && data !== null) {
            if (data.latest_games) localStorage.setItem('latest_games', JSON.stringify(data.latest_games));
            if (data.latest_games_limit) localStorage.setItem('latest_games_limit', data.latest_games_limit);
            if (data.latest_games_theme) localStorage.setItem('latest_games_theme', data.latest_games_theme);
            if (data.latest_games_display_mode) localStorage.setItem('latest_games_display_mode', data.latest_games_display_mode);
            if (data.latest_games_scroll) localStorage.setItem('latest_games_scroll', data.latest_games_scroll);
            this.loadSettings();
            this.loadGameData();
            this.refreshContainer();
          } else {
            alert('Файл не содержит валидный JSON настроек.');
          }
        } catch (err) {
          alert('Ошибка при импорте: ' + err);
        }
      };
      document.body.appendChild(input);
      input.click();
      setTimeout(() => input.remove(), 1000);
    };

    // Export settings button
    const exportBtn = this.createElement('span', {
      className: 'latest-games-export control-button',
      title: 'Экспортировать все настройки в JSON файл',
      innerHTML: `<svg class="control-button-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`
    });
    exportBtn.onclick = () => {
      const all = {
        latest_games: JSON.parse(localStorage.getItem('latest_games') || '[]'),
        latest_games_limit: localStorage.getItem('latest_games_limit'),
        latest_games_theme: localStorage.getItem('latest_games_theme'),
        latest_games_display_mode: localStorage.getItem('latest_games_display_mode'),
        latest_games_scroll: localStorage.getItem('latest_games_scroll')
      };
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kg-latest-games-settings.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1000);
    };

    // Remove all settings button
    const removeAllBtn = this.createElement('span', {
      className: 'latest-games-removeall control-button',
      title: 'Удалить все настройки',
      innerHTML: `<svg class="control-button-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
    });
    removeAllBtn.onclick = () => {
      localStorage.removeItem('latest_games');
      localStorage.removeItem('latest_games_limit');
      localStorage.removeItem('latest_games_scroll');
      this.gameData = [];
      this.saveGameData();
      this.refreshContainer();
    };

    const options = this.createElement('span', {
      id: 'latest-games-options'
    });

    const decreaseBtn = this.createElement('span', {
      id: 'latest-games-count-dec',
      className: 'control-button',
      title: 'Уменьшить количество сохраняемых игр',
      innerHTML: `<svg class="control-button-svg" viewBox="0 0 24 24"><path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" fill="currentColor"/></svg>`
    });

    const countDisplay = this.createElement('span', {
      id: 'latest-games-count',
      textContent: this.maxGameCount.toString()
    });

    const increaseBtn = this.createElement('span', {
      id: 'latest-games-count-inc',
      className: 'control-button',
      title: 'Увеличить количество сохраняемых игр',
      innerHTML: `<svg class="control-button-svg" viewBox="0 0 24 24"><path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" fill="currentColor"/></svg>`
    });

    decreaseBtn.addEventListener('click', () => this.changeGameCount(-1));
    increaseBtn.addEventListener('click', () => this.changeGameCount(1));

    options.appendChild(decreaseBtn);
    options.appendChild(countDisplay);
    options.appendChild(increaseBtn);

    controlsContainer.appendChild(options);
    controlsContainer.appendChild(this.createThemeToggle());
    controlsContainer.appendChild(this.createDisplayModeToggle());
    controlsContainer.appendChild(pinAllBtn);
    controlsContainer.appendChild(unpinAllBtn);
    controlsContainer.appendChild(importBtn);
    controlsContainer.appendChild(exportBtn);
    controlsContainer.appendChild(removeAllBtn);

    return controlsContainer;
  }

  createContainer() {
    const container = this.createElement('div', {
      id: 'latest-games-container'
    });

    const gamesList = this.createElement('ul', {
      id: 'latest-games'
    });

    this.populateGamesList(gamesList);
    container.appendChild(gamesList);
    const controls = this.createControls();
    container.appendChild(controls);

    // Restore scroll position if available
    const savedScroll = localStorage.getItem('latest_games_scroll');
    if (savedScroll) {
      container.scrollTop = parseInt(savedScroll, 10);
    }

    // Save scroll position on scroll
    container.addEventListener('scroll', () => {
      localStorage.setItem('latest_games_scroll', container.scrollTop.toString());
    });

    container.addEventListener('mouseenter', () => {
      this.showContainer();
      // Restore scroll position again in case container was re-created
      const savedScroll = localStorage.getItem('latest_games_scroll');
      if (savedScroll) {
        container.scrollTop = parseInt(savedScroll, 10);
      }
    });

    container.addEventListener('mouseleave', () => {
      this.hideContainerWithDelay();
    });

    document.body.appendChild(container);
    this.updateDisplayModeClass();
  }

  // Injects styles based on the current theme
  injectStyles() {
    const baseStyles = {
      '#latest-games-hover-area': {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '1px',
        height: '100vh',
        zIndex: '3100',
        backgroundColor: 'transparent',
        pointerEvents: 'auto'
      },
      '#latest-games-container': {
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Montserrat", sans-serif',
        position: 'fixed',
        top: '50px',
        width: 'auto',
        minWidth: '200px',
        maxWidth: '350px',
        maxHeight: 'calc(100vh - 100px)',
        backgroundColor: 'var(--rg-bg-primary)',
        border: '1px solid var(--rg-border-primary)',
        borderLeft: 'none',
        borderRadius: '0 8px 8px 0 !important',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        zIndex: '3000',
        padding: '10px 0',
        opacity: '0',
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'left 0.3s ease, opacity 0.3s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
        color: 'var(--rg-text-primary)',
      },
      '#latest-games-container.visible': {
        left: '0 !important',
        opacity: '1',
        pointerEvents: 'auto',
        userSelect: 'auto'
      },
      '#latest-games': {
        margin: '0',
        padding: '0',
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      },
      '.pin-game': {
        cursor: 'move' // Indicate that pinned games are draggable
      },
      '.latest-game': {
        position: 'relative',
        margin: '0 10px',
        border: '1px solid var(--rg-border-primary)',
        borderRadius: '4px !important',
        backgroundColor: 'var(--rg-bg-card)',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        flex: 'fit-content',
        maxWidth: '300px',
      },
      // Per-gametype pinned styles
      '.latest-game.pin-game.pin-gametype-voc': {
        border: '2px solid var(--rg-border-pinned-voc)',
        backgroundColor: 'var(--rg-bg-card-pinned-voc)'
      },
      '.latest-game.pin-game.pin-gametype-normal': {
        border: '2px solid var(--rg-border-pinned-normal)',
        backgroundColor: 'var(--rg-bg-card-pinned-normal)'
      },
      '.latest-game.pin-game.pin-gametype-abra': {
        border: '2px solid var(--rg-border-pinned-abra)',
        backgroundColor: 'var(--rg-bg-card-pinned-abra)'
      },
      '.latest-game.pin-game.pin-gametype-referats': {
        border: '2px solid var(--rg-border-pinned-referats)',
        backgroundColor: 'var(--rg-bg-card-pinned-referats)'
      },
      '.latest-game.pin-game.pin-gametype-noerror': {
        border: '2px solid var(--rg-border-pinned-noerror)',
        backgroundColor: 'var(--rg-bg-card-pinned-noerror)'
      },
      '.latest-game.pin-game.pin-gametype-marathon': {
        border: '2px solid var(--rg-border-pinned-marathon)',
        backgroundColor: 'var(--rg-bg-card-pinned-marathon)'
      },
      '.latest-game.pin-game.pin-gametype-chars': {
        border: '2px solid var(--rg-border-pinned-chars)',
        backgroundColor: 'var(--rg-bg-card-pinned-chars)'
      },
      '.latest-game.pin-game.pin-gametype-digits': {
        border: '2px solid var(--rg-border-pinned-digits)',
        backgroundColor: 'var(--rg-bg-card-pinned-digits)'
      },
      '.latest-game.pin-game.pin-gametype-sprint': {
        border: '2px solid var(--rg-border-pinned-sprint)',
        backgroundColor: 'var(--rg-bg-card-pinned-sprint)'
      },
      '.latest-game:hover': {
        borderColor: 'var(--rg-border-hover)',
        backgroundColor: 'var(--rg-bg-hover)',
        transform: 'translateX(2px)'
      },
      '.latest-game.dragging': {
        opacity: '0.7',
        zIndex: '2000',
        transition: 'transform 0.1s ease'
      },
      '.latest-game a': {
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        textDecoration: 'none',
        color: 'inherit'
      },
      '.latest-game-name': {
        display: 'block',
        fontWeight: 'bold',
        fontSize: '12px',
        marginBottom: '2px'
      },
      '.latest-game-name.gametype-voc': {
        color: 'var(--rg-gametype-voc) !important'
      },
      '.latest-game-name.gametype-normal': {
        color: 'var(--rg-gametype-normal) !important'
      },
      '.latest-game-name.gametype-abra': {
        color: 'var(--rg-gametype-abra) !important'
      },
      '.latest-game-name.gametype-referats': {
        color: 'var(--rg-gametype-referats) !important'
      },
      '.latest-game-name.gametype-noerror': {
        color: 'var(--rg-gametype-noerror) !important'
      },
      '.latest-game-name.gametype-marathon': {
        color: 'var(--rg-gametype-marathon) !important'
      },
      '.latest-game-name.gametype-chars': {
        color: 'var(--rg-gametype-chars) !important'
      },
      '.latest-game-name.gametype-digits': {
        color: 'var(--rg-gametype-digits) !important'
      },
      '.latest-game-name.gametype-sprint': {
        color: 'var(--rg-gametype-sprint) !important'
      },
      '.latest-game-description': {
        display: 'block',
        fontSize: '10px',
        color: 'var(--rg-text-secondary)',
        lineHeight: '1.2'
      },
      '.latest-game-qual': {
        color: '#f00',
        fontWeight: 'bold'
      },
      '.latest-game-levels': {
        display: 'block',
        fontSize: '9px',
        color: 'var(--rg-text-tertiary)',
        marginTop: '1px'
      },
      '.latest-game-buttons': {
        position: 'relative',
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        marginRight: '5px',
        opacity: '0',
        transition: 'opacity 0.2s ease',
        order: '1',
      },
      '.latest-game:hover .latest-game-buttons': {
        opacity: '1'
      },
      '.latest-game-pin, .latest-game-delete': {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
        borderRadius: '2px !important',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease'
      },
      '.latest-game-pin:hover': {
        backgroundColor: 'var(--rg-hover-pin)'
      },
      '.latest-game-delete:hover': {
        backgroundColor: 'var(--rg-hover-delete)'
      },
      '.latest-game-pin svg': {
        width: '10px',
        height: '10px',
        opacity: '0.6',
        stroke: 'var(--rg-icon-pin-fill)',
      },
      '.latest-game-delete svg': {
        width: '10px',
        height: '10px',
        opacity: '0.6',
        stroke: 'var(--rg-icon-delete)',
        fill: 'none'
      },
      '.latest-game-pin:hover svg, .latest-game-delete:hover svg': {
        opacity: '1'
      },
      '.latest-games-controls': {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 10px',
        marginTop: '10px',
      },
      '#latest-games-options': {
        display: 'flex',
        alignItems: 'center',
        fontSize: '13px',
        gap: '6px',
        color: 'var(--rg-text-options)',
        userSelect: 'none'
      },
      '#latest-games-count': {
        margin: '0 6px',
        fontWeight: 'bold',
        fontSize: '14px',
        minWidth: '18px',
        textAlign: 'center',
        color: 'var(--rg-text-count)'
      },
      '#latest-games-count-inc, #latest-games-count-dec': {
        height: '24px',
        width: '24px',
        cursor: 'pointer',
        fontSize: '16px',
        borderRadius: '3px !important',
        transition: 'background 0.15s',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--rg-icon-primary)'
      },
      '#latest-games-count-inc:hover, #latest-games-count-dec:hover': {
        background: 'var(--rg-hover-control-btn)'
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
        width: '16px',
        height: '16px',
        display: 'block',
        transition: 'stroke 0.2s, fill 0.2s'
      },
      '.theme-toggle svg.feather-sun': {
        stroke: 'var(--rg-icon-theme-sun)',
        fill: 'none',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      },
      '.theme-toggle svg.feather-moon': {
        stroke: 'var(--rg-icon-theme-moon)',
        fill: 'none',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      },
      // Generic SVG styling
      '#latest-games-count-dec svg, #latest-games-count-inc svg': {
        width: '16px',
        height: '16px',
      },
      '#latest-games-container.display-mode-wrap': {
        maxWidth: 'none',
        width: 'calc(100vw - 100px)',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      },
      '#latest-games.display-mode-wrap': {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        maxHeight: 'none',
        overflowY: 'visible',
        margin: '0 10px',
      },
      '.display-mode-wrap .latest-game': {
        margin: '0',
      },
      '.display-mode-toggle': {
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        marginLeft: '6px',
      },
      '.control-button': {
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background 0.15s',
        userSelect: 'none',
        margin: '0 2px',
        padding: '0',
        boxSizing: 'border-box',
      },
      '.control-button-svg': {
        width: '16px',
        height: '16px',
        display: 'flex',
        pointerEvents: 'none',
      },
    };

    this.createStyleSheet(baseStyles);
  }

  // Create stylesheet with CSS variables
  createStyleSheet(styles) {
    const styleElement = this.createElement('style');
    let cssText = '';

    // Add CSS custom properties for each theme
    Object.entries(THEME_COLORS).forEach(([themeName, colors]) => {
      cssText += `#latest-games-container.${themeName}-theme { `;
      Object.entries(colors).forEach(([property, value]) => {
        cssText += `${property}: ${value}; `;
      });
      cssText += '} ';
    });

    // Add base styles
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

  loadSettings() {
    try {
      const savedLimit = localStorage.getItem('latest_games_limit');
      if (savedLimit) {
        this.maxGameCount = Math.max(0, parseInt(savedLimit, 10));
      }
    } catch (error) {
      console.warn('Could not load settings from localStorage:', error);
    }
  }

  loadGameData() {
    try {
      const savedGames = localStorage.getItem('latest_games');
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
    // Only assign an id if missing, never overwrite existing ids
    this.gameData = this.gameData.map(game => {
      if (!('id' in game) || game.id === -1 || game.id === undefined || game.id === null) {
        return { ...game, id: generateRandomId() };
      }
      return game;
    });
  }

  saveGameData() {
    try {
      localStorage.setItem('latest_games', JSON.stringify(this.gameData));
    } catch (error) {
      console.warn('Could not save game data to localStorage:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('latest_games_limit', this.maxGameCount.toString());
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
      className: `latest-game-name gametype-${game.params.gametype}`,
      textContent: vocName === '' ? gameType : `«${vocName}»`
    });

    const descSpan = this.createElement('span', {
      className: 'latest-game-description'
    });

    const qualSpan = this.createElement('span', {
      className: 'latest-game-qual',
      textContent: qual ? ' (к)' : ''
    });

    let levelText = '';
    if (level_from !== 1 || level_to !== 9) {
      const levelFromName = this.ranks[level_from - 1];
      const levelToName = this.ranks[level_to - 1];
      levelText = ` ${levelFromName} - ${levelToName}`;
    }

    const levelsSpan = this.createElement('span', {
      className: 'latest-game-levels',
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

  addDragFunctionality(element) {
    element.addEventListener('mousedown', (e) => {
      // Reset drag flag and store initial position
      this.wasDragging = false;
      this.initialX = e.clientX;
      this.initialY = e.clientY;

      this.isDragging = true;
      this.draggedElement = element;
      const rect = element.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      this.isRightHalf = clickX > rect.width / 2; // Determine if click is on right half
      this.lastDragY = e.clientY;
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      element.classList.add('dragging');

      const displayMode = this.getDisplayMode();
      if (displayMode === 'wrap') {
        // Prepare for absolute positioning in wrap mode
        element.style.position = 'absolute';
        element.style.left = `${rect.left - element.parentElement.getBoundingClientRect().left}px`;
        element.style.top = `${rect.top - element.parentElement.getBoundingClientRect().top}px`;
        element.style.width = `${rect.width}px`; // Maintain width during drag
      }

      // Save the bound functions in globalEvents so we can remove them later
      this.globalEvents.handleDragMove = this.handleDragMove.bind(this);
      this.globalEvents.handleDragEnd = this.handleDragEnd.bind(this);
      document.addEventListener('mousemove', this.globalEvents.handleDragMove);
      document.addEventListener('mouseup', this.globalEvents.handleDragEnd);
    });
  }

  handleDragMove(e) {
    if (!this.isDragging || !this.draggedElement) return;

    // If not already marked as dragging, check the threshold to start dragging
    if (!this.wasDragging) {
      if (Math.abs(e.clientX - this.initialX) > this.dragThreshold ||
        Math.abs(e.clientY - this.initialY) > this.dragThreshold) {
        this.wasDragging = true;
      }
    }

    e.preventDefault();

    const displayMode = this.getDisplayMode();
    const gamesList = document.getElementById('latest-games');

    if (displayMode === 'scroll') {
      // Vertical reordering only
      const pinnedGames = Array.from(gamesList.querySelectorAll('.pin-game:not(.dragging)'));
      let insertAfter = null;

      for (const pinnedGame of pinnedGames) {
        const rect = pinnedGame.getBoundingClientRect();
        const middle = rect.top + rect.height / 2;
        if (e.clientY < middle) break;
        insertAfter = pinnedGame;
      }

      if (insertAfter) {
        gamesList.insertBefore(this.draggedElement, insertAfter.nextSibling);
      } else {
        const firstPinned = gamesList.querySelector('.pin-game:not(.dragging)');
        if (firstPinned) {
          gamesList.insertBefore(this.draggedElement, firstPinned);
        }
      }
    } else {
      // Wrap mode: free movement by x and y with constraints
      const containerRect = gamesList.getBoundingClientRect();
      let newLeft = e.clientX - this.dragOffset.x - containerRect.left;
      let newTop = e.clientY - this.dragOffset.y - containerRect.top;

      // Constrain within container bounds
      newLeft = Math.max(0, Math.min(newLeft, gamesList.offsetWidth - this.draggedElement.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, gamesList.offsetHeight - this.draggedElement.offsetHeight));

      this.draggedElement.style.left = `${newLeft}px`;
      this.draggedElement.style.top = `${newTop}px`;

      // Determine insertion point based on distance to other items
      const pinnedGames = Array.from(gamesList.querySelectorAll('.pin-game:not(.dragging)'));
      let closestElement = null;
      let minDistance = Infinity;
      const cursorX = e.clientX;
      const cursorY = e.clientY;

      pinnedGames.forEach(game => {
        const rect = game.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(cursorX - centerX, cursorY - centerY);
        if (distance < minDistance) {
          minDistance = distance;
          closestElement = game;
        }
      });

      if (closestElement) {
        const rect = closestElement.getBoundingClientRect();
        const isLeftHalf = cursorX < rect.left + rect.width / 2;
        if (isLeftHalf) {
          gamesList.insertBefore(this.draggedElement, closestElement);
        } else {
          gamesList.insertBefore(this.draggedElement, closestElement.nextSibling);
        }
      }
    }

    // Smooth continuous rotation logic (limited to ±5 degrees)
    const currentY = e.clientY;
    const deltaY = currentY - this.lastDragY;
    this.lastDragY = currentY;
    if (deltaY !== 0) {
      const sensitivity = 0.2;
      this.rotationAccumulator = (this.rotationAccumulator || 0) + (this.isRightHalf ? deltaY : -deltaY) * sensitivity;
      // Clamp to (rotattionDegreeLimit)
      if (this.rotationAccumulator > this.rotationDegreeLimit) {
        this.rotationAccumulator = this.rotationDegreeLimit;
      } else if (this.rotationAccumulator < -this.rotationDegreeLimit) {
        this.rotationAccumulator = -this.rotationDegreeLimit;
      }
      this.draggedElement.style.transform = `rotate(${this.rotationAccumulator}deg)`;
    }
  }

  handleDragEnd() {
    if (!this.isDragging || !this.draggedElement) return;

    this.isDragging = false;
    this.draggedElement.classList.remove('dragging');

    const displayMode = this.getDisplayMode();
    if (displayMode === 'wrap') {
      // Reset absolute positioning
      this.draggedElement.style.position = '';
      this.draggedElement.style.left = '';
      this.draggedElement.style.top = '';
      this.draggedElement.style.width = '';
    }
    this.draggedElement.style.transform = ''; // Reset rotation

    this.updateGameOrderFromDOM();

    // Reset drag tracking variables
    this.draggedElement = null;
    this.dragDirection = 0;
    this.lastDragY = 0;

    if (this.globalEvents) {
      document.removeEventListener('mousemove', this.globalEvents.handleDragMove);
      document.removeEventListener('mouseup', this.globalEvents.handleDragEnd);
    }
  }

  updateGameOrderFromDOM() {
    const gameElements = Array.from(document.querySelectorAll('#latest-games .latest-game'));
    const newGameData = [];

    gameElements.forEach(element => {
      const id = element.id.replace('latest-game-', ''); // Use string id
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
      id: 'latest-games-hover-area'
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
      const game = this.gameData[i];
      const gameElement = this.createGameElement(game, game.id); // Use string id
      gamesList.appendChild(gameElement);
    }
  }

  showContainer() {
    this.isHovered = true;
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    const container = document.getElementById('latest-games-container');
    if (container) {
      container.classList.add('visible');
      container.style.left = '0';
      const savedScroll = localStorage.getItem('latest_games_scroll');
      if (savedScroll !== null) {
        container.scrollTop = parseInt(savedScroll, 10) || 0;
      }
    }
  }

  hideContainerWithDelay() {
    this.isHovered = false;
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.hoverTimeout = setTimeout(() => {
      if (!this.isHovered) {
        const container = document.getElementById('latest-games-container');
        if (container) {
          container.classList.remove('visible');
          this.updateContainerLeftOffset();
        }
      }
    }, this.hidePanelDelay);
  }

  refreshContainer() {
    const gamesList = document.getElementById('latest-games');
    if (gamesList) {
      this.populateGamesList(gamesList);
      this.updateDisplayModeClass();
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

    const game = this.gameData[gameIndex];
    game.pin = game.pin ? 0 : 1;

    const insertIndex = game.pin ?
      this.gameData.findIndex(g => !g.pin || g === game) :
      this.gameData.findIndex(g => !g.pin && g !== game);

    if (gameIndex !== insertIndex) {
      const [gameObject] = this.gameData.splice(gameIndex, 1);
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
      id: generateRandomId(),
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

    const countDisplay = document.getElementById('latest-games-count');
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
  }

  exposeGlobalFunctions() {
    window.latestGamesManager = this;
  }
}

// Add Montserrat font import
(function addMontserratFont() {
  if (!document.getElementById('kg-latest-games-montserrat-font')) {
    const link = document.createElement('link');
    link.id = 'kg-latest-games-montserrat-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat&display=swap';
    document.head.appendChild(link);
  }
})();

function initializeLatestGames() {
  if (!document.getElementById('KG_LatestGames')) {
    new LatestGamesManager();

    const marker = document.createElement('div');
    marker.id = 'KTS_LatestGames';
    marker.style.display = 'none';
    document.body.appendChild(marker);
  }
}

initializeLatestGames();