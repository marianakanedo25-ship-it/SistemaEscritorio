import { Suspense } from 'react';
import { exigir } from '@/lib/auth';
import PessoalTabs from './PessoalTabs';

export default async function PessoalLayout({ children }) {
  await exigir('pessoal');
  return (
    <>
      <div className="page-head no-print">
        <div>
          <h1>Financeiro Pessoal</h1>
          <p className="sub">O que entra, o que sai, o que você investe e o que sobra em cada mês. Separado do financeiro do escritório e só visível para você.</p>
        </div>
      </div>
      <Suspense fallback={null}><PessoalTabs /></Suspense>
      {children}
    </>
  );
}
