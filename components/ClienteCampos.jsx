// Campos do cadastro completo de cliente (usado no "Novo cliente" e na edição).
export default function ClienteCampos({ c = {}, rapido = false }) {
  if (rapido) {
    return (
      <div className="form">
        <label className="fld full"><span>Nome *</span><input name="nome" required defaultValue={c.nome || ''} /></label>
        <label className="fld full"><span>Telefone / WhatsApp</span><input name="telefone" type="tel" defaultValue={c.telefone || ''} placeholder="(62) 99999-9999" /></label>
      </div>
    );
  }
  return (
    <div className="form">
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <label className="fld full"><span>Nome completo *</span><input name="nome" required defaultValue={c.nome || ''} /></label>
      <label className="fld"><span>Telefone / WhatsApp</span><input name="telefone" type="tel" defaultValue={c.telefone || ''} placeholder="(62) 99999-9999" /></label>
      <label className="fld"><span>E-mail</span><input name="email" type="email" defaultValue={c.email || ''} /></label>
      <label className="fld"><span>CPF / CNPJ</span><input name="documento" defaultValue={c.documento || ''} /></label>
      <label className="fld"><span>Data de nascimento</span><input name="nascimento" type="date" defaultValue={c.nascimento || ''} /></label>
      <label className="fld"><span>Profissão</span><input name="profissao" defaultValue={c.profissao || ''} /></label>
      <label className="fld"><span>Como chegou ao escritório</span>
        <select name="origem" defaultValue={c.origem || ''}>
          <option value="">—</option>
          {['Indicação', 'Instagram', 'Google', 'Site', 'Loja', 'Cliente recorrente', 'Parceiro', 'Outro'].map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <label className="fld full"><span>Endereço</span><input name="endereco" defaultValue={c.endereco || ''} /></label>
      <label className="fld"><span>Cidade</span><input name="cidade" defaultValue={c.cidade || ''} /></label>
      <label className="fld"><span>Pasta no Google Drive (link)</span><input name="pasta_drive" type="url" defaultValue={c.pasta_drive || ''} placeholder="https://drive.google.com/…" /></label>
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={c.obs || ''} /></label>
    </div>
  );
}
