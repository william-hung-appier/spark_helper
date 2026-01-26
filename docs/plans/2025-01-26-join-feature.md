# JOIN Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add cross-table JOIN functionality to the Spark Query Builder extension, allowing users to join two tables with visual explanations of join types.

**Architecture:** Extend Standard mode with an optional JOIN section. When enabled, users select a second table, join type, and ON condition. SELECT section splits into two subsections (one per table). QueryBuilder generates proper JOIN SQL with table aliases.

**Tech Stack:** Vanilla JavaScript, HTML, CSS (existing patterns)

---

## Task 1: Create Join Keys Configuration File

**Files:**

- Create: `src/js/joinKeys.js`

**Step 1: Create the join keys configuration file**

```javascript
/**
 * Common join keys between table pairs
 * Used to suggest likely join fields in the ON clause
 */
const COMMON_JOIN_KEYS = {
  'creative_event:imp_join_all2': ['cid', 'oid', 'campaign_id'],
  'creative_perf_event:imp_join_all2': ['cid', 'oid', 'campaign_id'],
  'creative_quality:imp_join_all2': ['cid', 'oid'],
  'creative_event:creative_perf_event': ['cid', 'type'],
  'creative_event:creative_quality': ['cid'],
  'creative_perf_event:creative_quality': ['cid']
};

/**
 * Get suggested join keys for a table pair
 * @param {string} table1 - First table name
 * @param {string} table2 - Second table name
 * @returns {Array} Array of suggested field names
 */
function getJoinKeySuggestions(table1, table2) {
  // Sort table names to create consistent lookup key
  const key = [table1, table2].sort().join(':');
  return COMMON_JOIN_KEYS[key] || [];
}
```

**Step 2: Commit**

```bash
git add src/js/joinKeys.js
git commit -m "$(cat <<'EOF'
feat: add join keys configuration for common table pairs

Defines suggested join keys between supported tables to help users
select appropriate ON clause fields.
EOF
)"
```

---

## Task 2: Add Join State to AppState

**Files:**

- Modify: `src/js/state.js`

**Step 1: Add join configuration state**

Add after line 10 (after `this.quickQuery = null;`):

```javascript
    // JOIN configuration
    this.joinConfig = {
      enabled: false,
      joinType: 'INNER JOIN',
      table2: '',
      onField1: '',
      onField2: ''
    };
```

**Step 2: Add join-related methods**

Add before the closing brace of the class (before line 176):

```javascript
  /**
   * Enable or disable JOIN mode
   * @param {boolean} enabled - Whether JOIN is enabled
   */
  setJoinEnabled(enabled) {
    this.joinConfig.enabled = enabled;
    if (!enabled) {
      this.resetJoinConfig();
    }
  }

  /**
   * Check if JOIN mode is enabled
   * @returns {boolean} True if JOIN is enabled
   */
  isJoinEnabled() {
    return this.joinConfig.enabled;
  }

  /**
   * Set the JOIN type
   * @param {string} joinType - JOIN type (INNER JOIN, LEFT OUTER JOIN, FULL OUTER JOIN)
   */
  setJoinType(joinType) {
    this.joinConfig.joinType = joinType;
  }

  /**
   * Get the current JOIN type
   * @returns {string} JOIN type
   */
  getJoinType() {
    return this.joinConfig.joinType;
  }

  /**
   * Set the second table for JOIN
   * @param {string} tableName - Second table name
   * @returns {boolean} True if table has known schema
   */
  setJoinTable(tableName) {
    this.joinConfig.table2 = tableName;
    return this.schemaParser ? this.schemaParser.isKnownTableName(tableName) : false;
  }

  /**
   * Get the second table name
   * @returns {string} Second table name
   */
  getJoinTable() {
    return this.joinConfig.table2;
  }

  /**
   * Set ON clause fields
   * @param {string} field1 - Field from first table
   * @param {string} field2 - Field from second table
   */
  setJoinOnFields(field1, field2) {
    this.joinConfig.onField1 = field1;
    this.joinConfig.onField2 = field2;
  }

  /**
   * Get ON clause configuration
   * @returns {object} ON clause fields
   */
  getJoinOnFields() {
    return {
      field1: this.joinConfig.onField1,
      field2: this.joinConfig.onField2
    };
  }

  /**
   * Get full JOIN configuration
   * @returns {object} Complete join config
   */
  getJoinConfig() {
    return { ...this.joinConfig };
  }

  /**
   * Set full JOIN configuration (for loading from history/snippets)
   * @param {object} config - Join configuration
   */
  setJoinConfig(config) {
    if (config) {
      this.joinConfig = {
        enabled: config.enabled || false,
        joinType: config.joinType || 'INNER JOIN',
        table2: config.table2 || '',
        onField1: config.onField1 || '',
        onField2: config.onField2 || ''
      };
    }
  }

  /**
   * Reset JOIN configuration to defaults
   */
  resetJoinConfig() {
    this.joinConfig = {
      enabled: false,
      joinType: 'INNER JOIN',
      table2: '',
      onField1: '',
      onField2: ''
    };
  }

  /**
   * Get field autocomplete items for a specific table
   * @param {string} tableName - Table name
   * @returns {Array} Array of autocomplete items
   */
  getFieldAutocompleteItemsForTable(tableName) {
    if (!this.schemaParser) {
      return [];
    }
    return this.schemaParser.getAutocompleteItemsForTable(tableName);
  }

  /**
   * Filter fields for a specific table
   * @param {string} query - Search query
   * @param {string} tableName - Table name
   * @returns {Array} Filtered field items
   */
  filterFieldsForTable(query, tableName) {
    if (!this.schemaParser) {
      return [];
    }
    return this.schemaParser.filterFieldsForTable(query, tableName);
  }
```

**Step 3: Commit**

```bash
git add src/js/state.js
git commit -m "$(cat <<'EOF'
feat: add JOIN configuration state to AppState

Adds joinConfig object and methods for managing JOIN mode,
second table selection, and ON clause fields.
EOF
)"
```

---

## Task 3: Add SchemaParser Methods for Multi-Table Support

**Files:**

- Modify: `src/js/schemaParser.js`

**Step 1: Read current file to understand structure**

Read the file first to see the current implementation.

**Step 2: Add methods for table-specific field access**

Add these methods to the SchemaParser class:

