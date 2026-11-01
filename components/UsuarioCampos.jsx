export default function UsuarioCampos({ u = {}, abas, souEu }) {
  return (
    <div className="form">
      {u.id && <input type="hidden" name="id" value={u.id} />}
      <label className="fld"><span>Nome *</span><input name="nome" required defaultValue={u.nome || ''} /></label>
      <label className="fld"><span>E-mail (login) *</span><input name="email" type="email" required defaultValue={u.email || ''} /></label>
      <label className="fld"><span>Cargo</span><input name="cargo" defaultValue={u.cargo || ''} placeholder="Ex.: Arquiteta júnior, Estagiária" /></label>
      <label className="fld"><span>{u.id ? 'Nova senha (deixe vazio para manter)' : 'Senha inicial *'}</span><input name="senha" type="password" minLength={8} autoComplete="new-password" /></label>
      <label className="fld"><span>Nível de acesso</span>
        <select name="papel" defaultValue={u.papel || 'membro'}>
          <option value="admin">Administradora: acesso total</option>
          <option value="membro">Equipe: só as abas marcadas</option>
        </select>
      </label>
      <label className="fld"><span>Situação</span>
        <select name="ativo" defaultValue={u.ativo === false ? '0' : '1'} disabled={souEu}><option value="1">Ativo</option><option value="0">Desativado</option></select>
      </label>
      <fieldset className="fld full" style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '12px 14px', margin: 0 }}>
        <legend className="small" style={{ padding: '0 6px' }}>Abas que pode ver (para nível Equipe)</legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {abas.map((a) => (
            <label className="check" key={a.id}><input type="checkbox" name="abas" value={a.id} defaultChecked={(u.abas || []).includes(a.id)} /> {a.nome}</label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
