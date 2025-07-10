import io
import re
import requests
import zipfile
import os
import xml.etree.ElementTree as ET
from src.config.db_config import connect_db_cwe, create_db, DB_CWE
import hashlib

URL = 'https://cwe.mitre.org/data/xml/cwec_latest.xml.zip'

# Define namespaces
namespaces = {
    '': 'http://cwe.mitre.org/cwe-7',
    'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xhtml': 'http://www.w3.org/1999/xhtml'
}

def escape_characters(value):
    if not value or str(value).strip() == "":
        return None
    if isinstance(value, str):
        value = value.replace("'", "’").replace('"', "”")  # Reemplaza comillas
        value = re.sub(r"[\x00-\x1F\x7F]", "", value)  # Elimina caracteres de control
        return value.strip()
    return str(value)

def download_extract_cwe_data(url, nombre_salida='cwe.xml', destino='.'):
    """
    Descarga un ZIP desde una URL, extrae el archivo XML y lo guarda como 'cwe.xml'.

    Parámetros:
    url (str): URL del archivo ZIP a descargar.
    nombre_salida (str): Nombre con el que se guardará el archivo XML extraído.
    destino (str): Carpeta destino donde se guardará el archivo.

    Retorna:
    str: Ruta al archivo extraído o None si ocurre un error.
    """
    try:
        # Descargar el ZIP
        print(f"Descargando desde {url}...")
        response = requests.get(url)
        response.raise_for_status()

        # Abrir el ZIP desde memoria
        with zipfile.ZipFile(io.BytesIO(response.content)) as zip_ref:
            # Buscar archivo XML
            archivo_xml = next((name for name in zip_ref.namelist() if name.endswith('.xml')), None)

            if archivo_xml:
                # Extraer y renombrar
                zip_ref.extract(archivo_xml, destino)
                ruta_original = os.path.join(destino, archivo_xml)
                ruta_final = os.path.join(destino, nombre_salida)
                # Eliminar el archivo de destino si ya existe
                if os.path.exists(ruta_final):
                    os.remove(ruta_final)
                os.rename(ruta_original, ruta_final)
                print(f"Archivo XML extraído como: {ruta_final}")
                return ruta_final
            else:
                print("No se encontró ningún archivo XML en el ZIP.")
                return None
    except Exception as e:
        print(f"Error al descargar o extraer: {e}")
        return None

def check_or_create_cwe_db():
    conn = create_db()
    cursor = conn.cursor()

    # Verificar si la base de datos ya existe
    cursor.execute("SHOW DATABASES")
    databases = [db[0] for db in cursor.fetchall()]

    if DB_CWE not in databases:
        print(f"La base de datos '{DB_CWE}' no existe. Creándola ahora...")
        cursor.execute(f"CREATE DATABASE {DB_CWE}")

        # Conectarse a la base de datos recién creada
        conn.database = DB_CWE

        # Crear tablas
        with open('BBDD/CWE_BBDD.sql', 'r') as sql_file:
            sql_script = sql_file.read()
        sql_statements = sql_script.split(';')
        for statement in sql_statements:
            if statement.strip():
                cursor.execute(statement)
        print("✅ Base de datos {DB_CWE} creada con éxito.")
        conn.commit()

        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print("📋 Tablas en la base de datos:")
        for table in tables:
            print(table[0])
        print("✅ Tablas creadas con éxito en {DB_CWE}.")
        conn.commit()
    else:
        print("✅ La base de datos {DB_CWE} ya existe. Verificando tablas...")

        # Conectarse a la base de datos existente
        conn.database = DB_CWE

        # Comprobar si existen las tablas necesarias
        cursor.execute("SHOW TABLES")
        existing_tables = set(row[0] for row in cursor.fetchall())

        # Leer las tablas requeridas del script SQL
        required_tables = set()
        with open('BBDD/CWE_BBDD.sql', 'r') as sql_file:
            for line in sql_file:
                match = re.match(r'CREATE TABLE IF NOT EXISTS `?(\w+)`?', line.strip(), re.IGNORECASE)
                if match:
                    required_tables.add(match.group(1))

        missing_tables = required_tables - existing_tables

        if missing_tables:
            print(f"⚠️ Faltan las siguientes tablas en la base de datos: {', '.join(missing_tables)}. Creándolas ahora...")
            with open('BBDD/CWE_BBDD.sql', 'r') as sql_file:
                sql_script = sql_file.read()
            sql_statements = sql_script.split(';')
            for statement in sql_statements:
                if statement.strip():
                    cursor.execute(statement)
            conn.commit()
            print("✅ Tablas faltantes creadas con éxito.")
        else:
            print("✅ Todas las tablas necesarias ya existen en {DB_CWE}. Continuando con el proceso de ETL...")

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

