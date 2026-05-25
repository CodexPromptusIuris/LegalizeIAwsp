// ═══════════════════════════════════════════════════
//  Webhook WhatsApp Cloud API — Meta
//  GET  → verificación del webhook
//  POST → mensajes entrantes
// ═══════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { canQuery, incrementUsage, remainingQueries, getLimitMessage, isPro } from '../../../lib/limits';
import { askAgent, clearHistory } from '../../../lib/agent';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const PHONE_ID    = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const TOKEN       = process.env.WHATSAPP_ACCESS_TOKEN!;
const PAYMENT_LINK = process.env.PAYMENT_LINK || 'https://wa.me/56929648142?text=Quiero+Plan+Pro';

// ── Mensajes fijos ───────────────────────────────────────────
const FREE_LIMIT = parseInt(process.env.FREE_LIMIT || '5');

function welcomeMsg(): string {
  return `⚖️ Bienvenido a Legalizes
Agente jurídico chileno — VibeCodingChile

Soy tu asistente legal especializado en:
💼 Derecho Laboral (despidos, indemnizaciones)
📜 Derecho Civil (contratos, arrendamiento)
🛡️ Derecho Penal (derechos del imputado)
🔐 Ley 21.719 (datos personales)
📋 Procedimiento Civil y Penal

Tienes ${FREE_LIMIT} consultas gratuitas por día.
Plan Pro ilimitado: ${PAYMENT_LINK}

¿Cuál es tu consulta legal? 👇`;
}

function helpMsg(): string {
  return `⚖️ Legalizes — Comandos

hola / inicio → Mensaje de bienvenida
ayuda → Este menú
plan → Info Plan Pro
borrar → Limpiar historial

O escribe tu consulta legal directamente.
Ejemplo: ¿Qué dice el artículo 161 del Código del Trabajo?`;
}

function planMsg(): string {
  return `⚖️ Plan Pro — Legalizes

✅ Consultas ilimitadas
✅ Análisis de contratos
✅ Prioridad de respuesta
✅ Historial completo

💰 $99.000 CLP / mes

👉 ${PAYMENT_LINK}`;
}

// ── Enviar mensaje a WhatsApp ────────────────────────────────
async function sendWhatsApp(to: string, text: string) {
  // WhatsApp tiene límite de 4096 chars por mensaje
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += 4000) {
    chunks.push(text.slice(i, i + 4000));
  }

  for (const chunk of chunks) {
    await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: chunk },
      }),
    });
  }
}

// ── GET — verificación Meta ──────────────────────────────────
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode      = params.get('hub.mode');
  const token     = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado por Meta');
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// ── POST — mensajes entrantes ────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Siempre responder 200 a Meta rápido (evita reintentos)
  const entry   = body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const value   = changes?.value;
  const messages = value?.messages;

  if (!messages?.length) {
    return NextResponse.json({ ok: true });
  }

  const msg  = messages[0];
  const from = msg.from; // número del usuario: 56912345678
  const type = msg.type;

  // Solo mensajes de texto
  if (type !== 'text') {
    await sendWhatsApp(from, '⚠️ Solo proceso mensajes de texto por ahora.');
    return NextResponse.json({ ok: true });
  }

  const text = msg.text?.body?.trim() || '';
  if (!text) return NextResponse.json({ ok: true });

  const textLow = text.toLowerCase();
  console.log(`📩 ${from}: ${text.slice(0, 80)}`);

  // ── Comandos especiales ────────────────────────────────────
  if (['hola', 'inicio', 'start', 'hi', 'hello', 'ola'].includes(textLow)) {
    await sendWhatsApp(from, welcomeMsg());
    return NextResponse.json({ ok: true });
  }

  if (['ayuda', 'help', 'menu', 'menú', '/help', '/start'].includes(textLow)) {
    await sendWhatsApp(from, helpMsg());
    return NextResponse.json({ ok: true });
  }

  if (textLow.includes('plan') || textLow.includes('precio') || textLow.includes('suscri') || textLow === 'pro') {
    await sendWhatsApp(from, planMsg());
    return NextResponse.json({ ok: true });
  }

  if (['borrar', 'limpiar', 'reset', 'nueva consulta'].includes(textLow)) {
    clearHistory(from);
    await sendWhatsApp(from, '✅ Historial borrado. ¿Cuál es tu consulta legal?');
    return NextResponse.json({ ok: true });
  }

  // ── Verificar límite ───────────────────────────────────────
  if (!canQuery(from)) {
    await sendWhatsApp(from, getLimitMessage());
    return NextResponse.json({ ok: true });
  }

  // ── Consulta legal → Claude ────────────────────────────────
  try {
    incrementUsage(from);
    const reply = await askAgent(from, text);

    // Footer con consultas restantes (solo plan Free y pocas restantes)
    const remaining = remainingQueries(from);
    const footer = !isPro(from) && remaining <= 2
      ? `\n\n─────\n💡 Te quedan ${remaining} consulta${remaining !== 1 ? 's' : ''} gratis hoy.\nPlan Pro ilimitado: ${PAYMENT_LINK}`
      : '';

    await sendWhatsApp(from, reply + footer);
    console.log(`✅ Respondido → ${from} (restantes: ${remaining})`);

  } catch (err: any) {
    console.error('❌ Error agente:', err.message);
    await sendWhatsApp(from, '⚠️ Error temporal. Por favor intenta de nuevo en un momento.');
  }

  return NextResponse.json({ ok: true });
}
