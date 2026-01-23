import Link from "next/link";

const navItems = [
  { href: "/feed", label: "Announcements" },
  { href: "/files", label: "Files" },
  { href: "/calendar", label: "Calendar" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/profile", label: "Profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-6 py-8 lg:flex">
          <div className="text-lg font-semibold text-slate-900">
            Levin's Bend
          </div>
          <nav className="mt-8 space-y-2 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
              <div className="text-sm font-medium text-slate-600">
                Organization: Levin's Bend Condominiums
              </div>
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Sign out
              </Link>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl px-6 py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
