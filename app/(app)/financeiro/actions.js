'use server';
import { revalidatePath } from 'next/cache';
import { q, one, setConfig } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { hoje } from '@/lib/format';

const txt = (fd, k) => { const v = String(fd.get(k) ?? '').trim(); return v || null; };
const num = (fd, k) => { const v = String(fd.get(k) ?? '').trim().replace(',', '.'); return v === '' ? null : Number(v); };
const int = (fd, k) => Number(fd.get(k)) || null;

function refresh(projetoId) {
  revalidatePath('/financeiro', 'layout');
  revalidatePath('/dashboard');
  revalidatePath('/agenda');
  if (projetoId) revalidatePath(`/projetos/${projetoId}`);
}

// Definição de cada tipo de lançamento: tabela e campos editáveis.
const TIPOS = {
  receitas: { campos: ['cliente_id', 'projeto_id', 'descricao', 'valor', 'vencimento', 'pago_em', 'forma', 'obs'], obrig: ['descricao', 'valor', 'vencimento'] },
  despesas: { campos: ['descricao', 'categoria', 'fornecedor', 'projeto_id', 'valor', 'vencimento', 'pago_em', 'forma', 'obs'], obrig: ['descricao', 'valor', 'vencimento'] },
  notas_fiscais: { campos: ['numero', 'cliente_id', 'projeto_id', 'receita_id', 'valor', 'emissao', 'status', 'link', 'obs'], obrig: ['valor', 'emissao'] },
  compras: { campos: ['fornecedor', 'descricao', 'projeto_id', 'valor', 'data', 'status', 'pago_em', 'obs'], obrig: ['descricao', 'valor', 'data'] },
  repasses: { campos: ['parceiro', 'descricao', 'projeto_id', 'valor', 'vencimento', 'pago_em', 'forma', 'obs'], obrig: ['parceiro', 'valor', 'vencimento'] },
  servicos: { campos: ['nome', 'descricao', 'unidade', 'valor'], obrig: ['nome'] },
};
const NUM = new Set(['valor']);
const INT = new Set(['cliente_id', 'projeto_id', 'receita_id']);
const NOMES = { descricao: 'a descrição', valor: 'o valor', vencimento: 'a data de vencimento', emissao: 'a data de emissão', data: 'a data', parceiro: 'o parceiro', nome: 'o nome' };

function ler(fd, campos) {
  return campos.map((k) => (NUM.has(k) ? num(fd, k) : INT.has(k) ? int(fd, k) : txt(fd, k)));
}

export async function salvarLancamento(tipo, fd) {
  await exigir('financeiro');
  const t = TIPOS[tipo];
  if (!t) return { erro: 'Tipo inválido.' };
  const id = int(fd, 'id');
  const vals = ler(fd, t.campos);
  for (const k of t.obrig) {
    const v = vals[t.campos.indexOf(k)];
    if (v === null || v === '' || (NUM.has(k) && !(v >= 0))) return { erro: `Informe ${NOMES[k] || k}.` };
  }
  const PADRAO = { status: tipo === 'compras' ? 'orcado' : 'emitida', valor: 0, unidade: 'm²' };
  t.campos.forEach((k, i) => { if ((vals[i] === null || Number.isNaN(vals[i])) && k in PADRAO) vals[i] = PADRAO[k]; });
  if (fd.get('pago') === '1' && t.campos.includes('pago_em') && !vals[t.campos.indexOf('pago_em')]) {
    vals[t.campos.indexOf('pago_em')] = hoje();
  }
  const tabela = tipo;
  if (id) {
    const sets = t.campos.map((k, i) => `${k} = $${i + 2}`).join(', ');
    await q(`UPDATE ${tabela} SET ${sets} WHERE id = $1`, [id, ...vals]);
  } else {
    const repetir = tipo === 'despesas' ? Math.max(1, Math.min(36, int(fd, 'repetir') || 1)) : 1;
    const iv = t.campos.indexOf('vencimento');
    for (let i = 0; i < repetir; i++) {
      const v = [...vals];
      if (i > 0 && iv >= 0) {
        let [y, m, d] = vals[iv].split('-').map(Number);
        m += i; while (m > 12) { m -= 12; y++; }
        const ult = new Date(Date.UTC(y, m, 0)).getUTCDate();
        v[iv] = `${y}-${String(m).padStart(2, '0')}-${String(Math.min(d, ult)).padStart(2, '0')}`;
        const ip = t.campos.indexOf('pago_em'); if (ip >= 0) v[ip] = null;
      }
      await q(`INSERT INTO ${tabela} (${t.campos.join(', ')}) VALUES (${t.campos.map((_, j) => '$' + (j + 1)).join(', ')})`, v);
    }
  }
  const ip = t.campos.indexOf('projeto_id');
  refresh(ip >= 0 ? vals[ip] : null);
}

export async function excluirLancamento(tipo, id) {
  await exigir('financeiro');
  if (!TIPOS[tipo]) return;
  const row = await one(`DELETE FROM ${tipo} WHERE id = $1 RETURNING *`, [id]);
  refresh(row?.projeto_id);
}

/** Marca como pago/recebido (ou desfaz). */
export async function alternarPago(tipo, id, forma) {
  await exigir('financeiro');
  if (!['receitas', 'despesas', 'repasses', 'compras'].includes(tipo)) return;
  const row = await one(`SELECT pago_em, projeto_id FROM ${tipo} WHERE id = $1`, [id]);
  if (!row) return;
  if (row.pago_em) await q(`UPDATE ${tipo} SET pago_em = NULL WHERE id = $1`, [id]);
  else if (forma && tipo !== 'compras') await q(`UPDATE ${tipo} SET pago_em = $2, forma = coalesce($3, forma) WHERE id = $1`, [id, hoje(), forma]);
  else await q(`UPDATE ${tipo} SET pago_em = $2 WHERE id = $1`, [id, hoje()]);
  refresh(row.projeto_id);
}

export async function salvarEscritorio(fd) {
  await exigir('financeiro');
  const campos = ['nome', 'documento', 'cau', 'endereco', 'cidade', 'telefone', 'email', 'pix'];
  const v = Object.fromEntries(campos.map((k) => [k, txt(fd, k) || '']));
  await setConfig('escritorio', v);
  revalidatePath('/financeiro', 'layout');
}
