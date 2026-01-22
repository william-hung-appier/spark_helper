# Design: DISTINCT with Predefined Queries (v2.1.0)

## Overview

This design addresses spec 2.1.0 requirements:

1. Auto-focus time input after table selection
2. Time interval validation on generate
3. Quick Queries dropdown for predefined DISTINCT type queries

## Requirements Summary

| Requirement | Solution |
|-------------|----------|
| Focus time input after table selection | Modify `handleTableSelect()` to focus `startTime` |
| Validate time interval | Show error on generate if time empty |
| Predefined DISTINCT queries | Quick Queries dropdown with UNION ALL generation |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `popup.html` | Modify | Add quick query dropdown, time error element |
| `src/js/quickQueries.js` | New | Define QUICK_QUERIES config |
| `src/js/state.js` | Modify | Add quickQuery state methods |
| `src/js/queryBuilder.js` | Modify | Add `generateQuickQuery()` and `generateUnionDistinct()` |
| `src/js/ui.js` | Modify | Focus time input, validation methods, quick query mode |
| `src/js/app.js` | Modify | Wire quick query events, update generate handler |
| `src/css/styles.css` | Modify | Add quick query and error styling |

## Detailed Design

### 1. Auto-Focus Time Input

**Current:** After table selection, focus jumps to field autocomplete.

**New:** After table selection, focus jumps to `startTime` input.

```javascript
// ui.js - handleTableSelect()
handleTableSelect(tableName) {
  this.state.setSelectedTable(tableName);
  this.updateSelectSectionState();
  this.rebuildAllFieldAutocompletes();
  this.rebuildConditionOptions();
  this.elements.startTime.focus(); // NEW
}

// ui.js - rebuildAllFieldAutocompletes()
rebuildAllFieldAutocompletes() {
  // ... existing code ...
  this.addFieldRow({ autoFocus: false }); // Skip auto-focus
}
```

### 2. Time Interval Validation

**HTML addition:**

```html
<div class="form-group">
  <label>Time:</label>
  <input type="text" id="startTime" ... />
  <span>to</span>
  <input type="text" id="endTime" ... />
  <div id="timeError" class="error-message" style="display: none;">
    Please enter start and end time
  </div>
</div>
```

**Validation logic in app.js:**

```javascript
ui.elements.generateBtn.addEventListener('click', () => {
  const fromData = ui.getFromClauseData();

  if (!fromData.startTime || !fromData.endTime) {
    ui.showTimeError('Please enter start and end time');
    return;
  }
  ui.hideTimeError();

  // ... generate query ...
});
```

**New UI methods:**

```javascript
showTimeError(message) {
  this.elements.timeError.textContent = message;
  this.elements.timeError.style.display = 'block';
}

hideTimeError() {
  this.elements.timeError.style.display = 'none';
}
```

### 3. Quick Queries Dropdown

**HTML:**

```html
<section class="section query-type-section">
  <!-- existing radio buttons -->

  <div class="quick-query-group">
    <label>Quick Query:</label>
    <select id="quickQuerySelect" class="input-field">
      <option value="">-- Select --</option>
      <option value="distinct_type_all">DISTINCT type (all creative tables)</option>
    </select>
  </div>
</section>
```

**Quick Query Configuration (quickQueries.js):**

```javascript
const QUICK_QUERIES = {
  distinct_type_all: {
    label: 'DISTINCT type (all creative tables)',
    tables: [
      { name: 'creative_perf_event', field: 'type' },
      { name: 'creative_quality', field: 'type' },
      { name: 'creative_event', field: 'event_type' }
    ],
    outputAlias: 'type',
    requiresTimeRange: true
  }
};
```

**Query Generation (queryBuilder.js):**

```javascript
generateQuickQuery(queryKey, options) {
  const config = QUICK_QUERIES[queryKey];
  if (!config) return '';

  return this.generateUnionDistinct({
    tables: config.tables,
    outputAlias: config.outputAlias,
    startTime: options.startTime,
    endTime: options.endTime,
    timezone: options.timezone
  });
}

generateUnionDistinct(options) {
  const { tables, outputAlias, startTime, endTime, timezone } = options;

  const queries = tables.map(({ name, field }) => {
    const tableSuffix = this.buildFromClause(name, startTime, endTime, timezone);
    return `SELECT '${name}' AS table_name, ${field} AS ${outputAlias}
FROM ${tableSuffix}`;
  });

  return `SELECT DISTINCT table_name, ${outputAlias}
FROM (
${queries.join('\nUNION ALL\n')}
)
ORDER BY table_name, ${outputAlias}`;
}
```

**Example Output:**

```sql
SELECT DISTINCT table_name, type
FROM (
SELECT 'creative_perf_event' AS table_name, type AS type
FROM creative_perf_event_2025120100_2026011800
UNION ALL
SELECT 'creative_quality' AS table_name, type AS type
FROM creative_quality_2025120100_2026011800
UNION ALL
SELECT 'creative_event' AS table_name, event_type AS type
FROM creative_event_2025120100_2026011800
)
ORDER BY table_name, type
```

### 4. State Management

**New methods in state.js:**

```javascript
setQuickQuery(key) {
  this.quickQuery = key;
}

getQuickQuery() {
  return this.quickQuery || null;
}

clearQuickQuery() {
  this.quickQuery = null;
}
```

### 5. Event Wiring (app.js)

```javascript
const quickQuerySelect = document.getElementById('quickQuerySelect');

quickQuerySelect.addEventListener('change', (e) => {
  const queryKey = e.target.value;
  appState.setQuickQuery(queryKey || null);
  ui.setQuickQueryMode(!!queryKey);
});

ui.elements.generateBtn.addEventListener('click', () => {
  const fromData = ui.getFromClauseData();

  // Validate time
  if (!fromData.startTime || !fromData.endTime) {
    ui.showTimeError('Please enter start and end time');
    return;
  }
  ui.hideTimeError();

  // Quick query mode
  const quickQueryKey = appState.getQuickQuery();
  if (quickQueryKey) {
    const query = queryBuilder.generateQuickQuery(quickQueryKey, {
      startTime: fromData.startTime,
      endTime: fromData.endTime,
      timezone: fromData.timezone
    });
    ui.setQueryOutput(query);
    return;
  }

  // Standard query generation...
});
```

### 6. CSS Styling

```css
.quick-query-group {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-query-group select {
  min-width: 200px;
}

.error-message {
  color: var(--error-color, #dc3545);
  font-size: 12px;
  margin-top: 4px;
}
```

## Implementation Order

1. Add time error element to popup.html
2. Add validation methods to ui.js
3. Update generate handler in app.js for validation
4. Modify handleTableSelect() for time focus
5. Create quickQueries.js
6. Add state methods for quick query
7. Add Quick Queries dropdown to popup.html
8. Add generateQuickQuery() to queryBuilder.js
9. Wire quick query events in app.js
10. Add CSS styling
