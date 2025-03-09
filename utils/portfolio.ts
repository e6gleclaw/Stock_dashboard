import type { PortfolioSummary, SectorSummary, Stock } from "@/types/stock"

// Calculate total investment for a stock
export function calculateInvestment(stock: Stock): number {
  return stock.purchasePrice * stock.quantity
}

// Calculate present value for a stock
export function calculatePresentValue(stock: Stock): number {
  return stock.currentPrice * stock.quantity
}

// Calculate gain/loss for a stock
export function calculateGainLoss(stock: Stock): number {
  return calculatePresentValue(stock) - calculateInvestment(stock)
}

// Calculate gain/loss percentage for a stock
export function calculateGainLossPercentage(stock: Stock): number {
  const investment = calculateInvestment(stock)
  const gainLoss = calculateGainLoss(stock)
  return (gainLoss / investment) * 100
}

// Calculate portfolio percentage for a stock
export function calculatePortfolioPercentage(stock: Stock, totalInvestment: number): number {
  return (calculateInvestment(stock) / totalInvestment) * 100
}

// Group stocks by sector
export function groupStocksBySector(stocks: Stock[]): Record<string, Stock[]> {
  return stocks.reduce(
    (acc, stock) => {
      if (!acc[stock.sector]) {
        acc[stock.sector] = []
      }
      acc[stock.sector].push(stock)
      return acc
    },
    {} as Record<string, Stock[]>,
  )
}

// Calculate sector summaries
export function calculateSectorSummaries(stocks: Stock[], totalPortfolioInvestment: number): SectorSummary[] {
  const sectorGroups = groupStocksBySector(stocks)

  return Object.entries(sectorGroups).map(([sector, sectorStocks]) => {
    const totalInvestment = sectorStocks.reduce((sum, stock) => sum + calculateInvestment(stock), 0)

    const presentValue = sectorStocks.reduce((sum, stock) => sum + calculatePresentValue(stock), 0)

    return {
      sector,
      totalInvestment,
      presentValue,
      gainLoss: presentValue - totalInvestment,
      percentageOfPortfolio: (totalInvestment / totalPortfolioInvestment) * 100,
      stocks: sectorStocks.length,
    }
  })
}

// Calculate portfolio summary
export function calculatePortfolioSummary(stocks: Stock[]): PortfolioSummary {
  const totalInvestment = stocks.reduce((sum, stock) => sum + calculateInvestment(stock), 0)

  const totalValue = stocks.reduce((sum, stock) => sum + calculatePresentValue(stock), 0)

  const totalGainLoss = totalValue - totalInvestment

  return {
    totalInvestment,
    totalValue,
    totalGainLoss,
    totalGainLossPercentage: (totalGainLoss / totalInvestment) * 100,
    sectorCount: new Set(stocks.map((stock) => stock.sector)).size,
    stockCount: stocks.length,
  }
}

