"use client";

import type { SectorSummary } from "@/types/stock";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface PortfolioAllocationChartProps {
  sectorSummaries: SectorSummary[];
}

export function PortfolioAllocationChart({
  sectorSummaries,
}: PortfolioAllocationChartProps) {
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-gray-800 p-3 border border-gray-700 rounded shadow-xl'>
          <p className='font-medium text-gray-200'>{payload[0].name}</p>
          <p className='text-sm text-gray-400'>
            Allocation:{" "}
            <span className='text-emerald-400'>
              {payload[0].value.toFixed(2)}%
            </span>
          </p>
          <p className='text-sm text-gray-400'>
            Value:{" "}
            <span className='text-emerald-400'>
              ₹{payload[0].payload.actualValue.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Prepare data for the chart
  const data = sectorSummaries.map((sector) => ({
    name: sector.sector,
    value: Number(sector.percentageOfPortfolio.toFixed(2)),
    actualValue: sector.presentValue,
  }));

  // Custom colors for sectors - expanded color palette
  const COLORS = [
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#6366F1", // Indigo
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#F43F5E", // Rose
    "#F97316", // Orange
    "#EAB308", // Yellow
    "#14B8A6", // Teal
    "#06B6D4", // Cyan
    "#A855F7", // Violet
    "#EF4444", // Red
  ];

  return (
    <div className='rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-xl'>
      <h3 className='mb-4 text-lg font-medium text-gray-100'>
        Portfolio Allocation
      </h3>
      <div className='h-[300px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={data}
              cx='50%'
              cy='50%'
              labelLine={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                value,
                name,
              }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    fill='#9CA3AF'
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline='central'
                    fontSize={11}
                  >
                    {value > 5 ? `${name} (${value}%)` : ""}
                  </text>
                );
              }}
              outerRadius={100}
              fill='#8884d8'
              dataKey='value'
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.8}
                  stroke='#1F2937'
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className='mt-4 grid grid-cols-2 gap-2'>
        {data.map((item, index) => (
          <div key={item.name} className='flex items-center gap-2'>
            <div
              className='h-3 w-3 rounded'
              style={{
                backgroundColor: COLORS[index % COLORS.length],
                opacity: 0.8,
              }}
            />
            <span className='text-gray-300'>{item.name}</span>
            <span className='text-gray-400'>({item.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
