export interface Stock {
  id: string;
  symbol: string;
  name: string;
  ticker: string;
  sector: string;
  exchange: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: string;
  currentPrice: number;
  peRatio: number | null;
  latestEarnings: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketCap: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  lastUpdated: string;
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  presentValue: number;
  gainLoss: number;
  percentageOfPortfolio: number;
  stocks: number;
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  sectorCount: number;
  stockCount: number;
}
