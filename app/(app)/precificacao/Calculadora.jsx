'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { brl, numero, ETAPAS_PADRAO, TIPOS_PROJETO } from '@/lib/format';
import { calcular, custoMes, FATORES } from '@/lib/precificacao';
import Link from 'next/link';

let seq = 0;
const k = () => 'c' + (++seq);

export default function Calculadora({ cfgInicial, orcInicial, clientes, salvarCfg, salvarOrc }) {
  const [cfg, setCfg] = useState(cfgInicial);
  const [o, setO] = useState(orcInicial);
  const [abrirCustos, setAbrirCustos] = useState(false);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const timer = useRef(null);
  const primeiro = useRef(true);

  useEffect(() => {
    if (primeiro.current) { primeiro.current = false; return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { salvarCfg(cfg).then(() => flash('Custos do escritório salvos')); }, 800);
    return () => clearTimeout(timer.current);
  }, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  function flash(t) { setMsg(t); setTimeout(() => setMsg(''), 2500); }
  const r = calcular(cfg, o);
  const setC = (patch) => setCfg((c) => ({ ...c, ...patch }));
  const setCusto = (i, patch) => setCfg((c) => ({ ...c, custos: c.custos.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const setOrc = (patch) => setO((x) => ({ ...x, ...patch }));
  const setLista = (lista, i, patch) => setO((x) => ({ ...x, [lista]: x[lista].map((y, j) => (j === i ? { ...y, ...patch } : y)) }));
  const remover = (lista, i) => setO((x) => ({ ...x, [lista]: x[lista].filter((_, j) => j !== i) }));

  let alerta = '';
  if (!r.ok) alerta = 'Impostos + lucro precisam somar menos de 100%, e a margem para negociar também.';
  else if (!(r.hm > 0)) alerta = 'Informe as horas produtivas por mês para calcular o custo-hora.';
  else if (!r.horas) alerta = 'Nenhuma hora no projeto ainda. Marque etapas ou preencha as horas.';

  async function copiar() {
    const et = o.etapas.filter((e) => e.on !== false && Number(e.horas) > 0);
    const cli = clientes.find((c) => String(c.id) === String(o.cliente_id));
    const txt = [`Orçamento${o.nome ? ' — ' + o.nome : ''}${cli ? ' (' + cli.nome + ')' : ''}`, r.area ? `Área: ${numero(r.area, 2)} m²` : null, '', 'Etapas incluídas:',
      ...et.map((e) => `• ${e.nome} — ${numero((Number(e.horas) || 0) * r.fator)} h`), '', `Total de horas: ${numero(r.horas)} h`, `Custo-hora: ${brl(r.hora)}`,
      `Despesas do projeto: ${brl(r.desp)}`, '', `Mínimo: ${brl(r.minimo)}`, `Ideal: ${brl(r.ideal)}`, `Valor a propor: ${brl(r.prop)}${r.area ? ` (${brl(r.prop / r.area)}/m²)` : ''}`,
      r.final ? `Valor fechado: ${brl(r.final)}` : null, `${r.parc}× de ${brl(r.parcela)}`].filter((l) => l !== null).join('\n');
    try { await navigator.clipboard.writeText(txt); flash('Resumo copiado'); } catch { flash('Não deu para copiar.'); }
  }

  return (
    <>
      <section className="card pad" style={{ marginBottom: 20 }}>
        <div className="card-head" style={{ marginBottom: abrirCustos ? 14 : 0 }}>
          <div><h2>Custos do escritório, pró-labore e margens</h2>
            <p className="sub">Custo-hora atual: <strong className="num" style={{ color: 'var(--primary)' }}>{brl(r.hora)}</strong> · total a cobrir por mês {brl(r.fixos + r.pl)}</p></div>
          <div className="actions"><span className="small" role="status">{msg}</span><button type="button" className="btn" onClick={() => setAbrirCustos((v) => !v)}>{abrirCustos ? 'Fechar' : 'Editar custos'}</button></div>
        </div>
        {abrirCustos && (
          <div className="grid-side">
            <div>
              <p className="small" style={{ marginTop: 0 }}>O “% escritório” rateia as despesas da loja para a parte da arquitetura. Despesas anuais são divididas por 12. Tudo é salvo automaticamente.</p>
              <div className="table-wrap"><table className="mini-tbl" style={{ minWidth: 560 }}>
                <thead><tr><th>Despesa</th><th style={{ width: 120, textAlign: 'right' }}>Valor (R$)</th><th style={{ width: 100 }}>Período</th><th style={{ width: 90, textAlign: 'right' }}>% escrit.</th><th style={{ textAlign: 'right' }}>Por mês</th><th style={{ width: 32 }}></th></tr></thead>
                <tbody>{cfg.custos.map((c, i) => (
                  <tr key={i}>
                    <td><input aria-label="Despesa" value={c.nome} onChange={(e) => setCusto(i, { nome: e.target.value })} /></td>
                    <td><input className="n" type="number" step="0.01" min="0" aria-label="Valor" value={c.valor} onChange={(e) => setCusto(i, { valor: e.target.value })} /></td>
                    <td><select aria-label="Período" value={c.freq} onChange={(e) => setCusto(i, { freq: e.target.value })}><option value="mes">mensal</option><option value="ano">anual</option></select></td>
                    <td><input className="n" type="number" step="1" min="0" max="100" aria-label="Percentual do escritório" value={c.pct} onChange={(e) => setCusto(i, { pct: e.target.value })} /></td>
                    <td className="out">{brl(custoMes(c))}</td>
                    <td><button type="button" className="btn ghost sm" onClick={() => setCfg((x) => ({ ...x, custos: x.custos.filter((_, j) => j !== i) }))} aria-label="Remover">✕</button></td>
                  </tr>
                ))}</tbody>
              </table></div>
              <div className="form-foot"><button type="button" className="btn sm" onClick={() => setCfg((x) => ({ ...x, custos: [...x.custos, { nome: 'Nova despesa', valor: 0, freq: 'mes', pct: 100 }] }))}>Adicionar despesa</button><span className="small num">Total: {brl(r.fixos)}/mês</span></div>
            </div>
            <div className="form" style={{ alignContent: 'start' }}>
              <label className="fld"><span>Pró-labore (R$/mês)</span><input type="number" step="0.01" min="0" value={cfg.proLabore} onChange={(e) => setC({ proLabore: e.target.value })} /></label>
              <label className="fld"><span>Horas produtivas (h/mês)</span><input type="number" step="1" min="1" value={cfg.horasMes} onChange={(e) => setC({ horasMes: e.target.value })} /></label>
              <label className="fld"><span>Impostos sobre a nota (%)</span><input type="number" step="0.1" min="0" value={cfg.imposto} onChange={(e) => setC({ imposto: e.target.value })} /></label>
              <label className="fld"><span>Lucro do escritório (%)</span><input type="number" step="0.1" min="0" value={cfg.lucro} onChange={(e) => setC({ lucro: e.target.value })} /></label>
              <label className="fld full"><span>Margem para negociar (%)</span><input type="number" step="0.1" min="0" value={cfg.negociacao} onChange={(e) => setC({ negociacao: e.target.value })} /></label>
              <p className="small full" style={{ margin: 0 }}>Horas produtivas são as horas de projeto de fato, sem contar loja, atendimento solto e Instagram. Confira a alíquota com a sua contabilidade.</p>
            </div>
          </div>
        )}
      </section>

      <div className="calc">
        <div className="stack">
          <section className="card pad">
            <div className="card-head"><h2>{o.id ? `Orçamento nº ${o.id}` : 'Projeto do cliente'}</h2></div>
            <div className="form">
              <label className="fld"><span>Cliente</span>
                <select value={o.cliente_id} onChange={(e) => setOrc({ cliente_id: e.target.value })}><option value="">Sem cliente ainda</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
              </label>
              <label className="fld"><span>Nome do projeto</span><input value={o.nome} onChange={(e) => setOrc({ nome: e.target.value })} placeholder="Ex.: Apartamento Setor Bueno" /></label>
              <label className="fld"><span>Tipo</span><select value={o.tipo} onChange={(e) => setOrc({ tipo: e.target.value })}>{TIPOS_PROJETO.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label className="fld"><span>Área (m², opcional)</span><input type="number" step="0.01" min="0" value={o.area} onChange={(e) => setOrc({ area: e.target.value })} /></label>
              <label className="fld"><span>Complexidade</span><select value={o.fator} onChange={(e) => setOrc({ fator: e.target.value })}>{FATORES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="fld"><span>Número de parcelas</span><input type="number" min="1" step="1" value={o.parcelas} onChange={(e) => setOrc({ parcelas: e.target.value })} /></label>
            </div>
          </section>

          <section className="card pad">
            <div className="card-head"><h2>Etapas e horas</h2><span className="small num">{numero(r.horasBase)} h</span></div>
            <p className="small" style={{ marginTop: 0 }}>Desmarque as etapas que não entram no escopo e ajuste as horas.</p>
            <div className="table-wrap"><table className="mini-tbl" style={{ minWidth: 460 }}>
              <thead><tr><th style={{ width: 34 }}></th><th>Etapa</th><th style={{ width: 100, textAlign: 'right' }}>Horas</th><th style={{ textAlign: 'right' }}>Valor</th><th style={{ width: 32 }}></th></tr></thead>
              <tbody>{o.etapas.map((e, i) => (
                <tr key={e.key} className={e.on === false ? 'off' : ''}>
                  <td><input type="checkbox" aria-label="Incluir etapa" checked={e.on !== false} onChange={(ev) => setLista('etapas', i, { on: ev.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} /></td>
                  <td><input aria-label="Etapa" value={e.nome} onChange={(ev) => setLista('etapas', i, { nome: ev.target.value })} /></td>
                  <td><input className="n" type="number" step="0.5" min="0" aria-label="Horas" value={e.horas} onChange={(ev) => setLista('etapas', i, { horas: ev.target.value })} /></td>
                  <td className="out">{brl(e.on === false ? 0 : (Number(e.horas) || 0) * r.fator * r.hora)}</td>
                  <td><button type="button" className="btn ghost sm" onClick={() => remover('etapas', i)} aria-label="Remover">✕</button></td>
                </tr>
              ))}</tbody>
            </table></div>
            <div className="actions" style={{ marginTop: 10 }}>
              <button type="button" className="btn sm" onClick={() => setOrc({ etapas: [...o.etapas, { key: k(), nome: 'Nova etapa', horas: 0, on: true }] })}>Adicionar etapa</button>
              <button type="button" className="btn sm" onClick={() => setOrc({ etapas: ETAPAS_PADRAO.map(([nome, horas]) => ({ key: k(), nome, horas, on: true })) })}>Modelo: interiores completo</button>
              <button type="button" className="btn sm" onClick={() => setOrc({ etapas: o.etapas.map((e) => ({ ...e, horas: 0 })) })}>Zerar horas (serviço pontual)</button>
            </div>
          </section>

          <section className="card pad">
            <div className="card-head"><h2>Despesas deste projeto</h2><span className="small num">{brl(r.desp)}</span></div>
            <p className="small" style={{ marginTop: 0 }}>Gastos que só existem por causa deste cliente. Entram no orçamento sem margem de lucro.</p>
            <table className="mini-tbl"><tbody>{o.desp.map((d, i) => (
              <tr key={d.key}>
                <td><input aria-label="Despesa do projeto" value={d.nome} onChange={(ev) => setLista('desp', i, { nome: ev.target.value })} /></td>
                <td style={{ width: 150 }}><input className="n" type="number" step="0.01" min="0" aria-label="Valor" value={d.valor} onChange={(ev) => setLista('desp', i, { valor: ev.target.value })} /></td>
                <td style={{ width: 32 }}><button type="button" className="btn ghost sm" onClick={() => remover('desp', i)} aria-label="Remover">✕</button></td>
              </tr>
            ))}</tbody></table>
            <button type="button" className="btn sm" style={{ marginTop: 10 }} onClick={() => setOrc({ desp: [...o.desp, { key: k(), nome: 'Nova despesa', valor: 0 }] })}>Adicionar despesa do projeto</button>
          </section>

          <section className="card pad">
            <h2 style={{ marginBottom: 10 }}>Valor fechado</h2>
            <label className="fld"><span>Valor que vai na proposta (opcional)</span><input type="number" step="0.01" min="0" value={o.valorFinal} onChange={(e) => setOrc({ valorFinal: e.target.value })} placeholder="Deixe vazio para usar o valor a propor" /></label>
            <p className="small" style={{ marginBottom: 0 }}>Se arredondar ou der desconto, a calculadora mostra quanto de lucro sobra e avisa se ficar abaixo do mínimo.</p>
          </section>
        </div>

        <aside className="calc-res">
          <div className="card pad">
            <div className="kv">
              <div><span>Custos do escritório</span><span className="num">{brl(r.fixos)}</span></div>
              <div><span>Pró-labore</span><span className="num">{brl(r.pl)}</span></div>
              <div className="tot"><span>Total a cobrir por mês</span><span className="num">{brl(r.fixos + r.pl)}</span></div>
            </div>
            <div className="hourly" style={{ marginTop: 10 }}><span>Custo-hora</span><b className="num">{brl(r.hora)}</b></div>
          </div>
          <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kv">
              <div><span>{r.fator !== 1 ? `Horas (${numero(r.horasBase)} × ${numero(r.fator, 2)})` : 'Horas'}</span><span className="num">{numero(r.horas)} h</span></div>
              <div><span>Custo do seu tempo</span><span className="num">{brl(r.tempo)}</span></div>
              <div><span>Despesas do projeto</span><span className="num">{brl(r.desp)}</span></div>
              <div><span>Impostos</span><span className="num">{brl(r.ideal * r.imp)}</span></div>
              <div><span>Lucro</span><span className="num">{brl(r.ideal * r.luc)}</span></div>
              <div><span><strong style={{ color: 'var(--ink)' }}>Mínimo</strong> · cobre custos e impostos</span><span className="num">{brl(r.minimo)}</span></div>
              <div><span><strong style={{ color: 'var(--ink)' }}>Ideal</strong> · com o lucro definido</span><span className="num">{brl(r.ideal)}</span></div>
            </div>
            <div className="price-main">
              <div className="small">Valor a propor · com margem para negociar{r.area ? ` · ${brl(r.prop / r.area)}/m²` : ''}</div>
              <div className="big">{brl(r.prop)}</div>
            </div>
            {alerta && <div className="notice" style={{ margin: 0 }}>{alerta}</div>}
            <div className="small" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {r.horas > 0 && r.hm > 0 && <span>Este projeto ocupa {numero(r.cap * 100, 0)}% de um mês da sua capacidade ({numero(r.horas)} de {numero(r.hm, 0)} h).</span>}
              {r.area > 0 && <span>Valor ideal por m²: {brl(r.ideal / r.area)}.</span>}
              {r.prop > 0 && <span>Desconto máximo a partir do proposto, sem perder lucro: {brl(r.prop - r.ideal)}.</span>}
            </div>
            {r.final > 0 && (
              <div className="kv">
                <div className="tot"><span>Valor fechado</span><span className="num">{brl(r.final)}</span></div>
                <div><span>Diferença do valor a propor</span><span className={'num ' + (r.final < r.prop ? 'neg' : 'pos')}>{r.final >= r.prop ? '+' : '−'} {brl(Math.abs(r.final - r.prop))}</span></div>
                <div><span>Lucro que sobra</span><span className={'num ' + (r.lucroReal < 0 ? 'neg' : '')}>{brl(r.lucroReal)}</span></div>
                {r.final < r.minimo && <div><span className="neg">Abaixo do mínimo: não cobre custos e impostos</span><span /></div>}
              </div>
            )}
            <div className="kv"><div><span>{r.parc}× parcelas de</span><span className="num">{brl(r.parcela)}</span></div></div>
            <div className="actions">
              <button type="button" className="btn primary" disabled={pending || !r.ok} onClick={() => start(async () => {
                const res = await salvarOrc({ ...o, etapas: o.etapas.map(({ key, ...e }) => e), desp: o.desp.map(({ key, ...d }) => d) });
                setOrc({ id: res.id }); flash(o.id ? 'Orçamento atualizado' : 'Orçamento salvo');
              })}>{pending ? 'Salvando…' : o.id ? 'Atualizar orçamento' : 'Salvar orçamento'}</button>
              <button type="button" className="btn" onClick={copiar}>Copiar resumo</button>
              {o.id && <Link className="btn ghost" href="/precificacao">Novo cálculo</Link>}
            </div>
            <span className="small" role="status">{msg}</span>
          </div>
        </aside>
      </div>
    </>
  );
}
