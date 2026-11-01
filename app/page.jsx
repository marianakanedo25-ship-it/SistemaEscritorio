import { redirect } from 'next/navigation';
import { usuarioAtual, abaInicial } from '@/lib/auth';

export default async function Home() {
  const u = await usuarioAtual();
  if (!u) redirect('/login');
  const primeira = abaInicial(u);
  redirect(primeira ? primeira.href : '/conta');
}
