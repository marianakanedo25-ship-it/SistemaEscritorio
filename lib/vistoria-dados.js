// Termos de vistoria que estavam no Drive, um por kitnet (lidos em 04/11/2026).
// Só a descrição do imóvel e as datas: nomes, CPFs e senha do Wi-Fi não ficam no código.

const NSF = 'Nossa Senhora de Fátima';
const C = 'Centro';
const OK = 'Ambiente em perfeito estado.';
const NOVO = 'Ambiente entregue novo, primeira utilização.';

const banheiro = (obs) => ({
  nome: 'Banheiro',
  itens: '01 chuveiro Lorenzetti, 01 assento de vaso, 02 cabides, 01 torneira, 01 ducha higiênica e 01 plafon de LED de sobrepor.',
  condicoes: 'Itens sanitários e hidráulicos novos e em perfeito estado. Chuveiro funcionando, torneira e ducha higiênica sem vazamentos. Luminária operante. Sem fissuras, infiltrações ou manchas.',
  obs,
});

// ---- Nossa Senhora de Fátima ----
const nsfGaragem = (obs) => ({ nome: 'Garagem', itens: '02 painéis de LED de sobrepor, 01 torneira, 01 motor de portão e 03 tomadas/interruptores.',
  condicoes: 'Todos os itens em perfeito estado, sem avarias. Painéis de LED funcionando normalmente, torneira sem vazamentos, motor de portão operante e tomadas/interruptores em perfeito funcionamento.', obs });
const nsfCozinha = (extra, obs) => ({ nome: 'Cozinha / Sala',
  itens: `02 painéis de LED de sobrepor, 01 batente de porta, 01 interfone, 14 tomadas/interruptores, 01 torneira, 01 varão de cortina, 01 bebedouro Soft, 01 cabide, 01 sugar Fischer, 01 fogão Fischer, ${extra}armários planejados, 01 registro de gás, 01 borracha preta.`,
  condicoes: 'Ambientes entregues em perfeito estado. Iluminação funcionando, pintura nova, armários planejados sem danos, eletrodomésticos (fogão, sugar e bebedouro) totalmente operantes. Torneira sem vazamentos e tomadas/interruptores em perfeito funcionamento.', obs });
const nsfServico = (extra, obs) => ({ nome: 'Área de serviço', itens: `01 tomada, 01 registro de máquina, 01 tanque, 01 torneira, ${extra}01 painel de LED de sobrepor.`,
  condicoes: 'Iluminação, tanque, registro e torneira em perfeito estado. Tomada operante. Sem sinais de infiltração ou danos.', obs });
const nsfQuarto = (extra, obs) => ({ nome: 'Quarto / Jardim de inverno',
  itens: `07 tomadas/interruptores, painel de TV com prateleiras, 01 varão de cortina, 01 painel de LED de sobrepor, ${extra}01 luminária tipo tartaruga.`,
  condicoes: 'Ambientes entregues em perfeito estado, com pintura nova e iluminação funcionando. Prateleiras e painel de TV íntegros e bem fixados. Tomadas e interruptores novos e operantes.', obs });

// ---- Centro ----
const cGaragem = (batente, obs) => ({ nome: 'Garagem / Área de serviço',
  itens: `01 painel de LED de sobrepor, 01 torneira, 01 torneira de tanque, ${batente ? '01 batente de porta e ' : ''}01 registro de máquina.`,
  condicoes: 'Todos os itens em perfeito estado, sem avarias. Painel de LED funcionando normalmente, torneiras sem vazamento e tomadas/interruptores em perfeito funcionamento. Sem sinais de infiltração ou danos.', obs });
const cCozinha = (obs) => ({ nome: 'Cozinha / Sala / Jardim de inverno',
  itens: '02 painéis de LED de sobrepor, 01 luminária tipo tartaruga, 01 batente de porta, 01 interfone, 01 torneira, 01 varão de cortina, 01 bebedouro Soft, 01 cabide, 01 sugar Fischer, 01 fogão Fischer, armários planejados, painel de TV, 01 registro de gás, 01 borracha preta.',
  condicoes: 'Ambientes entregues em perfeito estado. Iluminação funcionando, pintura nova, armários planejados sem danos, prateleiras e painel de TV íntegros e bem fixados. Tomadas e interruptores novos e operantes, eletrodomésticos (fogão, sugar e bebedouro) totalmente operantes. Torneira sem vazamentos.', obs });
