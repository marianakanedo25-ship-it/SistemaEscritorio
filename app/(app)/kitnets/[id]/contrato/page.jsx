import Link from 'next/link';
import { notFound } from 'next/navigation';
import { one, getConfig } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { hoje } from '@/lib/format';
import { nomeUnidade } from '@/lib/kitnets';
import { locadorPadrao } from '@/lib/contrato-kitnet';
import ContratoEditor from './ContratoEditor';
import { salvarContratoKitnet } from '../../actions';

export const metadata = { title: 'Contrato da kitnet' };

export default async function ContratoKitnetPage({ params }) {
  await exigir('kitnets');
  const { id } = await params;
  const u = await one('SELECT * FROM kit_unidades WHERE id = $1', [Number(id) || 0]);
  if (!u) notFound();
  const locadores = (await getConfig('kit_locadores', {})) || {};
  const padrao = locadorPadrao(u.grupo);
  const salvo = locadores[u.grupo] || {};
  // Campos vazios no que foi salvo voltam para o padrão do bairro (só os que não são dados pessoais)
  const locador = { ...padrao, ...Object.fromEntries(Object.entries(salvo).filter(([, v]) => v)) };
  const x = u.contrato || {};

  const inicial = {
    kitnet: u.numero,
    locatario: { nome: u.inquilino || '', qualificacao: u.qualificacao || '', rg: u.rg || '', cpf: u.cpf || '', residencia: x.residencia || 'Silvânia Go, CEP 75180-000' },
    inicio: u.inicio || '', fim: u.fim || '', aluguel: u.aluguel ?? '', vencimentoDia: u.vencimento_dia ?? '', franquia: u.franquia_kwh ?? 150,
    ucAgua: u.uc_agua || '', composicao: x.composicao || '', antecipado: x.antecipado || '',
    usarFiador: !!x.usarFiador, fiador: { nome: '', qualificacao: '', rg: '', cpf: '', endereco: '', ...(x.fiador || {}) },
    cidade: x.cidade || 'Silvânia', dataAssinatura: x.dataAssinatura || u.inicio || hoje(),
    primeiroPagamento: x.primeiroPagamento || '', ultimoPagamento: x.ultimoPagamento || '',
    locador,
  };

  return (
    <>
      <p className="small no-print" style={{ margin: '0 0 8px' }}>
        <Link href={`/kitnets?g=${encodeURIComponent(u.grupo)}`}>← Kitnets · {u.grupo}</Link>
        {'  ·  '}<Link href={`/kitnets/${u.id}`}>{nomeUnidade(u)}</Link>
        {'  ·  '}<Link href={`/kitnets/${u.id}/vistoria`}>Termo de vistoria</Link>
      </p>
      <ContratoEditor id={u.id} grupo={u.grupo} inicial={inicial} temDadosLocador={!!(salvo.cpf && salvo.endereco)} salvar={salvarContratoKitnet} />
    </>
  );
}
