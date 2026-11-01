'use client';
import { useState, useTransition } from 'react';
import { brl, dataExtenso, porExtenso } from '@/lib/format';

let seq = 0;
const comChave = (lista) => lista.map((e) => ({ ...e, key: 'p' + (++seq) }));

export default function PropostaEditor({ id, inicial, padrao, jaSalva, valorOrcamento, escritorio, salvar }) {
  const [p, setP] = useState(() => ({ ...inicial, etapas: comChave(inicial.etapas || []) }));
  const [sujo, setSujo] = useState(!jaSalva);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const set = (patch) => { setP((x) => ({ ...x, ...patch })); setSujo(true); };
  const setEt = (i, patch) => { setP((x) => ({ ...x, etapas: x.etapas.map((e, j) => (j === i ? { ...e, ...patch } : e)) })); setSujo(true); };
  const mover = (i, d) => { setP((x) => { const n = [...x.etapas]; const j = i + d; if (j < 0 || j >= n.length) return x; [n[i], n[j]] = [n[j], n[i]]; return { ...x, etapas: n }; }); setSujo(true); };
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };

  async function gravar() {
    await salvar(id, { ...p, etapas: p.etapas.map(({ key, ...e }) => e) });
    setSujo(false);
  }
  function gerarPdf() {
    start(async () => {
      if (sujo) await gravar();
      const antes = document.title;
      document.title = `Proposta ${String(id).padStart(4, '0')} - ${p.cliente || p.titulo}`.replace(/[\\/:*?"<>|]/g, '');
      window.print();
      setTimeout(() => { document.title = antes; }, 500);
    });
  }

  const valor = Number(p.valor) || 0;
  const linhas = (t) => String(t || '').split('\n').filter((l) => l.trim());

  return (
    <div className="prop-grid">
      <div className="prop-edit no-print">
        <div className="card pad stack" style={{ gap: 16 }}>
          <div className="card-head" style={{ marginBottom: 0 }}>
            <h2>Proposta nº {String(id).padStart(4, '0')}</h2>
            <span className="small" role="status">{msg || (sujo ? 'Alterações não salvas' : 'Salva')}</span>
          </div>
          <div className="actions">
            <button type="button" className="btn primary" disabled={pending} onClick={gerarPdf}>{pending ? 'Preparando…' : 'Gerar PDF'}</button>
            <button type="button" className="btn" disabled={pending || !sujo} onClick={() => start(async () => { await gravar(); flash('Proposta salva'); })}>Salvar</button>
          </div>
          <p className="small" style={{ margin: 0 }}>Em “Gerar PDF”, escolha <strong>Salvar como PDF</strong> como destino. Para o fundo areia sair no arquivo, deixe marcada a opção <strong>Gráficos de plano de fundo</strong> em “Mais configurações”.</p>

          <label className="fld"><span>Título</span><input value={p.titulo} onChange={(e) => set({ titulo: e.target.value })} /></label>
          <div className="form">
            <label className="fld"><span>Cliente</span><input value={p.cliente} onChange={(e) => set({ cliente: e.target.value })} /></label>
            <label className="fld"><span>Data</span><input type="date" value={p.data} onChange={(e) => set({ data: e.target.value })} /></label>
          </div>
          <label className="fld"><span>Objeto da proposta</span><textarea rows={5} value={p.objeto} onChange={(e) => set({ objeto: e.target.value })} /></label>

          <div className="fld">
            <span>Escopo dos serviços (etapas marcadas na calculadora)</span>
            <div className="stack" style={{ gap: 10 }}>
              {p.etapas.map((e, i) => (
                <div key={e.key} className="prop-et">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input aria-label="Etapa" value={e.nome} onChange={(ev) => setEt(i, { nome: ev.target.value })} style={{ fontWeight: 500 }} />
                    <button type="button" className="btn ghost sm" onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
                    <button type="button" className="btn ghost sm" onClick={() => mover(i, 1)} aria-label="Descer">↓</button>
                    <button type="button" className="btn ghost sm" onClick={() => { setP((x) => ({ ...x, etapas: x.etapas.filter((_, j) => j !== i) })); setSujo(true); }} aria-label="Remover">✕</button>
                  </div>
                  <textarea aria-label="Descrição da etapa" rows={2} value={e.descricao} onChange={(ev) => setEt(i, { descricao: ev.target.value })} placeholder="Descrição breve para o cliente" />
                </div>
              ))}
              <button type="button" className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => set({ etapas: [...p.etapas, { key: 'p' + (++seq), nome: 'Nova etapa', descricao: '' }] })}>Adicionar etapa</button>
            </div>
          </div>

          <label className="fld"><span>Entrega</span><textarea rows={2} value={p.entrega} onChange={(e) => set({ entrega: e.target.value })} /></label>
          <label className="fld"><span>Prazo</span><textarea rows={3} value={p.prazo} onChange={(e) => set({ prazo: e.target.value })} /></label>
          <div className="form">
            <label className="fld"><span>Investimento (R$)</span><input type="number" step="0.01" min="0" value={p.valor} onChange={(e) => set({ valor: e.target.value })} /></label>
            <div className="fld"><span>Valor do orçamento</span>
              <button type="button" className="btn" onClick={() => set({ valor: valorOrcamento })} disabled={Number(p.valor) === valorOrcamento}>Usar {brl(valorOrcamento)}</button></div>
          </div>
          <label className="fld"><span>Forma de pagamento</span><textarea rows={2} value={p.pagamento} onChange={(e) => set({ pagamento: e.target.value })} /></label>
          <label className="fld"><span>Não incluso</span><textarea rows={3} value={p.naoIncluso} onChange={(e) => set({ naoIncluso: e.target.value })} /></label>
          <label className="fld"><span>Observações (opcional)</span><textarea rows={3} value={p.obs} onChange={(e) => set({ obs: e.target.value })} /></label>
          <label className="fld"><span>Validade</span><input value={p.validade} onChange={(e) => set({ validade: e.target.value })} /></label>

          <div className="form-foot">
            <button type="button" className="btn ghost sm" onClick={() => { setP({ ...padrao, etapas: comChave(padrao.etapas) }); setSujo(true); flash('Texto padrão restaurado'); }}>Restaurar texto padrão</button>
          </div>
        </div>
      </div>

      <div className="prop-preview">
        <article className="folha">
          <img className="folha-marca" src="/monograma.png" alt="" aria-hidden="true" />
          <table className="folha-pag"><thead><tr><td><div className="folha-esp" /></td></tr></thead>
          <tfoot><tr><td><div className="folha-esp" /></td></tr></tfoot>
          <tbody><tr><td>
          <header className="folha-top">
            <img src="/logo-escuro.png" alt="Mariana Canedo Arquitetura e Interiores" />
            <div className="folha-num"><span>Proposta nº {String(id).padStart(4, '0')}</span><span>{dataExtenso(p.data || new Date().toISOString().slice(0, 10))}</span></div>
          </header>

          <div className="folha-titulo">
            <h1>{p.titulo || 'Projeto de Interiores'}</h1>
            {p.cliente && <p>Proposta preparada para <strong>{p.cliente}</strong></p>}
          </div>

          <section className="folha-sec"><h4>Objeto da proposta</h4>{linhas(p.objeto).map((l, i) => <p key={i}>{l}</p>)}</section>

          {p.etapas.length > 0 && (
            <section className="folha-sec longa"><h4>Escopo dos serviços</h4>
              <ol className="folha-etapas">
                {p.etapas.map((e, i) => (
                  <li key={e.key}><span className="n">{String(i + 1).padStart(2, '0')}</span><div><strong>{e.nome}</strong>{e.descricao && <p>{e.descricao}</p>}</div></li>
                ))}
              </ol>
            </section>
          )}

          {p.entrega && <section className="folha-sec"><h4>Entrega</h4>{linhas(p.entrega).map((l, i) => <p key={i}>{l}</p>)}</section>}
          {p.prazo && <section className="folha-sec"><h4>Prazo</h4>{linhas(p.prazo).map((l, i) => <p key={i}>{l}</p>)}</section>}

          <section className="folha-sec folha-inv"><h4>Investimento</h4>
            <div className="folha-valor">{brl(valor)}</div>
            {valor > 0 && <p className="folha-ext">({porExtenso(valor)})</p>}
            {linhas(p.pagamento).map((l, i) => <p key={i}>{l}</p>)}
          </section>

          {p.naoIncluso && <section className="folha-sec"><h4>Não incluso</h4>{linhas(p.naoIncluso).map((l, i) => <p key={i}>{l}</p>)}</section>}
          {p.obs && <section className="folha-sec"><h4>Observações</h4>{linhas(p.obs).map((l, i) => <p key={i}>{l}</p>)}</section>}

          <section className="folha-sec folha-aceite">
            {p.validade && <p className="folha-validade">{p.validade}</p>}
            <div className="folha-ass">
              <div><span className="linha" />De acordo — {p.cliente || 'Cliente'}</div>
              <div><span className="linha" />Data</div>
            </div>
          </section>

          <footer className="folha-rodape">
            <strong>{escritorio.nome}</strong>
            <span>{[escritorio.cau && 'CAU ' + escritorio.cau, escritorio.telefone, escritorio.email, escritorio.cidade].filter(Boolean).join('  ·  ')}</span>
          </footer>
          </td></tr></tbody></table>
        </article>
      </div>
    </div>
  );
}
