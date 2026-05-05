import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { CRMBoard } from '@/components/crm/CRMBoard'
import type { Lead, LeadTask } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function CRMPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [leadsRes, tasksRes] = await Promise.all([
    supabase.from('leads').select('*').order('position', { ascending: true }),
    supabase
      .from('lead_tasks')
      .select('*')
      .eq('completed', false)
      .gte('due_date', today)
      .not('lead_id', 'is', null)
      .order('due_date', { ascending: true }),
  ])

  const tasks = (tasksRes.data as LeadTask[]) || []
  const nextTaskByLead: Record<string, LeadTask> = {}
  for (const t of tasks) {
    if (t.lead_id && !nextTaskByLead[t.lead_id]) nextTaskByLead[t.lead_id] = t
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        subtitle="Pipeline comercial. Arraste cards entre colunas."
      />
      <CRMBoard
        initialLeads={(leadsRes.data as Lead[]) || []}
        nextTaskByLead={nextTaskByLead}
      />
    </div>
  )
}
