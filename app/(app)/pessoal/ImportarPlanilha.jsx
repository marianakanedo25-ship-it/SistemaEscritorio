'use client';
import { useState, useTransition } from 'react';

/** Envia o .xlsx da 000_PLANILHA para o sistema. */
export default function ImportarPlanilha({ action, classe = 'btn', texto = 'Importar planilha' }) {
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  function enviar(e) {
    const arq = e.target.files?.[0];
    if (!arq) return;
    const fd = new FormData();
    fd.set('arquivo', arq);
    start(async () => {
      const r = await action(fd);
      if (r?.erro) setMsg(r.erro);
      else { setMsg(`${r.linhas} lançamentos importados (${r.meses.length} ${r.meses.length === 1 ? 'mês' : 'meses'}).`); setTimeout(() => window.location.reload(), 900); }
    });
    e.target.value = '';
  }
  return (
    <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <label className={classe} style={{ cursor: 'pointer' }}>
        {pending ? 'Importando…' : texto}
        <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={enviar} disabled={pending} style={{ display: 'none' }} />
      </label>
      {msg && <span className="small" role="status">{msg}</span>}
    </span>
  );
}
