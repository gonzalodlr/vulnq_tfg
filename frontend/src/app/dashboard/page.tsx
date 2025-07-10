/** @format */

// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  LineChart,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { fetchAssets } from "@/controllers/assetsController";
import { IAsset } from "@/types/IAsset";
import { ICVEAssetReport } from "@/types/ICVEAssetReport";
import {
  fetchCves,
  fetchPredictionsByAssetId,
  fetchPredictions,
} from "@/controllers/cveController";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSeveritySummary } from "@/helpers/dashboard.severity";
import { getTopVulnerabilities } from "@/helpers/dashboard.topVulnerabilities";
import { getOpenIssuesByDate } from "@/helpers/dashboard.openIssues";
import { getTopAssets } from "@/helpers/dashboard.topAssets";
import {
  PieChartWithNeedle,
  GlobalRiskTable,
  RiskAreaChart,
} from "@/components/dashboard/graphics/RiskCharts";
import { IPrediction } from "@/types/IPrediction";
import { createNotification } from "@/controllers/notificationController";
import { ISoftware } from "@/types/ISoftware";
import { fetchSoftwares } from "@/controllers/softwaresController";

const RANGE_OPTIONS = ["5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"]; // Ensure these values match the logic in filterOpenIssues

const DashboardPage: React.FC = () => {
  const [range, setRange] = useState<string>("5D");
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [softwares, setSoftwares] = useState<ISoftware[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<ICVEAssetReport[]>([]);
  const [riskAssets, setRiskAssets] = useState<IPrediction[]>([]);
  const [predictions, setPredictions] = useState<IPrediction[]>([]);
  const [selectedTopAsset, setSelectedTopAsset] = useState<IAsset | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchAssetsData = async () => {
      const assetsData = await fetchAssets();
      setAssets(assetsData);

      // Notificaciones inteligentes
      if (assetsData.length === 0) {
        await createNotification({
          id: crypto.randomUUID(),
          userId: crypto.randomUUID(), // Replace with actual user ID from context or session
          type: "info",
          message: "No assets found. Please create one.",
          code: "no-assets",
          category: "asset",
          read: false,
        });
        return;
      }
    };

    const fetchVulnerabilitiesData = async () => {
      const vuln = await fetchCves();
      setVulnerabilities(vuln);

      if (vuln.length === 0) {
        await createNotification({
          userId: crypto.randomUUID(),
          type: "info",
          message: "Add software sub-assets to start scanning.",
          code: "no-subassets",
          category: "subasset",
          id: crypto.randomUUID(),
          read: false,
        });
      }
    };

    const fetchSoftwaresData = async () => {
      // Fetch all software for the current tenant/user
      const softwaresData = await fetchSoftwares();
      setSoftwares(softwaresData);

      if (softwares.length === 0) {
        await createNotification({
          userId: crypto.randomUUID(), // Replace with actual user ID from context or session
          type: "info",
          message: "No software found. Please add some.",
          code: "no-software",
          category: "subasset",
          id: crypto.randomUUID(),
          read: false,
        });
      }
    };
    fetchAssetsData();
    fetchSoftwaresData();
    fetchVulnerabilitiesData();
  }, []);
  // SEVERITY CHART
  const severitySummary = getSeveritySummary(vulnerabilities);
  // Prepare data for donut chart
  const severityData = [
    {
      name: "Critical",
      value: severitySummary.critical,
      color: "#ff4d4f",
    },
    { name: "High", value: severitySummary.high, color: "#fa8c16" },
    { name: "Medium", value: severitySummary.medium, color: "#fadb14" },
    { name: "Low", value: severitySummary.low, color: "#52c41a" },
    { name: "Unknown", value: severitySummary.unknown ?? 0, color: "#a3a3a3" },
  ];

  // TOP VULNERABILITIES CHARTS
  const topVulnerabilities = getTopVulnerabilities(vulnerabilities);

  // OPEN ISSUES CHART
  const openIssuesData = getOpenIssuesByDate(vulnerabilities);
  const totalIssues = severityData.reduce((sum, d) => sum + d.value, 0);
  const openIssues = [
    { date: "2025-05-01", value: 22 },
    { date: "2025-05-02", value: 25 },
    { date: "2025-05-03", value: 30 },
    { date: "2025-05-04", value: 35 },
    { date: "2025-05-05", value: 53 },
    { date: "2025-05-06", value: 40 },
    { date: "2025-05-07", value: 45 },
    { date: "2025-05-08", value: 50 },
    { date: "2025-05-09", value: 55 },
    { date: "2025-05-10", value: 45 },
    { date: "2025-05-11", value: 60 },
    { date: "2025-05-12", value: 65 },
    { date: "2025-05-13", value: 70 },
    { date: "2025-05-14", value: 75 },
    { date: "2025-05-15", value: 80 },
    { date: "2025-05-16", value: 70 },
    { date: "2025-05-17", value: 60 },
    { date: "2025-05-18", value: 50 },
    { date: "2025-05-19", value: 40 },
    { date: "2025-05-20", value: 20 },
    { date: "2025-05-21", value: 25 },
    { date: "2025-05-22", value: 30 },
    { date: "2025-05-23", value: 35 },
    { date: "2025-05-24", value: 40 },
    { date: "2025-05-25", value: 10 },
    { date: "2025-05-26", value: 15 },
    { date: "2025-05-27", value: 20 },
    { date: "2025-05-28", value: 25 },
    { date: "2025-05-29", value: 30 },
    { date: "2025-05-30", value: 100 },
  ];
  // Filter openIssues based on selected range
  const filterOpenIssues = () => {
    const arr = openIssuesData;
    switch (range) {
      case "1D":
        return arr.slice(-1);
      case "5D":
        return arr.slice(-5);
      case "1M":
        return arr; // assume full month
      default:
        return arr;
    }
  };
  const chartData = filterOpenIssues();

  // Prepare data for top assets and software charts
  const topAssets = getTopAssets(vulnerabilities, assets);
  useEffect(() => {
    const fetchPredictionsData = async () => {
      const predictionsData = await fetchPredictions(assets);
      setPredictions(predictionsData);

      if (predictionsData.length >= 0) {
        await createNotification({
          userId: crypto.randomUUID(),
          type: "risk",
          message: "New risks detected. Review now.",
          code: `risks-detected`,
          category: "vuln",
          id: crypto.randomUUID(),
          read: false,
        });
        if (predictionsData.some((p) => p.avg_score > 6)) {
          await createNotification({
            userId: crypto.randomUUID(),
            type: "risk",
            message: "High risk detected: Prediction score above 6.",
            code: "high-risk-detected",
            category: "vuln",
            id: crypto.randomUUID(),
            read: false,
          });
        }
      }
    };
    fetchPredictionsData();
  }, [assets]);

  useEffect(() => {
    const fetchRiskAssetsData = async () => {
      if (selectedTopAsset) {
        const risks = await fetchPredictionsByAssetId(selectedTopAsset.id);
        setRiskAssets(risks);
        console.log("Selected asset:", selectedTopAsset);
        console.log("Risk assets data:", risks);
      }
    };
    fetchRiskAssetsData();
  }, [selectedTopAsset]);

  useEffect(() => {
    if (topAssets.length > 0 && !selectedTopAsset) {
      setSelectedTopAsset(topAssets[0].asset);
    }
  }, [topAssets, selectedTopAsset]);

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full px-4 py-6">
      {/* Overall grid layout */}
      <div className="w-full max-w-full grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* 1 Vulnerabilities by Severity */}
        <Card className="@container/card w-full max-w-full">
          <CardHeader className="items-center pb-0">
            <CardTitle className="text-center">
              Vulnerability Issues by Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="flex flex-col md:flex-row items-center md:space-x-4">
                <div className="relative w-32 h-32 md:w-48 md:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={60}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {severityData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
                    {totalIssues}
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  {severityData.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center space-x-2"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="font-medium">{entry.value}</span>
                      <span className="text-sm text-muted-foreground">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2️⃣ Top Vulnerabilities Found */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-sm">
              Top Vulnerabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              {topVulnerabilities && topVulnerabilities.length > 0 ? (
                <BarChart
                  data={topVulnerabilities}
                  layout="vertical"
                  barSize={12}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="id"
                    width={100}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No vulnerabilities found.
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3️⃣ Top Assets with Most Vulnerabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-sm">
              Top Risky Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              {topAssets && topAssets.length > 0 ? (
                <BarChart
                  data={topAssets}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No assets found.
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4️⃣ Vulnerability Open Issues with Range Selector (spans 2 cols on xl) */}
        {/* "Vulnerability Open Issues" ahora ocupa 1 columna */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-center text-sm">
              Vulnerability Open Issues
            </CardTitle>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {RANGE_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  size="sm"
                  variant={opt === range ? "default" : "outline"}
                  onClick={() => {
                    if (RANGE_OPTIONS.includes(opt)) {
                      setRange(opt);
                    }
                  }}
                  className={`px-4 py-2 ${
                    opt === range ? "font-bold" : "font-normal"
                  }`}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1890ff"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* "Asset Risk Overview" ahora ocupa 2 columnas */}
        {selectedTopAsset && riskAssets && (
          <>
            <Card className="xl:col-span-2 w-full">
              <CardHeader className="text-center py-2">
                <CardTitle className="text-sm">Asset Risk Overview</CardTitle>
                <div className="flex justify-center mt-1">
                  <Select
                    value={selectedTopAsset.id}
                    onValueChange={(id) => {
                      const asset = assets.find((a) => a.id === id);
                      setSelectedTopAsset(asset);
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {topAssets.map((a) => (
                        <SelectItem key={a.asset.id} value={a.asset.id}>
                          {a.asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col items-center space-y-4 p-4">
                {/* Total Vulnerabilities */}
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">
                    Total Vulnerabilities
                  </span>
                  <span className="text-3xl font-bold text-red-600">
                    {topAssets.find((a) => a.asset.id === selectedTopAsset.id)
                      ?.count ?? 0}
                  </span>
                </div>

                {/* grid de dos columnas responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 w-full gap-6 justify-items-center">
                  {/* Avg. Score */}
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    <div
                      className="
            w-full
            sm:max-w-[240px]     /* Móvil y sm = 240px */
            md:max-w-[280px]     /* md+ = 280px de ancho */
            lg:max-w-[320px]     /* lg+ = 320px de ancho */
            aspect-square        /* Móvil: cuadrado 1:1 */
            md:aspect-[4/5]      /* md+: ratio 4/5 → altura = ancho / (4/5) = 1.25×ancho */
          "
                    >
                      <PieChartWithNeedle
                        value={
                          riskAssets.length > 0
                            ? riskAssets[riskAssets.length - 1].avg_score
                            : 0
                        }
                        footer="Real Risk Mean"
                        title="Mean Score Found"
                      />
                    </div>
                  </div>

                  {/* Total KRI */}
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    <div
                      className="
            w-full
            sm:max-w-[240px]
            md:max-w-[280px]
            lg:max-w-[320px]
            aspect-square
            md:aspect-[4/5]
          "
                    >
                      <PieChartWithNeedle
                        value={
                          riskAssets.length > 0
                            ? riskAssets[riskAssets.length - 1].total_kri
                            : 0
                        }
                        footer="Total KRI"
                        title="Calculated Risk"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. Prediction graphic */}
            {riskAssets && riskAssets.length > 0 && (
              <div className="col-span-full w-full max-w-full">
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[320px]">
                    <RiskAreaChart
                      data={riskAssets}
                      assetId={selectedTopAsset.id}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 7. Global Risk Table */}
        {predictions && predictions.length > 0 && (
          <div className="col-span-full max-w-full overflow-x-auto">
            <div className="w-full overflow-x-auto">
              <GlobalRiskTable data={predictions} assets={assets} />
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default DashboardPage;
