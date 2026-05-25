// ═══════════════════════════════════════════════════
//  Motor de búsqueda en base normativa local
//  Sin IA — puro keyword scoring sobre 3.820 artículos
// ═══════════════════════════════════════════════════

import baseRaw from '../data/base_normativa.json';

export interface Article {
  n: string;   // número
  src: string; // CC | CPC | CPP | CT | L21719
  t: string;   // título
  c: string;   // contenido
  url?: string;
}

export const SRCS: Record<string, { label: string; url: string; color: string }> = {
  CT:     { label: 'Código del Trabajo',        url: 'https://bcn.cl/2i6b1',   color: '#1A7F5A' },
  CC:     { label: 'Código Civil',              url: 'https://bcn.cl/S3XGRc',  color: '#0B2B5C' },
  CPC:    { label: 'Cód. Procedimiento Civil',  url: 'https://bcn.cl/3lf95',   color: '#2D6FBF' },
  CPP:    { label: 'Cód. Procesal Penal',       url: 'https://bcn.cl/CSj9FH',  color: '#8B4513' },
  L21719: { label: 'Ley 21.719',               url: 'https://bcn.cl/gJo3hf',  color: '#C9A84C' },
};

// Normaliza texto para búsqueda
function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[°º]/g, '').replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const STOP = new Set([
  'que','del','las','los','una','con','para','por','como','son',
  'sus','este','esta','estos','estas','hay','mas','pero','sin',
  'sobre','entre','ante','bajo','desde','hasta','todo','toda',
  'otro','otra','dicho','dicha','sera','sido','siendo',
]);

// Score de relevancia de un artículo vs. query
function scoreArticle(art: Article, tokens: string[]): number {
  const haystack = normalize(`${art.n} ${art.t} ${art.c}`);
  let score = 0;
  for (const tok of tokens) {
    if (!haystack.includes(tok)) continue;
    const hits = (haystack.match(new RegExp(tok, 'g')) || []).length;
    if (normalize(art.n) === tok) score += 20;           // número exacto
    else if (normalize(art.t).includes(tok)) score += 6 * hits; // en título
    else score += hits;                                  // en contenido
  }
  return score;
}

// Búsqueda principal
export function searchBase(query: string, srcFilter?: string, topN = 5): Article[] {
  const tokens = normalize(query).split(' ')
    .filter(w => w.length > 2 && !STOP.has(w));
  if (!tokens.length) return [];

  const pool = (baseRaw as any[]).map(a => ({
    n: a.n, src: a.src, t: a.t || '', c: a.c
  })) as Article[];

  const filtered = srcFilter ? pool.filter(a => a.src === srcFilter) : pool;

  const scored = filtered
    .map(art => ({ art, score: scoreArticle(art, tokens) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map(x => ({
    ...x.art,
    url: SRCS[x.art.src]?.url,
  }));
}

// Formato de artículos para WhatsApp (texto plano)
export function formatForWhatsApp(results: Article[]): string {
  return results.map(a => {
    const s = SRCS[a.src] || { label: a.src, url: '' };
    const title = a.t ? `\n_${a.t}_` : '';
    const content = a.c.length > 350 ? a.c.slice(0, 350) + '…' : a.c;
    return `📋 Art. ${a.n} — ${s.label}${title}\n${content}\n🔗 ${s.url}`;
  }).join('\n\n');
}

// Stats de la base
export function getBaseStats() {
  const pool = baseRaw as any[];
  const counts: Record<string, number> = {};
  for (const a of pool) counts[a.src] = (counts[a.src] || 0) + 1;
  return { total: pool.length, bySource: counts };
}
