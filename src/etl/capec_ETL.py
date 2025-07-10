import os
import xml.etree.ElementTree as ET
import requests
from src.config.db_config import connect_db_capec, create_db, DB_CAPEC
import hashlib
from multiprocessing import Pool, cpu_count

URL = 'https://capec.mitre.org/data/xml/capec_latest.xml'

ns = {
    'capec': "http://capec.mitre.org/capec-3",
    'xsi': "http://www.w3.org/2001/XMLSchema-instance",
    'xhtml': "http://www.w3.org/1999/xhtml"
}

def download_extract_capec_data(url, extract_to='.'):
    # Descargar el archivo XML directamente
    response = requests.get(url)
    xml_path = os.path.join(extract_to, 'capec_latest.xml')
    with open(xml_path, 'wb') as file:
        file.write(response.content)

    # Retornar la ruta al archivo XML descargado
    return xml_path

def check_or_create_capec_db():
    conn = create_db()
    cursor = conn.cursor()

    cursor.execute("SHOW DATABASES")
    databases = [db[0] for db in cursor.fetchall()]

    if DB_CAPEC not in databases:
        print("La base de datos {DB_CAPEC} no existe. Creándola ahora...")
        cursor.execute("CREATE DATABASE {DB_CAPEC}")
        conn.database = DB_CAPEC

        with open('BBDD/BBDD_CAPEC.sql', 'r') as sql_file:
            sql_script = sql_file.read()

        sql_statements = sql_script.split(';')
        for statement in sql_statements:
            if statement.strip():
                cursor.execute(statement)

        print("✅ Base de datos {DB_CAPEC} creada con éxito.")
        conn.commit()

        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print("📋 Tablas en la base de datos:")
        for table in tables:
            print(table[0])

        print("✅ Tablas creadas con éxito en {DB_CAPEC}.")
        conn.commit()
    else:
        print("✅ La base de datos {DB_CAPEC} ya existe. Verificando tablas...")
        conn.database = DB_CAPEC
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        if not tables:
            print("⚠️ La base de datos existe pero no contiene tablas. Creando tablas ahora...")
            with open('BBDD/BBDD_CAPEC.sql', 'r') as sql_file:
                sql_script = sql_file.read()
            sql_statements = sql_script.split(';')
            for statement in sql_statements:
                if statement.strip():
                    cursor.execute(statement)
            conn.commit()
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print("📋 Tablas en la base de datos:")
            for table in tables:
                print(table[0])
            print("✅ Tablas creadas con éxito en {DB_CAPEC}.")
        else:
            print("✅ Todas las tablas existen en la base de datos {DB_CAPEC}. Continuando con el proceso de ETL...")

def extract_all_text_from_element(elem):
    if elem is not None:
        if isinstance(elem, list):
            text = ';'.join(e.text for e in elem if e.text is not None)
        elif hasattr(elem, 'itertext'):
            text = ';'.join(elem.itertext())
        else:
            text = elem
    else:
        text = ""
    return text.strip()

def generate_hash(object):
    return hashlib.md5(object.encode()).hexdigest()

