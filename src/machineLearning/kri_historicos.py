import os
import pandas as pd
from sqlalchemy import create_engine
import pandas as pd

from sklearn.preprocessing import LabelEncoder

from src.config.db_config2 import USER, PASSWORD, HOST, PORT

TMP_DIR = "tmp_ml"
os.makedirs(TMP_DIR, exist_ok=True)

def save_or_load_df(filename, load_func):
    path = os.path.join(TMP_DIR, filename)
    if os.path.exists(path):
        print(f"Cargando {filename} desde cache...")
        return pd.read_pickle(path)
    else:
        df = load_func()
        df.to_pickle(path)
        print(f"Guardado {filename} en cache.")
        return df


# Conexiones a las tres bases de datos
engine_cve = create_engine(f'mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/cve')
engine_cwe = create_engine(f'mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/cwe')
engine_capec = create_engine(f'mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/capec')

#######################################################################################################
#
# Extracción de datos de CVE, CWE y CAPEC
#
#######################################################################################################

# CVE + métricas
df_cve = save_or_load_df("df_cve.pkl", lambda: pd.read_sql("""
WITH All_CVSS AS (
    SELECT
        m.container_id,
        co.cve_id,
        cvss.base_score,
        cvss.base_severity,
        cvss.attack_vector,
        cvss.attack_complexity,
        cvss.privileges_required,
        cvss.user_interaction
    FROM Metrics m
    JOIN Container co ON m.container_id = co.container_id
    JOIN (
        SELECT
            metric_id, base_score, base_severity,
            attack_vector, attack_complexity, privileges_required, user_interaction
        FROM CVSSV4
        UNION ALL
        SELECT
            metric_id, base_score, base_severity,
            attack_vector, attack_complexity, privileges_required, user_interaction
        FROM CVSSV3_1
        UNION ALL
        SELECT
            metric_id, base_score, base_severity,
            attack_vector, attack_complexity, privileges_required, user_interaction
        FROM CVSSV3
        UNION ALL
        SELECT
            metric_id,
            base_score,
            CASE
                WHEN base_score = 0 THEN 'NONE'
                WHEN base_score <= 3.9 THEN 'LOW'
                WHEN base_score <= 6.9 THEN 'MEDIUM'
                WHEN base_score <= 8.9 THEN 'HIGH'
                ELSE 'CRITICAL'
            END AS base_severity,
            access_vector AS attack_vector,
            access_complexity AS attack_complexity,
            authentication AS privileges_required,
            'REQUIRED' AS user_interaction
        FROM CVSSV2
    ) cvss ON m.metric_id = cvss.metric_id
),
Max_KRI_Per_CVE AS (
    SELECT
        cve_id,
        MAX(base_score) AS max_base_score
    FROM All_CVSS
    GROUP BY cve_id
),
Best_KRIs AS (
    SELECT
        a.container_id,
        a.cve_id,
        a.base_score AS max_base_score,
        a.base_severity,
        a.attack_vector,
        a.attack_complexity,
        a.privileges_required,
        a.user_interaction
    FROM All_CVSS a
    JOIN Max_KRI_Per_CVE m ON a.cve_id = m.cve_id AND a.base_score = m.max_base_score
),
CWEs AS (
    SELECT
        cont.container_id,
        GROUP_CONCAT(DISTINCT ptd.cwe_id) AS cwe_list
    FROM Container cont
    JOIN Problem_Types pt ON cont.container_id = pt.container_id
    JOIN Problem_Type_Description ptd ON pt.problem_type_id = ptd.problem_type_id
    WHERE ptd.cwe_id IS NOT NULL
    GROUP BY cont.container_id
),
Exploit_Counts AS (
    SELECT
        container_id,
        COUNT(*) AS exploit_count
    FROM Exploits
    GROUP BY container_id
),
Ranked_KRIs AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY cve_id ORDER BY max_base_score DESC, container_id) AS rn
    FROM Best_KRIs
)
SELECT
    r.container_id,
    r.cve_id,
    r.max_base_score,
    r.base_severity,
    r.attack_vector,
    r.attack_complexity,
    r.privileges_required,
    r.user_interaction,
    cve.date_published,
    w.cwe_list,
    COALESCE(e.exploit_count, 0) AS exploit_count
FROM Ranked_KRIs r
LEFT JOIN CWEs w ON r.container_id = w.container_id
LEFT JOIN Exploit_Counts e ON r.container_id = e.container_id
JOIN CVE cve ON r.cve_id = cve.cve_id
WHERE r.rn = 1;
"""
, engine_cve))

# CWE: KRI heurístico
df_cwe = save_or_load_df("df_cwe.pkl", lambda: pd.read_sql("""
SELECT id AS cwe_id,
       CASE likelihood_of_exploit
           WHEN 'High' THEN 10
           WHEN 'Medium' THEN 6
           WHEN 'Low' THEN 3
           ELSE 5
       END AS kri_cwe,
       likelihood_of_exploit       
FROM weaknesses
""", engine_cwe))

