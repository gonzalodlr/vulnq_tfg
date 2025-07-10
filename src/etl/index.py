from src.config.db_config import connect_db_cve
import mysql.connector

# Consultas SQL separadas
procedimiento_sql = """
CREATE PROCEDURE create_index_if_needed(
    IN p_table  VARCHAR(64),
    IN p_index  VARCHAR(64),
    IN p_ddl    TEXT
)
BEGIN
    DECLARE idx_count INT;
    SELECT COUNT(*) INTO idx_count
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name   = p_table
      AND index_name   = p_index;

    IF idx_count = 0 THEN
        SET @stmt = p_ddl;
        PREPARE s FROM @stmt;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END
"""

llamadas_sql = [
    """
    CALL create_index_if_needed(
        'Container', 'idx_container_cve',
        'ALTER TABLE Container ADD INDEX idx_container_cve (cve_id, container_id)'
    )
    """,
    """
    CALL create_index_if_needed(
        'Exploits', 'idx_exploits_container',
        'ALTER TABLE Exploits ADD INDEX idx_exploits_container (container_id)'
    )
    """,
    """
    CALL create_index_if_needed(
        'CVE_References', 'idx_ref_container',
        'ALTER TABLE CVE_References ADD INDEX idx_ref_container (container_id, id)'
    )
    """,
    """
    CALL create_index_if_needed(
        'Affected_Product', 'idx_prod_container',
        'ALTER TABLE Affected_Product ADD INDEX idx_prod_container (container_id, product_id)'
    )
    """
]

eliminar_proc = "DROP PROCEDURE create_index_if_needed"

# Ejecución del script
try:
    conn = connect_db_cve()
    cursor = conn.cursor()

    print("Creando procedimiento...")
    cursor.execute(procedimiento_sql)

    for consulta in llamadas_sql:
        print(f"Ejecutando: {consulta.strip()[:50]}...")
        cursor.execute(consulta)

    print("Eliminando procedimiento...")
    cursor.execute(eliminar_proc)

    conn.commit()
    print("Índices creados correctamente.")

except mysql.connector.Error as err:
    print(f"Error: {err}")

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
