"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RequestItem = {
  id: string;
  title: string;
  description: string;
  unit: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  createdAt: string;
  submittedByName: string;
  photoUrl: string | null;
  photoFileName: string | null;
};

type MaintenanceRequestsListProps = {
  canManage: boolean;
  requests: RequestItem[];
  statusLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
};

const statusOptions: Array<RequestItem["status"]> = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export default function MaintenanceRequestsList({
  canManage,
  requests,
  statusLabels,
  priorityLabels,
  formatDate,
}: MaintenanceRequestsListProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const visibleRequests = useMemo(() => {
    return requests.filter((request) => {
      const statusMatch =
        statusFilter === "ALL" || request.status === statusFilter;
      const priorityMatch =
        priorityFilter === "ALL" || request.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  }, [requests, statusFilter, priorityFilter]);

  async function handleStatusChange(requestId: string, status: RequestItem["status"]) {
    setIsSaving(requestId);
    setError(null);

    const response = await fetch(`/api/maintenance-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to update status.");
      setIsSaving(null);
      return;
    }

    setIsSaving(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Maintenance requests
          </h2>
          <p className="text-xs text-slate-500">
            Filter by status or priority.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {statusLabels[option] ?? option}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All priorities</option>
            <option value="LOW">{priorityLabels.LOW}</option>
            <option value="NORMAL">{priorityLabels.NORMAL}</option>
            <option value="HIGH">{priorityLabels.HIGH}</option>
            <option value="URGENT">{priorityLabels.URGENT}</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      {visibleRequests.map((request) => (
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
                Submitted by {request.submittedByName} ·{" "}
                {request.createdAt}
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
              {canManage ? (
                <select
                  value={request.status}
                  onChange={(event) =>
                    handleStatusChange(request.id, event.target.value as RequestItem["status"])
                  }
                  disabled={isSaving === request.id}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      Mark {statusLabels[option]}
                    </option>
                  ))}
                </select>
              ) : null}
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
  );
}
