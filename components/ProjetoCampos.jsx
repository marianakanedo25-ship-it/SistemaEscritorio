import { TIPOS_PROJETO, STATUS_PROJETO, CORES_PROJETO } from '@/lib/format';

export default function ProjetoCampos({ p = {}, clientes = [], novo = false, clienteFixo }) {
  return (
    <div className="form">
      {p.id && <input type="hidden" name="id" value={p.id} />}
      {clienteFixo ? <input type="hidden" name="cliente_id" value={clienteFixo} /> : (
        <label className="fld"><span>Cliente</span>
          <select name="cliente_id" defaultValue={p.cliente_id || ''}>
            <option value="">Sem cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
      )}
      <label className={'fld' + (clienteFixo ? ' full' : '')}><span>Nome do projeto *</span><input name="nome" required defaultValue={p.nome || ''} placeholder="Ex.: Apartamento Setor Bueno" /></label>
      <label className="fld"><span>Tipo</span>
        <select name="tipo" defaultValue={p.tipo || TIPOS_PROJETO[0]}>{TIPOS_PROJETO.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label className="fld"><span>Situação</span>
        <select name="status" defaultValue={p.status || 'andamento'}>{Object.entries(STATUS_PROJETO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </label>
      <label className="fld"><span>Área (m²)</span><input name="area" type="number" step="0.01" min="0" defaultValue={p.area ?? ''} /></label>
      <label className="fld"><span>Valor dos honorários (R$)</span><input name="valor" type="number" step="0.01" min="0" defaultValue={p.valor ?? ''} /></label>
      <label className="fld"><span>Início</span><input name="inicio" type="date" defaultValue={p.inicio || ''} /></label>
      <label className="fld"><span>Previsão de entrega</span><input name="previsao" type="date" defaultValue={p.previsao || ''} /></label>
      <label className="fld full"><span>Endereço da obra</span><input name="endereco_obra" defaultValue={p.endereco_obra || ''} /></label>
      <label className="fld full"><span>Pasta do projeto no Google Drive (link)</span><input name="pasta_drive" type="url" defaultValue={p.pasta_drive || ''} placeholder="https://drive.google.com/…" /></label>
      <fieldset className="fld full" style={{ border: 0, padding: 0, margin: 0 }}>
        <span>Cor na agenda{novo ? ' (automática: o sistema escolhe uma cor que nenhum outro projeto está usando)' : ''}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {novo && (
            <label style={{ cursor: 'pointer', position: 'relative' }}>
              <input type="radio" name="cor" value="" defaultChecked style={{ position: 'absolute', opacity: 0 }} />
              <span className="cor-op cor-auto">Automática</span>
            </label>
          )}
          {CORES_PROJETO.map((cor, i) => (
            <label key={cor} style={{ cursor: 'pointer', position: 'relative' }}>
              <input type="radio" name="cor" value={cor} defaultChecked={!novo && (p.cor || CORES_PROJETO[0]).toLowerCase() === cor.toLowerCase()} style={{ position: 'absolute', opacity: 0 }} />
              <span className="dot cor-op" style={{ width: 26, height: 26, background: cor }} aria-label={`Cor ${i + 1}`} />
            </label>
          ))}
        </div>
      </fieldset>
      {novo && (
        <label className="check full"><input type="checkbox" name="etapas_padrao" value="1" defaultChecked /> Criar com as etapas padrão do escritório (você ajusta os prazos depois)</label>
      )}
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={p.obs || ''} /></label>
    </div>
  );
}
