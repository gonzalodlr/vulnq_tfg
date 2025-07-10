/** @format */

import {
  getCves,
  getCveById,
  deleteCve,
  getPredictionsByAssetId,
  deletePrediction,
  getPredictions,
} from "@/services/cveService";
import { IAsset } from "@/types/IAsset";
import { ICVEAssetReport } from "@/types/ICVEAssetReport";
import { IPrediction } from "@/types/IPrediction";

export async function fetchCves() {
  const cves: ICVEAssetReport[] = await getCves();
  return cves;
}
export async function fetchCveById(
  id: string
): Promise<ICVEAssetReport | null> {
  const cve = await getCveById(id);
  return cve;
}
export async function removeCve(id: string) {
  await deleteCve(id);
}

export async function fetchPredictionsByAssetId(
  id: string
): Promise<IPrediction[]> {
  const predictions: IPrediction[] = await getPredictionsByAssetId(id);
  return predictions;
}

export async function fetchPredictions(assets: IAsset[]) {
  const ids: string[] = assets.map((asset) => asset.id);
  const predictions: IPrediction[] = await getPredictions(ids);
  return predictions;
}
export async function removePrediction(id: string) {
  await deletePrediction(id);
}
