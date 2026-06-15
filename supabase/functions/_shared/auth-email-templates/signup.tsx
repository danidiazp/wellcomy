/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import { Button, Heading, Section, Text } from "npm:@react-email/components@0.0.22";
import { Layout, styles } from "./_layout.tsx";

interface Props {
  confirmationUrl: string;
}

export default function SignupEmail({ confirmationUrl }: Props) {
  return (
    <Layout preview="Confirma tu cuenta de Wellcomy para empezar tu ruta a España.">
      <Heading style={styles.h1}>Bienvenido/a a Wellcomy 👋</Heading>
      <Text style={styles.text}>
        Gracias por crear tu cuenta. Solo nos falta un paso: confirma tu email
        para activar tu acceso y empezar a preparar tu ruta a España.
      </Text>
      <Section style={styles.buttonWrap}>
        <Button href={confirmationUrl} style={styles.button}>
          Confirmar mi email
        </Button>
      </Section>
      <Text style={styles.muted}>
        Si el botón no funciona, copia y pega este enlace en tu navegador:
        <br />
        <a href={confirmationUrl} style={styles.link}>{confirmationUrl}</a>
      </Text>
      <Text style={styles.muted}>
        Si tú no creaste esta cuenta, puedes ignorar este mensaje.
      </Text>
    </Layout>
  );
}

export const subject = "Confirma tu cuenta de Wellcomy";
