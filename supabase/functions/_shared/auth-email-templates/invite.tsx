/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import { Button, Heading, Section, Text } from "npm:@react-email/components@0.0.22";
import { Layout, styles } from "./_layout.tsx";

interface Props {
  confirmationUrl: string;
}

export default function InviteEmail({ confirmationUrl }: Props) {
  return (
    <Layout preview="Te han invitado a Wellcomy.">
      <Heading style={styles.h1}>Te damos la bienvenida a Wellcomy</Heading>
      <Text style={styles.text}>
        Has sido invitado/a a unirte a Wellcomy, la plataforma que te
        acompaña paso a paso en tu camino para vivir en España.
      </Text>
      <Section style={styles.buttonWrap}>
        <Button href={confirmationUrl} style={styles.button}>
          Aceptar invitación
        </Button>
      </Section>
      <Text style={styles.muted}>
        Si el botón no funciona, copia y pega este enlace:
        <br />
        <a href={confirmationUrl} style={styles.link}>{confirmationUrl}</a>
      </Text>
    </Layout>
  );
}

export const subject = "Te han invitado a Wellcomy";
