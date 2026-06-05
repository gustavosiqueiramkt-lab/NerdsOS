'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createCalendarEvent } from '@/lib/google-calendar'
import type {
  LeadStage,
  LeadSource,
  LeadActivityType,
  LeadTaskType,
} from '@/types/database'

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createLead(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const spotRaw = Number(formData.get('spot_value'))
  const feeRaw = Number(formData.get('fee_value'))
  const feeMonthsRaw = Number(formData.get('fee_months'))
  const maturityRaw = Number(formData.get('maturity_score'))

  const spotValue = formData.get('spot_value') && !Number.isNaN(spotRaw) && spotRaw >= 0 ? spotRaw : null
  const feeValue = formData.get('fee_value') && !Number.isNaN(feeRaw) && feeRaw >= 0 ? feeRaw : null
  const feeMonths = formData.get('fee_months') && !Number.isNaN(feeMonthsRaw) && feeMonthsRaw > 0 ? Math.floor(feeMonthsRaw) : null
  const computedTotal = (spotValue || 0) + (feeValue || 0) * (feeMonths || 0)

  const payload = {
    name: String(formData.get('name') || '').trim(),
    company: String(formData.get('company') || '').trim() || null,
    segment: String(formData.get('segment') || '').trim() || null,
    phone: String(formData.get('phone') || '').trim() || null,
    email: String(formData.get('email') || '').trim() || null,
    stage: String(formData.get('stage') || 'sem_contato') as LeadStage,
    source: String(formData.get('source') || 'manual') as LeadSource,
    spot_value: spotValue,
    fee_value: feeValue,
    fee_months: feeMonths,
    proposal_value: computedTotal > 0 ? computedTotal : null,
    maturity_score:
      formData.get('maturity_score') && !Number.isNaN(maturityRaw)
        ? Math.min(100, Math.max(0, maturityRaw))
        : null,
    notes: String(formData.get('notes') || '').trim() || null,
  }

  if (!payload.name) return { error: 'Nome do lead é obrigatório.' }

  const { error } = await supabase.from('leads').insert(payload)
  if (error) return { error: error.message }

  revalidatePath('/crm')
  return { ok: true }
}

export async function updateLead(id: string, formData: FormData) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const spotRaw = Number(formData.get('spot_value'))
  const feeRaw = Number(formData.get('fee_value'))
  const feeMonthsRaw = Number(formData.get('fee_months'))
  const maturityRaw = Number(formData.get('maturity_score'))

  const spotValue = formData.get('spot_value') && !Number.isNaN(spotRaw) && spotRaw >= 0 ? spotRaw : null
  const feeValue = formData.get('fee_value') && !Number.isNaN(feeRaw) && feeRaw >= 0 ? feeRaw : null
  const feeMonths = formData.get('fee_months') && !Number.isNaN(feeMonthsRaw) && feeMonthsRaw > 0 ? Math.floor(feeMonthsRaw) : null
  const computedTotal = (spotValue || 0) + (feeValue || 0) * (feeMonths || 0)

  const update: Record<string, unknown> = {
    name: String(formData.get('name') || '').trim(),
    company: String(formData.get('company') || '').trim() || null,
    segment: String(formData.get('segment') || '').trim() || null,
    phone: String(formData.get('phone') || '').trim() || null,
    email: String(formData.get('email') || '').trim() || null,
    stage: String(formData.get('stage') || 'sem_contato'),
    source: String(formData.get('source') || 'manual'),
    notes: String(formData.get('notes') || '').trim() || null,
    spot_value: spotValue,
    fee_value: feeValue,
    fee_months: feeMonths,
    proposal_value: computedTotal > 0 ? computedTotal : null,
    maturity_score:
      formData.get('maturity_score') && !Number.isNaN(maturityRaw)
        ? Math.min(100, Math.max(0, maturityRaw))
        : null,
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) return { error: error.message }

  revalidatePath('/crm')
  return { ok: true, lead }
}

