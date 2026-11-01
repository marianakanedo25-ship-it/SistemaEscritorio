'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar({ usuario, abas, sair }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <div className="topbar">
        <img src="/logo-branco.png" alt="Mariana Canedo" />
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu">Menu</button>
      </div>
      <aside className={'side' + (open ? ' open' : '')} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="brand"><img src="/logo-branco.png" alt="Mariana Canedo Arquitetura e Interiores" /></div>
        <div className="who">
          <strong>{usuario.nome}</strong>
          <span>{usuario.papel === 'admin' ? 'Administradora' : (usuario.cargo || 'Equipe')}</span>
        </div>
        <nav>
          {abas.map((a) => (
            <Link key={a.id} href={a.href} className={path === a.href || path.startsWith(a.href + '/') ? 'on' : ''}>{a.nome}</Link>
          ))}
        </nav>
        <div className="bottom">
          <Link href="/conta">Minha conta</Link>
          <form action={sair}><button type="submit">Sair</button></form>
        </div>
      </aside>
    </>
  );
}
