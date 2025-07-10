/** @format */

"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { IPrediction } from "@/types/IPrediction";
import { IAsset } from "@/types/IAsset";

// Helpers
function getNextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  let year = y;
  let month = m + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getPreviousMonths(latest: string, count: number): string[] {
  const [y, m] = latest.split("-").map(Number);
  const months = [];
  let year = y;
  let month = m;
  for (let i = count; i > 0; i--) {
    month--;
    if (month <= 0) {
      month = 12;
      year--;
    }
    months.unshift(`${year}-${String(month).padStart(2, "0")}`);
  }
  return months;
}

function prepareChartData(data: IPrediction[]) {
  const scores: Record<string, number> = {};
  const predictions: Record<string, number> = {};

  for (const d of data) {
    if (d.year_month) {
      scores[d.year_month] = d.avg_score;
      const next = getNextMonth(d.year_month);
      predictions[next] = d.riesgo_mes_siguiente;
    }
  }

  const allMonths = Object.keys(scores);
  if (allMonths.length === 0) return [];

  const lastScoreMonth = allMonths.sort().at(-1)!;
  const previous = getPreviousMonths(lastScoreMonth, 4);
  const future = getNextMonth(lastScoreMonth);
  const range = [...previous, lastScoreMonth, future];

  return range.map((month) => ({
    year_month: month,
    avg_score: month === future ? null : scores[month] ?? 0,
    predicted_risk: predictions[month] ?? 0,
  }));
}

