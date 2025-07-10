import hashlib
import pickle
import requests
import zipfile
import os
import xml.etree.ElementTree as ET
from src.config.db_config import connect_db_cpe, DB_CPE, create_db
import io

URL = 'https://nvd.nist.gov/feeds/xml/cpe/dictionary/official-cpe-dictionary_v2.3.xml.zip'
TEMP_FILE = 'temp_cpe.pkl'

# Define namespaces
namespaces = {
    '': 'http://cpe.mitre.org/dictionary/2.0',
    'cpe-23': 'http://scap.nist.gov/schema/cpe-extension/2.3',
    'meta': 'http://scap.nist.gov/schema/cpe-dictionary-metadata/0.2'
}

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

def generate_hash(object):
    return hashlib.md5(object.encode()).hexdigest()

def download_extract_cpe_data(url, filename='cpe.xml', destino='.'):
    """
    Descarga un ZIP desde una URL, extrae el archivo XML y lo guarda como 'cpe.xml'.

    Parámetros:
    url (str): URL del archivo ZIP a descargar.
    filename (str): Nombre con el que se guardará el archivo XML extraído.
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
            xml_file = next((name for name in zip_ref.namelist() if name.endswith('.xml')), None)

            if xml_file:
                # Extraer y renombrar
                zip_ref.extract(xml_file, destino)
                original_path = os.path.join(destino, xml_file)
                final_path = os.path.join(destino, filename)
                # Eliminar el archivo de destino si ya existe
                if os.path.exists(final_path):
                    os.remove(final_path)
                os.rename(original_path, final_path)
                print(f"Archivo XML extraído como: {final_path}")
                return final_path
            else:
                print("No se encontró ningún archivo XML en el ZIP.")
                return None
    except Exception as e:
        print(f"Error al descargar o extraer: {e}")
        return None

def check_or_create_cpe_db():
    conn = create_db()
    cursor = conn.cursor()

    # Verificar si la base de datos ya existe
    cursor.execute("SHOW DATABASES")
    databases = [db[0] for db in cursor.fetchall()]

    if DB_CPE not in databases:
        print("La base de datos {DB_CPE} no existe. Creándola ahora...")
        cursor.execute("CREATE DATABASE {DB_CPE}")

        # Conectarse a la base de datos recién creada
        conn.database = DB_CPE

        # Crear tablas
        with open('BBDD/BBDD_cpe.sql', 'r') as sql_file:
            sql_script = sql_file.read()
        
        sql_statements = sql_script.split(';')
        for statement in sql_statements:
            if statement.strip():
                cursor.execute(statement)
        
        print("✅ Base de datos {DB_CPE} creada con éxito.")
        conn.commit()

        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print("📋 Tablas en la base de datos:")
        for table in tables:
            print(table[0])

        print("✅ Tablas creadas con éxito en {DB_CPE}.")
        conn.commit()
    else:
        print("✅ La base de datos {DB_CPE} ya existe. Verificando tablas...")

        # Conectarse a la base de datos existente
        conn.database = DB_CPE

        # Comprobar si existen las tablas necesarias
        cursor.execute("SHOW TABLES")
        existing_tables = set(row[0] for row in cursor.fetchall())

        # Puedes ajustar esta lista según las tablas que necesitas
        required_tables = {"cpe", "cpe_references", "cpe23_data"}

        if not required_tables.issubset(existing_tables):
            print("Algunas tablas no existen. Creándolas ahora...")

            with open('BBDD/BBDD_cpe.sql', 'r') as sql_file:
                sql_script = sql_file.read()
            
            sql_statements = sql_script.split(';')
            for statement in sql_statements:
                if statement.strip():
                    cursor.execute(statement)
            
            print("✅ Tablas creadas con éxito en {DB_CPE}.")
            conn.commit()
        else:
            print("✅ Todas las tablas necesarias existen. Continuando con el proceso de ETL...")

def transform_cpe_data(root):
    # Extract CPE items
    cpe_items = []
    references = []
    cpe23_data = []

    data = root.findall('{http://cpe.mitre.org/dictionary/2.0}cpe-item')

    for cpe_item in data:
        cpe_name = cpe_item.get('name')
        cpe_id = generate_hash(cpe_name)
        
        title_elem = cpe_item.find('{http://cpe.mitre.org/dictionary/2.0}title')
        title = title_elem.text if title_elem is not None else None

        deprecated = cpe_item.get('deprecated')
        if deprecated == 'true':
            deprecated = True
        else:
            deprecated = False

        deprecation_date = cpe_item.get('deprecation_date')[:10] if deprecated and cpe_item.get('deprecation_date') else None
        cpe23_item = cpe_item.find('cpe-23:cpe23-item', namespaces) if cpe_item.find('cpe-23:cpe23-item', namespaces) is not None else None
        cpe23_name = cpe23_item.get('name')
        cpe23_id = generate_hash(cpe23_name) if cpe23_item is not None else None

        cpe_items.append((cpe_id, cpe_name, title, deprecated, deprecation_date))
        
        # Extract references
        for idx, ref in enumerate(cpe_item.findall('references/reference', namespaces), start=1):
            ref_id = generate_hash(f"{cpe_id}_{idx}")
            ref_text = ref.text if ref.text is not None else None
            references.append((ref_id, cpe_id, ref.get('href'), ref_text))

        # Extract additional data from cpe23-item if deprecated
        if deprecated and cpe23_item is not None:
            deprecated_date = cpe23_item.find('cpe-23:deprecation', namespaces).get('date')[:10] if cpe23_item.find('cpe-23:deprecation', namespaces) is not None and cpe23_item.find('cpe-23:deprecation', namespaces).get('date') else None
            deprecation_element = cpe23_item.find('cpe-23:deprecation', namespaces)
            deprecated_by = deprecation_element.find('cpe-23:deprecated-by', namespaces).get('name') if deprecation_element is not None and deprecation_element.find('cpe-23:deprecated-by', namespaces) is not None else None
            deprecated_by_type = deprecation_element.find('cpe-23:deprecated-by', namespaces).get('type') if deprecation_element is not None and deprecation_element.find('cpe-23:deprecated-by', namespaces) is not None else None
            cpe23_data.append((cpe23_id, cpe23_name, cpe_id, deprecated_date, deprecated_by, deprecated_by_type))

    return cpe_items, references, cpe23_data

def load_cpe_data(cpe_items, references, cpe23_data, batch_size=10000):
    # Connect to database
    conn = connect_db_cpe()
    cursor = conn.cursor()

    # Insert data into the tables with progress printing
    total_items = len(cpe_items) + len(references) + len(cpe23_data)
    processed_items = 0

    print(f"Total items cpes: {len(cpe_items)}")
    print(f"Total items references: {len(references)}")
    print(f"Total items cpe23_data: {len(cpe23_data)}")
    print(f"Total items to process: {total_items}")

    # Insert cpe_items in batches
    for i in range(0, len(cpe_items), batch_size):
        batch = cpe_items[i:i + batch_size]

        cursor.executemany('''
        INSERT INTO cpe (cpe_id, cpe_name, title, deprecated, deprecation_date)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        deprecated = VALUES(deprecated),
        deprecation_date = VALUES(deprecation_date)
        ''', batch)
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (cpe_items).")

    # Insert references in batches
    for i in range(0, len(references), batch_size):
        batch = references[i:i + batch_size]

        cursor.executemany('''
        INSERT INTO `cpe_references` (ref_id, cpe_id, reference_url, reference_text)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        reference_url = VALUES(reference_url),
        reference_text = VALUES(reference_text)
        ''', batch)
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (references).")

    # Insert cpe23_data in batches
    for i in range(0, len(cpe23_data), batch_size):
        batch = cpe23_data[i:i + batch_size]
        cursor.executemany('''
        INSERT INTO cpe23_data (cpe23_id, cpe23_name, cpe_id, deprecated_date, deprecated_by, deprecated_by_type)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        cpe_id = VALUES(cpe_id),
        deprecated_date = VALUES(deprecated_date),
        deprecated_by = VALUES(deprecated_by),
        deprecated_by_type = VALUES(deprecated_by_type)
        ''', batch)
        conn.commit()
        processed_items += len(batch)
        print(f"Progreso: {processed_items}/{total_items} items procesados (cpe23_data).")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("🔄 Iniciando el proceso de ETL...")

    check_or_create_cpe_db()
    
    try:
        # Verificar si hay datos procesados guardados
        if os.path.exists(TEMP_FILE):
            print(f"♻️ Archivo temporal encontrado: {TEMP_FILE}. Cargando datos procesados...")
            cpe_items, references, cpe23_data = load_processed_data(TEMP_FILE)
            print("✅ Datos procesados cargados correctamente.")
        else:
            # Download and extract the XML file
            xml_path = download_extract_cpe_data(URL)
            # Parse the XML file
            tree = ET.parse(xml_path)
            root = tree.getroot()
            # Transform data from the XML file
            cpe_items, references, cpe23_data = transform_cpe_data(root)

        load_cpe_data(cpe_items, references, cpe23_data)
        print("🚀 Datos insertados en {DB_CPE} correctamente.")

        if os.path.exists(TEMP_FILE):
            os.remove(TEMP_FILE)
    except Exception as e:
        print("❌ Error en la carga de datos:", e)
        save_processed_data(TEMP_FILE, (cpe_items, references, cpe23_data))
        print(f"♻️ Datos procesados guardados en {TEMP_FILE}. Puedes recuperarlos más tarde.")
    finally:
        os.remove(xml_path)
        print("🗑️ Archivos .zip y .xml eliminados correctamente.")
        print("🔚 Proceso de ETL finalizado.")