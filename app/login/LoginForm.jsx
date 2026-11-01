'use client';
import { useActionState } from 'react';

export default function LoginForm({ action, children, botao }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction}>
      {children}
      {state?.erro && <p className="err" role="alert">{state.erro}</p>}
      <button className="btn primary" type="submit" disabled={pending} style={{ padding: '12px 16px' }}>
        {pending ? 'Aguarde…' : botao}
      </button>
    </form>
  );
}
