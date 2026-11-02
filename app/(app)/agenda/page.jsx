import Link from 'next/link';
import { q } from '@/lib/db';
import { exigir, podeVer } from '@/lib/auth';
import { hoje, mesAtual, addMes, addDias, nomeMes, ymValido, data, dataExtenso, brl, DIAS_SEMANA, STATUS_ETAPA } from '@/lib/format';
import Modal from '@/components/Modal';
import ConfirmButton from '@/components/ConfirmButton';
import EventoCampos, { TIPOS_EVENTO } from '@/components/EventoCampos';
import { salvarEvento, excluirEvento } from './actions';

export const metadata = { title: 'Agenda' };

const isoOk = (s) => (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
function domingoDe(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return addDias(iso, -d.getUTCDay());
}

export default async function AgendaPage({ searchParams }) {
  const u = await exigir('agenda');
  const sp = await searchParams;
  const vista = sp?.v === 'semana' ? 'semana' : 'mes';
  const hj = hoje();
  const dia = isoOk(sp?.d);
  const ym = ymValido(sp?.m) || (dia ? dia.slice(0, 7) : mesAtual());
  const fin = sp?.fin === '1' && podeVer(u, 'financeiro');

  let ini, fim;
  if (vista === 'semana') {
    ini = domingoDe(dia || (ym === mesAtual() ? hj : ym + '-01'));
    fim = addDias(ini, 6);
  } else {
    ini = domingoDe(ym + '-01');
    fim = addDias(ini, 41);
  }

  const [etapas, eventos, projetos] = await Promise.all([
    q(`SELECT e.id, e.nome, e.inicio, e.prazo, e.status, p.id AS projeto_id, p.nome AS projeto, p.cor
       FROM etapas e JOIN projetos p ON p.id = e.projeto_id
       WHERE e.prazo BETWEEN $1 AND $2 OR e.inicio BETWEEN $1 AND $2 ORDER BY coalesce(e.inicio, e.prazo), p.nome`, [ini, fim]),
    q(`SELECT ev.*, p.nome AS projeto, p.cor FROM eventos ev LEFT JOIN projetos p ON p.id = ev.projeto_id
       WHERE ev.data BETWEEN $1 AND $2 ORDER BY ev.data, ev.hora NULLS FIRST`, [ini, fim]),
    q(`SELECT id, nome FROM projetos WHERE status <> 'concluido' ORDER BY nome`),
  ]);
  const financeiro = fin ? await q(
    `SELECT 'receita' AS k, id, descricao, valor, vencimento AS data, pago_em FROM receitas WHERE vencimento BETWEEN $1 AND $2
     UNION ALL SELECT 'despesa', id, descricao, valor, vencimento, pago_em FROM despesas WHERE vencimento BETWEEN $1 AND $2
     UNION ALL SELECT 'repasse', id, parceiro, valor, vencimento, pago_em FROM repasses WHERE vencimento BETWEEN $1 AND $2`, [ini, fim]) : [];

  const porDia = {};
  const push = (d, item) => { (porDia[d] ||= []).push(item); };
  for (const ev of eventos) push(ev.data, { tipo: 'evento', ...ev });
  // Cada etapa aparece no dia de início e no dia do prazo (uma vez só, se forem o mesmo dia).
  for (const e of etapas) {
    const mesmoDia = !e.inicio || e.inicio === e.prazo;
    if (e.inicio && !mesmoDia && e.inicio >= ini && e.inicio <= fim) push(e.inicio, { tipo: 'etapa', marca: 'inicio', data: e.inicio, ...e });
    if (e.prazo && e.prazo >= ini && e.prazo <= fim) push(e.prazo, { tipo: 'etapa', marca: mesmoDia && e.inicio ? 'dia' : 'fim', data: e.prazo, ...e });
  }
  for (const f of financeiro) push(f.data, { tipo: 'fin', ...f });

  const qs = (o) => {
    const p = new URLSearchParams({ v: vista, m: ym, ...(dia ? { d: dia } : {}), ...(fin ? { fin: '1' } : {}), ...o });
    for (const [k, v] of [...p]) if (v === '') p.delete(k);
    return '/agenda?' + p.toString();
  };
  const prev = vista === 'semana' ? qs({ d: addDias(ini, -7), m: addDias(ini, -7).slice(0, 7) }) : qs({ m: addMes(ym, -1), d: '' });
  const next = vista === 'semana' ? qs({ d: addDias(ini, 7), m: addDias(ini, 7).slice(0, 7) }) : qs({ m: addMes(ym, 1), d: '' });
  const titulo = vista === 'semana' ? `${data(ini).slice(0, 5)} a ${data(fim)}` : nomeMes(ym);

  const Chip = ({ it, curto }) => {
    if (it.tipo === 'etapa') {
      const late = it.status !== 'concluida' && it.prazo && it.prazo < hj;
      const ini = it.marca === 'inicio';
      const rot = ini ? 'Início: ' : it.marca === 'fim' && it.inicio ? 'Prazo: ' : '';
      const periodo = it.inicio && it.inicio !== it.prazo ? ` · ${data(it.inicio).slice(0, 5)} a ${it.prazo ? data(it.prazo).slice(0, 5) : '—'}` : '';
      return <Link href={`/projetos/${it.projeto_id}#etapas`} className={'ev' + (ini ? ' inicio' : '') + (it.status === 'concluida' ? ' done' : '') + (late && !ini ? ' late' : '')} style={{ '--c': it.cor }} title={`${rot}${it.nome} · ${it.projeto}${periodo} · ${STATUS_ETAPA[it.status]}`}>{rot}{curto ? it.nome : `${it.nome} · ${it.projeto}`}</Link>;
    }
    if (it.tipo === 'evento') {
      return <Link href={qs({ d: it.data }) + '#dia'} className="ev" style={{ '--c': it.cor || '#5E564F' }} title={`${it.titulo}${it.projeto ? ' · ' + it.projeto : ''}`}>{it.hora ? it.hora.slice(0, 5) + ' ' : ''}{it.titulo}</Link>;
    }
    const pago = !!it.pago_em;
    const atras = !pago && it.data < hj;
    return <Link href={it.k === 'receita' ? '/financeiro/receitas?m=' + it.data.slice(0, 7) : it.k === 'despesa' ? '/financeiro/despesas?m=' + it.data.slice(0, 7) : '/financeiro/repasses?m=' + it.data.slice(0, 7)} className={'ev light ' + (pago ? 'ok' : atras ? 'bad' : '')} title={`${it.descricao} · ${brl(it.valor)}`}>{it.k === 'receita' ? '↓ ' : '↑ '}{brl(it.valor)} {it.descricao}</Link>;
  };

  const dias = [];
  for (let d = ini; d <= fim; d = addDias(d, 1)) dias.push(d);
  const itensDia = dia ? porDia[dia] || [] : [];

  return (
    <>
      <div className="page-head">
        <div><h1>Agenda</h1><p className="sub">Início e prazo das etapas de cada projeto, reuniões, visitas e entregas.</p></div>
        <div className="actions">
          <Modal titulo="Novo compromisso" botao="+ Compromisso" classe="btn primary" action={salvarEvento}>
            <EventoCampos projetos={projetos} dataPadrao={dia || undefined} />
          </Modal>
        </div>
      </div>

      <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="actions">
          <div className="monthnav"><a href={prev} aria-label="Anterior">‹</a><strong>{titulo}</strong><a href={next} aria-label="Próximo">›</a></div>
          <a className="btn" href={qs({ m: mesAtual(), d: vista === 'semana' ? hj : '' })}>Hoje</a>
        </div>
        <div className="actions">
          {podeVer(u, 'financeiro') && <a className={'chip' + (fin ? ' on' : '')} href={qs({ fin: fin ? '' : '1' })}>Vencimentos financeiros</a>}
          <a className={'chip' + (vista === 'mes' ? ' on' : '')} href={qs({ v: 'mes' })}>Mês</a>
          <a className={'chip' + (vista === 'semana' ? ' on' : '')} href={qs({ v: 'semana', d: dia || (ym === mesAtual() ? hj : ym + '-01') })}>Semana</a>
        </div>
      </div>

      {vista === 'mes' ? (
        <div className="cal">
          {DIAS_SEMANA.map((d) => <div className="dow" key={d}>{d}</div>)}
          {dias.map((d) => {
            const its = porDia[d] || [];
            const cls = 'day' + (d.slice(0, 7) !== ym ? ' out' : '') + (d === hj ? ' today' : '');
            return (
              <div className={cls} key={d}>
                <Link href={qs({ d }) + '#dia'} className="dn" style={{ textDecoration: 'none' }} aria-label={`Ver ${data(d)}`}>{Number(d.slice(8))}</Link>
                {its.slice(0, 4).map((it) => <Chip key={it.tipo + it.id + (it.k || '') + (it.marca || '')} it={it} />)}
                {its.length > 4 && <Link className="more" href={qs({ d }) + '#dia'}>+{its.length - 4} mais</Link>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="week">
          {dias.map((d, i) => (
            <div className={'col' + (d === hj ? ' today' : '')} key={d}>
              <h4>{DIAS_SEMANA[i]}<b>{Number(d.slice(8))}</b></h4>
              {(porDia[d] || []).map((it) => <Chip key={it.tipo + it.id + (it.k || '') + (it.marca || '')} it={it} />)}
              <Link className="more" href={qs({ d }) + '#dia'}>Ver dia</Link>
            </div>
          ))}
        </div>
      )}

      <div className="legend" style={{ margin: '12px 0 24px' }}>
        <span><span className="dot" style={{ background: 'var(--taupe)' }} /> Cada projeto tem a sua cor</span>
        <span><span className="dot" style={{ background: 'var(--surface)', border: '2px solid var(--taupe)' }} /> Contorno: início da etapa</span>
        <span><span className="dot" style={{ background: 'var(--taupe)' }} /> Preenchido: prazo final</span>
        <span><span className="dot" style={{ background: 'var(--bad)' }} /> Barra vermelha: etapa atrasada</span>
        <span>Riscado: etapa concluída</span>
      </div>

      {dia && (
        <section className="card pad" id="dia">
          <div className="card-head">
            <h2>{dataExtenso(dia)}</h2>
            <Modal titulo="Novo compromisso" botao="+ Compromisso neste dia" classe="btn sm" action={salvarEvento}>
              <EventoCampos projetos={projetos} dataPadrao={dia} />
            </Modal>
          </div>
          {itensDia.length ? (
            <div className="list">
              {itensDia.map((it) => {
                if (it.tipo === 'evento') {
                  async function del() { 'use server'; await excluirEvento(it.id); }
                  return (
                    <div className="li" key={'e' + it.id}>
                      <div className="t" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span className="dot" style={{ background: it.cor || 'var(--side)' }} />
                        <div><strong>{it.hora ? it.hora.slice(0, 5) + ' · ' : ''}{it.titulo}</strong>
                          <span className="small">{TIPOS_EVENTO[it.tipo] || 'Compromisso'}{it.projeto ? ' · ' + it.projeto : ''}{it.local ? ' · ' + it.local : ''}</span>
                          {it.obs && <span className="small">{it.obs}</span>}</div>
                      </div>
                      <Modal titulo="Editar compromisso" botao="Editar" classe="btn sm" action={salvarEvento} extraFoot={<ConfirmButton action={del} />}>
                        <EventoCampos e={it} projetos={projetos} />
                      </Modal>
                    </div>
                  );
                }
                if (it.tipo === 'etapa') return (
                  <div className="li" key={'t' + it.id + it.marca}>
                    <div className="t" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span className="dot" style={{ background: it.cor }} />
                      <div><strong>{it.marca === 'inicio' ? 'Início' : 'Prazo'}: {it.nome}</strong><span className="small"><Link href={`/projetos/${it.projeto_id}#etapas`}>{it.projeto}</Link>{it.inicio && it.inicio !== it.prazo ? ` · de ${data(it.inicio)} a ${it.prazo ? data(it.prazo) : 'sem prazo'}` : ''}</span></div>
                    </div>
                    <span className={'tag ' + (it.status === 'concluida' ? 'ok' : it.prazo && it.prazo < hj ? 'bad' : 'warn')}>{it.status === 'concluida' ? 'Concluída' : it.prazo && it.prazo < hj ? 'Atrasada' : STATUS_ETAPA[it.status]}</span>
                  </div>
                );
                return (
                  <div className="li" key={'f' + it.k + it.id}>
                    <div className="t"><strong>{it.k === 'receita' ? 'Receber' : 'Pagar'}: {it.descricao}</strong><span className="small">{it.k === 'receita' ? 'Cobrança' : it.k === 'despesa' ? 'Despesa' : 'Repasse'}</span></div>
                    <span className={'num ' + (it.k === 'receita' ? 'pos' : 'neg')}>{brl(it.valor)}</span>
                  </div>
                );
              })}
            </div>
          ) : <p className="small">Nada marcado para este dia.</p>}
        </section>
      )}
    </>
  );
}
