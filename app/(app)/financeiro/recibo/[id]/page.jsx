import Link from 'next/link';
import { notFound } from 'next/navigation';
import { one, getConfig } from '@/lib/db';
import { brl, data, dataExtenso, porExtenso, hoje } from '@/lib/format';
import PrintButton from '@/components/PrintButton';

export const metadata = { title: 'Recibo' };

export default async function Recibo({ params }) {
  const { id } = await params;
  const r = await one(`SELECT r.*, c.nome AS cliente, c.documento AS cli_doc, p.nome AS projeto FROM receitas r
    LEFT JOIN clientes c ON c.id = r.cliente_id LEFT JOIN projetos p ON p.id = r.projeto_id WHERE r.id = $1`, [Number(id) || 0]);
  if (!r) notFound();
  const esc = await getConfig('escritorio', {});
  const nomeEsc = esc.nome || 'Mariana Canedo Arquitetura e Interiores';
  const cidade = esc.cidade ? esc.cidade.split('/')[0] : '';
  return (
    <>
      <div className="actions no-print" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Link href={`/financeiro/receitas?m=${(r.pago_em || r.vencimento).slice(0, 7)}`}>← Receitas</Link>
        <PrintButton />
      </div>
      {!r.pago_em && <div className="notice no-print">Esta cobrança ainda não foi marcada como recebida.</div>}
      <article className="recibo">
        <div className="rtop">
          <img src="/logo-escuro.png" alt={nomeEsc} />
          <div style={{ textAlign: 'right' }}><h1>Recibo</h1><div className="valor">{brl(r.valor)}</div><div className="small">Nº {String(r.id).padStart(5, '0')}</div></div>
        </div>
        <p>
          Recebi de <strong>{r.cliente || '________________________'}</strong>{r.cli_doc ? `, CPF/CNPJ ${r.cli_doc},` : ''} a importância de{' '}
          <strong>{brl(r.valor)}</strong> ({porExtenso(r.valor)}), referente a <strong>{r.descricao}</strong>
          {r.projeto ? <> do projeto <strong>{r.projeto}</strong></> : null}
          {r.forma ? `, pago via ${r.forma.toLowerCase()}` : ''}{r.pago_em ? ` em ${data(r.pago_em)}` : ''}.
        </p>
        <p>Para clareza, firmo o presente recibo, dando plena quitação do valor recebido.</p>
        <p style={{ textAlign: 'right' }}>{cidade ? cidade + ', ' : ''}{dataExtenso(r.pago_em || hoje())}.</p>
        <div className="ass">
          <div className="linha" />
          <strong>{nomeEsc}</strong>
          <div className="small">{[esc.documento && 'CPF/CNPJ ' + esc.documento, esc.cau && 'CAU ' + esc.cau].filter(Boolean).join(' · ')}</div>
          <div className="small">{[esc.endereco, esc.cidade].filter(Boolean).join(' · ')}</div>
          <div className="small">{[esc.telefone, esc.email].filter(Boolean).join(' · ')}</div>
        </div>
      </article>
    </>
  );
}
