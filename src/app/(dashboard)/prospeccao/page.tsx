export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NovaBuscaForm } from '@/components/prospeccao/NovaBuscaForm'
import { ProspeccaoLeadCard } from '@/components/prospeccao/ProspeccaoLeadCard'
import { FilaEnvio } from '@/components/prospeccao/FilaEnvio'
import { ConfigModal } from '@/components/prospeccao/ConfigModal'
import type { ProspeccaoLead, ProspeccaoConfig, ProspeccaoBusca } from '@/types/database'

export default async function ProspeccaoPage() {
  const supabase = await createClient()

  const [leadsRes, configRes, buscasRes] = await Promise.all([
    supabase
      .from('prospeccao_leads')
      .select('*')
      .neq('status', 'descartado')
      .order('score_oportunidade', { ascending: false })
      .limit(200),
    supabase.from('prospeccao_config').select('*').maybeSingle(),
    supabase
      .from('prospeccao_buscas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const leads: ProspeccaoLead[] = leadsRes.data ?? []
  const config: ProspeccaoConfig | null = configRes.data ?? null
  const buscas: ProspeccaoBusca[] = buscasRes.data ?? []

  const hoje = new Date().toISOString().slice(0, 10)
  const enviadosHoje = leads.filter(
    (l) => l.mensagem_enviada && l.enviada_em?.startsWith(hoje),
  ).length
  const pendentes = leads.filter((l) => !l.mensagem_enviada && l.status === 'novo' && l.telefone)
  const buscasExecutando = buscas.filter((b) => b.status === 'executando')

  const quentes = leads.filter((l) => l.score_oportunidade >= 5)
  const mornos = leads.filter((l) => l.score_oportunidade >= 3 && l.score_oportunidade < 5)
  const frios = leads.filter((l) => l.score_oportunidade < 3)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Prospecção</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {leads.length} leads · {quentes.length} quentes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConfigModal config={config} />
          <NovaBuscaForm />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-[var(--color-border)] p-4">
          <FilaEnvio
            pendentesCount={pendentes.length}
            enviadosHoje={enviadosHoje}
            limiteDiario={config?.limite_diario ?? 20}
            buscasExecutando={buscasExecutando.map((b) => ({
              id: b.id,
              termo_busca: b.termo_busca,
            }))}
          />

          {/* Histórico de buscas */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Buscas Recentes
            </p>
            <div className="space-y-1">
              {buscas.slice(0, 8).map((b) => (
                <div
                  key={b.id}
                  className="rounded-md px-2 py-1.5"
                >
                  <p className="text-xs font-medium text-[var(--color-foreground)] truncate">
                    {b.termo_busca}
                    {b.cidade ? ` — ${b.cidade}` : ''}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted-foreground)]">
                    {b.total_encontrados} encontrados ·{' '}
                    <span
                      className={
                        b.status === 'concluida'
                          ? 'text-[#10B981]'
                          : b.status === 'executando'
                            ? 'text-[#F59E0B]'
                            : b.status === 'erro'
                              ? 'text-[#EF4444]'
                              : 'text-[var(--color-muted-foreground)]'
                      }
                    >
                      {b.status}
                    </span>
                  </p>
                </div>
              ))}
              {buscas.length === 0 && (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Nenhuma busca ainda.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Main — colunas por score */}
        <main className="flex flex-1 gap-4 overflow-x-auto p-4">
          {/* Quentes */}
          <section className="flex w-80 shrink-0 flex-col">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                Quentes
              </h2>
              <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
                {quentes.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto">
              {quentes.map((lead) => (
                <ProspeccaoLeadCard key={lead.id} lead={lead} />
              ))}
              {quentes.length === 0 && (
                <p className="text-center text-sm text-[var(--color-muted-foreground)] py-8">
                  Sem leads quentes
                </p>
              )}
            </div>
          </section>

          {/* Mornos */}
          <section className="flex w-80 shrink-0 flex-col">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                Mornos
              </h2>
              <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
                {mornos.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto">
              {mornos.map((lead) => (
                <ProspeccaoLeadCard key={lead.id} lead={lead} />
              ))}
              {mornos.length === 0 && (
                <p className="text-center text-sm text-[var(--color-muted-foreground)] py-8">
                  Sem leads mornos
                </p>
              )}
            </div>
          </section>

          {/* Frios */}
          <section className="flex w-80 shrink-0 flex-col">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#6B7280]" />
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                Frios
              </h2>
              <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
                {frios.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto">
              {frios.map((lead) => (
                <ProspeccaoLeadCard key={lead.id} lead={lead} />
              ))}
              {frios.length === 0 && (
                <p className="text-center text-sm text-[var(--color-muted-foreground)] py-8">
                  Sem leads frios
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