```javascript
  /**
   * Check if a table name is a known/supported table
   * @param {string} tableName - Table name to check
   * @returns {boolean} True if known
   */
  isKnownTableName(tableName) {
    return SCHEMAS.hasOwnProperty(tableName);
  }

  /**
   * Get autocomplete items for a specific table
   * @param {string} tableName - Table name
   * @returns {Array} Array of autocomplete items
   */
  getAutocompleteItemsForTable(tableName) {
    if (!SCHEMAS[tableName]) {
      return [];
    }

    const items = [];
    const schema = SCHEMAS[tableName];
    const mappings = TABLE_MAPPINGS[tableName] || {};
    const customFields = mappings.fields || {};

    // Add custom mapping fields first
    for (const [key, config] of Object.entries(customFields)) {
      items.push({
        value: key,
        label: key,
        type: 'custom',
        isCustom: true,
        sql: config.sql,
        alias: config.alias,
        isBinary: false
      });
    }

    // Add schema fields
    for (const field of schema) {
      // Skip if already covered by custom mapping
      if (customFields[field.name]) continue;

      items.push({
        value: field.name,
        label: field.name,
        type: field.type,
        isCustom: false,
        isBinary: field.type === 'binary'
      });
    }

    return items;
  }

  /**
   * Filter fields for a specific table by query
   * @param {string} query - Search query
   * @param {string} tableName - Table name
   * @returns {Array} Filtered items
   */
  filterFieldsForTable(query, tableName) {
    const items = this.getAutocompleteItemsForTable(tableName);
    if (!query) return items;

    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().startsWith(lowerQuery)
    );
  }

  /**
   * Check if a field is binary for a specific table
   * @param {string} fieldName - Field name
   * @param {string} tableName - Table name
   * @returns {boolean} True if binary
   */
  isBinaryFieldForTable(fieldName, tableName) {
    if (!SCHEMAS[tableName]) return false;

    const field = SCHEMAS[tableName].find(f => f.name === fieldName);
    return field ? field.type === 'binary' : false;
  }
```

**Step 3: Commit**

```bash
git add src/js/schemaParser.js
git commit -m "$(cat <<'EOF'
feat: add table-specific field access methods to SchemaParser

Enables getting autocomplete items and filtering fields for any
specific table, needed for JOIN mode dual-table field selection.
EOF
)"
```

---

## Task 4: Add JOIN Query Generation to QueryBuilder

**Files:**

- Modify: `src/js/queryBuilder.js`

**Step 1: Add method to build JOIN clause**

Add after `buildFromClause` method (around line 220):

```javascript
  /**
   * Build JOIN clause with table alias and time range
   * @param {string} joinType - JOIN type
   * @param {string} tableName - Table name
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @param {string} timezone - Timezone offset
   * @param {string} alias - Table alias (t2)
   * @returns {string} JOIN clause
   */
  buildJoinClause(joinType, tableName, startTime, endTime, timezone, alias) {
    const tableWithTime = this.buildFromClause(tableName, startTime, endTime, timezone);
    return `${joinType}\n  ${tableWithTime} ${alias}`;
  }

  /**
   * Build ON clause for JOIN
   * @param {string} field1 - Field from first table
   * @param {string} field2 - Field from second table
   * @returns {string} ON clause
   */
  buildOnClause(field1, field2) {
    return `ON t1.${field1} = t2.${field2}`;
  }
```

**Step 2: Add method to generate JOIN query**

Add after the new methods:

```javascript
  /**
   * Generate SQL query with JOIN
   * @param {object} config - Query configuration
   * @returns {string} Generated SQL query
   */
  generateJoinQuery(config) {
    const {
      fieldRowsT1,
      fieldRowsT2,
      conditionRows,
      table1,
      table2,
      joinType,
      onField1,
      onField2,
      startTime,
      endTime,
      timezone,
      isDistinct
    } = config;

    // Build SELECT parts with table prefixes
    const selectPartsT1 = fieldRowsT1
      .map(row => this.buildSelectPartWithPrefix(row, 't1', table1))
      .filter(Boolean);

    const selectPartsT2 = fieldRowsT2
      .map(row => this.buildSelectPartWithPrefix(row, 't2', table2))
      .filter(Boolean);

    const allSelectParts = [...selectPartsT1, ...selectPartsT2];

    // Build WHERE parts with table prefixes
    const whereParts = conditionRows
      .map(row => this.buildWherePartWithPrefix(row))
      .filter(Boolean);

    // Build FROM clause with alias
    const fromClause = this.buildFromClause(table1, startTime, endTime, timezone);

    // Build JOIN clause
    const joinClause = this.buildJoinClause(joinType, table2, startTime, endTime, timezone, 't2');

    // Build ON clause
    const onClause = this.buildOnClause(onField1, onField2);

    // Assemble query
    let query = isDistinct ? 'SELECT DISTINCT\n' : 'SELECT\n';

    if (allSelectParts.length > 0) {
      query += allSelectParts.join(',\n');
    }

    query += '\nFROM\n';
    query += `  ${fromClause} t1\n`;
    query += joinClause + '\n';
    query += onClause;

    if (whereParts.length > 0) {
      query += '\nWHERE\n';
      query += whereParts.join('\n  AND ');
    }

    return query;
  }

  /**
   * Build SELECT part with table prefix
   * @param {object} fieldData - Field data
   * @param {string} prefix - Table prefix (t1 or t2)
   * @param {string} tableName - Table name for binary check
   * @returns {string|null} SQL SELECT expression
   */
  buildSelectPartWithPrefix(fieldData, prefix, tableName) {
    const { fieldName, fieldType, isCustom, isBinary, sql, alias } = fieldData;

    if (!fieldName) return null;

    // Custom mapping with predefined SQL
    if (isCustom && sql) {
      // Replace field references with prefixed versions
      const prefixedSql = sql.replace(/(\w+)(?=\s*[,)]|$)/g, (match) => {
        // Don't prefix function names or string literals
        if (/^[A-Z_]+$/.test(match) || /^'/.test(match)) {
          return match;
        }
        return `${prefix}.${match}`;
      });
      const finalAlias = alias || fieldName;
      return `  ${prefixedSql} AS ${finalAlias}`;
    }

    // Regular schema field
    const finalAlias = alias || this.getBaseName(fieldName);
    const prefixedField = `${prefix}.${fieldName}`;

    // Check if binary field needs BYTES2STR wrapping
    const isBinaryField = isBinary || this.state.schemaParser?.isBinaryFieldForTable(fieldName, tableName);

    if (isBinaryField) {
      return `  BYTES2STR(${prefixedField}) AS ${finalAlias}`;
    }

    return `  ${prefixedField} AS ${finalAlias}`;
  }

  /**
   * Build WHERE part with table prefix
   * @param {object} conditionData - Condition data
   * @returns {string|null} SQL WHERE expression
   */
  buildWherePartWithPrefix(conditionData) {
    if (!conditionData) return null;

    // Handle field-based conditions with prefix
    if (conditionData.type === 'field') {
      const { fieldName, tablePrefix, isBinary, operator, value, values } = conditionData;

      if (!fieldName) return null;

      const prefix = tablePrefix || 't1';
      const prefixedField = `${prefix}.${fieldName}`;
      const fieldExpr = isBinary ? `BYTES2STR(${prefixedField})` : prefixedField;

      if (operator === '=') {
        if (!value && value !== 0) return null;
        const escapedValue = this.escapeSqlString(value);
        return `  ${fieldExpr} = '${escapedValue}'`;
      }

      if (operator === 'IN' || operator === 'NOT IN') {
        if (!values || values.length === 0) return null;
        const escapedValues = values
          .map(v => `'${this.escapeSqlString(v.trim())}'`)
          .join(', ');
        return `  ${fieldExpr} ${operator} (${escapedValues})`;
      }

      return null;
    }

    // Template conditions pass through as-is
    return this.buildWherePart(conditionData);
  }
```

