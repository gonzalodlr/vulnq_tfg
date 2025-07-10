/** @format */
import { config } from "@/config/config";
// Find the CVE by product and version

export const getCVEByProductVersion = (product: string, version: string) => {
  return {
    text: `

        `,
    values: [
      `%${product.toLowerCase()}%`,
      `%${version}%`,
      `%${version}%`,
      `%${version}%`,
    ],
  };
};

// Audit by product and version
export const auditByProductVersion = (product: string, version: string) => {
  return {
    text: `
    SELECT
    c.cve_id,
    MIN(c.date_published) AS date_published,
    MIN(ap.vendor) AS vendor,
    MIN(ap.product_name) AS product_name,
    MIN(av.affected_version) AS affected_version,
    MIN(av.less_than) AS less_than,
    MIN(av.less_than_or_equal) AS less_than_or_equal,

    JSON_ARRAYAGG(
        JSON_OBJECT(
            'version', IF(v4.metric_id IS NOT NULL, '4.0',
                     IF(v31.metric_id IS NOT NULL, '3.1',
                     IF(v30.metric_id IS NOT NULL, '3.0',
                     IF(v20.metric_id IS NOT NULL, '2.0', NULL)))),
            'vector_string', COALESCE(v4.vector_string, v31.vector_string, v30.vector_string, v20.vector_string),
            'base_score', COALESCE(v4.base_score, v31.base_score, v30.base_score, v20.base_score),
            'base_severity', COALESCE(v4.base_severity, v31.base_severity, v30.base_severity, 'N/A')
        )
    ) AS metrics,

    JSON_ARRAYAGG(DISTINCT ptd.cwe_id) AS cwe_ids,
    JSON_ARRAYAGG(DISTINCT i.capec_id) AS capec_ids,
    JSON_ARRAYAGG(DISTINCT apc.cpe23_item) AS cpe_ids

FROM CVE c
JOIN Container ct ON ct.cve_id = c.cve_id
JOIN Affected_Product ap ON ap.container_id = ct.container_id
JOIN Affected_Version av ON av.product_id = ap.product_id

LEFT JOIN Metrics m ON m.container_id = ct.container_id
LEFT JOIN CVSSV4 v4 ON v4.metric_id = m.metric_id
LEFT JOIN CVSSV3_1 v31 ON v31.metric_id = m.metric_id
LEFT JOIN CVSSV3 v30 ON v30.metric_id = m.metric_id
LEFT JOIN CVSSV2 v20 ON v20.metric_id = m.metric_id

LEFT JOIN Problem_Types pt ON pt.container_id = ct.container_id
LEFT JOIN Problem_Type_Description ptd ON ptd.problem_type_id = pt.problem_type_id AND ptd.cwe_id IS NOT NULL

LEFT JOIN Impact i ON i.container_id = ct.container_id AND i.capec_id IS NOT NULL

LEFT JOIN Affected_Product_cpe apc ON apc.product_id = ap.product_id

WHERE LOWER(ap.product_name) LIKE ?
  AND (
        av.affected_version LIKE ?
     OR av.less_than LIKE ?
     OR av.less_than_or_equal LIKE ?
  )

GROUP BY c.cve_id;



    `,
    values: [
      `%${product.toLowerCase()}%`,
      `%${version}%`,
      `%${version}%`,
      `%${version}%`,
    ],
  };
};

