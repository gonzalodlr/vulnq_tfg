/** @format */

import { ICVEAssetReport } from "@/types/ICVEAssetReport";

export type TopVulnerability = {
  id: string;
  count: number;
};

export function getTopVulnerabilities(
  vulnerabilities: ICVEAssetReport[]
): TopVulnerability[] {
  return vulnerabilities
    .slice()
    .sort((a, b) => {
      const scoreA = a.full_json?.metrics?.[0]?.base_score ?? -1;
      const scoreB = b.full_json?.metrics?.[0]?.base_score ?? -1;
      return scoreB - scoreA;
    })
    .slice(0, 5)
    .map((vuln) => ({
      id: vuln.cve_id,
      count: vuln.full_json?.metrics?.[0]?.base_score ?? 0,
    }));
}
