/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";
import { BRAND } from "./_brand.ts";

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Link href={BRAND.siteUrl} style={{ textDecoration: "none" }}>
              <Img
                src={BRAND.logoUrl}
                alt={BRAND.name}
                height="32"
                style={{ display: "block", border: 0, outline: "none" }}
              />
            </Link>
          </Section>

          <Section style={card}>{children}</Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {BRAND.name}. Tu camino para vivir en
              España.
            </Text>
            <Text style={footerText}>
              ¿Dudas? Escríbenos a{" "}
              <Link href={`mailto:${BRAND.supportEmail}`} style={footerLink}>
                {BRAND.supportEmail}
              </Link>{" "}
              · <Link href={BRAND.siteUrl} style={footerLink}>wellcomy.com</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  fontFamily: BRAND.fontFamily,
  margin: 0,
  padding: 0,
  color: BRAND.foreground,
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "32px 20px",
};

const header: React.CSSProperties = {
  padding: "8px 0 24px",
};

const card: React.CSSProperties = {
  padding: "8px 0",
};

const hr: React.CSSProperties = {
  border: "none",
  borderTop: `1px solid ${BRAND.border}`,
  margin: "32px 0 20px",
};

const footer: React.CSSProperties = {
  padding: "0",
};

const footerText: React.CSSProperties = {
  color: BRAND.muted,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "4px 0",
};

const footerLink: React.CSSProperties = {
  color: BRAND.muted,
  textDecoration: "underline",
};

// Estilos compartidos para que las plantillas tengan look consistente.
export const styles = {
  h1: {
    color: BRAND.foreground,
    fontSize: "24px",
    lineHeight: "32px",
    fontWeight: 700,
    margin: "0 0 16px",
  } as React.CSSProperties,
  text: {
    color: BRAND.foreground,
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 16px",
  } as React.CSSProperties,
  muted: {
    color: BRAND.muted,
    fontSize: "14px",
    lineHeight: "22px",
    margin: "12px 0 0",
  } as React.CSSProperties,
  button: {
    backgroundColor: BRAND.primary,
    color: BRAND.primaryForeground,
    borderRadius: BRAND.radius,
    fontSize: "16px",
    fontWeight: 600,
    padding: "14px 28px",
    textDecoration: "none",
    display: "inline-block",
  } as React.CSSProperties,
  buttonWrap: {
    margin: "24px 0",
  } as React.CSSProperties,
  code: {
    display: "inline-block",
    padding: "12px 18px",
    backgroundColor: "#F4F6F7",
    border: `1px solid ${BRAND.border}`,
    borderRadius: "8px",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
    fontSize: "20px",
    letterSpacing: "4px",
    fontWeight: 700,
    color: BRAND.foreground,
  } as React.CSSProperties,
  link: {
    color: BRAND.primary,
    textDecoration: "underline",
    wordBreak: "break-all" as const,
  } as React.CSSProperties,
};