def transform_capec_data(root):
    # Namespace handling
    
    # Initialize lists to store data
    patterns = []
    descriptions = []
    extended_descriptions = []
    alternate_terms = []
    related_weaknesses = []
    related_patterns = []
    mitigations = []
    consequences = []
    flows = []
    techniques = []
    prerequisites = []
    skills = []
    resources = []
    indicators = []
    examples = []
    taxonomies = []
    external_refs = []
    capec_refs = []
    notes = []

    # Extract data from XML
    for ap in root.findall(".//capec:Attack_Pattern", ns):
        ap_id = int(ap.attrib.get("ID"))
        name = ap.attrib.get("Name")
        status = ap.attrib.get("Status")
        abstraction = ap.attrib.get("Abstraction")

        # Main
        lo_attack = ap.findtext("capec:Likelihood_Of_Attack", default=None, namespaces=ns)
        severity = ap.findtext("capec:Typical_Severity", default=None, namespaces=ns)
        patterns.append((ap_id, name, status, abstraction, lo_attack, severity))

        # Descriptions (Only One)
        desc = ap.find("capec:Description", ns)
        if desc is not None:
            desc_text = extract_all_text_from_element(desc)
            desc_id = generate_hash(f"{ap_id}_description")
            descriptions.append((desc_id, ap_id, desc_text))

        # Extended Descriptions (Only One)
        ext_desc = ap.find("capec:Extended_Description", ns)
        if ext_desc is not None:
            ext_desc_text = extract_all_text_from_element(ext_desc)
            ext_desc_id = generate_hash(f"{ap_id}_extended_description")
            extended_descriptions.append((ext_desc_id, ap_id, ext_desc_text))

        # Alternate Terms
        for idx, alt in enumerate(ap.findall(".//capec:Alternate_Term", ns)):
            alternate_term_id = generate_hash(f"{ap_id}_alternate_term_{idx}")
            term = alt.findtext("capec:Term", namespaces=ns)
            desc = alt.find("capec:Description", ns)
            alternate_terms.append((alternate_term_id, ap_id, term, extract_all_text_from_element(desc)))

        # Related Weaknesses
        for rw in ap.findall(".//capec:Related_Weakness", ns):
            cwe_id = int(rw.attrib.get("CWE_ID"))
            # Ensure no duplicate entries for ap_id and cwe_id
            if (ap_id, cwe_id) not in related_weaknesses:
                related_weaknesses.append((ap_id, cwe_id))

        # Related Attack Patterns
        for rp in ap.findall(".//capec:Related_Attack_Pattern", ns):
            capec_id = int(rp.attrib.get("CAPEC_ID")) 
            nature = rp.attrib.get("Nature")
            # Ensure no duplicate entries for ap_id and capec_id
            if (ap_id, capec_id) not in related_patterns:
                related_patterns.append((ap_id, capec_id, nature))

        # Mitigations
        for idx, mit in enumerate(ap.findall(".//capec:Mitigation", ns)):
            mitigation_id = generate_hash(f"{ap_id}_mitigation_{idx}")
            mitigations.append((mitigation_id, ap_id, extract_all_text_from_element(mit)))

        # Consequences
        for idx, cons in enumerate(ap.findall(".//capec:Consequence", ns)):
            consequence_id = generate_hash(f"{ap_id}_consequence_{idx}")
            scope = cons.findtext("capec:Scope", namespaces=ns)
            impact = cons.findtext("capec:Impact", default=None, namespaces=ns)
            lo_attack = cons.findtext("capec:Likelihood_Of_Attack", default=None, namespaces=ns)
            note = cons.findtext("capec:Note", default=None, namespaces=ns)
            consequences.append((consequence_id, ap_id, scope, impact, lo_attack, extract_all_text_from_element(note)))

        # Execution Flow & Techniques
        for flow in ap.findall(".//capec:Attack_Step", ns):
            step_number = int(flow.findtext("capec:Step", namespaces=ns))
            phase = flow.findtext("capec:Phase", namespaces=ns)
            desc = extract_all_text_from_element(flow.find("capec:Description", ns))
            flow_id = generate_hash(f"{ap_id}_flow_{step_number}_phase_{phase}_{desc}")
            flows.append((flow_id, ap_id, step_number, phase, desc))
            # Techniques
            for idx, tech in enumerate(flow.findall(".//capec:Technique", ns)):
                tech_text = extract_all_text_from_element(tech)
                capec_tech_id = int(tech.attrib.get("CAPEC_ID")) if tech.attrib.get("CAPEC_ID") else None
                tech_id = generate_hash(f"{ap_id}_technique_{step_number}_{idx}_{tech_text}")
                techniques.append((tech_id, flow_id, capec_tech_id, tech_text))

        # Prerequisites
        for idx, pre in enumerate(ap.findall(".//capec:Prerequisite", ns)):
            prerequisite_id = generate_hash(f"{ap_id}_prerequisite_{idx}")
            prerequisites.append((prerequisite_id, ap_id, extract_all_text_from_element(pre)))

        # Skills Required
        for idx, sk in enumerate(ap.findall(".//capec:Skill", ns)):
            skill_id = generate_hash(f"{ap_id}_skill_{idx}")
            level = sk.attrib.get("Level")
            skills.append((skill_id, ap_id, level, extract_all_text_from_element(sk)))

        # Resources Required
        for idx, res in enumerate(ap.findall(".//capec:Resource", ns)):
            resource_id = generate_hash(f"{ap_id}_resource_{idx}")
            resources.append((resource_id, ap_id, extract_all_text_from_element(res)))
    
        # Indicators
        for idx, ind in enumerate(ap.findall(".//capec:Indicator", ns)):
            indicator_id = generate_hash(f"{ap_id}_indicator_{idx}")
            indicators.append((indicator_id, ap_id, extract_all_text_from_element(ind)))

        # Example Instances
        for idx, ex in enumerate(ap.findall(".//capec:Example", ns)):
            example_id = generate_hash(f"{ap_id}_example_{idx}")
            examples.append((example_id, ap_id, extract_all_text_from_element(ex)))

        # Taxonomy Mappings
        for idx, tm in enumerate(ap.findall(".//capec:Taxonomy_Mapping", ns)):
            taxonomy_id = generate_hash(f"{ap_id}_taxonomy_{idx}")
            tax_name = tm.attrib.get("Taxonomy_Name")
            entry_id = tm.findtext("capec:Entry_ID", default=None, namespaces=ns)
            entry_name = tm.findtext("capec:Entry_Name", default=None, namespaces=ns)
            fit = tm.findtext("capec:Mapping_Fit", default=None, namespaces=ns)
            taxonomies.append((taxonomy_id, ap_id, tax_name, entry_id, entry_name, fit))

        # References
        for ref in ap.findall(".//capec:Reference", ns):
            ref_id = ref.attrib.get("External_Reference_ID")
            section = ref.attrib.get("Section") 
            if section is None:
                # Ensure no duplicate entries for ap_id and ref_id
                if (ap_id, ref_id, None) not in capec_refs:
                    capec_refs.append((ap_id, ref_id, None))
            else:
                # Ensure no duplicate entries for ap_id and ref_id
                if (ap_id, ref_id, section) not in capec_refs:
                    capec_refs.append((ap_id, ref_id, section))

        # Notes
        # buscar en Notes de ap y despues recorrer cada Note dentro de Note
        for notes_parent in ap.findall(".//capec:Notes", ns):
            for idx, note in enumerate(notes_parent.findall(".//capec:Note", ns)):
                note_id = generate_hash(f"{ap_id}_note_{idx}")
                note_type = note.attrib.get("Type")
                note_text = extract_all_text_from_element(note)
                notes.append((note_id, ap_id, note_type, note_text))
    
    # External External_References
    for ext_ref in root.findall(".//capec:External_Reference", ns):
        ref_id = ext_ref.attrib.get("Reference_ID")
        author = ext_ref.findtext("capec:Author", default=None, namespaces=ns)
        title = ext_ref.findtext("capec:Title", namespaces=ns)
        edition = ext_ref.findtext("capec:Edition", default=None, namespaces=ns)
        pub = ext_ref.findtext("capec:Publication", default=None, namespaces=ns)
        year = ext_ref.findtext("capec:Publication_Year", default=None, namespaces=ns)
        month = ext_ref.findtext("capec:Publication_Month", default=None, namespaces=ns)
        # si month existe quitar los dos primeros caracteres
        if month and len(month) > 2:
            month = month[2:]
        day = ext_ref.findtext("capec:Publication_Day", default=None, namespaces=ns)
        if day and len(day) > 4:
            day = day[3:]
        publisher = ext_ref.findtext("capec:Publisher", default=None, namespaces=ns)
        url = ext_ref.findtext("capec:URL", default=None, namespaces=ns)
        date = ext_ref.findtext("capec:URL_Date", default=None, namespaces=ns)
        external_refs.append((ref_id, author, title, edition, pub, year, month, day, publisher, url, date))

    return {
        "attack_patterns": patterns,
        "descriptions": descriptions,
        "extended_descriptions": extended_descriptions,
        "alternate_terms": alternate_terms,
        "related_weaknesses": related_weaknesses,
        "related_attack_patterns": related_patterns,
        "mitigations": mitigations,
        "consequences": consequences,
        "execution_flows": flows,
        "techniques": techniques,
        "prerequisites": prerequisites,
        "skills_required": skills,
        "resources_required": resources,
        "indicators": indicators,
        "example_instances": examples,
        "taxonomy_mappings": taxonomies,
        "external_references": external_refs,
        "capec_references": capec_refs,
        "notes": notes
    }

