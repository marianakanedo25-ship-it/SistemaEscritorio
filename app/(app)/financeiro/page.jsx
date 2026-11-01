import Link from 'next/link';
import { q, one } from '@/lib/db';
import { brl, data, hoje } from '@/lib/format';
import { listasApoio, mesDe } from '@/lib/fin';
import MonthNav from '@/components/MonthNav';
import Modal from '@/components/Modal';
import FinCampos from '@/components/FinCampos';
import { salvarLancamento } from './actions';

function Barras({ itens, cor }) {
  const max = Math.max(...itens.map((i) => Number(i.total)), 1);
  return itens.map((i) => (
    <div className="hbar" key={i.nome}>
      <span>{i.nome}</span><span className="num">{brl(i.total)}</span>
      <div className="track"><i style={{ width: (Number(i.total) / max) * 100 + '%', background: cor }} /></div>
    </div>
  ));
}

export default async function Resumo({ searchParams }) {
  const { ym } = await mesDe(searchParams);
  const ini = ym + '-01', fim = ym + '-31', hj = hoje();
  const [tot, formas, cats, atrasados, apoio] = await Promise.all([
    one(`SELECT
      (SELECT coalesce(sum(valor),0) FROM receitas WHERE pago_em BETWEEN $1 AND $2) AS entrou,
      (SELECT coalesce(sum(valor),0) FROM despesas WHERE pago_em BETWEEN $1 AND $2) AS desp,
      (SELECT coalesce(sum(valor),0) FROM compras WHERE pago_em BETWEEN $1 AND $2) AS comp,
      (SELECT coalesce(sum(valor),0) FROM repasses WHERE pago_em BETWEEN $1 AND $2) AS rep,
      (SELECT coalesce(sum(valor),0) FROM receitas WHERE pago_em IS NULL AND vencimento BETWEEN $1 AND $2) AS receber,
      (SELECT coalesce(sum(valor),0) FROM despesas WHERE pago_em IS NULL AND vencimento BETWEEN $1 AND $2)
       + (SELECT coalesce(sum(valor),0) FROM repasses WHERE pago_em IS NULL AND vencimento BETWEEN $1 AND $2) AS pagar`, [ini, fim]),
    q(`SELECT coalesce(forma,'Não informada') AS nome, sum(valor) AS total FROM receitas WHERE pago_em BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 2 DESC`, [ini, fim]),
    q(`SELECT nome, sum(total) AS total FROM (
         SELECT coalesce(categoria,'Outros') AS nome, valor AS total FROM despesas WHERE pago_em BETWEEN $1 AND $2
         UNION ALL SELECT 'Compras', valor FROM compras WHERE pago_em BETWEEN $1 AND $2
         UNION ALL SELECT 'Repasses a parceiros', valor FROM repasses WHERE pago_em BETWEEN $1 AND $2) x
       GROUP BY nome ORDER BY 2 DESC`, [ini, fim]),
    q(`SELECT r.id, r.descricao, r.valor, r.vencimento, c.nome AS cliente FROM receitas r LEFT JOIN clientes c ON c.id = r.cliente_id
       WHERE r.pago_em IS NULL AND r.vencimento < $1 ORDER BY r.vencimento`, [hj]),
    listasApoio(),
  ]);
  const saiu = Number(tot.desp) + Number(tot.comp) + Number(tot.rep);
  const saldo = Number(tot.entrou) - saiu;
  const totAtr = atrasados.reduce((s, r) => s + Number(r.valor), 0);
  return (
    <>
      <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <MonthNav ym={ym} base="/financeiro" />
        <div className="actions">
          <Modal titulo="Nova cobrança" botao="+ Nova cobrança" classe="btn primary" action={salvarLancamento.bind(null, 'receitas')}><FinCampos tipo="receitas" {...apoio} /></Modal>
          <Modal titulo="Nova despesa" botao="+ Nova despesa" action={salvarLancamento.bind(null, 'despesas')}><FinCampos tipo="despesas" {...apoio} /></Modal>
        </div>
      </div>
      <div className="stats">
        <div className="card stat"><span className="lbl">Entrou</span><span className="val pos">{brl(tot.entrou)}</span><span className="hint">Pagamentos recebidos no mês</span></div>
        <div className="card stat"><span className="lbl">Saiu</span><span className="val neg">{brl(saiu)}</span><span className="hint">Despesas, compras e repasses pagos</span></div>
        <div className="card stat"><span className="lbl">Saldo</span><span className={'val ' + (saldo < 0 ? 'neg' : '')}>{brl(saldo)}</span><span className="hint">Entrou menos saiu</span></div>
        <div className="card stat"><span className="lbl">Falta receber</span><span className="val wrn">{brl(tot.receber)}</span><span className="hint">Cobranças vencendo no mês · a pagar: {brl(tot.pagar)}</span></div>
      </div>
      <div className="grid2" style={{ marginBottom: 20 }}>
        <section className="card pad"><h2 style={{ marginBottom: 10 }}>Recebido por forma de pagamento</h2>
          {formas.length ? <Barras itens={formas} cor="var(--sage)" /> : <p className="small">Nada neste mês.</p>}</section>
        <section className="card pad"><h2 style={{ marginBottom: 10 }}>Despesas por categoria</h2>
          {cats.length ? <Barras itens={cats} cor="var(--sand)" /> : <p className="small">Nada neste mês.</p>}</section>
      </div>
      <section className="card pad">
        <div className="card-head"><h2>Pagamentos atrasados</h2>{atrasados.length > 0 && <span className="neg">{atrasados.length} cobrança{atrasados.length > 1 ? 's' : ''} · {brl(totAtr)}</span>}</div>
        {atrasados.length ? (
          <div className="list">{atrasados.map((r) => (
            <div className="li" key={r.id}><div className="t"><strong>{r.cliente || 'Sem cliente'}</strong> <span className="small" style={{ display: 'inline' }}>· {r.descricao} · venceu em {data(r.vencimento)}</span></div><span className="num neg">{brl(r.valor)}</span></div>
          ))}</div>
        ) : <p className="small">Nenhuma cobrança atrasada.</p>}
        <p style={{ marginBottom: 0 }}><Link href={`/financeiro/receitas?m=${ym}`}>Ver todas as receitas →</Link></p>
      </section>
    </>
  );
}
