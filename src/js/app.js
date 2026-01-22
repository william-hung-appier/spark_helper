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

  // Cache additional elements for quick query mode
  const quickQuerySection = document.getElementById('quickQuerySection');
  const quickQuerySelect = document.getElementById('quickQuerySelect');
  const quickStartTime = document.getElementById('quickStartTime');
  const quickEndTime = document.getElementById('quickEndTime');
  const quickTimezone = document.getElementById('quickTimezone');
  const quickTimeError = document.getElementById('quickTimeError');

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
   * Toggle between standard and quick query modes
   * @param {boolean} isQuickMode - Whether to enable quick query mode
   */
  const toggleQuickQueryMode = (isQuickMode) => {
    // Show/hide quick query section
    quickQuerySection.style.display = isQuickMode ? 'block' : 'none';

    // Show/hide standard sections
    standardSections.forEach(section => {
      if (section) {
        section.style.display = isQuickMode ? 'none' : 'block';
      }
    });

    // Update state
    if (isQuickMode) {
      appState.setQueryType('quick');
    }
  };

  // Event listeners
  ui.elements.addFieldBtn.addEventListener('click', () => ui.addFieldRow());
  ui.elements.addConditionBtn.addEventListener('click', () => ui.addConditionRow());

  ui.elements.generateBtn.addEventListener('click', () => {
    const isQuickMode = appState.queryType === 'quick';

    if (isQuickMode) {
      // Quick Query Mode - use quick query inputs
      const startTime = quickStartTime.value;
      const endTime = quickEndTime.value;
      const timezone = quickTimezone.value;
      const queryKey = quickQuerySelect.value;

      // Validate quick query selection
      if (!queryKey) {
        quickTimeError.textContent = 'Please select a query template';
        quickTimeError.style.display = 'block';
        return;
      }

      // Validate time interval
      if (!startTime || !endTime) {
        quickTimeError.textContent = 'Please enter start and end time';
        quickTimeError.style.display = 'block';
        return;
      }
      quickTimeError.style.display = 'none';

      // Generate quick query
      const query = queryBuilder.generateQuickQuery(queryKey, {
        startTime,
        endTime,
        timezone
      });
      ui.setQueryOutput(query);
    } else {
      // Standard/Distinct Mode
      const fromData = ui.getFromClauseData();

      // Validate time interval
      if (!fromData.startTime || !fromData.endTime) {
        ui.showTimeError('Please enter start and end time');
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
});
