import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MaintenanceRequestForm from "./MaintenanceRequestForm";
import MaintenanceRequestsList from "./MaintenanceRequestsList";

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const priorityLabels: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function MaintenancePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">
            Maintenance
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Report issues for Levin's Bend.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Please sign in to view maintenance requests.
          </p>
        </div>
      </section>
    );
  }

  const membership = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!membership) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">
            Maintenance
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Report issues for Levin's Bend.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Your account is not linked to Levin's Bend yet.
          </p>
        </div>
      </section>
    );
  }

  const isAdmin =
    membership.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);

  const requests = await prisma.maintenanceRequest.findMany({
    where: {
      organizationId: membership.organizationId,
      ...(isAdmin ? {} : { submittedById: session.user.id }),
    },
    include: { submittedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Maintenance</h1>
          <p className="mt-1 text-sm text-slate-600">
            Report issues for Levin's Bend.
          </p>
        </div>
      </header>

      <MaintenanceRequestForm organizationId={membership.organizationId} />

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            No maintenance requests yet.
          </p>
        </div>
      ) : (
        <MaintenanceRequestsList
          canManage={isAdmin}
          statusLabels={statusLabels}
          priorityLabels={priorityLabels}
          requests={requests.map((request) => ({
            id: request.id,
            title: request.title,
            description: request.description,
            unit: request.unit,
            status: request.status,
            priority: request.priority,
            createdAt: formatDate(request.createdAt),
            submittedByName: `${request.submittedBy.firstName} ${request.submittedBy.lastName}`,
            photoUrl: request.photoUrl,
            photoFileName: request.photoFileName,
          }))}
        />
      )}
    </section>
  );
}
