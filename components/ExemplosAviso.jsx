import { temExemplos } from '@/lib/exemplos';
import ActionButton from './ActionButton';
import ConfirmButton from './ConfirmButton';
import { acaoCarregarExemplos, acaoApagarExemplos } from '@/app/(app)/dashboard/actions';

/** Aviso para a administradora carregar ou apagar os dados de exemplo. */
export default async function ExemplosAviso({ sempre = false }) {
  const { exemplos, vazio } = await temExemplos();
  if (exemplos) return (
    <div className="notice" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
      <span>Você está vendo dados de exemplo (clientes marcados com “exemplo”). Apague quando for começar a usar de verdade; os seus dados não são afetados.</span>
      <ConfirmButton action={acaoApagarExemplos} classe="btn sm" confirmar="Clique de novo para apagar">Apagar exemplos</ConfirmButton>
    </div>
  );
  if (vazio || sempre) return (
    <div className="notice ok" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
      <span>{vazio ? 'O sistema ainda está vazio. Quer ver como ele fica com alguns projetos, prazos e lançamentos de exemplo?' : 'Carregue clientes, projetos e lançamentos fictícios para testar o sistema.'}</span>
      <ActionButton action={acaoCarregarExemplos} classe="btn sm primary">Carregar dados de exemplo</ActionButton>
    </div>
  );
  return null;
}
