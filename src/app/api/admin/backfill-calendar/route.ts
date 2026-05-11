import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCalendarEvent } from '@/lib/google-calendar'

// One-time backfill: creates Google Calendar events for all existing lead_tasks
// that have a due_date. Safe to run multiple times (creates duplicates if re-run).
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check Google Calendar is connected
  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tokenRow) {
    return NextResponse.json(
      { error: 'Google Calendar não conectado. Conecte primeiro na aba Agenda.' },
      { status: 400 },
    )
  }

  // Fetch all tasks with a due date
  const { data: tasks, error: dbError } = await supabase
    .from('lead_tasks')
    .select('id, title, due_date, type, lead:leads(name, company)')
    .not('due_date', 'is', null)
    .order('due_date')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ ok: true, created: 0, skipped: 0, failed: 0, tasks: [] })
  }

  const results: { id: string; title: string; due_date: string; type: string; status: string }[] = []
  let created = 0
  let failed = 0

  for (const task of tasks) {
    const leadRaw = Array.isArray(task.lead) ? task.lead[0] : task.lead
    const lead = leadRaw as { name: string; company: string | null } | null
    const clientName = lead?.company || lead?.name || ''
    const calendarTitle = clientName ? `${clientName} | ${task.title}` : task.title

    const descriptionParts = [`Tipo: ${task.type}`]
    if (lead?.name) descriptionParts.push(`Contato: ${lead.name}`)

    const eventId = await createCalendarEvent(user.id, {
      title: calendarTitle,
      description: descriptionParts.join('\n'),
      start: task.due_date!,
    }).catch(() => null)

    const status = eventId ? 'created' : 'failed'
    if (eventId) created++
    else failed++

    results.push({
      id: task.id,
      title: task.title,
      due_date: task.due_date!,
      type: task.type,
      status,
    })

    // Small pause to avoid hitting Google API rate limits
    await new Promise((r) => setTimeout(r, 150))
  }

  return NextResponse.json({
    ok: true,
    total: tasks.length,
    created,
    failed,
    tasks: results,
  })
}
