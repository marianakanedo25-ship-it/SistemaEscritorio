import { q } from '@/lib/db';
import { brl, data } from '@/lib/format';
import { listasApoio, mesDe } from '@/lib/fin';
import MonthNav from '@/components/MonthNav';
import Modal from '@/components/Modal';
import FinCampos from '@/components/FinCampos';
import LancTabela, { Totais } from '@/components/LancTabela';
import { salvarLancamento } from '../actions';

const ST = { orcado: ['Orçado', 'mute'], pedido: ['Pedido feito', 'warn'], entregue: ['Entregue', 'ok'], cancelado: ['Cancelado', 'bad'] };

export default async function Compras({ searchParams }) {
  const { ym } = await mesDe(searchParams);
  const [rows, apoio] = await Promise.all([
    q(`SELECT c.*, p.nome AS projeto FROM compras c LEFT JOIN projetos p ON p.id = c.projeto_id
       WHERE c.data BETWEEN $1 AND $2 ORDER BY c.data, c.id`, [ym + '-01', ym + '-31']),
    listasApoio(),
  ]);
  const ativas = rows.filter((r) => r.status !== 'cancelado');
  const soma = (f) => ativas.filter(f).reduce((t, r) => t + Number(r.valor), 0);
  return (
    <>
      <p className="sub" style={{ marginTop: -8, marginBottom: 16 }}>Compras do escritório e de materiais para projetos. Quando marcadas como pagas, entram no “Saiu” do resumo.</p>
      <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <MonthNav ym={ym} base="/financeiro/compras" />
        <Modal titulo="Nova compra" botao="+ Nova compra" classe="btn primary" action={salvarLancamento.bind(null, 'compras')}><FinCampos tipo="compras" {...apoio} /></Modal>
      </div>
      <Totais itens={[['Total do mês', soma(() => true)], ['Pago', soma((r) => r.pago_em), 'neg'], ['A pagar', soma((r) => !r.pago_em), 'wrn']]} />
      <LancTabela tipo="compras" titulo="compra" rows={rows} apoio={apoio} pagavel rotPago="Pago"
        vazio="Nenhuma compra registrada neste mês."
        colunas={[
          { h: 'Data', r: (r) => data(r.data), cls: 'num' },
          { h: 'Compra', r: (r) => <><strong style={{ fontWeight: 500 }}>{r.descricao}</strong><span className="sm">{[r.fornecedor, r.projeto || 'Escritório'].filter(Boolean).join(' · ')}</span></> },
          { h: 'Pedido', r: (r) => <span className={'tag ' + (ST[r.status]?.[1] || 'mute')}>{ST[r.status]?.[0] || r.status}</span> },
          { h: 'Valor', r: (r) => brl(r.valor), cls: 'r num' },
        ]} />
    </>
  );
}
