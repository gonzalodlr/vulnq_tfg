CREATE TABLE CVE (
    cve_id VARCHAR(25) PRIMARY KEY,
    data_type VARCHAR(32) DEFAULT 'CVE_RECORD' NOT NULL,
    data_version VARCHAR(10) DEFAULT '5.1.1' NOT NULL,
    state ENUM('PUBLISHED', 'REJECTED') NOT NULL,
    assigner_org_id CHAR(36) NOT NULL,
    assigner_short_name VARCHAR(32),
    requester_user_id CHAR(36),
    date_updated DATETIME,
    number_serial INT,
    date_reserved DATETIME,
    date_published DATETIME,
    UNIQUE (cve_id(25))
);

-- Container identifica de forma lógica el tipo de contenido asociado a un CVE
CREATE TABLE Container (
    container_id VARCHAR(64) PRIMARY KEY,  -- ejemplo: 'CVE-2024-12345_cna'
    cve_id VARCHAR(25) NOT NULL,
    container_type ENUM('cna', 'adp') NOT NULL,
    content_hash VARCHAR(32), -- hash del contenido para control de cambios
    UNIQUE (container_id, cve_id, container_type),
    FOREIGN KEY (cve_id) REFERENCES CVE(cve_id) ON DELETE CASCADE
);