# CAPEC: KRI heurístico
df_capec = save_or_load_df("df_capec.pkl", lambda: pd.read_sql("""
SELECT AttackPatternID AS capec_id,
       (
           CASE Likelihood_Of_Attack
               WHEN 'High' THEN 1.0
               WHEN 'Medium' THEN 0.6
               WHEN 'Low' THEN 0.3
               ELSE 0.5
           END * 
           CASE Typical_Severity
               WHEN 'Very High' THEN 1.0
               WHEN 'High' THEN 0.8
               WHEN 'Medium' THEN 0.5
               WHEN 'Low' THEN 0.3
               ELSE 0.2
           END
       ) * 10 AS kri_capec,
       Likelihood_Of_Attack,
       Typical_Severity
FROM attackpattern
""", engine_capec))

# Relación CVE → CWE
df_cve_cwe = save_or_load_df("df_cve_cwe.pkl", lambda: pd.read_sql("""
SELECT DISTINCT
       c.cve_id,
       ptd.cwe_id
FROM   CVE                       AS c
JOIN   Container                 AS ct   ON ct.cve_id       = c.cve_id        -- paso 1
JOIN   Problem_Types             AS pt   ON pt.container_id = ct.container_id -- paso 2
JOIN   Problem_Type_Description  AS ptd  ON ptd.problem_type_id = pt.problem_type_id -- paso 3
WHERE  ptd.cwe_id IS NOT NULL          -- paso 4 (filtramos los registros sin CWE)
ORDER BY c.cve_id, ptd.cwe_id;
""", engine_cve))

# Relación CWE → CAPEC
df_cwe_capec = save_or_load_df("df_cwe_capec.pkl", lambda: pd.read_sql("""
SELECT 
    CONCAT('CWE-', weakness_id)  AS cwe_id,
    CONCAT('CAPEC-', capec_id)   AS capec_id
FROM 
    Related_Attack_Patterns;
""", engine_cwe))

#######################################################################################################
#
# Transformación y preparación de datos
#
#######################################################################################################

# Después de cargar df_cwe y df_capec
df_cwe["cwe_id"] = "CWE-" + df_cwe["cwe_id"].astype(str).str.strip()
df_capec["capec_id"] = "CAPEC-" + df_capec["capec_id"].astype(str).str.strip()
print(df_cve.head())
print(df_cwe.head())
print(df_capec.head())
print(df_cve_cwe.head())
print(df_cwe_capec.head())

# Merge encadenado
df = df_cve.merge(df_cve_cwe, on="cve_id", how="left")

# Normaliza cwe_id en ambos DataFrames
df["cwe_id"] = df["cwe_id"].astype(str).str.strip()
df_cwe["cwe_id"] = "CWE-" + df_cwe["cwe_id"].astype(str).str.strip()

df = df.merge(df_cwe, on="cwe_id", how="left")
df = df.merge(df_cwe_capec, on="cwe_id", how="left")

# Normaliza capec_id en ambos DataFrames
df["capec_id"] = df["capec_id"].astype(str).str.strip()
df_capec["capec_id"] = df_capec["capec_id"].astype(str).str.strip()
df = df.merge(df_capec, on="capec_id", how="left")

# Transformar fechas
df["date_published"] = pd.to_datetime(df["date_published"])
df["days_since_published"] = (pd.Timestamp.now() - df["date_published"]).dt.days

# Sanear NaN en columnas de obligatorias
df["kri_cwe"] = df["kri_cwe"].fillna(0)
df["kri_capec"] = df["kri_capec"].fillna(0)
for col in df.columns:
  print(f"{col}: {df[col].iloc[0]}")

# Eliminar columnas no necesarias
df.drop(columns=["container_id", "cwe_id", "capec_id"], inplace=True)

# Rellenar nulos
df.fillna(df.mean(numeric_only=True), inplace=True)

# Create the KRI column
df["kri"] = (
    0.6 * df["max_base_score"] +
    0.1 * df["exploit_count"] +
    0.1 * df["kri_cwe"] +
    0.2 * df["kri_capec"]
)

# Show one example of each column in the df
for col in df.columns:
  print(f"{col}: {df[col].iloc[0]}")

#######################################################################################################
#
# Guardado del dataset histórico de CVEs con KRI final
#
#######################################################################################################

# Reorganizar columnas para mejor lectura
df = df[[
    "cve_id", "date_published", "days_since_published",
    "max_base_score", "base_severity", "attack_vector", "attack_complexity",
    "privileges_required", "user_interaction", "exploit_count",
    "kri_cwe", "likelihood_of_exploit",
    "kri_capec", "Likelihood_Of_Attack", "Typical_Severity",
    "kri"
]]

# Codificar variables categóricas si vas a usar este df como input de modelo directamente
cat_cols = ["base_severity", "attack_vector", "attack_complexity", 
            "privileges_required", "user_interaction", 
            "likelihood_of_exploit", "Likelihood_Of_Attack", "Typical_Severity"]

for col in cat_cols:
    if col in df.columns:
        df[col] = LabelEncoder().fit_transform(df[col].astype(str))

# Validación básica
print("\nResumen del dataset final:")
print(df.info())
print(df.describe())

# Guardar
df.to_csv("historico_kri_por_cve.csv", index=False)
print("\n✅ Dataset guardado en 'historico_kri_por_cve.csv'")
