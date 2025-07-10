import hashlib
import os
import zipfile
import json
from src.config.db_config import connect_db_cve, create_db, DB_CVE
from datetime import datetime
from multiprocessing import Pool, cpu_count
import pickle
import re
import requests
import shutil
import html
import json
EXTRACT_DIR = "./cve_data"
ZIP_PATH = "cvelistV5-main.zip"
URL = "https://github.com/CVEProject/cvelistV5/archive/refs/heads/main.zip"
TEMP_FILE = "processed_data.pkl"

def download_extract_cve_data(url, extract_to):
    print(f"Descargando {url} ...")
    
    print(f"ZIP descargado en {ZIP_PATH}")

    print(f"Extrayendo ZIP en {extract_to} ...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    print("Extracción completada.")
    return ZIP_PATH

def clean_for_sql(
    value,
    quitar_html=True,
    reemplazar_comillas=True,
    escapar_barra=True,
    normalizar_unicode=True,
    eliminar_control=True,
    eliminar_puntoycoma=True,
    eliminar_comodines=True
):
    """
    Limpia y prepara un texto para inserción segura en SQL.
    - Elimina o escapa caracteres problemáticos.
    - Opcionalmente elimina etiquetas HTML o las escapa.
    - Opcionalmente reemplaza comillas por tipográficas.
    - Elimina caracteres de control y punto y coma.
    - Normaliza a Unicode NFC.
    - Elimina comodines si se desea.
    """
    if not value or str(value).strip() == "":
        return ""
    if not isinstance(value, str):
        value = str(value)
    # Normaliza Unicode (opcional)
    if normalizar_unicode:
        try:
            import unicodedata
            value = unicodedata.normalize("NFC", value)
        except ImportError:
            pass
    # Elimina caracteres de control
    if eliminar_control:
        value = re.sub(r"[\x00-\x1F\x7F]", "", value)
    # Reemplaza comillas si se desea
    if reemplazar_comillas:
        value = value.replace("'", "`").replace('"', "``")
    # Escapa barra invertida si se desea
    if escapar_barra:
        value = value.replace("\\", "\\\\")
    # Elimina punto y coma si se desea
    if eliminar_puntoycoma:
        value = value.replace(";", "")
    # Elimina comodines si se desea
    if eliminar_comodines:
        value = value.replace("%", "").replace("_", "").replace("[", "").replace("]", "")
    # Limpieza de HTML
    if quitar_html:
        value = re.sub(r'<.*?>', '', value)
    else:
        value = html.escape(value)
    # Elimina dobles espacios y espacios al inicio/final
    value = re.sub(r'\s+', ' ', value).strip()
    return value

# Generar un hash MD5 único basado en el contenido del objeto
def generate_md5_hash(data):
    json_data = json.dumps(data, sort_keys=True)  # Serializar el objeto JSON
    return hashlib.md5(json_data.encode('utf-8')).hexdigest()  # Generar el hash MD5

def convert_iso_to_mysql_datetime(iso_datetime):
    """
    Convierte una fecha en formato RFC3339/ISO8601 al formato DATETIME de MySQL.
    """
    if not iso_datetime:
        return None  # Manejar valores nulos o vacíos
    try:
        # Parsear el formato RFC3339/ISO8601
        dt = datetime.fromisoformat(iso_datetime.replace("Z", "+00:00"))
        # Convertir al formato MySQL (sin zona horaria ni milisegundos)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError as e:
        print(f"❌ Error al convertir la fecha '{iso_datetime}': {e}")
        return None
    
def save_processed_data(filename, data):
    """Guarda los datos procesados en un archivo."""
    with open(filename, 'wb') as f:
        pickle.dump(data, f)
    print(f"✅ Datos procesados guardados en {filename}.")

def load_processed_data(filename):
    """Carga los datos procesados desde un archivo."""
    with open(filename, 'rb') as f:
        data = pickle.load(f)
    print(f"✅ Datos procesados cargados desde {filename}.")
    return data

def check_or_create_cve_db():
    conn = create_db()
    cursor = conn.cursor()

    # Verificar si la base de datos ya existe
    cursor.execute("SHOW DATABASES")
    databases = [db[0] for db in cursor.fetchall()]

    if DB_CVE not in databases:
        print(f"La base de datos {DB_CVE} no existe. Creándola ahora...")
        cursor.execute(f"CREATE DATABASE {DB_CVE}")

        # Conectarse a la base de datos recién creada
        conn.database = DB_CVE

        # Crear tablas
        with open('BBDD/BBDD_CVE.sql', 'r') as sql_file:
            sql_script = sql_file.read()
        sql_statements = sql_script.split(';')
        for statement in sql_statements:
            if statement.strip():
                cursor.execute(statement)
        print(f"✅ Base de datos {DB_CVE} creada con éxito.")
        conn.commit()

        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print("📋 Tablas en la base de datos:")
        for table in tables:
            print(table[0])
        print(f"✅ Tablas creadas con éxito en {DB_CVE}.")
        conn.commit()
    else:
        print(f"✅ La base de datos {DB_CVE} ya existe. Verificando tablas...")

        # Conectarse a la base de datos existente
        conn.database = DB_CVE
        cursor.execute("SHOW TABLES")
        tables = [t[0] for t in cursor.fetchall()]

        # Leer el script SQL para obtener los nombres de las tablas requeridas
        with open('BBDD/BBDD_CVE.sql', 'r') as sql_file:
            sql_script = sql_file.read()
        # Buscar nombres de tablas en CREATE TABLE statements
        required_tables = []
        for match in re.finditer(r'CREATE TABLE\s+`?(\w+)`?', sql_script, re.IGNORECASE):
            required_tables.append(match.group(1))

        missing_tables = [t for t in required_tables if t not in tables]
        if missing_tables:
            print(f"⚠️ Faltan las siguientes tablas: {missing_tables}. Creándolas ahora...")
            # Ejecutar solo los CREATE TABLE de las tablas faltantes
            for match in re.finditer(r'(CREATE TABLE\s+`?(\w+)`?.*?;)', sql_script, re.DOTALL | re.IGNORECASE):
                table_name = match.group(2)
                if table_name in missing_tables:
                    statement = match.group(1)
                    cursor.execute(statement)
            conn.commit()
            print(f"✅ Tablas faltantes creadas en {DB_CVE}.")
        else:
            print(f"✅ Todas las tablas existen en {DB_CVE}. Continuando con el proceso de ETL...")

def process_zip_and_find_json(zip_path, extract_to):
    os.makedirs(extract_to, exist_ok=True)
    cve_files = []

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        total_files = len(zip_ref.namelist())
        print(f"🔄 Total de archivos en el ZIP: {total_files}")

        for i, file in enumerate(zip_ref.namelist(), start=1):
            # print(f"📄 Archivo encontrado: {file}")  # Depuración
            # Extraer solo el nombre del archivo
            filename = os.path.basename(file)
            if filename.endswith('.json') and filename.startswith('CVE-'):
                extracted_path = zip_ref.extract(file, extract_to)
                cve_files.append(extracted_path)
            if i % 10000 == 0 or i == total_files:
                print(f"📂 Progreso: {i}/{total_files} archivos procesados...")

    print(f"✅ Archivos extraídos en: {extract_to}")
    return cve_files

def transform_cve_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if 'cveMetadata' not in data or data['cveMetadata']['state'] != 'PUBLISHED':
        return None

    # Inicializar listas de tablas BBDD
    cves = []
    containers = []
    cna_table = []
    adp_table = []
    provider_metadata = []
    problem_types = []
    problem_types_descriptions = []
    problem_types_descriptions_refs = []
    descriptions = []
    descriptions_supporting_media = []
    references = []
    metrics = []
    metrics_scenarios = []
    metrics_cvssv4 = []
    metrics_cvssv3_1 = []
    metrics_cvssv3 = []
    metrics_cvssv2 = []
    impacts = []
    impact_descriptions = []
    cpe_applicability = []
    cpe_nodes = []
    cpe_match = []
    configurations = []
    workarounds = []
    solutions = []
    exploits = []
    timelines = []
    credits_cve = []
    affected_products = []
    affected_products_cpe = []
    affected_products_platforms = []
    affected_products_modules = []
    affected_products_program_files = []
    affected_products_versions = []
    affected_products_program_routines = []
    taxonomy_mappings = []
    taxonomy_relations = []
    tags = []

    cve_metadata = data['cveMetadata']
    cve_id = cve_metadata.get('cveId')
    
    # CVE Table
    cves = [(cve_id, data['dataType'], data['dataVersion'], cve_metadata.get('state'), cve_metadata.get('assignerOrgId'), cve_metadata.get('assignerShortName'), cve_metadata.get('requesterUserId'), convert_iso_to_mysql_datetime(cve_metadata.get('dateUpdated')), cve_metadata.get('serial'), convert_iso_to_mysql_datetime(cve_metadata.get('dateReserved')), convert_iso_to_mysql_datetime(cve_metadata.get('datePublished')))]

    container_cna = data['containers']['cna']
    container_id_cna = cve_id + "_cna"  # Generar un ID único para el contenedor CNA
    container_content_hash = generate_md5_hash(container_cna)
    containers.append((container_id_cna, cve_id, 'cna', container_content_hash))
    # Recorrer CNA
    if container_cna:
        # CNA Table
        cna_table.append((container_id_cna, convert_iso_to_mysql_datetime(container_cna.get('dateAssigned')), convert_iso_to_mysql_datetime(container_cna.get('datePublic')), container_cna.get('title'), json.dumps(container_cna.get('source'))))

        # Provider Metadata
        container_cna_metadata = container_cna.get('providerMetadata')
        provider_metadata.append((container_id_cna, container_cna_metadata.get('orgId'), container_cna_metadata.get('shortName'), convert_iso_to_mysql_datetime(container_cna_metadata.get('dateUpdated'))))

        # Obtener los TimeLine del contenedor CNA
        for idx, tl in enumerate(container_cna.get('timeline', [])):
            timeline_id = generate_md5_hash(f"{container_id_cna}_timeline_{idx}")
            timelines.append((timeline_id, container_id_cna, convert_iso_to_mysql_datetime(tl.get('time')), tl.get('lang'), tl.get('value')))

        # Obtener las descripciones del contenedor CNA (no puede ser nulo)
        for idx, desc in enumerate(container_cna.get('descriptions', [])):
            id_desc = generate_md5_hash(f"{container_id_cna}_desc_{idx}")
            value = desc.get('value')
            descriptions.append((id_desc, container_id_cna, desc.get('lang'), value))
            # Soporte de medios
            for idx_media, supporting_media in enumerate(desc.get('supportingMedia', [])):
                supporting_media_id = generate_md5_hash(f"{id_desc}_supporting_media_{idx_media}")
                descriptions_supporting_media.append((
                    supporting_media_id,
                    id_desc,
                    supporting_media.get('type'),
                    supporting_media.get('base64'),
                    supporting_media.get('value')
                ))
            
        # Obtener las referencias del contenedor CNA
        for idx, ref in enumerate(container_cna.get('references', [])):
            ref_id = generate_md5_hash(f"{container_id_cna}_ref_{idx}") 
            tags_refs = json.dumps(ref.get('tags')) if ref.get('tags') else None
            references.append((ref_id, container_id_cna, ref['url'], ref.get('name'), tags_refs))

        # Obtener los tipos de problema del contenedor CNA
        for idx, pt in enumerate(container_cna.get('problemTypes', [])):
            problem_type_id = generate_md5_hash(f"{container_id_cna}_problem_type_{idx}")
            problem_types.append((problem_type_id, container_id_cna))
            for idx_desc, desc in enumerate(pt.get('descriptions', [])):
                desc_id = generate_md5_hash(f"{problem_type_id}_desc_{idx_desc}")
                problem_types_descriptions.append((desc_id, problem_type_id, desc.get('lang'), desc.get('description'), desc.get('cweId'), desc.get('type')))
                # Referencias de los tipos de problema
                for idx_ref, ref in enumerate(desc.get('references', [])):
                    id_ref = generate_md5_hash(f"{problem_type_id}_ref_{idx_ref}")
                    tags_refs = json.dumps(ref.get('tags')) if ref.get('tags') else None
                    problem_types_descriptions_refs.append((id_ref, problem_type_id, ref['url'], ref.get('name'), tags_refs))

        # Obtener los créditos del contenedor CNA
        for idx, credit in enumerate(container_cna.get('credits', [])):
            credit_id = generate_md5_hash(f"{container_id_cna}_credit_{idx}")
            credits_cve.append((credit_id, container_id_cna, credit.get('lang'), credit.get('value'), credit.get('user'), credit.get('type')))
        
        # Obtener los productos afectados del contenedor CNA
        for idx, a in enumerate(container_cna.get('affected', [])):
            product_id = generate_md5_hash(f"{container_id_cna}_affected_{idx}")
            affected_products.append((product_id, container_id_cna, a.get('vendor'), a.get('product'), a.get('collectionURL'), a.get('packageName'), a.get('defaultStatus'), a.get('repo')))
            # Platforms
            for idx_platform, platform in enumerate(a.get('platforms', [])):
                affected_products_platforms.append((generate_md5_hash(f"{product_id}_platform_{idx_platform}"), product_id, platform))
            # CPES
            for idx_cpe, cpe in enumerate(a.get('cpes', [])):
                affected_products_cpe.append((generate_md5_hash(f"{product_id}_cpe_{idx_cpe}"), product_id, cpe))
            # Modules
            for idx_module, module in enumerate(a.get('modules', [])):
                affected_products_modules.append((generate_md5_hash(f"{product_id}_module_{idx_module}"), product_id, module))
            # Program Files
            for idx_program_file, program_file in enumerate(a.get('programFiles', [])):
                affected_products_program_files.append((generate_md5_hash(f"{product_id}_program_file_{idx_program_file}"), product_id, program_file))
            # Versions
            for idx_version, version in enumerate(a.get('versions', [])):
                version_id = generate_md5_hash(f"{product_id}_version_{idx_version}")
                changes = json.dumps(version.get('changes')) if version.get('changes') else None

                affected_products_versions.append((version_id, product_id, version.get('version'), version.get('status'), version.get('versionType'), version.get('lessThan'), version.get('lessThanOrEqual'), changes))
            # Program Routines
            for idx_program_routine, program_routine in enumerate(a.get('programRoutines', [])):
                routine_name = program_routine.get('name')
                affected_products_program_routines.append((generate_md5_hash(f"{product_id}_program_routine_{idx_program_routine}"), product_id, routine_name))          
                
        # Configurations
        for idx, config in enumerate(container_cna.get('configurations', [])):
            config_id = generate_md5_hash(f"{container_id_cna}_config_{idx}")
            supporting_media = json.dumps(config.get('supportingMedia')) if config.get('supportingMedia') else None
            configurations.append((config_id, container_id_cna, config.get('lang'), config.get('value'), supporting_media))

        # Workarounds
        for idx, workaround in enumerate(container_cna.get('workarounds', [])):
            workaround_id = generate_md5_hash(f"{container_id_cna}_workaround_{idx}")
            supporting_media = json.dumps(workaround.get('supportingMedia')) if workaround.get('supportingMedia') else None
            workarounds.append((workaround_id, container_id_cna, workaround.get('lang'), workaround.get('value'), supporting_media))
        
        # Solutions
        for idx, solution in enumerate(container_cna.get('solutions', [])):
            solution_id = generate_md5_hash(f"{container_id_cna}_solution_{idx}")
            supporting_media = json.dumps(solution.get('supportingMedia')) if solution.get('supportingMedia') else None
            solutions.append((solution_id, container_id_cna, solution.get('lang'), solution.get('value'), supporting_media))
        
        # Exploits
        for idx, exploit in enumerate(container_cna.get('exploits', [])):
            exploit_id = generate_md5_hash(f"{container_id_cna}_exploit_{idx}")
            supporting_media = json.dumps(exploit.get('supportingMedia')) if exploit.get('supportingMedia') else None
            exploits.append((exploit_id, container_id_cna, exploit.get('lang'), exploit.get('value'), supporting_media))

        # Impacts
        for idx, impact in enumerate(container_cna.get('impacts', [])):
            impact_id = generate_md5_hash(f"{container_id_cna}_impact_{idx}")            
            impacts.append((impact_id, container_id_cna, impact.get('capecId')))
            # Descriptions
            for idx_desc, desc in enumerate(impact.get('descriptions', [])):
                desc_id = generate_md5_hash(f"{impact_id}_desc_{idx_desc}")
                supporting_media = json.dumps(desc.get('supportingMedia')) if desc.get('supportingMedia') else None
                impact_descriptions.append((desc_id, impact_id, desc.get('lang'), desc.get('value'), supporting_media))

        # Taxonomy Mappings
        for idx, mapping in enumerate(container_cna.get('taxonomyMappings', [])):
            mapping_id = generate_md5_hash(f"{container_id_cna}_mapping_{idx}")
            taxonomy_mappings.append((mapping_id, container_id_cna, mapping.get('taxonomyName'), mapping.get('taxonomyVersion')))
            # Taxonomy Relations
            for idx_rel, rel in enumerate(mapping.get('taxonomyRelations', [])):
                relation_id = generate_md5_hash(f"{mapping_id}_relation_{idx_rel}")
                taxonomy_relations.append((relation_id, mapping_id, rel.get('taxonomyId'), rel.get('relationshipName'), rel.get('relationshipValue')))
        
        # Tags
        for idx, tag in enumerate(container_cna.get('tags', [])):
            tags.append((container_id_cna, tag))
        
        # CPE Applicability
        for idx, cpe in enumerate(container_cna.get('cpeApplicability', [])):
            applicability_id = generate_md5_hash(f"{container_id_cna}_cpe_applicability_{idx}")
            cpe_applicability.append((applicability_id, container_id_cna, cpe.get('operator'), cpe.get('negate')))
            # CPE Nodes
            for idx_node, node in enumerate(cpe.get('nodes', [])):
                node_id = generate_md5_hash(f"{applicability_id}_node_{idx_node}")
                cpe_nodes.append((node_id, applicability_id, node.get('operator'), node.get('negate')))
                # CPE Match
                for idx_match, match in enumerate(node.get('cpeMatch', [])):
                    match_id = generate_md5_hash(f"{node_id}_match_{idx_match}")
                    cpe_match.append((match_id, node_id, match.get('vulnerable'), match.get('criteria'), match.get('matchCriteriaId'), match.get('versionStartExcluding'),  match.get('versionStartIncluding'), match.get('versionEndExcluding'), match.get('versionEndIncluding')))

        # Metrics
        for idx, metric in enumerate(container_cna.get('metrics', [])):
            metric_id = generate_md5_hash(f"{container_id_cna}_metric_{idx}")
            other = metric.get('other', {})
            if isinstance(other, dict):
                    other_content = json.dumps(other.get('content')) if other.get('content') else None
                    other_type = other.get('type', None)
            elif isinstance(other, str):
                    print(f"Warning: 'other' is a string in metric {metric_id}. This may not be expected.")
            else:
                    other_content = None
                    other_type = None
            metrics.append((metric_id, container_id_cna, metric.get('format'), other_type, other_content))

            # Scenarios
            for idx_scenario, scenario in enumerate(metric.get('scenarios', [])):
                scenario_id = generate_md5_hash(f"{metric_id}_scenario_{idx_scenario}")
                metrics_scenarios.append((scenario_id, metric_id, scenario.get('lang'), scenario.get('value')))
            
            # CVSSv4
            if metric.get('cvssV4_0') is not None:
                    cvssv4 = metric['cvssV4_0']
                    cvssv4_id = generate_md5_hash(f"{metric_id}_cvssv4")
                    metrics_cvssv4.append((
                        cvssv4_id,
                        metric_id,
                        cvssv4.get('vectorString'),
                        cvssv4.get('version'),
                        cvssv4.get('baseScore'),
                        cvssv4.get('baseSeverity', 'NONE'),  # NONE LOW MEDIUM HIGH CRITICAL
                        cvssv4.get('attackVector'),  # NETWORK ADJACENT LOCAL PHYSICAL NOT_DEFINED
                        cvssv4.get('attackComplexity'),  # HIGH LOW NOT_DEFINED
                        cvssv4.get('attackRequirements', 'NONE'),  # NONE PRESENT NOT_DEFINED
                        cvssv4.get('privilegesRequired', 'NONE'),  # HIGH LOW NONE
                        cvssv4.get('userInteraction', 'NONE'),  # NONE PASSIVE ACTIVE NOT_DEFINED
                        cvssv4.get('vulnConfidentialityImpact', 'NONE'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('vulnIntegrityImpact', 'NONE'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('vulnAvailabilityImpact', 'NONE'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('subConfidentialityImpact', 'NONE'),  # NONE LOW HIGH
                        cvssv4.get('subIntegrityImpact', 'NONE'),  # NONE LOW HIGH
                        cvssv4.get('subAvailabilityImpact', 'NONE'),  # NONE LOW HIGH
                        cvssv4.get('exploitMaturity', 'NOT_DEFINED'),  # UNREPORTED PROOF_OF_CONCEPT ATTACKED NOT_DEFINED
                        cvssv4.get('confidentialityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH NOT_DEFINED
                        cvssv4.get('integrityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH NOT_DEFINED
                        cvssv4.get('availabilityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH NOT_DEFINED
                        cvssv4.get('modifiedAttackVector', 'NOT_DEFINED'),  # NETWORK ADJACENT LOCAL PHYSICAL NOT_DEFINED
                        cvssv4.get('modifiedAttackComplexity', 'NOT_DEFINED'),  # HIGH LOW NOT_DEFINED
                        cvssv4.get('modifiedAttackRequirements', 'NOT_DEFINED'),  # NONE PRESENT NOT_DEFINED
                        cvssv4.get('modifiedPrivilegesRequired', 'NOT_DEFINED'),  # HIGH LOW NONE NOT_DEFINED
                        cvssv4.get('modifiedUserInteraction', 'NOT_DEFINED'),  # NONE PASSIVE ACTIVE NOT_DEFINED
                        cvssv4.get('modifiedVulnConfidentialityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('modifiedVulnIntegrityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('modifiedVulnAvailabilityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('modifiedSubConfidentialityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('modifiedSubIntegrityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH SAFETY NOT_DEFINED
                        cvssv4.get('modifiedSubAvailabilityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH SAFETY NOT_DEFINED
                        cvssv4.get('Safety', 'NOT_DEFINED'),  # NEGLIGIBLE PRESENT NOT_DEFINED
                        cvssv4.get('Automatable', 'NOT_DEFINED'),  # NO YES NOT_DEFINED
                        cvssv4.get('Recovery', 'NOT_DEFINED'),  # AUTOMATIC USER IRRECOVERABLE NOT_DEFINED
                        cvssv4.get('valueDensity', 'NOT_DEFINED'),  # DIFFUSE CONCENTRATED NOT_DEFINED
                        cvssv4.get('vulnerabilityResponseEffort', 'NOT_DEFINED'),  # LOW MODERATE HIGH NOT_DEFINED
                        cvssv4.get('providerUrgency', 'NOT_DEFINED')  # CLEAR GREEN AMBER RED NOT_DEFINED
                    ))
            # CVSSv3.1
            if metric.get('cvssV3_1') is not None:
                    cvssv3_1 = metric['cvssV3_1']
                    cvss3_1_id = generate_md5_hash(f"{metric_id}_cvssv3_1")
                    metrics_cvssv3_1.append((
                        cvss3_1_id,
                        metric_id,
                        cvssv3_1.get('version'),
                        cvssv3_1.get('vectorString'),
                        cvssv3_1.get('baseScore'),
                        cvssv3_1.get('baseSeverity', 'NONE'),
                        cvssv3_1.get('attackVector'),
                        cvssv3_1.get('attackComplexity'),
                        cvssv3_1.get('privilegesRequired', 'NONE'),
                        cvssv3_1.get('userInteraction', 'NONE'),
                        cvssv3_1.get('scope'),
                        cvssv3_1.get('confidentialityImpact', 'NONE'),
                        cvssv3_1.get('integrityImpact', 'NONE'),
                        cvssv3_1.get('availabilityImpact', 'NONE'),
                        cvssv3_1.get('exploitCodeMaturity', 'NOT_DEFINED'),
                        cvssv3_1.get('remediationLevel', 'NOT_DEFINED'),
                        cvssv3_1.get('reportConfidence', 'NOT_DEFINED'),
                        cvssv3_1.get('temporalScore'),
                        cvssv3_1.get('temporalSeverity', 'NONE'),
                        cvssv3_1.get('confidentialityRequirement', 'NOT_DEFINED'),
                        cvssv3_1.get('integrityRequirement', 'NOT_DEFINED'),
                        cvssv3_1.get('availabilityRequirement', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedAttackVector', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedAttackComplexity', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedPrivilegesRequired', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedUserInteraction', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedScope', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedConfidentialityImpact', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedIntegrityImpact', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedAvailabilityImpact', 'NOT_DEFINED'),
                        cvssv3_1.get('environmentalScore'),
                        cvssv3_1.get('environmentalSeverity', 'NONE')
                    ))
            
            # CVSSv3
            if metric.get('cvssV3_0') is not None:
                    cvss3 = metric['cvssV3_0']
                    cvss3_id = generate_md5_hash(f"{metric_id}_cvssv3")
                    metrics_cvssv3.append((
                        cvss3_id,
                        metric_id,
                        cvss3.get('version'),
                        cvss3.get('vectorString'),
                        cvss3.get('baseScore'),
                        cvss3.get('baseSeverity', 'NONE'),
                        cvss3.get('attackVector'),
                        cvss3.get('attackComplexity'),
                        cvss3.get('privilegesRequired', 'NONE'),
                        cvss3.get('userInteraction', 'NONE'),
                        cvss3.get('scope'),
                        cvss3.get('confidentialityImpact', 'NONE'),
                        cvss3.get('integrityImpact', 'NONE'),
                        cvss3.get('availabilityImpact', 'NONE'),
                        cvss3.get('exploitCodeMaturity', 'NOT_DEFINED'),
                        cvss3.get('remediationLevel', 'NOT_DEFINED'),
                        cvss3.get('reportConfidence', 'NOT_DEFINED'),
                        cvss3.get('temporalScore'),
                        cvss3.get('temporalSeverity', 'NONE'),
                        cvss3.get('confidentialityRequirement', 'NOT_DEFINED'),
                        cvss3.get('integrityRequirement', 'NOT_DEFINED'),
                        cvss3.get('availabilityRequirement', 'NOT_DEFINED'),
                        cvss3.get('modifiedAttackVector', 'NOT_DEFINED'),
                        cvss3.get('modifiedAttackComplexity', 'NOT_DEFINED'),
                        cvss3.get('modifiedPrivilegesRequired', 'NOT_DEFINED'),
                        cvss3.get('modifiedUserInteraction', 'NOT_DEFINED'),
                        cvss3.get('modifiedScope', 'NOT_DEFINED'),
                        cvss3.get('modifiedConfidentialityImpact', 'NOT_DEFINED'),
                        cvss3.get('modifiedIntegrityImpact', 'NOT_DEFINED'),
                        cvss3.get('modifiedAvailabilityImpact', 'NOT_DEFINED'),
                        cvss3.get('environmentalScore'),
                        cvss3.get('environmentalSeverity', 'NONE'),
                    ))
            
            # CVSSv2
            if metric.get('cvssV2_0') is not None:
                    cvss2 = metric['cvssV2_0']
                    cvss2_id = generate_md5_hash(f"{metric_id}_cvssv2")
                    metrics_cvssv2.append((
                        cvss2_id,
                        metric_id,
                        cvss2.get('version'),
                        cvss2.get('vectorString'),
                        cvss2.get('baseScore'),
                        cvss2.get('accessVector'),  # NETWORK ADJACENT_NETWORK LOCAL
                        cvss2.get('accessComplexity'),  # HIGH MEDIUM LOW
                        cvss2.get('authentication', 'NONE'),  # MULTIPLE SINGLE NONE
                        cvss2.get('confidentialityImpact', 'NONE'),  # NONE PARTIAL COMPLETE
                        cvss2.get('integrityImpact', 'NONE'),  # NONE PARTIAL COMPLETE
                        cvss2.get('availabilityImpact', 'NONE'),  # NONE PARTIAL COMPLETE
                        cvss2.get('exploitability ', 'NOT_DEFINED'),  # NONE LOW MEDIUM 
                        cvss2.get('remediationLevel ', 'NOT_DEFINED'),  # OFFICIAL_FIX TEMPORARY_FIX WORKAROUND UNAVAILABLE
                        cvss2.get('reportConfidence', 'NOT_DEFINED'),  # UNCONFIRMED UNLIKELY 
                        cvss2.get('temporalScore'),
                        cvss2.get('collateralDamagePotential', 'NOT_DEFINED'),  # NONE LOW LOW_MEDIUM HIGH
                        cvss2.get('targetDistribution', 'NOT_DEFINED'),  # NONE LOW LOW_MEDIUM HIGH
                        cvss2.get('confidentialityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH
                        cvss2.get('integrityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH
                        cvss2.get('availabilityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH
                        cvss2.get('environmentalScore'),  # Environmental Score
                    ))


    container_adp = data['containers']['adp'] if 'adp' in data['containers'] else None
    # Recorrer ADP
    if container_adp:
        i = 0
        # ADP Table
        for adp_entry in container_adp:
            #Generar un hash único para cada publicador basado en el contenido del objeto
            i += 1
            container_id_adp = container_adp_id = cve_id + "_adp_" + str(i)  # Generar un ID único para el contenedor ADP
            containers.append((container_adp_id, cve_id, 'adp', generate_md5_hash(adp_entry)))
            
            # ADP Table
            adp_table.append((container_adp_id, convert_iso_to_mysql_datetime(adp_entry.get('datePublic')), adp_entry.get('title'), json.dumps(adp_entry.get('source'))))

            # Provider Metadata
            container_adp_metadata = adp_entry.get('providerMetadata')
            provider_metadata.append((container_id_adp, container_adp_metadata.get('orgId'), container_adp_metadata.get ('shortName'), convert_iso_to_mysql_datetime(container_adp_metadata.get('dateUpdated'))))

            # Obtener los TimeLine del contenedor ADP
            for idx, tl in enumerate(adp_entry.get('timeline', [])):
                timeline_id = generate_md5_hash(f"{container_id_adp}_timeline_{idx}")
                timelines.append((timeline_id, container_id_adp, convert_iso_to_mysql_datetime(tl.get('time')), tl.get('lang'), tl.get('value')))
            
            # Obtener las descripciones del contenedor ADP      
            for idx, desc in enumerate(adp_entry.get('descriptions', [])):
                id_desc = generate_md5_hash(f"{container_id_adp}_desc_{idx}")
                value = desc.get('value')
                descriptions.append((id_desc, container_id_adp, desc.get('lang'), value))
                # Soporte de medios
                for idx_media, supporting_media in enumerate(desc.get('supportingMedia', [])):
                    supporting_media_id = generate_md5_hash(f"{id_desc}_supporting_media_{idx_media}")
                    descriptions_supporting_media.append((
                        supporting_media_id,
                        id_desc,
                        supporting_media.get('type'),
                        supporting_media.get('base64'),
                        supporting_media.get('value')
                    ))
            
            # Obtener las referencias del contenedor ADP
            for idx, ref in enumerate(adp_entry.get('references', [])):
                ref_id = generate_md5_hash(f"{container_id_adp}_ref_{idx}")
                tags_refs = json.dumps(ref.get('tags')) if ref.get('tags') else None
                references.append((ref_id, container_id_adp, ref['url'], ref.get('name'), tags_refs))
            
            # Obtener los tipos de problema del contenedor CNA
            for idx, pt in enumerate(adp_entry.get('problemTypes', [])):
                problem_type_id = generate_md5_hash(f"{container_id_adp}_problem_type_{idx}")
                problem_types.append((problem_type_id, container_id_adp))
                for idx_desc, desc in enumerate(pt.get('descriptions', [])):
                    desc_id = f"{problem_type_id}_desc_{idx_desc}"
                    problem_types_descriptions.append((generate_md5_hash(desc_id), problem_type_id, desc.get('lang'), desc.get('description'), desc.get('cweId'), desc.get('type')))
                    # Referencias de los tipos de problema
                    for idx_ref, ref in enumerate(desc.get('references', [])):
                        id_ref = f"{problem_type_id}_ref_{idx_ref}"
                        tags_refs = json.dumps(ref.get('tags')) if ref.get('tags') else None
                        problem_types_descriptions_refs.append((generate_md5_hash(id_ref), problem_type_id, ref['url'], ref.get('name'), tags_refs))

            # Obtener los créditos del contenedor ADP
            for idx, credit in enumerate(adp_entry.get('credits', [])):
                credit_id = generate_md5_hash(f"{container_id_adp}_credit_{idx}")
                credits_cve.append((credit_id, container_id_adp, credit.get('lang'), credit.get('value'), credit.get('user'), credit.get('type')))
            
            # Obtener los productos afectados del contenedor ADP
            for idx, a in enumerate(adp_entry.get('affected', [])):
                product_id = generate_md5_hash(f"{container_id_adp}_affected_{idx}")
                affected_products.append((product_id, container_id_adp, a.get('vendor'), a.get('product'), a.get('collectionURL'), a.get('packageName'), a.get('defaultStatus'), a.get('repo')))
                # Platforms
                for idx_platform, platform in enumerate(a.get('platforms', [])):
                    affected_products_platforms.append((f"{product_id}_platform_{idx_platform}", product_id, platform))
                # CPES
                for idx_cpe, cpe in enumerate(a.get('cpes', [])):
                    affected_products_cpe.append((f"{product_id}_cpe_{idx_cpe}", product_id, cpe))
                # Modules
                for idx_module, module in enumerate(a.get('modules', [])):
                    affected_products_modules.append((f"{product_id}_module_{idx_module}", product_id, module))
                # Program Files
                for idx_program_file, program_file in enumerate(a.get('programFiles', [])):
                    affected_products_program_files.append((f"{product_id}_program_file_{idx_program_file}", product_id, program_file))
                # Versions
                for idx_version, version in enumerate(a.get('versions', [])):
                    version_id = f"{product_id}_version_{idx_version}"
                    changes = json.dumps(version.get('changes')) if version.get('changes') else None
                    affected_products_versions.append((version_id, product_id, version.get('version'), version.get('status'), version.get('versionType'), version.get('lessThan'), version.get('lessThanOrEqual'), changes))
                # Program Routines
                for idx_program_routine, program_routine in enumerate(a.get('programRoutines', [])):
                    affected_products_program_routines.append((generate_md5_hash(f"{product_id}_program_routine_{idx_program_routine}"), product_id, program_routine.get('name'))) 
            
            # Configurations
            for idx, config in enumerate(adp_entry.get('configurations', [])):
                config_id = generate_md5_hash(f"{container_id_adp}_config_{idx}")
                supporting_media = json.dumps(config.get('supportingMedia')) if config.get('supportingMedia') else None
                configurations.append((config_id, container_id_adp, config.get('lang'), config.get('value'), supporting_media))
            
            # Workarounds
            for idx, workaround in enumerate(adp_entry.get('workarounds', [])):
                workaround_id = generate_md5_hash(f"{container_id_adp}_workaround_{idx}")
                supporting_media = json.dumps(workaround.get('supportingMedia')) if workaround.get('supportingMedia') else None
                workarounds.append((workaround_id, container_id_adp, workaround.get('lang'), workaround.get('value'), supporting_media))
            
            # Solutions
            for idx, solution in enumerate(adp_entry.get('solutions', [])):
                solution_id = generate_md5_hash(f"{container_id_adp}_solution_{idx}")
                supporting_media = json.dumps(solution.get('supportingMedia')) if solution.get('supportingMedia') else None
                solutions.append((solution_id, container_id_adp, solution.get('lang'), solution.get('value'), supporting_media))
            
            # Exploits
            for idx, exploit in enumerate(adp_entry.get('exploits', [])):
                exploit_id = generate_md5_hash(f"{container_id_adp}_exploit_{idx}")
                supporting_media = json.dumps(exploit.get('supportingMedia')) if exploit.get('supportingMedia') else None
                exploits.append((exploit_id, container_id_adp, exploit.get('lang'), exploit.get('value'), supporting_media))
            
            # Impacts
            for idx, impact in enumerate(adp_entry.get('impacts', [])):
                impact_id = generate_md5_hash(f"{container_id_adp}_impact_{idx}")
                impacts.append((impact_id, container_id_adp, impact.get('capecId')))
                # Descriptions
                for idx_desc, desc in enumerate(impact.get('descriptions', [])):
                    desc_id = generate_md5_hash(f"{impact_id}_desc_{idx_desc}")
                    supporting_media = json.dumps(desc.get('supportingMedia')) if desc.get('supportingMedia') else None
                    impact_descriptions.append((desc_id, impact_id, desc.get('lang'), desc.get('value'), supporting_media))

            # Taxonomy Mappings
            for idx, mapping in enumerate(adp_entry.get('taxonomyMappings', [])):
                mapping_id = generate_md5_hash(f"{container_id_adp}_mapping_{idx}")
                taxonomy_mappings.append((mapping_id, container_id_adp, mapping.get('taxonomyName'), mapping.get('taxonomyVersion')))
                # Taxonomy Relations
                for idx_rel, rel in enumerate(mapping.get('taxonomyRelations', [])):
                    relation_id = generate_md5_hash(f"{mapping_id}_relation_{idx_rel}")
                    taxonomy_relations.append((relation_id, mapping_id, rel.get('taxonomyId'), rel.get('relationshipName'), rel.get('relationshipValue')))
            
            # Tags
            for idx, tag in enumerate(adp_entry.get('tags', [])):
                tags.append((container_id_adp, tag))
            
            # CPE Applicability
            for idx, cpe in enumerate(adp_entry.get('cpeApplicability', [])):
                applicability_id = generate_md5_hash(f"{container_id_adp}_cpe_applicability_{idx}")
                cpe_applicability.append((applicability_id, container_id_adp, cpe.get('operator'), cpe.get  ('negate')))
                # CPE Nodes
                for idx_node, node in enumerate(cpe.get('nodes', [])):
                    node_id = generate_md5_hash(f"{applicability_id}_node_{idx_node}")
                    cpe_nodes.append((node_id, applicability_id, node.get('operator'), node.get('negate')))
                    # CPE Match
                    for idx_match, match in enumerate(node.get('cpeMatch', [])):
                        match_id = generate_md5_hash(f"{node_id}_match_{idx_match}")
                        cpe_match.append((match_id, node_id, match.get('vulnerable'), match.get('criteria'), match.get('matchCriteriaId'), match.get('versionStartExcluding'), match.get('versionStartIncluding'), match.get('versionEndExcluding'), match.get('versionEndIncluding')))

                    # Metrics
            
            # Metrics
            for idx, metric in enumerate(adp_entry.get('metrics', [])):
                metric_id = generate_md5_hash(f"{container_id_adp}_metric_{idx}")
                other = metric.get('other', {})
                
                if isinstance(other, dict):
                    other_content = json.dumps(other.get('content')) if other.get('content') else None
                    other_type = other.get('type', None)
                elif isinstance(other, str):
                    print(f"Warning: 'other' is a string in metric {metric_id}. This may not be expected.")
                else:
                    other_content = None
                    other_type = None
                metrics.append((metric_id, container_id_adp, metric.get('format'), other_type, other_content))

                # Scenarios
                for idx_scenario, scenario in enumerate(metric.get('scenarios', [])):
                    scenario_id = generate_md5_hash(f"{metric_id}_scenario_{idx_scenario}")
                    metrics_scenarios.append((scenario_id, metric_id, scenario.get('lang'), scenario.get('value')))
                # CVSSv4
                if metric.get('cvssV4_0') is not None:
                    cvssv4 = metric['cvssV4_0']
                    cvssv4_id = generate_md5_hash(f"{metric_id}_cvssv4")
                    metrics_cvssv4.append((
                        cvssv4_id,
                        metric_id,
                        cvssv4.get('vectorString'),
                        cvssv4.get('version'),
                        cvssv4.get('baseScore'),
                        cvssv4.get('baseSeverity', 'NONE'),  # NONE LOW MEDIUM HIGH CRITICAL
                        cvssv4.get('attackVector'),  # NETWORK ADJACENT LOCAL PHYSICAL NOT_DEFINED
                        cvssv4.get('attackComplexity'),  # HIGH LOW NOT_DEFINED
                        cvssv4.get('attackRequirements', 'NONE'),  # NONE PRESENT NOT_DEFINED
                        cvssv4.get('privilegesRequired', 'NONE'),  # HIGH LOW NONE
                        cvssv4.get('userInteraction', 'NONE'),  # NONE PASSIVE ACTIVE NOT_DEFINED
                        cvssv4.get('vulnConfidentialityImpact', 'NONE'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('vulnIntegrityImpact', 'NONE'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('vulnAvailabilityImpact', 'NONE'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('subConfidentialityImpact', 'NONE'),  # NONE LOW HIGH
                        cvssv4.get('subIntegrityImpact', 'NONE'),  # NONE LOW HIGH
                        cvssv4.get('subAvailabilityImpact', 'NONE'),  # NONE LOW HIGH
                        cvssv4.get('exploitMaturity', 'NOT_DEFINED'),  # UNREPORTED PROOF_OF_CONCEPT ATTACKED NOT_DEFINED
                        cvssv4.get('confidentialityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH NOT_DEFINED
                        cvssv4.get('integrityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH NOT_DEFINED
                        cvssv4.get('availabilityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH NOT_DEFINED
                        cvssv4.get('modifiedAttackVector', 'NOT_DEFINED'),  # NETWORK ADJACENT LOCAL PHYSICAL NOT_DEFINED
                        cvssv4.get('modifiedAttackComplexity', 'NOT_DEFINED'),  # HIGH LOW NOT_DEFINED
                        cvssv4.get('modifiedAttackRequirements', 'NOT_DEFINED'),  # NONE PRESENT NOT_DEFINED
                        cvssv4.get('modifiedPrivilegesRequired', 'NOT_DEFINED'),  # HIGH LOW NONE NOT_DEFINED
                        cvssv4.get('modifiedUserInteraction', 'NOT_DEFINED'),  # NONE PASSIVE ACTIVE NOT_DEFINED
                        cvssv4.get('modifiedVulnConfidentialityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('modifiedVulnIntegrityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('modifiedVulnAvailabilityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('modifiedSubConfidentialityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH NOT_DEFINED
                        cvssv4.get('modifiedSubIntegrityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH SAFETY NOT_DEFINED
                        cvssv4.get('modifiedSubAvailabilityImpact', 'NOT_DEFINED'),  # NONE LOW HIGH SAFETY NOT_DEFINED
                        cvssv4.get('Safety', 'NOT_DEFINED'),  # NEGLIGIBLE PRESENT NOT_DEFINED
                        cvssv4.get('Automatable', 'NOT_DEFINED'),  # NO YES NOT_DEFINED
                        cvssv4.get('Recovery', 'NOT_DEFINED'),  # AUTOMATIC USER IRRECOVERABLE NOT_DEFINED
                        cvssv4.get('valueDensity', 'NOT_DEFINED'),  # DIFFUSE CONCENTRATED NOT_DEFINED
                        cvssv4.get('vulnerabilityResponseEffort', 'NOT_DEFINED'),  # LOW MODERATE HIGH NOT_DEFINED
                        cvssv4.get('providerUrgency', 'NOT_DEFINED')  # CLEAR GREEN AMBER RED NOT_DEFINED
                    ))

                # CVSSv3.1
                if metric.get('cvssV3_1') is not None:
                    cvssv3_1 = metric['cvssV3_1']
                    cvss3_1_id = generate_md5_hash(f"{metric_id}_cvssv3_1")
                    metrics_cvssv3_1.append((
                        cvss3_1_id,
                        metric_id,
                        cvssv3_1.get('version'),
                        cvssv3_1.get('vectorString'),
                        cvssv3_1.get('baseScore'),
                        cvssv3_1.get('baseSeverity', 'NONE'),
                        cvssv3_1.get('attackVector'),
                        cvssv3_1.get('attackComplexity'),
                        cvssv3_1.get('privilegesRequired', 'NONE'),
                        cvssv3_1.get('userInteraction', 'NONE'),
                        cvssv3_1.get('scope'),
                        cvssv3_1.get('confidentialityImpact', 'NONE'),
                        cvssv3_1.get('integrityImpact', 'NONE'),
                        cvssv3_1.get('availabilityImpact', 'NONE'),
                        cvssv3_1.get('exploitCodeMaturity', 'NOT_DEFINED'),
                        cvssv3_1.get('remediationLevel', 'NOT_DEFINED'),
                        cvssv3_1.get('reportConfidence', 'NOT_DEFINED'),
                        cvssv3_1.get('temporalScore'),
                        cvssv3_1.get('temporalSeverity', 'NONE'),
                        cvssv3_1.get('confidentialityRequirement', 'NOT_DEFINED'),
                        cvssv3_1.get('integrityRequirement', 'NOT_DEFINED'),
                        cvssv3_1.get('availabilityRequirement', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedAttackVector', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedAttackComplexity', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedPrivilegesRequired', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedUserInteraction', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedScope', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedConfidentialityImpact', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedIntegrityImpact', 'NOT_DEFINED'),
                        cvssv3_1.get('modifiedAvailabilityImpact', 'NOT_DEFINED'),
                        cvssv3_1.get('environmentalScore'),
                        cvssv3_1.get('environmentalSeverity', 'NONE')
                    ))
            
                # CVSSv3
                if metric.get('cvssV3_0') is not None:
                    cvss3 = metric['cvssV3_0']
                    cvss3_id = generate_md5_hash(f"{metric_id}_cvssv3")
                    metrics_cvssv3.append((
                        cvss3_id,
                        metric_id,
                        cvss3.get('version'),
                        cvss3.get('vectorString'),
                        cvss3.get('baseScore'),
                        cvss3.get('baseSeverity', 'NONE'),
                        cvss3.get('attackVector'),
                        cvss3.get('attackComplexity'),
                        cvss3.get('privilegesRequired', 'NONE'),
                        cvss3.get('userInteraction', 'NONE'),
                        cvss3.get('scope'),
                        cvss3.get('confidentialityImpact', 'NONE'),
                        cvss3.get('integrityImpact', 'NONE'),
                        cvss3.get('availabilityImpact', 'NONE'),
                        cvss3.get('exploitCodeMaturity', 'NOT_DEFINED'),
                        cvss3.get('remediationLevel', 'NOT_DEFINED'),
                        cvss3.get('reportConfidence', 'NOT_DEFINED'),
                        cvss3.get('temporalScore'),
                        cvss3.get('temporalSeverity', 'NONE'),
                        cvss3.get('confidentialityRequirement', 'NOT_DEFINED'),
                        cvss3.get('integrityRequirement', 'NOT_DEFINED'),
                        cvss3.get('availabilityRequirement', 'NOT_DEFINED'),
                        cvss3.get('modifiedAttackVector', 'NOT_DEFINED'),
                        cvss3.get('modifiedAttackComplexity', 'NOT_DEFINED'),
                        cvss3.get('modifiedPrivilegesRequired', 'NOT_DEFINED'),
                        cvss3.get('modifiedUserInteraction', 'NOT_DEFINED'),
                        cvss3.get('modifiedScope', 'NOT_DEFINED'),
                        cvss3.get('modifiedConfidentialityImpact', 'NOT_DEFINED'),
                        cvss3.get('modifiedIntegrityImpact', 'NOT_DEFINED'),
                        cvss3.get('modifiedAvailabilityImpact', 'NOT_DEFINED'),
                        cvss3.get('environmentalScore'),
                        cvss3.get('environmentalSeverity', 'NONE'),
                    ))

                # CVSSv2
                if metric.get('cvssV2_0') is not None:
                    cvss2 = metric['cvssV2_0']
                    cvss2_id = generate_md5_hash(f"{metric_id}_cvssv2")
                    metrics_cvssv2.append((
                        cvss2_id,
                        metric_id,
                        cvss2.get('version'),
                        cvss2.get('vectorString'),
                        cvss2.get('baseScore'),
                        cvss2.get('accessVector'),  # NETWORK ADJACENT_NETWORK LOCAL
                        cvss2.get('accessComplexity'),  # HIGH MEDIUM LOW
                        cvss2.get('authentication', 'NONE'),  # MULTIPLE SINGLE NONE
                        cvss2.get('confidentialityImpact', 'NONE'),  # NONE PARTIAL COMPLETE
                        cvss2.get('integrityImpact', 'NONE'),  # NONE PARTIAL COMPLETE
                        cvss2.get('availabilityImpact', 'NONE'),  # NONE PARTIAL COMPLETE
                        cvss2.get('exploitability ', 'NOT_DEFINED'),  # NONE LOW MEDIUM 
                        cvss2.get('remediationLevel ', 'NOT_DEFINED'),  # OFFICIAL_FIX TEMPORARY_FIX WORKAROUND UNAVAILABLE
                        cvss2.get('reportConfidence', 'NOT_DEFINED'),  # UNCONFIRMED UNLIKELY 
                        cvss2.get('temporalScore'),
                        cvss2.get('collateralDamagePotential', 'NOT_DEFINED'),  # NONE LOW LOW_MEDIUM HIGH
                        cvss2.get('targetDistribution', 'NOT_DEFINED'),  # NONE LOW LOW_MEDIUM HIGH
                        cvss2.get('confidentialityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH
                        cvss2.get('integrityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH
                        cvss2.get('availabilityRequirement', 'NOT_DEFINED'),  # LOW MEDIUM HIGH
                        cvss2.get('environmentalScore'),  # Environmental Score
                    ))

    
    return (
    cves, containers, cna_table, adp_table, provider_metadata, timelines, descriptions, descriptions_supporting_media, references,
    problem_types, problem_types_descriptions, problem_types_descriptions_refs, credits_cve, affected_products, affected_products_cpe,
    affected_products_platforms, affected_products_modules, affected_products_program_files,
    affected_products_versions, affected_products_program_routines, configurations, workarounds, solutions, exploits, impacts, impact_descriptions, taxonomy_mappings, taxonomy_relations, tags, cpe_applicability, cpe_nodes, cpe_match, metrics, metrics_scenarios, metrics_cvssv4, metrics_cvssv3_1, metrics_cvssv3, metrics_cvssv2
)

def clean_files(zip_path, extract_to):
    if os.path.exists(zip_path):
        os.remove(zip_path)
        print(f"ZIP eliminado: {zip_path}")
    if os.path.exists(extract_to):
        shutil.rmtree(extract_to)
        print(f"Directorio extraído eliminado: {extract_to}")

def load_cve_data(cves, containers, cna_table, adp_table, provider_metadata, timelines, descriptions, descriptions_supporting_media, references, problem_types, problem_types_descriptions, problem_types_descriptions_refs, credits_cve, affected_products, affected_products_cpe, affected_products_platforms, affected_products_modules, affected_products_program_files, affected_products_versions, affected_products_program_routines, configurations, workarounds, solutions, exploits, impacts, impact_descriptions, taxonomy_mappings, taxonomy_relations, tags, cpe_applicability, cpe_nodes, cpe_match, metrics, metrics_scenarios, metrics_cvssv4, metrics_cvssv3_1, metrics_cvssv3, metrics_cvssv2, batch_size=10000):
    conn = connect_db_cve()
    conn.ping(reconnect=True)
    cursor = conn.cursor(prepared=True)

    # Insert data into the tables with progress printing
    total_items = len(cves) + len(containers) + len(cna_table) + len(adp_table) + len(provider_metadata) + len(timelines) + len(descriptions) + len(references) + len(problem_types) + len(problem_types_descriptions) + len(credits_cve) + len(affected_products) + len(affected_products_cpe) + len(affected_products_platforms) + len(affected_products_modules) + len(affected_products_program_files) + len(affected_products_versions) + len(affected_products_program_routines) + len(problem_types_descriptions_refs) + len(configurations) + len(workarounds) + len(solutions) + len(exploits) + len(impacts) + len(impact_descriptions) + len(taxonomy_mappings) + len(taxonomy_relations) + len(tags) + len(cpe_applicability) + len(cpe_nodes) + len(cpe_match) + len(metrics) + len(metrics_scenarios) + len(metrics_cvssv4) + len(metrics_cvssv3_1) + len(metrics_cvssv3) + len(metrics_cvssv2)
    
    processed_items = 0

    print(f'📊 Total de items cve: {len(cves)}')
    print(f'📊 Total de items containers: {len(containers)}')
    print(f'📊 Total de items CNA: {len(cna_table)}')
    print(f'📊 Total de items ADP: {len(adp_table)}')
    print(f'📊 Total de items provider_metadata: {len(provider_metadata)}')
    print(f'📊 Total de items timelines: {len(timelines)}')
    print(f'📊 Total de items descriptions: {len(descriptions)}')
    print(f'📊 Total de items descriptions_supporting_media: {len(descriptions_supporting_media)}')
    print(f'📊 Total de items references: {len(references)}')
    print(f'📊 Total de items problem_types: {len(problem_types)}')
    print(f'📊 Total de items problem_types_descriptions: {len(problem_types_descriptions)}')
    print(f'📊 Total de items problem_types_descriptions_refs: {len(problem_types_descriptions_refs)}')
    print(f'📊 Total de items credits_cve: {len(credits_cve)}')
    print(f'📊 Total de items affected_products: {len(affected_products)}')
    print(f'📊 Total de items affected_products_cpe: {len(affected_products_cpe)}')
    print(f'📊 Total de items affected_products_platforms: {len(affected_products_platforms)}')
    print(f'📊 Total de items affected_products_modules: {len(affected_products_modules)}')
    print(f'📊 Total de items affected_products_program_files: {len(affected_products_program_files)}')
    print(f'📊 Total de items affected_products_versions: {len(affected_products_versions)}')
    print(f'📊 Total de items affected_products_program_routines: {len(affected_products_program_routines)}')
    print(f'📊 Total de items configurations: {len(configurations)}')
    print(f'📊 Total de items workarounds: {len(workarounds)}')
    print(f'📊 Total de items solutions: {len(solutions)}')
    print(f'📊 Total de items exploits: {len(exploits)}')
    print(f'📊 Total de items impacts: {len(impacts)}')
    print(f'📊 Total de items impact_descriptions: {len(impact_descriptions)}')
    print(f'📊 Total de items taxonomy_mappings: {len(taxonomy_mappings)}')
    print(f'📊 Total de items taxonomy_relations: {len(taxonomy_relations)}')
    print(f'📊 Total de items tags: {len(tags)}')
    print(f'📊 Total de items cpe_applicability: {len(cpe_applicability)}')
    print(f'📊 Total de items cpe_nodes: {len(cpe_nodes)}')
    print(f'📊 Total de items cpe_match: {len(cpe_match)}')
    print(f'📊 Total de items metrics: {len(metrics)}')
    print(f'📊 Total de items metrics_scenarios: {len(metrics_scenarios)}')
    print(f'📊 Total de items metrics_cvssv4: {len(metrics_cvssv4)}')
    print(f'📊 Total de items metrics_cvssv3_1: {len(metrics_cvssv3_1)}')
    print(f'📊 Total de items metrics_cvssv3: {len(metrics_cvssv3)}')
    print(f'📊 Total de items metrics_cvssv2: {len(metrics_cvssv2)}')

    print(f"🔄 Cargando {total_items} CVEs en la base de datos...")
    # Insert CVEs data
    for i in range(0, len(cves), batch_size):
        batch = cves[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO CVE (cve_id, data_type, data_version, state, assigner_org_id, assigner_short_name, requester_user_id, date_updated, number_serial, date_reserved, date_published)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                data_type = VALUES(data_type),
                data_version = VALUES(data_version),
                state = VALUES(state),
                assigner_org_id = VALUES(assigner_org_id),
                assigner_short_name = VALUES(assigner_short_name),
                requester_user_id = VALUES(requester_user_id),
                date_updated = VALUES(date_updated),
                number_serial = VALUES(number_serial),
                date_reserved = VALUES(date_reserved),
                date_published = VALUES(date_published)
        ''', batch)
        processed_items += len(batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (cve_items).")

    # Insert Containers data
    for i in range(0, len(containers), batch_size):
        batch = containers[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Container (container_id, cve_id, container_type, content_hash)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE content_hash = VALUES(content_hash)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (containers).")

    # Insert CNA Table data
    for i in range(0, len(cna_table), batch_size):
        batch = cna_table[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO CNA (cna_id, date_assigned, date_public, title, source)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                date_assigned = VALUES(date_assigned),
                date_public = VALUES(date_public),
                title = VALUES(title),
                source = VALUES(source)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (cna_table).")
    
    # Insert ADP Table data
    for i in range(0, len(adp_table), batch_size):
        batch = adp_table[i:i + batch_size]
        
        cursor.executemany('''
        INSERT INTO ADP (adp_id, date_public, title, source)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
        date_public = VALUES(date_public),
        title = VALUES(title),
        source = VALUES(source)
        ''', batch)
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (adp_table).")
        
    # Insert Provider Metadata data
    for i in range(0, len(provider_metadata), batch_size):
        batch = provider_metadata[i:i + batch_size]
        
        cursor.executemany('''
            INSERT INTO Provider_Metadata (container_id, provider_org_id, short_name, date_updated)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                provider_org_id = VALUES(provider_org_id),
                short_name = VALUES(short_name),
                date_updated = VALUES(date_updated)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (provider_metadata).")

    # Insert Timelines data
    for i in range(0, len(timelines), batch_size):
        batch = timelines[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Timeline (timeline_id, container_id, event_time, lang, value)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                event_time = VALUES(event_time),
                lang = VALUES(lang),
                value = VALUES(value)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (timelines).")

    # Insert Descriptions data
    for i in range(0, len(descriptions), batch_size // 2):
        batch = descriptions[i:i + batch_size // 2]
        
        cursor.executemany('''
            INSERT IGNORE INTO Descriptions (id, container_id, lang, value)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                lang = VALUES(lang),
                value = VALUES(value)
        ''', batch)
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados  (descriptions).")

    # Insert Descriptions Supporting Media data
    for i in range(0, len(descriptions_supporting_media), batch_size):
        batch = descriptions_supporting_media[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Descriptions_Supporting_Media (id, description_id, media_type, base_64, value)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
            media_type = VALUES(media_type),
            base_64 = VALUES(base_64),
            value = VALUES(value)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (descriptions_supporting_media).")

    # Insert References data
    for i in range(0, len(references), batch_size):
        batch = references[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO CVE_References (id, container_id, url, name, tags)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                url = VALUES(url),
                name = VALUES(name),
                tags = VALUES(tags)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (CVE_References).")

    # Insert Problem Types data
    for i in range(0, len(problem_types), batch_size):
        batch = problem_types[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Problem_Types (problem_type_id, container_id)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE container_id = VALUES(container_id)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (problem_types).")
    
    # Insert Problem Types Descriptions data
    for i in range(0, len(problem_types_descriptions), batch_size):
        batch = problem_types_descriptions[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Problem_Type_Description (description_id, problem_type_id, lang, description, cwe_id, type)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                lang = VALUES(lang),
                description = VALUES(description),
                cwe_id = VALUES(cwe_id),
                type = VALUES(type)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (problem_types_descriptions).")

    # Insert Problem Types Descriptions References data
    for i in range(0, len(problem_types_descriptions_refs), batch_size):
        batch = problem_types_descriptions_refs[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Problem_Type_Description_References (reference_id, problem_type_id, url, name, tags)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                url = VALUES(url),
                name = VALUES(name),
                tags = VALUES(tags)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (problem_types_descriptions_refs).")

    # Insert Credits data
    for i in range(0, len(credits_cve), batch_size):
        batch = credits_cve[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Credit (credit_id, container_id, lang, value, user_id, type)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                lang = VALUES(lang),
                value = VALUES(value),
                user_id = VALUES(user_id),
                type = VALUES(type)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (credits_cve).")

    # Insert Affected Products data
    for i in range(0, len(affected_products), batch_size):
        batch = affected_products[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Affected_Product (product_id, container_id, vendor, product_name, collection_url, package_name, default_status, repo)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                vendor = VALUES(vendor),
                product_name = VALUES(product_name),
                collection_url = VALUES(collection_url),
                package_name = VALUES(package_name),
                default_status = VALUES(default_status),
                repo = VALUES(repo)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (affected_products).")
    
    # Insert Affected Products CPE data
    for i in range(0, len(affected_products_cpe), batch_size):
        batch = affected_products_cpe[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Affected_Product_cpe (cpe_id, product_id, cpe23_item)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
                cpe23_item = VALUES(cpe23_item)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (affected_products_cpe).")

    # Insert Affected Products Platforms data
    for i in range(0, len(affected_products_platforms), batch_size):
        batch = affected_products_platforms[i:i + batch_size]
        try:
            cursor.executemany('''
            INSERT INTO Platforms (platform_id, product_id, platform)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), platform = VALUES(platform)
        ''', batch)
            processed_items += len(batch)

            conn.commit()
            print(f"Progreso: {processed_items}/{total_items} items procesados (affected_products_platforms).")
        except Exception as e:
            print(f"❌ Error al insertar datos en Platforms: {e}")
            print(f"Batch problemático: {batch[:5]}")  # Muestra las primeras 5 filas del batch
            conn.rollback()

    # Insert Affected Products Modules data
    for i in range(0, len(affected_products_modules), batch_size):
        batch = affected_products_modules[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Modules (module_id, product_id, module)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), module = VALUES(module)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (affected_products_modules).")

    # Insert Affected Products Program Files data
    for i in range(0, len(affected_products_program_files), batch_size):
        batch = affected_products_program_files[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Program_Files (file_id, product_id, file_path)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), file_path = VALUES(file_path)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (affected_products_program_files).")

    # Insert Affected Products Versions data
    for i in range(0, len(affected_products_versions), batch_size):
        batch = affected_products_versions[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Affected_Version (affected_version_id, product_id, affected_version, affected_status, version_type, less_than, less_than_or_equal, affected_changes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), affected_version = VALUES(affected_version), affected_status = VALUES(affected_status), version_type = VALUES(version_type), less_than = VALUES(less_than), less_than_or_equal = VALUES(less_than_or_equal), affected_changes = VALUES(affected_changes)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (affected_products_versions).")

    # Insert Affected Products Program Routines data
    for i in range(0, len(affected_products_program_routines), batch_size):
        batch = affected_products_program_routines[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Program_Routines (routine_id, product_id, routine)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), routine = VALUES(routine)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (affected_products_program_routines).")    

    # Insert Configurations data
    for i in range(0, len(configurations), batch_size):
        batch = configurations[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Configurations (configuration_id, container_id, lang, value, supporting_media)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE lang = VALUES(lang), value = VALUES(value), supporting_media = VALUES(supporting_media)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (configurations).")
    
    # Insert Workarounds data
    for i in range(0, len(workarounds), batch_size):
        batch = workarounds[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Workarounds (workaround_id, container_id, lang, value, supporting_media)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE lang = VALUES(lang), value = VALUES(value), supporting_media = VALUES(supporting_media)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (workarounds).")
    
    # Insert Solutions data
    for i in range(0, len(solutions), batch_size):
        batch = solutions[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Solutions (solution_id, container_id, lang, value, supporting_media)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE lang = VALUES(lang), value = VALUES(value), supporting_media = VALUES(supporting_media)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (solutions).")
    
    # Insert Exploits data
    for i in range(0, len(exploits), batch_size):
        batch = exploits[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Exploits (exploit_id, container_id, lang, value, supporting_media)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE lang = VALUES(lang), value = VALUES(value), supporting_media = VALUES(supporting_media)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (exploits).")
    
    # Insert Impacts data
    for i in range(0, len(impacts), batch_size):
        batch = impacts[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Impact (impact_id, container_id, capec_id)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE capec_id = VALUES(capec_id)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (impacts).")

    # Insert Impact Descriptions data
    for i in range(0, len(impact_descriptions), batch_size):
        batch = impact_descriptions[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Impact_Description (description_id, impact_id, lang, value, supporting_media)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE lang = VALUES(lang), value = VALUES(value), supporting_media = VALUES(supporting_media)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (impact_descriptions).")

    # Insert Taxonomy Mappings data
    for i in range(0, len(taxonomy_mappings), batch_size):
        batch = taxonomy_mappings[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Taxonomy_Mappings (taxonomy_id_hash, container_id, taxonomy_name, taxonomy_version)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE taxonomy_name = VALUES(taxonomy_name), taxonomy_version = VALUES(taxonomy_version)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (taxonomy_mappings).")

    # Insert Taxonomy Relations data
    for i in range(0, len(taxonomy_relations), batch_size):
        batch = taxonomy_relations[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Taxonomy_Relations (relation_id, taxonomy_id_hash, taxonomy_id, relationship_name, relationship_value)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE taxonomy_id = VALUES(taxonomy_id), relationship_name = VALUES(relationship_name), relationship_value = VALUES(relationship_value)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (taxonomy_relations).")
    
    # Insert Tags data
    for i in range(0, len(tags), batch_size):
        batch = tags[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Tags (container_id, tag_extension)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE tag_extension = VALUES(tag_extension)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (tags).")

    # Insert CPE Applicability data
    for i in range(0, len(cpe_applicability), batch_size):
        batch = cpe_applicability[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO CPE_Applicability (applicability_id, container_id, operator, negate)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE operator = VALUES(operator), negate = VALUES(negate)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (cpe_applicability).")
    
    # Insert CPE Nodes data
    for i in range(0, len(cpe_nodes), batch_size):
        batch = cpe_nodes[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO CPE_Node (node_id, applicability_id, operator, negate)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE operator = VALUES(operator), negate = VALUES(negate)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (cpe_nodes).")
    
    # Insert CPE Match data
    for i in range(0, len(cpe_match), batch_size):
        batch = cpe_match[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO CPE_Match (match_id, node_id, vulnerable, criteria_cpe23, match_criteria_id, version_start_excluding, version_start_including, version_end_excluding, version_end_including)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE vulnerable = VALUES(vulnerable), criteria_cpe23 = VALUES(criteria_cpe23), match_criteria_id = VALUES(match_criteria_id), version_start_excluding = VALUES(version_start_excluding), version_start_including = VALUES(version_start_including), version_end_excluding = VALUES(version_end_excluding), version_end_including = VALUES(version_end_including)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (cpe_match).")

    # Insert Metrics data
    for i in range(0, len(metrics), batch_size):
        batch = metrics[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Metrics (metric_id, container_id, format, other_type, other_content)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE other_type = VALUES(other_type), other_content = VALUES(other_content)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (metrics).")
    
    # Insert Metrics Scenarios data
    for i in range(0, len(metrics_scenarios), batch_size):
        batch = metrics_scenarios[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO Metrics_Scenarios (scenario_id, metric_id, lang, value)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE lang = VALUES(lang), value = VALUES(value)
        ''', batch)
        processed_items += len(batch)

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (metrics_scenarios).")
    
    # # Insert Metrics CVSSv4 data
    for i in range(0, len(metrics_cvssv4), batch_size):
        batch = metrics_cvssv4[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO CVSSV4 (
            cvssv4_id, metric_id, vector_string, version, base_score, base_severity, attack_vector, attack_complexity, 
            attack_requirements, privileges_required, user_interaction, vuln_confidentiality_impact, vuln_integrity_impact, 
            vuln_availability_impact, sub_confidentiality_impact, sub_integrity_impact, sub_availability_impact, 
            exploit_maturity, confidentiality_requirement, integrity_requirement, availability_requirement, 
            modified_attack_vector, modified_attack_complexity, modified_attack_requirements, modified_privileges_required, 
            modified_user_interaction, modified_vuln_confidentiality_impact, modified_vuln_integrity_impact, 
            modified_vuln_availability_impact, modified_sub_confidentiality_impact, modified_sub_integrity_impact, 
            modified_sub_availability_impact, safety, automatable, recovery, value_density, 
            vulnerability_response_effort, provider_urgency
            )
            VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            ON DUPLICATE KEY UPDATE 
            vector_string = VALUES(vector_string),
            version = VALUES(version),
            base_score = VALUES(base_score),
            base_severity = VALUES(base_severity),
            attack_vector = VALUES(attack_vector),
            attack_complexity = VALUES(attack_complexity),
            attack_requirements = VALUES(attack_requirements),
            privileges_required = VALUES(privileges_required),
            user_interaction = VALUES(user_interaction),
            vuln_confidentiality_impact = VALUES(vuln_confidentiality_impact),
            vuln_integrity_impact = VALUES(vuln_integrity_impact),
            vuln_availability_impact = VALUES(vuln_availability_impact),
            sub_confidentiality_impact = VALUES(sub_confidentiality_impact),
            sub_integrity_impact = VALUES(sub_integrity_impact),
            sub_availability_impact = VALUES(sub_availability_impact),
            exploit_maturity = VALUES(exploit_maturity),
            confidentiality_requirement = VALUES(confidentiality_requirement),
            integrity_requirement = VALUES(integrity_requirement),
            availability_requirement = VALUES(availability_requirement),
            modified_attack_vector = VALUES(modified_attack_vector),
            modified_attack_complexity = VALUES(modified_attack_complexity),
            modified_attack_requirements = VALUES(modified_attack_requirements),
            modified_privileges_required = VALUES(modified_privileges_required),
            modified_user_interaction = VALUES(modified_user_interaction),
            modified_vuln_confidentiality_impact = VALUES(modified_vuln_confidentiality_impact),
            modified_vuln_integrity_impact = VALUES(modified_vuln_integrity_impact),
            modified_vuln_availability_impact = VALUES(modified_vuln_availability_impact),
            modified_sub_confidentiality_impact = VALUES(modified_sub_confidentiality_impact),
            modified_sub_integrity_impact = VALUES(modified_sub_integrity_impact),
            modified_sub_availability_impact = VALUES(modified_sub_availability_impact),
            safety = VALUES(safety),
            automatable = VALUES(automatable),
            recovery = VALUES(recovery),
            value_density = VALUES(value_density),
            vulnerability_response_effort = VALUES(vulnerability_response_effort),
            provider_urgency = VALUES(provider_urgency)
        ''', batch)
        processed_items += len(batch)
        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (metrics_cvssv4).")    

    # Insert Metrics CVSSv3.1 data
    for i in range(0, len(metrics_cvssv3_1), batch_size // 2):  # Reduce aún más el tamaño del lote
        batch = metrics_cvssv3_1[i:i + batch_size // 2]
        try:
            cursor.executemany('''
            INSERT INTO CVSSV3_1 (
            cvssv3_1_id, metric_id, version, vector_string, base_score, base_severity, attack_vector, 
            attack_complexity, privileges_required, user_interaction, scope, confidentiality_impact, 
            integrity_impact, availability_impact, exploit_code_maturity, remediation_level, 
            report_confidence, temporal_score, temporal_severity, confidentiality_requirement, 
            integrity_requirement, availability_requirement, modified_attack_vector, 
            modified_attack_complexity, modified_privileges_required, modified_user_interaction, 
            modified_scope, modified_confidentiality_impact, modified_integrity_impact, 
            modified_availability_impact, environmental_score, environmental_severity
            )
            VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            ON DUPLICATE KEY UPDATE 
            version = VALUES(version),
            vector_string = VALUES(vector_string),
            base_score = VALUES(base_score),
            base_severity = VALUES(base_severity),
            attack_vector = VALUES(attack_vector),
            attack_complexity = VALUES(attack_complexity),
            privileges_required = VALUES(privileges_required),
            user_interaction = VALUES(user_interaction),
            scope = VALUES(scope),
            confidentiality_impact = VALUES(confidentiality_impact),
            integrity_impact = VALUES(integrity_impact),
            availability_impact = VALUES(availability_impact),
            exploit_code_maturity = VALUES(exploit_code_maturity),
            remediation_level = VALUES(remediation_level),
            report_confidence = VALUES(report_confidence),
            temporal_score = VALUES(temporal_score),
            temporal_severity = VALUES(temporal_severity),
            confidentiality_requirement = VALUES(confidentiality_requirement),
            integrity_requirement = VALUES(integrity_requirement),
            availability_requirement = VALUES(availability_requirement),
            modified_attack_vector = VALUES(modified_attack_vector),
            modified_attack_complexity = VALUES(modified_attack_complexity),
            modified_privileges_required = VALUES(modified_privileges_required),
            modified_user_interaction = VALUES(modified_user_interaction),
            modified_scope = VALUES(modified_scope),
            modified_confidentiality_impact = VALUES(modified_confidentiality_impact),
            modified_integrity_impact = VALUES(modified_integrity_impact),
            modified_availability_impact = VALUES(modified_availability_impact),
            environmental_score = VALUES(environmental_score),
            environmental_severity = VALUES(environmental_severity)
        ''', batch)
            
            processed_items += len(batch)
            conn.commit()
            print(f"Progreso: {processed_items}/{total_items} items procesados (metrics_cvssv2).")
        except Exception as e:
            print(f"❌ Error al procesar el lote: {e}")
            conn.rollback()

    # Insert Metrics CVSSv3 data
    for i in range(0, len(metrics_cvssv3), batch_size // 2):  # Reduce aún más el tamaño del lote
        batch = metrics_cvssv3[i:i + batch_size // 2]

        try:
            cursor.executemany('''
            INSERT INTO CVSSV3 (
            cvssv3_id, metric_id, version, vector_string, base_score, base_severity, attack_vector, 
            attack_complexity, privileges_required, user_interaction, scope, confidentiality_impact, 
            integrity_impact, availability_impact, exploit_code_maturity, remediation_level, 
            report_confidence, temporal_score, temporal_severity, confidentiality_requirement, 
            integrity_requirement, availability_requirement, modified_attack_vector, 
            modified_attack_complexity, modified_privileges_required, modified_user_interaction, 
            modified_scope, modified_confidentiality_impact, modified_integrity_impact, 
            modified_availability_impact, environmental_score, environmental_severity
            )
            VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            ON DUPLICATE KEY UPDATE 
            version = VALUES(version),
            vector_string = VALUES(vector_string),
            base_score = VALUES(base_score),
            base_severity = VALUES(base_severity),
            attack_vector = VALUES(attack_vector),
            attack_complexity = VALUES(attack_complexity),
            privileges_required = VALUES(privileges_required),
            user_interaction = VALUES(user_interaction),
            scope = VALUES(scope),
            confidentiality_impact = VALUES(confidentiality_impact),
            integrity_impact = VALUES(integrity_impact),
            availability_impact = VALUES(availability_impact),
            exploit_code_maturity = VALUES(exploit_code_maturity),
            remediation_level = VALUES(remediation_level),
            report_confidence = VALUES(report_confidence),
            temporal_score = VALUES(temporal_score),
            temporal_severity = VALUES(temporal_severity),
            confidentiality_requirement = VALUES(confidentiality_requirement),
            integrity_requirement = VALUES(integrity_requirement),
            availability_requirement = VALUES(availability_requirement),
            modified_attack_vector = VALUES(modified_attack_vector),
            modified_attack_complexity = VALUES(modified_attack_complexity),
            modified_privileges_required = VALUES(modified_privileges_required),
            modified_user_interaction = VALUES(modified_user_interaction),
            modified_scope = VALUES(modified_scope),
            modified_confidentiality_impact = VALUES(modified_confidentiality_impact),
            modified_integrity_impact = VALUES(modified_integrity_impact),
            modified_availability_impact = VALUES(modified_availability_impact),
            environmental_score = VALUES(environmental_score),
            environmental_severity = VALUES(environmental_severity)
        ''', batch)
        
            processed_items += len(batch)
            conn.commit()
            print(f"Progreso: {processed_items}/{total_items} items procesados (metrics_cvssv2).")
        except Exception as e:
            print(f"❌ Error al procesar el lote: {e}")
            conn.rollback()
    
    # Insert Metrics CVSSv2 data
    for i in range(0, len(metrics_cvssv2), batch_size):
        batch = metrics_cvssv2[i:i + batch_size]
        cursor.executemany('''
            INSERT INTO CVSSV2 (
            cvssv2_id, metric_id, version, vector_string, base_score, access_vector, 
            access_complexity, authentication, confidentiality_impact, integrity_impact, 
            availability_impact, exploitability, remediation_level, report_confidence, 
            temporal_score, collateral_damage_potential, target_distribution, 
            confidentiality_requirement, integrity_requirement, availability_requirement, 
            environmental_score
            )
            VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            ON DUPLICATE KEY UPDATE 
            metric_id = VALUES(metric_id),
            version = VALUES(version),
            vector_string = VALUES(vector_string),
            base_score = VALUES(base_score),
            access_vector = VALUES(access_vector),
            access_complexity = VALUES(access_complexity),
            authentication = VALUES(authentication),
            confidentiality_impact = VALUES(confidentiality_impact),
            integrity_impact = VALUES(integrity_impact),
            availability_impact = VALUES(availability_impact),
            exploitability = VALUES(exploitability),
            remediation_level = VALUES(remediation_level),
            report_confidence = VALUES(report_confidence),
            temporal_score = VALUES(temporal_score),
            collateral_damage_potential = VALUES(collateral_damage_potential),
            target_distribution = VALUES(target_distribution),
            confidentiality_requirement = VALUES(confidentiality_requirement),
            integrity_requirement = VALUES(integrity_requirement),
            availability_requirement = VALUES(availability_requirement),
            environmental_score = VALUES(environmental_score)
        ''', batch)
        processed_items += len(batch)
        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (metrics_cvssv2).")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Datos insertados en la base de datos correctamente.")

def process_files_in_parallel(cve_files):
    # Usa todos los núcleos disponibles
    num_workers = cpu_count()
    print(f"🔄 Procesando archivos en paralelo con {num_workers} núcleos...")

    with Pool(num_workers) as pool:
        results = pool.map(transform_cve_data, cve_files)

    # Combinar los resultados
    all_cves, all_containers, all_cna_table, all_adp_table, all_provider_metadata, all_timelines, all_descriptions, all_descriptions_supporting_media, all_references, all_problem_types, all_problem_types_descriptions, all_problem_types_descriptions_refs, all_credits_cve, all_affected_products, all_affected_products_cpe, all_affected_products_platforms, all_affected_products_modules, all_affected_products_program_files, all_affected_products_versions, all_affected_products_program_routines, all_configurations, all_workarounds, all_solutions, all_exploits, all_impacts, all_impact_descriptions, all_taxonomy_mappings, all_taxonomy_relations, all_tags, all_cpe_applicability, all_cpe_nodes, all_cpe_match, all_metrics, all_metrics_scenarios, all_metrics_cvssv4, all_metrics_cvssv3_1, all_metrics_cvssv3, all_metrics_cvssv2  = ([] for _ in range(38))


    for parsed in results:
        if parsed:
            cves, containers, cna_table, adp_table, provider_metadata, timelines, descriptions, descriptions_supporting_media, references, problem_types, problem_types_descriptions, problem_types_descriptions_refs, credits_cve, affected_products, affected_products_cpe, affected_products_platforms, affected_products_modules, affected_products_program_files, affected_products_versions, affected_products_program_routines, configurations, workarounds, solutions, exploits, impacts, impact_descriptions, taxonomy_mappings, taxonomy_relations, tags, cpe_applicability, cpe_nodes, cpe_match, metrics, metrics_scenarios, metrics_cvssv4, metrics_cvssv3_1, metrics_cvssv3, metrics_cvssv2 = parsed
            all_cves.extend(cves)
            all_containers.extend(containers)
            all_cna_table.extend(cna_table)
            all_adp_table.extend(adp_table)
            all_provider_metadata.extend(provider_metadata)
            all_timelines.extend(timelines)
            all_descriptions.extend(descriptions)
            all_descriptions_supporting_media.extend(descriptions_supporting_media)
            all_references.extend(references)
            all_problem_types.extend(problem_types)
            all_problem_types_descriptions.extend(problem_types_descriptions)
            all_problem_types_descriptions_refs.extend(problem_types_descriptions_refs)
            all_credits_cve.extend(credits_cve)
            all_affected_products.extend(affected_products)
            all_affected_products_cpe.extend(affected_products_cpe)
            all_affected_products_platforms.extend(affected_products_platforms)
            all_affected_products_modules.extend(affected_products_modules)
            all_affected_products_program_files.extend(affected_products_program_files)
            all_affected_products_versions.extend(affected_products_versions)
            all_affected_products_program_routines.extend(affected_products_program_routines)
            all_configurations.extend(configurations)
            all_workarounds.extend(workarounds)
            all_solutions.extend(solutions)
            all_exploits.extend(exploits)
            all_impacts.extend(impacts)
            all_impact_descriptions.extend(impact_descriptions)
            all_taxonomy_mappings.extend(taxonomy_mappings)
            all_taxonomy_relations.extend(taxonomy_relations)
            all_tags.extend(tags)
            all_cpe_applicability.extend(cpe_applicability)
            all_cpe_nodes.extend(cpe_nodes)
            all_cpe_match.extend(cpe_match)
            all_metrics.extend(metrics)
            all_metrics_scenarios.extend(metrics_scenarios)
            all_metrics_cvssv4.extend(metrics_cvssv4)
            all_metrics_cvssv3_1.extend(metrics_cvssv3_1)
            all_metrics_cvssv3.extend(metrics_cvssv3)
            all_metrics_cvssv2.extend(metrics_cvssv2)


    return all_cves, all_containers, all_cna_table, all_adp_table, all_provider_metadata, all_timelines, all_descriptions, all_descriptions_supporting_media, all_references, all_problem_types, all_problem_types_descriptions, all_problem_types_descriptions_refs, all_credits_cve, all_affected_products, all_affected_products_cpe, all_affected_products_platforms, all_affected_products_modules, all_affected_products_program_files, all_affected_products_versions, all_affected_products_program_routines, all_configurations, all_workarounds, all_solutions, all_exploits, all_impacts, all_impact_descriptions, all_taxonomy_mappings, all_taxonomy_relations, all_tags, all_cpe_applicability, all_cpe_nodes, all_cpe_match, all_metrics, all_metrics_scenarios, all_metrics_cvssv4, all_metrics_cvssv3_1, all_metrics_cvssv3, all_metrics_cvssv2

def main():
    # Initialize variables to avoid UnboundLocalError in case of an exception
    cves, containers, cna_table, adp_table, provider_metadata, timelines, descriptions, descriptions_supporting_media, references, problem_types, problem_types_descriptions, problem_types_descriptions_refs, credits_cve, affected_products, affected_products_cpe, affected_products_platforms, affected_products_modules, affected_products_program_files, affected_products_versions, affected_products_program_routines, configurations, workarounds, solutions, exploits, impacts, impact_descriptions, taxonomy_mappings, taxonomy_relations, tags, cpe_applicability, cpe_nodes, cpe_match, metrics, metrics_scenarios, metrics_cvssv4, metrics_cvssv3_1, metrics_cvssv3, metrics_cvssv2 = ([] for _ in range(38))

    try:
        check_or_create_cve_db()

        # Verificar si hay datos procesados guardados
        if os.path.exists(TEMP_FILE):
            print(f"♻️ Archivo temporal encontrado: {TEMP_FILE}. Cargando datos procesados...")
            cves, containers, cna_table, adp_table, provider_metadata, timelines, descriptions, descriptions_supporting_media, references, problem_types, problem_types_descriptions, problem_types_descriptions_refs, credits_cve, affected_products, affected_products_cpe, affected_products_platforms, affected_products_modules, affected_products_program_files, affected_products_versions, affected_products_program_routines, configurations, workarounds, solutions, exploits, impacts, impact_descriptions, taxonomy_mappings, taxonomy_relations, tags, cpe_applicability, cpe_nodes, cpe_match, metrics, metrics_scenarios, metrics_cvssv4, metrics_cvssv3_1, metrics_cvssv3, metrics_cvssv2 = load_processed_data(TEMP_FILE)
            print("✅ Datos procesados cargados correctamente.")
        else:
            zip_path = download_extract_cve_data(URL, EXTRACT_DIR)
            print("🔄 Descomprimiendo datos...")
            cve_files = process_zip_and_find_json(zip_path, EXTRACT_DIR)
            print(f"✅ {len(cve_files)} archivos encontrados.")

            # Procesar archivos en paralelo
            cves, containers, cna_table, adp_table, provider_metadata, timelines, descriptions, descriptions_supporting_media, references, problem_types, problem_types_descriptions, problem_types_descriptions_refs, credits_cve, affected_products, affected_products_cpe, affected_products_platforms, affected_products_modules, affected_products_program_files, affected_products_versions, affected_products_program_routines, configurations, workarounds, solutions, exploits, impacts, impact_descriptions, taxonomy_mappings, taxonomy_relations, tags, cpe_applicability, cpe_nodes, cpe_match, metrics, metrics_scenarios, metrics_cvssv4, metrics_cvssv3_1, metrics_cvssv3, metrics_cvssv2 = process_files_in_parallel(cve_files)

        print("🚀 Cargando datos a la base de datos...")
        load_cve_data(cves, containers, cna_table, adp_table, provider_metadata, timelines, descriptions, descriptions_supporting_media, references, problem_types, problem_types_descriptions, problem_types_descriptions_refs, credits_cve, affected_products, affected_products_cpe, affected_products_platforms, affected_products_modules, affected_products_program_files, affected_products_versions, affected_products_program_routines, configurations, workarounds, solutions, exploits, impacts, impact_descriptions, taxonomy_mappings, taxonomy_relations, tags, cpe_applicability, cpe_nodes, cpe_match, metrics, metrics_scenarios, metrics_cvssv4, metrics_cvssv3_1, metrics_cvssv3, metrics_cvssv2)

        # Eliminar el archivo temporal después de una carga exitosa
        if os.path.exists(TEMP_FILE):
            #os.remove(temp_file)
            print(f"🗑️ Archivo temporal {TEMP_FILE} eliminado.")

    except Exception as e:
        print("❌ Error en la carga de datos:", e)
        # Guardar los datos procesados en un archivo temporal
        save_processed_data(TEMP_FILE, (cves, containers, cna_table, adp_table, provider_metadata, timelines, descriptions, descriptions_supporting_media, references, problem_types, problem_types_descriptions, problem_types_descriptions_refs, credits_cve, affected_products, affected_products_cpe, affected_products_platforms, affected_products_modules, affected_products_program_files, affected_products_versions, affected_products_program_routines, configurations, workarounds, solutions, exploits, impacts, impact_descriptions, taxonomy_mappings, taxonomy_relations, tags, cpe_applicability, cpe_nodes, cpe_match, metrics, metrics_scenarios, metrics_cvssv4, metrics_cvssv3_1, metrics_cvssv3, metrics_cvssv2))
        print(f"♻️ Datos procesados guardados en {TEMP_FILE}. Puedes recuperarlos más tarde.")

    finally:
        print("📄 ETL de CVEs finalizado.")
        clean_files(ZIP_PATH, EXTRACT_DIR)

if __name__ == "__main__":
    main()
