'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { runApifyScraper, getApifyRunStatus, getApifyDataset, calcScore } from '@/lib/apify'
import { sendWhatsAppMessage } from '@/lib/evolution-api'
import type { ProspeccaoLeadStatus } from '@/types/database'

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

// ── Busca ─────────────────────────────────────────────────────────────────────

export async function iniciarBusca(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const termoBusca = String(formData.get('termo_busca') || '').trim()
  const cidade = String(formData.get('cidade') || '').trim() || null

  if (!termoBusca) return { error: 'Informe o termo de busca.' }

  let apifyRunId: string | null = null
  try {
    apifyRunId = await runApifyScraper(termoBusca, cidade ?? '', 100)
  } catch (err) {
    return { error: String(err) }
  }

  const { data, error } = await supabase
    .from('prospeccao_buscas')
    .insert({
      termo_busca: termoBusca,
      cidade,
      status: 'executando',
      total_encontrados: 0,
      apify_run_id: apifyRunId,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/prospeccao')
  return { ok: true, buscaId: data.id }
}

export async function verificarBusca(buscaId: string) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: busca, error: buscaErr } = await supabase
    .from('prospeccao_buscas')
    .select('*')
    .eq('id', buscaId)
    .single()

  if (buscaErr || !busca) return { error: 'Busca não encontrada.' }
  if (!busca.apify_run_id) return { error: 'Run ID ausente.' }
  if (busca.status === 'concluida') return { ok: true, status: 'concluida' }

  let runStatus: Awaited<ReturnType<typeof getApifyRunStatus>>
  try {
    runStatus = await getApifyRunStatus(busca.apify_run_id)
  } catch (err) {
    return { error: String(err) }
  }

  if (runStatus.status === 'RUNNING' || runStatus.status === 'READY') {
    return { ok: true, status: 'executando' }
  }

  if (runStatus.status !== 'SUCCEEDED') {
    await supabase
      .from('prospeccao_buscas')
      .update({ status: 'erro' })
      .eq('id', buscaId)
    revalidatePath('/prospeccao')
    return { error: `Apify run falhou: ${runStatus.status}` }
  }

  const places = await getApifyDataset(runStatus.defaultDatasetId!)

  const leads = places.map((p) => ({
    busca_id: buscaId,
    nome_empresa: p.title,
    endereco: p.address ?? null,
    cidade: p.city ?? busca.cidade,
    segmento: p.categoryName ?? null,
    telefone: p.phone ?? null,
    website: p.website ?? null,
    instagram: p.socialMedia?.instagram ?? null,
    google_maps_url: p.url ?? null,
    google_rating: p.totalScore ?? null,
    google_reviews_count: p.reviewsCount ?? null,
    sem_website: !p.website,
    score_oportunidade: calcScore(p),
    status: 'novo' as ProspeccaoLeadStatus,
  }))

  if (leads.length > 0) {
    const { error: insertErr } = await supabase
      .from('prospeccao_leads')
      .insert(leads)
    if (insertErr) return { error: insertErr.message }
  }

  await supabase
    .from('prospeccao_buscas')
    .update({ status: 'concluida', total_encontrados: leads.length })
    .eq('id', buscaId)

  revalidatePath('/prospeccao')
  return { ok: true, status: 'concluida', total: leads.length }
}

// ── Envio WhatsApp ─────────────────────────────────────────────────────────────

export async function enviarMensagem(leadId: string) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: config } = await supabase
    .from('prospeccao_config')
    .select('*')
    .single()

  if (!config?.evolution_instance || !config?.evolution_token) {
    return { error: 'Evolution API não configurada. Acesse Configurações.' }
  }

  // Verifica limite diário
  const hoje = new Date().toISOString().slice(0, 10)
  const { count } = await supabase
    .from('prospeccao_leads')
    .select('id', { count: 'exact', head: true })
    .eq('mensagem_enviada', true)
    .gte('enviada_em', `${hoje}T00:00:00`)
    .lt('enviada_em', `${hoje}T23:59:59`)

  if ((count ?? 0) >= (config.limite_diario ?? 20)) {
    return { error: `Limite diário de ${config.limite_diario} mensagens atingido.` }
  }

  const { data: lead } = await supabase
    .from('prospeccao_leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (!lead) return { error: 'Lead não encontrado.' }
  if (!lead.telefone) return { error: 'Lead sem telefone cadastrado.' }
  if (lead.mensagem_enviada) return { error: 'Mensagem já enviada para este lead.' }

  const texto = (config.mensagem_template ?? '')
    .replace('{empresa}', lead.nome_empresa)
    .replace('{cidade}', lead.cidade ?? '')

  const { messageId, error: sendErr } = await sendWhatsAppMessage(
    config.evolution_instance,
    lead.telefone,
    texto,
  )

  if (sendErr) return { error: sendErr }

  await supabase
    .from('prospeccao_leads')
    .update({
      mensagem_enviada: true,
      enviada_em: new Date().toISOString(),
      mensagem_texto: texto,
      whatsapp_status: 'enviado',
      status: 'mensagem_enviada',
    })
    .eq('id', leadId)

  revalidatePath('/prospeccao')
  return { ok: true, messageId }
}

