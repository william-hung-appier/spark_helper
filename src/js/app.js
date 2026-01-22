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

  // Theme management - use ThemeManager for system preference support
  themeManager.init();

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => themeManager.toggle());
  }

  // History management
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');
  const historyToggle = document.getElementById('historyToggle');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const restoreBanner = document.getElementById('restoreBanner');
  const restoreText = document.getElementById('restoreText');
  const clearRestoreBtn = document.getElementById('clearRestoreBtn');

  let historyExpanded = true;

  /**
   * Render the history list UI
   */
  const renderHistoryList = () => {
    const entries = historyManager.getAll();
    historyCount.textContent = entries.length;

    if (entries.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No query history yet</div>';
      return;
    }

    historyList.innerHTML = entries.map(entry => `
      <div class="history-item" data-id="${entry.id}">
        <div class="history-item-info">
          <span class="history-item-table">${entry.config.tableName || 'Unknown'}</span>
          <span class="history-item-time">${historyManager.getRelativeTime(entry.createdAt)}</span>
        </div>
        <div class="history-item-actions">
          <button class="btn-history-load" data-id="${entry.id}" title="Load this query">Load</button>
          <button class="btn-history-copy" data-id="${entry.id}" title="Copy SQL">Copy</button>
        </div>
      </div>
    `).join('');

    // Attach event listeners to history items
    historyList.querySelectorAll('.btn-history-load').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        loadHistoryEntry(id);
      });
    });

    historyList.querySelectorAll('.btn-history-copy').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const entry = historyManager.getById(id);
        if (entry && entry.generatedSql) {
          try {
            await navigator.clipboard.writeText(entry.generatedSql);
            e.target.textContent = 'Copied!';
            setTimeout(() => { e.target.textContent = 'Copy'; }, 1500);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        }
      });
    });
  };

  /**
   * Load a history entry into the form
   * @param {string} id - History entry ID
   */
  const loadHistoryEntry = (id) => {
    const entry = historyManager.getById(id);
    if (!entry) return;

    const config = entry.config;

    // Set query type
    const queryTypeRadio = document.querySelector(`input[name="queryType"][value="${config.queryType || 'standard'}"]`);
    if (queryTypeRadio) {
      queryTypeRadio.checked = true;
      queryTypeRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Load the configuration into UI
    ui.loadHistoryConfig(config);

    // Set the generated SQL in output
    if (entry.generatedSql) {
      ui.setQueryOutput(entry.generatedSql);
    }
  };

  /**
   * Auto-restore last query if within 24 hours
   */
  const autoRestore = () => {
    const restorable = historyManager.getRestorable();
    if (!restorable) return;

    // Load the config
    loadHistoryEntry(restorable.id);

    // Show restore banner
    if (restoreBanner && restoreText) {
      restoreText.textContent = `Restored from ${historyManager.getRelativeTime(restorable.createdAt)}`;
      restoreBanner.style.display = 'flex';

      // Auto-hide after 5 seconds
      setTimeout(() => {
        restoreBanner.style.display = 'none';
      }, 5000);
    }
  };

  /**
   * Clear the form and hide restore banner
   */
  const clearRestore = () => {
    // Reset form to default state
    ui.resetForm();
    restoreBanner.style.display = 'none';
  };

  // History toggle (expand/collapse)
  if (historyToggle) {
    historyToggle.addEventListener('click', () => {
      historyExpanded = !historyExpanded;
      historyList.style.display = historyExpanded ? 'block' : 'none';
      const icon = historyToggle.querySelector('.history-toggle-icon');
      if (icon) {
        icon.textContent = historyExpanded ? '\u25BC' : '\u25B6';
      }
    });
  }

  // Clear all history
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Clear all query history?')) {
        historyManager.clear();
        renderHistoryList();
      }
    });
  }

  // Clear restore banner
  if (clearRestoreBtn) {
    clearRestoreBtn.addEventListener('click', clearRestore);
  }

  // Initialize UI (must be before history operations)
  ui.init();

  // Render history on load
  renderHistoryList();

  // Auto-restore last query
  autoRestore();

  // Time validation on blur (when leaving FROM clause inputs)
  const validateTimeOnBlur = () => {
    const startTime = ui.elements.startTime.value;
    const endTime = ui.elements.endTime.value;

    // Only validate if both fields have values
    if (!startTime && !endTime) {
      ui.hideTimeError();
      return;
    }

    // Validate if at least one field has a value
    if (startTime || endTime) {
      const validation = queryBuilder.validateTimeRange(startTime, endTime);
      if (!validation.valid) {
        ui.showTimeError(validation.error);
      } else {
        ui.hideTimeError();
      }
    }
  };

  ui.elements.startTime.addEventListener('blur', validateTimeOnBlur);
  ui.elements.endTime.addEventListener('blur', validateTimeOnBlur);

  // Time validation on blur for Quick Query mode
  const validateQuickTimeOnBlur = () => {
    const startTime = quickStartTime.value;
    const endTime = quickEndTime.value;

    // Only validate if both fields have values
    if (!startTime && !endTime) {
      quickTimeError.style.display = 'none';
      return;
    }

    // Validate if at least one field has a value
    if (startTime || endTime) {
      const validation = queryBuilder.validateTimeRange(startTime, endTime);
      if (!validation.valid) {
        quickTimeError.textContent = validation.error;
        quickTimeError.style.display = 'block';
      } else {
        quickTimeError.style.display = 'none';
      }
    }
  };

  quickStartTime.addEventListener('blur', validateQuickTimeOnBlur);
  quickEndTime.addEventListener('blur', validateQuickTimeOnBlur);

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

        // Save to history
        historyManager.save({
          queryType: 'quick',
          tableName: queryKey,
          timeStart: startTime,
          timeEnd: endTime,
          timezone
        }, query);
        renderHistoryList();
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

        // Save to history
        historyManager.save({
          queryType: selectedSnippet.queryType,
          tableName: selectedSnippet.tableName,
          fieldRows: selectedSnippet.fieldRows,
          conditionRows: selectedSnippet.conditionRows,
          timeStart: startTime,
          timeEnd: endTime,
          timezone
        }, query);
        renderHistoryList();
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
      const fieldRows = ui.getFieldRowsData();
      const conditionRows = ui.getConditionRowsData();
      const query = queryBuilder.generate({
        fieldRows,
        conditionRows,
        tableName: fromData.tableName,
        startTime: fromData.startTime,
        endTime: fromData.endTime,
        timezone: fromData.timezone,
        isDistinct: appState.isDistinctMode()
      });
      ui.setQueryOutput(query);

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
      renderHistoryList();
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
