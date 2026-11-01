import { hoje } from '@/lib/format';

export const TIPOS_EVENTO = { reuniao: 'Reunião', visita: 'Visita de obra', entrega: 'Entrega', medicao: 'Levantamento / medição', outro: 'Outro' };

export default function EventoCampos({ e = {}, projetos = [], fixo = {}, dataPadrao }) {
  return (
    <div className="form">
      {e.id && <input type="hidden" name="id" value={e.id} />}
      {Object.entries(fixo).map(([k, v]) => <input key={k} type="hidden" name={k} value={v ?? ''} />)}
      <label className="fld full"><span>Título *</span><input name="titulo" required defaultValue={e.titulo || ''} placeholder="Ex.: Apresentação do estudo preliminar" /></label>
      <label className="fld"><span>Data *</span><input name="data" type="date" required defaultValue={e.data || dataPadrao || hoje()} /></label>
      <label className="fld"><span>Horário</span><input name="hora" type="time" defaultValue={e.hora || ''} /></label>
      <label className="fld"><span>Tipo</span>
        <select name="tipo" defaultValue={e.tipo || 'reuniao'}>{Object.entries(TIPOS_EVENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </label>
      {!('projeto_id' in fixo) && (
        <label className="fld"><span>Projeto</span>
          <select name="projeto_id" defaultValue={e.projeto_id || ''}><option value="">Nenhum</option>{projetos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
        </label>
      )}
      <label className="fld full"><span>Local</span><input name="local" defaultValue={e.local || ''} placeholder="Endereço, escritório ou link da chamada" /></label>
      <label className="fld full"><span>Observações</span><textarea name="obs" defaultValue={e.obs || ''} /></label>
    </div>
  );
}
