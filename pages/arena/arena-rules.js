/**
 * Arena Rules screen logic
 */

class ArenaRulesScreen {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Bottom navigation
    const botbarBtns = document.querySelectorAll('[data-route]');
    botbarBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = e.currentTarget.dataset.route;
        this.navigate(route);
      });
    });
  }

  navigate(route) {
    const routes = {
      back: '../arena/arena.html',
      home: '../../index.html',
      profile: '../../pages/profile/profile.html    };
    if (routes[route]) {
      window.location.href = routes[route];
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new ArenaRulesScreen();
});

