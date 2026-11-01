import { q } from '@/lib/db';
import { brl, data } from '@/lib/format';
import { listasApoio, mesDe } from '@/lib/fin';
import MonthNav from '@/components/MonthNav';
import Modal from '@/components/Modal';
import FinCampos from '@/components/FinCampos';
import LancTabela, { Totais } from '@/components/LancTabela';
import { salvarLancamento } from '../actions';

const ST = { emitida: ['Emitida', ''], enviada: ['Enviada', 'ok'], cancelada: ['Cancelada', 'bad'] };

export default async function Notas({ searchParams }) {
  const { ym } = await mesDe(searchParams);
  const [rows, apoio] = await Promise.all([
    q(`SELECT n.*, c.nome AS cliente, p.nome AS projeto FROM notas_fiscais n
       LEFT JOIN clientes c ON c.id = n.cliente_id LEFT JOIN projetos p ON p.id = n.projeto_id
       WHERE n.emissao BETWEEN $1 AND $2 ORDER BY n.emissao, n.id`, [ym + '-01', ym + '-31']),
    listasApoio(),
  ]);
  const validas = rows.filter((r) => r.status !== 'cancelada');
  return (
    <>
      <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <MonthNav ym={ym} base="/financeiro/notas-fiscais" />
        <Modal titulo="Registrar nota fiscal" botao="+ Registrar nota" classe="btn primary" action={salvarLancamento.bind(null, 'notas_fiscais')}><FinCampos tipo="notas_fiscais" {...apoio} /></Modal>
      </div>
      <Totais itens={[['Total em notas no mês', validas.reduce((t, r) => t + Number(r.valor), 0)]]} />
      <p className="small" style={{ marginTop: -6 }}>Registre aqui as notas que você emite na prefeitura, com o link do PDF, para ter tudo em um lugar só na hora de falar com a contabilidade.</p>
      <LancTabela tipo="notas_fiscais" titulo="nota fiscal" rows={rows} apoio={apoio}
        vazio="Nenhuma nota registrada neste mês."
        colunas={[
          { h: 'Emissão', r: (r) => data(r.emissao), cls: 'num' },
          { h: 'Número', r: (r) => r.numero || '—', cls: 'num' },
          { h: 'Cliente', r: (r) => <>{r.cliente || '—'}{r.projeto && <span className="sm">{r.projeto}</span>}</> },
          { h: 'Situação', r: (r) => <span className={'tag ' + (ST[r.status]?.[1] || '')}>{ST[r.status]?.[0] || r.status}</span> },
          { h: 'Arquivo', r: (r) => (r.link ? <a href={r.link} target="_blank" rel="noreferrer">Abrir</a> : '—') },
          { h: 'Valor', r: (r) => brl(r.valor), cls: 'r num' },
        ]} />
    </>
  );
}
