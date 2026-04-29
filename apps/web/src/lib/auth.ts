/**
 * Better Auth — server instance.
 *
 * - Drizzle adapter pointed at our Postgres schema (in @inspo/db).
 * - Email-OTP plugin: 6-digit code, 10-minute TTL.
 * - In dev, we log the OTP to the server console (no SMTP needed).
 *   In prod, replace `sendOTP` with a real provider (Resend/Postmark).
 *
 * If DATABASE_URL is unset we still construct an instance but on a
 * memory adapter — auth will work for a single dev session only.
 * That keeps the gallery booting friction-free without Neon.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { hasDatabase, getDb, schema } from "@inspo/db";

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
