"use client";

import type { Stock } from "@/types/stock";
import { calculateGainLossPercentage } from "@/utils/portfolio";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PerformanceChartProps {
  stocks: Stock[];
}

export function PerformanceChart({ stocks }: PerformanceChartProps) {
  // Sort stocks by gain/loss percentage
  const sortedStocks = [...stocks].sort(
    (a, b) => calculateGainLossPercentage(b) - calculateGainLossPercentage(a)
  );

  // Take top 5 and bottom 5 performers
  const topPerformers = sortedStocks.slice(0, 5);
  const bottomPerformers = sortedStocks.slice(-5).reverse();

  // Prepare data for the chart
  const data = [...topPerformers, ...bottomPerformers].map((stock) => {
    const percentage = calculateGainLossPercentage(stock);
    return {
      name: stock.ticker,
      fullName: stock.name,
      value: Number.parseFloat(percentage.toFixed(2)),
      color: percentage >= 0 ? "#10B981" : "#EF4444",
    };
  });

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const stock = data.find((item) => item.name === label);
      return (
        <div className='bg-gray-800 p-3 border border-gray-700 rounded shadow-xl'>
          <p className='font-medium text-gray-200'>{stock?.fullName}</p>
          <p className='text-sm text-gray-400'>
            Return:{" "}
            <span
              className={
                payload[0].value >= 0 ? "text-green-400" : "text-red-400"
              }
            >
              {payload[0].value}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-xl'>
      <h3 className='mb-4 text-lg font-medium text-gray-100'>
        Top & Bottom Performers
      </h3>
      <div className='h-[300px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={data}
            layout='vertical'
            margin={{ top: 5, right: 120, left: 100, bottom: 5 }}
            barCategoryGap={12}
          >
            <CartesianGrid
              strokeDasharray='3 3'
              horizontal={false}
              stroke='#374151'
              opacity={0.5}
            />
            <XAxis
              type='number'
              domain={["dataMin - 1", "dataMax + 1"]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              axisLine={{ stroke: "#4B5563" }}
              tickLine={{ stroke: "#4B5563" }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              type='category'
              dataKey='name'
              width={90}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={{ stroke: "#4B5563" }}
              tickLine={{ stroke: "#4B5563" }}
              tickFormatter={(value) =>
                value.length > 6 ? `${value.slice(0, 6)}...` : value
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#1F2937", opacity: 0.2 }}
            />
            <Bar
              dataKey='value'
              radius={[0, 4, 4, 0]}
              barSize={14}
              minPointSize={2}
              label={{
                position: "right",
                formatter: (value: number) => `${value}%`,
                fill: "#9CA3AF",
                fontSize: 11,
                dx: 8,
                dy: 0,
                className: "bar-label",
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