export async function moveLead(
  id: string,
  toStage: LeadStage,
  toPosition: number
) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { error } = await supabase
    .from('leads')
    .update({ stage: toStage, position: toPosition })
    .eq('id', id)
  if (error) return { error: error.message }

  await supabase.from('lead_activities').insert({
    lead_id: id,
    type: 'stage_change',
    description: `Movido para ${toStage.replace('_', ' ')}`,
  })

  revalidatePath('/crm')
  return { ok: true }
}

export async function addActivity(
  leadId: string,
  type: LeadActivityType,
  description: string,
  scheduledAt?: string | null
) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  if (!description.trim()) return { error: 'Descrição obrigatória.' }

  const { error } = await supabase.from('lead_activities').insert({
    lead_id: leadId,
    type,
    description: description.trim(),
    scheduled_at: scheduledAt || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/crm')
  return { ok: true }
}

export async function addLeadTask(
  leadId: string,
  title: string,
  dueDate: string | null,
  type: LeadTaskType = 'task'
) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  if (!title.trim()) return { error: 'Título obrigatório.' }

  const { error } = await supabase.from('lead_tasks').insert({
    lead_id: leadId,
    title: title.trim(),
    due_date: dueDate || null,
    type,
  })
  if (error) return { error: error.message }

  if (dueDate) {
    const { data: lead } = await supabase
      .from('leads')
      .select('name, company')
      .eq('id', leadId)
      .maybeSingle()
    const clientName = (lead?.company || lead?.name || '') as string
    const calendarTitle = clientName ? `${clientName} | ${title.trim()}` : title.trim()
    await createCalendarEvent(user.id, { title: calendarTitle, start: dueDate }).catch(() => null)
  }

  revalidatePath('/crm')
  return { ok: true }
}

export async function toggleLeadTask(taskId: string, completed: boolean) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { error } = await supabase
    .from('lead_tasks')
    .update({ completed })
    .eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath('/crm')
  return { ok: true }
}

export async function deleteLeadTask(taskId: string) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { error } = await supabase
    .from('lead_tasks')
    .delete()
    .eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath('/crm')
  return { ok: true }
}

export async function deleteLead(id: string) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/crm')
  return { ok: true }
}

export async function convertLeadToClient(leadId: string, monthlyFee: number) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  if (!monthlyFee || Number.isNaN(monthlyFee) || monthlyFee < 0)
    return { error: 'Ticket mensal inválido.' }

  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()
  if (leadErr || !lead) return { error: leadErr?.message || 'Lead não encontrado' }

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert({
      name: lead.name,
      company: lead.company || lead.name,
      segment: lead.segment,
      phone: lead.phone,
      email: lead.email,
      monthly_fee: monthlyFee || lead.fee_value || lead.proposal_value || null,
      contract_start: new Date().toISOString().slice(0, 10),
      contract_min_months: lead.fee_months || 3,
      phase: 'onboarding',
      upsell_opportunity: false,
      lead_id: lead.id,
    })
    .select()
    .single()

  if (clientErr || !client) return { error: clientErr?.message }

  await supabase
    .from('leads')
    .update({ stage: 'fechado', converted_to_client_id: client.id })
    .eq('id', leadId)

  const { data: templates } = await supabase
    .from('onboarding_checklist_template')
    .select('id')
  if (templates?.length) {
    await supabase.from('client_onboarding').insert(
      templates.map((t: { id: string }) => ({
        client_id: client.id,
        template_id: t.id,
        status: 'pendente' as const,
      }))
    )
  }

  await supabase.from('projects').insert({
    client_id: client.id,
    name: `Onboarding — ${client.company}`,
    board_phase: 'onboarding',
    started_at: new Date().toISOString().slice(0, 10),
  })

  revalidatePath('/crm')
  revalidatePath('/clientes')
  revalidatePath('/projetos')
  return { ok: true, clientId: client.id }
}
