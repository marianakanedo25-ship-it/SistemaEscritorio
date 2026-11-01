'use server';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { one, q } from '@/lib/db';
import { iniciarSessao, encerrarSessao } from '@/lib/auth';

export async function entrar(_prev, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const senha = String(formData.get('senha') || '');
  if (!email || !senha) return { erro: 'Preencha e-mail e senha.' };
  const u = await one('SELECT id, senha_hash, ativo FROM usuarios WHERE lower(email) = $1', [email]);
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) return { erro: 'E-mail ou senha incorretos.' };
  if (!u.ativo) return { erro: 'Este acesso está desativado. Fale com a administradora.' };
  await iniciarSessao(u);
  redirect('/');
}

export async function criarPrimeiraConta(_prev, formData) {
  const total = await one('SELECT count(*)::int AS n FROM usuarios');
  if (total.n > 0) redirect('/login');
  const nome = String(formData.get('nome') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const senha = String(formData.get('senha') || '');
  const permitido = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!nome || !email) return { erro: 'Preencha nome e e-mail.' };
  if (permitido && email !== permitido) return { erro: 'Use o e-mail cadastrado como administradora na Vercel (ADMIN_EMAIL).' };
  if (senha.length < 8) return { erro: 'A senha precisa ter pelo menos 8 caracteres.' };
  const hash = await bcrypt.hash(senha, 10);
  const rows = await q(
    `INSERT INTO usuarios (nome, email, senha_hash, cargo, papel) VALUES ($1, $2, $3, 'Arquiteta responsável', 'admin') RETURNING id`,
    [nome, email, hash]
  );
  await iniciarSessao(rows[0]);
  redirect('/dashboard');
}

export async function sair() {
  await encerrarSessao();
  redirect('/login');
}
