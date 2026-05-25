# ⚖️ LEGALIZES — Deploy en Vercel + WhatsApp Cloud API

## Lo que necesitas (todo gratis para empezar)
- Cuenta GitHub → https://github.com
- Cuenta Vercel → https://vercel.com (gratis)
- Cuenta Meta for Developers → https://developers.facebook.com (gratis)
- API Key Anthropic → https://console.anthropic.com (pago por uso)

---

## PASO 1 — Sube el código a GitHub

```bash
cd legalizes-vercel
git init
git add .
git commit -m "Legalizes WhatsApp bot"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/legalizes-whatsapp.git
git push -u origin main
```

---

## PASO 2 — Deploy en Vercel

1. Ve a https://vercel.com/new
2. Importa tu repo de GitHub
3. Framework: **Next.js** (detectado automático)
4. Agrega las variables de entorno (copia desde `.env.example`):

| Variable | Valor |
|----------|-------|
| `ANTHROPIC_API_KEY` | Tu key de Anthropic |
| `WHATSAPP_PHONE_NUMBER_ID` | Del panel Meta (paso 3) |
| `WHATSAPP_ACCESS_TOKEN` | Del panel Meta (paso 3) |
| `WHATSAPP_VERIFY_TOKEN` | Escribe cualquier texto secreto, ej: `legalizes2024` |
| `PRO_NUMBERS` | Tu número: `+56912345678` |
| `FREE_LIMIT` | `5` |
| `PAYMENT_LINK` | Tu link de pago |
| `NEXT_PUBLIC_WA_NUMBER` | Tu número sin +: `56912345678` |

5. Click **Deploy** → espera 2 minutos
6. Copia la URL de tu deploy: `https://legalizes-whatsapp.vercel.app`

---

## PASO 3 — Configurar WhatsApp en Meta

### 3.1 Crear la App
1. Ve a https://developers.facebook.com
2. "Mis apps" → "Crear app"
3. Tipo: **Empresa** → Siguiente
4. Nombre: "Legalizes" → Crear app

### 3.2 Agregar WhatsApp
1. En el panel de la app → "Agregar producto"
2. Busca **WhatsApp** → Configurar
3. En "Primeros pasos":
   - Copia el **Phone Number ID** → pégalo en Vercel como `WHATSAPP_PHONE_NUMBER_ID`
   - Copia el **Token de acceso temporal** → pégalo como `WHATSAPP_ACCESS_TOKEN`

### 3.3 Configurar el Webhook
1. En el panel WhatsApp → "Configuración" → "Webhooks"
2. Click "Configurar webhooks"
3. URL de devolución de llamada:
   ```
   https://TU-PROYECTO.vercel.app/api/webhook
   ```
4. Token de verificación: el mismo que pusiste en `WHATSAPP_VERIFY_TOKEN`
5. Click "Verificar y guardar"
6. En "Campos de webhook" → activa **messages**

### 3.4 Token permanente (para producción)
El token temporal dura 24h. Para permanente:
1. Ve a Configuración → Usuarios del sistema → Crear usuario del sistema
2. Genera un token con permisos `whatsapp_business_messaging`
3. Actualiza `WHATSAPP_ACCESS_TOKEN` en Vercel

---

## PASO 4 — Prueba

Escríbele al número de WhatsApp Business:
- `hola` → debe responder con mensaje de bienvenida
- `¿Qué dice el artículo 161 del Código del Trabajo?` → respuesta legal con Claude

Verifica los logs en: https://vercel.com → tu proyecto → "Functions" → "Logs"

---

## PASO 5 — Agregar clientes Pro

En Vercel → Settings → Environment Variables:
```
PRO_NUMBERS=+56912345678,+56987654321,+56911223344
```
Redeploy automático (o click "Redeploy").

---

## Verificar que funciona

Abre en el navegador:
```
https://TU-PROYECTO.vercel.app/api/status
```

Deberías ver:
```json
{
  "status": "ok",
  "agent": "Legalizes Chile",
  "base": { "total": 3820, "bySource": { "CC": 2412, "CPC": 898, ... } }
}
```

---

## Estructura del proyecto

```
legalizes-vercel/
├── app/
│   ├── api/
│   │   ├── webhook/route.ts   ← Recibe mensajes de WhatsApp
│   │   └── status/route.ts    ← Health check
│   ├── layout.tsx
│   └── page.tsx               ← Landing page
├── lib/
│   ├── agent.ts               ← Lógica Claude + base local
│   ├── search.ts              ← Motor búsqueda 3.820 artículos
│   └── limits.ts              ← Rate limiting + suscripciones
├── data/
│   └── base_normativa.json    ← 1.3MB de artículos legales
├── .env.example
└── DEPLOY.md                  ← Este archivo
```

---

## Costos estimados Vercel

| Plan | Precio | Límites |
|------|--------|---------|
| Hobby (gratis) | $0 | 100GB bandwidth, funciones serverless |
| Pro | $20/mes | Sin límites prácticos |

Para empezar el plan **Hobby gratis** es suficiente.

---

## Si algo falla

**El webhook no verifica:**
→ Revisa que `WHATSAPP_VERIFY_TOKEN` en Vercel sea idéntico al que pusiste en Meta

**No llegan mensajes:**
→ En Meta, verifica que el campo `messages` esté activado en webhooks

**Error 401 al enviar:**
→ El token de acceso expiró (son temporales). Genera uno permanente

**Build falla en Vercel:**
→ Revisa que `data/base_normativa.json` esté en el repo (no en .gitignore)
