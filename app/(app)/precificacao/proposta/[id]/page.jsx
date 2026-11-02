import Link from 'next/link';
import { notFound } from 'next/navigation';
import { one, getConfig } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { CONFIG_PADRAO } from '@/lib/precificacao';
import { propostaPadrao, etapasMarcadas, etapasDoOrcamento, DESCRICOES_ETAPAS } from '@/lib/proposta';
import PropostaEditor from './PropostaEditor';
import { salvarProposta } from '../../actions';

export const metadata = { title: 'Proposta' };

export default async function PropostaPage({ params }) {
  await exigir('precificacao');
  const { id } = await params;
  const o = await one('SELECT o.*, c.nome AS cliente FROM orcamentos o LEFT JOIN clientes c ON c.id = o.cliente_id WHERE o.id = $1', [Number(id) || 0]);
  if (!o) notFound();
  const [cfg, esc] = await Promise.all([getConfig('precificacao', CONFIG_PADRAO), getConfig('escritorio', {})]);
  const padrao = propostaPadrao(o, o.cliente, cfg.horasMes);
  const salva = o.dados?.proposta;
  return (
    <>
      <p className="small no-print" style={{ margin: '0 0 8px' }}><Link href={`/precificacao?o=${o.id}`}>← Voltar ao orçamento nº {o.id}</Link></p>
      <PropostaEditor
        id={o.id}
        inicial={salva || padrao}
        padrao={padrao}
        marcadas={etapasMarcadas(o)}
        doOrcamento={etapasDoOrcamento(o)}
        descricoes={DESCRICOES_ETAPAS}
        jaSalva={!!salva}
        valorOrcamento={Number(o.valor) || 0}
        escritorio={{ nome: esc.nome || 'Mariana Canedo Arquitetura e Interiores', telefone: esc.telefone || '', email: esc.email || '', cau: esc.cau || '', cidade: esc.cidade || '', endereco: esc.endereco || '' }}
        salvar={salvarProposta}
      />
    </>
  );
}
