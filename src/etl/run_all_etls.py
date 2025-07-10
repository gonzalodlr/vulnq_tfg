import subprocess
import logging
from datetime import datetime

# Configurar logging
log_filename = f"etl_run_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    filename=f"src/logs/{log_filename}",
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

scripts = [
    "src.etl.cve_ETL",
    "src.etl.cwe_ETL",
    "src.etl.capec_ETL",
    "src.etl.cpe_ETL"
]

def run_script(script):
    logging.info(f"---- Ejecutando {script} ----")
    try:
        result = subprocess.run(["python", "-m", script], capture_output=True, text=True)
        logging.info(f"STDOUT de {script}:\n{result.stdout}")
        if result.stderr:
            logging.warning(f"STDERR de {script}:\n{result.stderr}")
        if result.returncode != 0:
            logging.error(f"{script} finalizó con errores. Código de salida: {result.returncode}")
        else:
            logging.info(f"{script} finalizó correctamente.")
    except Exception as e:
        logging.exception(f"Error al ejecutar {script}: {e}")

def run_all_etls():
    logging.info("=== INICIO DE EJECUCIÓN ETL ===")
    for script in scripts:
        run_script(script)
    logging.info("=== FIN DE EJECUCIÓN ETL ===")

if __name__ == "__main__":
    run_all_etls()
