/** @format */
import { Metrics } from "@/types/Metrics";
// Define los sub‐tipos que vas a renderizar
interface Product {
  vendor: string;
  name: string;
  version: string;
}
interface Provider {
  name: string;
  updated: string;
}
interface Reference {
  url: string;
  name?: string;
  tags?: string[];
}
interface CWE {
  id: string;
  description: string;
}
interface CAPEC {
  id: string;
  description: string;
}

// Extiende la interfaz CVERecord para incluir arrays
export interface CVERecord {
  // Campos principales
  cve_cve_id?: string;
  cna_title?: string;
  adp_title?: string;
  cve_data_type?: string;
  cve_data_version?: string;
  cve_state?: string;
  cve_date_published?: string;
  provider?: Provider;
  cve_date_updated?: string;
  cve_assigner_short_name?: string;
  cve_requester_user_id?: string;
  cve_base_severity?: string;
  cve_base_score?: number;
  container_container_type: string;
  container_container_id: string;
  // Campos contenedores
  descriptions: string[];
  affectedProducts: Product[];
  references: Reference[];
  cwes: CWE[];
  capecs: CAPEC[];
  cpe: string[];

  // Campos de métricas
  metrics: Metrics;

  // De estos solo quiero sacar el value
  configurations: string[];
  workarounds: string[];
  solutions: string[];
  exploits: string[];
  timeline: string[];

  platforms: string[];
  modules: string[];
  programFiles: string[];
  programRoutines: string[];
  repos: string[];
}

