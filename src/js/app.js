/**
 * Main Application Entry Point
 *
 * Initializes the Spark Query Builder extension and wires up event handlers.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize schema parser and connect to state
  const schemaParser = new SchemaParser();
  appState.setSchemaParser(schemaParser);

  // Initialize query builder with state access
  const queryBuilder = new QueryBuilder(appState);

  // Initialize UI manager
  const ui = new UIManager(appState);

  // Cache additional elements for quick access mode
  const quickAccessSection = document.getElementById('quickAccessSection');
  const quickQuerySelect = document.getElementById('quickQuerySelect');
  const quickStartTime = document.getElementById('quickStartTime');
  const quickEndTime = document.getElementById('quickEndTime');
  const quickTimezone = document.getElementById('quickTimezone');
  const quickTimeError = document.getElementById('quickTimeError');

  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const templatesTab = document.getElementById('templatesTab');
  const snippetsTab = document.getElementById('snippetsTab');
  const snippetSelect = document.getElementById('snippetSelect');
  const snippetPreview = document.getElementById('snippetPreview');
  const snippetActions = document.getElementById('snippetActions');
  const renameSnippetBtn = document.getElementById('renameSnippetBtn');
  const deleteSnippetBtn = document.getElementById('deleteSnippetBtn');
  const saveSnippetBtn = document.getElementById('saveSnippetBtn');

  // Track current active tab and selected snippet
  let activeTab = 'templates';
  let selectedSnippet = null;

  // Standard mode sections (to hide when in quick query mode)
  const standardSections = [
    document.querySelector('.section:has(#tableContainer)'), // FROM section
    document.getElementById('selectSection'),                 // SELECT section
    document.querySelector('.section:has(#whereConditions)')  // WHERE section
  ].filter(Boolean);

  // Theme management
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  };

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  initTheme();

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Initialize UI
  ui.init();

  /**
   * Toggle between standard and quick access modes
   * @param {boolean} isQuickMode - Whether to enable quick access mode
   */
  const toggleQuickQueryMode = (isQuickMode) => {
    // Show/hide quick access section
    quickAccessSection.style.display = isQuickMode ? 'block' : 'none';

    // Show/hide standard sections
    standardSections.forEach(section => {
      if (section) {
        section.style.display = isQuickMode ? 'none' : 'block';
      }
    });

    // Show/hide save snippet button (only in standard/distinct mode)
    if (saveSnippetBtn) {
      saveSnippetBtn.style.display = isQuickMode ? 'none' : '';
    }

    // Update state
    if (isQuickMode) {
      appState.setQueryType('quick');
      // Refresh snippet dropdown when entering quick mode
      ui.refreshSnippetDropdown();
    }
  };

  // Event listeners
  ui.elements.addFieldBtn.addEventListener('click', () => ui.addFieldRow());
  ui.elements.addFieldConditionBtn.addEventListener('click', () => ui.addFieldConditionRow());
  ui.elements.addConditionBtn.addEventListener('click', () => ui.addConditionRow());

  ui.elements.generateBtn.addEventListener('click', () => {
    const isQuickMode = appState.queryType === 'quick';

    if (isQuickMode) {
      const startTime = quickStartTime.value;
      const endTime = quickEndTime.value;
      const timezone = quickTimezone.value;

      // Validate time range
      const timeValidation = queryBuilder.validateTimeRange(startTime, endTime);
      if (!timeValidation.valid) {
        quickTimeError.textContent = timeValidation.error;
        quickTimeError.style.display = 'block';
        return;
      }
      quickTimeError.style.display = 'none';

      if (activeTab === 'templates') {
        // Quick Query Template Mode
        const queryKey = quickQuerySelect.value;

        if (!queryKey) {
          quickTimeError.textContent = 'Please select a query template';
          quickTimeError.style.display = 'block';
          return;
        }

        const query = queryBuilder.generateQuickQuery(queryKey, {
          startTime,
          endTime,
          timezone
        });
        ui.setQueryOutput(query);
      } else if (activeTab === 'snippets') {
        // Snippet Mode
        if (!selectedSnippet) {
          quickTimeError.textContent = 'Please select a snippet';
          quickTimeError.style.display = 'block';
          return;
        }

        // Generate query from snippet with new time range
        const query = queryBuilder.generate({
          fieldRows: selectedSnippet.fieldRows || [],
          conditionRows: selectedSnippet.conditionRows || [],
          tableName: selectedSnippet.tableName,
          startTime,
          endTime,
          timezone,
          isDistinct: selectedSnippet.queryType === 'distinct'
        });
        ui.setQueryOutput(query);
      }
    } else {
      // Standard/Distinct Mode
      const fromData = ui.getFromClauseData();

      // Validate time range
      const timeValidation = queryBuilder.validateTimeRange(fromData.startTime, fromData.endTime);
      if (!timeValidation.valid) {
        ui.showTimeError(timeValidation.error);
        return;
      }
      ui.hideTimeError();

      // Standard query needs table selection
      if (!fromData.tableName) {
        ui.showTimeError('Please select a table');
        return;
      }

      // Standard query generation
      const query = queryBuilder.generate({
        fieldRows: ui.getFieldRowsData(),
        conditionRows: ui.getConditionRowsData(),
        tableName: fromData.tableName,
        startTime: fromData.startTime,
        endTime: fromData.endTime,
        timezone: fromData.timezone,
        isDistinct: appState.isDistinctMode()
      });
      ui.setQueryOutput(query);
    }
  });

  ui.elements.copyBtn.addEventListener('click', () => ui.copyToClipboard());

  ui.elements.clearBtn.addEventListener('click', () => ui.setQueryOutput(''));

  // Query type radio button handlers
  document.querySelectorAll('input[name="queryType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const value = e.target.value;
      const isQuickMode = value === 'quick';
      const isDistinct = value === 'distinct';

      // Toggle quick query mode UI
      toggleQuickQueryMode(isQuickMode);

      // Update state
      appState.setQueryType(value);

      // Handle distinct mode UI changes (only if not quick mode)
      if (!isQuickMode) {
        ui.handleQueryTypeChange(isDistinct);
      }

      // Clear any error messages
      ui.hideTimeError();
      quickTimeError.style.display = 'none';
    });
  });

  // Tab switching handlers
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      activeTab = tab;

      // Update tab button states
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show/hide tab content
      if (tab === 'templates') {
        templatesTab.style.display = 'block';
        snippetsTab.style.display = 'none';
      } else {
        templatesTab.style.display = 'none';
        snippetsTab.style.display = 'block';
        ui.refreshSnippetDropdown();
      }

      // Reset selections
      selectedSnippet = null;
      ui.showSnippetPreview(null);
      quickTimeError.style.display = 'none';
    });
  });

  // Snippet selection handler
  if (snippetSelect) {
    snippetSelect.addEventListener('change', (e) => {
      const snippetId = e.target.value;
      if (snippetId) {
        selectedSnippet = snippetManager.getById(snippetId);
        ui.showSnippetPreview(selectedSnippet);
      } else {
        selectedSnippet = null;
        ui.showSnippetPreview(null);
      }
    });
  }

  // Save as Snippet handler
  if (saveSnippetBtn) {
    saveSnippetBtn.addEventListener('click', () => {
      const fromData = ui.getFromClauseData();

      // Validate that we have a table selected
      if (!fromData.tableName) {
        alert('Please select a table first');
        return;
      }

      const fieldRows = ui.getFieldRowsData();
      if (fieldRows.length === 0 || !fieldRows[0].fieldName) {
        alert('Please add at least one field');
        return;
      }

      // Prompt for snippet name
      const name = prompt('Enter a name for this snippet:');
      if (!name || !name.trim()) {
        return; // Cancelled or empty name
      }

      // Create snippet
      const snippet = snippetManager.createFromQuery({
        name: name.trim(),
        queryType: appState.queryType,
        tableName: fromData.tableName,
        fieldRows: fieldRows,
        conditionRows: ui.getConditionRowsData()
      });

      alert(`Snippet "${snippet.name}" saved successfully!`);
    });
  }

  // Rename snippet handler
  if (renameSnippetBtn) {
    renameSnippetBtn.addEventListener('click', () => {
      if (!selectedSnippet) return;

      const newName = prompt('Enter new name:', selectedSnippet.name);
      if (!newName || !newName.trim()) {
        return; // Cancelled or empty name
      }

      snippetManager.rename(selectedSnippet.id, newName.trim());
      selectedSnippet.name = newName.trim();
      ui.refreshSnippetDropdown();

      // Reselect the snippet
      if (snippetSelect) {
        snippetSelect.value = selectedSnippet.id;
      }
    });
  }

  // Delete snippet handler
  if (deleteSnippetBtn) {
    deleteSnippetBtn.addEventListener('click', () => {
      if (!selectedSnippet) return;

      const confirmed = confirm(`Delete snippet "${selectedSnippet.name}"?`);
      if (!confirmed) return;

      snippetManager.delete(selectedSnippet.id);
      selectedSnippet = null;
      ui.showSnippetPreview(null);
      ui.refreshSnippetDropdown();
    });
  }
});
