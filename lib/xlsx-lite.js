import 'server-only';
import { inflateRawSync } from 'node:zlib';

/** Lê um arquivo .xlsx (zip) sem dependências. Devolve { [nomeDaAba]: { A1: {v, f} } } */
export function lerXlsx(buf) {
  const arquivos = unzip(Buffer.from(buf));
  const txt = (n) => (arquivos[n] ? arquivos[n].toString('utf8') : '');
  const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&amp;/g, '&');

  const shared = [];
  for (const si of txt('xl/sharedStrings.xml').match(/<si>[\s\S]*?<\/si>/g) || []) {
    shared.push(dec((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map((t) => t.replace(/<t[^>]*>|<\/t>/g, '')).join('')));
  }
  const rels = {};
  for (const r of txt('xl/_rels/workbook.xml.rels').match(/<Relationship [^>]*>/g) || []) {
    const id = r.match(/Id="([^"]+)"/)?.[1]; const alvo = r.match(/Target="([^"]+)"/)?.[1];
    if (id && alvo) rels[id] = alvo.replace(/^\/?(xl\/)?/, 'xl/');
  }
  const abas = {};
  for (const s of txt('xl/workbook.xml').match(/<sheet [^>]*>/g) || []) {
    const nome = dec(s.match(/name="([^"]+)"/)?.[1] || '');
    const rid = s.match(/r:id="([^"]+)"/)?.[1];
    const xml = txt(rels[rid] || '');
    const cel = {};
    for (const c of xml.match(/<c [^>]*?(\/>|>[\s\S]*?<\/c>)/g) || []) {
      const ref = c.match(/ r="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const t = c.match(/ t="(\w+)"/)?.[1];
      const f = /<f[ >]/.test(c) || /<f\/>/.test(c);
      let v = c.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (t === 'inlineStr') v = (c.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1];
      if (v == null) continue;
      if (t === 's') v = shared[Number(v)];
      else if (t === 'str' || t === 'inlineStr') v = dec(v);
      else if (t === 'b') v = v === '1';
      else if (!isNaN(Number(v))) v = Number(v);
      cel[ref] = { v, f };
    }
    abas[nome] = cel;
  }
  return abas;
}

function unzip(b) {
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (b.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Arquivo não é um .xlsx válido.');
  const total = b.readUInt16LE(eocd + 10);
  let p = b.readUInt32LE(eocd + 16);
  const out = {};
  for (let k = 0; k < total; k++) {
    if (b.readUInt32LE(p) !== 0x02014b50) break;
    const metodo = b.readUInt16LE(p + 10);
    const tam = b.readUInt32LE(p + 20);
    const nl = b.readUInt16LE(p + 28), el = b.readUInt16LE(p + 30), cl = b.readUInt16LE(p + 32);
    const local = b.readUInt32LE(p + 42);
    const nome = b.toString('utf8', p + 46, p + 46 + nl);
    const ini = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28);
    const dados = b.subarray(ini, ini + tam);
    if (/\.(xml|rels)$/.test(nome)) out[nome] = metodo === 8 ? inflateRawSync(dados) : dados;
    p += 46 + nl + el + cl;
  }
  return out;
}

/** Número de série do Excel → 'AAAA-MM-DD' */
export function dataExcel(n) {
  if (typeof n !== 'number' || !isFinite(n)) return null;
  return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000).toISOString().slice(0, 10);
}
