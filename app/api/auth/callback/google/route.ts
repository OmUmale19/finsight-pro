import { NextRequest } from "next/server";
import { GET as handleGoogleCallback } from "@/app/api/auth/google/callback/route";

export async function GET(req: NextRequest) {
  return handleGoogleCallback(req);
}
