/**
 * Component to render CVSS metrics containers for CVSSv4, CVSSv3.1, CVSSv3 and CVSSv2
 * It conditionally renders each section only if the corresponding vector string exists.
 *
 * @format
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Metrics } from "@/types/Metrics";
import { Card, CardContent } from "@/components/ui/card";
import { severityColor } from "@/lib/severityColor";

export default function CvssMetricsContainer({
  metrics,
}: {
  metrics: Metrics;
}) {
  // Define the four CVSS versions we support
  const sections = [
    { key: "CVSSV4", label: "v4" },
    { key: "CVSSV3_1", label: "v3.1" },
    { key: "CVSSV3", label: "v3" },
    { key: "CVSSV2", label: "v2" },
  ];

  return (
    <>
      {sections.map(({ key, label }) => {
        const vectorKey = `${key}_vector_string` as keyof Metrics;
        const scoreKey = `${key}_base_score` as keyof Metrics;
        const sevKey = `${key}_base_severity` as keyof Metrics;
        const versionKey = `${key}_version` as keyof Metrics;

        const vector = metrics[vectorKey] as string | undefined;
        const score = metrics[scoreKey] as number | undefined;
        const severity = metrics[sevKey] as string | undefined;

        const version = metrics[versionKey] as string | undefined;
        if (!vector) return null;

        return (
          <section className="mb-8" key={key}>
            <h3 className="text-lg font-semibold mb-3">CVSS {label}</h3>
            <Card className="mb-8">
              <CardContent className="p-4 prose max-w-none">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium">Score</p>
                    <p className="text-2xl">{score}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Severity</p>
                    <Badge
                      className={`${
                        severityColor[
                          Array.isArray(severity)
                            ? severity.find((s) => s)?.toUpperCase()
                            : typeof severity === "string" && severity
                            ? severity.toUpperCase()
                            : ""
                        ] ?? "bg-gray-400"
                      } text-white`}
                    >
                      {Array.isArray(severity)
                        ? severity.find((s) => s) || "N/A"
                        : severity || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Version</p>
                    <p className="text-2xl">{version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Vector String</p>
                    <p className="font-mono text-xs break-all">{vector}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        );
      })}
    </>
  );
}
