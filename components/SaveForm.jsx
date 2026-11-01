'use client';
import { useState, useTransition } from 'react';

/** Formulário de edição que salva no lugar e mostra confirmação. */
export default function SaveForm({ action, children, rotulo = 'Salvar alterações' }) {
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await action(fd);
        setMsg(r?.erro ? r.erro : 'Alterações salvas.');
        setTimeout(() => setMsg(''), 3000);
      });
    }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {children}
      <div className="form-foot">
        <span className="small" role="status">{msg}</span>
        <div className="r"><button className="btn primary" disabled={pending}>{pending ? 'Salvando…' : rotulo}</button></div>
      </div>
    </form>
  );
}
