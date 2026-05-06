'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ClientPhase } from '@/types/database'

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createClientAction(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const monthlyRaw = Number(formData.get('monthly_fee'))
  const activationRaw = Number(formData.get('activation_fee'))
  const minMonthsRaw = Number(formData.get('contract_min_months') || 3)

  const payload = {
    name: String(formData.get('name') || '').trim(),
    company: String(formData.get('company') || '').trim(),
    segment: String(formData.get('segment') || '').trim() || null,
    phone: String(formData.get('phone') || '').trim() || null,
    email: String(formData.get('email') || '').trim() || null,
    cnpj: String(formData.get('cnpj') || '').trim() || null,
    monthly_fee:
      formData.get('monthly_fee') && !Number.isNaN(monthlyRaw) && monthlyRaw >= 0
        ? monthlyRaw
        : null,
    activation_fee:
      formData.get('activation_fee') && !Number.isNaN(activationRaw) && activationRaw >= 0
        ? activationRaw
        : null,
    contract_start: String(formData.get('contract_start') || '') || null,
    contract_min_months:
      !Number.isNaN(minMonthsRaw) && minMonthsRaw > 0 ? minMonthsRaw : 3,
    phase: String(formData.get('phase') || 'onboarding') as ClientPhase,
  }

  if (!payload.name || !payload.company) {
    return { error: 'Nome e empresa são obrigatórios.' }
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert(payload)
    .select()
    .single()
  if (error) return { error: error.message }

  if (payload.phase === 'onboarding' && client) {
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
  }

  revalidatePath('/clientes')
  revalidatePath('/projetos')
  return { ok: true }
}

export async function updateClientAction(id: string, formData: FormData) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const monthlyRaw = Number(formData.get('monthly_fee'))
  const activationRaw = Number(formData.get('activation_fee'))
  const minMonthsRaw = Number(formData.get('contract_min_months') || 3)

  const update = {
    name: String(formData.get('name') || '').trim(),
    company: String(formData.get('company') || '').trim(),
    segment: String(formData.get('segment') || '').trim() || null,
    phone: String(formData.get('phone') || '').trim() || null,
    email: String(formData.get('email') || '').trim() || null,
    cnpj: String(formData.get('cnpj') || '').trim() || null,
    monthly_fee:
      formData.get('monthly_fee') && !Number.isNaN(monthlyRaw) && monthlyRaw >= 0
        ? monthlyRaw
        : null,
    activation_fee:
      formData.get('activation_fee') && !Number.isNaN(activationRaw) && activationRaw >= 0
        ? activationRaw
        : null,
    contract_start: String(formData.get('contract_start') || '') || null,
    contract_min_months:
      !Number.isNaN(minMonthsRaw) && minMonthsRaw > 0 ? minMonthsRaw : 3,
    phase: String(formData.get('phase') || 'onboarding') as ClientPhase,
    notes: String(formData.get('notes') || '').trim() || null,
  }

  if (!update.name || !update.company) {
    return { error: 'Nome e empresa são obrigatórios.' }
  }

  const { error } = await supabase.from('clients').update(update).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/clientes')
  revalidatePath('/dashboard')
  return { ok: true }
}
