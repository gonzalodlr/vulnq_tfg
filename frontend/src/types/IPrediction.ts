/** @format */

export interface IPrediction {
  id: number;
  asset_id: string;
  year_month: string;
  total_kri: number;
  num_cves: number;
  avg_score: number;
  riesgo_mes_siguiente: number;
}
