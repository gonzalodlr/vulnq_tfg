/** @format */

import { IAsset } from "./IAsset";

export interface CvssMetric {
  version: string;
  base_score: number;
  base_severity: string; // e.g. "CRITICAL", "HIGH", ...
  vector_string: string;
}

export interface ScanResultItem {
  cve_id: string;
  date_published: string; // ISO date string
  vendor: string;
  product_name: string;
  asset: IAsset;
  affected_version: string;
  less_than: string | null;
  less_than_or_equal: string | null;
  metrics: CvssMetric[];
  cwe_ids: string[];
  capec_ids: string[];
  cpe_ids: string[];
}

export interface ScanResultsProps {
  results?: ScanResultItem[];
}