**Step 3: Commit**

```bash
git add src/js/queryBuilder.js
git commit -m "$(cat <<'EOF'
feat: add JOIN query generation to QueryBuilder

Adds methods for building JOIN clause, ON clause, and generating
complete JOIN queries with proper table aliases and prefixes.
EOF
)"
```

---

## Task 5: Add JOIN Section to HTML

**Files:**

- Modify: `sidepanel.html`

**Step 1: Add join keys script**

Add after the mapping script includes (after line 230):

```html
  <script src="src/js/joinKeys.js"></script>
```

**Step 2: Add JOIN section after table selector**

Find the FROM section (around line 128) and add the JOIN configuration section after the table form-group:

```html
      <!-- JOIN Configuration (hidden by default) -->
      <div class="form-group join-toggle-group">
        <label></label>
        <label class="checkbox-label" id="joinToggleLabel" style="display: none;">
          <input type="checkbox" id="joinToggle" />
          <span>Join with another table</span>
        </label>
      </div>

      <div id="joinConfigSection" class="join-config-section" style="display: none;">
        <div class="form-group">
          <label>Join Type:</label>
          <select id="joinType" class="input-field">
            <option value="INNER JOIN">INNER JOIN</option>
            <option value="LEFT OUTER JOIN">LEFT OUTER JOIN</option>
            <option value="FULL OUTER JOIN">FULL OUTER JOIN</option>
          </select>
          <button type="button" id="joinInfoBtn" class="btn-info" title="Learn about JOIN types">?</button>
        </div>
        <div class="form-group">
          <label>Table:</label>
          <div id="joinTableContainer" class="table-autocomplete-container"></div>
        </div>
        <div class="form-group">
          <label>ON:</label>
          <div id="onField1Container" class="on-field-container"></div>
          <span>=</span>
          <div id="onField2Container" class="on-field-container"></div>
        </div>
      </div>
```

**Step 3: Add JOIN info modal at end of container**

Add before the closing `</div>` of container (before the schema script includes):

```html
    <!-- JOIN Info Modal -->
    <div id="joinInfoModal" class="modal" style="display: none;">
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Understanding JOIN Types</h3>
          <button type="button" class="modal-close" id="closeJoinModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="join-type-grid">
            <div class="join-type-item">
              <div class="join-diagram inner-join">
                <svg viewBox="0 0 100 60" class="venn-diagram">
                  <circle cx="35" cy="30" r="25" class="circle-a"/>
                  <circle cx="65" cy="30" r="25" class="circle-b"/>
                  <path d="M50,10 A25,25 0 0,1 50,50 A25,25 0 0,1 50,10" class="intersection"/>
                  <text x="25" y="33" class="circle-label">A</text>
                  <text x="75" y="33" class="circle-label">B</text>
                </svg>
              </div>
              <div class="join-type-name">INNER JOIN</div>
              <div class="join-type-desc">Only matching rows from both tables</div>
            </div>
            <div class="join-type-item">
              <div class="join-diagram left-join">
                <svg viewBox="0 0 100 60" class="venn-diagram">
                  <circle cx="35" cy="30" r="25" class="circle-a filled"/>
                  <circle cx="65" cy="30" r="25" class="circle-b"/>
                  <text x="25" y="33" class="circle-label">A</text>
                  <text x="75" y="33" class="circle-label">B</text>
                </svg>
              </div>
              <div class="join-type-name">LEFT OUTER JOIN</div>
              <div class="join-type-desc">All from left table, matches from right</div>
            </div>
            <div class="join-type-item">
              <div class="join-diagram full-join">
                <svg viewBox="0 0 100 60" class="venn-diagram">
                  <circle cx="35" cy="30" r="25" class="circle-a filled"/>
                  <circle cx="65" cy="30" r="25" class="circle-b filled"/>
                  <text x="25" y="33" class="circle-label">A</text>
                  <text x="75" y="33" class="circle-label">B</text>
                </svg>
              </div>
              <div class="join-type-name">FULL OUTER JOIN</div>
              <div class="join-type-desc">All rows from both tables, NULL where no match</div>
            </div>
          </div>
          <div class="join-example">
            <strong>Example:</strong> Joining orders with customers
            <ul>
              <li><strong>INNER:</strong> Only orders that have a customer</li>
              <li><strong>LEFT:</strong> All orders, customer info if exists</li>
              <li><strong>FULL:</strong> All orders + all customers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
```

**Step 4: Modify SELECT section for dual-table support**

Replace the current SELECT section (around line 175-180) with:

```html
    <section class="section" id="selectSection">
      <h3 id="selectHeader">SELECT</h3>
      <div id="selectMessage" class="select-message">Select a table first</div>

      <!-- Single table fields (default) -->
      <div id="singleTableFields">
        <div id="selectFields" class="fields-container"></div>
        <button id="addFieldBtn" class="btn btn-secondary" disabled>+Add field</button>
      </div>

      <!-- Dual table fields (JOIN mode) -->
      <div id="dualTableFields" style="display: none;">
        <div class="table-fields-section">
          <h4 id="table1Header" class="table-fields-header">Table 1 (t1)</h4>
          <div id="selectFieldsT1" class="fields-container"></div>
          <button id="addFieldBtnT1" class="btn btn-secondary" disabled>+Add field</button>
        </div>
        <div class="table-fields-section">
          <h4 id="table2Header" class="table-fields-header">Table 2 (t2)</h4>
          <div id="selectFieldsT2" class="fields-container"></div>
          <button id="addFieldBtnT2" class="btn btn-secondary" disabled>+Add field</button>
        </div>
      </div>
    </section>
```

**Step 5: Commit**

```bash
git add sidepanel.html
git commit -m "$(cat <<'EOF'
feat: add JOIN UI section to HTML

Adds JOIN toggle checkbox, join configuration section, dual SELECT
field sections, and info modal with Venn diagrams explaining join types.
EOF
)"
```

---

## Task 6: Add JOIN Styles to CSS

**Files:**

- Modify: `src/css/styles.css`

**Step 1: Add JOIN-related styles**

