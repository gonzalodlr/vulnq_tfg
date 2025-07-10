/** @format */

// components/CVERecordMiniTemplate.tsx
"use client";

/**
 * Responsive table for CVE records showing minimal fields:
 * - cve_id
 * - severity
 * - score
 * - vendor / product (first pair, truncated)
 * - has_fix
 * - published_date
 */
import React from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Metrics } from "@/types/Metrics";
import { severityColor } from "@/lib/severityColor";
import { formatDate } from "@/lib/formDate";
import { IconBug } from "@tabler/icons-react";

export interface MiniCVERecord {
  cve_cve_id: string;
  cve_date_published: string;
  affectedProducts?: { vendor: string; name: string; version: string }[];
  solutions?: string[];
  metrics?: Metrics;
}

function pickScoreAndSeverity(metrics?: Metrics): {
  score?: number;
  severity?: string;
} {
  if (!metrics) return {};
  const order = ["CVSSV4", "CVSSV3_1", "CVSSV3", "CVSSV2"] as const;
  for (const key of order) {
    const score = metrics[`${key}_base_score` as keyof Metrics] as
      | number
      | undefined;
    const severity = metrics[`${key}_base_severity` as keyof Metrics] as
      | string
      | undefined;
    if (score !== undefined && severity) return { score, severity };
  }
  return {};
}

export default function CVERecordMiniTemplate({
  records,
}: {
  records: MiniCVERecord[];
}) {
  return (
    <div className="overflow-x-auto w-full mx-auto px-2">
      <Table className="min-w-[600px] mx-auto">
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead className="w-auto">Vulnerability</TableHead>
            <TableHead className="w-auto">Severity</TableHead>
            <TableHead className="w-auto">Score</TableHead>
            <TableHead className="min-w-[200px]">Vendor / Product</TableHead>
            <TableHead className="w-auto">Has fix</TableHead>
            <TableHead className="w-auto">Published</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const { score, severity } = pickScoreAndSeverity(record.metrics);
            const first = record.affectedProducts?.[0] ?? {
              vendor: "—",
              name: "",
            };
            const hasFix = Boolean(record.solutions && record.solutions.length);

            return (
              <TableRow
                key={record.cve_cve_id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() =>
                  (window.location.href = `/dashboard/vulnerability/${record.cve_cve_id}`)
                }
              >
                <TableCell className="w-1">
                  <Badge className="flex items-center gap-2 text-white bg-red-500">
                    <IconBug />
                  </Badge>
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {record.cve_cve_id}
                </TableCell>
                <TableCell>
                  {severity ? (
                    <Badge
                      className={`${
                        severityColor[
                          Array.isArray(severity)
                            ? severity.find((s) => s)?.toUpperCase()
                            : typeof severity === "string"
                            ? severity.toUpperCase()
                            : ""
                        ] ?? "bg-gray-400"
                      } text-white`}
                    >
                      {Array.isArray(severity)
                        ? severity.find((s) => s) || "—"
                        : severity}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {score !== undefined ? score : "—"}
                </TableCell>
                <TableCell>
                  <div className="max-w-[180px] overflow-hidden whitespace-nowrap text-ellipsis">
                    {first.vendor} / {first.name}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {hasFix ? "Yes" : "No"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(record.cve_date_published)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
