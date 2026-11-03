import 'server-only';
import { q } from './db';
import { resumoMes } from './pessoal';

/**
 * Resumo de todos os meses com lançamentos, encadeando o saldo:
 * o saldo que vem do mês anterior é a sobra prevista dele, a não ser que você tenha digitado outro valor.
 */
export async function resumoDosMeses() {
  const [linhas, meses] = await Promise.all([
    q('SELECT mes, tipo, valor, feito FROM pf_lancamentos'),
    q('SELECT mes, saldo_inicial FROM pf_meses'),
  ]);
  const porMes = {};
  for (const l of linhas) (porMes[l.mes] ||= []).push(l);
  const manual = Object.fromEntries(meses.filter((m) => m.saldo_inicial != null).map((m) => [m.mes, Number(m.saldo_inicial)]));
  const todos = [...new Set([...Object.keys(porMes), ...Object.keys(manual)])].sort();
  const out = {};
  let anterior = 0;
  for (const mes of todos) {
    const ini = mes in manual ? manual[mes] : anterior;
    const r = resumoMes(porMes[mes] || [], ini);
    out[mes] = { ...r, manual: mes in manual, temLinhas: !!porMes[mes] };
    anterior = r.sobra;
  }
  return { meses: todos, resumo: out };
}

/** Saldo que chega ao mês `mes` (sobra prevista do último mês anterior com dados). */
export function saldoQueChega(dados, mes) {
  const antes = dados.meses.filter((m) => m < mes);
  return antes.length ? dados.resumo[antes[antes.length - 1]].sobra : 0;
}
