import 'server-only';
import { q, one } from './db';

/** Etapas do orçamento da calculadora vinculado ao projeto: as marcadas com horas e todas as do modelo. */
export async function etapasDoOrcamentoDb(projetoId) {
  const o = await one('SELECT id, nome, dados FROM orcamentos WHERE projeto_id = $1 ORDER BY id DESC LIMIT 1', [projetoId]);
  if (!o) return null;
  const todas = (o.dados?.etapas || []).filter((e) => e.nome);
  return {
    orcamento: { id: o.id, nome: o.nome },
    validas: todas.filter((e) => e.on !== false && Number(e.horas) > 0).map((e) => e.nome),
    todas: todas.map((e) => e.nome),
  };
}

/**
 * Deixa no projeto só as etapas marcadas (com horas) no orçamento, sem recriar as que ficam
 * (mantém datas, situação e os horários reservados na agenda). Etapas criadas à mão continuam no fim.
 * Devolve true se mudou alguma coisa.
 */
export async function aplicarEtapasDoOrcamento(projetoId) {
  const orc = await etapasDoOrcamentoDb(projetoId);
  if (!orc) return false;
  const atuais = await q('SELECT id, nome FROM etapas WHERE projeto_id = $1 ORDER BY ordem, id', [projetoId]);
  const sobrando = atuais.filter((e) => orc.todas.includes(e.nome) && !orc.validas.includes(e.nome));
  const faltando = orc.validas.filter((n) => !atuais.some((e) => e.nome === n));
  if (!sobrando.length && !faltando.length) return false;
  for (const e of sobrando) await q('DELETE FROM etapas WHERE id = $1', [e.id]);
  for (const n of faltando) await q("INSERT INTO etapas (projeto_id, ordem, nome, status) VALUES ($1, 999, $2, 'pendente')", [projetoId, n]);
  // Ordem: as do orçamento na ordem da calculadora, depois as criadas à mão
  const lista = await q('SELECT id, nome FROM etapas WHERE projeto_id = $1 ORDER BY ordem, id', [projetoId]);
  const pos = (e) => { const i = orc.validas.indexOf(e.nome); return i >= 0 ? i : 1000 + lista.indexOf(e); };
  const ordenada = [...lista].sort((a, b) => pos(a) - pos(b));
  for (let i = 0; i < ordenada.length; i++) await q('UPDATE etapas SET ordem = $2 WHERE id = $1', [ordenada[i].id, i]);
  return true;
}
