import Link from 'next/link';
import { notFound } from 'next/navigation';
import { q, one } from '@/lib/db';
import { exigir, podeVer } from '@/lib/auth';
import { brl, data, situacao, STATUS_PROJETO } from '@/lib/format';
import Modal from '@/components/Modal';
import ConfirmButton from '@/components/ConfirmButton';
import ClienteCampos from '@/components/ClienteCampos';
import ProjetoCampos from '@/components/ProjetoCampos';
import EditarCliente from './EditarCliente';
import { salvarCliente, excluirCliente } from '../actions';
import { salvarProjeto } from '../../projetos/actions';

export default async function ClientePage({ params }) {
  const u = await exigir('clientes');
  const { id } = await params;
  const c = await one('SELECT * FROM clientes WHERE id = $1', [Number(id) || 0]);
  if (!c) notFound();
  const projetos = await q(
    `SELECT p.id, p.nome, p.tipo, p.status, p.cor, p.valor,
      (SELECT count(*)::int FROM etapas e WHERE e.projeto_id = p.id) AS n_et,
      (SELECT count(*)::int FROM etapas e WHERE e.projeto_id = p.id AND e.status = 'concluida') AS n_ok
     FROM projetos p WHERE p.cliente_id = $1 ORDER BY p.criado_em DESC`, [c.id]);
  const verFin = podeVer(u, 'financeiro');
  const receitas = verFin ? await q('SELECT id, descricao, valor, vencimento, pago_em FROM receitas WHERE cliente_id = $1 ORDER BY vencimento', [c.id]) : [];
  const recebido = receitas.filter((r) => r.pago_em).reduce((s, r) => s + Number(r.valor), 0);
  const aReceber = receitas.filter((r) => !r.pago_em).reduce((s, r) => s + Number(r.valor), 0);
  const incompleto = !c.telefone || !c.email || !c.documento;
  async function excluir() { 'use server'; await excluirCliente(c.id); }

  return (
    <>
      <p className="small" style={{ margin: '0 0 8px' }}><Link href="/clientes">← Clientes</Link></p>
      <div className="page-head">
        <div>
          <h1>{c.nome}</h1>
          <p className="sub">
            {[c.telefone, c.email, c.cidade].filter(Boolean).join(' · ') || 'Sem contato cadastrado'}
            {incompleto && <> · <span className="tag inc">cadastro incompleto</span></>}
          </p>
        </div>
        <div className="actions">
          {c.pasta_drive && <a className="btn" href={c.pasta_drive} target="_blank" rel="noreferrer">Abrir pasta no Drive</a>}
          {podeVer(u, 'projetos') && (
            <Modal titulo="Novo projeto" botao="+ Novo projeto" classe="btn primary" action={salvarProjeto} enviar="Criar projeto">
              <ProjetoCampos novo clienteFixo={c.id} />
            </Modal>
          )}
        </div>
      </div>

      <div className="grid-side">
        <div className="stack">
          <section className="card pad">
            <div className="card-head"><h2>Projetos</h2></div>
            {projetos.length ? (
              <div className="list">
                {projetos.map((p) => (
                  <div className="li" key={p.id}>
                    <div className="t" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span className="dot" style={{ background: p.cor }} />
                      <div><Link href={`/projetos/${p.id}`}><strong>{p.nome}</strong></Link>
                        <span className="small">{p.tipo || 'Projeto'} · {p.n_ok} de {p.n_et} etapas concluídas{p.valor ? ' · ' + brl(p.valor) : ''}</span></div>
                    </div>
                    <span className={'tag ' + (p.status === 'concluido' ? 'ok' : p.status === 'pausado' ? 'mute' : '')}>{STATUS_PROJETO[p.status] || p.status}</span>
                  </div>
                ))}
              </div>
            ) : <p className="small">Nenhum projeto para este cliente ainda.</p>}
          </section>

          <section className="card pad">
            <div className="card-head"><h2>Cadastro</h2></div>
            <EditarCliente action={salvarCliente}><ClienteCampos c={c} /></EditarCliente>
          </section>
        </div>

        <div className="stack">
          {verFin && (
            <section className="card pad">
              <div className="card-head"><h2>Financeiro</h2><Link className="small" href="/financeiro/receitas">Ver receitas →</Link></div>
              <div className="kv">
                <div><span>Recebido</span><span className="num pos">{brl(recebido)}</span></div>
                <div><span>A receber</span><span className="num">{brl(aReceber)}</span></div>
              </div>
              {receitas.length > 0 && (
                <div className="list" style={{ marginTop: 10 }}>
                  {receitas.map((r) => {
                    const s = situacao(r);
                    return (
                      <div className="li" key={r.id}>
                        <div className="t"><strong>{r.descricao}</strong><span className="small">vence {data(r.vencimento)}</span></div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="num">{brl(r.valor)}</div>
                          <span className={'tag ' + (s === 'pago' ? 'ok' : s === 'atrasado' ? 'bad' : 'warn')}>{s === 'pago' ? 'Recebido' : s === 'atrasado' ? 'Atrasado' : 'Pendente'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
          {c.obs && <section className="card pad"><h3 style={{ marginBottom: 8 }}>Observações</h3><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.obs}</p></section>}
          <section className="card pad">
            <h3 style={{ marginBottom: 8 }}>Excluir cliente</h3>
            <p className="small" style={{ marginTop: 0 }}>Os projetos e cobranças continuam salvos, só ficam sem cliente vinculado.</p>
            <ConfirmButton action={excluir}>Excluir cliente</ConfirmButton>
          </section>
        </div>
      </div>
    </>
  );
}
