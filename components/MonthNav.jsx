import Link from 'next/link';
import { addMes, nomeMes } from '@/lib/format';

export default function MonthNav({ ym, base, extra = '' }) {
  const href = (m) => `${base}?m=${m}${extra}`;
  return (
    <div className="monthnav">
      <a href={href(addMes(ym, -1))} aria-label="Mês anterior">‹</a>
      <strong>{nomeMes(ym)}</strong>
      <a href={href(addMes(ym, 1))} aria-label="Próximo mês">›</a>
    </div>
  );
}
