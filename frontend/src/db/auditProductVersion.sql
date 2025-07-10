/* ────────────────────────────────────────────────────────────────────────────
   Enhanced query: CVEs that affect MySQL 8.0.27 (exact / upper-bound matches)
   ────────────────────────────────────────────────────────────────────────────*/
SELECT
    /* original columns ------------------------------------------------------*/
    c.cve_id,
    c.date_published,
    ap.vendor,
    ap.product_name,
    av.affected_version,
    av.less_than,
    av.less_than_or_equal,

    /* ───────────── metrics (CVSS 4 / 3.1 / 3.0 / 2.0) ───────────── */
    (
        SELECT JSON_ARRAYAGG(
                 JSON_OBJECT(
                     'version'       , mver.cvss_version,
                     'vector_string' , mver.vector_string,
                     'base_score'    , mver.base_score,
                     'base_severity' , COALESCE(mver.base_severity, 'N/A')
                 )
               )
        FROM (
            /* 4.0 ----------------------------------------------------------*/
            SELECT '4.0' AS cvss_version,
                   v4.vector_string,
                   v4.base_score,
                   v4.base_severity
            FROM Metrics  m
            JOIN CVSSV4   v4  ON v4.metric_id = m.metric_id
            WHERE m.container_id = ct.container_id

            UNION ALL
            /* 3.1 ----------------------------------------------------------*/
            SELECT '3.1',
                   v31.vector_string,
                   v31.base_score,
                   v31.base_severity
            FROM Metrics  m
            JOIN CVSSV3_1 v31 ON v31.metric_id = m.metric_id
            WHERE m.container_id = ct.container_id

            UNION ALL
            /* 3.0 ----------------------------------------------------------*/
            SELECT '3.0',
                   v30.vector_string,
                   v30.base_score,
                   v30.base_severity
            FROM Metrics  m
            JOIN CVSSV3   v30 ON v30.metric_id = m.metric_id
            WHERE m.container_id = ct.container_id

            UNION ALL
            /* 2.0 ----------------------------------------------------------*/
            SELECT '2.0',
                   v20.vector_string,
                   v20.base_score,
                   NULL              AS base_severity   -- v2 has no severity
            FROM Metrics  m
            JOIN CVSSV2   v20 ON v20.metric_id = m.metric_id
            WHERE m.container_id = ct.container_id
        ) AS mver
    )                                               AS metrics,

    /* ───────────── list of CWE IDs ───────────── */
    (
        SELECT JSON_ARRAYAGG(cwe_sub.cwe_id)
        FROM (
            SELECT DISTINCT ptd.cwe_id
            FROM Problem_Types             pt
            JOIN Problem_Type_Description  ptd
                 ON ptd.problem_type_id = pt.problem_type_id
            WHERE pt.container_id = ct.container_id
              AND ptd.cwe_id      IS NOT NULL
        ) AS cwe_sub
    )                                               AS cwe_ids,

    /* ───────────── list of CAPEC IDs ─────────── */
    (
        SELECT JSON_ARRAYAGG(capec_sub.capec_id)
        FROM (
            SELECT DISTINCT i.capec_id
            FROM Impact i
            WHERE i.container_id = ct.container_id
              AND i.capec_id    IS NOT NULL
        ) AS capec_sub
    )                                               AS capec_ids,

    /* ───────────── list of CPE IDs ───────────── */
    (
        SELECT JSON_ARRAYAGG(cpe_sub.cpe23_item)
        FROM (
            SELECT DISTINCT apc.cpe23_item
            FROM Affected_Product_cpe apc
            WHERE apc.product_id = ap.product_id
        ) AS cpe_sub
    )                                               AS cpe_ids

FROM           CVE               AS c
JOIN           Container         AS ct  ON ct.cve_id       = c.cve_id
JOIN           Affected_Product  AS ap  ON ap.container_id = ct.container_id
JOIN           Affected_Version  AS av  ON av.product_id   = ap.product_id

/* ─────────────────────────── filter ────────────────────────────*/
WHERE LOWER(ap.product_name) LIKE '%ios_xe%'
  AND (
        av.affected_version   LIKE '%3.9.2s%'
     OR av.less_than          LIKE '%3.9.2s%'
     OR av.less_than_or_equal LIKE '%3.9.2s%'
  );
