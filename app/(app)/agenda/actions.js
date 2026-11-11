'use server';
import { revalidatePath } from 'next/cache';
import { q, one } from '@/lib/db';
import { exigir } from '@/lib/auth';

const txt = (fd, k) => { const v = String(fd.get(k) ?? '').trim(); return v || null; };

export async function salvarEvento(fd) {
  await exigir('agenda');
  const id = Number(fd.get('id')) || null;
  const titulo = txt(fd, 'titulo');
  const data = txt(fd, 'data');
  if (!titulo || !data) return { erro: 'Informe título e data.' };
  const projetoId = Number(fd.get('projeto_id')) || null;
  let clienteId = Number(fd.get('cliente_id')) || null;
  if (projetoId && !clienteId) clienteId = (await one('SELECT cliente_id FROM projetos WHERE id = $1', [projetoId]))?.cliente_id || null;
  const hora = txt(fd, 'hora');
  const horaFim = txt(fd, 'hora_fim');
  if (horaFim && !hora) return { erro: 'Informe também o horário de início.' };
  if (hora && horaFim && horaFim <= hora) return { erro: 'O horário final precisa ser depois do inicial.' };
  const etapaId = Number(fd.get('etapa_id')) || null;
  const vals = [titulo, data, hora, txt(fd, 'tipo') || 'compromisso', projetoId, clienteId, txt(fd, 'local'), txt(fd, 'obs'), horaFim, etapaId];
  if (id) await q('UPDATE eventos SET titulo=$2, data=$3, hora=$4, tipo=$5, projeto_id=$6, cliente_id=$7, local=$8, obs=$9, hora_fim=$10, etapa_id=$11 WHERE id=$1', [id, ...vals]);
  else await q('INSERT INTO eventos (titulo, data, hora, tipo, projeto_id, cliente_id, local, obs, hora_fim, etapa_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', vals);
  revalidatePath('/agenda');
  revalidatePath('/dashboard');
  if (projetoId) revalidatePath(`/projetos/${projetoId}`);
}

export async function excluirEvento(id) {
  await exigir('agenda');
  const r = await one('DELETE FROM eventos WHERE id = $1 RETURNING projeto_id', [id]);
  revalidatePath('/agenda');
  if (r?.projeto_id) revalidatePath(`/projetos/${r.projeto_id}`);
}
