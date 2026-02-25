import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MaintenanceRequestForm from "./MaintenanceRequestForm";

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

  const requests = await prisma.maintenanceRequest.findMany({
    where: {
      organizationId: membership.organizationId,
      ...(membership.role === "ORG_ADMIN" || session.user.isSystemAdmin
        ? {}
        : { submittedById: session.user.id }),
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
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {request.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Submitted by {request.submittedBy.firstName}{" "}
                    {request.submittedBy.lastName} · {formatDate(request.createdAt)}
                  </p>
                  {request.unit ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Unit {request.unit}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {statusLabels[request.status] ?? request.status}
                  </span>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                    {priorityLabels[request.priority] ?? request.priority}
                  </span>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm text-slate-700">
                {request.description}
              </p>
              {request.photoUrl ? (
                <div className="mt-4">
                  <a
                    href={request.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    View photo
                  </a>
                  <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                    <img
                      src={request.photoUrl}
                      alt={request.photoFileName || "Maintenance request photo"}
                      className="h-48 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
