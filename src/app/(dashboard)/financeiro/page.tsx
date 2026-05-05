import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { FinanceiroEditor } from '@/components/financeiro/FinanceiroEditor'
import { ensureMonth } from './actions'
import type { FinancialEntry } from '@/types/database'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const now = new Date()
  const year = Number(sp.year) || now.getFullYear()
  const month = Number(sp.month) || now.getMonth() + 1

  await ensureMonth(year, month)

  const supabase = await createClient()
  const [{ data: entries }, { data: clients }] = await Promise.all([
    supabase
      .from('financial_entries')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .order('type', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('clients')
      .select('id,company')
      .order('company', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        subtitle="Lançamentos do mês. DRE atualizado em tempo real."
      />
      <FinanceiroEditor
        year={year}
        month={month}
        entries={(entries as FinancialEntry[]) || []}
        clients={
          (clients as { id: string; company: string }[]) || []
        }
      />
    </div>
  )
}
