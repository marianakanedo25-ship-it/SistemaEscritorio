import FinTabs from '@/components/FinTabs';
import { exigir } from '@/lib/auth';

export const metadata = { title: 'Financeiro' };

export default async function FinLayout({ children }) {
  await exigir('financeiro');
  return (
    <>
      <h1 className="no-print" style={{ marginBottom: 18 }}>Financeiro</h1>
      <FinTabs />
      {children}
    </>
  );
}
