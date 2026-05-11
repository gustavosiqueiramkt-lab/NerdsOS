'use client'

import { useTransition, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, Loader2, Sparkles } from 'lucide-react'
import { generateAndSaveProposal } from '@/app/(dashboard)/propostas/actions'

export function NovaPropostaForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    if (selected && selected.size > MAX_FILE_BYTES) {
      setError('Arquivo muito grande. O limite é 10 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setError(null)
    setFile(selected)
  }

  function removeFile() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await generateAndSaveProposal(formData)
      if ('error' in result && result.error) {
        setError(result.error)
      } else if ('id' in result && result.id) {
        router.push(`/propostas/${result.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* Cliente */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          Dados do Cliente
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              name="client_name"
              required
              placeholder="Ex: Sabrina Viana"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#E84500]/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">Empresa</label>
            <input
              name="client_company"
              placeholder="Ex: Viana Arquitetura"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#E84500]/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">
              Segmento <span className="text-red-500">*</span>
            </label>
            <input
              name="client_segment"
              required
              placeholder="Ex: Arquitetura, Construção Civil"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#E84500]/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">
              Mercado / Cidade <span className="text-red-500">*</span>
            </label>
            <input
              name="client_market"
              required
              placeholder="Ex: Sorocaba & Região"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#E84500]/40"
            />
          </div>
        </div>
      </section>

      {/* Contexto */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Arquivo de Contexto
          </h2>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Faça upload do briefing, anotações da reunião ou qualquer documento do cliente. A IA vai usar esse material para gerar a proposta.
          </p>
        </div>

        {file ? (
          <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
            <FileText size={16} className="shrink-0 text-[#E84500]" />
            <span className="flex-1 truncate text-sm text-[var(--color-foreground)]">{file.name}</span>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {(file.size / 1024).toFixed(0)} KB
            </span>
            <button
              type="button"
              onClick={removeFile}
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-8 text-center transition-colors hover:border-[#E84500]/50 hover:bg-[#E84500]/5">
            <Upload size={20} className="text-[var(--color-muted-foreground)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                Clique para selecionar o arquivo
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                PDF ou TXT — briefing, anotações, formulário do cliente
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              name="context_file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        )}
      </section>

      {/* Proposta Financeira */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          Valores da Proposta
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">
              Fase 2 — Plano Growth
            </label>
            <p className="text-xs text-[var(--color-muted-foreground)]">Gestão de tráfego pago</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted-foreground)]">
                R$
              </span>
              <input
                name="growth_monthly"
                type="number"
                defaultValue={2000}
                min={0}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2 pl-9 pr-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#E84500]/40"
              />
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">por mês</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">
              Fase 3 — Plano Pulse
            </label>
            <p className="text-xs text-[var(--color-muted-foreground)]">Gestão de conteúdo</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted-foreground)]">
                R$
              </span>
              <input
                name="pulse_monthly"
                type="number"
                defaultValue={1900}
                min={0}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2 pl-9 pr-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#E84500]/40"
              />
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">por mês</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-foreground)]">
              Fase 4 — CRM & Automação
            </label>
            <p className="text-xs text-[var(--color-muted-foreground)]">Implementação spot</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted-foreground)]">
                R$
              </span>
              <input
                name="crm_spot"
                type="number"
                defaultValue={2500}
                min={0}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2 pl-9 pr-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[#E84500]/40"
              />
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">único</p>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4 border-t border-[var(--color-border)] pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-[#E84500] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Gerando proposta com IA...
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Gerar Proposta com IA
            </>
          )}
        </button>
        {isPending && (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Isso pode levar até 30 segundos.
          </p>
        )}
      </div>
    </form>
  )
}
