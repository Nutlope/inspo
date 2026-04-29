"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Dateline } from "@/components/dateline";

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/dashboard";

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (error) throw new Error(error.message ?? "Failed to send code");
      setStep("otp");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { error } = await authClient.signIn.emailOtp({ email, otp });
      if (error) throw new Error(error.message ?? "Invalid code");
      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-10 pt-16 pb-32 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Sign in" />
        </div>

        <div className="lg:col-span-7">
          <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl">
            Sign in <em className="italic">by post.</em>
          </h1>

          <p className="mt-6 max-w-[52ch] text-[var(--color-fg-muted)]">
            We&rsquo;ll send a six-digit code to your inbox. No password.
            {step === "email"
              ? " (Until SMTP is wired up, the code prints to the dev server log.)"
              : ""}
          </p>

          <div className="mt-12 max-w-[28rem]">
            {step === "email" ? (
              <form onSubmit={sendCode} className="space-y-5">
                <label className="block">
                  <span className="text-meta">Email</span>
                  <input
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="mt-2 block w-full border rule bg-transparent px-4 py-3 font-mono text-base outline-none focus:border-[var(--color-link)]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy || !email}
                  className="font-mono text-meta border rule bg-[var(--color-fg)] px-5 py-3 text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {busy ? "Sending…" : "Send code →"}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="space-y-5">
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Sent to <span className="text-[var(--color-fg)]">{email}</span>.
                  Check the dev server log if you don&rsquo;t see it.
                </p>
                <label className="block">
                  <span className="text-meta">6-digit code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    autoFocus
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="mt-2 block w-full border rule bg-transparent px-4 py-3 font-mono text-2xl tracking-widest outline-none focus:border-[var(--color-link)]"
                  />
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={busy || otp.length !== 6}
                    className="font-mono text-meta border rule bg-[var(--color-fg)] px-5 py-3 text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-40"
                  >
                    {busy ? "Verifying…" : "Verify →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setErr(null);
                    }}
                    className="text-meta hover:text-[var(--color-link)]"
                  >
                    Use a different email
                  </button>
                </div>
              </form>
            )}

            {err && (
              <p className="mt-5 border-l-2 border-[var(--color-link)] pl-3 text-sm text-[var(--color-link)]">
                {err}
              </p>
            )}

            <p className="text-meta mt-12">
              <Link href="/" className="hover:text-[var(--color-link)]">
                ← Back to the archive
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
