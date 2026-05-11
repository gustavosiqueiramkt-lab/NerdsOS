import { PageHeader } from '@/components/shared/PageHeader'
import { NovaPropostaForm } from '@/components/propostas/NovaPropostaForm'

export default function NovaPropostaPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Nova Proposta"
        subtitle="Preencha os dados do cliente, faça upload do contexto e a IA gera a proposta completa."
      />
      <NovaPropostaForm />
    </div>
  )
}
