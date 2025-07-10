/** @format */

import { IAsset } from "@/types/IAsset";

export interface CvssMetric {
  version: string;
  base_score: number;
  base_severity: string;
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
  cwe_ids: string[] | null;
  capec_ids: string[] | null;
  cpe_ids: string[] | null;
}

export interface ScanResultsProps {
  results?: ScanResultItem[];
}
