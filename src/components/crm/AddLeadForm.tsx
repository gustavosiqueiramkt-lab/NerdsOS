'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createLead } from '@/app/(dashboard)/crm/actions'
import { cn } from '@/lib/utils'
import type { LeadStage } from '@/types/database'

interface AddLeadFormProps {
  defaultStage: LeadStage
  onDone: () => void
}

export function AddLeadForm({ defaultStage, onDone }: AddLeadFormProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [maturity, setMaturity] = useState(50)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          const res = await createLead(fd)
          if (res?.error) setError(res.error)
          else onDone()
        })
      }}
      className="space-y-4"
    >
      <input type="hidden" name="stage" value={defaultStage} />

      <Field id="add-name" label="Nome *">
        <Input id="add-name" name="name" required autoFocus />
      </Field>

      <TwoCols>
        <Field id="add-company" label="Empresa">
          <Input id="add-company" name="company" />
        </Field>
        <Field id="add-segment" label="Segmento">
          <Input id="add-segment" name="segment" />
        </Field>
      </TwoCols>

      <TwoCols>
        <Field id="add-phone" label="Telefone">
          <Input id="add-phone" name="phone" />
        </Field>
        <Field id="add-email" label="E-mail">
          <Input id="add-email" name="email" type="email" />
        </Field>
      </TwoCols>

      <TwoCols>
        <Field id="add-source" label="Origem">
          <select
            id="add-source"
            name="source"
            defaultValue="manual"
            className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
          >
            <option value="manual">Manual</option>
            <option value="meta_ads">Meta Ads</option>
            <option value="google_forms">Google Forms</option>
            <option value="indicacao">Indicação</option>
            <option value="site">Site</option>
            <option value="prospeccao">Prospecção Ativa</option>
          </select>
        </Field>
        <Field id="add-maturity" label={`Maturidade — ${maturity}/100`}>
          <input
            id="add-maturity"
            name="maturity_score"
            type="range"
            min="0"
            max="100"
            step="1"
            value={maturity}
            onChange={(e) => setMaturity(Number(e.target.value))}
            className={cn(
              'h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-muted)]',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-primary)]',
              '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-primary)] [&::-moz-range-thumb]:border-0'
            )}
          />
        </Field>
      </TwoCols>

      <div className="space-y-2 rounded-lg border border-[var(--color-border)] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Proposta</p>
        <div className="grid grid-cols-3 gap-3">
          <Field id="add-spot" label="Spot (R$)">
            <Input id="add-spot" name="spot_value" type="number" step="0.01" min="0" placeholder="0,00" />
          </Field>
          <Field id="add-fee" label="Fee mensal (R$)">
            <Input id="add-fee" name="fee_value" type="number" step="0.01" min="0" placeholder="0,00" />
          </Field>
          <Field id="add-fee-months" label="Período (meses)">
            <Input id="add-fee-months" name="fee_months" type="number" min="1" step="1" placeholder="Ex: 12" />
          </Field>
        </div>
      </div>

      <Field id="add-notes" label="Notas">
        <textarea
          id="add-notes"
          name="notes"
          rows={3}
          placeholder="Contexto, histórico, observações..."
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        />
      </Field>

      {error ? (
        <p className="rounded-md border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-3 py-2 text-xs text-[var(--color-destructive)]">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Adicionar lead
        </Button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function TwoCols({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}
