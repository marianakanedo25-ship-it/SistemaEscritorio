// Financeiro pessoal: mesmo método da 000_PLANILHA (Entradas, Contas, Cartão XP, Investimentos), com "feito" = Sim.

export const TIPOS = [
  { id: 'entrada', nome: 'Entradas', sub: 'Aluguéis, pró-labore, projetos', feito: 'Recebido', sinal: 1 },
  { id: 'conta', nome: 'Contas', sub: 'Despesas fixas e outras', feito: 'Pago', sinal: -1 },
  { id: 'cartao', nome: 'Cartão XP', sub: 'Itens da fatura (ou só o total)', feito: 'Pago', sinal: -1 },
  { id: 'investimento', nome: 'Investimentos', sub: 'Transferências para a XP', feito: 'Investido', sinal: -1 },
];

/** Gastos que não estavam no plano do mês: saem da sobra (já foram gastos). */
export const EXTRA = 'extra';
/** Dinheiro que entrou e não estava previsto (presente, venda, reembolso…): soma na sobra. */
export const EXTRA_ENTRADA = 'extra_entrada';

const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

/** Totais do mês. saldoAnterior: o que veio do mês anterior. */
export function resumoMes(linhas, saldoAnterior = 0) {
  const t = {}; const f = {};
  for (const tp of TIPOS) { t[tp.id] = 0; f[tp.id] = 0; }
  let extras = 0, extrasEntrada = 0;
  for (const l of linhas) {
    if (l.tipo === EXTRA) { extras += Number(l.valor) || 0; continue; }
    if (l.tipo === EXTRA_ENTRADA) { extrasEntrada += Number(l.valor) || 0; continue; }
    if (!(l.tipo in t)) continue;
    t[l.tipo] += Number(l.valor) || 0;
    if (l.feito) f[l.tipo] += Number(l.valor) || 0;
  }
  const saidas = t.conta + t.cartao + t.investimento;
  const saidasFeitas = f.conta + f.cartao + f.investimento;
  const ant = Number(saldoAnterior) || 0;
  return {
    saldoAnterior: r2(ant),
    entradas: r2(t.entrada), contas: r2(t.conta), cartao: r2(t.cartao), investimentos: r2(t.investimento),
    gastos: r2(t.conta + t.cartao),
    sobraPlanejada: r2(ant + t.entrada - saidas), // o que sobraria só com o planejado
    extras: r2(extras), // gastos fora do plano
    extrasEntrada: r2(extrasEntrada), // dinheiro que entrou fora do plano
    sobra: r2(ant + t.entrada - saidas - extras + extrasEntrada), // previsão final com o que aconteceu fora do plano
    saldoAgora: r2(ant + f.entrada - saidasFeitas - extras + extrasEntrada), // só o que está marcado como feito (os de fora do plano já aconteceram)
    aPagar: r2(saidas - saidasFeitas),
    aReceber: r2(t.entrada - f.entrada),
    feitos: f,
  };
}

/** "3--8", "03/08", "3 de 8" → { atual: 3, total: 8 } */
export function lerParcela(p) {
  const m = String(p || '').match(/(\d+)\D+(\d+)/);
  return m ? { atual: Number(m[1]), total: Number(m[2]) } : null;
}
export function normalizarParcela(p) {
  const x = lerParcela(p);
  return x ? `${x.atual}/${x.total}` : (String(p || '').trim() || null);
}

/**
 * Linhas para começar o mês seguinte: fixas continuam, parceladas avançam uma parcela
 * (a última não passa), e compras do cartão sem parcela não se repetem.
 */
export function linhasDoProximoMes(linhas) {
  const out = [];
  for (const l of linhas) {
    if (l.tipo === EXTRA || l.tipo === EXTRA_ENTRADA) continue; // o que foi fora do plano não se repete
    const p = lerParcela(l.parcela);
    if (p && p.atual >= p.total) continue;
    if (l.tipo === 'cartao' && !p) continue;
    out.push({ tipo: l.tipo, descricao: l.descricao, valor: l.valor, parcela: p ? `${p.atual + 1}/${p.total}` : null, data: maisUmMes(l.data), obs: l.obs || null, feito: false });
  }
  return out;
}

export function maisUmMes(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return null;
  let [y, m, d] = iso.split('-').map(Number);
  m += 1; if (m > 12) { m = 1; y += 1; }
  const ult = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(Math.min(d, ult)).padStart(2, '0')}`;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Interpreta a 000_PLANILHA já lida (abas → células). Usa só as abas "Mês Ano" que têm lançamentos.
 * Devolve [{ mes: 'AAAA-MM', saldoManual: número|null, linhas: [...] }]
 */
export function interpretarPlanilha(abas, dataExcel) {
  const meses = [];
  for (const [nome, cel] of Object.entries(abas)) {
    const m = semAcento(nome).match(/^([a-z]+)\s+(\d{4})$/);
    const idx = m ? MESES.map(semAcento).indexOf(m[1]) : -1;
    if (idx < 0) continue;
    const mes = `${m[2]}-${String(idx + 1).padStart(2, '0')}`;
    const V = (ref) => cel[ref]?.v;
    // Linhas por número
    const maxLinha = Math.max(0, ...Object.keys(cel).map((r) => Number(r.replace(/[A-Z]+/, ''))));
    const linhas = [];
    let tipo = null, cols = null;
    for (let i = 1; i <= maxLinha; i++) {
      const a = String(V('A' + i) ?? '').trim();
      const au = semAcento(a);
      const sec = au.match(/^\d\s+(entradas|contas|cartao|investimentos)/);
      if (sec) { tipo = { entradas: 'entrada', contas: 'conta', cartao: 'cartao', investimentos: 'investimento' }[sec[1]]; cols = null; continue; }
      if (!tipo) continue;
      if (au === 'descricao') {
        cols = {};
        for (const L of ['A', 'B', 'C', 'D', 'E', 'F']) {
          const h = semAcento(V(L + i));
          if (h.startsWith('descri')) cols.desc = L;
          else if (h.startsWith('valor')) cols.valor = L;
          else if (h.endsWith('?')) cols.feito = L;
          else if (h.includes('parcela') || h.startsWith('observ')) cols.obs = L;
          else if (h.startsWith('data')) cols.data = L;
        }
        continue;
      }
      if (au.startsWith('total da tabela')) { tipo = null; cols = null; continue; }
      if (!cols) continue;
      const valor = V(cols.valor + i);
      if (typeof valor !== 'number' || !valor) continue;
      const obs = cols.obs ? V(cols.obs + i) : null;
      const dt = cols.data ? V(cols.data + i) : null;
      const p = normalizarParcela(typeof obs === 'string' ? obs : null);
      linhas.push({
        tipo, descricao: a || '(sem descrição)', valor: Math.round(valor * 100) / 100,
        feito: semAcento(cols.feito ? V(cols.feito + i) : '') === 'sim',
        parcela: lerParcela(p) ? p : null,
        obs: !lerParcela(p) && obs != null && String(obs).trim() ? String(obs).trim() : null,
        data: typeof dt === 'number' ? dataExcel(dt) : null,
      });
    }
    if (!linhas.length) continue;
    const b4 = cel.B4;
    meses.push({ mes, saldoManual: b4 && !b4.f && typeof b4.v === 'number' ? Math.round(b4.v * 100) / 100 : null, linhas });
  }
  return meses.sort((a, b) => a.mes.localeCompare(b.mes));
}
