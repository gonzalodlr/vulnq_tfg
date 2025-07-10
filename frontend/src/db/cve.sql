/* ---------------------------------------------
 *  Información esencial de un CVE y sus contenedores
 *  Parámetro : :cve_id   (p. ej. 'CVE-2024-12345')
 * ---------------------------------------------*/
SELECT
    c.cve_id,

    /* --- contenedores ------------------------------------ */
    MAX(CASE WHEN ct.container_type = 'cna' THEN ct.container_id END)     AS cna_container_id,
    GROUP_CONCAT(CASE WHEN ct.container_type = 'adp'
                      THEN ct.container_id END
                 ORDER BY ct.container_id SEPARATOR ', ')                AS adp_container_ids,

    /* --- descripciones (EN) ------------------------------- */
    GROUP_CONCAT(DISTINCT CONCAT(d.lang, ': ', d.value)
                 ORDER BY d.lang SEPARATOR '\n')                         AS descriptions,

    /* --- CVSS (toma la nota más alta entre todos los vectores) --------*/
    MAX(cvss_v3.base_score)                                              AS max_cvss3_score,
    MAX(cvss_v31.base_score)                                             AS max_cvss31_score,
    MAX(cvss_v2.base_score)                                              AS max_cvss2_score,

    /* --- soluciones / mitigaciones ------------------------ */
    GROUP_CONCAT(DISTINCT CONCAT(s.lang, ': ', s.value)
                 ORDER BY s.lang SEPARATOR '\n')                         AS solutions,
	
    /* --- exploits ------------------------------- */
    GROUP_CONCAT(DISTINCT e.value
                 ORDER BY e.value SEPARATOR '\n')                        AS exploits,
	
    /* --- impactos ------------------------------- */
	GROUP_CONCAT(DISTINCT i.capec_id
                 ORDER BY i.capec_id SEPARATOR '\n')                        AS impact,
	
    /* --- descriptions ------------------------------- */
	GROUP_CONCAT(DISTINCT CONCAT(idesc.lang, ': ', s.value)
                 ORDER BY idesc.lang SEPARATOR '\n')                         AS impact_description,
	
    /* --- referencias ------------------------------- */
    GROUP_CONCAT(DISTINCT CONCAT(cve_ref.name, ': ', cve_ref.url)
                 ORDER BY cve_ref.url SEPARATOR '\n')                         AS cve_references

FROM        CVE                 AS c
JOIN        Container           AS ct      ON ct.cve_id       = c.cve_id
LEFT JOIN   Descriptions        AS d       ON d.container_id  = ct.container_id
LEFT JOIN   Metrics             AS m       ON m.container_id  = ct.container_id
LEFT JOIN   CVSSV3              AS cvss_v3  ON cvss_v3.metric_id  = m.metric_id
LEFT JOIN   CVSSV3_1            AS cvss_v31 ON cvss_v31.metric_id = m.metric_id
LEFT JOIN   CVSSV2              AS cvss_v2  ON cvss_v2.metric_id  = m.metric_id
LEFT JOIN   Solutions           AS s       ON s.container_id  = ct.container_id
LEFT JOIN   Exploits            AS e        ON e.container_id   = ct.container_id
LEFT JOIN   Impact             AS i        ON i.container_id   = ct.container_id
LEFT JOIN   Impact_Description  AS idesc    ON idesc.impact_id  = i.impact_id
LEFT JOIN	cve_references		AS cve_ref	ON cve_ref.container_id = ct.container_id

/*WHERE       c.cve_id = "CVE-1999-0001"*/	/* ←-- parámetro     */
WHERE       c.cve_id = "CVE-1999-0001"
GROUP BY    c.cve_id;