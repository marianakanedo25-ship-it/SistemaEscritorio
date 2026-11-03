'use client';
import { useMemo, useState, useTransition } from 'react';
import { montarContrato, addMeses } from '@/lib/contrato-kitnet';

const umDia = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const isoOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

export default function ContratoEditor({ id, grupo, inicial, temDadosLocador, salvar }) {
  const [d, setD] = useState(inicial);
  const [sujo, setSujo] = useState(false);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const set = (patch) => { setD((x) => ({ ...x, ...patch })); setSujo(true); };
  const setIn = (grupoCampo, patch) => { setD((x) => ({ ...x, [grupoCampo]: { ...x[grupoCampo], ...patch } })); setSujo(true); };
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const { blocos, resumo } = useMemo(() => montarContrato(d), [d]);
  const T = d.locatario, L = d.locador, F = d.fiador;

  const faltando = [
    !T.nome && 'nome da parte locatária', !T.cpf && 'CPF da parte locatária',
    !L.cpf && 'CPF do locador', !L.endereco && 'endereço do locador', !L.pix && 'chave PIX',
    !isoOk(d.inicio) && 'início', !isoOk(d.fim) && 'fim', !Number(d.aluguel) && 'valor do aluguel', !Number(d.vencimentoDia) && 'dia do vencimento',
    d.usarFiador && !F.nome && 'nome do fiador',
  ].filter(Boolean);

  async function gravar() {
    const r = await salvar(id, d);
    if (r?.erro) { flash(r.erro); return false; }
    setSujo(false);
    return true;
  }
  function gerarPdf() {
    start(async () => {
      if (sujo && !(await gravar())) return;
      const antes = document.title;
      document.title = `Contrato Kitnet ${String(d.kitnet).padStart(2, '0')} ${grupo} - ${T.nome || 'locatário'}`.replace(/[\\/:*?"<>|]/g, '');
      window.print();
      setTimeout(() => { document.title = antes; }, 500);
    });
  }
  function renovar() {
    if (!isoOk(d.fim)) return flash('Preencha o fim do contrato atual primeiro.');
    const ini = umDia(d.fim, 1);
    set({ inicio: ini, fim: umDia(addMeses(ini, 12), -1), dataAssinatura: ini, antecipado: '' });
    flash('Datas da renovação preenchidas: confira o valor do aluguel');
  }
  function novoInquilino() {
    set({ locatario: { nome: '', qualificacao: '', rg: '', cpf: '', residencia: 'Silvânia Go, CEP 75180-000' }, antecipado: '', usarFiador: false, fiador: { nome: '', qualificacao: '', rg: '', cpf: '', endereco: '' } });
    flash('Dados da parte locatária limpos');
  }

  const campo = (rotulo, valor, onChange, props = {}) => (
    <label className={'fld' + (props.full ? ' full' : '')}><span>{rotulo}</span>
      {props.area
        ? <textarea rows={props.rows || 3} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={props.placeholder} />
        : <input type={props.type || 'text'} step={props.step} min={props.min} max={props.max} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={props.placeholder} />}
    </label>
  );
  const BR = (iso) => (isoOk(iso) ? iso.split('-').reverse().join('/') : '—');

  return (
    <div className="prop-grid">
      <div className="prop-edit no-print">
        <div className="card pad stack" style={{ gap: 16 }}>
          <div className="card-head" style={{ marginBottom: 0 }}>
            <h2>Contrato · Kitnet {String(d.kitnet).padStart(2, '0')} · {grupo}</h2>
            <span className="small" role="status">{msg || (sujo ? 'Alterações não salvas' : 'Salvo')}</span>
          </div>
          <div className="actions">
            <button type="button" className="btn primary" disabled={pending} onClick={gerarPdf}>{pending ? 'Preparando…' : 'Gerar PDF'}</button>
            <button type="button" className="btn" disabled={pending || !sujo} onClick={() => start(async () => { if (await gravar()) flash('Dados salvos na kitnet'); })}>Salvar</button>
          </div>
          <div className="actions">
            <button type="button" className="btn sm" onClick={renovar}>Renovar por mais 12 meses</button>
            <button type="button" className="btn sm" onClick={novoInquilino}>Novo inquilino</button>
          </div>
          <p className="small" style={{ margin: 0 }}>Preencha só os dados; o texto do contrato se atualiza ao lado. Em “Gerar PDF”, escolha <strong>Salvar como PDF</strong>. Ao salvar, o inquilino, o aluguel e as datas também são atualizados na aba Kitnets.</p>
          {faltando.length > 0 && <div className="notice" style={{ margin: 0 }}>Faltam: {faltando.join(', ')}. Esses pontos saem como “__________” no contrato.</div>}

          <fieldset className="kc-grupo"><legend>Parte locatária</legend>
            <div className="form">
              {campo('Nome completo', T.nome, (v) => setIn('locatario', { nome: v }), { full: true })}
              {campo('Nacionalidade, profissão e estado civil', T.qualificacao, (v) => setIn('locatario', { qualificacao: v }), { full: true, placeholder: 'brasileira, médica, solteira' })}
              {campo('RG (opcional)', T.rg, (v) => setIn('locatario', { rg: v }), { placeholder: '0000000 SSP/GO' })}
              {campo('CPF', T.cpf, (v) => setIn('locatario', { cpf: v }), { placeholder: '000.000.000-00' })}
              {campo('Residente em', T.residencia, (v) => setIn('locatario', { residencia: v }), { full: true })}
            </div>
          </fieldset>

          <fieldset className="kc-grupo"><legend>Locação</legend>
            <div className="form">
              {campo('Início', d.inicio, (v) => set({ inicio: v }), { type: 'date' })}
              {campo('Fim', d.fim, (v) => set({ fim: v }), { type: 'date' })}
              {campo('Aluguel (R$)', d.aluguel, (v) => set({ aluguel: v }), { type: 'number', step: '0.01', min: '0' })}
              {campo('Dia do vencimento', d.vencimentoDia, (v) => set({ vencimentoDia: v }), { type: 'number', min: '1', max: '31' })}
              {campo('Energia inclusa (kWh)', d.franquia, (v) => set({ franquia: v }), { type: 'number', min: '0' })}
              {campo('Nº da kitnet', d.kitnet, (v) => set({ kitnet: v }), { type: 'number', min: '1' })}
            </div>
            <p className="small" style={{ margin: '8px 0 0' }}>{resumo.meses} meses · 1º pagamento {BR(resumo.primeiro)} · último {BR(resumo.ultimo)} · aviso de saída até {BR(resumo.aviso)}</p>
            {campo('Pagamento antecipado (opcional; vira um parágrafo da cláusula do aluguel)', d.antecipado, (v) => set({ antecipado: v }), { area: true, full: true, placeholder: 'Ex.: A parte Locatária efetuou o pagamento antecipado de R$ 4.950,00 em 23/06/2026, correspondente aos aluguéis de julho, agosto e setembro de 2026…' })}
          </fieldset>

          <fieldset className="kc-grupo"><legend>Imóvel</legend>
            <div className="form">
              {campo('Unidade consumidora de água', d.ucAgua, (v) => set({ ucAgua: v }))}
              {campo('Composição (vazio = padrão do bairro)', d.composicao, (v) => set({ composicao: v }), { area: true, rows: 2, full: true, placeholder: L.composicao })}
            </div>
          </fieldset>

          <fieldset className="kc-grupo"><legend>Garantia</legend>
            <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={!!d.usarFiador} onChange={(e) => set({ usarFiador: e.target.checked })} /> Tem fiador
            </label>
            {d.usarFiador && (
              <div className="form" style={{ marginTop: 8 }}>
                {campo('Nome do fiador', F.nome, (v) => setIn('fiador', { nome: v }), { full: true })}
                {campo('Nacionalidade, profissão e estado civil', F.qualificacao, (v) => setIn('fiador', { qualificacao: v }), { full: true })}
                {campo('RG (opcional)', F.rg, (v) => setIn('fiador', { rg: v }))}
                {campo('CPF', F.cpf, (v) => setIn('fiador', { cpf: v }))}
                {campo('Endereço', F.endereco, (v) => setIn('fiador', { endereco: v }), { full: true })}
              </div>
            )}
          </fieldset>

          <fieldset className="kc-grupo"><legend>Assinatura</legend>
            <div className="form">
              {campo('Cidade', d.cidade, (v) => set({ cidade: v }))}
              {campo('Data', d.dataAssinatura, (v) => set({ dataAssinatura: v }), { type: 'date' })}
            </div>
          </fieldset>

          <details className="kc-grupo" open={!temDadosLocador}>
            <summary><strong>Locador · {grupo}</strong> <span className="small">(vale para todas as kitnets do bairro)</span></summary>
            <div className="form" style={{ marginTop: 10 }}>
              {campo('Nome', L.nome, (v) => setIn('locador', { nome: v }), { full: true })}
              {campo('Nacionalidade e estado civil', L.qualificacao, (v) => setIn('locador', { qualificacao: v }), { full: true })}
              {campo('RG (opcional)', L.rg, (v) => setIn('locador', { rg: v }))}
              {campo('CPF', L.cpf, (v) => setIn('locador', { cpf: v }))}
              {campo('Endereço (residente e domiciliado na…)', L.endereco, (v) => setIn('locador', { endereco: v }), { full: true, placeholder: 'Rua…, nº, bairro, Silvânia Go CEP 75180-000' })}
              {campo('Chave PIX', L.pix, (v) => setIn('locador', { pix: v }))}
              {campo('Titular do PIX', L.pixTitular, (v) => setIn('locador', { pixTitular: v }))}
              {campo('Endereço do imóvel ({kitnet} = número)', L.imovel, (v) => setIn('locador', { imovel: v }), { area: true, rows: 2, full: true })}
              {campo('Composição padrão das kitnets', L.composicao, (v) => setIn('locador', { composicao: v }), { area: true, rows: 2, full: true })}
            </div>
          </details>
        </div>
      </div>

      <div className="prop-preview">
        <article className="contrato">
          {blocos.map((b, i) => {
            if (b.t === 'titulo') return <h1 key={i}>{b.texto}</h1>;
            if (b.t === 'secao') return <h2 key={i}>{b.texto}</h2>;
            if (b.t === 'local') return <p key={i} className="ct-local">{b.texto}</p>;
            if (b.t === 'ass') return (
              <div key={i} className="ct-ass">
                {b.partes.map((p, j) => (
                  <div key={j}><span className="linha" /><strong>{p.papel}: {p.nome || '__________'}</strong><br />CPF: {p.cpf || '__________'}</div>
                ))}
                <div><span className="linha" />Testemunha 1<br />CPF:</div>
                <div><span className="linha" />Testemunha 2<br />CPF:</div>
              </div>
            );
            return <p key={i} className={'ct-' + b.t}>{b.rotulo && <strong>{b.rotulo} </strong>}{b.texto}</p>;
          })}
        </article>
      </div>
    </div>
  );
}
