// Domain types — mirror the Supabase schema declared in the SQL bootstrap.
// Kept hand-written (no codegen) so the types stay readable and editable.

import type { ProposalContent } from './proposal'

export type LeadStage =
  | 'sem_contato'
  | 'contato_feito'
  | 'proposta_enviada'
  | 'negociacao'
  | 'fechado'
  | 'perdido'

export type LeadSource =
  | 'manual'
  | 'meta_ads'
  | 'google_forms'
  | 'indicacao'
  | 'site'
  | 'prospeccao'

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  name: string
  company: string | null
  segment: string | null
  phone: string | null
  email: string | null
  stage: LeadStage
  proposal_value: number | null
  spot_value: number | null
  fee_value: number | null
  fee_months: number | null
  proposal_sent_at: string | null
  maturity_score: number | null
  source: LeadSource
  next_action: string | null
  next_action_at: string | null
  notes: string | null
  position: number
  converted_to_client_id: string | null
}

export type LeadActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'whatsapp'
  | 'stage_change'
  | 'proposal'
  | 'system'

export interface LeadActivity {
  id: string
  created_at: string
  lead_id: string
  type: LeadActivityType
  description: string
  scheduled_at: string | null
  completed: boolean
}

export type LeadTaskType =
  | 'task'
  | 'followup'
  | 'call'
  | 'meeting'
  | 'email'
  | 'note'
  | 'whatsapp'
  | 'outro'

export interface LeadTask {
  id: string
  created_at: string
  lead_id: string | null
  title: string
  due_date: string | null
  completed: boolean
  type: LeadTaskType
}

export const LEAD_TASK_TYPE_LABEL: Record<LeadTaskType, string> = {
  call: 'Ligação',
  meeting: 'Reunião',
  followup: 'Follow-up',
  email: 'E-mail',
  note: 'Nota',
  whatsapp: 'WhatsApp',
  outro: 'Outro',
  task: 'Tarefa',
}

export const LEAD_TASK_TYPE_COLOR: Record<LeadTaskType, string> = {
  call: '#4ECDC4',
  meeting: '#A78BFA',
  followup: '#F59E0B',
  email: '#60A5FA',
  note: '#9CA3AF',
  whatsapp: '#22C55E',
  outro: '#6B7280',
  task: '#9CA3AF',
}

export const LEAD_ACTIVITY_TYPE_LABEL: Record<LeadActivityType, string> = {
  call: 'Ligação',
  meeting: 'Reunião',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  note: 'Nota',
  stage_change: 'Mudança de estágio',
  proposal: 'Proposta',
  system: 'Sistema',
}

export type ClientPhase =
  | 'onboarding'
  | 'estruturacao'
  | 'gestao_ativa'
  | 'pausado'
  | 'encerrado'

export interface Client {
  id: string
  created_at: string
  updated_at: string
  name: string
  company: string
  segment: string | null
  phone: string | null
  email: string | null
  cnpj: string | null
  monthly_fee: number | null
  activation_fee: number | null
  contract_start: string | null
  contract_end: string | null
  contract_min_months: number
  phase: ClientPhase
  active_services: string[] | null
  upsell_opportunity: boolean
  notes: string | null
  lead_id: string | null
}

export interface OnboardingTemplate {
  id: string
  position: number
  phase: string
  task: string
  responsible: 'CEO' | 'COO' | 'Ambos' | string
  sla_days: number | null
}

export type OnboardingStatus =
  | 'pendente'
  | 'em_andamento'
  | 'feito'
  | 'bloqueado'

export interface ClientOnboardingItem {
  id: string
  created_at: string
  updated_at: string
  client_id: string
  template_id: string
  status: OnboardingStatus
  notes: string | null
  completed_at: string | null
}

export type BoardPhase =
  | 'onboarding'
  | 'estruturacao'
  | 'gestao_ativa'
  | 'pausado'

