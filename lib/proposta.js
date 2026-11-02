// Textos padrão da proposta comercial enviada ao cliente.
import { dataExtenso, hoje, brl } from './format';

export const DESCRICOES_ETAPAS = {
  'Reunião de briefing': 'Conversa para entender a rotina da família, as necessidades de cada ambiente, o estilo desejado e o investimento previsto para a obra.',
  'Levantamento técnico': 'Visita ao imóvel para medição e registro fotográfico, ou conferência das plantas existentes.',
  'Estudo de layout': 'Definição da distribuição dos ambientes, da circulação e da posição do mobiliário.',
  'Apresentação do estudo preliminar (planta baixa)': 'Reunião para apresentar a planta baixa com a proposta de layout e conversar sobre a distribuição dos ambientes.',
  'Ajustes do estudo preliminar': 'Ajustes na planta baixa a partir das suas considerações, até a aprovação do layout.',
  'Modelagem 3D': 'Modelagem tridimensional dos ambientes para estudar volumes, proporções, materiais e iluminação.',
  'Desenvolvimento/criação do projeto': 'Criação da proposta de interiores: conceito, paleta de cores, materiais, revestimentos, mobiliário e decoração.',
  'Renderização': 'Imagens realistas dos ambientes para você visualizar o resultado antes da obra.',
  'Apresentação do projeto': 'Reunião para apresentar o projeto completo com as imagens dos ambientes, materiais e mobiliário.',
  'Ajustes após apresentação': 'Uma rodada de ajustes no projeto a partir das suas considerações na apresentação.',
  'Projeto executivo': 'Pranchas técnicas com plantas, cortes, paginações e especificações para a execução da obra.',
  'Detalhamento de marcenaria': 'Desenhos de todos os móveis sob medida, com medidas, materiais e acabamentos, prontos para orçamento com marceneiros.',
  'Detalhamento de marmoraria': 'Detalhes de bancadas, soleiras, nichos e demais peças em pedra para orçamento e execução.',
  'Detalhamento luminotécnico': 'Projeto de iluminação com posicionamento e especificação de luminárias, lâmpadas e cenas de luz.',
  'Detalhamento de pontos elétricos': 'Indicação de tomadas, interruptores e pontos de dados de acordo com o uso de cada ambiente.',
};

// Etapas internas do escritório que não entram no escopo mostrado ao cliente.
const INTERNAS = new Set(['Elaboração da proposta comercial']);

function semanas(horas, horasMes) {
  const porSemana = (Number(horasMes) || 100) / 4.33;
  return Math.max(2, Math.ceil((Number(horas) || 0) / porSemana) + 1);
}

/** Monta o texto inicial da proposta a partir de um orçamento salvo. */
export function propostaPadrao(orc, cliente, horasMes) {
  const d = orc.dados || {};
  const tipo = orc.tipo || 'Interiores residencial';
  const ehInteriores = /interiores/i.test(tipo);
  const servico = ehInteriores ? 'Projeto de Interiores' : `Projeto ${tipo}`;
  const area = Number(orc.area) || 0;
  const etapas = (d.etapas || []).filter((e) => e.on !== false && !INTERNAS.has(e.nome));
  const horas = d.resultado?.horas || etapas.reduce((s, e) => s + (Number(e.horas) || 0), 0);
  const sem = semanas(horas, horasMes);
  return {
    titulo: `${servico}${orc.nome ? ' — ' + orc.nome : ''}`,
    cliente: cliente || '',
    data: hoje(),
    objeto: `Elaboração de ${servico.toLowerCase()} para ${orc.nome || 'o imóvel do cliente'}${area ? `, com área aproximada de ${String(area).replace('.', ',')} m²` : ''}. `
      + 'O objetivo é criar ambientes funcionais, bonitos e com a sua identidade, com todo o material técnico necessário para que a obra seja executada com segurança e sem improvisos.',
    etapas: etapas.map((e) => ({ nome: e.nome, descricao: DESCRICOES_ETAPAS[e.nome] || '' })),
    entrega: 'O projeto será entregue em formato digital (PDF) e impresso, organizado em caderno técnico.',
    prazo: `Prazo estimado de ${sem} semanas a partir da assinatura do contrato e do recebimento das informações necessárias, sem contar o tempo de aprovação de cada etapa pelo cliente.`,
    valor: Number(orc.valor) || 0,
    pagamento: '50% na assinatura do contrato e 50% na apresentação do layout.',
    naoIncluso: 'Projetos complementares (estrutural, elétrico e hidráulico), aprovação em órgãos públicos, RRT, acompanhamento de obra e despesas de deslocamento fora da cidade, que podem ser contratados à parte.',
    validade: 'Esta proposta é válida por 15 dias a partir da data de envio.',
    obs: '',
  };
}

export function dataProposta(iso) {
  return dataExtenso(iso || hoje());
}
export { brl };
