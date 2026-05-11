import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PropostaCard } from '@/components/propostas/PropostaCard'
import { listProposals } from './actions'

export default async function PropostasPage() {
  const proposals = await listProposals()

  return (
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
  )
}
