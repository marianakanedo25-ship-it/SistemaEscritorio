import 'server-only';
import { q, one } from './db';
import { hoje, addDias, ETAPAS_PADRAO } from './format';

const TABELAS = ['eventos', 'notas_fiscais', 'receitas', 'despesas', 'compras', 'repasses', 'contratos', 'orcamentos', 'servicos', 'projetos', 'clientes'];

export async function temExemplos() {
  const r = await one(`SELECT
    (SELECT count(*)::int FROM clientes WHERE exemplo) + (SELECT count(*)::int FROM projetos WHERE exemplo) AS n,
    (SELECT count(*)::int FROM clientes) AS clientes`);
  return { exemplos: r.n > 0, vazio: r.clientes === 0 };
}

export async function apagarExemplos() {
  for (const t of TABELAS) await q(`DELETE FROM ${t} WHERE exemplo`);
}

async function ins(tabela, dados) {
  const campos = Object.keys(dados);
  const row = await one(
    `INSERT INTO ${tabela} (${campos.join(', ')}, exemplo) VALUES (${campos.map((_, i) => '$' + (i + 1)).join(', ')}, TRUE) RETURNING id`,
    campos.map((k) => (k === 'dados' ? JSON.stringify(dados[k]) : dados[k]))
  );
  return row.id;
}

