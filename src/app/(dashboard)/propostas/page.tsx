import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

export default function PropostasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Propostas"
        subtitle="Geração de propostas com IA + PDF."
      />
      <EmptyState
        icon={FileText}
        title="Gerador de propostas chega na Fase 2"
        description="Integração com Anthropic, catálogo de serviços, PDF assinável."
      />
    </div>
  )
}
