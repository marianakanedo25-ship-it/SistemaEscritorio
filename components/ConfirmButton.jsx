'use client';
import { useState, useTransition } from 'react';

/** Botão que pede um segundo clique antes de executar a ação. */
export default function ConfirmButton({ action, children = 'Excluir', confirmar = 'Clique de novo para confirmar', classe = 'btn danger sm' }) {
  const [armado, setArmado] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={classe}
      disabled={pending}
      onClick={() => {
        if (!armado) { setArmado(true); setTimeout(() => setArmado(false), 4000); return; }
        start(async () => { await action(); });
      }}
    >
      {pending ? 'Aguarde…' : armado ? confirmar : children}
    </button>
  );
}