export interface Project {
  id: string
  created_at: string
  updated_at: string
  client_id: string
  name: string
  description: string | null
  board_phase: BoardPhase
  position: number
  started_at: string | null
  estimated_end: string | null
}

export interface ProjectTask {
  id: string
  created_at: string
  updated_at: string
  project_id: string
  client_id: string | null
  title: string
  description: string | null
  responsible: 'CEO' | 'COO' | 'Ambos' | 'Fornecedor' | null
  sla_days: number | null
  due_date: string | null
  status: OnboardingStatus
  is_recurring: boolean
  recurrence: 'mensal' | 'quinzenal' | 'semanal' | null
  completed_at: string | null
}

export type ServiceCategory = 'spot' | 'content' | 'performance'

export interface Service {
  id: string
  created_at: string
  name: string
  category: ServiceCategory
  subcategory: string | null
  price: number
  hours_min: number | null
  hours_max: number | null
  description: string | null
  scope_notes: string | null
  is_recurring: boolean
  billing_period: 'unico' | 'mensal' | 'trimestral' | null
  active: boolean
  position: number
}

export type ProposalStatus =
  | 'rascunho'
  | 'gerada'
  | 'enviada'
  | 'aprovada'
  | 'rejeitada'

export interface Proposal {
  id: string
  created_at: string
  updated_at: string
  lead_id: string | null
  title: string
  client_name: string
  client_company: string | null
  client_segment: string | null
  client_market: string | null
  briefing: string | null
  maturity_score: number | null
  services: string[] | null
  total_spot: number
  total_monthly: number
  status: ProposalStatus
  pdf_url: string | null
  ai_content: ProposalContent | null
  sent_at: string | null
  approved_at: string | null
}

export interface TaskFlow {
  id: string
  created_at: string
  updated_at: string
  name: string
  position: number
}

export interface TaskColumn {
  id: string
  created_at: string
  updated_at: string
  flow_id: string
  name: string
  position: number
}

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskResponsible = 'CEO' | 'COO' | 'Ambos' | 'Fornecedor'

export interface FlowTask {
  id: string
  created_at: string
  updated_at: string
  flow_id: string
  column_id: string
  title: string
  description: string | null
  client_id: string | null
  responsible: TaskResponsible | null
  due_date: string | null
  priority: TaskPriority
  position: number
}

export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

export interface FinancialEntry {
  id: string
  created_at: string
  updated_at: string
  year: number
  month: number
  type: 'revenue' | 'direct_cost' | 'fixed_cost'
  category: string
  amount: number
  client_id: string | null
  description: string | null
  is_recurring: boolean
}

export interface Supplier {
  id: string
  created_at: string
  updated_at: string
  name: string
  specialty: string
  contact: string | null
  cnpj_cpf: string | null
  email: string | null
  reference_price: number | null
  avg_delivery_days: number | null
  rating: number | null
  notes: string | null
  active: boolean
}

export const LEAD_STAGES: { id: LeadStage; label: string }[] = [
  { id: 'sem_contato', label: 'Sem Contato' },
  { id: 'contato_feito', label: 'Contato Feito' },
  { id: 'proposta_enviada', label: 'Proposta Enviada' },
  { id: 'negociacao', label: 'Negociação' },
  { id: 'fechado', label: 'Fechado' },
  { id: 'perdido', label: 'Lost' },
]

export const BOARD_PHASES: { id: BoardPhase; label: string }[] = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'estruturacao', label: 'Estruturação' },
  { id: 'gestao_ativa', label: 'Gestão Ativa' },
  { id: 'pausado', label: 'Em Pausa' },
]

export const SOURCE_LABEL: Record<LeadSource, string> = {
  manual: 'Manual',
  meta_ads: 'Meta Ads',
  google_forms: 'Forms',
  indicacao: 'Indicação',
  site: 'Site',
  prospeccao: 'Prospecção',
}

// ─── Prospecção ───────────────────────────────────────────────────────────────

