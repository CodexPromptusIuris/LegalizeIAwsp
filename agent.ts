// ═══════════════════════════════════════════════════
//  Agente legal — llama a Claude con contexto local
// ═══════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';
import { searchBase, formatForWhatsApp } from './search';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `Eres Legalizes, agente jurídico especializado en derecho chileno. Creado por VibeCodingChile.

REGLAS ESTRICTAS:
- Responde SOLO sobre derecho chileno vigente
- NUNCA inventes artículos, ROL de causas ni jurisprudencia
- Siempre cita: nombre ley + número artículo + URL BCN verificable
- Si no sabes o no tienes el artículo exacto, dilo claramente
- Texto plano para WhatsApp (sin Markdown con asteriscos dobles)
- Máximo 600 palabras por respuesta

BASE NORMATIVA ACTIVA:
- Código Civil (DFL-1/2000) → https://bcn.cl/S3XGRc
- Código de Procedimiento Civil (Ley 1552) → https://bcn.cl/3lf95
- Código Procesal Penal (Ley 19696) → https://bcn.cl/CSj9FH
- Código del Trabajo (DFL-1/2003) → https://bcn.cl/2i6b1
- Código Penal (1874) → https://bcn.cl/1pciT
- Ley 21.719 datos personales → https://bcn.cl/gJo3hf

FORMATO RESPUESTA WhatsApp:
⚖️ [MATERIA LEGAL]

[Análisis breve 2-3 oraciones]

📋 [Norma] Art. XX — [título si existe]
[texto del artículo]
🔗 [URL BCN]

✅ [Conclusión práctica 1-2 oraciones]

⚠️ Información de referencia. Consulta a un abogado habilitado.`;

// Historial en memoria por número (máx 6 mensajes = 3 intercambios)
const HISTORY = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

export function clearHistory(phone: string) {
  HISTORY.delete(phone);
}

export async function askAgent(phone: string, userMessage: string): Promise<string> {
  // 1. Buscar artículos relevantes en base local
  const localResults = searchBase(userMessage, undefined, 4);
  const localContext = localResults.length > 0
    ? `\n\nARTÍCULOS RELEVANTES DE LA BASE LOCAL (cítalos si aplican):\n${formatForWhatsApp(localResults)}`
    : '';

  // 2. Historial del usuario
  if (!HISTORY.has(phone)) HISTORY.set(phone, []);
  const history = HISTORY.get(phone)!;

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history,
    { role: 'user', content: userMessage + localContext },
  ];

  // 3. Llamar a Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM,
    messages,
  });

  const reply = (response.content[0] as { text: string }).text;

  // 4. Actualizar historial (máx 6 entradas)
  history.push({ role: 'user', content: userMessage });
  history.push({ role: 'assistant', content: reply });
  if (history.length > 6) history.splice(0, history.length - 6);

  return reply;
}
