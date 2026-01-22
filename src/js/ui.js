/**
 * UIManager - Handles all DOM operations and user interactions
 */

class UIManager {
  constructor(state) {
    this.state = state;
    this.elements = {};
    this.tableAutocomplete = null;
    this.fieldAutocompletes = new Map(); // Map of fieldId -> Autocomplete instance
  }

  /**
   * Initialize the UI manager
   */
  init() {
    this.cacheElements();
    this.initTableAutocomplete();
    this.updateSelectSectionState();
  }

  /**
   * Cache DOM element references
   */
  cacheElements() {
    this.elements = {
      tableContainer: document.getElementById('tableContainer'),
      selectFields: document.getElementById('selectFields'),
      selectSection: document.getElementById('selectSection'),
      selectMessage: document.getElementById('selectMessage'),
      whereConditions: document.getElementById('whereConditions'),
      addFieldBtn: document.getElementById('addFieldBtn'),
      addConditionBtn: document.getElementById('addConditionBtn'),
      generateBtn: document.getElementById('generateBtn'),
      copyBtn: document.getElementById('copyBtn'),
      clearBtn: document.getElementById('clearBtn'),
      selectHeader: document.getElementById('selectHeader'),
      startTime: document.getElementById('startTime'),
      endTime: document.getElementById('endTime'),
      timezone: document.getElementById('timezone'),
      queryOutput: document.getElementById('queryOutput')
    };
  }

  /**
   * Initialize the table autocomplete
   */
  initTableAutocomplete() {
    const supportedTables = this.state.getSupportedTables();

    this.tableAutocomplete = new Autocomplete({
      container: this.elements.tableContainer,
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
      onSelect: (item) => this.handleTableSelect(item.value),
      onChange: (value) => this.handleTableChange(value),
      placeholder: 'Type table name...',
      emptyMessage: 'No matching tables',
      allowCustom: true,
      debounceMs: 250
    });
  }

  /**
   * Handle table selection from autocomplete
   * @param {string} tableName - Selected table name
   */
  handleTableSelect(tableName) {
    this.state.setSelectedTable(tableName);
    this.updateSelectSectionState();
    this.rebuildAllFieldAutocompletes();
    this.rebuildConditionOptions();
  }

  /**
   * Handle table input change (for custom tables)
   * @param {string} tableName - Table name being typed
   */
  handleTableChange(tableName) {
    // Update state with current value
    this.state.setSelectedTable(tableName);
    this.updateSelectSectionState();
  }

  /**
   * Update SELECT section state based on table selection
   */
  updateSelectSectionState() {
    const hasTable = this.state.hasSelectedTable();
    const isKnownTable = this.state.isKnownTable();

    if (!hasTable) {
      // No table selected - show message
      if (this.elements.selectMessage) {
        this.elements.selectMessage.textContent = 'Select a table first';
        this.elements.selectMessage.style.display = 'block';
      }
      this.elements.addFieldBtn.disabled = true;
      return;
    }

    // Table selected
    if (this.elements.selectMessage) {
      if (isKnownTable) {
        this.elements.selectMessage.style.display = 'none';
      } else {
        this.elements.selectMessage.textContent = 'Custom table - type field names manually';
        this.elements.selectMessage.style.display = 'block';
      }
    }
    this.elements.addFieldBtn.disabled = false;
  }

  /**
   * Rebuild all existing field autocompletes with new table schema
   */
  rebuildAllFieldAutocompletes() {
    // Clear existing autocompletes
    this.fieldAutocompletes.forEach(ac => ac.destroy());
    this.fieldAutocompletes.clear();
    this.elements.selectFields.innerHTML = '';

    // Add one field row to start
    this.addFieldRow();
  }

  /**
   * Rebuild WHERE condition options based on current table
   */
  rebuildConditionOptions() {
    // Clear existing conditions
    this.elements.whereConditions.innerHTML = '';
  }

