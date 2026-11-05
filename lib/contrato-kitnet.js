// Modelo do contrato de locação das kitnets, baseado nos contratos do Drive (Kitnet 03 N. Sra. de Fátima e Kitnet 02 Centro).
// Dados pessoais (RG, CPF, PIX) NÃO ficam aqui: são digitados no sistema e salvos no banco.

const UN = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CE = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function ate999(n) {
  if (n === 100) return 'cem';
  const p = [];
  const c = Math.floor(n / 100), r = n % 100;
  if (c) p.push(CE[c]);
  if (r) p.push(r < 20 ? UN[r] : DZ[Math.floor(r / 10)] + (r % 10 ? ' e ' + UN[r % 10] : ''));
  return p.join(' e ');
}

/** Número inteiro por extenso, no estilo de contrato ("um mil e duzentos"). */
export function extenso(n) {
  n = Math.floor(Number(n) || 0);
  if (n === 0) return 'zero';
  const mil = Math.floor(n / 1000), resto = n % 1000;
  if (!mil) return ate999(resto);
  const m = mil === 1 ? 'um mil' : ate999(mil) + ' mil';
  return resto ? `${m} e ${ate999(resto)}` : m;
}

export function reaisExtenso(v) {
  const c = Math.round((Number(v) || 0) * 100);
  const r = Math.floor(c / 100), cent = c % 100;
  const partes = [];
  if (r) partes.push(extenso(r) + (r === 1 ? ' real' : ' reais'));
  if (cent) partes.push(extenso(cent) + (cent === 1 ? ' centavo' : ' centavos'));
  return partes.join(' e ') || 'zero reais';
}

const pad = (n) => String(n).padStart(2, '0');
const partes = (iso) => { const [y, m, d] = String(iso || '').split('-').map(Number); return { y, m, d }; };
const valida = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''));
const BR = (iso) => (valida(iso) ? iso.split('-').reverse().join('/') : '___/___/______');
const ultimoDia = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Soma meses mantendo o dia (ou o último dia do mês, se não existir). */
export function addMeses(iso, n) {
  const { y, m, d } = partes(iso);
  const t = y * 12 + (m - 1) + n;
  const ny = Math.floor(t / 12), nm = (t % 12) + 1;
  return `${ny}-${pad(nm)}-${pad(Math.min(d, ultimoDia(ny, nm)))}`;
}

/** "primeiro de julho de dois mil e vinte e seis" */
export function dataPorExtenso(iso) {
  if (!valida(iso)) return '';
  const { y, m, d } = partes(iso);
  return `${d === 1 ? 'primeiro' : extenso(d)} de ${MESES[m - 1]} de ${extenso(y).replace(/^um mil/, 'mil')}`;
}

/** "01 de julho de 2026" */
export function dataLonga(iso) {
  if (!valida(iso)) return '___ de __________ de ______';
  const { y, m, d } = partes(iso);
  return `${pad(d)} de ${MESES[m - 1]} de ${y}`;
}

