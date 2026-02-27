import Link from "next/link";
import {
  CalendarDays,
  Folder,
  Megaphone,
  Settings as SettingsIcon,
  User,
  Wrench,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const navItems = [
  { href: "/feed", label: "Announcements", icon: Megaphone },
  { href: "/files", label: "Files", icon: Folder },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: SettingsIcon, adminOnly: true },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  let isAdmin = false;

  if (session?.user?.id) {
    const membership = await prisma.userOrganization.findFirst({
      where: { userId: session.user.id },
    });
    isAdmin =
      membership?.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);
  }

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <div className="min-h-screen bg-sky-100/60">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-sky-100 bg-white/95 px-6 py-8 lg:flex">
          <div className="text-lg font-semibold text-slate-900">
            Levin's Bend
          </div>
          <nav className="mt-8 space-y-2 text-sm font-medium text-slate-700">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-sky-200/70 hover:text-slate-900"
              >
                <item.icon className="h-4 w-4 text-slate-500" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="border-b border-sky-200 bg-sky-100/80">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
              <div className="text-sm font-semibold text-slate-900">
                Levin's Bend Condominiums
              </div>
              <Link
                href="/"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
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
