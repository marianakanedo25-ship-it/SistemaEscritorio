import { redirect } from 'next/navigation';
import { one } from '@/lib/db';
import { criarPrimeiraConta } from '../login/actions';
import LoginForm from '../login/LoginForm';

export const metadata = { title: 'Primeiro acesso' };

export default async function SetupPage() {
  const total = await one('SELECT count(*)::int AS n FROM usuarios');
  if (total.n > 0) redirect('/login');
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="top"><img src="/logo-branco.png" alt="Mariana Canedo Arquitetura e Interiores" /></div>
        <LoginForm action={criarPrimeiraConta} botao="Criar minha conta">
          <div>
            <h2>Primeiro acesso</h2>
            <p className="sub">Crie a conta da administradora. Ela terá acesso a todas as abas e poderá cadastrar outros usuários.</p>
          </div>
          <label className="fld"><span>Seu nome</span><input id="nome" name="nome" autoComplete="name" required /></label>
          <label className="fld"><span>E-mail</span><input id="email" name="email" type="email" autoComplete="email" required /></label>
          <label className="fld"><span>Senha (mínimo 8 caracteres)</span><input id="senha" name="senha" type="password" minLength={8} autoComplete="new-password" required /></label>
        </LoginForm>
      </div>
    </main>
  );
}
