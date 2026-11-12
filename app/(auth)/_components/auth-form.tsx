"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "register";
};

function getErrorMessage(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return undefined;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      if (isRegister) {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(formData.get("name") ?? ""),
            email,
            password,
          }),
        });

        if (!response.ok) {
          const message = getErrorMessage(await response.json());
          setError(message ?? "Unable to create your account.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          isRegister
            ? "Your account was created, but sign-in failed. Please sign in."
            : "Email or password is incorrect.",
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't reach TaskFlow. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_-32px_rgba(47,54,94,0.28)] backdrop-blur sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white">
            T
          </span>
          <span className="text-xl">TaskFlow</span>
        </Link>

        <div className="mt-9">
          <p className="text-sm font-semibold text-indigo-600">
            {isRegister ? "YOUR NEXT CHAPTER STARTS HERE" : "WELCOME BACK"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {isRegister ? "Create your account" : "Sign in to TaskFlow"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isRegister
              ? "A calmer way to organize everything on your plate."
              : "Pick up where you left off and keep your day moving."}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {isRegister && (
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                id="name"
                maxLength={80}
                name="name"
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              id="email"
              maxLength={254}
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              id="password"
              maxLength={72}
              minLength={isRegister ? 12 : 1}
              name="password"
              placeholder={isRegister ? "At least 12 characters" : "Your password"}
              required
              type="password"
            />
          </div>

          {error && (
            <p aria-live="polite" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          {isRegister ? "Already have an account?" : "New to TaskFlow?"}{" "}
          <Link
            className="font-semibold text-indigo-600 hover:text-indigo-700"
            href={isRegister ? "/login" : "/register"}
          >
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
