import { Truck } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

export default function FornecedoresPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        subtitle="Rede de parceiros e referências de preço."
      />
      <EmptyState
        icon={Truck}
        title="Catálogo de fornecedores chega na Fase 2"
      />
    </div>
  )
}
