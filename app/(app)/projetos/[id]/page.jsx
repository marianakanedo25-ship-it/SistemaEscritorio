import Link from 'next/link';
import { notFound } from 'next/navigation';
import { q, one } from '@/lib/db';
import { exigir, podeVer } from '@/lib/auth';
import { brl, data, situacao, prazoInfo, hoje, STATUS_PROJETO, STATUS_CONTRATO, FORMAS_PAGAMENTO } from '@/lib/format';
import Modal from '@/components/Modal';
import ConfirmButton from '@/components/ConfirmButton';
import ActionButton from '@/components/ActionButton';
import SaveForm from '@/components/SaveForm';
import ProjetoCampos from '@/components/ProjetoCampos';
import FinCampos from '@/components/FinCampos';
import EtapasEditor from './EtapasEditor';
import { salvarProjeto, salvarEtapas, excluirProjeto, salvarContrato, excluirContrato, gerarParcelas } from '../actions';
import { salvarLancamento, alternarPago, excluirLancamento } from '../../financeiro/actions';
import { salvarEvento } from '../../agenda/actions';
import EventoCampos from '@/components/EventoCampos';

function ContratoCampos({ k = {}, projeto }) {
  return (
    <div className="form">
      {k.id && <input type="hidden" name="id" value={k.id} />}
      <input type="hidden" name="projeto_id" value={projeto.id} />
      <label className="fld full"><span>Descrição</span><input name="descricao" defaultValue={k.descricao || ''} placeholder="Ex.: Projeto de interiores completo + acompanhamento" /></label>
      <label className="fld"><span>Valor (R$)</span><input name="valor" type="number" step="0.01" min="0" defaultValue={k.valor ?? projeto.valor ?? ''} /></label>
      <label className="fld"><span>Situação</span>
        <select name="status" defaultValue={k.status || 'aguardando'}>{Object.entries(STATUS_CONTRATO).map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select>
      </label>
      <label className="fld"><span>Enviado em</span><input name="enviado_em" type="date" defaultValue={k.enviado_em || ''} /></label>
      <label className="fld"><span>Assinado em</span><input name="assinado_em" type="date" defaultValue={k.assinado_em || ''} /></label>
      <label className="fld full"><span>Link do contrato (Drive, assinatura eletrônica…)</span><input name="link" type="url" defaultValue={k.link || ''} placeholder="https://…" /></label>
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={k.obs || ''} /></label>
    </div>
  );
}

const tomContrato = { rascunho: 'mute', aguardando: 'warn', assinado: 'ok', cancelado: 'bad' };

export default async function ProjetoPage({ params }) {
  const u = await exigir('projetos');
  const { id } = await params;
  const p = await one('SELECT p.*, c.nome AS cliente FROM projetos p LEFT JOIN clientes c ON c.id = p.cliente_id WHERE p.id = $1', [Number(id) || 0]);
  if (!p) notFound();
  const [etapas, contratos, eventos, clientes] = await Promise.all([
    q('SELECT id, nome, inicio, prazo, status FROM etapas WHERE projeto_id = $1 ORDER BY ordem, id', [p.id]),
    q('SELECT * FROM contratos WHERE projeto_id = $1 ORDER BY criado_em DESC', [p.id]),
    q('SELECT id, titulo, data, hora, tipo, local FROM eventos WHERE projeto_id = $1 AND data >= $2 ORDER BY data, hora LIMIT 8', [p.id, hoje()]),
    q('SELECT id, nome FROM clientes ORDER BY lower(nome)'),
  ]);
  const verFin = podeVer(u, 'financeiro');
  const [receitas, custos] = verFin ? await Promise.all([
    q('SELECT * FROM receitas WHERE projeto_id = $1 ORDER BY vencimento, id', [p.id]),
    q(`SELECT 'Despesa' AS tipo, descricao, valor, pago_em FROM despesas WHERE projeto_id = $1
       UNION ALL SELECT 'Repasse', parceiro || coalesce(' — ' || descricao, ''), valor, pago_em FROM repasses WHERE projeto_id = $1
       UNION ALL SELECT 'Compra', descricao, valor, pago_em FROM compras WHERE projeto_id = $1 AND status <> 'cancelado'`, [p.id]),
  ]) : [[], []];
  const recebido = receitas.filter((r) => r.pago_em).reduce((s, r) => s + Number(r.valor), 0);
  const cobrado = receitas.reduce((s, r) => s + Number(r.valor), 0);
  const totalCustos = custos.reduce((s, r) => s + Number(r.valor), 0);
  const ok = etapas.filter((e) => e.status === 'concluida').length;
  const pct = etapas.length ? Math.round((ok / etapas.length) * 100) : 0;
  const prox = etapas.filter((e) => e.status !== 'concluida' && e.prazo).sort((a, b) => a.prazo.localeCompare(b.prazo))[0];
  const contratoPrinc = contratos.find((k) => k.status === 'assinado') || contratos[0];
  const pz = prox ? prazoInfo(prox.prazo, false) : null;

  async function excluir() { 'use server'; await excluirProjeto(p.id); }
  const salvarReceita = salvarLancamento.bind(null, 'receitas');

  return (
    <>
      <p className="small" style={{ margin: '0 0 8px' }}><Link href="/projetos">← Projetos</Link></p>
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span className="dot" style={{ background: p.cor, width: 14, height: 14 }} /><h1>{p.nome}</h1></div>
          <p className="sub">
            {p.cliente_id ? <Link href={`/clientes/${p.cliente_id}`}>{p.cliente}</Link> : 'Sem cliente'}
            {p.tipo ? ' · ' + p.tipo : ''}{p.area ? ` · ${p.area} m²` : ''}{p.endereco_obra ? ' · ' + p.endereco_obra : ''}
          </p>
        </div>
        <div className="actions">
          <span className={'tag ' + (p.status === 'concluido' ? 'ok' : p.status === 'pausado' ? 'mute' : p.status === 'proposta' ? 'warn' : '')}>{STATUS_PROJETO[p.status]}</span>
          {p.pasta_drive && <a className="btn" href={p.pasta_drive} target="_blank" rel="noreferrer">Pasta no Drive</a>}
          <Modal titulo="Editar projeto" botao="Editar projeto" action={salvarProjeto}><ProjetoCampos p={p} clientes={clientes} /></Modal>
        </div>
      </div>

      <div className="stats">
        <div className="card stat"><span className="lbl">Etapas concluídas</span><span className="val">{ok} de {etapas.length}</span><div className="bar"><i style={{ width: pct + '%' }} /></div></div>
        <div className="card stat"><span className="lbl">Próximo prazo</span><span className="val" style={{ fontSize: 22 }}>{prox ? prox.nome : '—'}</span><span className={'hint prazo-txt ' + (pz?.tom || '')}>{pz ? pz.texto : 'Nenhum prazo pendente'}</span></div>
        <div className="card stat"><span className="lbl">Contrato</span><span className="val" style={{ fontSize: 22 }}>{contratoPrinc ? STATUS_CONTRATO[contratoPrinc.status] : 'Sem contrato'}</span><span className="hint">{contratoPrinc?.valor ? brl(contratoPrinc.valor) : p.valor ? 'Honorários: ' + brl(p.valor) : ''}</span></div>
        {verFin
          ? <div className="card stat"><span className="lbl">Recebido</span><span className="val pos">{brl(recebido)}</span><span className="hint">de {brl(cobrado)} em cobranças</span></div>
          : <div className="card stat"><span className="lbl">Início</span><span className="val" style={{ fontSize: 22 }}>{data(p.inicio)}</span><span className="hint">Previsão: {data(p.previsao)}</span></div>}
      </div>

      <nav className="secnav">
        <a href="#etapas">Etapas e prazos</a><a href="#contrato">Contrato</a>{verFin && <a href="#financeiro">Financeiro</a>}<a href="#agenda">Agenda</a><a href="#info">Informações</a>
      </nav>

      <div className="stack">
        <section className="card pad" id="etapas">
          <div className="card-head"><h2>Etapas e prazos</h2><span className="small">Os prazos aparecem na Agenda com a cor do projeto.</span></div>
          <EtapasEditor projetoId={p.id} salvar={salvarEtapas} inicial={etapas.map((e) => ({ key: e.id, nome: e.nome, inicio: e.inicio || '', prazo: e.prazo || '', status: e.status }))} />
        </section>

        <div className="grid2">
          <section className="card pad" id="contrato">
            <div className="card-head"><h2>Contrato</h2>
              <Modal titulo="Novo contrato" botao="+ Contrato" classe="btn sm" action={salvarContrato}><ContratoCampos projeto={p} /></Modal>
            </div>
            {contratos.length ? (
              <div className="list">
                {contratos.map((k) => {
                  async function del() { 'use server'; await excluirContrato(k.id, p.id); }
                  return (
                    <div className="li" key={k.id}>
                      <div className="t"><strong>{k.descricao || 'Contrato'}</strong>
                        <span className="small">{brl(k.valor)} · enviado {data(k.enviado_em)}{k.assinado_em ? ' · assinado ' + data(k.assinado_em) : ''}{k.link && <> · <a href={k.link} target="_blank" rel="noreferrer">abrir</a></>}</span></div>
                      <div className="actions">
                        <span className={'tag ' + tomContrato[k.status]}>{STATUS_CONTRATO[k.status]}</span>
                        <Modal titulo="Editar contrato" botao="Editar" classe="btn sm" action={salvarContrato} extraFoot={<ConfirmButton action={del} />}><ContratoCampos k={k} projeto={p} /></Modal>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="small">Nenhum contrato registrado. Registre quando enviar a proposta e marque como assinado quando voltar.</p>}
          </section>

          <section className="card pad" id="agenda">
            <div className="card-head"><h2>Próximos compromissos</h2>
              {podeVer(u, 'agenda') && <Modal titulo="Novo compromisso" botao="+ Compromisso" classe="btn sm" action={salvarEvento}><EventoCampos fixo={{ projeto_id: p.id, cliente_id: p.cliente_id }} /></Modal>}
            </div>
            {eventos.length ? (
              <div className="list">{eventos.map((e) => (
                <div className="li" key={e.id}><div className="t"><strong>{e.titulo}</strong><span className="small">{data(e.data)}{e.hora ? ' às ' + e.hora : ''}{e.local ? ' · ' + e.local : ''}</span></div></div>
              ))}</div>
            ) : <p className="small">Reuniões, visitas de obra e entregas deste projeto aparecem aqui e na Agenda.</p>}
          </section>
        </div>

        {verFin && (
          <section className="card pad" id="financeiro">
            <div className="card-head"><h2>Financeiro do projeto</h2>
              <div className="actions">
                <Modal titulo="Gerar parcelas" botao="Gerar parcelas" classe="btn sm" action={gerarParcelas} enviar="Gerar cobranças">
                  <div className="form">
                    <input type="hidden" name="projeto_id" value={p.id} />
                    <label className="fld"><span>Valor total (R$)</span><input name="total" type="number" step="0.01" min="0" required defaultValue={contratoPrinc?.valor ?? p.valor ?? ''} /></label>
                    <label className="fld"><span>Entrada (R$, opcional)</span><input name="entrada" type="number" step="0.01" min="0" /></label>
                    <label className="fld"><span>Número de parcelas</span><input name="parcelas" type="number" min="1" max="48" defaultValue="4" /></label>
                    <label className="fld"><span>Primeiro vencimento</span><input name="primeira" type="date" required defaultValue={hoje()} /></label>
                    <label className="fld full"><span>Forma de pagamento</span><select name="forma" defaultValue="Pix"><option value="">—</option>{FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}</select></label>
                    <p className="small full" style={{ margin: 0 }}>Se houver entrada, ela vence na primeira data e as parcelas começam no mês seguinte.</p>
                  </div>
                </Modal>
                <Modal titulo="Nova cobrança" botao="+ Cobrança" classe="btn sm primary" action={salvarReceita}>
                  <FinCampos tipo="receitas" fixo={{ projeto_id: p.id, cliente_id: p.cliente_id }} />
                </Modal>
              </div>
            </div>
            <div className="kv" style={{ marginBottom: 12 }}>
              <div><span>Honorários / contrato</span><span className="num">{brl(contratoPrinc?.valor ?? p.valor)}</span></div>
              <div><span>Recebido</span><span className="num pos">{brl(recebido)}</span></div>
              <div><span>A receber</span><span className="num">{brl(cobrado - recebido)}</span></div>
              <div><span>Custos do projeto (despesas, compras, repasses)</span><span className="num neg">{brl(totalCustos)}</span></div>
              <div className="tot"><span>Resultado até agora</span><span className={'num ' + (recebido - totalCustos < 0 ? 'neg' : '')}>{brl(recebido - totalCustos)}</span></div>
            </div>
            {receitas.length > 0 && (
              <div className="table-wrap"><table className="tbl">
                <thead><tr><th>Vencimento</th><th>Descrição</th><th className="r">Valor</th><th>Situação</th><th></th></tr></thead>
                <tbody>{receitas.map((r) => {
                  const s = situacao(r);
                  async function tog() { 'use server'; await alternarPago('receitas', r.id); }
                  async function del() { 'use server'; await excluirLancamento('receitas', r.id); }
                  return (
                    <tr key={r.id}>
                      <td className="num">{data(r.vencimento)}</td>
                      <td>{r.descricao}{r.pago_em && <span className="sm">recebido em {data(r.pago_em)}{r.forma ? ' · ' + r.forma : ''}</span>}</td>
                      <td className="r num">{brl(r.valor)}</td>
                      <td><ActionButton action={tog} classe={'tag ' + (s === 'pago' ? 'ok' : s === 'atrasado' ? 'bad' : 'warn')} title="Clique para alternar">{s === 'pago' ? 'Recebido' : s === 'atrasado' ? 'Atrasado' : 'Pendente'}</ActionButton></td>
                      <td className="r" style={{ whiteSpace: 'nowrap' }}>
                        {r.pago_em && <Link className="btn sm" href={`/financeiro/recibo/${r.id}`}>Recibo</Link>}{' '}
                        <Modal titulo="Editar cobrança" botao="Editar" classe="btn sm" action={salvarReceita} extraFoot={<ConfirmButton action={del} />}>
                          <FinCampos tipo="receitas" l={r} fixo={{ projeto_id: p.id, cliente_id: p.cliente_id }} />
                        </Modal>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            )}
          </section>
        )}

        <section className="card pad" id="info">
          <div className="card-head"><h2>Informações</h2></div>
          <div className="kv">
            <div><span>Início</span><span>{data(p.inicio)}</span></div>
            <div><span>Previsão de entrega</span><span>{data(p.previsao)}</span></div>
            <div><span>Honorários</span><span className="num">{p.valor ? brl(p.valor) : '—'}</span></div>
            <div><span>Endereço da obra</span><span>{p.endereco_obra || '—'}</span></div>
          </div>
          {p.obs && <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{p.obs}</p>}
          <div className="form-foot" style={{ marginTop: 18 }}>
            <span className="small">Excluir o projeto apaga as etapas, contratos e compromissos dele. As cobranças ficam no Financeiro.</span>
            <ConfirmButton action={excluir}>Excluir projeto</ConfirmButton>
          </div>
        </section>
      </div>
    </>
  );
}
