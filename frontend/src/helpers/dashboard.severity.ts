/** @format */

import { ICVEAssetReport } from "@/types/ICVEAssetReport";

export function getSeveritySummary(
  vulnerabilities: ICVEAssetReport[]
): Record<string, number> {
  const severitySummary: Record<string, number> = {};

  for (const vuln of vulnerabilities) {
    const severity =
      vuln.full_json?.metrics?.[0]?.base_severity?.toLowerCase() || "unknown";
    severitySummary[severity] = (severitySummary[severity] || 0) + 1;
  }

  //return severitySummary;
  return {
    critical: severitySummary.critical || 0,
    high: severitySummary.high || 0,
    medium: severitySummary.medium || 0,
    low: severitySummary.low || 0,
    unknown: severitySummary.unknown || 0,
  };
}