-- CNA que depende del container lógico (ya no de hash del contenido)
CREATE TABLE CNA (
    cna_id VARCHAR(64) PRIMARY KEY, -- mismo que container_id
    date_assigned DATETIME,
    date_public DATETIME,
    title VARCHAR(256),
    source JSON,
    FOREIGN KEY (cna_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- ADP que también depende del container lógico
CREATE TABLE ADP (
    adp_id VARCHAR(64) PRIMARY KEY, -- mismo que container_id
    date_public DATETIME,
    title VARCHAR(256),
    source JSON,
    FOREIGN KEY (adp_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

CREATE TABLE Provider_Metadata (
    container_id VARCHAR(64) PRIMARY KEY,
    provider_org_id VARCHAR(36) NOT NULL,
    short_name VARCHAR(32),
    date_updated DATETIME,
    UNIQUE (container_id),
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- Mirar supporting_media ya que hay que normalizar
CREATE TABLE Descriptions (
    id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    value TEXT NOT NULL,
    UNIQUE (id, container_id),
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

CREATE TABLE Descriptions_Supporting_Media (
    id VARCHAR(64) PRIMARY KEY,
    description_id VARCHAR(64) NOT NULL,
    media_type VARCHAR(256) NOT NULL,
    base_64 BOOLEAN DEFAULT FALSE,
    value TEXT,
    FOREIGN KEY (description_id) REFERENCES Descriptions(id)
);

-- Mirar tags ya que hay que normalizar
CREATE TABLE CVE_References (
    id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    url TEXT NOT NULL,
    name VARCHAR(512),
    tags JSON,
    UNIQUE (id, container_id),
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

CREATE TABLE Affected_Product (
    product_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    vendor VARCHAR(512),
    product_name VARCHAR(2048),
    collection_url VARCHAR(2048),
    package_name VARCHAR(2048),
    default_status ENUM('affected', 'unaffected', 'unknown'),
    repo VARCHAR(2048),
    UNIQUE (container_id, product_id),
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- CPES dependen de Affected en CVE
CREATE TABLE Affected_Product_cpe (
    product_id VARCHAR(64) NOT NULL,
    cpe_id VARCHAR(64) NOT NULL,
    cpe23_item VARCHAR(2048) NOT NULL,
    PRIMARY KEY (product_id, cpe_id),
    FOREIGN KEY (product_id) REFERENCES Affected_Product(product_id)
);
-- Modules dependen de Affected en CVE
CREATE TABLE Modules (
    module_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL,
    module VARCHAR(4096),
    UNIQUE (product_id, module_id),
    FOREIGN KEY (product_id) REFERENCES Affected_Product(product_id)
);
-- Program_Files dependen de Affected en CVE
CREATE TABLE Program_Files (
    file_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL,
    file_path VARCHAR(1024),
    UNIQUE (product_id, file_id),
    FOREIGN KEY (product_id) REFERENCES Affected_Product(product_id)
);
-- Platforms dependen de Affected en CVE
CREATE TABLE Platforms (
    platform_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL,
    platform VARCHAR(1024),
    UNIQUE (product_id, platform_id),
    FOREIGN KEY (product_id) REFERENCES Affected_Product(product_id)
);
-- Program Routines dependen de Affected en CVE
CREATE TABLE Program_Routines (
    routine_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL,
    routine VARCHAR(1024),
    UNIQUE (product_id, routine_id),
    FOREIGN KEY (product_id) REFERENCES Affected_Product(product_id)
);

-- Versions dependen de Affected en CVE mirar changes[] para normalizar at y status
CREATE TABLE Affected_Version(
    affected_version_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL,
    affected_version VARCHAR(1024),
    affected_status ENUM('affected', 'unaffected', 'unknown'),
    version_type VARCHAR(128),
    less_than VARCHAR(1024),
    less_than_or_equal VARCHAR(1024),
    affected_changes JSON,
    FOREIGN KEY (product_id) REFERENCES Affected_Product(product_id)
);

-- Depende de CNA CVE
CREATE TABLE Problem_Types (
    problem_type_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- Depende de Problem_Types
CREATE TABLE Problem_Type_Description (
    description_id VARCHAR(64) PRIMARY KEY,
    problem_type_id VARCHAR(32) NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    description VARCHAR(4096) NOT NULL,
    cwe_id VARCHAR(10),
    type VARCHAR(128),
    UNIQUE (description_id, problem_type_id, lang),
    FOREIGN KEY (problem_type_id) REFERENCES Problem_Types(problem_type_id)
);

CREATE TABLE Problem_Type_Reference (
    reference_id VARCHAR(64) PRIMARY KEY,
    problem_type_id VARCHAR(32) NOT NULL,
    url TEXT,
    name VARCHAR(512),
    tags JSON,
    FOREIGN KEY (problem_type_id) REFERENCES Problem_Type_Description(problem_type_id)
);

CREATE TABLE Impact (
    impact_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    capec_id VARCHAR(11),
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);
-- Impact_description depende de Impact
CREATE TABLE Impact_Description (
    description_id VARCHAR(64) PRIMARY KEY,
    impact_id VARCHAR(64) NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    value VARCHAR(4096) NOT NULL,
    supporting_media JSON,

    FOREIGN KEY (impact_id) REFERENCES Impact(impact_id)
);

-- Configurations depende de CNA CVE
CREATE TABLE Configurations (
    configuration_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    value VARCHAR(4096) NOT NULL,
    supporting_media JSON,
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- workarounds depende de CNA CVE
CREATE TABLE Workarounds (
    workaround_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    value VARCHAR(4096) NOT NULL,
    supporting_media JSON,
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- Solutions depende de CNA CVE
CREATE TABLE Solutions (
    solution_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    value VARCHAR(4096) NOT NULL,
    supporting_media JSON,
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- Exploits depende de CNA CVE
CREATE TABLE Exploits (
    exploit_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    value VARCHAR(4096) NOT NULL,
    supporting_media JSON,
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- Timeline depende de CNA CVE
CREATE TABLE Timeline (
    timeline_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    event_time DATETIME NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    value VARCHAR(4096) NOT NULL,
    UNIQUE (timeline_id, container_id),
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- Credit depende de CNA CVE
CREATE TABLE Credit (
    credit_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    value VARCHAR(4096) NOT NULL,
    user_id CHAR(36),
    type ENUM('finder', 'reporter', 'analyst', 'coordinator', 'remediation developer', 'remediation reviewer', 'remediation verifier', 'tool', 'sponsor', 'other') DEFAULT 'finder',
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- Tags depende de CNA CVE
CREATE TABLE Tags (
    container_id VARCHAR(64) PRIMARY KEY,
    tag_extension VARCHAR(128),
    UNIQUE (container_id, tag_extension),
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- Taxonomy depende de CNA CVE
CREATE TABLE Taxonomy_Mappings (
    taxonomy_id_hash VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    taxonomy_name VARCHAR(128) NOT NULL,
    taxonomy_version VARCHAR(128),
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

-- Taxonomy_Relations depende de Taxonomy_Mappings
CREATE TABLE Taxonomy_Relations (
    taxonomy_id_hash VARCHAR(64) NOT NULL,
    relation_id VARCHAR(64) PRIMARY KEY,
    taxonomy_id  VARCHAR(2048) NOT NULL,
    relationship_name VARCHAR(128) NOT NULL,
    relationship_value VARCHAR(2048) NOT NULL,
    FOREIGN KEY (taxonomy_id_hash) REFERENCES Taxonomy_Mappings(taxonomy_id_hash) ON DELETE CASCADE
);

CREATE TABLE CPE_Applicability (
    applicability_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    operator ENUM('AND', 'OR'),
    negate BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

CREATE TABLE CPE_Node (
    node_id VARCHAR(64) PRIMARY KEY,
    applicability_id VARCHAR(64) NOT NULL,
    operator ENUM('AND', 'OR') NOT NULL,
    negate BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (applicability_id) REFERENCES CPE_Applicability(applicability_id) ON DELETE CASCADE
);

CREATE TABLE CPE_Match (
    match_id VARCHAR(64) PRIMARY KEY,
    node_id VARCHAR(64) NOT NULL,
    vulnerable BOOLEAN NOT NULL,
    criteria_cpe23 VARCHAR(2048) NOT NULL,
    match_criteria_id CHAR(36),
    version_start_excluding VARCHAR(1024),
    version_start_including VARCHAR(1024),
    version_end_excluding VARCHAR(1024),
    version_end_including VARCHAR(1024),
    FOREIGN KEY (node_id) REFERENCES CPE_Node(node_id) ON DELETE CASCADE
);

CREATE TABLE Metrics (
    metric_id VARCHAR(64) PRIMARY KEY,
    container_id VARCHAR(64) NOT NULL,
    format VARCHAR(64),
    other_type VARCHAR(128),
    other_content JSON,
    FOREIGN KEY (container_id) REFERENCES Container(container_id) ON DELETE CASCADE
);

CREATE TABLE Metrics_Scenarios (
    scenario_id VARCHAR(64) PRIMARY KEY,
    metric_id VARCHAR(64) NOT NULL,
    lang VARCHAR(10) DEFAULT 'en' NOT NULL,
    value VARCHAR(4096) NOT NULL,
    FOREIGN KEY (metric_id) REFERENCES Metrics(metric_id) ON DELETE CASCADE
);

-- Hay que ver el providerUrgency si tiene mas datos
CREATE TABLE CVSSV4 (
    cvssv4_id VARCHAR(64) PRIMARY KEY,
    metric_id VARCHAR(64) NOT NULL,
    version ENUM('4.0') NOT NULL,
    vector_string VARCHAR(2048) NOT NULL,
    base_score DECIMAL(3,1) NOT NULL,
    base_severity ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    attack_vector ENUM('NETWORK', 'ADJACENT', 'LOCAL', 'PHYSICAL'),
    attack_complexity ENUM('HIGH', 'LOW'),
    attack_requirements ENUM('NONE', 'PRESENT'),
    privileges_required ENUM('HIGH', 'LOW', 'NONE'),
    user_interaction ENUM('NONE', 'PASSIVE', 'ACTIVE'),
    vuln_confidentiality_impact ENUM('NONE', 'LOW', 'HIGH'),
    vuln_integrity_impact ENUM('NONE', 'LOW', 'HIGH'),
    vuln_availability_impact ENUM('NONE', 'LOW', 'HIGH'),
    sub_confidentiality_impact ENUM('NONE', 'LOW', 'HIGH'),
    sub_integrity_impact ENUM('NONE', 'LOW', 'HIGH'),
    sub_availability_impact ENUM('NONE', 'LOW', 'HIGH'),
    exploit_maturity ENUM('UNREPORTED', 'PROOF_OF_CONCEPT', 'ATTACKED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    confidentiality_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    integrity_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    availability_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_attack_vector ENUM('NETWORK', 'ADJACENT', 'LOCAL', 'PHYSICAL', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_attack_complexity ENUM('HIGH', 'LOW', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_attack_requirements ENUM('NONE', 'PRESENT', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_privileges_required ENUM('HIGH', 'LOW', 'NONE', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_user_interaction ENUM('NONE', 'PASSIVE', 'ACTIVE', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_vuln_confidentiality_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_vuln_integrity_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_vuln_availability_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_sub_confidentiality_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_sub_integrity_impact ENUM('NONE', 'LOW', 'HIGH', 'SAFETY', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_sub_availability_impact ENUM('NONE', 'LOW', 'HIGH', 'SAFETY', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    safety ENUM('NEGLIGIBLE', 'PRESENT', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    automatable ENUM('NO', 'YES', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    recovery ENUM('AUTOMATIC', 'USER', 'IRRECOVERABLE', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    value_density ENUM('DIFFUSE', 'CONCENTRATED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    vulnerability_response_effort ENUM('LOW', 'MODERATE', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    provider_urgency ENUM('CLEAR', 'GREEN', 'AMBER', 'RED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    FOREIGN KEY (metric_id) REFERENCES Metrics(metric_id) ON DELETE CASCADE
);

CREATE TABLE CVSSV3_1 (
    cvssv3_1_id VARCHAR(64) PRIMARY KEY,
    metric_id VARCHAR(64) NOT NULL,
    version ENUM('3.1') NOT NULL,
    vector_string VARCHAR(2048) NOT NULL,
    base_score DECIMAL(3,1) NOT NULL,
    base_severity ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    attack_vector ENUM('NETWORK', 'ADJACENT_NETWORK', 'LOCAL', 'PHYSICAL'),
    attack_complexity ENUM('HIGH', 'LOW'),
    privileges_required ENUM('HIGH', 'LOW', 'NONE'),
    user_interaction ENUM('NONE', 'REQUIRED'),
    scope ENUM('UNCHANGED', 'CHANGED'),
    confidentiality_impact ENUM('NONE', 'LOW', 'HIGH'),
    integrity_impact ENUM('NONE', 'LOW', 'HIGH'),
    availability_impact ENUM('NONE', 'LOW', 'HIGH'),
    exploit_code_maturity ENUM('UNPROVEN', 'PROOF_OF_CONCEPT', 'FUNCTIONAL', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    remediation_level ENUM('OFFICIAL_FIX', 'TEMPORARY_FIX', 'WORKAROUND', 'UNAVAILABLE', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    report_confidence ENUM('UNKNOWN', 'REASONABLE', 'CONFIRMED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    temporal_score DECIMAL(3,1) NULL,
    temporal_severity ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    confidentiality_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    integrity_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    availability_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_attack_vector ENUM('NETWORK', 'ADJACENT_NETWORK', 'LOCAL', 'PHYSICAL', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_attack_complexity ENUM('HIGH', 'LOW', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_privileges_required ENUM('HIGH', 'LOW', 'NONE', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_user_interaction ENUM('NONE', 'REQUIRED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_scope ENUM('UNCHANGED', 'CHANGED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_confidentiality_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_integrity_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_availability_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    environmental_score DECIMAL(3,1),
    environmental_severity ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    FOREIGN KEY (metric_id) REFERENCES Metrics(metric_id) ON DELETE CASCADE
);

CREATE TABLE CVSSV3 (
    cvssv3_id VARCHAR(64) PRIMARY KEY,
    metric_id VARCHAR(64) NOT NULL,
    version ENUM('3.0') NOT NULL,
    vector_string VARCHAR(2048) NOT NULL,
    base_score DECIMAL(3,1) NOT NULL,
    base_severity ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    attack_vector ENUM('NETWORK', 'ADJACENT_NETWORK', 'LOCAL', 'PHYSICAL'),
    attack_complexity ENUM('HIGH', 'LOW'),
    privileges_required ENUM('HIGH', 'LOW', 'NONE'),
    user_interaction ENUM('NONE', 'REQUIRED'),
    scope ENUM('UNCHANGED', 'CHANGED'),
    confidentiality_impact ENUM('NONE', 'LOW', 'HIGH'),
    integrity_impact ENUM('NONE', 'LOW', 'HIGH'),
    availability_impact ENUM('NONE', 'LOW', 'HIGH'),
    exploit_code_maturity ENUM('UNPROVEN', 'PROOF_OF_CONCEPT', 'FUNCTIONAL', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    remediation_level ENUM('OFFICIAL_FIX', 'TEMPORARY_FIX', 'WORKAROUND', 'UNAVAILABLE', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    report_confidence ENUM('UNKNOWN', 'REASONABLE', 'CONFIRMED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    temporal_score DECIMAL(3,1),
    temporal_severity ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    confidentiality_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    integrity_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    availability_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_attack_vector ENUM('NETWORK', 'ADJACENT_NETWORK', 'LOCAL', 'PHYSICAL', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_attack_complexity ENUM('HIGH', 'LOW', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_privileges_required ENUM('HIGH', 'LOW', 'NONE', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_user_interaction ENUM('NONE', 'REQUIRED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_scope ENUM('UNCHANGED', 'CHANGED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_confidentiality_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_integrity_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    modified_availability_impact ENUM('NONE', 'LOW', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    environmental_score DECIMAL(3,1),
    environmental_severity ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    FOREIGN KEY (metric_id) REFERENCES Metrics(metric_id) ON DELETE CASCADE
);

CREATE TABLE CVSSV2 (
    cvssv2_id VARCHAR(64) PRIMARY KEY,
    metric_id VARCHAR(64) NOT NULL,
    version ENUM('2.0') NOT NULL,
    vector_string VARCHAR(2048) NOT NULL,
    base_score DECIMAL(3,1) NOT NULL,
    access_vector ENUM('NETWORK', 'ADJACENT_NETWORK', 'LOCAL'),
    access_complexity ENUM('HIGH', 'MEDIUM', 'LOW'),
    authentication ENUM('MULTIPLE', 'SINGLE', 'NONE'),
    confidentiality_impact ENUM('NONE', 'PARTIAL', 'COMPLETE'),
    integrity_impact ENUM('NONE', 'PARTIAL', 'COMPLETE'),
    availability_impact ENUM('NONE', 'PARTIAL', 'COMPLETE'),
    exploitability ENUM('UNPROVEN', 'PROOF_OF_CONCEPT', 'FUNCTIONAL', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    remediation_level ENUM('OFFICIAL_FIX', 'TEMPORARY_FIX', 'WORKAROUND', 'UNAVAILABLE', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    report_confidence ENUM('UNCONFIRMED', 'UNCORROBORATED', 'CONFIRMED', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    temporal_score DECIMAL(3,1),
    collateral_damage_potential ENUM('NONE', 'LOW', 'LOW_MEDIUM', 'MEDIUM_HIGH', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    target_distribution ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    confidentiality_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    integrity_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    availability_requirement ENUM('LOW', 'MEDIUM', 'HIGH', 'NOT_DEFINED') DEFAULT 'NOT_DEFINED',
    environmental_score DECIMAL(3,1),
    FOREIGN KEY (metric_id) REFERENCES Metrics(metric_id) ON DELETE CASCADE
);

