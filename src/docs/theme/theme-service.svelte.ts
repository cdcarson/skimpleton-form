import { browser } from '$app/environment';
import type { Theme } from './shared.js';

class ThemeService {
  private static instance: ThemeService;
  private _mode = $state<Theme>('system');
  private mediaQuery: MediaQueryList | null = null;

  private constructor() {
    if (browser) {
      this.initialize();
    }
  }

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  private initialize() {
    // Set up media query listener for system preference changes
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', () => {
      if (this._mode === 'system') {
        this.applyTheme();
      }
    });

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      this._mode = savedTheme;
    }

    // Apply the theme
    this.applyTheme();
  }

  get mode(): Theme {
    return this._mode;
  }

  set mode(value: Theme) {
    this._mode = value;
    if (browser) {
      localStorage.setItem('theme', value);
      this.applyTheme();
    }
  }

  get isDark(): boolean {
    if (!browser) return false;

    if (this._mode === 'dark') return true;
    if (this._mode === 'light') return false;

    // system mode
    return this.mediaQuery?.matches ?? false;
  }

  private applyTheme() {
    if (!browser) return;

    const html = document.documentElement;

    if (this.isDark) {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.setAttribute('data-theme', 'light');
    }
  }

  setLight() {
    this.mode = 'light';
  }

  setDark() {
    this.mode = 'dark';
  }

  setSystem() {
    this.mode = 'system';
  }

  toggle() {
    switch (this._mode) {
      case 'light':
        this.setDark();
        break;
      case 'dark':
        this.setSystem();
        break;
      case 'system':
        this.setLight();
        break;
    }
  }

  cleanup() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.applyTheme);
    }
  }
}

export const themeService = ThemeService.getInstance();
