import Link from 'next/link';
import { brl, nomeMes, mesAtual, addMes } from '@/lib/format';
import { resumoDosMeses } from '@/lib/pessoal-dados';

export const metadata = { title: 'Financeiro Pessoal · Ano' };

export default async function PessoalAnoPage() {
  const dados = await resumoDosMeses();
  const comLinhas = dados.meses.filter((m) => dados.resumo[m].temLinhas);
  // Mostra do primeiro mês com dados até 12 meses depois do atual (para ver o que já está previsto)
  const ini = comLinhas[0] || mesAtual();
  const fim = [comLinhas[comLinhas.length - 1] || mesAtual(), mesAtual()].sort().pop();
  const meses = [];
  for (let m = ini; m <= fim && meses.length < 36; m = addMes(m, 1)) meses.push(m);
  const linhas = meses.map((m) => ({ m, r: dados.resumo[m] }));
  const soma = (k) => linhas.reduce((s, x) => s + (x.r ? x.r[k] : 0), 0);
  const ult = linhas.filter((x) => x.r).pop();

  return (
    <>
      <div className="stats">
        <div className="card stat"><span className="lbl">Entradas no período</span><span className="val pos">{brl(soma('entradas'))}</span><span className="hint">{meses.length} meses</span></div>
        <div className="card stat"><span className="lbl">Gastos no período</span><span className="val">{brl(soma('gastos'))}</span><span className="hint">contas {brl(soma('contas'))} · cartão {brl(soma('cartao'))}</span></div>
        <div className="card stat"><span className="lbl">Investido no período</span><span className="val">{brl(soma('investimentos'))}</span><span className="hint">transferido para a XP</span></div>
        <div className="card stat"><span className="lbl">Sobra prevista</span><span className={'val ' + ((ult?.r.sobra || 0) < 0 ? 'neg' : 'pos')}>{brl(ult?.r.sobra || 0)}</span><span className="hint">{ult ? `ao fim de ${nomeMes(ult.m).toLowerCase()}` : '—'}</span></div>
      </div>
      <div className="card table-wrap">
        <table className="tbl">
          <thead><tr><th>Mês</th><th className="r">Veio do anterior</th><th className="r">Entradas</th><th className="r">Contas</th><th className="r">Cartão XP</th><th className="r">Investido</th><th className="r">Fora do plano</th><th className="r">Vai sobrar</th><th className="r">Falta pagar</th></tr></thead>
          <tbody>
            {linhas.map(({ m, r }) => (
              <tr key={m}>
                <td><Link className="row-link" href={`/pessoal?m=${m}`}>{nomeMes(m)}</Link></td>
                {r ? (
                  <>
                    <td className="r num">{brl(r.saldoAnterior)}{r.manual && <span className="sm">digitado</span>}</td>
                    <td className="r num pos">{brl(r.entradas)}</td>
                    <td className="r num">{brl(r.contas)}</td>
                    <td className="r num">{brl(r.cartao)}</td>
                    <td className="r num">{brl(r.investimentos)}</td>
                    <td className={'r num ' + (r.extras > 0 ? 'neg' : '')}>{brl(r.extras)}</td>
                    <td className={'r num ' + (r.sobra < 0 ? 'neg' : '')} style={{ fontWeight: 600 }}>{brl(r.sobra)}</td>
                    <td className={'r num ' + (r.aPagar > 0 ? 'wrn' : '')}>{brl(r.aPagar)}</td>
                  </>
                ) : <td colSpan={8} className="small">Sem lançamentos</td>}
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td><strong>Total</strong></td><td></td><td className="r num pos"><strong>{brl(soma('entradas'))}</strong></td><td className="r num"><strong>{brl(soma('contas'))}</strong></td><td className="r num"><strong>{brl(soma('cartao'))}</strong></td><td className="r num"><strong>{brl(soma('investimentos'))}</strong></td><td className="r num"><strong>{brl(soma('extras'))}</strong></td><td></td><td></td></tr></tfoot>
        </table>
      </div>
    </>
  );
}
