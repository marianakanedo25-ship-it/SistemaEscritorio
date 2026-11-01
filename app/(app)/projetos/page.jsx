import Link from 'next/link';
import { q } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { brl, prazoInfo, STATUS_PROJETO } from '@/lib/format';
import Modal from '@/components/Modal';
import ProjetoCampos from '@/components/ProjetoCampos';
import { salvarProjeto } from './actions';

export const metadata = { title: 'Projetos' };

const FILTROS = [['ativos', 'Ativos'], ['proposta', 'Propostas'], ['andamento', 'Em andamento'], ['obra', 'Em obra'], ['pausado', 'Pausados'], ['concluido', 'Concluídos'], ['todos', 'Todos']];

export default async function ProjetosPage({ searchParams }) {
  await exigir('projetos');
  const sp = await searchParams;
  const f = FILTROS.some(([k]) => k === sp?.f) ? sp.f : 'ativos';
  const where = f === 'todos' ? '' : f === 'ativos' ? `WHERE p.status IN ('proposta','andamento','obra')` : 'WHERE p.status = $1';
  const projetos = await q(
    `SELECT p.id, p.nome, p.tipo, p.status, p.cor, p.area, p.valor, c.nome AS cliente,
      (SELECT count(*)::int FROM etapas e WHERE e.projeto_id = p.id) AS n_et,
      (SELECT count(*)::int FROM etapas e WHERE e.projeto_id = p.id AND e.status = 'concluida') AS n_ok,
      (SELECT json_build_object('nome', e.nome, 'prazo', e.prazo) FROM etapas e WHERE e.projeto_id = p.id AND e.status <> 'concluida' AND e.prazo IS NOT NULL ORDER BY e.prazo LIMIT 1) AS prox
     FROM projetos p LEFT JOIN clientes c ON c.id = p.cliente_id ${where}
     ORDER BY CASE p.status WHEN 'andamento' THEN 0 WHEN 'obra' THEN 1 WHEN 'proposta' THEN 2 WHEN 'pausado' THEN 3 ELSE 4 END, p.criado_em DESC`,
    where.includes('$1') ? [f] : []
  );
  const clientes = await q('SELECT id, nome FROM clientes ORDER BY lower(nome)');
  return (
    <>
      <div className="page-head">
        <div><h1>Projetos</h1><p className="sub">Clique em um projeto para ver etapas, prazos, contrato e cobranças.</p></div>
        <Modal titulo="Novo projeto" botao="+ Novo projeto" classe="btn primary" action={salvarProjeto} enviar="Criar projeto">
          <ProjetoCampos novo clientes={clientes} />
        </Modal>
      </div>
      <div className="chips">
        {FILTROS.map(([k, l]) => <a key={k} href={`/projetos?f=${k}`} className={'chip' + (f === k ? ' on' : '')}>{l}</a>)}
      </div>
      {projetos.length ? (
        <div className="proj-grid">
          {projetos.map((p) => {
            const pct = p.n_et ? Math.round((p.n_ok / p.n_et) * 100) : 0;
            const pz = p.prox ? prazoInfo(p.prox.prazo, false) : null;
            return (
              <Link key={p.id} href={`/projetos/${p.id}`} className="card proj-card" style={{ '--c': p.cor }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div><h3>{p.nome}</h3><div className="small">{p.cliente || 'Sem cliente'}{p.tipo ? ' · ' + p.tipo : ''}{p.area ? ` · ${p.area} m²` : ''}</div></div>
                  <span className={'tag ' + (p.status === 'concluido' ? 'ok' : p.status === 'pausado' ? 'mute' : p.status === 'proposta' ? 'warn' : '')}>{STATUS_PROJETO[p.status]}</span>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} className="small"><span>{p.n_ok} de {p.n_et} etapas</span><span className="num">{pct}%</span></div>
                  <div className="bar"><i style={{ width: pct + '%' }} /></div>
                </div>
                <div className="small">
                  {pz ? <>Próximo prazo: <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{p.prox.nome}</strong> · <span className={'prazo-txt ' + pz.tom}>{pz.texto}</span></> : 'Nenhum prazo pendente'}
                </div>
                {p.valor ? <div className="small num">Honorários: {brl(p.valor)}</div> : null}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty"><strong>Nenhum projeto aqui</strong>Use “+ Novo projeto”. Ele já vem com as etapas padrão do escritório para você definir os prazos.</div>
      )}
    </>
  );
}
