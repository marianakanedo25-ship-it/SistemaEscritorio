import { NextResponse } from 'next/server';
import { COOKIE, verificar } from './lib/session';

const PUBLICAS = ['/login', '/setup'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (PUBLICAS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  const ok = await verificar(req.cookies.get(COOKIE)?.value);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/|favicon|icon|apple-icon|manifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)'],
};
