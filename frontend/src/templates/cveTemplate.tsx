/** @format */

"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { Metrics } from "@/types/Metrics";
import CvssMetricsContainer from "@/templates/cveMetricContainer";
import { severityColor } from "@/lib/severityColor";
import { formatDate } from "@/lib/formDate";

export interface CVERecord {
  cve_cve_id?: string;
  cna_title?: string;
  adp_title?: string;
  cve_data_type?: string;
  cve_data_version?: string;
  cve_state?: string;
  cve_date_published?: string;
  cve_date_updated?: string;
  cve_assigner_short_name?: string;
  cve_base_severity?: string;
  cve_base_score?: number;
  container_container_type: string;
  container_container_id: string;
  descriptions: string[];
  affectedProducts: {
    vendor: string;
    name: string;
    version: string;
  }[];
  references: {
    url: string;
    name?: string;
    tags?: string[];
  }[];
  cwes: { id: string; description: string }[];
  capecs: { id: string; description: string }[];
  cpe: string[];

  // Campos de métricas
  metrics: Metrics;

  // De estos solo quiero sacar el value
  configurations: string[];
  workarounds: string[];
  solutions: string[];
  exploits: string[];
  timeline: string[];

  platforms: string[];
  modules: string[];
  programFiles: string[];
  programRoutines: string[];
  repos: string[];
}

export interface CVERecordTemplateProps {
  record: CVERecord | CVERecord[];
}

export default function CVERecordTemplate({ record }: any) {
  const rows = Array.isArray(record) ? record : [record];

  // Agrupar por contenedor
  const groupedByContainer = rows.reduce<Record<string, CVERecord[]>>(
    (acc, row) => {
      const containerType = (row.container_container_id ?? "unknown")
        .split("_")
        .slice(1)
        .join("_")
        .toUpperCase();
      if (!acc[containerType]) acc[containerType] = [];
      acc[containerType].push(row);
      return acc;
    },
    {}
  );

  const containerTypes = Object.keys(groupedByContainer);
  const [selectedContainer, setSelectedContainer] = useState<string>(
    containerTypes[0] || "unknown"
  );

  const selectedRows = groupedByContainer[selectedContainer] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-4 md:p-8"
    >
      {/* Selector de contenedor */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {rows[0]?.cve_cve_id ?? "Unknown CVE"}
        </h1>
        <div>
          <label htmlFor="container-select" className="font-medium mr-2">
            Container
          </label>
          <select
            id="container-select"
            value={selectedContainer}
            onChange={(e) => setSelectedContainer(e.target.value)}
            className="border rounded-md p-2"
          >
            {containerTypes.map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Información del contenedor seleccionado */}
      {selectedRows.length > 0 && (
        <>
          <section className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
            {/* Title And state*/}
            {selectedRows[0]?.cna_title || selectedRows[0]?.adp_title ? (
              <h2 className="text-xl mb-4 font-semibold">
                {selectedRows[0]?.cna_title ?? selectedRows[0]?.adp_title}
              </h2>
            ) : null}
            {/* State */}
            {selectedRows[0]?.cve_state && (
              <Badge className="mb-4">{selectedRows[0].cve_state}</Badge>
            )}
          </section>
          {/* Meta grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-8">
            <div>
              <p className="font-medium">Published</p>
              <p>{formatDate(selectedRows[0]?.cve_date_published)}</p>
            </div>
            <div>
              <p className="font-medium">Updated</p>
              <p>{formatDate(selectedRows[0]?.cve_date_updated)}</p>
            </div>
            {selectedRows[0]?.cve_assigner_short_name && (
              <div>
                <p className="font-medium">Assigner</p>
                <p>{selectedRows[0].cve_assigner_short_name}</p>
              </div>
            )}
            {selectedRows[0]?.cve_base_severity && (
              <div>
                <p className="font-medium">Severity</p>
                <p
                  className={`text-white px-2 py-1 rounded ${
                    severityColor[
                      (selectedRows[0].cve_base_severity ?? "").toUpperCase()
                    ] ?? "bg-gray-400"
                  }`}
                >
                  {selectedRows[0].cve_base_severity}
                </p>
              </div>
            )}
          </section>

          {/* Descripción */}
          {selectedRows[0]?.descriptions.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <Card className="mb-8">
                <CardContent className="p-4 prose max-w-none">
                  <ul className="list-disc pl-5">
                    {selectedRows[0].descriptions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Productos afectados */}
          {selectedRows[0]?.affectedProducts.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Affected Products</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Vendor</th>
                      <th className="text-left p-2 font-medium">Product</th>
                      <th className="text-left p-2 font-medium">Versions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRows[0].affectedProducts.map((p, i) => (
                      <tr key={i} className="border-t last:border-b">
                        <td className="p-2">{p.vendor}</td>
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.version}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* CVSS */}
          {selectedRows[0]?.metrics && (
            <CvssMetricsContainer metrics={selectedRows[0]?.metrics} />
          )}

          {/* CWE*/}
          {selectedRows[0].cwes.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">CWE</h3>
              <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRows[0].cwes.map((w, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <p className="font-semibold">{w.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {w.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </section>
            </section>
          )}

          {/* CAPEC */}
          {selectedRows[0].capecs.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">CAPEC</h3>
              <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRows[0].capecs.map((c, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <p className="font-semibold">{c.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {c.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </section>
            </section>
          )}

          {/* CPE */}
          {selectedRows[0].cpe.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">CPE</h3>
              <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRows[0].cpe.map((c, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <p className="font-semibold">{c}</p>
                    </CardContent>
                  </Card>
                ))}
              </section>
            </section>
          )}

          {/* configurations */}
          {selectedRows[0]?.configurations.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Configurations</h3>
              <Card className="mb-8">
                <CardContent className="p-4 prose max-w-none">
                  <ul className="list-disc pl-5">
                    {selectedRows[0].configurations.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* solutions */}
          {selectedRows[0]?.solutions.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Solutions</h3>
              <Card className="mb-8">
                <CardContent className="p-4 prose max-w-none">
                  <ul className="list-disc pl-5">
                    {selectedRows[0].solutions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Workarounds */}
          {selectedRows[0]?.workarounds?.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Workarounds</h3>
              <Card className="mb-8">
                <CardContent className="p-4 prose max-w-none">
                  <ul className="list-disc pl-5">
                    {selectedRows[0].workarounds.map((workaround, index) => (
                      <li key={index}>{workaround}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Exploits */}
          {selectedRows[0]?.exploits.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Exploits</h3>
              <Card className="mb-8">
                <CardContent className="p-4 prose max-w-none">
                  <ul className="list-disc pl-5">
                    {selectedRows[0].exploits.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Timeline */}
          {selectedRows[0]?.timeline.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Timeline</h3>
              <Card className="mb-8">
                <CardContent className="p-4 prose max-w-none">
                  <ul className="list-disc pl-5">
                    {selectedRows[0].timeline.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Referencias */}
          {selectedRows[0]?.references.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-3">References</h3>
              <ScrollArea className="h-48 rounded-md border">
                <ul className="divide-y">
                  {selectedRows[0].references.map((ref, i) => (
                    <li key={i} className="p-3 flex items-start gap-2">
                      <ExternalLink className="w-4 h-4 mt-1 shrink-0" />
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline break-all"
                      >
                        {ref.name || ref.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </section>
          )}
        </>
      )}

      <Separator />
      <footer className="text-xs text-muted-foreground mt-4">
        Generated&nbsp;{formatDate(new Date().toISOString())}
      </footer>
    </motion.div>
  );
}
