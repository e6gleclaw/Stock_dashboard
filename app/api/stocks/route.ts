// import type { Stock } from "@/types/stock"
// import { NextResponse } from "next/server"

// // Mock data for stocks
// const stocks: Stock[] = [
//   {
//     id: "1",
//     name: "Reliance Industries",
//     ticker: "RELIANCE",
//     purchasePrice: 2100,
//     quantity: 10,
//     sector: "Energy",
//     exchange: "NSE",
//     currentPrice: 2350,
//     peRatio: 28.5,
//     latestEarnings: 14.1,
//   },
//   {
//     id: "2",
//     name: "HDFC Bank",
//     ticker: "HDFCBANK",
//     purchasePrice: 1450,
//     quantity: 15,
//     sector: "Finance",
//     exchange: "NSE",
//     currentPrice: 1380,
//     peRatio: 22.3,
//     latestEarnings: 16.8,
//   },
//   {
//     id: "3",
//     name: "Infosys",
//     ticker: "INFY",
//     purchasePrice: 1320,
//     quantity: 20,
//     sector: "Technology",
//     exchange: "NSE",
//     currentPrice: 1450,
//     peRatio: 25.7,
//     latestEarnings: 12.4,
//   },
//   {
//     id: "4",
//     name: "Tata Consultancy Services",
//     ticker: "TCS",
//     purchasePrice: 3200,
//     quantity: 8,
//     sector: "Technology",
//     exchange: "NSE",
//     currentPrice: 3450,
//     peRatio: 27.1,
//     latestEarnings: 18.2,
//   },
//   {
//     id: "5",
//     name: "Bharti Airtel",
//     ticker: "BHARTIARTL",
//     purchasePrice: 650,
//     quantity: 25,
//     sector: "Telecom",
//     exchange: "NSE",
//     currentPrice: 720,
//     peRatio: 21.8,
//     latestEarnings: 9.7,
//   },
//   {
//     id: "6",
//     name: "ITC Limited",
//     ticker: "ITC",
//     purchasePrice: 215,
//     quantity: 100,
//     sector: "Consumer Goods",
//     exchange: "NSE",
//     currentPrice: 235,
//     peRatio: 19.5,
//     latestEarnings: 5.8,
//   },
//   {
//     id: "7",
//     name: "Larsen & Toubro",
//     ticker: "LT",
//     purchasePrice: 1750,
//     quantity: 12,
//     sector: "Construction",
//     exchange: "NSE",
//     currentPrice: 1680,
//     peRatio: 23.4,
//     latestEarnings: 11.2,
//   },
//   {
//     id: "8",
//     name: "Axis Bank",
//     ticker: "AXISBANK",
//     purchasePrice: 680,
//     quantity: 30,
//     sector: "Finance",
//     exchange: "NSE",
//     currentPrice: 750,
//     peRatio: 20.1,
//     latestEarnings: 8.9,
//   },
//   {
//     id: "9",
//     name: "Wipro",
//     ticker: "WIPRO",
//     purchasePrice: 420,
//     quantity: 40,
//     sector: "Technology",
//     exchange: "NSE",
//     currentPrice: 390,
//     peRatio: 18.7,
//     latestEarnings: 6.3,
//   },
//   {
//     id: "10",
//     name: "Asian Paints",
//     ticker: "ASIANPAINT",
//     purchasePrice: 3100,
//     quantity: 5,
//     sector: "Consumer Goods",
//     exchange: "NSE",
//     currentPrice: 3250,
//     peRatio: 32.4,
//     latestEarnings: 15.6,
//   },
// ]

// // Function to add random price fluctuations
// function addPriceFluctuations(stocks: Stock[]): Stock[] {
//   return stocks.map((stock) => {
//     // Random fluctuation between -3% and +3%
//     const fluctuation = (Math.random() * 6 - 3) / 100
//     const newPrice = stock.currentPrice * (1 + fluctuation)

//     return {
//       ...stock,
//       currentPrice: Number.parseFloat(newPrice.toFixed(2)),
//     }
//   })
// }

// export async function GET() {
//   // Add random price fluctuations to simulate real-time changes
//   const updatedStocks = addPriceFluctuations(stocks)

//   return NextResponse.json(updatedStocks)
// }

