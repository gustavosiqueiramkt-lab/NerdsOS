'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, Trash2, Loader2 } from 'lucide-react'
import { deleteProposal } from '@/app/(dashboard)/propostas/actions'

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  gerada: 'Gerada',
  enviada: 'Enviada',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
}

const STATUS_COLOR: Record<string, string> = {
  rascunho: 'rgba(255,255,255,0.15)',
  gerada: '#3b82f6',
  enviada: '#f59e0b',
  aprovada: '#22c55e',
  rejeitada: '#ef4444',
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

interface Props {
  proposal: {
    id: string
    title: string
    client_name: string
    client_segment: string | null
    client_market: string | null
    status: string
    total_spot: number
    total_monthly: number
    created_at: string
  }
}

export function PropostaCard({ proposal }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    startTransition(async () => {
      await deleteProposal(proposal.id)
    })
  }

  const date = new Date(proposal.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 transition-colors hover:border-[#E84500]/30">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E84500]/10">
          <span className="text-sm font-bold text-[#E84500]">N</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">{proposal.client_name}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {proposal.client_segment}
            {proposal.client_market ? ` · ${proposal.client_market}` : ''}
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-8 md:flex">
        <div className="text-right">
          <p className="text-xs text-[var(--color-muted-foreground)]">Spot</p>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">{brl(proposal.total_spot)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-muted-foreground)]">Mensal</p>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">{brl(proposal.total_monthly)}/mês</p>
        </div>
        <div>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ background: STATUS_COLOR[proposal.status] ?? STATUS_COLOR.rascunho }}
          >
            {STATUS_LABEL[proposal.status] ?? proposal.status}
          </span>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">{date}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/propostas/${proposal.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] transition-colors hover:border-[#E84500]/50 hover:text-[#E84500]"
        >
          <Eye size={12} />
          Ver
        </Link>
        <button
          onClick={handleDelete}
          disabled={isPending}
          onBlur={() => setConfirming(false)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            confirming
              ? 'border-red-500/50 bg-red-500/10 text-red-400'
              : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:text-red-400'
          }`}
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          {confirming ? 'Confirmar' : 'Excluir'}
        </button>
      </div>
    </div>
  )
}
