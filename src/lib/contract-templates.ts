import type { ContratoServico } from '@/types/database'

export interface SpotTemplateData {
  razao_social: string
  cnpj: string
  endereco: string
  nome_representante: string
  rg: string
  cpf: string
  servicos: ContratoServico[]
  valor_total: number
  forma_pagamento: 'integral' | '30_70' | '50_50'
  data_geracao: string
}

export interface FeeTemplateData {
  razao_social: string
  cnpj: string
  endereco: string
  nome_representante: string
  rg: string
  cpf: string
  plano: 'start' | 'growth' | 'scale'
  fee_mensal: number
  taxa_ativacao: number
  plano_conteudo: 'pulse' | 'flow' | 'engine' | null
  dia_vencimento: number
  meses_min: number
  data_geracao: string
}

const PLANO_LABEL: Record<'start' | 'growth' | 'scale', string> = {
  start: 'Start',
  growth: 'Growth',
  scale: 'Scale',
}

const PLANO_CONTEUDO_LABEL: Record<'pulse' | 'flow' | 'engine', string> = {
  pulse: 'Pulse',
  flow: 'Flow',
  engine: 'Engine',
}

function brl(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function paymentTermsSpot(forma: string, total: number): string {
  if (forma === 'integral') {
    const desconto = total * 0.05
    const final = total - desconto
    return `À vista: R$ ${brl(final)} (com 5% de desconto sobre R$ ${brl(total)})`
  }
  if (forma === '30_70') {
    const entrada = total * 0.3
    const restante = total * 0.7
    return `30% na assinatura: R$ ${brl(entrada)} + 70% na entrega (30 dias): R$ ${brl(restante)}`
  }
  const metade = total * 0.5
  return `50% na assinatura: R$ ${brl(metade)} + 50% na entrega (30 dias): R$ ${brl(metade)}`
}

const GLASSES_SVG = `<svg width="54" height="26" viewBox="0 0 54 26" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1.5 11 L5 11" stroke="#E84500" stroke-width="2" stroke-linecap="round"/>
  <circle cx="15" cy="13" r="10" stroke="#E84500" stroke-width="2.5" fill="none"/>
  <path d="M25 13 C26 10.5 27.5 9.5 27 9.5 C26.5 9.5 28 10.5 29 13" stroke="#E84500" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="39" cy="13" r="10" stroke="#E84500" stroke-width="2.5" fill="none"/>
  <path d="M49 11 L52.5 11" stroke="#E84500" stroke-width="2" stroke-linecap="round"/>
</svg>`

const CSS = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 9.5pt; line-height: 1.65; color: #111; background: #fff; }

    /* ── Header ── */
    .contract-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 40px 16px; border-bottom: 3px solid #E84500; }
    .header-logo { display: flex; align-items: center; gap: 12px; }
    .header-logo svg { flex-shrink: 0; }
    .brand-name { font-size: 16pt; font-weight: 900; letter-spacing: -0.02em; color: #E84500; line-height: 1; }
    .brand-tagline { font-size: 7pt; letter-spacing: 0.15em; text-transform: uppercase; color: #888; margin-top: 2px; font-weight: 500; }
    .header-url { font-size: 8pt; letter-spacing: 0.08em; color: #aaa; text-align: right; font-weight: 500; }

    /* ── Page ── */
    .page { max-width: 820px; margin: 0 auto; }
    .page-body { padding: 32px 40px 40px; }

    /* ── Contract title ── */
    .contract-title-block { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #e8e8e8; }
    .contract-type-label { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #E84500; margin-bottom: 6px; }
    .contract-title { font-size: 14pt; font-weight: 700; color: #0a0a0a; letter-spacing: -0.01em; line-height: 1.2; }
    .contract-preamble { font-size: 9pt; color: #666; margin-top: 10px; line-height: 1.6; }

    /* ── Parties ── */
    .parties { display: flex; gap: 16px; margin-bottom: 24px; }
    .party-block { flex: 1; padding: 12px 16px 12px 14px; border-left: 3px solid #E84500; background: #fafafa; }
    .party-role { font-size: 7pt; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #E84500; margin-bottom: 4px; }
    .party-name { font-weight: 700; font-size: 10.5pt; color: #0a0a0a; margin-bottom: 3px; }
    .party-detail { font-size: 8.5pt; color: #555; line-height: 1.5; }

    /* ── Intro line ── */
    .intro-line { font-size: 9pt; color: #555; margin-bottom: 20px; font-style: italic; border-left: 2px solid #e8e8e8; padding-left: 10px; }

    /* ── Clauses ── */
    .clauses-wrapper { space-y: 12px; }
    .clause { margin-bottom: 16px; }
    .clause-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid #f0f0f0; }
    .clause-number { font-size: 7pt; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #E84500; white-space: nowrap; }
    .clause-name { font-size: 9.5pt; font-weight: 700; color: #0a0a0a; text-transform: uppercase; letter-spacing: 0.04em; }
    .clause p { font-size: 9.5pt; color: #333; margin-bottom: 5px; line-height: 1.65; }
    .clause p:last-child { margin-bottom: 0; }

    /* ── Section divider ── */
    .section-divider { display: flex; align-items: center; gap: 12px; margin: 28px 0; }
    .section-divider::before, .section-divider::after { content: ''; flex: 1; height: 1px; background: #e8e8e8; }
    .section-divider span { font-size: 7pt; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #bbb; white-space: nowrap; }

    /* ── Signing block ── */
    .signing-city { font-size: 9pt; color: #555; margin-bottom: 28px; }
    .signatures { display: flex; gap: 40px; margin-top: 8px; }
    .sig-block { flex: 1; }
    .sig-line { border-top: 1.5px solid #0a0a0a; padding-top: 8px; margin-top: 36px; }
    .sig-party { font-size: 8pt; font-weight: 700; color: #0a0a0a; text-transform: uppercase; letter-spacing: 0.05em; }
    .sig-detail { font-size: 8pt; color: #666; margin-top: 2px; }
    .witnesses { display: flex; gap: 40px; margin-top: 24px; }
    .wit-block { flex: 1; }

    /* ── OS / Annex box ── */
    .doc-box { border: 1.5px solid #E84500; border-radius: 8px; overflow: hidden; margin-top: 28px; }
    .doc-box-header { background: #E84500; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
    .doc-box-title { font-size: 9pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #fff; }
    .doc-box-sub { font-size: 8pt; color: rgba(255,255,255,0.8); }
    .doc-box-body { padding: 20px 24px; }
    .doc-field { margin-bottom: 12px; }
    .doc-field label { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #888; display: block; margin-bottom: 3px; }
    .doc-field .val { font-size: 10pt; color: #0a0a0a; border-bottom: 1px dotted #ccc; padding-bottom: 3px; }
    .doc-row { display: flex; gap: 24px; margin-bottom: 12px; }
    .doc-row .doc-field { flex: 1; margin-bottom: 0; }

    /* ── Services table ── */
    .services-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .services-table th { text-align: left; font-size: 8pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 7px 10px; background: #0a0a0a; color: #fff; }
    .services-table td { font-size: 9pt; padding: 7px 10px; border-bottom: 1px solid #f0f0f0; color: #333; }
    .services-table .total-row td { font-weight: 700; color: #0a0a0a; background: #fafafa; border-top: 2px solid #E84500; border-bottom: none; }
    .services-table .total-row td:last-child { color: #E84500; font-size: 11pt; }

    /* ── Payment badge ── */
    .payment-line { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
    .payment-badge { display: inline-flex; align-items: center; gap: 6px; background: #0a0a0a; color: #fff; font-size: 8.5pt; font-weight: 600; padding: 5px 12px; border-radius: 4px; }
    .payment-badge::before { content: ''; width: 6px; height: 6px; background: #E84500; border-radius: 50%; flex-shrink: 0; }

    /* ── Plan badges ── */
    .plan-badge { display: inline-block; background: #0a0a0a; color: #fff; font-size: 10pt; font-weight: 700; padding: 5px 16px; border-radius: 4px; letter-spacing: 0.05em; }
    .plan-badge.orange { background: #E84500; }
    .plan-value { font-size: 16pt; font-weight: 900; color: #E84500; letter-spacing: -0.02em; }
    .plan-value-label { font-size: 8pt; color: #888; font-weight: 500; }

    /* ── Annex signature ── */
    .annex-sig { display: flex; gap: 40px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8e8e8; }
    .annex-sig .sig-block { flex: 1; }

    @media print {
      .no-print { display: none !important; }
      .contract-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .doc-box-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .services-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 1cm 1.5cm; size: A4; }
      body { font-size: 9pt; }
    }
  </style>
`

function contractHeader(): string {
  return `
  <header class="contract-header">
    <div class="header-logo">
      ${GLASSES_SVG}
      <div>
        <div class="brand-name">NERDS®</div>
        <div class="brand-tagline">Comunicação · Design · Tecnologia · Performance</div>
      </div>
    </div>
    <div class="header-url">agencianerds.com.br</div>
  </header>`
}

function signingBlock(razao_social: string, cnpj: string, year: number): string {
  return `
  <p class="signing-city">Sorocaba, _____ de __________________ de ${year}.</p>
  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">
        <div class="sig-party">Contratante</div>
        <div class="sig-detail">${razao_social}</div>
        <div class="sig-detail">CNPJ ${cnpj}</div>
      </div>
    </div>
    <div class="sig-block">
      <div class="sig-line">
        <div class="sig-party">Contratada</div>
        <div class="sig-detail">61.252.058 Gustavo da Silva Siqueira</div>
        <div class="sig-detail">CNPJ 61.252.058/0001-17</div>
      </div>
    </div>
  </div>
  <div class="witnesses">
    <div class="wit-block">
      <div class="sig-line">
        <div class="sig-party">Testemunha 1</div>
        <div class="sig-detail">Nome: _________________________________</div>
        <div class="sig-detail">CPF: __________________________________</div>
      </div>
    </div>
    <div class="wit-block">
      <div class="sig-line">
        <div class="sig-party">Testemunha 2</div>
        <div class="sig-detail">Nome: _________________________________</div>
        <div class="sig-detail">CPF: __________________________________</div>
      </div>
    </div>
  </div>`
}

export function fillContratoSpot(d: SpotTemplateData): string {
  const totalFinal = d.forma_pagamento === 'integral' ? d.valor_total * 0.95 : d.valor_total
  const year = new Date().getFullYear()
  const servicesRows = d.servicos
    .map(s => `<tr><td>${s.name}</td><td style="text-align:right">R$ ${brl(s.price)}</td></tr>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${CSS}</head>
<body>
<div class="page">

${contractHeader()}

<div class="page-body">

  <div class="contract-title-block">
    <div class="contract-type-label">Contrato de Prestação de Serviços</div>
    <div class="contract-title">Projeto Pontual</div>
    <div class="contract-preamble">Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas decidem celebrar o presente contrato, regido pelas cláusulas e condições abaixo.</div>
  </div>

  <div class="parties">
    <div class="party-block">
      <div class="party-role">Contratada</div>
      <div class="party-name">61.252.058 GUSTAVO DA SILVA SIQUEIRA</div>
      <div class="party-detail">CNPJ n°: 61.252.058/0001-17</div>
      <div class="party-detail">Rua Fioravanti Stefani, 189 – Jd Montevideo, Sorocaba – SP – CEP: 18.077-224</div>
      <div class="party-detail">Rep. por: Gustavo da Silva Siqueira — RG nº 45.768.502-5 — CPF nº 444.057.208-19</div>
    </div>
    <div class="party-block">
      <div class="party-role">Contratante</div>
      <div class="party-name">${d.razao_social}</div>
      <div class="party-detail">CNPJ nº ${d.cnpj}</div>
      <div class="party-detail">${d.endereco}</div>
      <div class="party-detail">Rep. por: ${d.nome_representante} — RG nº ${d.rg} — CPF nº ${d.cpf}</div>
    </div>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Primeira</span><span class="clause-name">– Do Objeto</span></div>
    <p>1.1 O presente contrato tem por objeto a prestação de serviços profissionais especializados em marketing digital e comunicação, de caráter pontual, conforme projeto específico descrito na Ordem de Serviço (OS) vinculada a este contrato.</p>
    <p>1.2 Os serviços podem compreender, conforme OS: a) Identidade e posicionamento: naming, branding, posicionamento estratégico; b) Presença digital: landing page, site institucional, site estratégico; c) Social e conteúdo: organização digital, pack de posts, criativos para anúncios; d) Audiovisual: vídeo institucional, vídeos para anúncios; e) Estrutura de marketing: planejamento anual, setup de tráfego pago, implementação de CRM.</p>
    <p>1.3 O escopo detalhado, os entregáveis, os prazos, as revisões inclusas e o valor do projeto estão especificados na OS, parte integrante e inseparável deste contrato.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Segunda</span><span class="clause-name">– Da Ordem de Serviço e Documentação</span></div>
    <p>2.1 Cada projeto será formalizado por meio de uma OS assinada por ambas as partes, contendo: descrição detalhada dos entregáveis, prazo de execução, número de rodadas de revisão inclusas, forma e condições de pagamento.</p>
    <p>2.2 A CONTRATANTE deverá fornecer à CONTRATADA, no prazo máximo de 48 horas úteis após a assinatura da OS, todos os materiais, informações e acessos necessários ao início do projeto.</p>
    <p>2.3 A CONTRATANTE é única e exclusivamente responsável pela veracidade e legalidade de todo material fornecido.</p>
    <p>2.4 O prazo de execução terá início somente após: (i) assinatura de ambas as partes, (ii) confirmação do pagamento da entrada e (iii) recebimento integral de todos os materiais solicitados.</p>
    <p>2.5 A entrega de materiais fora do prazo implicará prorrogação proporcional do prazo de entrega, sem ônus à CONTRATADA.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Terceira</span><span class="clause-name">– Do Processo Criativo e Aprovações</span></div>
    <p>3.1 A CONTRATADA apresentará os entregáveis de acordo com o cronograma definido na OS, respeitando o número de rodadas de revisão contratadas.</p>
    <p>3.2 Entende-se por rodada de revisão o conjunto de ajustes solicitados em uma única comunicação formal.</p>
    <p>3.3 Revisões além das contratadas serão cobradas à razão de R$ 120,00 a R$ 150,00 por hora, mediante aprovação prévia.</p>
    <p>3.4 Após aprovação formal de cada entregável, não serão aceitas solicitações de alteração sem custo adicional.</p>
    <p>3.5 Caso a CONTRATANTE não se manifeste sobre uma entrega no prazo de 5 dias úteis, o material será considerado aprovado tacitamente.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Quarta</span><span class="clause-name">– Obrigações da Contratante</span></div>
    <p>4.1 Fornecer todos os materiais e informações necessários ao projeto no prazo e formato solicitados pela CONTRATADA.</p>
    <p>4.2 Designar um responsável para aprovar entregas e responder a solicitações da CONTRATADA no prazo de até 5 dias úteis.</p>
    <p>4.3 Efetuar os pagamentos na forma e condições estabelecidas na Cláusula Sexta e na OS.</p>
    <p>4.4 Para projetos que envolvam pesquisa de disponibilidade de marca (Naming) ou registro no INPI, arcar com os custos de pesquisa e taxas do INPI, cobrados separadamente.</p>
    <p>4.5 Para projetos que incluam CRM, arcar com as licenças das ferramentas contratadas.</p>
    <p>4.6 Arcar com os tributos de sua responsabilidade nos termos da legislação vigente.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Quinta</span><span class="clause-name">– Obrigações da Contratada</span></div>
    <p>5.1 Executar os serviços descritos na OS com diligência, técnica e criatividade, dentro dos prazos acordados.</p>
    <p>5.2 Manter sigilo absoluto sobre as informações, dados e materiais da CONTRATANTE, inclusive após a conclusão do projeto.</p>
    <p>5.3 Respeitar a legislação vigente aplicável à atividade publicitária, inclusive as normas do CONAR e do Código de Defesa do Consumidor.</p>
    <p>5.4 A CONTRATADA não se responsabiliza por: resultados comerciais decorrentes do material entregue; bloqueios ou remoções de conteúdo quando decorrentes de conteúdo fornecido ou aprovado pela CONTRATANTE.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Sexta</span><span class="clause-name">– Do Preço e das Condições de Pagamento</span></div>
    <p>6.1 O valor do projeto está definido na OS. Forma de pagamento acordada:</p>
    <div class="payment-line"><span class="payment-badge">${paymentTermsSpot(d.forma_pagamento, d.valor_total)}</span></div>
    <p style="margin-top:8px">6.2 Os pagamentos serão realizados mediante boleto bancário ou Pix, emitidos pela CONTRATADA.</p>
    <p>6.3 O atraso no pagamento suspenderá as entregas e implicará multa de 2% + juros de 1% a.m. + correção pelo IGPM/FGV.</p>
    <p>6.4 O não pagamento da entrada em até 3 dias úteis após a assinatura implicará cancelamento automático do projeto.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Sétima</span><span class="clause-name">– Do Prazo</span></div>
    <p>7.1 Este contrato vigora da assinatura da OS até a entrega final aprovada e a quitação integral.</p>
    <p>7.2 A CONTRATADA não se responsabiliza por atrasos causados por omissão da CONTRATANTE.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Oitava</span><span class="clause-name">– Da Rescisão</span></div>
    <p>8.1 A rescisão imotivada pela CONTRATANTE implica: a) Perda da parcela de entrada; b) Pagamento proporcional pelos serviços executados; c) Retenção dos arquivos editáveis até quitação integral.</p>
    <p>8.2 A rescisão motivada por descumprimento da CONTRATADA, não sanado em 5 dias úteis após notificação, dá direito à devolução proporcional dos valores não utilizados.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Nona</span><span class="clause-name">– Da Não Exclusividade</span></div>
    <p>9.1 Os serviços são prestados em caráter não exclusivo, podendo a CONTRATADA atender outros clientes, inclusive do mesmo segmento.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Décima</span><span class="clause-name">– Do Sigilo e Confidencialidade</span></div>
    <p>10.1 As partes se obrigam a manter sigilo sobre todas as informações e documentos trocados, não os divulgando a terceiros sem consentimento expresso.</p>
    <p>10.2 A CONTRATADA garantirá o tratamento de dados pessoais em conformidade com a Lei nº 13.709/2018 (LGPD).</p>
    <p>10.3 A CONTRATANTE autoriza o uso de seu nome e logotipo pela CONTRATADA para fins de portfólio, salvo solicitação expressa em contrário.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Décima Primeira</span><span class="clause-name">– Dos Direitos Autorais</span></div>
    <p>11.1 Todos os arquivos e peças criativas desenvolvidos pela CONTRATADA são de propriedade intelectual desta, vedada reprodução ou cessão sem autorização, sob pena de multa nos termos da Lei nº 9.610/98.</p>
    <p>11.2 Após quitação integral, a CONTRATADA cederá os arquivos finais nos formatos acordados na OS.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Décima Segunda</span><span class="clause-name">– Das Disposições Gerais</span></div>
    <p>12.1 As partes são contratantes independentes, sem vínculo trabalhista entre elas.</p>
    <p>12.2 Este contrato constitui obrigação de meio, não de resultado.</p>
    <p>12.3 Qualquer alteração somente é válida se formalizada por escrito e assinada por ambas as partes.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Décima Terceira</span><span class="clause-name">– Do Foro</span></div>
    <p>13.1 Fica eleito o foro da Comarca de Sorocaba – SP, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
  </div>

  <p style="margin:20px 0 6px;font-size:9pt;color:#555;">Por estarem assim justos e contratados, firmam o presente instrumento em 2 (duas) vias de igual teor, juntamente com 2 (duas) testemunhas.</p>
  ${signingBlock(d.razao_social, d.cnpj, year)}

  <div class="section-divider"><span>Ordem de Serviço</span></div>

  <div class="doc-box">
    <div class="doc-box-header">
      <span class="doc-box-title">Ordem de Serviço (OS)</span>
      <span class="doc-box-sub">Parte integrante deste contrato</span>
    </div>
    <div class="doc-box-body">
      <div class="doc-row">
        <div class="doc-field" style="flex:2">
          <label>Contratante</label>
          <div class="val">${d.razao_social}</div>
        </div>
        <div class="doc-field" style="flex:1">
          <label>CNPJ</label>
          <div class="val">${d.cnpj}</div>
        </div>
        <div class="doc-field" style="flex:1">
          <label>Data</label>
          <div class="val">${d.data_geracao}</div>
        </div>
      </div>

      <div class="doc-field" style="margin-top:8px">
        <label>Serviços Contratados</label>
        <table class="services-table">
          <thead><tr><th>Descrição do Serviço</th><th style="text-align:right;width:140px">Valor</th></tr></thead>
          <tbody>
            ${servicesRows}
            <tr class="total-row">
              <td>TOTAL${d.forma_pagamento === 'integral' ? ' — com 5% de desconto à vista' : ''}</td>
              <td style="text-align:right">R$ ${brl(totalFinal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="doc-field" style="margin-top:16px">
        <label>Forma de Pagamento</label>
        <div class="payment-line"><span class="payment-badge">${paymentTermsSpot(d.forma_pagamento, d.valor_total)}</span></div>
      </div>

      <div class="annex-sig">
        <div class="sig-block">
          <div class="sig-line">
            <div class="sig-party">Contratante</div>
            <div class="sig-detail">${d.razao_social}</div>
          </div>
        </div>
        <div class="sig-block">
          <div class="sig-line">
            <div class="sig-party">Contratada</div>
            <div class="sig-detail">Gustavo da Silva Siqueira</div>
          </div>
        </div>
      </div>
    </div>
  </div>

</div><!-- /page-body -->
</div><!-- /page -->
</body>
</html>`
}

export function fillContratoFee(d: FeeTemplateData): string {
  const planoLabel = PLANO_LABEL[d.plano]
  const conteudoLabel = d.plano_conteudo ? PLANO_CONTEUDO_LABEL[d.plano_conteudo] : null
  const conteudoValues: Record<'pulse' | 'flow' | 'engine', number> = { pulse: 1900, flow: 2800, engine: 4500 }
  const conteudoFee = d.plano_conteudo ? conteudoValues[d.plano_conteudo] : 0
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${CSS}</head>
<body>
<div class="page">

${contractHeader()}

<div class="page-body">

  <div class="contract-title-block">
    <div class="contract-type-label">Contrato de Prestação de Serviços</div>
    <div class="contract-title">Serviços Recorrentes de Marketing Digital</div>
    <div class="contract-preamble">Pelo presente instrumento particular, e na melhor forma de direito, as partes a seguir qualificadas decidem celebrar o presente contrato, regido pelas cláusulas e condições abaixo.</div>
  </div>

  <div class="parties">
    <div class="party-block">
      <div class="party-role">Contratada</div>
      <div class="party-name">61.252.058 GUSTAVO DA SILVA SIQUEIRA</div>
      <div class="party-detail">CNPJ n°: 61.252.058/0001-17</div>
      <div class="party-detail">Rua Fioravanti Stefani, 189 – Jd Montevideo, Sorocaba – SP – CEP: 18.077-224</div>
      <div class="party-detail">Rep. por: Gustavo da Silva Siqueira — RG nº 45.768.502-5 — CPF nº 444.057.208-19</div>
    </div>
    <div class="party-block">
      <div class="party-role">Contratante</div>
      <div class="party-name">${d.razao_social}</div>
      <div class="party-detail">CNPJ nº ${d.cnpj}</div>
      <div class="party-detail">${d.endereco}</div>
      <div class="party-detail">Rep. por: ${d.nome_representante} — RG nº ${d.rg} — CPF nº ${d.cpf}</div>
    </div>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Primeira</span><span class="clause-name">– Do Objeto</span></div>
    <p>1.1 O presente contrato tem por objeto a prestação de serviços profissionais especializados em marketing digital de forma recorrente, podendo abranger: gestão de tráfego pago (Meta Ads, Google Ads e demais plataformas), criação de criativos para anúncios, configuração e gestão de CRM, desenvolvimento de site e produção de relatórios de performance.</p>
    <p>1.2 O escopo detalhado, o <strong>Plano ${planoLabel}</strong> contratado, o valor mensal, a taxa de ativação e os entregáveis mensais estão descritos no Anexo I, parte integrante e inseparável deste instrumento.</p>
    <p>1.3 Quaisquer serviços não previstos no plano contratado serão considerados adicionais, tratados na forma da Cláusula Sexta.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Segunda</span><span class="clause-name">– Das Etapas de Onboarding e Documentação</span></div>
    <p>2.1 A CONTRATANTE deverá fornecer à CONTRATADA, em até 48 horas úteis após a assinatura: a) Acesso ao Meta Business Manager e conta de anúncios; b) Login do Instagram e link da página do Facebook; c) Acesso ao Google Ads/Analytics, se aplicável; d) Materiais de identidade visual; e) Briefing preenchido.</p>
    <p>2.2 Após recebimento da documentação e confirmação do pagamento da ativação e da primeira mensalidade, a CONTRATADA terá até 7 dias úteis para iniciar as entregas.</p>
    <p>2.3 A CONTRATADA fornecerá relatório mensal de performance até o 5º dia útil do mês subsequente.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Terceira</span><span class="clause-name">– Obrigações da Contratante</span></div>
    <p>3.1 Fornecer materiais e acessos em até 48 horas úteis após solicitação.</p>
    <p>3.2 Efetuar o pagamento das mensalidades na forma e condições da Cláusula Sexta.</p>
    <p>3.3 Responsabilizar-se pelo pagamento da verba de mídia diretamente às plataformas (Meta Ads, Google Ads etc.), valor independente do fee mensal.</p>
    <p>3.4 Não realizar alterações nas campanhas gerenciadas pela CONTRATADA sem prévia autorização, sob pena de rescisão.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Quarta</span><span class="clause-name">– Obrigações da Contratada</span></div>
    <p>4.1 Executar os serviços do plano contratado com diligência e dentro dos prazos estabelecidos no Anexo I.</p>
    <p>4.2 Manter sigilo absoluto sobre informações, dados, estratégias e materiais da CONTRATANTE.</p>
    <p>4.3 Responsabilizar-se pelos encargos trabalhistas e tributários de sua equipe.</p>
    <p>4.4 A CONTRATADA não se responsabiliza por: mau funcionamento de plataformas de terceiros; mudanças nos algoritmos das plataformas; bloqueios causados por conteúdo fornecido pela CONTRATANTE; garantia de número específico de leads ou vendas.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Quinta</span><span class="clause-name">– Dos Serviços</span></div>
    <p>5.1 Os serviços variam conforme o plano contratado (Anexo I): a) Gestão de tráfego pago; b) Criativos para anúncios; c) CRM; d) Site; e) Relatórios de performance.</p>
    <p>5.2 Gestão de conteúdo orgânico não está inclusa em nenhum plano de performance${conteudoLabel ? `, sendo contratada separadamente como add-on Plano ${conteudoLabel}, conforme Anexo I` : ''}.</p>
    <p>5.3 A verba de mídia não está inclusa no fee mensal e é responsabilidade exclusiva da CONTRATANTE.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Sexta</span><span class="clause-name">– Do Preço e das Condições de Pagamento</span></div>
    <p>6.1 Fee mensal: <strong>R$ ${brl(d.fee_mensal)}/mês</strong> (Plano ${planoLabel}) + taxa de ativação de <strong>R$ ${brl(d.taxa_ativacao)}</strong> no primeiro mês.${conteudoLabel ? ` Add-on de conteúdo Plano ${conteudoLabel}: <strong>R$ ${brl(conteudoFee)}/mês</strong>.` : ''}</p>
    <p>6.2 Vencimento das mensalidades: dia <strong>${d.dia_vencimento}</strong> de cada mês, via boleto ou Pix, emitidos com no mínimo 5 dias de antecedência.</p>
    <p>6.3 Atraso implica multa de 2% + juros de 1% a.m. + correção pelo IGPM/FGV. Não pagamento em 2 dias úteis do vencimento autoriza a suspensão dos serviços.</p>
    <p>6.4 Serviços adicionais serão cobrados à razão de R$ 120,00 a R$ 150,00/hora, mediante aprovação prévia.</p>
    <p>6.5 Os valores poderão ser reajustados anualmente pelo IGPM/FGV, com comunicação prévia de 30 dias.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Sétima</span><span class="clause-name">– Do Prazo</span></div>
    <p>7.1 Vigência mínima de <strong>${d.meses_min} meses</strong> a partir da assinatura.</p>
    <p>7.2 Após o prazo mínimo, renova-se automaticamente por períodos iguais, salvo comunicação de rescisão com 30 dias de antecedência.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Oitava</span><span class="clause-name">– Da Rescisão</span></div>
    <p>8.1 Rescisão imotivada antes do prazo mínimo: multa de 50% das parcelas vincendas até o fim do prazo mínimo. Não haverá devolução dos valores já pagos.</p>
    <p>8.2 Rescisão motivada por descumprimento da CONTRATADA, não sanado em 10 dias úteis após notificação, desobriga a CONTRATANTE da multa rescisória.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Nona</span><span class="clause-name">– Da Não Exclusividade</span></div>
    <p>9.1 Os serviços são prestados em caráter não exclusivo. A CONTRATADA pode atender outros clientes, inclusive do mesmo segmento.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Décima</span><span class="clause-name">– Do Sigilo e Confidencialidade</span></div>
    <p>10.1 As partes se obrigam a manter sigilo sobre todas as informações e documentos trocados, não os divulgando sem consentimento expresso.</p>
    <p>10.2 A CONTRATADA garantirá o tratamento de dados em conformidade com a LGPD (Lei nº 13.709/2018).</p>
    <p>10.3 A CONTRATANTE autoriza o uso de seu nome e logotipo pela CONTRATADA para portfólio e apresentações.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Décima Primeira</span><span class="clause-name">– Dos Direitos Autorais</span></div>
    <p>11.1 Todos os criativos e campanhas desenvolvidos pela CONTRATADA são de sua propriedade intelectual, vedada utilização fora do escopo deste contrato sem autorização.</p>
    <p>11.2 Ao término, os criativos finalizados serão entregues em formato editável mediante solicitação formal.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Décima Segunda</span><span class="clause-name">– Das Disposições Gerais</span></div>
    <p>12.1 As partes são contratantes independentes, sem vínculo trabalhista entre elas.</p>
    <p>12.2 Este contrato constitui obrigação de meio, não de resultado.</p>
  </div>

  <div class="clause">
    <div class="clause-header"><span class="clause-number">Cláusula Décima Terceira</span><span class="clause-name">– Do Foro</span></div>
    <p>13.1 Fica eleito o foro da Comarca de Sorocaba – SP, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
  </div>

  <p style="margin:20px 0 6px;font-size:9pt;color:#555;">Por estarem assim justos e contratados, firmam o presente instrumento em 2 (duas) vias de igual teor, juntamente com 2 (duas) testemunhas.</p>
  ${signingBlock(d.razao_social, d.cnpj, year)}

  <div class="section-divider"><span>Anexo I — Proposta Comercial</span></div>

  <div class="doc-box">
    <div class="doc-box-header">
      <span class="doc-box-title">Anexo I – Proposta Comercial</span>
      <span class="doc-box-sub">Parte integrante deste contrato</span>
    </div>
    <div class="doc-box-body">
      <div class="doc-row">
        <div class="doc-field" style="flex:2">
          <label>Contratante</label>
          <div class="val">${d.razao_social}</div>
        </div>
        <div class="doc-field" style="flex:1">
          <label>Data</label>
          <div class="val">${d.data_geracao}</div>
        </div>
      </div>

      <div class="doc-row" style="margin-top:16px;align-items:center">
        <div class="doc-field" style="flex:1">
          <label>Plano Contratado</label>
          <div style="margin-top:4px"><span class="plan-badge">${planoLabel}</span></div>
        </div>
        <div class="doc-field" style="flex:1">
          <label>Add-on de Conteúdo</label>
          <div style="margin-top:4px">${conteudoLabel ? `<span class="plan-badge orange">${conteudoLabel}</span>` : '<span style="color:#888;font-size:9pt">Não contratado</span>'}</div>
        </div>
        <div class="doc-field" style="flex:1">
          <label>Prazo Mínimo</label>
          <div class="val">${d.meses_min} meses</div>
        </div>
      </div>

      <div class="doc-row" style="margin-top:20px;border-top:1px solid #f0f0f0;padding-top:16px">
        <div class="doc-field" style="flex:1;text-align:center">
          <label style="display:block;text-align:center">Fee Mensal</label>
          <div class="plan-value" style="margin-top:4px">R$ ${brl(d.fee_mensal)}</div>
          <div class="plan-value-label">/mês</div>
        </div>
        <div class="doc-field" style="flex:1;text-align:center">
          <label style="display:block;text-align:center">Taxa de Ativação</label>
          <div class="plan-value" style="margin-top:4px">R$ ${brl(d.taxa_ativacao)}</div>
          <div class="plan-value-label">mês 1</div>
        </div>
        ${conteudoLabel ? `<div class="doc-field" style="flex:1;text-align:center">
          <label style="display:block;text-align:center">Fee Conteúdo (${conteudoLabel})</label>
          <div class="plan-value" style="margin-top:4px">R$ ${brl(conteudoFee)}</div>
          <div class="plan-value-label">/mês</div>
        </div>` : ''}
      </div>

      <div class="doc-row" style="margin-top:16px">
        <div class="doc-field" style="flex:1">
          <label>Vencimento das Mensalidades</label>
          <div class="val">Dia ${d.dia_vencimento} de cada mês</div>
        </div>
        <div class="doc-field" style="flex:1">
          <label>Início Previsto</label>
          <div class="val">_____/_____/_____</div>
        </div>
        <div class="doc-field" style="flex:1">
          <label>Verba de Mídia Prevista</label>
          <div class="val">R$ ___________________</div>
        </div>
      </div>

      <div class="annex-sig">
        <div class="sig-block">
          <div class="sig-line">
            <div class="sig-party">Contratante</div>
            <div class="sig-detail">${d.razao_social}</div>
          </div>
        </div>
        <div class="sig-block">
          <div class="sig-line">
            <div class="sig-party">Contratada</div>
            <div class="sig-detail">Gustavo da Silva Siqueira</div>
          </div>
        </div>
      </div>
    </div>
  </div>

</div><!-- /page-body -->
</div><!-- /page -->
</body>
</html>`
}