Add at the end of the file:

```css
/* ============================================
   JOIN Feature Styles
   ============================================ */

/* JOIN Toggle Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  padding: var(--space-sm) 0;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.join-toggle-group {
  margin-bottom: 0;
}

/* JOIN Configuration Section */
.join-config-section {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);
}

.join-config-section .form-group {
  margin-bottom: var(--space-sm);
}

.join-config-section .form-group:last-child {
  margin-bottom: 0;
}

/* Info Button */
.btn-info {
  width: 24px;
  height: 24px;
  padding: 0;
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-info:hover {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* ON Field Containers */
.on-field-container {
  position: relative;
  flex: 1;
  min-width: 100px;
  max-width: 150px;
}

/* Dual Table Fields Sections */
.table-fields-section {
  margin-bottom: var(--space-md);
  padding: var(--space-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.table-fields-section:last-child {
  margin-bottom: 0;
}

.table-fields-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
  text-transform: none;
  letter-spacing: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.table-fields-header::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
}

.table-fields-section:nth-child(2) .table-fields-header::before {
  background-color: var(--color-accent);
}

/* ============================================
   JOIN Info Modal
   ============================================ */

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin-bottom: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: none;
  letter-spacing: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  padding: 0;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--space-lg);
}

/* JOIN Type Grid */
.join-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.join-type-item {
  text-align: center;
}

.join-diagram {
  padding: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.venn-diagram {
  width: 100%;
  height: auto;
}

.venn-diagram .circle-a,
.venn-diagram .circle-b {
  fill: none;
  stroke: var(--color-border-hover);
  stroke-width: 2;
}

.venn-diagram .circle-a.filled,
.venn-diagram .circle-b.filled {
  fill: var(--color-primary-light);
  stroke: var(--color-primary);
}

.venn-diagram .intersection {
  fill: var(--color-primary);
  stroke: none;
}

.venn-diagram .circle-label {
  font-size: 12px;
  fill: var(--color-text-muted);
  font-weight: 500;
}

.join-type-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}

.join-type-desc {
  font-size: 10px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

/* JOIN Example Box */
.join-example {
  padding: var(--space-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.join-example strong {
  color: var(--color-text-primary);
}

.join-example ul {
  margin: var(--space-sm) 0 0 var(--space-lg);
  padding: 0;
}

.join-example li {
  margin-bottom: var(--space-xs);
}

.join-example li:last-child {
  margin-bottom: 0;
}

/* Dark mode adjustments */
[data-theme="dark"] .modal-backdrop {
  background-color: rgba(0, 0, 0, 0.7);
}
```

**Step 2: Commit**

```bash
git add src/css/styles.css
git commit -m "$(cat <<'EOF'
feat: add JOIN feature styles

Adds styling for JOIN toggle, configuration section, dual SELECT
sections, info modal with Venn diagrams, and dark mode support.
EOF
)"
```

---

## Task 7: Add JOIN UI Methods to UIManager

**Files:**

- Modify: `src/js/ui.js`

**Step 1: Add new element caching**

In `cacheElements()` method, add after existing elements (around line 51):

```javascript
      // JOIN-related elements
      joinToggle: document.getElementById('joinToggle'),
      joinToggleLabel: document.getElementById('joinToggleLabel'),
      joinConfigSection: document.getElementById('joinConfigSection'),
      joinType: document.getElementById('joinType'),
      joinInfoBtn: document.getElementById('joinInfoBtn'),
      joinTableContainer: document.getElementById('joinTableContainer'),
      onField1Container: document.getElementById('onField1Container'),
      onField2Container: document.getElementById('onField2Container'),
      joinInfoModal: document.getElementById('joinInfoModal'),
      closeJoinModal: document.getElementById('closeJoinModal'),
      // Dual table SELECT elements
      singleTableFields: document.getElementById('singleTableFields'),
      dualTableFields: document.getElementById('dualTableFields'),
      selectFieldsT1: document.getElementById('selectFieldsT1'),
      selectFieldsT2: document.getElementById('selectFieldsT2'),
      addFieldBtnT1: document.getElementById('addFieldBtnT1'),
      addFieldBtnT2: document.getElementById('addFieldBtnT2'),
      table1Header: document.getElementById('table1Header'),
      table2Header: document.getElementById('table2Header'),
```

**Step 2: Add field autocomplete maps for JOIN mode**

In the constructor (around line 11), add:

```javascript
    this.fieldAutocompletesT1 = new Map(); // For JOIN mode table 1
    this.fieldAutocompletesT2 = new Map(); // For JOIN mode table 2
    this.joinTableAutocomplete = null;
    this.onField1Autocomplete = null;
    this.onField2Autocomplete = null;
```

**Step 3: Add JOIN UI methods**

Add these methods to the UIManager class:

