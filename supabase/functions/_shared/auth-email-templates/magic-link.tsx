/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import { Button, Heading, Section, Text } from "npm:@react-email/components@0.0.22";
import { Layout, styles } from "./_layout.tsx";

interface Props {
  confirmationUrl: string;
}

export default function MagicLinkEmail({ confirmationUrl }: Props) {
  return (
    <Layout preview="Tu enlace de acceso a Wellcomy.">
      <Heading style={styles.h1}>Tu acceso a Wellcomy</Heading>
      <Text style={styles.text}>
        Pulsa el botón para iniciar sesión en tu cuenta. Este enlace es de un
        solo uso y caduca en breve por motivos de seguridad.
      </Text>
      <Section style={styles.buttonWrap}>
        <Button href={confirmationUrl} style={styles.button}>
          Entrar en Wellcomy
        </Button>
      </Section>
      <Text style={styles.muted}>
        Si el botón no funciona, copia y pega este enlace:
        <br />
        <a href={confirmationUrl} style={styles.link}>{confirmationUrl}</a>
      </Text>
      <Text style={styles.muted}>
        Si no solicitaste este enlace, puedes ignorar este email sin riesgo.
      </Text>
    </Layout>
  );
}

export const subject = "Tu enlace de acceso a Wellcomy";
