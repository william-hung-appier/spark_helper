# Chrome Extension Architecture

## Overview

This Chrome extension helps users compose Spark SQL queries for the `imp_join_all2` table with a visual query builder interface. It supports both standard multi-field queries and single-field DISTINCT queries for data exploration.

## Component Structure

### 1. **manifest.json** - Extension Configuration

- Defines extension metadata (name, version, description)
- Specifies popup HTML file
- Declares required permissions (clipboardWrite)
- Manifest v3 format

### 2. **popup.html** - User Interface

Structure:

```
┌───────────────────────────────────────────────────────┐
│  Spark Query Builder                                  │
├───────────────────────────────────────────────────────┤
│  Query Type: ○ Standard  ○ Distinct Values            │
├───────────────────────────────────────────────────────┤
│  SELECT / SELECT DISTINCT                             │
│  [field ▼] AS [alias]  [×]                            │
│  [+Add field]  (hidden in Distinct mode)              │
├───────────────────────────────────────────────────────┤
│  FROM                                                 │
│  Table: imp_join_all2                                 │
│  Time: [YYYY-MM-DD-HH] to [YYYY-MM-DD-HH]             │
│  Timezone: [UTC-12 to UTC+14 ▼]                       │
├───────────────────────────────────────────────────────┤
│  WHERE                                                │
│  [Win Bid (RTB) / Non-Win Bid (RTB) / Custom ▼]  [×]  │
│  [+Add condition]                                     │
├───────────────────────────────────────────────────────┤
│  [Generate Query] [Copy to Clipboard]                 │
├───────────────────────────────────────────────────────┤
│  Generated Query:                                     │
│  [SQL output textarea]                                │
└───────────────────────────────────────────────────────┘
```

### 3. **fieldMappings.js** - SQL Definitions

Contains two main objects:

```javascript
FIELD_MAPPINGS = {
  channel: { sql: "CASE WHEN...", alias: "channel" },
  oid: { sql: "CID2OID(cid)", alias: "oid" },
  // ... other fields
}

WHERE_CONDITIONS = {
  bid_win: { sql: "is_external IS NULL AND win_time IS NOT NULL" },
  bid_non_win: { sql: "is_external IS NULL AND win_time IS NULL" },
  custom: { sql: "" }
}
```

### 4. **popup.js** - Query Builder Logic

Key Functions:

**Query Type Toggle:**

- `handleQueryTypeChange()`: Switches between Standard and Distinct modes
  - Standard: Multi-field SELECT, shows +Add button
  - Distinct: Single-field SELECT DISTINCT, hides +Add button

**Field Management:**

- `addSelectField()`: Creates field selector row with event listeners
- Remove buttons use `addEventListener` (Manifest v3 CSP compliant)

**Condition Management:**

- `addWhereCondition()`: Creates condition row
- Supports: Win Bid (RTB), Non-Win Bid (RTB), Custom

**Time Parsing:**

- `parseDateTimeInput()`: Parses `YYYY-MM-DD-HH` format (HH optional, defaults to 00)
- `formatDateTimeWithTimezone()`: Converts user timezone to UTC
  - Example: UTC+8 `2025-11-21-08` → `2025112100`

**Query Generation:**

- `generateQuery()`: Assembles SQL from form inputs
- Detects query type and prepends DISTINCT if needed

**Clipboard:**

- `copyToClipboard()`: Copies generated SQL with visual feedback

### 5. **styles.css** - Visual Styling

- Query type toggle styling (`.query-type-section`, `.radio-label`)
- Clean, modern interface with consistent spacing
- Monospace font for SQL output

## Data Flow

```
Query Type Selection (Standard / Distinct)
    ↓
Field Selection → fieldMappings.js → SQL Template
    ↓
Time Input (YYYY-MM-DD-HH) + Timezone → parseDateTimeInput() → formatDateTimeWithTimezone() → UTC YYYYMMDDHH
    ↓
Condition Selection → WHERE_CONDITIONS → WHERE clause
    ↓
generateQuery() assembles all parts (with DISTINCT if selected)
    ↓
Final SQL displayed in textarea
    ↓
copyToClipboard() → User's clipboard
```

## Key Design Patterns

### 1. **Declarative Field Mapping**

SQL logic separated from UI code:

```javascript
FIELD_MAPPINGS[field].sql + ' AS ' + FIELD_MAPPINGS[field].alias
```

### 2. **Mode-Based UI**

Query type toggle changes UI behavior:
- Standard mode: Multi-field, +Add button visible
- Distinct mode: Single field only, +Add button hidden

### 3. **Event Listener Pattern (CSP Compliant)**

Uses `addEventListener` instead of inline `onclick` for Manifest v3 compatibility:

```javascript
removeBtn.addEventListener('click', () => {
  fieldRow.remove();
});
```

### 4. **Timezone Conversion**

User inputs local time → converted to UTC for Spark table naming:
- Input: `2025-11-21-08` in UTC+8
- Output: `2025112100` (table suffix)

## Extension Points

1. **New Predefined Field:**
   - Add to `FIELD_MAPPINGS` in `fieldMappings.js`
   - Add `<option>` in `addSelectField()` dropdown

2. **New WHERE Condition:**
   - Add to `WHERE_CONDITIONS` in `fieldMappings.js`
   - Add `<option>` in `addWhereCondition()` dropdown
   - Add handling in `generateQuery()` if needed

3. **New Timezone:**
   - Already supports UTC-12 to UTC+14 (all standard timezones)
