'use client';
import { useTransition } from 'react';

/** Botão simples que chama uma server action sem formulário. */
export default function ActionButton({ action, children, classe = 'btn sm', title }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" className={classe} title={title} disabled={pending} onClick={() => start(async () => { await action(); })}>
      {children}
    </button>
  );
}
