'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  Globe,
  Phone,
  MapPin,
  Star,
  MessageCircle,
  ArrowRight,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  enviarMensagem,
  converterParaCRM,
  atualizarStatusLead,
} from '@/app/(dashboard)/prospeccao/actions'
import type { ProspeccaoLead } from '@/types/database'
import { PROSPECCAO_STATUS_LABEL, PROSPECCAO_STATUS_COLOR } from '@/types/database'

interface Props {
  lead: ProspeccaoLead
}

const SCORE_COLOR = (s: number) =>
  s >= 5 ? '#10B981' : s >= 3 ? '#F59E0B' : '#6B7280'

export function ProspeccaoLeadCard({ lead }: Props) {
  const [pending, startTransition] = useTransition()

  function handleEnviar() {
    startTransition(async () => {
      const result = await enviarMensagem(lead.id)
      if (result.error) toast.error(result.error)
      else toast.success('Mensagem enviada!')
    })
  }

  function handleConverter() {
    startTransition(async () => {
      const result = await converterParaCRM(lead.id)
      if (result.error) toast.error(result.error)
      else toast.success('Lead enviado ao CRM!')
    })
  }

  function handleDescartar() {
    startTransition(async () => {
      const result = await atualizarStatusLead(lead.id, 'descartado')
      if (result.error) toast.error(result.error)
    })
  }

  const isDescartado = lead.status === 'descartado'

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-opacity',
        isDescartado && 'opacity-40',
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--color-foreground)]">
            {lead.nome_empresa}
          </p>
          {lead.segmento && (
            <p className="text-xs text-[var(--color-muted-foreground)]">{lead.segmento}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Score badge */}
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: SCORE_COLOR(lead.score_oportunidade) }}
          >
            {lead.score_oportunidade} pts
          </span>
          {/* Status badge */}
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: PROSPECCAO_STATUS_COLOR[lead.status] }}
          >
            {PROSPECCAO_STATUS_LABEL[lead.status]}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mb-3 space-y-1">
        {lead.telefone && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{lead.telefone}</span>
          </div>
        )}
        {lead.endereco && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.endereco}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span className={cn('text-xs', lead.sem_website ? 'text-[#EF4444]' : 'text-[#10B981]')}>
              {lead.sem_website ? 'Sem site' : 'Tem site'}
            </span>
          </div>
          {lead.google_rating !== null && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
              <span className="text-xs">
                {lead.google_rating.toFixed(1)} ({lead.google_reviews_count ?? 0})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isDescartado && !lead.convertido_para_crm && (
        <div className="flex gap-2">
          {lead.google_maps_url && (
            <a
              href={lead.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {!lead.mensagem_enviada && lead.telefone && (
            <button
              onClick={handleEnviar}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#25D366] py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Enviar WhatsApp
            </button>
          )}

          {lead.mensagem_enviada && (
            <button
              onClick={handleConverter}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[var(--color-primary)] py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Enviar ao CRM
            </button>
          )}

          <button
            onClick={handleDescartar}
            disabled={pending}
            className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-muted-foreground)] hover:border-[#EF4444] hover:text-[#EF4444]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {lead.convertido_para_crm && (
        <p className="text-center text-xs font-medium text-[#8B5CF6]">Convertido para o CRM</p>
      )}
    </div>
  )
}
