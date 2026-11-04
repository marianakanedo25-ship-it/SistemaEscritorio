'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { q, one, getConfig, setConfig } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { hoje } from '@/lib/format';
import { KITNETS_INICIAIS } from '@/lib/kitnets-dados';

const txt = (fd, k) => { const v = String(fd.get(k) ?? '').trim(); return v || null; };
const num = (fd, k) => { const v = String(fd.get(k) ?? '').trim().replace(',', '.'); return v === '' ? null : Number(v); };

function refresh(id) {
  revalidatePath('/kitnets');
  if (id) revalidatePath(`/kitnets/${id}`);
}

/** Importa as 8 kitnets lidas do Drive. Só funciona com a aba vazia, para não duplicar. */
export async function importarKitnets() {
  await exigir('kitnets');
  const n = await one('SELECT count(*)::int AS n FROM kit_unidades');
  if (n.n > 0) return;
  for (const k of KITNETS_INICIAIS) {
    const u = await one(
      `INSERT INTO kit_unidades (grupo, numero, endereco, locador, inquilino, aluguel, vencimento_dia, inicio, fim, uc_agua, valor_kwh, obs)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [k.grupo, k.numero, k.endereco, k.locador, k.inquilino, k.aluguel, k.vencimento_dia, k.inicio, k.fim, k.uc_agua, k.valor_kwh, k.obs || null]
    );
    for (const [da, la, dt, lt, vk, obs] of k.leituras) {
      await q(`INSERT INTO kit_leituras (unidade_id, data_anterior, leitura_anterior, data_atual, leitura_atual, valor_kwh, franquia_kwh, obs)
               VALUES ($1,$2,$3,$4,$5,$6,150,$7)`, [u.id, da, la, dt, lt, vk, obs || null]);
    }
  }
  refresh();
}

export async function salvarUnidade(fd) {
  await exigir('kitnets');
  const id = Number(fd.get('id')) || null;
  const grupo = txt(fd, 'grupo');
  if (!grupo) return { erro: 'Informe o endereço/grupo da kitnet.' };
  const vals = [grupo, Number(fd.get('numero')) || 1, txt(fd, 'endereco'), txt(fd, 'locador'), txt(fd, 'inquilino'), txt(fd, 'telefone'),
    num(fd, 'aluguel') || 0, Number(fd.get('vencimento_dia')) || null, txt(fd, 'inicio'), txt(fd, 'fim'),
    num(fd, 'franquia_kwh') ?? 150, num(fd, 'valor_kwh') ?? 0.966, txt(fd, 'uc_agua'), txt(fd, 'pasta_drive'), txt(fd, 'obs')];
  if (id) {
    await q(`UPDATE kit_unidades SET grupo=$2, numero=$3, endereco=$4, locador=$5, inquilino=$6, telefone=$7, aluguel=$8, vencimento_dia=$9,
      inicio=$10, fim=$11, franquia_kwh=$12, valor_kwh=$13, uc_agua=$14, pasta_drive=$15, obs=$16 WHERE id=$1`, [id, ...vals]);
  } else {
    await q(`INSERT INTO kit_unidades (grupo, numero, endereco, locador, inquilino, telefone, aluguel, vencimento_dia, inicio, fim, franquia_kwh, valor_kwh, uc_agua, pasta_drive, obs)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`, vals);
  }
  refresh(id);
}

export async function excluirUnidade(id) {
  await exigir('kitnets');
  const u = await one('DELETE FROM kit_unidades WHERE id = $1 RETURNING grupo', [id]);
  refresh();
  redirect('/kitnets' + (u?.grupo ? '?g=' + encodeURIComponent(u.grupo) : ''));
}

export async function salvarLeitura(fd) {
  await exigir('kitnets');
  const id = Number(fd.get('id')) || null;
  const unidade = Number(fd.get('unidade_id')) || null;
  const dataAtual = txt(fd, 'data_atual');
  const atual = num(fd, 'leitura_atual');
  if (!unidade) return { erro: 'Unidade não encontrada.' };
  if (!dataAtual || atual === null) return { erro: 'Informe a data e a leitura atual.' };
  const vals = [unidade, txt(fd, 'data_anterior'), num(fd, 'leitura_anterior') ?? 0, dataAtual, atual,
    num(fd, 'valor_kwh') ?? 0, num(fd, 'franquia_kwh') ?? 150, txt(fd, 'pago_em'), txt(fd, 'obs')];
  if (id) {
    await q(`UPDATE kit_leituras SET unidade_id=$2, data_anterior=$3, leitura_anterior=$4, data_atual=$5, leitura_atual=$6,
      valor_kwh=$7, franquia_kwh=$8, pago_em=$9, obs=$10 WHERE id=$1`, [id, ...vals]);
  } else {
    await q(`INSERT INTO kit_leituras (unidade_id, data_anterior, leitura_anterior, data_atual, leitura_atual, valor_kwh, franquia_kwh, pago_em, obs)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, vals);
  }
  refresh(unidade);
}

export async function excluirLeitura(id) {
  await exigir('kitnets');
  const r = await one('DELETE FROM kit_leituras WHERE id = $1 RETURNING unidade_id', [id]);
  refresh(r?.unidade_id);
}

