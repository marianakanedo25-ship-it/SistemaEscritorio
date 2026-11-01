'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { q } from '@/lib/db';
import { exigir } from '@/lib/auth';

const CAMPOS = ['nome', 'telefone', 'email', 'documento', 'nascimento', 'endereco', 'cidade', 'origem', 'profissao', 'pasta_drive', 'obs'];
const txt = (fd, k) => { const v = String(fd.get(k) ?? '').trim(); return v || null; };

export async function salvarCliente(fd) {
  await exigir('clientes');
  const id = Number(fd.get('id')) || null;
  const vals = CAMPOS.map((k) => txt(fd, k));
  if (!vals[0]) return { erro: 'Informe o nome do cliente.' };
  if (id) {
    // Só atualiza os campos enviados no formulário (o cadastro rápido manda menos campos).
    const enviados = CAMPOS.filter((k) => fd.has(k));
    const sets = enviados.map((k, i) => `${k} = $${i + 2}`).join(', ');
    await q(`UPDATE clientes SET ${sets} WHERE id = $1`, [id, ...enviados.map((k) => txt(fd, k))]);
  } else {
    const rows = await q(
      `INSERT INTO clientes (${CAMPOS.join(', ')}) VALUES (${CAMPOS.map((_, i) => '$' + (i + 1)).join(', ')}) RETURNING id`,
      vals
    );
    if (fd.get('abrir') === '1') redirect(`/clientes/${rows[0].id}`);
  }
  revalidatePath('/clientes');
  if (id) revalidatePath(`/clientes/${id}`);
}

export async function excluirCliente(id) {
  await exigir('clientes');
  await q('DELETE FROM clientes WHERE id = $1', [id]);
  revalidatePath('/clientes');
  redirect('/clientes');
}
