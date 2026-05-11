'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
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
  const [nextTasks, setNextTasks] = useState<Record<string, LeadTask>>(nextTaskByLead)
  const [, startTransition] = useTransition()
  const [selected, setSelected] = useState<Lead | null>(null)
  const [addingTo, setAddingTo] = useState<LeadStage | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<LeadStage | null>(null)

  const grouped = useMemo(() => group(leads), [leads])

  // Deeplink support: ?lead=<id> opens the corresponding card.
  const searchParams = useSearchParams()
  useEffect(() => {
    const id = searchParams.get('lead')
    if (!id) return
    const found = leads.find((l) => l.id === id)
    if (found) setSelected(found)
  }, [searchParams, leads])

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(leadId)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverCol(null)
  }

  const handleDrop = (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    const moving = leads.find((l) => l.id === leadId)
    setDragOverCol(null)

    if (!moving || moving.stage === targetStage) return

    const targetIndex = grouped[targetStage].length
    const next = leads.map((l) =>
      l.id === leadId ? { ...l, stage: targetStage } : l
    )
    setLeads(next)

    if (targetStage === 'fechado') {
      setSelected({ ...moving, stage: targetStage })
    }

    startTransition(async () => {
      const res = await moveLead(leadId, targetStage, targetIndex)
      if (res?.error) {
        toast.error(res.error)
        setLeads(initialLeads)
      }
    })
  }

  const handleLeadUpdated = (updatedLead: Lead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    )
    setSelected(updatedLead)
  }

  const handleLeadDeleted = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId))
    setSelected(null)
  }

  const handleNextTaskChanged = (leadId: string, task: LeadTask | undefined) => {
    setNextTasks((prev) => {
      const updated = { ...prev }
      if (task) updated[leadId] = task
      else delete updated[leadId]
      return updated
    })
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {LEAD_STAGES.map(({ id, label }) => {
          const colLeads = grouped[id]
          const spotTotal = colLeads.reduce((sum, l) => sum + Number(l.spot_value || 0), 0)
          const contractTotal = colLeads.reduce(
            (sum, l) => sum + Number(l.fee_value || 0) * Number(l.fee_months || 0),
            0
          )
          const isOver = dragOverCol === id

          return (
            <div
              key={id}
              className="w-72 shrink-0 rounded-xl bg-[#13131F] transition-colors"
              style={{
                border: isOver
                  ? '1px solid rgba(255,107,53,0.31)'
                  : '1px solid #2A2A45',
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverCol(id)
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                setDragOverCol(id)
              }}
              onDragLeave={(e) => {
                if (
                  !e.relatedTarget ||
                  !e.currentTarget.contains(e.relatedTarget as Node)
                ) {
                  if (dragOverCol === id) setDragOverCol(null)
                }
              }}
              onDrop={(e) => handleDrop(e, id)}
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#2A2A45] px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-foreground)]">
                    {label}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted-foreground)]">
                    {colLeads.length} card{colLeads.length === 1 ? '' : 's'}
                    {spotTotal > 0 ? ` · Spot ${formatBRL(spotTotal)}` : ''}
                    {contractTotal > 0 ? ` · Contrato ${formatBRL(contractTotal)}` : ''}
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
                className={
                  'min-h-[200px] space-y-2 p-2 transition-colors ' +
                  (isOver ? 'bg-[#1E1E35]' : '')
                }
              >
                {colLeads.length === 0 && !isOver ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-10 select-none">
                    <span style={{ color: '#333350', fontSize: 22 }}>⊕</span>
                    <span className="text-[11px]" style={{ color: '#333350' }}>
                      Arraste cards aqui
                    </span>
                  </div>
                ) : null}
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: draggingId === lead.id ? 0.6 : 1,
                      cursor: draggingId === lead.id ? 'grabbing' : 'grab',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <LeadCard
                      lead={lead}
                      nextTask={nextTasks[lead.id]}
                      onClick={() => setSelected(lead)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <LeadModal
        lead={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onLeadUpdated={handleLeadUpdated}
        onLeadDeleted={handleLeadDeleted}
        onNextTaskChanged={handleNextTaskChanged}
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
