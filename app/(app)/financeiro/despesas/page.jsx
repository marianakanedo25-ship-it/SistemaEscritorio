import { q } from '@/lib/db';
import { brl, data } from '@/lib/format';
import { listasApoio, mesDe } from '@/lib/fin';
import MonthNav from '@/components/MonthNav';
import Modal from '@/components/Modal';
import FinCampos from '@/components/FinCampos';
import LancTabela, { Totais } from '@/components/LancTabela';
import { salvarLancamento } from '../actions';

export default async function Despesas({ searchParams }) {
  const { ym } = await mesDe(searchParams);
  const [rows, apoio] = await Promise.all([
    q(`SELECT d.*, p.nome AS projeto FROM despesas d LEFT JOIN projetos p ON p.id = d.projeto_id
       WHERE d.vencimento BETWEEN $1 AND $2 ORDER BY d.vencimento, d.id`, [ym + '-01', ym + '-31']),
    listasApoio(),
  ]);
  const soma = (f) => rows.filter(f).reduce((t, r) => t + Number(r.valor), 0);
  return (
    <>
      <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <MonthNav ym={ym} base="/financeiro/despesas" />
        <Modal titulo="Nova despesa" botao="+ Nova despesa" classe="btn primary" action={salvarLancamento.bind(null, 'despesas')}><FinCampos tipo="despesas" {...apoio} /></Modal>
      </div>
      <Totais itens={[['Total do mês', soma(() => true)], ['Pago', soma((r) => r.pago_em), 'neg'], ['A pagar', soma((r) => !r.pago_em), 'wrn']]} />
      <LancTabela tipo="despesas" titulo="despesa" rows={rows} apoio={apoio} pagavel rotPago="Pago"
        vazio="Lance aqui as contas do escritório. Para contas fixas como aluguel, use “Repetir todo mês”."
        colunas={[
          { h: 'Vencimento', r: (r) => data(r.vencimento), cls: 'num' },
          { h: 'Descrição', r: (r) => <><strong style={{ fontWeight: 500 }}>{r.descricao}</strong><span className="sm">{[r.fornecedor, r.projeto].filter(Boolean).join(' · ')}</span></> },
          { h: 'Categoria', r: (r) => r.categoria || '—' },
          { h: 'Pago em', r: (r) => (r.pago_em ? data(r.pago_em) : '—'), cls: 'num' },
          { h: 'Valor', r: (r) => brl(r.valor), cls: 'r num' },
        ]} />
    </>
  );
}
