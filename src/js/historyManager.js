/**
 * HistoryManager - Handles query history with localStorage
 *
 * Stores up to 10 query entries with full configuration and generated SQL.
 * Supports auto-restore of queries within 24 hours.
 */

class HistoryManager {
  constructor() {
    this.storageKey = 'spark_helper_history';
    this.maxEntries = 10;
    this.restoreWindowMs = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get all history entries, newest first
   * @returns {Array} Array of history entries
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      const entries = data ? JSON.parse(data) : [];
      return entries.sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.error('Error reading history from localStorage:', err);
      return [];
    }
  }

  /**
   * Get the most recent history entry
   * @returns {object|null} Latest entry or null
   */
  getLatest() {
    const entries = this.getAll();
    return entries.length > 0 ? entries[0] : null;
  }

  /**
   * Get a history entry by ID
   * @param {string} id - Entry ID
   * @returns {object|null} Entry or null
   */
  getById(id) {
    const entries = this.getAll();
    return entries.find(e => e.id === id) || null;
  }

  /**
   * Check if there's a restorable query (within 24 hours)
   * @returns {object|null} Restorable entry or null
   */
  getRestorable() {
    const latest = this.getLatest();
    if (!latest) return null;

    const age = Date.now() - latest.createdAt;
    return age <= this.restoreWindowMs ? latest : null;
  }

  /**
   * Get relative time string for an entry
   * @param {number} timestamp - Entry timestamp
   * @returns {string} Relative time string
   */
  getRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  /**
   * Save a new history entry
   * @param {object} config - Query configuration
   * @param {string} sql - Generated SQL
   * @returns {object} Saved entry
   */
  save(config, sql) {
    const entries = this.getAll();

    // Check for duplicate config (same table and fields)
    const existingIndex = entries.findIndex(e =>
      e.config.tableName === config.tableName &&
      e.config.queryType === config.queryType &&
      JSON.stringify(e.config.fieldRows) === JSON.stringify(config.fieldRows) &&
      JSON.stringify(e.config.conditionRows) === JSON.stringify(config.conditionRows)
    );

    const entry = {
      id: `history_${Date.now()}`,
      createdAt: Date.now(),
      config: {
        queryType: config.queryType || 'standard',
        tableName: config.tableName,
        fieldRows: config.fieldRows || [],
        conditionRows: config.conditionRows || [],
        timeStart: config.timeStart || config.startTime,
        timeEnd: config.timeEnd || config.endTime,
        timezone: config.timezone
      },
      generatedSql: sql
    };

    if (existingIndex !== -1) {
      // Update existing entry timestamp
      entries.splice(existingIndex, 1);
    }

    // Add new entry at the beginning
    entries.unshift(entry);

    // Enforce max entries limit
    while (entries.length > this.maxEntries) {
      entries.pop();
    }

    this._persist(entries);
    return entry;
  }

  /**
   * Delete a history entry
   * @param {string} id - Entry ID
   * @returns {boolean} True if deleted
   */
  delete(id) {
    const entries = this.getAll();
    const index = entries.findIndex(e => e.id === id);

    if (index === -1) return false;

    entries.splice(index, 1);
    this._persist(entries);
    return true;
  }

  /**
   * Clear all history
   */
  clear() {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Persist entries to localStorage
   * @param {Array} entries - Entries array
   */
  _persist(entries) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (err) {
      console.error('Error saving history to localStorage:', err);
    }
  }
}

// Global instance
const historyManager = new HistoryManager();
