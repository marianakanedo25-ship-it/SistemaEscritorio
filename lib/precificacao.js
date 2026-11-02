import { ETAPAS_PADRAO } from './format';
// Valores iniciais da calculadora (os mesmos da calculadora de precificação da Mariana).
export const CONFIG_PADRAO = {
  custos: [
    { nome: 'Aluguel da estrutura (rateio)', valor: 7200, freq: 'mes', pct: 5 },
    { nome: 'Água da loja (rateio)', valor: 490, freq: 'mes', pct: 5 },
    { nome: 'Internet da loja (rateio)', valor: 150, freq: 'mes', pct: 5 },
    { nome: 'CAU pessoa física', valor: 790, freq: 'ano', pct: 100 },
    { nome: 'Contabilidade', valor: 250, freq: 'mes', pct: 100 },
    { nome: 'Softwares (Magnific, ChatGPT…)', valor: 0, freq: 'mes', pct: 100 },
    { nome: 'Mentoria ARQ.CEO', valor: 0, freq: 'mes', pct: 100 },
    { nome: 'Tráfego pago / marketing', valor: 0, freq: 'mes', pct: 100 },
  ],
  proLabore: 8000, horasMes: 100, imposto: 6, lucro: 20, negociacao: 10,
};

export const FATORES = [['0.9', 'Simples (×0,9)'], ['1', 'Normal (×1,0)'], ['1.15', 'Detalhada (×1,15)'], ['1.3', 'Alta (×1,3)']];

export function custoMes(c) {
  return (Number(c.valor) || 0) * ((Number(c.pct) || 0) / 100) / (c.freq === 'ano' ? 12 : 1);
}

export function calcular(cfg, o) {
  const fixos = (cfg.custos || []).reduce((s, c) => s + custoMes(c), 0);
  const pl = Number(cfg.proLabore) || 0;
  const hm = Number(cfg.horasMes) || 0;
  const hora = hm > 0 ? (fixos + pl) / hm : 0;
  const fator = Number(o.fator) || 1;
  const horasBase = (o.etapas || []).filter((e) => e.on !== false).reduce((s, e) => s + (Number(e.horas) || 0), 0);
  const horas = horasBase * fator;
  const tempo = horas * hora;
  const desp = (o.desp || []).reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const base = tempo + desp;
  const imp = (Number(cfg.imposto) || 0) / 100, luc = (Number(cfg.lucro) || 0) / 100, neg = (Number(cfg.negociacao) || 0) / 100;
  const ok = imp + luc < 1 && neg < 1;
  const minimo = imp < 1 ? base / (1 - imp) : 0;
  const ideal = ok ? base / (1 - imp - luc) : 0;
  const prop = ok ? ideal / (1 - neg) : 0;
  const final = Number(o.valorFinal) || 0;
  const valor = final || prop;
  const area = Number(o.area) || 0;
  const parc = Math.max(1, Number(o.parcelas) || 1);
  return { fixos, pl, hm, hora, fator, horasBase, horas, tempo, desp, base, imp, luc, neg, ok, minimo, ideal, prop, final, valor,
    lucroReal: final ? final * (1 - imp) - base : ideal * luc, area, parc, parcela: valor / parc, cap: hm ? horas / hm : 0 };
}

const TIPO_PADRAO = 'Interiores residencial';
const ETAPAS_MODELO = ETAPAS_PADRAO;

export function orcNovo() {
  return {
    id: null, cliente_id: '', nome: '', tipo: TIPO_PADRAO, area: '', fator: '1', parcelas: 4, valorFinal: '',
    etapas: ETAPAS_MODELO.map(([nome, horas], i) => ({ key: 'e' + i, nome, horas, on: true })),
    desp: [{ key: 'd0', nome: 'Deslocamento e visitas', valor: 0 }, { key: 'd1', nome: 'Impressões e entrega física', valor: 0 }],
  };
}

export function orcDeSalvo(o) {
  const d = o.dados || {};
  return {
    id: o.id, cliente_id: o.cliente_id ? String(o.cliente_id) : '', nome: o.nome || '', tipo: o.tipo || TIPO_PADRAO, area: o.area ?? '',
    fator: d.fator || '1', parcelas: d.parcelas || 1, valorFinal: d.valorFinal ?? '',
    etapas: (d.etapas || []).map((e, i) => ({ key: 'e' + i, nome: e.nome, horas: e.horas, on: e.on !== false })),
    desp: (d.desp || []).map((x, i) => ({ key: 'd' + i, nome: x.nome, valor: x.valor })),
  };
}
