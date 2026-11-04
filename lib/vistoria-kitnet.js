// Termo de vistoria (entrada/saída) das kitnets, baseado nos termos do Drive.
// Nada de dados pessoais aqui: nomes e CPFs vêm da kitnet e do locador salvos no banco.

export const ITENS_CONDICAO = [
  { nome: 'Pintura', op: ['Bom', 'Regular', 'Ruim'] },
  { nome: 'Paredes', op: ['Bom', 'Regular', 'Ruim'] },
  { nome: 'Revestimentos', op: ['Bom', 'Regular', 'Ruim'] },
  { nome: 'Portas / Fechaduras', op: ['Bom', 'Regular', 'Ruim'] },
  { nome: 'Janelas / Vidros', op: ['Bom', 'Regular', 'Ruim'] },
  { nome: 'Iluminação', op: ['Bom', 'Regular', 'Ruim'] },
  { nome: 'Tomadas / Interruptores', op: ['OK', 'Queimados/soltos'] },
  { nome: 'Instalações elétricas', op: ['OK', 'Falhas'] },
  { nome: 'Instalações hidráulicas', op: ['OK', 'Vazamentos'] },
  { nome: 'Armários', op: ['Bom', 'Regular', 'Ruim'] },
  { nome: 'Fogão / Bebedouro / Sugar', op: ['Bom', 'Regular', 'Ruim'] },
];

const BANHEIRO = {
  nome: 'Banheiro',
  itens: '01 chuveiro Lorenzetti, 01 assento de vaso, 02 cabides, 01 torneira, 01 ducha higiênica e 01 plafon de LED de sobrepor.',
  condicoes: 'Itens sanitários e hidráulicos novos e em perfeito estado. Chuveiro funcionando, torneira e ducha higiênica sem vazamentos. Luminária operante. Sem fissuras, infiltrações ou manchas.',
  obs: 'Ambiente em perfeito estado.',
};

export const AMBIENTES_PADRAO = {
  Centro: [
    { nome: 'Garagem / Área de serviço', itens: '01 painel de LED de sobrepor, 01 torneira, 01 torneira de tanque, 01 batente de porta e 01 registro de máquina.',
      condicoes: 'Todos os itens em perfeito estado, sem avarias. Painel de LED funcionando normalmente, torneiras sem vazamento e tomadas/interruptores em perfeito funcionamento. Sem sinais de infiltração ou danos.', obs: 'Ambiente em perfeito estado.' },
    { nome: 'Cozinha / Sala / Jardim de inverno', itens: '02 painéis de LED de sobrepor, 01 luminária tipo tartaruga, 01 batente de porta, 01 interfone, 01 torneira, 01 varão de cortina, 01 bebedouro Soft, 01 cabide, 01 sugar Fischer, 01 fogão Fischer, armários planejados, painel de TV, 01 registro de gás, 01 borracha preta.',
      condicoes: 'Ambientes entregues em perfeito estado. Iluminação funcionando, pintura nova, armários planejados sem danos, prateleiras e painel de TV íntegros e bem fixados. Tomadas e interruptores novos e operantes, eletrodomésticos (fogão, sugar e bebedouro) totalmente operantes. Torneira sem vazamentos.', obs: 'Ambiente em perfeito estado.' },
    { nome: 'Quarto', itens: '01 varão de cortina, 01 painel de LED de sobrepor.',
      condicoes: 'Ambiente entregue em perfeito estado, com pintura nova e iluminação funcionando. Tomadas e interruptores novos e operantes.', obs: 'Ambiente em perfeito estado.' },
    BANHEIRO,
  ],
  'Nossa Senhora de Fátima': [
    { nome: 'Garagem', itens: '02 painéis de LED de sobrepor, 01 torneira, 01 motor de portão e 03 tomadas/interruptores.',
      condicoes: 'Todos os itens em perfeito estado, sem avarias. Painéis de LED funcionando normalmente, torneira sem vazamentos, motor de portão operante e tomadas/interruptores em perfeito funcionamento.', obs: 'Ambiente em perfeito estado.' },
    { nome: 'Cozinha / Sala', itens: '02 painéis de LED de sobrepor, 01 batente de porta, 01 interfone, 14 tomadas/interruptores, 01 torneira, 01 varão de cortina, 01 bebedouro Soft, 01 cabide, 01 sugar Fischer, 01 fogão Fischer, armários planejados, 01 registro de gás, 01 borracha preta.',
      condicoes: 'Ambientes entregues em perfeito estado. Iluminação funcionando, pintura nova, armários planejados sem danos, eletrodomésticos (fogão, sugar e bebedouro) totalmente operantes. Torneira sem vazamentos e tomadas/interruptores em perfeito funcionamento.', obs: 'Ambiente em perfeito estado.' },
    { nome: 'Área de serviço', itens: '01 tomada, 01 registro de máquina, 01 tanque, 01 torneira e 01 painel de LED de sobrepor.',
      condicoes: 'Iluminação, tanque, registro e torneira em perfeito estado. Tomada operante. Sem sinais de infiltração ou danos.', obs: 'Ambiente em perfeito estado.' },
    { nome: 'Quarto / Jardim de inverno', itens: '07 tomadas/interruptores, painel de TV com prateleiras, 01 varão de cortina, 01 painel de LED de sobrepor e 01 luminária tipo tartaruga.',
      condicoes: 'Ambientes entregues em perfeito estado, com pintura nova e iluminação funcionando. Prateleiras e painel de TV íntegros e bem fixados. Tomadas e interruptores novos e operantes.', obs: 'Ambiente em perfeito estado.' },
    BANHEIRO,
  ],
};

