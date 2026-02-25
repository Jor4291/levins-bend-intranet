"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/feed";
  }

  return (
    <div className="min-h-screen bg-sky-100/60 px-6 py-16">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-sky-100 bg-white/95 shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
          <div
            className="hidden min-h-[420px] flex-col justify-end bg-slate-200/80 lg:flex"
            style={{
              backgroundImage: "url('/images/levins-bend-marina.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="bg-slate-900/40 px-8 py-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/90">
                Levin&apos;s Bend Condominiums
              </p>
              <p className="mt-2 text-lg font-semibold">
                Waterfront living, shared in community.
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700/80">
                Levin&apos;s Bend Condominiums
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Sign in to the residents portal.
              </p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-xs text-slate-600">
              <p className="font-medium text-slate-700">Need access?</p>
              <p className="mt-1">
                Contact the Levin&apos;s Bend office to receive an invitation or
                reset your password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
