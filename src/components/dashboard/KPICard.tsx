import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  accent?: boolean
}

export function KPICard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: KPICardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {label}
        </p>
        {Icon ? (
          <div
            className={
              accent
                ? 'rounded-md bg-[var(--color-primary)]/15 p-1.5 text-[var(--color-primary)]'
                : 'rounded-md bg-[var(--color-muted)] p-1.5 text-[var(--color-muted-foreground)]'
            }
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
