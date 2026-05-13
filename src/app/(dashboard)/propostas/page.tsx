import Link from 'next/link'
import { Plus, FileText, FileSignature } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PropostaCard } from '@/components/propostas/PropostaCard'
import { ContratoCard } from '@/components/propostas/ContratoCard'
import { NovoContratoModal } from '@/components/propostas/NovoContratoModal'
import { listProposals } from './actions'
import { createClient } from '@/lib/supabase/server'
import type { Contrato, Service } from '@/types/database'

export default async function PropostasPage() {
  const supabase = await createClient()

  const [proposals, contratosResult, servicesResult] = await Promise.all([
    listProposals(),
    supabase.from('contratos').select('*').neq('status', 'cancelado').order('created_at', { ascending: false }),
    supabase.from('services').select('*').eq('active', true).order('position'),
  ])

  const contratos = (contratosResult.data ?? []) as Contrato[]
  const services = (servicesResult.data ?? []) as Service[]

  return (
    <div className="space-y-8">
      {/* ── Propostas ── */}
      <div className="space-y-6">
        <PageHeader
          title="Propostas"
          subtitle="Geração de propostas estratégicas com IA."
          action={
            <Link
              href="/propostas/nova"
              className="flex items-center gap-2 rounded-lg bg-[#E84500] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={15} />
              Nova Proposta
            </Link>
          }
        />

        {proposals.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma proposta gerada ainda"
            description="Clique em Nova Proposta, preencha os dados do cliente e faça upload do briefing."
          />
        ) : (
          <div className="space-y-3">
            {proposals.map((p) => (
              <PropostaCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>

      {/* ── Contratos ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-[#E84500]" />
              Contratos
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
              Gere, assine e converta contratos para a aba de Clientes.
            </p>
          </div>
          <NovoContratoModal services={services} />
        </div>

        {contratos.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title="Nenhum contrato gerado ainda"
            description="Clique em Novo Contrato para gerar um contrato Spot ou Recorrente."
          />
        ) : (
          <div className="space-y-2">
            {contratos.map((c) => (
              <ContratoCard key={c.id} contrato={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
