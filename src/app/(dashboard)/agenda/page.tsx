import { addDays, format, startOfDay, startOfWeek } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { AgendaView, type TaskWithLead } from '@/components/agenda/AgendaView'
import {
  getCalendarEvents,
  type GoogleCalendarEvent,
} from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    week?: string
    connected?: string
    error?: string
  }>
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const anchor = sp.week ? new Date(sp.week + 'T00:00:00') : new Date()
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)
  const todayStart = startOfDay(new Date())

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    { data: weekRows },
    { data: overdueRows },
    { data: leads },
    { data: tokenRow },
  ] = await Promise.all([
    supabase
      .from('lead_tasks')
      .select('*, lead:leads(id, name, company)')
      .gte('due_date', weekStart.toISOString())
      .lt('due_date', weekEnd.toISOString())
      .order('due_date'),
    supabase
      .from('lead_tasks')
      .select('*, lead:leads(id, name, company)')
      .lt('due_date', todayStart.toISOString())
      .eq('completed', false)
      .order('due_date', { ascending: false })
      .limit(20),
    supabase.from('leads').select('id, name, company').order('name'),
    supabase
      .from('google_tokens')
      .select('id')
      .eq('user_id', user?.id ?? '')
      .maybeSingle(),
  ])

  const isGoogleConnected = !!tokenRow

  let googleEvents: GoogleCalendarEvent[] = []
  if (isGoogleConnected && user) {
    googleEvents = await getCalendarEvents(
      user.id,
      weekStart.toISOString(),
      weekEnd.toISOString(),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Tarefas e atividades da semana, integradas com o CRM."
      />
      <AgendaView
        weekStart={format(weekStart, 'yyyy-MM-dd')}
        weekTasks={(weekRows as TaskWithLead[]) || []}
        overdueTasks={(overdueRows as TaskWithLead[]) || []}
        leads={
          (leads as { id: string; name: string; company: string | null }[]) ||
          []
        }
        isGoogleConnected={isGoogleConnected}
        googleEvents={googleEvents}
        justConnected={sp.connected === 'true'}
        connectionError={sp.error ?? null}
      />
    </div>
  )
}
