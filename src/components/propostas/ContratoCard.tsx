'use client'

import { useState, useTransition } from 'react'
import { Eye, Trash2, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cancelarContrato } from '@/app/(dashboard)/propostas/actions'
import { ContratoViewer } from './ContratoViewer'
import type { Contrato } from '@/types/database'
import { CONTRATO_STATUS_LABEL, CONTRATO_STATUS_COLOR } from '@/types/database'

interface Props {
  contrato: Contrato
}

const TYPE_LABEL: Record<string, string> = {
  spot: 'Projeto Pontual',
  fee: 'Recorrente',
}

const TYPE_COLOR: Record<string, string> = {
  spot: '#3B82F6',
  fee: '#8B5CF6',
}

export function ContratoCard({ contrato: initial }: Props) {
  const [contrato, setContrato] = useState(initial)
  const [viewing, setViewing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  // Keep local status in sync after ContratoViewer signs it (revalidatePath handles the data refresh)
  const date = new Date(contrato.created_at).toLocaleDateString('pt-BR')

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    startTransition(async () => {
      const res = await cancelarContrato(contrato.id)
      if (res && 'error' in res) toast.error(res.error)
      else toast.success('Contrato cancelado.')
      setConfirming(false)
    })
  }

  return (
    <>
      <div className="flex items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
          style={{ background: `${TYPE_COLOR[contrato.type]}20` }}
        >
          <FileText className="h-4 w-4" style={{ color: TYPE_COLOR[contrato.type] }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-[var(--color-foreground)] truncate">{contrato.razao_social}</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            {TYPE_LABEL[contrato.type]} · {date}
            {contrato.type === 'spot' && contrato.valor_total
              ? ` · R$ ${contrato.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : ''}
            {contrato.type === 'fee' && contrato.plano
              ? ` · Plano ${contrato.plano.charAt(0).toUpperCase() + contrato.plano.slice(1)}`
              : ''}
          </p>
        </div>

        <span
          className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            background: `${CONTRATO_STATUS_COLOR[contrato.status]}20`,
            color: CONTRATO_STATUS_COLOR[contrato.status],
          }}
        >
          {CONTRATO_STATUS_LABEL[contrato.status]}
        </span>

        {contrato.converted_to_client_id && (
          <span className="flex-shrink-0 rounded-full bg-[#10B981]/15 px-2 py-0.5 text-xs font-medium text-[#10B981]">
            Cliente criado
          </span>
        )}

        <button
          onClick={() => setViewing(true)}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver
        </button>

        <button
          onClick={handleDelete}
          disabled={pending}
          className={`flex-shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
            confirming
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-500/10'
          } disabled:opacity-60`}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {confirming ? 'Confirmar' : ''}
        </button>
        {confirming && (
          <button
            onClick={() => setConfirming(false)}
            className="flex-shrink-0 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            Cancelar
          </button>
        )}
      </div>

      {viewing && (
        <ContratoViewer
          contrato={contrato}
          onClose={() => {
            setViewing(false)
            // Optimistically reflect signed status if changed via viewer
          }}
        />
      )}
    </>
  )
}
