'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd'
import { Calendar, MoreHorizontal, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import {
  createColumn,
  createFlow,
  deleteColumn,
  deleteFlow,
  moveTask,
  renameColumn,
  renameFlow,
} from '@/app/(dashboard)/projetos/actions'
import { TaskCardModal } from './TaskCardModal'
import { cn } from '@/lib/utils'
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  type FlowTask,
  type TaskColumn,
  type TaskFlow,
} from '@/types/database'

interface ClientOption {
  id: string
  company: string
}

interface ProjetosBoardProps {
  flows: TaskFlow[]
  activeFlowId: string | null
  columns: TaskColumn[]
  tasks: FlowTask[]
  clients: ClientOption[]
}

export function ProjetosBoard({
  flows,
  activeFlowId,
  columns: initialColumns,
  tasks: initialTasks,
  clients,
}: ProjetosBoardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const [columns, setColumns] = useState(initialColumns)
  const [tasks, setTasks] = useState(initialTasks)

  // Sync from server on flow switch / add / delete (revalidatePath updates props).
  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const [newFlowOpen, setNewFlowOpen] = useState(false)
  const [taskModal, setTaskModal] = useState<{
    columnId?: string
    task?: FlowTask | null
  } | null>(null)

  const tasksByColumn = useMemo(() => {
    const m = new Map<string, FlowTask[]>()
    for (const t of tasks) {
      if (!m.has(t.column_id)) m.set(t.column_id, [])
      m.get(t.column_id)!.push(t)
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.position - b.position)
    }
    return m
  }, [tasks])

  function switchFlow(flowId: string) {
    router.push(`${pathname}?flow=${flowId}`)
  }

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    const targetColId = destination.droppableId
    const moved = tasks.find((t) => t.id === draggableId)
    if (!moved) return

    setTasks((prev) =>
      prev.map((t) =>
        t.id === moved.id ? { ...t, column_id: targetColId } : t
      )
    )
    startTransition(async () => {
      const res = await moveTask(moved.id, targetColId, destination.index)
      if (res?.error) {
        toast.error(res.error)
        setTasks(initialTasks)
      }
    })
  }

  return (
    <div className="space-y-4">
      <FlowTabs
        flows={flows}
        activeFlowId={activeFlowId}
        onSwitch={switchFlow}
        onNewFlow={() => setNewFlowOpen(true)}
        onRename={(id, name) =>
          startTransition(async () => {
            const res = await renameFlow(id, name)
            if (res?.error) toast.error(res.error)
          })
        }
        onDelete={(id) => {
          if (
            !confirm(
              'Excluir este fluxo apaga todas as colunas e tarefas dele. Continuar?'
            )
          )
            return
          startTransition(async () => {
            const res = await deleteFlow(id)
            if (res?.error) toast.error(res.error)
          })
        }}
      />

      {flows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Nenhum fluxo. Use “+ Novo fluxo”.
        </p>
      ) : !activeFlowId ? null : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {columns.map((col) => (
              <Column
                key={col.id}
                column={col}
                tasks={tasksByColumn.get(col.id) || []}
                onAddCard={() =>
                  setTaskModal({ columnId: col.id, task: null })
                }
                onCardClick={(task) => setTaskModal({ task })}
                onRename={(name) =>
                  startTransition(async () => {
                    const res = await renameColumn(col.id, name)
                    if (res?.error) toast.error(res.error)
                  })
                }
                onDelete={() => {
                  if (!confirm('Excluir esta coluna e suas tarefas?')) return
                  startTransition(async () => {
                    const res = await deleteColumn(col.id)
                    if (res?.error) toast.error(res.error)
                  })
                }}
              />
            ))}

            <AddColumn flowId={activeFlowId} />
          </div>
        </DragDropContext>
      )}

      <NewFlowModal open={newFlowOpen} onOpenChange={setNewFlowOpen} />

      <TaskCardModal
        open={!!taskModal}
        onOpenChange={(o) => !o && setTaskModal(null)}
        flowId={activeFlowId || ''}
        columns={columns}
        defaultColumnId={taskModal?.columnId}
        task={taskModal?.task ?? null}
        clients={clients}
      />
    </div>
  )
}

