import { redirect } from 'next/navigation';
import { one } from '@/lib/db';
import { usuarioAtual } from '@/lib/auth';
import { entrar } from './actions';
import LoginForm from './LoginForm';

export const metadata = { title: 'Entrar' };

export default async function LoginPage() {
  const total = await one('SELECT count(*)::int AS n FROM usuarios');
  if (total.n === 0) redirect('/setup');
  if (await usuarioAtual()) redirect('/');
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="top"><img src="/logo-branco.png" alt="Mariana Canedo Arquitetura e Interiores" /></div>
        <LoginForm action={entrar} botao="Entrar">
          <div>
            <h2>Gestão do escritório</h2>
            <p className="sub">Entre com o seu e-mail e senha.</p>
          </div>
          <label className="fld"><span>E-mail</span><input id="email" name="email" type="email" autoComplete="email" required /></label>
          <label className="fld"><span>Senha</span><input id="senha" name="senha" type="password" autoComplete="current-password" required /></label>
        </LoginForm>
      </div>
    </main>
  );
}
