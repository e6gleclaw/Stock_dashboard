import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

// Define the portfolio data structure
const portfolioData = [
  {
    id: "1",
    symbol: "AAPL",
    name: "Apple Inc.",
    ticker: "AAPL",
    sector: "Technology",
    exchange: "NASDAQ",
    purchasePrice: 150,
    quantity: 10,
    purchaseDate: "2023-01-01",
  },
  {
    id: "2",
    symbol: "MSFT",
    name: "Microsoft Corporation",
    ticker: "MSFT",
    sector: "Technology",
    exchange: "NASDAQ",
    purchasePrice: 250,
    quantity: 5,
    purchaseDate: "2023-01-01",
  },
  {
    id: "3",
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    ticker: "GOOGL",
    sector: "Technology",
    exchange: "NASDAQ",
    purchasePrice: 2800,
    quantity: 3,
    purchaseDate: "2023-01-01",
  },
  {
    id: "4",
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    ticker: "AMZN",
    sector: "Consumer Cyclical",
    exchange: "NASDAQ",
    purchasePrice: 3300,
    quantity: 2,
    purchaseDate: "2023-01-01",
  },
  {
    id: "5",
    symbol: "TSLA",
    name: "Tesla, Inc.",
    ticker: "TSLA",
    sector: "Automotive",
    exchange: "NASDAQ",
    purchasePrice: 900,
    quantity: 5,
    purchaseDate: "2023-01-01",
  },
  {
    id: "6",
    symbol: "META",
    name: "Meta Platforms Inc.",
    ticker: "META",
    sector: "Technology",
    exchange: "NASDAQ",
    purchasePrice: 330,
    quantity: 4,
    purchaseDate: "2023-01-01",
  },
];

export async function GET() {
  try {
    // Fetch current prices and additional data for all stocks in parallel
    const updatedPortfolio = await Promise.all(
      portfolioData.map(async (stock) => {
        try {
          // Fetch both quote and financial data
          const [quote, financials] = await Promise.all([
            yahooFinance.quote(stock.symbol),
            yahooFinance.quoteSummary(stock.symbol, {
              modules: [
                "defaultKeyStatistics",
                "financialData",
                "price",
                "summaryDetail",
              ],
            }),
          ]);

          console.log(`Data for ${stock.symbol}:`, {
            quote,
            financials,
          });

          // Extract PE ratio and earnings data
          const peRatio =
            financials.defaultKeyStatistics?.forwardPE ||
            financials.summaryDetail?.trailingPE ||
            null;

          // Calculate earnings using either totalRevenue or earnings per share
          const latestEarnings = financials.financialData?.totalRevenue
            ? financials.financialData.totalRevenue /
              (financials.defaultKeyStatistics?.sharesOutstanding || 1)
            : financials.defaultKeyStatistics?.trailingEps || null;

          const stockData = {
            ...stock,
            currentPrice: quote.regularMarketPrice || stock.purchasePrice,
            peRatio: peRatio,
            latestEarnings: latestEarnings,
            exchange: quote.exchange || stock.exchange,
            // Market Data
            dayHigh: quote.regularMarketDayHigh || null,
            dayLow: quote.regularMarketDayLow || null,
            volume: quote.regularMarketVolume || null,
            marketCap: quote.marketCap || null,
            // Additional Trading Data
            dayChange: quote.regularMarketChange || null,
            dayChangePercent: quote.regularMarketChangePercent || null,
            fiftyDayAverage: quote.fiftyDayAverage || null,
            twoHundredDayAverage: quote.twoHundredDayAverage || null,
            yearHigh: quote.fiftyTwoWeekHigh || null,
            yearLow: quote.fiftyTwoWeekLow || null,
            lastUpdated: new Date().toISOString(),
          };

          console.log(`Processed data for ${stock.symbol}:`, stockData);
          return stockData;
        } catch (error) {
          console.error(`Error fetching ${stock.symbol}:`, error);
          // Return stock with default values if fetch fails
          return {
            ...stock,
            currentPrice: stock.purchasePrice,
            peRatio: null,
            latestEarnings: null,
            dayHigh: null,
            dayLow: null,
            volume: null,
            marketCap: null,
          };
        }
      })
    );

    return NextResponse.json(updatedPortfolio);
  } catch (error) {
    console.error("Failed to fetch stock data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
