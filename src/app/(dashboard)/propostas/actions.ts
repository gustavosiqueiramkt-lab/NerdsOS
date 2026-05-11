'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ProposalContent } from '@/types/proposal'

function buildPrompt(
  clientName: string,
  clientCompany: string | null,
  clientSegment: string,
  clientMarket: string,
  fileText: string | null,
): string {
  const contextBlock = fileText
    ? `\n━━━ CONTEXTO E BRIEFING DO CLIENTE ━━━\n${fileText}\n`
    : '\nNenhum arquivo de contexto fornecido. Use as informações acima para inferir o contexto.\n'

  return `Você é um estrategista sênior de marketing digital da NERDS®, agência especializada em gerar demanda real para empresas através do marketing digital.

Sua tarefa é gerar o conteúdo completo de uma proposta estratégica de marketing no formato JSON abaixo.

━━━ INFORMAÇÕES DO CLIENTE ━━━
Nome: ${clientName}
Empresa: ${clientCompany || 'Não informado'}
Segmento: ${clientSegment}
Mercado/Região: ${clientMarket}
${contextBlock}
━━━ FORMATO DE SAÍDA ━━━

Retorne APENAS o JSON válido abaixo, sem markdown, sem código de bloco, sem texto antes ou depois:

{
  "proposal_cover": {
    "segment_label": "SEGMENTO EM MAIÚSCULAS",
    "title": "Nome do cliente com ponto final",
    "description": "1-2 frases descrevendo o objetivo estratégico desta proposta"
  },
  "diagnostico": {
    "contexto": "2-4 frases sobre o momento atual do negócio, histórico e situação de marketing",
    "maturity_score": 0,
    "maturity_description": "1 frase interpretando o score (ex: Score de 100. O negócio possui produto forte, mas...)",
    "empresa_possui": ["ponto 1", "ponto 2", "ponto 3"],
    "porem_falta": ["ponto 1", "ponto 2", "ponto 3"],
    "gargalo_central": "GARGALO CENTRAL: FRASE EM MAIÚSCULAS IDENTIFICANDO O PRINCIPAL PROBLEMA"
  },
  "swot": {
    "pontos_fortes": ["item 1", "item 2", "item 3", "item 4", "item 5"],
    "pontos_fracos": ["item 1", "item 2", "item 3", "item 4"],
    "riscos_ocultos": ["item 1", "item 2", "item 3", "item 4", "item 5"],
    "evidencias_coletadas": ["item 1", "item 2", "item 3", "item 4", "item 5"]
  },
  "plano_organizacao": {
    "posicionamento": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
    "presenca_digital": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
    "geracao_leads": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
    "processo_comercial": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"]
  },
  "cronograma": {
    "fase1": ["entrega 1", "entrega 2", "entrega 3", "entrega 4", "entrega 5"],
    "fase2": ["atividade 1", "atividade 2", "atividade 3", "atividade 4"],
    "fase3": ["atividade 1", "atividade 2", "atividade 3", "atividade 4"],
    "mapa_oportunidades": ["oportunidade 1", "oportunidade 2", "oportunidade 3"]
  },
  "fase1_estruturacao": {
    "items": [
      {"name": "Nome do Serviço", "description": "Descrição em 1 linha do que será entregue.", "price": 0},
      {"name": "Nome do Serviço", "description": "Descrição em 1 linha do que será entregue.", "price": 0}
    ],
    "adendo": "Recomendação adicional opcional ou null"
  }
}

REGRAS OBRIGATÓRIAS:
- maturity_score deve ser um número inteiro entre 20 e 80
- fase1_estruturacao deve ter 3 a 5 itens com preços realistas em reais (R$ 300 a R$ 3.000 cada)
- prices são números inteiros, sem R$
- Seja específico ao segmento "${clientSegment}" e à região "${clientMarket}"
- As evidências coletadas devem refletir o que foi identificado no briefing
- Todo conteúdo em português do Brasil
- Retorne SOMENTE o JSON`
}

export async function generateAndSaveProposal(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const clientName = String(formData.get('client_name') || '').trim()
  const clientCompany = String(formData.get('client_company') || '').trim() || null
  const clientSegment = String(formData.get('client_segment') || '').trim()
  const clientMarket = String(formData.get('client_market') || '').trim()
  const growthMonthly = Number(formData.get('growth_monthly') || 2000)
  const pulseMonthly = Number(formData.get('pulse_monthly') || 1900)
  const crmSpot = Number(formData.get('crm_spot') || 2500)

  if (!clientName || !clientSegment || !clientMarket) {
    return { error: 'Preencha nome, segmento e mercado do cliente.' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'SUA_CHAVE_GEMINI_AQUI') {
    return { error: 'Chave da API Gemini não configurada. Adicione GEMINI_API_KEY no .env.local.' }
  }

  // Read uploaded context file
  const file = formData.get('context_file') as File | null
  let fileText: string | null = null
  const extraParts: { inlineData: { mimeType: string; data: string } }[] = []

  if (file && file.size > 0) {
    if (file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      extraParts.push({ inlineData: { mimeType: 'application/pdf', data: base64 } })
    } else {
      // TXT or any text-based format
      fileText = await file.text()
    }
  }

  const prompt = buildPrompt(clientName, clientCompany, clientSegment, clientMarket, fileText)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: { responseMimeType: 'application/json' },
    })

    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
      { text: prompt },
      ...extraParts,
    ]

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    })

    const responseText = result.response.text()

    let aiGenerated: Omit<ProposalContent, 'client' | 'financeiro'>
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      aiGenerated = JSON.parse(cleaned)
    } catch {
      return { error: 'A IA retornou um formato inválido. Tente novamente.' }
    }

    const totalSpot = (aiGenerated.fase1_estruturacao?.items ?? []).reduce(
      (sum, item) => sum + (item.price ?? 0),
      0,
    )

    const content: ProposalContent = {
      client: { name: clientName, company: clientCompany, segment: clientSegment, market: clientMarket },
      financeiro: { growth_monthly: growthMonthly, pulse_monthly: pulseMonthly, crm_spot: crmSpot },
      ...aiGenerated,
      fase1_estruturacao: {
        ...aiGenerated.fase1_estruturacao,
        total_spot: totalSpot,
      },
    }

    const { data, error } = await supabase
      .from('proposals')
      .insert({
        title: `${clientName} — ${clientSegment}`,
        client_name: clientName,
        client_company: clientCompany,
        client_segment: clientSegment,
        client_market: clientMarket,
        briefing: fileText,
        maturity_score: content.diagnostico?.maturity_score ?? null,
        total_spot: totalSpot,
        total_monthly: growthMonthly + pulseMonthly,
        status: 'gerada',
        ai_content: content,
      })
      .select('id')
      .single()

    if (error) return { error: `Erro ao salvar proposta: ${error.message}` }

    revalidatePath('/propostas')
    return { id: data.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return { error: `Erro ao gerar proposta: ${msg}` }
  }
}

export async function listProposals() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proposals')
    .select('id, title, client_name, client_segment, client_market, status, total_spot, total_monthly, created_at')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getProposal(id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('proposals').select('*').eq('id', id).single()
  return data
}

export async function deleteProposal(id: string) {
  const supabase = await createClient()
  await supabase.from('proposals').delete().eq('id', id)
  revalidatePath('/propostas')
}
