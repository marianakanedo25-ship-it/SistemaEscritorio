import { q } from '@/lib/db';
import { brl, data } from '@/lib/format';
import { listasApoio, mesDe } from '@/lib/fin';
import MonthNav from '@/components/MonthNav';
import Modal from '@/components/Modal';
import FinCampos from '@/components/FinCampos';
import LancTabela, { Totais } from '@/components/LancTabela';
import { salvarLancamento } from '../actions';

export default async function Repasses({ searchParams }) {
  const { ym } = await mesDe(searchParams);
  const [rows, apoio] = await Promise.all([
    q(`SELECT r.*, p.nome AS projeto FROM repasses r LEFT JOIN projetos p ON p.id = r.projeto_id
       WHERE r.vencimento BETWEEN $1 AND $2 ORDER BY r.vencimento, r.id`, [ym + '-01', ym + '-31']),
    listasApoio(),
  ]);
  const soma = (f) => rows.filter(f).reduce((t, r) => t + Number(r.valor), 0);
  return (
    <>
      <p className="sub" style={{ marginTop: -8, marginBottom: 16 }}>Pagamentos a parceiros e terceirizados: projetistas complementares, renderização, maquete, marceneiro de projeto…</p>
      <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <MonthNav ym={ym} base="/financeiro/repasses" />
        <Modal titulo="Novo repasse" botao="+ Novo repasse" classe="btn primary" action={salvarLancamento.bind(null, 'repasses')}><FinCampos tipo="repasses" {...apoio} /></Modal>
      </div>
      <Totais itens={[['Total do mês', soma(() => true)], ['Pago', soma((r) => r.pago_em), 'neg'], ['A pagar', soma((r) => !r.pago_em), 'wrn']]} />
      <LancTabela tipo="repasses" titulo="repasse" rows={rows} apoio={apoio} pagavel rotPago="Pago"
        vazio="Nenhum repasse neste mês."
        colunas={[
          { h: 'Vencimento', r: (r) => data(r.vencimento), cls: 'num' },
          { h: 'Parceiro', r: (r) => <><strong style={{ fontWeight: 500 }}>{r.parceiro}</strong><span className="sm">{[r.descricao, r.projeto].filter(Boolean).join(' · ')}</span></> },
          { h: 'Forma', r: (r) => r.forma || '—' },
          { h: 'Pago em', r: (r) => (r.pago_em ? data(r.pago_em) : '—'), cls: 'num' },
          { h: 'Valor', r: (r) => brl(r.valor), cls: 'r num' },
        ]} />
    </>
  );
}
