import { redirect } from 'next/navigation';
import { usuarioAtual, abasDo } from '@/lib/auth';

export default async function Home() {
  const u = await usuarioAtual();
  if (!u) redirect('/login');
  const primeira = abasDo(u)[0];
  redirect(primeira ? primeira.href : '/conta');
}
