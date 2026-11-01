import 'server-only';
import { q } from './db';
import { ymValido, mesAtual } from './format';

export async function listasApoio() {
  const [clientes, projetos] = await Promise.all([
    q('SELECT id, nome FROM clientes ORDER BY lower(nome)'),
    q(`SELECT p.id, p.nome, c.nome AS cliente FROM projetos p LEFT JOIN clientes c ON c.id = p.cliente_id ORDER BY p.status = 'concluido', p.nome`),
  ]);
  return { clientes, projetos };
}

export async function mesDe(searchParams) {
  const sp = await searchParams;
  return { sp: sp || {}, ym: ymValido(sp?.m) || mesAtual() };
}
