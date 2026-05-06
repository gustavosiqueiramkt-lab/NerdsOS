'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { NewTaskModal } from './NewTaskModal'
import { toggleAgendaTask } from '@/app/(dashboard)/agenda/actions'
import { cn } from '@/lib/utils'
import type { LeadTask, LeadTaskType } from '@/types/database'

export type TaskWithLead = LeadTask & {
  lead: { id: string; name: string; company: string | null } | null
}

const HOUR_START = 8
const HOUR_END = 20
const HOURS = Array.from(
  { length: HOUR_END - HOUR_START + 1 },
  (_, i) => HOUR_START + i
)
const HOUR_PX = 56

const TYPE_LABEL: Record<LeadTaskType, string> = {
  followup: 'Follow-up',
  call: 'Ligação',
  meeting: 'Reunião',
  email: 'E-mail',
  note: 'Nota',
  task: 'Tarefa',
  whatsapp: 'WhatsApp',
  outro: 'Outro',
}

const TYPE_COLOR: Record<LeadTaskType, string> = {
  followup: '#4ECDC4',
  call: '#10B981',
  meeting: '#FF6B35',
  email: '#A78BFA',
  note: '#9CA3AF',
  task: '#555570',
  whatsapp: '#22C55E',
  outro: '#6B7280',
}

interface AgendaViewProps {
  weekStart: string // ISO
  weekTasks: TaskWithLead[]
  overdueTasks: TaskWithLead[]
  leads: { id: string; name: string; company: string | null }[]
}

