/** @format */
import {
  postAsset,
  getAssets,
  getAssetById,
  deleteAsset,
} from "@/services/assetsService";
import { IAsset } from "@/types/IAsset";

export async function createAsset(asset: IAsset) {
  await postAsset(asset);
}
export async function fetchAssets() {
  const assets: IAsset[] = await getAssets();
  return assets;
}
export async function fetchAssetById(id: string): Promise<IAsset | null> {
  const asset = await getAssetById(id);
  return asset;
}
export async function removeAsset(id: string) {
  await deleteAsset(id);
}
