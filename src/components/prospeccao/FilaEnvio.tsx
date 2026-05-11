'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { SendHorizonal, Loader2 } from 'lucide-react'
import { enviarFila, verificarBusca } from '@/app/(dashboard)/prospeccao/actions'

interface Props {
  pendentesCount: number
  enviadosHoje: number
  limiteDiario: number
  buscasExecutando: { id: string; termo_busca: string }[]
}

export function FilaEnvio({ pendentesCount, enviadosHoje, limiteDiario, buscasExecutando }: Props) {
  const [pendingFila, startFila] = useTransition()
  const [pendingVerify, startVerify] = useTransition()

  function handleEnviarFila() {
    startFila(async () => {
      const result = await enviarFila()
      if (result.error) toast.error(result.error)
      else if (result.enviados === 0) toast.info(result.mensagem ?? 'Nada para enviar.')
      else toast.success(`${result.enviados} mensagens enviadas!`)
    })
  }

  function handleVerificar(buscaId: string) {
    startVerify(async () => {
      const result = await verificarBusca(buscaId)
      if (result.error) toast.error(result.error)
      else if (result.status === 'executando') toast.info('Busca ainda em andamento...')
      else toast.success(`Busca concluída! ${result.total ?? 0} leads importados.`)
    })
  }

  const restante = Math.max(0, limiteDiario - enviadosHoje)

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
        Painel de Envio
      </h3>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-md bg-[var(--color-accent)] p-3 text-center">
          <p className="text-xl font-bold text-[var(--color-foreground)]">{pendentesCount}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Pendentes</p>
        </div>
        <div className="rounded-md bg-[var(--color-accent)] p-3 text-center">
          <p className="text-xl font-bold text-[var(--color-foreground)]">{enviadosHoje}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Enviados hoje</p>
        </div>
        <div className="rounded-md bg-[var(--color-accent)] p-3 text-center">
          <p className="text-xl font-bold text-[var(--color-foreground)]">{restante}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Restante hoje</p>
        </div>
      </div>

      {buscasExecutando.length > 0 && (
        <div className="mb-3 space-y-2">
          {buscasExecutando.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2"
            >
              <div>
                <p className="text-xs font-medium text-[var(--color-foreground)]">{b.termo_busca}</p>
                <p className="text-xs text-[#F59E0B]">Buscando no Google Maps...</p>
              </div>
              <button
                onClick={() => handleVerificar(b.id)}
                disabled={pendingVerify}
                className="text-xs text-[var(--color-primary)] hover:underline disabled:opacity-60"
              >
                {pendingVerify ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleEnviarFila}
        disabled={pendingFila || restante === 0 || pendentesCount === 0}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pendingFila ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SendHorizonal className="h-4 w-4" />
        )}
        {pendingFila
          ? 'Enviando...'
          : restante === 0
            ? 'Limite diário atingido'
            : `Enviar próximos ${Math.min(restante, pendentesCount)} leads`}
      </button>
    </div>
  )
}
