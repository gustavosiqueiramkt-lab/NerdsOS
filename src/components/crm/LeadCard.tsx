'use client'

import { AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatBRL, formatDate } from '@/lib/utils'
import {
  LEAD_TASK_TYPE_COLOR,
  LEAD_TASK_TYPE_LABEL,
  SOURCE_LABEL,
  type Lead,
  type LeadTask,
} from '@/types/database'

interface LeadCardProps {
  lead: Lead
  nextTask?: LeadTask
  onClick: () => void
}

export function LeadCard({ lead, nextTask, onClick }: LeadCardProps) {
  const overdue = nextTask?.due_date
    ? new Date(nextTask.due_date.includes('T') ? nextTask.due_date : nextTask.due_date + 'T00:00:00') <
      new Date(new Date().setHours(0, 0, 0, 0))
    : false

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-[#2A2A45] bg-[#1E1E32] p-3 text-left transition-all hover:border-[#FF6B35]/60 hover:shadow-lg hover:shadow-black/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
            {lead.name}
          </p>
          {lead.company ? (
            <p className="truncate text-xs text-[var(--color-muted-foreground)]">
              {lead.company}
            </p>
          ) : null}
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {SOURCE_LABEL[lead.source]}
        </Badge>
      </div>

      {lead.spot_value || lead.fee_value ? (
        <div className="mt-2 space-y-0.5">
          {lead.spot_value ? (
            <p className="text-sm font-semibold tabular-nums text-[#FF6B35]">
              Spot: {formatBRL(lead.spot_value)}
            </p>
          ) : null}
          {lead.fee_value ? (
            <p className="text-sm font-semibold tabular-nums text-[#FF6B35]">
              Fee: {formatBRL(lead.fee_value)}{lead.fee_months ? ` × ${lead.fee_months}m` : ''}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-xs italic text-[var(--color-muted-foreground)]">
          Sem proposta
        </p>
      )}

      {nextTask ? (
        <div className="mt-2 rounded-md border border-[#2A2A45] bg-[#13131F] px-2 py-1.5">
          <div className="flex items-center justify-between gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
            <span className="text-[var(--color-muted-foreground)]">Próximo Passo</span>
            <span
              className="rounded px-1.5 py-0.5"
              style={{
                backgroundColor: `${LEAD_TASK_TYPE_COLOR[nextTask.type]}20`,
                color: LEAD_TASK_TYPE_COLOR[nextTask.type],
              }}
            >
              {LEAD_TASK_TYPE_LABEL[nextTask.type]}
            </span>
          </div>
          <div
            className={
              'mt-1 flex items-center gap-1.5 text-xs ' +
              (overdue
                ? 'text-[var(--color-destructive)]'
                : 'text-[var(--color-foreground)]')
            }
          >
            {overdue ? <AlertCircle className="h-3 w-3 shrink-0" /> : null}
            <span className="truncate">{nextTask.title}</span>
            {nextTask.due_date ? (
              <span className="shrink-0 text-[var(--color-muted-foreground)]">
                · {formatDate(nextTask.due_date)}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[9px] text-[var(--color-muted-foreground)]">
          Sem próximos passos agendados
        </p>
      )}
    </button>
  )
}
