"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Stock, SectorSummary } from "@/types/stock";
import {
  calculateInvestment,
  calculatePresentValue,
  calculateGainLoss,
  calculateGainLossPercentage,
  calculatePortfolioPercentage,
} from "@/utils/portfolio";

interface StockTableProps {
  stocks: Stock[];
  sectorSummaries: SectorSummary[];
  totalInvestment: number;
  onRefresh: () => void;
}

const columnHelper = createColumnHelper<Stock>();

// Add this new function at the top level
const formatLastUpdated = (timestamp: string | undefined) => {
  if (!timestamp) return "N/A";
  try {
    // Create a new Date object and format it
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return "N/A";
  }
};

export function StockTable({
  stocks,
  sectorSummaries,
  totalInvestment,
  onRefresh,
}: StockTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "sector", desc: false },
  ]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Wrap the onRefresh callback to add visual feedback
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh();
    setLastRefreshTime(new Date());
    setIsRefreshing(false);
  }, [onRefresh]);

  // Auto-refresh every 15 minutes (900000 milliseconds)
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 900000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  // Define columns
  const columns = useMemo<ColumnDef<Stock, any>[]>(
    () => [
      columnHelper.accessor("sector", {
        header: "Sector",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("name", {
        header: "Stock",
        cell: (info) => (
          <div>
            <div className='font-medium'>{info.getValue()}</div>
            <div className='text-xs text-muted-foreground'>
              {info.row.original.ticker}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("exchange", {
        header: "Exchange",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("purchasePrice", {
        header: ({ column }) => (
          <div className='flex items-center'>
            Purchase Price
            <button
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className='ml-1'
            >
              <ArrowUpDown className='h-4 w-4' />
            </button>
          </div>
        ),
        cell: (info) => `₹${info.getValue().toLocaleString("en-IN")}`,
      }),
      columnHelper.accessor("quantity", {
        header: "Quantity",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor((row) => calculateInvestment(row), {
        id: "investment",
        header: ({ column }) => (
          <div className='flex items-center'>
            Investment
            <button
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className='ml-1'
            >
              <ArrowUpDown className='h-4 w-4' />
            </button>
          </div>
        ),
        cell: (info) => `₹${info.getValue().toLocaleString("en-IN")}`,
      }),
      columnHelper.accessor(
        (row) => calculatePortfolioPercentage(row, totalInvestment),
        {
          id: "portfolioPercentage",
          header: "Portfolio %",
          cell: (info) => `${info.getValue().toFixed(2)}%`,
        }
      ),
      columnHelper.accessor("currentPrice", {
        header: ({ column }) => (
          <div className='flex items-center'>
            Current Price
            <button
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className='ml-1'
            >
              <ArrowUpDown className='h-4 w-4' />
            </button>
          </div>
        ),
        cell: (info) => (
          <div>
            <div>₹{info.getValue().toLocaleString("en-IN")}</div>
            <div
              className={`text-xs ${
                (info.row.original.dayChangePercent ?? 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {(info.row.original.dayChangePercent ?? 0) >= 0 ? "↑" : "↓"}
              {Math.abs(info.row.original.dayChangePercent ?? 0).toFixed(2)}%
            </div>
          </div>
        ),
      }),
      columnHelper.accessor((row) => calculatePresentValue(row), {
        id: "presentValue",
        header: ({ column }) => (
          <div className='flex items-center'>
            Present Value
            <button
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className='ml-1'
            >
              <ArrowUpDown className='h-4 w-4' />
            </button>
          </div>
        ),
        cell: (info) => `₹${info.getValue().toLocaleString("en-IN")}`,
      }),
      columnHelper.accessor((row) => calculateGainLoss(row), {
        id: "gainLoss",
        header: ({ column }) => (
          <div className='flex items-center'>
            Gain/Loss
            <button
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className='ml-1'
            >
              <ArrowUpDown className='h-4 w-4' />
            </button>
          </div>
        ),
        cell: (info) => {
          const value = info.getValue();
          const percentage = calculateGainLossPercentage(info.row.original);

          return (
            <div className={value >= 0 ? "positive" : "negative"}>
              <div className='flex items-center'>
                {value >= 0 ? (
                  <ArrowUp className='mr-1 h-3 w-3' />
                ) : (
                  <ArrowDown className='mr-1 h-3 w-3' />
                )}
                ₹{Math.abs(value).toLocaleString("en-IN")}
              </div>
              <div className='text-xs'>
                {percentage >= 0 ? "+" : ""}
                {percentage.toFixed(2)}%
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("marketCap", {
        header: "Market Cap",
        cell: (info) => {
          const value = info.getValue();
          if (!value) return "-";
          return `₹${(value / 1e9).toFixed(2)}B`;
        },
      }),
      columnHelper.accessor("volume", {
        header: "Volume",
        cell: (info) => {
          const value = info.getValue();
          if (!value) return "-";
          return value.toLocaleString("en-IN");
        },
      }),
      columnHelper.accessor("peRatio", {
        header: "P/E Ratio",
        cell: (info) => {
          const value = info.getValue();
          return value != null ? value.toFixed(2) : "-";
        },
      }),
      columnHelper.accessor("yearHigh", {
        header: "52W High",
        cell: (info) => {
          const value = info.getValue();
          return value ? `₹${value.toLocaleString("en-IN")}` : "-";
        },
      }),
      columnHelper.accessor("yearLow", {
        header: "52W Low",
        cell: (info) => {
          const value = info.getValue();
          return value ? `₹${value.toLocaleString("en-IN")}` : "-";
        },
      }),
    ],
    [totalInvestment]
  );

  // Create table instance
  const table = useReactTable({
    data: stocks,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getRowCanExpand: () => true,
  });

  // Create a map of sector summaries for easy lookup
  const sectorSummaryMap = sectorSummaries.reduce((acc, summary) => {
    acc[summary.sector] = summary;
    return acc;
  }, {} as Record<string, SectorSummary>);

  // Group stocks by sector
  const stocksBySectorGrouped = stocks.reduce((acc, stock) => {
    if (!acc[stock.sector]) {
      acc[stock.sector] = [];
    }
    acc[stock.sector].push(stock);
    return acc;
  }, {} as Record<string, Stock[]>);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium text-gray-100'>Stock Holdings</h3>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <div
              className={`h-2 w-2 rounded-full ${
                isRefreshing ? "bg-green-500 animate-pulse" : "bg-gray-600"
              }`}
            />
            <div className='text-sm text-gray-400'>
              Last refresh: {lastRefreshTime.toLocaleTimeString()}
            </div>
          </div>
          <div className='text-sm text-gray-400'>
            Auto-updates every 15 minutes
          </div>
          <button
            onClick={handleRefresh}
            className={`text-sm text-emerald-400 hover:text-emerald-300 ${
              isRefreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Now"}
          </button>
        </div>
      </div>

      <div className='relative rounded-lg bg-gray-800 p-4 shadow-xl'>
        {isRefreshing && (
          <div className='absolute inset-0 bg-gray-800/50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm'>
            <div className='text-sm text-gray-300 animate-pulse'>
              Updating stock data...
            </div>
          </div>
        )}

        <div className='table-container overflow-x-auto'>
          <table className='w-full border-collapse text-sm text-gray-300'>
            <thead>
              <tr className='border-b border-gray-700'>
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className='px-4 py-3 text-left font-medium text-gray-400'
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {Object.entries(stocksBySectorGrouped).map(
                ([sector, sectorStocks]) => {
                  const sectorSummary = sectorSummaryMap[sector];
                  const lastUpdated = formatLastUpdated(
                    sectorStocks[0]?.lastUpdated
                  );

                  return (
                    <React.Fragment key={sector}>
                      <tr className='bg-gray-900/50'>
                        <td colSpan={12} className='px-4 py-2'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <span className='font-medium text-gray-200'>
                                {sector}
                              </span>
                              <span className='ml-2 text-xs text-gray-500'>
                                ({sectorStocks.length} stocks)
                              </span>
                            </div>
                            {/* <div className='text-xs text-gray-500'>
                              Last updated: {lastUpdated}
                            </div> */}
                          </div>
                        </td>
                      </tr>
                      {sectorStocks.map((stock) => (
                        <tr
                          key={stock.id}
                          className='border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors'
                        >
                          <td>{stock.sector}</td>
                          <td>
                            <div>
                              <div className='font-medium'>{stock.name}</div>
                              <div className='text-xs text-muted-foreground'>
                                {stock.ticker}
                              </div>
                            </div>
                          </td>
                          <td>{stock.exchange}</td>
                          <td>
                            ₹{stock.purchasePrice.toLocaleString("en-IN")}
                          </td>
                          <td>{stock.quantity}</td>
                          <td>
                            ₹
                            {calculateInvestment(stock).toLocaleString("en-IN")}
                          </td>
                          <td>
                            {calculatePortfolioPercentage(
                              stock,
                              totalInvestment
                            ).toFixed(2)}
                            %
                          </td>
                          <td>
                            <div>
                              <div>
                                ₹{stock.currentPrice.toLocaleString("en-IN")}
                              </div>
                              <div
                                className={`text-xs ${
                                  (stock.dayChangePercent ?? 0) >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {(stock.dayChangePercent ?? 0) >= 0 ? "↑" : "↓"}
                                {Math.abs(stock.dayChangePercent ?? 0).toFixed(
                                  2
                                )}
                                %
                              </div>
                            </div>
                          </td>
                          <td>
                            ₹
                            {calculatePresentValue(stock).toLocaleString(
                              "en-IN"
                            )}
                          </td>
                          <td>
                            {(() => {
                              const value = calculateGainLoss(stock);
                              const percentage =
                                calculateGainLossPercentage(stock);

                              return (
                                <div
                                  className={
                                    value >= 0 ? "positive" : "negative"
                                  }
                                >
                                  <div className='flex items-center'>
                                    {value >= 0 ? (
                                      <ArrowUp className='mr-1 h-3 w-3' />
                                    ) : (
                                      <ArrowDown className='mr-1 h-3 w-3' />
                                    )}
                                    ₹{Math.abs(value).toLocaleString("en-IN")}
                                  </div>
                                  <div className='text-xs'>
                                    {percentage >= 0 ? "+" : ""}
                                    {percentage.toFixed(2)}%
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td>
                            {typeof stock.marketCap === "number"
                              ? `₹${(stock.marketCap / 1e9).toFixed(2)}B`
                              : "-"}
                          </td>
                          <td>
                            {typeof stock.volume === "number"
                              ? stock.volume.toLocaleString("en-IN")
                              : "-"}
                          </td>
                          <td>
                            {typeof stock.peRatio === "number"
                              ? stock.peRatio.toFixed(2)
                              : "-"}
                          </td>
                          <td>
                            {typeof stock.yearHigh === "number"
                              ? `₹${stock.yearHigh.toLocaleString("en-IN")}`
                              : "-"}
                          </td>
                          <td>
                            {typeof stock.yearLow === "number"
                              ? `₹${stock.yearLow.toLocaleString("en-IN")}`
                              : "-"}
                          </td>
                        </tr>
                      ))}

                      <tr className='bg-gray-900/30 border-t border-gray-700'>
                        <td colSpan={5} className='px-4 py-2'>
                          <div className='pl-4 text-gray-400'>Sector Total</div>
                        </td>
                        <td>
                          ₹
                          {sectorSummary.totalInvestment.toLocaleString(
                            "en-IN"
                          )}
                        </td>
                        <td>
                          {sectorSummary.percentageOfPortfolio.toFixed(2)}%
                        </td>
                        <td></td>
                        <td>
                          ₹{sectorSummary.presentValue.toLocaleString("en-IN")}
                        </td>
                        <td
                          className={
                            sectorSummary.gainLoss >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          <div className='flex items-center'>
                            {sectorSummary.gainLoss >= 0 ? (
                              <ArrowUp className='mr-1 h-3 w-3' />
                            ) : (
                              <ArrowDown className='mr-1 h-3 w-3' />
                            )}
                            ₹
                            {Math.abs(sectorSummary.gainLoss).toLocaleString(
                              "en-IN"
                            )}
                          </div>
                          <div className='text-xs'>
                            {sectorSummary.gainLoss >= 0 ? "+" : ""}
                            {(
                              (sectorSummary.gainLoss /
                                sectorSummary.totalInvestment) *
                              100
                            ).toFixed(2)}
                            %
                          </div>
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </React.Fragment>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
