/**
 * ThemeManager - Handles theme detection, toggle, and persistence
 *
 * Priority:
 * 1. User saved preference (localStorage)
 * 2. System preference (prefers-color-scheme)
 */

class ThemeManager {
  constructor() {
    this.storageKey = 'spark_helper_theme';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  /**
   * Initialize theme on page load
   * Sets up theme and listens for system preference changes
   */
  init() {
    this.applyTheme();

    // Listen for system preference changes
    this.mediaQuery.addEventListener('change', () => {
      // Only react to system changes if no user preference is saved
      if (!this.getSavedPreference()) {
        this.applyTheme();
      }
    });
  }

  /**
   * Get the saved user preference
   * @returns {string|null} 'light', 'dark', or null
   */
  getSavedPreference() {
    return localStorage.getItem(this.storageKey);
  }

  /**
   * Get the system preference
   * @returns {string} 'light' or 'dark'
   */
  getSystemPreference() {
    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  /**
   * Get the current effective theme
   * @returns {string} 'light' or 'dark'
   */
  getCurrentTheme() {
    const saved = this.getSavedPreference();
    return saved || this.getSystemPreference();
  }

  /**
   * Apply the current theme to the document
   */
  applyTheme() {
    const theme = this.getCurrentTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Toggle between light and dark themes
   * Saves the new preference to localStorage
   * @returns {string} The new theme
   */
  toggle() {
    const current = this.getCurrentTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';

    localStorage.setItem(this.storageKey, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    return newTheme;
  }

  /**
   * Check if current theme is dark
   * @returns {boolean} True if dark theme
   */
  isDark() {
    return this.getCurrentTheme() === 'dark';
  }

  /**
   * Clear saved preference (revert to system preference)
   */
  clearPreference() {
    localStorage.removeItem(this.storageKey);
    this.applyTheme();
  }
}

// Global instance
const themeManager = new ThemeManager();
