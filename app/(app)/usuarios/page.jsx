import { q } from '@/lib/db';
import { exigir, ABAS } from '@/lib/auth';
import Modal from '@/components/Modal';
import ConfirmButton from '@/components/ConfirmButton';
import UsuarioCampos from '@/components/UsuarioCampos';
import { salvarUsuario, excluirUsuario } from './actions';

export const metadata = { title: 'Usuários' };

export default async function UsuariosPage() {
  const eu = await exigir('usuarios');
  const usuarios = await q('SELECT id, nome, email, cargo, papel, abas, ativo FROM usuarios ORDER BY papel, lower(nome)');
  const abas = ABAS.map(({ id, nome }) => ({ id, nome }));
  const nomeAba = Object.fromEntries(abas.map((a) => [a.id, a.nome]));
  return (
    <>
      <div className="page-head">
        <div><h1>Usuários</h1><p className="sub">Quem pode entrar no sistema e o que cada pessoa enxerga.</p></div>
        <Modal titulo="Novo usuário" botao="+ Novo usuário" classe="btn primary" action={salvarUsuario} enviar="Cadastrar">
          <UsuarioCampos abas={abas} />
        </Modal>
      </div>
      <div className="card table-wrap">
        <table className="tbl">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Acesso</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {usuarios.map((u) => {
              async function del() { 'use server'; await excluirUsuario(u.id); }
              return (
                <tr key={u.id}>
                  <td><strong style={{ fontWeight: 500 }}>{u.nome}</strong>{u.id === eu.id && <span className="small"> (você)</span>}<span className="sm">{u.cargo || ''}</span></td>
                  <td>{u.email}</td>
                  <td>{u.papel === 'admin' ? <span className="tag">Administradora · acesso total</span>
                    : <span className="small" style={{ color: 'var(--ink)' }}>{u.abas?.length ? u.abas.map((a) => nomeAba[a]).filter(Boolean).join(', ') : 'Nenhuma aba liberada'}</span>}</td>
                  <td><span className={'tag ' + (u.ativo ? 'ok' : 'mute')}>{u.ativo ? 'Ativo' : 'Desativado'}</span></td>
                  <td className="r" style={{ whiteSpace: 'nowrap' }}>
                    <Modal titulo="Editar usuário" botao="Editar" classe="btn sm" action={salvarUsuario}
                      extraFoot={u.id !== eu.id ? <ConfirmButton action={del} /> : null}>
                      <UsuarioCampos u={u} abas={abas} souEu={u.id === eu.id} />
                    </Modal>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small" style={{ marginTop: 14 }}>Dica: para a equipe, libere Projetos e Agenda e deixe Financeiro, Calculadora e Usuários só para você.</p>
    </>
  );
}
