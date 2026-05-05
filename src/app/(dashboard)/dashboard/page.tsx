import {
  Wallet,
  Users,
  Receipt,
  TrendingUp,
  CalendarDays,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { KPICard } from '@/components/dashboard/KPICard'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { formatBRL, formatDate } from '@/lib/utils'
import type { Client, FinancialEntry, Lead, LeadTask } from '@/types/database'

const REVENUE_GOAL = 15000
const CLIENT_GOAL = 5

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [{ data: revenueRows }, { data: clients }, { data: leads }, { data: tasks }] =
    await Promise.all([
      supabase
        .from('financial_entries')
        .select('amount,type,year,month')
        .eq('year', year)
        .eq('month', month)
        .eq('type', 'revenue'),
      supabase
        .from('clients')
        .select('id,name,company,phase,monthly_fee,contract_start,notes'),
      supabase
        .from('leads')
        .select('id,proposal_value,stage,name,company,next_action,next_action_at'),
      supabase
        .from('lead_tasks')
        .select('id,title,due_date,completed,lead_id')
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(10),
    ])

  const revenueMonth = (
    (revenueRows as Pick<FinancialEntry, 'amount'>[]) || []
  ).reduce((sum, r) => sum + Number(r.amount || 0), 0)

  const activeClients = ((clients as Client[]) || []).filter(
    (c) => c.phase !== 'encerrado' && c.phase !== 'pausado'
  )

  const ticket =
    activeClients.length > 0 ? revenueMonth / activeClients.length : 0

  const pipelineTotal = ((leads as Lead[]) || [])
    .filter((l) => l.stage !== 'fechado' && l.stage !== 'perdido')
    .reduce((sum, l) => sum + Number(l.proposal_value || 0), 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dailyTasks = ((tasks as LeadTask[]) || []).map((t) => {
    const due = t.due_date ? new Date(t.due_date) : null
    const overdue = !!due && due < today
    return { ...t, overdue }
  })

  const goalRevenuePct = Math.min(
    100,
    Math.round((revenueMonth / REVENUE_GOAL) * 100)
  )
  const goalClientsPct = Math.min(
    100,
    Math.round((activeClients.length / CLIENT_GOAL) * 100)
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão geral"
        subtitle="Pulso da operação NERDS®. Atualizado em tempo real."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Receita do mês"
          value={formatBRL(revenueMonth)}
          hint={`${now.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}`}
          icon={Wallet}
          accent
        />
        <KPICard
          label="Clientes ativos"
          value={String(activeClients.length)}
          hint={`Meta: ${CLIENT_GOAL}`}
          icon={Users}
        />
        <KPICard
          label="Ticket médio"
          value={formatBRL(ticket)}
          hint="Receita / clientes ativos"
          icon={Receipt}
        />
        <KPICard
          label="Pipeline em aberto"
          value={formatBRL(pipelineTotal)}
          hint="Soma das propostas em jogo"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                Feed do dia
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Tarefas pendentes e atrasadas do CRM.
              </p>
            </div>
            <Badge variant="outline">
              {dailyTasks.filter((t) => t.overdue).length} em atraso
            </Badge>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {dailyTasks.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={CalendarDays}
                  title="Sem tarefas pendentes"
                  description="Quando você adicionar tarefas a leads, elas aparecem aqui."
                />
              </div>
            ) : (
              dailyTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {t.overdue ? (
                      <AlertCircle className="h-4 w-4 shrink-0 text-[var(--color-destructive)]" />
                    ) : (
                      <CalendarDays className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                    )}
                    <p className="truncate text-sm text-[var(--color-foreground)]">
                      {t.title}
                    </p>
                  </div>
                  <span
                    className={
                      t.overdue
                        ? 'text-xs font-medium text-[var(--color-destructive)]'
                        : 'text-xs text-[var(--color-muted-foreground)]'
                    }
                  >
                    {formatDate(t.due_date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Progresso de metas
          </h2>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Mês corrente.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-[var(--color-muted-foreground)]">
                  Receita
                </span>
                <span className="font-medium text-[var(--color-foreground)]">
                  {formatBRL(revenueMonth)}
                  <span className="text-[var(--color-muted-foreground)]">
                    {' '}
                    / {formatBRL(REVENUE_GOAL)}
                  </span>
                </span>
              </div>
              <Progress className="mt-2" value={goalRevenuePct} />
            </div>

            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-[var(--color-muted-foreground)]">
                  Clientes
                </span>
                <span className="font-medium text-[var(--color-foreground)]">
                  {activeClients.length}
                  <span className="text-[var(--color-muted-foreground)]">
                    {' '}
                    / {CLIENT_GOAL}
                  </span>
                </span>
              </div>
              <Progress className="mt-2" value={goalClientsPct} />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Status da carteira
          </h2>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Clientes ativos e fase do contrato.
          </p>
        </div>
        {activeClients.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="Carteira vazia"
              description="Converta leads fechados em clientes para vê-los aqui."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Fase</th>
                  <th className="px-5 py-3 font-medium">Ticket / mês</th>
                  <th className="px-5 py-3 font-medium">Início</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {activeClients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 text-[var(--color-foreground)]">
                      <div className="font-medium">{c.company}</div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">
                        {c.name}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline">
                        {c.phase.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-foreground)]">
                      {formatBRL(c.monthly_fee)}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                      {formatDate(c.contract_start)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
