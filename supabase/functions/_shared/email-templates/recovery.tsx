/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Restablece tu contraseña de Wellcomy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://wellcomy.com/logo.png" alt="Wellcomy" width="140" style={logo} />
        </Section>
        <Heading style={h1}>Restablece tu contraseña</Heading>
        <Text style={text}>
          Hemos recibido una solicitud para restablecer tu contraseña en <strong>Wellcomy</strong>. Haz clic en el botón para elegir una nueva.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={button} href={confirmationUrl}>
            Cambiar contraseña
          </Button>
        </Section>
        <Text style={footer}>
          Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contraseña actual seguirá funcionando.
        </Text>
        <Hr style={hr} />
        <Text style={brandFooter}>
          <Link href="https://wellcomy.com" style={brandLink}>wellcomy.com</Link> · Tu ruta a España
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const header = { marginBottom: '24px' }
const logo = { display: 'block' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0E2A3A', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#0E2A3A', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#0E2A3A',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#6b7280', margin: '24px 0 0' }
const hr = { borderColor: '#e5e7eb', margin: '32px 0 16px' }
const brandFooter = { fontSize: '12px', color: '#6b7280', textAlign: 'center' as const, margin: 0 }
const brandLink = { color: '#0E2A3A', textDecoration: 'none', fontWeight: 'bold' as const }
