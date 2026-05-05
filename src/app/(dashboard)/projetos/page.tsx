import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProjetosBoard } from '@/components/projetos/ProjetosBoard'
import { ensureDefaultFlows } from './actions'
import type { FlowTask, TaskColumn, TaskFlow } from '@/types/database'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ flow?: string }>
}

export default async function ProjetosPage({ searchParams }: PageProps) {
  await ensureDefaultFlows()

  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: flows }, { data: clients }] = await Promise.all([
    supabase
      .from('task_flows')
      .select('*')
      .order('position', { ascending: true }),
    supabase
      .from('clients')
      .select('id, company')
      .order('company', { ascending: true }),
  ])

  const flowsList = (flows as TaskFlow[]) || []
  const activeFlowId =
    (sp.flow && flowsList.find((f) => f.id === sp.flow)?.id) ||
    flowsList[0]?.id ||
    null

  let columns: TaskColumn[] = []
  let tasks: FlowTask[] = []

  if (activeFlowId) {
    const [{ data: cols }, { data: tks }] = await Promise.all([
      supabase
        .from('task_columns')
        .select('*')
        .eq('flow_id', activeFlowId)
        .order('position', { ascending: true }),
      supabase
        .from('flow_tasks')
        .select('*')
        .eq('flow_id', activeFlowId)
        .order('position', { ascending: true }),
    ])
    columns = (cols as TaskColumn[]) || []
    tasks = (tks as FlowTask[]) || []
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        subtitle="Quadros de tarefas por fluxo. Drag-and-drop entre colunas."
      />
      <ProjetosBoard
        flows={flowsList}
        activeFlowId={activeFlowId}
        columns={columns}
        tasks={tasks}
        clients={
          (clients as { id: string; company: string }[]) || []
        }
      />
    </div>
  )
}
