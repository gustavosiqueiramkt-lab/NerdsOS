'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Settings, Loader2, X } from 'lucide-react'
import { salvarConfig } from '@/app/(dashboard)/prospeccao/actions'
import type { ProspeccaoConfig } from '@/types/database'

const DEFAULT_TEMPLATE =
  'Olá! Vi que a {empresa} ainda não tem presença digital estruturada. Ajudamos empresas como a sua a conseguir mais clientes pelo Google. Posso te mostrar um diagnóstico gratuito?'

interface Props {
  config: ProspeccaoConfig | null
}

export function ConfigModal({ config }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await salvarConfig(fd)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Configurações salvas!')
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
      >
        <Settings className="h-4 w-4" />
        Configurações
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                Configurações de Prospecção
              </h2>
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Evolution API — Nome da Instância
                </label>
                <input
                  name="evolution_instance"
                  defaultValue={config?.evolution_instance ?? ''}
                  placeholder="ex: nerds-prospeccao"
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Evolution API — API Key (Global)
                </label>
                <input
                  name="evolution_token"
                  type="password"
                  defaultValue={config?.evolution_token ?? ''}
                  placeholder="Cole a API key do Evolution"
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Limite de mensagens por dia
                </label>
                <input
                  name="limite_diario"
                  type="number"
                  min={1}
                  max={50}
                  defaultValue={config?.limite_diario ?? 20}
                  className="w-32 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                  Máx. recomendado: 20/dia para evitar bloqueio do número.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Mensagem padrão
                </label>
                <p className="mb-1 text-xs text-[var(--color-muted-foreground)]">
                  Use <code className="bg-[var(--color-accent)] px-1 rounded">{'{empresa}'}</code> e{' '}
                  <code className="bg-[var(--color-accent)] px-1 rounded">{'{cidade}'}</code> como variáveis.
                </p>
                <textarea
                  name="mensagem_template"
                  rows={4}
                  defaultValue={config?.mensagem_template ?? DEFAULT_TEMPLATE}
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="ativo"
                    value="true"
                    defaultChecked={config?.ativo ?? true}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-[var(--color-border)] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-primary)] peer-checked:after:translate-x-4" />
                </label>
                <span className="text-sm text-[var(--color-foreground)]">Prospecção ativa</span>
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
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
