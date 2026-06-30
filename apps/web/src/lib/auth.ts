/**
 * Better Auth - server instance.
 *
 * - Drizzle adapter pointed at our Postgres schema (in @inspo/db).
 * - Email-OTP plugin: 6-digit code, 10-minute TTL.
 * - In dev, we log the OTP to the server console (no SMTP needed).
 *   In prod, replace `sendOTP` with a real provider (Resend/Postmark).
 *
 * If DATABASE_URL is unset we still construct an instance but on a
 * memory adapter - auth will work for a single dev session only.
 * That keeps the gallery booting friction-free without Neon.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { hasDatabase, getDb, schema } from "@inspo/db";

// Fail closed in production: never sign sessions with the public dev
// fallback secret, and never run on a localhost base URL (which breaks
// auth redirects). In dev these fall back so the gallery boots without
// any setup.
const IS_PROD = process.env.NODE_ENV === "production";
// `next build` evaluates this module (to collect /api/auth route data)
// with NODE_ENV=production but without the runtime secrets - don't fail
// the build for that. The guard fires at runtime / server start instead.
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";
if (IS_PROD && !IS_BUILD && !process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET is required in production - refusing to sign sessions with the public dev fallback.",
  );
}
if (IS_PROD && !IS_BUILD && !process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is required in production.");
}

export const auth = betterAuth({
  appName: "Inspo",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "dev-secret-please-set-BETTER_AUTH_SECRET-in-prod",
  ...(hasDatabase()
    ? {
        database: drizzleAdapter(getDb(), {
          provider: "pg",
          schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
          },
        }),
      }
    : {}),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
        input: false, // never settable by the user via signup
      },
    },
  },
  emailAndPassword: { enabled: false },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 min
      async sendVerificationOTP({ email, otp, type }) {
        // Dev: log to console. Prod: swap in Resend/Postmark/etc.
        // eslint-disable-next-line no-console
        console.log(
          `\n  📧 [Inspo auth] OTP for ${email} (${type}): ${otp}\n`,
        );
      },
    }),
  ],
});
