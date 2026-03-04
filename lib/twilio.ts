import "server-only";

import twilio from "twilio";

export type TwilioCredentials = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

type ConvexEnvReader = {
  get: (name: string) => string | undefined;
};

type SendWhatsAppParams = {
  to: string;
  message: string;
  credentials?: TwilioCredentials;
};

const WHATSAPP_PREFIX = "whatsapp:";

export function getTwilioCredentialsFromProcessEnv(
  env: NodeJS.ProcessEnv = process.env
): TwilioCredentials | null {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  return {
    accountSid,
    authToken,
    fromNumber,
  };
}

export function getTwilioCredentialsFromConvexEnv(
  env: ConvexEnvReader
): TwilioCredentials | null {
  const accountSid = env.get("TWILIO_ACCOUNT_SID");
  const authToken = env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = env.get("TWILIO_FROM_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  return {
    accountSid,
    authToken,
    fromNumber,
  };
}

export async function sendWhatsApp({
  to,
  message,
  credentials,
}: SendWhatsAppParams): Promise<boolean> {
  try {
    const resolvedCredentials =
      credentials ?? getTwilioCredentialsFromProcessEnv();

    if (!resolvedCredentials) {
      console.error(
        "Twilio credentials are missing. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER."
      );
      return false;
    }

    const client = twilio(
      resolvedCredentials.accountSid,
      resolvedCredentials.authToken
    );

    await client.messages.create({
      from: asWhatsAppNumber(resolvedCredentials.fromNumber),
      to: asWhatsAppNumber(to),
      body: message,
    });

    return true;
  } catch (error) {
    console.error("Failed to send WhatsApp message via Twilio", error);
    return false;
  }
}

function asWhatsAppNumber(value: string): string {
  if (value.startsWith(WHATSAPP_PREFIX)) {
    return value;
  }

  return `${WHATSAPP_PREFIX}${value}`;
}
