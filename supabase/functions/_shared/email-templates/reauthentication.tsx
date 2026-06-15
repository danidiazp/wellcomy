/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación de Wellcomy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://wellcomy.com/logo.png" alt="Wellcomy" width="140" style={logo} />
        </Section>
        <Heading style={h1}>Confirma tu identidad</Heading>
        <Text style={text}>Usa este código para confirmar la operación:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          El código caduca en unos minutos. Si no solicitaste esta acción, puedes ignorar este mensaje.
        </Text>
        <Hr style={hr} />
        <Text style={brandFooter}>
          <Link href="https://wellcomy.com" style={brandLink}>wellcomy.com</Link> · Tu ruta a España
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const header = { marginBottom: '24px' }
const logo = { display: 'block' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0E2A3A', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#0E2A3A', lineHeight: '1.6', margin: '0 0 12px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#0E2A3A',
  letterSpacing: '4px',
  textAlign: 'center' as const,
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0 24px',
}
const footer = { fontSize: '13px', color: '#6b7280', margin: '24px 0 0' }
const hr = { borderColor: '#e5e7eb', margin: '32px 0 16px' }
const brandFooter = { fontSize: '12px', color: '#6b7280', textAlign: 'center' as const, margin: 0 }
const brandLink = { color: '#0E2A3A', textDecoration: 'none', fontWeight: 'bold' as const }
