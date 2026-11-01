import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-card"><div className="top"><img src="/logo-branco.png" alt="Mariana Canedo" /></div>
        <div style={{ padding: 30 }}><h2>Página não encontrada</h2><p className="sub">O item pode ter sido excluído.</p><p><Link href="/">Voltar ao início</Link></p></div>
      </div>
    </main>
  );
}
