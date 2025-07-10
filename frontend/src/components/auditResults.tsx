/** @format */

"use client";
import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { severityColor } from "@/lib/severityColor";
import {
  CvssMetric,
  ScanResultItem,
  ScanResultsProps,
} from "@/types/ScanResultsProps";

// -------------------------
// Helpers
// -------------------------
const extractMetric = (item: ScanResultItem): CvssMetric | undefined => {
  if (!item?.metrics) return undefined;
  // If metrics is a string, parse it
  const metrics = typeof item.metrics === "string" ? JSON.parse(item.metrics) : item.metrics;
  return metrics?.[0];
};

const getScore = (item: ScanResultItem) => {
  const score = extractMetric(item)?.base_score;
  return typeof score === "number" ? score : -1;
};

const clearString = (str: string | null | undefined): string => {
  if (!str) return "";
  try {
    // Try to parse as JSON array
    const arr = JSON.parse(str);
    if (Array.isArray(arr)) {
      // Filter out null/empty, join as string
      return arr.filter((v) => typeof v === "string" && v.trim()).join(", ");
    }
  } catch {
    // Not a JSON array, fallback
    return str.replace(/^\[|\]$/g, "").replace(/"/g, "").trim();
  }
  return "";
};


// -------------------------
// Component
// -------------------------
const ScanResults: React.FC<ScanResultsProps> = ({ results = [] }) => {
  // Quick overview counters by severity
  const summary = useMemo(
    () =>
      results.reduce<Record<string, number>>((acc, entry) => {
        const sevRaw = extractMetric(entry)?.base_severity || "UNKNOWN";
        const sev = sevRaw.toLowerCase();
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
      }, {}),
    [results]
  );

  // Filter state
  const [filter, setFilter] = useState<string | null>(null);

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
    let filtered = results;
    if (filter) {
      filtered = results.filter(
        (item) =>
          (extractMetric(item)?.base_severity || "UNKNOWN").toLowerCase() ===
          filter
      );
    }
    // Sort by score descending, null/undefined last
    return [...filtered].sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreA === -1 && scoreB === -1) return 0;
      if (scoreA === -1) return 1;
      if (scoreB === -1) return -1;
      return scoreB - scoreA;
    });
  }, [results, filter]);

  return (
    <div className="space-y-6">
      {/* Summary chips */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Results</h1>
        <Badge className="ml-2">{results.length}</Badge>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {Object.entries(summary).map(([sev, count]) => (
          <button
            key={sev}
            type="button"
            onClick={() => setFilter(filter === sev ? null : sev)}
            className={`focus:outline-none ${
              filter === sev ? "ring-2 ring-primary" : ""
            }`}
          >
            <Badge
              className={
                severityColor[sev.toUpperCase()] || severityColor.UNKNOWN
              }
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}: {count}
            </Badge>
          </button>
        ))}
        {filter && (
          <button
            type="button"
            onClick={() => setFilter(null)}
            className="ml-2 text-xs underline text-muted-foreground"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Detailed results */}
      {filteredResults.map((item) => {
        const metric = extractMetric(item);
        const severity = (metric?.base_severity || "UNKNOWN").toLowerCase();
        const score = metric?.base_score ?? "N/A";

        return (
          <Card key={item.cve_id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle
                  className="font-mono text-lg cursor-pointer hover:underline"
                  onClick={() =>
                    window.open(
                      `/dashboard/vulnerability/${item.cve_id}`,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  tabIndex={0}
                  role="button"
                  aria-label={`Open details for ${item.cve_id}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      window.open(
                        `/dashboard/vulnerability/${item.cve_id}`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }}
                >
                  {item.cve_id}
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  Asset:{" "}
                  <span className="font-semibold">
                    {item.asset?.name || "N/A"}
                  </span>
                  {" · "}
                  Software:{" "}
                  <span className="font-semibold">
                    {item.product_name || "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={
                    severityColor[severity.toUpperCase()] ||
                    severityColor.UNKNOWN
                  }
                >
                  {severity}
                </Badge>
                <span className="text-sm font-semibold">{score}</span>
              </div>
            </CardHeader>

            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="details">
                  <AccordionTrigger className="text-sm font-medium hover:text-primary transition-colors">
                    Show Details
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm px-2 py-2 md:px-4 md:py-3 bg-muted/40 rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-6 gap-2">
                      <div>
                        <span className="font-semibold">Published:</span>{" "}
                        <span className="text-muted-foreground">
                          {new Date(item.date_published).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Vendor / Product:</span>{" "}
                        <span className="text-muted-foreground">
                          {item.vendor} / {item.product_name}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">
                          Affected Versions:
                        </span>{" "}
                        <span className="text-muted-foreground">
                          &lt;{" "}
                          {item.less_than || item.less_than_or_equal || "N/A"}
                        </span>
                      </div>
                    </div>
                    {metric?.vector_string && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">CVSS Vector:</span>
                        <Badge
                          variant="secondary"
                          className="font-mono break-all"
                        >
                          {metric.vector_string}
                        </Badge>
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row md:gap-6 gap-2">
                      <div>
                        {item.cwe_ids &&
                        (Array.isArray(item.cwe_ids)
                          ? item.cwe_ids.length > 0
                          : !!item.cwe_ids) ? (
                          <span className="flex flex-wrap gap-1 mt-1">
                          {(Array.isArray(item.cwe_ids)
                            ? item.cwe_ids
                            : [item.cwe_ids]
                          ).map((cwe) => {
                            const cleanCwe = clearString(cwe);
                            return (
                            <a
                              key={cleanCwe}
                              href={`https://cwe.mitre.org/data/definitions/${cleanCwe.replace(
                              /^CWE-/,
                              ""
                              )}.html`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mb-1"
                            >
                              <Badge
                              variant="outline"
                              className="hover:bg-primary/10 transition-colors"
                              >
                              {cleanCwe}
                              </Badge>
                            </a>
                            );
                          })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div>
                        {item.capec_ids &&
                        (Array.isArray(item.capec_ids)
                          ? item.capec_ids.length > 0
                          : !!item.capec_ids) ? (
                          <span className="flex flex-wrap gap-1 mt-1">
                          {(Array.isArray(item.capec_ids)
                            ? item.capec_ids
                            : [item.capec_ids]
                          ).map((capec) => {
                            const cleanCapec = clearString(capec);
                            return (
                            <a
                              key={cleanCapec}
                              href={`https://capec.mitre.org/data/definitions/${cleanCapec.replace(
                              /^CAPEC-/,
                              ""
                              )}.html`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mb-1"
                            >
                              <Badge
                              variant="outline"
                              className="hover:bg-primary/10 transition-colors"
                              >
                              {cleanCapec}
                              </Badge>
                            </a>
                            );
                          })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div>
                        {item.cpe_ids &&
                        (Array.isArray(item.cpe_ids)
                          ? item.cpe_ids.length > 0
                          : !!item.cpe_ids) ? (
                          <span className="flex flex-wrap gap-1 mt-1">
                          {(Array.isArray(item.cpe_ids)
                            ? item.cpe_ids
                            : [item.cpe_ids]
                          ).map((cpe) => {
                            const cleanCpe = clearString(cpe);
                            return (
                            <a
                              key={cleanCpe}
                              href={`https://nvd.nist.gov/products/cpe/search/results?namingFormat=2.3&keyword=${encodeURIComponent(
                              cleanCpe
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mb-1"
                            >
                              <Badge
                              variant="outline"
                              className="hover:bg-primary/10 transition-colors"
                              >
                              {cleanCpe}
                              </Badge>
                            </a>
                            );
                          })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ScanResults;
