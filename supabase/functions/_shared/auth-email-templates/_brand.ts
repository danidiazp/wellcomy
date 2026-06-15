// Tokens de marca Wellcomy compartidos por todas las plantillas de Auth.
// Mantener aislado de _shared/email-templates.ts (transaccionales Stripe/dashboard).

export const BRAND = {
  name: "Wellcomy",
  siteUrl: "https://wellcomy.com",
  logoUrl: "https://wellcomy.com/logo.png",
  supportEmail: "hola@wellcomy.com",
  primary: "#0E2A3A",
  primaryForeground: "#FFFFFF",
  background: "#FFFFFF",
  foreground: "#0E2A3A",
  muted: "#5B6B75",
  border: "#E5E9EC",
  radius: "10px",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;
