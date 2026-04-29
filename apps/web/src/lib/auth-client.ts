/**
 * Better Auth — browser client.
 * Used by /signin and /dashboard to call the server actions.
 */

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [emailOTPClient()],
});

export const { useSession, signIn, signOut } = authClient;
