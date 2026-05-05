'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAgendaTask } from '@/app/(dashboard)/agenda/actions'

interface Lead {
  id: string
  name: string
  company: string | null
}

interface NewTaskModalProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  leads: Lead[]
  defaultDueAt?: string
}

export function NewTaskModal({
  open,
  onOpenChange,
  leads,
  defaultDueAt,
}: NewTaskModalProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nova tarefa</SheetTitle>
          <SheetDescription>
            Crie uma tarefa avulsa ou vincule a um lead.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              const res = await createAgendaTask(fd)
              if (res?.error) setError(res.error)
              else {
                toast.success('Tarefa criada.')
                onOpenChange(false)
                ;(e.target as HTMLFormElement).reset()
              }
            })
          }}
          className="space-y-3 p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Título *</Label>
            <Input id="t-title" name="title" required autoFocus />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-type">Tipo</Label>
              <select
                id="t-type"
                name="type"
                defaultValue="task"
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
              >
                <option value="task">Tarefa / Nota</option>
                <option value="followup">Follow-up</option>
                <option value="call">Ligação</option>
                <option value="meeting">Reunião</option>
                <option value="email">E-mail</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Data e hora</Label>
              <Input
                id="t-due"
                name="due_at"
                type="datetime-local"
                defaultValue={defaultDueAt}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-lead">Vincular a lead (opcional)</Label>
            <select
              id="t-lead"
              name="lead_id"
              defaultValue=""
              className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
            >
              <option value="">— Tarefa avulsa —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.company ? `${l.company} · ${l.name}` : l.name}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="rounded-md border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-3 py-2 text-xs text-[var(--color-destructive)]">
              {error}
            </p>
          ) : null}

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
              Criar tarefa
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
