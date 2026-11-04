import Link from 'next/link';
import { q } from '@/lib/db';
import { exigir } from '@/lib/auth';
import { brl, data } from '@/lib/format';
import { calcLeitura, nomeUnidade, situacaoContrato } from '@/lib/kitnets';
import Modal from '@/components/Modal';
import ActionButton from '@/components/ActionButton';
import { UnidadeCampos } from '@/components/KitCampos';
import { importarKitnets, salvarUnidade, salvarLeitura, alternarPagoLeitura, excluirLeitura, salvarLeiturasLote } from './actions';
import EnergiaTabela from './EnergiaTabela';

export const metadata = { title: 'Kitnets' };

export default async function KitnetsPage({ searchParams }) {
  await exigir('kitnets');
  const sp = await searchParams;
  const [todas, recentes] = await Promise.all([
    q('SELECT * FROM kit_unidades ORDER BY grupo DESC, numero'),
    // As 4 leituras mais recentes de cada kitnet
    q(`SELECT * FROM (SELECT l.*, row_number() OVER (PARTITION BY unidade_id ORDER BY data_atual DESC, id DESC) AS n FROM kit_leituras l) x
       WHERE n <= 4 ORDER BY unidade_id, data_atual, id`),
  ]);

  if (!todas.length) {
    return (
      <>
        <div className="page-head"><div><h1>Kitnets</h1><p className="sub">Contratos, aluguéis e controle de energia das kitnets. Estes valores não entram no financeiro do escritório.</p></div></div>
        <div className="empty" style={{ textAlign: 'left' }}>
          <strong>Nenhuma kitnet cadastrada</strong>
          <p style={{ margin: '6px 0 14px' }}>Já li os contratos e as planilhas de energia das pastas do seu Drive: 5 kitnets em Nossa Senhora de Fátima e 3 no Centro, com inquilino, aluguel, vencimento, vigência e as leituras de energia.</p>
          <div className="actions">
            <ActionButton action={importarKitnets} classe="btn primary">Importar dados do Drive</ActionButton>
            <Modal titulo="Nova kitnet" botao="Cadastrar manualmente" action={salvarUnidade} enviar="Cadastrar"><UnidadeCampos /></Modal>
          </div>
        </div>
      </>
    );
  }

  // Uma aba por bairro: Centro primeiro, depois os demais em ordem alfabética.
  const grupos = [...new Set(todas.map((u) => u.grupo))].sort((a, b) => (a === 'Centro' ? -1 : b === 'Centro' ? 1 : a.localeCompare(b, 'pt-BR')));
  const grupo = grupos.includes(sp?.g) ? sp.g : grupos[0];
  const unidades = todas.filter((u) => u.grupo === grupo);
  const gq = '&g=' + encodeURIComponent(grupo);
  const historicoDe = {};
  for (const l of recentes) (historicoDe[l.unidade_id] ||= []).push(l);
  const ultimaDe = Object.fromEntries(Object.entries(historicoDe).map(([id, h]) => [id, h[h.length - 1]]));
  const totalAluguel = unidades.reduce((s, u) => s + Number(u.aluguel), 0);
  // Energia em aberto: últimas leituras ainda não marcadas como pagas
  const energiaAberto = unidades.reduce((s, u) => s + (historicoDe[u.id] || []).filter((l) => !l.pago_em).reduce((t, l) => t + calcLeitura(l).total, 0), 0);
  const ultimaData = unidades.map((u) => ultimaDe[u.id]?.data_atual).filter(Boolean).sort().pop();
  const alerta = unidades.filter((u) => ['bad', 'warn'].includes(situacaoContrato(u).tom));

  return (
    <>
      <div className="page-head">
        <div><h1>Kitnets</h1><p className="sub">Contratos, aluguéis e energia. Separado do financeiro do escritório.</p></div>
        <Modal titulo="Nova kitnet" botao="+ Nova kitnet" classe="btn primary" action={salvarUnidade} enviar="Cadastrar"><UnidadeCampos grupos={grupos} u={{ grupo, numero: unidades.length + 1 }} /></Modal>
      </div>

      <nav className="tabs">
        {grupos.map((g) => (
          <a key={g} href={`/kitnets?g=${encodeURIComponent(g)}`} className={g === grupo ? 'on' : ''}>
            {g} <span className="small">({todas.filter((u) => u.grupo === g).length})</span>
          </a>
        ))}
      </nav>

      <div className="stats">
        <div className="card stat"><span className="lbl">Unidades</span><span className="val">{unidades.length}</span><span className="hint">{unidades[0]?.endereco || grupo}</span></div>
        <div className="card stat"><span className="lbl">Aluguéis por mês</span><span className="val">{brl(totalAluguel)}</span><span className="hint">Soma dos contratos</span></div>
        <div className="card stat"><span className="lbl">Energia em aberto</span><span className="val wrn">{brl(energiaAberto)}</span><span className="hint">Últimas leituras não pagas{ultimaData ? ` · última em ${data(ultimaData)}` : ''}</span></div>
        <div className="card stat"><span className="lbl">Contratos</span><span className={'val ' + (alerta.length ? 'neg' : '')}>{alerta.length ? alerta.length + ' atenção' : 'Em dia'}</span><span className="hint">{alerta.length ? alerta.map((u) => nomeUnidade(u)).join(', ') : 'Nenhum vencido ou vencendo em 60 dias'}</span></div>
      </div>

      <div style={{ margin: '8px 0 12px' }}>
        <h2>Unidades e contratos · {grupo}</h2>
        <p className="sub" style={{ marginTop: 2 }}>Em “Contrato” e “Vistoria”, os modelos já estão prontos: preencha os dados e gere o PDF.</p>
      </div>
      <div className="card table-wrap" style={{ marginBottom: 28 }}>
        <table className="tbl">
          <thead><tr><th>Unidade</th><th>Inquilino</th><th className="r">Aluguel</th><th>Vencimento</th><th>Início</th><th>Fim do contrato</th><th></th></tr></thead>
          <tbody>
            {unidades.map((u) => {
                const sc = situacaoContrato(u);
                return (
                  <tr key={u.id}>
                    <td><Link className="row-link" href={`/kitnets/${u.id}`}>{nomeUnidade(u)}</Link></td>
                    <td>{u.inquilino || <span className="small">Vaga</span>}</td>
                    <td className="r num">{brl(u.aluguel)}</td>
                    <td className="num">{u.vencimento_dia ? `Dia ${String(u.vencimento_dia).padStart(2, '0')}` : '—'}</td>
                    <td className="num">{data(u.inicio)}</td>
                    <td><span className={'tag ' + sc.tom}>{sc.texto}</span></td>
                    <td className="r" style={{ whiteSpace: 'nowrap' }}><Link className="btn sm" href={`/kitnets/${u.id}/contrato`}>Contrato</Link> <Link className="btn sm" href={`/kitnets/${u.id}/vistoria`}>Vistoria</Link> <Link className="btn sm" href={`/kitnets/${u.id}`}>Abrir</Link></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h2>Controle de energia</h2>
        <p className="sub" style={{ marginTop: 2 }}>As 4 últimas leituras de cada kitnet e a linha para digitar a próxima. Cobra-se só o que passar da energia inclusa no aluguel; as linhas em amarelo passaram do limite.</p>
      </div>
      <EnergiaTabela
        key={grupo + ':' + unidades.map((u) => { const l = ultimaDe[u.id]; return l ? `${l.id}-${l.data_atual}-${l.leitura_atual}-${l.valor_kwh}` : ''; }).join('|')}
        unidades={unidades.map((u) => ({ id: u.id, numero: u.numero, grupo: u.grupo, inquilino: u.inquilino, aluguel: u.aluguel, franquia_kwh: u.franquia_kwh, valor_kwh: u.valor_kwh, historico: (historicoDe[u.id] || []).map(({ criado_em, n, ...l }) => l) }))}
        salvarLote={salvarLeiturasLote}
        salvarLeitura={salvarLeitura}
        excluirLeitura={excluirLeitura}
        alternarPago={alternarPagoLeitura}
      />
    </>
  );
}
