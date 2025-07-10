CREATE TABLE cpe (
    cpe_id VARCHAR(64) PRIMARY KEY,
    cpe_name VARCHAR(255) UNIQUE,
    title VARCHAR(255),
    deprecated BOOLEAN,
    deprecation_date DATE,
    INDEX (cpe_name)
);

CREATE TABLE cpe_references (
    ref_id VARCHAR(64) PRIMARY KEY,
    cpe_id VARCHAR(64) NOT NULL,
    reference_url TEXT, -- Changed to TEXT to accommodate longer URLs
    reference_text VARCHAR(255),
    FOREIGN KEY (cpe_id) REFERENCES cpe (cpe_id)
);

CREATE TABLE cpe23_data (
    cpe23_id VARCHAR(64) PRIMARY KEY,
    cpe23_name VARCHAR(255) UNIQUE,
    cpe_id VARCHAR(64) NOT NULL,
    deprecated_date DATE,
    deprecated_by VARCHAR(255),
    deprecated_by_type VARCHAR(255),
    UNIQUE (cpe23_name),
    INDEX (cpe23_name),
    FOREIGN KEY (cpe_id) REFERENCES cpe (cpe_id)
);