```javascript
  /**
   * Show the JOIN toggle after table selection
   */
  showJoinToggle() {
    if (this.elements.joinToggleLabel) {
      this.elements.joinToggleLabel.style.display = 'flex';
    }
  }

  /**
   * Hide the JOIN toggle and reset JOIN state
   */
  hideJoinToggle() {
    if (this.elements.joinToggleLabel) {
      this.elements.joinToggleLabel.style.display = 'none';
    }
    if (this.elements.joinToggle) {
      this.elements.joinToggle.checked = false;
    }
    this.hideJoinConfig();
  }

  /**
   * Show JOIN configuration section
   */
  showJoinConfig() {
    if (this.elements.joinConfigSection) {
      this.elements.joinConfigSection.style.display = 'block';
    }
    this.initJoinTableAutocomplete();
    this.switchToJoinSelectMode();
  }

  /**
   * Hide JOIN configuration section
   */
  hideJoinConfig() {
    if (this.elements.joinConfigSection) {
      this.elements.joinConfigSection.style.display = 'none';
    }
    this.destroyJoinAutocompletes();
    this.switchToSingleSelectMode();
  }

  /**
   * Initialize JOIN table autocomplete
   */
  initJoinTableAutocomplete() {
    if (!this.elements.joinTableContainer) return;

    const currentTable = this.state.getSelectedTable();
    const supportedTables = this.state.getSupportedTables()
      .filter(t => t !== currentTable);

    this.joinTableAutocomplete = new Autocomplete({
      container: this.elements.joinTableContainer,
      getItems: () => supportedTables.map(t => ({
        value: t,
        label: t,
        type: 'table'
      })),
      filterItems: (query) => {
        const items = supportedTables.map(t => ({
          value: t,
          label: t,
          type: 'table'
        }));
        if (!query) return items;
        const lowerQuery = query.toLowerCase();
        return items.filter(item => item.label.toLowerCase().startsWith(lowerQuery));
      },
      onSelect: (item) => this.handleJoinTableSelect(item.value),
      placeholder: 'Select second table...',
      emptyMessage: 'No matching tables',
      allowCustom: false,
      debounceMs: 250
    });
  }

  /**
   * Handle JOIN table selection
   * @param {string} tableName - Selected table name
   */
  handleJoinTableSelect(tableName) {
    this.state.setJoinTable(tableName);

    // Update table 2 header
    if (this.elements.table2Header) {
      this.elements.table2Header.textContent = `${tableName} (t2)`;
    }

    // Enable add field button for table 2
    if (this.elements.addFieldBtnT2) {
      this.elements.addFieldBtnT2.disabled = false;
    }

    // Initialize ON field autocompletes
    this.initOnFieldAutocompletes();

    // Add initial field row for table 2
    this.addFieldRowForTable('t2');
  }

  /**
   * Initialize ON clause field autocompletes
   */
  initOnFieldAutocompletes() {
    const table1 = this.state.getSelectedTable();
    const table2 = this.state.getJoinTable();
    const suggestions = typeof getJoinKeySuggestions === 'function'
      ? getJoinKeySuggestions(table1, table2)
      : [];

    // ON field 1 (from table 1)
    if (this.elements.onField1Container) {
      if (this.onField1Autocomplete) {
        this.onField1Autocomplete.destroy();
      }

      this.onField1Autocomplete = new Autocomplete({
        container: this.elements.onField1Container,
        getItems: () => this.getOnFieldItems(table1, suggestions),
        filterItems: (query) => this.filterOnFieldItems(query, table1, suggestions),
        onSelect: (item) => {
          const onFields = this.state.getJoinOnFields();
          this.state.setJoinOnFields(item.value, onFields.field2);
        },
        placeholder: 't1.field',
        emptyMessage: 'No fields',
        allowCustom: true,
        debounceMs: 250
      });
    }

    // ON field 2 (from table 2)
    if (this.elements.onField2Container) {
      if (this.onField2Autocomplete) {
        this.onField2Autocomplete.destroy();
      }

      this.onField2Autocomplete = new Autocomplete({
        container: this.elements.onField2Container,
        getItems: () => this.getOnFieldItems(table2, suggestions),
        filterItems: (query) => this.filterOnFieldItems(query, table2, suggestions),
        onSelect: (item) => {
          const onFields = this.state.getJoinOnFields();
          this.state.setJoinOnFields(onFields.field1, item.value);
        },
        placeholder: 't2.field',
        emptyMessage: 'No fields',
        allowCustom: true,
        debounceMs: 250
      });
    }
  }

  /**
   * Get ON field items with suggestions first
   * @param {string} tableName - Table name
   * @param {Array} suggestions - Suggested field names
   * @returns {Array} Autocomplete items
   */
  getOnFieldItems(tableName, suggestions) {
    const allItems = this.state.getFieldAutocompleteItemsForTable(tableName);

    // Separate suggested and other items
    const suggestedItems = [];
    const otherItems = [];

    for (const item of allItems) {
      if (suggestions.includes(item.value)) {
        suggestedItems.push({ ...item, isSuggested: true });
      } else {
        otherItems.push(item);
      }
    }

    return [...suggestedItems, ...otherItems];
  }

  /**
   * Filter ON field items
   * @param {string} query - Search query
   * @param {string} tableName - Table name
   * @param {Array} suggestions - Suggested field names
   * @returns {Array} Filtered items
   */
  filterOnFieldItems(query, tableName, suggestions) {
    const items = this.getOnFieldItems(tableName, suggestions);
    if (!query) return items;

    const lowerQuery = query.toLowerCase();
    return items.filter(item => item.label.toLowerCase().startsWith(lowerQuery));
  }

  /**
   * Destroy JOIN-related autocompletes
   */
  destroyJoinAutocompletes() {
    if (this.joinTableAutocomplete) {
      this.joinTableAutocomplete.destroy();
      this.joinTableAutocomplete = null;
    }
    if (this.onField1Autocomplete) {
      this.onField1Autocomplete.destroy();
      this.onField1Autocomplete = null;
    }
    if (this.onField2Autocomplete) {
      this.onField2Autocomplete.destroy();
      this.onField2Autocomplete = null;
    }

    // Clear table 2 fields
    this.fieldAutocompletesT2.forEach(ac => ac.destroy());
    this.fieldAutocompletesT2.clear();
  }

  /**
   * Switch to JOIN mode SELECT (dual sections)
   */
  switchToJoinSelectMode() {
    if (this.elements.singleTableFields) {
      this.elements.singleTableFields.style.display = 'none';
    }
    if (this.elements.dualTableFields) {
      this.elements.dualTableFields.style.display = 'block';
    }

    // Update table 1 header
    const table1 = this.state.getSelectedTable();
    if (this.elements.table1Header) {
      this.elements.table1Header.textContent = `${table1} (t1)`;
    }

    // Move existing fields to table 1 section and enable button
    this.migrateFieldsToT1();
    if (this.elements.addFieldBtnT1) {
      this.elements.addFieldBtnT1.disabled = false;
    }
  }

  /**
   * Switch to single table SELECT mode
   */
  switchToSingleSelectMode() {
    if (this.elements.singleTableFields) {
      this.elements.singleTableFields.style.display = 'block';
    }
    if (this.elements.dualTableFields) {
      this.elements.dualTableFields.style.display = 'none';
    }

    // Clear table-specific field containers
    this.fieldAutocompletesT1.forEach(ac => ac.destroy());
    this.fieldAutocompletesT1.clear();
    this.fieldAutocompletesT2.forEach(ac => ac.destroy());
    this.fieldAutocompletesT2.clear();

    if (this.elements.selectFieldsT1) {
      this.elements.selectFieldsT1.innerHTML = '';
    }
    if (this.elements.selectFieldsT2) {
      this.elements.selectFieldsT2.innerHTML = '';
    }
  }

  /**
   * Migrate existing single-table fields to T1 section
   */
  migrateFieldsToT1() {
    // Get current field data
    const fieldData = this.getFieldRowsData();

    // Clear T1 container
    if (this.elements.selectFieldsT1) {
      this.elements.selectFieldsT1.innerHTML = '';
    }
    this.fieldAutocompletesT1.forEach(ac => ac.destroy());
    this.fieldAutocompletesT1.clear();

    // Re-create fields in T1
    if (fieldData.length > 0) {
      fieldData.forEach(data => {
        if (data.fieldName) {
          this.addFieldRowForTableWithData('t1', data);
        }
      });
    } else {
      this.addFieldRowForTable('t1');
    }
  }

  /**
   * Add field row for a specific table in JOIN mode
   * @param {string} tablePrefix - 't1' or 't2'
   */
  addFieldRowForTable(tablePrefix) {
    const container = tablePrefix === 't1'
      ? this.elements.selectFieldsT1
      : this.elements.selectFieldsT2;
    const autocompleteMap = tablePrefix === 't1'
      ? this.fieldAutocompletesT1
      : this.fieldAutocompletesT2;
    const tableName = tablePrefix === 't1'
      ? this.state.getSelectedTable()
      : this.state.getJoinTable();

    if (!container || !tableName) return;

    const fieldId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const fieldRow = document.createElement('div');
    fieldRow.className = 'field-row';
    fieldRow.dataset.fieldId = fieldId;
    fieldRow.dataset.tablePrefix = tablePrefix;

    // Create autocomplete container
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'field-autocomplete-container';

    // Create alias input
    const asLabel = document.createElement('span');
    asLabel.className = 'as-label';
    asLabel.textContent = 'AS';

    const aliasInput = document.createElement('input');
    aliasInput.type = 'text';
    aliasInput.className = 'field-alias input-field';
    aliasInput.placeholder = 'alias';

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = '\u00d7';
    removeBtn.addEventListener('click', () => {
      const ac = autocompleteMap.get(fieldId);
      if (ac) {
        ac.destroy();
        autocompleteMap.delete(fieldId);
      }
      fieldRow.remove();
    });

    // Assemble row
    fieldRow.appendChild(autocompleteContainer);
    fieldRow.appendChild(asLabel);
    fieldRow.appendChild(aliasInput);
    fieldRow.appendChild(removeBtn);

    container.appendChild(fieldRow);

    // Create autocomplete
    const autocomplete = new Autocomplete({
      container: autocompleteContainer,
      getItems: () => this.state.getFieldAutocompleteItemsForTable(tableName),
      filterItems: (query) => this.state.filterFieldsForTable(query, tableName),
      onSelect: (item) => this.handleFieldSelect(item, aliasInput),
      placeholder: 'Type to search fields...',
      emptyMessage: 'No matching fields',
      allowCustom: true,
      debounceMs: 250
    });

    autocompleteMap.set(fieldId, autocomplete);
    autocomplete.focus();
  }

  /**
   * Add field row for table with pre-populated data
   * @param {string} tablePrefix - 't1' or 't2'
   * @param {object} fieldData - Field data
   */
  addFieldRowForTableWithData(tablePrefix, fieldData) {
    const container = tablePrefix === 't1'
      ? this.elements.selectFieldsT1
      : this.elements.selectFieldsT2;
    const autocompleteMap = tablePrefix === 't1'
      ? this.fieldAutocompletesT1
      : this.fieldAutocompletesT2;
    const tableName = tablePrefix === 't1'
      ? this.state.getSelectedTable()
      : this.state.getJoinTable();

    if (!container || !tableName) return;

    const fieldId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const fieldRow = document.createElement('div');
    fieldRow.className = 'field-row';
    fieldRow.dataset.fieldId = fieldId;
    fieldRow.dataset.tablePrefix = tablePrefix;

    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'field-autocomplete-container';

    const asLabel = document.createElement('span');
    asLabel.className = 'as-label';
    asLabel.textContent = 'AS';

    const aliasInput = document.createElement('input');
    aliasInput.type = 'text';
    aliasInput.className = 'field-alias input-field';
    aliasInput.placeholder = 'alias';
    aliasInput.value = fieldData.alias || '';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = '\u00d7';
    removeBtn.addEventListener('click', () => {
      const ac = autocompleteMap.get(fieldId);
      if (ac) {
        ac.destroy();
        autocompleteMap.delete(fieldId);
      }
      fieldRow.remove();
    });

    fieldRow.appendChild(autocompleteContainer);
    fieldRow.appendChild(asLabel);
    fieldRow.appendChild(aliasInput);
    fieldRow.appendChild(removeBtn);

    container.appendChild(fieldRow);

    const autocomplete = new Autocomplete({
      container: autocompleteContainer,
      getItems: () => this.state.getFieldAutocompleteItemsForTable(tableName),
      filterItems: (query) => this.state.filterFieldsForTable(query, tableName),
      onSelect: (item) => this.handleFieldSelect(item, aliasInput),
      placeholder: 'Type to search fields...',
      emptyMessage: 'No matching fields',
      allowCustom: true,
      debounceMs: 250
    });

    if (fieldData.fieldName) {
      autocomplete.setValue(fieldData.fieldName);
    }

    autocompleteMap.set(fieldId, autocomplete);
  }

  /**
   * Get field rows data for a specific table in JOIN mode
   * @param {string} tablePrefix - 't1' or 't2'
   * @returns {Array} Field row data
   */
  getFieldRowsDataForTable(tablePrefix) {
    const container = tablePrefix === 't1'
      ? this.elements.selectFieldsT1
      : this.elements.selectFieldsT2;
    const autocompleteMap = tablePrefix === 't1'
      ? this.fieldAutocompletesT1
      : this.fieldAutocompletesT2;

    if (!container) return [];

    const fieldRows = container.querySelectorAll('.field-row');
    return Array.from(fieldRows).map(row => {
      const fieldId = row.dataset.fieldId;
      const autocomplete = autocompleteMap.get(fieldId);
      const aliasInput = row.querySelector('.field-alias');

      const selectedItem = autocomplete ? autocomplete.getSelectedItem() : null;
      const inputValue = autocomplete ? autocomplete.getValue() : '';

      return {
        fieldName: selectedItem ? selectedItem.value : inputValue,
        fieldType: selectedItem ? selectedItem.type : 'custom',
        isCustom: selectedItem ? selectedItem.isCustom : true,
        isBinary: selectedItem ? selectedItem.isBinary : false,
        sql: selectedItem ? selectedItem.sql : null,
        alias: aliasInput.value || (selectedItem ? selectedItem.alias : inputValue)
      };
    });
  }

  /**
   * Show JOIN info modal
   */
  showJoinInfoModal() {
    if (this.elements.joinInfoModal) {
      this.elements.joinInfoModal.style.display = 'flex';
    }
  }

  /**
   * Hide JOIN info modal
   */
  hideJoinInfoModal() {
    if (this.elements.joinInfoModal) {
      this.elements.joinInfoModal.style.display = 'none';
    }
  }
```

