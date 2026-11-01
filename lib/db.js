import 'server-only';
import { neon } from '@neondatabase/serverless';
import { SCHEMA } from './schema';

let client = null;
let ready = null;

function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('A variável DATABASE_URL não está configurada na Vercel.');
    client = neon(url);
  }
  return client;
}

async function ensureSchema() {
  if (!ready) {
    const s = sql();
    ready = s.transaction(SCHEMA.map((stmt) => s.query(stmt))).catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

/** Roda uma consulta e devolve as linhas. Use $1, $2… para os valores. */
export async function q(text, params = []) {
  await ensureSchema();
  return sql().query(text, params);
}

/** Primeira linha da consulta, ou null. */
export async function one(text, params = []) {
  const rows = await q(text, params);
  return rows[0] ?? null;
}

export async function getConfig(chave, padrao) {
  const row = await one('SELECT valor FROM config WHERE chave = $1', [chave]);
  return row ? row.valor : padrao;
}

export async function setConfig(chave, valor) {
  await q(
    `INSERT INTO config (chave, valor) VALUES ($1, $2::jsonb)
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
    [chave, JSON.stringify(valor)]
  );
}