const cQuarto = (nome, obs) => ({ nome, itens: '01 varão de cortina, 01 painel de LED de sobrepor.',
  condicoes: 'Ambiente entregue em perfeito estado, com pintura nova e iluminação funcionando. Tomadas e interruptores novos e operantes.', obs });

const chaves = (portao) => `Todas as portas internas foram entregues com 01 chave cada. Além disso, foram entregues ao(à) locatário(a): ${portao} do portão de entrada, 01 (uma) chave da porta principal da kitnet e 01 (um) controle remoto do portão eletrônico.\nFica sob responsabilidade do(a) locatário(a) a guarda e conservação destas chaves e do controle, bem como a devolução de todos os itens na entrega das chaves.`;
const DUAS = chaves('02 (duas) chaves');

const MOBILIA_COZ = (geladeira) => `${geladeira}, 01 mesa de 04 lugares, `;
const MOBILIA_QUARTO = (tv) => `01 cama box completa (box e colchão), ${tv}, 01 guarda-roupa, 01 ar-condicionado e `;

export const VISTORIAS_DRIVE = {
  [`${NSF}|1`]: { data: '2026-07-31', dataAssinatura: '2026-08-01', obsGerais: DUAS,
    ambientes: [nsfGaragem(OK), nsfCozinha('', OK), nsfServico('', OK), nsfQuarto('', NOVO), banheiro(OK)] },
  [`${NSF}|2`]: { data: '2025-10-15', dataAssinatura: '2025-10-15', obsGerais: DUAS,
    ambientes: [nsfGaragem(NOVO), nsfCozinha('', 'Primeira locação, todos os itens novos.'), nsfServico('', NOVO), nsfQuarto('', NOVO), banheiro('Banheiro entregue novo, primeira utilização.')] },
  [`${NSF}|3`]: { data: '2026-07-01', dataAssinatura: '2026-07-01', obsGerais: DUAS, mobiliada: true,
    ambientes: [nsfGaragem(''), nsfCozinha(MOBILIA_COZ('01 refrigerador Consul'), ''), nsfServico('01 máquina de lavar Midea, ', ''), nsfQuarto(MOBILIA_QUARTO('01 TV Samsung 32 polegadas'), ''), banheiro('')] },
  [`${NSF}|4`]: { data: '2026-05-08', dataAssinatura: '2026-05-11', obsGerais: DUAS,
    ambientes: [nsfGaragem(''), nsfCozinha('', ''), nsfServico('', ''), nsfQuarto('', ''), banheiro('')] },
  [`${NSF}|5`]: { data: '2026-02-03', dataAssinatura: '2026-02-05', obsGerais: DUAS, mobiliada: true,
    ambientes: [nsfGaragem(''), nsfCozinha(MOBILIA_COZ('01 refrigerador Electrolux'), ''), nsfServico('', ''), nsfQuarto(MOBILIA_QUARTO('01 TV Philco 42 polegadas'), ''), banheiro('')] },
  [`${C}|1`]: { data: '2026-02-20', dataAssinatura: '2026-02-20', obsGerais: chaves('01 (uma) chave'),
    ambientes: [cGaragem(true, NOVO), cCozinha('Primeira locação, todos os itens novos.'), cQuarto('Quarto', NOVO), banheiro('Banheiro entregue novo, primeira utilização.')] },
  [`${C}|2`]: { data: '2026-07-30', dataAssinatura: '2026-07-30', obsGerais: DUAS,
    ambientes: [cGaragem(true, OK), cCozinha(OK), cQuarto('Quarto', OK), banheiro(OK)] },
  [`${C}|3`]: { data: '2026-02-20', dataAssinatura: '2026-02-20', obsGerais: DUAS,
    ambientes: [cGaragem(false, NOVO), cCozinha('Primeira locação, todos os itens novos.'), cQuarto('Quarto 01 e 02', NOVO), banheiro('Banheiro entregue novo, primeira utilização.')] },
};

export const vistoriaDoDrive = (grupo, numero) => VISTORIAS_DRIVE[`${grupo}|${Number(numero)}`] || null;
