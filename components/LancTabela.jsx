import Link from 'next/link';
import { brl, situacao } from '@/lib/format';
import Modal from './Modal';
import ConfirmButton from './ConfirmButton';
import ActionButton from './ActionButton';
import FinCampos from './FinCampos';
import { salvarLancamento, excluirLancamento, alternarPago } from '@/app/(app)/financeiro/actions';

/**
 * Tabela de lançamentos com edição, exclusão e marcação de pago.
 * colunas: [{ h: 'Título', r: (linha) => conteúdo, cls }]
 */
export default function LancTabela({ tipo, rows, colunas, apoio, pagavel, rotPago = 'Pago', recibo, vazio, titulo }) {
  const salvar = salvarLancamento.bind(null, tipo);
  if (!rows.length) return <div className="empty"><strong>Nada por aqui</strong>{vazio}</div>;
  return (
    <div className="card table-wrap">
      <table className="tbl">
        <thead><tr>{colunas.map((c) => <th key={c.h} className={c.cls}>{c.h}</th>)}{pagavel && <th>Situação</th>}<th></th></tr></thead>
        <tbody>
          {rows.map((l) => {
            async function del() { 'use server'; await excluirLancamento(tipo, l.id); }
            async function tog() { 'use server'; await alternarPago(tipo, l.id); }
            const s = pagavel ? situacao({ pago_em: l.pago_em, vencimento: l.vencimento || l.data }) : null;
            return (
              <tr key={l.id}>
                {colunas.map((c) => <td key={c.h} className={c.cls}>{c.r(l)}</td>)}
                {pagavel && (
                  <td><ActionButton action={tog} title="Clique para alternar" classe={'tag ' + (s === 'pago' ? 'ok' : s === 'atrasado' ? 'bad' : 'warn')}>
                    {s === 'pago' ? rotPago : s === 'atrasado' ? 'Atrasado' : 'Pendente'}
                  </ActionButton></td>
                )}
                <td className="r" style={{ whiteSpace: 'nowrap' }}>
                  {recibo && l.pago_em && <><Link className="btn sm" href={`/financeiro/recibo/${l.id}`}>Recibo</Link>{' '}</>}
                  <Modal titulo={'Editar ' + titulo} botao="Editar" classe="btn sm" action={salvar} extraFoot={<ConfirmButton action={del} />}>
                    <FinCampos tipo={tipo} l={l} {...apoio} />
                  </Modal>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot />
      </table>
    </div>
  );
}

export function Totais({ itens }) {
  return (
    <div className="actions" style={{ gap: '8px 24px', margin: '0 0 14px' }}>
      {itens.map(([rot, v, cls]) => <span key={rot} className="small">{rot}: <strong className={'num ' + (cls || '')} style={{ fontWeight: 600 }}>{brl(v)}</strong></span>)}
    </div>
  );
}
