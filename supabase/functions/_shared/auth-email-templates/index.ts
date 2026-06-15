/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import { render } from "npm:@react-email/render@0.0.17";

import SignupEmail, { subject as signupSubject } from "./signup.tsx";
import MagicLinkEmail, { subject as magicLinkSubject } from "./magic-link.tsx";
import RecoveryEmail, { subject as recoverySubject } from "./recovery.tsx";
import InviteEmail, { subject as inviteSubject } from "./invite.tsx";
import EmailChangeEmail, { subject as emailChangeSubject } from "./email-change.tsx";
import ReauthenticationEmail, { subject as reauthSubject } from "./reauthentication.tsx";

// email_action_type values emitidos por Supabase Auth Send Email Hook
export type AuthEmailActionType =
  | "signup"
  | "magiclink"
  | "recovery"
  | "invite"
  | "email_change"
  | "email_change_current"
  | "email_change_new"
  | "reauthentication";

export interface RenderArgs {
  actionType: AuthEmailActionType;
  confirmationUrl: string;
  token?: string;
  email?: string;
  newEmail?: string;
}

export interface RenderedAuthEmail {
  subject: string;
  html: string;
}

export function renderAuthEmail(args: RenderArgs): RenderedAuthEmail {
  const { actionType, confirmationUrl, token, email, newEmail } = args;

  switch (actionType) {
    case "signup":
      return {
        subject: signupSubject,
        html: render(React.createElement(SignupEmail, { confirmationUrl })),
      };
    case "magiclink":
      return {
        subject: magicLinkSubject,
        html: render(React.createElement(MagicLinkEmail, { confirmationUrl })),
      };
    case "recovery":
      return {
        subject: recoverySubject,
        html: render(React.createElement(RecoveryEmail, { confirmationUrl })),
      };
    case "invite":
      return {
        subject: inviteSubject,
        html: render(React.createElement(InviteEmail, { confirmationUrl })),
      };
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return {
        subject: emailChangeSubject,
        html: render(
          React.createElement(EmailChangeEmail, { confirmationUrl, email, newEmail }),
        ),
      };
    case "reauthentication":
      return {
        subject: reauthSubject,
        html: render(
          React.createElement(ReauthenticationEmail, { token: token ?? "------" }),
        ),
      };
    default: {
      // fallback genérico tipo magic link para acciones futuras
      return {
        subject: magicLinkSubject,
        html: render(React.createElement(MagicLinkEmail, { confirmationUrl })),
      };
    }
  }
}
