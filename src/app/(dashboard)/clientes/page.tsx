import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { ClientsTable } from '@/components/dashboard/ClientsTable'
import type { Client } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Carteira ativa, contratos e fases."
      />
      <ClientsTable initial={(data as Client[]) || []} />
    </div>
  )
}
