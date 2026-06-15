/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import { Button, Heading, Section, Text } from "npm:@react-email/components@0.0.22";
import { Layout, styles } from "./_layout.tsx";

interface Props {
  confirmationUrl: string;
  email?: string;
  newEmail?: string;
}

export default function EmailChangeEmail({ confirmationUrl, email, newEmail }: Props) {
  return (
    <Layout preview="Confirma el cambio de email en tu cuenta de Wellcomy.">
      <Heading style={styles.h1}>Confirma tu nuevo email</Heading>
      <Text style={styles.text}>
        Has solicitado cambiar el email asociado a tu cuenta de Wellcomy
        {email ? <> de <strong>{email}</strong></> : null}
        {newEmail ? <> a <strong>{newEmail}</strong></> : null}.
        Confirma el cambio pulsando el botón.
      </Text>
      <Section style={styles.buttonWrap}>
        <Button href={confirmationUrl} style={styles.button}>
          Confirmar cambio de email
        </Button>
      </Section>
      <Text style={styles.muted}>
        Si el botón no funciona, copia y pega este enlace:
        <br />
        <a href={confirmationUrl} style={styles.link}>{confirmationUrl}</a>
      </Text>
      <Text style={styles.muted}>
        Si tú no solicitaste este cambio, ignora este mensaje y considera
        cambiar tu contraseña.
      </Text>
    </Layout>
  );
}

export const subject = "Confirma tu nuevo email en Wellcomy";