**Step 4: Commit**

```bash
git add src/js/ui.js
git commit -m "$(cat <<'EOF'
feat: add JOIN UI methods to UIManager

Adds methods for managing JOIN toggle, configuration section, dual
SELECT sections, ON field autocompletes, and info modal display.
EOF
)"
```

---

## Task 8: Wire Up JOIN Event Handlers in App.js

**Files:**

- Modify: `src/js/app.js`

**Step 1: Add JOIN event handlers**

Add after the UI initialization (after `ui.init();` around line 203):

```javascript
  // JOIN Toggle handler
  const joinToggle = document.getElementById('joinToggle');
  const joinType = document.getElementById('joinType');
  const joinInfoBtn = document.getElementById('joinInfoBtn');
  const joinInfoModal = document.getElementById('joinInfoModal');
  const closeJoinModal = document.getElementById('closeJoinModal');
  const modalBackdrop = joinInfoModal?.querySelector('.modal-backdrop');
  const addFieldBtnT1 = document.getElementById('addFieldBtnT1');
  const addFieldBtnT2 = document.getElementById('addFieldBtnT2');

  if (joinToggle) {
    joinToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      appState.setJoinEnabled(enabled);

      if (enabled) {
        ui.showJoinConfig();
      } else {
        ui.hideJoinConfig();
      }
    });
  }

  if (joinType) {
    joinType.addEventListener('change', (e) => {
      appState.setJoinType(e.target.value);
    });
  }

  // JOIN Info Modal handlers
  if (joinInfoBtn) {
    joinInfoBtn.addEventListener('click', () => ui.showJoinInfoModal());
  }

  if (closeJoinModal) {
    closeJoinModal.addEventListener('click', () => ui.hideJoinInfoModal());
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', () => ui.hideJoinInfoModal());
  }

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && joinInfoModal?.style.display === 'flex') {
      ui.hideJoinInfoModal();
    }
  });

  // Add field buttons for JOIN mode
  if (addFieldBtnT1) {
    addFieldBtnT1.addEventListener('click', () => ui.addFieldRowForTable('t1'));
  }

  if (addFieldBtnT2) {
    addFieldBtnT2.addEventListener('click', () => ui.addFieldRowForTable('t2'));
  }
```

