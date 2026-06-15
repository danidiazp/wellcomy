// Cliente Resend que enruta todas las llamadas a través del connector gateway de Lovable.
// NO usar la API key de Resend directamente: el valor disponible es un identificador
// del gateway, no la API key real de Resend.
const GATEWAY_RESEND_BASE = "https://connector-gateway.lovable.dev/resend";

const FROM_ADDRESS = "Wellcomy <hola@wellcomy.com>";

export function getResendConnectionApiKey(): string | null {
  return Deno.env.get("RESEND_API_KEY") ?? null;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

// Envío "best effort": nunca lanza, para no romper el procesamiento del webhook
// de Stripe si Resend falla o las credenciales no están configuradas todavía.
export async function sendTransactionalEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const connectionApiKey = getResendConnectionApiKey();
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!connectionApiKey || !lovableApiKey) {
    console.warn("Email no enviado (faltan credenciales Resend/Lovable):", subject, "->", to);
    return;
  }

  try {
    const res = await fetch(`${GATEWAY_RESEND_BASE}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Connection-Api-Key": connectionApiKey,
        "Lovable-API-Key": lovableApiKey,
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
    });

    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
    }
  } catch (error) {
    console.error("Error enviando email transaccional", error);
  }
}
