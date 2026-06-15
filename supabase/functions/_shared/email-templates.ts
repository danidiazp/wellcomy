// Plantillas HTML para los emails transaccionales de Wellcomy.
// Se mantienen simples (tablas/inline styles) para máxima compatibilidad con clientes de correo.

const BRAND_COLOR = "#0E2A3A";
const SITE_URL = "https://wellcomy.com";

function layout(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta = ctaLabel && ctaUrl
    ? `<tr><td style="padding-top:24px;">
         <a href="${ctaUrl}" style="background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;display:inline-block;">${ctaLabel}</a>
       </td></tr>`
    : "";

  return `
  <div style="background:#f4f6f8;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr><td style="background:${BRAND_COLOR};padding:20px 28px;">
        <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.02em;">Wellcomy</span>
      </td></tr>
      <tr><td style="padding:28px;color:#1a1a1a;">
        <h1 style="font-size:18px;margin:0 0 16px;">${title}</h1>
        <div style="font-size:14px;line-height:1.6;color:#333333;">${bodyHtml}</div>
        <table role="presentation">${cta}</table>
      </td></tr>
      <tr><td style="padding:16px 28px;background:#f4f6f8;color:#8a94a0;font-size:11px;">
        Wellcomy · Orientación migratoria a España · <a href="${SITE_URL}" style="color:#8a94a0;">${SITE_URL.replace("https://", "")}</a>
      </td></tr>
    </table>
  </div>`;
}

export function trialStartedEmail(): { subject: string; html: string } {
  return {
    subject: "Tu prueba de 7 días en Wellcomy ha empezado",
    html: layout(
      "¡Bienvenido/a a Wellcomy! 🎉",
      `<p>Tu periodo de prueba gratuito de <strong>7 días</strong> ya está activo.</p>
       <p>Durante este tiempo tienes acceso completo a tu diagnóstico, checklist documental y roadmap personalizado.</p>
       <p>Si decides no continuar, puedes cancelar en cualquier momento desde tu panel antes de que termine la prueba y no se te realizará ningún cargo.</p>`,
      "Ir a mi panel",
      `${SITE_URL}/dashboard`,
    ),
  };
}

export function paymentReceiptEmail(amount: string, currency: string, periodEnd?: string): { subject: string; html: string } {
  const periodLine = periodEnd
    ? `<p>Tu próxima renovación será el <strong>${periodEnd}</strong>.</p>`
    : "";
  return {
    subject: "Recibo de pago — Wellcomy",
    html: layout(
      "Pago confirmado ✅",
      `<p>Hemos recibido correctamente tu pago de <strong>${amount} ${currency}</strong>.</p>
       ${periodLine}
       <p>Puedes consultar tus facturas y gestionar tu suscripción desde tu panel.</p>`,
      "Gestionar suscripción",
      `${SITE_URL}/dashboard`,
    ),
  };
}

export function paymentFailedEmail(): { subject: string; html: string } {
  return {
    subject: "Actualiza tu método de pago — Wellcomy",
    html: layout(
      "No hemos podido procesar tu pago",
      `<p>Hubo un problema al cobrar tu suscripción. Esto puede pasar por tarjeta caducada, fondos insuficientes o un bloqueo del banco.</p>
       <p>Actualiza tu método de pago para evitar que se interrumpa tu acceso a Wellcomy.</p>`,
      "Actualizar método de pago",
      `${SITE_URL}/dashboard`,
    ),
  };
}

export function subscriptionCanceledEmail(periodEnd?: string): { subject: string; html: string } {
  const accessLine = periodEnd
    ? `<p>Seguirás teniendo acceso hasta el <strong>${periodEnd}</strong>.</p>`
    : "";
  return {
    subject: "Tu suscripción a Wellcomy ha sido cancelada",
    html: layout(
      "Suscripción cancelada",
      `<p>Confirmamos que tu suscripción ha sido cancelada y no se realizarán más cargos.</p>
       ${accessLine}
       <p>Si fue un error o cambias de opinión, puedes reactivarla en cualquier momento desde tu panel.</p>`,
      "Volver a mi panel",
      `${SITE_URL}/dashboard`,
    ),
  };
}
