'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PessoalTabs() {
  const path = usePathname();
  const m = useSearchParams().get('m');
  const q = m ? `?m=${m}` : '';
  return (
    <nav className="tabs no-print">
      <Link href={`/pessoal${q}`} className={path === '/pessoal' ? 'on' : ''}>Mês a mês</Link>
      <Link href={`/pessoal/ano${q}`} className={path === '/pessoal/ano' ? 'on' : ''}>Visão do ano</Link>
    </nav>
  );
}
