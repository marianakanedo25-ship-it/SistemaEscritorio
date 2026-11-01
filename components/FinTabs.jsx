'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const TABS = [
  ['/financeiro', 'Resumo'], ['/financeiro/receitas', 'Receitas'], ['/financeiro/notas-fiscais', 'Notas fiscais'],
  ['/financeiro/despesas', 'Despesas'], ['/financeiro/compras', 'Compras'], ['/financeiro/repasses', 'Repasse'],
  ['/financeiro/precos', 'Preços e recibo'],
];

export default function FinTabs() {
  const path = usePathname();
  const m = useSearchParams().get('m');
  if (path.startsWith('/financeiro/recibo')) return null;
  return (
    <nav className="tabs no-print">
      {TABS.map(([href, nome]) => (
        <Link key={href} href={href + (m ? `?m=${m}` : '')} className={path === href ? 'on' : ''}>{nome}</Link>
      ))}
    </nav>
  );
}