/** Cria clientes, projetos, prazos, contratos e lançamentos fictícios, com datas em volta de hoje. */
export async function carregarExemplos() {
  await apagarExemplos();
  const h = hoje();
  const d = (n) => addDias(h, n);
  const mes = (n, dia) => {
    let [y, m] = h.split('-').map(Number);
    m += n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; }
    return `${y}-${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  };

  const andrade = await ins('clientes', { nome: 'Família Andrade (exemplo)', telefone: '(62) 99999-0001', email: 'andrade@exemplo.com', documento: '000.000.000-00', cidade: 'Goiânia', origem: 'Indicação', endereco: 'Rua Exemplo, 100, Setor Bueno', obs: 'Cliente fictício para demonstração.' });
  const cafe = await ins('clientes', { nome: 'Café Bom Grão (exemplo)', telefone: '(62) 99999-0002', email: 'contato@exemplo.com', cidade: 'Goiânia', origem: 'Instagram', obs: 'Cliente fictício para demonstração.' });
  const rezende = await ins('clientes', { nome: 'Juliana Rezende (exemplo)', telefone: '(62) 99999-0003', origem: 'Loja' });

  // Residência Andrade: em andamento, metade das etapas feitas, uma atrasada
  const pA = await ins('projetos', { cliente_id: andrade, nome: 'Residência Andrade', tipo: 'Interiores residencial', area: 240, valor: 36000, status: 'andamento', cor: '#A0826D', inicio: d(-45), previsao: d(60), endereco_obra: 'Rua Exemplo, 100, Setor Bueno' });
  const nA = ETAPAS_PADRAO.length, feitas = Math.floor(nA / 2) - 1;
  const prazosA = ETAPAS_PADRAO.map((_, i) => (i < feitas ? -42 + i * 6 : i === feitas ? -2 : (i - feitas) * 6));
  for (let i = 0; i < nA; i++) {
    const st = i < feitas ? 'concluida' : i <= feitas + 1 ? 'andamento' : 'pendente';
    await q('INSERT INTO etapas (projeto_id, ordem, nome, prazo, status) VALUES ($1,$2,$3,$4,$5)', [pA, i, ETAPAS_PADRAO[i][0], d(prazosA[i]), st]);
  }
  // Café Bom Grão: projeto comercial menor
  const pC = await ins('projetos', { cliente_id: cafe, nome: 'Interiores Café Bom Grão', tipo: 'Interiores comercial', area: 85, valor: 14500, status: 'andamento', cor: '#6F7F8F', inicio: d(-10), previsao: d(45) });
  const etC = [['Reunião de briefing', -8, 'concluida'], ['Levantamento técnico', -5, 'concluida'], ['Estudo de layout', 2, 'andamento'], ['Modelagem 3D', 9, 'pendente'], ['Renderização', 16, 'pendente'], ['Projeto executivo', 30, 'pendente'], ['Detalhamento de marcenaria', 40, 'pendente']];
  for (let i = 0; i < etC.length; i++) await q('INSERT INTO etapas (projeto_id, ordem, nome, prazo, status) VALUES ($1,$2,$3,$4,$5)', [pC, i, etC[i][0], d(etC[i][1]), etC[i][2]]);
  // Apartamento Rezende: ainda é proposta
  const pR = await ins('projetos', { cliente_id: rezende, nome: 'Apartamento Rezende', tipo: 'Interiores residencial', area: 120, valor: 19800, status: 'proposta', cor: '#B58B8B' });
  for (let i = 0; i < 4; i++) await q('INSERT INTO etapas (projeto_id, ordem, nome, status) VALUES ($1,$2,$3,$4)', [pR, i, ETAPAS_PADRAO[i][0], 'pendente']);

  // Contratos
  await ins('contratos', { projeto_id: pA, cliente_id: andrade, descricao: 'Projeto de interiores completo', valor: 36000, status: 'assinado', enviado_em: d(-50), assinado_em: d(-46) });
  await ins('contratos', { projeto_id: pC, cliente_id: cafe, descricao: 'Interiores comercial + acompanhamento', valor: 14500, status: 'aguardando', enviado_em: d(-3) });
  await ins('contratos', { projeto_id: pR, cliente_id: rezende, descricao: 'Projeto de interiores · 120 m²', valor: 19800, status: 'rascunho' });

  // Cobranças
  const parc = [[mes(-2, 10), true], [mes(-1, 10), true], [mes(0, 10), h >= mes(0, 10)], [mes(1, 10), false]];
  for (let i = 0; i < parc.length; i++) {
    await ins('receitas', { cliente_id: andrade, projeto_id: pA, descricao: `Parcela ${i + 1}/4 — Residência Andrade`, valor: 9000, vencimento: parc[i][0], pago_em: parc[i][1] ? parc[i][0] : null, forma: 'Pix' });
  }
  await ins('receitas', { cliente_id: cafe, projeto_id: pC, descricao: 'Entrada — Interiores Café Bom Grão', valor: 4350, vencimento: d(-9), pago_em: d(-9), forma: 'Transferência' });
  await ins('receitas', { cliente_id: cafe, projeto_id: pC, descricao: 'Parcela 1/2 — Interiores Café Bom Grão', valor: 5075, vencimento: d(-4), forma: 'Boleto' });
  await ins('receitas', { cliente_id: cafe, projeto_id: pC, descricao: 'Parcela 2/2 — Interiores Café Bom Grão', valor: 5075, vencimento: d(26), forma: 'Boleto' });
  await ins('notas_fiscais', { numero: '0001', cliente_id: andrade, projeto_id: pA, valor: 9000, emissao: mes(-1, 10), status: 'enviada' });

  // Despesas do escritório
  await ins('despesas', { descricao: 'Aluguel da estrutura (rateio)', categoria: 'Aluguel e condomínio', valor: 360, vencimento: mes(0, 5), pago_em: h >= mes(0, 5) ? mes(0, 5) : null, forma: 'Pix' });
  await ins('despesas', { descricao: 'Contabilidade', categoria: 'Contabilidade', fornecedor: 'Escritório contábil', valor: 250, vencimento: mes(0, 10), pago_em: h >= mes(0, 10) ? mes(0, 10) : null, forma: 'Boleto' });
  await ins('despesas', { descricao: 'Licença do software de projeto', categoria: 'Software e licenças', valor: 180, vencimento: mes(0, 20), forma: 'Cartão de crédito' });
  await ins('despesas', { descricao: 'Plotagens para apresentação', categoria: 'Impressões e plotagens', projeto_id: pA, valor: 120, vencimento: d(-6), pago_em: d(-6), forma: 'Pix' });
  await ins('repasses', { parceiro: 'Estúdio de render (exemplo)', descricao: 'Renderização de 6 imagens', projeto_id: pA, valor: 1200, vencimento: d(8), forma: 'Pix' });
  await ins('compras', { fornecedor: 'Loja de revestimentos', descricao: 'Amostras de revestimento', projeto_id: pC, valor: 180, data: d(-2), status: 'entregue', pago_em: d(-2) });

  // Compromissos
  await ins('eventos', { titulo: 'Apresentação do estudo preliminar', data: d(2), hora: '10:00', tipo: 'reuniao', projeto_id: pA, cliente_id: andrade, local: 'Escritório' });
  await ins('eventos', { titulo: 'Visita técnica na obra', data: d(4), hora: '14:30', tipo: 'visita', projeto_id: pC, cliente_id: cafe, local: 'Loja do cliente' });
  await ins('eventos', { titulo: 'Reunião de proposta', data: d(6), hora: '09:00', tipo: 'reuniao', projeto_id: pR, cliente_id: rezende, local: 'Videochamada' });

  // Preços e orçamento
  await ins('servicos', { nome: 'Projeto de interiores completo (exemplo)', unidade: 'm²', valor: 150, descricao: 'Do briefing ao caderno executivo' });
  await ins('servicos', { nome: 'Consultoria de interiores (exemplo)', unidade: 'visita', valor: 450, descricao: 'Visita de 2 horas com orientações' });
  await ins('servicos', { nome: 'Acompanhamento de obra (exemplo)', unidade: 'visita', valor: 300 });
  await ins('orcamentos', {
    cliente_id: rezende, nome: 'Apartamento Rezende', tipo: 'Interiores residencial', area: 120, valor: 19800, status: 'enviado', data: d(-1),
    dados: { fator: '1', parcelas: 4, valorFinal: 19800, etapas: ETAPAS_PADRAO.map(([nome, horas]) => ({ nome, horas, on: true })), desp: [{ nome: 'Deslocamento e visitas', valor: 200 }, { nome: 'Impressões e entrega física', valor: 150 }] },
  });
}
