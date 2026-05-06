'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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

  const { error } = await supabase.from('lead_tasks').insert({
    lead_id: leadId,
    title,
    due_date: due,
    type,
  })

  if (error) return { error: error.message }

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
