"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

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
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
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
  onDataChange?: (data: {
    stocks: Stock[];
    sectorSummaries: SectorSummary[];
    totalInvestment: number;
  }) => void;
}

const columnHelper = createColumnHelper<Stock>();

// Helper functions
const formatLastUpdated = (timestamp: string | undefined) => {
  if (!timestamp) return "N/A";
  try {
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

// Column widths
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

// Available stock symbols
const AVAILABLE_STOCK_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "WMT", name: "Walmart Inc." },
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "PG", name: "Procter & Gamble Co." },
  { symbol: "MA", name: "Mastercard Inc." },
  { symbol: "DIS", name: "Walt Disney Co." },
  { symbol: "HD", name: "Home Depot Inc." },
];

// Helper functions for generating mock data
function getRandomPrice(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomChange(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getSectorForStock(symbol: string): string {
  const sectorMap: Record<string, string> = {
    AAPL: "Technology",
    MSFT: "Technology",
    AMZN: "Consumer Cyclical",
    GOOGL: "Communication Services",
    META: "Communication Services",
    TSLA: "Automotive",
    NVDA: "Technology",
    JPM: "Financial Services",
    V: "Financial Services",
    WMT: "Consumer Defensive",
    JNJ: "Healthcare",
    PG: "Consumer Defensive",
    MA: "Financial Services",
    DIS: "Communication Services",
    HD: "Consumer Cyclical",
  };

  return sectorMap[symbol] || "Unknown";
}

export function StockTable({
  stocks: initialStocks,
  sectorSummaries: initialSectorSummaries,
  totalInvestment: initialTotalInvestment,
  onRefresh,
  onDataChange,
}: StockTableProps) {
  // Essential state
  const [localStocks, setLocalStocks] = useState<Stock[]>([...initialStocks]);
  const [localSectorSummaries, setLocalSectorSummaries] = useState<
    SectorSummary[]
  >([...initialSectorSummaries]);
  const [localTotalInvestment, setLocalTotalInvestment] = useState(
    initialTotalInvestment
  );

  // Editing state
  const [editableQuantities, setEditableQuantities] = useState<
    Record<string, number>
  >({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});

  // UI state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "sector", desc: false },
  ]);
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [deletedStockIds, setDeletedStockIds] = useState<Set<string>>(
    new Set()
  );

  // Define recalculateSectorSummaries first
  const recalculateSectorSummaries = useCallback(
    (stocks: Stock[]): SectorSummary[] => {
      // Group stocks by sector
      const sectorGroups: Record<string, Stock[]> = {};
      stocks.forEach((stock) => {
        if (!sectorGroups[stock.sector]) {
          sectorGroups[stock.sector] = [];
        }
        sectorGroups[stock.sector].push(stock);
      });

      const totalInv = stocks.reduce(
        (sum, stock) => sum + stock.purchasePrice * stock.quantity,
        0
      );

      // Create summary for each sector
      return Object.entries(sectorGroups).map(([sector, sectorStocks]) => {
        const totalInvestment = sectorStocks.reduce(
          (sum, stock) => sum + stock.purchasePrice * stock.quantity,
          0
        );
        const presentValue = sectorStocks.reduce(
          (sum, stock) => sum + stock.currentPrice * stock.quantity,
          0
        );

        return {
          sector,
          quantity: sectorStocks.reduce(
            (sum, stock) => sum + stock.quantity,
            0
          ),
          totalInvestment,
          presentValue,
          gainLoss: presentValue - totalInvestment,
          percentageOfPortfolio:
            totalInv > 0 ? (totalInvestment / totalInv) * 100 : 0,
        };
      });
    },
    []
  );

  // Get current quantity for calculations
  const getCurrentQuantity = useCallback(
    (stock: Stock | SectorSummary) => {
      if ("id" in stock && stock.id) {
        // It's a Stock
        return editableQuantities[stock.id] !== undefined
          ? editableQuantities[stock.id]
          : stock.quantity;
      }
      // It's a SectorSummary
      return stock.quantity || 0;
    },
    [editableQuantities]
  );

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (stockId: string, newQuantity: number) => {
      setEditableQuantities((prev) => ({
        ...prev,
        [stockId]: newQuantity,
      }));
    },
    []
  );

  // Save quantity change
  const saveQuantityChange = useCallback(
    (stock: Stock) => {
      const newQuantity = editableQuantities[stock.id] || stock.quantity;

      // Update the stock with new quantity
      const updatedStocks = localStocks.map((s) =>
        s.id === stock.id ? { ...s, quantity: newQuantity } : s
      );
      setLocalStocks(updatedStocks);

      // Recalculate sector summaries
      const updatedSummaries = recalculateSectorSummaries(updatedStocks);
      setLocalSectorSummaries(updatedSummaries);

      // Recalculate total investment
      const newTotal = updatedStocks.reduce(
        (sum, s) => sum + s.purchasePrice * s.quantity,
        0
      );
      setLocalTotalInvestment(newTotal);

      // Exit editing mode
      setIsEditing((prev) => ({ ...prev, [stock.id]: false }));

      // Notify parent
      if (onDataChange) {
        onDataChange({
          stocks: updatedStocks,
          sectorSummaries: updatedSummaries,
          totalInvestment: newTotal,
        });
      }

      // Call refresh
      onRefresh();
    },
    [
      editableQuantities,
      localStocks,
      onRefresh,
      onDataChange,
      recalculateSectorSummaries,
    ]
  );

  // Handle adding a stock from dropdown
  const handleAddStock = useCallback(
    async (stockSymbol: string) => {
      if (!stockSymbol) return;

      try {
        setIsLoadingStock(true);
        console.log("Adding stock:", stockSymbol);

        // Generate mock stock data
        const newStock: Stock = {
          id: stockSymbol,
          name:
            AVAILABLE_STOCK_SYMBOLS.find((s) => s.symbol === stockSymbol)
              ?.name || stockSymbol,
          ticker: stockSymbol,
          sector: getSectorForStock(stockSymbol),
          exchange: "NASDAQ",
          purchasePrice: getRandomPrice(100, 3000),
          currentPrice: getRandomPrice(100, 3000),
          quantity: 2, // Set to 2 as requested
          dayChangePercent: getRandomChange(-5, 5),
          marketCap: getRandomNumber(1000000000, 2000000000000),
          volume: getRandomNumber(1000000, 10000000),
          peRatio: getRandomNumber(10, 50),
          yearHigh: getRandomPrice(100, 3000),
          yearLow: getRandomPrice(50, 2500),
          lastUpdated: new Date().toISOString(),
        };

        // Check if stock already exists
        const stockExists = localStocks.some(
          (stock) => stock.ticker === stockSymbol
        );
        if (stockExists) {
          console.log("Stock already exists in table, not adding duplicate");
          setIsLoadingStock(false);
          return;
        }

        // Add the new stock to the copied array
        const updatedStocks = [...localStocks, newStock];
        console.log("Updated stocks array:", updatedStocks.length);

        // Update the state with the new array
        setLocalStocks(updatedStocks);

        // If this was previously a deleted stock, remove it from the deleted set
        if (deletedStockIds.has(stockSymbol)) {
          setDeletedStockIds((prev) => {
            const updated = new Set(prev);
            updated.delete(stockSymbol);
            return updated;
          });
        }

        // Recalculate sector summaries
        const updatedSummaries = recalculateSectorSummaries(updatedStocks);
        setLocalSectorSummaries(updatedSummaries);

        // Recalculate total investment
        const newTotalInvestment = updatedStocks.reduce(
          (sum, stock) => sum + stock.purchasePrice * stock.quantity,
          0
        );
        setLocalTotalInvestment(newTotalInvestment);

        // Reset selected value
        setSelectedStock("");

        // Set flag to skip next props update
        sessionStorage.setItem("skipNextPropsUpdate", "true");

        // Notify parent with updated data
        if (onDataChange) {
          onDataChange({
            stocks: updatedStocks,
            sectorSummaries: updatedSummaries,
            totalInvestment: newTotalInvestment,
          });
        }

        console.log("Stock added successfully");
      } catch (error) {
        console.error("Failed to add stock:", error);
        alert("Failed to add stock. Please try again.");
      } finally {
        setIsLoadingStock(false);
      }
    },
    [localStocks, onDataChange, recalculateSectorSummaries, deletedStockIds]
  );

  // Handle deleting a stock
  const handleDeleteStock = useCallback(
    (stockToDelete: Stock) => {
      console.log("Deleting stock:", stockToDelete.ticker);

      // Remove the stock from local state
      const updatedStocks = localStocks.filter(
        (stock) => stock.id !== stockToDelete.id
      );
      setLocalStocks(updatedStocks);

      // Add to deleted stocks set so we can track it
      setDeletedStockIds((prev) => {
        const updated = new Set(prev);
        updated.add(stockToDelete.ticker);
        return updated;
      });

      // Recalculate sector summaries
      const updatedSummaries = recalculateSectorSummaries(updatedStocks);
      setLocalSectorSummaries(updatedSummaries);

      // Recalculate total investment
      const newTotalInvestment = updatedStocks.reduce(
        (sum, stock) => sum + stock.purchasePrice * stock.quantity,
        0
      );
      setLocalTotalInvestment(newTotalInvestment);

      // Clean up editing state for the deleted stock
      setIsEditing((prev) => {
        const updated = { ...prev };
        delete updated[stockToDelete.id];
        return updated;
      });

      setEditableQuantities((prev) => {
        const updated = { ...prev };
        delete updated[stockToDelete.id];
        return updated;
      });

      // Save flag to prevent override on next props update
      sessionStorage.setItem("skipNextPropsUpdate", "true");

      // Notify parent component about the changes
      if (onDataChange) {
        onDataChange({
          stocks: updatedStocks,
          sectorSummaries: updatedSummaries,
          totalInvestment: newTotalInvestment,
        });
      }

      console.log("Stock deleted, remaining stocks:", updatedStocks.length);
    },
    [localStocks, onDataChange, recalculateSectorSummaries]
  );

  // Fix the availableStocksForDropdown logic to exclude stocks already in the table
  const availableStocksForDropdown = useMemo(() => {
    // Get existing stock tickers (currently in the table)
    const existingTickers = new Set(localStocks.map((stock) => stock.ticker));

    // Return only stocks that are NOT already in the table
    return AVAILABLE_STOCK_SYMBOLS.filter(
      (stock) => !existingTickers.has(stock.symbol)
    );
  }, [localStocks]);

  // Group stocks by sector
  const stocksBySectorGrouped = useMemo(() => {
    const sectorMap: Record<string, Stock[]> = {};
    localStocks.forEach((stock) => {
      const sector = stock.sector || "Unknown";
      if (!sectorMap[sector]) {
        sectorMap[sector] = [];
      }
      sectorMap[sector].push(stock);
    });

    return Object.entries(sectorMap).sort((a, b) => a[0].localeCompare(b[0]));
  }, [localStocks]);

  // Create map of sector to summary
  const sectorSummaryMap = useMemo(() => {
    const map: Record<string, SectorSummary> = {};
    localSectorSummaries.forEach((summary) => {
      map[summary.sector] = summary;
    });
    return map;
  }, [localSectorSummaries]);

  // Update local state from props
  useEffect(() => {
    // Skip this effect if we've just added a stock
    if (sessionStorage.getItem("skipNextPropsUpdate") === "true") {
      sessionStorage.removeItem("skipNextPropsUpdate");
      return;
    }

    // We'll use sessionStorage to keep track of our stocks
    const storedStocksJSON = sessionStorage.getItem("localStocks");

    // If we have stocks in session storage and the initial stocks are empty or fewer
    if (
      storedStocksJSON &&
      JSON.parse(storedStocksJSON).length > initialStocks.length
    ) {
      console.log("Preserving local stocks from session storage");
      return;
    }

    console.log("Updating from props:", initialStocks.length, "stocks");
    setLocalStocks([...initialStocks]);
    setLocalSectorSummaries([...initialSectorSummaries]);
    setLocalTotalInvestment(initialTotalInvestment);
  }, [initialStocks, initialSectorSummaries, initialTotalInvestment]);

  // Add an effect to save our stocks to session storage
  useEffect(() => {
    if (localStocks.length > 0) {
      sessionStorage.setItem("localStocks", JSON.stringify(localStocks));
    }
  }, [localStocks]);

  // Create table instance with improved column definitions
  const table = useReactTable({
    data: localStocks,
    columns: [
      columnHelper.accessor("sector", {
        header: "Sector",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("name", {
        header: "Stock",
        cell: (info) => <div className='font-medium'>{info.getValue()}</div>,
      }),
      columnHelper.accessor("exchange", {
        header: "Exchange",
        cell: (info) => (
          <span className='px-2 py-1 rounded-full bg-gray-700/50 text-xs font-medium'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("purchasePrice", {
        header: "Purchase Price",
        cell: (info) => `₹${info.getValue().toLocaleString("en-IN")}`,
      }),
      columnHelper.accessor("quantity", {
        header: "Quantity",
        cell: (info) => {
          const stock = info.row.original;
          const isEditingThis = isEditing[stock.id] || false;
          const currentQuantity = getCurrentQuantity(stock);

          if (isEditingThis) {
            return (
              <div className='flex items-center justify-end gap-1'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newValue = Math.max(1, currentQuantity - 1);
                    handleQuantityChange(stock.id, newValue);
                  }}
                  className='w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-l'
                >
                  -
                </button>
                <input
                  type='number'
                  min='1'
                  value={currentQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      handleQuantityChange(stock.id, value);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className='w-14 h-7 px-2 py-0.5 bg-gray-700 text-center border-x border-gray-600 text-white'
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(stock.id, currentQuantity + 1);
                  }}
                  className='w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-r'
                >
                  +
                </button>
                <div className='flex gap-1 ml-2'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveQuantityChange(stock);
                    }}
                    className='px-2 py-1 text-xs rounded bg-green-600/20 text-green-500 hover:bg-green-600/30'
                  >
                    Save
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing((prev) => ({
                        ...prev,
                        [stock.id]: false,
                      }));
                    }}
                    className='px-2 py-1 text-xs rounded bg-red-600/20 text-red-500 hover:bg-red-600/30'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              onClick={() => {
                setIsEditing((prev) => ({
                  ...prev,
                  [stock.id]: true,
                }));
                setEditableQuantities((prev) => ({
                  ...prev,
                  [stock.id]: stock.quantity,
                }));
              }}
              className='cursor-pointer hover:bg-gray-700/60 py-1 px-2 rounded text-right flex justify-end items-center'
            >
              <span>{currentQuantity}</span>
              <span className='ml-2 text-gray-500 text-xs'>(Edit)</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("investment", {
        header: "Investment",
        cell: (info) => {
          const stock = info.row.original;
          const currentQuantity = getCurrentQuantity(stock);
          const value = stock.purchasePrice * currentQuantity;
          return `₹${value.toLocaleString("en-IN")}`;
        },
        accessorFn: (row) => row.purchasePrice * getCurrentQuantity(row),
      }),
      columnHelper.accessor("portfolioPercentage", {
        header: () => <div className='text-right'>Portfolio %</div>,
        cell: (info) => {
          const stock = info.row.original;
          const value = calculatePortfolioPercentage(
            stock,
            localTotalInvestment,
            getCurrentQuantity(stock)
          );
          return `${value.toFixed(2)}%`;
        },
        accessorFn: (row) =>
          calculatePortfolioPercentage(
            row,
            localTotalInvestment,
            getCurrentQuantity(row)
          ),
      }),
      columnHelper.accessor("currentPrice", {
        header: () => <div className='text-right'>Current Price</div>,
        cell: (info) => `₹${info.getValue().toLocaleString("en-IN")}`,
      }),
      columnHelper.accessor("presentValue", {
        header: () => <div className='text-right'>Present Value</div>,
        cell: (info) => {
          const stock = info.row.original;
          const value = calculatePresentValue(stock, getCurrentQuantity(stock));
          return `₹${value.toLocaleString("en-IN")}`;
        },
        accessorFn: (row) =>
          calculatePresentValue(row, getCurrentQuantity(row)),
      }),
      columnHelper.accessor("gainLoss", {
        header: "Gain/Loss",
        cell: (info) => {
          const stock = info.row.original;
          const value = calculateGainLoss(stock, getCurrentQuantity(stock));
          const percentage = calculateGainLossPercentage(
            stock,
            getCurrentQuantity(stock)
          );

          return (
            <div
              className={`flex flex-col items-end ${
                value >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              <div className='flex items-center justify-end w-full'>
                {value >= 0 ? (
                  <ArrowUp className='mr-1 h-3 w-3' />
                ) : (
                  <ArrowDown className='mr-1 h-3 w-3' />
                )}
                <span className='font-medium'>
                  ₹{Math.abs(value).toLocaleString("en-IN")}
                </span>
              </div>
              <div className='text-xs w-full text-right'>
                {percentage >= 0 ? "+" : ""}
                {percentage.toFixed(2)}%
              </div>
            </div>
          );
        },
        accessorFn: (row) => calculateGainLoss(row, getCurrentQuantity(row)),
      }),
      columnHelper.accessor("marketCap", {
        header: () => <div className='text-right'>Market Cap</div>,
        cell: (info) => {
          const value = info.getValue();
          if (value >= 1000000000000) {
            return `₹${(value / 1000000000000).toFixed(2)}T`;
          } else if (value >= 1000000000) {
            return `₹${(value / 1000000000).toFixed(2)}B`;
          } else {
            return `₹${(value / 1000000).toFixed(2)}M`;
          }
        },
      }),
      columnHelper.accessor("volume", {
        header: () => <div className='text-right'>Volume</div>,
        cell: (info) => {
          const value = info.getValue();
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(2)}M`;
          } else if (value >= 1000) {
            return `${(value / 1000).toFixed(2)}K`;
          } else {
            return value;
          }
        },
      }),
      columnHelper.accessor("peRatio", {
        header: () => <div className='text-right'>P/E Ratio</div>,
        cell: (info) => info.getValue().toFixed(2),
      }),
      columnHelper.accessor("yearHigh", {
        header: () => <div className='text-right'>52W High</div>,
        cell: (info) => `₹${info.getValue().toLocaleString("en-IN")}`,
      }),
      columnHelper.accessor("yearLow", {
        header: () => <div className='text-right'>52W Low</div>,
        cell: (info) => `₹${info.getValue().toLocaleString("en-IN")}`,
      }),
      columnHelper.accessor("actions", {
        header: "",
        cell: (info) => {
          const stock = info.row.original;
          return (
            <div className='flex justify-center gap-2'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStock(stock);
                }}
                className='p-1.5 rounded-full bg-gray-700 hover:bg-red-700 transition-colors text-gray-300 hover:text-white'
                title='Remove stock'
              >
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          );
        },
      }),
    ],
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  return (
    <div className='w-full mx-auto space-y-6 px-2 sm:px-4'>
      {/* Add Stock Dropdown - Improved styling */}
      <div className='flex items-center gap-4 bg-gray-800 p-4 sm:p-5 rounded-lg shadow-md'>
        <div className='flex items-center justify-between w-full'>
          <h3 className='text-sm sm:text-lg font-medium text-gray-200'>
            Add Stock
          </h3>
          <div className='flex-1 max-w-xs ml-2 sm:ml-4'>
            <select
              value={selectedStock}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  setSelectedStock(value);
                  // Set flag to skip next props update
                  sessionStorage.setItem("skipNextPropsUpdate", "true");
                  handleAddStock(value);
                }
              }}
              disabled={isLoadingStock}
              className='w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors cursor-pointer text-sm'
            >
              <option value=''>
                {isLoadingStock
                  ? "Loading stock data..."
                  : "Select a stock to add..."}
              </option>
              {availableStocksForDropdown.map((stock) => (
                <option key={stock.symbol} value={stock.symbol}>
                  {stock.name} ({stock.symbol})
                </option>
              ))}
              {availableStocksForDropdown.length === 0 && (
                <option value='' disabled>
                  No more stocks available to add
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Table - Fixed overflow issues */}
      <div className='w-full rounded-lg bg-gray-800 overflow-hidden shadow-lg'>
        {/* Fixed width container with proper overflow handling */}
        <div
          className='w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800'
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          <table className='w-full table-auto border-collapse text-sm text-gray-300'>
            <thead>
              <tr className='border-b border-gray-700 bg-gray-900/50'>
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => {
                    // Adjust column widths to prevent overflow
                    let width = "auto";
                    if (header.id === "name") width = "150px";
                    else if (header.id === "sector") width = "100px";
                    else if (header.id === "exchange") width = "80px";
                    else if (header.id === "quantity") width = "100px";
                    else if (header.id === "actions") width = "60px";
                    else if (header.id === "gainLoss") width = "120px";
                    else width = "100px"; // Default width for other columns

                    return (
                      <th
                        key={header.id}
                        style={{ width }}
                        className='px-2 py-3 text-left font-medium text-gray-300 sticky top-0 bg-gray-800/95 backdrop-blur-sm'
                      >
                        <div className='flex items-center gap-1 text-xs'>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </div>
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>
            <tbody>
              {/* Render sectors as collapsible groups */}
              {stocksBySectorGrouped.map(([sector, sectorStocks]) => {
                const sectorSummary = sectorSummaryMap[sector];
                const lastUpdated = formatLastUpdated(
                  sectorStocks[0]?.lastUpdated
                );

                return (
                  <React.Fragment key={sector}>
                    {/* Sector header row - Enhanced styling */}
                    <tr className='bg-gradient-to-r from-gray-800 to-gray-800/80 cursor-pointer hover:bg-gray-700/80 transition-colors'>
                      <td
                        colSpan={table.getHeaderGroups()[0].headers.length}
                        className='px-4 py-3'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <div className='font-semibold text-gray-100 text-base'>
                              {sector}
                            </div>
                            <div className='text-xs text-gray-400 ml-4'>
                              {sectorSummary
                                ? `${sectorStocks.length} stocks`
                                : ""}
                            </div>
                          </div>
                          <div className='flex items-center space-x-6'>
                            {/* Sector metrics aligned horizontally */}
                            <div className='flex flex-col items-end'>
                              <span className='text-xs text-gray-400'>
                                Investment
                              </span>
                              <span className='font-medium'>
                                {sectorSummary
                                  ? `₹${sectorSummary.totalInvestment.toLocaleString(
                                      "en-IN"
                                    )}`
                                  : "Loading..."}
                              </span>
                            </div>
                            <div className='flex flex-col items-end'>
                              <span className='text-xs text-gray-400'>
                                Present Value
                              </span>
                              <span className='font-medium'>
                                {sectorSummary
                                  ? `₹${sectorSummary.presentValue.toLocaleString(
                                      "en-IN"
                                    )}`
                                  : "Loading..."}
                              </span>
                            </div>
                            <div className='flex flex-col items-end min-w-[100px]'>
                              <span className='text-xs text-gray-400'>
                                Gain/Loss
                              </span>
                              {sectorSummary && (
                                <div
                                  className={`flex items-center ${
                                    sectorSummary.gainLoss >= 0
                                      ? "text-green-500"
                                      : "text-red-500"
                                  }`}
                                >
                                  {sectorSummary.gainLoss >= 0 ? (
                                    <ArrowUp className='mr-1 h-3 w-3' />
                                  ) : (
                                    <ArrowDown className='mr-1 h-3 w-3' />
                                  )}
                                  <span className='font-medium'>
                                    ₹
                                    {Math.abs(
                                      sectorSummary.gainLoss
                                    ).toLocaleString("en-IN")}
                                    <span className='ml-1 text-xs'>
                                      (
                                      {(
                                        (sectorSummary.gainLoss /
                                          (sectorSummary.totalInvestment ||
                                            1)) *
                                        100
                                      ).toFixed(2)}
                                      %)
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className='text-xs text-gray-400'>
                              Updated: {lastUpdated}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Stock rows - Improved alignment and styling */}
                    {sectorStocks.map((stock) => {
                      const row = table
                        .getRowModel()
                        .rows.find((row) => row.original.id === stock.id);
                      if (!row) return null;

                      return (
                        <tr
                          key={stock.id}
                          className='border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors'
                        >
                          {row.getVisibleCells().map((cell) => {
                            // Adjust alignment based on column type
                            let alignment = "text-left";
                            const columnId = cell.column.id;

                            // Right-align numeric columns
                            if (
                              [
                                "purchasePrice",
                                "quantity",
                                "investment",
                                "portfolioPercentage",
                                "currentPrice",
                                "presentValue",
                                "marketCap",
                                "volume",
                                "peRatio",
                                "yearHigh",
                                "yearLow",
                              ].includes(columnId)
                            ) {
                              alignment = "text-right";
                            }

                            // Center align specific columns
                            if (["gainLoss", "actions"].includes(columnId)) {
                              alignment = "text-center";
                            }

                            return (
                              <td
                                key={cell.id}
                                className={`px-4 py-3 whitespace-nowrap ${alignment}`}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
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
