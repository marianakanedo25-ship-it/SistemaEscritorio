'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { q, one } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { ETAPAS_PADRAO, STATUS_ETAPA, STATUS_CONTRATO } from '@/lib/format';

const txt = (fd, k) => { const v = String(fd.get(k) ?? '').trim(); return v || null; };
const num = (fd, k) => { const v = String(fd.get(k) ?? '').trim().replace(',', '.'); return v === '' ? null : Number(v); };
const int = (fd, k) => Number(fd.get(k)) || null;

function refresh(id) {
  revalidatePath('/projetos');
  revalidatePath('/agenda');
  revalidatePath('/dashboard');
  if (id) revalidatePath(`/projetos/${id}`);
}

export async function salvarProjeto(fd) {
  await exigir('projetos');
  const id = int(fd, 'id');
  const nome = txt(fd, 'nome');
  if (!nome) return { erro: 'Informe o nome do projeto.' };
  const vals = [int(fd, 'cliente_id'), nome, txt(fd, 'tipo'), num(fd, 'area'), txt(fd, 'endereco_obra'), txt(fd, 'status') || 'andamento',
    txt(fd, 'cor') || '#7C847A', num(fd, 'valor'), txt(fd, 'inicio'), txt(fd, 'previsao'), txt(fd, 'pasta_drive'), txt(fd, 'obs')];
  if (id) {
    await q(`UPDATE projetos SET cliente_id=$2, nome=$3, tipo=$4, area=$5, endereco_obra=$6, status=$7, cor=$8, valor=$9, inicio=$10, previsao=$11, pasta_drive=$12, obs=$13 WHERE id=$1`, [id, ...vals]);
    refresh(id);
    if (vals[0]) revalidatePath(`/clientes/${vals[0]}`);
    return;
  }
  const row = await one(`INSERT INTO projetos (cliente_id, nome, tipo, area, endereco_obra, status, cor, valor, inicio, previsao, pasta_drive, obs)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`, vals);
  if (fd.get('etapas_padrao') === '1') {
    await inserirEtapas(row.id, ETAPAS_PADRAO.map(([n]) => ({ nome: n })));
  }
  refresh(row.id);
  redirect(`/projetos/${row.id}`);
}

async function inserirEtapas(projetoId, etapas) {
  if (!etapas.length) return;
  const params = [];
  const values = etapas.map((e, i) => {
    params.push(projetoId, i, e.nome, e.inicio || null, e.prazo || null, e.status || 'pendente');
    const b = i * 6;
    return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6})`;
  });
  await q(`INSERT INTO etapas (projeto_id, ordem, nome, inicio, prazo, status) VALUES ${values.join(',')}`, params);
}

/** Salva a lista inteira de etapas do projeto (vinda do editor). */
export async function salvarEtapas(projetoId, etapas) {
  await exigir('projetos');
  const limpas = (Array.isArray(etapas) ? etapas : [])
    .map((e) => ({ nome: String(e.nome || '').trim(), inicio: e.inicio || null, prazo: e.prazo || null, status: STATUS_ETAPA[e.status] ? e.status : 'pendente' }))
    .filter((e) => e.nome);
  await q('DELETE FROM etapas WHERE projeto_id = $1', [projetoId]);
  await inserirEtapas(projetoId, limpas);
  refresh(projetoId);
}

export async function mudarStatusEtapa(etapaId, status) {
  await exigir('projetos');
  if (!STATUS_ETAPA[status]) return;
  const e = await one('UPDATE etapas SET status = $2 WHERE id = $1 RETURNING projeto_id', [etapaId, status]);
  refresh(e?.projeto_id);
}

export async function excluirProjeto(id) {
  await exigir('projetos');
  await q('DELETE FROM projetos WHERE id = $1', [id]);
  refresh();
  redirect('/projetos');
}

export async function salvarContrato(fd) {
  await exigir('projetos');
  const id = int(fd, 'id');
  const projetoId = int(fd, 'projeto_id');
  const status = STATUS_CONTRATO[txt(fd, 'status')] ? txt(fd, 'status') : 'rascunho';
  let assinado = txt(fd, 'assinado_em');
  if (status === 'assinado' && !assinado) assinado = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const p = await one('SELECT cliente_id FROM projetos WHERE id = $1', [projetoId]);
  const vals = [projetoId, p?.cliente_id || null, txt(fd, 'descricao'), num(fd, 'valor'), status, txt(fd, 'enviado_em'), assinado, txt(fd, 'link'), txt(fd, 'obs')];
  if (id) await q('UPDATE contratos SET projeto_id=$2, cliente_id=$3, descricao=$4, valor=$5, status=$6, enviado_em=$7, assinado_em=$8, link=$9, obs=$10 WHERE id=$1', [id, ...vals]);
  else await q('INSERT INTO contratos (projeto_id, cliente_id, descricao, valor, status, enviado_em, assinado_em, link, obs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', vals);
  refresh(projetoId);
}

export async function excluirContrato(id, projetoId) {
  await exigir('projetos');
  await q('DELETE FROM contratos WHERE id = $1', [id]);
  refresh(projetoId);
}

/** Gera cobranças parceladas para o projeto. */
export async function gerarParcelas(fd) {
  await exigir('financeiro');
  const projetoId = int(fd, 'projeto_id');
  const total = num(fd, 'total');
  const n = Math.max(1, Math.min(48, int(fd, 'parcelas') || 1));
  const primeira = txt(fd, 'primeira');
  const entrada = num(fd, 'entrada') || 0;
  if (!total || total <= 0) return { erro: 'Informe o valor total.' };
  if (!primeira) return { erro: 'Informe a data da primeira parcela.' };
  if (entrada >= total) return { erro: 'A entrada precisa ser menor que o total.' };
  const p = await one('SELECT cliente_id, nome FROM projetos WHERE id = $1', [projetoId]);
  const restante = Math.round((total - entrada) * 100);
  const base = Math.floor(restante / n);
  const sobra = restante - base * n;
  const linhas = [];
  let [y, m, d] = primeira.split('-').map(Number);
  if (entrada > 0) linhas.push({ desc: `Entrada — ${p.nome}`, valor: entrada, venc: primeira });
  for (let i = 0; i < n; i++) {
    let mm = m + i + (entrada > 0 ? 1 : 0), yy = y;
    while (mm > 12) { mm -= 12; yy++; }
    const ult = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
    const venc = `${yy}-${String(mm).padStart(2, '0')}-${String(Math.min(d, ult)).padStart(2, '0')}`;
    const cent = base + (i === n - 1 ? sobra : 0);
    linhas.push({ desc: `Parcela ${i + 1}/${n} — ${p.nome}`, valor: cent / 100, venc });
  }
  for (const l of linhas) {
    await q('INSERT INTO receitas (cliente_id, projeto_id, descricao, valor, vencimento, forma) VALUES ($1,$2,$3,$4,$5,$6)',
      [p.cliente_id, projetoId, l.desc, l.valor, l.venc, txt(fd, 'forma')]);
  }
  refresh(projetoId);
  revalidatePath('/financeiro');
}
