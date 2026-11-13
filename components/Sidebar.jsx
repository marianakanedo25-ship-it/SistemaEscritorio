'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CHAVE_VALORES, RE_VALOR } from '@/lib/ocultar-valores';

export default function Sidebar({ usuario, abas, sair }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  // Mostrar / ocultar valores em R$ (padrão: ocultos)
  const [ocultos, setOcultos] = useState(true);
  useEffect(() => {
    let mostrar = false;
    try { mostrar = localStorage.getItem(CHAVE_VALORES) === 'mostrar'; } catch {}
    setOcultos(!mostrar);
    // Marca os valores que aparecem depois (navegação, digitação, recálculos)
    const marcar = (raiz) => {
      const w = document.createTreeWalker(raiz || document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) if (RE_VALOR.test(n.nodeValue) && n.parentElement) n.parentElement.classList.add('vlr');
    };
    marcar();
    let agendado = false;
    const obs = new MutationObserver(() => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => { agendado = false; marcar(); });
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('ocultar-valores', ocultos); }, [ocultos]);
  const alternarValores = () => {
    const novo = !ocultos;
    setOcultos(novo);
    try { localStorage.setItem(CHAVE_VALORES, novo ? 'ocultar' : 'mostrar'); } catch {}
  };
  const olho = (
    <button type="button" className="olho" onClick={alternarValores} aria-pressed={!ocultos} title={ocultos ? 'Mostrar valores' : 'Ocultar valores'}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
        {ocultos && <path d="M4 4l16 16" />}
      </svg>
      <span>{ocultos ? 'Mostrar valores' : 'Ocultar valores'}</span>
    </button>
  );
  return (
    <>
      <div className="topbar">
        <img src="/logo-branco.png" alt="Mariana Canedo" />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {olho}
          <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu">Menu</button>
        </div>
      </div>
      <aside className={'side' + (open ? ' open' : '')} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="brand"><img src="/logo-branco.png" alt="Mariana Canedo Arquitetura e Interiores" /></div>
        <div className="who">
          <strong>{usuario.nome}</strong>
          <span>{usuario.papel === 'admin' ? 'Administradora' : (usuario.cargo || 'Equipe')}</span>
          {olho}
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
