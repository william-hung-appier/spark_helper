/**
 * Custom field mappings and WHERE conditions for imp_join_all2 table
 */

const IMP_JOIN_ALL2_MAPPINGS = {
  fields: {
    oid: {
      sql: "CID2OID(cid)",
      alias: "oid"
    },
    cid: {
      sql: "cid",
      alias: "cid"
    },
    bidobjid: {
      sql: "BYTES2STR(bid_appier_id)",
      alias: "bidobjid"
    },
    channel: {
      sql: `CASE
  WHEN NVL(APPTYPE2NAME(app_type), '') = 'app' THEN NVL(BYTES2STR(bundle_id), '')
  ELSE NVL(BYTES2STR(web_host), '')
END`,
      alias: "channel"
    },
    partner_id: {
      sql: "NVL(PARTNERID2STR(partner_id), '')",
      alias: "partner_id"
    },
    app_type: {
      sql: "NVL(APPTYPE2NAME(app_type), '')",
      alias: "app_type"
    },
    os: {
      sql: "NVL(OS2STR(os), '')",
      alias: "os"
    },
    country: {
      sql: "NVL(impreq_country, '')",
      alias: "country"
    }
  },

  conditions: {
    bid_win: {
      label: "Win Bid (RTB)",
      sql: "is_external IS NULL AND win_time IS NOT NULL"
    },
    bid_non_win: {
      label: "Non-Win Bid (RTB)",
      sql: "is_external IS NULL AND win_time IS NULL"
    }
  }
};
