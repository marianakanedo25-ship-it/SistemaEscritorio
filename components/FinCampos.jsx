import { FORMAS_PAGAMENTO, CATEGORIAS_DESPESA, hoje } from '@/lib/format';

function Sel({ name, label, opcoes, valor, vazio = '—', full }) {
  return (
    <label className={'fld' + (full ? ' full' : '')}><span>{label}</span>
      <select name={name} defaultValue={valor ?? ''}>
        <option value="">{vazio}</option>
        {opcoes.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}
      </select>
    </label>
  );
}

/** Campos de um lançamento financeiro, por tipo. */
export default function FinCampos({ tipo, l = {}, clientes = [], projetos = [], fixo = {} }) {
  const cli = clientes.map((c) => [c.id, c.nome]);
  const proj = projetos.map((p) => [p.id, p.nome + (p.cliente ? ' — ' + p.cliente : '')]);
  const id = l.id ? <input type="hidden" name="id" value={l.id} /> : null;
  const hid = Object.entries(fixo).map(([k, v]) => <input key={k} type="hidden" name={k} value={v ?? ''} />);
  const pagoBox = (rot) => !l.id && (
    <label className="check full"><input type="checkbox" name="pago" value="1" /> {rot}</label>
  );

  if (tipo === 'receitas') return (
    <div className="form">{id}{hid}
      <label className="fld full"><span>Descrição *</span><input name="descricao" required defaultValue={l.descricao || ''} placeholder="Ex.: 2ª parcela — anteprojeto" /></label>
      {!('cliente_id' in fixo) && <Sel name="cliente_id" label="Cliente" opcoes={cli} valor={l.cliente_id} />}
      {!('projeto_id' in fixo) && <Sel name="projeto_id" label="Projeto" opcoes={proj} valor={l.projeto_id} />}
      <label className="fld"><span>Valor (R$) *</span><input name="valor" type="number" step="0.01" min="0" required defaultValue={l.valor ?? ''} /></label>
      <label className="fld"><span>Vencimento *</span><input name="vencimento" type="date" required defaultValue={l.vencimento || hoje()} /></label>
      <Sel name="forma" label="Forma de pagamento" opcoes={FORMAS_PAGAMENTO} valor={l.forma} />
      {l.id ? <label className="fld"><span>Recebido em</span><input name="pago_em" type="date" defaultValue={l.pago_em || ''} /></label> : <input type="hidden" name="pago_em" value="" />}
      {pagoBox('Já recebi este valor (marca como recebido hoje)')}
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={l.obs || ''} /></label>
    </div>
  );

  if (tipo === 'despesas') return (
    <div className="form">{id}{hid}
      <label className="fld full"><span>Descrição *</span><input name="descricao" required defaultValue={l.descricao || ''} placeholder="Ex.: Aluguel da sala" /></label>
      <Sel name="categoria" label="Categoria" opcoes={CATEGORIAS_DESPESA} valor={l.categoria} />
      <label className="fld"><span>Fornecedor</span><input name="fornecedor" defaultValue={l.fornecedor || ''} /></label>
      <label className="fld"><span>Valor (R$) *</span><input name="valor" type="number" step="0.01" min="0" required defaultValue={l.valor ?? ''} /></label>
      <label className="fld"><span>Vencimento *</span><input name="vencimento" type="date" required defaultValue={l.vencimento || hoje()} /></label>
      <Sel name="forma" label="Forma de pagamento" opcoes={FORMAS_PAGAMENTO} valor={l.forma} />
      <Sel name="projeto_id" label="Projeto (se for de um cliente)" opcoes={proj} valor={l.projeto_id} vazio="Despesa do escritório" />
      {l.id ? <label className="fld"><span>Pago em</span><input name="pago_em" type="date" defaultValue={l.pago_em || ''} /></label> : (
        <>
          <input type="hidden" name="pago_em" value="" />
          <label className="fld"><span>Repetir todo mês por</span>
            <select name="repetir" defaultValue="1">{[1, 2, 3, 6, 12, 24].map((n) => <option key={n} value={n}>{n === 1 ? 'Não repetir' : n + ' meses'}</option>)}</select>
          </label>
        </>
      )}
      {pagoBox('Já paguei (marca como pago hoje)')}
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={l.obs || ''} /></label>
    </div>
  );

  if (tipo === 'notas_fiscais') return (
    <div className="form">{id}{hid}
      <label className="fld"><span>Número da nota</span><input name="numero" defaultValue={l.numero || ''} /></label>
      <label className="fld"><span>Data de emissão *</span><input name="emissao" type="date" required defaultValue={l.emissao || hoje()} /></label>
      <Sel name="cliente_id" label="Cliente" opcoes={cli} valor={l.cliente_id} />
      <Sel name="projeto_id" label="Projeto" opcoes={proj} valor={l.projeto_id} />
      <label className="fld"><span>Valor (R$) *</span><input name="valor" type="number" step="0.01" min="0" required defaultValue={l.valor ?? ''} /></label>
      <Sel name="status" label="Situação" opcoes={[['emitida', 'Emitida'], ['enviada', 'Enviada ao cliente'], ['cancelada', 'Cancelada']]} valor={l.status || 'emitida'} vazio="Emitida" />
      <label className="fld full"><span>Link do PDF/XML</span><input name="link" type="url" defaultValue={l.link || ''} placeholder="https://…" /></label>
      <input type="hidden" name="receita_id" value={l.receita_id || ''} />
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={l.obs || ''} /></label>
    </div>
  );

  if (tipo === 'compras') return (
    <div className="form">{id}{hid}
      <label className="fld full"><span>O que foi comprado *</span><input name="descricao" required defaultValue={l.descricao || ''} placeholder="Ex.: Amostras de revestimento, plotter, papel…" /></label>
      <label className="fld"><span>Fornecedor / loja</span><input name="fornecedor" defaultValue={l.fornecedor || ''} /></label>
      <Sel name="projeto_id" label="Projeto" opcoes={proj} valor={l.projeto_id} vazio="Uso do escritório" />
      <label className="fld"><span>Valor (R$) *</span><input name="valor" type="number" step="0.01" min="0" required defaultValue={l.valor ?? ''} /></label>
      <label className="fld"><span>Data *</span><input name="data" type="date" required defaultValue={l.data || hoje()} /></label>
      <Sel name="status" label="Situação" opcoes={[['orcado', 'Orçado'], ['pedido', 'Pedido feito'], ['entregue', 'Entregue'], ['cancelado', 'Cancelado']]} valor={l.status || 'orcado'} vazio="Orçado" />
      {l.id ? <label className="fld"><span>Pago em</span><input name="pago_em" type="date" defaultValue={l.pago_em || ''} /></label> : <input type="hidden" name="pago_em" value="" />}
      {pagoBox('Já paguei (marca como pago hoje)')}
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={l.obs || ''} /></label>
    </div>
  );

  if (tipo === 'repasses') return (
    <div className="form">{id}{hid}
      <label className="fld"><span>Parceiro / profissional *</span><input name="parceiro" required defaultValue={l.parceiro || ''} placeholder="Ex.: Projetista de elétrica" /></label>
      <Sel name="projeto_id" label="Projeto" opcoes={proj} valor={l.projeto_id} />
      <label className="fld full"><span>Serviço</span><input name="descricao" defaultValue={l.descricao || ''} placeholder="Ex.: Renderização de 6 imagens" /></label>
      <label className="fld"><span>Valor (R$) *</span><input name="valor" type="number" step="0.01" min="0" required defaultValue={l.valor ?? ''} /></label>
      <label className="fld"><span>Vencimento *</span><input name="vencimento" type="date" required defaultValue={l.vencimento || hoje()} /></label>
      <Sel name="forma" label="Forma de pagamento" opcoes={FORMAS_PAGAMENTO} valor={l.forma} />
      {l.id ? <label className="fld"><span>Pago em</span><input name="pago_em" type="date" defaultValue={l.pago_em || ''} /></label> : <input type="hidden" name="pago_em" value="" />}
      {pagoBox('Já paguei (marca como pago hoje)')}
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={l.obs || ''} /></label>
    </div>
  );

  if (tipo === 'servicos') return (
    <div className="form">{id}
      <label className="fld full"><span>Serviço *</span><input name="nome" required defaultValue={l.nome || ''} placeholder="Ex.: Projeto de interiores completo" /></label>
      <label className="fld"><span>Valor (R$)</span><input name="valor" type="number" step="0.01" min="0" defaultValue={l.valor ?? ''} /></label>
      <label className="fld"><span>Cobrado por</span>
        <select name="unidade" defaultValue={l.unidade || 'm²'}>{['m²', 'projeto', 'ambiente', 'hora', 'visita', 'mês'].map((u) => <option key={u}>{u}</option>)}</select>
      </label>
      <label className="fld full"><span>O que inclui</span><textarea name="descricao" defaultValue={l.descricao || ''} /></label>
    </div>
  );
  return null;
}
