import Link from 'next/link';
import { q } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { data } from '@/lib/format';
import Modal from '@/components/Modal';
import Search from '@/components/Search';
import ClienteCampos from '@/components/ClienteCampos';
import { salvarCliente } from './actions';

export const metadata = { title: 'Clientes' };

export default async function ClientesPage({ searchParams }) {
  await exigir('clientes');
  const sp = await searchParams;
  const busca = String(sp?.q || '').trim();
  const params = [];
  let where = '';
  if (busca) {
    params.push('%' + busca.toLowerCase() + '%');
    params.push('%' + busca.replace(/\D/g, '') + '%');
    where = `WHERE lower(c.nome) LIKE $1 OR lower(coalesce(c.email,'')) LIKE $1 OR lower(coalesce(c.cidade,'')) LIKE $1
      OR (length($2) > 2 AND (regexp_replace(coalesce(c.telefone,''),'\\D','','g') LIKE $2 OR regexp_replace(coalesce(c.documento,''),'\\D','','g') LIKE $2))`;
  }
  const clientes = await q(
    `SELECT c.id, c.nome, c.telefone, c.email, c.documento, c.cidade, c.origem,
       (SELECT count(*)::int FROM projetos p WHERE p.cliente_id = c.id) AS n_proj,
       (SELECT p.nome FROM projetos p WHERE p.cliente_id = c.id ORDER BY p.criado_em DESC LIMIT 1) AS ult_proj,
       (SELECT p.inicio FROM projetos p WHERE p.cliente_id = c.id ORDER BY p.criado_em DESC LIMIT 1) AS ult_inicio
     FROM clientes c ${where} ORDER BY lower(c.nome)`,
    params
  );
  const incompleto = (c) => !c.telefone || !c.email || !c.documento;
  return (
    <>
      <div className="page-head">
        <h1>Clientes</h1>
        <div className="actions">
          <Modal titulo="Cadastro rápido" botao="Cadastro rápido" action={salvarCliente} enviar="Cadastrar">
            <ClienteCampos rapido />
            <p className="small" style={{ margin: 0 }}>Você completa o restante do cadastro depois. O cliente fica marcado como “cadastro incompleto”.</p>
          </Modal>
          <Modal titulo="Novo cliente" botao="+ Novo cliente" classe="btn primary" action={salvarCliente} enviar="Cadastrar">
            <ClienteCampos />
          </Modal>
        </div>
      </div>
      <Search placeholder="Nome, telefone, CPF/CNPJ, e-mail ou cidade" />
      {clientes.length ? (
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Cidade</th><th>Projetos</th><th>Último projeto</th></tr></thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link className="row-link" href={`/clientes/${c.id}`}>{c.nome}</Link>{' '}
                    {incompleto(c) && <span className="tag inc">cadastro incompleto</span>}
                  </td>
                  <td className="num">{c.telefone || <span className="small">—</span>}</td>
                  <td>{c.email || <span className="small">—</span>}</td>
                  <td>{c.cidade || <span className="small">—</span>}</td>
                  <td className="num">{c.n_proj}</td>
                  <td>{c.ult_proj ? <>{c.ult_proj}{c.ult_inicio && <span className="sm">desde {data(c.ult_inicio)}</span>}</> : <span className="small">Nenhum</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <strong>{busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</strong>
          {busca ? 'Tente buscar por outro nome, telefone ou documento.' : 'Use “+ Novo cliente” para cadastrar o primeiro. Depois você liga projetos, contratos e cobranças a ele.'}
        </div>
      )}
    </>
  );
}
