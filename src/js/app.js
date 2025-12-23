document.addEventListener('DOMContentLoaded', async () => {
  const schemaParser = new SchemaParser(FIELD_MAPPINGS);
  const queryBuilder = new QueryBuilder(FIELD_MAPPINGS, WHERE_CONDITIONS);
  const ui = new UIManager(appState, FIELD_MAPPINGS);

  ui.init();
  ui.showLoading();

  try {
    const fields = await schemaParser.getAvailableFields();
    appState.setAvailableFields(fields);
  } catch (error) {
    console.error('Failed to load schema fields:', error);
    const fallbackFields = Object.keys(FIELD_MAPPINGS).map(name => ({
      name,
      type: 'Customize',
      isCustomize: true
    }));
    appState.setAvailableFields(fallbackFields);
  }

  ui.clearLoading();
  ui.addFieldRow();

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

  document.querySelectorAll('input[name="queryType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isDistinct = e.target.value === 'distinct';
      appState.setQueryType(e.target.value);
      ui.handleQueryTypeChange(isDistinct);
    });
  });
});