'use client';
import { useState, useTransition } from 'react';
import { STATUS_ETAPA, prazoInfo } from '@/lib/format';

export default function EtapasEditor({ projetoId, inicial, salvar }) {
  const [rows, setRows] = useState(inicial);
  const [sujo, setSujo] = useState(false);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const upd = (i, k, v) => { setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x))); setSujo(true); };
  const mover = (i, d) => { setRows((r) => { const n = [...r]; const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n; }); setSujo(true); };
  const ok = rows.filter((r) => r.status === 'concluida').length;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <span className="small">{ok} de {rows.length} concluídas</span>
        <span className="small">Etapa · início · prazo · situação</span>
      </div>
      <div>
        {rows.map((e, i) => {
          const pz = prazoInfo(e.prazo, e.status === 'concluida');
          return (
            <div className={'etapa-row' + (e.status === 'concluida' ? ' done' : '')} key={e.key}>
              <span className="ix">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <input type="text" aria-label="Nome da etapa" value={e.nome} onChange={(ev) => upd(i, 'nome', ev.target.value)} />
                <span className={'prazo-txt ' + pz.tom}>{e.prazo ? pz.texto : 'Sem prazo definido'}</span>
              </div>
              <input type="date" aria-label="Início" value={e.inicio || ''} onChange={(ev) => upd(i, 'inicio', ev.target.value)} />
              <input type="date" aria-label="Prazo" value={e.prazo || ''} onChange={(ev) => upd(i, 'prazo', ev.target.value)} />
              <select aria-label="Situação" value={e.status} onChange={(ev) => upd(i, 'status', ev.target.value)}>
                {Object.entries(STATUS_ETAPA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button type="button" className="btn ghost sm" style={{ padding: '0 6px' }} onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
                <button type="button" className="btn ghost sm" style={{ padding: '0 6px' }} onClick={() => { setRows((r) => r.filter((_, j) => j !== i)); setSujo(true); }} aria-label="Remover etapa">✕</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="form-foot" style={{ marginTop: 12 }}>
        <button type="button" className="btn sm" onClick={() => { setRows((r) => [...r, { key: 'n' + Date.now(), nome: 'Nova etapa', inicio: '', prazo: '', status: 'pendente' }]); setSujo(true); }}>Adicionar etapa</button>
        <div className="r" style={{ alignItems: 'center' }}>
          <span className="small" role="status">{msg || (sujo ? 'Alterações não salvas' : '')}</span>
          <button type="button" className="btn primary" disabled={pending || !sujo} onClick={() => start(async () => {
            await salvar(projetoId, rows.map(({ nome, inicio, prazo, status }) => ({ nome, inicio, prazo, status })));
            setSujo(false); setMsg('Etapas salvas.'); setTimeout(() => setMsg(''), 2500);
          })}>{pending ? 'Salvando…' : 'Salvar etapas'}</button>
        </div>
      </div>
    </div>
  );
}
