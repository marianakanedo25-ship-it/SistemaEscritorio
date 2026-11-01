import Sidebar from '@/components/Sidebar';
import { exigir, abasDo } from '@/lib/auth';
import { sair } from '../login/actions';

export default async function AppLayout({ children }) {
  const u = await exigir();
  const abas = abasDo(u).map(({ id, nome, href }) => ({ id, nome, href }));
  return (
    <div className="shell">
      <Sidebar usuario={{ nome: u.nome, papel: u.papel, cargo: u.cargo }} abas={abas} sair={sair} />
      <main className="main">{children}</main>
    </div>
  );
}
