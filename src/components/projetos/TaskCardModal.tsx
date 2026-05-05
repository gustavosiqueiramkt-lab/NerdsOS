'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
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
import {
  createTask,
  deleteTask,
  updateTask,
} from '@/app/(dashboard)/projetos/actions'
import {
  PRIORITY_LABEL,
  type FlowTask,
  type TaskColumn,
  type TaskPriority,
  type TaskResponsible,
} from '@/types/database'

interface ClientOption {
  id: string
  company: string
}

interface TaskCardModalProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  flowId: string
  columns: TaskColumn[]
  defaultColumnId?: string
  task?: FlowTask | null
  clients: ClientOption[]
}

export function TaskCardModal({
  open,
  onOpenChange,
  flowId,
  columns,
  defaultColumnId,
  task,
  clients,
}: TaskCardModalProps) {
  const editing = !!task
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state — re-seed every time modal opens to avoid stale fields.
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [columnId, setColumnId] = useState('')
  const [clientId, setClientId] = useState('')
  const [responsible, setResponsible] = useState<TaskResponsible | ''>('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  useEffect(() => {
    if (!open) return
    setError(null)
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setColumnId(task.column_id)
      setClientId(task.client_id ?? '')
      setResponsible(task.responsible ?? '')
      setDueDate(task.due_date ?? '')
      setPriority(task.priority)
    } else {
      setTitle('')
      setDescription('')
      setColumnId(defaultColumnId || columns[0]?.id || '')
      setClientId('')
      setResponsible('')
      setDueDate('')
      setPriority('medium')
    }
  }, [open, task, defaultColumnId, columns])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Título obrigatório.')
      return
    }
    if (!columnId) {
      setError('Selecione uma coluna.')
      return
    }
    const payload = {
      flow_id: flowId,
      column_id: columnId,
      title: title.trim(),
      description: description || null,
      client_id: clientId || null,
      responsible: responsible || null,
      due_date: dueDate || null,
      priority,
    }
    startTransition(async () => {
      const res = editing
        ? await updateTask(task!.id, payload)
        : await createTask(payload)
      if (res?.error) setError(res.error)
      else {
        toast.success(editing ? 'Tarefa atualizada.' : 'Tarefa criada.')
        onOpenChange(false)
      }
    })
  }

  function handleDelete() {
    if (!task) return
    if (!confirm('Excluir esta tarefa?')) return
    startTransition(async () => {
      const res = await deleteTask(task.id)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Tarefa excluída.')
        onOpenChange(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editing ? 'Editar tarefa' : 'Nova tarefa'}</SheetTitle>
          <SheetDescription>
            {editing
              ? 'Atualize os campos e salve.'
              : 'Preencha os campos da tarefa.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-3 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Título *</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Descrição</Label>
            <textarea
              id="t-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
              placeholder="Detalhes, links, contexto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-column">Coluna</Label>
              <select
                id="t-column"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-priority">Prioridade</Label>
              <select
                id="t-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
              >
                <option value="low">{PRIORITY_LABEL.low}</option>
                <option value="medium">{PRIORITY_LABEL.medium}</option>
                <option value="high">{PRIORITY_LABEL.high}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-client">Cliente</Label>
              <select
                id="t-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
              >
                <option value="">— Nenhum —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-resp">Responsável</Label>
              <select
                id="t-resp"
                value={responsible}
                onChange={(e) =>
                  setResponsible(e.target.value as TaskResponsible | '')
                }
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
              >
                <option value="">—</option>
                <option value="CEO">CEO</option>
                <option value="COO">COO</option>
                <option value="Ambos">Ambos</option>
                <option value="Fornecedor">Fornecedor</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-due">Data de entrega</Label>
            <Input
              id="t-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-md border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-3 py-2 text-xs text-[var(--color-destructive)]">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-2">
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={pending}
                className="text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
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
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
