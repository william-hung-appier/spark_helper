/**
 * Autocomplete - Reusable autocomplete/combobox component
 *
 * Provides a searchable input with dropdown suggestions.
 * Supports keyboard navigation and debounced filtering.
 */

class Autocomplete {
  /**
   * Create an autocomplete instance
   * @param {object} options - Configuration options
   * @param {HTMLElement} options.container - Container element with input and dropdown
   * @param {Function} options.getItems - Function that returns items to display
   * @param {Function} options.filterItems - Function to filter items by query
   * @param {Function} options.onSelect - Callback when item is selected
   * @param {Function} options.onChange - Callback when input value changes
   * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 250)
   * @param {boolean} options.allowCustom - Allow custom values not in list (default: true)
   * @param {string} options.placeholder - Input placeholder text
   * @param {string} options.emptyMessage - Message when no items match
   */
  constructor(options) {
    this.container = options.container;
    this.getItems = options.getItems || (() => []);
    this.filterItems = options.filterItems || this.defaultFilter.bind(this);
    this.onSelect = options.onSelect || (() => {});
    this.onChange = options.onChange || (() => {});
    this.debounceMs = options.debounceMs || 250;
    this.allowCustom = options.allowCustom !== false;
    this.placeholder = options.placeholder || 'Type to search...';
    this.emptyMessage = options.emptyMessage || 'No matches found';

    this.input = null;
    this.dropdown = null;
    this.selectedIndex = -1;
    this.isOpen = false;
    this.debounceTimer = null;
    this.currentValue = '';
    this.selectedItem = null;

    this.init();
  }

