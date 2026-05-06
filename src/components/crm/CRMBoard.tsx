'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { LeadCard } from './LeadCard'
import { LeadModal } from './LeadModal'
import { AddLeadForm } from './AddLeadForm'
import { moveLead } from '@/app/(dashboard)/crm/actions'
import {
  LEAD_STAGES,
  type Lead,
  type LeadStage,
  type LeadTask,
} from '@/types/database'
import { formatBRL } from '@/lib/utils'

interface CRMBoardProps {
  initialLeads: Lead[]
  nextTaskByLead?: Record<string, LeadTask>
}

type LeadsByStage = Record<LeadStage, Lead[]>

function group(leads: Lead[]): LeadsByStage {
  const out: LeadsByStage = {
    sem_contato: [],
    contato_feito: [],
    proposta_enviada: [],
    negociacao: [],
    fechado: [],
    perdido: [],
  }
  for (const l of leads) out[l.stage]?.push(l)
  for (const k of Object.keys(out) as LeadStage[]) {
    out[k].sort((a, b) => a.position - b.position)
  }
  return out
}

export function CRMBoard({ initialLeads, nextTaskByLead = {} }: CRMBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [, startTransition] = useTransition()
  const [selected, setSelected] = useState<Lead | null>(null)
  const [addingTo, setAddingTo] = useState<LeadStage | null>(null)

  const grouped = useMemo(() => group(leads), [leads])

  // Deeplink support: ?lead=<id> opens the corresponding card.
  const searchParams = useSearchParams()
  useEffect(() => {
    const id = searchParams.get('lead')
    if (!id) return
    const found = leads.find((l) => l.id === id)
    if (found) setSelected(found)
  }, [searchParams, leads])

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    const target = destination.droppableId as LeadStage
    const moving = leads.find((l) => l.id === draggableId)
    if (!moving) return

    const next = leads.map((l) => (l.id === moving.id ? { ...l, stage: target } : l))
    setLeads(next)

    if (target === 'fechado') {
      setSelected({ ...moving, stage: target })
    }

    startTransition(async () => {
      const res = await moveLead(moving.id, target, destination.index)
      if (res?.error) {
        toast.error(res.error)
        setLeads(initialLeads)
      }
    })
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {LEAD_STAGES.map(({ id, label }) => {
            const colLeads = grouped[id]
            const total = colLeads.reduce(
              (sum, l) => sum + Number(l.proposal_value || 0),
              0
            )
            return (
              <Droppable key={id} droppableId={id}>
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
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-foreground)]">
                          {label}
                        </p>
                        <p className="text-[10px] text-[var(--color-muted-foreground)]">
                          {colLeads.length} card{colLeads.length === 1 ? '' : 's'}
                          {total > 0 ? ` · ${formatBRL(total)}` : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setAddingTo(id)}
                        title="Adicionar lead"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={
                        'min-h-[200px] space-y-2 p-2 transition-colors ' +
                        (snapshot.isDraggingOver ? 'bg-[#1E1E35]' : '')
                      }
                    >
                      {colLeads.length === 0 && !snapshot.isDraggingOver ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 py-10 select-none">
                          <span style={{ color: '#333350', fontSize: 22 }}>⊕</span>
                          <span className="text-[11px]" style={{ color: '#333350' }}>
                            Arraste cards aqui
                          </span>
                        </div>
                      ) : null}
                      {colLeads.map((lead, index) => (
                        <Draggable
                          key={lead.id}
                          draggableId={lead.id}
                          index={index}
                        >
                          {(p, s) => (
                            <div
                              ref={p.innerRef}
                              {...p.draggableProps}
                              {...p.dragHandleProps}
                              style={{
                                ...p.draggableProps.style,
                                opacity: s.isDragging ? 0.7 : 1,
                              }}
                              className={s.isDragging ? 'rotate-1 shadow-xl shadow-black/40' : ''}
                            >
                              <LeadCard
                                lead={lead}
                                nextTask={nextTaskByLead[lead.id]}
                                onClick={() => setSelected(lead)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>

      <LeadModal
        lead={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />

      <Sheet open={!!addingTo} onOpenChange={(o) => !o && setAddingTo(null)}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Novo lead</SheetTitle>
          </SheetHeader>
          <div className="p-6">
            {addingTo ? (
              <AddLeadForm
                defaultStage={addingTo}
                onDone={() => setAddingTo(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