**Step 2: Modify handleTableSelect to show JOIN toggle**

Find the `handleTableSelect` method call in ui.js or modify the table autocomplete `onSelect` handler. In `ui.js`, update `handleTableSelect` method:

```javascript
  handleTableSelect(tableName) {
    this.state.setSelectedTable(tableName);
    this.updateSelectSectionState();
    this.rebuildAllFieldAutocompletes();
    this.rebuildConditionOptions();

    // Show JOIN toggle for known tables
    if (this.state.isKnownTable()) {
      this.showJoinToggle();
    } else {
      this.hideJoinToggle();
    }

    // Focus time input after table selection
    this.elements.startTime.focus();
  }
```

**Step 3: Update generate button handler for JOIN queries**

In `app.js`, modify the generate button click handler. Find the Standard/Distinct Mode section (around line 370) and update it:

```javascript
      // Standard query needs table selection
      if (!fromData.tableName) {
        ui.showTimeError('Please select a table');
        return;
      }

      let query;

      // Check if JOIN mode is enabled
      if (appState.isJoinEnabled()) {
        const joinConfig = appState.getJoinConfig();

        // Validate JOIN configuration
        if (!joinConfig.table2) {
          ui.showTimeError('Please select a second table for JOIN');
          return;
        }

        const onFields = appState.getJoinOnFields();
        if (!onFields.field1 || !onFields.field2) {
          ui.showTimeError('Please select fields for the ON clause');
          return;
        }

        // Get field rows for both tables
        const fieldRowsT1 = ui.getFieldRowsDataForTable('t1');
        const fieldRowsT2 = ui.getFieldRowsDataForTable('t2');

        if (fieldRowsT1.length === 0 && fieldRowsT2.length === 0) {
          ui.showTimeError('Please add at least one field');
          return;
        }

        const conditionRows = ui.getConditionRowsData();

        query = queryBuilder.generateJoinQuery({
          fieldRowsT1,
          fieldRowsT2,
          conditionRows,
          table1: fromData.tableName,
          table2: joinConfig.table2,
          joinType: joinConfig.joinType,
          onField1: onFields.field1,
          onField2: onFields.field2,
          startTime: fromData.startTime,
          endTime: fromData.endTime,
          timezone: fromData.timezone,
          isDistinct: appState.isDistinctMode()
        });

        // Save to history with JOIN config
        historyManager.save({
          queryType: appState.queryType,
          tableName: fromData.tableName,
          fieldRows: fieldRowsT1,
          fieldRowsT2: fieldRowsT2,
          conditionRows,
          timeStart: fromData.startTime,
          timeEnd: fromData.endTime,
          timezone: fromData.timezone,
          joinConfig: joinConfig
        }, query);
      } else {
        // Standard single-table query (existing code)
        const fieldRows = ui.getFieldRowsData();
        const conditionRows = ui.getConditionRowsData();

        query = queryBuilder.generate({
          fieldRows,
          conditionRows,
          tableName: fromData.tableName,
          startTime: fromData.startTime,
          endTime: fromData.endTime,
          timezone: fromData.timezone,
          isDistinct: appState.isDistinctMode()
        });

        // Save to history
        historyManager.save({
          queryType: appState.queryType,
          tableName: fromData.tableName,
          fieldRows,
          conditionRows,
          timeStart: fromData.startTime,
          timeEnd: fromData.endTime,
          timezone: fromData.timezone
        }, query);
      }

      ui.setQueryOutput(query);
      renderHistoryList();
```

**Step 4: Commit**

```bash
git add src/js/app.js src/js/ui.js
git commit -m "$(cat <<'EOF'
feat: wire up JOIN event handlers and query generation

Connects JOIN toggle, info modal, and field buttons to UI methods.
Updates generate button to handle JOIN queries with proper validation.
EOF
)"
```

---

## Task 9: Update History and Snippet Managers for JOIN Support

**Files:**

- Modify: `src/js/historyManager.js`
- Modify: `src/js/snippetManager.js`

**Step 1: Read current files to understand structure**

Read both files to see current implementation.

**Step 2: Update loadHistoryConfig in ui.js to handle JOIN config**

In `ui.js`, update the `loadHistoryConfig` method to restore JOIN state:

```javascript
  loadHistoryConfig(config) {
    if (!config) return;

    // Set table
    if (this.tableAutocomplete && config.tableName) {
      this.tableAutocomplete.setValue(config.tableName);
      this.state.setSelectedTable(config.tableName);
      this.updateSelectSectionState();
    }

    // Handle JOIN configuration
    if (config.joinConfig && config.joinConfig.enabled) {
      this.state.setJoinConfig(config.joinConfig);

      // Check the toggle
      if (this.elements.joinToggle) {
        this.elements.joinToggle.checked = true;
      }

      // Show JOIN config UI
      this.showJoinConfig();

      // Set JOIN table
      if (this.joinTableAutocomplete && config.joinConfig.table2) {
        this.joinTableAutocomplete.setValue(config.joinConfig.table2);
        this.state.setJoinTable(config.joinConfig.table2);

        // Update table 2 header
        if (this.elements.table2Header) {
          this.elements.table2Header.textContent = `${config.joinConfig.table2} (t2)`;
        }

        // Initialize ON field autocompletes
        this.initOnFieldAutocompletes();

        // Set ON field values
        if (this.onField1Autocomplete && config.joinConfig.onField1) {
          this.onField1Autocomplete.setValue(config.joinConfig.onField1);
        }
        if (this.onField2Autocomplete && config.joinConfig.onField2) {
          this.onField2Autocomplete.setValue(config.joinConfig.onField2);
        }
      }

      // Set JOIN type
      if (this.elements.joinType && config.joinConfig.joinType) {
        this.elements.joinType.value = config.joinConfig.joinType;
      }

      // Load T1 fields
      this.fieldAutocompletesT1.forEach(ac => ac.destroy());
      this.fieldAutocompletesT1.clear();
      if (this.elements.selectFieldsT1) {
        this.elements.selectFieldsT1.innerHTML = '';
      }

      if (config.fieldRows && config.fieldRows.length > 0) {
        config.fieldRows.forEach(fieldData => {
          this.addFieldRowForTableWithData('t1', fieldData);
        });
      }

      // Load T2 fields
      this.fieldAutocompletesT2.forEach(ac => ac.destroy());
      this.fieldAutocompletesT2.clear();
      if (this.elements.selectFieldsT2) {
        this.elements.selectFieldsT2.innerHTML = '';
      }

      if (config.fieldRowsT2 && config.fieldRowsT2.length > 0) {
        config.fieldRowsT2.forEach(fieldData => {
          this.addFieldRowForTableWithData('t2', fieldData);
        });
      }

      // Enable T2 add button
      if (this.elements.addFieldBtnT2) {
        this.elements.addFieldBtnT2.disabled = false;
      }
    } else {
      // Reset JOIN state
      this.state.resetJoinConfig();
      if (this.elements.joinToggle) {
        this.elements.joinToggle.checked = false;
      }
      this.hideJoinConfig();

      // Load regular fields
      this.fieldAutocompletes.forEach(ac => ac.destroy());
      this.fieldAutocompletes.clear();
      if (this.elements.selectFields) {
        this.elements.selectFields.innerHTML = '';
      }

      if (config.fieldRows && config.fieldRows.length > 0) {
        config.fieldRows.forEach(fieldData => {
          this.addFieldRowWithData(fieldData);
        });
      } else if (this.elements.selectFields) {
        this.addFieldRow({ autoFocus: false });
      }
    }

    // Set time range
    if (this.elements.startTime && config.timeStart) {
      this.elements.startTime.value = config.timeStart;
    }
    if (this.elements.endTime && config.timeEnd) {
      this.elements.endTime.value = config.timeEnd;
    }
    if (this.elements.timezone && config.timezone) {
      this.elements.timezone.value = config.timezone;
    }

    // Load condition rows
    this.conditionFieldAutocompletes.forEach(ac => ac.destroy());
    this.conditionFieldAutocompletes.clear();
    if (this.elements.whereConditions) {
      this.elements.whereConditions.innerHTML = '';
    }

    if (config.conditionRows && config.conditionRows.length > 0) {
      config.conditionRows.forEach(conditionData => {
        this.addConditionRowWithData(conditionData);
      });
    }
  }
```

**Step 3: Update resetForm to clear JOIN state**

In `ui.js`, update the `resetForm` method:

```javascript
  resetForm() {
    // Clear table selection
    if (this.tableAutocomplete) {
      this.tableAutocomplete.setValue('');
    }
    this.state.setSelectedTable('');
    this.updateSelectSectionState();

    // Reset JOIN state
    this.state.resetJoinConfig();
    if (this.elements.joinToggle) {
      this.elements.joinToggle.checked = false;
    }
    this.hideJoinToggle();
    this.hideJoinConfig();

    // ... rest of existing resetForm code
```

**Step 4: Commit**

```bash
git add src/js/ui.js
git commit -m "$(cat <<'EOF'
feat: update history loading to restore JOIN configuration

loadHistoryConfig now properly restores JOIN state including second
table, ON clause fields, and dual SELECT sections.
EOF
)"
```

---

## Task 10: Update CLAUDE.md and Spec Documentation

**Files:**

- Modify: `CLAUDE.md`

**Step 1: Update architecture section**

Add JOIN-related information to the Query Modes table:

```markdown
### Query Modes

The extension supports three query modes:

| Mode | Description |
|------|-------------|
| **Standard** | Build custom SELECT queries with multiple field selection (supports JOIN) |
| **Distinct** | Build SELECT DISTINCT queries with single field |
| **Quick Query** | Use predefined query templates (simplified UI) |

### JOIN Support

Standard mode includes optional JOIN functionality:
- Supports INNER JOIN, LEFT OUTER JOIN, FULL OUTER JOIN
- Visual Venn diagrams explain each join type
- Smart suggestions for common join keys between tables
- Dual SELECT sections for adding fields from both tables
```

**Step 2: Add to Files section**

```markdown
├── src/
│   ├── js/
│   │   ├── joinKeys.js     # Common join key definitions
```

**Step 3: Update "Adding New Features" section**

Add a section about JOIN configuration.

**Step 4: Commit**

```bash
git add CLAUDE.md spec/2.4.0.md
git commit -m "$(cat <<'EOF'
docs: update documentation for JOIN feature

Updates CLAUDE.md with JOIN mode documentation and ensures
spec/2.4.0.md is complete.
EOF
)"
```

---

## Task 11: Manual Testing Checklist

After implementation, manually test:

1. **JOIN Toggle**
   - [ ] Toggle appears after selecting first table
   - [ ] Toggle is hidden for custom tables
   - [ ] Enabling shows JOIN config section
   - [ ] Disabling reverts to single-table mode

2. **JOIN Configuration**
   - [ ] Join type dropdown works (INNER, LEFT OUTER, FULL OUTER)
   - [ ] "?" button opens info modal
   - [ ] Second table dropdown excludes first table
   - [ ] ON field autocompletes show suggested keys first

3. **SELECT Sections**
   - [ ] Two separate field sections appear in JOIN mode
   - [ ] Each section has correct table name in header
   - [ ] Add field buttons work for each section

4. **Generated SQL**
   - [ ] Correct table aliases (t1, t2)
   - [ ] Correct JOIN type keyword
   - [ ] Correct ON clause
   - [ ] Fields properly prefixed

5. **Info Modal**
   - [ ] Opens on "?" click
   - [ ] Shows all three join types with diagrams
   - [ ] Closes on X, backdrop click, Escape

6. **History/Restore**
   - [ ] JOIN queries saved to history
   - [ ] Loading history restores JOIN state
   - [ ] Form reset clears JOIN state

---

Plan complete and saved to `docs/plans/2025-01-26-join-feature.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