  /**
   * Initialize the autocomplete component
   */
  init() {
    // Create input element
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'autocomplete-input input-field';
    this.input.placeholder = this.placeholder;
    this.input.autocomplete = 'off';

    // Create dropdown element
    this.dropdown = document.createElement('ul');
    this.dropdown.className = 'autocomplete-dropdown';

    // Add to container
    this.container.classList.add('autocomplete-container');
    this.container.appendChild(this.input);
    this.container.appendChild(this.dropdown);

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Input events
    this.input.addEventListener('input', this.handleInput.bind(this));
    this.input.addEventListener('focus', this.handleFocus.bind(this));
    this.input.addEventListener('blur', this.handleBlur.bind(this));
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));

    // Dropdown events (using mousedown to fire before blur)
    this.dropdown.addEventListener('mousedown', this.handleDropdownClick.bind(this));
  }

  /**
   * Default filter function (prefix match, case-insensitive)
   * @param {string} query - Search query
   * @returns {Array} Filtered items
   */
  defaultFilter(query) {
    const items = this.getItems();
    if (!query) return items;

    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().startsWith(lowerQuery)
    );
  }

  /**
   * Handle input changes with debouncing
   * @param {Event} e - Input event
   */
  handleInput(e) {
    const value = e.target.value;
    this.currentValue = value;
    this.selectedItem = null;

    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce the filter operation
    this.debounceTimer = setTimeout(() => {
      this.updateDropdown(value);
      this.onChange(value);
    }, this.debounceMs);
  }

  /**
   * Handle input focus
   */
  handleFocus() {
    this.updateDropdown(this.currentValue);
    this.open();
  }

  /**
   * Handle input blur
   */
  handleBlur() {
    // Delay close to allow click events on dropdown
    setTimeout(() => {
      this.close();
    }, 150);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeydown(e) {
    // Only select actual items (not separators)
    const items = this.dropdown.querySelectorAll('.autocomplete-item');
    const itemCount = items.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.isOpen) {
          this.open();
        } else {
          this.selectedIndex = Math.min(this.selectedIndex + 1, itemCount - 1);
          this.highlightItem(items);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.highlightItem(items);
        break;

      case 'Enter':
        e.preventDefault();
        if (this.isOpen && itemCount > 0) {
          // If user has navigated, use selected item; otherwise use first item
          const indexToSelect = this.selectedIndex >= 0 ? this.selectedIndex : 0;
          this.selectItem(items[indexToSelect].dataset);
        } else if (this.allowCustom && this.currentValue) {
          // No suggestions available - accept as custom value
          this.selectItem({ value: this.currentValue, label: this.currentValue, isCustom: 'true' });
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  /**
   * Handle dropdown item click
   * @param {MouseEvent} e - Mouse event
   */
  handleDropdownClick(e) {
    const item = e.target.closest('.autocomplete-item');
    if (item) {
      e.preventDefault();
      this.selectItem(item.dataset);
    }
  }

  /**
   * Update dropdown with filtered items
   * @param {string} query - Search query
   */
  updateDropdown(query) {
    const items = this.filterItems(query);
    this.dropdown.innerHTML = '';
    this.selectedIndex = -1;

    if (items.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'autocomplete-empty';
      emptyItem.textContent = this.emptyMessage;
      this.dropdown.appendChild(emptyItem);
      return;
    }

    items.forEach((item, index) => {
      // Handle separators
      if (item.isSeparator) {
        const sep = document.createElement('li');
        sep.className = 'autocomplete-separator';
        sep.textContent = item.label;
        this.dropdown.appendChild(sep);
        return;
      }

      const li = document.createElement('li');
      li.className = 'autocomplete-item';
      li.dataset.value = item.value;
      li.dataset.label = item.label;
      li.dataset.type = item.type || '';
      li.dataset.isCustom = item.isCustom || false;
      li.dataset.isBinary = item.isBinary || false;
      if (item.sql) li.dataset.sql = item.sql;
      if (item.alias) li.dataset.alias = item.alias;

      // Array operation specific data
      if (item.isArrayOp) {
        li.dataset.isArrayOp = 'true';
        li.dataset.operation = item.operation || '';
        li.dataset.subField = item.subField || '';
        li.dataset.subFieldType = item.subFieldType || '';
        li.dataset.outputType = item.outputType || '';
        li.classList.add('autocomplete-item-array-op');
      }

      // Raw array indicator
      if (item.isRawArray) {
        li.dataset.isRawArray = 'true';
      }

      // Create label with type indicator
      const labelSpan = document.createElement('span');
      labelSpan.className = 'autocomplete-item-label';
      labelSpan.textContent = item.displayLabel || item.label;
      li.appendChild(labelSpan);

      // Type badge
      if (item.isArrayOp) {
        const typeSpan = document.createElement('span');
        typeSpan.className = 'autocomplete-item-type autocomplete-item-array-op-type';
        typeSpan.textContent = item.outputType || 'op';
        li.appendChild(typeSpan);
      } else if (item.type && item.type !== 'custom' && item.type !== 'array-op') {
        const typeSpan = document.createElement('span');
        typeSpan.className = 'autocomplete-item-type';
        typeSpan.textContent = item.type;
        li.appendChild(typeSpan);
      } else if (item.isCustom) {
        const customSpan = document.createElement('span');
        customSpan.className = 'autocomplete-item-type autocomplete-item-custom';
        customSpan.textContent = 'custom';
        li.appendChild(customSpan);
      }

      this.dropdown.appendChild(li);
    });
  }

  /**
   * Highlight selected item
   * @param {NodeList} items - Dropdown items
   */
  highlightItem(items) {
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === this.selectedIndex);
    });

    // Scroll highlighted item into view
    if (items[this.selectedIndex]) {
      items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Select an item
   * @param {object} itemData - Item data from dataset
   */
  selectItem(itemData) {
    this.currentValue = itemData.value;
    this.input.value = itemData.label;
    this.selectedItem = {
      value: itemData.value,
      label: itemData.label,
      type: itemData.type,
      isCustom: itemData.isCustom === 'true',
      isBinary: itemData.isBinary === 'true',
      sql: itemData.sql,
      alias: itemData.alias,
      // Array operation specific fields
      isArrayOp: itemData.isArrayOp === 'true',
      operation: itemData.operation || null,
      subField: itemData.subField || null,
      subFieldType: itemData.subFieldType || null,
      outputType: itemData.outputType || null,
      isRawArray: itemData.isRawArray === 'true'
    };
    this.close();
    this.onSelect(this.selectedItem);
  }

  /**
   * Open the dropdown
   */
  open() {
    this.isOpen = true;
    this.dropdown.classList.add('open');
  }

  /**
   * Close the dropdown
   */
  close() {
    this.isOpen = false;
    this.dropdown.classList.remove('open');
    this.selectedIndex = -1;
  }

  /**
   * Set the input value programmatically
   * @param {string} value - Value to set
   * @param {object} item - Optional item data to restore selectedItem
   */
  setValue(value, item = null) {
    this.currentValue = value;
    this.input.value = value;
    if (item) {
      this.selectedItem = item;
    }
  }

  /**
   * Set the selected item and update display
   * @param {object} item - Item data to set
   */
  setSelectedItem(item) {
    if (!item) return;
    this.selectedItem = item;
    this.currentValue = item.value;
    this.input.value = item.label || item.value;
  }

  /**
   * Get the current value
   * @returns {string} Current value
   */
  getValue() {
    return this.currentValue;
  }

  /**
   * Get the selected item
   * @returns {object|null} Selected item or null
   */
  getSelectedItem() {
    return this.selectedItem;
  }

  /**
   * Clear the input
   */
  clear() {
    this.currentValue = '';
    this.input.value = '';
    this.selectedItem = null;
  }

  /**
   * Enable the input
   */
  enable() {
    this.input.disabled = false;
    this.container.classList.remove('disabled');
  }

  /**
   * Disable the input
   */
  disable() {
    this.input.disabled = true;
    this.container.classList.add('disabled');
    this.close();
  }

  /**
   * Focus the input
   */
  focus() {
    this.input.focus();
  }

  /**
   * Destroy the autocomplete instance
   */
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.container.innerHTML = '';
    this.container.classList.remove('autocomplete-container');
  }
}