export function adaptCVERecords(raw: any[]): CVERecord[] {
  if (!Array.isArray(raw)) {
    console.error("Invalid data passed to adaptCVERecords:", raw);
    return [];
  }
  return raw.map((item: any) => {
    // 1. Descripciones (puede venir null o string único)
    const descriptions = item.descriptions_value
      ? Array.isArray(item.descriptions_value)
        ? item.descriptions_value.map((value: string) => value)
        : [item.descriptions_value]
      : [];

    // 2. Productos afectados (si hay arrays paralelos)
    const affectedProducts: Product[] = item.affected_product_product_name
      ? Array.isArray(item.affected_product_product_name)
        ? item.affected_product_product_name.map((name: string, i: number) => ({
            vendor: Array.isArray(item.affected_product_vendor)
              ? item.affected_product_vendor[i]
              : item.affected_product_vendor,
            name,
            version: Array.isArray(item.affected_version_affected_version)
              ? item.affected_version_affected_version[i]
              : item.affected_version_affected_version,
          }))
        : [
            {
              vendor: item.affected_product_vendor,
              name: item.affected_product_product_name,
              version: item.affected_version_affected_version,
            },
          ]
      : [];

    // 3. Referencias
    const references: Reference[] = item.cve_references_url
      ? Array.isArray(item.cve_references_url)
        ? item.cve_references_url.map((url: string, i: number) => ({
            url,
            name: Array.isArray(item.cve_references_name)
              ? item.cve_references_name[i]
              : item.cve_references_name,
            tags: Array.isArray(item.cve_references_tags)
              ? item.cve_references_tags[i]
              : item.cve_references_tags
              ? [item.cve_references_tags]
              : undefined,
          }))
        : [
            {
              url: item.cve_references_url,
              name: item.cve_references_name,
              tags: item.cve_references_tags
                ? [item.cve_references_tags]
                : undefined,
            },
          ]
      : [];

    // 4. CWEs
    const cwes: CWE[] = item.problem_type_description_cwe_id
      ? Array.isArray(item.problem_type_description_cwe_id) &&
        Array.isArray(item.problem_type_description_description)
        ? item.problem_type_description_cwe_id.map((id: string, i: number) => ({
            id,
            description: item.problem_type_description_description[i],
          }))
        : [
            {
              id: item.problem_type_description_cwe_id,
              description: item.problem_type_description_description,
            },
          ]
      : [];

    // 5. CAPECs
    const capecs: CAPEC[] = item.impact_capec_id
      ? Array.isArray(item.impact_capec_id) &&
        Array.isArray(item.impact_description_value)
        ? item.impact_capec_id.map((id: string, i: number) => ({
            id,
            description: item.impact_description_value[i],
          }))
        : [
            {
              id: item.impact_capec_id,
              description: item.impact_description_value,
            },
          ]
      : [];

    // 6. Metadatos del proveedor (si existen)
    const provider_metadata =
      item.provider_metadata_short_name && item.provider_metadata_date_updated
        ? {
            name: item.provider_metadata_short_name,
            updated: item.provider_metadata_date_updated,
          }
        : undefined;

    // 7. Otros campos que pueden ser arrays (si existen) pero solo hay que extraer el value
    const workarounds = item.workarounds_value
      ? Array.isArray(item.workarounds_value)
        ? item.workarounds_value.map((value: string) => value)
        : [item.workarounds_value]
      : [];
    const solutions = item.solutions_value
      ? Array.isArray(item.solutions_value)
        ? item.solutions_value.map((value: string) => value)
        : [item.solutions_value]
      : [];
    const exploits = item.exploits_value
      ? Array.isArray(item.exploits_value)
        ? item.exploits_value.map((value: string) => value)
        : [item.exploits_value]
      : [];
    const configurations = item.configurations_value
      ? Array.isArray(item.configurations_value)
        ? item.configurations_value.map((value: string) => value)
        : [item.configurations_value]
      : [];
    const timeline = item.timeline_value
      ? Array.isArray(item.timeline_value)
        ? item.timeline_value.map((value: string) => value)
        : [item.timeline_value]
      : [];

    // 8. Campos de métricas (si existen)
    const metrics: Metrics = {
      CVSSV4_version: item.CVSSV4_version,
      CVSSV4_vector_string: item.CVSSV4_vector_string,
      CVSSV4_base_score: item.CVSSV4_base_score,
      CVSSV4_base_severity: item.CVSSV4_base_severity,
      CVSSV3_1_version: item.CVSSV3_1_version,
      CVSSV3_1_vector_string: item.CVSSV3_1_vector_string,
      CVSSV3_1_base_score: item.CVSSV3_1_base_score,
      CVSSV3_1_base_severity: item.CVSSV3_1_base_severity,
      CVSSV3_version: item.CVSSV3_version,
      CVSSV3_vector_string: item.CVSSV3_vector_string,
      CVSSV3_base_score: item.CVSSV3_base_score,
      CVSSV3_base_severity: item.CVSSV3_base_severity,
      CVSSV2_version: item.CVSSV2_version,
      CVSSV2_vector_string: item.CVSSV2_vector_string,
      CVSSV2_base_score: item.CVSSV2_base_score,
      CVSSV2_base_severity: item.CVSSV2_base_severity,
    };

    // 9. Campos CPE (si existen)
    const cpe = item.affected_product_cpe_cpe23_item
      ? Array.isArray(item.affected_product_cpe_cpe23_item)
        ? item.affected_product_cpe_cpe23_item.map((value: string) => value)
        : [item.affected_product_cpe_cpe23_item]
      : [];

    // 10. Plataformas, módulos, archivos de programa y rutinas de programa (si existen)
    const platforms = item.platforms_platform
      ? Array.isArray(item.platforms_platform)
        ? item.platforms_platform.map((value: string) => value)
        : [item.platforms_platform]
      : [];

    const modules = item.modules_module
      ? Array.isArray(item.modules_module)
        ? item.modules_module.map((value: string) => value)
        : [item.modules_module]
      : [];

    const programFiles = item.program_files_file_path
      ? Array.isArray(item.program_files_file_path)
        ? item.program_files_file_path.map((value: string) => value)
        : [item.program_files_file_path]
      : [];

    const programRoutines = item.program_routines_routine
      ? Array.isArray(item.program_routines_routine)
        ? item.program_routines_routine.map((value: string) => value)
        : [item.program_routines_routine]
      : [];

    const repos = item.affected_product_repo
      ? Array.isArray(item.affected_product_repo)
        ? item.affected_product_repo.map((value: string) => value)
        : [item.affected_product_repo]
      : [];

    // 11. Campos otros (si existen)

    return {
      cve_cve_id: item.cve_cve_id,
      cna_title: item.cna_title,
      adp_title: item.adp_title,
      cve_data_type: item.cve_data_type,
      cve_requester_user_id: item.cve_requester_user_id,
      cve_data_version: item.cve_data_version,
      cve_state: item.cve_state,
      cve_date_published: item.cve_date_published,
      cve_date_updated: item.cve_date_updated,
      cve_assigner_short_name: item.cve_assigner_short_name,
      cve_base_severity: item.cve_base_severity,
      cve_base_score: item.cve_base_score,

      container_container_type: item.container_container_type,
      container_container_id: item.container_container_id,
      provider: provider_metadata,
      descriptions,
      affectedProducts,
      references,
      cwes,
      capecs,
      cpe,

      workarounds,
      solutions,
      exploits,
      configurations,
      timeline,
      metrics,
      platforms,
      modules,
      programFiles,
      programRoutines,
      repos,

      // ...y cualquier otro campo plano que quieras exponer directamente...
    };
  });
}
