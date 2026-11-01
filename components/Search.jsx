'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Search({ placeholder }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [v, setV] = useState(params.get('q') || '');
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(params.toString());
      if (v) p.set('q', v); else p.delete('q');
      const s = p.toString();
      if (s !== params.toString()) router.replace(path + (s ? '?' + s : ''));
    }, 300);
    return () => clearTimeout(t);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  return <input className="search" type="search" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} aria-label="Buscar" />;
}