export function AgendaView({
  weekStart,
  weekTasks,
  overdueTasks,
  leads,
}: AgendaViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [selectedDay, setSelectedDay] = useState(() =>
    startOfDay(new Date())
  )
  const [openTask, setOpenTask] = useState<TaskWithLead | null>(null)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newTaskDefaults, setNewTaskDefaults] = useState<{
    due_at?: string
  } | null>(null)

  const start = useMemo(() => new Date(weekStart), [weekStart])
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(start, i)),
    [start]
  )

  // Today might fall outside this week (after navigation); clamp selectedDay
  // into the visible week so the right-side checklist shows something useful.
  useEffect(() => {
    const today = startOfDay(new Date())
    const inWeek = days.some((d) => isSameDay(d, today))
    setSelectedDay(inWeek ? today : startOfDay(days[0]))
  }, [days])

  const goWeek = (offset: number) => {
    const next = addDays(start, offset * 7)
    router.push(`${pathname}?week=${format(next, 'yyyy-MM-dd')}`)
  }

  const goToday = () => {
    router.push(pathname)
  }

  const formatRange = () => {
    const last = addDays(start, 6)
    if (start.getMonth() === last.getMonth()) {
      return `${format(start, 'd', { locale: ptBR })} a ${format(last, "d 'de' MMM yyyy", { locale: ptBR })}`
    }
    return `${format(start, 'd MMM', { locale: ptBR })} a ${format(last, "d 'de' MMM yyyy", { locale: ptBR })}`
  }

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskWithLead[]>()
    for (const t of weekTasks) {
      if (!t.due_date) continue
      const key = format(new Date(t.due_date), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [weekTasks])

  const allDayPerDay = (day: Date) => {
    const list = tasksByDay.get(format(day, 'yyyy-MM-dd')) || []
    return list.filter((t) => {
      const d = new Date(t.due_date!)
      const h = d.getHours()
      return h < HOUR_START || h > HOUR_END
    })
  }

  const timedPerDay = (day: Date) => {
    const list = tasksByDay.get(format(day, 'yyyy-MM-dd')) || []
    return list.filter((t) => {
      const d = new Date(t.due_date!)
      const h = d.getHours()
      return h >= HOUR_START && h <= HOUR_END
    })
  }

  const toggleDone = (id: string, completed: boolean) => {
    startTransition(async () => {
      const res = await toggleAgendaTask(id, completed)
      if (res?.error) toast.error(res.error)
    })
  }

  const selectedKey = format(selectedDay, 'yyyy-MM-dd')
  const selectedTimed = (tasksByDay.get(selectedKey) || []).filter(
    (t) => !t.completed
  )
  const filteredOverdue = overdueTasks.filter((t) => !t.completed)

  return (
    <div className="space-y-4">
      {/* Google Calendar banner */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#4ECDC4]/40 bg-gradient-to-r from-[#4ECDC4]/5 via-transparent to-transparent px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#4ECDC4]/15">
            <Link2 className="h-4 w-4 text-[#4ECDC4]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Conectar Google Calendar
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Sincronize sua agenda pessoal com o NerdsOS — em breve.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          em breve
        </Badge>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goWeek(-1)}
            title="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium text-[var(--color-foreground)] capitalize">
            {formatRange()}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goWeek(1)}
            title="Próxima semana"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Hoje
          </Button>
        </div>
        <Button
          onClick={() => {
            setNewTaskDefaults(null)
            setNewTaskOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> Nova tarefa
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        {/* Week grid */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="overflow-x-auto">
            <div className="min-w-[840px]">
              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--color-border)]">
                <div />
                {days.map((d) => {
                  const today = isSameDay(d, new Date())
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => setSelectedDay(startOfDay(d))}
                      className={cn(
                        'flex flex-col items-center gap-0.5 border-l border-[var(--color-border)] px-2 py-2 text-xs transition-colors',
                        isSameDay(d, selectedDay)
                          ? 'bg-[var(--color-primary)]/10'
                          : 'hover:bg-[var(--color-accent)]/40'
                      )}
                    >
                      <span className="uppercase tracking-wider text-[var(--color-muted-foreground)]">
                        {format(d, 'EEE', { locale: ptBR })}
                      </span>
                      <span
                        className={cn(
                          'text-base font-semibold',
                          today
                            ? 'text-[var(--color-primary)]'
                            : 'text-[var(--color-foreground)]'
                        )}
                      >
                        {format(d, 'd')}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* All-day strip */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--color-border)]">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  Dia todo
                </div>
                {days.map((d) => {
                  const items = allDayPerDay(d)
                  return (
                    <div
                      key={d.toISOString()}
                      className="border-l border-[var(--color-border)] p-1 min-h-[28px] flex flex-col gap-1"
                    >
                      {items.map((t) => (
                        <BlockButton
                          key={t.id}
                          task={t}
                          onClick={() => setOpenTask(t)}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Hour grid */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                {/* Hour gutter */}
                <div>
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="flex justify-end pr-2 pt-1 text-[10px] tabular-nums text-[var(--color-muted-foreground)]"
                      style={{ height: HOUR_PX }}
                    >
                      {String(h).padStart(2, '0')}h
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {days.map((d) => (
                  <div
                    key={d.toISOString()}
                    className="relative border-l border-[var(--color-border)]"
                    style={{ height: HOURS.length * HOUR_PX }}
                  >
                    {/* hour separators */}
                    {HOURS.map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-[var(--color-border)]/40"
                        style={{ top: i * HOUR_PX }}
                      />
                    ))}

                    {/* clickable hour cells */}
                    {HOURS.map((h, i) => (
                      <button
                        key={`btn-${i}`}
                        type="button"
                        className="absolute left-0 right-0 hover:bg-[var(--color-accent)]/30 transition-colors"
                        style={{ top: i * HOUR_PX, height: HOUR_PX }}
                        onClick={() => {
                          const dt = new Date(d)
                          dt.setHours(h, 0, 0, 0)
                          setNewTaskDefaults({
                            due_at: format(dt, "yyyy-MM-dd'T'HH:mm"),
                          })
                          setNewTaskOpen(true)
                        }}
                      />
                    ))}

                    {/* tasks */}
                    {timedPerDay(d).map((t) => {
                      const dt = new Date(t.due_date!)
                      const offsetMin =
                        (dt.getHours() - HOUR_START) * 60 + dt.getMinutes()
                      const top = (offsetMin / 60) * HOUR_PX
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setOpenTask(t)}
                          className={cn(
                            'absolute left-1 right-1 rounded-md px-2 py-1 text-left text-xs font-medium shadow-sm ring-1 ring-black/20 transition-all hover:ring-2',
                            t.completed && 'opacity-60 line-through'
                          )}
                          style={{
                            top,
                            minHeight: 28,
                            height: 44,
                            backgroundColor: TYPE_COLOR[t.type] + '22',
                            borderLeft: `3px solid ${TYPE_COLOR[t.type]}`,
                            color: 'var(--color-foreground)',
                          }}
                        >
                          <span className="block truncate">{t.title}</span>
                          <span className="block text-[10px] tabular-nums opacity-70">
                            {format(dt, 'HH:mm')}
                            {t.lead?.company ? ` · ${t.lead.company}` : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-3">
          {filteredOverdue.length > 0 ? (
            <div className="rounded-xl border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[var(--color-destructive)]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-destructive)]">
                  Atrasadas · {filteredOverdue.length}
                </p>
              </div>
              <ul className="space-y-1.5">
                {filteredOverdue.map((t) => (
                  <ChecklistItem
                    key={t.id}
                    task={t}
                    overdue
                    onToggle={(c) => toggleDone(t.id, c)}
                    onClick={() => setOpenTask(t)}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              {isSameDay(selectedDay, new Date())
                ? 'Hoje'
                : format(selectedDay, "EEEE, d 'de' MMM", { locale: ptBR })}
            </p>
            {selectedTimed.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CalendarDays className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Sem tarefas neste dia.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {selectedTimed.map((t) => (
                  <ChecklistItem
                    key={t.id}
                    task={t}
                    onToggle={(c) => toggleDone(t.id, c)}
                    onClick={() => setOpenTask(t)}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Task popover */}
      <Sheet
        open={!!openTask}
        onOpenChange={(o) => !o && setOpenTask(null)}
      >
        <SheetContent side="right" className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{openTask?.title}</SheetTitle>
            <SheetDescription>
              {openTask?.lead?.company || 'Tarefa avulsa'}
            </SheetDescription>
          </SheetHeader>
          {openTask ? (
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  style={{
                    borderColor: TYPE_COLOR[openTask.type] + '60',
                    color: TYPE_COLOR[openTask.type],
                  }}
                >
                  {TYPE_LABEL[openTask.type]}
                </Badge>
                {openTask.due_date ? (
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {format(new Date(openTask.due_date), "d MMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                ) : null}
              </div>

              {openTask.lead ? (
                <div className="rounded-md border border-[var(--color-border)] p-3">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    Lead vinculado
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">
                    {openTask.lead.name}
                  </p>
                  {openTask.lead.company ? (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {openTask.lead.company}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={openTask.completed}
                    onChange={(e) => {
                      toggleDone(openTask.id, e.target.checked)
                      setOpenTask({
                        ...openTask,
                        completed: e.target.checked,
                      })
                    }}
                  />
                  Marcar como concluída
                </label>
                {openTask.lead ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      router.push(`/crm?lead=${openTask.lead!.id}`)
                      setOpenTask(null)
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ver no CRM
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <NewTaskModal
        open={newTaskOpen}
        onOpenChange={(o) => {
          setNewTaskOpen(o)
          if (!o) setNewTaskDefaults(null)
        }}
        leads={leads}
        defaultDueAt={newTaskDefaults?.due_at}
      />
    </div>
  )
}

function BlockButton({
  task,
  onClick,
}: {
  task: TaskWithLead
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-2 py-0.5 text-left text-[10px] font-medium ring-1 ring-black/20 truncate',
        task.completed && 'opacity-60 line-through'
      )}
      style={{
        backgroundColor: TYPE_COLOR[task.type] + '22',
        borderLeft: `2px solid ${TYPE_COLOR[task.type]}`,
        color: 'var(--color-foreground)',
      }}
    >
      {task.title}
    </button>
  )
}

function ChecklistItem({
  task,
  overdue,
  onToggle,
  onClick,
}: {
  task: TaskWithLead
  overdue?: boolean
  onToggle: (completed: boolean) => void
  onClick: () => void
}) {
  return (
    <li className="group flex items-start gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-[var(--color-border)]">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-0.5"
      />
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left"
      >
        <p
          className={cn(
            'truncate text-sm',
            task.completed
              ? 'line-through text-[var(--color-muted-foreground)]'
              : overdue
                ? 'text-[var(--color-destructive)]'
                : 'text-[var(--color-foreground)]'
          )}
        >
          {task.title}
        </p>
        <p className="truncate text-[10px] text-[var(--color-muted-foreground)]">
          {task.due_date
            ? format(new Date(task.due_date), "d MMM · HH:mm", {
                locale: ptBR,
              })
            : '—'}
          {task.lead?.company ? ` · ${task.lead.company}` : ''}
        </p>
      </button>
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: TYPE_COLOR[task.type] }}
      />
    </li>
  )
}
