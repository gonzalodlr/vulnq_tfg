/** @format */

import { ICVEAssetReport } from "@/types/ICVEAssetReport";

export function getOpenIssuesByDate(
  vulnerabilities: ICVEAssetReport[]
): { date: string; value: number }[] {
  // Filter and map to ensure createdAt is a string
  const issues = vulnerabilities
    .filter(
      (issue: any): issue is { createdAt: string } =>
        typeof issue.createdAt === "string"
    )
    .map((issue) => ({ createdAt: issue.createdAt }));

  // Example: group by date and count occurrences
  const dateCount: Record<string, number> = {};
  issues.forEach((issue) => {
    const date = issue.createdAt ? issue.createdAt.split("T")[0] : "unknown";
    dateCount[date] = (dateCount[date] || 0) + 1;
  });

  return Object.entries(dateCount).map(([date, value]) => ({ date, value }));
}
