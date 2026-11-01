'use server';
import { revalidatePath } from 'next/cache';
import { exigir } from '@/lib/auth';
import { carregarExemplos, apagarExemplos } from '@/lib/exemplos';

async function soAdmin() {
  const u = await exigir();
  if (u.papel !== 'admin') throw new Error('Apenas a administradora pode fazer isso.');
}

export async function acaoCarregarExemplos() {
  await soAdmin();
  await carregarExemplos();
  revalidatePath('/', 'layout');
}

export async function acaoApagarExemplos() {
  await soAdmin();
  await apagarExemplos();
  revalidatePath('/', 'layout');
}