/** Meses de vigência entre início e fim (fim = dia anterior ao aniversário). */
export function mesesVigencia(ini, fim) {
  if (!valida(ini) || !valida(fim)) return 12;
  const a = partes(ini), b = partes(addDia(fim, 1));
  return Math.max(1, (b.y - a.y) * 12 + (b.m - a.m) + (b.d >= a.d ? 0 : -1));
}
function addDia(iso, n) {
  const dt = new Date(iso + 'T12:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/**
 * Pagamentos: o primeiro é no dia em que o contrato começa e o último no mês anterior
 * a completar o prazo (12 meses → 11 meses depois). Qualquer um dos dois pode ser digitado à mão.
 */
export function vencimentos(ini, meses, primeiroManual, ultimoManual) {
  const primeiro = valida(primeiroManual) ? primeiroManual : (valida(ini) ? ini : '');
  const ultimo = valida(ultimoManual) ? ultimoManual : (primeiro ? addMeses(primeiro, meses - 1) : '');
  return { primeiro, ultimo };
}

/** Dados de cada bairro (locador e imóvel). RG, CPF, endereço e PIX ficam em branco para preencher no sistema. */
export const LOCADOR_PADRAO = {
  'Nossa Senhora de Fátima': {
    nome: 'ANTÔNIO PAULO CANEDO', qualificacao: 'brasileiro, casado', rg: '', cpf: '', endereco: '', pix: '', pixTitular: 'ANTÔNIO PAULO CANEDO',
    imovel: 'Avenida Padre Leandro Caliman Qd. 12 Lt. 25, Kitnet n°{kitnet}, Bairro Nossa Senhora de Fátima, Silvânia Go, CEP: 75180-000',
    composicao: '01 (uma) suíte com jardim de inverno, sala integrada com a cozinha, área de serviço e garagem coberta',
  },
  Centro: {
    nome: 'MARIANA CAIXETA CANEDO', qualificacao: 'brasileira, solteira', rg: '', cpf: '', endereco: '', pix: '', pixTitular: 'MARIANA CAIXETA CANEDO',
    imovel: 'Rua Manoel Sanches Qd. 31 Lt. 414 A, Kitnet n°{kitnet}, Centro, Silvânia Go, CEP: 75180-000',
    composicao: '01 (uma) suíte, sala integrada com a cozinha e jardim de inverno, área de serviço e garagem coberta',
  },
};
export const locadorPadrao = (grupo) => LOCADOR_PADRAO[grupo] || { nome: '', qualificacao: '', rg: '', cpf: '', endereco: '', pix: '', pixTitular: '', imovel: '{endereço}, Kitnet n°{kitnet}', composicao: '' };

const B = '__________';
// Marca os dados preenchidos para saírem em negrito no contrato (o editor troca por <strong>).
export const NEG_INI = '\uE000', NEG_FIM = '\uE001';
const N = (x) => (x === '' || x == null ? '' : `${NEG_INI}${x}${NEG_FIM}`);
const ORD_PAR = ['Primeiro', 'Segundo', 'Terceiro', 'Quarto', 'Quinto', 'Sexto', 'Sétimo', 'Oitavo'];
const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function pessoa(nome, qual, rg, cpf, mora) {
  // Sem RG, ele sai do texto (fica só o CPF).
  const doc = rg ? `RG n° ${N(rg)} e CPF ${N(cpf || B)}` : `CPF ${N(cpf || B)}`;
  return [N(String(nome || B).toUpperCase()), qual && N(qual), doc].filter(Boolean).join(', ') + (mora ? `, ${mora}` : '');
}

/**
 * Monta o contrato a partir dos dados. Devolve uma lista de blocos:
 * { t: 'titulo'|'secao'|'clausula'|'par'|'item'|'texto'|'local'|'ass', ... }
 */
export function montarContrato(d) {
  const L = d.locador || {};
  const T = d.locatario || {};
  const F = d.fiador || {};
  const temFiador = !!(d.usarFiador && F.nome);
  const meses = mesesVigencia(d.inicio, d.fim);
  const dia = Number(d.vencimentoDia) || 0;
  const { primeiro, ultimo } = vencimentos(d.inicio, meses, d.primeiroPagamento, d.ultimoPagamento);
  const aviso = valida(d.fim) ? addMeses(d.fim, -1) : '';
  const franquia = Number(d.franquia ?? 150);
  const kit = String(d.kitnet || '').padStart(2, '0');
  const diaTxt = N(dia ? `${pad(dia)} (${dia === 1 ? 'primeiro' : extenso(dia)})` : B);
  const aluguel = N(`R$ ${(Number(d.aluguel) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${reaisExtenso(d.aluguel)})`);
  const ext = (iso) => (valida(iso) ? N(`(${dataPorExtenso(iso)})`) : '');
  const D = (iso) => N(BR(iso));

  // Cláusulas com id, para as referências cruzadas saírem sempre com o número certo.
  const itens = [];
  const sec = (texto) => itens.push({ t: 'secao', texto });
  const cl = (id, texto, opts = {}) => itens.push({ t: 'clausula', id, texto, pars: opts.pars || [], lista: opts.lista || [], parsDepois: opts.parsDepois || [] });

  sec('Do objeto do contrato');
  cl('objeto', `Um imóvel residencial localizado na ${N(String(L.imovel || '').replace('{kitnet}', kit))}. Composto por ${N(d.composicao || L.composicao || B)}.`);

  sec('Do prazo da locação');
  cl('prazo', `O prazo da presente locação é de ${N(`${meses} (${extenso(meses)}) meses`)}, com início na data de ${D(d.inicio)} e término em ${D(d.fim)} ${valida(d.inicio) && valida(d.fim) ? N(`(${dataPorExtenso(d.inicio)} a ${dataPorExtenso(d.fim)})`) : ''}.`, {
    pars: [
      'Na data prevista para o término do contrato, a parte Locatária se obriga a restituir o imóvel completamente desocupado de pessoas e objetos e em perfeito estado de uso e conservação, independente de notificação de qualquer espécie, sob pena de incorrer na multa proporcional prevista na Cláusula {penal} deste instrumento, e poderá sujeitar-se ainda a suportar ação de despejo, cobrança de aluguéis e despesas acessórias eventualmente não pagas, honorários advocatícios (previstos na Cláusula {honorarios} deste instrumento), restituição de despesas e custas processuais, sem prejuízo de eventuais perdas e danos.',
      `Ainda que o imóvel seja desocupado na data final, qual seja, ${D(d.fim)} ${ext(d.fim)}, deverá a parte Locatária comunicar sua intenção, por escrito, à parte Locadora, com no mínimo 30 (trinta) dias de antecedência, ou seja, até a data de ${D(aviso)}.`,
      'Em qualquer outra hipótese de entrega antecipada, haverá cobrança do valor da multa rescisória proporcional, prevista na Cláusula {penal}, e a parte Locatária deverá providenciar comunicação escrita à parte Locadora de sua intenção com 30 (trinta) dias de antecedência.',
      'Haverá dispensa da cobrança da multa por rescisão antecipada, prevista na Cláusula {penal}, caso a entrega antecipada do imóvel ocorra por transferência de seu empregador, público ou privado, para fins de prestação de serviço em outra cidade, hipótese em que deverá notificar a parte Locadora de sua intenção com 30 (trinta) dias de antecedência.',
    ],
  });

  sec('Do valor do aluguel e obrigações acessórias');
  const parsAluguel = [
    `Sobre o valor do aluguel citado acima, estará inclusa a taxa de internet e a taxa de energia com consumo de até ${N(`${franquia} (${extenso(franquia)}) kWh`)}. Todo dia 30 será feita a leitura do consumo de energia; se exceder o total estipulado, a parte Locatária pagará junto com o aluguel o valor sobre a quantidade que exceder, o qual será encaminhado à parte Locatária 05 (cinco) dias antes do vencimento do aluguel.`,
    `O pagamento poderá ser realizado via boleto bancário, dinheiro ou PIX, devendo ser efetuado até a data de vencimento. Para pagamento via PIX, utilizar a seguinte chave: ${N(L.pix || B)} — Titular: ${N(String(L.pixTitular || L.nome || B).toUpperCase())}.`,
    'A parte Locatária declara estar ciente de que, caso não receba o boleto bancário antes do vencimento, deverá entrar em contato com a parte Locadora para solicitar a segunda via, para que o pagamento seja realizado até a data de vencimento.',
  ];
  if (String(d.antecipado || '').trim()) parsAluguel.push(N(String(d.antecipado).trim()));
  cl('aluguel', `Pela locação, a parte Locatária pagará o valor de aluguel de ${aluguel}, com vencimento todo dia ${diaTxt} de cada mês${primeiro ? `, com primeiro pagamento para ${D(primeiro)} e último pagamento para ${D(ultimo)}` : ''}.`, { pars: parsAluguel });
  cl('multa', 'Na hipótese de atraso no pagamento do aluguel, a parte Locatária deverá pagar multa de 5% (cinco por cento), calculada sobre o valor do aluguel, acrescida de juros de mora diários de 0,33%.', {
    pars: [
      'O BOLETO SERÁ ENVIADO PARA PROTESTO APÓS 15 (QUINZE) DIAS DO VENCIMENTO.',
      'Após 30 (trinta) dias do vencimento dos boletos, mesmo que protestados, a parte Locatária deverá pagar R$ 5,00 (cinco reais) ao mês por título vencido, a título de taxa bancária para baixa do boleto.',
      'Para a reemissão de cada boleto vencido, com atualização dos juros, será cobrada uma taxa de R$ 5,00 (cinco reais) por boleto.',
    ],
  });
  cl('agua', 'Além do pagamento do aluguel mensal, em decorrência da locação, a parte Locatária se obriga a arcar com o pagamento das tarifas de água e esgoto que incidam sobre o imóvel durante a vigência da presente locação, e mesmo aquelas que, apesar de emitidas após o término do prazo previsto neste instrumento, estejam relacionadas ao período da locação.');
  cl('honorarios', 'Em caso de não pagamento do aluguel — previsto na Cláusula {aluguel} — bem como das obrigações acessórias — previstas na Cláusula {agua} — será facultado à parte Locadora realizar a cobrança por profissional habilitado, hipótese em que a parte Locatária arcará ainda com honorários advocatícios no percentual de 10% (dez por cento) na fase administrativa e 20% (vinte por cento) sobre o débito na fase judicial.', {
    pars: ['Acordam as partes ainda que, na ocorrência de atraso no pagamento do aluguel e despesas acessórias, independente de notificação pela parte Locadora, será efetivado o registro da existência do débito nos órgãos de proteção ao crédito.'],
  });
  cl('cheque', 'Os pagamentos realizados por meio de cheque somente serão considerados quitação da dívida quando devidamente compensados. Na hipótese de não compensação do cheque dado em pagamento, o aluguel será considerado não quitado, ensejando a cobrança de todos os emolumentos devidos, inclusive honorários advocatícios nos mesmos percentuais identificados na Cláusula {honorarios}.');
  cl('titularidade', `A parte Locatária se obriga a transferir a titularidade da conta de água para seu próprio nome antes da retirada das chaves, devendo apresentar os comprovantes/protocolos de transferência. UNIDADE CONSUMIDORA: ${N(d.ucAgua || B)}.`, {
    pars: ['Caso não seja efetuada a transferência de titularidade dentro do prazo máximo de 07 (sete) dias, a parte Locatária declara estar ciente de que a parte Locadora não se responsabiliza pelo corte e não fornecimento de água por falta de pagamento, além de multa que será cobrada da parte Locatária no valor de R$ 100,00 (cem reais) por mês em que não houver a transferência.'],
  });

  sec('Dos deveres das partes');
  cl('deveresLocadora', 'São deveres da parte Locadora, além daqueles já descritos neste instrumento:', {
    lista: [
      'Entregar à parte Locatária o imóvel alugado em estado de servir ao uso a que se destina;',
      'Garantir, durante o tempo da locação, o uso pacífico do imóvel locado;',
      'Manter, durante a locação, a forma e o destino do imóvel;',
      'Responder pelos vícios ou defeitos anteriores à locação;',
      'Fornecer à parte Locatária, caso esta solicite, descrição minuciosa do estado do imóvel quando de sua entrega, com expressa referência aos eventuais defeitos existentes, consubstanciada no termo de vistoria inicial e registro fotográfico;',
      'Fornecer à parte Locatária recibo discriminado das importâncias por esta pagas;',
      'Exibir à parte Locatária, quando solicitado, os comprovantes relativos às parcelas que estejam sendo exigidas;',
      'Realizar o pagamento das despesas extraordinárias que incidam sobre o imóvel e que não estejam descritas neste contrato como obrigação da parte Locatária.',
    ],
  });
  cl('deveresLocataria', 'São deveres da parte Locatária, além daqueles já descritos neste instrumento:', {
    lista: [
      'Levar imediatamente ao conhecimento da parte Locadora o surgimento de qualquer dano ou defeito cuja reparação incumba a ela, bem como as eventuais turbações de terceiros;',
      'Realizar a imediata reparação dos danos verificados no imóvel, ou nas suas instalações, provocados por si, seus dependentes, familiares, visitantes ou prepostos;',
      'Não modificar a forma interna ou externa do imóvel sem o consentimento prévio e por escrito da parte Locadora;',
      'Permitir a vistoria do imóvel pela parte Locadora ou por seu mandatário, mediante combinação prévia de dia e hora, bem como admitir que seja visitado e examinado por terceiros, na hipótese de alienação do imóvel pela parte Locadora;',
      'Consentir com a realização de reparos urgentes cuja realização incumba à parte Locadora, na forma do artigo 26 da Lei de Locações.',
    ],
  });

  sec('Das obrigações da parte Locatária');
  cl('conservacao', 'A parte Locatária deverá administrar, cuidar da limpeza, da ordem e da conservação do imóvel, entregando-o em iguais condições às de quando o recebeu, conforme o termo de vistoria. Ao final da locação, deverá realizar nova pintura interna, com a cor e a marca que constam no laudo de vistoria, tapar os furos de pregos ou parafusos nas paredes e também realizar a manutenção (limpeza) da caixa de gordura pelo menos de 3 (três) em 3 (três) meses.', {
    pars: [
      'Goteiras no telhado decorrentes de vendaval após 05 (cinco) dias corridos da realização da vistoria, bem como goteiras decorrentes de instalação de antenas ou acessórios que necessitem subir no telhado, serão de responsabilidade da parte Locatária.',
      'É dever da parte Locatária entregar o imóvel com todas as lâmpadas e a estrutura de uso preservadas (maçanetas, torneiras, interruptores, portas, janelas, sifões, chaves e controles dos portões). Fica PROIBIDO FURAR AZULEJOS, PORTAS E PISOS, sob pena de reposição idêntica da peça furada, ou renovação total do ambiente com material similar, a critério da parte Locadora.',
      'Imóveis que possuírem cerca elétrica, interfone, sensor de presença, portão eletrônico, câmera de segurança, entre outros acessórios eletrônicos, caso opte por utilizá-los, terão o cuidado e a manutenção de tais equipamentos por conta da parte Locatária.',
    ],
  });

  sec('Das benfeitorias');
  cl('benfeitorias', 'Para a realização de quaisquer benfeitorias, sejam elas úteis, necessárias ou voluptuárias, deverá a parte Locatária solicitar autorização prévia e expressa da parte Locadora.', {
    pars: ['As benfeitorias realizadas no imóvel sem o consentimento da parte Locadora NÃO ensejarão direito à indenização e não autorizam o exercício do direito de retenção.'],
  });

  sec('Do reajuste');
  cl('reajuste', 'O valor do aluguel será reajustado ao término de cada 12 (doze) meses, tendo como base acordo entre as partes ou, na impossibilidade, a aplicação do índice fornecido pelo IGP-M; em caso de falta deste índice, o reajuste será realizado pelo IPCA; na falta dos dois, será utilizado outro índice considerado oficial pelo governo que seja mais favorável à parte Locatária.');

  sec('Da descrição do imóvel');
  cl('descricao', 'A descrição do imóvel está detalhada no termo de vistoria inicial, que integra o presente contrato na qualidade de anexo.', {
    pars: [
      'Qualquer discordância com relação aos termos da vistoria inicial deverá ser apresentada por escrito à parte Locadora no prazo máximo de 07 (sete) dias corridos após a entrega das chaves, sob pena de preclusão e de aceite de todos os seus termos.',
      'Após o prazo de 07 (sete) dias previsto no Parágrafo Primeiro, qualquer dano que surgir no imóvel será de responsabilidade da parte Locatária, com exceção dos vícios ocultos, ou seja, aqueles que já estavam presentes no imóvel antes da entrega das chaves, mas só foram constatados em momento posterior.',
    ],
  });

  sec('Do uso e destinação do imóvel');
  cl('uso', 'O imóvel objeto da presente locação é destinado exclusivamente ao uso residencial da parte Locatária, e não será permitida a mudança de destinação sob qualquer pretexto, especialmente para o depósito de materiais inflamáveis, explosivos ou de qualquer forma prejudiciais ou incômodos para a vizinhança.', {
    pars: ['Fica proibida a perturbação do sossego alheio, como gritarias, algazarras, instrumentos sonoros ou sinais acústicos, principalmente no período entre 22h e 7h.'],
  });

  sec('Do recebimento do imóvel, conservação, modificação e vedações');
  cl('recebimento', 'A parte Locatária declara, para os devidos fins de direito, haver recebido e vistoriado o imóvel em perfeito estado de conservação, higiene e limpeza, e o restituirá em iguais condições quando findo ou rescindido o presente contrato de locação.');
  cl('guarda', 'Durante o período de vigência do presente contrato, a parte Locatária será totalmente responsável pela guarda, manutenção e conservação do imóvel.');
  cl('dano', 'Na hipótese de ocorrência de algum dano ao imóvel, a parte Locatária arcará com os valores necessários para a sua reparação, sob pena de aplicação da multa por descumprimento contratual pactuada neste instrumento.');
  cl('cumprir', 'A parte Locatária se compromete, por si ou seus prepostos, a observar e cumprir os termos deste contrato, inclusive seus anexos.');
  cl('reforma', 'Não será permitida qualquer alteração, modificação, acréscimo, redução ou reforma no imóvel sem a aprovação prévia e por escrito da parte Locadora, e as despesas decorrentes correrão exclusivamente por conta e responsabilidade da parte Locatária, sem que lhe assista direito a indenização e/ou retenção por qualquer obra realizada no imóvel, mesmo a título de benfeitorias e instalações de qualquer espécie e natureza, que não poderão ser retiradas, ficando incorporadas ao imóvel, observado o disposto na Cláusula {benfeitorias} deste instrumento.');
  cl('fechaduras', 'É vedada à parte Locatária a troca do segredo das fechaduras sem a autorização prévia da parte Locadora. A ocorrência de qualquer evento que torne necessária a troca deverá ser imediatamente comunicada à parte Locadora, cuja autorização expressa é imprescindível para que se efetue a troca.');

  sec('Da sublocação');
  cl('sublocacao', 'É vedado à parte Locatária realizar a sublocação do imóvel, transferência, sub-rogação, empréstimo, comodato ou cessão da locação, no todo ou em parte, sem consentimento prévio e por escrito da parte Locadora, a qual poderá recusá-lo, no prazo de 30 (trinta) dias, sem alegar razões.');

  sec('Das obrigações da parte Locadora');
  cl('chaves', 'A parte Locadora deverá entregar as chaves à parte Locatária no primeiro dia de vigência deste contrato, e somente após a realização do termo de vistoria inicial e a devolução do contrato de locação assinado, com firmas reconhecidas em cartório pela parte Locatária.');
  cl('seguranca', 'A parte Locadora afirma estar o imóvel em perfeitas condições de uso, sendo de sua responsabilidade a execução de todas as obras que importarem na segurança do imóvel; as demais, quando autorizadas pela parte Locadora, serão de responsabilidade da parte Locatária.');

  sec('Da garantia locatícia');
  const quem = temFiador ? 'a parte Locatária e seu fiador' : 'a parte Locatária';
  const parsGarantia = [
    'A devolução do imóvel depende da prévia vistoria da parte Locadora, para verificar seu estado e o cumprimento do que dispõem as cláusulas pertinentes deste contrato.',
    'Verificada a ocorrência de estragos, a parte Locatária se obriga a indenizar a parte Locadora pelo valor dos danos existentes e/ou obras a serem efetuadas, correndo ainda por sua conta o aluguel e os encargos pelo tempo em que o imóvel permanecer fechado para reformas.',
    `Na hipótese de o imóvel ser desocupado e as chaves não serem restituídas, ou, restituídas as chaves, o imóvel não estar em conformidade com os termos do contrato, o aluguel continuará vigente até a data da regularização da pendência, não podendo ${quem} se opor à realização do pagamento, sob pena de cobrança, além do aluguel e despesas acessórias, da multa por descumprimento contratual.`,
    `Só serão recebidas as chaves do imóvel mediante a assinatura do TERMO PROVISÓRIO PARA VISTORIA DE SAÍDA DO IMÓVEL, que deverá ser assinado pela parte Locatária${temFiador ? ' ou pelo fiador' : ''}.`,
  ];
  if (temFiador) {
    parsGarantia.unshift(
      'O fiador tem ciência de que suas responsabilidades englobam o pagamento de todas as obrigações locatícias não quitadas pela parte Locatária (aluguel, tarifa de água e esgoto, reformas não realizadas, custas e honorários advocatícios), estendendo-se às majorações do aluguel, às composições amigáveis e judiciais, ao seguro incêndio e/ou a toda responsabilidade sobre o imóvel, bem como aos demais acessórios locatícios.',
      'Declara o fiador ter pleno e absoluto conhecimento de que, na hipótese de prorrogação do contrato, sua responsabilidade não cessará, somente o sendo quando da desocupação e efetiva restituição do imóvel, mediante assinatura do termo de acerto final da locação, não sendo considerado como fim da garantia prestada o término do prazo contratual.',
    );
  }
  cl('garantia', temFiador
    ? `Conforme acordado entre as partes, a garantia exigida será FIADOR, neste ato representado por ${pessoa(F.nome, F.qualificacao, F.rg, F.cpf, F.endereco ? `residente e domiciliado(a) na ${N(F.endereco)}` : '')}, que se responsabiliza, por meio deste instrumento, a arcar com a dívida em caso de inadimplência da parte Locatária.`
    : 'A presente locação é celebrada sem garantia locatícia (fiador, caução ou seguro-fiança).', { pars: parsGarantia });

  sec('Do direito de preferência');
  cl('alienar', 'A parte Locadora, a qualquer tempo, poderá alienar o imóvel, mesmo durante a vigência do contrato de locação e, por via de consequência, ceder os direitos contidos neste contrato ao adquirente.');
  cl('preferencia', 'Em caso de alienação do imóvel, a parte Locadora deverá notificar, de forma inequívoca, a parte Locatária, para que esta possa exercer seu direito de preferência na aquisição do imóvel, nas mesmas condições em que for oferecido a terceiros.', {
    pars: ['Para efetivação do direito de preferência, deverá a parte Locatária responder à notificação, de maneira inequívoca e por escrito, no prazo de 30 (trinta) dias após o seu recebimento.'],
  });
  cl('adquirente', 'Em caso de alienação do imóvel a terceiros, poderá o adquirente denunciar o contrato, com prazo de 90 (noventa) dias para desocupação, salvo nas hipóteses do artigo 8º da Lei 8.245/91.');

  sec('Da prorrogação do contrato');
  cl('prorrogacao', 'O contrato não será prorrogado por prazo indeterminado e, caso haja interesse das partes em prorrogar a relação locatícia, deverá ser firmado um aditivo de renovação de locação.');

  sec('Da cláusula penal');
  cl('penal', 'Fica contratada e estipulada a multa de 10% (dez por cento) do valor remanescente do contrato, a ser cobrada da parte que der causa à sua rescisão antecipada, além da taxa de cancelamento dos boletos emitidos, que corresponde a R$ 5,00 (cinco reais) por boleto.', {
    pars: ['Na hipótese de descumprimento das obrigações locatícias pela parte Locatária, será cobrada multa correspondente a 01 (um) mês de aluguel, sem prejuízo do pagamento dos aluguéis, tributos e encargos devidos por força deste contrato, até a efetiva restituição das chaves à parte Locadora, além de custas e honorários advocatícios fixados em 20% (vinte por cento) sobre o valor da causa, no caso de ações de cobrança de aluguéis e acessórios, despejo e/ou perdas e danos.'],
  });

  sec('Da rescisão');
  cl('rescisao', 'O presente contrato ficará rescindido de pleno direito, independentemente de qualquer aviso, notificação ou interpelação judicial ou extrajudicial, e sem que assista à parte Locatária direito a qualquer indenização, nos seguintes casos:', {
    lista: [
      'Mútuo acordo entre as partes;',
      'Prática de infração legal ou contratual;',
      'Falta de pagamento do aluguel e obrigações acessórias;',
      'Realização de reparos urgentes determinados pelo Poder Público, que não possam ser normalmente executados com a permanência da parte Locatária no imóvel, ou caso esta se recuse a consenti-los.',
    ],
    parsDepois: [
      'Também ocorrerá a rescisão prevista no caput em caso de qualquer evento ou incêndio no imóvel locado que implique sua desocupação, ou sobrevindo processo de desapropriação, total ou parcial, ou qualquer fato de força maior que impeça o uso do imóvel locado.',
      'Na hipótese de abandono do imóvel, a qualquer época, fica desde já autorizada a parte Locadora a reintegrar-se na posse deste, independentemente de qualquer procedimento judicial, bastando que esteja acompanhada de 02 (duas) testemunhas.',
    ],
  });
  cl('descumprimento', 'No caso de descumprimento de qualquer cláusula contratual, o presente contrato também ficará rescindido de pleno direito, independentemente de qualquer aviso, notificação ou interpelação judicial ou extrajudicial, sendo devidos pela parte que der causa os encargos previstos na Cláusula {penal}.', {
    pars: ['Ficam cientes as partes de que o contrato somente será considerado rescindido após a efetiva entrega à parte Locatária do "Termo de Rescisão" pela parte Locadora. O "Termo de Rescisão" somente será formalizado mediante a comprovação, pela parte Locatária, da quitação das despesas de água e esgoto, bem como da execução dos reparos que se fizerem necessários no imóvel, sob pena de continuarem a cargo da parte Locatária o aluguel e as demais taxas acessórias até a efetiva entrega do referido termo.'],
  });

  sec('Da proibição de ruídos e perturbação ao sossego');
  cl('ruidos', 'A parte Locatária obriga-se a abster-se de produzir qualquer tipo de ruído que possa causar incômodo, desconforto ou perturbação aos vizinhos, incluindo, mas não se limitando a: aparelhos de som, televisão, conversas em voz alta, instrumentos musicais, festas, reuniões, uso de equipamentos elétricos ruidosos ou qualquer outra fonte de barulho, a qualquer horário do dia ou da noite.');
  cl('som', 'Fica terminantemente proibido o uso de som, música, alto-falantes ou atividades que gerem ruído que ultrapasse o limite do interior da unidade, sendo vedada a audição ou percepção do barulho pelos demais moradores.');
  cl('ruidosPena', 'O descumprimento desta cláusula sujeitará a parte Locatária:', {
    lista: [
      'À aplicação imediata de multa, no valor estabelecido no contrato, por ocorrência;',
      'À notificação formal, dispensando-se advertências verbais;',
      'Em caso de reincidência, será considerada infração grave, autorizando a parte Locadora a rescindir o contrato de forma unilateral, independentemente de prazo, ônus, devolução proporcional de valores ou aviso prévio, sem prejuízo da cobrança de eventuais danos materiais e morais causados.',
    ],
    parsDepois: ['A parte Locatária declara estar ciente de que qualquer reclamação comprovada de vizinhos ou terceiros será suficiente para caracterizar infração desta cláusula.'],
  });

  sec('Das comunicações');
  cl('comunicacoes', 'As comunicações extrajudiciais e judiciais enviadas à parte Locatária oriundas deste contrato, sejam elas citações, intimações ou notificações, dentre outras, poderão ser feitas mediante correspondência com aviso de recebimento, telefone (ligação ou aplicativo de mensagens) ou endereço eletrônico, nos termos da qualificação apresentada neste contrato, e serão consideradas válidas, salvo se comunicada, por meio idôneo, a alteração de qualquer delas, formalizada mediante aditivo contratual.');

  sec('Das disposições transitórias');
  cl('solidaria', 'Na hipótese de haver mais de um locador ou mais de um locatário, as partes declaram haver responsabilidade solidária sobre todos os direitos e obrigações previstos neste contrato.');
  cl('falecimento', 'Em caso de falecimento da parte Locadora, a locação transmite-se aos herdeiros e sucessores; em caso de falecimento da parte Locatária, ficarão sub-rogados nos seus direitos e obrigações o cônjuge sobrevivente ou o companheiro e, sucessivamente, os herdeiros necessários e as pessoas que viviam na dependência econômica do falecido, desde que residentes no imóvel.');

  sec('Do foro');
  cl('foro', 'Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o foro da Comarca de Silvânia, Goiás.');

  // Numeração e referências
  const num = {};
  let n = 0;
  for (const it of itens) if (it.t === 'clausula') num[it.id] = ++n;
  const ref = (s) => s.replace(/\{(\w+)\}/g, (_, id) => (num[id] ? `${num[id]}ª` : _));
  const parTitulo = (lista, i) => (lista.length === 1 ? 'Parágrafo Único.' : `Parágrafo ${ORD_PAR[i]}.`);

  const blocos = [
    { t: 'titulo', texto: 'Contrato de Locação de Imóvel Residencial' },
    { t: 'secao', texto: 'Identificação das partes contratantes' },
    { t: 'texto', rotulo: 'PARTE LOCADORA:', texto: `${pessoa(L.nome, L.qualificacao, L.rg, L.cpf, `residente e domiciliado(a) na ${N(L.endereco || B)}`)}, doravante neste instrumento designado(a) PARTE LOCADORA.` },
    { t: 'texto', rotulo: 'PARTE LOCATÁRIA:', texto: `${pessoa(T.nome, T.qualificacao, T.rg, T.cpf, `residente em ${N(T.residencia || 'Silvânia Go, CEP 75180-000')}`)}, doravante neste instrumento designado(a) PARTE LOCATÁRIA.` },
    { t: 'texto', texto: 'As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Locação de Imóvel, que se regerá pelas cláusulas seguintes e pelas condições de preço, forma e termo de pagamento nele descritas.' },
  ];
  for (const it of itens) {
    if (it.t === 'secao') { blocos.push(it); continue; }
    blocos.push({ t: 'clausula', rotulo: `CLÁUSULA ${num[it.id]}ª.`, texto: ref(it.texto) });
    it.pars.forEach((p, i) => blocos.push({ t: 'par', rotulo: parTitulo(it.pars, i), texto: ref(p) }));
    it.lista.forEach((p, i) => blocos.push({ t: 'item', rotulo: `${ROM[i]} –`, texto: ref(p) }));
    it.parsDepois.forEach((p, i) => blocos.push({ t: 'par', rotulo: parTitulo(it.parsDepois, i), texto: ref(p) }));
  }
  blocos.push({ t: 'texto', texto: 'E, por estarem assim justas e contratadas, as partes firmam o presente instrumento em 03 (três) vias de igual teor, juntamente com 02 (duas) testemunhas.' });
  blocos.push({ t: 'local', texto: `${N(d.cidade || 'Silvânia')}, ${N(dataLonga(d.dataAssinatura))}.` });
  blocos.push({
    t: 'ass',
    partes: [
      { papel: 'PARTE LOCADORA', nome: String(L.nome || '').toUpperCase(), cpf: L.cpf },
      { papel: 'PARTE LOCATÁRIA', nome: String(T.nome || '').toUpperCase(), cpf: T.cpf },
      ...(temFiador ? [{ papel: 'FIADOR(A)', nome: String(F.nome).toUpperCase(), cpf: F.cpf }] : []),
    ],
  });
  return { blocos, resumo: { meses, primeiro, ultimo, aviso, clausulas: n } };
}
