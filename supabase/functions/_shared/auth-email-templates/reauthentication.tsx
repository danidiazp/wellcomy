/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import { Heading, Section, Text } from "npm:@react-email/components@0.0.22";
import { Layout, styles } from "./_layout.tsx";

interface Props {
  token: string;
}

export default function ReauthenticationEmail({ token }: Props) {
  return (
    <Layout preview="Tu código de verificación de Wellcomy.">
      <Heading style={styles.h1}>Verifica que eres tú</Heading>
      <Text style={styles.text}>
        Para completar la acción que has solicitado, introduce el siguiente
        código de verificación en Wellcomy:
      </Text>
      <Section style={styles.buttonWrap}>
        <span style={styles.code}>{token}</span>
      </Section>
      <Text style={styles.muted}>
        El código caduca en unos minutos. Si tú no solicitaste esta
        verificación, te recomendamos cambiar tu contraseña.
      </Text>
    </Layout>
  );
}

export const subject = "Tu código de verificación de Wellcomy";