// Find all data related to a CVE by its id
export const getAllDataByCVEId = (cveId: string) => {
  return {
    text: `
    SELECT
    c.cve_id                              AS cve_cve_id,
    c.data_type                           AS cve_data_type,
    c.data_version                        AS cve_data_version,
    c.state                               AS cve_state,
    c.assigner_org_id                     AS cve_assigner_org_id,
    c.assigner_short_name                 AS cve_assigner_short_name,
    c.requester_user_id                   AS cve_requester_user_id,
    c.date_updated                        AS cve_date_updated,
    c.number_serial                       AS cve_number_serial,
    c.date_reserved                       AS cve_date_reserved,
    c.date_published                      AS cve_date_published,

    ct.container_id                       AS container_container_id,
    ct.cve_id                             AS container_cve_id,
    ct.container_type                     AS container_container_type,
    ct.content_hash                       AS container_content_hash,

    cna.cna_id                            AS cna_cna_id,
    cna.date_assigned                     AS cna_date_assigned,
    cna.date_public                       AS cna_date_public,
    cna.title                             AS cna_title,
    cna.source                            AS cna_source,

    adp.adp_id                            AS adp_adp_id,
    adp.date_public                       AS adp_date_public,
    adp.title                             AS adp_title,
    adp.source                            AS adp_source,

    pm.container_id                       AS provider_metadata_container_id,
    pm.provider_org_id                    AS provider_metadata_provider_org_id,
    pm.short_name                         AS provider_metadata_short_name,
    pm.date_updated                       AS provider_metadata_date_updated,

    des.id                                AS descriptions_id,
    des.container_id                      AS descriptions_container_id,
    des.lang                              AS descriptions_lang,
    des.value                             AS descriptions_value,

    dsm.id                                AS descriptions_supporting_media_id,
    dsm.description_id                    AS descriptions_supporting_media_description_id,
    dsm.media_type                        AS descriptions_supporting_media_media_type,
    dsm.base_64                           AS descriptions_supporting_media_base_64,
    dsm.value                             AS descriptions_supporting_media_value,

    cr.credit_id                          AS credit_credit_id,
    cr.container_id                       AS credit_container_id,
    cr.lang                               AS credit_lang,
    cr.value                              AS credit_value,
    cr.user_id                            AS credit_user_id,
    cr.type                               AS credit_type,

    tag.container_id                      AS tags_container_id,
    tag.tag_extension                     AS tags_tag_extension,

    sol.solution_id                       AS solutions_solution_id,
    sol.container_id                      AS solutions_container_id,
    sol.lang                              AS solutions_lang,
    sol.value                             AS solutions_value,
    sol.supporting_media                  AS solutions_supporting_media,

    wa.workaround_id                      AS workarounds_workaround_id,
    wa.container_id                       AS workarounds_container_id,
    wa.lang                               AS workarounds_lang,
    wa.value                              AS workarounds_value,
    wa.supporting_media                   AS workarounds_supporting_media,

    ex.exploit_id                         AS exploits_exploit_id,
    ex.container_id                       AS exploits_container_id,
    ex.lang                               AS exploits_lang,
    ex.value                              AS exploits_value,

    ap.product_id                         AS affected_product_product_id,
    ap.container_id                       AS affected_product_container_id,
    ap.vendor                             AS affected_product_vendor,
    ap.product_name                       AS affected_product_product_name,
    ap.collection_url                     AS affected_product_collection_url,
    ap.package_name                       AS affected_product_package_name,
    ap.default_status                     AS affected_product_default_status,
    ap.repo                               AS affected_product_repo,

    apc.product_id                        AS affected_product_cpe_product_id,
    apc.cpe_id                            AS affected_product_cpe_cpe_id,
    apc.cpe23_item                        AS affected_product_cpe_cpe23_item,

    av.affected_version_id                AS affected_version_affected_version_id,
    av.product_id                         AS affected_version_product_id,
    av.affected_version                   AS affected_version_affected_version,
    av.affected_status                    AS affected_version_affected_status,
    av.version_type                       AS affected_version_version_type,
    av.less_than                          AS affected_version_less_than,
    av.less_than_or_equal                 AS affected_version_less_than_or_equal,
    av.affected_changes                   AS affected_version_affected_changes,

    plat.platform_id                      AS platforms_platform_id,
    plat.product_id                       AS platforms_product_id,
    plat.platform                         AS platforms_platform,

    modu.module_id                        AS modules_module_id,
    modu.product_id                       AS modules_product_id,
    modu.module                           AS modules_module,

    pfile.file_id                         AS program_files_file_id,
    pfile.product_id                      AS program_files_product_id,
    pfile.file_path                       AS program_files_file_path,

    proute.routine_id                     AS program_routines_routine_id,
    proute.product_id                     AS program_routines_product_id,
    proute.routine                        AS program_routines_routine,

    met.metric_id                         AS metrics_metric_id,
    met.container_id                      AS metrics_container_id,
    met.format                            AS metrics_format,
    met.other_type                        AS metrics_other_type,
    met.other_content                     AS metrics_other_content,

    cvss4.version AS CVSSV4_version,
    cvss4.vector_string AS CVSSV4_vector_string,
    cvss4.base_score AS CVSSV4_base_score,
    cvss4.base_severity AS CVSSV4_base_severity,
    cvss4.attack_vector AS CVSSV4_attack_vector,
    cvss4.attack_complexity AS CVSSV4_attack_complexity,
    cvss4.attack_requirements AS CVSSV4_attack_requirements,
    cvss4.privileges_required AS CVSSV4_privileges_required,
    cvss4.user_interaction AS CVSSV4_user_interaction,
    cvss4.vuln_confidentiality_impact AS CVSSV4_vuln_confidentiality_impact,
    cvss4.vuln_integrity_impact AS CVSSV4_vuln_integrity_impact,
    cvss4.vuln_availability_impact AS CVSSV4_vuln_availability_impact,
    cvss4.safety AS CVSSV4_safety,
    cvss4.automatable AS CVSSV4_automatable,
    cvss4.recovery AS CVSSV4_recovery,
    cvss4.value_density AS CVSSV4_value_density,
    cvss4.vulnerability_response_effort AS CVSSV4_vulnerability_response_effort,
    cvss4.provider_urgency AS CVSSV4_provider_urgency,

    cvss31.version AS CVSSV3_1_version,
    cvss31.vector_string AS CVSSV3_1_vector_string,
    cvss31.base_score AS CVSSV3_1_base_score,
    cvss31.base_severity AS CVSSV3_1_base_severity,
    cvss31.attack_vector AS CVSSV3_1_attack_vector,
    cvss31.attack_complexity AS CVSSV3_1_attack_complexity,
    cvss31.privileges_required AS CVSSV3_1_privileges_required,
    cvss31.user_interaction AS CVSSV3_1_user_interaction,
    cvss31.scope AS CVSSV3_1_scope,
    cvss31.confidentiality_impact AS CVSSV3_1_confidentiality_impact,
    cvss31.integrity_impact AS CVSSV3_1_integrity_impact,
    cvss31.availability_impact AS CVSSV3_1_availability_impact,

    cvss3.version AS CVSSV3_version,
    cvss3.vector_string AS CVSSV3_vector_string,
    cvss3.base_score AS CVSSV3_base_score,
    cvss3.base_severity AS CVSSV3_base_severity,
    cvss3.attack_vector AS CVSSV3_attack_vector,
    cvss3.attack_complexity AS CVSSV3_attack_complexity,
    cvss3.privileges_required AS CVSSV3_privileges_required,
    cvss3.user_interaction AS CVSSV3_user_interaction,
    cvss3.scope AS CVSSV3_scope,
    cvss3.confidentiality_impact AS CVSSV3_confidentiality_impact,
    cvss3.integrity_impact AS CVSSV3_integrity_impact,
    cvss3.availability_impact AS CVSSV3_availability_impact,

    cvss2.cvssv2_id AS CVSSV2_cvssv2_id,
    cvss2.metric_id AS CVSSV2_metric_id,
    cvss2.version AS CVSSV2_version,
    cvss2.vector_string AS CVSSV2_vector_string,
    cvss2.base_score AS CVSSV2_base_score,
    cvss2.access_vector AS CVSSV2_access_vector,
    cvss2.access_complexity AS CVSSV2_access_complexity,
    cvss2.authentication AS CVSSV2_authentication,
    cvss2.confidentiality_impact AS CVSS3_confidentiality_impact,
    cvss2.integrity_impact AS CVSSV2_integrity_impact,
    cvss2.availability_impact AS CVSSV2_availability_impact,

    mets.scenario_id                      AS metrics_scenarios_scenario_id,
    mets.metric_id                        AS metrics_scenarios_metric_id,
    mets.lang                             AS metrics_scenarios_lang,
    mets.value                            AS metrics_scenarios_value,

    imp.impact_id                         AS impact_impact_id,
    imp.container_id                      AS impact_container_id,
    imp.capec_id                          AS impact_capec_id,

    idesc.description_id                  AS impact_description_description_id,
    idesc.impact_id                       AS impact_description_impact_id,
    idesc.lang                            AS impact_description_lang,
    idesc.value                           AS impact_description_value,
    idesc.supporting_media                AS impact_description_supporting_media,

    pt.problem_type_id                    AS problem_types_problem_type_id,
    pt.container_id                       AS problem_types_container_id,

    ptd.description_id                    AS problem_type_description_description_id,
    ptd.problem_type_id                   AS problem_type_description_problem_type_id,
    ptd.lang                              AS problem_type_description_lang,
    ptd.description                       AS problem_type_description_description,
    ptd.cwe_id                            AS problem_type_description_cwe_id,

    ptr.reference_id                      AS problem_type_reference_reference_id,
    ptr.problem_type_id                   AS problem_type_reference_problem_type_id,
    ptr.url                               AS problem_type_reference_url,
    ptr.name                              AS problem_type_reference_name,
    ptr.tags                              AS problem_type_reference_tags,

    configs.configuration_id              AS configurations_configuration_id,
    configs.container_id                  AS configurations_container_id,
    configs.lang                          AS configurations_lang,
    configs.value                         AS configurations_value,
    configs.supporting_media              AS configurations_supporting_media,

    cpeapp.applicability_id               AS cpe_applicability_applicability_id,
    cpeapp.container_id                   AS cpe_applicability_container_id,
    cpeapp.operator                       AS cpe_applicability_operator,
    cpeapp.negate                         AS cpe_applicability_negate,

    cpenode.node_id                       AS cpe_node_node_id,
    cpenode.applicability_id              AS cpe_node_applicability_id,
    cpenode.operator                      AS cpe_node_operator,
    cpenode.negate                        AS cpe_node_negate,

    cpematch.match_id                     AS cpe_match_match_id,
    cpematch.node_id                      AS cpe_match_node_id,
    cpematch.vulnerable                   AS cpe_match_vulnerable,
    cpematch.criteria_cpe23               AS cpe_match_criteria_cpe23,
    cpematch.match_criteria_id            AS cpe_match_match_criteria_id,
    cpematch.version_start_excluding      AS cpe_match_version_start_excluding,
    cpematch.version_start_including      AS cpe_match_version_start_including,
    cpematch.version_end_excluding        AS cpe_match_version_end_excluding,
    cpematch.version_end_including        AS cpe_match_version_end_including,

    taxmap.taxonomy_id_hash               AS taxonomy_mappings_taxonomy_id_hash,
    taxmap.container_id                   AS taxonomy_mappings_container_id,
    taxmap.taxonomy_name                  AS taxonomy_mappings_taxonomy_name,
    taxmap.taxonomy_version               AS taxonomy_mappings_taxonomy_version,

    taxrel.relation_id                    AS taxonomy_relations_relation_id,
    taxrel.taxonomy_id_hash               AS taxonomy_relations_taxonomy_id_hash,
    taxrel.taxonomy_id                    AS taxonomy_relations_taxonomy_id,
    taxrel.relationship_name              AS taxonomy_relations_relationship_name,
    taxrel.relationship_value             AS taxonomy_relations_relationship_value,

    timeline.timeline_id                  AS timeline_timeline_id,
    timeline.container_id                 AS timeline_container_id,
    timeline.event_time                   AS timeline_event_time,
    timeline.lang                         AS timeline_lang,
    timeline.value                        AS timeline_value,

    cveref.id                             AS cve_references_id,
    cveref.container_id                   AS cve_references_container_id,
    cveref.url                            AS cve_references_url,
    cveref.name                           AS cve_references_name,
    cveref.tags                           AS cve_references_tags

FROM       CVE                       AS c
JOIN       Container                 AS ct     ON ct.cve_id            = c.cve_id
LEFT JOIN  CNA                       AS cna    ON cna.cna_id           = ct.container_id
LEFT JOIN  ADP                       AS adp    ON adp.adp_id           = ct.container_id
LEFT JOIN  Provider_Metadata         AS pm     ON pm.container_id      = ct.container_id
LEFT JOIN  Descriptions              AS des    ON des.container_id     = ct.container_id
LEFT JOIN  Descriptions_Supporting_Media AS dsm ON dsm.description_id  = des.id
LEFT JOIN  Credit                    AS cr     ON cr.container_id      = ct.container_id
LEFT JOIN  Tags                      AS tag    ON tag.container_id     = ct.container_id
LEFT JOIN  Solutions                 AS sol    ON sol.container_id     = ct.container_id
LEFT JOIN  Workarounds               AS wa     ON wa.container_id      = ct.container_id
LEFT JOIN  Exploits                  AS ex     ON ex.container_id      = ct.container_id

LEFT JOIN  Affected_Product          AS ap     ON ap.container_id      = ct.container_id
LEFT JOIN  Affected_Product_cpe      AS apc    ON apc.product_id       = ap.product_id
LEFT JOIN  Affected_Version          AS av     ON av.product_id        = ap.product_id
LEFT JOIN  Platforms                 AS plat   ON plat.product_id      = ap.product_id
LEFT JOIN  Modules                   AS modu   ON modu.product_id      = ap.product_id
LEFT JOIN  Program_Files             AS pfile  ON pfile.product_id     = ap.product_id
LEFT JOIN  Program_Routines          AS proute ON proute.product_id    = ap.product_id

LEFT JOIN  Metrics                   AS met    ON met.container_id     = ct.container_id
LEFT JOIN  CVSSV2                    AS cvss2  ON cvss2.metric_id      = met.metric_id
LEFT JOIN  CVSSV3                    AS cvss3  ON cvss3.metric_id      = met.metric_id
LEFT JOIN  CVSSV3_1                  AS cvss31 ON cvss31.metric_id     = met.metric_id
LEFT JOIN  CVSSV4                    AS cvss4  ON cvss4.metric_id      = met.metric_id
LEFT JOIN  Metrics_Scenarios         AS mets   ON mets.metric_id       = met.metric_id

LEFT JOIN  Impact                    AS imp    ON imp.container_id     = ct.container_id
LEFT JOIN  Impact_Description        AS idesc  ON idesc.impact_id      = imp.impact_id

LEFT JOIN  Problem_Types             AS pt     ON pt.container_id      = ct.container_id
LEFT JOIN  Problem_Type_Description  AS ptd    ON ptd.problem_type_id  = pt.problem_type_id
LEFT JOIN  Problem_Type_Reference    AS ptr    ON ptr.problem_type_id  = pt.problem_type_id

LEFT JOIN  Configurations            AS configs  ON configs.container_id = ct.container_id
LEFT JOIN  CPE_Applicability         AS cpeapp   ON cpeapp.container_id  = ct.container_id
LEFT JOIN  CPE_Node                  AS cpenode  ON cpenode.applicability_id = cpeapp.applicability_id
LEFT JOIN  CPE_Match                 AS cpematch ON cpematch.node_id     = cpenode.node_id

LEFT JOIN  Taxonomy_Mappings         AS taxmap ON taxmap.container_id  = ct.container_id
LEFT JOIN  Taxonomy_Relations        AS taxrel ON taxrel.taxonomy_id_hash = taxmap.taxonomy_id_hash

LEFT JOIN  Timeline                  AS timeline ON timeline.container_id = ct.container_id

LEFT JOIN  CVE_References            AS cveref ON cveref.container_id  = ct.container_id

WHERE      c.cve_id = ?;
    `,
    values: [cveId],
  };
};

// Find real time prefix search for CVE ID
export const getCVEByPrefix = (prefix: string) => {
  return {
    text: `SELECT cve_id
         FROM ${config.DB_CVE}.cve
         WHERE CAST(cve_id AS CHAR) LIKE ?
         ORDER BY cve_id
         LIMIT 10;`,
    values: [`%${prefix}%`],
  };
};

// Find real time CVE product search
export const getProduct = (product: string) => {
  return {
    text: `SELECT DISTINCT product_name FROM Affected_Product WHERE LOWER(product_name) LIKE ? LIMIT 20;`,
    values: [`%${product.toLowerCase()}%`],
  };
};

// Search 10 random CVE IDs
export const getRandomCVE = () => {
  return {
    text: `SELECT cve_id FROM ${config.DB_CVE}.CVE ORDER BY RAND() LIMIT 10;`,
    values: [],
  };
};
