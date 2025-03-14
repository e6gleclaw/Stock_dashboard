import type { PortfolioSummary } from "@/types/stock"

interface HeaderProps {
  summary: PortfolioSummary
}

export function Header({ summary }: HeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">Stock Portfolio</h1>
      <p className="text-muted-foreground">Track your investments and performance</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Investment"
          value={`₹${summary.totalInvestment.toLocaleString("en-IN")}`}
          subtitle={`${summary.stockCount} Stocks in ${summary.sectorCount} Sectors`}
        />

        <SummaryCard
          title="Current Value"
          value={`₹${summary.totalValue.toLocaleString("en-IN")}`}
          subtitle="Last updated just now"
        />

        <SummaryCard
          title="Total Gain/Loss"
          value={`₹${summary.totalGainLoss.toLocaleString("en-IN")}`}
          valueClassName={summary.totalGainLoss >= 0 ? "text-success" : "text-destructive"}
          subtitle={`${summary.totalGainLossPercentage.toFixed(2)}%`}
        />

        <SummaryCard title="Auto-Update" value="15mins" subtitle="Real-time price updates" />
      </div>
    </header>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  subtitle: string
  valueClassName?: string
}

function SummaryCard({ title, value, subtitle, valueClassName }: SummaryCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className={`mt-1 text-2xl text-black font-bold ${valueClassName}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
    </div>
  )
}

