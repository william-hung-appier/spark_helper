---
creationDate: 2025-12-21
isInternal: true
tags:
- Appier
---

> Browser extension for quickly compose Spark Query

## MVP

- Targeting table: `imp_join_all2`
- Query type toggle:
  - Standard: Multi-field SELECT query
  - Distinct Values: Single-field `SELECT DISTINCT` query
- Targeting specific scenario:
  - RTB event filter (dropdown):
    - Win bid: `is_external IS NULL AND win_time IS NOT NULL`
    - Non-win bid: `is_external IS NULL AND win_time IS NULL`
  - Targeting specific field parsing:
    - Getting `channel`
    - Getting `bidobjid`
    - Getting `oid`
    - Getting `partner_id`
    - Getting `app_type`
    - Getting `os`
    - Getting `country`
  - Time format parsing
    - Input with
      - Timezone selection: UTC-12 to UTC+14
      - Start: YYYY-MM-DD-HH (HH is optional, defaults to 00)
      - End: YYYY-MM-DD-HH (HH is optional, defaults to 00)
    - Output with UTC+0 timezone (converted from input timezone)
      - Example: UTC+8 `2025-11-21-08` → `2025112100`
      - Start: YYYYMMDDHH
      - End: YYYYMMDDHH

## Common used function/UDF

#### SELECT for `imp_join_all2` table

- Getting `channel`: app -> bundle_id && web -> domain

```sql
CASE
 WHEN NVL(APPTYPE2NAME(app_type), '') = 'app' THEN NVL(BYTES2STR(bundle_id), '')
 ELSE NVL(BYTES2STR(web_host), '')
END AS channel,
```

- Getting `bidobjid`

```sql
BYTES2STR(bid_appier_id) AS bidobjid
```

- Getting `oid`

```sql
CID2OID(cid) as oid
```

- Getting `partner_id`

```sql
NVL(PARTNERID2STR (partner_id), '') AS partner_id
```

- Getting `app_type`

```sql
NVL(APPTYPE2NAME(app_type), '') AS app_type
```

- Getting `os`

```sql
NVL(OS2STR (os), '') AS os
```

- Getting `country`

```sql
NVL(impreq_country, '') AS country
```
