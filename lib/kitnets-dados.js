// Dados iniciais das kitnets, lidos dos contratos e das planilhas de energia do Google Drive (03/11/2026).
// Usados só uma vez, pelo botão "Importar dados do Drive" na aba Kitnets.
// Leituras: [data anterior, leitura anterior, data atual, leitura atual, valor do kWh]

const NSF = 'Nossa Senhora de Fátima';
const CENTRO = 'Centro';
const END_NSF = 'Av. Padre Leandro Caliman, Qd. 12 Lt. 25 — N. Sra. de Fátima, Silvânia/GO';
const END_CENTRO = 'Rua Manoel Sanches, Qd. 31 Lt. 414 A — Centro, Silvânia/GO';

export const KITNETS_INICIAIS = [
  {
    grupo: NSF, numero: 1, endereco: END_NSF, locador: 'Antônio Paulo Canedo',
    inquilino: 'Isa Maria Mendonça Miranda', aluguel: 1300, vencimento_dia: 1, inicio: '2026-08-01', fim: '2027-07-31', uc_agua: '2805198-0', valor_kwh: 0.966,
    leituras: [
      ['2026-07-01', 677, '2026-08-04', 744, 0.892], ['2026-08-04', 744, '2026-09-02', 797, 0.892],
      ['2026-09-02', 797, '2026-09-30', 841, 0.892], ['2026-09-30', 841, '2026-11-02', 900, 0.892],
    ],
  },
  {
    grupo: NSF, numero: 2, endereco: END_NSF, locador: 'Antônio Paulo Canedo',
    inquilino: 'Marciene Caixeta Borges', aluguel: 1300, vencimento_dia: 15, inicio: '2025-10-15', fim: '2026-10-15', uc_agua: '2805199-8', valor_kwh: 0.966,
    obs: 'Contrato venceu em 15/10/2026: renovar ou registrar aditivo.',
    leituras: [
      ['2025-10-31', 65, '2025-12-01', 250, 0.892], ['2025-12-01', 250, '2025-12-31', 420, 0.892],
      ['2025-12-31', 420, '2026-02-02', 585, 0.892], ['2026-02-02', 585, '2026-03-01', 708, 0.892],
      ['2026-03-01', 708, '2026-04-01', 877, 0.9], ['2026-04-01', 877, '2026-05-04', 1068, 0.9],
      ['2026-05-04', 1068, '2026-06-02', 1207, 0.9], ['2026-06-02', 1207, '2026-07-01', 1305, 0.9],
      ['2026-07-01', 1305, '2026-08-04', 1402, 0.9], ['2026-08-04', 1402, '2026-09-02', 1542, 0.9],
      ['2026-09-02', 1542, '2026-09-30', 1720, 0.9], ['2026-09-30', 1720, '2026-11-02', 1943, 0.9],
    ],
  },
  {
    grupo: NSF, numero: 3, endereco: END_NSF, locador: 'Antônio Paulo Canedo',
    inquilino: 'Juliana Serafim dos Reis', aluguel: 1650, vencimento_dia: 1, inicio: '2026-07-01', fim: '2027-06-30', uc_agua: '2805200-5', valor_kwh: 0.966,
    obs: 'Pagou antecipado julho, agosto e setembro/2026 (R$ 4.950,00 em 23/06/2026).',
    leituras: [
      ['2026-06-02', 735, '2026-07-01', 782, 0.892], ['2026-07-01', 782, '2026-08-04', 912, 0.892],
      ['2026-08-04', 912, '2026-09-02', 1053, 0.892], ['2026-09-02', 1053, '2026-09-30', 1186, 0.892],
      ['2026-09-30', 1186, '2026-11-02', 1353, 0.9],
    ],
  },
  {
    grupo: NSF, numero: 4, endereco: END_NSF, locador: 'Antônio Paulo Canedo',
    inquilino: 'Sérgio Barbosa da Silva', aluguel: 1300, vencimento_dia: 5, inicio: '2026-06-01', fim: '2027-05-31', uc_agua: '2805201-3', valor_kwh: 0.966,
    leituras: [
      ['2026-04-01', 316, '2026-05-04', 372, 0.9], ['2026-05-04', 372, '2026-06-02', 435, 0.9],
      ['2026-06-02', 435, '2026-07-01', 505, 0.9], ['2026-07-01', 505, '2026-08-04', 583, 0.9],
      ['2026-08-04', 583, '2026-09-02', 662, 0.9], ['2026-09-02', 662, '2026-09-30', 751, 0.9],
      ['2026-09-30', 751, '2026-11-02', 848, 0.9],
    ],
  },
  {
    grupo: NSF, numero: 5, endereco: END_NSF, locador: 'Antônio Paulo Canedo',
    inquilino: 'Paulo de Tarso Ribeiro Villarinhos', aluguel: 1600, vencimento_dia: 5, inicio: '2026-02-01', fim: '2027-01-31', uc_agua: '2805202-1', valor_kwh: 0.966,
    leituras: [
      ['2026-09-02', 1120, '2026-09-30', 1270, 0.892],
      ['2026-09-30', 1270, '2026-11-02', 1140, 0.892, 'Conferir: leitura atual menor que a anterior na planilha.'],
    ],
  },
  {
    grupo: CENTRO, numero: 1, endereco: END_CENTRO, locador: 'Mariana Caixeta Canedo',
    inquilino: 'Alexander Moreira de Assis', aluguel: 1200, vencimento_dia: 5, inicio: '2026-03-01', fim: '2027-02-28', uc_agua: '2770148-4', valor_kwh: 0.966,
    leituras: [
      ['2026-03-01', 16, '2026-04-01', 129, 0.9], ['2026-04-01', 129, '2026-05-04', 240, 0.9],
      ['2026-05-04', 240, '2026-06-02', 320, 0.9], ['2026-06-02', 320, '2026-07-01', 424, 0.9],
      ['2026-07-01', 424, '2026-08-04', 542, 0.9], ['2026-08-04', 542, '2026-09-02', 678, 0.9],
      ['2026-09-02', 678, '2026-09-30', 842, 0.9], ['2026-09-30', 842, '2026-11-02', 969, 0.9],
    ],
  },
  {
    grupo: CENTRO, numero: 2, endereco: END_CENTRO, locador: 'Mariana Caixeta Canedo',
    inquilino: 'Fabrizia da Silva Abreu', aluguel: 1200, vencimento_dia: 5, inicio: '2026-08-01', fim: '2027-07-31', uc_agua: '2846699-3', valor_kwh: 0.966,
    leituras: [
      ['2026-07-01', 464, '2026-08-04', 484, 0.9], ['2026-08-04', 484, '2026-09-02', 545, 0.9],
      ['2026-09-02', 545, '2026-09-30', 621, 0.9], ['2026-09-30', 621, '2026-11-02', 708, 0.9],
    ],
  },
  {
    grupo: CENTRO, numero: 3, endereco: END_CENTRO, locador: 'Mariana Caixeta Canedo',
    inquilino: 'Érica Lopes de Sousa', aluguel: 1450, vencimento_dia: 5, inicio: '2026-03-01', fim: '2027-02-28', uc_agua: '2846698-5', valor_kwh: 0.966,
    leituras: [
      ['2026-03-01', 34, '2026-04-01', 223, 0.9], ['2026-04-01', 223, '2026-05-04', 401, 0.9],
      ['2026-05-04', 401, '2026-06-02', 568, 0.9], ['2026-06-02', 568, '2026-07-01', 702, 0.9],
      ['2026-07-01', 702, '2026-08-04', 879, 0.9], ['2026-08-04', 879, '2026-09-02', 1120, 0.9],
      ['2026-09-02', 1120, '2026-09-30', 1358, 0.9], ['2026-09-30', 1358, '2026-11-02', 1586, 0.9],
    ],
  },
];
