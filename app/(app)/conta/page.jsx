import { exigir } from '@/lib/auth';
import SaveForm from '@/components/SaveForm';
import { trocarMinhaSenha, salvarMeuNome } from '../usuarios/actions';

export const metadata = { title: 'Minha conta' };

export default async function Conta() {
  const u = await exigir();
  return (
    <>
      <div className="page-head"><div><h1>Minha conta</h1><p className="sub">{u.email}</p></div></div>
      <div className="grid2">
        <section className="card pad">
          <h2 style={{ marginBottom: 14 }}>Meus dados</h2>
          <SaveForm action={salvarMeuNome}>
            <div className="form">
              <label className="fld full"><span>Nome</span><input name="nome" defaultValue={u.nome} required /></label>
              <label className="fld full"><span>Cargo</span><input name="cargo" defaultValue={u.cargo || ''} /></label>
            </div>
          </SaveForm>
        </section>
        <section className="card pad">
          <h2 style={{ marginBottom: 14 }}>Trocar senha</h2>
          <SaveForm action={trocarMinhaSenha} rotulo="Trocar senha">
            <div className="form">
              <label className="fld full"><span>Senha atual</span><input name="atual" type="password" autoComplete="current-password" required /></label>
              <label className="fld"><span>Nova senha</span><input name="nova" type="password" minLength={8} autoComplete="new-password" required /></label>
              <label className="fld"><span>Confirmar nova senha</span><input name="confirmar" type="password" minLength={8} autoComplete="new-password" required /></label>
            </div>
          </SaveForm>
        </section>
      </div>
    </>
  );
}
