/**
 * SnippetManager - Handles user-saved query snippets with localStorage
 */

class SnippetManager {
  constructor() {
    this.storageKey = 'spark_helper_snippets';
  }

  /**
   * Get all saved snippets
   * @returns {Array} Array of snippet objects
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error reading snippets from localStorage:', err);
      return [];
    }
  }

  /**
   * Get a snippet by ID
   * @param {string} id - Snippet ID
   * @returns {object|null} Snippet object or null
   */
  getById(id) {
    const snippets = this.getAll();
    return snippets.find(s => s.id === id) || null;
  }

  /**
   * Save a new snippet
   * @param {object} snippetData - Snippet data (without id/createdAt)
   * @returns {object} Saved snippet with id and createdAt
   */
  save(snippetData) {
    const snippets = this.getAll();

    const snippet = {
      id: `snippet_${Date.now()}`,
      createdAt: Date.now(),
      ...snippetData
    };

    snippets.push(snippet);
    this._persist(snippets);

    return snippet;
  }

  /**
   * Update an existing snippet
   * @param {string} id - Snippet ID
   * @param {object} updates - Fields to update
   * @returns {object|null} Updated snippet or null if not found
   */
  update(id, updates) {
    const snippets = this.getAll();
    const index = snippets.findIndex(s => s.id === id);

    if (index === -1) return null;

    snippets[index] = { ...snippets[index], ...updates };
    this._persist(snippets);

    return snippets[index];
  }

  /**
   * Delete a snippet
   * @param {string} id - Snippet ID
   * @returns {boolean} True if deleted, false if not found
   */
  delete(id) {
    const snippets = this.getAll();
    const index = snippets.findIndex(s => s.id === id);

    if (index === -1) return false;

    snippets.splice(index, 1);
    this._persist(snippets);

    return true;
  }

  /**
   * Rename a snippet
   * @param {string} id - Snippet ID
   * @param {string} newName - New snippet name
   * @returns {object|null} Updated snippet or null if not found
   */
  rename(id, newName) {
    return this.update(id, { name: newName });
  }

  /**
   * Create snippet from current query configuration
   * @param {object} config - Query configuration
   * @param {string} config.name - Snippet name
   * @param {string} config.queryType - Query type (standard/distinct)
   * @param {string} config.tableName - Table name
   * @param {Array} config.fieldRows - SELECT field rows data (or T1 fields in JOIN mode)
   * @param {Array} [config.fieldRowsT2] - T2 field rows data (JOIN mode only)
   * @param {Array} config.conditionRows - WHERE condition rows data
   * @param {object} [config.joinConfig] - JOIN configuration (JOIN mode only)
   * @returns {object} Saved snippet
   */
  createFromQuery(config) {
    const { name, queryType, tableName, fieldRows, fieldRowsT2, conditionRows, joinConfig } = config;

    // Generate preview (first 100 chars of a simplified query representation)
    const preview = joinConfig
      ? this._generateJoinPreview(queryType, tableName, joinConfig.table2, fieldRows, fieldRowsT2)
      : this._generatePreview(queryType, tableName, fieldRows);

    const snippetData = {
      name,
      queryType,
      tableName,
      fieldRows,
      conditionRows,
      preview
    };

    // Add JOIN-specific data if present
    if (joinConfig) {
      snippetData.joinConfig = joinConfig;
      snippetData.fieldRowsT2 = fieldRowsT2 || [];
    }

    return this.save(snippetData);
  }

  /**
   * Generate a preview string for a snippet
   * @param {string} queryType - Query type
   * @param {string} tableName - Table name
   * @param {Array} fieldRows - Field rows data
   * @returns {string} Preview string (max 100 chars)
   */
  _generatePreview(queryType, tableName, fieldRows) {
    const selectKeyword = queryType === 'distinct' ? 'SELECT DISTINCT' : 'SELECT';
    const fields = fieldRows
      .map(row => row.alias || row.fieldName)
      .filter(Boolean)
      .join(', ');

    const preview = `${selectKeyword}\n  ${fields}\nFROM\n  ${tableName}`;

    return preview.length > 100 ? preview.substring(0, 97) + '...' : preview;
  }

  /**
   * Generate a preview string for a JOIN snippet
   * @param {string} queryType - Query type
   * @param {string} table1 - First table name
   * @param {string} table2 - Second table name
   * @param {Array} fieldRowsT1 - T1 field rows data
   * @param {Array} fieldRowsT2 - T2 field rows data
   * @returns {string} Preview string (max 100 chars)
   */
  _generateJoinPreview(queryType, table1, table2, fieldRowsT1, fieldRowsT2) {
    const selectKeyword = queryType === 'distinct' ? 'SELECT DISTINCT' : 'SELECT';

    const t1Fields = (fieldRowsT1 || [])
      .map(row => `t1.${row.alias || row.fieldName}`)
      .filter(f => f !== 't1.');

    const t2Fields = (fieldRowsT2 || [])
      .map(row => `t2.${row.alias || row.fieldName}`)
      .filter(f => f !== 't2.');

    const allFields = [...t1Fields, ...t2Fields].join(', ');

    const preview = `${selectKeyword}\n  ${allFields}\nFROM ${table1} t1 JOIN ${table2} t2`;

    return preview.length > 100 ? preview.substring(0, 97) + '...' : preview;
  }

  /**
   * Persist snippets to localStorage
   * @param {Array} snippets - Snippets array
   */
  _persist(snippets) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(snippets));
    } catch (err) {
      console.error('Error saving snippets to localStorage:', err);
      if (err.name === 'QuotaExceededError') {
        alert('Storage is full. Please delete some snippets.');
      }
    }
  }
}

// Global instance
const snippetManager = new SnippetManager();
