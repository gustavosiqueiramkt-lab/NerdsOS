'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Search, Loader2 } from 'lucide-react'
import { iniciarBusca } from '@/app/(dashboard)/prospeccao/actions'

interface Props {
  onBuscaIniciada?: (buscaId: string) => void
}

export function NovaBuscaForm({ onBuscaIniciada }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await iniciarBusca(fd)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Busca iniciada! Aguarde os resultados.')
      setOpen(false)
      if (result.buscaId) onBuscaIniciada?.(result.buscaId)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        <Search className="h-4 w-4" />
        Nova Busca
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          Nova Busca no Google Maps
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-muted-foreground)]">
              Segmento / Tipo de negócio
            </label>
            <input
              name="termo_busca"
              required
              placeholder="ex: salão de beleza, pizzaria, clínica odontológica"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-muted-foreground)]">
              Cidade
            </label>
            <input
              name="cidade"
              placeholder="ex: São Paulo, Campinas"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md border border-[var(--color-border)] py-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {pending ? 'Iniciando...' : 'Buscar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
