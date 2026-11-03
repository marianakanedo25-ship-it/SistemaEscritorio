// Cálculo da energia das kitnets (servidor e navegador).
import { diasAte, data } from './format';

export function calcLeitura(l) {
  const consumo = (Number(l.leitura_atual) || 0) - (Number(l.leitura_anterior) || 0);
  const franquia = Number(l.franquia_kwh) || 0;
  const excedente = Math.max(0, consumo - franquia);
  const total = Math.round(excedente * (Number(l.valor_kwh) || 0) * 100) / 100;
  return { consumo, franquia, excedente, total, inconsistente: consumo < 0 };
}

export function nomeUnidade(u) {
  return `Kitnet ${String(u.numero).padStart(2, '0')}`;
}

/** Situação do contrato: texto e tom da etiqueta. */
export function situacaoContrato(u) {
  if (!u.fim) return { texto: 'Sem data de fim', tom: 'mute' };
  const n = diasAte(u.fim);
  if (n < 0) return { texto: `Venceu em ${data(u.fim)}`, tom: 'bad' };
  if (n <= 60) return { texto: `Vence em ${n} dia${n === 1 ? '' : 's'}`, tom: 'warn' };
  return { texto: `Até ${data(u.fim)}`, tom: 'ok' };
}
