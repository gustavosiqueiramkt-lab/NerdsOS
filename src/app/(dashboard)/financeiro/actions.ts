'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FinancialEntry } from '@/types/database'

const REVENUE_DEFAULTS = [
  'Retainer / LP + Tráfego',
  'Gestão de Redes Sociais',
  'Projetos Audiovisual',
  'Identidade Visual / Branding',
  'Outros',
]

const FIXED_COST_DEFAULTS: Array<{
  category: string
  amount: number
  description: string
}> = [
  { category: 'Contador', amount: 200, description: 'Honorários contábeis' },
  { category: 'Ferramentas', amount: 200, description: 'Canva, Google Workspace' },
  {
    category: 'Domínio + Hospedagem',
    amount: 60,
    description: 'Domínio + Hospedagem + E-mail',
  },
  {
    category: 'Software de gestão',
    amount: 100,
    description: 'CRM e ferramentas de gestão',
  },
  { category: 'Pró-labore Sócio 1', amount: 0, description: '' },
  { category: 'Pró-labore Sócio 2', amount: 0, description: '' },
]

export async function ensureMonth(year: number, month: number) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('financial_entries')
    .select('type')
    .eq('year', year)
    .eq('month', month)

  const types = new Set((existing || []).map((r: { type: string }) => r.type))
  const inserts: Partial<FinancialEntry>[] = []

  if (!types.has('revenue')) {
    REVENUE_DEFAULTS.forEach((category) =>
      inserts.push({
        year,
        month,
        type: 'revenue',
        category,
        amount: 0,
        is_recurring: false,
      })
    )
  }

  if (!types.has('fixed_cost')) {
    FIXED_COST_DEFAULTS.forEach((d) =>
      inserts.push({
        year,
        month,
        type: 'fixed_cost',
        category: d.category,
        amount: d.amount,
        description: d.description || null,
        is_recurring: true,
      })
    )
  }

  if (inserts.length) {
    await supabase.from('financial_entries').insert(inserts)
  }
}

export async function addEntry(
  year: number,
  month: number,
  type: 'revenue' | 'direct_cost' | 'fixed_cost'
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('financial_entries')
    .insert({ year, month, type, category: '', amount: 0 })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/financeiro')
  return { ok: true, entry: data as FinancialEntry }
}

export async function patchEntry(
  id: string,
  patch: {
    category?: string
    amount?: number
    description?: string | null
    client_id?: string | null
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('financial_entries')
    .update(patch)
    .eq('id', id)
  if (error) return { error: error.message }
  // Skip revalidate — client owns optimistic state for keystroke updates.
  return { ok: true }
}

export async function deleteEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('financial_entries')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/financeiro')
  return { ok: true }
}
