import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/40 px-6 py-14 text-center">
      {Icon ? (
        <div className="rounded-full bg-[var(--color-muted)] p-3">
          <Icon className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="font-medium text-[var(--color-foreground)]">{title}</p>
        {description ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