interface FlowTabsProps {
  flows: TaskFlow[]
  activeFlowId: string | null
  onSwitch: (id: string) => void
  onNewFlow: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

function FlowTabs({
  flows,
  activeFlowId,
  onSwitch,
  onNewFlow,
  onRename,
  onDelete,
}: FlowTabsProps) {
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1">
      {flows.map((f) => {
        const active = f.id === activeFlowId
        const isEditing = editing === f.id
        return (
          <div key={f.id} className="flex items-center">
            {isEditing ? (
              <EditableLabel
                initial={f.name}
                onCommit={(name) => {
                  setEditing(null)
                  if (name && name !== f.name) onRename(f.id, name)
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <button
                type="button"
                onClick={() => onSwitch(f.id)}
                onDoubleClick={() => active && setEditing(f.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                )}
              >
                {f.name}
              </button>
            )}
            {active ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-md text-white hover:bg-white/10"
                    title="Mais"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(f.id)}>
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    destructive
                    onClick={() => onDelete(f.id)}
                  >
                    Excluir fluxo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        )
      })}
      <button
        type="button"
        onClick={onNewFlow}
        className="ml-1 flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <Plus className="h-4 w-4" /> Novo fluxo
      </button>
    </div>
  )
}

interface ColumnProps {
  column: TaskColumn
  tasks: FlowTask[]
  onAddCard: () => void
  onCardClick: (task: FlowTask) => void
  onRename: (name: string) => void
  onDelete: () => void
}

function Column({
  column,
  tasks,
  onAddCard,
  onCardClick,
  onRename,
  onDelete,
}: ColumnProps) {
  const [editing, setEditing] = useState(false)

  return (
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <div
          className="w-72 shrink-0 rounded-xl bg-[#13131F] transition-colors"
          style={{
            border: snapshot.isDraggingOver
              ? '1px solid rgba(255,107,53,0.31)'
              : '1px solid #2A2A45',
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#2A2A45] px-3 py-2">
            {editing ? (
              <EditableLabel
                initial={column.name}
                onCommit={(name) => {
                  setEditing(false)
                  if (name && name !== column.name) onRename(name)
                }}
                onCancel={() => setEditing(false)}
                className="flex-1"
              />
            ) : (
              <button
                type="button"
                onDoubleClick={() => setEditing(true)}
                className="flex-1 truncate text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-foreground)]"
                title="Duplo-clique para renomear"
              >
                {column.name}
                <span className="ml-2 text-[10px] font-normal text-[var(--color-muted-foreground)]">
                  {tasks.length}
                </span>
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={onDelete}>
                  Excluir coluna
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'min-h-[200px] space-y-2 p-2 transition-colors',
              snapshot.isDraggingOver && 'bg-[#1E1E35]'
            )}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-10 select-none">
                <span style={{ color: '#333350', fontSize: 22 }}>⊕</span>
                <span className="text-[11px]" style={{ color: '#333350' }}>
                  Arraste cards aqui
                </span>
              </div>
            ) : null}
            {tasks.map((t, index) => (
              <Draggable key={t.id} draggableId={t.id} index={index}>
                {(p, s) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                    className={s.isDragging ? 'rotate-1' : ''}
                  >
                    <TaskCard task={t} onClick={() => onCardClick(t)} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>

          <button
            type="button"
            onClick={onAddCard}
            className="flex w-full items-center gap-2 border-t border-[#2A2A45] px-3 py-2 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar card
          </button>
        </div>
      )}
    </Droppable>
  )
}

function TaskCard({
  task,
  onClick,
}: {
  task: FlowTask
  onClick: () => void
}) {
  const priorityColor = PRIORITY_COLOR[task.priority]
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-lg border border-[#2A2A45] bg-[#1E1E32] p-3 text-left transition-all hover:border-[#FF6B35]/60 hover:shadow-lg hover:shadow-black/30"
      style={{ borderLeftColor: priorityColor, borderLeftWidth: 3 }}
    >
      <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
        {task.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
          style={{
            borderColor: priorityColor + '40',
            color: priorityColor,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: priorityColor }}
          />
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.responsible ? (
          <Badge variant="outline" className="text-[10px]">
            {task.responsible}
          </Badge>
        ) : null}
        {task.due_date ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-muted-foreground)]">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), "d 'de' MMM", {
              locale: ptBR,
            })}
          </span>
        ) : null}
      </div>
    </button>
  )
}

function AddColumn({ flowId }: { flowId: string }) {
  const [adding, setAdding] = useState(false)
  const [, startTransition] = useTransition()

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="grid h-12 w-72 shrink-0 place-items-center rounded-xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-foreground)]"
      >
        <span className="inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar coluna
        </span>
      </button>
    )
  }

  return (
    <div className="w-72 shrink-0 rounded-xl border border-[#2A2A45] bg-[#0F0F1C] p-3">
      <EditableLabel
        initial=""
        placeholder="Nome da coluna"
        onCommit={(name) => {
          if (!name) {
            setAdding(false)
            return
          }
          startTransition(async () => {
            const res = await createColumn(flowId, name)
            if (res?.error) toast.error(res.error)
            setAdding(false)
          })
        }}
        onCancel={() => setAdding(false)}
        autoFocus
      />
    </div>
  )
}

function NewFlowModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const name = inputRef.current?.value?.trim() || ''
    if (!name) {
      setError('Nome obrigatório.')
      return
    }
    startTransition(async () => {
      const res = await createFlow(name)
      if (res?.error) setError(res.error)
      else {
        const id = (res.flow as { id?: string })?.id
        onOpenChange(false)
        if (id) router.push(`${pathname}?flow=${id}`)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Novo fluxo</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-3 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="f-name">Nome do fluxo</Label>
            <Input
              id="f-name"
              ref={inputRef}
              autoFocus
              placeholder="Ex.: Branding 2026"
            />
          </div>
          {error ? (
            <p className="text-xs text-[var(--color-destructive)]">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Criar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

interface EditableLabelProps {
  initial: string
  onCommit: (value: string) => void
  onCancel: () => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

function EditableLabel({
  initial,
  onCommit,
  onCancel,
  placeholder,
  autoFocus = true,
  className,
}: EditableLabelProps) {
  const [val, setVal] = useState(initial)
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onCommit(val.trim())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onCommit(val.trim())
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="h-7 flex-1 rounded-sm border border-[var(--color-border)] bg-[var(--color-card)] px-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
      />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          onCancel()
        }}
        className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        title="Cancelar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
