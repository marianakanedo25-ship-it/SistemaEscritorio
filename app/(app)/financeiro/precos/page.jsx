import Link from 'next/link';
import { q, getConfig } from '@/lib/db';
import { brl, data } from '@/lib/format';
import { mesDe } from '@/lib/fin';
import MonthNav from '@/components/MonthNav';
import Modal from '@/components/Modal';
import SaveForm from '@/components/SaveForm';
import FinCampos from '@/components/FinCampos';
import LancTabela from '@/components/LancTabela';
import { salvarLancamento, salvarEscritorio } from '../actions';

export default async function Precos({ searchParams }) {
  const { ym } = await mesDe(searchParams);
  const [servicos, pagas, esc] = await Promise.all([
    q('SELECT * FROM servicos ORDER BY nome'),
    q(`SELECT r.id, r.descricao, r.valor, r.pago_em, c.nome AS cliente FROM receitas r LEFT JOIN clientes c ON c.id = r.cliente_id
       WHERE r.pago_em BETWEEN $1 AND $2 ORDER BY r.pago_em DESC`, [ym + '-01', ym + '-31']),
    getConfig('escritorio', {}),
  ]);
  return (
    <div className="stack">
      <section>
        <div className="card-head"><div><h2>Tabela de preços</h2><p className="sub">Valores de referência dos serviços do escritório. Para calcular um orçamento por horas, use a Calculadora de precificação.</p></div>
          <Modal titulo="Novo serviço" botao="+ Serviço" classe="btn primary" action={salvarLancamento.bind(null, 'servicos')}><FinCampos tipo="servicos" /></Modal>
        </div>
        <LancTabela tipo="servicos" titulo="serviço" rows={servicos} apoio={{}}
          vazio="Cadastre seus serviços: projeto de interiores por m², consultoria, acompanhamento de obra por visita…"
          colunas={[
            { h: 'Serviço', r: (s) => <><strong style={{ fontWeight: 500 }}>{s.nome}</strong>{s.descricao && <span className="sm">{s.descricao}</span>}</> },
            { h: 'Cobrado por', r: (s) => s.unidade },
            { h: 'Valor', r: (s) => brl(s.valor) + (s.unidade && s.unidade !== 'projeto' ? ' / ' + s.unidade : ''), cls: 'r num' },
          ]} />
      </section>

      <div className="grid2">
        <section className="card pad">
          <div className="card-head"><h2>Recibos</h2><MonthNav ym={ym} base="/financeiro/precos" /></div>
          <p className="small" style={{ marginTop: 0 }}>Toda cobrança marcada como recebida pode gerar um recibo pronto para imprimir ou salvar em PDF.</p>
          {pagas.length ? (
            <div className="list">{pagas.map((r) => (
              <div className="li" key={r.id}>
                <div className="t"><strong>{r.cliente || 'Sem cliente'}</strong><span className="small">{r.descricao} · recebido em {data(r.pago_em)}</span></div>
                <div className="actions"><span className="num">{brl(r.valor)}</span><Link className="btn sm" href={`/financeiro/recibo/${r.id}`}>Recibo</Link></div>
              </div>
            ))}</div>
          ) : <p className="small">Nenhum recebimento neste mês.</p>}
        </section>

        <section className="card pad">
          <div className="card-head"><h2>Dados do escritório no recibo</h2></div>
          <SaveForm action={salvarEscritorio}>
            <div className="form">
              <label className="fld full"><span>Nome / razão social</span><input name="nome" defaultValue={esc.nome || 'Mariana Canedo Arquitetura e Interiores'} /></label>
              <label className="fld"><span>CPF / CNPJ</span><input name="documento" defaultValue={esc.documento || ''} /></label>
              <label className="fld"><span>Registro no CAU</span><input name="cau" defaultValue={esc.cau || ''} /></label>
              <label className="fld full"><span>Endereço</span><input name="endereco" defaultValue={esc.endereco || ''} /></label>
              <label className="fld"><span>Cidade / UF</span><input name="cidade" defaultValue={esc.cidade || ''} placeholder="Goiânia/GO" /></label>
              <label className="fld"><span>Telefone</span><input name="telefone" defaultValue={esc.telefone || ''} /></label>
              <label className="fld"><span>E-mail</span><input name="email" defaultValue={esc.email || ''} /></label>
              <label className="fld"><span>Chave Pix</span><input name="pix" defaultValue={esc.pix || ''} /></label>
            </div>
          </SaveForm>
        </section>
      </div>
    </div>
  );
}
