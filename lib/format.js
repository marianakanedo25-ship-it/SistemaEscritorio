// Utilidades de formatação (servidor e navegador).

export const TZ = 'America/Sao_Paulo';

export function hoje() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date()); // AAAA-MM-DD
}
export function mesAtual() {
  return hoje().slice(0, 7);
}
export function brl(v) {
  return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
export function numero(v, casas = 1) {
  return (Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: casas });
}
export function data(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export function nomeMes(ym) {
  const [y, m] = ym.split('-').map(Number);
  const n = MESES[m - 1];
  return n.charAt(0).toUpperCase() + n.slice(1) + ' de ' + y;
}
export function dataCurta(iso) {
  if (!iso) return '—';
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES_CURTOS[m - 1]}`;
}
export function dataExtenso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}
export function addMes(ym, n) {
  let [y, m] = ym.split('-').map(Number);
  m += n;
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  return `${y}-${String(m).padStart(2, '0')}`;
}
export function addDias(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function diasAte(iso) {
  if (!iso) return null;
  const a = new Date(hoje() + 'T12:00:00Z');
  const b = new Date(iso.slice(0, 10) + 'T12:00:00Z');
  return Math.round((b - a) / 864e5);
}
export function ymValido(s) {
  return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s) ? s : null;
}
export function fimDoMes(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  return d.toISOString().slice(0, 10);
}

/** Situação de um lançamento a pagar/receber. */
export function situacao(l) {
  if (l.pago_em) return 'pago';
  const n = diasAte(l.vencimento);
  if (n !== null && n < 0) return 'atrasado';
  return 'pendente';
}

/** Prazo de etapa em texto, com tom: 'atrasado' | 'breve' | ''. */
export function prazoInfo(iso, concluida) {
  if (!iso) return { texto: 'Sem prazo', tom: '' };
  const n = diasAte(iso);
  if (concluida) return { texto: data(iso), tom: '' };
  if (n < 0) return { texto: `${data(iso)} · atrasada ${-n} dia${n === -1 ? '' : 's'}`, tom: 'atrasado' };
  if (n === 0) return { texto: `${data(iso)} · vence hoje`, tom: 'breve' };
  if (n <= 7) return { texto: `${data(iso)} · em ${n} dia${n === 1 ? '' : 's'}`, tom: 'breve' };
  return { texto: data(iso), tom: '' };
}

/** Valor por extenso em reais, para recibos. */
export function porExtenso(valor) {
  const v = Math.round((Number(valor) || 0) * 100);
  const reais = Math.floor(v / 100);
  const cent = v % 100;
  const u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const d = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const c = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  const ate999 = (n) => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const partes = [];
    const ce = Math.floor(n / 100), r = n % 100;
    if (ce) partes.push(c[ce]);
    if (r) {
      if (r < 20) partes.push(u[r]);
      else partes.push(d[Math.floor(r / 10)] + (r % 10 ? ' e ' + u[r % 10] : ''));
    }
    return partes.join(' e ');
  };
  const inteiro = (n) => {
    if (n === 0) return 'zero';
    const grupos = [];
    const escalas = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
    let i = 0;
    while (n > 0) {
      const g = n % 1000;
      if (g) {
        let t = i === 1 && g === 1 ? 'mil' : ate999(g) + (escalas[i][0] ? ' ' + (g === 1 ? escalas[i][0] : escalas[i][1]) : '');
        grupos.unshift({ t, g });
      }
      n = Math.floor(n / 1000);
      i++;
    }
    return grupos.map((x, idx) => {
      if (idx === 0) return x.t;
      const sep = x.g < 100 || x.g % 100 === 0 ? ' e ' : ' ';
      return sep + x.t;
    }).join('');
  };
  const partes = [];
  if (reais) partes.push(inteiro(reais) + (reais === 1 ? ' real' : (reais % 1000000 === 0 ? ' de reais' : ' reais')));
  if (cent) partes.push(inteiro(cent) + (cent === 1 ? ' centavo' : ' centavos'));
  return partes.length ? partes.join(' e ') : 'zero real';
}

export const FORMAS_PAGAMENTO = ['Pix', 'Transferência', 'Boleto', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro', 'Cheque'];
export const CATEGORIAS_DESPESA = ['Aluguel e condomínio', 'Água, luz e internet', 'Contabilidade', 'CAU / RRT', 'Impostos', 'Software e licenças', 'Impressões e plotagens', 'Marketing e tráfego', 'Deslocamento', 'Equipe e pró-labore', 'Mentorias e cursos', 'Material de escritório', 'Outros'];
export const TIPOS_PROJETO = ['Interiores residencial', 'Interiores comercial', 'Arquitetônico', 'Reforma', 'Consultoria', 'Paisagismo', 'Corporativo', 'Outro'];
export const STATUS_PROJETO = {
  proposta: 'Proposta',
  andamento: 'Em andamento',
  obra: 'Acompanhamento de obra',
  pausado: 'Pausado',
  concluido: 'Concluído',
};
export const STATUS_ETAPA = { pendente: 'Pendente', andamento: 'Em andamento', concluida: 'Concluída' };
export const STATUS_CONTRATO = { rascunho: 'Rascunho', aguardando: 'Aguardando assinatura', assinado: 'Assinado', cancelado: 'Cancelado' };
// Cores dos projetos na agenda (bem diferentes entre si, todas legíveis com texto branco)
export const CORES_PROJETO = ['#7C847A', '#A0826D', '#4F6D8A', '#B5727A', '#8C7AA0', '#B8913F', '#4E8577', '#9A5E4B', '#6F7F8F', '#7A8F4E', '#A0607A', '#5C5F99'];
export const ETAPAS_PADRAO = [
  ['Elaboração da proposta comercial', 1.5], ['Reunião de briefing', 2], ['Levantamento técnico', 3],
  ['Estudo de layout', 8], ['Apresentação do estudo preliminar (planta baixa)', 2], ['Ajustes do estudo preliminar', 3],
  ['Modelagem 3D', 9], ['Desenvolvimento/criação do projeto', 20],
  ['Renderização', 10], ['Apresentação do projeto', 2], ['Ajustes após apresentação', 7], ['Projeto executivo', 18],
  ['Detalhamento de marcenaria', 11], ['Detalhamento de marmoraria', 5.5],
  ['Detalhamento luminotécnico', 6], ['Detalhamento de pontos elétricos', 5.5],
];
