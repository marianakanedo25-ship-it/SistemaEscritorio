import 'server-only';
import { q } from './db';
import { CORES_PROJETO } from './format';

/** Próxima cor livre: a menos usada entre os projetos que não estão concluídos. */
export async function proximaCorProjeto() {
  const uso = Object.fromEntries(CORES_PROJETO.map((c) => [c.toLowerCase(), 0]));
  for (const r of await q(`SELECT lower(cor) AS cor, count(*)::int AS n FROM projetos WHERE status <> 'concluido' GROUP BY 1`)) {
    if (r.cor in uso) uso[r.cor] = r.n;
  }
  return CORES_PROJETO.reduce((melhor, c) => (uso[c.toLowerCase()] < uso[melhor.toLowerCase()] ? c : melhor), CORES_PROJETO[0]);
}
