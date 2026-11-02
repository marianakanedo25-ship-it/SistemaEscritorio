'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { q, one, getConfig, setConfig } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { hoje } from '@/lib/format';
import { CONFIG_PADRAO, calcular } from '@/lib/precificacao';

function limparCfg(c) {
  return {
    custos: (Array.isArray(c.custos) ? c.custos : []).slice(0, 60).map((x) => ({
      nome: String(x.nome || '').slice(0, 120), valor: Number(x.valor) || 0, freq: x.freq === 'ano' ? 'ano' : 'mes', pct: Number(x.pct) || 0,
    })),
    proLabore: Number(c.proLabore) || 0, horasMes: Number(c.horasMes) || 0,
    imposto: Number(c.imposto) || 0, lucro: Number(c.lucro) || 0, negociacao: Number(c.negociacao) || 0,
  };
}

export async function salvarConfigPrec(cfg) {
  await exigir('precificacao');
  await setConfig('precificacao', limparCfg(cfg));
}

export async function salvarOrcamento(o) {
  await exigir('precificacao');
  const cfg = await getConfig('precificacao', CONFIG_PADRAO);
  const r = calcular(cfg, o);
  const dados = {
    fator: String(o.fator || '1'), parcelas: r.parc, valorFinal: Number(o.valorFinal) || '',
    etapas: (o.etapas || []).map((e) => ({ nome: String(e.nome || ''), horas: Number(e.horas) || 0, on: e.on !== false })),
    desp: (o.desp || []).map((d) => ({ nome: String(d.nome || ''), valor: Number(d.valor) || 0 })),
    resultado: { horas: r.horas, hora: r.hora, minimo: r.minimo, ideal: r.ideal, prop: r.prop },
  };
  const vals = [Number(o.cliente_id) || null, String(o.nome || '').trim() || null, o.tipo || null, Number(o.area) || null, Math.round(r.valor * 100) / 100, JSON.stringify(dados)];
  let id = Number(o.id) || null;
  if (id) await q('UPDATE orcamentos SET cliente_id=$2, nome=$3, tipo=$4, area=$5, valor=$6, dados=$7::jsonb WHERE id=$1', [id, ...vals]);
  else id = (await one(`INSERT INTO orcamentos (cliente_id, nome, tipo, area, valor, dados, data) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING id`, [...vals, hoje()])).id;
  revalidatePath('/precificacao');
  return { id };
}

export async function mudarStatusOrc(id, status) {
  await exigir('precificacao');
  if (!['rascunho', 'enviado', 'aprovado', 'recusado'].includes(status)) return;
  await q('UPDATE orcamentos SET status = $2 WHERE id = $1', [id, status]);
  revalidatePath('/precificacao');
}

export async function excluirOrcamento(id) {
  await exigir('precificacao');
  await q('DELETE FROM orcamentos WHERE id = $1', [id]);
  revalidatePath('/precificacao');
}

/** Cria um projeto a partir do orçamento: etapas, valor e contrato em rascunho. */
export async function criarProjetoDoOrcamento(id) {
  await exigir('projetos');
  const o = await one('SELECT * FROM orcamentos WHERE id = $1', [id]);
  if (!o) return;
  if (o.projeto_id) redirect(`/projetos/${o.projeto_id}`);
  const nome = o.nome || 'Novo projeto';
  const p = await one(`INSERT INTO projetos (cliente_id, nome, tipo, area, valor, status, inicio) VALUES ($1,$2,$3,$4,$5,'andamento',$6) RETURNING id`,
    [o.cliente_id, nome, o.tipo, o.area, o.valor, hoje()]);
  // Só as etapas marcadas na calculadora e com horas calculadas.
  const etapas = (o.dados?.etapas || []).filter((e) => e.on !== false && e.nome && Number(e.horas) > 0);
  for (let i = 0; i < etapas.length; i++) {
    await q('INSERT INTO etapas (projeto_id, ordem, nome) VALUES ($1,$2,$3)', [p.id, i, etapas[i].nome]);
  }
  await q(`INSERT INTO contratos (projeto_id, cliente_id, descricao, valor, status, obs) VALUES ($1,$2,$3,$4,'rascunho',$5)`,
    [p.id, o.cliente_id, nome + (o.area ? ` · ${o.area} m²` : ''), o.valor, `Gerado a partir do orçamento nº ${o.id}`]);
  await q(`UPDATE orcamentos SET projeto_id = $2, status = 'aprovado' WHERE id = $1`, [id, p.id]);
  revalidatePath('/projetos');
  redirect(`/projetos/${p.id}`);
}

/** Guarda o texto editado da proposta dentro do orçamento. */
export async function salvarProposta(id, p) {
  await exigir('precificacao');
  const s = (v, max = 4000) => String(v ?? '').slice(0, max);
  const limpa = {
    titulo: s(p.titulo, 200), cliente: s(p.cliente, 200), data: s(p.data, 10), objeto: s(p.objeto),
    etapas: (Array.isArray(p.etapas) ? p.etapas : []).slice(0, 40).map((e) => ({ nome: s(e.nome, 200), descricao: s(e.descricao, 1000) })),
    entrega: s(p.entrega), prazo: s(p.prazo), valor: Number(p.valor) || 0, pagamento: s(p.pagamento),
    naoIncluso: s(p.naoIncluso), validade: s(p.validade, 500), obs: s(p.obs),
  };
  await q(`UPDATE orcamentos SET dados = jsonb_set(dados, '{proposta}', $2::jsonb) WHERE id = $1`, [id, JSON.stringify(limpa)]);
  revalidatePath('/precificacao');
}
