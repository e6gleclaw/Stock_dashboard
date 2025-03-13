export interface Stock {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  exchange: string;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  dayChangePercent?: number;
  marketCap?: number;
  volume?: number;
  peRatio?: number;
  yearHigh?: number;
  yearLow?: number;
  lastUpdated?: string;
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  presentValue: number;
  gainLoss: number;
  percentageOfPortfolio: number;
  quantity?: number;
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  sectorCount: number;
  stockCount: number;
}
