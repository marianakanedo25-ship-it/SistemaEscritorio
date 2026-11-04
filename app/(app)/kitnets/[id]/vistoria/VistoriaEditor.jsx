'use client';
import { useState, useTransition } from 'react';
import { ITENS_CONDICAO, DECLARACAO, objetivo } from '@/lib/vistoria-kitnet';
import { dataLonga } from '@/lib/contrato-kitnet';

const BR = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(String(iso || '')) ? iso.split('-').reverse().join('/') : '___/___/______');
const linhas = (t) => String(t || '').split('\n').filter((l) => l.trim());

export default function VistoriaEditor({ id, grupo, kitnet, partes, inicial, padraoAmbientes, salvar }) {
  const [v, setV] = useState(inicial);
  const [sujo, setSujo] = useState(false);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const set = (patch) => { setV((x) => ({ ...x, ...patch })); setSujo(true); };
  const setCond = (item, col, val) => { setV((x) => ({ ...x, condicoes: { ...x.condicoes, [item]: { ...(x.condicoes[item] || {}), [col]: x.condicoes[item]?.[col] === val ? '' : val } } })); setSujo(true); };
  const setAmb = (i, patch) => { setV((x) => ({ ...x, ambientes: x.ambientes.map((a, j) => (j === i ? { ...a, ...patch } : a)) })); setSujo(true); };
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };
  const itens = Array.isArray(v.itens) && v.itens.length ? v.itens : ITENS_CONDICAO;
  const setItens = (fn) => { setV((x) => ({ ...x, itens: fn(Array.isArray(x.itens) && x.itens.length ? x.itens : ITENS_CONDICAO) })); setSujo(true); };
  const renomear = (i, nome) => {
    setV((x) => {
      const lista = (Array.isArray(x.itens) && x.itens.length ? x.itens : ITENS_CONDICAO).map((it, j) => (j === i ? { ...it, nome } : it));
      const antigo = (Array.isArray(x.itens) && x.itens.length ? x.itens : ITENS_CONDICAO)[i].nome;
      const cond = { ...x.condicoes }; if (antigo !== nome) { cond[nome] = cond[antigo]; delete cond[antigo]; }
      return { ...x, itens: lista, condicoes: cond };
    });
    setSujo(true);
  };
  const OPCOES = { 'Bom / Regular / Ruim': ['Bom', 'Regular', 'Ruim'], 'OK / Com defeito': ['OK', 'Com defeito'] };

  async function gravar() {
    const r = await salvar(id, v);
    if (r?.erro) { flash(r.erro); return false; }
    setSujo(false); return true;
  }
  function gerarPdf() {
    start(async () => {
      if (sujo && !(await gravar())) return;
      const antes = document.title;
      document.title = `Termo de vistoria ${v.tipo === 'saida' ? 'saída' : 'entrada'} - Kitnet ${String(kitnet).padStart(2, '0')} ${grupo} - ${partes.locatario || ''}`.replace(/[\\/:*?"<>|]/g, '');
      window.print();
      setTimeout(() => { document.title = antes; }, 500);
    });
  }
  function novaSaida() {
    set({ tipo: 'saida', data: new Date().toISOString().slice(0, 10), dataAssinatura: new Date().toISOString().slice(0, 10) });
    flash('Marque a coluna "Saída" de cada item');
  }

  const fld = (rotulo, valor, onChange, props = {}) => (
    <label className={'fld' + (props.full ? ' full' : '')}><span>{rotulo}</span>
      {props.area ? <textarea rows={props.rows || 3} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} />
        : <input type={props.type || 'text'} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={props.placeholder} />}
    </label>
  );
  const marca = (on) => (on ? '☒' : '☐');

  return (
    <div className="prop-grid">
      <div className="prop-edit no-print">
        <div className="card pad stack" style={{ gap: 16 }}>
          <div className="card-head" style={{ marginBottom: 0 }}>
            <h2>Termo de vistoria · Kitnet {String(kitnet).padStart(2, '0')} · {grupo}</h2>
            <span className="small" role="status">{msg || (sujo ? 'Alterações não salvas' : 'Salvo')}</span>
          </div>
          <div className="actions">
            <button type="button" className="btn primary" disabled={pending} onClick={gerarPdf}>{pending ? 'Preparando…' : 'Gerar PDF'}</button>
            <button type="button" className="btn" disabled={pending || !sujo} onClick={() => start(async () => { if (await gravar()) flash('Termo salvo'); })}>Salvar</button>
            {v.tipo === 'entrada' && <button type="button" className="btn sm" onClick={novaSaida}>Fazer vistoria de saída</button>}
          </div>
          <p className="small" style={{ margin: 0 }}>Os nomes e CPFs vêm da kitnet e do locador do bairro (preenchidos no Contrato). Clique nas opções para marcar; clique de novo para desmarcar.</p>

          <fieldset className="kc-grupo"><legend>Vistoria</legend>
            <div className="actions" style={{ marginBottom: 10 }}>
              {[['entrada', 'Entrada'], ['saida', 'Saída']].map(([k, n]) => (
                <label key={k} className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="radio" name="tipo" checked={v.tipo === k} onChange={() => set({ tipo: k })} /> {n}
                </label>
              ))}
            </div>
            <div className="form">
              {fld('Data da vistoria', v.data, (x) => set({ data: x }), { type: 'date' })}
              {fld('Data da assinatura', v.dataAssinatura, (x) => set({ dataAssinatura: x }), { type: 'date' })}
              {fld('Cidade', v.cidade, (x) => set({ cidade: x }))}
              {fld('Endereço do imóvel', v.endereco, (x) => set({ endereco: x }), { full: true })}
            </div>
          </fieldset>

          <fieldset className="kc-grupo"><legend>Condições gerais</legend>
            <div className="vt-lista">
              {itens.map((it, i) => (
                <div key={i} className="vt-item">
                  <div className="vt-item-top">
                    <input className="vt-nome" aria-label="Item" value={it.nome} onChange={(e) => renomear(i, e.target.value)} />
                    <button type="button" className="btn ghost sm" aria-label={`Remover ${it.nome}`} onClick={() => setItens((l) => l.filter((_, j) => j !== i))}>✕</button>
                  </div>
                  {[['entrada', 'Entrada'], ['saida', 'Saída']].map(([col, rot]) => (
                    <div key={col} className="vt-linha">
                      <span className="small">{rot}</span>
                      <div className="vt-ops">
                        {it.op.map((o) => (
                          <button key={o} type="button" className={'vt-op' + (v.condicoes[it.nome]?.[col] === o ? ' on' : '')} onClick={() => setCond(it.nome, col, o)}>{o}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="actions" style={{ marginTop: 10 }}>
              {Object.entries(OPCOES).map(([rot, op]) => (
                <button key={rot} type="button" className="btn sm" onClick={() => setItens((l) => [...l, { nome: 'Novo item', op }])}>+ Item ({rot})</button>
              ))}
              <button type="button" className="btn ghost sm" onClick={() => { setV((x) => ({ ...x, itens: ITENS_CONDICAO })); setSujo(true); }}>Restaurar itens do modelo</button>
            </div>
            <p className="small" style={{ margin: '6px 0 0' }}>Kitnet mobiliada? Acrescente os móveis aqui (ex.: Cama, Guarda-roupa, Geladeira) e descreva-os nos ambientes abaixo.</p>
          </fieldset>

          <fieldset className="kc-grupo"><legend>Descrição por ambiente</legend>
            <div className="stack" style={{ gap: 12 }}>
              {v.ambientes.map((a, i) => (
                <div key={i} className="prop-et">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input aria-label="Ambiente" value={a.nome} onChange={(e) => setAmb(i, { nome: e.target.value })} style={{ fontWeight: 500 }} />
                    <button type="button" className="btn ghost sm" aria-label="Remover ambiente" onClick={() => set({ ambientes: v.ambientes.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                  <textarea rows={3} aria-label="Itens existentes" placeholder="Itens existentes" value={a.itens} onChange={(e) => setAmb(i, { itens: e.target.value })} />
                  <textarea rows={3} aria-label="Condições" placeholder="Condições" value={a.condicoes} onChange={(e) => setAmb(i, { condicoes: e.target.value })} />
                  <input aria-label="Observações" placeholder="Observações" value={a.obs} onChange={(e) => setAmb(i, { obs: e.target.value })} />
                </div>
              ))}
              <div className="actions">
                <button type="button" className="btn sm" onClick={() => set({ ambientes: [...v.ambientes, { nome: 'Novo ambiente', itens: '', condicoes: '', obs: '' }] })}>Adicionar ambiente</button>
                <button type="button" className="btn ghost sm" onClick={() => { set({ ambientes: padraoAmbientes.map((a) => ({ ...a })) }); flash('Ambientes do termo original restaurados'); }}>Restaurar ambientes do termo original</button>
              </div>
            </div>
          </fieldset>

          <fieldset className="kc-grupo"><legend>Observações gerais</legend>
            {fld('Chaves, controles e outros itens entregues', v.obsGerais, (x) => set({ obsGerais: x }), { area: true, rows: 5, full: true })}
            {fld('Wi-Fi (opcional; sai no termo)', v.wifi, (x) => set({ wifi: x }), { full: true, placeholder: 'Ex.: Login: … / Senha: …' })}
          </fieldset>
        </div>
      </div>

      <div className="prop-preview">
        <article className="contrato vistoria">
          <h1>Termo de Vistoria de Imóvel — Entrada / Saída</h1>
          <table className="vt-dados"><tbody>
            <tr><th>Locador(a)</th><td>{partes.locador || '__________'}</td></tr>
            <tr><th>Locatário(a)</th><td>{partes.locatario || '__________'}</td></tr>
            <tr><th>Endereço do imóvel</th><td>{v.endereco}</td></tr>
            <tr><th>Imóvel</th><td>Kitnet {String(kitnet).padStart(2, '0')}</td></tr>
            <tr><th>Cidade</th><td>Silvânia – GO</td></tr>
            <tr><th>Data da vistoria</th><td>{BR(v.data)}</td></tr>
            <tr><th>Tipo de vistoria</th><td>{marca(v.tipo === 'entrada')} Entrada &nbsp;&nbsp; {marca(v.tipo === 'saida')} Saída</td></tr>
          </tbody></table>

          <h2>Objetivo</h2>
          <p>{objetivo(v.tipo, kitnet)}</p>

          <h2>Condições gerais do imóvel</h2>
          <table className="vt-cond">
            <thead><tr><th>Item</th><th>Entrada</th><th>Saída</th></tr></thead>
            <tbody>
              {itens.map((it, i) => (
                <tr key={i}>
                  <td>{it.nome}</td>
                  {['entrada', 'saida'].map((col) => (
                    <td key={col}>{it.op.map((o) => <span key={o} className="vt-m">{marca(v.condicoes[it.nome]?.[col] === o)} {o}</span>)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Descrição por ambiente</h2>
          {v.ambientes.map((a, i) => (
            <div key={i} className="vt-amb">
              <h3>{a.nome}</h3>
              {a.itens && <p><strong>Itens existentes:</strong> {a.itens}</p>}
              {a.condicoes && <p><strong>Condições:</strong> {a.condicoes}</p>}
              {a.obs && <p><strong>Observações:</strong> {a.obs}</p>}
            </div>
          ))}

          <h2>Observações gerais</h2>
          {linhas(v.obsGerais).map((l, i) => <p key={i}>{l}</p>)}
          {v.wifi && <p><strong>Wi-Fi:</strong> {v.wifi}</p>}

          <h2>Declaração</h2>
          <p>{DECLARACAO}</p>

          <p className="ct-local">{v.cidade || 'Silvânia'}, {dataLonga(v.dataAssinatura)}.</p>
          <div className="ct-ass">
            <div><span className="linha" /><strong>{partes.locador || '__________'} – Locador(a)</strong><br />CPF: {partes.locadorCpf || '__________'}</div>
            <div><span className="linha" /><strong>{partes.locatario || '__________'} – Locatário(a)</strong><br />CPF: {partes.locatarioCpf || '__________'}</div>
          </div>
        </article>
      </div>
    </div>
  );
}
