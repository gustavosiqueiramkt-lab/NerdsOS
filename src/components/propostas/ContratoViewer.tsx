'use client'

import { useTransition, useState } from 'react'
import { Printer, CheckCircle, UserPlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { assinarContrato, converterContratoParaCliente } from '@/app/(dashboard)/propostas/actions'
import { fillContratoSpot, fillContratoFee } from '@/lib/contract-templates'
import type { Contrato } from '@/types/database'
import { PLANO_FEE_DEFAULTS } from '@/types/database'

interface Props {
  contrato: Contrato
  onClose: () => void
}

function getHtml(c: Contrato): string {
  const today = new Date().toLocaleDateString('pt-BR')
  if (c.type === 'spot' && c.servicos_contratados && c.valor_total && c.forma_pagamento) {
    return fillContratoSpot({
      razao_social: c.razao_social,
      cnpj: c.cnpj,
      endereco: c.endereco,
      nome_representante: c.nome_representante,
      rg: c.rg_representante,
      cpf: c.cpf_representante,
      servicos: c.servicos_contratados,
      valor_total: c.valor_total,
      forma_pagamento: c.forma_pagamento,
      data_geracao: today,
    })
  }
  if (c.type === 'fee' && c.plano && c.fee_mensal !== null && c.taxa_ativacao !== null) {
    const defaults = PLANO_FEE_DEFAULTS[c.plano]
    return fillContratoFee({
      razao_social: c.razao_social,
      cnpj: c.cnpj,
      endereco: c.endereco,
      nome_representante: c.nome_representante,
      rg: c.rg_representante,
      cpf: c.cpf_representante,
      plano: c.plano,
      fee_mensal: c.fee_mensal,
      taxa_ativacao: c.taxa_ativacao,
      plano_conteudo: c.plano_conteudo,
      dia_vencimento: c.dia_vencimento ?? 5,
      meses_min: defaults.meses_min,
      data_geracao: today,
    })
  }
  return '<p style="padding:32px">Dados insuficientes para renderizar o contrato.</p>'
}

export function ContratoViewer({ contrato, onClose }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [converting, setConverting] = useState(false)
  const html = getHtml(contrato)

  function handlePrint() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  function handleAssinar() {
    startTransition(async () => {
      const res = await assinarContrato(contrato.id)
      if ('error' in res) toast.error(res.error)
      else { toast.success('Contrato marcado como assinado!'); onClose() }
    })
  }

  function handleConverterCliente() {
    setConverting(true)
    converterContratoParaCliente(contrato.id).then(res => {
      setConverting(false)
      if ('error' in res) { toast.error(res.error); return }
      toast.success('Cliente criado com sucesso!')
      onClose()
      router.push('/clientes')
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
      {/* Toolbar */}
      <div className="no-print flex items-center gap-3 bg-[var(--color-card)] border-b border-[var(--color-border)] px-5 py-3 flex-shrink-0">
        <button onClick={onClose} className="mr-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          <X className="h-5 w-5" />
        </button>
        <span className="font-semibold text-[var(--color-foreground)] flex-1">
          Contrato {contrato.type === 'spot' ? 'Projeto Pontual' : 'Recorrente'} — {contrato.razao_social}
        </span>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
        >
          <Printer className="h-4 w-4" />
          Imprimir / PDF
        </button>

        {contrato.status === 'gerado' && (
          <button
            onClick={handleAssinar}
            disabled={pending}
            className="flex items-center gap-2 rounded-md border border-[#10B981] px-3 py-1.5 text-sm font-medium text-[#10B981] hover:bg-[#10B981]/10 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Marcar como Assinado
          </button>
        )}

        {contrato.status === 'assinado' && !contrato.converted_to_client_id && (
          <button
            onClick={handleConverterCliente}
            disabled={converting}
            className="flex items-center gap-2 rounded-md bg-[#E84500] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Criar Cliente
          </button>
        )}

        {contrato.status === 'assinado' && contrato.converted_to_client_id && (
          <span className="text-xs text-[#10B981] font-medium">Cliente já criado</span>
        )}
      </div>

      {/* Contract content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <iframe
          srcDoc={html}
          className="w-full h-full border-0"
          title="Contrato"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}