def insert_batch(query, batch):
    conn = connect_db_capec()
    cursor = conn.cursor()
    cursor.executemany(query, batch)
    conn.commit()

def _insert_chunk(args):
    query, chunk = args
    if not chunk:
        return 0
    conn = connect_db_capec()
    cursor = conn.cursor()
    cursor.executemany(query, chunk)
    conn.commit()
    cursor.close()
    conn.close()
    return len(chunk)

def load_capec_data(data, batch_size=1000):
    print("🚀 Insertando datos en paralelo...")
    pool = Pool(processes=cpu_count())
    total_inserted = 0

    def dispatch(name, query, dataset):
        nonlocal total_inserted
        if not dataset:
            return
        chunks = [dataset[i:i + batch_size] for i in range(0, len(dataset), batch_size)]
        tasks = [(query, chunk) for chunk in chunks]
        results = pool.map(_insert_chunk, tasks)
        inserted = sum(results)
        total_inserted += inserted
        print(f"✅ {inserted} registros insertados en '{name}'")

    dispatch("AttackPattern", "INSERT INTO AttackPattern (AttackPatternID, Name, Status, Abstraction, Likelihood_Of_Attack, Typical_Severity) VALUES (%s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE Name=VALUES(Name), Status=VALUES(Status), Abstraction=VALUES(Abstraction), Likelihood_Of_Attack=VALUES(Likelihood_Of_Attack), Typical_Severity=VALUES(Typical_Severity)", data["attack_patterns"])
    dispatch("Description", "INSERT INTO Description (DescriptionID, AttackPatternID, DescriptionText) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE DescriptionText=VALUES(DescriptionText)", data["descriptions"])
    dispatch("Extended_Description", "INSERT INTO Extended_Description (ExtendedDescriptionID, AttackPatternID, DescriptionText) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE DescriptionText=VALUES(DescriptionText)", data["extended_descriptions"])
    dispatch("Alternate_Terms", "INSERT INTO Alternate_Terms (AlternateTermID, AttackPatternID, Term, Description) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE Term=VALUES(Term), Description=VALUES(Description)", data["alternate_terms"])
    dispatch("Related_Weaknesses", "INSERT INTO Related_Weaknesses (AttackPatternID, CWE_ID) VALUES (%s, %s) ON DUPLICATE KEY UPDATE CWE_ID=VALUES(CWE_ID)", data["related_weaknesses"])
    dispatch("Related_Attack_Patterns", "INSERT INTO Related_Attack_Patterns (AttackPatternID, CAPEC_ID, Nature) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE Nature=VALUES(Nature)", data["related_attack_patterns"])
    dispatch("Mitigations", "INSERT INTO Mitigations (MitigationID, AttackPatternID, MitigationText) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE MitigationText=VALUES(MitigationText)", data["mitigations"])
    dispatch("Consequences", "INSERT INTO Consequences (ConsequenceID, AttackPatternID, Scope, Impact, Likelihood_Of_Attack, Note) VALUES (%s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE Scope=VALUES(Scope), Impact=VALUES(Impact), Likelihood_Of_Attack=VALUES(Likelihood_Of_Attack), Note=VALUES(Note)", data["consequences"])
    dispatch("Execution_Flow", "INSERT INTO Execution_Flow (ExecutionFlowID, AttackPatternID, Attack_StepNumber, Phase, Description) VALUES (%s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE Attack_StepNumber=VALUES(Attack_StepNumber), Phase=VALUES(Phase), Description=VALUES(Description)", data["execution_flows"])
    dispatch("Attack_Techniques", "INSERT INTO Attack_Techniques (TechniqueID, ExecutionFlowID, CAPEC_ID, TechniqueText) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE CAPEC_ID=VALUES(CAPEC_ID), TechniqueText=VALUES(TechniqueText)", data["techniques"])
    dispatch("Prerequisites", "INSERT INTO Prerequisites (PrerequisiteID, AttackPatternID, PrerequisiteText) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE PrerequisiteText=VALUES(PrerequisiteText)", data["prerequisites"])
    dispatch("Skills_Required", "INSERT INTO Skills_Required (SkillID, AttackPatternID, SkillLevel, Skill_Description) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE SkillLevel=VALUES(SkillLevel), Skill_Description=VALUES(Skill_Description)", data["skills_required"])
    dispatch("Resources_Required", "INSERT INTO Resources_Required (ResourceID, AttackPatternID, ResourceText) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE ResourceText=VALUES(ResourceText)", data["resources_required"])
    dispatch("Indicators", "INSERT INTO Indicators (IndicatorID, AttackPatternID, IndicatorText) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE IndicatorText=VALUES(IndicatorText)", data["indicators"])
    dispatch("Example_Instances", "INSERT INTO Example_Instances (ExampleID, AttackPatternID, ExampleText) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE ExampleText=VALUES(ExampleText)", data["example_instances"])
    dispatch("Taxonomy_Mappings", "INSERT INTO Taxonomy_Mappings (MappingID, AttackPatternID, Taxonomy_Name, Entry_ID, Entry_Name, Mapping_Fit) VALUES (%s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE Taxonomy_Name=VALUES(Taxonomy_Name), Entry_ID=VALUES(Entry_ID), Entry_Name=VALUES(Entry_Name), Mapping_Fit=VALUES(Mapping_Fit)", data["taxonomy_mappings"])
    dispatch("External_References", "INSERT INTO External_References (ReferenceID, Author, Title, Edition, Publication, Publication_Year, Publication_Month, Publication_Day, Publisher, URL, URL_Date) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE Author=VALUES(Author), Title=VALUES(Title), Edition=VALUES(Edition), Publication=VALUES(Publication), Publication_Year=VALUES(Publication_Year), Publication_Month=VALUES(Publication_Month), Publication_Day=VALUES(Publication_Day), Publisher=VALUES(Publisher), URL=VALUES(URL), URL_Date=VALUES(URL_Date)", data["external_references"])
    dispatch("CAPEC_References", "INSERT IGNORE INTO CAPEC_References (AttackPatternID, External_Reference_ID, Section) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE Section=VALUES(Section)", data["capec_references"])
    dispatch("Notes", "INSERT INTO Notes (NoteID, AttackPatternID, type, NoteText) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE type=VALUES(type), NoteText=VALUES(NoteText)", data["notes"])

    pool.close()
    pool.join()
    print(f"✅ Carga finalizada. Total registros insertados: {total_inserted}")

if __name__ == "__main__":
    check_or_create_capec_db()
    data = None
    
    # Download and extract the XML file
    xml_path = download_extract_capec_data(URL)
    
    tree = ET.parse(xml_path)
    root = tree.getroot()

    try:
        data = transform_capec_data(root)
        load_capec_data(data)
        print("🚀 Datos insertados en {DB_CAPEC} correctamente.")
    except Exception as e:
        print("❌ Error en la carga de datos:", e)

    finally:
        print("🔒 Cerrando conexión a la base de datos.")
        # borrar el archivo XML descargado
        if os.path.exists(xml_path):
            os.remove(xml_path)
            print(f"🗑️ Archivo {xml_path} eliminado.")
        else:
            print(f"🗑️ El archivo {xml_path} no existe.")
