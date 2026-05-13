'use client'

import { useState, useTransition, useMemo } from 'react'
import { Plus, X, Loader2, FileSignature, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { gerarContratos } from '@/app/(dashboard)/propostas/actions'
import type { Service } from '@/types/database'
import { PLANO_FEE_DEFAULTS, PLANO_CONTEUDO_DEFAULTS } from '@/types/database'

interface Props {
  services: Service[]
}

type ContratoType = 'spot' | 'fee'

interface SelectedService {
  id: string
  name: string
  price: number
}

const CATEGORY_LABEL: Record<string, string> = {
  spot: 'Projetos Pontuais',
  content: 'Conteúdo',
  performance: 'Performance',
}

const FORMA_LABEL: Record<string, string> = {
  integral: 'À vista (−5%)',
  '30_70': '30% entrada + 70% entrega',
  '50_50': '50% entrada + 50% entrega',
}

const PLANO_LABEL: Record<string, string> = {
  start: 'Start',
  growth: 'Growth',
  scale: 'Scale',
}

const CONTEUDO_LABEL: Record<string, string> = {
  pulse: 'Pulse',
  flow: 'Flow',
  engine: 'Engine',
}

export function NovoContratoModal({ services }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  // Step state
  const [types, setTypes] = useState<ContratoType[]>(['spot'])

  // Client fields
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [endereco, setEndereco] = useState('')
  const [nomeRep, setNomeRep] = useState('')
  const [rg, setRg] = useState('')
  const [cpf, setCpf] = useState('')

  // Spot fields
  const [selectedServices, setSelectedServices] = useState<Record<string, SelectedService>>({})
  const [formaPagamento, setFormaPagamento] = useState<'integral' | '30_70' | '50_50'>('50_50')

  // Fee fields
  const [plano, setPlano] = useState<'start' | 'growth' | 'scale'>('growth')
  const [feeMensal, setFeeMensal] = useState(PLANO_FEE_DEFAULTS.growth.fee)
  const [taxaAtivacao, setTaxaAtivacao] = useState(PLANO_FEE_DEFAULTS.growth.ativacao)
  const [planoConteudo, setPlanoConteudo] = useState<'pulse' | 'flow' | 'engine' | ''>('')
  const [diaVencimento, setDiaVencimento] = useState(5)

  const groupedServices = useMemo(() => {
    const map: Record<string, Service[]> = {}
    for (const s of services.filter(s => s.active)) {
      const cat = s.category
      if (!map[cat]) map[cat] = []
      map[cat].push(s)
    }
    return map
  }, [services])

  const totalSpot = useMemo(() => {
    const raw = Object.values(selectedServices).reduce((s, sv) => s + sv.price, 0)
    return formaPagamento === 'integral' ? raw * 0.95 : raw
  }, [selectedServices, formaPagamento])

  function toggleType(t: ContratoType) {
    setTypes(prev =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t]
    )
  }

  function toggleService(svc: Service) {
    setSelectedServices(prev => {
      const next = { ...prev }
      if (next[svc.id]) { delete next[svc.id]; return next }
      next[svc.id] = { id: svc.id, name: svc.name, price: svc.price }
      return next
    })
  }

  function updateServicePrice(id: string, price: number) {
    setSelectedServices(prev => ({ ...prev, [id]: { ...prev[id], price } }))
  }

  function handlePlanoChange(p: 'start' | 'growth' | 'scale') {
    setPlano(p)
    setFeeMensal(PLANO_FEE_DEFAULTS[p].fee)
    setTaxaAtivacao(PLANO_FEE_DEFAULTS[p].ativacao)
  }

  function resetForm() {
    setTypes(['spot'])
    setRazaoSocial(''); setCnpj(''); setEndereco(''); setNomeRep(''); setRg(''); setCpf('')
    setSelectedServices({}); setFormaPagamento('50_50')
    setPlano('growth'); setFeeMensal(PLANO_FEE_DEFAULTS.growth.fee)
    setTaxaAtivacao(PLANO_FEE_DEFAULTS.growth.ativacao); setPlanoConteudo(''); setDiaVencimento(5)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    types.forEach(t => fd.append('types', t))
    fd.set('razao_social', razaoSocial)
    fd.set('cnpj', cnpj)
    fd.set('endereco', endereco)
    fd.set('nome_representante', nomeRep)
    fd.set('rg_representante', rg)
    fd.set('cpf_representante', cpf)

    if (types.includes('spot')) {
      fd.set('servicos_json', JSON.stringify(Object.values(selectedServices)))
      fd.set('forma_pagamento', formaPagamento)
    }
    if (types.includes('fee')) {
      fd.set('plano', plano)
      fd.set('fee_mensal', String(feeMensal))
      fd.set('taxa_ativacao', String(taxaAtivacao))
      fd.set('plano_conteudo', planoConteudo)
      fd.set('dia_vencimento', String(diaVencimento))
    }

    startTransition(async () => {
      const res = await gerarContratos(fd)
      if ('error' in res) { toast.error(res.error); return }
      const count = res.ids.length
      toast.success(`${count} contrato${count > 1 ? 's' : ''} gerado${count > 1 ? 's' : ''} com sucesso!`)
      setOpen(false)
      resetForm()
    })
  }

  const inputCls = 'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[#E84500]'
  const labelCls = 'block text-xs font-medium text-[var(--color-muted-foreground)] mb-1'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-[#E84500] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Plus size={15} />
        Novo Contrato
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 py-8 px-4">
          <div className="w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-[#E84500]" />
                <h2 className="text-base font-semibold text-[var(--color-foreground)]">Novo Contrato</h2>
              </div>
              <button onClick={() => { setOpen(false); resetForm() }}>
                <X className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">

                {/* Tipo de Contrato */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-2">Tipo de Contrato</p>
                  <div className="flex gap-3">
                    {(['spot', 'fee'] as ContratoType[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleType(t)}
                        className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                          types.includes(t)
                            ? 'border-[#E84500] bg-[#E84500]/10 text-[#E84500]'
                            : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]'
                        }`}
                      >
                        {t === 'spot' ? 'Projeto Pontual (Spot)' : 'Recorrente (Fee)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dados do Contratante */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">Dados do Contratante</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={labelCls}>Razão Social *</label>
                      <input required value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Nome da empresa" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>CNPJ *</label>
                      <input required value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Nome do Representante *</label>
                      <input required value={nomeRep} onChange={e => setNomeRep(e.target.value)} placeholder="Nome completo" className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Endereço Completo *</label>
                      <input required value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, nº, bairro, cidade – UF, CEP" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>RG do Representante *</label>
                      <input required value={rg} onChange={e => setRg(e.target.value)} placeholder="00.000.000-0" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>CPF do Representante *</label>
                      <input required value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Spot: Catálogo de Serviços */}
                {types.includes('spot') && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                        Serviços Contratados (Spot)
                      </p>
                      {Object.keys(selectedServices).length > 0 && (
                        <span className="text-xs font-semibold text-[var(--color-foreground)]">
                          Total: R$ {totalSpot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {formaPagamento === 'integral' ? ' (c/ 5% desc.)' : ''}
                        </span>
                      )}
                    </div>

                    {Object.keys(groupedServices).length === 0 ? (
                      <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
                        Nenhum serviço ativo no catálogo.
                      </p>
                    ) : (
                      <div className="space-y-4 rounded-lg border border-[var(--color-border)] p-4">
                        {Object.entries(groupedServices).map(([cat, svcs]) => (
                          <div key={cat}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-2">
                              {CATEGORY_LABEL[cat] ?? cat}
                            </p>
                            <div className="space-y-1.5">
                              {svcs.map(svc => {
                                const sel = selectedServices[svc.id]
                                return (
                                  <div key={svc.id} className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${sel ? 'bg-[#E84500]/8 border border-[#E84500]/30' : 'hover:bg-[var(--color-accent)]'}`}>
                                    <input
                                      type="checkbox"
                                      checked={!!sel}
                                      onChange={() => toggleService(svc)}
                                      className="h-4 w-4 rounded accent-[#E84500] flex-shrink-0"
                                    />
                                    <span className="flex-1 text-sm text-[var(--color-foreground)]">{svc.name}</span>
                                    {svc.description && (
                                      <span className="hidden sm:block text-xs text-[var(--color-muted-foreground)] max-w-[160px] truncate">{svc.description}</span>
                                    )}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {sel ? (
                                        <>
                                          <span className="text-xs text-[var(--color-muted-foreground)]">R$</span>
                                          <input
                                            type="number"
                                            min={0}
                                            step={10}
                                            value={sel.price}
                                            onChange={e => updateServicePrice(svc.id, Number(e.target.value))}
                                            className="w-24 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-right text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[#E84500]"
                                          />
                                        </>
                                      ) : (
                                        <span className="text-sm text-[var(--color-muted-foreground)]">
                                          R$ {svc.price.toLocaleString('pt-BR')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Forma de Pagamento */}
                    <div className="mt-3">
                      <label className={labelCls}>Forma de Pagamento</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['integral', '30_70', '50_50'] as const).map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFormaPagamento(f)}
                            className={`rounded-md border py-2 text-xs font-medium transition-colors ${
                              formaPagamento === f
                                ? 'border-[#E84500] bg-[#E84500]/10 text-[#E84500]'
                                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]'
                            }`}
                          >
                            {FORMA_LABEL[f]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fee: Plano */}
                {types.includes('fee') && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">Plano Recorrente (Fee)</p>

                    {/* Plan selector */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {(['start', 'growth', 'scale'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePlanoChange(p)}
                          className={`rounded-lg border py-3 text-sm font-semibold transition-colors ${
                            plano === p
                              ? 'border-[#E84500] bg-[#E84500]/10 text-[#E84500]'
                              : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]'
                          }`}
                        >
                          {PLANO_LABEL[p]}
                          <br />
                          <span className="text-xs font-normal opacity-70">
                            R$ {PLANO_FEE_DEFAULTS[p].fee.toLocaleString('pt-BR')}/mês
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Fee Mensal (R$)</label>
                        <input
                          type="number" min={0} step={100}
                          value={feeMensal}
                          onChange={e => setFeeMensal(Number(e.target.value))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Taxa de Ativação (R$)</label>
                        <input
                          type="number" min={0} step={100}
                          value={taxaAtivacao}
                          onChange={e => setTaxaAtivacao(Number(e.target.value))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Dia de Vencimento</label>
                        <input
                          type="number" min={1} max={28}
                          value={diaVencimento}
                          onChange={e => setDiaVencimento(Number(e.target.value))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Add-on Conteúdo (opcional)</label>
                        <select
                          value={planoConteudo}
                          onChange={e => setPlanoConteudo(e.target.value as 'pulse' | 'flow' | 'engine' | '')}
                          className={inputCls}
                        >
                          <option value="">Sem conteúdo</option>
                          {(['pulse', 'flow', 'engine'] as const).map(c => (
                            <option key={c} value={c}>
                              {CONTEUDO_LABEL[c]} — R$ {PLANO_CONTEUDO_DEFAULTS[c].toLocaleString('pt-BR')}/mês
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 pb-5 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => { setOpen(false); resetForm() }}
                  className="flex-1 rounded-md border border-[var(--color-border)] py-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#E84500] py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Gerar Contrato{types.length > 1 ? 's' : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
