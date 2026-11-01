import Link from 'next/link';
import { q, one, getConfig } from '@/lib/db';
import { exigir, podeVer } from '@/lib/auth';
import { brl, data, numero } from '@/lib/format';
import { CONFIG_PADRAO, orcNovo, orcDeSalvo } from '@/lib/precificacao';
import ConfirmButton from '@/components/ConfirmButton';
import ActionButton from '@/components/ActionButton';
import Calculadora from './Calculadora';
import { salvarConfigPrec, salvarOrcamento, mudarStatusOrc, excluirOrcamento, criarProjetoDoOrcamento } from './actions';

export const metadata = { title: 'Calculadora de precificação' };

const ST = { rascunho: ['Rascunho', 'mute'], enviado: ['Enviado', 'warn'], aprovado: ['Aprovado', 'ok'], recusado: ['Recusado', 'bad'] };
const PROX = { rascunho: 'enviado', enviado: 'aprovado', aprovado: 'recusado', recusado: 'rascunho' };

export default async function PrecificacaoPage({ searchParams }) {
  const u = await exigir('precificacao');
  const sp = await searchParams;
  const oid = Number(sp?.o) || null;
  const [cfg, clientes, orcs, atual] = await Promise.all([
    getConfig('precificacao', CONFIG_PADRAO),
    q('SELECT id, nome FROM clientes ORDER BY lower(nome)'),
    q(`SELECT o.id, o.nome, o.tipo, o.area, o.valor, o.status, o.data, o.projeto_id, o.dados->'resultado'->>'horas' AS horas, c.nome AS cliente
       FROM orcamentos o LEFT JOIN clientes c ON c.id = o.cliente_id ORDER BY o.id DESC LIMIT 100`),
    oid ? one('SELECT * FROM orcamentos WHERE id = $1', [oid]) : null,
  ]);
  const inicial = atual ? orcDeSalvo(atual) : orcNovo();
  const verProj = podeVer(u, 'projetos');

  return (
    <>
      <div className="page-head">
        <div><h1>Calculadora de precificação</h1><p className="sub">Custos do escritório e pró-labore viram o seu custo-hora. As horas do projeto viram o valor do orçamento.</p></div>
        {atual && <Link className="btn" href="/precificacao">+ Novo cálculo</Link>}
      </div>

      <Calculadora key={atual ? 'o' + atual.id : 'novo'} cfgInicial={cfg} orcInicial={inicial} clientes={clientes} salvarCfg={salvarConfigPrec} salvarOrc={salvarOrcamento} />

      <h2 style={{ margin: '32px 0 14px' }}>Orçamentos salvos</h2>
      {orcs.length ? (
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Nº</th><th>Data</th><th>Cliente / projeto</th><th className="r">Horas</th><th className="r">Valor</th><th>Situação</th><th></th></tr></thead>
            <tbody>
              {orcs.map((o) => {
                async function status() { 'use server'; await mudarStatusOrc(o.id, PROX[o.status] || 'rascunho'); }
                async function del() { 'use server'; await excluirOrcamento(o.id); }
                async function proj() { 'use server'; await criarProjetoDoOrcamento(o.id); }
                return (
                  <tr key={o.id} style={oid === o.id ? { background: 'var(--primary-soft)' } : undefined}>
                    <td className="num">{o.id}</td>
                    <td className="num">{data(o.data)}</td>
                    <td><strong style={{ fontWeight: 500 }}>{o.cliente || 'Sem cliente'}</strong><span className="sm">{[o.nome, o.tipo, o.area ? `${o.area} m²` : null].filter(Boolean).join(' · ')}</span></td>
                    <td className="r num">{o.horas ? numero(o.horas) + ' h' : '—'}</td>
                    <td className="r num">{brl(o.valor)}</td>
                    <td><ActionButton action={status} classe={'tag ' + (ST[o.status]?.[1] || 'mute')} title="Clique para mudar a situação">{ST[o.status]?.[0] || o.status}</ActionButton></td>
                    <td className="r" style={{ whiteSpace: 'nowrap' }}>
                      <Link className="btn sm" href={`/precificacao?o=${o.id}`}>Abrir</Link>{' '}
                      <Link className="btn sm" href={`/precificacao/proposta/${o.id}`}>Proposta</Link>{' '}
                      {verProj && (o.projeto_id
                        ? <Link className="btn sm" href={`/projetos/${o.projeto_id}`}>Ver projeto</Link>
                        : <ActionButton action={proj} classe="btn sm" title="Cria o projeto com as etapas deste orçamento e um contrato em rascunho">Criar projeto</ActionButton>)}{' '}
                      <ConfirmButton action={del} classe="btn ghost sm">Excluir</ConfirmButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty"><strong>Nenhum orçamento salvo</strong>Faça o cálculo acima e clique em “Salvar orçamento”. Quando o cliente aprovar, “Criar projeto” já monta o projeto com as etapas e o contrato.</div>
      )}
    </>
  );
}
