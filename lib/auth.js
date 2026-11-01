import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { one } from './db';
import { COOKIE, DURACAO_DIAS, assinar, verificar } from './session';

export const ABAS = [
  { id: 'agenda', nome: 'Agenda', href: '/agenda' },
  { id: 'precificacao', nome: 'Calculadora de precificação', href: '/precificacao' },
  { id: 'clientes', nome: 'Clientes', href: '/clientes' },
  { id: 'dashboard', nome: 'Dashboard', href: '/dashboard' },
  { id: 'financeiro', nome: 'Financeiro', href: '/financeiro' },
  { id: 'projetos', nome: 'Projetos', href: '/projetos' },
  { id: 'usuarios', nome: 'Usuários', href: '/usuarios' },
];

/** Aba que abre ao entrar: o Dashboard, se a pessoa tiver acesso; senão a primeira liberada. */
export function abaInicial(usuario) {
  const abas = abasDo(usuario);
  return abas.find((a) => a.id === 'dashboard') || abas[0] || null;
}

export function podeVer(usuario, aba) {
  if (!usuario) return false;
  if (usuario.papel === 'admin') return true;
  return (usuario.abas || []).includes(aba);
}

export function abasDo(usuario) {
  return ABAS.filter((a) => podeVer(usuario, a.id));
}

export async function iniciarSessao(usuario) {
  const token = await assinar({ uid: usuario.id });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACAO_DIAS * 24 * 60 * 60,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Usuário logado (ou null). Lido uma vez por requisição. */
export const usuarioAtual = cache(async () => {
  const jar = await cookies();
  const payload = await verificar(jar.get(COOKIE)?.value);
  if (!payload?.uid) return null;
  const u = await one(
    'SELECT id, nome, email, cargo, papel, abas, ativo FROM usuarios WHERE id = $1',
    [payload.uid]
  );
  if (!u || !u.ativo) return null;
  return u;
});

/** Exige login (e acesso à aba, se informada). Redireciona se não tiver. */
export async function exigir(aba) {
  const u = await usuarioAtual();
  if (!u) redirect('/login');
  if (aba && !podeVer(u, aba)) {
    const primeira = abaInicial(u);
    redirect(primeira ? primeira.href + '?sem-acesso=1' : '/conta');
  }
  return u;
}