  /**
   * Add a new field row with autocomplete
   */
  addFieldRow() {
    const fieldId = Date.now().toString();
    const fieldRow = document.createElement('div');
    fieldRow.className = 'field-row';
    fieldRow.dataset.fieldId = fieldId;

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
      const ac = this.fieldAutocompletes.get(fieldId);
      if (ac) {
        ac.destroy();
        this.fieldAutocompletes.delete(fieldId);
      }
      fieldRow.remove();
    });

    // Assemble row
    fieldRow.appendChild(autocompleteContainer);
    fieldRow.appendChild(asLabel);
    fieldRow.appendChild(aliasInput);
    fieldRow.appendChild(removeBtn);

    this.elements.selectFields.appendChild(fieldRow);

    // Create autocomplete for this field
    const isKnownTable = this.state.isKnownTable();
    const autocomplete = new Autocomplete({
      container: autocompleteContainer,
      getItems: () => this.state.getFieldAutocompleteItems(),
      filterItems: (query) => this.state.filterFields(query),
      onSelect: (item) => this.handleFieldSelect(item, aliasInput),
      placeholder: isKnownTable ? 'Type to search fields...' : 'Enter field name...',
      emptyMessage: isKnownTable ? 'No matching fields' : 'Type field name',
      allowCustom: true,
      debounceMs: 250
    });

    this.fieldAutocompletes.set(fieldId, autocomplete);

    // Focus the new autocomplete
    autocomplete.focus();
  }

  /**
   * Handle field selection from autocomplete
   * @param {object} item - Selected item
   * @param {HTMLInputElement} aliasInput - Alias input element
   */
  handleFieldSelect(item, aliasInput) {
    if (!item) return;

    if (item.isCustom && item.alias) {
      // Custom mapping with predefined alias
      aliasInput.value = item.alias;
      aliasInput.disabled = true;
    } else {
      // Schema field or custom input - use base name as alias
      const baseName = item.value.includes('.')
        ? item.value.split('.').pop()
        : item.value;
      aliasInput.value = baseName;
      aliasInput.disabled = false;
    }
  }

  /**
   * Add a new WHERE condition row
   */
  addConditionRow() {
    const conditionId = Date.now();
    const conditionRow = document.createElement('div');
    conditionRow.className = 'condition-row';
    conditionRow.dataset.conditionId = conditionId;

    // Get conditions for current table
    const conditions = this.state.getWhereConditions();
    const hasConditions = Object.keys(conditions).length > 0;

    let optionsHtml = '<option value="">-- Select Condition --</option>';

    if (hasConditions) {
      for (const [key, condition] of Object.entries(conditions)) {
        optionsHtml += `<option value="${key}">${condition.label}</option>`;
      }
    }

    optionsHtml += '<option value="custom">Custom</option>';

    conditionRow.innerHTML = `
      <select class="condition-type input-field">
        ${optionsHtml}
      </select>
      <input type="text" class="condition-value input-field" placeholder="Custom SQL condition" style="display:none;" />
      <button class="btn-remove">\u00d7</button>
    `;

    this.elements.whereConditions.appendChild(conditionRow);
    this.attachConditionRowListeners(conditionRow);
  }

  /**
   * Attach event listeners to a condition row
   * @param {HTMLElement} conditionRow - Condition row element
   */
  attachConditionRowListeners(conditionRow) {
    const typeSelector = conditionRow.querySelector('.condition-type');
    const valueInput = conditionRow.querySelector('.condition-value');
    const removeBtn = conditionRow.querySelector('.btn-remove');

    typeSelector.addEventListener('change', (e) => {
      valueInput.style.display = e.target.value === 'custom' ? 'inline-block' : 'none';
    });

    removeBtn.addEventListener('click', () => conditionRow.remove());
  }

  /**
   * Handle query type change (standard/distinct)
   * @param {boolean} isDistinct - Whether distinct mode is enabled
   */
  handleQueryTypeChange(isDistinct) {
    this.elements.addFieldBtn.style.display = isDistinct ? 'none' : '';
    this.elements.selectHeader.textContent = isDistinct ? 'SELECT DISTINCT' : 'SELECT';

    if (!isDistinct) return;

    // Keep only first field row in distinct mode
    const fieldRows = this.elements.selectFields.querySelectorAll('.field-row');
    fieldRows.forEach((row, index) => {
      if (index > 0) {
        const fieldId = row.dataset.fieldId;
        const ac = this.fieldAutocompletes.get(fieldId);
        if (ac) {
          ac.destroy();
          this.fieldAutocompletes.delete(fieldId);
        }
        row.remove();
      }
    });
  }

  /**
   * Get data from all field rows
   * @returns {Array} Array of field row data
   */
  getFieldRowsData() {
    const fieldRows = this.elements.selectFields.querySelectorAll('.field-row');
    return Array.from(fieldRows).map(row => {
      const fieldId = row.dataset.fieldId;
      const autocomplete = this.fieldAutocompletes.get(fieldId);
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
   * Get data from all condition rows
   * @returns {Array} Array of condition row data
   */
  getConditionRowsData() {
    const conditionRows = this.elements.whereConditions.querySelectorAll('.condition-row');
    return Array.from(conditionRows).map(row => ({
      conditionType: row.querySelector('.condition-type').value,
      customValue: row.querySelector('.condition-value').value
    }));
  }

  /**
   * Get FROM clause data
   * @returns {object} FROM clause data
   */
  getFromClauseData() {
    const tableName = this.tableAutocomplete
      ? this.tableAutocomplete.getValue()
      : '';

    return {
      tableName: tableName || 'imp_join_all2',
      startTime: this.elements.startTime.value,
      endTime: this.elements.endTime.value,
      timezone: this.elements.timezone.value
    };
  }

  /**
   * Set the query output
   * @param {string} query - Generated SQL query
   */
  setQueryOutput(query) {
    this.elements.queryOutput.value = query;
  }

  /**
   * Copy query to clipboard
   */
  async copyToClipboard() {
    const text = this.elements.queryOutput.value;

    try {
      await navigator.clipboard.writeText(text);
      this.showCopyFeedback();
    } catch (err) {
      this.elements.queryOutput.select();
      document.execCommand('copy');
      this.showCopyFeedback();
    }
  }

  /**
   * Show copy feedback on button
   */
  showCopyFeedback() {
    const originalText = this.elements.copyBtn.textContent;
    this.elements.copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      this.elements.copyBtn.textContent = originalText;
    }, 2000);
  }
}
