/**
 * UIManager - Handles all DOM operations and user interactions
 */

class UIManager {
  constructor(state) {
    this.state = state;
    this.elements = {};
    this.tableAutocomplete = null;
    this.fieldAutocompletes = new Map(); // Map of fieldId -> Autocomplete instance
    this.conditionFieldAutocompletes = new Map(); // Map of conditionId -> Autocomplete instance for field conditions

    // JOIN mode autocomplete maps
    this.fieldAutocompletesT1 = new Map(); // For JOIN mode table 1
    this.fieldAutocompletesT2 = new Map(); // For JOIN mode table 2
    this.joinTableAutocomplete = null;
    this.onField1Autocomplete = null;
    this.onField2Autocomplete = null;
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
      addFieldConditionBtn: document.getElementById('addFieldConditionBtn'),
      addConditionBtn: document.getElementById('addConditionBtn'),
      generateBtn: document.getElementById('generateBtn'),
      copyBtn: document.getElementById('copyBtn'),
      clearBtn: document.getElementById('clearBtn'),
      saveSnippetBtn: document.getElementById('saveSnippetBtn'),
      selectHeader: document.getElementById('selectHeader'),
      startTime: document.getElementById('startTime'),
      endTime: document.getElementById('endTime'),
      timezone: document.getElementById('timezone'),
      queryOutput: document.getElementById('queryOutput'),
      timeError: document.getElementById('timeError'),
      // Snippet-related elements
      snippetSelect: document.getElementById('snippetSelect'),
      snippetPreview: document.getElementById('snippetPreview'),
      snippetActions: document.getElementById('snippetActions'),
      renameSnippetBtn: document.getElementById('renameSnippetBtn'),
      deleteSnippetBtn: document.getElementById('deleteSnippetBtn'),

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
      table2Header: document.getElementById('table2Header')
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

    // Show JOIN toggle for known tables
    if (this.state.isKnownTable()) {
      this.showJoinToggle();
    } else {
      this.hideJoinToggle();
    }

    // Focus time input after table selection
    this.elements.startTime.focus();
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

    // Add one field row to start (skip auto-focus since we focus time input)
    this.addFieldRow({ autoFocus: false });
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
   * @param {object} options - Options for field row creation
   * @param {boolean} options.autoFocus - Whether to auto-focus the new field (default: true)
   */
  addFieldRow(options = {}) {
    const { autoFocus = true } = options;
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

    // Focus the new autocomplete if autoFocus is enabled
    if (autoFocus) {
      autocomplete.focus();
    }
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
   * Add a new field-based WHERE condition row
   */
  addFieldConditionRow() {
    const conditionId = Date.now().toString();
    const conditionRow = document.createElement('div');
    conditionRow.className = 'condition-row field-condition-row';
    conditionRow.dataset.conditionId = conditionId;
    conditionRow.dataset.conditionType = 'field';

    // Create field autocomplete container
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'field-condition-autocomplete-container';

    // Create operator select
    const operatorSelect = document.createElement('select');
    operatorSelect.className = 'condition-operator input-field';
    operatorSelect.innerHTML = `
      <option value="=">=</option>
      <option value="IN">IN</option>
      <option value="NOT IN">NOT IN</option>
    `;

    // Create value input (single line for =, multi-line for IN/NOT IN)
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'condition-field-value input-field';
    valueInput.placeholder = 'Value';

    // Create multi-value textarea (hidden by default)
    const multiValueInput = document.createElement('textarea');
    multiValueInput.className = 'condition-multi-value input-field';
    multiValueInput.placeholder = 'One value per line';
    multiValueInput.style.display = 'none';
    multiValueInput.rows = 3;

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = '\u00d7';

    // Assemble row
    conditionRow.appendChild(fieldContainer);
    conditionRow.appendChild(operatorSelect);
    conditionRow.appendChild(valueInput);
    conditionRow.appendChild(multiValueInput);
    conditionRow.appendChild(removeBtn);

    this.elements.whereConditions.appendChild(conditionRow);

    // Create autocomplete for field selection
    const isKnownTable = this.state.isKnownTable();
    const autocomplete = new Autocomplete({
      container: fieldContainer,
      getItems: () => this.state.getFieldAutocompleteItems(),
      filterItems: (query) => this.state.filterFields(query),
      onSelect: (item) => {
        // Store field info on the row for later use
        conditionRow.dataset.fieldName = item.value;
        conditionRow.dataset.isBinary = item.isBinary || false;
      },
      placeholder: isKnownTable ? 'Select field...' : 'Enter field...',
      emptyMessage: isKnownTable ? 'No matching fields' : 'Type field name',
      allowCustom: true,
      debounceMs: 250
    });

    this.conditionFieldAutocompletes.set(conditionId, autocomplete);

    // Handle operator change
    operatorSelect.addEventListener('change', (e) => {
      const isMultiValue = e.target.value === 'IN' || e.target.value === 'NOT IN';
      valueInput.style.display = isMultiValue ? 'none' : 'inline-block';
      multiValueInput.style.display = isMultiValue ? 'block' : 'none';
    });

    // Handle remove
    removeBtn.addEventListener('click', () => {
      const ac = this.conditionFieldAutocompletes.get(conditionId);
      if (ac) {
        ac.destroy();
        this.conditionFieldAutocompletes.delete(conditionId);
      }
      conditionRow.remove();
    });

    // Focus the field autocomplete
    autocomplete.focus();
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
   * Get data from all condition rows (both field conditions and template conditions)
   * @returns {Array} Array of condition row data
   */
  getConditionRowsData() {
    const conditionRows = this.elements.whereConditions.querySelectorAll('.condition-row');
    return Array.from(conditionRows).map(row => {
      const isFieldCondition = row.dataset.conditionType === 'field';

      if (isFieldCondition) {
        const conditionId = row.dataset.conditionId;
        const autocomplete = this.conditionFieldAutocompletes.get(conditionId);
        const selectedItem = autocomplete ? autocomplete.getSelectedItem() : null;
        const inputValue = autocomplete ? autocomplete.getValue() : '';

        const operatorSelect = row.querySelector('.condition-operator');
        const valueInput = row.querySelector('.condition-field-value');
        const multiValueInput = row.querySelector('.condition-multi-value');

        const operator = operatorSelect.value;
        const isMultiValue = operator === 'IN' || operator === 'NOT IN';

        return {
          type: 'field',
          fieldName: selectedItem ? selectedItem.value : inputValue,
          isBinary: selectedItem ? selectedItem.isBinary : this.state.isBinaryField(inputValue),
          operator: operator,
          value: isMultiValue ? null : valueInput.value,
          values: isMultiValue ? multiValueInput.value.split('\n').filter(v => v.trim()) : null
        };
      } else {
        // Template condition (existing behavior)
        return {
          type: 'template',
          conditionType: row.querySelector('.condition-type').value,
          customValue: row.querySelector('.condition-value').value
        };
      }
    });
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

  /**
   * Show time validation error
   * @param {string} message - Error message
   */
  showTimeError(message) {
    if (this.elements.timeError) {
      this.elements.timeError.textContent = message;
      this.elements.timeError.style.display = 'block';
    }
  }

  /**
   * Hide time validation error
   */
  hideTimeError() {
    if (this.elements.timeError) {
      this.elements.timeError.style.display = 'none';
    }
  }

  /**
   * Refresh the snippet dropdown with current snippets
   */
  refreshSnippetDropdown() {
    if (!this.elements.snippetSelect) return;

    const snippets = snippetManager.getAll();
    let html = '<option value="">-- Select Snippet --</option>';

    snippets.forEach(snippet => {
      html += `<option value="${snippet.id}">${snippet.name}</option>`;
    });

    this.elements.snippetSelect.innerHTML = html;
  }

  /**
   * Show snippet preview
   * @param {object} snippet - Snippet object
   */
  showSnippetPreview(snippet) {
    if (!this.elements.snippetPreview) return;

    if (snippet) {
      this.elements.snippetPreview.textContent = snippet.preview || '';
      this.elements.snippetPreview.style.display = 'block';
      if (this.elements.snippetActions) {
        this.elements.snippetActions.style.display = 'flex';
      }
    } else {
      this.elements.snippetPreview.style.display = 'none';
      if (this.elements.snippetActions) {
        this.elements.snippetActions.style.display = 'none';
      }
    }
  }

  /**
   * Load snippet data into the UI for editing or viewing
   * @param {object} snippet - Snippet object to load
   */
  loadSnippetData(snippet) {
    if (!snippet) return;

    // Set table
    if (this.tableAutocomplete && snippet.tableName) {
      this.tableAutocomplete.setValue(snippet.tableName);
      this.state.setSelectedTable(snippet.tableName);
      this.updateSelectSectionState();
    }

    // Clear and reload field rows
    this.fieldAutocompletes.forEach(ac => ac.destroy());
    this.fieldAutocompletes.clear();
    this.elements.selectFields.innerHTML = '';

    if (snippet.fieldRows && snippet.fieldRows.length > 0) {
      snippet.fieldRows.forEach(fieldData => {
        this.addFieldRowWithData(fieldData);
      });
    }

    // Clear and reload condition rows
    this.conditionFieldAutocompletes.forEach(ac => ac.destroy());
    this.conditionFieldAutocompletes.clear();
    this.elements.whereConditions.innerHTML = '';

    if (snippet.conditionRows && snippet.conditionRows.length > 0) {
      snippet.conditionRows.forEach(conditionData => {
        this.addConditionRowWithData(conditionData);
      });
    }
  }

  /**
   * Add a field row with pre-populated data
   * @param {object} fieldData - Field data to populate
   */
  addFieldRowWithData(fieldData) {
    const fieldId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
    aliasInput.value = fieldData.alias || '';

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

    // Set the initial value
    if (fieldData.fieldName) {
      autocomplete.setValue(fieldData.fieldName);
    }

    this.fieldAutocompletes.set(fieldId, autocomplete);
  }

  /**
   * Add a condition row with pre-populated data
   * @param {object} conditionData - Condition data to populate
   */
  addConditionRowWithData(conditionData) {
    if (conditionData.type === 'field') {
      this.addFieldConditionRowWithData(conditionData);
    } else {
      this.addTemplateConditionRowWithData(conditionData);
    }
  }

  /**
   * Add a field condition row with pre-populated data
   * @param {object} conditionData - Condition data to populate
   */
  addFieldConditionRowWithData(conditionData) {
    const conditionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const conditionRow = document.createElement('div');
    conditionRow.className = 'condition-row field-condition-row';
    conditionRow.dataset.conditionId = conditionId;
    conditionRow.dataset.conditionType = 'field';

    // Create field autocomplete container
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'field-condition-autocomplete-container';

    // Create operator select
    const operatorSelect = document.createElement('select');
    operatorSelect.className = 'condition-operator input-field';
    operatorSelect.innerHTML = `
      <option value="=" ${conditionData.operator === '=' ? 'selected' : ''}>=</option>
      <option value="IN" ${conditionData.operator === 'IN' ? 'selected' : ''}>IN</option>
      <option value="NOT IN" ${conditionData.operator === 'NOT IN' ? 'selected' : ''}>NOT IN</option>
    `;

    const isMultiValue = conditionData.operator === 'IN' || conditionData.operator === 'NOT IN';

    // Create value input
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'condition-field-value input-field';
    valueInput.placeholder = 'Value';
    valueInput.value = conditionData.value || '';
    valueInput.style.display = isMultiValue ? 'none' : 'inline-block';

    // Create multi-value textarea
    const multiValueInput = document.createElement('textarea');
    multiValueInput.className = 'condition-multi-value input-field';
    multiValueInput.placeholder = 'One value per line';
    multiValueInput.rows = 3;
    multiValueInput.value = conditionData.values ? conditionData.values.join('\n') : '';
    multiValueInput.style.display = isMultiValue ? 'block' : 'none';

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = '\u00d7';

    // Assemble row
    conditionRow.appendChild(fieldContainer);
    conditionRow.appendChild(operatorSelect);
    conditionRow.appendChild(valueInput);
    conditionRow.appendChild(multiValueInput);
    conditionRow.appendChild(removeBtn);

    this.elements.whereConditions.appendChild(conditionRow);

    // Create autocomplete for field selection
    const isKnownTable = this.state.isKnownTable();
    const autocomplete = new Autocomplete({
      container: fieldContainer,
      getItems: () => this.state.getFieldAutocompleteItems(),
      filterItems: (query) => this.state.filterFields(query),
      onSelect: (item) => {
        conditionRow.dataset.fieldName = item.value;
        conditionRow.dataset.isBinary = item.isBinary || false;
      },
      placeholder: isKnownTable ? 'Select field...' : 'Enter field...',
      emptyMessage: isKnownTable ? 'No matching fields' : 'Type field name',
      allowCustom: true,
      debounceMs: 250
    });

    // Set the initial value
    if (conditionData.fieldName) {
      autocomplete.setValue(conditionData.fieldName);
    }

    this.conditionFieldAutocompletes.set(conditionId, autocomplete);

    // Handle operator change
    operatorSelect.addEventListener('change', (e) => {
      const isMulti = e.target.value === 'IN' || e.target.value === 'NOT IN';
      valueInput.style.display = isMulti ? 'none' : 'inline-block';
      multiValueInput.style.display = isMulti ? 'block' : 'none';
    });

    // Handle remove
    removeBtn.addEventListener('click', () => {
      const ac = this.conditionFieldAutocompletes.get(conditionId);
      if (ac) {
        ac.destroy();
        this.conditionFieldAutocompletes.delete(conditionId);
      }
      conditionRow.remove();
    });
  }

  /**
   * Add a template condition row with pre-populated data
   * @param {object} conditionData - Condition data to populate
   */
  addTemplateConditionRowWithData(conditionData) {
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
        const selected = key === conditionData.conditionType ? 'selected' : '';
        optionsHtml += `<option value="${key}" ${selected}>${condition.label}</option>`;
      }
    }

    const customSelected = conditionData.conditionType === 'custom' ? 'selected' : '';
    optionsHtml += `<option value="custom" ${customSelected}>Custom</option>`;

    const showCustom = conditionData.conditionType === 'custom' ? 'inline-block' : 'none';

    conditionRow.innerHTML = `
      <select class="condition-type input-field">
        ${optionsHtml}
      </select>
      <input type="text" class="condition-value input-field" placeholder="Custom SQL condition" style="display:${showCustom};" value="${conditionData.customValue || ''}" />
      <button class="btn-remove">\u00d7</button>
    `;

    this.elements.whereConditions.appendChild(conditionRow);
    this.attachConditionRowListeners(conditionRow);
  }

  /**
   * Load history configuration into the form
   * @param {object} config - History config object
   */
  loadHistoryConfig(config) {
    if (!config) return;

    // Set table
    if (this.tableAutocomplete && config.tableName) {
      this.tableAutocomplete.setValue(config.tableName);
      this.state.setSelectedTable(config.tableName);
      this.updateSelectSectionState();
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

    // Handle JOIN configuration
    if (config.joinConfig && config.joinConfig.enabled) {
      this.state.setJoinConfig(config.joinConfig);

      // Show JOIN toggle for known tables
      if (this.state.isKnownTable()) {
        this.showJoinToggle();
      }

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

      // Show JOIN toggle for known tables
      if (this.state.isKnownTable()) {
        this.showJoinToggle();
      } else {
        this.hideJoinToggle();
      }

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

    // Clear and reload condition rows
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

  /**
   * Reset the form to its default empty state
   */
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

    // Clear time inputs
    if (this.elements.startTime) {
      this.elements.startTime.value = '';
    }
    if (this.elements.endTime) {
      this.elements.endTime.value = '';
    }
    if (this.elements.timezone) {
      this.elements.timezone.value = '0';
    }

    // Clear field rows
    this.fieldAutocompletes.forEach(ac => ac.destroy());
    this.fieldAutocompletes.clear();
    if (this.elements.selectFields) {
      this.elements.selectFields.innerHTML = '';
    }

    // Clear condition rows
    this.conditionFieldAutocompletes.forEach(ac => ac.destroy());
    this.conditionFieldAutocompletes.clear();
    if (this.elements.whereConditions) {
      this.elements.whereConditions.innerHTML = '';
    }

    // Clear query output
    if (this.elements.queryOutput) {
      this.elements.queryOutput.value = '';
    }

    // Hide error messages
    this.hideTimeError();
  }

  // ============================================
  // JOIN Mode Methods
  // ============================================

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

}
