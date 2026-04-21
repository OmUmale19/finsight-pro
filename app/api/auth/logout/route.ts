import { fail, ok } from "@/lib/api";
import { clearAuthCookie } from "@/lib/session";

export async function POST() {
  try {
    await clearAuthCookie();
    return ok({ loggedOut: true });
  } catch (error) {
    return fail("Unable to logout", 500, error instanceof Error ? error.message : error);
  }
}
