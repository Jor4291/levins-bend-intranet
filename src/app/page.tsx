import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">Levin's Bend Intranet</div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:border-slate-400"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            >
              Request access
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              A calm, centralized home for Levin's Bend residents.
            </h1>
            <p className="text-lg leading-7 text-slate-600">
              Share announcements, access documents, track maintenance requests,
              and stay connected with your community in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400"
              >
                Create account
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Launch checklist
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Secure login and resident access</li>
              <li>Announcements with mailto replies</li>
              <li>PDF file library and calendar events</li>
              <li>Maintenance request tracking</li>
            </ul>
            <p className="mt-6 text-xs text-slate-500">
              See the full requirements in{" "}
              <span className="font-medium">levins-bend-intranet-spec.md</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
