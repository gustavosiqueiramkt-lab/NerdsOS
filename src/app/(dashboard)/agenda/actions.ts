'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createCalendarEvent } from '@/lib/google-calendar'
import type { LeadTaskType } from '@/types/database'

const VALID_TYPES: LeadTaskType[] = [
  'task',
  'followup',
  'call',
  'meeting',
  'email',
  'note',
  'whatsapp',
  'outro',
]

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createAgendaTask(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const title = String(formData.get('title') || '').trim()
  if (!title) return { error: 'Título obrigatório.' }

  const dueLocal = String(formData.get('due_at') || '')
  const due = dueLocal ? new Date(dueLocal).toISOString() : null

  const leadId = String(formData.get('lead_id') || '') || null
  const rawType = String(formData.get('type') || 'task') as LeadTaskType
  const type = VALID_TYPES.includes(rawType) ? rawType : 'task'
  const description = String(formData.get('description') || '').trim() || undefined

  const { error } = await supabase.from('lead_tasks').insert({
    lead_id: leadId,
    title,
    due_date: due,
    type,
  })

  if (error) return { error: error.message }

  // Mirror to Google Calendar if the user is connected and has a due date
  if (due) {
    let calendarTitle = title
    if (leadId) {
      const { data: lead } = await supabase
        .from('leads')
        .select('name, company')
        .eq('id', leadId)
        .maybeSingle()
      if (lead) {
        const clientName = (lead.company || lead.name) as string
        calendarTitle = `${clientName} | ${title}`
      }
    }
    await createCalendarEvent(user.id, { title: calendarTitle, description, start: due }).catch(() => null)
  }

  revalidatePath('/agenda')
  revalidatePath('/crm')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function toggleAgendaTask(id: string, completed: boolean) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { error } = await supabase
    .from('lead_tasks')
    .update({ completed })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/agenda')
  revalidatePath('/crm')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function disconnectGoogleCalendar() {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  await supabase.from('google_tokens').delete().eq('user_id', user.id)
  revalidatePath('/agenda')
  return { ok: true }
}
