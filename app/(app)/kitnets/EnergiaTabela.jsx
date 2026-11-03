'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { brl, data, numero, hoje } from '@/lib/format';
import { calcLeitura, nomeUnidade } from '@/lib/kitnets';
import Modal from '@/components/Modal';
import ConfirmButton from '@/components/ConfirmButton';
import { LeituraCampos } from '@/components/KitCampos';

const kwh = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/**
 * Controle de energia: últimas leituras de cada kitnet e uma linha editável
 * para digitar a próxima leitura direto na tabela.
 */
export default function EnergiaTabela({ unidades, salvarLote, salvarLeitura, excluirLeitura, alternarPago }) {
  const novaLinha = (u) => {
    const ult = u.historico[u.historico.length - 1];
    return {
      unidade_id: u.id,
      data_anterior: ult?.data_atual || '',
      leitura_anterior: ult?.leitura_atual ?? '',
      data_atual: hoje(),
      leitura_atual: '',
      valor_kwh: ult?.valor_kwh ?? u.valor_kwh ?? 0.9,
      franquia_kwh: u.franquia_kwh ?? 150,
    };
  };
  const [prox, setProx] = useState(() => Object.fromEntries(unidades.map((u) => [u.id, novaLinha(u)])));
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const set = (id, k, v) => setProx((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));
  const preenchidas = Object.values(prox).filter((l) => l.leitura_atual !== '' && l.data_atual);
  const totalProx = preenchidas.reduce((s, l) => s + calcLeitura(l).total, 0);

  function salvarTodas() {
    start(async () => {
      const r = await salvarLote(preenchidas);
      setMsg(`${r?.salvas || 0} leitura${r?.salvas === 1 ? '' : 's'} salva${r?.salvas === 1 ? '' : 's'}.`);
      setTimeout(() => setMsg(''), 3500);
      // A página recarrega os dados; as linhas novas passam a usar a leitura recém-salva como anterior.
      setProx((p) => Object.fromEntries(Object.entries(p).map(([id, l]) => (l.leitura_atual !== '' ? [id, { ...l, data_anterior: l.data_atual, leitura_anterior: l.leitura_atual, leitura_atual: '', data_atual: hoje() }] : [id, l]))));
    });
  }

  const inp = { border: '1px solid var(--line-2)', borderRadius: 6, padding: '6px 8px', width: '100%', minWidth: 0, background: 'var(--surface)', textAlign: 'right' };

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="tbl" style={{ minWidth: 1080 }}>
          <thead><tr>
            <th>Período</th><th className="r">Leitura anterior</th><th className="r">Leitura atual</th><th className="r">kWh consumido</th>
            <th className="r">Valor do kWh</th><th className="r">Energia a cobrar</th><th className="r">Total com aluguel</th><th>Situação</th><th></th>
          </tr></thead>
          <tbody>
            {unidades.map((u) => {
              const p = prox[u.id];
              const cp = calcLeitura(p);
              const temP = p.leitura_atual !== '';
              return [
                <tr key={'h' + u.id}>
                  <td colSpan={9} style={{ background: 'var(--surface-2)', paddingTop: 10, paddingBottom: 10 }}>
                    <Link href={`/kitnets/${u.id}`} style={{ fontWeight: 600, textDecoration: 'none' }}>{nomeUnidade(u)}</Link>
                    <span className="small"> · {u.inquilino || 'Vaga'} · aluguel {brl(u.aluguel)} · {numero(u.franquia_kwh, 0)} kWh inclusos</span>
                  </td>
                </tr>,
                ...u.historico.map((l) => {
                  const c = calcLeitura(l);
                  return (
                    <tr key={l.id}>
                      <td className="num">{data(l.data_anterior).slice(0, 5)} a {data(l.data_atual)}{l.obs && <span className="sm">{l.obs}</span>}</td>
                      <td className="r num">{numero(l.leitura_anterior)}</td>
                      <td className="r num">{numero(l.leitura_atual)}</td>
                      <td className={'r num ' + (c.inconsistente ? 'neg' : '')}>{numero(c.consumo)} kWh{c.inconsistente && <span className="sm neg">conferir leitura</span>}</td>
                      <td className="r num">{kwh(l.valor_kwh)}</td>
                      <td className="r num" style={{ fontWeight: 500 }}>{brl(c.total)}</td>
                      <td className="r num">{brl(Number(u.aluguel) + c.total)}</td>
                      <td>
                        <button type="button" className={'tag ' + (l.pago_em ? 'ok' : c.total > 0 ? 'warn' : 'mute')} title="Clique para alternar" onClick={() => start(() => alternarPago(l.id))}>
                          {l.pago_em ? `Pago ${data(l.pago_em).slice(0, 5)}` : 'A receber'}
                        </button>
                      </td>
                      <td className="r">
                        <Modal titulo={`Editar leitura · ${nomeUnidade(u)}`} botao="Editar" classe="btn sm" action={salvarLeitura}
                          extraFoot={<ConfirmButton action={() => excluirLeitura(l.id)} />}>
                          <LeituraCampos l={l} unidade={u} />
                        </Modal>
                      </td>
                    </tr>
                  );
                }),
                <tr key={'p' + u.id} style={{ background: temP ? 'var(--primary-soft)' : undefined }}>
                  <td>
                    <span className="small" style={{ display: 'block', marginBottom: 4 }}>Próxima leitura · de {data(p.data_anterior).slice(0, 5)} a</span>
                    <input type="date" aria-label={`Data da próxima leitura, ${nomeUnidade(u)}`} value={p.data_atual} onChange={(e) => set(u.id, 'data_atual', e.target.value)} style={{ ...inp, textAlign: 'left', maxWidth: 160 }} />
                  </td>
                  <td className="r"><input type="number" step="0.1" aria-label={`Leitura anterior, ${nomeUnidade(u)}`} value={p.leitura_anterior} onChange={(e) => set(u.id, 'leitura_anterior', e.target.value)} style={{ ...inp, maxWidth: 110 }} /></td>
                  <td className="r"><input type="number" step="0.1" placeholder="digite" aria-label={`Leitura atual, ${nomeUnidade(u)}`} value={p.leitura_atual} onChange={(e) => set(u.id, 'leitura_atual', e.target.value)} style={{ ...inp, maxWidth: 110, borderColor: 'var(--primary)' }} /></td>
                  <td className={'r num ' + (temP && cp.inconsistente ? 'neg' : '')}>{temP ? `${numero(cp.consumo)} kWh` : '—'}{temP && cp.inconsistente && <span className="sm neg">menor que a anterior</span>}</td>
                  <td className="r"><input type="number" step="0.001" min="0" aria-label={`Valor do kWh, ${nomeUnidade(u)}`} value={p.valor_kwh} onChange={(e) => set(u.id, 'valor_kwh', e.target.value)} style={{ ...inp, maxWidth: 100 }} /></td>
                  <td className="r num" style={{ fontWeight: 500 }}>{temP ? brl(cp.total) : '—'}</td>
                  <td className="r num">{temP ? brl(Number(u.aluguel) + cp.total) : '—'}</td>
                  <td colSpan={2}><span className="small">{temP ? 'Pronta para salvar' : ''}</span></td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>
      <div className="form-foot" style={{ padding: '14px 18px', borderTop: '1px solid var(--line)', alignItems: 'center' }}>
        <span className="small" role="status">{msg || (preenchidas.length ? `${preenchidas.length} leitura${preenchidas.length > 1 ? 's' : ''} preenchida${preenchidas.length > 1 ? 's' : ''} · energia a cobrar ${brl(totalProx)}` : 'Digite a leitura atual na linha “Próxima leitura” de cada kitnet.')}</span>
        <div className="r"><button type="button" className="btn primary" disabled={pending || !preenchidas.length} onClick={salvarTodas}>{pending ? 'Salvando…' : 'Salvar leituras'}</button></div>
      </div>
    </div>
  );
}
