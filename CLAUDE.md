# Wellcomy — CLAUDE.md

Plataforma SaaS de orientación migratoria a España. Diagnóstico personalizado, checklist documental y roadmap.

## Stack
- **Frontend**: React 18 + TypeScript + Vite, desplegado en Vercel
- **Backend**: Supabase (Postgres + Deno Edge Functions) gestionado por Lovable Cloud
- **Pagos**: Stripe vía Lovable connector gateway (`https://connector-gateway.lovable.dev/stripe`)
- **Email**: Resend vía Lovable connector gateway (`https://connector-gateway.lovable.dev/resend`)
- **Repo**: `https://github.com/danidiazp/wellcomy` (rama `main`)
- **Dominio prod**: `https://wellcomy.com`
- **Supabase project_id**: `tiujmzjzgfwoyyhdqemh`
- **Vercel project**: `prj_hAP4KYqqA2UvY5Ty9nhQGIBdV6ip`, team `team_jxQn3C7Nse69W9gs0jcdPMpU`

## Carpeta local
`C:\Users\dmdiaz\OneDrive - Indra\Escritorio\Hackathon\your-spain-path`
(nombre de carpeta pendiente de renombrar a `wellcomy`, no urgente)

## Regla: Lovable connector gateway
Las edge functions NUNCA llaman a APIs de terceros directamente con el secret real.
En su lugar usan el gateway de Lovable:
- Header `Authorization: Bearer ${LOVABLE_API_KEY}`
- Header `X-Connection-Api-Key: ${PROVIDER_API_KEY}` (ej. `RESEND_API_KEY`, `STRIPE_SANDBOX_API_KEY`)
- Base URL: `https://connector-gateway.lovable.dev/<provider>`
Ver `_shared/stripe.ts` (patrón de referencia) y `_shared/email.ts`.

## Git workflow
```
git add <archivos específicos>
git commit -m "mensaje"   # incluir Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
git fetch && git pull --rebase && git push
```

## Edge functions activas
| Función | Propósito | verify_jwt |
|---|---|---|
| `create-checkout` | Crea sesión Stripe Checkout con 7d trial | false |
| `get-stripe-price` | Resuelve precio por lookup_key | false |
| `payments-webhook` | Procesa eventos Stripe + envía emails transaccionales | false |
| `create-portal-session` | Portal de gestión de suscripción | false |
| `fx-rates` | Tipos de cambio para PPP | false |
| `send-welcome-email` | Email de bienvenida al hacer signup (trigger en profiles) | false |
| `dashboard-digest` | Resumen semanal vía pg_cron (lunes 09:00 UTC) | false |
| `auth-email-hook` | Emails de Auth (confirm, magic link, recovery…) vía Lovable Emails | false |

## Emails configurados
- **Dominio transaccional (Resend)**: `wellcomy.com` — verificado. From: `hola@wellcomy.com`
- **Dominio Auth (Lovable Emails)**: `notify.auth.wellcomy.com` — en verificación DNS
- Plantillas transaccionales: `_shared/email-templates.ts`
- Plantillas Auth: `_shared/auth-email-templates/` (TSX, gestionadas por Lovable)

## Emails implementados
| Trigger | Plantilla | Estado |
|---|---|---|
| Signup (profiles INSERT) | `welcomeEmail()` | ✅ edge fn desplegada |
| Trial started (checkout.session.completed) | `trialStartedEmail()` | ✅ en payments-webhook |
| Invoice paid | `paymentReceiptEmail()` | ✅ en payments-webhook |
| Invoice failed | `paymentFailedEmail()` | ✅ en payments-webhook |
| Subscription canceled | `subscriptionCanceledEmail()` | ✅ en payments-webhook |
| Dashboard digest (semanal) | `dashboardSummaryEmail()` | ✅ edge fn desplegada |
| Confirm signup / magic link / recovery / invite | Auth email hook | ✅ Lovable scaffold |

## Secrets configurados (Supabase edge functions)
- `RESEND_API_KEY` — Resend via Lovable gateway
- `LOVABLE_API_KEY` — gateway auth
- `AUTH_WEBHOOK_SECRET` — valida llamadas internas (trigger profiles → send-welcome-email, pg_cron → dashboard-digest)
- `STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY`
- `PAYMENTS_SANDBOX_WEBHOOK_SECRET` / `PAYMENTS_LIVE_WEBHOOK_SECRET`

## Pendientes conocidos
- [ ] `https://wellcomy.com/logo.png` devuelve 404 — las plantillas de Auth lo referencian; investigar si hay que forzar un redeploy o si es caché de CDN
- [ ] Probar smoke test de signup real para verificar email de bienvenida + confirmación
- [ ] Vercel project name sigue siendo "welcomy" (single-L) — no urgente, solo cosmético
- [ ] Imagen OG (`og-image.png`) es cuadrada 2000×2000; idealmente 1200×630 para previews de WhatsApp/Twitter

## Modelo de datos (tablas clave)
- `profiles` — perfil del usuario (id = auth.uid)
- `assessment_results` — diagnósticos (primary_route_id, preparedness_level)
- `user_tasks` — checklist personal (status: pending/done, due_date)
- `billing_profiles` — estado de suscripción, trial_start/end, stripe_customer_id
- `subscriptions` — suscripciones Stripe (status, cancel_at_period_end, environment)
- `migration_routes` — catálogo de rutas (name, slug, is_active)
- `referrals` — sistema referidos (referrer_id, referred_id, convert_referral())
