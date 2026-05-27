"use client";

import { useState } from "react";
import { 
  PieChart, Pie, BarChart, Bar, LineChart, Line, AreaChart, Area, 
  RadarChart, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, 
  AreaChart as AreaChartIcon, TrendingUp, Grid3x3
} from "lucide-react";

interface ChartData {
  name: string;
  value?: number;
  [key: string]: any;
}

interface ChartViewerProps {
  title: string;
  description?: string;
  data: ChartData[];
  dataKey?: string;
  xAxisDataKey?: string;
  color?: string;
  showLegend?: boolean;
}

type ChartType = "pie" | "bar" | "line" | "area" | "radar";

const CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: "pie", label: "Pie Chart", icon: <PieChartIcon className="w-4 h-4" /> },
  { type: "bar", label: "Bar Chart", icon: <BarChart3 className="w-4 h-4" /> },
  { type: "line", label: "Line Chart", icon: <LineChartIcon className="w-4 h-4" /> },
  { type: "area", label: "Area Chart", icon: <AreaChartIcon className="w-4 h-4" /> },
  { type: "radar", label: "Radar Chart", icon: <TrendingUp className="w-4 h-4" /> },
];

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6"
];

export default function ChartViewer({
  title,
  description,
  data,
  dataKey = "value",
  xAxisDataKey = "name",
  color = "#3b82f6",
  showLegend = true,
}: ChartViewerProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  const renderChart = () => {
    const chartProps = {
      width: 100,
      height: 300,
      data: data,
      margin: { top: 5, right: 30, left: 0, bottom: 5 },
    };

    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisDataKey} />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisDataKey} />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisDataKey} />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarAngleAxis dataKey={xAxisDataKey} />
              <PolarRadiusAxis />
              <Radar 
                name={dataKey} 
                dataKey={dataKey} 
                stroke={color}
                fill={color}
                fillOpacity={0.6}
              />
              <Tooltip />
              {showLegend && <Legend />}
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          {renderChart()}
        </div>

        {/* Chart Type Selector */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700">Pilih Tipe Visualisasi:</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {CHART_TYPES.map(({ type, label, icon }) => (
              <Button
                key={type}
                onClick={() => setChartType(type)}
                variant={chartType === type ? "default" : "outline"}
                className="flex flex-col items-center justify-center h-auto py-3 gap-1"
              >
                {icon}
                <span className="text-xs text-center">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Data Summary */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm font-semibold text-blue-900 mb-2">📊 Ringkasan Data</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Items</div>
              <div className="font-bold text-lg text-blue-600">{data.length}</div>
            </div>
            <div>
              <div className="text-gray-600">Total Value</div>
              <div className="font-bold text-lg text-blue-600">
                {data.reduce((sum, item) => sum + (item[dataKey] || 0), 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Rata-rata</div>
              <div className="font-bold text-lg text-blue-600">
                {(data.reduce((sum, item) => sum + (item[dataKey] || 0), 0) / data.length).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
