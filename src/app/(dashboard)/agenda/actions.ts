'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LeadTaskType } from '@/types/database'

export async function createAgendaTask(formData: FormData) {
  const supabase = await createClient()

  const title = String(formData.get('title') || '').trim()
  if (!title) return { error: 'Título obrigatório.' }

  const dueLocal = String(formData.get('due_at') || '')
  const due = dueLocal ? new Date(dueLocal).toISOString() : null

  const leadId = String(formData.get('lead_id') || '') || null
  const type = (String(formData.get('type') || 'task') as LeadTaskType) || 'task'

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
  const supabase = await createClient()
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
