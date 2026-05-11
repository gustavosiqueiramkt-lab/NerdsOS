import type { ProposalContent } from '@/types/proposal'

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

interface Props {
  content: ProposalContent
}

export function PropostaViewer({ content }: Props) {
  const { client, financeiro, proposal_cover, diagnostico, swot, plano_organizacao, cronograma, fase1_estruturacao } = content

  const comboMonthly = financeiro.growth_monthly + financeiro.pulse_monthly - 400
  const comboEconomy = 400

  return (
    <div style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", color: '#ffffff', background: '#0a0a0a' }}>

      {/* ── CAPA ── */}
      <section style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 60px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ textAlign: 'center', maxWidth: 640 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 48 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#E84500' }}>NERDS®</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>·</span>
            <span style={{ fontSize: 12, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>agencianerds.com.br</span>
          </div>
          <p style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#E84500', marginBottom: 16, fontWeight: 600 }}>
            PROPOSTA ESTRATÉGICA DE MARKETING
          </p>
          <h1 style={{ fontSize: 56, fontWeight: 300, lineHeight: 1.1, color: '#ffffff', marginBottom: 32 }}>
            {proposal_cover.title}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 64px' }}>
            {proposal_cover.description}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48 }}>
            {[
              { label: 'CLIENTE', value: client.name },
              { label: 'SEGMENTO', value: proposal_cover.segment_label },
              { label: 'MERCADO', value: client.market },
              { label: 'AGÊNCIA', value: 'NERDS®' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 6 }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#ffffff' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUEM SOMOS ── */}
      <section style={{ background: '#0d0d0d', padding: '80px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 9, letterSpacing: 4, color: '#E84500', fontWeight: 600, marginBottom: 40, textTransform: 'uppercase' }}>Quem Somos?</p>
          <h2 style={{ fontSize: 36, fontWeight: 300, lineHeight: 1.3, color: '#ffffff', maxWidth: 520, marginBottom: 48 }}>
            Somos os <strong style={{ fontWeight: 700, color: '#E84500' }}>NERDS®</strong>, ajudamos empresas a gerar novos clientes todos os meses através da internet.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {[
              'Foco em gerar demanda real, não apenas visibilidade',
              'Estratégias construídas para transformar visitas em negócios',
              'Domínio da linguagem e dinâmica do segmento do cliente',
            ].map((text, i) => (
              <div key={i} style={{ borderTop: '1px solid #E84500', paddingTop: 20, paddingRight: 32 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTE 01 LABEL ── */}
      <SectionDivider label="PARTE 01" title="Diagnóstico" />

      {/* ── DIAGNÓSTICO: CONTEXTO ── */}
      <section style={{ background: '#0a0a0a', padding: '72px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 40, textTransform: 'uppercase' }}>
            PARTE 01 · DIAGNÓSTICO
          </p>
          <p style={{ fontSize: 24, fontWeight: 300, color: '#ffffff', marginBottom: 56 }}>
            Visão Geral<span style={{ color: '#E84500' }}>.</span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48 }}>
            {/* Contexto */}
            <div>
              <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase' }}>CONTEXTO DO NEGÓCIO</p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>{diagnostico.contexto}</p>
              </div>
            </div>

            {/* Maturidade */}
            <div>
              <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase' }}>MAPA DE MATURIDADE</p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                <p style={{ fontSize: 64, fontWeight: 700, color: '#E84500', lineHeight: 1, marginBottom: 12 }}>
                  {diagnostico.maturity_score}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{diagnostico.maturity_description}</p>
              </div>
            </div>

            {/* Leitura estratégica */}
            <div>
              <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase' }}>LEITURA ESTRATÉGICA</p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>A EMPRESA POSSUI</p>
                <ul style={{ marginBottom: 20, paddingLeft: 0, listStyle: 'none' }}>
                  {diagnostico.empresa_possui.map((item, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid #E84500' }}>{item}</li>
                  ))}
                </ul>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>PORÉM FALTA</p>
                <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                  {diagnostico.porem_falta.map((item, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid rgba(255,255,255,0.15)' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Gargalo central */}
          <div style={{ marginTop: 56, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#E84500', letterSpacing: 1 }}>{diagnostico.gargalo_central}</p>
          </div>
        </div>
      </section>

      {/* ── SWOT ── */}
      <section style={{ background: '#0d0d0d', padding: '72px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
            PARTE 01 · DIAGNÓSTICO
          </p>
          <p style={{ fontSize: 24, fontWeight: 300, color: '#ffffff', marginBottom: 48 }}>
            Análise SWOT<span style={{ color: '#E84500' }}>.</span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {[
              { label: 'PONTOS FORTES', items: swot.pontos_fortes, border: 'right bottom' },
              { label: 'PONTOS FRACOS', items: swot.pontos_fracos, border: 'bottom' },
              { label: 'RISCOS OCULTOS', items: swot.riscos_ocultos, border: 'right' },
              { label: 'EVIDÊNCIAS COLETADAS', items: swot.evidencias_coletadas, border: '' },
            ].map((quadrant, i) => (
              <div key={i} style={{
                padding: 32,
                borderRight: quadrant.border.includes('right') ? '1px solid rgba(255,255,255,0.08)' : undefined,
                borderBottom: quadrant.border.includes('bottom') ? '1px solid rgba(255,255,255,0.08)' : undefined,
              }}>
                <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase' }}>{quadrant.label}</p>
                <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                  {quadrant.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 8, display: 'flex', gap: 8, lineHeight: 1.5 }}>
                      <span style={{ color: '#E84500', flexShrink: 0, marginTop: 2 }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTE 02 LABEL ── */}
      <SectionDivider label="PARTE 02" title="Plano de Organização" />

      {/* ── PLANO DE ORGANIZAÇÃO ── */}
      <section style={{ background: '#0a0a0a', padding: '72px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
            PARTE 02 · PLANO DE ORGANIZAÇÃO
          </p>
          <p style={{ fontSize: 24, fontWeight: 300, color: '#ffffff', marginBottom: 56 }}>
            Os Quatro Pilares<span style={{ color: '#E84500' }}>.</span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {[
              { num: '01', label: 'POSICIONAMENTO', items: plano_organizacao.posicionamento },
              { num: '02', label: 'PRESENÇA DIGITAL', items: plano_organizacao.presenca_digital },
              { num: '03', label: 'GERAÇÃO DE LEADS', items: plano_organizacao.geracao_leads },
              { num: '04', label: 'PROCESSO COMERCIAL', items: plano_organizacao.processo_comercial },
            ].map((pilar, i) => (
              <div key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, paddingRight: i < 3 ? 28 : 0 }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: '#E84500', lineHeight: 1, marginBottom: 12 }}>{pilar.num}</p>
                <p style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase' }}>{pilar.label}</p>
                <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                  {pilar.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, lineHeight: 1.5 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRONOGRAMA ── */}
      <section style={{ background: '#0d0d0d', padding: '72px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
            PARTE 02 · PLANO DE ORGANIZAÇÃO
          </p>
          <p style={{ fontSize: 24, fontWeight: 300, color: '#ffffff', marginBottom: 56 }}>
            Cronograma<span style={{ color: '#E84500' }}>.</span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginBottom: 56 }}>
            {[
              { label: 'FASE 1 · 0–30 DIAS', sublabel: 'Estruturação', items: cronograma.fase1 },
              { label: 'FASE 2 · 30–60 DIAS', sublabel: 'Tração', items: cronograma.fase2 },
              { label: 'FASE 3 · 60–90+ DIAS', sublabel: 'Escala', items: cronograma.fase3 },
            ].map((fase, i) => (
              <div key={i} style={{ borderTop: '3px solid #E84500', paddingTop: 24, paddingRight: i < 2 ? 32 : 0 }}>
                <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>{fase.label}</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 20 }}>{fase.sublabel}</p>
                <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                  {fase.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8, display: 'flex', gap: 8, lineHeight: 1.5 }}>
                      <span style={{ color: '#E84500', flexShrink: 0 }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mapa de oportunidades */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32 }}>
            <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase' }}>MAPA DE OPORTUNIDADES</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cronograma.mapa_oportunidades.map((opp, i) => (
                <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', paddingLeft: 16, borderLeft: '2px solid #E84500', lineHeight: 1.5 }}>{opp}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTE 03 LABEL ── */}
      <SectionDivider label="PARTE 03" title="Proposta" />

      {/* ── FASE 1 ESTRUTURAÇÃO ── */}
      <section style={{ background: '#0a0a0a', padding: '72px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
              PARTE 03 · PROPOSTA
            </p>
            <p style={{ fontSize: 24, fontWeight: 300, color: '#ffffff', marginBottom: 40 }}>
              Fase 1: Estruturação<span style={{ color: '#E84500' }}>.</span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {fase1_estruturacao.items.map((item, i) => (
                <div key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{item.description}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#E84500', flexShrink: 0 }}>{brl(item.price)}</p>
                </div>
              ))}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>TOTAL FASE 1 (SPOT)</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#E84500' }}>{brl(fase1_estruturacao.total_spot)}</p>
              </div>
            </div>
          </div>

          {fase1_estruturacao.adendo && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ borderLeft: '3px solid #E84500', paddingLeft: 20 }}>
                <p style={{ fontSize: 9, letterSpacing: 3, color: '#E84500', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>ADENDO RECOMENDADO</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{fase1_estruturacao.adendo}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FASES 2, 3, CRM ── */}
      <section style={{ background: '#0d0d0d', padding: '72px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
            PARTE 03 · PROPOSTA
          </p>
          <p style={{ fontSize: 24, fontWeight: 300, color: '#ffffff', marginBottom: 56 }}>
            Fases 2, 3 e CRM<span style={{ color: '#E84500' }}>.</span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            <div style={{ borderTop: '3px solid #E84500', paddingTop: 24, paddingRight: 32 }}>
              <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>FASE 2 · 30–60 DIAS</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>Gestão de Tráfego — Plano Growth</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
                Meta Ads + Google Ads, 4 criativos mensais (dark posts), otimizações contínuas e relatório mensal com ajustes estratégicos.
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#E84500' }}>{brl(financeiro.growth_monthly)}<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mês</span></p>
            </div>

            <div style={{ borderTop: '3px solid #E84500', paddingTop: 24, paddingRight: 32, paddingLeft: 32 }}>
              <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>FASE 3 · CONTÍNUO</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>Gestão de Conteúdo — Plano Pulse</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
                8 posts mensais, planejamento estratégico, redação de legendas e publicação. Foco em autoridade e engajamento.
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#E84500' }}>{brl(financeiro.pulse_monthly)}<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mês</span></p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, paddingLeft: 32 }}>
              <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>FASE 4 · IMPLEMENTAÇÃO</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>CRM & Automação</p>
              <ul style={{ paddingLeft: 0, listStyle: 'none', margin: '0 0 20px' }}>
                {['Estruturação do funil', 'Automação de processos', 'Classificação de leads', 'Treinamento da equipe'].map((item, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>→ {item}</li>
                ))}
              </ul>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Investimento Spot</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#E84500' }}>{brl(financeiro.crm_spot)}</p>
            </div>
          </div>

          {/* Condição especial */}
          <div style={{ marginTop: 48, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 9, letterSpacing: 3, color: '#E84500', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>CONDIÇÃO ESPECIAL: GROWTH + PULSE</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Contrate os dois planos juntos e economize {brl(comboEconomy)}/mês</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#E84500' }}>{brl(comboMonthly)}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mês</span></p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>ECONOMIA DE {brl(comboEconomy)}/MÊS</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRÓXIMOS PASSOS / RESUMO ── */}
      <section style={{ background: '#0a0a0a', padding: '72px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
          {/* Passos */}
          <div>
            <p style={{ fontSize: 11, letterSpacing: 4, color: '#E84500', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>VAMOS COMEÇAR</p>
            <p style={{ fontSize: 28, fontWeight: 300, color: '#ffffff', marginBottom: 48 }}>
              Próximos Passos<span style={{ color: '#E84500' }}>.</span>
            </p>
            {[
              { num: '01', title: 'Aprovação', desc: 'Validação da proposta e alinhamento final de escopo e valores.' },
              { num: '02', title: 'Início da Fase 1', desc: 'Onboarding estratégico e início das atividades de estruturação.' },
              { num: '03', title: 'Kickoff Estratégico', desc: 'Reunião de alinhamento com definição de prioridades e calendário.' },
            ].map((step) => (
              <div key={step.num} style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#E84500', lineHeight: 1, flexShrink: 0, width: 40 }}>{step.num}</p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>{step.title}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo financeiro */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 24, textTransform: 'uppercase' }}>RESUMO DO INVESTIMENTO INICIAL</p>

            {fase1_estruturacao.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, paddingBottom: 12 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{item.name}</p>
                <p style={{ fontSize: 12, color: '#ffffff', fontWeight: 500 }}>{brl(item.price)}</p>
              </div>
            ))}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 16, marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', letterSpacing: 1, textTransform: 'uppercase' }}>Total Fase 1</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#E84500' }}>{brl(fase1_estruturacao.total_spot)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: 'rgba(232,69,0,0.08)', border: '1px solid rgba(232,69,0,0.2)', borderRadius: 8, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>PARA COMEÇAR</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Fase 1 — Estruturação</p>
                </div>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#E84500' }}>{brl(fase1_estruturacao.total_spot)}</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>A PARTIR DA FASE 2</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Plano Growth</p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{brl(financeiro.growth_monthly)}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>/mês</span></p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>A PARTIR DA FASE 3</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Growth + Pulse (combo)</p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{brl(comboMonthly)}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>/mês</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OBRIGADO ── */}
      <section style={{ background: '#0d0d0d', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, fontWeight: 300, color: '#ffffff', marginBottom: 16 }}>
            Muito obrigado<span style={{ color: '#E84500' }}>.</span>
          </p>
          <p style={{ fontSize: 12, letterSpacing: 3, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>NERDS® · agencianerds.com.br</p>
        </div>
      </section>

    </div>
  )
}

function SectionDivider({ label, title }: { label: string; title: string }) {
  return (
    <section style={{ background: '#111111', padding: '48px 60px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 24 }}>
        <p style={{ fontSize: 9, letterSpacing: 4, color: '#E84500', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{label}</p>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <p style={{ fontSize: 20, fontWeight: 300, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{title}</p>
      </div>
    </section>
  )
}