export async function enviarFila() {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: config } = await supabase
    .from('prospeccao_config')
    .select('*')
    .single()

  if (!config?.ativo) return { error: 'Prospecção desativada nas configurações.' }

  const hoje = new Date().toISOString().slice(0, 10)
  const { count: enviadosHoje } = await supabase
    .from('prospeccao_leads')
    .select('id', { count: 'exact', head: true })
    .eq('mensagem_enviada', true)
    .gte('enviada_em', `${hoje}T00:00:00`)

  const limite = config.limite_diario ?? 20
  const restante = limite - (enviadosHoje ?? 0)
  if (restante <= 0) return { ok: true, enviados: 0, mensagem: 'Limite diário atingido.' }

  const { data: pendentes } = await supabase
    .from('prospeccao_leads')
    .select('id')
    .eq('mensagem_enviada', false)
    .eq('status', 'novo')
    .not('telefone', 'is', null)
    .order('score_oportunidade', { ascending: false })
    .limit(restante)

  if (!pendentes?.length) return { ok: true, enviados: 0, mensagem: 'Nenhum lead pendente.' }

  let enviados = 0
  for (const { id } of pendentes) {
    const result = await enviarMensagem(id)
    if (!result.error) enviados++
    await new Promise((r) => setTimeout(r, 5000))
  }

  return { ok: true, enviados }
}

// ── Status / CRUD ──────────────────────────────────────────────────────────────

export async function atualizarStatusLead(leadId: string, status: ProspeccaoLeadStatus) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { error } = await supabase
    .from('prospeccao_leads')
    .update({ status })
    .eq('id', leadId)

  if (error) return { error: error.message }
  revalidatePath('/prospeccao')
  return { ok: true }
}

export async function converterParaCRM(leadId: string) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: lead } = await supabase
    .from('prospeccao_leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (!lead) return { error: 'Lead não encontrado.' }

  const { data: crmLead, error: crmErr } = await supabase
    .from('leads')
    .insert({
      name: lead.nome_empresa,
      company: lead.nome_empresa,
      segment: lead.segmento,
      phone: lead.telefone,
      stage: 'sem_contato',
      source: 'prospeccao',
      notes: lead.google_maps_url
        ? `Google Maps: ${lead.google_maps_url}`
        : null,
    })
    .select()
    .single()

  if (crmErr) return { error: crmErr.message }

  await supabase
    .from('prospeccao_leads')
    .update({
      convertido_para_crm: true,
      crm_lead_id: crmLead.id,
      status: 'convertido',
    })
    .eq('id', leadId)

  revalidatePath('/prospeccao')
  revalidatePath('/crm')
  return { ok: true, crmLeadId: crmLead.id }
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function salvarConfig(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Não autorizado.' }

  const payload = {
    evolution_instance: String(formData.get('evolution_instance') || '').trim() || null,
    evolution_token: String(formData.get('evolution_token') || '').trim() || null,
    limite_diario: Math.max(1, Math.min(50, Number(formData.get('limite_diario') || 20))),
    mensagem_template: String(formData.get('mensagem_template') || '').trim(),
    ativo: formData.get('ativo') === 'true',
  }

  const { data: existing } = await supabase
    .from('prospeccao_config')
    .select('id')
    .single()

  if (existing) {
    const { error } = await supabase
      .from('prospeccao_config')
      .update(payload)
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('prospeccao_config').insert(payload)
    if (error) return { error: error.message }
  }

  revalidatePath('/prospeccao')
  return { ok: true }
}
