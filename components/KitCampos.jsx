'use client';
import { useState } from 'react';
import { brl, numero, hoje } from '@/lib/format';
import { calcLeitura } from '@/lib/kitnets';

export function UnidadeCampos({ u = {}, grupos = [] }) {
  return (
    <div className="form">
      {u.id && <input type="hidden" name="id" value={u.id} />}
      <label className="fld"><span>Grupo / prédio *</span>
        <input name="grupo" list="kit-grupos" required defaultValue={u.grupo || ''} placeholder="Ex.: Centro" />
        <datalist id="kit-grupos">{grupos.map((g) => <option key={g} value={g} />)}</datalist>
      </label>
      <label className="fld"><span>Número da kitnet</span><input name="numero" type="number" min="1" defaultValue={u.numero ?? 1} /></label>
      <label className="fld full"><span>Endereço</span><input name="endereco" defaultValue={u.endereco || ''} /></label>
      <label className="fld"><span>Inquilino</span><input name="inquilino" defaultValue={u.inquilino || ''} /></label>
      <label className="fld"><span>Telefone</span><input name="telefone" type="tel" defaultValue={u.telefone || ''} /></label>
      <label className="fld"><span>Valor do aluguel (R$)</span><input name="aluguel" type="number" step="0.01" min="0" defaultValue={u.aluguel ?? ''} /></label>
      <label className="fld"><span>Dia do vencimento</span><input name="vencimento_dia" type="number" min="1" max="31" defaultValue={u.vencimento_dia ?? ''} /></label>
      <label className="fld"><span>Início do contrato</span><input name="inicio" type="date" defaultValue={u.inicio || ''} /></label>
      <label className="fld"><span>Fim do contrato</span><input name="fim" type="date" defaultValue={u.fim || ''} /></label>
      <label className="fld"><span>Energia inclusa no aluguel (kWh)</span><input name="franquia_kwh" type="number" step="1" min="0" defaultValue={u.franquia_kwh ?? 150} /></label>
      <label className="fld"><span>Valor do kWh (R$)</span><input name="valor_kwh" type="number" step="0.001" min="0" defaultValue={u.valor_kwh ?? 0.9} /></label>
      <label className="fld"><span>Locador no contrato</span><input name="locador" defaultValue={u.locador || ''} /></label>
      <label className="fld"><span>Unidade consumidora de água</span><input name="uc_agua" defaultValue={u.uc_agua || ''} /></label>
      <label className="fld full"><span>Pasta no Drive (link)</span><input name="pasta_drive" type="url" defaultValue={u.pasta_drive || ''} /></label>
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={u.obs || ''} /></label>
    </div>
  );
}

export function LeituraCampos({ l = {}, unidade, sugestao = {} }) {
  const [v, setV] = useState({
    data_anterior: l.data_anterior ?? sugestao.data_anterior ?? '',
    leitura_anterior: l.leitura_anterior ?? sugestao.leitura_anterior ?? '',
    data_atual: l.data_atual ?? hoje(),
    leitura_atual: l.leitura_atual ?? '',
    valor_kwh: l.valor_kwh ?? unidade.valor_kwh ?? 0.9,
    franquia_kwh: l.franquia_kwh ?? unidade.franquia_kwh ?? 150,
  });
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));
  const c = calcLeitura(v);
  const preenchido = v.leitura_atual !== '' && v.leitura_anterior !== '';
  return (
    <div className="form">
      {l.id && <input type="hidden" name="id" value={l.id} />}
      <input type="hidden" name="unidade_id" value={unidade.id} />
      <input type="hidden" name="pago_em" value={l.pago_em || ''} />
      <label className="fld"><span>Data da leitura anterior</span><input name="data_anterior" type="date" value={v.data_anterior} onChange={set('data_anterior')} /></label>
      <label className="fld"><span>Leitura anterior (kWh)</span><input name="leitura_anterior" type="number" step="0.1" value={v.leitura_anterior} onChange={set('leitura_anterior')} /></label>
      <label className="fld"><span>Data da leitura atual *</span><input name="data_atual" type="date" required value={v.data_atual} onChange={set('data_atual')} /></label>
      <label className="fld"><span>Leitura atual (kWh) *</span><input name="leitura_atual" type="number" step="0.1" required value={v.leitura_atual} onChange={set('leitura_atual')} autoFocus={!l.id} /></label>
      <label className="fld"><span>Valor do kWh (R$)</span><input name="valor_kwh" type="number" step="0.001" min="0" value={v.valor_kwh} onChange={set('valor_kwh')} /></label>
      <label className="fld"><span>Energia inclusa no aluguel (kWh)</span><input name="franquia_kwh" type="number" step="1" min="0" value={v.franquia_kwh} onChange={set('franquia_kwh')} /></label>
      <div className="full kv" style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '6px 14px' }}>
        <div><span>kWh consumido</span><span className={'num ' + (c.inconsistente ? 'neg' : '')}>{preenchido ? numero(c.consumo, 1) + ' kWh' : '—'}</span></div>
        <div><span>Acima dos {numero(c.franquia, 0)} kWh inclusos</span><span className="num">{preenchido ? numero(c.excedente, 1) + ' kWh' : '—'}</span></div>
        <div className="tot"><span>Total a cobrar de energia</span><span className="num">{preenchido ? brl(c.total) : '—'}</span></div>
        {c.inconsistente && preenchido && <div><span className="neg">A leitura atual está menor que a anterior. Confira o relógio.</span><span /></div>}
      </div>
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={l.obs || ''} style={{ minHeight: 60 }} /></label>
    </div>
  );
}
