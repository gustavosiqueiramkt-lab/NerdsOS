'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, Trash2, Radar } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  addActivity,
  addLeadTask,
  convertLeadToClient,
  deleteLead,
  deleteLeadTask,
  toggleLeadTask,
  updateLead,
} from '@/app/(dashboard)/crm/actions'
import {
  LEAD_ACTIVITY_TYPE_LABEL,
  LEAD_STAGES,
  LEAD_TASK_TYPE_COLOR,
  LEAD_TASK_TYPE_LABEL,
  type Lead,
  type LeadActivity,
  type LeadActivityType,
  type LeadTask,
  type LeadTaskType,
} from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface LeadModalProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeadUpdated?: (updatedLead: Lead) => void
  onLeadDeleted?: (leadId: string) => void
  onNextTaskChanged?: (leadId: string, task: LeadTask | undefined) => void
}

const TASK_TYPES: LeadTaskType[] = [
  'call',
  'meeting',
  'followup',
  'email',
  'whatsapp',
  'outro',
]

const ACTIVITY_TYPES: LeadActivityType[] = [
  'call',
  'meeting',
  'whatsapp',
  'email',
  'note',
]

export function LeadModal({ lead, open, onOpenChange, onLeadUpdated, onLeadDeleted, onNextTaskChanged }: LeadModalProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [tasks, setTasks] = useState<LeadTask[]>([])
  const [pending, startTransition] = useTransition()
  const [convertOpen, setConvertOpen] = useState(false)
  const [convertFee, setConvertFee] = useState('')

  useEffect(() => {
    if (!lead || !open) return
    const supabase = createClient()
    void Promise.all([
      supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('lead_tasks')
        .select('*')
        .eq('lead_id', lead.id)
        .order('due_date', { ascending: true, nullsFirst: false }),
    ]).then(([a, t]) => {
      setActivities((a.data as LeadActivity[]) || [])
      setTasks((t.data as LeadTask[]) || [])
    })
  }, [lead, open])

  if (!lead) return null

  const reloadTasks = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('lead_tasks')
      .select('*')
      .eq('lead_id', lead.id)
      .order('due_date', { ascending: true, nullsFirst: false })
    const updated = (data as LeadTask[]) || []
    setTasks(updated)
    const today = new Date().toISOString().slice(0, 10)
    const next = updated
      .filter((t) => !t.completed && t.due_date && t.due_date >= today)
      .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))[0]
    onNextTaskChanged?.(lead.id, next)
  }

  const reloadActivities = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
    setActivities((data as LeadActivity[]) || [])
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateLead(lead.id, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Lead atualizado com sucesso')
        if (res.lead) onLeadUpdated?.(res.lead as Lead)
      }
    })
  }

  const handleAddActivity = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const description = String(fd.get('description') || '').trim()
    if (!description) return
    const type = String(fd.get('type') || 'note') as LeadActivityType
    startTransition(async () => {
      const res = await addActivity(lead.id, type, description)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Registro salvo')
        form.reset()
        await reloadActivities()
      }
    })
  }

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const title = String(fd.get('task_title') || '').trim()
    if (!title) return
    const due = String(fd.get('task_due') || '') || null
    const type = String(fd.get('task_type') || 'outro') as LeadTaskType
    startTransition(async () => {
      const res = await addLeadTask(lead.id, title, due, type)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Tarefa adicionada')
        form.reset()
        await reloadTasks()
      }
    })
  }

  const handleToggleTask = (id: string, completed: boolean) => {
    startTransition(async () => {
      await toggleLeadTask(id, completed)
      setTasks((prev) =>
        prev.map((x) => (x.id === id ? { ...x, completed } : x))
      )
    })
  }

  const handleDeleteTask = (id: string) => {
    startTransition(async () => {
      const res = await deleteLeadTask(id)
      if (res?.error) toast.error(res.error)
      else {
        setTasks((prev) => prev.filter((x) => x.id !== id))
      }
    })
  }

  const handleDeleteClick = () => {
    if (!confirm('Excluir este lead? Esta ação não pode ser desfeita.')) return
    startTransition(async () => {
      const res = await deleteLead(lead.id)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Lead excluído.')
        onOpenChange(false)
        onLeadDeleted?.(lead.id)
      }
    })
  }

  const handleConvertConfirm = () => {
    const fee = Number(convertFee.replace(',', '.'))
    if (!fee || Number.isNaN(fee) || fee <= 0) {
      toast.error('Informe um valor válido.')
      return
    }
    startTransition(async () => {
      const res = await convertLeadToClient(lead.id, fee)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Lead convertido em cliente — onboarding criado.')
        setConvertOpen(false)
        onOpenChange(false)
      }
    })
  }

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-xl">{lead.name}</SheetTitle>
          <SheetDescription>
            {lead.company || 'Sem empresa cadastrada'}
            {lead.segment ? ` · ${lead.segment}` : ''}
          </SheetDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline">
              {LEAD_STAGES.find((s) => s.id === lead.stage)?.label || lead.stage}
            </Badge>
            {lead.maturity_score != null ? (
              <Badge variant="secondary">
                Maturidade {lead.maturity_score}
              </Badge>
            ) : null}
            {lead.source === 'prospeccao' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E84500]/15 px-2.5 py-0.5 text-xs font-semibold text-[#E84500]">
                <Radar className="h-3 w-3" />
                Prospecção Ativa
              </span>
            ) : null}
          </div>
        </SheetHeader>

        <div className="space-y-6 p-6">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-name">Nome</Label>
                <Input id="m-name" name="name" defaultValue={lead.name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-company">Empresa</Label>
                <Input
                  id="m-company"
                  name="company"
                  defaultValue={lead.company || ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-phone">Telefone</Label>
                <Input
                  id="m-phone"
                  name="phone"
                  defaultValue={lead.phone || ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-email">E-mail</Label>
                <Input
                  id="m-email"
                  name="email"
                  defaultValue={lead.email || ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-segment">Segmento</Label>
                <Input
                  id="m-segment"
                  name="segment"
                  defaultValue={lead.segment || ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-stage">Estágio</Label>
                <select
                  id="m-stage"
                  name="stage"
                  defaultValue={lead.stage}
                  className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
                >
                  {LEAD_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-source">Origem</Label>
                <select
                  id="m-source"
                  name="source"
                  defaultValue={lead.source}
                  className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="meta_ads">Meta Ads</option>
                  <option value="google_forms">Google Forms</option>
                  <option value="indicacao">Indicação</option>
                  <option value="site">Site</option>
                  <option value="prospeccao">Prospecção Ativa</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-maturity">Maturidade (0-100)</Label>
                <Input
                  id="m-maturity"
                  name="maturity_score"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={lead.maturity_score ?? ''}
                />
              </div>
              <div className="col-span-2 space-y-2 rounded-lg border border-[var(--color-border)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Proposta</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="m-spot">Spot (R$)</Label>
                    <Input
                      id="m-spot"
                      name="spot_value"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      defaultValue={lead.spot_value ?? ''}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-fee">Fee mensal (R$)</Label>
                    <Input
                      id="m-fee"
                      name="fee_value"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      defaultValue={lead.fee_value ?? ''}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-fee-months">Período (meses)</Label>
                    <Input
                      id="m-fee-months"
                      name="fee_months"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Ex: 12"
                      defaultValue={lead.fee_months ?? ''}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="m-notes">Notas</Label>
                <textarea
                  id="m-notes"
                  name="notes"
                  rows={3}
                  defaultValue={lead.notes || ''}
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled
                  title="Em breve — Fase 2"
                >
                  Gerar proposta
                </Button>
                {lead.stage === 'fechado' && !lead.converted_to_client_id ? (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      setConvertFee(String(lead.fee_value || lead.proposal_value || ''))
                      setConvertOpen(true)
                    }}
                    disabled={pending}
                  >
                    Converter em cliente
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)]"
                  onClick={handleDeleteClick}
                  disabled={pending}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir lead
                </Button>
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </form>

          <section className="space-y-5 rounded-xl border border-[var(--color-border)] bg-[#13131F] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Tarefas &amp; Histórico
              </h3>
            </div>

            {/* PARTE A — TAREFAS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                <span className="h-px flex-1 bg-[var(--color-border)]" />
                <span>Tarefas (o que fazer)</span>
                <span className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              <form onSubmit={handleAddTask} className="space-y-2">
                <textarea
                  name="task_title"
                  rows={2}
                  required
                  placeholder="Ex: Ligar para confirmar reunião, Enviar proposta revisada, Aguardar retorno sobre orçamento..."
                  className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    name="task_due"
                    type="date"
                    className="sm:w-44"
                    title="Data"
                  />
                  <select
                    name="task_type"
                    defaultValue="outro"
                    className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 text-sm sm:w-36"
                  >
                    {TASK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {LEAD_TASK_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={pending}
                    className="sm:ml-auto"
                  >
                    Adicionar
                  </Button>
                </div>
              </form>

              <ul className="space-y-1.5">
                {tasks.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Nenhuma tarefa.
                  </p>
                ) : (
                  tasks.map((t) => {
                    const color = LEAD_TASK_TYPE_COLOR[t.type] || '#9CA3AF'
                    return (
                      <li
                        key={t.id}
                        className="flex items-start justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                      >
                        <label className="flex min-w-0 flex-1 items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            defaultChecked={t.completed}
                            onChange={(e) =>
                              handleToggleTask(t.id, e.target.checked)
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={
                                'whitespace-pre-wrap break-words ' +
                                (t.completed
                                  ? 'line-through text-[var(--color-muted-foreground)]'
                                  : '')
                              }
                            >
                              {t.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${color}20`,
                                  color,
                                }}
                              >
                                {LEAD_TASK_TYPE_LABEL[t.type]}
                              </span>
                              {t.due_date ? (
                                <span className="text-xs text-[var(--color-muted-foreground)]">
                                  {formatDate(t.due_date)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          disabled={pending}
                          className="shrink-0 rounded p-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)]"
                          title="Excluir tarefa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>

            {/* PARTE B — HISTÓRICO */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                <span className="h-px flex-1 bg-[var(--color-border)]" />
                <span>Histórico (o que já aconteceu)</span>
                <span className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              <form onSubmit={handleAddActivity} className="space-y-2">
                <textarea
                  name="description"
                  rows={2}
                  required
                  placeholder="Registre o que aconteceu nesse contato..."
                  className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <select
                    name="type"
                    defaultValue="note"
                    className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 text-sm sm:w-36"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {LEAD_ACTIVITY_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={pending}
                    className="ml-auto"
                  >
                    Registrar
                  </Button>
                </div>
              </form>

              <ul className="space-y-2">
                {activities.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Sem registros.
                  </p>
                ) : (
                  activities.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {LEAD_ACTIVITY_TYPE_LABEL[a.type] || a.type}
                        </Badge>
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {formatDate(a.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-[var(--color-foreground)]">
                        {a.description}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
      <DialogContent className="w-full max-w-sm">
        <DialogHeader>
          <DialogTitle>Converter em cliente</DialogTitle>
          <DialogDescription>
            Informe o ticket mensal para criar o contrato.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="convert-fee">Ticket mensal (R$)</Label>
          <Input
            id="convert-fee"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex: 2500"
            value={convertFee}
            onChange={(e) => setConvertFee(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConvertConfirm()
              if (e.key === 'Escape') setConvertOpen(false)
            }}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConvertOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConvertConfirm}
            disabled={pending}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
