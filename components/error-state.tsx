import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
      <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
      <h3 className="mb-2 text-lg font-medium">Failed to load data</h3>
      <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Retry
      </button>
    </div>
  )
}

