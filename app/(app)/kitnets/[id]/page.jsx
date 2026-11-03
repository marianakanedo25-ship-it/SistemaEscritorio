import Link from 'next/link';
import { notFound } from 'next/navigation';
import { q, one } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { brl, data, numero } from '@/lib/format';
import { calcLeitura, nomeUnidade, situacaoContrato } from '@/lib/kitnets';
import Modal from '@/components/Modal';
import ConfirmButton from '@/components/ConfirmButton';
import ActionButton from '@/components/ActionButton';
import SaveForm from '@/components/SaveForm';
import { UnidadeCampos, LeituraCampos } from '@/components/KitCampos';
import { salvarUnidade, excluirUnidade, salvarLeitura, excluirLeitura, alternarPagoLeitura } from '../actions';

export default async function KitnetPage({ params }) {
  await exigir('kitnets');
  const { id } = await params;
  const u = await one('SELECT * FROM kit_unidades WHERE id = $1', [Number(id) || 0]);
  if (!u) notFound();
  const [leituras, gruposR] = await Promise.all([
    q('SELECT * FROM kit_leituras WHERE unidade_id = $1 ORDER BY data_atual DESC, id DESC', [u.id]),
    q('SELECT DISTINCT grupo FROM kit_unidades'),
  ]);
  const grupos = gruposR.map((g) => g.grupo);
  const sc = situacaoContrato(u);
  const ult = leituras[0];
  const sug = ult ? { data_anterior: ult.data_atual, leitura_anterior: ult.leitura_atual } : {};
  const calcs = leituras.map((l) => ({ l, c: calcLeitura(l) }));
  const validas = calcs.filter((x) => !x.c.inconsistente);
  const media = validas.length ? validas.reduce((s, x) => s + x.c.consumo, 0) / validas.length : 0;
  const totalEnergia = calcs.reduce((s, x) => s + x.c.total, 0);
  const aReceber = calcs.filter((x) => !x.l.pago_em).reduce((s, x) => s + x.c.total, 0);
  async function excluir() { 'use server'; await excluirUnidade(u.id); }

  return (
    <>
      <p className="small" style={{ margin: '0 0 8px' }}><Link href={`/kitnets?g=${encodeURIComponent(u.grupo)}`}>← Kitnets · {u.grupo}</Link></p>
      <div className="page-head">
        <div><h1>{nomeUnidade(u)} · {u.grupo}</h1><p className="sub">{u.inquilino || 'Sem inquilino'}{u.endereco ? ' · ' + u.endereco : ''}</p></div>
        <div className="actions">
          {u.pasta_drive && <a className="btn" href={u.pasta_drive} target="_blank" rel="noreferrer">Pasta no Drive</a>}
          <Modal titulo={`Nova leitura · ${nomeUnidade(u)}`} botao="+ Lançar leitura" classe="btn primary" action={salvarLeitura}><LeituraCampos unidade={u} sugestao={sug} /></Modal>
        </div>
      </div>

      <div className="stats">
        <div className="card stat"><span className="lbl">Aluguel</span><span className="val">{brl(u.aluguel)}</span><span className="hint">Vence todo dia {u.vencimento_dia ? String(u.vencimento_dia).padStart(2, '0') : '—'}</span></div>
        <div className="card stat"><span className="lbl">Contrato</span><span className="val" style={{ fontSize: 22 }}>{data(u.inicio)} a {data(u.fim)}</span><span className={'tag ' + sc.tom} style={{ alignSelf: 'flex-start' }}>{sc.texto}</span></div>
        <div className="card stat"><span className="lbl">Consumo médio</span><span className="val">{numero(media, 0)} kWh</span><span className="hint">{numero(u.franquia_kwh, 0)} kWh inclusos no aluguel</span></div>
        <div className="card stat"><span className="lbl">Energia cobrada</span><span className="val">{brl(totalEnergia)}</span><span className="hint">Em aberto: {brl(aReceber)}</span></div>
      </div>

      <section className="card pad" style={{ marginBottom: 20 }}>
        <div className="card-head"><h2>Leituras de energia</h2><span className="small">kWh consumido = leitura atual − anterior · cobrança = (consumo − inclusos) × valor do kWh</span></div>
        {calcs.length ? (
          <div className="table-wrap"><table className="tbl" style={{ minWidth: 900 }}>
            <thead><tr><th>Período</th><th className="r">Anterior</th><th className="r">Atual</th><th className="r">Consumido</th><th className="r">Acima do incluso</th><th className="r">Valor do kWh</th><th className="r">Total a cobrar</th><th>Situação</th><th></th></tr></thead>
            <tbody>{calcs.map(({ l, c }) => {
              async function tog() { 'use server'; await alternarPagoLeitura(l.id); }
              async function del() { 'use server'; await excluirLeitura(l.id); }
              return (
                <tr key={l.id}>
                  <td className="num">{data(l.data_anterior).slice(0, 5)} a {data(l.data_atual)}{l.obs && <span className="sm">{l.obs}</span>}</td>
                  <td className="r num">{numero(l.leitura_anterior)}</td>
                  <td className="r num">{numero(l.leitura_atual)}</td>
                  <td className={'r num ' + (c.inconsistente ? 'neg' : '')}>{numero(c.consumo)} kWh</td>
                  <td className="r num">{numero(c.excedente)} kWh</td>
                  <td className="r num">R$ {Number(l.valor_kwh).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                  <td className="r num" style={{ fontWeight: 500 }}>{brl(c.total)}</td>
                  <td><ActionButton action={tog} classe={'tag ' + (l.pago_em ? 'ok' : c.total > 0 ? 'warn' : 'mute')} title="Clique para alternar">{l.pago_em ? `Pago ${data(l.pago_em).slice(0, 5)}` : c.total > 0 ? 'A receber' : 'Nada a cobrar'}</ActionButton></td>
                  <td className="r"><Modal titulo="Editar leitura" botao="Editar" classe="btn sm" action={salvarLeitura} extraFoot={<ConfirmButton action={del} />}><LeituraCampos l={l} unidade={u} /></Modal></td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <p className="small">Nenhuma leitura ainda. Use “+ Lançar leitura”.</p>}
      </section>

      <section className="card pad">
        <div className="card-head"><h2>Dados da kitnet e do contrato</h2></div>
        <SaveForm action={salvarUnidade}><UnidadeCampos u={u} grupos={grupos} /></SaveForm>
        <div className="form-foot" style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <span className="small">Excluir apaga a kitnet e todas as leituras dela.</span>
          <ConfirmButton action={excluir}>Excluir kitnet</ConfirmButton>
        </div>
      </section>
    </>
  );
}
