'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { TIPOS, resumoMes } from '@/lib/pessoal';
import { brl, nomeMes } from '@/lib/format';

let seq = 0;
const nova = (tipo, extra = {}) => ({ key: 'n' + (++seq), tipo, descricao: '', valor: '', feito: false, parcela: '', data: '', obs: '', ...extra });

export default function PessoalMes({ mes, inicial, saldoAuto, saldoManualInicial, podeComecar, mesAnterior, salvar, comecar }) {
  const [linhas, setLinhas] = useState(() => inicial.map((l) => ({ ...l, key: 'k' + (++seq), parcela: l.parcela || '', data: l.data || '', obs: l.obs || '' })));
  const [saldoManual, setSaldoManual] = useState(saldoManualInicial);
  const [editSaldo, setEditSaldo] = useState(false);
  const [estado, setEstado] = useState('salvo'); // salvo | pendente | salvando | erro
  const [pending, start] = useTransition();
  const versao = useRef(0);
  const salvando = useRef(false);
  const ultimo = useRef(null);

  const mudou = () => { versao.current += 1; setEstado('pendente'); };
  const setL = (key, patch) => { setLinhas((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l))); mudou(); };
  const add = (tipo) => { setLinhas((ls) => [...ls, nova(tipo)]); mudou(); };
  const del = (key) => { setLinhas((ls) => ls.filter((l) => l.key !== key)); mudou(); };

  // Salvamento automático: 1 s depois da última alteração, um salvamento por vez.
  ultimo.current = { linhas, saldoManual };
  useEffect(() => {
    if (estado !== 'pendente') return;
    const t = setTimeout(gravar, 1000);
    return () => clearTimeout(t);
  });
  async function gravar() {
    if (salvando.current) return;
    salvando.current = true;
    const v = versao.current;
    setEstado('salvando');
    try {
      const { linhas: ls, saldoManual: sm } = ultimo.current;
      const r = await salvar(mes, { linhas: ls.map(({ key, ...l }) => l), saldoManual: sm });
      if (r?.erro) throw new Error(r.erro);
      setEstado(versao.current === v ? 'salvo' : 'pendente');
    } catch {
      setEstado('erro');
    } finally {
      salvando.current = false;
    }
  }
  // Avisa antes de sair com algo ainda não salvo
  useEffect(() => {
    const f = (e) => { if (estado !== 'salvo') { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [estado]);

  const saldoIni = saldoManual !== '' && saldoManual != null ? Number(String(saldoManual).replace(',', '.')) || 0 : saldoAuto;
  const r = useMemo(() => resumoMes(linhas, saldoIni), [linhas, saldoIni]);
  const textoEstado = { salvo: 'Tudo salvo', pendente: 'Alterações a salvar…', salvando: 'Salvando…', erro: 'Não salvou — confira a internet' }[estado];

  const inp = { border: '1px solid transparent', borderRadius: 6, padding: '6px 8px', width: '100%', minWidth: 0, background: 'transparent', font: 'inherit' };

  return (
    <>
      <section className="card pad pf-resumo" aria-label="Resumo do mês">
        <div className="pf-eq">
          <div className="pf-termo">
            <span className="lbl">Veio do mês anterior</span>
            {editSaldo ? (
              <input autoFocus type="number" step="0.01" className="pf-saldo-inp" value={saldoManual} placeholder={String(saldoAuto)}
                onChange={(e) => { setSaldoManual(e.target.value); mudou(); }} onBlur={() => setEditSaldo(false)} aria-label="Saldo que veio do mês anterior" />
            ) : (
              <button type="button" className="pf-val pf-link" onClick={() => setEditSaldo(true)} title="Clique para corrigir">{brl(r.saldoAnterior)}</button>
            )}
            <span className="hint">{saldoManual !== '' ? <>digitado · <button type="button" className="pf-link" onClick={() => { setSaldoManual(''); mudou(); }}>usar automático</button></> : 'automático (sobra do mês anterior)'}</span>
          </div>
          <span className="pf-op">+</span>
          <div className="pf-termo"><span className="lbl">Entradas</span><span className="pf-val pos">{brl(r.entradas)}</span><span className="hint">{r.aReceber > 0 ? `${brl(r.aReceber)} a receber` : 'tudo recebido'}</span></div>
          <span className="pf-op">−</span>
          <div className="pf-termo"><span className="lbl">Gastos</span><span className="pf-val">{brl(r.gastos)}</span><span className="hint">contas {brl(r.contas)} · cartão {brl(r.cartao)}</span></div>
          <span className="pf-op">−</span>
          <div className="pf-termo"><span className="lbl">Investido</span><span className="pf-val">{brl(r.investimentos)}</span><span className="hint">para a XP</span></div>
          <span className="pf-op">=</span>
          <div className="pf-termo pf-sobra"><span className="lbl">Vai sobrar</span><span className={'pf-val ' + (r.sobra < 0 ? 'neg' : 'pos')}>{brl(r.sobra)}</span><span className="hint">passa para o próximo mês</span></div>
        </div>
        <div className="pf-agora">
          <span>Na conta agora (só o que você marcou): <strong>{brl(r.saldoAgora)}</strong></span>
          <span>Falta pagar: <strong className={r.aPagar > 0 ? 'wrn' : ''}>{brl(r.aPagar)}</strong></span>
          <span className="small" role="status" style={{ marginLeft: 'auto' }}>{textoEstado}</span>
        </div>
      </section>

      {podeComecar && (
        <div className="notice" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <span><strong>{nomeMes(mes)}</strong> ainda está vazio. Quer começar com as contas fixas, as entradas e as próximas parcelas de {nomeMes(mesAnterior)}?</span>
          <button type="button" className="btn primary sm" disabled={pending} onClick={() => start(async () => { const x = await comecar(mes); if (!x?.erro) window.location.reload(); })}>
            {pending ? 'Preparando…' : 'Começar o mês'}
          </button>
        </div>
      )}

      <div className="pf-grid">
        {TIPOS.map((tp) => {
          const ls = linhas.filter((l) => l.tipo === tp.id);
          const total = ls.reduce((s, l) => s + (Number(l.valor) || 0), 0);
          const feito = ls.filter((l) => l.feito).reduce((s, l) => s + (Number(l.valor) || 0), 0);
          return (
            <section key={tp.id} className={'card pf-bloco pf-' + tp.id}>
              <header className="pf-head">
                <div><h2>{tp.nome}</h2><span className="small">{tp.sub}</span></div>
                <div className="r"><strong className="num">{brl(total)}</strong><span className="small">{tp.feito.toLowerCase()} {brl(feito)}</span></div>
              </header>
              <div className="table-wrap">
                <table className="tbl pf-tbl">
                  <thead><tr><th>Descrição</th><th className="r" style={{ width: 110 }}>Valor</th><th style={{ width: 64 }}>Parcela</th><th style={{ width: 128 }}>Data</th><th style={{ width: 86 }}>{tp.feito}?</th><th style={{ width: 34 }}></th></tr></thead>
                  <tbody>
                    {ls.map((l) => (
                      <tr key={l.key} className={l.feito ? 'pf-feito' : ''}>
                        <td><input style={inp} value={l.descricao} placeholder="Descrição" onChange={(e) => setL(l.key, { descricao: e.target.value })} aria-label="Descrição" /></td>
                        <td><input style={{ ...inp, textAlign: 'right' }} type="number" step="0.01" min="0" value={l.valor} placeholder="0,00" onChange={(e) => setL(l.key, { valor: e.target.value })} aria-label="Valor" /></td>
                        <td><input style={inp} value={l.parcela} placeholder="—" onChange={(e) => setL(l.key, { parcela: e.target.value })} aria-label="Parcela (ex.: 3/8)" /></td>
                        <td><input style={inp} type="date" value={l.data} onChange={(e) => setL(l.key, { data: e.target.value })} aria-label="Data" /></td>
                        <td><button type="button" className={'pf-pago' + (l.feito ? ' on' : '')} aria-pressed={!!l.feito} onClick={() => setL(l.key, { feito: !l.feito })} title="Clique para marcar ou desmarcar">{l.feito ? '✓ Sim' : 'Não'}</button></td>
                        <td className="r"><button type="button" className="btn ghost sm" onClick={() => del(l.key)} aria-label="Remover linha">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pf-add"><button type="button" className="btn ghost sm" onClick={() => add(tp.id)}>+ Adicionar</button></div>
            </section>
          );
        })}
      </div>
      <p className="small" style={{ marginTop: 14 }}>
        Na coluna “Pago?” (ou Recebido/Investido), clique para trocar entre Não e Sim; a linha fica verde. “Vai sobrar” considera tudo o que está lançado; “Na conta agora” só o que está marcado.
        Parcelas no formato 3/8: em “Começar o mês” elas avançam sozinhas e a última não se repete.
      </p>
    </>
  );
}
