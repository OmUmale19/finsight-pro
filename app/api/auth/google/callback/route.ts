import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signAuthToken, setAuthCookie } from "@/lib/session";
import { OAUTH_STATE_COOKIE } from "@/lib/constants";

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserResult {
  email?: string;
  name?: string;
  picture?: string;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const appUrl = process.env.APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Google auth failed (missing authorization code)", appUrl));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  // Clear state cookie regardless of outcome
  cookieStore.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  if (!state || !savedState || state !== savedState) {
    console.error("OAuth CSRF state mismatch:", { state, savedState });
    return NextResponse.redirect(new URL("/login?error=Invalid OAuth state", appUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === "your-google-client-id") {
    console.error("Google OAuth credentials missing or unconfigured");
    return NextResponse.redirect(new URL("/login?error=Google OAuth is unconfigured", appUrl));
  }

  try {
    // 1. Exchange OAuth code for Google Access & ID token
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl}/api/auth/callback/google`,
      grant_type: "authorization_code",
    };

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(values),
    });

    if (!tokenRes.ok) {
      const errorPayload = await tokenRes.text();
      console.error("Google token exchange failed:", errorPayload);
      return NextResponse.redirect(new URL("/login?error=Token exchange failed", appUrl));
    }

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenData.access_token) {
      console.error("No access_token returned in Google token response:", tokenData);
      return NextResponse.redirect(new URL("/login?error=Missing access token", appUrl));
    }

    // 2. Retrieve user profile details using the access token
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      const errorPayload = await userRes.text();
      console.error("Google userinfo request failed:", errorPayload);
      return NextResponse.redirect(new URL("/login?error=Failed to retrieve user profile", appUrl));
    }

    const googleUser = (await userRes.json()) as GoogleUserResult;
    if (!googleUser.email) {
      console.error("User email missing from Google userinfo response:", googleUser);
      return NextResponse.redirect(new URL("/login?error=Google profile email missing", appUrl));
    }

    const email = googleUser.email.toLowerCase();

    // 3. Find existing user or register new one
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: googleUser.name || email.split("@")[0],
          avatarUrl: googleUser.picture,
        },
      });
    } else if (!user.avatarUrl && googleUser.picture) {
      // Update avatar if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: googleUser.picture },
      });
    }

    // 4. Create and store JWT session cookie
    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    await setAuthCookie(token);

    // 5. Redirect user back into the application
    return NextResponse.redirect(new URL("/dashboard", appUrl));
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=Authentication error", appUrl));
  }
}
