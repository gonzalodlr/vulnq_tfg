/** @format */

import { ICVEAssetReport } from "@/types/ICVEAssetReport";
import { IAsset } from "@/types/IAsset";

export function getTopAssets(
  vulnerabilities: ICVEAssetReport[],
  assets: IAsset[]
): { asset: IAsset; name: string; count: number }[] {
  return assets
    .map((asset) => ({
      asset,
      name: asset.name,
      count: vulnerabilities.filter(
        (vuln) =>
          vuln.full_json &&
          vuln.full_json.asset &&
          vuln.full_json.asset.id === asset.id
      ).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 assets
}
