'use server';
import { revalidatePath } from 'next/cache';
import { q } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { TIPOS, linhasDoProximoMes, interpretarPlanilha } from '@/lib/pessoal';
import { lerXlsx, dataExcel } from '@/lib/xlsx-lite';

const TIPOS_OK = new Set([...TIPOS.map((t) => t.id), 'extra']);
const mesOk = (m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(m || ''));
const dataOk = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? d : null);

async function gravarLinhas(mes, linhas) {
  await q('DELETE FROM pf_lancamentos WHERE mes = $1', [mes]);
  const validas = linhas.filter((l) => TIPOS_OK.has(l.tipo) && (String(l.descricao || '').trim() || Number(l.valor)));
  if (!validas.length) return;
  const vals = [];
  const ph = validas.map((l, i) => {
    vals.push(mes, l.tipo, String(l.descricao || '').trim().slice(0, 200), Math.round((Number(String(l.valor).replace(',', '.')) || 0) * 100) / 100,
      !!l.feito, String(l.parcela || '').trim() || null, dataOk(l.data), String(l.obs || '').trim() || null, i, l.feito ? dataOk(l.pago_em) : null);
    const b = i * 10;
    return `(${Array.from({ length: 10 }, (_, k) => `$${b + k + 1}`).join(',')})`;
  });
  await q(`INSERT INTO pf_lancamentos (mes, tipo, descricao, valor, feito, parcela, data, obs, ordem, pago_em) VALUES ${ph.join(',')}`, vals);
}

async function gravarSaldo(mes, saldo) {
  const v = saldo === '' || saldo == null ? null : Number(String(saldo).replace(',', '.'));
  await q(`INSERT INTO pf_meses (mes, saldo_inicial) VALUES ($1, $2) ON CONFLICT (mes) DO UPDATE SET saldo_inicial = EXCLUDED.saldo_inicial`,
    [mes, Number.isFinite(v) ? v : null]);
}

/** Salva o mês inteiro (as linhas da tela substituem as do banco). */
export async function salvarMesPessoal(mes, dados) {
  await exigir('pessoal');
  if (!mesOk(mes)) return { erro: 'Mês inválido.' };
  await gravarLinhas(mes, Array.isArray(dados?.linhas) ? dados.linhas : []);
  if (dados && 'saldoManual' in dados) await gravarSaldo(mes, dados.saldoManual);
  // Sem revalidatePath: a tela já está com os dados e o salvamento é automático enquanto você digita.
  return { ok: true };
}

/** Começa o mês com as contas fixas e as próximas parcelas do último mês preenchido. */
export async function comecarMesPessoal(mes) {
  await exigir('pessoal');
  if (!mesOk(mes)) return { erro: 'Mês inválido.' };
  const ja = await q('SELECT 1 FROM pf_lancamentos WHERE mes = $1 LIMIT 1', [mes]);
  if (ja.length) return { erro: 'Este mês já tem lançamentos.' };
  const ant = await q('SELECT max(mes) AS m FROM pf_lancamentos WHERE mes < $1', [mes]);
  if (!ant[0]?.m) return { erro: 'Nenhum mês anterior preenchido.' };
  const linhas = await q('SELECT * FROM pf_lancamentos WHERE mes = $1 ORDER BY ordem, id', [ant[0].m]);
  await gravarLinhas(mes, linhasDoProximoMes(linhas));
  revalidatePath('/pessoal');
  return { ok: true, de: ant[0].m };
}

/** Importa a 000_PLANILHA (.xlsx). Os meses que vierem com lançamentos substituem os do sistema. */
export async function importarPlanilhaPessoal(fd) {
  await exigir('pessoal');
  const arq = fd.get('arquivo');
  if (!arq || typeof arq === 'string' || !arq.size) return { erro: 'Escolha o arquivo .xlsx da planilha.' };
  if (arq.size > 5 * 1024 * 1024) return { erro: 'Arquivo muito grande (máx. 5 MB).' };
  let meses;
  try {
    meses = interpretarPlanilha(lerXlsx(Buffer.from(await arq.arrayBuffer())), dataExcel);
  } catch {
    return { erro: 'Não consegui ler este arquivo. Ele precisa ser .xlsx (no Google Sheets: Arquivo → Fazer download → Microsoft Excel).' };
  }
  if (!meses.length) return { erro: 'Não encontrei abas de mês (ex.: "Novembro 2026") com lançamentos.' };
  for (const m of meses) {
    await gravarLinhas(m.mes, m.linhas);
    await gravarSaldo(m.mes, m.saldoManual);
  }
  revalidatePath('/pessoal');
  return { ok: true, meses: meses.map((m) => m.mes), linhas: meses.reduce((s, m) => s + m.linhas.length, 0) };
}
