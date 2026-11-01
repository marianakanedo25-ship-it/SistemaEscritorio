// Assinatura do cookie de login. Usado pelo middleware (edge) e pelo servidor.
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE = 'mc_sessao';
export const DURACAO_DIAS = 30;

async function chave() {
  const base = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'sem-segredo-configurado';
  const dig = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mc-sessao:' + base));
  return new Uint8Array(dig);
}

export async function assinar(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_DIAS}d`)
    .sign(await chave());
}

export async function verificar(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await chave());
    return payload;
  } catch {
    return null;
  }
}
