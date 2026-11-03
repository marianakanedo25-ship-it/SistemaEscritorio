import Link from 'next/link';
import { q } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { brl, data, numero, nomeMes, ymValido, mesAtual } from '@/lib/format';
import { calcLeitura, nomeUnidade, situacaoContrato } from '@/lib/kitnets';
import MonthNav from '@/components/MonthNav';
import Modal from '@/components/Modal';
import ActionButton from '@/components/ActionButton';
import { UnidadeCampos, LeituraCampos } from '@/components/KitCampos';
import { importarKitnets, salvarUnidade, salvarLeitura, alternarPagoLeitura } from './actions';

export const metadata = { title: 'Kitnets' };

export default async function KitnetsPage({ searchParams }) {
  await exigir('kitnets');
  const sp = await searchParams;
  const ym = ymValido(sp?.m) || mesAtual();
  const [unidades, doMes, ultimas] = await Promise.all([
    q('SELECT * FROM kit_unidades ORDER BY grupo DESC, numero'),
    q('SELECT * FROM kit_leituras WHERE data_atual BETWEEN $1 AND $2 ORDER BY data_atual', [ym + '-01', ym + '-31']),
    q('SELECT DISTINCT ON (unidade_id) unidade_id, data_atual, leitura_atual FROM kit_leituras ORDER BY unidade_id, data_atual DESC, id DESC'),
  ]);

  if (!unidades.length) {
    return (
      <>
        <div className="page-head"><div><h1>Kitnets</h1><p className="sub">Contratos, aluguéis e controle de energia das kitnets. Estes valores não entram no financeiro do escritório.</p></div></div>
        <div className="empty" style={{ textAlign: 'left' }}>
          <strong>Nenhuma kitnet cadastrada</strong>
          <p style={{ margin: '6px 0 14px' }}>Já li os contratos e as planilhas de energia das pastas do seu Drive: 5 kitnets em Nossa Senhora de Fátima e 3 no Centro, com inquilino, aluguel, vencimento, vigência e as leituras de energia.</p>
          <div className="actions">
            <ActionButton action={importarKitnets} classe="btn primary">Importar dados do Drive</ActionButton>
            <Modal titulo="Nova kitnet" botao="Cadastrar manualmente" action={salvarUnidade} enviar="Cadastrar"><UnidadeCampos /></Modal>
          </div>
        </div>
      </>
    );
  }

  const ultimaDe = Object.fromEntries(ultimas.map((r) => [r.unidade_id, r]));
  const leituraDe = {};
  for (const l of doMes) leituraDe[l.unidade_id] = l; // a última do mês prevalece
  const grupos = [...new Set(unidades.map((u) => u.grupo))];
  const totalAluguel = unidades.reduce((s, u) => s + Number(u.aluguel), 0);
  const energiaMes = Object.values(leituraDe).reduce((s, l) => s + calcLeitura(l).total, 0);
  const alerta = unidades.filter((u) => ['bad', 'warn'].includes(situacaoContrato(u).tom));
  const semLeitura = unidades.filter((u) => !leituraDe[u.id]).length;

  return (
    <>
      <div className="page-head">
        <div><h1>Kitnets</h1><p className="sub">Contratos, aluguéis e energia. Separado do financeiro do escritório.</p></div>
        <Modal titulo="Nova kitnet" botao="+ Nova kitnet" classe="btn primary" action={salvarUnidade} enviar="Cadastrar"><UnidadeCampos grupos={grupos} /></Modal>
      </div>

      <div className="stats">
        <div className="card stat"><span className="lbl">Unidades</span><span className="val">{unidades.length}</span><span className="hint">{grupos.map((g) => `${unidades.filter((u) => u.grupo === g).length} em ${g}`).join(' · ')}</span></div>
        <div className="card stat"><span className="lbl">Aluguéis por mês</span><span className="val">{brl(totalAluguel)}</span><span className="hint">Soma dos contratos</span></div>
        <div className="card stat"><span className="lbl">Energia a cobrar</span><span className="val wrn">{brl(energiaMes)}</span><span className="hint">Leituras de {nomeMes(ym).toLowerCase()}</span></div>
        <div className="card stat"><span className="lbl">Contratos</span><span className={'val ' + (alerta.length ? 'neg' : '')}>{alerta.length ? alerta.length + ' atenção' : 'Em dia'}</span><span className="hint">{alerta.length ? alerta.map((u) => `${nomeUnidade(u)} (${u.grupo})`).join(', ') : 'Nenhum vencido ou vencendo em 60 dias'}</span></div>
      </div>

      <h2 style={{ margin: '8px 0 12px' }}>Unidades e contratos</h2>
      <div className="card table-wrap" style={{ marginBottom: 28 }}>
        <table className="tbl">
          <thead><tr><th>Unidade</th><th>Inquilino</th><th className="r">Aluguel</th><th>Vencimento</th><th>Início</th><th>Fim do contrato</th><th></th></tr></thead>
          <tbody>
            {grupos.map((g) => [
              <tr key={'g' + g}><td colSpan={7} style={{ background: 'var(--surface-2)', fontWeight: 500, fontSize: 13.5, letterSpacing: '.04em' }}>{g.toUpperCase()}</td></tr>,
              ...unidades.filter((u) => u.grupo === g).map((u) => {
                const sc = situacaoContrato(u);
                return (
                  <tr key={u.id}>
                    <td><Link className="row-link" href={`/kitnets/${u.id}`}>{nomeUnidade(u)}</Link></td>
                    <td>{u.inquilino || <span className="small">Vaga</span>}</td>
                    <td className="r num">{brl(u.aluguel)}</td>
                    <td className="num">{u.vencimento_dia ? `Dia ${String(u.vencimento_dia).padStart(2, '0')}` : '—'}</td>
                    <td className="num">{data(u.inicio)}</td>
                    <td><span className={'tag ' + sc.tom}>{sc.texto}</span></td>
                    <td className="r"><Link className="btn sm" href={`/kitnets/${u.id}`}>Abrir</Link></td>
                  </tr>
                );
              }),
            ])}
          </tbody>
        </table>
      </div>

      <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div><h2>Controle de energia</h2><p className="sub" style={{ marginTop: 2 }}>Leituras feitas em {nomeMes(ym).toLowerCase()}. Cobra-se só o que passar da energia inclusa no aluguel.</p></div>
        <MonthNav ym={ym} base="/kitnets" />
      </div>
      {semLeitura > 0 && <p className="small" style={{ marginTop: 0 }}>{semLeitura} unidade{semLeitura > 1 ? 's' : ''} sem leitura neste mês. Use “Lançar leitura” na linha.</p>}
      <div className="card table-wrap">
        <table className="tbl" style={{ minWidth: 1060 }}>
          <thead><tr>
            <th>Unidade</th><th className="r">Leitura anterior</th><th className="r">Leitura atual</th><th className="r">kWh consumido</th>
            <th className="r">Valor do kWh</th><th className="r">Energia a cobrar</th><th className="r">Aluguel</th><th className="r">Total do mês</th><th>Situação</th><th></th>
          </tr></thead>
          <tbody>
            {unidades.map((u) => {
              const l = leituraDe[u.id];
              const ult = ultimaDe[u.id];
              const sug = ult ? { data_anterior: ult.data_atual, leitura_anterior: ult.leitura_atual } : {};
              if (!l) return (
                <tr key={u.id}>
                  <td><strong style={{ fontWeight: 500 }}>{nomeUnidade(u)}</strong><span className="sm">{u.grupo}</span></td>
                  <td colSpan={7} className="small">Sem leitura em {nomeMes(ym).toLowerCase()}{ult ? ` · última: ${numero(ult.leitura_atual)} kWh em ${data(ult.data_atual)}` : ''}</td>
                  <td></td>
                  <td className="r"><Modal titulo={`Leitura · ${nomeUnidade(u)} ${u.grupo}`} botao="Lançar leitura" classe="btn sm primary" action={salvarLeitura}><LeituraCampos unidade={u} sugestao={sug} /></Modal></td>
                </tr>
              );
              const c = calcLeitura(l);
              async function tog() { 'use server'; await alternarPagoLeitura(l.id); }
              return (
                <tr key={u.id}>
                  <td><strong style={{ fontWeight: 500 }}>{nomeUnidade(u)}</strong><span className="sm">{u.grupo}{u.inquilino ? ' · ' + u.inquilino.split(' ')[0] : ''}</span></td>
                  <td className="r num">{numero(l.leitura_anterior)}<span className="sm">{data(l.data_anterior)}</span></td>
                  <td className="r num">{numero(l.leitura_atual)}<span className="sm">{data(l.data_atual)}</span></td>
                  <td className={'r num ' + (c.inconsistente ? 'neg' : '')}>{numero(c.consumo)} kWh{c.inconsistente ? <span className="sm neg">conferir leitura</span> : <span className="sm">{c.excedente > 0 ? `${numero(c.excedente)} acima de ${numero(c.franquia, 0)}` : `dentro dos ${numero(c.franquia, 0)}`}</span>}</td>
                  <td className="r num">R$ {Number(l.valor_kwh).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                  <td className="r num" style={{ fontWeight: 500 }}>{brl(c.total)}</td>
                  <td className="r num">{brl(u.aluguel)}</td>
                  <td className="r num" style={{ fontWeight: 600 }}>{brl(Number(u.aluguel) + c.total)}</td>
                  <td><ActionButton action={tog} classe={'tag ' + (l.pago_em ? 'ok' : 'warn')} title="Clique para alternar">{l.pago_em ? `Pago ${data(l.pago_em).slice(0, 5)}` : 'A receber'}</ActionButton></td>
                  <td className="r"><Modal titulo={`Editar leitura · ${nomeUnidade(u)} ${u.grupo}`} botao="Editar" classe="btn sm" action={salvarLeitura}><LeituraCampos l={l} unidade={u} /></Modal></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ fontWeight: 500 }}>Total do mês</td>
              <td className="r num" style={{ fontWeight: 600 }}>{brl(energiaMes)}</td>
              <td className="r num" style={{ fontWeight: 600 }}>{brl(totalAluguel)}</td>
              <td className="r num" style={{ fontWeight: 600 }}>{brl(totalAluguel + energiaMes)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
