'use client';
export default function Erro({ error, reset }) {
  const semBanco = /DATABASE_URL/.test(error?.message || '');
  return (
    <div className="card pad" style={{ maxWidth: 640 }}>
      <h2>Algo deu errado</h2>
      <p className="sub">{semBanco ? 'O endereço do banco de dados não está configurado na Vercel (variável DATABASE_URL).' : 'Não foi possível carregar esta página. Tente de novo; se continuar, anote o horário e o que estava fazendo.'}</p>
      {error?.digest && <p className="small">Código: {error.digest}</p>}
      <button className="btn primary" onClick={() => reset()}>Tentar de novo</button>
    </div>
  );
}
