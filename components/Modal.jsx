'use client';
import { useRef, useState, useTransition } from 'react';

/**
 * Botão que abre uma janela com formulário.
 * `action` é uma server action que recebe FormData e pode devolver { erro }.
 */
export default function Modal({ titulo, botao, classe = 'btn', children, action, enviar = 'Salvar', extraFoot }) {
  const ref = useRef(null);
  const [erro, setErro] = useState('');
  const [pending, start] = useTransition();
  const [key, setKey] = useState(0);
  function abrir() { setErro(''); setKey((k) => k + 1); ref.current?.showModal(); }
  function fechar() { ref.current?.close(); }
  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await action(fd);
      if (r && r.erro) setErro(r.erro);
      else fechar();
    });
  }
  return (
    <>
      <button type="button" className={classe} onClick={abrir}>{botao}</button>
      <dialog ref={ref} className="modal" onClick={(e) => { if (e.target === ref.current) fechar(); }}>
        <form className="mbody" onSubmit={onSubmit} key={key}>
          <div className="mhead"><h2>{titulo}</h2><button type="button" className="x" onClick={fechar} aria-label="Fechar">×</button></div>
          {children}
          {erro && <p className="err" role="alert">{erro}</p>}
          <div className="form-foot">
            {extraFoot}
            <div className="r">
              <button type="button" className="btn" onClick={fechar}>Cancelar</button>
              <button type="submit" className="btn primary" disabled={pending}>{pending ? 'Salvando…' : enviar}</button>
            </div>
          </div>
        </form>
      </dialog>
    </>
  );
}