/** Marca o mês (aluguel + energia) como pago, ou desfaz. */
export async function alternarPagoLeitura(id) {
  await exigir('kitnets');
  const r = await one(`UPDATE kit_leituras SET pago_em = CASE WHEN pago_em IS NULL THEN $2 ELSE NULL END WHERE id = $1 RETURNING unidade_id`, [id, hoje()]);
  refresh(r?.unidade_id);
}

/** Salva de uma vez as próximas leituras digitadas na tabela de energia. */
export async function salvarLeiturasLote(lista) {
  await exigir('kitnets');
  const validas = (Array.isArray(lista) ? lista : []).filter((l) => Number(l.unidade_id) && l.data_atual && l.leitura_atual !== '' && l.leitura_atual != null);
  for (const l of validas) {
    await q(`INSERT INTO kit_leituras (unidade_id, data_anterior, leitura_anterior, data_atual, leitura_atual, valor_kwh, franquia_kwh)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [Number(l.unidade_id), l.data_anterior || null, Number(l.leitura_anterior) || 0, l.data_atual, Number(l.leitura_atual),
        Number(l.valor_kwh) || 0, l.franquia_kwh === '' || l.franquia_kwh == null ? 150 : Number(l.franquia_kwh)]);
  }
  refresh();
  return { salvas: validas.length };
}

/**
 * Salva os dados do contrato: atualiza a kitnet (inquilino, valores, vigência) e os dados do locador do bairro.
 * Os dados do locador ficam no banco (config), nunca no código.
 */
export async function salvarContratoKitnet(id, d) {
  await exigir('kitnets');
  const u = await one('SELECT id, grupo FROM kit_unidades WHERE id = $1', [Number(id) || 0]);
  if (!u) return { erro: 'Kitnet não encontrada.' };
  const s = (v) => { const t = String(v ?? '').trim(); return t || null; };
  const n = (v) => { const t = String(v ?? '').trim().replace(',', '.'); return t === '' ? null : Number(t); };
  const T = d?.locatario || {};
  const extras = { residencia: s(T.residencia), composicao: s(d?.composicao), antecipado: s(d?.antecipado), usarFiador: !!d?.usarFiador,
    fiador: d?.fiador || {}, dataAssinatura: s(d?.dataAssinatura), cidade: s(d?.cidade),
    primeiroPagamento: s(d?.primeiroPagamento), ultimoPagamento: s(d?.ultimoPagamento) };
  await q(`UPDATE kit_unidades SET inquilino=$2, qualificacao=$3, rg=$4, cpf=$5, aluguel=COALESCE($6, aluguel), vencimento_dia=$7,
    inicio=$8, fim=$9, uc_agua=$10, franquia_kwh=COALESCE($11, franquia_kwh), numero=COALESCE($12, numero), contrato=$13::jsonb WHERE id=$1`,
    [u.id, s(T.nome), s(T.qualificacao), s(T.rg), s(T.cpf), n(d?.aluguel), Number(d?.vencimentoDia) || null,
      s(d?.inicio), s(d?.fim), s(d?.ucAgua), n(d?.franquia), Number(d?.kitnet) || null, JSON.stringify(extras)]);
  if (d?.locador) {
    const L = d.locador;
    const todos = (await getConfig('kit_locadores', {})) || {};
    todos[u.grupo] = { nome: s(L.nome) || '', qualificacao: s(L.qualificacao) || '', rg: s(L.rg) || '', cpf: s(L.cpf) || '', endereco: s(L.endereco) || '',
      pix: s(L.pix) || '', pixTitular: s(L.pixTitular) || '', imovel: s(L.imovel) || '', composicao: s(L.composicao) || '' };
    await setConfig('kit_locadores', todos);
  }
  refresh(u.id);
  revalidatePath(`/kitnets/${u.id}/contrato`);
  return { ok: true };
}

/** Salva o termo de vistoria da kitnet (o último preenchido). */
export async function salvarVistoriaKitnet(id, v) {
  await exigir('kitnets');
  const u = await one('SELECT id FROM kit_unidades WHERE id = $1', [Number(id) || 0]);
  if (!u) return { erro: 'Kitnet não encontrada.' };
  const limpo = {
    tipo: v?.tipo === 'saida' ? 'saida' : 'entrada',
    data: String(v?.data || ''), dataAssinatura: String(v?.dataAssinatura || ''), cidade: String(v?.cidade || ''),
    endereco: String(v?.endereco || ''),
    condicoes: v?.condicoes && typeof v.condicoes === 'object' ? v.condicoes : {},
    ambientes: Array.isArray(v?.ambientes) ? v.ambientes.slice(0, 30).map((a) => ({ nome: String(a.nome || ''), itens: String(a.itens || ''), condicoes: String(a.condicoes || ''), obs: String(a.obs || '') })) : [],
    obsGerais: String(v?.obsGerais || ''), wifi: String(v?.wifi || ''),
    itens: Array.isArray(v?.itens) ? v.itens.slice(0, 40).map((it) => ({ nome: String(it.nome || ''), op: (Array.isArray(it.op) ? it.op : ['Bom', 'Regular', 'Ruim']).map(String).slice(0, 4) })) : undefined,
  };
  await q('UPDATE kit_unidades SET vistoria = $2::jsonb WHERE id = $1', [u.id, JSON.stringify(limpo)]);
  return { ok: true };
}
