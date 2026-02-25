import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserManagement from "./UserManagement";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Admin tools for Levin's Bend Condominiums.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Please sign in to view settings.
          </p>
        </div>
      </section>
    );
  }

  const membership = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id },
  });

  const isAdmin =
    membership?.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);

  if (!membership || !isAdmin) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Admin tools for Levin's Bend Condominiums.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            You do not have access to admin settings.
          </p>
        </div>
      </section>
    );
  }

  const members = await prisma.userOrganization.findMany({
    where: { organizationId: membership.organizationId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
            Admin tools for Levin's Bend Condominiums.
        </p>
      </header>

      <UserManagement
        organizationId={membership.organizationId}
        members={members.map((member) => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt.toISOString(),
          user: {
            id: member.user.id,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            email: member.user.email,
            avatarUrl: member.user.avatarUrl,
          },
        }))}
      />
    </section>
  );
}
