SELECT
    c.*,
    ct.*,
    d.*,
    pf.*,
    m.*,
    cvss_v2.*,
    cvss_v3.*,
    cvss_v31.*,
    s.*,
    e.*,
    i.*,
    idesc.*
FROM
    CVE AS c
JOIN
    Container AS ct         ON ct.cve_id = c.cve_id
LEFT JOIN
    Descriptions AS d       ON d.container_id = ct.container_id
LEFT JOIN
    affected_product AS pf         ON pf.container_id = ct.container_id
LEFT JOIN
    Metrics AS m            ON m.container_id = ct.container_id
LEFT JOIN
    CVSSV2 AS cvss_v2       ON cvss_v2.metric_id = m.metric_id
LEFT JOIN
    CVSSV3 AS cvss_v3       ON cvss_v3.metric_id = m.metric_id
LEFT JOIN
    CVSSV3_1 AS cvss_v31    ON cvss_v31.metric_id = m.metric_id
LEFT JOIN
    Solutions AS s          ON s.container_id = ct.container_id
LEFT JOIN
    Exploits AS e           ON e.container_id = ct.container_id
LEFT JOIN
    Impact AS i            ON i.container_id = ct.container_id
LEFT JOIN
    Impact_Description AS idesc ON idesc.impact_id = i.impact_id
WHERE
    c.cve_id = "CVE-2025-24595";
