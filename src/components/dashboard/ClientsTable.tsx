'use client'

import { useMemo, useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn, formatBRL, formatDate } from '@/lib/utils'
import { createClientAction } from '@/app/(dashboard)/clientes/actions'
import type { Client, ClientPhase } from '@/types/database'

const PHASE_TABS: { id: 'todos' | ClientPhase; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'estruturacao', label: 'Estruturação' },
  { id: 'gestao_ativa', label: 'Gestão Ativa' },
  { id: 'pausado', label: 'Pausado' },
  { id: 'encerrado', label: 'Encerrado' },
]

function monthsBetween(start: string | null) {
  if (!start) return 0
  const a = new Date(start)
  const b = new Date()
  return (
    (b.getFullYear() - a.getFullYear()) * 12 +
    (b.getMonth() - a.getMonth())
  )
}

interface Props {
  initial: Client[]
}

export function ClientsTable({ initial }: Props) {
  const [tab, setTab] = useState<'todos' | ClientPhase>('todos')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (tab === 'todos') return initial
    return initial.filter((c) => c.phase === tab)
  }, [initial, tab])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1">
          {PHASE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                tab === t.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Nenhum cliente nesta fase"
              description="Use o botão Novo Cliente para cadastrar."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Segmento</th>
                  <th className="px-5 py-3 font-medium">Ticket / mês</th>
                  <th className="px-5 py-3 font-medium">Fase</th>
                  <th className="px-5 py-3 font-medium">Início</th>
                  <th className="px-5 py-3 font-medium">Tempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer transition-colors hover:bg-[var(--color-accent)]/40"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-[var(--color-foreground)]">
                        {c.company}
                      </div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">
                        {c.name}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                      {c.segment || '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-foreground)]">
                      {formatBRL(c.monthly_fee)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline">
                        {c.phase.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                      {formatDate(c.contract_start)}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                      {monthsBetween(c.contract_start)} m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewClientSheet open={open} onOpenChange={setOpen} />
    </div>
  )
}

function NewClientSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createClientAction(fd)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Cliente cadastrado.')
        onOpenChange(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Novo cliente</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-3 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Contato *</Label>
              <Input id="c-name" name="name" required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-company">Empresa *</Label>
              <Input id="c-company" name="company" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-segment">Segmento</Label>
              <Input id="c-segment" name="segment" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-cnpj">CNPJ</Label>
              <Input id="c-cnpj" name="cnpj" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Telefone</Label>
              <Input id="c-phone" name="phone" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">E-mail</Label>
              <Input id="c-email" name="email" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-fee">Mensal (R$)</Label>
              <Input
                id="c-fee"
                name="monthly_fee"
                type="number"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-activation">Ativação (R$)</Label>
              <Input
                id="c-activation"
                name="activation_fee"
                type="number"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-start">Início do contrato</Label>
              <Input id="c-start" name="contract_start" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-min">Mínimo (meses)</Label>
              <Input
                id="c-min"
                name="contract_min_months"
                type="number"
                defaultValue={3}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="c-phase">Fase</Label>
              <select
                id="c-phase"
                name="phase"
                defaultValue="onboarding"
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
              >
                <option value="onboarding">Onboarding</option>
                <option value="estruturacao">Estruturação</option>
                <option value="gestao_ativa">Gestão ativa</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cadastrar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
