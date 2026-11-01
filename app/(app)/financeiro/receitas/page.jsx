import { q } from '@/lib/db';
import { brl, data, hoje } from '@/lib/format';
import { listasApoio, mesDe } from '@/lib/fin';
import MonthNav from '@/components/MonthNav';
import Modal from '@/components/Modal';
import FinCampos from '@/components/FinCampos';
import LancTabela, { Totais } from '@/components/LancTabela';
import { salvarLancamento } from '../actions';

const FILTROS = [['todos', 'Todas'], ['pendente', 'A receber'], ['pago', 'Recebidas'], ['atrasado', 'Atrasadas']];

export default async function Receitas({ searchParams }) {
  const { sp, ym } = await mesDe(searchParams);
  const s = FILTROS.some(([k]) => k === sp.s) ? sp.s : 'todos';
  const hj = hoje();
  let where = 'r.vencimento BETWEEN $1 AND $2', params = [ym + '-01', ym + '-31'];
  if (s === 'atrasado') { where = 'r.pago_em IS NULL AND r.vencimento < $1'; params = [hj]; }
  else if (s === 'pendente') where += ' AND r.pago_em IS NULL';
  else if (s === 'pago') where += ' AND r.pago_em IS NOT NULL';
  const [rows, apoio] = await Promise.all([
    q(`SELECT r.*, c.nome AS cliente, p.nome AS projeto FROM receitas r
       LEFT JOIN clientes c ON c.id = r.cliente_id LEFT JOIN projetos p ON p.id = r.projeto_id
       WHERE ${where} ORDER BY r.vencimento, r.id`, params),
    listasApoio(),
  ]);
  const soma = (f) => rows.filter(f).reduce((t, r) => t + Number(r.valor), 0);
  return (
    <>
      <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        {s === 'atrasado' ? <strong>Todas as cobranças atrasadas</strong> : <MonthNav ym={ym} base="/financeiro/receitas" extra={s !== 'todos' ? `&s=${s}` : ''} />}
        <Modal titulo="Nova cobrança" botao="+ Nova cobrança" classe="btn primary" action={salvarLancamento.bind(null, 'receitas')}><FinCampos tipo="receitas" {...apoio} /></Modal>
      </div>
      <div className="chips">{FILTROS.map(([k, l]) => <a key={k} className={'chip' + (s === k ? ' on' : '')} href={`/financeiro/receitas?m=${ym}${k !== 'todos' ? '&s=' + k : ''}`}>{l}</a>)}</div>
      <Totais itens={[['Total', soma(() => true)], ['Recebido', soma((r) => r.pago_em), 'pos'], ['Em aberto', soma((r) => !r.pago_em), 'wrn']]} />
      <LancTabela tipo="receitas" titulo="cobrança" rows={rows} apoio={apoio} pagavel rotPago="Recebido" recibo
        vazio="Cadastre as parcelas dos seus projetos aqui ou pela página do projeto (botão “Gerar parcelas”)."
        colunas={[
          { h: 'Vencimento', r: (r) => data(r.vencimento), cls: 'num' },
          { h: 'Cliente / descrição', r: (r) => <><strong style={{ fontWeight: 500 }}>{r.cliente || 'Sem cliente'}</strong><span className="sm">{r.descricao}{r.projeto ? ' · ' + r.projeto : ''}</span></> },
          { h: 'Forma', r: (r) => r.forma || '—' },
          { h: 'Recebido em', r: (r) => (r.pago_em ? data(r.pago_em) : '—'), cls: 'num' },
          { h: 'Valor', r: (r) => brl(r.valor), cls: 'r num' },
        ]} />
    </>
  );
}
