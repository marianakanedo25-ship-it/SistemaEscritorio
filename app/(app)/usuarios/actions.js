'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { q, one } from '@/lib/db';
import { exigir, ABAS } from '@/lib/auth';

const txt = (fd, k) => { const v = String(fd.get(k) ?? '').trim(); return v || null; };
const VALIDAS = new Set(ABAS.map((a) => a.id));

export async function salvarUsuario(fd) {
  const eu = await exigir('usuarios');
  const id = Number(fd.get('id')) || null;
  const nome = txt(fd, 'nome');
  const email = (txt(fd, 'email') || '').toLowerCase();
  const senha = String(fd.get('senha') || '');
  let papel = fd.get('papel') === 'admin' ? 'admin' : 'membro';
  const abas = fd.getAll('abas').map(String).filter((a) => VALIDAS.has(a));
  const ativo = fd.get('ativo') !== '0';
  if (!nome || !email) return { erro: 'Informe nome e e-mail.' };
  if (!id && senha.length < 8) return { erro: 'Defina uma senha inicial com pelo menos 8 caracteres.' };
  if (senha && senha.length < 8) return { erro: 'A senha precisa ter pelo menos 8 caracteres.' };
  const dup = await one('SELECT id FROM usuarios WHERE lower(email) = $1 AND id <> $2', [email, id || 0]);
  if (dup) return { erro: 'Já existe um usuário com este e-mail.' };
  if (id === eu.id && (papel !== 'admin' || !ativo) && eu.papel === 'admin') {
    const outros = await one(`SELECT count(*)::int AS n FROM usuarios WHERE papel = 'admin' AND ativo AND id <> $1`, [eu.id]);
    if (!outros.n) return { erro: 'Você é a única administradora. Não é possível remover o seu próprio acesso total.' };
  }
  if (id) {
    await q('UPDATE usuarios SET nome=$2, email=$3, cargo=$4, papel=$5, abas=$6, ativo=$7 WHERE id=$1', [id, nome, email, txt(fd, 'cargo'), papel, abas, ativo]);
    if (senha) await q('UPDATE usuarios SET senha_hash=$2 WHERE id=$1', [id, await bcrypt.hash(senha, 10)]);
  } else {
    await q('INSERT INTO usuarios (nome, email, cargo, papel, abas, ativo, senha_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [nome, email, txt(fd, 'cargo'), papel, abas, ativo, await bcrypt.hash(senha, 10)]);
  }
  revalidatePath('/usuarios');
}

export async function excluirUsuario(id) {
  const eu = await exigir('usuarios');
  if (id === eu.id) return;
  await q('DELETE FROM usuarios WHERE id = $1', [id]);
  revalidatePath('/usuarios');
}

export async function trocarMinhaSenha(fd) {
  const eu = await exigir();
  const atual = String(fd.get('atual') || '');
  const nova = String(fd.get('nova') || '');
  const conf = String(fd.get('confirmar') || '');
  const row = await one('SELECT senha_hash FROM usuarios WHERE id = $1', [eu.id]);
  if (!(await bcrypt.compare(atual, row.senha_hash))) return { erro: 'A senha atual está incorreta.' };
  if (nova.length < 8) return { erro: 'A nova senha precisa ter pelo menos 8 caracteres.' };
  if (nova !== conf) return { erro: 'A confirmação não confere com a nova senha.' };
  await q('UPDATE usuarios SET senha_hash = $2 WHERE id = $1', [eu.id, await bcrypt.hash(nova, 10)]);
}

export async function salvarMeuNome(fd) {
  const eu = await exigir();
  const nome = txt(fd, 'nome');
  if (!nome) return { erro: 'Informe o seu nome.' };
  await q('UPDATE usuarios SET nome = $2, cargo = $3 WHERE id = $1', [eu.id, nome, txt(fd, 'cargo')]);
  revalidatePath('/', 'layout');
}
