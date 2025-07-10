CREATE TABLE AttackPattern (
    AttackPatternID INT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Status ENUM('Deprecated', 'Draft', 'Incomplete', 'Obsolete', 'Stable', 'Usable') NOT NULL,
    Abstraction ENUM('Meta', 'Standard', 'Detailed') NOT NULL,
    Likelihood_Of_Attack ENUM('High', 'Medium', 'Low', 'Unknown'),
    Typical_Severity ENUM('Very High', 'High', 'Medium', 'Low', 'Very Low')
);

CREATE TABLE Description (
    DescriptionID VARCHAR(64) NOT NULL,
    AttackPatternID INT NOT NULL,
    DescriptionText TEXT NOT NULL,
    PRIMARY KEY (DescriptionID, AttackPatternID),
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Extended_Description (
    ExtendedDescriptionID VARCHAR(64) NOT NULL,
    AttackPatternID INT NOT NULL,
    DescriptionText TEXT NOT NULL,
    PRIMARY KEY (ExtendedDescriptionID, AttackPatternID),
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Alternate_Terms (
    AlternateTermID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    Term VARCHAR(255) NOT NULL,
    Description TEXT,
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Related_Weaknesses (
    AttackPatternID INT NOT NULL,
    CWE_ID INT NOT NULL,
    PRIMARY KEY (AttackPatternID, CWE_ID),
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Related_Attack_Patterns (
    AttackPatternID INT NOT NULL,
    CAPEC_ID INT NOT NULL,
    Nature ENUM('ChildOf', 'ParentOf', 'CanFollow', 'CanPrecede', 'CanAlsoBe', 'PeerOf'),
    PRIMARY KEY (AttackPatternID, CAPEC_ID),
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Mitigations (
    MitigationID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    MitigationText TEXT NOT NULL,
    UNIQUE (MitigationID, AttackPatternID),
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

-- revisar scope
CREATE TABLE Consequences (
    ConsequenceID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    Scope ENUM('Confidentiality', 'Integrity', 'Availability', 'Access Control', 'Accountability', 'Authentication', 'Authorization', 'Non-Repudiation', 'Other') NOT NULL,
    Impact ENUM('Modify Data', 'Read Data', 'Unreliable Execution', 'Resource Consumption', 'Execute Unauthorized Commands', 'Gain Privileges', 'Bypass Protection Mechanism', 'Hide Activities', 'Alter Execution Logic', 'Other'),   
    Likelihood_Of_Attack ENUM('High', 'Medium', 'Low', 'Unknown'),
    Note TEXT,
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Execution_Flow (
    ExecutionFlowID VARCHAR(64) NOT NULL,
    AttackPatternID INT NOT NULL,
    Attack_StepNumber INT NOT NULL,
    Phase ENUM('Explore', 'Experiment', 'Exploit') NOT NULL,
    Description TEXT NOT NULL,
    PRIMARY KEY (ExecutionFlowID),
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Attack_Techniques (
    TechniqueID VARCHAR(64) PRIMARY KEY,
    ExecutionFlowID VARCHAR(64) NOT NULL,
    CAPEC_ID INT,
    TechniqueText TEXT NOT NULL,
    FOREIGN KEY (ExecutionFlowID) REFERENCES Execution_Flow(ExecutionFlowID)
);

CREATE TABLE Prerequisites (
    PrerequisiteID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    PrerequisiteText TEXT NOT NULL,
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Skills_Required (
    SkillID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    SkillLevel ENUM('High', 'Medium', 'Low', 'Unknown') NOT NULL,
    Skill_Description TEXT NOT NULL,
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Resources_Required (
    ResourceID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    ResourceText TEXT NOT NULL,
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Indicators (
    IndicatorID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    IndicatorText TEXT NOT NULL,
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Example_Instances (
    ExampleID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    ExampleText TEXT NOT NULL,
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE Taxonomy_Mappings (
    MappingID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    Taxonomy_Name ENUM('ATTACK', 'WASC', 'OWASP Attacks') NOT NULL,
    Entry_ID VARCHAR(255),
    Entry_Name VARCHAR(255),
    Mapping_Fit ENUM('Exact', 'CAPEC More Abstract', 'CAPEC More Specific', 'Imprecise', 'Perspective'),
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

CREATE TABLE External_References (
    ReferenceID VARCHAR(255) PRIMARY KEY,
    Author VARCHAR(255),
    Title VARCHAR(255) NOT NULL,
    Edition VARCHAR(255),
    Publication VARCHAR(255),
    Publication_Year INT CHECK (Publication_Year >= 0 AND Publication_Year <= 9999),
    Publication_Month INT CHECK (Publication_Month >= 1 AND Publication_Month <= 12),
    Publication_Day INT CHECK (Publication_Day >= 1 AND Publication_Day <= 31),
    Publisher VARCHAR(255),
    URL TEXT,
    URL_Date DATE
);

CREATE TABLE CAPEC_References (
    AttackPatternID INT NOT NULL,
    External_Reference_ID VARCHAR(255) NOT NULL,
    Section VARCHAR(255), 
    PRIMARY KEY (AttackPatternID, External_Reference_ID),
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID),
    FOREIGN KEY (External_Reference_ID) REFERENCES External_References(ReferenceID)
);

CREATE TABLE Notes (
    NoteID VARCHAR(64) PRIMARY KEY,
    AttackPatternID INT NOT NULL,
    type ENUM('General', 'Specific', 'Maintenance', 'Relationship', 'Research Gap', 'Terminology', 'Other') NOT NULL,
    NoteText TEXT NOT NULL,
    FOREIGN KEY (AttackPatternID) REFERENCES AttackPattern(AttackPatternID)
);

-- Ignorado el CONTENT_HISTORY