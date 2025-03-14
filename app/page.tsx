"use client";

import { useState, useEffect, useCallback } from "react";
import type { Stock, PortfolioSummary, SectorSummary } from "@/types/stock";
import {
  calculatePortfolioSummary,
  calculateSectorSummaries,
} from "@/utils/portfolio";
import { Header } from "@/components/header";
import { StockTable } from "@/components/stock-table";
import { PortfolioAllocationChart } from "@/components/portfolio-allocation-chart";
import { PerformanceChart } from "@/components/performance-chart";
import { ErrorState } from "@/components/error-state";

export default function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectorSummaries, setSectorSummaries] = useState<SectorSummary[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    totalInvestment: 0,
    totalValue: 0,
    totalGainLoss: 0,
    totalGainLossPercentage: 0,
    sectorCount: 0,
    stockCount: 0,
  });

  const fetchStocks = useCallback(async () => {
    try {
      const response = await fetch("/api/stock/stocks");
      console.log("API Response:", response);

      if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      }

      const data = await response.json();
      console.log("Parsed Data:", data);
      setStocks(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Update portfolio summary and sector summaries when stocks change
  useEffect(() => {
    if (stocks.length) {
      const newPortfolioSummary = calculatePortfolioSummary(stocks);
      setPortfolioSummary(newPortfolioSummary);

      const newSectorSummaries = calculateSectorSummaries(
        stocks,
        newPortfolioSummary.totalInvestment
      );
      setSectorSummaries(newSectorSummaries);
    } else {
      setPortfolioSummary({
        totalInvestment: 0,
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        sectorCount: 0,
        stockCount: 0,
      });
      setSectorSummaries([]);
    }
  }, [stocks]);

  // Handle data changes from StockTable
  const handleDataChange = useCallback(
    (data: {
      stocks: Stock[];
      sectorSummaries: SectorSummary[];
      totalInvestment: number;
    }) => {
      setStocks(data.stocks);
      setSectorSummaries(data.sectorSummaries);
      setPortfolioSummary((prev) => ({
        ...prev,
        totalInvestment: data.totalInvestment,
      }));
    },
    []
  );

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-900 to-gray-800'>
      <div className='container py-6 text-gray-100'>
        <Header summary={portfolioSummary} />

        {isLoading ? (
          <div className='grid gap-6'>
            <div className='h-[400px] animate-pulse rounded-lg bg-gray-800'></div>
            <div className='grid gap-6 md:grid-cols-2'>
              <div className='h-[300px] animate-pulse rounded-lg bg-gray-800'></div>
              <div className='h-[300px] animate-pulse rounded-lg bg-gray-800'></div>
            </div>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStocks} />
        ) : (
          <div className='grid gap-6'>
            <StockTable
              stocks={stocks}
              sectorSummaries={sectorSummaries}
              totalInvestment={portfolioSummary.totalInvestment}
              onRefresh={fetchStocks}
              onDataChange={handleDataChange}
            />

            <div className='grid gap-6 md:grid-cols-2'>
              <PortfolioAllocationChart sectorSummaries={sectorSummaries} />
              <PerformanceChart stocks={stocks} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
