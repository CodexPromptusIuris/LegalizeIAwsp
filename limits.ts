// ═══════════════════════════════════════════════════
//  Rate limiting + suscripciones
//  En Vercel serverless usamos un Map en memoria
//  Para producción real → reemplazar con Redis/KV
// ═══════════════════════════════════════════════════

// Vercel KV (opcional) — descomenta si tienes @vercel/kv
// import { kv } from '@vercel/kv';

interface UsageEntry {
  date: string;
  count: number;
}

// En memoria (se resetea en cada cold start de Vercel)
// Para persistencia real usa Vercel KV o una DB
const USAGE_MAP = new Map<string, UsageEntry>();

const FREE_LIMIT = parseInt(process.env.FREE_LIMIT || '5');

// Números Pro separados por coma en env var
function getProNumbers(): Set<string> {
  const raw = process.env.PRO_NUMBERS || '';
  return new Set(raw.split(',').map(n => n.trim()).filter(Boolean));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizePhone(phone: string): string {
  // Baileys entrega formato: 56912345678@s.whatsapp.net
  return phone.replace('@s.whatsapp.net', '').replace('@c.us', '');
}

export function isPro(rawPhone: string): boolean {
  const phone = normalizePhone(rawPhone);
  const proNums = getProNumbers();
  return proNums.has(phone) || proNums.has('+' + phone) || proNums.has(phone.replace(/\D/g, ''));
}

export function canQuery(rawPhone: string): boolean {
  if (isPro(rawPhone)) return true;
  const phone = normalizePhone(rawPhone);
  const entry = USAGE_MAP.get(phone);
  if (!entry || entry.date !== today()) return true;
  return entry.count < FREE_LIMIT;
}

export function incrementUsage(rawPhone: string): void {
  const phone = normalizePhone(rawPhone);
  const entry = USAGE_MAP.get(phone);
  if (!entry || entry.date !== today()) {
    USAGE_MAP.set(phone, { date: today(), count: 1 });
  } else {
    entry.count++;
  }
}

export function remainingQueries(rawPhone: string): number {
  if (isPro(rawPhone)) return 999;
  const phone = normalizePhone(rawPhone);
  const entry = USAGE_MAP.get(phone);
  if (!entry || entry.date !== today()) return FREE_LIMIT;
  return Math.max(0, FREE_LIMIT - entry.count);
}

export function getLimitMessage(): string {
  const link = process.env.PAYMENT_LINK || 'https://wa.me/56929648142?text=Quiero+Plan+Pro';
  return `⚠️ Alcanzaste tu límite de ${FREE_LIMIT} consultas gratuitas de hoy.\n\nPara continuar con consultas ilimitadas:\n👉 Plan Pro $99.000/mes\n${link}\n\nMañana se reinician tus consultas gratuitas. ✅`;
}
