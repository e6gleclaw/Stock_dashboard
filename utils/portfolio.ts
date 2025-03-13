import type { PortfolioSummary, SectorSummary, Stock } from "@/types/stock";

// Calculate total investment for a stock
export const calculateInvestment = (stock: Stock, quantity?: number) => {
  const actualQuantity = quantity ?? stock.quantity;
  return stock.purchasePrice * actualQuantity;
};

// Calculate present value for a stock
export const calculatePresentValue = (stock: Stock, quantity?: number) => {
  const actualQuantity = quantity ?? stock.quantity;
  return stock.currentPrice * actualQuantity;
};

// Calculate gain/loss for a stock
export const calculateGainLoss = (stock: Stock, quantity?: number) => {
  const actualQuantity = quantity ?? stock.quantity;
  return (stock.currentPrice - stock.purchasePrice) * actualQuantity;
};

// Calculate gain/loss percentage for a stock
export const calculateGainLossPercentage = (
  item: Stock | SectorSummary,
  quantity?: number
) => {
  if ('purchasePrice' in item) { // Check if it's a Stock
    const investment = calculateInvestment(item, quantity);
    const gainLoss = calculateGainLoss(item, quantity);
    return (gainLoss / investment) * 100;
  }
  // For SectorSummary
  return (item.gainLoss / item.totalInvestment) * 100;
};

// Calculate portfolio percentage for a stock
export const calculatePortfolioPercentage = (
  stock: Stock,
  totalInvestment: number,
  quantity?: number
) => {
  const investment = calculateInvestment(stock, quantity);
  return (investment / totalInvestment) * 100;
};

// Group stocks by sector
export function groupStocksBySector(stocks: Stock[]): Record<string, Stock[]> {
  return stocks.reduce((acc, stock) => {
    if (!acc[stock.sector]) {
      acc[stock.sector] = [];
    }
    acc[stock.sector].push(stock);
    return acc;
  }, {} as Record<string, Stock[]>);
}

// Calculate sector summaries
export function calculateSectorSummaries(
  stocks: Stock[],
  totalPortfolioInvestment: number
): SectorSummary[] {
  const sectorGroups = groupStocksBySector(stocks);

  return Object.entries(sectorGroups).map(([sector, sectorStocks]) => {
    const totalInvestment = sectorStocks.reduce(
      (sum, stock) => sum + calculateInvestment(stock),
      0
    );

    const presentValue = sectorStocks.reduce(
      (sum, stock) => sum + calculatePresentValue(stock),
      0
    );

    return {
      sector,
      totalInvestment,
      presentValue,
      gainLoss: presentValue - totalInvestment,
      percentageOfPortfolio: (totalInvestment / totalPortfolioInvestment) * 100,
      stocks: sectorStocks.length,
    };
  });
}

// Calculate portfolio summary
export function calculatePortfolioSummary(stocks: Stock[]): PortfolioSummary {
  const totalInvestment = stocks.reduce(
    (sum, stock) => sum + calculateInvestment(stock),
    0
  );

  const totalValue = stocks.reduce(
    (sum, stock) => sum + calculatePresentValue(stock),
    0
  );

  const totalGainLoss = totalValue - totalInvestment;

  return {
    totalInvestment,
    totalValue,
    totalGainLoss,
    totalGainLossPercentage: (totalGainLoss / totalInvestment) * 100,
    sectorCount: new Set(stocks.map((stock) => stock.sector)).size,
    stockCount: stocks.length,
  };
}