export const RiskLineChart: React.FC<{
  data: IPrediction[];
  assetId: string;
}> = ({ data, assetId }) => {
  const filtered = data.filter((d) => d.asset_id === assetId);
  const aligned = prepareChartData(filtered);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-sm">Risk Evolution</CardTitle>
        <CardDescription className="text-sm text-muted-foreground text-center">
          Real Risk vs Predicted Risk Next-Month
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64 w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={aligned}
            // Custom formatter for legend and tooltip
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year_month" />
            <YAxis domain={[0, 10]} />
            <Tooltip
              formatter={(value: any, name: string) =>
                name === "avg_score"
                  ? [value, "Real Risk"]
                  : name === "predicted_risk"
                  ? [value, "Predicted Risk"]
                  : [value, name]
              }
            />
            <Legend
              formatter={(value: string) =>
                value === "avg_score"
                  ? "Real Risk"
                  : value === "predicted_risk"
                  ? "Predicted Risk"
                  : value
              }
            />
            <Line
              type="monotone"
              dataKey="avg_score"
              name="Real Risk"
              stroke="#22c55e" // verde
              strokeWidth={2}
              dot
            />
            <Line
              type="monotone"
              dataKey="predicted_risk"
              name="Predicted Risk"
              stroke="#ff0000"
              strokeDasharray="5 3"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const RiskAreaChart: React.FC<{
  data: IPrediction[];
  assetId: string;
}> = ({ data, assetId }) => {
  const filtered = data.filter((d) => d.asset_id === assetId);
  const aligned = prepareChartData(filtered);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-sm">Risk Evolution</CardTitle>
        <CardDescription className="text-sm text-muted-foreground text-center">
          Real Risk vs Predicted Risk Next-Month
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={aligned}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year_month" />
            <YAxis domain={[0, 10]} />
            <Tooltip
              formatter={(value: any, name: string) =>
                name === "avg_score"
                  ? [value, "Real Risk"]
                  : name === "predicted_risk"
                  ? [value, "Predicted Risk"]
                  : [value, name]
              }
            />
            <Legend
              formatter={(value: string) =>
                value === "avg_score"
                  ? "Real Risk"
                  : value === "predicted_risk"
                  ? "Predicted Risk"
                  : value
              }
            />
            <Area
              type="monotone"
              dataKey="avg_score"
              name="Real Risk"
              stroke="#22c55e" // verde
              fill="#22c55e"
              fillOpacity={0.2}
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="predicted_risk"
              name="Predicted Risk"
              stroke="#ff0000"
              fill="#ff0000"
              fillOpacity={0.15}
              strokeDasharray="5 3"
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Generic bar chart component
export const BarRiskChart: React.FC<{ data: IPrediction[] }> = ({ data }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>CVEs vs Total KRI (0-10)</CardTitle>
      <CardDescription>Number of CVEs vs total KRI per month</CardDescription>
    </CardHeader>
    <CardContent className="h-64">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year_month" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Bar dataKey="num_cves" name="# CVEs" />
          <Bar dataKey="total_kri" name="Total KRI" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// Pie chart with needle showing avg_score on a 0–10 gauge
const RADIAN = Math.PI / 180;
const createNeedle = (
  value: number,
  cx: number,
  cy: number,
  iR: number,
  oR: number,
  total: number,
  color: string
) => {
  const ang = 180 * (1 - value / total);
  const length = (iR + oR) / 2;
  const sin = Math.sin(-RADIAN * ang);
  const cos = Math.cos(-RADIAN * ang);
  const x0 = cx;
  const y0 = cy;
  const xp = x0 + length * cos;
  const yp = y0 + length * sin;
  return [
    <circle key="center" cx={x0} cy={y0} r={4} fill={color} stroke="none" />,
    <path
      key="needle"
      d={`M${x0} ${y0} L${xp} ${yp}`}
      stroke={color}
      strokeWidth={2}
    />,
  ];
};

export const PieChartWithNeedle: React.FC<{
  value: number;
  title?: string;
  footer: string;
}> = ({ value, title, footer }) => {
  // define static segments for thresholds
  const segments = [
    { name: "Low", value: 2.5, color: "#00ff00" },
    { name: "Medium", value: 2.5, color: "#ffff00" },
    { name: "High", value: 2.5, color: "#ffa500" },
    { name: "Critical", value: 2.5, color: "#ff0000" },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card className="w-full h-full bg-transparent shadow-none flex flex-col">
      <CardHeader className="text-center py-1 flex-none">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>

      <CardContent
        className={`
          flex-initial              /* shrinkable según contenido */
          flex justify-center items-center p-0
          [&_svg]:max-w-full        /* SVG nunca más ancho que el contenedor */
          [&_svg]:max-h-full        /* SVG nunca más alto que el contenedor */
          [&_svg]:h-auto            /* altura proporcional */
        `}
      >
        <PieChart width={180} height={90}>
          <Pie
            startAngle={180}
            endAngle={0}
            data={segments}
            cx={90}
            cy={80}
            innerRadius={36}
            outerRadius={60}
            dataKey="value"
            stroke="none"
          >
            {segments.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>

          {createNeedle(value, 90, 80, 36, 60, total, "#000000")}
        </PieChart>
      </CardContent>

      <CardFooter className="flex-none flex flex-col items-center justify-center gap-1 py-1">
        <span className="text-2xl font-bold">{value.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">{footer}</span>
      </CardFooter>
    </Card>
  );
};

// Global table for all assets
export const GlobalRiskTable: React.FC<{
  data: IPrediction[];
  assets: IAsset[];
}> = ({ data, assets }) => (
  <Card className="w-full h-full">
    <CardHeader className="text-center items-center">
      <CardTitle className="text-sm">All Assets Risk Table</CardTitle>
      <CardDescription className="text-xs text-muted-foreground">
        Metrics overview for every asset and month
      </CardDescription>
    </CardHeader>
    <CardContent className="w-full overflow-x-auto">
      <table className="w-full min-w-[600px] table-auto text-sm break-words">
        <thead>
          <tr>
            <th className="text-center px-2 py-1">Asset</th>
            <th className="text-center px-2 py-1">Month</th>
            <th className="text-center px-2 py-1">Total KRI</th>
            <th className="text-center px-2 py-1">Total CVEs</th>
            <th className="text-center px-2 py-1">Avg Score</th>
            <th className="text-center px-2 py-1">Predicted Risk</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td className="text-center px-2 py-1">
                {assets.find((a) => a.id === row.asset_id)?.name ||
                  row.asset_id}
              </td>
              <td className="text-center px-2 py-1">{row.year_month}</td>
              <td className="text-center px-2 py-1">{row.total_kri}</td>
              <td className="text-center px-2 py-1">{row.num_cves}</td>
              <td className="text-center px-2 py-1">{row.avg_score}</td>
              <td className="text-center px-2 py-1">
                {row.riesgo_mes_siguiente}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);
