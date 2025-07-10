/* -----------------------------------------------------------------
 *  TODO el contenido ligado a un CVE en una sola llamada
 *  Parámetro : :cve_id   (ej. 'CVE-2024-12345')
 * -----------------------------------------------------------------*/
SELECT
    c.*,                 -- CVE
    ct.*,                -- Container (cna + adp)
    cna.*,               -- CNA
    adp.*,               -- ADP
    pm.*,                -- Provider_Metadata
    des.*,               -- Descriptions
    cr.*,                -- Credit
    tag.*,               -- Tags
    sol.*,               -- Solutions
    wa.*,                -- Workarounds
    ex.*,                -- Exploits
    ap.*,                -- Affected_Product
    apc.*,               -- Affected_Product_cpe
    av.*,                -- Affected_Version
    plat.*,              -- Platforms
    modu.*,               -- Modules
    pfile.*,             -- Program_Files
    proute.*,            -- Program_Routines
    met.*,               -- Metrics
    cvss2.*,             -- CVSS v2
    cvss3.*,             -- CVSS v3.0
    cvss31.*,            -- CVSS v3.1
    cvss4.*,             -- CVSS v4
    mets.*,              -- Metrics_Scenarios
    imp.*,               -- Impact  (incluye capec_id)
    idesc.*,             -- Impact_Description (desc. CAPEC)
    pt.*,                -- Problem_Types
    ptd.*,               -- Problem_Type_Description
    ptr.*,               -- Problem_Type_Reference
    configs.*,           -- Configurations
    cpeapp.*,            -- CPE_Applicability
    cpenode.*,           -- CPE_Node
    cpematch.*,          -- CPE_Match
    taxmap.*,            -- Taxonomy_Mappings
    taxrel.*,            -- Taxonomy_Relations
    timeline.*,          -- Timeline
    cveref.*             -- CVE_References
FROM       CVE                    AS c
JOIN       Container              AS ct        ON ct.cve_id           = c.cve_id
LEFT JOIN  CNA                    AS cna       ON cna.cna_id          = ct.container_id
LEFT JOIN  ADP                    AS adp       ON adp.adp_id          = ct.container_id
LEFT JOIN  Provider_Metadata      AS pm        ON pm.container_id     = ct.container_id
LEFT JOIN  Descriptions           AS des       ON des.container_id    = ct.container_id
LEFT JOIN  Credit                 AS cr        ON cr.container_id     = ct.container_id
LEFT JOIN  Tags                   AS tag       ON tag.container_id    = ct.container_id
LEFT JOIN  Solutions              AS sol       ON sol.container_id    = ct.container_id
LEFT JOIN  Workarounds            AS wa        ON wa.container_id     = ct.container_id
LEFT JOIN  Exploits               AS ex        ON ex.container_id     = ct.container_id
LEFT JOIN  Affected_Product       AS ap        ON ap.container_id     = ct.container_id
LEFT JOIN  Affected_Product_cpe   AS apc       ON apc.product_id      = ap.product_id
LEFT JOIN  Affected_Version       AS av        ON av.product_id       = ap.product_id
LEFT JOIN  Platforms              AS plat      ON plat.product_id     = ap.product_id
LEFT JOIN  Modules                AS modu       ON modu.product_id      = ap.product_id
LEFT JOIN  Program_Files          AS pfile     ON pfile.product_id    = ap.product_id
LEFT JOIN  Program_Routines       AS proute    ON proute.product_id   = ap.product_id
LEFT JOIN  Metrics                AS met       ON met.container_id    = ct.container_id
LEFT JOIN  CVSSV2                 AS cvss2     ON cvss2.metric_id     = met.metric_id
LEFT JOIN  CVSSV3                 AS cvss3     ON cvss3.metric_id     = met.metric_id
LEFT JOIN  CVSSV3_1               AS cvss31    ON cvss31.metric_id    = met.metric_id
LEFT JOIN  CVSSV4                 AS cvss4     ON cvss4.metric_id     = met.metric_id
LEFT JOIN  Metrics_Scenarios      AS mets      ON mets.metric_id      = met.metric_id
LEFT JOIN  Impact                 AS imp       ON imp.container_id    = ct.container_id
LEFT JOIN  Impact_Description     AS idesc     ON idesc.impact_id     = imp.impact_id
LEFT JOIN  Problem_Types          AS pt        ON pt.container_id     = ct.container_id
LEFT JOIN  Problem_Type_Description AS ptd     ON ptd.problem_type_id = pt.problem_type_id
LEFT JOIN  Problem_Type_Reference AS ptr       ON ptr.problem_type_id = pt.problem_type_id
LEFT JOIN  Configurations         AS configs   ON configs.container_id     = ct.container_id
LEFT JOIN  CPE_Applicability      AS cpeapp    ON cpeapp.container_id      = ct.container_id
LEFT JOIN  CPE_Node               AS cpenode   ON cpenode.applicability_id = cpeapp.applicability_id
LEFT JOIN  CPE_Match              AS cpematch  ON cpematch.node_id         = cpenode.node_id
LEFT JOIN  Taxonomy_Mappings      AS taxmap    ON taxmap.container_id      = ct.container_id
LEFT JOIN  Taxonomy_Relations     AS taxrel    ON taxrel.taxonomy_id_hash  = taxmap.taxonomy_id_hash
LEFT JOIN  Timeline               AS timeline  ON timeline.container_id    = ct.container_id
LEFT JOIN  CVE_References         AS cveref    ON cveref.container_id	= ct.container_id
WHERE      c.cve_id = "CVE-1999-0001";
