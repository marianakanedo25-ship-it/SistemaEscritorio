import Link from 'next/link';
import { notFound } from 'next/navigation';
import { one, getConfig } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { hoje } from '@/lib/format';
import { nomeUnidade } from '@/lib/kitnets';
import { locadorPadrao } from '@/lib/contrato-kitnet';
import { vistoriaPadrao } from '@/lib/vistoria-kitnet';
import VistoriaEditor from './VistoriaEditor';
import { salvarVistoriaKitnet } from '../../actions';

export const metadata = { title: 'Termo de vistoria' };

export default async function VistoriaPage({ params }) {
  await exigir('kitnets');
  const { id } = await params;
  const u = await one('SELECT * FROM kit_unidades WHERE id = $1', [Number(id) || 0]);
  if (!u) notFound();
  const locadores = (await getConfig('kit_locadores', {})) || {};
  const L = { ...locadorPadrao(u.grupo), ...Object.fromEntries(Object.entries(locadores[u.grupo] || {}).filter(([, v]) => v)) };
  const base = vistoriaPadrao(u.grupo, hoje());
  const salvo = u.vistoria || {};
  const enderecoPadrao = String(L.imovel || '').split(/,\s*Kitnet/i)[0] + (u.grupo === 'Centro' ? ' – Centro' : ' – Nossa Senhora de Fátima');
  const inicial = { ...base, endereco: enderecoPadrao, ...salvo, condicoes: { ...base.condicoes, ...(salvo.condicoes || {}) } };

  return (
    <>
      <p className="small no-print" style={{ margin: '0 0 8px' }}>
        <Link href={`/kitnets?g=${encodeURIComponent(u.grupo)}`}>← Kitnets · {u.grupo}</Link>
        {'  ·  '}<Link href={`/kitnets/${u.id}`}>{nomeUnidade(u)}</Link>
        {'  ·  '}<Link href={`/kitnets/${u.id}/contrato`}>Contrato</Link>
      </p>
      <VistoriaEditor
        id={u.id}
        grupo={u.grupo}
        kitnet={u.numero}
        partes={{ locador: L.nome || '', locadorCpf: L.cpf || '', locatario: u.inquilino || '', locatarioCpf: u.cpf || '' }}
        inicial={inicial}
        padraoAmbientes={base.ambientes}
        salvar={salvarVistoriaKitnet}
      />
    </>
  );
}
