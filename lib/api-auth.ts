import "server-only";

import { auth } from "@/auth";

export async function getAuthenticatedUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}
