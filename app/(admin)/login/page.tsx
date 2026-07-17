"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage("Credenziali non valide");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(211,17,43,0.16),transparent_55%)]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/logo/devology-logo-full.svg"
            alt="Devology System"
            width={200}
            height={125}
            priority
            className="mx-auto h-14 w-auto"
          />
          <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-brand-text">
            Accesso Admin
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            Accedi con le tue credenziali per gestire le richieste.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-brand-lg border border-brand-border bg-brand-elevated p-6 shadow-brand-md"
        >
          {errorMessage && (
            <div className="rounded-md border border-brand-accent/40 bg-brand-accent/10 p-3 text-sm text-brand-accent-light">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-soft">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-brand-border-strong bg-brand-surface px-3 py-2 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-brand-soft">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-brand-border-strong bg-brand-surface px-3 py-2 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2.5 text-sm font-semibold text-white shadow-brand-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>
      </div>
    </main>
  );
}
