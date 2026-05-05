'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  addEntry,
  deleteEntry,
  patchEntry,
} from '@/app/(dashboard)/financeiro/actions'
import { cn, formatBRL } from '@/lib/utils'
import type { FinancialEntry } from '@/types/database'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]
const TAX_RATE = 0.06

type EntryType = 'revenue' | 'direct_cost' | 'fixed_cost'
type ClientOption = { id: string; company: string }

interface Props {
  year: number
  month: number
  entries: FinancialEntry[]
  clients: ClientOption[]
}

const filterByType = (entries: FinancialEntry[], type: EntryType) =>
  entries.filter((e) => e.type === type)

const sumAmount = (rows: FinancialEntry[]) =>
  rows.reduce((acc, r) => acc + Number(r.amount || 0), 0)

export function FinanceiroEditor({ year, month, entries, clients }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [revenue, setRevenue] = useState(() => filterByType(entries, 'revenue'))
  const [direct, setDirect] = useState(() =>
    filterByType(entries, 'direct_cost')
  )
  const [fixed, setFixed] = useState(() => filterByType(entries, 'fixed_cost'))
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState({
    revenue: false,
    direct: false,
    fixed: false,
  })
  const [, startTransition] = useTransition()

  // Re-hydrate from server on year/month change, add or delete.
  useEffect(() => {
    setRevenue(filterByType(entries, 'revenue'))
    setDirect(filterByType(entries, 'direct_cost'))
    setFixed(filterByType(entries, 'fixed_cost'))
  }, [entries])

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pending = useRef<Map<string, Partial<FinancialEntry>>>(new Map())

  const totalRev = sumAmount(revenue)
  const totalDirect = sumAmount(direct)
  const totalFixed = sumAmount(fixed)
  const grossProfit = totalRev - totalDirect
  const taxes = totalRev * TAX_RATE
  const netProfit = grossProfit - totalFixed - taxes
  const margin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0

  function scheduleSave(id: string, patch: Partial<FinancialEntry>) {
    const merged = { ...(pending.current.get(id) || {}), ...patch }
    pending.current.set(id, merged)

    const existing = timers.current.get(id)
    if (existing) clearTimeout(existing)

    timers.current.set(
      id,
      setTimeout(async () => {
        const payload = pending.current.get(id)
        pending.current.delete(id)
        timers.current.delete(id)
        if (!payload) return
        setSavingIds((prev) => new Set(prev).add(id))
        const res = await patchEntry(id, payload)
        setSavingIds((prev) => {
          const n = new Set(prev)
          n.delete(id)
          return n
        })
        if (res?.error) toast.error(res.error)
      }, 800)
    )
  }

  function updateRow(
    type: EntryType,
    id: string,
    patch: Partial<FinancialEntry>
  ) {
    const setter =
      type === 'revenue'
        ? setRevenue
        : type === 'direct_cost'
          ? setDirect
          : setFixed
    setter((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    scheduleSave(id, patch)
  }

  function handleAdd(type: EntryType) {
    startTransition(async () => {
      const res = await addEntry(year, month, type)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleDelete(id: string) {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
      pending.current.delete(id)
    }
    startTransition(async () => {
      const res = await deleteEntry(id)
      if (res?.error) toast.error(res.error)
    })
  }

  function navigate(y: number, m: number) {
    router.push(`${pathname}?year=${y}&month=${m}`)
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={year}
            onChange={(e) => navigate(Number(e.target.value), month)}
            className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => navigate(year, Number(e.target.value))}
            className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm capitalize"
          >
            {MONTHS.map((label, i) => (
              <option key={i + 1} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Salva automaticamente conforme você digita.
          </p>
        </div>

        <Section
          title="Receitas"
          accent="text-[var(--color-success)]"
          collapsed={collapsed.revenue}
          onToggle={() =>
            setCollapsed((s) => ({ ...s, revenue: !s.revenue }))
          }
          rows={revenue}
          subtotal={totalRev}
          clients={clients}
          savingIds={savingIds}
          onChange={(id, patch) => updateRow('revenue', id, patch)}
          onDelete={handleDelete}
          onAdd={() => handleAdd('revenue')}
          showClient
        />
        <Section
          title="Custos diretos"
          accent="text-[var(--color-warning)]"
          collapsed={collapsed.direct}
          onToggle={() => setCollapsed((s) => ({ ...s, direct: !s.direct }))}
          rows={direct}
          subtotal={totalDirect}
          clients={clients}
          savingIds={savingIds}
          onChange={(id, patch) => updateRow('direct_cost', id, patch)}
          onDelete={handleDelete}
          onAdd={() => handleAdd('direct_cost')}
          showClient
        />
        <Section
          title="Custos fixos"
          accent="text-[var(--color-destructive)]"
          collapsed={collapsed.fixed}
          onToggle={() => setCollapsed((s) => ({ ...s, fixed: !s.fixed }))}
          rows={fixed}
          subtotal={totalFixed}
          clients={clients}
          savingIds={savingIds}
          onChange={(id, patch) => updateRow('fixed_cost', id, patch)}
          onDelete={handleDelete}
          onAdd={() => handleAdd('fixed_cost')}
        />
      </div>

      <DRESummary
        totalRev={totalRev}
        totalDirect={totalDirect}
        totalFixed={totalFixed}
        grossProfit={grossProfit}
        taxes={taxes}
        netProfit={netProfit}
        margin={margin}
      />
    </div>
  )
}

interface SectionProps {
  title: string
  accent: string
  collapsed: boolean
  onToggle: () => void
  rows: FinancialEntry[]
  subtotal: number
  clients: ClientOption[]
  savingIds: Set<string>
  onChange: (id: string, patch: Partial<FinancialEntry>) => void
  onDelete: (id: string) => void
  onAdd: () => void
  showClient?: boolean
}

function Section({
  title,
  accent,
  collapsed,
  onToggle,
  rows,
  subtotal,
  clients,
  savingIds,
  onChange,
  onDelete,
  onAdd,
  showClient,
}: SectionProps) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between border-b border-[var(--color-border)] px-5 py-3"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          )}
          <p className={cn('text-sm font-semibold uppercase tracking-wide', accent)}>
            {title}
          </p>
          <Badge variant="outline" className="text-[10px]">
            {rows.length} {rows.length === 1 ? 'linha' : 'linhas'}
          </Badge>
        </div>
        <p className={cn('text-sm font-semibold tabular-nums', accent)}>
          {formatBRL(subtotal)}
        </p>
      </button>

      {!collapsed ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 font-medium w-32">Valor</th>
                  {showClient ? (
                    <th className="px-4 py-2 font-medium w-44">Cliente</th>
                  ) : null}
                  <th className="px-4 py-2 font-medium">Descrição</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showClient ? 5 : 4}
                      className="px-4 py-4 text-xs text-[var(--color-muted-foreground)]"
                    >
                      Nenhum lançamento. Use “Adicionar linha” abaixo.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <Row
                      key={row.id}
                      row={row}
                      clients={clients}
                      saving={savingIds.has(row.id)}
                      showClient={showClient}
                      onChange={(patch) => onChange(row.id, patch)}
                      onDelete={() => onDelete(row.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
            <Button size="sm" variant="ghost" onClick={onAdd}>
              <Plus className="h-4 w-4" /> Adicionar linha
            </Button>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Subtotal:{' '}
              <span className="font-semibold text-[var(--color-foreground)] tabular-nums">
                {formatBRL(subtotal)}
              </span>
            </p>
          </div>
        </>
      ) : null}
    </section>
  )
}

interface RowProps {
  row: FinancialEntry
  clients: ClientOption[]
  saving: boolean
  showClient?: boolean
  onChange: (patch: Partial<FinancialEntry>) => void
  onDelete: () => void
}

function Row({ row, clients, saving, showClient, onChange, onDelete }: RowProps) {
  const cellInput =
    'h-8 border-transparent bg-transparent text-sm hover:border-[var(--color-border)] focus:border-[var(--color-border)]'
  return (
    <tr className="border-b border-[var(--color-border)]/60 last:border-b-0">
      <td className="px-4 py-1.5">
        <Input
          value={row.category}
          onChange={(e) => onChange({ category: e.target.value })}
          placeholder="Nome da categoria"
          className={cellInput}
        />
      </td>
      <td className="px-4 py-1.5">
        <Input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={row.amount ?? 0}
          onChange={(e) => onChange({ amount: Number(e.target.value || 0) })}
          className={cn(cellInput, 'tabular-nums')}
        />
      </td>
      {showClient ? (
        <td className="px-4 py-1.5">
          <select
            value={row.client_id ?? ''}
            onChange={(e) =>
              onChange({ client_id: e.target.value || null })
            }
            className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-sm hover:border-[var(--color-border)] focus:border-[var(--color-border)] focus:outline-none"
          >
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company}
              </option>
            ))}
          </select>
        </td>
      ) : null}
      <td className="px-4 py-1.5">
        <Input
          value={row.description ?? ''}
          onChange={(e) =>
            onChange({ description: e.target.value || null })
          }
          placeholder="Descrição opcional"
          className={cellInput}
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        {saving ? (
          <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-[var(--color-muted-foreground)]" />
        ) : (
          <button
            type="button"
            onClick={onDelete}
            title="Remover linha"
            className="rounded p-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
    </tr>
  )
}

interface DRESummaryProps {
  totalRev: number
  totalDirect: number
  totalFixed: number
  grossProfit: number
  taxes: number
  netProfit: number
  margin: number
}

function DRESummary({
  totalRev,
  totalDirect,
  totalFixed,
  grossProfit,
  taxes,
  netProfit,
  margin,
}: DRESummaryProps) {
  return (
    <aside className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 xl:sticky xl:top-20 xl:self-start">
      <div>
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          Demonstrativo
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Atualiza em tempo real com os lançamentos.
        </p>
      </div>

      <div className="space-y-1.5">
        <DRELine label="Receita bruta" value={totalRev} />
        <DRELine
          label="(-) Custos diretos"
          value={totalDirect}
          tone="negative"
        />
        <DRELine label="= Lucro bruto" value={grossProfit} bold />
        <DRELine
          label="(-) Custos fixos"
          value={totalFixed}
          tone="negative"
        />
        <DRELine
          label="(-) Impostos (6%)"
          value={taxes}
          tone="negative"
          hint="Simples Nacional · estimado"
        />
      </div>

      <hr className="border-[var(--color-border)]" />

      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          Lucro líquido
        </p>
        <p
          className={cn(
            'text-lg font-bold tabular-nums',
            netProfit >= 0
              ? 'text-[var(--color-success)]'
              : 'text-[var(--color-destructive)]'
          )}
        >
          {formatBRL(netProfit)}
        </p>
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
        <span>Margem líquida</span>
        <span className="tabular-nums">{margin.toFixed(1)}%</span>
      </div>
    </aside>
  )
}

interface DRELineProps {
  label: string
  value: number
  bold?: boolean
  tone?: 'negative'
  hint?: string
}

function DRELine({ label, value, bold, tone, hint }: DRELineProps) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span
          className={cn(
            bold
              ? 'font-semibold text-[var(--color-foreground)]'
              : 'text-[var(--color-muted-foreground)]'
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'tabular-nums',
            bold
              ? 'font-semibold text-[var(--color-foreground)]'
              : tone === 'negative'
                ? 'text-[var(--color-destructive)]'
                : 'text-[var(--color-foreground)]'
          )}
        >
          {formatBRL(value)}
        </span>
      </div>
      {hint ? (
        <p className="text-[10px] text-[var(--color-muted-foreground)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