def transform_cwe_data(root):
    # Extract CWE items
    cwe_items = []
    references = []
    external_references = []
    capec_references = []
    references_externals_table = []

    # Extract Aplicable_Platforms
    languages = []
    architectures = []
    technologies = []
    operating_systems = []

    # Extract Potential_Mitigations
    mitigations = []

    # Extract Alternate_Terms
    alternate_terms = []

    # Extract Modes_Of_Introduction
    modes_of_introduction = []

    # RElated_WEAKNESSES
    related_weaknesses = []

    # Extract Detection_Methods
    detection_methods = []

    # Extract observed examples
    observed_examples = []

    # Extract Common Consequences
    consequences = []

    # Extract Background_Details
    backgroun_details = []

    # Extract Notes
    notes = []

    # Extract Usage Details
    mapping_notes = []

    # Extract mapping_suggestions
    mapping_suggestions = []

    # Extract Functional_Areas
    functional_areas = []

    # Extract Affected Resources
    affected_resources = []

    weakness_ordinalities = []
    taxonomy_mapping = []
    demostrative_examples = []

    # Extract WEAKNESS nodes
    weakness_nodes = root.findall('.//Weakness', namespaces)
    for weakness in weakness_nodes:
        weakness_id = weakness.get('ID')
        weakness_name = weakness.get('Name')
        weakness_abstraction = weakness.get('Abstraction')
        weakness_structure = weakness.get('Structure')
        weakness_status = weakness.get('Status')
        
        weakness_description = weakness.find('Description', namespaces).text if weakness.find('Description', namespaces) is not None else None

        # Extract extended description
        extended_description_elem = weakness.find('Extended_Description', namespaces)
        extended_description = extract_all_text_from_element(extended_description_elem)

        likelihood_of_exploit = weakness.find('Likelihood_Of_Exploit', namespaces).text if weakness.find('Likelihood_Of_Exploit', namespaces) is not None else None
        # Ensure likelihood_of_exploit value is valid
        valid_likelihoods = {'Low', 'Medium', 'High', 'Unknown'}
        if likelihood_of_exploit not in valid_likelihoods:
            likelihood_of_exploit = 'Unknown'
        
        diagram = weakness.get('Diagram')
        
        # Extract references within weaknesses
        references = weakness.findall('References/Reference', namespaces)
        for reference in references:
            external_reference_id = reference.get('External_Reference_ID')
            section = reference.get('Section')
            references_externals_table.append((weakness_id, external_reference_id, section))

        # Extract related attack patterns within weaknesses
        related_attack_patterns = weakness.findall('Related_Attack_Patterns/Related_Attack_Pattern', namespaces)
        for attack_pattern in related_attack_patterns:
            capec_id = attack_pattern.get('CAPEC_ID')
            capec_references.append((weakness_id, capec_id))

        # Extract Applicable_Platforms
        platforms = weakness.findall('.//Applicable_Platforms', namespaces)
        valid_prevalences = {'Often', 'Sometimes', 'Rarely', 'Undetermined'}
        for idx_platform, platform in enumerate(platforms):
            for idx_language, language in enumerate(platform.findall('Language', namespaces)):
                language_name = language.get('Name')
                language_class = language.get('Class')
                language_prevalence = language.get('Prevalence')
                if language_prevalence not in valid_prevalences:
                    language_prevalence = 'Undetermined'
        
                #hashear el objeto y guardarlo como ID para evitar duplicados
                
                language_hash_id = generate_hash(f"{weakness_id}_{idx_platform}_{idx_language}")

                languages.append((language_hash_id, weakness_id, language_name, language_class, language_prevalence))
            for idx_architecture, architecture in enumerate(platform.findall('Architecture', namespaces)):
                architecture_name = architecture.get('Name')
                architecture_class = architecture.get('Class')
                architecture_prevalence = architecture.get('Prevalence')
                if architecture_prevalence not in valid_prevalences:
                    architecture_prevalence = 'Undetermined'
                
                #hashear el objeto y guardarlo como ID para evitar duplicados
                architecture_hash_id = generate_hash(f"{weakness_id}_{idx_platform}_{idx_architecture}")
                architectures.append((architecture_hash_id, weakness_id, architecture_name, architecture_class, architecture_prevalence))            
            for idx_technology, technology in enumerate(platform.findall('Technology', namespaces)):
                technology_name = technology.get('Name')
                technology_class = technology.get('Class')
                technology_prevalence = technology.get('Prevalence')
                if technology_prevalence not in valid_prevalences:
                    technology_prevalence = 'Undetermined'
                
                technology_hash_id = generate_hash(f"{weakness_id}_{idx_platform}_{idx_technology}")
                technologies.append((technology_hash_id, weakness_id, technology_name, technology_class, technology_prevalence))
            for idx_operating_system, operating_system in enumerate(platform.findall('Operating_System', namespaces)):
                operating_system_name = operating_system.get('Name')
                operating_system_class = operating_system.get('Class')
                operating_system_prevalence = operating_system.get('Prevalence')
                if operating_system_prevalence not in valid_prevalences:
                    operating_system_prevalence = 'Undetermined'
                operating_system_cpeID = operating_system.get('CPE_ID')
                operating_system_version = operating_system.get('Version')
                
                operating_system_hash_id = generate_hash(f"{weakness_id}_{idx_platform}_{idx_operating_system}")
                operating_systems.append((operating_system_hash_id, weakness_id, operating_system_name, operating_system_class, operating_system_cpeID, operating_system_version, operating_system_prevalence))
 
        # Extract Potential_Mitigations
        mitigations_container = weakness.findall('.//Potential_Mitigations/Mitigation', namespaces)
        for idx_mitigation, mitigation in enumerate(mitigations_container):
            mitigation_id = mitigation.get('Mitigation_ID')

            # Extract mitigation_description
            mitigation_description_elem = mitigation.find('Description', namespaces)
            mitigation_description = extract_all_text_from_element(mitigation_description_elem)

            phase = mitigation.find('Phase', namespaces).text if mitigation.find('Phase', namespaces) is not None else None
            strategy = mitigation.find('Strategy', namespaces).text if mitigation.find('Strategy', namespaces) is not None else None
            # Extract effectiveness
            effectiveness = mitigation.find('Effectiveness', namespaces).text if mitigation.find('Effectiveness', namespaces) is not None else None
            valid_effectiveness = {'High', 'Moderate', 'Limited', 'Incidental', 'Discouraged Common Practice', 'Defense in Depth', 'None'}
            if effectiveness not in valid_effectiveness:
                effectiveness = None 
            
            # Extract effectiveness_notes
            effectiveness_notes_el = mitigation.find('Effectiveness_Notes', namespaces)
            effectiveness_notes = extract_all_text_from_element(effectiveness_notes_el)

            # Hashear el objeto y guardarlo como ID para evitar duplicados
            mitigation_hash_id = generate_hash(f"{weakness_id}_{idx_mitigation}")
            
            mitigations.append((mitigation_hash_id, weakness_id, mitigation_id, mitigation_description, phase, strategy, effectiveness, effectiveness_notes))

        # Extract Alternate terms
        alternate_terms_container = weakness.findall('.//Alternate_Terms/Alternate_Term', namespaces)
        for idx_term, term in enumerate(alternate_terms_container):
            term_name = term.find('Term', namespaces).text if term.find('Term', namespaces) is not None else None
            term_description_elem = term.find('Description', namespaces)
            term_description = extract_all_text_from_element(term_description_elem)
            term_id = generate_hash(f"{weakness_id}_{idx_term}")
            alternate_terms.append((term_id, weakness_id, term_name, term_description))

        # Extract Modes_Of_Introduction
        modes_of_introduction_container = weakness.findall('.//Modes_Of_Introduction/Introduction', namespaces)
        for idx, introduction in enumerate(modes_of_introduction_container):
            introduction_phase = introduction.find('Phase', namespaces).text if introduction.find('Phase', namespaces) is not None else None
            introduction_description_elem = introduction.find('Note', namespaces)
            introduction_note = extract_all_text_from_element(introduction_description_elem)
            introduction_id = generate_hash(f"{weakness_id}_{idx}")
            modes_of_introduction.append((introduction_id, weakness_id, introduction_phase, introduction_note))

        # Extract Related_Weaknesses
        related_weaknesses_container = weakness.findall('.//Related_Weaknesses/Related_Weakness', namespaces)
        for related_weakness in related_weaknesses_container:
            related_nature = related_weakness.get('Nature')
            related_weakness_id = related_weakness.get('CWE_ID')
            related_view = related_weakness.get('View_ID')
            related_chain = related_weakness.get('Chain_ID')
            related_ordinal = related_weakness.get('Ordinal')
            related_weaknesses.append((weakness_id, related_nature, related_weakness_id, related_view, related_chain, related_ordinal))

        # Extract Detection_Methods
        detection_methods_container = weakness.findall('.//Detection_Methods/Detection_Method', namespaces)
        for idx_detection, detection_method in enumerate(detection_methods_container):
            detection_method_id = detection_method.get('Detection_Method_ID')
            detection_method_name = detection_method.find('Method', namespaces).text if detection_method.find('Method', namespaces) is not None else None
            detection_method_description_elem = detection_method.find('Description', namespaces) if detection_method.find('Description', namespaces) is not None else None
            detection_method_description = extract_all_text_from_element(detection_method_description_elem)
            
            detection_effectiveness = detection_method.find('Effectiveness', namespaces).text if detection_method.find('Effectiveness', namespaces) is not None else None
            valid_effectiveness = {'High', 'Moderate', 'SOAR Partial', 'Opportunistic', 'Limited', 'None'}
            if detection_effectiveness not in valid_effectiveness:
                detection_effectiveness = None
            detection_effectiveness_notes_el = detection_method.find('Effectiveness_Notes', namespaces) if detection_method.find('Effectiveness_Notes', namespaces) is not None else None
            detection_effectiveness_notes = extract_all_text_from_element(detection_effectiveness_notes_el)

            detection_method_hash_id = generate_hash(f"{weakness_id}_{idx_detection}")

            detection_methods.append((detection_method_hash_id, weakness_id, detection_method_id, detection_method_name, detection_method_description, detection_effectiveness, detection_effectiveness_notes))

        # Extract Observed_Examples
        observed_examples_container = weakness.findall('.//Observed_Examples/Observed_Example', namespaces)
        for example in observed_examples_container:
            example_id = example.find('Reference', namespaces).text
            example_description_elem = example.find('Description', namespaces)
            example_description = extract_all_text_from_element(example_description_elem)
            example_url = example.find('Link', namespaces).text if example.find('Link', namespaces) is not None else None
            observed_examples.append((weakness_id, example_id, example_description, example_url))
        
        # Extract Common Consequences
        consequences_container = weakness.findall('.//Common_Consequences/Consequence', namespaces)
        for idx_consequence, consequence in enumerate(consequences_container):
            consequence_id = consequence.get('Consequence_ID') if consequence.get('Consequence_ID') is not None else None
            consequence_scope = consequence.find('Scope', namespaces).text if consequence.find('Scope', namespaces) is not None else None
            valid_scopes = {'Confidentiality', 'Integrity', 'Availability', 'Access Control', 'Accountability', 'Authentication', 'Authorization', 'Non-Repudiation', 'Other'}
            if consequence_scope not in valid_scopes:
                consequence_scope = 'Other'  # or handle appropriately

            consequence_impact = consequence.find('Impact', namespaces).text if consequence.find('Impact', namespaces) is not None else None
            consequence_likelihood = consequence.find('Likelihood', namespaces).text if consequence.find('Likelihood', namespaces) is not None else None
            valid_likelihoods = {'Low', 'Medium', 'High', 'Unknown'}
            if consequence_likelihood not in valid_likelihoods:
                consequence_likelihood = 'Unknown'
            consequence_note_elem = consequence.find('Note', namespaces)
            consequence_note = extract_all_text_from_element(consequence_note_elem)
            consequence_hash_id = generate_hash(f"{weakness_id}_{idx_consequence}")
            consequences.append((consequence_hash_id, weakness_id, consequence_id, consequence_scope, consequence_impact, consequence_likelihood, consequence_note))

        # Extract Background_Details
        background_details_container = weakness.findall('.//Background_Details/Background_Detail', namespaces)
        for idx_back, background_detail in enumerate(background_details_container):
            back_id = generate_hash(f"{weakness_id}_{idx_back}")
            background_detail_text = extract_all_text_from_element(background_detail)
            backgroun_details.append((back_id, weakness_id, background_detail_text))

        # Extract Notes
        notes_container = weakness.findall('.//Notes/Note', namespaces)
        for idx_note, note in enumerate(notes_container):
            note_type = note.get('Type')
            note_text = extract_all_text_from_element(note)
            note_id = generate_hash(f"{weakness_id}_{idx_note}")
            notes.append((note_id, weakness_id, note_type, note_text))

        # Extract Mapping_Notes
        mapping_notes_container = weakness.findall('.//Mapping_Notes', namespaces)
        for mapping_note in mapping_notes_container:
            mapping_usage = mapping_note.find('Usage', namespaces).text if mapping_note.find('Usage', namespaces) is not None else None
            valid_usages = {'Discouraged', 'Prohibited', 'Allowed', 'Allowed-with-Review'}
            if mapping_usage not in valid_usages:
                mapping_usage = None  # or handle appropriately

            mapping_rationale_elem = mapping_note.find('Rationale', namespaces)
            mapping_rationale_text = extract_all_text_from_element(mapping_rationale_elem)

            mapping_comment_elem = mapping_note.find('Comments', namespaces)
            mapping_comment_text = extract_all_text_from_element(mapping_comment_elem)

            # Join all reasons by commas
            mapping_reasons_container = mapping_note.findall('.//Reasons/Reason', namespaces)
            mapping_reasons_text = ', '.join(str(reason.get('Type') or '') for reason in mapping_reasons_container)
            
            # Create a hash of the object
            hash_object = f"{weakness_id}{mapping_usage}{mapping_rationale_text}{mapping_comment_text}{mapping_reasons_text}"
            mapping_note_id = hashlib.md5(hash_object.encode()).hexdigest()
            
            # Extract Suggestions
            suggestions_container = mapping_note.findall('.//Suggestions/Suggestion', namespaces)
            for suggestion in suggestions_container:
                suggestion_cwe_id = suggestion.get('CWE_ID')
                suggestion_comment = suggestion.get('Comment')
                mapping_suggestions.append((mapping_note_id, suggestion_cwe_id, suggestion_comment))
           
            # Append the mapping_note_id to the mapping_notes tuple
            mapping_notes.append((mapping_note_id, weakness_id, mapping_usage, mapping_rationale_text, mapping_comment_text, mapping_reasons_text))

        # Extract Functional_Areas
        functional_areas_container = weakness.findall('.//Functional_Areas/Functional_Area', namespaces)
        for functional_area in functional_areas_container:
            functional_areas.append((weakness_id, functional_area.text))

        # Extract Affected_Resources
        affected_resources_container = weakness.findall('.//Affected_Resources/Affected_Resource', namespaces)
        for affected_resource in affected_resources_container:
            affected_resource_resource = affected_resource.text
            valid_affected_resource = {'CPU', 'File or Directory', 'Memory', 'System Process', 'Other'}
            if affected_resource_resource not in valid_affected_resource:
                affected_resource_resource = 'Other'
            affected_resources.append((weakness_id, affected_resource_resource))

        # Extract Weakness_Ordinalities
        weakness_ordinalities_container = weakness.findall('.//Weakness_Ordinalities/Weakness_Ordinality', namespaces)
        for ordinality in weakness_ordinalities_container:
            ordinality_name = ordinality.find('Ordinality', namespaces).text
            valid_ordinalities = {'Indirect', 'Primary', 'Resultant'}
            if ordinality_name not in valid_ordinalities:
                ordinality_name = None  # or handle appropriately
            ordinality_description = ordinality.find('Description', namespaces).text if ordinality.find('Description', namespaces) is not None else None
            weakness_ordinalities.append((weakness_id, ordinality_name, ordinality_description))
        
        # Extract Taxonomy_Mappings
        taxonomy_mappings_container = weakness.findall('.//Taxonomy_Mappings/Taxonomy_Mapping', namespaces)
        for mapping in taxonomy_mappings_container:
            mapping_name = mapping.get('Taxonomy_Name')
            mapping_entry_id = mapping.find('Entry_ID', namespaces).text if mapping.find('Entry_ID', namespaces) is not None else None
            mapping_entry_name_elem = mapping.find('Entry_Name', namespaces)
            mapping_entry_name = extract_all_text_from_element(mapping_entry_name_elem)
            
            mapping_fit_elem = mapping.find('Mapping_Fit', namespaces)
            mapping_fit = mapping_fit_elem.text if mapping_fit_elem is not None else None
            valid_mapping_fits = {'Exact', 'CWE More Abstract', 'CWE More Specific', 'Imprecise', 'Perspective'}
            if mapping_fit not in valid_mapping_fits:
                mapping_fit = None  # Evita errores por valores inválidos


            taxonomy_mapping.append((weakness_id, mapping_name, mapping_entry_id, mapping_entry_name, mapping_fit))

        # Extract Demonstrative_Examples
        demostrative_examples_container = weakness.findall('.//Demonstrative_Examples/Demonstrative_Example', namespaces)
        for idx_demostrative_example, demostrative_example in enumerate(demostrative_examples_container):
            demostrative_example_hash = generate_hash(f"{weakness_id}_{idx_demostrative_example}")
            demostrative_example_id = demostrative_example.get('Demonstrative_Example_ID')
            demostrative_example_tittle = demostrative_example.find('Title_Text', namespaces).text if demostrative_example.find('Title_Text', namespaces) is not None else ''
            demostrative_example_intro_elem = demostrative_example.find('Intro_Text', namespaces)
            demostrative_example_intro = extract_all_text_from_element(demostrative_example_intro_elem)

            demostrative_example_body_elem = demostrative_example.findall('Body_Text', namespaces)
            demostrative_example_body = extract_all_text_from_element(demostrative_example_body_elem)

            demostrative_example_code_elem = demostrative_example.findall('Example_Code', namespaces)
            demostrative_example_code = extract_all_text_from_element(demostrative_example_code_elem)

            demostrative_examples_references_elem = demostrative_example.findall('References', namespaces)
            demostrative_examples_references = extract_all_text_from_element(demostrative_examples_references_elem)

            demostrative_examples.append((demostrative_example_hash, weakness_id, demostrative_example_id, demostrative_example_tittle, demostrative_example_intro, demostrative_example_body, demostrative_example_code, demostrative_examples_references))

        cwe_items.append((weakness_id, weakness_name, weakness_description, extended_description, weakness_structure, weakness_abstraction, weakness_status, likelihood_of_exploit, diagram))

    # Extract CWE External references
    external_references_xml = root.findall('.//External_Reference', namespaces)
    for ref in external_references_xml:
        reference_id = ref.get('Reference_ID')
        authors = [author.text if author.text is not None else '' for author in ref.findall('Author', namespaces)] if ref.findall('Author', namespaces) else []
        authors_text = ', '.join(authors)
        title = ref.find('Title', namespaces).text if ref.find('Title', namespaces) is not None else None
        edition = ref.find('Edition', namespaces).text if ref.find('Edition', namespaces) is not None else None
        publication = ref.find('Publication', namespaces).text if ref.find('Publication', namespaces) is not None else None
        publisher = ref.find('Publisher', namespaces).text if ref.find('Publisher', namespaces) is not None else None
        publication_year = ref.find('Publication_Year', namespaces).text if ref.find('Publication_Year', namespaces) is not None else None
        publication_month = ref.find('Publication_Month', namespaces).text if ref.find('Publication_Month', namespaces) is not None else None
        if publication_month and publication_month.startswith('--'):
            publication_month = publication_month[2:]
        publication_day = ref.find('Publication_Day', namespaces).text if ref.find('Publication_Day', namespaces) is not None else None
        if publication_day and publication_day.startswith('---'):
            publication_day = publication_day[3:]
        
        url = ref.find('URL', namespaces).text if ref.find('URL', namespaces) is not None else None
        url_date = ref.find('URL_Date', namespaces).text if ref.find('URL_Date', namespaces) is not None else None
        external_references.append((reference_id, authors_text, title, edition, publication, publisher, publication_year, publication_month, publication_day, url, url_date))

    return cwe_items, external_references, references_externals_table, capec_references, languages, architectures, technologies, operating_systems, mitigations, alternate_terms, modes_of_introduction, related_weaknesses, detection_methods, observed_examples, consequences, backgroun_details, notes, mapping_notes, mapping_suggestions, functional_areas, affected_resources, weakness_ordinalities, taxonomy_mapping, demostrative_examples

