import Link from 'next/link';
import { q, one } from '@/lib/db';
import { exigir, podeVer } from '@/lib/auth';
import { brl, data, hoje, mesAtual, addDias, nomeMes, diasAte, STATUS_CONTRATO } from '@/lib/format';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard({ searchParams }) {
  const u = await exigir('dashboard');
  const sp = await searchParams;
  const hj = hoje();
  const ym = mesAtual();
  const verFin = podeVer(u, 'financeiro');
  const ini = ym + '-01', fim = ym + '-31';

  const [cont, prazos, atrasadas, contratos, eventos] = await Promise.all([
    one(`SELECT
      (SELECT count(*)::int FROM projetos WHERE status IN ('andamento','obra')) AS ativos,
      (SELECT count(*)::int FROM projetos WHERE status = 'proposta') AS propostas,
      (SELECT count(*)::int FROM clientes) AS clientes`),
    q(`SELECT e.id, e.nome, e.prazo, e.status, p.id AS pid, p.nome AS projeto, p.cor, c.nome AS cliente
       FROM etapas e JOIN projetos p ON p.id = e.projeto_id LEFT JOIN clientes c ON c.id = p.cliente_id
       WHERE e.status <> 'concluida' AND e.prazo BETWEEN $1 AND $2 ORDER BY e.prazo LIMIT 10`, [hj, addDias(hj, 21)]),
    q(`SELECT e.id, e.nome, e.prazo, p.id AS pid, p.nome AS projeto, p.cor
       FROM etapas e JOIN projetos p ON p.id = e.projeto_id
       WHERE e.status <> 'concluida' AND e.prazo < $1 AND p.status <> 'concluido' ORDER BY e.prazo`, [hj]),
    q(`SELECT k.id, k.status, k.valor, k.descricao, k.enviado_em, p.id AS pid, p.nome AS projeto, c.nome AS cliente
       FROM contratos k LEFT JOIN projetos p ON p.id = k.projeto_id LEFT JOIN clientes c ON c.id = k.cliente_id
       WHERE k.status IN ('rascunho','aguardando') ORDER BY k.criado_em DESC LIMIT 6`),
    q(`SELECT ev.id, ev.titulo, ev.data, ev.hora, p.nome AS projeto, p.cor FROM eventos ev LEFT JOIN projetos p ON p.id = ev.projeto_id
       WHERE ev.data BETWEEN $1 AND $2 ORDER BY ev.data, ev.hora NULLS FIRST LIMIT 6`, [hj, addDias(hj, 7)]),
  ]);

  let fin = null, cobrancasAtrasadas = [];
  if (verFin) {
    [fin, cobrancasAtrasadas] = await Promise.all([
      one(`SELECT
        (SELECT coalesce(sum(valor),0) FROM receitas WHERE pago_em BETWEEN $1 AND $2) AS entrou,
        (SELECT coalesce(sum(valor),0) FROM despesas WHERE pago_em BETWEEN $1 AND $2)
          + (SELECT coalesce(sum(valor),0) FROM repasses WHERE pago_em BETWEEN $1 AND $2)
          + (SELECT coalesce(sum(valor),0) FROM compras WHERE pago_em BETWEEN $1 AND $2) AS saiu,
        (SELECT coalesce(sum(valor),0) FROM receitas WHERE pago_em IS NULL) AS a_receber,
        (SELECT coalesce(sum(valor),0) FROM receitas WHERE pago_em IS NULL AND vencimento BETWEEN $1 AND $2) AS receber_mes,
        (SELECT coalesce(sum(valor),0) FROM despesas WHERE pago_em IS NULL AND vencimento BETWEEN $1 AND $2)
          + (SELECT coalesce(sum(valor),0) FROM repasses WHERE pago_em IS NULL AND vencimento BETWEEN $1 AND $2) AS pagar_mes`, [ini, fim]),
      q(`SELECT r.id, r.descricao, r.valor, r.vencimento, c.nome AS cliente FROM receitas r LEFT JOIN clientes c ON c.id = r.cliente_id
         WHERE r.pago_em IS NULL AND r.vencimento < $1 ORDER BY r.vencimento LIMIT 6`, [hj]),
    ]);
  }

  const saldo = fin ? Number(fin.entrou) - Number(fin.saiu) : 0;
  const nome = u.nome.split(' ')[0];

  return (
    <>
      {sp?.['sem-acesso'] && <div className="notice">Você não tem acesso àquela aba. Peça à administradora para liberar em Usuários.</div>}
      <div className="page-head">
        <div><h1>Olá, {nome}</h1><p className="sub">Resumo do escritório · {nomeMes(ym)}</p></div>
        <div className="actions">
          {podeVer(u, 'projetos') && <Link className="btn" href="/projetos">Ver projetos</Link>}
          {podeVer(u, 'agenda') && <Link className="btn primary" href="/agenda">Abrir agenda</Link>}
        </div>
      </div>

      <div className="stats">
        {verFin ? (
          <>
            <div className="card stat"><span className="lbl">Entrou no mês</span><span className="val pos">{brl(fin.entrou)}</span><span className="hint">Pagamentos recebidos</span></div>
            <div className="card stat"><span className="lbl">Saiu no mês</span><span className="val neg">{brl(fin.saiu)}</span><span className="hint">Despesas, compras e repasses pagos</span></div>
            <div className="card stat"><span className="lbl">Saldo do mês</span><span className={'val ' + (saldo < 0 ? 'neg' : '')}>{brl(saldo)}</span><span className="hint">Entrou menos saiu</span></div>
            <div className="card stat"><span className="lbl">Falta receber</span><span className="val wrn">{brl(fin.receber_mes)}</span><span className="hint">Vencendo no mês · total em aberto {brl(fin.a_receber)}</span></div>
          </>
        ) : (
          <>
            <div className="card stat"><span className="lbl">Projetos ativos</span><span className="val">{cont.ativos}</span></div>
            <div className="card stat"><span className="lbl">Propostas</span><span className="val">{cont.propostas}</span></div>
            <div className="card stat"><span className="lbl">Etapas atrasadas</span><span className={'val ' + (atrasadas.length ? 'neg' : '')}>{atrasadas.length}</span></div>
            <div className="card stat"><span className="lbl">Clientes</span><span className="val">{cont.clientes}</span></div>
          </>
        )}
      </div>

      {verFin && (
        <div className="stats">
          <div className="card stat"><span className="lbl">Projetos ativos</span><span className="val">{cont.ativos}</span><span className="hint">Em andamento ou em obra</span></div>
          <div className="card stat"><span className="lbl">Propostas em aberto</span><span className="val">{cont.propostas}</span><span className="hint">Projetos na fase de proposta</span></div>
          <div className="card stat"><span className="lbl">Etapas atrasadas</span><span className={'val ' + (atrasadas.length ? 'neg' : '')}>{atrasadas.length}</span><span className="hint">Prazo vencido e não concluídas</span></div>
          <div className="card stat"><span className="lbl">A pagar no mês</span><span className="val">{brl(fin.pagar_mes)}</span><span className="hint">Despesas e repasses em aberto</span></div>
        </div>
      )}

      <div className="grid2">
        <section className="card pad">
          <div className="card-head"><h2>Prazos das próximas 3 semanas</h2><Link className="small" href="/agenda">Agenda →</Link></div>
          {atrasadas.length > 0 && (
            <div className="list" style={{ marginBottom: 8 }}>
              {atrasadas.slice(0, 5).map((e) => (
                <div className="li" key={'a' + e.id}>
                  <div className="t" style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="dot" style={{ background: e.cor }} />
                    <div><Link href={`/projetos/${e.pid}#etapas`}><strong>{e.nome}</strong></Link><span className="small">{e.projeto}</span></div></div>
                  <span className="tag bad">Atrasada {-diasAte(e.prazo)}d</span>
                </div>
              ))}
            </div>
          )}
          {prazos.length ? (
            <div className="list">
              {prazos.map((e) => {
                const n = diasAte(e.prazo);
                return (
                  <div className="li" key={e.id}>
                    <div className="t" style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="dot" style={{ background: e.cor }} />
                      <div><Link href={`/projetos/${e.pid}#etapas`}><strong>{e.nome}</strong></Link><span className="small">{e.projeto}{e.cliente ? ' · ' + e.cliente : ''}</span></div></div>
                    <span className={'tag ' + (n <= 7 ? 'warn' : 'mute')}>{n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : data(e.prazo)}</span>
                  </div>
                );
              })}
            </div>
          ) : !atrasadas.length && <p className="small">Nenhum prazo nas próximas 3 semanas.</p>}
        </section>

        <div className="stack">
          <section className="card pad">
            <div className="card-head"><h2>Próximos 7 dias</h2></div>
            {eventos.length ? (
              <div className="list">{eventos.map((ev) => (
                <div className="li" key={ev.id}>
                  <div className="t" style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="dot" style={{ background: ev.cor || 'var(--side)' }} />
                    <div><strong>{ev.titulo}</strong><span className="small">{data(ev.data)}{ev.hora ? ' às ' + ev.hora.slice(0, 5) : ''}{ev.projeto ? ' · ' + ev.projeto : ''}</span></div></div>
                </div>
              ))}</div>
            ) : <p className="small">Nenhuma reunião ou visita marcada.</p>}
          </section>
          <section className="card pad">
            <div className="card-head"><h2>Contratos pendentes</h2></div>
            {contratos.length ? (
              <div className="list">{contratos.map((k) => (
                <div className="li" key={k.id}>
                  <div className="t"><Link href={`/projetos/${k.pid}#contrato`}><strong>{k.cliente || k.projeto}</strong></Link><span className="small">{k.descricao || k.projeto}{verFin && k.valor ? ' · ' + brl(k.valor) : ''}</span></div>
                  <span className={'tag ' + (k.status === 'aguardando' ? 'warn' : 'mute')}>{STATUS_CONTRATO[k.status]}</span>
                </div>
              ))}</div>
            ) : <p className="small">Nenhum contrato em rascunho ou aguardando assinatura.</p>}
          </section>
          {verFin && cobrancasAtrasadas.length > 0 && (
            <section className="card pad">
              <div className="card-head"><h2>Pagamentos atrasados</h2><Link className="small" href="/financeiro/receitas?s=atrasado">Ver todos →</Link></div>
              <div className="list">{cobrancasAtrasadas.map((r) => (
                <div className="li" key={r.id}>
                  <div className="t"><strong>{r.cliente || r.descricao}</strong><span className="small">{r.descricao} · venceu em {data(r.vencimento)}</span></div>
                  <span className="num neg">{brl(r.valor)}</span>
                </div>
              ))}</div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
