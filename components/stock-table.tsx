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

// First, define column widths at the top of the file
const columnWidths = {
  sector: "8%",
  name: "12%",
  exchange: "6%",
  purchasePrice: "8%",
  quantity: "6%",
  investment: "8%",
  portfolioPercentage: "6%",
  currentPrice: "8%",
  presentValue: "8%",
  gainLoss: "10%",
  marketCap: "6%",
  volume: "6%",
  peRatio: "4%",
  yearHigh: "7%",
  yearLow: "7%",
};

// Add this interface for quantity updates
interface QuantityUpdate {
  stockId: string;
  newQuantity: number;
}

export function StockTable({
  stocks,
  sectorSummaries,
  totalInvestment,
  onRefresh,
}: StockTableProps) {
  // Move the state declarations inside the component
  const [editableQuantities, setEditableQuantities] = useState<
    Record<string, number>
  >({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "sector", desc: false },
  ]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add these functions inside the component as well
  const handleQuantityChange = (stockId: string, newQuantity: number) => {
    setEditableQuantities((prev) => ({
      ...prev,
      [stockId]: newQuantity,
    }));
  };

  const saveQuantityChange = (stock: Stock) => {
    const newQuantity = editableQuantities[stock.id] || stock.quantity;
    setIsEditing((prev) => ({ ...prev, [stock.id]: false }));
    onRefresh();
  };

  // Improve refresh functionality to handle dynamic updates
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Increase refresh frequency to 5 minutes for more dynamic updates
  useEffect(() => {
    handleRefresh(); // Initial load
    const interval = setInterval(handleRefresh, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [handleRefresh]);

  // Move this function before the columns definition
  const getCurrentQuantity = useCallback(
    (item: Stock | SectorSummary) => {
      if ("id" in item) {
        // Check if it's a Stock
        return editableQuantities[item.id] || item.quantity;
      }
      return item.quantity || 0; // For SectorSummary
    },
    [editableQuantities]
  );

  // Optimize columns definition
  const columns = useMemo<ColumnDef<Stock, any>[]>(
    () => [
      columnHelper.accessor("sector", {
        header: "Sector",
        cell: (info) => (
          <div className='text-center font-medium text-gray-200'>
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("name", {
        header: "Stock",
        cell: (info) => (
          <div className='text-center whitespace-nowrap'>
            <div className='font-medium'>{info.getValue()}</div>
            <div className='text-xs text-muted-foreground'>
              {info.row.original.ticker}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("exchange", {
        header: "Exchange",
        cell: (info) => <div className='text-center'>{info.getValue()}</div>,
      }),
      columnHelper.accessor("purchasePrice", {
        header: "Purchase Price",
        cell: (info) => (
          <div className='text-center'>
            ₹{info.getValue().toLocaleString("en-IN")}
          </div>
        ),
      }),
      columnHelper.accessor("quantity", {
        header: "Quantity",
        cell: (info) => {
          const stock = info.row.original;
          const isEditingThis = isEditing[stock.id] || false;
          const currentQuantity =
            editableQuantities[stock.id] || stock.quantity;

          return (
            <div className='text-center whitespace-nowrap'>
              {isEditingThis ? (
                <div className='flex items-center justify-center gap-1'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(
                        stock.id,
                        Math.max(0, currentQuantity - 1)
                      );
                    }}
                    className='px-2 py-0.5 text-xs bg-gray-600 hover:bg-gray-700 rounded'
                  >
                    -
                  </button>
                  <input
                    type='number'
                    value={currentQuantity}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(
                        stock.id,
                        Math.max(0, parseInt(e.target.value) || 0)
                      );
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className='w-16 px-1 py-0.5 text-center bg-gray-700 border border-gray-600 rounded'
                    min='0'
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(stock.id, currentQuantity + 1);
                    }}
                    className='px-2 py-0.5 text-xs bg-gray-600 hover:bg-gray-700 rounded'
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveQuantityChange(stock);
                    }}
                    className='px-2 py-0.5 text-xs bg-emerald-600 hover:bg-emerald-700 rounded'
                  >
                    ✓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing((prev) => ({ ...prev, [stock.id]: false }));
                      setEditableQuantities((prev) => ({
                        ...prev,
                        [stock.id]: stock.quantity,
                      }));
                    }}
                    className='px-2 py-0.5 text-xs bg-red-600 hover:bg-red-700 rounded'
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing((prev) => ({ ...prev, [stock.id]: true }));
                  }}
                  className='cursor-pointer hover:bg-gray-700 rounded px-2 py-1'
                >
                  {currentQuantity}
                  <span className='ml-1 text-xs text-gray-400'>✎</span>
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor(
        (row) => calculateInvestment(row, getCurrentQuantity(row)),
        {
          id: "investment",
          header: "Investment",
          cell: (info) => (
            <div className='text-center'>
              ₹{info.getValue().toLocaleString("en-IN")}
            </div>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => calculatePortfolioPercentage(row, totalInvestment),
        {
          id: "portfolioPercentage",
          header: "Portfolio %",
          cell: (info) => (
            <div className='text-center'>{info.getValue().toFixed(2)}%</div>
          ),
        }
      ),
      columnHelper.accessor("currentPrice", {
        header: "Current Price",
        cell: (info) => (
          <div className='text-center'>
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
      columnHelper.accessor(
        (row) => calculatePresentValue(row, getCurrentQuantity(row)),
        {
          id: "presentValue",
          header: "Present Value",
          cell: (info) => (
            <div className='text-center'>
              ₹{info.getValue().toLocaleString("en-IN")}
            </div>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => calculateGainLoss(row, getCurrentQuantity(row)),
        {
          id: "gainLoss",
          header: "Gain/Loss",
          cell: (info) => {
            const value = info.getValue();
            const percentage = calculateGainLossPercentage(
              info.row.original,
              getCurrentQuantity(info.row.original)
            );
            return (
              <div
                className={`text-center ${
                  value >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                <div>₹{Math.abs(value).toLocaleString("en-IN")}</div>
                <div className='text-xs'>
                  {percentage >= 0 ? "+" : ""}
                  {percentage.toFixed(2)}%
                </div>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor("marketCap", {
        header: "Market Cap",
        cell: (info) => {
          const value = info.getValue();
          if (!value) return "-";
          return (
            <div className='text-center'>₹{(value / 1e9).toFixed(2)}B</div>
          );
        },
      }),
      columnHelper.accessor("volume", {
        header: "Volume",
        cell: (info) => {
          const value = info.getValue();
          if (!value) return "-";
          return (
            <div className='text-center'>{value.toLocaleString("en-IN")}</div>
          );
        },
      }),
      columnHelper.accessor("peRatio", {
        header: "P/E Ratio",
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className='text-center'>
              {value != null ? value.toFixed(2) : "-"}
            </div>
          );
        },
      }),
      columnHelper.accessor("yearHigh", {
        header: "52W High",
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className='text-center'>
              {value ? `₹${value.toLocaleString("en-IN")}` : "-"}
            </div>
          );
        },
      }),
      columnHelper.accessor("yearLow", {
        header: "52W Low",
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className='text-center'>
              {value ? `₹${value.toLocaleString("en-IN")}` : "-"}
            </div>
          );
        },
      }),
    ],
    [
      totalInvestment,
      isEditing,
      editableQuantities,
      handleQuantityChange,
      saveQuantityChange,
      setIsEditing,
      getCurrentQuantity,
      onRefresh,
    ]
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

  // Group stocks by sector with improved sorting
  const stocksBySectorGrouped = useMemo(() => {
    return Object.entries(
      stocks.reduce((acc, stock) => {
        if (!acc[stock.sector]) acc[stock.sector] = [];
        acc[stock.sector].push(stock);
        return acc;
      }, {} as Record<string, Stock[]>)
    ).sort((a, b) => {
      const aValue = sectorSummaryMap[a[0]]?.gainLoss || 0;
      const bValue = sectorSummaryMap[b[0]]?.gainLoss || 0;
      return bValue - aValue; // Sort by sector performance
    });
  }, [stocks, sectorSummaryMap]);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between bg-gray-800 p-4 rounded-t-lg'>
        <div className='flex items-center gap-4'>
          <h3 className='text-lg font-medium text-gray-100'>
            Portfolio Overview
          </h3>
          <div className='text-sm text-gray-400'>
            Total Value: ₹{totalInvestment.toLocaleString("en-IN")}
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <div
              className={`h-2 w-2 rounded-full ${
                isRefreshing ? "bg-green-500 animate-pulse" : "bg-gray-600"
              }`}
            />
            <span className='text-sm text-gray-400'>
              Updates every 5 minutes
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='px-3 py-1 text-sm text-emerald-400 hover:text-emerald-300 
                     disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isRefreshing ? "Updating..." : "Update Now"}
          </button>
        </div>
      </div>

      {/* Sector Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
        {sectorSummaries.map((summary) => (
          <div
            key={summary.sector}
            className='bg-gray-800 rounded-lg p-4 shadow-lg'
          >
            <div className='flex justify-between items-center'>
              <h4 className='font-medium text-gray-200'>{summary.sector}</h4>
              <span
                className={`text-lg font-bold ${
                  summary.gainLoss >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {summary.gainLoss >= 0 ? "+" : ""}
                {((summary.gainLoss / summary.totalInvestment) * 100).toFixed(
                  2
                )}
                %
              </span>
            </div>
            <div className='mt-2 text-sm text-gray-400'>
              Value: ₹{summary.presentValue.toLocaleString("en-IN")}
            </div>
          </div>
        ))}
      </div>

      {/* Stock Table */}
      <div className='relative rounded-lg bg-gray-800'>
        {isRefreshing && (
          <div className='absolute inset-0 bg-gray-800/50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm'>
            <div className='text-sm text-gray-300 animate-pulse'>
              Updating stock data...
            </div>
          </div>
        )}

        <div className='w-full overflow-x-auto'>
          <table className='min-w-full table-auto border-collapse text-sm text-gray-300'>
            <thead>
              <tr className='border-b border-gray-700'>
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{
                        width:
                          columnWidths[header.id as keyof typeof columnWidths],
                      }}
                      className='px-2 py-3 text-center font-medium text-gray-400 sticky top-0 bg-gray-800'
                    >
                      <div className='flex items-center justify-center gap-1 text-xs'>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {stocksBySectorGrouped.map(([sector, sectorStocks]) => {
                const sectorSummary = sectorSummaryMap[sector];
                const lastUpdated = formatLastUpdated(
                  sectorStocks[0]?.lastUpdated
                );

                return (
                  <React.Fragment key={sector}>
                    <tr className='bg-gray-900/50'>
                      <td colSpan={15} className='px-4 py-2'>
                        <div className='flex items-center justify-center'>
                          <span className='font-medium text-gray-200'>
                            {sector}
                          </span>
                          <span className='ml-2 text-xs text-gray-500'>
                            ({sectorStocks.length} stocks)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {sectorStocks.map((stock) => {
                      const row = table
                        .getRowModel()
                        .rows.find((row) => row.original.id === stock.id);
                      if (!row) return null;

                      return (
                        <tr
                          key={stock.id}
                          className='border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors'
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className='px-3 py-2 text-center whitespace-nowrap'
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}

                    <tr className='bg-gray-900/30 border-t border-gray-700'>
                      <td colSpan={5} className='px-4 py-2 text-center'>
                        <div className='text-gray-400'>Sector Total</div>
                      </td>
                      <td className='text-center'>
                        ₹{sectorSummary.totalInvestment.toLocaleString("en-IN")}
                      </td>
                      <td className='text-center'>
                        {sectorSummary.percentageOfPortfolio.toFixed(2)}%
                      </td>
                      <td className='text-center'></td>
                      <td className='text-center'>
                        ₹{sectorSummary.presentValue.toLocaleString("en-IN")}
                      </td>
                      <td className='text-center'>
                        {(() => {
                          const value = sectorSummary.gainLoss;
                          const percentage = calculateGainLossPercentage(
                            sectorSummary,
                            getCurrentQuantity(sectorSummary)
                          );

                          return (
                            <div
                              className={value >= 0 ? "positive" : "negative"}
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
                      <td className='text-center' colSpan={2}></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