export type ProspeccaoLeadStatus =
  | 'novo'
  | 'mensagem_enviada'
  | 'respondeu'
  | 'convertido'
  | 'descartado'

export type ProspeccaoBuscaStatus =
  | 'pendente'
  | 'executando'
  | 'concluida'
  | 'erro'

export interface ProspeccaoBusca {
  id: string
  created_at: string
  termo_busca: string
  cidade: string | null
  status: ProspeccaoBuscaStatus
  total_encontrados: number
  apify_run_id: string | null
  user_id: string
}

export interface ProspeccaoLead {
  id: string
  created_at: string
  busca_id: string | null
  nome_empresa: string
  endereco: string | null
  cidade: string | null
  segmento: string | null
  telefone: string | null
  website: string | null
  instagram: string | null
  google_maps_url: string | null
  google_rating: number | null
  google_reviews_count: number | null
  sem_website: boolean
  score_oportunidade: number
  mensagem_enviada: boolean
  enviada_em: string | null
  mensagem_texto: string | null
  whatsapp_status: 'pendente' | 'enviado' | 'entregue' | 'lido' | 'respondeu' | null
  convertido_para_crm: boolean
  crm_lead_id: string | null
  status: ProspeccaoLeadStatus
}

export interface ProspeccaoConfig {
  id: string
  limite_diario: number
  evolution_instance: string | null
  evolution_token: string | null
  mensagem_template: string
  ativo: boolean
}

export const PROSPECCAO_STATUS_LABEL: Record<ProspeccaoLeadStatus, string> = {
  novo: 'Novo',
  mensagem_enviada: 'Mensagem Enviada',
  respondeu: 'Respondeu',
  convertido: 'Convertido',
  descartado: 'Descartado',
}

export const PROSPECCAO_STATUS_COLOR: Record<ProspeccaoLeadStatus, string> = {
  novo: '#6B7280',
  mensagem_enviada: '#3B82F6',
  respondeu: '#10B981',
  convertido: '#8B5CF6',
  descartado: '#EF4444',
}

// ─── Contratos ────────────────────────────────────────────────────────────────

export type ContratoType = 'spot' | 'fee'
export type ContratoStatus = 'gerado' | 'assinado' | 'cancelado'

export interface ContratoServico {
  id: string
  name: string
  price: number
}

export interface Contrato {
  id: string
  created_at: string
  type: ContratoType
  status: ContratoStatus
  signed_at: string | null
  razao_social: string
  cnpj: string
  endereco: string
  nome_representante: string
  rg_representante: string
  cpf_representante: string
  // Spot
  servicos_contratados: ContratoServico[] | null
  valor_total: number | null
  forma_pagamento: 'integral' | '30_70' | '50_50' | null
  // Fee
  plano: 'start' | 'growth' | 'scale' | null
  fee_mensal: number | null
  taxa_ativacao: number | null
  plano_conteudo: 'pulse' | 'flow' | 'engine' | null
  dia_vencimento: number | null
  converted_to_client_id: string | null
}

export const CONTRATO_STATUS_LABEL: Record<ContratoStatus, string> = {
  gerado: 'Gerado',
  assinado: 'Assinado',
  cancelado: 'Cancelado',
}

export const CONTRATO_STATUS_COLOR: Record<ContratoStatus, string> = {
  gerado: '#F59E0B',
  assinado: '#10B981',
  cancelado: '#6B7280',
}

export const PLANO_FEE_DEFAULTS: Record<'start' | 'growth' | 'scale', { fee: number; ativacao: number; meses_min: number }> = {
  start:  { fee: 2800, ativacao: 900,  meses_min: 3 },
  growth: { fee: 2000, ativacao: 1200, meses_min: 3 },
  scale:  { fee: 8000, ativacao: 1500, meses_min: 6 },
}

export const PLANO_CONTEUDO_DEFAULTS: Record<'pulse' | 'flow' | 'engine', number> = {
  pulse: 1900,
  flow:  2800,
  engine: 4500,
}
