export interface ProposalPhase1Item {
  name: string
  description: string
  price: number
}

export interface ProposalContent {
  client: {
    name: string
    company: string | null
    segment: string
    market: string
  }
  financeiro: {
    growth_monthly: number
    pulse_monthly: number
    crm_spot: number
  }
  proposal_cover: {
    segment_label: string
    title: string
    description: string
  }
  diagnostico: {
    contexto: string
    maturity_score: number
    maturity_description: string
    empresa_possui: string[]
    porem_falta: string[]
    gargalo_central: string
  }
  swot: {
    pontos_fortes: string[]
    pontos_fracos: string[]
    riscos_ocultos: string[]
    evidencias_coletadas: string[]
  }
  plano_organizacao: {
    posicionamento: string[]
    presenca_digital: string[]
    geracao_leads: string[]
    processo_comercial: string[]
  }
  cronograma: {
    fase1: string[]
    fase2: string[]
    fase3: string[]
    mapa_oportunidades: string[]
  }
  fase1_estruturacao: {
    items: ProposalPhase1Item[]
    total_spot: number
    adendo: string | null
  }
}
