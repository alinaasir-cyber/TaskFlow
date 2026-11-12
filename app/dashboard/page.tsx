import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut, auth } from "@/auth";
import { TaskBoard } from "./task-board";

async function DashboardContent() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const displayName = session.user.name ?? session.user.email ?? "there";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8">
      <header className="flex items-center justify-between border-b border-slate-200 pb-6">
        <Link className="inline-flex items-center gap-2 font-semibold tracking-tight" href="/dashboard">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white">
            T
          </span>
          <span className="text-xl">TaskFlow</span>
        </Link>
        <form action={handleSignOut}>
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="py-10 sm:py-14">
        <div className="mb-9">
          <p className="text-sm font-semibold text-indigo-600">YOUR WORKSPACE</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Welcome, {displayName}.
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-500">
            Make space for what matters. One task at a time.
          </p>
        </div>
        <TaskBoard />
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <main
      aria-label="Loading dashboard"
      className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8"
    >
      <header className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
      </header>
      <section className="py-10 sm:py-14">
        <div className="mb-9 space-y-3">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-72 max-w-full animate-pulse rounded-lg bg-slate-200" />
          <div className="h-5 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="mt-8 h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-5 space-y-3">
          <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </section>
    </main>
  );
}