export const OBS_GERAIS_PADRAO = 'Todas as portas internas foram entregues com 01 chave cada. Além disso, foram entregues ao(à) locatário(a): 02 (duas) chaves do portão de entrada, 01 (uma) chave da porta principal da kitnet e 01 (um) controle remoto do portão eletrônico.\nFica sob responsabilidade do(a) locatário(a) a guarda e conservação destas chaves e do controle, bem como a devolução de todos os itens na entrega das chaves.';

export const DECLARACAO = 'As partes declaram que a vistoria foi realizada de comum acordo, estando cientes de que o imóvel deverá ser devolvido, ao término da locação, nas mesmas condições aqui descritas, salvo as deteriorações decorrentes do uso normal.';

export function objetivo(tipo, kitnet) {
  const k = `KITNET ${String(kitnet || '').padStart(2, '0')}`;
  return tipo === 'saida'
    ? `O presente termo tem por finalidade registrar as condições gerais da ${k} no momento da vistoria final, realizada na devolução das chaves pelo(a) locatário(a), para comparação com a vistoria de entrada. As partes declaram que o imóvel foi vistoriado em conjunto, concordando com as informações descritas a seguir.`
    : `O presente termo tem por finalidade registrar as condições gerais da ${k} no momento da vistoria inicial, realizada antes da entrega das chaves ao(à) locatário(a). As partes declaram que o imóvel foi vistoriado em conjunto, concordando com as informações descritas a seguir.`;
}

/** Vistoria nova: entrada marcada como "Bom/OK" em tudo, saída em branco. */
export function vistoriaPadrao(grupo, dataHoje) {
  return {
    tipo: 'entrada',
    data: dataHoje,
    dataAssinatura: dataHoje,
    cidade: 'Silvânia',
    condicoes: Object.fromEntries(ITENS_CONDICAO.map((i) => [i.nome, { entrada: i.op[0], saida: '' }])),
    ambientes: (AMBIENTES_PADRAO[grupo] || AMBIENTES_PADRAO.Centro).map((a) => ({ ...a })),
    obsGerais: OBS_GERAIS_PADRAO,
    wifi: '',
  };
}
