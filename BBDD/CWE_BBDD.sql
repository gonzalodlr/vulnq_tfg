CREATE TABLE Weaknesses (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    extended_description TEXT,
    structure ENUM('Simple', 'Composite', 'Chain') NOT NULL,
    abstraction ENUM('Pillar', 'Class', 'Base', 'Variant', 'Compound') NOT NULL,
    status ENUM('Deprecated', 'Draft', 'Incomplete', 'Obsolete', 'Stable', 'Usable') NOT NULL,
    likelihood_of_exploit ENUM('Low', 'Medium', 'High', 'Unknown'),
    diagram VARCHAR(255)
);
CREATE INDEX idx_weaknesses_id ON Weaknesses(id);
CREATE INDEX idx_weaknesses_name ON Weaknesses(name);

CREATE TABLE External_References (
    reference_id VARCHAR(255) PRIMARY KEY,
    author TEXT,
    title TEXT NOT NULL,
    edition TEXT,
    publication TEXT,
    publisher TEXT,
    publication_year INT,
    publication_month VARCHAR(2),
    publication_day VARCHAR(2),
    url TEXT,
    url_date DATE
);

CREATE TABLE Alternate_Terms (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT NOT NULL,
    term VARCHAR(1024) NOT NULL,
    description TEXT,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

-- Revisar Tabla de Demonstrative Examples
CREATE TABLE Demonstrative_Examples (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT,
    demostrative_id VARCHAR(255) NULL,
    title VARCHAR(255),
    intro TEXT NOT NULL,
    body TEXT,
    code TEXT,
    references_url TEXT,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

-- Esta tabla hay que ver que hacer con las referencias externas( ej: REF-1374 ) que no son cve_id
CREATE TABLE Observed_Examples (
    weakness_id INT NOT NULL,
    cve_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE,
    PRIMARY KEY (weakness_id, cve_id)
);

CREATE TABLE Functional_Areas (
    weakness_id INT NOT NULL,
    area VARCHAR(255) NOT NULL,
    PRIMARY KEY (weakness_id, area),
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Common_Consequences (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT,
    consequence_id VARCHAR(255),
    scope ENUM('Confidentiality', 'Integrity', 'Availability', 'Access Control', 'Accountability', 'Authentication', 'Authorization', 'Non-Repudiation', 'Other') NOT NULL,
    impact VARCHAR(255) NOT NULL,
    likelihood ENUM('Low', 'Medium', 'High', 'Unknown'),   
    note TEXT,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Affected_Resources (
    weakness_id INT NOT NULL,
    affected_resource ENUM('CPU', 'File or Directory', 'Memory', 'System Process', 'Other') NOT NULL,
    PRIMARY KEY (weakness_id, affected_resource),
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Languages (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT,
    name VARCHAR(255),
    class VARCHAR(255),
    prevalence ENUM('Often', 'Sometimes', 'Rarely', 'Undetermined') NOT NULL,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Operating_Systems (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT,
    name VARCHAR(255),
    version VARCHAR(255),
    cpe_id VARCHAR(255),
    class VARCHAR(255),
    prevalence ENUM('Often', 'Sometimes', 'Rarely', 'Undetermined') NOT NULL,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Architectures (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT,
    name VARCHAR(255),
    class VARCHAR(255),
    prevalence ENUM('Often', 'Sometimes', 'Rarely', 'Undetermined') NOT NULL,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE 
);

CREATE TABLE Technologies (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT,
    name VARCHAR(255),
    class VARCHAR(255),
    prevalence ENUM('Often', 'Sometimes', 'Rarely', 'Undetermined') NOT NULL,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Mitigations (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT,
    mitigation_id VARCHAR(255),
    description TEXT NOT NULL,
    phase VARCHAR(255),
    strategy VARCHAR(255),
    effectiveness ENUM('High', 'Moderate', 'Limited', 'Incidental', 'Discouraged Common Practice', 'Defense in Depth', 'None'),
    effectiveness_notes TEXT,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Related_Attack_Patterns (
    weakness_id INT NOT NULL,
    capec_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (weakness_id, capec_id),
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);
CREATE INDEX idx_weakness_id ON Related_Attack_Patterns(weakness_id);
CREATE INDEX idx_capec_id ON Related_Attack_Patterns(capec_id);

CREATE TABLE References_External_Table (
    weakness_id INT NOT NULL,
    reference_id VARCHAR(255) NOT NULL,
    section VARCHAR(255),
    PRIMARY KEY (weakness_id, reference_id),
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE,
    FOREIGN KEY (reference_id) REFERENCES External_References(reference_id) ON DELETE CASCADE
);

CREATE TABLE Related_Weaknesses (
    weakness_id INT NOT NULL,
    nature VARCHAR(255) NOT NULL,
    related_weakness_id INT NOT NULL,
    view_id INT NOT NULL,
    chain_id INT,
    ordinal VARCHAR(255),
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE,
    FOREIGN KEY (related_weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE,
    PRIMARY KEY (weakness_id, related_weakness_id, view_id)
);

CREATE TABLE Modes_Of_Introduction (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT,
    phase VARCHAR(255) NOT NULL,
    note TEXT,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Detection_Methods (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT NOT NULL,
    detection_method_id VARCHAR(255),
    method VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    effectiveness ENUM('High', 'Moderate', 'SOAR Partial', 'Opportunistic', 'Limited', 'None'),
    effectiveness_notes TEXT,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Background_Details (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT NOT NULL,
    detail TEXT NOT NULL,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Notes (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT NOT NULL,
    type ENUM('Applicable Platform', 'Maintenance', 'Relationship', 'Research Gap', 'Terminology', 'Theoretical', 'Other') NOT NULL,
    note TEXT NOT NULL,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

-- Cambiar Reasons a text y añadir todas las reasons para que no haya que crear otra tabla para tipos de reasons
-- Suggestions también hay que mirar si hacer nueva tabla o guardar en JSON

CREATE TABLE Mapping_Notes (
    id VARCHAR(64) PRIMARY KEY,
    weakness_id INT NOT NULL,
    uso ENUM('Discouraged', 'Prohibited', 'Allowed', 'Allowed-with-Review') NOT NULL, 
    rationale TEXT NOT NULL,
    comments TEXT NOT NULL,
    reasons TEXT NOT NULL,
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Mapping_Suggestions (
    mapping_notes_id VARCHAR(64) NOT NULL,
    cwe_id INT NOT NULL,
    comment TEXT NOT NULL,
    FOREIGN KEY (cwe_id) REFERENCES Weaknesses(id) ON DELETE CASCADE,
    FOREIGN KEY (mapping_notes_id) REFERENCES Mapping_Notes(id) ON DELETE CASCADE,
    PRIMARY KEY (mapping_notes_id, cwe_id)
);

CREATE TABLE Taxonomy_Mapping (
    weakness_id INT NOT NULL,
    taxonomy_name VARCHAR(255) NOT NULL,
    entry_id VARCHAR(255) NULL,
    entry_name text NULL,
    mapping_fit ENUM('Exact', 'CWE More Abstract', 'CWE More Specific', 'Imprecise', 'Perspective') NULL,
    PRIMARY KEY (weakness_id, taxonomy_name),
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

CREATE TABLE Weakness_Ordinalities (
    weakness_id INT NOT NULL,
    ordinality ENUM('Indirect', 'Primary', 'Resultant') NOT NULL,
    description TEXT,
    PRIMARY KEY (weakness_id, ordinality),
    FOREIGN KEY (weakness_id) REFERENCES Weaknesses(id) ON DELETE CASCADE
);

-- Content History Table la veo innecesaria
-- Weakness_Ordinalities Table no es muy importante
-- Exploitation_Factors Table no aparece ningun registro


-- Tabla maestra y no datos duplicados tablas de hechos