// lib/auth.ts
import { getSession, GetSessionParams } from "next-auth/react";

export async function serverProps(
  context: GetSessionParams | undefined,
  destination: string
) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  return {
    session,
  };
}

export async function authAccessToLoginPage(
  context: GetSessionParams | undefined,
  destination: string
) {
  const session = await getSession(context);

  if (session) {
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  return { session };
}
