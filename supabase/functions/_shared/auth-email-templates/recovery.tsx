/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import { Button, Heading, Section, Text } from "npm:@react-email/components@0.0.22";
import { Layout, styles } from "./_layout.tsx";

interface Props {
  confirmationUrl: string;
}

export default function RecoveryEmail({ confirmationUrl }: Props) {
  return (
    <Layout preview="Restablece tu contraseña de Wellcomy.">
      <Heading style={styles.h1}>Restablece tu contraseña</Heading>
      <Text style={styles.text}>
        Recibimos una solicitud para restablecer la contraseña de tu cuenta
        de Wellcomy. Pulsa el botón para crear una nueva.
      </Text>
      <Section style={styles.buttonWrap}>
        <Button href={confirmationUrl} style={styles.button}>
          Crear nueva contraseña
        </Button>
      </Section>
      <Text style={styles.muted}>
        Si el botón no funciona, copia y pega este enlace:
        <br />
        <a href={confirmationUrl} style={styles.link}>{confirmationUrl}</a>
      </Text>
      <Text style={styles.muted}>
        Si tú no solicitaste este cambio, ignora este email — tu contraseña
        actual seguirá siendo válida.
      </Text>
    </Layout>
  );
}

export const subject = "Restablece tu contraseña de Wellcomy";
