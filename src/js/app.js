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

  // Event listeners
  ui.elements.addFieldBtn.addEventListener('click', () => ui.addFieldRow());
  ui.elements.addConditionBtn.addEventListener('click', () => ui.addConditionRow());

  ui.elements.generateBtn.addEventListener('click', () => {
    const fromData = ui.getFromClauseData();
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
  });

  ui.elements.copyBtn.addEventListener('click', () => ui.copyToClipboard());

  ui.elements.clearBtn.addEventListener('click', () => ui.setQueryOutput(''));

  document.querySelectorAll('input[name="queryType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isDistinct = e.target.value === 'distinct';
      appState.setQueryType(e.target.value);
      ui.handleQueryTypeChange(isDistinct);
    });
  });
});
