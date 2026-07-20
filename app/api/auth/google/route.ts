import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { OAUTH_STATE_COOKIE } from "@/lib/constants";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (!clientId || clientId === "your-google-client-id") {
    return NextResponse.redirect(new URL("/login?error=Google OAuth is not configured", appUrl));
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600
  });

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const options = {
    redirect_uri: `${appUrl}/api/auth/callback/google`,
    client_id: clientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    state,
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);

  return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
