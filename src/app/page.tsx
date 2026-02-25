import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-sky-100/60 text-slate-900">
      <header className="border-b border-sky-200 bg-white/90">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold text-slate-900">
            Levin's Bend Intranet
          </div>
          <div className="text-sm font-medium text-slate-600">
            Residents portal
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              A convenient, centralized hub for Levin's Bend residents.
            </h1>
            <p className="text-lg leading-7 text-slate-600">
              Share announcements, access documents, track maintenance requests,
              and stay connected with your community in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-sky-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-800"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img
                src="/images/levins-bend-marina.png"
                alt="Levin's Bend marina at sunset"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="px-6 py-5">
              <h2 className="text-base font-semibold text-slate-900">
                Life on the Intracoastal
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Your resident portal keeps the community updated and connected
                from the marina to the top floor.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