def load_data(cwe_items, external_references, references_externals_table, capec_references, languages, architectures, technologies, operating_systems, mitigations, alternate_terms, modes_of_introduction, related_weaknesses, detection_methods, observed_examples, consequences, backgroun_details, notes, mapping_notes, mapping_suggestions, functional_areas, affected_resources, weakness_ordinalities, taxonomy_mapping, demostrative_examples, batch_size=10000):
    # Connect to database
    conn = connect_db_cwe()
    cursor = conn.cursor()

    # Insert data into the tables with progress printing
    total_items = len(cwe_items) + len(external_references) + len(references_externals_table) + len(capec_references) + len(languages) + len(architectures) + len(technologies) + len(operating_systems) + len(mitigations) + len(alternate_terms) + len(modes_of_introduction) + len(related_weaknesses) + len(detection_methods) + len(observed_examples) + len(consequences) + len(backgroun_details) + len(notes) + len(mapping_notes) + len(functional_areas) + len(mapping_suggestions) + len(affected_resources) + len(weakness_ordinalities) + len(taxonomy_mapping) + len(demostrative_examples)
    processed_items = 0

    print(f"Total items to process: {total_items}")
    print(f"Cwe items: {len(cwe_items)}")
    print(f"External references: {len(external_references)}")
    print(f"References external table: {len(references_externals_table)}")
    print(f"Capec references: {len(capec_references)}")
    print(f"Languages: {len(languages)}")
    print(f"Architectures: {len(architectures)}")
    print(f"Technologies: {len(technologies)}")
    print(f"Operating systems: {len(operating_systems)}")
    print(f"Mitigations: {len(mitigations)}")
    print(f"Alternate terms: {len(alternate_terms)}")
    print(f"Modes of introduction: {len(modes_of_introduction)}")
    print(f"Related weaknesses: {len(related_weaknesses)}")
    print(f"Detection methods: {len(detection_methods)}")
    print(f"Observed examples: {len(observed_examples)}")
    print(f"Consequences: {len(consequences)}")
    print(f"Background details: {len(backgroun_details)}")
    print(f"Notes: {len(notes)}")
    print(f"Mapping notes: {len(mapping_notes)}")
    print(f"Mapping suggestions: {len(mapping_suggestions)}")
    print(f"Functional areas: {len(functional_areas)}")
    print(f"Affected resources: {len(affected_resources)}")
    print(f"Weakness ordinalities: {len(weakness_ordinalities)}")
    print(f"Taxonomy mapping: {len(taxonomy_mapping)}")
    print(f"Demonstrative examples: {len(demostrative_examples)}")
    

    # Insert CWE items in batches
    for i in range(0, len(cwe_items), batch_size):
        batch = cwe_items[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `weaknesses` (id, name, description, extended_description, structure, abstraction, status, likelihood_of_exploit, diagram)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        extended_description = VALUES(extended_description),
        structure = VALUES(structure),
        abstraction = VALUES(abstraction),
        status = VALUES(status),
        likelihood_of_exploit = VALUES(likelihood_of_exploit),
        diagram = VALUES(diagram)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (cwe_items).")

    # Insert references in batches
    for i in range(0, len(external_references), batch_size):
        batch = external_references[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `external_references` (reference_id, author, title, edition, publication, publisher, publication_year, publication_month, publication_day, url, url_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        author = VALUES(author),
        title = VALUES(title),
        edition = VALUES(edition),
        publication = VALUES(publication),
        publisher = VALUES(publisher),
        publication_year = VALUES(publication_year),
        publication_month = VALUES(publication_month),
        publication_day = VALUES(publication_day),
        url = VALUES(url),
        url_date = VALUES(url_date)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (external_references).")

    # Insert references_externals_table in batches
    for i in range(0, len(references_externals_table), batch_size):
        batch = references_externals_table[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `references_external_table` (weakness_id, reference_id, section)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
        section = VALUES(section)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (References_External_Table).")

    # Insert capec_references in batches
    for i in range(0, len(capec_references), batch_size):
        batch = capec_references[i:i + batch_size]
        cursor.executemany('''
        INSERT IGNORE INTO `related_attack_patterns` (weakness_id, capec_id)
        VALUES (%s, %s)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Related_Attack_Patterns).")

    # Insert languages in batches
    for i in range(0, len(languages), batch_size):
        batch = languages[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `languages` (id, weakness_id, name, class, prevalence)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        class = VALUES(class),
        prevalence = VALUES(prevalence)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Languages).")
    
    # Insert architectures in batches
    for i in range(0, len(architectures), batch_size):
        batch = architectures[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `architectures` (id, weakness_id, name, class, prevalence)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        class = VALUES(class),
        prevalence = VALUES(prevalence)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Architectures).")
    
    # Insert technologies in batches
    for i in range(0, len(technologies), batch_size):
        batch = technologies[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `technologies` (id, weakness_id, name, class, prevalence)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        class = VALUES(class),
        prevalence = VALUES(prevalence)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Technologies).")

    # Insert operating systems in batches
    for i in range(0, len(operating_systems), batch_size):
        batch = operating_systems[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `operating_systems` (id, weakness_id, name, version, cpe_id, class, prevalence)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        version = VALUES(version),
        cpe_id = VALUES(cpe_id),
        class = VALUES(class),
        prevalence = VALUES(prevalence)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Operating Systems).")

    # Insert mitigations in batches
    for i in range(0, len(mitigations), batch_size):
        batch = mitigations[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `mitigations` (id, weakness_id, mitigation_id, description, phase, strategy, effectiveness, effectiveness_notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        mitigation_id = VALUES(mitigation_id),
        description = VALUES(description),
        phase = VALUES(phase),
        strategy = VALUES(strategy),
        effectiveness = VALUES(effectiveness),
        effectiveness_notes = VALUES(effectiveness_notes)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Mitigations).")
    
    # Insert alternate terms in batches
    for i in range(0, len(alternate_terms), batch_size):
        batch = alternate_terms[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `alternate_terms` (id, weakness_id, term, description)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        description = VALUES(description)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Alternate_Terms).")

    # Insert modes of introduction in batches
    for i in range(0, len(modes_of_introduction), batch_size):
        batch = modes_of_introduction[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `modes_of_introduction` (id, weakness_id, phase, note)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        phase = VALUES(phase),
        note = VALUES(note)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Modes_Of_Introduction).")
    
    # Insert related weaknesses in batches
    for i in range(0, len(related_weaknesses), batch_size):
        batch = related_weaknesses[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `related_weaknesses` (weakness_id, nature, related_weakness_id, view_id, chain_id, ordinal)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        nature = VALUES(nature),
        chain_id = VALUES(chain_id),
        ordinal = VALUES(ordinal)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Related_Weaknesses).")
    
    # Insert detection methods in batches
    for i in range(0, len(detection_methods), batch_size):
        batch = detection_methods[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `detection_methods` (id, weakness_id, detection_method_id, method, description, effectiveness, effectiveness_notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        detection_method_id = VALUES(detection_method_id),
        method = VALUES(method),
        description = VALUES(description),
        effectiveness = VALUES(effectiveness),
        effectiveness_notes = VALUES(effectiveness_notes)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Detection_Methods).")
    
    # Insert observed examples in batches
    for i in range(0, len(observed_examples), batch_size):
        batch = observed_examples[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `observed_examples` (weakness_id, cve_id, description, url)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        url = VALUES(url)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Observed_Examples).")

    # Insert Common Consequences in batches
    for i in range(0, len(consequences), batch_size):
        batch = consequences[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `common_consequences` (id, weakness_id, consequence_id, scope, impact, likelihood, note)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        consequence_id = VALUES(consequence_id),
        scope = VALUES(scope),
        impact = VALUES(impact),
        likelihood = VALUES(likelihood),
        note = VALUES(note)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Common_Consequences).")

    # Insert Background Details in batches
    for i in range(0, len(backgroun_details), batch_size):
        batch = backgroun_details[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `background_details` (id, weakness_id, detail)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
        detail = VALUES(detail)
        ''', batch)
        
        #conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Background_Details).")

    # Insert Notes in batches
    for i in range(0, len(notes), batch_size):
        batch = notes[i:i + batch_size]

        # Escapar las comillas del 3 parametro de descriptions
        for j in range(len(batch)):
            batch[j] = (batch[j][0], batch[j][1], batch[j][2], escape_characters(batch[j][2]))

        cursor.executemany('''
        INSERT INTO `notes` (id, weakness_id, type, note)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        type = VALUES(type),
        note = VALUES(note)
        ''', batch)
        
        #conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Notes).")
    
    # Insert Mapping Notes in batches
    for i in range(0, len(mapping_notes), batch_size):
        batch = mapping_notes[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `mapping_notes` (id, weakness_id, uso, rationale, comments, reasons)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        id = VALUES(id),
        weakness_id = VALUES(weakness_id),
        uso = VALUES(uso),
        rationale = VALUES(rationale),
        comments = VALUES(comments),
        reasons = VALUES(reasons)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Mapping_Notes).")
    
    # Insert Mapping Suggestions in batches
    for i in range(0, len(mapping_suggestions), batch_size):
        batch = mapping_suggestions[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `mapping_suggestions` (mapping_notes_id, cwe_id, comment)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
        comment = VALUES(comment)
        ''', batch)

        #conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Mapping_Suggestions).")
    
    # Insert Functional Areas in batches
    for i in range(0, len(functional_areas), batch_size):
        batch = functional_areas[i:i + batch_size]
        cursor.executemany('''
        INSERT IGNORE INTO `functional_areas` (weakness_id, area)
        VALUES (%s, %s)
        ''', batch)
        
        #conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Functional_Areas).")

    # Insert Affected Resources in batches
    for i in range(0, len(affected_resources), batch_size):
        batch = affected_resources[i:i + batch_size]
        cursor.executemany('''
        INSERT IGNORE INTO `affected_resources` (weakness_id, affected_resource)
        VALUES (%s, %s)
        ''', batch)
        
        #conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Affected_Resources).")

    # Insert Weakness Ordinalities in batches
    for i in range(0, len(weakness_ordinalities), batch_size):
        batch = weakness_ordinalities[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `weakness_ordinalities` (weakness_id, ordinality, description)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
        description = VALUES(description)
        ''', batch)
        
        #conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Weakness_Ordinalities).")
    
    # Insert Taxonomy Mappings uno a uno (versión segura)
    for i in range(0, len(taxonomy_mapping), batch_size):
        batch = taxonomy_mapping[i:i + batch_size]

        for record in batch:
            try:
                cursor.execute('''
                    INSERT INTO Taxonomy_Mapping (weakness_id, taxonomy_name, entry_id, entry_name, mapping_fit)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        entry_id = VALUES(entry_id),
                        entry_name = VALUES(entry_name),
                        mapping_fit = VALUES(mapping_fit)
                ''', record)
                processed_items += 1

            except Exception as e:
                print("❌ Error al insertar en Taxonomy_Mapping:")
                print(f"Registro problemático: {record}")
                print(f"Error: {e}")
                raise

        conn.commit()
        print(f"Progreso: {processed_items}/{total_items} items procesados (Taxonomy_Mapping).")

    # Insert Demonstrative Examples in batches
    for i in range(0, len(demostrative_examples), batch_size):
        batch = demostrative_examples[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO `demonstrative_examples` (id, weakness_id, demostrative_id, title, intro, body, code, references_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        demostrative_id = VALUES(demostrative_id),
        title = VALUES(title),
        intro = VALUES(intro),
        body = VALUES(body),
        code = VALUES(code),
        references_url = VALUES(references_url)
        ''', batch)
        
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (Demonstrative_Examples).")

    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_or_create_cwe_db()
    
    # Download and extract the XML file
    xml_path = download_extract_cwe_data(URL)

    # Parse the XML file
    tree = ET.parse(xml_path)
    root = tree.getroot()
    try:
        # Extract data from the XML file
        cwe_items, external_references, references_externals_table, capec_references, languages, architectures, technologies, operating_systems, mitigations, alternate_terms, modes_of_introduction, related_weaknesses, detection_methods, observed_examples, consequences, backgroun_details, notes, mapping_notes, mapping_suggestions, functional_areas, affected_resources, weakness_ordinalities, taxonomy_mapping, demostrative_examples = transform_cwe_data(root)
        
        # Load the extracted data into the database
        load_data(cwe_items, external_references, references_externals_table, capec_references, languages, architectures, technologies, operating_systems, mitigations, alternate_terms, modes_of_introduction, related_weaknesses, detection_methods, observed_examples, consequences, backgroun_details, notes, mapping_notes, mapping_suggestions, functional_areas, affected_resources, weakness_ordinalities, taxonomy_mapping, demostrative_examples)

        print("🚀 Datos insertados en {DB_CWE} correctamente.")
    except Exception as e:
        print("❌ Error en la carga de datos:", e)
        # Si hay un error borrar la bbdd
        # conn = connect_db_cwe()
        # cursor = conn.cursor()
        # cursor.execute("DROP DATABASE cwe")
        # print("🗑️ Base de datos {DB_CWE} eliminada.")
        # conn.commit()
        # cursor.close()
        # conn.close()
    finally:
        os.remove(xml_path)
        print("🗑️ Archivos .zip y .xml eliminados correctamente.")
        print("🔚 Proceso de ETL finalizado.")