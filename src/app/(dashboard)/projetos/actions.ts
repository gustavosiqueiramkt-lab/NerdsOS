'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TaskPriority, TaskResponsible } from '@/types/database'

const DEFAULT_FLOWS: { name: string; columns: string[] }[] = [
  {
    name: 'Onboarding',
    columns: ['A Fazer', 'Em Andamento', 'Aguardando Cliente', 'Concluído'],
  },
  {
    name: 'Performance',
    columns: ['Planejamento', 'Criação', 'Aprovação', 'No Ar', 'Otimização'],
  },
  {
    name: 'Criação',
    columns: ['Briefing', 'Produção', 'Revisão', 'Aprovado', 'Entregue'],
  },
  {
    name: 'Audiovisual',
    columns: ['Roteiro', 'Captação', 'Edição', 'Aprovação', 'Entregue'],
  },
]

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function ensureDefaultFlows() {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('task_flows')
    .select('id')
    .limit(1)
  if (existing && existing.length > 0) return

  for (let i = 0; i < DEFAULT_FLOWS.length; i++) {
    const flow = DEFAULT_FLOWS[i]
    const { data: created, error } = await supabase
      .from('task_flows')
      .insert({ name: flow.name, position: i })
      .select()
      .single()
    if (error || !created) continue
    await supabase.from('task_columns').insert(
      flow.columns.map((name, j) => ({
        flow_id: (created as { id: string }).id,
        name,
        position: j,
      }))
    )
  }
}

// ============ FLOWS ============

export async function createFlow(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Nome obrigatório.' }
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const { data: max } = await supabase
    .from('task_flows')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .single()
  const nextPos = max ? Number((max as { position: number }).position) + 1 : 0
  const { data, error } = await supabase
    .from('task_flows')
    .insert({ name: trimmed, position: nextPos })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true, flow: data }
}

export async function renameFlow(id: string, name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Nome obrigatório.' }
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const { error } = await supabase
    .from('task_flows')
    .update({ name: trimmed })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}

export async function deleteFlow(id: string) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const { error } = await supabase.from('task_flows').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}

// ============ COLUMNS ============

export async function createColumn(flowId: string, name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Nome obrigatório.' }
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const { data: max } = await supabase
    .from('task_columns')
    .select('position')
    .eq('flow_id', flowId)
    .order('position', { ascending: false })
    .limit(1)
    .single()
  const nextPos = max ? Number((max as { position: number }).position) + 1 : 0
  const { data, error } = await supabase
    .from('task_columns')
    .insert({ flow_id: flowId, name: trimmed, position: nextPos })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true, column: data }
}

export async function renameColumn(id: string, name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Nome obrigatório.' }
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const { error } = await supabase
    .from('task_columns')
    .update({ name: trimmed })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}

export async function deleteColumn(id: string) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const { error } = await supabase.from('task_columns').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}

// ============ TASKS ============

export interface TaskInput {
  flow_id: string
  column_id: string
  title: string
  description?: string | null
  client_id?: string | null
  responsible?: TaskResponsible | null
  due_date?: string | null
  priority?: TaskPriority
}

export async function createTask(input: TaskInput) {
  if (!input.title?.trim()) return { error: 'Título obrigatório.' }
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const { data: max } = await supabase
    .from('flow_tasks')
    .select('position')
    .eq('column_id', input.column_id)
    .order('position', { ascending: false })
    .limit(1)
    .single()
  const nextPos = max ? Number((max as { position: number }).position) + 1 : 0

  const { error } = await supabase.from('flow_tasks').insert({
    flow_id: input.flow_id,
    column_id: input.column_id,
    title: input.title.trim(),
    description: input.description || null,
    client_id: input.client_id || null,
    responsible: input.responsible || null,
    due_date: input.due_date || null,
    priority: input.priority || 'medium',
    position: nextPos,
  })
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}

export async function updateTask(id: string, patch: Partial<TaskInput>) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const cleaned: Record<string, unknown> = {}
  if (patch.title !== undefined) cleaned.title = patch.title.trim()
  if (patch.description !== undefined)
    cleaned.description = patch.description || null
  if (patch.client_id !== undefined) cleaned.client_id = patch.client_id || null
  if (patch.responsible !== undefined)
    cleaned.responsible = patch.responsible || null
  if (patch.due_date !== undefined) cleaned.due_date = patch.due_date || null
  if (patch.priority !== undefined) cleaned.priority = patch.priority
  if (patch.column_id !== undefined) cleaned.column_id = patch.column_id

  const { error } = await supabase
    .from('flow_tasks')
    .update(cleaned)
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}

export async function moveTask(
  id: string,
  toColumnId: string,
  toPosition: number
) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const { error } = await supabase
    .from('flow_tasks')
    .update({ column_id: toColumnId, position: toPosition })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}

export async function deleteTask(id: string) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }
  const { error } = await supabase.from('flow_tasks').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}
